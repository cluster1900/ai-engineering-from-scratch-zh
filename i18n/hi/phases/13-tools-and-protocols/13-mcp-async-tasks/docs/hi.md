# एमसीपी कार्य  विस्तार: बिना राज्य के केंद्र पर निर्मित स्थायीकरण कार्य

> 无状态 MCP का अर्थ यह नहीं है कि प्रत्येक ऑपरेशन को एक एकल अनुरोध में पूरा किया जाना चाहिए। 官方 Tasks  विस्तारित जीवन चक्र के लिए काम स्पष्ट रूप से स्थायी हो गया है।`tools/call`इस वाक्य को वापस करें, किसी भी उदाहरण का जवाब दिया जा सकता है।`tasks/get`, और ग्राहक के इनपुट के माध्यम से `tasks/update`送达, 无需复活任何协议会话──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## 学习目标

- प्रविष्टता के साथ अनुबंध संचरण स्तर के बीच कठोर अंतर 
- प्रति अनुरोध क्षमताओं के साथ`server/discover`中协商 `io.modelcontextprotocol/tasks`विस्तार
-  केवल निर्माण के बाद ही, सर्वर द्वारा निर्देशित और साथ में वापस `resultType: "task"``CreateTaskResult`
- उपयोग `tasks/get`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `tasks/update`提交任务输入,并使用 `tasks/cancel`发起协作式取消──
- 彻底弃旧版中关于 `tasks/status``tasks/result`和 `tasks/list`का पुराना परिकल्पना
- 通过 POST 响应的 SSE 流使用 `subscriptions/listen`订阅可选的任务变更通知──
- सही ढंग से निर्माण कार्य अवधि तंत्र  पुनर्प्रारंभ पुनः प्राप्ति तर्क 输入 कुंजी 去重以及执行错语义──

## क्यों कार्य एक विस्तार है

कार्य प्रारंभ में प्रयोगात्मक मूल विशेषता के रूप में दिखाई दिए हैं 2025-11-25 规范中.`io.modelcontextprotocol/tasks` विस्तार में, इस प्रकार ग्राहक और सर्वर को स्वतंत्र रूप से चुनने की अनुमति मिलती है कि क्या अतिरिक्त कार्य जीवन चक्र में प्रवेश करना है, और सभी परिदृश्यों के लिए विस्तार की आवश्यकता नहीं है MCP 核心协议

यद्यपि यह विस्तार विनियमन वर्तमान में कार्य का आधिकारिक वर्गीकरण है, लेकिन यह अभी भी मसौदा में है।

यदि किसी ऑपरेशन में निम्नलिखित लक्षणों में से एक या अधिक हैं, तो कृपया कार्य का उपयोग करेंः

- 执行耗时可能超越普通的请求超时值──
- 已由工作队列 (कर्मियों की कतार) या बाहरी作业系统接管执行──
- ग्राहक को अपने स्वयं के पुनः आरंभ के बाद पुनः प्राप्ति की क्षमता रखने की आवश्यकता है।
- 操作在执行过程中需要暂停等待用户或模型提供进一步输入──
- 支持取消操作与持久化结果检索是明确的产品功能需求──

️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 无状态核心,有状态应用

MCP 2026-07-28 移除了 `initialize``notifications/initialized`、 समझौता सभा तथा `Mcp-Session-Id` यह निश्चित रूप से निर्मित उत्पाद कार्यों को नहीं छोड़ता

कार्य आईडी  स्पष्ट अनुप्रयोग स्थिति में आता हैः

- सर्वर में लौटा कार्य आईडी  से पहले यह स्थायीकृत होना चाहिए।
- ग्राहक 能够持久存储该ID, और फिर से आरंभ करने के बाद पुनः轮询
- इस आईडी को उसी स्थाई भंडारण शाखा के किसी भी सर्वर से रूट किया जा सकता है।
- प्रत्येक अनुशंसित कार्य के लिए विधि के संबंध में पुनः प्रयोग करना अनिवार्य है।
- 过期与清理 字段定义的任务,而不是传输层连接的生命周期决定的.

