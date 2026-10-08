# OpenTelemetry GenAI  端到端 ट्रैकिंग टूल कॉल

> एक एजेंट ने पांच उपकरण 调调用了五个工具、三个 MCP सर्वर 和两个子代理──你需要一个贯穿所有环节的痕迹──OpenTelemetry GenAI语义公约(v1.37 及以上版本中的稳定属性) 2026 के मानक हैं,并由 Datadog、Langfuse、Arize Phoenix、OpenLLMetry 和 AgentOps 原生支持──本课会列必需属性,讲解跨度层次序列(agent → LLM → tool),并提供一个 stdlib emitter,你可以将它连接到任何 OTel निर्यातक──

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## 学习目标
- LLM अवधि एवं उपकरण-कार्यक्षमता अवधि की आवश्यकता OTel GenAI गुणों को बताएं
- 构建覆盖 एजेंट लूप、LLM कॉल、टूल कॉल 和 MCP क्लाइंट डिस्पैच की ट्रैक पदानुक्रम──
- निर्णय लेना कि किस सामग्री को पकड़ा जाना है और किस सामग्री को संपादित करना है।
-                                                                                                                                                                                                                                                               

## 问题
एक 2026 साल के फरवरी के डिबग  केस: उपयोगकर्ता रिपोर्ट मेरा एजेंट  समय में 30 सेकंड का समय लगता है; अन्य समय में केवल 3 सेकंड  कोई निशान नहीं  लॉग  LLM कॉल दिखाता है, लेकिन उपकरण भेजने  MCP सर्वर राउंड-ट्रिप नहीं दिखाता है, न ही उप-एजेंट  आप केवल अनुमान लगा सकते हैं 

 बिना अंत से अंत तक पता लगाने, आप इस समस्या को निर्धारित नहीं कर सकते हैं. 

इन सम्मेलनों ने 2025-2026 में OpenTelemetry सेमॅटिक-कन्वेंशन समूह 定型── द्वारा स्थिर विशेषता नामों को परिभाषित किया, इसलिए Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps  समान अवधि को हल कर सकते हैं── केवल उपकरण की आवश्यकता है ;即可发送到任意后端──

## 概念
### स्पैन पदानुक्रम

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

整个流程嵌套在同一个追踪ID下――Span ids 连接父母-孩子关系──

### आवश्यक विशेषताएं

2025-2026 के लिए सेमकोनव के अनुसारः

- `gen_ai.operation.name` `"chat"``"text_completion"``"embeddings"``"execute_tool"``"invoke_agent"`
- `gen_ai.provider.name` `"openai"``"anthropic"``"google"``"azure_openai"`
- `gen_ai.request.model` अनुरोध के मॉडल स्ट्रिंग(उदाहरण के लिए `"gpt-4o-2024-08-06"`)。
- `gen_ai.response.model` 实际提供服务的模型──
- `gen_ai.usage.input_tokens`/`gen_ai.usage.output_tokens`
- `gen_ai.response.id` उपयोग में关联 के प्रदाता प्रतिक्रिया आईडी

️ उपकरण की अवधि के लिएः

- `gen_ai.tool.name` उपकरण पहचानकर्ता。
- `gen_ai.tool.call.id` 具体 कॉल आईडी──
- `gen_ai.tool.description` उपकरण विवरण(可选)。

对于代理 अवधि:

- `gen_ai.agent.name`/`gen_ai.agent.id`/`gen_ai.agent.description`

### स्पैन प्रकार

- `SpanKind.CLIENT`प्रयोग करने के लिए क्रॉस प्रक्रिया सीमाओं का调用 (LLM प्रदाता, MCP सर्वर)
- `SpanKind.INTERNAL`एजेंट के लिए उपयोग करें स्वयं के लूप चरणों और उपकरण निष्पादन

### ऑप्ट-इन सामग्री कैप्चर

默认情况下,spans 携带计量和时间, बजाय प्रम्प्ट्स या पूर्णताओं  बड़े उपयोगिता लोड 和 PII 默认关闭──设置 `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`तथा विशिष्ट सामग्री-व्यापक वातावरण में सामग्री शामिल है।

### स्पैन पर घटनाएं

टोकन स्तर की घटनाओं के रूप में अवधि घटनाओं हो सकता है 添加:

