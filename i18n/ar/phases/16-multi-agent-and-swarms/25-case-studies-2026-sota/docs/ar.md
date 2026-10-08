#  casestudi与 2026 حالة الفن

> ثلاثة حالات مرجعية في مستوى الإنتاج التي يجب أن تتعلم من نهايتها إلى نهايتها، كل منها يظهر مختلفة عن الهندسة متعددة الوكلاء.**Anthropic's Research system**(مجموعة من الموسيقيين العاملين  15x tokens 相比 single-agent Opus 4 +90.2%  قوس قزح)**MetaGPT / ChatDev**(الجهة المخصصة لدورات المهندسة البرمجية المشفورة SOP؛ الوهم التواصلية ChatDev؛ ماكنت من خلال DAGs  توسع إلى > 1000 وكيل، arXiv:2406.07155) هي حالة نموذجية لتفكيك الدور ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬**OpenClaw / Moltbook**(أولياً هو كلاودبوت بيتر ستينبرجر، 2025 11 月؛ اثنين من أشهر اسمها؛ حتى 2026 3 月 GitHub نجوم 达 247k؛本地 ReAct-loop وكلاء؛Moltbook  كموقع اجتماعي للعملاء فقط، على الإنترنت خلال أيام حوالي 2.3M حسابات العملاء,2026-03-10 被 Meta 收购) عرضت على نطاق السكان ما يحدث: نشاط اقتصادي ناشئ 风险 风险 风险 州 规范(中国于 2026 3 月限制政府计算机使用OpenClaw)**Framework landscape April 2026:**لانغغغراف و كرو آي إنتاج الرائدة AG2 هو مجتمع استمرار AutoGen Microsoft AutoGen  دخول وضع الصيانة ((并入 Microsoft Agent Framework,2026 年 2 月 RC); OpenAI Agents SDK هو إنتاج Swarm خلفي ؛ Google ADK(2025 年 4 月) هو A2A-أصل الدخول.

**Type:** 学习（capstone）
**Languages:** —
**Prerequisites:** Phase 16 全部内容（Lessons 01-24）
**Time:** 约 90 分钟

## 问题

الهندسة متعددة الوكلاء ةما زالت أحد المجالات الصعبة. لا يوجد عدد كبير من المراجع الإنتاجية، وكل حالة تغطي أجزاء مختلفة من هذا المجال.

## 概念

### نظام البحث الإنساني

المدير المنتج العامل 案例──Claude Opus 4 负责规划与综合;Claude Sonnet 4https://www.anthropic.com/engineering/multi-agent-research-system。

关键实测结果:

- في تقييمات البحث الداخلي 上,相比 عامل واحد Opus 4 提升 **+90.2%**.
- **BrowseComp variance 的 80%**فقط من**token usage**تفسير، وذلك يعني أن نجاح العملاء المتعددين يأتي إلى حد كبير من كل من المواطنين في الحصول على نافذة سياق جديدة.
- مقارنة بالوكيل الواحد**每个 query 使用 15x tokens**.
- لأن الوكلاء هم طويل الأمد ومتواصلة،**Rainbow deployment**.

تجربة تصميم متثبيتة:

1. **根据 query complexity 缩放 effort。**简单 → 1 个代理,3-10 次 call tool──中等 → 3 个代理──复杂研究 → 10+ subagents──
2. **先广后深。**المشاركين في المشاركة  إجراء بحث واسع ؛ قيادة  جامع ؛ متابعة المشاركين في المشاركة  إجراء دراسة عميقة موجهة
3. **Rainbow deploys。**حافظ على الإصدارات القديمة على قيد الحياة حتى يتم إنجاز العملاء الذين يعملون
4. **Verification 不是可选项。**يظهر أنّه إذا لم يكن هناك أدوار مُثبتة واضحة، فإنّ النظام سيصبح هالوسينات.

هذه هي النقطة التوجيهية للإنتاج: (المراحل 16 · 05)

### الميتاجبت / تشاتديف

