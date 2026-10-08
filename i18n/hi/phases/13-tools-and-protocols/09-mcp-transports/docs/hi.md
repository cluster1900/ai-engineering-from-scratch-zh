# MCP 传输层:studio के साथ बिना स्थिति स्ट्रीम करने योग्य HTTP

> 传输层负责承载MCP 报文, लेकिन यह निश्चित रूप से अनुपलब्ध समझौता स्थिति प्रदान नहीं करता है।`2026-07-28`规范中,本地 स्टूडियो तथा दूरस्थ स्ट्रीम करने योग्य HTTP 均承载完全自描述的独立请求──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 与 08（构建 MCP Server 与 Client）
**Time:** ~65 分钟

## 学习目标

-                                                                                                                                                                                                                                                               
- 实现现代单端点、纯 POST(POST-only) का स्ट्रीम करने योग्य HTTP 传输协议。
- 镜像并校验 MCP 版本号、方法名与名称 अनुरोध शीर्षक JSON-RPC 消息体 के साथ एकरूपता
- सही वितरण अनुरोध के क्षेत्र के लघु चक्र एसएसई और लंबी चक्र के `subscriptions/listen`推送流──
- 迁移基于 Session 和早期 HTTP+SSE के तैनाती,杜绝将 Legacy 行为误当现代规范呈现──

## 问题背景

早期 Streamable HTTP 修订版将协议协商与底层的连接和会议 绑定混为一谈――सर्वर可以发发`Mcp-Session-Id`、 खुलासा स्वतंत्र GET 推送流、 स्वीकार DELETE अनुरोध करने के लिए`Last-Event-ID`恢复 SSE 断点──

एमसीपी `2026-07-28`इन तंत्रों को नेटवर्क लाइनों से पूरी तरह से हटा दिया गया है। किसी भी अनुरोध को किसी भी स्वस्थ वर्कर पर वितरित किया जा सकता है, क्योंकि प्रोटोकॉल संस्करण और क्लाइंट क्षमताएं अनुरोध के शरीर में पूरी तरह से संलग्न हैं। HTTP हेड केवल बाहरी वेब कनेक्शन मार्ग और रणनीति नियंत्रण के लिए उपयोग किए जाने वाले इमेज निर्दिष्ट字段 के लिए है, लेकिन निष्पादन से पहले सर्वर को हेड और अनुरोध के शरीर के लिए सख्ती से काम करना चाहिए।

इस प्रकार निर्मित प्रणाली में अधिक मजबूत क्षैतिज विस्तार क्षमता और अधिक स्पष्ट प्रसंस्करण क्षमता है। इसका मतलब यह भी है कि यदि 2025 के ट्रांसमिशन स्तर को वर्तमान मानक के रूप में प्रस्तुत किया जाता है, तो त्रुटि और सुरक्षा मॉडल को स्थापित किया जाएगा।

## 核心概念

### स्टूडियो 模式

stdio 绑定专用于客户端 启动的本地子进程:

- ग्राहक प्रत्येक पंक्ति के लिए स्टीडिन 写入一条 UTF-8 编码的 JSON-RPC 消息──
- सर्वर प्रत्येक पंक्ति स्टडआउट 写入一条 UTF-8 编码的 JSON-RPC 消息──
- सर्वर सभी परीक्षणों की जानकारी को स्ट्रेट में लिखने की दिशा में ले जाएगा।
- जब आप EOF प्राप्त करते हैं, सर्वर को जल्दी से बाहर निकलना होगा।
- प्रत्येक आधुनिक अनुरोध में`params._meta`मध्यporte संस्करण और क्षमता

