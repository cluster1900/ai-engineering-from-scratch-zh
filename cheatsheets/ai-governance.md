---
id: ai-governance
title: Cards, Provenance, Regulation and Welfare
code: CP
subtitle: EU AI Act 时间线、四种监管体制、三类卡片、AB 2013 字段、福祉期望值与外部评估机构。
hue: 30
sources: phases/18-ethics-safety-alignment/19-model-welfare-research, phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea, phases/18-ethics-safety-alignment/26-model-system-dataset-cards, phases/18-ethics-safety-alignment/27-data-provenance-training-governance, phases/18-ethics-safety-alignment/28-alignment-research-ecosystem
source_hash: 96dcbbdf572f3a15
---

## EU AI Act 时间线
type: flow
from: phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md, phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/code/main.py

1. **2024 年 8 月 1 日**：EU AI Act 生效。
2. **2025 年 2 月 2 日**：禁止性做法与 AI 素养要求开始适用。
3. **2025 年 8 月 2 日**：GPAI 与治理义务开始适用。
4. **2025 年 7 月 10 日**：GPAI 行为准则（Code of Practice）。3 章，12 项承诺。
5. **2025 年 12 月 17 日**：第 50 条透明度准则（Transparency Code）首份草案。
6. **2026 年 8 月 2 日**：全面适用，包括第 50 条透明度义务与罚则。
7. **2027 年 8 月 2 日**：存量 GPAI 与嵌入式高风险系统。

## 四种监管体制并排对比
type: comparison
span: 2
from: phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md

| 维度 | 欧盟 | 美国 | 英国 | 韩国 |
|---|---|---|---|---|
| 机构或法律 | EU AI Act | NIST 下属的 CAISI | AI Security Institute | AI 框架法（AI Framework Act） |
| 关键日期 | 2024 年 8 月 1 日生效 | 2025 年 6 月更名 | 2025 年 2 月更名 | 2026 年 1 月施行 |
| 姿态 | 严格，按风险分级 | 偏向促进增长 | 聚焦狭义安全 | 由 MSIT 主导 |
| 主要义务 | 风险分级、第 50 条标注 | 标准与创新 | 前沿能力安全 | 外国 AI 公司须设本地代表 |
| 补充 | 罚款最高 15M EUR 或 3% | 各州填补联邦空白 | 开源了 Inspect | 整合了 19 项 AI 法案 |
| 信号 | 隐私相关监管的标杆 | 部署前评估减少 | 去掉偏见与言论自由框架 | 第 12 条：MSIT 下设 AISI |

## EU AI Act 风险分级
type: concepts
from: phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md

- **禁止（第 5 条）**：社会评分、在公共场所进行实时远程生物特征识别。
- **高风险（附件 III）**：就业、教育、信贷、执法、司法、移民。
- **高风险义务**：合格评定、风险管理、日志记录、透明度。
- **GPAI**：自 2025 年 8 月 2 日起，所有 GPAI 提供者都负有义务。
- **系统性风险 GPAI**：训练算力超过 1e25 FLOP。估计有 5-15 家公司。
- **有限风险**：AI 生成内容需按第 50 条标注。
- **准则各章**：透明度与版权两章约束所有 GPAI。安全与安保一章约束系统性风险 GPAI。

## 卡片的适用范围
type: architecture
from: phases/18-ethics-safety-alignment/26-model-system-dataset-cards/docs/en.md, phases/18-ethics-safety-alignment/27-data-provenance-training-governance/docs/en.md

```arch
node | prov | 1,1 | Data provenance | AB 2013, TDM opt-out | store
node | sheet | 2,1 | Datasheet | Gebru et al. 2018
node | model | 3,1 | Model Card | Mitchell et al. 2019 | model
node | sys | 4,1 | System Card | model + safety stack
node | dcard | 2,2 | Data Card | telescopic, periscopic, microscopic
node | reg | 4,2 | GPAI Code | Transparency chapter
edge | prov | sheet | upstream
edge | sheet | model | accuracy
edge | model | sys | deployment
edge | sheet | dcard | layered
edge | reg | model | requires
```

