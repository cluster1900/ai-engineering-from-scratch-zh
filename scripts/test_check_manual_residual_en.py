"""Unit tests for scripts/check_manual_residual_en.py."""
from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path, PurePosixPath


sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_manual_residual_en as chk


def _scan(name: str, text: str, **flags) -> tuple[list[tuple[int, str, str]], int]:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / name
        path.write_text(text, encoding="utf-8")
        return chk.scan_file(
            path,
            allow_incident_col=flags.get("allow_incident_col", False),
            allow_ref_title_col=flags.get("allow_ref_title_col", False),
        )


class ProductNameListTests(unittest.TestCase):
    def test_cjk_joined_product_names_are_allowed(self):
        self.assertFalse(
            chk.looks_english_prose(
                "FlashAttention、FlashInfer、Triton、FlexAttention、TurboQuant"
            )
        )
        self.assertFalse(
            chk.looks_english_prose(
                "L4（SM 8.9）、H100（SM 9.0）、DGX Spark（SM 12.1）"
            )
        )

    def test_lowercase_prose_in_cjk_list_is_flagged(self):
        self.assertTrue(
            chk.looks_english_prose("NVIDIA L4，compute capability 8.9")
        )


class SdkIdentifierTests(unittest.TestCase):
    def test_sdk_cells_with_tip_cites_are_allowed(self):
        samples = (
            "a2a-python 1.2.2 {{sdk src/a2a/server/routes/rest_routes.py}}",
            "a2a-go {{sdk-go a2asrv/rest.go at v2.6.0}}",
            "Rust a2a-server-lf-v0.5.1",
            "a2a-rs, a2a-server 0.5.1",
        )
        for sample in samples:
            with self.subTest(sample=sample):
                self.assertFalse(chk.looks_english_prose(sample))


class ResidualEnglishTests(unittest.TestCase):
    def test_plain_english_prose_is_flagged(self):
        self.assertTrue(
            chk.looks_english_prose(
                "This sentence is leftover English and must be translated."
            )
        )

    def test_sentence_final_function_word_is_still_prose(self):
        self.assertTrue(chk.func_word_in_prose("Then run this."))
        self.assertFalse(chk.func_word_in_prose("a2a-server-lf-v0.5.1"))

    def test_english_heading_is_flagged(self):
        hits, _explained = _scan(
            "page.md",
            "# The remaining English heading still needs work\n\n已翻译的正文。\n",
        )
        kinds = [kind for _lineno, kind, _text in hits]
        self.assertIn("HEADING", kinds)


class SourcesListFlagTests(unittest.TestCase):
    LINE = "- Rollout Routing Replay，arXiv 2510.11370。\n"

    def test_sources_arxiv_list_flagged_without_flag(self):
        hits, explained = _scan("r-4-sources.md", self.LINE)
        self.assertEqual([kind for _lineno, kind, _text in hits], ["LIST"])
        self.assertEqual(explained, 0)

    def test_sources_arxiv_list_allowed_only_with_flag(self):
        hits, explained = _scan(
            "r-4-sources.md",
            self.LINE,
            allow_ref_title_col=True,
        )
        self.assertEqual(hits, [])
        self.assertEqual(explained, 1)

    def test_sources_flag_does_not_allow_plain_list_prose(self):
        hits, _explained = _scan(
            "r-4-sources.md",
            "- This leftover English list item must still be translated.\n",
            allow_ref_title_col=True,
        )
        self.assertEqual([kind for _lineno, kind, _text in hits], ["LIST"])


class ExcludedDirTests(unittest.TestCase):
    def test_is_excluded_research_tree(self):
        self.assertTrue(
            chk.is_excluded(PurePosixPath("manuals/a2a-101/research/briefs/x.md"))
        )
        self.assertTrue(
            chk.is_excluded(
                PurePosixPath("manuals/a2a-101/research/nested/deeper/x.md")
            )
        )
        self.assertFalse(
            chk.is_excluded(PurePosixPath("manuals/a2a-101/research-notes/x.md"))
        )
        self.assertFalse(
            chk.is_excluded(PurePosixPath("manuals/other-101/research/x.md"))
        )
        self.assertFalse(
            chk.is_excluded(PurePosixPath("manuals/a2a-101/sections/research.md"))
        )

    def test_main_skips_excluded_research_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            research = root / "manuals" / "a2a-101" / "research"
            sections = root / "manuals" / "a2a-101" / "sections"
            research.mkdir(parents=True)
            sections.mkdir(parents=True)
            (research / "x.md").write_text(
                "This leftover English paragraph lives only under research.\n",
                encoding="utf-8",
            )
            (sections / "s.md").write_text(
                "This leftover English paragraph lives under sections.\n",
                encoding="utf-8",
            )
            script = Path(__file__).resolve().parent / "check_manual_residual_en.py"
            proc = subprocess.run(
                [sys.executable, str(script), "--root", str(root), "a2a-101"],
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 1)
            self.assertIn("FAIL_hits=1", proc.stdout)
            self.assertIn("files_scanned=1", proc.stdout)
            self.assertIn("excluded_files=1 (manuals/a2a-101/research)", proc.stdout)
            self.assertIn("manuals/a2a-101/sections/s.md", proc.stdout)
            self.assertNotIn("manuals/a2a-101/research/x.md", proc.stdout)


if __name__ == "__main__":
    unittest.main()
