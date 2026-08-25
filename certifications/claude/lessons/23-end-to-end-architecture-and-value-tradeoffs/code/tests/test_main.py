import pathlib
import sys
import unittest


CODE_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE_DIR))
import main  # noqa: E402
from contract_localization import without_contract_terms  # noqa: E402


class ArchitectureDecisionTests(unittest.TestCase):
    def setUp(self):
        self.text = main.ARTIFACT.read_text(encoding="utf-8")

    def test_shipped_decision_is_ready(self):
        self.assertEqual(main.validate_text(self.text)["status"], "ready_for_decision_review")

    def test_rejected_alternatives_are_required(self):
        self.assertEqual(main.validate_text(without_contract_terms(self.text, "## Rejected Alternatives"))["status"], "blocked")

    def test_workflow_and_agent_are_compared(self):
        text = without_contract_terms(self.text, "workflow", "agent")
        self.assertTrue(any("patterns" in finding for finding in main.validate_text(text)["findings"]))

    def test_safety_is_a_hard_gate(self):
        self.assertEqual(main.validate_text(without_contract_terms(self.text, "safety"))["status"], "blocked")

    def test_rollback_owner_is_required(self):
        text = without_contract_terms(self.text, "rollback", "owner")
        self.assertTrue(any("operations" in finding for finding in main.validate_text(text)["findings"]))

    def test_placeholder_blocks(self):
        self.assertEqual(main.validate_text(self.text + "\nTBD\n")["status"], "blocked")


if __name__ == "__main__":
    unittest.main()
