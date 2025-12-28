import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";

import walletAuth from "./middleware/auth.js";
import chatSession from "./chat/sessions.js";
import { redis } from "./redis/client.js";

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
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

<<<<<<< Updated upstream
/* -------------------- AUTH CONFIG -------------------- */
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";
=======
app.use("/auth", walletAuth);
app.use("/chat", chatSession);
>>>>>>> Stashed changes

// SOCKET AUTH
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    socket.wallet = payload.wallet;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// SOCKET EVENTS
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

<<<<<<< Updated upstream
/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 3000;
=======
const PORT = 3000;
>>>>>>> Stashed changes
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});
