"""Unit tests for scripts/check_manual_residual_en.py."""
from __future__ import annotations

import hashlib
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path, PurePosixPath


sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_manual_residual_en as chk

# Frozen origin/main (89cbf1a) checker used as the "never looser than main" oracle.
ORACLE_PATH = (
    Path(__file__).resolve().parent
    / "testdata"
    / "check_manual_residual_en_main_89cbf1a.py"
)
ORACLE_SHA256 = "685dec0330c2b3616e15396bb54eddfa399acf02fdd681c24d72fa0f803d9b4d"
REPO_ROOT = Path(__file__).resolve().parent.parent

COUNTER_TITLE_CASE_COMMA = "Run The Server，Then Check The Logs"
COUNTER_TITLE_CASE_DUNHAO = "Start The Engine、Wait For Warmup"
COUNTER_TITLE_CASE_NO_PRODUCT = "Restart Engine，Check Logs Again"
COUNTER_ENGLISH_PREFIX_LINK = (
    "This is a whole English sentence about serving，[link](https://example.com/post)"
)
COUNTER_ARXIV_LIST_SENTENCE = (
    "This is a whole English sentence about serving，arXiv 2510.15152。"
)
COUNTER_ARXIV_LIST_POLICY = (
    "We use this paper for the cache policy，arXiv 2510.11370。"
)
COUNTER_ARXIV_CELL_SENTENCE = (
    "This is a whole English sentence about serving, "
    "[arXiv 2510.15152](https://arxiv.org/abs/2510.15152)"
)
COUNTER_ARXIV_CELL_POLICY = (
    "the tail-optimized policy that the code names, "
    "[arXiv 2510.15152](https://arxiv.org/abs/2510.15152)"
)

ENGLISH_CORPUS = [
    COUNTER_TITLE_CASE_COMMA,
    COUNTER_TITLE_CASE_DUNHAO,
    COUNTER_ENGLISH_PREFIX_LINK,
    # origin/main r-3-incident-index col0 (line 13 Process-group SIGTERM is
    # identifier-only and main does not flag it).
    "Out of memory at concurrency 32 ([log](manuals/sglang-101/capture/out/oom-exploratory.log))",
    "`--disable-overlap-schedule` on MLX ([log](manuals/sglang-101/capture/out/server-no-overlap.log))",
    "Memory guard on a GB10 ([record](manuals/sglang-101/capture/gpu/incidents/gb10-memory-guard-pauses.txt))",
    "Driver `NV_ERR_NO_MEMORY` on a GB10 ([record](manuals/sglang-101/capture/gpu/incidents/gb10-driver-no-memory.txt))",
    "pip install on an L4 host with no CUDA toolkit ([record](manuals/sglang-101/capture/gpu/incidents/l4-toolchain-failures.txt))",
    "Benchmark with `HF_HUB_OFFLINE=1`, log not kept",
    "`--chunked-prefill-size 8192` on an L4 ([record](manuals/sglang-101/capture/gpu/incidents/l4-chunk-8192-prefill-graph-oom.txt))",
    "`--tp-size 2` with a shared second L4 ([record](manuals/sglang-101/capture/gpu/incidents/l4-tp-unbalanced-memory.txt))",
    "Prefill and decode on two L4s over TCP ([record](manuals/sglang-101/capture/gpu/incidents/l4-pd-mooncake-tcp-queue.txt), [summary lines](manuals/sglang-101/capture/gpu/incidents/l4-pd-summary-lines.txt))",
    "vLLM FlashInfer sampler on the L4 ([record](manuals/sglang-101/capture/gpu/incidents/l4-vllm-flashinfer-jit.txt))",
    "Miles with `--attn-implementation triton` ([log](manuals/sglang-101/capture/gpu/out-miles/true-on-policy-error.log))",
    "Miles true on-policy on a GB10 ([log](manuals/sglang-101/capture/gpu/out-miles/true-on-policy-fa3-error.log))",
    "GB10 shutdowns under Miles load ([record](manuals/sglang-101/capture/gpu/incidents/gb10-boot-list.txt))",
    "EAGLE-3 draft for Qwen3-30B-A3B",
    "Thermal throttle in an L4 sweep ([record](manuals/sglang-101/capture/gpu/incidents/l4-thermal-throttle.txt))",
    "Temperature 0 on a default server ([log](manuals/sglang-101/capture/gpu/out-gb10/determinism.txt))",
    # A2 author cells (vLLM community is a bare org phrase; main does not flag it).
    "Alibaba Cloud, RBG and Mooncake teams",
    "basbunarhasan on the NVIDIA developer forum",
    "InferenceX by SemiAnalysis",
    "The vLLM team",
    "The Mooncake team on the LMSYS blog",
    "Modal with Decagon",
    "LMSYS and RadixArk",
    "The Miles team",
    "Read The Paper；Write The Notes",
    "Follow The Guide，Then Apply The Patch",
    "This leftover English list item must still be translated.",
    "The remaining English heading still needs work",
    "This is leftover English and must be translated.",
    "A complete English sentence followed by a citation，[paper](https://example.com/x)",
    COUNTER_ARXIV_LIST_SENTENCE,
    COUNTER_ARXIV_LIST_POLICY,
    COUNTER_ARXIV_CELL_SENTENCE,
    COUNTER_ARXIV_CELL_POLICY,
    COUNTER_TITLE_CASE_NO_PRODUCT,
]

