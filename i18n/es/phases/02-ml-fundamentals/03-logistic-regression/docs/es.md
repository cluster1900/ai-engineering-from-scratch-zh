# Regresión logística

> La regresión logística se convertirá en una línea recta en una curva S, con probabilidad responderá a la pregunta de si o no.

**类型：**Construir
**语言：**Python
**先修要求：**Fase 2 Lección 1-2 (Qué es ML, Regresión Lineal)
**时间：**90 minutos

## El objetivo del aprendizaje

- Utilización de la función sigmoide y pérdida de entropía cruzada binaria desde el zero para lograr la regresión logística
- 計算并解释二进制分类 中的精度、回忆、F1 puntuación 和混亂矩阵
-  Explicar por qué MSE no encaja en la clasificación, y por qué la entropía binaria cruzada generará una superficie de costos convexa
- Construir para la clasificación de clases múltiples de modelado de regresión de softmax,并 evaluar el equilibrio del umbral

##  problemas

Usted piensa según el tumor tamaño pronóstico es maligno o benigno. Usted intenta usar regresión lineal. Se producirá 0.3、1.7 o -0.5 números de este tipo. ¿Qué significan estos números?1.7 ¿es  muy maligno??-0.5  muy benigno?

La regresión logística  resolvió este problema― utiliza el mismo conjunto de líneas (wx + b), luego a través de la función sigmoide, se comprimirá cualquier número a (0, 1) 范围内―输出就是概率―.

Es uno de los algoritmos más amplios utilizados en la práctica. Aunque el nombre de la regresión, la regresión logística es un algoritmo de clasificación, no un algoritmo de regresión.

## 核心概念 核心概念 核心概念 核心概念

### ¿Por qué la Regresión Lineal no es adecuada para la Clasificación

假设根据学习时长预测通过/未通过(1/0)。Regressión lineal 会拟合一条穿过数据的直线:

```
hours:  1   2   3   4   5   6   7   8   9   10
actual: 0   0   0   0   1   1   1   1   1   1
```

线性拟合可能会在第1 小时给出 -0.2,在第10 小时给出 1.3── tales valores no son probabilidades── ellos serán inferiores a 0, también serán superiores a 1── peor aún, un esquizofrenia (por ejemplo, alguien aprendió 50 horas) arrastra toda la línea directa, cambiando la predicción de los propietarios──

Clasificación  necesita una función satisfactoria de las siguientes condiciones:
- 输出 0 hasta 1   entre el valor (la probabilidad)
- 产生清晰的转变 (Líneas de decisión)
- No estarán lejos de los límites de los cambios

### Función sigmóide

La función sigmoide está haciendo esto:

```
sigmoid(z) = 1 / (1 + e^(-z))
```

Sexualidad:
- Cuando z es un gran número de veces, sigmoid(z)  casi 1
- Cuando z es un gran número negativo, sigmoid(z)  casi 0
- Cuando z = 0 时,sigmoid(z) = 0,5
- 输出始终位于 0 y 1 之间
- La función está en forma plana y fácil

Su derivada tiene una forma muy fácil: sigmoid'(z) = sigmoid(z) * (1 - sigmoid(z))

### Regresión logística = Modelo lineal + sigmoide

模型先计算 z = wx + b( con regresión lineal 相同), luego aplicar sigmoide:

```mermaid
flowchart LR
    X[Input features x] --> L["Linear: z = wx + b"]
    L --> S["Sigmoid: p = 1/(1+e^-z)"]
    S --> D{"p >= 0.5?"}
    D -->|Yes| P[Predict 1]
    D -->|No| N[Predict 0]
```

输出 p Explicado como P  y = 1  x), es decir, la probabilidad de entrada pertenece a la clase 1   decisión límite  se encuentra en la posición de wx + b = 0, en este momento sigmoide 输出恰好为 0.5 

### Perdida de entropía cruzada binaria

En la regresión logística, el uso de MSE se produce en una superficie de costes no elevadora, existen muchos mínimos locales.

```
Loss = -(1/n) * sum(y * log(p) + (1-y) * log(1-p))
```

