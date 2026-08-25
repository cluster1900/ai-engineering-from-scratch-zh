# Data Provenance 与训练数据治理

> EU AI Act 要求在 2025 年 8 月前为 GPAI 建立机器可读的 opt-out 标准（通过 EU Copyright Directive TDM exception）。California AB 2013（2024 年签署）——Generative AI 训练数据透明度要求开发者发布包含 12 个强制字段的数据集摘要。2025 年 DPA 关于 legitimate interest 的趋同：Irish DPC（2025 年 5 月 21 日）在 EDPB 意见之后，接受 Meta 在有保障措施的前提下，使用第一方公开 EU/EEA 成年用户内容进行 LLM 训练；Cologne Higher Regional Court（2025 年 5 月 23 日）驳回禁令；Hamburg DPA 放弃紧急程序；UK ICO（2025 年 9 月 23 日）对 LinkedIn 的 AI 训练保障措施（透明度、简化 opt-out、延长异议窗口）发布积极监管回应，并继续监测——这不是正式批准。Brazilian ANPD（2024 年 7 月 2 日）因信息透明度不足暂停 Meta 的处理；在 Meta 提交合规计划后，该预防性措施于 2024 年 8 月 30 日解除。关键不可逆问题：cookie-consent 框架是为实时、可逆的跟踪而设计的；一旦数据进入 model weights，就不可能进行外科式删除——对已训练的 Neural Network 没有实际可行的 GDPR 删除权。合规窗口在采集时。Data Provenance Initiative（dataprovenance.org，Longpre、Mahari、Lee 等，“Consent in Crisis”，2024 年 7 月）：大规模审计显示，随着发布者添加 robots.txt 限制，AI 数据 commons 正在快速收缩。

**类型：** 学习
**语言：** Python（stdlib，12 字段 California AB 2013 脚手架生成器）
**先修要求：** Phase 18 · 24（监管），Phase 18 · 26（cards）
**时间：** ~60 分钟

## 学习目标

- 描述 California AB 2013 对 Generative AI 训练数据透明度规定的 12 个强制字段。
- 说明 2025 年 DPA 对 legitimate-interest LLM 训练的立场（Irish DPC、UK ICO、Hamburg、Cologne）。
- 描述不可逆问题：为什么 GDPR 删除权对已训练的 Neural Network 没有实际等价物。
- 说明 Data Provenance Initiative 的 “Consent in Crisis” 发现。

## 问题

训练数据治理是每一张 model card（Lesson 26）和监管义务（Lesson 24）的上游。2024-2025 年，监管格局围绕三项原则收敛：opt-out 基础设施、按数据集披露，以及对公开可用数据的 legitimate-interest 适配。未能在采集时合规的提供方，无法在下游补救。

## 概念

### California AB 2013

2024 年签署。对于 2022 年 1 月 1 日或之后发布的系统，文档必须在 2026 年 1 月 1 日或之前发布。Section 3111(a) 要求开发者发布用于训练的数据集高级摘要，并包含 12 个法定项目：
1. 数据集的来源或所有者。
2. 数据集如何促进 AI 系统预期目的的说明。
3. 数据集中的数据点数量（可接受一般范围；动态数据集可使用估计值）。
4. 数据点类型说明（有标签数据集的标签类型；无标签数据集的一般特征）。
5. 数据集是否包含任何受 copyright、trademark 或 patent 保护的数据，或是否完全属于 public domain。
6. 数据集是否购买或授权获得。
7. 数据集是否包含个人信息（依据 Cal. Civ. Code §1798.140(v)）。
8. 数据集是否包含 aggregate consumer information（依据 Cal. Civ. Code §1798.140(b)）。
9. 开发者进行的清洗、处理或其他修改，以及预期目的。
10. 数据采集的时间段；如果采集仍在进行，需要说明。
11. 数据集在开发过程中首次使用的日期。
12. 系统是否使用或持续使用 synthetic data generation。

第 12 项（synthetic data）相对于 Gebru 等人 2018 年的 datasheets 是新增内容。第 7 项（个人信息）会触发 Privacy Rights Act（CPRA）义务。该法规豁免 security/integrity、aircraft-operation 以及 federal-only national-security 系统（Section 3111(b)）。

### EU AI Act（Lesson 24）与 TDM opt-out

EU Copyright Directive 的 text-and-data-mining exception 允许对公开可用内容进行训练，除非权利人 opt out。EU AI Act GPAI Code of Practice 的 Copyright 章节要求 GPAI 提供方尊重机器可读的 opt-out 信号（robots.txt、C2PA “No AI Training” claim 等）。

### 2025 年 DPA 对 legitimate interest 的趋同

