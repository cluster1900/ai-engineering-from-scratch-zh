# 交付和日常  无状态编排

> 开放AI的群众 (OpenAI的群众) 将多代理编排提炼为两个原语:**routines**(作为系统提示的指令+工具) 和 **handoffs**没有状态机,没有分支的DSLLLM 通过调用正确的交付工具 来路由.OpenAI Agents SDK(2025年3月) 是其生产级后继者.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

## 问题

每个多代理框架都希望你学习它的DSL:长图的节点和边缘,CrewAI的团队和任务,AutoGen的群体聊天和管理者.

群众走向相反方向:使用模型已经具备的工具调用能力──交换 变成工具调用──乐队主持人就是当前掌握对话的那个代理──状态机隐含在代理的系统提示中──

## 概念

### 两个原语

**Routine。**定义代理角色和可用工具的系统提示. 可以将其视为一个有作用域的指令组.

**Handoff。**代理可以调用一个工具,它返回一个新的代理对象──Swarm运行时间检测到代理返回值,然后下一轮切换活跃代理──

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

根据用户消息选择正确的交付.

### 为什么它很快传播

- **API 小。**只有需要学习两个概念.
- **使用模型已经会做的事。**工具调用已在各供应商中达到生产阶段.
- **没有状态机负担。**你不需要描述图表; 代理的提示 描述它们会交给谁.

### 无状态取舍

运行间的群确实是无状态的. 框架在一次运行期间保留消息历史,但不会持久任何东西.

在生产环境中(OpenAI Agents SDK,2025年3月),这是一个主要的变化:SDK 增加内置会议管理、防护和跟踪,同时保留交付 原语──

### 适合场景

- **Triage patterns。**一线代理将用户路由到专家.
- **基于技能的 handoffs。**如果任务需要代码,就叫编码器;如果需要研究,就叫研究人员.
- **短而有边界的对话。**客户支持,常见问题,简单的工作流程.

### 食力的场景

- **带共享 memory 的长 sessions。**交付将把对话状态重置为新代理的提示加历史. 没有调用方管理的记忆,就无法在代理之间持久状态.
- **并行执行。**交换是一次的一个动代理 会切换――并行性需要调用方编排多个群运行――
- **Audit 和 replay。**无状态运行 很难精确复制;LLM 的交付 选择不是确定性的.

### 开放AI代理 SDK(2025年 3月)

生产级后继者添加:

- **Session state。**跨行的持久线程.
- **Guardrails。**输入/输出验证子──
- **Tracing。**每个工具的电话和交付都会被记录.
- **Handoff filters。**控制交付 时转移哪些上下文――

转移原语保留下来;生产可用性围绕它补充.

### 群众与群众聊天

两者都使用LLM驱动的路由,但区别在于**谁选择下一个**其他:

- 集团聊天:由外部的选择器 (由外部的选择器) 函数或LLM) 来自外部的选择下一个讲者──
- 现在的代理人通过调用手渡工具 选择其继任者.

群众是代理决定下一步是什么;群众聊天是经理决定下一步是什么──群众的决策存在于活动代理的工具调用中;群众聊天的决策存在于`GroupChatManager`在中.


```figure
sw-handoff-routing
```

## 构建它

`code/main.py`从零实现Swarm:一个代理数据类,一个交付机制,以及一个检测代理切换的运行循环.

演示:一个分类代理 会路由到退款,销售或支持专家.

运行:

```
python3 code/main.py
```

## 使用它

`outputs/skill-handoff-designer.md`为确定任务设计交付拓:有哪些代理,它们可以调用哪些交付,将转移哪些上下文.

## 发布它

检查列表:

- **Handoff logging。**每次交付都写入一个追踪事件,包含从代理到代理的文本快照.
- **上下文转移规则。**决定交付时移动什么:完整历史昂贵
- **Handoff guardrail。**交给不同工具权限的专家 必须经过认证 否则即时注射可能强制触发不需要的交给.
- **Loop detection。**两名代理回来,是常见失败,
- **Fallback agent。**如果转让目标不存在, 返回安全默认值.

## 练习

1. 运行`code/main.py`试验到退款代理. 确认第二轮的活跃代理是退款.
2. 添加循环检测规则:如果同两位代理已经连续放弃了3次,则强制退出.
3. 阅读OpenAI Agents SDK文件 中关于交付过器的内容──实现一个总结交付版本:出发代理 在接管之前,将上下文缩写成弹头总结──
4. 对于集团聊天管理员的选择器来说,什么模式会让快速注射更严重,为什么?
5. 阅读 群众的厨师书https://developers.openai.com/cookbook/examples/orchestrating_agents）。找出斯瓦姆做出了显而易见的设计决定,并说明OpenAI代理SDK是改变它还是保留它.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| Routine | “Agent prompt” | System prompt + tool list。定义角色和可用 handoffs。 |
| Handoff | “转交给另一个 Agent” | active agent 可以调用的一个 tool，它返回新的 Agent。runtime 会切换 active agent。 |
| Stateless | “runs 之间没有 memory” | Swarm 不持久化任何东西；memory 是调用方的责任。 |
| Active agent | “现在谁在说话” | 当前掌握对话的 Agent。Handoff 会改变它。 |
| Context transfer | “handoff 时移动什么” | incoming agent 能看到哪些 history 的策略：full、last N 或 summarized。 |
| Handoff loop | “Agents 来回 ping-pong” | 两个 Agents 不断 hand back 给对方的失败模式。 |
| OpenAI Agents SDK | “生产级 Swarm” | 2025 年 3 月的后继者；在 handoff 原语之上添加 sessions、guardrails、tracing。 |
| Handoff filter | “转移时的 gate” | SDK feature，用于在 handoff 边界检查和修改上下文。 |

## 延伸阅读

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 参考性阐述
- [OpenAI Swarm repo](https://github.com/openai/swarm) 原始实现,作为概念参考保留
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/)带会议和追踪的生产阶段后继者
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) 克劳德代码的代码 如何通过`Task`使用类似的交付模式