进程生命周期 भौतिक संचरण जीवन चक्र का हिस्सा है, यह आधुनिक प्रोटोकॉल सत्र नहीं है  यदि कोई प्रक्रिया अचानक से बाहर हो जाती है, तो विराम का अनुरोध भी खो जाता है  सही अभ्यास प्रक्रिया को पुनः आरंभ करना है  पुनः खोज करना है  पुनः सूचीबद्ध करना है  पुनः सदस्यता लेना,  केवल सुरक्षा ऑपरेशन के लिए नई अनुरोध आईडी का उपयोग करना है  पुनः प्रयास करना है

### 2026-07-28 मध्य का स्ट्रीम करने योग्य HTTP

现代 सर्वर 暴露一个单一的 MCP 端点(如 `/mcp`), और केवल POST अनुरोध स्वीकार करें

प्रत्येक JSON-RPC अनुरोध या सूचना,都 एक पूर्ण नया HTTP POST है। अनुरोध में एक JSON-RPC 报文 शामिल है। क्लाइंट 绝不会向服务器 发送 JSON-RPC 响应。

对于收到的请求,Server 返回以下之一:

- `Content-Type: application/json`: एकल JSON-RPC 响应 पर वापस लौटें;
- `Content-Type: text/event-stream`: इस अनुरोध से संबंधित सूचना घटनाओं पर लौटें, अंतिम के साथ अंतिम JSON-RPC प्रतिक्रिया।

 प्राप्त सूचना के लिए, सर्वर  प्रतिक्रियाहीन लौटा `202 Accepted`

ग्राहक ने अनुरोध में एक साथ दो प्रकार के उत्तरों का समर्थन कियाः

```http
Accept: application/json, text/event-stream
```

### 纯 POST(POST-only) के रेल

现代 Streamable HTTP 不存在独立的 GET 推送端点,也没有 DELETE Session 端点:

- `GET /mcp`प्रत्यक्ष वापसी `405 Method Not Allowed`
- `DELETE /mcp`प्रत्यक्ष वापसी `405 Method Not Allowed`
- `Mcp-Session-Id`直接被忽视,绝不生成,绝不回显――
- `Last-Event-ID`直接被忽视,因为现代流不支持断点重放续传.

यदि अनुरोध के दायरे की SSE 流在收到最终响应前中断,Client 视该次在途请求已丢失.

### 源站校验(उत्पत्ति सत्यापन)

सर्वर में प्राप्त करने के लिए संचरण कनेक्शन समय परीक्षण`Origin`अनुरोध शीर्षक को DNS के खिलाफ पुनः बांधे गए हमले के लिए अनुरोध करें`403 Forbidden`──非浏览器 ग्राहक `Origin`, आधिकारिक संचरण विनियम इस पर अनुमति दी गई है।

本地开发 सर्वर 应绑定到 `127.0.0.1`नहीं `0.0.0.0`网络服务必须在每一个请求上执行认证和授权; मूल 校验绝不能替代身份认证

### अनिवार्य HTTP डेटा अनुरोध

प्रत्येक आधुनिक पोस्ट में निम्नलिखित शामिल हैंः

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

规则要求:

- `MCP-Protocol-Version`必須与 `params._meta.io.modelcontextprotocol/protocolVersion`完全一致──
- `Mcp-Method`जिसॉन-आरपीसी के साथ होना चाहिए `method`完全一致──
- `Mcp-Name``tools/call``resources/read`和 `prompts/get`时强制必填──
- `Mcp-Name`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `params.name`(या `resources/read`时的 `params.uri`)。
- अनुरोध शीर्षक के मूल्य विभाजन

对于包含非ASCII या विशेष वर्ण `Mcp-Name`, मानक का उपयोग Base64 哨兵 प्रारूपः

```text
=?base64?{Base64EncodedValue}?=
```

 किसी भी अनुपस्थिति रूप या अनुरोध के साथ असंगत दर्पण, तुरंत HTTP पर वापस `400`गलत कोड के साथ`-32020` यदि संस्करण सहमत है लेकिन सर्वर इस संस्करण का समर्थन नहीं करता है, HTTP पर वापस `400`गलत कोड के साथ`-32022`

