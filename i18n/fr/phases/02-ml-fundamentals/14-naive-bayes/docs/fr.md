# Bayes naïf

> naive 假设是错误的, mais elle est toujours valable.

**Type:** Build
**Language:**Python
**先修要求：**Phase 2, leçons 01-07 ((Classification, théorème de Bayes)
**Time:** ~75 分钟

## Objectif de l'apprentissage
- From零实现带 Laplace smoothing  的 Multinomial Naive Bayes, utilisé pour la classification du texte
- Expliquer pourquoi l'hypothèse naïve d'indépendance est fausse en mathématiques, mais peut toujours produire une classification correcte en pratique.
- Comparer le multinomial、Bernoulli 和 Gaussian Naive Bayes 变体,并为给定特征类型选择合适的版本
- Dans des données très rares, on peut évaluer la différence entre les Bayes naïfs et la régression logistique et expliquer le rôle joué par les différences de biais.

##  problématique
Vous devez classer le texte. Vous devez classer le message en spams ou non. Vous devez classer les commentaires des clients en positifs ou négatifs. Vous avez des milliers de caractéristiques.

La régression logique a besoin de suffisamment d'échantillons pour pouvoir évaluer de façon fiable les milliers de poids. Les arbres de décision sont divisés une fois par un seul mot et sont gravement surchargés.

Bayes naïf peut traiter cette situation. Il fait une hypothèse mathématique erronée, chaque caractéristique est indépendante de toutes les autres caractéristiques, mais dans la classification du texte, il peut encore surpasser les modèles plus intelligents, en particulier dans les groupes de formation plus petits. Il ne faut qu'une seule fois traverser les données pour terminer la formation. Il peut s'étendre à plusieurs millions de caractéristiques. Il génère des estimations de probabilité.

Comprendre pourquoi une hypothèse erronée peut apporter une bonne prédiction vous permettra d'apprendre un fait fondamental de l'apprentissage automatique: le meilleur modèle n'est pas le modèle le plus correct, mais le meilleur modèle de compromis de variance biaisée de vos données.

## 概念
### Le théorème de Bayes (réponse rapide)

Le théorème de Bayes:

```math
P(\text{类别} \mid \text{特征}) = \frac{P(\text{特征} \mid \text{类别}) \cdot P(\text{类别})}{P(\text{特征})}
```

Nous voulons`P(class | features)`, c'est-à-dire que le texte est une probabilité de quelque sorte.
- `P(features | class)`: dans ce classement de documents voir la probabilité de ces mots
- `P(class)`:类别: Prévisible de l'article précédent
- `P(features)`Les données de référence sont les mêmes pour tous les types de catégories, de sorte que la comparaison des catégories peut être négligée.

`P(class | features)`La meilleure classe à gagner.

### Une supposition naïve de l'indépendance

精确计算 `P(features | class)`Pour le vocabulaire de 10 000 mots, vous devez estimer$2^{10{,}000}$种可能组合上的分布── impossible──

La supposition naïve est que, après une catégorie déterminée, chaque caractéristique est indépendante de manière conditionnelle.

```math
P(w_1, w_2, \ldots, w_n \mid \text{类别}) = P(w_1 \mid \text{类别}) \cdot P(w_2 \mid \text{类别}) \cdots P(w_n \mid \text{类别})
```

Vous ne prévoyez plus une distribution commune impossible, mais une estimation.$n$个简单的个特征分布―― chaque distribution ne nécessite qu'un seul compte−

Cette hypothèse est évidemment erronée. Dans n'importe quel document, la "machine" et l'"apprentissage" ne sont pas indépendantes. Mais le classifiateur n'a pas besoin d'une estimation correcte des probabilités. Il a besoin d'un ordre correct, c'est-à-dire que la probabilité de la catégorie la plus élevée.

### Pourquoi il fonctionne encore

Trois raisons:

1. **排序优先于校准。**La classification ne nécessite que la classification des catégories les plus élevées.$P(\text{垃圾邮件}) = 0.99999$, alors que la vraie probabilité est de 0,7, le classifiateur continuera à choisir correctement le spam.

2. **高 bias，低 variance。**L'hypothèse d'indépendance est un modèle de forte priorité. Elle est un modèle de forte force de restriction, afin d'éviter le surcoût.

3. **特征冗余会相互抵消。**Les caractéristiques connexes fournissent des preuves redondantes. Le classifiateur va les calculer à nouveau, mais elle va aussi pour une classe correcte de calcul à nouveau. Si "machine" et "apprentissage" apparaissent toujours ensemble, ils fournissent toutes des preuves pour une classe "technique". NB les calculera deux fois, mais il est calculé deux fois pour une classe correcte.

La prédiction est une multiplication de la matrice. Vous pouvez terminer l'entraînement en quelques secondes avec un million de documents. Cette vitesse signifie que vous pouvez plus rapidement, essayer plus de caractéristiques, et faire plus d'expériences que le modèle lent.

### Les mathématiques étape par étape

让我们跟踪一个具体例――假设我们有两个类别:spam 和非spam――我们的词汇有三个词:"免费""",钱"",会议"",

訓練資料:
- Spam 邮件 mentionné "gratuit" 80 fois"",argent" 60 fois"",réunion" 10 fois(total 150 个词)
- Non-spam 邮件 mentionné "gratuit" 5 fois"",argent" 10 fois"",réunion" 100 fois(total 115 个词)
- 40% de la messagerie est spam, 60% est non-spam

Utilisation de lissage Laplace$\alpha=1$):

