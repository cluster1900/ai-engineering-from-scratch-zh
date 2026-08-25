#!/usr/bin/env python3
"""Translate natural-language spans in large Markdown, HTML, and JS files."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import re
import subprocess
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parent.parent
STATE_PATH = ROOT / "i18n" / "translation_state.json"
PROTECTED_TERMS = ROOT / "i18n" / "protected_terms.txt"
PROTECTED_REPLACEMENTS = ROOT / "i18n" / "protected_replacements.json"
HTML_TEXT_RE = re.compile(r"(?<=>)([^<>]+)(?=<)")
HTML_ATTR_RE = re.compile(
    r"\b(?:aria-label|aria-description|title|placeholder|alt|content)=(['\"])(.*?)\1",
    re.DOTALL | re.IGNORECASE,
)
SCRIPT_STYLE_RE = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.DOTALL | re.IGNORECASE)
UI_SINGLE_WORDS = {
    "about", "catalog", "certifications", "checkpoint", "close", "confirmed",
    "contents", "copy", "detour", "diagram", "expand", "glossary", "install",
    "lesson", "lessons", "locked", "next", "optional", "output", "previous",
    "roadmap", "supplemental",
}
JS_PROSE_MARKER_RE = re.compile(
    r"\b(?:a|an|the|and|or|with|without|from|into|before|after|because|"
    r"is|are|was|were|be|can|cannot|must|should|use|uses|using|select|"
    r"choose|change|inspect|return|returns|send|sends|run|runs|validate|"
    r"validates|match|matches|expose|exposes|keep|keeps|close|closes)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Span:
    start: int
    end: int
    text: str


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def should_translate(text: str) -> bool:
    stripped = text.strip()
    if re.search(r"[\u4e00-\u9fff]", stripped):
        return False
    if len(stripped) < 5 or not re.search(r"[A-Za-z]", stripped):
        return False
    if stripped == "use strict" or re.fullmatch(r"[A-Za-z][A-Za-z0-9_.:-]*", stripped):
        return False
    if stripped.startswith(("http://", "https://", "/", "./", "../", "#", ".")):
        return False
    if any(marker in stripped for marker in ("{", "}", "[", "]", ";", "=")):
        return False
    if re.search(r"(?:[/\\]|=>|===|!==|querySelector|addEventListener|data-|\.json\b|\.js\b|\.html\b)", stripped):
        return False
    words = re.findall(r"\b[A-Za-z]{2,}\b", stripped)
    return len(words) >= 2


def should_translate_js_fallback(text: str) -> bool:
    """Recognize prose missed by the scanner without admitting code literals."""
    stripped = text.strip()
    if not stripped or stripped.startswith(("http://", "https://", "./", "../", "//")):
        return False
    if any(marker in stripped for marker in ("{", "}", ";", "=", "=>", "===", "!==")):
        return False
    if re.search(r"<[A-Za-z/]|\b(?:class|href|data-[A-Za-z-]+)=", stripped):
        return False
    if re.match(r"^[.#][A-Za-z_-]+", stripped):
        return False
    if re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)+", stripped):
        return False
    words = re.findall(r"\b[A-Za-z]{2,}\b", stripped)
    return len(words) >= 3 and ("." in stripped or bool(JS_PROSE_MARKER_RE.search(stripped)))


def should_translate_markdown(text: str, include_mixed: bool) -> bool:
    if not include_mixed:
        return should_translate(text)
    stripped = text.strip()
    if not stripped or not re.search(r"[A-Za-z]", stripped):
        return False
    if re.fullmatch(r"</?[A-Za-z][^>]*>", stripped):
        return False
    return True


def markdown_spans(path: Path, text: str, include_mixed: bool = False) -> list[Span]:
    spans: list[Span] = []
    in_fence = False
    offset = 0
    for line in text.splitlines(keepends=True):
        stripped = line.lstrip()
        if stripped.startswith(("```", "~~~")):
            in_fence = not in_fence
        elif not in_fence and should_translate_markdown(line, include_mixed):
            if path.as_posix().endswith("glossary/terms.md") and stripped.startswith("## "):
                offset += len(line)
                continue
            content = line.rstrip("\r\n")
            spans.append(Span(offset, offset + len(content), content))
        offset += len(line)
    return spans


def overlaps(span: tuple[int, int], ranges: list[tuple[int, int]]) -> bool:
    return any(span[0] < end and span[1] > start for start, end in ranges)


def js_string_spans(text: str, base_offset: int = 0) -> list[Span]:
    spans: list[Span] = []
    index = 0
    size = len(text)
    previous_token = ""
    while index < size:
        if text.startswith("//", index):
            newline = text.find("\n", index + 2)
            index = size if newline < 0 else newline + 1
            continue
        if text.startswith("/*", index):
            closing = text.find("*/", index + 2)
            index = size if closing < 0 else closing + 2
            continue
        if text[index] == "/":
            regex_allowed = not previous_token or previous_token in {"=", "(", "[", "{", ",", ":", ";", "!", "?", "&", "|"}
            if regex_allowed:
                cursor = index + 1
                escaped = False
                in_class = False
                while cursor < size and text[cursor] != "\n":
                    char = text[cursor]
                    if escaped:
                        escaped = False
                    elif char == "\\":
                        escaped = True
                    elif char == "[":
                        in_class = True
                    elif char == "]":
                        in_class = False
                    elif char == "/" and not in_class:
                        cursor += 1
                        while cursor < size and text[cursor].isalpha():
                            cursor += 1
                        index = cursor
                        previous_token = "regex"
                        break
                    cursor += 1
                else:
                    index += 1
                continue
        quote = text[index]
        if quote not in {"'", '"', "`"}:
            if not quote.isspace():
                if quote.isalnum() or quote in {"_", "$"}:
                    cursor = index + 1
                    while cursor < size and (text[cursor].isalnum() or text[cursor] in {"_", "$"}):
                        cursor += 1
                    previous_token = text[index:cursor]
                    index = cursor
                    continue
                previous_token = quote
            index += 1
            continue
        start = index + 1
        index = start
        escaped = False
        while index < size:
            char = text[index]
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                break
            index += 1
        if index >= size:
            break
        body = text[start:index]
        visible_body = re.sub(r"<[^>]+>", " ", body) if "<" in body and ">" in body else body
        visible_word = re.sub(r"[^A-Za-z]", "", visible_body).lower()
        if "${" not in body and "\n" not in body and (
            should_translate(visible_body) or visible_word in UI_SINGLE_WORDS
        ):
            spans.append(Span(base_offset + start, base_offset + index, body))
        index += 1
        previous_token = "string"
    # The lightweight scanner above deliberately understands comments and
    # regular-expression literals, but malformed or unusually dense source can
    # make it lose synchronization. Recover conservative, single-line quoted
    # prose without admitting CSS, URLs, identifiers, or code-like strings.
    quoted = re.compile(
        r"'(?P<single>(?:\\.|[^'\\\r\n])*)'|\"(?P<double>(?:\\.|[^\"\\\r\n])*)\""
    )
    for match in quoted.finditer(text):
        group = "single" if match.group("single") is not None else "double"
        body = match.group(group)
        visible_body = re.sub(r"<[^>]+>", " ", body) if "<" in body and ">" in body else body
        visible_word = re.sub(r"[^A-Za-z]", "", visible_body).lower()
        if (
            should_translate(visible_body)
            or should_translate_js_fallback(visible_body)
            or visible_word in UI_SINGLE_WORDS
        ):
            spans.append(Span(base_offset + match.start(group), base_offset + match.end(group), body))
    return sorted({(span.start, span.end): span for span in spans}.values(), key=lambda span: span.start)


def html_spans(text: str, include_script_strings: bool = False) -> list[Span]:
    excluded = [(match.start(), match.end()) for match in SCRIPT_STYLE_RE.finditer(text)]
    spans: list[Span] = []
    for match in HTML_TEXT_RE.finditer(text):
        start, end = match.span(1)
        if not overlaps((start, end), excluded) and should_translate(match.group(1)):
            spans.append(Span(start, end, match.group(1)))
    for match in HTML_ATTR_RE.finditer(text):
        start, end = match.span(2)
        if should_translate(match.group(2)):
            spans.append(Span(start, end, match.group(2)))
    if not include_script_strings:
        return sorted({(span.start, span.end): span for span in spans}.values(), key=lambda span: span.start)
    for block in SCRIPT_STYLE_RE.finditer(text):
        if block.group(1).lower() != "script":
            continue
        opening_end = text.find(">", block.start()) + 1
        closing_start = text.rfind("</", block.start(), block.end())
        spans.extend(js_string_spans(text[opening_end:closing_start], opening_end))
    return sorted({(span.start, span.end): span for span in spans}.values(), key=lambda span: span.start)


def extract_spans(
    path: Path,
    text: str,
    include_mixed_markdown: bool = False,
    include_html_script_strings: bool = False,
) -> list[Span]:
    if path.suffix == ".md":
        return markdown_spans(path, text, include_mixed_markdown)
    if path.suffix == ".html":
        return html_spans(text, include_html_script_strings)
    if path.suffix == ".js":
        return js_string_spans(text)
    raise ValueError(f"unsupported suffix: {path.suffix}")


def prompt(items: list[dict[str, str]]) -> str:
    terms = ", ".join(
        line.strip()
        for line in PROTECTED_TERMS.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    )
    replacements = json.loads(PROTECTED_REPLACEMENTS.read_text(encoding="utf-8"))
    forbidden = "、".join(f"{bad}->{good}" for bad, good in replacements.items())
    return f"""你是资深 AI Engineering 课程本地化编辑。翻译输入 JSON 数组中每个对象的 text 为简体中文。

