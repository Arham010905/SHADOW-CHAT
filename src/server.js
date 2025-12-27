import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

import authMiddleware from "./middleware/auth.js";
import chatSession from "./chat/sessions.js";
import { redis } from "./redis/client.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

/* -------------------- BASIC HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.send("Server is UP & FINE");
});

/* -------------------- AUTH CONFIG -------------------- */
const JWT_SECRET = "CHANGE_THIS_SECRET";

/* -------------------- PUBLIC AUTH ROUTES -------------------- */

// Request nonce
app.post("/auth/nonce", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) {
    return res.status(400).json({ error: "Wallet required" });
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  await redis.set(`nonce:${wallet}`, nonce, "EX", 300);

  res.json({ nonce });
});

// Verify signature & issue JWT
app.post("/auth/verify", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !signature) {
    return res.status(400).json({ error: "Missing data" });
  }

  const nonce = await redis.get(`nonce:${wallet}`);
  if (!nonce) {
    return res.status(400).json({ error: "Nonce expired" });
  }

  const recovered = ethers.verifyMessage(nonce, signature);
  if (recovered.toLowerCase() !== wallet.toLowerCase()) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  await redis.del(`nonce:${wallet}`);

  const token = jwt.sign({ wallet }, JWT_SECRET, {
    expiresIn: "24h",
  });

  res.json({ token });
});

/* -------------------- PROTECTED CHAT ROUTES -------------------- */
app.use("/chat", authMiddleware, chatSession);

/* -------------------- SOCKET AUTH -------------------- */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.wallet = payload.wallet;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

/* -------------------- SOCKET EVENTS -------------------- */
io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.wallet);

  socket.on("join_session", async (sessionId) => {
    socket.join(sessionId);
    await redis.expire(`session:data:${sessionId}`, 86400);
  });

  socket.on("send_message", async ({ sessionId, ciphertext }) => {
    const messageId = crypto.randomUUID();
    const key = `message:${sessionId}:${messageId}`;

    await redis.set(key, ciphertext, "EX", 86400);
    await redis.expire(`session:data:${sessionId}`, 86400);

    io.to(sessionId).emit("receive_message", {
      messageId,
      ciphertext,
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.wallet);
  });
});

/* -------------------- START SERVER -------------------- */
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
