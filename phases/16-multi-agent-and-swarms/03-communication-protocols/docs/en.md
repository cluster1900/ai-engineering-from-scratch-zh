# 通信协议

> 无法说同一种语言的 Agents 不是团队。它们只是朝着虚空互相喊话的陌生人。

**Type:** Build
**Languages:** TypeScript
**前置要求：** Phase 14 (Agent Engineering), Lesson 16.01 (为什么需要 Multi-Agent)
**Time:** ~120 分钟

## 学习目标
- 实现 MCP tool 发现与调用，让 agents 可以使用外部 servers 暴露的 tools
- 构建 A2A agent card 和 task endpoint，让一个 agent 可以通过 HTTP 将工作委托给另一个 agent
- 比较 MCP（tool 访问）、A2A（agent-to-agent）、ACP（企业审计）和 ANP（去中心化信任），并解释每种 protocol 解决的问题
- 在单个系统中串联多个 protocols，让 agents 通过 MCP 发现 tools，并通过 A2A 委托 tasks

## 问题
你把系统拆成了多个 agents。一个 researcher、一个 coder、一个 reviewer。它们各自的工作都很出色。但现在你需要它们真正彼此交流。

你的第一次尝试很自然：传递 strings。researcher 返回一大段 text，coder 尽力解析。直到 coder 误解了一份研究摘要，或者两个 agents 互相等待导致 deadlock，或者你需要不同团队构建的 agents 协作时，它才开始崩塌。突然之间，“只传 strings”不再可行。

这就是通信协议问题。没有一个共享契约来规定 agents 如何交换信息，multi-agent systems 就会脆弱、难以审计，并且无法扩展到超过你个人编写的少数 agents。

AI 生态已经用四种 protocols 做出回应，每一种都解决问题的不同部分：

- **MCP** 用于 tool 访问
- **A2A** 用于 agent-to-agent 协作
- **ACP** 用于企业审计能力
- **ANP** 用于去中心化身份与信任

本课会深入展开。你将阅读每个 spec 的真实 wire formats，构建可运行的实现，并把四者连接成一个统一系统。

## 概念
### The Protocol Landscape

可以把这四种 protocols 看作不同层，每一层回答一个不同的问题：

```mermaid
block-beta
  columns 1
  block:ANP["ANP — agents 如何信任陌生对象？\n去中心化身份 (DID)、E2EE、meta-protocol"]
  end
  block:A2A["A2A — agents 如何围绕目标协作？\nAgent Cards、task 生命周期、streaming、negotiation"]
  end
  block:ACP["ACP — agents 如何在可审计系统中交流？\nRuns、trajectory metadata、session continuity"]
  end
  block:MCP["MCP — agent 如何使用 tool？\nTool discovery、execution、context sharing"]
  end

  style ANP fill:#f3e8ff,stroke:#7c3aed
  style A2A fill:#dbeafe,stroke:#2563eb
  style ACP fill:#fef3c7,stroke:#d97706
  style MCP fill:#d1fae5,stroke:#059669
```

它们不是竞争关系。它们在不同层级解决不同问题。

### MCP (Recap)

MCP 已在 Phase 13 中深入讲解。快速回顾：MCP 标准化了 LLM 如何连接外部 tools 和数据源。它是一个 **client-server** protocol，其中 agent（client）发现并调用 server 暴露的 tools。

```mermaid
sequenceDiagram
    participant Agent as Agent (client)
    participant MCP1 as MCP Server<br/>(database, API, files)

    Agent->>MCP1: list tools
    MCP1-->>Agent: tool definitions
    Agent->>MCP1: call tool X
    MCP1-->>Agent: result
```

MCP 是 **agent-to-tool** 通信。它不能帮助 agents 彼此交流。

### A2A (Agent2Agent Protocol)

**Created by:** Google（现在归 Linux Foundation 管辖，名称为 `lf.a2a.v1`）
**Spec version:** 1.0.0
**Problem:** autonomous agents 如何彼此协作、协商并委托 tasks？

A2A 是用于 **peer-to-peer agent collaboration** 的 protocol。MCP 将 agent 连接到 tools，而 A2A 将 agent 连接到其他 agents。每个 agent 都会在 well-known URL 发布一个 **Agent Card**，其他 agents 可以发现它、与它协商，并向它委托 tasks。

#### How A2A Works

```mermaid
sequenceDiagram
    participant Client as Client Agent
    participant Remote as Remote Agent

    Client->>Remote: GET /.well-known/agent-card.json
    Remote-->>Client: Agent Card (skills, modes, security)

    Client->>Remote: POST /message:send
    Remote-->>Client: Task (submitted/working)

    alt Polling
        Client->>Remote: GET /tasks/{id}
        Remote-->>Client: Task status + artifacts
    else Streaming
        Client->>Remote: POST /message:stream
        Remote-->>Client: SSE: statusUpdate
        Remote-->>Client: SSE: artifactUpdate
        Remote-->>Client: SSE: completed
    end
```

#### The Real Agent Card

这是一个真实场景中的 A2A Agent Card。通过 `GET /.well-known/agent-card.json` 提供：

```json
{
  "name": "Research Agent",
  "description": "搜索文档并总结发现",
  "version": "1.0.0",
  "supportedInterfaces": [
    {
      "url": "https://research-agent.example.com/a2a/v1",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    },
    {
      "url": "https://research-agent.example.com/a2a/rest",
      "protocolBinding": "HTTP+JSON",
      "protocolVersion": "1.0"
    }
  ],
  "provider": {
    "organization": "Your Company",
    "url": "https://example.com"
  },
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "skills": [
    {
      "id": "web-research",
      "name": "Web Research",
      "description": "搜索 web 并综合发现",
      "tags": ["research", "search", "summarization"],
      "examples": ["研究 React 19 的最新变化"]
    },
    {
      "id": "doc-analysis",
      "name": "Documentation Analysis",
      "description": "读取并分析技术文档",
      "tags": ["docs", "analysis"],
      "inputModes": ["text/plain", "application/pdf"],
      "outputModes": ["application/json"]
    }
  ],
  "securitySchemes": {
    "bearer": {
      "httpAuthSecurityScheme": {
        "scheme": "Bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "security": [{ "bearer": [] }]
}
```

