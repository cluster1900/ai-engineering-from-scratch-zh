# प्रश्न उत्तर 系统

> तीन प्रकार के सिस्टम ने आधुनिक QA को आकार दिया है। निष्कर्षण के लिए खोजें। रिकवरी-उन्नत उन्हें दस्तावेजों में आधार देना।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 5 · 11 (मशीन अनुवाद), चरण 5 · 10 (ध्यान)
**Time:** ~75 minutes

## 问题

User input "पहला iPhone कब लॉन्च हुआ था?", अपेक्षित प्राप्त "29 जून 2007" नहीं "Apple का इतिहास लंबा और विविध है।" न ही अकेले शून्य में "2007", कोई वाक्य नहीं है।

पिछले दशक में, तीन प्रकार की वास्तुकला ने QA को प्रमुखता दी है।

- **Extractive QA。**给定一个问题 和一个已知含有答案的段落,在段落中找到答案跨度的开始和结尾指数──SQuAD एक विधिक मापदंड है──
- **Open-domain QA。**पहले संबंधित पाठ प्राप्त करें, फिर निकालें या एक उत्तर उत्पन्न करें।
- **Generative / Closed-book QA。**एक बड़ी भाषा मॉडल इसकी पैरामीटरिक स्मृति से 中回答── कोई पुनर्प्राप्ति── इन्फेरेंस 最快, लेकिन तथ्य विश्वसनीयता न्यूनतम──

2026 के लिए प्रवृत्ति हाइब्रिड हैः सबसे अच्छा कुछ अंशों को पुनर्प्राप्त करें, फिर एक जनरेटिव मॉडल को प्रेरित करें, इसे इन अंशों पर आधारित बनाएं।

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**प्रयोग करें ट्रांसफार्मर (BERT परिवार) के साथ प्रश्न को कोडित करें 和 passage── प्रशिक्षण दो सिर,分别预测 उत्तर के प्रारंभ और अंत टोकन सूचकांक── हानि है वैध पदों पर ऊपर के क्रॉस-एन्ट्रोपी──输出是 passage में एक span──按构造不会幻觉,也按构造无法处理 passage 不能回答问题──

**Retrieval-augmented (RAG)。**两个阶段――首先, शरीर से रिट्रीवर को शीर्ष पर ढूंढना-`k`पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, पाठकों को अलग करने के लिए, और पाठकों को अलग करने के लिए, और पाठकों को अलग करने के लिए, और पाठकों को अलग करने के लिए, और पाठकों को अलग करने के लिए, और पाठकों को अलग करने के लिए, और अन्य के बीच में, और अन्य के बीच में शामिल करने के लिए, और अन्य के बीच में, और अन्य के बीच में, जो एक के बीच में शामिल करने के लिए, के बीच में, के बीच में, के बीच में, जो एक, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में, के बीच में,

**Generative。**एक केवल डीकोडर LLM (GPT、Claude、Llama) से सीखे गए वजनों में से उत्तर── कोई पुनर्प्राप्ति कदम नहीं── सामान्य ज्ञान पर प्रदर्शन, दुर्लभ या हालिया तथ्यों पर संभव आपदाजनक विफलता──भ्रमण दर तथा पूर्व-प्रशिक्षण डेटा में तथ्य आवृत्ति 负相关──


```figure
qa-span
```

##  इसे निर्माण

### 步骤 1: पूर्व प्रशिक्षित मॉडल का उपयोग करें निष्कर्षण QA

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

`deepset/roberta-base-squad2`SQuAD 2.0 में अपूर्ण प्रश्न शामिल हैं।`question-answering`पाइपलाइन यहां तक कि मॉडल के शून्य स्कोर में भी जीत के समय, यह उच्चतम स्कोर span पर वापस आ जाएगा, यह स्वचालित रूप से रिक्त जवाबों पर वापस नहीं आएगा।`handle_impossible_answer=True`जब शून्य स्कोर सभी स्कोर से अधिक होता है, तब ही पाइपलाइन रिक्त उत्तर को वापस लौटाएगी।`score`字段──

### 步骤 2: एक पुनर्प्राप्ति-वृद्धि पाइपलाइन(草图)

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

两阶段管道──Dense retriever(Sentence-BERT) सेमॅटिक समानता के माध्यम से 找到相关段落──RoberTa-SquAD) से संयुक्त并后 के शीर्ष段中抽取答 span──适用于小型 corpora──对百万文档级 corpus,使用 FAISS或向量数据库──

### 步骤 3: RAG का उपयोग करके जनरेटिव बनाएं

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

