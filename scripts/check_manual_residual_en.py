#!/usr/bin/env python3
"""Flag untranslated English sentences in a translated AIEFS zh manual.

Rule (Wu, 2026-11-05 09:22 SGT, bot-hub#109: 「修复一下 CI 吧，但是没那么严格，
有些必要的英文还是需要的」):

  KEEP (never reported) -- necessary English: technical terms, code, commands,
  flags, API / field / file names, proper nouns, product and paper titles,
  short English labels, and English mixed into Chinese sentences.

  BLOCK (reported) -- a whole untranslated English sentence or paragraph.

How a text is judged (``is_untranslated_sentence``):

1. Normalise: decode HTML entities (``&nbsp;`` etc.), NFKC (fullwidth
   letters become ASCII) and drop zero-width characters
   (U+200B/200C/200D/2060/FEFF, soft hyphen).
2. Remove things that are English by nature: inline code spans, bare URLs,
   link targets, and the text of links to external ``http(s)://`` pages
   (titles of external works) of at most LINK_TEXT_MAX_WORDS (12) words;
   longer external link text is judged. Text of internal links (#anchors,
   repo paths) stays and is judged. Image alt text is always judged (the
   image URL is dropped). ``{{...}}`` tip citations are removed: the site build
   strips them from the page with the same regex, so no reader sees them.
   A quotation ("..." “...” 「...」) inside a sentence that still has Chinese
   outside the quotes is a verbatim citation (log line, spec MUST text,
   article title) and is removed if it has at most QUOTE_MAX_WORDS (25)
   words; a longer quotation, or a text that is only a quotation, is judged.
   Per text the exemptions are capped: when the exempt quotation and link
   words add up to more than EXEMPT_TOTAL_MAX_WORDS (30), or the exempt
   external link words alone to more than LINK_TOTAL_MAX_WORDS (15), nothing
   is exempt and every quote / link text is judged (a chain of short quotes
   or links is an English paragraph).
3. Split the rest into English runs at every CJK ideograph / kana / hangul.
   So English inside a Chinese sentence is judged run by run.
4. Count words in each run. Tokens are split at whitespace and at
   ``, ; : ! ? ( ) [ ] < > " | 「 」 『 』`` (NFKC turns "，" into "," without a space). A word is a token made only of ASCII letters
   (optionally with an apostrophe); a hyphen chain with 3+ parts counts each
   alphabetic part as a word (``we-restart-the-server``). Tokens with digits,
   dots, slashes, underscores, camelCase joints etc. are identifiers, not
   words.
5. A run is an untranslated sentence when it has >= 5 words and >= 2
   function words (FUNCTION_WORDS) and one of:
     a. at least half of its words are function words; or
     b. it has >= 7 words and >= 40% are function words; or
     c. it is not Title Case: the run, or any window of 8 consecutive words
        in it, has >= 5 words and >= 2 function words and, among its content
        words after the first (function words and identifiers like GRPO /
        arXiv do not vote), all-lowercase words outnumber Capitalised words
        (paper / product titles are Title Case, sentences are not; the window
        stops a long title from outvoting an appended sentence).
   d. (one function word) it has >= 7 words and at least 5, and >= 75%, of
      its content words after the first are all-lowercase.
   e. (Title Case) it has no all-lowercase content word after the first and
      either ends in ``.`` ``!`` ``?`` (optionally followed by closing
      quotes / brackets) or has more than TITLE_MAX_WORDS (15) words: a
      sentence written in Title Case, not a title.
   Before a-c (and after e), a paper title is kept: every content word after the first is
   Capitalised and most function words after the first are lower case
   ("A Survey of Large Language Models for Code Generation in the Wild").
   Anything below these bounds is kept as necessary English.

Elements judged: headings, each table cell, each list item, and prose
paragraphs (consecutive non-blank lines, joined, reported at the first line),
including ``>`` blockquotes and ``<!-- -->`` lines (site/build-manuals.js does
not strip comments from sections; it escapes and shows them). A paragraph
starting with ``Sources:`` is the citation block the site builder parses and
is skipped (Wu, 2026-11-05 10:14 SGT: Sources stays English and out of the
gate; the builder does not render that paragraph).

Fences are found exactly as site/build-manuals.js parseDocument() finds
them: a column-0 line matching ``^```\s*([A-Za-z0-9_-]*)\s*$`` opens, and
inside a fence only a column-0 ``^```\s*$`` line closes. ```` ```text ````
inside a fence is fence body; an indented ```` ``` ```` or ```` ```bash x ````
is paragraph text and judged. An opener whose info is not ``[a-z0-9-]+``
(``Rule``) is reported as FENCE_BAD_INFO and an unclosed fence as
FENCE_UNCLOSED: the site build fails on both.

Fenced blocks the site renders as prose are judged too (#141 r10):
  ``rule``      -- the ``label:`` value (RULE_LABEL, with continuation lines)
                   and the body after ``---`` joined (RULE); without ``---``
                   the whole block is the body; ``source:`` is a citation key
                   and is not judged (site/build-manuals.js splitHeader).
  ``takeaways`` -- each ``- item`` with its continuation lines (TAKEAWAY).
Other fenced blocks (code, ``figure``, ``listing``, ...) are skipped.

Out of scope (same as main, tracked in bot-hub#124): ``title:``/``caption:``/
``claim:``/``note:`` lines inside fenced ``figure`` / ``listing`` blocks.

As a safety net the frozen main checker (check_manual_residual_en_main_89cbf1a.py)
still runs. Every main hit is re-judged with the rule above on its FULL,
untruncated text (main truncates at 120 chars, B-9); it is reported unless it
is an exact reviewed text (MAIN_ONLY_ALLOWED_TEXTS + MAIN_ONLY_ALLOWED_FULL_CELLS)
or a whitelisted Sources title, or the rule says it is necessary English.
Exemptions are exact-text equality only; no substring / prefix / regex.

Known limits (documented, tested in LengthCapAndLimitTests): kept are an
English sentence of 4 words or fewer; a Title Case run below bound a/b; a
sentence with no function word; a quotation of <= 25 words or external link
text of <= 12 words inside a Chinese sentence; a sentence split by a CJK word
or a kana every <= 4 words (each run is judged alone); words joined by
``_``/``.``/``/`` (identifiers); non-Latin homoglyphs (Cyrillic letters).

Canonical path: scripts/check_manual_residual_en.py (do not duplicate under
manuals/_shared/). Wired as the Residual English gate in
.github/workflows/manuals.yml.
"""
from __future__ import annotations

