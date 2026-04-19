import fs from "fs";
import { fetchWithRetry } from "./lib/fetch.lib.js";

const GPIO_PIN = 12;
const GPIO_PATH = `/sys/class/gpio/gpio${GPIO_PIN}`;
const CONTROL_PIN = 11;
const CONTROL_PATH = `/sys/class/gpio/gpio${CONTROL_PIN}`;
const COUNTDOWN = 30_000;

let deviceId: string | null = null;
let userId: string | null = null;
let pollTimer: NodeJS.Immediate | null = null;
let pulseTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;
let lastValue = 0;
let totalCoins = 0;
let lastPulseTime = 0;

if (!fs.existsSync(GPIO_PATH)) {
  fs.writeFileSync("/sys/class/gpio/export", `${GPIO_PIN}`);
  fs.writeFileSync(`${GPIO_PATH}/direction`, "in");
}

if (!fs.existsSync(CONTROL_PATH)) {
  fs.writeFileSync("/sys/class/gpio/export", `${CONTROL_PIN}`);
  fs.writeFileSync(`${CONTROL_PATH}/direction`, "out");
}

export const startCoinSession = (id: string, type: "device" | "user") => {
  enableCoinSlot();

  if (type === "device") {
    deviceId = id;
  }
  if (type === "user") {
    userId = id;
  }

  lastValue = Number(fs.readFileSync(`${GPIO_PATH}/value`, "utf8").trim());
  totalCoins = 0;
  lastPulseTime = Date.now();

  const poll = () => {
    const value = Number(fs.readFileSync(`${GPIO_PATH}/value`, "utf8").trim());

    if (value === 1 && lastValue === 0) {
      const now = Date.now();

      if (now - lastPulseTime >= 10) {
        lastPulseTime = now;

        totalCoins += 1;
        console.log("Coin inserted! Running total:", totalCoins);
      }

      if (countdownTimer) clearTimeout(countdownTimer);
      countdownTimer = setTimeout(stopCoinSession, COUNTDOWN);
    }

    lastValue = value;

    pollTimer = setImmediate(poll);
  };

  pollTimer = setImmediate(poll);
  countdownTimer = setTimeout(stopCoinSession, COUNTDOWN);
};

export const stopCoinSession = async () => {
  disableCoinSlot();

  if (pollTimer) clearImmediate(pollTimer);
  if (pulseTimer) clearInterval(pulseTimer);
  if (countdownTimer) clearTimeout(countdownTimer);

  pollTimer = null;
  pulseTimer = null;
  countdownTimer = null;
  lastValue = 0;
  lastPulseTime = 0;

  if (deviceId) {
    console.log(
      "Coin session finished. Total coins inserted:",
      totalCoins,
      `Device ID: ${deviceId}`,
    );

    try {
      await fetchWithRetry(
        `${process.env.BASE_URL}/devices/${deviceId}/insert-coin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.COIN_SLOT_SECRET!,
          },
          body: JSON.stringify({
            amount: totalCoins,
          }),
        },
      );
      console.log("Updated time", deviceId);
    } catch (error) {
      console.error(error);
    }
  }

  if (userId) {
    console.log(
      "Coin session finished. Total coins inserted:",
      totalCoins,
      `User ID: ${userId}`,
    );

    try {
      await fetchWithRetry(`${process.env.BASE_URL}/users/${userId}/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.COIN_SLOT_SECRET!,
        },
        body: JSON.stringify({
          amount: totalCoins,
        }),
      });
      console.log("Updated time", userId);
    } catch (error) {
      console.error(error);
    }
  }

  deviceId = null;
  userId = null;
  totalCoins = 0;
};

export const isSessionRunning = () => {
  return pollTimer != null;
};

export const getDeviceId = () => {
  return deviceId;
};

export const getUserId = () => {
  return userId;
};

export const getTotalInsertedCoins = () => {
  return totalCoins;
};

export const enableCoinSlot = () => {
  fs.writeFileSync(`${CONTROL_PATH}/value`, "1");
};

export const disableCoinSlot = () => {
  fs.writeFileSync(`${CONTROL_PATH}/value`, "0");
};
