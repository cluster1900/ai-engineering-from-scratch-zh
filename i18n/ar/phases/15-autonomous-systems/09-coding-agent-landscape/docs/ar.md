# وكيل التشفير الذاتي 版图(2026)

> SWE-bench Verified في غضون ثلاث سنوات من 4%  ارتفاع إلى 80.9%。 نفس كلود سونيت 4.5 في SWE-agent v1 على نسبة 43.2% ، في Cline مستقلة على نسبة 59.8%  اليوم حول النموذج على نفس القدر من الأهمية. OpenHands(المعركة السابقة على OpenDevin) هي المنصة الأكثر نشاطا MIT المرخصة ، وتعمل خليط CodeAct مباشرة في صندوق الرمال Python ، وليس مكالمات JSON.

**类型：**學习
**语言：**Python(stdlib,CodeAct مقابل JSON أداة-دعوة مقابل)
**先修要求：**المرحلة 14 · 07(استخدام الأدوات)
**时间：**45 دقيقة

## 问题

أيه من وكلاء التشفير أفضل إنها مشكلة خاطئة الصحيح هو: في توزيع المهام التي تناسب عملي، باستخدام الرفوفولد الذي سأقوم به في الإنتاج، كيف يمكنني الحصول على نوع من الوقوف على النهاية؟

بين 2022 و 2026 ، يدرك هذا المجال الرفوفدغ  استرجاع الطبقة ‬المخطط‬الصندوق‬التحرير-التحقق من الحلقة‬صيغة الرجوع‬ هو تحمل التركيبة‬Claude Sonnet 4.5 في SWE-agent v1 فوق SWE-bench Verified 得分是 43.2%؛ النتيجة نفس النموذج في الرفوف الذاتي في Cline هي 59.8%‬

المشكلة المرافقة هي المراقبة 和会掩盖退步──SWE-bench Verified 已接近和,而容易任务尾(500 个任务中有 161 个只需要 ≤2 行) 会拉高顶部分数──真实世界质量更适合在SWE-bench Pro(10+ 行修改)

## 概念

### معنى الفهم

SWE-bench(Jimenez et al.) Selection带有基底真相补丁的真实GitHub issues,并要求代理 生成一个补丁,让测试套件 通过──SWE-bench Verified(OpenAI,2024) هو 500 任务子集,移除含糊和损坏的任务──SWE-bench Pro 是更难的后后版本  任务要求 10+ 行修改,目前边境代理得分为 2359%──

### 2022 → 2026 曲线真正说明了什么

- **2022**: نماذج البحث في البنك SWE الأصلي حوالي 4%
- **2024**:GPT-4 + ديفين نمط الرفوف حوالي 14%؛SWE-وكيل حوالي 12%
- **2025**:كلود 3.5 / 3.7 سونيت في عازف و SWE-منتج في 40 55% 区间
- **2026**:كلود سونيت 4.5 و منافسيه الحدود في SWE-البنك تأكدت ارتفاع الارتفاع إلى 7080%+──

