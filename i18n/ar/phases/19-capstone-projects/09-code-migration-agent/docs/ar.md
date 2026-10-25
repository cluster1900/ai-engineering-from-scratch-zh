# كابستون 09  وكيل الهجرة الرمزية ((Repo 级语言 / Runtime 升级)

> أمازون المهجرة البنك ((Java 8 إلى 17) وGoogle App Engine Py2-to-Py3 migrator  حددوا معايير عام 2026. أحدث OpenRewrite  قادرة على تنفيذ تحديد AST في المشهد الكبير 重写。 Grit باستخدام نظام رمزي 风格 DSL  حل نفس النوع من المشاكل.

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 问题
الهجرة الكبيرة هي واحدة من أعمال التدوين في عام 2026 ، والتي هي واحدة من أفضل التطبيقات التجارية. الحقيقة البرية واضحة جدا. هل يتم التدريب على الهجرة بعد ذلك؟ ، والحصول هو حقيقي.

ستقوم ببناء وكيل، فإنه يتلقى إعادة تأهيل Java 8 ((أو Python 2 repo) ، وتنتج من فرقة متحركة من Green-CI. ستقوم بقياس معدل المرور، وصيانة تغطية الاختبار، وتكلفة كل إعادة تأهيل، وتبني نظام فاشل، مقابل إعادة تأهيل القاعدة فقط، ستخبرك قيمة وكيل في الواقع في أي مكان.

## 概念
خط الأنابيب له مرتين**deterministic substrate**(Java باستخدام OpenRewrite، Python باستخدام libcst) بشكل آمن تنفيذ عدد كبير من الآلات: الإيرادات، توقيعات الأساليب، تحريرات عدم الأمان، محاولة مع الموارد، استبدال API المتدهور.**agent layer**(OpenAI Agents SDK أو LangGraph، على أساس Claude Opus 4.7 و GPT-5.4-Codex) معالجة الوصفات 无法覆盖的情况: build-file upgrades(Maven/Gradle/pyproject)

كل ريبو يكتسب محطة إضافة محددة في وقت تشغيلها. إذا كان كل اختبار يمر ويتم تغطيته، لا يزيد عن 2٪ نقطة مئوية، فانفتح PR. إذا لم يمر، فانظر إلى هذا الردود على النحو الفاشل.

失败分类体系是交付物品. في 50 إعادة التأمين، ما الذي سيء؟ إعادة التأمينات التحولية؟ الملحوظات المخصصة؟ إصدار أداة؟ لا علاقة له بالهجرة؟ كل فئة تحتاج إلى حساب ومثالية الاختلافات. يمكن تحديد الأولوية لأول فئة.

## المكونات
```
target repo
      |
      v
OpenRewrite / libcst deterministic recipes
   (safe, fast, auditable, ~70-80% of fixes)
      |
      v
Daytona sandbox per branch
      |
      v
agent loop (Claude Opus 4.7 / GPT-5.4-Codex):
   - run build -> capture failures
   - classify failures (build, test, lint)
   - apply fix (patch or retry recipe)
   - rerun
   - budget: 30 min, $8, 20 turns
      |
      v
test + coverage delta gate
      |
      v (passed)
open PR
      |
      v (failed)
file under failure class + attach repro
```

## 技术
- 确定性底座: OpenRewrite (Java) أو libcst (Python)
- وكيل: OpenAI وكلاء SDK أو كلود أوبوس 4.7 + GPT-5.4-Codex 上的 LangGraph
- صندوق الرمل: دايوتا ديف كونتينر لكل فرع، وقت تشغيل هدف مثبت مسبقًا (جاوا 17 / بايثون 3.12)
- أنظمة البناء: مافن، جريدل، uv (بايتون)
- مقاييس: Amazon MigrationBench 50repo فرعية مجموعة ((جاوا 8 إلى 17) ، Google App Engine Py2-to-Py3 repos
- أسلحة الاختبار: متوازي الجري، من خلال Jacoco (Java) أو تغطية.py (Python) 统计 تغطية
- الملاحظة: Langfuse + كل repo واحد مجموعة تتبع، تحتوي على كل جزء مختلف
- لوحة التحكم: لوحة التحكم في الفشل التشريعي، تحتوي على كل فئة من الاختلافات في الحسابات والنموذج


```figure
ce-migration-funnel
```

## بناءها
1. **Recipe pass.**先运行 OpenRewrite(Java) أو libcst(Python) وصفاتها──捕获 70-80% من机械迁移──作为"وصفة" commit 提交──

2. **Build trial.**أرضية (ديتونا) ، إعداد المهداف، إدارة البناء

3. **Agent loop.**استخدام معدات لنجراف:`run_build`.`read_file`.`edit_file`.`run_test`.`git_diff` العميل 分类 فشل  عمق  نحو  اختبار  أداة بناء) ،并应用定向修正  إعادة تنفيذها

4. **Budget caps.**كل إعادة 30 دقيقة ساعة جدارية ≈ 8 دولار 成本 ≈ 20 وكيل يتحول ≈ أي حد فوق الحد ≈ توقف,并以目前 ≈ 档到"ميزانية_فائدة"‬

5. **Test + coverage gate.**إذا كان التغطية ينخفض إلى ما يزيد عن 2 个百分点، يتم تسجيلها إلى "التغطية_الانسحاب"

6. **PR open.**بعد النجاح، دفع 分支،打开 PR،附上不同، فضلا عن أي وصفات يتم تطبيقها، والتي تتعهد بها من قبل الوكيل 编写的摘要──

7. **Failure taxonomy.**لكل إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إعادة إ إعادة إ إ إ إ إ إعادة إعادة إ إ إعادة إعادة إ إ إ إعادة إ إ إ إ إ إ إ إ إ إ إ إ إ إ إ إ`dep_upgrade_required`.`build_tool_drift`.`custom_annotation`.`test_flake`.`syntax_edge_case`.`budget_exhausted` بناء لوحة التحكم

8. **50-repo run.**في فرعية "مغريشن بينش" 上执行── تقرير معدل الانتقال لكل فئة ‧تكلفة لكل تقرير ‧حفاظ على التغطية،并与确定性-only baseline对比──

## استخدمها
```
$ migrate legacy-java-service --target java17
[recipe]   27 rewrites applied (JUnit 4->5, HashMap initializer, try-with-resources)
[build]    FAIL: cannot find symbol sun.misc.BASE64Encoder
[agent]    turn 1 classify: removed_jdk_api
[agent]    turn 2 apply: sun.misc.BASE64Encoder -> java.util.Base64
[build]    OK
[tests]    412/412 passing; coverage 84.1% -> 84.3%
[pr]       opened #1841  cost=$3.20  turns=4
```

## 交付 it
`outputs/skill-migration-agent.md`هو شيء تسليم. أعطى repo، فإنه سوف تنفيذ الوصفات التحديدية أولا، ثم تشغيل حلقة وكيل، لإنتاج فروع منتقلة تم المرور، أو سوف يرجع repo إلى فئة تصنيفية ما أسفل.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## التدريب
1. فقط باستخدام OpenRewrite (دون وكيل) للعمل على الانتقال إلى خط الأنابيب.

2. 实现 a "lint-clean" check:迁移后,运行风格linter(Java 用无,Python 用 ruff) ―― إذا ظهرت أخطاء جديدة في اللنت،则让PR 失败──قياس التغطية المحفوظة-لكن-السلسلة-العودة إلى السلطة──

3. إضافة محفز "الاختلاف الحد الأدنى": بعد اختبارات، باستخدام مرور ثان قطع غير ضروري للتغييرات.

4. 扩展到第三种迁移:حجر 18 إلىحجر 22──复用沙盒 包装;把食谱层 换成自定义代码模式──

5.  وقت إلى أول بناء خضراء (TTFGB) 作为 UX متري 来衡量──目标:p50 低于 10 分钟──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Deterministic substrate | "Recipe engine" | OpenRewrite / libcst：带安全保证的声明式 AST rewrites |
| Codemod | "Code-modifying program" | 一条以机械方式修改 source code 的 rewrite rule |
| Build drift | "Tool version skew" | Maven / Gradle / uv 在 major versions 之间的细微行为变化 |
| Failure class | "Taxonomy bucket" | repo 未能迁移的带标签原因：dep、syntax、test、build-tool、budget |
| Coverage delta | "Coverage preservation" | 从 base 到 migrated branch 的 test coverage % 变化 |
| Agent turn | "Tool-call round" | agent loop 中的一次 plan -> act -> observe cycle |
| Budget exhaustion | "Hit the ceiling" | repo 消耗完 30-min / $8 / 20-turn 限制但仍未通过 |

## 延伸阅读
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) 2026 سال السلطة المرجعية
- [Moderne.io OpenRewrite platform](https://www.moderne.io) أساس تحديدية 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) وصفة 编写
- [Grit.io](https://www.grit.io) 替代代代码模式 DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) وكلاء SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代 الهجرة مقياس
- [libcst](https://github.com/Instagram/LibCST) أساسيّة طبيّة Python
- [Daytona sandboxes](https://daytona.io) صناديق الرمل لكل فروع 参考
