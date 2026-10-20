# कैपस्टोन 17  व्यक्तिगत एआई ट्यूटर(自适应、बहुआयामी、带 स्मृति)

> Khanmigo(Khan Academy)、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在2026 में बड़े पैमाने पर वितरित किया गया स्व-अनुकूलन मल्टीमोडल 辅导──共同形态是苏格拉底政策(绝不只是直接给出答案)、每次交互后都会更新的学习者模型(बेईशियन ज्ञान ट्रैकिंग 风格)、语音 + पाठ + फोटो-गणित 输入、课程图 检查索、空间-पुनरावृत्ति 调度,以及针对适龄内容的严格安全过器──本 Capstone 需要支付给特定学科的教师的K-12 बीजगणित或 Python 序文),使用10名学习者运行一次为期并两周的效果研究,通过内容安全审核──

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

## 问题
स्व适应辅导过去曾经是 ed-tech 研究中的小众方向――到2026年,它已经成为消费级产品――Khanmigo 已部署到美国大多数学区――Duolingo Max 已达到数千万 MAU――Google के LearnLM / Gemini for Education 为 Google Classroom में辅导能力――Query Q-Chat और फ्लैशकार्ड 并列使用――Synthesis Tutor 凭借 tutor-for-curious-kids 走红红――共同要素包括:बहुआयामी 输入打字、说话、拍摄方程)、Socratic pedagogy(先问,后话解释)、每交互都会更新学习者模型,以及严格的适龄安全――

आप एक विशिष्ट समूह के लिए एक प्रणाली का निर्माण करेंगे। माप मानक एक वास्तविक प्रभाव अध्ययन है। 10 के लिए एक विशेष समूह के लिए एक वास्तविक प्रभाव अध्ययन है।

## 概念
चार घटक**Tutor policy**यह एक सोक्रेटिक लूप हैः जब छात्र उत्तर मांगते हैं, तो नीति मार्गदर्शन संबंधी प्रश्नों को उठाएगी; जब वे उत्तर देते हैं, तो यह अगले अवधारणा में प्रवेश करेगी; जब वे कैद रहते हैं, तो यह एक मंचित संकेत प्रदान करेगा।**Learner model**यह बेईसी ज्ञान ट्रैकिंग है, या एक सरल परिवर्तन), प्रत्येक पाठ्यक्रम नोड की प्रभुत्व संभावना को प्रत्येक बातचीत के बाद अद्यतन करना है।**Curriculum graph**यह एक अवधारणाओं को शामिल करता है और आवश्यक किनारों के साथ है।**Memory**                                                                                                                                                                                                                                                              

UX है मल्टीमोडल。पाठ इनपुट उपयोग करने के लिए 输入答案── आवाज इनपुट 通过LiveKit + Whisper 实现(复用 capstone 03)。फोटो इनपुट उपयोग करने के लिए 通过dots.ocr या PaliGemma 2 处理数学题── आवाज आउटपुट 通过Cartesia Sonic-2 实现── सुरक्षा 通过Llama Guard 4 加一个适龄过器(阻止成人内容暴力、自伤),并使用 COPPA- जागरूक स्मृति भंडारण नीति──

效果研究是交付物──10 名学习者,pre-test 和 post-test,为期两周──报告学习获益 delta 和信心间隔──与非适应基线对比(同内容以线性方式交付,不使用导师政策) 

## 架构
```
learner device
  |
  +-- text         -> web app
  +-- voice        -> LiveKit Agents (ASR + TTS)
  +-- photo math   -> dots.ocr / PaliGemma 2
       |
       v
  tutor policy (LangGraph)
       - Socratic decision head
       - next-concept chooser (curriculum graph walk)
       - hint scaffolder
       - mastery update
       |
       v
  learner model (BKT / item-response theory)
       - per-concept mastery probability
       - spaced-repetition scheduler (SM-2 or FSRS)
       |
       v
  memory (agentmemory-style)
       - episodic: every interaction
       - semantic: learned mistakes, preferences
       - retention policy: COPPA / GDPR aware
       |
       v
  curriculum graph (Neo4j)
       - prerequisite edges
       - OER content attached
       |
       v
  safety:
    Llama Guard 4 + age-appropriate filter
    memory access guarded by learner ID scope
```

## 技术
- 学科选择:K-12 बीजगणित या परिचय Python(选择一个深入做)
- ट्यूटर नीतिः आधारित क्लाउड Sonnet 4.7 की LangGraph(带 त्वरित कैशिंग)
- लर्नर मॉडलःबेयिसियन ज्ञान ट्रैकिंग (शास्त्रीय) या अंतराल के लिए उपयोग किया जाने वाला FSRS
- पाठ्यक्रम ग्राफः अवधारणाओं + पूर्व शर्त किनारों + OER सामग्री को शामिल किया गया
- स्मृतिःएजेंटस्मृति 风格的持久 वेक्टर + एपिसोडिक + अर्थशास्त्र भंडार
- आवाजःलाइवकिट एजेंट 1.0 + कार्टेशिया सोनिक-2(复用 capstone 03 उप-स्टैक)
- फोटो गणितः डॉट्स.ओसीआर या पालीगेम्मा 2 उपयोग के लिए समीकरण पहचान
- सुरक्षाःलामा गार्ड 4 + 自定义适龄 फ़िल्टर
- Eval:फूल स्तर  समस्या उत्पन्न、पूर्व/पश्चात परीक्षण हर्नर、प्रभाव्यता अध्ययन उपकरण


