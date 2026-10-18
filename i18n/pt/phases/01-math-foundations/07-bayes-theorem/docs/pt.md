# Teorema de Bayes

> Probabilidade  preocupação é o que você espera que aconteça―Teorema de Bayes  preocupação é o que você aprendeu―

**类型：**Construir
**语言：**Python
**前置要求：**Fase 1, Lição 06 ((Fundamentos da probabilidade)
**时间：**- 75 minutos.

## Objectivo de aprendizagem

-  aplicar o teorema de Bayes, com base na probabilidade anterior e evidência  calcular a probabilidade posterior
- Desde zero construção de um com Laplace suavizamento e log-espaço computação de Bayes Ingênuo 文本分类器
- Comparar MLE e estimativa do MAP,并解释 MAP 如何应对L2 regularisation
- Utilize Beta-Binomial conjugate priorities para testes A/B  realçar atualização Bayesian sequencial

## 问题

Um exame médico tem uma taxa de precisão de 99%... o seu exame foi positivo... qual é a probabilidade de você realmente estar doente?

A maioria das pessoas dirá que 99%... a resposta real depende da raridade dessa doença... se apenas 1 em cada 10.000 pessoas tiverem doença, então um resultado positivo significa apenas que você tem uma probabilidade de doença de cerca de 1%... os outros 99% de resultados positivos são erros de saúde.

Não é um movimento de massa cerebral. É o teorema de Bayes. Cada filtro de spam, cada diagnóstico médico, cada modelo de ML de quantificação de incerteza, usa o mesmo tipo de raciocínio. Primeiro, temos uma crença.

Se você não entender isso, se você construir um sistema de inteligência artificial, você vai interpretar erroneamente os resultados do modelo, estabelecer prazos ruins e publicar previsões excessivamente confiantes.

## 概念

### Da probabilidade conjunta para Bayes .

Já sabes na lição 06 que a probabilidade condicional é:

```math
P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)}
```

Para a sua definição:

```math
P(B \mid A) = \frac{P(A \text{ and } B)}{P(A)}
```

Dois expressões compartilham a mesma molécula:$P(A \text{ and } B)$❖ para que eles se reorganizem:

```math
\begin{aligned}
P(A \text{ and } B) &= P(A \mid B) \cdot P(B) = P(B \mid A) \cdot P(A) \\[4pt]
&\text{因此：} \\[4pt]
P(A \mid B) &= \frac{P(B \mid A) \cdot P(A)}{P(B)}
\end{aligned}
```

É o teorema de Bayes.

### Quatro partes

| Part | Name | What it means |
|------|------|---------------|
| $P(A \mid B)$ | Posterior | 看到 evidence $B$ 之后，你对 $A$ 的更新后 belief |
| $P(B \mid A)$ | Likelihood | 如果 $A$ 为真，evidence $B$ 出现的概率有多大 |
| $P(A)$ | Prior | 在看到任何 evidence 之前，你对 $A$ 的 belief |
| $P(B)$ | Evidence | 在所有可能性下看到 $B$ 的总概率 |

Evidências$P(B)$起到归化因子的作用── você pode demonstrá-lo com a lei da probabilidade total:

```math
P(B) = P(B \mid A) \cdot P(A) + P(B \mid \text{not } A) \cdot P(\text{not } A)
```

### 医学检测 exemplo

Uma doença afeta 1 em cada 10.000 pessoas. A taxa de verificação é de 99% e a taxa de erro é de 1%.

```math
\begin{aligned}
P(\text{sick}) &= 0.0001 \quad \text{（先验：疾病罕见）} \\
P(\text{positive} \mid \text{sick}) &= 0.99 \quad \text{（似然：检测能检出疾病）} \\
P(\text{positive} \mid \text{healthy}) &= 0.01 \quad \text{（假阳性率）} \\[6pt]
P(\text{positive}) &= P(\text{positive} \mid \text{sick}) \cdot P(\text{sick}) + P(\text{positive} \mid \text{healthy}) \cdot P(\text{healthy}) \\
&= 0.99 \cdot 0.0001 + 0.01 \cdot 0.9999 \\
&= 0.000099 + 0.009999 \\
&= 0.010098 \\[6pt]
P(\text{sick} \mid \text{positive}) &= P(\text{positive} \mid \text{sick}) \cdot P(\text{sick}) / P(\text{positive}) \\
&= 0.99 \cdot 0.0001 / 0.010098 \\
&= 0.0098 \\
&= 0.98\%
\end{aligned}
```

Não chega a 1%: o que é o problema? Quando uma situação é muito rara, mesmo os exames precisos também geram falsos resultados.

### Filtro de spam exemplo

Recebeu um e-mail que contou com a palavra "loteria"?

```math
\begin{aligned}
P(\text{spam}) &= 0.3 \quad \text{（30\% 的邮件是垃圾邮件）} \\
P(\text{"lottery"} \mid \text{spam}) &= 0.05 \quad \text{（5\% 的垃圾邮件包含 "lottery"）} \\
P(\text{"lottery"} \mid \text{not spam}) &= 0.001 \quad \text{（0.1\% 的正常邮件包含 "lottery"）} \\[6pt]
P(\text{"lottery"}) &= 0.05 \cdot 0.3 + 0.001 \cdot 0.7 \\
&= 0.015 + 0.0007 \\
&= 0.0157 \\[6pt]
P(\text{spam} \mid \text{"lottery"}) &= 0.05 \cdot 0.3 / 0.0157 \\
&= 0.955 \\
&= 95.5\%
\end{aligned}
```

Uma palavra coloca a probabilidade de 30%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

### Bayes ingênuo: suposição de independência

Naívo Bayes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

```math
P(\text{class} \mid \text{feature}_1, \text{feature}_2, \ldots, \text{feature}_n) = \frac{P(\text{class}) \cdot P(\text{feature}_1 \mid \text{class}) \cdot P(\text{feature}_2 \mid \text{class}) \cdots P(\text{feature}_n \mid \text{class})}{P(\text{feature}_1, \text{feature}_2, \ldots, \text{feature}_n)}
```

Parte da "naiva" é a suposição de independência. No texto, o aparecimento de palavras não é independente. Mas essa suposição tem um efeito estranho na prática, pois a classificação só precisa de uma classificação, e não de uma boa probabilidade de gerar uma classificação.

Como as classes são iguais, você pode saltar por cima delas, apenas comparando moléculas:

```math
\text{score}(\text{class}) = P(\text{class}) \cdot \prod_i P(\text{feature}_i \mid \text{class})
```

Selecionar a melhor classificação.

### Estimação máxima de probabilidade (MLE)

Como é que os dados de treinamento são obtidos?$P(\text{feature} \mid \text{class})$- Não, não.

```math
P(\text{"free"} \mid \text{spam}) = \frac{\text{包含 "free" 的垃圾邮件数}}{\text{垃圾邮件总数}}
```

É o MLE: selecionar o valor de parâmetros mais provável de observação de dados. Você está no maximizar a função de probabilidade; para o cálculo de separação, ele se simplifica para a frequência relativa.

问题: Se um termo durante o treino nunca apareceu no spam, MLE vai dar-lhe uma probabilidade de zero.

```math
P(\text{word} \mid \text{class}) = \frac{\text{count}(\text{word}, \text{class}) + 1}{\text{total\_words\_in\_class} + \text{vocabulary\_size}}
```

Dá a cada número mais um, para que as probabilidades não sejam de zero.

### MAP (Maksimal a posteriori)

MLE 问的是: quais parâmetros maximizar $P(\text{data} \mid \text{parameters})$- Não .

O MAP   é: quais os parâmetros maximizados $P(\text{parameters} \mid \text{data})$- Não .

Segundo o teorema de Bayes:

```math
P(\text{parameters} \mid \text{data}) \propto P(\text{data} \mid \text{parameters}) \cdot P(\text{parameters})
```

MAP irá em parâmetros integrar um anterior sobre si mesmo. Se você acha que os parâmetros devem ser menores, então codifique-o para punir o valor superior do anterior.

| Estimation | Optimizes | ML equivalent |
|------------|-----------|---------------|
| MLE | $P(\text{data} \mid \text{params})$ | 未 regularize 的训练 |
| MAP | $P(\text{data} \mid \text{params}) \cdot P(\text{params})$ | L2 / L1 regularization |

### Bayesian vs frequentist: prática diferencial

Os frequentistas colocam os parâmetros como quantidades fixas mas desconhecidas. Eles perguntam: se eu repetisse esta experiência muitas vezes, o que aconteceria?

Bayesians Colocar parâmetros 视为分布── eles perguntam:  Baseado no que já observei, eu tenho alguma crença nesses parâmetros?

 Para a construção de sistemas de gestão de dados, as diferenças práticas são as seguintes:

| Aspect | Frequentist | Bayesian |
|--------|-------------|----------|
| Output | 点估计 | 值上的 distribution |
| Uncertainty | Confidence intervals（关于过程） | Credible intervals（关于 parameter） |
| Small data | 可能 overfit | Prior 起到 regularization 的作用 |
| Computation | 通常更快 | 通常需要 sampling（MCMC） |

A maioria dos níveis de produção de ML é frequentista de SGD 点估算) ⋅ quando você precisa de um bom nível de incerteza ⋅ medicinal decision ⋅ safety key system), ou muito pouco de dados ⋅ aprendizado de poucas tiras ⋅ começo frio) ⋅ quando os métodos bayesianos serão muito úteis ⋅

