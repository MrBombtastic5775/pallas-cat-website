#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { execSync } from "node:child_process"

const root = "/Users/jonaschan/Documents/pallas-cat-website"
const distDir = path.join(root, "dist")
const outputDir = path.join(root, "dist")

const sizes = ["gzip", "brotli"]

async function ensureDir(dir) {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

function compressFile(inputPath, outputPath, algorithm) {
  try {
    const content = fs.readFileSync(inputPath)
    if (algorithm === "brotli") {
      const zlib = await import("node:zlib")
      const compressed = zlib.brotliCompressSync(content, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        },
      })
      fs.writeFileSync(outputPath, compressed)
      return compressed.length
    } else {
      const zlib = await import("node:zlib")
      const compressed = zlib.gzipSync(content, { level: 9 })
      fs.writeFileSync(outputPath, compressed)
      return compressed.length
    }
  } catch (e) {
    console.error(`  Error compressing ${path.basename(inputPath)}:`, e.message)
    return null
  }
}

async function walk(dir, fileList = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.name.startsWith(".")) continue
      if (entry.isDirectory()) {
        await walk(fullPath, fileList)
      } else {
        fileList.push(fullPath)
      }
    }
  } catch (e) {
    if (e.code !== "ENOENT") throw e
  }
  return fileList
}

async function main() {
  await ensureDir(outputDir)
  
  const files = await walk(distDir)
  const compressible = files.filter(f => {
    const ext = path.extname(f).toLowerCase()
    return [".html", ".css", ".js", ".json", ".svg", ".xml"].includes(ext)
  })
  
  console.log(`Compressing ${compressible.length} files...\n`)
  
  let totalOrig = 0
  let totalGzip = 0
  let totalBrotli = 0
  
  for (const f of compressible) {
    const rel = path.relative(distDir, f)
    const outFile = path.join(outputDir, rel)
    
    const gzipPath = f + ".gz"
    const brotliPath = f + ".br"
    
    const gzipSize = await compressFile(f, gzipPath, "gzip")
    const brotliSize = await compressFile(f, brotliPath, "brotli")
    
    if (gzipSize !== null && brotliSize !== null) {
      const origStat = await fs.stat(f)
      totalOrig += origStat.size
      totalGzip += gzipSize
      totalBrotli += brotliSize
      console.log(`  ${rel}: ${(origStat.size/1024).toFixed(1)}KB → gzip ${(gzipSize/1024).toFixed(1)}KB, brotli ${(brotliSize/1024).toFixed(1)}KB`)
    }
  }
  
  if (totalOrig > 0) {
    console.log(`\nTotal compression:`)
    console.log(`  Original: ${(totalOrig/1024/1024).toFixed(2)}MB`)
    console.log(`  Gzip:     ${(totalGzip/1024/1024).toFixed(2)}MB (-${Math.round((1-totalGzip/totalOrig)*100)}%)`)
    console.log(`  Brotli:   ${(totalBrotli/1024/1024).toFixed(2)}MB (-${Math.round((1-totalBrotli/totalOrig)*100)}%)`)
  }
  
  console.log("\nNext: Copy .gz/.br files to your web server or configure:")
  console.log("  - Nginx: gzip_static on; gzip_brotli_static on;")
  console.log("  - Netlify: Enable 'Brotli Compression' and 'Gzip Compression'")
  console.log("  - Cloudflare: Enable 'Auto Minify' and 'Brotli'")
  console.log("  - GitHub Pages: Enable gzip via middleware or use Astro Compression adapter")
}

main().catch(e => { console.error(e); process.exit(1) })
