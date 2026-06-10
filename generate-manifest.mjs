import fs from "node:fs/promises"
import path from "node:path"

const root = "/Users/jonaschan/Documents/pallas-cat-website"
const outDir = path.join(root, "public/generated")

async function generateManifest() {
  const files = await fs.readdir(outDir)
  const webpFiles = files.filter(f => f.endsWith(".webp") && !f.includes("-md"))

  const manifest = {}
  const baseUrl = `${Astro?.site?.origin || "https://MrBombtastic5775.github.io"}${Astro?.site?.pathname?.base || "/pallas-cat-website"}`

  for (const f of webpFiles) {
    const base = f.replace(".webp", "")
    const stat = await fs.stat(path.join(outDir, f))
    manifest[`/src/assets/images/${base}.png`] = {
      format: "webp",
      width: 1920,
      height: 1920,
      src: `/generated/${f}`,
      size: stat.size,
    }
  }

  await fs.writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  )
  console.log("Manifest generated:", Object.keys(manifest).length, "images")
}

generateManifest().catch(e => { console.error(e); process.exit(1) })
