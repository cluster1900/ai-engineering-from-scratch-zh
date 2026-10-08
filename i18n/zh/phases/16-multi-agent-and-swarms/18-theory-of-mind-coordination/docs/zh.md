# 思想理论与现象协调

> 表明,合作型文本游戏中的LLM代理会表现出**涌现式高阶 Theory of Mind**推理另一个代理对第三个代理 信念的信念 由于上下文管理和幻觉,在长程规划上会失败.**只有**简单的条件会产生与身份相关的分化和目标导向的互补性;低能力的LLM只表现出伪涌现. 也就是说,协调涌现依赖于简单的条件和模型,并不是免费得到的. 本课实现一个最小的TOM知情的代理,在没有TOM的提示的情况下运行一个合作任务,并按照Ridl 2025协议测量协调差异.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**16 · 07阶段 (思想与辩论社会),16 · 17阶段 (生成代理人)
**Time:** ~75 minutes

## 问题

协调经常看起来很奇怪:代理 分工、预判彼此、避免重复──通常这种涌现是快速工程的产品 有人告诉代理人要协调──移除快速,协调也随之消失──

根据2025年的发现更严格:在受控条件下,只有当代理人被提示推理时**其他 agents 的 minds**对于生产环境来说,这是很重要的:团队发布的多代理协调功能往往依赖于快速且很脆弱.

本课把TOM视为一种具体能力,构建一个最小的TOM意识的代理,并测量真实的协调与快速修饰表现之间的差异.

## 概念

### 你是什么

发展心理学:3岁儿童认为任何人的内在世界都与自己一致.5岁儿童理解他人有不同的信念,7岁儿童会推论关于信仰的信念她认为我认为球在杯子下面) .这些分别是零阶段,一阶段和二阶段 ToM。

对于LLM代理人而言,

- **Zeroth-order:**没有别人的模型. 只有根据自己的观察行动.
- **First-order:**艾丽丝相信X.
- **Second-order:**艾丽丝认为勃相信X.

李等人发现,一阶和二阶 ToM 会在合作游戏中的LLM代理人涌现,但会随着长远的视野和不可靠的通信而退化.

### 简述 萨利-安妮测试

一个1985年的虚假信仰测试:萨利把一颗珠放进篮子A,然后离开.

时代GPT-4的LLM在直接提出的萨利-安妮式测试中可以通过. 当故事长久,场景多次变化,或问题以间接的方式表达时,它们会失败.

### 雷德尔的协调测量

构建一个群体规模测试:N 个代理,一个合作目标,可变快速条件――测量:

1. **Identity-linked differentiation.**代理人是否随着时间形成稳定的角色区分?
2. **Goal-directed complementarity.**代理的行动是否互补不同子任务),而不是重复?
3. **Higher-order synergy.**一个统计量,用来判断群体是否实现了任何子集体都无法实现的结果.

结果:只有在ToM提示条件下,三个指标才全部产生高于基线的信号――没有ToM提示时,中等能力模型的指标接近随机――在没有明显ToM提示的情况下,大型模型也会表现出一些协调,但效果小于明显提示――

### 协调幻觉

没有统计控制时,演示中起的协调通常反映在:

- 快速工程 把协调内置进去 系统提示 写着一起工作)
- 观察者偏差 (我们会看到自己期待的模式)
- 后选择成功运行.

如果生产系统在没有可测信号的情况下宣传新兴协调,应将其视为销售.

### 一个最小的TOM知情的代理人

结构:

```
agent state:
  own_beliefs:    {facts the agent believes}
  other_models:   {other_agent_id -> {beliefs_the_agent_attributes_to_them}}
  actions_last_N: [history of others' actions]

observation update:
  - update own_beliefs from direct observation
  - update other_models[agent_id] from their action + prior beliefs

action selection:
  - enumerate candidate actions
  - for each, predict what each other agent will do next given their modeled beliefs
  - pick action that maximizes joint outcome under those predictions
```

`other_models`属性就是一个阶段的状态.`other_models[i][other_models_of_j]`我认为代理人我认为代理人相信什么.

### 为什么长视线会受损

李等人记录了:文本限制会导致代理人忘记哪个信念属于谁.

论文和2024-2026 后续研究中记录的缓解方式:

- **在 prompt 中显式写出 ToM state.**结构化格式:`{agent_id: belief_list}`强制检索 保留身份-信念绑定
- **更短的 reasoning chains.**每次更少的TOM更新可以减少幻觉.
- **外部 ToM store.**在LLM背景下 之外维护模型;每轮只注入相关部分.

