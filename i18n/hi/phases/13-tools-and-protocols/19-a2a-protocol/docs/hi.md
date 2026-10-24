# ए2ए  एजेंट-टू-एजेंट 协议

> एमसीपी एजेंट-टू-टूल है। ए2ए (एजेंट2एजेंट) एजेंट-टू-एजेंट है। यह एक खुला समझौता है जो विभिन्न ढांचे के आधार पर निर्मित अस्पष्ट बुद्धिमान निकायों को एक-दूसरे के साथ काम करने के लिए उपयोग किया जाता है। गूगल ने इस समझौते को अप्रैल 2025 में जारी किया, उसी वर्ष जून में लिनक्स फाउंडेशन को दान किया, और 2026 में अप्रैल में v1.0 तक पहुंच गया, जिसमें AWS, Cisco, Microsoft, Salesforce, SAP और ServiceNow शामिल हैं। इसमें 150+ समर्थन शामिल हैं। यह आईबीएम के एसीपी को अपनाया गया, और एपी 2 का विस्तार किया गया। इस पाठ्यक्रम को ए 2 ए 1.0.1 के साथ जोड़ा गया है।

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## 学习目标

- 区分 एजेंट-टू-टूल (MCP) और एजेंट-टू-एजेंट (A2A) के अनुप्रयोग परिदृश्य
- `/.well-known/agent-card.json`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `supportedInterfaces`पूर्व डेटा एजेंट कार्ड
- 走通完整的任务 生命周期:`TASK_STATE_SUBMITTED``TASK_STATE_WORKING``TASK_STATE_INPUT_REQUIRED`, तथा समापन`TASK_STATE_COMPLETED``TASK_STATE_FAILED``TASK_STATE_CANCELED``TASK_STATE_REJECTED`
- उपयोग करें प्रत्येक भाग  केवल शामिल `text``raw``url`या `data`之一的 संदेश,并使用文物 作为结构化产物输出──

## 问题背景

एक ग्राहक एजेंट को एक विशेष लेखन एजेंट को रिपोर्ट लिखने की आवश्यकता होती है।

- स्वनिर्धारित REST API:可行, लेकिन प्रत्येक समूह配对都 एक बार यौन है.
- साझा कोडबेस: दो एजेंटों को एक ही ढांचे पर संचालित करने की आवश्यकता है
- एमसीपी: अप्रासंगिक, एमसीपी उपयोग करने के लिए उपकरण, दो एजेंटों का समर्थन करने में असमर्थ है, जबकि दोनों एक साथ एक समान सहयोग करते हैं

A2A  इस रिक्त स्थान को भरता है  यह एक एजेंट को दूसरे एजेंट को संबद्ध करता है   भेजने का कार्य, जिसमें स्पष्ट जीवन चक्र, संदेश और कलाकृतियां शामिल हैं                                                                                                                                                                                                                                        

ए२ए एक मानक समझौता है जो एजेंटों को एक दूसरे से संवाद करने के लिए एक-दूसरे के साथ एक-दूसरे के बीच एक-दूसरे के बीच सहयोग करने के लिए एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच एक-दूसरे के बीच-दूसरे के बीच-साथ एक-साथ एक-साथ एक-साथ एक-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ-साथ

## 核心概念

### एजेंट कार्ड (智能体名片)

A2A के नियमों के अनुरूप प्रत्येक एजेंट शहर में होगा`/.well-known/agent-card.json`暴露其名片:

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

发现机制基于URL:拉取名片,选择客户端所支持的第一 `supportedInterfaces`条目,并枚举其暴露的技能──输入和输出模式均采用标准媒体类型──

### 签名 एजेंट कार्ड(हस्ताक्षरित एजेंट कार्ड)

名片 एक हो सकता है `signatures`संख्याएँ  प्रत्येक अनुच्छेद एक JWS (RFC 7515) है, जिसे हटाने के लिए`signatures`字段后的名片 RFC 8785 规范化 JSON 计算生成── उपयोग विधि के समान रूप से规范化并校验签名, रोकथाम नकली बनावट──

### कार्य जीवन चक्र

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

ग्राहक 发起 `SendMessage`,सर्वर निर्माण कार्य──क्राफ्ट एजेंट;क्राफ्ट एजेंट`GetTask`轮询, या द्वारा `SendStreamingMessage``SubscribeToTask` SSE 流式监听──流式事件包含 `statusUpdate``artifactUpdate`, और कार्य में प्रवेश करने के लिए अंतिम स्थिति में बंद कनेक्शन.`final`标志──

### संदेश और भाग

एक条 संदेश 包含 `messageId``role`(`ROLE_USER`या `ROLE_AGENT`) तथा एक या अधिक भागों ∙ प्रत्येक भाग **仅包含一个内容字段**,该字段名称即为其类型, अब उपयोग नहीं किया जाता `kind`判别字段:

- `text`: शुद्ध ग्रंथ सामग्री
- `raw`:文件二进制流(在 JSON 中表现为 Base64), आमतौर पर साथ `filename`和 `mediaType`
- `url`:आदिशतः फाइल सामग्री के लिए लिंक
- `data`: संरचनात्मक JSON डेटा लोड (आधारित एजेंट द्वारा प्रदान की गई संरचनात्मक प्रविष्टि)

उदाहरण:

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

### कलाकृतियाँ (产物)

任务输出是工艺品,而不是松散字符串──工艺品是具名、带类型的结构化产品:

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

