# 代理框架 取舍  兰格拉夫 VS 克鲁亚伊 VS 自动生成者 VS 亚诺

> 每个框架都在卖同一个演示 (研究代理构建报告),也都藏在同一个bug (状态方案和配套层互相打架) 设置.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 问题

你有一个任务,需要不止一次的LLM电话. 也许它是一个研究工作流程.

三天后,你发现这个框架的抽象开始漏水――机组人员给你角色,但当研究人员需要把结构化计划交给作家时,它会和你比较.

修复方式不是选择最好的框架──而是把框架的核心抽象匹配到你的问题形状──本课将绘制这个地图──

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

它们的核心抽象不同.

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### 抽象到底是什么意思

框架的核心抽象就是你在白板上画出来的东西,

- **LangGraph**你画一个图. 节点是步骤,边缘是过渡,每个点的状态对象都是打字.
- **CrewAI**你画一个组织图片. 每个角色都有职位描述.
- **AutoGen**您画一个Slack DM──两个代理人互相发消息;如果需要调节者,第三个加入──心理模型是聊天──
- **Agno**您画一个单独的盒子,旁边挂着工具.把多个盒子放在一起就是团队.

### 国家问题

州是大多数框架选择在生产中崩的地方.

- **LangGraph.**类型状态`TypedDict`或平达式模型) ‧每场减小器‧一等检查点 (SQLite/Postgres/Redis) ・简历‧中断和时间旅行 都是免费的──*(见第11期·16期──) *
- **CrewAI.**通过国家`context`字符串形式在任务之间流动,或通过`output_pydantic`结构化传递――开箱没有每员工的持久商店;如果员工必须在重启后生存,你需要自己接上――
- **AutoGen.**状态是聊天历史和任何用户定义的`context`❖ 对话转录可持久化;任意工作流状态 不会持久化,除非你写适配器──
- **Agno.**通过 系统的存储器`storage=`挂到`Agent`上  对话会话和用户记忆 会自动持久化――它不是完整的图表检查点;而是会话存储点――

### 分类问题

每个非凡的代理都会分支.

- **LangGraph** 由你决定,通过条件边缘――路由是带命名分支的Python函数――分支是编译图中的一等对象;检查点 会记录采取哪条分支――
- **CrewAI**层次模式 中由管理者决定;序列模式 中由你在构建时决定――路由 隐含在任务列表中;除了管理者的提示外,没有一等的if──
- **AutoGen**代理 通过聊天决定──分支 从下一个发言人中涌现──`GroupChatManager`选择下一个演讲者;你可以手写`speaker_selection_method`虽然这只是一个非常重要的问题,
- **Agno**通过下一步调用哪个工具来决定. 团队有协调员/路由器/合作者模式;超出这些分支是开发者的责任.

### 观察性问题

- **LangGraph**通过LangSmith或任何OTel出口商使用OpenTelemetry. 每个节点的过渡都是追踪跨度;检查点同时也是可重复的追踪.
- **CrewAI**自2025年末起一等支持OpenTelemetry;集成Langfuse、Phoenix、Opik、AgentOps──
- **AutoGen**通过`autogen-core`集成 开放电气; 代理Ops 和 Opik 有连接器──追踪粒度是每一个代理信息,不是每一个节点──
- **Agno** 内置 `monitoring=True`旗加开放电气出口商;与兰格深度集成,用于会议追踪──

### 成本和延迟

四个框架都会增加每次调用的通用费用 (道逻辑,验证,连续化) ⋅按通用费用 增加的大致顺序:Agno ≈ LangGraph < CrewAI ≈ AutoGen。差异主要由框架做出了多少额外的 LLM路由决定── CrewAI的层次管理员 会花代币决定谁接下来执行;AutoGen 的`GroupChatManager`长图只能你写的`llm.invoke`亚格诺的单代理路径很薄.

当每次运行成本 重要时,优先选择明确的路由`speaker_selection_method`),而不是LLM选择的路由.

### 互操作性

- **LangGraph** **LangChain**工具,恢复器,LLMs──一等MCP适配器,作为MCP服务器,工具导入)
- **CrewAI**工具 继承自`BaseTool`长链工具,LlamaIndex工具和MCP工具都可以适应进来.`allow_delegation=True`执行一个团队到一个团队的代表团.
- **AutoGen**其他`FunctionTool`包装任何Python可调用;有MCP适配器──对代理对代理模式与AG2生态系统的密切合约──
- **Agno**其他`@tool`装饰器或BaseTool子类;MCP适配器;工具可在代理人和团队之间共享.

