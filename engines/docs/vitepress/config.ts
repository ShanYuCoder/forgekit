import { withMermaid } from 'vitepress-plugin-mermaid'
import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { buildSurfacesSidebarItems, SKIP_NAV_DIRS, markdownNavText } from './surfaces-nav.mjs'

import { fileURLToPath } from 'node:url'

const projectRoot = process.cwd()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')

const hasProductArchitecture = fs.existsSync(path.join(projectRoot, 'product', 'architecture')) || fs.existsSync(path.join(docsDir, 'product', 'architecture'))
const archPrefix = hasProductArchitecture ? '/product/architecture' : '/architecture'

const hasProductOverview = fs.existsSync(path.join(projectRoot, 'product', 'overview')) || fs.existsSync(path.join(docsDir, 'product', 'overview'))
const overviewPrefix = hasProductOverview ? '/product/overview' : '/overview'

const hasProductSurfaces = fs.existsSync(path.join(projectRoot, 'product', 'surfaces')) || fs.existsSync(path.join(docsDir, 'product', 'surfaces'))
const surfacesPrefix = hasProductSurfaces ? '/product/surfaces' : '/surfaces'

function buildRecursiveSidebar(dirPath: string, urlPrefix: string): any[] {
// ... existing buildRecursiveSidebar body ...
  if (!fs.existsSync(dirPath)) return []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const items: any[] = []

    // Read files first (excluding index.md)
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
        const filePath = path.join(dirPath, entry.name)
        const nameWithoutExt = entry.name.replace(/\.md$/, '')
        let title = nameWithoutExt
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          title = markdownNavText(entry.name, content) || content.match(/^#\s+(.+)$/m)?.[1]?.trim() || nameWithoutExt
        } catch {}
        items.push({
          text: title,
          link: `${urlPrefix}${nameWithoutExt}`
        })
      }
    }

    attachGeneratedDocs(dirPath, urlPrefix, items)

    // Read directories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_NAV_DIRS.has(entry.name)) continue
        const subDirPath = path.join(dirPath, entry.name)
        const indexPath = path.join(subDirPath, 'index.md')
        let title = /^db-erd$/i.test(entry.name) ? 'db-erd' : entry.name
        let link = undefined

        if (fs.existsSync(indexPath) && !/^db-erd$/i.test(entry.name)) {
          try {
            const content = fs.readFileSync(indexPath, 'utf8')
            const short = markdownNavText('index.md', content)
            const titleMatch = content.match(/^#\s+(.+)$/m)
            if (short) title = short
            else if (titleMatch) title = titleMatch[1].trim()
          } catch {}
          link = `${urlPrefix}${entry.name}/`
        } else if (fs.existsSync(indexPath)) {
          link = `${urlPrefix}${entry.name}/`
        }

        const subItems = buildRecursiveSidebar(subDirPath, `${urlPrefix}${entry.name}/`)

        const item: any = { text: title }
        if (link) item.link = link
        if (subItems.length > 0) {
          item.items = subItems
          item.collapsed = true
        }
        
        if (link || subItems.length > 0) {
          items.push(item)
        }
      }
    }

    return items
  } catch (e) {
    return []
  }
}

function mdTitleFromFile(filePath: string, fallback: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (titleMatch) return titleMatch[1].trim()
  } catch {}
  return fallback
}

function attachGeneratedDocs(dirPath: string, urlPrefix: string, items: any[]) {
  const spec = path.join(dirPath, 'ir', 'generated', 'spec.md')
  if (fs.existsSync(spec)) {
    items.push({
      text: mdTitleFromFile(spec, 'spec'),
      link: `${urlPrefix}ir/generated/spec`,
    })
  }
}

function getSurfacesSidebar(root: string, docsDir: string) {
  let surfacesDir = path.join(root, 'product', 'surfaces')
  if (!fs.existsSync(surfacesDir) && (fs.existsSync(path.join(docsDir, 'surfaces')) || fs.existsSync(path.join(root, 'surfaces')))) {
    surfacesDir = fs.existsSync(path.join(docsDir, 'surfaces')) ? path.join(docsDir, 'surfaces') : path.join(root, 'surfaces')
  }
  return buildSurfacesSidebarItems(surfacesDir, `${surfacesPrefix}/`)
}

function getOverviewSidebar(root: string, docsDir: string) {
  let overviewDir = path.join(root, 'product', 'overview')
  if (!fs.existsSync(overviewDir) && (fs.existsSync(path.join(docsDir, 'overview')) || fs.existsSync(path.join(root, 'overview')))) {
    overviewDir = fs.existsSync(path.join(docsDir, 'overview')) ? path.join(docsDir, 'overview') : path.join(root, 'overview')
  }
  return buildRecursiveSidebar(overviewDir, `${overviewPrefix}/`)
}

function getBusinessProcessSidebarItems(root: string, prefix: string) {
  const processDir = path.join(root, prefix.replace(/^\//, ''), '03-business-process')
  if (!fs.existsSync(processDir)) return []
  try {
    const entries = fs.readdirSync(processDir, { withFileTypes: true })
    const items = []
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const nameWithoutExt = entry.name.replace(/\.md$/, '')
        if (nameWithoutExt === 'index') continue
        let title = nameWithoutExt
        const content = fs.readFileSync(path.join(processDir, entry.name), 'utf8')
        title = markdownNavText(entry.name, content) || nameWithoutExt
        items.push({
          text: title,
          link: `${prefix}/03-business-process/${nameWithoutExt}`
        })
      }
    }
    return items
  } catch (e) {
    return []
  }
}

