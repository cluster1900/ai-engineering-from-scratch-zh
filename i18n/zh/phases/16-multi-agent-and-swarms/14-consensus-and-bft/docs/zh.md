# 面向代理人的共识和拜占庭错误容忍

> 经典分布式系统BFT 遇上随机的LLM.**CP-WBFT**通过信任调查,为每次投票权加权;**DecentLLMs**采用无领导方式,并行工人提案与几何中介聚合;**WBFT**根据"中文"的数据,在"中文"中,有些人认为"中文"是"中文"的意思,但它是"中文"的意思.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**前置要求：**16 · 07阶段 (思想与辩论的社会),16 · 13阶段 (共享记忆)
**Time:** 约 75 分钟

## 问题

你有N 个LLM代理,每个都会出一个答案――它们的意见不一致――多数投票选择错误答案,因为两个代理存在相关性――相同的基础模型,相同的培训数据,相同的失败模式――第三个代理恰好以一种新的方式出错,所以多数派是一个虚假多数――

现在加入一个欺骗的代理:它故意撒谎.或者加入一个恶心的代理:它同意最后发言的人.`f < n/3`实际情况是:LLM节点即使诚实时也随机,会跨模式 相关,并受影响彼此的输出 影响.

经典BFT(PBFT, 1999)并没有错误,但它不完整――它处理任意的点翻――它处理不三真实代理 因共享训练数据而共享同一个幻觉──本课从PBFT的基础开始,并叠加三种2025-2026年适配──

## 概念
### 经典BFT给你什么

实际的拜占庭错误宽容 (卡斯特罗和里斯科夫,OSDI 1999) 可容忍`f < n/3`个拜占庭节点. 这个协议有三个阶段.`n >= 3f + 1`个诚意或恶意节点之间达成单个价值协议.

这些保证很强大,但有以下假设:

1. **Independent faults。**拜占庭人不会协作.
2. **Honest nodes 确实诚实。**诚实结果的正确性不是问题;
3. **问题存在 ground-truth answer。**对于错误的事实达成共识 仍然是共识.

对于模糊问题,真相是代理决定的内容,没有外部口语.

### 三种针对LLM的攻击

**Byzantine lie。**一个代理人输出故意错误的答案.`f < n/3`经典的BFT可以处理它.

**Sycophantic conformity。**一个代理人在投票前读取其他人的答案,并与最后发言者保持一致.

**Correlated-error monoculture。**三个代理共享一个基本模式――它们产生幻觉,并产生一个错误答案――大多数都是错误的――经典BFT没有帮助,因为三个代理都诚实地同意了――

### 未来的2025年

**CP-WBFT** 自信证据权衡BFT──每个选民给自己的答案附加一个信心调查(自报概率,或单独校准模型的预测)──投票权衡 随着信心缩小──报告称在完整图上BFT的改善为 +85.71%──减缓 目标:精神认同性(符合代理往往对其主动所给出的位置的信心较低)──

**DecentLLMs**工作人员代理并行提出建议,评估员代理为建议打分,最终答案是得分的位置的几何中介――当`f < n/2`时具备强性──调解 目标:拜占庭谎言 和相关错误(对异差的几何中位数强,并向密集集群,而不是基于模型的平均值)。

**WBFT** 权重的BFT与层次结构集群化――投票权重 由响应质量加上从历史学习到的信任分分分配――将代理 聚类为核心和边缘;核心代理 必须先达成共识,边缘代理 跟随――调解 目标:可扩展性(核心共识 小而快) 以及部分应对单元文化(核心可按多样性选择) ――

### 实证:人工智能代理人可以同意吗?

这篇论文 衡量多个边界模型 上面的规模协议

- 尽管没有对手,LLM代理在许多基准上也超过30%的不同意见率.
- 单个采用欺骗性的人物代理可将混合代理的共识 拉离诚实基线 40+百分点――
- 不同意见率与模型多样性 相关;异质组比同质组 分歧更多(好处:不相关错误),但漂移也更慢(坏处:时间到达协议更长)

结论:BFT 给你对齐输出的机制,但它不告诉你对齐后的输出是否正确――要结合验证 (第16阶段 · 08 角色专业化) 多样性 (第16阶段 · 15 辩论变体) 和评估者 (评估者) 代理 (第16阶段 · 24 基准)

### 剥离到核心协议

一个面向LLM代理的最小BFT轮:

```
1. task arrives; each agent i produces answer a_i
2. each agent attaches confidence probe c_i in [0, 1]
3. aggregator collects (a_i, c_i) from all n agents
4. aggregator groups by semantic cluster (equivalent answers)
5. aggregator computes weight for each cluster C:
     w(C) = sum_{i in C} c_i
6. winner = cluster with max weight, if max > threshold * sum(c_i)
   else: retry or escalate
7. minority clusters logged with provenance for post-hoc audit
```

