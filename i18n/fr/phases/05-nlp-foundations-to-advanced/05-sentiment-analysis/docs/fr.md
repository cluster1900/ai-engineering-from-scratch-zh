# Analyse des sentiments

> La classique de la PNL 任务── concernant la classification du texte traditionnel, la plupart du contenu que vous devez maîtriser, apparaîtra ici──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

##  problématique

"La nourriture n'était pas bonne". Est-ce vrai ou négatif?

Le sentiment est très simple. Les commentateurs disent qu'ils aiment ou non quelque chose. Il est devenu un classique de la PNL, car chaque cas semble simple est un problème.`tight`Avec le temps dans les commentaires `tight`含义不同) ⋅

Le sentiment est le laboratoire de pratique de la PNL traditionnelle. Si vous comprenez pourquoi chaque ligne de base naïve a un modèle d'échec spécifique, vous comprenez déjà pourquoi chaque modèle plus riche sera développé.

## 概念

Le sentiment traditionnel est un équilibre à deux étapes.

1. **表示。**Pour le texte, il est nécessaire de modifier le texte en vecteur de fonctionnement.
2. **Classification。**Dans le cadre de la conception de l'échantillon, le modèle est un modèle linéaire.

Bayes naïf est le meilleur modèle de travail. Supposons que, dans un cas donné, chaque fonctionnalité soit indépendante de l'autre.`P(word | positive)`et `P(word | negative)` La raison pour laquelle ces probabilités sont multipliées est que cette hypothèse d'indépendance "naïve" est fausse, mais que les résultats sont assez surprenants.

La régression logistique modifie l'hypothèse d'indépendance. Elle est utilisée pour chaque facteur.`not good`作为一个bigram特征 会得到负权重――Naive Bayes 无法对待从未标记过的bigrams 做到这一点――


```figure
sentiment-logits
```

## - Je le construis.

### Étape 1: Un vrai mini-ensemble de données

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

Il est également possible de trouver des données de base sur les données de l'équipe de recherche.

### 步骤 2: De zéro à réaliser les Bayes naïfs multinomiels

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

Le smoothing additif (alpha = 1.0) est le smoothing Laplace. Sans lui, un mot qui n'est pas apparu dans une catégorie obtient une probabilité de zéro, logement, et se déclenche.`alpha=0.01`Il y a une autre.`alpha=1.0`Il est la valeur de l'enseignement.

### Étape 3: Réalisation de la régression logistique à partir de zéro

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

La régularisation de l'L2 est très importante ici. Les caractéristiques du texte sont rares.`0.01`Je commence, puis je modifie.

### 步骤 4: 处理否定(失效模式)

考虑 "pas bon" 和 "pas mal"──BoW classifiateur 会看 `{not, good}`et `{not, bad}`, et plus de formation apparaît dans le côté de l'apprentissage.`not_good`et `not_bad`Il est généralement suffisant.

Quand vous n'avez pas de bigrammes, une méthode plus grossière mais efficace est:**negation scoping**◊把否定词后直到下一个标点前的代币加上 `NOT_`Il est là.

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

Je suis là.`good`et `NOT_good`Les caractéristiques du classement peuvent être modifiées.

### Étape 5: Indicateur d'évaluation vraiment important

Si les catégories sont déséquilibrées, la précision est la seule à voir, il y aura une erreur. Les corps de véritables sentiments sont généralement de 70-80% positifs ou de 70-80% négatifs.

- **Per-class precision and recall.**Chaque classe est une moyenne macro-médiane, obtenant une valeur unique de l'équilibre de classe.
- **Macro-F1（不平衡数据的主要指标）。**La valeur moyenne des différents types de F1 est égale au poids.
- **Weighted-F1（备选）。**Il est également possible de faire des analyses de la situation de l'entreprise en fonction de la situation de l'entreprise.
- **Confusion matrix.**Tout indicateur de valeur doit être examiné avant le calcul; il révélera le modèle de la classe.
- **Per-class error samples.**Chaque catégorie tire 5 erreurs de prédiction.

对于严重不平衡的数据 ((> 95-5 比例), rapport **AUROC**et **AUPRC**Les informations fournies par les autorités locales sont plus précises.

**需要避免的常见 bug。**Dans les données déséquilibrées, le rapport micro-F1 au lieu de macro-F1 obtient une valeur numérique très élevée, car il est dominé par la majorité des classes.

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

## Utilisez-le

Je suis un peu en train d'apprendre à utiliser six pages et je peux vraiment l'accomplir.

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

Attention à trois choses.`stop_words=None`Je vais garder le mot négatif.`ngram_range=(1, 2)`J'ai fait une petite partie de la série.`not_good`成为一个特征──`sublinear_tf=True`Ces trois signes, souvent, sont les mêmes que les SST-2 sur la ligne de référence de 75% et la ligne de référence de 85%.

### 什么时候该使用变压器

- Le modèle traditionnel ici va rater.
- L'émotion est en train de changer.
- "La caméra était super mais la batterie était terrible".
- Non-anglais, faible ressources linguistiques. BERT multilingue vous donnera une ligne de base zéro.

Si vous avez besoin de plus de tout, sautez directement à la phase 7 (transformateurs plongez en profondeur)

### Une nouvelle fois, une nouvelle fois, une nouvelle fois, une nouvelle fois.

Les modèles de sentiment sont des opérations ordinaires. La réévaluation de ces modèles n'est pas la précision du rapport dans le document. Les chiffres utilisés sont des fractions spécifiques, des pré-traitements spécifiques, des jetons spécifiques. Si vous n'utilisez pas le même pipeline, comparer le nouveau modèle avec le baseline, vous obtiendrez une différence d'erreur.

## Je le livre.

保存为 `outputs/prompt-sentiment-baseline.md`- Le numéro de la liste:

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

1. **简单。**Je ne sais pas .`apply_negation`作为小学学习管道 中的预处理步骤加入, et dans un petit sentiment 数据集上测量 F1 变化──
2. **中等。**实现 class-weighted logistique regression                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `class_weight="balanced"`, ou de manière autonome, Gradient) ⋅ dans la synthèse de 90 à 10 catégories d'effet de mesure.
3. **困难。**通過在情感模型的残差上训练第二个分类器,构建一个刺检测器──记录你的实验设置──当你的准确性低于随机水平时提醒读者──二级刺任务的随机水平约为50% ,大多数第一次尝试都会落在)

## 关键术语

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述──很长, mais les quatre premières sections couvrent tout le contenu des méthodes traditionnelles──
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) Cet article montre les bigrams + naïfs Bayes dans un court texte très difficile à vaincre.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) `CountVectorizer`- Je suis là.`TfidfVectorizer`Et les documents de référence de chaque paramètre que vous réglementerez.
