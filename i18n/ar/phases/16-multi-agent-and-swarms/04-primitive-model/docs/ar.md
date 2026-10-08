# نموذج بدائي متعدد الوكلاء

> كل إطار متعدد الوكلاء الذي تم إصداره في عام 2026  AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework  都是四维设计空间中的一个点──四个原始,仅此而已:agent、handoff、shared state、orchestrator──本课从零构建它们,在四个人上运行一个玩具系统,然后将每个主流框架 映射到同一组坐标轴上,让你能用一段话读懂任何新发布版本──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 问题
كل ستة أشهر سوف يكون هناك إطار جديد متعدد الوكلاء 发布──2023 سنة AutoGen──2024 سنة CrewAI──2024 سنة LangGraph 和 OpenAI Swarm──2025 سنة 4 أشهر Google ADK──2026 سنة 2 أشهر Microsoft Agent Framework RC── كل إعلان صحفي يدعي أنفسهم هو مجردة صحيحة──

إذا حاولت تعلمها بشكل فردي، ستفقد نفسك. تبدو الأجهزة التطبيقية مختلفة.

ليس كذلك، تحت حزمة التسويق، أربعة بدائيات هي ثابتة.

## 概念
### الأربعة البدائية

1. **Agent** تَعَلُّق النظام إضافة إلى قائمة الأدوات── بدون حالة؛ كلّ مرة يتمّ تشغيلها من تَعَلُّق النظام 和 الحالية تاريخ الرسائل 开始──
2. **Handoff**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
3. **Shared state** 任何能被多个代理 读取(有时也能写入) من البيانات البنية.
4. **Orchestrator** decide下一个由谁发言的角色──选项包括:显式图表(确定性)、LLM المتحدث-اختيار(soft)、上一位演讲的交付呼叫(OpenAI Swarm),或排队 上的安排器(swarm architecture)。

هذا هو المكان المكتمل للصميم. كل إطار له قيمة متضمنة.

### كيف كل إطار 2026 يخطط له

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

الاختلافات على الطابق العلوي تبدو كبيرة.

### لماذا هذا مهم

بمجرد أن تنظر إلى البدائيات، مقارنة الإطار تصبح قائمة تفقد بسيطة:

