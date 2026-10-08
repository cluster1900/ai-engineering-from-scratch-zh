# Bayes ingenuo

> naive 假设是错误的, pero sigue siendo válido.

**Type:** Build
**Language:**Python
**先修要求：**Fase 2, Lecciones 01-07 ((Clasificación, teorema de Bayes)
**Time:** ~75 分钟

## El objetivo del aprendizaje
- Desde零实现带 Laplace suavizamiento de Bayes Naívo Multinomio, para la clasificación del texto
- Explica por qué la suposición de independencia ingenuo es errónea en matemáticas, pero en la práctica todavía puede producir una clasificación de clases correcta.
- Comparación Multinomio、Bernoulli 和 Gaussian Naive Bayes 变体,并为给定特征类型选择合适的版本
- En alta altura de datos raros, se evaluará la comparación entre Bayes Ingenuo y la regresión logística y se explicará el papel que desempeña en ella el tradeoff de variaciones de sesgo

##  problemas
Usted necesita clasificar el texto. Se divide el correo en spam o no spam. Se divide los comentarios de los clientes en positivos o negativos. Se divide el trabajo en diferentes categorías.

La mayoría de los clasificadores aquí están en la mayoría de los lugares. La regresión lógica requiere suficientes muestras para poder estimar con confianza miles de millones de pesos. Los árboles de decisión se dividen una vez por una sola palabra y se superan gravemente.

Bayes ingenuo puede tratar esta situación. Ha hecho una hipótesis matemáticamente errónea de que, después de una determinada clase, cada característica es independiente de todas las demás características), pero en la clasificación de texto sigue superando a los modelos más inteligentes, especialmente en el entrenamiento en grupos más pequeños. Sólo necesita un solo paso por los datos para completar el entrenamiento. Puede extenderse a millones de características.

Comprender por qué una hipótesis errónea puede traer una buena predicción, te hará aprender un hecho fundamental del aprendizaje automático: el mejor modelo no es el modelo más correcto, sino que tiene el mejor modelo de cambio de variación de sesgo en tu datos.

## 概念
### Teorema de Bayes (la teoría de Bayes)

Teorema de Bayes 会反转条件概率:

```
P(class | features) = P(features | class) * P(class) / P(features)
```

Queremos que`P(class | features)`, es decir, después de un determinado archivo, el archivo pertenece a una clase de probabilidad. Podemos calcularlo a partir de los siguientes números:
- `P(features | class)`: probabilidad de ver estas palabras en este tipo de documentos
- `P(class)`:类别的预先概率(总体上垃圾邮件 有多常见?)
- `P(features)`Las pruebas son iguales para todas las categorías, por lo que la comparación de las categorías puede ser ignorada.

`P(class | features)`La mejor clase de ganancia.

### Una suposición ingenua de independencia

精确计算 `P(features | class)`需要估估计所有特征联合出现的共同概率──对于包含10,000 词汇的词汇库,你需要估估2^10,000 种可能组合上的分布──不可能──

La suposición ingenua es que, dado que cada clase tiene características condicionalmente independientes,

```
P(w1, w2, ..., wn | class) = P(w1 | class) * P(w2 | class) * ... * P(wn | class)
```

Ya no se estima una distribución conjunta imposible, sino que se estima una distribución simple por rasgo. Cada distribución sólo necesita un cuadro.

Esta hipótesis es obviamente errónea. En cualquier documento, la "máquina" y el "aprendizaje" no son independientes. Pero el clasificador no necesita una estimación correcta de probabilidad. Requiere una clasificación correcta, es decir, la probabilidad más alta de qué clase. La suposición de independencia introducirá errores sistémicos, pero estos errores afectan a todas las clases de manera similar, por lo que la clasificación sigue siendo correcta.

### Por qué todavía funciona

Tres razones:

1. **排序优先于校准。**Clasificación sólo necesita clasificar la categoría más alta correcta── incluso P(spam) = 0.99999, mientras que la probabilidad real es 0.7, clasificador  todavía va a seleccionar el spam── nosotros no necesitamos la probabilidad correcta── necesitamos la probabilidad correcta de ganar la categoría──

