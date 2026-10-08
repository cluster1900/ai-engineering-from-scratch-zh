# फ़ंक्शन कॉलिंग 深入解析  OpenAI, मानव, जुड़वां

> इन तीनों सीमा प्रदाताओं ने 2024 में एक ही टूल-कॉल लूप प्राप्त किया, फिर अन्य सभी स्थानों पर इसे विभाजित किया गया।`tools`和 `tool_calls`❖ मानव प्रयोग `tool_use`和 `tool_result`ब्लॉक──Gemini 使用 `functionDeclarations`और अद्वितीय-आईडी संबंध── इस कोर्स में तीनों के बीच अंतर होगा, जिससे एक प्रदाता पर डिलीवरी का कोड दूसरे प्रदाता पर ट्रांसफर होने पर खराब नहीं हो जायेगा──

**Type:** Build
**Languages:** Python (stdlib, schema translators)
**Prerequisites:** Phase 13 · 01（the tool interface）
**Time:** ~75 分钟

## 学习目标
-                                                                                                                                                                                                                                                               
- एक उपकरण घोषणा 翻译到三个提供商格式,并预测严格模式限制 会在哪里不同──
- प्रत्येक प्रदाता में उपयोग `tool_choice` अनिवार्य  प्रतिबंधित या स्वचालित रूप से उपकरण चयन कॉल
-  प्रत्येक प्रदाता की कठोर सीमाओं को जानें (उपकरण गणना, योजना गहराई, तर्क लंबाई), तथा उल्लंघन सीमाओं के साथ-साथ उनके द्वारा उत्सर्जित त्रुटियों के हस्ताक्षरों को भी जानें

## 问题
फ़ंक्शन-कॉल अनुरोध का आकार ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् 

**OpenAI Chat Completions / Responses API.**तुम प्रवेश करो`tools: [{type: "function", function: {name, description, parameters, strict}}]`मॉडल की प्रतिक्रिया 包含 `choices[0].message.tool_calls: [{id, type: "function", function: {name, arguments}}]`, उनमें से `arguments`है आप JSON स्ट्रिंग को हल करना होगा.`strict: true`) बाध्यकारी डिकोडिंग के माध्यम से 强制方案 अनुपालन──

**Anthropic Messages API.**तुम प्रवेश करो`tools: [{name, description, input_schema}]` प्रतिक्रिया 以 `content: [{type: "text"}, {type: "tool_use", id, name, input}]` लौट आओ`input`已被解析(是对象,不是字符串)──你再回复一个新的 `user`संदेश, जिसमें शामिल है`{type: "tool_result", tool_use_id, content}`ब्लॉक

**Google Gemini API.**तुम प्रवेश करो`tools: [{functionDeclarations: [{name, description, parameters}]}]`(मेज़बंद में `functionDeclarations`下) ◊ प्रतिक्रिया 以 `candidates[0].content.parts: [{functionCall: {name, args, id}}]`तक पहुँचने के लिए, उनमें से `id`में Gemini 3 及以上 संस्करण में अद्वितीय है, समानांतर कॉल सहसंबंध के लिए प्रयोग किया जाता है.`{functionResponse: {name, id, response}}`

एक ही लूप में एक टीम ने ओपनएआई में मौसम एजेंट को लिखा, बस प्लाईबिंग के लिए, मानव पर स्थानांतरित करना दो दिन लगेंगे, जुड़वां पर पुनः स्थानांतरित करना एक दिन भी लगेंगे।

इस कोर्स में एक अनुवादक का निर्माण किया जाएगा, तीन प्रकार के प्रारूपों को एक कैनोनिक टूल घोषणा में एकीकृत किया जाएगा, और एज में राउटिंग किया जाएगा।

## 概念
### आम संरचना

प्रत्येक प्रदाता को पांच चीजों की आवश्यकता होती हैः

