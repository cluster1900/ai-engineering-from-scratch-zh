#!/usr/bin/env python3
"""Translate files through Codex official client.

The AgentBuy endpoint rejects ordinary REST calls but accepts Codex official
clients. This bridge keeps file writes local and auditable: Codex exec only
returns translated content into /tmp, then this script validates and writes it.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "i18n" / "manifest.json"
STATE_PATH = ROOT / "i18n" / "translation_state.json"
PROTECTED_TERMS = ROOT / "i18n" / "protected_terms.txt"
PROTECTED_REPLACEMENTS = ROOT / "i18n" / "protected_replacements.json"
TRANSLATABLE_SUFFIXES = {".md", ".html", ".json", ".js"}
SKIP_PATHS = {
    "site/data.js",
    "outputs/index.json",
    "i18n/manifest.json",
    "i18n/svg_text_manifest.json",
    "i18n/translation_state.json",
}
SKIP_PREFIXES = ("scripts/", ".git/", ".venv/", "node_modules/")


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_state() -> dict[str, Any]:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"files": {}}


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def protected_terms() -> str:
    return ", ".join(
        line.strip()
        for line in PROTECTED_TERMS.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    )


def forbidden_replacements() -> str:
    data = json.loads(PROTECTED_REPLACEMENTS.read_text(encoding="utf-8"))
    return "、".join(f"{bad}->{good}" for bad, good in data.items())


def candidate_files(
    limit: int | None,
    offset: int,
    max_file_chars: int | None,
    path_prefix: str | None,
    paths_file: str | None,
) -> list[Path]:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    requested = None
    if paths_file:
        requested = {
            line.strip()
            for line in (ROOT / paths_file).read_text(encoding="utf-8").splitlines()
            if line.strip()
        }
    files = []
    for record in manifest.get("text_files", []):
        rel = str(record["path"])
        if rel in SKIP_PATHS or rel.startswith(SKIP_PREFIXES):
            continue
        if "/code/" in rel or "/notebook/" in rel or rel.startswith(".github/workflows/"):
            continue
        path = ROOT / rel
        if path.suffix not in TRANSLATABLE_SUFFIXES:
            continue
        if int(record.get("english_segments", 0)) <= 0:
            continue
        if path_prefix and not rel.startswith(path_prefix):
            continue
        if requested is not None and rel not in requested:
            continue
        if max_file_chars is not None and path.exists() and len(path.read_text(encoding="utf-8")) > max_file_chars:
            continue
        files.append(path)
    files = files[offset:]
    if limit is not None:
        files = files[:limit]
    return files


def build_prompt(rel: str, text: str) -> str:
    return f"""你是一个资深 AI Engineering 课程本地化编辑。请把下面文件完整翻译为简体中文。

文件路径：{rel}

硬性规则：
1. 只翻译理解类、说明类、教学类自然语言。
2. 专业名词、产品名、库名、协议名、模型名、编程语言名、缩写、命令、路径、代码标识符不要翻译。
3. 必须保留 Markdown/HTML/JSON 结构、frontmatter key、链接、代码块、inline code、表格、缩进和占位符。
4. JSON 文件必须返回有效 JSON；不要改 key，只翻译字符串 value 中的说明性文本。
5. JavaScript 文件必须保持有效语法；不要改变量名、函数名、选择器、事件名、URL、存储 key、数据结构和控制逻辑，只翻译注释与用户可见字符串。
6. 不要新增解释，不要总结，不要用代码围栏包裹输出，只返回翻译后的完整文件内容。
7. 中文表达要专业、准确、自然。
8. 禁止使用这些中文替代；遇到这些概念时保留对应英文术语：{forbidden_replacements()}

必须保留英文的专业名词包括但不限于：{protected_terms()}

<file>
{text}
</file>
"""


def build_batch_prompt(files: list[tuple[str, str]]) -> str:
    chunks = []
    for rel, text in files:
        chunks.append(f"<<<I18N_FILE_START:{rel}>>>\n{text}\n<<<I18N_FILE_END:{rel}>>>")
    return f"""你是一个资深 AI Engineering 课程本地化编辑。请把下面多个文件完整翻译为简体中文。

