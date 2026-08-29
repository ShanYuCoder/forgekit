/**
 * FE codegen.profile → Next.js route group / Nuxt folder.
 * Dashboard chrome is only for authenticated product shells — never login/forgot/reset.
 */

export const PROFILE_LAYOUT = {
  list: 'dashboard',
  create: 'dashboard',
  edit: 'dashboard',
  detail: 'dashboard',
  'admin-crud': 'dashboard',
  'crud-standard': 'dashboard',
  'change-password': 'dashboard',
  auth: 'auth',
  public: 'public',
  'not-found': 'root',
  error: 'root',
}

export const FORM_PAGE_PROFILES = new Set(['create', 'edit', 'auth', 'change-password', 'public'])
export const ERROR_PAGE_PROFILES = new Set(['not-found', 'error'])

export const KNOWN_FE_PROFILES = new Set([
  ...Object.keys(PROFILE_LAYOUT),
])

export function feLayoutForProfile(profile) {
  const p = String(profile ?? '').trim()
  return PROFILE_LAYOUT[p] ?? 'dashboard'
}

export function isFormPageProfile(profile) {
  return FORM_PAGE_PROFILES.has(String(profile ?? '').trim())
}

export function isErrorPageProfile(profile) {
  return ERROR_PAGE_PROFILES.has(String(profile ?? '').trim())
}

/**
 * @param {string} profile
 * @param {string} [routePath]
 * @returns {string | null} error message
 */
export function wrongLayoutProfileMessage(profile, routePath) {
  const p = String(profile ?? '').trim()
  const route = String(routePath ?? '').toLowerCase()
  if (!route) return null

  if (/(^|\/)(login|sign-in|signin|forgot|forgot-password|reset|reset-password)(\/|$)/.test(route) && p !== 'auth') {
    return (
      `Route ${routePath} is public auth (login/forgot/reset). Set codegen.profile: auth ` +
      `(got ${p || 'empty'}). Profile create/list writes Next.js under src/app/(dashboard)/.`
    )
  }
  if (/(^|\/)(change-password|doi-mat-khau)(\/|$)/.test(route) && p !== 'change-password') {
    return (
      `Route ${routePath} is change-password. Set codegen.profile: change-password ` +
      `(got ${p || 'empty'}). Do not use create.`
    )
  }
  if (/(^|\/)(404|not-found)(\/|$)/.test(route) && p !== 'not-found') {
    return `Route ${routePath} is a 404 page. Set codegen.profile: not-found (got ${p || 'empty'}).`
  }
  if (/(^|\/)(503|unavailable|service-unavailable)(\/|$)/.test(route) && p !== 'error' && p !== 'public') {
    return `Route ${routePath} is a 503/error page. Set codegen.profile: error or public (got ${p || 'empty'}).`
  }
  return null
}

export function assertFeProfileMatchesRoute(profile, routePath) {
  const msg = wrongLayoutProfileMessage(profile, routePath)
  if (msg) throw new Error(msg)
}
