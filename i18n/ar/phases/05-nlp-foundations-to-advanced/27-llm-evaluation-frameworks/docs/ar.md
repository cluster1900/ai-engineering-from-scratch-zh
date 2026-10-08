# تقييم الجامعة  RAGAS، DeepEval، G-Eval

> المقابلة الدقيقة و F1 سوف تفقد معنى التقييمات. لا يمكن تحديد حجمها.

**类型：**الإنشاء
**语言：**بايثون
**前置要求：**المرحلة 5 · 13 (إجابة على الأسئلة) ، المرحلة 5 · 14 (استعراض المعلومات)
**时间：**75 دقيقة

## 问题

رد: 29 يونيو 2007
الإشارة الذهبية هي:"29 يونيو 2007".
المباراة الدقيقة حصلت على 0: F1 حصلت على حوالي 75%:

الآن ضرب 10،000 测试用例──再 ضرب كل تغيير في الرد أو التقاط أو التسريع أو النموذج── تحتاج إلى مناقش: فهو يفهم المعنى، يمكن أن تكون قياسية منخفضة التكلفة، لن تكون في التراجع على الكذب، وممكنة الكشف عن أساليب الفشل الصحيحة──

في عام 2026 سيكون هناك ثلاثة إطار يدير هذا المشكلة

- **RAGAS.**الاسترداد-تقييم الجيل المُزيد من التقديرات العلمية.
- **DeepEval.**面向 LLMs 的 Pytest──G-Eval、التزام-إكمال、الوهولات、التحيز المقاييس──CI/CD-أصل‬
- **G-Eval.**一种方法(也是DeepEval metric):带 سلسلة من الفكر、自定义标准、0-1 score of LLM-as-judge。

ثلاثة من كل يعتمد على ماجستير في الدراسة كقاضي.

## 概念

![四个 evaluation dimensions，LLM-as-judge 架构](../assets/llm-evaluation.svg)

**LLM-as-judge.**استخدام ماجستير في العلوم الجامعية على أساس المادة 给输出打分,替代静态 метриک.`(query, context, answer)`،فقط قاضي LLM: "تجاوز 0-1 على الوفاء".

لماذا هو فعال: LLM يمكن أن تكون بأقل تكلفة تقريبية من القرارات الإصطناعية.$0.003 的成本，让 1000-sample regression eval run 成本低于 $5

لماذا سوف يفشل صامتة:

1. **Judge bias.**القاضي  أفضل إجابات  إجابات من عائلة النموذج الخاص بك  بالإضافة إلى إجابات من أسلوب التكيف السريع 
2. **JSON parsing failures.**错误 JSON → NaN score → 被静默排除在集体之外──RAGAS المستخدم مألوف جداً من هذا المشكلة──用 try/except + 显式 failure mode 做 gate──
3. **Drift over model versions.**القاضي الرفع سيتغير كل متريكه

**RAG 四件套。**

| Metric | 问题 | Backend |
|--------|----------|---------|
| Faithfulness | 答案中的每个 claim 是否来自 retrieved context？ | 基于 NLI 的 entailment |
| Answer relevance | 答案是否回应了问题？ | 从答案生成 hypothetical questions；与真实问题比较 |
| Context precision | 在 retrieved chunks 中，有多少比例相关？ | LLM-judge |
| Context recall | retrieval 是否返回了所需的一切？ | LLM-judge 对照 gold answer |

**G-Eval.**定义一个自定义标准:"هل يذكر الإجابة المصدر الصحيح؟" الإطار 会自动扩展为链思维评估步骤,然后给出0-1 评分──适合RAGAS 未覆盖的域特定质量尺寸──

**Calibration.**في عدم وجود صلة مع العلامات البشرية ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬


```figure
n5-judge-gauge
```

## بناءها

### الخطوة الأولى: استخدام NLI جعل الولاء ((مثل Ragas)

```python
from typing import Callable
from transformers import pipeline

nli = pipeline("text-classification",
               model="MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
               top_k=None)

# `llm` 是任意 callable：prompt str -> generated str。
# 示例：llm = lambda p: client.messages.create(model="claude-haiku-4-5", ...).content[0].text
LLM = Callable[[str], str]


def atomic_claims(answer: str, llm: LLM) -> list[str]:
    prompt = f"""把这个答案拆成简单的事实 claims（每行一个）：
{answer}
"""
    return llm(prompt).splitlines()


def faithfulness(answer: str, context: str, llm: LLM) -> float:
    claims = atomic_claims(answer, llm)
    if not claims:
        return 0.0
    supported = 0
    for claim in claims:
        result = nli({"text": context, "text_pair": claim})[0]
        entail = next((s for s in result if s["label"] == "entailment"), None)
        if entail and entail["score"] > 0.5:
            supported += 1
    return supported / len(claims)
```

سوف يتم تفكيك الردود على المطالبات الذرية.

### الخطوة 2: الارتباط

```python
import numpy as np
from sentence_transformers import SentenceTransformer

# encoder：任意实现 .encode(texts, normalize_embeddings=True) -> ndarray 的 model
# 例如：encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")

def answer_relevance(question: str, answer: str, encoder, llm: LLM, n: int = 3) -> float:
    prompt = f"写出 {n} 个这个答案可以回答的问题：\n{answer}"
    generated = [line for line in llm(prompt).splitlines() if line.strip()][:n]
    if not generated:
        return 0.0
    q_emb = np.asarray(encoder.encode([question], normalize_embeddings=True)[0])
    g_embs = np.asarray(encoder.encode(generated, normalize_embeddings=True))
    sims = [float(q_emb @ g_emb) for g_emb in g_embs]
    return sum(sims) / len(sims)
```

