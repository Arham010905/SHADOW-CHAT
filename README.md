SHADOW CHAT is a secure, privacy-focused chat application featuring end-to-end encryption and automatic message deletion (self-destructing/ephemeral messages).
Designed for users who prioritize confidentiality, SHADOW CHAT ensures that conversations leave no permanent trace—messages automatically delete after a set time or upon being read, 
preventing long-term storage or recovery. Key Features: End-to-End Encryption — Messages are encrypted on the sender's device and only decrypted on the recipient's,
keeping your chats private from intermediaries, servers, or third parties. Auto-Delete Functionality — Ephemeral messaging system where chats self-destruct automatically,
ideal for sensitive discussions. Simple Chat Box Interface — A clean, user-friendly chat box for real-time communication without unnecessary complexity. Privacy by Design — No persistent logs,
minimal metadata, and focus on temporary conversations.


BASICALLY,
This project is a privacy-focused, anonymous chat backend built using Node.js, Express, Socket.IO, Redis, and Ethereum wallet authentication. Users authenticate without usernames or passwords by proving ownership of a wallet through a nonce and cryptographic signature, after which the server issues a short-lived JWT for session access. All chat messages are handled as encrypted ciphertext only, meaning the backend never sees or stores plaintext data. Chat sessions and messages are stored ephemerally in Redis and are automatically deleted after 24 hours of inactivity, enforcing privacy by design. The system is designed to act purely as a secure relay and session manager, with all encryption, decryption, and key management intended to occur on client-side only.

also maybe in future when we want to publish this as an appication or website will take care of the ethics and security based on govt rules and regulations only...but that is for future and not now.
as of now (until an application/wesite launch) this will be treated as a test subject ONLY! 