¿Por qué es efectivo?
- Cuando y=1 y p 接近 1 时:log(1) = 0, por lo tanto, la pérdida 接近 0(正确,低成本)
- Cuando y=1 y p 接近 0 时:log(0) 接近负无穷, por lo tanto pérdida 很大(错误,高成本)
- Cuando y=0 y p 接近 0 时:log(1) = 0, por lo tanto la pérdida 接近 0(正确,低成本)
- Cuando y=0 y p 接近 1 时:log(0) 接近负无穷, por lo tanto pérdida 很大(错误,高成本)

 Para la regresión logística, esta función de pérdida es de forma simbólica, por lo que garantiza sólo un mínimo global

### Descenso gradual de la regresión logística

sigmoide 搭配 binaria entropía cruzada 时,Gradiente 具有简洁形式:

```
dL/dw = (1/n) * sum((p - y) * x)
dL/db = (1/n) * sum(p - y)
```

Se ven como un gradiente de regresión lineal 完全相同──区别在于p = sigmoid(wx + b), en lugar de p = wx + b──sigmoid 引入非线性,但 gradient 更新规则保持不变──

```mermaid
flowchart TD
    A[Initialize w=0, b=0] --> B[Forward pass: z = wx+b, p = sigmoid z]
    B --> C[Compute loss: binary cross-entropy]
    C --> D["Compute gradients: dw = (1/n) * sum((p-y)*x)"]
    D --> E[Update: w = w - lr*dw, b = b - lr*db]
    E --> F{Converged?}
    F -->|No| B
    F -->|Yes| G[Model trained]
```

### Limite de decisión

对于2D 输入((两个 características), el límite de decisión es satisfacer las siguientes condiciones:

```
w1*x1 + w2*x2 + b = 0
```

Un lado de los puntos es clasificado como 1, el otro lado de los puntos es clasificado como 0―La regresión lógica 总是产生线性的 decisión límite―Si se necesita 曲的边界,要么添加多项的特征,要么使用非线性模型―

### Utiliza Softmax  realizar Clasificación de clases múltiples

Regresión logística binaria 处理两个类──对于 k 个类,使用软max函数:

```
softmax(z_i) = e^(z_i) / sum(e^(z_j) for all j)
```

Cada clase tiene su propio vector de peso. El modelo para cada clase calcula una puntuación z_i, luego la softmax se convierte en probabilidad total y de 1 . La clase de predicción es la clase con mayor probabilidad.

Función de pérdida 变为 entropía cruzada categórica:

```
Loss = -(1/n) * sum(sum(y_k * log(p_k)))
```

Entre ellos y_k para la clase verdadera 为 1, para todas las demás clases 为 0(un codificación caliente)

### Metricas de evaluación

Sólo con precisión no es suficiente para un conjunto de datos de 95% negativo 5% positivo, un modelo de predicción negativa puede obtener 95% de precisión, pero sin ningún uso

**Confusion Matrix**¿Qué es esto ?

| | Predicted Positive | Predicted Negative |
|---|---|---|
| Actually Positive | True Positive (TP) | False Negative (FN) |
| Actually Negative | False Positive (FP) | True Negative (TN) |

**Precision**En todos los ejemplos de predicciones positivas, ¿cuántos son positivos?
```
Precision = TP / (TP + FP)
```

**Recall**(Sensibilidad): En todos los ejemplos positivos reales, ¿cuánto hemos capturado?
```
Recall = TP / (TP + FN)
```

**F1 Score**:precisión y media armónica de recuerdo.
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

 prioridades de la situación:
- **Precision**Cuando se encuentran falsos resultados, el filtro de spam, tu no quieres bloquear el correo electrónico legítimo)
- **Recall**Cuando los falsos negativos se registran, no se espera que se pierda el tumor.
- **F1**Cuando necesitas un equilibrio de una sola métrica


```figure
logistic-sigmoid
```

## Construirlo

### Paso 1: Función sigmóide y generación de datos

```python
import random
import math

def sigmoid(z):
    z = max(-500, min(500, z))
    return 1.0 / (1.0 + math.exp(-z))


random.seed(42)
N = 200
X = []
y = []

for _ in range(N // 2):
    X.append([random.gauss(2, 1), random.gauss(2, 1)])
    y.append(0)

for _ in range(N // 2):
    X.append([random.gauss(5, 1), random.gauss(5, 1)])
    y.append(1)

combined = list(zip(X, y))
random.shuffle(combined)
X, y = zip(*combined)
X = list(X)
y = list(y)

print(f"Generated {N} samples (2 classes, 2 features)")
print(f"Class 0 center: (2, 2), Class 1 center: (5, 5)")
print(f"First 5 samples:")
for i in range(5):
    print(f"  Features: [{X[i][0]:.2f}, {X[i][1]:.2f}], Label: {y[i]}")
```

