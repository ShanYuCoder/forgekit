from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(TOOLS_DIR))

from fast_gen.plan import build_file_plan, repo_root  # noqa: E402
from fast_gen.read_spec import read_spec_file  # noqa: E402
from fast_gen.registry import load_registry  # noqa: E402
from fast_gen.write_files import execute_generation, export_openapi  # noqa: E402

def merge_i18n_flat(spec_i18n: dict, locales_dir: Path, dry_run: bool) -> None:
  if not spec_i18n or not isinstance(spec_i18n, dict):
    return
  data_by_lang = {}
  for key, translations in spec_i18n.items():
    if isinstance(translations, dict):
      for lang, val in translations.items():
        if lang not in data_by_lang:
          data_by_lang[lang] = {}
        data_by_lang[lang][key] = val
          
  for lang, new_keys in data_by_lang.items():
    locale_path = locales_dir / f"{lang}.json"
    current_data = {}
    if locale_path.exists():
      try:
        with open(locale_path, 'r', encoding='utf-8') as f:
          current_data = json.load(f)
      except Exception:
        current_data = {}
          
    for k, v in new_keys.items():
      current_data[k] = v
        
    if not dry_run:
      locales_dir.mkdir(parents=True, exist_ok=True)
      with open(locale_path, 'w', encoding='utf-8') as f:
        json.dump(current_data, f, ensure_ascii=False, indent=2)
        f.write('\n')
          
    print(f"  {'[dry] ' if dry_run else 'write'}: locales/{lang}.json (+{len(new_keys)} keys)")

def registry_cmd() -> None:
  data = load_registry(repo_root())
  print(json.dumps(data, indent=2))


def dry_cmd(spec: str, force: bool = False) -> None:
  _run(spec, dry_run=True, force=force)


def write_cmd(spec: str, force: bool = False) -> None:
  _run(spec, dry_run=False, force=force)


def openapi_cmd(spec: str) -> None:
  spec_data, spec_path, feature_dir = read_spec_file(spec)
  sys.path.insert(0, str(repo_root() / "src"))
  out = export_openapi(feature_dir, spec_data)
  print(f"openapi: {out}")


def _run(spec: str, *, dry_run: bool, force: bool) -> None:
  spec_data, spec_path, feature_dir = read_spec_file(spec)
  plan = build_file_plan(spec_data, force=force)
  print(f"fast-gen: entities={len(plan['contexts'])} profile={plan['ctx']['profile']}")
  print(f"  spec: {spec_path}")
  if dry_run:
    print("  mode: dry-run")
  if force:
    print("  mode: force")

  for warning in plan["warnings"]:
    print(f"  warning: {warning}", file=sys.stderr)
  result = execute_generation(plan, feature_dir, spec_path, dry_run=dry_run)
  for item in result["decisions"]:
    status = item["status"]
    if not dry_run and status in ("would-write", "would-force"):
      status = "write" if status == "would-write" else "force"
    print(f"  {status}: {item['relativePath']}")
  if result["conflicts"]:
    print("Blocked: generated files have unmanaged or locally modified conflicts.", file=sys.stderr)
    print("Resolve the listed files or re-run with --force:", file=sys.stderr)
    for item in result["conflicts"]:
      print(f"  conflict: {item['relativePath']}", file=sys.stderr)
    raise SystemExit(2)
  if not dry_run:
    print(f"  manifest: {result['manifestPath']}")

  if "i18n" in spec_data:
    locales_dir = repo_root() / "locales"
    merge_i18n_flat(spec_data["i18n"], locales_dir, dry_run)


def resolve_spec_paths(spec: str | None, id_val: str | None) -> list[str]:
  if spec:
    return [spec]
  if not id_val:
    print("Error: --spec or --id required", file=sys.stderr)
    sys.exit(1)
  
  import subprocess
  script = TOOLS_DIR.parent.parent / "shared" / "resolve-cli.mjs"
  try:
    res = subprocess.run(
      ["node", str(script), str(repo_root()), id_val, "api-codegen"],
      capture_output=True, text=True, check=True
    )
    data = json.loads(res.stdout)
    if not data.get("success"):
      print(f"fast-gen: FAIL --id {id_val}: {data.get('error')}", file=sys.stderr)
      sys.exit(1)
    
    paths = data.get("paths", [])
    notes = data.get("notes", [])
    kind = data.get("kind", "unknown")
    
    for note in notes:
      print(f"  note: {note}")
    if not paths:
      print(f"Error: --id {id_val}: no codegen specs", file=sys.stderr)
      sys.exit(1)
      
    print(f"fast-gen: --id {id_val} → {len(paths)} spec(s) ({kind})")
    return paths
  except Exception as e:
    print(f"Error resolving --id {id_val}: {e}", file=sys.stderr)
    sys.exit(1)

def main() -> None:
  parser = argparse.ArgumentParser(description="FastAPI codegen")
  subparsers = parser.add_subparsers(dest="command", required=True)
  subparsers.add_parser("registry")
  for command in ("dry", "write", "openapi"):
    child = subparsers.add_parser(command)
    child.add_argument("--spec", required=False)
    child.add_argument("--id", required=False)
    if command != "openapi":
      child.add_argument("--force", action="store_true")
  args = parser.parse_args()
  
  if args.command == "registry":
    registry_cmd()
    return

  paths = resolve_spec_paths(getattr(args, "spec", None), getattr(args, "id", None))
  
  if len(paths) > 1:
    print(f"fast-gen: {len(paths)} spec(s) to process")

  failed = 0
  for spec_path in paths:
    try:
      if args.command == "dry":
        dry_cmd(spec_path, getattr(args, "force", False))
      elif args.command == "write":
        write_cmd(spec_path, getattr(args, "force", False))
      else:
        openapi_cmd(spec_path)
      if len(paths) > 1:
        print("")
    except Exception as e:
      failed += 1
      print(f"fast-gen: FAIL {spec_path}: {e}", file=sys.stderr)

  if failed > 0:
    sys.exit(1)

if __name__ == "__main__":
  main()
