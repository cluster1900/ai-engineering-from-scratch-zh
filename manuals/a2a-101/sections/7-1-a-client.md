# 客户端

> 能用的客户端是一个循环：它读取 card，为每个 skill 选一个 agent，并为任务可能到达的每个状态准备一个分支。

planner 只有一项工作：把一个变更交付到 `payments-api`。它必须在 commit `a41d7c3` 上运行测试，让 diff 得到审查，并把构建 `2026.10.06-1` 部署到 staging。它一开始只有三个端口号、一个给 deployer 的令牌，以及基准分支的名称。[planner](manuals/a2a-101/capture/planner.py) 用 86 行完成了全部工作，[它的日志](manuals/a2a-101/capture/out/19-planner.log)记录了每个决定。

读完本节后，你能编写一个按 skill 委派、并处理任务到达的每个状态的客户端。

## 发现：先读取每张 card {#s-a-client-discover-read-every-card-first}

在发送任何东西之前，planner 读取每个端口上的 card。它选取 `protocolBinding` 为 `JSONRPC`、`protocolVersion` 为 `1.0` 的接口，并把每个 skill id 归到提供它的 agent 名下。它还记下每张 card 的 `streaming` 标志和 `securityRequirements`。

规范的规则是按位置的：客户端选择它支持的第一种传输 {{spec §8.3.2}}。在这里两条规则一致，因为在全部三张 card 上 JSON-RPC 都排在第一。[发现与支持的接口](#s-discovery-and-supported-interfaces)一节给出了完整的选择规则。

## 委派：发送一次，然后根据回复分支 {#s-a-client-delegate-send-once-then-switch-on-the-reply}

每次委派都是一个不带 `returnImmediately` 的 `SendMessage`。它会阻塞，直到任务到达终止状态或中断状态，正如 [SendMessage](#s-send-message) 一节所解释的。bearer 令牌只发给 card 要求令牌的 agent，如[安全方案](#s-security-schemes-and-in-task-authorization)一节所述。然后一个循环根据回复分支。

```listing
title: delegate, the loop that switches on every reply
source: capture/planner.py
lang: python
note: The loop of the delegate method, complete. The lines above it, which pick the agent and send the message, are cut.
---
        while True:
            if "error" in reply:
                self.note(f"  error {reply['error']['code']}: {reply['error']['message']}")
                return None
            result = reply["result"]
            if "message" in result:
                self.note("  direct reply, no task to follow")
                return result["message"]
            task = result["task"] if "task" in result else result
            state = task["status"]["state"]
            self.note(f"  task {task['id'][:8]} is {state}")
            if state in TERMINAL:
                return task
            question = task["status"]["message"]["parts"][0]["text"]
            if state == "TASK_STATE_INPUT_REQUIRED":
                answer = self.answer(question)
                self.note(f"  it asks: {question} The planner answers from its own context: {answer}")
                _, reply = self.client.rpc(f"SendMessage: answer {agent['name']}", agent["port"], "SendMessage", {"message": self.client.message(answer, task_id=task["id"], context_id=task["contextId"])}, headers=headers)
                continue
            if state == "TASK_STATE_AUTH_REQUIRED":
                self.note(f"  it needs approval: {question} The planner cannot approve, so it asks the operator and subscribes.")
                return self.follow(agent, task, headers)
```

回复有三种形状，按顺序检查：错误、直接的 `message`，或者 `task` {{proto SendMessageResponse}}。`TERMINAL` 元组包含全部四种终止状态，包括客户端最常忘记的 `TASK_STATE_REJECTED`。

遇到 `TASK_STATE_INPUT_REQUIRED` 时，planner 在同一个任务上用它的 `taskId` 和 `contextId` 回答，正如[中断状态](#s-input-required-and-auth-required)一节所解释的。遇到 `TASK_STATE_AUTH_REQUIRED` 时，planner 没有什么可发送的，所以把任务交给 `follow`。

## 跟进：先订阅，再叫操作员 {#s-a-client-follow-subscribe-then-call-the-operator}

订阅的第一帧是任务的快照，如[流式传输](#s-streaming-and-subscribe-to-task)一节所示。planner 先订阅，只有在那个快照到达时才叫操作员。

```listing
title: follow, until the stream ends
source: capture/planner.py
lang: python
note: The whole method. The operator call stands in for a person who approves outside A2A.
---
    def follow(self, agent, task, headers):
        def on_frame(index, event):
            if index == 1:
                self.operator(task)

        _, events = self.client.rpc(f"SubscribeToTask on {agent['name']}", agent["port"], "SubscribeToTask", {"id": task["id"]}, headers=headers, on_frame=on_frame)
        final = events[-1]["result"]["statusUpdate"]["status"]["state"]
        self.note(f"  the stream ends at {final}")
        return {"id": task["id"], "status": {"state": final}}
```

叫操作员是一个 A2A 之外的 `POST /approve/<task id>`。流在操作员行动之前就已打开，所以批准之后的任何更新都不会在 planner 没看到的情况下溜过 {{spec §7.6.2}}。快照之后还有三帧，最后一帧带有 `TASK_STATE_COMPLETED`。

## 这次运行，一个决定接一个决定 {#s-a-client-the-run-decision-by-decision}

在两次委派之间，`ship` 方法决定是否继续。如果测试任务没有完成、有任何测试失败，或者有任何高严重度的发现，它就停止。[图](#fig-planner-run)把 `19-planner.log` 中的这次运行画成三条泳道，决定画在它们下方。

```figure
id: fig-planner-run
kind: flow
title: the planner's run, decision by decision
claim: The planner reads three cards, delegates three skills in turn, answers a question, escalates an approval, and decides from data parts before each next step.
caption: Read the three lanes left to right, then the decisions row. Each lane is one delegation, top to bottom, with the states the replies carried. Task ids are shortened to 8 characters. From capture/out/19-planner.log and 19-planner.http.
```

每个决定都读取一个数据 part，绝不读取自由文本：从 `summary.json` 读取 `passed` 和 `failed`，从 `review.json` 的每个发现中读取 `severity`。在 commit `9f3c2e1` 上有一个测试失败，planner 会在审查之前停止。

## 生产环境的 planner 还要加什么 {#s-a-client-what-a-production-planner-adds}

面对它无法控制的 agent，planner 需要的不只是 kit 的循环。

- **安全的重试。** 用同一个 `messageId` 重发失败的消息 {{spec §3.3.1}}。保留第一个回复，因为在参考 SDK 中，不带 `taskId` 的重发会创建第二个任务 {{sdk src/a2a/server/agent_execution/active_task.py}}。
- **超时。** kit 的客户端在[它的网络代码](manuals/a2a-101/capture/wire.py)中给每个请求 15 秒，而规范没有设定超时。对于耗时长的工作，设置 `returnImmediately` 并跟进任务。
- **card 检查。** 用标准的 HTTP 缓存来缓存 card {{spec §8.6}}，并按[扩展 card 与签名 card](#s-extended-cards-and-signatures) 一节所示验证 deployer 的 `signatures`。
- **能力检查。** planner 记录了 `streaming`，却从不读取它。面对不支持流式传输的 agent，它的 `SubscribeToTask` 会得到 `UnsupportedOperationError` {{spec §3.3.4}}。
- **每个状态一个分支。** 循环没有 `TASK_STATE_SUBMITTED` 或 `TASK_STATE_WORKING` 的分支。立即回答阻塞发送的服务器（[冲突 D2](#s-ref-sources)）会让它在同一个回复上不停循环。
- **检查每个结果。** `ship` 方法读取审查 artifact 时不检查审查任务是否完成，`follow` 在流断开时需要调用 `GetTask`。
- **真正的操作员渠道。** 通过经过认证的渠道把每次批准交给一个人，并记录是谁批准的。

```rule
label: read the card before the call
source: spec §3.3.4
---
A client should read the Agent Card to confirm that a capability is supported before it calls an operation that needs an optional capability.
```

```takeaways
- 在第一次委派之前，根据 card 把 skill 映射到 agent。
- 给回复循环准备分支，覆盖每种结果形状和每种任务状态。
- 在操作员批准之前，先订阅处于 `TASK_STATE_AUTH_REQUIRED` 的任务。
```

Sources: spec §3.3.1, §3.3.4, §7.6.2, §8.3.2, §8.6 (research/sources/specification.md); proto SendMessageResponse (research/sources/a2a.proto); sdk src/a2a/server/agent_execution/active_task.py at a2a-python 1.2.2; capture/planner.py, capture/wire.py, capture/run.py, capture/agents.py; capture/out/19-planner.http, 19-planner.log
