# Produit modèle de surveillance: données flottantes et concepts flottantes

> Le modèle déployé peut être défaillant en cas d'erreur de déclaration. En réalité, le modèle s'écarte progressivement des données de formation, mais il continue de revenir en nombre, seul le contrôle peut révéler cette différence.

**Type:** Build
**Languages:** Python
**Prerequisites:** 阶段 2，第 09 课（模型评估）、第 16 课（异常检测）和第 19 课（ML 系统设计）
**Time:** 约 110 分钟

## Objectif de l'apprentissage

- En système santé ∞ input ∞ prédiction et résultat ∞ 4 niveaux de sélection de signaux de surveillance
- Selon la partie des variations de la distribution commune, la différence entre la différence de variation et la différence de conception
- À partir de zéro réalisation de l'indice de stabilité des groupes 双样本 Kolmogorov-Smirnov 统计和卡方检查
- Comparer la fenêtre de référence fixe avec la fenêtre actuelle de glissement, expliquer comment la taille de la fenêtre affecte le bruit et le retard
- conception combinée de la quantité d'effet ∆ plusieurs contrôles de correction et de la continuité des règles de mise en garde, de limitation de l'erreur de déclaration
- Juge quelles délocations doivent être retravaillées quelles nouvelles étiquettes doivent être traitées

##  problématique

Un modèle de paiement risque avec un taux d'exactitude de 95% sur le marché. Deux mois plus tard, la campagne de marketing a amené des achats plus élevés aux utilisateurs.

Tout au long du processus, le modèle de service pour chaque demande est de retour HTTP 200── retard normal,日志 sans erreur── le premier signe de problème est un rapport de refus financier quelques semaines plus tard, alors que la perte est déjà survenue──

 Le service de contrôle de logiciels est-il réactif, le modèle de contrôle de contrôle est-il toujours correct, et les données sont-elles encore telles que celles de l'entraînement ?  Le cours est consacré à la construction de statistiques, de fenêtres et de stratégies de surveillance.

## 核心概念

###  surveiller quoi

La surveillance de quatre niveaux. Les trois premiers niveaux fournissent des précautions précoces, seulement le quatrième niveau de mesure est correct, mais il arrive plus tard.

| 层面 | 信号 | 何时可用 | 回答的问题 |
|---|---|---|---|
| 系统健康 | p50/p99 延迟、错误率、吞吐量、内存 | 立即 | 服务是否响应？ |
| 输入 | 各特征分布、缺失率、模式、新类别 | 立即 | 线上数据是否像训练数据？ |
| 预测 | 分数分布、正预测比例、默认答案占比 | 立即 | 模型行为是否与以前一致？ |
| 结果 | 准确率、精确率、校准度、业务指标 | 标签延迟后 | 模型是否仍然正确？ |

Cette classe traite principalement de la surveillance des entrées, car elle est disponible avant l'arrivée des étiquettes.

### 3 catégories

输入 `x`Et les étiquettes`y`La distribution commune peut être écrite sous deux formes:

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

Chaque classe de déplacement change différents facteurs:

| 漂移 | 变化部分 | 保持不变的部分 | 支付示例 | 能观察到的监控器 |
|---|---|---|---|---|
| 协变量漂移 | `P(x)` | `P(y \| x)` | 高购物金额的应用用户变多 | 输入监控 |
| 先验漂移 | `P(y)` | `P(x \| y)` | 攻击期间欺诈率翻倍，但欺诈特征不变 | 预测与结果监控 |
| 概念漂移 | `P(y \| x)` | 输入可以不变 | 相同购物金额对应不同欺诈风险 | 只有结果监控 |

Gama et autres`P(y | x)`La modification est appelée "true conception漂移, ne changera pas".`P(y | x)``P(x)`Leur complète description est également répartie en temps par modèle de déménagement en突发、增量、渐进和概念复现──

Le changement de couleur n'est pas nécessairement nocif.`P(y | x)`Les données de référence sont disponibles pour les données de référence, mais les données de référence sont disponibles pour les données de référence.

