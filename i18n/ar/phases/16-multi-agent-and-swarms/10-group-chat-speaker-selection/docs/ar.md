# المحادثة الجماعية و اختيار المتحدث

> يتشارك مجموعة أوتوجينات و AG2 GroupChat في محادثة بين ن ة عملاء ؛ وظيفة اختيار LLM、 دورة-روبين أو custom) اختيار المتحدث التالي. هذا هو النموذج الناشئ للحوار متعدد العملاء: العملاء لا يعرفون أنفسهم في الرسم البياني في حالة ساكن ، فإنهم يقومون ببساطة بالرد على حوض المشاركة. تم الاحتفاظ بـ GroupChat في AG2 fork. سيتم إعادة كتابة AutoGen v0.4 على أنها نموذج ممثل محرك الأحداث. في 2 أكتوبر 2026 ستضع Microsoft AutoGen في وضع الاحتفاظ، وتضافها إلى Core Semantic ‬إلى Microsoft Agent Framework RC 2026 2 أكتوبر 2026 ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**类型：**学习 + 构建
**语言：**Python (stdlib)
**前置条件：**المرحلة 16 · 04 (النموذج الأول)
**时间：**~ 60 دقيقة

## 问题

عندما يتدفق العمل 已知时,静态图表(LangGraph) جيد الاستخدام. المحادثة الحقيقية ليست静态: أحياناً المبرمج سوف يسأل المراجع، أحياناً سوف يسأل الباحث، أحياناً سوف يسأل الكاتب.

هذا ما تفعله مجموعة "أوتوجين تشات"

## 概念

### 形状

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

كل وكيل يستطيع رؤية كل رسالة. كل دور يدعو وظيفة اختيارية لتحديد المتحدث التالي.

### 三种选择器 风格

**Round-robin。**固定循环──确定性──按N 线性扩展,但会忽略上下文: حتى لو كان الموضوع هو مراجعة قانونية,

**LLM-selected。**调用一个LLM,它读取最近池内容并返回最合适的下一个发言人──具备上下文感知能力,但速度慢: كل دورة都会增加一次LLM 调用──AutoGen的默认方式──

**Custom。**عمل Python  تابع، يحتوي على أي منطق تريدها  النموذج:LLM-اختيار加 fallback 规则  على سبيل المثال، coder 之后总是把轮次交给验证) 

