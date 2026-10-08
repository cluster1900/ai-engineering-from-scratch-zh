# Optimisation directe des préférences Famili

> Rafailov et coll. (2023) prouvent que les meilleures solutions de RLHF peuvent être utilisées avec des données de préférence rédigées sous forme fermée, de sorte que vous pouvez sauter le modèle de récompense évidente, politique d'optimisation directe.

**Type:** Learn
**Languages:** Python (stdlib, 六种 preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## Objectifs d'apprentissage

- Le RLHF du KL est le plus utilisé dans le monde entier.
- Il est possible de modifier le mode d'échec de la DPO en fonction de la situation de l'opération.
- 区分implicit reward gap和preference strength,并解释IPO's identity mapping 为什么重要──
- 解释为什么 Rafailov et al. (NeurIPS 2024) 证明 DAAs 即使没有显然 RM 也会过优化──

##  problématique

Objectif du RLHF:

```text
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

Il y a une meilleure solution:

```text
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

Ainsi, la récompense est définie par la politique optimale et la référence:

```text
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

La mettre dans la probabilité de préférence Bradley-Terry, puis la fonction de partition.`Z(x)`Ça va disparaître, parce que ça dépend seulement.`x`Il ne reste plus qu'une perte de paramètres politiques, il n'y a plus besoin de modèle de récompense.

Le problème réside dans le fait que les données de préférence sont en distribution et que la politique de référence est une véritable ancrage de mode.

## 概念

### DPO (Rafailov et coll., 2023)

```text
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

Peut-être dans un mauvais endroit:

- l' écart de récompense implicite `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)`Il y a aussi une différence de taille.
- Cette perte sera choisie et les log-probes rejetés 往相反方向推──只要拒绝下降更快,它就可以把选定的绝对 log-prob也往下推──这是 dégradé 选择反应现象──
- Les préférences hors de distribution (échantillons rares contre échantillons rares) génèrent des récompenses implicites arbitraires.

### Les actions d'investissement (Azar et coll., 2024)

Optimisation des préférences d'identité Utilisation de la probabilité de préférence de la carte d'identité de la mise en place du log-sigmoid, la perte de la mise en place de la cible limitée de la mise en place de l'erreur carrée:

```text
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

marge `1/(2 beta)`限定── la force de préférence par rapport à l'écart entre la récompense implicite et la proportion── ne disparaîtra pas──

### Les mesures de sécurité sont prises en application de la directive 2009/65/UE.

L'optimisation de Kahneman-Tversky  complètement éliminé par paire 结构── donné une sortie unique de marque, ainsi qu'un signal désirable ou undesirable de 2元, il sera mappé à l'utilité de la théorie des perspectives:

```text
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

Il est également possible d'utiliser des données non partagées, mais ces types de données doivent être très riches.

### SimPO (Meng et coll., 2024)

Optimisation des préférences simples 让训练信号与生成过程对齐── complètement déplacer la politique de référence,并按长度归纳化日志-概率:

```text
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

Marge de consommation `gamma`Pour établir l'entraînement, la longueur de reprise est déplacée en utilisant le mode d'échec du DPO avec un biais de longueur.`y_w`L'élaboration de la structure entraîne un écart de log-prob plus grand)

### ORPO (Hong et coll., 2024)

Optimisation des préférences dans la norme SFT probabilité de log négatif 上添加一个偏好术语:

```text
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

 pas de politique de référence, le terme SFT est un régulateur  de modèle de base à modèle aligné  seulement besoin d'une formation en un seul étape  pas besoin d'un point de contrôle SFT séparé

### BPO (déclaration ICLR 2026, OpenReview id=b97EwMUWu7)

识别了 Degraded Choose Answers 问题:DPO 会保持排序 `y_w > y_l`Mais ...`y_w`Le taux de dépistage des données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de données de l'analyse de l'analyse de données de l'analyse de l'analyse de l'analyse de l'analyse de données de l'analyse de l'analyse de l'analyse de l'analyse de la recherche de l'analyse de l'analyse de la recherche de l'analyse de l'analyse de la recherche de l'analyse de la recherche de l'analyse de l'analyse de la recherche de l'analyse de la recherche de l'analyse de la recherche de l'analyse de l'analyse de la recherche de l'analyse de la recherche de l'analyse de l'analyse de la recherche de l'analyse de la recherche de l'analyse de la recherche de la recherche de la recherche de l'analyse de la recherche de la recherche de l'analyse de l'analyse de la recherche de la recherche de l'analyse de la recherche de la recherche de la recherche de l'analyse de la recherche de la recherche de la recherche de l'analyse de la recherche de la recherche de la recherche de l'analyse de la recherche de la recherche de la recherche de la recherche de la recherche de la recherche de la recherche de la recherche de la

### Les DAs continuent à suroptimiser

Raphailov et coll. Leges d'échelle pour la suroptimisation du modèle de récompense dans les algorithmes d'alignement direct (NeurIPS 2024) 在多个数据集和不同 KL budgets 下, using DPO、IPO、SLiC 训练 policies。gold-reward-vs-KL 曲线呈现出与Gao et coll. 相同的峰值和崩形状──隐含奖励在训练期间查询出发行样本;KL réglementation 无法稳定这一点──

Les DAA ne se sont pas échappés de Goodhart. Ils ne font que transformer les problèmes de l'apparence humaine du modèle de récompense.

### 如何选择(2026)

- Si vous avez beaucoup de données de préférence partagées: utilisez le DPO conservé de la bêta; si la longueur du décalage est évidente, utilisez le SimPO。
- Si vous avez un retour binaire non couplé: KTO。
- Si vous voulez partir du modèle de base, sortez du pipeline de phase unique:
- Si vous voyez des logs dégradés dans les journaux du DPO,
- Si les forces de préférence sont très différentes et que le DPO est en cours de négociation,

Chaque laboratoire se retrouve à compléter ces cinq méthodes dans un groupe d'évaluations, puis choisit le gagnant en fonction de la tâche. Il n'y a aucune raison de penser que les meilleures solutions de la logique mathématique et de la sécurité sont les mêmes.


```figure
dpo-margin
```

## Utilisez-le

`code/main.py`Dans un ensemble de données de préférences de jouets, comparer les pertes de six types (DPO, IPO, KTO, SimPO, ORPO, BPO), dont la vraie force de préférence sera variable avec la paire. Chaque perte est dans le même échantillon de 500 paires.

## La faire partir

本课产 出 `outputs/skill-preference-loss-selector.md` données données statistiques de série de données (parées contre nonparées, variables contre force de préférence uniforme, distribution de longueur) et objectifs (étape unique ou SFT-then-preference),

## 练习

1. 运行  référencement`code/main.py` Rapport de la désignation finale du DPO et du BPO.

2.  Modifier les données de préférence, que toutes les paires aient la même force 六种方法中哪个方法最强?哪个方法最强?

3. 让拒绝的答案的平均长度变成所选的2倍――在不改变其他任何内容的情况下, utiliser la valeur numérique pour montrer l'exploitation de la longueur du DPO ainsi que la réparation du SimPO――

4. Rafailov et coll. (NeurIPS 2024) 声称 DAAs 会过优化──复现一个单点版本:绘制选选减拒绝 KL divergence,并观察大beta 下 DPO的过优化──

5. 阅读 BPO paper abstract (OpenReview b97EwMUWu7) 』写下 BPO 添加到 DPO 的那一行修正──对照 `code/main.py`Confirmation de réalisation

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | “没有 reward model 的 RLHF” | 从 RLHF 闭式最优解推导出的 loss；只含 policy parameters |
| Implicit reward | “log-ratio” | `beta * log(pi(y\|x) / pi_ref(y\|x))`，也就是 DPO 隐含的 reward |
| IPO | “bounded DPO” | 用 identity 替换 log-sigmoid；implicit reward gap 被 `1/(2 beta)` 限制 |
| KTO | “unpaired DPO” | 在带有 loss aversion 的单标签上使用 prospect-theory utility |
| SimPO | “reference-free DPO” | 长度归一化 log-likelihood + margin；没有 reference policy |
| ORPO | “one-stage DPO” | NLL + odds-ratio preference term；从 base model 单次训练完成 |
| BPO | “chosen-preserving DPO” | DPO 加上对 chosen response 绝对 log-prob 下降的惩罚 |
| Degraded Chosen | “chosen 下降了” | 只要 rejected 下降得更快，DPO 就会降低 chosen log-prob |
| DAA | “direct alignment algorithm” | 任何跳过显式 RM 的 preference-loss 方法 |

## Pour en savoir plus

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) OPC
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
