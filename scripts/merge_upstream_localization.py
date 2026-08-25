#!/usr/bin/env python3
"""Merge localized lesson files across an independent upstream history.

Quiz option shuffles are mapped through the old English option text so the
existing Chinese strings follow the new order. Documentation changes that add
only registered figure blocks retain the existing translation; other docs are
replaced with current English and listed for the translation pass.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


FIGURE_RE = re.compile(r"```figure\n.*?\n```\n?", re.DOTALL)
HEADING_RE = re.compile(r"^#{1,6} ")


def git(source: Path, *args: str, text: bool = False) -> bytes | str:
    return subprocess.check_output(
        ["git", *args], cwd=source, text=text, stderr=subprocess.DEVNULL
    )


def show_text(source: Path, revision: str, path: str) -> str | None:
    try:
        result = git(source, "show", f"{revision}:{path}", text=True)
    except subprocess.CalledProcessError:
        return None
    assert isinstance(result, str)
    return result


def changed_paths(source: Path, base: str, head: str, pattern: str) -> list[str]:
    result = git(
        source, "diff", "--name-only", f"{base}..{head}", "--", pattern, text=True
    )
    assert isinstance(result, str)
    return result.splitlines()


def normalize_without_figures(text: str) -> str:
    stripped = FIGURE_RE.sub("", text)
    return re.sub(r"\n{3,}", "\n\n", stripped).strip()


def insert_figure_blocks(local: str, latest: str) -> str | None:
    lines = local.splitlines()
    headings = [index for index, line in enumerate(lines) if HEADING_RE.match(line)]
    insertions: list[tuple[int, str]] = []
    for match in FIGURE_RE.finditer(latest):
        before = latest[: match.start()]
        heading_ordinal = sum(1 for line in before.splitlines() if HEADING_RE.match(line))
        tail = latest[match.end() :].splitlines()
        next_line = next((line for line in tail if line.strip()), "")
        if not HEADING_RE.match(next_line) or heading_ordinal >= len(headings):
            return None
        block = match.group(0).strip()
        if block in local:
            continue
        insertions.append((headings[heading_ordinal], block))
    for index, block in reversed(insertions):
        lines[index:index] = [block, ""]
    return "\n".join(lines).rstrip() + "\n"


def question_list(payload: Any) -> list[dict[str, Any]] | None:
    questions = payload.get("questions") if isinstance(payload, dict) else payload
    if not isinstance(questions, list) or any(not isinstance(item, dict) for item in questions):
        return None
    return questions


def merge_quiz(old: Any, latest: Any, local: Any) -> Any | None:
    old_questions = question_list(old)
    latest_questions = question_list(latest)
    local_questions = question_list(local)
    if not old_questions or not latest_questions or not local_questions:
        return None
    if len(old_questions) != len(latest_questions) or len(old_questions) != len(local_questions):
        return None

    merged_questions: list[dict[str, Any]] = []
    for old_q, latest_q, local_q in zip(old_questions, latest_questions, local_questions):
        if old_q.get("question") != latest_q.get("question"):
            return None
        if old_q.get("explanation") != latest_q.get("explanation"):
            return None
        old_options = old_q.get("options")
        latest_options = latest_q.get("options")
        local_options = local_q.get("options")
        if not all(isinstance(options, list) for options in (old_options, latest_options, local_options)):
            return None
        if len(old_options) != len(local_options) or sorted(old_options) != sorted(latest_options):
            return None
        translations = dict(zip(old_options, local_options))
        merged_q = dict(latest_q)
        merged_q["question"] = local_q["question"]
        merged_q["options"] = [translations[option] for option in latest_options]
        merged_q["explanation"] = local_q["explanation"]
        merged_questions.append(merged_q)

    if isinstance(latest, list):
        return merged_questions
    merged = dict(latest)
    if isinstance(old, dict) and isinstance(local, dict) and old.get("title") == latest.get("title"):
        merged["title"] = local.get("title", latest.get("title"))
    merged["questions"] = merged_questions
    return merged


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--base", required=True)
    parser.add_argument("--head", default="main")
    parser.add_argument("--target", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--pending", default="i18n/upstream_translation_pending.txt")
    args = parser.parse_args()

    source = args.source.resolve()
    target = args.target.resolve()
    pending: set[str] = set()
    completed: set[str] = set()
    stats = {
        "docs_figure_merged": 0,
        "docs_pending_translation": 0,
        "quizzes_mapped": 0,
        "quizzes_pending_translation": 0,
    }

    for rel in changed_paths(source, args.base, args.head, "phases/**/docs/en.md"):
        latest = show_text(source, args.head, rel)
        old = show_text(source, args.base, rel)
        if latest is None:
            continue
        destination = target / rel
        local = destination.read_text(encoding="utf-8") if destination.exists() else ""
        merged = None
        if old is not None and normalize_without_figures(old) == normalize_without_figures(latest):
            merged = insert_figure_blocks(local, latest)
        if merged is not None:
            destination.write_text(merged, encoding="utf-8")
            completed.add(rel)
            stats["docs_figure_merged"] += 1
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(latest, encoding="utf-8")
            pending.add(rel)
            stats["docs_pending_translation"] += 1

    for rel in changed_paths(source, args.base, args.head, "phases/**/quiz.json"):
        latest_text = show_text(source, args.head, rel)
        old_text = show_text(source, args.base, rel)
        if latest_text is None:
            continue
        destination = target / rel
        local_text = destination.read_text(encoding="utf-8") if destination.exists() else None
        merged = None
        if old_text is not None and local_text is not None:
            merged = merge_quiz(json.loads(old_text), json.loads(latest_text), json.loads(local_text))
        if merged is not None:
            destination.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            completed.add(rel)
            stats["quizzes_mapped"] += 1
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(latest_text, encoding="utf-8")
            pending.add(rel)
            stats["quizzes_pending_translation"] += 1

    pending_path = target / args.pending
    existing = set(pending_path.read_text(encoding="utf-8").splitlines()) if pending_path.exists() else set()
    pending_path.parent.mkdir(parents=True, exist_ok=True)
    pending_path.write_text("\n".join(sorted(existing | pending)) + "\n", encoding="utf-8")
    completed_path = pending_path.with_name("upstream_translation_completed.txt")
    completed_path.write_text("\n".join(sorted(completed)) + "\n", encoding="utf-8")
    print(json.dumps({**stats, "pending": len(existing | pending)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
