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
    {"text": "总结这篇论文。"},
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
      "parts": [{"text": "总结这篇论文。"}]
    }
  }
}
```

###                                                                                                                                                                                                                                                               

核心设计哲学: 调用 एजेंट की आंतरिक स्थिति अत्यधिक अस्पष्ट है। 调用方 केवल कार्य 状态 और आउटपुट आर्टिफैक्ट देख सकता है। 调用者思维链 (Chain-of-Thought) 内部 उपकरण 调用、子 एजेंट 发发过程对外界一律不可见―― यह MCP के उपकरण 调用 से पूरी तरह से पारदर्शी होना चाहिए।

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
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)  参考实现与SDK
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) इस वर्ग के अनुपालन के नियम तथा प्रोटोबूफ संधि
