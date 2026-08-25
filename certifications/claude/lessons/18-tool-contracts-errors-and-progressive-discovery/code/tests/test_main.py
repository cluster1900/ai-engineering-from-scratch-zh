import pathlib
import sys
import unittest


CODE_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE_DIR))
import main  # noqa: E402
from contract_localization import without_contract_terms  # noqa: E402


class ToolCatalogReviewTests(unittest.TestCase):
    def setUp(self):
        self.text = main.ARTIFACT.read_text(encoding="utf-8")

    def test_shipped_catalog_is_ready(self):
        self.assertEqual(main.validate_text(self.text)["status"], "catalog_ready")

    def test_tool_contracts_are_required(self):
        self.assertEqual(main.validate_text(without_contract_terms(self.text, "## Tool Contracts"))["status"], "blocked")

    def test_authorization_error_is_non_retryable(self):
        text = without_contract_terms(self.text, "authorization", "non-retryable")
        self.assertTrue(any("errors" in finding for finding in main.validate_text(text)["findings"]))

    def test_positive_and_negative_guidance_are_required(self):
        text = without_contract_terms(self.text, "use when", "do not use")
        self.assertTrue(any("selection" in finding for finding in main.validate_text(text)["findings"]))

    def test_progressive_discovery_section_is_required(self):
        self.assertEqual(main.validate_text(without_contract_terms(self.text, "## Progressive Discovery"))["status"], "blocked")

    def test_placeholder_blocks(self):
        self.assertEqual(main.validate_text(self.text + "\nTODO\n")["status"], "blocked")


if __name__ == "__main__":
    unittest.main()