إنتاج SOP-دور التفكك 案例──涵盖 arXiv:2308.00352(MetaGPT) و arXiv:2307.07924(ChatDev)──

سيتم وضع METAGPT على أجهزة البرمجيات الهندسية المعدلة لتحديد الدور:مدير المنتج، المهندس المعماري، مدير المشروع، المهندس، مهندس القوة القصوى،`Code = SOP(Team)` كل دور لديه صغرا ً متخصصة؛ دور  التسليم   传递结构化 آثار الأثرية PRD doc、architecture doc、code)

مساهمات ChatDev هي:**communicative dehallucination** العاملين في الرد على طلبات محددة، مثل عميل المصممين في رسم UI  قبل سؤال المبرمج  توقع استخدام أي لغة، بدلا من التخمين  دراسة تقرير، هذا يمكن قياسها على حد سواء تقليل الهلوسة في أنابيب متعددة العاملين 

سيتم تشارك مع (ميك نت)**DAGs 扩展到 >1000 agents** كل عقد DAG هو تخصص دور؛ حواف 编码 handoff عقود‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

تصميم تجربة:

1. **Structure 比 size 更重要。**فريق SOP 5 أدوار ضيقة انتصر على مجموعة غير مهيكلة من 50 عميل
2. **Handoff contracts 要写下来。**الأدوار 之间传递的文物 遵循 schema──
3. **Communicative dehallucination**هو نوع من التكلفة المنخفضة
4. **DAGs 比 chat 更能扩展。**عندما يتدفق، فلنقوم بتعديله

هذه هي المرجحات المرجعية لتمييز الدورات (مرحلة 16 · 08) و التطبيقات المهيكلة (مرحلة 16 · 15)

### النظام البيئي OpenClaw / Moltbook

إنتاج نطاق السكان 案例──时间线:

