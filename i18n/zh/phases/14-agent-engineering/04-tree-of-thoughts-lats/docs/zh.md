# 思想树和LATS:自主搜索

> 单条链思路轨迹 没有回溯空间――ToT(Yao等等,2023) 将推理变成一棵树,并在每个节点上进行自我评估――LATS(Zhou等,2024) 在蒙特卡罗树搜索下统一了ToT、ReAct 和 Reflection──24的游戏从4%的CoT) 升至74%的ToT;LATS 在人平面上达到92.7%的通过@1。

**类型：**建立
**语言：**字符串 (stdlib)
**先修：**阶段14 · 01 (代理循环),阶段14 · 03 (反射)
**时间：**七十五分钟

## 学习目标

- 结点是思想,边缘是扩张,价值是有多有希望.
- 实现一个Stdlib ToT式BFS树搜索,并使用自我评估得分.
- 扩展为一个玩具LATS MCTS循环,包含选择/扩展/模拟/反传播――
- 判断什么时候搜索 值得代币 倍增成本(24的游戏、代码生成),什么时候单条轨迹就足够了(简单问答) 』

## 问题

如果第一步错了,后续每一步都会建立在错误的前提下. 在24的游戏中,GPT-4 CoT的准确率为4%

推理需要提出多个候选人,评估它们,选择有希望的候选人,并出现死胡同时回溯的能力.

## 概念

### 思想树 (Yao等, NeurIPS 2023)

每个节点是连贯的中间步骤. 每个节点可以扩展为 K 个孩子的思想.

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

自主评估是承重部分.论文展示了三种变体:`sure / likely / impossible`类别`1..10`其他国家和地区的投票率.

### 和其他 (LATS)

们在 MCTS 下统一了 TOT,React 和 Reflection.

- **Policy**提出候选人下一步行动 (ReAct式)
- **Value function**为了部分轨迹打分(ToT式自行)
- **Self-reflector**没有任何可能的想法,但它是很好的.

环境反 (观察) 将混入值函数,因此搜索 会由真实工具结果 提供信息,而不仅仅是模型意见.

###  MCTS,最小形式

每次代都有四个阶段:

1. **Select** 使用UCT (上部的自信与树木联系在一起) 从根走到叶子.
2. **Expand**通过政策生育K个孩子.
3. **Simulate** 使用政策 从儿童推广到叶子,并用价值函数 (或环境奖励) 为叶子 打分。
4. **Backpropagate** 沿路上升更新访问数和值估计――

鱼类的鱼类`Q(s, a) + c * sqrt(ln N(s) / N(s, a))`首先是利用;第二是探索.`c`,我知道.

### 成本现实

搜索会让代币爆发. 游戏24 上的 ToT 使用的代币是 CoT 的1001000倍.

- 单条轨迹被证明不足的任务
- 墙钟不如正确性 重要任务――
- 有便宜且可靠的值函数的任务(代码的单元测试、数学的明确目标)。

如果你的任务有单个正确答案,并且有评估者有噪音,搜索往往会使事情变得更糟,因为它会找到高分的错误答案.

### 2026 定位

大多数生产代理 不运行 LATS──它们运行带有工具基准验证的反应(Critic,Lesson 05)──搜索 出现在专门的位中:

- 将测试作为值函数的编码代理 (HumanEval式)
- 探索多条查询路径的深度研究代理――
- 内部规划重的工作流程――

果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 果版: 版:


```figure
tree-of-thoughts
```

## 构建它

`code/main.py`实现了:

- 一个在风格化中选择算术运算任务 上运行的小ToT BFS
- 一个在同一任务上运行的玩具LATS MCTS循环(选择 / 扩展 / 模拟 / 转移),使用UCT选择──
- 一组合象征分数和自等分数的值函数.

运行它:

```
python3 code/main.py
```

随着MCS的推广,每一个节点都扩大了三个候选人,并与LATS 通过MCS 收到最佳推广 进行对比.

## 使用它

长度链团队关于LATS的博客(2024年5月) 是参考教程──LlamaIndex 提供`TreeOfThoughts`对于大多数2026年生产代理而言,这个模式存在`if task_complexity > threshold: use_search()`后面见05课 中的评估者优化模式

## 交付它

`outputs/skill-search-policy.md`根据任务形状,预算和评估者忠诚度,在线性ReAct、ToT、LATS和进化搜索之间进行选择.

## 练习

1. 运行玩具LATS. 轨迹发生了什么变化?
2. 换值函数 换成噪音更大的得分器 (加入随机) ――MCTS还能找到最佳的页面吗?它能容忍最低信号噪音是多少?
3. 实现光束搜索 ToT(每层保留顶-k)并与BFS对比.
4. 阅读LATS第5.1节. 复现人均轨迹计数:需要多少部署才能达到报告的通过@1?
5. 阅读LATS论文 中关于LATS帮助不的讨论――写一段决策规则,将任务形状映射到搜索策略――

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tree of Thoughts | “Branching CoT” | Yao et al. — 带有 self-evaluation 的 thought node 树 |
| LATS | “MCTS for LLMs” | Zhou et al. — 在 MCTS 下统一 ToT + ReAct + Reflexion |
| UCT | “Upper confidence bound” | 在 exploitation (Q) 和 exploration (ln N / n) 之间平衡的 select formula |
| Value function | “这个 state 有多好” | Prompted LLM score 或 environment reward；反馈给 backprop |
| Policy | “Action proposer” | ReAct-style generator；发出候选 next thought/action |
| Rollout | “Simulated trajectory” | 使用 policy 从 node 走到 leaf，并用 value 打分 |
| Backpropagate | “更新 ancestors” | 将 leaf 的 reward 沿路径向上推，更新 visit count 和 Q |
| Search cost | “Token explosion” | Game of 24 上是 CoT 的 100-1000 倍；采用前先做 budget |

## 延伸阅读

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) 经典论文
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) 带有反思反的MCTS
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) 用于搜索的子图格
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带程序评价者的进化搜索