需要注意的关键点：
- **Skills** 表示一个 agent 能做什么。每个 skill 都有 ID、tags，以及支持的 input/output MIME types。client agent 正是据此判断这个 remote agent 是否能处理自己的请求。
- **supportedInterfaces** 列出多个 protocol bindings。单个 agent 可以同时使用 JSON-RPC、REST 和 gRPC。
- **Security** 内置在 card 中。client 在发出任何请求之前，就知道自己需要什么 auth。

#### Task Lifecycle

Tasks 是 A2A 中的核心工作单元。它们会在定义好的 states 之间流转：

```mermaid
stateDiagram-v2
    [*] --> submitted
    submitted --> working
    working --> input_required: 需要更多信息
    input_required --> working: client 发送数据
    working --> completed: 成功
    working --> failed: 错误
    working --> canceled: client 取消
    submitted --> rejected: agent 拒绝

    completed --> [*]
    failed --> [*]
    canceled --> [*]
    rejected --> [*]

    note right of completed: Terminal states 不可变。\nFollow-ups 会在同一个 contextId 内创建新 tasks。
```

全部 8 个 states（spec 还定义了 `UNSPECIFIED` 作为 sentinel，这里省略）：

| State | Terminal? | Meaning |
|---|---|---|
| `TASK_STATE_SUBMITTED` | No | 已确认，但尚未处理 |
| `TASK_STATE_WORKING` | No | 正在主动处理 |
| `TASK_STATE_INPUT_REQUIRED` | No | Agent 需要 client 提供更多信息 |
| `TASK_STATE_AUTH_REQUIRED` | No | 需要认证 |
| `TASK_STATE_COMPLETED` | Yes | 成功完成 |
| `TASK_STATE_FAILED` | Yes | 因错误结束 |
| `TASK_STATE_CANCELED` | Yes | 完成前被取消 |
| `TASK_STATE_REJECTED` | Yes | Agent 拒绝该 task |

一旦 task 到达 terminal state，它就是不可变的。不能再发送后续 messages。Follow-ups 会在同一个 `contextId` 内创建新的 task。

#### Wire Format

A2A 使用 JSON-RPC 2.0。下面是真实 message exchange 的样子：

**Client 发送 task：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{ "text": "研究 React 19 compiler features" }]
    },
    "configuration": {
      "acceptedOutputModes": ["text/plain", "application/json"],
      "historyLength": 10
    }
  }
}
```

**Agent 返回 task：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "task": {
      "id": "task-abc-123",
      "contextId": "ctx-xyz-789",
      "status": {
        "state": "TASK_STATE_COMPLETED",
        "timestamp": "2026-03-27T10:30:00Z"
      },
      "artifacts": [
        {
          "artifactId": "art-001",
          "name": "research-results",
          "parts": [{
            "data": {
              "findings": [
                "React 19 compiler 会自动 memoize components",
                "不再需要手动 useMemo/useCallback",
                "Compiler 在 build time 运行，而不是 runtime"
              ]
            },
            "mediaType": "application/json"
          }]
        }
      ]
    }
  }
}
```

**通过 SSE streaming：**
```text
POST /message:stream HTTP/1.1
Content-Type: application/json
A2A-Version: 1.0

data: {"task":{"id":"task-123","status":{"state":"TASK_STATE_WORKING"}}}

data: {"statusUpdate":{"taskId":"task-123","status":{"state":"TASK_STATE_WORKING","message":{"role":"ROLE_AGENT","parts":[{"text":"正在搜索文档..."}]}}}}

data: {"artifactUpdate":{"taskId":"task-123","artifact":{"artifactId":"art-1","parts":[{"text":"部分发现..."}]},"append":true,"lastChunk":false}}

data: {"statusUpdate":{"taskId":"task-123","status":{"state":"TASK_STATE_COMPLETED"}}}
```

### ACP (Agent Communication Protocol)

**Created by:** IBM / BeeAI
**Spec version:** 0.2.0 (OpenAPI 3.1.1)
**Status:** 正在并入 Linux Foundation 下的 A2A
**Problem:** agents 如何在具备完整审计能力、session continuity 和 trajectory tracking 的情况下通信？

ACP 是 **enterprise protocol**。不同于许多概述的说法，ACP **不** 使用 JSON-LD。它是通过 OpenAPI 定义的直接 REST/JSON API。它的特别之处在于 **TrajectoryMetadata**：每个 agent response 都可以携带生成该 response 的 reasoning steps 和 tool calls 的详细日志。

```mermaid
sequenceDiagram
    participant Client
    participant ACP as ACP Agent
    participant Audit as Audit Log

    Client->>ACP: POST /runs (mode: sync)
    ACP->>ACP: 处理 request...
    ACP->>Audit: 记录 trajectory:<br/>reasoning + tool calls
    ACP-->>Client: Response + TrajectoryMetadata
    Note over Audit: 每一步都被记录:<br/>tool_name, tool_input,<br/>tool_output, reasoning
```

#### Agent Discovery in ACP

ACP 定义了四种 discovery methods：

```mermaid
graph LR
    A[Agent Discovery] --> B["Runtime<br/>GET /agents"]
    A --> C["Open<br/>.well-known/agent.yml"]
    A --> D["Registry<br/>中心化 catalog"]
    A --> E["Embedded<br/>Container labels"]

    style B fill:#dbeafe,stroke:#2563eb
    style C fill:#d1fae5,stroke:#059669
    style D fill:#fef3c7,stroke:#d97706
    style E fill:#f3e8ff,stroke:#7c3aed
```

**AgentManifest** 比 A2A 的 Agent Card 更简单：

```json
{
  "name": "summarizer",
  "description": "使用 source citations 总结 documents",
  "input_content_types": ["text/plain", "application/pdf"],
  "output_content_types": ["text/plain", "application/json"],
  "metadata": {
    "tags": ["summarization", "RAG"],
    "framework": "BeeAI",
    "capabilities": [
      {
        "name": "Document Summarization",
        "description": "将长文档压缩成关键要点"
      }
    ],
    "recommended_models": ["llama3.3:70b-instruct-fp16"],
    "license": "Apache-2.0",
    "programming_language": "Python"
  }
}
```

#### Run Lifecycle

ACP 使用 "Runs" 而不是 "Tasks"。Run 是一次 agent execution，包含三种 modes：

| Mode | Behavior |
|---|---|
| `sync` | 阻塞式。Response 包含完整结果。 |
| `async` | 立即返回 202。通过 `GET /runs/{id}` 轮询 status。 |
| `stream` | SSE stream。Events 会随着 agent 工作而触发。 |

