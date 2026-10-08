# 面向LLM的群众优化(PSO,ACO)

> 生物启发式优化正在LLM领域的回归.**LMPSO**通过PSO,每个粒子的速度是一个提示,LLM 生成下一个候选人;它在结构化序列输出 (数学表达式、程序) 上效果很好.**Model Swarms**分析数据的数据集中,每一个LLC专家都在9个数据集中进行了12个基线的报告.**13.3% average gain**并且每轮只需要200个例.**SwarmPrompt**它们将被用于快速优化.**AMRO-S**                                                                                                                                                                                                                                                              **4.7x speedup**、可解释的路由证据,以及将结论与学习的质量关闭异步更新.

**类型：**学习+建设
**语言：**字符串 (stdlib)
**先修：**阶段16 · 09 (并行集团网络),阶段16 · 14 (共识和BFT)
**时间：**,我在.

## 问题

你有一个提示,在任务评价上得分62%. 你想改进它. 简单的做法是无级的手动调调节,但这种方式扩展性很差. 强化学习需要奖励信号和足够的部署来训练.

经典生物启发式优化  用于连续搜索空间的PSO、用于路径选择的ACO  正是为这种场景设计的:无级别、基于种群、每次评估 成本低――将它们与LLM 配合用于无级别的搜索步骤,就能得到一个出乎意料的实用优化器――

同样的模式也适用于多代理系统中代理 *路由*──ACO风格的色素轨迹 会记录哪个代理在哪类任务上表现最好,让路由器利用这个轨迹,并让色素色素衰减,以便路线可以重新发现──

## 概念

### 公共服务局更新 (Kennedy & Eberhart 1995)

粒子群优化:连续搜索空间中的粒子种群──每个粒子有位置`x_i`和速度`v_i`△每次回复:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

其中`p_best`是粒子本身的最佳结果,`g_best`是群众的最佳结果,`w, c1, c2`是惰性+认知+社会权重,`r1, r2`是随机因子.

### 法规 输出上法规

根据速度提示 生成新的输出──速度的惰性是类似的 做小额增长变化的提示──

在以下情况下,效果很好:
- 输出是结构化的(可解析、可评估)
- 健身是自动的测试运行,算术评估.
- 总法师称保持可控──

身体健康需要人工检查,效果不好. 每次代的成本会变得过高.

### 模型群

通过无级更新将参数向集体最佳移动. 报告结果:在9个数据集,12个基线上平均提升13.3%,并且每轮只需要200个实例――

关键洞察是LLM专家模型已经在共享参数多元中彼此接近了(适应量量,LoRA 度) ⋅在这个低维子空间上做PSO 成本低且有效的──

### 东里戈1992年

殖民地优化:ants 遍历图表;每条路径都有子痕迹──的移动概率按子强度加权──完成任务的会按解决方案质量 成比例地存储子──子会随时间衰减──

###  AMRO-S  用于代理路由的ACO

根据ACO的数据,每种任务类型都是一个目的地,每个代理都是一个可能的路线.

- **可解释的 routing evidence。**子强度是人类可读的信号.
- **Quality-gated asynchronous update。**通过质量检查 才会更新,将推断与学习解.
- 在多代理路由基准上实现**4.7x speedup**,我知道.

质量门很重要:没有它,快但错误的代理会积聚,系统会锁定在坏路上.

### 什么时候为 LLM 使用 PSO / ACO

**使用 PSO 当：**
- 搜索空间是连续的,或可映射到连续参数 (即时嵌入式),LoRA权重,数值生成参数.
- 适合性 便宜且自动性
- 人口可以很小,10-30)

**使用 ACO 当：**
- 你有路线或路径选择问题.
- 随着时间的推移,决策会变得强化.
- 你需要解释证据的路由决定.

**不要使用二者当：**
- 身体健康需要人工评测 (每次复制 成本过高)
- 搜索空间是分散的,而PSO无法覆盖,
- 实时决策需要严格的延迟PSO/ACO 相比单通路利学收较慢)

### 为什么生物灵感仍然胜出