- **Nov 2025:**(Clawdbot) (مُساعد في تشفير (ReAct-loop)
- **Dec 2025 – Mar 2026:**两次更名(Clawdbot → OpenClaw → 继续以 OpenClaw 运行)
- **Feb 2026:**كتيب مولتبوك  على أساس نفس مجموعة من البدائيات  كمشبكة اجتماعية للعملاء فقط  نشر؛ في غضون أيام حوالي 2.3 مليون حساب عميل ‬
- **Mar 2026 (2026-03-10):**الميكروموتراتيكا
- **Mar 2026:**China Limit Government Computer استخدام OpenClaw
- **Mar 2026:**أوبين كلوا أكثر من 247 ألف نجمة غيت هوب

هذا يظهر كيف سيكون عندما تضع ملايين العملاء في شريكة الأساس

- **Emergent economic activity。**وكلاء يستخدمون الدفع الرمزي لبعضهم البعض
- **Population scale 下的 prompt-injection 风险。**ملف تعريف وكيل فيروسي في وسط إشعار الشر، وسوف تنتشر في ساعات قليلة إلى آلاف الملايين من المفاعلات العميل إلى العميل.
- **State-level regulatory response。**خلال أسابيع قليلة، التنظيم يصل إلى هذا النظام البيئي

في هذه الحالة، كان تجربة التصميم جزءاً تقنياً، والجزء جزءاً إدارياً:

1. **Population scale 的 multi-agent 是一种新 regime。**أفضل الممارسات في النظام الفردي (تحققها، وضوح الدور) لا تزال سارية، ولكن لا تزال كافية.
2. **Prompt injection 是新的 XSS。**默认将 وكلاء الملفات المألفية و الرسائل المتقاطعة بين وكلاء 视为不信任输入──
3. **Regulation 比 design cycles 更快。**提前规划──
4. **Open-source + viral scale 会产生复合效应。**في غضون 4 أشهر تقريباً، يصل عدد النجوم إلى 247 ألف نجمة ليس من المعتاد، يجب أن يتم تنفيذها على أساس التفجيرات

参见 [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)وذلك من خلال تقارير CNBC / Palo Alto Networks حول المعرفة بالمنظومة الإيكولوجية 详细节──技术基础方面,Clawdbot / OpenClaw repos 展示本地 ReAct loop;Moltbook's open posts 展示其上层社会图架构──

### منظومة الإطار 2026 年 4 月

| Framework | Status | Best for | Notes |
|---|---|---|---|
| **LangGraph** (LangChain) | Production leader | structured graph + checkpointing + human-in-the-loop | production 推荐默认选择 |
| **CrewAI** | Production leader | role-based crews with Sequential/Hierarchical processes | 擅长 role decomposition |
| **AG2** | Community maintained | GroupChat + speaker selection | AutoGen v0.2 延续版本 |
| **Microsoft AutoGen** | Maintenance mode (Feb 2026) | — | 并入 Microsoft Agent Framework RC |
| **Microsoft Agent Framework** | RC (Feb 2026) | orchestration patterns + enterprise integration | 新 entrant；值得关注 |
| **OpenAI Agents SDK** | Production | Swarm successor | tool-return handoff pattern |
| **Google ADK** | Production (April 2025) | A2A-native | Google Cloud integration |
| **Anthropic Claude Agent SDK** | Production | single-agent + Research extension | 参见 Research system 文章 |

الآن كل الإطار الرئيسي يقدم**MCP**الدعم; معظمهم**A2A**توافق البروتوكول لا يعد عنصر التفاوت

### نموذج مشترك في ثلاث حالات

1. **Orchestrator + workers**(منظور واضح من الأنثروبوليك MetaGPT 中作为منظور من PM OpenClaw من وكلاء فرد + تأثيرات الشبكة)
2. **结构化 handoff contracts**(وصف المهام البشرية للشخصيات الفرعية  وثائق PRD/الهيكل التجاري من MetaGPT  أدوات OpenClaw A2A)
3. **Verification as first-class role**(محقق الأنثروبي  مهندس QA في MetaGPT  مؤكدون في شبكة OpenClaw)
4. **Scaling 是 topology + substrate，而不只是更多 agents**(تطبيقات قوس قزح ‬ماكنت DAGs‬مكونات تحتية على نطاق السكان)‬
5. **Cost 是实质性因素并且需要披露**(15x tokens ∆BGPT 中的每角色预算 ∆Moltbook 中的每互动定价)
6. **Security posture 是显式的**(أشرطة الرملة الإنثروبية ✓ قيود دور MetaGPT✓ OpenClaw سوف تتحقق بسرعة ✓ كمحيط هجوم معروف)

### لمشروعك التالي اختيار المرجح

- **Production research / knowledge task → Anthropic Research。**أدوات جديدة
- **工程 / 工具链工作流 → MetaGPT / ChatDev。**角色 + SOPs + 交接契约。
- **Network-effect social product → OpenClaw / Moltbook。**الأساس + الاقتصاد الناشئ
- **Classic enterprise automation → CrewAI 或 LangGraph**(قائد الإنتاج، وقت تشغيل ثابت)

### 2026 أحدث التكنولوجيا 总结

截至 2026 年 4 月، هذا المجال في الحالة التالية:

- **Frameworks 正在趋同。**دعم MCP + A2A 已是基础门──.
- **Evaluation 正在变硬。**مقعد SWE Pro、MARBLE、STRATUS مقاييس التخفيف──Pro 是现实检查的当前抗污染──
- **Production failure rates 已可测量**(Cemri 2025 MAST؛ MAS الحقيقي ارتفاع 41-86.7%)  هذا المجال قد خرج من الديمو يبدو رائع 
- **Cost 是核心工程约束。**تكلفة رمزية لكل مهمة ✓ كل تفاعل ✓ ساعة الحائط ✓ قوس قزح ✓ تنفيذ التكلفة العليا ✓ متعدد الوكلاء في الدقة ✓ النجاح، ولكن في التكلفة ✓ الفشل، والتي هي القرارات التجارية ✓
- **Regulation 是近期输入，不是背景关注点。**عمل الولايات القضائية أسرع من دورات نشر واحدة


```figure
a5-orchestrator-scale
```

## استخدمها

`outputs/skill-case-study-mapper.md`هو مهارة، فإنه يتناول تصميم نظام متعدد الوكلاء المقترح، ويُنقش إلى أقرب دراسة حالة، مع الكشف عن الدراسة الحالية القرارات التصميمية التي تم التحقق منها.

## 交付 it

2026 عام إنتاج وكلاء متعددين دخول قواعد:

- **从 case study 出发，而不是从零开始。**في أبحاث الأنثروبية / MetaGPT / OpenClaw 中选择最接近的一个并进行适配──
- **采用 MCP + A2A。**التنقل عبر الإطار  قيمة كبيرة؛ دعم البروتوكول مجاني.
- **用 SWE-bench Pro 或你的内部 Pro-equivalent 进行衡量。**تم التحقق من التلوث
- **支付 verification tax。**سوف يستهلك مؤكد مستقل حوالي 20-30% من ميزانية الرمز، وتبديل دقة القياسات.
- **对 long-running agents 使用 Rainbow deploy。**预期多小时代理运行 会成为常态──
- **阅读 WMAC 2026 和 MAST follow-ups。**هذا علم يتطور بسرعة

## التدريب

1. 端到端阅读 نظام البحث الإنساني 文章。找出三个 تصميمات القرارات: إذا كنت تستخدم نموذج أصغر (((على سبيل المثال هايكو 4) استبدال أوبوس 4، هذه القرارات سوف تتغير。
2. 阅读 MetaGPT القسم 3-4(arXiv:2308.00352) ――把你自己领域中的一个SOP(不是软件)编码为角色提示──这个SOP 暗示了多少角色?
3. 阅读 ChatDev(arXiv:2307.07924)。识别 沟通性幻觉的机制──将其实现到你已经有一个多代理系统中──
4. 阅读OpenClaw 和 Moltbook── اختيار واحد على نطاق السكان يظهر ‬لكن لن يظهر في وضع الفشل المحدد في نظام 5 وكلاء‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
5. 选择您目前的多代理项目──三个 دراسات حالة، أيهما هو المرجح الأكثر قربا؟ في هذه الدراسة الحالة، ما هي القرارات التصميمية التي لم تتبنى؟ اكتب القرارات التالية التي ستستخدمها في هذا الموسم‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Anthropic Research | “supervisor reference” | Claude Opus 4 + Sonnet 4 subagents；15x tokens；相较 single-agent +90.2%。 |
| MetaGPT | “SOP as prompts” | 面向 software engineering 的 role decomposition；`Code = SOP(Team)`。 |
| ChatDev | “Agents as roles” | Designer / programmer / reviewer / tester；communicative dehallucination。 |
| MacNet | “Scale ChatDev via DAG” | arXiv:2406.07155；通过显式 DAG routing 实现 1000+ agents。 |
| OpenClaw | “Local ReAct-loop agents” | Steinberger 的项目；到 2026 年 3 月达 247k stars。 |
| Moltbook | “Agent-only social network” | 2.3M agent accounts；2026 年 3 月被 Meta 收购。 |
| Rainbow deploy | “Multiple versions concurrent” | 为 in-flight long-running agents 保持旧 runtime versions 存活。 |
| Communicative dehallucination | “Ask before answering” | Agents 向 peers 请求具体信息，而不是猜测。 |
| WMAC 2026 | “The AAAI workshop” | 2026 年 4 月 multi-agent coordination 社区焦点。 |

## 延伸阅读

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) إشارة إنتاج العامل المراقب
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) تدهور دور SOP
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) الوهم الاكتئابية
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155)  على أساس نطاق DAG
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) نظرة عامة على النظم البيئية
- [WMAC 2026](https://multiagents.org/2026/)ورشة عمل برنامج الجسر 2026 لـ AAAI حول تنسيق متعدد الوكلاء
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents) قائد الإنتاج
- [CrewAI docs](https://docs.crewai.com/en/introduction)الإطار القائم على الأدوار