import argparse
import html
import re
import sys
import unicodedata
from pathlib import Path, PurePosixPath

CJK = re.compile(r"[\u4e00-\u9fff]")
# Characters that end an English run: CJK ideographs (incl. ext. A and
# compatibility), kana, hangul.
RUN_BREAK = re.compile(
    r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]+"
)
ZERO_WIDTH = re.compile("[\u200b\u200c\u200d\u2060\ufeff\u00ad]")
HEADING = re.compile(r"^(#{1,6})\s+(.+?)(?:\s+\{#[a-z0-9-]+\})?\s*$")
LINK = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
INLINE_CODE = re.compile(r"`[^`]+`")
BARE_URL = re.compile(r"\b(?:https?|ftp)://\S+|\bwww\.\S+", re.I)
TABLE_ROW = re.compile(r"^\|(.+)\|\s*$")
TABLE_SEP = re.compile(r"^\|[\s:|-]+\|\s*$")
LIST_ITEM = re.compile(r"^(\s*[-*]|\s*\d+\.)\s+(.+)$")
# NFKC turns "，" into "," with no space after it, so split on punctuation too.
TOKEN_SPLIT = re.compile(r"[\s,;:!?()\[\]<>\"“”‘’|「」『』]+")
TOKEN_EDGE = "\"'()[]{}<>,.:;!?*_~|“”‘’…—–=#"
PLAIN_WORD = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)?")
HYPHEN_CHAIN = re.compile(r"[A-Za-z0-9.]+(?:-[A-Za-z0-9.]+){2,}")
ALPHA_PART = re.compile(r"[A-Za-z]+")
TIP_SPAN = re.compile(r"\{\{(.+?)\}\}")
QUOTED = re.compile(r'"[^"\n]+"|“[^”\n]+”|「[^」\n]+」|『[^』\n]+』')
SOURCES_PARA = re.compile(r"^Sources[:：]\s")
IMAGE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
# Fences exactly as site/build-manuals.js parseDocument() sees them: an
# opener is a column-0 line matching FENCE_OPEN, and only a column-0 bare
# ``` line closes it. Indented ``` lines, ```text inside a fence, or
# "```bash extra" are not fence lines (#141 r11).
FENCE_OPEN = re.compile(r"^```\s*([A-Za-z0-9_-]*)\s*$")
FENCE_CLOSE = re.compile(r"^```\s*$")
FENCE_INFO_OK = re.compile(r"^[a-z0-9-]+$")
FENCE_KEY = re.compile(r"^([a-z][a-z-]*):\s*(.*)$")
FENCE_CONT = re.compile(r"^\s{2,}\S")
FENCE_RULE_SEP = re.compile(r"^---\s*$")
FENCE_ITEM = re.compile(r"^[-*]\s+(.*)$")

