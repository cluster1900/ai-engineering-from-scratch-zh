# كابستون 10  فريق هندسة البرمجيات متعددة الوكلاء

> في عام 2026، وصلت جميع المجموعات إلى نفس الشكل: المهندس المعماري المسؤول عن التخطيط، والمدفوعين في عمل الأشجار المشتركة، والمراجع المسؤول عن البوابة، والمختبر المسؤول عن التحقق. وضع ساعة الجدار على منتجات المشاركة في الحالة والبروتوكولات المشتركة  لتصبح سطح الفشل.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

## 问题
تعبيرات تشغيل وكيل واحد في المهام الكبيرة سوف تواجه الحد الأقصى‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

سطح الفشل هو التسليم. المعماري  تخطط للبرمجيات  محتويات لا يمكن تحقيقها. البرمجيات  تسبب في نزاع بين بعضها البعض. المراجع  يوافق على تصحيح هلوسة.

## 概念
الأدوار هي وكلاء من نوعها**Architect**(كلود أوبوس 4.7) 读取 issue,编写计划,并将其分为带有显式界面的子任务──**Coders**(كلود سونيت 4.7,N 个并行实例, كل مثال في واحد `git worktree`+ دايتونا ساندبوكس 中) 独立实现 فرعي مهامها。**Reviewer**(GPT-5.4) 读取合并后的差异,并批准或请求具体修改──**Tester**(جيميني 2.5 برو) في منفصلة البيئة运行 اختبار مجموعة،并使用文物 报告通过/失败──

通信通過共享任务板(دعم الملف أو Redis)完成──每个角色 消费它被允许处理的任务──Handoffs هي رسائل A2A-بروتوكول-نوعة──协调问题包括:

تعزيز الوهم هو تكلفة خفية. كل حد دور مدينة تزيد من طلبات الموجبة ووضع السياق. سير واحد 40 جولة سوف تتحول إلى 160 جولة إجمالية من خلال أربعة أدوار.

## المكونات
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术
- التنسيق: لنجراف مع حالة مشتركة + كل عامل
- الرسائل: بروتوكول A2A (جوجل 2025) للرسائل المكتوبة بين الوكلاء
- النماذج: أوبوس 4.7 (المعماري) ، سونيت 4.7 (مبرمج) ، GPT-5.4 (مراجعة) ، جيميني 2.5 برو (متجرب)
- عزل الأشجار: `git worktree add`لكل مُبرمج + صندوق رمل "ديتونا"
- منسق الاندماج: الاندماج المخصص ثلاثي الطرق + حل النزاعات بالوساطة من خلال القانون القانوني
- Eval: SWE-bench Pro (50 عدد) ، سيناريوهات SWE-AF، HumanEval++ للتجارب الوحيدة
- الملاحظة: Langfuse مع المراحل المحددة بالرموز، محاسبة الرمز لكل وكيل
- التنفيذ: K8s, كل دور واحد مستقل التنفيذ,并 على أساس الخصم  تكوين HPA


```figure
ce-team-handoff
```

## بناءها
1. **Task board.**JSONL المدعومة بالملفات ، تحتوي على رسائل مدعومة:`plan_request`.`subtask`.`diff_ready`.`review_needed`.`test_needed`.`approved`.`rejected`.`replan_needed`العاملين العاملين العاملين

2. **Architect.**读取 GitHub issue,使用带有计划模板的 Opus 4.7,要求显式子任务界面(触及文件、公共功能、测试影响)`plan_request`.

3. **Coders.**كل عامل من المجلس يطلب وظيفة واحدة`git worktree add`وفرع و صندوق رمل دايتونا، لتنفيذ المهمة الفرعية،`diff_ready`.

4. **Merge coordinator.**عندما يتم إنجاز جميع المبرمجين ، سيتم إرسال N 个 فرع 通过 ثلاثية الاتجاهات الاندماج 合并到阶段分支――只有 وجود تداخل على مستوى الملفات 时,才使用LLM-mediated conflict resolution──

5. **Reviewer.**GPT-5.4 读取合并后的差异──不能批准它自己编写的差异──发出 `approved`(لا تفتح) أو مع وجود طلبات تغيير محددة`review_feedback`,并路由回相关编码器──

6. **Tester.**جيمين 2.5 برو في غلاف الرمل المتنقّل`test_passed`أو`test_failed`◊ فشل اختبارات حلقة مرة أخرى إلى امتلاك فشل المهام الفرعية كودر‬

7. **Handoff accounting.**كل رصيد عبر حدود الدور رسالة المدينة في Langfuse الحصول على فترة، سجل حجم الحمل المفيد و استخدام النموذج.

8. **Eval.**في 50 SWE-البندش إصدارات بروف 上运行──将通过@1 和 $-ل-حل-مسألة مع واحد وكيل خط الأساس(One Sonnet 4.7,在单个工作树中)

9. **Post-mortem.**لكل مشكلة فشلت، فلتعرف على التسليم الفاشل

## استخدمها
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## 交付 it
`outputs/skill-multi-agent-team.md`يُمكن تسليمها. أعطى عنوان مسألة ومستوى التوازي، هذا الفريق سيخلق علاقات إضافية جاهزة، ويمنح حسابات رموز لكل دور.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## التدريب
1. في طريق النقل إلى الاختلاف داخل خطأ واضحة`return None`)。 معدل الموافقة الخاطئة للمراجعة القياسية‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

2. 减少到两个编码器(المعماري +编码器 + مراجعة + اختبار,编码器 顺序运行两个 فرعية المهمة)。比较墙钟 和通过率。

3. استخدام قيود كاتب واحد بدل منسق الاندماج  subtasks 触及不相交的文件集) 测量建筑的规划负担

4. سوف يقوم المراجع من GPT-5.4 换到Claude Opus 4.7  قياس معدل الموافقة الخاطئة 和 تكلفة الوهم ديلتا‬

5. 添加第五个角色:documenter (Haiku 4.5) ∙ review 之后,它会产生更换日志的输入──衡量文档质量 是否值额外的代币支出──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) إنجاز مصنع متعدد الوكلاء عام 2026
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT)الإطار المتعدد الوكلاء على أساس الدور
- [AutoGen v0.4](https://github.com/microsoft/autogen) إطار Microsoft من نوع الممثل
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai)  نوع آخر من المنتجات المرجعية
- [Google A2A protocol](https://developers.google.com/agent-to-agent) مواصفات الرسائل بين الوكلاء
- [git worktree documentation](https://git-scm.com/docs/git-worktree) أساسية عزل
- [SWE-bench Pro](https://www.swebench.com) هدف التقييم
