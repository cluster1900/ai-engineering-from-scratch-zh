# موضوع النموذج  LDA و BERTopic

> LDA:وثائق هي مزيج من المواضيع، والمواضيع هي الكلمات 上的分布──BERمواضيع:وثائق في الفضاء المضمن 中聚类,集群就是 المواضيع── هدف واحد, طريقة مختلفة للتفصيل──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word2Vec)
**Time:** ~45 分钟

## المشكلة

لديك 10 آلاف مقالة من تذاكر دعم العملاء 50 آلاف مقالة أخبار أو 200 ألف تغريدة تحتاج إلى معرفة هذا المجموعة في الحديث دون قراءتها

نمذجة الموضوعات في حالة عدم الرقابة الإجابة على هذه المسألة. أعطها مجموعة واحدة، الحصول على مجموعة من المواضيع المتصلة، والحصول على توزيع واحد على كل مستند.

两类算法家族占主导──LDA (2003) وضع كل مستند 视为隐藏的主题的混合,把每个主题 视为词上的分布──推理是贝耶斯式──它仍然用于需要混合成员的主题 assignments 和可解释词级概率分布的生产环境──

برتوبيك (2020) باستخدام برت 编码文件, باستخدام UMAP 降维, باستخدام HDBSCAN 聚类,并通过类基 TF-IDF 提取主题词──它在短文本、社交媒体,以及任何语义相似性比词重更重要场景中胜出── مستند 得到一个主题,这对长形式内容是限制──

هذا الدروس سوف يُساعد على بناء الحس البسيط، ويشرح على الجهاز المحدد عندما يجب أن تختار أي واحد.

## المفهوم

![LDA mixture model vs BERTopic clustering](../assets/topic-modeling.svg)

**LDA generative story。**كل موضوع هو كلمات 上的分布── كل مستند هو مزيج من الموضوعات── يجب أن تولد كلمة واحدة في الوثيقة، أولاً من مختلطة المستندات من اختبار موضوع، ثم من هذا الموضوع من توزيع الموضوعات من اختبار كلمة واحدة── استنتاج عكس المقالة: إعطاء الكلمات التي تم تشخيصها، اقتراح توزيع الموضوعات في كل مستند، فضلاً عن توزيع الكلمات في كل موضوع── اختراق عينات غيبز أو البايز المتغير 完成数学部分──

关键 LDA خروج:

- `doc_topic`: المصفوفة `(n_docs, n_topics)`,每行和为 1 ((مزيج الموضوعات في الوثيقة)
- `topic_word`: المصفوفة `(n_topics, vocab_size)`,每行和为 1 ((توزيع الكلمات للموضوع)

**BERTopic pipeline。**

1. 用 محول الجملة `all-MiniLM-L6-v2`)编码 كل وثيقة 384 طول المتجهات 
2. استخدام UMAP 降维到大约 5 维──BERT إدمجات على التجميع لتكون الدرجة عالية جدا.
3. استخدام HDBSCAN 聚类── على أساس الدرجة الكثافة، وتوليد مجموعات كبيرة يمكن تغييرها ومع علامة "خارجية"‬
4. لكل مجموعة، في وثائق هذه المجموعة، قم بحساب TF-IDF القائم على الفئة، وتحديد الكلمات العليا.

输出是每一文档 一个主题(外加 -1 标签外lier) 也可以通过 HDBSCAN 获得软会员


```figure
topic-drift
```

## بناءها

### الخطوة الأولى: 通过 scikit-learn 实现 LDA

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

ملاحظة: إزالة الكلمات المتوقفة,min_df 和 max_df 过罕见和无处不在的术语,使用 CountVectorizer(不是 TfidfVectorizer),因为 LDA 期望原数。

### الخطوة الثانية: BERTopic

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

`Topic != -1`أعلى الع会丢弃 BERTopic's outlier bucket ((HDBSCAN 无法集集类文件) 👇`min_topic_size`控制 HDBSCAN الحد الأدنى من حجم الكلاستر ؛ المكتبة الاختيارية لبرتوبيك هي 10♦ هذا المثال لدرجة الكلاسيكية وضوحاً يعد 15♦ بالنسبة لأكثر من 10،000 文件的 corpora,增加到50 أو 100♦

### الخطوة الثالثة: التقييم

两种方法都会输出话题单词──问题是这些单词 是否连贯──

- **Topic coherence (c_v)。**في سياقات النافذة المنزلقة 上组合 أعلى كلمات أزواج NPMI ((تطبيعية معلومات متبادلة من الناحية النقطية) ،把分数聚合成 الموضوع المتجهات،并通过 cosine شبيهة比较这些 المتجهات──越高越好──使用 `gensim.models.CoherenceModel`ووضع`coherence="c_v"`.
- **Topic diversity。**جميع المواضيع العليا من الكلمات 中 الفريدة من نوعها الكلمات 比例──越高越好(المواضيع 不重叠)──
- **Qualitative inspection。**阅读每个话题的顶尖词――它们是否命名真实事物?

## متى لا تختار أي

| Situation | Pick |
|-----------|------|
| 短文本（tweets、reviews、headlines） | BERTopic |
| 带 topic mixtures 的长 documents | LDA |
| 无 GPU / compute 受限 | LDA 或 NMF |
| 需要 document-level multi-topic distributions | LDA |
| 用于 topic labeling 的 LLM integration | BERTopic（直接支持） |
| 资源受限的 edge deployment | LDA |
| 最大 semantic coherence | BERTopic |

أكبر تكلفة فعلية هي طول الوثيقة.

## استخدمها

2026 كومة:

- **BERTopic。**短文本和任何语义 重要场景的默认选择──
- **`gensim.models.LdaModel`。**经典 LDA, لإنتاج, بالغة ومتجاوزة عملية الاختبار
- **`sklearn.decomposition.LatentDirichletAllocation`。**تستخدم تجربة بسيطة LDA
- **NMF。**تغيرات المصفوفات غير السلبية.
- **Top2Vec。**مع BERTopic  مشابهة للتصميم. المجتمع أصغر، ولكن في بعض المعايير العليا
- **FASTopic。**أحدث، في أعلى أعمال كبيرة
- **LLM-based labeling。**运行任意 clustering, ثم طلب واحد نموذج لكل مجموعة 命名──

## أرسله

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

## التمارين

1. **Easy.**في 20 مجموعة بيانات الأخبار 上 باستخدام 5 مواضيع 拟合 LDA── طباعة أفضل 10 كلمات لكل موضوع──手动标注每个话题──算法找到了真实类别吗?
2. **Medium.**في نفس مجموعة الفرعية 20 مجموعة الأخبار 上拟合BERTopic── سوف تجد مواضيع عدد الكلمات العليا 和 التماسك النوعي مع LDA比较── أي نوع أكثر وضوحاً في الفئة الحقيقية؟
3. **Hard.**في جسمك 上为 LDA 和 BERTopic 都计算c_v منسجمة.

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Topic | corpus 在讲的一件事 | words 上的 probability distribution（LDA），或相似 documents 的 cluster（BERTopic）。 |
| Mixed membership | Doc 是多个 topics | LDA 为每个 document 分配一个覆盖所有 topics 的分布。 |
| UMAP | Dimensionality reduction | 保留局部结构的 manifold learning；用于 BERTopic。 |
| HDBSCAN | Density clustering | 查找可变大小 clusters；为 outliers 产生 "noise" label (-1)。 |
| c_v coherence | Topic quality metric | sliding windows 内 top topic words 的平均 pointwise mutual information。 |

## المزيد من القراءة

- [Blei, Ng, Jordan (2003). Latent Dirichlet Allocation](https://www.jmlr.org/papers/volume3/blei03a/blei03a.pdf) LDA 论文。
- [Grootendorst (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure](https://arxiv.org/abs/2203.05794) BERTopic 论文──
- [Röder, Both, Hinneburg (2015). Exploring the Space of Topic Coherence Measures](https://svn.aksw.org/papers/2015/WSDM_Topic_Evaluation/public.pdf) 引入 c_v 等指标的论文──
- [BERTopic documentation](https://maartengr.github.io/BERTopic/) 生产参考── مثال جيد جدا ً
