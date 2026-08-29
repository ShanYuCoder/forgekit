# Docskit — phase hooks

Docskit is an optional index over Markdown owned by the configured docs repo.
In consumer repos, that root comes from machine-local `DOCSKIT_ROOT`; never
inspect the current FE/BE/tests repo as if it were the docs hub.

```text
(1) docskit_layout / docskit_route / docskit_list_ids — narrow scope
(2) docskit_get_element — canonical file and targeted excerpt
(3) docskit_deps_of / docskit_dependents_of — reference impact
(4) docskit_orphans / docskit_validate_links — catalog health
```

Use `FLOW-*` and `docskit_journeys` for journeys. Keep ADRs in the configured
arc42 decision home and code-level IDs in the target hub's product tree.

If Docskit is not connected, continue with targeted Markdown inspection at the
explicit docs root. To wire it locally from another repo:

```bash
docskit init --location=local --docs-root=/absolute/path/to/docs-hub --yes
```
