# स्वायत्त कोडिंग एजेंट 版图(2026)

> SWE-बेंच सत्यापित किया गया है में अवध तीन साल में 4% से बढ़कर 80.9% तक। उसी क्लाउड सोनट 4.5 में SWE-एजेंट v1 पर स्कोर 43.2%, Cline स्वायत्त पर स्कोर 59.8%  आज मॉडल के आसपास के ढांचे और मॉडल के रूप में ही महत्वपूर्ण है। OpenHands(पूर्व व्यक्ति के रूप में OpenDevin) सबसे सक्रिय MIT-अनुमोदित प्लेटफॉर्म है, इसका CodeAct लूप सीधे सांडबॉक्स में पायथन कार्यों को निष्पादित करेगा, न कि JSON कॉल में।

**类型：**学习
**语言：**Python(stdlib,CodeAct बनाम JSON उपकरण-कॉल के लिए तुलना)
**先修要求：**चरण 14 · 07(औजार का उपयोग),चरण 15 · 01(लंबी क्षितिज वाले एजेंट)
**时间：** 45 मिनट

## 问题

 किस कोडिंग एजेंट का सबसे अच्छा  है गलत प्रश्न सही प्रश्न यह है कि मेरे काम के अनुरूप कार्य वितरण में, मैं उत्पादन में चलाने वाले स्केफॉल्डिंग का उपयोग करके, मैं कैसे प्राप्त कर सकता हूं कि अंत तक विश्वसनीयता कैसे प्राप्त की जा सकती है?

2022 से 2026 के बीच, इस क्षेत्र में स्केचफोल्डिंग को पहचानना  रिट्रीवल लेयर, प्लानर, सैंडबॉक्स, संपादन-सत्यापन लूप, फ़ीडबैक प्रारूप  है भारी संरचना  क्लाउड सोनेट 4.5 में SWE-एजेंट v1 पर SWE-बेंच सत्यापित प्राप्ति 43.2% है; एक ही मॉडल पर स्थित क्लाइन के स्वायत्त स्केचफोल्ड में प्राप्ति 59.8% है।

伴随的问题是基准 和会掩盖退步──SWE-बेंच सत्यापित 已接近和,而易任务尾(500 个任务中只有161 个需要 ≤2 行) 会拉高顶部分数──真实世界质量更适合在SWE-बेंच Pro(10+ 行修改) में इस प्रकार के वितरण पर माप, जहां एक ही अग्रणी प्रणाली अभी भी केवल 2359% है──

## 概念

### SWE-बेंच को समझने के लिए

SWE-bench(Jimenez et al.) चयनित करने के साथ मूल-सत्य पैच के साथ वास्तविक GitHub मुद्दों,并要求代理 生成一个补丁,让测试套件 通过──SWE-bench Verified(OpenAI,2024) एक 500 任务子集,移除含糊和损坏的任务──SWE-bench Pro 是更难的后后版本  任务要求 10+ 行修改, वर्तमान सीमा एजेंटों का हिस्सा 2359%──

### 2022 → 2026 曲线真正说明了什么

- **2022**:अनुसंधान मॉडल में मूल एसवीई-बेंच ऊपर 4%
- **2024**:GPT-4 + डेविन शैली के स्केफॉल्डिंग  14%;SWE-एजेंट  12% 
- **2025**:Claude 3.5/3.7 Sonnet में Aider और SWE-एजेंट के बीच 4055% 区间
- **2026**:क्लाउड सोनेट 4.5 तथा सीमावर्ती प्रतियोगी SWE-बेंच पर सत्यापित ऊपर 7080%+── युग AI के शीर्ष बोर्ड में वास्तविक समय में इस स्थिति का पालन किया गया।

यह आवृत्ति तीन ओवरलोड स्रोतों से आती हैः बेहतर आधार मॉडल, बेहतर मंचन, कोडएक्ट, प्रतिबिंब, सत्यापन लूप, तथा बेहतर बेंचमार्क, सत्यापित, शोर हटाने)

### CodeAct बनाम JSON 工具调用

OpenHands(All-Hands-AI,arXiv:2407.16741, पूर्ववर्ती के रूप में OpenDevin) एक विशिष्ट संरचना शर्त लगाता हैः मॉडल को होस्ट द्वारा निष्पादित नहीं करना 解码并执行的 JSON उपकरण कॉल, बल्कि मॉडल को पायथन कोड निष्पादित करना,并由 Jupyter-style kernel在沙盒中运行──एजेंट इसे एक कार्रवाई में अंदर के माध्यम से फ़ाइलों、串联工具,并捕获自己的例外──

权衡如下:

- **JSON tool calls**: प्रत्येक क्रिया एक बारी है; ऑडिट करने में आसान; रचनात्मकता सीमित है;默认更安全, चूंकि प्रत्येक कॉल में स्पष्ट सत्यापनकर्ता है।
- **CodeAct**: एक कार्रवाई पूरे कार्यक्रम हो सकता है; संरचनात्मकता है; कठोर रेत बॉक्स की आवश्यकता है(OpenHands उपयोग Docker अलगाव); विफलता मोड सहित रेत बॉक्स रनटाइम 允许的任何行为──

