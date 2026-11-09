# sub_agents、transfer_task 与 background_agents

> `transfer_task` 在干净的子会话中运行子智能体并返回它的回答，`handoff` 把整个会话移交给另一个智能体，后台智能体启动需要批准。

你想要一个协调者，先向 writer 要一句话，再让 reviewer 回答用户。一份智能体文件可以把两件事都写上：一次会返回的委派，和一次不会返回的移交。

读完本节后，你能在 `sub_agents`、`handoffs` 和 `background_agents` 之间做出选择，并在事件流中读懂每一种。

## 团队文件 {#s-sub-agents-transfer-task-and-background-agents-the-team-file}

```listing
title: 一个协调者、一个 writer 和一个 reviewer
source: capture/fixtures/agents/team.yaml
lang: yaml
note: writer 和 reviewer 的 instruction 以及 models 块已删节。
---
version: "16"

agents:
  root:
    model: local
    description: Coordinates a writer and a reviewer.
    instruction: |
      You coordinate two colleagues and never write text yourself.
      For every request: first call transfer_task to ask the writer for
      the text, then call handoff to pass the conversation to the reviewer.
    max_iterations: 6
    sub_agents: [writer]
    handoffs: [reviewer]
    toolsets:
      - type: background_agents

  writer:
    model: local
    description: Writes one sentence on a given topic.
…
    max_iterations: 3

  reviewer:
    model: local
    description: Reviews the sentence it receives.
…
```

