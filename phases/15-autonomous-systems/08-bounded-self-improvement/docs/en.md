# Bounded Self-Improvement 设计

> 研究已经收敛到四个用于约束 self-improvement loop 的 primitives。formal invariants 必须在每一次编辑前后都成立。alignment anchors 不可被修改。multi-objective constraints 要求每个维度（safety、fairness、robustness）都必须成立，而不只是 performance。regression detection 会在历史 metrics 显示 capability loss 时暂停 loop。它们都不是 safety 的证明——信息论结果（Kolmogorov complexity、Lob's theorem）限制了任何系统能够证明其自身后继系统性质的范围。它们是 mitigation，用来提高 silent failure 的成本。

**Type:** Learn
**语言：** Python (stdlib, bounded-loop with invariant check)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

Lesson 7 的 race simulator 表明，微小的速率差异会复合成巨大差距。Lesson 4 的 DGM case study 表明，loop 可以主动操纵自己的 evaluators。这两个结果都指向同一个工程问题：你能对 self-improvement loop 施加什么 constraints，使这些 constraints 不能被 loop 自身静默削弱？

ICLR 2026 RSI Workshop summary (openreview.net/pdf?id=OsPQ6zTQXV) 识别了四个这样的 primitives。Anthropic 的 RSP v3.0（Lesson 19）和 DeepMind 的 FSF v3（Lesson 20）都在 capability thresholds 中引用了它们。Meta HyperAgents 工作以及 SAHOO（2026 年 3 月）这类社区 frameworks 在 production 中实现了其中一部分。

诚实的表述是：这些是 mitigations。信息论结果限制了任何系统能够证明其自身后继系统性质的范围，而且当前没有任何设计从形式上关闭了这个问题。一个被良好约束的 loop 比无约束的 loop 更安全，但并非绝对安全。

## 概念

### Primitive 1: formal invariants

invariant 是一种必须在每次 self-modification 前后都成立的属性。示例：

- Output distribution 以固定的 constitution header 为条件（Lesson 17）。
- 没有 tool call 指向未授权的 endpoint。
- Memory writes 通过已记录、已签名的路径。
- evaluator 的 module hash 与批准版本匹配。

invariants 由 loop 无法编辑的外部代码检查。如果某个 proposed modification 违反 invariant，就会被拒绝。这会捕捉 DGM 风格的 evaluator-tampering 模式（Lesson 4）。

难点在于选择既对 safety 必要、又能在合理时间内计算的 invariants。过度指定会阻碍进展；指定不足会让 loop 越过重要属性。

### Primitive 2: alignment anchors

alignment anchor 是 loop 核心目标的不可变表示，被固定在 loop 的 edit surface 之外。示例：

- 每次 invocation 都从 read-only 位置加载的 constitutional text（Lesson 17）。
- 位于独立 repository、具备独立 access control 的 evaluator。
- 由 human 签名并在每个 cycle 重新验证的 tool-permission manifest。

anchor 的作用是防止 objective drift。loop 可以改进自己追求目标的方式，但不能编辑目标本身。

微妙的 failure mode：即使 loop 不能编辑 anchor，已经在读取 anchor 方式上发生漂移的 loop 仍然可以重新解释它。Constitutional AI（Lesson 17）明确是 reason-based，用来处理新情境；interpretation drift 就存在于这个 reasoning layer 中。anchors 是必要条件，但不是充分条件。

### Primitive 3: multi-objective constraints

只优化单一 scalar score 的 loop 会找到 shortcuts。必须同时满足多个 hard constraints 的 loop 可用的 shortcuts 更少。典型 axes：

- Performance（task-level benchmark）
- Safety（red-team evaluations、known-bad 上的 refusal rate）
- Fairness（sensitive subgroups 上的 disparate-impact bounds）
- Robustness（OOD test sets、adversarial input handling）

只有当每个 constraint 都成立时，modification 才会被接受。Lesson 13 的 cost governor 会把它与 financial constraints 叠加。Lesson 18 的 Llama Guard 会作为 safety axis 接入。

### Primitive 4: regression detection

