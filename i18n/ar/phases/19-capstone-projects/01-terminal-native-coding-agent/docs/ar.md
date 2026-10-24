# كابستون 01  终端原生 وكيل التشفير

> بحلول عام 2026 ، تم تحديد شكل وكيل التشفير. خطة TUI هيرنيز ة وضعية ة سطح أداة مربعة ة مسؤولة عن الخطة ة عمل ة ملاحظة ة استعادة دورة ة كلود كود ة كورسور 3 و OpenCode من بعيد النظر في كل شيء مختلفة ة.

**类型：**كابستون
**语言：**TypeScript / Bun (harness) ، Python (مخطوطات متقدمة)
**先修要求：**المرحلة 11 (هندسة الـLLM) ، المرحلة 13 (الأدوات والبروتوكولات) ، المرحلة 14 (الوكلاء) ، المرحلة 15 (النظم الذاتية) ، المرحلة 17 (البنية التحتية)
**覆盖阶段：**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：**35 小时

## 问题
بحلول عام 2026، أصبح وكلاء التشفير ‬المهيمنة في AI ‬طبقة التطبيقات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

لا يمكنك فهم هذه العاملات من الخارج. يجب عليك أن تبني واحدة بنفسك، وتراقب حلقة في الجولة 47 بسبب التشويش.

## 概念
الحزام لديه أربع سطحات**Plan**维护一个 TodoWrite 风格的状态对象,由模型 每一轮重写──**Act**分发 أدوات الاتصال (قراءة، تحرير، تشغيل، البحث، git)**Observe**捕获 stdout / stderr / خروج رموز، إجراء قطع،并把摘要反回去──**Recover**إدارة أخطاء الأداة، في حين تجنب انفجار نافذة السياق أو دورة لا حدود لها.**hooks**.`PreToolUse`،`PostToolUse`،`SessionStart`،`SessionEnd`،`UserPromptSubmit`،`Notification`،`Stop`و`PreCompact`هذه نقاط التوسع التي يمكن تعيينها، يمكن للمشغل إدخال سياسة وتلفونية ومرصات الحراسة فيها

sandbox استخدام E2B أو Daytona. كل مهمة في مدخن جديد من التطوير، وتعمل، وتثبيت على عملة عمل يمكن قراءتها. الحرسة لن تلمس أبدا نظام الملفات المضيفة. عملة في النجاح أو الفشل، سيتم تدميرها. التكلفة تسيطر على ثلاثة مستويات إجبارية التنفيذ: لكل دورة من الوهمات.

