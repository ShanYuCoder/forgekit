/** Topic → arc42 chapter + skill (architecture-core / C4-SKILL-MCP-NOTES). */

export type RouteHit = {
  chapter: string
  path: string
  skill: string
  note?: string
}

const ROUTES: { keys: string[]; hit: RouteHit }[] = [
  {
    keys: ['intro', 'introduction', '01', 'scope', 'overview'],
    hit: {
      chapter: '01',
      path: 'product/overview/',
      skill: '/overview',
      note: 'product overview',
    },
  },
  {
    keys: ['constraint', '02'],
    hit: { chapter: '02', path: 'architecture/02-constraints/', skill: '/architecture' },
  },
  {
    keys: ['process', 'flow', 'journey', 'sequence', '03'],
    hit: {
      chapter: '03',
      path: 'architecture/03-business-process/',
      skill: '/business-process',
    },
  },
  {
    keys: ['strategy', 'solution', '04'],
    hit: {
      chapter: '04',
      path: 'architecture/04-solution-strategy/',
      skill: '/architecture',
      note: 'prose → ADR via /decision',
    },
  },
  {
    keys: ['component', 'cmp', 'module'],
    hit: { chapter: 'module', path: 'product/surfaces/', skill: '/module' },
  },
  {
    keys: ['surface', 'channel'],
    hit: { chapter: 'surface', path: 'product/surfaces/', skill: '/surfaces' },
  },
  {
    keys: ['deploy', 'dep', '07'],
    hit: {
      chapter: '07',
      path: 'architecture/07-deployment/',
      skill: '/deployment',
      note: 'stub-first — do not invent topology',
    },
  },
  {
    keys: ['cross', 'security', 'observ', 'config', '08'],
    hit: {
      chapter: '08',
      path: 'architecture/08-cross-cutting/',
      skill: '/cross-cutting',
    },
  },
  {
    keys: ['adr', 'decision', '09'],
    hit: { chapter: '09', path: 'architecture/09-decisions/', skill: '/decision' },
  },
  {
    keys: ['quality', '10'],
    hit: {
      chapter: '10',
      path: 'architecture/10-quality/',
      skill: '/architecture',
      note: 'stub',
    },
  },
  {
    keys: ['risk', '11'],
    hit: {
      chapter: '11',
      path: 'architecture/11-risks/',
      skill: '/architecture',
      note: 'stub',
    },
  },
  {
    keys: ['glossary', '12'],
    hit: {
      chapter: '12',
      path: 'architecture/12-glossary/',
      skill: '/architecture',
      note: 'stub',
    },
  },
]

export function routeTopic(topic: string): RouteHit[] {
  const t = topic.toLowerCase()
  const hits: RouteHit[] = []
  for (const r of ROUTES) {
    if (r.keys.some((k) => t.includes(k))) hits.push(r.hit)
  }
  if (hits.length === 0) {
    hits.push({
      chapter: '?',
      path: 'architecture/',
      skill: '/architecture',
      note: 'No keyword match — ask which layer',
    })
  }
  const seen = new Set<string>()
  return hits.filter((h) => {
    const k = h.skill + h.path
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
