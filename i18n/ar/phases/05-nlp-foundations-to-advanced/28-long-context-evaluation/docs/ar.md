# تقييم طويل الأمد  NIAH، RULER، LongBench، MRCR

> جيميني 3 برو 宣称拥有10M توكنات سياقي. 在1M توكنات أسفل،8 إبرة MRCR 降至26.3%──宣称 ≠可用──长文背景评估 会告诉你正在上线的模型的实际容量──

**类型：**學习
**语言：**بايثون
**先修要求：**المرحلة 5 · 13(إجابة على الأسئلة)
**时间：**حوالي 60 دقيقة

## 问题

أنت تملك عقد من 200 صفحة. النموذج يدعي أن هناك 1M-الرموز السياق. أنت تملك عقد من خلال الموقع.

هذا هو الفجوة بين القدرات السياقية في عام 2026، والتي تظهر في الميزات 1M أو 10M، والحقيقة هي أن 60 إلى 70٪ منها ممكنة، ويمكن استخدامها  يعتمد على المهمة.

- **Retrieval（haystack 中的 single needle）：**في النماذج الحدودية، حتى أقصى قيمة الإعلان تقترب من الكمال.
- **Multi-hop / aggregation：**معظم الطرازات في أكثر من 128K                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- **对分散 facts 的 reasoning：**أول مهمة فشلتها

تقييم السياق الطويل قياس هذه الدرجات. هذا الدروس سوف يوضح هذه المعايير.

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**وضع كلمة سحرية هو الننابال () في المجال الطويل من المجال المركزية للعمق.

**RULER（Nvidia，2024）。**覆盖 4 个类别的 13 种类型任务:检索(单键 / 多键 / 多值) ]]多跳跟踪(variable tracking) ]] 聚合 ((频率) ]] QA──语境长度可配置(4k到128k+) ]];; 它会揭示那些在NIAH 上和但在多跳上失败的模型──在2024年发布版本,17 个声称32k+ 语境模型中,只有一半能保持质量在32k ;;

**LongBench v2（2024）。**503 طرق أسئلة متعددة الاختيارات,8k-2M سياقات الكلمات,六个任务类别:QA واحد الوثيقة、QA متعدد الوثيقات、التعلم في السياق طويل الأمد、حوار طويل、ردود التشخيص、بيانات مهيكلة طويلة── إنها تستخدم في العالم الحقيقي لتقييم مستوى إنتاج السلوكيات في السياق الطويل──

**MRCR（Multi-Round Coreference Resolution）。**الكبيرة الكبيرة متعددة التحولات الإشارة الأساسية. يحتوي على 8 إبرة 24 إبرة 100 إبرة 变体.

**NoLiMa。**إبرة غير للكسيكية──إبرة مع استفسار 没有字面重叠;الانتعاش 需要一步语义推理──比 NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问――测试 انتباه انتقائي──

**BABILong。**سوف أضع سلسلة التفكير في حفرة الخشب.

###  فعليّاً يجب أن تقرّر ماذا

- **Advertised context window。**规格表上的数字──
- **Effective retrieval length。**نياخ فى قيمة منخفضة على سبيل المثال 90٪
- **Effective reasoning length。**التجميع أو التجميع في 該值下通過
- **Degradation curve。**دقة مقابل طول السياق، حسب المهام نوعاً من التخطيط.

تحديدات المعلومات تتطلب رقمين: استعادة فعالة و التفكير فعالة.


```figure
gx-niah-decay
```

## بناءها

### الخطوة 1: قم ببناء NIAH المحدد الخاص بك

见 `code/main.py`骨架如下:

```python
def build_haystack(filler_text, needle, depth_ratio, total_tokens):
    if not (0.0 <= depth_ratio <= 1.0):
        raise ValueError(f"depth_ratio must be in [0, 1], got {depth_ratio}")
    if total_tokens <= 0:
        raise ValueError(f"total_tokens must be positive, got {total_tokens}")

    filler_tokens = tokenize(filler_text)
    needle_tokens = tokenize(needle)
    if not filler_tokens:
        raise ValueError("filler_text produced no tokens")

    # Repeat filler until long enough to fill the haystack body.
    body_len = max(total_tokens - len(needle_tokens), 0)
    while len(filler_tokens) < body_len:
        filler_tokens = filler_tokens + filler_tokens
    filler_tokens = filler_tokens[:body_len]

    insert_at = min(int(body_len * depth_ratio), body_len)
    haystack = filler_tokens[:insert_at] + needle_tokens + filler_tokens[insert_at:]
    return " ".join(haystack)


def score_niah(model, haystack, question, expected):
    answer = model.complete(f"Context: {haystack}\nQ: {question}\nA:", max_tokens=50)
    return 1 if expected.lower() in answer.lower() else 0
```

