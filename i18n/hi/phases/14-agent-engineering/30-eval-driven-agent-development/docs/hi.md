# Eval 驱动的代理 开发

> मानव विज्ञान का मार्गदर्शनः  सरल संकेत से शुरू करें, उन्हें समग्र मूल्यांकन के साथ अनुकूलित करें, और केवल आवश्यक समय पर कई चरणों में एजेंटिक  प्रणाली को जोड़ें।  मूल्यांकन अंतिम चरण नहीं है। यह चरण 14 में अन्य सभी विकल्पों के बाहरी चक्र को संचालित करता है।

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## 学习目标
- तीन मूल्यांकन स्तरों के बारे में बताएं  स्थैतिक बेंचमार्क  कस्टम ऑफ़लाइन  ऑनलाइन उत्पादन  तथा उनके उपयोग 
- 解释 मूल्यांकनकर्ता-अनुकूलनकर्ता 紧密循环──
- 描述2026 सर्वोत्तम प्रथाएं:evals और कोड एक साथ रखा गया, CI में संचालित,并作为PR गेट──
- चरण 14 के प्रत्येक वर्ग को इसके उत्पन्न मूल्यांकन मामले से जोड़ा जाएगा।

## 问题
एजेंट 能通过演示──它们会在生产中以演示 无法预测的方式失败── बेंचमार्क 回答的是 क्या इस मॉडल में व्यापक क्षमता है? बजाय क्या यह एजेंट मेरे उत्पाद के लिए सही पैच वितरित कर रहा है? उत्तर यह हैः तीन स्तरों पर निरंतर चल रहे मूल्यांकन में, और प्रत्येक गार्डरेल और प्राप्त नियमों को एक मूल्यांकन मामले में मैगरेट किया गया है

## 概念
### तीन मूल्यांकन स्तर

1. **Static benchmarks** उपयोग के लिए कोड SWE-बेंच सत्यापित(पढ़ना 19) 、 उपयोग के लिए ब्राउज़ करें 桌面 के वेबअरेना/OSWorld(पढ़ना 20) 、 उपयोग के लिए सामान्यवादी GAIA(पढ़ना 19) 、 उपयोग के लिए उपकरण उपयोग के लिए BFCL V4(पढ़ना 06)  उपयोग के लिए跨模型 तुलना और प्रतिगमन गेटिंग。污染是真存在的:SWE-बेंच+ 发现 32.67% समाधान रिसाव──始终报告 सत्यापित / +-ऑडिट 分数──

2. **Custom offline evals**आपके उत्पाद के रूपः
   - न्यायकर्ता के रूप में LLM ((लंगफ्यूज、फीनिक्स、ओपिक  पाठ 24)
   - निष्पादन आधारित ((运行 पैच,检查测试)
   - ट्रेक्टरी आधारित क्रिया क्रमों को सोने के साथ तुलना में दिखाएँगे; ओएसवर्ल्ड-ह्यूमन  दिखाएँ शीर्ष श्रेणी के एजेंटों को सोने का 1.4-2.7x)

3. **Online evals** 生产:
   - सत्र रीप्ले (Langfuse)
   - गार्डरेल 触发的告警(पढ़ें 16、21)
   - 单步成本 / 延迟跟踪 (पाठ 23 OTel)

### मूल्यांकनकर्ता-अनुकूलनकर्ता (Anthropic)

紧密循环:

1. प्रस्तावक 生成输出──
2. मूल्यांकनकर्ता  निर्णय लेने हेतु 
3. 反复 परिष्कृत करें, जब तक मूल्यांकनकर्ता 通過──

यह आत्म-शुद्धीकरण का एक सामान्यीकरण है। पाठ 05)। आप जो भी एजेंट प्रवाह का महत्व देते हैं, वह विश्वसनीयता बढ़ाने के लिए मूल्यांकनकर्ता-अनुकूलनकर्ता में पैक किया जा सकता है।

### 2026 सर्वोत्तम प्रथा

- बराबर को कोड के साथ रखें।
- प्रत्येक PR में CI के माध्यम से 运行――
-  मूल्यांकन स्कोर के अनुसार गेट मर्ज करना (उदाहरण के लिए 相对主要 不允许回归 > 5%)
- प्रत्येक गार्डरेल एक मूल्यांकन मामले में चित्रित किया गया है।
- प्रत्येक अनुशरण के नियम (Reflection pro-workflow learning-rule) सभी एक विफलता के मामले में प्रदर्शित होते हैं

### चरण 14 串起

चरण 14 के मध्य प्रत्येक कक्षा में मूल्यांकन मामले उत्पन्न होंगेः

