# 复制和执行计划:解式规划

> 在一个流中交错思想和行动――ReWOO将它们分开:先制定一个完整的大计划,然后执行――Token 减少 5x,在 HotpotQA 上精度提高 +4%,并且你可以把计划器蒸到一个7B模型――Plan-and-Execute 将将其泛化;Plan-and-Act 将其扩展到网络导航――

**类型：**构建
**语言：**字符串 (stdlib)
**先修要求：**阶段14 · 01 (代理循环)
**时间：**时间60分钟

## 学习目标
- 解释为什么 ReWOO 的规划者/工人/解决者 拆分相比 ReAct 的交错循环 能节省代币并提升强度──
- 实现一个计划 DAG、一个按顺序执行的执行器,以及一个组合工作者输出的解决器
- 使用2026年 五个工作流程模式 框架 类型),判断任务应采用计划然后执行 还是交错式 ReAct──
- 识别什么时候 计划和行动的合成计划数据对于长远网络或移动任务是必要的.

## 问题
反应的交错式思维-行动-观察循环 简单而灵活,但每次工具调用都必须携带完整的前文背景  包括之前的每一个想法――标使用会随着深度呈第二次增长――更糟糕的是:当某种工具在循环中途失败时,模型必须根据错误观察重建整个计划――

,等, arXiv:2305.18323,2023年5月) 注意到这一点,并做了一个取舍:先完整规划,并行 获取证据,最后组合答案――一次LLM电话 用于规划,N次工具电话 用于证据(可以并行),一次LLM电话 用于求解――这个取舍是用更少的灵活性(计划是静态的) 换取更好的代币效率和更清晰的失败模式――

## 概念
### 三个角色

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

规划器产生一个 DAG. 每个节点都指定一个工具,它的参数,以及它依赖于一些早期节点.`#E1`,我知道.`#E2`这样的引用) ・ 根据拓顺序执行节点.

### 为什么5倍少的代币

反应的快速长度 会随步数 线性增长――在第十步,快速包含思想 1加行动 1加观察 1加思想 2加行动 2加观察 2,依此类推――每个中间步骤还会冗余包含原始提示――

只有一个计划器提示(较大) 、N 个小工人提示(每个只是工具调用,没有链) 和一次解决器提示──论文在HotpotQA上测得代币 减少约5倍,同时绝对精确度提升+4──

### 为什么它更强

如果在ReAct中工作者3失败,循环必须在流中从错误中推理恢复.在ReWOO中,工作者3返回一个错误字符串.解决器能在原始计划的背景中看到它,并优雅降级.

### 调制剂蒸

论文的第二个结果:因为规划者看不到观察,你可以使用175B教师的规划者输出来调整一个7B模型――小模型负责规划;大模型在推断时不再需要――现在已经很常见了 许多2026年生产代理使用小规划者和大执行者,或反过来使用――

### 计划和执行 (长链, 2023)

团队将在2023年8月的文章中将REWOO 泛化为一个模式名称:计划和执行――前面规划者 输出一个步骤列表,执行者 执行每个步骤,可选的重组规划者可以在观察结果后进行修改――这比REWOO更接近ReAct(重组规划者会把观察带回规划),但保留了代币节省――

### 计划和法案 (埃尔多根等人, arXiv:2503.09572, ICML 2025)

计划和行动将这个模式扩展到长远的网络和移动代理.关键贡献是合成计划数据:一个标记轨迹生成器 生成显然包含计划的训练数据. 它用于细调规划器模型,使其在WebArena等任务上超过30-50步后仍然正常工作,而单条 ReAct轨迹在此类任务中会失去一致性.

### 什么时候选择哪个

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

对于人类的2024年12月指导:从最简单的方式开始. 如果任务只是一个工具,再一次简介,就不要构建ReWOO.


```figure
rewoo-plan
```

## 构建它
`code/main.py`实现一个玩具版 ReWOO:

- `Planner` 一个脚本的政策,根据快速输出计划 DAG──
- `Worker` 通过注册 分发每个节点的工具调用──
- `Solver`编写的编辑,读取证据并产生最终答案──
- 依赖性决议  类似`#E1`引用将被替换为更早的工人输出.

这个演示 回答 法国首都人口是多少,圆成百万?,使用两步计划:

运行它:

```
python3 code/main.py
```

之后显示员工的成绩,最后显示解决器的组成――将标志数量――我们打印了粗略的字符数量) 与ReAct式交错运行进行比较.

## 使用它
作为一个食谱提供`create_react_agent`用于 ReAct,定制图表 用于计划执行) ・CrewAI的流程直接编码了该模式:你预先定义任务,然后Flow DAG 执行它们――计划和行动的合成数据方法目前仍然主要属于研究;运行时间模式(显式计划 DAG) 通过LangGraph 和 CrewAI流程在生产中提供――

## 交付它
`outputs/skill-rewoo-planner.md`在给定工具目录的情况下,根据用户请求 生成 ReWOO 计划 DAG──它将在交付执行器 之前验证计划(循环、每个参考都已解决、每个工具都存在)。

## 练习
1. 在一个包含2个平行组的6节点 DAG上,这能带来什么好处?
2. 添加一个重组节点,当任何员工 返回错误 时触发.让 ReWOO 变成计划和执行的最小改动是什么?
3. 用一个小型号7B类) 替换`Planner`让我`Solver`区分会在哪里失效?
4. 阅读REWOO论文关于计划器蒸的第4节. 从概念上复现 175B -> 7B 的结果:你需要什么培训数据,以及如何评估计划质量?
5. 实现将这个玩具移植到计划和行动的轨迹形状:计划是序列,而不是DAG.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 带合成计划的规模规划者执行者
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview)框架配方
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 选择能工作的最简单模式
