#!/usr/bin/env python3
"""Build the human-facing translation queue from an upstream sync manifest."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from i18n_manifest import is_human_facing_text


ROOT = Path(__file__).resolve().parent.parent
TEXT_SUFFIXES = {".md", ".json", ".html", ".js"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="i18n/upstream_sync_manifest.json")
    parser.add_argument("--pending", default="i18n/upstream_translation_pending.txt")
    parser.add_argument("--completed", default="i18n/upstream_translation_completed.txt")
    parser.add_argument("--out", default="i18n/upstream_translation_queue.txt")
    args = parser.parse_args()

    manifest = json.loads((ROOT / args.manifest).read_text(encoding="utf-8"))
    pending_path = ROOT / args.pending
    completed_path = ROOT / args.completed
    queue = set(pending_path.read_text(encoding="utf-8").splitlines()) if pending_path.exists() else set()
    completed = set(completed_path.read_text(encoding="utf-8").splitlines()) if completed_path.exists() else set()

    for record in manifest["records"]:
        if record["action"] != "copy-upstream":
            continue
        rel = record["path"]
        path = ROOT / rel
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES and is_human_facing_text(path):
            queue.add(rel)

    queue -= completed
    output = ROOT / args.out
    output.write_text("\n".join(sorted(queue)) + "\n", encoding="utf-8")
    by_top_level: dict[str, int] = {}
    for rel in queue:
        top = rel.split("/", 1)[0]
        by_top_level[top] = by_top_level.get(top, 0) + 1
    print(json.dumps({"files": len(queue), "by_top_level": by_top_level}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
