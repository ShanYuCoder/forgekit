# 07 — Deployment

status: stub

**Optional.** Write `DEP-*` only when runtime **placement** matters.  
Do not invent prod topology. Local machine tips stay out of this repo.

## DEP-local

Local WSL / Docker compose style layout for platform bases.  
Prod/staging: TBD.

```mermaid
flowchart LR
  Dev[Developer machine]
  Docs[base-docs VitePress]
  FE[FE base :3000]
  API[API base]
  Dev --> Docs
  Dev --> FE
  FE --> API
```

## Notes

- Redirect: [`/architecture/deployments/`](/architecture/deployments/)