```figure
cf-tutor-loop
```

##  इसे निर्माण
1. **Curriculum graph.**构建一个包含50-150 个概念节点的Neo4j(उदाहरण के लिए K-12 बीजगणित, "संख्या रेखा" से "क्वाड्रैटिक सूत्र")),并带有先决边缘──为每个节点 附加 OER内容(Open Textbook、OpenStax)──

2. **Learner model.**प्रयोग पूर्वोत्पत्ति प्रारम्भिकता बेईसी ज्ञान अनुवर्ती: अनुमान, स्लिप, सीखने की दर।

3. **Tutor policy.**LangGraph 节点 शामिल हैंः`read_signal`(学习者答案是正确 / 部分正确 / 卡住?)`select_concept`(पाठ्यक्रम ग्राफ भर में, प्राथमिकता सर्वोच्च अवधारणा का चयन करें)`scaffold`(सोक्रेटिक संकेत)`update_mastery`

4. **Memory.**प्रत्येक बातचीत एपिसोडिक स्टोर में लिखी जाती है।

5. **Voice path.** LiveKit एजेंट्स कार्यकर्ता 接入 ट्यूटर नीति。ASR 使用 Whisper-v3-turbo──TTS 使用 Cartesia Sonic-2──支持 barca-in(复用 capstone 03 机制)。

6. **Photo-math path.**上传或拍摄图片;运行 dots.ocr अथवा PaliGemma 2 识别方程;以结构化输入形式传给导师──

7. **Safety.**प्रत्येक मॉडल आउटपुट से गुजरता है Llama Guard 4 + 适龄 filter(阻止自伤、成人内容、暴力) ――मेमोरी एक्सेस 根据学习者 ID 设定范围;提供家长删除入口。

8. **Efficacy study.**10 名学习者, पूर्व-परीक्षा(標準化 30 题基线),两周教师互动(每周3 次会议), पोस्ट-परीक्षा──与 10 名学习者组成、使用相同内容的非适应基线队对比──

9. **Weekly progress reports.**प्रत्येक छात्र के लिए स्वचालित रूप से पीडीएफ सारांश उत्पन्न करें, जिसमें खोजे गए विषयों, मास्टर ट्रेक्टरी और अगले चरणों का सुझाव दिया गया है।

## इसका उपयोग करें
```
learner: "I don't understand why 3x + 6 = 12 means x = 2"
[signal]   stuck
[concept]  'isolating variables' (prerequisite: addition-subtraction-equality)
[scaffold] "what number would you subtract from both sides to start?"
learner: "6"
[signal]   correct
[mastery]  addition-subtraction-equality: 0.62 -> 0.77
[concept]  continue 'isolating variables'
[scaffold] "great. now what is 3x / 3 equal to?"
```

## 交付 यह
`outputs/skill-ai-tutor.md`                                                                                                                                                                                                                                                              

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## अभ्यास
1. ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

2. 添加一个多模拟探测:同一个概念问题 分别以文字、声音 和照片 形式交付──衡量学习者是否在其偏好的模式下更快收──

3. 构建家长仪表板:练习过的话题、掌握轨迹、即将学习的概念、安全事件(任何防线撞击)

4. 添加 भाषा-स्विच मोड:tutor 接受 स्पेनिश 输入并用 स्पेनिश 教学──衡量 X-Guard कवरेज──

5. स्मृति गोपनीयता पर दबाव परीक्षण करें: सत्यापन छात्र A यहां तक कि आवाज-क्लिप के माध्यम से फिर से हमला भी नहीं देख सकता छात्र B के डेटा।

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Socratic policy | "Ask, do not dump" | Tutor 提出引导性问题，而不是直接给出答案 |
| Bayesian knowledge tracing | "BKT" | 用于每个 concept mastery probability 的经典 learner-model equations |
| FSRS | "Free Spaced Repetition Scheduler" | 2024 年 spaced-repetition scheduler，比 SM-2 更好 |
| Curriculum graph | "Concept DAG" | 包含 concepts 与 prerequisite edges 的 Neo4j |
| Episodic memory | "Per-interaction log" | 存储每次交互以便后续检索 |
| Semantic memory | "Learned pattern store" | 从 episodic 中压缩并提升出来的错误和偏好 |
| COPPA | "Kids privacy law" | 美国法律，限制从 13 岁以下儿童收集数据 |

## 延伸阅读
- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) 消费级 K-12 शिक्षक 参考
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) भाषा सीखने के शिक्षक 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com) स्टार्टअप 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) अंतराल-पुनरावृत्ति अनुसूचक
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) छात्र-मॉडल क्लासिक
- [LiveKit Agents](https://github.com/livekit/agents) आवाज स्टैक
