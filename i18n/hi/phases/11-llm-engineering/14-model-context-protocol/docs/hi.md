# 模型上下文协议(मॉडल कॉन्टेक्स्ट प्रोटोकॉल, एमसीपी)

> एमसीपी ने एआई होस्ट के लिए एक एकीकृत प्रोटोकॉल प्रदान किया है, जिसका उपयोग गतिशील खोज और调用 उपकरण (Tools) 、 संसाधन (Resources) ٬ सुझाव (Tips) ٬ प्रम्प्ट्स) ٬ 2026-07-28 修订版使该协议完全无化:能力声明与版本上状态下文随着每一个请求独立传递,不再依赖连接绑定的握手──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (函数调用), Phase 11 · 03 (结构化输出)
**Time:** ~75 分钟

## 学习目标

- 明确区分 MCP होस्ट、क्लाइंट、सर्वर、传输层(प्रवाहन) और सर्वर 原语(प्राथमिकताएं)
- 构建携带 MCP 2026-07-28 规范必填元数据的 JSON-RPC अनुरोध
- उपयोग `server/discover`检查版本、身份与能力声明──
-                                                                                                                                                                                                                                                               
- 解释现代无状态 MCP 如何与握手时代的遗产服务器 实现双时代互操作──
- सर्वर की सुरक्षा की स्थिति की सीमाएँ, प्रसारण रणनीति और कृत्रिम स्वीकृति मार्गों को स्थापित करना।

## 问题背景

आपके अनुप्रयोगों को डेटाबेस पूछताछ, दिनचर्या संचालन और फ़ाइल पढ़ने की सुविधाओं की आवश्यकता होती है। यदि एक एकीकृत संचार प्रोटोकॉल नहीं है, तो प्रत्येक एआई होस्ट को अपने स्वयं के खोज, समायोजन, त्रुटि प्रसंस्करण, प्रसारण और पहचान चिपचिपाहट कोड को पूरी तरह से समान क्षमता के लिए लिखने की आवश्यकता होती है।

MCP ने इस विशाल N×M 集成矩阵 को ढँक दिया है। सर्वर  मानक JSON-RPC 接口 का खुलासा करता है; किसी भी अनुपालन के क्लाइंट 均可发现该接口、将其呈现给模型或用户、执行调用并解析结果,无需为具体服务器 定制适配器──

लेकिन एक महत्वपूर्ण सीमा महत्वपूर्ण हैः एमसीपी मानक संचार प्रोटोकॉल के लिए जिम्मेदार है स्वयं। यह यह तय करने के लिए जिम्मेदार नहीं है कि मॉडल को किस उपकरण को तैनात करना चाहिए, अविश्वसनीय सामग्री को स्वचालित रूप से सुरक्षित करने के लिए जिम्मेदार नहीं है, न ही बिना राज्य के अनुरोध को स्वचालित रूप से स्थायी अनुप्रयोग राज्य में परिवर्तित किया जाएगा।

## 核心概念

![MCP Host、无状态请求与 Server 原语](../assets/mcp-architecture.svg)

### 三大 सर्वर 原语

1. **Tools（工具）**:可调用动作── प्रत्येक उपकरण में नाम, विवरण, JSON योजना 输入约束及执行函数 शामिल हैं──
2. **Resources（资源）**: नाम और यूआरआई 寻址 के अनुसार सामग्री, प्रद क्लाइंट 读取。
3. **Prompts（提示模板）**: पुनः प्रयोज्य संरचनात्मक ढाँचा, प्रदाता के लिए

Host 指 AI 宿主应用程序 (उदाहरण के लिए क्लाउड डेस्कटॉप) ◦Host 内的 MCP क्लाइंट 专职与特定服务器 通信──传输层负责在两者之间搬运 JSON-RPC 报文──

### 无状态请求取代传统握手

एमसीपी 2026-07-28  पूर्णतः हटा दिया गया `initialize`和 `notifications/initialized`, ने भी समझौता स्तर के सत्र को हटा दिया। प्रत्येक अनुरोध में`params._meta`इसे पूरा करने के लिए नीचे दिए गए शब्दों का विश्लेषण करेंः

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