### 延迟标签

结果出现在预测后──延迟取决于问题:

| 问题 | 标签何时到达 |
|---|---|
| 广告点击 | 数秒后 |
| 未来 30 天流失 | 30 天后 |
| 银行卡欺诈 | 拒付到达时，通常数周后 |
| 贷款违约 | 数月或数年后 |

Pendant la période de retard, vous avez des entrées et des prévisions, mais aucun résultat.

### 参考窗口与当前窗口

Chaque déménagement est comparé à deux échantillons:

- **参考窗口。**DATA de formation, ou un épisode de production vérifié artificiellement ∞
- **当前窗口。**Les derniers événements, ça peut être récent.`N`C'est aussi récent.`T`Je suis là.

La vitre de glissement est une forme de substitution: la vitre de glissement réagit rapidement, mais facilement détecte le bruit; la vitre de glissement est stable, mais plus tard rapporte des changements.

Les produits sont généralement vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes, les produits sont vendus en deux périodes et les produits sont vendus en deux périodes.

### Indice de stabilité du groupe

Les données de référence sont basées sur les évaluations de crédit. Les données de référence sont généralement divisées en 10 boîtes, selon les 10 chiffres de référence, de sorte que chaque boîte contient 10% de l'échantillon de référence.

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

Le PSI est homogène, égal à la distribution actuelle de la distribution de référence KL 散度, plus la distribution inversée KL 散度。

 Dans la pratique, l'explique de la zone fixe habituelle PSI: inférieure à 0,1 pour la stabilité, 0,1 à 0,25 pour la déviation moyenne, supérieure à 0,25 pour la déviation significative.

### Kolmogorov-Smirnov 统计量

双样本 KS 统计量 `D`est la plus grande différence verticale entre deux fonctions de distribution cumulée d'expériences:

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

样本完全相同时 `D`Pour 0, totalement non surchargé pour 1,.. il n'a pas besoin de la boîte,..p valeur par Kolmogorov`n * m / (n + m)`Je l'ai reçu.

La différence de la taille de l'échantillon est très grande, même si elle est sans signification pratique, elle rend la valeur de la valeur de l'échantillon proche de zéro.`D`En tant qu'effet, seulement`D`Et ils sont tous à la hauteur de leurs conditions de valeur.

### 类别 Caractéristiques du test de carte

Pour les caractéristiques de catégories de paiement, construire deux lignes de table pour chaque catégorie de l'échantillon.

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

Pour le`k`个类别,检验自由度为 `k - 1` Les classes qui apparaissent dans les fenêtres actuelles contribuent à des éléments plus importants, de sorte que le test peut répondre à la nouvelle valeur.`chi2 / grand_total`De la racine carrée.

### 告警值与误报

Il n'y a pas de changement, chaque test est toujours en cours.`alpha`Le taux d'erreur de réception de 50 caractéristiques de l'inspection par heure.`alpha = 0.05`Même si cela ne change pas, on s'attend à ce qu'il y ait 60 erreurs par jour.

Quatre règles pour que les informations à la police soient utiles:

1. **多重检验校正。**Bonferroni 校正将 `alpha`À part le nombre d'expériences, la présentation sera complète.`alpha`设为0.01, distribué à deux tests, donc chaque test utilise 0.005──
2. **要求足够的效应量。** seulement PSI `D`Ou le V de Cramér dépasse aussi la valeur de la police.
3. **要求持续性。**连续 `k`个窗户出现漂移才告警──演示使用 `k = 2`Il y a une autre.
4. **区分警告与告警。**- Attention à l'appareil.

 Exposition de la règle 2  Effets: une carte de la fenêtre propre a une valeur de p de 0,0009, inférieure à celle de l'examen unique `alpha`Mais son V de Cramér est inférieur à 0,1 et donc la stratégie ne fait que consigner des avertissements, pas émettre des avertissements.

### Conditions de rééducation

Il existe trois modes de réentraînement habituels:

