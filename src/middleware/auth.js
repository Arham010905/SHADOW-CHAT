import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Missing auth header" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid auth header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Attach identity to request
    req.wallet = payload.wallet;
    req.shortId = payload.shortId;   // 👈 this is the new line for alias system

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
