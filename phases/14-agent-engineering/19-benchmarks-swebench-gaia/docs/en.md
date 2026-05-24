# Benchmarks：SWE-bench、GAIA、AgentBench

> 三个 benchmarks 构成了 2026 年 agent evaluation 的锚点。SWE-bench 测试代码 patching。GAIA 测试 generalist tool use。AgentBench 测试 multi-environment reasoning。要了解它们的组成、contamination 叙事，以及它们不衡量什么。

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## 学习目标

- 说出 SWE-bench 的 test harness（FAIL_TO_PASS），并解释为什么它以 unit tests 作为 gate。
- 解释为什么 SWE-bench Verified（OpenAI，500 tasks）存在，以及它移除了什么。
- 描述 GAIA 的设计：对人类简单，对 AI 困难；三个难度等级。
- 说出 AgentBench 的八个 environments，以及它对 open-source LLMs 的主要 blocker。
- 总结 SWE-bench+ 的 contamination 发现及其影响。

## 问题

Leaderboards 会告诉你哪个 model 在某个 benchmark 上获胜。它们不会告诉你：

- benchmark 是否被 contamination（solutions 在 training data 中、test leakage）。
- benchmark 是否衡量你关心的内容（code vs browsing vs generalist）。
- evaluator 是否 robust（AST matching、state checks、human review）。

在引用某个数字之前，先了解这三个锚点 benchmarks 及其 failure modes。

## 概念

### SWE-bench（Jimenez et al., ICLR 2024 oral）

- 来自 12 个热门 Python repos 的 2,294 个真实 GitHub issues。
- Agent 得到：pre-fix commit 的 codebase + natural-language issue description。
- Agent 产出：一个 patch。
- Evaluator：应用 patch，运行 repo 的 test suite。patch 必须让 FAIL_TO_PASS tests（之前 failing，现在 passing）翻转，同时不破坏 PASS_TO_PASS tests。

SWE-agent（Yang et al., 2024）在发布时达到 12.5%，其重点是 agent-computer interfaces（file editor commands、model 能理解的 search syntax）。

### SWE-bench Verified

OpenAI，2024 年 8 月。人工 curated 的 500-task subset。移除了 ambiguous issues、unreliable tests，以及 fix 不明确的 tasks。它是“你的 agent 是否能交付真实 patches？”的主要 benchmark。

### Contamination

- 超过 94% 的 SWE-bench issues 早于大多数 model cutoffs。
- **SWE-bench+** 发现 32.67% 的 successful patches 在 issue text 中泄漏了 solutions（model 在 description 中看到了 fix），另有 31.08% 因 weak test coverage 而可疑。
- Verified 更干净，但并非完全没有 contamination。

实践影响：一个在 SWE-bench 得分 50% 的 model，在 SWE-bench+ 上可能只有 35%。如果你声称 SWE-bench performance，请始终同时报告两者。

### GAIA（Mialon et al., Nov 2023）

- 466 个 questions；其中 300 个保留给 huggingface.co/gaia-benchmark 的 private leaderboard。
- 设计理念：“对人类在概念上简单（92%），但对 AI 困难（带 plugins 的 GPT-4：15%）。”
- 测试 reasoning、Multimodal、web、tool use。
- 三个难度等级；Level 3 需要跨 modalities 的长 tool chains。

GAIA 用来衡量“generalist capability”。不要把它和 code-specific benchmarks 混淆。

### AgentBench（Liu et al., ICLR 2024）

- 8 个 environments，覆盖 code（Bash、DB、KG）、games（Alfworld、LTP）、web（WebShop、Mind2Web）和 open-ended generation。
- Multi-turn，每个 split 约 4k-13k turns。
- 主要发现：long-term reasoning、decision-making 和 instruction following 是 OSS LLMs 追赶 commercial 的 blockers。

### 这些不衡量什么

- 真实世界的 operational cost（Token、wall-clock）。
- adversarial conditions 下的 safety behavior。
- 你所在 domain 的 performance（使用你自己的 evals，Lesson 30）。
- Tail failures（benchmarks 看 average；production operators 关心最差的 1%）。

### Benchmarking 常见错误

- **执着于单一数字。** SWE-bench 50% 告诉你的信息少于 P50/P75/P95 cost + step distribution。
- **Contaminated claims。** 报告 SWE-bench 却不提 Verified 或 SWE-bench+ 是 misleading 的。
- **Benchmark-as-development-target。** 为 benchmark 优化会偏离 production usefulness。

## 构建它

`code/main.py` 实现了一个玩具版 SWE-bench-like harness：

- Synthetic bug-fix tasks（3 tasks）。
- 一个 scripted “agent”，会提出 patches。
- 一个 test runner，用来检查 FAIL_TO_PASS（bug 现在已修复）和 PASS_TO_PASS（没有破坏任何东西）。
- 一个基于 question decomposition depth 的 GAIA-style difficulty classifier。

运行它：

```
python3 code/main.py
```

输出会展示每个 task + 每个 difficulty 的 resolution rate，并让 evaluator rules 变得具体。

## 使用它

- **SWE-bench Verified** 用于 code agents。始终报告 Verified scores。
- **GAIA** 用于 generalist agents。使用 private leaderboard split。
- **AgentBench** 用于 multi-environment comparison。
- **Custom evals**（Lesson 30）用于你的 product 的实际形态。

## 交付它

`outputs/skill-benchmark-harness.md` 会为任意 codebase-task pair 构建一个 SWE-bench-style harness，带有 FAIL_TO_PASS / PASS_TO_PASS gating。

## 练习

1. 将这个 toy harness 移植到一个真实 repo 上运行（选你自己的一个）。为已知 bugs 编写 3 个 FAIL_TO_PASS tests。
2. 添加一个 step-count metric。在你的 3 个 tasks 上，每次 resolution 需要多少 agent steps？
3. 阅读 SWE-bench+ paper。实现一个 solution-leakage check（将 issue text 与 diff 做 pattern-match）。
4. 从 public split 下载一个 GAIA question。追踪一个 GPT-4-class agent 会怎么做。它需要哪些 tools？
5. 阅读 AgentBench 的 per-environment breakdown。哪个 environment 映射你的 product surface？那里的 “SOTA” 是什么样？

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| SWE-bench | “Code agent benchmark” | 2,294 个 GitHub issues；patch 必须翻转 FAIL_TO_PASS tests |
| SWE-bench Verified | “Clean SWE-bench” | 500 个由人工 curated 的 tasks，OpenAI |
| FAIL_TO_PASS | “Fix gate” | 之前 failing、patch 后必须 passing 的 tests |
| PASS_TO_PASS | “No-regression gate” | 之前 passing 且必须仍然 passing 的 tests |
| GAIA | “Generalist benchmark” | 466 个 human-easy / AI-hard 的 multi-tool questions |
| AgentBench | “Multi-env benchmark” | 8 个 environments；long-horizon multi-turn |
| Contamination | “Training-set leak” | benchmark tasks 出现在 model training 中 |
| SWE-bench+ | “Contamination audit” | 在 successful SWE-bench patches 中发现 32.67% solution leakage |

## 进一步阅读

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) — 原始 benchmark
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — 精选子集
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) — generalist benchmark
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) — 多环境 suite
