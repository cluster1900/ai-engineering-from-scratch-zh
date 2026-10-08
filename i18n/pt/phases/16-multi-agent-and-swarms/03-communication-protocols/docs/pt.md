# 通信协议

> Não conseguem falar a mesma língua, não são uma equipa.

**Type:** Build
**Languages:** TypeScript
**Prerequisites:** 第 14 阶段（代理工程），第 16.01 课（为什么使用多代理）
**Time:** ~120 分钟

## Objectivo de aprendizagem

-    implementar MCP  ferramentas de descoberta e de ajuste, para que o agente possa usar ferramentas externas servidores públicos
- Construir A2A  agência de dados e de missão terminal, permitir que um agente através de HTTP vai trabalhar para outro agente
- Comparar MCP (ou ferramentas de consulta)  A2A (ou agentes de consulta)  ACP (ou empresas de auditoria) e ANP (ou ANP)  Descentralização de confiança)
- Conectar vários protocolos a um sistema, agendar através de MCP  detecção de ferramentas e através de A2A  Enviar missões

## 问题

您将系统分多代理――研究员――编辑员――审阅员――他们非常擅长自己的个人工作――但现在你需要他们真正交谈――

 Sua primeira tentativa é evidente: transmite filamentos── os pesquisadores retornam a um grupo de textos, o codificador o mais possível para resolvê-lo── ela permanece válida até que o editador entende mal o resumo do estudo, ou dois agentes estão no caminho de espera para o outro, ou você precisa de um agente de colaboração construído por diferentes equipes──── súbitamente, apenas transmite filamentos                                                                                                                                                                                                            

É o problema do protocolo de comunicação. Sem um acordo de partilha sobre como os agentes trocam informações, o sistema multi-agente é fraco e não pode ser auditado e não pode ser expandido para além da minoria de agentes que você escreve pessoalmente.

O ecossistema artificial inteligente já respondeu a quatro protocolos, cada um resolvendo diferentes partes do problema:

- **MCP**Usó usar ferramentas
- **A2A**Para o trabalho de agência
- **ACP**Utilizado para a auditoria empresarial
- **ANP**Para descentralização de identidade e confiança

Este curso é muito profundo. Você vai ler de cada padrão um verdadeiro padrão de linha, construir o trabalho realizado, e vai todos os quatro conectados a um sistema unificado.

## 概念

### 协议格局

Considerando estes quatro protocolos em camadas, cada camada resolve problemas diferentes:

```mermaid
flowchart TD
  ANP["ANP — How do agents trust strangers?<br/>Decentralized identity (DID), E2EE, meta-protocol"]
  A2A["A2A — How do agents collaborate on goals?<br/>Agent Cards, task lifecycle, streaming, negotiation"]
  ACP["ACP — How do agents talk in auditable systems?<br/>Runs, trajectory metadata, session continuity"]
  MCP["MCP — How does an agent use a tool?<br/>Tool discovery, execution, context sharing"]

  style ANP fill:#f3e8ff,stroke:#7c3aed
  style A2A fill:#dbeafe,stroke:#2563eb
  style ACP fill:#fef3c7,stroke:#d97706
  style MCP fill:#d1fae5,stroke:#059669
```

Não são concorrentes. Eles resolvem problemas diferentes em diferentes níveis.

### MCP(回顾)

MCP em 13 阶段进行深入介绍──快速回顾:MCP 标准化 LLM 连接外部工具和数据源的方式── é uma forma de**客户端-服务器**协议,代理(客户端) encontrou e utilizou servidor publicos ferramentas.

```mermaid
sequenceDiagram
    participant Agent as Agent (client)
    participant MCP1 as MCP Server<br/>(database, API, files)

    Agent->>MCP1: list tools
    MCP1-->>Agent: tool definitions
    Agent->>MCP1: call tool X
    MCP1-->>Agent: result
```

MCP é**代理到工具**Não há nada que ajude a interagir entre os agentes.

### A2A(Agent2Agent 协议)

**创建者：**Google agora pertence ao Linux 基金会, nomeado `lf.a2a.v1`)
**规格版本：**1.0.0
**问题：**Como os agentes autônomos colaborarão, consultarem e delegar tarefas?

A2A é**点对点代理协作**O MCP vai ligar o agente para o instrumento, enquanto o A2A vai ligar o agente para o outro agente.**代理卡**, outros agentes descobrirão que é consultado e dirigido a seus encarregados.

