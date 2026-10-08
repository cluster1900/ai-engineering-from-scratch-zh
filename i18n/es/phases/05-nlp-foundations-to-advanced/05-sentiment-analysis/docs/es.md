# Análisis de los sentimientos

> 经典的NLP 任务――关于传统文本分类你需要掌握的大部分内容,都会出现――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

##  problemas

"La comida no fue buena". ¿Es verdad o negativo?

El sentimiento parece muy simple. Los comentaristas dicen que les gusta o no algo así. Se convirtió en una tarea clásica de la PNL, porque detrás de cada caso parece simple hay un punto de dificultad.`tight`Con el tiempo en comentarios `tight`含义不同) ⋅

El sentimiento es el laboratorio de práctica tradicional de la PNL. Si entiendes por qué cada línea básica ingenua tiene un modelo de falla específico, ya entiendes por qué se desarrollará cada modelo más rico. Este curso se desarrollará desde cero construyendo una línea básica de Bayes ingenua, incorporando la regresión logística, y señalando las trampas que hacen que el sentimiento de la clase de producción se convierta en un problema de la clase de la norma.

## 概念

El sentimiento tradicional es una combinación de dos pasos.

1. **表示。**把文本转成 caracter vector──BoW、TF-IDF 或 n-grams──
2. **Classification。**En la actualidad, el modelo de la base de datos de la base de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de

Bayes Ingenuo es el mejor modelo de trabajo. Supongamos que en un determinado caso, cada característica es independiente de la otra.`P(word | positive)`Y `P(word | negative)` En el caso de la teoría, las probabilidades se multiplican. Esta hipótesis de independencia "naiva" es ridícula, pero el resultado es sorprendente.

La regresión logística ha modificado la hipótesis de independencia.`not good`Como una característica de bigram, conseguiremos un peso negativo.


```figure
sentiment-logits
```

## Construirlo

### Paso 1: Un verdadero mini-cuadro de datos

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

Los datos de la serie de datos son muy pequeños.

### Paso 2: Desde el punto de vista de la realización de los Bayes Ingenuos Multinomial

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

El suavización aditiva (alfa = 1.0) es el suavización de Laplace.`alpha=0.01`¿Qué es eso?`alpha=1.0`Es un aprendizaje de la calidad.

### Paso 3: Logar la regresión logística desde cero

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

La regularización de L2 aquí es muy importante. Las características del texto son raras; sin L2, el modelo se recordará el modelo de entrenamiento.`0.01`開始,然后调参──

### 步骤 4: 处理否定(失效模式)

考虑 "no bueno" 和 "no malo"──BoW clasificador 会看到 `{not, good}`Y `{not, bad}`,并 de entrenamiento surge más que el lado de aprendizaje.`not_good`Y `not_bad`, y las dividen en diferentes características. Esto suele ser suficiente.

Cuando no tienes bigramas, una forma más gruesa pero efectiva de modificar es:**negation scoping**△把否定词后直到下一个标点前的代币加上 `NOT_`¿Qué es eso?

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

Ahora .`good`Y `NOT_good`Es un tipo de sistema de clasificación que puede darles un peso contrario.

### Paso 5: Indicador de evaluación realmente importante

Si el tipo de clasificación es desequilibrado, sólo se mira la precisión, se producirá un error. Los cuerpos de sentimiento real son generalmente de 70-80% positivo o 70-80% negativo.

- **Per-class precision and recall.**Cada grupo de clases se hace un promedio macro para obtener un valor único de equilibrio de clases.
- **Macro-F1（不平衡数据的主要指标）。**Varios tipos de F1 dividen el valor medio, igual al peso. Cuando se encuentra en una clase de desequilibrio, se utiliza la precisión.
- **Weighted-F1（备选）。**Cuando no se equilibra en sí mismo tiene un significado empresarial, se hace un informe con la macro-F1.
- **Confusion matrix.**Primero, el cálculo de la cantidad de valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los valores de los cuales de los valores de los cuales de los cuales de los valores de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de los cuales son de
- **Per-class error samples.**Cada clase extrae 5 errores de pronóstico.

