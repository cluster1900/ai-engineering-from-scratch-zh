# 投票,自主一致性和辩论地图

> 最便宜的集成:采样N个独立代理,然后多数投票―― 2022年Wang等的自律性 用一个模型采样N 次来做这个事物――多代理通过**heterogeneous**为了逃离单种植,不同模式,不同提示,不同温度,不同背景.除了多数投票,辩论拓也很重要:多代理位:ArXiv:2503.01935,ACL 2025) 评估了星/链/树/图表协调,发现**graph 最适合 research**并且超过4个代理人 后会出现协调税──AgentVerse (ICLR 2024) 记录了两种新兴模式,志愿者行为和合规行为,而合规既是一种特征,也是一种风险,集团思维,课 24)──本课会绘制拓空间,构建每个变体,并测量协调税──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**16 · 07期 (思想与辩论),16 · 14期 (共识和BFT)
**Time:** ~75 minutes

## 问题
辩论可以提高准确性, 辩论是否有帮助,取决于四个结构选择:

1. 谁和谁对话 (图形)
2. 许多轮:从2023年到2023年,
3. 机器人是否异性?
4. 否否存在反对的声音 ((钢铁制造与草制造)

运行5个代理和投票硬接到任务上的团队,常常比单个代理更差.失败不是随机的.

## 概念
### 单个模型的基线

张等. 2022(自律改善思想推理链) 在温度 > 0 时对同一个模型采样 N 次,并对推理路径答案做多数投票的;;GSM8K 上的结果是:N=40样本相比单个贪解码 有显著提升;;自律是多代理投票的单代理前身──

限制:自律 使用一个基模型――错误在结构上就是相关的――如果模型有系统偏见,所有N个样本都会共享它――

### 多代理投票,异性扩展

用N个不同代理 替换N个样本――不同基模型――Claude、GPT、Llama)、不同提示、不同工具访问──收益:不相关错误──成本:不同代理的成本不同;协调它们会增加总费――

异质辩论在2026年的正义名称是**A-HMAD**论文会用它表示不同的模型辩论,这减少了单种植崩的相关错误──

### 四种拓物

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

星球:一个中心,所有其他代理人只和一个中心对话.
链:线性结构,每个代理 看到前一个代理的输出――类似的管道――
树:层级结构,由层次代理系统使用 (教训6) 👇
图:任何与任何的──包括完全连接的小伙子和任意的DAGs──

### 协调税 (多代理银行)

许多代理商的位:MARBLE,ACL 2025,arXiv:2503.01935) 在一个包含研究,编码和规划的任务套件上,

- **Graph**据了解,在研究任务中,任何人都可以互相批评.
- **Star**在快速回答的事实任务上获胜──Hub 负责过和巩固──
- **Chain**在逐步的管道中,
- **Coordination tax**在图形拓中出现了4个代理人.

据了解,每一个代理的环境被同行的产品填满,一旦每个人都能看到所有人,增加代理N+1的边际值就会下降.

### 关于多代理辩论策略?

其他研究复现的关键发现:与自相一致性相似的结构MAD变体(独立采样+集成),在相同的预算下通常不像自相一致性――只有当代理人真正异质,且辩论 具有对抗性结构时,MAD最大的帮助――

### 代理 变化模式

据了解,https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf）记录了许多代理商的辩论中,即使没有显而易见的设计也会出现两种行为:

- **Volunteer。**工作是为了让一个应对某个小任务的代理人.
- **Conformity。**经理调整自己的立场来匹配批评者,即使批评者是错的.

根据 解释为什么辩论到达协议 会奖励欺凌者―― 限制轮子加上独立法官可以缓解――

### 异质性:真正推动精确的旋转

2024-2026年实用文献中的一种模式:把N个代理中的一个换成不同的基模型,带来的精度提高通常大于把N增加1──直觉是单元文化,每一个新的独立错误来源都比额外的相关样本更有价值──

在极限情况下,异质性胜过多数性. 在大多数情况下,有清晰的基础真理任务上,三个不同的模型胜过一个模型的五份副本.

### 评审团的方法

根据"西比尔框架" (在明斯基-LLM文献中被引用) 形式化了一个陪审团,即一小组专业代理人,在每个阶段通过投票来精细答案.

### 投票与辩论主导

