import pathlib
import sys
import unittest


CODE_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE_DIR))
import main  # noqa: E402
from contract_localization import without_contract_terms  # noqa: E402


class GovernanceControlPacketTests(unittest.TestCase):
    def setUp(self):
        self.text = main.ARTIFACT.read_text(encoding="utf-8")

    def test_shipped_packet_is_ready(self):
        self.assertEqual(main.validate_text(self.text)["status"], "ready_for_governance_review")

    def test_all_control_types_are_required(self):
        text = without_contract_terms(self.text, "corrective")
        self.assertEqual(main.validate_text(text)["status"], "blocked")

    def test_qualified_owner_is_required(self):
        text = without_contract_terms(self.text, "qualified", "owner")
        self.assertTrue(any("accountability" in finding for finding in main.validate_text(text)["findings"]))

    def test_queue_slo_and_fallback_are_required(self):
        text = without_contract_terms(self.text, "queue slo", "manual urgent-triage queue")
        self.assertTrue(any("operations" in finding for finding in main.validate_text(text)["findings"]))

    def test_reassessment_section_is_required(self):
        self.assertEqual(main.validate_text(without_contract_terms(self.text, "## Reassessment"))["status"], "blocked")

    def test_placeholder_blocks(self):
        self.assertEqual(main.validate_text(self.text + "\nTODO\n")["status"], "blocked")


if __name__ == "__main__":
    unittest.main()