规则：
1. id、对象数量和顺序必须完全不变，只返回有效 JSON 数组。
2. 保留原有 Markdown/HTML 标点、缩进、占位符和转义字符。
3. 专业名词、数学术语、产品名、协议名、模型名、缩写、命令、路径和代码标识符保持英文。
4. 不增加解释，不总结。若 text 本身只是专业术语，可原样返回。
5. Markdown 链接的 URL、HTML 属性名、anchor id 和代码片段必须逐字符保持不变；翻译链接显示文字和可见 HTML 文案。
6. 禁止这些替代：{forbidden}
7. 保护术语包括但不限于：{terms}

输入：
{json.dumps(items, ensure_ascii=False, indent=2)}
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
            command, cwd=ROOT, text=True, input=prompt(items),
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout,
        )
        if process.returncode != 0:
            raise RuntimeError(process.stdout[-4000:])
        output = out_path.read_text(encoding="utf-8").strip()
        if output.startswith("```"):
            output = "\n".join(output.splitlines()[1:-1]).strip()
        translated = json.loads(output)
        if not isinstance(translated, list) or len(translated) != len(items):
            raise RuntimeError("translated span count changed")
        if [item.get("id") for item in translated] != [item["id"] for item in items]:
            raise RuntimeError("translated span ids or order changed")
        return translated
    finally:
        out_path.unlink(missing_ok=True)