## 技能

> 你可以用一个句子解释为什么某个框架适合某个代理问题.

构建前检查列表:

1. **画出形状。**这是图表吗? 类型状态? 命名的转型? 角色扮演? 专家交接工作? 聊天? 代理交谈直到完成?
2. **决定谁来 branching。**开发者决定的分支 → 兰格图――管理者决定的代理人决定的员工管理层层次的聊出现的聊机 → 机器人生成的聊机――工具调用决定的果机――
3. **检查 state budget。**你是否需要从检查点恢复?时间旅行?人中断运行?如果是,长图是默认选择;无会议覆盖对话范围状态──
4. **检查 cost budget。**如果代理每天运行数千次,优先选择明确的路由.
5. **为 framework overhead 做预算。**每个框架都是另一个依赖性. 如果任务只是两个LLM电话和一个工具,写30行简单的Python;没有任何框架比没有框架更便宜.

在你能绘制图表,org图表,聊天或代理盒之前,拒绝伸手拿框架.

## 决策矩阵

| 问题形状 | 首选 framework | 原因 |
|----------|----------------|------|
| 带 typed state、human approvals、long-running 的 Workflow DAG | LangGraph | 一等 state、checkpointer、interrupts、time-travel。 |
| 有明确 roles 的 research / writing pipeline | CrewAI (sequential) 或 LangGraph subgraphs | 在 CrewAI 中表达 role-per-task 很便宜；当 branching 变复杂时用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student dialogue | AutoGen | Two-agent chat 是它的原生形状。 |
| 带 tools、sessions、memory 的 single agent | Agno | 设置最薄，内置 storage 和 memory。 |
| 带 reducers 的数千个 parallel fanouts | LangGraph + `Send` | 唯一拥有一等 parallel-dispatch API 的选择。 |
| 快速 prototype，不承诺 framework | Plain Python + provider SDK | 没有 framework 是最快的 framework。 |


```figure
l5-framework-fit
```

## 练习

1. **Easy.**取同一个任务  研究人类学总部,写一个200字的简要,引用来源  分别使用LangGraph(四个节点:计划,搜索,写,引用) 和 CrewAI(三个角色:研究人员,作家,编辑) 实现――报告每次运行代币成本和代码行数量――
2. **Medium.**用自动生成的研究人员 编辑通过`GroupChat`加入) 和 Agno(带 `search_tools`和 `write_tools`根据 (a) 每次运行成本, (b) 崩后恢复能力, (c) 在写步骤前注入人类批准的能力,对四个实现排序.
3. **Hard.**构建一个决策树脚本`pick_framework.py`接受一个简短问题描述:`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并回归推和一句话理由――用你自己设计的六个案例验证它――

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| Orchestration | “agents 如何协调” | 决定下一个运行哪个 node/role/agent 的 layer。 |
| Durable state | “重启后 resume” | 附着到 checkpoint 或 session store 上、能在 process death 后存活的 state。 |
| LLM-selected routing | “让 model 决定” | planner LLM 每轮选择下一步；灵活，但每次决策都要花 tokens。 |
| Explicit routing | “Developer 决定” | Python function 或 static edge 选择下一步；便宜且可审计。 |
| Crew | “一个 CrewAI team” | roles + tasks + process（sequential 或 hierarchical）绑定成一个 runnable。 |
| GroupChat | “AutoGen 的 multi-agent chat” | N 个 agents 之间由 speaker selector 管理的 conversation。 |
| Team (Agno) | “Multi-agent Agno” | 对一组 agents 使用 route / coordinate / collaborate mode。 |
| StateGraph | “LangGraph 的 graph” | typed-state、node、conditional-edge、checkpointer abstraction。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/)国家图,检查点,中断,时间旅行
- [CrewAI documentation](https://docs.crewai.com/)机组人员,流动人员,代理人,任务,过程.
- [AutoGen documentation](https://microsoft.github.io/autogen/)可交谈的代理,群体聊天,团队,工具.
- [Agno documentation](https://docs.agno.com/) 代理人,团队,工作流,存储,记忆.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 与框架无关的图案库(快速链接,路由,并行化,管弦乐员,评价者,优化器)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629)每一个框架都包装了起来的循环.
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) 汽车代码设计纸
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) 团队AI 风格人物堆 建立其角色扮演基础――
- 本课用于基准的框架──
- 阶段11·19 (反思)  一个能干净映射到LangGraph、但映射到CrewAI会很不同的扭曲模式──
- 如何使用您选择的任何框架