MIN_WORDS = 5
MIN_FUNC_WORDS = 2
LONG_RUN_WORDS = 7
# Exempt spans are exempt only up to a length: the longest real quotation in
# the five manuals is 24 words, the longest external link text 10 words.
QUOTE_MAX_WORDS = 25
LINK_TEXT_MAX_WORDS = 12
# Per judged text (paragraph, cell, item, heading): when the exempt quotation
# and external link words add up past these totals, nothing is exempt and all
# of it is judged. Real maxima: 24 exempt words in one text, 11 words of
# external link text in one text (#141 r11).
EXEMPT_TOTAL_MAX_WORDS = 30
LINK_TOTAL_MAX_WORDS = 15
# A Title Case run longer than this, or ending in . ! ?, is not a title
# (real maximum: 13 words, none ends in a period).
TITLE_MAX_WORDS = 15

FUNCTION_WORDS = frozenset("""
a an the this that these those
is are was were be been being am
do does did has have had
can could will would should must may might shall
to of in on at by for with from into onto over under about
and or but nor so because while if when then than as
it its they them their we us our you your he she him his her i
not no which who whom whose what where why how there here
also only just very each every any some such
""".split())

SOURCES_FILENAME = re.compile(r"^r-.+-sources.*\.md$")
# Exact list-item / table-cell bodies (after strip) in r-*-sources*.md only.
# miles-101 r-4-sources.md:26-27 and sglang-101 r-5-sources.md:60.
SOURCES_TITLE_WHITELIST = frozenset({
    "Rollout Routing Replay，arXiv 2510.11370。",
    "Score Centering Stabilizes Off-policy Reinforcement Learning，arXiv 2609.20807。",
    "Patodiya，Same Request, Different Answer: Quantization Amplifies "
    "Cache-Induced Divergence in LLM Serving, "
    "[arXiv 2609.04748](https://arxiv.org/abs/2609.04748)",
})

# research/ holds verbatim upstream spec/source copies and line-cited briefs
# kept as English originals. Those files are never rendered as pages and are
# not in the EPUB. Translating them would break quote checks and they would
# no longer be originals. Rendered links into research/ are kept and labeled
# 「（英文原文）」.
# Decision: https://github.com/cluster1900/bot-hub/issues/109#issuecomment-6519284164
EXCLUDED_DIRS = (PurePosixPath("manuals/a2a-101/research"),)


def is_excluded(rel: PurePosixPath) -> bool:
    """True when rel sits inside an EXCLUDED_DIRS path (exact path-part match)."""
    for excluded in EXCLUDED_DIRS:
        if rel.parts[: len(excluded.parts)] == excluded.parts:
            return True
    return False