2. **高 bias，低 variance。**La suposición de independencia es un modelo fuerte de prioridad. Esto evita el sobreajuste. En el entrenamiento de datos limitados, un modelo pequeño de error pero estable, va a ganar un modelo teóricamente correcto pero extremadamente inestable.

3. **特征冗余会相互抵消。**相关特征提供冗余证据――Clasificador 会重复计算这些证据,但它也会为正确类别重复计算――Si "máquina" y "aprendizaje" 总是出现,它们都会为"技术"类提供证据――NB将它们计算两次,但它是正确类别计算两次――

La predicción es una multiplicación de la matriz. Puedes completar la formación en unos segundos con un millón de artículos. Esta velocidad significa que puedes experimentar más rápido.

### El matemático paso a paso

让我们跟踪一个具体例――假设我们有两个类别:spam 和非spam――我们的词汇有三个词语:"免费""",钱"",会议"",

entrenamiento datos:
- Spam 邮件 mencionó "libre" 80 veces"",dinero" 60 veces"",reunión" 10 veces ((total 150 个词)
- No-spam 邮件 menciona "gratis" 5 次、"dinero" 10 次、"reunión" 100 次(total 115 个词)
- El 40% de los mensajes son spam, el 60% no son spam.

Uso de la limpieza de Laplace:

```
P(free | spam)    = (80 + 1) / (150 + 3) = 81/153 = 0.529
P(money | spam)   = (60 + 1) / (150 + 3) = 61/153 = 0.399
P(meeting | spam) = (10 + 1) / (150 + 3) = 11/153 = 0.072

P(free | not-spam)    = (5 + 1) / (115 + 3) = 6/118 = 0.051
P(money | not-spam)   = (10 + 1) / (115 + 3) = 11/118 = 0.093
P(meeting | not-spam) = (100 + 1) / (115 + 3) = 101/118 = 0.856
```

Nueva邮件包含:"libre"(2 次) 、"dinero"(1 次) 、"reunión"(0 次) ✿

```
log P(spam | email) = log(0.4) + 2*log(0.529) + 1*log(0.399) + 0*log(0.072)
                    = -0.916 + 2*(-0.637) + (-0.919) + 0
                    = -3.109

log P(not-spam | email) = log(0.6) + 2*log(0.051) + 1*log(0.093) + 0*log(0.856)
                        = -0.511 + 2*(-2.976) + (-2.375) + 0
                        = -8.838
```

Spam 以很大优势胜出──"free" 出現两次是支持垃圾邮件的强证──注意, "reunión" no apareció, las contribuciones a dos log sumes son零(0 * log(P))En la NB multinomial, la falta de palabras no afecta──

### Tres variantes

Bayes ingenuo tiene tres formas. Cada una de ellas se construye de una manera diferente.`P(feature | class)`¿Qué es eso?

#### Bayes Ingenuo Multinomio

Capacitará cada característica para calcular la cantidad de datos en texto de la característica más adecuada para el valor de TF-IDF.

```
P(word_i | class) = (count of word_i in class + alpha) / (total words in class + alpha * vocab_size)
```

`alpha`Es la clasificación de la literatura.

#### Bayes Ingenuo Gaussiano

La distribución de cada característica se hará en el estado correcto.

```
P(x_i | class) = (1 / sqrt(2 * pi * var)) * exp(-(x_i - mean)^2 / (2 * var))
```

Cada categoría tiene su propio valor medio y diferencia para cada característica. Cuando las características dentro de cada categoría realmente se ajustan a la curva de la horquilla, este método funciona muy bien.

#### Bernoulli Ingenuo Bayes

La función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la cuta de la cuta de la cuta de la cuta de la cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cuta de cu

```
P(word_i | class) = (docs in class containing word_i + alpha) / (total docs in class + 2 * alpha)
```

A diferencia de Multinomial, Bernouli lo consideraría como una prueba de que el "libre" aparece en el correo no spam.

### Cuándo usar cada variante

| Variant | Feature Type | Best For | Example |
|---------|-------------|----------|---------|
| Multinomial | 计数或频率 | 文本 classification、bag-of-words | Email spam、topic classification |
| Gaussian | 连续值 | 具有近似正态特征的表格数据 | Iris classification、传感器数据 |
| Bernoulli | 二值（0/1） | 短文本、二值特征 Vector | SMS spam、presence/absence features |

### Laplace Smoothing

Si aparece una palabra en los datos de prueba, pero nunca aparece en una categoría específica de datos de entrenamiento, ¿qué ocurre?

没有 suavizamiento:`P(word | class) = 0/N = 0`◊ Una 零乘进整乘积后, hará `P(class | features) = 0`, sin importar la evidencia hay más poderosos. Un solo mensaje no visto destruirá toda la predicción, sin importar cuántas otras pruebas lo apoyen.

El suavización de la zona dará a cada característica un recuento más un pequeño recuento .`alpha`(normalmente para 1):

```
P(word_i | class) = (count(word_i, class) + alpha) / (total_words_in_class + alpha * vocab_size)
```

Cuando alfa=1 时, cada palabra tiene al menos una muy pequeña probabilidad. En el testmail aparece un "discombobulate" (descombotar) (no volverá a dejar que el spam se vuelva a cero).

Más alto alfa significa más fuerte de suavizamiento (distribución más media) ⋅ menos alfa significa más confianza en los datos.

El efecto alfa:

| Alpha | Effect | When to use |
|-------|--------|-------------|
| 0.001 | 几乎没有 smoothing，信任数据 | 非常大的训练集，预计不会有未见特征 |
| 0.1 | 轻度 smoothing | 大型训练集 |
| 1.0 | 标准 Laplace smoothing | 默认起点 |
| 10.0 | 重度 smoothing，会压平分布 | 非常小的训练集，预计有许多未见特征 |

### Computación del espacio log-espacio

Si se multiplican cientos de probabilidades, cada uno de ellos menor a 1) conducirá a un flujo inferior de puntos flotantes.

 solución: en el espacio de registro, no se trabaja en la probabilidad de multiplicarse, sino en la proporción de multiplicarse:

```
log P(class | x1, x2, ..., xn) = log P(class) + sum_i log P(xi | class)
```

Esto convertirá la predicción en producto de puntos:

```
log_scores = X @ log_feature_probs.T + log_class_priors
prediction = argmax(log_scores)
```

La multiplicación de matriz. Es la razón por la cual el método de Bayes es tan rápido.

### Bayes ingenuo vs Regresión logística

Los dos son clasificadores lineales de texto. La diferencia es en los objetos que construyen.

| Aspect | Naive Bayes | Logistic Regression |
|--------|------------|-------------------|
| Type | Generative（建模 P(X\|Y)） | Discriminative（建模 P(Y\|X)） |
| Training | 统计频率 | 优化 Loss Function |
| Small data | 更好（强 prior 有帮助） | 更差（不足以估计权重） |
| Large data | 更差（错误假设会拖累） | 更好（更灵活的边界） |
| Features | 假设独立 | 能处理相关性 |
| Speed | 单次遍历，非常快 | 迭代优化 |
| Calibration | 概率较差 | 概率更好 |

經驗法则: desde Naive Bayes 開始── Si tienes suficiente datos, y NB 進入平台期,就切换到物流回归──

### Línea de clasificación

```mermaid
flowchart LR
    A[Raw Text] --> B[Tokenize]
    B --> C[Build Vocabulary]
    C --> D[Count Word Frequencies]
    D --> E[Apply Smoothing]
    E --> F[Compute Log Probabilities]
    F --> G[Predict: argmax P class given words]

    style A fill:#f9f,stroke:#333
    style G fill:#9f9,stroke:#333
```

En la práctica, trabajamos en el espacio de registro para evitar el flujo inferior de puntos flotantes.

```
log P(class | features) = log P(class) + sum_i log P(feature_i | class)
```


```figure
naive-bayes
```

## Construirlo
`code/naive_bayes.py`El código medio desde el cero ha realizado MultinomialNB y GaussianNB.

### MultinomioNB

Desde el 0:

1. **fit(X, y)**: para cada clase, estadística de cada característica de la frecuencia.

2. **predict_log_proba(X)**: para cada muestra, calcular todos los tipos de registro P(clase) + suma de registro P(feature_i ➡ clase) ➡ Esto es una multiplicación de Matriz: X @ log_probs.T + log_priors✔

3. **predict(X)**: regresar probabilidad de registro