```mermaid
stateDiagram-v2
    [*] --> created
    created --> in_progress
    in_progress --> completed: 成功
    in_progress --> failed: 错误
    in_progress --> awaiting: 需要输入
    awaiting --> in_progress: client 恢复
    in_progress --> cancelling: 取消 request
    cancelling --> cancelled

    completed --> [*]
    failed --> [*]
    cancelled --> [*]
```

#### TrajectoryMetadata (The Audit Trail)

这是 ACP 的核心差异点。每个 message part 都可以包含 metadata，精确展示 agent 做了什么：

```json
{
  "role": "agent/researcher",
  "parts": [
    {
      "content_type": "text/plain",
      "content": "San Francisco 的天气是 72F 且晴朗。",
      "metadata": {
        "kind": "trajectory",
        "message": "我需要检查这个地点的天气",
        "tool_name": "weather_api",
        "tool_input": { "location": "San Francisco, CA" },
        "tool_output": { "temperature": 72, "condition": "sunny" }
      }
    }
  ]
}
```

对受监管行业来说，这非常有价值。每个答案都带着可证明的 reasoning chain：调用了哪些 tools、使用了什么 inputs、收到了什么 outputs。没有黑箱。

ACP 也支持 **CitationMetadata**，用于 source attribution：

```json
{
  "kind": "citation",
  "start_index": 0,
  "end_index": 47,
  "url": "https://weather.gov/sf",
  "title": "NWS San Francisco Forecast"
}
```

### ANP (Agent Network Protocol)

**Created by:** Open-source community（由 GaoWei Chang 创立）
**Repo:** [github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol)
**Problem:** 来自不同组织的 agents 如何在没有中央权威的情况下互相信任？

ANP 是 **decentralized identity protocol**。它使用 W3C Decentralized Identifiers (DIDs) 和 end-to-end encryption 来建立信任。不同于 A2A 通过已知 endpoints 发现 agents，ANP 让 agents 以密码学方式证明自己的身份。

ANP 有三层：

```mermaid
graph TB
    subgraph Layer3["Layer 3: Application Protocol"]
        AD[Agent Description Documents]
        DISC[Discovery endpoints]
    end
    subgraph Layer2["Layer 2: Meta-Protocol"]
        NEG[AI-powered protocol negotiation]
        CODE[Dynamic code generation]
    end
    subgraph Layer1["Layer 1: Identity & Secure Communication"]
        DID["did:wba (W3C DID)"]
        HPKE[HPKE E2EE - RFC 9180]
        SIG[Signature verification]
    end

    Layer3 --> Layer2
    Layer2 --> Layer1

    style Layer1 fill:#d1fae5,stroke:#059669
    style Layer2 fill:#dbeafe,stroke:#2563eb
    style Layer3 fill:#f3e8ff,stroke:#7c3aed
```

#### DID Documents (Real Structure)

ANP 使用一种名为 `did:wba`（Web-Based Agent）的自定义 DID method。DID `did:wba:example.com:user:alice` 会解析到 `https://example.com/user/alice/did.json`：

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1",
    "https://w3id.org/security/suites/secp256k1-2019/v1"
  ],
  "id": "did:wba:example.com:user:alice",
  "verificationMethod": [
    {
      "id": "did:wba:example.com:user:alice#key-1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:wba:example.com:user:alice",
      "publicKeyJwk": {
        "crv": "secp256k1",
        "x": "NtngWpJUr-rlNNbs0u-Aa8e16OwSJu6UiFf0Rdo1oJ4",
        "y": "qN1jKupJlFsPFc1UkWinqljv4YE0mq_Ickwnjgasvmo",
        "kty": "EC"
      }
    },
    {
      "id": "did:wba:example.com:user:alice#key-x25519-1",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:wba:example.com:user:alice",
      "publicKeyMultibase": "z9hFgmPVfmBZwRvFEyniQDBkz9LmV7gDEqytWyGZLmDXE"
    }
  ],
  "authentication": [
    "did:wba:example.com:user:alice#key-1"
  ],
  "keyAgreement": [
    "did:wba:example.com:user:alice#key-x25519-1"
  ],
  "humanAuthorization": [
    "did:wba:example.com:user:alice#key-1"
  ],
  "service": [
    {
      "id": "did:wba:example.com:user:alice#agent-description",
      "type": "AgentDescription",
      "serviceEndpoint": "https://example.com/agents/alice/ad.json"
    }
  ]
}
```

需要注意的关键点：
- **Key separation** 是强制的。签名 keys（secp256k1）与加密 keys（X25519）彼此分离。
- **`humanAuthorization`** 是 ANP 独有的。这些 keys 在使用前需要明确的人类批准（biometric、password、HSM）。资金转移等高风险操作会走这条路径。
- **`keyAgreement`** keys 用于 HPKE end-to-end encryption（RFC 9180）。
- **service** 部分链接到 Agent Description document。

#### How Trust Works in ANP

ANP **不** 使用 web-of-trust 或 endorsement graph。信任是双边的，并在每次交互中验证：

```mermaid
sequenceDiagram
    participant A as Agent A
    participant Domain as Agent A's Domain
    participant B as Agent B

    A->>B: HTTP request + DID + signature
    B->>Domain: Fetch DID document (HTTPS)
    Domain-->>B: DID document + public key
    B->>B: Verify signature with public key
    B-->>A: Issue access token
    A->>B: Subsequent requests use token
    Note over A,B: Trust = TLS domain verification<br/>+ DID signature verification<br/>+ Principle of least trust
```

信任来自三个来源：
1. **Domain-level TLS** 验证 DID document host
2. **DID cryptographic signatures** 验证 agent 的身份
3. **Principle of least trust** 只授予最小权限

这里没有基于 gossip 的 trust propagation 或 PageRank scoring。你会通过 DID 直接验证每个 agent。

#### Meta-Protocol Negotiation

这是 ANP 最有新意的功能。当来自不同生态的两个 agents 相遇时，它们不需要预先约定 data formats。它们会用自然语言协商：

```json
{
  "action": "protocolNegotiation",
  "sequenceId": 0,
  "candidateProtocols": "我可以使用：\n1. 带 hotel booking schema 的 JSON-RPC\n2. 带 OpenAPI 3.1 spec 的 REST\n3. Natural language over HTTP",
  "modificationSummary": "初始提案",
  "status": "negotiating"
}
```

```mermaid
sequenceDiagram
    participant A as Agent A
    participant B as Agent B

    A->>B: protocolNegotiation (candidateProtocols)
    B->>A: protocolNegotiation (counter-proposal)
    A->>B: protocolNegotiation (accepted)
    Note over A,B: Agents 会动态生成 code<br/>来处理达成一致的 format。<br/>最多 10 轮，然后 timeout。