### Paso 2: Logística de regreso desde cero

```python
class LogisticRegression:
    def __init__(self, n_features, learning_rate=0.01):
        self.weights = [0.0] * n_features
        self.bias = 0.0
        self.lr = learning_rate
        self.loss_history = []

    def predict_proba(self, x):
        z = sum(w * xi for w, xi in zip(self.weights, x)) + self.bias
        return sigmoid(z)

    def predict(self, x, threshold=0.5):
        return 1 if self.predict_proba(x) >= threshold else 0

    def compute_loss(self, X, y):
        n = len(y)
        total = 0.0
        for i in range(n):
            p = self.predict_proba(X[i])
            p = max(1e-15, min(1 - 1e-15, p))
            total += y[i] * math.log(p) + (1 - y[i]) * math.log(1 - p)
        return -total / n

    def fit(self, X, y, epochs=1000, print_every=200):
        n = len(y)
        n_features = len(X[0])
        for epoch in range(epochs):
            dw = [0.0] * n_features
            db = 0.0
            for i in range(n):
                p = self.predict_proba(X[i])
                error = p - y[i]
                for j in range(n_features):
                    dw[j] += error * X[i][j]
                db += error
            for j in range(n_features):
                self.weights[j] -= self.lr * (dw[j] / n)
            self.bias -= self.lr * (db / n)
            loss = self.compute_loss(X, y)
            self.loss_history.append(loss)
            if epoch % print_every == 0:
                print(f"  Epoch {epoch:4d} | Loss: {loss:.4f} | w: [{self.weights[0]:.3f}, {self.weights[1]:.3f}] | b: {self.bias:.3f}")
        return self

    def accuracy(self, X, y):
        correct = sum(1 for i in range(len(y)) if self.predict(X[i]) == y[i])
        return correct / len(y)


split = int(0.8 * N)
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]

print("\n=== Training Logistic Regression ===")
model = LogisticRegression(n_features=2, learning_rate=0.1)
model.fit(X_train, y_train, epochs=1000, print_every=200)

print(f"\nTrain accuracy: {model.accuracy(X_train, y_train):.4f}")
print(f"Test accuracy:  {model.accuracy(X_test, y_test):.4f}")
print(f"Weights: [{model.weights[0]:.4f}, {model.weights[1]:.4f}]")
print(f"Bias: {model.bias:.4f}")
```

### Paso 3: Desde el zero lograr la matriz de confusión y las métricas

```python
class ClassificationMetrics:
    def __init__(self, y_true, y_pred):
        self.tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
        self.tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
        self.fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
        self.fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)

    def accuracy(self):
        total = self.tp + self.tn + self.fp + self.fn
        return (self.tp + self.tn) / total if total > 0 else 0

    def precision(self):
        denom = self.tp + self.fp
        return self.tp / denom if denom > 0 else 0

    def recall(self):
        denom = self.tp + self.fn
        return self.tp / denom if denom > 0 else 0

    def f1(self):
        p = self.precision()
        r = self.recall()
        return 2 * p * r / (p + r) if (p + r) > 0 else 0

    def print_confusion_matrix(self):
        print(f"\n  Confusion Matrix:")
        print(f"                  Predicted")
        print(f"                  Pos   Neg")
        print(f"  Actual Pos     {self.tp:4d}  {self.fn:4d}")
        print(f"  Actual Neg     {self.fp:4d}  {self.tn:4d}")

    def print_report(self):
        self.print_confusion_matrix()
        print(f"\n  Accuracy:  {self.accuracy():.4f}")
        print(f"  Precision: {self.precision():.4f}")
        print(f"  Recall:    {self.recall():.4f}")
        print(f"  F1 Score:  {self.f1():.4f}")


y_pred_test = [model.predict(x) for x in X_test]
print("\n=== Classification Report (Test Set) ===")
metrics = ClassificationMetrics(y_test, y_pred_test)
metrics.print_report()
```

### Paso 4: Frontera de la decisión  análisis

