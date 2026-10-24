# 一致性测试

> a2a-tck 在三种绑定上按 v1.0.0 为一个服务器评分，针对捕获 kit 的一次运行展示了哪些失败属于服务器，哪些属于 TCK。

2026-10-06，kit 的 `test-runner` 在端口 41251 上为 a2a-tck 1.0.0.alpha2 的两次运行提供服务。第一次运行使用发布时的 TCK，得分 32.3%。第二次在对 TCK 的 JSON-RPC 客户端做了两行修改之后，得分 66.7%。读完本节后，你能用 TCK 测试你的服务器，并区分真正的失败与测试本身的缺陷。

## 运行 a2a-tck {#s-conformance-testing-running-a2a-tck}

TCK 是一个 pytest 项目。它读取 `{sut-host}/.well-known/agent-card.json`，为每个 `supportedInterfaces` 条目构建一个客户端，并在 card 声明的每种绑定上运行每个测试。它检查的是 `v1.0.0` 分支，而不是本手册固定的 1.0.1 补丁版本。

```bash
git clone --filter=blob:none https://github.com/a2aproject/a2a-tck.git
cd a2a-tck
git checkout 1.0.0.alpha2
uv venv && source .venv/bin/activate
uv pip install -e .
./run_tck.py --sut-host http://localhost:9999
```

`run_tck.py` 构建一条 pytest 命令，`--transport`、`--level` 和 `--webhook-host` 用来缩小范围。`MUST` 测试失败是硬性失败。`SHOULD` 测试是 `xfail`，card 没有声明相应能力时，`MAY` 测试会被跳过。`compatibility.json` 为每条要求保存一个结论，百分比只计算 PASS 和 FAIL。

## kit 的运行显示了什么 {#s-conformance-testing-what-the-kit-s-run-showed}

在第一次运行中，85 条 JSON-RPC 记录中有 63 条因同一个原因失败。TCK 的 JSON-RPC 客户端 POST 到 card 的 `url` 加一个结尾斜杠，而 kit 对该路径回答 HTTP 404。第二次运行 POST 到确切的 `url`，在 129 条要求中得到 62 PASS、31 FAIL、11 SKIPPED 和 25 NOT TESTED。全部 72 条 gRPC 记录都被跳过，因为 kit 没有 gRPC 接口。

在 31 个失败中，有 21 个是测试主体内部的跳过，该标签版本把它们记为 FAIL，而 `main` 把它们记为 SKIPPED。其中大多数预期有一个停在 `TASK_STATE_INPUT_REQUIRED` 的任务，而 `test-runner` 从不这样做。按 `main` 的规则，这次运行是 62 PASS、10 FAIL 和 32 SKIPPED，即 86.1%。

这十个失败中有一个属于 kit。它的 `Handler.rest` 在 `tasks/{id}/pushNotificationConfigs` 下没有提供任何路由，尽管 card 在两种 JSON 绑定上都声明了 `pushNotifications`。每种声明的绑定都必须提供同样的操作 {{spec §5.1}}。kit 现在提供了这四个路由，六条 HTTP+JSON 推送记录都通过了。每条要求在 JSON-RPC 一侧仍然失败，因为 TCK 在那里发送的是 `task_id` 而不是 `taskId`。

两个 `SHOULD` 失败是因为 card 缺少 `Cache-Control` 和 `ETag` 请求头 {{spec §8.6}}。其余的失败属于 TCK 本身，或者属于它的示例输入。

```listing
title: six push requirements after the kit fix
source: research/tck-summary.txt
lang: text
note: One line per requirement: its id, its level, the verdict on each binding, and the verdict the TCK records. The six HTTP+JSON records pass. The JSON-RPC records fail on the TCK's snake_case parameters, so the TCK records each requirement as FAIL.
---
PUSH-CREATE-001 MUST grpc=SKIPPED,http_json=PASS,jsonrpc=FAIL FAIL
PUSH-CREATE-002 MUST grpc=SKIPPED,http_json=PASS,jsonrpc=FAIL FAIL
PUSH-DEL-001 MUST grpc=SKIPPED,http_json=PASS,jsonrpc=FAIL FAIL
PUSH-DEL-002 MUST grpc=SKIPPED,http_json=PASS,jsonrpc=FAIL FAIL
PUSH-GET-001 MUST grpc=SKIPPED,http_json=PASS,jsonrpc=FAIL FAIL
PUSH-GET-002 MUST grpc=SKIPPED,http_json=PASS,jsonrpc=PASS PASS
PUSH-LIST-001 MUST grpc=SKIPPED,http_json=PASS,jsonrpc=FAIL FAIL
```

[我们对这次运行的记录](manuals/a2a-101/research/tck-run.md)对每一行都做了分类。

## TCK 在哪些地方偏离了 v1.0.1 {#s-conformance-testing-where-the-tck-departs-from-v1-0-1}