1. **Tool list.**प्रत्येक उपकरण का नाम, विवरण तथा इनपुट योजना
2. **Tool choice.**कठोर उपयोग के लिए विशिष्ट उपकरण निरोधक उपकरण, या मॉडल का निर्णय लेना
3. **Call emission.**命名 उपकरण 和 तर्कों का संरचित आउटपुट。
4. **Call id.**关联到正确的电话将响应 (关联到正确的电话)
5. **Result injection.**एक संदेश या ब्लॉक, परिणाम होगा  बंधा पुनः कॉल

### 个个 फ़ील्ड तुलना आकार अंतर

| Aspect | OpenAI | Anthropic | Gemini |
|--------|--------|-----------|--------|
| Declaration envelope | `{type: "function", function: {...}}` | `{name, description, input_schema}` | `{functionDeclarations: [{...}]}` |
| Schema field | `parameters` | `input_schema` | `parameters` |
| Response container | assistant message 上的 `tool_calls[]` | type 为 `tool_use` 的 `content[]` | type 为 `functionCall` 的 `parts[]` |
| Arguments type | stringified JSON | parsed object | parsed object |
| Id format | `call_...`（OpenAI 生成） | `toolu_...`（Anthropic） | UUID（Gemini 3+） |
| Result block | role `tool`, `tool_call_id` | 带 `tool_result`, `tool_use_id` 的 `user` | 带匹配 `id` 的 `functionResponse` |
| Force-a-tool | `tool_choice: {type: "function", function: {name}}` | `tool_choice: {type: "tool", name}` | `tool_config: {function_calling_config: {mode: "ANY"}}` |
| Forbid tools | `tool_choice: "none"` | `tool_choice: {type: "none"}` | `mode: "NONE"` |
| Strict schema | `strict: true` | schema-is-schema（始终 enforce） | request level 的 `responseSchema` |

### आप वास्तव में सामना करने के लिए सीमाओं

- **OpenAI.**प्रत्येक अनुरोध अधिकतम 128 个工具──स्केमा गहराई 5──आर्कमेंट स्ट्रिंग <= 8192 बाइट्स──सख्त मोड 要求没有 `$ref`, कोई ओवरलैप नहीं है ।`oneOf`/`anyOf`/`allOf`, प्रत्येक संपत्ति शहर में स्थित है`required`मध्य में
- **Anthropic.**प्रत्येक अनुरोध अधिकतम 64 工具── योजना गहराई 实际上不设上限, लेकिन व्यावहारिक सीमा 为10──没有严格模式旗; योजना ही अनुबंध है, मॉडल आमतौर पर पालन होगा──
- **Gemini.**प्रत्येक अनुरोध अधिकतम 64 个 फ़ंक्शन──स्कीम प्रकार OpenAPI 3.0 उपसमूह हैं(जेएसओएन स्कीम 2020-12 के साथ थोड़ा अंतर है)── से Gemini 3 起, समानांतर कॉल 使用 अद्वितीय-id──

### `tool_choice`व्यवहार

तीन प्रकार के सभी लोग समर्थन करते हैं, बस अलग नाम है।

- **Auto.**मॉडल 选择 उपकरण अथवा पाठ──默认值──
- **Required / Any.**मॉडल मुश्किल है कि कम से कम एक उपकरण को संशोधित किया जाए।
- **None.**मॉडल को उपकरण का उपयोग नहीं करना चाहिए।

इसके अलावा, प्रत्येक प्रदाता का एक अद्वितीय मॉडल हैः

- **OpenAI.**按名 强制使用特定工具──
- **Anthropic.**按名 强制使用特定工具;`disable_parallel_tool_use`ध्वज 区分 एकल बनाम बहु――
- **Gemini.** `mode: "VALIDATED"` प्रत्येक प्रतिक्रिया  योजना सत्यापनकर्ता से गुजरती है, चाहे मॉडल का इरादा  कैसे हो

### समानांतर कॉल