function getCrossCuttingSidebarItems(root: string, prefix: string) {
  const crossDir = path.join(root, prefix.replace(/^\//, ''), '08-cross-cutting')
  if (!fs.existsSync(crossDir)) return []
  try {
    const entries = fs.readdirSync(crossDir, { withFileTypes: true })
    const items = []
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const nameWithoutExt = entry.name.replace(/\.md$/, '')
        if (nameWithoutExt === 'index') continue
        let title = nameWithoutExt
        const content = fs.readFileSync(path.join(crossDir, entry.name), 'utf8')
        title = markdownNavText(entry.name, content) || content.match(/^#\s+(.+)$/m)?.[1]?.trim() || nameWithoutExt
        items.push({
          text: title,
          link: `${prefix}/08-cross-cutting/${nameWithoutExt}`
        })
      }
    }
    return items.sort((a, b) => a.text.localeCompare(b.text))
  } catch (e) {
    return []
  }
}

export default withMermaid(
  defineConfig({
    title: 'Base Docs',
    description: 'Platform docs hub — arc42 + product Code/common (R2)',
    cleanUrls: true,
    ignoreDeadLinks: true,
    srcExclude: [
      '**/node_modules/**',
      '**/scripts/**',
      '**/registries/**',
      '**/.cursor/**',
      '**/package.json',
      '**/platform-repos*.json',
      '**/legacy-repos*.json',
      '**/product/**/code/**/*.yaml',
      '**/product/**/code/**/ir/**',
      '**/ir/*.yaml',
      '**/qa/open/**',
    ],
    // Node sizes are computed from this font size — keep in sync with the CSS pin in theme/custom.css
    mermaid: {
      themeVariables: {
        fontSize: '18px',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        padding: 16,
        nodeSpacing: 50,
        rankSpacing: 60,
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 40,
        diagramMarginY: 20,
        actorMargin: 50,
        boxMargin: 12,
      },
    },
    vite: {
      resolve: {
        dedupe: ['vue', 'vitepress', 'vitepress-plugin-mermaid', 'vitepress-mermaid-renderer'],
      },
      // vitepress-plugin-mermaid forces these into optimizeDeps; pnpm needs them as direct deps
      // (see .npmrc public-hoist-pattern). Do NOT alias dayjs → 'dayjs/' (breaks absolute resolve).
      optimizeDeps: {
        include: [
          'mermaid',
          'dayjs',
          'debug',
          'cytoscape',
          'cytoscape-cose-bilkent',
          '@braintree/sanitize-url',
        ],
      },
    },
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Overview', link: `${overviewPrefix}/` },
        { text: 'Surfaces', link: `${surfacesPrefix}/` },
      ],
      sidebar: [
        {
          text: 'Readme',
          collapsed: false,
          items: [
            { text: 'Readme', link: '/README' },
          ],
        },
        {
          text: 'Overview',
          collapsed: false,
          items: [
            { text: 'Overview', link: `${overviewPrefix}/` },
            ...getOverviewSidebar(projectRoot, docsDir)
          ]
        },
        {
          text: 'Surfaces',
          collapsed: false,
          items: getSurfacesSidebar(projectRoot, docsDir),
        },
        {
          text: 'Architecture',
          collapsed: false,
          items: [
            { text: '01 Introduction', link: `${archPrefix}/01-introduction/` },
            { text: '02 Constraints', link: `${archPrefix}/02-constraints/` },
            {
              text: '03 Business Processes',
              collapsed: true,
              items: [
                { text: 'Catalog', link: `${archPrefix}/03-business-process/` },
                ...getBusinessProcessSidebarItems(projectRoot, archPrefix),
              ],
            },
            { text: '04 Solution Strategy', link: `${archPrefix}/04-solution-strategy/` },
            { text: '07 Deployment', link: `${archPrefix}/07-deployment/` },
            {
              text: '08 Cross-cutting',
              collapsed: true,
              items: [
                { text: 'Index', link: `${archPrefix}/08-cross-cutting/` },
                ...getCrossCuttingSidebarItems(projectRoot, archPrefix),
              ],
            },
            { text: '09 Decisions', link: `${archPrefix}/09-decisions/` },
            {
              text: '10–12 Quality & Risks',
              collapsed: true,
              items: [
                { text: '10 Quality', link: `${archPrefix}/10-quality/` },
                { text: '11 Risks', link: `${archPrefix}/11-risks/` },
                { text: '12 Glossary', link: `${archPrefix}/12-glossary/` },
              ],
            },
            { text: 'Architecture Trace', link: '/ARCHITECTURE-TRACE' },
            { text: 'Legacy dynamics', link: '/product/legacy-dynamics/' },
          ],
        },
        {
          text: 'QA',
          collapsed: true,
          items: [{ text: 'Danh sách QA', link: '/qa/' }],
        },
      ],
    },
  }),
)
