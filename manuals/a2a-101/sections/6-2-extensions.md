# 扩展

> 扩展是一个 URI，由 card 声明，由客户端通过 `A2A-Extensions` 按请求激活，双方都把它作为以该 URI 为键的 metadata 携带。

`01-agent-cards.http` 中的三张 card 都没有声明扩展，所以 planner 发送的是普通请求。如果审查者要为每个发现返回一条引用，它就需要核心协议所没有的数据，而扩展会在某个 URI 下添加这些数据。读完本节后，你能读懂扩展声明，在请求上激活扩展，并处理缺少必需扩展的情况。

## card 中的 AgentExtension {#s-extensions-agentextension-in-the-card}

**扩展：** 对协议的一种补充，由一个 URI 标识，并由它自己的规范定义 {{docs extensions}}。agent 在 `capabilities.extensions` 中把每个扩展声明为一个 `AgentExtension` {{proto AgentCapabilities}}，它有四个可选字段 {{proto AgentExtension}}。

- `uri`，扩展的唯一 URI {{proto AgentExtension}}。
- `description`，这个 agent 如何使用它。
- `required`，当客户端必须理解该扩展并遵循其规则时为 true {{proto AgentExtension}}。
- `params`，扩展的配置参数 {{proto AgentExtension}}，是一个 JSON 对象。

第 4.6.1 节把这个数组放在 `AgentCard` 本身上 {{spec §4.6.1}}，迁移指南读取的是 `agentCard.extensions` {{docs whats-new-v1}}。proto 把它放在 `capabilities` 下，所以要读取 `capabilities.extensions`。

```listing
title: two optional extensions on the §4.6.1 sample card
source: research/sources/specification.md
lang: json
note: The sample card, cut to its capabilities. The same sample sends protocolVersion 0.3 and has a trailing comma ([conflict D24](#s-ref-sources)).
---
  "capabilities": {
    "streaming": false,
    "pushNotifications": false,
    "extensions": [
      {
        "uri": "https://standards.org/extensions/citations/v1",
        "description": "Provides citation formatting and source verification",
        "required": false
      },
      {
        "uri": "https://example.com/extensions/geolocation/v1",
        "description": "Location-based search capabilities",
        "required": false
      }
    ]
  },
```

## 在请求上激活扩展 {#s-extensions-activating-an-extension-on-a-request}

