#!/usr/bin/env python3
"""Audit Chinese localization completeness.

This script is deliberately conservative. It flags likely untranslated prose,
JSON/schema breakage, missing image localization outputs, and protected terms
that were translated into common Chinese substitutions.
"""

from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from i18n_translate_large_text_codex import html_spans, js_string_spans

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "i18n" / "manifest.json"
SVG_TEXT_MANIFEST = ROOT / "i18n" / "svg_text_manifest.json"
PROTECTED_TERMS = ROOT / "i18n" / "protected_terms.txt"
PROTECTED_REPLACEMENTS = ROOT / "i18n" / "protected_replacements.json"

PROSE_EN_RE = re.compile(r"[A-Za-z][A-Za-z0-9][A-Za-z0-9 ,.;:!?()'\"/+\-&]{24,}")
CHINESE_RE = re.compile(r"[\u4e00-\u9fff]")
PROSE_MARKER_RE = re.compile(
    r"\b(the|a|an|and|or|but|if|when|while|with|without|from|into|between|before|after|"
    r"because|should|must|can|could|will|would|is|are|was|were|be|been|being|has|have|"
    r"had|do|does|did|use|uses|using|run|runs|make|makes|return|returns|verify|check|"
    r"explain|compare|predict|identify|choose|write|read|propose|proposes)\b",
    flags=re.IGNORECASE,
)
BAD_TRANSLATIONS = json.loads(PROTECTED_REPLACEMENTS.read_text(encoding="utf-8"))
PROTECTED_TERM_LIST = [
    line.strip()
    for line in PROTECTED_TERMS.read_text(encoding="utf-8").splitlines()
    if line.strip() and not line.startswith("#")
]

ENGLISH_SVG_ALLOWLIST = {
    # These figures intentionally show English corpus samples or protocol labels.
    "phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/assets/bow-tfidf.svg",
    "phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/assets/pos-parse.svg",
    "site/assets/figures/001-a-prompts.svg",
    "site/assets/figures/001-b-skills.svg",
    "site/assets/figures/001-c-agents.svg",
    "site/assets/figures/001-d-mcp-servers.svg",
}

# Exact source text that must remain English because it is an official title,
# protocol token, command vocabulary, configuration value, prompt template, or
# adversarial fixture whose literal spelling is part of the lesson artifact.
ENGLISH_PROSE_ALLOWLIST = {
    "glossary/terms.md": ("Training Deep Nets with Sublinear Memory Cost",),
    "phases/04-computer-vision/18-open-vocab-clip/outputs/prompt-zero-shot-class-picker.md": (
        "a scanned document of a {}",
    ),
    "phases/13-tools-and-protocols/09-mcp-transports/quiz.json": (
        "Mcp-Session-Id and Last-Event-ID",
    ),
    "phases/14-agent-engineering/29-production-runtimes/quiz.json": (
        "Read, write, exec, fork, exit, wait",
    ),
    "phases/14-agent-engineering/31-agent-workbench-why-models-fail/quiz.json": (
        "Read, write, exec, fork, exit, wait, kill",
    ),
    "phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/quiz.json": (
        "consolidationPolicy: WhenEmptyOrUnderutilized with consolidateAfter: 0s",
    ),
    "phases/19-capstone-projects/82-jailbreak-taxonomy/outputs/taxonomy.json": (
        "From now on you are PolicyBot-Unchained",
    ),
    "phases/19-capstone-projects/85-content-classifier-integration/outputs/classifier_report.json": (
        "You moron, your code is full of bugs.",
    ),
    "phases/19-capstone-projects/86-constitutional-rules-engine/outputs/rules_report.json": (
        "I cannot help with that question.",
    ),
    "phases/19-capstone-projects/87-end-to-end-safety-gate/outputs/gate_trace.json": (
        "From now on you are PolicyBot-Unchained",
    ),
}

