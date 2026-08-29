/**
 * Next.js app paths under src/ (portal-gen output root).
 */

import { feLayoutForProfile } from '../../../../shared/fe-layout-profiles.mjs'

export const WEB_SRC = 'src'

/** @param {string} routePath e.g. /hotels */
/** @param {string} [profile] codegen.profile */
export function routeToAppPagePath(routePath, profile) {
  const layout = feLayoutForProfile(profile)
  const trimmed = String(routePath ?? '')
    .replace(/^\//, '')
    .replace(/\/$/, '')

  if (layout === 'root') {
    return String(profile).trim() === 'not-found'
      ? `${WEB_SRC}/app/not-found.tsx`
      : `${WEB_SRC}/app/error.tsx`
  }

  const group = layout === 'auth' ? '(auth)' : layout === 'public' ? '(public)' : '(dashboard)'
  if (!trimmed) return `${WEB_SRC}/app/${group}/page.tsx`
  return `${WEB_SRC}/app/${group}/${trimmed}/page.tsx`
}

/** @param {string} file e.g. hotel.service.ts */
export function webServicePath(file) {
  return `${WEB_SRC}/services/${file}`
}

/** @param {string} file e.g. hotel/useHotelList.ts */
export function webHookPath(file) {
  return `${WEB_SRC}/hooks/${file}`
}

/** @param {string} file e.g. hotel.mock.ts */
export function webMockPath(file) {
  return `${WEB_SRC}/mocks/${file}`
}

/** @param {string} file e.g. hotel/schemas.ts */
export function webValidationPath(file) {
  return `${WEB_SRC}/validations/${file}`
}

/** @param {string} file e.g. hotel/HotelForm.tsx */
export function webComponentPath(file) {
  return `${WEB_SRC}/components/${file}`
}

/** @param {string} file e.g. useHotelStore.ts */
export function webStorePath(file) {
  return `${WEB_SRC}/stores/${file}`
}

/** @param {string} relativePath */
export function isNextPagePath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/')
  return (
    /\/app\/\((dashboard|auth|public)\)\//.test(normalized) && normalized.endsWith('/page.tsx')
  ) || normalized.endsWith('/app/not-found.tsx') || normalized.endsWith('/app/error.tsx')
}
