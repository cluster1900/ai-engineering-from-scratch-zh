# 使用HTN和进化搜索 进行规划

> 象征性规划 处理计划 可证明正确的场景――进化代码搜索 处理健身功能 可由机器检查的场景――ChatHTN (2025) 和 AlphaEvolve (2025) 展示了二者与LLM结合后分别能解锁什么能力――

**类型:**构建
**语言:**字符串 (stdlib)
**先修要求:**阶段14 · 02 (重组和计划和执行)
**时间:**七十五分钟

## 学习目标

- 解释层次任务网络:任务,方法,操作员,前条件,效果――
- 描述ChatHTN的混合循环 象征搜索加上LLM倒退分解──
- 解释AlphaEvolve的进化循环,以及为什么它仅适用于程序评估者.
- 使用stdlib 实现一个玩具HTN规划器 和一个玩具进化搜索.

## 问题

它们不太擅长覆盖两个场景:

1. **可证明正确的 plans。**计划必须在构建上就是声音的――一个流但偶尔幻觉的步骤的LLM计划是不可接受的――
2. **带有机器可检查 fitness function 的优化。**矩阵乘法,规划的理学,编译器通过  目标不是一个正确的计划,而是最好的计划.

两个不同的问题是解决的.

## 概念

### 层次任务网络

 HTN 包含:

- **Tasks**化合物 (化) 和原始 (可直接执行)
- **Methods** 将复合任务分为子任务的方式,有先决条件.
- **Operators**带有先决条件和效果的原始行动.
- **State** 一组事实.

规划:给定一个目标任务和初始状态,找到一个分解,使其成为先决条件 按顺序满足的原始运算者.

 HTN早于 LLM出现,并且仍然是可证明正确的计划的参考方法.

### 特纳 (Gopalakrishnan等, 2025)

查特特 (arXiv:2505.11814) 将符号 HTN 与 LLM 交错执行:

1. 尝试使用现有方法 分解当前复合任务――
2. 如果没有方法 适用,就问法师:在州`s`中,你会如何分解`task`
3. 将LLM响应转换为候选子任务.
4. 根据操作员的方案做验证;拒绝无效的分解.
5. 递归.

论文的核心主张:生成的每一个计划都能证明,因为LLM建议只作为候选分解进入,永远不会直接编辑计划.

在线学习方法(OpenReview `gwYEDY9j2x`通过回归 泛化 LLM 生成的分解  最多可减少75%的 LLM查询频率

### 果 (果) 产品

亚尔法Evolve (arXiv:2506.13131,DeepMind,2025年6月) 是另一类东西:由双子座2.0闪/Pro组合编排的进化代码搜索.

环节:

1. 从种子计划+程序评价者开始(返回体育成绩)。
2. 法律法学团队提出了突变.
3. 将突变交给评估员运行.
4. 保持最好的;继续变化――

已发表的成果:

- 56年来首次改进斯特拉森的4×4复杂矩阵乘法 (48次规模乘法)
- 通过Borg规划的论,恢复了0.7%的谷歌计算.
- 在边境工作负载上实现32%的闪电注意力加快.

硬性约束:健身功能 必须由机器检查――对散文的答案做进化搜索 不会收──

### 什么时使用哪个

| 问题类别 | 使用 | 原因 |
|---------------|-----|-----|
| 带硬约束的 Scheduling | HTN + ChatHTN | 可证明的 soundness |
| Compiler optimization | AlphaEvolve | 机器可检查的 fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop，没有 formal guarantees |
| 带 tests 的 Code improvement | AlphaEvolve | Tests 就是 evaluator |
| Policy-bound automation | HTN | Preconditions 编码 policy |

### 这种模式是容易出错的

- **没有 operators 的 HTN。**没有先决条件/效果方案,健全性 主张就会崩──ChatHTN 的LLM建议分解要求方案能拒绝无效的运动──
- **没有真实 evaluator 的 AlphaEvolve。**问 LLM 代码是否更好不是健身功能――评价者必须确定性且快速――
- **过度工程化。**大多数代理任务都不需要这两者.


```figure
htn-tree-expand
```

## 构建它

`code/main.py`实现了两个玩具示例:

- 一个简单的HTN规划器,包含操作员,方法,先决条件,效果,以及当没有方法 匹配复合任务时触发的`LLMFallback`LLM是一个脚本化分解器,因此规划器可离线运行.
- 一个针对算术程序的进化搜索:增长表达式,使其输出在测试组上最小化`|f(x) - target|`评价者是确定性的.

运行:

```
python3 code/main.py
```

追踪会展示HTN规划器 分解一个复杂任务 (中途带一次LLM倒退),以及进化循环 收到一个目标表达式.

## 使用它

- **HTN planners** `pyhop`,我知道.`SHOP3`建立自己的领域规范.
- **ChatHTN**研究代码;这个模式 ((象征性+LLM倒退) 可以干净移植到任何HTN规划者.
- **AlphaEvolve**深思论文;这个模式(集体 +评价者) 可复现──OpenEvolve 和类似的开源叉正在出现──
- **Agent frameworks**现在还没有一流的HTN或AlphaEvolve.

## 交付它

`outputs/skill-hybrid-planner.md`生成一个混合规划者架架 ((HTN 或进化),并明确限定LLM角色──

## 练习

1. 用后续追踪 扩展HTN规划器:当某个操作员的后条件 在运行时间 失败时,回滚并尝试下一个方法──
2. 给ChatHTN 添加LLM方法缓存:当LLM 在状态模式`P`中分解任务`T`时,存储结果――下一次调用时先重新检查方法库――
3. 将进化搜索评估器替换为真实测试套件―― 通过20个测试案例进行一个进化类别函数;报告收所需的代子――
4. 阅读AlphaEvolve的评价者设计说明――为你关心的域名 设计一个评价者(SQL查询优化、测试套件最小化、部署YAML) 』
5. 组合使用:使用HTN将复合任务分为子任务,然后在每个子任务的原始运算器上使用进化搜索. 它在哪里表现出色,在哪里属于过度工程化?

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| HTN | “Hierarchical planner” | 带有 operators、preconditions、effects 的 task decomposition |
| Method | “Decomposition rule” | 将 compound task 拆分为 subtasks 的方式 |
| Operator | “Primitive action” | 带有 precondition 和 effect 的具体步骤 |
| ChatHTN | “LLM + HTN” | 当没有 method 匹配时，symbolic planner 询问 LLM |
| AlphaEvolve | “Evolutionary code search” | Ensemble LLMs mutate code；deterministic evaluator 负责选择 |
| Fitness function | “Evaluator” | 针对 outputs 的 deterministic、机器可检查 score |
| Online method learning | “Cached LLM decomposition” | 存储并泛化 LLM plans，以降低 query cost |

## 延伸阅读

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814)象征性+法学士 混合规划师
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 LLM突变的进化代码搜索
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)何时选择规划器,何时选择简单循环