- الموسيقي هو "المنظم" (مجموعة) ، أم "مجموعة" (مجموعة) ؟
- الحالة المشتركة هو التاريخ الكامل ((GroupeChat) ، أم المُنظر إليه ((StateGraph reducer) ؟
- المديرين الموظفين يُمكن أن يُغيروا طلباتهم من بعضهم البعض أم يُمكن أن يُسلموا فقط؟

هذه الأسئلة الثلاثة يمكن أن تجيب على إطار ما ما ما إذا كان يناسب 80% من الأسئلة المحددة.

### البصيرة التي لا تملك ولاية

خارج الحالة المشتركة ، كل بدائية 都是无状态的──Agent 是 (سريعة ، أدوات) وظيفة──Handoff 是一次函数呼叫──Orchestrator 是安排者──**系统中唯一有状态的东西是 shared state。**جميع الحشرات المثيرة للاهتمام تعيش هناك: تسمم الذاكرة ((درس 15)

خفاء إطار العمل المشترك السحابة) سوف ترفع المشكلة إلى المكالمة‬‬ ‬ مركز إدارة إطار العمل المشترك‬ ‬ نقطة التفتيش LongGraph‬ ‬ مجموعة AutoGen‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ 

### تشريح البدائية الواحدة

#### عميل

```
Agent = (system_prompt, tools, model, optional_name)
```

لا يوجد ذاكرة. لا يوجد حالة. لا يوجد حالة.

#### التسليم

```
Handoff = (from_agent, to_agent, reason, payload)
```

ثلاثة أشكال تحقيق:

- **Function return** أداة 返回下一个 وكيل‬ هذا نمط OpenAI Swarm‬ العاملين يحملون التوجيه في مخططات أداةهم‬‬
- **Graph edge** LangGraph。Edges 是声明式的──LLM 生成一个值;condition 选择下一个节点──
- **Speaker selection** مجموعة أوتوجين دردشة。 وظيفة اختيارة(有时它本身也是一次 LLM call)读取池并选择下一位发言者。

#### الدولة المشتركة

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

على الأقل رسائل 列表──通常更多: الأثاث المهيكلة(خروج المهام المختلفة للطاقم) ‬مطابق النوعي(خفضات اللونغراف) ‬ذاكرة خارجية(MCP‬مجهر DB)‬

两种拓:**full pool**(كل عميل يرى كل رسالة) و**projected**(العاملون يرى حسب المجال من المهام) ――الجميع الأسماك 简单但扩展性差──الأسماك المخطط لها يمكن توسيعها، ولكن تحتاج إلى مخطط تصميم مسبق──

#### الموسيقي

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

أربعة أشكال:

- **Static** الرسم البياني في وقت البناء 固定(الخط البياني المحدد 、الترتيب المسلسل)
- **LLM-selected** LLM 读取 pool 并选择下一位演讲(AutoGen、CrewAI Hierarchical)
- **Handoff-driven** 当前 وكيل 通过调用手渡工具 来决定(السحابة)
- **Queue-driven** العمال من صف مشترك 拉取任务; لا يوجد واضح المتكبر التالي

### ما هي التغييرات بين الإطار

عندما تكون الأصول ثابتة، فباقي قرارات التصميم هي:

- **Memory strategy** التفتيش المؤقت مقابل التفتيش الدائم ((تفتيش لنجراف)。
- **Safety boundary**من يمكنه أن يوافق على التسليم
- **Cost accounting** لكل وكيل ميزانيات الـ Token
- **Observability**تتبع التسلل، للعب مرة أخرى حالة استمرارية

كل هذا يمكن تحقيقه على البدائيات.


```figure
a5-primitive-radar
```

## بناءها
`code/main.py`يستخدم ما يقرب من 150 صفحة stdlib Python 实现四 البدائيات  لا يوجد LLM حقيقي  كل وكيل هو سياسة مكتوبة، لذلك التركيز على التركيز على الهيكل التنسيقي 上。

الملف:

- `Agent` 包含 اسم ‬نظام طلبات ‬أدوات ‬عمل السياسة‬فئة البيانات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- `Handoff` 返回新代理的功能──
- `SharedState` مجموعة رسائل آمنة من الأسلاك
- `Orchestrator` ثلاثة تغيرات:`StaticOrchestrator`.`HandoffOrchestrator`.`LLMSelectorOrchestrator`(مُحاكاة)

التجربة 通過所有三种管弦类型 运行同一个三代理管道(بحث → كتابة → مراجعة) ، ثم في النهاية طباعة مجموعة الرسائل── يمكنك أن ترى، النتائج تختلف فقط في *من يختار التالي*؛ وكلاء ومشاركة الحالة في كل عملية تماما نفسها──

运行它:

```
python3 code/main.py
```

预期输出: ثلاث مرات يدير الموسيقي، كل نمط مرة واحدة.

## استخدمها
`outputs/skill-primitive-mapper.md`هو مهارة، فإنه يقرأ أي قاعدة كود متعددة الوكلاء أو مستند الإطار، ويعود إلى خرائط الأربعة البدائية.

## 交付 it
في إطار جديد قبل، أولا للكتابة خريطة بدائية. إذا لم يكتب، تشرح الأدلة غير كاملة، أو إطار العمل هو في وضع الأولية الخامسة.

ضع الخرائط 固定在你的架构文档 中──当新团队成员 加入时,先把映射 发送给他们,再发送 API文档──当框架版本 变化时,对比映射,而不是变更──

## التدريب
1. استخدام سياسات مختلفة للوكلاء`code/main.py`三次──观察管家选择 如何改变哪些代理会运行──
2. 实现第四种管弦乐器类型:排队驱动,其中代理 轮询共享状态 寻找工作.
3. 取 LangGraph quickstart (https://docs.langchain.com/oss/python/langgraph/workflows-agents), تحويلها إلى أربعة بدائيات.
4. 阅读 OpenAI كتاب طهي السحابة (https://developers.openai.com/cookbook/examples/orchestrating_agents■■عرف السحابة 让四个原始人中哪个最有机,以及它把哪个推给调用者──
5. في هذه الموضة إيجاد إطار للدولة المشتركة المخبأة تماما.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | “一个带 tools 的 LLM” | 一个 `(system_prompt, tools, model)` triple。无状态。 |
| Handoff | “控制权转移” | 一个结构化 call，命名下一个 agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “context” | multi-agent system 中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “Coordinator” | 决定下一个运行者的人或机制。Static graph、LLM selector、handoff-driven，或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个轴之一。不是 framework feature。 |
| Message pool | “Shared chat history” | Full-history shared state。容易推理，扩展性差。 |
| Projected state | “Scoped view” | 面向特定 role 的 shared state view。可扩展，需要 schema design。 |
| Speaker selection | “下一个谁说话” | 一种 orchestrator pattern，其中一个 function（通常是 LLM）从 group 中选择下一个 agent。 |

## 延伸阅读
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) على التوسيقية التي تدفعها اليدين
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) مجموعةChat + اختيار المتحدثين هو الهيئة القانونية المختارة لتنظيم
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) التنسيق على الحافة الرسمية ووضع مشترك على أساس القلل
- [CrewAI introduction](https://docs.crewai.com/en/introduction) عوامل الأدوار والهدف والخلفية،عمليات تسلسلية / Hierarchical processes
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) مايكروسوفت سوف تحويل v0.4 إلى صيانة  ما زال نشطا بعد AutoGen v0.2 線