यह कनेक्टिविटी के अतिरिक्त छिपे हुए राज्य के साथ एक वास्तविक अंतर है।

निम्नलिखित चार जीवन चक्रों को स्पष्ट रूप से विघटित किया जाएगाः

| 状态类别 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，在每次调用中重新校验 |
| 传输层任务 | 单个 stdio 请求或 HTTP 响应 | 具有有界超时期限的正在进行的协调器（in-flight coordinator） |
| MRTR 交互延续 | 单次重试序列 | 受完整性保护的 `requestState`，必要时叠加防重放控制 |
| 持久化任务 | 跨越请求、副本、重启与重连 | 以受权的 `taskId` 为键的共享应用程序存储 |

कार्य को रिकॉर्ड करना एक प्रक्रिया के मेमोरी में बस बनाए रखना MCP को स्टेटस प्रोटोकॉल में नहीं बदल सकता है, केवल एप्लिकेशन को अत्यधिक अविश्वसनीय बनाता है। प्रोटोकॉल स्वयं अभी भी स्टेटस रहित है, लेकिन यदि बाद में होता है।`tasks/get`किसी अन्य प्रति में रूट किया गया है, यह रिकॉर्ड पुनर्प्राप्त नहीं किया जा सकता है।

## क्षमता 协商

ग्राहक में प्रत्येक उपयुक्त अनुरोध पर बयान विस्तार समर्थनः

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

सर्वर से `server/discover`中返回准确的 `supportedVersions`、 क्षमताएँ`ttlMs`和 `cacheScope`, और क्षमताओं को बढ़ाया गया है।`tools/list`该结果返回确定性 `generate_report`描述符、合法的 वस्तु 类型 `inputSchema``resultType: "complete"`、सर्वर की पहचान और सार्वजनिक 缓存提示──

यदि ग्राहक ने विस्तार की घोषणा नहीं की है, लेकिन कार्य विधि का उपयोग किया है, सर्वर वापस आ जाएगा`-32021`(मिस्टिंग आवश्यक ग्राहक क्षमता),并将 `data.requiredCapabilities`设为 `{"extensions":{"io.modelcontextprotocol/tasks":{}}}` समर्थित नहीं है `-32022`और निश्चित नहीं है`supported``requested`डाटा; अनुपलब्ध या गैर-字符串 के संस्करण वापस `-32602`

没有 JSON-RPC `id`                                                                                                                                                                                                                                                              `202 Accepted`

वर्तमान में, केवल वहाँ है`tools/call`支持以任务形式增强执行── कृपया उचित रूप से आंतरिक सार को डिज़ाइन करें, ताकि भविष्य की अनुरोध प्रकार को भंडारण परत पर पुनः लिखने की आवश्यकता न हो──

## सर्वर 主导的任务创建

旧版的客户端标志 `params._meta.task.required`已完全移除──现在的机制是:客户端 声明支持此扩展,随后由服务器自行决定某具体的 `tools/call`क्या यह कार्य में परिवर्तित हो गया है?

अनुरोधः

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

响应:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

जब तक मैं इसे प्राप्त कर चुका हूँ`tasks/get`解析读取之前, सर्वर 绝不能提前返回这个句柄──最终一致性存储系统 में, उसे इसके लिए पठनीयता (可读可见性) 读可见性 (可见性) 读可见性 (可读可见性)  पढ़ने के बाद पुनः प्रतिक्रिया करने की प्रतीक्षा करनी होगी── अन्यथा ग्राहक  एक ऐसा दिखने वाला वैध आईडी  प्राप्त कर लेता है  फिर तुरंत 未找到 के त्रुटि  का सामना करेगा──

कार्य प्रतिक्रिया में अप्रतीक्षित अनुरोध अप्रतीक्षित अनुरोध  की विशेषता है, अर्थात् ग्राहक को कार्य मोड में प्रवेश करने की कोई स्पष्ट आवश्यकता नहीं है; लेकिन यह निश्चित रूप से अविचारित वार्ता के अवसर में नहीं है।

