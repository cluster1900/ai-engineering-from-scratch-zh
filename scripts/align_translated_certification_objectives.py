#!/usr/bin/env python3
"""Align translated assessment objectives with translated track declarations.

Assessment objective strings are referential values even though they are also
human-facing prose. Translate the declaration once, then reuse that exact value
for every assessment question mapped to the same upstream objective.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = ROOT.parent / "ai-engineering-from-scratch"


def load(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-repo", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    changes: list[tuple[Path, str, str, str]] = []
    for target_track_path in sorted((ROOT / "certifications/claude/tracks").glob("*.json")):
        source_track_path = args.source_repo / target_track_path.relative_to(ROOT)
        source_track = load(source_track_path)
        target_track = load(target_track_path)
        translated: dict[tuple[str, str], str] = {}
        target_domains = {
            str(domain.get("id")): domain
            for domain in target_track.get("domains", [])
            if isinstance(domain, dict)
        }
        for source_domain in source_track.get("domains", []):
            if not isinstance(source_domain, dict):
                continue
            domain_id = str(source_domain.get("id"))
            target_domain = target_domains.get(domain_id, {})
            source_objectives = source_domain.get("objectives", [])
            target_objectives = target_domain.get("objectives", [])
            if not isinstance(source_objectives, list) or not isinstance(target_objectives, list):
                continue
            if len(source_objectives) != len(target_objectives):
                raise SystemExit(f"objective count changed for {target_track_path}:{domain_id}")
            for source_value, target_value in zip(source_objectives, target_objectives):
                if isinstance(source_value, str) and isinstance(target_value, str):
                    translated[(domain_id, source_value)] = target_value

        for assessment in source_track.get("assessments", []):
            if not isinstance(assessment, dict) or not isinstance(assessment.get("path"), str):
                continue
            rel = Path(assessment["path"])
            source_path = args.source_repo / rel
            target_path = ROOT / rel
            source_data = load(source_path)
            target_data = load(target_path)
            source_questions = {
                str(question.get("id")): question
                for question in source_data.get("questions", [])
                if isinstance(question, dict)
            }
            changed = False
            for target_question in target_data.get("questions", []):
                if not isinstance(target_question, dict):
                    continue
                question_id = str(target_question.get("id"))
                source_question = source_questions.get(question_id)
                if source_question is None:
                    raise SystemExit(f"missing upstream question {target_path}:{question_id}")
                domain_id = str(source_question.get("domain"))
                source_objective = source_question.get("objective")
                wanted = translated.get((domain_id, str(source_objective)))
                if wanted is None:
                    raise SystemExit(
                        f"unmapped upstream objective {target_path}:{question_id}:{source_objective!r}"
                    )
                current = target_question.get("objective")
                if current != wanted:
                    changes.append((target_path, question_id, str(current), wanted))
                    target_question["objective"] = wanted
                    changed = True
            if changed and not args.check:
                target_path.write_text(
                    json.dumps(target_data, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8",
                )

    for path, question_id, current, wanted in changes:
        print(f"{path.relative_to(ROOT)}:{question_id}: {current!r} -> {wanted!r}")
    print(f"objective references needing alignment: {len(changes)}")
    return 1 if args.check and changes else 0


if __name__ == "__main__":
    raise SystemExit(main())
