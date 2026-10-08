# Konu Modelleme  LDA ve BERTopic

> LDA:dokumentler:topics of topics,topics are words 上的分布──BERTopic:documents in embedding space 中聚类,clusters 就是topics──目标相同,分解方式不同──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## Sorun

10,000 adet müşteri destek bileti var, 50.000 haber makalesi var, 200.000 adet tweet var. Bunları okumadığınızda bile bilmeniz gerekir.

Konu modeli, denetimsizce bu soruya cevap verir. Bir korpus verir, bir grup konular alır ve her belgeye bir konunun dağılmasını sağlar.

两类算法家族占主导──LDA (2003) Her belgeyi 混合 olarak gör, her konuyu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

BERTopic (2020) bir konu sözcüklerini oluşturmak için bir sınıf tabanlı TF-IDF'yi kullanıyor.

Bu ders, ikisinin de içten bir anlayış oluşturması ve hangisini seçmesi gerektiğini açıklamasıdır.

## Anlaşım

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**Her konu sözcükler üst dağılımdır. Her belge sözcüklerin karışımıdır. Belge içinde bir kelime oluşturulmalıdır, önce belgeyi bir karışımdan örneklemek, sonra bu konu dağılımından bir kelime almak.

关键 LDA çıkışı:

- `doc_topic`: matris`(n_docs, n_topics)`,每行和为 1(dokümanın konu karışımı)
- `topic_word`: matris`(n_topics, vocab_size)`,每行和为 1 ((topik kelimelerinin dağılımı)

**BERTopic pipeline。**

1. Uzd cümle dönüştürücü`all-MiniLM-L6-v2`) kod her belge için ⋅ 384 boyutlu vektörler
2. UMP 降维到大约5维──BERT gömülmeleri için clustering için dimensio çok yüksek──
3. HDBSCAN 聚类── yoğunluk tabanlı, değişen küçük kümeler ve bir "outlier" etiket oluşturur──
4. Bu kümelerin her birinde, bu kümenin belgelerinde sınıf tabanlı TF-IDF hesaplanarak, en önemli kelimeleri alın.

输出是每个文档一个主题(外加 -1外lier label) 也可以通过 HDBSCAN 概率向量 获得软会员


```figure
topic-drift
```

## Yapın

### Adım 1: Sikit-Learn yoluyla LDA'yı gerçekleştirmek

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import numpy as np


def fit_lda(documents, n_topics=5, max_features=1000):
    cv = CountVectorizer(
        max_features=max_features,
        stop_words="english",
        min_df=2,
        max_df=0.9,
    )
    X = cv.fit_transform(documents)
    lda = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        max_iter=50,
        learning_method="online",
    )
    doc_topic = lda.fit_transform(X)
    feature_names = cv.get_feature_names_out()
    return lda, cv, doc_topic, feature_names


def print_top_words(lda, feature_names, n_top=10):
    for idx, topic in enumerate(lda.components_):
        top_idx = np.argsort(-topic)[:n_top]
        words = [feature_names[i] for i in top_idx]
        print(f"topic {idx}: {' '.join(words)}")
```

Dikkat: Stopwords,min_df 和 max_df 过罕见和无处不在的术语移除, CountVectorizer kullanın, TfidfVectorizer değil) çünkü LDA 期望原数。

### Adım 2: BERTopic (produz)

```python
from bertopic import BERTopic

topic_model = BERTopic(
    embedding_model="sentence-transformers/all-MiniLM-L6-v2",
    min_topic_size=15,
    verbose=True,
)

topics, probs = topic_model.fit_transform(documents)
info = topic_model.get_topic_info()
print(info.head(20))
valid_topics = info[info["Topic"] != -1]["Topic"].tolist()
for topic_id in valid_topics[:5]:
    print(f"topic {topic_id}: {topic_model.get_topic(topic_id)[:10]}")