## कार्य वस्तु संरचना

प्रत्येक कार्य में निम्नलिखित तत्व शामिल होते हैंः

- `taskId`: सर्वर द्वारा उत्पन्न स्थिर पहचानकर्ता;
- `status`:取值为 `working``input_required``completed``cancelled`या `failed`.
- `createdAt``lastUpdatedAt`:ISO 8601 时间;
- `ttlMs`: स्थापना के बाद से काल अवधि (mm), या`null`प्रदर्शित नहीं करता है;
-              `pollIntervalMs`:सर्वर के दौरान न्यूनतम सुझावों का पूछताछ अंतर;
-              `statusMessage`: user or model के ऊपर नीचे वर्णनात्मक

特定状态专用字段 केवल संबंधित समय में ही दिखाई देता हैः

- `input_required`包含 `inputRequests`
- `completed`包含原始请求的 `result` संरचना
- `failed`包含 JSON-RPC 的 `error`वस्तुओं को

ग्राहक                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `pollIntervalMs` सर्वर अत्यधिक सक्रिय रेंज के लिए सीमा प्रवाह का उपयोग कर सकता है, और  जीवन चक्र में गतिशीलता को समायोजित कर सकता है  समय के अंतराल में 

## उपयोग कार्य/ प्राप्त करें  राउंडइंग करें

ग्राहक अनुरोध वर्तमान का त्वरित तस्वीरेंः

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

`tasks/get`इस RPC के अनुकूलन को स्वयं सफलतापूर्वक पूरा कर लिया गया है, इसलिए इसके सबसे बाहरी स्तर की प्रतिक्रिया हमेशा शामिल है।`resultType: "complete"` और आंतरिक रूप से कार्यरत व्यक्ति`status` अभी भी हो सकता है `working`या `input_required`

इस प्रकार की अंतरण प्रभावी रूप से सामान्य हल बग से बचने में सक्षम हैः

```text
result.resultType = complete    表示 tasks/get RPC 本次调用完成
result.status = working        表示其代表的后台作业仍在运行中
```

当前规范中不存在 `tasks/result`方法──当任务 完成时,下一次 `tasks/get`响应会直接在 `result`字段内嵌原始的 `CallToolResult`:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

बाहरी स्तर की `resultType` प्रदर्शित`tasks/get`RPC 顺利执行;内层的 `result.resultType`मूल उपकरण को प्रदर्शित करें 调用已执行完成── इस आंतरिक स्तर के निदानकर्ता को अनिवार्य रूप से आवश्यक── आंतरिक स्तर का `CallToolResult`इसी प्रकार स्वयं को भी ले जाना चाहिए।`io.modelcontextprotocol/serverInfo`; इस वर्ग को पूर्ण रूप से रखा जाएगा और इसे बिना प्रकार के सामान्य भार के लिए संग्रहीत नहीं किया जाएगा।

当前规范中不存在 `tasks/list`◊ बिना वार्ता के सर्वर  सुरक्षित रूप से यह अनुमान नहीं लगा सकता कि कौन से कार्य किसी कनेक्टिविटी डोमेन की सूची में दिखाई देने चाहिए ◊ आवश्यक ऐतिहासिक रिकॉर्ड के अनुप्रयोग को स्पष्ट रूप से स्वामित्व नियमों के साथ ◊ अधिकृत व्यावसायिक डोमेन उपकरण का खुलासा करना चाहिए ◊

## 任务执行期间的输入交互

कार्य  आंतरिक इनपुट कोर एमआरटीआर के समान दिखता है, लेकिन विभिन्न प्रक्रियाओं का विस्तार तंत्र को अपनाता है।

### 任务创建前所需的输入

मूल से `tools/call`中返回核心 `resultType: "input_required"`◊ ग्राहक                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

