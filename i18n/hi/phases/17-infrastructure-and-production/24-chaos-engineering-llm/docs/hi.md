# LLM उत्पादन का अराजकता इंजीनियरिंग

> 2026 तक, एलएलएम के लिए उन्मुख अराजकता इंजीनियरिंग 已成为一门独立实践──在生产中运行实验前置条件:已定义的SLI/SLO、trace+metric+log observability、自动滚动、runbooks、on-call。 आर्किटेक्चर चार विमान हैंः नियंत्रण(प्रयोग अनुसूचक) 、 लक्ष्य  सेवाएँ、 इन्फ्रा、 डेटा स्टोर)  सुरक्षा गार्ड्स + निरस्त + ट्रैफिक फ़िल्टर)  अवलोकन क्षमता  मापदंड + ट्रैक + लॉग्स)  फीडबैक में प्रवेश SLO  सुरक्षा  आवश्यकता  यदि ChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaCha

**类型：**学习
**语言：**Python(stdlib, खिलौना अराजकता प्रयोग धावक)
**前置条件：**चरण 17 · 23(एआई के लिए एसआरई),चरण 17 · 13(निरीक्षण)
**时间：**≈ 60 मिनट

## 学习目标

- बताओ पांच अराजकता इंजीनियरिंग पूर्व निर्धारित शर्तें ((SLI/SLO、observability、rollback、runbooks、on-call), और समझाओ कि किसी भी एक से कूदने से यह अभ्यास क्यों बर्बाद हो जाएगा。
- चित्र चार विमानों को आकर्षित करें (नियंत्रण, लक्ष्य, सुरक्षा, अवलोकन) तथा SLO के प्रतिक्रिया लूप में प्रवेश करें।
- 枚举五个LLM-विशेष प्रयोगों(मेमोरी ओवरलोड,नेटवर्क विफलता,प्रदाता आउटेज,असली प्रॉम्प्ट,केवी निष्कासन तूफान)
- 根据堆 选择工具  हर्नेस、लिटमसChaos、Chaos Mesh──

## 问题

传统堆 中的混沌测试 已经很成熟──LLM堆 增加了新的失败模式──一个带有毒字符的4K-token提示 会让代币器卡住 12秒──上游提供商 返回429;你的门户网 进行重复试验;你的服务 因重复加大同步而OOM──爆 load 下的KV缓存排泄风暴会导致重复填充,进而耗尽计算──

ये सब यूनिट टेस्ट में दिखाई नहीं देंगे।

## 概念

### पूर्व शर्त

यदि निम्नलिखित सामग्री नहीं है, तो उत्पादन में अराजकता न करेंः

1. **SLI/SLO** सेवा स्तर के संकेतक एवं उद्देश्य परिभाषित किये गये हैं।
2. **Observability** ट्रैक, मेट्रिक्स, लॉग,并连接到仪表板──
3. **Automated rollback** चरण 17 · 20 नीतिगत ध्वज वापसी
4. **Runbooks**  संरचना,चरण 17 · 23。
5. **On-call** कोई जवाबदेही है

 किसी भी एक की कमी, तू का मतलब है अराजकता वास्तविक घटना में बदल जाएगा

### चार विमान + प्रतिक्रिया

**Control plane** प्रयोग अनुसूचक(लिटमस वर्कफ़्लो、Chaos Mesh अनुसूची、Harness UI)

**Target plane** सेवाएँ, पॉड, नोड्स, लोड बैलेंसर, डेटा स्टोर

**Safety plane** निष्क्रिय स्विच, दमन खिड़कियां, विस्फोट त्रिज्या सीमा, त्रुटि-बजट गेट

**Observability plane** 常规 मेट्रिक्स + ट्रैक-आईडी सहसंबंध, उपयोग में लाया जाता है区分混沌-प्रेरित विफलताओं 和 प्राकृतिक विफलताओं

**Feedback loop** 发现结果反到SLO समायोजन、रनबुक अपडेट、 कोड फिक्स──

### गार्डरेल्स अनिवार्य है

- **Burn-rate alert**यदि दैनिक त्रुटि-बजट जलने की अपेक्षा से 2 गुना अधिक हो, तो प्रयोग को अस्थायी रूप से रोक दिया जाए।
- **Suppression windows**प्रयोग के दौरान, विस्फोट त्रिज्या में अस्थायी अलर्ट
- **Trace-ID correlation**सभी प्रयोग-उत्प्रेरित त्रुटियों एक टैग के साथ ले जाते हैं, कॉल पर जा सकते हैं करने के लिए पुनः प्राप्त करें

### 五个 LLM विशिष्ट प्रयोग

1. **Memory overload**                                                                                                                                                                                                                                                              

2. **Network failure** 切断推理网关与供应商之间的连接──观察:fallback 是否在SLA内生效?

3. **Provider outage simulation** OpenAI 100% 返回 429──观察: राउटिंग है या नहीं फेलओवर तक मानव?

4. **Malformed prompt** प्रविष्टि में डाल दिया जा करने के लिए टोकन बनाने वाला 卡住的 nytload (उदाहरण के लिए गहरे घोंसले वाले यूनिकोड, विशाल UTF-8 कोडपॉइंट) 观察: एकल अनुरोध या एक कार्यकर्ता को लॉक करेगा?

5. **KV eviction storm**                                                                                                                                                                                                                                                              

### कैडेन्स

- **每周**                                                                                                                                                                                                                                                              
- **每月** 针对特定场景 安排 खेल दिवस;跨团队参与; पोस्टमॉर्टम。
- **每季度** क्रॉस-टीम रेसिलेबिलिटी ऑडिट;निर्भरता मानचित्र अद्यतन करना

### उपकरण

- **Harness Chaos Engineering** 商业工具;AI से प्राप्त प्रयोगों की सिफारिशें; विस्फोट त्रिज्या घटाना;MCP उपकरण एकीकरण
- **LitmusChaos** सीएनसीएफ स्नातक; कुबेरनेट्स कार्यप्रवाह पर आधारित है。
- **Chaos Mesh** सीएनसीएफ रेत बॉक्स; कुबेरनेट्स-निवासी सीआरडी 风格。
- **Gremlin** 商业工具; व्यापक समर्थन
- **AWS FIS**/**Azure Chaos Studio** प्रबंधित क्लाउड ऑफ़रों。

### से छोटा से शुरू

पहला प्रयोगः एक डिकोड प्रतिकृति को मारने के लिए एक पॉड-किल करें।

पहला एलएलएम-विशिष्ट प्रयोगः एक बार प्रदाता 429 में इंजेक्शन, 5 मिनट तक चलना।

### आप याद रखना चाहिए कि संख्या

- चार स्तर: नियंत्रण, लक्ष्य, सुरक्षा, अवलोकन क्षमता
- जलने दर विरामः पूर्वानुमान दैनिक बजट जलने के 2x──
- कैडेन्स: साप्ताहिक कैनरी, मासिक खेल दिवस, त्रैमासिक लेखा परीक्षा
- 五个LLM प्रयोग:स्मृति, नेटवर्क, प्रदाता, गलत प्रवृत्ति, केवी तूफान


```figure
i4-chaos-guard
```

## इसका उपयोग करें

`code/main.py`उपयोग सुरक्षा विमान गेट 模拟三个混沌 प्रयोगों── रिपोर्ट कौन से प्रयोगों 会触发燃烧率中断──

## 交付 यह

本课会生成 `outputs/skill-chaos-plan.md`给定堆 和成熟,选择前三实验 和工具

## अभ्यास

1. 运行 `code/main.py` किस प्रयोग ने जलने की दर के गेट को टच किया, क्यों?
2. वीएलएलएम आधारित आरएजी सेवा के लिए  डिजाइन 前五个混沌 प्रयोग──包括成功标准──
3. आप अपने जलने दर अलर्ट 暂停 एक प्रयोग  आप कैसे पता लगाने के लिए मूल कारण  है या प्राकृतिक है?
4. 论证 अराजकता  उत्पादन में चलना चाहिए, या केवल चरणों में चलना चाहिए―
5. तीन सामान्य नेटवर्क-चाओस को बताएं LLM-विशिष्ट विफलता मोड को पुनः प्राप्त करने में असमर्थ।

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