```math
\begin{aligned}
P(\text{free} \mid \text{垃圾邮件}) &= (80 + 1) / (150 + 3) = 81/153 = 0.529 \\
P(\text{money} \mid \text{垃圾邮件}) &= (60 + 1) / (150 + 3) = 61/153 = 0.399 \\
P(\text{meeting} \mid \text{垃圾邮件}) &= (10 + 1) / (150 + 3) = 11/153 = 0.072 \\[6pt]
P(\text{free} \mid \text{非垃圾邮件}) &= (5 + 1) / (115 + 3) = 6/118 = 0.051 \\
P(\text{money} \mid \text{非垃圾邮件}) &= (10 + 1) / (115 + 3) = 11/118 = 0.093 \\
P(\text{meeting} \mid \text{非垃圾邮件}) &= (100 + 1) / (115 + 3) = 101/118 = 0.856
\end{aligned}
```

Il y a aussi le "gratuit" (de l'argent) (de la musique) (de la musique).

```math
\begin{aligned}
\log P(\text{垃圾邮件} \mid \text{邮件}) &= \log(0.4) + 2 \log(0.529) + 1 \log(0.399) + 0 \log(0.072) \\
&= -0.916 + 2(-0.637) + (-0.919) + 0 \\
&= -3.109 \\[6pt]
\log P(\text{非垃圾邮件} \mid \text{邮件}) &= \log(0.6) + 2 \log(0.051) + 1 \log(0.093) + 0 \log(0.856) \\
&= -0.511 + 2(-2.976) + (-2.375) + 0 \\
&= -8.838
\end{aligned}
```

Spam 以大优势胜出──"free" 出現两次是支持垃圾邮件的强烈证据──注意, "reunion" n'apparaissant pas, les contributions à deux logs sont nulles$0 \cdot \log P$) Dans le NB multivariale, la défaillance du mot n'a pas d'effet.

### Trois variantes

Bayes naïf a trois formes. Chaque type est construit de différentes manières.`P(feature | class)`Il y a une autre.

#### Bayes naïf à plusieurs noms

Pour chaque caractéristique, il est préférable de calculer les données textuelles des caractéristiques de la valeur TF-IDF.

```math
P(\text{词}_i \mid \text{类别}) = \frac{\text{计数：} \text{词}_i \text{ 在类别中} + \alpha}{\text{类别内词总数} + \alpha \cdot \text{vocab\_size}}
```

`alpha`C'est le même type de classification.

#### Bayes naïf gaussien

Les caractéristiques de chaque modèle sont régulièrement réparties.

```math
P(x_i \mid \text{类别}) = \frac{1}{\sqrt{2 \pi \cdot \text{方差}}} \cdot \exp\left(-\frac{(x_i - \text{均值})^2}{2 \cdot \text{方差}}\right)
```

Chaque catégorie a sa propre valeur moyenne et sa différence pour chaque caractéristique. Lorsque les caractéristiques de chaque catégorie sont vraiment conformes à la courbe de la cloche, cette méthode est très efficace.

#### Bernoulli naïf Bayes

Pour chaque caractéristique, il faut définir un vecteur de valeur de deux (apparent ou non).

```math
P(\text{词}_i \mid \text{类别}) = \frac{\text{类别内包含该词的文档数：} \text{词}_i + \alpha}{\text{类别内文档总数} + 2 \alpha}
```

Contrairement à Multinomial, Bernouli va punir manifestement l'absence d'un mot. Si "libre" apparaît généralement dans le spam, mais pas dans ce mail, Bernouli va le considérer comme une preuve de l'absence de spam.

### Quand utiliser chaque variante

| Variant | Feature Type | Best For | Example |
|---------|-------------|----------|---------|
| Multinomial | 计数或频率 | 文本 classification、bag-of-words | Email spam、topic classification |
| Gaussian | 连续值 | 具有近似正态特征的表格数据 | Iris classification、传感器数据 |
| Bernoulli | 二值（0/1） | 短文本、二值特征 Vector | SMS spam、presence/absence features |

### Légimentation de la place

Si un mot apparaît dans les données de test, mais qu'il n'apparaisse jamais dans une catégorie spécifique de données d'entraînement, que se passe-t-il ?

没有 smoothing:`P(word | class) = 0/N = 0`Une fois que tout est passé, ça va arriver.`P(class | features) = 0`Quoi qu'il en soit, il y a beaucoup de preuves. Un seul mot qui ne l'a pas vu détruira toute la prédiction.

Le réglage de la place donnera à chaque caractéristique un compte plus un petit compte .`alpha`(habituellement pour 1):

```math
P(\text{词}_i \mid \text{类别}) = \frac{\text{计数}(\text{词}_i, \text{类别}) + \alpha}{\text{total\_words\_in\_class} + \alpha \cdot \text{vocab\_size}}
```

- Je suis là .$\alpha=1$时, chaque mot a au moins une très petite probabilité de apparaître dans un test mail "discombobulate" 不再会让垃圾邮件 概率归零──smoothing 有一个贝耶斯语解释:

L'alpha de plus haut signifie l'affûtage plus fort (distribution plus moyenne) ⋅ l'alpha de plus bas signifie le modèle plus fiable ⋅ l'alpha est un hyperparamètre qui doit être ajusté ⋅

L'influence de l'alpha:

| Alpha | Effect | When to use |
|-------|--------|-------------|
| 0.001 | 几乎没有 smoothing，信任数据 | 非常大的训练集，预计不会有未见特征 |
| 0.1 | 轻度 smoothing | 大型训练集 |
| 1.0 | 标准 Laplace smoothing | 默认起点 |
| 10.0 | 重度 smoothing，会压平分布 | 非常小的训练集，预计有许多未见特征 |

### Compteur log-espace

En multipliant les centaines de probabilités par 1) chaque fois moins que 1) entraînera un sous-flux de point flottant. Même si la valeur réelle est un nombre positif très petit, le multiplicité entre les points flottants deviendra également zéro.

