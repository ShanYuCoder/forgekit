---
name: grill-api
description: >-
  /grill-api — Discovery router for backend API grill. Routes to /grill-api-spec
  (Portal-backed) or /grill-integration-spec (webhook/partner/no FE) based on source.kind.
disable-model-invocation: true
---

# /grill-api — Backend Grill Router

| Context | Command |
|---------|---------|
| `feature.source.base` is Portal | `/grill-api-spec` |
| `feature.source.base: none` / webhook / partner | `/grill-integration-spec` |

- Check `…/api/<seq>/01-backend-spec.yaml` → `feature.source.kind` to decide.
- If spec does not exist yet → run `/api-spec` or `/api-integration` first.
