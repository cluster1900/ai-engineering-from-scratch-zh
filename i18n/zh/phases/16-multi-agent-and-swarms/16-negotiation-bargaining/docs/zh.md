# 协商与议价

> 经理会协商资源、价格、任务分配和条款──2026年的基准 集合已经很清楚:谈判场 (arXiv:2402.05863) 显示,LLM可以通过人格操纵(绝望) 收益将提高约20%;**OG-Narrator**总体交易率将从26.67%升至88.88%;大规模自主谈判竞赛 (arXiv:2503.06416) 进行约18万次协商,发现**chain-of-thought-concealing**通过对手隐藏推理而获胜;Bhattacharya et al. 2025 基于哈佛谈判项目指标进行排名,Llama-3 最有效,Claude-3 进攻性最强,GPT-4 最公平。本课实现合同网协议(FIPA的前身,课程 02),连接一个LLM风格的买家/卖家,运行OG-Narrator风格的分解,并衡量每个结构选择如何变化成交率。

**类型：**学习 + 构建
**语言：**字符串 (stdlib)
**前置要求：**项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目:
**时间：**约75分钟

## 问题

两位代理人需要达成价格一致. 如果仅依赖于纯语言提示,2024-2026年LLM在协商中成交率非常低.

根本问题在于,LLM 混了两项工作:决定报价和叙述报价.OG-Narrator 将两者分开:确定报价生成器 计算数值移动;LLM 仅负责叙述.成交率跃升到约89%──

这映射了一个经典的多代理发现:将机制层与通信层解会赢.

## 概念

### 一段话理解合同网

史密斯 1980 年的合同网协议:一个 **manager**广播**call for proposals (cfp)**其他**bidders**用包含其提供的**propose**信息 响应;经理 选择获胜者,并向获胜者发送 **accept-proposal**送给失败者**reject-proposal**△获胜者执行工作──可选信息:**refuse**(投标人拒绝提出提案)`fipa-contract-net`互动协议.

### 为什么"大讲者会赢"

观察到: 语言模型的谈判能力测量

- 法律法规经常破坏议价规则,
- 它们的扎 很差(接受糟糕的第一笔报价;反报价使用象征性金额而不是战略性金额)
- 仅靠规模无法修复这些问题.更大的模型会产生更可信的语言,但战略错误相似.

故事讲者 分解:

```
           ┌──────────────────┐        ┌──────────────────┐
  state  → │ offer generator  │ price → │  LLM narrator    │ → message
           │  (deterministic) │        │  (writes the     │
           │                  │        │   human-style    │
           └──────────────────┘        │   accompaniment) │
                                       └──────────────────┘
```

报价生成器是一种经典的协商策略:鲁宾斯坦谈判模型,Zeuthen策略,或围绕价格的简单的图为图.

交换率提升是因为:
- 价格保持在谈判区内――
- 是战略性的,而不是情绪性的.
- 士做它擅长的事:写作.

### 谈判Arena 发现

提供规范基准.

- 我绝望在周五之前销售这个) 收益将提高约20%.
- 公平/合作型代理会被对抗型代理利用;防御需要明显的反向置──
- 对于约40%的基准场景,收获不公平结果.

这不是一个糟糕的协商者,而是一个像人类一样的协商,包括可利用的部分.

### 隐藏的思想链

在许多LLM策略上进行了约18万次协商.

- 如果一个代理在公开可见的片中输出我只会去$75; my reservation price is $七十,对手就会读到它.
- 获胜者私下计算策略;输出通道只包含优惠和最低限度的必要描述.

这就是经典的游戏理论. 艾曼 1976 关于理性和信息. 于 2026 年的回应:暴露你的私人估值会损失收益.

工程结论:将私人抓板背景与公共信息背景分离.

### 马拉斯基和其他2025年 模型 排名

基于哈佛谈判项目指标:

- **Llama-3**在达成交易方面最有效的交易率+收益率)
- **Claude-3**现在,我们要做什么?
- **GPT-4**最公平的分差距 最小的分差距

们的目标不是在2026年4月获胜的模式,而是具有持续存在的协商风格的不同基础模式.

### 通过合同网 + LLM 进行任务分配

合同网 在 LLM多代理 中的现代复用:

1. 经理将任务分解为单元.
2. 使用任务描述向工人代理人 广播 `cfp`,我知道.
3. 每个工人都回报一个报价:`(price, eta, confidence)`价格可以是代币,计算单位或美元.
4. 经理选择获胜者 (单个或多个,取决于任务) 并授予任务.
5. 被拒绝的工人可以自由出售其他任务.

这可以很好地扩展到100多名员工,因为协调方式是播放和响应,而不是同步聊天.

