# Metin Özetleri

> Ekstraktif 系统告诉你文档说了什么――Abstraktatif 系统告诉你作者想表达什么――任务不同,陷也不同――

**类型：**Yapım
**语言：**Python
**先修：**5 · 02 aşaması (BoW + TF-IDF), 5 · 11 aşaması (Makine çevirisi)
**时间：**~ 75 dakika

## 问题

Bir 2000 kelimelik haber makalesi eklentiinize girmek için 120 kelime kullanmalısınız. Makale içinden üç önemli cümleyi seçmek için bir kısım seçin.

Ekstraktif özetleme bir sıralama sorunu.`k`个──输出总是语法正确的,因为它是从原文中提取的.

Abstraktif özetleme bir üretim sorunudır. Bir dönüştürücü, yeni metin üretir.

Bu ders, iki yönü oluşturur ve kendi başarısızlık modunu gösterir.

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**Sözcükler bir grafik olarak görülebilir. Bunlardan düğümler cümle, kenarlar benzerliktir.**TextRank**(Mihalcea ve Tarau, 2004)。

**Abstractive。**Bu nedenle, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir dizi metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, bir metin, metin, bir metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, metin, met

Kullanım**ROUGE**(Hatırlama odaklı inceleme Gisting Değerlendirme için) 评估──ROUGE-1 和 ROUGE-2 衡量 unigram 和 bigram üst üste taşınması──ROUGE-L 衡量最长的常见次序──越高越好,但40 ROUGE-L 算好,50 算例外──每篇论文都会报告这三项──使用 `rouge-score`Paket


```figure
summarize-collapse
```

## Yapım

### 步骤 1: TextRank(ekstraktör)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

İki şey var. Önemli olan nokta adı. Eşlik işlevi. Log-normalize word overlap kullanmak.

### 步骤 2: BART kullanın

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-large-CNN, CNN/DailyMail korpusunda ince ayarlanmıştır.

### 步骤 3: ROUGE değerlendirme

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则, "running" 和 "run" 会被算作不同词,ROUGE 会低估──

### ROUGE 之外(2026 özetleme değerlendirme)

2026 yılında tek başına kullanılmaya başlandı. NLG makaleleri için yapılan büyük çaplı meta-analisis göstermektedir:

- **BERTScore**(konekstel yerleştirme benzerliği) 2023 yıl öncesinde ve sonrasında devamlı kabul alındı, şimdi çoğu özet makalesi 会与 ROUGE 一起報告──
- **BARTScore**视为世代:Bertekimli BART'a göre, belirli bir kaynakta özetleme yapma olasılığı ⇒打分──
- **MoverScore**(konekssel yerleşimler 上的地球移动的距离) 2025'te toplam referans değerleri arasında birinciye ulaştı, çünkü kırmızıdan daha iyi anlamlı bir üst üste geçiş algıladı.
- **FactCC**和 **QA-based faithfulness**2021-2023 yılları çok sık görüldüğü gibi, şimdi sık sık görüldüğü gibi.**G-Eval**替代(1 GPT-4 sorgu zinciri, tutarlılık, tutarlılık, akıcılık, bağlamlılık 打分) 〜
- **G-Eval**Üstelik, bu yöntemin bir kısmı da insan yargılamalarına benzer.

Üretim önerisi: rapor ROUGE-L, miraslı karşılaştırma, BERTScore, semantik üst üstelik, G-Eval, tutarlılık ve gerçeklik için.

### 步骤 4: gerçeklik 问题

Abstraktif özetler kolayca halüsinasyonlara yol açar. Çıkıştırıcı özetlerin halüsinasyonları çok daha düşüktür, çünkü çıkış, kaynaklı metinlerden ayrılığı olarak alınır. Eğer kaynaklı metinler aşağı kültürde geçerse, zaman geçse veya bir dizi hatalı bir şekilde alınsa, bunlar hala yanlış yönlendirilebilir. Bu, uyumlulık ve çevre içeriklerindeki üretim sistemlerinin hala tercih edilen ekstraktif yöntemlerin en önemli nedenidir.

