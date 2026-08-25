#!/usr/bin/env python3
"""Deterministically restore protected technical terms."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPLACEMENTS_PATH = ROOT / "i18n" / "protected_replacements.json"
SUFFIXES = {".md", ".json", ".html", ".svg"}
SKIP_PARTS = {".git", "node_modules", "i18n"}


def main() -> int:
    replacements_map = json.loads(REPLACEMENTS_PATH.read_text(encoding="utf-8"))
    changed = 0
    replacements = 0
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix not in SUFFIXES:
            continue
        if any(part in SKIP_PARTS for part in path.relative_to(ROOT).parts):
            continue
        text = path.read_text(encoding="utf-8")
        updated = text
        for bad, good in replacements_map.items():
            count = updated.count(bad)
            if count:
                replacements += count
                updated = updated.replace(bad, good)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"changed_files={changed} replacements={replacements}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
