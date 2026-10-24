# 综合项目 16  GitHub إصدار إلى PR وكيل مستقل

> وكلاء AWS SWE عن بعد ✓ وكلاء خلفية cursor ✓ OpenAI Codex cloud 和 Google Jules 都交付وا نفس صيغة المنتج 2026  إعطاء مسألة 打 برچسب، نحصل على PR‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P17
**Time:** 30 小时

## 问题
وكيل التشفير السحابية غير متوافق هو مختلف عن وكلاء التشفير التفاعلي (كابستون 01)`@agent fix this`،العامل سوف يبدأ في صندوق الرمل السحاب ، إعادة التسجيل الإنسخة ، اختبارات التشغيل ، إصدار الملفات ، التحقق ، وفتح PR الذي يحتوي على منطق العميل في الصيغة الاصلية. لا يوجد حلول تفاعلي ، ولا يوجد محطة.

التحديات المحددة:إعادة إنتاج البيئة (مثل: العميل يجب أن يكون في حالة عدم وجود صورة التطوير المتخزنة من إعادة بناء إعادة التأمين) ، اختبارات فليكية (مجبور إعادة تنفيذها أو فصلها) ، استيعاب الاعتماد (مع أدنى تراخيص حبة من أساس التطبيق GitHub) ، حسب الإعادة التأمين (بناء التنفيذ الميزاني ، وكذلك سياسة عدم الضغط القسري)).

## 概念
触发器是 GitHub webhook(إسجل القضية أو تعليقات العلاقات العامة) ・المتروق سيعمل في فريق إلى ECS فارغيت أو لامبدا‬‬ العامل سوف يضع الاحتفاظ 拉入 Daytona أو E2B sandbox،并使用 from repo 推断出的通用 Dockerfile‬اللغة‬ الإطار‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

التحقق هو خطوة البوابة. PR 打开前, CI كامل 必须在沙盒中通过.`needs-review` العميل 会把 منطق 作为 PR وصف 发布,并添加一个评论员可 ping 以进行跟踪 `@agent`الخيط

السلامة من خلال سطحين مختلفين من GitHub  إجراء محدد: التطبيق  توفر رمز التثبيت قصير الأجل ، مع`workflows: read`ووضع محتوى الاحتفاظ بالشؤون العامة أو المجال المحدد للشؤون العامة، وحماية الفروع، وليس تصريحات التطبيقات،`main`ممنوعة الضغط القسري، والطبيق لن يتم إضافة إلى قائمة التجاوزات أبدا.`.github/workflows`الوصول المتسع من خلال قراءة فقط في GitHub App ليس بديهيًا فعليًا ، لذلك يجب إجراء إصدارات ملفات الوكيل في قائمة السماح بها.

## المكونات
```
GitHub issue 被标记为 `@agent fix` 或 PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task（或 GitHub Actions self-hosted runner）
       - pull repo
       - infer Dockerfile（language、package manager）
       - Daytona / E2B sandbox，带 target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 或 GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v（已验证）
    git push + 通过 GitHub App open PR
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator review；可以 @-mention agent 进行 follow-ups
```

