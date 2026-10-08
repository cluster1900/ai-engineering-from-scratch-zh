# التفكير:التعلم المُعزز باللغة

> 基于 Gradient的RL 需要数千次试验和一个GPU集群 才能修复一种失败模式──Reflection(Shinn et al., NeurIPS 2023) باستخدام اللغة الطبيعية لإنجاز هذا الشيء: بعد كل تجربة فشلت، وكيل 写下一段反思،将其存储在节目记忆,并让下一次试验基于这一段记忆──这是莱塔的睡眠时间计算、Claude Code的CLAUDE.md学习,以及 pro-workflow的学习规则 背后的模式──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## 學习目标
- يقولون عن ثلاثة عناصر التفكير (الجهاز الممثل والمقيّم والمعكس الذاتي) ودور الذاكرة الحلقة.
- 实现 a stdlib Reflection loop, يحتوي على تقييم ثنائي ‬البفر للتفكير 和全新的 محاولات إعادة
- 针对给定任务,在规模化、理学和自评反源之间做选择──
- شرح لماذا التكثيف اللفظي يمكن أن يلتقط على أساس RL على درجة تحتاج إلى آلاف التجارب لتصحيح الخطأ.

## 问题
وكيل واحد  المهمة فشلت. في المعيار RL، ستقوم مرة أخرى بتجربة آلاف التجارب، وتحساب تراجعات، وتحديث الأوزان.

التفكير ((شين وغيره ، arXiv:2303.11366) طرح مشكلة أخرى: إذا كان العميل ٍ فقط يفكر بنفسه لماذا فشل ،并把 هذه الفكرة في الفور 里再试一次,会怎么?

النتيجة هي: في عالم الف الف، تجاوزت ReAct وغيرها من خطوط الأساس المعدلة. في HotpotQA، كان هناك تحسينات في التحول إلى ReAct. في إنتاج الشفرة (HumanEval/MBPP) ، بلغ الحالة الفنية في ذلك الوقت.

## 概念
### المكونات الثلاثة

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

إضافة إلى هيكل بيانات:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

سأقوم بإجراء محاكمة مع الممثل. إذا كانت النتيجة أقل، فإن المرشح الذاتي سيخلق جزءاً من التفكير.

### ثلاثة أنواع من المقيّمين

1. **Scalar** إشارة ثنائية خارجية ∙ ALFWorld نجاح أو فشل ∙ HumanEval اختبارات 通过或失败 ∙ 最简单,信号 最强──
2. **Heuristic** 预定义的失败签名──如果 العميل 连续两次产生相同行动,就标记为卡住──如果轨迹 超过50 خطوة,就标记为不有效──
3. **Self-evaluated** ماجستير في التدريس على مسارها 打分──当没有基础真相 时需要它──信号较弱;适合工具基化验证 搭配使用(درس 05  CRITIC) 

2026 سنة المعتمدة الممارسة هي الاختلاط: قابل استخدام وقت مع القياس، لا يمكن استخدام وقت مع نفسية، الهيورستيكا كحافيات السلامة.

### لماذا هذا يُعظم

التفكير بدلا من أن يكون خوارزمية جديدة، ليس مثل أن يكون نموذج مسمى. تقريبا كل منتج عامل شفاء ذاتي  يعمل على نوع من التغيرات:

- حساب وقت النوم ليتا ((درس 08): عميل مستقل 反思过去的对话,并写入记忆块──
- كود كود `CLAUDE.md`/  حفظ الذاكرة 模式:将反思 捕获为学习,并预pendi إلى جلسات مستقبلية‬
- التدفقات العملية`/learn-rule`القيادة:将 تصحيحات 捕获为显式规则──
- عقدات التفكير من LangGraph: عقدة للخروج 打分، و في حاجة وقت الطريق إلى تحسينها

كلّها من نفس الفهم: اللغة الطبيعية هي وسيلة غنية بما فيه الكفاية، يمكن أن تحمل بين الجري.

### ماذا يحدث؟ ماذا يحدث؟

التفكير 适用于:

- هناك إشارة فشل واضحة ((فشل اختبار ‧خطأ أداة ‧جواب خاطئ)
- فئة المهام 可复现( نفس النوع من المشاكل سوف تظهر مرة أخرى)
- التفكير هناك مساحة لتحسين المسار ((هناك ميزانية عمل كافية)

لا ينطبق على:

- العميل أول محاولة نجحت بالفعل
- 失败来自外部因素 网络 down 工具 broken) 反思 网络 down 对未来 runs 没有帮助──
- التفكير أصبح مصداقًا لبعض الأحيان

في عام 2026، تتم إعادة تشغيل المكافأة التدريبية، حيث يتم إعادة تشغيل المكافأة التدريبية، مع تغيرات كبيرة، مع إعادة تشغيل المكافأة التدريبية.


```figure
react-trace
```

## بناءها
`code/main.py`في لغز لعبة 上实现 التفكير: إنشاء قائمة 3 عناصر ، وجعل مجموعها 等到目标值.

المكونات:

- `Actor`سياسة مكتوبة، في رؤية التفكير
- `Evaluator.binary()`  على أساس المبلغ المستهدف من الإجازة/الفشل
- `SelfReflector` 生成一行 تشخيص الفشل
- `EpisodicMemory` قائمة محدودة من معنى TTL

运行:

```
python3 code/main.py
```

التتبع  عرض ثلاث مرات التجارب. التجربة 1  فشل, تخزين  التفكير. التجربة 2  رؤية التفكير  بعد كان هناك بعض التحسينات ولكن لا يزال يفشل. التجربة 3 نجاح.

## استخدمها
ستعكس LangGraph  كمخطط عقد 提供──Claude Code `/memory`أمر و تدفق العمل`/learn-rule`سوف يتم تحويل المضخم الحادثي إلى ملف Markdown 文件。 حساب وقت النوم في وقت التوقف                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `Session`لبنائها

## 交付 it
`outputs/skill-reflexion-buffer.md`创建并维护一个剧情缓冲,包含反射捕捉、TTL 和减倍――给定一个任务类 和一次失败,它会产出一段真正帮助下一次试验的反射(而不是泛泛的要更加小心)

## التدريب
1. من المقيّم الثنائي إلى المقيّم المعيّد للعودة
2. بعد ذلك، هل التفكير القديم مضر أم مفيد؟
3. 实现 heuristic evaluator: إذا كان نفس العمل يعود مرة أخرى،就将试验 标记为卡了──
4. استخدام会忽略反射的逆境演员 运行反射――为了迫使演员 لاحظهم، أدنى التفكير في التنبؤ هو ما هو؟
5. 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅 阅     阅 阅                                                                                                              

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366)ورقة كلاسيكية
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) إنتاج 中的异步反射
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) إدارة الحلقة المضخة  كجزء من السياق
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)نمط عقدة التأرجح
