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
COUNTER_ARXIV_LIST_TITLECASE_WE = (
    "- We Use This For Everything In The Code，arXiv 2510.15152。"
)
COUNTER_ARXIV_CELL_TITLECASE_WE = (
    "| a | We Use This For Everything In The Code, "
    "[arXiv 2510.15152](https://arxiv.org/abs/2510.15152) |"
)
COUNTER_ARXIV_CELL_TITLECASE_THIS = (
    "| a | This Is The Paper We Use, "
    "[arXiv 2510.15152](https://arxiv.org/abs/2510.15152) |"
)
COUNTER_ARXIV_LIST_TITLECASE_THIS = (
    "- This Is The Paper We Use，arXiv 2510.15152。"
)
L1_CELL = (
    "We Use This For Everything In The Code, "
    "[arXiv 2501.00001](https://arxiv.org/abs/2501.00001)"
)
L1_LIST = "We Use This For Everything In The Code，arXiv 2501.00001。"
N6_CELL = (
    "We Ran It on GPU and saw KV hit, "
    "[arXiv 2501.00001](https://arxiv.org/abs/2501.00001)"
)
N5C_HYPHEN = "We-always-restart-the-server-first-because-it-leaks"
D1C_HYPHEN = "We-restart-2-servers-because-it-leaks-every-night."
D1E_CELL = (
    "We-restart-2-servers-because-it-leaks, "
    "[arXiv 2501.00001](https://arxiv.org/abs/2501.00001)"
)
D1E_NIGHTLY = (
    "Restart-the-2-servers-nightly, "
    "[arXiv 2501.00001](https://arxiv.org/abs/2501.00001)"
)
D_VERSIONS = "Run-it-v2 then-v3 with-v4 after-v5 now."
D_SLASH_CELL = (
    "Restart-the/servers-nightly, "
    "[arXiv 2501.00001](https://arxiv.org/abs/2501.00001)"
)
A = "[arXiv 2501.00001](https://arxiv.org/abs/2501.00001)"
B5_SENT = "Engineers restart a2a-server nightly because memory leaks."
B5_SENT_PINNED = (
    "Engineers restart a2a-server-lf-v0.5.1 nightly because memory leaks badly."
)
B5_CHAIN = (
    "a2a-server-crashed-nightly-leaking-memory-everywhere-today-sadly-again-forever"
)
B5_RESTARTS_CELL = "a2a-server-restarts-nightly-because-memory-leaks, " + A
B5_SERVERX4_CELL = "a2a-server-server-server-server, " + A
WHITELIST_PLUS_EN = " We restart the server every night because it leaks."
WHITELIST_MILES_26 = "Rollout Routing Replay，arXiv 2510.11370。"
WHITELIST_MILES_27 = (
    "Score Centering Stabilizes Off-policy Reinforcement Learning，"
    "arXiv 2609.20807。"
)
WHITELIST_SGLANG_60 = (
    "Patodiya，Same Request, Different Answer: Quantization Amplifies "
    "Cache-Induced Divergence in LLM Serving, "
    "[arXiv 2609.04748](https://arxiv.org/abs/2609.04748)"
)
WHITELIST_FILES = (
    ("manuals/miles-101/sections/r-4-sources.md", WHITELIST_MILES_26),
    ("manuals/miles-101/sections/r-4-sources.md", WHITELIST_MILES_27),
    ("manuals/sglang-101/sections/r-5-sources.md", WHITELIST_SGLANG_60),
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
    COUNTER_ARXIV_LIST_TITLECASE_WE,
    COUNTER_ARXIV_CELL_TITLECASE_WE,
    COUNTER_ARXIV_CELL_TITLECASE_THIS,
    COUNTER_ARXIV_LIST_TITLECASE_THIS,
    L1_CELL,
    L1_LIST,
    N6_CELL,
    N5C_HYPHEN,
    D1C_HYPHEN,
    D1E_CELL,
    D1E_NIGHTLY,
    D_VERSIONS,
    D_SLASH_CELL,
    B5_SENT,
    B5_SENT_PINNED,
    B5_CHAIN,
    B5_RESTARTS_CELL,
    B5_SERVERX4_CELL,
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
    # whitelisted Sources title counted as explained
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


def _body(s: str) -> tuple[str, str]:
    return "3-1-intro.md", f"{s}\n"


def _list(s: str) -> tuple[str, str]:
    return "3-1-intro.md", f"- {s}\n"


def _cell(s: str) -> tuple[str, str]:
    return "3-1-intro.md", f"| a | b |\n|---|---|\n| {s} | x |\n"


def _heading(s: str) -> tuple[str, str]:
    return "3-1-intro.md", f"## {s}\n"


def _srccell(s: str) -> tuple[str, str]:
    return "r-5-sources.md", f"| a | b |\n|---|---|\n| {s}, {A} | x |\n"


def _srccell_raw(s: str) -> tuple[str, str]:
    return "r-5-sources.md", f"| a | b |\n|---|---|\n| {s} | x |\n"


def _srclist(s: str) -> tuple[str, str]:
    return "r-5-sources.md", f"- {s}, {A}\n"


def _h4(s: str) -> tuple[str, str]:
    return "3-1-intro.md", f"#### {s}\n"


def _cell2(s: str) -> tuple[str, str]:
    return "3-1-intro.md", f"| a | b |\n|---|---|\n| x | {s} |\n"


def _ordered(s: str) -> tuple[str, str]:
    return "3-1-intro.md", f"1. {s}\n"


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
        self.assertTrue(chk.func_word_in_prose(N5C_HYPHEN))
        # Hyphen-chained prose and non-pinned identifiers stay flagged.
        self.assertTrue(chk.func_word_in_prose("a2a-server-we-restart-the-server"))
        self.assertTrue(chk.func_word_in_prose("foo-server-v2"))

    def test_english_heading_is_flagged(self):
        hits, _explained = _scan(
            "page.md",
            "# The remaining English heading still needs work\n\n已翻译的正文。\n",
        )
        kinds = [kind for _lineno, kind, _text in hits]
        self.assertIn("HEADING", kinds)


class SourcesWhitelistTests(unittest.TestCase):
    LINE = f"- {WHITELIST_MILES_26}\n"

    def test_whitelist_has_exactly_three_verbatim_manual_entries(self):
        self.assertEqual(len(chk.SOURCES_TITLE_WHITELIST), 3)
        self.assertEqual(
            chk.SOURCES_TITLE_WHITELIST,
            frozenset(text for _rel, text in WHITELIST_FILES),
        )
        for rel, text in WHITELIST_FILES:
            body = (REPO_ROOT / rel).read_text(encoding="utf-8")
            self.assertIn(text, body)

    def test_whitelisted_miles_list_items_are_explained(self):
        hits, explained = _scan("r-4-sources.md", self.LINE)
        self.assertEqual(hits, [])
        self.assertEqual(explained, 1)
        hits, explained = _scan("r-4-sources.md", f"- {WHITELIST_MILES_27}\n")
        self.assertEqual(hits, [])
        self.assertEqual(explained, 1)

    def test_whitelisted_sglang_cell_is_explained(self):
        hits, explained = _scan(
            "r-5-sources.md",
            f"| {WHITELIST_SGLANG_60} | [4.6](#s) |\n",
        )
        self.assertEqual(hits, [])
        self.assertEqual(explained, 1)

    def test_non_whitelisted_arxiv_cell_is_not_explained(self):
        paper = (
            "SGLang: Efficient Execution of Structured Language "
            "Model Programs, [arXiv 2312.07104](https://arxiv.org/abs/2312.07104)"
        )
        hits, explained = _scan("r-5-sources.md", f"| {paper} | [2.2](#s) |\n")
        self.assertTrue(any(kind.startswith("TABLE_CELL") for _n, kind, _t in hits))
        self.assertEqual(explained, 0)

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
                    chk.is_whitelisted_sources_title("r-5-sources.md", sample)
                )
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

    def test_title_case_sentence_plus_arxiv_is_hit_not_explained(self):
        samples = (
            (COUNTER_ARXIV_LIST_TITLECASE_WE, "LIST"),
            (COUNTER_ARXIV_CELL_TITLECASE_WE, "TABLE_CELL"),
            (COUNTER_ARXIV_CELL_TITLECASE_THIS, "TABLE_CELL"),
            (COUNTER_ARXIV_LIST_TITLECASE_THIS, "LIST"),
        )
        oracle = _load_main_oracle()
        for line, kind_prefix in samples:
            with self.subTest(line=line[:70]):
                hits, explained = _scan("r-5-sources.md", line + "\n")
                kinds = [kind for _lineno, kind, _text in hits]
                if kind_prefix == "LIST":
                    self.assertIn("LIST", kinds, hits)
                else:
                    self.assertTrue(
                        any(kind.startswith("TABLE_CELL") for kind in kinds),
                        hits,
                    )
                self.assertEqual(explained, 0)
                with tempfile.TemporaryDirectory() as tmp:
                    path = Path(tmp) / "r-5-sources.md"
                    path.write_text(line + "\n", encoding="utf-8")
                    oracle_hits = oracle.scan_file(path, False, False)
                    self.assertTrue(
                        oracle_hits,
                        f"oracle (main) must also flag: {line[:70]}",
                    )

    def test_l1_n6_n11_are_hits_not_explained(self):
        oracle = _load_main_oracle()
        cases = (
            ("r-5-sources.md", f"| {L1_CELL} | x |\n", "TABLE_CELL"),
            ("r-5-sources.md", f"- {L1_LIST}\n", "LIST"),
            ("r-5-sources.md", f"| {N6_CELL} | x |\n", "TABLE_CELL"),
            ("r-9-sources-notes.md", f"| {L1_CELL} | x |\n", "TABLE_CELL"),
        )
        for name, text, kind_prefix in cases:
            with self.subTest(name=name, kind=kind_prefix, text=text[:70]):
                hits, explained = _scan(name, text)
                kinds = [kind for _lineno, kind, _text in hits]
                if kind_prefix == "LIST":
                    self.assertIn("LIST", kinds, hits)
                else:
                    self.assertTrue(
                        any(kind.startswith("TABLE_CELL") for kind in kinds),
                        hits,
                    )
                self.assertEqual(explained, 0)
                with tempfile.TemporaryDirectory() as tmp:
                    path = Path(tmp) / name
                    path.write_text(text, encoding="utf-8")
                    oracle_hits = oracle.scan_file(path, False, False)
                    self.assertTrue(
                        oracle_hits,
                        f"oracle (main) must also flag: {text[:70]}",
                    )

    def test_hyphen_chained_sentence_is_list_hit(self):
        oracle = _load_main_oracle()
        line = f"- {N5C_HYPHEN}\n"
        hits, explained = _scan("page.md", line)
        self.assertEqual([kind for _lineno, kind, _text in hits], ["LIST"])
        self.assertEqual(explained, 0)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "page.md"
            path.write_text(line, encoding="utf-8")
            oracle_hits = oracle.scan_file(path, False, False)
            self.assertTrue(oracle_hits, "oracle (main) must also flag N5c")

    def test_digit_slash_hyphen_chained_sentences_are_hits(self):
        oracle = _load_main_oracle()
        prose = (D1C_HYPHEN, D_VERSIONS)
        cells = (D1E_CELL, D1E_NIGHTLY, D_SLASH_CELL)
        for sample in prose:
            with self.subTest(kind="PROSE", sample=sample[:70]):
                hits, explained = _scan("page.md", sample + "\n")
                self.assertEqual(
                    [kind for _lineno, kind, _text in hits], ["PROSE"], hits
                )
                self.assertEqual(explained, 0)
                with tempfile.TemporaryDirectory() as tmp:
                    path = Path(tmp) / "page.md"
                    path.write_text(sample + "\n", encoding="utf-8")
                    oracle_hits = oracle.scan_file(path, False, False)
                    self.assertTrue(
                        oracle_hits, f"oracle (main) must also flag: {sample[:70]}"
                    )
        for sample in cells:
            with self.subTest(kind="TABLE_CELL", sample=sample[:70]):
                text = f"| {sample} | x |\n"
                hits, explained = _scan("r-5-sources.md", text)
                kinds = [kind for _lineno, kind, _text in hits]
                self.assertTrue(
                    any(kind.startswith("TABLE_CELL") for kind in kinds), hits
                )
                self.assertEqual(explained, 0)
                with tempfile.TemporaryDirectory() as tmp:
                    path = Path(tmp) / "r-5-sources.md"
                    path.write_text(text, encoding="utf-8")
                    oracle_hits = oracle.scan_file(path, False, False)
                    self.assertTrue(
                        oracle_hits, f"oracle (main) must also flag: {sample[:70]}"
                    )

    def test_whitelisted_title_plus_appended_english_is_hit(self):
        list_line = f"- {WHITELIST_MILES_26}{WHITELIST_PLUS_EN}\n"
        hits, explained = _scan("r-5-sources.md", list_line)
        self.assertIn("LIST", [kind for _lineno, kind, _text in hits], hits)
        self.assertEqual(explained, 0)
        cell_text = f"| {WHITELIST_SGLANG_60}{WHITELIST_PLUS_EN} | x |\n"
        hits, explained = _scan("r-5-sources.md", cell_text)
        self.assertTrue(
            any(kind.startswith("TABLE_CELL") for _n, kind, _t in hits), hits
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


class PinnedIdentifierContextTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.oracle = _load_main_oracle()

    def _assert_both_flag(self, name, text):
        hits, explained = _scan(name, text)
        self.assertTrue(hits, f"new checker must flag: {text[:80]!r}")
        self.assertEqual(explained, 0)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / name
            path.write_text(text, encoding="utf-8")
            oracle_hits = self.oracle.scan_file(path, False, False)
            self.assertTrue(
                oracle_hits, f"oracle (main) must also flag: {text[:80]!r}"
            )

    def test_b5_sentences_flagged_in_every_listed_context(self):
        cases = []
        for sample in (B5_SENT, B5_SENT_PINNED):
            for ctx in (_body, _list, _cell, _heading, _srccell):
                cases.append((sample, ctx))
        for ctx in (_body, _list, _cell, _srccell):
            cases.append((B5_CHAIN, ctx))
        for sample in (
            "a2a-server-restarts-nightly-because-memory-leaks",
            "a2a-server-server-server-server",
        ):
            cases.append((sample, _srccell))
        for sample, ctx in cases:
            with self.subTest(sample=sample[:70], ctx=ctx.__name__):
                name, text = ctx(sample)
                self._assert_both_flag(name, text)

    def test_b4_digit_slash_hyphen_flagged_in_every_listed_context(self):
        cases = []
        for ctx in (_body, _list, _cell, _srccell):
            cases.append((D1C_HYPHEN, ctx))
        for sample in (D1E_CELL, D1E_NIGHTLY, D_SLASH_CELL, D_VERSIONS):
            for ctx in (_body, _list, _cell, _heading, _srccell_raw):
                cases.append((sample, ctx))
        for sample, ctx in cases:
            with self.subTest(sample=sample[:70], ctx=ctx.__name__):
                name, text = ctx(sample)
                self._assert_both_flag(name, text)

    def test_x1_pinned_id_match_is_case_sensitive(self):
        for sample in ("Rust A2A-SERVER-lf-v0.5.1", "Rust A2A-Server"):
            for ctx in (_body, _list, _cell):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_x2_prefix_only_a2a_is_not_exempt(self):
        for sample in ("Rust a2a-common", "Rust a2a-common-lf-v0.5.1"):
            for ctx in (_body, _list, _cell):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_x3_token_must_fullmatch_not_search(self):
        for sample in ("Rust a2a-server.", "Rust a2a-server-lf-v0.5.1."):
            for ctx in (_body, _list, _cell):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_x9b_extra_non_function_word_is_not_exempt(self):
        for sample in ("Rust restart a2a-server", "Restart a2a-server"):
            for ctx in (_body, _list, _cell):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_only_pinned_id_context_helper(self):
        self.assertFalse(chk._only_pinned_id_context("Rust x.a2a-server"))
        self.assertFalse(chk._only_pinned_id_context("Rust a2a-server/x x"))
        self.assertFalse(chk._only_pinned_id_context("Rust the a2a-server"))
        self.assertTrue(chk._only_pinned_id_context("Rust a2a-server-lf-v0.5.1"))
        self.assertTrue(chk._only_pinned_id_context("a2a-rs, a2a-server 0.5.1"))

    def test_x10_func_word_in_prose_rust_rs_without_lowering_token(self):
        self.assertFalse(chk.func_word_in_prose("Rust a2a-server-lf-v0.5.1"))
        self.assertFalse(chk.func_word_in_prose("RUST a2a-server"))
        self.assertFalse(chk.func_word_in_prose("a2a-rs, a2a-server 0.5.1"))

    def test_pinned_id_exemption_is_exact_helper(self):
        # Helper-level on purpose: under the union with main these inputs are
        # reported by main anyway, so mutants m3/x1/x2/x3/x9b are scan-level
        # equivalent (0 distinguishers over 1361 inputs x 7 contexts, see the
        # PR body). These assertions pin the exemption to the exact id.
        for s in (
            "Rust a2a-server.",  # token is not a fullmatch (m3, x3)
            "Rust A2A-SERVER",  # case-sensitive id (x1)
            "RUST A2A-Server-lf-v0.5.1",  # case-sensitive id (x1)
            "Rust a2a-for",  # only a2a-server, not any a2a-* (x2)
            "Rust a2a-with",  # only a2a-server, not any a2a-* (x2)
            "Restart a2a-server",  # context words are only rust/rs (x9b)
        ):
            self.assertTrue(chk.func_word_in_prose(s), s)
        self.assertFalse(chk.func_word_in_prose("Rust a2a-server"))


class ScanLevelMustReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.oracle = _load_main_oracle()

    def _assert_both_flag(self, name, text):
        hits, explained = _scan(name, text)
        self.assertTrue(hits, f"new checker must flag: {text[:80]!r}")
        self.assertEqual(explained, 0)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / name
            path.write_text(text, encoding="utf-8")
            oracle_hits = self.oracle.scan_file(path, False, False)
            self.assertTrue(
                oracle_hits, f"oracle (main) must also flag: {text[:80]!r}"
            )

    def test_union_allowed_texts_are_exactly_expected_main_only_texts(self):
        self.assertEqual(
            chk.MAIN_ONLY_ALLOWED_TEXTS,
            {t for _rel, _ln, t in EXPECTED_MAIN_ONLY},
        )
        self.assertEqual(len(chk.MAIN_ONLY_ALLOWED_TEXTS), 26)
        self.assertEqual(len(EXPECTED_MAIN_ONLY), 30)

    def test_x7_lookaround_distinguishers_reported_at_scan_level(self):
        samples = (
            "1_a2a-server1 a2a-server",
            "1_a2a-serverx a2a-server",
            "rsa2a-server1 a2a-server",
        )
        for sample in samples:
            for ctx in (_body, _list, _cell, _heading):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_x9_context_word_distinguishers_reported_at_scan_level(self):
        samples = (
            "the1 a2a-server",
            "the_ a2a-server",
            "1_ a2a-server the_",
        )
        for sample in samples:
            for ctx in (_body, _list, _cell, _heading):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_adv_r6_a_rust_rs_identifier_combos(self):
        samples = (
            "Rust a2a-server",
            "RS a2a-server",
            "Rust Rust a2a-server",
            "Rust a2a-server a2a-server",
            "Rust a2a-server-lf-v0.5.1 a2a-server-lf-v0.4.0",
            "Rust a2a-server rust rust rust rust rust rust",
            "rUsT a2a-server",
            "rust rs rust a2a-server",
        )
        contexts = (_body, _list, _cell, _heading, _srccell, _srclist)
        # Dropped _srccell/_srclist for samples where, after stripping the
        # appended arXiv markdown link, main's Sources-title heuristic
        # (LATIN_WORD count < 4) treats the cell/list as allowed.
        drop_src = {
            "Rust a2a-server",
            "RS a2a-server",
            "Rust Rust a2a-server",
            "Rust a2a-server a2a-server",
            "rUsT a2a-server",
        }
        for sample in samples:
            for ctx in contexts:
                if ctx in (_srccell, _srclist) and sample in drop_src:
                    continue
                with self.subTest(sample=sample[:70], ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_adv_r6_b_zero_width_and_bom(self):
        samples = (
            "Rust\u200ba2a-server",
            "Rust a2a-server\u200b",
            "Rust a2a-server\u2060",
            "\ufeffRust a2a-server",
        )
        # Dropped _srccell/_srclist for every sample: after stripping the
        # arXiv link, main sees only ~2 LATIN_WORD tokens and allows it.
        for sample in samples:
            for ctx in (_body, _list, _cell, _heading):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_adv_r6_c_fullwidth_cjk_punctuation(self):
        samples = (
            "Rust，a2a-server",
            "Rust（a2a-server）",
            "Rust：a2a-server",
            "Rust a2a-server。",
            "Rust「a2a-server」",
            "Rust a2a-server！",
            "Rust a2a-server、a2a-server",
        )
        # Dropped _srccell/_srclist for every sample: CJK punctuation does
        # not add LATIN_WORD tokens, so main's Sources-title heuristic
        # allows the linked cell/list.
        for sample in samples:
            for ctx in (_body, _list, _cell, _heading):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_adv_r6_d_single_letters(self):
        samples = (
            "Rust x a2a-server",
            "Rust I a2a-server",
            "Rust a2a-server s e r v e r",
        )
        # Dropped _srccell/_srclist for every sample: single letters are
        # not LATIN_WORD ([A-Za-z]{2,}), so the linked Sources cell/list
        # stays under main's 4-word Sources-title threshold.
        for sample in samples:
            for ctx in (_body, _list, _cell, _heading):
                with self.subTest(sample=sample, ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_adv_r6_e_english_hidden_in_code_or_tip(self):
        samples = (
            "Rust a2a-server `the server restarts nightly`",
            "Rust a2a-server {{note the server restarts nightly}}",
        )
        contexts = (_body, _list, _cell, _heading, _srccell, _srclist)
        # Dropped _srccell/_srclist for the inline-code sample only: main
        # strips `...` before the Sources-title word count, leaving
        # "Rust a2a-server" (< 4 LATIN_WORD). The {{note ...}} sample is
        # kept because main does not strip tip spans.
        drop_src = {"Rust a2a-server `the server restarts nightly`"}
        for sample in samples:
            for ctx in contexts:
                if ctx in (_srccell, _srclist) and sample in drop_src:
                    continue
                with self.subTest(sample=sample[:70], ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_b8_tip_span_english_lines_reported(self):
        samples = (
            "See {{note the server restarts nightly because it leaks}}",
            "Paper {{note we restart the server every night because it leaks memory}}",
            "Zheng et al. {{note the server restarts nightly}}",
            "Rust {{note the server restarts nightly}}",
        )
        contexts = (
            _body,
            _list,
            _cell,
            _heading,
            _h4,
            _cell2,
            _ordered,
            _srccell,
            _srccell_raw,
            _srclist,
        )
        for sample in samples:
            for ctx in contexts:
                with self.subTest(sample=sample[:70], ctx=ctx.__name__):
                    name, text = ctx(sample)
                    self._assert_both_flag(name, text)

    def test_sources_list_context_reported(self):
        samples = (
            "a2a-server-restarts-nightly-because-memory-leaks",
            "a2a-server-server-server-server",
            B5_SENT,
            B5_SENT_PINNED,
        )
        for sample in samples:
            with self.subTest(sample=sample[:70], ctx="_srclist"):
                name, text = _srclist(sample)
                self._assert_both_flag(name, text)

    def test_reviewed_main_only_texts_stay_silent(self):
        sample = "Rust a2a-server-lf-v0.5.1"
        for ctx in (_body, _cell):
            with self.subTest(ctx=ctx.__name__):
                name, text = ctx(sample)
                hits, explained = _scan(name, text)
                self.assertEqual(
                    hits, [], f"new checker must stay silent: {text[:80]!r}"
                )
                self.assertEqual(explained, 0)
                with tempfile.TemporaryDirectory() as tmp:
                    path = Path(tmp) / name
                    path.write_text(text, encoding="utf-8")
                    oracle_hits = self.oracle.scan_file(path, False, False)
                    self.assertTrue(
                        oracle_hits,
                        f"oracle (main) must still flag: {text[:80]!r}",
                    )


if __name__ == "__main__":
    unittest.main()
