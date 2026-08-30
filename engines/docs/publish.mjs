import { writeGithubCatalog } from './lib/render-github-catalog.mjs'

const catalog = writeGithubCatalog(process.cwd())
console.log(`publish: ${catalog}`)
