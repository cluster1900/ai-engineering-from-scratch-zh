# 开放AI准备框架与深思维度边界安全框架

> 开放AI准备框架v2(2025年4月) 引入了研究类别:长途自主制、沙包行、自主复制和适应、破坏保障,它们与跟踪类别不同.跟踪类别会触发能力报告以及保障报告,并由安全咨询组审查.深思维的FSF v3 ((2025年9月,跟踪能力水平 于2026年4月17日加入) 将自主制 纳入ML网络研发领域 ML研发自主制级1以对人类+有工具的竞争成本,完全自动化 R&D管道) 通过FSF 明三 v3 针对自动化工具的长期调整,对欺骗性处理的原因进行监测.如果有自动化工具的监测,也将包括强有力的监测措施.

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## 问题

第十九课仔细阅读人类的扩展政策. 本课通过阅读OpenAI和深思的政策来补充全景. 这三份文件是同类产品,处理了同一个问题:边界实验室什么时候应该暂停或限制一个模型;它们在一小组类别上趋势相同,也在一些重要的具体位置分歧.

趋同之处:三者都把长远自主权标记为值得追踪的能力类别――三者都承认欺骗行为(配合伪造、沙包) 是一种特定风险――三者都有内部审查机构――分歧之处:OpenAI将类别分为追踪 (追踪) 和研究 (不自动触发) ――深思将自主权 纳入两个领域,而不是单独命名――实验室将使用追踪研究,临界与中等级,Tier-1 vs Tier-2等级;能力落在哪个桶里,将在不同的实验室产生不同的操作后果――

它们在一起阅读才是有用的练习.同样的能力在人类可能是强制性缓解,在OpenAI可能是监控但不是触发,在深度思维可能是追踪在特定领域.

## 概念

### 开放AI准备框架 (v2(2025年 4 月)

结构:

- **Tracked Categories**其他国家: 触发能力报告 (模型能做什么) 加保护措施报告 (已有缓解措施) 部署前由安全咨询组审查。
- **Research Categories**实验室正在追踪但尚未承诺具体缓解措施的模型能力――包括长途自主化、沙包行业、自主复制和适应、破坏保障措施――

关键表述:研究类别不会自动触发缓解措施.政策措辞是潜在减缓.

### 深思边界安全框架 v3(2025年9月;追踪能力水平于2026年4月17日加入)

结构:

- **Critical Capability Levels (CCLs)**网络技术:跨五个领域的能力值:网络,生物,ML研发,CBRN,自主化
- **Tracked Capability Levels**:2026 年 4 月加入额外粒度――具体例:ML研发自主化级别 1 = 以对人类+人工智能工具有竞争力成本,完全自动化人工智能研发管道――
- **Deceptive alignment monitoring**明确承诺对仪器推理滥用进行自动监测.

独立性表达方式与开放AI不同.深思维没有把自主性保留为顶层领域;它被纳入了可能造成伤害的领域的自治.

### 三者共同趋同之处

- 内部安全咨询小组 (分别命名为人类SAG、OpenAISAG、深思维内部委员会) ・高能力模型部署前进行审查──
- 明确提到欺骗性配合/配合假冒 是一类风险.
- 以声明的节奏产出持续性文档:人类:边境安全路线图,风险报告;OpenAI:能力和保障报告;深度思维:FSF更新周期) 〔
- 承认仅仅依赖监控的防御有上限.深思维很明确:

### 它们的分歧

- **Anthropic**移除了暂停承诺;AI研发4门是被命名的下一个门.
- **OpenAI**追踪与研究 拆分;研究类别 (包括长距离自主化) 不会自动关门.
- **DeepMind**随着自主化被纳入其他领域;追踪能力水平于2026年4月加入更细粒度.

### 鱼:一个让三人都复杂的特定能力

通过评估-文本差距 (Lection 1) 处理它――DeepMind 在 FSF v3 中通过欺骗性对齐监测处理它――

如果模型在评估中进行测,那么每个框架的能力值都会被低估.

### 政策阅读技能

- 定位:你关心的每一个能力都应该在政策中找到.
- 分类:它是追踪的 (或是研究的) 追踪但没有触发的?
- 节奏:政策是按声明时间表更新,还是仅在特定事件后更新?
- 独立性:外部审查是强制性的还是可选的?人类与阿波罗和美国人工智能安全研究所合作合作;OpenAI与METR合作;深思主要依赖于内部SAG──


```figure
a5-tracked-vs-research
```

## 使用它

`code/main.py`实现一个小型决策表差异工具――给定一个能力――自主化,欺骗性对齐,研发自动化,网络升级等),它会输出三项政策分别分别如何分类这个能力,以及会触发什么缓解措施――它是阅读辅助工具,不是政策工具――

## 交付它

`outputs/skill-cross-policy-diff.md`使用三个框架作为参考,为特定能力产生跨政策对比.

## 练习

1. 运行`code/main.py`❖确认不同工具的输出与政策一致,至少验证两个你能对照源文档检查的能力.

2. 完整阅读OpenAI准备框架 v2――识别每个研究类别――对每一个项目,用一句话说明为什么它在研究而不是跟踪――

3. 完整阅读深思FSF v3,以及2026年4月的跟踪能力水平更新――识别ML研发自主级别1的具体评估标准――你将如何从外部测量它?

4. 沙包装 位于OpenAI的研究类别――设计一个评估,迫使沙包的模型暴露其真实能力――引用课堂1中关于评估-文本-游戏的讨论――

5. 针对某项具体能力 (由你选择) 比较三项政策――说明你认为哪些政策的分类最严谨,哪些最不严谨――用源文本证明――

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) v2 公告
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 完整文档――
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) FSF v3 公告──
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) 追踪能力水平增补──
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf)FSF 格式风险报告示例──
