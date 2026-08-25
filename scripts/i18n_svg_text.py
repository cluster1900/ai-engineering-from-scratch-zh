#!/usr/bin/env python3
"""Extract and apply SVG visible text translations.

This keeps SVG localization deterministic. The extract step writes every text
node into i18n/svg_text_manifest.json. After the "zh" fields are filled, the
apply step replaces only text-node content and selected accessibility strings.
"""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "i18n" / "svg_text_manifest.json"
SVG_TEXT_RE = re.compile(r"(<text\b[^>]*>)(.*?)(</text>)", re.DOTALL | re.IGNORECASE)
ARIA_RE = re.compile(r'(aria-label=")([^"]*[A-Za-z][^"]*)(")')


def strip_tags(value: str) -> str:
    return re.sub(r"<[^>]+>", "", value).strip()


def extract() -> dict[str, object]:
    files: list[dict[str, object]] = []
    for path in sorted(ROOT.rglob("*.svg")):
        rel_parts = path.relative_to(ROOT).parts
        if ".git" in rel_parts or "node_modules" in rel_parts:
            continue
        text = path.read_text(encoding="utf-8")
        entries: list[dict[str, object]] = []
        for idx, match in enumerate(SVG_TEXT_RE.finditer(text)):
            raw = match.group(2)
            plain = html.unescape(strip_tags(raw))
            if plain and re.search(r"[A-Za-z]", plain):
                entries.append({
                    "kind": "text",
                    "index": idx,
                    "en": plain,
                    "zh": plain if re.search(r"[\u4e00-\u9fff]", plain) else "",
                })
        for idx, match in enumerate(ARIA_RE.finditer(text)):
            plain = html.unescape(match.group(2).strip())
            entries.append({
                "kind": "aria-label",
                "index": idx,
                "en": plain,
                "zh": plain if re.search(r"[\u4e00-\u9fff]", plain) else "",
            })
        if entries:
            files.append({"path": path.relative_to(ROOT).as_posix(), "entries": entries})
    return {
        "schema_version": 1,
        "totals": {
            "files": len(files),
            "entries": sum(len(f["entries"]) for f in files),
            "missing_zh": sum(1 for f in files for e in f["entries"] if not e["zh"]),
        },
        "files": files,
    }


def apply(manifest: dict[str, object]) -> int:
    changed = 0
    for file_record in manifest.get("files", []):
        if not isinstance(file_record, dict):
            continue
        rel = str(file_record["path"])
        path = ROOT / rel
        text = path.read_text(encoding="utf-8")
        entries = [e for e in file_record.get("entries", []) if isinstance(e, dict) and e.get("zh")]
        by_text_index = {int(e["index"]): str(e["zh"]) for e in entries if e.get("kind") == "text"}
        by_aria_index = {int(e["index"]): str(e["zh"]) for e in entries if e.get("kind") == "aria-label"}

        def replace_text(match: re.Match[str], counter: list[int] = [0]) -> str:
            idx = counter[0]
            counter[0] += 1
            if idx not in by_text_index:
                return match.group(0)
            return f"{match.group(1)}{html.escape(by_text_index[idx], quote=False)}{match.group(3)}"

        def replace_aria(match: re.Match[str], counter: list[int] = [0]) -> str:
            idx = counter[0]
            counter[0] += 1
            if idx not in by_aria_index:
                return match.group(0)
            return f"{match.group(1)}{html.escape(by_aria_index[idx], quote=True)}{match.group(3)}"

        updated = SVG_TEXT_RE.sub(replace_text, text)
        updated = ARIA_RE.sub(replace_aria, updated)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["extract", "apply"])
    args = parser.parse_args()
    if args.command == "extract":
        data = extract()
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(data["totals"], ensure_ascii=False, indent=2))
        return 0
    if not OUT.exists():
        raise SystemExit("missing i18n/svg_text_manifest.json; run extract first")
    data = json.loads(OUT.read_text(encoding="utf-8"))
    changed = apply(data)
    print(f"changed svg files: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