- 问题有基础的真理 (事实,数学,代码行为) 投票融合是有意义的.
- 代理人可以访问不同的来源或工具 (可使用异性).
- 轮子有上限 (通常是2-3),并且有独立的评委或验证者.
- 预算允许3-5个代理商. 在图形上,超过5-7个代理商.

### 投票与辩论伤害时

- 问题呈现出意见的形状. 代理会收到看起来最自信的答案,而不是最正确的答案.
- 所有的代理人共享一个基本模式――单元文化让共识失去意义――
- 轮子无限. 符合性每次都会赢.
- 任务很简单――使用N=5自律的单个代理 更便宜,精度也差不多――


```figure
sw-debate-topology
```

## 构建它
`code/main.py`实现:

- `run_star(agents, hub, question)`中心 轮询每一个工人并总结.
- `run_chain(agents, question)`连续精炼――
- `run_tree(root, children, question)`深度-2集成的等级结构
- `run_graph(agents, question, rounds)`全面辩论,有限轮回――
- 一个编写的异质调用器:每个代理都有一个`error_bias`表明其系统性错误.
- 一个测量带,在N=3、5、7 下运行每种拓,并报告了(精度、总_标志、墙钟_模拟) ⋅

运行:

```
python3 code/main.py
```

预期输出:一张拓 × N →(准确度、标志、延迟) 表――图 在 N=3-5 的研究风格任务上获胜;星在快速事实任务上获胜;N=7 的图表 显示协调税(延迟膨胀速度快于准确性) ⋅

## 使用它
`outputs/skill-topology-picker.md`是一个技能,它读取任务描述,并推拓 (星/链/树/图)

## 交付它
对于任何一个团队:

- 从使用一个强大的基模型的**self-consistency at N=5**开始――这是便宜的基线――
- 如果准确性很重要,升级到**heterogeneous voting at N=3**测量三角洲
- 只有当任务有结构,研究多步骤,且有限轮子可行时,才升级到**debate topology**,我知道.
- 始终记录少数群体. 当少数群体持续正确时,你就有了多样性信号.
- 在准确性旁边同时标记墙钟和代币──10x 成本换来更高的准确性是一个商业决定──

## 练习
1. 运行`code/main.py`△绘图图形 topology 的协调税曲线:准确性与 N、代币与 N──曲线在什么 N 处曲线?
2. 实现A-HMAD:三个带有意图不同的偏见的代理人. 在14课单种攻击上,所有偏见的基线与A-HMAD相比如何?
3. 给图表的拓学 添加一个评审角色,它不投票,只对最终共识打分.
4. 阅读 AgentVerse 论文 ((ICLR 2024) 』.识别你的实现最强烈的表现是什么新兴行为――你能通过快速变化引发相反的行为吗?
5. 阅读多代理Bench(arXiv:2503.01935) 第4节 (图博学实验)  用你的在论文中的一个任务上复现图表-获奖-研究结果──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-consistency | “Sample N times, vote” | Wang 2022。Single model，N 个 temperature>0 samples，对 reasoning paths 做 majority vote。 |
| Heterogeneity | “Different models” | 由不同 base models 或 prompt families 组成的 ensemble。打破 monoculture。 |
| MAD | “Multi-agent debate” | agents 在多个 rounds 中交换 critiques 的通用术语。见 Du 2023。 |
| A-HMAD | “Adversarial Heterogeneous MAD” | 强调不同 models + adversarial structure 的 MAD variant。 |
| Topology | “Who talks to whom” | Star、chain、tree、graph。决定 information flow。 |
| Coordination tax | “Diminishing returns” | 在 graph 上超过约 4 个 agents 后，cost 增长快于 quality。 |
| Volunteer behavior | “Unprompted help” | AgentVerse emergent pattern：agent 主动提出承担一个 step。 |
| Conformity behavior | “Agreement under pressure” | AgentVerse emergent pattern：agent 与 critic 对齐。 |
| Jury | “Small specialized panel” | 带 roles（examiner、context、scorer）的 Sibyl-style ensemble。 |

## 延伸阅读
- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171)单个模型的基准
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325)代理和轮子都独立重要
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935)拓基准,显示图 最适合研究,链 适合管道
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) MAD战略调查;发现同等预算 下 MAD 通常输给自律性
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf)志愿者和符合性新出现模式
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) 参考基准实施
