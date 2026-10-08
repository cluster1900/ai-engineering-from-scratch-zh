# Bayes ingênuo

> naive 假设是错误的, mas ainda é válido.

**Type:** Build
**Language:**Python
**先修要求：**Fase 2, lições 01-07 ((Classificação, teorema de Bayes)
**Time:** ~75 分钟

## Objectivo de aprendizagem
- Desde zero realizando com Laplace suavizando de Bayes Naívos Multinomial, para classificação de texto
- Explica por que a suposição ingênua de independência é errada matematicamente, mas ainda pode produzir uma classificação correta na prática.
- Comparar Multimônimo、Bernoulli 和 Gaussian Naive Bayes 变体,并为给定特征类型选择合适的版本
- Em alta altura de dados raros, será navio Bayes e regresso logístico  avaliar a comparação, e explicar o papel que desempenha na sua participação

## 问题
Você precisa classificar o texto. Você precisa dividir o e-mail em spam ou não-spam. Você precisa dividir os comentários dos clientes em positivos ou negativos. Você tem milhares de características em cada palavra, mas os dados de treinamento são limitados.

A regressão logística precisa de amostras suficientes para estimar com confiança milhares de milhões de pesos. Árvores de decisão são divididas por uma palavra e são gravemente superficiais.

Bayes ingênuo pode lidar com essa situação. Ele fez uma suposição matematicamente errada de que, após uma determinada classe, cada característica é independente de todas as outras características), mas na classificação do texto ainda pode superar os modelos mais inteligentes, especialmente em treinos em grupos menores de tempo.

Entender por que uma suposição errada pode trazer boas previsões, vai te ajudar a aprender um fato fundamental da aprendizagem de máquina: o melhor modelo não é o modelo mais correcto, mas o modelo que possui o melhor tradeoff de variação de preconceito em relação aos seus dados.

## 概念
### Teorema de Bayes (((快速回顾)

Teorema de Bayes 会反转条件概率:

```
P(class | features) = P(features | class) * P(class) / P(features)
```

