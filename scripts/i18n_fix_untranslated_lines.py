#!/usr/bin/env python3
"""Translate likely leftover English prose lines in localized files."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import i18n_audit

ROOT = Path(__file__).resolve().parent.parent
PROTECTED_TERMS = ROOT / "i18n" / "protected_terms.txt"
PROTECTED_REPLACEMENTS = ROOT / "i18n" / "protected_replacements.json"


def protected_terms() -> str:
    return ", ".join(
        line.strip()
        for line in PROTECTED_TERMS.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    )


def forbidden_replacements() -> str:
    data = json.loads(PROTECTED_REPLACEMENTS.read_text(encoding="utf-8"))
    return "、".join(f"{bad}->{good}" for bad, good in data.items())


def collect(limit: int | None, selected_paths: set[str] | None = None) -> list[dict[str, Any]]:
    manifest = i18n_audit.load_manifest()
    items: list[dict[str, Any]] = []
    for record in manifest.get("text_files", []):
        if not isinstance(record, dict):
            continue
        path = ROOT / str(record["path"])
        if not path.exists() or not i18n_audit.is_human_facing_path(path):
            continue
        rel = path.relative_to(ROOT).as_posix()
        if selected_paths is not None and rel not in selected_paths:
            continue
        in_code = False
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if line.strip().startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                continue
            if i18n_audit.line_has_likely_untranslated_prose(line):
                items.append({"id": f"{len(items)}", "path": rel, "line": lineno, "text": line})
                if limit is not None and len(items) >= limit:
                    return items
    return items


def build_prompt(batch: list[dict[str, Any]]) -> str:
    payload = [{"id": item["id"], "path": item["path"], "line": item["line"], "text": item["text"]} for item in batch]
    return f"""你是一个资深 AI Engineering 中文本地化编辑。下面是一些可能残留英文的单行文本。

请对每一行执行：
1. 如果这一行包含普通英文说明、教学文字、用户可见提示、Issue/PR 模板说明或技能输出文案，把英文自然语言翻译为简体中文。
2. 技术术语本身保留英文，但英文连接词、动词和说明性短语要翻译。例如 "Every Neural Network layer as a Tensor operation" 应译成 "每个 Neural Network layer 都是一个 Tensor operation"。
3. 如果这一行主要是论文/算法名、书名、代码、命令、路径、变量、配置、公式、选项值、URL、许可证名、产品名或缩写，则原样返回或只翻译明显的普通英文连接语。
4. 保留原有 Markdown/HTML/JSON 标点、缩进、列表符号、标题井号、引号、链接、占位符和 inline code。
5. 专业术语不要翻译。必须保留这些英文：{protected_terms()}
6. 禁止使用这些中文替代；遇到这些概念时保留对应英文术语：{forbidden_replacements()}
7. 不要新增解释，不要改变含义。

只返回 JSON：{{"lines":[{{"id":"...","text":"翻译后或原样的完整行"}}]}}，不要代码围栏。

输入：
{json.dumps(payload, ensure_ascii=False)}
"""


def run_codex(prompt: str, timeout: int) -> str:
    with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False, suffix=".json") as out:
        out_path = Path(out.name)
    cmd = [
        "codex",
        "exec",
        "--ephemeral",
        "--sandbox",
        "read-only",
        "--output-last-message",
        str(out_path),
        "-",
    ]
    try:
        proc = subprocess.run(
            cmd,
            cwd=ROOT,
            text=True,
            input=prompt,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stdout[-4000:])
        return out_path.read_text(encoding="utf-8").strip()
    finally:
        try:
            out_path.unlink()
        except OSError:
            pass


def parse_output(output: str, expected: set[str]) -> dict[str, str]:
    text = output.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    data = json.loads(text)
    rows = data.get("lines")
    if not isinstance(rows, list):
        raise RuntimeError("missing lines")
    result: dict[str, str] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        item_id = str(row.get("id", ""))
        if item_id in expected:
            result[item_id] = str(row.get("text", ""))
    missing = expected - set(result)
    if missing:
        raise RuntimeError(f"missing ids: {', '.join(sorted(missing)[:10])}")
    return result


def apply(batch: list[dict[str, Any]], replacements: dict[str, str], dry_run: bool) -> int:
    by_path: dict[str, list[dict[str, Any]]] = {}
    for item in batch:
        by_path.setdefault(item["path"], []).append(item)
    changed = 0
    for rel, items in by_path.items():
        path = ROOT / rel
        lines = path.read_text(encoding="utf-8").splitlines()
        file_changed = False
        for item in items:
            idx = int(item["line"]) - 1
            new = replacements[item["id"]]
            if idx < 0 or idx >= len(lines) or lines[idx] != item["text"]:
                continue
            if new != lines[idx]:
                lines[idx] = new
                file_changed = True
                changed += 1
        if file_changed and not dry_run:
            trailing = "\n" if path.read_text(encoding="utf-8").endswith("\n") else ""
            path.write_text("\n".join(lines) + trailing, encoding="utf-8")
    return changed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=120)
    parser.add_argument("--batch-size", type=int, default=60)
    parser.add_argument("--timeout", type=int, default=1200)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--path", action="append", default=[], help="translate only this repo-relative path; repeatable")
    args = parser.parse_args()

    items = collect(args.limit, set(args.path) if args.path else None)
    print(f"candidate lines: {len(items)}")
    total_changed = 0
    for start in range(0, len(items), args.batch_size):
        batch = items[start : start + args.batch_size]
        print(f"[batch {start // args.batch_size + 1}] fix {len(batch)} lines", flush=True)
        replacements = parse_output(run_codex(build_prompt(batch), args.timeout), {item["id"] for item in batch})
        total_changed += apply(batch, replacements, args.dry_run)
    print(f"changed_lines={total_changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
