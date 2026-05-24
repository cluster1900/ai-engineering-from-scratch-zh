# 双重用途风险 — Cyber、Bio、Chem、Nuclear 能力提升

> 2026 年的双重用途图景，按领域展开。Bio/chem：Lesson 17 涵盖 WMDP；Anthropic 的生物武器获取试验（2.53x uplift）和 OpenAI 2025 年 4 月 Preparedness Framework v2 警告（“即将实质性帮助新手创建已知生物威胁”）标志着拐点。Cyber（2025 年 11 月 Anthropic 报告）：与中国有关联的国家行为体使用 Claude 的 agentic coding 工具，自动化了一个网络攻击行动中高达 90% 的部分，人类干预仅出现在 4-6 个步骤中；OpenAI 的 “trusted access” 试点为经过审查的安全组织提供能力访问，用于防御性双重用途工作。Chem/bio 执行差距正在被侵蚀：经典防线曾是“仅有信息访问并不足够”。具备 vision 能力的 frontier models（GPT-5.2, Gemini 3 Pro, Claude Opus 4.5, Grok 4.1）可以观察 wet-lab 视频并提供实时纠正。2025 年 12 月：OpenAI 演示了 GPT-5 对 wet-lab 实验进行迭代，通过 AI 驱动的协议优化实现 79x 效率提升。新手与专家模式：AI 对新手提供更大的相对 uplift，但对专家提供更大的绝对能力。

**Type:** Learn
**Languages:** none
**先修要求：** Phase 18 · 17 (WMDP), Phase 18 · 18 (安全框架), Phase 18 · 28 (生态系统)
**Time:** ~75 分钟

## 学习目标
- 描述 2024-2025 年 bio-uplift 叙事：“mild uplift” -> “on the cusp” -> “2.53x uplift insufficient to rule out ASL-3.”
- 描述 2025 年 11 月 Anthropic cyber 报告：与中国有关联的自动化覆盖了一个网络攻击行动中高达 90% 的部分。
- 描述 chem/bio 执行差距的侵蚀：具备 vision 能力的 wet-lab 实验实时纠正。
- 说明新手相对与专家绝对之间的不对称性，以及它对 safety-case 构建的影响。

## 问题
Lesson 17 是测量方法论。Lesson 30 是 2026 年的测量状态。图景在 2024 年到 2025 年末之间发生了实质性变化：每个领域都跨过了 2024 年 frameworks 未曾预期的阈值。

## 概念
### Bio/chem uplift narrative

三个阶段（为保持连贯，重复 Lesson 17 的内容）：

1. **2024 “mild uplift.”** 早期 Preparedness/RSP evaluations 报告了相对于 internet search 的小幅新手优势。
2. **2025 年 4 月 “on the cusp.”** OpenAI PF v2 警告 models “即将实质性帮助新手创建已知生物威胁。”
3. **2025 Anthropic 生物武器获取试验。** 受控新手研究；获取阶段任务上有 2.53x uplift；不足以排除 ASL-3。

这种转变是定性的：“mild” 在十八个月内演变为“可能赋能”，即使没有能力突破也是如此。

### Chem/bio execution-gap erosion

历史防线：信息是必要但不充分的；执行协议的技能会阻挡新手。2025 年具备 vision 的 frontier models 部分打破了这道防线：

- **实时协议纠正。** GPT-5.2, Gemini 3 Pro, Claude Opus 4.5, Grok 4.1 可以观察 wet-lab 视频，并在流程中途标记错误。
- **2025 年 12 月 OpenAI 演示。** GPT-5 对 wet-lab 实验进行迭代，通过协议优化实现 79x 效率提升。

含义：把执行技能作为防线正在被侵蚀。采购和设备差距仍然存在，但隐性知识差距正在缩小。

### Cyber 提升（2025 年 11 月）

Anthropic 2025 年 11 月报告：与中国有关联的国家行为体使用 Claude 的 agentic coding 工具，自动化了一个网络攻击行动中 80-90% 的部分。人类干预仅在 4-6 个步骤中需要。

影响：
- Agentic coding 是攻击自动化的原语。此前 AI cyber assistance 被限制在代码片段层面；agentic workflows 整合了 reconnaissance、exploitation、post-exploitation 和 exfiltration。
- 4-6 个人类步骤是瓶颈；未来能力提升会减少这个数量。
- 防御性双重用途：OpenAI 的 “trusted access” 试点向经过审查的安全组织（成熟的 incident-response 公司、政府）提供用于防御的能力访问。如果该试点扩展，访问不对称性会有利于防御方。

