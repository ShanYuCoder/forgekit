# Common delete flow

Destructive actions **must** block the user until acknowledged. Applies to row delete and bulk delete.

## Rule

| Step | UI |
|------|-----|
| Before delete | Blocking confirm dialog (clear object + impact) |
| After success | Blocking result dialog with success message — user must OK |
| After failure | Blocking result dialog with error — user must OK |

## Not allowed for delete

- Toast-only feedback
- Inline alert under title as sole confirmation
- Non-blocking banner

Bulk delete uses the same pattern; only copy and count differ.

## Spec / grill

- BQA: confirm copy, button labels, post-delete navigation (stay vs refresh list).
- Dev: API action, `#wire-only` if endpoint deferred; tag `#tech-debt:{id}` if contract open.

## Related

- ``docs/features/` stub · hubs`
- ``docs/features/` stub · hubs` (non-delete toasts)
- `common-ui-spec.md`