### 在生产中会失败

- **Adversarial settings.**具有良好的TOM代理人更容易被操纵.
- **Heterogeneous teams.**当模型不同时,适用于对手的TOM模型 不会普遍化.
- **Ground-truth-dependent tasks.**关注信念;如果正确性取决于事实,

### 你实际能测量的协调

判断团队协调是真实的,而不是快速修改的三个实用信号:

1. **Complementarity over time.**在多轮任务中,代理的行动是否覆盖不重叠的子任务?
2. **Anticipation.**代理 A 在转换T+1的行动是否依赖于B 在T+2的行动预测,然后预测被证明是正确的?
3. **Correction.**当A在转变T误读B的信念时,A是否在转变T+2前纠正?

这些都在带日志的多代理系统中测量.


```figure
sw-theory-of-mind
```

## 构建它

`code/main.py`实现:

- `ToMAgent`随着自己的信念和其他每个代理人的信念模型.
- 一个合作任务:三个代理必须从三个盒子中收集三个代币;每个盒子只能容纳一个代币.
- 两种配置:`zeroth_order`没有`first_order`没有什么可说的.
- 在200次随机试验上测量:完成率、重复率(两个代理 目标为同一盒子) 平均完成轮数――

运行:

```
python3 code/main.py
```

预期输出:零顺序代理会以约35%的比例重复努力,并在10轮内完成约60%的试验.

## 使用它

`outputs/skill-tom-auditor.md`检查快速修改 对控制的统计显著性以及已测量的互补性.

## 发布它

协调声明检查列表:

- **Control condition.**你的系统删除了协调提示后版本.
- **Statistical test.**在你的指标上,系统与控制的区别是否存在?`p < 0.05`显著吗?
- **Complementarity measure.**随着时间的行动不重叠,而不是最终成功.
- **Failure-case log.**当代理协调失败时,你的状态是什么样子?
- **Model-capacity disclosure.**如果效果在较小的模型上消失,就清楚说明.

## 练习

1. 运行`code/main.py`确认一阶段的重复率将降低7倍左右.
2. 实现第二阶段 ToM 代理 A 建模 B 如何看待C) ――它比一阶段更好吗?在哪些任务上?
3. 进入一个国家**hallucination**任何一个阶段的性能会下降多少?
4. 阅读Li等 (arXiv:2310.10701) 〔复现长视线降解发现:当轮数从10增加到30时,你的一阶段 ToM 性能如何变化?
5. 阅读Ridl 2025 (arXiv:2510.05174) ―― 在你的模拟日志上实现更高的协同数值统计――没有TOM即时条件时,这个效果是否存在?

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Theory of Mind | “理解他人的 minds” | 建模另一个 agent 信念的能力。按阶数分级（0、1、2+）。 |
| Sally-Anne test | “false-belief test” | 1985 年发展心理学；LLMs 能通过简单版本，但会在复杂版本失败。 |
| First-order ToM | “A believes X” | 建模一个他人关于事实的信念。 |
| Second-order ToM | “A believes B believes X” | 更深一层的递归建模。 |
| Identity-linked differentiation | “随时间保持稳定角色” | Riedl 的指标：角色持续存在，而不是随机。 |
| Goal-directed complementarity | “不重叠行动” | agents 目标指向不同子任务，而不是同一个。 |
| Higher-order synergy | “群体超过任何子集” | Riedl 用于真实协调的统计度量。 |
| Coordination illusion | “看起来协调” | 没有可测信号的 prompt 修饰式协调表象。 |

## 延伸阅读

- [Li et al. — Theory of Mind for Multi-Agent Collaboration via Large Language Models](https://arxiv.org/abs/2310.10701) 合作游戏中的涌现式 长视野失败模式
- [Riedl — Emergent Coordination in Multi-Agent Language Models](https://arxiv.org/abs/2510.05174) 群体规模测量; 促使是承担重条件
- [Premack & Woodruff — Does the chimpanzee have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-chimpanzee-have-a-theory-of-mind/1E96B02CD9850E69AF20F81FA7EB3595) ToM 概念在1978年的起源
- [Baron-Cohen, Leslie, Frith — Does the autistic child have a theory of mind?](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/does-the-autistic-child-have-a-theory-of-mind/)萨利-安妮 论文(1985)
