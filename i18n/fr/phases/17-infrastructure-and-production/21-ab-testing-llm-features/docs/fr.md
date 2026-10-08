# Tests A/B LLM  fonction  GrowthBook、Statsig

> Les tests A/B traditionnels ne sont pas pour des raisons indéterminées de LLM construction de ∙ Key difference:evals 回答模型能完成这项工作吗?A/B tests 回答用户意意吗?两者都必不可少;靠氛围检查 发布已结束.**Statsig**(en anglais seulement)**GrowthBook** open-source 倉庫-native Bayesian + Frequentist + Sequential 引擎、CUPED、SRM 检查、Benjamini-Hochberg + Bonferroni 校正── votre choix dépend de la préférence de votre organisation pour le SQL, ainsi que de la pertinence de votre organisation par l'OpenAI 收购──

**Type:** Learn
**Languages:** Python (stdlib, toy sequential test simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 20 (Progressive Deployment)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 区分 evals(模型能完成这项工作吗) et les tests A/B(用户在意吗)
- 列举三个可测试轴线(prompt、model、paramètres),并为每个轴线选择指标──
- 解释 CUPED、test séquentiel 和 corrections de comparaison multiples de Benjamin-Hochberg
- 基于 de stockage-SQL 姿态和企业收购立场, entre Statsig ou GrowthBook 进行选择──

##  problématique
Tu as publié un nouveau modèle, mais le taux de conversion n'a pas changé, ou le modèle est démodé, ou le changement est trop petit pour être vérifié ?

Evals répond à la question de savoir si le modèle peut accomplir des tâches sur un ensemble de balises. Ils ne répondent pas à la question de savoir si l'utilisateur préfère la sortie. Seule une expérience en ligne contrôlée peut répondre à cette question, et en plus, la prémisse est que l'expérience a suffisamment de puissance, contrôle l'incertitude, et fait des corrections à plusieurs comparaisons.

## 概念
### Tests Evals contre test A/B

**Evals** 离线、带标签集合、judge(rubrique、LLM-as-judge或人工)  Réponse: Dans cette distribution fixe, le rapport est correct / 有帮助 / 安全?

**A/B test** En ligne 、 vrais utilisateurs 、 distributions de données  Réponse:  Les nouveaux changements ont-ils favorisé l'indicateur de niveau d'utilisateur clé ?

两者都需要──Evals 在曝光前捕捉回归;A/B 在上线后确认产品影响──

### Qu' est-ce que vous devez tester ?

1. **Prompt engineering** 措辞、system-prompt 结构、示例──指标: taux de réussite des tâches、 user留存、cost/request──
2. **Model selection** GPT-4 contre GPT-3.5-Turbo contre Llama-OSS── 指标: précision(任务) + coût/demandée + latence P99──多目标──
3. **Generation parameters** température top-p、max_tokens。

### CUPED  方差降低

Expériences contrôlées utilisant des données pré-expérientielles.

实现:Statsig 和 GrowthBook ont été réalisés.

### Tests séquentiels

经典 A/B 假设固定样本量──Sequentielle tests(peek-and-decide) 在重复查看时控制虚假阳性率──Always-valid sequential procedures(mSPRT、Howard's confidence sequences) 让你在明确赢家出现时提前停止──

### Poids de la correction

Dans un test de 95%, 20 tests A/B sont effectués avec une certaine confiance, et un faux positif est produit par hasard.

### Résultats de l'analyse

Le hash d'affectation distribuera l'utilisateur au changement. Si 50/50 de la partition est réellement obtenue 47/53, indique quelque chose est mal.

### Statsig vs GrowthBook

**Statsig**- Le numéro de la liste:
- Il est également utilisé pour la gestion de la gestion des ressources humaines.
- Tests séquentiels CUPED populations retenues 
- Engagement: drapeaux de caractéristiques + expérimentation + observabilité
- Le groupe a déjà voulu acheter des produits et n'a pas voulu ouvrir la propriété.

**GrowthBook**- Le numéro de la liste:
- Le programme est basé sur le logiciel Open Source (MIT); stockage natif (en anglais) (directement de Snowflake/BigQuery/Redshift 读取)
- En général, les échanges sont plus fréquents.
- Les corrections de CUPED、SRM、Bonferroni、BH。
- Autogestion ou cloud géré
- Pour les données, il est nécessaire de modifier le code de base.

### L'incertitude rend les résultats statistiques complexes

Comme un prompt, les résultats seront différents. Les calculs de puissance traditionnels  présuppose IID 观测.

### Résultats réels des affaires

- Modèle de récompense du chatbot 变体: +70% pour la durée du langage +30% 留存。
- Les lignes d'objet suivantes: fonction récompense 优化后 +1% CTR。
- Khan Academy Khanmigo: autour de la retardation et du taux de précision mathématique

### Avec le sens de la vie

Chaque ingénieur en chef peut dire qu'une fonction est publiée sans A/B, car elle se sent mieux. La plupart des équipes ont fait un retour sans remarquer depuis des mois.

### Tu devrais te rappeler le nombre

- Statsig 被 OpenAI 收购: $1.1B,2025 年 9 月。
- Le livre de croissance: open source MIT;bayésien + fréquentiste + séquentiel。
- CUPED 方差降低30 à 70%
- LLM non déterminé → +30-50% 样本量缓冲──


```figure
mx-sequential-test
```

## Utilisez-le
`code/main.py`模拟一个带有固定边界和序列边界的序列A/B test──展示序列 如何让你提前停止──

## Je le livre.
本课生成 `outputs/skill-ab-plan.md` Modification des caractéristiques, charge de travail, ligne de base, choix de plateforme, portes, taille d'échantillon

## 练习
1. 运行  référencement`code/main.py`Pour la conversion de 3% à la ligne de base, 5% de levage prévue, pour atteindre 80% de puissance, combien de volume d'échantillonnage est nécessaire ?
2. Pour un patient soignant  sur place                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
3. 设计一个A/B,测试 GPT-4 vs GPT-3.5 在成本-per-résolu-ticket 上的表现──primary metric、guardrail metric、secondaire 分别是什么?
4. Votre canary est passé, mais A/B montre -1,2% de conversion.
5. Pour une période préliminaire, le CUPED est appliqué à une période préliminaire de 60% de la période postérieure.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Eval | “offline test” | 对模型能力的带标签集合评估 |
| A/B test | “experiment” | 面向用户的在线随机比较 |
| CUPED | “variance reduction” | 用前期回归来降低方差 |
| Sequential test | “peek-ok test” | 允许提前停止的 always-valid procedure |
| Multiple comparison | “the family error” | 运行许多测试会放大 false positives |
| Bonferroni | “tight correction” | 将 α 除以测试数量 |
| Benjamini-Hochberg | “BH FDR” | false-discovery-rate 控制，较不保守 |
| SRM | “bad split” | Sample ratio mismatch；分配 bug |
| Statsig | “OpenAI owned” | 商业一体化平台，2025 年被收购 |
| GrowthBook | “the OSS one” | MIT warehouse-native 平台 |
| mSPRT | “sequential probability ratio test” | 经典 sequential procedure |

## 延伸阅读
- [GrowthBook — How to A/B Test AI](https://blog.growthbook.io/how-to-a-b-test-ai-a-practical-guide/)
- [Statsig — Beyond Prompts: Data-Driven LLM Optimization](https://www.statsig.com/blog/llm-optimization-online-experimentation)
- [Statsig vs GrowthBook comparison](https://www.statsig.com/perspectives/ab-testing-feature-flags-comparison-tools)
- [Deng et al. — CUPED](https://www.exp-platform.com/Documents/2013-02-CUPED-ImprovingSensitivityOfControlledExperiments.pdf)
- [Howard — Confidence Sequences](https://arxiv.org/abs/1810.08240)
