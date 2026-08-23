# AGENTS.md - Development Guide for SHADOW-CHAT

This document provides essential information for agentic coding agents working on the SHADOW-CHAT codebase.

## Project Structure

SHADOW-CHAT is a privacy-focused chat application with end-to-end encryption and ephemeral messaging.

```
SHADOW-CHAT/
├── src/                          # Backend Node.js server
│   ├── server.js                # Main Express server with Socket.IO
│   ├── middleware/              # Authentication middleware
│   ├── chat/                    # Chat session management
│   └── redis/                   # Redis client configuration
├── shadow-chat-frontend/        # Frontend Vite application
│   ├── index.html
│   └── src/                     # Frontend JavaScript modules
└── package.json                 # Root package file
```

## Build and Development Commands

### Backend (Node.js/Express)
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (currently no tests implemented)
npm test
```

### Frontend (Vite)
```bash
cd shadow-chat-frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technology Stack

- **Backend**: Node.js, Express, Socket.IO, Redis, JWT, Ethers.js
- **Frontend**: Vite, Vanilla JavaScript, Ethers.js
- **Authentication**: Ethereum wallet-based with nonce-signature scheme
- **Database**: Redis for ephemeral storage (24-hour TTL)
- **Security**: Helmet, CORS, rate limiting

## Code Style Guidelines

### JavaScript/Node.js Backend

#### Imports and Modules
- Use ES6 imports (`import`) consistently (project uses `"type": "module"`)
- Import dotenv configuration at the top of files that use environment variables
- Group imports in this order: standard library → third-party → local imports

```javascript
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";

import authMiddleware from "./middleware/auth.js";
import { redis } from "./redis/client.js";
```

#### Error Handling
- Use async/await with try-catch blocks for async operations
- Return consistent error responses with appropriate HTTP status codes
- Always validate required parameters before processing

```javascript
app.post("/auth/verify", async (req, res) => {
  const { wallet, signature } = req.body;
  if (!wallet || !signature) {
    return res.status(400).json({ error: "Missing wallet or signature" });
  }
  
  try {
    // Logic here
    res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
```

#### Naming Conventions
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for environment variables
- Use kebab-case for URL routes and Redis keys (e.g., `nonce:${wallet}`)
- Function names should be descriptive of their action

#### Security Practices
- Never log sensitive data (tokens, private keys, signatures)
- Use environment variables for secrets (JWT_SECRET, REDIS_PASSWORD)
- Implement rate limiting on all public endpoints
- Validate all user inputs
- Use JWT with short expiration (24h)

### Frontend JavaScript

#### DOM Manipulation
- Use event listeners instead of inline event handlers
- Cache DOM elements in variables to avoid repeated queries
- Use descriptive variable names for DOM elements

```javascript
const loginBtn = document.getElementById("loginBtn");
const statusDiv = document.getElementById("status");

loginBtn.onclick = async () => {
  // Handle login
};
```

#### API Communication
- Always handle errors in API calls
- Set appropriate Content-Type headers for requests
- Include Authorization header for protected endpoints

```javascript
const res = await fetch(`${API}/auth/nonce`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ wallet: wallet.address }),
});
```

#### State Management
- Keep state variables at appropriate scope
- Use clear variable names for wallet, token, and user data
- Update DOM elements after successful API operations

### Redis Usage

#### Key Patterns
- Use descriptive key prefixes: `nonce:${wallet}`, `session:${id}`, `message:${sessionId}:${messageId}`
- Always set TTL on Redis keys to ensure data ephemerality
- Use consistent TTL values (86400 seconds = 24 hours)

```javascript
await redis.set(`nonce:${wallet}`, nonce, "EX", 1800);
await redis.set(key, ciphertext, "EX", 86400);
```

#### Data Structures
- Use Redis hashes for structured session data
- Use simple key-value for nonces and messages
- Use proper Redis client error handling

### Authentication Flow

The app uses a wallet-based authentication system:

1. **Nonce Request**: Client requests a unique nonce for their wallet
2. **Signature**: Client signs the nonce with their private key  
3. **Verification**: Server verifies signature and issues JWT
4. **Session**: Client uses JWT for authenticated requests

### Socket.IO Integration

- Socket connections require JWT authentication via handshake
- Use rooms for session-based messaging
- Attach user identity (wallet, shortId) to socket objects
- Emit and listen for events with descriptive names

```javascript
socket.on("send_message", async ({ sessionId, ciphertext }) => {
  io.to(sessionId).emit("receive_message", {
    messageId,
    ciphertext,
  });
});
```

## Testing

Currently no test framework is configured. When implementing tests:
- For backend: consider using Jest or Mocha with supertest for API testing
- For frontend: consider using Vitest (built-in with Vite) or Jest
- Test authentication flow, Redis operations, and Socket.IO events

## Environment Configuration

Required environment variables (see `.env.example`):
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret for JWT signing (change in production)
- `CORS_ORIGIN`: Allowed CORS origins
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`: Rate limiting

## Common Patterns

### Deterministic Session Creation
When creating chat sessions between two wallets, sort wallet addresses to ensure consistent session keys:

```javascript
const sessionKey = [walletA, walletB].sort().join(":");
```

### Short ID Generation
Generate consistent short IDs from wallet addresses for user identification:

```javascript
function shortIdFromWallet(wallet) {
  return crypto
    .createHash("sha256")
    .update(wallet.toLowerCase())
    .digest("hex")
    .slice(0, 8);
}
```

## Security Considerations

- All messages are stored as encrypted ciphertext only
- Server never sees or stores plaintext messages
- All data has automatic expiration (24 hours)
- No persistent logs or metadata storage
- Rate limiting prevents abuse
- HTTPS/WSS should be used in production

## Development Notes

- Backend runs on port 3000, frontend dev server on port 5173
- Redis must be running locally or configured via environment variables
- Socket.IO CORS must match frontend origin
- JWT tokens expire after 24 hours for security