def is_sources_filename(name: str) -> bool:
    return bool(SOURCES_FILENAME.match(name))


def is_whitelisted_sources_title(name: str, text: str) -> bool:
    """True when *text* is one of the three exact Sources titles.

    Applied only in ``r-*-sources*.md``. Comparison is strip-then-equality.
    """
    return is_sources_filename(name) and text.strip() in SOURCES_TITLE_WHITELIST


def has_cjk(s: str) -> bool:
    return bool(CJK.search(s))


def normalize(text: str) -> str:
    # html.unescape: "&nbsp;" / "&#32;" render as spaces, so they split words.
    return ZERO_WIDTH.sub("", unicodedata.normalize("NFKC", html.unescape(text)))


def _exempt_link_words(m: re.Match) -> int | None:
    """Word count of an exempt external link text, None when not exempt."""
    target = m.group(2).strip()
    n = len(run_words(m.group(1)))
    if re.match(r"(?:https?|ftp)://", target, re.I) and n <= LINK_TEXT_MAX_WORDS:
        return n
    return None


def _link_sub(m: re.Match) -> str:
    if _exempt_link_words(m) is not None:
        return " "  # title of an external work: necessary English
    return " " + m.group(1) + " "


def _exempt_quote_words(m: re.Match) -> int | None:
    n = len(run_words(m.group(0)[1:-1]))
    return n if n <= QUOTE_MAX_WORDS else None


def _quote_sub(m: re.Match) -> str:
    if _exempt_quote_words(m) is not None:
        return " "  # verbatim citation
    return " " + m.group(0) + " "


def _keep_link_text(m: re.Match) -> str:
    return " " + m.group(1) + " "


def strip_necessary(text: str) -> str:
    """Remove spans that are English by nature (step 2 of the rule)."""
    t = normalize(text)
    t = INLINE_CODE.sub(" ", t)
    # Image alt text is shown to readers (and screen readers) whatever the
    # image URL is: keep the alt, drop the target, then judge it.
    t = IMAGE.sub(lambda m: " " + m.group(1) + " ", t)
    link_words = sum(n for n in map(_exempt_link_words, LINK.finditer(t)) if n is not None)
    base = t
    t = LINK.sub(_link_sub, t)
    t = BARE_URL.sub(" ", t)
    # Tip citations are removed from rendered HTML by site/build-manuals.js
    # (same regex), so a reader never sees them.
    t = TIP_SPAN.sub(" ", t)
    # A quotation embedded in a Chinese sentence is a verbatim citation (log
    # line, spec MUST text, article title): keep it. Without Chinese outside
    # the quotes the text is judged as is.
    unquoted = QUOTED.sub(_quote_sub, t)
    quote_words = 0
    if has_cjk(unquoted):
        quote_words = sum(n for n in map(_exempt_quote_words, QUOTED.finditer(t)) if n is not None)
        t = unquoted
    if link_words > LINK_TOTAL_MAX_WORDS or link_words + quote_words > EXEMPT_TOTAL_MAX_WORDS:
        # A chain of short quotes / links is a paragraph of English: no
        # exemption, judge every word.
        t = LINK.sub(_keep_link_text, base)
        t = BARE_URL.sub(" ", t)
        t = TIP_SPAN.sub(" ", t)
    return t


def run_words(run: str) -> list[str]:
    words: list[str] = []
    for raw in TOKEN_SPLIT.split(run):
        tok = raw.strip(TOKEN_EDGE)
        if not tok:
            continue
        if PLAIN_WORD.fullmatch(tok):
            words.append(tok)
        elif HYPHEN_CHAIN.fullmatch(tok):
            words.extend(p for p in tok.split("-") if ALPHA_PART.fullmatch(p))
        elif re.fullmatch(r"[A-Za-z]+(?:-[A-Za-z]+)", tok):
            words.append(tok)  # two-part compound (on-policy, Cache-Induced)
    return words


TITLE_WINDOW = 8