### Por que o pensamento bayesiano é importante para o ML?

Esta ligação é mais profunda:

**Priors 就是 regularization。**Os valores de parâmetros de Gaussian acima são a regularização L2.

**Posteriors 就是不确定性。**单个预测概率不能告诉你模型对该估算有多信心. 我认为, os métodos bayesianos darão uma distribuição.$P(\text{spam})$Entre 0,8 a 0,95 

**Bayes updates 就是 online learning。**O posterior de hoje será o anterior de amanhã. Quando o seu modelo vê novos dados, ele vai aumentar a atualização de suas crenças, em vez de re-treinar a partir de zero.

**Model comparison 是 Bayesian 的。**Critério de informação bayesiano (BIC) ▌probabilidade marginal 和 fatores de Bayes ▌ utilizam o raciocínio bayesiano em casos de seleção de modelos não adequados ▌


```figure
bayes-update
```

## Construí-lo
### 步骤 1: Função do teorema de Bayes

```python
def bayes(prior, likelihood, false_positive_rate):
    evidence = likelihood * prior + false_positive_rate * (1 - prior)
    posterior = likelihood * prior / evidence
    return posterior

result = bayes(prior=0.0001, likelihood=0.99, false_positive_rate=0.01)
print(f"P(sick|positive) = {result:.4f}")
```