- `gen_ai.content.prompt` इनपुट संदेशों。
- `gen_ai.content.completion` आउटपुट संदेशों。
- `gen_ai.content.tool_call` 记录下来工具调用──

घटनाओं में एक अवधि में समय क्रम में, आसान है विस्तृत पुनःप्ले

### निर्यातक

ओटीएल स्पैन का निर्देशांक निम्नानुसार होगाः

- **Jaeger / Tempo.**ओएसएस, स्थान परः
- **Langfuse.**面向LLM अवलोकनशीलता;可视化 टोकन उपयोग
- **Arize Phoenix.**समता + पता लगाने 结合──
- **Datadog.**商业产品;原生解析 `gen_ai.*`विशेषताएं
- **Honeycomb.**स्तंभ-उन्मुख;便于查询──

它们都使用OTLP,也就是电缆格式──你的代码无需关心──

### एमसीपी में प्रसार

जब MCP क्लाइंट 调用服务器 时,把 W3C traceparent header 注入请求──Streamable HTTP 支持标准头条──Stdio 不原生携带 HTTP头条; इस स्पेसिफिकेशन के 2026 रोडमैप 讨论在 JSON-RPC कॉल 上添加 `_meta.traceparent`字段──

इसे जारी करने से पहलेः हर अनुरोध पर हाथ `_meta`中包含 traceparent──सर्वर 记录 trace id──

### मेट्रिक्स

स्पैन के अलावा, GenAI Semconv ने मेट्रिक्स को भी परिभाषित किया हैः

- `gen_ai.client.token.usage` हिस्टोग्राम。
- `gen_ai.client.operation.duration` हिस्टोग्राम。
- `gen_ai.tool.execution.duration` हिस्टोग्राम。

इनका उपयोग बिना किसी कॉल के विवरण के डैशबोर्ड के लिए किया जाएगा।

### एजेंटओप्स परत

AgentOps (संस्थायी वर्ष 2024) GenAI अवलोकन क्षमता पर केंद्रित है। यह प्रचलित ढांचे को कवर करता है।


```figure
t3-span-waterfall
```

## इसका उपयोग करें
`code/main.py`ओटीएल-आकार के स्पैन को एक बार एमसीपी राउंड-ट्रिप एजेंट के साथ एक एलएलएम-डिस्पैच उपकरण के रूप में उपयोग करने के लिए, ओटीएलपी-जेएसओएन के समान प्रारूप का उपयोग करके, स्टडआउट पर भेजा जाता है।

需要关注的点:

- 所有 spans 共享同一个痕迹ID──
- माता-पिता-बच्चे के संबंध         `parentSpanId`编码――
- अनिवार्य `gen_ai.*`विशेषताएँ 已填充──
- सामग्री कैप्चर 默认关闭; इनमें से एक दृश्य इसे पार कर जाएगा

## 交付 यह
本课会产出 `outputs/skill-otel-genai-instrumentation.md` एक एजेंट कोडबेस निर्धारित करें, इस कौशल से एक उपकरण योजना उत्पन्न होगी:

## अभ्यास
1. 运行 `code/main.py` सांख्यिकीय सीमाएँ संख्या,并识别哪些是客户,哪些是内部

2. 打开 सामग्री कैप्चर करना, पुष्टि होना`gen_ai.content.prompt`和 `gen_ai.content.completion`घटनाओं पर ध्यान दें।

3. 添加 उपकरण-कार्यकारी मेट्रिक्स `gen_ai.tool.execution.duration`,并每次调用将其作为 histogram样本发送──

4. माता-पिता से माता-पिता एजेंट तक प्रसारण करने के लिए MCP अनुरोध`_meta.traceparent`字段──验证 MCP सर्वर एक ही निशान आईडी देखेंगे──

5. 阅读 OTel GenAI semconv spec── खोजें एक semconv 中列出但本课代码没有发送的属性──添加它──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) GenAI की सीमाओं, मेट्रिक्स तथा घटनाओं के अधिकार सम्मेलन
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) LLM व उपकरण-कार्यकारी अवधि विशेषता 列表
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) एजेंट स्तर `invoke_agent`अवधि
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) GitHub 托管的权威来源
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) उत्पादन एकीकरण 讲解