هذا المعدل من ثلاثة مصادر: أفضل أساس نموذج، أفضل منصة ((CodeAct، التفكير، خليط التحقق) ، فضلا عن أفضل المعايير ((تحقق  تحويل الضوضاء) ").

### CodeAct مقابل JSON 工具调用

OpenHands ((All-Hands-AI,arXiv:2407.16741, سابقة لـ OpenDevin) جعل رهان بنية محددة: ليس جعل النموذج يخرج من المضيف 解码并执行 JSON tool calls, بل جعل النموذج يخرج من رمز Python,并由 Jupyter-style kernel 在沙盒中运行它── وكيل يمكن أن يكون في عمل واحد داخل جميع الملفات、 سلسلة الأدوات,并捕获 استثناءات الخاصة بك──

权衡如下:

- **JSON tool calls**: كل عمل هو دور واحد؛ سهل التحقيق؛ التركيب محدود؛ الاعتراف أكثر أمانا، لأن كل مكالمة تمر عبر مؤكد واضحة.
- **CodeAct**: عمل واحد يمكن أن يكون برنامج كامل ؛ تمتلك التركيب ؛ تحتاج إلى صندوق رمل صلبة ((OpenHands استخدام عزل دوكر) ؛ أوضاع الفشل بما في ذلك وقت تشغيل صندوق رمل 允许的任何行为。

تم استخدام نوعين من التكوينات في الإنتاج. كود اكت في المنصة المفتوحة.

### 2026 版图中的 منصات

| Scaffold | License | Execution model | Notable property |
|---|---|---|---|
| OpenHands (OpenDevin) | MIT | Docker 中的 CodeAct | 最活跃的 open platform；event-stream 可 replay |
| SWE-agent | MIT | Agent-Computer Interface (ACI) | 第一个端到端 SWE-bench scaffold |
| Aider | Apache-2 | local repo 中 edit-via-diff | Minimal scaffold，regression stability 强 |
| Cline | Apache-2 | 带 tool policy 的 VS Code agent | Sonnet 4.5 上得分最高的 open scaffold |
| Devin (Cognition) | Proprietary | Managed VM + planner | 第一个“AI software engineer”产品类别 |
| Claude Code | Proprietary | Permission modes + routines | Lesson 10 会详细讲解 agent loop |

### لماذا الرفوف يسيطرون

1ـ عملية تشغيل هي 1ـ مسار طويل الأفق (درس 1)

1. **Retrieval**: العثور على الملفات الصحيحة التي يجب قراءتها هو علبة صامتة. مؤشر الملفات ACI, OpenHands وكذلك خريطة الاسترداد Aider في حل هذه المشكلة.
2. **Verifier loop**:运行测试、读取堆痕迹、再试,在SWE-bench 上能带来10+ 分差──
3. **Failure containment**: إصلاحات: الصندوق الرملي يمكن إعادة التدوير في الوقت المناسب 能防止损害累积──有验证循环 和没有验证循环的同样模型,看起来像两个不同的产品──

### المرجعية 和与真实分布

OpenHands المؤلفون و Epoch AI قد أشاروا إلى وجود SWE-bench Verified  وجود ذيل سهل: 500 个任务中有 161 个 只有 12 行修改.

تعني وكيل اختيار: في مخلفات البغ الخاصة بك 上运行 a مثل Pro 的子集── 真正重要的分数,是代表你实际交付内容的任务上的分数──


```figure
a5-scaffold-delta
```

## استخدمها

`code/main.py`في توزيع مصغر المهام محدد، قم بتقارن اثنين من أجهزة العباء:

1. واحد**JSON tool-call**على الرف، كل دوراً
2. واحد**CodeAct**على الرف، كل عمل يمكن أن يخرج جزء صغير من كلمات Python.

两者都使用 stub 模型(القواعد التحديدية) ، لذلك مقارنة سيضع الرف مع模型质量隔离──输见显示 CodeAct الرف باستخدام أقل جولات 解决更多任务,代价是每行动的爆炸半径更大──

## 交付 it

`outputs/skill-scaffold-audit.md` مساعدتك في اعتماد الجهاز التشفير المُقترح  قبل إجراء مراجعة:جودة الاسترداد  وجود المحقق ‬عزل صندوق الرمل، وكذلك تناسب المعايير للتوزيع‬‬

## التدريب

1. 运行 `code/main.py`في مجموعة المهام نفسها، كل منصة تحتاج إلى كم من التحولات؟ ما هو نصف قطر انفجار لكل منصة؟

2. 阅读OpenHands paper(arXiv:2407.16741)。 هذا الورق 认为 CodeAct 在复杂任务上优于JSON工具调用──找出纸 承认一个失败模式,并写一句话说明该模式 什么时候会在生产中占主导──

3. من سجل الخلفية الخاص بك في اختيار واحد يحتاج إلى اثنين من الملفات  تغيير 10 + 行的任务── تقدير نموذج الحدود في (أ) JSON أداة الاتصال 和 (ب) CodeAct 下的端到端成功概率──说明差距的理由──

4. هناك 161 ملف واحد 2 行任务  بناء واحد لتفريغهم 

5. 阅读 دخول SWE-bench Verified(OpenAI) ―― شرح لتحويل المنهج المحدد للمهام المزدوجة،并说出一种策略 会漏掉的类别──

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

- [Jimenez et al. — SWE-bench](https://www.swebench.com/) المقياس الأول و المنهج
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) مجموعة فرعية هي كيفية بناءها
- [Wang et al. — OpenHands: An Open Platform for AI Software Developers](https://arxiv.org/abs/2407.16741) CodeAct 架构和事件-stream 设计──
- [Epoch AI — SWE-bench leaderboard](https://epoch.ai/benchmarks) 实时追踪的分数──
- [Anthropic — Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) إطار موثوقية وكيل التشفير على الأفق الطويل
