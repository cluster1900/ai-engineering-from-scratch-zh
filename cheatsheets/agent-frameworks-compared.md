---
id: agent-frameworks-compared
title: Agent Frameworks Compared
code: AC
subtitle: 按问题形态、状态和路由成本，在 LangGraph、CrewAI、AutoGen、Agno、Mastra、agent SDK 或纯 Python 之间选择。
hue: 280
sources: phases/11-llm-engineering/17-agent-framework-tradeoffs, phases/14-agent-engineering/14-autogen-actor-model, phases/14-agent-engineering/15-crewai-role-based-crews, phases/14-agent-engineering/16-openai-agents-sdk, phases/14-agent-engineering/17-claude-agent-sdk, phases/14-agent-engineering/18-agno-and-mastra-runtimes, projects/typed-workflow-agent-with-mastra, projects/support-agent-with-google-adk
source_hash: e7088d4e33659396
---

## 编排框架对比
type: comparison
span: 2
from: phases/11-llm-engineering/17-agent-framework-tradeoffs/docs/en.md

| 维度 | LangGraph | CrewAI | AutoGen | Agno |
|---|---|---|---|---|
| 核心抽象 | `StateGraph` | `Crew` | `ConversableAgent` 对 | `Agent` |
| 心智模型 | 状态机 | 专家团队 | 聊天 | 开箱即用的 agent |
| 状态 | 类型化状态，checkpointer | 通过 `context` 传字符串 | 聊天历史 | 通过 `storage=` 的 session 存储 |
| 谁来分支 | 你，用条件边 | manager，或你在构建时 | agent，通过聊天 | 下一次工具调用 |
| 路由 token | 只在你写 `llm.invoke` 的地方 | 分层 manager 消耗 token | `GroupChatManager` 消耗 token | 精简的单 agent 路径 |
| 最适合 | 类型化状态，人工中断 | 简短的角色驱动计划 | 提议者-批评者对话 | 单 agent、session、记忆 |
| 最不适合 | 拓扑未知 | 复杂分支 | 已知 DAG，持久状态 | 深度分支的图 |

## Agent SDK 与运行时对比
type: comparison
span: 2
from: phases/14-agent-engineering/14-autogen-actor-model/docs/en.md, phases/14-agent-engineering/16-openai-agents-sdk/docs/en.md, phases/14-agent-engineering/17-claude-agent-sdk/docs/en.md, phases/14-agent-engineering/18-agno-and-mastra-runtimes/docs/en.md

| 维度 | OpenAI Agents SDK | Claude Agent SDK | AutoGen v0.4 | Mastra |
|---|---|---|---|---|
| 原语 | Agent、Handoff、Guardrail、Session、Tracing | Tools、MCP、hooks、subagents、session store | Core、AgentChat、Extensions | Agents、Tools、Workflows |
| 委派 | 名为 `transfer_to_<agent_name>` 的工具 | 拥有独立上下文的 subagent | 发往 actor 收件箱的消息 | Workflow 步骤 |
| 状态 | `Session` 存于 SQLite、Redis 或自定义 | `append`、`load`、带级联的 `delete` | actor 私有状态 | 组合存储 |
| Tracing | 默认开启 | W3C trace context 传入 CLI | 每条消息一个 span | Mastra Studio |
| 用于 | OpenAI 优先的产品 | Claude 优先的产品 | actor 并发，故障隔离 | TypeScript、Next.js 或 Vercel |

## 何时用哪个
type: concepts
from: phases/11-llm-engineering/17-agent-framework-tradeoffs/docs/en.md, phases/14-agent-engineering/15-crewai-role-based-crews/docs/en.md, phases/14-agent-engineering/18-agno-and-mastra-runtimes/docs/en.md

- **LangGraph**：类型化状态、审批、恢复、`Send` 扇出。
- **CrewAI**：在某一步中调用 `Crew.kickoff()` 的 Flow。
- **AutoGen**：提议者-批评者对话。
- **Agno**：大量短生命周期的 Python agent，FastAPI。
- **Mastra**：TypeScript、Next.js 或 Vercel，Zod 类型化工具。
- **纯 Python**：两次 LLM 调用加一个工具。