客户端在 `A2A-Extensions` 服务参数中列出它想要的 URI {{spec §3.2.6}}。[A2A-Version 和 A2A-Extensions](#s-version-and-extension-headers) 一节说明了这个参数在每种绑定中如何传输。

`Message.extensions` 列出消息中存在的或为消息添加了内容的扩展的 URI {{proto Message}}。负载放在 `metadata` 中，以同一个 URI 为键。规范只通过示例展示了这种以 URI 为键的方式 {{spec §4.6.2}}。`Artifact.extensions` 的用法相同 {{proto Artifact}}。

```listing
title: the §4.6.1 request: the header names the extension, and metadata carries its data
source: research/sources/specification.md
lang: http
note: The HTTP sample under the card in §4.6.1. It omits the REQUIRED messageId ([conflict D23](#s-ref-sources)).
---
POST /message:send HTTP/1.1
Host: agent.example.com
Content-Type: application/a2a+json
Authorization: Bearer token
A2A-Extensions: https://example.com/extensions/geolocation/v1,https://standards.org/extensions/citations/v1

{
  "message": {
    "role": "ROLE_USER",
    "parts": [{"text": "Find restaurants near me"}],
    "extensions": ["https://example.com/extensions/geolocation/v1"],
    "metadata": {
      "https://example.com/extensions/geolocation/v1": {
        "latitude": 37.7749,
        "longitude": -122.4194
      }
    }
  }
}
```

指南增加了第三步：响应应带有 `A2A-Extensions` 请求头，列出服务器为该请求激活的每个扩展 {{docs extensions}}。规范没有这样的规则，各 SDK 也不同。a2a-js 服务器在全部三种绑定上回显该请求头 {{sdk-js src/server/express/json_rpc_handler.ts at v1.3.0}}。a2a-go 和 a2a-java 服务器只以 gRPC 响应 metadata 的形式回显它 {{sdk-go a2agrpc/v1/handler.go at v2.6.0}} {{sdk-java reference/grpc/src/main/java/org/a2aproject/sdk/server/grpc/quarkus/A2AExtensionsInterceptor.java at v1.4.0.Final}}。a2a-python、a2a-dotnet 和 a2a-rs 服务器从不写入它 {{sdk src/a2a/extensions/common.py}} {{sdk-dotnet src/A2A/Models/AgentExtension.cs at v1.0.0-preview2}} {{sdk-rust a2a/src/lib.rs at a2a-server-lf-v0.5.1}}。[图](#fig-extension-activation)展示了这次交换。

```figure
id: fig-extension-activation
kind: sequence
title: activating an extension, and the error when a required one is missing
claim: The card lists the extension, the request names it in `A2A-Extensions` and keys its data by the URI, and a missing required extension answers -32008.
caption: Read top to bottom. Steps 1 to 4 follow the §4.6.1 sample card and request, and the activation steps of the extensions guide. Steps 5 and 6 show the §3.3.4 rule for a card that marks an extension required, which the sample does not. The kit declares no extension, so no capture is shown. URIs are shortened to their last two path segments.
```

## 必需的扩展与版本 {#s-extensions-required-extensions-and-versions}

card 可以把一个扩展标为 `required: true`。当客户端没有声明该扩展时，agent 必须返回 `ExtensionSupportRequiredError` {{spec §3.3.4}}：`-32008`、HTTP 400 或 gRPC `FAILED_PRECONDITION` {{spec §5.4}}，[错误](#s-errors)一节的表格列出了这些。只有 a2a-java 内置了这项检查 {{sdk-java server-common/src/main/java/org/a2aproject/sdk/server/extensions/A2AExtensions.java at v1.4.0.Final}}。参考 SDK 只把请求的 URI 公开为 `requested_extensions` {{sdk src/a2a/server/routes/common.py}}，从不抛出这个错误 {{sdk src/a2a/utils/errors.py}}。

扩展应把它的版本放在 URI 中 {{spec §4.6.3}}，破坏性变更必须使用新的 URI {{spec §4.6.3}}。agent 会忽略可选扩展的未知版本，对必需扩展的未知版本则返回错误。它不得自行切换到该扩展的旧版本 {{spec §4.6.3}}。

## 种类、治理与现有扩展 {#s-extensions-kinds-governance-and-what-exists}

扩展指南列出了四种扩展 {{docs extensions}}。纯数据扩展向 card 添加结构化数据。Profile 扩展收窄核心消息所携带的值。方法扩展添加 RPC 方法。状态机扩展添加状态，而 [Task 与任务状态](#s-task-and-task-state)一节拒绝这样做（[冲突 D29](#s-ref-sources)）。

`a2aproject` 组织中的扩展受两个层级的治理 {{docs extension-and-binding-governance}}：官方扩展放在 `ext-{name}` 仓库中，使用 URI 前缀 `https://a2a-protocol.org/extensions/`；实验性扩展放在 `experimental-ext-{name}` 中。对于 SDK，扩展必须默认关闭，并需要显式选择启用 {{docs extension-and-binding-governance}}。符合规范的实现不必支持扩展 {{docs extension-and-binding-governance}}。

截至 2026-10-06，该组织没有任何 `ext-` 仓库，所以不存在官方扩展。存在一个实验性扩展：[experimental-ext-oid4vp-auth](https://github.com/a2aproject/experimental-ext-oid4vp-auth/tree/e86356d4a330ede795eb5b458fd2a838ffea0064)，用于以 OpenID for Verifiable Presentations 进行任务内授权。它的 agent 把任务移到 `TASK_STATE_AUTH_REQUIRED`，并在 `metadata` 中以该扩展 URI 为键放入一个授权请求，供钱包回应。它建立在[任务内授权](#s-security-schemes-and-in-task-authorization)之上，它的 README 允许破坏性变更。指南列出的四个示例扩展是 a2a-samples 中的示例，不属于这两个层级：[timestamp](https://github.com/a2aproject/a2a-samples/tree/6603ba3f2c31a7ef33e70b9d8b5b5f8be42ac9a3/extensions/timestamp)、[traceability](https://github.com/a2aproject/a2a-samples/tree/6603ba3f2c31a7ef33e70b9d8b5b5f8be42ac9a3/extensions/traceability)、[secure-passport](https://github.com/a2aproject/a2a-samples/tree/6603ba3f2c31a7ef33e70b9d8b5b5f8be42ac9a3/extensions/secure-passport) 和 [agp](https://github.com/a2aproject/a2a-samples/tree/6603ba3f2c31a7ef33e70b9d8b5b5f8be42ac9a3/extensions/agp)。

```takeaways
- 在调用 agent 之前读取 `capabilities.extensions`，并支持它标为必需的每个扩展。
- 发送带有你想要的 URI 的 `A2A-Extensions`，并在 `metadata` 中以 URI 为每个负载的键。
- 把 `-32008` 视为 card 的问题，在重试之前重新读取 card。
- 为破坏性变更创建新的 URI。
```

Sources: spec §3.2.6, §3.3.2, §3.3.4, §4.6, §4.6.1, §4.6.2, §4.6.3, §5.4 (research/sources/specification.md); proto AgentCapabilities, AgentExtension, Message, Artifact (research/sources/a2a.proto); docs extensions, whats-new-v1, extension-and-binding-governance (research/sources/docs.md); sdk src/a2a/extensions/common.py, src/a2a/server/routes/common.py, src/a2a/utils/errors.py at a2a-python 1.2.2; sdk-js src/server/express/json_rpc_handler.ts at v1.3.0; sdk-go a2agrpc/v1/handler.go at v2.6.0; sdk-java reference/grpc/src/main/java/org/a2aproject/sdk/server/grpc/quarkus/A2AExtensionsInterceptor.java, server-common/src/main/java/org/a2aproject/sdk/server/extensions/A2AExtensions.java at v1.4.0.Final; sdk-dotnet src/A2A/Models/AgentExtension.cs at v1.0.0-preview2; sdk-rust a2a/src/lib.rs at a2a-server-lf-v0.5.1; a2aproject/experimental-ext-oid4vp-auth at e86356d; a2aproject/a2a-samples at 6603ba3; capture/out/01-agent-cards.http
