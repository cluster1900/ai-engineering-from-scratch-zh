# A2A-Version 和 A2A-Extensions

> 两个服务参数在每个请求上以 HTTP 请求头或 gRPC metadata 传输，缺少 `A2A-Version` 意味着 0.3，1.0 agent 必须拒绝它。

kit 向 `test-runner` 发送一个只有 `Host` 和 `Content-Type` 请求头的 `SendMessage`，就像一个忘了版本的客户端那样。agent 回答 `-32009`，并把请求报告为 `0.3 (no header)`，见 `11-errors.http` 的第 2 次交换。捕获中的其他每个请求都带有 `A2A-Version: 1.0`。

读完本节后，你能在任何绑定中设置这两个请求头，并预测每个 SDK 在没有版本时会做什么。

## 服务参数 {#s-version-and-extension-headers-service-parameters}

**服务参数：** 键值映射中的一个条目，承载适用于每个操作的上下文或参数。键是不区分大小写的字符串，值是区分大小写的字符串 {{spec §3.2.6}}。规范定义了两个服务参数 `A2A-Version` 和 `A2A-Extensions`，并为自己保留了前缀 `a2a-` {{spec §3.2.6}}。每种绑定都说明了它们如何传输：在 JSON-RPC 和 HTTP+JSON 中作为 HTTP 请求头 {{spec §9.2}} {{spec §11.2}}，在 gRPC 中作为 metadata 键 {{spec §10.2}}。自定义绑定必须记录它如何承载服务参数 {{spec §12.3}}。