def make_batches(spans: list[Span], max_chars: int) -> list[list[tuple[int, Span]]]:
    batches: list[list[tuple[int, Span]]] = []
    current: list[tuple[int, Span]] = []
    chars = 0
    for index, span in enumerate(spans):
        if current and chars + len(span.text) > max_chars:
            batches.append(current)
            current = []
            chars = 0
        current.append((index, span))
        chars += len(span.text)
    if current:
        batches.append(current)
    return batches


def translate_file(
    path: Path,
    workers: int,
    max_chars: int,
    timeout: int,
    include_mixed_markdown: bool = False,
    include_html_script_strings: bool = False,
) -> tuple[str, str, str]:
    original = path.read_text(encoding="utf-8")
    spans = extract_spans(path, original, include_mixed_markdown, include_html_script_strings)
    batches = make_batches(spans, max_chars)

    def translate_batch(batch: list[tuple[int, Span]]) -> list[tuple[int, str]]:
        items = [{"id": str(index), "text": span.text} for index, span in batch]
        translated = run_codex(items, timeout)
        return [(index, item["text"]) for (index, _), item in zip(batch, translated)]

    replacements: dict[int, str] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        for result in executor.map(translate_batch, batches):
            replacements.update(result)
    output = original
    for index, span in reversed(list(enumerate(spans))):
        output = output[: span.start] + replacements[index] + output[span.end :]
    return path.relative_to(ROOT).as_posix(), original, output


def selected_paths(paths_file: Path, min_chars: int) -> Iterable[Path]:
    for line in paths_file.read_text(encoding="utf-8").splitlines():
        path = ROOT / line.strip()
        if (
            path.exists()
            and path.suffix in {".md", ".html", ".js"}
            and path.stat().st_size >= min_chars
            and path.name != "test_build_artifacts.js"
        ):
            yield path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--paths-file", required=True)
    parser.add_argument("--min-chars", type=int, default=50001)
    parser.add_argument("--batch-max-chars", type=int, default=18000)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=1200)
    parser.add_argument("--path", action="append", default=[], help="translate only this repo-relative path; repeatable")
    parser.add_argument("--include-mixed-markdown", action="store_true")
    parser.add_argument(
        "--include-inline-script-strings",
        action="store_true",
        help="also translate JavaScript string literals embedded in HTML (riskier)",
    )
    args = parser.parse_args()

    if args.path:
        paths = [ROOT / rel for rel in args.path]
        paths = [
            path for path in paths
            if path.exists()
            and path.suffix in {".md", ".html", ".js"}
            and path.stat().st_size >= args.min_chars
            and path.name != "test_build_artifacts.js"
        ]
    else:
        paths = list(selected_paths(ROOT / args.paths_file, args.min_chars))
    state = json.loads(STATE_PATH.read_text(encoding="utf-8")) if STATE_PATH.exists() else {"files": {}}
    for index, path in enumerate(paths, 1):
        print(f"[{index}/{len(paths)}] translate spans {path.relative_to(ROOT)}", flush=True)
        rel, original, output = translate_file(
            path,
            args.workers,
            args.batch_max_chars,
            args.timeout,
            args.include_mixed_markdown,
            args.include_inline_script_strings,
        )
        path.write_text(output, encoding="utf-8")
        state.setdefault("files", {})[rel] = {
            "status": "translated",
            "source_sha256": sha256(original),
            "output_sha256": sha256(output),
            "updated_at": int(time.time()),
            "method": "codex-exec-natural-language-spans",
        }
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
