import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { renderSpecMarkdown } from './render-spec-markdown.mjs'

/**
 * Flatten bundle → spec shape (tests / fallback). Prefer ir/spec.yaml for site MD.
 */
export function bundleToSpecShape(bundle) {
  const meta = {
    id: bundle['page-id'] ?? bundle.id,
    title: bundle.title,
    status: bundle.status,
    owner: bundle.owner,
    summary: bundle.summary ?? bundle.review?.summary
  }
  return {
    ...meta,
    ...(bundle.spec ?? {}),
  }
}

export function renderBundleMarkdown(bundle, context) {
  const specShape = {
    ...bundleToSpecShape(bundle),
    design: bundle.design,
    legacy: bundle.legacy,
    review: bundle.review,
    template: bundle.template
  }
  return renderSpecMarkdown(specShape, context)
}

export function renderIrSpecMarkdown(spec, context) {
  return renderSpecMarkdown(spec, { ...context, fromIrSpec: true })
}

export function bundleSlug(bundleFile) {
  return path.basename(bundleFile).replace(/\.bundle\.ya?ml$/, '')
}

/**
 * docs/features/yaml/admin/hotel/list/foo.bundle.yaml → docs/features/md/admin/hotel/list/foo.md
 * @param {string} bundleFile
 */
export function bundleMarkdownOutputPath(bundleFile, docsDir, yamlRoot, mdRoot) {
  const yRoot = yamlRoot ?? path.join(docsDir, 'features', 'yaml')
  const mRoot = mdRoot ?? path.join(docsDir, 'features', 'md')
  const rel = path.relative(yRoot, bundleFile)
  const mdRel = rel.replace(/\.bundle\.ya?ml$/, '.md')
  return path.join(mRoot, mdRel)
}

export function bundleTestcaseDir(bundleFile) {
  return path.dirname(bundleFile)
}

export function colocatedBundleMarkdownPath(bundleFile) {
  return bundleFile.replace(/\.bundle\.ya?ml$/i, '.md')
}

/** VitePress + GitHub catalog: `…/<leaf>/ir/generated/spec.md` */
export function irGeneratedMarkdownPath(bundleFile) {
  const dir = path.dirname(path.resolve(bundleFile))
  return path.join(dir, 'ir', 'generated', 'spec.md')
}

export function irSpecPathForBundle(bundleFile) {
  return path.join(path.dirname(path.resolve(bundleFile)), 'ir', 'spec.yaml')
}

/**
 * VitePress MD from ir/spec.yaml → ir/generated. No-op if split has not run.
 */
export async function writeBundleMarkdownFile(bundleFile, context = {}) {
  const specFile = irSpecPathForBundle(bundleFile)
  if (!existsSync(specFile)) return null
  return writeIrSpecMarkdownFile(specFile, irGeneratedMarkdownPath(bundleFile), context)
}

export async function writeIrSpecMarkdownFile(specFile, mdOut, context = {}) {
  const spec = parse(await readFile(specFile, 'utf8')) ?? {}
  const projectRoot = context.projectRoot ?? process.cwd()
  const markdown = renderIrSpecMarkdown(spec, {
    testcases: [],
    output: { specFile: path.basename(mdOut), testcasesDir: 'testcases' },
    devAppBaseUrl: context.devAppBaseUrl ?? '',
    projectRoot,
  })
  await mkdir(path.dirname(mdOut), { recursive: true })
  await writeFile(mdOut, markdown, 'utf8')
  return mdOut
}