### 合资企业利益相关者互动谈判

果产品https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf) 引入带有**secret scores**和 **minimum-acceptance thresholds**对于各方的各方,各方都有私人公用事业;LLM必须从信息中推断它们.

### 规则 叙述与机制

在所有2024-2026年协商基准中,一致的工程规则是:

> 让LLM负责叙述.

如果报价需要一个数字 (价格,ETA,数量),就根据谈判状态的决定性 生成它,并让LLM 生成框架.


```figure
a5-og-narrator
```

## 构建它

`code/main.py`实现了:

- `ContractNetManager`现在`ContractNetTask`现在`Bid`经理+投标人,广播 cfp,收集建议,授予任务──
- `og_narrator_bargain(state, rng)` OG-Narrator买家:面向中点的定性主义的Zeuthen风格让步──
- `seller_response(state, rng)`定性卖方反报政策 (两种风格的结构性基础真理)
- `naive_llm_bargain(state, rng)`模拟全LLM交易:以高差异 选择价格,且经常落在ZOPA之外
- 测量:在1000次试验上衡量交易率,每次试验都重新采用预订价格.

运行:

```
python3 code/main.py
```

预期输出:无意义的LLM交易率约65-75%;OG讲述者交易率约85-95%;15-25个百分点的差距就是将提供-生成与叙述分开的结构优势――此外还会输出一个包含三个投标者和一个任务的合同网任务市场分配示例――

## 使用它

`outputs/skill-bargainer-designer.md`设计一个议价协议:谁生成的报价,谁负责叙述,谁负责私人剪贴板,

## 发布它

生产议价检查列表:

- **分离 scratchpad。**个人国家永远不能进入对方的背景.
- **Deterministic offer generation。**价格,数量,ETAs:计算,不要快速.
- **验证所有 incoming offers**是否符合方案. 在协议边界拒绝了ZOPA以外的报价.
- **限制 rounds。**最多3-5轮; 截止日期 升级给中介者──
- **持续衡量 deal rate 和 payoff variance。**交易率下降是一种症状,通常是快速漂移或对手攻击.
- **记录所有 rejected proposals**及其决定性理性――对于合同网经理,失败的竞标者需要理解原因――

## 练习

1. 运行`code/main.py`确认OG-Narrator 在交易率上超过天真-LLM――高出多少?
2. 实现**persona-based payoff improvement**买家只在叙述中采用绝望购买本周的人物,报价发电机 保持不变.
3. 实现思想链**concealment**维护一个不会传递给对手的私人抓板链.
4. 如何在最低价格和最高质量的之间做出决定?你会选择哪种奖项规则,为什么?
5. 阅读Bhattacharya等人2025 关于哈佛谈判项目指标内容──实现两种不同风格的讨价还价者──攻击性与公平.──衡量对称和不对称对称的对称.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Contract Net | “任务市场” | Smith 1980，FIPA 1996。cfp + propose + accept/reject。规范任务市场。 |
| ZOPA | “Zone of possible agreement” | buyer 最高价与 seller 最低价之间的重叠区间。其外部的 offers 无法成交。 |
| BATNA | “Best alternative to a negotiated agreement” | 如果本次交易失败，你的后备方案。它设定你的 reservation price。 |
| OG-Narrator | “Offer generator + narrator” | 分解：deterministic offer，LLM narration。 |
| Zeuthen strategy | “Risk-minimizing concession” | 根据风险限制让步的经典 offer-generator。 |
| Rubinstein bargaining | “Alternating-offer equilibrium” | 带 discounting 的 infinite-horizon bargaining 的 game-theoretic model。 |
| CoT concealment | “隐藏你的推理” | arXiv:2503.06416 的获胜者保留 private scratchpads；public channel 只显示 offer。 |
| Persona manipulation | “情绪姿态” | arXiv:2402.05863：从 desperation/urgency personas 获得约 20% payoff gain。 |

## 延伸阅读

- [NegotiationArena](https://arxiv.org/abs/2402.05863)基准;个人操纵和剥削
- [Measuring Bargaining Abilities of Language Models](https://arxiv.org/abs/2402.15813) 经验者,以及买家比卖家更难的结果
- [Large-Scale Autonomous Negotiation Competition](https://arxiv.org/abs/2503.06416)约18万次协商; 思想链隐藏 获胜
- [LLM-Stakeholders Interactive Negotiation (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/984dd3db213db2d1454a163b65b84d08-Paper-Datasets_and_Benchmarks_Track.pdf)带有秘密公用事业的多方可评分博
- [Smith 1980 — The Contract Net Protocol](https://ieeexplore.ieee.org/document/1675516) 经典机制,IEEE 计算机交易
