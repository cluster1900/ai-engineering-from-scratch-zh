# Reflexion：Verbal Reinforcement Learning

> 基于 Gradient 的 RL 需要数千次试验和一个 GPU cluster 才能修复一种 failure mode。Reflexion（Shinn et al., NeurIPS 2023）用自然语言完成这件事：每次失败试验后，agent 写下一段 reflection，将其存入 episodic memory，并让下一次试验基于这段 memory。这就是 Letta 的 sleep-time compute、Claude Code 的 CLAUDE.md learnings，以及 pro-workflow 的 learn-rule 背后的模式。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## 学习目标
- 说出 Reflexion 的三个组件（Actor、Evaluator、Self-Reflector）以及 episodic memory 的作用。
- 实现一个 stdlib Reflexion loop，包含 binary evaluator、reflection buffer 和全新的 re-attempts。
- 针对给定任务，在 scalar、heuristic 和 self-evaluated feedback sources 之间做选择。
- 解释为什么 verbal reinforcement 能捕捉到基于 Gradient 的 RL 需要数千次试验才能修复的错误。

## 问题
一个 agent 任务失败了。在标准 RL 中，你会再运行数千次试验，计算 gradients，更新 weights。成本高、速度慢，而且大多数 production agents 并没有针对每次失败都进行训练的预算。

Reflexion（Shinn et al., arXiv:2303.11366）提出了另一个问题：如果 agent 只是思考自己为什么失败，并把这个想法放进 prompt 里再试一次，会怎样？没有 weight updates。没有 Gradient。只有在试验之间保存的自然语言。

结果是：在 ALFWorld 上，它超过了 ReAct 和其他非 fine-tuned baselines。在 HotpotQA 上，它相对 ReAct 有所提升。在 code generation（HumanEval/MBPP）上，它达到了当时的 state of the art。整个过程没有一次 Gradient step。

## 概念
### The three components

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

再加上一个数据结构：

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

一次 trial 会运行 Actor。Evaluator 对它打分。如果 score 较低，Self-Reflector 会生成一段 reflection（“我选错了 tool，因为我把问题误读成在问 X，而它实际在问 Y”）。这段 reflection 会进入 episodic memory。下一次 trial 从头开始，但会看到这段 reflection。

### Three evaluator types

1. **Scalar** — 外部 binary signal。ALFWorld 成功或失败。HumanEval tests 通过或失败。最简单，signal 最强。
2. **Heuristic** — 预定义的 failure signatures。“如果 agent 连续两次产生相同 action，就标记为 stuck。”“如果 trajectory 超过 50 steps，就标记为 inefficient。”
3. **Self-evaluated** — LLM 对自己的 trajectory 打分。当没有 ground truth 时需要它。Signal 较弱；适合与 tool-grounded verification 搭配使用（Lesson 05 — CRITIC）。

2026 年的默认做法是混合使用：可用时用 scalar，不可用时用 self-eval，heuristics 作为 safety rails。

### Why this generalizes

Reflexion 与其说是一种新 algorithm，不如说是一种被命名的模式。几乎每个 production “self-healing” agent 都运行着某种变体：

- Letta 的 sleep-time compute（Lesson 08）：一个独立 agent 反思过去的 conversations，并写入 memory blocks。
- Claude Code 的 `CLAUDE.md` / “save memory” 模式：将 reflections 捕获为 learnings，并 prepend 到未来 sessions。
- pro-workflow 的 `/learn-rule` command：将 corrections 捕获为显式 rules。
- LangGraph 的 reflection nodes：一个 node 对 output 打分，并在需要时路由到 refine。

它们都来自同一个 insight：自然语言是一种足够丰富的媒介，可以在 runs 之间携带“我从失败中学到了什么”。

### 什么时候有效，什么时候无效

Reflexion 适用于：

- 有清晰的 failure signal（test failure、tool error、wrong answer）。
- task class 可复现（同一类型的问题会再次出现）。
- reflection 有空间改善 trajectory（有足够的 action budget）。

Reflexion 不适用于：

- agent 第一次尝试就已经成功。
- 失败来自外部因素（network down、tool broken）——反思“network was down”对未来 runs 没有帮助。
- reflection 变成迷信——为一次偶发的 flaky run 存储一段 narrative。

2026 年的陷阱：memory rot。Reflections 会累积；其中一些已过时或错误；随着 episodic buffer 变大，re-runs 会变慢。缓解方法：定期 compaction（Lesson 06）、对 reflections 设置 TTL，或使用单独的 sleep-time cleanup agent（Letta）。

## 构建它
`code/main.py` 在一个 toy puzzle 上实现 Reflexion：生成一个 3-element list，使其 sum 等于目标值。Actor 产出 candidate lists；Evaluator 检查 sum；Self-Reflector 写一行关于哪里出错的 diagnosis。Reflection 会进入 episodic memory，供下一次 trial 使用。

Components:

- `Actor` — 一个 scripted policy，在看到 reflections 时会改进。
- `Evaluator.binary()` — 基于 target sum 的 pass/fail。
- `SelfReflector` — 生成一行 failure diagnosis。
- `EpisodicMemory` — 一个带 TTL semantics 的 bounded list。

运行：

```
python3 code/main.py
```

Trace 展示三次 trials。Trial 1 失败，存储一段 reflection；trial 2 看到 reflection 后有所改进但仍失败；trial 3 成功。与 baseline run（无 reflection）对比——它会卡在 trial 1 的答案上。

## 使用它
LangGraph 将 reflection 作为 node pattern 提供。Claude Code 的 `/memory` command 和 pro-workflow 的 `/learn-rule` 将 episodic buffer 外部化为一个 Markdown 文件。Letta 的 sleep-time compute 在 downtime 运行 Self-Reflector，使 primary agent 继续受 latency 约束。OpenAI Agents SDK 不直接提供 Reflexion；你可以用一个按 score 拒绝 trajectories 的自定义 Guardrail，以及一个能跨 runs 保留的 memory `Session` 来构建它。

## 交付它
`outputs/skill-reflexion-buffer.md` 创建并维护一个 episodic buffer，包含 reflection capture、TTL 和 deduplication。给定一个 task class 和一次 failure，它会产出一段真正帮助下一次 trial 的 reflection（而不是泛泛的“be more careful”）。

## 练习
1. 从 binary evaluator 切换到返回 distance metric（离 target 有多远）的 scalar evaluator。它是否收敛得更快？
2. 为 reflections 添加 10 trials 的 TTL。超过这个点后，较旧的 reflections 是有害还是有益？
3. 实现 heuristic evaluator：如果同一个 action 重复出现，就将 trial 标记为 stuck。这与 Self-Reflector 如何交互？
4. 使用会忽略 reflections 的 adversarial Actor 运行 Reflexion。为了迫使 Actor 注意到它们，最小的 reflection prompt engineering 是什么？
5. 阅读 Reflexion paper 中关于 AlfWorld 的 Section 4。从概念上复现 130% success-rate improvement：相对于 vanilla ReAct，关键 delta 是什么？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) — 经典 paper
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) — production 中的 async reflection
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — 将 episodic buffer 作为 context 的一部分来管理
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — reflection node pattern