```python
print("\n=== Decision Boundary ===")
w1, w2 = model.weights
b = model.bias
print(f"Decision boundary: {w1:.4f}*x1 + {w2:.4f}*x2 + {b:.4f} = 0")
if abs(w2) > 1e-10:
    print(f"Solved for x2:     x2 = {-w1/w2:.4f}*x1 + {-b/w2:.4f}")

print("\nSample predictions near the boundary:")
test_points = [
    [3.0, 3.0],
    [3.5, 3.5],
    [4.0, 4.0],
    [2.5, 2.5],
    [5.0, 5.0],
]
for point in test_points:
    prob = model.predict_proba(point)
    pred = model.predict(point)
    print(f"  [{point[0]}, {point[1]}] -> prob={prob:.4f}, class={pred}")
```

### Paso 5: Utiliza softmax  procesamiento de múltiples clases

```python
class SoftmaxRegression:
    def __init__(self, n_features, n_classes, learning_rate=0.01):
        self.n_features = n_features
        self.n_classes = n_classes
        self.lr = learning_rate
        self.weights = [[0.0] * n_features for _ in range(n_classes)]
        self.biases = [0.0] * n_classes

    def softmax(self, scores):
        max_score = max(scores)
        exp_scores = [math.exp(s - max_score) for s in scores]
        total = sum(exp_scores)
        return [e / total for e in exp_scores]

    def predict_proba(self, x):
        scores = [
            sum(self.weights[k][j] * x[j] for j in range(self.n_features)) + self.biases[k]
            for k in range(self.n_classes)
        ]
        return self.softmax(scores)

    def predict(self, x):
        probs = self.predict_proba(x)
        return probs.index(max(probs))

    def fit(self, X, y, epochs=1000, print_every=200):
        n = len(y)
        for epoch in range(epochs):
            grad_w = [[0.0] * self.n_features for _ in range(self.n_classes)]
            grad_b = [0.0] * self.n_classes
            total_loss = 0.0
            for i in range(n):
                probs = self.predict_proba(X[i])
                for k in range(self.n_classes):
                    target = 1.0 if y[i] == k else 0.0
                    error = probs[k] - target
                    for j in range(self.n_features):
                        grad_w[k][j] += error * X[i][j]
                    grad_b[k] += error
                true_prob = max(probs[y[i]], 1e-15)
                total_loss -= math.log(true_prob)
            for k in range(self.n_classes):
                for j in range(self.n_features):
                    self.weights[k][j] -= self.lr * (grad_w[k][j] / n)
                self.biases[k] -= self.lr * (grad_b[k] / n)
            if epoch % print_every == 0:
                print(f"  Epoch {epoch:4d} | Loss: {total_loss / n:.4f}")
        return self

    def accuracy(self, X, y):
        correct = sum(1 for i in range(len(y)) if self.predict(X[i]) == y[i])
        return correct / len(y)


random.seed(42)
X_3class = []
y_3class = []

centers = [(1, 1), (5, 1), (3, 5)]
for label, (cx, cy) in enumerate(centers):
    for _ in range(50):
        X_3class.append([random.gauss(cx, 0.8), random.gauss(cy, 0.8)])
        y_3class.append(label)

combined = list(zip(X_3class, y_3class))
random.shuffle(combined)
X_3class, y_3class = zip(*combined)
X_3class = list(X_3class)
y_3class = list(y_3class)

split_3 = int(0.8 * len(X_3class))
X_train_3 = X_3class[:split_3]
y_train_3 = y_3class[:split_3]
X_test_3 = X_3class[split_3:]
y_test_3 = y_3class[split_3:]

print("\n=== Multi-class Softmax Regression (3 classes) ===")
softmax_model = SoftmaxRegression(n_features=2, n_classes=3, learning_rate=0.1)
softmax_model.fit(X_train_3, y_train_3, epochs=1000, print_every=200)
print(f"\nTrain accuracy: {softmax_model.accuracy(X_train_3, y_train_3):.4f}")
print(f"Test accuracy:  {softmax_model.accuracy(X_test_3, y_test_3):.4f}")

print("\nSample predictions:")
for i in range(5):
    probs = softmax_model.predict_proba(X_test_3[i])
    pred = softmax_model.predict(X_test_3[i])
    print(f"  True: {y_test_3[i]}, Predicted: {pred}, Probs: [{', '.join(f'{p:.3f}' for p in probs)}]")
```

### Paso 6: La regulación del umbral

