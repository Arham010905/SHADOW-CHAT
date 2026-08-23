
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

import authMiddleware from "./middleware/auth.js";
import chatSession from "./chat/sessions.js";
import { redis } from "./redis/client.js";

function shortIdFromWallet(wallet) {
  return crypto
    .createHash("sha256")
    .update(wallet.toLowerCase())
    .digest("hex")
    .slice(0, 8);
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

/* -------------------- AUTH -------------------- */

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

// Step 1: Request nonce
app.post("/auth/nonce", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: "Wallet required" });

  const nonce = crypto.randomBytes(16).toString("hex");
  await redis.set(`nonce:${wallet}`, nonce, "EX", 1800);

  res.json({ nonce });
});

// Step 2: Verify signature and issue JWT
app.post("/auth/verify", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !signature) {
    return res.status(400).json({ error: "Missing wallet or signature" });
  }

  const nonce = await redis.get(`nonce:${wallet}`);
  if (!nonce) return res.status(400).json({ error: "Nonce expired" });

  const recovered = ethers.verifyMessage(nonce, signature);
  if (recovered.toLowerCase() !== wallet.toLowerCase()) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  await redis.del(`nonce:${wallet}`);

  const shortId = shortIdFromWallet(wallet);

  const token = jwt.sign(
    { wallet, shortId },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ token, shortId });
});

/* -------------------- ALIAS SYSTEM -------------------- */

// Set alias
app.post("/identity/alias", authMiddleware, async (req, res) => {
  const { alias } = req.body;
  if (!alias) return res.status(400).json({ error: "Alias required" });

  const shortId = req.shortId;
  const aliasKey = `alias:${shortId}`;
  const nameKey = `alias:name:${alias.toLowerCase()}`;

  const existing = await redis.get(nameKey);
  if (existing && existing !== shortId) {
    return res.status(409).json({ error: "Alias already taken" });
  }

  await redis.set(aliasKey, alias, "EX", 86400);
  await redis.set(nameKey, shortId, "EX", 86400);

  res.json({ shortId, alias });
});

// Get my identity
app.get("/identity/me", authMiddleware, async (req, res) => {
  const shortId = req.shortId;
  const alias = await redis.get(`alias:${shortId}`);

  res.json({ shortId, alias });
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
    socket.shortId = payload.shortId;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

/* -------------------- SOCKET EVENTS -------------------- */
io.on("connection", async (socket) => {
  const alias = await redis.get(`alias:${socket.shortId}`);
  console.log("🔌 Connected:", alias || socket.shortId);

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
    console.log("❌ Disconnected:", alias || socket.shortId);
  });
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});