def is_sentence_run(words: list[str], ends_sentence: bool = False) -> bool:
    n = len(words)
    if n < MIN_WORDS:
        return False
    fw = sum(1 for w in words if w.lower() in FUNCTION_WORDS)
    if fw < MIN_FUNC_WORDS:
        return _few_function_words_sentence(words, fw)
    if _is_title_case(words):
        # e. A Title Case run that ends like a sentence, or is longer than any
        # title, is a sentence written in Title Case (#141 r11).
        if ends_sentence or n > TITLE_MAX_WORDS:
            return True
    if _is_paper_title(words):
        return False
    if fw * 2 >= n:
        return True
    if n >= LONG_RUN_WORDS and fw * 5 >= n * 2:
        return True
    # Title Case test, also on every window of TITLE_WINDOW words, so a
    # sentence appended to a long title is not outvoted by the title.
    for i in range(max(1, n - TITLE_WINDOW + 1)):
        if _not_title_case(words[i:i + TITLE_WINDOW]):
            return True
    return False


def _few_function_words_sentence(words: list[str], fw: int) -> bool:
    """A long lower-case run with a single function word is a sentence too
    ("Engineers restart servers nightly because processes leak memory")."""
    if fw < 1 or len(words) < LONG_RUN_WORDS:
        return False
    content = [w for w in words[1:] if w.lower() not in FUNCTION_WORDS]
    lower = sum(1 for w in content if w.islower())
    return lower * 4 >= len(content) * 3 and lower >= LONG_RUN_WORDS - 2


def _is_title_case(words: list[str]) -> bool:
    """No all-lowercase content word after the first word."""
    content = [w for w in words[1:] if w.lower() not in FUNCTION_WORDS]
    return len(content) >= 2 and not any(w.islower() for w in content)


def _is_paper_title(words: list[str]) -> bool:
    """Title Case as papers write it: every content word after the first is
    capitalised and most function words after the first are lower case
    ("A Survey of Large Language Models for Code Generation in the Wild").
    A sentence with Every Word Capitalised is not a title by this test."""
    rest = words[1:]
    content = [w for w in rest if w.lower() not in FUNCTION_WORDS]
    if len(content) < 2 or any(w.islower() for w in content):
        return False
    func = [w for w in rest if w.lower() in FUNCTION_WORDS]
    low = sum(1 for w in func if w.islower())
    return low > len(func) - low


def _not_title_case(words: list[str]) -> bool:
    if len(words) < MIN_WORDS:
        return False
    if sum(1 for w in words if w.lower() in FUNCTION_WORDS) < MIN_FUNC_WORDS:
        return False
    # Function words and identifiers like GRPO / arXiv do not vote.
    content = [w for w in words[1:] if w.lower() not in FUNCTION_WORDS]
    title = sum(1 for w in content if w[0].isupper() and w[1:].islower())
    lower = sum(1 for w in content if w.islower())
    return lower > title


def english_runs(text: str) -> list[str]:
    return [r for r in RUN_BREAK.split(strip_necessary(text)) if r.strip()]


SENTENCE_END = re.compile(r"[.!?][\s)\]\"'”’」』*_]*$")


def is_untranslated_sentence(text: str) -> bool:
    """True when *text* contains a whole untranslated English sentence."""
    return any(is_sentence_run(run_words(r), bool(SENTENCE_END.search(r.strip())))
               for r in english_runs(text))


# Backwards-compatible name used by review harnesses.
looks_english_prose = is_untranslated_sentence


def split_row(line: str) -> list[str]:
    body = line.strip()
    if body.startswith("|"):
        body = body[1:]
    if body.endswith("|"):
        body = body[:-1]
    return [c.strip() for c in body.split("|")]


