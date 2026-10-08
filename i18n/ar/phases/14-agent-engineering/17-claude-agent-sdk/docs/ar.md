# كلاد العامل SDK:Subagents و Sessions Store

> كلاريد وكيل SDK هو كلاريد كود استغلال 库形态──المعدات المدمجة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## 學习目标
- 解释 بين SDK العميل الإنساني ((API خام) و SDK وكيل كلود ((شكل الخيط)
- 描述 subagents:parallelization 和 context isolation,以及何时使用它们──
- يقولون خارج سطح متجر جلسة Python SDK`append`،`load`،`list_sessions`،`delete`،`list_subkeys`) و`--session-mirror`تأثيرها
- 实现 a stdlib harness,包含 أدوات مدخنة في الوضع معزولة 

## 问题
API LLM خام فقط تعطيك مرة واحدة ذهابًا وإيابًا.‬ العميل الإنتاجي ‬ بحاجة إلى تنفيذ الأدوات‬ الخوادم MCP‬ حوافز دورة الحياة‬ التنمو السوباجنت‬ استمرار الجلسة‬ انتشار المسارات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

## 概念
### SDK العميل مقابل SDK العميل

- **Client SDK (`anthropic`).**رسائل خام API──你自己负责循环、工具 和状态──
- **Agent SDK (`claude-agent-sdk`).**أداة تشغيلية مدمجة في الإجراءات، وصلات MCP، العراك، التنمو السوباجنت، متجر جلسات.

### الأدوات المدمجة

SDK 开箱附附10+ أدوات:فايل قراءة/كتابة、ظلّ、غريب、جولب、حصول الويب وغيرها

### السباقات

إنثروبيّة تسجل استخدامين:

1. **Parallelization.**并发运行独立工作── ايجاد ملف الاختبار لكل من هذه الوحدات 20  是 20 个 مواكبة تحديدية
2. **Context isolation.**يستخدم المشاركون نافذة سياقهم الخاصة؛ فقط النتائج تعود إلى الموسيقي. تم الاحتفاظ بميزانية الموسيقي.

النتائج الجديدة الأخيرة لـ Python SDK:`list_subagents()`.`get_subagent_messages()`، للاستعمال على النسخة الفرعية

### متجر الجلسات

مع النسخة النسخية من النسخة النسخية:

- `append(session_id, message)` 添加一个转
- `load(session_id)` 恢复 المحادثة‬
- `list_sessions()` 枚举──
- `delete(session_id)` 带有对 subagent جلسات الوسيلة
- `list_subkeys(session_id)` 列出 مفاتيح متدنية

`--session-mirror`(علم CLI) سوف تتراجع في البيانات المتحركة في الملفات الخارجية، وسهلة التحكم في التحكم.

### الكوك

يمكنك التسجيل في معركة دورة الحياة:

- `PreToolUse`،`PostToolUse` البوابة أو أداة التحقيق المكالمات
- `SessionStart`،`SessionEnd`أُقيم و أُهدم
- `UserPromptSubmit` في النموذج  انظر مدخلات المستخدم  قبل اتخاذ إجراءات
- `PreCompact` 在文本紧缩之前运行。
- `Stop` الخروج العميل 时 التنظيف
- `Notification` تحذيرات القناة الجانبية

المكعبات هي مؤيدة لتدفق العمل (مرحلة 14 إشارة المناهج الدراسية) و النظام المشابه إضافة السلوك عبر القطاعات طريقة.

### إطار تعقب W3C

调用方上活跃的OTel spans 会通过W3C 发音文本标题 传播到CLI فرعية العملية──整个多进程的追踪 会在你的后台中显示为一个追踪──

### كلود يدير العملاء

استضافة 替代方案`managed-agents-2026-04-01`■■ العمل المزدوج الطويل الأمد ‬التخزين السريع المدمج ‬التضخم المدمج ‬التحكم ‬التغيير على البنية التحتية المدارة‬‬

### هذا النمط سهل في الخروج من هنا

- **Subagent over-spawn.**100 مهمة صغيرة تنشأ 100 عنصر ذو سلطة.
- **Hook creep.**كل فريق يضيف الركاب وقت البدء 膨胀── كل فصل مراجعة الركاب──
- **Session bloat.**جلسات 持续累积;size 增长──使用 `list_sessions`+ سياسة انتهاء الصلاحية


```figure
ae-subagent-isolation
```

## بناءها
`code/main.py`用 stdlib 实现 شكل SDK:

- `Tool`،`ToolRegistry`, تحتوي على متكامل`read_file`،`write_file`،`list_dir`.
- `Subagent` السياق الخاص ‧التمرير المعزول ‧الرد على النتائج‬
- `SessionStore` إضافة ‬حمية ‬القائمة ‬حذف ‬القائمة ‬المفاتيح الفرعية‬‬
- `Hooks` `pre_tool_use`،`post_tool_use`،`session_start`،`session_end`.
- واحد التجربة: العميل الرئيسي ينمو بالتوازي 3 个 فرعية ((كل واحد منفصل) ، الجمع النتائج،并 persistent session。

运行:

```
python3 code/main.py
```

تتبع 会 عرض عزل السياق الفرعي ((حجم سياق الموسيقي 保持 محدود)

## استخدمها
- **Claude Agent SDK**تستخدم لتصميم شكل الحزام كود كود أول منتجات
- **Claude Managed Agents**تستخدم في العمل المزمنة المضيفة على المدى الطويل
- **OpenAI Agents SDK**(الدرس 16) يستخدم في نظرائها الأولى في OpenAI
- **LangGraph + custom tools**إذا كنت تريد آلة الحالة على شكل الرسم البياني

## 交付 it
`outputs/skill-claude-agent-scaffold.md`كان هناك تطبيقات SDK لعامل كلود، تحتوي على أدوات التسجيل، والحوافز، ومخزن جلسات، ورابط خادم MCP، وتوزيع آثار W3C.

## التدريب
1. 添加一个分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类分类
2. 实现 واحد `PreToolUse`هوك، على`write_file`المكالمات  إجراء حد السعر  في كل جلسة  في كل دقيقة 5 مرات
3. صلة `list_subkeys`تعرضت للشجرة المضطربة...
4. لنقوم بتحويل هذه اللعبة إلى حقيقية`claude-agent-sdk`حزمة Python.
5. 阅读كلود مديريت وكلاء الدكتورات... متى ستقوم بتغيير من المضيف الذاتي إلى المدير؟

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) كود كود 库形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) نموذج النمو
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) استضافة 替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) النقابة
