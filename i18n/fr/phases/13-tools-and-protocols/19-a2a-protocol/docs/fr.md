# A2A  Agent-à-Agent accord

> MCP est un protocole ouvert de coopération entre les agents et les outils. Le protocole a été publié en avril 2025 par Google, qui a fait un don à la Fondation Linux en juin 2026, et atteint la version 1.0, qui comprend AWS, Cisco, Microsoft, Salesforce, SAP et ServiceNow. Il a absorbé l'ACP d'IBM, et a augmenté les paiements AP2 en augmentant ses capacités.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## Objectif de l'apprentissage

- 区分 Agent-to-Tool (MCP) et Agent-to-Agent (A2A) scénario d'application
- Dans le`/.well-known/agent-card.json`发布包含 compétences et `supportedInterfaces`Carte d'agent de l'agence.
- 走通完整的任务 生命周期:`TASK_STATE_SUBMITTED`- Je suis là.`TASK_STATE_WORKING`- Je suis là.`TASK_STATE_INPUT_REQUIRED`, ainsi que le terme`TASK_STATE_COMPLETED`- Je suis là.`TASK_STATE_FAILED`- Je suis là.`TASK_STATE_CANCELED`- Je suis là.`TASK_STATE_REJECTED`Il y a une autre.
- Utilisation de chaque partie 仅包含 `text`- Je suis là.`raw`- Je suis là.`url`Ou `data`之一的 Messages,并使用文物 作为结构化产物输出──

## 问题背景

Un agent client doit confier un rapport à un agent spécialisé.

- REST API: 可行, mais chaque groupe de couples est une fois sexuelle.
- Compagnie de base de code: exige deux agents fonctionnant sur le même cadre.
- MCP: pas adapté, MCP utilise des outils de référencement, ne peut pas soutenir deux agents en conservant leur propre raisonnement intérieur opaque (en conservant leur propre raisonnement opaque) pour effectuer des collaborations similaires.

A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2A  A2

A2A est un protocole standard de communication entre les agents. Il ne doit pas remplacer le MCP, les deux sont des relations de coopération mutuelle.

## 核心概念

### Carte d'agent (en anglais)

Chaque agent conforme aux règles A2A se réunit dans la ville .`/.well-known/agent-card.json`暴露其名片:

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

发现机制基于URL:拉取名片,选择客户端所支持的第一个 `supportedInterfaces`Les compétences en matière d'entrée et sortie sont utilisées selon les types de médias standard.

### 签名 Carte d'agent (Carte d'agent signée)

Nom de la carte peut contenir un `signatures`Les articles sont tous des JWS (RFC 7515), visant à éliminer les`signatures`字段后的名片 RFC 8785 规范化 JSON 计算生成──使用方以同样方式规范化并校验签名,防止假冒伪造──

### Taxe  cycle de vie

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

Client 发起 `SendMessage`,Serveur  Créer des tâches                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `GetTask`Retour à la question`SendStreamingMessage`Avec `SubscribeToTask` conduire SSE 流式监听──流式事件包含 `statusUpdate`Avec `artifactUpdate`, et la tâche n'est pas unique dans la réglementation.`final`Le signe.

### Messages et pièces

Un message contient`messageId`- Je suis là.`role`(le secteur de l'énergie)`ROLE_USER`Ou `ROLE_AGENT`) ainsi qu'une ou plusieurs parties.**仅包含一个内容字段**,该字段名称即为其类型, cesse d'être utilisé `kind`判别字段:

- `text`: pur contenu de texte
- `raw`:文件二进制流( dans JSON 中表现为 Base64), généralement accompagné `filename`et `mediaType`Il y a une autre.
- `url`: référence au contenu du dossier
- `data`: structurée JSON 数据载荷(为被调用代理 提供结构化输入)

Pour le cas:

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

### Les objets

任务输出是艺术品, et non pas des caractères dispersés.

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

Les objets de l'artisanat sont en train de se dérouler.`artifactUpdate`事件携带产品数据 ainsi que `append`et `lastChunk`Le signe.

### 三种协议绑定(Protocol Liens)

1. **JSON-RPC 2.0 over HTTP**(le secteur de l'énergie)`JSONRPC`):POST Utilisé pour la demande, SSE Utilisé pour le flux.`SendMessage`- Je suis là.`SendStreamingMessage`- Je suis là.`GetTask`- Je suis là.`ListTasks`- Je suis là.`CancelTask`- Je suis là.`SubscribeToTask`- Je suis là.`CreateTaskPushNotificationConfig`Ça va.
2. **gRPC**(le secteur de l'énergie)`GRPC`): adapté à l'environnement interne des entreprises de GRPC, avec le même nom de méthode:
3. **HTTP+JSON/REST**(le secteur de l'énergie)`HTTP+JSON`): standard de REST 资源路径, comme `POST /message:send`et `GET /tasks/{id}`Il y a une autre.

Trois types de données complètement cohérentes partagées.`supportedInterfaces`条目 déclaration à la relation des types de liaison avec elle `protocolVersion`◊ Le client doit envoyer dans chaque requête `A2A-Version: 1.0`La requête est supprimée, sinon le serveur pourrait la voir comme une ancienne version 0.3 处理.

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

### Non-conformité avec les conditions de l'application

核心设计哲学: l'état interne de l'agent affecté est hautement opaque. Le utilisateur ne peut voir que l'état de tâche et les objets de sortie; l'utilisateur ne peut voir que l'état de tâche et les objets de sortie; l'outil interne est invisible à l'extérieur.

### Relation avec le PCM

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

Lorsque vous avez besoin de mettre en œuvre des outils spécifiques en utilisant le MCP; lorsque vous avez besoin de confier l'ensemble de la tâche à un autre organisme intelligent en utilisant l'A2A;; dans l'environnement de production, il est souvent combiné en utilisant:

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py` réaliser un composant de test léger basé sur la norme A2A 1.0.1: écrire Agent  publier son nom, étudier Agent vers son envoi avec PDF Partie et instruction de texte `SendMessage`S'il vous plaît, tâche`TASK_STATE_WORKING`- Je suis là.`TASK_STATE_INPUT_REQUIRED`- Je suis là.`TASK_STATE_WORKING`- Je suis là.`TASK_STATE_COMPLETED`, définitivement retourner le texte Artifact, pur standard, réalisé, utilisez le flux de l'écriture à l'intérieur afin de voir directement la structure du texte.

Je suis en train de faire une remarque.

- La structure JSON de la carte agent
- ID de tâche du serveur 端 分配与状态转换──
- 通过内容字段自判别的部分 结构──
-  tâche d'exécution`TASK_STATE_INPUT_REQUIRED`Je suis là.
- 终态时返回的艺术品──

## 交付物

本课交付 `outputs/skill-a2a-agent-spec.md` Pour la recherche d'un nouvel agent à employer à l'extérieur, il peut générer une carte agent standard JSON、Skills 声明规范及端点接入设计。

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
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)  Dans le cadre de la réalisation et du KDD
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) Le présent article suit les règles et les règles du protocole