基于基梯的方法需要可微信号――LLM输出和路由决策 并不自然可微――伪梯式方法――强化学习路由器――DPO式快速调节器) 可行,但需要昂贵的训练――

如果您能为候选人输出或路由决定打分,就能在这个空间上优化.

### 实用限制

- **Population budget。**对于每次LLM评估$0.02 / call 的情况，一个 20-particle PSO 跑 50 iterations 大约花费 ~$根据规划.
- **Exploration vs exploitation。**子衰变率与PSO惰性之间有贸易;衰变太快 → 忘记解决方案;太慢 → 卡在早期的局部优势――
- **Catastrophic drift。**如果健身环境发生变化,两种算法都可能先相结合,然后分歧.


```figure
swarm-stigmergy
```

## 构建

`code/main.py`实现:

- `LMPSO` 在数值提示参数 (温度,顶_k重量) 上运行PSO──每个粒子的LLM生成被模拟为一个脚本化健身函数──运行算法30次演变,并显示了最佳融合──
- `AMRO_S` ACO 风格路由──3 个代理──4种任务类型──弗洛蒙矩阵──100个路由任务──打印一段时间内(任务类型 →代理选择) 的分布,展示轨迹形成──
- 对比:在同一任务流上比较随机路由与ACO路由.

运行:

```
python3 code/main.py
```

预期输出:
- 们在30次的演变中,从随机值提升到接近最佳状态.
- AMRO-S:色素表 稳定到每种任务类型对应的正确代理;ACO路由 在质量上比随机高约 ~30-40%,同时减少延迟(更少的重试) 

## 使用

`outputs/skill-swarm-optimizer.md`帮助PSO、ACO、基因算法和基于梯度的优化器 之间选择,用于LLM/代理优化问题──

## 交付

- **从小开始。**只有当缩曲线显示明确收益时才扩展.
- **记录每轮 pheromones 或 g_best。**没有跟踪的群群优化器很难调试.
- **Quality-gate updates。**尤其是ACO路由:快但错误的代理人绝不能积聚胺.
- **在 distribution shift 时 reset decay。**当评估分布变化时,老化素已经过时;重新设置或暂时将衰变率加倍.
- **限制每轮成本。**输出成本每次发行量. 一轮花费500美元,只带来0.5%的 PSO不能出货.

## 练习

1. 运行`code/main.py`△观察LMPSO的融合 △改变人口规模 为 5、10、20、50── 在哪个规模上升时间和?
2. 实现一个 灾难性漂移 实验:在回复30 后改变健身功能──PSO 适应得多快?重置`p_best`有什么帮助吗?
3. 给AMRO-S 添加质量门:只有评分分>0.7的运行才存储胺──与未添加的门版本相比,这如何改变化?
4. 阅读 LMPSO(arXiv:2504.09247) ⋅把论文中的速度作为一个提示 映射回你的数值速度――模拟中丢了什么,又保留了什么?
5. 阅读AMRO-S(arXiv:2603.12933) 实现带异步子更新的解答 输入快速路──这将如何改变持续负载 下系统延迟?

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995。基于种群的无 Gradient Optimizer。 |
| ACO | "Ant Colony Optimization" | Dorigo 1992。通过 pheromone trails 进行 path/route optimization。 |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247。Velocity 是 prompt；LLM 生成 candidates。 |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163。在 model parameter subspace 上进行无 Gradient update。 |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933。覆盖 task-type × agent 的 pheromone matrix。 |
| p_best / g_best | "Personal / global best" | 每个 particle 和整个 swarm 目前找到的最佳 solutions。 |
| Pheromone | "Routing memory" | Edge 上的强度；随时间衰减；根据 quality deposit。 |
| Quality-gated update | "Only learn from good runs" | 以 quality check 为条件进行 pheromone deposit。 |
| Catastrophic drift | "Distribution shift" | Fitness landscape 改变；旧的 p_best 和 pheromones 变得过时。 |

## 延伸阅读

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) 1995年 PSO 论文
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) 1992年 基础
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) 面向结构化LLM产品的PSO
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) 在模型重量子空间上层的PSO
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) 带质量门的胺驱动路由
