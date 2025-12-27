# SHADOW-CHAT Development Guide for AI Agents

## Project Overview
SHADOW-CHAT is a secure, privacy-focused chat application with end-to-end encryption and self-destructing messages. Built with Node.js, Express, Socket.IO, and Redis.

## Quick Start

### Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (placeholder - no tests implemented yet)

## Project Structure
```
src/
├── server.js           # Main Express server and Socket.IO setup
├── middleware/
│   └── auth.js        # JWT authentication middleware
├── chat/
│   └── sessions.js    # Chat session management routes
└── redis/
    └── client.js      # Redis client configuration
```

## Code Style Guidelines

### Import Statements
- Use ES6 import/export syntax
- Order: external libraries → internal modules
- Include `.js` extensions in internal imports

```javascript
// External libraries
import express from "express";
import jwt from "jsonwebtoken";

// Internal modules
import authMiddleware from "./middleware/auth.js";
import { redis } from "./redis/client.js";
```

### Naming Conventions
- **Files**: kebab-case (e.g., `auth-middleware.js`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for environment/config values
- **Routes**: kebab-case for URL paths
- **Functions**: camelCase with descriptive names

### Error Handling
- Always handle async errors with try/catch or .catch()
- Return meaningful error messages with appropriate HTTP status codes
- Log errors for debugging (basic console.log for now)

```javascript
try {
  const result = await someAsyncOperation();
  res.json({ data: result });
} catch (error) {
  console.error("Operation failed:", error);
  res.status(500).json({ error: "Internal server error" });
}
```

### Environment Variables
- All configuration must use environment variables
- Never hardcode secrets (JWT_SECRET, passwords, etc.)
- Default values only for development

```javascript
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-only";
```

### Security Practices
- Always validate and sanitize user input
- Use Helmet for security headers
- Implement rate limiting on public endpoints
- Use CORS properly configured for your domain
- Never expose stack traces to clients

### Redis Usage
- Use descriptive key patterns with colons as separators
- Set expiration times on all temporary data
- Handle Redis connection errors gracefully

```javascript
// Good key patterns
await redis.set(`nonce:${wallet}`, nonce, "EX", 300);
await redis.set(`session:${sessionKey}`, sessionId, "EX", 86400);
```

### Socket.IO Best Practices
- Authenticate sockets before connection
- Use descriptive event names
- Join rooms for targeted broadcasts
- Clean up on disconnect

### Authentication Flow
1. Client requests nonce with wallet address
2. Server generates random nonce, stores in Redis (5 min TTL)
3. Client signs nonce with private key
4. Server verifies signature and issues JWT
5. Use JWT for protected routes and socket auth

## API Endpoints

### Public Routes
- `POST /auth/nonce` - Get nonce for wallet
- `POST /auth/verify` - Verify signature and get JWT
- `GET /` - Health check

### Protected Routes (requires JWT)
- `POST /chat/session` - Create/get chat session
- `POST /chat/session/:id/ping` - Update session activity

### Socket Events
- `join_session` - Join a chat room
- `send_message` - Send encrypted message
- `receive_message` - Receive encrypted message

## Development Notes
- Redis must be running locally on default port
- Messages are stored in Redis with 24h expiration
- Sessions are deterministic based on sorted wallet addresses
- All chat messages are end-to-end encrypted (server only stores ciphertext)

## Current Limitations
- No automated tests
- Basic error logging
- No API documentation
- No input validation library
- Hardcoded Redis retry values

## Production Considerations
- Set strong JWT_SECRET in production
- Configure proper CORS origin
- Enable Redis password
- Set appropriate rate limits
- Add proper logging and monitoring
- Consider clustering for high availability