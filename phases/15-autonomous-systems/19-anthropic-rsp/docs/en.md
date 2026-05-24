# Anthropic Responsible Scaling Policy v3.0

> RSP v3.0 于 2026 年 2 月 24 日生效，取代了 2023 年政策。双层缓解措施：Anthropic 会单方面采取什么行动，以及哪些内容被表述为行业范围建议（包括 RAND SL-4 安全标准）。新增 Frontier Safety Roadmaps 和 Risk Reports，作为常设文档，而不是一次性交付物。删除了 2023 年的暂停承诺。引入 AI R&D-4 阈值：一旦越过该阈值，Anthropic 必须发布一份正面论证，识别未对齐风险和缓解措施。Claude Opus 4.6 未越过该阈值。Anthropic 在 v3.0 公告中表示，“有把握地排除这种情况正变得困难。”SaferAI 将 2023 RSP 评为 2.2；他们将 v3.0 下调至 1.9，使 Anthropic 与 OpenAI 和 DeepMind 一起进入“弱”RSP 类别。定性阈值取代了 2023 年的定量承诺；删除暂停条款是最明显的倒退。

**类型：** 学习
**语言：** Python（stdlib，RSP 阈值决策引擎）
**先修：** Phase 15 · 06（AAR），Phase 15 · 07（RSI）
**时间：** ~45 分钟

## 问题

Frontier 实验室发布的 scaling policies，一部分是技术文档，一部分是治理文档，一部分也是向监管者发出的信号。RSP v3.0 是 Anthropic 当前的文档。细读它很重要，不是因为遵守它具有约束力（并没有），而是因为这种框架会塑造实验室如何构想灾难性风险，以及他们如何向公众沟通取舍。

v3.0 与 v2.0 的差异才是有用的分析单位。新增了什么：Frontier Safety Roadmaps、Risk Reports、AI R&D-4 阈值。删除了什么：2023 年的暂停承诺。重新表述了什么：缓解措施时间表被拆成 Anthropic 单方面行动和行业建议两个层级。外部评审 — SaferAI — 将评分从 2.2（v2）下调到 1.9（v3.0）。这说明一份 scaling policy 可以看起来更精致，却变得不那么严谨。

## 概念

### 双层缓解措施时间表

- **Anthropic 单方面行动**：无论其他实验室怎么做，Anthropic 都会做什么。包括高于某个阈值时停止训练、特定安全措施、特定部署关卡。
- **行业范围建议**：Anthropic 认为行业应集体采取什么行动。包括 RAND SL-4 安全标准。这些不是 Anthropic 方面的承诺；它们是政策倡议。

v2 中没有这种双层结构。这意味着读者需要查看每项承诺位于哪一列。“行业范围建议”列中的安全措施不是 Anthropic 的承诺；它是 Anthropic 的期望。

### AI R&D-4 阈值

这是 RSP v3.0 指出的下一个重要能力阈值。具体来说：一个能够以有竞争力的成本自动化相当大一部分 AI 研究的模型。一旦 Anthropic 认为某个模型越过该阈值，他们必须在继续 scaling 之前发布一份正面论证，识别未对齐风险和缓解措施。

根据 v3.0 公告，Claude Opus 4.6 未越过该阈值。文档补充说：“有把握地排除这种情况正变得困难。”这种措辞很重要；它承认该阈值已经足够接近，成为一个现实关切，而不是一个猜测性的界限。

Lesson 6（Automated Alignment Research）和 Lesson 7（Recursive Self-Improvement）直接关联到这个阈值。自动化 alignment researchers 达到研究质量标准，是 AI R&D-4 阈值正在接近的证据。

### Frontier Safety Roadmaps 和 Risk Reports

v3.0 将两类 artifact 提升为常设文档：

- **Frontier Safety Roadmap**：面向未来的文档，描述计划中的安全工作、能力预期和缓解研究。
- **Risk Report**：发布后针对具体模型的回顾性文档，描述观察到的能力和剩余风险。

两者都是公开的。两者都按声明的节奏更新。它们的用途是：读者可以追踪 Anthropic 在 Roadmap 中说会做的事，与他们在 Risk Report 中报告的内容是否一致。

### 删除暂停条款

2023 RSP 包含明确的暂停承诺：如果模型越过特定能力阈值，训练将暂停，直到缓解措施到位。v3.0 用更软性的表述取代了明确暂停（发布正面论证，如果缓解措施足够则继续推进）。SaferAI 和其他分析人士直接指出，这是新文档中最强烈的倒退。