```python
class MultinomialNB:
    def __init__(self, alpha=1.0):
        self.alpha = alpha

    def fit(self, X, y):
        classes = np.unique(y)
        n_classes = len(classes)
        n_features = X.shape[1]

        self.classes_ = classes
        self.class_log_prior_ = np.zeros(n_classes)
        self.feature_log_prob_ = np.zeros((n_classes, n_features))

        for i, c in enumerate(classes):
            X_c = X[y == c]
            self.class_log_prior_[i] = np.log(X_c.shape[0] / X.shape[0])
            counts = X_c.sum(axis=0) + self.alpha
            self.feature_log_prob_[i] = np.log(counts / counts.sum())

        return self
```

关键洞察: después de la combinación, el pronóstico es sólo la multiplicación de la matriz y el sesgo.

### GaussianNB

 Para las características continuas, estimamos el promedio y la diferencia de cada categoría para cada característica:

```python
class GaussianNB:
    def __init__(self):
        pass

    def fit(self, X, y):
        classes = np.unique(y)
        self.classes_ = classes
        self.means_ = np.zeros((len(classes), X.shape[1]))
        self.vars_ = np.zeros((len(classes), X.shape[1]))
        self.priors_ = np.zeros(len(classes))

        for i, c in enumerate(classes):
            X_c = X[y == c]
            self.means_[i] = X_c.mean(axis=0)
            self.vars_[i] = X_c.var(axis=0) + 1e-9
            self.priors_[i] = X_c.shape[0] / X.shape[0]

        return self
```

预测会对每个特征使用高西亚PDF,并跨特征相乘(在日志空间中相加)

### Demo: Clasificación del texto

代码会生成合成包-of-words 数据,模拟两个类别(artículos tecnológicos y artículos deportivos) ∼ cada clase tiene una distribución de palabras frecuentes diferente。

El método de trabajo de datos sintéticos es el siguiente: Nosotros creamos 200 个词(特征列) ――Palabras 0-39 en artículos de tecnología con alta frecuencia, en deportes con baja frecuencia. Palabras 80-119 en deportes con alta frecuencia, en tecnología con baja frecuencia.

### Demo: características continuas

代码会生成类似于 Iris的数据(3 个类别、4 个特征、Gaussian clusters) ――GaussianNB utiliza cada clase de promedio y diferencia para realizar la clasificación。 cada clase tiene diferentes centros(medio vector) y diferentes niveles de dispersión(varianza),模拟现实数据中各类测量值系统性不同的情况。

También se muestra:
- **Smoothing comparison：**Utiliza diferentes alfa valor entrenamiento MultinomialNB, mostrar el efecto de suavización 强度对准确率──
- **Training size experiment：**Con el aumento de los datos de entrenamiento de 20 muestras a 1600 muestras, la tasa de precisión de NB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
- **Confusion matrix：**Cada categoría de precisión, recuerde y F1 puntaje, para mostrar NB 在哪里犯错.

### Velocidad de predicción

Naive Bayes 预测 es una multiplicación de la matriz― para n 个样本、d 个特征、k 个类别:
- MultinomioNB: una vez multiplicando la matriz (n x d) @ (d x k) = O(n * d * k)
- GaussianNB:n * k veces Gaussian PDF 求值,每次覆盖 d 个特征 = O(n * d * k)

Los dos son lineales en cada dimensión. En comparación con KNN, se necesita calcular hasta la distancia de todos los puntos de entrenamiento) o con SVM del núcleo RBF, se necesita hacer una evaluación del núcleo en todos los vectores de soporte.

## Usalo
Usando el método de la tienda, estos dos cambios son de la misma manera:

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB

gnb = GaussianNB()
gnb.fit(X_train, y_train)
print(f"GaussianNB accuracy: {gnb.score(X_test, y_test):.3f}")

mnb = MultinomialNB(alpha=1.0)
mnb.fit(X_train_counts, y_train)
print(f"MultinomialNB accuracy: {mnb.score(X_test_counts, y_test):.3f}")
```

Usar sklearn hacer la clasificación del texto:

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ("vectorizer", CountVectorizer()),
    ("classifier", MultinomialNB(alpha=1.0)),
])

text_clf.fit(train_texts, train_labels)
accuracy = text_clf.score(test_texts, test_labels)
```

