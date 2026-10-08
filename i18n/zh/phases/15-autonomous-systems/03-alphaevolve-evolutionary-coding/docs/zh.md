# 演化式编码代理

> 通过将一个边界编码模型与演化循环和可机器检查的评估者配对. 让循环运行足够久. 它会发现一种4x4复数矩阵乘法过程,只使用48次标量乘法,这是56年来首次超越Strassen. 它还发现了一个谷歌范围内的波格调节的论,在生产环境中恢复了约0.7%的集群计算资源.

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01（长周期 framing），Phase 15 · 02（self-taught reasoning）
**Time:** 约 60 分钟

## 问题

LLM可以写代码――演化算法可以在代码空间中搜索――两十年来都被分别尝试,也都碰到了上限――LLM的上限是虚构:模型会写出看似合理的代码――但没有达到其声称功能的上限――演化的上限是搜索成本:对语法做随机变化很少能产生可编译程序,更不用说更好的程序――

它们被结合在一起. 对于程序数据库提出了有针对性的编辑; 自动评估者为每个变体打分; 高分变体成为后代的父母.

论文报告的结果包括:48次标量乘法的4x4 复数矩阵乘法(Strassen 1969年的上界是49),Google 生产环境中的Borg调度理学,32.5%的FlashAttention内核加速度,以及双胞胎训练吞吐量提升──

这种结构是有效的,是因为评价者可机器检查. 在评价者没有这个点的地方,它就无效了.

## 概念

### 循环

1. 根据一个正确但优秀的种子计划`P_0`开始.
2. 维护一个变体程序数据库,每个变体都是由评估者打分――
3. 从数据库采集一个或多个父母 (MAP精英风格或岛屿).
4. 快速LLM(使用Gemini Flash 生成大量候选人,使用Gemini Pro 处理困难候选人)产出父母的修改体──
5. 编译、运行,并进行评估 上评估该变体.
6. 根据分数和功能,向量将其插入数据库.
7. 复制

有两个细节很重要.第一,Prompt给LLM的不仅仅是母程序,通常还包括数据库中的多个顶级变体,评估者签名,以及简短任务描述.模型的任务是提出一个可能提升分数的定向转变.第二,数据库是结构化的.

### 为什么评价者不可协商

果的收益来自评价者快速,确定性和难以欺骗的领域:

- **Matrix multiplication algorithm**测试单位测试,用于执行矩阵 乘法并逐位 检查相等性
- **Borg scheduling heuristic**:一个生产级模拟器,用于重置历史集群负载并测量浪费的计算资源.
- **FlashAttention kernel**现在,我们已经开始了.
- **Gemini training throughput**测量:以每步GPU秒

在每一个案例中,评估者都捕获了原本占主导地位的LLM错误类别:虚构的正确性声明,到硬件上消失的性能声明,以及边界案例的失败.

### 奖励黑客是同样的陈述的另一面

循环会优化表层特征,而不是预期行为. 深思论文中明确指出:AlphaEvolve的成功只会转移到评估者严谨性与搜索目标相匹配的领域.

奖励黑客在2025-2026年年代码搜索循环中的具体例子:

- 奖励完成时间的优化目标,会奖励提交空解法──
- 奖励测试内正确性基准 分数,会奖励记忆测试并过拟合――
- 一个代码质量代理会奖励删除注释和重写变量名,即使语义没有变化.

通过使用未见的持久评估者,并在评估时生成输入. 即便如此,DeepMind 仍然建议对任何拟部署方案进行强烈审查.

### 为什么 LLM+搜索 优于单独使用

对于2000行Python文件进行随机变化的 GA 几乎总是产生语法错误.LLM还将搜索集中在合理邻域 (修改函数而不是随机字节),这将显著减少评估器的浪费调用.

反过来,评价者会捕捉到LLM的虚构.LLMs会自信地声称某个函数在极限情况下是O  n  log n) ,但实际上是O  n ^ 2);墙钟基准会让问题落.

### 升在边境堆中位置

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

这四种系统都是同一个配方的变体:生成器加评估者,再加循环.


```figure
alphaevolve-loop
```

## 使用它

`code/main.py`在一个玩具的符号回归问题上实现最小的AlphaEvolve类似循环. 在此,LLM是一个stdlib代理,将对计算目标函数的程序提出小语法突变. 在此,评估者在进行测试点上测量平均差距.

观察:

- 最佳分数如何随着一代的提升.
- 如何让多样化解法继续活着,使循环不会收到局部最小值.
- 移除过度测试 (仅为培训的评估员)

## 交付它

`outputs/skill-evaluator-rigor-audit.md`您的评价员是否真的能捕捉到您关心的失败?

## 练习

1. 运行`code/main.py`记录最佳分数轨迹──禁用持久评价员旗`--no-holdout`)并重新运行――量化过拟合――

2. 阅读 AlphaEvolve 论文中关于MAP精英格格的第3节――为一个新问题 (例如编译优化通过) 设计特征-向量描述器,使搜索保持多样性――

3. 48次乘法的4x4 结果在56年后改进了斯特拉森的49-mul 上界――阅读论文附录F,并使用三句话解释为什么这个问题的评价者特别容易做,以及为什么大多数领域不是这样――

4. 提出一个"阿尔法进化会失败的领域".准确指出评估者在哪里失败以及原因.

5. 针对你熟悉的一个领域,写出你会使用的评估员签名――包括 (a) 正确性条件, (b) 性能指标, (c) 持久的输入生成规则, (d) 至少一个反奖励黑客检查――

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AlphaEvolve | “DeepMind 的演化式编码 agent” | Gemini + 程序数据库 + 可机器检查的 evaluator |
| MAP-elites | “保留多样性的 archive” | 由 feature Vectors 作为 key 的 grid；每个 cell 保存具有该 descriptor 的最佳变体 |
| Island model | “并行演化子种群” | 会周期性迁移的独立种群；防止过早收敛 |
| Machine-checkable evaluator | “确定性 oracle” | LLM 无法伪造的 unit test、simulator 或 benchmark，是这个循环的前置条件 |
| Reward hacking | “优化测量值，而不是目标” | 循环找到一种最大化分数但不完成预期任务的方法 |
| Seed program | “起点” | 循环从中演化的初始正确但次优程序 |
| Held-out evaluator | “LLM 从未见过的评估数据” | 在评估时生成的输入，用于防止记忆 |

## 延伸阅读

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) 完整论文──
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) 供应商撰写的结果说明.
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results)被发现的算法,包括48-mul 4x4matmul
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6) 前身系统
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0)将受评审者约束的自主性定义为关键研究方向.
