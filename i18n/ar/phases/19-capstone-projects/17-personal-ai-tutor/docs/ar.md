# كابستون 17  معلم الذكاء الاصطناعي الشخصي ((自适应、多模的、带 ذاكرة)

> Khanmigo(Khan Academy)、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在2026年规模化交付自适应多模式辅导──共同形态是苏格拉底政策(绝不只是直接给出答案)、每次交互后都会更新的学习者模型(Bayesian knowledge tracing 风格)、语音 + نص + 图片 -数学 输入、课程图 检查索索索、空间 - 调度,以及针对适龄内容的严格安全过──本 Capstone 需要支付给特定学科的导师面对K-12 代数或 Python 序幕),使用10名学习者运行一次为期期两周的效果研究,通过内容安全审审审.

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:**P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

## 问题
في الماضي كان ذلك هو الوسائل التكنولوجية في دراسة التكنولوجيا. في عام 2026 ، أصبح هذا المنتج منتجًا للاستهلاك. في معظم مناطق التعلم في الولايات المتحدة. في الوقت الحالي ، يصل عدد الوسائل التكنولوجية إلى مئات الملايين من المستخدمين. في Google ، يقدم التعلم لـ LearnLM / Gemini for Education القدرة على تقديم التدريب في الفصول الدراسية. في كل مرة يتم فيها استخدام كويزلت Q-Chat وبطاقات الفلاش.

ستقوم ببناء نظام واحد من هذه النظم لفرقة محددة. ستعمل دراسة نتائج حقيقية. ستعمل في الدراسة في فترة ما قبل الاختبار و بعد الاختبار.

## 概念
أربعة مكونات**Tutor policy**هو حلقة سقراطية: عندما يتطلب المتعلمون الإجابة، ستقترح السياسة مسألة توجيهية؛ عندما يجيبون عليها، ستدخل في المفهوم التالي؛ عندما يقعون فيها، ستقدم إشارة مستقرة.**Learner model**هو تعقب المعرفة البايسية ((أو مجرد تغير) ، في كل تبادل بعد تحديث احتمالية إتقان كل عقدة منهجية.**Curriculum graph**هو واحد يحتوي على مفاهيم مع الحدود المطلوبة من Neo4j؛ السياسة 穿越该图 来选择下一个概念──**Memory**هو متجر حلقة + تعبيرات (استجابة) ، حفظ过往交互、错误和偏好。

UX هو متعدد الحركات. تدخل النص يستخدم ل输入答案. تدخل الصوت 通过LiveKit + Whisper 实现(复用 capstone 03)  مدخل الصورة يستخدم لعبور نقاط.ocr أو PaliGemma 2 处理数学题── تخرج الصوت 通过Cartesia Sonic-2 实现── سلامة استخدام Llama Guard 4 加一个适龄过(阻止成人内容暴力、、自伤),并使用 COPPA-awareness memory retention policy──

效果研究是交付物物──10 名学习者,pre-test 和 post-test,为期两周──报告学习获益 delta 和信心间隔──与非适应基线对比(相同内容以线性方式交付,不使用导师政策)──

## المكونات
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
- 学科选择: K-12 الجبر أو مقدمة Python(选择一个深入做)
- سياسة المعلم: على أساس كلود سونيت 4.7 ‬ LangGraph‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- نموذج المتعلم:تتبع المعرفة البايسية ((كلاسيكية) أو استخدام الفاصل
- الرسم البياني للمنهج: يتضمن المفاهيم + الحواف المطلوبة + محتوى OER
- الذاكرة: العامل الذاكرة 风格的持久 متجه + الحلقة + مخزن معنوي
- صوت: LiveKit وكلاء 1.0 + كارتيسيا سونيك-2(复用 كابستون 03 فرعية كومة)
- صورة رياضية: نقطة. اوكر أو PaliGemma 2 تستخدم لتحديد المعادلة
- السلامة: حارس لاما 4 + 自定义适龄过器
- Eval: مستوى الزهور  مشكلة توليد  قبل/ بعد اختبار استخدامات


```figure
cf-tutor-loop
```

## بناءها
1. **Curriculum graph.**构建一个包含50-150 个概念节点的Neo4j(例如 K-12 الجبر ، من "خط الأعداد" إلى "الصيغة التربيعية") ،并带有前置边缘──为每个节点 附加 OER 内容(Open Textbook、OpenStax)──

2. **Learner model.**استخدام سابقات ابتداء علم بايزي: تخمين ▌سليط ▌تعلم معدل‬

3. **Tutor policy.**节点 LangGraph تشمل:`read_signal`(المعلمون أجاباتهم صحيحة / 部分正确 / 卡住?)`select_concept`(مخطط المنهج، اختيار المفهوم الأولويات الأعلى)`scaffold`(تعليق سقراطي)`update_mastery`.

4. **Memory.**كل مرة تصرف في متجر الحلقات. خطأ وفضول سيتم تحسينه إلى الذاكرة النطاقية. سياسة الاحتفاظ على الاعتبار:

5. **Voice path.**ستعمل على استخدام LiveKit Agents 接入 tutor policy──ASR استخدام Whisper-v3-turbo──TTS استخدام Cartesia Sonic-2──支持 barge-in(复用 capstone 03 机制)──

6. **Photo-math path.**上传或拍摄图片;运行 dots.ocr أو PaliGemma 2 识别方程;以结构化输入形式传给导师──

7. **Safety.**كل نموذج خروجه تمر عبر Llama Guard 4 + 适龄 filter(阻止自伤、成人内容、暴力) ――الوصول إلى الذاكرة 根据学习者 ID 设定范围;提供家长删除入口。

8. **Efficacy study.**10 名学习者,pre-test(标准化 30 题基线),两周导师互动(每周 3 次会议),后测试──与 10 名学习者组成、使用相同内容的非适应基线队对比──

9. **Weekly progress reports.**وكل متعلم يقوم بتوليد ملخص PDF تلقائيًا، يتضمن المواضيع التي اكتشفها، مسارات الماجستير وخطوات التالية التي يقدمها.

## استخدمها
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

## 交付 it
`outputs/skill-ai-tutor.md`هو شيء مُتَسَاعِدٍ. معلمٌ مُتَكَيفٌ مع تخصصٍ معينٍ، يُحتوي على نموذجٍ متعدد الحركات، النموذج المتعلم، والذاكرة، والأمن، والإثبات القابل للقياس.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## التدريب
1. تم إجراء دراسة فعالية في حالة تمكين ومعدل نموذج المتعلم التكيفي ((随机概念 顺序) 报告 delta。预期

2. 添加一个多模拟探测:同一个概念问题 分别以文字、声音 和照片 形式交付──衡量学习者是否在其偏好的模式下更快收──

3. 构建 parent dashboard:练习过的主题、掌握轨迹、即将学习的概念、安全事件(任何防线撞击)

4. 添加语言-switch mode:tutor 接受西بانية 输入并用西بانية 教学──衡量X-Guard تغطية──

5. على خصوصية الذاكرة  إجراء اختبار الضغط: التحقق من المتعلم A حتى من خلال المقطع الصوتي إعادة إدخال الهجوم أيضا لا يمكن أن ترى المتعلم B's بيانات ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

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
- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) 消费级 K-12 معلم 参考
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) معلم تعليم اللغة 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) 替代参考
- [Synthesis Tutor](https://www.synthesis.com) بدء العمل 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) مُخطط للجدول المتفاصل
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) نموذج المتعلم الكلاسيكي
- [LiveKit Agents](https://github.com/livekit/agents) كومة صوتية
