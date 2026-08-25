# 前沿安全框架 — RSP, PF, FSF

> 三个主要实验室框架定义了 2026 年行业对 frontier capability 的治理。Anthropic Responsible Scaling Policy v3.0（2026 年 2 月）引入了分层的 AI Safety Levels（ASL-1 到 ASL-5+），仿照生物安全等级；其中 ASL-3 于 2025 年 5 月针对 CBRN 相关模型启动。OpenAI Preparedness Framework v2（2025 年 4 月）为被追踪能力定义了五项标准，并将 Capabilities Reports 与 Safeguards Reports 分离。DeepMind Frontier Safety Framework v3.0（2025 年 9 月）引入了 Critical Capability Levels，包括新的 Harmful Manipulation CCL。三者现在都包含 competitor-adjustment clauses：如果同业实验室在没有可比 safeguards 的情况下发布，则允许推迟要求。跨实验室 alignment 仍然是结构性的，而不是术语性的："Capability Thresholds," "High Capability thresholds," 和 "Critical Capability Levels" 表示类似的构造。

**Type:** Learn
**Languages:** none
**Prerequisites:** Phase 18 · 17 (WMDP), Phase 18 · 07-09 (deception failures)
**Time:** ~75 分钟

## 学习目标
- 描述 Anthropic 的 ASL 分层结构，以及是什么启动了 ASL-3。
- 说出 OpenAI Preparedness Framework v2 中被追踪能力的五项标准。
- 描述 DeepMind 的 Critical Capability Level 结构和 Harmful Manipulation CCL。
- 解释 competitor-adjustment clauses，以及它们为什么会影响竞赛动态。
- 定义 safety case，并描述三支柱结构（monitoring, illegibility, incapability）。

## 问题
第 7-17 课已经说明：deception 是可能的，dual-use capability 存在，evaluation 也有局限。拥有 frontier-capable model 的实验室需要一种内部治理结构，用来：
- 定义何时需要新的 safeguards 的阈值。
- 定义 scaling 前所需的 evaluations。
- 描述 safety case 应该是什么样。
- 处理竞赛动态问题（如果竞争对手在没有 safeguards 的情况下发布，你该怎么办？）。

2025-2026 年的这三个框架代表了当前最先进实践：它们并不完美，仍在演进，并且各实验室之间已经足够一致，使得治理问题现在变成了这些框架是否足够，而不是它们是否存在。

## 概念
### Anthropic Responsible Scaling Policy v3.0（2026 年 2 月）

ASL 结构：
- ASL-1：不是 frontier model（被弱于 frontier 的 baseline 覆盖）。
- ASL-2：当前 frontier baseline；使用常规 safeguards 部署。
- ASL-3：灾难性误用风险显著更高；CBRN 相关能力。于 2025 年 5 月启动。
- ASL-4：AI R&D-2 crossing threshold；可以自动化入门级 AI research 的模型。
- ASL-5+：advanced AI R&D；能够显著加速有效 scaling 的模型。

v3.0 中的新内容：
- Frontier Safety Roadmaps（以删减形式公开）。
- Risk Reports（季度发布，部分经过外部审查）。
- AI R&D 被拆分为 AI R&D-2 和 AI R&D-4。
- 一旦跨过 AI R&D-4，就需要一份肯定性的 safety case，识别模型追求 misaligned goals 所带来的 misalignment risks。

### OpenAI Preparedness Framework v2（2025 年 4 月 15 日）

被追踪能力的五项标准：
- **Plausible.** 存在合理的 threat model。
- **Measurable.** 可以进行经验性 evaluation。
- **Severe.** 危害很大。
- **Net-new.** 不是已有风险的放大。
- **Instantaneous-or-irremediable.** 危害发生很快，或无法撤销。

满足全部五项的能力会被追踪。其他能力不会。

PF v2 的其他结构：
- 将 Capabilities Reports（模型能做什么）与 Safeguards Reports（有哪些控制措施）分离。
- Safety Advisory Group 进行审查。
- Leadership 批准；Board 的 Safety & Security Committee 监督。
- "Adjustment clause"：如果另一个实验室在没有可比 safeguards 的情况下发布，OpenAI 可以降低要求。

### DeepMind Frontier Safety Framework v3.0（2025 年 9 月）

按领域划分的 Critical Capability Levels（CCLs）：
- Bioweapon Uplift
- Cyber Uplift
- ML R&D Acceleration
- Harmful Manipulation（v3.0 新增）：可能在高风险情境中显著改变信念/行为的模型。

v2.0（2025 年 2 月）增加了 Deceptive Alignment 部分，并为 ML R&D CCLs 增加了更高的安全等级。