### अनुरोध रोल डोमेन के लघु चक्र एसएसई

सर्वर समय की अधिक अवधि के लिए SSE का उपयोग कर सकता हैः

```text
POST tools/call id=41
  <- notifications/progress (针对 id=41)
  <- notifications/progress (针对 id=41)
  <- JSON-RPC response (id=41)
流关闭
```

सर्वर 绝不能在这个流中主动向客户端发发起独立的 JSON-RPC请求――关闭响应流即代表取消这个请求――

### 长周期变更推送:`subscriptions/listen`

变更 सूचनाएं ग्राहक द्वारा आवश्यक हैं 主动发起的专用 POST अनुरोध खुलाः

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

POST 响应是一个长连接 SSE 流──其首条协议消息为 `notifications/subscriptions/acknowledged`                                                                                                                                                                                                                                                              `_meta`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `io.modelcontextprotocol/subscriptionId`, और मूल्य इस निगरानी अनुरोध की पहचान के बराबर है.`subscriptions/listen`और पुनः प्राप्त किया जा सकता है बदल गया डेटा।

### 显然应用层状态

移除协议 सत्र 绝对不意味着禁止有状态的工作流── सर्वर एक अस्पष्ट स्थिति वाक्य柄 (State Handle) उत्पन्न कर सकता है और सामान्य उपकरण 结果中返回它── क्लाइंट बाद में调用中将该句柄作为显式参数传入──

इस प्रकार की स्थिति स्पष्ट रूप से अनुप्रयोग स्तर पर प्रस्तुत होती है, न कि नेटवर्क संचरण स्तर में छिपे हुए वार्तालापों की प्रासंगिकता के बीच।

```figure
tp-transport-handshake
```

## 动手实践

`code/main.py`仅使用Python 标准库实现一个小巧、合规的现代 Streamable HTTP Server:

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

探针会依次检验:

- 非法起源会被拒绝;
- 服务发现在没有会议ID的情况下顺利完成;
- 传入的 `Mcp-Session-Id``Last-Event-ID`चुपचाप अनदेखा किया गया;
- 头部与请求体不一致时返回 `-32020`.
- 版本不支持时返回 `-32022` और इसके समर्थित संस्करण सूची;
-  प्राप्तकर्ता का बिना आईडी  सूचना HTTP पर वापस `202`वायु प्रतिक्रिया;
- GET 和 DELETE अनुरोध सीधे HTTP पर वापस `405`.
- `subscriptions/listen`长连接建立并带在通知中对应的订阅 ID──

## 交付物

本课交付 `outputs/skill-mcp-transport-migrator.md`यह अनुबंध सत्रों के समय से अधिक के लिए नियमन मार्गदर्शन प्रदान करता है।`subscriptions/listen`替代裸 GET 流,并使 Legacy 适配层保持清晰独立──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| stdio | 基于 Client 发起的子进程 stdin/stdout、以换行符分隔的 JSON-RPC 传输 |
| Streamable HTTP | 单一端点架构，其中每条现代消息均为一次全新的 HTTP POST 调用 |
| 请求作用域 SSE (Request-scoped SSE) | 针对单个请求的 POST 响应流，输出相关通知及最终响应后自动关闭 |
| `subscriptions/listen` | 客户端主动开启的长周期 POST 请求，用于接收选择订阅的变更通知 |
| 请求头不匹配 (Header mismatch) | 当镜像请求头与请求体内容不一致时，返回 HTTP 400 与 -32020 报错 |
| 源站校验 (Origin validation) | 针对传入网络连接的 DNS 重绑定防御机制，不能替代身份认证 |
| 显式状态句柄 (Explicit state handle) | 作为普通业务参数传递的应用层 Token，代替底层隐藏的传输连接状态 |
| Legacy 桥接层 (Legacy bridge) | 专门隔离保留的旧版本行为，仅用于向后兼容历史客户端 |

## 延伸阅读

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
