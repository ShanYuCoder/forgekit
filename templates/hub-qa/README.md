# QA inbox (docs hub)

Open customer / choice / tech-debt questions live here — **not** in `*.bundle.yaml`.

- One file per open issue: `qa/open/QA-<bundle.id>-NNNN.yaml`
- `bundle.id` is the screen leaf id from `/spec` (e.g. `cmp-adm-002-02-01-02`)
- Sequence is **per screen** (`0001`, `0002`, …). Different screens never share a counter.
- Close with **`/qa-resolve QA-<bundle.id>-NNNN`** plus the decision (skill deletes the file).

Template: `.docskit/templates/qa-item.yaml`  
Rules: `.cursor/extracts/qa-inbox.md`
