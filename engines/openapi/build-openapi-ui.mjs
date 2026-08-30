import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(join(process.cwd(), 'package.json'))
const swaggerUiDist = require('swagger-ui-dist')

const repoRoot = process.cwd()
const sourceDir = swaggerUiDist.getAbsoluteFSPath()
const targetDir = join(repoRoot, 'docs/public/api-ui')
const openApiFile = join(repoRoot, 'docs/public/openapi/openapi.yaml')

if (!existsSync(openApiFile)) {
  throw new Error(
    'Missing docs/public/openapi/openapi.yaml. Run `pnpm openapi:bundle` before `pnpm openapi:build`.'
  )
}

await mkdir(targetDir, { recursive: true })

const assets = [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js',
  'favicon-16x16.png',
  'favicon-32x32.png'
]

for (const asset of assets) {
  await copyFile(join(sourceDir, asset), join(targetDir, asset))
}

await writeFile(
  join(targetDir, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>OpenAPI Explorer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="./swagger-ui.css" />
    <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="./swagger-ui-bundle.js"></script>
    <script src="./swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout'
      })
    </script>
  </body>
</html>
`,
  'utf8'
)

console.log('openapi:build-ui: OpenAPI UI built at docs/public/api-ui/index.html')
