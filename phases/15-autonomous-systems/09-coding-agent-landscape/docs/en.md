# Autonomous Coding Agent 版图（2026）

> SWE-bench Verified 在不到三年内从 4% 提升到 80.9%。同一个 Claude Sonnet 4.5 在 SWE-agent v1 上得分 43.2%，在 Cline autonomous 上得分 59.8% —— 如今围绕模型的 scaffolding 和模型本身一样重要。OpenHands（前身为 OpenDevin）是最活跃的 MIT-licensed 平台，它的 CodeAct loop 会直接在 sandbox 中执行 Python actions，而不是 JSON tool calls。头条数字掩盖了一个方法论问题：500 个 SWE-bench Verified 任务中有 161 个只需要 1–2 行修改，而 SWE-bench Pro（10+ 行任务）上，同样的 frontier models 得分只有 23–59%。

**类型：** 学习
**语言：** Python（stdlib，CodeAct vs JSON tool-call 对比）
**先修要求：** Phase 14 · 07（Tool use），Phase 15 · 01（Long-horizon agents）
**时间：** 约 45 分钟

## 问题

“哪个 coding agent 最好”是错误的问题。正确的问题是：在与我的工作匹配的任务分布上，使用我会在生产中运行的 scaffolding，我能获得怎样的端到端可靠性？

在 2022 到 2026 年之间，这个领域认识到 scaffolding —— retrieval layer、planner、sandbox、edit-verify loop、feedback format —— 是承重结构。Claude Sonnet 4.5 在 SWE-agent v1 上的 SWE-bench Verified 得分是 43.2%；同一个模型放在 Cline 的 autonomous scaffold 中得分是 59.8%。相同 weights，绝对差距 16.6 分。基础模型是一个组件；loop 才是产品。

伴随而来的问题是 benchmark 饱和会掩盖退步。SWE-bench Verified 已接近饱和，而 easy-task tail（500 个任务中有 161 个只需 ≤2 行）会拉高顶部分数。真实世界质量更适合在 SWE-bench Pro（10+ 行修改）这样的分布上衡量，在那里同样的领先系统仍只有 23–59%。

## 概念

### 用一段话理解 SWE-bench

SWE-bench（Jimenez et al.）选取带有 ground-truth patches 的真实 GitHub issues，并要求 agent 生成一个 patch，让 test suite 通过。SWE-bench Verified（OpenAI，2024）是一个经过人工筛选的 500 任务子集，移除了含糊和损坏的任务。SWE-bench Pro 是更难的后继版本 —— 任务要求 10+ 行修改，目前的 frontier agents 得分为 23–59%。

### 2022 → 2026 曲线真正说明了什么

- **2022**：research models 在原始 SWE-bench 上约 4%。
- **2024**：GPT-4 + Devin-style scaffolding 约 14%；SWE-agent 约 12%。
- **2025**：Claude 3.5/3.7 Sonnet 在 Aider 和 SWE-agent 中推进到 40–55% 区间。
- **2026**：Claude Sonnet 4.5 和 frontier competitors 在 SWE-bench Verified 上达到 70–80%+。Epoch AI 的 leaderboard 会实时追踪这一情况。

这条斜率来自三个叠加来源：更好的基础模型、更好的 scaffolding（CodeAct、reflection、verifier loops），以及更好的 benchmarks（Verified 移除了噪声）。

### CodeAct vs JSON 工具调用

OpenHands（All-Hands-AI，arXiv:2407.16741，前身为 OpenDevin）做了一个特定的架构押注：不是让模型发出由 host 解码并执行的 JSON tool calls，而是让模型发出 Python code，并由 Jupyter-style kernel 在 sandbox 中运行它。agent 可以在一个 action 内遍历 files、串联 tools，并捕获自己的 exceptions。

权衡如下：

- **JSON tool calls**：每个 action 是一个 turn；易于 audit；compositionality 有限；默认更安全，因为每次 call 都经过显式 validator。
- **CodeAct**：一个 action 可以是一整个 program；具备 compositionality；需要 hardened sandbox（OpenHands 使用 Docker isolation）；failure modes 包括 sandbox runtime 允许的任何行为。

两种架构都已用于生产。CodeAct 在开放平台中占主导（OpenHands、smolagents）。JSON tool calls 在 managed services 中仍占主导（Anthropic Managed Agents、OpenAI Assistants），因为 provider 控制 executor。

### 2026 版图中的 scaffolds

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### 为什么 scaffolding 占主导

一次 coding run 是一条 long-horizon trajectory（Lesson 1）。可靠性会跨步骤复合。scaffolding 在三个地方带来分数：

1. **Retrieval**：找到要读取的正确 files 是沉默的瓶颈。SWE-agent 的 ACI、OpenHands 的 file-index，以及 Aider 的 repo-map 都在解决这个问题。
2. **Verifier loop**：运行 tests、读取 stack traces、再次尝试，在 SWE-bench 上能带来 10+ 分差。
3. **Failure containment**：出错时可以 rollback 的 sandbox 能防止损害累积。有 verifier loop 和没有 verifier loop 的同一个模型，看起来像两个不同产品。

### Benchmark 饱和与真实分布

OpenHands 作者和 Epoch AI 都指出 SWE-bench Verified 存在 easy tail：500 个任务中有 161 个只需 1–2 行修改。高分部分由这个 tail 驱动。SWE-bench Pro 限定为 10+ 行修改，即使是 frontier systems，分数也只有 23–59%。你的生产分布几乎肯定更接近 Pro，而不是 Verified。

选择 agent 的含义是：在你自己的 bug backlog 上运行一个类似 Pro 的子集。真正重要的分数，是代表你实际交付内容的任务上的分数。

```figure
a5-scaffold-delta
```

## 使用它

`code/main.py` 在一个固定的 mini-task distribution 上比较两个玩具 agent scaffolds：

1. 一个 **JSON tool-call** scaffold，每个 turn 采取一个 action。
2. 一个 **CodeAct** scaffold，每个 action 可以发出一小段 Python snippet。

两者都使用 stub “model”（deterministic rules），因此比较会把 scaffold 与模型质量隔离开。输出会显示 CodeAct scaffold 用更少 turns 解决更多任务，代价是每个 action 的 blast radius 更大。

## 交付它

`outputs/skill-scaffold-audit.md` 帮助你在采用 proposed coding-agent scaffold 之前进行 audit：retrieval quality、verifier presence、sandbox isolation，以及 benchmark-to-distribution fit。

## 练习

1. 运行 `code/main.py`。在相同 task set 上，每个 scaffold 需要多少 turns？每个 scaffold 的 per-action blast radius 是什么？

2. 阅读 OpenHands paper（arXiv:2407.16741）。该 paper 认为 CodeAct 在复杂任务上优于 JSON tool calls。找出 paper 承认的一个 failure mode，并写一句话说明该 mode 什么时候会在生产中占主导。

3. 从你的 bug backlog 中选择一个需要跨两个 files 修改 10+ 行的任务。估计 frontier model 在 (a) JSON tool calls 和 (b) CodeAct 下的端到端成功概率。说明差距的理由。

4. SWE-bench Verified 有 161 个 single-file、1–2 行任务。构造一个排除它们的分数。leaderboard 会如何重新排序？

5. 阅读 “Introducing SWE-bench Verified”（OpenAI）。解释用于移除 ambiguous tasks 的具体 methodology，并说出一种 curation 会漏掉的类别。

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) — 原始 benchmark 和 methodology。
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — curated subset 是如何构建的。
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) — CodeAct 架构和 event-stream 设计。
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) — 实时追踪的 scores。
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) — long-horizon coding-agent reliability framing。
