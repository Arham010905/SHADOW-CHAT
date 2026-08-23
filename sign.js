import { Wallet, verifyMessage } from "ethers";

const PRIVATE_KEY = "0x681a2409669A556Ee0b858D006E4d945E54Fa3A7";
const nonce = "a02dbf3ed181c20863787c126732425e";

const wallet = new Wallet(PRIVATE_KEY);

const signature = await wallet.signMessage(nonce);
const recovered = verifyMessage(nonce, signature);

console.log("Address from key: ", wallet.address);
console.log("Recovered address:", recovered);
console.log("Signature:", signature);


