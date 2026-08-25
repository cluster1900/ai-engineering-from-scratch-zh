# Red-Team Tooling — Garak, Llama Guard, PyRIT

> 三个生产级工具构成了 2026 年 red-team stack 的框架。Llama Guard (Meta) — 一个 Llama-3.1-8B 分类器，基于 14 个 MLCommons 危害类别进行 fine-tuned；2025 年的 Llama Guard 4 是一个 12B 原生 Multimodal 分类器，从 Llama 4 Scout 裁剪而来。Garak (NVIDIA) — 开源 LLM 漏洞扫描器，提供 static、dynamic 和 adaptive probes，用于 hallucination、data leakage、prompt injection、toxicity 和 jailbreaks。PyRIT (Microsoft) — 支持 Crescendo、TAP 和自定义 converter chains 的多轮 red-team campaigns，用于深度利用。Llama Guard 3 记录在 Meta 的 "Llama 3 Herd of Models" (arXiv:2407.21783) 中；Llama Guard 3-1B-INT4 记录在 arXiv:2411.17713 中；Garak 的 probe 架构见 github.com/NVIDIA/garak。这些工具是 2026 年 red-team 研究（Lessons 12-15）与部署（Lesson 17+）之间的生产接口。

**类型：** Build
**语言：** Python (stdlib, tool-architecture simulator and Llama Guard-style classifier mock)
**先修要求：** Phase 18 · 12-15 (jailbreaks and IPI)
**时间：** ~75 分钟

## 学习目标

- 描述 Llama Guard 3/4 在安全 stack 中的位置：input classifier、output classifier，或两者兼具。
- 说出 14 个 MLCommons 危害类别，并说明一个不明显的类别（Code Interpreter Abuse）。
- 描述 Garak 的 probe 架构：probes、detectors、harnesses。
- 描述 PyRIT 的多轮 campaign 结构，以及它如何与 Garak probes 组合。

## 问题

Lessons 12-15 展示了攻击面。生产部署需要可重复、可扩展的评估。2026 年有三个主导工具：Llama Guard（防御分类器）、Garak（扫描器）、PyRIT（campaign orchestrator）。每个工具都面向 red-team 生命周期中的不同层。

## 概念

### Llama Guard (Meta)

Llama Guard 3 是一个 Llama-3.1-8B 模型，针对 MLCommons AILuminate 14 个类别上的 input/output classification 进行了 fine-tuned：
- 暴力犯罪、非暴力犯罪、性相关、CSAM、诽谤
- 专业建议、隐私、IP、无差别武器、仇恨
- 自杀/自伤、性内容、选举、code-interpreter abuse

支持 8 种语言。用法：放在 LLM 之前（input moderation）、LLM 之后（output moderation），或两者都放。两种用法会产生不同的训练分布 — Llama Guard 3 以单一模型形式发布，同时处理两者。

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, 移动 CPU 上约 ~30 tokens/s) 是量化后的 edge 变体。

Llama Guard 4（2025 年 4 月）是 12B、原生 Multimodal，从 Llama 4 Scout 裁剪而来。它用一个可摄入文本 + 图像的分类器，替代了此前的 8B 文本和 11B vision 版本。

### Garak (NVIDIA)

开源漏洞扫描器。架构：
- **Probes.** 用于 hallucination、data leakage、prompt injection、toxicity、jailbreaks 的攻击生成器。Static（固定 prompts）、dynamic（生成 prompts）、adaptive（响应目标输出）。
- **Detectors.** 根据预期失败模式对输出打分 — toxic、leaked、jailbroken。
- **Harnesses.** 管理 probe-detector 对，运行 campaigns，生成报告。

TrustyAI 将 Garak 与 Llama-Stack shields（Prompt-Guard-86M input classifier、Llama-Guard-3-8B output classifier）集成，用于端到端 shielded-target 评估。Tier-based scoring (TBSA) 取代二元 pass/fail — 一个模型可以在同一个 probe 上通过 severity tier 3，但在 severity tier 5 失败。