```

agents 会来回协商（最多 10 轮），直到就某个 format 达成一致，然后动态生成 code 来处理它。Status values：`negotiating`、`rejected`、`accepted`、`timeout`。

这意味着两个从未见过彼此的 agents，也可以在没有任何人预先定义共享 schema 的情况下，弄清楚如何通信。

### Comparison (Corrected)

| | MCP | A2A | ACP | ANP |
|---|---|---|---|---|
| **Created by** | Anthropic | Google / Linux Foundation | IBM / BeeAI | Community |
| **Spec format** | JSON-RPC | JSON-RPC / REST / gRPC | OpenAPI 3.1 (REST) | JSON-RPC |
| **Primary use** | Agent to Tool | Agent to Agent | Agent to Agent | Agent to Agent |
| **Discovery** | Tool listing | `/.well-known/agent-card.json` | `GET /agents`, `/.well-known/agent.yml` | `/.well-known/agent-descriptions`, DID service endpoints |
| **Identity** | 隐式（local） | Security schemes (OAuth, mTLS) | Server-level | 带 E2EE 的 W3C DID (`did:wba`) |
| **Audit trail** | N/A | 基础（task history） | TrajectoryMetadata（tool calls、reasoning） | 未正式规定 |
| **State machine** | N/A | 9 个 task states | 7 个 run states | N/A |
| **Streaming** | N/A | SSE | SSE | Transport-agnostic |
| **Unique feature** | Tool schemas | Agent Cards + Skills | Trajectory audit trail | Meta-protocol negotiation |
| **Best for** | Tools & data | 动态协作 | 受监管行业 | 跨组织信任 |
| **Status** | Stable | Stable (v1.0) | 正在并入 A2A | Active development |

### How They Work Together

这些 protocols 并不互斥。一个现实的企业系统会使用多种：

```mermaid
graph TB
    subgraph org["Your Organization"]
        RA[Research Agent] <-->|A2A| CA[Coding Agent]
        RA -->|MCP| SS[Search Server]
        CA -->|MCP| GS[GitHub Server]
        AUDIT["所有 agent responses 都携带<br/>ACP TrajectoryMetadata"]
    end

    subgraph ext["External (DID verified via ANP)"]
        EA[External Agent]
        PA[Partner Agent]
    end

    RA <-->|ANP + A2A| EA
    CA <-->|ANP + A2A| PA

    style org fill:#f8fafc,stroke:#334155
    style ext fill:#fef2f2,stroke:#991b1b
    style AUDIT fill:#fef3c7,stroke:#d97706
```

- **MCP** 将每个 agent 连接到它的 tools
- **A2A** 处理 agents 之间的协作（内部和外部）
- **ACP** 用 trajectory metadata 包装 responses，以支持审计
- **ANP** 为你无法控制的 agents 提供身份验证

## 构建它
### 步骤 1： Core Message Types

每个 multi-agent system 都从 message format 开始。我们定义的 types 会映射到真实 protocols 使用的结构：

```typescript
import crypto from "node:crypto";

type MessageRole = "user" | "agent";

type MessagePart =
  | { kind: "text"; text: string }
  | { kind: "data"; data: unknown; mediaType: string }
  | { kind: "file"; name: string; url: string; mediaType: string };

type TrajectoryEntry = {
  reasoning: string;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  timestamp: number;
};

type AgentMessage = {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  trajectory?: TrajectoryEntry[];
  replyTo?: string;
  timestamp: number;
};

function createMessage(
  role: MessageRole,
  parts: MessagePart[],
  replyTo?: string
): AgentMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts,
    replyTo,
    timestamp: Date.now(),
  };
}

function textMessage(role: MessageRole, text: string): AgentMessage {
  return createMessage(role, [{ kind: "text", text }]);
}
```

注意：`MessagePart` 是 Multimodal 的（text、structured data、files），就像真实的 A2A 和 ACP specs 一样。`TrajectoryEntry` 捕获 reasoning chain，对应 ACP 的 TrajectoryMetadata。

### 步骤 2： A2A Agent Card and Registry

构建符合真实 A2A spec 的 agent discovery：

```typescript
type Skill = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  inputModes: string[];
  outputModes: string[];
};

type AgentCard = {
  name: string;
  description: string;
  version: string;
  url: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Skill[];
};

class AgentRegistry {
  private cards: Map<string, AgentCard> = new Map();

  register(card: AgentCard) {
    this.cards.set(card.name, card);
  }

  discoverBySkillTag(tag: string): AgentCard[] {
    return [...this.cards.values()].filter((card) =>
      card.skills.some((skill) => skill.tags.includes(tag))
    );
  }

  discoverByInputMode(mimeType: string): AgentCard[] {
    return [...this.cards.values()].filter(
      (card) =>
        card.defaultInputModes.includes(mimeType) ||
        card.skills.some((skill) => skill.inputModes.includes(mimeType))
    );
  }

  resolve(name: string): AgentCard | undefined {
    return this.cards.get(name);
  }

  listAll(): AgentCard[] {
    return [...this.cards.values()];
  }
}
```

这比简单的 name-to-capability map 丰富得多。你可以按 skill tags、input MIME types 或 name 发现 agents，就像真实 A2A spec 支持的那样。

### 步骤 3： A2A Task Lifecycle

构建完整的 task state machine：

```typescript
type TaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "auth-required"
  | "completed"
  | "failed"
  | "canceled"
  | "rejected";

const TERMINAL_STATES: TaskState[] = [
  "completed",
  "failed",
  "canceled",
  "rejected",
];

type TaskStatus = {
  state: TaskState;
  message?: AgentMessage;
  timestamp: number;
};

type Artifact = {
  id: string;
  name: string;
  parts: MessagePart[];
};

type Task = {
  id: string;
  contextId: string;
  status: TaskStatus;
  artifacts: Artifact[];
  history: AgentMessage[];
};

type TaskEvent =
  | { kind: "statusUpdate"; taskId: string; status: TaskStatus }
  | {
      kind: "artifactUpdate";
      taskId: string;
      artifact: Artifact;
      append: boolean;
      lastChunk: boolean;
    };

