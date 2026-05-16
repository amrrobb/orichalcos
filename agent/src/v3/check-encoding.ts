import { ethers } from "ethers";
async function main() {
  const p = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai", 16602);
  const ATTEST = "0x892872eF9490683604EE53B90c5c21e1B4E6eeda";
  const abi = ["function getTradeAt(uint256,uint256) view returns (tuple(uint256,uint256,bytes32,bytes32,bytes32,int256,uint256,uint256))"];
  const c = new ethers.Contract(ATTEST, abi, p);
  // Check first trade of strategy 17 vs 13
  for (const tokenId of [13, 17]) {
    const t = await c.getTradeAt(tokenId, 0);
    const hlHash = t[4];
    const asBigInt = BigInt(hlHash);
    const looksLikeOid = asBigInt > 0n && asBigInt < (1n << 64n);
    console.log(`Strategy #${tokenId} trade 0 hlTxHash: ${hlHash}`);
    console.log(`  asBigInt: ${asBigInt}`);
    console.log(`  looksLikeOid: ${looksLikeOid}`);
    console.log(`  HL link: https://app.hyperliquid-testnet.xyz/explorer/order/${asBigInt}`);
    console.log("");
  }
}
main().catch(console.error);
