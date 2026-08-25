#!/usr/bin/env python3
"""Translate large JSON files by replacing natural-language string leaves."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
STATE_PATH = ROOT / "i18n" / "translation_state.json"
PROTECTED_TERMS = ROOT / "i18n" / "protected_terms.txt"
PROTECTED_REPLACEMENTS = ROOT / "i18n" / "protected_replacements.json"


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def should_translate(value: str) -> bool:
    if re.search(r"[\u4e00-\u9fff]", value):
        return False
    if value.startswith(("http://", "https://")) or "/" in value:
        return False
    words = re.findall(r"\b[A-Za-z]{2,}\b", value)
    return len(words) >= 2 and len(value) >= 8


def string_leaves(value: Any, path: tuple[Any, ...] = ()) -> list[tuple[tuple[Any, ...], str]]:
    leaves: list[tuple[tuple[Any, ...], str]] = []
    if isinstance(value, dict):
        for key, child in value.items():
            leaves.extend(string_leaves(child, path + (key,)))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            leaves.extend(string_leaves(child, path + (index,)))
    elif isinstance(value, str) and should_translate(value):
        leaves.append((path, value))
    return leaves


def set_path(value: Any, path: tuple[Any, ...], replacement: str) -> None:
    current = value
    for part in path[:-1]:
        current = current[part]
    current[path[-1]] = replacement


def translation_prompt(items: list[dict[str, str]]) -> str:
    terms = ", ".join(
        line.strip()
        for line in PROTECTED_TERMS.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    )
    replacements = json.loads(PROTECTED_REPLACEMENTS.read_text(encoding="utf-8"))
    forbidden = "、".join(f"{bad}->{good}" for bad, good in replacements.items())
    payload = json.dumps(items, ensure_ascii=False, indent=2)
    return f"""你是资深 AI Engineering 课程本地化编辑。把输入 JSON 数组中每个对象的 text 完整翻译为简体中文。

规则：
1. 原样保留每个 id，返回顺序和对象数量必须完全一致。
2. 只翻译自然语言；专业名词、数学术语、产品名、库名、协议名、模型名、缩写、命令、路径和代码标识符保留英文。
3. 不增删事实，不总结，不解释。
4. 只返回有效 JSON 数组，不要使用 Markdown code fence。
5. 禁止这些替代：{forbidden}
6. 必须保留的英文术语包括但不限于：{terms}

输入：
{payload}
"""


def run_codex(items: list[dict[str, str]], timeout: int) -> list[dict[str, str]]:
    with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False, suffix=".json") as out:
        out_path = Path(out.name)
    command = [
        "codex", "exec", "--ephemeral", "--sandbox", "read-only",
        "--output-last-message", str(out_path), "-",
    ]
    try:
        process = subprocess.run(
            command,
            cwd=ROOT,
            text=True,
            input=translation_prompt(items),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
        )
        if process.returncode != 0:
            raise RuntimeError(process.stdout[-4000:])
        output = out_path.read_text(encoding="utf-8").strip()
        if output.startswith("```"):
            output = "\n".join(output.splitlines()[1:-1]).strip()
        translated = json.loads(output)
        if not isinstance(translated, list) or len(translated) != len(items):
            raise RuntimeError("translated item count changed")
        expected_ids = [item["id"] for item in items]
        actual_ids = [item.get("id") for item in translated if isinstance(item, dict)]
        if actual_ids != expected_ids:
            raise RuntimeError("translated ids or order changed")
        translated_han = sum(
            1 for item in translated if re.search(r"[\u4e00-\u9fff]", item.get("text", ""))
        )
        if translated_han < max(1, len(items) // 2):
            raise RuntimeError("too few translated strings contain Chinese")
        return translated
    finally:
        out_path.unlink(missing_ok=True)


def make_batches(leaves: list[tuple[tuple[Any, ...], str]], max_chars: int) -> list[list[tuple[tuple[Any, ...], str]]]:
    batches: list[list[tuple[tuple[Any, ...], str]]] = []
    current: list[tuple[tuple[Any, ...], str]] = []
    size = 0
    for leaf in leaves:
        if current and size + len(leaf[1]) > max_chars:
            batches.append(current)
            current = []
            size = 0
        current.append(leaf)
        size += len(leaf[1])
    if current:
        batches.append(current)
    return batches


def translate_file(path: Path, timeout: int, batch_max_chars: int, workers: int) -> tuple[str, str, str]:
    rel = path.relative_to(ROOT).as_posix()
    original = path.read_text(encoding="utf-8")
    payload = json.loads(original)
    leaves = string_leaves(payload)
    batches = make_batches(leaves, batch_max_chars)

    def translate_batch(batch: list[tuple[tuple[Any, ...], str]]) -> list[tuple[tuple[Any, ...], str]]:
        items = [{"id": str(index), "text": text} for index, (_, text) in enumerate(batch)]
        translated = run_codex(items, timeout)
        return [(batch[index][0], item["text"]) for index, item in enumerate(translated)]

    replacements: list[tuple[tuple[Any, ...], str]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        for result in executor.map(translate_batch, batches):
            replacements.extend(result)
    for leaf_path, translated_text in replacements:
        set_path(payload, leaf_path, translated_text)
    output = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    json.loads(output)
    return rel, original, output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--paths-file", required=True)
    parser.add_argument("--min-chars", type=int, default=50001)
    parser.add_argument("--batch-max-chars", type=int, default=24000)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=1200)
    args = parser.parse_args()

    paths = [
        ROOT / line.strip()
        for line in (ROOT / args.paths_file).read_text(encoding="utf-8").splitlines()
        if line.strip().endswith(".json")
    ]
    paths = [path for path in paths if path.exists() and path.stat().st_size >= args.min_chars]
    state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {"files": {}}
    for index, path in enumerate(paths, 1):
        print(f"[{index}/{len(paths)}] translate leaves {path.relative_to(ROOT)}", flush=True)
        rel, original, output = translate_file(path, args.timeout, args.batch_max_chars, args.workers)
        path.write_text(output, encoding="utf-8")
        state.setdefault("files", {})[rel] = {
            "status": "translated",
            "source_sha256": sha256(original),
            "output_sha256": sha256(output),
            "updated_at": int(time.time()),
            "method": "codex-exec-json-leaves",
        }
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
