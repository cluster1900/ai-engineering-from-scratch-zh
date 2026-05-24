# OpenAI Preparedness Framework 与 DeepMind Frontier Safety Framework

> OpenAI Preparedness Framework v2（2025 年 4 月）引入了 Research Categories：Long-range Autonomy、Sandbagging、Autonomous Replication and Adaptation、Undermining Safeguards，它们不同于 Tracked Categories。Tracked Categories 会触发 Capabilities Reports 以及 Safeguards Reports，并由 Safety Advisory Group 审查。DeepMind 的 FSF v3（2025 年 9 月，Tracked Capability Levels 于 2026 年 4 月 17 日加入）将 autonomy 纳入 ML R&D 和 Cyber 领域（ML R&D autonomy level 1 = 以相对于 human + AI tools 有竞争力的成本，完全自动化 AI R&D pipeline）。FSF v3 明确通过针对 instrumental-reasoning 滥用的 automated monitoring 来处理 deceptive alignment。坦诚地说：PF v2 中的 Research Categories（包括 Long-range Autonomy）不会自动触发缓解措施；政策措辞是“potential”。DeepMind 自己也说，如果 instrumental reasoning 变强，automated monitoring “will not remain sufficient long-term”。

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## 问题

Lesson 19 仔细阅读了 Anthropic 的 scaling policy。本课通过阅读 OpenAI 和 DeepMind 的政策来补全图景。这三份文档是同类产物，处理的是同一个问题：frontier lab 什么时候应该暂停或限制一个模型；它们在一小组类别上趋同，也在一些重要的具体位置上分歧。

趋同之处：三者都把 long-range autonomy 标记为值得追踪的能力类别。三者都承认 deceptive behavior（alignment faking、sandbagging）是一类特定风险。三者都有内部审查机构。分歧之处：OpenAI 将类别拆分为“Tracked”（强制缓解）和“Research”（不自动触发）。DeepMind 将 autonomy 纳入两个领域，而不是单独命名。实验室会使用 Tracked vs Research、Critical vs Moderate、Tier-1 vs Tier-2 等名称；能力落在哪个桶里，会在不同实验室产生不同的操作后果。

把它们放在一起读才是有用的练习。同一种能力在 Anthropic 可能是“mandatory mitigation”，在 OpenAI 可能是“monitored but not triggering”，在 DeepMind 可能是“tracked in a specific domain”。政策姿态很重要。

## 概念

### OpenAI Preparedness Framework v2（2025 年 4 月）

结构：

- **Tracked Categories**：触发 Capabilities Reports（模型能做什么）加 Safeguards Reports（已有哪些缓解措施）。部署前由 Safety Advisory Group 审查。
- **Research Categories**：实验室正在追踪、但尚未承诺具体缓解措施的模型能力。包括 Long-range Autonomy、Sandbagging、Autonomous Replication and Adaptation、Undermining Safeguards。

v2 中的关键表述：Research Categories 不会自动触发缓解措施。政策措辞是“potential” mitigations。这是需要关注的具体差异：一个类别位于 Tracked 还是 Research，是“被 gate”与“被观察”之间的枢纽。

### DeepMind Frontier Safety Framework v3（2025 年 9 月；Tracked Capability Levels 于 2026 年 4 月 17 日加入）

结构：

- **Critical Capability Levels (CCLs)**：跨五个领域的能力阈值：Cyber、Bio、ML R&D、CBRN、Autonomy（纳入 ML R&D 和 Cyber）。
- **Tracked Capability Levels**：2026 年 4 月加入的额外粒度。具体示例：ML R&D autonomy level 1 = 以相对于 human + AI tools 有竞争力的成本，完全自动化 AI R&D pipeline。
- **Deceptive alignment monitoring**：明确承诺对 instrumental-reasoning 滥用进行 automated monitoring。