### 步骤 2: Classificador Bayes

```python
import math
from collections import defaultdict

class NaiveBayes:
    def __init__(self, smoothing=1.0):
        self.smoothing = smoothing
        self.class_counts = defaultdict(int)
        self.word_counts = defaultdict(lambda: defaultdict(int))
        self.class_word_totals = defaultdict(int)
        self.vocab = set()

    def train(self, documents, labels):
        for doc, label in zip(documents, labels):
            self.class_counts[label] += 1
            words = doc.lower().split()
            for word in words:
                self.word_counts[label][word] += 1
                self.class_word_totals[label] += 1
                self.vocab.add(word)

    def predict(self, document):
        words = document.lower().split()
        total_docs = sum(self.class_counts.values())
        vocab_size = len(self.vocab)
        best_class = None
        best_score = float("-inf")
        for cls in self.class_counts:
            score = math.log(self.class_counts[cls] / total_docs)
            for word in words:
                count = self.word_counts[cls].get(word, 0)
                total = self.class_word_totals[cls]
                score += math.log((count + self.smoothing) / (total + self.smoothing * vocab_size))
            if score > best_score:
                best_score = score
                best_class = cls
        return best_class
```

As probabilidades de log podem evitar o fluxo inferior. Muitas probabilidades muito pequenas multiplicam-se para um ponto flutuante para obter números muito pequenos.

### 步骤 3: em spam dados treinamento

```python
train_docs = [
    "win free money now",
    "free lottery ticket winner",
    "claim your prize today free",
    "urgent offer free cash",
    "congratulations you won free",
    "meeting tomorrow at noon",
    "project update attached",
    "can we schedule a call",
    "quarterly report review",
    "lunch on thursday sounds good",
    "team standup notes attached",
    "please review the pull request",
]

train_labels = [
    "spam", "spam", "spam", "spam", "spam",
    "ham", "ham", "ham", "ham", "ham", "ham", "ham",
]

classifier = NaiveBayes()
classifier.train(train_docs, train_labels)

test_messages = [
    "free money waiting for you",
    "meeting rescheduled to friday",
    "you won a free prize",
    "please review the attached report",
]

for msg in test_messages:
    print(f"  '{msg}' -> {classifier.predict(msg)}")
```

