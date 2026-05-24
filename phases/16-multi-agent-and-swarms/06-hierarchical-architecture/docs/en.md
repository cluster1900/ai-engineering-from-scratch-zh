# Hierarchical Architecture 及其 Failure Mode

> Hierarchical 是嵌套的 supervisor。Manager agents 位于 sub-managers 之上，sub-managers 又位于 workers 之上。CrewAI `Process.hierarchical` 是教科书版本：一个 `manager_llm` 动态委派任务并验证输出。LangGraph 中的等价形式是 `create_supervisor(create_supervisor(...))`。当任务本身是真实的 org chart 时，这是自然的 pattern。它也是最容易坍塌为 managerial looping 的 pattern：manager agents 分配工作不佳、误解 sub-outputs，或无法达成 consensus。Sequential 往往胜过它。

**类型：** 学习 + 构建
**语言：** Python (stdlib)
**前置要求：** Phase 16 · 05 (Supervisor Pattern)
**时间：** ~60 分钟

## 问题

一旦理解了 supervisor pattern，自然的下一步就是：“如果 workers 本身也是 supervisors 呢？”团队有子团队；公司有部门下的部门。Hierarchical architectures 正是在镜像这种结构。

问题在于：LLM managers 和人类 managers 不一样。人类 manager 对下属知道什么有稳定的先验。LLM manager 每一轮都会基于其 context 中的内容重新推理 org。context 中的一点点漂移，就会让整棵树错误分配工作。

## 概念

### 形态

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

每个内部节点都会 plan、delegate 和 synthesize。只有叶子节点真正执行工作。

### 适用场景

- **清晰的 org mapping。** 如果真实任务是部门式的（“legal review the doc, finance review the doc, engineering review the doc, then summarize for exec”），hierarchy 是明确的。
- **Local summarization。** 每个 sub-manager 会在 top manager 看到之前 synthesize 自己团队的输出。Top manager 看到的是三个 sub-manager summaries，而不是十五个 worker outputs。

### 失效位置

2026 年 post-mortems 持续发现三种 failure modes：

1. **Task assignment error。** Manager 读取目标，幻觉出一个 decomposition，并委派给错误的 sub-manager。由于 sub-manager 会顺从地处理收到的任务，错误只会在 top synthesis 时浮现，距离人类本可发现它的位置已经隔了一层。
2. **Output misinterpretation。** Sub-manager 返回“unable to verify claim X”。Top manager 总结为“claim X not confirmed”。含义在每一层都会漂移。
3. **Consensus loops。** 两个 sub-managers 意见不一致；top manager 要求它们 reconcile；它们向下重新 delegate；workers 重新运行；sub-managers 返回略有不同的答案；循环开始。CrewAI 的 `Process.hierarchical` 用 step limits 防止这种情况，但这个 limit 本身现在变成了 hyperparameter。

### 决策问题

Sequential（线性 pipeline）vs hierarchical：你的任务真的有独立的子团队，还是一个伪装成树的线性流程？如果是后者，使用 sequential。如果是前者，使用 hierarchical，但要为明确的 reconciliation rules 预留预算。

### CrewAI 的实现

`Process.hierarchical` 将 manager LLM 接在 specialist crews 之上。Manager 会：

- 接收 top-level task，
- 将 subtasks 分配给 crews，
- 评估 crew outputs，
- 决定 accept、re-delegate，还是 iterate。

文档：https://docs.crewai.com/en/introduction（在 Core Concepts 下查找 "Hierarchical Process"）。

### LangGraph 的实现

LangGraph 使用嵌套的 `create_supervisor` calls。内部 supervisor 有自己的 graph；外部 supervisor 将内部 graph 视为一个 opaque node。对于 debugging 来说，这比 CrewAI 更清晰（你可以分别 step through 每个 graph），但更难表达 tree 的动态 reshaping。

参考：https://reference.langchain.com/python/langgraph-supervisor。

## 构建它

`code/main.py` 运行一个 3-level hierarchy：

- top manager：将任务拆分为 "engineering" 和 "legal" 分支，
- engineering sub-manager：拆分为 "frontend" 和 "backend" workers，
- legal sub-manager：一个 worker。

Demo 对比 happy path（所有人一致）和 **perturbed path**：top manager 的 decomposition 将 "legal" 错标为 "finance"，然后观察错误级联：sub-manager 顺从地执行 finance 工作，top synthesizer 报告 finance findings，原始 legal question 没有得到回答。

运行：

```
python3 code/main.py
```

输出会展示两条路径，并清晰并排对比“what was asked”和“what was delivered”。

## 使用它

`outputs/skill-hierarchy-fitness.md` 评估给定任务应使用 hierarchical、sequential，还是 flat supervisor。输入：task description、org structure、reconciliation budget。输出：pattern recommendation，并包含需要防范的具体 failure modes。

## 发布它

如果你发布 hierarchical：

- **将 tree depth 限制在 2。** 三层已经会从 observability 中隐藏大多数错误。
- **明确 reconciliation budget。** 设置 top manager 必须 commit 前的 max rounds。通常为 2。
- **每次 synthesis 都要有 provenance。** 每个节点的 summary 必须引用产生它的 leaf outputs。
- **对 decomposition drift 告警。** 记录每一步 manager 的 decomposition；与用户 query 做 diff。如果 decomposition 不再覆盖 query，触发 alert。

## 练习

1. 运行 `code/main.py` 并比较 happy 与 perturbed。需要多少层 manager hand-off，top output 才会完全偏离用户的问题？
2. 添加第三层（top → sub → sub-sub → worker）。随着 depth 增长，测量 perturbed path 多常会自我修正，以及多常会完全偏离。
3. 在每个 sub-manager 处实现一个 "canary" worker，它始终收到未改动的原始用户问题。使用 canary answer 检测 decomposition drift。当 canary 与 synthesized answer 不一致时，manager 应该如何反应？
4. 阅读 CrewAI 的 `Process.hierarchical` 文档。识别 CrewAI 应用的一个具体 guardrail（step limit、manager_llm constraint），并描述它针对的 failure mode。
5. 比较嵌套的 LangGraph supervisors 与 CrewAI hierarchical。哪一个能更低成本地检测 reconciliation loops？

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | supervisors 位于 supervisors 之上；只有叶子节点执行工作。 |
| Manager LLM | "The boss" | 在内部节点执行 decomposes、assigns 和 validates 的 LLM。 |
| Decomposition drift | "The boss lost the plot" | Top manager 的拆分不再覆盖原始问题。 |
| Reconciliation loop | "Endless meetings" | Sub-managers 意见不一致；top re-delegates；workers re-run；循环直到 budget 耗尽。 |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | 经验性 guardrail：3+ 层会让 observability 坍塌。 |
| Canary question | "Ground truth at every level" | 一个始终收到未改动原始 query 的 worker，用于检测 drift。 |
| Provenance chain | "Who said what" | 从每次 synthesis 回溯到产生它的 leaf outputs 的 trace。 |

## 延伸阅读

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) — 带有 manager LLM 的教科书式 hierarchical
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) — 通过 `create_supervisor` 实现嵌套 supervisor
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) — 为什么 Anthropic 有意选择 flat supervisor 而不是 hierarchical
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy；关于 coordination failures 的章节记录了 decomposition drift
