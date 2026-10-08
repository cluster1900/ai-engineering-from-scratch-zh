# Soru cevaplama 系统

> Üç sınıf sistem modern QA'yı şekillendirdi. Ekstraktif ı bulmak kapsamları. Geri alınma artışı, bunları belgelere yerleştirmek. İçinde.

**Type:** Build
**Languages:** Python
**先修要求：**5 · 11 aşama (makine çevirisi), 5 · 10 aşama (açıklama)
**Time:** ~75 minutes

## 问题

User input "İlk iPhone ne zaman piyasaya sürüldü?", "29 Haziran 2007" değil "Apple'ın tarihi uzun ve çeşitli. "

Geçtiğimiz on yılda üç çeşit mimarlık QA'yı yönlendirdi.

- **Extractive QA。**给定一个问题 和一个已知含答的段落,在段落中找到答 span 的开始和结尾指数──SQuAD olarak bilinen bir referanslıktır──
- **Open-domain QA。**İlk olarak, ilgili pasajları alın, sonra bir cevap alın veya oluşturun.
- **Generative / Closed-book QA。**Bir büyük dil modeli parametrik hafızasından 中回答──無復索──Inference 最快,但事实可靠性最小──

2026 yılının eğilimleri hibrid: en iyi birkaç pasajı geri almak, sonra bir jeneratif model oluşturmak, bu pasajlara dayalı bir cevap oluşturmak. İşte RAG, Ders 14'te derinlemesine konuşacak.

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**Üzerinde bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğine göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliğe göre, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreliçe, bir süreli, bir süreliçe, bir süreli, bir süreliçe, bir süreliçeçe, bir süreliçe, bir süreli, bir süreliçe, bir süreli, bir süreliçe, bir süreliçe, bir süreli, bir süreliçeçeçeçeçeçe, bir süreli, bir süreli, bir süreli, bir süreliçeçeçeçe

**Retrieval-augmented (RAG)。**İlk olarak, korpusun içinden yukarıdaki...`k`paragraflar──其次,reader(extractive or generative) use these passages 生成回答──retriever-reader 拆分让两者可以独立训练和评估──现代RAG genellikle ikisi arasında yeniden sıralamaya katılır──

**Generative。**Bir dekodör-tek LLM ((GPT、Claude、Llama) öğrenilen ağırlıklardan cevaplar. Hiçbir geri alma adımı yok.


```figure
qa-span
```

## Yapın onu.

### 步骤 1: önceden eğitilmiş model kullanın ve ekstraksif bir QA yapın

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

`deepset/roberta-base-squad2`SQUAD 2.0'da cevapsız sorular var.`question-answering`Pipeline hatta modelin sıfır puanı                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `handle_impossible_answer=True`Bu zaman sadece sıfır puanlar tüm zaman puanları çalırken, boru hattı 才会返回空答案──无论如何,都要始终检查`score`- Evet.

### 步骤 2: Bir geri alma artırılmış boru hattı (草图)

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

两阶段管eline──Dense retriever(Sentence-BERT) semantik benzerlik yoluyla 找到相关段文──Extractive reader(RoBERTa-SquAD) 中抽取答 span──用于小型 corpora──对百万文档级 corpus,使用FAISS或向量数据库──

### 步骤 3: RAG kullanmak için generatif yapın

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

Hızlı bir örnek  çok önemli。明确告诉模型 基于文本 作答,并在文本 不足时返回"Bilmiyorum",相比天真提示,可将幻觉率 降低 40-60%──更复杂的模式 会加入引用、自信スコア 和结构化抽取──

### 步骤 4: reality world değerlendirmesini yansıtmak

SQUAD  kullanım**Exact Match (EM)**和 **token-level F1**▽EM is normalization 后的严格匹配(minorcase、stripe punctuation、remove articles), 么预测 完全匹配, 么得 0 分──F1 基于预测 和参照 之间的代币重叠 计算,并给予部分分数──两者都会低估抛词:"29 Haziran 2007" vs "29 Haziran 2007" "通常会得到 0 EM(ordinal 打破了正常化), ancak yine de 观测代币重叠 获得可观的 F1──

İş üretiminin kalitesi için:

- **Answer accuracy**(LLM veya insan tarafından değerlendirilmiş, çünkü metrikler semantik eşdeğerliği kavramamaktadır)
- **Citation accuracy。**引用的 passage 是否真的支持答案? 引用与回收的段落之间的字符串匹配自动检查,难度很低──
- **Refusal calibration。**Çözüm: %1 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2 %2
- **Retrieval recall。**Bu yüzden, önce değerlendirme yapın.`k`◊ reader 无法修复缺失的段文──

### RAGAS:2026 yılı üretim değerlendirme çerçevesini

`RAGAS`RAG sistemleri için özel olarak tasarlanmıştır ve 2026 yılının nakliye öntanımlısıdır.

- **Faithfulness。**Cevap: Bu, en önemli halüsinasyon ölçüsüdür.
- **Answer relevance。**Cevapı evet ya da değil cevapladı soru? Cevaptan hipotetik sorular doğar,并与真题比较来衡──
- **Context precision。**Alınan parçalar arasında, gerçek ilişkili oran ne kadar? Düşük hassasiyet = hızlı iç gürültü.
- **Context recall。**Çıkarılmış set tüm ihtiyaçları içeren mi? Düşük hatırlama = okuyucu başarısızdır。

Referanssız puanlama 让你可以在没有策定的黄金答案的情况下评估现场生产流量──对准匹配的指标──无用的开放式问题,上面叠加了LLM-as-judge──

`pip install ragas`△ Get Your Retriever + Reader── Her sorgu △ Get Four Scales── Retresiyonlara karşı Alarm göndermek──

## Kullan

2026 yılına kadar.

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

Ekstraktif QA 2026 yılında artık popüler değil, çünkü LLM ile birlikte RAG daha fazla durumla ilgilenebilir.

## - Söyle.

保存为 `outputs/skill-qa-architect.md`- ...

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

## 练习

1. **Easy。**Yukarıdaki 10 Wikipedia pasajı 上 SQuAD çıkarım borusunu ayarlamak。手工制作 10 soru。 cevapları ölçmek 正确的频率。 Eğer pasajlar 和 soru 干净 ise, 7-9 个正确──
2. **Medium。**添加一个拒绝分类器──当最高回取分 低于值(比如0.3 cosine)时,返回"Bilmiyorum",而不是调用读者──在持久的设置上调整门──
3. **Hard。**Seçtiğiniz 10.000 belge korpusunda RAG borusunu inşa etmek için, hibrid geri alımı gerçekleştirmek için BM25 + yoğun) ve RRF füzyonu için, ders 14)

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
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) referans 论文。
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906)DPR,QA'nın kanonik yoğun geri alıcısı
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名 RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997)  全面的RAG anketı
