# एआई एसआरई  मल्टी-एजेंट 事件响应、 रनबुक、预测性检测

> एआई एसआरई ाराग के माध्यम से बुनियादी ढांचे के डेटा पर आधारित एलएलएम (LLCs) का उपयोग करके, गतिशीलता सर्वेक्षण, दस्तावेज रिकॉर्ड और समन्वय चरण से आता है। 2026 के लिए, एआई एसआरई ाराग के माध्यम से बुनियादी ढांचे के डेटा पर आधारित एलएलएम (LLCs) का उपयोग करके, एआई एसआरई ाराग के माध्यम से कई एजेंटों के साथ समन्वय (Multi-agent orchestration)                                                                                                                                                                                                         

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## 学习目标
- 画出 बहु-एजेंट AI SRE 架构图:निरीक्षक + विशेषज्ञ एजेंटों (日志、指标、runbooks) + मानव अनुमोदन गेट
- 解释为什么自动补救的范围很窄(पुनः启动 pod、revert deploy),而不是很宽 ((पुनः आर्किटेक्ट सेवा) 
- 模式 (NewBird Hawkeye): दो मॉडल一致 = 置信;不一致 = बढ़ना。
- 引用 MIT 89% प्रारंभिक पता लगाने के परिणाम, तथा परिचालन बाधाः कोई संचालितता का पूर्वानुमान केवल डैशबोर्डों

## 问题
एक ऑन-कॉल इंजीनियर ने सुबह 3 बजे सूचना प्राप्त कीः चेकआउट के बीच त्रुटि दर  बहुत अधिक है उन्होंने डाटाडॉग, लोकी, तीन रनबुकों का निरीक्षण किया  डिप्लोय लॉग 30 मिनट बाद, उन्हें एहसास हुआ कि मूल कारण केवी कैश स्पाइक है  ने VLLM OOM का कारण बनता है उन्होंने पॉड को पुनरारंभ किया; त्रुटि गायब हो गयी

2026 तक, इस प्रकार के सर्वेक्षण के पहले 20 मिनट स्वचालित हो सकते हैं। सेवा संवर्धन की तारीख के अनुसार, हाल ही में तैनात किए गए रनबुकों को समायोजित करें। ये सभी आरएजी + टूल-यूज हैं। एक पर्यवेक्षित एजेंट पहले पास ट्रायल को पूरा कर सकता है और एक परिकल्पना दे सकता है।

完全自主修复是另一个问题──Restart pod:安全──Scale GPU pool:如果政策 允许则安全──重新构建服务:绝对不行──关键原则是划清这条狭窄边界──

## 概念
### बहु-एजेंट वास्तुकला

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

पर्यवेक्षक घटना को उप-प्रश्न में विभाजित करेगा।

### स्व-समाधान की सीमा

**Safe (narrow)**:पुनः आरंभ करें पॉड, विशिष्ट तैनाती को पुनर्स्थापित करें, पूर्व अनुमोदित सीमाओं के भीतर पैमाने पूल, पूर्व अनुमोदित सुविधा ध्वज को सक्षम करें।

**Not safe (broad)**:更改服务拓学、修改资源限制、新代码部署、更改IAM、修改数据库──

 कोई भी इसे बेचता है और इसे भूल जाता है  लोग अत्यधिक प्रतिबद्ध हैं 

### 对抗性评估 (नई पक्षी हॉकी)

 दो मॉडल एक ही घटना का स्वतंत्र विश्लेषण करते हैं  यदि वे मूल कारण के साथ सहमत हैं, तो विश्वास अधिक है यदि वे असहमत हैं, तो दो दृश्य परिकल्पनाओं के साथ मानव को  सरल मॉडल, लेकिन भ्रामक मूल कारणों का प्रभावी तंत्र

### परिचालन स्मृति

团队人员流动是传统SRE的隐形杀手 部落知识 会流失──AI SRE रनबुक + पोस्ट-मॉर्टम 存入 वेक्टर DB;एजेंट 会在每一个新事件中检索──当新工程师加入时,AI 拥有完整历史──

### घटना से पूर्व भविष्यवाणी

MIT 2025 अध्ययन: पर परीक्षण सेट ऊपर, इतिहास इतिहास इतिहास, GPU तापमान, एपीआई, त्रुटि मोड प्रशिक्षण के LLM, में से 89% पर आ गया है, में से 10-15 मिनट पूर्वानुमान के दौरान टूटने से पहले।

现实检查:没有动作的预测只是仪表板――操作问题是:当我们预测到时,要做什么?预防性排水?

### 2026 में उत्पाद

- **Datadog Bits AI** डाटाडॉग 内部的托管 SRE सह पायलट──
- **Azure SRE Agent** Azure-निवासी──
- **NeuBird Hawkeye** प्रतिकूल मूल्यांकन + परिचालन स्मृति。
- **PagerDuty AIOps** triage + deduplication──
- **Incident.io Autopilot** घटना कमांडर + समन्वय

### कोड के रूप में रनबुक

रनबुक से Confluence  पृष्ठ विकास के लिए带有结构化章节 ([[संकेत]], परिकल्पना, सत्यापन, कार्य) के संस्करणबद्ध मार्कडाउन।

### संख्याओं को याद रखना चाहिए

- एमआईटी प्रारंभिक पता लगानेः89% का विराम, 10-15 मिनट लीड समय
- बहु-एजेंट triage:supervisor +(日志、指标、runbooks) + मानव
- सुरक्षित ऑटो-रेमेडिएशन सेटःपुनः आरंभ कक्ष  रिवर्ट डिप्लोय 
- प्रतिकूल मूल्यांकन: दो मॉडल स्वतंत्र; सहमति = विश्वास


```figure
i4-incident-agents
```

## इसका उपयोग करें
`code/main.py`模拟 बहु-एजेंट triage:लॉग एजेंट 找到错误,मीट्रिक एजेंट 找到 CPU spike,runbook एजेंट 匹配到已知问题── पर्यवेक्षक परिकल्पना 排序──

## 交付 यह
本课会生成 `outputs/skill-ai-sre-plan.md`                                                                                                                                                                                                                                                              

## अभ्यास
1. 运行 `code/main.py`यदि लॉग और मीट्रिक एजेंट असंगत होंगे तो पर्यवेक्षक  कैसे हल करेंगे?
2. आपकी सेवा को परिभाषित करने के लिए तीन सुरक्षित स्वयं-संशोधन कार्यवाही 
3. 编写一个结构化 रनबुक टेम्पलेट:भागों, आवश्यक फ़ील्ड, सत्यापन कमांड्स
4. भविष्यवाणी पता लगाने 提前 12 分钟触发. आपकी नीति क्या है  पेजर  पूर्व-निर्वहन, या दोनों ही है?
5. 论证 एक 3 人团队 को 2026 में एआई एसआरई को अपनाना चाहिए, या प्रतीक्षा करना चाहिए।

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| AI SRE | “agent for on-call” | LLM-backed incident investigation + coordination |
| Supervisor agent | “the orchestrator” | 将 incidents 拆分为 sub-queries 的顶层 agent |
| Specialized agent | “domain agent” | 拥有 tool access（日志、指标、runbooks）的 sub-agent |
| Auto-remediation | “AI fixes it” | 狭窄的预先批准 action；不是宽泛的 re-architecture |
| Operational memory | “vector runbooks” | vector DB 中用于 RAG 的 post-mortems + runbooks |
| Adversarial eval | “two-model check” | 独立分析；agreement = confidence |
| NeuBird Hawkeye | “the adversarial one” | 具备 adversarial-eval + memory pattern 的产品 |
| Bits AI | “Datadog's SRE agent” | Datadog 托管的 AI SRE |
| Pre-incident prediction | “early detection” | outage prediction 的 10-15 分钟 lead time |

## 延伸阅读
- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
