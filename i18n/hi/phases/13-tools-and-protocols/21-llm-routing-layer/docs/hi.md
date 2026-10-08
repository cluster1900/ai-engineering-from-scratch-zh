# LLM रूटिंग लेयर  LiteLLM, OpenRouter, Portkey

> प्रदाता लॉक-इन 代价高昂―― विभिन्न उपकरण-कॉलिंग 工作负载适合不同模型――路由网关 提供统一的API 表面、重试、failover、成本跟踪和护林──2026 साल में तीन मुख्य रूप हैंःLiteLLM(开源、自托管)、OpenRouter(托管 SaaS)、Portkey(生产级,2026 साल 3 月开源)──本课会说明决策标准,并演示一个 stdlib路由网关──

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## 学习目标
- 区分自托管、托管和生产级路由 选项──
-  एक fallback chain को प्राप्त करना,  प्रदाता 失败时按定义好的优先级顺序重试──
- ट्रैकिंग क्रॉस प्रदाता की एकल अनुरोध लागत तथा टोकन उपयोग मात्रा
-  किसी निर्दिष्ट उत्पादन सीमा के लिए, LiteLLM、OpenRouter और Portkey के बीच चयन किया जाए

## 问题
प्रदाता रूटिंग  महत्वपूर्ण场景:

1. **成本。**क्लाउड सोनेट की लागत हैकू की 3 गुना हैकू के लिए 任务, Haiku  पर्याप्त; संश्लेषण 任务, सोनेट 值得──按要求路由──

2. **Failover。**OpenAI 出现一小时故障── प्रत्येक अनुरोध都失败──你希望自动落后到人类,而无需重新部署──

3. **延迟。**实时聊天 UI 需要快速的时间到第一代标语――批量摘摘器不需要――按延迟 SLA 路由――

4. **合规。**यूरोपीय संघ के उपयोगकर्ता को यूरोपीय संघ के क्षेत्र में रहना होगा।

5. **实验。**एक ही कामकाजी भार पर दो मॉडल पर ए/बी करे।

प्रत्येक एकीकृत हाथ के लिए इन लॉजिक्स को बहुत दोहराया गया है।

## 概念
### OpenAI संगत प्रॉक्सी 形态

सभी लोग OpenAI-आकार का उपयोग करते हैं।`/v1/chat/completions`, ओपनएआई योजना को स्वीकार करें, और आंतरिक रूप से एंथ्रोपिक / मिथुन / कोहेरे / ओल्मा / 任何后端──客户端不需要关心──

### मॉडल उपनाम

你的代码不写 `claude-3-5-sonnet-20251022`, बल्कि लिख `our_smart_model` गेटवे होगा alias 映射到真实模型──当人类学 发布Claude 4 时,你在服务端修改 alias;你的代码无需改变任何东西──

### पतन श्रृंखलाएँ

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

गेटवे में इनका परिभाषाएँ हैं।

### अर्थिक कैशिंग

समान या समान समान शीघ्र जीवन में कैशिंग, न कि प्रदाता का उपयोग करना।

### गार्डरेल्स

网关级:

- **PII redaction.**में भेजने के लिए शीघ्र पूर्व निष्पादन Regex या आधारित ML के प्रसंस्करण
- **Policy violations.**拒绝包含禁止内容的提示──
- **Output filters.**清理完成 中中泄漏内容──

पोर्टकी एवं कांग शहर में स्पष्ट रूप से अभिमुख पहरादार हैं।

### प्रति कुंजी दर सीमाएं

एक एपीआई कुंजी = एक टीम― प्रति कुंजी बजट  एक टीम के खपत साझा कोटा को रोकने― अधिकांश गेटवे इस बात का समर्थन करते हैं―

### स्व-होस्टिंग और प्रबंधित

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

जब आपके पास SRE  टीम है और आप डेटा स्वामित्व प्राप्त करना चाहते हैं, तो LittleLLM 胜出.

### लागत ट्रैकिंग

प्रत्येक अनुरोध ले लो`provider``model``input_tokens``output_tokens`△乘以模型按 टोकन 的价格按网关 维护 的价格表 拉取) △用户 / 团队 / 项目聚聚

### एमसीपी प्लस रूटिंग

गेटवे एक ही समय में एलएलएम से संपर्क किया जा सकता है 调用和MCP नमूना अनुरोधों──当采样请求的模型Preferences 偏好某特定模型时,gateway 会转换到正确后端──这是Phase 13 · 17(MCP गेटवे)和本课路由 गेटवे 有时会并成一个服务的地方──

### रूटिंग रणनीतियाँ

- **Static priority.**列表中第一个;出错时倒退──
- **Load balancing.**राउंड-रोबिन या加权──
- **Cost-aware.**选择满足延迟 / 质量要求的最低成本模型──
- **Latency-aware.**选择过去 N 分钟内最快的模型──
- **Task-aware.**शीघ्र वर्गीकरण एक मॉडल के लिए कोडिंग मार्ग से होगा, एक संक्षेप के लिए एक अन्य मॉडल के लिए मार्ग से होगा।


```figure
tp-router-failover
```

## इसका उपयोग करें
`code/main.py`उपयोग 150 行 एक रूटिंग गेटवे को लागू करेंः OpenAI-आकार के अनुरोधों को स्वीकार करें, प्रत्येक प्रदाता स्टब में स्थानांतरित करें, प्राथमिकता वाले फ़ॉलबैक चेन का अनुसरण करें, एकल अनुरोध लागत का पालन करें, और इनपुट अनुप्रयोग पीआईआर संपादन पास पर जाएं।

需要关注:

- `ROUTES`dict:alias -> 按优先级排序的具体供应商列表
- पतन लूप 5xx में होगा ऊपर पुनः प्रयास
- लागत ट्रैकर प्रत्येक मॉडल के लिए उपयोग मात्रा गुणा करने के लिए टोकन को ट्रैक करेगा।
- पीआईआई संपादक 会在转发前清理形状类似SSN के ढांचे में

## 交付 यह
本课会产出 `outputs/skill-routing-config-designer.md`◊ एक कार्यभार प्रोफ़ाइल निर्धारित करना (延迟、成本、合规), इस कौशल को लिटएलएम/ओपनरॉटर/पोर्टकी का चयन करना, और रूटिंग कॉन्फ़िगरेशन उत्पन्न करना

## अभ्यास
1. 运行 `code/main.py`◊触发停电场; पुष्टिकरण 落到第二供应商,并且成本归因正确──

2. 添加语义缓存:prompt 的 SHA256 作为搜索密钥;缓存击中立即返回──测量重复调用成本节省──

3. 添加一个快速分类器,将 `"code ..."`शीघ्र 路由到偏向智能 的别名,将 `"summarize ..."`शीघ्र 路由到偏向速度 का तात्पर्य

4.  डिज़ाइन प्रति टीम बजट: प्रत्येक टीम के पास मासिक व्यय की सीमा है; अधिकतम सीमा तक पहुँचने के बाद, गेटवे  अस्वीकार अनुरोधों को चुनें।

5. 并排阅读 LiteLLM、OpenRouter 和 Portkey 文档── प्रत्येक उत्पाद प्रदान किया जाता है जबकि अन्य दो में एक कार्य नहीं है──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/) स्वतः托管 रूटिंग गेटवे
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 托管 रूटिंग SaaS
- [Portkey — docs](https://portkey.ai/docs) 带有护的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) विक्रेता 调研