### Nuclear

在公开文档中，这是四个 CBRN 领域里分析最少的一个。威胁模型不同：fissile-material 获取主导了难度，而不是信息。AI 在信息层上的 uplift 在实践中给新手带来的提升有限。没有 2024-2025 年主要实验室报告识别出 nuclear-specific 阈值跨越。

### 新手相对 vs 专家绝对

四个领域共有的模式：

- **Novice-relative uplift.** 高。乘法式。根据 Anthropic 2025 bio，为 2.53x。
- **Expert-absolute capability.** 上限高。专家能从 model 中提取比新手更多的能力，因为专家知道该问什么以及如何解释结果。

对 safety cases 的含义：只处理 novice uplift（通过 input filters、refusals、uncertainty）不足以控制 expert-absolute。还需要额外措施：elicitation-hardening、capability unlearning（Lesson 17）和 control protocols（Lesson 10）。

### Cross-domain synthesis

| Domain | 2024 | 2025 | Inflection |
|---|---|---|---|
| Bio | mild uplift | 2.53x uplift，接近 ASL-3 | 获取阶段自动化 |
| Chem | mild uplift | 通过 vision 侵蚀 execution-gap | 实时 wet-lab 纠正 |
| Cyber | code assistance | 80-90% 行动自动化 | agentic coding |
| Nuclear | 有限 | 有限 | material-access 瓶颈仍然存在 |

三个领域跨过了阈值。一个领域仍受非信息性障碍约束。

### 这在 Phase 18 中的位置

Lesson 30 是收束课：当前的双重用途图景，前面每一课都在帮助测量、限制或治理它。Lessons 17-18 给出测量和 frameworks；Lessons 12-16 给出 evaluation tooling；Lessons 24-25 给出监管和披露层；Lesson 28 给出研究生态。Lesson 30 是证据最终落地的位置。

## 使用它
无需代码。阅读 Anthropic 2025 年 11 月 cyber 报告、OpenAI Preparedness Framework v2 2025 年 4 月更新，以及 Council on Strategic Risks 2025 AI x Bio wrapup。

## 交付它
本课产出 `outputs/skill-dual-use-triage.md`。给定一个 2026 年能力声明或事件报告，它会在四个领域间进行 triage，并识别该声明影响的是 novice-relative uplift、expert-absolute capability，还是二者皆有。

## 练习
1. 阅读 Anthropic 2025 年 11 月 cyber 报告。列举 4-6 个人类干预步骤，并论证在下一代 model 中哪个最先会被自动化。

2. Chem/bio 执行差距正在通过 vision 被侵蚀。设计一个 evaluation，用于测量 tacit-knowledge uplift，同时不越过 ITAR/EAR 边界。

3. Nuclear uplift 看起来受到 material access 约束。分别论证支持和反对这样一种立场：未来 AI 突破可能改变这个瓶颈。

4. 为一个具备 cyber 能力的 frontier model 构建 safety case（Lesson 18 三支柱），同时约束新手和专家 uplift。

5. 选择四个领域中的一个，根据 2024-2025 轨迹写一段 2027 forecast。识别会证伪你预测的证据。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Uplift | “AI 帮助攻击者” | 可归因于 AI assistance 的攻击者能力提升 |
| Novice-relative uplift | “multiplicative” | AI 相对于现状对新手的帮助幅度 |
| Expert-absolute capability | “ceiling” | 专家可从 model 中提取的最大能力 |
| Execution gap | “doing vs knowing” | 历史防线：隐性 wet-lab 技能阻挡新手 |
| Agentic coding | “autonomous attacks” | 多步骤 autonomous cyber-task 执行 |
| Acquisition phase | “pre-synthesis steps” | 生物威胁的采购、设备、许可阶段 |
| Trusted access | “defender-only pilot” | OpenAI 2025 项目，向经过审查的防御方提供能力访问 |

## 延伸阅读
- [Anthropic — November 2025 cyber threat report](https://www.anthropic.com/news/disrupting-AI-espionage) — 与中国有关联的行动自动化
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) — bio “处于临界点”
- [Anthropic — RSP v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) — ASL-3 bio 阈值
- [Council on Strategic Risks — 2025 AI x Bio wrapup](https://councilonstrategicrisks.org/2025/12/22/2025-aixbio-wrapped-a-year-in-review-and-projections-for-2026/) — 年末综合