- **定期。**Chaque semaine ou chaque mois, il faut attendre, mais sans changer.
- **漂移。**Les importations de caractéristiques importantes sont plus importantes que les importations de valeur.
- **性能。**Les résultats sont inférieurs à la valeur de référence en matière de tolérance réduite.

漂移类型决定重新训练能解决什么:

| 漂移 | 有用的行动 |
|---|---|
| 协变量漂移，但准确率稳定 | 通常无需处理，继续观察结果指标。 |
| 协变量漂移进入数据稀少区域 | 用覆盖这些区域的近期数据重训 |
| 先验漂移 | 重新校准分数，或调整决策阈值 |
| 概念漂移 | 先收集新标签。用旧标签重训只会再次学到旧概念。 |

Après le nouveau entraînement, on teste un nouveau modèle sur les données de la dernière étiquette. Il est ensuite publié avec les images du cours de conception du système, puis la fenêtre de référence est réinitialisée pour les données du nouveau entraînement.

```figure
mlprod-drift-psi
```

## De la construction à la construction

`code/main.py`Le code central est uniquement utilisé par les normes.

### 1ère étape: la partition de la boîte et la PSI

Le nombre de boîtes de bord est de référence.`bisect_right`Trouver chaque valeur de la boîte.

```python
def quantile_edges(reference: list[float], bins: int = 10) -> list[float]:
    ordered = sorted(reference)
    n = len(ordered)
    edges = [ordered[min(n - 1, (n * i) // bins)] for i in range(1, bins)]
    return sorted(set(edges))


def psi_from_fractions(expected: list[float], actual: list[float], eps: float = 1e-4) -> float:
    total = 0.0
    for e, a in zip(expected, actual):
        e, a = max(e, eps), max(a, eps)
        total += (a - e) * math.log(a / e)
    return total
```

### Section 2 步:KS 统计量 et sa valeur

Simultanément, il est possible de traiter correctement les valeurs de chaque rangement, d'abord les répétitions de tous les valeurs traversées entre les deux groupes, puis de comparer la proportion cumulée.

```python
def ks_statistic(sample_a: list[float], sample_b: list[float]) -> float:
    a, b = sorted(sample_a), sorted(sample_b)
    n, m = len(a), len(b)
    i = j = 0
    d = 0.0
    while i < n and j < m:
        x = min(a[i], b[j])
        while i < n and a[i] <= x:
            i += 1
        while j < m and b[j] <= x:
            j += 1
        d = max(d, abs(i / n - j / m))
    return d
```

P  valeur d'utilisation Kolmogorov Répartition de la classe de nombre `2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`, parmi lesquels `lambda = sqrt(n * m / (n + m)) * D`Il y a une autre.

### Section 3 - Carence

`chi2_sf`通过正则化上不完全马函数计算卡方生存函数,小参数使用级数,大参数使用连分式──`chi_square_test`构建两行表、计算统计量,并返回 p 值和 Cramér's V──

```python
def chi_square_test(reference_counts: dict[str, int], current_counts: dict[str, int]) -> ChiSquareResult:
    categories = [c for c in sorted(set(reference_counts) | set(current_counts))
                  if reference_counts.get(c, 0) + current_counts.get(c, 0) > 0]
    rows = [[reference_counts.get(c, 0) for c in categories], [current_counts.get(c, 0) for c in categories]]
    row_totals = [sum(r) for r in rows]
    grand = sum(row_totals)
    if len(categories) < 2 or 0 in row_totals:
        return ChiSquareResult(0.0, 0, 1.0, 0.0)
    statistic = 0.0
    for col, _ in enumerate(categories):
        col_total = rows[0][col] + rows[1][col]
        for r in range(2):
            expected = row_totals[r] * col_total / grand
            statistic += (rows[r][col] - expected) ** 2 / expected
    dof = len(categories) - 1
    return ChiSquareResult(statistic, dof, chi2_sf(statistic, dof), math.sqrt(statistic / grand))
```

