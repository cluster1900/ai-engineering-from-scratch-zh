# 自动化 Alignment Research (Anthropic AAR)

> Anthropic 在独立 sandbox 中并行运行多个 Claude Opus 4.6 Autonomous Alignment Researchers 团队，并通过一个共享 forum 协调；该 forum 的日志位于任何 sandbox 之外（因此 agent 无法删除自己的记录）。在 weak-to-strong training 问题上，AAR 的表现超过了人类研究员。Anthropic 自己的总结指出，规定式 workflow 往往会限制 AAR 的灵活性并降低性能。自动化 alignment research 是一个压缩步骤，它会把时间线压缩到 RSP 本来要检测的那些精确 misalignment 风险上。

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**前置要求：** Phase 15 · 05 (AI Scientist v2), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

Alignment research 消耗大量人类研究员时间。像 scalable oversight、reward specification 或 weak-to-strong training 这样的问题，每轮实验迭代都需要数周。随着 frontier capabilities 推进，alignment 工作量的增长速度超过合格研究员供给的增长速度。

Automated Alignment Research (AAR) 追问的是：那些能力正在超过 alignment 进展的同一批 frontier models，是否也能帮助弥合这个差距。Anthropic 2026 年关于一项由 AAR 运行的 weak-to-strong-training 研究的报告（alignment.anthropic.com/2026/automated-w2s-researcher/），是这类已部署系统最早公开的结果之一。

结果确实是正面的：AAR 在一个研究问题上的表现优于人类 baseline。但这个结果也把本 Phase 已经展开的每一个担忧集中到一个系统中。如果 alignment research 可以被自动化，那么破坏 safeguards 的部分也可以被自动化。RSP 中关于 AI R&D capability 的 threshold，正是考虑到这个循环而写的。

## 概念

### 架构（按公开描述）

- **Parallel agents.** 多个 Claude Opus 4.6 实例作为 AAR 运行，每个都位于独立 sandbox 中。Sandbox 限制 filesystem、network 和 process 暴露面。
- **Shared forum.** 研究发现会发布到一个共享 forum，其 storage backend 位于每个 sandbox 之外。Agent 可以读取 forum；agent 不能从自己的 sandbox 内删除或编辑 forum 记录。
- **Task allocation.** 一个由人类设计的 task queue 将研究问题分配给 AAR。AAR 提出 decomposition，运行实验，并撰写发现。
- **Weak-to-strong training focus.** 已发表的研究处理的是 weak-to-strong training，即使用较弱的 supervisor model 来训练更强的 student model。AAR 在此任务上的表现超过了人类研究员。

### 为什么 out-of-sandbox log 很重要

Log-integrity 属性是受控实验与潜在受损实验之间的区别。如果 AAR 能编辑自己的日志，它们就能掩盖失败或可疑的实验。Anthropic 直接指出了这一点：该属性是信任研究输出的必要条件，而且验证起来并非易事。

在基础设施术语中的类比，是使用 write-through 到外部 storage 的 append-only logs（例如 S3 object-lock、immutable Datadog logs）。Agent 没有修改过往记录的 credential。这与 2026 年企业安全团队用于构建抗勒索软件 audit trails 的模式相同。

### prescribed-workflow 的取舍

Anthropic 的报告指出，prescribed workflows 往往会限制 AAR 的灵活性并降低性能。换句话说：如果人类设计者逐步写出研究计划，AAR 的表现会差于只给出高层目标并允许其自由 decomposition 的情况。这与 agentic research（LangGraph、Microsoft's Agent Framework）中的结果一致：过度指定的 scaffolds 会伤害有能力的 agents。

安全含义很微妙。提升 AAR 性能的灵活性，也是允许未授权 decomposition、新型 tool use 和 goal-drift 的灵活性。这个取舍是一个 design-space decision：多少灵活性足以换来超过人类的能力，同时又不会给 agent 留出将目标泛化到 off-distribution 的空间？

