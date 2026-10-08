# Análise dos sentimentos

> 经典的NLP 任务――关于传统文本分类你需要掌握的大部分内容,都会出现在这里――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## 问题

"A comida não foi ótima". É verdade ou negativa?

Sentimento  parece muito simples. Os comentadores dizem que eles gostam ou não gostam de alguma coisa. Em alguns casos, o termo é usado para designar um tipo de programa de PNL.`tight`Com o seu estilo de vida`tight`含义不同) ⋅

Sentimento é o laboratório de prática da tradicional PNL. Se você entender por que cada linha de base ingênua tem um padrão de falha específico, você já entende por que vai desenvolver cada modelo mais rico.

## 概念

O sentimento tradicional é uma combinação de dois passos.

1. **表示。**把文本转成 feature vector──BoW、TF-IDF 或 n-grams──
2. **Classification。**Em especial, a teoria da regressão logística (SVM) é uma teoria de uma teoria de uma base de dados.

Naive Bayes é o melhor modelo de trabalho. Supõe-se que, em um determinado caso, cada característica seja independente.`P(word | positive)`和 `P(word | negative)` Quando se pensa, se multiplicam essas probabilidades. Esta "naiva" hipótese de independência é ridícula, mas os resultados são muito surpreendentes.

A regressão logística modificou a hipótese de independência.`not good`Como um bigram feature 会得到负权重──Naive Bayes 无法对待从未标记过的bigrams 做到这一点──


```figure
sentiment-logits
```

## Construí-lo

### 步骤 1: Um verdadeiro mini-conjunto de dados

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

O número de dados é muito pequeno.

### 步骤 2: Desde o zero para a realização de Bayes Naívo Multinômico

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

O suavamento aditivo ((alpha=1.0) é o suavamento de Laplace.`alpha=0.01`- Não.`alpha=1.0`É o que é o ensino.

### 步骤 3: Realizar a regressão logística a partir do zero

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

L2 regularização é muito importante aqui.`0.01`Começa, então muda.

### 步骤 4: 处理否定(失效模式)

考虑 "no bom" 和 "no mau"──BoW classificador 会看 `{not, good}`和 `{not, bad}`,并从训练中出现更多的那一侧学习──bigram classifier 会见`not_good`和 `not_bad`E, por isso, é suficiente.

Quando não tens bigramas, um método mais grosseiro, mas eficaz é:**negation scoping**△把否定词后直到下一个标点前的代币加上 `NOT_`- Não.

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

Agora , agora .`good`和 `NOT_good`O classificador pode dar-lhes o peso oposto.

### 步骤 5: Indicador de avaliação realmente importante

Se classe não se equilibra, apenas a precisão pode produzir erro. Os corpos de sentimentos reais são geralmente de 70-80% positivo ou 70-80% negativo.

- **Per-class precision and recall.**Cada classe é uma série. Para fazer uma macro-média, obtém um valor único respeitado do equilíbrio de classe.
- **Macro-F1（不平衡数据的主要指标）。**Vários tipos de F1 dividem o valor médio, igual ao peso.
- **Weighted-F1（备选）。**Comparável com o macro, mas com a taxa de frequência de aumento de classe.
- **Confusion matrix.**O primeiro número é o número de números.
- **Per-class error samples.**Cada categoria tira 5 erros de previsão.

对于严重不平衡的数据 ((> 95-5 比例), relatório **AUROC**和 **AUPRC**Não se deve relatar com precisão. A UPRC é mais sensível à minoria, enquanto a minoria é normalmente o objeto de seu interesse.

**需要避免的常见 bug。**Em dados desequilibrados, o relatório micro-F1 em vez de macro-F1 obtém um valor numérico muito alto, porque é dominado pela maioria das classes.

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

## Use-o

Aprenda-se a fazer o que é preciso.

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

Atenção a três coisas.`stop_words=None`会保留否定词──`ngram_range=(1, 2)`Vou juntar-me a Bigrams, deixe-me.`not_good`Tornar-se uma característica.`sublinear_tf=True`O impacto das palavras de baixo teor de gravidade. Estes três sinais, de origem, são os de 75% de precisão no ponto de partida da SST-2 e 85% de precisão no ponto de partida.

### 什么时候该使用变压器

- 刺检测── tradicional modelo aqui vai falhar── é assim
- O que é que se passa no meio do processo de mudança?
- Sentimento baseado em aspectos. "A câmera era ótima, mas a bateria era terrível".
- Não-inglês, baixo recurso linguístico, BERT Multilingue, irá dar-lhe uma linha de base de zero-shot.

Se precisar de qualquer coisa, salta diretamente para a fase 7 (transformadores mergulham profundamente)

### A situação é mais complicada.

重新训练情感模型是常规操作――重新评估它们则不是――论文中报告的准确性 数字使用的是特定分区、特定预处理、特定代币化者──如果你 não usa o mesmo pipeline, mas comparar o novo modelo com a linha de base, vai obter um erro de orientação diferencial──始终在你的管线上重新生成基线,而不是使用论文中的数字──

## Entrega-o

保存为 `outputs/prompt-sentiment-baseline.md`- Não .

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

## 练习

1. **简单。**- Não .`apply_negation`Como um pequeno aprendizagem de pipeline, o processo de pre-processamento está sendo desenvolvido em um pequeno sentimento.
2. **中等。**实现 class-weighted logistic regression                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `class_weight="balanced"`, ou auto-implementado Gradiente) ⋅ em sintético 90-10 类别不平衡上测量效果
3. **困难。**通過在情感模型的残差上訓練第二個分類器, 建一刺检测器──记录你的实验设置──当你的精度低于随机水平时提醒读者──2o grau 刺任务的随机水平是50%左右,大多第一次尝试都会落在)

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述── muito longa, mas os primeiros quatro capítulos cobrem todo o conteúdo dos métodos tradicionais──
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) Este artigo mostra Bigrams + Naive Bayes em um texto curto.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)- Não .`CountVectorizer`- Não.`TfidfVectorizer`E também o documento de referência de cada parâmetro que você irá regular.
