---
id: mcp-gateways-operations
title: MCP Gateways, Registries and Conformance
code: GR
subtitle: 经无状态网关路由、准入注册表版本、发现漂移、测试线上协议并把关发布。
hue: 30
sources: phases/13-tools-and-protocols/17-mcp-gateways-and-registries, phases/13-tools-and-protocols/23-capstone-tool-ecosystem, phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift, phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
source_hash: 30a66413dc9dbd36
---

## 网关请求路径
type: architecture
from: phases/13-tools-and-protocols/17-mcp-gateways-and-registries/docs/en.md, phases/13-tools-and-protocols/17-mcp-gateways-and-registries/code/main.py

```arch
node | client | 1,1 | Client | bearer and _meta | client
node | wire | 2,1 | validate_wire | headers equal body | process
node | policy | 3,1 | RBAC and TokenBucket | per principal | process
node | pin | 4,1 | Descriptor pin | descriptor_digest | process
node | reg | 1,2 | Registry record | publication only | store
node | adm | 2,2 | Admission state | verified publisher | store
node | notes | 3,2 | notes backend | fresh request id | process
node | issues | 4,2 | issues backend | fresh request id | process
edge | client | wire | POST
edge | wire | policy | -32020 first
edge | policy | pin | allow
edge | pin | notes | notes.search
edge | pin | issues | issues.list
edge | reg | adm | join
edge | adm | pin | admit
```

## 运行与验证
type: command-table
from: phases/13-tools-and-protocols/17-mcp-gateways-and-registries/docs/en.md, phases/13-tools-and-protocols/23-capstone-tool-ecosystem/docs/en.md, phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md, phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 在课程目录中运行演示 |
| `python3 -m unittest discover code/tests -v` | 运行网关测试（第 17 课） |
| `python3 -m unittest discover -s code/tests -v` | 运行注册表与一致性测试套件 |
| `python3 -q` | 在 `code/` 中打开用于实验的 shell |
| `from main import *` | 在该 shell 中加载实验函数 |

## 代码中的网关任务
type: task-table
from: phases/13-tools-and-protocols/17-mcp-gateways-and-registries/code/main.py, phases/13-tools-and-protocols/23-capstone-tool-ecosystem/code/main.py

| 任务 | 代码 |
|---|---|
| 构建请求和 header | `make_request(method, request_id, params)` |
| 以某个主体身份发送 | `gateway.handle("bearer-alice", body, headers)` |
| 先检查线上协议 | `validate_wire(body, headers)` |
| 固定一个描述符 | `descriptor_digest(tool)` |
| 对主体限流 | `TokenBucket().consume()` |
| 准入一条注册表记录 | `registry_record_is_admissible` |
| capstone 中的 scope 检查 | `gateway_call(token, tool_name, args, ...)` |

## 注册表准入、漂移、回滚
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code/main.py, phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md

```python
controller = RegistryAdmissionController(clock=lambda: next(ticks))
active_meta = {OFFICIAL_META_KEY: {"status": "active"}}
controller.admit(sample_record("1.1.0"), active_meta,
    namespace_for_domain("example.com"),         # gives com.example
    evidence_for("1.1.0"), sample_live("1.1.0"))  # admit 1.0.0 the same way
drift = controller.check_live("com.example/inventory", "1.1.0",
    sample_live("1.1.0", True))                  # extra tool: quarantined
controller.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
controller.rollback("com.example/inventory", "1.0.0", "unexpected delete tool")
controller.ledger.verify()                       # False after any edit
namespace_matches("com.exampleevil/inventory", "com.example")  # False
```

## 一致性测试框架
type: annotated-code
lang: python
from: phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code/main.py, phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md

```python
validate_result({"tools": []}, "legacy")      # infers complete
validate_result({"tools": []}, "modern")      # raises ProtocolViolation
select_era({"kind": "timeout"}, "fallback")   # fails closed
select_era({"kind": "jsonrpc_error", "code": -32021}, "fallback")  # modern
cases = [run_transcript(case) for case in transcript_suite()]  # 15 cases
compare_sdk_view(raw_result, {"tools": []})   # droppedFields futureHint
inspect_proxy(exchange)                       # finds a 400 turned into 500
redact(value)                                 # before hashing or upload
evaluate_health(healthy_window())             # samples, error rate, p95
ReleaseGate(signers).evaluate(cases, [sdk_report], [proxy_report],
                              healthy_window(), rollback)  # promote or rollback
```

## 七项准入控制
type: flow
from: phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md

