import { Wallet, verifyMessage } from "ethers";

const API = "http://localhost:3000";

async function run() {
  const wallet = Wallet.createRandom();
  console.log("Wallet Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);

  const nonceRes = await fetch(`${API}/auth/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet: wallet.address })
  });
  const { nonce } = await nonceRes.json();
  console.log("Nonce:", nonce);

  const signature = await wallet.signMessage(nonce);
  console.log("Signature:", signature);

  const recovered = verifyMessage(nonce, signature);
  console.log("Recovered:", recovered);

  const verifyRes = await fetch(`${API}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet: wallet.address,
      signature
    })
  });
  const verifyData = await verifyRes.json();
  console.log("Server Response:", verifyData);

  const aliasRes = await fetch(`${API}/identity/alias`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${verifyData.token}`
    },
    body: JSON.stringify({ alias: "shadowfox" })
  });

  const aliasData = await aliasRes.json();
  console.log("Alias Result:", aliasData);
}

run().catch(console.error);