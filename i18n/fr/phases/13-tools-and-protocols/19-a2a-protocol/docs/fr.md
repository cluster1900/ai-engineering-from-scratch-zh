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
  "description": "Summarizes academic papers and drafts citations.",
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
      "name": "Summarize a paper",
      "description": "Read a paper PDF and produce a 3-paragraph summary.",
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
    {"text": "Summarize this paper."},
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
      "parts": [{"text": "Summarize this paper."}]
    }
  }
}
```

### Non-conformité avec les conditions de l'application

核心设计哲学: l'état interne de l'agent affecté est hautement opaque. Le utilisateur ne peut voir que l'état de tâche et les objets de sortie; l'utilisateur ne peut voir que l'état de tâche et les objets de sortie; l'outil interne est invisible à l'extérieur.

设计理由:A2A 让相互竞争的公司也能合作,而无需暴露各自的内部实现.A2A peut être 调用客服代理,而调用方不会因此知道那个代理是如何实现这个服务的.

### 时间线

- **2025-04-09.**Google a publié A2A:
- **2025-06-23.**Donation à la Fondation Linux.
- **2025-08.**吸收 IBM's ACP:
- **2025-09.**AP2 扩展(Payments des agents)
- **2026-04.**La version 1.0 a été publiée, obtenu le soutien de plus de 150 organisations.

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

## 练习

1. 运行  référencement`code/main.py` Suivre l'ensemble du cycle de vie de la tâche, y compris les agents affectés`TASK_STATE_INPUT_REQUIRED`Pour l'instant.

2. Ajouter une carte d'agent signée.`signatures`Je suis en train de faire une petite histoire.`alg`设为 `HS256`Je suis en train de vous dire que vous êtes en train de mourir.`signatures`字段后的卡 规范化 JSON 签名── éditer un vérificateur,并确认它在被修改的卡 上验证失败──

3. - Je veux le faire .`SendStreamingMessage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `task`Les trois`artifactUpdate`Un bloc, et un bandeau.`TASK_STATE_COMPLETED``statusUpdate`Puis, il ferme le flux.

4. Œuvre d'un agent A2A de MCP Server en enveloppé Œuvre de chaque outil MCP Œuvre d'un outil A2A Œuvre d'un outil A2A Œuvre d'un outil MCP

5. 阅读 A2A v1.0's release announcement, trouvez-le jusqu'en 2026 4 月 没有任何框架实现那个特性──(提示:它与多跳任务委托有关──)

## 核心专业术语

| 术语 | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| A2A | “Agent-to-Agent 协议” | 用于不透明 Agent 协作的开放协议 |
| Agent Card | “`/.well-known/agent-card.json`” | 公开发布的元数据，描述 Agent 的 Skills 和 `supportedInterfaces` |
| Skill | “一个可调用单元” | Agent 支持的具名操作（类似于 MCP 中的 Tool） |
| Task | “委托单元” | 具有生命周期和最终 Artifact 的工作项 |
| Message | “Task 输入” | 承载 Parts（`text`、`raw`、`url`、`data`） |
| Part | “带类型的分块” | `text` / `raw` / `url` / `data` 中恰好一个，外加可选的 `mediaType`；没有 `kind` 字段 |
| Artifact | “Task 输出” | 完成时返回的具名、带类型输出 |
| AP2 | “Agent Payments Protocol” | 构建在 A2A 之上的支付扩展；Card 签名属于 A2A 核心（`signatures`） |
| Opacity | “黑盒协作” | 被调用 Agent 的内部实现对调用方隐藏 |
| `TASK_STATE_INPUT_REQUIRED` | “Task 暂停” | Agent 需要更多信息时的中断状态 |

## 延伸阅读

- [a2a-protocol.org](https://a2a-protocol.org/latest/) A2A 规范主站
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)  Dans le cadre de la réalisation et du KDD
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) Le présent article suit les règles et les règles du protocole
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) Le pouvoir de gouvernance transféré en juin 2025
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) Progress de la coopération
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) v1.0  publication des instructions et orientations de compatibilité
