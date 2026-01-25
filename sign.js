import { Wallet, verifyMessage } from "ethers";

const PRIVATE_KEY = "0xf2cf7e0a5665b15476e66bae387c7abbc8a191135324db782bfc41ccfe09580f";
const nonce = "34ec79f6d990772352867123b002f863";

const wallet = new Wallet(PRIVATE_KEY);

const signature = await wallet.signMessage(nonce);
const recovered = verifyMessage(nonce, signature);

console.log("Address from key: ", wallet.address);
console.log("Recovered address:", recovered);
console.log("Signature:", signature);