两种架构都已用于生产──CodeAct在开放平台中占主导(OpenHands、smolagents)──JSON उपकरण कॉल 在管理服务中仍占主导(Anthropic Managed Agents、OpenAI सहायक),因为提供商 控制执行者──

### 2026 版图中的 धरातल

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### क्यों गढ़ाई 占主导

एक बार कोडिंग रन एक लंबी क्षितिज की पटरियों का एक भाग है।

1. **Retrieval**: ढूंढना पढ़ना चाहिए सही फाइलें है चुपके की बोतल──SWE-agent के ACI、OpenHands के फाइल-इंडेक्स, साथ ही साथ Aider के repo-map इस समस्या का समाधान कर रहे हैं──
2. **Verifier loop**:运行测试、读取堆痕迹、再试,在SWE-bench上能带来10+ 分差──
3. **Failure containment**: बाहर गलत समय पर रोलबैक के सैंडबॉक्स                                                                                                                                                                                                                                                        

### बेंचमार्क 和与真实分布

OpenHands लेखक तथा Epoch AI ने बताया कि SWE-bench Verified  आसान पूंछ की उपस्थिति:500 个任务中161 个 只有12 行修改──高分部分由这个 पूंछ 驱动──SWE-bench Pro 限定为10+ 行修改, यहां तक कि सीमांत प्रणालियों में भी,分数也只有2359%──आपका उत्पादन वितरण लगभग निश्चित रूप से अधिक निकट प्रो के करीब है, सत्यापित नहीं है──

选择代理的含义是: अपने स्वयं के बग बैकलॉग 上运行一个类似Pro 的子集──真正重要的分数,是代表你实际交付内容的任务上的分数──


```figure
a5-scaffold-delta
```

## इसका उपयोग करें

`code/main.py`एक निश्चित मिनी-कार्य वितरण में ऊपर दो खिलौना एजेंट स्टफल्ड की तुलना करेंः

1. एक **JSON tool-call**एक कदम उठाने के लिए प्रत्येक मोड़ पर, एक कदम उठाने के लिए।
2. एक **CodeAct**स्टेफन, प्रत्येक कार्रवाई एक छोटा सा पायथन स्निपेट भेज सकते हैं

两者都使用模型 (परिणामवादी नियम) , इसलिए तुलना करें स्केफल्ड को मॉडल के साथ质量隔离――输见显示 CodeAct स्केफल्ड 用更少转 解决更多任务,代价是每行动的爆炸半径更大――

## 交付 यह

`outputs/skill-scaffold-audit.md`आपको प्रस्तावित कोडिंग एजेंट के ढांचे को अपनाने में मदद करने से पहले लेखा परीक्षाःपुनर्प्राप्त गुणवत्ता, सत्यापक उपस्थिति, रेत बॉक्स अलगाव, तथा बेंचमार्क-टू-डिस्ट्रीब्यूशन फिटमेंट

## अभ्यास

1. 运行 `code/main.py` एक ही कार्य सेट में ऊपर, प्रत्येक तख्ते  कितना मोड़ की जरूरत है? प्रत्येक तख्ते के प्रति कार्रवाई विस्फोट त्रिज्या क्या है?

2. 阅读OpenHands paper(arXiv:2407.16741) ⋅ यह पेपर 认为 CodeAct 在复杂任务上优于JSON工具调用──找到纸 承认一个失败模式,并写一句说明该模式 什么时候会在生产中占主导──

3. अपने बग बैकलॉग से 中 चुनें एक आवश्यकता दो फ़ाइलों के पार 修改 10+ 行的任务──估计边界模型 在 (a) JSON उपकरण कॉल 和 (b) CodeAct 下的端到端成功概率──说明差距的理由──

4. SWE-बेंच सत्यापित 161  एकल फ़ाइल 12 行任务──构建一个排除它们的分数──领导板 会如何重新排列?

5. 阅读 SWE-bench Verified(OpenAI)  को पेश करना, अस्पष्ट कार्यों को हटाने के लिए विशिष्ट पद्धति का उपयोग करने के लिए व्याख्या,并说出一种策略 会漏掉的类别──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|---|---|---|
| SWE-bench | “Coding benchmark” | 带有 ground-truth patches 和 test suites 的真实 GitHub issues |
| SWE-bench Verified | “Cleaned subset” | 500 个经过人工筛选的任务，存在 easier-tail |
| SWE-bench Pro | “Harder subset” | 10+ 行修改；frontier 得分为 23–59% |
| CodeAct | “Code-as-action” | Agent 发出 Python；Jupyter-style kernel 在 sandbox 中执行 |
| JSON tool call | “Function calling” | 每个 action 都是执行前经过验证的 structured JSON payload |
| Scaffold | “Agent framework” | 围绕基础模型的 retrieval + planner + executor + verifier loop |
| ACI (Agent-Computer Interface) | “SWE-agent's format” | 为 LLM ergonomics 设计的 command set，而不是 human shells |
| Verifier loop | “Test-and-retry” | 运行 tests、读取 output、修订 patch；最大的非模型可靠性收益 |

## 延伸阅读

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) मूल बेंचमार्क एवं पद्धति¬
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) क्यूरेट उपसमूह  किस प्रकार का निर्माण किया गया है
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和 घटना प्रवाह 设计──
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的分数──
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) दीर्घ क्षितिज कोडिंग एजेंट विश्वसनीयता फ्रेमिंग。