### 压缩风险

RSP v3.0（Lesson 19）引入了一个 AI R&D capability threshold：以相对于 human + AI tools 有竞争力的成本，完全自动化 AI R&D pipeline 的能力。DeepMind 的 FSF v3 包含一个类似的 ML R&D autonomy level。两个 framework 都把这个 threshold 视为触发更高控制级别的条件。

AAR 距离这个 threshold 还差一步：它自动化了 pipeline 的一部分（针对具体、范围清晰任务的 alignment research），但还没有自动化端到端的 capability development loop。关于时间线的问题是：这个差距会以多快的速度闭合。

压缩时间线是复合失效担忧所在。如果 alignment research 和 capability research 以相近速度复合增长，那么 misalignment risk surface 至少会以与 capability 一样快的速度增长。如果 capability 复合增长更快（历史趋势如此），差距就会扩大。这就是为什么 AAR 是一种有条件的好事：每一个额外的 alignment 结果都会缩小差距，当且仅当研究过程是可信的。

### AAR 不能替代什么

人类研究员设定 task queue、review 结果，并持有 constitutional authority。AAR 加速的是 pipeline 的中段，而不是两端。Anthropic 已发表的输出同时包括 AAR 贡献，以及人类研究员对于发布什么、撤回什么、改进什么的判断。

这与 Lesson 15 中的 propose-then-commit 模式应用到研究本身相匹配：AAR propose；human commit。

## 使用它

`code/main.py` 模拟一个 multi-AAR research forum。三个独立的“research agents”并行运行，将发现发布到一个 append-only forum，并可选择进行 tamper attempts。

观察：

- out-of-sandbox logging 如何捕获 log-tampering attempts。
- 在更难的问题上，允许 free decomposition 的 task allocation 如何优于 fixed workflows。
- 如果 log 不是 tamper-evident，单个 compromised AAR 如何污染 forum 的信号。

## 交付它

`outputs/skill-aar-deployment-review.md` 是一个 automated-alignment-research pipeline 的预部署 review。

## 练习

1. 运行 `code/main.py`。比较 "fixed-workflow" 与 "free-decomposition" 设置。free decomposition 是否总是获胜，还是在某些问题类别中 fixed workflow 也有竞争力？

2. 修改 simulator，让一个 agent 尝试 log tampering。确认 append-only log 能检测到它。写一段话，准确描述检测信号在 log 中是什么样子。

3. 阅读 Anthropic 的 weak-to-strong AAR 报告。找出 AAR 超过人类研究员的具体 sub-task。是什么让它适合自动化？

4. 设计一个 task-queue allocation policy，在 AAR 灵活性（更好结果）与 prescribed-workflow 约束（更易 audit）之间取得平衡。描述你会如何对二者做 A/B test。

5. 阅读 RSP v3.0 的 AI R&D-4 threshold。用一段话描述，你认为哪些能力会跨过这个 threshold，而目前的 AAR 还没有做到。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| AAR | "Automated Alignment Researcher" | 在 alignment problems 上 autonomously 运行的 Claude Opus 4.6 实例 |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | AAR 表现超过人类的经典 scalable-oversight benchmark |
| Shared forum | "Where agents publish findings" | Append-only、out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through 到 external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | 限制 AAR；相较 free decomposition 往往降低性能 |
| Free decomposition | "Agent decides how to break the task" | 能力更强，更难 audit |
| AI R&D threshold | "RSP/FSF capability level" | 以有竞争力的成本完全自动化 R&D pipeline |
| Compressed timeline | "Alignment vs capability race" | 如果 capability 复合增长快于 alignment，misalignment 风险就会增长 |

## 延伸阅读

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) — primary source。
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — AI R&D threshold framing。
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) — 更广泛的 agent-autonomy framing。
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — 与 RSP 平行的 ML R&D autonomy levels。
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) — AAR 所处理的底层问题。