# Union with main: every hit of the frozen main checker is re-judged here on
# its full text. It is dropped when the exact (untruncated) text is a reviewed
# main-only line or a whitelisted Sources title (exact equality, B-9), or when
# the relaxed rule says the text is necessary English (no whole sentence).
MAIN_ONLY_ALLOWED_TEXTS = frozenset({
    'FlashAttention、FlashInfer、Triton、FlexAttention、TurboQuant',
    'FlashInfer、FlashAttention、Triton、FlexAttention、TurboQuant',
    'L4（SM 8.9）、H100（SM 9.0）、DGX Spark（SM 12.1）',
    'Patodiya，Same Request, Different Answer: Quantization Amplifies Cache-Induced Divergence in LLM Serving, [arXiv 2609.047',
    'Rollout Routing Replay，arXiv 2510.11370。',
    'Rust a2a-server-lf-v0.5.1',
    'Score Centering Stabilizes Off-policy Reinforcement Learning，arXiv 2609.20807。',
    'a2a-dotnet {{sdk-dotnet src/A2A.AspNetCore/A2AEndpointRouteBuilderExtensions.cs at v1.0.0-preview2}}',
    'a2a-dotnet {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}}',
    'a2a-go {{sdk-go a2asrv/agentexec.go at v2.6.0}}',
    'a2a-go {{sdk-go a2asrv/push/sender.go at v2.6.0}}',
    'a2a-go {{sdk-go a2asrv/rest.go at v2.6.0}}',
    'a2a-java {{sdk-java reference/rest/src/main/java/org/a2aproject/sdk/server/rest/quarkus/A2AServerRoutes.java at v1.4.0.F',
    'a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java at ',
    'a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/tasks/BasePushNotificationSender.java at v1.4.',
    'a2a-js {{sdk-js src/server/express/rest_handler.ts at v1.3.0}}',
    'a2a-js {{sdk-js src/server/push_notification/default_push_notification_sender.ts at v1.3.0}}',
    'a2a-js {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}}',
    'a2a-python 1.2.2 {{sdk src/a2a/server/agent_execution/active_task.py}} {{sdk src/a2a/utils/errors.py}}',
    'a2a-python 1.2.2 {{sdk src/a2a/server/routes/rest_routes.py}}',
    'a2a-python 1.2.2 {{sdk src/a2a/server/tasks/base_push_notification_sender.py}}',
    'a2a-rs a2a-server-lf-v0.5.1',
    'a2a-rs {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}}',
    'a2a-rs {{sdk-rust a2a-server/src/push/sender.rs at a2a-server-lf-v0.5.1}}',
    'a2a-rs {{sdk-rust a2a-server/src/rest.rs at a2a-server-lf-v0.5.1}}',
    'a2a-rs, a2a-server 0.5.1',
})
_MAIN_BASELINE = None


def _main_baseline():
    global _MAIN_BASELINE
    if _MAIN_BASELINE is None:
        import importlib.util
        # Byte-frozen copy of origin/main 89cbf1a's checker. Runtime dependency
        # of scan_file (not a test fixture), so it lives next to the checker.
        # sha256 is pinned in the tests; do not edit it.
        p = Path(__file__).resolve().parent / "check_manual_residual_en_main_89cbf1a.py"
        spec = importlib.util.spec_from_file_location("_residual_en_main_baseline", p)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _MAIN_BASELINE = mod
    return _MAIN_BASELINE


# Main truncates hit text to 120 chars, so a 120-char hit text is only a
# prefix. Such a hit is exempt only when its FULL untruncated text is one of
# these reviewed cells (or a whitelisted Sources title); otherwise anything
# appended after char 120 (e.g. English inside a {{...}} span) would ride on
# the allowlist.
_MAIN_TRUNC = 120
MAIN_ONLY_ALLOWED_FULL_CELLS = frozenset({
    'a2a-java {{sdk-java reference/rest/src/main/java/org/a2aproject/sdk/server/rest/quarkus/A2AServerRoutes.java at v1.4.0.Final}}',
    'a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java at v1.4.0.Final}}',
    'a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/tasks/BasePushNotificationSender.java at v1.4.0.Final}}',
    'Patodiya，Same Request, Different Answer: Quantization Amplifies Cache-Induced Divergence in LLM Serving, [arXiv 2609.04748](https://arxiv.org/abs/2609.04748)',
})


