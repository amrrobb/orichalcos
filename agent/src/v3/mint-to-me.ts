import { ethers } from "ethers";
async function main() {
  const p = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai", 16602);
  const w = new ethers.Wallet(process.env.PRIVATE_KEY!, p);
  const usdc = new ethers.Contract(
    "0x2F7296aebCBc5a8D67A65FA6BF09dD74c70bC60f",
    ["function mint(address,uint256)", "function balanceOf(address) view returns (uint256)"],
    w
  );
  const target = "0x438FD476037B8Ae8a550FC996EECAdcF20e22d5d";
  const before = await usdc.balanceOf(target);
  console.log(`Before: ${ethers.formatUnits(before, 6)} USDC`);
  const tx = await usdc.mint(target, 10000n * 10n**6n);
  console.log(`tx: ${tx.hash}`);
  await tx.wait();
  const after = await usdc.balanceOf(target);
  console.log(`After:  ${ethers.formatUnits(after, 6)} USDC`);
}
main().catch(console.error);
