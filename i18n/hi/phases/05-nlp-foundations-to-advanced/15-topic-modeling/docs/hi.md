# विषय मॉडलिंग  एलडीए और बीईआरटॉपिक

> LDA:documents are topics of mix, topics are words 上的分布──BERTopic:documents in embedding space 中聚类, clusters 就是 topics── लक्ष्य एक ही,分解方式 अलग──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## समस्या

आपके पास 10,000 ग्राहक सहायता टिकट हैं, 50,000 समाचार लेख हैं, या 200,000 ट्वीट हैं। आपको यह जानने की आवश्यकता है कि यह संग्रह क्या है, जब आप उन्हें नहीं पढ़ते हैं।

विषय मॉडलिंग में बिना पर्यवेक्षण के इस प्रश्न का उत्तर देना  इसे एक कॉर्पस देना, एक समूह से जुड़े विषय प्राप्त करना, और प्रत्येक दस्तावेज़ के लिए  एक विषय प्राप्त करना  ऊपर का वितरण करना 

两类算法家族占主导──LDA (2003) प्रत्येक दस्तावेज़ को लटके हुए विषयों के मिश्रण के रूप में देखें, प्रत्येक विषय को शब्दों के रूप में देखें 上的分布── इन्फेरेंस है बेयिसियन── यह अभी भी मिश्रित सदस्यता विषय असाइनमेंट्स और व्याख्या करने योग्य शब्द-स्तर की संभावना वितरण के उत्पादन वातावरण का उपयोग करता है──

BERTopic (2020) ने BERT 编码文件, UMAP 降维, HDBSCAN 聚类,并通过类型 आधारित TF-IDF 提取话题词――它在短文本、社交媒体,以及任何语义相似性比词重更重要场景中胜出―― एक दस्तावेज़ 得到一个话题,这对长形式内容是限制――

इस वर्ग में दोनों के लिए एक-दूसरे के बारे में जानकारी और जानकारी दी गई है।

## अवधारणा

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**प्रत्येक विषय शब्द है उपर्युक्त वितरण। प्रत्येक दस्तावेज़ विषयों का मिश्रण है। दस्तावेज में एक शब्द उत्पन्न करना चाहिए, पहले दस्तावेज़ के मिश्रण से एक विषय का नमूना लेना चाहिए, फिर उस विषय के वितरण से एक शब्द का नमूना लेना चाहिए।

关键 LDA आउटपुट:

- `doc_topic`:मैट्रिक्स `(n_docs, n_topics)`, प्रति行和为 1(लेख के विषय मिश्रण)
- `topic_word`:मैट्रिक्स `(n_topics, vocab_size)`,每行和为 1(विषय का शब्द वितरण)

**BERTopic pipeline。**

1. उपयोग वाक्य परिवर्तक (उदाहरण के लिए)`all-MiniLM-L6-v2`) प्रत्येक दस्तावेज़ को कोड करना―384-आयामी वेक्टरों―
2. यूएमएपी 降维到大约 5 维──BERT एम्बेडिंग्स के लिए क्लस्टरिंग 维度太高──
3. HDBSCAN 聚类── घनत्व के आधार पर, उत्पन्न可变大小集群和一个"outlier" लेबल──
4. प्रत्येक क्लस्टर के लिए, उस क्लस्टर के दस्तावेजों में श्रेणी आधारित TF-IDF का गणना करें, शीर्ष शब्दों को उठाएं।

输出是每文 一个主题 (外加 -1 आउटlier label) 也可以通过 HDBSCAN 的概率向量 获得软会员


```figure
topic-drift
```

## इसे बनाओ

### चरण 1: स्किट-लर्निंग एलडीए को प्राप्त करने के माध्यम से

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

ध्यान देंः हटाने के लिए स्टॉपवर्ड, min_df 和 max_df 过罕见和无处不在的术语, CountVectorizer का उपयोग करें, TfidfVectorizer नहीं), क्योंकि LDA 期望原数。

### चरण 2: BERTopic (उत्पादन)

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

`Topic != -1`ऊपर के ओवर会丢弃 BERTopic का बहिष्कृत बाल्टिन(HDBSCAN 无法聚类文件)`min_topic_size` नियंत्रण HDBSCAN के न्यूनतम क्लस्टर आकार;BERTopic के पुस्तकालय 默认值 10 ⋅ इस उदाहरण के लिए इस वर्ग के आकार स्पष्ट रूप से 15 ⋅ के लिए निर्धारित किया गया है 10,000 से अधिक दस्तावेजों के निकायों, 50 या 100 ⋅ तक वृद्धि हुई है।

### चरण 3: मूल्यांकन

两种方法都会输出话题词──问题是这些词 是否连贯──

- **Topic coherence (c_v)。**                                                                                                                                                                                                                                                              `gensim.models.CoherenceModel`और सेट `coherence="c_v"`
- **Topic diversity。**सभी विषयों के शीर्ष शब्दों में अद्वितीय शब्दों का अनुपात──越高越好 विषयों 不重叠)──
- **Qualitative inspection。**阅读每一个话题的顶尖词――它们是否命名真实事物?

## कौन सी चुनना है

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

सबसे बड़ा वास्तविक भार दस्तावेज़ की लंबाई है।BERT एम्बेडिंग्स 会截断;LDA गणनाएँ किसी भी लंबाई को संभाल सकती हैं।

## इसका प्रयोग करें

2026 स्टैकः

- **BERTopic。**短文本和任何语义 重要场景的默认选择──
- **`gensim.models.LdaModel`。**经典 LDA, उत्पादन के लिए, परिपक्व और वास्तविक युद्ध परीक्षण से गुजरना
- **`sklearn.decomposition.LatentDirichletAllocation`。**प्रयोग के सरल एलडीए में प्रयोग किया गया।
- **NMF。**गैर-नकारात्मक मैट्रिक्स फैक्टरिज़ेशन──LDA का त्वरित प्रतिस्थापन, в短文本上质量相当──
- **Top2Vec。**BERTopic 类似设计──社区更小, लेकिन कुछ बेंचमार्क में ऊपर प्रदर्शन गलत
- **FASTopic。**更新,在超大 corpora上比BERTopic更快──
- **LLM-based labeling。**运行任意集群, फिर प्रत्येक समूह के लिए एक मॉडल का नामकरण करें

## इसे भेजें

保存为 `outputs/skill-topic-picker.md`:

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

## व्यायाम

1. **Easy.**20 न्यूजग्रुप डेटासेट में 5 विषयों का उपयोग किया गया है 拟合 LDA──印印每题的前十字──手动标注每题──算法找到了真实类别?
2. **Medium.**एक ही 20 न्यूजग्रुप उपसमूह में ऊपर तैयार BERTopic── मिलेगा के विषय संख्या, शीर्ष शब्द और गुणात्मक सुसंगतता के साथ LDA तुलना── कौन सा स्पष्टतरती浮现真实类别?
3. **Hard.**अपने शरीर में ऊपर के लिए LDA और BERTopic सभी गणना c_v सुसंगतता──分別用5、10、20、50 话题运行──绘制 सुसंगतता बनाम विषय गिनती──报告哪种方法在不同话题 गिनती 下更稳定──

## प्रमुख शर्तें

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## आगे पढ़ना

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文──
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTopic 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入 c_v 等指标的论文──
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考── उदाहरण बहुत अच्छा──
