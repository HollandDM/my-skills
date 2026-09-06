// Bundle the Effect CLI into a single self-contained ESM file so agents can run it without installing dependencies.
import { build } from "esbuild"
import { chmodSync, mkdirSync } from "node:fs"

mkdirSync("dist", { recursive: true })
await build({
  entryPoints: ["src/cli.ts"],
  outfile: "dist/stepwise.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  banner: { js: "#!/usr/bin/env node" },
  minify: false,
  legalComments: "none",
  logLevel: "info",
  // Optional native/remote transports Effect can use but this CLI never touches.
  external: ["msgpackr", "msgpackr-extract", "undici", "redis"],
})
chmodSync("dist/stepwise.mjs", 0o755)