# Main-only hits on the current manuals. Each entry is (relpath, lineno, text)
# as scan_file reports it (text truncated to 120). Reviewed: none is leftover
# English prose that the new checker should still fail.
EXPECTED_MAIN_ONLY = {
    # identifier word (server inside a2a-server*)
    ("manuals/a2a-101/sections/2-3-extended-cards-and-signatures.md", 61, "Rust a2a-server-lf-v0.5.1"),
    ("manuals/a2a-101/sections/3-1-message.md", 93, "Rust a2a-server-lf-v0.5.1"),
    ("manuals/a2a-101/sections/5-4-version-and-extension-headers.md", 57, "a2a-rs, a2a-server 0.5.1"),
    ("manuals/a2a-101/sections/6-1-security-schemes-and-in-task-authorization.md", 79, "a2a-rs a2a-server-lf-v0.5.1"),
    # tip span ({{sdk ...}} path citations with "server" / "at")
    ("manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md", 73, "a2a-python 1.2.2 {{sdk src/a2a/server/agent_execution/active_task.py}} {{sdk src/a2a/utils/errors.py}}"),
    ("manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md", 74, "a2a-go {{sdk-go a2asrv/agentexec.go at v2.6.0}}"),
    ("manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md", 75, "a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/requesthandlers/DefaultRequestHandler.java at "),
    ("manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md", 76, "a2a-js {{sdk-js src/server/request_handler/default_request_handler.ts at v1.3.0}}"),
    ("manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md", 77, "a2a-dotnet {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}}"),
    ("manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md", 78, "a2a-rs {{sdk-rust a2a-server/src/handler.rs at a2a-server-lf-v0.5.1}}"),
    ("manuals/a2a-101/sections/4-5-streaming-and-subscribe-to-task.md", 107, "a2a-python 1.2.2 {{sdk src/a2a/server/routes/rest_routes.py}}"),
    ("manuals/a2a-101/sections/4-5-streaming-and-subscribe-to-task.md", 108, "a2a-go {{sdk-go a2asrv/rest.go at v2.6.0}}"),
    ("manuals/a2a-101/sections/4-5-streaming-and-subscribe-to-task.md", 109, "a2a-java {{sdk-java reference/rest/src/main/java/org/a2aproject/sdk/server/rest/quarkus/A2AServerRoutes.java at v1.4.0.F"),
    ("manuals/a2a-101/sections/4-5-streaming-and-subscribe-to-task.md", 110, "a2a-js {{sdk-js src/server/express/rest_handler.ts at v1.3.0}}"),
    ("manuals/a2a-101/sections/4-5-streaming-and-subscribe-to-task.md", 111, "a2a-dotnet {{sdk-dotnet src/A2A.AspNetCore/A2AEndpointRouteBuilderExtensions.cs at v1.0.0-preview2}}"),
    ("manuals/a2a-101/sections/4-5-streaming-and-subscribe-to-task.md", 112, "a2a-rs {{sdk-rust a2a-server/src/rest.rs at a2a-server-lf-v0.5.1}}"),
    ("manuals/a2a-101/sections/4-6-push-notification-configs.md", 80, "a2a-python 1.2.2 {{sdk src/a2a/server/tasks/base_push_notification_sender.py}}"),
    ("manuals/a2a-101/sections/4-6-push-notification-configs.md", 81, "a2a-go {{sdk-go a2asrv/push/sender.go at v2.6.0}}"),
    ("manuals/a2a-101/sections/4-6-push-notification-configs.md", 82, "a2a-java {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/tasks/BasePushNotificationSender.java at v1.4."),
    ("manuals/a2a-101/sections/4-6-push-notification-configs.md", 83, "a2a-js {{sdk-js src/server/push_notification/default_push_notification_sender.ts at v1.3.0}}"),
    ("manuals/a2a-101/sections/4-6-push-notification-configs.md", 84, "a2a-dotnet {{sdk-dotnet src/A2A/Server/A2AServer.cs at v1.0.0-preview2}}"),
    ("manuals/a2a-101/sections/4-6-push-notification-configs.md", 85, "a2a-rs {{sdk-rust a2a-server/src/push/sender.rs at a2a-server-lf-v0.5.1}}"),
    # automatic Sources title counted as explained
    ("manuals/miles-101/sections/r-4-sources.md", 26, "Rollout Routing Replay，arXiv 2510.11370。"),
    ("manuals/miles-101/sections/r-4-sources.md", 27, "Score Centering Stabilizes Off-policy Reinforcement Learning，arXiv 2609.20807。"),
    # author joins on other paper rows are now CJK (等 / 与); main no longer flags them.
    # Patodiya is a single Latin name, so main still flags the cell.
    ("manuals/sglang-101/sections/r-5-sources.md", 60, "Patodiya，Same Request, Different Answer: Quantization Amplifies Cache-Induced Divergence in LLM Serving, [arXiv 2609.047"),
    # product-name list false positive
    ("manuals/vllm-101/sections/4-5-change-the-attention-backend-only-for-a-reason.md", 34, "FlashInfer、FlashAttention、Triton、FlexAttention、TurboQuant"),
    ("manuals/vllm-101/sections/4-5-change-the-attention-backend-only-for-a-reason.md", 35, "FlashAttention、FlashInfer、Triton、FlexAttention、TurboQuant"),
    ("manuals/vllm-101/sections/4-5-change-the-attention-backend-only-for-a-reason.md", 35, "L4（SM 8.9）、H100（SM 9.0）、DGX Spark（SM 12.1）"),
    ("manuals/vllm-101/sections/8-4-how-vllm-picks-an-attention-backend.md", 13, "FlashInfer、FlashAttention、Triton、FlexAttention、TurboQuant"),
    ("manuals/vllm-101/sections/8-4-how-vllm-picks-an-attention-backend.md", 14, "FlashAttention、FlashInfer、Triton、FlexAttention、TurboQuant"),
}