语义集群化 步骤是LLM特定的关键变化. 两答案 研究报告了4.2% 和4.2%的改善. 属于同一集群.

### 值调整

`threshold`参数决定何时接受何时重试.过低:你会接受弱多数.过高:你永远不会接受任何东西.`n=5-7`个代理为0.5-0.67;更小的`n`需要更高值. 低于值时,升级给人类或另一个代理集团.

### 共识无法提供帮助的地方

- **Ambiguous questions。**如果问题没有基本的真相,共识就像一种观点.
- **Compound questions。**写代码并解释它 是两个答案. 分别对每个答案进行投票.
- **Adversarial multi-round。**如果代理人能观察前轮并模仿2023年辩论,他们会开始同意,不管真相.


```figure
swarm-consensus-wave
```

## 构建它
`code/main.py`实现:

- `AgentVoter`带有 (答案,信心) 的脚本政策.
- `MajorityVote` 经典多元化──
- `CPWBFT` 带语义集群的信任权重投票
- `DecentLLMs` 在得分的提案上做几何中位数聚合.
- `Scenario` 在三种攻击模式下运行每个集成器.

已实现的攻击模式:

1. `byzantine`,一个高信心的代理人.
2. `sycophancy`经纪人复制了它看到的第一回复,并使用匹配的信心.
3. `monoculture`两个代理共享一个错误的答案,

运行:

```
python3 code/main.py
```

预期输出:一张 (攻击,集成器) -> 最终答案的表,并高亮正确答案――多元化在单种种中失败――CPWBFT的信心权重减轻缩――良LLMs的几何中介在单种种种中少于总体一半时会拉向诚实集群――

## 使用它
`outputs/skill-consensus-designer.md`为多代理集团设计共识协议:集群方法,权重,门以及次门轮的升级政策.

## 交付它
在发布任何共识机制之前:

- **至少用上面三种 patterns 做 attack-test。**你的协议应该被预测失败,而不是默默失败.
- **记录每个 minority cluster**及其来源:少数群体是你发现相关错误的早期警告系统.
- **强制 bounded rounds。**没有任何协议,这会让人感到丧.
- **将 agreement 与 correctness 分离。**通过验证器,验证器独立于组合.
- **监控 agreement rate。**剧烈上升意味着合规偏见;剧烈下降意味着模型漂移.

## 练习
1. 运行`code/main.py`〔 〕确认多元化 在单种攻击下失败,但当单种信心低于0.7 时CPWBFT 能部分缓解──
2. 添加第四种攻击模式:**silent abstention**,一个代理 拒绝回答,我不知道.
3. 将语义集群从字符串加нони化 换成嵌入式类似性(使用任意开源嵌入式模型) ――精神攻击 会发生什么变化?
4. 阅读CP-WBFT (arXiv:2511.10400) 〔实现信任探测校准步骤〕一个单独的校准模型 检查每个代理自报的信任〕──衡量单种植场景上的精度增长──
5. 阅读 AI代理能否同意? (arXiv:2603.01213) ・复现一个简化的规模协议实验:三个代理人、一个规模问题、欺骗性人提示──CPWBFT或DecentLLMs 能抓住它吗?

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| BFT | “Byzantine fault tolerance” | Castro-Liskov 1999 protocol，用于在 `f < n/3` arbitrary faults 下达成 consensus。 |
| Byzantine | “任何坏行为” | 一个可以撒谎、丢弃 messages、静默失败的节点，除了安全 crash 外什么都可能做。 |
| Confidence probe | “你有多确定？” | 附加到 vote 上的自报或 calibrator-predicted probability。 |
| Semantic clustering | “同一答案，不同表述” | 在 counting votes 之前对等价 answers 分组。 |
| Geometric median | “Robust center” | 最小化到 sample points 距离之和的点。与 mean 不同，它对 outliers robust。 |
| Monoculture | “相同 model，相同 failures” | agents 共享 training data 或 base model 时产生的 correlated errors。 |
| Sycophantic conformity | “同意最大声的声音” | agent 的 vote 偏向最先/最大声发言的人。 |
| Core/Edge | “Hierarchical BFT” | WBFT 拆分：小规模 Core 先 consensus，Edge nodes 跟随。限制 latency。 |

## 延伸阅读
- [Castro & Liskov — Practical Byzantine Fault Tolerance (OSDI 1999)](https://pmg.csail.mit.edu/papers/osdi99.pdf) 基础
- [CP-WBFT — Confidence-Probe Weighted BFT](https://arxiv.org/abs/2511.10400) 按信任 进行投票权重
- [DecentLLMs — leaderless multi-agent consensus](https://arxiv.org/abs/2507.14928)几何中位数聚合
- [WBFT — Weighted BFT with Hierarchical Structure Clustering](https://arxiv.org/abs/2505.05103) 用于限制延迟的核心/边缘分区
- [Can AI Agents Agree?](https://arxiv.org/abs/2603.01213)规模协议脆弱性 和欺骗性攻击
