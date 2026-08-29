---
name: openapi
description: /openapi — generate 02-openapi.yaml from 01-backend-spec.yaml on the docs hub (Docskit).
disable-model-invocation: true
---

# /openapi — OpenAPI YAML (docs hub)

**Owner:** Docskit (`--type=docs`)

OpenAPI is a **docs artifact**, not Codegenkit. One generator: OpenAPI **3.0.3** from `01-backend-spec.yaml`. Merge/UI stays `openapi:render` + Redocly bundle.

## Generate

```bash
docskit openapi:gen --spec product/surfaces/<surface>/CMP-*/<NN…>/api/<seq>/01-backend-spec.yaml
docskit openapi:gen --spec product/surfaces/<surface>/CMP-*/<NN…>/api/<seq>/01-backend-spec.yaml --dry-run
docskit openapi:gen --spec product/surfaces/<surface>/CMP-*/<NN…>/api/<seq>/01-backend-spec.yaml --force
# or from docs hub root (all 01-backend-spec.yaml under product/surfaces):
docskit openapi:gen
docskit api:check --spec product/surfaces/<surface>/CMP-*/<NN…>/api/<seq>/01-backend-spec.yaml
```

Writes sibling **`02-openapi.yaml`**. Then `docskit openapi:render` merges fragments into `docs/openapi/api.yaml`.

Do not run Codegenkit `--type=docs` or `nestjs --openapi`. BE `/api` still generates **code** from the contract; it does not own OpenAPI YAML.

If the fragment is too thin (error $refs, examples), patch **`01-backend-spec.yaml`** and regenerate — do not invent a second generator per stack.
