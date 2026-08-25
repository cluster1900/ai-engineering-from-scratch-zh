#!/usr/bin/env python3
"""Create gpt-image-2 jobs for raster image localization."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "i18n" / "gpt_image_2_jobs.jsonl"
RASTER_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}


def main() -> int:
    jobs = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in RASTER_SUFFIXES:
            continue
        rel_parts = path.relative_to(ROOT).parts
        if ".git" in rel_parts or "node_modules" in rel_parts:
            continue
        out = path.with_name(f"{path.stem}.zh{path.suffix}")
        jobs.append(
            {
                "source": path.relative_to(ROOT).as_posix(),
                "out": out.relative_to(ROOT).as_posix(),
                "model": "gpt-image-2",
                "size": "auto",
                "quality": "high",
                "prompt": (
                    "Edit the input image for Chinese localization. Preserve the original visual style, "
                    "composition, colors, aspect ratio, spacing, and brand feel. Replace only human-facing "
                    "English explanatory text with professional Simplified Chinese. Do not translate technical "
                    "terms, product names, programming language names, model names, protocol names, or acronyms "
                    "such as AI, ML, LLM, MCP, API, Python, TypeScript, Rust, Julia, Transformer, RAG, GPT. "
                    "Keep all numbers, layout labels, and file-like identifiers intact unless they are plain prose."
                ),
            }
        )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(json.dumps(job, ensure_ascii=False) for job in jobs) + ("\n" if jobs else ""), encoding="utf-8")
    print(json.dumps({"jobs": len(jobs), "out": OUT.relative_to(ROOT).as_posix()}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
