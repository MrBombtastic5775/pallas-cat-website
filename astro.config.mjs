import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"

export default defineConfig({
  site: "https://MrBombtastic5775.github.io",
  base: "/pallas-cat-website",
  integrations: [sitemap()],
  compressHTML: true,
  image: {
    domains: [],
    endpoint: {
      route: "/_image",
      validateEndpoint: false,
    },
    formats: ["image/webp", "image/avif"],
    remotePatterns: [],
    objectFit: "cover",
    objectPosition: "center",
    responsiveStyles: true,
  },
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tailwindcss()],
    build: {
      cssMinify: "lightningcss",
    },
  },
  server: {
    host: true,
  },
})