#### A2A 的运作方式

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

#### A verdadeira carta de trabalho

É o que é A2A.`GET /.well-known/agent-card.json`- Não .

```json
{
  "name": "Research Agent",
  "description": "Searches documentation and summarizes findings",
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
      "description": "Searches the web and synthesizes findings",
      "tags": ["research", "search", "summarization"],
      "examples": ["Research the latest changes in React 19"]
    },
    {
      "id": "doc-analysis",
      "name": "Documentation Analysis",
      "description": "Reads and analyzes technical documentation",
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

需要注意的关键事项:
- **技能**É algo que o operador pode fazer. Cada um tem um ID, um tag e um tipo de entrada/saída MIME de suporte. É assim que o agente do cliente decide se o agente remoto pode processar suas solicitações.
- **supportedInterfaces**列出多协议绑定;;单个代理可以同时使用JSON-RPC、REST 和 gRPC;;
- **安全**Intro em cartão. O cliente sabe o que precisa de autenticação antes de enviar uma única solicitação.

#### 任务生命周期

任务是A2A 中的核心工作单元──它们会经历定义的状态:

```mermaid
stateDiagram-v2
    [*] --> submitted
    submitted --> working
    working --> input_required: needs more info
    input_required --> working: client sends data
    working --> completed: success
    working --> failed: error
    working --> canceled: client cancels
    submitted --> rejected: agent declines

    completed --> [*]
    failed --> [*]
    canceled --> [*]
    rejected --> [*]

    note right of completed
        Terminal states are immutable.
        Follow-ups create new tasks
        within the same contextId.
    end note
```

Todos os 8 estados`UNSPECIFIED`Como um sentinela, aqui províncio):

|状态|终端？ |意义|
|---|---|---|
| `TASK_STATE_SUBMITTED` |没有 |已确认，尚未处理 |
| `TASK_STATE_WORKING` |没有 |正在积极处理中 |
| `TASK_STATE_INPUT_REQUIRED` |没有 |代理需要客户提供更多信息 |
| `TASK_STATE_AUTH_REQUIRED` |没有 |需要认证 |
| `TASK_STATE_COMPLETED` |是的 |顺利完成 |
| `TASK_STATE_FAILED` |是的 |已完成但有错误 |
| `TASK_STATE_CANCELED` |是的 |完成前取消 |
| `TASK_STATE_REJECTED` |是的 |特工拒绝了任务|

Uma vez que a missão atinge o estado final, é imutável.`contextId`Entre criar uma nova missão.

#### Há um formato

A2A usando JSON-RPC 2.0...

**客户端发送任务：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{ "text": "Research React 19 compiler features" }]
    },
    "configuration": {
      "acceptedOutputModes": ["text/plain", "application/json"],
      "historyLength": 10
    }
  }
}
```

**代理响应任务：**
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
                "React 19 compiler auto-memoizes components",
                "No more manual useMemo/useCallback needed",
                "Compiler runs at build time, not runtime"
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

**通过 SSE 流式传输：**
```text
POST /message:stream HTTP/1.1
Content-Type: application/json
A2A-Version: 1.0

data: {"task":{"id":"task-123","status":{"state":"TASK_STATE_WORKING"}}}

data: {"statusUpdate":{"taskId":"task-123","status":{"state":"TASK_STATE_WORKING","message":{"role":"ROLE_AGENT","parts":[{"text":"Searching documentation..."}]}}}}

data: {"artifactUpdate":{"taskId":"task-123","artifact":{"artifactId":"art-1","parts":[{"text":"partial findings..."}]},"append":true,"lastChunk":false}}

data: {"statusUpdate":{"taskId":"task-123","status":{"state":"TASK_STATE_COMPLETED"}}}
```

### ACP (agente de comunicação)

**创建者：**IBM / BeeAI
**规范版本：**O valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de um valor de valor de valor de valor de valor de valor de valor de um valor de valor de valor de um valor.
**状态：**合并到Linux 基金会下的 A2A
**问题：**Como se comunica com um agente em condições de verificação completa, de contato contínuo e de rastreamento de trajectória?

ACP é**企业协议** Diferente de muitas afirmações, ACP **不**Utiliza JSON-LD. É através de OpenAPI  Definido simples REST/JSON API.**TrajectoryMetadata**Cada agente pode levar consigo para gerar seus métodos e ferramentas.