解决方案: dans l'espace log.

```math
\log P(\text{类别} \mid x_1, x_2, \ldots, x_n) = \log P(\text{类别}) + \sum_i \log P(x_i \mid \text{类别})
```

Cela va transformer la prédiction en produit de point:

```
log_scores = X @ log_feature_probs.T + log_class_priors
prediction = argmax(log_scores)
```

La multiplication de matrice, c'est la raison de la prédiction de Bayes, est la même que celle du modèle linéaire à un seul niveau.

### Bayes naïf contre la régression logistique

Les deux sont utilisés comme classifiants de la nature de texte. La différence réside dans l'objet qu'ils construisent.

| Aspect | Naive Bayes | Logistic Regression |
|--------|------------|-------------------|
| Type | Generative（建模 $P(X \mid Y){}$） | Discriminative（建模 $P(Y \mid X){}$） |
| Training | 统计频率 | 优化 Loss Function |
| Small data | 更好（强 prior 有帮助） | 更差（不足以估计权重） |
| Large data | 更差（错误假设会拖累） | 更好（更灵活的边界） |
| Features | 假设独立 | 能处理相关性 |
| Speed | 单次遍历，非常快 | 迭代优化 |
| Calibration | 概率较差 | 概率更好 |

经验法则: de Naive Bayes 开始── si vous avez assez de données, et NB 进入平台期,就切换到物流回归──