`naive_bayes.py`El código medio se comparará desde cero con el de Skelarn en los mismos datos para verificar su veracidad.

### TF-IDF con Naive Bayes

El número de palabras iniciales hace que cada palabra que aparece tenga el mismo peso. Pero como "el" y "es" tales palabras comunes aparecen frecuentemente en cada categoría.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB(alpha=0.1)),
])
```

TF-IDF valor es negativo, por lo que se puede utilizar con MultinomialNB ∞. La combinación de TF-IDF + MultinomialNB es una de las líneas de base más fuertes de la clasificación de texto ∞. En los ejemplos de entrenamiento de menos de 10.000 datos, a menudo supera modelos más complejos.

### Utilizado en el texto corto de BernoulliNB

对于短文本(tweets、SMS、chat messages),BernoulliNB 可能优于多语文NB──短文本的词数量很低,因此多语文NB depende de la frecuencia de ruido de información más grande──BernoulliNB sólo se preocupa por la aparición o la falta, esto es más fiable en短文本──

```python
from sklearn.naive_bayes import BernoulliNB
from sklearn.feature_extraction.text import CountVectorizer

text_clf = Pipeline([
    ("vectorizer", CountVectorizer(binary=True)),
    ("classifier", BernoulliNB(alpha=1.0)),
])
```

Conto de vectorizador 中的 `binary=True`标志会将所有计数转换为0/1──没有它,BernoulliNB 仍能运行,但它看到的是并非为其设计的计数──

### Calibración NB Probabilidades

NB 概率校准很差──NB dice P(spam) = 0.95 时, la verdadera probabilidad es posible 0.7──Si necesitas una estimación de probabilidad fiable, por ejemplo, para establecer 值 o en combinación con otros modelos, por favor, usa el Clasificador Calibrado de sklearnCV:

```python
from sklearn.calibration import CalibratedClassifierCV

