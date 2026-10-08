# एआई गेटवे  लिटएलएम、पोर्टकी、कोंग एआई गेटवे、बिफ्रास्ट

> गेटवे 位于您的应用和模型供应商 之间──核心功能是供应商路由、fallback、retries、rate limiting、secret references、observability、guardrails──2026 साल का बाजार分化:**LiteLLM**यह MIT OSS, 100+ प्रदाताओं का समर्थन करता है, ओपनएआई के साथ संगत है, लेकिन लगभग 2000 आरपीएस में 时会崩(8 जीबी मेमोरी, बेंचमार्क जारी किया गया है; सबसे उपयुक्त पायथन 、<500 आरपीएस、dev/प्रोटोटाइपिंग。**Portkey**定位为控制平面(गार्डरेल,PII संपादन,जेलब्रेक पता लगाने,ऑडिट ट्रेल),2026 साल 3 月转为Apache 2.0 ओपन सोर्स,लैटेंसी ओवरहेड 20-40 ms,उत्पादन स्तर के लिए$49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $100/मॉडल/महीना(प्लस लेयर 最多 5 个); यदि आप पहले से ही Kong का उपयोग कर रहे हैं, तो यह उद्यम के लिए उपयुक्त है。**Bifrost**(मैक्सिम एआई)  स्वचालित पुनः प्रयास, कॉन्फ़िगरेबल बैकऑफ समर्थन, ओपनएआई 429 时 बैकऑफ तक मानव**Cloudflare / Vercel AI Gateways** प्रबंधित 零-ops 基本 पुनः प्रयास  डेटा निवास स्वयं-होस्ट करने का निर्णय लेता है; पोर्टकी 和 कांग 处于中间位置,提供 OSS + वैकल्पिक प्रबंधित 

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:**चरण 17 · 01 (प्रबंधित LLM प्लेटफार्म), चरण 17 · 16 (मॉडल राउटिंग)
**Time:** ~60 minutes

## 学习目标
- 列举六个核心 gateway 功能 路由,倒退, वापसी, दर सीमा, रहस्य, अवलोकनशीलता, सुरक्षा) 
- चार 2026 गेटवे (LiteLLM、Portkey、Kong AI、Bifrost) को स्केल की छतों तथा उपयोग के मामलों तक मैप किया जाएगा।
- 引用 Kong बेंचमार्क ((相比Portkey 228%,相比LiteLLM 859%),并解释为什么对 >500 RPS 很重要──
-                                                                                                                                                                                                                                                               

## 问题
आपके उत्पादों को OpenAI 、Anthropic 和 एक स्वयं होस्ट किए गए Llama ٬ प्रत्येक प्रदाता के पास अलग-अलग SDK 、 त्रुटि मॉडल ٬ दर सीमा और लेखक योजना ٬ आप को विफलता की आवश्यकता है  यदि OpenAI  लौटें 429, ٬

ऐप लेयर में इनका पुनर्प्राप्ति होगा, प्रत्येक सेवा को प्रत्येक प्रदाता के साथ 合―गाटवे लेयर इसे एक प्रक्रिया में एकीकृत करेगा, एक एपीआई प्रदान करेगा, आमतौर पर ओपनएआई के साथ संगत), फिर से प्रत्येक प्रदाता को वितरित करेगा―

## 概念
### छह मुख्य विशेषताएं

1. **Provider routing** OpenAI, Anthropic, Gemini, Self-hosted आदि को एक एपीआई के पीछे रखना 
2. **Fallback**                                                                                                                                                                                                                                                              
3. **Retries** एक्सपोनेंशियल बैकॉफ,有界 प्रयासों
4. **Rate limits**  按租客,钥匙,模型──
5. **Secret references** 运行时从库 拉取凭证(绝不放在app中) 
6. **Observability** OTel + GenAI विशेषताएं(चरण 17 · 13)+ लागत श्रेय──
7. **Guardrails** पीआईआई सम्पादन,जेलब्रेक का पता लगाना,अनुमत विषय फ़िल्टर

### LiteLLM  MIT OSS, पायथन

- 100+ प्रदाता OpenAI संगत  राउटर कॉन्फ़िगरेशन फॉलबैक  बुनियादी अवलोकन क्षमता
- में Kong का बेंचमार्क 中约2000 RPS 时崩;8 GB मेमोरी पदचिह्न, निरंतर लोड में नीचे कैस्केडिंग विफलताएं दिखाई देती हैं。
- 最适合:पायथन ऐप、<500 आरपीएस、dev/स्टेजिंग गेटवे、प्रयोगात्मक रूटिंग。
- लागतः ओएसएस $ 0 है; वहाँ क्लाउड मुक्त स्तर है

### पोर्टकी  नियंत्रण विमान की स्थिति

- 截至2026年 3月为Apache 2.0 OSS── गार्डरेल्स、PII संपादन、जेलब्रेक पता लगाना、ऑडिट ट्रेल──
- प्रत्येक अनुरोध के लिए विलंबता ओवरहेड 20-40 ms है
- उत्पादन स्तर $49 / माह है, जिसमें प्रतिधारण + SLA शामिल है
- 最适合: आवश्यकता बंडल गार्डरेल्स + अवलोकन के विनियमित उद्योगों

### Kong AI गेटवे  पैमाने खेल