OpenAI की `parallel_tool_calls: true`(默认) एक सहायक संदेश में कई कॉल भेजेंगे.`tool_call_id`एक प्रविष्टि के लिए प्रतिक्रिया करनाः मानव इतिहास एक कॉल है;`disable_parallel_tool_use: false`(截至Claude 3.5 的默认值) मल्टी-──Gemini 2 允许并行通话,但没有给出稳定的ID;Gemini 3 增加 UUID,因此, आउट-ऑर्डर प्रतिक्रियाएं 可以干净地相关──

### स्ट्रीमिंग

三者都支持 स्ट्रीम उपकरण कॉल──तार प्रारूप 不同:

- **OpenAI.** `tool_calls[i].function.arguments`डेल्टा टुकड़े के वृद्धि होगा तक पहुँच जाओ `finish_reason: "tool_calls"`
- **Anthropic.**ब्लॉक-स्टार्ट / ब्लॉक-डेल्टा / ब्लॉक-स्टॉप घटनाएँ。`input_json_delta`टुकड़े 携带 आंशिक तर्क。
- **Gemini.** `streamFunctionCallArguments`(जुम्मन 3 新增)发出带 `functionCallId`के टुकड़े, इसलिए कई समानांतर कॉल कर सकते हैं

चरण 13 · 03 会深入讲 समानांतर + स्ट्रीमिंग री-एम्ब्लीमेंट。本课聚焦宣言 和 एकल-कॉल आकृतियाँ。

### त्रुटियां और मरम्मत

अमान्य तर्क त्रुटियों का प्रदर्शन भी भिन्न है

- **OpenAI (non-strict).**मॉडल  वापसी `arguments: "{bad json}"`, आपका JSON पार्स विफल, आप त्रुटि संदेश डाला और फिर से कॉल किया गया
- **OpenAI (strict).**सत्यापन में decoding के दौरान हुआ;अमान्य JSON नहीं हो सकता है, लेकिन हो सकता है`refusal`
- **Anthropic.** `input`संभव है कि इसमें अप्रत्याशित फ़ील्ड शामिल हों; योजना सलाहकार है। सर्वर-साइड सत्यापन की आवश्यकता है।
- **Gemini.**OpenAPI 3.0 quirk:ऑब्जेक्ट फ़ील्ड 上的 `enum`                                                                                                                                                                                                                                                              

### अनुवादक पैटर्न

你代码中的 Canonical Tool Declaration looks like this ((आकार द्वारा आप चयन):

```python
Tool(
    name="get_weather",
    description="Use when ...",
    input_schema={"type": "object", "properties": {...}, "required": [...]},
    strict=True,
)
```

三小函数将它翻译成三种提供形――`code/main.py`मध्य के हर्नस बस ऐसा ही किया जाता है, फिर एक नकली उपकरण कॉल करने के लिए प्रत्येक प्रदाता के प्रतिक्रिया के रूप के माध्यम से करते हैं और फिर से यात्रा करते हैं।

उत्पादन टीमों को इस अनुवादक को शामिल करेगा`AbstractToolset`(पायडान्टिक एआई)`UniversalToolNode`(लंगग्राफ) या `BaseTool`(LlamaIndex) ――चरण 13 · 17 会交付一个门户,在三者任意一个前面暴露OpenAI-आकार के एपीआई──


```figure
function-call-args
```

## इसका उपयोग करें
`code/main.py`定义一个法典 `Tool`dataclass, तथा तीन अनुवादक, उपयोग करने के लिए जारी किया जाता है OpenAI、Anthropic 和 Gemini घोषणा JSON── उसके बाद यह प्रत्येक आकार के हाथ से निर्मित प्रदाता प्रतिक्रिया 解析为同一个法典呼叫对象,展示语义在表层之下是相同的──运行它,并并排不同 三个声明──

需要观察的点:

- तीन घोषणा ब्लॉक केवल लिफाफे में और फ़ील्ड नाम ऊपर भिन्न हैं
- तीन प्रतिक्रिया ब्लॉक का अंतर कॉल स्थान पर स्थित है`tool_calls``content[]`ब्लॉक`parts[]`प्रवेश)
- एक `canonical_call()`फ़ंक्शन से सभी तीन प्रकार के प्रतिक्रिया स्वरूप 中提取 `{id, name, args}`