### Section 4 步: fenêtre et contrôleur de déménagement

`SlidingWindow`- Je veux le faire .`deque`保存 récentes `size`- Je suis désolé.`DriftMonitor`Il suffit de compter une fois pour chaque référence.`check`Métode pour chaque caractéristique numérique retourner PSI `D`和 KS p 值,并为每类特征返回卡方检测结果──

### Section 5 - stratégie de police

策略将每组指标转为等级,并逐信号统计连续漂移窗口数:

```python
def level(self, metrics: dict[str, float]) -> str:
    if "psi" in metrics:
        if metrics["psi"] >= self.psi_drift or (metrics["ks"] >= self.ks_drift and metrics["ks_p"] < self.alpha):
            return "drift"
        return "warn" if metrics["psi"] >= self.psi_warn else "ok"
    if metrics["p"] < self.alpha and metrics["v"] >= self.min_cramers_v:
        return "drift"
    return "warn" if metrics["p"] < self.alpha else "ok"
```

`update`Retour à la fenêtre dans le nombre de fois de réaction`ALERT`, à la première fenêtre nette de la police après l' annonce de retour .`resolved`Il y a une autre.

### Section 6 - Inject dans le flux de données

Les données contiennent 9000 événements de paiement, chaque événement ayant`amount`- Je suis là.`channel`Et la fraude`label`Il est divisé en quatre parties:

| 事件 | 金额 | 渠道比例（app、store、web） | 标签边界 | 变化 |
|---|---|---|---|---|
| 0 到 2999 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 参考期 |
| 3000 到 4999 | 均值 118，标准差 24 | 60%、10%、30% | 120 | 协变量漂移 |
| 5000 到 6499 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 恢复正常 |
| 6500 到 8999 | 均值 100，标准差 20 | 35%、15%、50% | 105 | 概念漂移 |

Le modèle a été adapté à des événements antérieurs à 2000`amount`值──窗口大小为 500 事件,每次移动 250 个──标签延迟 500 事件到达──

```bash
python3 code/main.py
```

```console
  end    PSI   KS D   chi2 p    acc  levels (amount/channel/accuracy)  events
 3000  0.010  0.041  3.0e-01  0.932  ok/ok/ok
 3250  0.152  0.163  7.6e-06  0.924  drift/warn/ok
 3500  0.463  0.298  2.8e-26  0.936  drift/drift/ok                     ALERT amount
 3750  0.609  0.343  3.5e-35  0.942  drift/drift/ok                     ALERT channel
 ...
 5500  0.026  0.044  2.6e-01  0.898  ok/ok/ok                           resolved amount, resolved channel
 ...
 7250  0.040  0.048  7.1e-01  0.848  ok/ok/drift
 7500  0.022  0.039  6.1e-01  0.778  ok/ok/drift                        ALERT accuracy
```

Résultat de la compréhension:

- **协变量漂移。**Depuis l'événement 3000,`amount`Les résultats de l'enquête ont été obtenus en raison de l'absence de changement des règles de marque, le taux de précision étant de 0,89 à 0,95
- **恢复。**输入在 5000 恢复正常, deux déclarations sont en 5500 解除.
- **概念漂移。**À partir de 6500 , l'entrée n'a pas changé, donc l'entrée de contrôle reste silencieuse ∙ Le taux de précision est passé de 0,946  à 0,76 ∙ 0,79 ∙ Le taux de précision est passé à 7500 ∙ Comparé à 1000 ∙ événements de changement, dont 500 ∙ événements causés par le retard de l'étiquette ∙

## Utilisation de l'outil

**scipy。** `scipy.stats`La réalisation de ces deux tests, la statistique et la réalisation de zéro sont conformes.

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

Nous sommes en train de faire des essais.`ks_statistic`- Je suis là.`chi_square_test`Avec l'échantillon de 200 ensembles, la différence relative entre la valeur de KS et la valeur de KS atteint le plus de 18% de la valeur de KS; la différence maximale se produit dans une très petite valeur de KS.