### Cross-lab alignment

- Anthropic "Capability Thresholds."
- DeepMind "Critical Capability Levels."
- OpenAI "High Capability thresholds."

没有行业标准术语。结构上是一致的：三层 frontier capability，并配有公开的 evaluation criteria。三者都包含 competitor-adjustment clauses（自 2025 年起）。

### Safety cases

Safety case 是一种书面论证，用来说明在 worst-case assumptions 下某项部署是可接受地安全的。标准结构针对三根支柱：

- **Monitoring.** 如果发生不良行为，我们能检测到吗？
- **Illegibility.** 模型是否缺乏执行一致计划以造成伤害的能力？
- **Incapability.** 模型是否缺乏造成相关伤害的能力？

不同 safety cases 针对不同支柱。对于 ASL-3 CBRN case，incapability（通过 unlearning）是主要目标。对于 deceptive alignment，monitoring 和 illegibility 是目标。对于 cyber uplift，三者都相关。

### The race-dynamic problem

Competitor-adjustment clauses 具有争议。批评者认为它们会制造逐底竞争：如果三个实验室都会在竞争对手背离时降低要求，均衡就会转向背离。支持者认为，如果背离的实验室更不重视安全，那么另一种选择（单边 safeguards）会产生更糟糕的结果。

UK AISI、US CAISI 和 EU AI Office（第 24 课）是外部治理对应方。实验室框架是自愿性的；监管框架正在形成。

### 它在 Phase 18 中的位置

第 17-18 课是在 deception 和 red-team 分析之上的 measurement-and-governance 层。第 19-24 课覆盖 welfare、bias、privacy、watermarking 和监管结构。第 28 课绘制研究生态图谱（MATS, Redwood, Apollo, METR），这些组织将 evaluations 落地执行。

```figure
al-asl-ladder
```

## 使用它
本课没有代码。阅读三个主要来源：RSP v3.0、PF v2、FSF v3.0。将每个实验室的分层结构映射到其他实验室，并各自找出一个该实验室定义但其他实验室未定义的 threshold。

## 交付它
本课产出 `outputs/skill-framework-diff.md`。给定一个安全框架或 release note，它会将该框架的 threshold definitions、所需 evaluations 和 safety-case structure 与 RSP v3.0、PF v2、FSF v3.0 进行比较，并标出跨实验室差距。

## 练习
1. 阅读 RSP v3.0、PF v2 和 FSF v3.0。整理一张表，列出每个实验室的 CBRN threshold、各自的 AI R&D threshold，以及各自所需的 pre-deployment evaluation。

2. 三个框架（2025+）都包含 competitor-adjustment clause。写一段支持它的论证；再写一段反对它的论证。指出每种立场所依赖的假设。

3. 为一个跨过 Anthropic AI R&D-4 threshold 的模型设计 safety case。说出三根支柱（monitoring, illegibility, incapability）各自需要的证据。

4. DeepMind 的 FSF v3.0 引入了 Harmful Manipulation CCL。提出三项经验性测量，用来表明模型已经跨过该 threshold。

5. 阅读 METR 的 "Common Elements of Frontier AI Safety Policies"（2025）。说出三个最强的跨实验室趋同点，以及两个最大的分歧点。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| RSP | "Anthropic's framework" | Responsible Scaling Policy；ASL tiers；v3.0 2026 年 2 月 |
| PF | "OpenAI's framework" | Preparedness Framework；五项标准；v2 2025 年 4 月 |
| FSF | "DeepMind's framework" | Frontier Safety Framework；CCLs；v3.0 2025 年 9 月 |
| ASL-3 | "biosafety level 3-analog" | Anthropic 针对 CBRN 相关能力的层级；于 2025 年 5 月启动 |
| CCL | "critical capability level" | DeepMind 的 threshold construct；按领域划分 |
| Safety case | "the formal argument" | 书面论证，说明在 worst-case U 下部署是可接受地安全的 |
| Adjustment clause | "competitor defection allowance" | 如果竞争对手在没有可比 safeguards 的情况下发布，框架中允许降低要求的条款 |

## 延伸阅读
- [Anthropic — Responsible Scaling Policy v3.0（2026 年 2 月）](https://www.anthropic.com/responsible-scaling-policy) — ASL 层级、roadmaps、AI R&D 解耦
- [OpenAI — Updating the Preparedness Framework (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) — 五项标准，调整条款
- [DeepMind — Strengthening our Frontier Safety Framework (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — CCL v3.0，Harmful Manipulation
- [METR — Common Elements of Frontier AI Safety Policies (2025)](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) — cross-lab comparison