def _main_full_text(lines, ln, kind, txt):
    """Untruncated text behind a main hit; None if it cannot be recovered."""
    if len(txt) < _MAIN_TRUNC:
        return txt
    if not (1 <= ln <= len(lines)):
        return None
    base, line = _main_baseline(), lines[ln - 1]
    m = re.fullmatch(r"TABLE_CELL\[(\d+)\]", kind)
    if m:
        cells = base.split_row(line)
        ci = int(m.group(1))
        return cells[ci] if ci < len(cells) else None
    if kind == "LIST":
        lm = base.LIST_ITEM.match(line)
        return lm.group(2) if lm else None
    if kind == "HEADING":
        hm = base.HEADING.match(line)
        return hm.group(2).strip() if hm else None
    if kind == "PROSE":
        return line.strip()
    return None


def _main_link_text(line, txt):
    """(full link text, is_external) for a main LINK_TEXT hit, or None."""
    for m in LINK.finditer(line):
        if m.group(1) == txt or (len(txt) >= _MAIN_TRUNC and m.group(1).startswith(txt)):
            ext = bool(re.match(r"(?:https?|ftp)://", m.group(2).strip(), re.I))
            return m.group(1), ext
    return None


def _union_with_main(path, hits, covered):
    have = {(ln, txt) for ln, _k, txt in hits}
    lines = path.read_text(encoding="utf-8").splitlines()
    for ln, kind, txt in _main_baseline().scan_file(path, False, False):
        if (ln, txt) in have or ln in covered:
            continue
        if kind == "LINK_TEXT":
            found = _main_link_text(lines[ln - 1], txt) if 1 <= ln <= len(lines) else None
            if found is not None and found[1]:
                continue  # title of an external work
            full = found[0] if found is not None else (txt if len(txt) < _MAIN_TRUNC else None)
        else:
            full = _main_full_text(lines, ln, kind, txt)
        if full is not None:
            if txt in MAIN_ONLY_ALLOWED_TEXTS and (
                len(txt) < _MAIN_TRUNC or full in MAIN_ONLY_ALLOWED_FULL_CELLS
            ):
                continue
            if is_whitelisted_sources_title(path.name, full):
                continue
        if not is_untranslated_sentence(full if full is not None else txt):
            continue  # necessary English under the relaxed rule
        hits.append((ln, "MAIN_" + kind, txt))
    hits.sort(key=lambda h: h[0])
    return hits


