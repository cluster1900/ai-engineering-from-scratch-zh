# A2A  Agente a Agente  acordo

> MCP é um protocolo aberto para permitir que os inteligentes não transparentes construídos com base em diferentes frameworks realizem cooperação entre si. O Google lançou o protocolo em abril de 2025, doando em junho do mesmo ano à Fundação Linux, e em abril de 2026 alcançou a versão 1.0, com mais de 150 suporte em AWS, Cisco, Microsoft Salesforce, SAP e ServiceNow.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## Objectivo de aprendizagem

- 区分 Agent-to-Tool (MCP) e Agent-to-Agent (A2A) cenário de aplicação:
- Em`/.well-known/agent-card.json`发布包含技能和 `supportedInterfaces`- O cartão de agente.
- 走通完整的Tasks 生命周期:`TASK_STATE_SUBMITTED`- Não.`TASK_STATE_WORKING`- Não.`TASK_STATE_INPUT_REQUIRED`, e o final`TASK_STATE_COMPLETED`- Não.`TASK_STATE_FAILED`- Não.`TASK_STATE_CANCELED`- Não.`TASK_STATE_REJECTED`- Não.
- Use各 Parte 仅包含 `text`- Não.`raw`- Não.`url`Ou `data`之一的消息,并使用文物 作为结构化产物输出──

## 问题背景

Um agente cliente precisa de encomendar um relatório para um agente especial.

- REST API:可行, mas cada grupo de配对都 é uma única vez.
- Compartilhar Código: Requer dois Agentes para operar no mesmo quadro.
- MCP: não se adapta, MCP utiliza ferramentas de manipulação, não pode apoiar dois agentes em manter seus próprios raciocínios internos opacos (Opaque Reasoning) para realizar o mesmo trabalho.

A2A  preenche esse espaço em branco. Ele irá interagir em abstração para um Agente para outro Agente  Enviar tarefa, contendo um ciclo de vida manifesto  Mensagens e Artefatos  Ser chamado para manter o estado interno do Agente  O usuário só pode ver o estado de tarefa  Transform e saída final 

A2A é o protocolo padrão de um agente para dialogar entre si. Não é substituir o MCP, são as relações de cooperação complementar.

## 核心概念

### Cartão de Agente (智能体名片)

Todos os agentes que cumprem as regras do A2A estão presentes .`/.well-known/agent-card.json`暴露其名片:

```json
{
  "name": "research-agent",
  "description": "总结学术论文并草拟引用。",
  "version": "1.2.0",
  "supportedInterfaces": [
    {
      "url": "https://research.example.com/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true},
  "securitySchemes": {
    "bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}
  },
  "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/markdown"],
  "skills": [
    {
      "id": "summarize_paper",
      "name": "总结论文",
      "description": "读取论文 PDF，并生成 3 段摘要。",
      "tags": ["research", "summarization"],
      "inputModes": ["text/plain", "application/pdf"],
      "outputModes": ["text/markdown"]
    }
  ]
}
```

发现机制基于URL:拉取名片,选择客户端所支持的第一 `supportedInterfaces`条目,并枚举其暴露的技能──输入和输出模式均采用标准媒体类型──

### 签名 Cartão de Agente ((Cartões de Agente assinados)

Nômen pode conter um .`signatures`Numero de elementos: cada item é um JWS (RFC 7515), destinado a eliminação`signatures`字段后的名片 RFC 8785 规范化 JSON 计算生成──使用方以同样方式规范化并校验签名,防止假冒伪造──

### Tarefa  ciclo de vida

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

Cliente 发起 `SendMessage`,Server  criar tarefa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `GetTask`轮询, ou através `SendStreamingMessage`Com`SubscribeToTask` conduzir SSE 流式监听──流式事件包含 `statusUpdate`Com`artifactUpdate`, e a tarefa  entrar em finaldo  quando se fecha                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `final`- Não.

### Mensagens e Partes

Uma mensagem contém`messageId`- Não.`role`(`ROLE_USER`Ou `ROLE_AGENT`) e uma ou mais partes.**仅包含一个内容字段**,该字段名称即为其类型, já não é mais utilizado `kind`判别字段:

- `text`É um livro de ficção.
- `raw`:文件二进制流(在 JSON 中表现为 Base64), normalmente acompanhado `filename`和 `mediaType`- Não.
- `url`O que é o "Changes de conteúdo do documento":
- `data`: Structured JSON 数据载荷 (JSON dados de carga)

