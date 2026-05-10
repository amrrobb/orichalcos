/**
 * Public-tell proxy.
 *
 * Frontend hits /api/tell?root=0x... → this route uses the 0G Storage SDK
 * (server-side, Node runtime) to download the file and return its JSON.
 *
 * Why a server route: the SDK's Indexer.download() uses zgs JSON-RPC against
 * picked storage nodes, not a stable public HTTP gateway. Bundling the SDK
 * in the browser is heavy and pulls Node-flavored crypto. A tiny server-side
 * proxy is cleaner.
 *
 * The data returned is public on chain (the merkle root is committed), so
 * no auth needed.
 */
import { NextRequest } from "next/server";
import { Indexer } from "@0gfoundation/0g-ts-sdk";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { STORAGE_INDEXER_URL } from "@/lib/contracts";

export const runtime = "nodejs"; // SDK needs Node APIs (fs, etc.)
export const dynamic = "force-dynamic";

let indexer: Indexer | null = null;
function getIndexer() {
  if (!indexer) indexer = new Indexer(STORAGE_INDEXER_URL);
  return indexer;
}

const HEX32 = /^0x[0-9a-fA-F]{64}$/;

export async function GET(req: NextRequest) {
  const root = req.nextUrl.searchParams.get("root");
  if (!root || !HEX32.test(root)) {
    return Response.json({ error: "invalid root hash" }, { status: 400 });
  }

  const tmpFile = path.join(os.tmpdir(), `tell-${root.slice(2, 14)}-${Date.now()}.json`);
  try {
    const err = await getIndexer().download(root, tmpFile, true);
    if (err) {
      return Response.json({ error: `download error: ${err}` }, { status: 502 });
    }
    const content = fs.readFileSync(tmpFile, "utf-8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Not JSON — return as text in a wrapped response
      return Response.json({ raw: content });
    }
    return Response.json(parsed, {
      headers: {
        // Cached aggressively — public tells are immutable (content-addressed)
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 502 });
  } finally {
    if (fs.existsSync(tmpFile)) {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // ignore cleanup error
      }
    }
  }
}
