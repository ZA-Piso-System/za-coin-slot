import fs from "fs";

const GPIO_PIN = 12;
const GPIO_PATH = `/sys/class/gpio/gpio${GPIO_PIN}`;
const PULSE_TIMEOUT = 300;
const POLL_INTERVAL = 5;
const COUNTDOWN = 30_000;

let deviceId: string | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let pulseTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;
let lastValue = 0;
let pulseCount = 0;
let totalCoins = 0;
let lastPulseTime = 0;

if (!fs.existsSync(GPIO_PATH)) {
  fs.writeFileSync("/sys/class/gpio/export", `${GPIO_PIN}`);
  fs.writeFileSync(`${GPIO_PATH}/direction`, "in");
}

export const startCoinSession = (id: string) => {
  deviceId = id;
  lastValue = Number(fs.readFileSync(`${GPIO_PATH}/value`, "utf8").trim());
  pulseCount = 0;
  totalCoins = 0;
  lastPulseTime = Date.now();

  pollTimer = setInterval(() => {
    const value = Number(fs.readFileSync(`${GPIO_PATH}/value`, "utf8").trim());

    if (value === 1 && lastValue === 0) {
      pulseCount++;
      lastPulseTime = Date.now();

      if (countdownTimer) clearTimeout(countdownTimer);
      countdownTimer = setTimeout(stopCoinSession, COUNTDOWN);
    }
    lastValue = value;
  }, POLL_INTERVAL);

  pulseTimer = setInterval(() => {
    if (pulseCount > 0 && Date.now() - lastPulseTime > PULSE_TIMEOUT) {
      totalCoins += pulseCount;
      console.log("Coin added, total:", totalCoins);
      pulseCount = 0;
    }
  }, 50);

  countdownTimer = setTimeout(stopCoinSession, COUNTDOWN);
};

export const stopCoinSession = () => {
  if (pollTimer) clearInterval(pollTimer);
  if (pulseTimer) clearInterval(pulseTimer);
  if (countdownTimer) clearTimeout(countdownTimer);

  pollTimer = null;
  pulseTimer = null;
  countdownTimer = null;
  lastValue = 0;
  pulseCount = 0;
  lastPulseTime = 0;

  console.log(
    "Coin session finished. Total coins inserted:",
    totalCoins,
    deviceId,
  );

  // TODO: send totalCoins to backend API

  deviceId = null;
  totalCoins = 0;
};

export const isSessionRunning = () => {
  return pollTimer != null;
};

export const getDeviceId = () => {
  return deviceId;
};

export const getTotalInsertedCoins = () => {
  return totalCoins;
};