```mermaid
sequenceDiagram
    participant Client
    participant ACP as ACP Agent
    participant Audit as Audit Log

    Client->>ACP: POST /runs (mode: sync)
    ACP->>ACP: Process request...
    ACP->>Audit: Log trajectory:<br/>reasoning + tool calls
    ACP-->>Client: Response + TrajectoryMetadata
    Note over Audit: Every step recorded:<br/>tool_name, tool_input,<br/>tool_output, reasoning
```

#### Acompanhamento de agentes no ACP

O ACP definiu quatro métodos de descoberta:

```mermaid
graph LR
    A[Agent Discovery] --> B["Runtime<br/>GET /agents"]
    A --> C["Open<br/>.well-known/agent.yml"]
    A --> D["Registry<br/>Centralized catalog"]
    A --> E["Embedded<br/>Container labels"]

    style B fill:#dbeafe,stroke:#2563eb
    style C fill:#d1fae5,stroke:#059669
    style D fill:#fef3c7,stroke:#d97706
    style E fill:#f3e8ff,stroke:#7c3aed
```

**AgentManifest**Com a A2A, é mais simples:

```json
{
  "name": "summarizer",
  "description": "Summarizes documents with source citations",
  "input_content_types": ["text/plain", "application/pdf"],
  "output_content_types": ["text/plain", "application/json"],
  "metadata": {
    "tags": ["summarization", "RAG"],
    "framework": "BeeAI",
    "capabilities": [
      {
        "name": "Document Summarization",
        "description": "Condenses long documents into key points"
      }
    ],
    "recommended_models": ["llama3.3:70b-instruct-fp16"],
    "license": "Apache-2.0",
    "programming_language": "Python"
  }
}
```

#### 运行 ciclo de vida

Utilize ACP运行而不是任务──Run é um agente de execução com três modos:

|模式|行为 |
|---|---|
| `sync` |阻塞。响应包含完整的结果。 |
| `async` |立即返回 202。轮询 `GET /runs/{id}` 的状态。 |
| `stream` | SSE 流。事件在代理工作时触发。 |

```mermaid
stateDiagram-v2
    [*] --> created
    created --> in_progress
    in_progress --> completed: success
    in_progress --> failed: error
    in_progress --> awaiting: needs input
    awaiting --> in_progress: client resumes
    in_progress --> cancelling: cancel request
    cancelling --> cancelled

    completed --> [*]
    failed --> [*]
    cancelled --> [*]
```

#### TrajetóriaMetadados (auditoria)

Este é um dos principais factores de diferença do ACP. Cada parte da informação pode conter dados que indicam a precisão das operações do agente:

```json
{
  "role": "agent/researcher",
  "parts": [
    {
      "content_type": "text/plain",
      "content": "The weather in San Francisco is 72F and sunny.",
      "metadata": {
        "kind": "trajectory",
        "message": "I need to check the weather for this location",
        "tool_name": "weather_api",
        "tool_input": { "location": "San Francisco, CA" },
        "tool_output": { "temperature": 72, "condition": "sunny" }
      }
    }
  ]
}
```

Para o setor regulado, é ouro. Cada resposta tem uma cadeia de conclusões comprovável: quais ferramentas foram usadas, quais entradas foram usadas, quais saídas foram recebidas.

ACP também apoiado**CitationMetadata** proceder a uma avaliação:

```json
{
  "kind": "citation",
  "start_index": 0,
  "end_index": 47,
  "url": "https://weather.gov/sf",
  "title": "NWS San Francisco Forecast"
}
```

### ANP(agente de acordo)

**创建者：**开源社区(常高伟创办)
**仓库：** [github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol)
**问题：**Como é que os agentes de diferentes organizações podem confiar uns nos outros sem autoridade central?

ANP é**去中心化身份协议** Utiliza o W3C 去中心化标识符 (DID) 和端到端加密 (de facto identificador de código) para criar confiança.

ANP分为三层:

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

#### DID 文件(真实结构)

ANP 使用名为 `did:wba`(Baseado em Agentes da Web) de auto-definição DID 方法── DID `did:wba:example.com:user:alice`解析为 `https://example.com/user/alice/did.json`- Não .

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

需要注意的关键事项:
- 强制执行**密钥分离** a chave de assinatura (secp256k1) e a chave de armazenamento (X25519) são separadas.
- **`humanAuthorization`**A ANP é exclusiva. Estas chaves precisam de aprovação humana antes de serem utilizadas.
- **`keyAgreement`**密钥用于 HPKE 端到端加密 (RFC 9180)
- **服务**部分链接到代理描述文档──

