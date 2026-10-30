#!/usr/bin/env python3
"""Flag residual English prose in a translated AIEFS zh manual.

Reports table cells, list items, link texts, and prose lines that look like
predominantly ASCII English, excluding code fences, inline code, Sources lines,
allowed names, tip citation templates, and opt-in intentional EN columns.

Allowlist is intentionally tight:
- CJK ideographs mark localized text; fullwidth punctuation alone does not.
- `docs/` matches only path-like tip citations / doc pointers, not any substring.
- First-column skips (incident names, glossary terms, Sources titles) require
  explicit flags — they are never automatic.

Canonical path: scripts/check_manual_residual_en.py (do not duplicate under
manuals/_shared/). Wired as the Residual English gate in
.github/workflows/manuals.yml.
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
TIP_SPAN = re.compile(r"\{\{[^{}]*\}\}")
CJK_LIST_SEP = re.compile(r"[、，；]")
PAREN_GROUP = re.compile(r"[（(][^）)]*[）)]")
PRODUCT_ITEM = re.compile(r"^[A-Z0-9][\w.+\-/]*(?:\s+[A-Z0-9][\w.+\-/]*)*$")
SOURCES_ARXIV_LIST = re.compile(r"^.+，arXiv \d{4}\.\d{5}。$")
SOURCES_LINK_LIST = re.compile(r"^(?:.+[，,]\s*)?\[[^\]]+\]\([^)]+\)[。.]?$")
SOURCES_FILENAME = re.compile(r"^r-.+-sources.*\.md$")
LOWERCASE_PHRASE = re.compile(r"\b[a-z]{2,}\b(?:\s+[a-z]{2,}\b)+")
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


def strip_tip_spans(s: str) -> str:
    return TIP_SPAN.sub(" ", s)


def func_word_in_prose(s: str) -> bool:
    """True if FUNC_WORDS matches a standalone word, not an identifier token.

    Hyphen and dot are word boundaries for ``\\b``, so ``server`` in
    ``a2a-server`` and ``at`` in a dotted path would otherwise fire.
    """
    for m in FUNC_WORDS.finditer(s):
        left = s[m.start() - 1] if m.start() > 0 else ""
        right = s[m.end()] if m.end() < len(s) else ""
        left2 = s[m.start() - 2] if m.start() > 1 else ""
        right2 = s[m.end() + 1] if m.end() + 1 < len(s) else ""
        # only inside an identifier: the separator must join word chars,
        # so sentence-final "this." is still prose
        if (left in ("-", ".") and left2.isalnum()) or (
            right in ("-", ".") and right2.isalnum()
        ):
            continue
        return True
    return False


def is_product_item(item: str) -> bool:
    core = PAREN_GROUP.sub("", item).strip()
    return bool(core) and bool(PRODUCT_ITEM.match(core))


def split_cjk_list(text: str) -> list[str] | None:
    if not CJK_LIST_SEP.search(text):
        return None
    return [part.strip() for part in CJK_LIST_SEP.split(text) if part.strip()]


def is_product_name_list(text: str) -> bool:
    items = split_cjk_list(text)
    if not items:
        return False
    return all(is_product_item(item) for item in items)


def cjk_list_has_lowercase_prose(text: str) -> bool:
    """CJK-joined list whose leftover item is lowercase English words.

    A single identifier token (arm64, load, block-wise) is not enough;
    ``compute capability`` is.
    """
    items = split_cjk_list(text)
    if not items or all(is_product_item(item) for item in items):
        return False
    for item in items:
        if is_product_item(item):
            continue
        core = PAREN_GROUP.sub("", item).strip()
        if has_cjk(core):
            continue
        if LOWERCASE_PHRASE.search(core):
            return True
    return False


def is_sources_filename(name: str) -> bool:
    return bool(SOURCES_FILENAME.match(name))


def is_sources_title_list_item(body: str) -> bool:
    t = body.strip()
    return bool(SOURCES_ARXIV_LIST.match(t) or SOURCES_LINK_LIST.match(t))


def has_cjk(s: str) -> bool:
    """True only when the text has CJK ideographs.

    Fullwidth / CJK punctuation alone (e.g. a Chinese comma before leftover
    English) must NOT count — that was an allowlist hole that hid residual EN.
    """
    return bool(CJK.search(s))


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
    # Product/section H1s kept EN by convention: Glossary / Sources / RadixCache.
    # "Index of figures" is NOT allowlisted — it must be translated (图索引).
    if t in {"Glossary", "Sources", "RadixCache", "术语表", "源", "图索引"}:
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
    bare = strip_tip_spans(strip_inline_code(strip_links(t))).strip()
    if not bare:
        return True
    if is_product_name_list(bare):
        return True
    if has_cjk(bare):
        # product/version soup with CJK ideographs still allowed
        return True
    if not LATIN_WORD.search(bare):
        return True
    # identifier / version / metric soup without English prose words
    if not func_word_in_prose(bare) and TOKENISH.match(bare):
        return True
    if re.fullmatch(r"[A-Za-z0-9_./+\-]+", bare) and len(bare) <= 48:
        return True
    # tokens/s, KiB, GB style measurements and ranges
    if re.fullmatch(r"[\d,.]+\s*(tokens/s|tok/s|KiB|MiB|GiB|GB|MB|ms|s|%|Hz|MHz)?(\s*[（(][\d,.\s]+(to|–|-)[\d,.\s]+[）)])?", bare, re.I):
        return True
    if re.fullmatch(r"[\d,.]+\s+(and|to|against|on|per)\s+[\d,.]+(\s+\w+)?", bare, re.I):
        if len(LATIN_WORD.findall(bare)) <= 3:
            return True
    # tip docs path citation (path-like only — not any "docs/" substring)
    if re.fullmatch(r"(?:[A-Za-z0-9_.\-]+/)*docs/[A-Za-z0-9_./\-]+\.md", bare):
        return True
    # tip doc pointer: optional tool + docs/*.md + comma + work/doc title (EN kept)
    if re.match(
        r"^(?:[A-Za-z0-9_.\-]+\s+)?(?:[A-Za-z0-9_.\-]+/)*docs/"
        r"[A-Za-z0-9_./\-]+\.md\s*[，,]\s*.+$",
        bare,
    ):
        return True
    # Sources report title cells: mostly markdown links to blog posts
    if t.count("](") >= 1 and ("http" in t or t.startswith("[")):
        # after stripping links, little prose left
        if len(LATIN_WORD.findall(bare)) < 4 or not func_word_in_prose(bare):
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
    t = strip_tip_spans(strip_inline_code(strip_links(t0))).strip()
    if not t:
        return False
    if is_allowed_cell(t0) or is_allowed_cell(t):
        return False
    if cjk_list_has_lowercase_prose(t0) or cjk_list_has_lowercase_prose(t):
        return True
    if has_cjk(t):
        # Already translated unless English still dominates
        if latin_ratio(t) > 0.55 and func_word_in_prose(t) and len(LATIN_WORD.findall(t)) >= 5:
            return True
        return False
    words = LATIN_WORD.findall(t)
    if len(words) == 0:
        return False
    if func_word_in_prose(t):
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


def scan_file(
    path: Path,
    allow_incident_col: bool,
    allow_ref_title_col: bool = False,
) -> tuple[list[tuple[int, str, str]], int]:
    hits: list[tuple[int, str, str]] = []
    explained = 0
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
                # Col0 skips are opt-in only (review: blanket skip was too loose).
                skip_col = (
                    (allow_incident_col and path.name.startswith("r-3-incident") and ci == 0)
                    or (allow_ref_title_col and path.name.startswith("r-4-glossary") and ci == 0)
                    or (allow_ref_title_col and path.name.startswith("r-5-sources") and ci == 0)
                )
                if skip_col:
                    if looks_english_prose(cell):
                        explained += 1
                    continue
                if looks_english_prose(cell):
                    hits.append((lineno, f"TABLE_CELL[{ci}]", cell[:120]))
            i += 1
            continue

        lm = LIST_ITEM.match(line)
        if lm:
            body = lm.group(2)
            if (
                allow_ref_title_col
                and is_sources_filename(path.name)
                and is_sources_title_list_item(body)
            ):
                if looks_english_prose(body):
                    explained += 1
                i += 1
                continue
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
    return hits, explained


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("manual")
    ap.add_argument("--root", default=".")
    ap.add_argument(
        "--allow-incident-col",
        action="store_true",
        help="skip col0 of r-3-incident*.md (EN incident name / title column)",
    )
    ap.add_argument(
        "--allow-ref-title-col",
        action="store_true",
        help="skip col0 of r-4-glossary*.md and r-5-sources*.md "
        "(EN term / paper-title columns); also skip LIST items in "
        "r-*-sources*.md that are a title plus ，arXiv NNNN.NNNNN。 or a link",
    )
    ap.add_argument("--explain", action="store_true",
                    help="print ALLOWED hits that were suppressed (debug)")
    args = ap.parse_args()
    root = Path(args.root) / "manuals" / args.manual
    if not root.is_dir():
        print(f"missing {root}", file=sys.stderr)
        return 2

    all_hits: list[tuple[str, int, str, str]] = []
    explained = 0
    files = 0
    for path in sorted(root.rglob("*.md")):
        files += 1
        file_hits, file_explained = scan_file(
            path, args.allow_incident_col, args.allow_ref_title_col
        )
        explained += file_explained
        for lineno, kind, text in file_hits:
            rel = str(path.relative_to(Path(args.root)))
            all_hits.append((rel, lineno, kind, text))

    by_kind: dict[str, int] = {}
    by_file: dict[str, int] = {}
    for rel, lineno, kind, text in all_hits:
        by_kind[kind.split("[")[0]] = by_kind.get(kind.split("[")[0], 0) + 1
        by_file[rel] = by_file.get(rel, 0) + 1

    print(f"manual={args.manual} files_scanned={files}")
    print(
        f"FAIL_hits={len(all_hits)} unexplained={len(all_hits)} "
        f"explained={explained}"
    )
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
