# Surveillance à l'échelle et généralisation faible à forte

> Burns et al.(OpenAI Superalignment,Weak-to-Strong Generalization,2023) propose une tâche de substitution du problème de la superalignement: utiliser des étiquettes générées par des modèles plus faibles pour affiner un modèle fort。 Si un modèle fort peut être correctement généralisé dans un mauvais contrôle imparfait, alors le processus d'alignement des échelles humaines actuelles peut être étendu à un système superhumain。 Surveillance à l'échelle et W2SG sont complémentaires。 Débat de récompense de surveillance à l'échelle et de modélisation récursive、 décomposition des tâches) améliore la capacité du surveillant à être efficace, ce qui lui permet de suivre le modèle supervisé。 W2SG assurer une bonne modélisation de la capacité fournie par le surveillant à gérer correctement tout le monde。 Date Aide W2SivGiv: 2134, 1225 ans.

**类型：**Apprendre à apprendre
**语言：**Python (stdlib, simulateur de la faille W2SG)
**先修：**La phase 18 · 01(suivi des instructions)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- 定义可扩展监督和弱到强的概括,并解释它们如何互补──
- 描述 Burns et al. 2023: utilisation des étiquettes de GPT-2 pour affiner le GPT-4。
- 解释 performance gap recouvré (PGR) indicator et son contenu de mesure
- Il existe trois principaux mécanismes de surveillance évolutif (débat, modélisation récursive des récompenses, décomposition des tâches) ainsi que leurs propres avantages.

##  problématique

Jusqu'à présent, chaque type d'alignement de la phase 18 技术都假设监督者能够评估模型行为──当模型达到超人类水平时,监督者就成了弱环节──超级排列的问题是: un监督者较弱能否可靠地产生一个更强且一致的模型?

Burns et al. ont réduit ce problème à un ensemble d'expériences exploitables: avec un modèle faible, surveiller un modèle fort, mesurer combien de capacités un modèle fort a pour pouvoir se conserver sous une surveillance faible.

## 概念

### W2SG:Burns et al.

- 弱模型:GPT-2 级别──
- 强模型:GPT-4 级别──
- 目標: tâche sur le plafond de GPT-4

Le processus:
1. 获取弱模型在某任务上零射 预测──
2. Dans les données de faible étiquette, la mise en forme est très forte.
3. 衡量精确率 强模型的精确率──

基线:弱模型自身的准确率、强模型在金标签 监督下的天花板──

Gap indicator:Performance Gap Recovered (PGR) = (finement réglé - faible) / (plafond - faible) ――PGR 为 1.0 表示弱监督完全弥合了差距;PGR 为 0 表示弱监督没有帮助──

### L'expérience de Burns et al.

Dans les tâches de PNL, le PGR est toujours correct: le modèle fort est généralisé au-delà des erreurs du surveillant faible.

Burns et al. Indication des limites:
- L'écart faible-forte est l'écart de capacité, pas l'alignement.
- La généralisation du modèle fort peut être plus due à la pré-expérience de la mission que à la restauration de l'intention de la vérité fondamentale.
- L'établissement de connaissances latentes sur des modèles de force est un véritable problème; la mesure de la RPG est une forme d'opération spécifique.

### Surveillance évolutive: 三种机制

- **Debate（Irving et al. 2018）。**Les deux exemples de U sont les débats opposés à la position; un juge faible fait un jugement. Son hypothèse est: trouver une vraie réponse convaincante est plus facile que de trouver une fausse réponse convaincante.
- **Recursive Reward Modeling（Leike et al. 2018）。**U 帮助人类训练 U+1's reward model── la capacité de l'observateur à agir augmente avec la capacité de modèle──
- **Task Decomposition（Christiano, Shlegeris, Amodei 2018）。**Le problème de l'écriture est défini comme étant le problème de l'écriture.

Chaque mécanisme a fait une sorte d'hypothèse sur l'alignement de la structure de tâche ou du composant intermédiaire.

### Pourquoi la surveillance évolutive et W2SG sont complémentaires

Surveillance évolutive  améliorer la qualité de signal efficace de l'inspecteur
Les différences de signal incomplètes que peut apporter le W2SG 弥合监督者

Lang et coll.  Débat aide la généralisation faible à forte ((arXiv:2501.13124) 将二者结合:debate 协议提供更好的弱标签,强模型在这些标签上训练──报告显示 NLP 任务上的 PGR 有所提升──

###  Changement de niveau organisationnel

Le groupe de super-alignement d'OpenAI a rejoint l'Anthropic 后解散──该议程.

### Il est en phase 18 .

Les leçons 6-10 décrivent les menaces et les défenses sous la prémisse de l'hypothèse de l'incrédulité U. Leçon 11 est un modèle d'attaque: faire en sorte que le surveillant soit assez fort pour vérifier l'alignement de U. Les leçons 12-16 se tournent ensuite vers des outils pratiques d'évaluation adverse.


```figure
scalable-oversight
```

## Utilisez-le

`code/main.py`Dans une tâche de synthèse, on peut comparer les modèles de fine tonnerie W2SG à un taux d'accura­tion de 70% et avec des erreurs structurelles; les modèles de forte sur les étiquettes en or sont à 95%.

## Je le livre.

本课会生成 `outputs/skill-w2sg-pgr.md`△ donner une surveillance 设置描述, elle identifiera le faible surveillant、强模型、监督质量,并计算((或请求) PGR。 elle marquera que la surveillance est faible peut superviser forte ou faible + mécanisme de surveillance peut superviser forte。

## 练习

1. 运行  référencement`code/main.py` Rapport faible_exactitude = PGR de 0,60、0,70、0,80 时── expliquer la forme de la courbe de PGR ⋅

2. Modifier l'étiquette faible, en lui donnant des erreurs structurelles (par exemple, en un certain type d'entrée, il y a toujours une erreur).

3. 阅读 Burns et al. 2023 Section 4.3 (Tâches de la LNP)  Révélation  Perte de confiance auxiliaire  的直觉: quand un modèle fort est plus fort que celui qui a plus de confiance, qui va gagner ?

4. Pour un logiciel-ingénierie  tâche de conception d'un débat et de la décomposition des tâches 协议―― dire à chaque composant un mode d'échec,并解释这种组合如何处理或无法处理这些失败模式――

5. Pour ce qui est de la généralisation de la faiblesse à la force, il est possible de voir une voie de super-alignement.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------|----------|
| Scalable oversight | “让监督者更强” | 提高监督者评估更强模型能力的机制 |
| W2SG | “弱监督强” | 在弱标签上 fine-tuning 强模型，并衡量恢复的能力 |
| PGR | “performance gap recovered” | (fine-tuned - weak) / (ceiling - weak)；1.0 = 完全弥合，0 = 无帮助 |
| Debate | “两个 U 实例辩论” | 一种 scalable oversight 机制，其中弱 judge 在两个 U defenders 之间做选择 |
| RRM | “recursive reward modeling” | U 帮助训练 U+1 的 reward model；监督者能力跟随 U |
| Task decomposition | “人类检查子任务” | 将困难任务递归拆解为人类可以验证的子任务 |
| Superalignment | “对齐超人类 AI” | 关注对齐人类无法直接评估的模型的研究议程 |

## 延伸阅读

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) W2SG 论文
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) mécanisme de débat
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) Modélisation récursive de la récompense
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) Débat sur les débatteurs plus forts en 2024 Expérience Study
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) Débat de 2025 + W2SG