### L'équipement de transport

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

En pratique, nous travaillons dans l'espace log, pour éviter le sous-flux de point flottant.

```math
\log P(\text{类别} \mid \text{特征}) = \log P(\text{类别}) + \sum_i \log P(\text{特征}_i \mid \text{类别})
```


```figure
naive-bayes
```

## - Je le construis.
`code/naive_bayes.py`Le code central est réalisé à partir de zéro en MultinomialNB et GaussianNB.

### Nombre de noms

De zéro réalisation:

1. **fit(X, y)**Pour chaque classe, statistique pour chaque caractéristique.

2. **predict_log_proba(X)**: pour chaque échantillon, calculer toutes les catégories $\log P(\text{类别})$+ somme de $\log P(\text{特征}_i \mid \text{类别})$Ceci est une fois la multiplication de la matrice: X @ log_probs.T + log_priors。

3. **predict(X)**: retour à la probabilité de logement

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

关键洞察: après la conjugaison, la prédiction est simplement la multiplication de la matrice plus le biais.

### Gaussie NB

Pour les caractéristiques de continuité, nous estimons la moyenne et la différence de chaque catégorie pour chaque caractéristique:

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

### Démo: Classification du texte

代码会生成合成包-of-words 数据,模拟两个类别(tech articles和体育 articles) ⋅ chacune des catégories a une répartition de mots différente.

Les mots 0-39 dans les articles techniques ont une fréquence élevée, dans les sports ont une fréquence faible. Les mots 80-119 dans les sports ont une fréquence élevée, dans les technologies ont une fréquence faible. Les mots 40-79 dans les deux sont de fréquence moyenne.

### Démo: fonctionnalités continues

代码会生成类似于 Iris的数据(3 个类别、4 个特征、Gaussian clusters) ――GaussianNB Utilisez chaque classe de moyenne valeur et de différence pour effectuer une classification。 chaque classe a un centre différent(média vecteur) et un degré différent de dispersion(variance),模拟现实数据中各类测量值系统性不同的情况。

Il a aussi montré:
- **Smoothing comparison：**Utilisation de différents types de formation de valeur alpha, démontrant l'effet de l'allégement de la force sur le taux de précision.
- **Training size experiment：** Avec la croissance des données de formation de 20 échantillons à 1600 échantillons, le taux de précision de la NB s'améliore.
- **Confusion matrix：**Chaque catégorie de précision, rappel et score F1, pour montrer NB 在哪里犯错──

### Vite de prédiction

Naïf Bayes 预测 est une multiplication de la Matrice.$n$Je suis un peu dégoûté.$d$- Je suis un homme.$k$个类别:
- MultinomialNB: une fois Matrice multipliée $(n \times d) \mathbin{@} (d \times k) = O(n \cdot d \cdot k)$
- GaussianNB:$n \cdot k$Deuxièmement, le Gaussian PDF 求值, chaque fois qu'il est couvert $d$个特征 = $O(n \cdot d \cdot k)$

Les deux sont tous deux linéaires à chaque dimension. En comparaison avec KNN, il faut calculer la distance de tous les points d'entraînement ou SVM du noyau RBF.

## Utilisez-le
Les deux variations sont utilisées de la même manière:

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB

gnb = GaussianNB()
gnb.fit(X_train, y_train)
print(f"GaussianNB accuracy: {gnb.score(X_test, y_test):.3f}")

