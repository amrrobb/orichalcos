import { ethers } from "ethers";
async function main() {
  const p = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai", 16602);
  const STRATEGY = "0x782CBD5313E3b99d9C94e4f5197B81a432cdE621";
  const ATTEST   = "0x892872eF9490683604EE53B90c5c21e1B4E6eeda";
  const ABI_S = ["function nextTokenId() view returns (uint256)", "function getData(uint256) view returns (tuple(uint8,bytes32,bytes32,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8))"];
  const ABI_T = ["function tradeCount(uint256) view returns (uint256)"];
  const s = new ethers.Contract(STRATEGY, ABI_S, p);
  const t = new ethers.Contract(ATTEST, ABI_T, p);
  const next = await s.nextTokenId();
  console.log(`Strategies minted: ${Number(next) - 1}`);
  const statusNames = ["Idle", "Active", "Breached", "Settled"];
  for (let i = 1n; i < next; i++) {
    const d = await s.getData(i);
    const tc = await t.tradeCount(i);
    // Struct order matches StrategyINFT.sol:
    // archetype, soul, meta, mintedBy, mintedAt, currentEpochId,
    // startingBond, bondAmount, maxDrawdownBps, epochStart, epochEnd,
    // currentEquity, status
    const archetype = ["Bold", "Patient", "Sharp", "Stoic"][Number(d[0])];
    const status = statusNames[Number(d[12])];
    const equity = ethers.formatUnits(d[11], 6);
    const bond = ethers.formatUnits(d[7], 6);
    console.log(`  #${i} ${archetype.padEnd(8)} status=${status.padEnd(9)} bond=${bond.padStart(8)} equity=${equity.padStart(8)} trades=${tc}`);
  }
}
main().catch(console.error);
