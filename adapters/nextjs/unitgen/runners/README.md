# portal:unit-gen

Reads hub Code `ir/design.yaml` + `generated/codegen.manifest.json` (after `codegenkit gen`) → writes `tests/unit/`.

```bash
codegenkit unit-gen:dry --id W-AD-AUTH-001
codegenkit unit-gen --id W-AD-AUTH-001
codegenkit unit-gen --id W-AD-AUTH-001 --force
codegenkit unit-gen --spec /path/to/docskit/Surfaces/.../Modules/CMP-01-auth/Functions/W-AD-AUTH-001/ir/design.yaml
```

Form/create pages (`profile: create|auth|change-password|public`) generate tests against `src/services/{entity}Form.service.ts` (`create{Entity}FormService`), not the list service. List-column model tests are not emitted for those profiles.