1. **命名空间**：把 `/` 之前的段与已验证的命名空间精确比较。
2. **来源**：关联注册表类型、标识符、版本、所有权和制品摘要。
3. **固定**：存储记录、来源、工具集和来源证明的摘要。绝不用 `^1.4` 或 latest。
4. **实时漂移**：调用 `server/discover`。任何描述符摘要变化都会隔离该固定版本。
5. **状态**：读取官方 `_meta` 状态。已弃用或已删除则隔离。
6. **回滚**：路由到一个已准入、处于活跃状态且未被隔离的固定版本。
7. **账本**：追加每个决策，附上前一个哈希和自身哈希。

## 网关错误
type: troubleshooting
from: phases/13-tools-and-protocols/17-mcp-gateways-and-registries/code/main.py, phases/13-tools-and-protocols/17-mcp-gateways-and-registries/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 401 `-32001` | Bearer 未知 | 认证该主体 |
| 403 `-32003` | 对该用户来说工具不在 `RBAC` 中 | 授予角色或保持拒绝 |
| 429 `-32029` | `TokenBucket` 已空 | 等待补充 |
| 409 `-32010` | 实时描述符与固定版本不同 | 审查后重新批准固定版本 |
| 400 `-32020` | header 与 body 不一致 | 让 `Mcp-Method` 与 `Mcp-Name` 一致 |
| 400 `-32022` | 匹配到的版本不受支持 | 发送 `supported` 中的版本 |
| `subscriptions/listen` 上的 406 | Accept 中没有 `text/event-stream` | 接受 SSE |
| 405 | 对端点发 GET 或 DELETE | 每条消息都用 POST 发送 |

## 默认值与数字
type: defaults
from: phases/13-tools-and-protocols/17-mcp-gateways-and-registries/code/main.py, phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code/main.py, phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 网关 discover `ttlMs` | 30_000 | `cacheScope` private |
| 网关 tools/list `ttlMs` | 10_000 | private，因为 RBAC 会过滤它 |
| `TokenBucket` `capacity` | 5 | `refill_per_second` 1.0 |
| `maxErrorRate` | 0.01 | 健康闸门默认值 |
| `maxP95Ms` | 500 | 健康闸门默认值 |
| `MODERN_VERSION` | 2026-07-28 | 需要 `resultType` |
| `LEGACY_VERSION` | 2025-11-25 | 仅限白名单且 `initialize` 有效 |
| 注册表 schema | 2025-12-11 | 与协议版本无关 |

## 发布失败
type: troubleshooting
from: phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md, phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `-32021` 后客户端退回旧版 | 已识别的现代错误被当作旧版 | 收到现代错误后绝不回退 |
| SDK 显示了线上没有的 `resultType` | SDK 合成了判别字段 | 校验原始 body |
| 源站的 400 变成了 500 | 代理吞掉了错误 | 对比入口、源站和出口 |
| 金丝雀零错误但没有流量 | 没有最小样本数 | 强制 `sampleCount` 大于 0 |
| 批准后出现新工具 | 运行时漂移 | 隔离该路由 |
| 回滚目标从未被准入 | 路由与审批状态脱节 | 拒绝，并重新执行准入 |

## 规则
type: tips
from: phases/13-tools-and-protocols/17-mcp-gateways-and-registries/docs/en.md, phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md, phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md

- 绝不把外层网关 token 传给后端。
- 不要把外层客户端的 capabilities 复制给后端。网关才是后端的客户端。
- 按主体、签发方、资源、工具、成本类别和时间窗口设置限流键。
- 逐字节保留 `requestState`。每次 MRTR 重试都重新授权。
- 在 `Mcp-Name` 中按 `params.taskId` 路由 `tasks/get`、`tasks/update`、`tasks/cancel`。
- 在服务器出现在 `tools/list` 之前执行准入。
- 在序列化、哈希、记录日志或上传之前先脱敏。

## 问答
type: qa
from: phases/13-tools-and-protocols/17-mcp-gateways-and-registries/docs/en.md, phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md, phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md, phases/13-tools-and-protocols/23-capstone-tool-ecosystem/docs/en.md

- **出现在注册表中就等于批准了服务器吗？** 不是。由准入策略决定。
- **`serverInfo` 能证明发布者吗？** 不能。它只是诊断数据。
- **未知字段就是未知结果吗？** 不是。保留该字段。拒绝未知的 `resultType`。
- **回滚会修改旧记录吗？** 不会。它改变的是活跃路由。
- **capstone 全绿能证明线上协议正确吗？** 不能。它只验证了模拟。
