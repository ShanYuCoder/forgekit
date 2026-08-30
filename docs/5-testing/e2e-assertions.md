# Playwright Semantic UI Assertions

> **Lane E2E:** [TEST-PHASE-DIAGRAM](../2-lifecycle/overview.md) — bundle `#e2e:*` + codegen PR13a.  
> **Registry:** `registries/e2e-test.registry.json` · `pnpm portal:e2e-registry`

Tài liệu thiết kế bộ assertion common cho E2E web Platform Base. Mục tiêu là có một lớp kiểm tra UI dùng lại được giữa các module, bắt sớm lỗi console, asset, overflow, layout vỡ, table/grid lệch, accessibility và design token drift.

Tham khảo chính:

- [axe-core](https://github.com/dequelabs/axe-core?utm_source=chatgpt.com) — accessibility engine cho automated Web UI testing, hỗ trợ WCAG 2.0/2.1/2.2 A/AA/AAA và best practices.
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing?utm_source=chatgpt.com) — dùng `@axe-core/playwright`, scan toàn page hoặc một phần page, `withTags()`, `exclude()`, `disableRules()`, attachment kết quả.
- [Cypress Accessibility Testing](https://docs.cypress.io/app/guides/accessibility-testing?utm_source=chatgpt.com) — nhấn mạnh automated scan không chứng minh UI fully accessible; cần thêm assertion có chủ đích về semantic HTML, keyboard, label, alt text, behavior.

## 1. Nguyên tắc

Semantic UI Assertions không thay thế functional E2E. Chúng là smoke guard chạy sau khi page vào trạng thái cần test, giúp phát hiện lỗi “UI vẫn render nhưng đã hỏng”.

Áp dụng theo 3 lớp:

- Level 1: chạy được cho mọi project/web page, ít phụ thuộc design system.
- Level 2: kiểm tra layout shell, grid, table, overlap; nên chạy cho page quan trọng hoặc sau state thay đổi lớn.
- Level 3: kiểm tra design token; chỉ chạy cho project có token source rõ ràng.

Không gom tất cả vào một matcher mơ hồ. Nên có matcher nhỏ, lỗi rõ, và một helper preset để gọi nhanh trong smoke test.

## 2. Vị Trí Trong Portal

Repo hiện đã có Playwright ở `tests/e2e/` và helper layout ở `tests/e2e/helpers/assertLayoutIntegrity.ts`. Nên mở rộng cùng khu vực này:

```text
tests/e2e/
├── fixtures/
│   └── semantic-ui.ts
├── helpers/
│   ├── semantic-ui/
│   │   ├── accessibility.ts
│   │   ├── assets.ts
│   │   ├── designTokens.ts
│   │   ├── grid.ts
│   │   ├── layout.ts
│   │   ├── renderReady.ts
│   │   ├── table.ts
│   │   └── textOverflow.ts
│   ├── assertLayoutIntegrity.ts
│   └── layoutIntegrity.ts
└── semantic-ui/
    ├── axe-spike.spec.ts
    └── semantic-ui.examples.spec.ts
```

Trạng thái hiện tại:

- Đã cài `@axe-core/playwright` và `axe-core`.
- Đã có fixture opt-in `tests/e2e/fixtures/semantic-ui.ts`.
- Đã có spike spec `tests/e2e/semantic-ui/axe-spike.spec.ts`.
- Đã có example spec Level 1 `tests/e2e/semantic-ui/semantic-ui.examples.spec.ts`.
- Đã có contract specs `tests/e2e/semantic-ui/semantic-ui.helpers.spec.ts` cho positive/negative cases của helpers.
- `waitForSemanticUiReady` đã hỗ trợ visible/attached/hidden/detached/url/fonts/images/stable bounding boxes.
- Runtime capture đã bắt `console.error`, `pageerror`, `requestfailed`, HTTP response `>=400` và có filter allowlist.
- `semanticUi` fixture đã dùng `testInfo` để attach axe JSON report.
- `assertLayoutIntegrity` cũ đã được refactor thành wrapper gọi semantic UI layout helpers.
- Spec cũ vẫn import từ `@playwright/test`; spec mới import từ fixture semantic UI khi cần custom assertions.

Đề xuất API import trong spec:

```ts
import { expect, test } from '../fixtures/semantic-ui'

test('customer list semantic ui', async ({ page, consoleErrors }) => {
  await page.goto('/customers')

  await expect(page).toHaveNoConsoleErrors(consoleErrors)
  await expect(page).toHaveNoHorizontalScroll()
  await expect(page).toHaveNoBrokenImages()
  await expect(page.getByTestId('customers-page')).toHaveNoTextOverflow()
})
```

Với Portal hiện tại, có thể giữ helper cũ `assertLayoutIntegrity(page)` trong giai đoạn đầu. Khi implement matcher mới, `assertLayoutIntegrity` nên trở thành wrapper gọi các matcher Level 1/2 tương ứng để không tồn tại hai logic kiểm tra layout khác nhau.

## 3. Dependency & Library Spike

`package.json` đã có `@playwright/test`, `@axe-core/playwright` và `axe-core`. Khi dựng project mới hoặc clone môi trường chưa cài dependency, bước đầu tiên của implementation vẫn là cài thư viện và spike API trước, không để cuối roadmap.

```bash
pnpm add -D @axe-core/playwright axe-core
```

Sau khi cài, cần làm spike ngắn để xác nhận thư viện cung cấp gì dùng được cho helper E2E:

- Import được `AxeBuilder` từ `@axe-core/playwright`.
- Chạy được `.withTags()`, `.include()`, `.exclude()`, `.disableRules()`, `.analyze()`.
- Xác nhận shape của `results.violations`, `results.incomplete`, `violation.id`, `violation.nodes[].target`.
- Xác nhận attachment JSON trong Playwright report.
- Liệt kê rule ids thực tế dùng cho preset: accessible names, ARIA, media, contrast, document semantics.

Khuyến nghị dùng `@axe-core/playwright` thay vì tự inject `axe.min.js`, vì Playwright docs đã chuẩn hóa `AxeBuilder`. Config/spike đề xuất:

```ts
// tests/e2e/helpers/semantic-ui/accessibility.ts
import AxeBuilder from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'

export type A11yScanOptions = {
  include?: string
  exclude?: string[]
  tags?: string[]
  disableRules?: string[]
}

export async function scanA11y(
  page: Page,
  testInfo: TestInfo,
  options: A11yScanOptions = {}
) {
  let builder = new AxeBuilder({ page })
    .withTags(options.tags ?? ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])

  if (options.include) builder = builder.include(options.include)
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector)
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules)

  const results = await builder.analyze()

  await testInfo.attach('accessibility-scan-results', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })

  return results
}
```

## 4. Level 1 — Common Global

### `waitForSemanticUiReady`

Testcase decorator:

```md
@semantic-ready
- Root test id: `{module}-page`
- Wait visible test ids: `{module}-table`, `{module}-primary-action-btn`
- Wait fonts: true
- Wait images: visible
- Loading indicators that must disappear: `{module}-loading`
- Network idle required: false
```

Mục tiêu: mọi semantic assertion chạy sau khi page render xong, tránh dùng `waitForTimeout()` rời rạc trong spec.

Đây là helper/trait bắt buộc gọi trước Level 1/2/3 assertions:

```ts
await waitForSemanticUiReady(page, {
  rootTestId: 'customers-page',
  waitForTestIds: ['customers-table'],
  waitForFonts: true,
  waitForImages: 'visible',
  waitForNetworkIdle: false,
})
```

Check:

- `page.waitForLoadState('domcontentloaded')`.
- Root page `[data-testid="{module}-page"]` visible.
- Các test id quan trọng visible hoặc attached.
- `document.fonts.ready` nếu browser hỗ trợ, để tránh đo text trước khi font load.
- Ảnh visible `complete === true` trước khi chạy broken image/text overflow.
- Không mặc định `networkidle` cho Nuxt app vì dễ treo với polling/analytics; chỉ bật khi page cần.

Options:

```ts
type SemanticUiReadyOptions = {
  rootTestId?: string
  waitForTestIds?: string[]
  waitForFonts?: boolean
  waitForImages?: 'none' | 'visible' | 'all'
  waitForNetworkIdle?: boolean
  timeout?: number
}
```

Rule:

- Dùng helper này thay `page.waitForTimeout()` trong semantic specs.
- Nếu UI có loading skeleton, spec phải wait loading hidden trước rồi mới scan.
- Dialog/menu/popover phải được mở trước khi gọi helper nếu muốn scan state đó.

### `toHaveNoHorizontalScroll`

Testcase decorator:

```md
@assertion toHaveNoHorizontalScroll
- Scope: page | `{module}-page`
- Viewports: desktop `1440x900`, mobile `390x844`
- Allowed horizontal scroll containers: `{module}-table-scroll`
- Tolerance px: 2
- Expected: document/page shell has no horizontal scrollbar
```

Mục tiêu: page không sinh scroll ngang ngoài ý muốn.

Check:

- `document.documentElement.scrollWidth <= window.innerWidth + tolerance`
- `document.body.scrollWidth <= window.innerWidth + tolerance`
- Có thể scan thêm container chính như `[data-testid$="-page"]`.

Options:

```ts
type NoHorizontalScrollOptions = {
  tolerance?: number
  rootSelector?: string
}
```

Rule:

- Gọi sau `page.goto()` và sau khi dữ liệu/mock API đã render.
- Nếu page có table scroll ngang chủ động, scope vào page shell và exclude table scroll container.

### `toHaveNoConsoleErrors`

Testcase decorator:

```md
@assertion toHaveNoConsoleErrors
- Capture from: test start
- Include: console.error, pageerror
- Optional include failed requests: document/script/stylesheet/image/font
- Ignore patterns with reason: none
- Expected: no unexpected browser/runtime errors
```

Mục tiêu: fail khi browser phát sinh `console.error`, `pageerror`, request lỗi asset/runtime quan trọng.

Fixture nên collect từ đầu test:

```ts
test.beforeEach(async ({ page }, testInfo) => {
  page.on('console', message => {
    if (message.type() === 'error') {
      // push vào consoleErrors fixture
    }
  })
  page.on('pageerror', error => {
    // push vào consoleErrors fixture
  })
})
```

Options:

```ts
type ConsoleErrorsOptions = {
  ignorePatterns?: RegExp[]
}
```

Rule:

- Không ignore rộng kiểu `/error/i`.
- Chỉ ignore known noise có issue/ticket hoặc comment ngắn trong spec.
- Nên chạy ở mọi smoke spec.

### `toHaveNoBrokenImages`

Testcase decorator:

```md
@assertion toHaveNoBrokenImages
- Scope: `{module}-page`
- Image state before scan: visible images loaded
- Lazy images: scroll into view | not applicable
- Decorative images allowed: true
- Expected: every scanned image has currentSrc, complete, natural size > 0
```

Mục tiêu: không có ảnh bị lỗi load, `src` rỗng, natural size bằng `0`.

Check:

- `img.currentSrc || img.src` không rỗng.
- `img.complete === true`.
- `img.naturalWidth > 0 && img.naturalHeight > 0`.
- Với lazy image, scroll hoặc wait đến state cần test trước khi assert.

Options:

```ts
type BrokenImagesOptions = {
  selector?: string
  includeHidden?: boolean
  allowEmptyAlt?: boolean
}
```

Nên tách `allowEmptyAlt` khỏi accessibility. Ảnh decorative có thể `alt=""`, nhưng ảnh content cần alt text và nên được axe/accessibility scan bắt thêm.

### `toHaveNoTextOverflow`

Testcase decorator:

```md
@assertion toHaveNoTextOverflow
- Scope: `{module}-page`
- Long text data: describe fields that contain long content
- Allowed truncate test ids: `{module}-description`
- Allowed scroll containers: `{module}-table-scroll`
- Tolerance px: 2
- Expected: no unexpected clipped or overflowing visible text
```

Mục tiêu: text không bị cắt/tràn ngoài container ngoài ý muốn.

Check:

- Element visible.
- `scrollWidth <= clientWidth + tolerance`.
- `scrollHeight <= clientHeight + tolerance`.
- Bỏ qua element có overflow scroll/auto chủ đích.
- Với text truncate chủ đích, cần opt-in bằng attribute hoặc option exclude.

Options:

```ts
type TextOverflowOptions = {
  selector?: string
  tolerance?: number
  excludeTestIds?: string[]
  allowTruncate?: boolean
}
```

Rule:

- Không scan toàn bộ `body` mặc định nếu page lớn. Ưu tiên scope vào `[data-testid$="-page"]`.
- Các component truncate chủ đích nên có convention: `data-overflow-allowed="true"`.

## 5. Level 1b — Accessibility Common

Không nằm trong list ban đầu nhưng nên đưa vào common vì là tiêu chuẩn web phổ biến.

### `toHaveNoA11yViolations`

Testcase decorator:

```md
@assertion toHaveNoA11yViolations
- Include selector: `[data-testid="{module}-page"]`
- Exclude selectors: none
- WCAG tags: wcag2a, wcag2aa, wcag21a, wcag21aa
- Disabled axe rules with reason: none
- Attach full scan result: on failure
- Expected: zero axe violations for selected scope
```

Mục tiêu: chạy axe scan cho page hoặc một vùng cụ thể.

API:

```ts
await expect(page).toHaveNoA11yViolations({
  include: '[data-testid="customers-page"]',
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
})
```

Theo Playwright docs, nên dùng:

- `new AxeBuilder({ page }).analyze()`
- `.include(selector)` để scan vùng cụ thể.
- `.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])` để tập trung WCAG A/AA.
- `testInfo.attach()` để lưu full result khi debug.

Rule:

- Automated accessibility scan chỉ bắt một phần vấn đề. Theo axe-core, automated checks không bao phủ toàn bộ WCAG và có case cần manual review.
- Không snapshot toàn bộ `violations`; nếu cần baseline known issues thì snapshot fingerprint: rule id + targets.
- Không dùng `disableRules()` trừ khi có lý do rõ và có kế hoạch fix.

### Common A11y Assertions Nên Có

- `toHaveSemanticButtons`: button action nên là `<button>` hoặc link thật khi điều hướng.
- `toHaveLabeledFormControls`: input/select/textarea có label hoặc accessible name.
- `toHaveValidHeadingStructure`: có `h1`, không nhảy cấp heading nghiêm trọng.
- `toHaveKeyboardReachableActions`: action chính focus được bằng keyboard.
- `toHaveAccessibleImages`: ảnh content có alt text; ảnh decorative dùng `alt=""`.

Những assertion này bổ sung cho axe, vì Cypress docs lưu ý locator theo role không tự chứng minh element accessible; cần assert semantic HTML/behavior cụ thể.

### Axe Rule Presets Nên Đóng Gói

Các preset này dùng axe-core rules bên dưới, nhưng API trong spec vẫn là semantic matcher dễ đọc.

#### `toHaveValidAccessibleNames`

Testcase decorator:

```md
@assertion toHaveValidAccessibleNames
- Scope: `{module}-page`
- Controls to verify: inputs, buttons, links, selects
- Expected accessible names: describe labels/names for critical controls
- Known decorative/unnamed exceptions: none
- Axe rules: button-name, link-name, aria-input-field-name, select-name, label
```

Mục tiêu: controls/links/buttons có accessible name.

Rule axe liên quan:

- `button-name`
- `link-name`
- `aria-input-field-name`
- `select-name`
- `label`

API:

```ts
await expect(page).toHaveValidAccessibleNames({
  include: '[data-testid="auth-login-page"]',
})
```

#### `toHaveValidAria`

Testcase decorator:

```md
@assertion toHaveValidAria
- Scope: `{module}-page`
- Interactive widgets: dialog, select, menu, tabs, table
- Expected ARIA states: describe expanded/selected/invalid states if relevant
- Known ARIA exceptions: none
- Axe rules: aria-allowed-attr, aria-valid-attr, aria-required-attr, aria-roles, aria-hidden-focus
```

Mục tiêu: ARIA không sai attribute/role/state.

Rule axe liên quan:

- `aria-allowed-attr`
- `aria-valid-attr`
- `aria-valid-attr-value`
- `aria-required-attr`
- `aria-roles`
- `aria-hidden-focus`

API:

```ts
await expect(page).toHaveValidAria({
  include: '[data-testid="customers-page"]',
})
```

#### `toHaveAccessibleMedia`

Testcase decorator:

```md
@assertion toHaveAccessibleMedia
- Scope: `{module}-page`
- Content images requiring alt: list test ids or purpose
- Decorative images allowed: describe selectors expected to use `alt=""`
- SVG role expectation: img | presentation
- Axe rules: image-alt, input-image-alt, svg-img-alt, object-alt
```

Mục tiêu: ảnh/media có text alternative phù hợp.

Rule axe liên quan:

- `image-alt`
- `input-image-alt`
- `svg-img-alt`
- `object-alt`

API:

```ts
await expect(page).toHaveAccessibleMedia({
  include: '[data-testid="customers-page"]',
})
```

#### `toHaveReadableContrast`

Testcase decorator:

```md
@assertion toHaveReadableContrast
- Scope: `{module}-page`
- Theme: light | dark | tailwind-admin-theme
- Critical text: headings, labels, buttons, alerts
- Known contrast exceptions: none
- Axe rules: color-contrast
```

Mục tiêu: text đủ contrast theo WCAG.

Rule axe liên quan:

- `color-contrast`

API:

```ts
await expect(page).toHaveReadableContrast({
  include: '[data-testid="auth-login-page"]',
})
```

Note: `color-contrast` cần browser thật. Không dựa vào JSDOM/happy-dom cho rule này.

#### `toHaveValidDocumentSemantics`

Testcase decorator:

```md
@assertion toHaveValidDocumentSemantics
- Route: `/path`
- Expected page title: text or pattern
- Expected html lang: `en` | `vi` | `ja`
- Expected h1: page heading text
- Expected landmarks: main, navigation if present
- Axe rules: document-title, html-has-lang, html-lang-valid, landmark-one-main, page-has-heading-one, heading-order, duplicate-id
```

Mục tiêu: document/page shell có semantic nền tảng.

Rule axe liên quan:

- `document-title`
- `html-has-lang`
- `html-lang-valid`
- `landmark-one-main`
- `page-has-heading-one`
- `heading-order`
- `duplicate-id`

API:

```ts
await expect(page).toHaveValidDocumentSemantics()
```

Rule:

- Với Nuxt app, `document-title` và `html-has-lang` nên chạy ở smoke public/auth page.
- `duplicate-id` nên chạy mọi page có form/dialog/table vì dễ gây lỗi assistive technology.
- `heading-order` có thể warning trước rồi nâng lên fail khi legacy page đã sạch.

## 6. Level 2 — Layout

### `toHaveNoElementOverlap`

Testcase decorator:

```md
@assertion toHaveNoElementOverlap
- Scope: `{module}-page`
- Scan selector: `[data-testid]`
- Allowed overlays: app-toast, app-dialog, popover, tooltip
- Ignore overlap pairs with reason: none
- Min intersection area px2: 64
- Expected: no visible non-overlay elements overlap unexpectedly
```

Mục tiêu: không có element visible đè nhau ngoài ý muốn.

Check:

- Lấy bounding box của các target visible.
- Bỏ qua quan hệ parent-child.
- Bỏ qua overlay/fixed/sticky hợp lệ: dialog, popover, tooltip, toast.
- Fail nếu intersection area vượt ngưỡng.

Options:

```ts
type ElementOverlapOptions = {
  selector?: string
  minIntersectionArea?: number
  excludeTestIds?: string[]
  ignorePairs?: Array<[string, string]>
}
```

Rule:

- Scope theo page/module: `[data-testid="customers-page"] [data-testid]`.
- Không scan mọi DOM node. Chỉ scan `[data-testid]` để giảm false positive.
- Dialog/popover nên test ở spec riêng với expected overlay.

### `toHaveAlignedGrid`

Testcase decorator:

```md
@assertion toHaveAlignedGrid
- Grid root test id: `{module}-grid`
- Item selector/test id: `{module}-card`
- Expected columns by viewport: desktop 4, tablet 2, mobile 1
- Expected gap token or px: spacing.4 | 16
- Masonry layout: false
- Expected: items align by row/column within tolerance
```

Mục tiêu: grid/card/list không lệch hàng/cột do CSS hoặc responsive break.

Check:

- Các item trong cùng row có top gần nhau.
- Các column có left/x spacing nhất quán theo tolerance.
- Gap giữa items nằm trong token hoặc option.

Options:

```ts
type AlignedGridOptions = {
  itemSelector: string
  columns?: number
  rowTolerance?: number
  columnTolerance?: number
  expectedGap?: number | number[]
}
```

Rule:

- Bắt buộc truyền `itemSelector`; không auto đoán.
- Nên chạy ở viewport đại diện: desktop, tablet, mobile.
- Với masonry layout, không dùng matcher này.

### `toHaveValidTableLayout`

Testcase decorator:

```md
@assertion toHaveValidTableLayout
- Table test id: `{module}-table`
- Expected columns: name, status, createdAt, actions
- Action/expand columns: actions
- Horizontal scroll allowed: true | false
- Long cell content fields: name, description
- Expected: header/body columns align and cells do not overflow unexpectedly
```

Mục tiêu: table không vỡ layout, header/body khớp cột, cell không overflow bất thường.

Check:

- Có table role/markup hợp lệ (`table`, `thead`, `tbody`, `tr`, `th`, `td`) hoặc data table component có structure rõ.
- Số header cell và body cell khớp, trừ column action/expand có khai báo.
- Width header/body cùng column lệch trong tolerance.
- Không có cell text overflow ngoài ý muốn.

Options:

```ts
type ValidTableLayoutOptions = {
  tableSelector?: string
  tolerance?: number
  allowHorizontalScroll?: boolean
  actionColumnTestId?: string
}
```

Rule:

- Portal table nên có `{module}-table`.
- Row dùng `{entity}-row` và `data-{entity}-id`.
- Nếu table cần scroll ngang, scroll container phải rõ ràng và page không được scroll ngang.

### Preset `toHaveStableLayout`

Đây là matcher tổng hợp cho câu “không được vỡ layout, element lộn xộn đè lên nhau”.

```ts
await expect(page.getByTestId('customers-page')).toHaveStableLayout({
  textOverflow: true,
  overlap: true,
  table: ['customers-table'],
})
```

Chuẩn hóa lại từ helper hiện có:

- `overflow` hiện tại → tách thành `toHaveNoHorizontalScroll` cho page và `toHaveNoTextOverflow` cho text/container.
- `collapsed` hiện tại → tách thành `toHaveRenderedPageShell`, `toHaveVisibleCriticalElements`, `toHaveValidTableLayout`.
- `overlap` hiện tại → `toHaveNoElementOverlap`.
- Accessibility không map vào `assertLayoutIntegrity`; dùng `toHaveNoA11yViolations` chạy bằng `@axe-core/playwright`.

Lý do: axe-core chuyên kiểm tra accessibility tree, ARIA, label, contrast, semantic HTML và WCAG rules. Các lỗi geometry như element overlap, grid lệch, text overflow, horizontal scroll là visual layout assertions riêng; không nên kỳ vọng axe bắt được hết.

API wrapper compatibility:

```ts
await assertLayoutIntegrity(page, {
  rootTestId: 'customers-page',
  checks: ['horizontal-scroll', 'text-overflow', 'element-overlap', 'table-layout'],
})
```

Khi implement mới, `assertLayoutIntegrity` nên chỉ là preset gọi các matcher nhỏ để giữ backward compatibility với spec cũ.

## 7. Level 3 — Design System

### `toMatchDesignToken`

Testcase decorator:

```md
@assertion toMatchDesignToken
- Component test id: `{module}-primary-btn`
- Component kind: shadcn Button | Input | Card | Dialog | Table
- Theme scope: :root | .dark | .tailwind-admin-theme
- Expected tokens: backgroundColor=color.primary, color=color.primaryForeground, borderRadius=radius.md
- State: default | hover | focus | disabled
- Expected: computed style resolves to the configured shadcn token values
```

Mục tiêu: component quan trọng không lệch token màu, spacing, radius, font.

Portal đang dùng shadcn-vue + Tailwind token theo CSS variables. Nguồn token hiện tại:

- `assets/css/main.css`: khai báo `:root`, `.dark`, `.tailwind-admin-theme`, `.sb-dashboard-preview`.
- `tailwind.config.ts`: map shadcn token sang Tailwind color/radius:
  - `background` → `hsl(var(--background))`
  - `foreground` → `hsl(var(--foreground))`
  - `primary.DEFAULT` → `hsl(var(--primary))`
  - `primary.foreground` → `hsl(var(--primary-foreground))`
  - `secondary`, `muted`, `accent`, `destructive`, `card`, `border`, `input`, `ring`
  - `radius.lg` → `var(--radius)`
  - `radius.md` → `calc(var(--radius) - 2px)`
  - `radius.sm` → `calc(var(--radius) - 4px)`
- Helper đề xuất: `tests/e2e/helpers/semantic-ui/designTokens.ts`.

Token registry đề xuất cho E2E:

```ts
export const shadcnTokens = {
  color: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    cardForeground: 'hsl(var(--card-foreground))',
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
    secondary: 'hsl(var(--secondary))',
    secondaryForeground: 'hsl(var(--secondary-foreground))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--accent))',
    accentForeground: 'hsl(var(--accent-foreground))',
    destructive: 'hsl(var(--destructive))',
    destructiveForeground: 'hsl(var(--destructive-foreground))',
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
  },
  radius: {
    lg: 'var(--radius)',
    md: 'calc(var(--radius) - 2px)',
    sm: 'calc(var(--radius) - 4px)',
  },
} as const
```

Implementation note: browser trả về computed style dạng `rgb(...)`, không phải `hsl(var(...))`. Matcher phải resolve token trong browser bằng `getComputedStyle(document.documentElement).getPropertyValue('--primary')`, render ra computed color tạm, rồi so với computed style của element. Không so string raw `hsl(var(...))`.

API:

```ts
await expect(page.getByTestId('auth-login-submit-btn')).toMatchDesignToken({
  color: 'color.primaryForeground',
  backgroundColor: 'color.primary',
  borderRadius: 'radius.md',
  fontSize: 'text.sm',
})
```

Options:

```ts
type DesignTokenExpectation = {
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderRadius?: string
  fontSize?: string
  fontWeight?: string
  spacing?: {
    paddingX?: string
    paddingY?: string
    gap?: string
  }
}
```

Rule:

- Chỉ test token ở component đại diện, không assert token mọi nơi trong E2E.
- Với primitive shadcn/molecule, ưu tiên Storybook/component test. E2E chỉ guard các màn quan trọng.
- Khi token đổi có chủ đích, update token source, không sửa từng spec.
- Chạy token assertion ở cả light/dark nếu component có behavior khác theo `.dark`.
- Nếu page dùng `.tailwind-admin-theme`, matcher phải resolve token theo root gần nhất chứa theme class, không chỉ `document.documentElement`.

### Shadcn Token Assertions Nên Có

#### Button

Testcase decorator:

```md
@assertion toMatchShadcnButtonToken
- Button test id: `{module}-submit-btn`
- Variant: default | destructive | outline | secondary | ghost | link
- Size: default | sm | lg | icon
- States to verify: default, focus, disabled
- Theme scope: :root | .dark | .tailwind-admin-theme
- Expected: variant colors, radius, focus ring and disabled style match shadcn tokens
```

```ts
await expect(page.getByTestId('auth-login-submit-btn')).toMatchShadcnButtonToken({
  variant: 'default',
  size: 'default',
})
```

Check:

- `variant=default`: background `color.primary`, text `color.primaryForeground`.
- `variant=destructive`: background `color.destructive`, text `color.destructiveForeground`.
- Focus ring dùng `color.ring`.
- Radius khớp `radius.md`.
- Disabled có `opacity: 0.5` và không nhận pointer events nếu component áp dụng class shadcn chuẩn.

#### Input / Textarea / Select Trigger

Testcase decorator:

```md
@assertion toMatchShadcnControlToken
- Control test id: `{module}-{field}-input`
- Control kind: input | textarea | select-trigger
- States to verify: default, focus, disabled, invalid
- Placeholder expected: true | false
- Theme scope: :root | .dark | .tailwind-admin-theme
- Expected: border/input/ring/radius/placeholder tokens match shadcn control style
```

```ts
await expect(page.getByTestId('auth-login-email-input')).toMatchShadcnControlToken()
```

Check:

- Border dùng `color.input` hoặc `color.border`.
- Background transparent hoặc `color.background` theo component.
- Radius `radius.md`.
- Placeholder dùng `color.mutedForeground`.
- Focus ring dùng `color.ring`.

#### Card / Dialog / Popover

Testcase decorator:

```md
@assertion toMatchShadcnSurfaceToken
- Surface test id: `{module}-dialog`
- Surface kind: card | dialog | popover | sheet
- Open state setup: describe click/action needed before assertion
- Theme scope: :root | .dark | .tailwind-admin-theme
- Expected: background/text/border/radius tokens match shadcn surface style
```

```ts
await expect(page.getByTestId('customer-delete-dialog')).toMatchShadcnSurfaceToken({
  surface: 'popover',
})
```

Check:

- Background `color.background` hoặc `color.card`.
- Text `color.foreground` hoặc `color.cardForeground`.
- Border `color.border` nếu có border.
- Radius `radius.lg`.
- Shadow không nên assert exact value trong E2E, chỉ assert tồn tại nếu component yêu cầu elevation.

#### Table

Testcase decorator:

```md
@assertion toMatchShadcnTableToken
- Table test id: `{module}-table`
- Header variant: default | muted
- Row states to verify: default, hover, selected
- Theme scope: :root | .dark | .tailwind-admin-theme
- Expected: row borders, header text and selected/hover backgrounds match shadcn table tokens
```

```ts
await expect(page.getByTestId('customers-table')).toMatchShadcnTableToken()
```

Check:

- Header text dùng foreground/muted foreground phù hợp.
- Border row dùng `color.border`.
- Row hover/selected dùng `color.muted` hoặc `color.accent` nếu design system quy định.
- Kết hợp với `toHaveValidTableLayout`; token matcher không kiểm tra column alignment.

## 8. Preset Theo Loại Test

### Smoke Page

Chạy nhanh cho mọi page chính:

```ts
await waitForSemanticUiReady(page, {
  rootTestId: 'customers-page',
  waitForTestIds: ['customers-table'],
  waitForFonts: true,
  waitForImages: 'visible',
})

await expect(page).toHaveNoConsoleErrors(consoleErrors)
await expect(page).toHaveNoHorizontalScroll()
await expect(page).toHaveNoBrokenImages()
await expect(page.getByTestId('customers-page')).toHaveNoTextOverflow()
```

### Layout Page

Chạy cho dashboard/list/table/form nhiều layout:

```ts
await waitForSemanticUiReady(page, {
  rootTestId: 'customers-page',
  waitForTestIds: ['customers-table'],
})

await expect(page.getByTestId('customers-page')).toHaveNoElementOverlap()
await expect(page.getByTestId('customers-table')).toHaveValidTableLayout()
```

### Accessibility Page

Chạy cho page public, auth, form, checkout/critical flow:

```ts
await waitForSemanticUiReady(page, {
  rootTestId: 'auth-login-page',
  waitForFonts: true,
})

await expect(page).toHaveNoA11yViolations({
  include: '[data-testid="auth-login-page"]',
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
})
```

### Design System Guard

Chạy ít, tập trung component quan trọng:

```ts
await waitForSemanticUiReady(page, {
  rootTestId: 'auth-login-page',
})

await expect(page.getByTestId('auth-login-submit-btn')).toMatchDesignToken({
  backgroundColor: 'color.primary',
  borderRadius: 'radius.md',
})
```

## 9. Rule Viết Spec

1. Page/component phải có `data-testid` trước khi viết E2E. Xem [E2E-TESTIDS.md](./e2e-testids.md).
2. Spec dùng `page.getByTestId()`. Không dùng CSS class, XPath, `nth-child`.
3. Semantic assertions chạy sau khi UI ở trạng thái ổn định: API mock xong, loading hidden, dialog/menu đã mở nếu muốn scan state đó.
4. Mỗi assertion phải fail với message có selector/testId và lý do cụ thể.
5. Không scan quá rộng trong mọi test. Common smoke dùng Level 1; Level 2/3 dùng có chọn lọc.
6. Known issue phải khai báo gần test bằng option `excludeTestIds`, `ignorePatterns`, `disableRules` kèm lý do.
7. Không dùng screenshot làm assertion layout chính. Screenshot chỉ để debug hoặc visual regression riêng.
8. Accessibility scan không thay thế assertion semantic HTML/keyboard/label cho flow critical.

## 10. YAML Testcase Cho AI/Dev Implement

Testcase E2E dùng YAML làm source of truth cho AI/dev. Markdown chỉ là bản generated để BA/QA review trên VitePress.

```yaml
id: customer-list-semantic-ui
feature: customer
title: Customer list semantic UI
type: e2e
priority: must
requirementIds:
  - REQ-CUSTOMER-001
route:
  path: /customers
  auth: required
testIds:
  required:
    - customers-page
    - customers-page-title
    - customers-search-input
    - customers-create-btn
    - customers-table
setup:
  session: mockAuthenticatedSession
  mocks:
    - method: GET
      path: /api/customers
      response: customerListSuccess
data:
  longCustomerName: Very long customer name for overflow testing
steps:
  - action: goto
    path: /customers
  - action: waitFor
    testId: customers-table
  - action: fill
    testId: customers-search-input
    valueFrom: data.longCustomerName
assertions:
  semantic:
    ready:
      rootTestId: customers-page
      waitForTestIds:
        - customers-table
      waitForFonts: true
      waitForImages: visible
      waitForStableBoundingBoxes: true
    level1:
      - toHaveNoConsoleErrors
      - toHaveNoHorizontalScroll
      - toHaveNoBrokenImages
      - toHaveNoTextOverflow
    layout:
      - toHaveNoElementOverlap
      - toHaveValidTableLayout
    accessibility:
      - toHaveNoA11yViolations
      - toHaveValidAccessibleNames
      - toHaveValidAria
      - toHaveAccessibleMedia
    designToken:
      - toMatchShadcnTableToken
allowedExceptions:
  - Table body may have vertical scroll.
  - No horizontal page scroll allowed.
  - Ignore app-toast overlap if toast is visible.
expected:
  - Page shell is visible.
  - Title text equals Customers.
  - No console/page errors.
  - No broken image.
  - No unexpected horizontal scroll/text overflow/overlap.
  - Table header and body columns are aligned.
  - Axe returns no WCAG A/AA violations.
```

## 11. Implementation Roadmap

### Phase 0 — Install & Spike Libraries

- Cài `@axe-core/playwright` và `axe-core` trước khi viết helper.
- Tạo spike spec nhỏ ở `tests/e2e/semantic-ui/axe-spike.spec.ts`.
- Verify `AxeBuilder` dùng được với `.withTags()`, `.include()`, `.exclude()`, `.disableRules()`, `.analyze()`.
- Dump một sample `results.violations` vào Playwright attachment để khóa result shape.
- Từ spike, chốt helper nào dùng trực tiếp axe rule, helper nào vẫn phải custom DOM/geometry.

### Phase 1 — Core Fixture & Render Ready

- Tạo `tests/e2e/fixtures/semantic-ui.ts`.
- Implement `waitForSemanticUiReady` để thay `waitForTimeout()` trong semantic specs.
- Implement `toHaveNoConsoleErrors`, `toHaveNoHorizontalScroll`, `toHaveNoBrokenImages`, `toHaveNoTextOverflow`.
- Refactor `assertLayoutIntegrity` dùng helper nhỏ mới hoặc giữ compatibility wrapper.

### Phase 2 — Layout Assertions

- Implement `toHaveNoElementOverlap`, `toHaveAlignedGrid`, `toHaveValidTableLayout`.
- Thêm fixtures/spec ví dụ cho login và một table page.
- Document skip/exclude patterns.

### Phase 3 — Axe Presets

- Implement matcher `toHaveNoA11yViolations` bằng `AxeBuilder`.
- Implement axe rule presets: `toHaveValidAccessibleNames`, `toHaveValidAria`, `toHaveAccessibleMedia`, `toHaveReadableContrast`, `toHaveValidDocumentSemantics`.
- Thêm attachment JSON khi axe fail.
- Thêm semantic HTML assertions cho button, label, heading, image alt.

### Phase 4 — Shadcn Design Tokens

- Chuẩn hóa design token source.
- Implement `toMatchDesignToken`.
- Implement shadcn shortcuts: `toMatchShadcnButtonToken`, `toMatchShadcnControlToken`, `toMatchShadcnSurfaceToken`, `toMatchShadcnTableToken`.
- Chạy guard ở Storybook/component test là chính, E2E chỉ ở critical screens.

## 12. Acceptance Checklist

- [ ] Có fixture import duy nhất cho semantic UI: `tests/e2e/fixtures/semantic-ui.ts`.
- [ ] Phase 0 đã cài `@axe-core/playwright` + `axe-core` và có spike chứng minh API dùng được.
- [ ] Matchers có type definition cho TypeScript.
- [ ] Failure message liệt kê testId, element tag, metric thực tế và expected threshold.
- [ ] Có option exclude/ignore có kiểm soát.
- [ ] Không phá `tests/e2e/helpers/assertLayoutIntegrity.ts` hiện có.
- [ ] Có ít nhất một spec mẫu dùng Level 1.
- [ ] Có ít nhất một spec mẫu dùng Level 2 table/layout.
- [ ] Có docs hướng dẫn YAML testcase cho AI/dev và Markdown generated cho BA/QA review.
- [ ] Axe helper attach scan result khi fail hoặc khi chạy spike/debug.
