#!/usr/bin/env python3
"""Build a manifest for the Chinese localization pass.

The manifest is intentionally evidence-oriented: it records every text-like
file, every image asset, and a rough estimate of human-facing English content.
It does not translate anything.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TEXT_SUFFIXES = {".md", ".json", ".html", ".js"}
IMAGE_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".webp"}
SKIP_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    ".pytest_cache",
    "i18n",
}
HUMAN_TEXT_RE = re.compile(r"[A-Za-z][A-Za-z0-9][A-Za-z0-9 ,.;:!?()'\"/+\-&]{10,}")
SVG_TEXT_RE = re.compile(r"<(?:text|tspan)\b|aria-label=|<title>|<desc>", re.IGNORECASE)


@dataclass
class TextRecord:
    path: str
    suffix: str
    bytes: int
    english_segments: int
    chinese_chars: int


@dataclass
class ImageRecord:
    path: str
    suffix: str
    bytes: int
    text_bearing: bool
    needs_gpt_image_2: bool


def iter_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if path.is_file():
            files.append(path)
    return sorted(files)


def is_probably_generated(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    return rel in {"site/data.js", "outputs/index.json", "catalog.json"}


def is_human_facing_text(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    parts = path.relative_to(ROOT).parts
    if rel == ".claude/settings.local.json":
        return False
    if is_probably_generated(path):
        return False
    if rel == "site/test_build_artifacts.js":
        return False
    if rel.startswith(("scripts/", "i18n/", ".github/workflows/")):
        return False
    if "/code/" in rel or "/notebook/" in rel:
        return False
    if parts and parts[0] in {"certifications", "learning-paths"}:
        return path.suffix.lower() in TEXT_SUFFIXES
    if rel.startswith(("site/", "glossary/", ".agents/", ".claude/")):
        return path.suffix.lower() in TEXT_SUFFIXES
    if rel.startswith(".github/"):
        return path.suffix.lower() == ".md"
    if parts and parts[0] == "phases":
        return (
            rel.endswith("/docs/en.md")
            or rel.endswith("/README.md")
            or rel.endswith("/mission.md")
            or "/outputs/" in rel
            or rel.endswith("/quiz.json")
        )
    return path.suffix.lower() == ".md"


def count_english_segments(text: str) -> int:
    cleaned = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    cleaned = re.sub(r"`[^`\n]+`", "", cleaned)
    return len(HUMAN_TEXT_RE.findall(cleaned))


def count_chinese_chars(text: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fff]", text))


def text_record(path: Path) -> TextRecord | None:
    if path.suffix.lower() not in TEXT_SUFFIXES:
        return None
    if not is_human_facing_text(path):
        return None
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return None
    return TextRecord(
        path=path.relative_to(ROOT).as_posix(),
        suffix=path.suffix.lower(),
        bytes=path.stat().st_size,
        english_segments=count_english_segments(text),
        chinese_chars=count_chinese_chars(text),
    )


def image_record(path: Path) -> ImageRecord | None:
    if path.suffix.lower() not in IMAGE_SUFFIXES:
        return None
    rel = path.relative_to(ROOT).as_posix()
    text_bearing = False
    if path.suffix.lower() == ".svg":
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = ""
        text_bearing = bool(SVG_TEXT_RE.search(text) or HUMAN_TEXT_RE.search(text))
    return ImageRecord(
        path=rel,
        suffix=path.suffix.lower(),
        bytes=path.stat().st_size,
        text_bearing=text_bearing,
        needs_gpt_image_2=path.suffix.lower() != ".svg" or text_bearing,
    )


def build_manifest() -> dict[str, object]:
    text_records = [r for p in iter_files() if (r := text_record(p)) is not None]
    image_records = [r for p in iter_files() if (r := image_record(p)) is not None]
    return {
        "schema_version": 1,
        "root": str(ROOT),
        "totals": {
            "text_files": len(text_records),
            "text_files_with_english": sum(1 for r in text_records if r.english_segments),
            "english_segments": sum(r.english_segments for r in text_records),
            "image_files": len(image_records),
            "text_bearing_images": sum(1 for r in image_records if r.text_bearing),
            "needs_gpt_image_2": sum(1 for r in image_records if r.needs_gpt_image_2),
        },
        "text_files": [asdict(r) for r in text_records],
        "image_files": [asdict(r) for r in image_records],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="i18n/manifest.json")
    parser.add_argument("--stdout", action="store_true")
    args = parser.parse_args()

    manifest = build_manifest()
    payload = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if args.stdout:
        print(payload, end="")
    else:
        out = ROOT / args.out
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(payload, encoding="utf-8")
        totals = manifest["totals"]
        print(json.dumps(totals, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
