#!/usr/bin/env python3
"""Translate SVG text manifest entries through Codex official client."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "i18n" / "svg_text_manifest.json"
STATE_PATH = ROOT / "i18n" / "svg_translation_state.json"
PROTECTED_TERMS = ROOT / "i18n" / "protected_terms.txt"
PROTECTED_REPLACEMENTS = ROOT / "i18n" / "protected_replacements.json"


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def protected_terms() -> str:
    return ", ".join(
        line.strip()
        for line in PROTECTED_TERMS.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    )


def forbidden_replacements() -> str:
    data = json.loads(PROTECTED_REPLACEMENTS.read_text(encoding="utf-8"))
    return "、".join(f"{bad}->{good}" for bad, good in data.items())


def load_state() -> dict[str, Any]:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"entries": {}}


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def iter_entries(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for file_index, file_record in enumerate(manifest.get("files", [])):
        for entry_index, entry in enumerate(file_record.get("entries", [])):
            if entry.get("zh"):
                continue
            en = str(entry.get("en", "")).strip()
            if not en:
                continue
            items.append(
                {
                    "id": f"{file_index}:{entry_index}",
                    "file_index": file_index,
                    "entry_index": entry_index,
                    "path": file_record["path"],
                    "kind": entry.get("kind"),
                    "en": en,
                }
            )
    return items


def build_prompt(batch: list[dict[str, Any]]) -> str:
    payload = [{"id": item["id"], "en": item["en"]} for item in batch]
    return f"""你是一个资深 AI Engineering 图表本地化编辑。请把下面 SVG 图表中的短文本翻译为简体中文。

硬性规则：
1. 只翻译人类可读的英文说明、按钮、短句和图表标签。
2. 专业术语、缩写、产品名、库名、协议名、模型名、代码标识符、文件名、路径、公式和变量名不要翻译。
3. 保留 AI、ML、LLM、RAG、MCP、API、SDK、Python、JavaScript、TypeScript、Rust、Julia、Transformer、Attention、Token、Embedding 等术语英文。
4. 如果原文是代码、命令、变量、纯数字、公式、版本号或文件名，原样返回。
5. 翻译要短，适合 SVG 图表空间；不要添加解释。
6. 禁止使用这些中文替代；遇到这些概念时保留对应英文术语：{forbidden_replacements()}

必须保留英文的专业名词包括但不限于：{protected_terms()}

只返回 JSON 对象，格式为 {{"translations": [{{"id": "...", "zh": "..."}}]}}，不要用代码围栏。

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


def parse_output(output: str, expected_ids: set[str]) -> dict[str, str]:
    text = output.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    data = json.loads(text)
    translations = data.get("translations")
    if not isinstance(translations, list):
        raise RuntimeError("missing translations list")
    result: dict[str, str] = {}
    for row in translations:
        if not isinstance(row, dict):
            continue
        item_id = str(row.get("id", ""))
        if item_id in expected_ids:
            result[item_id] = str(row.get("zh", "")).strip()
    missing = expected_ids - set(result)
    if missing:
        raise RuntimeError(f"missing ids: {', '.join(sorted(missing)[:10])}")
    return result


def recompute_totals(manifest: dict[str, Any]) -> None:
    files = manifest.get("files", [])
    manifest["totals"] = {
        "files": len(files),
        "entries": sum(len(f.get("entries", [])) for f in files),
        "missing_zh": sum(1 for f in files for e in f.get("entries", []) if not e.get("zh")),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=80)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--timeout", type=int, default=1200)
    parser.add_argument("--workers", type=int, default=1)
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    state = load_state()
    entries_state = state.setdefault("entries", {})
    items = []
    for item in iter_entries(manifest):
        digest = sha256(item["en"])
        current = entries_state.get(item["id"], {})
        if current.get("status") == "translated" and current.get("source_sha256") == digest:
            file_record = manifest["files"][item["file_index"]]
            file_record["entries"][item["entry_index"]]["zh"] = current["zh"]
            continue
        items.append(item)
    if args.limit is not None:
        items = items[: args.limit]
    print(f"pending svg entries: {len(items)}")

    batches = [items[start : start + args.batch_size] for start in range(0, len(items), args.batch_size)]

    def translate_batch(batch: list[dict[str, Any]]) -> dict[str, str]:
        expected_ids = {item["id"] for item in batch}
        return parse_output(run_codex(build_prompt(batch), args.timeout), expected_ids)

    failures = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(translate_batch, batch): (batch_no, batch)
            for batch_no, batch in enumerate(batches, 1)
        }
        for future in concurrent.futures.as_completed(futures):
            batch_no, batch = futures[future]
            try:
                translations = future.result()
                for item in batch:
                    zh = translations[item["id"]]
                    if not zh:
                        raise RuntimeError(f"empty translation for {item['id']}")
                    file_record = manifest["files"][item["file_index"]]
                    file_record["entries"][item["entry_index"]]["zh"] = zh
                    entries_state[item["id"]] = {
                        "status": "translated",
                        "source_sha256": sha256(item["en"]),
                        "zh": zh,
                        "updated_at": int(time.time()),
                        "method": "codex-exec-svg-batch",
                    }
                recompute_totals(manifest)
                MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                save_state(state)
                print(f"[batch {batch_no}/{len(batches)}] completed {len(batch)} svg entries", flush=True)
            except Exception as exc:
                for item in batch:
                    entries_state[item["id"]] = {
                        "status": "failed",
                        "source_sha256": sha256(item["en"]),
                        "error": str(exc),
                        "method": "codex-exec-svg-batch",
                    }
                save_state(state)
                print(f"failed batch {batch_no}: {exc}", flush=True)
                failures += 1
    recompute_totals(manifest)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
