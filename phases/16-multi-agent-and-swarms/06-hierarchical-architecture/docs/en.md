# Hierarchical Architecture 及其失效模式

> Hierarchical 是嵌套的 supervisor。Manager Agent 管理下级 manager，下级 manager 再管理 worker。CrewAI `Process.hierarchical` 是教科书式实现：一个 `manager_llm` 动态委派任务并验证输出。对应的 LangGraph 实现是 `create_supervisor(create_supervisor(...))`。当任务对应真实组织架构时，这是最自然的模式。它也最容易陷入管理循环：Manager Agent 分配工作不当、误解下级输出或无法达成共识。Sequential 往往表现得更好。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern)
**Time:** ~60 分钟

## 问题

理解 supervisor pattern 后，自然会想到下一步：“如果 worker 本身也是 supervisor 呢？”团队下设子团队；公司也会有层层嵌套的部门。Hierarchical architecture 正是对此的映射。

问题在于：LLM manager 与人类管理者并不相同。人类管理者对于下属掌握的知识有稳定的先验判断。LLM manager 则会在每一轮中，根据 Context 里的内容重新推理整个组织结构。Context 中的微小偏移，就会导致整棵树错误分配工作。

## 概念

### 结构

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

每个内部节点都会规划、委派并综合结果。只有叶子节点执行实际工作。

### 适用场景

- **清晰的组织映射。** 如果真实任务以部门划分（“法务审阅文档，财务审阅文档，工程团队审阅文档，然后为高管汇总”），hierarchy 可以明确表达这种结构。
- **局部汇总。** 每个 sub-manager 都会先综合其团队的输出，再交给 top manager。Top manager 看到的是三个 sub-manager 的摘要，而不是十五个 worker 的输出。

### 失效场景

2026 年的复盘报告反复发现以下三种失效模式：

1. **任务分配错误。** Manager 读取目标，凭空构造一种拆解方式，然后把任务委派给错误的 sub-manager。由于 sub-manager 会忠实执行收到的任务，这个错误直到顶层综合时才会暴露，而此时它与原本可以被人类发现的位置已经相隔一层。
2. **输出误解。** Sub-manager 返回“无法验证声明 X”。Top manager 将其总结为“声明 X 未获确认”。语义会在每一层发生偏移。
3. **共识循环。** 两个 sub-manager 意见不一致；top manager 要求它们协调；它们再次向下委派；worker 重新运行；sub-manager 返回略有不同的答案；循环继续。CrewAI 的 `Process.hierarchical` 使用步数限制防止这种情况，但这个限制本身现在又成了一个 Hyperparameter。

### 决策问题

Sequential（线性 Pipeline）与 hierarchical 之间应如何选择：你的任务是否真的包含相互独立的子团队，还是一个伪装成树的线性流程？如果是后者，使用 sequential。如果是前者，使用 hierarchical，但要为明确的协调规则预留预算。

### 基于角色框架的实现

CrewAI 的 `Process.hierarchical` 在多个专业 crew 之上连接一个 manager LLM。Manager 会：

- 接收顶层任务，
- 将子任务分配给各个 crew，
- 评估 crew 的输出，
- 决定接受、重新委派还是继续迭代。

文档：https://docs.crewai.com/en/introduction（在 Core Concepts 下查找“Hierarchical Process”）。

### 基于图框架的实现

LangGraph 使用嵌套的 `create_supervisor` 调用。内部 supervisor 拥有自己的图；外部 supervisor 将内部图视为不透明节点。与 CrewAI 相比，这种方式更便于调试（你可以分别单步执行每个图），但更难表达树结构的动态重塑。

参考：https://reference.langchain.com/python/langgraph-supervisor。

```figure
swarm-hierarchy-token
```

## 动手构建

`code/main.py` 会运行一个三层 hierarchy：

- top manager：将任务拆分为“engineering”和“legal”两个分支，
- engineering sub-manager：进一步拆分为“frontend”和“backend”worker，
- legal sub-manager：包含一个 worker。

Demo 会对比正常路径（所有参与者意见一致）与一条**扰动路径**。在扰动路径中，top manager 在拆解任务时错误地将“legal”标记为“finance”，然后观察错误如何层层传播：sub-manager 忠实地执行财务工作，顶层综合器报告财务发现，而最初的法律问题没有得到回答。

运行：

```
python3 code/main.py
```

输出会并排清晰展示两条路径中“要求交付的内容”和“实际交付的内容”。

## 实际使用

`outputs/skill-hierarchy-fitness.md` 用于评估给定任务应使用 hierarchical、sequential 还是 flat supervisor。输入：任务描述、组织结构、协调预算。输出：推荐的模式，以及需要防范的具体失效模式。

## 交付上线

如果要交付 hierarchical：

- **将树深限制为 2。** 三层结构已经会让大多数错误脱离可观测范围。
- **明确协调预算。** 设置 top manager 必须作出最终决定前的最大轮数。通常为 2。
- **在每次综合中保留 Provenance。** 每个节点的摘要都必须注明它来自哪些叶子节点输出。
- **对拆解偏移发出警报。** 记录 manager 在每一步的拆解结果，并与用户查询进行 diff。如果拆解结果不再覆盖用户查询，则触发警报。

## 练习

1. 运行 `code/main.py`，对比正常路径和扰动路径。经过多少层 manager 交接后，顶层输出会完全偏离用户的问题？
2. 添加第四层（top → sub → sub-sub → worker）。测量随着深度增加，扰动路径自行纠正与完全偏离各自出现的频率。
3. 在每个 sub-manager 下实现一个“canary”worker，并始终将未经修改的原始用户问题交给它。使用 canary 的答案检测拆解偏移。当 canary 与综合答案不一致时，manager 应如何反应？
4. 阅读 CrewAI 的 `Process.hierarchical` 文档。找出 CrewAI 使用的一项具体 guardrail（步数限制、`manager_llm` 约束），并说明它针对哪种失效模式。
5. 对比嵌套的 LangGraph supervisor 与 CrewAI hierarchical。哪一种更容易以较低成本检测协调循环？

## 关键术语

| 术语 | 人们通常怎么说 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | “组织架构模式” | Supervisor 管理 supervisor；只有叶子节点执行实际工作。 |
| Manager LLM | “老板” | 在内部节点执行拆解、分配和验证的 LLM。 |
| Decomposition drift | “老板偏离了主题” | Top manager 的拆分结果不再覆盖原始问题。 |
| Reconciliation loop | “无休止的会议” | Sub-manager 意见不一致；顶层重新委派；worker 重新运行；不断循环，直到耗尽预算。 |
| Depth-2 ceiling | “不要超过两层” | 经验性 guardrail：三层及以上会破坏可观测性。 |
| Canary question | “每一层的 ground truth” | 始终接收未经修改的原始查询的 worker，用于检测偏移。 |
| Provenance chain | “谁说了什么” | 从每次综合结果追溯至生成该结果的叶子节点输出。 |

## 延伸阅读

- [CrewAI 简介 — Process.hierarchical](https://docs.crewai.com/en/introduction) — 使用 manager LLM 的教科书式 hierarchical
- [LangGraph supervisor 参考文档](https://reference.langchain.com/python/langgraph-supervisor) — 通过 `create_supervisor` 实现嵌套 supervisor
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) — Anthropic 为何有意选择 flat supervisor 而非 hierarchical
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST 分类体系；关于协调失效的章节记录了 decomposition drift