### 步骤 4: probabilidade de aprendizagem

```python
def show_top_words(classifier, cls, n=5):
    vocab_size = len(classifier.vocab)
    total = classifier.class_word_totals[cls]
    probs = {}
    for word in classifier.vocab:
        count = classifier.word_counts[cls].get(word, 0)
        probs[word] = (count + classifier.smoothing) / (total + classifier.smoothing * vocab_size)
    sorted_words = sorted(probs.items(), key=lambda x: x[1], reverse=True)
    for word, prob in sorted_words[:n]:
        print(f"    {word}: {prob:.4f}")

print("\nTop spam words:")
show_top_words(classifier, "spam")
print("\nTop ham words:")
show_top_words(classifier, "ham")
```

## Use-o
O Scikit-Learn forneceu Bayes ingênuos que podem ser produzidos para realizar:

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report

vectorizer = CountVectorizer()
X_train = vectorizer.fit_transform(train_docs)
clf = MultinomialNB()
clf.fit(X_train, train_labels)

X_test = vectorizer.transform(test_messages)
predictions = clf.predict(X_test)
for msg, pred in zip(test_messages, predictions):
    print(f"  '{msg}' -> {pred}")
```

O contectorizador de números  processar a tokenização e a construção do vocabulário―MultinomialNB em processamento interno de suavização e log-probabilidades― você fez a mesma coisa desde a versão de zero-writing com 40 行代码―

## Entrega-o
Esta construção de classe NaiveBayes  demonstrou um pipeline completo: tokenization  uso de estimativa de probabilidade de suavização de Laplace  previsão de log-spaces`code/bayes.py`O código do meio pode ser executado de um lado para outro, além da biblioteca padrão Python.

### Precessos conjuntos

Quando o anterior e posterior pertencem à mesma família de distribuição, este anterior é chamado de "conjugado". Isso permite que a atualização bayesiana em代数 seja muito limpa.

| Likelihood | Conjugate Prior | Posterior | Example |
|-----------|----------------|-----------|---------|
| Bernoulli | $\text{Beta}(a, b)$ | $\text{Beta}(a + \text{successes}, b + \text{failures})$ | Coin flip bias estimation |
| Normal (known variance) | $\text{Normal}(\mu_0, \sigma_0)$ | Normal(weighted mean, smaller variance) | Sensor calibration |
| Poisson | $\text{Gamma}(a, b)$ | $\text{Gamma}(a + \text{sum of counts}, b + n)$ | Modeling arrival rates |
| Multinomial | $\text{Dirichlet}(\alpha)$ | $\text{Dirichlet}(\alpha + \text{counts})$ | Topic modeling, language models |

Isso é importante porque, quando não há antecedentes conjugados, você precisa de amostragem de Monte Carlo ou inferência variável para uma aproximação posterior.

A distribuição beta é a mais comum de práticas conjugada anterior.$\text{Beta}(a, b)$Expressa sua crença em um parâmetro de probabilidade.$a/(a+b)$- Não.$a+b$越大, distribuição 越集中(越自信)

Caso especial do beta anterior:
- $\text{Beta}(1, 1)$= uniforme. Você tem opinião sobre o parâmetro.
- $\text{Beta}(10, 10)$= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
- $\text{Beta}(1, 10)$= Para 0 偏斜──你相信参数 很小──

更新规则极其简单:

```math
\begin{aligned}
\text{先验：} \quad & \text{Beta}(a, b) \\
\text{数据：} \quad & s \text{ 次成功}, f \text{ 次失败} \\
\text{后验：} \quad & \text{Beta}(a + s, b + f)
\end{aligned}
```

Não há amostras, só adição.

### Atualização Bayesiana Sequencial

A inferência Bayesiana é que o 天然是序列的── hoje posterior será o anterior de amanhã── é assim que o sistema real aprende em aumento sem re-processar todos os dados históricos──

具体例:估计一枚硬币是否公平──

**Day 1：还没有数据。**
De$\text{Beta}(1, 1)$Começou a fazer um uniforme antes.
- Medida anterior: 0,5
- Prior em [0, 1] 上是平坦的

**Day 2：观察到 7 次正面，3 次反面。**
$\text{Posterior} = \text{Beta}(1 + 7, 1 + 3) = \text{Beta}(8, 4)$
- Medida posterior:$8/12 = 0.667$
- Evidências mostram que a moeda está em direcção à direita

**Day 3：又观察到 5 次正面，5 次反面。**
Utilize ontem posterior como hoje anterior.
$\text{Posterior} = \text{Beta}(8 + 5, 4 + 5) = \text{Beta}(13, 9)$
- Medida posterior:$13/22 = 0.591$
- Os dados do novo equilíbrio repassaram a estimativa para cerca de 0,5.

```mermaid
graph LR
    A["Prior<br/>Beta(1,1)<br/>mean = 0.50"] -->|"7H, 3T"| B["Posterior 1<br/>Beta(8,4)<br/>mean = 0.67"]
    B -->|"becomes prior"| C["Prior 2<br/>Beta(8,4)"]
    C -->|"5H, 5T"| D["Posterior 2<br/>Beta(13,9)<br/>mean = 0.59"]