需要点名的幻觉 类型:

- **Entity swap。**Kaynak "John Smith" yazıyor.
- **Number drift。**Kaynak "25 bin" yazıyor.
- **Polarity flip。**Kaynak 写成 "sırayı reddetti".
- **Fact invention。**Kaynak CEO'dan bahsetmedi. Özetle CEO'nun onayladığı söyleniyor.

Etkili değerlendirme yaklaşımları:

- **FactCC。**Bir ikili sınıflandırıcı, training goal is the implication between source sentence and summary sentence ──预测 factual/non-factual──
- **QA-based factuality。**让QA model 提出答案在源中问题──如果总结 支持不同答案,则标记──
- **Entity-level F1。**Kaynakla özet içindeki isimlendirilmiş kuruluşları karşılaştırın.

对于任何面向用户和事实性 重要内容( haberler, tıbbi, yasal, finansal), ciltlenme daha güvenli bir tercihlerdir。 ciltlenme 需要加入在流程中事实性检查──

## kullanımı

2026 yığın:

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

Hesaplama zamanında, uzun bağlamlı LLM'ler 2026 yılında genellikle uzmanlaşmış modellerden üstün gelir.

## Yayınlama

保存为 `outputs/skill-summary-picker.md`- ...

```markdown
---
name: summary-picker
description: 选择 extractive 或 abstractive、指定 library、factuality check。
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

给定一个任务（document type、compliance requirement、length、compute budget），输出：

1. Approach。Extractive 或 abstractive。用一句话解释原因。
2. Starting model / library。写出名称。`sumy.TextRankSummarizer`、`facebook/bart-large-cnn`、`google/pegasus-pubmed`，或一个 LLM prompt。
3. Evaluation plan。ROUGE-1、ROUGE-2、ROUGE-L（使用带 stemming 的 rouge-score）。如果是 abstractive，再加 factuality check。
4. 一个需要探查的 failure mode。Entity swap 是 abstractive news summarization 中最常见的问题；标记 source entities 未出现在 summary 中的 samples。

如果没有 factuality gate，则拒绝对 medical、legal、financial 或 regulated content 使用 abstractive summarization。将超过 model context window 的输入标记为需要 chunked map-reduce summarization（而不是简单 truncation）。
```

## 练习

1. **Easy。**5 篇新闻文章上运行 TextRank──将 top-3 句子与参考摘要比较──测量 ROUGE-L──你应该能在CNN/DailyMail tarzındaki makalelerde 上看 30-45 ROUGE-L──
2. **Medium。**实现实体级事实性:从源和总结 中抽取命名实体(spaCy),计算源实体 在总结中的召回,以及总结实体 相对源的精度──高精度──低召回 表示安全但简略;低精度 表示幻觉实体──
3. **Hard。**Bu nedenle, bu durumun birincil olarak, bir şirketin başarısı için yapılan bir rapora göre, bu rapora göre, bu rapora göre, bu rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bu rapora göre, bu rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bu rapora göre, bu rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bu rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin başarısı için yapılan bir rapora göre, bir şirketin rapora göre, bir şirketin rapora göre, bir şirketin için yapılan bir rapora göre, bir rapora göre, bir şirketin için yapılan bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora göre, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora, bir rapora,

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Extractive | 选句子 | 从 source 中逐字返回句子。永不 hallucinate。 |
| Abstractive | 重写 | 在 source 条件下生成新文本。可能 hallucinate。 |
| ROUGE | Summary metric | system output 与 reference 之间的 N-gram / LCS overlap。 |
| TextRank | Graph-based extractive | sentence similarity graph 上的 PageRank。 |
| Factuality | 是否正确 | summary claims 是否由 source 支持。 |
| Hallucination | 编造内容 | summary 中 source 不支持的内容。 |

## 延伸阅读

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) ekstraktif 经典论文。
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461)BART 论文。
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777)Pegasus 和 boş cümle amacı
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/)Kırmızı kağıt.
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) gerçeklik manzara kağıdı。