إذا كانت الإجابة تلمح أن المسألة تختلف عن الأسئلة الفعلية، فإن الصلة تتراجع.

### 步骤 3: G-Eval حدد المقاييس

```python
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams, LLMTestCase

metric = GEval(
    name="Correctness",
    criteria="答案应当事实准确，并匹配 expected output。",
    evaluation_steps=[
        "阅读 expected output。",
        "阅读 actual output。",
        "列出 actual output 中的事实 claims。",
        "对每个 claim，标记它是否被 expected output 支持。",
        "返回 score = 被支持的比例。",
    ],
    evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
)

test = LLMTestCase(input="When was the first iPhone released?",
                   actual_output="June 29th, 2007.",
                   expected_output="June 29, 2007.")
metric.measure(test)
print(metric.score, metric.reason)
```

خطوات التقييم هي المادة.

### الخطوة 4: بوابة CI

```python
import deepeval
from deepeval.metrics import FaithfulnessMetric, ContextualRelevancyMetric


def test_rag_system():
    cases = load_regression_cases()
    faith = FaithfulnessMetric(threshold=0.85)
    rel = ContextualRelevancyMetric(threshold=0.7)
    for case in cases:
        faith.measure(case)
        assert faith.score >= 0.85, f"faithfulness regression on {case.id}"
        rel.measure(case)
        assert rel.score >= 0.7, f"relevancy regression on {case.id}"
```

作为 pytest file 发布──每个 PR 都运行──出现回归──时阻止合并──

### الخطوة 5: تقييم الألعاب من الصفر

见 `code/main.py` استخدام فقط وفاء المشكلة (استعمال دعوى الإجابة مع التداخل بين السياق) والحالة (استعمال رموز الإجابة مع رموز السؤال)

## فخ

- **No calibration.**مع العلامات البشرية 相关性 فقط 0.3 من القضاة هو الضجيج
- **Self-evaluation.**استخدام نفس ماجستير في العلوم، ونجازي الحكم، سوف تحصل على درجات عالية 10-20%
- **Positional bias in pairwise judging.**القاضاة  تفضل أول عرض ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **Raw aggregate hides failures.**متوسط النتيجة 0.85 往往会藏藏 5% من الفشل الكارثي──始终检查底量──
- **Golden dataset rot.**مجموعة تقييم غير المصدر إذا كان التجول في الوقت، سوف يفسد التقارنات.
- **LLM cost.**في المشهد الحجمي، يطلق القاضي على المجال المختلف، " 主导成本 』, استخدام能满足校准门 的最便宜模型──GPT-4o-mini、Claude Haiku、Mistral-small──

## استخدمها

2026 كومة:

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS（4 metrics） |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | DeepEval 内的 G-Eval |
| Online live-traffic monitoring | reference-free mode 的 RAGAS |
| Human-in-the-loop spot checks | LangSmith 或 Phoenix，带 annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

典型堆:RAGAS做监测,DeepEval做 CI,G-Eval做新维度──三者都跑;分歧它们很有用──

## أصدرها

保存为 `outputs/skill-eval-architect.md`:

```markdown
---
name: eval-architect
description: 设计一个带 calibrated judge 和 CI gates 的 LLM evaluation plan。
version: 1.0.0
phase: 5
lesson: 27
tags: [nlp, evaluation, rag]
---

给定一个 use case（RAG / agent / generative task），输出：

1. Metrics。Faithfulness / relevance / context-precision / context-recall + 任何带 criteria 的自定义 G-Eval metrics。
2. Judge model。命名 model + version，并说明 cost vs accuracy 的理由。
3. Calibration。手工标注集大小，目标 Spearman rho vs human > 0.7。
4. Dataset versioning。Tag 策略、change log、stratification。
5. CI gate。每个 metric 的 thresholds、regression-window logic、bottom-quantile alert。

拒绝依赖未在 ≥50 个人工标注示例上测试过的 judge。拒绝 self-evaluation（同一 model 生成 + 判断）。拒绝没有 bottom-10% surfacing 的 aggregate-only reporting。标记任何 judge upgrade 未经过 parallel baseline eval 就落地的 pipeline。
```

## التدريب

1. **Easy.**في 10 个带已知幻觉的RAG示例 上使用RAGAS──验证忠诚度度度度度度 能抓到每一个──
2. **Medium.**手工将 50 个 QA إجابات 按正确性 标注为 0-1──用 G-Eval 打分──测量评官与人类 之间的Spearman rho──
3. **Hard.**استخدام DeepEval 构建 pytest CI gate──故意让retriever regress──验证 gate 会失败──通过对最低10%做门检查 添加底量子预警──

## 关键术语

| Term | 人们通常说 | 实际含义 |
|------|-----------------|-----------------------|
| LLM-as-judge | 用 LLM 打分 | Prompt 一个 judge model，根据 rubric 给 outputs 打 0-1 分。 |
| RAGAS | RAG metric library | 开源 eval framework，包含 4 个 reference-free RAG metrics。 |
| Faithfulness | 答案是否有依据？ | answer claims 中被 retrieved context entail 的比例。 |
| Context precision | retrieved chunks 是否相关？ | top-K chunks 中真正有用的比例。 |
| Context recall | retrieval 是否找全了？ | gold-answer claims 中被 retrieved chunks 支持的比例。 |
| G-Eval | 自定义 LLM judge | Rubric + chain-of-thought eval steps + 0-1 score。 |
| Calibration | 信任但要验证 | judge score 与 human score 之间的 Spearman correlation。 |

## 延伸阅读

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) راغاس 论文。
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) G-Eval 论文。
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) 开放生产 stack‬
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) التحيزات ‬التصفية ‬الحدود‬
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) 集成 RAGAS、DeepEval、فينيكس الإطار الموحد
