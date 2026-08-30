import fs from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { resolveDevAppBaseUrl } from './lib/load-dev-base-url.mjs'

import { renderSpecMarkdown } from './lib/render-spec-markdown.mjs'
import {
  irGeneratedMarkdownPath,
  irSpecPathForBundle,
  writeIrSpecMarkdownFile
} from './lib/render-bundle-markdown.mjs'

const projectRoot = process.cwd()
const docsDir = path.resolve('docs')
const featuresDir = path.join(docsDir, 'features')

function cliFlag(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
function cliBool(name) {
  return process.argv.includes(`--${name}`)
}

const hasSurfaces = fs.existsSync(path.resolve('product/surfaces'))
const defaultYamlRoot = hasSurfaces ? path.resolve('product/surfaces') : path.join(featuresDir, 'yaml')
const defaultMdRoot = hasSurfaces ? path.resolve('product/surfaces') : path.join(featuresDir, 'md')
const defaultLegacyRoot = hasSurfaces ? path.resolve('product/surfaces') : featuresDir

const yamlRoot = cliFlag('yaml-root') ? path.resolve(cliFlag('yaml-root')) : defaultYamlRoot
const mdRoot = cliFlag('md-root') ? path.resolve(cliFlag('md-root')) : defaultMdRoot
const legacyRoot = cliFlag('legacy-root') ? path.resolve(cliFlag('legacy-root')) : defaultLegacyRoot

const devAppBaseUrl = resolveDevAppBaseUrl(projectRoot)

import { renderFeatureBackendSpec, listBackendSpecFiles } from '../../scripts/backend-api/render-backend-spec.mjs'
import { writeQaList } from './lib/render-qa-list.mjs'

async function main() {
  const started = Date.now()
  const specs = await listSpecFiles(legacyRoot)
  const bundles = await listBundleFiles(yamlRoot)

  let failed = 0
  let skippedNoSplit = 0

  for (const specFile of specs) {
    try {
      await renderLegacySpec(specFile)
    } catch (error) {
      failed++
      console.error(`docs:render: FAIL ${path.relative(projectRoot, specFile)}: ${error.message ?? error}`)
    }
  }

  for (const bundleFile of bundles) {
    const specIr = irSpecPathForBundle(bundleFile)
    if (!fs.existsSync(specIr)) {
      skippedNoSplit++
      continue
    }
    try {
      const mdOut = irGeneratedMarkdownPath(bundleFile)
      await writeIrSpecMarkdownFile(specIr, mdOut, { projectRoot, devAppBaseUrl })
    } catch (error) {
      failed++
      console.error(`docs:render: FAIL ${path.relative(projectRoot, specIr)}: ${error.message ?? error}`)
    }
  }

  // Also render Backend API specs if present
  try {
    const backendSpecFiles = await listBackendSpecFiles(path.resolve('product/surfaces'))
    for (const beSpecFile of backendSpecFiles) {
      await renderFeatureBackendSpec(beSpecFile)
    }
  } catch (e) {
    /* ignore if backend specs not present */
  }

  writeQaList(projectRoot)

  if (failed > 0) {
    console.error(`docs:render: aborted index — ${failed} file(s) failed`)
    process.exit(1)
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `docs:render: ${specs.length} legacy spec(s), ${bundles.length - skippedNoSplit} ir/spec.yaml, ${skippedNoSplit} bundle(s) skipped (no split) [${elapsed}s] (includes Backend API specs)`
  )
}

async function renderLegacySpec(specFile) {
  const featureDir = path.dirname(specFile)
  const slug = featureSlug(specFile)
  const output = featureOutputPaths(specFile, slug)
  const spec = await readYaml(specFile)
  const generatedDir = path.join(featureDir, 'generated')
  const generatedTestcasesDir = path.join(generatedDir, output.testcasesDir)

  await rm(path.join(generatedDir, output.specFile), { force: true })
  await rm(path.join(generatedDir, `${slug}.spec.md`), { force: true })
  await rm(path.join(generatedDir, `${slug}.README.md`), { force: true })
  // R3: do not emit testcase MD here — use base-tests `pnpm cases:render`
  await rm(generatedTestcasesDir, { recursive: true, force: true })
  await mkdir(generatedDir, { recursive: true })

  await writeFile(
    path.join(generatedDir, output.specFile),
    renderSpecMarkdown(spec, { testcases: [], output, devAppBaseUrl, projectRoot }),
    'utf8'
  )
}

async function readYaml(file) {
  return parse(await readFile(file, 'utf8')) ?? {}
}

async function listSpecFiles(dir) {
  const files = []

  for (const entry of await listEntries(dir)) {
    const entryPath = path.join(dir, entry.name)

    if (entry.name === 'yaml' || entry.name === 'md' || entry.name === 'ir') continue

    if (entry.isDirectory()) {
      files.push(...await listSpecFiles(entryPath))
      continue
    }

    if (entry.isFile() && (entry.name === 'spec.yaml' || entry.name === 'spec.yml' || /\.spec\.ya?ml$/.test(entry.name))) {
      files.push(entryPath)
    }
  }

  return files.sort()
}

async function listBundleFiles(dir) {
  const files = []

  for (const entry of await listEntries(dir)) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...await listBundleFiles(entryPath))
      continue
    }

    if (entry.isFile() && /\.bundle\.ya?ml$/.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files.sort()
}



function featureSlug(specFile) {
  const basename = path.basename(specFile)
  if (basename === 'spec.yaml' || basename === 'spec.yml') return path.basename(path.dirname(specFile))
  return basename.replace(/\.spec\.ya?ml$/, '')
}

function featureOutputPaths(specFile, slug) {
  const basename = path.basename(specFile)
  if (basename === 'spec.yaml' || basename === 'spec.yml') {
    return {
      specFile: 'spec.md',
      testcasesDir: 'testcases'
    }
  }

  return {
    specFile: `${slug}.md`,
    testcasesDir: `${slug}/testcases`
  }
}

async function listEntries(dir) {
  try {
    return await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
