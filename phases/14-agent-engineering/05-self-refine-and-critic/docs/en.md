# Self-Refine 和 CRITIC：迭代式输出改进

> Self-Refine（Madaan et al., 2023）让一个 LLM 在循环中扮演三个角色：generate、feedback、refine。平均收益：在 7 个任务上绝对提升 +20。CRITIC（Gou et al., 2023）通过将验证路由到外部工具来强化 feedback 步骤。到 2026 年，这一模式以 “evaluator-optimizer”（Anthropic）或 guardrail loop（OpenAI Agents SDK）的形式出现在每个 framework 中。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 分钟

## 学习目标

- 说出 Self-Refine 的三个 prompt（generate、feedback、refine），并解释为什么 history 对 refine prompt 很重要。
- 解释 CRITIC 的关键洞见：没有外部 grounding 时，LLMs 在 self-verification 上不可靠。
- 实现一个带 history 和可选外部 verifier 的 stdlib Self-Refine loop。
- 将这一模式映射到 Anthropic 的 “evaluator-optimizer” workflow 和 OpenAI Agents SDK 的 output guardrails。

## 问题

一个 agent 生成了一个几乎正确的答案。也许某行 code 有 syntax error。也许 summary 太长。也许 plan 漏掉了一个 edge case。你想要的是：agent critique 自己的输出，然后修复它。

Self-Refine 表明：用单个 model、不需要 training data、不需要 RL，也能做到这一点。但有一个问题：LLMs 不擅长对 hard facts 做 self-verification。CRITIC 命名了这个修复方案：把 verify 步骤路由到外部工具（search、code interpreter、calculator、test runner）。

这两篇 paper 共同定义了 2026 年迭代式改进的默认模式：generate、verify（能外部验证就外部验证）、refine，在 verifier 通过时停止。

## 概念

### Self-Refine（Madaan et al., NeurIPS 2023）

一个 LLM，三个角色：

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

关键细节：`refine` 会看到完整 history，也就是所有先前输出和 critiques，因此它不会重复错误。paper 对此做了 ablation：去掉 history，质量会急剧下降。

核心结果：在 7 个任务（math、code、acronym、dialog）上平均带来 +20 的绝对提升，包括 GPT-4。无需 training、无需外部工具、单个 model。

### CRITIC（Gou et al., arXiv:2305.11738, v4 Feb 2024）

Self-Refine 的弱点：feedback 步骤是 LLM 给自己打分。对于事实性 claims，这并不可靠（hallucination 往往在生成它的 model 看来很有说服力）。CRITIC 用 `verify(task, output, tools)` 替换 `feedback(task, output)`，其中 `tools` 包括：

- 用于事实性 claims 的 search engine。
- 用于 code correctness 的 code interpreter。
- 用于 arithmetic 的 calculator。
- 领域特定 verifiers（unit tests、type checkers、linters）。

verifier 会生成基于工具结果的 structured critique。然后 refiner 基于这个 critique 进行改写。

核心结果：CRITIC 在事实性任务上优于 Self-Refine，因为 critique 有 grounding。在没有外部 verifiers 的任务上（creative writing、formatting），CRITIC 会退化为 Self-Refine。

### 停止条件

两种常见形态：

1. **Verifier 通过。** 外部 test 返回 success。有可用条件时首选（unit tests、type checker、guardrail assertion）。
2. **没有发出 feedback。** Model 说 “the output is fine.” 成本更低但不可靠；要搭配 max-iteration cap。

2026 默认做法：组合二者。“如果 verifier 通过，或 model 说 fine 且 iterations >= 2，或 iterations >= max_iterations，则停止。”

### Evaluator-Optimizer（Anthropic, 2024）

Anthropic 在 2024 年 12 月的文章中把它命名为五种 workflow patterns 之一。两个角色：

- Evaluator：给输出打分并生成 critique。
- Optimizer：根据 critique 修订输出。

循环直到 evaluator 通过。这就是 Anthropic 表述中的 Self-Refine/CRITIC。Anthropic 补充的关键工程细节是：evaluator 和 optimizer prompts 应该有明显不同的结构，这样 model 才不会只是 rubber-stamp。

### OpenAI Agents SDK output guardrails