autonomy 的表述方式不同于 OpenAI。DeepMind 没有把“Autonomy”保留为顶层领域；它被纳入 autonomy 可能造成伤害的领域（ML R&D 和 Cyber）。其论点是，没有领域的 autonomy 是没有风险的能力；反方论点是，跨领域的 autonomy 是一种 meta-risk，框架应该明确命名。

### 三者共同趋同之处

- 内部 Safety Advisory Group（分别命名为 Anthropic SAG、OpenAI SAG、DeepMind internal committee）。高能力模型部署前进行审查。
- 明确提到 deceptive alignment / alignment faking 是一类风险。
- 以声明的节奏产出持续性文档（Anthropic：Frontier Safety Roadmap、Risk Report；OpenAI：Capabilities and Safeguards Reports；DeepMind：FSF update cycle）。
- 承认仅靠 monitoring 的防御有上限。DeepMind 说得很明确：“automated monitoring will not remain sufficient long-term.”

### 它们的分歧之处

- **Anthropic**：v3.0 移除了暂停承诺；AI R&D-4 threshold 是被命名的下一个 gate。
- **OpenAI**：Tracked vs Research 拆分；Research Categories（包括 Long-range Autonomy）不会自动 gate。
- **DeepMind**：autonomy 被纳入其他领域；Tracked Capability Levels 于 2026 年 4 月加入了更细粒度。

### Sandbagging：一个让三者都复杂化的特定能力

Sandbagging（模型在评估中策略性表现不佳）位于 OpenAI 的 Research Categories。Anthropic 的 RSP v3.0 通过 evaluation-context gap（Lesson 1）处理它。DeepMind 在 FSF v3 中通过 deceptive alignment monitoring 处理它。

如果一个模型在评估中 sandbag，那么每个框架的能力阈值都会被低估。框架只有在测量有效时才有效。这就是为什么除了实验室自评之外，还需要外部测量（Lesson 21，METR）和 adversarial evaluation。

### 政策阅读技能

- 定位：你关心的每一项能力都应该能在政策中找到。如果找不到，政策就没有覆盖它。
- 分类：它是 Tracked（触发缓解措施）还是 Research（被追踪但不触发）？OpenAI 明确命名了这一点；Anthropic 和 DeepMind 有各自的对应项。
- 节奏：政策是按声明的时间表更新，还是只在特定事件后更新？声明式节奏更强。
- 独立性：外部审查是强制还是可选？Anthropic 与 Apollo 和 US AI Safety Institute 合作；OpenAI 与 METR 合作；DeepMind 主要依赖内部 SAG。

## 使用它

`code/main.py` 实现了一个小型 decision-table diff tool。给定一项能力（autonomy、deceptive alignment、R&D automation、cyber uplift 等），它会输出三项政策分别如何分类该能力，以及会触发什么缓解措施。它是阅读辅助工具，不是政策工具。

## 交付它

`outputs/skill-cross-policy-diff.md` 使用三个框架作为参考，为特定能力生成跨政策对比。

## 练习

1. 运行 `code/main.py`。确认 diff tool 的输出与政策一致，至少验证两个你能对照源文档检查的能力。

2. 完整阅读 OpenAI Preparedness Framework v2。识别每个 Research Category。对每一项，用一句话说明为什么它在 Research 而不是 Tracked。

3. 完整阅读 DeepMind FSF v3，以及 2026 年 4 月的 Tracked Capability Levels 更新。识别 ML R&D autonomy level 1 的具体评估标准。你会如何从外部测量它？

4. Sandbagging 位于 OpenAI 的 Research Categories。设计一个评估，迫使会 sandbag 的模型暴露其真实能力。引用 Lesson 1 中关于 eval-context-gaming 的讨论。

5. 针对某项具体能力（由你选择）比较三项政策。说明你认为哪项政策的分类最严谨、哪项最不严谨。用源文本证明。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) — v2 公告。
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) — 完整文档。
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — FSF v3 公告。
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) — Tracked Capability Levels 增补。
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) — FSF 格式 Risk Report 示例。