```

观测顺序 não é importante.$\text{Beta}(1,1)$Uma vez sexuais, 12 vezes de frente e 8 vezes de frente, também vou conseguir.$\text{Beta}(13, 9)$ resultados são os mesmos: ■ atualização sequencial e atualização de lote em matemática.

É a base do aprendizado on-line no sistema ML de produção. Para os bandidos, o sistema de amostragem de Thompson e os detectores de anomalias de streaming usam este modelo.

### Contacto com A/B Testing

A análise A/B é, em essência, uma inferência Bayesiana falsa.

设定: 你正在测试两种按颜色──Variante A(azul) e variante B(verde)──你想知道哪一个获得更多点击──

Teste de A/B Bayesiano:

1. **Prior。**Duas variantes .$\text{Beta}(1, 1)$Não há preferência prévia.
2. **Data。**Variante A:1000 vezes mostração 50 vezes点击──Variante B:1000 vezes mostração 65 vezes点击──
3. **Posteriors。**
   - A:$\text{Beta}(1 + 50, 1 + 950) = \text{Beta}(51, 951)$ Medida = 0,051
   - B:$\text{Beta}(1 + 65, 1 + 935) = \text{Beta}(66, 936)$❖Média = 0,066
4. **Decision。**计算 $P(B > A)$B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B B 

解析地计算 $P(B > A)$Mas Monte Carlo tornou-se muito simples:

```
1. Draw 100,000 samples from Beta(51, 951)  -> samples_A
2. Draw 100,000 samples from Beta(66, 936)  -> samples_B
3. P(B > A) = fraction of samples where B > A
```

Se $P(B > A) > 0.95$, lançamos a variante B. Se estiver entre 0,05 e 0,95, continuamos a coletar dados.$P(B > A) < 0.05$, já lançou a variante A.

Diferentes vantagens do teste A/B frequentista:
- Você vai obter uma probabilidade direta:
- Não há p-valor 混──没有 fail rejeitar a hipótese nula 这种回避表述──
- Você pode ver o resultado a qualquer momento, sem aumentar as taxas falsas positivas (((sem "problema de olhar")
- Você pode adotar conhecimento prévio, por exemplo, testes anteriores mostram taxas de conversão geralmente são de 3-8%.

| Aspect | Frequentist A/B | Bayesian A/B |
|--------|----------------|--------------|
| Output | p-value | $P(B > A)$ |
| Interpretation | “如果 A=B，这些数据有多令人意外？” | “B 比 A 更好的可能性有多大？” |
| Early stopping | 会抬高 false positives | 任意时点都是安全的（前提是 prior 选择合理且 model specification 正确） |
| Prior knowledge | 不使用 | 编码为 Beta prior |
| Decision rule | $p < 0.05$ | $P(B > A) > \text{threshold}$ |

## 练习
1. **Multiple tests。**Um paciente em dois exames independentes foi positivo.$P(\text{sick})$É o que? O primeiro teste é posterior, como o anterior do segundo teste.

2. **Smoothing impact。**Utilize 0.01、0.1、1.0 和 10.0 de valores de suavizamento 运行垃圾邮件分类器──Top word probabilities 会如何变化?当平滑=0 且某个词只出现 中时会发生什么?

3. **Add features。**扩展 NaiveBayes class, fazendo com que, além de contagens de palavras 之外, também use message length(short/long) como recurso──$P(\text{short} \mid \text{spam})$和 $P(\text{short} \mid \text{ham})$, e o colocou na pontuação da previsão.

4. **MAP by hand。**给定观测数据(10 vezes lançamentos de moedas, entre 7 vezes cabeças), usam $\text{Beta}(2,2)$Previo cálculo de preconceito de MAP, cálculo de MLE, cálculo de MAP, cálculo de MAP, cálculo de MLE, cálculo de MLE, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MLE, cálculo de MLE, cálculo de MLE, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MLE, cálculo de MLE, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MLE, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP, cálculo de MAP,$7/10$) fazer uma comparação:

### 提示

**练习 1。**调用一次 `bayes`得到第一次检测后后试概率,再将其作为先验调一次──`sequential_bayes(prior, likelihood, false_positive_rate, 2)`O resultado deve ser igual, aproximado de 0,5.

**练习 2。**Para cada um criar um.`NaiveBayes(smoothing=s)`, usando o mesmo treinamento de dados,并分别打印 `top_words`◊ suavizamento = 0 时, não aparecendo em lixo o índice de probabilidade de palavras é 0, portanto, não há definição para o número ∙

**练习 3。**统计垃圾邮件和正常邮件中各有多少条短消息,分别除了各类消息总数,分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分别分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分`predict`A proporção entre os números é de 1 e 2 de cada categoria.

**练习 4。**Utilização $\text{Beta}(\alpha, \beta)$Previo estudo, MAP  estimativa$\frac{h + \alpha - 1}{n + \alpha + \beta - 2}$- Não.$h = 7$- Não.$n = 10$O resultado deve ser entre MLE(0.7) e número de experiências anteriores(0.5)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Prior | “我的初始猜测” | 观测 evidence 之前的 $P(\text{hypothesis})$。在 ML 中：regularization 项。 |
| Likelihood | “数据拟合得有多好” | $P(\text{evidence} \mid \text{hypothesis})$。在特定 hypothesis 下，观测数据出现的概率有多大。 |
| Posterior | “我更新后的 belief” | $P(\text{hypothesis} \mid \text{evidence})$。Prior 乘以 likelihood，然后归一化。 |
| Evidence | “归一化常数” | 所有 hypotheses 下的 $P(\text{data})$。确保 posterior 求和为 1。 |
| Naive Bayes | “那个简单的文本分类器” | 一个假设 features 在给定 class 时相互独立的分类器。尽管该假设不成立，效果仍然很好。 |
| Laplace smoothing | “Add-one smoothing” | 给每个 feature 增加一个小计数，以防止未见数据产生零概率。 |
| MLE | “直接用频率” | 选择最大化 $P(\text{data} \mid \text{parameters})$ 的 parameters。没有 prior。在小数据上可能 overfit。 |
| MAP | “带 prior 的 MLE” | 选择最大化 $P(\text{data} \mid \text{parameters}) \cdot P(\text{parameters})$ 的 parameters。等价于 regularized MLE。 |
| Log-probability | “在 log space 中工作” | 使用 $\log(P)$ 而不是 $P$，避免许多小数相乘时发生 floating-point underflow。 |
| False positive | “错误警报” | 检测结果为阳性，但真实状态为阴性。它会推动 base rate fallacy。 |

## 延伸阅读
- [3Blue1Brown: Bayes' theorem](https://www.youtube.com/watch?v=HZGCoVF3YvM)- Uso de exames médicos exemplo de explicação visível
- [Stanford CS229: Generative Learning Algorithms](https://cs229.stanford.edu/notes2022fall/cs229-notes2.pdf)- ligação de Bayes e seus modelos discriminatórios
- [Think Bayes](https://greenteapress.com/wp/think-bayes/)- 免费书籍, contendo Python 代码 de estatísticas bayesianas
- [scikit-learn Naive Bayes](https://scikit-learn.org/stable/modules/naive_bayes.html)- Realização do nível de produção e quando utilizar as variantes
