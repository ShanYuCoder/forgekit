# Common UI Spec (Portal)

Follow `base-docs Code / `--id`` before copying legacy UI ad hoc.

- **Design registry:** `registries/design.registry.json` when present in the FE checkout; list default `#shell: DataListPage`. Promotion: `platform/toolchain/DESIGN-REGISTRY-PROMOTION.md`.
- If legacy violates project common UI, design to common global and note `#legacy-global-ui-violation` with legacy evidence.
- Patterns: list page, search filter, toolbar, pagination, data table, table action column, buttons, status chip, form validation, feedback/alert, confirm dialog, CSV import, navigation, flat design.
- Business buttons outside table actions: icon + text. Table row actions: icon-only per `common-table-action-column`. Paginator: page numbers/ellipsis; prev/next icon + Japanese text.
- Flat design: no heavy gradient/shadow or nested card/dialog layers unless common requires it.
- Prefer inline alert under page title/header on flat background. Alert dialog only when the page scrolls and inline alert would be hidden; non-action alert dialog top-right, not center/bottom legacy.
- Action dialogs (confirm/delete/overwrite/cancel): centered modal per common confirm dialog.
- Terminology: inline alert persists until user action; toast auto-dismiss ~5s with stack/animation; action modal blocks background.
- Never stack modals; use page/step/inline section or close current modal before opening a new flow.
