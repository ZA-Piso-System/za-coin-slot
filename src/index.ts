import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  isSessionRunning,
  startCoinSession,
  stopCoinSession,
} from "./coin-slot.js";

const app = new Hono();

app.get("/add-coin", (c) => {
  if (isSessionRunning()) {
    return c.json({ message: "Coin session already running" });
  }
  startCoinSession();
  return c.json({ message: "Coin session started" });
});

app.get("/done", (c) => {
  stopCoinSession();
  return c.json({ message: "Coin session started" });
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
