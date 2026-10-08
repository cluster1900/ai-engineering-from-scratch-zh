#                                                                                                                                                                                                                                                               

> 传统A/B测试不是为不确定性构建的. 关键区别:evals 回答模型能完成这项工作吗? A/B测试 回答用户意意吗?两者都不可缺少;基于氛围检查 发布已结束. 2026年应该测试什么:快速工程 (?? 措辞) 模型选择(GPT-4 vs GPT-3.5 vs OSS;确准率 vs 成本 vs 延迟) 代码参数(温度,顶级p) ⋅真实案例:一个聊天机器人奖励模型 变体带来 +70% 对话长度和 +30% 留存; 下一个科目线实验在奖励功能优化后带来 +1% CTR;Khanmigo 围绕延迟的数学轴线与  断的AI平台:**Statsig**测试,CUPED,一体化.**GrowthBook**开源,仓库本土,贝叶式+频率主义+序列式引擎,CUPED,SRM检查,Benjamini-Hochberg+Bonferroni校正.

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## 学习目标
- 区分评价: 模型能完成这项工作吗?
- 列举三个可测试轴线(快速、模型、参数),并为每个轴线选择指标──
- 解释CUPED、序列测试 和Benjamin-Hochberg多次比较纠正――
- 基于库存SQL 姿态和企业收购立场,在Statsig或 GrowthBook 之间做选择

## 问题
你手工调优化一个系统提示――感觉更好――你发布了它――转换率变化像噪音――你责怪标志――或者你发布了一个新模型,但转换率没有变化是模型退化了,还是变化太小无法检测?你不知道,因为你没有做A/B就发布了――

只有受控的在线实验才能回答这个问题,而且前提是实验有足够的力量,控制不确定性,并对多种比较做校正.

## 概念
### 平均值与A/B测试

**Evals** 离线、带标签集合、法官(rubric、LLM-as-judge或人工) 回答: 在这个固定分布上,输出是否正确/有帮助/安全?

**A/B test** 在线、真实用户、随机分配──回答:新变体是否推动了关键的用户级指标?

两者都需要―― 染前捕捉回归的等价;

### 测试什么

1. **Prompt engineering** 措辞、系统提示 结构、示例──标志:任务成功率、用户留存、成本/请求──
2. **Model selection** GPT-4 vs GPT-3.5-Turbo vs Llama-OSS──指标:精度(任务) +成本/请求+延迟 P99──多目标──
3. **Generation parameters**温度,顶点,max_tokens――标志:任务特定(输出多样性与确定性)

###  方差降低

通过使用预试数据进行控制的实验. 在比较后期之前,先回归掉前期差.

实现: 状态和增长书都实现了.

### 序列测试

经典A/B 假设固定样本量――序列测试 (峰-和决定) 在重复查看时控制错误阳性率――总是有效的序列程序 (mSPRT、霍华德的信心序列) 让你在明确的赢家出现时提前停止――

### 多重比较校正

在 95% 信心下运行 20 个A/B测试,由于偶然而产生一个错误阳性.

###  SRM 样本比率不匹配

如果 50/50 切分实际得到 47/53,说明某处坏了SRM检查会标记它.

### 经济与增长

**Statsig**其他:
- 据悉,该公司的公司已在20050年开始运营.
- 测试序列,CUPED,被保留的人口.
- 融合:特征标志+实验+可观可观性――
- 最适合:团队已经想要打包产品,并且不想开放AI所有权.

**GrowthBook**其他:
- 开源 (MIT);仓库本地(直接从雪/BigQuery/Redshift 读取)
- 语,频率主义,序列性.
- 皮,SRM,Bonferroni,BH纠正――
- 提供自主主或管理云.
- 最适合:仓库-SQL 团队,数据团队控制标标层,希望使用OSS──

### 无确定性让统计效果变得复杂

同一个即时会产生不同输出.传统的功率计算假设IID观测.由于LLM不确定性,有效样本量低于名义样本量.

### 实际案件结果

- 聊天机器人奖励模式 变体:+70% 对话长度+30% 留存――
- 接下来的主题线:奖励函数 优化后 +1% CTR──
- 学会 敏:围绕延迟与数学准确率权衡持续代

### 反模式:凭感觉上线

每一位资深工程师都能说出一个功能,因为感觉更好而没有A/B的情况下发布.

### 你应该记住的数字

- 美国国家政府已收购1.1亿美元,2025年9月.
- 发展书:开源MIT;贝叶式+频率主义+序列化――
- 率降低30-70%──
- 士师不确定性 → +30-50% 样本量缓冲


```figure
mx-sequential-test
```

## 使用它
`code/main.py`模拟一个带有固定边界和序列边界的序列A/B测试――展示序列如何让你提前停止――

## 交付它
本课生成 `outputs/skill-ab-plan.md`△给定功能变化,工作负载,基线,选择平台,门户,样本大小.

## 练习
1. 运行`code/main.py`△对于基线的3%转换,5%升降预期,达到80%功率需要多少样本量?
2. 为一个受监督的医疗保健 客户选择 状态或增长书.
3. 设计一个A/B,测试GPT-4vsGPT-3.5 在成本-每分-提票上表现.
4. 你的卡尼尔通过了,但A/B显示了 -1.2%的转换.
5. 将CUPED应用于一个前期差为后期差 60%的前期.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | “offline test” | 对模型能力的带标签集合评估 |
| A/B test | “experiment” | 面向用户的在线随机比较 |
| CUPED | “variance reduction” | 用前期回归来降低方差 |
| Sequential test | “peek-ok test” | 允许提前停止的 always-valid procedure |
| Multiple comparison | “the family error” | 运行许多测试会放大 false positives |
| Bonferroni | “tight correction” | 将 α 除以测试数量 |
| Benjamini-Hochberg | “BH FDR” | false-discovery-rate 控制，较不保守 |
| SRM | “bad split” | Sample ratio mismatch；分配 bug |
| Statsig | “OpenAI owned” | 商业一体化平台，2025 年被收购 |
| GrowthBook | “the OSS one” | MIT warehouse-native 平台 |
| mSPRT | “sequential probability ratio test” | 经典 sequential procedure |

## 延伸阅读
- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
