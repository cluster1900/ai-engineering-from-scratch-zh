---
name: stategraph-designer
description: 将一个 agent 任务转换为带有命名 nodes、typed state、reducers、checkpointer 和 human interrupts 的 LangGraph StateGraph。
version: 1.0.0
phase: 11
lesson: 16
tags: [langgraph, stategraph, checkpointer, interrupt, time-travel, react-agent, human-in-the-loop]
---

给定 agent 任务（面向用户的目标、可用 tools、预期轮次数、带安全影响范围的 side effects、durability 要求、目标 latency budget），输出：

1. Node list。命名每一个离散步骤：LLM thinker、每个 tool runner、每个人类 review 步骤、任何 summarizer 或 critic、任何 retriever。如果任何 node 触及超过一个关注点，拒绝该设计；将其拆分。
2. State schema。TypedDict（或 Pydantic）字段，并为每个 list 配置 reducer。message log 始终使用 Annotated[list, add_messages]。将任何特定任务的 list 从 messages 中提升出来（plan、budget counter、retrieved-docs list），以便 reducers 在并行更新下保持正确。
3. Edge map。下一步是确定性的地方使用 static edges。只有在模型选择下一步时，才使用带命名 router function 的 conditional edges。拒绝任何 router function 依赖尚未在先前 node 中完成的全新 LLM call 的 graph。
4. Interrupt placement。对每个具有不可逆 side effect 的 node（writes、deletes、payments、带成本的外部 API calls）设置 interrupt_before。当 output validation 在单独进程中运行时，对 model node 设置 interrupt_after。拒绝在任何产生 side effect 的 node 上设置 interrupt_after；到那时 side effect 已经发生。
5. Checkpointer。MemorySaver 仅用于测试。对于任何必须在重启后继续存在的环境，从 PostgresSaver、SQLiteSaver、RedisSaver 中选择。确认 thread_id 策略（per-user、per-session、per-conversation）和 checkpoint TTL。

拒绝交付没有 checkpointer 的 LangGraph。没有 checkpointer 意味着无法 resume、无法 time-travel、无法进行 human-in-the-loop replay。拒绝交付没有 add_messages 的 messages 字段；第二次写入会静默覆盖第一次写入，半段对话会消失。拒绝每个 transition 都是由 planner LLM 路由的 conditional edge 的 graph；那只是多了几个步骤的 AutoGen，并且每轮都会消耗 Token。

示例输入: "基于 Anthropic Claude 的退款处理 agent，配有三个工具 (lookup_order, issue_refund, send_email)，任何超过 100 美元的退款前必须暂停等待人工确认，必须能在服务器重启后恢复，p95 latency budget 为 8 秒。"

Example output:
- Nodes: agent (LLM call), lookup_tool, refund_tool, email_tool, human_review.
- State: messages with add_messages, order_context（overwrite）, refund_amount（overwrite）, reviewer_decision（overwrite）。
- Edges：agent 到 should_continue router，带有 branches lookup_tool、refund_tool、email_tool、human_review、END。Tool nodes 返回 agent。
- Interrupts: interrupt_before on refund_tool when refund_amount > 100. No interrupt on lookup_tool or email_tool.
- Checkpointer: PostgresSaver with thread_id "user:{user_id}:case:{case_id}" and 30-day TTL.
