"""Unit tests for scripts/check_manual_residual_en.py."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path


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


if __name__ == "__main__":
    unittest.main()
