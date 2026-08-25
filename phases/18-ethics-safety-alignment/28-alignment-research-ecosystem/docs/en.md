# Alignment 研究生态系统 — MATS, Redwood, Apollo, METR

> 五个组织定义了 2026 年非实验室 alignment 研究层。MATS (ML Alignment & Theory Scholars)：自 2021 年底以来培养了 527+ 名研究人员，发表 180+ 篇论文，获得 10K+ 次引用，h-index 47；2024 年夏季 cohort 以 501(c)(3) 形式注册成立，约有 90 名 scholars 和 40 名 mentors；2025 年前 alumni 中有 80% 从事 safety/security 工作，其中 200+ 人在 Anthropic、DeepMind、OpenAI、UK AISI、RAND、Redwood、METR、Apollo。Redwood Research：由 Buck Shlegeris 创立的应用 alignment 实验室；提出了 AI Control（Lesson 10）；与 UK AISI 合作开展 control safety cases。Apollo Research：面向 frontier labs 的部署前 scheming evaluations；撰写了 In-Context Scheming（Lesson 8）和 Towards Safety Cases for AI Scheming。METR (Model Evaluation and Threat Research)：基于任务的 capability evaluations、自主任务 time-horizon studies；"Common Elements of Frontier AI Safety Policies" 比较了各实验室框架。Eleos AI Research：model-welfare 部署前 evaluations（Lesson 19）；进行了 Claude Opus 4 welfare assessment。

**Type:** 学习
**Languages:** 无
**Prerequisites:** Phase 18 · 01-27（前面的 Phase 18 课程）
**Time:** ~45 分钟

## 学习目标
- 识别非实验室 alignment 研究生态系统中的五个组织及其核心产出。
- 描述 MATS 的规模（scholars、papers、h-index）及其作为人才管道的作用。
- 描述 Redwood 的 AI Control 议程及其与 UK AISI 的合作关系。
- 描述 METR 基于任务的 evaluation 方法论。

## 问题
frontier labs（Lesson 18）在内部生成 safety evaluations，并发布选定结果。实验室之外的生态系统负责验证这些 evaluations，首次发现新的 failure modes，并培养人才。理解这个生态系统有助于判断哪些研究发现被谁信任。

## 概念
### MATS (ML Alignment & Theory Scholars)

始于 2021 年底。研究 mentorship program；scholars 与一位资深研究员一起，在一个具体 alignment 问题上工作 10-12 周。

规模（2026）：
- 自成立以来已有 527+ 名研究人员。
- 已发表 180+ 篇论文。
- 10K+ 次引用。
- h-index 47。
- 2024 年夏季：90 名 scholars + 40 名 mentors；以 501(c)(3) 形式注册成立。

职业去向：2025 年前 alumni 中约 80% 正在从事 safety/security 工作。200+ 人在 Anthropic、DeepMind、OpenAI、UK AISI、RAND、Redwood、METR、Apollo。

### Redwood Research

应用 alignment 实验室。由 Buck Shlegeris 创立。提出了 AI Control 议程（Lesson 10）。与 UK AISI 合作开展 control safety cases。为 DeepMind 和 Anthropic 的 evaluation design 提供建议。

经典论文：Greenblatt, Shlegeris et al., "AI Control"（arXiv:2312.06942, ICML 2024）；Alignment Faking（Greenblatt, Denison, Wright et al., arXiv:2412.14093，与 Anthropic 合作）。

风格：具体的 threat models、worst-case adversaries，以及可进行 stress-test 的具体 protocols。

### Apollo Research

面向 frontier labs 的部署前 scheming evaluations。撰写了 In-Context Scheming（Lesson 8, arXiv:2412.04984）。参与 2025 年 OpenAI anti-scheming training 合作。产出 Towards Safety Cases for AI Scheming（2024）。

风格：在 deception 可能出现的 agentic setting 中进行 evaluations；三支柱分解（misalignment、goal-directedness、situational awareness）。

### METR (Model Evaluation and Threat Research)

基于任务的 capability evaluations。自主任务完成 time-horizon studies。"Common Elements of Frontier AI Safety Policies"（metr.org/common-elements, 2025）比较了各实验室框架。

