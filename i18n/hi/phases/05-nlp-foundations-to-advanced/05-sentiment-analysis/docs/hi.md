# भावनाओं का विश्लेषण

> 经典的NLP 任务―― परंपरागत ग्रंथ वर्गीकरण के बारे में आपको जो कुछ भी जानने की आवश्यकता है, वह सब यहाँ दिखाई देगा――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 问题

"भोजन अच्छा नहीं था. " क्या सही या नकारात्मक?

भावना  सुना है बहुत सरल है ∙ आलोचक कहते हैं कि उन्हें पसंद है या कुछ पसंद नहीं है ∙ यह एक क्लासिक एनएलपी  कार्य बन गया है, क्योंकि प्रत्येक सरल प्रतीत होने वाले मामले के पीछे सभी कठिन बिंदु हैं ∙  नकार会翻转含义── 刺会反转含义── "कुछ भी बुरा नहीं" ∙  नकारात्मक कोडित शब्द होने के बावजूद, यह सही है ∙ इमोजी  संकेतक हो सकते हैं `tight`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `tight`含义不同) 

भावनाएं पारंपरिक एनएलपी के अभ्यास के प्रयोग के प्रयोग के कमरे हैं। यदि आप समझते हैं कि प्रत्येक साफ़ आधार रेखा में विशिष्ट विफलता मॉडल क्यों हैं, तो आप समझते हैं कि प्रत्येक अधिक समृद्ध मॉडल का आविष्कार क्यों होगा। इस पाठ्यक्रम में शून्य से साफ़ आधार रेखा का निर्माण करने, लॉजिस्टिक प्रतिगमन में शामिल होने और उन चीजों को इंगित करने के लिए जो उत्पादन स्तर की भावनाओं को अनुपालन स्तर की समस्याओं में बदल देती हैं।

## 概念

傳統 भावना एक दो चरण की है।

1. **表示。**इसे एक विशेषता वेक्टर में परिवर्तित करें──BoW、TF-IDF अथवा n-ग्राम──
2. **Classification。**एक रैखिक मॉडल पर लागू किया गया है।

बेयज़ के लिए सबसे अच्छा मॉडल है। यह माना जाता है कि प्रत्येक विशेषता एक दूसरे से स्वतंत्र है।`P(word | positive)`和 `P(word | negative)` विचार करते समय इन संभावनाओं को गुणा करना  यह "नाईव"  स्वतंत्रता परिकल्पना हास्यास्पद है, लेकिन परिणाम आश्चर्यजनक होते हैं  कारण यह है कि: दुर्लभ ग्रंथों में विशेषताओं और मध्यम आकार के डेटा के तहत, वर्गीकरणकर्ता अधिक ध्यान केंद्रित करता है प्रत्येक शब्द की ओर रुख करने के बजाय किस ओर रुख करने की डिग्री है 

लॉजिस्टिक रेग्रेस ने स्वतंत्रता परिकल्पना को संशोधित किया। यह प्रत्येक विशेषता के लिए एक भार सीखता है, जिसमें नकारात्मक भार शामिल है।`not good`作为一个bigram特征会得到负权重――无码贝尔斯 无法对从未标记过的bigrams 做到这一点――


```figure
sentiment-logits
```

##  इसे निर्माण

### 步骤 1: एक वास्तविक迷你 डेटा संग्रह

```python
POSITIVE = [
    "absolutely loved this movie",
    "beautiful cinematography and a great story",
    "one of the best films of the year",
    "brilliant acting from the lead",
    "heartwarming and funny",
]

NEGATIVE = [
    "boring and far too long",
    "not worth your time",
    "the plot made no sense",
    "terrible acting, awful script",
    "i want my two hours back",
]
```

DATA集故意很小──真实工作会使用数万条样本(IMDb、SST-2、Yelp polarity)──数学原理完全相同──

### 步骤 2: बहुपद के शून्य से प्राप्त करने के लिए Naive Bayes

```python
import math
from collections import Counter


def train_nb(docs_by_class, vocab, alpha=1.0):
    class_priors = {}
    class_word_probs = {}
    total_docs = sum(len(d) for d in docs_by_class.values())

    for cls, docs in docs_by_class.items():
        class_priors[cls] = len(docs) / total_docs
        counts = Counter()
        for doc in docs:
            for token in doc:
                counts[token] += 1
        total = sum(counts.values()) + alpha * len(vocab)
        class_word_probs[cls] = {
            w: (counts[w] + alpha) / total for w in vocab
        }
    return class_priors, class_word_probs


def predict_nb(doc, class_priors, class_word_probs):
    scores = {}
    for cls in class_priors:
        s = math.log(class_priors[cls])
        for token in doc:
            if token in class_word_probs[cls]:
                s += math.log(class_word_probs[cls][token])
        scores[cls] = s
    return max(scores, key=scores.get)
```

