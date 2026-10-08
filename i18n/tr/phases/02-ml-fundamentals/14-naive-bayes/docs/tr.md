# Saçma Bayes

> naive 假设是错误的,但它仍然有效──这是它的美妙之处──

**Type:** Build
**Language:**Python
**先修要求：**Eğitimler 01-07
**Time:** ~75 分钟

## Öğrenme hedefi
- From零实现带 Laplace smoothing 的 Multinomial Naive Bayes, metin sınıflandırması için kullanılır
- Neden saf bağımsızlık varsayımı matematikte yanlış ama pratikte doğru sınıflandırma üretilebilir
- तुलना Multinomial、Bernoulli 和 Gaussian Naive Bayes 变体,并为给定特征类型选择合适的版本
- Yüksek seviyede nadir veriler üzerinde Naive Bayes ile lojistik gerileme karşılığı değerlendirmek ve bunların rol oynadığı önyargı-varians ticaretini açıklamak

## 问题
Metni sınıflandırmak gerekir. Postaları spam veya spam olmayan olarak ayırmak. Müşteri yorumlarını olumlu veya olumsuz olarak ayırmak. İşlemleri farklı sınıflara ayırmak.

Büyük çoğunluk burada yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleşik olarak yerleş

Naive Bayes bu durumu ele alabilir. Bu durum matematikte yanlış bir varsayım yapmıştır. Her özellik belirli sınıflardan sonra diğer tüm özelliklerle bağımsızdır. Ancak, metinde sınıflandırma sırasında, özellikle de küçük bir eğitim sırasında daha zeki olan modelleri aşmaya devam eder.

Bir yanlış varsaymanın neden iyi bir tahmin getirebileceğini anlamak, makine öğrenmesinin temel bir gerçeğini öğrenmenize yardımcı olacaktır: En iyi model en doğru model değil, veriye en iyi önyargılı değişkenlik ticareti olan modellerdir.

## 概念
### Bayes teoremi ((快速回顾)

Bayes teoremi 会反转条件概率:

```
P(class | features) = P(features | class) * P(class) / P(features)
```

Biz isteriz .`P(class | features)`Bu nedenle, bir belgeye ait bir sözcükün bir tür olasılığına sahip olması için, aşağıdaki birkaç sözcükten hesaplayabiliriz:
- `P(features | class)`Bu kelimelerin bu kategori dosyasında görme olasılığı:
- `P(class)`:类别的预先概率(总体上垃圾邮件 有多常见?)
- `P(features)`Tüm sınıflara göre de kanıtlar aynıdır, bu nedenle sınıfların karşılaştırılması göz ardı edilebilir.

`P(class | features)`En iyi sınıf kazanmak.

### Saçmacalı Bağımsızlık Dedikleri

精确计算 `P(features | class)`需要估计所有特征联合出现的共同概率──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Saçma varsayım: "Bütün özellikler şartlı olarak bağımsızdır".

```
P(w1, w2, ..., wn | class) = P(w1 | class) * P(w2 | class) * ... * P(wn | class)
```

Artık imkansız bir ortak dağılım tahmin etmiyorsunuz, ama basit bir n 个个特征分布的估计.

Bu varsayım açıkça yanlışdır. Hiçbir dosyadaki "makine" ve "öğrenme" bağımsız değildir. Ancak sınıflandırıcı doğru olasılık tahminine ihtiyaç duymaz. Doğru sıralama gerektirir. Yani hangi sınıfın en yüksek olasılık olduğu. Bağımsızlık varsayımı sistematik hatalar getirecektir. Ancak bu hatalar tüm sınıfları benzer şekilde etkileyecek, bu nedenle sıralama doğru kalır.

### Neden Hala Çalışıyor?

Üç neden:

1. **排序优先于校准。**Sınıflama sadece sıralama en yüksek sınıfı doğru olması gerekir. P(spam) = 0.99999, gerçek olasılığı ise 0.7, sınıflandırıcı hala doğruyu seçer.

2. **高 bias，低 variance。**Bağımsızlık varsayımı güçlü bir öncülüktir. Bu da aşırı uyumluluğu önler.

3. **特征冗余会相互抵消。**相关特征提供冗余证据――Classifier 会重复计算这些证据,但它也会为正确类别重复计算――如果"机器"和"学习"总是出现,它们都会为"技术"类提供证据――NB 会把它们计算两次,但它也会为正确类计算两次――

