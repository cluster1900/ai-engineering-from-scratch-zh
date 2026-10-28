#!/usr/bin/env python3
"""Flag residual English prose in a translated AIEFS zh manual.

Reports table cells, list items, link texts, and prose lines that look like
predominantly ASCII English, excluding code fences, inline code, Sources lines,
allowed names, tip citation templates, and intentional EN columns.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

CJK = re.compile(r"[\u4e00-\u9fff]")
LATIN_WORD = re.compile(r"[A-Za-z]{2,}")
HEADING = re.compile(r"^(#{1,6})\s+(.+?)(?:\s+\{#[a-z0-9-]+\})?\s*$")
LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")
INLINE_CODE = re.compile(r"`[^`]+`")
TABLE_ROW = re.compile(r"^\|(.+)\|\s*$")
TABLE_SEP = re.compile(r"^\|[\s:|-]+\|\s*$")
LIST_ITEM = re.compile(r"^(\s*[-*]|\s*\d+\.)\s+(.+)$")
COMMANDISH = re.compile(r"^[A-Za-z0-9_./+:#\-]+$")
TOKENISH = re.compile(r"^[\s0-9A-Za-z_./+:#\-`<>=,~|()\[\]{}\"'%,*x×±]+$")
META_KEY = re.compile(r"^(title|source|note|lang|alt|caption|figure|id)\s*:", re.I)
TIP_CITE = re.compile(r"^\{\{[a-zA-Z0-9_ ./:#\-]+\}\}$")
FUNC_WORDS = re.compile(
    r"\b(the|and|for|with|from|that|this|when|what|which|where|who|"
    r"into|onto|over|under|after|before|every|each|its|their|our|"
    r"are|is|was|were|be|been|being|has|have|had|does|did|will|"
    r"can|could|should|would|must|may|of|to|in|on|at|by|as|or|"
    r"not|no|an?|it|they|we|you|he|she|them|his|her|than|then|"
    r"also|only|just|more|most|other|same|such|how|why|if|else|"
    r"holds|measures|change|default|section|source|rank|item|"
    r"value|version|path|file|profile|models|output|flags|added|"
    r"common|server|incident|symptom|cause|fix|status|term|"
    r"meaning|manual|defined|series|type|question|answers|"
    r"reproducible|build|command|recorded|host|starts|runs|sends|"
    r"downloads|reduces|evicts|helps|compares|reads|writes|keeps|"
    r"uses|returns|means|shows|lists|names)\b",
    re.I,
)

ALLOWED_WHOLE = {
    "ttft", "tpot", "throughput", "goodput", "radixcache", "sglang",
    "time to first token (ttft)", "time per output token (tpot)",
    "median ttft", "output tok/s", "p99 itl", "p90 itl", "p95 itl",
    "histogram", "gauge", "counter", "default", "no-radix-cache",
    "no-overlap", "small-pool", "open", "closed", "true", "false",
    "none", "off", "on", "auto", "equal", "unchanged", "changed",
    "unknown", "derived", "plausible", "ready", "invalid",
    "gpu", "host", "model", "decode batch", "ep16", "ep32",
    "pull request", "open", "byte for byte",
}

ALLOWED_PREFIXES = (
    "phases/", "http://", "https://", "manuals/", "{{",
)

PRODUCT_H1 = re.compile(
    r"^(Reverse Engineering 101|SGLang 101)( capture kit)?$"
)


def strip_inline_code(s: str) -> str:
    return INLINE_CODE.sub(" ", s)


def strip_links(s: str) -> str:
    return LINK.sub(" ", s)


def has_cjk(s: str) -> bool:
    # CJK ideographs, or CJK punctuation / fullwidth forms that mark localized text
    return bool(CJK.search(s) or re.search(r"[\u3000-\u303f\uff00-\uffef]", s))


def latin_ratio(s: str) -> float:
    letters = re.findall(r"[A-Za-z]", s)
    cjk = CJK.findall(s)
    total = len(letters) + len(cjk)
    if total == 0:
        return 0.0
    return len(letters) / total


def is_commandish_title(title: str) -> bool:
    t = title.strip()
    if COMMANDISH.match(t):
        return True
    if "--" in t and not has_cjk(t):
        return True
    if t.startswith("HELP "):
        return True
    if PRODUCT_H1.match(t):
        return True
    if t in {"Glossary", "Sources", "Index of figures", "RadixCache", "术语表", "源", "图索引"}:
        return True
    # command / API name dominates the H1 (tool_name and …)
    if re.match(r"^[A-Za-z][A-Za-z0-9_./:\-]*(?:\s*,\s*[A-Za-z][A-Za-z0-9_./:\-]*)*(?:\s+and\s+.+)?$", t):
        # allow short command catalogues kept EN to match tip tool names
        if re.search(r"[A-Za-z]+_[A-Za-z]+|[a-z]+-[a-z]+", t) or t.startswith("rea "):
            return True
    return False


def is_allowed_cell(text: str) -> bool:
    t = text.strip()
    if not t or t in {"-", "—", "–", "|"}:
        return True
    if t.lower() in ALLOWED_WHOLE:
        return True
    if TIP_CITE.match(t):
        return True
    if t.startswith("{{") and t.endswith("}}"):
        return True
    # person / org names used as link text
    if re.fullmatch(r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+", t):
        return True
    bare = strip_inline_code(strip_links(t)).strip()
    if not bare:
        return True
    if has_cjk(bare):
        # product/version soup with CJK punctuation still allowed
        return True
    if not LATIN_WORD.search(bare):
        return True
    # identifier / version / metric soup without English prose words
    if not FUNC_WORDS.search(bare) and TOKENISH.match(bare):
        return True
    if re.fullmatch(r"[A-Za-z0-9_./+\-]+", bare) and len(bare) <= 48:
        return True
    # tokens/s, KiB, GB style measurements and ranges
    if re.fullmatch(r"[\d,.]+\s*(tokens/s|tok/s|KiB|MiB|GiB|GB|MB|ms|s|%|Hz|MHz)?(\s*[（(][\d,.\s]+(to|–|-)[\d,.\s]+[）)])?", bare, re.I):
        return True
    if re.fullmatch(r"[\d,.]+\s+(and|to|against|on|per)\s+[\d,.]+(\s+\w+)?", bare, re.I):
        if len(LATIN_WORD.findall(bare)) <= 3:
            return True
    # tip/docs citation leftovers that are titles kept EN
    if "docs/" in t:
        return True
    # Sources report title cells: mostly markdown links to blog posts
    if t.count("](") >= 1 and ("http" in t or t.startswith("[")):
        # after stripping links, little prose left
        if len(LATIN_WORD.findall(bare)) < 4 or not FUNC_WORDS.search(bare):
            return True
    # string-literal example cells (format strings)
    if t.count("`") >= 4 and "usage:" in t:
        return True
    return False


def looks_english_prose(text: str) -> bool:
    t0 = text.strip()
    if not t0:
        return False
    if t0.startswith("Sources:") or t0.startswith("Sources："):
        return False
    for p in ALLOWED_PREFIXES:
        if t0.startswith(p):
            return False
    t = strip_inline_code(strip_links(t0)).strip()
    if not t:
        return False
    if is_allowed_cell(t0) or is_allowed_cell(t):
        return False
    if has_cjk(t):
        # Already translated unless English still dominates
        if latin_ratio(t) > 0.55 and FUNC_WORDS.search(t) and len(LATIN_WORD.findall(t)) >= 5:
            return True
        return False
    words = LATIN_WORD.findall(t)
    if len(words) == 0:
        return False
    if FUNC_WORDS.search(t):
        return True
    if len(words) >= 4 and latin_ratio(t) > 0.8:
        return True
    return False


def split_row(line: str) -> list[str]:
    body = line.strip()
    if body.startswith("|"):
        body = body[1:]
    if body.endswith("|"):
        body = body[:-1]
    return [c.strip() for c in body.split("|")]


def scan_file(path: Path, allow_incident_col: bool) -> list[tuple[int, str, str]]:
    hits: list[tuple[int, str, str]] = []
    lines = path.read_text(encoding="utf-8").splitlines()
    in_fence = False
    i = 0
    while i < len(lines):
        line = lines[i]
        lineno = i + 1
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            i += 1
            continue
        if in_fence:
            i += 1
            continue
        if META_KEY.match(stripped):
            i += 1
            continue

        m = HEADING.match(line)
        if m:
            title = m.group(2).strip()
            if is_commandish_title(title):
                i += 1
                continue
            if looks_english_prose(title):
                hits.append((lineno, "HEADING", title[:120]))
            i += 1
            continue

        if TABLE_SEP.match(line):
            i += 1
            continue

        if TABLE_ROW.match(line):
            cells = split_row(line)
            for ci, cell in enumerate(cells):
                if allow_incident_col and path.name.startswith("r-3-incident") and ci == 0:
                    continue
                if path.name.startswith("r-4-glossary") and ci == 0:
                    continue
                if path.name.startswith("r-5-sources") and ci == 0:
                    continue
                if looks_english_prose(cell):
                    hits.append((lineno, f"TABLE_CELL[{ci}]", cell[:120]))
            i += 1
            continue

        lm = LIST_ITEM.match(line)
        if lm:
            body = lm.group(2)
            if looks_english_prose(body):
                hits.append((lineno, "LIST", body[:120]))
            i += 1
            continue

        for lm2 in LINK.finditer(line):
            text = lm2.group(1)
            if looks_english_prose(text):
                if text in {"Inside a Decompiler", "Inside an LLM Serving GPU"}:
                    continue
                if text.startswith("phases/") or text.startswith("http") or text.startswith("manuals/"):
                    continue
                if re.match(r"^[a-z0-9.-]+\.(com|org|io|html?)(/\S*)?$", text, re.I):
                    continue
                hits.append((lineno, "LINK_TEXT", text[:120]))

        if stripped and not stripped.startswith(">") and not stripped.startswith("<!--"):
            if looks_english_prose(stripped) and not stripped.startswith("#"):
                hits.append((lineno, "PROSE", stripped[:120]))

        i += 1
    return hits


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("manual")
    ap.add_argument("--root", default=".")
    ap.add_argument("--allow-incident-col", action="store_true")
    ap.add_argument("--explain", action="store_true",
                    help="print ALLOWED hits that were suppressed (debug)")
    args = ap.parse_args()
    root = Path(args.root) / "manuals" / args.manual
    if not root.is_dir():
        print(f"missing {root}", file=sys.stderr)
        return 2

    all_hits: list[tuple[str, int, str, str]] = []
    files = 0
    for path in sorted(root.rglob("*.md")):
        files += 1
        for lineno, kind, text in scan_file(path, args.allow_incident_col):
            rel = str(path.relative_to(Path(args.root)))
            all_hits.append((rel, lineno, kind, text))

    by_kind: dict[str, int] = {}
    by_file: dict[str, int] = {}
    for rel, lineno, kind, text in all_hits:
        by_kind[kind.split("[")[0]] = by_kind.get(kind.split("[")[0], 0) + 1
        by_file[rel] = by_file.get(rel, 0) + 1

    print(f"manual={args.manual} files_scanned={files}")
    print(f"FAIL_hits={len(all_hits)} unexplained={len(all_hits)}")
    print("by_kind:", ", ".join(f"{k}={v}" for k, v in sorted(by_kind.items())) or "(none)")
    if by_file:
        print("by_file:")
        for rel, n in sorted(by_file.items(), key=lambda kv: -kv[1]):
            print(f"  {n:4d}  {rel}")
        print("--- hits ---")
        for rel, lineno, kind, text in all_hits:
            print(f"{rel}:{lineno}:{kind}: {text}")
    else:
        print("by_file: (none)")
        print("--- hits ---")
        print("(none)")

    return 1 if all_hits else 0


if __name__ == "__main__":
    raise SystemExit(main())