- 基于 कांग गेटवे 构建(成熟的API गेटवे 产品,lua+OpenResty)
- 12 सीपीयू समकक्ष में Kong स्वयंचलित बेंचमार्क ऊपर:比 पोर्टकी 快 228%,比 लाइटएलएम 快 859%
- मूल्यः $ 100 / मॉडल / महीने, प्लस स्तर अधिकतम 5 个
- ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### द्वि-मुद्रा (मैक्सिम एआई)

- स्वचालित पुनः प्रयास, कॉन्फ़िगरेबल बैकऑफ का समर्थन
- OpenAI 429 时 fallback to Anthropic है एक कैनोनिक नुस्खा
- 较新入; वाणिज्यिक 

### क्लाउडफ्लेयर एआई गेटवे / वर्सेल एआई गेटवे

- प्रबंधित 零-ऑप्स──मूल पुनः प्रयास तथा अवलोकन क्षमता──
- सबसे उपयुक्तः Cloudflare/Vercel ऊपर के एज-सेविंग जावास्क्रिप्ट एप्लिकेशन में काम करना
- 方面不如 Kong/Portkey──

### स्वयं होस्ट बनाम प्रबंधित

डेटा निवास ही निर्णय कारक है। स्वास्थ्य सेवा एवं वित्त 默认 स्व-होस्टिंग (LiteLLM या Portkey OSS या Kong) ◊ उपभोक्ता उत्पाद 默认 प्रबंधित (Cloudflare AI Gateway) या मध्य-स्तरीय (Portkey managed) ◊ हाइब्रिड: विनियमित किरायेदार उपयोग स्व-होस्टिंग, अन्य उपयोग प्रबंधित ◊

### विलंबता बजट

- लोटलम: सामान्य ओवरहेड 5-15 ms
- पोर्टकीः ओवरहेड 20-40 ms
- Kong: ओवरहेड 3 से 8 ms
- Cloudflare/Vercel:overhead 为 1-3 ms

गेटवे लटेंसी सीधे TTFT में वृद्धि करेगी। TTFT P99 < 100 ms SLA, SHOK Kong या Cloudflare हेतु P99 < 500 ms के लिए, कुछ भी हो सकता है।

### दर-सीमा अर्थशास्त्र विषय

简单的 टोकन-बकेट 可支到中度规模──多租户 需要滑窗 + फटकार अनुदान + प्रति किरायेदार टायरिंग──LiteLLM 内置 टोकन-बकेट;Kong 内置滑窗;Portkey 内置层次──

### गेटवे + अवलोकनशीलता + रूटिंग रचना

चरण 17 · 13(observability) + 16 ((model routing) + 19 ((gateways)) in production में एक ही लेयर में आते हैं।

### संख्याओं को याद रखना चाहिए

- LiteLLM: लगभग ~2000 आरपीएस 崩,8 जीबी मेमोरी──
- पोर्टकीः 20-40 ms ओवरहेड; से 2026 साल 3 月起 Apache 2.0
- Kong:比 पोर्टकी 快 228%,比 लिटएलएम 快 859%──
- कॉंग मूल्यः $ 100 / मॉडल / महीने, प्लस स्तर अधिकतम 5 个
- क्लाउडफ्लेयर/वर्सेल:एज 上 1-3 ms ओवरहेड


```figure
mx-gateway-fallback
```

## इसका उपयोग करें
`code/main.py`模拟 3 个 提供商 在 429/5xx इंजेक्शन 下的 गेटवे रूटिंग with fallback── रिपोर्ट लटेंसी、retry rate 和 fallback hit rate──

## 交付 यह
本课产 出 `outputs/skill-gateway-picker.md`                                                                                                                                                                                                                                                              

## अभ्यास
1. 运行 `code/main.py` Configuration OpenAI→Anthropic→self-hosted का fallback──% 5% प्रदाता त्रुटि दर में, अपेक्षित हिट दर क्या है?
2. आपका SLA TTFT P99 < 200 ms है, बेसलाइन 300 ms है... कौन से गेटवे अभी भी बजट के भीतर हैं?
3. एक स्वास्थ्य सेवा ग्राहक  आत्म-होस्ट + पीआईआई संपादन + लेखा परीक्षा ∙ चयन पोर्टकी ओएसएस या तो कॉंग ∙
4. LiteLLM की तुलना Kong: टीम को RPS की छत पर क्या स्थानांतरित करना चाहिए?
5. बहु-आवासीय सास डिजाइन दर-सीमा नीति:मुक्त स्तर, परीक्षण स्तर, भुगतान स्तर, टोकन-बकेट या स्लाइडिंग-विंडो चुनें?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | “API broker” | 位于 apps 和 providers 之间的 process |
| LiteLLM | “the MIT one” | Python OSS，100+ providers，2K RPS 时崩溃 |
| Portkey | “guardrails gateway” | Control plane + observability，Apache 2.0 |
| Kong AI Gateway | “the scale one” | 基于 Kong Gateway 构建，benchmark leader |
| Bifrost | “Maxim's gateway” | Retries + Anthropic fallback recipe |
| Cloudflare AI Gateway | “edge managed” | Edge-deployed managed gateway，zero-ops |
| PII redaction | “data scrub” | 发送到 model 前进行 Regex + NER mask |
| Jailbreak detection | “prompt injection guard” | 对 user input 的 Classifier |
| Audit trail | “regulated log” | 每次 LLM call 的 immutable record |
| Token-bucket | “simple rate limit” | 基于 refill 的 rate limiter |
| Sliding-window | “precise rate limit” | Time-windowed rate limiter；fairness 更好 |

## 延伸阅读
- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
