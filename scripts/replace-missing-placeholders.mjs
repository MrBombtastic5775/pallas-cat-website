#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

const root = "/Users/jonaschan/Documents/pallas-cat-website"
const srcDir = path.join(root, "src")
const generatedDir = "/generated"

const imageMap = {
  "home-hero.png": "home-hero.webp",
  "overview-hero.png": "overview-hero.webp",
  "habitat-hero.png": "habitat-hero.webp",
  "behavior-hero.png": "behavior-hero.webp",
  "diet-hero.png": "diet-hero.webp",
  "repro-hero.png": "repro-hero.webp",
  "conservation-hero.png": "conservation-hero.webp",
  "gallery-01.png": "gallery-01.webp",
  "gallery-02.png": "gallery-02.webp",
  "gallery-03.png": "gallery-03.webp",
  "gallery-04.png": "gallery-04.webp",
  "gallery-05.png": "gallery-05.webp",
  "gallery-06.png": "gallery-06.webp",
  "gallery-07.png": "gallery-07.webp",
  "gallery-08.png": "gallery-08.webp",
  "gallery-09.png": "gallery-09.webp",
  "gallery-10.png": "gallery-10.webp",
  "gallery-11.png": "gallery-11.webp",
  "gallery-12.png": "gallery-12.webp",
}

async function replaceInFile(filePath) {
  let content = await fs.readFile(filePath, "utf-8")
  let changed = false
  const replacements = []
  
  for (const [png, webp] of Object.entries(imageMap)) {
    // src="{image}.src" → keep PNG since src is used
    // Direct path references like "/pallas-cat-website/images/X.png" → webp
    const directPatterns = [
      new RegExp(`/${p.replace(/\./g, '\\.')}`, 'g'),
      `"/pallas-cat-website/images/${png}"`,
      `"/images/${png}"`,
    ]
    for (const pat of directPatterns) {
      if (content.includes(pat)) {
        const webpPath = `pallas-cat-website/images/${png.replace('.png', '.webp')}`
        content = content.split(pat).join(webpPath)
        changed = true
      }
    }
  }
  
  if (changed) {
    await fs.writeFile(filePath, content)
    return true
  }
  return false
}

async function main() {
  const astroFiles = []
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.name === "node_modules") continue
      if (entry.name.startsWith(".")) continue
      if (entry.name === "generated") continue
      
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.name.endsWith(".astro")) {
        astroFiles.push(full)
      }
    }
  }
  await walk(srcDir)
  
  console.log(`Processing ${astroFiles.length} Astro files...`)
  let count = 0
  for (const f of astroFiles) {
    const changed = await replaceInFile(f)
    if (changed) {
      count++
      console.log(`  Updated: ${path.relative(root, f)}`)
    }
  }
  console.log(`\nUpdated ${count} files to use optimized WebP images`)
}

main().catch(e => { console.error(e); process.exit(1) })