calibrated_nb = CalibratedClassifierCV(MultinomialNB(), cv=5, method="sigmoid")
calibrated_nb.fit(X_train, y_train)
proba = calibrated_nb.predict_proba(X_test)
```

Esto se realizará a través de la validación cruzada, en la que se ajustará una regresión logística sobre el número inicial de NB. La probabilidad de obtenerlo se acercará más a la frecuencia de clase real.

### Gotas comunes

1. **负特征值。**MultinomioNB  Requiere características no negativas. Si tienes un valor negativo, por ejemplo, bajo ciertas configuraciones TF-IDF, o características posteriores a la estandarización, puedes cambiar el GaussianNB o cambiar el valor del valor.

2. **零方差特征。**GaussianNB se divide en diferencias. Si una clase de características de una determinada clase difiere en un valor igual, la probabilidad de cálculo se presenta como un problema.

3. **类别不平衡。**Si el 99% de los mensajes es no spam, previo P(no spam) = 0.99 会非常强, en lo que respecta a la evidencia de probabilidad de presión. Puedes establecer manualmente los prefijos de clase, o usar el prefijo de clase de sklearn.

4. **特征缩放。**MultinomioNB no necesita escalar (la cuenta de procesamiento) GaussianNB también no necesita escalar (la estimación de cada característica) Esto es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo que es lo es lo que es lo es lo que es lo es lo que es lo es lo que es lo es lo que es lo es lo es lo que es lo es lo es lo que es lo es lo es lo que es lo es lo es lo es lo que es lo es lo es lo que es lo es lo es lo es lo es lo es lo que es lo es lo es lo que es lo es lo es lo es lo es lo es lo es lo es lo es lo que es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo que es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo es lo

##  entregarlo
Encuentro de trabajo:
- `outputs/skill-naive-bayes-chooser.md`: Una habilidad para elegir correctamente NB 变体
- `code/naive_bayes.py`Desde el zero realizado, el Multinomio NB y el GaussianNB, no contienen datos comparativos

### Cuando Bayes, el ingenuo, falla

Cuando la suposición de independencia  conduce a errores de clasificación ((no sólo es errores de probabilidad) , NB 会失败── esto ocurre en las siguientes situaciones:

1. **强特征交互。**Si la clase depende de la combinación de dos características, y no de una característica individual cualquiera, similar al modelo de XOR, NB se equivocará completamente.

2. **高度相关且 evidence 相反的特征。**Si la característica A indica "spam", la característica B indica "no spam", pero A y B 完全相关 (realmente siempre coinciden), NB 会看到实际上不存在的冲突证据──

3. **非常大的训练集。**Cuando los datos son suficientes, los modelos discriminatorios como la regresión logística, aprenderán a alcanzar los límites de la decisión real, y superarán la NB.

En la práctica, para la clasificación del texto, estos modos de falla no son comunes. La cantidad de características del texto es mucho más baja, y los errores de la suposición de independencia suelen ser mutuamente compensados. Para los datos de la tabla de características relacionadas con sólo una pequeña cantidad de características, por favor, considere la regresión logística o los modelos basados en árboles.

##  ejercicios
1. **Smoothing experiment。**En el texto de datos, se utiliza el valor alfa 0.01、0.1、1.0、10.0 y 100.0  entrenamiento MultinomioNB── dibujar con precisión frente al alfa── ¿Dónde alcanza el máximo rendimiento? ¿Por qué muy alto alfa 会伤害性能?

2. **Feature independence test。**取一个真文本数据集. 选择两个 palabras claramente relacionadas ("máquina"和"aprendizaje") 计算 P1word 类) * P2word 类),并与 P1word AND word2class) Compare. 假设独立 错得多严重? ¿Esto afectará a la precisión de la clasificación ?

3. **Bernoulli implementation。**扩展代码, añadir una clase BernoulliNB──将包-of-words 转换为二值(present/absent), y en el texto datos con la comparación con MultinomialNB── ¿Cuándo Bernoulli 会赢?

4. **NB vs Logistic Regression。**En el texto, los dos se entrenan en datos. ¿Cuándo superará la Regresión Lóggica a los Bayes Ingenuos?

5. **Spam filter。**构建一个完整的垃圾邮件分类器:tokenize 原始邮件文本、构建词汇、创建包-of-words features、训练 MultinomialNB,并使用精确和回忆 评估(不只是精确为什么?)

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Naive Bayes | “简单的概率 classifier” | 一个使用 Bayes' theorem，并假设给定类别后特征 conditionally independent 的 classifier |
| Conditional independence | “特征彼此不影响” | P(A, B \| C) = P(A \| C) * P(B \| C)——一旦知道 C，知道 B 不会告诉你关于 A 的任何新信息 |
| Laplace smoothing | “Add-one smoothing” | 给每个特征添加一个小计数，防止零概率主导预测 |
| Prior | “看到数据之前你相信什么” | P(class)——观察任何特征之前，每个类别的概率 |
| Likelihood | “数据拟合得有多好” | P(features \| class)——如果类别已知，观察到这些特征的概率 |
| Posterior | “看到数据之后你相信什么” | P(class \| features)——观察到特征后，类别的更新概率 |
| Generative model | “建模数据如何生成” | 学习 P(X \| Y) 和 P(Y)，然后使用 Bayes' theorem 得到 P(Y \| X) 的模型 |
| Discriminative model | “建模 decision boundary” | 不建模 X 如何生成，而是直接学习 P(Y \| X) 的模型 |
| Log probability | “避免 underflow” | 使用 log P 而不是 P，防止许多小数相乘后在浮点数中变成零 |

## 延伸阅读
- [scikit-learn Naive Bayes docs](https://scikit-learn.org/stable/modules/naive_bayes.html) 三种变体 y sus detalles matemáticos
- [McCallum and Nigam, A Comparison of Event Models for Naive Bayes Text Classification (1998)](https://www.cs.cmu.edu/~knigam/papers/multinomial-aaaiws98.pdf) 文中 Multinomio con el clásico comparación de Bernoulli
- [Rennie et al., Tackling the Poor Assumptions of Naive Bayes Text Classifiers (2003)](https://people.csail.mit.edu/jrennie/papers/icml03-nb.pdf)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Ng and Jordan, On Discriminative vs. Generative Classifiers (2001)](https://ai.stanford.edu/~ang/papers/nips01-discriminativegenerative.pdf) prova NB  收 快 在数据较少时比 LR 收 快