type TaskHandler = (
  task: Task,
  message: AgentMessage
) => AsyncGenerator<TaskEvent>;

class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private handlers: Map<string, TaskHandler> = new Map();
  private listeners: Map<string, ((event: TaskEvent) => void)[]> = new Map();

  registerHandler(agentName: string, handler: TaskHandler) {
    this.handlers.set(agentName, handler);
  }

  subscribe(taskId: string, listener: (event: TaskEvent) => void) {
    const existing = this.listeners.get(taskId) ?? [];
    existing.push(listener);
    this.listeners.set(taskId, existing);
  }

  async sendMessage(
    agentName: string,
    message: AgentMessage,
    contextId?: string
  ): Promise<Task> {
    const handler = this.handlers.get(agentName);
    if (!handler) {
      const task = this.createTask(contextId);
      task.status = {
        state: "rejected",
        timestamp: Date.now(),
        message: textMessage("agent", `No handler for ${agentName}`),
      };
      return task;
    }

    const task = this.createTask(contextId);
    task.history.push(message);
    task.status = { state: "submitted", timestamp: Date.now() };

    this.processTask(task, handler, message).catch((err) => {
      task.status = {
        state: "failed",
        timestamp: Date.now(),
        message: textMessage("agent", String(err)),
      };
    });
    return task;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || TERMINAL_STATES.includes(task.status.state)) return false;
    task.status = { state: "canceled", timestamp: Date.now() };
    this.emit(taskId, {
      kind: "statusUpdate",
      taskId,
      status: task.status,
    });
    return true;
  }

  private createTask(contextId?: string): Task {
    const task: Task = {
      id: crypto.randomUUID(),
      contextId: contextId ?? crypto.randomUUID(),
      status: { state: "submitted", timestamp: Date.now() },
      artifacts: [],
      history: [],
    };
    this.tasks.set(task.id, task);
    return task;
  }

  private async processTask(
    task: Task,
    handler: TaskHandler,
    message: AgentMessage
  ) {
    task.status = { state: "working", timestamp: Date.now() };
    this.emit(task.id, {
      kind: "statusUpdate",
      taskId: task.id,
      status: task.status,
    });

    try {
      for await (const event of handler(task, message)) {
        if (TERMINAL_STATES.includes(task.status.state)) break;

        if (event.kind === "statusUpdate") {
          task.status = event.status;
        }
        if (event.kind === "artifactUpdate") {
          const existing = task.artifacts.find(
            (a) => a.id === event.artifact.id
          );
          if (existing && event.append) {
            existing.parts.push(...event.artifact.parts);
          } else {
            task.artifacts.push(event.artifact);
          }
        }
        this.emit(task.id, event);
      }
    } catch (err) {
      task.status = {
        state: "failed",
        timestamp: Date.now(),
        message: textMessage("agent", String(err)),
      };
      this.emit(task.id, {
        kind: "statusUpdate",
        taskId: task.id,
        status: task.status,
      });
    }
  }

  private emit(taskId: string, event: TaskEvent) {
    for (const listener of this.listeners.get(taskId) ?? []) {
      listener(event);
    }
  }
}
```

这实现了真实的 A2A task lifecycle：submitted、working、input-required、terminal states。Handlers 是 async generators，会 yield events（status updates 和 artifact chunks），对应 SSE streaming model。

### 步骤 4： ACP-Style Audit Trail

用 trajectory tracking 包装通信：

```typescript
type AuditEntry = {
  runId: string;
  agentName: string;
  input: AgentMessage[];
  output: AgentMessage[];
  trajectory: TrajectoryEntry[];
  status: "created" | "in-progress" | "completed" | "failed" | "awaiting";
  startedAt: number;
  completedAt?: number;
  sessionId?: string;
};

class AuditableRunner {
  private log: AuditEntry[] = [];
  private handlers: Map<
    string,
    (input: AgentMessage[]) => Promise<{
      output: AgentMessage[];
      trajectory: TrajectoryEntry[];
    }>
  > = new Map();

  registerAgent(
    name: string,
    handler: (input: AgentMessage[]) => Promise<{
      output: AgentMessage[];
      trajectory: TrajectoryEntry[];
    }>
  ) {
    this.handlers.set(name, handler);
  }

  async run(
    agentName: string,
    input: AgentMessage[],
    sessionId?: string
  ): Promise<AuditEntry> {
    const entry: AuditEntry = {
      runId: crypto.randomUUID(),
      agentName,
      input: structuredClone(input),
      output: [],
      trajectory: [],
      status: "created",
      startedAt: Date.now(),
      sessionId,
    };
    this.log.push(entry);

    const handler = this.handlers.get(agentName);
    if (!handler) {
      entry.status = "failed";
      return entry;
    }

    entry.status = "in-progress";
    try {
      const result = await handler(input);
      entry.output = structuredClone(result.output);
      entry.trajectory = structuredClone(result.trajectory);
      entry.status = "completed";
      entry.completedAt = Date.now();
    } catch (err) {
      entry.status = "failed";
      entry.trajectory.push({
        reasoning: `Error: ${String(err)}`,
        timestamp: Date.now(),
      });
      entry.completedAt = Date.now();
    }
    return entry;
  }

  getFullAuditLog(): AuditEntry[] {
    return structuredClone(this.log);
  }

  getAuditLogForAgent(agentName: string): AuditEntry[] {
    return structuredClone(
      this.log.filter((e) => e.agentName === agentName)
    );
  }

  getAuditLogForSession(sessionId: string): AuditEntry[] {
    return structuredClone(
      this.log.filter((e) => e.sessionId === sessionId)
    );
  }

  getTrajectoryForRun(runId: string): TrajectoryEntry[] {
    const entry = this.log.find((e) => e.runId === runId);
    return entry ? structuredClone(entry.trajectory) : [];
  }
}
```

每次 agent execution 都会生成完整 audit entry：输入了什么、输出了什么，以及中间完整的 tool calls 和 reasoning steps trajectory。你可以按 agent、session 或单次 run 查询。

### 步骤 5： ANP-Style Identity Verification

构建基于 DID 的 identity 和 verification：

```typescript
type VerificationMethod = {
  id: string;
  type: string;
  controller: string;
  publicKeyDer: string;
};

type DIDDocument = {
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  keyAgreement: string[];
  humanAuthorization: string[];
  service: { id: string; type: string; serviceEndpoint: string }[];
};

