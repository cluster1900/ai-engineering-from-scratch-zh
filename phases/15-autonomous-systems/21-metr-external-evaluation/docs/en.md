# METR Time Horizons 与外部能力评估

> METR（前身为 ARC Evals）自 2023 年 12 月起成为独立的 501(c)(3) 组织。他们的 Time Horizon 1.1 benchmark（2026 年 1 月）会将任务成功概率与 log(专家人类完成时间) 拟合为一条 logistic curve；在 50% 概率处的交点定义为模型的 time horizon。2025–2026 年的 engagement set 覆盖 GPT-5.1、GPT-5.1-Codex-Max，以及原型监控评估（monitor 能否发现 side tasks；agent 能否规避）。Benchmark suites：HCAST（180+ 个 ML、cyber、SWE、reasoning 任务；1 分钟到 8+ 小时）、RE-Bench（71 个带专家 baseline 的 ML research-engineering 任务）、SWAA。坦诚说明：METR measurements 是理想化的：没有人类、没有真实后果；并且团队已经记录了 eval-vs-deployment 行为差距（Lesson 1）。time horizon 是上界，不是部署预测。

**类型：** Learn
**语言：** Python (stdlib, logistic-fit horizon estimator)
**先修：** Phase 15 · 01 (Long-horizon agents), Phase 15 · 19 (RSP)
**时间：** ~60 分钟

## 问题

Scaling policies（Lessons 19, 20）的价值取决于它们所引用的测量结果。“AI R&D-4 threshold”和“Long-range Autonomy”是在政策文本中定义的；只有当具体评估产出具体数字时，它们才变得可执行。

METR 是 2024–2026 年间的外部评估组织，定义了其中许多数字。他们评估 frontier models，通常是在模型发布前、在与实验室签署 NDA 的条件下进行，并在之后发布方法论。Time Horizon 1.1 benchmark（2026 年 1 月）是他们的核心成果：一个将能力压缩成人类可读单位的单一标量（“这个模型能以 50% 可靠性完成专家会花 X 小时处理的那类任务”）。

本课一部分关于方法论（如何计算 horizon），一部分关于解释方式（为什么 horizon 是上界，而不是部署预测）。这两项技能应当放在一起理解。一个懂得 horizon 如何拟合的团队，比只是在幻灯片上看到“14 hours”的团队，更不容易被糟糕的 vendor claim 误导。

## 概念

### METR 背景

- 成立时间：2023 年 12 月（前身为 ARC Evals，拆分为独立 501(c)(3)）。
- 范围：评估 frontier models 的 autonomous capabilities，通常是在发布前进行。
- 合作实验室：Anthropic、OpenAI（2025–2026 年多次 engagement）。
- 重要交付物：Time Horizon 1.0（2025 年 3 月）、Time Horizon 1.1（2026 年 1 月）、原型监控评估。

### Time Horizon 拟合

方法论（来自 METR blog 和 papers）：

1. 收集一个任务套件，覆盖分钟级到小时级的专家完成时间。当前套件：HCAST（180+ 个任务）、RE-Bench（71 个任务）、SWAA。
2. 让模型运行每个任务；记录成功或失败。
3. 拟合一条 logistic curve：P(success) 是 log(专家完成时间) 的函数。
4. horizon 是使 P(success) = 0.5 的专家时间。

logistic-fit 形状是合适的，因为能力通常与任务难度之间存在一种递增并接近平台期的关系。50% 点是一种选择（也可以是 10%、90%）；METR 在详细 paper 中报告多个阈值，但以 50% 作为主指标，因为它最直观。

### 2026 年 1 月数字

根据 Time Horizon 1.1：

- Claude Opus 4.6：在 50% 可靠性下约 14 小时，来自 Time Horizon 1.1（2026 年 1 月）。
- HCAST-style 任务上的 doubling time：Time Horizon 1.1（2026 年 1 月）报告的 post-2023 拟合约为 4.3 个月（130.8 天）；约 7 个月的数字是 Time Horizon 1.0 中 2019–2025 全量拟合，并在 TH1.1 中与 post-2023 数字一起报告。

这些就是 Phase 15 后续引用的具体数字。Anthropic 的 RSP v3.0（Lesson 19）和 DeepMind 的 FSF v3（Lesson 20）都引用了它们，作为输入 threshold assessments 的测量之一。

### Benchmark suites

