# Chủ đề mô hình hóa  LDA và BERTopic

> LDA:document is topics of mix,topics are words 上的分布──BERThomic:document 在嵌入空间 中聚类,集群就是 topics──目标相同,分解方式不同──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## Vấn đề

Bạn có 10.000 bài vé hỗ trợ khách hàng 50.000 bài báo tin tức, hoặc 200.000 bài tweet. Bạn cần biết bộ sưu tập này đang nói gì. Bạn không có danh mục phân loại. Bạn thậm chí không biết có bao nhiêu danh mục tồn tại.

Mô hình hóa chủ đề trong không có giám sát trả lời câu hỏi này.

两类算法家族占主导──LDA (2003) Đặt mỗi tài liệu 视为隐藏话题的混合,把每个话题 视为词上的分布──Inference là Bayesian──它 vẫn được sử dụng để yêu cầu phân bổ các chủ đề thành viên hỗn hợp 和解释 các phân bố xác suất ở trình độ từ ngữ──

BERTopic (2020) sử dụng tài liệu lập trình BERT, sử dụng UMAP 降维, sử dụng HDBSCAN 聚类,并通过 lớp dựa trên TF-IDF 提取 chủ đề từ. Nó trong ngắn văn văn, phương tiện truyền thông xã hội, cũng như bất kỳ sự tương đồng ngữ nghĩa nào so với sự chồng chéo từ.

Bài học này sẽ giúp hai người xây dựng trực giác, và giải thích cho các cơ quan nhất định khi chọn một trong hai.

## Khái niệm

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**Mỗi chủ đề là từ trên phân bố. Mỗi tài liệu là sự pha trộn của các chủ đề. Phải tạo ra một từ trong tài liệu, trước tiên từ sự pha trộn của tài liệu, sau đó từ sự phân bố của chủ đề đó.

关键 LDA đầu ra:

- `doc_topic`: matrix `(n_docs, n_topics)`,每行和为 1 ((xích hợp các chủ đề của tài liệu)
- `topic_word`: matrix `(n_topics, vocab_size)`,每行和为 1 ((như phân bố từ về chủ đề) 👇

**BERTopic pipeline。**

1. 用 chuyển đổi câu `all-MiniLM-L6-v2`)编码 mỗi tài liệu. 384 chiều vector.
2. Sử dụng UMAP 降维到约5维──BERT Embeddings đối với cluster để dimension quá cao──
3. Sử dụng HDBSCAN 聚类── dựa trên mật độ, tạo ra các cụm có thể thay đổi và một nhãn "outlier"──
4. Đối với mỗi cluster, trong các tài liệu của cluster này, lên tính toán TF-IDF dựa trên lớp,提取 top words──

输出是每个文件一个主题 (外加 -1 outlier label) 也可以通过 HDBSCAN 变软会员


```figure
topic-drift
```

## Hãy xây dựng nó

### Bước 1: Thông qua việc học tập nhỏ

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

Lưu ý: Di chuyển từ dừng,min_df 和 max_df 过罕见和无处不在的术语, sử dụng CountVectorizer(không phải TfidfVectorizer), vì LDA 期望原数。

### Bước 2: BERTopic (đầu sản xuất)

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

`Topic != -1` 上的过会丢弃BERTopic 的外观桶(HDBSCAN 无法聚类文件)`min_topic_size`控制 HDBSCAN cluster size tối thiểu; 默认值 của thư viện BERTopic là 10。 ví dụ: quy mô của bài học này được đặt ra là 15。 đối với hơn 10.000 tài liệu của corpora, tăng lên 50 hoặc 100。

### Bước 3: đánh giá

两种方法都会输出话题词――问题是这些词 是否连贯――

- **Topic coherence (c_v)。**Trong bối cảnh cửa sổ trượt 上组合 top-word pairs 的 NPMI(tự chuẩn hóa thông tin lẫn nhau theo hướng điểm),把分数聚合成 đối tượng vector,并通过 cosine tương đồng比较这些 vector──越高越好──使用 `gensim.models.CoherenceModel`Và đặt `coherence="c_v"`
- **Topic diversity。**所有 chủ đề từ đầu 中独特词的比例──越高越好(thể loại không chồng lên)──
- **Qualitative inspection。**阅读 từng từ trên mỗi chủ đề. Chúng có đặt tên cho sự thật không?

## Khi nào để chọn

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

Các tính toán LDA có thể xử lý bất kỳ độ dài nào. Đối với các tài liệu có hơn so với bối cảnh mô hình, hoặc là phần lớn + tổng hợp, hoặc sử dụng LDA.

## Sử dụng nó

2026:

- **BERTopic。**短文本和任何语义 重要场景的默认选择──
- **`gensim.models.LdaModel`。**经典 LDA, được sử dụng để sản xuất, trưởng thành và trải qua thực sự kiểm tra.
- **`sklearn.decomposition.LatentDirichletAllocation`。**Sử dụng để thực hiện các thí nghiệm đơn giản LDA.
- **NMF。**Không tiêu cực tử liệu phân nhân hóa. LDA của nhanh thay đổi方案, trong ngắn văn bản trên chất lượng tương đương.
- **Top2Vec。**Với BERTopic  tương tự như thiết kế.
- **FASTopic。**更新,在超大 corpora 上比BERTopic 更快──
- **LLM-based labeling。**运行任意 clustering, sau đó yêu cầu một mô hình cho mỗi cluster 命名。

## Chuyển nó

保存为 `outputs/skill-topic-picker.md`- Có thể là:

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

## Các bài tập

1. **Easy.**Trong 20 Newsgroups tập dữ liệu 上 sử dụng 5 chủ đề 拟合 LDA──打印每个主题的十大单词──手动标注每个主题──算法找到了真实类别?
2. **Medium.**Trong cùng 20 Newsgroups phụ tập hợp 上拟合BERTopic── sẽ tìm thấy các chủ đề số lượng, từ đầu và tính chất liên kết với LDA比较──
3. **Hard.**Trong corpus của bạn 上为 LDA 和 BERTopic 都计算 c_v coherence──分别用 5、10、20、50 话题运行──绘制 coherence vs. topic count──报告哪种方法在不同主题 counts 下更稳定──

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## Đọc thêm

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文。
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTopic 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入 c_v 等指标的论文──
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考―― ví dụ rất tốt――
