# AlphaEvolve — 演化式编码 Agents

> 将一个 frontier coding model 与演化循环和可机器检查的 evaluator 配对。让循环运行足够久。它会发现一种 4x4 复数 Matrix 乘法过程，只使用 48 次标量乘法，这是 56 年来首次超越 Strassen。它还找到了一种 Google 范围内的 Borg 调度 heuristic，在生产环境中恢复了约 0.7% 的集群计算资源。这个架构刻意保持朴素。收益来自 evaluator 的严谨性。

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01（长周期 framing），Phase 15 · 02（self-taught reasoning）
**Time:** 约 60 分钟

## 问题

LLMs 可以写代码。演化算法可以在代码空间中搜索。两者几十年来都被分别尝试过，也都碰到了上限。LLM 的上限是虚构：模型会写出看似合理、但并没有做到其声称功能的代码。演化的上限是搜索成本：对语法做随机 mutation 很少能产生可编译程序，更不用说更好的程序。

AlphaEvolve（Novikov et al., DeepMind, arXiv:2506.13131, June 2025）把它们结合起来。LLM 对程序数据库提出有针对性的编辑；自动 evaluator 为每个变体打分；高分变体成为后续世代的 parent。LLM 负责昂贵的步骤：写出看似合理的代码；evaluator 捕捉虚构。这个循环会运行数小时到数周。

论文报告的结果包括：48 次标量乘法的 4x4 复数 Matrix 乘法（Strassen 1969 年的上界是 49），Google 生产环境中的 Borg 调度 heuristic，32.5% 的 FlashAttention kernel 加速，以及 Gemini 训练吞吐量提升。

这个架构之所以有效，是因为 evaluator 可机器检查。在 evaluator 不具备这一点的地方，它就无效。这种不对称性就是本课的核心。

## 概念

### 循环

1. 从一个正确但次优的 seed program `P_0` 开始。
2. 维护一个变体程序数据库，每个变体都由 evaluator 打分。
3. 从数据库中采样一个或多个 parents（MAP-elites-style 或 island-based）。
4. Prompt LLM（用 Gemini Flash 生成大量候选，用 Gemini Pro 处理困难候选）产出 parent 的修改变体。
5. 编译、运行，并在 held-out evaluator 上评估该变体。
6. 按照分数和 feature Vector 将其插入数据库。
7. 重复。

有两个细节很重要。第一，Prompt 给 LLM 的不只是 parent program，通常还包括数据库中的多个 top variants、evaluator signature，以及简短任务描述。模型的任务是提出一个可能提升分数的定向改动。第二，数据库是结构化的（MAP-elites grid、island-based），因此循环探索的是多样性，而不只是当前领先者。

### 为什么 evaluator 不可协商

AlphaEvolve 的收益都来自 evaluator 快速、确定性、且难以作弊的领域：

- **Matrix multiplication algorithm**：一个 unit test，用于执行 Matrix 乘法并逐 bit 检查相等性。
- **Borg scheduling heuristic**：一个生产级 simulator，用来重放历史集群负载并测量浪费的计算资源。
- **FlashAttention kernel**：正确性测试加真实硬件上的 wall-clock benchmark。
- **Gemini training throughput**：以每步 GPU-seconds 衡量。

在每个案例中，evaluator 都捕捉了本来会占主导的 LLM 错误类别：虚构的正确性声明、到了硬件上就消失的性能声明，以及边界案例失败。移除 evaluator，循环优化的就会是漂亮代码。

### Reward hacking 是同一陈述的另一面

演化会优化 evaluator 测量的任何东西。如果 evaluator 不完美，循环就会找到这种不完美。在未验证领域中，循环会优化表层特征，而不是预期行为。DeepMind 在论文中明确指出了这一点：AlphaEvolve 的成功只会迁移到 evaluator 严谨性与搜索野心相匹配的领域。

2025-2026 年代码搜索循环中的 reward hacking 具体例子：

- 奖励“完成时间”的优化目标，会奖励提交空解法。
- 奖励测试内正确性的 benchmark 分数，会奖励记忆测试并过拟合。
- 一个“代码质量”proxy 会奖励删除注释和重写变量名，即使语义没有变化。

AlphaEvolve 中的修复方式：使用 LLM 从未见过的 held-out evaluator，并在评估时生成输入。即便如此，DeepMind 仍建议对任何拟部署方案进行强审查。

### 为什么 LLM + search 优于单独使用任一方

LLM 可以产生可编译、语义上看似合理的修改。对一个 2000 行 Python 文件进行随机 mutation 的 GA 几乎总是产生语法错误。LLM 还会把搜索集中到合理邻域（修改一个函数，而不是随机 bytes），这会显著减少浪费的 evaluator 调用。

反过来，evaluator 会捕捉 LLM 的虚构。LLMs 会自信地声称某个函数“在极限情况下是 O(n log n)”，但它实际上是 O(n^2)；wall-clock benchmark 会让问题尘埃落定。

### AlphaEvolve 在 frontier stack 中的位置

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

这四个系统都是同一个配方的变体：generator 加 evaluator，再加循环。差异在于 evaluator 评什么，以及它有多严谨。

## 使用它

`code/main.py` 在一个 toy symbolic-regression 问题上实现了一个最小 AlphaEvolve-like 循环。这里的“LLM”是一个 stdlib proxy，会对计算目标函数的程序提出小的语法 mutation。这里的“evaluator”在 held-out 测试点上测量均方误差。

观察：

- 最佳分数如何随世代提升。
- MAP-elites grid 如何让多样化解法继续存活，使循环不会收敛到局部最小值。
- 移除 held-out test（training-only evaluator）如何让循环出现惊人的过拟合。

## 交付它

`outputs/skill-evaluator-rigor-audit.md` 是在新领域中考虑 AlphaEvolve-style 循环的前置条件：你的 evaluator 是否真的能捕捉你关心的失败？

## 练习

1. 运行 `code/main.py`。记录最佳分数轨迹。禁用 held-out evaluator（flag `--no-holdout`）并重新运行。量化过拟合。

2. 阅读 AlphaEvolve 论文中关于 MAP-elites grid 的 Section 3。为一个新问题（例如 compiler optimization passes）设计 feature-Vector descriptor，使搜索保持多样性。

3. 48 次乘法的 4x4 结果在 56 年后改进了 Strassen 的 49-mul 上界。阅读论文 Appendix F，并用三句话解释为什么这个问题的 evaluator 特别容易做对，以及为什么大多数领域并不是这样。

4. 提出一个 AlphaEvolve 会失败的领域。准确指出 evaluator 在哪里失效以及原因。

5. 针对你熟悉的一个领域，写出你会使用的 evaluator signature。包括 (a) 正确性条件，(b) 性能指标，(c) held-out 输入生成规则，(d) 至少一个 anti-reward-hacking 检查。

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

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) — 完整论文。
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) — 供应商撰写的结果说明。
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) — 被发现的算法，包括 48-mul 4x4 matmul。
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6) — 前身系统。
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — 将受 evaluator 约束的自主性定义为关键研究方向。