def scan_file(path: Path) -> tuple[list[tuple[int, str, str]], int]:
    hits: list[tuple[int, str, str]] = []
    covered: set[int] = set()
    explained = 0
    lines = path.read_text(encoding="utf-8").splitlines()
    para: list[tuple[int, str]] = []
    para_quote = False

    def flush():
        nonlocal para
        if para:
            text = " ".join(t for _ln, t in para)
            # "Sources: ..." is the structural citation block the site builder
            # parses (site/build-manuals.js); it lists files and documents.
            if SOURCES_PARA.match(text):
                para = []
                return
            if is_untranslated_sentence(text):
                hits.append((para[0][0], "PROSE", text[:120]))
                covered.update(ln for ln, _t in para)
            para = []

    def judge(lineno: int, kind: str, text: str) -> None:
        if text and is_untranslated_sentence(text):
            hits.append((lineno, kind, text[:120]))
            covered.add(lineno)

    def scan_fence(info: str, body: list[tuple[int, str]]) -> None:
        # Mirrors fenceBlock() in site/build-manuals.js for the two prose
        # fences. figure / listing title, claim, caption, note are out of
        # scope (bot-hub#124); code fences are code.
        if info == "rule":
            sep = next((k for k, (_ln, t) in enumerate(body) if FENCE_RULE_SEP.match(t)), None)
            head, rest = (body[:sep], body[sep + 1:]) if sep is not None else ([], body)
            key = None
            values: dict[str, list[tuple[int, str]]] = {}
            for ln, t in head:
                if not t.strip():
                    continue
                km = FENCE_KEY.match(t)
                if km:
                    key = km.group(1)
                    values.setdefault(key, []).append((ln, km.group(2).strip()))
                elif key is not None and FENCE_CONT.match(t):
                    values[key].append((ln, t.strip()))
                else:  # not a header line: judge it like the body
                    judge(ln, "RULE", t.strip())
            for key, parts in values.items():
                if key != "source":  # source is a citation key into research/
                    judge(parts[0][0], "RULE_" + key.upper(), " ".join(t for _l, t in parts))
            text = [(ln, t.strip()) for ln, t in rest if t.strip()]
            if text:
                judge(text[0][0], "RULE", " ".join(t for _l, t in text))
        elif info == "takeaways":
            items: list[list] = []
            for ln, t in body:
                if not t.strip():
                    continue
                im = FENCE_ITEM.match(t)
                if im or not items:
                    items.append([ln, (im.group(1) if im else t).strip()])
                else:
                    items[-1][1] += " " + t.strip()
            for ln, t in items:
                judge(ln, "TAKEAWAY", t)

    fence_info: str | None = None
    fence_body: list[tuple[int, str]] = []
    fence_line = 0
    for i, line in enumerate(lines):
        lineno = i + 1
        stripped = line.strip()
        if fence_info is not None:
            if FENCE_CLOSE.match(line):
                scan_fence(fence_info, fence_body)
                fence_info = None
            else:
                fence_body.append((lineno, line))
            continue
        fm = FENCE_OPEN.match(line)
        if fm:
            flush()
            fence_info, fence_body, fence_line = fm.group(1), [], lineno
            if fence_info and not FENCE_INFO_OK.match(fence_info):
                # site/build-manuals.js: "every code fence needs a language tag"
                # (a bare ``` opener fails the same build check; its body is
                # skipped here as code)
                hits.append((lineno, "FENCE_BAD_INFO", line.strip()))
                covered.add(lineno)
            continue
        if not stripped:
            flush()
            continue

        m = HEADING.match(line)
        if m:
            flush()
            title = m.group(2).strip()
            if is_untranslated_sentence(title):
                hits.append((lineno, "HEADING", title[:120]))
                covered.add(lineno)
            continue

        if TABLE_SEP.match(line):
            flush()
            continue

        if TABLE_ROW.match(line):
            flush()
            for ci, cell in enumerate(split_row(line)):
                if is_whitelisted_sources_title(path.name, cell):
                    explained += 1
                    continue
                if is_untranslated_sentence(cell):
                    hits.append((lineno, f"TABLE_CELL[{ci}]", cell[:120]))
                    covered.add(lineno)
            continue

        lm = LIST_ITEM.match(line)
        if lm:
            flush()
            body = lm.group(2)
            if is_whitelisted_sources_title(path.name, body):
                explained += 1
                continue
            if is_untranslated_sentence(body):
                hits.append((lineno, "LIST", body[:120]))
                covered.add(lineno)
            continue

        quote = stripped.startswith(">")
        text = re.sub(r"^(?:>\s*)+", "", stripped) if quote else stripped
        if para and quote != para_quote:
            flush()
        para_quote = quote
        if text:
            para.append((lineno, text))
        else:
            flush()
    flush()
    if fence_info is not None:
        # The site build fails on an unclosed fence; so does this gate.
        hits.append((fence_line, "FENCE_UNCLOSED", "```" + fence_info))
        covered.add(fence_line)
    return _union_with_main(path, hits, covered), explained


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("manual")
    ap.add_argument("--root", default=".")
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
    excluded_files = 0
    repo_root = Path(args.root)
    for path in sorted(root.rglob("*.md")):
        rel = PurePosixPath(path.relative_to(repo_root).as_posix())
        if is_excluded(rel):
            excluded_files += 1
            continue
        files += 1
        file_hits, file_explained = scan_file(path)
        explained += file_explained
        for lineno, kind, text in file_hits:
            all_hits.append((str(rel), lineno, kind, text))

    if files == 0:
        print(f"no markdown files under {root}", file=sys.stderr)
        return 2

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
    print(f"excluded_files={excluded_files} (manuals/a2a-101/research)")
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