## 技术
- محفز: 具備 رموز حبة رفيعة من اطلاق GitHub؛ من خلال Lambda أو Fly.io من قبل استقبيل الويب هوك
- عامل: ECS Fargate مهمة ((أو GitHub Actions المضيفة الذاتية)
- صندوق الرمال: لكل مهمة حاوية إصدار دايتونا أو صندوق رمل E2B
- خلية العميل:  على أساس كلود أوبوس 4.7 / GPT-5.4-Codex من خليط أساسي من العميل أو SWE-عميل v2
- الاسترداد: خريطة إعادة التأمين على الحارس + إزالة
- التحقق: المعلومات المعلوماتية الكاملة في صندوق الرمل + بوابة التغطية
- الملاحظة: Langfuse,带 per-PR أرشيف تتبع,并从 PR الهيئة 链接
- الميزانية: سقف الدولار اليومي لكل ريبو ؛ لكل ريبو


```figure
cf-issue-to-pr
```

## بناءها
1. **GitHub App.**رمز التثبيت المحدد:أشخاص يقرأون+يسجلون、سحبون_طلبات يكتبون、المحتويات يقرأون+يسجلون、تدفقات العمل يقرأون。حماية الفرع ((الوحيدة التي يمكن أن تفعل ذلك على السطح)`main`和 ممنوعة الضغط القسري ;app 不在绕行列表 中── العامل على الاختلاف المقترح 执行禁止写入 `.github/workflows`                                                                                                                                                                                                                                                              

2. **Webhook receiver.**وظيفة لامبدا 接收 issue label / PR comment webhooks──按 label `@agent fix this`过──入队到SQS──

3. **Dispatcher.**من SQS 弹出任务──强制执行 per-repo per-day budget── باستخدام URL الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءات الإجراءاتاتات الإجراءات الإجراءاتاتات الإجراءاتاتاتاتات الإجراءاتاتاتاتات الإجراءاتاتاتاتات الإجراءاتاتاتاتاتاتاتاتات الإجراءاتاتاتاتاتاتاتاتاتاتاتات الإجراءاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتات الإجراءاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتاتات

4. **Environment inference.**检测 language(Python、Node、Go、Rust) ومدير الحزمة(uv、pnpm、go mod、cargo)

5. **Agent loop.**استخدام Claude Opus 4.7 من الوكيل الصغرى أو الوكيل SWE v2── أدوات: ripgrep、tree-sitter repo-map、read_file、edit_file、run_tests、git──硬限制: 20 دولار تكلفة、30 دقيقة ساعة الحائط、30 دورة وكيل‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

6. **Verification.**بعد نهاية الحلقة، يتم تنفيذ مجموعة اختبار كاملة في صندوق الرمل.`needs-review`علامة العلاقات العامة

7. **PR posting.**تمكن من إعادة التأثير على الموقع الإلكتروني.

8. **Credential hygiene.**عامل استخدام قصير الأجل رموز تثبيت تطبيق GitHub 运行。Logs 在归档前会 scrub secrets。

9. **Eval.**30 个不同难度的种种内部问题――衡量通过率、PR质量(不同规模、风格、覆盖)、成本、延迟――在同样的问题上与Cursor Background Agents 和 AWS Remote SWE Agents对比――

## استخدمها
```
# on github.com
  - user 用 `@agent fix this` 标记 issue #842
  - 14 分钟后出现 PR #1903
  - body:
    > 修复了 widget.dedupe() 中由 null comparator entry 导致的 NPE。
    > 添加了 regression test widget_test.go::TestDedupeNullComparator。
    > Coverage delta: +0.12%
    > Turns: 7  Cost: $1.80  Trace: langfuse:...
    > Label: needs-review
```

## 交付 it
`outputs/skill-issue-to-pr.md`هو قابل للتسليم. عميل في غيتهوب التطبيق + السحابة غير المزامن، يمكن تحويل قضايا مع التكلفة المحدودة و المراجع المحددة.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 30 个 issues 上的 pass rate | End-to-end success（CI green + coverage OK） |
| 20 | PR quality | Diff size、coverage delta、style conformance |
| 20 | 每个已解决 issue 的 cost 和 latency | 每个 PR 的 $ 和 wall-clock |
| 20 | Safety | Scoped token、per-repo budget、no force-push、credential hygiene |
| 15 | Operator UX | Rationale comments、retry affordance、@-mention follow-up |
| **100** | | |

## التدريب
1. 添加一个fix flaky test 模式:label `@agent stabilize-flake TestX`في صندوق الرمال، تم إجراء هذا الاختبار 50 مرة، وقدم تحديداً بسيطاً يمكن أن يثبت ذلك.

2. في ثلاثة قضايا مشتركة، أعلى مقارنة مع تكاليف وكلاء خلفية كورسور.

3. 实现a budget dashboard:per-repo per day cost、per-user cost──对异常 发出警报──

4. بناء نموذج جاف: لا يعمل على إطار إدارة العمليات العامة، وبالتالي يمكن للمراجعين وضع خطة فحص منخفضة التكلفة.

5. 添加保留政策: أكثر من 7 فرع للاتحادات العلاقات العامة لم يتم دمجها 会自动删除──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GitHub App | “Scoped bot identity” | 具备 fine-grained permissions + short-lived installation token 的 App |
| Async cloud agent | “Background agent” | 在 cloud sandbox 中运行的 non-interactive worker，而不是 terminal |
| Environment inference | “Dockerfile synthesis” | 检测 language + package manager，若缺失则生成 Dockerfile |
| Verification | “CI-in-sandbox” | 打开 PR 前在 worker 内运行完整 test suite |
| Coverage delta | “Coverage preservation” | 从 base 到 agent branch 的 test coverage % 变化 |
| Per-repo budget | “Daily ceiling” | 在 dispatcher 强制执行的 dollar 和 PR-count cap |
| Rationale | “PR body explanation” | agent 对变更内容及原因的总结；PR body 中必须包含 |

## 延伸阅读
- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) 标准 مرجع وكيل السحابة غير المزامنة
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) إشارة لـ CLI
- [Cursor Background Agents](https://docs.cursor.com/background-agent)البديل التجاري
- [OpenAI Codex (cloud)](https://openai.com/codex)منافس مضيف
- [Google Jules](https://jules.google) النسخة المضيفة لـ Google
- [Factory Droids](https://www.factory.ai) إشارة تجارية بديلة
- [GitHub App documentation](https://docs.github.com/en/apps) الهوية المحددة للروبوت
- [Daytona cloud sandboxes](https://daytona.io) صندوق الرمل المرجعي
