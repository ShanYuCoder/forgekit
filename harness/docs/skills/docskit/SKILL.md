---
name: docskit
extractBundle: docskit
description: /docskit — MCP index for a conforming arc42 × C4 documentation hub.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and index routing policies below.
> - Do NOT perform a shallow check. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /docskit

Package: [raintr91/docskit](https://github.com/raintr91/docskit)

The docs repo owns architecture/product Markdown. Docskit only indexes,
validates, and routes content from the configured docs root. This skill may be
installed as a lightweight consumer in FE/BE/tests; it must still read the
member-selected docs repo, never the current code repo.

## Protocol

```text
docskit_layout / docskit_route / docskit_list_ids
  → docskit_get_element
  → docskit_deps_of / docskit_dependents_of
  → docskit_orphans / docskit_validate_links
```

Use `docskit_journeys` before reading every journey file. Prefer targeted tool
results over dumping `architecture/**`.

## Root and setup

Docs install:

```bash
cd /path/to/docs-hub
docskit init --location=local --yes
docskit harness install --type=docs
```

Consumer install from FE/BE/tests:

```bash
cd /path/to/code-or-tests-repo
docskit init --location=local --docs-root=/absolute/path/to/docs-hub --yes
docskit harness install --type=consumer
```

The local MCP entry stores `DOCSKIT_ROOT`; every tool also accepts `docsRoot`.
The selected hub must contain `architecture/`. Never infer a sibling checkout.

## Index routing

Do not merge repositories into one workspace graph. Route by intent:

- Architecture ID / C4 path → Docskit (`DOCSKIT_ROOT`). Never CodeGraph for
  architecture Markdown.
- IR / registry / generation → pointer kits when present
  (`CODEGENKIT_DOCS_ROOT`, `TESTKIT_DOCS_ROOT`, `TESTKIT_TESTS_ROOT`).
- Symbol / call-graph for repo `X` → CodeGraph MCP of repo `X`
  (`codegraph-<key>`, `--project-root` = checkout of `X`). Platform DNA wires
  those servers from `platform-repos.local.json` /
  `legacy-repos.local.json`; do not hand-edit `.cursor/mcp.json` for that.
- ArtifactGraph stays local-only and must not index other repositories.

## Owned architecture family

Docs `harness install --type=docs` also syncs `/architecture`, `/system-context`, `/containers`,
`/grill`, `/overview`, `/surfaces`, `/module`, `/business-process`, `/db-erd`, `/cross-service`, `/architecture-grill`,
`/deployment`, `/journey`, `/spec` and all `/legacy-*` variants, plus the `architecture-core` extract bundle.
Consumer mode syncs only `/docskit`, its rule/schema, and targeted phase hook.

## Accelerators (optional)

```text
ArtifactGraph: optional registry/tag/parity hints only
else: continue with Docskit tools + direct Markdown inspection

Docskit never requires ArtifactGraph.
ArtifactGraph must not index or own architecture Markdown.
If this MCP is not connected: Glob/search under architecture/ and product/,
then Read scoped Markdown. Authoring is never blocked.
```

At run start, assign one stable `runId`. If `@platform/artifactgraph` is not
configured, unavailable, or its invocation fails, continue with targeted local
search and scoped Markdown reads. Count each successful fallback file read and
its exact raw byte length. After the fallback completes, emit exactly one
`docskit.missing-optional` JSON event for the `runId` + optional pair using
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries. Report only actual `fileReads` and `contextBytes`; never estimate
tokens or token savings.

## Verification Checklist
- [ ] Strict adherence to index routing rules and load policy.
- [ ] Verified root and setup path configurations.
- [ ] Checked for all required extracts and accelerator fallback events if applicable.