OpenAI Agents SDK 将这一模式作为 “output guardrails” 提供。guardrail 是在 agent 最终输出上运行的 validator。如果 guardrail 触发（raise `OutputGuardrailTripwireTriggered`），输出会被拒绝，agent 可以 retry。Guardrails 可以调用工具（CRITIC-style），也可以是 pure functions（Self-Refine-style）。

### 2026 年的坑

- **Rubber-stamp loops。** 同一个 model 用同一种 prompt style 做 generation 和 critique，会收敛到 “looks good to me”。使用结构上不同的 prompts，或用更小、更便宜的 model 做 critique。
- **过度 refine。** 每次 refine pass 都会增加 latency 和 Token。预算设置为 1-3 次 pass；之后升级到 human review。
- **在 trivial tasks 上使用 CRITIC。** 如果没有外部 verifier，CRITIC 会退化为 Self-Refine；不要为 stub verifier 支付 latency。

```figure
self-refine
```

## 构建它

`code/main.py` 在一个 toy task 上实现 Self-Refine 和 CRITIC：给定 topic，生成一个简短 bullet list。verifier 检查格式（3 个 bullets，每个少于 60 个字符）。CRITIC 增加一个外部 “fact verifier”，用于惩罚已知 hallucinations。

组件：

- `generate` — scripted producer。
- `feedback` — LLM-style self-critique。
- `verify_external` — CRITIC-style grounded verifier。
- `refine` — 根据 history 改写输出。
- Stop condition — verifier 通过或最多 4 次 iterations。

运行：

```
python3 code/main.py
```

比较 Self-Refine 和 CRITIC 的运行结果。CRITIC 捕捉到了 Self-Refine 漏掉的事实错误，因为外部 verifier 拥有 self-critic 不具备的 grounding。

## 使用它

Anthropic 的 evaluator-optimizer 是用 Claude-friendly language 表述的这一模式。OpenAI Agents SDK 的 output guardrails 呈 CRITIC 形态（guardrails 可以调用工具）。LangGraph 提供了一个读起来像 Self-Refine 的 reflection node。Google 的 Gemini 2.5 Computer Use 增加了 per-step safety evaluator，这是 CRITIC 的一个变体：每个 action 在 commit 前都会被验证。

## 交付它

`outputs/skill-refine-loop.md` 会根据 task shape、verifier availability 和 iteration budget 配置 evaluator-optimizer loop。输出 generator、evaluator/verifier 和 optimizer 的 prompts，以及 stop policy。

## 练习

1. 用 max_iterations=1 运行这个 toy。CRITIC 仍然有帮助吗？
2. 把外部 verifier 替换成 noisy verifier（随机 30% false positives）。loop 会怎样？这是 2026 年大多数 guardrail stacks 的现实。
3. 实现一个 “generator-critic on different models” 变体：big model 生成，small model critique。它能胜过 same-model 吗？
4. 阅读 CRITIC Section 3（arXiv:2305.11738 v4）。说出三类 verification-tool categories，并为每类给出一个例子。
5. 将 OpenAI Agents SDK 的 `output_guardrails` 映射到 CRITIC 的 verifier role。SDK 做错了什么，又做对了什么？

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Self-Refine | “会修复自己的 LLM” | 在一个 model 中执行 Generate -> feedback -> refine loop，并带 history |
| CRITIC | “Tool-grounded verification” | 用外部 verifier（search、code、calc、tests）替换 feedback |
| Evaluator-Optimizer | “Anthropic workflow pattern” | 两个角色：evaluator 打分，optimizer 修订，并循环到收敛 |
| Output guardrail | “Post-hoc check” | OpenAI Agents SDK validator，在 agent 生成输出后运行 |
| Verify step | “Critique phase” | 承重决策点：grounded 还是 self-rated |
| Refine history | “Model 已经尝试过的内容” | 先前 outputs + critiques 被前置到 refine prompt；去掉后质量会崩塌 |
| Rubber-stamp loop | “Self-agreement failure” | 相同 prompt 的 critique 返回 “looks good”；用结构上不同的 prompts 修复 |
| Stop condition | “Convergence test” | Verifier 通过，或没有 feedback 且达到 iteration cap；绝不能只有单一条件 |

## 延伸阅读

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — 经典 paper
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) — tool-grounded verification
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — evaluator-optimizer workflow pattern
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — 作为 CRITIC-shaped verifiers 的 output guardrails
