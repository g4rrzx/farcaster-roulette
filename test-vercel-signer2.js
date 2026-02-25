import { Wallet } from 'ethers';
const pk = "0x637f585bd03fba34028e6daaba0a3e72b83faed612caca5b12fe4e79eb47ebd1";
const w = new Wallet(pk);
console.log("Vercel Key Address:", w.address.toLowerCase());
console.log("Expected Address:  ", "0xe0e8222404bfb2bf10b3a38a758b0cff0336cd5b");
console.log("Match?", w.address.toLowerCase() === "0xe0e8222404bfb2bf10b3a38a758b0cff0336cd5b");