第四个实践原因:Naive Bayes 极快――训练只是单次遍历数据并统计频率――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘――预测是一个矩阵乘――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测是一个矩阵乘法――预测一个矩阵乘法――预测一个矩阵的数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量数量

### Matematika Adım Adım

让我们跟踪一个具体例――假设我们有两个类别:spam 和非spam――我们的词汇有三个词:"免费"",金钱"",会议"",

訓練データ:
- Spam 邮件 "be bedava" 80 kere, "para" 60 kere, "bir araya gelme" 10 kere, toplam 150 个词)
- Spam olmayan mesaj "be bedava" 5 kere, "para" 10 kere, "bir araya gelme" 100 kere, toplam 115 个词)
- %40'ın e-posta spam, %60'ın e-posta değil.

使用 Laplace düzeltme ((alpha=1):

```
P(free | spam)    = (80 + 1) / (150 + 3) = 81/153 = 0.529
P(money | spam)   = (60 + 1) / (150 + 3) = 61/153 = 0.399
P(meeting | spam) = (10 + 1) / (150 + 3) = 11/153 = 0.072

P(free | not-spam)    = (5 + 1) / (115 + 3) = 6/118 = 0.051
P(money | not-spam)   = (10 + 1) / (115 + 3) = 11/118 = 0.093
P(meeting | not-spam) = (100 + 1) / (115 + 3) = 101/118 = 0.856
```

Yeni posta içerir: "Özgür" ((2 次) 、"Para" ((1 次) 、"Toplantı" ((0 次) ✿

```
log P(spam | email) = log(0.4) + 2*log(0.529) + 1*log(0.399) + 0*log(0.072)
                    = -0.916 + 2*(-0.637) + (-0.919) + 0
                    = -3.109

log P(not-spam | email) = log(0.6) + 2*log(0.051) + 1*log(0.093) + 0*log(0.856)
                        = -0.511 + 2*(-2.976) + (-2.375) + 0
                        = -8.838
```

Spam 以很大优势胜出──"free" 出現两次是支持垃圾邮件的强证──注意, " toplantı " görünmeyen zamanlarda, iki log sum 之贡献都是零(0 * log(P)) 

### Üç Çeşit

Naive Bayes'in üç biçimi var. Her biri farklı bir şekilde inşa edilmektedir.`P(feature | class)`- Evet.

#### Çoklu isimler Naif Bayes

Bu özellikler, TF-IDF değerinin metin verilerine en uygun özellikler için kullanılır.

```
P(word_i | class) = (count of word_i in class + alpha) / (total words in class + alpha * vocab_size)
```

`alpha`Bu değişim, metin sınıflandırması 的主力。

#### Gaussian Naive Bayes

Her bir özellik düzenli olarak dağıtılacak.

```
P(x_i | class) = (1 / sqrt(2 * pi * var)) * exp(-(x_i - mean)^2 / (2 * var))
```

Her sınıfın her bir özelliğin kendi ortalama değerine ve farklılığına sahip olacaktır.

#### Bernoulli Naive Bayes

Bu özelliklerin her biri iki değer değişkenliği olarak belirlenir.

```
P(word_i | class) = (docs in class containing word_i + alpha) / (total docs in class + 2 * alpha)
```

Bir çok kelimeyle aynı değil, Bernouli bir kelime eksikliğini açıkça cezalandırır. Eğer "özgür" genellikle spam'de görünürse, ama bu e-postada bulunmazsa, Bernouli onu spam'a karşı kanıt olarak görür.

### Her Bir Variantı Ne Zaman Kullanmalıyız?

| Variant | Feature Type | Best For | Example |
|---------|-------------|----------|---------|
| Multinomial | 计数或频率 | 文本 classification、bag-of-words | Email spam、topic classification |
| Gaussian | 连续值 | 具有近似正态特征的表格数据 | Iris classification、传感器数据 |
| Bernoulli | 二值（0/1） | 短文本、二值特征 Vector | SMS spam、presence/absence features |

### Laplace Düzeltme

Eğer test verilerinde bir kelime ortaya çıkarsa, ama eğitim verilerinin belirli bir kategorisinde hiç ortaya çıkmazsa, ne olur?

没有 smoothing:`P(word | class) = 0/N = 0`Bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan sonra, bir sıfırdan, bir sıfırdan, bir sıfırdan, bir sıfırdan,`P(class | features) = 0`Diğer kanıtlar ne olursa olsun, çok güçlü bir kelime tüm tahminleri yok eder.

Her bir özellikle bir küçük sayı da beraber olacak .`alpha`(genellikle 1):

```
P(word_i | class) = (count(word_i, class) + alpha) / (total_words_in_class + alpha * vocab_size)
```

Alfa=1'de her kelime en az bir küçük olasılıkla oluşur. Test postalarında "discombobulate" oluşur.

Daha yüksek alfa daha güçlü bir düzeltme anlamına gelir.

alfa'nın etkisi:

| Alpha | Effect | When to use |
|-------|--------|-------------|
| 0.001 | 几乎没有 smoothing，信任数据 | 非常大的训练集，预计不会有未见特征 |
| 0.1 | 轻度 smoothing | 大型训练集 |
| 1.0 | 标准 Laplace smoothing | 默认起点 |
| 10.0 | 重度 smoothing，会压平分布 | 非常小的训练集，预计有许多未见特征 |

### Log-Space Hesaplama

Yüzlerce olasılık çarpması (doğrusu 1) yüzen noktaların aşağı akışına yol açar. Gerçek değer çok küçük bir doğru sayısıysa bile, yüzen noktaların sayısı da sıfır olur.

Çözüm: log alanında çalış¬mak, √√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√

```
log P(class | x1, x2, ..., xn) = log P(class) + sum_i log P(xi | class)
```

Bu tahminleri nokta ürünü haline getirecektir:

```
log_scores = X @ log_feature_probs.T + log_class_priors
prediction = argmax(log_scores)
```

Matrix çarpımı, bu yüzden Bayes'in tahmininin nedeninin çok hızlı olması, tek katlı bir çizgi modeli ile aynı işlemdir.

### Naif Bayes vs. Logistik Geri Dönüş

Bu iki metin de bir metin sınıflandırıcısı olarak kullanılır.

| Aspect | Naive Bayes | Logistic Regression |
|--------|------------|-------------------|
| Type | Generative（建模 P(X\|Y)） | Discriminative（建模 P(Y\|X)） |
| Training | 统计频率 | 优化 Loss Function |
| Small data | 更好（强 prior 有帮助） | 更差（不足以估计权重） |
| Large data | 更差（错误假设会拖累） | 更好（更灵活的边界） |
| Features | 假设独立 | 能处理相关性 |
| Speed | 单次遍历，非常快 | 迭代优化 |
| Calibration | 概率较差 | 概率更好 |

経験法则: Naive Bayes'ten başlayın. Eğer yeterli veri varsa ve NB'ye girerek platform期'a geçirseniz, lojistik geri dönüşe geçin.

### Sınıflandırma boru hattı

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

實踐中,我們在木欄空間中工作,以避免浮點下流──我們不再相乘許多小概率,而是相加他們的對數:

```
log P(class | features) = log P(class) + sum_i log P(feature_i | class)
```


```figure
naive-bayes
```

## Yapın onu.
`code/naive_bayes.py`Orta kod, MultinomialNB ve GaussianNB'yi sıfırdan gerçekleştirdi.

### Çoklu isimNB

0'dan gerçekleştirilmek:

1. **fit(X, y)**: için her sınıf,统计每个特征的频率──加入拉普拉斯平调──计算日志概率──存储类的先例──类别频率的日志)──

2. **predict_log_proba(X)**: için her örnek, hesap tüm sınıflar log P(sınıf) + log P(kaynak_i ≠sınıf) ∞

3. **predict(X)**: Geri dön log olasılığı en yüksek sınıfı

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

关键洞察:拟合后,预测只是矩阵乘加上偏见――这是天真贝斯的原因――

### GaussianNB

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

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

预测会对每个特征使用高斯语 PDF,并跨特征相乘(在日志空间中相加)

### Demo: Metin sınıflandırması

代码会生成合成袋-of-words 数据,模拟两个类别(teknoloji makaleler ve spor makaleleri) ・・・ her sınıfın farklı kelimeler ve sıklık dağılımları vardır。

Sintez veri çalışma biçimi aşağıdakiler: 我们创建 200 个词(特征列) ――Sözler 0-39 技术文章中频率高、体育中频率低──Sözler 80-119 技术中频率高、体育中频率低──Sözler 40-79 技术中频率中等频率──Bu gerçek bir sahne oluşturur:

### Demo: Sürekli Özellikler

代码会生成类似的 Iris的数据(3 个类别、4 个特征、Gaussian clusters) ――GaussianNB, her sınıfın ortalama değer ve farklılıklarını sınıflandırmak için kullanmaktadır。 her sınıfın farklı merkezleri vardır.

代码还演示了:
- **Smoothing comparison：**farklı alfa değer antrenmanı kullanmak MultimomyalNB, 强度对准确率的影响的表现
- **Training size experiment：**Treyin verileri 20 numuneye kadar 1600 numuneye kadar büyüdüğünde, NB ısalı oranı nasıl yükseltildi.
- **Confusion matrix：**Her sınıfın hassasiyeti, hatırlamak ve F1 puanı, NB nerede yanlış olduğunu göstermek için kullanılır.

### Tahmin Hızı

Naive Bayes 预测 bir Matrix çarpımıdır.
- MultinomialNB:一次 Matrix çarpı (n x d) @ (d x k) = O(n * d * k)
- GaussianNB:n * k 次 Gaussian PDF 求值,每次覆盖 d 个特征 = O(n * d * k)

Her boyutta ikisi de doğaldır. KNN ile karşılaştırıldığında, RBF çekirdeğinin tüm eğitim noktalarının mesafesine kadar hesaplanması veya SVM ile birlikte çekirdeğin tüm destek vektörlerine karşı bir çekirdeğin değerlendirilmesi gerekir.

## Kullan
Kullanılırken, bu iki değişim aynı yöntemle kullanılır:

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB

gnb = GaussianNB()
gnb.fit(X_train, y_train)
print(f"GaussianNB accuracy: {gnb.score(X_test, y_test):.3f}")

mnb = MultinomialNB(alpha=1.0)
mnb.fit(X_train_counts, y_train)
print(f"MultinomialNB accuracy: {mnb.score(X_test_counts, y_test):.3f}")
```

Kullanıcılar için bir yazı sınıflandırması:

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

`naive_bayes.py`Ortalama kodlamalar aynı veriler üzerinde doğruluğunu doğrultmak için sıfırdan gerçekleştirilen ve kullanılan  ile karşılaştırılacaktır.

### TF-IDF, Naive Bayes ile

İlk kelimeler sayısı her kez ortaya çıkan her kelimenin aynı ağırlığa sahip olmasını sağlar. Ancak "the" 和 "is" gibi bu tip de sözcükler sıkça ortaya çıkar.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB(alpha=0.1)),
])
```

TF-IDF  değerleri negatif değildir, bu nedenle MultinomialNB ile birlikte kullanılabilir. TF-IDF + MultinomialNB'nin kombinasyonu metin sınıflandırması arasında en güçlü temel değerlerden biridir.

### Benzer şekilde,

对于短文本(tweets、SMS、chat messages),BernoulliNB 可能优于多边文本。短文本的词数量很低,因此多边文本依赖的频率信息噪音较大──BernoulliNB yalnızca kaygıların oluştuğunu veya yok oluşunu düşünüyor, bu kısa文本中更可靠──

```python
from sklearn.naive_bayes import BernoulliNB
from sklearn.feature_extraction.text import CountVectorizer

text_clf = Pipeline([
    ("vectorizer", CountVectorizer(binary=True)),
    ("classifier", BernoulliNB(alpha=1.0)),
])
```

CountVectorizer 中的 `binary=True`标志会将所有计数转换为0/1──没有它,BernoulliNB 仍能运行,但它看到的是并非为其设计的计数──

### Kalibrasyon NB Muhtemelenlikler

NB 概率校准很差──NB P(spam) = 0.95 时, gerçek olasılık 0.7 olabilir.

```python
from sklearn.calibration import CalibratedClassifierCV

calibrated_nb = CalibratedClassifierCV(MultinomialNB(), cv=5, method="sigmoid")
calibrated_nb.fit(X_train, y_train)
proba = calibrated_nb.predict_proba(X_test)
```

Bu, çapraz doğrulama yoluyla, NB'nin orijinal sayılarına göre bir lojistik geri dönüşe uygun olacaktır.

### Ortak Gotchas

1. **负特征值。**MultinomialNB  要求特征非负── Eğer negatif değeri varsa, örneğin bazı ayarlarda TF-IDF veya standartlaştırma sonrası özellikler), lütfen GaussianNB'yi değiştirin veya özellikleri düz değerlere taşıyın.

2. **零方差特征。**GaussianNB bir sınıfın bir özelliğinin farkı ise, olasılık hesaplama sorunu ortaya çıkar.

3. **类别不平衡。**Eğer %99'un e-postaları spam değilse, öncü P(spam değil) = 0.99 会非常强, o kadar ki olasılık kanıtlarını bastırmak için──手動設定クラス優先,または使用 sklearn 中のクラス_優先参数──

4. **特征缩放。**MultinomialNB ölçeklendirme gerektirmez. GaussianNB ayrıca ölçeklendirme gerektirmez.

## - Söyle.
Bu ders:
- `outputs/skill-naive-bayes-chooser.md`Doğru seçimi için kullanılacak bir karar verim becerisi
- `code/naive_bayes.py`Şimdiki durumlar:

### Naif Bayes Başarısız olduğunda

Bağımsızlık varsayımı yanlış düzenlemeyi (sadece yanlış olasılık değil) başlatırken, NB başarısız olacaktır.

1. **强特征交互。**Eğer sınıflar iki özelliklerin bir araya gelmesine bağlıysa ve herhangi bir tek özellik üzerinde değilse, NB'nin tamamen yanılmasına neden olur.

2. **高度相关且 evidence 相反的特征。**Eğer A özellikleri "spam" yönünde, B özellikleri "spam olmayan" yönünde, ancak A 和 B 完全相关 (bu özellikler aslında hep aynıdır), NB, gerçekte var olmayan çatışma kanıtlarını görecektir.

3. **非常大的训练集。**Eğer veri yeterince fazla olduğunda, lojistik gerileme gibi ayrımcılık modelleri gerçek karar sınırına kadar öğrenir ve NB'yi aşırır.

 Pratikte, metin sınıflandırması için, bu başarısızlık modları yaygın değildir. Metin özelliklerinin sayısı çok fazla. Tek özellikler daha zayıf, bağımsızlık varsayımının hataları genellikle birbirine karşı ödenir.

## 练习
1. **Smoothing experiment。**Metin verilerinde alfa değerinin 0.01、0.1、1.0、10.0 ve 100.0 kullanılması için çoklu değerler kullanılır.

2. **Feature independence test。**取一个真文本数据集. 选择两个明显相关的词 (机器) 和学习) 计算 P 字类 (P 字类) * P 字类 (P 字类),并与 P 字类 (P 字类) 比較 ⋅ bağımsızlık varsayımı 错得多严重?

3. **Bernoulli implementation。**扩展代码,添加一个BernoulliNB类──将包-of-words 转换为二值(present/absent),并文本数据上与多式NB比较精度──什么时候Bernoulli 会赢?

4. **NB vs Logistic Regression。**Yazılım verilerine göre iki kişiyi eğitmek için 100 tane eğitim örneği ile başlayan, yavaş yavaş 10.000 kişiye kadar büyütülmüştür.

5. **Spam filter。**构建一个完整的垃圾邮件分类器:tokenize 原始邮件文本、构建词汇、创建包-of-words features、训练多语数NB,并使用精度和回忆 评估(不只是精度为什么?)

## 关键术语
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
- [scikit-learn Naive Bayes docs](https://scikit-learn.org/stable/modules/naive_bayes.html) 三种变体 ve onun matematiksel ayrıntıları
- [McCallum and Nigam, A Comparison of Event Models for Naive Bayes Text Classification (1998)](https://www.cs.cmu.edu/~knigam/papers/multinomial-aaaiws98.pdf) 文本中 Multinomial ile Bernoulli'nin klasik karşılaştırması
- [Rennie et al., Tackling the Poor Assumptions of Naive Bayes Text Classifiers (2003)](https://people.csail.mit.edu/jrennie/papers/icml03-nb.pdf) 针对文本 NB 的改进
- [Ng and Jordan, On Discriminative vs. Generative Classifiers (2001)](https://ai.stanford.edu/~ang/papers/nips01-discriminativegenerative.pdf) 证明 NB  收 快于 LR  收 快于在数据较少时