Queremos .`P(class | features)`, é que, depois de um determinado documento, o documento pertence a uma categoria de probabilidade.
- `P(features | class)`: probabilidade de ver estas palavras no arquivo
- `P(class)`:类别: Previo probabilidade (((
- `P(features)`A evidência é a mesma para todas as categorias, portanto, a comparação das categorias pode ser ignorada.

`P(class | features)`A melhor classe de vitória.

### Suposição Ingênua de Independência

精确计算 `P(features | class)`需要估估所有特征联合出现的共同概率──对于包含10,000 词词的词汇,你需要估估2^10,000 种可能组合上的分布──不可能──

A suposição ingênua é: dado a classe determinada, cada característica é condicionalmente independente de.

```
P(w1, w2, ..., wn | class) = P(w1 | class) * P(w2 | class) * ... * P(wn | class)
```

Você não mais estima uma distribuição conjunta impossível, mas estima n 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个

Esta hipótese é obviamente errada. Em qualquer documento, a "máquina" e a "aprendizagem" não são independentes. Mas o classificador não precisa de uma estimativa de probabilidade correta.

### Por que ainda funciona

Três razões:

1. **排序优先于校准。**Classificação apenas precisa de classificação mais alta categoria correlacionada. Mesmo P(spam) = 0,99999, enquanto a probabilidade real é 0,7, o classificador ainda vai escolher o spam. Não precisamos de probabilidade correta.

2. **高 bias，低 variance。**A suposição de independência é um modelo de forte prioridade. É um modelo de forte força de restrição, para evitar o excesso de dados.

3. **特征冗余会相互抵消。**相关特征提供冗余证据――Classifier 会重复计算这些证据,但它也会为正确类别重复计算―― Se "máquina" e "aprendizagem" 总是出现一次,它们都会为"技术"类提供证据――NB 会把它们计算两次,但它是正确类别计算两次――

第四个实践原因:Naive Bayes 极快──训练只是单次遍历数据并统计频率──预测是一次矩阵乘法──你可以在几秒内用一百万文档完成训练──这种速度意味着你可以更快代、尝试更多特征集,并运行比慢速模型更多实验──

### A matemática passo a passo

让我们跟踪一个具体例――假设我们有两个类别:spam 和非spam――我们的词汇有三个词:"免费""",钱"",会议"","会议"","会议"","会议"","会议"","会议"","会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"",会议"", meeting"", meeting"", meeting"", meeting"", meeting"", meeting"", meeting"", meeting"", meeting", etc.

訓練資料:
- Spam 邮件 mencionou "gratuito" 80 vezes"",dinheiro" 60 vezes"",reunião" 10 vezes ((total 150 个词)
- Não-spam 邮件 mencionou "gratuito" 5 次、"dinheiro" 10 次、"reunião" 100 次(total 115 个词)
- 40% dos correio são spam, 60% não são spam.

Use Laplace suavizante ((alpha=1):

```
P(free | spam)    = (80 + 1) / (150 + 3) = 81/153 = 0.529
P(money | spam)   = (60 + 1) / (150 + 3) = 61/153 = 0.399
P(meeting | spam) = (10 + 1) / (150 + 3) = 11/153 = 0.072

P(free | not-spam)    = (5 + 1) / (115 + 3) = 6/118 = 0.051
P(money | not-spam)   = (10 + 1) / (115 + 3) = 11/118 = 0.093
P(meeting | not-spam) = (100 + 1) / (115 + 3) = 101/118 = 0.856
```

Novo post contém: "gratuito" (02 vezes)

```
log P(spam | email) = log(0.4) + 2*log(0.529) + 1*log(0.399) + 0*log(0.072)
                    = -0.916 + 2*(-0.637) + (-0.919) + 0
                    = -3.109

log P(not-spam | email) = log(0.6) + 2*log(0.051) + 1*log(0.093) + 0*log(0.856)
                        = -0.511 + 2*(-2.976) + (-2.375) + 0
                        = -8.838
```

Spam 以很大优势胜出──"livre" 出現两次是支持垃圾邮件的强证──注意, "reunião" não apareceu, quando as contribuições para duas logs sum são零(0 * logs(P))

### Três Variantes

Bayes ingênuo tem três formas. Cada uma delas é feita de uma maneira diferente.`P(feature | class)`- Não.

#### Bayes ingênuo multinômico

Classificar cada característica como um número.

```
P(word_i | class) = (count of word_i in class + alpha) / (total words in class + alpha * vocab_size)
```

`alpha`É o que é o Laplace (Liftilization) 

#### Gaussian Naive Bayes

A melhor forma de manter a sua qualidade é de manter a sua qualidade.

```
P(x_i | class) = (1 / sqrt(2 * pi * var)) * exp(-(x_i - mean)^2 / (2 * var))
```

Cada categoria tem seu próprio valor médio e diferença para cada característica. Quando as características dentro de cada categoria realmente se conformam com a curva de forma horária, esse método é muito eficaz.

#### Bernoulli Naive Bayes

将每个特征建模为二值变量 (出现或未出现) ⋅最适合短文本或二值特征矢量⋅

```
P(word_i | class) = (docs in class containing word_i + alpha) / (total docs in class + 2 * alpha)
```

Diferente do multinomial, Bernouli irá claramente castigar a falta de uma palavra. Se "livre" normalmente aparece no spam, mas não há nenhum email, Bernouli vai considerá-lo como evidência de oposição ao spam.

### Quando usar cada variante

| Variant | Feature Type | Best For | Example |
|---------|-------------|----------|---------|
| Multinomial | 计数或频率 | 文本 classification、bag-of-words | Email spam、topic classification |
| Gaussian | 连续值 | 具有近似正态特征的表格数据 | Iris classification、传感器数据 |
| Bernoulli | 二值（0/1） | 短文本、二值特征 Vector | SMS spam、presence/absence features |

### Laplace Smoothing

Se um termo aparecer nos dados de teste, mas nunca apareceu em uma categoria específica de dados de treinamento, o que acontece?

Não há suavidade:`P(word | class) = 0/N = 0`◊ um zero multiplicado em todo multiplicado depois, vai fazer `P(class | features) = 0`Não importa que outras provas existam, há muitas. Uma única palavra que não foi vista vai destruir toda a previsão, não importa quantas outras provas o apoiam.

O suavizamento da posição dará a cada um dos caracteres um pequeno número .`alpha`(normalmente para 1):

```
P(word_i | class) = (count(word_i, class) + alpha) / (total_words_in_class + alpha * vocab_size)
```

Quando alpha=1 时, cada palavra tem pelo menos uma muito pequena probabilidade. Em test e-mail aparece "discombobulate" 不再会让垃圾邮件 概率归零.

Mais alto alfa significa mais forte suavizamento (distribuição mais média) ―― menor alfa significa modelo mais confiante em dados── alfa é necessário ajustar o hiperparâmetro──

Influência do alfa:

| Alpha | Effect | When to use |
|-------|--------|-------------|
| 0.001 | 几乎没有 smoothing，信任数据 | 非常大的训练集，预计不会有未见特征 |
| 0.1 | 轻度 smoothing | 大型训练集 |
| 1.0 | 标准 Laplace smoothing | 默认起点 |
| 10.0 | 重度 smoothing，会压平分布 | 非常小的训练集，预计有许多未见特征 |

### Computação de log-espaço

Se multiplicamos as centenas de probabilidades, cada uma menor que 1) levará ao fluxo inferior de pontos flutuantes. Mesmo que o valor real seja um número positivo muito pequeno, a multiplicidade entre os pontos flutuantes também se tornará zero.

 solucion: em log space, não se trabalha em proporções multiplas, mas sim em proporções multiplas:

```
log P(class | x1, x2, ..., xn) = log P(class) + sum_i log P(xi | class)
```

Isso transformaria a previsão em produto de pontos:

```
log_scores = X @ log_feature_probs.T + log_class_priors
prediction = argmax(log_scores)
```

A multiplicação de matriz. É o que faz Bayes naívo prever tão rápido que o modelo linear de uma só camada é o mesmo que o cálculo.

### Bayes Ingênuo vs Regressão Logística

Os dois são classificadores de natureza linear para o texto.

| Aspect | Naive Bayes | Logistic Regression |
|--------|------------|-------------------|
| Type | Generative（建模 P(X\|Y)） | Discriminative（建模 P(Y\|X)） |
| Training | 统计频率 | 优化 Loss Function |
| Small data | 更好（强 prior 有帮助） | 更差（不足以估计权重） |
| Large data | 更差（错误假设会拖累） | 更好（更灵活的边界） |
| Features | 假设独立 | 能处理相关性 |
| Speed | 单次遍历，非常快 | 迭代优化 |
| Calibration | 概率较差 | 概率更好 |

經驗法则: desde Naive Bayes 開始── se tiver dados suficientes, e NB 進入平台期,就切换到物流回归──

### Classificação de gasodutos

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

Na prática, nós trabalhamos no espaço de log, para evitar o fluxo de pontos flutuantes.

```
log P(class | features) = log P(class) + sum_i log P(feature_i | class)
```


```figure
naive-bayes
```

## Construí-lo
`code/naive_bayes.py`O código do meio foi implementado a partir de zero em MultinomialNB e GaussianNB.

### MultinômioNB

Desde zero realização:

1. **fit(X, y)**Para cada classe, statistika κάθε χαρακτηριστικό της συχνότητας。加入 Laplace smoothing。计算 log probabilidades。 armazéns de classe prioridades(类别频率的 log)。

2. **predict_log_proba(X)**Para cada amostra, calcular todos os tipos de log P(classe) + soma de log P(feature_i ➡classe) ➡

3. **predict(X)**: Retorno de log probabilidade máxima de classe.

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

关键洞察:拟合后,预测 é apenas uma multiplicação de Matrix, com preconceito.

### GaussianNB

Para os caracteres continuados, nós estimamos a média e a diferença de cada categoria para cada característica:

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

### Demo: Classificação do texto

代码会生成合成包-of-words 数据,模拟两个类别(artículos tecnológicos e artigos esportivos) ∼ cada classe tem diferentes palavras频分布──MultinomialNB

Palavras 0-39 em artigos de tecnologia com alta frequência, em esportes com baixa frequência, Palavras 80-119 em esportes com alta frequência, em tecnologia com baixa frequência, Palavras 40-79 em ambos são de frequência média, isto criará uma realidade.

### Demo: Características contínuas

代码会生成类似 Iris 的数据(3 个类别、4 个特征、Gaussian clusters) ――GaussianNB utiliza cada classe de média e diferença para classificação。 cada classe tem diferentes centros(médio vetor) e diferentes graus de separação(variância),模拟现实数据中各类测量值系统性不同的情况──

O que é que é que é?
- **Smoothing comparison：**Utilize diferentes alfa valor training MultinomialNB, demonstrar o efeito de suavizamento 强度对准确率──
- **Training size experiment：**Com o aumento dos dados de treinamento de 20 amostras para 1600 amostras, a taxa de precisão da NB aumentou. Mesmo que as amostras sejam muito pequenas, a NB também pode alcançar a taxa de precisão errada.
- **Confusion matrix：**Cada categoria de precisão, recall e F1 pontuação, para mostrar NB 在哪里犯错──

### Velocidade de previsão

Naive Bayes 预测 é uma multiplicação de Matrix── para n 个样本、d 个特征、k 个类别:
- MultinomialNB: uma vez Matrix multiplicar (n x d) @ (d x k) = O(n * d * k)
- GaussianNB:n * k 次 Gaussian PDF 求值,每次覆盖 d 个特征 = O(n * d * k)

Os dois são lineares em cada dimensão. Em comparação com o KNN, é necessário calcular até a distância de todos os pontos de treinamento (ou com o SVM do kernel RBF).

## Use-o
Usando o método de compra, estes dois variantes são um método de utilização:

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB

gnb = GaussianNB()
gnb.fit(X_train, y_train)
print(f"GaussianNB accuracy: {gnb.score(X_test, y_test):.3f}")

mnb = MultinomialNB(alpha=1.0)
mnb.fit(X_train_counts, y_train)
print(f"MultinomialNB accuracy: {mnb.score(X_test_counts, y_test):.3f}")
```

Usar o método de classificação do texto:

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

`naive_bayes.py`O código central será comparado com o do Skelarn, a partir de zero, em base nos mesmos dados, para verificar a sua veracidade.

### TF-IDF com Naive Bayes

O número de palavras primitivas permite que cada palavra que aparece tenha o mesmo peso. Mas, como "o" e "é", tais palavras comuns aparecem frequentemente em cada categoria.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB(alpha=0.1)),
])
```

O valor TF-IDF é negativo, portanto, pode ser usado com o MultinomialNB.

### Usado em breve em BernoulliNB

对于短文本(tweets、SMS、chat messages),BernoulliNB 可能优于多边文本──短文本的词数量很低,因此多边文本依赖的频率信息噪音较大──BernoulliNB只关注出现或缺失,这在短文本中更可靠──

```python
from sklearn.naive_bayes import BernoulliNB
from sklearn.feature_extraction.text import CountVectorizer

text_clf = Pipeline([
    ("vectorizer", CountVectorizer(binary=True)),
    ("classifier", BernoulliNB(alpha=1.0)),
])
```

Contador de Vectorizer 中的 `binary=True`O marcador irá transformar todos os contactos em 0/1── não há, o BernouliNB  ainda pode funcionar, mas vê que não é o contabilidade para o seu design──

### Calibração NB Probabilidades

NB 概率校准很差──NB diz P(spam) = 0,95 时, real probabilidade pode ser 0,7──

```python
from sklearn.calibration import CalibratedClassifierCV

calibrated_nb = CalibratedClassifierCV(MultinomialNB(), cv=5, method="sigmoid")
calibrated_nb.fit(X_train, y_train)
proba = calibrated_nb.predict_proba(X_test)
```

Isso passará por validação cruzada, se adequando a uma regressão logística sobre o número inicial de NB. A probabilidade de obter será mais próxima da frequência de classe real.

### Gotchas comuns

1. **负特征值。**MultimônimoNB  requer características não negativas. Se você tiver um valor negativo, por exemplo, TF-IDF, ou características de padronização, por exemplo, use GaussianNB, ou coloque o traço em plano para o valor real.

2. **零方差特征。**GaussianNB irá dividir em diferença. Se uma categoria de características diferem em zero, todos os valores são iguais, a probabilidade de cálculo irá ser problemática.

3. **类别不平衡。**Se 99% dos e-mails são não-spam,prior P(não-spam) = 0,99 会非常强,以至至压过概率证──你可以手动设置类优先,或使用 sklearn 中的 class_prior 参数──

4. **特征缩放。**MultinomialNB não precisa de escalado (processamento de contabilidade) GaussianNB também não precisa de escalado (estimativa de cada característica)

## Entrega-o
本课会产出:
- `outputs/skill-naive-bayes-chooser.md`: uma habilidade de decisão para escolher o NB 变体
- `code/naive_bayes.py`A partir do zero realizou o MultinomialNB e o GaussianNB, e não contém a comparação

### Quando Bayes, ingênuo, falha

Quando a suposição de independência  conduz a err err err err err err err err probabilidade) , NB 会失败.

1. **强特征交互。**Se a classe depender da combinação de dois traços, e não de qualquer característica individual, semelhante ao modelo de XOR, NB irá completamente errar.

2. **高度相关且 evidence 相反的特征。**Se a característica A indica "spam", a característica B indica "não-spam", mas A 和 B 完全相关 (realidade em que elas são sempre iguais), NB 会看到实际上不存在的冲突证据──

3. **非常大的训练集。**Quando os dados forem suficientes, modelos discriminativos como a regressão logística, aprenderão a chegar ao limite da decisão real, e ultrapassarão a NB.

Na prática, para a classificação do texto, estes modos de falha não são comuns. O número de características do texto é muito maior, mas os erros na suposição de independência são muitas vezes mutuamente compensados. Para os dados de formação de apenas pouca quantidade de características relacionadas, por favor, considere a regressão logística ou os modelos baseados em árvores.

## 练习
1. **Smoothing experiment。**Em dados de texto, usar o valor alfa 0.01、0.1、1.0、10.0 和 100.0  Treinamento MultinomialNB── desenhar precisão versus alfa── desempenho em que alcança o pico?

2. **Feature independence test。**取一个真实文本数据集. 选择两个明显相关词 (机器和学习) 计算 P 词1 词2 词2 词2 词2 词2 词2 词2 词2 词2 词2 词2 词) 比较. 独立假设 错得多严重?

3. **Bernoulli implementation。**扩展代码,添加一个BernoulliNB class──将包-of-words 转换为二值(present/absent),并文本数据上与多边数NB比较精度──什么时候Bernoulli 会赢?

4. **NB vs Logistic Regression。**Em texto, os dois são treinados em dados. Começando com 100 modelos de treinamento, os dois são aumentados gradualmente para 10.000.

5. **Spam filter。**构建一个完整的垃圾邮件分类器:tokenize 原始邮件文本、构建词汇、创建包-of-words features、训练 MultinomialNB,并使用精度和回忆 评估(不只是精度为什么?)。

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
- [scikit-learn Naive Bayes docs](https://scikit-learn.org/stable/modules/naive_bayes.html) 三种变体及其数学细节
- [McCallum and Nigam, A Comparison of Event Models for Naive Bayes Text Classification (1998)](https://www.cs.cmu.edu/~knigam/papers/multinomial-aaaiws98.pdf) 文中 Multinomial Comparar clássico de Bernoulli
- [Rennie et al., Tackling the Poor Assumptions of Naive Bayes Text Classifiers (2003)](https://people.csail.mit.edu/jrennie/papers/icml03-nb.pdf)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Ng and Jordan, On Discriminative vs. Generative Classifiers (2001)](https://ai.stanford.edu/~ang/papers/nips01-discriminativegenerative.pdf) prova NB                                                                                                                                                                                                                                                             
