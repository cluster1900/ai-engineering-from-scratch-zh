"""Unit tests for scripts/check_manual_residual_en.py (relaxed rule, #141 r10).

The rule (see the checker docstring): necessary English is kept; only whole
untranslated English sentences / paragraphs are reported. Every boundary is
pinned from both sides: KEEP cases must stay silent, BLOCK cases must fail.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path, PurePosixPath


sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_manual_residual_en as chk

# Frozen origin/main (89cbf1a) checker, still run as a safety net (union).
ORACLE_PATH = (
    Path(__file__).resolve().parent
    / "check_manual_residual_en_main_89cbf1a.py"
)
ORACLE_SHA256 = "685dec0330c2b3616e15396bb54eddfa399acf02fdd681c24d72fa0f803d9b4d"
REPO_ROOT = Path(__file__).resolve().parent.parent
A = "[arXiv 2501.00001](https://arxiv.org/abs/2501.00001)"
EN = "we restart the server every night because it leaks memory"

# Hits of the frozen main checker on the current manuals, as main reports them
# (text truncated to 120). Reviewed: all are necessary English (identifiers,
# tip citations, product lists, whitelisted Sources titles); the union drops
# them. If this set changes, re-review the new entries.
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



# ---------------------------------------------------------------------------
# KEEP: necessary English. Must be silent in prose, list, table cell, heading.
# ---------------------------------------------------------------------------
KEEP_CASES = [
    # bare URL whose query reads like a sentence once split at "?"
    "日志见 https://example.com/log?we-restart-the-server-every-night-because-it-leaks 。",
    # paper title with identifiers (GRPO / arXiv) right after a full-width comma
    "Scaling Laws for Collapse in Asynchronous GRPO，arXiv 2607.01083，2026 年 7 月。",
    # terms / product names inside Chinese
    "用 FlashAttention 3 跑 prefill，再用 CUDA graph 跑 decode。",
    "FlashInfer、FlashAttention、Triton、FlexAttention、TurboQuant",
    "L4（SM 8.9）、H100（SM 9.0）、DGX Spark（SM 12.1）",
    "NVIDIA L4，compute capability 8.9，24 GB",
    "这个 prefix cache 命中率在 time to first token 上体现得最明显。",
    "分析配置（Analysis profile）",
    # code, commands, flags, API / field / file names
    "运行 `python -m sglang.launch_server --model-path Qwen/Qwen3-8B --port 30000` 即可。",
    "--disable-overlap-schedule --chunked-prefill-size 8192 --tp-size 2",
    "看 capture/gpu/out-l4/server-default.log 和 python/sglang/srt/managers/scheduler.py。",
    "`SendMessage` 返回 `TASK_STATE_INPUT_REQUIRED` 时，客户端在同一个 `taskId` 上回答。",
    "GET /v1/models 与 POST /v1/chat/completions",
    "a2a-rs a2a-server-lf-v0.5.1",
    "Rust a2a-server-lf-v0.5.1",
    # proper nouns, paper and product titles (Title Case)
    "Attention Is All You Need",
    "SGLang: Efficient Execution of Structured Language Model Programs",
    "Zheng 等，SGLang: Efficient Execution of Structured Language Model Programs，arXiv 2312.07104。",
    "From Tokens to Layers: Redefining Stall-Free Scheduling for MoE Serving with Layered Prefill",
    "Identifying and Mitigating Systemic Measurement Bias in Production LLM Inference Benchmarks",
    "Score Centering Stabilizes Off-policy Reinforcement Learning，arXiv 2609.20807。",
    "The Mooncake 团队在 LMSYS 博客上",
    # short English labels / fragments (< 5 words or < 2 function words)
    "Process-group SIGTERM",
    "EAGLE-3 draft for Qwen3-30B-A3B",
    "Temperature 0 on GB10",
    "Out of memory",
    "true on-policy",
    # external link text = title of an external work
    "见 [The State of FP8 KV-Cache and Attention Quantization in vLLM](https://blog.vllm.ai/2026/04/fp8)。",
    "[A production inference platform with SGLang RBG and Mooncake](https://lmsys.org/blog/x)",
    # quotation embedded in a Chinese sentence = verbatim citation
    "状态消息是 \"Checking out 9f3c2e1 and starting the suite\"。",
    "规范要求 agent “MUST transition the TaskState to `TASK_STATE_AUTH_REQUIRED`”。",
    "日志说这个旗标「is deprecated and will be removed in a future release」。",
    # tip citations are stripped from rendered HTML by site/build-manuals.js
    "终止的任务永远不会再改变 {{docs life-of-a-task}}。",
    "每个 SDK 都满足 {{install Limit REA to one project or agent profile}}。",
    "a2a-go {{sdk-go a2asrv/push/sender.go at v2.6.0}}",
    # code span hides a sentence: code is code
    "报错原文是 `the server restarts every night because it leaks memory`。",
    # bare URL
    "https://docs.sglang.ai/advanced_features/server_arguments.html#the-server-is-on-a-node",
    # paper titles in Title Case with lower-case function words (r9 FP)
    "A Survey of Large Language Models for Code Generation in the Wild",
    "Is the Reward Model All You Need for Reasoning in the Age of Agents",
]

# ---------------------------------------------------------------------------
# BLOCK: whole untranslated English sentence / paragraph. Must fail in prose,
# list, table cell and heading.
# ---------------------------------------------------------------------------
BLOCK_CASES = [
    # full-width comma (NFKC "," with no space) must not glue words together
    "Run The Server，Then Check The Logs",
    # a sentence appended to a long Title Case title is not outvoted by it
    "Same Request, Different Answer: Inference Nondeterminism In Serving Engines we restart the server every night because it leaks memory",
    "This sentence is deliberately left in English to prove that the residual English gate fails the pull request.",
    "We restart the server every night because it leaks memory.",
    "runs a test suite and streams the log",
    "a question answered with a message and no task",
    "reviews a diff against a base branch",
    "basbunarhasan on the NVIDIA developer forum",
    "The tail-optimized LRU policy that the code names, " + A,
    # sentence next to Chinese is still a sentence
    "注意：the server restarts every night because it leaks memory。",
    "This is a whole English sentence about serving，[link](https://example.com/post)",
    "This is a whole English sentence about serving，arXiv 2510.15152。",
    # Title Case sentences with enough function words
    "We Use This For Everything In The Code",
    "Follow The Guide，Then Apply The Patch",
    "We Ran It on GPU and saw KV hit, " + A,
    # hyphen chains of 3+ parts are split into words
    "We-always-restart-the-server-first-because-it-leaks",
    "We-restart-2-servers-because-it-leaks-every-night.",
    "Engineers restart a2a-server nightly because it leaks memory.",
    # internal link text is rendered prose and is judged
    "详见[the server restarts every night because it leaks](#s-ops)。",
    # quotation with no Chinese outside it is judged as is
    "\"We restart the server every night because it leaks memory.\"",
    # English outside a tip span is still judged
    "a2a-go {{sdk-go a2asrv/push/sender.go at v2.6.0}} " + EN,
    # normalisation: fullwidth letters, zero-width characters
    "Ｗｅ ｒｅｓｔａｒｔ ｔｈｅ ｓｅｒｖｅｒ ｅｖｅｒｙ ｎｉｇｈｔ ｂｅｃａｕｓｅ ｉｔ ｌｅａｋｓ。",
    "We re\u200bstart the ser\u200cver every night be\u200dcause it leaks\ufeff memory.",
    "We\u00a0restart\u00a0the\u00a0server\u00a0every\u00a0night\u00a0because\u00a0it\u00a0leaks.",
    "WE RESTART THE SERVER EVERY NIGHT BECAUSE IT LEAKS MEMORY",
    # one function word, long lower-case run (r9 B3)
    "Engineers restart servers nightly because processes leak memory constantly.",
    # HTML entities render as spaces
    "We&nbsp;restart&nbsp;the&nbsp;server&nbsp;every&nbsp;night&nbsp;because&nbsp;it&nbsp;leaks.",
    # image alt text is shown whatever the image URL is
    "![We restart the server every night because it leaks memory](https://x.org/a.png)",
    "![We restart the server every night because it leaks memory](figs/a.png)",
    # a quotation or external link text over the length cap is judged
    "原文如下：「This chapter explains how the router picks a replica. It reads the load from every worker and then it sends the request to the one with the lowest queue.」",
    "见[This chapter explains how the router picks a replica and why that choice matters](https://example.com/a)。",
]


def _scan(name: str, text: str) -> tuple[list[tuple[int, str, str]], int]:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / name
        path.write_text(text, encoding="utf-8")
        return chk.scan_file(path)


def _body(s):
    return "3-1-intro.md", f"{s}\n"


def _list(s):
    return "3-1-intro.md", f"- {s}\n"


def _ordered(s):
    return "3-1-intro.md", f"1. {s}\n"


def _cell(s):
    return "3-1-intro.md", f"| a | b |\n|---|---|\n| {s} | x |\n"


def _cell2(s):
    return "3-1-intro.md", f"| a | b |\n|---|---|\n| x | {s} |\n"


def _heading(s):
    return "3-1-intro.md", f"## {s}\n"


def _quote(s):
    return "3-1-intro.md", f"> {s}\n"


def _srclist(s):
    return "r-5-sources.md", f"- {s}\n"


def _srccell(s):
    return "r-5-sources.md", f"| a | b |\n|---|---|\n| {s} | x |\n"


def _rule_body(s):
    return "3-1-intro.md", f"```rule\nlabel: 规则\nsource: spec §3.1\n---\n{s}\n```\n"


def _rule_label(s):
    return "3-1-intro.md", f"```rule\nlabel: {s}\nsource: spec §3.1\n---\n中文规则。\n```\n"


def _takeaway(s):
    return "3-1-intro.md", f"```takeaways\n- 中文要点。\n- {s}\n```\n"


CONTEXTS = (_body, _list, _ordered, _cell, _cell2, _heading, _quote,
            _srclist, _srccell, _rule_body, _rule_label, _takeaway)


def _load_main_oracle():
    spec = importlib.util.spec_from_file_location(
        "check_manual_residual_en_main_89cbf1a", ORACLE_PATH,
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class KeepBlockBoundaryTests(unittest.TestCase):
    def test_keep_cases_are_silent_in_every_context(self):
        self.assertGreaterEqual(len(KEEP_CASES), 30)
        for sample in KEEP_CASES:
            self.assertFalse(chk.is_untranslated_sentence(sample), sample)
            for ctx in CONTEXTS:
                with self.subTest(sample=sample[:60], ctx=ctx.__name__):
                    hits, _ = _scan(*ctx(sample))
                    self.assertEqual(hits, [])

    def test_block_cases_fail_in_every_context(self):
        self.assertGreaterEqual(len(BLOCK_CASES), 20)
        for sample in BLOCK_CASES:
            self.assertTrue(chk.is_untranslated_sentence(sample), sample)
            for ctx in CONTEXTS:
                with self.subTest(sample=sample[:60], ctx=ctx.__name__):
                    hits, explained = _scan(*ctx(sample))
                    self.assertTrue(hits)
                    self.assertEqual(explained, 0)


class RuleThresholdTests(unittest.TestCase):
    """Each numeric bound of is_sentence_run, from both sides."""

    def test_min_words(self):
        # 4 words, 2 function words: kept (known limit: very short sentences)
        self.assertFalse(chk.is_untranslated_sentence("it is the end"))
        # 5 words: blocked
        self.assertTrue(chk.is_untranslated_sentence("it is the end now"))

    def test_min_function_words(self):
        # one function word: a noun phrase, kept
        self.assertFalse(chk.is_untranslated_sentence("Prefill and decode benchmark results summary"))
        self.assertFalse(chk.is_untranslated_sentence("prefill decode benchmark results summary table"))
        # two function words, lowercase: blocked
        self.assertTrue(chk.is_untranslated_sentence("prefill and decode on benchmark results"))

    def test_title_case_short_run_is_kept_long_run_with_func_words_blocked(self):
        # 6 Title Case words, 2/6 function words: a title, kept
        self.assertFalse(chk.is_untranslated_sentence("Start The Engine、Wait For Warmup"))
        # half function words blocks regardless of case (6 words, 3 fw)
        self.assertTrue(chk.is_untranslated_sentence("This Is The Paper We Use"))
        # 7 words, 3 fw (43%) Title Case: blocked by the 40% bound
        self.assertTrue(chk.is_untranslated_sentence("Restart The Engine And Wait For Warmup"))
        # 7 words, 2 fw (29%) Title Case: kept
        self.assertFalse(chk.is_untranslated_sentence("Restart Engine Quickly And Wait For Warmup"))

    def test_hyphen_chain_bound(self):
        # two-part compounds stay one word
        self.assertEqual(chk.run_words("on-policy Cache-Induced"), ["on-policy", "Cache-Induced"])
        # three or more parts are split
        self.assertEqual(chk.run_words("state-of-the-art"), ["state", "of", "the", "art"])
        self.assertEqual(chk.run_words("a2a-server-lf-v0.5.1"), ["server", "lf"])

    def test_identifiers_are_not_words(self):
        self.assertEqual(
            chk.run_words("v0.31.0 GB10 vllm/utils/mem_utils.py HF_HUB_OFFLINE=1 --tp-size 2"),
            [],
        )
        self.assertEqual(chk.run_words("FP8 KV cache"), ["KV", "cache"])

    def test_case_rule(self):
        # mostly lowercase after the first word: sentence case
        self.assertTrue(chk.is_untranslated_sentence("Memory guard pauses on a record GPU"))
        # mostly Title Case: a title
        self.assertFalse(chk.is_untranslated_sentence("Memory Guard Pauses on a Record GPU"))


class ElementTests(unittest.TestCase):
    def test_paragraph_wrapped_over_lines_is_one_paragraph(self):
        text = "We restart the\nserver every night\nbecause it leaks.\n"
        hits, _ = _scan("3-1-intro.md", text)
        self.assertEqual([(ln, k) for ln, k, _t in hits], [(1, "PROSE")])
        # each line alone is too short to be a sentence
        for line in text.splitlines():
            self.assertFalse(chk.is_untranslated_sentence(line))

    def test_blank_line_separates_paragraphs(self):
        hits, _ = _scan("3-1-intro.md", "中文一段。\n\nWe restart the server every night because it leaks.\n")
        self.assertEqual([(ln, k) for ln, k, _t in hits], [(3, "PROSE")])

    def test_blockquote_is_judged(self):
        hits, _ = _scan("3-1-intro.md", "> We restart the server\n> every night because it leaks.\n")
        self.assertEqual([(ln, k) for ln, k, _t in hits], [(1, "PROSE")])

    def test_code_fences_are_skipped(self):
        for text in (
            "```\n" + EN + "\n```\n",
            "```bash\n# " + EN + "\n```\n",
            # no "---": the whole listing is the code body, same split as rule
            "```listing\ntitle: x\nnote: " + EN + "\n```\n",
        ):
            with self.subTest(text=text[:30]):
                hits, _ = _scan("3-1-intro.md", text)
                self.assertEqual(hits, [])

    def test_text_after_a_fence_is_judged(self):
        hits, _ = _scan("3-1-intro.md", "```\nx\n```\n" + EN + "\n")
        self.assertEqual([ln for ln, _k, _t in hits], [4])

    def test_comments_and_key_lines_outside_fences_are_judged(self):
        # site/build-manuals.js renders these lines as text in a section.
        for text in ("<!-- " + EN + " -->\n", "<!--\n" + EN + "\n-->\n",
                     "title: " + EN + "\n", "note: " + EN + "\n"):
            with self.subTest(text=text[:30]):
                hits, _ = _scan("3-1-intro.md", text)
                self.assertTrue(hits)

    def test_sources_paragraph_is_citation_block(self):
        # "Sources: ..." is parsed by site/build-manuals.js as the citation block
        hits, _ = _scan("3-1-intro.md", "Sources: the vLLM source at v0.31.0 (vllm/utils/mem_utils.py), the v0.31.0 release notes\n")
        self.assertEqual(hits, [])
        # only at paragraph start; elsewhere the word is ordinary text
        hits, _ = _scan("3-1-intro.md", "Our Sources: " + EN + "\n")
        self.assertTrue(hits)

    def test_quotation_only_exempt_with_chinese_outside(self):
        self.assertFalse(chk.is_untranslated_sentence("日志写着 \"" + EN + "\"。"))
        self.assertTrue(chk.is_untranslated_sentence("\"" + EN + "\""))
        self.assertTrue(chk.is_untranslated_sentence("“" + EN + "”"))

    def test_external_vs_internal_link_text(self):
        self.assertFalse(chk.is_untranslated_sentence("见[" + EN + "](https://example.com/a)。"))
        for target in ("#s-ops", "manuals/a2a-101/sections/x.md", "../x.md"):
            self.assertTrue(chk.is_untranslated_sentence("见[" + EN + "](" + target + ")。"), target)

    def test_known_limit_homoglyphs_not_folded(self):
        # Cyrillic е/о are not ASCII letters, so these tokens are not words.
        self.assertFalse(chk.is_untranslated_sentence("Wе rеstart thе sеrvеr еvеry night bеcausе it lеaks"))


class FenceTests(unittest.TestCase):
    """rule / takeaways / figure / listing fences render as prose.

    site/build-manuals.js fenceBlock: rule and takeaways are prose; figure
    title/claim/caption and listing title/note are prose (bot-hub#124).
    id/kind/source/lang and the listing code body are not judged.
    """

    RULE = ("```rule\nlabel: the end of a task\nsource: spec §3.1.1\n---\n"
            "A task in a terminal state takes no more messages. The terminal "
            "states are `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, "
            "`TASK_STATE_CANCELED`, and `TASK_STATE_REJECTED`.\n```\n")

    def _kinds(self, text):
        hits, _ = _scan("3-1-intro.md", text)
        return [(ln, k) for ln, k, _t in hits]

    def test_pre_r10_rule_block_fails_body_and_label(self):
        # verbatim from 614330a2 manuals/a2a-101/sections/1-1-what-a2a-standardizes.md:43
        self.assertEqual(self._kinds(self.RULE), [(2, "RULE_LABEL"), (5, "RULE")])

    def test_translated_rule_is_silent(self):
        text = ("```rule\nlabel: 任务的终点\nsource: spec §3.1.1\n---\n"
                "处于终止状态的任务不再接受消息。终止状态是 `TASK_STATE_COMPLETED` 和 "
                "`TASK_STATE_REJECTED`。\n```\n")
        self.assertEqual(self._kinds(text), [])

    def test_rule_body_over_lines_is_one_text(self):
        text = "```rule\nlabel: 规则\nsource: x\n---\nWe restart the\nserver every night\nbecause it leaks.\n```\n"
        self.assertEqual(self._kinds(text), [(5, "RULE")])

    def test_rule_source_key_is_a_citation_not_prose(self):
        text = "```rule\nlabel: 规则\nsource: mcp §We restart the server every night because it leaks\n---\n中文。\n```\n"
        self.assertEqual(self._kinds(text), [])

    def test_rule_without_separator_is_judged(self):
        self.assertEqual(self._kinds("```rule\n" + EN + "\n```\n"), [(2, "RULE")])

    def test_rule_label_continuation_and_unknown_header_line(self):
        text = "```rule\nlabel: the server restarts\n  every night because it leaks\nsource: x\n---\n中文。\n```\n"
        self.assertEqual(self._kinds(text), [(2, "RULE_LABEL")])
        text = "```rule\nlabel: 规则\n" + EN + "\n---\n中文。\n```\n"
        self.assertEqual(self._kinds(text), [(3, "RULE")])

    def test_takeaway_items_and_continuations(self):
        text = "```takeaways\n- 中文要点。\n- We restart the server\n  every night because it leaks.\n- 另一个要点。\n```\n"
        self.assertEqual(self._kinds(text), [(3, "TAKEAWAY")])

    def test_text_after_rule_fence_is_judged(self):
        self.assertEqual(self._kinds(self.RULE + "\n" + EN + "\n"),
                         [(2, "RULE_LABEL"), (5, "RULE"), (8, "PROSE")])

    def test_english_figure_and_listing_keys_are_reported(self):
        # id/kind/source/lang and the code body are English sentences too, and
        # must not add hits. title/claim/caption/note/listing title must.
        text = (
            "```figure\n"
            f"id: {EN}\n"
            f"kind: {EN}\n"
            f"title: {EN}\n"
            f"claim: {EN}.\n"
            f"caption: {EN}\n"
            "```\n"
            "\n"
            "```listing\n"
            f"title: {EN}\n"
            f"source: {EN}\n"
            f"lang: {EN}\n"
            f"note: {EN}\n"
            "---\n"
            f"{EN}\n"
            "```\n"
        )
        self.assertEqual(self._kinds(text), [
            (4, "FIGURE_TITLE"),
            (5, "FIGURE_CLAIM"),
            (6, "FIGURE_CAPTION"),
            (10, "LISTING_TITLE"),
            (13, "LISTING_NOTE"),
        ])

    def test_figure_caption_continuation_is_one_hit_at_the_first_line(self):
        # Neither physical line is a sentence; the joined caption is.
        first, cont = "we restart the", "server every night"
        self.assertFalse(chk.is_untranslated_sentence(first))
        self.assertFalse(chk.is_untranslated_sentence(cont))
        self.assertTrue(chk.is_untranslated_sentence(first + " " + cont))
        text = (
            "```figure\n"
            "id: fig-x\n"
            "kind: flow\n"
            "title: 中文标题\n"
            "claim: 中文主张\n"
            "caption: " + first + "\n"
            "  " + cont + "\n"
            "```\n"
        )
        self.assertEqual(self._kinds(text), [(6, "FIGURE_CAPTION")])

    def test_chinese_figure_with_necessary_english_is_silent(self):
        title = "test-runner 的 A2A 栈"
        claim = "A2A 规定 card、绑定和 Task，虚线以下属于宿主。"
        caption = "从上往下读 Task 与 A2A，路径来自 test-runner 的 card。"
        for sample in (title, claim, caption):
            self.assertFalse(chk.is_untranslated_sentence(sample), sample)
        text = (
            "```figure\n"
            "id: fig-spec-layers\n"
            "kind: layers\n"
            f"title: {title}\n"
            f"claim: {claim}\n"
            f"caption: {caption}\n"
            "```\n"
        )
        self.assertEqual(self._kinds(text), [])

    def test_figure_title_alone_is_figure_title(self):
        # Kills a mutant that forgets to scan figure fences.
        text = (
            "```figure\n"
            "id: fig-x\n"
            "kind: flow\n"
            f"title: {EN}\n"
            "claim: 中文主张\n"
            "caption: 中文说明\n"
            "```\n"
        )
        self.assertEqual(self._kinds(text), [(4, "FIGURE_TITLE")])

    def test_listing_note_alone_is_listing_note(self):
        # Kills a mutant that scans listing title but forgets note.
        text = (
            "```listing\n"
            "title: 中文标题\n"
            "source: capture/log.txt\n"
            "lang: text\n"
            f"note: {EN}\n"
            "---\n"
            "code\n"
            "```\n"
        )
        self.assertEqual(self._kinds(text), [(5, "LISTING_NOTE")])

    def test_listing_code_body_is_not_judged(self):
        # Kills a mutant that scans the listing body after "---".
        text = (
            "```listing\n"
            "title: 中文标题\n"
            "source: capture/log.txt\n"
            "lang: text\n"
            "note: 中文说明\n"
            "---\n"
            f"{EN}\n"
            f"note: {EN}\n"
            "```\n"
        )
        self.assertEqual(self._kinds(text), [])

    def test_id_kind_source_lang_are_not_judged(self):
        # Kills a mutant that judges id/kind/source/lang when title/note are Chinese.
        self.assertTrue(chk.is_untranslated_sentence(EN))
        text = (
            "```figure\n"
            f"id: {EN}\n"
            f"kind: {EN}\n"
            "title: 中文标题里的 Task 与 A2A\n"
            "claim: test-runner 的中文主张\n"
            "caption: 中文说明\n"
            "```\n"
            "\n"
            "```listing\n"
            "title: 中文列表标题\n"
            f"source: {EN}\n"
            f"lang: {EN}\n"
            "note: 中文注释里的 test-runner\n"
            "---\n"
            "ok\n"
            "```\n"
        )
        self.assertEqual(self._kinds(text), [])

    def test_prose_inside_bash_fence_is_still_ignored(self):
        # Kills a mutant that searches the file for English instead of parsing
        # figure/listing head keys only.
        text = "```bash\n" + EN + "\ntitle: " + EN + "\nnote: " + EN + "\n```\n"
        self.assertEqual(self._kinds(text), [])

    def test_every_rule_and_takeaways_block_in_manuals_is_scanned(self):
        # All 17 rule blocks and every takeaways block are translated (r10).
        for man in ("a2a-101", "miles-101", "reverse-engineering-101", "sglang-101", "vllm-101"):
            for path in sorted((REPO_ROOT / "manuals" / man).rglob("*.md")):
                rel = PurePosixPath(path.relative_to(REPO_ROOT).as_posix())
                if chk.is_excluded(rel):
                    continue
                kinds = {k for _ln, k, _t in chk.scan_file(path)[0]}
                self.assertFalse(kinds & {"RULE", "RULE_LABEL", "TAKEAWAY"}, rel)

    def test_every_figure_and_listing_field_in_manuals_is_translated(self):
        # bot-hub#124 translations done; synthetic FenceTests with EN still
        # kill a mutant that skips figure/listing scanning.
        manuals = sorted(
            p.parent.name for p in (REPO_ROOT / "manuals").glob("*/manual.json")
        )
        self.assertGreaterEqual(len(manuals), 5)
        for man in manuals:
            for path in sorted((REPO_ROOT / "manuals" / man).rglob("*.md")):
                rel = PurePosixPath(path.relative_to(REPO_ROOT).as_posix())
                if chk.is_excluded(rel):
                    continue
                kinds = {
                    k for _ln, k, _t in chk.scan_file(path)[0]
                    if k.startswith("FIGURE_") or k.startswith("LISTING_")
                }
                self.assertFalse(kinds, rel)


class R11TighteningTests(unittest.TestCase):
    """#141 r11: probes from review r10 (desync/*.md), inlined verbatim."""

    S = "We restart the server every night because it leaks memory and nobody knows why it happens."
    HEAD = "# 标题\n\n中文段落。\n\n"

    def _kinds(self, text):
        hits, _ = _scan("3-1-intro.md", text)
        return [(ln, k) for ln, k, _t in hits]

    # 1. fences exactly as site/build-manuals.js parseDocument()
    def test_d1_inner_fence_info_line_does_not_close(self):
        text = self.HEAD + "```bash\necho hi\n```text\necho\n```\n\n" + self.S + "\n\n```bash\nx\n```\n"
        self.assertEqual(self._kinds(text), [(11, "PROSE")])

    def test_d2_indented_backticks_are_paragraph_text(self):
        text = self.HEAD + "  ```\n\n" + self.S + "\n\n  ```\n\n中文。\n"
        self.assertEqual(self._kinds(text), [(7, "PROSE")])

    def test_d6_space_before_info_is_rule(self):
        text = self.HEAD + "``` rule\nlabel: 中文\nsource: x\n---\n" + self.S + "\n```\n"
        self.assertEqual(self._kinds(text), [(9, "RULE")])

    def test_d5_bad_info_and_unclosed_fence_fail_closed(self):
        text = self.HEAD + "```Rule\nlabel: 中文\nsource: x\n---\n" + self.S + "\n```\n"
        self.assertEqual(self._kinds(text), [(5, "FENCE_BAD_INFO")])
        self.assertEqual(self._kinds(self.HEAD + "```bash\necho hi\n"), [(5, "FENCE_UNCLOSED")])

    def test_fence_with_extra_words_is_not_a_fence(self):
        # Not a fence, and site/build-manuals.js stops on it with
        # "unrecognised block line"; so does this gate (bot-hub#125
        # follow-up), instead of judging it as prose.
        text = self.HEAD + "```bash extra\n" + self.S + "\n"
        with self.assertRaisesRegex(chk.UnrecognisedBlockLine, r'3-1-intro\.md:5: unrecognised block line "```bash extra"'):
            self._kinds(text)

    def test_indented_backticks_inside_fence_do_not_close(self):
        text = self.HEAD + "```bash\n  ```\n" + self.S + "\n```\n"
        # Builder: line 7 is code. Only the frozen main checker (which toggles
        # on any ``` line) reports it, via the union; this gate's own scan
        # does not (it would report PROSE).
        self.assertEqual(self._kinds(text), [(7, "MAIN_PROSE")])

    def test_real_fences_still_skip_code(self):
        text = self.HEAD + "```bash\n" + self.S + "\n```\n\n```text \n" + self.S + "\n```  \n"
        self.assertEqual(self._kinds(text), [])

    # 2. Title Case sentence
    def test_e_title_sentence_with_period_fails(self):
        text = self.HEAD + "Operators Should Restart the Server When the Memory Usage Grows Past the Limit.\n"
        self.assertEqual(self._kinds(text), [(5, "PROSE")])

    def test_title_case_over_cap_fails(self):
        words = "Operators Should Restart the Server When the Memory Usage Grows Past the Limit Every Night Again"
        self.assertGreater(len(words.split()), chk.TITLE_MAX_WORDS)
        self.assertTrue(chk.is_untranslated_sentence(words))
        self.assertTrue(chk.is_untranslated_sentence("论文 " + words + " 说明了这一点。"))

    def test_titles_at_cap_without_period_kept(self):
        t15 = "Operators Should Restart the Server When the Memory Usage Grows Past the Limit Again Tonight"
        self.assertEqual(len(t15.split()), chk.TITLE_MAX_WORDS)
        self.assertFalse(chk.is_untranslated_sentence("论文 " + t15 + " 说明了这一点。"))
        # not Title Case (a lowercase content word): rule e does not apply
        self.assertFalse(chk.is_untranslated_sentence(
            "SGLang Router and Model Gateway for multi-node deployments."))
        for end in (".", "!", "?", ".)", ".”"):
            with self.subTest(end=end):
                self.assertTrue(chk.is_untranslated_sentence(
                    "Is the Reward Model All You Need for Reasoning" + end))

    # 3. per-paragraph cap on exempt quote / link words
    def test_e_quote_chain_fails(self):
        text = (self.HEAD + "他说“We restart the server every night because it leaks memory.”然后"
                "“Nobody on the team knows why the process keeps growing after each deploy.”最后"
                "“So we added a cron job that kills it at three in the morning.”\n")
        self.assertEqual(self._kinds(text), [(5, "PROSE")])

    def test_e_link_chain_fails(self):
        text = (self.HEAD + "见 [we restart the server every night](https://a.example/1)、"
                "[because it leaks memory and nobody](https://a.example/2)、"
                "[knows why it keeps growing after deploys](https://a.example/3)。\n")
        self.assertEqual(self._kinds(text), [(5, "PROSE")])

    def test_over_cap_still_drops_tips_and_bare_urls(self):
        title = "A Survey of Large Language Models for Code Generation"   # 9 words
        over = ("见 [" + title + "](https://a.example/1) 和 [" + title + "](https://a.example/2)")
        self.assertFalse(chk.is_untranslated_sentence(over + "。"))   # 18 > 15: judged, titles kept
        tip = "{{note we restart the server every night because it leaks memory}}"
        url = "https://a.example/we,restart,the,server,every,night,because,it,leaks,memory"
        self.assertTrue(chk.is_untranslated_sentence("见 " + tip.strip("{}") + "。"))
        self.assertTrue(chk.is_untranslated_sentence("见 " + url.replace("https://a.example/", "") + "。"))
        self.assertFalse(chk.is_untranslated_sentence(over + " " + tip + "。"))
        self.assertFalse(chk.is_untranslated_sentence(over + " " + url + " 。"))

    def test_exempt_totals_at_cap_kept(self):
        def words(n):
            return " ".join((["we", "restart", "the", "server"] * 10)[:n])
        quotes = "日志写着 \"" + words(15) + "\" 和 \"" + words(15) + "\"。"
        self.assertFalse(chk.is_untranslated_sentence(quotes))          # 30 == cap
        self.assertTrue(chk.is_untranslated_sentence(quotes.replace("和", "和 \"we\"")))  # 31
        links = "见 [" + words(8) + "](https://a.example/1)、[" + words(7) + "](https://a.example/2)。"
        self.assertFalse(chk.is_untranslated_sentence(links))           # 15 == cap
        self.assertTrue(chk.is_untranslated_sentence(links.replace("、", "、[we](https://a.example/3)、")))  # 16


class VariableFenceTests(unittest.TestCase):
    """bot-hub#125: fences close like site/build-manuals.js parseDocument():
    a column-0 run of the same character, at least as long as the opener."""

    S = "We restart the server every night because it leaks memory and nobody knows why it happens."
    HEAD = "# 标题\n\n中文段落。\n\n"

    def _kinds(self, text):
        hits, _ = _scan("3-1-intro.md", text)
        return [(ln, k) for ln, k, _t in hits]

    def test_four_backtick_fence_keeps_inner_three_backtick_block_as_code(self):
        inner = "```rule\nlabel: x\nsource: y\n---\n" + self.S + "\n```\n"
        text = self.HEAD + "````text\n" + inner + "````\n\n" + self.S + "\n"
        # Lines 5-12 are one text fence, skipped as code by this gate's own
        # scan: no RULE, and line 14 is the only PROSE. Line 10 still comes
        # from the frozen main checker (it toggles on any ``` line), via the
        # union, like test_indented_backticks_inside_fence_do_not_close.
        self.assertEqual(self._kinds(text), [(10, "MAIN_PROSE"), (14, "PROSE")])

    def test_tilde_fence_is_a_fence_and_closes_only_on_tildes(self):
        text = self.HEAD + "~~~rule\nlabel: 中文\nsource: x\n---\n```\n" + self.S + "\n~~~~\n"
        # The ``` on line 9 does not close the tilde fence, so the rule body
        # starts there and is judged as RULE.
        self.assertEqual(self._kinds(text), [(9, "RULE")])

    def test_shorter_or_other_character_does_not_close(self):
        self.assertEqual(self._kinds(self.HEAD + "````bash\necho\n```\n~~~~\n"), [(5, "FENCE_UNCLOSED")])
        hits, _ = _scan("3-1-intro.md", self.HEAD + "~~~text\nx\n```\n")
        self.assertEqual([(ln, k, t) for ln, k, t in hits], [(5, "FENCE_UNCLOSED", "~~~text")])

    def test_four_backtick_figure_captions_skip_quoted_figure(self):
        text = ("````text\n```figure\nid: fig-q\ncaption: quoted\n```\n````\n\n"
                "```figure\nid: fig-1\ncaption: real\n```\n")
        self.assertEqual(chk.figure_captions_in_text(text), [("fig-1", "real")])


class BuilderBlockParityTests(unittest.TestCase):
    """bot-hub#125 follow-up: indented fence lines and block-start lines the
    builder cannot place are handled exactly as site/build-manuals.js
    parseDocument() handles them."""

    S = "We restart the server every night because it leaks memory and nobody knows why it happens."
    HEAD = "# 标题\n\n中文段落。\n\n"
    # (text after HEAD, line the builder rejects with "unrecognised block
    # line" or None). HEAD is 4 lines, so the first body line is line 5.
    CASES = [
        ("```bash extra\necho\n```\n", 5),
        ("~~~bash extra\necho\n~~~\n", 5),
        ("````bash extra\n", 5),
        ("~~~~text more\n", 5),
        ("中文。\n\n| a | b |\n", 7),
        ("| h |\n|---|\n| r |\n\n| r2 |\n", 9),
        ("|---|\n", 5),
        ("## \n", 5),
        ("### \n", 5),
        ("| h | x |\n|---|---|\n| r | y |\n", None),
        ("##  x\n", None),
        ("- a\n- b\n", None),
        ("~~~text\nx\n~~~\n", None),
    ] + [
        (f"{pad}{marker}bash extra\necho\n{pad}{marker}\n", None)
        for pad in (" ", "   ", "    ", "      ")
        for marker in ("```", "~~~", "````")
    ] + [
        (f"{marker}text\n{pad}{marker}\nx\n{marker}\n", None)
        for pad in (" ", "   ", "    ")
        for marker in ("```", "~~~")
    ]

    def _kinds(self, text):
        hits, _ = _scan("3-1-intro.md", text)
        return [(ln, k) for ln, k, _t in hits]

    def _gate_rejects(self, text):
        try:
            _scan("3-1-intro.md", text)
        except chk.UnrecognisedBlockLine as error:
            found = re.search(r"3-1-intro\.md:(\d+): unrecognised block line", str(error))
            self.assertIsNotNone(found, str(error))
            return int(found.group(1))
        return None

    def test_gate_rejects_the_lines_the_builder_rejects(self):
        for body, line in self.CASES:
            with self.subTest(body=body):
                self.assertEqual(self._gate_rejects(self.HEAD + body), line)

    @unittest.skipUnless(shutil.which("node"), "node is not installed")
    def test_cases_match_site_build_manuals(self):
        # Run the real builder on the same inputs: it must reject the same
        # line, or accept the document.
        builder = Path(__file__).resolve().parent.parent / "site" / "build-manuals.js"
        script = (
            "const m = require(process.argv[1]);"
            "const out = JSON.parse(require('fs').readFileSync(0, 'utf8')).map(t => {"
            " try { m.parseDocument(t, 'doc.md'); return null; }"
            " catch (e) { const f = /^doc\\.md:(\\d+): unrecognised block line/.exec(e.message);"
            " return f ? Number(f[1]) : 'other: ' + e.message; } });"
            "process.stdout.write(JSON.stringify(out));"
        )
        texts = [self.HEAD + body for body, _line in self.CASES]
        proc = subprocess.run(
            ["node", "-e", script, str(builder)], input=json.dumps(texts),
            capture_output=True, text=True, check=True, timeout=60,
        )
        self.assertEqual(json.loads(proc.stdout), [line for _body, line in self.CASES])

    def test_indented_fence_lines_are_paragraph_text(self):
        for pad in (" ", "   ", "    "):
            for marker in ("```", "~~~"):
                with self.subTest(pad=len(pad), marker=marker):
                    # Had the indented line opened a fence, line 7 would be
                    # skipped as code; it is a paragraph and is judged.
                    text = self.HEAD + f"{pad}{marker}bash\n\n" + self.S + f"\n\n{pad}{marker}\n"
                    self.assertEqual(self._kinds(text), [(7, "PROSE")])

    def test_indented_tilde_closer_inside_fence_is_body(self):
        text = self.HEAD + "~~~rule\nlabel: 中文\nsource: x\n---\n   ~~~\n" + self.S + "\n~~~\n"
        # The indented ~~~ (line 9) does not close, so the rule body starts
        # there. Line 10 also comes from the frozen main checker, which knows
        # only ``` fences and reads the tilde block as prose (union).
        self.assertEqual(self._kinds(text), [(9, "RULE"), (10, "MAIN_PROSE")])

    def test_cli_exits_two_with_file_line(self):
        with tempfile.TemporaryDirectory() as tmp:
            sections = Path(tmp) / "manuals" / "a2a-101" / "sections"
            sections.mkdir(parents=True)
            (sections / "a.md").write_text("## 小节\n\n~~~bash extra\n中文。\n~~~\n", encoding="utf-8")
            proc = subprocess.run(
                [sys.executable, str(Path(__file__).resolve().parent / "check_manual_residual_en.py"),
                 "--root", tmp, "a2a-101"],
                capture_output=True, text=True, check=False,
            )
            self.assertEqual(proc.returncode, 2, proc.stdout + proc.stderr)
            self.assertNotIn("FAIL_hits=0", proc.stdout)
            self.assertIn('manuals/a2a-101/sections/a.md:3: unrecognised block line "~~~bash extra"', proc.stderr)


class LengthCapAndLimitTests(unittest.TestCase):
    """B3 r9: exempt spans have a length cap; the rest are pinned known limits."""

    @staticmethod
    def _words(n):
        base = ("we restart the server every night because it leaks memory and "
                "then we check the logs for the next run of the job on the node "
                "with the most free cache today").split()
        return " ".join(base[:n])

    def test_quote_cap(self):
        self.assertEqual(chk.QUOTE_MAX_WORDS, 25)
        self.assertFalse(chk.is_untranslated_sentence("日志写着 \"" + self._words(25) + "\"。"))
        self.assertTrue(chk.is_untranslated_sentence("日志写着 \"" + self._words(26) + "\"。"))
        self.assertTrue(chk.is_untranslated_sentence("日志写着「" + self._words(26) + "」。"))

    def test_external_link_text_cap(self):
        self.assertEqual(chk.LINK_TEXT_MAX_WORDS, 12)
        self.assertFalse(chk.is_untranslated_sentence("见[" + self._words(12) + "](https://example.com/a)。"))
        self.assertTrue(chk.is_untranslated_sentence("见[" + self._words(13) + "](https://example.com/a)。"))

    def test_few_function_words_bound(self):
        # 7 words, 1 function word, lower case: blocked; 6 words: kept
        self.assertTrue(chk.is_untranslated_sentence("engineers restart servers because processes leak memory"))
        self.assertFalse(chk.is_untranslated_sentence("engineers restart servers because processes leak"))
        # needs at least 5 lower-case content words after the first word
        self.assertFalse(chk.is_untranslated_sentence("engineers restart Servers because processes leak memory"))
        # Title Case noun phrase with one function word stays a title
        self.assertFalse(chk.is_untranslated_sentence("Prefill Decode Benchmark Results And Summary Table"))

    def test_paper_title_exemption_needs_lowercase_function_words(self):
        self.assertFalse(chk.is_untranslated_sentence("A Survey of Large Language Models for Code Generation in the Wild"))
        self.assertTrue(chk.is_untranslated_sentence("A Survey Of Large Language Models For Code Generation In The Wild"))
        self.assertTrue(chk.is_untranslated_sentence("A survey of large language models for code generation in the wild"))

    def test_known_limits_documented_in_pr_body(self):
        # Each of these is kept on purpose or by design; the PR body lists them.
        for text in (
            "日志写着 \"" + self._words(14) + "\"。",            # quote <= 25 words
            "见[" + self._words(10) + "](https://example.com/a)。",  # ext link <= 12 words
            "Operators restart production servers nightly; leaking processes exhaust memory quickly.",  # 0 function words
            "We restart the 服务器 every night because 它 leaks memory and then 我们 check the logs.",  # sprinkle
            "We restart ノ the server every night ノ because it leaks memory.",  # kana split
            "We_restart the_server every_night because_it leaks_memory and_then dies.",  # identifier joins
            "Restart the server nightly.",  # <= 4 words
        ):
            with self.subTest(text=text[:40]):
                self.assertFalse(chk.is_untranslated_sentence(text))


class MainDemoAndHistoryTests(unittest.TestCase):
    def test_gate_demo_sentence_still_fails(self):
        # the sentence commit 79ee1c0e added on purpose to prove the gate fails
        hits, _ = _scan("1-1-install.md", "\nThis sentence is deliberately left in English to prove that the residual English gate fails the pull request.\n")
        self.assertTrue(hits)

    def test_pre_141_untranslated_lines_still_fail(self):
        # verbatim from origin/main 89cbf1a, translated by #141
        samples = [
            ("README.md", "Every request, response, and stream frame in A2A 101 comes from this kit. It runs three remote agents and a recording client on your machine, with the Python standard library only. It needs no network and no keys.\n"),
            ("README.md", "## How this kit differs from the reference SDK\n"),
            ("README.md", "| `08-rejected.http` | a production deploy the agent refuses |\n|---|---|\n"),
            ("r-3-incident-index.md", "| Thermal throttle in an L4 sweep ([record](manuals/sglang-101/capture/gpu/incidents/l4-thermal-throttle.txt)) | x |\n|---|---|\n"),
            ("r-5-sources.md", "| The Mooncake team on the LMSYS blog | x |\n|---|---|\n"),
        ]
        for name, text in samples:
            with self.subTest(text=text[:50]):
                hits, _ = _scan(name, text)
                self.assertTrue(hits)


class SourcesWhitelistTests(unittest.TestCase):
    """B-9 / r3: exact 3-title whitelist, strip-then-equality only."""

    def test_whitelist_has_exactly_three_verbatim_manual_entries(self):
        self.assertEqual(len(chk.SOURCES_TITLE_WHITELIST), 3)
        files = {
            "manuals/miles-101/sections/r-4-sources.md",
            "manuals/sglang-101/sections/r-5-sources.md",
        }
        corpus = "".join((REPO_ROOT / f).read_text(encoding="utf-8") for f in files)
        for title in chk.SOURCES_TITLE_WHITELIST:
            self.assertIn(title, corpus)

    def test_whitelisted_titles_are_explained_in_sources_files_only(self):
        for title in chk.SOURCES_TITLE_WHITELIST:
            for ctx in (_srclist, _srccell):
                hits, explained = _scan(*ctx(title))
                self.assertEqual((hits, explained), ([], 1), title[:40])
            hits, explained = _scan(*_list(title))
            self.assertEqual((hits, explained), ([], 0), title[:40])

    def test_whitelisted_title_plus_appended_english_is_hit(self):
        for title in chk.SOURCES_TITLE_WHITELIST:
            for ctx in (_srclist, _srccell):
                hits, explained = _scan(*ctx(title + " " + EN + "."))
                self.assertTrue(hits, title[:40])
                self.assertEqual(explained, 0)

    def test_manual_explained_counts(self):
        counts = {}
        for m in ("miles-101", "sglang-101"):
            n = 0
            for p in sorted((REPO_ROOT / "manuals" / m).rglob("*.md")):
                n += chk.scan_file(p)[1]
            counts[m] = n
        self.assertEqual(counts, {"miles-101": 2, "sglang-101": 1})


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



class UnionWithMainTests(unittest.TestCase):
    """The frozen main checker still runs; its hits are re-judged (B-9 kept)."""

    @classmethod
    def setUpClass(cls):
        cls.oracle = _load_main_oracle()

    def test_oracle_file_is_frozen_main_bytes(self):
        digest = hashlib.sha256(ORACLE_PATH.read_bytes()).hexdigest()
        self.assertEqual(digest, ORACLE_SHA256)

    def test_whole_manual_main_only_hits_are_reviewed(self):
        main_only = set()
        new_total = 0
        for manual_json in sorted((REPO_ROOT / "manuals").glob("*/manual.json")):
            for path in sorted(manual_json.parent.rglob("*.md")):
                rel = PurePosixPath(path.relative_to(REPO_ROOT).as_posix())
                if chk.is_excluded(rel):
                    continue
                new_hits, _ = chk.scan_file(path)
                # Figure/listing fields are scanned but not translated yet
                # (bot-hub#124). Prose, rules, and takeaways stay clean.
                new_total += sum(
                    1 for _ln, k, _t in new_hits
                    if not (k.startswith("FIGURE_") or k.startswith("LISTING_"))
                )
                for ln, _k, text in self.oracle.scan_file(path, False, False):
                    main_only.add((rel.as_posix(), ln, text))
        self.assertEqual(new_total, 0)
        self.assertEqual(main_only, EXPECTED_MAIN_ONLY)

    def test_expected_main_only_are_necessary_english(self):
        lines_cache = {}
        for rel, ln, text in EXPECTED_MAIN_ONLY:
            lines = lines_cache.setdefault(
                rel, (REPO_ROOT / rel).read_text(encoding="utf-8").splitlines())
            self.assertIn(text[:40], lines[ln - 1])
            if len(text) < 120:
                self.assertFalse(chk.is_untranslated_sentence(text), text)

    def test_allowed_text_sets_are_exact(self):
        self.assertEqual(
            chk.MAIN_ONLY_ALLOWED_TEXTS, {t for _r, _l, t in EXPECTED_MAIN_ONLY})
        self.assertEqual(len(chk.MAIN_ONLY_ALLOWED_TEXTS), 26)
        self.assertEqual(len(chk.MAIN_ONLY_ALLOWED_FULL_CELLS), 4)
        truncated = sorted(t for t in chk.MAIN_ONLY_ALLOWED_TEXTS if len(t) >= 120)
        self.assertEqual(sorted(f[:120] for f in chk.MAIN_ONLY_ALLOWED_FULL_CELLS), truncated)

    def test_b9_truncated_prefix_plus_english_is_reported(self):
        # main truncates at 120 chars; a reviewed prefix must not exempt a
        # cell that continues with English outside the tip span.
        for full in chk.MAIN_ONLY_ALLOWED_FULL_CELLS:
            for name in ("4-5-streaming.md", "r-5-sources.md"):
                for tpl in ("| {s} | x |\n|---|---|\n", "- {s}\n", "{s}\n", "## {s}\n"):
                    text = tpl.format(s=full + " " + EN)
                    with self.subTest(full=full[:30], name=name, tpl=tpl[:3]):
                        hits, explained = _scan(name, text)
                        self.assertTrue(hits)
                        self.assertEqual(explained, 0)

    def test_b9_reviewed_full_cells_stay_silent(self):
        for full in chk.MAIN_ONLY_ALLOWED_FULL_CELLS:
            name = "r-5-sources.md" if full.startswith("Patodiya") else "4-5-streaming.md"
            hits, _ = _scan(name, "| " + full + " | `POST` |\n|---|---|\n")
            self.assertEqual(hits, [], full[:60])

    def test_main_hit_with_sentence_is_reported_by_union(self):
        # _union_with_main alone (no PR hits, nothing covered) reports main's
        # hit when its full text is a sentence ...
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "x.md"
            p.write_text("| " + EN + " | x |\n", encoding="utf-8")
            hits = chk._union_with_main(p, [], set())
            self.assertEqual([(ln, k) for ln, k, _t in hits], [(1, "MAIN_TABLE_CELL[0]")])
            # ... and drops it when it is necessary English.
            p.write_text("| FlashInfer、Triton、FlexAttention、TurboQuant | x |\n", encoding="utf-8")
            self.assertTrue(self.oracle.scan_file(p, False, False))
            self.assertEqual(chk._union_with_main(p, [], set()), [])

    def test_main_link_text_short_prefix_is_not_a_match(self):
        # Below 120 chars main's text is complete: only exact equality may
        # match, so a longer external link that merely starts with it is not
        # the link main reported.
        short = "we restart the server every night"
        line = "见[" + short + " because it leaks](https://example.com/a)和[" + short + "](#s-ops)。"
        self.assertEqual(chk._main_link_text(line, short), (short, False))
        self.assertIsNone(chk._main_link_text("见[" + short + " because](https://e.com/a)。", short))
        long = "x" * 130
        self.assertEqual(chk._main_link_text("[" + long + "](https://e.com/a)", long[:120]), (long, True))

    def test_main_link_text_hit_external_is_kept_internal_is_judged(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "x.md"
            p.write_text("见[" + EN + "](https://example.com/a)。\n", encoding="utf-8")
            self.assertTrue(self.oracle.scan_file(p, False, False))
            self.assertEqual(chk._union_with_main(p, [], set()), [])
            p.write_text("见[" + EN + "](#s-ops)。\n", encoding="utf-8")
            self.assertTrue(chk._union_with_main(p, [], set()))
            self.assertTrue(chk.scan_file(p)[0])


class CliFailClosedTests(unittest.TestCase):
    """The CLI itself must exit non-zero, not only the CI gate (review r7)."""

    SCRIPT = Path(__file__).resolve().parent / "check_manual_residual_en.py"
    CLEAN = "## 小节\n\n这一段全部是中文，没有残留英文。\n"

    def _manual(self, root: Path) -> Path:
        sections = root / "manuals" / "a2a-101" / "sections"
        sections.mkdir(parents=True)
        (sections / "a.md").write_text(self.CLEAN, encoding="utf-8")
        return sections

    def _run(self, script: Path, root: Path):
        return subprocess.run(
            [sys.executable, str(script), "--root", str(root), "a2a-101"],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_clean_manual_exits_zero(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._manual(root)
            proc = self._run(self.SCRIPT, root)
            self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
            self.assertIn("FAIL_hits=0", proc.stdout)

    def test_undecodable_file_exits_nonzero(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sections = self._manual(root)
            (sections / "b.md").write_bytes(
                b"\xff\xfe We restart the server every night.\n"
            )
            proc = self._run(self.SCRIPT, root)
            self.assertNotEqual(proc.returncode, 0, proc.stdout)
            self.assertNotIn("FAIL_hits=0", proc.stdout)
            self.assertIn("UnicodeDecodeError", proc.stderr)

    def test_missing_manual_exits_two(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "manuals").mkdir()
            proc = self._run(self.SCRIPT, root)
            self.assertEqual(proc.returncode, 2, proc.stdout + proc.stderr)
            self.assertIn("missing", proc.stderr)

    def test_manual_without_markdown_exits_two(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "manuals" / "a2a-101").mkdir(parents=True)
            proc = self._run(self.SCRIPT, root)
            self.assertEqual(proc.returncode, 2, proc.stdout + proc.stderr)
            self.assertNotIn("FAIL_hits=0", proc.stdout)

    def test_missing_main_baseline_exits_nonzero(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self._manual(root)
            scripts = root / "scripts"
            scripts.mkdir()
            # Same checker, but the frozen main baseline is absent next to it.
            copy = scripts / self.SCRIPT.name
            copy.write_bytes(self.SCRIPT.read_bytes())
            self.assertFalse((scripts / ORACLE_PATH.name).exists())
            proc = self._run(copy, root)
            self.assertNotEqual(proc.returncode, 0, proc.stdout)
            self.assertNotIn("FAIL_hits=0", proc.stdout)
            self.assertIn(ORACLE_PATH.name, proc.stderr)


def _figure(caption: str, title: str = "中文标题", claim: str = "中文主张") -> str:
    return (
        "```figure\n"
        "id: fig-x\n"
        "kind: flow\n"
        f"title: {title}\n"
        f"claim: {claim}\n"
        f"caption: {caption}\n"
        "```\n"
    )


class ReaderCaptionFromTailTests(unittest.TestCase):
    """#124 B1: figure captions keep an English ``From …`` provenance tail.

    site/build-manuals.js readerCaption() strips that tail in the reader.
    The gate must strip the same tail before it judges FIGURE_CAPTION, and
    the on-disk tail must stay English so the reader never sees ``capture/``.
    """

    def test_reader_caption_matches_the_site_reader(self):
        # The four cases in site/test_manuals.js, plus both guards.
        self.assertEqual(
            chk.reader_caption(
                "Read top to bottom. Grey layers are outside SGLang. "
                "From the v0.5.22 source and capture/out/server-default.log."
            ),
            "Read top to bottom. Grey layers are outside SGLang.",
        )
        self.assertEqual(
            chk.reader_caption(
                "From step 2 on, the left box is the request. From capture/out/a.txt."
            ),
            "From step 2 on, the left box is the request.",
        )
        self.assertEqual(chk.reader_caption("Read left to right."), "Read left to right.")
        kept = "Read it. From the second request onward, the cache serves the prefix."
        self.assertEqual(chk.reader_caption(kept), kept)
        # Period-then-capital inside the tail: a sentence, even with "source".
        sentence = "From the source. The next sentence starts here."
        self.assertEqual(chk.reader_caption(sentence), sentence)
        # No path-like token: keep the tail (the guard above is not this one).
        prose = "From the second request onward, the cache serves the prefix."
        self.assertEqual(chk.reader_caption(prose), prose)

    def test_chinese_caption_with_from_tail_is_silent(self):
        # A. The backtick path the machine writes, and a From-tail that is
        # itself an untranslated sentence (it would hit if the tail were kept).
        backtick = "中文说明。 From `capture/out/x.http`."
        hits, _ = _scan("3-1-intro.md", _figure(backtick))
        self.assertEqual(
            [(ln, k) for ln, k, _t in hits if k == "FIGURE_CAPTION"],
            [],
        )
        prose_tail = (
            "中文说明。 From capture/out/x.http and the shutdown code at v0.5.22."
        )
        self.assertTrue(chk.is_untranslated_sentence(prose_tail))
        self.assertFalse(chk.is_untranslated_sentence(chk.reader_caption(prose_tail)))
        self.assertNotIn("capture/", chk.reader_caption(prose_tail))
        hits, _ = _scan("3-1-intro.md", _figure(prose_tail))
        self.assertEqual(
            [(ln, k) for ln, k, _t in hits if k == "FIGURE_CAPTION"],
            [],
        )

    def test_english_prose_caption_still_hits(self):
        # B. Stripping a tail must not exempt the caption body.
        hits, _ = _scan("3-1-intro.md", _figure(EN))
        self.assertEqual([(ln, k) for ln, k, _t in hits], [(6, "FIGURE_CAPTION")])
        mixed = EN + ". From capture/out/x.http and the shutdown code at v0.5.22."
        self.assertNotEqual(chk.reader_caption(mixed), mixed.strip())
        self.assertTrue(chk.is_untranslated_sentence(chk.reader_caption(mixed)))
        hits, _ = _scan("3-1-intro.md", _figure(mixed))
        self.assertEqual([(ln, k) for ln, k, _t in hits], [(6, "FIGURE_CAPTION")])

    def test_every_real_figure_reader_caption_hides_capture_paths(self):
        # C. Every non-excluded figure caption, after the readerCaption mirror.
        figs = chk.figure_captions(REPO_ROOT)
        self.assertGreaterEqual(len(figs), 50)
        stripped = [
            (rel, fig_id) for rel, fig_id, caption in figs
            if chk.reader_caption(caption) != caption.strip()
        ]
        self.assertGreaterEqual(len(stripped), 50)
        leaks = chk.figure_caption_capture_leaks(REPO_ROOT)
        self.assertEqual(
            leaks, [],
            "reader caption still contains capture/: "
            + "; ".join(f"{rel} {fig_id}" for rel, fig_id in leaks),
        )
        # On-disk captions do not use a Chinese trailing provenance tail.
        chinese = [
            f"{rel} {fig_id}"
            for rel, fig_id, caption in figs
            if "来自 capture/" in caption or "来自 `capture/" in caption
        ]
        self.assertEqual(chinese, [])

    def test_chinese_from_tail_mutation_still_leaks_and_real_tree_does_not(self):
        # D. Rewriting one real English From-tail into Chinese documents the
        # bug: readerCaption only strips "From", so capture/ stays visible.
        # A temp tree that uses that form fails the every-figure check.
        real = next(
            (
                (rel, fig_id, caption)
                for rel, fig_id, caption in chk.figure_captions(REPO_ROOT)
                if " From capture/" in caption or " From `capture/" in caption
            ),
            None,
        )
        self.assertIsNotNone(real)
        rel, fig_id, caption = real
        shown = chk.reader_caption(caption)
        self.assertNotIn("capture/", shown, f"{rel} {fig_id}")
        self.assertNotEqual(shown, caption.strip(), f"{rel} {fig_id}")
        mutant = shown + "来自 capture/out/demo.http。"
        self.assertIn("capture/", chk.reader_caption(mutant), f"{rel} {fig_id}")

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "section.md").write_text(
                _figure("中文说明。来自 capture/out/demo.http。"),
                encoding="utf-8",
            )
            leaks = chk.figure_caption_capture_leaks(root)
            self.assertEqual(leaks, [("section.md", "fig-x")])
        self.assertEqual(chk.figure_caption_capture_leaks(REPO_ROOT), [])

    @staticmethod
    def _last_sentence(text: str) -> str:
        parts = [p for p in re.split(r"(?<=[。！？.!?])\s*", text.strip()) if p.strip()]
        return parts[-1].strip() if parts else ""

    @staticmethod
    def _from_tail(caption: str) -> str | None:
        body = chk.reader_caption(caption)
        if body == caption.strip():
            return None
        m = re.search(r"(?:^|\s)(From (?!step\b)\S[\s\S]*)$", caption.strip())
        return m.group(1).strip() if m else None

    @staticmethod
    def _main_from_tails() -> dict[tuple[str, str], str]:
        """Stripable From-tails from origin/main, with a committed baseline fallback.

        Prefer live ``git show origin/main`` (after an optional fetch) so the
        check tracks main; if that is unavailable in CI, load
        scripts/fixtures/figure_caption_from_tails_main.json.
        """
        baseline_path = (
            Path(__file__).resolve().parent / "fixtures" / "figure_caption_from_tails_main.json"
        )
        # Try to make origin/main available (no-op when already fetched).
        subprocess.run(
            ["git", "fetch", "--no-tags", "--depth=1", "origin", "main"],
            cwd=REPO_ROOT,
            capture_output=True,
            check=False,
        )
        live: dict[tuple[str, str], str] = {}
        head_rels = sorted({rel for rel, _fid, _c in chk.figure_captions(REPO_ROOT)})
        for rel in head_rels:
            proc = subprocess.run(
                ["git", "show", f"origin/main:{rel}"],
                cwd=REPO_ROOT,
                capture_output=True,
                check=False,
            )
            if proc.returncode != 0:
                live = {}
                break
            for fig_id, caption in chk.figure_captions_in_text(proc.stdout.decode("utf-8")):
                tail = ReaderCaptionFromTailTests._from_tail(caption)
                if tail is not None:
                    live[(rel, fig_id)] = tail
        if live:
            return live
        data = json.loads(baseline_path.read_text(encoding="utf-8"))
        return {(row["rel"], row["id"]): row["main_tail"] for row in data}

    def test_stripable_from_tails_match_main_and_reader_has_no_lai_sentence(self):
        # E. For every main-stripable figure: head's stripped From-tail matches
        # main byte-for-byte; reader_caption(head) does not end with a sentence
        # that starts with 「来自」; no capture/ leak. Uses live origin/main or
        # the committed baseline so CI cannot skip this check (#149 r2).
        main_tails = self._main_from_tails()
        self.assertGreaterEqual(len(main_tails), 100)
        head = {(rel, fig_id): caption for rel, fig_id, caption in chk.figure_captions(REPO_ROOT)}
        for (rel, fig_id), main_tail in sorted(main_tails.items()):
            self.assertIn((rel, fig_id), head, f"missing on head: {rel} {fig_id}")
            caption = head[(rel, fig_id)]
            shown = chk.reader_caption(caption)
            self.assertNotEqual(shown, caption.strip(), f"{rel} {fig_id}")
            self.assertEqual(self._from_tail(caption), main_tail, f"{rel} {fig_id}")
            self.assertNotIn("capture/", shown, f"{rel} {fig_id}")
            self.assertFalse(
                self._last_sentence(shown).startswith("来自"),
                f"{rel} {fig_id} reader ends with 来自-sentence: {self._last_sentence(shown)!r}",
            )

    def test_duplicate_chinese_lai_before_from_mutation_is_caught(self):
        # Mutation for #149 r2: Chinese 「来自 …。」 left in front of an English
        # From-tail survives capture/-only checks but fails the 来自-sentence rule.
        real = next(
            (
                (rel, fig_id, caption)
                for rel, fig_id, caption in chk.figure_captions(REPO_ROOT)
                if self._from_tail(caption) is not None
                and "capture/" not in chk.reader_caption(caption)
            ),
            None,
        )
        self.assertIsNotNone(real)
        rel, fig_id, caption = real
        shown = chk.reader_caption(caption)
        self.assertFalse(self._last_sentence(shown).startswith("来自"), f"{rel} {fig_id}")
        mutant = shown + "来自 某来源说明。" + " " + self._from_tail(caption)
        mutant_shown = chk.reader_caption(mutant)
        self.assertTrue(
            self._last_sentence(mutant_shown).startswith("来自"),
            f"mutant should leave a 来自-sentence visible: {mutant_shown!r}",
        )
        # Real tree must not contain that adjacent duplicate form.
        dup = [
            f"{r} {i}"
            for r, i, c in chk.figure_captions(REPO_ROOT)
            if re.search(r"(?<=[。！？])来自[^。！？]*。[ \t]*From (?!step\b)", c)
        ]
        self.assertEqual(dup, [])


if __name__ == "__main__":
    unittest.main()
