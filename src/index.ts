import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { Hono } from "hono";
import { cors } from "hono/cors";
import path from "path";
import {
  disableCoinSlot,
  getDeviceId,
  getTotalInsertedCoins,
  getUserId,
  isSessionRunning,
  startCoinSession,
  stopCoinSession,
} from "./coin-slot.js";
import { Environment } from "./common/types/environment.type.js";

expand(
  config({
    path: path.resolve(
      process.cwd(),
      process.env.NODE_ENV === Environment.TEST ? ".env.test" : ".env",
    ),
  }),
);

disableCoinSlot();

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/api/v1/total-inserted-coins", (c) => {
  const totalCoins = getTotalInsertedCoins();
  return c.json({ total: totalCoins });
});

app.post("/api/v1/:id/insert-coin", async (c) => {
  const id = c.req.param("id");
  const { type } = await c.req.json();

  if (isSessionRunning()) {
    return c.json({ message: "Coin session already running" }, 404);
  }

  startCoinSession(id, type);
  return c.json({ message: "Coin session started" });
});

app.post("/api/v1/:id/done", (c) => {
  const id = c.req.param("id");
  if (id !== getDeviceId() && id !== getUserId()) {
    return c.json({ message: "Invalid device or user id" }, 404);
  }
  stopCoinSession();
  return c.json({ message: "Done inserting coin" });
});

serve(
  {
    fetch: app.fetch,
    port: 5000,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
