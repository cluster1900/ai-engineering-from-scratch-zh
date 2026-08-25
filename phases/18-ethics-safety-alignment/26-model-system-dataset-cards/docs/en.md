# Model、System 与 Dataset Cards

> 三种文档格式构成了 AI 透明度的结构。Model Cards（Mitchell et al. 2019）——模型的营养标签：训练数据、量化的分组分析、伦理考量、注意事项；只有 0.3% 的 Hugging Face model cards 记录了伦理考量（Oreamuno et al. 2023）。Datasheets for Datasets（Gebru et al. 2018, CACM）——动机、组成、收集过程、标注、分发、维护；类比电子元件 datasheet。Data Cards（Pushkarna et al., Google 2022）——模块化分层细节（telescopic、periscopic、microscopic），作为面向不同读者的边界对象。2024-2025 年的发展：通过 LLMs 自动生成（CardGen, Liu et al. 2024）；model-card 细节与 HF 上最高 29% 的下载量增长相关（Liang et al. 2024）；可验证证明（Laminator, Duddu et al. 2024）；面向碳/水的可持续性报告补充（Jouneaux et al. July 2025）；EU/ISO 监管 cards 正在出现。System Cards（Sidhpurwala 2024；Meta 系统级透明度；"Blueprints of Trust" arXiv:2509.20394）——端到端 AI 系统文档，覆盖安全能力、prompt-injection 防护、data-exfiltration 检测、与人类价值的一致性。

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18（安全框架），Phase 18 · 24（监管）
**Time:** ~60 分钟

## 学习目标

- 描述 Mitchell et al. 2019 原始 model card 和 Gebru et al. 2018 datasheet。
- 描述 Data Cards 的 telescopic/periscopic/microscopic 分层。
- 描述 System Cards 及其端到端覆盖范围。
- 说出三项 2024-2025 年的发展（自动生成、可验证证明、可持续性报告）。

## 问题

监管框架（Lesson 24）和实验室安全政策（Lesson 18）都要求文档。文档格式从面向特定模型（model cards）演进到面向特定数据集（datasheets），再到面向特定系统（system cards）。每一种都对应不同范围的透明度。2024-2025 年的自动化和可验证证明工作，正在解决长期存在的采用问题。

## 概念

### Model Cards（Mitchell et al. 2019）

章节：
- Model details。
- Intended use。
- Factors（用于评估的相关人口统计或环境因素）。
- Metrics。
- Evaluation data。
- Training data。
- Quantitative analyses（按 factors 分组）。
- Ethical considerations。
- 注意事项和建议。

采用问题：Oreamuno et al. 2023 对 Hugging Face model cards 的审计发现，只有 0.3% 记录了伦理考量。

### Datasheets for Datasets (Gebru et al. 2018)

类比电子元件 datasheet。章节：
- Motivation（为什么创建该数据集）。
- Composition（其中包含什么）。
- Collection process（如何组装）。
- Labeling（如适用）。
- Uses（预期用途、禁止用途、风险）。
- Distribution。
- Maintenance。

发表于 CACM 2021。datasheet 是上游文档；model card 依赖 datasheet 的准确性。

### Data Cards (Pushkarna et al., Google 2022)

模块化分层细节。三个缩放层级：
- **Telescopic。** 面向非专家的高层摘要。
- **Periscopic。** 面向 ML practitioners 的中层概览。
- **Microscopic。** 面向审计者的详细特征级文档。

边界对象框架：不同读者从同一文档中提取不同信息。

### System Cards

范围：端到端 AI 系统，包括模型 + 安全栈 + 部署上下文。章节通常包括：
- 安全能力。
- Prompt-injection 防护。
- Data-exfiltration 检测。
- 与声明的人类价值保持一致。
- 事件响应。

Sidhpurwala 2024 和 Meta 系统级透明度工作。"Blueprints of Trust" (arXiv:2509.20394) 将 System Card 形式化为 Model Cards 在部署层的补充。

### 2024-2025 年的发展

- **CardGen (Liu et al. 2024)。** 通过 LLMs 自动生成 model-card；报告称在标准化 Mitchell 2019 字段上，比许多人类撰写的 cards 具有更高客观性。
- **下载相关性 (Liang et al. 2024)。** 详细的 model cards 与 HF 上最高 29% 的下载率提升相关——采用压力现在由市场驱动，而不只是合规驱动。
- **Laminator (Duddu et al. 2024)。** 通过硬件 TEE / 加密签名实现可验证证明——允许 model card 携带 claim 的证明，而不只是 claim 本身。
- **Sustainability (Jouneaux et al. July 2025)。** 增加碳、水和计算能耗足迹；新兴 ISO 标准。
- **Regulatory cards。** EU AI Act（Lesson 24）GPAI Code of Practice Transparency 章节要求 model cards 作为合规制品。

### 这在 Phase 18 中的位置

Lessons 24-25 是监管和 CVE 层。Lesson 26 是文档层。Lesson 27 是训练数据治理，也就是 datasheet 的上游。Lesson 28 是研究生态系统，产出 cards 中引用的评估。

```figure
an-card-scopes
```

## 使用它

`code/main.py` 会为一个玩具部署生成一个最小 model card、datasheet 和 system card。每个都遵循规范章节结构。你可以检查格式，并比较三个范围。

## 交付它

本课产出 `outputs/skill-card-audit.md`。给定一个 model card、datasheet 或 system card，它会审计章节覆盖、数值分组，以及是否存在可验证证明。

## 练习

1. 运行 `code/main.py`。检查生成的 cards。识别薄弱章节（仅占位符），并说明什么证据可以加强它们。

2. 扩展 model card，加入跨两个人口统计群体的量化分组分析（Lesson 20）。

3. 阅读 Oreamuno et al. 2023 中关于 0.3% 采用率的内容。提出一个对 model card 规范的结构性改动，以提高 ethical-considerations 的采用率。

4. Laminator (Duddu et al. 2024) 使用 TEEs 进行可验证证明。设计一个 model-card 字段，用于承载某项评估结果的加密证明，并描述 verifier 的角色。

5. 为你过去的一个项目或一个假想部署编写一个 System Card（System Card，不是 Model Card）。识别对第三方审计者价值最高的章节。

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Model Card | "the Mitchell card" | Mitchell et al. 2019 针对 ML models 的标准文档 |
| Datasheet | "the Gebru datasheet" | Gebru et al. 2018 针对数据集的标准文档 |
| Data Card | "the Pushkarna card" | Google 2022 模块化分层数据文档 |
| System Card | "the deployment card" | 包括安全栈在内的端到端 AI 系统文档 |
| Boundary object | "different readers, one doc" | Data Cards 框架：同一文档服务不同受众 |
| Verifiable attestation | "the Laminator attestation" | 附加到文档 claim 上的加密或 TEE 证明 |
| Sustainability field | "carbon / water footprint" | 2025 年出现的环境核算补充项 |

## 延伸阅读

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) — 规范 model card
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) — datasheet 论文
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) — 分层数据文档
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) — System Card 形式化
