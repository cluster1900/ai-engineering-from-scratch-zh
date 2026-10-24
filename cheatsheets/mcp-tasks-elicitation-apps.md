---
id: mcp-tasks-elicitation-apps
title: MCP Tasks, Elicitation and Apps
code: MT
subtitle: MCP 2026-07-28 上的显式 scope、MRTR elicitation、持久 Task、Apps UI 资源和安全取消。
hue: 280
sources: phases/13-tools-and-protocols/12-mcp-roots-and-elicitation, phases/13-tools-and-protocols/13-mcp-async-tasks, phases/13-tools-and-protocols/14-mcp-apps, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control
source_hash: 79e5ebd870162891
---

## MRTR elicitation 往返
type: flow
from: phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/docs/en.md, phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code/main.py

1. **客户端**：发送 `tools/call` id 1，`_meta` capabilities 中带 `elicitation: {"form": {}}`。
2. **服务器**：返回带 `inputRequests.delete_choice` 的 `resultType: "input_required"`。
3. **服务器**：用主体、方法、`argumentsDigest`、`candidateIds`、nonce 和过期时间签名 `requestState`。
4. **宿主**：渲染表单。用户选择 accept、decline 或 cancel。
5. **客户端**：用新的 id 2、`inputResponses` 和相同的 `requestState` 重试 `tools/call`。
6. **服务器**：校验 state，重新授权工作区并重新检查包含关系。
7. **服务器**：一次性认领 nonce，执行删除，返回 `resultType: "complete"`。

## 无状态核心上的 Task 生命周期
type: architecture
from: phases/13-tools-and-protocols/13-mcp-async-tasks/docs/en.md, phases/13-tools-and-protocols/13-mcp-async-tasks/code/main.py

```arch
node | client | 1,1 | Client | declares tasks extension | client
node | call | 2,1 | tools/call | resultType task | process
node | store | 3,1 | Durable store | persist before return | store
node | worker | 4,1 | Worker | advance_worker | process
node | working | 1,2 | working | statusMessage |
node | input | 2,2 | input_required | inputRequests |
node | done | 3,2 | completed | nested result |
node | stop | 4,2 | cancelled or failed | error on failed |
edge | client | call | _meta
edge | call | store | taskId
edge | store | worker | lease
edge | working | input | worker
edge | input | working | tasks/update
edge | working | done | worker
edge | working | stop | tasks/cancel
```

## Task 方法与信号
type: command-table
from: phases/13-tools-and-protocols/13-mcp-async-tasks/docs/en.md, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md

| 命令 | 作用 |
|---|---|
| `tasks/get` | 完整快照。外层 `resultType` 始终为 complete |
| `tasks/update` | 发送 `inputResponses`。返回空确认 |
| `tasks/cancel` | 记录取消意图。确认不是最终状态 |
| `subscriptions/listen` | 带 task 快照 SSE 响应流的 POST |
| `notifications/tasks` | 标记了 listen 请求 id 的完整快照 |
| `notifications/cancelled` | 仅在 stdio 上请求取消。绝不用于 Task |
| 关闭响应流 | 在 Streamable HTTP 上请求取消 |
| `tasks/status`, `tasks/result`, `tasks/list` | 已移除。Method not found |

## 驱动一个持久 task
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/13-mcp-async-tasks/code/main.py

```python
service = TaskService(directory)                # file-backed TaskStore
created = service.dispatch(make_request(1, "tools/call",
    {"name": "generate_report", "arguments": {"size": "large"}}))
task_id = created["result"]["taskId"]           # resultType task, working
service = TaskService(directory)                # new instance reloads it
service.advance_worker(task_id)                 # working to input_required
service.dispatch(make_request(3, "tasks/get", {"taskId": task_id}))
service.dispatch(make_request(4, "tasks/update", {"taskId": task_id,
    "inputResponses": {"approve_outline": {"action": "accept",
                                           "content": {"approved": True}}}}))
service.advance_worker(task_id)                 # stage 2 to completed
body, headers = make_http_request(5, "tasks/get", {"taskId": task_id})
headers["Mcp-Name"]                             # equals params.taskId
```

## 幂等、缓冲与重连
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code/main.py

```python
ledger = MutationLedger(Path(directory) / "mutations.sqlite3")
ledger.charge("acct-7", 1200, rpc_id=41, idempotency_key="checkout-7")
ledger.charge("acct-7", 1200, rpc_id=42, idempotency_key="checkout-7")
ledger.executions                               # one execution, same receipt
classify_retry(side_effect=True, idempotency_key=None)  # unsafe
buffer = BoundedSseBuffer(3)                    # capacity at least two
buffer.push_final(response)                     # final response never dropped
reconnect_plan(previous_subscription_id, affected_resources,
               unsafe_mutation_was_in_flight=True)  # sendLastEventId False
retry_delay_ms("<client>", attempt)             # capped at 8000 ms
```