扫描 `depth_ratio`∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens`∈ {1k، 4k، 16k، 64k}── رسم خريطة حرارة── هذا هو نموذج الهدف من بطاقة NIAH──

### الخطوة الثانية: الإبر المتعدد 变体

```python
def build_multi_needle(filler, needles, total_tokens):
    depths = [0.1, 0.4, 0.7]
    chunks = [filler[:int(total_tokens * 0.1)]]
    for depth, needle in zip(depths, needles):
        chunks.append(needle)
        next_chunk = filler[int(total_tokens * depth): int(total_tokens * (depth + 0.3))]
        chunks.append(next_chunk)
    return " ".join(chunks)
```

مثل هذه الكلمات السحرية الثلاثة هو ما؟ هذه الأسئلة تحتاج إلى العثور على كل ثلاثة.

### الخطوة 3: تعقب المتغيرات متعددة المكالمات (مثل القيادة)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三次赋值――جداول الحدود في 128k 时, دقة هنا 经常会降至 50-70%──

### الخطوة 4: في كومة الخاص بك على متن LongBench v2

```python
from datasets import load_dataset
longbench = load_dataset("THUDM/LongBench-v2")

def eval_model_on_longbench(model, subset="single-doc-qa"):
    tasks = [x for x in longbench["test"] if x["task"] == subset]
    correct = 0
    for x in tasks:
        answer = model.complete(x["context"] + "\n\nQ: " + x["question"], max_tokens=20)
        if normalize(answer) == normalize(x["answer"]):
            correct += 1
    return correct / len(tasks)
```

按类别报告精度──حصات إجمالية ستخفي اختلافات كبيرة في مستويات المهام──

## فخ

- **仅 NIAH evaluation。**في 1M tokens 下通过 NIAH,并不能说明多跳表现──始终运行 RULER 或自定义多跳测──
- **Uniform depth sampling。**很多实现只测试深度=0.5──测试深度=0、0.25、0.5、0.75、1.0, Lost in the middle效应是真实存在的──
- **与 filler 的 lexical overlap。**إذا كان الإبر مع المملأ مشاركة الكلمات الرئيسية، سوف تصبح عملية الاسترداد بسيطة جدا.
- **忽略 latency。**1M-token استفسارات الاحتمالات الاحتمالية  تحتاج 30-120 ثانية ⋅ في الدقة ⋅ خارج مع قياس الوقت إلى أول-token‬
- **Vendor-self-reported numbers。**أوبن آي Google الأنثروبيك مدينة تنشر حصتها الخاصة.

## استخدمها

2026 سنة:

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

النظام التجربة البيئية الناتج عن النمو: في المدى المستهدف لإنجاز NIAH + 1 个 个 之前,永远不要信任背景窗口──

## 交付 it

保存为 `outputs/skill-long-context-eval.md`:

```markdown
---
name: long-context-eval
description: Design a long-context evaluation battery for a given model and use case.
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

Given a target model, target context length, and use case, output:

1. Tests. NIAH depth × length grid; RULER multi-hop; custom domain task.
2. Sampling. Depths 0, 0.25, 0.5, 0.75, 1.0 at each length.
3. Metrics. Retrieval pass rate; reasoning pass rate; time-to-first-token; cost-per-query.
4. Cutoff. Effective retrieval length (90% pass) and effective reasoning length (70% pass). Report both.
5. Regression. Fixed harness, rerun on every model upgrade, surface deltas.

Refuse to trust a context window from the model card alone. Refuse NIAH-only evaluation for any multi-hop workload. Refuse vendor self-reported long-context scores as independent evidence.
```

## التدريب

1. **Easy。**构建一个3 个深度(0.25、0.5、0.75) × 3 个长度(1k、4k、16k) من NIAH──在任意模型上运行──将通过率 绘制成3×3热图──
2. **Medium。**إضافة 3 إبرة 变体── قياس كل طول 下是否能找到回全部 3 个── مع نفس طول واحد الإبرة معدل مرور مقابل
3. **Hard。**构构造一个变量追踪任务(X1 → X2 → X3,3 hops),Embedding 64k filler 中──测量 3 个边界模型的精度──报告每个模型的有效推理长度──

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| NIAH | Needle in haystack | 在 filler 中植入一个 fact，让 model 找回它。 |
| RULER | 加强版 NIAH | 覆盖 retrieval / multi-hop / aggregation / QA 的 13 种任务类型。 |
| Effective context | 真实容量 | accuracy 仍高于阈值的长度。 |
| Lost in the middle | Depth bias | Models 对长输入中间部分的内容关注不足。 |
| Multi-needle | 一次多个 facts | 多个植入项；测试 Attention 的同时处理能力，而不只是 retrieval。 |
| MRCR | Multi-round coref | 8、24 或 100-needle coreference；暴露 Attention 饱和。 |
| NoLiMa | Non-lexical needle | Needle 和 query 没有字面 tokens 重叠；需要 reasoning。 |

## 延伸阅读

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 原始 نياھ repo。
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) مقياس متعدد المهام
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) حقيقة العالم تقييم سياق طويل
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) 更难的针
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149)التفكير في كومة العشب
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172)التمييز العميق
