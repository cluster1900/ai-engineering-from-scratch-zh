# الإطار العميل 取舍  LangGraph vs CrewAI vs AutoGen vs Agno

> كل إطار تمت بيعه مع نفس الديمو (مُجربة البحث) ، وكل إطار تمت بيعه مع نفس البغغ (مُخطط الحالة وطبقة التنسيق) ، وكل إطار تمت بيعه مع نفس الإطار الذي يطابق صيغة المشكلة، وكل ما تبقى هو إصدار رمز اللصم مرتين.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 问题

لديك مهمة، تحتاج لا توقف مرة واحدة في مكالمة ماجستير في العلوم. ربما يكون ذلك تدفق عمل بحثي.

بعد ثلاثة أيام، اكتشفت انتزاع هذا الإطار بدأ ينفجر. الموظفين يقدمون لك أدوار، ولكن عندما يكون الباحث بحاجة إلى وضع خطة هيكلية للكاتب، فإنه سوف يوافقك.

修复方式不是选择最好的框架──而是把框架的核心抽象匹配到你的问题形状──本课会绘画这个地图──

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

أربع إطاريات تتحكم في المشهد لعام 2026، والتي لا تتطابق مع الاختصارات الأساسية لها.

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### ماذا يعني هذا؟

الاختصار الأساسي للإطار هو ما ترسمه في اللوحة البيضاء عندما تتحدث عن الهندسة المعمارية

- **LangGraph**→ 你画一个图表──节点是步骤,边缘是过渡,每个点的状态对象都是打字──心理模型是状态机器──
- **CrewAI**您画一个组织图片──每个角色有职位描述,مدير 路由任务──心理模型 是一个小型专家团队──
- **AutoGen**→ 你画一个 Slack DM──两个代理 发消息彼此;如果需要调节者,第三个加入──心理模型是聊聊──
- **Agno**→ أنت رسمت مربع منفصل، معلقة على الأدوات بجوارها.

### الدولة 问题

الدولة هي المكان الذي ينتهي فيه معظم الإطار في الإنتاج

- **LangGraph.**حالة النمط`TypedDict`أو نموذج بيدانتيك) 、حدّات لكل مجال 、一等 نقطة التفتيش ‬SQLite/Postgres/Redis)‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **CrewAI.**الدولة`context`حقل في المجال 以字符串形式 بين المهام  أو من خلال `output_pydantic`结构化传递──开箱没有持久的每人机组商店; إذا كان الطاقم 必须在重启后生存,你需要自己接上──
- **AutoGen.**الحالة هو تاريخ الدردشة و أي المستخدم المحدد `context`❖ يمكن استمرار النصوص المحادثة؛ حالة التدفق العمل المحتملة لن تستمر، إلا إذا كتبت المعدلات‬
- **Agno.**مدفعات تخزين 内置(SQLite、Postgres、Mongo、Redis、DynamoDB) ، من خلال `storage=`-تعلق`Agent`上  جلسات المحادثة 和 ذاكرة المستخدم 会自动持久化──它不是完整图表检查点;而是 جلسة التخزين──

### التفرع 问题

كل عميل غير عادي يتفرع من يقرر الفرع

- **LangGraph** بواسطة تصميمك، من خلال الحواف المشروطة──التوجيه هو إسم فروع Python وظيفة──الأغصان هي عبارة عن عبارة من العناصر المجمعة في الرسم البياني؛ نقطة التفتيش 会记录采取哪条 شاخها──
- **CrewAI** الوضع الهرمي من قبل المدير القرار؛ الوضع التالي من قبلك في البناء قرارها.
- **AutoGen** العملاء 通過 دردشة قرر──فرع من 下一个发言者中涌现──`GroupChatManager`选择 next speaker; يمكنك كتابة`speaker_selection_method`ولكن من قبل القانون المحرك
- **Agno** العميل 通過下一步调用哪个工具来决定── الفريق لديه وضع منسق/موج/متعاون؛ فوق هذه الفرع هي مسؤولية المطور‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### الملاحظة 问题

