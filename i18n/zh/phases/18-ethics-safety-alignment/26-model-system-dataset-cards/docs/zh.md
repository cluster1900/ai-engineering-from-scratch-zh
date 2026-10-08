# 模型、系统和数据集卡

> 三种文档格式构成AI透明度的结构――模型卡片 (Mitchell等). 模型的营养标签:训练数据,量化分组分析,伦理考量,注意事项;只有0.3%的拥抱面孔模型卡记录了伦理考量. 2023) ・数据集数据表 作为面向不同读者的边界对象──2024-2025年发展:通过LLM自动生成(CardGen,Liu et al. 等同类型的产品量增长率最高29%. 接器,杜杜等 面向碳/水的可持续性报告补充 欧盟/ISO监管卡正在出现――系统卡――Sidhpurwala 2024;Meta 系统级透明度;"信任蓝图" arXiv:2509.20394) 端到端 AI 系统文档,覆盖安全能力、即时注射 防护、数据泄露 检测、与人类价值相一致性――

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18（安全框架），Phase 18 · 24（监管）
**Time:** ~60 分钟

## 学习目标

- 描述米切尔等人2019 原始模型卡 和 Gebru等人2018数据表──
- 描述数据卡的望远镜/太阳镜/微观 分层──
- 描述系统卡及其端到端覆盖范围.
- 发表了3项2024-2025年发展项目自动生成可验证证明可可持续性报告.

## 问题

监管框架 (?? 课 24) 和实验室安全政策 (?? 课 18) 都要求文档――文档格式从面向特定模型 (?? 模型卡) 发展到面向特定数据集 (?? 数据表),再到面向特定系统 (?? 系统卡) ――每个都面对应应不同的透明度――2024-2025年自动化和可验证证明工作,正在解决长期存在的采用问题――

## 概念

### 模型卡 (Mitchell et al. 2019)

章节:
- 模型详细信息
- 预期使用――
- 因素 (用于评估相关人口统计或环境因素)
- 计量量
- 评估数据──
- 培训数据
- 量化分析按因素 分组) 
- 伦理考虑.
- 注意事项和建议.

采用问题:Oreamuno等人对Hugging Face模型卡的审计发现,只有0.3%记录了伦理考量――

### 数据集数据表 (Gebru et al. 2018)

类比电子元件数据表――章节:
- 动机 (为什么创建该数据集)
- 组成的内容
- 收集过程 (如何组装)
- 标签如适用)
- 使用 预期用途 禁止用途 风险)
- 分布
- 维护

发表于CACM 2021年. 数据表是上游文档; 模型卡依赖数据表的准确性.

### 数据卡 (普什卡纳等人,谷歌 2022)

模块化分层细节──三个缩放层次:
- **Telescopic。**面向非专家的高层摘要
- **Periscopic。**面向 ML 实践者 的中层概述
- **Microscopic。**面向审计师的详细特征级文档.

边界对象框架:不同读者从同一文档中提取不同信息.

### 系统卡

范围:端到端 AI 系统,包括模型+安全+部署上下文──章节通常包括:
- 安全能力
- 防护──即即注射
- 检测 检测 检测 检测 检测 检测
- 与声明的人类价值保持一致.
- 事件响应.

根据"信任蓝图" (arXiv:2509.20394) 将系统卡形式化为模型卡在部署层的补充.

### 2024-2025年发展

- **CardGen (Liu et al. 2024)。**通过LLM自动生成模型卡;报告称在标准化米切尔2019年字段上,比许多人类编写的卡片具有更高的客观性.
- **下载相关性 (Liang et al. 2024)。**详细的模型卡与HF上最高29%的下载率上升相关采用压力现在由市场驱动,而不是仅仅是合规驱动.
- **Laminator (Duddu et al. 2024)。**通过硬件TEE/加密签名实现可验证证明允许模型卡携带索赔的证明,而不仅仅是索赔本人.
- **Sustainability (Jouneaux et al. July 2025)。**增加碳、水和计算能源消耗足迹;新兴ISO标准
- **Regulatory cards。**欧盟人工智能法 (EU AI Act) 课 24)GPAI实践法典 透明度 章节要求模型卡 作为合规制品──

### 这是在18期中位置.

课程24-25是监管和CVE层面.课程26是文档层面.课程27是训练数据管理,也就是数据表的上游.课程28是研究生态系统,产出卡 中引用的评估.


```figure
an-card-scopes
```

## 使用它

`code/main.py`会为一个玩具部署生成最小模型卡,数据表和系统卡.

## 交付它

本课产出发 `outputs/skill-card-audit.md`△给出一个模型卡,数据表或系统卡,它会审计章节覆盖,数值分组以及是否存在可验证证证.

## 练习

1. 运行`code/main.py`〔检查生成的卡片〕识别薄弱章节(仅占位符),并说明什么证据可以加强它们──

2. 扩展模型卡,加入两个人口统计群体的量化分组分析 (第20课)

3. 阅读Oreamuno等人2023年关于0.3%的采用率的内容――提出对模型卡规范的结构性改动,以提高道德考虑的采用率――

4. 片器 (Duddu et al. 2024) 使用TEE 进行可验证证明――设计一个模型卡 字段,用于承载某项评估结果的加密证明,并描述验证者的角色――

5. 为你过去的一个项目或一个假想部署编写一个系统卡,而不是模型卡.

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

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) 规范模型卡
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010)数据表论文
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) 分层数据文档
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394)系统卡 形式化