exemplo:

```json
{
  "messageId": "msg-001",
  "role": "ROLE_USER",
  "parts": [
    {"text": "总结这篇论文。"},
    {"raw": "...", "filename": "paper.pdf", "mediaType": "application/pdf"},
    {"data": {"targetLength": "3 paragraphs"}, "mediaType": "application/json"}
  ]
}
```

### Artefactos (produtos)

任务输出是工艺品,而不是松散字符串──Artifact é um tipo de produto estruturado:

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

Artefactos 支持流式分块传输── cada um `artifactUpdate`Eventos e dados de produtos`append`和 `lastChunk`- Não.

### 三种协议绑定(Protocolo de ligação)

1. **JSON-RPC 2.0 over HTTP**(`JSONRPC`):POST Utilizando o pedido, SSE Utilizando o fluxo.`SendMessage`- Não.`SendStreamingMessage`- Não.`GetTask`- Não.`ListTasks`- Não.`CancelTask`- Não.`SubscribeToTask`- Não.`CreateTaskPushNotificationConfig`E assim...
2. **gRPC**(`GRPC`): Aplicado ao ambiente interno das empresas de gRPC, com o mesmo nome de método:
3. **HTTP+JSON/REST**(`HTTP+JSON`): Standard of REST 资源路径, tais como `POST /message:send`和 `GET /tasks/{id}`- Não.

Três tipos de dados de partilha de dados totalmente harmoniosos.`supportedInterfaces`条目声明对应的绑定类型与其 `protocolVersion`◊ O cliente ▌empenha em cada pedido `A2A-Version: 1.0`Pequenação, caso contrário o servidor poderá vê-la como a versão anterior 0.3 处理.

```http
POST /a2a HTTP/1.1
Host: research.example.com
Content-Type: application/json
A2A-Version: 1.0

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{"text": "总结这篇论文。"}]
    }
  }
}
```

### Não transparência (Reservação de espaço)

核心设计哲学: o estado interno do agente é altamente opaco. O agente só pode ver o estado de tarefa e a saída de artefatos.

### Relação com o MCP

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

Quando é necessário utilizar ferramentas específicas, usar MCP; quando é necessário encomendar toda a tarefa a outro corpo inteligente, usar A2A;.

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `SendMessage`Pelicula , experiência de tarefa`TASK_STATE_WORKING`→ `TASK_STATE_INPUT_REQUIRED`→ `TASK_STATE_WORKING`→ `TASK_STATE_COMPLETED`, finalmente retornar o texto Artifact。 puros padrões  realizado, usando o 內存传输以便直观聚焦报文结构。

重点观察:

- Estrutura JSON do Agente Card:
- Server 端 Task ID 分配与状态转换──
- 通过内容字段自判别的 结构的部分
- 任务执行中途的  missão executar no meio do caminho  missão executar no meio do caminho`TASK_STATE_INPUT_REQUIRED`- Não.
- 终态时返回的 Artifact──

## 交付物

本课交付 `outputs/skill-a2a-agent-spec.md` Para o desejo de ser recrutado por um novo agente externo, pode gerar um padrão de cartão de agente JSON、Skills 声明规范及端点接入设计。

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| A2A | Agent-to-Agent 协议，用于异构不透明智能体间跨系统对等协作 |
| Agent Card | 暴露于 `/.well-known/agent-card.json` 的名片，公布能力、接口与鉴权 |
| Skill | Agent 所支持的命名功能单元（类似于 MCP 中的 Tool） |
| Task | 具备独立生命周期和产物输出的异步任务委托单元 |
| Message | 承载交互内容的实体，内含纯内容字段标识的 Parts 数组 |
| Part | 仅包含 `text`、`raw`、`url` 或 `data` 之一的独立内容切片 |
| Artifact | 任务完成时产出的具名、带类型输出成果 |
| `TASK_STATE_INPUT_REQUIRED` | 当任务执行遇阻需要调用方提供补充输入时的挂起状态 |

## 延伸阅读

- [a2a-protocol.org](https://a2a-protocol.org/latest/) A2A 规范主站
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)   referência ao desenvolvimento sustentável e do KSD
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) Este curso segue as normas e o Protocolo de Protobuf