## 交付 यह
本课产 出 `outputs/skill-provider-portability-audit.md` किसी प्रदाता के लिए फ़ंक्शन-कॉलिंग एकीकरण को निर्धारित करने के लिए, इस कौशल से पोर्टेबिलिटी ऑडिट उत्पन्न होगाः यह निर्भर करता है कि कौन से प्रदाता सीमाएँ हैं  कौन से फ़ील्ड को नाम बदलने की आवश्यकता है, तथा अन्य प्रदाताओं को स्थानांतरित करने पर क्या टूटना होगा 

## अभ्यास
1. 运行 `code/main.py`, सत्यापित तीन प्रदाता घोषणा JSONs एक ही तल में क्रमबद्ध कर रहे हैं ।`Tool`वस्तु── संशोधन कैनोनिकल उपकरण, जोड़ना एक एनम पैरामीटर,并确认 केवल मिथुन अनुवादक 需要处理 OpenAPI quirk──

2. प्रत्येक प्रदाता के लिए एक जोड़ें `ListToolsResponse`पार्सर, मॉडल से `list_tools`या खोज कॉल 后返回的内容中提取工具列表──OpenAI 原生没有这个项目;记录这个不对称性──

3. 实现 `tool_choice`रूपांतरण:将 कैनोनिकल `ToolChoice(mode="force", tool_name="x")`映射到三种供应商形――然后映射 `mode="any"`和 `mode="none"`检查本课的差表

4. 选择三个提供商中一个,从头到尾阅读它的函数调用指南――找出它的方案规范中一个其他两个不支持的领域――候选项:OpenAI `strict`、 मानव`disable_parallel_tool_use`、ज्वैलियाँ `function_calling_config.allowed_function_names`

5. 写一个测试向量:一个论点 违反声明的方案的工具调用──将它运行过每个供应商的验证器(Lesson 01 中的 stdlib验证器可以作为代理),并记录触发了哪些错误──记录你在生产中会为了严格使用哪个供应商──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Function calling | "Tool use" | 用于 structured tool-call emission 的 provider-level API |
| Tool declaration | "Tool spec" | Name + description + JSON Schema input payload |
| `tool_choice` | "Force / forbid" | Auto / required / none / specific-name modes |
| Strict mode | "Schema enforcement" | OpenAI flag，用于约束 decoding 以匹配 schema |
| `tool_use` block | "Anthropic's call shape" | 带 id、name、input 的 inline content block |
| `functionCall` part | "Gemini's call shape" | 包含 name、args 和 id 的 `parts[]` entry |
| Arguments-as-string | "Stringified JSON" | OpenAI 将 args 作为 JSON string 返回，而不是 object |
| Parallel tool calls | "Fan-out in one turn" | 一个 assistant message 中的多个 tool calls |
| Refusal | "Model declines" | strict-mode-only 的 refusal block，而不是 call |
| OpenAPI 3.0 subset | "Gemini schema quirk" | Gemini 使用一种类似 JSON-Schema 的 dialect，存在细微差异 |

## 延伸阅读
- [OpenAI — Function calling guide](https://platform.openai.com/docs/guides/function-calling) 包含 कठोर मोड तथा समानांतर कॉल का कैनोनिक संदर्भ
- [Anthropic — Tool use overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) `tool_use`和 `tool_result`ब्लॉक अर्थशास्त्र
- [Google — Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling) समानांतर कॉल, अद्वितीय आईडी और ओपनएपीआई उपसमूह
- [Vertex AI — Function calling reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling) मिथुन की उद्यम स्तरीय सतह
- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) सख्त मोड योजना 强制执行细节