与 Apollo 共同撰写 AI Scheming safety-case sketch。

风格：长时程任务 evaluations、实证 capability measurement、框架综合。

### Eleos AI Research

Model-welfare 部署前 evaluations。进行了 Claude Opus 4 welfare assessment，该 assessment 记录在 system card 第 5.3 节。为 Lesson 19 中与 welfare 相关的主张提供外部方法论检查。

### The flow

MATS 培养研究人员。毕业生进入 Anthropic、DeepMind、OpenAI（实验室 safety teams），或进入 Redwood、Apollo、METR、Eleos（external evaluation）。外部 evaluators 与实验室以及 UK AISI / CAISI 合作。出版物再反馈回 MATS 生态系统，为下一 cohort 服务。

### Why this layer matters

单一来源的 evaluations 并不可靠：实验室评估自己的模型存在结构性利益冲突。外部 evaluators 可以提出并验证实验室可能少报的 failure modes。2024 年 Sleeper Agents 论文（Lesson 7）由 Anthropic + Redwood 完成；Alignment Faking 由 Anthropic + Redwood 完成；In-Context Scheming 来自 Apollo；Anti-Scheming 来自 Apollo + OpenAI。多组织结构就是质量控制。

### Where this fits in Phase 18

Lessons 7-11 引用了 Redwood 和 Apollo 的工作；Lesson 18 引用了 METR 的框架比较；Lesson 19 引用了 Eleos。Lesson 28 是对本 Phase 其余部分所依赖生态系统的显式组织地图。

```figure
sae-features
```

## 使用它
无需代码。阅读 METR 的 "Common Elements of Frontier AI Safety Policies"，把它作为外部综合如何为实验室内部 policy 工作增加价值的示例。

## 交付它
本课会生成 `outputs/skill-ecosystem-map.md`。给定一个 alignment 主张或 evaluation，它会识别组织、发表场所和方法论风格，并与已知 counterpart organizations 进行交叉检查。

## 练习
1. 从 Lessons 7-15 中选择一篇论文，识别参与其中的组织。将作者与 MATS alumni 和当前生态系统 affiliations 进行交叉检查。

2. 阅读 METR 的 "Common Elements of Frontier AI Safety Policies." 识别他们强调的三个跨实验室 convergences 和两个最大的 divergences。

3. MATS 的职业去向约有 80% 是 safety/security。论证这种 selection pressure 是 adaptive（培养整个领域）还是 biased（过滤掉异端立场）。

4. Redwood 和 Apollo 都做 control/scheming 工作，但风格不同。选择一个 failure mode，并描述它们各自会如何调查。

5. Eleos AI 是唯一一个纯 model-welfare 组织。设计一个假想的第二组织，专注于另一个 welfare-adjacent 问题（cognitive liberty、robotic embodiment 等），并阐明它的方法论。

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| MATS | "the mentorship program" | ML Alignment & Theory Scholars；自 2021 年以来培养了 527+ 名研究人员 |
| Redwood Research | "the control lab" | 应用 alignment；AI Control 作者；UK AISI 合作伙伴 |
| Apollo Research | "the scheming evals" | 面向 frontier labs 的部署前 scheming evaluations |
| METR | "the task-horizon evals" | 基于任务的 capability evaluations；框架综合 |
| Eleos AI | "the welfare lab" | Model-welfare 部署前 evaluations |
| Talent pipeline | "MATS -> labs" | MATS 毕业生流向 Anthropic、DM、OpenAI、Redwood、Apollo、METR |
| External evaluation | "non-lab check" | 不由模型生产方完成的 evaluation；增加可信度 |

## 延伸阅读
- [MATS (ML Alignment & Theory Scholars)](https://www.matsprogram.org/) — mentorship program
- [Redwood Research](https://www.redwoodresearch.org/) — AI Control papers
- [Apollo Research](https://www.apolloresearch.ai/) — scheming evaluations
- [METR — Common Elements of Frontier AI Safety Policies](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) — 框架比较
- [Eleos AI Research](https://www.eleosai.org/research) — model welfare 方法论