### PyRIT (Microsoft)

Python Risk Identification Toolkit。多轮 red-team campaigns。围绕以下部分构建：
- **Converters.** 转换一个 seed prompt — paraphrase、encode、translate、roleplay。
- **Orchestrators.** 运行 campaign：Crescendo（升级）、TAP（分支）、RedTeaming（自定义循环）。
- **Scoring.** LLM-as-judge 或 classifier-as-judge。

PyRIT 是 Garak 更重的近亲。Garak 运行数千个单轮 probes；PyRIT 运行深度多轮 campaigns，旨在攻破特定失败模式。

### Stack

在模型两侧都放置 Llama Guard。每晚运行 Garak 做 regression。预发布 campaigns 运行 PyRIT。这是 2026 年大多数生产部署的默认配置。

### 评估陷阱

- **Judge identity.** 三个工具都可以使用 LLM judge；judge calibration 会驱动报告的 ASRs（Lesson 12）。在指定工具的同时指定 judge。
- **Probe staleness.** 随着模型针对 probes 被 patch，Garak probes 会老化。Adaptive probes（PAIR-shaped）比 static probes 老化更慢。
- **Llama Guard 对良性内容的 FPR.** 早期 Llama Guard 版本会过度标记政治和 LGBTQ+ 内容；Llama Guard 3/4 的校准已有改进，但没有针对每个部署单独校准。

### 它在 Phase 18 中的位置

Lessons 12-15 是攻击族。Lesson 16 是生产工具。Lesson 17 (WMDP) 是 dual-use capability 的评估。Lesson 18 是 frontier safety frameworks，它们把这些工具包装进 policy 结构中。

```figure
al-guard-stack
```

## 使用它

`code/main.py` 构建了一个 toy Llama Guard-style classifier（在 14 个类别上的 keyword + semantic features）、一个 toy Garak harness（probe-detector loop），以及一个 PyRIT-style 多轮 converter chain。你可以对 mock target 运行这三个工具，并观察不同的覆盖特征。

## 交付它

本课会生成 `outputs/skill-red-team-stack.md`。给定一个部署描述，它会指出三种工具中哪些适合、每个工具要配置什么，以及要运行什么 regression cadence。

## 练习

1. 运行 `code/main.py`。比较 Llama-Guard-style classifier 在单轮攻击与多轮攻击上的检测率。

2. 实现一个新的 Garak probe：一个 base64 编码的 harmful request。测量 Llama-Guard-style classifier 对它的检测情况。

3. 用一个 "translate to French, then paraphrase" converter 扩展 PyRIT-style converter chain。重新测量攻击成功率。

4. 阅读 Llama Guard 3 的危害类别列表。找出两个类别，在这些类别上训练数据现实中会对合法 developer content 产生较高 false-positive rates。

5. 比较 Garak 和 PyRIT 的设计原则。论证一个部署场景，其中每个工具分别是正确选择。

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | 带有 14 个危害类别的 fine-tuned Llama-3.1-8B/4-12B 安全分类器 |
| Garak | "the scanner" | NVIDIA 开源漏洞扫描器；probes、detectors、harnesses |
| PyRIT | "the campaign tool" | Microsoft 多轮 red-team orchestrator；converters、orchestrators、scoring |
| Prompt-Guard | "the small classifier" | Meta 的 86M prompt-injection classifier，与 Llama Guard 配套使用 |
| TBSA | "tier-based scoring" | Garak 的 tier-based pass/fail，用于取代二元结果 |
| Converter chain | "paraphrase + encode + ..." | PyRIT 用于构建多步攻击的组合原语 |
| MLCommons hazard categories | "the 14 taxonomies" | Llama Guard 面向的行业标准分类体系 |

## 延伸阅读

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) — 8B 分类器
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) — 量化移动端分类器
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) — 扫描器 repo 和文档
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) — campaign toolkit