协议版本与客户 能力为强制必填项,客户身份为推项──缺失 `_meta`、缺少必填字段或字段类型错误均属于参数形,返回 अमान्य पैरामीटर 错误码(`-32602`)― यदि संस्करण वैध है लेकिन सर्वर 无法支持, वापसी `UnsupportedProtocolVersionError`(`-32022`)― सर्वर किसी भी वैध अनुरोध को पूरी तरह से बिना किसी ऐतिहासिक चर्चा रिकॉर्ड के स्वतंत्र रूप से संभाल सकता है―

无状态绝对不意味着应用无法保持业务状态―― यह केवल इसका मतलब है कि स्थिति अब निम्न स्तर के MCP 连接或 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏 隐藏`Mcp-Session-Id`── यदि काम के प्रवाह को क्रॉस-ड्यूलिंग निरंतरता की आवश्यकता होती है, तो सर्वर द्वारा उत्पन्न अस्पष्ट स्थिति वाक्य हैंडल (Opaque Handle) का उपयोग किया जाता है, ग्राहक द्वारा बाद में उपयोग में इसे सामान्य उपकरण के रूप में उपयोग किया जाता है।

### 服务发现与版本协商

सभी आधुनिक सर्वर 均必须实现 `server/discover`△其返回结果广播支持的协议版本、能力集合与服务器身分:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

ग्राहक भी सीधे व्यावसायिक विधि का उपयोग कर सकता है और संस्करण त्रुटि का प्रबंधन कर सकता है, लेकिन उपयोग पता लगाने में सक्षम बनाता है प्रदर्शन और संस्करण पर चर्चा करने की क्षमता अधिक स्पष्ट पारदर्शिता प्रदान करता है।`-32022`, इसके अतिरिक्त डेटा में सर्वर  समर्थित `supported` संस्करण संख्या तथा अस्वीकृत `requested`संस्करण

स्टूडियो 模式下,双时代(दो युग) ग्राहक उपयोग `server/discover`发起探测──发现成功或收到如 `-32022`等已识别的现代错误,均证明对方为现代服务器;唯有非现代错误或超时才允许回到2025-11-25 के पुराने संस्करण तक`initialize`握手── विरासत 行为仅作为兼容补偿,绝不是现代默认──

### 显式的结果结构

2026-07-28 核心规范 में प्रत्येक सफलता परिणाम सभी ले जाते हैं `resultType`:

- `complete`:表示操作已彻底完成──
- `input_required`: यह दर्शाता है कि सर्वर को कई बार अनुरोध करने की आवश्यकता है।`tools/call``resources/read`या `prompts/get`返回此类型──

ग्राहक  अवश्य  होगा अनुपलब्ध `resultType`                                                                                                                                                                                                                                                              

列表和读取操作的结果也附带 `ttlMs`(毫秒生存时间) और `cacheScope`(缓存范围) ――确定性的 `tools/list`排序加上新鲜度提示,使客户端能够安全缓存服务发现结果,大幅提升模型 शीघ्र缓存的稳定性──`cacheScope: public`允许跨上下文共享缓存,`private` अनुरोध के प्रवर्तन के निजी उपक्रमों पर कड़ाई से प्रतिबंध लगाएं

### 线缆格式与传输层

MCP में स्टूडियो या स्ट्रीमेबल HTTP ऊपर运行 JSON-RPC 2.0:

- अनुरोधः समाहित`jsonrpc``id``method`和 `params`
- 响应(उत्तर): समाहित相匹配的 `id`और `result`या `error`
- 通知( अधिसूचना):无 `id`, किसी भी प्रतिक्रिया की जरूरत नहीं है.

现代 Streamable HTTP 暴露单个只接受 POST 的端点──每一个 JSON-RPC 消息应应一次独立的 POST──请求 POST 接收单个 JSON 对象,或接收以最终响应结尾的请求作用域 SSE 流──接受通知 POST 返回无响应体的 HTTP 202──

2026-07-28 规范中**不存在**独立的 MCP GET 订阅流、DELETE 注销端点、`Mcp-Session-Id`या आधार पर`Last-Event-ID`                                                                                                                                                                                                                                                              `subscriptions/listen`POST अनुरोध, इसका जवाब रखें