- **LangGraph** 通過 LangSmith أو أي مصدر OTel استخدام OpenTelemetry。 كل انتقال عقدة 都是 تتبع فترة؛ نقاط التفتيش 同时也是可播放的痕迹。
- **CrewAI** منذ نهاية عام 2025                                                                                                                                                                                                                                                            
- **AutoGen**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `autogen-core`集成 OpenTelemetry;AgentOps 和 Opik 有连接器── تتبع 粒度是 per-agent-message, ليس per-node──
- **Agno** 内置 `monitoring=True`العلم 加 OpenTelemetry المصدرين؛ مع Langfuse 深度集成، تستخدم في أثار الجلسة

### التكلفة و التأخير

أربعة إطار مدينة زيادة في كل مكالمة عامة ((منطق الإطار والتحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق من التحقق.`GroupChatManager`كذلك هو. لا يوجد سوى كتابة اللونغراف`llm.invoke`‫أجنو‬ ‫تتتبع مسار الوكيل الواحد 很薄‬

عندما تكلفة كل عملية عمل مهمة، الاختيار الأولوي للالتوجه الصريح`speaker_selection_method`), بدلا من الالتحاق بالدرجة الأولى في القانون القانوني

### التفاعلية

- **LangGraph** **LangChain**أدوات 、المستردودات 、LLMs。一等 مكيتر MCP(أدوات 作为 MCP servers 导入)
- **CrewAI**أدوات 继承自 `BaseTool`أدوات LongChain أدوات LlamaIndex وأدوات MCP يمكن أن تتكيف مع التدخول.`allow_delegation=True`ممارسة وفد من طاقم إلى طاقم
- **AutoGen**`FunctionTool`包装任何Python قابل للاتصال; هناك مكيّف MCP.
- **Agno**`@tool`أداة الديكور أو الفرعية الأساسية للأدوات؛ مُعدّل MCP؛ الأدوات يمكن مشاركتها بين العملاء والفرق.

## 技能

> يمكنك أن تشرح في جملة واحدة لماذا إطار معين يناسب وكيل معين

قائمة التحقق:

1. **画出形状。**هل هذه هي الرسم البياني ((مختلفة الدولة ((مسمّية بالانتقالات)) ؟ هل هذه هي اللعبة الدورية ((المتخصصين)) ؟
2. **决定谁来 branching。**التفرع الذي يقرر المطور → LangGraph──مدير-وكيل-قرر → CrewAI hierarchical──Chat-emergent → AutoGen──Tool-call-decided → Agno──
3. **检查 state budget。**هل تحتاج إلى استئناف من نقطة التفتيش؟سفر الزمن؟ الإنسان يقاطع منتصف الجولة؟ إذا كان، LongGraph هو الاختيار المتفق عليه؛ جلسات التدريب  تغطي حالة المحادثة المحددة
4. **检查 cost budget。**التوجيه المختار من قبل الـ LLM كل دورة من العملات المضافة. إذا كان الوكيل يعمل كل يوم آلاف مرات، فلتفضل اختيار التوجيه الصريح.
5. **为 framework overhead 做预算。**كل إطار هو إعتماد آخر. إذا كانت المهمة مجرد اثنين من مكالمات الماجستير و أداة واحدة، كتابة 30 صفحة بيثون بسيطة.

في حين أنّك تستطيع رسم الرسم البياني، الرسم البياني، أو المحادثة، أو صندوق العملاء، قبل ذلك، رفضت أن تمتد الإطار، رفضت أيضا اختيار إطار يضطرك إلى تحقيق الاحتياجات الحقيقية، ونموذج دولته ضد الإطار.

##  قرارات

| 问题形状 | 首选 framework | 原因 |
|----------|----------------|------|
| 带 typed state、human approvals、long-running 的 Workflow DAG | LangGraph | 一等 state、checkpointer、interrupts、time-travel。 |
| 有明确 roles 的 research / writing pipeline | CrewAI (sequential) 或 LangGraph subgraphs | 在 CrewAI 中表达 role-per-task 很便宜；当 branching 变复杂时用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student dialogue | AutoGen | Two-agent chat 是它的原生形状。 |
| 带 tools、sessions、memory 的 single agent | Agno | 设置最薄，内置 storage 和 memory。 |
| 带 reducers 的数千个 parallel fanouts | LangGraph + `Send` | 唯一拥有一等 parallel-dispatch API 的选择。 |
| 快速 prototype，不承诺 framework | Plain Python + provider SDK | 没有 framework 是最快的 framework。 |


```figure
l5-framework-fit
```

## التدريب

1. **Easy.**取同一个任务  research مقرها الرئيسية لـ Anthropic، كتابة قصة قصيرة من 200 كلمة، اقتباس مصادر   分别使用LangGraph(四个节点:خطط、بحث、كتب、引用) و CrewAI(ثلاث أدوار: الباحث、كاتب、حراري) تحقيقها── تقرير كل مرة تنفيذ تكلفة رمزية 和代码行数──
2. **Medium.**استخدام AutoGen ((المباحث  كاتب دردشة، المحرر 通過 `GroupChat`加入) و Agno(带 `search_tools`和 `write_tools`(ب) تكلفة كل عملية، (ب) استئناف بعد الحادث، (ج) في كتابة خطوة قبل إدخال الموافقة البشرية، على أربعة تنفيذات.
3. **Hard.**قم بإنشاء نص شجرة القرار`pick_framework.py`, قبّل سؤال بسيط`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并返回推和一句话 توجيه──用你自己设计的六个案例 验证它──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| Orchestration | “agents 如何协调” | 决定下一个运行哪个 node/role/agent 的 layer。 |
| Durable state | “重启后 resume” | 附着到 checkpoint 或 session store 上、能在 process death 后存活的 state。 |
| LLM-selected routing | “让 model 决定” | planner LLM 每轮选择下一步；灵活，但每次决策都要花 tokens。 |
| Explicit routing | “Developer 决定” | Python function 或 static edge 选择下一步；便宜且可审计。 |
| Crew | “一个 CrewAI team” | roles + tasks + process（sequential 或 hierarchical）绑定成一个 runnable。 |
| GroupChat | “AutoGen 的 multi-agent chat” | N 个 agents 之间由 speaker selector 管理的 conversation。 |
| Team (Agno) | “Multi-agent Agno” | 对一组 agents 使用 route / coordinate / collaborate mode。 |
| StateGraph | “LangGraph 的 graph” | typed-state、node、conditional-edge、checkpointer abstraction。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) الرسم البياني ‧المؤشرات ‧المقاطعات ‧السفر عبر الزمن‬
- [CrewAI documentation](https://docs.crewai.com/) طاقم 、تدفقات 、وكلاء 、مهام 、عمليات ‬
- [AutoGen documentation](https://microsoft.github.io/autogen/) المحادثة العميل ‧تحدث المجموعة ‧ فرق ‧ أدوات‬
- [Agno documentation](https://docs.agno.com/) العميل ‬الفريق ‬تدفق العمل ‬التخزين ‬ذاكرة‬‬‬
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) مع الإطار 无关的图案库(سلاسل سريعة 路由  مواجهة اوركستراتور-عاملين 评价者-优化器)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629)كل إطار مدينة يحتوي على حلقة
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155)ورقة تصميم أوتوجين
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 风格 شخصيات كومات 建立其上的角色扮演基础──
- المرحلة 11 · 16 (الغرافة الطويلة)  本课用来基准的框架──
- المرحلة 11 · 19 (التفكير)                                                                                                                                                                                                                                                          
- المرحلة 11 · 22 (ملاحظة الإنتاج)  如何 الجهاز 你选择的任何框架──