mnb = MultinomialNB(alpha=1.0)
mnb.fit(X_train_counts, y_train)
print(f"MultinomialNB accuracy: {mnb.score(X_test_counts, y_test):.3f}")
```

Utilisation de la classification du texte:

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

`naive_bayes.py`Le code central sera comparé à partir de zéro à partir de la même base de données pour vérifier sa validité.

### TF-IDF avec Naive Bayes

Le nombre de mots ordinaires permettra à chaque mot qui apparaît de porter le même poids. Mais comme "le" et "est" les mots ordinaires de ce type apparaissent fréquemment dans chaque catégorie.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB(alpha=0.1)),
])
```

La valeur TF-IDF est non négative, donc elle peut être utilisée avec le MultinomialNB. La combinaison TF-IDF + MultinomialNB est l'une des lignes de base les plus fortes de la classification du texte.

### Utilisé dans le texte court de BernoulliNB

Pour les courts textes, les messages de chat, les tweets, les SMS, etc., BernouliNB peut être supérieur à MultinomialNB.

```python
from sklearn.naive_bayes import BernoulliNB
from sklearn.feature_extraction.text import CountVectorizer

text_clf = Pipeline([
    ("vectorizer", CountVectorizer(binary=True)),
    ("classifier", BernoulliNB(alpha=1.0)),
])
```

Compte Vectorizer 中的 `binary=True`Le signage va transformer tous les comptes en 0/1── il n'y a pas de compte, BernouliNB  encore en marche, mais il voit ce qui n'est pas le compte conçu pour lui──

### Calibration NB Probabilités

NB 概率 de formation est très faible.$P(\text{垃圾邮件}) = 0.95$Si vous avez besoin d'une estimation de probabilité fiable, par exemple, pour définir une valeur ou une combinaison avec d'autres modèles, veuillez utiliser le CalibratedClassifierCV de sklearn:

```python
from sklearn.calibration import CalibratedClassifierCV

calibrated_nb = CalibratedClassifierCV(MultinomialNB(), cv=5, method="sigmoid")
calibrated_nb.fit(X_train, y_train)
proba = calibrated_nb.predict_proba(X_test)
```

Cette régularisation se traduira par une régression logistique, qui se compose de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur.

### Les gotches communes

1. **负特征值。**Si vous avez une valeur négative (par exemple, TF-IDF ou des caractéristiques post-standardisation dans certaines configurations), veuillez modifier la valeur GaussianNB ou la rendre normale.

2. **零方差特征。**GaussianNB se démarque par différence. Si une catégorie de caractéristiques de différence est de zéro, toutes les valeurs sont les mêmes, la probabilité de calcul se pose.

3. **类别不平衡。**Si 99% de la messagerie est non spam, avant $P(\text{非垃圾邮件}) = 0.99$会非常强, jusqu'à ce que vous ayez supprimé la preuve de probabilité. Vous pouvez manuellement définir les paramètres de classe prioritaire, ou utiliser les paramètres de classe prioritaire du sklearn.

4. **特征缩放。**La BNB multivariale n'a pas besoin d'échelle (en anglais) et la BNB gaussienne n'a pas besoin d'échelle (en anglais).

## Je le livre.
Le cours est ouvert à:
- `outputs/skill-naive-bayes-chooser.md`Une compétence de décision utilisée pour choisir correctement NB 变体
- `code/naive_bayes.py`: à partir de zéro réalisé de la NB multinomial et de la NB gaussienne, et ne contient pas de calcul par rapport à

### Quand Bayes échoue

Lorsque l'hypothèse d'indépendance entraîne une erreur de classement (pas seulement une erreur de probabilité) NB va échouer.

1. **强特征交互。**Si la catégorie dépend de la combinaison de deux caractéristiques, et non de la combinaison d'une seule caractéristique, la NB se trompera complètement.

2. **高度相关且 evidence 相反的特征。**Si les caractéristiques A sont orientées vers le "spam", les caractéristiques B sont orientées vers le "non-spam", mais A et B sont totalement liées, NB verra qu'il n'y a pas de preuve de conflit.