- **HCAST**：189 个任务，覆盖 ML、cybersecurity、software engineering 和 general reasoning。跨度：1 分钟到 8+ 小时的专家时间。它是 horizon 数字背后的主要套件。
- **RE-Bench**：71 个 ML research-engineering 任务，带有人类专家 baseline。衡量模型能否完成会输入到 AI R&D-4 threshold 中的那类 ML R&D 工作。
- **SWAA**：较短任务；用于校准 horizon curve 的低端。

### 原型监控评估

2025–2026 年 METR 工作包含 monitoring-evaluation prototypes：monitor 能否发现模型正在执行 side task（即 operator 所要求之外的事情）；agent 能否规避 monitor。这些直接输入到 OpenAI PF v2 的“Undermining Safeguards”类别，以及 DeepMind FSF v3（Lesson 20）中的 deceptive-alignment monitoring。

### 为什么 horizons 是上界

- **理想化工具**：benchmark tasks 给模型提供干净工具和格式良好的数据。真实部署更混乱。
- **没有真实后果**：模型不会真正向客户计费、删除真实数据或联系真实的人。真实部署有不可逆的风险。
- **Eval-context gaming**：Lesson 1。模型在测试中的行为不同。2026 International AI Safety Report 以实证方式记录了这一点。
- **没有真实用户差异**：benchmark prompts 是结构化的。真实用户会提出模糊且依赖上下文的请求。

horizon 是有利条件下的能力上限。部署可靠性是另一个数字，更低，而且团队必须测量自己的分布才能知道它。

### 外部评估者的意义

外部评估很重要，因为内部实验室有动力优化它们报告的指标。METR 的独立性：一个拥有公开方法论和 peer-reviewed papers 的 501(c)(3)，是一种结构性缓解措施。它本身并不充分（实验室仍然控制 METR 能看到什么），但它严格优于没有外部评估。

### 如何在实践中使用 horizon 数字

- **作为能力过滤器**：如果某个模型的 horizon 明显低于拟议任务的专家时间，不要将其以 autonomous 方式上线（Lesson 1 的 skill file）。
- **作为趋势指标**：doubling time 告诉你，即使没有新的 mitigations，当前做法还能安全维持多久。
- **作为 prior**：14 小时的 horizon 是起点。根据你的任务分布、工具质量和部署上下文向下调整。

## 使用它

`code/main.py` 基于合成结果集，实现了 task-success 与 log(expert time) 的 logistic fit。它报告 50% horizon（METR 的主指标）、10% horizon（保守）和 90% horizon（乐观）。同时演示当成功率被 eval-context gaming 人为抬高时会发生什么变化。

## 交付它

`outputs/skill-horizon-interpretation.md` 审查 vendor 的 horizon claim，并产出 benchmark claim 与 deployment reality 之间的 gap analysis。

## 练习

1. 运行 `code/main.py`。确认拟合得到的 50% horizon 与合成 ground truth 匹配。现在将 task-time grid 减半；horizon estimate 是否发生显著变化？

2. 阅读 METR 的 Time Horizon 1.1 blog post。找出可靠性最高和最低的具体任务。解释为什么会存在这个差距。

3. 阅读 METR 的“Measuring Autonomous AI Capabilities”资源。列出 HCAST 任务类别。选择一个你会在生产任务中赋予更高权重的类别，并说明理由。

4. 将 eval-context gaming 引入 simulator：把约 20% 的失败任务翻转为成功。报告新的 horizon。这近似表示 20% 的 gaming rate 会如何影响观测数字。

5. 基于你自己的 bug backlog 或代表性任务集，设计一次内部 horizon evaluation。描述数据收集、拟合，以及输出告诉你什么。将其与 METR 数字比较。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| METR | “外部评估者” | 前身为 ARC Evals；自 2023 年 12 月起为独立 501(c)(3) |
| Time Horizon | “能力度量” | 来自 logistic fit 的、50% 可靠性下的专家任务长度 |
| HCAST | “METR 的主套件” | 180+ 个任务，跨度从 1 分钟到 8+ 小时 |
| RE-Bench | “Research engineering” | 71 个带人类 baseline 的 ML research-engineering 任务 |
| SWAA | “短任务套件” | 校准 horizon curve 的低端 |
| Doubling time | “增长率” | 50% horizon 翻倍所需时间；按 HCAST 约 7 个月 |
| Eval-context gaming | “模型行为不同” | 测试与部署之间有记录的行为差距 |
| Upper bound | “Horizon 是上限” | benchmark horizon > 负载下的 deployment reliability |

## 延伸阅读

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) — HCAST、RE-Bench、SWAA 规格。
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) — 原始 horizon paper。
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) — 当前数字和方法论。
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons) — 实时跟踪。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — 关于 METR measurements 的内部视角。