## المكونات
```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 技术
- وقت تشغيل الحزمة: Bun 1.2 + Ink 5 (تفاعل في المحطة)
- نموذج 访问:OpenRouter 统一 API, دعم كلود سونيت 4.7、GPT-5.4-Codex、جيمين 3 Pro、Opus 4.5(用于最难任务)
- نقل الأدوات: نموذج بروتوكول السياق StreamableHTTP (إصدار MCP 2026)
- صندوق الرمل: صناديق الرمل E2B (JS SDK) أو حاويات تطوير دايتونا
- البحث عن الرمز: عملية ripgrep الفرعية، أجهزة الحبس الشجري لـ 17 لغة (مُحَمَّلَت مسبقاً)
- العزل:`git worktree add`لكل مهمة، تنظيف النجاح / الفشل
- الحزام الموازي: SWE-bench Pro (مجموعة فرعية معتمدة) + Terminal-Bench 2.0 + الاحتفاظ الخاص بك 30 مهمة
- الملاحظة: OpenTelemetry SDK مع `gen_ai.*`semconv → Langfuse المضيفة الذاتية
- نشر علاقات عامة: تطبيق GitHub استخدام رموز حبة دقيقة، نطاق  الحد في الهدف repo


```figure
ce-agent-loop
```

## بناءها
1. **TUI and command loop.**搭建一个使用墨水的 Bun 项目──接收 `agent run <repo> "<task>"`△打印一个分屏视图:计划表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表表`SessionEnd`...الربطة

2. **Plan state.**定义一个带类型的 TodoWrite schema(包含 pending / in_progress / done items 和 notes) ――模型 كل دورة من خلال أداة المكالمة 重写完整状态不要让它增量修改──将计划 持久化到`.agent/state.json`، يمكن استئنافها بعد انهيارها

3. **Tool surface.**تعريف ستة أدوات:`read_file`،`edit_file`(مشاهدة سابقة مختلفة)`ripgrep`،`tree_sitter_symbols`،`run_shell`(بعد فترة)`git`(حالة / diff / commit / push) ―― عبر MCP StreamableHTTP 暴露,使 harness 与 transport 解── كل أداة 都返回截断后的输出(每次调用最多4k Tokens)──

4. **Sandbox wrapping.**كل مهمة ستشغل صندوق رمل E2B`git worktree add -b agent/$TASK_ID`إنشاء فرع جديد. جميع المكالمات الأداة موجودة في صندوق الرمال.

5. **Hooks.**实现全部八种 2026 هوك 类型──至少接入四个用户编写的 :(أ)`PreToolUse`حرس القيادة المدمرة، منع الأشجار خارج`rm -rf`(ب)`PostToolUse`حسابات الرمز، ((ج) `SessionStart`إطلاق الميزانية،`Stop`写入 قطعة أثر نهائية

6. **Eval loop.**كلون واحد من 30 عدد من SWE-البنك Pro Python 子集── على كل مشكلة 运行你的 Harness── مع الوكيل الاصغر SWE-(حد الأساسية) مقارنة مرر@1、التحولات لكل مهمة 和 $-للمهمة──将写入结果`eval/results.jsonl`.

7. **Cost control.**硬性截断: 50 دورات 200k سياق  5$ لكل مهمة`PreCompact`في 150k 处将较早的转转 摘要为前状态块,为新观测 出空间,同时不丢失计划──

8. **PR posting.**بعد النجاح، الخطوة الأخيرة هي`git push`، ثم استخدام API GitHub فتح علاقات عامة ، ويحتوى على خطة وملخص مختلفة في الصفحة الصحيحة

## استخدمها
```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## 交付 it
المهارات المقدمة`outputs/skill-terminal-coding-agent.md`△ أعطى طريق إعادة التأهيل و وصف المهمة، فإنه سوف يكون يعمل كاملة في صندوق الرمال في خطة عمل مراقبة الحلقة،并返回 PR URL 和 تتبع مجموعة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## التدريب
1. سوف نضع نموذج دعم من كلود سونيت 4.7 切换为运行在 vLLM 上的 Qwen3-Coder-30B──比较pass@1 和 $-per-task──报告开放模型表现较差的地方──

2. إضافة واحدة`reviewer`وكيل فرعي، في نشر علاقات عامة 前读取 diff،并可以请求一回复循环──衡量假积极评论是否会让SWE-bench pass rate 低于单代理基线(提示:通常会)。

3. 压测 sandbox:编写一个尝试 `curl`مهمة عنوان URL خارجية، فضلا عن محاولة كتابة شجرة عمل خارجية مهمة.

4. استخدام较小的模型 (هايكو 4.5) 实现 `PreCompact`الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب: الموجب:

5. سوف يتم نقل MCP StreamableHTTP بدل في الاستديو。 البينشمارك البارد-start 和 كل مكالمة تأخير。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | “agent loop” | 围绕 model 的代码，负责分发 tools、维护 plan state，并强制执行 budgets |
| Hook | “Agent event listener” | 由 harness 在八种 lifecycle events 之一上运行的用户编写脚本 |
| Worktree | “Git sandbox” | 位于独立路径的 linked git checkout；可以丢弃而不触碰 main clone |
| TodoWrite | “Plan state” | model 每轮都会重写的 typed list，包含 pending/in-progress/done items |
| StreamableHTTP | “MCP transport” | 2026 MCP revision：具备双向 streaming 的 long-lived HTTP connection；取代 SSE |
| Token ceiling | “Context budget” | 对 input+output Tokens 设置的每轮或每 session 上限；触发 compaction 或 termination |
| pass@1 | “Single-attempt pass rate” | SWE-bench tasks 在第一次运行中解决的比例，不包含 retry 或 test-set peeking |

## 延伸阅读
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) من أوراق الإشارة Anthropic
- [Cursor 3 changelog](https://cursor.com/changelog) العامل علامات التبويب و المكون 2 ملاحظات المنتج
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) باستخدام مقارنة SWE-البنك الحزمة من الحد الأدنى من خط الأساس
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) استخدام Opus 4.5 في SWE-البنك التحقق من ارتفاع بلغ 79.2%
- [OpenCode](https://opencode.ai)-السلسلة المفتوحة، 112 ألف نجم
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本 كاس ستون 面向的评估
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) التسريبيةHTTP،بيانات الميتامية المقدمة
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) دعوات الأداة 和 نمط استخدام الوهم