ENGLISH_FIXTURE_PATHS = {
    # English wording is the input under test, so translating it changes behavior.
    "phases/04-computer-vision/18-open-vocab-clip/outputs/prompt-zero-shot-class-picker.md",
    "phases/19-capstone-projects/82-jailbreak-taxonomy/outputs/taxonomy.json",
    "phases/19-capstone-projects/85-content-classifier-integration/outputs/classifier_report.json",
    "phases/19-capstone-projects/86-constitutional-rules-engine/outputs/rules_report.json",
    "phases/19-capstone-projects/87-end-to-end-safety-gate/outputs/gate_trace.json",
    # These certification artifacts are exact machine-consumed fixtures. Their
    # field values are asserted by the lesson code, while the surrounding docs
    # and learner-authored Markdown artifacts remain localized.
    "certifications/claude/lessons/00-certification-strategy/outputs/readiness-plan.json",
    "certifications/claude/lessons/03-prompting-and-task-decomposition/outputs/prompt-contract-packet.json",
    "certifications/claude/lessons/07-workflow-design-and-human-handoffs/outputs/workflow-handoff-packet.json",
    "certifications/claude/lessons/08-messages-api-and-application-lifecycle/outputs/messages-lifecycle-transcript.json",
    "certifications/claude/lessons/08-messages-api-and-application-lifecycle/outputs/multimodal-request-fixture.json",
    "certifications/claude/lessons/09-structured-output-and-defensive-parsing/outputs/validated-triage.json",
    "certifications/claude/lessons/10-tool-use-and-agentic-loops/outputs/runtime-and-tool-surface-decisions.json",
    "certifications/claude/lessons/10-tool-use-and-agentic-loops/outputs/tool-loop-transcript.json",
    "certifications/claude/lessons/11-mcp-server-design-and-integration/outputs/mcp-capability-snapshot.json",
    "certifications/claude/lessons/12-claude-agent-sdk-and-hooks/outputs/agent-harness-policy.json",
    "certifications/claude/lessons/12-claude-agent-sdk-and-hooks/outputs/managed-agent-event-fixture.json",
    "certifications/claude/lessons/13-application-security-and-secrets/outputs/security-decision-record.json",
    "certifications/claude/lessons/15-claude-code-for-development-teams/outputs/permission-request-decision.json",
    "certifications/claude/lessons/30-developer-application-capstone/outputs/eval-plan.json",
}