type AgentIdentity = {
  did: string;
  document: DIDDocument;
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
};

class IdentityRegistry {
  private documents: Map<string, DIDDocument> = new Map();

  publish(doc: DIDDocument) {
    this.documents.set(doc.id, doc);
  }

  resolve(did: string): DIDDocument | undefined {
    return this.documents.get(did);
  }

  verify(did: string, signature: string, payload: string): boolean {
    const doc = this.documents.get(did);
    if (!doc) return false;

    const authKeyIds = doc.authentication;
    const authKeys = doc.verificationMethod.filter((vm) =>
      authKeyIds.includes(vm.id)
    );

    for (const key of authKeys) {
      const publicKey = crypto.createPublicKey({
        key: Buffer.from(key.publicKeyDer, "base64"),
        format: "der",
        type: "spki",
      });
      const isValid = crypto.verify(
        null,
        Buffer.from(payload),
        publicKey,
        Buffer.from(signature, "hex")
      );
      if (isValid) return true;
    }
    return false;
  }

  requiresHumanAuth(did: string, operationKeyId: string): boolean {
    const doc = this.documents.get(did);
    if (!doc) return false;
    return doc.humanAuthorization.includes(operationKeyId);
  }
}

function createIdentity(domain: string, agentName: string): AgentIdentity {
  const did = `did:wba:${domain}:agent:${agentName}`;
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyDer = publicKey
    .export({ format: "der", type: "spki" })
    .toString("base64");

  const keyId = `${did}#key-1`;
  const encKeyId = `${did}#key-x25519-1`;

  const document: DIDDocument = {
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyDer,
      },
      {
        id: encKeyId,
        type: "X25519KeyAgreementKey2019",
        controller: did,
        publicKeyDer,
      },
    ],
    authentication: [keyId],
    keyAgreement: [encKeyId],
    humanAuthorization: [],
    service: [
      {
        id: `${did}#agent-description`,
        type: "AgentDescription",
        serviceEndpoint: `https://${domain}/agents/${agentName}/ad.json`,
      },
    ],
  };

  return { did, document, privateKey, publicKey };
}

function signPayload(identity: AgentIdentity, payload: string): string {
  return crypto
    .sign(null, Buffer.from(payload), identity.privateKey)
    .toString("hex");
}
```

这对应真实的 ANP identity model：agents 拥有 DID documents，其中包含彼此分离的 authentication、key agreement 和 human authorization keys。`IdentityRegistry` 模拟 DID resolution（在生产环境中，这会是向 agent 所在 domain 发起的 HTTP fetch）。

### 步骤 6： Protocol Gateway

把四种 protocols 连接成一个统一系统：

```mermaid
graph LR
    REQ[Incoming Request] --> ANP_V{ANP: Verify DID}
    ANP_V -->|Valid| A2A_D{A2A: Discover Agent}
    ANP_V -->|Invalid| REJECT[Reject]
    A2A_D -->|Found| ACP_A[ACP: Audit Run]
    A2A_D -->|Not Found| REJECT
    ACP_A --> A2A_T[A2A: Create Task]
    A2A_T --> RESULT[Task + Audit Entry]

    style ANP_V fill:#d1fae5,stroke:#059669
    style A2A_D fill:#dbeafe,stroke:#2563eb
    style ACP_A fill:#fef3c7,stroke:#d97706
    style A2A_T fill:#dbeafe,stroke:#2563eb
```

```typescript
class ProtocolGateway {
  private registry: AgentRegistry;
  private taskManager: TaskManager;
  private auditRunner: AuditableRunner;
  private identityRegistry: IdentityRegistry;

  constructor(
    registry: AgentRegistry,
    taskManager: TaskManager,
    auditRunner: AuditableRunner,
    identityRegistry: IdentityRegistry
  ) {
    this.registry = registry;
    this.taskManager = taskManager;
    this.auditRunner = auditRunner;
    this.identityRegistry = identityRegistry;
  }

  async delegateTask(
    fromDid: string,
    signature: string,
    targetAgent: string,
    message: AgentMessage,
    sessionId?: string
  ): Promise<{ task: Task; audit: AuditEntry } | { error: string }> {
    if (!this.identityRegistry.verify(fromDid, signature, message.id)) {
      return { error: "Identity verification failed" };
    }

    const card = this.registry.resolve(targetAgent);
    if (!card) {
      return { error: `Agent ${targetAgent} not found in registry` };
    }

    const audit = await this.auditRunner.run(
      targetAgent,
      [message],
      sessionId
    );
    const task = await this.taskManager.sendMessage(targetAgent, message);

    return { task, audit };
  }

