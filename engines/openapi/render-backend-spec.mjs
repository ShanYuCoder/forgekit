import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { MD_NONE } from './lib/markdown-table.mjs'
import {
  renderBackendSpecMarkdown,
  renderCommonSpecMarkdown
} from './lib/render-backend-spec-markdown.mjs'

const projectRoot = process.cwd()
const docsDir = path.join(projectRoot, 'docs')
const surfacesDir = path.join(projectRoot, 'product', 'surfaces')
const featuresDir = path.join(docsDir, 'features')

export { renderFeatureBackendSpec, listBackendSpecFiles }

async function main() {
  const started = Date.now()
  let backendSpecs = await listBackendSpecFiles(surfacesDir)
  if (!backendSpecs.length) {
    backendSpecs = await listBackendSpecFiles(featuresDir)
  }
  const commonSpecs = await listCommonSpecFiles(path.join(featuresDir, 'common'))

  if (!backendSpecs.length && !commonSpecs.length) {
    console.error('docs:render: no 01-backend-spec.yaml or features/common/*.yaml found')
    process.exit(1)
  }

  let failed = 0

  for (const specFile of backendSpecs) {
    try {
      await renderFeatureBackendSpec(specFile)
    } catch (error) {
      failed++
      console.error(
        `docs:render: FAIL ${path.relative(projectRoot, specFile)}: ${error.message ?? error}`
      )
    }
  }

  for (const specFile of commonSpecs) {
    try {
      await renderCommonSpec(specFile)
    } catch (error) {
      failed++
      console.error(
        `docs:render: FAIL ${path.relative(projectRoot, specFile)}: ${error.message ?? error}`
      )
    }
  }

  if (failed > 0) {
    console.error(`docs:render: aborted index — ${failed} file(s) failed`)
    process.exit(1)
  }

  await renderFeatureIndex(backendSpecs, commonSpecs)

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `docs:render: ${backendSpecs.length} backend spec(s), ${commonSpecs.length} common spec(s) [${elapsed}s]`
  )
}

async function renderFeatureBackendSpec(specFile) {
  const featureDir = path.dirname(specFile)
  const spec = await readYaml(specFile)
  const slug = featureDir.replace(featuresDir + path.sep, '').split(path.sep).pop() ?? 'feature'
  const generatedDir = path.join(featureDir, 'generated')
  await mkdir(generatedDir, { recursive: true })

  const markdown = renderBackendSpecMarkdown(spec, {
    specFile: path.relative(projectRoot, specFile),
    slug
  })

  await writeFile(path.join(generatedDir, 'backend-spec.md'), markdown, 'utf8')
}

async function renderCommonSpec(specFile) {
  const spec = await readYaml(specFile)
  const slug = path.basename(specFile, path.extname(specFile))
  const generatedDir = path.join(path.dirname(specFile), 'generated')
  await mkdir(generatedDir, { recursive: true })

  const markdown = renderCommonSpecMarkdown(spec, {
    specFile: path.relative(projectRoot, specFile),
    slug
  })

  await writeFile(path.join(generatedDir, `${slug}.md`), markdown, 'utf8')
}

async function renderFeatureIndex(backendSpecs, commonSpecs) {
  const rows = []

  for (const specFile of commonSpecs) {
    const spec = await readYaml(specFile)
    const slug = path.basename(specFile, path.extname(specFile))
    const link = vitepressLink(path.join(path.dirname(specFile), 'generated', `${slug}.md`))
    rows.push(`- [${spec.title ?? slug}](${link})`)
  }

  for (const specFile of backendSpecs) {
    const spec = await readYaml(specFile)
    const title = spec.feature?.title ?? path.basename(path.dirname(specFile))
    const link = vitepressLink(path.join(path.dirname(specFile), 'generated', 'backend-spec.md'))
    rows.push(`- [${title}](${link})`)
  }

  const apiBaseDir = path.join(docsDir, 'api-base')
  await mkdir(apiBaseDir, { recursive: true })

  await writeFile(
    path.join(apiBaseDir, 'generated.md'),
    `# Generated backend contracts\n\n${rows.join('\n') || MD_NONE}\n`,
    'utf8'
  )
}

function vitepressLink(file) {
  const relativePath = path.relative(docsDir, file).split(path.sep).join('/')
  return `/${relativePath.replace(/\.md$/, '')}`
}

async function readYaml(file) {
  return parse(await readFile(file, 'utf8')) ?? {}
}

async function listBackendSpecFiles(dir) {
  const files = []
  for (const entry of await listEntries(dir)) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'common') continue
      files.push(...(await listBackendSpecFiles(entryPath)))
      continue
    }
    if (entry.isFile() && entry.name === '01-backend-spec.yaml') {
      files.push(entryPath)
    }
  }
  return files.sort()
}

async function listCommonSpecFiles(dir) {
  const files = []
  for (const entry of await listEntries(dir)) {
    if (!entry.isFile() || !entry.name.endsWith('.yaml')) continue
    files.push(path.join(dir, entry.name))
  }
  return files.sort()
}

async function listEntries(dir) {
  try {
    return await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

if (process.argv[1] && process.argv[1].endsWith('render-backend-spec.mjs')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
