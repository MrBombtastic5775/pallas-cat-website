#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { execSync } from "node:child_process"

const root = "/Users/jonaschan/Documents/pallas-cat-website"
const publicDir = path.join(root, "public")
const distDir = path.join(root, "dist")

const PKG = {
  name: "pallas-cat-performance-guide.md",
  steps: [
    {
      name: "optimize-images",
      cmd: "node scripts/optimize-images.mjs",
      desc: "Convert all PNG images to optimized WebP formats",
      priority: "critical",
      estimated_impact: "60-70% reduction in image payload",
    },
    {
      name: "compress-build",
      cmd: "node scripts/compress-build.mjs",
      desc: "Generate gzip/brotli compressed versions of build",
      priority: "high",
      estimated_impact: "40-60% reduction in transfer size",
    },
  ]
}

const status = {
  script: `
# Build Script for Production Deployment

## Build Configuration

\`\`\`json
{
  "scripts": {
    "build": "astro build",
    "optimize": "node scripts/optimize-images.mjs",
    "compress": "node scripts/compress-build.mjs",
    "deploy": "npm run optimize && npm run build && npm run compress"
  }
}
\`\`\`

## What the Build Scripts Do

### 1. Image Optimization (\`scripts/optimize-images.mjs\`)
- Scans \`src/assets/images/\`