```

`Topic != -1`Üst Üçümüşler BERTopic'in dışarısı sepeti`min_topic_size` kontrol HDBSCAN'ın en küçük küme boyutu; BERTopic'in kütüphanesi 默认值 10 ⋅ bu örnekte ders boyutu açıkça 15 ⋅ olarak belirlenir.

### Adım 3: Değerlendirme

两种方法都会输出话题词──问题是这些词 是否连贯──

- **Topic coherence (c_v)。**Çekilme penceresi bağlamlarında 上组合 top-word çiftlerinin NPMI(normalize pointwise karşılıklı bilgi),把分数聚合成 topic vectors,并通过 cosine benzerliği比较这些向量──越高越好──使用 `gensim.models.CoherenceModel`Ve ayarlama`coherence="c_v"`- Evet.
- **Topic diversity。**Tüm konuların en üst kelimeleri İçin eşsiz kelimeler ∞
- **Qualitative inspection。**Her konuyu okuyun. Gerçeklerin adını mı verdiler? İnsan yargıları hâlâ son savunma yolu.

## Hangisini seçmek için ne zaman

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

En büyük gerçek değer belge uzunluğudır.BERT yerleşimleri 会截断;LDA sayıları herhangi bir uzunluğu işleyebilir.

## Kullan

2026 yığın:

- **BERTopic。**短文本和任何语义 重要场景的默认选择──
- **`gensim.models.LdaModel`。**Klasik LDA, üretime, olgunlaşmış ve gerçek savaş denetimi geçmiştir.
- **`sklearn.decomposition.LatentDirichletAllocation`。**Deneyim için basit bir LDA kullanın.
- **NMF。**LDA'nın hızlı alternatif programı, kısa metinde kalıcılık oranına denktir.
- **Top2Vec。**BERTopic'e benzer tasarımlar, daha küçük bir toplum, ancak bazı referans noktalarında da performantlık yanlışı göstermektedir.
- **FASTopic。**Yenilecek, Ünlü Korporasyonlar Üstü BERTopic Daha Hızlı
- **LLM-based labeling。**运行任意 clustering, sonra istemek için bir model için her cluster 命名──

## Gönder

保存为 `outputs/skill-topic-picker.md`- ...

```markdown
---
name: topic-picker
description: Pick LDA or BERTopic for a corpus. Specify library, knobs, evaluation.
version: 1.0.0
phase: 5
lesson: 15
tags: [nlp, topic-modeling]
---

Given a corpus description (document count, avg length, domain, language, compute budget), output:

1. Algorithm. LDA / NMF / BERTopic / Top2Vec / FASTopic. One-sentence reason.
2. Configuration. Number of topics: `recommended = max(5, round(sqrt(n_docs)))`, clamped to 200 for corpora under 40,000 docs; permit >200 only when the corpus is genuinely large (>40k) and note the increased compute cost. `min_df` / `max_df` filters and embedding model for neural approaches also belong here.
3. Evaluation. Topic coherence (c_v) via `gensim.models.CoherenceModel`, topic diversity, and a 20-sample human read.
4. Failure mode to probe. For LDA, "junk topics" absorbing stopwords and frequent terms. For BERTopic, the -1 outlier cluster swallowing ambiguous documents.

Refuse BERTopic on documents longer than the embedding model's context window without a chunking strategy. Refuse LDA on very short text (tweets, reviews under 10 tokens) as coherence collapses. Flag any n_topics choice below 5 as likely wrong; flag >200 on corpora under 40k docs as likely over-splitting.
```

## Egzersizler

1. **Easy.**20 Haber Grubunun Veriler Sunucuları Üstüne 5 Konuyu Kullanmak LDA Uygunlukları İçin Top 10 kelimeyi Yazmak Her Konuyu Yazmak
2. **Medium.**Aynı 20 Haber Grubunun alt kümesi üzerinde uygulanacak BERTopic.
3. **Hard.**Ürün sayısına göre tutarlılık çizmek. Ürün sayısına göre tutarlılık çizmek. Ürün sayısına göre hangi yöntemleri rapor etmek.

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## Daha Fazla Okumak

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文。
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTopic 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入 c_v 等指标的论文──
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考──例非常好──
