# إعادة التأهيل والخطط والتنفيذ:解式规划

> ReAct في تيار واحد في التفكير والعمل. ReWOO سوف تفصلها: أولا وضع خطة كبيرة كاملة، ثم تنفيذها.

**类型：**الإنشاء
**语言：**Python (stdlib)
**先修要求：**المرحلة 14 · 01 (حلقة العملاء)
**时间：**~ 60 دقيقة

## 學习目标
- 解释为什么 ReWOO's Planner / Worker / Solver 拆分相比 ReAct's交错循环 能省代币并提升强度──
- 实现 a plan DAG、 a depending on the sequence of execution executor, و كذلك مجموعة من حلول نتائج العمال  全部 استخدام stdlib‬
- استخدام 2026 سنة خمس أنماط سير العمل 框架(Anthropic) ، تحكم المهام يجب أن تتخذ خطة ثم تنفيذها أو أيضا交错式 ReAct。
- 识别什么时候 الخطة والعمل من بيانات الخطة الاصطناعية للعمل على شبكة الإنترنت أو المهام المحمولة على المدى الطويل هو ضرورى.

## 问题
حلقة التفكير-العمل-الملاحظة التداولية في ReAct  بسيطة ومرنة ، ولكن كل مكالمة أداة يجب أن تحمل سياقاً كاملاً سابقًا  بما في ذلك كل فكرة سابقة. استخدام الوتينات سوف ينمو مرتين مع الارتفاع.

ReWOO(Xu et al., arXiv:2305.18323, مايو 2023) لاحظ هذا النقطة،并做取舍:先完整规划,并行 获取证据,最后组合答案──一次 LLM مكالمة 用于规划,N次 tool calls 用于证据(可以并行),一次 LLM call 用于求解── هذه取舍是用更少的灵活性(计划是静态的) تبادل更好的令牌效率和更清晰的失败模式──

## 概念
### الأدوار الثلاثة

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

المخطط 生成 DAG. كل عقدة تحدد أداة. حججها، وكذلك يعتمد على أي عقدة سابقة.`#E1`.`#E2`مثل هذه المراجع) ―― العمال  حسب الترتيب الترتيبي  تنفيذ العقدة──Solver سوف كل المحتويات拼接在一起──

### لماذا 5x أقل رموز

طول الفعل الإستعراضية 会随步数 线性增长──在第十步,   含思想 1加行动 1加观察 1加思想 2加行动 2加观察 2,依此类推── كل خطوة متوسطة 还会冗余包含原始提示──

ReWOO فقط دفع مرة واحدة خططاء على الفور(较大) 、N 个小工人 على الفور(كل مجرد نداء أداة، لا سلسلة) ومرة واحدة حلل على الفور──论文在 HotpotQA 上测得代币 减少约5x,同时绝对精度 提升 +4──

### لماذا هو أكثر قوة

إذا كان العامل 3 في ReAct يفشل، يجب أن يكون الحلقة في التدفق في طريق من الخطأ في محاولة لتحقيق التمرد. في ReWOO، العامل 3 يعود إلى سلسلة الخطأ.

### التطهير المخطط

النتيجة الثانية من مقال: لأن المخطط لا يرى مشاهدات، يمكنك استخدام نتائج المخطط 175B المعلم لتحسين نموذج 7B.

### خطة وتنفيذ (LangChain، 2023)

ستقوم فريق لانغ تشين في مقال في أغسطس 2023 بإعادة تعديل ReWOO إلى نمط واحد 名称:خطط وإجراءها.

### خطة وقانون (أردوغان وغيره، arXiv:2503.09572، ICML 2025)

خطة-و-عمل سوف يمتد هذا النمط  إلى شبكة الإنترنت طويلة الأفق ووكلاء الهاتف المحمول  المساهمة الرئيسية هي بيانات خطة اصطناعية: مولد مسار مدعوم 生成显然包含 خطة  يستخدم في نماذج خطة خطة دقيقة، مما يجعل من المهمات مثل WebArena فوق 30-50 خطوة لا تزال تعمل بشكل طبيعي، بينما يفتقد مسار ReAct في هذه الفئة من المهام 

### متى لا تختار أي

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

إن كانت المهمة مجرد مكالمة أداة واحدة، وملخصة واحدة، فلا بناء ReWOO.


```figure
rewoo-plan
```

## بناءها
`code/main.py`实现一个玩具版 ReWOO:

- `Planner` سياسة مخطط، وفقاً للخطط الإصدار اليومي
- `Worker`  من خلال السجل 分发 كل عقدة من أداة الاتصال
- `Solver` كتابة المخطوطة، دراسة الأدلة وخلق الإجابة النهائية
- قرار الاعتماد  类似 `#E1`ستتم استبدال المراجع بأخرى نتائج العمال

هذا التجربة  جواب ما هو عدد سكان عاصمة فرنسا، مستديرة إلى ملايين؟, استخدام خطة اثنين خطوات:(1) بحث عن رأس المال،(2) بحث عن سكان، ثم طلب解。

运行它:

```
python3 code/main.py
```

بعد ذلك، يظهر النتائج المكتملة، ثم يظهر نتائج العمال، في النهاية يظهر تركيب الحل.

## استخدمها
لانغغراف سوف تخطط وتنفذ  كمصفة 提供(`create_react_agent`استخدام ReAct، الرسوم البيانية المخصصة استخدام خطة- تنفيذ) ―― تدفقات كروآاي  مباشرة编码了这个模式:你预先定义任务,然后 Flow DAG 执行它们──

## 交付 it
`outputs/skill-rewoo-planner.md`في حالة الكتالوج الأداة المحددة، وفقا لطلب المستخدم 生成 ReWOO خطة DAG── فإنه سوف يكون في تسليم إلى المدير 之前验证 خطة (((أزرارية、 كل مرجع قد حل٬ كل أداة موجودة)。

## التدريب
1. على عقدة خطة مستقلة  إجراء تنفيذ عامل متوازي  فى مجموعة تتضمن 2 مجموعات متوازية من 6 عقدة يوميا، ما هي المزايا التي يمكن أن تجلب؟
2. إضافة عقدة إعادة التخطيط، عندما أي عامل عودة الخطأ 时触发──جعلي ReWOO 变成 计划-and-execut 最小改动是什么?
3. تستخدم نموذج صغير (فئة 7ب)`Planner`,并让 `Solver`استخدام نموذج الحدود. مقارنة نوعية نهاية إلى نهاية.
4. 阅读 ReWOO 论文中关于计划机蒸的第4部分──从概念上复现 175B -> 7B 的结果:你需要什么培训数据,以及如何评估计划质量?
5. لن يتم نقل هذه اللعبة إلى خطة خطة عمل: خطة هي تسلسل، وليس يوميا.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 带 تخطيطات اصطناعية  带 تخطيطات صناعية
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) وصفة إطارية
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 选择能工作的最简单模式
