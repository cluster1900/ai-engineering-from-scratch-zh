# Failure Modes：Agents 为什么会失败

> MASFT (Berkeley, 2025) 将 14 种多 Agent failure modes 归纳为 3 个类别。Microsoft 的 Taxonomy 记录了现有 AI failures 如何在 agentic 场景中被放大。行业现场数据收敛到五种反复出现的模式：hallucinated actions、scope creep、cascading errors、context loss、tool misuse。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**先修要求：** Phase 14 · 05 (Self-Refine and CRITIC), Phase 14 · 24 (Observability)
**Time:** ~60 minutes

## 学习目标
- 说出 MASFT 的三类 failure categories，并在每类中至少说出四种具体模式。
- 解释为什么 agentic failure 会放大现有 AI failure modes（bias、hallucination）。
- 描述五种行业反复出现的模式及其缓解方法。
- 实现一个 stdlib detector，用 failure-mode labels 标注 agent traces。

## 问题
团队发布的 agents 在 90% 的 traces 上都能工作。剩下 10% 的 failures 不是随机噪声，而是落入少数反复出现的类别。一旦你能命名它们，就能监控它们并修复它们。

## 概念
### MASFT (Berkeley, arXiv:2503.13657)

Multi-Agent System Failure Taxonomy。14 种 failure modes 聚类为 3 个类别。Inter-annotator Cohen's Kappa 为 0.88，说明这些类别可以被可靠地区分。

核心主张：failures 是多 Agent 系统中的根本设计缺陷，而不是可以通过更好的 base models 修复的 LLM 限制。

### Microsoft Taxonomy of Failure Mode in Agentic AI Systems

- 现有 AI failures（bias、hallucination、data leakage）会在 agentic 场景中被放大。
- 新的 failures 来自 autonomy：大规模 unintended action、tool misuse、mission drift。
- 这份 whitepaper 是 agentic products 的 risk register。

### Characterizing Faults in Agentic AI (arXiv:2603.06847)

- Failures 来自 orchestration、internal state evolution 和 environment interaction。
- 不只是“bad code”或“bad model output”。

### LLM Agent Hallucinations Survey (arXiv:2509.18970)

两种主要表现：

1. **Instruction-following Deviation** — Agent 没有遵循 system prompt。
2. **Long-range Contextual Misuse** — Agent 忘记或误用更早轮次中的 context。

Sub-intention errors：Omission（漏掉步骤）、Redundancy（重复步骤）、Disorder（步骤顺序错误）。

### 五种行业反复出现的模式

Arize、Galileo、NimbleBrain 2024-2026 年的现场分析收敛到：

1. **Hallucinated actions.** Agent 调用了不存在的 tool，或编造了 arguments。
2. **Scope creep.** Agent 将任务扩展到超出用户要求的范围（创建额外 PR、发送额外 emails）。
3. **Cascading errors.** 一个错误调用触发下游影响。一次 phantom SKU hallucination 会触发四次 API calls，变成多系统 incident。
4. **Context loss.** 长周期任务忘记早期轮次的 constraints。
5. **Tool misuse.** 用错误 arguments 调用正确 tool，或直接调用错误 tool。

Cascading 是最致命的。Agents 无法区分“我失败了”和“任务不可能完成”，并且经常在 400 errors 上 hallucinate 出 success message 来闭环。

### Mitigation：每一步都设置 gates

在 reasoning chain 的每一步设置自动 verification gates，对照 environment state 检查 factual grounding。具体包括：

- 每步 safety classifier（Lesson 21）。
- Tool-call argument validation（Lesson 06）。
- 将 retrieved content 与 known facts 交叉检查（Lesson 05，CRITIC）。
- 通过重新探测 state 来检测 success hallucination（文件真的被创建了吗？）。

### failure monitoring 容易出错的地方

- **Tagging only crashes.** 大多数 agent failures 会产生看起来有效的 output。需要 content-level checks。
- **No baseline.** Drift detection 需要 last-known-good；没有它，你就无法判断“这正在变差”。
- **Over-alerting.** 每个 failure 都产生一次 page。应该 cluster 并 rate-limit。

## 构建它
`code/main.py` 实现了一个 stdlib failure-mode tagger：

- 一个覆盖五种模式的 synthetic trace dataset。
- 每种模式对应的 detector functions（tool calls、outputs、repeat actions 上的 signature patterns）。
- 一个 tagger，用于标注每条 trace 并报告 mode distribution。

运行它：

```
python3 code/main.py
```

输出：每条 trace 的 labels + aggregate distribution，这是对 Phoenix 的 trace clustering 所呈现内容的一种低成本复现。

## 使用它
- **Phoenix** 用于生产环境 drift clustering（Lesson 24）。
- **Langfuse** 用于 session replay + annotation。
- **Custom** 用于 observability platform 无法检测的 domain-specific signatures。

## 交付它
`outputs/skill-failure-detector.md` 生成面向你所在 domain 的 failure-mode detectors，并连接到 trace store。

## 练习
1. 添加一个 “success hallucination” detector：Agent 返回成功，但目标 state 没有变化。
2. 标注你构建过的某个产品中的 100 条真实 traces。哪种模式占主导？修复它的成本是什么？
3. 实现一个 “cascade radius” metric：给定第 N 步的 failure，它影响了多少下游步骤？
4. 阅读 MASFT 的 14 种 failure modes。选择三种适用于你产品的模式。编写 detectors。
5. 将一个 detector 接入 CI job：如果 >=5% 的 traces 被标注为某种模式，则让 build 失败。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | “Multi-agent failure taxonomy” | Berkeley 14-mode categorization |
| Cascading error | “Ripple failure” | 一个早期错误会通过 N 个步骤传播 |
| Context loss | “Forgot the constraint” | 长周期轮次丢失早期轮次事实 |
| Tool misuse | “Wrong tool / wrong args” | 调用有效，但调用方式错误 |
| Success hallucination | “Faked completion” | Agent 在 400 上声称成功；state 未变化 |
| Scope creep | “Overreach” | Agent 做了超出要求的事 |
| Instruction-following deviation | “Disobedience” | 忽略 system prompt 或用户 constraint |
| Sub-intention errors | “Plan bugs” | plan execution 中的 omission、redundancy、disorder |

## 延伸阅读
- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) — 14 种 failure modes，3 个类别
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf) — risk register
- [Arize Phoenix](https://docs.arize.com/phoenix) — 实践中的 drift clustering
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — 更简单的 patterns 何时能完全避免这些模式