अतिरिक्त चिकनाई (अल्फा = 1.0) लैप्लेस चिकनाई है। इसके बिना, एक शब्द जो किसी वर्ग में नहीं आया है, उसे शून्य संभावना प्राप्त होती है, लॉग में विस्फोट हो जाता है।`alpha=0.01``alpha=1.0`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### 步骤 3: शून्य से लॉजिस्टिक प्रतिगमन को प्राप्त करना

```python
import numpy as np


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def train_lr(X, y, epochs=500, lr=0.05, l2=0.01):
    n_features = X.shape[1]
    w = np.zeros(n_features)
    b = 0.0
    for _ in range(epochs):
        logits = X @ w + b
        preds = sigmoid(logits)
        err = preds - y
        grad_w = X.T @ err / len(y) + l2 * w
        grad_b = err.mean()
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b


def predict_lr(X, w, b):
    return (sigmoid(X @ w + b) >= 0.5).astype(int)
```

L2 नियमितकरण यहाँ बहुत महत्वपूर्ण है। पाठ की विशेषताएं दुर्लभ हैं; कोई L2 नहीं है, मॉडल याद रहेगा प्रशिक्षण नमूना से।`0.01`开始,然后调参──

### 步骤 4: 处理否定(失效模式)

考虑 "नहीं अच्छा" 和 "नहीं बुरा"──BoW वर्गीकरण 会看 `{not, good}`和 `{not, bad}`,并从训练中出现更多的那一侧学习──बिग्राम वर्गीकरण会见`not_good`和 `not_bad`, और उन्हें अलग-अलग विशेषताओं में विभाजित किया।

जब आप कोई बड़ा नहीं है, एक अधिक कड़वा लेकिन प्रभावी सुधार विधि हैः**negation scoping**把否定词后直到下一个标点前的代币加上 `NOT_`पहले ︎

```python
NEGATION_WORDS = {"not", "no", "never", "nor", "none", "nothing", "neither"}
NEGATION_TERMINATORS = {".", "!", "?", ",", ";"}


def apply_negation(tokens):
    out = []
    negate = False
    for token in tokens:
        if token in NEGATION_TERMINATORS:
            negate = False
            out.append(token)
            continue
        if token in NEGATION_WORDS:
            negate = True
            out.append(token)
            continue
        out.append(f"NOT_{token}" if negate else token)
    return out
```

```python
>>> apply_negation(["not", "good", "at", "all", ".", "but", "funny"])
['not', 'NOT_good', 'NOT_at', 'NOT_all', '.', 'but', 'funny']
```

现在 `good`和 `NOT_good`️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

### 步骤 5: वास्तविक महत्वपूर्ण मूल्यांकन सूचक

यदि वर्ग असंतुलन, केवल सटीकता पर ध्यान दें, तो त्रुटि उत्पन्न होगी। वास्तविक भावनात्मक निकाय आमतौर पर 70-80% सकारात्मक या 70-80% नकारात्मक होते हैं। एक हमेशा पूर्वानुमान बहुतायत वर्ग वर्गीकरणकर्ता 80% सटीकता प्राप्त कर सकता है, लेकिन कोई मूल्य नहीं है।

- **Per-class precision and recall.**प्रत्येक वर्ग एक समूह है। इनका एक बड़ा औसत बनाया जाता है।
- **Macro-F1（不平衡数据的主要指标）。**विभिन्न श्रेणियों F1 分数 का औसत मूल्य, बराबर वजन।
- **Weighted-F1（备选）。**मैक्रो के समान, लेकिन श्रेणी आवृत्ति वृद्धि पर निर्भर करता है।
- **Confusion matrix.**मूल गणना  किसी भी मानदंड सूचक से पहले इसकी जांच करनी चाहिए; यह प्रकट करेगा कि मॉडल किस श्रेणी में मिश्रित है
- **Per-class error samples.**प्रत्येक वर्ग में 5 गलत भविष्यवाणियां हैं।