支持这一变化的政策论点是：2023 年的定量阈值到 2026 年的能力 benchmark 下变得不可达，因为 benchmark 本身已被重新缩放。反方论点是：scaling policy 中的暂停条款是一种承诺机制；删除它会削弱政策的可信度。

### SaferAI 的下调

SaferAI 是一个独立组织，负责评估 RSP 风格文档。他们的公开评分：2023 Anthropic RSP 得分 2.2（该量表中 4.0 代表当前最佳 RSP，1.0 为名义分）。v3.0 得分 1.9。这使 Anthropic 从“中等”降至“弱”，与 OpenAI 和 DeepMind 一同进入弱类别。

SaferAI 给出的降级因素：
- 定性阈值取代了定量阈值。
- 暂停承诺被删除。
- AI R&D-4 阈值的缓解措施被描述为“正面论证”，而不是具体措施。
- 评审机制依赖 Anthropic 的 Safety Advisory Group，独立监督有限。

### 本课不是什么

这不是一节合规课。RSP v3.0 不是法规；没有任何东西强制 Anthropic 遵守它。本课的重点是以应有的具体性和怀疑精神阅读这份文档。Scaling policies 是 frontier 实验室对灾难性风险立场发出的主要公开信号。读懂它们，是任何工作依赖 frontier capabilities 的人都需要的实用技能。

## 使用它

`code/main.py` 实现了一个小型决策引擎，映射 RSP 阈值评估的结构：给定一个候选模型和一组能力测量，返回 AI R&D-4 阈值是否被越过、所需的正面论证章节，以及部署是否可以继续。它有意保持简单；重点是把文档中的逻辑显式化。

## 交付它

`outputs/skill-scaling-policy-review.md` 根据 v3.0 参考结构审查一份 scaling policy（Anthropic、OpenAI、DeepMind 或内部政策）：双层结构、阈值、暂停承诺、独立评审。

## 练习

1. 运行 `code/main.py`。输入三个处于不同能力水平的合成模型。确认阈值评估器按预期工作，并生成正确的正面论证模板。

2. 完整阅读 RSP v3.0（32 页）。识别每一项位于“行业范围建议”层级的承诺。其中哪些承诺在 v2 中会属于“Anthropic 单方面”？

3. 阅读 SaferAI 的 RSP 评分方法。将他们的 rubric 应用于文档，复现 v3.0 的 1.9 分。哪一行 rubric 对降级影响最大？

4. 2023 年的暂停承诺被删除了。提出一个替代承诺，在承认 2026 年 benchmark 重新缩放问题的同时，保留政策的可信度。

5. 将 RSP v3.0 与 OpenAI Preparedness Framework v2（Lesson 20）进行比较。选出一个 v3.0 更强的方面。再选出一个 Preparedness Framework 更强的方面。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| RSP | “Anthropic 的 scaling policy” | Responsible Scaling Policy；v3.0 于 2026 年 2 月 24 日生效 |
| AI R&D-4 | “研究自动化阈值” | 以有竞争力的成本自动化大量 AI 研究的能力 |
| Affirmative case | “安全论证” | 公开论证风险已被识别且缓解措施足够 |
| Frontier Safety Roadmap | “前瞻计划” | 关于计划中的安全工作和预期能力的常设文档 |
| Risk Report | “模型回顾” | 关于发布后观察到的能力和剩余风险的常设文档 |
| Two-tier mitigation | “单方面 vs 行业” | 区分 Anthropic 承诺与行业建议 |
| Pause commitment | “2023 条款” | 明确承诺暂停训练；已在 v3.0 中删除 |
| SaferAI rating | “独立 RSP 评分” | 第三方 rubric；v3.0 得分 1.9（v2 为 2.2） |

## 延伸阅读

- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — 完整的 32 页政策。
- [Anthropic — RSP v3.0 announcement](https://www.anthropic.com/news/responsible-scaling-policy-v3) — v2 以来变化的摘要。
- [Anthropic — Frontier Safety Roadmap](https://www.anthropic.com/research/frontier-safety) — RSP v3.0 链接的常设文档。
- [Anthropic — Risk Report: Claude Opus 4.6](https://www.anthropic.com/research/risk-report-claude-opus-4-6) — 关于当前 frontier model 的回顾。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — 将 AI R&D-4 与测得的自主性连接起来。
