import express from "express";
import { redis } from "../redis/client.js";
import authMiddleware from "../middleware/auth.js";

import { randomUUID } from "crypto";

const router = express.Router();
const SESSION_TTL = 60 * 60 * 24; // 24h

// Create or fetch a session
router.post("/session", authMiddleware, async (req, res) => {
  const { peerWallet } = req.body;
  const walletA = req.wallet;
  const walletB = peerWallet;

  if (!walletB) return res.status(400).json({ error: "Peer required" });

  // Deterministic session key
  const sessionKey = [walletA, walletB].sort().join(":");

  const sessionId =
    (await redis.get(`session:${sessionKey}`)) ||
    randomUUID();

  await redis.set(`session:${sessionKey}`, sessionId, "EX", SESSION_TTL);

  await redis.hset(
    `session:data:${sessionId}`,
    {
      users: JSON.stringify([walletA, walletB]),
      lastActivity: Date.now(),
    }
  );

  await redis.expire(`session:data:${sessionId}`, SESSION_TTL);

  res.json({ sessionId });
});

// Update activity (called on open, send, receive)
router.post("/session/:id/ping", authMiddleware, async (req, res) => {
  const { id } = req.params;

  await redis.hset(`session:data:${id}`, "lastActivity", Date.now());
  await redis.expire(`session:data:${id}`, SESSION_TTL);

  res.sendStatus(200);
});

export default router;