### API المقابل

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`المنتخب: عندما يكون وكيلًا يتم إتمام جولة واحدة، يقوم المدير بتعيين المنتخب: المنتخب: يعود إلى العميل التالي.

### 终止

ثلاثة أشكال:

- **Max rounds。**لعدد الجولات الإجمالية
- **"TERMINATE" token。**يمكن للعملاء إرسال رسالة محرقة، والمدير توقف عند ظهورها.
- **Goal-reached check。**إصدار إصدارات خفيفة كل جولة واحدة وتحدث

### AutoGen → AG2 分裂، فضلا عن Microsoft Agent Framework 合并

في أوائل عام 2025، بدأت مايكروسوفت في إعادة كتابة أدوات أوتوجين (أو جين) القائمة على الأحداث، حيث احتفظت المستخدمون المبكرون بالAPI المتكاملة.

في فبراير 2026 ، أعلنت مايكروسوفت أن AutoGen ستدخل في وضع الحفاظ على الحدث ، نموذج ممثل مدفوع الحدث**Microsoft Agent Framework**(RC 2026 年 2 月,现在已与语义核心合并) ――GroupChat 概念在两条路线中都保留下来;实现细节不同──对于兼容 v0.2 的代码,AG2 是首选上游──

### 什么时候适合 聊天

- **Emergent conversations。**لا تريد أن تتصل بالمتحدث التالي
- **角色混合任务。**المبرمج يسأل الباحث، الباحث يسأل الموثوق، الموثوق مرة أخرى يسأل المبرمج.
- **探索式问题解决。**فكر في عقد اجتماع، وليس في عقد اجتماع.

### متى سوف تفشل

- **严格确定性。**اختيار الـ LLM قد لا يتفق.
- **Sycophancy cascades。**العاملين سوف يتطيعون أن يطلقوا على أكثر الناس ثقة.
- **Context bloat。**كل عميل يقرأ كل رسالة بعد 10 دورات سياقها سيكون كبير جدا.
- **Hot speakers。**某个代理 因为选择者 偏好它的专长而主导对话――将扬声器平衡 作为选择者特征 引入――

### دردشة المجموعة مقابل المشرف

مثل البدائيات، مختلفة الاعتراف:

- المشرف: عميل 规划,其他 عملاء 执行──Selector 是问规划者 接下来做什么──
- دردشة المجموعة: جميع العملاء هم أقرانهم ؛ الاختيار هو واحد من أدوار مجموعة المشاركة

两者都使用课 04 中的四个原始语──聊天群默认使用LLM-selected orchestration 和 full-pool shared state──


```figure
swarm-speaker
```

## بناءها

`code/main.py`تستخدم المجموعة من الصفر لتنفيذ مجموعة من المحادثات.`TERMINATE`إشارة نهاية

سيتم طباعة النص المتحادث من المُغيرين وآثار القرارات من المختار.

运行:

```
python3 code/main.py
```

## استخدمها

`outputs/skill-groupchat-selector.md`会为给定任务配置Grouppchatselector:round-robin vs LLM-selected vs custom، وكذلك استخدام أي مدخلات من المختارات ((رسائل حديثة  تخصصات العملاء  حسابات التحول)

## أصدرها

قائمة التحقق:

- **Max rounds cap。**始终需要──典型任务为 10-20──
- **Speaker-balance metric。**مع كل عميل في الجولة، عندما يتجاوز عدم التوازن قيمة وقت الإبلاغ.
- **Termination token。** `TERMINATE`أو وكيل التحقق الخاص
- **Projection 或 scoped memory。**بعد 10 رسائل، فكر فقط في إعطاء كل عميل نظرة محددة، لمنع التنفخ السياقي.
- **Selector logging。**对于LLM-اختيار 变体,同时记录选择者的输入和选择──否则无法调试──

## التدريب

1. 运行 `code/main.py` مقارنة المحادثة الجولة مع المختارين في ماجستير في العلوم التدريبية
2. في اختيار داخل加入一条 "ماكس يتحدث-للموكل" قواعد.
3. 实现 هدف الاطلاق: عندما المراجعة 返回 "موافق عليه" 时停止── انها في الحد الأقصى  قبل الحد الأدنى  كم هو تردد الاطلاق؟
4. 阅读AutoGen مستقر وثائق 中 حول GroupChathttps://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager`استخدام الاختيار المتبني
5. 阅读 AG2 repo(https://github.com/ag2ai/ag2），并将其v0.2 GroupChat و v0.4 الإصدارات القائمة على الأحداث مقابل v0.4  ما هي الصفات المحددة التي زادت فيها ((معدل الإنتقال ‬التسامح مع الأخطاء ‬التحليق) ؟

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | "Who talks next" | 选择下一个 agent 的函数。Round-robin、LLM-selected 或 custom。 |
| GroupChatManager | "The meeting host" | 拥有 selector 并循环处理轮次的 AutoGen component。 |
| ConversableAgent | "The base agent" | AutoGen base class；一个可以发送和接收 messages 的 agent。 |
| Termination token | "The 'stop' word" | 结束 chat 的 sentinel string（通常是 `TERMINATE`）。 |
| Hot speaker | "One agent dominates" | selector 不断选择同一个 agent 的 failure mode。 |
| Context bloat | "Pool grows unbounded" | 每个 agent 都读取所有先前 message；context 随轮次增长。 |
| Projection | "Scoped view" | 面向角色的共享池视图，用于防止 context bloat。 |

## 延伸阅读

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) تنفيذ مرجع
- [AG2 repo](https://github.com/ag2ai/ag2) 社区延续的AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) 合并后的继任者,RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) ممثلة ممثلة مدفوعة بالحدث 重写细节