| TCK 预期 | 规范规定 | 对 kit 的影响 |
|---|---|---|
| JSON-RPC 请求发往 `<url>/` | 接口位于 `url` {{spec §8.3.1}} | 第 1 次运行中的 63 条记录 |
| JSON-RPC 上使用 snake_case 参数，例如 `task_id` 和 `history_length` | JSON 字段名 MUST 使用 camelCase {{spec §5.5}} | `PUSH-CREATE-001` 在 JSON-RPC 上失败，`GetTask` 忽略 `history_length` |
| REST 上的 `Content-Type` 包含 `application/json` | SHOULD 使用 `application/a2a+json` {{spec §11.1}} | `HTTP_JSON-SVC-001` 和 `HTTP_JSON-ERR-001` 失败 |
| `CORE-SEND-003` 上的任何错误都算失败 | 不支持的 part 得到 `ContentTypeNotSupportedError` {{spec §3.3.2}} | 在两种绑定上都失败 |
| `TaskNotCancelableError` 用 HTTP 409，`ContentTypeNotSupportedError` 用 415，`InvalidAgentResponseError` 用 502，三种错误用 gRPC `UNIMPLEMENTED` | 400、400、500 和 `FAILED_PRECONDITION` {{spec §5.4}} | 本次运行中未触及 |
| 对 `SHOULD` 和 `MAY` 缓存测试做硬性断言 | 在 TCK 自己的 README 中，`SHOULD` 是 `xfail` | 三个 card 缓存失败 |

[错误](#s-errors)一节给出了完整的映射。

## TCK 不测试什么 {#s-conformance-testing-what-the-tck-does-not-test}

有五种让各 SDK 分歧的行为从未被测试。REST 的 subscribe 动词（B1）：客户端总是发送 POST。分页（B5）：只有一次 `ListTasks` 调用，且只对照 schema 检查。对未知 artifact 的 `append`（B11）：没有测试发送 artifact 更新。另一个调用者的任务（B12）：`AUTH-SCOPE-001` 到 `003` 没有测试。重发的 `messageId`（B14）：每个测试都生成一个新 id。

25 条 NOT TESTED 的要求还涵盖任务内授权、TLS、card 签名、绑定等价性和客户端的版本请求头。[安全要求](#s-security-requirements)和[签名 card](#s-extended-cards-and-signatures) 两节给出了这些规则。

## 另外三个工具 {#s-conformance-testing-three-more-tools}

a2a-inspector 是一个浏览器调试器。它获取 card、检查其结构、发送消息并显示每个事件。它唯一的 release `v0.1.0` 早于 1.0，并要求顶层的 `url`。请使用 `main`，它接受 0.3 和 1.0 的负载，并根据 card 的第一个接口构建客户端。在 `frontend` 中运行 `uv sync` 和 `npm install`，然后运行 `bash scripts/run.sh`，并打开 `http://127.0.0.1:5001`。它对一致性不做任何判定。

a2a-cli 是官方的命令行客户端，版本 `v0.3.0`，基于 a2a-go 构建。`a2a card get <url>` 读取 card，`a2a send -a <url> "text"` 发送消息，可加 `--stream` 或 `--async`。`a2a task get`、`list`、`cancel` 和 `subscribe` 覆盖其余操作，`--svc-param A2A-Version=0.3` 手动设置一个请求头。它是客户端，不是评分工具。

a2a-itk 没有 release。它是一个跨 SDK 的测试框架：每个 agent 通过场景的绑定把一条嵌套指令转发给下一个对等方。`uv run run_tests.py` 运行内置的测试集。它的 `known_failures.yaml` 记录了 B1 的分歧：Rust 客户端发送 `GET`，而 .NET 服务器只接受 `POST`。

```takeaways
- 按每条要求读取 `compatibility.json`，而不是看百分比。
- 预料到 TCK 会把 JSON-RPC 请求 POST 到 card URL 加一个结尾斜杠。
- 在 TCK 的测试改变之前，把内容类型或 snake_case 的失败视为 TCK 的问题。
- 自己测试所有者范围、重复消息和 artifact 追加。
```

Sources: spec §3.3.2, §5.1, §5.4, §5.5, §8.3.1, §8.6, §11.1 (research/sources/specification.md); the TCK run of 2026-10-06 (research/tck-run.md, research/tck-summary.txt); a2a-tck at tag 1.0.0.alpha2 (README.md, run_tck.py, tck/requirements/base.py, tck/transport/jsonrpc_client.py, tests/compatibility/conftest.py) and main 263b9cf; a2a-inspector main 8aa0646 (README.md, backend/validators.py, backend/app.py); a2a-cli v0.3.0 (README.md, internal/README.md, specification/SPEC.md); a2a-itk main b57c533 (README.md, matrix.yaml, known_failures.yaml); capture/a2a_ref.py, capture/agents.py, capture/README.md
