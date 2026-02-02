import { Wallet } from "ethers";

document.addEventListener("DOMContentLoaded", () => {
  const API = "http://localhost:3000";

  const loginBtn = document.getElementById("loginBtn");
  const statusDiv = document.getElementById("status");

  const identityDiv = document.getElementById("identity");
  const walletSpan = document.getElementById("wallet");
  const shortIdSpan = document.getElementById("shortId");
  const aliasSpan = document.getElementById("alias");
  const aliasInput = document.getElementById("aliasInput");

  let wallet;
  let token;

  /* ---------------- LOGIN FLOW ---------------- */

  loginBtn.onclick = async () => {
    try {
      statusDiv.innerText = "🔐 Generating wallet...";

      // 1. Generate wallet
      wallet = Wallet.createRandom();
      walletSpan.innerText = wallet.address;

      // 2. Request nonce
      statusDiv.innerText = "📨 Requesting nonce...";
      const nonceRes = await fetch(`${API}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: wallet.address }),
      });

      const { nonce } = await nonceRes.json();

      // 3. Sign nonce
      statusDiv.innerText = "✍️ Signing nonce...";
      const signature = await wallet.signMessage(nonce);

      // 4. Verify signature
      statusDiv.innerText = "✅ Verifying...";
      const verifyRes = await fetch(`${API}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: wallet.address,
          signature,
        }),
      });

      const data = await verifyRes.json();
      token = data.token;
      shortIdSpan.innerText = data.shortId;

      // 5. Show identity section
      identityDiv.style.display = "block";

      // 6. NOW the button exists → attach handler
      const setAliasBtn = document.getElementById("setAliasBtn");

      setAliasBtn.onclick = async () => {
        try {
          const alias = aliasInput.value.trim();
          if (!alias) return;

          const res = await fetch(`${API}/identity/alias`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ alias }),
          });

          const result = await res.json();
          aliasSpan.innerText = result.alias;
        } catch (err) {
          console.error(err);
        }
      };

      statusDiv.innerText = "🎉 Logged in successfully";
    } catch (err) {
      console.error(err);
      statusDiv.innerText = "❌ Login failed";
    }
  };
});