两个请求头的 IANA 模板都引用规范的第 3.2.5 节 {{spec §14.2.1}} {{spec §14.2.2}}。那是 metadata 一节，而这些参数在 §3.2.6（[冲突 D17](#s-ref-sources)）。[Issue #2305](https://github.com/a2aproject/A2A/issues/2305) 跟踪了这个问题，目前仍未关闭。

## A2A-Version {#s-version-and-extension-headers-a2a-version}

版本的形式是 `Major.Minor`，例如 `1.0`，请求、响应和 Agent Card 不应带有补丁号 {{spec §3.6}}。客户端必须在每个请求中发送 `A2A-Version` 请求头 {{spec §3.6.1}}，1.0 客户端发送 `1.0`。服务器有两项职责：以该版本的语义处理请求，并在接口不支持该版本时返回 `VersionNotSupportedError` {{spec §3.6.2}}。空值的情况有固定的含义：agent 必须把空值读作 0.3 版 {{spec §3.6.2}}。所以忘了请求头的客户端，会从仍提供 0.3 的 agent 那里得到 0.3 的语义，从不提供 0.3 的 agent 那里得到这个错误：

```listing
title: no A2A-Version header, read as 0.3 and refused
source: capture/out/11-errors.http
lang: http
note: The request body and the error details are cut down. The request carries only Host and Content-Type, and the kit speaks only 1.0.
---
POST /a2a/jsonrpc HTTP/1.1
Host: localhost:41241
Content-Type: application/json
…
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32009,
    "message": "Protocol version not supported",
…
          "requested": "0.3 (no header)",
          "supported": "1.0"
```

`VersionNotSupportedError` 在 JSON-RPC 中是 `-32009`，在 HTTP+JSON 中是 `400`，在 gRPC 中是 `FAILED_PRECONDITION`，reason 是 `VERSION_NOT_SUPPORTED` {{spec §5.4}}，[错误](#s-errors)一节列出了这些。要发送的版本来自 card：每个 `supportedInterfaces` 条目声明它自己的 `protocolVersion`。agent 可以在同一种传输上以不同的版本提供多个接口 {{spec §3.6.2}}，[AgentCard 字段](#s-agentcard-fields)一节展示了这一点。

规范中有三个示例发送 `A2A-Version: 0.3` {{spec §9.2}} {{spec §11.2}} {{spec §14.2.1}}，§10.2 中的 gRPC 示例也以 metadata 发送同样的值 {{spec §10.2}}。绝不要把示例中的值复制到 1.0 客户端中（[冲突 D39](#s-ref-sources)）。§3.6.1 还允许客户端把 `A2A-Version` 作为请求参数而不是请求头发送 {{spec §3.6.1}}。但两种 JSON 绑定都要求使用请求头（[冲突 D31](#s-ref-sources)）。参考 SDK 只读取请求头 {{sdk src/a2a/utils/version_validator.py}}，kit 两者都读取，所以要发送请求头。

## 没有请求头时各 SDK 的行为 {#s-version-and-extension-headers-what-each-sdk-does-without-the-header}

| 实现 | 请求头缺失或为空 | 接受的值 | 在哪里检查 |
|---|---|---|---|
| kit，`a2a_ref.py` | 以 `0.3 (no header)` 拒绝 | 恰好是 `1.0`，来自请求头或查询参数 | JSON-RPC 和 HTTP+JSON |
| a2a-python 1.2.2 | 读作 `0.3`，然后拒绝 | `1`、`1.0`、`1.0.0` 和 `1.5`，因为只要求主版本为 1 {{sdk src/a2a/utils/version_validator.py}} | JSON-RPC 和 HTTP+JSON，从不在 gRPC 中检查 {{sdk src/a2a/server/request_handlers/grpc_handler.py}} |
| a2a-js 1.3.0 | 读作 `0.3`，除非 card 列出它，否则拒绝 | 只接受 card 为该绑定声明的字符串，所以 `1.0.0` 会被拒绝 {{sdk-js src/server/version.ts at v1.3.0}} | 全部三种绑定 |
| a2a-java 1.4.0.Final | 读作 `0.3`，然后拒绝 | 相同的主版本，采用 `major.minor` 形式，所以 `1` 会被拒绝 {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/version/A2AVersionValidator.java at v1.4.0.Final}} | 全部三种，gRPC 返回 `UNIMPLEMENTED` 而不是 `FAILED_PRECONDITION` |
| a2a-go 2.6.0 | 接受 | 任何值，因为没有服务器代码读取该请求头 {{sdk-go a2a/svcparams.go at v2.6.0}} | 无处检查 |
| a2a-dotnet 1.0.0-preview2 | 作为 1.0 接受 | `1.0` 或 `0.3`，`0.3` 按 1.0 处理 {{sdk-dotnet src/A2A.AspNetCore/A2AJsonRpcProcessor.cs at v1.0.0-preview2}} | 仅 JSON-RPC |
| a2a-rs, a2a-server 0.5.1 | 读作 `0.3`，然后拒绝 | 主版本 1 {{sdk-rust a2a-server/src/jsonrpc.rs at a2a-server-lf-v0.5.1}} | 仅 JSON-RPC |

列表中的每个客户端都在每次调用时发送 `1.0`，Python 和 JS 客户端在获取 card 时也发送它。所以要发送字面字符串 `1.0`，绝不带补丁号，也绝不依赖服务器拒绝缺失的请求头。

## A2A-Extensions {#s-version-and-extension-headers-a2a-extensions}

`A2A-Extensions` 是客户端希望在该请求中使用的扩展 URI 的逗号分隔列表 {{spec §3.2.6}}。它在两种 JSON 绑定中是一个请求头字段 {{spec §9.2}} {{spec §11.2}}，在 gRPC 中是一个 metadata 条目 {{spec §10.2}}。§4.6.1 还允许以 JSON-RPC 请求参数作为机制 {{spec §4.6.1}}，而 §9.2 要求使用请求头，所以要发送请求头（[冲突 D30](#s-ref-sources)）。参考 SDK 的 `with_a2a_extensions` 辅助函数在客户端用逗号连接这些 URI {{sdk src/a2a/client/service_parameters.py}}，它的服务器把它们读入调用上下文 {{sdk src/a2a/server/routes/common.py}}。服务器如何处理它们、以 URI 为键的负载以及 `ExtensionSupportRequiredError`，见[扩展](#s-extensions)一节。

```takeaways
- 在每个请求上以请求头或 metadata 发送 `A2A-Version: 1.0`，不带补丁号。
- 当你只提供 1.0 时，以 `VersionNotSupportedError` 拒绝没有 `A2A-Version` 的请求。
- 绝不依赖查询参数，也绝不依赖服务器拒绝缺失的版本。
- 把 `A2A-Extensions` 作为一个逗号分隔的请求头字段发送，绝不作为请求参数。
```

Sources: spec §3.2.6, §3.6, §3.6.1, §3.6.2, §4.6.1, §5.4, §9.2, §10.2, §11.2, §12.3, §14.2.1, §14.2.2 (research/sources/specification.md); sdk src/a2a/utils/version_validator.py, src/a2a/server/request_handlers/grpc_handler.py, src/a2a/client/service_parameters.py, src/a2a/server/routes/common.py (a2a-python 1.2.2); sdk-js src/server/version.ts at v1.3.0; sdk-java server-common/src/main/java/org/a2aproject/sdk/server/version/A2AVersionValidator.java at v1.4.0.Final; sdk-go a2a/svcparams.go at v2.6.0; sdk-dotnet src/A2A.AspNetCore/A2AJsonRpcProcessor.cs at v1.0.0-preview2; sdk-rust a2a-server/src/jsonrpc.rs at a2a-server-lf-v0.5.1; capture/out/11-errors.http, 01-agent-cards.http; capture/a2a_ref.py
