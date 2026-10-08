# سؤال يجيب 系统

> ثلاثة أنظمة شكلت QA الحديثة. الاستخراجية 找到 spans. استعادة-مزيد من وضعها على الأرض إلى الوثائق.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 5 · 11 (ترجمة الآلة) ، المرحلة 5 · 10 (التأمل)
**Time:** ~75 minutes

## 问题

User输入 "متى أطلقت أول جهاز آي فون؟" 期望得到 "29 يونيو 2007". "Not "تاريخ آبل طويل ومختلف".

في العقد الماضي، ثلاث أنواع من الهندسة المعمارية

- **Extractive QA。**给定一个问题 和一个已知包含答案的段落, 在段落中找到答案跨度的开始和结尾指数──SQuAD是正宗的基准──
- **Open-domain QA。**المقطع لا يُعطى. أولاً استرداد المقطع المرتبط، ثم استخراج أو توليد إجابة.
- **Generative / Closed-book QA。**نموذج لغة كبير من ذاكرة معاييرها 中回答──没有检索──Inference 最快,但事实可靠性最小──

الاتجاه في عام 2026 هو الهجين: استعادة أفضل عدة أحداث ثم تشجيع نموذج تولدي، جعلها تستند إلى هذه الأحداث 作答── هذا هو RAG، الدروس 14 سوف تدخل عميقة في الاستعراض هذا النصف──本课构建 QA هذا النصف──

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**مع معدات تحويل البيانات (بالإنجليزية: Using transformer (بالإنجليزية: WEB) مع رمزة السؤال 和 الممر. تدريب الرؤوس الثانية،分别预测 جوابة البداية والنهاية مؤشرات الرمز.

**Retrieval-augmented (RAG)。**أولاً، الوصول من الجسم في أعلى...`k`المراسلات::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

**Generative。**واحد فقط المعلمات المعدنية المعدنية المعدنية (GPT、Claude、Llama) من الوزن المتعلمين في الردود.


```figure
qa-span
```

## بناءها

### الخطوة 1: استخدام النموذج المُدرب مسبقًا القيام بـ QA الاستخراجية

```python
from transformers import pipeline

qa = pipeline("question-answering", model="deepset/roberta-base-squad2")

passage = (
    "Apple Inc. released the first iPhone on June 29, 2007. "
    "The device was announced by Steve Jobs at Macworld in January 2007."
)
question = "When was the first iPhone released?"

answer = qa(question=question, context=passage)
print(answer)
```

```python
{'score': 0.98, 'start': 57, 'end': 70, 'answer': 'June 29, 2007'}
```

`deepset/roberta-base-squad2`في تدريب SQuAD 2.0 上، والتي تتضمن أسئلة لا يجيبها`question-answering`النبيو حتى في النموذج صفر النتيجة عندما يفوز، سوف يعود أيضا أعلى نسبة النتيجة فترة، انها* لن* يعود تلقائيا إلى空答案── للحصول على واضحة "لا إجابة" 行为، يرجى الاتصال في النبيوة`handle_impossible_answer=True`عندما يزيد النتائج الصفرية عن كل النتائج، فإن الخط الرئيسي سيعود إلى الهواء.`score`字段。

### الخطوة الثانية: خط أنابيب معزز بالانتقال

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

corpus = [
    "Apple Inc. released the first iPhone on June 29, 2007.",
    "Macworld 2007 featured the iPhone announcement by Steve Jobs.",
    "Android launched in 2008 as Google's mobile operating system.",
    "The first iPod was released in 2001.",
]
corpus_embeddings = encoder.encode(corpus, normalize_embeddings=True)


def retrieve(question, top_k=2):
    q_emb = encoder.encode([question], normalize_embeddings=True)
    sims = (corpus_embeddings @ q_emb.T).squeeze()
    order = np.argsort(-sims)[:top_k]
    return [corpus[i] for i in order]


def answer(question):
    passages = retrieve(question, top_k=2)
    combined = " ".join(passages)
    return qa(question=question, context=combined)


print(answer("When was the first iPhone released?"))
```

两阶段管道──Dense retriever(Sentence-BERT) من خلال التشابه الدلالية 找到相关段落──RoberTa-SquAD) من الممرات العليا من合并后 中抽取答 span──适用于小型 corpora──对百万文档级 corpus,使用 FAISS或矢量数据库──

### الخطوة 3: استخدام RAG جعل مولد

```python
def rag_generate(question, llm):
    passages = retrieve(question, top_k=3)
    prompt = f"""Context:
{chr(10).join('- ' + p for p in passages)}

Question: {question}

Answer using only the context above. If the context does not contain the answer, say "I don't know."
"""
    return llm(prompt)
```

النمط السريع 很重要──明确告诉模型 基于背景 作答,并在背景 不足时回复 "أنا لا أعرف"،相比 السذاجة التحفيز،可将幻觉率 降低 40-60%──更复杂的模式 会加入引用、自信分和结构化提取──

### الخطوة الرابعة: تعكس تقييم العالم الحقيقي

SQUAD استخدام **Exact Match (EM)**和 **token-level F1** EM هو التطبيقات 后的严格匹配(قواعد الحروف الرسمية 条纹分类、删除文章),要么预测 完全匹配,要么得 0 分──F1 基于预测和参考 之间的代币重叠 计算,并给予部分分数──两者都会低估表情:"29 يونيو 2007" مقابل "29 يونيو 2007" "通常会得到 0 EM(ordinal 打破了正常化),但仍然因为观测代币重叠 获得可观的 F1──

لـ"مصدرات الإنتاج"

- **Answer accuracy**(حكم على الـLLM أو الحكم على الإنسان، لأن المقاييس لا يمكن أن تتمكن من فهم المساواة الـsemantic)
- **Citation accuracy。**引用的 passage 是否真的支持答案? يمكن من خلال الإقتباسات المولدة ومقاطع المشتقة  الصفوف المقابلة بين الصفوف
- **Refusal calibration。**عندما يجيب "غير في المقاطع المكتسبة 中时,系统是否正确说出" أنا لا أعرف "؟ قياس معدل الثقة الكاذبة
- **Retrieval recall。**قبل تقييم القارئ، أولاً تقييم المنتج إذا كان قد وضع المقطع الصحيح`k`القارئ لا يستطيع إصلاح المقطع المفقود

### إطار تقييم الإنتاج RAGAS:2026

`RAGAS`هو متخصص في تصميم أنظمة RAG ، وهو افتراضي للشحن في عام 2026.

- **Faithfulness。**كلّ ادعاء في المقابل هل يأتي من السياق المُسترد؟
- **Answer relevance。**الجواب هو إما أن يرد على السؤال؟ من خلال الإجابة تظهر أسئلة افتراضية، ومقارنة السؤال الحقيقي
- **Context precision。**كم هو النسبة المرتبطة بالواقع في القطاعات التي تم استردادها؟
- **Context recall。**المجموعة المكتسبة هل تحتوي على كل المعلومات التي تحتاج إليها؟

تسجيلات خالية من الإشارات 让你可以在没有策划金答案的情况下评估现场生产流量──对于精确匹配的指标 无用的开放式问题,在上面叠加LLM-as-judge──

`pip install ragas` إدخال الجهاز الخاص بك + القارئ  كل استفسار  الحصول على أربعة مقياس  إرسال تحذيرات على التراجع 

## استخدمها

2026 سنة

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

لا يزال الاختبار الاستخرجي في عام 2026 غير منتشرة، لأن RAG المرتبط بالدرجات العليا يمكن أن يعالج المزيد من الحالات. ولكن في حالة الحاجة إلى اقتباس حرفي، فإنه لا يزال على الإنترنت: البحوث القانونية، والمتابعة التنظيمية، وأدوات المراجعة.

## 交付 it

保存为 `outputs/skill-qa-architect.md`:

```markdown
---
name: qa-architect
description: Choose QA architecture, retrieval strategy, and evaluation plan.
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

Given requirements (corpus size, question type, factuality constraint, latency budget), output:

1. Architecture. Extractive, RAG with extractive reader, RAG with generative reader, or closed-book LLM. One-sentence reason.
2. Retriever. None, BM25, dense (name the encoder), or hybrid.
3. Reader. SQuAD-tuned model, LLM by name, or "domain-fine-tuned DistilBERT."
4. Evaluation. EM + F1 for extractive benchmarks; answer accuracy + citation accuracy + refusal calibration for production. Name what you are measuring and how you are measuring it.

Refuse closed-book LLM answers for regulatory or compliance-sensitive questions. Refuse any QA system without a retrieval-recall baseline (you cannot evaluate the reader without knowing the retriever surfaced the right passage). Flag questions that require multi-hop reasoning as needing specialized multi-hop retrievers like HotpotQA-trained systems.
```

## التدريب

1. **Easy。**في أعلى 10 مقاطع فيكيبيديا 上设置SQuAD استخراج خط الأنابيب──手工制作 10 أسئلة──قياس الإجابة 正确的频率──如果 المقاطع 和 الأسئلة 干净,你应该看到 7-9 个正确──
2. **Medium。**添加一个拒绝分类器──当最高检索分数 低于值(比如 0.3 cosine)时,返回"أنا لا أعرف"而不是调用读者──在保持设置上调整门──
3. **Hard。**في مجموعة من 10,000 وثيقة من اختيارك على بناء خط أنابيب RAG.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Extractive QA | 找到 answer span | 在给定 passage 中预测 answer 的 start 和 end indices。 |
| Open-domain QA | 对 corpus 做 QA | 没有给定 passage；必须先 retrieve，再 answer。 |
| RAG | Retrieve then generate | Retrieval-augmented generation。Retriever + reader pipeline。 |
| SQuAD | Canonical benchmark | Stanford Question Answering Dataset。EM + F1 metrics。 |
| Hallucination | 编造出来的 answer | Reader output 不受 retrieved context 支持。 |
| Refusal calibration | 知道什么时候闭嘴 | 系统在无法回答时正确说出 "I don't know"。 |

## 延伸阅读
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) مقياس مقياس 论文。
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR,QA's القنوية الكثيفة الاحتياطي
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名 RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) إجراءات استطلاع كاملة للـ RAG