| Lesson | 它生成的 Eval case |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted、infinite-loop guard |
| 02 ReWOO | 当 tool 失败时，Planner 能正确 replans |
| 03 Reflexion | 学到的 reflections 会在 retry 时应用 |
| 05 Self-Refine/CRITIC | Judge 通过 refined output |
| 06 Tool Use | Argument coercion 生效；unknown tools 被拒绝 |
| 07-10 Memory | Retrieval citations 与 sources 匹配；stale facts 失效 |
| 12 Workflow Patterns | 每种 pattern 都产生正确输出 |
| 13 LangGraph | Resume 精确复现 state |
| 14 AutoGen Actors | DLQ 捕获 crashed handlers |
| 16 OpenAI Agents SDK | Guardrail 在正确输入上触发 |
| 17 Claude Agent SDK | Subagent results 返回 orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score、WebArena success rate、OSWorld efficiency |
| 21 Computer Use | Per-step safety 捕获 injected DOM |
| 23 OTel | Spans 发出 required attributes |
| 26 Failure Modes | Detectors 标记 known failures |
| 27 Prompt Injection | PVE 拒绝 poisoned retrievals |
| 28 Orchestration | Supervisor 路由到正确 specialist |
| 29 Runtime Shapes | DLQ 处理 N% failure |

यदि आपका मूल्यांकन सूट प्रत्येक खंड को कवर करता है, तो आप चरण 14 को कवर कर रहे हैं।

### ईवल 驱动开发会在哪里失败

- **没有 baseline。**没有最后的知名-好 的评价 无法解读── भंडारण आधार रेखाएँ──
- **LLM-judge 没有 grounding。**न्यायाधीशों को भी भ्रम होगा──CRITIC pattern(Lection 05) न्यायाधीश  बाहरी उपकरणों पर आधारित आधार पर ग्राउंडिंग──
- **过拟合 evals。**⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒       ⇒ ⇒           ⇒      ⇒                                                                                                                                                                                                                                           
- **Flaky evals。**अनिश्चितता के मामले झूठी अलार्म पैदा करेंगे।


```figure
ae-eval-three-layers
```

##  इसे निर्माण
`code/main.py`एक stdlib मूल्यांकन हर्नसः

- 带 श्रेणियाँ(बेंचमार्क、कस्टम、ऑनलाइन) के मामले रजिस्ट्री
- एक स्क्रिप्ट एजेंट परीक्षण के तहत
- मूल्यांकनकर्ता-अनुकूलन लूपः प्रस्ताव, न्याय, परिष्करण, जब तक पास या अधिकतम राउंड तक पहुँचें।
- आईसी गेट:汇总 पास दर + मूल रेखा के साथ गिरावट

运行它:

```
python3 code/main.py
```

输出: प्रत्येक मामले का पास/फेल, रिग्रेशन फ्लैग, CI गेट फैसले

## इसका उपयोग करें
- एजेंट कोड के समान रेपो में मूल्यांकन मामलों को लिखना
- ऩयसे प्रत्येक PR में CI के माध्यम से उन पर काम चल रहा है 
-                                                                                                                                                                                                                                                               
- समय के साथ-साथ पास दर में बदलाव
- प्रत्येक उत्पादन विफलता एक नए मामले में बंधा होगा

## 交付 यह
`outputs/skill-eval-suite.md`एक एजेंट उत्पाद के लिए 构建三层 eval suite, समाहित CI गेट तथा प्रतिगमन ट्रैकिंग

## अभ्यास
1.  अपने उत्पादन विफलताओं में से एक ले लो  एक को लिखना  इसका मूल्यांकन मामला  आपका एजेंट  अब इसे पारित कर सकते हैं?
2. अपने डोमेन के लिए एक LLM-जज रूबरी बनाएं जिसमें तीन आयामों (वास्तविक, स्वर, दायरा) शामिल हों।
3.                                                                                                                                                                                                                                                               
4. 添加轨迹-कुशलता माप: एजेंट 相比黄金轨迹 走过多少步?
5. चरण 14 के प्रत्येक वर्ग को आपके सूट में एक मूल्यांकन मामले में मैगरेट करना है। क्या कोई कमी है?

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Static benchmark | “Off-the-shelf eval” | SWE-bench、GAIA、AgentBench、WebArena、OSWorld |
| Custom offline eval | “Domain eval” | 面向你的产品形态的 LLM-as-judge / exec / trajectory |
| Online eval | “Production eval” | Session replay、guardrail alerts、cost/latency tracking |
| Evaluator-optimizer | “Propose-judge-refine” | 迭代直到 judge 通过 |
| CI gate | “Merge blocker” | 在 eval regression 时让 build 失败 |
| Baseline | “Last-known-good” | 用于检测 regression 的 reference score |
| Trajectory efficiency | “Steps over gold” | Agent step count 除以 human expert minimum |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)                                                                                                                                                                                                                                                              
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选 बेंचमार्क
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) उपकरण उपयोग बेंचमार्क
- [Langfuse docs](https://langfuse.com/) 实践中的 evals + सत्र रीप्ले