#### 信任在 ANP 中如何运作

ANP **不**O uso de confiança é bipartidário e cada interação é verificada:

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

信任 来源:
1. **域级 TLS**验证 DID 文档主机
2. **DID加密签名**验证代理身份 (servidor de verificação)
3. **最小信任原则** Apenas conceder o limite mínimo de poder

Não há nenhuma avaliação de PageRank ou de confiança baseada em 8. Você pode verificar isso diretamente através de cada agente.

#### 元协议协商

É a função mais recente da ANP. Quando dois agentes de diferentes ecossistemas se encontram, não precisam de um formato de dados previamente acordado.

```json
{
  "action": "protocolNegotiation",
  "sequenceId": 0,
  "candidateProtocols": "I can communicate using:\n1. JSON-RPC with hotel booking schema\n2. REST with OpenAPI 3.1 spec\n3. Natural language over HTTP",
  "modificationSummary": "Initial proposal",
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
    Note over A,B: Agents dynamically generate code<br/>to handle the agreed format.<br/>Max 10 rounds, then timeout.
```

代理来回 (maximum 10 轮) até que o formato seja acordado, então o modo de gerar código para processá-lo.`negotiating`- Não.`rejected`- Não.`accepted`- Não.`timeout`- Não.

Isso significa que dois agentes que nunca se tinham visto podem descobrir como se comunica, sem que ninguém previamente defina o modelo de partilha.

### Comparar (já melhorado)

| | MCP| A2A |非加太 |心钠素 |
|---|---|---|---|---|
| **创建者** |人择 |谷歌/Linux基金会| IBM/BeeAI |社区 |
| **规格格式** | JSON-RPC | JSON-RPC / REST / gRPC | OpenAPI 3.1（休息）| JSON-RPC |
| **主要用途** |代理到工具 |代理对代理|代理对代理|代理对代理|
| **发现** |工具清单 | `/.well-known/agent-card.json` | `GET /agents`、`/.well-known/agent.yml` | `/.well-known/agent-descriptions`，DID服务端点|
| **身份** |隐式（本地）|安全方案（OAuth、mTLS）|服务器级| W3C DID (`did:wba`) 与 E2EE |
| **审计追踪** |不适用 |基本（任务历史记录）| TrajectoryMetadata（工具调用、推理） |未正式指定 |
| **状态机** |不适用 | 9 种任务状态 | 7 种运行状态 |不适用 |
| **流媒体** |不适用 |上交所 |上交所 |与传输无关 |
| **独特的功能** |工具模式|特工卡+技能|轨迹审计追踪|元协议协商|
| **最适合** |工具和数据|动态协作 |受监管行业 |跨组织信任 |
| **状态** |稳定|稳定（v1.0）|合并到A2A |积极发展|

### Como eles cooperam

Estes acordos não se excluem entre si.

