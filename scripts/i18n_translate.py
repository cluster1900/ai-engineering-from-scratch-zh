#!/usr/bin/env python3
"""Translate repository prose to Chinese while preserving technical terms.

The script is resumable and conservative:
- code fences, inline code, URLs, and obvious identifiers are protected
- JSON files are translated value-by-value without changing keys or structure
- generated files are skipped and can be rebuilt from translated sources
- progress is recorded in i18n/translation_state.json
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parent.parent
AUTH_PATH = Path.home() / ".codex" / "auth.json"
CONFIG_PATH = Path.home() / ".codex" / "config.toml"
MANIFEST = ROOT / "i18n" / "manifest.json"
STATE_PATH = ROOT / "i18n" / "translation_state.json"
PROTECTED_TERMS = ROOT / "i18n" / "protected_terms.txt"

DEFAULT_MODEL = "gpt-5.5"
DEFAULT_BASE_URL = "https://agent-buy.com"
TRANSLATABLE_SUFFIXES = {".md", ".json", ".html"}
SKIP_PATHS = {"site/data.js", "outputs/index.json", "i18n/manifest.json", "i18n/translation_state.json"}
SKIP_PREFIXES = ("scripts/", ".git/", ".venv/", "node_modules/")
PROTECT_RE = re.compile(
    r"(```.*?```|`[^`\n]+`|https?://\S+|mailto:\S+|!\[[^\]]*\]\([^)]*\)|\[[^\]]*\]\([^)]*\)|"
    r"<code>.*?</code>|<pre>.*?</pre>)",
    re.DOTALL,
)
HAS_ALPHA_RE = re.compile(r"[A-Za-z][A-Za-z0-9]")
HAS_PROSE_RE = re.compile(r"[A-Za-z][A-Za-z0-9][A-Za-z0-9 ,.;:!?()'\"/+\-&]{10,}")
HAS_CJK_RE = re.compile(r"[\u4e00-\u9fff]")


def load_toml_base_url() -> str:
    if not CONFIG_PATH.exists():
        return DEFAULT_BASE_URL
    try:
        import tomllib

        data = tomllib.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return DEFAULT_BASE_URL
    provider = data.get("model_provider")
    providers = data.get("model_providers", {})
    if isinstance(provider, str) and isinstance(providers, dict):
        item = providers.get(provider)
        if isinstance(item, dict) and isinstance(item.get("base_url"), str):
            return item["base_url"].rstrip("/")
    return DEFAULT_BASE_URL


def load_api_key() -> str:
    if os.getenv("OPENAI_API_KEY"):
        return os.environ["OPENAI_API_KEY"]
    if AUTH_PATH.exists():
        data = json.loads(AUTH_PATH.read_text(encoding="utf-8"))
        key = data.get("OPENAI_API_KEY")
        if isinstance(key, str) and key:
            return key
    raise SystemExit("OPENAI_API_KEY not found in environment or ~/.codex/auth.json")


def load_protected_terms() -> list[str]:
    return [
        line.strip()
        for line in PROTECTED_TERMS.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_state() -> dict[str, Any]:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"files": {}}


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def protect(text: str) -> tuple[str, dict[str, str]]:
    mapping: dict[str, str] = {}

    def repl(match: re.Match[str]) -> str:
        token = f"__I18N_KEEP_{len(mapping):04d}__"
        mapping[token] = match.group(0)
        return token

    return PROTECT_RE.sub(repl, text), mapping


def restore(text: str, mapping: dict[str, str]) -> str:
    for token, original in mapping.items():
        text = text.replace(token, original)
    return text


def should_translate_string(value: str) -> bool:
    if not HAS_ALPHA_RE.search(value):
        return False
    if HAS_CJK_RE.search(value) and len(HAS_CJK_RE.findall(value)) > 4:
        return False
    if value.strip().startswith(("http://", "https://", "mailto:")):
        return False
    return bool(HAS_PROSE_RE.search(value) or len(value.split()) >= 3)


class Translator:
    def __init__(self, *, model: str, base_url: str, api_key: str, dry_run: bool) -> None:
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.dry_run = dry_run
        self.terms = load_protected_terms()
        self.session = requests.Session()

    def prompt(self, text: str, kind: str) -> str:
        terms = ", ".join(self.terms)
        return (
            "你是一个资深 AI Engineering 课程本地化编辑。把下面内容翻译为简体中文。\n"
            "硬性规则：\n"
            "1. 只翻译理解类、说明类、教学类自然语言。\n"
            "2. 专业名词、产品名、库名、协议名、模型名、编程语言名、缩写、命令、路径、代码标识符不要翻译。\n"
            "3. 保留 Markdown/HTML/JSON 结构、frontmatter key、链接、占位符和 __I18N_KEEP_0000__ 形式 token。\n"
            "4. 不要新增解释，不要总结，不要删除内容。\n"
            "5. 中文表达要专业、准确、自然。\n"
            f"必须保留的术语包括但不限于：{terms}\n"
            f"内容类型：{kind}\n\n"
            "待翻译内容：\n"
            f"{text}"
        )

    def call(self, text: str, kind: str, attempts: int = 4) -> str:
        if self.dry_run:
            return text
        payload = {
            "model": self.model,
            "input": self.prompt(text, kind),
            "reasoning": {"effort": "low"},
        }
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        url = f"{self.base_url}/v1/responses"
        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            try:
                resp = self.session.post(url, headers=headers, json=payload, timeout=180)
                if resp.status_code in {429, 500, 502, 503, 504} and attempt < attempts:
                    time.sleep(min(60, 2**attempt))
                    continue
                resp.raise_for_status()
                data = resp.json()
                out = data.get("output_text")
                if isinstance(out, str) and out.strip():
                    return out.strip()
                chunks: list[str] = []
                for item in data.get("output", []):
                    for content in item.get("content", []):
                        if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                            chunks.append(content["text"])
                if chunks:
                    return "".join(chunks).strip()
                raise RuntimeError(f"no output_text in response: {json.dumps(data)[:500]}")
            except Exception as exc:
                last_error = exc
                if attempt < attempts:
                    time.sleep(min(60, 2**attempt))
        raise RuntimeError(f"translation failed after {attempts} attempts: {last_error}")

    def translate_text(self, text: str, kind: str) -> str:
        protected, mapping = protect(text)
        translated = self.call(protected, kind)
        return restore(translated, mapping)


def translate_json_value(value: Any, translator: Translator, path_hint: str) -> Any:
    if isinstance(value, dict):
        return {k: translate_json_value(v, translator, f"{path_hint}.{k}") for k, v in value.items()}
    if isinstance(value, list):
        return [translate_json_value(v, translator, f"{path_hint}[]") for v in value]
    if isinstance(value, str) and should_translate_string(value):
        return translator.translate_text(value, f"json string {path_hint}")
    return value


def translate_file(path: Path, translator: Translator) -> str:
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".json":
        data = json.loads(text)
        translated = translate_json_value(data, translator, path.relative_to(ROOT).as_posix())
        return json.dumps(translated, ensure_ascii=False, indent=2) + "\n"
    return translator.translate_text(text, path.suffix.lstrip(".") or "text")


def candidate_files(limit: int | None) -> list[Path]:
    if not MANIFEST.exists():
        raise SystemExit("missing i18n/manifest.json; run scripts/i18n_manifest.py first")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    files: list[Path] = []
    for record in manifest.get("text_files", []):
        rel = str(record["path"])
        if rel in SKIP_PATHS or rel.startswith(SKIP_PREFIXES):
            continue
        path = ROOT / rel
        if path.suffix not in TRANSLATABLE_SUFFIXES:
            continue
        if int(record.get("english_segments", 0)) <= 0:
            continue
        files.append(path)
    if limit is not None:
        files = files[:limit]
    return files


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=os.getenv("I18N_MODEL", DEFAULT_MODEL))
    parser.add_argument("--base-url", default=os.getenv("OPENAI_BASE_URL") or load_toml_base_url())
    parser.add_argument("--limit", type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--probe", action="store_true", help="probe configured API endpoints without editing files")
    args = parser.parse_args()

    api_key = "dry-run" if args.dry_run else load_api_key()
    if args.probe:
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"model": args.model, "input": "Reply with OK."}
        bases = [args.base_url.rstrip("/"), "https://api.openai.com"]
        paths = ["/v1/responses", "/responses"]
        seen: set[str] = set()
        for base in bases:
            for suffix in paths:
                url = f"{base}{suffix}"
                if url in seen:
                    continue
                seen.add(url)
                try:
                    resp = requests.post(url, headers=headers, json=payload, timeout=30)
                    body = resp.text[:300].replace(api_key, "[REDACTED]")
                    print(f"{resp.status_code} {url} {body}")
                except Exception as exc:
                    print(f"ERR {url} {exc.__class__.__name__}: {exc}")
        return 0

    translator = Translator(model=args.model, base_url=args.base_url, api_key=api_key, dry_run=args.dry_run)
    state = load_state()
    files_state = state.setdefault("files", {})
    files = candidate_files(args.limit)
    print(f"files selected: {len(files)}")

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
        print(f"[{index}/{len(files)}] translate {rel}", flush=True)
        try:
            translated = translate_file(path, translator)
            if args.dry_run:
                continue
            path.write_text(translated, encoding="utf-8")
            files_state[rel] = {
                "status": "translated",
                "source_sha256": digest,
                "output_sha256": sha256(translated),
                "updated_at": int(time.time()),
            }
            save_state(state)
        except Exception as exc:
            files_state[rel] = {"status": "failed", "source_sha256": digest, "error": str(exc)}
            save_state(state)
            print(f"failed {rel}: {exc}", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