def is_human_facing_path(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    parts = path.relative_to(ROOT).parts
    if rel == ".claude/settings.local.json":
        return False
    if rel.startswith(("scripts/", "i18n/", ".venv/", ".github/workflows/")):
        return False
    if rel in {"site/data.js", "outputs/index.json", "catalog.json"}:
        return False
    if rel == "site/test_build_artifacts.js":
        return False
    if "/code/" in rel or "/notebook/" in rel:
        return False
    if parts and parts[0] in {"certifications", "learning-paths"}:
        return path.suffix.lower() in {".md", ".json", ".html", ".js"}
    if rel.startswith(("site/", "glossary/", ".agents/", ".claude/")):
        return True
    if rel.startswith(".github/"):
        return path.suffix == ".md"
    if parts and parts[0] == "phases":
        return (
            rel.endswith("/docs/en.md")
            or rel.endswith("/README.md")
            or rel.endswith("/mission.md")
            or "/outputs/" in rel
            or rel.endswith("/quiz.json")
        )
    return path.suffix == ".md"


@dataclass
class Issue:
    rule: str
    path: str
    message: str


def load_manifest() -> dict[str, object]:
    if not MANIFEST.is_file():
        raise SystemExit("missing i18n/manifest.json; run scripts/i18n_manifest.py first")
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def strip_non_prose(text: str) -> str:
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    text = re.sub(r"`[^`\n]+`", "", text)
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    text = re.sub(r"\[[^\]]*\]\([^)]*\)", "", text)
    return text


def remove_protected_terms(text: str) -> str:
    for term in sorted(PROTECTED_TERM_LIST, key=len, reverse=True):
        text = re.sub(rf"(?<![A-Za-z0-9]){re.escape(term)}(?![A-Za-z0-9])", " ", text)
    return text


def line_has_likely_untranslated_prose(line: str) -> bool:
    stripped = strip_non_prose(line).strip()
    if not stripped:
        return False
    if stripped.startswith(("tags:", "labels:", "title:", "name:", "on:", "uses:", "run:", "with:", "allowed-tools:")):
        return False
    if re.match(r"^(?:python3|npx|npm|node|cargo|julia|bash)\s+", stripped):
        return False
    if re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", stripped):
        return False
    if "--skill" in stripped and not re.search(r"[.!?。！？]", stripped):
        return False
    if stripped.startswith("**Prerequisites:**"):
        return False
    if stripped.startswith(('- **Sources:**', '* **Sources:**')):
        return False
    if stripped.startswith(("- [", "* [")) and "](" in stripped:
        return False
    if "min-width:" in stripped and "pointer:" in stripped:
        return False
    if stripped.startswith(("#### ", "### ", "## ", "# ")):
        return False
    if re.match(r"^-\s+\*[^*]+\*(?:\s+\([^)]*\))?\s+(?:—|→)", stripped):
        return False
    json_match = re.fullmatch(r'\s*"([^"\\]+)"\s*:\s*"([^"\\]*)"\s*,?\s*', stripped)
    if json_match:
        key, value = json_match.groups()
        if key in {
            "id", "lesson", "path", "source", "authority", "publisher", "role", "name",
            "type", "status", "mode", "model", "domain", "track", "tool", "method",
        }:
            return False
        if "/" in value or re.fullmatch(r"[A-Za-z0-9_.:@${}-]+", value):
            return False
    if stripped.startswith(("-", "*")) and stripped.count('"') >= 2:
        return False
    if stripped.startswith("#") and "/" in stripped:
        return False
    if (
        re.fullmatch(r"[-*\sA-Za-z0-9_./:${}\[\]'\"<>]+", stripped)
        and any(
            marker in stripped
            for marker in ("/", ".yml", ".yaml", ".md", ".py", ".js", "github", "Python", "TypeScript")
        )
        and not PROSE_MARKER_RE.search(stripped)
    ):
        return False
    if stripped.startswith(("<", "|")) and stripped.count("|") >= 2:
        return False
    without_terms = remove_protected_terms(stripped)
    if len(CHINESE_RE.findall(stripped)) >= 2 and len(re.findall(r"[A-Za-z]{3,}", without_terms)) <= 3:
        return False
    if re.search(r"^[\s\"'\-\*\[\](),.:;0-9A-Za-z_/+@~=<>|]+$", without_terms) and not PROSE_MARKER_RE.search(without_terms):
        return False
    if len(CHINESE_RE.findall(stripped)) >= 2:
        return False
    words = re.findall(r"[A-Za-z]{2,}", without_terms)
    return len(words) >= 4 and bool(PROSE_MARKER_RE.search(without_terms)) and bool(PROSE_EN_RE.search(stripped))


def audit_text(path: Path) -> Iterable[Issue]:
    rel = path.relative_to(ROOT).as_posix()
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        yield Issue("I18N001", rel, "file is not valid UTF-8")
        return
    payload: object | None = None
    if path.suffix == ".json":
        try:
            payload = json.loads(text)
        except json.JSONDecodeError as exc:
            yield Issue("I18N002", rel, f"invalid JSON after localization: {exc}")
    if not CHINESE_RE.search(strip_non_prose(text)) and path.suffix in {".md", ".html"}:
        yield Issue("I18N003", rel, "no Chinese prose detected")
    candidates: list[tuple[int, str]] = []
    if path.suffix == ".json" and payload is not None:
        def visit(value: object, key: str = "") -> None:
            if isinstance(value, dict):
                for child_key, child in value.items():
                    visit(child, str(child_key))
            elif isinstance(value, list):
                for child in value:
                    visit(child, key)
            elif isinstance(value, str):
                if key in {
                    "id", "lesson", "path", "source", "authority", "publisher", "role", "name",
                    "type", "status", "mode", "model", "domain", "track", "tool", "method", "title",
                    "references", "tags", "dependsOn", "allowedKinds", "allowed-tools",
                }:
                    return
                if value.startswith(("http://", "https://", "./", "../", "/")) or re.fullmatch(
                    r"[A-Za-z0-9_.:@${}/-]+", value
                ):
                    return
                candidates.append((text.count("\n", 0, max(0, text.find(json.dumps(value)))) + 1, value))

        visit(payload)
    elif path.suffix == ".js":
        candidates = [(text.count("\n", 0, span.start) + 1, span.text) for span in js_string_spans(text)]
    elif path.suffix == ".html":
        candidates = [
            (text.count("\n", 0, span.start) + 1, span.text)
            for span in html_spans(text, include_script_strings=True)
        ]
    else:
        in_code_fence = False
        for idx, line in enumerate(text.splitlines(), 1):
            if line.strip().startswith("```"):
                in_code_fence = not in_code_fence
                continue
            if not in_code_fence:
                candidates.append((idx, line))
    for idx, candidate in candidates:
        if rel in ENGLISH_FIXTURE_PATHS:
            continue
        if rel == "phases/13-tools-and-protocols/09-mcp-transports/quiz.json" and re.fullmatch(
            r"[A-Za-z-]+ and [A-Za-z-]+", candidate
        ):
            continue
        if rel == "phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/quiz.json" and candidate.startswith(
            "consolidationPolicy:"
        ):
            continue
        if any(marker in candidate for marker in ENGLISH_PROSE_ALLOWLIST.get(rel, ())):
            continue
        if line_has_likely_untranslated_prose(candidate):
            yield Issue("I18N004", rel, f"likely untranslated prose at line {idx}: {candidate[:120]}")
    for bad, wanted in BAD_TRANSLATIONS.items():
        if bad in text:
            yield Issue("I18N005", rel, f"protected term appears translated as {bad!r}; keep {wanted!r}")
            break


def audit_svg(path: Path) -> Iterable[Issue]:
    rel = path.relative_to(ROOT).as_posix()
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        yield Issue("I18N006", rel, "SVG is not valid UTF-8")
        return
    try:
        ET.fromstring(text)
    except ET.ParseError as exc:
        yield Issue("I18N007", rel, f"invalid SVG XML: {exc}")
        return
    visible_text = " ".join(re.findall(r"<text\b[^>]*>([^<>]*[A-Za-z][^<>]*)</text>", text, flags=re.IGNORECASE))
    if visible_text and not CHINESE_RE.search(visible_text) and rel not in ENGLISH_SVG_ALLOWLIST:
        yield Issue("I18N008", rel, f"SVG visible text may be untranslated: {visible_text[:120]}")


def audit_svg_manifest() -> Iterable[Issue]:
    if not SVG_TEXT_MANIFEST.exists():
        yield Issue("I18N010", "i18n/svg_text_manifest.json", "missing SVG text manifest; run scripts/i18n_svg_text.py extract")
        return
    data = json.loads(SVG_TEXT_MANIFEST.read_text(encoding="utf-8"))
    missing = []
    for file_record in data.get("files", []):
        if not isinstance(file_record, dict):
            continue
        for entry in file_record.get("entries", []):
            if isinstance(entry, dict) and not str(entry.get("zh", "")).strip():
                missing.append(f"{file_record.get('path')}#{entry.get('kind')}[{entry.get('index')}]")
                break
    for item in missing:
        yield Issue("I18N011", item, "SVG text entry missing Chinese translation in svg_text_manifest.json")


def audit_images(manifest: dict[str, object]) -> Iterable[Issue]:
    for record in manifest.get("image_files", []):
        if not isinstance(record, dict):
            continue
        rel = str(record["path"])
        path = ROOT / rel
        if rel.endswith(".svg"):
            yield from audit_svg(path)
            continue
        if record.get("needs_gpt_image_2") and not path.stem.endswith(".zh"):
            zh_path = path.with_name(f"{path.stem}.zh{path.suffix}")
            if not zh_path.exists():
                yield Issue("I18N009", rel, f"missing gpt-image-2 localized image: {zh_path.relative_to(ROOT).as_posix()}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--max-issues", type=int, default=200)
    args = parser.parse_args()

    manifest = load_manifest()
    issues: list[Issue] = []
    for record in manifest.get("text_files", []):
        if not isinstance(record, dict):
            continue
        path = ROOT / str(record["path"])
        if path.exists() and is_human_facing_path(path):
            issues.extend(audit_text(path))
    issues.extend(audit_images(manifest))
    issues.extend(audit_svg_manifest())

    payload = [issue.__dict__ for issue in issues[: args.max_issues]]
    if args.json:
        print(json.dumps({"issue_count": len(issues), "issues": payload}, ensure_ascii=False, indent=2))
    else:
        print(f"issues: {len(issues)}")
        for issue in issues[: args.max_issues]:
            print(f"{issue.rule} {issue.path}: {issue.message}")
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