### 任务 निर्माण के बाद आवश्यक इनपुट

 टास्क  स्टेटस सेट `input_required`                                                                                                                                                                                                                                                              `tasks/get`暴露未决 `inputRequests`, ग्राहक द्वारा  `tasks/update`提交响应──ग्राहक **不需要**重试原始的 `tools/call`

快照:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

更新:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

सफलता प्रतिक्रिया एक रिक्त पुष्टि है जोड़ा `resultType: "complete"` क्योंकि स्थिति में बदलाव संभव है, ग्राहक को पूछताछ या सुनने का प्रयास करना चाहिए

प्रत्येक `inputRequests`जीवन चक्र में एक ही कार्य होना चाहिए।`tasks/get`快照可能会显示相同的未决密钥;客户端应在 UI 层面上进行重复, जबकि सर्वर 应忽略针对未知已覆盖或已执行的密钥的响应──部分字段的更新可能会让任务保持在`input_required` राज्य, जब तक सभी आवश्यक कुंजी                                                                                                                                                                                                                                                          

## 取消操作属于协作式取消

`tasks/cancel`इस पुष्टि से यह सुनिश्चित नहीं होता है कि पिछली मंजिल के कामगार को तुरंत रोक दिया गया हो। काम पहले से ही एक कदम पूरा हो सकता है, या बाद में समाप्त होने के बाद ही स्थिति में बदलाव हो सकता है।

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

 इन तीनों कार्य  तरीकों के लिए,`Mcp-Name`अनुरोध                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `params.taskId`, बजाय重复 JSON-RPC 方法名──`code/main.py``make_http_request`इस नियम को मध्य统一收了.

इस वर्ग के उदाहरण में कार्यरत व्यक्ति को तत्काल प्रतिक्रिया से हटा दिया जाएगा, जिससे उत्पादन के वातावरण में ग्राहक को पुनः पुनः तैनात किया जा सकेगा।

मत प्रयोग `notifications/cancelled`取消任务──该通知属于请求级别的取消 (अनुरोध रद्द करना),而非持久化任务的取消──

इस प्रकार की अंतरण मार्ग से सीमा तक महत्वपूर्ण है। अनुरोध रद्द करने का उद्देश्य किसी एकल JSON-RPC ऑपरेशन या उसके अनुरोध के दायरे के HTTP प्रतिक्रिया को निष्पादित करना है।`tools/call`已回归 `resultType: "task"`, यह बताएं कि अनुरोध समाप्त हो चुका है, इसके प्रसारण मार्गों को बंद करना या तो निर्दिष्ट नहीं किया जा सकता है और न ही स्थायीकरण कार्य को समाप्त किया जा सकता है।`tasks/cancel`यह एक नया पूर्णतः अधिकृत RPC है।`params.taskId`, में `Mcp-Name`इस आईडी को, इस कार्य के बाद के अंत तक पहुंचने के लिए, रिकॉर्ड सहयोग के रूप में समाप्त करने के लिए, और प्रतिक्रिया की पुष्टि करने के लिए वापस लौटने के लिए, यह दावा नहीं किया है कि कार्यकर्ता 停止──

इसलिए, वेब关 को अनुरोध समन्वयक (अनुरोध समन्वयक) और कार्य पथ से अलग अलग अलग डेटा तालिका में रखा जाना चाहिए।[第 29 课：MCP 可靠性、取消与流控](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)इस दो मार्गों के प्रतिस्पर्धा, ओवरटाइम, आदि के नियमों के निर्माण में गहराई से शामिल होगा।

## चयनित सूचना प्रदत्त

轮询是基准方案──期望推送更新客户可发送带有任务 id 列表的 `subscriptions/listen`在 Streamable HTTP 下, यह एक POST अनुरोध है, इसका जवाब एक अनुरोध के दायरे में SSE 流── कोई स्वतंत्र GET 事件流 नहीं है, न ही कोई आवश्यकता है को बनाए रखने के लिए समझौता बैठक──