## 运行课程代码
type: command-table
from: phases/18-ethics-safety-alignment/19-model-welfare-research/code/main.py, phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/code/main.py, phases/18-ethics-safety-alignment/26-model-system-dataset-cards/code/main.py, phases/18-ethics-safety-alignment/27-data-provenance-training-governance/code/main.py, phases/18-ethics-safety-alignment/28-alignment-research-ecosystem/code/main.py

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` (L19) | 打印每项干预的 EV，以及 INVEST 或 skip |
| `python3 code/main.py` (L24) | 打印监管 `TIMELINE` |
| `python3 code/main.py` (L26) | 打印一份模型卡、一份 datasheet、一份系统卡 |
| `python3 code/main.py` (L27) | 打印 12 项的 AB 2013 摘要 |
| `flag_followups(summary)` | 列出各字段触发的后续义务 |
| `render_markdown(summary)` | 为空字段写入 `(missing)` |
| `python3 code/main.py` (L28) | 打印五家机构的 `ECOSYSTEM` 映射 |

## AB 2013 第 3111(a) 节字段
type: annotated-code
lang: python
from: phases/18-ethics-safety-alignment/27-data-provenance-training-governance/code/main.py, phases/18-ethics-safety-alignment/27-data-provenance-training-governance/docs/en.md

```python
AB_2013_FIELDS = [
    "sources_or_owners",                            # 1
    "how_dataset_furthers_intended_purpose",        # 2
    "number_of_data_points (or range)",             # 3
    "types_of_data_points (label types or general characteristics)",  # 4
    "purchased_or_licensed (Y/N)",                  # 6
    "cleaning_processing_or_modification_description",  # 9
    "dates_first_used_during_development",          # 11
    "uses_synthetic_data_generation (Y/N)",         # 12, new vs datasheets
]
# 5 copyright flag: respect EU TDM opt-out
# 7 personal information flag: triggers CPRA obligations
# 8 aggregate consumer information, 10 collection time period
```

## 福祉期望值
type: annotated-code
lang: python
from: phases/18-ethics-safety-alignment/19-model-welfare-research/code/main.py

```python
def ev(intervention, scenario):
    return (intervention.benefit_if_welfare_matters
            * scenario.moral_patienthood_probability
            - intervention.cost_usd_per_conversation)