每个 cycle 的 scores 会与历史 distributions 比较。超过配置 tolerance 的下降会暂停 loop。这能捕捉 silent capability loss，否则它会在 loop “改进越过”它时被吸收到 running average 中。

一个实用实现：存储最近 N 个 cycles 的 per-task scores。每个新 cycle 计算 per-task delta。如果任意 delta 低于 threshold，则拒绝该 cycle 并交由 human review。

### 信息论限制

Kolmogorov complexity 和 Lob's theorem 对系统能够证明自身性质的范围设置了上界。Schmidhuber 的 formal Godel Machine（Lesson 4）瞄准的是这类最高边界；目前还没有人完成非平凡证明。Lob 的结果表明：如果一个系统可证明地相信“如果我证明我应该做 X，我就会做 X”，它就会在没有证明自己应该做 X 的情况下做 X，这是一个著名的 self-reference failure。

这对我们的 primitives 的含义是：它们无法关闭 safety problem。它们会让 silent failure 变得更昂贵。一个 malicious 或 drifted loop 如果原本会悄悄绕过缺失的检查，现在必须主动破坏一个显式检查，而这是一种更容易检测到的 signature。

### 一个 worked example

假设某个 agent 提出一次 edit。gating stack：

1. Invariant checks：module hashes、tool-permission manifest、constitutional header。
2. Anchor check：objective statement 与批准版本匹配（byte-wise 或 semantically）。
3. Multi-objective evaluation：performance、safety、fairness、robustness axes。
4. Regression detection：没有任何 axis 的下降超过 tolerance。

四者都必须通过，edit 才能落地。任何单个 failure 都会暂停 loop。

```figure
bounded-gates
```

## 使用它

`code/main.py` 在 Lesson 4 的 DGM 风格 toy 上运行一个 bounded self-improvement loop，但在其上叠加了这四个 primitives。每个 primitive 都可以单独启用或禁用。演示目标是：每个 primitive 都能捕捉一个特定 failure class，而移除其中任何一个都会让对应 failure class 通过。

## 交付它

`outputs/skill-bounded-loop-review.md` 会审计一个 proposed bounded loop，并评分它实际实现了四个 primitives 中的哪些，而不是只看它声称实现了哪些。

## 练习

1. 在所有 primitives 都启用的情况下运行 `code/main.py`。确认 loop 仍然能在 primary metric 上改进，同时不让 hack 获胜。

2. 禁用 regression detection。构造一个 input，使它导致 silent capability loss 被接受。

3. 禁用 multi-objective constraint。展示 loop 在 performance axis 上收敛，同时 safety axis 下降。

4. 为 coding agent 设计一个 alignment anchor。什么文本、存储在哪里、如何检查？

5. 阅读 ICLR 2026 RSI Workshop summary。选择四个 primitives 中的一个，并为当前 state of the art 提出一个具体改进。

## 关键术语

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Invariant | “始终为真的属性” | 每次 edit 前后由外部代码检查的属性 |
| Alignment anchor | “固定的目标” | 位于 loop edit surface 之外的不可变 core-goal representation |
| Multi-objective constraint | “所有 axes 都必须成立” | Performance、safety、fairness、robustness——全部必需 |
| Regression detection | “下降时暂停” | 当历史 metric deltas 暗示 capability loss 时暂停 loop |
| Kolmogorov bound | “信息论限制” | 限制系统能够证明其自身后继系统性质的范围 |
| Lob's theorem | “self-reference 陷阱” | 系统可以在没有证明自己应该做某事的情况下，依据“我应该”采取行动 |
| Gate stack | “分层检查” | 多个 primitives 的组合；任何 failure 都会拒绝 edit |
| Bounded improvement | “mitigation，而不是 proof” | 提高 silent-failure 成本；不会关闭 safety problem |

## 延伸阅读

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV) — 四个 primitives 的收敛。
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — multi-objective capability thresholds。
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — 将 deceptive-alignment monitoring 作为 invariant primitive。
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html) — 这些 primitives 的 formal-proof 祖先。
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — reason-based alignment anchor。
