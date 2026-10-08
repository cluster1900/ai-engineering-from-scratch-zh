# 多代理原始模型

> 2026年发布的每一个多代理框架 AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework  都是四维设计空间中的一个点──四个原始,仅此已:代理、支持、共享状态、管弦乐队──本课从零构建它们,在四个上运行一个玩具系统,然后将每个主流框架映射到同一组坐标轴上,让你能用一段话读懂任何新发布版本──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 问题
每六个月就会有一个新的多代理框架发布,2023年的AutoGen,2024年的CrewAI,2024年的LangGraph和OpenAI Swarm,2025年4月的Google ADK──2026年2月的Microsoft Agent Framework RC──每一份新闻稿都声称自己是正确的抽象──

如果你试图逐个学习它们,你会筋疲力尽――API看起来不同――doc对agent是什么说法不一――一个框架把它共享的内存称为黑板,另一个称为消息池,第三个称为国家图――你开始怀疑这个领域只是在反复翻新――

不是如此. 在营销包装下,四个原始的是稳定的.

## 概念
### 它们是四个原始的.

1. **Agent** 一个系统提示加一个工具列表──无状态;每次运行都从其系统提示 和当前消息历史开始──
2. **Handoff** 控制权从一个代理转移到另一个代理的结构转移――在机制上,可以回归新代理的工具调用,也可以遵循某种条件的图边――
3. **Shared state** 任何可以被多个代理 读取(有时也能写入) 的数据结构──消息池、黑板、键值存储、矢量内存──
4. **Orchestrator**决定下一个由谁发言的角色──选项包括:显式图表 (显式图表) 确定性 (确定性) 、LLM扬声器选择器 (软) 、上一位扬声器的交换调用 (OpenAI Swarm),或排队上一个调度器 (swarm architecture) ──

这就是完整的设计空间. 每个框架都为每个轴选择默认值;其余只是表层语法.

### 如何每一个2026年框架都将其映射到

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

表面差异看起来很大.

### 为什么这很重要

一旦看清原始,框架比较就变成了一个简单的检查列表:

- 导演是信任LLM来路线吗?
- 共有状态是全历史的吗?
- 机关管理员能修改彼此的提示,还是只能放手?

您不再寻找最佳的多代理框架,而是开始围绕真正关心的轴来设计.

### 无国无国的洞察力

除了共享状态之外,每个原始都是无状态的. 代理是 (快速,工具) 的函数. 交付是一次函数调用. 乐队主机是调度器.**系统中唯一有状态的东西是 shared state。**所有有趣的bug 都住在那里:记忆中毒 (第15课) 信息订单,版本,写作纠纷.

隐藏共享状态框架 (Swarm) 将问题推向调用者.集中管理共享状态框架. 长图检查点,AutoGen池.

### 单一原始人的解剖学

#### 代理

```
Agent = (system_prompt, tools, model, optional_name)
```

没有记忆――没有状态――拥有相同的系统提示和工具的两个代理是可互换的――任何东西看起来像每个代理状态,实际上都在共享状态或交付协议中――

#### 交付

```
Handoff = (from_agent, to_agent, reason, payload)
```

实现占主导:

- **Function return**工具 返回下一个代理──这是OpenAI群体模式──代理在自己的工具方案中携带路由──
- **Graph edge** 兰格拉夫──Edges 是声明式的──LLM 生成一个值;条件 选择下一个节点──
- **Speaker selection** 汽车代集团聊天──选择函数(有时它本身也是一个LLM电话)读取池并选择下一位发言人──

#### 共同国家

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

至少是一个消息列表.通常更多:结构化文物.

两种类型:**full pool**(每个代理都看到每条消息) 和**projected**(代理人看按角色范围的视图) ―― 完整池 简单但扩展性差距―― 预定池可扩展,但需要预先设计方案――

#### 乐团主持人

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

的风格:

- **Static**图 在构建时间固定 长图确定性、CrewAI序列) 』
- **LLM-selected** LLM 读取池并选择下一位演讲者(AutoGen、CrewAI等级) 。
- **Handoff-driven** 当前代理 通过调用交付工具来决定(群众) 』
- **Queue-driven**从共享队列中工作人员 拉取任务;没有显然下一个扬声器群架构、矩阵) 』

### 框架之间的变化

一旦原始的定位,剩余的设计决策是:

- **Memory strategy**短暂对耐用检查点长度图检查点)。
- **Safety boundary**谁可以批准交付?
- **Cost accounting**每代理的代币预算──
- **Observability**追踪传递,为重播持久化状态.

所有这些都能在原始上实现.


```figure
a5-primitive-radar
```

## 构建它
`code/main.py`没有真正的LLM  每个代理都是一项脚本的政策,因此重点保持在协调结构上.

文件导出:

- `Agent` 包含名称,系统提示,工具,政策函数的数据类.
- `Handoff` 返回新代理的功能──
- `SharedState`线条安全的信息池──
- `Orchestrator` 三个变体:`StaticOrchestrator`,我知道.`HandoffOrchestrator`,我知道.`LLMSelectorOrchestrator`没有任何其他方法.

通过所有三种管弦乐器类型运行同一个三种代理管道 (研究 →写 → 评论),最后打印信息池――你可以看到,输出差异只取决于谁选择下一个*;代理和共享状态在每次运行中完全相同――

运行它:

```
python3 code/main.py
```

预期输出:三次管弦乐器运行,每种模式 一次――每次都会打印最终信息池――如果研究人员判断已经提前完成,

## 使用它
`outputs/skill-primitive-mapper.md`是一个技能,它读取任何多代理代码库或框架文档,并返回四个原始地图化. 在新的框架发布上运行它,即可在深入阅读文档前获得一段话的理解.

## 交付它
在采用新框架前,先为它写原始地图. 如果写不出来,说明 doc 不完整,或者该框架正在发明第五个原始的.

把映射固定在你的架构文档 中──当新团队成员加入时,先把映射发送给他们,再发送API文档──当框架版本变化时,对映射而不是变更.

## 练习
1. 用不同的代理政策运行`code/main.py`三次――观察管弦乐队的选择 如何改变哪些代理会运行――
2. 实现第四种管弦乐器类型:排队驱动,其中的代理人 轮询共享状态 寻找工作.
3. 取 LangGraph快速启动 (https://docs.langchain.com/oss/python/langgraph/workflows-agents),把它改写成四个原始.
4. 阅读OpenAI群众厨师书 (https://developers.openai.com/cookbook/examples/orchestrating_agents让四个原始人中最多的机器人,以及它给调用者推出的哪个.
5. 在这个表中找到一个完全隐藏的共享状态框架.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | “一个带 tools 的 LLM” | 一个 `(system_prompt, tools, model)` triple。无状态。 |
| Handoff | “控制权转移” | 一个结构化 call，命名下一个 agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “context” | multi-agent system 中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “Coordinator” | 决定下一个运行者的人或机制。Static graph、LLM selector、handoff-driven，或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个轴之一。不是 framework feature。 |
| Message pool | “Shared chat history” | Full-history shared state。容易推理，扩展性差。 |
| Projected state | “Scoped view” | 面向特定 role 的 shared state view。可扩展，需要 schema design。 |
| Speaker selection | “下一个谁说话” | 一种 orchestrator pattern，其中一个 function（通常是 LLM）从 group 中选择下一个 agent。 |

## 延伸阅读
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 关于手动调节的最清晰的阐述
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) 集团聊天+演讲者选择是 LLM选择的管弦乐的参考实现
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)图边管弦和基于减小器的共享状态
- [CrewAI introduction](https://docs.crewai.com/en/introduction)角色目标背景经纪人,序列/层次流程
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2)微软将将 v0.4 转入维护后仍在活跃的AutoGen v0.2 线
