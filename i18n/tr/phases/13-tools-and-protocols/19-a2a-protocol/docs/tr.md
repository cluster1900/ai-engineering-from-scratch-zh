# A2A  Ajan-Ajan 协议

> MCP, A2A'nın (Agent2Agent) A2A'nın (Agent2Agent) A2A'nın (Agent2Agent) A2A'nın (Agent2Agent) A2A'nın (Agent2Agent) A2A'nın (Agent2A) A2A'nın (Agent2Agent) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A2A2A) A2A'nın (A) A2A'nın (A2A'nın (A2A) A2A'nın (A2A) A2A'nın (A) (A2A'nın (A) (A2A) (A) (A) (A2A'nın (A) (A) (A) (A (A) (A) (A) (A (A) (A) (A) (A (A) (A) (A (A) (A (A) (A (A) (A) (A (A) (A) (A) (A (A (A) (A) (A) (A (A) (A) (A (A) (A) (A (A) (A) (A (A (A)

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## Öğrenme hedefi

- 区分 Agent-to-Tool (MCP) ve Agent-to-Agent (A2A) uygulama sahnesinde
- - Evet .`/.well-known/agent-card.json`发布包含技能和 `supportedInterfaces`- Ajan Kartı.
- 走通完整的 Task 生命周期:`TASK_STATE_SUBMITTED`- Evet.`TASK_STATE_WORKING`- Evet.`TASK_STATE_INPUT_REQUIRED`, ve son hal`TASK_STATE_COMPLETED`- Evet.`TASK_STATE_FAILED`- Evet.`TASK_STATE_CANCELED`- Evet.`TASK_STATE_REJECTED`- Evet.
- kullanmak için her bölüm  Sadece içerir `text`- Evet.`raw`- Evet.`url`Ya da`data`之一的 Messages,并使用文物 作为结构化产物输出──

## 问题背景

Bir müşteri ajanı, rapor yazma görevini özel bir yazma ajanına vermeli. A2A'nın ortaya çıkışından önce seçeneği:

- REST API: 可行, ama her grup配对都 bir kez sekslidir.
- 共享 Codebase: iki ajanın aynı çerçeve üzerinde çalışmasını gerektirir.
- MCP: uygun değil, MCP, bir araç kullanmak için kullanılır, iki Ajanın birbirine karşı işbirliği yapmalarını destekleyemez.

A2A bu boşluğu doldurdu. Bu, bir Ajan'a diğer Ajan'a gönderilen bir görev olarak birbiriyle iletişim kurar. Bu, açık bir yaşam döngüsü, Mesajlar ve Sanatlar içerir.

A2A, A2A'nın birbiriyle iletişim kurma standartlarını değiştirmek için bir çerçeve oluşturur.

## 核心概念

### Ajan Kartı (智能体名片)

A2A kurallarına uygun her ajan şehirde bulunur .`/.well-known/agent-card.json`暴露其名片:

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

发现机制基于URL:拉取名片,选择客户端所支持的第一个 `supportedInterfaces`条目,并枚举其暴露的技能──输入和输出模式均采用标准媒体类型──

### 签名 Ajan Kartı(Müsavip Ajan Kartları)

Bir tane bile olabilir.`signatures`RFC 7515, çıkarma amacıyla`signatures`字段后的名片 RFC 8785 规范化 JSON 计算生成──使用方以同方式规范化并校验签名,防止假冒伪造──

### Görev  yaşam döngüsü

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

Müşteri 发起 `SendMessage`,Server Task oluşturun                                                                                                                                                                                                                                                           `GetTask`Soru sormak, ya da geçmek`SendStreamingMessage`ile`SubscribeToTask` 流式监听──流式事件包含 `statusUpdate`ile`artifactUpdate`, ve Görev  giriş  final state  kapanış bağlantısı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `final`- Evet.

### Mesajlar ve Ürünler

Bir mesaj içerir`messageId`- Evet.`role`(`ROLE_USER`Ya da`ROLE_AGENT`) ve bir veya daha fazla parça.**仅包含一个内容字段**,该字段名称即为其类型, artık kullanılmıyor `kind`判别字段:

- `text`:Pure text content──
- `raw`:文件二进制流(在 JSON 中表现为 Base64), genellikle eşlik eder `filename`和 `mediaType`- Evet.
- `url`:: referent dosya içeriği bağlantıları
- `data`: yapılandırılmış JSON 数据荷荷 ():

Örnek:

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

### Sanat malzemeleri

任务输出是工艺品,而不是松散字符串──工艺品是具名、带类型的结构化产品:

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

Sanat eserleri 支持流式分块传输──每个 `artifactUpdate`事件携带产品数据 ve `append`和 `lastChunk`- Evet.

### Üç种协议绑定(Protokol Bağlamaları)

1. **JSON-RPC 2.0 over HTTP**(`JSONRPC`):POST 用于请求,SSE 用于流.`SendMessage`- Evet.`SendStreamingMessage`- Evet.`GetTask`- Evet.`ListTasks`- Evet.`CancelTask`- Evet.`SubscribeToTask`- Evet.`CreateTaskPushNotificationConfig`- Evet.
2. **gRPC**(`GRPC`): GRPC'nin yerel desteklenmiş işletme iç ortamına uygundur, aynı yöntemle.
3. **HTTP+JSON/REST**(`HTTP+JSON`): Standard 标准  REST 资源路径, örneğin `POST /message:send`和 `GET /tasks/{id}`- Evet.

Üç çeşit bağlanmış ortaklıklı tamamen uyumlu veri modeli.`supportedInterfaces`条目声明对应的绑定类型与其 `protocolVersion`Müşteri her bir istek içinde gönderilmelidir.`A2A-Version: 1.0`Lütfen başlayın, yoksa Server muhtemelen eski sürüm 0.3 olarak görecektir.

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

### Çekilmezlik (Case)

核心设计哲学: 被调用的代理的内部状态是高度不透明的. 调用方只能看到任务状态与输出艺术品; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用者的思维链; 被调用的工具; 被调用的代理发发发行过程对外界的不见之; MCP's Tool 调用的与 MCP's Tool 调用的必须完全透明的,根本的区别有着的.

设计理由:A2A 让相互竞争的公司也能合作,而无需暴露各自的内部实现. A2A 调用这个客服代理,而调用方不会因此知道那个代理是如何实现这个服务.

### Zamanı

- **2025-04-09.**Google A2A yayınladı.
- **2025-06-23.**Linux Vakfına bağışta bulunmak.
- **2025-08.**IBM'in AKP'lerini al.
- **2025-09.**AP2 扩展(Agent Ödemeleri) yayınlanmaktadır.
- **2026-04.**V1.0'da yayınlanan ve 150'den fazla organizasyon tarafından desteklenen bir yayın.

### MCP ile ilişki karşılığı

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

MCP kullanırken belirli araçları kullanmak; A2A kullanırken tüm görevleri başka bir akıllı vücuda vermek gerekir.

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py`A2A 1.0.1 ırkına dayanan bir hafif testi oluşturmak: yazmak Agent  yayınlamak onun isimli, çalışmak Agent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `SendMessage`Lütfen, görev deneyimini`TASK_STATE_WORKING`→ `TASK_STATE_INPUT_REQUIRED`→ `TASK_STATE_WORKING`→ `TASK_STATE_COMPLETED`, final return textbook Artifact。 Pure standard库实现, kullanın内存传输以便直观聚焦报文结构。

重点观察:

- Agent Kart'ın JSON yapısı:
- Server 端 Görev Kimliği 分配与状态转换──
- 通過内容字段自判別的 结构的部分──
- 任务执行中途的  görevler yerine getirmek`TASK_STATE_INPUT_REQUIRED`- Evet.
- 终态时返回的手工艺品──

## 交付物

本课交付 `outputs/skill-a2a-agent-spec.md` Dıştan işe alınması için yeni bir ajan oluşturmak için standart ajan kartı oluşturur JSON、Skills 声明规范及端点接入设计。

## 练习

1. 运行  İşlem`code/main.py`◊ Tüm görev yaşam döngüsünü takip etmek, görevli ajanlar dahil`TASK_STATE_INPUT_REQUIRED`Durdurun.

2. İmzalanmış bir ajan kartı ekleyin.`signatures`İçeri girdi.`alg`设为 `HS256`JWS 条目,对去掉 `signatures`字段后的卡 规范化 JSON 签名──编写一个验证器,并确认它在被改编的卡上验证失败──

3. Kullan .`SendStreamingMessage`实现任务流式传输: 作者                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `task`Üç kişi.`artifactUpdate`Bir parça ve bir çubuk.`TASK_STATE_COMPLETED``statusUpdate`Sonra bu parçaları toplayıp kapatırız.

4. デザイン一封装 MCP Server'ın A2A Ajanı,.. Her MCP Aracını 映射する A2A Bilgisi,..

5. A2A v1.0'un yayın ilanını okuyun, 2026 yılına kadar herhangi bir çerçeve gerçekleştirilmemiş olan bir özellik bulunmaktadır.

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
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)  参考实现与SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) 本课遵循的规范与Protobuf 契约
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) 2025 yılının Haziran ayında yönetim hakları transfer
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) İşbirliği ile ilerleme
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) v1.0  yayımlama açıklaması ve öne geçiş uyum göstergesi
