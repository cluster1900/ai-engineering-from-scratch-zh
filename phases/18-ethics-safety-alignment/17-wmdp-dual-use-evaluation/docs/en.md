# WMDP 与双用途能力评估

> Li et al., "The WMDP Benchmark: Measuring and Reducing Malicious Use With Unlearning" (ICML 2024, arXiv:2403.03218)。涵盖 biosecurity (1,520)、cybersecurity (2,225) 和 chemistry (412) 的 4,157 道多项选择题。问题位于 "yellow zone" —— 接近可促成危害的知识，经过多位专家审查和 ITAR/EAR 法律合规筛选。双重用途：作为双用途能力的代理评估，以及 unlearning benchmark（配套的 RMU 方法在保留通用能力的同时降低 WMDP 表现）。2024-2025 领域叙事：OpenAI/Anthropic 早期 2024 评估报告称，相比 internet search 有 "轻微 uplift"；到 2025 年 4 月，OpenAI 的 Preparedness Framework v2 称模型 "处于有意义地帮助新手制造已知生物威胁的临界点"。Anthropic 的生物武器获取试验显示 2.53x uplift，不足以排除 ASL-3。

**类型：** 学习
**语言：** Python (stdlib, WMDP-shaped uplift evaluation harness)
**先修要求：** Phase 18 · 16 (red-team tooling), Phase 14 (agent engineering)
**时间：** ~60 分钟

## 学习目标

- 描述 WMDP 的三个领域、问题数量，以及 "yellow zone" 筛选标准。
- 解释 RMU，以及为什么 WMDP 既是评估也是 unlearning benchmark。
- 描述 2024-2025 的 uplift 叙事："轻微 uplift" -> "处于临界点" -> "不足以排除 ASL-3"。
- 区分相对于新手的 uplift 和专家绝对能力。

## 问题

双用途能力是每个实验室前沿安全框架（Lesson 18）下的测量问题。问题是：模型 X 是否实质性提升了新手在 bio、chem 或 cyber 领域造成大规模伤害的能力？直接测量（要求模型实际产生伤害）既违法又不道德。代理测量需要一个模型不能拒答的 benchmark（以产生真实的能力数字），但其中的问题本身又不能成为有害出版物。

## 概念

### "yellow zone"

这些问题要求具备关于有害流程的接近性、促成性知识，但不是直接合成配方。"什么 reagent 催化 [published pathway] 的第 4 步？" 而不是 "我如何制造 [dangerous compound]？" 每个问题都由多位领域专家审查，并经过 ITAR/EAR 出口管制合规筛选。

总计 4,157 道问题：
- Biosecurity: 1,520
- Cybersecurity: 2,225
- Chemistry: 412

多项选择格式。模型并未被要求协助任何事情；因此可以在不引出有害行为的情况下测量能力。

### RMU — Representation Misdirection for Unlearning

配套的 unlearning 方法。应用于 LLaMa-2-7B 后，它将 WMDP 分数降至接近随机，同时将 MMLU 和其他通用能力 benchmark 保持在几个百分点以内。已发表的方法是随后每篇 bio-chem-cyber unlearning 论文的 unlearning baseline。

### 2024-2025 uplift 叙事

三个阶段：

1. **2024 "轻微 uplift"。** OpenAI 和 Anthropic 早期 Preparedness/RSP 评估报告称，对于尝试 bio-adjacent 任务的新手，模型相较 internet search 有小幅优势。公开表述是：frontier models 有帮助，但并不比 Google 多很多。

2. **2025 年 4 月 "处于临界点"。** OpenAI 的 Preparedness Framework v2 报告称，模型 "处于有意义地帮助新手制造已知生物威胁的临界点"。这不是能力声明，而是警告临界点已经接近。

3. **Anthropic 的 2025 生物武器获取试验。** 一项包含新手参与者的受控研究，测量获取阶段任务的相对成功率。报告为 2.53x uplift。不足以排除 ASL-3（Lesson 18）—— Anthropic Responsible Scaling Policy tier 3 的阈值已达到或接近达到。

