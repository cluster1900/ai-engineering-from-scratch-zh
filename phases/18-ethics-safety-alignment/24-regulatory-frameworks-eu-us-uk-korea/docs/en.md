# Regulatory Frameworks — EU, US, UK, Korea

> 四个主要监管制度定义了 2026 年的 AI 治理格局。EU AI Act（2024 年 8 月 1 日生效）——禁止性做法与 AI 素养自 2025 年 2 月 2 日起适用；GPAI 义务自 2025 年 8 月 2 日起适用；全面适用与 Article 50 透明度要求自 2026 年 8 月 2 日起适用；既有 GPAI 与Embedding式高风险系统自 2027 年 8 月 2 日起适用；罚款最高可达 1500 万 EUR 或全球营业额的 3%。GPAI Code of Practice（2025 年 7 月 10 日）：三章——Transparency、Copyright、Safety and Security——12 项承诺；执法从 2026 年 8 月开始。UK AISI -> AI Security Institute（2025 年 2 月）：更名表示范围收窄。US AISI -> CAISI（2025 年 6 月）：NIST 下属 Center for AI Standards and Innovation；转向更支持增长的姿态。Korean AI Framework Act（2024 年 12 月通过，2026 年 1 月生效）：Article 12 在 MSIT 下设立 AISI；要求外国 AI 公司设立本地代表，并对高影响与生成式 AI 实施风险评估和安全措施。

**Type:** Learn
**Languages:** none
**Prerequisites:** Phase 18 · 18（frontier frameworks），Phase 18 · 27（data governance）
**Time:** ~75 分钟

## 学习目标
- 描述 EU AI Act 的风险分层（禁止、高风险、通用、有限风险）以及 2025 年 8 月 / 2026 年 8 月 / 2027 年 8 月时间线。
- 描述 GPAI Code of Practice 的三章，以及每一章约束哪些提供方。
- 描述 2025 年的两次更名：UK AISI -> AI Security Institute；US AISI -> CAISI；以及每次更名对政策方向的含义。
- 说明 Korea's AI Framework Act 的核心条款。

## 问题
实验室框架（Lesson 18）是自愿性的。监管框架是强制性的。2024-2026 年期间，第一波综合性 AI 监管开始生效。部署方必须把技术控制映射到监管义务；这种映射因司法辖区而异。

## 概念
### EU AI Act

**2024 年 8 月 1 日生效。** 风险分层结构：

- **禁止性做法**（Article 5）。社会评分、公共场所实时远程生物识别（有执法例外）、对脆弱群体的剥削性操纵。2025 年 2 月 2 日适用。
- **高风险系统**（Annex III）。就业、教育、信贷、执法、司法、移民。要求合格评定、风险管理、日志记录、透明度。
- **General-Purpose AI (GPAI) models**。2025 年 8 月 2 日适用。所有 GPAI 提供方都有义务；系统性风险 GPAI（训练计算量 >1e25 FLOP）有额外义务。
- **有限风险系统**。Article 50 下的透明度义务（AI 生成内容标注）。2026 年 8 月 2 日适用。

时间线：
- 2025 年 2 月 2 日：禁止性做法 + AI 素养。
- 2025 年 8 月 2 日：GPAI + 治理。
- 2026 年 8 月 2 日：全面适用 + Article 50 透明度 + 罚款最高 1500 万 EUR / 全球营业额 3%。
- 2027 年 8 月 2 日：既有 GPAI + Embedding式高风险。

Commission 在 2025 年末提议将高风险时间线调整为 16 个月。

### GPAI Code of Practice

发布于 2025 年 7 月 10 日。三章：

- **Transparency。** 所有 GPAI 提供方。
- **Copyright。** 所有 GPAI 提供方。
- **Safety and Security。** 系统性风险 GPAI 提供方（估计 5-15 家公司）。

共 12 项承诺。由 AI Office 主持的 Signatory Taskforce 管理实施。执法从 2026 年 8 月 2 日开始；在此之前，接受善意合规。

### Article 50 的 Transparency Code

第一版草案 2025 年 12 月 17 日。第二版草案 2026 年 3 月。最终版 2026 年 6 月。涵盖 AI 生成内容标注，包括 deepfakes——这是要求 Lesson 23 中水印技术的监管层。

### UK AI Security Institute（2025 年 2 月）

由 AI Safety Institute 更名而来。更名收窄了范围：去掉 algorithmic bias 和 free-speech 相关框架；聚焦前沿能力安全。开源了 Inspect 评估工具（2024 年 5 月）。与 Redwood（Lesson 10）合作开展 control safety cases。

