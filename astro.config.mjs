import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"

export default defineConfig({
  site: "https://MrBombtastic5775.github.io",
  base: "/pallas-cat-website",
  integrations: [sitemap()],
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [tailwindcss()],
  },
  server: {
    host: true,
  },
})
