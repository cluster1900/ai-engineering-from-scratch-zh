# 长度图:状态图与持续执行

> 兰格格拉夫是2026年低级状态调整的参考标准. 代理是状态机;节点是函数;边缘是状态转移;状态是不可变的,并且在每一步之后都是检查点.

**类型：**学习 + 构建
**语言：**字符串 (stdlib)
**先修要求：**阶段14 · 01 (代理循环),阶段14 · 12 (工作流程模式)
**时间：**七十五分钟

## 学习目标

- 描述LangGraph的核心模型:带有不可变的状态、功能节点、条件边缘和后步骤检查点的状态机──
- 描述了四项能力:持续执行,流媒体,人体循环,综合记忆.
- 解释 兰格拉夫 支持的三种管弦乐拓:监督者、同行 (群) 、等级 (嵌套子图) 。
- 实现一个不变状态图,包含不可变状态,条件边缘以及检查点/简历周期.

## 问题

代理和工作流有一个共同问题:当一个40步运行在第38步失败时,你希望从第38步恢复,而不是从头开始.

兰格拉夫的设计答案是:状态是一等类型的对象,变异是显而易见的,并且检查点会在每个节点之后持久化.`load_state(session_id)`调用.

## 概念

### 图表

一个图由以下部分定义:

- **State type.**一个类型的定律 (或Pydantic模型),每个节点都会读取并修改它.
- **Nodes.**纯函数`(state) -> state_update`◎更新会在返回后合并进入状态──
- **Edges.**节点之间的条件或直接过渡――
- **Entry and exit.** `START`和 `END`警卫节点标记边界――

示例:一个包含`classify`,我知道.`refund`,我知道.`bug`,我知道.`sales`,我知道.`done`节点的代理,即一个图形形式的路由工作流程.

### 持续执行

每个节点 返回后,运行时间 会序列化状态,并将其写入检查点(SQLite、Postgres、Redis、自定义) ⋅如果在第N步失败,运行时间可以`resume(session_id)`并带着精确状态 从第N+1 步继续.

张格拉夫文档明确强调了这一点对生产用户的重要性:Klarna、Uber、J.P. Morgan──核心主张不仅仅是图形形;而是图形形加上检查点让恢复成本变低──

### 流媒体

每个节点都能产生部分输出.图会向通话流每节点-多角事件,让用户可以在图中运行时更新.

### 轮中的人

在节点之间检查并修改状态――实现方式:在关键节前暂停,将状态 展示给人类,接受修改,然后恢复――检查指针让这件事变得简单,因为状态已经被序列化――

### 记忆

短期 (一次运行内,即状态中的对话历史) 和长期 (跨运行,即通过检查点加上独立长期存储 持久化) 长度图 通过工具和外部内存系统 (Mem0、自定义) 集成──

### 三种拓物

1. **Supervisor.**专业的路由器分发给专业的子班子.`langgraph-supervisor`中中 `create_supervisor()`(不过,2026年, LangChain 团队建议通过直接的工具调用来做,以获得更好的环境控制)
2. **Swarm / peer-to-peer.**通过共享工具表面直接交手.
3. **Hierarchical.**监督管理子监督,以嵌套子图实现.

### 这种模式很容易出错的地方

- **Checkpoints too small.**只有检查点对话转会让工具状态 和记忆写 无法恢复――全状态 必须可序列化――
- **Non-deterministic nodes.**恢复假设节点输入会产生相同的状态更新――随机种子、墙钟、外部API 都必须被捕获――
- **Over-use of conditional edges.**每条边缘都是条件的图,是一个无法推理的状态机.


```figure
langgraph-state
```

## 构建它

`code/main.py`实现一个 stdlib状态图:

- `State`包含一个字符:`messages`,我知道.`step`,我知道.`route`,我知道.`output`,我知道.`human_approval`,我知道.
- `Node`接收状态并返回更新命令的调用量.
- `StateGraph`:节点+边缘+条件边缘+运行+重复――
- `SQLiteCheckpointer`(内存假):在每个节点后序列化状态;`load(session_id)`恢复
- 一个演示图:分类 -> 分类(退款 / 错误 / 销售) -> 人类门 -> 发送──

运行它:

```
python3 code/main.py
```

后续会显示第一次运行在人门 失败、完成持久化,然后恢复并产生最终输出.

## 使用它

- **LangGraph**为了实现,生产准备――使用`create_react_agent`,我知道.`create_supervisor`构建自己的图表.
- **AutoGen v0.4**(课14):适用于高竞争情形的演员模式替代方案.
- **Claude Agent SDK**课程17:带内置的会议商店的管理套装.
- **Custom**您需要对状态形状或检查点后端进行精确控制时使用.

## 交付它

`outputs/skill-state-graph.md`会在任意目标运行时中生成一个长度图形状态图,并接好检查点和恢复.

## 练习

1. 当分类信心低于值时,从`classify`添加一条条件边缘到`end`△在人类手动设置`route`后续续历运行
2. 测量每一步的序列化总额.
3. 实现平行边缘:两个节点并发运行,并通过定制减小器合并.
4. 阅读 `langgraph-supervisor`转移到`create_supervisor`△比较痕迹形状──
5. 添加流量:每一个节点在运行时产生部分状态――打印到达的海域――

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| State graph | “Agent 即状态机” | Typed state + nodes + edges + reducers |
| Checkpointer | “Persistence backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “State merger” | 将当前 state 与 node update 组合起来的函数 |
| Conditional edge | “Branch” | 由 state 函数选择的 edge |
| Subgraph | “Nested graph” | 作为另一个 graph 中 node 使用的 graph |
| Durable execution | “从失败处 resume” | 使用精确 state 从最后一个成功 node 重启 |
| Supervisor | “Router LLM” | 面向 specialist subagents 的 central dispatcher |
| Swarm | “P2P agents” | Agents 通过 shared tools hand off；没有 central router |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)参考文件
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/)监督模式API
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/)演员模式 替代方案
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)会议商店与副行员