### US CAISI（2025 年 6 月）

Trump 政府将 NIST 的 AI Safety Institute 转变为 Center for AI Standards and Innovation。根据 VP Vance 在 Paris AI Action Summit 上的讲话，方向转向“pro-growth AI policies”。降低对部署前评估的强调；强调标准与创新支持。它是 EU AI Act 监管姿态在美国国内的制衡。

### Korean AI Framework Act

2024 年 12 月通过。2025 年 1 月颁布。2026 年 1 月生效。整合了 19 项独立 AI 法案。

Article 12 在 Ministry of Science and ICT (MSIT) 下设立 AISI。要求：
- 在 Korea 运营的外国 AI 公司设立本地代表。
- 对“高影响”AI 系统进行风险评估。
- 对生成式 AI 和高影响 AI 采取安全措施。

这是亚洲第一个综合性横向 AI 监管司法辖区。

### 跨司法辖区动态

- EU：严格、风险分层、重罚。隐私相邻监管的基准。
- US：偏向创新、去中心化，各州（例如 California AB 2013 —— Lesson 27）填补联邦空白。
- UK：范围较窄的安全重点，强评估基础设施。
- Korea：由 MSIT 主导，重点关注外国提供方。

这些是相互竞争的监管哲学。跨多个司法辖区的部署方必须遵守最严格的规则；在 2026 年，这通常是 EU AI Act。

### 它在 Phase 18 中的位置

Lesson 18 是实验室自愿治理；Lesson 24 是监管；Lesson 25 是 AI 系统中一类新兴 CVE；Lessons 26-27 涵盖文档（cards）和训练数据治理。

## 使用它
无代码。阅读 EU AI Act 的一手来源：法规文本、GPAI Code of Practice、UK AISI Inspect framework。把你的部署映射到每个司法辖区的适用义务。

## 交付它
本课产出 `outputs/skill-regulatory-map.md`。给定部署描述，它会映射适用司法辖区、每个辖区中的分层分类、按辖区划分的义务，以及期限结构。

## 练习
1. 阅读 EU AI Act（regulation 2024/1689）和 GPAI Code of Practice（2025 年 7 月 10 日）。找出三项适用于每个 GPAI 提供方的义务，以及三项仅适用于系统性风险 GPAI 的义务。

2. 某部署由一家 US 公司完成，运行在 EU 基础设施上，并服务 Korean 用户。哪三个司法辖区的规则适用？每个实质性问题分别由哪条规则约束？

3. UK AI Security Institute 的更名收窄了范围。分别论证支持和反对这种较窄框架的理由。识别每个立场所依赖的政策假设。

4. CAISI 的“pro-growth”框架偏离了 2022-2024 年的 AI safety institute 模型。识别这种框架会带来的两个可衡量政策转变。

5. Korea's AI Framework Act 要求外国提供方设立本地代表。描述一家服务 Korean 用户的 Bay Area 公司会面临哪些运营影响。

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| EU AI Act | “the regulation” | 基于风险分层的横向 AI 监管；2024 年 8 月生效 |
| GPAI | “general-purpose AI” | 大型 foundation models；系统性风险子集有额外义务 |
| Article 50 | “transparency obligations” | AI 生成内容标注；2026 年 8 月适用 |
| UK AISI | “AI Security Institute” | 2025 年 2 月更名；更窄的前沿安全重点 |
| CAISI | “US center for AI standards” | 2025 年 6 月由 AI Safety Institute 更名而来；支持增长的姿态 |
| Korean AI Framework Act | “MSIT horizontal regulation” | 亚洲第一部综合性 AI 法；2026 年 1 月生效 |
| Systemic-risk GPAI | “the 1e25 FLOP threshold” | 额外义务分层；估计约束 5-15 家公司 |

## 延伸阅读
- [EU AI Act text (Regulation 2024/1689)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — 法规与时间线
- [GPAI Code of Practice (10 July 2025)](https://digital-strategy.ec.europa.eu/en/library/final-version-general-purpose-ai-code-practice) — 三章代码
- [UK AI Security Institute (renamed Feb 2025)](https://www.gov.uk/government/organisations/ai-security-institute) — 官方页面
- [CSET — South Korea AI Framework Act Analysis (2025)](https://cset.georgetown.edu/publication/south-korea-ai-law-2025/) — Korean 框架分析