三个智能体都使用模型 `local`，也就是 `dmr/ai/qwen3:4b`。`transfer_task` 和 `handoff` 都不出现在 `toolsets` 下，因为这两个列表会注入它们（[冲突 C56](#s-ref-sources-and-the-conflicts-register)）。

## transfer_task：子会话中的子智能体 {#s-sub-agents-transfer-task-and-background-agents-transfer-task-a-child-in-a-sub-session}

**委派：** 一次带 `agent`、`task` 和 `expected_output` 的 `transfer_task` 调用，由 `sub_agents` 加到父智能体上。该调用会等到子智能体返回结果，这个结果成为工具的响应 {{docs-agent Transfer Task Tool}}。

```listing
title: 一次委派和一次会话移交，以事件呈现
source: capture/out/19-transcript.txt
lang: text
note: sub_session_completed 行在 task 之后删节，会话移交的长工具响应对在第一句之后删节。
---
user: Ask the writer for one sentence about microVMs.
root -> tool_call transfer_task {"agent": "writer", "task": "Generate one sentence about microVMs", "expected_output": "A single sentence describing microVMs"}
agent_switching: {"agent_name": "writer", "switching": true, "from_agent": "root", "to_agent": "writer"}
writer: MicroVMs are lightweight virtual machines that provide strong isolation and security for applications with minimal resource overhead.
stream_stopped (stop, normal)
sub_session_completed: {"agent_name": "root", "parent_session_id": "<uuid>", "sub_session": {"id": "<uuid>", "origin": "run", "title": "Transferred task", "messages": [{"message": {"agent_name": "", "message": {"role": "system", "content": "You are a member of a team of agents. Your goal is to complete the following task:\n\n<task>\nGenerate one sentence about microVMs\n</task>…
agent_switching: {"agent_name": "root", "switching": false, "from_agent": "writer", "to_agent": "root"}
root <- tool_call_response Transfer Task: MicroVMs are lightweight virtual machines that provide strong isolation and security for applications with minimal resource overhead.
root -> tool_call handoff {"agent": "reviewer"}
root <- tool_call_response Handoff Conversation: The agent root handed off the conversation to you. …
reviewer: APPROVED: MicroVMs are lightweight virtual machines that provide strong isolation and security for applications with minimal resource overhead.
stream_stopped (stop, normal)
user: Now hand the conversation to the reviewer.
reviewer: APPROVED: MicroVMs are lightweight virtual machines that provide strong isolation and security for applications with minimal resource overhead.
stream_stopped (stop, normal)
```

writer 从未看到用户的消息。它的子会话以一条持有 `<task>` 和 `<expected_output>` 的系统消息开始。后面跟着一条隐式用户消息，"Please proceed."。子会话在 writer 自己的 `max_iterations: 3` 下运行，带 `"tools_approved": false`。然后 `agent_switching` 把控制权交回 `root`，那句话作为工具响应回来。

`transfer_task` 是唯一总是无需提示就获批的工具 {{docs-agent Multi-Agent Systems}}，capture 与此一致：该调用在 `--exec` 下没有引发确认。委派给已经在链中的智能体会失败，深度上限是 10 层嵌套委派 {{docs-agent Transfer Task Tool}}。`sub_agents` 条目也可以是仓库引用。除非你把它钉到 digest，它的 tag 会在每次运行时重新解析 {{schema AgentConfig}}。

## 会话移交 {#s-sub-agents-transfer-task-and-background-agents-the-session-move}

**会话移交：** 一次只带一个参数 `agent` 的 `handoff` 调用，由 `handoffs` 加入。被点名的智能体成为活动智能体，并看到整段对话历史 {{docs-agent Multi-Agent Systems}}。在 capture 中，`root` 在那句话回来之后的下一轮模型回合里调用了它。工具响应告诉 `reviewer` 它能用哪些工具和智能体，然后 `reviewer` 回答了用户。

第二条消息展示了这次移交。它直接到了 `reviewer`，移交之后 transcript 里再也没有 `root` 行。`force_handoff` 在每一次没有工具调用的最终响应上做同样的移交 {{schema AgentConfig}}。

## background_agents {#s-sub-agents-transfer-task-and-background-agents-background-agents}

**后台智能体：** `run_background_agent` 启动的子智能体任务，立刻返回一个任务 id。`list_background_agents`、`view_background_agent` 和 `stop_background_agent` 跟进它，目标必须在调用者的 `sub_agents` 中 {{docs-agent Background Agents Tool}}。

```listing
title: 一个从未启动的后台智能体
source: capture/out/19-background.txt
lang: text
note: 第 4 到第 13 行，另外五次带相同参数的确认和拒绝，已删节。
---
user: Run the writer as a background agent on the topic microVMs, wait for it, and repeat its sentence.
tool_call_confirmation: {"agent_name": "root", "tool_call": {"id": "<call-id>", "type": "function", "function": {"name": "run_background_agent", "arguments": "{\"agent\": \"writer\", \"task\": \"Write one sentence on the topic microVMs\", \"expected_output\": \"A single sentence about microVMs\"}"}}, "metadata": {"safety_label": "unknown"}}
root <- tool_call_response Run Background Agent: The user rejected the tool call.
…
stderr: Error: Agent terminated: detected 5 consecutive identical calls to run_background_agent. This indicates a degenerate loop where the model is not making progress.
```

在 `--exec` 且没有 `--safety` 时，这次调用本身要求批准，没有终端就被拒绝了。模型反复发出同样的调用，直到运行时以退出码 1 停掉这次运行。上限是 `max_consecutive_tool_calls`，0 表示默认的 5 {{schema AgentConfig}}。在正在运行的任务内部，本会向用户请求批准的工具调用会被自动拒绝 {{docs-agent Background Agents Tool}}。因此无头协调者需要一条针对 `run_background_agent` 及其子智能体所调用工具的 `allow` 规则。本次 capture 没有测试这一点。

kit 要求每条消息只做一次工具调用。带两次并行调用的回合无法从 cassette 回放，如 [session.db、sessions diff 与 eval](#s-session-db-sessions-diff-and-eval) 所说明。

```figure
id: fig-5-4
kind: sequence
title: 一次会返回的委派，然后一次会留下的移交
claim: `transfer_task` 只把任务发给 `writer` 并把句子返回给 `root`，而会话移交让 `reviewer` 回答之后的每一条消息.
caption: 从上往下读，每拍一步。实线墨迹是调用，虚线墨迹是回复，虚线琥珀色是改变会话归属智能体的 `handoff` 调用。琥珀色框是 writer 的子会话。 From capture/out/19-transcript.txt and 19-transfer-task.json.
```

```takeaways
- 当父智能体需要拿回结果时用 `sub_agents`，并把任务写得让子智能体不需要历史。
- 当下一个智能体应当拥有余下的对话时用 `handoffs`。
- 在依赖 `run_background_agent` 之前，给无头协调者一条针对它的 `allow` 规则。
- 把外部子智能体引用钉到 digest，这样每次运行不会去解析 tag。
```

Sources: docs-agent Multi-Agent Systems, Transfer Task Tool, Background Agents Tool (research/sources/docs-docker-agent.md, pages concepts/multi-agent, tools/transfer-task, tools/background-agents); schema AgentConfig (research/sources/agent-schema.json); conflict C56 (research/conflicts-register.md); capture/README.md; capture/fixtures/agents/team.yaml; capture/out/19-team.txt, 19-transcript.txt, 19-transfer-task.json, 19-handoff.json, 19-background.txt, 19-background.ndjson
