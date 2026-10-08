# 评估与协调 基准

> 五个2025-2026年指标 涵盖多代理评估空间**MultiAgentBench / MARBLE**根据"国际数据库"的数据,该数据库的数据量和数据量均为:**graph 最适合 research**认知规划 提高了约3%的里程碑成就.**COMMA**评估多模式不对称信息协调;包括GPT-4o 在内的最先进模型很难超过随机基线――**MedAgentBoard**医疗任务的四类,并且经常发现多代理并不是优于单一LLM.**AgentArch**创业代理架构结合工具使用+内存+调整**SWE-bench Pro**([arXiv:2509.16941](https://arxiv.org/abs/2509.16941)) 包含41个备忘录中1865个问题,覆盖商业应用程序,B2B服务和开发工具;边界模型在Pro上约23%,而在Verified上超过70%**64.3%**并显然使用代理团队协调 尚未发布 预视为初步结果 预视为初步结果 预测 经验 经验 经验 经验 经验 达到**76.1% pass@1**([Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report)**AAAI 2026 Bridge Program WMAC**(https://multiagents.org/2026/）是2026年社区焦点──本课基于 MARBLE 的指标,运行拓与指标扫描,并固定仅通过SWE-台验证 不是通用化证据 这条规则──

**类型：**学习
**语言：**字符串 (stdlib)
**先修：**16 · 15阶段 (投票和辩论主题),16 · 23阶段 (失败模式)
**时间：**约75分钟

## 问题

当一篇论文声称我们的多代理系统更好时,问题是:比什么更好?在哪些任务上更好?如何衡量?2023-2024年多代理评估很混乱每个人都选择自己的指标,自己的基线和自己的任务集.

没有共享基准,你无法有意义地比较两个多代理系统――更糟糕的是,没有持久基准,边界模型可能会受到污染――到2025年中,SWE-bench已被部分进入训练语料,受到污染;边界分数膨胀;Pro被设计成未污染的现实检验――

本课列举2026年五个法典标准,说明每个标准 衡量什么,并教你怀疑态度阅读标准要求――

## 概念

###          

在研究,编码和规划任务上评估四种协调拓 (星,链,树,图) 基础上的关键标识跟踪部分进展,而不仅仅看最终成功.

测量结果:

- **Graph**支持任何批评.
- **Chain**最适合步骤精炼编码.
- **Star**最适合快速实事整合.
- **Coordination tax**在图上出现了4个代理人.
- **Cognitive planning**在各类拓上增加了约3%的里程碑成就.

使用场景:你想对协调拓进行果对果比较──MARBLE repo(https://github.com/ulab-uiuc/MARBLE）提供评价员

### COMMA  多型非对称信息

覆盖代理 具有不同的观察方式,并且必须在没有完整的信息共享的情况下协调任务. 报告结果不适合:包括GPT-4o在内的边界模型在COMMA的代理-代理合作上很难超过**random baseline**信号是:多代理模式 训练不足,评估不足  LLM 能更合理地处理单模式合作;多模式协调 会崩。

使用场景:你的系统具有多模或不对称信息协调──COMMA的零结果是一个警告:先衡量,再声称──

### 域压力测试

医疗任务:诊断,治疗规划,报告生成,患者沟通,多代理,单独的LLM和传统规则系统

发现:多代理在大多数类别上并不优于单独LLM──多代理优势很窄 当子任务可以清晰分离时(诊断 +治疗),任务分解有帮助;当协调总费 超过专业化获益时(报告生成),它会伤害效果──

使用场景:你的域名有明确的单个LLM基线. 如果MedAgentBoard的经验可以概括,那么许多拟议的多代理系统都过于工程.

### 公司架构

参数 隔离每层次的贡献:添加工具有多大帮助?添加内存?添加多代理配套?

使用场景:你正在设计企业代理堆,并需要证明每个层次的合理性.

### 现实检验

设计目标是对较晚的训练截止时间保持**未污染**△边界模型在Pro上约23%,而在Verified上超过70%――这一差距就是污染信号――

时间:2026 年 4 月分数:
- 克劳德·奥普斯 4.7 在Pro: **64.3%**(报告称显式使用代理团队协调;尚未发布人类初始来源  先视为初步结果)
- 经验证: **76.1% pass@1**([technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report)
- 不使用代理架架 的边界原始分数在Pro: ~23-35%([SWE-bench Pro paper](https://arxiv.org/abs/2509.16941)

关键:我们击败了SWE-bench 验证不再是能力证据──Pro 是当前的门测试──Agent-team 架构在 Pro 上产生可衡量的收益 ((约 30-40 分分德拉),这是 2026 年支持多代理协调的最强实验论点之一──

### 美国航空航天局2026 WMAC

 关于多代理协调工作坊https://multiagents.org/2026/）。这是2026年多代理AI研究的社区焦点――接受论文和研讨会程序是评估新方法的正规场所;做生产决策时,应优先参考WMAC接受的要求,而不是 arXiv预印――

### 借疑态度阅读基准索赔 2026 检查清单

当有人声称一个多代理结果时:

1. **哪个 benchmark，哪个 split？**报告的数字是无价值的.
2. **Contamination check。**如果没有,应谨慎待遇.
3. **Baseline comparison。**与单个LLM基线,随机,之前的多代理工作比较.
4. **Statistical significance。**测试,p值,信任间隔.
5. **Task diversity。**总体化对生产很重要.
6. **Cost disclosure。**按任务的代币,墙钟.

### 当前的基准都衡量不好的内容

- **Long-horizon coordination。**持续数天的墙钟互动――当前所有基准都很短――
- **Adversarial resilience。**当一个代理是恶意或被攻击时会发生什么?
- **Drift under deployment。**标准是静态的;生产分布会变化.
- **Cost-normalized performance。**大多数基准指标报告原始准确性,而不是每美元的准确性.

建立自己的内部基准,通常是正确的做法.


```figure
a5-bench-gap
```

## 构建它
`code/main.py`是一个非互动的通行:

- 在玩具任务上模拟3个多代理系统.
- 为每一个系统计算了MARBLE风格的里程碑指标.
- 通过从培训集中押任务来运行污染检查.
- 显式比随机基线――
- 打印基准索赔成绩单

运行:

```bash
python3 code/main.py
```

预期输出:系统成绩卡,包含原始精度,里程碑成就,成本每任务,与随机基线分别,以及污染检查说明.

## 使用它
`outputs/skill-benchmark-reader.md`读取任意多代理基准索赔,并应用审查检查清单──输出:级和警告──

## 交付它
生产评估纪律:

- **构建 internal benchmark**公共基准可以提供信息,但不能替代它.
- **在每次比较中包含 random baseline。**如果在协调任务上不能大幅度超过随机,那么任务可能定义不好.
- **同时报告 cost 和 accuracy。**代币成本和墙钟――行动团队 两者都需要――
- **每季度重建 benchmark。**产量分布 会变化;陈旧基准 会误导――
- **避免 published-benchmark overfitting。**如果你的团队专注于优化SWE-bench Pro 数字,你会在生产中退出.

## 练习

1. 运行`code/main.py`△ 找出三个模拟系统中哪个具有最佳成本/里程碑―― 它是否符合最高的原始精度系统?
2. 阅读多代理位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位位
3. 阅读SWE-bench Pro论文. 它如何能抵御污染? 同样技术能否适用于您关心的其他基准?
4. 阅读COMMA 关于多元协调的发现――设计一个可以加入内部基准的简单多元协调任务――什么可以算作有用信号?
5. 根据最近的一篇多代理论文的标题结果,你会给这个索赔什么评分?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025；带 milestone KPIs 的 star/chain/tree/graph topologies。 |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination；frontier models 相比 random 表现吃力。 |
| MedAgentBoard | "Domain stress test" | 四个医疗类别；经常发现 multi-agent 并不优于 single-LLM。 |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration 分层组合。 |
| SWE-bench Pro | "Contamination-resistant" | 1865 个问题、41 个 repos；在 Verified 上约 23% vs 70%+（contamination signal）。 |
| Milestone achievement | "Partial credit" | 奖励进展而不只奖励最终成功的 benchmarks。 |
| Contamination | "Benchmark leaked into training" | 发布后，benchmarks 进入训练语料；分数膨胀。 |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination；社区焦点。 |

## 延伸阅读

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) 带标志性KPIs的拓基准
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE)参考实施
- [MedAgentBoard](https://arxiv.org/abs/2505.12371)域压力测试;多剂通常不优于
- [AgentArch](https://arxiv.org/abs/2509.10769)企业代理架构
- [SWE-bench leaderboards](https://www.swebench.com/)边境模型的验证和支持 分数
- [AAAI 2026 WMAC](https://multiagents.org/2026/) 2026 年社区焦点