硬性规则：
1. 只翻译理解类、说明类、教学类自然语言。
2. 专业名词、产品名、库名、协议名、模型名、编程语言名、缩写、命令、路径、代码标识符不要翻译。
3. 必须保留 Markdown/HTML/JSON 结构、frontmatter key、链接、代码块、inline code、表格、缩进和占位符。
4. JSON 文件必须返回有效 JSON；不要改 key，只翻译字符串 value 中的说明性文本。
5. JavaScript 文件必须保持有效语法；不要改变量名、函数名、选择器、事件名、URL、存储 key、数据结构和控制逻辑，只翻译注释与用户可见字符串。
6. 不要新增解释，不要总结，不要用代码围栏包裹输出。
7. 必须使用相同的文件分隔符原样包住每个翻译后的文件：
   <<<I18N_FILE_START:path>>>
   ...translated content...
   <<<I18N_FILE_END:path>>>
8. 禁止使用这些中文替代；遇到这些概念时保留对应英文术语：{forbidden_replacements()}

必须保留英文的专业名词包括但不限于：{protected_terms()}

{chr(10).join(chunks)}
"""


def run_codex(rel: str, text: str, timeout: int) -> str:
    with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False, suffix=".txt") as out:
        out_path = Path(out.name)
    prompt = build_prompt(rel, text)
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
        translated = out_path.read_text(encoding="utf-8").strip()
        if translated.startswith("```"):
            lines = translated.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            translated = "\n".join(lines).strip()
        return translated + "\n"
    finally:
        try:
            out_path.unlink()
        except OSError:
            pass


def run_codex_prompt(prompt: str, timeout: int) -> str:
    with tempfile.NamedTemporaryFile("w+", encoding="utf-8", delete=False, suffix=".txt") as out:
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


def parse_batch_output(output: str, paths: list[str]) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for rel in paths:
        start = f"<<<I18N_FILE_START:{rel}>>>"
        end = f"<<<I18N_FILE_END:{rel}>>>"
        if start not in output or end not in output:
            raise RuntimeError(f"missing batch delimiters for {rel}")
        body = output.split(start, 1)[1].split(end, 1)[0].strip()
        if body.startswith("```"):
            lines = body.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            body = "\n".join(lines).strip()
        parsed[rel] = body + "\n"
    return parsed


def validate(path: Path, translated: str, original: str | None = None) -> None:
    if not translated.strip():
        raise RuntimeError("empty translation")
    if path.suffix == ".json":
        json.loads(translated)
    if len(translated) < max(20, int(path.stat().st_size * 0.20)):
        raise RuntimeError("translation is suspiciously short")
    if original is not None:
        english_words = re.findall(r"\b[A-Za-z]{3,}\b", original)
        if len(english_words) >= 10 and not re.search(r"[\u4e00-\u9fff]", translated):
            raise RuntimeError("translation contains no Chinese prose")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--timeout", type=int, default=900)
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--batch-max-chars", type=int, default=60000)
    parser.add_argument("--max-file-chars", type=int)
    parser.add_argument("--path-prefix")
    parser.add_argument("--paths-file")
    parser.add_argument("--workers", type=int, default=1)
    parser.add_argument("--retry-failed", action="store_true")
    args = parser.parse_args()

    state = load_state()
    files_state = state.setdefault("files", {})
    files = candidate_files(
        args.limit,
        args.offset,
        args.max_file_chars,
        args.path_prefix,
        args.paths_file,
    )
    if args.retry_failed:
        files = [
            path
            for path in files
            if files_state.get(path.relative_to(ROOT).as_posix(), {}).get("status") == "failed"
        ]
    print(f"files selected: {len(files)}")
    if args.batch_size > 1 or args.workers > 1:
        return run_batch_mode(files, files_state, state, args)

    for index, path in enumerate(files, 1):
        rel = path.relative_to(ROOT).as_posix()
        original = path.read_text(encoding="utf-8")
        digest = sha256(original)
        current = files_state.get(rel, {})
        if (
            not args.force
            and current.get("status") == "translated"
            and current.get("output_sha256") == digest
        ):
            print(f"[{index}/{len(files)}] skip {rel}")
            continue
        print(f"[{index}/{len(files)}] codex translate {rel}", flush=True)
        try:
            translated = run_codex(rel, original, args.timeout)
            validate(path, translated, original)
            path.write_text(translated, encoding="utf-8")
            files_state[rel] = {
                "status": "translated",
                "source_sha256": digest,
                "output_sha256": sha256(translated),
                "updated_at": int(time.time()),
                "method": "codex-exec",
            }
            save_state(state)
        except Exception as exc:
            files_state[rel] = {
                "status": "failed",
                "source_sha256": digest,
                "error": str(exc),
                "method": "codex-exec",
            }
            save_state(state)
            print(f"failed {rel}: {exc}", file=sys.stderr)
            return 1
    return 0


def run_batch_mode(files: list[Path], files_state: dict[str, Any], state: dict[str, Any], args: argparse.Namespace) -> int:
    pending: list[Path] = []
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        digest = sha256(path.read_text(encoding="utf-8"))
        current = files_state.get(rel, {})
        if not args.force and current.get("status") == "translated" and current.get("output_sha256") == digest:
            continue
        pending.append(path)

    print(f"pending after state filter: {len(pending)}")
    batches: list[list[Path]] = []
    current_batch: list[Path] = []
    current_chars = 0
    for path in pending:
        size = len(path.read_text(encoding="utf-8"))
        if current_batch and (len(current_batch) >= args.batch_size or current_chars + size > args.batch_max_chars):
            batches.append(current_batch)
            current_batch = []
            current_chars = 0
        current_batch.append(path)
        current_chars += size
    if current_batch:
        batches.append(current_batch)

    if args.workers <= 1:
        failures = 0
        for batch_index, batch in enumerate(batches, 1):
            if not translate_batch(batch_index, len(batches), batch, files_state, state, args):
                failures += 1
        return 1 if failures else 0

    failures = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(translate_batch_payload, batch, args.timeout): (batch_index, batch)
            for batch_index, batch in enumerate(batches, 1)
        }
        for future in concurrent.futures.as_completed(futures):
            batch_index, batch = futures[future]
            rels = [p.relative_to(ROOT).as_posix() for p in batch]
            try:
                originals, translated = future.result()
                record_batch_success(rels, originals, translated, files_state, state)
                print(f"[batch {batch_index}/{len(batches)}] completed {len(batch)} files", flush=True)
            except Exception as exc:
                originals = {rel: (ROOT / rel).read_text(encoding="utf-8") for rel in rels}
                record_batch_failure(rels, originals, exc, files_state, state)
                failures += 1
                print(f"failed batch {batch_index}: {exc}", file=sys.stderr, flush=True)
    return 1 if failures else 0


def translate_batch_payload(batch: list[Path], timeout: int) -> tuple[dict[str, str], dict[str, str]]:
    rels = [p.relative_to(ROOT).as_posix() for p in batch]
    originals = {rel: (ROOT / rel).read_text(encoding="utf-8") for rel in rels}
    prompt = build_batch_prompt([(rel, originals[rel]) for rel in rels])
    output = run_codex_prompt(prompt, timeout)
    translated = parse_batch_output(output, rels)
    for rel in rels:
        validate(ROOT / rel, translated[rel], originals[rel])
    return originals, translated


def record_batch_success(
    rels: list[str],
    originals: dict[str, str],
    translated: dict[str, str],
    files_state: dict[str, Any],
    state: dict[str, Any],
) -> None:
    for rel in rels:
        path = ROOT / rel
        path.write_text(translated[rel], encoding="utf-8")
        files_state[rel] = {
            "status": "translated",
            "source_sha256": sha256(originals[rel]),
            "output_sha256": sha256(translated[rel]),
            "updated_at": int(time.time()),
            "method": "codex-exec-batch",
        }
    save_state(state)


def record_batch_failure(
    rels: list[str],
    originals: dict[str, str],
    exc: Exception,
    files_state: dict[str, Any],
    state: dict[str, Any],
) -> None:
    for rel in rels:
        files_state[rel] = {
            "status": "failed",
            "source_sha256": sha256(originals[rel]),
            "error": str(exc),
            "method": "codex-exec-batch",
        }
    save_state(state)


def translate_batch(
    batch_index: int,
    batch_count: int,
    batch: list[Path],
    files_state: dict[str, Any],
    state: dict[str, Any],
    args: argparse.Namespace,
) -> bool:
    rels = [p.relative_to(ROOT).as_posix() for p in batch]
    print(f"[batch {batch_index}/{batch_count}] codex translate {len(batch)} files", flush=True)
    try:
        originals, translated = translate_batch_payload(batch, args.timeout)
        record_batch_success(rels, originals, translated, files_state, state)
        return True
    except Exception as exc:
        originals = {rel: (ROOT / rel).read_text(encoding="utf-8") for rel in rels}
        record_batch_failure(rels, originals, exc, files_state, state)
        print(f"failed batch {batch_index}: {exc}", file=sys.stderr)
        return False


if __name__ == "__main__":
    raise SystemExit(main())