```python
print("\n=== Threshold Tuning ===")
print("Default threshold: 0.5. Adjusting the threshold trades precision for recall.\n")

thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
print(f"{'Threshold':>10} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
print("-" * 52)

for t in thresholds:
    y_pred_t = [1 if model.predict_proba(x) >= t else 0 for x in X_test]
    m = ClassificationMetrics(y_test, y_pred_t)
    print(f"{t:>10.1f} {m.accuracy():>10.4f} {m.precision():>10.4f} {m.recall():>10.4f} {m.f1():>10.4f}")
```

## Usalo

Ahora, con un poco de aprendizaje, haz lo mismo.

```python
from sklearn.linear_model import LogisticRegression as SklearnLR
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import numpy as np

np.random.seed(42)
X_0 = np.random.randn(100, 2) + [2, 2]
X_1 = np.random.randn(100, 2) + [5, 5]
X_sk = np.vstack([X_0, X_1])
y_sk = np.array([0] * 100 + [1] * 100)

X_tr, X_te, y_tr, y_te = train_test_split(X_sk, y_sk, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_tr_sc = scaler.fit_transform(X_tr)
X_te_sc = scaler.transform(X_te)

lr = SklearnLR()
lr.fit(X_tr_sc, y_tr)
y_pred = lr.predict(X_te_sc)

print("=== Scikit-learn Logistic Regression ===")
print(f"Accuracy:  {accuracy_score(y_te, y_pred):.4f}")
print(f"Precision: {precision_score(y_te, y_pred):.4f}")
print(f"Recall:    {recall_score(y_te, y_pred):.4f}")
print(f"F1:        {f1_score(y_te, y_pred):.4f}")
print(f"\nConfusion Matrix:\n{confusion_matrix(y_te, y_pred)}")
print(f"\nClassification Report:\n{classification_report(y_te, y_pred)}")
```

Su implementación desde cero generará el mismo límite de decisión y métricas.

##  entregarlo

Encuentro de trabajo:
- `code/logistic_regression.py`- Regresión logística desde cero, que incluye métricas

##  ejercicios

1. 生成一个不是 linealmente separable conjunto de datos (例如两个同心圆) ―― entrenar la regresión logística 并观察它的失败──然后添加多项式特征(x1^2、x2^2、x1*x2)并再次训练──展示精度 得到提升──
2. Por el modelo de 3 clases softmax  lograr una matriz de confusión de múltiples clases ⋅ calcular la precisión por clase 和 recordar ⋅ ¿Cuál clase es la más difícil de clasificar?
3. Desde la construcción de la curva de ROC, desde 0 hasta 1 ∼ 100 valores de umbral, calcular la tasa positiva verdadera y la tasa positiva falsa, utilizar la regla trapezoidal  calcular la AUC, la zona debajo de la curva)

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Logistic regression | “用于 Classification 的 Regression” | 一个 linear model 后接 sigmoid function，用于输出 class probabilities |
| Sigmoid function | “S-curve” | function 1/(1+e^(-z))，将任意实数映射到 (0, 1) 范围 |
| Binary cross-entropy | “Log loss” | Loss Function -[y*log(p) + (1-y)*log(1-p)]，会严厉惩罚自信但错误的预测 |
| Decision boundary | “分界线” | 模型输出概率等于 0.5 的 surface，用于分隔 predicted classes |
| Softmax | “Multi-class sigmoid” | 将 scores 的 Vector 转换为总和为 1 的概率的 function |
| Precision | “选中的有多少是相关的” | TP / (TP + FP)，positive predictions 中实际为 positive 的比例 |
| Recall | “相关的有多少被选中” | TP / (TP + FN)，actual positives 中被模型正确识别的比例 |
| F1 score | “平衡 Accuracy” | precision 和 recall 的 harmonic mean：2*P*R / (P+R) |
| Confusion matrix | “错误分解” | 展示每个 class pair 的 TP、TN、FP、FN 计数的表格 |
| Threshold | “cutoff” | 超过该 probability value 时模型预测 class 1（默认 0.5，可调） |
| One-hot encoding | “类别的二进制列” | 将 class k 表示为一个 Vector：除位置 k 为 1 外，其余位置均为 0 |
| Categorical cross-entropy | “Multi-class log loss” | binary cross-entropy 到 k 个 classes 的扩展，使用 one-hot encoded labels |