def _scan(name: str, text: str) -> tuple[list[tuple[int, str, str]], int]:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / name
        path.write_text(text, encoding="utf-8")
        return chk.scan_file(path)


def _load_main_oracle():
    spec = importlib.util.spec_from_file_location(
        "check_manual_residual_en_main_89cbf1a",
        ORACLE_PATH,
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


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

    def test_title_case_func_word_lists_are_flagged(self):
        self.assertTrue(chk.looks_english_prose(COUNTER_TITLE_CASE_COMMA))
        self.assertTrue(chk.looks_english_prose(COUNTER_TITLE_CASE_DUNHAO))
        hits, explained = _scan("page.md", COUNTER_TITLE_CASE_COMMA + "\n")
        self.assertEqual([kind for _lineno, kind, _text in hits], ["PROSE"])
        self.assertEqual(explained, 0)
        hits, explained = _scan(
            "page.md", f"- {COUNTER_TITLE_CASE_DUNHAO}\n"
        )
        self.assertEqual([kind for _lineno, kind, _text in hits], ["LIST"])
        self.assertEqual(explained, 0)

    def test_title_case_cjk_list_without_product_token_is_list_hit(self):
        hits, explained = _scan(
            "page.md", "- Restart Engine，Check Logs Again\n"
        )
        self.assertEqual([kind for _lineno, kind, _text in hits], ["LIST"])
        self.assertEqual(explained, 0)


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


class TitleLikeTests(unittest.TestCase):
    def test_hyphenated_and_manual_titles_pass(self):
        self.assertTrue(
            chk.is_title_like(
                "Score Centering Stabilizes Off-policy Reinforcement Learning"
            )
        )
        self.assertTrue(
            chk.is_title_like(
                "From Tokens to Layers: Redefining Stall-Free Scheduling "
                "for MoE Serving with Layered Prefill"
            )
        )
        self.assertTrue(chk.is_title_like("Rollout Routing Replay"))
        self.assertTrue(chk.is_title_like("Test-Time Speculation"))

    def test_english_sentences_are_not_title_like(self):
        self.assertFalse(
            chk.is_title_like("This is a whole English sentence about serving")
        )
        self.assertFalse(
            chk.is_title_like("We use this paper for the cache policy")
        )
        self.assertFalse(
            chk.is_title_like("the tail-optimized policy that the code names")
        )

    def test_miles_arxiv_list_items_are_automatic_titles(self):
        path = REPO_ROOT / "manuals/miles-101/sections/r-4-sources.md"
        lines = path.read_text(encoding="utf-8").splitlines()
        for lineno in (26, 27):
            lm = chk.LIST_ITEM.match(lines[lineno - 1])
            self.assertIsNotNone(lm, lines[lineno - 1])
            body = lm.group(2)
            self.assertTrue(chk.is_sources_title_list_item(body), body)

    def test_sglang_arxiv_cells_are_automatic_titles(self):
        path = REPO_ROOT / "manuals/sglang-101/sections/r-5-sources.md"
        lines = path.read_text(encoding="utf-8").splitlines()
        matched = 0
        for lineno in range(51, 63):
            row = lines[lineno - 1]
            if not chk.TABLE_ROW.match(row):
                continue
            cell = chk.split_row(row)[0]
            if chk.SOURCES_ARXIV_CELL.match(cell.strip()):
                self.assertTrue(chk.is_sources_title_cell(cell), cell)
                matched += 1
            else:
                hits, explained = _scan("r-5-sources.md", row + "\n")
                self.assertEqual(hits, [], cell)
                self.assertEqual(explained, 0)
        self.assertGreaterEqual(matched, 11)


class SourcesListFlagTests(unittest.TestCase):
    LINE = "- Rollout Routing Replay，arXiv 2510.11370。\n"
    PAPER_CELL = (
        "SGLang: Efficient Execution of Structured Language "
        "Model Programs, [arXiv 2312.07104](https://arxiv.org/abs/2312.07104)"
    )

    def test_sources_arxiv_list_explained_automatically(self):
        hits, explained = _scan("r-4-sources.md", self.LINE)
        self.assertEqual(hits, [])
        self.assertEqual(explained, 1)

    def test_sources_arxiv_cell_explained_automatically(self):
        hits, explained = _scan(
            "r-5-sources.md",
            f"| {self.PAPER_CELL} | [2.2](#s) |\n",
        )
        self.assertEqual(hits, [])
        self.assertEqual(explained, 1)

    def test_sources_rule_does_not_allow_plain_list_prose(self):
        hits, _explained = _scan(
            "r-4-sources.md",
            "- This leftover English list item must still be translated.\n",
        )
        self.assertEqual([kind for _lineno, kind, _text in hits], ["LIST"])

    def test_english_prefix_before_link_is_flagged_in_sources(self):
        self.assertTrue(chk.looks_english_prose(COUNTER_ENGLISH_PREFIX_LINK))
        hits, explained = _scan(
            "r-5-sources.md",
            f"- {COUNTER_ENGLISH_PREFIX_LINK}\n"
            f"| {COUNTER_ENGLISH_PREFIX_LINK} | 用于 |\n",
        )
        kinds = [kind for _lineno, kind, _text in hits]
        self.assertIn("LIST", kinds)
        self.assertIn("TABLE_CELL[0]", kinds)
        self.assertEqual(explained, 0)

    def test_sentence_plus_arxiv_is_hit_not_explained_in_sources(self):
        for sample in (
            COUNTER_ARXIV_LIST_SENTENCE,
            COUNTER_ARXIV_LIST_POLICY,
            COUNTER_ARXIV_CELL_SENTENCE,
            COUNTER_ARXIV_CELL_POLICY,
        ):
            with self.subTest(sample=sample[:60]):
                self.assertTrue(chk.looks_english_prose(sample))
        self.assertFalse(
            chk.is_sources_title_list_item(COUNTER_ARXIV_LIST_SENTENCE)
        )
        self.assertFalse(
            chk.is_sources_title_list_item(COUNTER_ARXIV_LIST_POLICY)
        )
        self.assertFalse(
            chk.is_sources_title_cell(COUNTER_ARXIV_CELL_SENTENCE)
        )
        self.assertFalse(chk.is_sources_title_cell(COUNTER_ARXIV_CELL_POLICY))
        hits, explained = _scan(
            "r-5-sources.md",
            f"- {COUNTER_ARXIV_LIST_SENTENCE}\n"
            f"- {COUNTER_ARXIV_LIST_POLICY}\n"
            f"| {COUNTER_ARXIV_CELL_SENTENCE} | 用于 |\n"
            f"| {COUNTER_ARXIV_CELL_POLICY} | 用于 |\n",
        )
        kinds = [kind for _lineno, kind, _text in hits]
        self.assertGreaterEqual(kinds.count("LIST"), 2)
        self.assertGreaterEqual(
            sum(1 for kind in kinds if kind.startswith("TABLE_CELL")), 2
        )
        self.assertEqual(explained, 0)

    def test_sources_rule_stays_off_outside_sources_files(self):
        hits, explained = _scan("page.md", self.LINE)
        self.assertEqual([kind for _lineno, kind, _text in hits], ["LIST"])
        self.assertEqual(explained, 0)


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


class NeverLooserThanMainTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.oracle = _load_main_oracle()

    def test_oracle_file_is_frozen_main_bytes(self):
        digest = hashlib.sha256(ORACLE_PATH.read_bytes()).hexdigest()
        self.assertEqual(digest, ORACLE_SHA256)

    def test_english_corpus_flagged_by_main_and_new(self):
        self.assertGreaterEqual(len(ENGLISH_CORPUS), 25)
        for sample in ENGLISH_CORPUS:
            with self.subTest(sample=sample[:80]):
                self.assertTrue(self.oracle.looks_english_prose(sample))
                self.assertTrue(chk.looks_english_prose(sample))

    def test_whole_manual_differential_is_reviewed(self):
        main_only: set[tuple[str, int, str]] = set()
        for manual_json in sorted((REPO_ROOT / "manuals").glob("*/manual.json")):
            for path in sorted(manual_json.parent.rglob("*.md")):
                rel = PurePosixPath(path.relative_to(REPO_ROOT).as_posix())
                if chk.is_excluded(rel):
                    continue
                main_hits = self.oracle.scan_file(path, False, False)
                new_hits, _explained = chk.scan_file(path)
                main_set = {
                    (rel.as_posix(), lineno, text)
                    for lineno, _kind, text in main_hits
                }
                new_set = {
                    (rel.as_posix(), lineno, text)
                    for lineno, _kind, text in new_hits
                }
                main_only.update(main_set - new_set)
        self.assertEqual(main_only, EXPECTED_MAIN_ONLY)


if __name__ == "__main__":
    unittest.main()