对于严重不平衡的数据 ((> 95-5 比例), informe **AUROC**Y **AUPRC**, no reportar con precisión. La UAPRC es más sensible a la minoría, mientras que la minoría suele ser el objeto de tu interés.

**需要避免的常见 bug。**En los datos desequilibrados, el informe micro-F1 en lugar de macro-F1 obtiene un valor numérico muy alto, ya que está dominado por la mayoría de las clases.

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

## Usalo

Aprende poco con el 6 de enero.

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

Atención a tres cosas.`stop_words=None`会保留否定词──`ngram_range=(1, 2)`¡Me voy a juntar a los grandes!`not_good`成为一个特征――`sublinear_tf=True`Las tres señales, de su vez, son las de la base de precisión del SST-2 de 75% y la de 85% de precisión de la base de la diferencia.

### ¿Cuándo debería usar el transformador?

- 刺检测── Tradicional modelo aquí se va a fracasar──就是這樣──
- 情感在文档中发生变化长评论. 情感在文档中发生变化的长评论.
- Sentimiento basado en aspectos. "La cámara era genial pero la batería era terrible".
- No inglés, bajo recurso.

Si necesitas cualquier cosa, salta directamente a la fase 7 (transformadores sumergen profundamente) ―no, basado en TF-IDF加大грамм加否定处理的天真 Bayes或物流回归,就是你的2026 生产基线―

### ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

Los modelos de sentimiento de nuevo entrenamiento son operaciones habituales. Reevalúarlos no es la exactitud del informe en el artículo. Los números utilizan divisiones específicas, preprocesamiento específico, tokenizadores específicos. Si no utilizas el mismo tipo de pipeline, comparar el nuevo modelo con el modelo de base, obtendrá un valor de error.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/prompt-sentiment-baseline.md`¿Qué es esto ?

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

##  ejercicios

1. **简单。**¿ Qué ?`apply_negation`Como un pequeño aprendizaje de la tubería de la mitad de la fase de preprocesamiento, se incorpora y se realiza un pequeño sentimiento.
2. **中等。**实现 la regresión logística ponderada por clase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `class_weight="balanced"`, o por su propia razón Gradiente) ⋅ en sintético 90-10 类别不平衡上测量效应
3. **困难。**通過在情感模型的残差上訓練第二個分類器,建一刺检测器──记录你的实验设置──当你的精度低于随机水平时提醒读者(2a clase 刺任务的随机水平是50%左右, la mayoría de los primeros intentos se caen allí)──

## 关键术语: "El hombre es un hombre"

| Term | 人们常说的含义 | 它实际上的含义 |
|------|-----------------|-----------------------|
| Polarity | 正面或负面 | 二元标签；有时扩展到中性或细粒度（5-star）。 |
| Aspect-based sentiment | 每个 aspect 的 polarity | 将 sentiment 归因到文本中提到的特定实体或属性。 |
| Negation scoping | 反转附近的 tokens | 在 "not" 之后直到标点前，为 tokens 加上 `NOT_` 前缀。 |
| Laplace smoothing | 给计数加 1 | 防止 Naive Bayes 中出现零概率 features。 |
| L2 regularization | 缩小权重 | 向 Loss 中加入 `lambda * sum(w^2)`。对稀疏文本 features 至关重要。 |

## 延伸阅读

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) 奠基性综述──很长, pero los primeros cuatro capítulos cubren todo el contenido de los métodos tradicionales──
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) Este artículo muestra a Bigrams + Naive Bayes en el texto corto.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)¿ Qué es esto ?`CountVectorizer`¿Qué es esto?`TfidfVectorizer`Y el archivo de referencia de cada parámetro que usted regulará.
