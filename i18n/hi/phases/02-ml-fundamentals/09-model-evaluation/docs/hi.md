# मॉडल मूल्यांकन

> एक मॉडल का अच्छा बुरा, इस पर निर्भर करता है कि आप इसे कैसे मापते हैं।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 1 ((संभाव्यता और वितरण, एमएल के लिए सांख्यिकी)
**Time:** ~90 分钟

## 学习目标

- शून्य से K-fold और stratified K-fold क्रॉस-वैलिडेशन को प्राप्त करने से,并解释为什么对不平衡数据的 stratification 很重要
- शून्य गणना सटीकता, याद करने, F1, AUC-ROC, तथा रिग्रेशन इंग्ज़ेड (MSE, RMSE, MAE, R-क्वायर)
- 解读 सीखने के वक्र, निदान मॉडल
- 识别常见评估错误, डेटा लीक, गलत मीट्रिक 选择, तथा परीक्षण सेट की दूषितता सहित

## 问题

आप एक मॉडल को प्रशिक्षित किया है. यह अपने डेटा पर 95% सटीकता तक पहुँच गया है. यह अच्छा है?

शायद अच्छा हो। शायद बुरा हो। यदि आपके डेटा का 95% एक ही वर्ग का है, तो एक हमेशा भविष्यवाणी करने वाला मॉडल इस वर्ग की 95% सटीकता भी प्राप्त कर सकता है, लेकिन यह पूरी तरह से उपयोग नहीं करता है। यदि आप अभ्यास में उपयोग किए गए डेटा के एक ही सेट पर मूल्यांकन करते हैं, तो 95% यह संख्या कोई मायने नहीं रखती है, क्योंकि मॉडल केवल उत्तर को याद करता है।

मॉडल मूल्यांकन ज्यादातर एमएल परियोजनाओं में गलत जगह है। गलत मीट्रिक मॉडल को अलग करने में मदद करेगी। यह अच्छा दिखता है। गलत विभाजन मॉडल को अलग करने में मदद करेगा।

## 概念

### ट्रेन, सत्यापन, परीक्षण

```mermaid
flowchart LR
    A[Full Dataset] --> B[Train Set 60-70%]
    A --> C[Validation Set 15-20%]
    A --> D[Test Set 15-20%]
    B --> E[Fit Model]
    E --> C
    C --> F[Tune Hyperparameters]
    F --> E
    F --> G[Final Model]
    G --> D
    D --> H[Report Performance]
```

तीन भाग, तीन प्रकार के उपयोगः

- **Training set**: मॉडल इन आंकड़ों से सीखिये। प्रशिक्षण के दौरान यह इन नमूनों को देखेगा।
- **Validation set**: हाइपरपरपैरामीटर को अनुकूलित करने के लिए, और कई मॉडलों के बीच चयन करने के लिए। मॉडल इन डेटा पर प्रशिक्षण नहीं करेगा, लेकिन आपके निर्णय इसके प्रभाव से प्रभावित होंगे।
- **Test set**: केवल अंतिम स्पर्श में एक बार, अंतिम प्रदर्शन की रिपोर्ट करने के लिए उपयोग किया जाता है। यदि आप परीक्षण प्रदर्शन को देखते हैं, तो फिर मॉडल को संशोधित करने के लिए, यह अब परीक्षण सेट नहीं है। यह दूसरा सत्यापन सेट बन गया है।

परीक्षण सेट आपके प्रतिरोधक है, रिपोर्ट के प्रदर्शन को सुनिश्चित करने के लिए, वास्तविक अप्रत्याशित डेटा पर प्रदर्शन मॉडल को प्रतिबिंबित करना।

### K-Fold क्रॉस-वैलिडेशन

 लघु डेटासेट के लिए, एक-एक ट्रेन/मान्यीकरण विभाजन, और अधिक शोर उत्पन्न अनुमानों के लिए, K-गुना क्रॉस-मान्यीकरण, सभी डेटा को प्रशिक्षण और मान्यकरण के लिए उपयोग किया जाएगाः

```mermaid
flowchart TB
    subgraph Fold1["Fold 1"]
        direction LR
        V1["Val"] --- T1a["Train"] --- T1b["Train"] --- T1c["Train"] --- T1d["Train"]
    end
    subgraph Fold2["Fold 2"]
        direction LR
        T2a["Train"] --- V2["Val"] --- T2b["Train"] --- T2c["Train"] --- T2d["Train"]
    end
    subgraph Fold3["Fold 3"]
        direction LR
        T3a["Train"] --- T3b["Train"] --- V3["Val"] --- T3c["Train"] --- T3d["Train"]
    end
    subgraph Fold4["Fold 4"]
        direction LR
        T4a["Train"] --- T4b["Train"] --- T4c["Train"] --- V4["Val"] --- T4d["Train"]
    end
    subgraph Fold5["Fold 5"]
        direction LR
        T5a["Train"] --- T5b["Train"] --- T5c["Train"] --- T5d["Train"] --- V5["Val"]
    end
    Fold1 --> R["Average scores"]
    Fold2 --> R
    Fold3 --> R
    Fold4 --> R
    Fold5 --> R
```

1. डेटा को K                                                                                                                                                                                                                                                              
2. प्रत्येक तह के लिए, K-1  तह में ऊपर प्रशिक्षण, और शेष तह ऊपर परीक्षण
3. के लिए सत्यापन स्कोर 求平均

K=5 या K=10 मानक चयन हैं। प्रत्येक डेटा बिंदु का उपयोग सत्यापन के लिए किया जाता है।

**Stratified K-fold**: प्रत्येक तह में वर्ग वितरण को बनाए रखें। यदि आपका डेटासेट 70% वर्ग ए और 30% वर्ग बी है, तो प्रत्येक तह लगभग समान अनुपात बनाए रखेगा। यह असंतुलित डेटासेट के लिए महत्वपूर्ण है, क्योंकि किसी भी समय विभाजन सभी अल्पसंख्यक नमूनों को एक तह में डाल सकता है।

### वर्गीकरण

**Confusion matrix**:基础──बाइनरी वर्गीकरण के लिएः

|  | Predicted Positive | Predicted Negative |
|--|---|---|
| Actually Positive | True Positive (TP) | False Negative (FN) |
| Actually Negative | False Positive (FP) | True Negative (TN) |

इस मैट्रिक्स से सभी अन्य संकेतकों को प्राप्त किया जा सकता हैः

- **Accuracy**= (TP + TN) / (TP + TN + FP + FN) ⋅ पूर्वानुमान सही अनुपात── जब कक्षाएं असंतुलित होती हैं तो गलत दिशा उत्पन्न होती है──
- **Precision**= टीपी / (टीपी + एफपी) ◊ सभी पूर्वानुमानों में से कितने वस्तुओं में सकारात्मक है?
- **Recall**(संवेदनशीलता) = टीपी / (टीपी + एफएन) ―― सभी वास्तविक सकारात्मकताओं में, हम कितने पकड़े हैं?
- **F1 score**= 2 * सटीकता * याद / (सटीकता + याद) ⋅ सटीकता 和 याद का सामंजस्यपूर्ण अर्थ──当二者都不明显更重要时, इसका उपयोग करने के लिए दोनों को संतुलित करें──
- **AUC-ROC**:रिसीवर ऑपरेटिंग कैरेक्टेरिस्टिक कर्व नीचे की सतह नीचे की सीमाओं में है। नीचे सही सकारात्मक दर और गलत सकारात्मक दर का चित्रण किया गया है। AUC = 0.5 का प्रदर्शन करता है।

### प्रतिगमन

- **MSE**(मीडियन स्क्वायर त्रुटि) = mean((y_true - y_pred) ^2) ⋅以平方方式惩罚大误差──对异值 敏感──
- **RMSE**(रूट मीड स्क्वायर त्रुटि) = sqrt(MSE)。 लक्ष्य चर के साथ 单位相同──比 MSE 更容易解释──
- **MAE**(Mean Absolute Error) = औसत                                                                                                                                                                                                                                                          
- **R-squared**= 1 - SS_res / SS_tot, जिसमें SS_res = योगफल(((y_true - y_pred) ^2),SS_tot = योगफल((((y_true - y_mean) ^2)。表示 मॉडल 解释了多少方差──R^2 = 1.0 表示完美──R^2 = 0.0 表示模型 并不比总是预测平均值更好──如果模型比预测均还差,R^2 可能为负──

### सीखने की वक्रता

प्रशिक्षण और सत्यापन स्कोर को आकार देने के लिए एक कार्य के रूप में तैयार किया गयाः

- **High bias（underfitting）**: दो खंभे कम स्कोर प्राप्त करते हैं।
- **High variance（overfitting）**प्रशिक्षण स्कोर  बहुत उच्च है, लेकिन सत्यापन स्कोर  बहुत कम है।

### सत्यापन वक्र

प्रशिक्षण और सत्यापन स्कोर को एक हाइपरमैटर के लिए तैयार करनाः

- 低复杂度时: दो स्कोर 都低(अयोग्य)
- 合适复杂度时: दो स्कोर उच्च और करीब थे
- उच्च जटिलता समय:प्रशिक्षण स्कोर  उच्च बनाए रखें, लेकिन सत्यापन स्कोर नीचे

अधिकतम हाइपरपरमैटर मूल्य सत्यापन स्कोर है जो शिखर मूल्य की स्थिति तक पहुंचता है।

### 常见评估错误

**Data leakage**: परीक्षण सेट से जानकारी के रिसाव से प्रशिक्षण तक 中── उदा: में विभाजित  पूर्व पूर्ण डेटा सेट फिट स्केलर, में समय श्रृंखला भविष्यवाणी में समाहित भविष्य डेटा, उपयोग लक्ष्य से उत्पन्न  ण से बाहर की सुविधा──始终先分割,再预处理──

**Class imbalance**:99% के लेनदेन वैध हैं, 1% धोखाधड़ी हैं। एक सामान्य पूर्वानुमान वैध  के मॉडल को 99% सटीकता प्राप्त होगी।

**Wrong metric**: यह ध्यान रखना चाहिए कि यादों को बेहतर ढंग से याद किया जाए, लेकिन सटीकता में सुधार किया जाए, या जब डेटा में गंभीर विकृति हो तो RMSE को बेहतर ढंग से RMSE में सुधार किया जाए।

**Not using stratified splits**: असंतुलित आंकड़ों के लिए, समय के साथ विभाजन हो सकता है कि अल्पसंख्यक नमूनों में सत्यापन को फटकारें  बहुत कम, जिससे असंतुलित अनुमान उत्पन्न हो।

**Testing too often**: प्रत्येक बार आप परीक्षण प्रदर्शन को देखते हैं और समायोजन करते हैं, तो सभी परीक्षण सेट के लिए अनुकूलित होते हैं।


```figure
precision-recall-threshold
```

##  इसे निर्माण

### 步骤 1: ट्रेन/मान्यीकरण/परीक्षण विभाजन

```python
import random
import math


def train_val_test_split(X, y, train_ratio=0.6, val_ratio=0.2, seed=42):
    random.seed(seed)
    n = len(X)
    indices = list(range(n))
    random.shuffle(indices)

    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    train_idx = indices[:train_end]
    val_idx = indices[train_end:val_end]
    test_idx = indices[val_end:]

    X_train = [X[i] for i in train_idx]
    y_train = [y[i] for i in train_idx]
    X_val = [X[i] for i in val_idx]
    y_val = [y[i] for i in val_idx]
    X_test = [X[i] for i in test_idx]
    y_test = [y[i] for i in test_idx]

    return X_train, y_train, X_val, y_val, X_test, y_test
```

### 第2 步:के-fold 和 स्तरीकृत के-fold क्रॉस-वैलिडेशन

```python
def kfold_split(n, k=5, seed=42):
    random.seed(seed)
    indices = list(range(n))
    random.shuffle(indices)

    fold_size = n // k
    folds = []

    for i in range(k):
        start = i * fold_size
        end = start + fold_size if i < k - 1 else n
        val_idx = indices[start:end]
        train_idx = indices[:start] + indices[end:]
        folds.append((train_idx, val_idx))

    return folds


def stratified_kfold_split(y, k=5, seed=42):
    random.seed(seed)

    class_indices = {}
    for i, label in enumerate(y):
        class_indices.setdefault(label, []).append(i)

    for label in class_indices:
        random.shuffle(class_indices[label])

    folds = [{"train": [], "val": []} for _ in range(k)]

    for label, indices in class_indices.items():
        fold_size = len(indices) // k
        for i in range(k):
            start = i * fold_size
            end = start + fold_size if i < k - 1 else len(indices)
            val_part = indices[start:end]
            train_part = indices[:start] + indices[end:]
            folds[i]["val"].extend(val_part)
            folds[i]["train"].extend(train_part)

    return [(f["train"], f["val"]) for f in folds]


def cross_validate(X, y, model_fn, k=5, metric_fn=None, stratified=False):
    n = len(X)

    if stratified:
        folds = stratified_kfold_split(y, k)
    else:
        folds = kfold_split(n, k)

    scores = []
    for train_idx, val_idx in folds:
        X_train = [X[i] for i in train_idx]
        y_train = [y[i] for i in train_idx]
        X_val = [X[i] for i in val_idx]
        y_val = [y[i] for i in val_idx]

        model = model_fn()
        model.fit(X_train, y_train)
        predictions = [model.predict(x) for x in X_val]

        if metric_fn:
            score = metric_fn(y_val, predictions)
        else:
            score = sum(1 for yt, yp in zip(y_val, predictions) if yt == yp) / len(y_val)
        scores.append(score)

    return scores
```

### 步骤 3: भ्रम मैट्रिक्स 和 वर्गीकरण सूचक

```python
def confusion_matrix(y_true, y_pred):
    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)
    return tp, tn, fp, fn


def accuracy(y_true, y_pred):
    tp, tn, fp, fn = confusion_matrix(y_true, y_pred)
    total = tp + tn + fp + fn
    return (tp + tn) / total if total > 0 else 0.0


def precision(y_true, y_pred):
    tp, tn, fp, fn = confusion_matrix(y_true, y_pred)
    return tp / (tp + fp) if (tp + fp) > 0 else 0.0


def recall(y_true, y_pred):
    tp, tn, fp, fn = confusion_matrix(y_true, y_pred)
    return tp / (tp + fn) if (tp + fn) > 0 else 0.0


def f1_score(y_true, y_pred):
    p = precision(y_true, y_pred)
    r = recall(y_true, y_pred)
    return 2 * p * r / (p + r) if (p + r) > 0 else 0.0


def roc_curve(y_true, y_scores):
    thresholds = sorted(set(y_scores), reverse=True)
    tpr_list = []
    fpr_list = []

    total_positives = sum(y_true)
    total_negatives = len(y_true) - total_positives

    for threshold in thresholds:
        y_pred = [1 if s >= threshold else 0 for s in y_scores]
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)

        tpr = tp / total_positives if total_positives > 0 else 0.0
        fpr = fp / total_negatives if total_negatives > 0 else 0.0

        tpr_list.append(tpr)
        fpr_list.append(fpr)

    return fpr_list, tpr_list, thresholds


def auc_roc(y_true, y_scores):
    fpr_list, tpr_list, _ = roc_curve(y_true, y_scores)

    pairs = sorted(zip(fpr_list, tpr_list))
    fpr_sorted = [p[0] for p in pairs]
    tpr_sorted = [p[1] for p in pairs]

    area = 0.0
    for i in range(1, len(fpr_sorted)):
        width = fpr_sorted[i] - fpr_sorted[i - 1]
        height = (tpr_sorted[i] + tpr_sorted[i - 1]) / 2
        area += width * height

    return area
```

### 步骤 4: प्रतिगमन

```python
def mse(y_true, y_pred):
    n = len(y_true)
    return sum((yt - yp) ** 2 for yt, yp in zip(y_true, y_pred)) / n


def rmse(y_true, y_pred):
    return math.sqrt(mse(y_true, y_pred))


def mae(y_true, y_pred):
    n = len(y_true)
    return sum(abs(yt - yp) for yt, yp in zip(y_true, y_pred)) / n


def r_squared(y_true, y_pred):
    mean_y = sum(y_true) / len(y_true)
    ss_res = sum((yt - yp) ** 2 for yt, yp in zip(y_true, y_pred))
    ss_tot = sum((yt - mean_y) ** 2 for yt in y_true)
    if ss_tot == 0:
        return 0.0
    return 1.0 - ss_res / ss_tot
```

### 步骤 5: सीखने के वक्र

```python
def learning_curve(X, y, model_fn, metric_fn, train_sizes=None, val_ratio=0.2, seed=42):
    random.seed(seed)
    n = len(X)
    indices = list(range(n))
    random.shuffle(indices)

    val_size = int(n * val_ratio)
    val_idx = indices[:val_size]
    pool_idx = indices[val_size:]

    X_val = [X[i] for i in val_idx]
    y_val = [y[i] for i in val_idx]

    if train_sizes is None:
        train_sizes = [int(len(pool_idx) * r) for r in [0.1, 0.2, 0.4, 0.6, 0.8, 1.0]]

    train_scores = []
    val_scores = []

    for size in train_sizes:
        subset = pool_idx[:size]
        X_train = [X[i] for i in subset]
        y_train = [y[i] for i in subset]

        model = model_fn()
        model.fit(X_train, y_train)

        train_pred = [model.predict(x) for x in X_train]
        val_pred = [model.predict(x) for x in X_val]

        train_scores.append(metric_fn(y_train, train_pred))
        val_scores.append(metric_fn(y_val, val_pred))

    return train_sizes, train_scores, val_scores
```

### 步骤 6: एक प्रयोग करने के लिए परीक्षण के लिए सरल वर्गीकरण, साथ ही साथ पूर्ण डेमो

```python
class SimpleLogistic:
    def __init__(self, lr=0.1, epochs=100):
        self.lr = lr
        self.epochs = epochs
        self.weights = None
        self.bias = 0.0

    def sigmoid(self, z):
        z = max(-500, min(500, z))
        return 1.0 / (1.0 + math.exp(-z))

    def fit(self, X, y):
        n_features = len(X[0])
        self.weights = [0.0] * n_features
        self.bias = 0.0

        for _ in range(self.epochs):
            for xi, yi in zip(X, y):
                z = sum(w * x for w, x in zip(self.weights, xi)) + self.bias
                pred = self.sigmoid(z)
                error = yi - pred
                for j in range(n_features):
                    self.weights[j] += self.lr * error * xi[j]
                self.bias += self.lr * error

    def predict_proba(self, x):
        z = sum(w * xi for w, xi in zip(self.weights, x)) + self.bias
        return self.sigmoid(z)

    def predict(self, x):
        return 1 if self.predict_proba(x) >= 0.5 else 0


class SimpleLinearRegression:
    def __init__(self, lr=0.001, epochs=200):
        self.lr = lr
        self.epochs = epochs
        self.weights = None
        self.bias = 0.0

    def fit(self, X, y):
        n_features = len(X[0])
        self.weights = [0.0] * n_features
        self.bias = 0.0
        n = len(X)

        for _ in range(self.epochs):
            for xi, yi in zip(X, y):
                pred = sum(w * x for w, x in zip(self.weights, xi)) + self.bias
                error = yi - pred
                for j in range(n_features):
                    self.weights[j] += self.lr * error * xi[j] / n
                self.bias += self.lr * error / n

    def predict(self, x):
        return sum(w * xi for w, xi in zip(self.weights, x)) + self.bias


def standardize(values):
    n = len(values)
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / n
    std = math.sqrt(var) if var > 0 else 1.0
    return [(v - mean) / std for v in values], mean, std


def make_classification_data(n=300, seed=42):
    random.seed(seed)
    X = []
    y = []
    for _ in range(n):
        x1 = random.gauss(0, 1)
        x2 = random.gauss(0, 1)
        label = 1 if (x1 + x2 + random.gauss(0, 0.5)) > 0 else 0
        X.append([x1, x2])
        y.append(label)
    return X, y


def make_regression_data(n=200, seed=42):
    random.seed(seed)
    X = []
    y = []
    for _ in range(n):
        x1 = random.uniform(0, 10)
        x2 = random.uniform(0, 5)
        target = 3 * x1 + 2 * x2 + random.gauss(0, 2)
        X.append([x1, x2])
        y.append(target)
    return X, y


def make_imbalanced_data(n=300, minority_ratio=0.05, seed=42):
    random.seed(seed)
    X = []
    y = []
    for _ in range(n):
        if random.random() < minority_ratio:
            x1 = random.gauss(3, 0.5)
            x2 = random.gauss(3, 0.5)
            label = 1
        else:
            x1 = random.gauss(0, 1)
            x2 = random.gauss(0, 1)
            label = 0
        X.append([x1, x2])
        y.append(label)
    return X, y


if __name__ == "__main__":
    X_clf, y_clf = make_classification_data(300)

    print("=== Train/Validation/Test Split ===")
    X_train, y_train, X_val, y_val, X_test, y_test = train_val_test_split(X_clf, y_clf)
    print(f"  Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    print(f"  Train class distribution: {sum(y_train)}/{len(y_train)} positive")
    print(f"  Val class distribution: {sum(y_val)}/{len(y_val)} positive")

    model = SimpleLogistic(lr=0.1, epochs=200)
    model.fit(X_train, y_train)

    print("\n=== Classification Metrics ===")
    y_pred = [model.predict(x) for x in X_test]
    tp, tn, fp, fn = confusion_matrix(y_test, y_pred)
    print(f"  Confusion matrix: TP={tp}, TN={tn}, FP={fp}, FN={fn}")
    print(f"  Accuracy:  {accuracy(y_test, y_pred):.4f}")
    print(f"  Precision: {precision(y_test, y_pred):.4f}")
    print(f"  Recall:    {recall(y_test, y_pred):.4f}")
    print(f"  F1 Score:  {f1_score(y_test, y_pred):.4f}")

    y_scores = [model.predict_proba(x) for x in X_test]
    auc = auc_roc(y_test, y_scores)
    print(f"  AUC-ROC:   {auc:.4f}")

    print("\n=== K-Fold Cross-Validation (K=5) ===")
    cv_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=200),
        k=5,
        metric_fn=accuracy,
    )
    mean_cv = sum(cv_scores) / len(cv_scores)
    std_cv = math.sqrt(sum((s - mean_cv) ** 2 for s in cv_scores) / len(cv_scores))
    print(f"  Fold scores: {[round(s, 4) for s in cv_scores]}")
    print(f"  Mean: {mean_cv:.4f} (+/- {std_cv:.4f})")

    print("\n=== Stratified K-Fold Cross-Validation (K=5) ===")
    strat_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=200),
        k=5,
        metric_fn=accuracy,
        stratified=True,
    )
    strat_mean = sum(strat_scores) / len(strat_scores)
    strat_std = math.sqrt(sum((s - strat_mean) ** 2 for s in strat_scores) / len(strat_scores))
    print(f"  Fold scores: {[round(s, 4) for s in strat_scores]}")
    print(f"  Mean: {strat_mean:.4f} (+/- {strat_std:.4f})")

    print("\n=== Imbalanced Data: Why Accuracy Lies ===")
    X_imb, y_imb = make_imbalanced_data(300, minority_ratio=0.05)
    positives = sum(y_imb)
    print(f"  Class distribution: {positives} positive, {len(y_imb) - positives} negative ({positives/len(y_imb)*100:.1f}% positive)")

    always_negative = [0] * len(y_imb)
    print(f"  Always-negative baseline:")
    print(f"    Accuracy:  {accuracy(y_imb, always_negative):.4f}")
    print(f"    Precision: {precision(y_imb, always_negative):.4f}")
    print(f"    Recall:    {recall(y_imb, always_negative):.4f}")
    print(f"    F1 Score:  {f1_score(y_imb, always_negative):.4f}")

    X_tr_i, y_tr_i, X_v_i, y_v_i, X_te_i, y_te_i = train_val_test_split(X_imb, y_imb)
    model_imb = SimpleLogistic(lr=0.5, epochs=500)
    model_imb.fit(X_tr_i, y_tr_i)
    y_pred_imb = [model_imb.predict(x) for x in X_te_i]
    print(f"\n  Trained model on imbalanced data:")
    print(f"    Accuracy:  {accuracy(y_te_i, y_pred_imb):.4f}")
    print(f"    Precision: {precision(y_te_i, y_pred_imb):.4f}")
    print(f"    Recall:    {recall(y_te_i, y_pred_imb):.4f}")
    print(f"    F1 Score:  {f1_score(y_te_i, y_pred_imb):.4f}")

    print("\n=== Regression Metrics ===")
    X_reg, y_reg = make_regression_data(200)

    col0 = [x[0] for x in X_reg]
    col1 = [x[1] for x in X_reg]
    col0_s, m0, s0 = standardize(col0)
    col1_s, m1, s1 = standardize(col1)
    X_reg_scaled = [[col0_s[i], col1_s[i]] for i in range(len(X_reg))]

    X_tr_r, y_tr_r, X_v_r, y_v_r, X_te_r, y_te_r = train_val_test_split(X_reg_scaled, y_reg)
    reg_model = SimpleLinearRegression(lr=0.01, epochs=500)
    reg_model.fit(X_tr_r, y_tr_r)
    y_pred_r = [reg_model.predict(x) for x in X_te_r]

    print(f"  MSE:       {mse(y_te_r, y_pred_r):.4f}")
    print(f"  RMSE:      {rmse(y_te_r, y_pred_r):.4f}")
    print(f"  MAE:       {mae(y_te_r, y_pred_r):.4f}")
    print(f"  R-squared: {r_squared(y_te_r, y_pred_r):.4f}")

    mean_baseline = [sum(y_tr_r) / len(y_tr_r)] * len(y_te_r)
    print(f"\n  Mean baseline:")
    print(f"    MSE:       {mse(y_te_r, mean_baseline):.4f}")
    print(f"    R-squared: {r_squared(y_te_r, mean_baseline):.4f}")

    print("\n=== Learning Curve ===")
    sizes, train_sc, val_sc = learning_curve(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=200),
        metric_fn=accuracy,
    )
    print(f"  {'Size':>6} {'Train':>8} {'Val':>8}")
    for s, tr, va in zip(sizes, train_sc, val_sc):
        print(f"  {s:>6} {tr:>8.4f} {va:>8.4f}")

    print("\n=== Statistical Model Comparison ===")
    model_a_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=100),
        k=5, metric_fn=accuracy,
    )
    model_b_scores = cross_validate(
        X_clf, y_clf,
        model_fn=lambda: SimpleLogistic(lr=0.1, epochs=500),
        k=5, metric_fn=accuracy,
    )
    diffs = [a - b for a, b in zip(model_a_scores, model_b_scores)]
    mean_diff = sum(diffs) / len(diffs)
    std_diff = math.sqrt(sum((d - mean_diff) ** 2 for d in diffs) / len(diffs))
    t_stat = mean_diff / (std_diff / math.sqrt(len(diffs))) if std_diff > 0 else 0.0
    print(f"  Model A (100 epochs) mean: {sum(model_a_scores)/len(model_a_scores):.4f}")
    print(f"  Model B (500 epochs) mean: {sum(model_b_scores)/len(model_b_scores):.4f}")
    print(f"  Mean difference: {mean_diff:.4f}")
    print(f"  Paired t-statistic: {t_stat:.4f}")
    print(f"  (|t| > 2.78 for significance at p<0.05 with df=4)")
```

## इसका उपयोग करें

उपयोग करें छोटे-लर्निंग 时, मूल्यांकन 已经内置在工作流中:

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold, learning_curve
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error, r2_score,
)
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
scores = cross_val_score(model, X, y, cv=StratifiedKFold(5), scoring="f1")
```

शून्य से कार्यान्वयन के संस्करण स्पष्ट रूप से क्रॉस-वैलिडेशन को प्रदर्शित करेंगे।

## 交付 यह

本课会产出:
- `outputs/skill-evaluation.md`- एक कवर वर्गीकरण और प्रतिगमन मॉडल  मूल्यांकन रणनीति कौशल

## अभ्यास

1. 实现精度回忆曲线:在不同门值下绘制精度与回忆――计算平均精度(PR曲线下面积) ――在不平衡数据集上比较PR曲线和ROC曲线上,并解释什么时候哪个有更多信息量──
2. निस्ट्ड क्रॉस-वैलिडेशन लूप बनाएंः बाहरी स्तर लूप मूडल प्रदर्शन का आकलन करें, आंतरिक स्तर लूप हुपरपैरामीटर को अनुकूलित करें。 इसका उपयोग दो मॉडलों की तुलना में करें, वैलिडेशन डेटा को बाहर निकालने से बचें मूल्यांकन में प्रवेश करना──
3. 实现用于模型比较的变化测试:打乱标签、重新训练并衡量性能──重复 100 次构建零分布──计算观察模型性能相对这个分布的p-值──

## 关键术语

| Term | 人们通常怎么说 | 它实际是什么意思 |
|------|----------------|----------------------|
| Overfitting | “记住了 training data” | model 捕捉了 training data 中的噪声，在 training 上表现好，但在 unseen data 上表现差 |
| Cross-validation | “在不同子集上测试” | 系统地轮换用于 validation 的数据部分，并对所有轮换的结果求平均 |
| Precision | “预测为 positive 的里面有多少是正确的” | TP / (TP + FP)：positive predictions 中实际为 positive 的比例 |
| Recall | “我们找到了多少真实 positives” | TP / (TP + FN)：actual positives 中被正确识别出来的比例 |
| AUC-ROC | “model 区分类别的能力有多好” | 在所有 thresholds 下，true positive rate 与 false positive rate 曲线下的面积，范围从 0.5（随机）到 1.0（完美） |
| R-squared | “解释了多少方差” | 1 -（squared residuals 之和 / total sum of squares）：model 捕捉到的 target variance 比例 |
| Data leakage | “model 作弊了” | 在 training 期间使用了 prediction time 不可用的信息，导致 evaluation 过于乐观 |
| Learning curve | “数据更多时 performance 如何变化” | training 和 validation scores 相对于 training set size 的图，用来揭示 underfitting 或 overfitting |
| Stratified split | “保持 class ratios 平衡” | split 数据时，让每个 subset 中各 class 的比例与完整 dataset 相同 |

## 延伸阅读

- [scikit-learn Model Selection Guide](https://scikit-learn.org/stable/model_selection.html)-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- [Beyond Accuracy: Precision and Recall (Google ML Crash Course)](https://developers.google.com/machine-learning/crash-course/classification/precision-and-recall)- 带交互示例的清晰解释
- [A Survey of Cross-Validation Procedures (Arlot & Celisse, 2010)](https://projecteuclid.org/journals/statistics-surveys/volume-4/issue-none/A-survey-of-cross-validation-procedures-for-model-selection/10.1214/09-SS054.full)- विभिन्न सीवी रणनीति पर कब और क्यों प्रभावी होगी, इसकी सख्त चर्चा