शीघ्र प्रवृत्ति  बहुत महत्वपूर्ण──明确告诉模型 基于文本 作答,并在文本不足时回复"मुझे नहीं पता",相比天真提示,可将幻觉率 降低 40-60%──更复杂的模式 会加入引用、自信分和结构化提取──

### 步骤 4:  वास्तविक दुनिया के मूल्यांकन को प्रतिबिंबित करना

SQUAD उपयोग **Exact Match (EM)**和 **token-level F1**◦EM 后的严格匹配 (पहले सामान्यीकरण के बाद) ◦ कम अक्षर, पट्टी अंकन, हटाने के लेख), ◦ या भविष्यवाणी 完全匹配, ◦ 0 分──F1 基于预测和参考 之间的 टोकन ओवरलैप 计算,并给予部分分数──两者都会低估抛词:"29 जून 2007" vs "29 जून 2007" "通常会得到 0 EM(ordinal 打破了正常化), लेकिन अभी भी टोकन ओवरलैप 由于观念得到可见的 F1──

प्रोडक्शन QA के लिएः

- **Answer accuracy**(LLM-judged या मानव-judged, चूंकि मेट्रिक्स 无法捕捉语义等价)
- **Citation accuracy。**引用的 passage 是否真的支持答案? उत्पन्न उद्धरणों और प्राप्त हुए पाठों के बीच स्ट्रिंग मैच स्वचालित जांच, कठिनाई बहुत कम है
- **Refusal calibration。**जब उत्तर नहीं है प्राप्त पदों में 中时,系统是否正确说出"मुझे नहीं पता"?
- **Retrieval recall。**⇒ मूल्यांकन पाठक  पहले, पहले रेट्रीवर को मापें कि क्या सही पाठ  शीर्ष में रखा गया है `k`◊ पाठक 无法修复缺失的段落──

### RAGAS:2026 के उत्पादन मूल्यांकन ढांचे

`RAGAS`यह विशेष रूप से RAG प्रणालियों के लिए डिज़ाइन किया गया है, और यह 2026 के लिए शिपिंग डिफ़ॉल्ट है।

- **Faithfulness。**उत्तर में प्रत्येक दावा है कि क्या पुनर्प्राप्त संदर्भ से आया है? एनएलआई के आधार पर अंतर्निहित 衡量── यह आपकी मुख्य प्यास मेट्रिक्स है।
- **Answer relevance。**उत्तर है या नहीं प्रतिक्रिया प्रश्न? उत्तर से उत्पन्न होने वाले परिकल्पना प्रश्न,并与真实问题比较来衡──
- **Context precision。**प्राप्त टुकड़ों में, वास्तविक संबंधित अनुपात कितना है? कम सटीकता = त्वरित मध्य शोर।
- **Context recall。**प्राप्त सेट क्या सभी आवश्यक जानकारी शामिल है?कम याद = पाठक 无法成功──

संदर्भ मुक्त स्कोरिंग 让你在没有策划的黄金答案的情况下评估现场生产流量──对精确匹配的指标 无用的开放式问题,其上叠加LLM-as-judge──

`pip install ragas`◊ अपने रिट्रीवर + रीडर में प्रवेश करें ◊ प्रत्येक क्वेरी ◊ चार स्केल प्राप्त करें ◊ प्रतिगमन पर चेतावनी जारी करें ◊

## इसका उपयोग करें

2026 के वर्ष का ढेर

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

2026 में, निष्कर्षण क्यूए लोकप्रिय नहीं है, क्योंकि एलएलएम के साथ आरएजी अधिक परिस्थितियों को संभाल सकता है। लेकिन शाब्दिक उद्धरण की आवश्यकता के परिदृश्य में, यह अभी भी ऑनलाइन होगाः कानूनी अनुसंधान, नियामक अनुपालन, ऑडिट उपकरण।

## 交付 यह

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

## अभ्यास

1. **Easy。**ऊपर दिए गए 10 विकिपीडिया अनुच्छेदों में से ऊपर SQuAD निष्कर्षण पाइपलाइन को सेट किया गया है।
2. **Medium。**添加一个拒绝分类器──当最高检索分 低于值(比如0.3 cosine)时,返回"मुझे नहीं पता",而不是调用读者──在延期设置上调整门──
3. **Hard。**आप चुने हुए 10,000 दस्तावेजों के एक निकाय में एक आरएजी पाइपलाइन का निर्माण करें। हाइब्रिड रिट्रीवल को प्राप्त करें।

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
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) बेंचमार्क 论文──
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) डीपीआर,QA का कैनोनिक घने रिट्रीवर。
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名 RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) पूर्ण रॅग सर्वेक्षण