## Elicitation 回答
type: comparison
from: phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/docs/en.md, phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code/main.py

| 因素 | accept | decline | cancel |
|---|---|---|---|
| 含义 | 用户已提交 | 用户拒绝 | 用户关闭 |
| 服务器动作 | 校验内容并继续 | 返回完整的拒绝结果 | 安全停止 |
| Nonce | 随删除被消耗 | 被消耗，不删除 | 不消耗 |
| 之后重试 | 否 | 否 | 是，直到过期 |
| 结果 | `deleted: True` | `deleted: False` | `deleted: False` |

## 数字与默认值
type: defaults
from: phases/13-tools-and-protocols/13-mcp-async-tasks/code/main.py, phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code/main.py, phases/13-tools-and-protocols/14-mcp-apps/code/main.py, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| 协议版本 | 2026-07-28 | 每个请求都在 `_meta` 中 |
| Task `ttl_ms` | 900_000 | 从创建时起算 |
| Task `poll_interval_ms` | 1_000 | 建议的最小轮询间隔 |
| `server/discover` `ttlMs` | 300_000 | `cacheScope` public |
| `tools/list` `ttlMs` | 60_000 | 按工具名排序 |
| `requestState` 过期 | 300 | 表单之后的秒数 |
| `ReplayStore` `max_entries` | 1_000 | 存储满时返回 -32023 |
| 退避上限 | 8_000 | 250 ms，每次尝试乘以 2 |

## 错误与故障
type: troubleshooting
from: phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/docs/en.md, phases/13-tools-and-protocols/13-mcp-async-tasks/docs/en.md, phases/13-tools-and-protocols/14-mcp-apps/docs/en.md, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `-32602` | 协议版本缺失或不是字符串 | 在 `_meta` 中发送版本 |
| `-32022` | 版本字符串不受支持 | 读取 `supported` 和 `requested` data |
| `-32021` | 缺少 form、tasks 或 ui capability | 在本次请求中声明 |
| `-32020` | header 与 body 不一致 | 让 `Mcp-Method` 与 `Mcp-Name` 一致 |
| Task id 返回 not found | 存储能读到之前就发出了 handle | 先持久化再返回 |
| 变更执行了两次 | 用新的 JSON-RPC id 去重 | 加一个持久的幂等键 |
| 卡住的工作永不结束 | 每次进度都重置截止时间 | 保留一个绝对的最大超时 |
| UI 显示已停止，worker 仍在运行 | 把取消确认当成最终状态 | 轮询 Task 直到终止状态 |

## Apps 规则
type: concepts
from: phases/13-tools-and-protocols/14-mcp-apps/docs/en.md, phases/13-tools-and-protocols/14-mcp-apps/code/main.py

- **扩展**：`io.modelcontextprotocol/ui`，双方在每个请求上都要声明。
- **绑定**：在任何调用之前，`tools/list` 中工具上的 `_meta.ui.resourceUri`。
- **资源**：MIME 为 `text/html;profile=mcp-app` 的 `ui://notes/timeline.html`。
- **CSP**：默认 `connectDomains`、`resourceDomains`、`frameDomains`、`baseUriDomains` 为空。
- **桥接**：View 发送 `ui/initialize`，宿主应答后再发送 `ui/notifications/initialized`。
- **兜底**：没有 ui capability 时，提供不带 `_meta.ui` 的工具和文本结果。
- **缓存键**：`ui://` URI、服务器身份和版本、内容摘要，private 时加上主体。

## Scope 规则
type: tips
from: phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/docs/en.md

- Roots 已弃用。把 scope 放在 `workspaceUri` 参数或资源 URI 中。
- 实施三层：授权、包含检查和操作系统沙箱。
- 先规范化 URI。然后比较路径组件，而不是字符串前缀。
- 绝不对密码、API key、token 或支付数据使用表单模式。
- URL 模式的 `accept` 表示用户同意打开该 URL，不能证明已完成。
- 空的 `"elicitation": {}` 表示支持表单。仅 URL 则不算。

## 问答
type: qa
from: phases/13-tools-and-protocols/13-mcp-async-tasks/docs/en.md, phases/13-tools-and-protocols/14-mcp-apps/docs/en.md, phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md

- **谁决定一个调用变成 Task？** 服务器。客户端只声明扩展。
- **最终 task 结果在哪里？** 在下一个 `tasks/get` 快照的 `result` 下。
- **在 task 创建前还是后输入？** 之前：MRTR 重试。之后：`tasks/update`。
- **`ui/initialize` 会启动 MCP 会话吗？** 不会。它只是 iframe 桥接握手。
- **`isError: true` 工具结果就是失败的 Task 吗？** 不是。该 Task 为 `completed`。
- **用 `Last-Event-ID` 恢复断开的流？** 不行。打开新的 listen 请求并重新获取。