कलाकृतियों 支持流式分块传输── प्रत्येक `artifactUpdate`घटनाएं और उत्पाद डेटा`append`和 `lastChunk`标志──

### 三种协议绑定(प्रोटोकॉल बंधन)

1. **JSON-RPC 2.0 over HTTP**(`JSONRPC`):POST उपयोग करने के लिए अनुरोध,SSE उपयोग करने के लिए प्रवाह।`SendMessage``SendStreamingMessage``GetTask``ListTasks``CancelTask``SubscribeToTask``CreateTaskPushNotificationConfig`और...
2. **gRPC**(`GRPC`): जीआरपीसी के उद्यम के आंतरिक वातावरण के लिए उपयुक्त, समान विधि के साथ।
3. **HTTP+JSON/REST**(`HTTP+JSON`): मानक का REST  संसाधन मार्ग, जैसे `POST /message:send`和 `GET /tasks/{id}`

तीन प्रकार के पूर्णतः संगत डेटा मॉडल`supportedInterfaces`条目声明对应的绑定类型与其`protocolVersion`◊ग्राहक 必須在每请求中发送 `A2A-Version: 1.0`अनुरोध शीर्ष, अन्यथा सर्वर हो सकता है इसे पुराने संस्करण 0.3 处理 के रूप में देखा जाएगा.

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

###                                                                                                                                                                                                                                                               

核心设计哲学: 调用 एजेंट की आंतरिक स्थिति अत्यधिक अस्पष्ट है। 调用方 केवल कार्य 状态 और आउटपुट आर्टिफैक्ट देख सकता है। 调用者思维链 (Chain-of-Thought) 内部 उपकरण 调用、子 एजेंट 发发过程对外界一律不可见―― यह MCP के उपकरण 调用 से पूरी तरह से पारदर्शी होना चाहिए।

设计理由:A2A 让相互竞争的公司也能合作,而无需暴露各自的内部实现.A2A  इस ग्राहक एजेंट को调用 कर सकता है, जबकि调用方 इस प्रकार यह नहीं जान पाएगा कि एजेंट इस सेवा को कैसे प्राप्त करता है।

### समय रेखा

- **2025-04-09.**गूगल ने A2A जारी किया है।
- **2025-06-23.**Linux Foundation को दान करें
- **2025-08.** IBM के ACP को अवशोषित करना
- **2025-09.**AP2 扩展(एजेंट भुगतान) जारी किया गया
- **2026-04.**v1.0  जारी किया गया, 150 से अधिक संगठनों का समर्थन प्राप्त किया गया।

### एमसीपी के साथ संबंध

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

जब MCP का उपयोग करने के लिए विशिष्ट उपकरण का उपयोग करने की आवश्यकता होती है; जब A2A का उपयोग करने के लिए एक अन्य बुद्धिमान शरीर को पूरा कार्य सौंपने की आवश्यकता होती है।

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `SendMessage`अनुरोध; कार्य अनुभव `TASK_STATE_WORKING`→ `TASK_STATE_INPUT_REQUIRED`→ `TASK_STATE_WORKING`→ `TASK_STATE_COMPLETED`, अंतिम वापसी पाठ रचनाएँ, शुद्ध मानक को प्राप्त करने के लिए, उपयोग करें内存传输 ताकि सीधे聚焦报文结构──

重点观察:

- एजेंट कार्ड का JSON संरचना
- सर्वर 端 टास्क आईडी 分配与状态转换──
- 通过内容字段自判别的部分 结构──
- 任务执行中途的 `TASK_STATE_INPUT_REQUIRED`分支──
- 终态时返回的艺术品──

## 交付物

本课交付 `outputs/skill-a2a-agent-spec.md`◊ बाहरी रूप से नियोजित नए एजेंट की उम्मीद के लिए, यह मानक एजेंट कार्ड JSON, Skills, Declarations, and Endpoint Connection Design का उत्पादन कर सकता है

## अभ्यास

1. 运行 `code/main.py`◊ पूर्ण कार्य जीवन चक्र का पालन करना, जिसमें नियोजित एजेंट शामिल हैं स्पष्टीकरण के लिए अनुरोध करें`TASK_STATE_INPUT_REQUIRED`暂停──

2.  एक हस्ताक्षरित एजेंट कार्ड जोड़ा `signatures`中放入一条 `alg`设为 `HS256`के JWS 条目, के लिए छोड़ दें `signatures`字段后的卡 规范化 JSON 签名──编写一个验证器,并确认它在被改编的卡上验证失败──

3. उपयोग `SendStreamingMessage`实现任务流式传输: लेखक एजेंट 依次发发 `task`、三 `artifactUpdate`एक टुकड़ा, और एक बट `TASK_STATE_COMPLETED``statusUpdate`, फिर बंद प्रवाह. . .

4. 设计一个封装 MCP Server 的A2A एजेंट――把每个 MCP Tool 映射成一个A2A Skill――记下其中的取舍:失去了哪些不透明性?

5. 阅读A2A v1.0 की घोषणा, पता लगाएं कि 2026 तक कोई भी ढांचा नहीं है।

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
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) इस वर्ग के अनुपालन के नियम तथा प्रोटोबूफ संधि
- [Linux Foundation — A2A launch press release](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) 2025 के जून माह के शासन अधिकार हस्तांतरण
- [Google Cloud — A2A protocol upgrade](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) 路线图 सहकारी सहयोग की प्रगति
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) v1.0  जारी विवरण तथा पश्चात्兼容 निर्देश