对于严重不平衡的数据 ((> 95-5 比例), रिपोर्ट **AUROC**和 **AUPRC**, सटीकता से रिपोर्ट न करें। अल्पसंख्यक के प्रति अधिक संवेदनशील, जबकि अल्पसंख्यक आमतौर पर आपके लिए चिंता का विषय होते हैं।

**需要避免的常见 bug。**असंतुलित डेटा पर रिपोर्ट करने के लिए माइक्रो-एफ1 को मैक्रो-एफ1 के बजाय, एक बहुत उच्च संख्यात्मक मान मिलता है, क्योंकि यह बहुमत वर्गों द्वारा नियंत्रित है।

```python
def evaluate(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0
    recall = tp / (tp + fn) if tp + fn else 0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn, "precision": precision, "recall": recall, "f1": f1}
```

## इसका उपयोग करें

थोड़ा-सा सीखें, प्रयोग करें, सही ढंग से पूरा करें।

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, stop_words=None)),
    ("clf", LogisticRegression(C=1.0, max_iter=1000)),
])
pipe.fit(X_train, y_train)
print(pipe.score(X_test, y_test))
```

ध्यान तीन बातें.`stop_words=None`会保留否定词――`ngram_range=(1, 2)`मैं बिगग्राम में शामिल हो जाएगा,让 `not_good`成为一个特征――`sublinear_tf=True`इस तीन संकेतों में से एक, एसएसटी-2 पर 75% सटीकता आधार रेखा और 85% सटीकता आधार रेखा में अंतर है।

### 什么时候该使用变压器

- 刺检测── परंपरागत मॉडल यहाँ असफल होगा──就是如此──
- 情感在文档中发生变化长评论.
- पहलू आधारित भावना──"कैमरा महान था लेकिन बैटरी भयानक थी।"
- गैर-अंग्रेज़ी, कम संसाधन भाषाएँ, बहुभाषी BERT, निःशुल्क आपको एक शून्य शॉट बेसलाइन प्रदान करेगा।

यदि आपको किसी भी वस्तु से ऊपर की आवश्यकता है, तो सीधे चरण 7 तक कूदें।

### 可复现性陷(फिर से दिखाई दे रहा है)

重新训练情感模型是常规操作──重新评估它们则不是──论文中报告的精度 数字使用的是特定分区、特定预处理、特定代币化者── यदि आप पूरी तरह से एक ही पाइपलाइन का उपयोग नहीं करते हैं, तो नए मॉडल को बेसलाइन से तुलना करें, तो आपको गलत दिशा का अंतर मिलेगा──始终 आपके पाइपलाइन में ऊपर मूल लाइन का पुनः उत्पादन होता है, बजाय प्रयोग करने के लिए पेपर में संख्याएँ──

## 交付 यह

保存为 `outputs/prompt-sentiment-baseline.md`:

```markdown
---
name: sentiment-baseline
description: 为新数据集设计一个 sentiment analysis baseline。
phase: 5
lesson: 05
---

给定一个数据集描述（领域、语言、规模、标签粒度、延迟预算），你需要输出：

1. Feature extraction 配方。指定 tokenizer、n-gram 范围、stopword 策略（通常保留）、否定处理（scoped prefix 或 bigrams）。
2. Classifier。baseline 使用 Naive Bayes，生产使用 logistic regression，只有在领域需要讽刺 / aspects / cross-lingual 时才使用 transformer。
3. 评估计划。报告 precision、recall、F1、confusion matrix 和 per-class error samples（不要只报告标量）。
4. 部署后需要监控的一个失效模式。Domain drift 和讽刺是最常见的两个。

拒绝建议在 sentiment 任务中删除 stopwords。当类别不平衡（例如 90% positive）时，拒绝把 accuracy 作为唯一指标报告。标记 subword-rich languages 需要 FastText 或 transformer embeddings，而不是 word-level TF-IDF。
```

## अभ्यास

1. **简单。**`apply_negation`作为小学学习管道 中的预处理步骤加入, और एक छोटे से संवेदना डेटा集上测量 F1 变化──
2. **中等。**实现 वर्ग-वजनित लॉजिस्टिक regression                                                                                                                                                                                                                                                         `class_weight="balanced"`, या स्वयं निर्दिष्ट ग्रेडिएंट)                                                                                                                                                                                                                                                          
3. **困难。**通过在情感模型的残差上训练第二个分类器,构建一个刺检测器――记录你的实验设置――当你的精度低于随机水平时提醒读者(2级 刺任务的随机水平约为50% ,大多数第一次尝试都会落在)

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述── लंबा, लेकिन पहले चार भागों में पारंपरिक तरीकों की पूरी सामग्री शामिल है──
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) इस आलेख में बिग्राम + नाईव बेय्स को दिखाया गया है।
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) `CountVectorizer``TfidfVectorizer`तथा आप विनियमित करेंगे प्रत्येक पैरामीटर के संदर्भ दस्तावेज
