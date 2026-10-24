# AgentCard 字段

> `AgentCard` 有 14 个字段，其中八个是 REQUIRED，它们合在一起说明 agent 提供什么、在哪里访问它，以及它有哪些要求。

planner 即将把第一次测试运行委派给 `test-runner`，它只知道这个 agent 是 `localhost:41241`。它的第一个请求是对一个 JSON 文档的 `GET`。

读完本节后，你能逐个字段读懂任意 agent card，并说出一张有效的 card 必须带有哪些字段。

## card 及其 REQUIRED 字段 {#s-agentcard-fields-the-card-and-its-required-fields}

**Agent card：** A2A 服务器发布的一个 JSON 元数据文档。它描述服务器的身份、能力、skill、服务端点和认证要求 {{spec §2.2}}。每个 A2A 服务器都必须提供一张 Agent Card {{spec §8.1}}。

proto message `AgentCard` 有 14 个字段，其中八个是 REQUIRED：`name`、`description`、`supportedInterfaces`、`version`、`capabilities`、`defaultInputModes`、`defaultOutputModes` 和 `skills` {{proto AgentCard}}。REQUIRED 字段必须在每条有效的 message 中出现并被设置 {{spec §5.7}}。

这些字段中有四个是列表，必需的列表必须至少包含一个元素 {{spec §5.7}}。但 §8.4.1 的签名示例仍保留了一个空的 `skills` 列表 {{spec §8.4.1}}（[冲突 D19](#s-ref-sources)，以 [issue #2122](https://github.com/a2aproject/A2A/issues/2122) 的形式未解决），而真实的 card 遵循 §5.7。

[图](#fig-agent-card-fields)把整张 `test-runner` card 分成四组：它是谁、在哪里访问它、它要求什么、它提供什么。在身份字段中，`version` 是 agent 自己的版本，[扩展 card 与签名](#s-extended-cards-and-signatures)一节讲解 `signatures`。

```figure
id: fig-agent-card-fields
kind: structure
title: the test-runner agent card, field by field
claim: One `GET` returns what a client needs before its first message: who the agent is, where to reach it, what it demands, and what it offers.
caption: Each row is one field of the card, grouped by the question it answers. A dot marks a field the proto makes REQUIRED, and dashed rows are optional fields this card leaves out. From capture/out/01-agent-cards.http.
```

## 它提供什么：skill 和 mode {#s-agentcard-fields-what-it-offers-skills-and-modes}

**Skill：** `skills` 中的一个条目，是 agent 声称自己能做的一个工作单元。每个 skill 都需要一个 `id`、一个 `name`、一个 `description`，以及 `tags` 中至少一个条目 {{spec §5.7}}。可选的 `examples` 存放示例 prompt，一个 skill 还可以带有自己的 mode 和 `securityRequirements` {{proto AgentSkill}}。

```listing
title: the one skill on the test-runner card
source: capture/out/01-agent-cards.http
lang: json
note: The skills array of the first card in the file, complete.
---
  "skills": [
    {
      "id": "run-tests",
      "name": "Run tests",
      "description": "Run the test suite of a repository at one commit and report each failure with its log.",
      "tags": [
        "ci",
        "tests"
      ],
      "examples": [
        "Run the unit tests for payments-api at commit 9f3c2e1"
      ]
    }
  ]
```

`SendMessageRequest` 和 `Message` 中没有任何字段指定 skill {{proto SendMessageRequest}}，proto 把这个列表基本上当作描述性的 {{proto AgentCard}}。

**Mode：** 一种媒体类型，指明 agent 接受或产生的内容，例如 `text/plain` {{proto AgentCard}}。REQUIRED 列表 `defaultInputModes` 和 `defaultOutputModes` 适用于所有 skill，skill 可以用自己的 `inputModes` 和 `outputModes` 覆盖它们。`code-reviewer` 的 card 把其 `review-diff` skill 的输入限定为 `text/x-diff` 和 `text/plain`。

## 在哪里访问它：supportedInterfaces {#s-agentcard-fields-where-to-reach-it-supportedinterfaces}

**Interface：** `supportedInterfaces` 中的一个条目，是一个 URL，以及在那里使用的绑定和协议版本。它的字段 `url`、`protocolBinding` 和 `protocolVersion` 是 REQUIRED，`tenant` 是可选的 {{proto AgentInterface}}。顺序很重要：这个列表是有序的，第一个条目是首选的 {{proto AgentCard}}。

```listing
title: the two interfaces of test-runner, JSON-RPC first
source: capture/out/01-agent-cards.http
lang: json
note: The supportedInterfaces array of the first card in the file, complete.
---
  "supportedInterfaces": [
    {
      "url": "http://localhost:41241/a2a/jsonrpc",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    },
    {
      "url": "http://localhost:41241/a2a/rest",
      "protocolBinding": "HTTP+JSON",
      "protocolVersion": "1.0"
    }
  ],
```

proto 列出了三种标准绑定：`JSONRPC`、`GRPC` 和 `HTTP+JSON` {{proto AgentInterface}}。字段 `protocolVersion` 是在该 URL 上使用的 A2A 版本，格式为 `Major.Minor` {{spec §3.6}}，[版本与扩展 header](#s-version-and-extension-headers)一节讲解对应的 `A2A-Version` header。

在生产环境中，每个 URL 都必须是有效的绝对 HTTPS URL {{proto AgentInterface}}，而 kit 在一台机器上使用 `http://localhost`。规范没有说明 `GRPC` 条目采用哪种形式，参考 SDK 的示例写的是普通的主机和端口 {{sdk samples/hello_world_agent.py}}（[冲突 D34](#s-ref-sources)）。

## 它要求什么：capabilities 和安全 {#s-agentcard-fields-what-it-demands-capabilities-and-security}

**Capability：** REQUIRED 的 `capabilities` 对象中的一个标志，它开启协议的一个可选部分：`streaming`、`pushNotifications` 或 `extendedAgentCard` {{proto AgentCapabilities}}。缺少的标志等同于 `false` {{spec §3.3.4}}，[发现](#s-discovery-and-supported-interfaces)一节列出了每个标志允许的操作。同一个对象按 `uri` 列出 `extensions`，[扩展](#s-extensions)一节讲解这个列表。

可选的 `securitySchemes` 和 `securityRequirements` 说明一次调用需要哪些凭据 {{proto AgentCard}}。`test-runner` 的 card 两者都没有设置，[安全方案](#s-security-schemes-and-in-task-authorization)一节读取 `deployer` card 上的 bearer 方案。

在 1.0 中，0.3 版 card 的五个顶层字段移到了 `supportedInterfaces` 和 `capabilities` 中 {{docs whats-new-v1}}，[从 0.3 到 1.0](#s-from-0-3-to-1-0) 一节逐一列出了它们的对应关系。§A.2.1 的迁移步骤仍在使用 card 字段 `protocolVersions` {{spec §A.2.1}}，而 1.0 的 proto 没有这个字段（[冲突 D8](#s-ref-sources)）。[PR #2165](https://github.com/a2aproject/A2A/pull/2165) 在 v1.0.1 之后于 main 上修复了这一点，尚未发布。§8.5 的示例 card 仍在 proto 使用 `securityRequirements` 的地方写 `security` {{spec §8.5}} {{proto AgentCard}}（[冲突 D6](#s-ref-sources)）。[PR #2046](https://github.com/a2aproject/A2A/pull/2046) 在 main 上修复了这个示例，尚未发布。

```takeaways
- 从 `supportedInterfaces` 的第一个条目取得首选端点，绝不从顶层 `url` 取得。
- 拒绝缺少 REQUIRED 字段或 REQUIRED 列表为空的 card。
- 根据 skill 和 mode 选择 agent。
```

Sources: spec §2.2, §3.3.4, §3.6, §5.7, §8.1, §8.4.1, §8.5, §A.2.1 (research/sources/specification.md); proto AgentCard, AgentProvider, AgentSkill, AgentInterface, AgentCapabilities, SendMessageRequest (research/sources/a2a.proto); docs/whats-new-v1.md at v1.0.1; sdk samples/hello_world_agent.py; capture/out/01-agent-cards.http