## 决策树：recommend(p)
type: flow
from: phases/11-llm-engineering/17-agent-framework-tradeoffs/code/main.py

1. **plain python**：`total_llm_calls` 不超过 2。没有角色、对话、恢复、扇出或人工中断。
2. **langgraph**：`needs_resume`、`needs_human_interrupt` 或 `has_parallel_fanout`。
3. **autogen**：有 `has_dialogue` 而无 `has_typed_state`。
4. **crewai**：有 `has_roles` 而无 `has_typed_state`。
5. **agno**：`needs_session_memory`，没有角色，没有对话。
6. **langgraph**：`has_typed_state`，以及兜底情况。

## Actor 运行时（AutoGen v0.4 形态）
type: architecture
from: phases/14-agent-engineering/14-autogen-actor-model/code/main.py, phases/14-agent-engineering/14-autogen-actor-model/docs/en.md

```arch
node | user | 1,1 | __user__ | sends start | client
node | queue | 2,1 | Runtime queue | Message deque | queue
node | check | 3,1 | ChecklistAgent | sends three reviews | process
node | dlq | 1,2 | dead_letters | failed messages | store
node | rev | 3,2 | ReviewerAgent | sends review_result | process
edge | user | queue | send
edge | queue | check | start
edge | check | queue | review
edge | queue | rev | review
edge | rev | queue | review_result
edge | rev | dlq | crash_me raises
```

## 代码中的 SDK 任务
type: task-table
from: phases/11-llm-engineering/17-agent-framework-tradeoffs/code/main.py, phases/14-agent-engineering/15-crewai-role-based-crews/docs/en.md, phases/14-agent-engineering/16-openai-agents-sdk/docs/en.md, phases/14-agent-engineering/17-claude-agent-sdk/docs/en.md

| 任务 | 代码 |
|---|---|
| 询问推荐器 | `python main.py --ask` |
| 交接给一个 agent | `transfer_to_<agent_name>` |
| 关闭 tracing | `OPENAI_AGENTS_DISABLE_TRACING=1` |
| 把 span 扇出到你的后端 | `add_trace_processor(processor)` |
| 带存储历史运行 | `Runner.run(agent, input, session=session)` |
| 强制类型化的 task 输出 | `output_pydantic=MyModel` |
| 列出 subagent 会话 | `list_subkeys(session_id)` |

## 在 Mastra 中挂起与恢复
type: annotated-code
lang: typescript
from: projects/typed-workflow-agent-with-mastra/solution/optional-mastra/adapter.ts, projects/typed-workflow-agent-with-mastra/solution/optional-mastra/cli.ts

```typescript
const workflow = createWorkflow({ id: "ticket-triage", inputSchema: ticketSchema, outputSchema: resultSchema })
  .then(classifyStep)                    // intent read or write
  .then(planStep)                        // lookup or update action
  .then(executeStep)                     // suspends before an update
  .commit();
if (!resumeData?.approved)
  return suspend({ ticketId: plan.ticket.id, planHash: digest });  // digest = planHash(plan)
const { workflow, storage } = await persistentWorkflow(tool, "file:" + resolve(args["--db"]));
const run = await workflow.createRun({ runId: args["--resume"] });  // fresh process, same file
result = await run.resume({ step: "execute", resumeData });  // approved, ticketId, planHash
```