La différence provient du procédé. Notre code utilise la limite Kolmogorov.`ks_2samp`Utilisez des méthodes précises. Le mode de progression utilise une distribution d'échantillons limitée, et il sera efficace de prendre des échantillons entiers.`chi2_contingency`L'adoption par défaut de Yates 连续性校正, donc la statistique de cette situation est également différente.

**监控库。**Plusieurs sources ouvertes ont mis ces tests et rapports en jeu:

- **Evidently**按列选择漂移检验──参考数据不超过1000 行时,数值列使用KS,类别列使用卡方──数据更大时,使用Wasserstein 距离和Jensen-Shannon 散度,值为0.1──PSI est l'une des autres méthodes à choisir──
- **NannyML**Dans le cadre de la première évaluation de la performance du modèle, le modèle utilise la probabilité de prévision du modèle, exige la probabilité d'une bonne éducation.
- **TensorFlow Data Validation**Comparer les données de l'équipe de formation avec les données de service, ce qui sera discuté dans le cours de stockage des caractéristiques.

Les outils de calcul sont présentés par le code zéro. Ils fournissent un stockage, une régulation, un tableau de bord et plus de tests.

 Pour les applications de la LLM, étape de l'infrastructure [LLM 可观测性课](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md)介绍 suivi et évaluation outils.

## 交付成果

本课产 出 `outputs/skill-drift-monitoring.md` Cette compétence est utilisée pour la surveillance du nouveau modèle de planification et de diagnostic des délocalisations: quel niveau a provoqué des délocalisations, quel type de délocalisations correspond à la preuve, et comment attendre, recalculer, collecter des étiquettes ou les réapprendre.

## 练习

1. Utilisation des fenêtres de 200 et 2000  événements de données de flux.
2.  mise en place `n_tests=1`- Je suis là.`patience=1`- Je suis là.`min_cramers_v=0`Le nombre de policiers déclarés à la phase de nettoyage est estimé entre 5000 et 6500.
3. Ajouter une valeur moyenne par 100 événements augmentant 0,01 des caractéristiques, trouver le PSI et KS 哪哪个先响应──
4. Dans la même boîte de séparation réaliser la distance Jensen-Shannon, dans chaque fenêtre par rapport à PSI.
5. Pour le modèle de la proportion de prédiction correcte, ajouter la surveillance, expliquer pourquoi il reste calme pendant le concept de déménagement.

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|----------------|----------------------|
| 数据漂移 | “数据变了” | 相较参考窗口，输入、预测或标签分布发生变化 |
| 协变量漂移 | “出现新类型用户” | `P(x)` 变化，而 `P(y \| x)` 不变 |
| 先验漂移 | “正样本更多了” | `P(y)` 变化，而 `P(x \| y)` 不变，也称标签偏移 |
| 概念漂移 | “游戏规则变了” | `P(y \| x)` 变化，相同输入对应不同正确答案 |
| 参考窗口 | “基准数据” | 与每个当前窗口比较的固定样本，通常是训练数据 |
| PSI | “稳定性分数” | 对各箱的“当前占比减参考占比”乘两者比值的对数求和，具有对称性 |
| KS 统计量 | “KS 检验” | 两个经验累积分布函数之间的最大差距 |
| Cramér's V | “类别效应量” | 将卡方统计量缩放到 0 到 1 范围的量 |
| 标签延迟 | “真实答案晚些到” | 从预测到真实结果到达之间的时间 |
| 告警疲劳 | “通知太多” | 大多数告警都是误报，导致人们忽略告警 |

## 延伸阅读

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation): réel et imaginaire
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953): pour le dépistage des démographies
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785):漂移检测、理解和适应方法
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/): le nombre de échantillons et de fractions d'échantillons
- [scipy.stats.ks_2samp documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html): double échantillon méthode de vérification de la valeur de KS
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift): selon le type de liste et la taille des données sélectionner par défaut
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html): CBPE  et ses faux-sets
