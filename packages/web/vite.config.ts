import { defineConfig } from 'vite'

// Use BASE_PATH for GitHub Pages (e.g., /repo-name/). Defaults to '/'
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
})
