#!/usr/bin/env python3
"""Synchronize an upstream Git range without overwriting localized lessons.

The Chinese repository has an independent Git history. This helper applies the
upstream file-tree delta while reserving existing lesson prose and quizzes for
the translation-aware merge pass.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path


GENERATED_PATHS = {"catalog.json", "package-lock.json", "site/data.js"}


def git(source: Path, *args: str, text: bool = False) -> bytes | str:
    return subprocess.check_output(["git", *args], cwd=source, text=text)


def changed_paths(source: Path, base: str, head: str) -> list[tuple[str, str]]:
    raw = git(source, "diff", "--name-status", "-z", f"{base}..{head}")
    assert isinstance(raw, bytes)
    fields = raw.decode("utf-8", errors="surrogateescape").split("\0")
    changes: list[tuple[str, str]] = []
    index = 0
    while index < len(fields) - 1:
        status = fields[index]
        index += 1
        if status.startswith(("R", "C")):
            old_path, new_path = fields[index], fields[index + 1]
            index += 2
            changes.append(("D", old_path))
            changes.append(("A", new_path))
        else:
            changes.append((status, fields[index]))
            index += 1
    return changes


def is_reserved_localization(path: str, status: str, target: Path) -> bool:
    if status == "A" or not (target / path).exists():
        return False
    return path.startswith("phases/") and (
        path.endswith("/docs/en.md") or path.endswith("/quiz.json")
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--base", required=True)
    parser.add_argument("--head", default="main")
    parser.add_argument("--target", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--manifest", default="i18n/upstream_sync_manifest.json")
    parser.add_argument("--path", action="append", default=[], help="sync only this repo-relative path; repeatable")
    args = parser.parse_args()

    source = args.source.resolve()
    target = args.target.resolve()
    head_hash = str(git(source, "rev-parse", args.head, text=True)).strip()
    records: list[dict[str, str]] = []

    selected_paths = set(args.path)
    for status, rel in changed_paths(source, args.base, args.head):
        if selected_paths and rel not in selected_paths:
            continue
        if rel in GENERATED_PATHS:
            records.append({"status": status, "path": rel, "action": "skip-generated"})
            continue
        destination = target / rel
        if is_reserved_localization(rel, status, target):
            records.append({"status": status, "path": rel, "action": "reserve-localized"})
            continue
        if status == "D":
            if destination.is_dir():
                shutil.rmtree(destination)
            elif destination.exists() or destination.is_symlink():
                destination.unlink()
            records.append({"status": status, "path": rel, "action": "delete"})
            continue

        payload = git(source, "show", f"{args.head}:{rel}")
        assert isinstance(payload, bytes)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(payload)
        tree_line = str(git(source, "ls-tree", args.head, "--", rel, text=True)).strip()
        if tree_line:
            mode = tree_line.split(maxsplit=1)[0]
            destination.chmod(0o755 if mode == "100755" else 0o644)
        records.append({"status": status, "path": rel, "action": "copy-upstream"})

    manifest = {
        "schema_version": 1,
        "source_repo_path": str(source),
        "base": args.base,
        "head": head_hash,
        "records": records,
    }
    manifest_path = target / args.manifest
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    counts: dict[str, int] = {}
    for record in records:
        action = record["action"]
        counts[action] = counts.get(action, 0) + 1
    print(json.dumps({"head": head_hash, "counts": counts}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