## 运行项目
type: command-table
span: 2
from: projects/typed-workflow-agent-with-mastra/README.md, projects/support-agent-with-google-adk/README.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py <project> --stage 1 --path <dir> --strict` | 评分一个阶段 |
| `python3 scripts/project_test.py <project> --all --solution --optional --strict` | 运行真实 SDK 测试。SKIP 记为失败 |
| `node --experimental-strip-types cli.ts --ticket fixtures/ticket.json --out workflow-output` | 从零写的 workflow。需要审批时写入 checkpoint |
| `node --experimental-strip-types optional-mastra/cli.ts --ticket fixtures/ticket.json --db ./runs.db --out pending-output` | 持久化的 Mastra 运行。报告一个 runId |
| `python3 main.py --ticket fixtures/ticket.json --out support-output` | 在 index.html 中离线审阅客服回复 |
| `main.py --ticket YOUR_TICKET.json --adk --out support-adk-output` | 同一工单经过真实 ADK agent |

## 项目构建与检查什么
type: concepts
from: projects/typed-workflow-agent-with-mastra/README.md, projects/typed-workflow-agent-with-mastra/project.json, projects/typed-workflow-agent-with-mastra/solution/main.ts, projects/support-agent-with-google-adk/README.md, projects/support-agent-with-google-adk/project.json, projects/support-agent-with-google-adk/solution/intake.py

- **Mastra 构建**：类型化审批 workflow。在更新前挂起，并从 SQLite 恢复。
- **Mastra 输出**：`workflow.json`，以及 approved=false 的 `approval.json`。
- **Mastra 检查**：审批匹配时产生一次工具调用。hash 错误时零次调用。
- **ADK 构建**：脱敏的客服回复或人工升级，然后在真实 ADK agent 中执行同样的规则。
- **ADK 输出**：HTML 审阅页和 `support.json`。
- **ADK 检查**：发票登录同时牵涉账单和访问权限，所以会升级。

## 默认值与限制
type: defaults
from: phases/14-agent-engineering/14-autogen-actor-model/code/main.py, phases/14-agent-engineering/15-crewai-role-based-crews/code/main.py, phases/14-agent-engineering/16-openai-agents-sdk/code/main.py, phases/14-agent-engineering/16-openai-agents-sdk/docs/en.md, projects/typed-workflow-agent-with-mastra/solution/main.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| Runner `max_hops` | 3 | 防止交接漂移的跳数计数器 |
| Runtime `max_messages` | 100 | 每次 `run_until_idle` 的消息数 |
| HierarchicalCrew `max_steps` | 5 | 停止前的 manager 轮数 |
| Guardrail 模式 | Parallel | 尾延迟更低，触发时浪费 token |
| `executePlan` `maxCalls` | 3 | 允许范围 1 到 100 |
| `executePlan` `maxAttempts` | 2 | 允许范围 1 到 10 |

## 故障排查
type: troubleshooting
from: phases/14-agent-engineering/15-crewai-role-based-crews/docs/en.md, phases/14-agent-engineering/16-openai-agents-sdk/docs/en.md, phases/14-agent-engineering/17-claude-agent-sdk/docs/en.md, phases/14-agent-engineering/18-agno-and-mastra-runtimes/docs/en.md, projects/typed-workflow-agent-with-mastra/README.md

| 现象 | 原因 | 解决 |
|---|---|---|
| A 交接给 B，B 又交回给 A | 交接漂移 | 加跳数计数器 |
| 内置工具绕过了检查 | 工具 guardrail 只对函数工具触发 | 另加一条策略 |
| Task N+1 对自由文本随意发挥 | 交接脆弱 | 在 Task N 上设置 `output_pydantic` |
| Crew 消耗太多 token | manager LLM 的 token 税 | 改用 Sequential |
| 第一次工具调用前上下文已耗尽 | backstory 过长 | backstory 控制在 200 词以内 |
| 开销盖过小任务本身 | subagent 生成过多 | 把任务批量处理 |
| 会话无限增长 | 会话膨胀 | 使用 `list_sessions` 和过期策略 |
| 恢复在工具前失败 | 审批中的工单或摘要不对 | 保持 ticketId 与 planHash 不变 |

## 问答
type: qa
from: phases/14-agent-engineering/14-autogen-actor-model/docs/en.md, phases/14-agent-engineering/16-openai-agents-sdk/docs/en.md, phases/14-agent-engineering/18-agno-and-mastra-runtimes/docs/en.md, phases/11-llm-engineering/17-agent-framework-tradeoffs/docs/en.md, projects/support-agent-with-google-adk/solution/adk_adapter.py

- **为什么交接是一个工具？** 模型调用 `transfer_to_billing_agent`。运行时切换 agent。
- **为什么 actor 能隔离故障？** `send(agent_b, msg)` 只负责入队。运行时捕获 handler 崩溃。
- **模型能改变 ADK 路由吗？** 不能。它会抛出 `ValueError`。