verdict = "INVEST" if v > 0 else "skip"   # invest iff EV > 0
Intervention("end-conversation on extreme edge cases", 0.002, 1.0)
Intervention("shutdown deployed model", 1000.0, 2.0)
Scenario("low moral-patienthood probability", 0.01)
Scenario("high moral-patienthood probability", 0.50)
```

## 需要知道的数字
type: defaults
from: phases/18-ethics-safety-alignment/19-model-welfare-research/code/main.py, phases/18-ethics-safety-alignment/26-model-system-dataset-cards/docs/en.md, phases/18-ethics-safety-alignment/27-data-provenance-training-governance/docs/en.md, phases/18-ethics-safety-alignment/28-alignment-research-ecosystem/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 结束对话的成本 | 0.002 | L19 代码中每次对话的美元成本 |
| 道德受体概率 p | 0.01 | 中档 0.10，高档 0.50 |
| 含伦理考量的卡片 | 0.3% | Hugging Face 审计，Oreamuno et al. 2023 |
| 详细卡片带来的下载提升 | 最高 29% | Liang et al. 2024 |
| AB 2013 公开日期 | 2026 年 1 月 1 日 | 适用于 2022 年 1 月 1 日及之后发布的系统 |
| 新增限制的头部来源 | 约 25% | 2023 -> 2024，Consent in Crisis |
| MATS 规模 | 527+ 名研究人员 | 180+ 篇论文，h-index 47 |
| 从事安全工作的 MATS 校友 | 约 80% | 2025 年以前的校友 |

## 故障排查
type: troubleshooting
span: 2
from: phases/18-ethics-safety-alignment/27-data-provenance-training-governance/docs/en.md, phases/18-ethics-safety-alignment/27-data-provenance-training-governance/code/main.py, phases/18-ethics-safety-alignment/26-model-system-dataset-cards/docs/en.md, phases/18-ethics-safety-alignment/19-model-welfare-research/docs/en.md, phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md, phases/18-ethics-safety-alignment/28-alignment-research-ecosystem/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 请求删除已进入权重的数据 | 无法精准擦除 | 在采集时就合规。遗忘学习只能部分做到 |
| 数据集含个人信息 | AB 2013 第 7 项 | 履行 CPRA 义务 |
| 数据集含受版权保护的材料 | AB 2013 第 5 项 | 尊重欧盟 TDM 退出信号 |
| 卡片中的声明没有证据 | 卡片只承载声明 | 加上可验证的证明（Laminator） |
| 福祉自我报告随提问方式而变 | 自我报告会迎合用户预期 | 使用行为、模式生物和探针 |
| 实验室评估自家模型 | 结构性利益冲突 | 引入外部评估机构 |
| 部署跨越多个司法辖区 | 各辖区规则不同 | 按最严格的规则合规，通常是 EU AI Act |
| 模型卡只有占位内容 | 各节内容薄弱 | 加上分组的定量分析 |

## 各类卡片的使用时机
type: tips
from: phases/18-ethics-safety-alignment/26-model-system-dataset-cards/docs/en.md

- 用 Model Card 记录模型：预期用途、因素、指标、分组分析。
- 用 Datasheet 记录数据：动机、构成、采集、标注、用途、分发、维护。
- 读者不同时用 Data Card：给非专家看的望远镜视角，给审计者看的显微镜视角。
- 用 System Card 记录部署：安全、提示注入防护、数据外泄检测、事件响应。
- 为碳、水和计算能耗足迹加上可持续性字段。

## 缩写
type: glossary
from: phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md, phases/18-ethics-safety-alignment/27-data-provenance-training-governance/docs/en.md, phases/18-ethics-safety-alignment/28-alignment-research-ecosystem/docs/en.md

- **GPAI**：General-Purpose AI（通用 AI）。大型基础模型。
- **CAISI**：Center for AI Standards and Innovation。由美国 AISI 更名而来。
- **MSIT**：Ministry of Science and ICT（韩国科学技术信息通信部）。韩国 AISI 的主管部门。
- **TDM**：text-and-data-mining（文本与数据挖掘）。欧盟版权指令中可退出的例外条款。
- **CPRA**：Privacy Rights Act。由 AB 2013 第 7 项触发。
- **MATS**：ML Alignment & Theory Scholars。导师制与人才输送项目。
- **METR**：Model Evaluation and Threat Research。基于任务的能力评估。
- **退出信号**：robots.txt、C2PA "No AI Training," TDM.Reservation。

## 问答
type: qa
from: phases/18-ethics-safety-alignment/19-model-welfare-research/docs/en.md, phases/18-ethics-safety-alignment/27-data-provenance-training-governance/docs/en.md, phases/18-ethics-safety-alignment/28-alignment-research-ecosystem/docs/en.md

- **模型福祉是关于意识的主张吗？** 不是。它是道德不确定性下的期望值主张。
- **Claude Opus 4 和 4.1 上线了什么？** 它们可以在极端边缘情况下结束对话。
- **什么是精神极乐吸引子（spiritual bliss attractor）？** 成对的 Claude 实例会收敛到冥想式的狂喜状态。
- **正当利益需要同意吗？** 不需要。按 2025 年 DPA 的观点，带退出机制的公开第一方内容就足够。
- **实验室之外谁在做什么？** Redwood：AI Control。Apollo：scheming 评估。Eleos：福祉评估。
- **为什么需要外部评估？** 多机构结构本身就是质量控制。
