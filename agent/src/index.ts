import { loadConfig } from "./config.js";
import { runAgent } from "./agent.js";

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║     ORICHALCOS — TEE Trading Agent     ║");
  console.log("║     Autonomous · Sealed · Attested     ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log();

  const config = loadConfig();
  await runAgent(config);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
