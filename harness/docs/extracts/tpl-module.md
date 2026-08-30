# Module README template

Path: `product/surfaces/<surface>/CMP-{NN}-{slug}/index.md` — **MD only** (yaml under `<function-slug>/code/`).

```markdown
# CMP-{NN} — Name

Lead-assigned module. **This README is MD-only** (no YAML).

Owns …

| | |
|--|--|
| **ID** | `CMP-{NN}` |
| **Business Process** | Module/cluster: `…/common/processes/FLOW-…`. Catalog: [`architecture/03-business-process/`](/architecture/03-business-process/) |
| **Functions** | `<function-slug>`, … |
| **Screens** | `W-…` |
| **APIs** | `API-…` |

\`\`\`mermaid
flowchart LR
  CMP[CMP-{NN}]
  W[W-…]
  API[API-…]
  CMP --> W
  CMP --> API
\`\`\`

## Code paths

- [`<function-slug>/code/W-…/`](./<function-slug>/code/W-…/)
- [`<function-slug>/code/API-…/`](./<function-slug>/code/API-…/)
```
