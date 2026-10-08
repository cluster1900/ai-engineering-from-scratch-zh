# ओपनटेलीमेट्री GenAI 语义约定

> OpenTelemetry के GenAI SIG(2024 साल 4 月启动) ने एजेंट टेलीमेट्री के मानक योजना को परिभाषित किया है।

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## 学习目标
- GenAI श्रेणीओं का वर्णन करेंः मॉडल/ग्राहक、एजेंट、साधन
- 区分 `invoke_agent`ग्राहक और आंतरिक क्षेत्र, तथा उनके संबंधित उपयुक्त परिदृश्य
- 列出顶层 GenAI विशेषताएं:प्रदाता नाम, अनुरोध मॉडल, डेटा स्रोत आईडी
- 解释 सामग्री-व्यापक अनुबंध:opt-in`OTEL_SEMCONV_STABILITY_OPT_IN`、बाहरी संदर्भ सिफारिश

## 问题
प्रत्येक विक्रेता अपना स्वयं का नाम विकसित करता है। ऑपरेशन टीमों को अंततः प्रत्येक ढांचे के लिए अलग-अलग डैशबोर्ड बनाने की आवश्यकता होती है।

## 概念
### स्पेन श्रेणियाँ

1. **Model / client spans.**覆盖原始 LLM कॉल──प्रदाता द्वारा SDKs(Anthropic、OpenAI、Bedrock) तथा फ्रेमवर्क मॉडल एडाप्टर 发发出──
2. **Agent spans.** `create_agent`(निर्माण एजेंट 时) और `invoke_agent`(运行代理 时)
3. **Tool spans.**प्रत्येक उपकरण का आह्वान एक; माता-पिता-बच्चे के संबंध के माध्यम से  连接到代理 span──

### एजेंट स्पैन नामकरण

- स्पेनिश नाम: यदि已命名,则为 `invoke_agent {gen_ai.agent.name}`; वापसी के लिए `invoke_agent`
- स्पैन प्रकारः
  - **CLIENT** दूरस्थ एजेंट सेवाओं के लिए उपयोग किया गया है(OpenAI सहायक एपीआई、बेड्रॉक एजेंट)
  - **INTERNAL** प्रसंस्करण में एजेंट फ्रेमवर्क के साथ प्रयोग किया गया है

### मुख्य विशेषताएं

- `gen_ai.provider.name` `anthropic``openai``aws.bedrock``google.vertex`
- `gen_ai.request.model` मॉडल आईडी。
- `gen_ai.response.model` 解析后的模型(可能因路由而不同于请求)。
- `gen_ai.agent.name` एजेंट पहचानकर्ता。
- `gen_ai.operation.name` `chat``completion``invoke_agent``tool_call`
- `gen_ai.data_source.id` RAG के लिए प्रयोग किया गयाः पूछताछ किस कॉर्पस या दुकान में

मानव विज्ञान, Azure AI इन्फेरेन्स, AWS बेडरोक, ओपनएआई में तकनीकी सम्मेलन हैं।

### सामग्री कैप्चर

默认规则:उपकरण 默认 SHOULD NOT 捕获 इनपुट/आउटपुट──कैप्चर 通过以下方式选择:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部(S3、你的日志店),在跨度上记录引用(शोधक आईडी, न कि गद्य)  यह पाठ 27 की सामग्री-विषाक्तता 防御接入可观察性 के तरीके है

### स्थिरता

截至2026年 3月, अधिकांश सम्मेलन 仍是实验性──使用以下方式选择到稳定预览:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI गुणों को मूल रूप से प्रदर्शित किया गया है।

### यह तरीका आसानी से गलत जगह पर है

- **在 spans 中捕获完整 prompts。**पीआईआई, गोपनीय, ग्राहक डेटा, अपरेशन में प्रवेश करेगा, पढ़ी जाने योग्य निशानों को बाहर संग्रहीत किया जाना चाहिए।
- **没有 `gen_ai.provider.name`。**विशेषता 缺失时,बहु-प्रदाता डैशबोर्ड 会失效。
- **没有 parent links 的 spans。**会产生孤立的工具范围──始终传播背景──
- **没有设置 stability opt-in。** बाद में उन्नयन के दौरान, आपके गुण हो सकता है पुनः नामित किया जाएगा


```figure
ae-genai-span-tree
```

##  इसे निर्माण
`code/main.py`实现 एक उपयुक्त GenAI सम्मेलनों के stdlib अवधि उत्सर्जक:

- 带 GenAI विशेषता योजना के `Span`
- 带 `start_span`、निस्ट संदर्भों का `Tracer`
- एक पटकथा एजेंट चल रहा है, होगा बाहर भेजाः`create_agent``invoke_agent`(INTERNAL) ✓ प्रति उपकरण अवधि ✓ LLM कॉल के लिए प्रयोग किया जाता है `chat`अवधि
- एक सामग्री-पकड़ मोड, होगा डाल संकेत  भंडारण बाहर, और ऊपर रिकॉर्ड आईडी के लिए अवधि में

运行它:

```
python3 code/main.py
```

输出: एक वृक्ष जिसमें सभी आवश्यक GenAI गुणों का एक स्पैन ट्री, साथ ही एक "बाहरी स्टोर" जिसमें ऑप्ट-इन सामग्री संदर्भ दिखाई देते हैं।

## इसका उपयोग करें
- **Datadog LLM Observability**(v1.37+) मूल जीवन का चित्रण गुणों
- **Langfuse / Phoenix / Opik**(पाठ 24)  ऑटो-इंस्ट्रूमेंट 生态
- **Jaeger / Honeycomb / Grafana Tempo** कच्चे ओटेल निशान; GenAI गुणों से 构建 डैशबोर्ड──
- **Self-hosted** उपयोग GenAI प्रोसेसर 运行 ओटेल कलेक्टर。

## 交付 यह
`outputs/skill-otel-genai.md`接入现有代理,并带有内容-कैप्चर डिफ़ॉल्ट和外部-参考 भंडारण

## अभ्यास
1. उपयोग `invoke_agent`(आंतरिक) + प्रति उपकरण उपकरण स्पैन्स आपका पाठ 01 प्रतिक्रिया लूप── एक Jaeger उदाहरण में भेज दिया──
2. "केवल संदर्भ" मोड में 中添加内容捕获:प्रॉम्प्ट्स 写入 SQLite,span गुणों 只有携带行 IDs──
3. 阅读 `gen_ai.data_source.id`इसका विवरण. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
4.  सेटिंग `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`,并验证आपके गुणों को नहीं किया जाएगा कलेक्टर पुनः नामकरण.
5. 建构一个仪表板:仅从GenAI属性看"कौन सी उपकरण त्रुटियां किस मॉडल से संबंधित हैं"

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 默认提供 GenAI स्पांस
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) 内置 ओटीएल स्पैन
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) W3C ट्रैक संदर्भ 传播
