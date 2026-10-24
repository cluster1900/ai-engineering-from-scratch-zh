# gRPC

> gRPC 绑定就是 proto 本身：`lf.a2a.v1` 包中 `A2AService` 的十一个 rpc，通过带 TLS 的 HTTP/2 传输，服务参数放在 metadata 中。

planner 读取三张 card，只发现 `JSONRPC` 和 `HTTP+JSON` 接口，所以 `19-planner.http` 中没有任何调用使用 gRPC。kit 只用标准库，而标准库没有 gRPC，所以本手册中没有任何捕获展示 gRPC 调用。参考 SDK 的示例 agent 列出了第三个接口，即位于普通主机和端口的 `protocol_binding='GRPC'` {{sdk samples/hello_world_agent.py}}。

读完本节后，你能读懂 `GRPC` 接口，从生成的 stub 调用 `A2AService`，并读懂它的错误和流。

## 服务 {#s-grpc-the-service}

这种绑定有四项要求："gRPC over HTTP/2 with TLS"、`specification/a2a.proto` 中的规范性定义、"Protocol Buffers version 3"，以及 `A2AService` 服务 {{spec §10.1}}。该文件声明了 `package lf.a2a.v1`，所以完整的服务名是 `lf.a2a.v1.A2AService` {{proto A2AService}}。它的十一个 rpc 使用与 JSON-RPC 方法相同的 PascalCase 名称，[按绑定列出的操作](#s-ref-operations-by-binding)列出了它们及其消息。

有两个 rpc 返回 `stream StreamResponse`：`SendStreamingMessage` 和 `SubscribeToTask` {{proto A2AService}} {{spec §10.7}}。其他九个是一元调用，没有一个接受客户端流。每个 rpc 也带有定义其 HTTP+JSON 路由的 `google.api.http` 注解，如 [HTTP+JSON](#s-http-json) 一节所示：

```listing
title: the streaming send, as the proto defines it
source: research/sources/a2a.proto
lang: text
note: The rpc with its HTTP annotation, complete. The additional_bindings block is the tenant route.
---
  // Sends a streaming message to an agent, allowing for real-time interaction and status updates.
  // Streaming version of `SendMessage`
  rpc SendStreamingMessage(SendMessageRequest) returns (stream StreamResponse) {
    option (google.api.http) = {
      post: "/message:stream"
      body: "*"
      additional_bindings: {
        post: "/{tenant}/message:stream"
        body: "*"
      }
    };
  }
```

card 以 `protocolBinding` 设为 `GRPC` 来指明这种绑定 {{proto AgentInterface}}。在该标签版本中，proto 要求每个接口都使用绝对 HTTPS URL，而 gRPC 客户端拨号的是主机和端口（[冲突 D34](#s-ref-sources)）。[AgentCard 字段](#s-agentcard-fields)一节也指出了同样的空缺。[PR #1997](https://github.com/a2aproject/A2A/pull/1997) 在 main 上把注释改成了 `hostname:port` 形式，这是为 1.0.2 版排队的唯一变更，尚未发布。

## Metadata、错误与流 {#s-grpc-metadata-errors-and-streams}

两个服务参数必须作为 gRPC metadata 传输 {{spec §10.2}}。gRPC 会把 metadata 键转为小写，所以键是 `a2a-version` 和 `a2a-extensions`。服务器应从 metadata 中验证必需的服务参数，例如 `A2A-Version` {{spec §10.2}}。§10.2 的示例用旧的示例值 `0.3` 发送 `a2a-version` {{spec §10.2}}，所以 1.0 客户端要发送 `1.0`，[A2A-Version 和 A2A-Extensions](#s-version-and-extension-headers) 一节对此有解释。

错误是一个带有 `status.code`、`status.message` 和 `status.details` 的 `google.rpc.Status` {{spec §10.6}}。对于 A2A 错误，details 必须包含一条 `google.rpc.ErrorInfo` 消息 {{spec §10.6}}。它的 `reason` 是去掉 `Error` 的大写蛇形错误名，例如 `TASK_NOT_FOUND`，它的 `domain` 是 `a2a-protocol.org` {{spec §10.6}}。[错误](#s-errors)一节中的表格给出了每种错误的状态，`FAILED_PRECONDITION` 涵盖了九种中的六种，所以要读取 reason。

流是一个服务端流式 rpc，每条消息都是一个 `StreamResponse`，带有 `task`、`message`、`status_update` 或 `artifact_update` 之一 {{spec §10.7}} {{proto StreamResponse}}。流在 rpc 以其状态完成时结束，Go 服务器在其事件序列结束时返回 `OK` {{sdk-go a2agrpc/v1/handler.go at v2.6.0}}。[图](#fig-grpc-call)跟踪了一次流式调用从请求到结束的过程。

```figure
id: fig-grpc-call
kind: sequence
title: one SendStreamingMessage call over gRPC
claim: One rpc sends the request with its metadata, the server streams StreamResponse messages until the task ends, and the rpc status closes the stream.
caption: Read top to bottom. The client sends one SendMessageRequest with a2a-version in its metadata, and each reply is one StreamResponse payload. Names are the proto's, because the kit has no gRPC capture, so no values are shown. From research/sources/a2a.proto.
```

## SDK 支持 {#s-grpc-sdk-support}

| SDK | gRPC 服务器 | gRPC 客户端 | 如何启用 |
|---|---|---|---|
| a2a-python 1.2.2 | `GrpcHandler` {{sdk src/a2a/server/request_handlers/grpc_handler.py}} | `GrpcTransport` {{sdk src/a2a/client/transports/grpc.py}} | `pip install a2a-sdk[grpc]`，把处理器注册为 servicer，并在客户端工厂中列出 `GRPC` {{sdk src/a2a/client/client_factory.py}} |
| a2a-js 1.3.0 | `grpcService`，仅限 Node {{sdk-js src/server/grpc/grpc_service.ts at v1.3.0}} | `GrpcTransport` | 添加 `GrpcTransportFactory`，默认工厂不包含它 {{sdk-js src/client/factory.ts at v1.3.0}} |
| a2a-go 2.6.0 | `a2agrpc/v1.NewHandler` {{sdk-go a2agrpc/v1/handler.go at v2.6.0}} | `a2agrpc/v1.WithGRPCTransport` | 添加该传输选项，默认客户端不包含它 {{sdk-go a2aclient/factory.go at v2.6.0}} |
| a2a-java 1.4.0.Final | `transport/grpc` 和 Quarkus 的 `reference/grpc` 服务器 | `client/transport/grpc` | 添加这些 Maven 模块 {{sdk-java README.md at v1.4.0.Final}} |
| a2a-dotnet 1.0.0-preview2 | 无，只有名称常量 {{sdk-dotnet src/A2A/Client/ProtocolBindingNames.cs at v1.0.0-preview2}} | 无 | `A2A.Grpc.AspNetCore` 和 `A2A.Grpc` 存在于 main 上，尚未发布 |
| a2a-rs, a2a-grpc 0.3.9 | `a2a-grpc` crate 中的 `GrpcHandler` | 同一 crate 中的 `GrpcTransport` | 自己注册，因为客户端工厂只列出 JSON-RPC 和 HTTP+JSON {{sdk-rust a2a-client/src/factory.rs at a2a-server-lf-v0.5.1}} |

各服务器在版本检查上不同：Python、Go 和 Rust 的 gRPC 服务器从不读取 `a2a-version`，[A2A-Version 和 A2A-Extensions](#s-version-and-extension-headers) 一节中的表格展示了这一点。

目前项目中存在一种自定义绑定 SLIMRPC：通过 SLIM 而不是 HTTP/2 传输的 Protocol Buffers RPC。card 把它命名为 `https://a2a-protocol.org/bindings/experimental-slimrpc/v1`，[它的仓库](https://github.com/a2aproject/experimental-cpb-slimrpc)把它标为实验性的。自定义绑定应以一个 URI 作为其标识符 {{spec §5.8}}，项目的指南给出了自定义绑定的规则 {{docs custom-protocol-bindings}}。

```takeaways
- 从 `specification/a2a.proto`（包 `lf.a2a.v1`）生成 stub，并保留它的 rpc 名称。
- 每次调用都以小写 metadata 键发送 `a2a-version` 和 `a2a-extensions`。
- 从 `status.details` 中读取 `ErrorInfo.reason`，因为 `FAILED_PRECONDITION` 涵盖六种 A2A 错误。
- 在 JS、Go 和 Rust 的客户端工厂中自己注册 gRPC 传输。
```

Sources: spec §5.8, §10, §10.1, §10.2, §10.6, §10.7 (research/sources/specification.md); proto A2AService, AgentInterface, StreamResponse (research/sources/a2a.proto); docs custom-protocol-bindings (research/sources/docs.md); sdk samples/hello_world_agent.py, src/a2a/server/request_handlers/grpc_handler.py, src/a2a/client/transports/grpc.py, src/a2a/client/client_factory.py (a2a-python 1.2.2); sdk-go a2agrpc/v1/handler.go, a2aclient/factory.go at v2.6.0; sdk-js src/server/grpc/grpc_service.ts, src/client/factory.ts at v1.3.0; sdk-java README.md at v1.4.0.Final; sdk-dotnet src/A2A/Client/ProtocolBindingNames.cs at v1.0.0-preview2; sdk-rust a2a-client/src/factory.rs at a2a-server-lf-v0.5.1; capture/out/01-agent-cards.http, 19-planner.http; capture/README.md