सर्वर के माध्यम से`notifications/subscriptions/acknowledged`确认接受的 id 列表, फिर पारित किया जा सकता है `notifications/tasks`发送完整的快照──确认通知与每一个任务 通知都在 `_meta`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `io.modelcontextprotocol/subscriptionId`(其值等于 `subscriptions/listen`                                                                                                                                                                                                                                                              `tasks/get`लौट लौट के लौट के लौट के लौट के लौट के लौट के लौट के लौट आया।

ग्राहक को अभी भी घोषणा करनी होगी कार्य विस्तार करना चाहिए। उन्हें स्थायी कार्य आईडी पर आधारित होना चाहिए, पुनः कनेक्ट और पुनर्स्थापित करना चाहिए, न कि घटनाओं पर निर्भर होना चाहिए।`Last-Event-ID`

## 失败语义

दो स्तरों की गलतियों को सही ढंग से अलग करेंः

### 协议错误

无效的方法参数或未知任务 id 返回 JSON-RPC 错误, आमतौर पर `-32602`                                                                                                                                                                                                                                                              `-32021`डेटा में वस्तुओं के लिए आवश्यक क्षमताएं शामिल नहीं हैं।

### 任务执行结果

- 带有 `isError: true`结果仍然属于 `completed`任务, चूंकि उपकरण 调用 ने अपनी परिभाषित परिणाम संरचना से उत्पन्न हो चुका है
- देरी से निष्पादन के दौरान उत्पन्न JSON-RPC  प्रोटोकॉल स्तर की त्रुटि कार्य में प्रवेश करने के लिए अनुमति देता है `failed` स्थिति, और `error`字段下记录该 JSON-RPC 错误──
- उपयोगकर्ता अस्वीकार कर सकता है उत्पन्न `cancelled`、 किसी अन्य क्षेत्र के विशिष्ट सुरक्षा उत्पाद के लिए एक अस्वीकृति का परिणाम या परिणाम घोषित किया गया है।

## 持久化、过期与所有权

 न्यूनतम स्थाई भंडारण कार्य id, status, time ,ttl, rounding intervals, original operation ownership, result or error, अनिश्चित प्रविष्टि अनुरोध तथा सभी जारी किए गए प्रविष्टि कुंजी

 भंडारण कुंजी को शामिल करना चाहिए या अधिकार प्राप्त किरायेदार और मालिक से हल कर सकता है  केवल कार्य आईडी को जानने  यह कभी भी अधिकृत उपयोग के प्रमाण पत्र का गठन नहीं कर सकता`tasks/get``tasks/update``tasks/cancel`及订阅调用中都必须核验所有权──

`ttlMs`यह निर्माण के समय से ही प्रभावी समय है, और गतिशील समायोजन हो सकता है। जब कोई कार्य दिखाई देने से रोकता है, तो ग्राहक इसे एक अंतर्निहित सुपरटाइम आधार के रूप में मान सकता है। सर्वर समाप्ति के समय से पहले के कार्य मार्कर को विफल कर सकता है और बाद में भौतिक सफाई कर सकता है।

原子写入或事务机制──本课先写入临时文件再执行原子重命名──跨多副本的服务应使用共享的持久化储存,并配合工人租) 租) 等价的并发控制机制──

```figure
tp-task-lifecycle
```

## हस्तलिखित

`code/main.py`实现一个确定性的任务服务:

- `server/discover` लौटें `supportedVersions`、缓存提示与任务 扩展──
- `tools/list` लौटने की निश्चितता `generate_report`描述符,附带合法输入方案──
- `tools/call`में लौटने के लिए `resultType: "task"`之前完成任务的创建与持久化──
- एक पूर्ण नया सेवा उदाहरण उसी कार्य को पुनः लोड करने में सक्षम है।
- `tasks/get`返回完整的任务快照──
- श्रमिक से`working` स्टेटस 流转至 `input_required`
- `tasks/update`收表单响应并返回空的完整确认──
- श्रमिक  भंडार内嵌的 `CallToolResult`(स्वयं समाहित `resultType`सर्वर के साथ), उसके बाद स्थिति में बदलाव`completed`
- 本实现中 `tasks/cancel`具備等性──
- HTTP निर्माता `tasks/get``tasks/update`和 `tasks/cancel``Mcp-Name`头统一设置为 `params.taskId`
- 通知助手函数使用 `notifications/subscriptions/acknowledged``notifications/tasks`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,
- 无 id 的通知不产生任何 JSON-RPC 响应──

