# Autodéveloppement limité 设计

> Les études ont déjà reçu quatre primitives de boucles d'auto-amélioration utilisées pour lier les éléments à l'auto-amélioration. Les invariants formels doivent être créés à chaque édition. Les ancres d'alignement doivent être modifiées. Les contraintes multi-objectives doivent être créées pour chaque dimension.

**Type:** Learn
**语言：**Python (stdlib, boucle limitée avec vérification invariante)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

##  problématique

Le simulateur de course de la leçon 7 montre que les différences de vitesse de petite taille complétent une énorme différence. L'étude de cas DGM de la leçon 4 montre que le circuit peut manipuler activement ses propres évaluateurs.

ICLR 2026 RSI Workshop résumé (openreview.net/pdf?id=OsPQ6zTQXV) identifie quatre primitives de ce type. Les RSP de l'Anthropic v3.0 Lesson 19) et les FSF de DeepMind v3 Lesson 20) sont cités dans les seuils de capacité.

La réaction de l'informationiste est que ces mesures sont limitées. Elle limite la portée de tout système capable de prouver sa nature systémique ultérieure, et aucune conception ne ferme actuellement le problème.

## 概念

### Primitive 1: invariants formels

Invariante est une attribut qui doit être créé avant et après chaque auto-modification.

- Distribution des produits 以固定的宪章头为条件 (leçon 17)
- 没有工具调用 指向未授权的终点──
- La mémoire écrit 通过已记录、已签名的路径──
- Le module de l'évaluateur est haché avec la version approuvée.

Les invariants sont en train de se détériorer. Si une modification est proposée, elle sera rejetée.

La difficulté réside dans le choix des variables qui doivent être calculées en temps raisonnable pour assurer la sécurité.

### Primitive 2: ancres d'alignement

L'ancrage d'alignement est l'indivisible de l'objectif de la boucle 核心表示, est fixé en boucle 之外──exemple:

- Chaque invocation est faite à partir du texte constitutionnel en lecture seule.
- ▌l'évaluateur de référentiel indépendant doté d'un contrôle d'accès indépendant
- Il est signé par l'homme et chaque cycle, il est testé par un outil.

L'ancre a pour rôle d'empêcher la dérive objective. Le circuit peut améliorer la façon dont il poursuit son objectif, mais ne peut pas éditer l'objectif lui-même.

微妙的失败模式: même boucle non capable d'éditer l'ancrage, déjà en train de lire l'ancrage 方式发生漂移的循环 仍然可以重新解释它──Constitutional AI (Légation 17) 明确基于理性,用于处理新情境;解释漂移就存在于这个推理层中──ancrages sont une condition nécessaire, mais pas une condition suffisante──

### Première étape 3: contraintes multiobjectives

Il faut en même temps satisfaire à plusieurs contraintes difficiles de la boucle.

- Performance (indice de référence au niveau des tâches)
- Sécurité (évaluations de l'équipe rouge)
- L'équité (subgroupes sensibles)
- Robustesse ((Sets de test OOD ]], manipulation des entrées adverse)

 La modification ne sera acceptée que lorsque chaque contrainte sera établie.  Le gouverneur des coûts de la leçon 13 la considère comme une contrainte financière.

### Primo 4: détection de régression

Les scores de chaque cycle seront comparés à des distributions historiques. Ils dépassent la tolérance de la configuration.

Un usage pratique réalisé: stockage récent N 个周期 个任务分点――每个新周期 计算 per task delta――如果任意 delta 低于门值,则拒绝该周期并交由人评――

### 信息论限制

La complexité de Kolmogorov et le théorème de Lob sur le système capable de prouver la portée de sa nature ont établi la limite supérieure. La machine de Godel formelle de Schmidthub est la limite la plus élevée; actuellement, personne n'a encore réalisé la preuve inhabituelle. Les résultats de Lob indiquent que si un système prouvait que si je prouvais que je devais faire X, je ferais X, il ferait X sans prouver que je devais faire X, c'est un échec de référence auto-préhensible.

Cela signifie pour nos primitifs qu'ils ne peuvent pas fermer le problème de sécurité. Ils font que l'échec silencieux devient plus coûteux. Une boucle malveillante ou dérivé Si l'origine devait contourner l'échec manquant, il faut maintenant détruire activement un contrôle évident, ce qui est une signature plus facile à détecter.

### Un exemple qui a fonctionné

假设某某代理 提出一次编辑──gatting stack:

1. Contrôles invariables: hashes de module, manifeste d'autorisation d'outil, titre constitutionnel,
2. Vérifie l'ancrage: déclaration objective avec version ratification correspondant en octet ou sémantique)
3. Évaluation multi-objectif: axes de performance, sécurité, équité, robustesse,
4. Détection de régression: aucune axes de détérioration dépasse la tolérance.

Tout le monde doit passer, éditer, et tout échec sera suspendu.


```figure
bounded-gates
```

## Utilisez-le

`code/main.py`Dans la leçon 4, le jeu de style DGM s'effectue en fonction d'un cycle d'auto-amélioration limité, mais il y a quatre primitives superposées. Chaque primitive peut être activée ou désactivée de manière individuelle.

## Je le livre.

`outputs/skill-bounded-loop-review.md`L'Audit révise une boucle limitée proposée et évalue laquelle de ces quatre primitives a réellement été réalisée, plutôt que de se limiter à ce qu'elle affirme avoir réalisé.

## 练习

1. Dans tous les cas de fonctionnement primitifs .`code/main.py` Confirmer la boucle  encore en mesure de s'améliorer dans la métrique primaire, tout en ne laissant pas le hack gagner 

2. 禁用回归检测――construire une entrée, ce qui entraîne une perte de capacité silencieuse 接受──

3. 禁用 multi-objectif restriction── démonstration boucle dans l'axe de performance 上收, simultanément l'axe de sécurité 下降──

4. Pour l'agent de codage, concevez une ancre d'alignement, comment vérifier ?

5. 阅读 ICLR 2026 RSI Workshop résumé。选择四个原始的中一个,并为当前的状态艺术 提出一个具体改进──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Invariant | “始终为真的属性” | 每次 edit 前后由外部代码检查的属性 |
| Alignment anchor | “固定的目标” | 位于 loop edit surface 之外的不可变 core-goal representation |
| Multi-objective constraint | “所有 axes 都必须成立” | Performance、safety、fairness、robustness——全部必需 |
| Regression detection | “下降时暂停” | 当历史 metric deltas 暗示 capability loss 时暂停 loop |
| Kolmogorov bound | “信息论限制” | 限制系统能够证明其自身后继系统性质的范围 |
| Lob's theorem | “self-reference 陷阱” | 系统可以在没有证明自己应该做某事的情况下，依据“我应该”采取行动 |
| Gate stack | “分层检查” | 多个 primitives 的组合；任何 failure 都会拒绝 edit |
| Bounded improvement | “mitigation，而不是 proof” | 提高 silent-failure 成本；不会关闭 safety problem |

## 延伸阅读

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV) Quatre primitives de la réception
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) seuils de capacité multiobjectifs。
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) Le suivi de l'alignement trompeur  comme primitif invariant
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html) Les ancêtres de ces primitifs sont formels.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) Ancrage d'alignement fondé sur la raison。