```mermaid
graph TB
    subgraph org["Your Organization"]
        RA[Research Agent] <-->|A2A| CA[Coding Agent]
        RA -->|MCP| SS[Search Server]
        CA -->|MCP| GS[GitHub Server]
        AUDIT["All agent responses carry<br/>ACP TrajectoryMetadata"]
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

- **MCP**Vai ligar cada agente a seus instrumentos
- **A2A**处理代理之间的协作( interno e externo)
- **ACP**A resposta ao envelhecimento em dados de trajetória para alcançar a auditividade
- **ANP**Para o seu agente de controle fornecer o certificado de identidade


```figure
swarm-message-bus
```

## Construí-lo

### Primeiro passo: tipo de informação central

Cada sistema multi-agente é iniciado com o formato de mensagem.

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

Nota:`MessagePart`É um modelo muito diferente, como o A2A e o ACP.`TrajectoryEntry`捕获推理链,匹配 ACP's TrajectoryMetadata:

### Segundo passo: A2A 代理卡和注册

Construção conforme a verdadeira A2A 规范的代理发现:

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

É muito mais rico do que um simples nome para o mapeamento de funções. Você pode encontrar um agente através de etiquetas de habilidade, tipo de MIME ou nome para inserir, como o verdadeiro A2A 规范支持.

### 步骤 3: A2A  ciclo de vida da missão

构建完整的任务状态机:

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

Isto realizou um verdadeiro ciclo de vida de A2A: já enviado, está em funcionamento, precisa de entrada, estado final. O processo de processamento é um gerador de diferentes etapas, que pode ser gerado com eventos correspondentes ao modelo SSE.

### 步骤 4: acompanhamento de auditoria do ACP

通过轨迹跟踪包裹通信:

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

Cada execução de um agente gerará uma lista de auditoria completa: o conteúdo de entrada, o conteúdo de saída, o tráfego completo de utilização dos instrumentos e os passos de avaliação intermediários.

### 步骤 5: ANP 式身份验证

Construção baseada em IDD e certificação:

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

Isso reflete o modelo de identidade real da ANP: o agente possuir o documento DID com uma identificação única, consulta de chave e o documento de chave de autorização artificial.`IdentityRegistry`模拟 DID 解析 (((在生产中, this will be for the proxy domain's HTTP 获取) ]]

### 步骤 6: acordo

Todos os quatro protocolos estão conectados a um sistema unificado:

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

网关在一次调用中完成四件事:
1. **ANP**Por meio do DID:
2. **A2A**: encontrar o objetivo agente并检查能力
3. **ACP**O processo de execução do envelope está a ser realizado no seguimento da auditoria de tráfego
4. **A2A**A criação de missões de acompanhamento de ciclo de vida completo

### Seis etapas: ligar-as juntas

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

## O que é que se passa?

O acordo resolveu o caminho do prazer.

**架构漂移。**Agente A 发布代理卡广告 `application/json`输出── mas a estrutura JSON 变化 entre as versões. 代理 B 解析旧形式并得到垃圾──修复:`version`- Não.

**状态机违规。**代理处理程序生成 `completed`事件, em seguida, tentar gerar mais trabalhos. A tarefa é constante.`TaskManager`Em estado de terminação `break`强制执行此操作――

**信任解析失败。**代理 A 尝试验证代理 B 的 DID,但代理 B 的域已关闭──无法获取 DID 文档──你是否打开失败──接受未经验证的代理) 或关闭失败──拒绝一切? ANP 建议按照最小信任原则关闭失败──

**轨迹膨胀。**O sistema de registos de trânsito ACP é muito forte, mas caro. A operação de 200 vezes de ferramentas é complicada, e a sua utilização gera uma grande quantidade de artigos de auditoria.

**发现惊群。**50 agentes em funcionamento ao mesmo tempo que fazem inquéritos`GET /agents` Modificação: utilizar TTL 缓存代理卡、错开发现间隔或使用基于推送的注册而不是轮询──

## Use-o

###  realização real

**A2A**É o mais maduro do Google.[官方spec](https://github.com/google/A2A)É de código aberto do Linux Foundation. Aplica-se ao Python e ao SDK do TypeScript. Se o seu agente precisar de atividade de descoberta e colaboração, comece aqui.

**ACP**Está a ser incorporado para A2A. IBM está a fazer.[BeeAI 项目](https://github.com/i-am-bee/acp) Criou-se o ACP como alternativa prioritária ao REST, mas o conceito de trajectória de dados está sendo absorvido no ecossistema A2A.

**ANP**É o mais experiente.[社区 repo](https://github.com/agent-network-protocol/AgentNetworkProtocol)Há um Python SDK (AgentConnect) ―元协议协商概念确实很新──值得关注的跨组织代理部署──

**MCP**已在第13 阶段涵盖──如果您希望代理使用工具,MCP是标准──

### 选择正确的协议

```mermaid
graph TD
    START{Do agents need<br/>to use tools?}
    START -->|Yes| MCP_R[Use MCP]
    START -->|No| TALK{Do agents need to<br/>talk to each other?}
    TALK -->|No| NONE[You don't need<br/>a protocol]
    TALK -->|Yes| AUDIT{Need audit trails<br/>for compliance?}
    AUDIT -->|Yes| ACP_R[A2A + ACP<br/>trajectory patterns]
    AUDIT -->|No| ORG{All agents<br/>within your org?}
    ORG -->|Yes| A2A_R[A2A<br/>Agent Cards + Tasks]
    ORG -->|No| INFRA{Shared<br/>infrastructure?}
    INFRA -->|Yes| BROKER[A2A + message broker]
    INFRA -->|No| ANP_R[ANP + A2A<br/>DID verification]

    style MCP_R fill:#d1fae5,stroke:#059669
    style A2A_R fill:#dbeafe,stroke:#2563eb
    style ACP_R fill:#fef3c7,stroke:#d97706
    style ANP_R fill:#f3e8ff,stroke:#7c3aed
    style BROKER fill:#e0e7ff,stroke:#4338ca
```

## 发货

本课产生:
- `code/main.ts`-- a implementação completa de todos os quatro protocolos
- `outputs/prompt-protocol-selector.md` ajudar você para o sistema escolha de acordo de sugestões

## 练习

1. **多跳任务委托。**扩展 `TaskManager`O pesquisador recebe uma tarefa, encarrega duas tarefas de especialistas, aguarda a conclusão das duas, e depois combina os resultados para o seu próprio trabalho.

2. **流式审计跟踪。**修改`AuditableRunner`Não é necessário esperar o resultado completo, mas é necessário adicionar o tráfego no que se refere à produção.`AuditEntry`                                                                                                                                                                                                                                                              

3. **DID 轮换。**A chave foi alterada.`IdentityRegistry` O agente deve ser capaz de publicar o novo documento DID com uma nova chave, ao mesmo tempo que mantém o documento.`previousDid`引用── verificador deve aceitar, no prazo de largura, a assinatura da chave atual e da chave anterior──

4. **协议协商。**Implementar o protocolo de ANP.`protocolNegotiation`消息(por exemplo,我可以讲 JSON-RPC与我更喜欢 REST) 多多 3轮后, they就赛制或暂停达成一致──约定格式决定它们使用哪种`TaskManager`Ou `AuditableRunner`- Não.

5. **速率限制发现。**添加 `RateLimitedRegistry`O envasador, que usa o envasador configurável TTL 缓存代理卡查找,并限制每个代理每秒的发现查询──模拟100代理在启动时发现彼此的惊惊群并测量差异──

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|----------------|----------------------|
| MCP| “人工智能工具协议”|供代理发现和使用工具的客户端-服务器协议。代理到工具，而不是代理到代理。 |
| A2A | 《Google 的代理协议》| Linux 基金会下用于代理协作的点对点协议。通过代理卡进行发现，9 状态任务生命周期，通过 SSE 进行流式传输。支持 JSON-RPC、REST 和 gRPC 绑定。 |
|非加太 | 《企业代理消息传递》 | IBM/BeeAI 的代理 REST API 与 TrajectoryMetadata 一起运行：每个响应都携带完整的推理和工具调用链。合并到A2A。 |
|心钠素 | “去中心化代理身份”|使用 `did:wba` (DID) 进行加密身份的社区协议、用于 E2EE 的 HPKE 以及用于从未见过对方的代理的人工智能元协议协商。 |
|代理卡| 《代理人的名片》| `/.well-known/agent-card.json` 上的 JSON 文档描述了技能、支持的 MIME 类型、安全方案和协议绑定。 |
|确实 | “去中心化ID” |用于在代理自己的域上托管的可加密验证身份的 W3C 标准。 ANP使用`did:wba`方法。 |
|轨迹元数据 | “审计收据”| ACP 的机制，用于将推理步骤、工具调用及其输入/输出附加到每个代理响应。 |
|元协议| “代理人谈判如何交谈”| ANP 的方法是，代理使用自然语言动态地就数据格式达成一致，然后生成代码来处理它们。 |
|任务| “一个工作单元” | A2A 的状态对象跟踪工作从提交到完成。一旦终端就不可变。 |

##  weiterlesen

- [Google A2A 规范](https://github.com/google/A2A)-- 官方规范和 SDK(v1.0.0,Linux 基金会)
- [IBM/BeeAI ACP 规范](https://github.com/i-am-bee/acp)-- para a utilização de dados de operação e trânsito de agentes OpenAPI 3.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
- [代理网络协议](https://github.com/agent-network-protocol/AgentNetworkProtocol)-- baseada na identidade do DID, E2EE,
- [模型上下文协议 docs](https://modelcontextprotocol.io/)-- Antropic of MCP 规范(第 13 阶段涵盖)
- [W3C 去中心化标识符](https://www.w3.org/TR/did-core/)支 ANP's身份标准
- [RFC 9180 (HPKE)](https://www.rfc-editor.org/rfc/rfc9180)-- ANP para o E2EE de agregação
- [FIPA代理通信语言](http://www.fipa.org/specs/fipa00061/SC00061G.html)现代代理协议的学术先驱