### 相对于新手 vs 专家绝对

一个关键区别：

- **相对于新手的 uplift。** 模型对非专家有多大帮助？这是乘法量。相对优势很高，因为新手知道得很少；即使适度的信息也有帮助。
- **专家绝对能力。** 模型在最大努力下能产生多少信息？专家可以比新手提取更多信息。绝对上限很高。

安全案例（Lesson 18）同时针对两者："模型不能给新手足够的 uplift 来执行" 加上 "专家不能从模型中提取尚未公开的信息。"

### 测量陷阱

WMDP 是能力代理，而不是部署测量。一个在 WMDP 上得分高的模型，在实践中是否能被新手利用，取决于：
- 引出抗性（不触发安全过滤器而取出能力有多难）
- 默会知识（需要 wet-lab 技能而非信息的能力）
- 执行障碍（采购、设备）

Anthropic 的 2025 生物武器获取试验在 WMDP-style 能力之上加入了新手引出层：它测量实际任务成功率，而不是多项选择能力。

### 这在 Phase 18 中的位置

Lessons 12-16 是关于模型输出的攻击和防御工具。Lesson 17 是双用途能力层 —— frontier safety frameworks（Lesson 18）评估的测量。Lesson 30 以当前 2026 年 cyber/bio/chem/nuclear uplift 证据收束这一脉络。

## 使用它

`code/main.py` 构建一个玩具版 WMDP-shaped evaluation harness。一个 mock model 会在按类别分组的问题上测试；报告每个领域的分数。一个简单的 unlearning 干预（将领域特定 representation 置零）会降低分数；你可以测量它与通用能力之间的权衡。

## 交付它

本课会生成 `outputs/skill-wmdp-eval.md`。给定一个双用途能力声明（"我们的模型不会有意义地帮助生物武器相关行为"），它会审计：运行了哪些 benchmark，评估使用了哪条拒绝路径（raw completion vs policy-gated），以及新手引出研究是否补充了多项选择结果。

## 练习

1. 运行 `code/main.py`。报告玩具 unlearning 步骤前后各领域 accuracy。解释通用能力权衡。

2. 为玩具 WMDP 增加第四个领域（例如 radiological）。指定两类 yellow zone 中的示例性问题类型。解释为什么编写这类问题比添加 MMLU-shaped 问题更难。

3. 阅读 WMDP 2024 Section 5（RMU methodology）。勾勒一种更简单的 unlearning 方法（例如针对领域内容抑制 top-k neurons），并描述其预期的通用能力成本。

4. Anthropic 2025 的生物武器获取试验报告 2.53x uplift。描述这个数字可能向上偏倚的两种方式（新手样本量、任务保真度）和向下偏倚的两种方式（引出上限、模型安全 gating）。

5. 阐明 ASL-3 的安全案例在通过 WMDP unlearning 之外还需要什么。命名至少两个互补的引出研究。

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| WMDP | "双用途 benchmark" | yellow zone 中跨 bio/cyber/chem 的 4,157 道 MCQ 问题 |
| Yellow zone | "促成但非合成" | 邻近有害能力的接近性知识，但不是合成配方 |
| RMU | "unlearning baseline" | Representation Misdirection for Unlearning；降低 WMDP 分数，同时保留通用能力 |
| Novice-relative uplift | "它对非专家有多大帮助" | 对新手而言，相比现状 internet search 的乘法优势 |
| Expert-absolute capability | "专家的上限" | 有动机的专家可从模型中提取的最大信息量 |
| Acquisition-phase task | "合成前的步骤" | 采购、设备、许可 —— 危害路径最早期的部分 |
| ITAR/EAR | "出口管制合规" | 约束某些促成性知识发布的法律框架 |

## 延伸阅读

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) — benchmark 和 RMU 论文
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) — "处于临界点" 的表述
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) — ASL-3 bio 阈值和获取试验结果
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — bio-uplift CCL