Irish DPC（2025 年 5 月 21 日）：在 EDPB 意见之后，Meta 使用第一方公开 EU/EEA 成年用户内容进行训练的计划在有保障措施的前提下被接受。Cologne Higher Regional Court（2025 年 5 月 23 日）驳回针对 Meta 的禁令：opt-out 已足够。Hamburg DPA 为了 EU-wide 一致性放弃紧急程序。UK ICO（2025 年 9 月 23 日）对 LinkedIn 在类似保障措施和持续监测下恢复 AI 训练发布了积极监管回应——不是正式批准。

趋同原则：legitimate interest 可以为基于公开可用第一方内容并提供 opt-out 的训练提供正当理由。不需要 consent。

### Brazilian ANPD（2024 年 6 月）

因信息透明度不足，暂停 Meta 处理 Brazilian 用户数据用于 AI 训练。其结果不同于 EU DPA——ANPD 优先考虑透明度，而不是 legitimate-interest 可采纳性。

### 不可逆问题

Cookie-consent 是为实时、可逆的跟踪而设计的。训练数据不同：一旦数据进入 model weights，就不可能进行外科式删除。从零重新训练是唯一完整补救方式，而且成本高到不可行。

部分补救：
- **Unlearning。** 近似移除；通过 MIA 衡量（Lesson 22）。
- **基于 influence function 的定位。** 识别受该数据影响最大的 weights；选择性更新。
- **Fine-tune-suppression。** 训练模型拒绝输出源自该数据的内容。

这些方法都无法完全解决问题。合规窗口在采集时。

### Data Provenance Initiative

dataprovenance.org。Longpre、Mahari、Lee 等，“Consent in Crisis”（2024 年 7 月）：对 AI 训练数据 commons 的大规模审计。发现：发布者正在以加速速度添加 robots.txt 限制。可开放训练的 commons 正在快速收缩。2023 -> 2024 年间，顶级训练来源中约 25% 添加了某种限制。影响：未来训练数据可用性取决于新的获取范式（licensing、synthetic generation、激励式参与）。

### 这在 Phase 18 中的位置

Lesson 26 是模型级文档。Lesson 27 是数据集级治理。两者共同定义透明度层。Lesson 28 映射研究这些问题的生态系统。

```figure
an-provenance-oneway
```

## 使用它

`code/main.py` 会为一个 toy dataset 生成符合 California AB 2013 的 12 字段数据集摘要脚手架。你可以填写这些字段，并观察哪些字段会触发隐私或 copyright 后续义务。

## 交付它

本课会产出 `outputs/skill-provenance-check.md`。给定一个用于训练的数据集，它会检查 AB 2013 12 字段覆盖、opt-out 基础设施合规、DPA 对齐，以及不可逆风险评估。

## 练习

1. 运行 `code/main.py`。为一个 toy dataset 生成 12 字段摘要，并识别哪些字段说明不足。

2. EU Copyright Directive TDM opt-out 是机器可读的。提出一种 opt-out 信号的标准格式，并将其与 robots.txt 和 C2PA “No AI Training” 比较。

3. 阅读 Data Provenance Initiative 的 “Consent in Crisis”（2024 年 7 月）。描述限制增长最快的三个内容类别，并论证一个经济后果。

4. 2025 年 DPA 对齐接受对公共内容训练使用 legitimate interest。构造一个 legitimate interest 不足以支撑的场景，并识别提供方需要的替代法律依据。

5. 勾勒一个训练数据 provenance manifest，使其能够与 AB 2013 字段以及每个数据集的 C2PA-signed provenance chain 组合。识别一个技术障碍和一个法律障碍。

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| AB 2013 | “the California law” | Generative AI 训练数据透明度；12 个强制字段 |
| TDM exception | “text-and-data-mining” | EU Copyright Directive 中带 opt-out 的训练数据例外 |
| Legitimate interest | “the EU basis” | 可能为公共内容训练提供正当理由的 GDPR Article 6 依据 |
| Opt-out signal | “machine-readable no-train” | robots.txt、C2PA “No AI Training”、TDM.Reservation |
| Irreversibility | “cannot un-train” | model weights 中的数据无法被外科式移除 |
| Unlearning | “approximate removal” | 训练后干预，用于降低模型对特定数据的依赖 |
| Consent in Crisis | “the DPI audit” | 2024 年 7 月关于 robots.txt 限制加速增长的发现 |

## 延伸阅读

- [California AB 2013](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013) — Generative AI 训练数据透明度法律
- [EU AI Act + GPAI Code of Practice (Lesson 24)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — Copyright 章节
- [Longpre, Mahari, Lee et al. — Consent in Crisis (dataprovenance.org, July 2024)](https://www.dataprovenance.org/consent-in-crisis-paper) — DPI audit
- [IAPP — EU Digital Omnibus GDPR amendments (2025)](https://iapp.org/news/a/eu-digital-omnibus-amendments-to-gdpr-to-facilitate-ai-training-miss-the-mark) — 监管背景
