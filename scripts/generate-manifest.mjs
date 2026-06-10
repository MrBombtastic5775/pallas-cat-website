#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

const outDir = "/Users/jonaschan/Documents/pallas-cat-website/public/generated"
const manifestPath = path.join(outDir, "manifest.json")

async function main() {
  const files = await fs.readdir(outDir)
  const webpFiles = files.filter(f => f.endsWith(".webp") && !f.includes("-md-"))

  const manifest = {}
  const siteBase = "/pallas-cat-website"

  for (const f of webpFiles) {
    const base = f.replace(".webp", "")
    const stat = await fs.stat(path.join(outDir, f))
    for (const ex of [".png", ".jpg", ".jpeg"]) {
      const origName = `${base}${ex}`
      manifest[`/src/assets/images/${origName}`] = {
        format: "webp",
        src: `${siteBase}/generated/${f}`,
        size: stat.size,
        width: 1920,
        height: 1920,
      }
      break
    }
    manifest[`/src/assets/images/${base}.png`] = {
      format: "webp",
      src: `${siteBase}/generated/${f}`,
      size: stat.size,
      width: 1920,
      height: 1920,
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`Wrote ${Object.keys(manifest).length} entries to manifest.json`)
}

main().catch(e => { console.error(e); process.exit(1) })
