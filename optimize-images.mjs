import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = "/Users/jonaschan/Documents/pallas-cat-website"
const srcDir = path.join(root, "src/assets/images")
const outDir = path.join(root, "public/generated")

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function processImage(file) {
  const srcPath = path.join(srcDir, file)
  const baseName = path.basename(file, ".png")
  const webpOut = path.join(outDir, `${baseName}.webp`)

  const srcStat = await fs.stat(srcPath)
  try {
    const wStat = await fs.stat(webpOut)
    if (wStat.mtimeMs > srcStat.mtimeMs) return null
  } catch {}

  const meta = await sharp(srcPath).metadata()
  const maxDim = Math.max(meta.width || 0, meta.height || 0)

  let pipeline = sharp(srcPath)
  if (maxDim > 2000) {
    const newW = maxDim > 3000 ? Math.round((meta.width || 0) * 0.75) : (meta.width || 0)
    if (newW > 0) pipeline = pipeline.resize({ width: newW, withoutEnlargement: true })
  }

  const quality = maxDim > 2000 ? 70 : 78
  await pipeline.webp({ quality, effort: 6 }).toFile(webpOut)

  const wSize = (await fs.stat(webpOut)).size
  return {
    baseName,
    originalSize: srcStat.size,
    optimizedSize: wSize,
    width: meta.width,
    height: meta.height,
    webp: `/generated/${baseName}.webp`,
    savings: Math.round((1 - wSize / srcStat.size) * 100),
  }
}

async function main() {
  await ensureDir(outDir)
  const files = (await fs.readdir(srcDir)).filter(f => f.endsWith(".png"))
  console.log(`Processing ${files.length} images...`)

  let totalOrig = 0, totalNew = 0
  for (const f of files) {
    const r = await processImage(f)
    if (!r) {
      console.log(`  [SKIP] ${f}`)
      continue
    }
    totalOrig += r.originalSize
    totalNew += r.optimizedSize
    console.log(`  ${f}: ${(r.originalSize/1024).toFixed(0)}KB → ${(r.optimizedSize/1024).toFixed(0)}KB (-${r.savings}%) [${r.width}x${r.height}] → ${r.webp}`)
  }

  if (totalOrig > 0) {
    console.log(`\nTotal: ${(totalOrig/1024/1024).toFixed(1)}MB → ${(totalNew/1024/1024).toFixed(1)}MB (-${Math.round((1-totalNew/totalOrig)*100)}%)`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
