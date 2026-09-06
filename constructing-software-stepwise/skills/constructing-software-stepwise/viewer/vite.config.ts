import { defineConfig, type Plugin } from "vite"
import solid from "@solidjs/vite-plugin"

/** Inline the built module and stylesheet into the HTML so the export is one self-contained file. */
const singleFile = (): Plugin => ({
  name: "stepwise-single-file",
  enforce: "post",
  generateBundle(_options, bundle) {
    const html = Object.values(bundle).find((item) => item.type === "asset" && item.fileName.endsWith(".html"))
    if (!html || html.type !== "asset") throw new Error("viewer build produced no HTML entry")
    let document = String(html.source)
    for (const [fileName, item] of Object.entries(bundle)) {
      if (item === html) continue
      const href = "/" + fileName
      if (item.type === "chunk") {
        const code = item.code.replace(/<\/script/giu, "<\\/script")
        const tag = new RegExp(`<script[^>]*src="${href.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}"[^>]*></script>`, "u")
        if (!tag.test(document)) throw new Error(`script tag for ${fileName} not found in HTML`)
        document = document.replace(tag, () => `<script type="module">${code}</script>`)
      } else if (fileName.endsWith(".css")) {
        const css = String(item.source).replace(/<\/style/giu, "<\\/style")
        const tag = new RegExp(`<link[^>]*href="${href.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}"[^>]*>`, "u")
        if (!tag.test(document)) throw new Error(`stylesheet link for ${fileName} not found in HTML`)
        document = document.replace(tag, () => `<style>${css}</style>`)
      } else throw new Error(`unexpected build output ${fileName}; the viewer must stay a single file`)
      delete bundle[fileName]
    }
    html.fileName = "design-view.html"
    html.source = document
  },
})

export default defineConfig({
  root: "viewer",
  plugins: [solid(), singleFile()],
  build: {
    outDir: "../dist",
    emptyOutDir: false,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    target: "es2022",
    rollupOptions: { output: { codeSplitting: false } },
  },
})
