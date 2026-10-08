# Les normes de l'équité  群体、个体、反事实

> Les trois familles constituent l'équité 文献的结构──Gruppe équité:parité démographique,quotidiques égalisés,exactitude d'utilisation conditionnelle,équité  L'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de l'équipe de l'équipe de recherche de recherche de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de l'équipe de recherche de recherche de recherche de recherche de l'équipe de recherche de l'équipe de l'équipe de 2017): si dans le contexte contrefactif, la décision est maintenue, alors cette décision est juste pour l'individu. Le résultat théorique de 2024 est: la différence entre la précision et la précision existe en interne. Une méthode modèle-agnostique peut transformer le prédicteur optimal mais injuste en prédicteur CF, et faire perdre la précision.

**类型：**Apprenez à le faire
**语言：**Python (stdlib,comparaison à trois critères)
**先修：**Phase 18 · 20 ((bias),Phase 02 ((classique ML)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- Il y a trois critères d'équité de groupe: parité démographique, cotisations égalées, équité de précision d'utilisation conditionnelle, ainsi qu'un résultat impossible.
- 通过 Dwork et al. 2012 de la formule de Lipschitz 描述个人的公平──
- Décrire l'équité contrefactuelle et sa dépendance au graphique de causes.
- Expliquer les contrefaçons de rétractation, ainsi que pourquoi elles peuvent contourner l'intervention des attributs protégés 问题──

##  problématique

Leçon 20 Discussion est la mesure du biais. Leçon 21 Discussion est la définition de la mesure. Les normes d'équité des services. Ces trois familles ont donné des normes structurelles différentes. Un modèle peut être équitable en groupe, mais individuellement injuste, peut aussi être contrefactuellement équitable, mais inéquitable en groupe.

## 概念

### L'équité de groupe

- **Demographic parity.**P\Y=1\A=a) = P\Y=1\A=a'), pour tous les groupes de formation.
- **Equalized odds.**P(Y=1\\Y*=y, A=a) = P(Y=1\Y*=y, A=a')
- **Conditional use accuracy equality.**P\Y*=y\Y=y, A=a) = P\Y*=y\Y=y, A=a')

Impossibilité (Chouldechova, Kleinberg-Mullainathan-Raghavan 2017): dans les taux de base 不相等时, ces trois personnes ne peuvent pas être satisfaites simultanément.

### L'équité individuelle

Dwork et al. 2012── si pour une mesure de similitude spécifique à une tâche d, carte de décision f 满足 f x) - f x') <= L * d x, x'), dont L est une constante de Lipschitz, alors f  est individuellement juste──相似个体获得相似决策──

Ceci exige de définir d. C'est une question de politique, et non une question statistique.

### L'équité contrefactuelle

Kusner et coll. 2017― Si le modèle causal de la population est modifié de manière contrefactueuse, alors la décision est équitable contre la population.

Ceci nécessite un DAG causale. DAG est un choix de modélisation. La légitimité de l'équité contrefactuelle est aussi forte que la légitimité de ce DAG.

### Compromise entre la valeur de la valeur ajoutée et la précision

NeurIPS 2024 théorique:l'équité contrefactuelle et la précision prédictive  existent entre l'intermédiaire de l'offre ‒ une méthode modèle-agnostique ‒ peut transformer un prédicteur optimal mais injuste en prédicteur CF,并付出有界的精度成本── Cette précision coûte ‒ dépend du coefficient d'attributs sensibles du prédicteur optimal ‒ ‒

### Contrôts de rétractation

Les contrefaçons traditionnelles  nécessitent des interventions sur les attributs sensibles   Si cette personne est un autre sexe, la décision changera-t-elle 🏼

Contradiction des contrefactifs: ne pas intervenir dans les caractéristiques, mais se demander quelles composantes des caractéristiques réelles de cet individu produisent des résultats contrefactifs.

### Réconciliation philosophique

Les articles de blog ICLR 2024── sont en cause dans le graphique 时,满足某些 mesures d'équité de groupe 会含counterfactual fairness── ces trois familles ne sont pas juste entre elles; elles sont des facettes différentes de la même structure causale de base──

Ceci ne peut pas résoudre les théories de l'impossibilité (les taux de base n'étaient pas égaux, mais empêchaient l'équité de groupe simultanément) mais il montre que le groupe et l'individu/factuel semblent opposés, en partie parce qu'il n'y a pas de modèle de causalité clair et qu'il y a un artifact causé.

### Cette classe est située au milieu de la phase 18

Leçon 20 est la mesure du biais. Leçon 21 est la définition de l'équité. Leçon 22 est la vie privée.


```figure
an-fairness-trilemma
```

## Utilisez-le

`code/main.py`Construire un ensemble de données de classification binaire de jouets, qui contient un attribut sensible 和不相等的基率── dans un classifiateur simple, calculer la parité démographique, les cotes égalées et l'exactitude de l'utilisation conditionnelle.

## Je le livre.

本课会生成 `outputs/skill-fairness-criterion.md` déterminer une revendication ou une politique d'équité, identifier quel est le critère de sa revendication  déterminer si le modèle suivant est capable de satisfaire aux autres critères, ainsi que si cette revendication dépend de la DAG causale 

## 练习

1. 运行  référencement`code/main.py` rapport sur les trois mesures de groupe de données:  appliquer une réévaluation démographique-parité-ciblée et ré-rapporter

2. Utilisation de l'individualisation de l'équité de la mesure de Dwork et al. 2012                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

3. 阅读 Kusner et coll. 2017── Pour le score de résumé 构建一个简单的两特性因果 DAG,并识别它含的反事实性-公平性条件──

4. Les contrefacteurs de rétractation de 2024 论文 évité l'intervention des attributs protégés ∙ décrire un scénario qui est très important pour la conformité légale ∙

5. La réconciliation de la CIRR 2024 considère que l'équité de groupe et l'équité contrefactuelle sont des aspects différents de la même structure.`code/main.py`Le choix de trois critères, parmi les deux, explique qu'ils sont égaux en termes de prix.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Demographic parity | “equal rates” | P(Y=1 | A=a) 在群体之间相等 |
| Equalized odds | “equal TPR/FPR” | 群体之间相等的 true-positive 和 false-positive rates |
| Conditional use accuracy | “equal PPV/NPV” | 群体之间相等的 predictive values |
| Individual fairness | “Lipschitz condition” | 相似个体获得相似决策 |
| Counterfactual fairness | “causal alteration invariance” | 在 counterfactual attribute alteration 下决策保持不变 |
| Backtracking counterfactual | “explain via actuals” | Counterfactual 是从 outcome 向后推理，而不是从 attribute 向前推理 |
| Impossibility theorem | “the three conflict” | Chouldechova / KMR 2017：在 base rates 不相等时，group criteria 相互排斥 |

## 延伸阅读

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) équité individuelle
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) équité contrefactuelle
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056) impossibilité
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) nouvelles modalités d'interventions à attribut protégé