कार्यकर्ता  स्पष्ट रूप से आगे की स्थिति को अपनाता है बजाय पीछे की लाइन में सोता है। यह प्रत्येक स्थिति के प्रवाह को निश्चितता देता है, और प्रोटोकॉल उदाहरण और संदेश पंक्ति तंत्र को स्पष्ट रूप से अलग करता है।

## उपयोग और संचालन

भंडारणमूल सूची में संचालित:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

预期 परिणाम序列:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

समकालीन सेवा में प्रयोग`tasks/status``tasks/result`和 `tasks/list`会返回方法未找到 (方法-未找到) त्रुटि──
验证 `tools/list`具有确定性,且当前所有HTTP任务 方法均通过 `Mcp-Name`镜像其任务 id---

## 交付产物

`outputs/skill-task-store-designer.md`现已提供适应扩展的设计:包括能力 协商、返回前必须持久化 (कार्यशील-पूर्व-返回) 现代方法集、输入更新流、所有权隔离、过期管理、取消处理、订阅机制以及废弃实验性方法 से平稳迁移方案──

## 课后练习

1. 增加第二未决输入钥──发送包含部分字段的 `tasks/update`, दो प्रमुख प्रश्नों के उत्तर के पूरा होने तक, कार्य अभी भी जारी है`input_required`状态──
2. भण्डारण के लिए किरायेदार के स्वामित्व की शुरुआत, जब गलत पहचान किए गए अधिकार धारक ने कानूनी कार्य आईडी का प्रदर्शन किया तो सीधे अस्वीकार कर दिया गया।
3. 引入带过期时间的工人租约――证明两个服务实例不能并发完成同一个任务――
4. `subscriptions/listen`实现 POST 响应的 SSE 适配器──切勿引入 GET 端点、`Last-Event-ID`या सत्र अनुरोध अनुरोध शीर्षक
5. 增加过期清理逻辑── ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒      ⇒                                                                                      

## 关键术语

| 术语 | 当前扩展中的含义 |
|------|----------------------------------|
| Tasks 扩展 | 用于持久化异步工作的可选 `io.modelcontextprotocol/tasks` capability |
| `CreateTaskResult` | 对符合条件请求返回的、由 server 主导的 `resultType: "task"` 响应 |
| `tasks/get` | 轮询完整的当前任务快照，包含终态结果或未决输入 |
| `tasks/update` | 针对任务当前未决的 `inputRequests` 提交响应 |
| `tasks/cancel` | 确认接收到协作式取消的意图 |
| `input_required` | 表示任务正在等待 client 提供输入的任务状态 |
| `pollIntervalMs` | Server 建议的下次轮询前的最小等待时长 |
| `ttlMs` | 自任务创建起计算的有效时长 |
| 返回前持久化（Durable-before-return） | 必须在 task id 具备可解析可读性之后才能发出其句柄的规则 |
| `notifications/tasks` | 在已订阅的 SSE 响应流上投递的可选完整任务快照 |

## 旧版兼容性

2025-11-25  प्रयोगात्मक योजनाओं ने ग्राहक अनुरोधों को बढ़ाया`tasks/status``tasks/result`और विकल्प `tasks/list`कृपया केवल संस्करण लॉक में विरासत 适配器中保留这些名称──现代客户端 应声明扩展能力,接收服务器 主导下发的句柄,轮询 `tasks/get`, के माध्यम से `tasks/update`提交输入,并从任务快照中读取最终结果──

## 延伸阅读

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