  discoverAndDelegate(
    fromDid: string,
    signature: string,
    skillTag: string,
    message: AgentMessage
  ): Promise<{ task: Task; audit: AuditEntry } | { error: string }> {
    const candidates = this.registry.discoverBySkillTag(skillTag);
    if (candidates.length === 0) {
      return Promise.resolve({
        error: `No agents found with skill tag: ${skillTag}`,
      });
    }
    return this.delegateTask(
      fromDid,
      signature,
      candidates[0].name,
      message
    );
  }
}
```

gateway 在一次调用中做四件事：
1. **ANP**：通过 DID signature 验证调用方身份
2. **A2A**：发现目标 agent 并检查 capabilities
3. **ACP**：用带 trajectory 的 audit trail 包装 execution
4. **A2A**：创建带完整 lifecycle tracking 的 task

### 步骤 7： Wire It All Together

```typescript
async function protocolDemo() {
  const registry = new AgentRegistry();
  registry.register({
    name: "researcher",
    description: "Searches and summarizes findings",
    version: "1.0.0",
    url: "https://researcher.local/a2a/v1",
    capabilities: { streaming: true, pushNotifications: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain", "application/json"],
    skills: [
      {
        id: "web-research",
        name: "Web Research",
        description: "Searches the web",
        tags: ["research", "search", "summarization"],
        inputModes: ["text/plain"],
        outputModes: ["application/json"],
      },
    ],
  });
  registry.register({
    name: "coder",
    description: "Writes code from specs",
    version: "1.0.0",
    url: "https://coder.local/a2a/v1",
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain"],
    skills: [
      {
        id: "code-gen",
        name: "Code Generation",
        description: "Generates code",
        tags: ["coding", "generation"],
        inputModes: ["text/plain", "application/json"],
        outputModes: ["text/plain"],
      },
    ],
  });

  const taskManager = new TaskManager();
  const auditRunner = new AuditableRunner();

  const researchTrajectory: TrajectoryEntry[] = [];

  taskManager.registerHandler(
    "researcher",
    async function* (task, message) {
      yield {
        kind: "statusUpdate" as const,
        taskId: task.id,
        status: { state: "working" as const, timestamp: Date.now() },
      };

      researchTrajectory.push({
        reasoning: "Searching for React 19 documentation",
        toolName: "web_search",
        toolInput: { query: "React 19 compiler features" },
        toolOutput: {
          results: ["react.dev/blog/react-19", "github.com/react/react"],
        },
        timestamp: Date.now(),
      });

      researchTrajectory.push({
        reasoning: "Extracting key findings from search results",
        toolName: "doc_analysis",
        toolInput: { url: "react.dev/blog/react-19" },
        toolOutput: {
          summary:
            "React 19 compiler auto-memoizes, no manual useMemo needed",
        },
        timestamp: Date.now(),
      });

      yield {
        kind: "artifactUpdate" as const,
        taskId: task.id,
        artifact: {
          id: crypto.randomUUID(),
          name: "research-results",
          parts: [
            {
              kind: "data" as const,
              data: {
                findings: [
                  "React 19 compiler auto-memoizes components",
                  "No more manual useMemo/useCallback needed",
                  "Compiler runs at build time, not runtime",
                ],
                sources: ["react.dev/blog/react-19"],
              },
              mediaType: "application/json",
            },
          ],
        },
        append: false,
        lastChunk: true,
      };

      yield {
        kind: "statusUpdate" as const,
        taskId: task.id,
        status: { state: "completed" as const, timestamp: Date.now() },
      };
    }
  );

  auditRunner.registerAgent("researcher", async () => ({
    output: [
      textMessage("agent", "React 19 compiler auto-memoizes components"),
    ],
    trajectory: researchTrajectory,
  }));

  const identityRegistry = new IdentityRegistry();

  const coderIdentity = createIdentity("coder.local", "coder");
  const researcherIdentity = createIdentity("researcher.local", "researcher");

  identityRegistry.publish(coderIdentity.document);
  identityRegistry.publish(researcherIdentity.document);

  const gateway = new ProtocolGateway(
    registry,
    taskManager,
    auditRunner,
    identityRegistry
  );

  console.log("=== Protocol Demo ===\n");

  console.log("1. Agent Discovery (A2A)");
  const researchAgents = registry.discoverBySkillTag("research");
  console.log(
    `   Found ${researchAgents.length} agent(s):`,
    researchAgents.map((a) => a.name)
  );

  console.log("\n2. Identity Verification (ANP)");
  const message = textMessage("user", "Research React 19 compiler features");
  const signature = signPayload(coderIdentity, message.id);
  const verified = identityRegistry.verify(
    coderIdentity.did,
    signature,
    message.id
  );
  console.log(`   Coder DID: ${coderIdentity.did}`);
  console.log(`   Signature verified: ${verified}`);

  console.log("\n3. Task Delegation (A2A + ACP + ANP)");
  const result = await gateway.delegateTask(
    coderIdentity.did,
    signature,
    "researcher",
    message,
    "session-001"
  );

  if ("error" in result) {
    console.log(`   Error: ${result.error}`);
    return;
  }

  console.log(`   Task ID: ${result.task.id}`);
  console.log(`   Task state: ${result.task.status.state}`);
  console.log(`   Artifacts: ${result.task.artifacts.length}`);

  console.log("\n4. Audit Trail (ACP)");
  console.log(`   Run ID: ${result.audit.runId}`);
  console.log(`   Status: ${result.audit.status}`);
  console.log(`   Trajectory steps: ${result.audit.trajectory.length}`);
  for (const step of result.audit.trajectory) {
    console.log(`     - ${step.reasoning}`);
    if (step.toolName) {
      console.log(`       Tool: ${step.toolName}`);
    }
  }

  console.log("\n5. Full Audit Log");
  const fullLog = auditRunner.getFullAuditLog();
  console.log(`   Total runs: ${fullLog.length}`);
  for (const entry of fullLog) {
    const duration = entry.completedAt
      ? `${entry.completedAt - entry.startedAt}ms`
      : "in-progress";
    console.log(`   ${entry.agentName}: ${entry.status} (${duration})`);
  }
}

protocolDemo().catch((err) => {
  console.error("Protocol demo failed:", err);
  process.exitCode = 1;
});
```

## What Goes Wrong

Protocols 解决的是 happy path。下面是生产环境中会出问题的地方：

**Schema drift.** Agent A 发布的 Agent Card 声称会输出 `application/json`。但 JSON schema 在版本之间发生变化。Agent B 按旧格式解析，得到一堆无效内容。修复方式：对你的 skills 和 output schemas 做版本管理。A2A spec 支持 Agent Cards 上的 `version`，原因就在这里。

**State machine violations.** 一个 agent handler yield 了 `completed` event，然后又尝试 yield 更多 artifacts。task 已经不可变。你的 code 要么静默丢弃更新，要么抛错。修复方式：在 yield 前检查 terminal state。上面的 `TaskManager` 通过 terminal states 之后的 `break` 强制执行这一点。

**Trust resolution failures.** Agent A 尝试验证 Agent B 的 DID，但 Agent B 的 domain 宕机。DID document 无法获取。你是 fail open（接受未验证 agents）还是 fail closed（拒绝所有请求）？ANP 建议基于 principle of least trust 采取 fail closed。

**Trajectory bloat.** ACP trajectory logging 很强大，但代价也高。一个复杂 agent 每次 run 发起 200 次 tool calls，会产生巨大的 audit entries。修复方式：按可配置的 verbosity levels 记录 trajectory。为合规记录 tool names 和 IO，对非监管 workloads 跳过 reasoning steps。

**Discovery thundering herd.** 50 个 agents 在 startup 时同时查询 `GET /agents`。修复方式：用 TTL 缓存 Agent Cards，错开 discovery intervals，或者使用 push-based registration 替代 polling。

## 使用它
### Real Implementations

**A2A** 是最成熟的。Google 的 [official spec](https://github.com/google/A2A) 在 Linux Foundation 下开源。提供 Python 和 TypeScript 的 SDKs。如果你的 agents 需要动态 discovery 和 collaboration，从这里开始。

**ACP** 正在并入 A2A。IBM 的 [BeeAI project](https://github.com/i-am-bee/acp) 创建了 ACP，作为 REST-first 的替代方案，但 trajectory metadata 概念正在被 A2A 生态吸收。即使你用 A2A 作为 transport，也应该使用 ACP patterns（trajectory logging、run lifecycle）。

**ANP** 最具实验性。[community repo](https://github.com/agent-network-protocol/AgentNetworkProtocol) 有一个 Python SDK（AgentConnect）。meta-protocol negotiation 概念确实很新颖。对于跨组织 agent deployments，值得关注。

**MCP** 已在 Phase 13 中讲过。如果你希望 agents 使用 tools，MCP 就是标准。

### Picking the Right Protocol

```mermaid
graph TD
    START{agents 是否需要<br/>使用 tools?}
    START -->|Yes| MCP_R[Use MCP]
    START -->|No| TALK{agents 是否需要<br/>彼此交流?}
    TALK -->|No| NONE[你不需要<br/>protocol]
    TALK -->|Yes| AUDIT{是否需要用于 compliance 的<br/>audit trails?}
    AUDIT -->|Yes| ACP_R[A2A + ACP<br/>trajectory patterns]
    AUDIT -->|No| ORG{所有 agents 是否都在<br/>你的组织内?}
    ORG -->|Yes| A2A_R[A2A<br/>Agent Cards + Tasks]
    ORG -->|No| INFRA{是否有共享<br/>infrastructure?}
    INFRA -->|Yes| BROKER[A2A + message broker]
    INFRA -->|No| ANP_R[ANP + A2A<br/>DID verification]

    style MCP_R fill:#d1fae5,stroke:#059669
    style A2A_R fill:#dbeafe,stroke:#2563eb
    style ACP_R fill:#fef3c7,stroke:#d97706
    style ANP_R fill:#f3e8ff,stroke:#7c3aed
    style BROKER fill:#e0e7ff,stroke:#4338ca
```

## 交付它
本课会产出：
- `code/main.ts` -- 四种 protocol patterns 的完整实现
- `outputs/prompt-protocol-selector.md` -- 一个帮助你为系统选择 protocols 的 prompt

## 练习
1. **Multi-hop task delegation.** 扩展 `TaskManager`，让 agent handler 可以向其他 agents 委托 subtasks。researcher 接收一个 task，将 "search" 和 "summarize" subtasks 委托给两个 specialist agents，等待二者完成，然后把结果合并到自己的 artifacts 中。

2. **Streaming audit trail.** 修改 `AuditableRunner` 以支持 streaming mode。不要等待完整结果，而是在 trajectory entries 被添加时实时 yield `AuditEntry` updates。使用 async generator 生成 audit snapshots。

3. **DID rotation.** 为 `IdentityRegistry` 添加 key rotation。agent 应该能够发布带有更新 keys 的新 DID document，同时保留 `previousDid` reference。Verifiers 应该在 grace period 内同时接受 current key 和 previous key 的 signatures。

4. **Protocol negotiation.** 实现 ANP 的 meta-protocol 概念。两个 agents 交换带 candidate formats 的 `protocolNegotiation` messages（例如，“I can speak JSON-RPC” vs “I prefer REST”）。最多 3 轮之后，它们要么就某个 format 达成一致，要么 timeout。达成一致的 format 决定它们使用哪个 `TaskManager` 或 `AuditableRunner`。

5. **Rate-limited discovery.** 添加一个 `RateLimitedRegistry` wrapper，用可配置 TTL 缓存 Agent Card lookups，并限制每个 agent 每秒的 discovery queries。模拟 100 个 agents 在 startup 时彼此 discovery 的 thundering herd，并测量差异。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| MCP | “AI tools 的 protocol” | 一个 client-server protocol，用于让 agents 发现并使用 tools。是 agent-to-tool，不是 agent-to-agent。 |
| A2A | “Google 的 agent protocol” | Linux Foundation 下用于 agent collaboration 的 peer-to-peer protocol。通过 Agent Cards 进行 discovery，9-state task lifecycle，通过 SSE streaming。支持 JSON-RPC、REST 和 gRPC bindings。 |
| ACP | “Enterprise agent messaging” | IBM/BeeAI 的 REST API，用于带 TrajectoryMetadata 的 agent runs：每个 response 都携带完整的 reasoning 和 tool calls 链路。正在并入 A2A。 |
| ANP | “Decentralized agent identity” | 一个 community protocol，使用 `did:wba` (DID) 实现 cryptographic identity，使用 HPKE 实现 E2EE，并为从未见过彼此的 agents 提供 AI-powered meta-protocol negotiation。 |
| Agent Card | “agent 的名片” | 位于 `/.well-known/agent-card.json` 的 JSON document，描述 skills、支持的 MIME types、security schemes 和 protocol bindings。 |
| DID | “Decentralized ID” | W3C standard，用于托管在 agent 自身 domain 上的可密码学验证 identities。ANP 使用 `did:wba` method。 |
| TrajectoryMetadata | “审计收据” | ACP 的机制，用于把 reasoning steps、tool calls 及其 inputs/outputs 附加到每个 agent response 上。 |
| Meta-protocol | “agents 协商如何交流” | ANP 的做法：agents 使用自然语言动态约定 data formats，然后生成 code 来处理这些 formats。 |
| Task | “一个工作单元” | A2A 的 stateful object，用于跟踪从提交到完成的工作。到达 terminal 后不可变。 |

## 延伸阅读
- [Google A2A specification](https://github.com/google/A2A) -- official spec 和 SDKs（v1.0.0，Linux Foundation）
- [IBM/BeeAI ACP specification](https://github.com/i-am-bee/acp) -- 用于 agent runs 和 trajectory metadata 的 OpenAPI 3.1 spec
- [Agent Network Protocol](https://github.com/agent-network-protocol/AgentNetworkProtocol) -- 基于 DID 的 identity、E2EE、meta-protocol negotiation
- [Model Context Protocol docs](https://modelcontextprotocol.io/) -- Anthropic 的 MCP specification（已在 Phase 13 覆盖）
- [W3C Decentralized Identifiers](https://www.w3.org/TR/did-core/) -- 支撑 ANP 的 identity standard
- [RFC 9180 (HPKE)](https://www.rfc-editor.org/rfc/rfc9180) -- ANP 用于 E2EE 的 encryption scheme
- [FIPA Agent Communication Language](http://www.fipa.org/specs/fipa00061/SC00061G.html) -- 现代 agent protocols 的学术前身