```figure
mcp-nxm-collapse
```

## 动手实践

### 步骤 1: पंजीकृत सर्वर 表面

`code/main.py`Python पर आधारित सेवा पंजीकरण और रिपोर्टिंग

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
      "type": "object",
      "properties": {
        "a": {"type": "integer"},
        "b": {"type": "integer"}
      },
      "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

### 步骤 2: प्रत्येक अनुरोध के लिए अतिरिक्त डेटा

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

### 步骤 3:HTTP 镜像头映射

远程调用通过 HTTP POST 发起时,需要镜像指定头部:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

अनुरोध शीर्षक के साथ अनुरोध के साथ असंगत है, तुरंत HTTP 400 के साथ गलत कोड वापस `-32020`

运行测试命令:

```bash
cd phases/11-llm-engineering/14-model-context-protocol
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

## 交付物

本课交付 `outputs/skill-mcp-server-designer.md` यह विशिष्ट व्यावसायिक क्षेत्र को आधुनिक राज्य रहित एमसीपी 规范 के अनुरूप संरचनात्मक कार्यक्रम में परिवर्तित कर सकता है, जिसमें अनुबंधों की खोज, अनुरोधों के आधार पर डेटा, निश्चितता कैश सूची, स्पष्ट स्थिति के लिए संकेतक, प्रक्षेपण और अनुमोदन रणनीति शामिल हैं

## 继续深入 MCP 生产级体系 में

इस कोर्स में आपके लिए एक एकीकृत प्रोटोकॉल मन की स्थापना की गई है। चरण 13 में, निम्नलिखित चार मुख्य चरणों में अधिक सख्त उत्पादन सीमाओं को कवर किया जाएगाः

1. [MCP Tool Contracts 与内容](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md): कड़ाई से प्रवेश योजना, संरचनात्मक सामग्री, मार्ग से डेटा, विभाजन और अनुबंध और व्यापारिक त्रुटियों के बीच अंतर को शामिल करता है।
2. [MCP 可靠性、取消与流控](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md): मांगों को शामिल करना, स्थायी कार्य समाप्त करना, समय सीमा समाप्त करना, और इसी प्रकार, तनाव और पुनः संबंध बनाना।
3. [MCP Registry 供应链、准入、漂移与回滚](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md): समावेशी नामकरण अंतरिक्ष प्रमाणपत्र, उत्पाद विश्वसनीय स्रोत, अपरिवर्तनीय लॉक, वास्तविक समय के लिए प्रस्थान, प्रवेश प्रमाणपत्र और रोट्रॉल रणनीति
4. [MCP 一致性工程](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md): गोल्डन स्टैंडर्ड एवं काउंटरवे टेस्ट प्रयोग के उदाहरण, कठोर संस्करण, एजेंसी नेटवर्क प्रमाण, निष्क्रियता तथा सुरक्षा प्रतिबंध जारी करना शामिल है।

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| MCP | 用于向 AI Host 暴露服务发现、工具、资源、提示模板与扩展的 JSON-RPC 协议 |
| Host | 拥有大模型与用户交互界面、挂载一个或多个 MCP Client 的 AI 应用程序 |
| Client | 代表 Host 与单个具体 Server 执行 MCP 通信的连接器组件 |
| 无状态 MCP (Stateless MCP) | 每个请求携带版本与能力元数据，不存在与底层物理连接绑定的协议状态 |
| `server/discover` | 强制实现的 Server 方法，用于公布支持版本、能力集与身份标识 |
| `resultType` | 区分成功结果状态的鉴别字段（如 `complete` 或 `input_required`） |
| 显式状态句柄 (State handle) | 由 Server 签发、作为普通业务参数传递的应用层唯一标识符 |
| Streamable HTTP | 单一 POST 端点架构，返回常规 JSON 或请求作用域的 SSE 响应 |
| MRTR (多轮请求模式) | 嵌入在响应结果中的输入请求，完成后由客户端重新发起原始操作重试 |

## 延伸阅读

- [MCP 2026-07-28 核心变更](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 服务发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 多轮请求模式 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