3. **非常大的训练集。**Lorsque les données sont suffisamment nombreuses, des modèles discriminatifs tels que la régression logistique apprendront à atteindre la limite de la décision réelle, et dépassent les N.B.

En pratique, pour la classification du texte, ces modes d'échec ne sont pas fréquents. Les erreurs de l'hypothèse d'indépendance sont souvent mutuellement compensées. Pour les données de tableau de caractères liés à une faible quantité de caractères, la régression logistique ou les modèles basés sur des arbres sont préférés.

## 练习
1. **Smoothing experiment。**Dans les données de texte, utiliser alpha  valeurs 0.01、0.1、1.0、10.0 和 100.0  entraînement MultinomialNB── dessiner précision par rapport à alpha── performance Où atteindre le sommet? Pourquoi très élevé alpha 会伤害性能?

2. **Feature independence test。**取一个真实文本数据集──选择两个明显相关词("machine"和"learning")──计算 $P(\text{词}_1 \mid \text{类别}) \cdot P(\text{词}_2 \mid \text{类别})$,并与 $P(\text{词}_1 \text{ 且 } \text{词}_2 \mid \text{类别})$Comparer l'hypothèse d'indépendance avec l'erreur grave.

3. **Bernoulli implementation。**扩展代码, ajouter une classe BernoulliNB──将包-of-words 转换为二值(present/absent), et mettre en valeur la précision de la version de données avec la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version de la version.

4. **NB vs Logistic Regression。**Dans le texte, les deux sont formés. De 100 échantillons de formation à partir, ils augmentent progressivement à 10 000.

5. **Spam filter。**构建一个完整的垃圾分类器:tokenize 原始邮件文本、构建词汇、创建字包功能、训练多语数NB,并使用精度和回忆 评估(不只是精度为什么?)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Naive Bayes | “简单的概率 classifier” | 一个使用 Bayes' theorem，并假设给定类别后特征 conditionally independent 的 classifier |
| Conditional independence | “特征彼此不影响” | $P(A, B \mid C) = P(A \mid C) \cdot P(B \mid C)$——一旦知道 $C$，知道 $B$ 不会告诉你关于 $A$ 的任何新信息 |
| Laplace smoothing | “Add-one smoothing” | 给每个特征添加一个小计数，防止零概率主导预测 |
| Prior | “看到数据之前你相信什么” | $P(\text{类别})$——观察任何特征之前，每个类别的概率 |
| Likelihood | “数据拟合得有多好” | $P(\text{特征} \mid \text{类别})$——如果类别已知，观察到这些特征的概率 |
| Posterior | “看到数据之后你相信什么” | $P(\text{类别} \mid \text{特征})$——观察到特征后，类别的更新概率 |
| Generative model | “建模数据如何生成” | 学习 $P(X \mid Y)$ 和 $P(Y)$，然后使用 Bayes' theorem 得到 $P(Y \mid X)$ 的模型 |
| Discriminative model | “建模 decision boundary” | 不建模 $X$ 如何生成，而是直接学习 $P(Y \mid X)$ 的模型 |
| Log probability | “避免 underflow” | 使用 $\log P$ 而不是 $P$，防止许多小数相乘后在浮点数中变成零 |

## 延伸阅读
- [scikit-learn Naive Bayes docs](https://scikit-learn.org/stable/modules/naive_bayes.html) 三种变体 et ses détails mathématiques
- [McCallum and Nigam, A Comparison of Event Models for Naive Bayes Text Classification (1998)](https://www.cs.cmu.edu/~knigam/papers/multinomial-aaaiws98.pdf) 文中 Multinomial et comparaison classique de Bernoulli
- [Rennie et al., Tackling the Poor Assumptions of Naive Bayes Text Classifiers (2003)](https://people.csail.mit.edu/jrennie/papers/icml03-nb.pdf)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Ng and Jordan, On Discriminative vs. Generative Classifiers (2001)](https://ai.stanford.edu/~ang/papers/nips01-discriminativegenerative.pdf) provable NB  收 快于 LR  在数据较少时时
