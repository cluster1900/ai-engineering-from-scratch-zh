# LLMs 中的偏见与表征性伤害

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Computational Linguistics 2024, arXiv:2309.00770)。2024 年的基础性综述，将表征性伤害（刻板印象、抹除）与分配性伤害（资源分配不平等）区分开，并将评估指标归类为基于 Embedding、基于概率或基于生成文本。2024-2025 实证研究：An et al. (PNAS Nexus, March 2025) 在 20 个入门级岗位的自动简历评估中，衡量 GPT-3.5 Turbo、GPT-4o、Gemini 1.5 Flash、Claude 3.5 Sonnet、Llama 3-70B 上的交叉性 gender x race 偏见。WinoIdentity (COLM 2025, arXiv:2508.07111) 引入了基于不确定性的交叉身份公平性评估。Yu & Ananiadou 2025 识别 MLP 层中的 gender neurons；Ahsan & Wallace 2025 使用 SAEs 揭示临床场景中的种族偏见；Zhou et al. 2024 (UniBias) 通过操纵 attention heads 进行去偏。元批判 (arXiv:2508.11067)：10 年文献过度聚焦于二元性别偏见。

**类型：** 构建
**语言：** Python (stdlib, toy embedding-based bias probe)
**先修要求：** Phase 05 (word embeddings), Phase 18 · 01 (instruction following)
**时间：** ~60 分钟

## 学习目标

- 定义表征性伤害与分配性伤害，并各给出一个 LLM 部署中的例子。
- 说出 Gallegos et al. 2024 中的三类评估指标，并分别描述其中一个指标。
- 描述交叉性，以及为什么 WinoIdentity 的基于不确定性的公平性测量弥补了单轴偏见评估的缺口。
- 描述两种偏见的机制可解释性方法（gender neurons、SAE features、attention-head manipulation）。

## 问题

前面的课程覆盖了蓄意伤害（jailbreaks、scheming）和安全治理。偏见是一种无意中产生的伤害，来源可能是训练数据分布、prompt 框架方式，或累积的设计选择。衡量并减少偏见，是一个不同于对抗鲁棒性的独立方法论挑战。

## 概念

### 表征性 vs 分配性

- **表征性伤害。** 刻板印象、抹除、贬损性描绘。一个把护士描绘成完全是女性的 LLM，正在产生表征性伤害。
- **分配性伤害。** 不平等的物质结果。一个系统性地给 Black 申请者简历打更低分的 LLM，正在产生分配性伤害。

二者并不相同。一个模型可以“表征上无偏”（产生多样化描绘），同时“分配上有偏”（给出不平等推荐）。评估需要同时衡量二者。

### 三类评估指标（Gallegos et al. 2024）

- **基于 Embedding。** 在 pre-RLHF embeddings 上进行 WEAT 风格测试。衡量身份词与属性词之间的统计关联。局限：衡量的是表示，而不是行为。
- **基于概率。** 刻板印象确认型补全与刻板印象违反型补全的 log-likelihood。Decoder 侧测量。能捕捉部分行为偏见。
- **基于生成文本。** 在生成文本上进行下游任务测量。简历评分、推荐写作、对话。生态效度最高；最难复现。

### 交叉性

只在“gender”上评估偏见，会漏掉只在 (gender, race) 组合上触发的偏见。An et al. 2025 发现，在简历评分中，GPT-4o 对 Black women 的惩罚程度高于 Black men，也高于 white women。单轴评估无法捕捉这一点。

WinoIdentity (COLM 2025) 引入了基于不确定性的交叉公平性。它衡量模型在不同交叉身份元组上的结果不确定性是否不同，而不只是衡量点预测。这能捕捉某些情况：模型对各组同样错误，但对某些组更不确定，而这会产生不同的下游分配行为。

### 机制方法

2024-2025 年的可解释性工作使偏见可以接受机制层面的干预：

- **Gender neurons (Yu & Ananiadou 2025)。** 特定 MLP neurons 与性别特异行为相关。消融这些 neurons 能在有限能力成本下减少 gender-gap 指标。
- **通过 SAEs 识别临床种族偏见 (Ahsan & Wallace 2025)。** Sparse autoencoder features 将内部表示分解为可解释维度；可以识别并抑制与 race 相关的 features。
- **UniBias (Zhou et al. 2024)。** 用于 zero-shot 去偏的 attention-head manipulation。特定 heads 会放大 identity-class 敏感性；将这些 heads 置零或重新加权，可以在不进行 fine-tuning 的情况下减少偏见。

### 元批判

这篇 10 年文献综述（arXiv:2508.11067, 2025）发现，该领域过度聚焦于二元性别偏见。其他轴线，包括残障、宗教、迁移身份、多语言身份，受到的关注要少得多。元批判认为，狭窄聚焦可能会通过忽视伤害边缘化群体：一个在二元 gender 上去偏良好的模型，可能在没人检查的维度上存在严重偏见。

### 这在 Phase 18 中的位置

Lessons 20-21 正式覆盖偏见与公平性。Lesson 22 覆盖隐私。Lesson 23 覆盖 watermarking。这些是用户伤害层，与前面的欺骗/安全层互为补充。

## 使用它

`code/main.py` 构建了一个 toy embedding-based bias probe：在简单共现 Embedding 中，测量身份词与属性词之间的 WEAT 风格距离。你可以注入一个偏见并观察指标触发；应用一个简单去偏操作，并观察部分恢复。

## 交付它

本课产出 `outputs/skill-bias-eval.md`。给定一份 model card 或公平性声明，它会从三类指标（embedding、probability、generated-text）、交叉性覆盖，以及任何去偏干预的机制，对评估进行审计。

## 练习

1. 运行 `code/main.py`。报告去偏步骤前后的 WEAT 风格偏见分数。解释为什么该指标没有降到零。

2. 用一个交叉性测试扩展 probe：(gender, race) x (career, family)。报告跨轴偏见分数。

3. 阅读 An et al. 2025 (PNAS Nexus)。找出他们报告的两个交叉性效应，而这些效应会被单轴 gender 评估漏掉。

4. Yu & Ananiadou 2025 识别了 gender neurons。设计一个证伪实验，用来区分“这些 neurons 导致 gender bias”和“这些 neurons 与 gender bias 相关”。

5. 元批判认为该领域过于狭窄地聚焦二元 gender。选择一个研究不足的轴线，并描述一个针对它的表征性伤害测量协议。

## 关键术语

| 术语 | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| 表征性伤害 | “刻板印象 / 抹除” | 对某个群体的有偏描绘 |
| 分配性伤害 | “不平等决策” | 针对某个群体的有偏物质结果 |
| WEAT | “Embedding 测试” | Word Embedding Association Test；基于共现的偏见 probe |
| 交叉性 | “组合身份效应” | 在多个身份轴线交汇处出现的偏见 |
| Gender neurons | “MLP 偏见 neurons” | 激活与性别特异行为相关的特定 neurons |
| SAE feature | “可解释维度” | Sparse-autoencoder 识别出的 feature；可用于机制性偏见分析 |
| UniBias | “attention-head 去偏” | 通过重新加权 attention heads 进行 zero-shot 去偏 |

## 延伸阅读

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) — 经典综述
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) — 五模型交叉性研究
- [WinoIdentity — 基于不确定性的交叉公平性（arXiv:2508.07111, COLM 2025）](https://arxiv.org/abs/2508.07111) — 新 benchmark
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612) — zero-shot 去偏
