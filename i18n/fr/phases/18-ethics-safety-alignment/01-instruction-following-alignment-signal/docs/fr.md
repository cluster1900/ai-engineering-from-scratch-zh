# Suivi d'instructions  en tant que signal d'alignement

> 后每一个对RLHF的批评都反对这个管道――你在研究优化压力 如何扭曲一个代理 之前,必须先看清这个代理――InstructGPT(Ouyang et al., 2022) a défini une architecture de référence: faire des ajustements supervisés en paires d'instructions-réponse; faire des ajustements supervisés en paires de classements de préférence; puis utiliser avec une pénalité KL PPO pour le modèle de récompense 优化,并约束到 SFT policy―― un 1.3B InstructGPT a été préféré par 175B GPT-3──

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 分钟

## Objectifs d'apprentissage

- Il a été précisé que les trois phases du pipeline InstructGPT, ainsi que les pertes de l'utilisation de chaque phase, ont été éliminées.
-  Explication de pourquoi le modèle 1.3B ajusté aux instructions dans l'évaluation des préférences humaines a battu le 175B original GPT-3。
- Expliquer la pénalité KL au stade 3 dans la prévention de ce que, ainsi que pourquoi le déplacement se réduira à un comportement de recherche de mode.
- ¢ décrit l'impôt d'alignement, ainsi que Ouyang et al.

## Le problème

Les modèles de langage prétraînés 会补全文本──它们不会回答问题──问 GPT-3 写一个Python函数,翻译一个列表,你经常会得到另一个提示,因为大多数训练分布是将继续接更多的网文的网文.模型在做它工作,但这个工作本身错了──

Chaque laboratoire sérieux utilisant pour corriger ce problème est le proxy de la préférence humaine. Deux compléments dont le rater; le rater selecte un meilleur; modèle de récompense; apprendre ce rater.

## Le concept

### Étape 1: réglage fin supervisé (SFT)

收集 prompt-response paires, dont la réponse est un content écrit par un bon intention humaine──Ouyang et al. Utilisé des instructions 13k des étiquetteurs et OpenAI API──en utilisant des normes de perte d'entropie croisée dans ces données, afin de régler le modèle de base──

SFT  vous donne quelque chose: le modèle répond maintenant au problème, plutôt que de continuer à compléter le problème.

### Étape 2: modèle de récompense (RM)

Pour chaque prompt, à partir du modèle SFT 采样 K 个完成──Labeler pour les ranger──entraîner un modèle de récompense, pour une paire de réponse rapide 打分, afin que pour `y_w`Ils ont été choisis .`y_l`Les paires:

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

C'est la perte de préférence par paire Bradley-Terry. Le RM est généralement dérivé du modèle SFT, en remplaçant la tête LM par la tête scalaire.

Les modèles de récompense 很小:6B 足足够服务 175B InstructGPT──它们 sont également très fragiles, article 5 节 principalement discuté des comportements de piratage des récompenses qui apparaissent à petite échelle──

### Étape 3: PPO avec une pénalité KL

définition de l'objectif:

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

Utiliser le terme PPO maximization.`pi`Il n'y a pas de politique de SFT. Sans elle, l'optimisateur trouvera des exemples contradictoires, c'est-à-dire des chaînes de RM en bas, la raison n'est pas que les humains les préfèrent vraiment, mais que RM les a jamais vus.

Coefficient KL `beta`C'est le plus important hyperparamètre de la RLHF.

### Taxe d'alignement

Après le RLHF, le modèle est préféré par les humains, mais dans les critères de référence (SquAD、HellaSwag、DROP) il est appelé "taxe d'alignement". Ouyang et al.

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

Le PPO-ptx est devenu une pratique standard.

### Le résultat

Un 1.3B InstructGPT(SFT + RM + PPO-ptx) a été étiqueté par les étiquetteurs  prefer prefer prefer prefer prefer prefer prefer over 175B base GPT-3, proportion d'environ 70%── dans les demandes de test cachées du trafic de production.

1. L'alignement est avec la capacité différente de l'axe. Le modèle 175B a une capacité plus forte; le modèle 1.3B a plus d'alignement; les étiquettes sont plus préférentielles à celle de l'alignement.
2. Le niveau de capacité est déterminé par le modèle de base. Vous ne pouvez pas passer par le RLHF.

### Pourquoi est-ce que c'est la phase 18 ?

Chaque critique de la suite de cours: récompense du piratage (leçon 2)、DPO(leçon 3)、sycophancy(leçon 4)、CAI(leçon 5)、sleeper agents(leçon 7)、alignement contrefaçon(leçon 9), tout le monde est contre cette ligne de conduite.


```figure
al-instruct-pipeline
```

## Utilisez-le

`code/main.py`Dans les données de préférence des jouets 上模拟三个阶段。Base policy 是一个在行动 {A, B, C} 上的偏见硬币。Stage 1 SFT 在 200 个提示上模拟标签器行动。Stage 2 个双排名 适合布拉德利-特里奖励模型。Stage 3 运行简化PPO更新,并带有到SFT政策的奖励 KL penalty──你可以观察上升KL divergence 变大、政策漂移,也可以关闭 KL术语,看黑客在50 个奖励更新步骤内出现──

Pour observer le contenu:

- `beta = 0.1`Avec `beta = 0.0`La trajectoire de récompense est la suivante:
- Les étapes de formation 中的 KL pi pi SFT)
- Distribution de l'action finale par rapport à la préférence des étiquettes

## La faire partir

本课产 出 `outputs/skill-instructgpt-explainer.md` déterminer une description du pipeline RLHF ou un résumé papier, il identifiera lequel des trois étapes a été modifié, quelles pertes ont été utilisées dans chaque étape, ainsi que l'existence d'une pénalité KL ou d'un régulateur équivalent.

## Exercices

1. 运行  référencement`code/main.py`◊ la mise en place `beta = 0.0`, rapport 200 étapes de PPO 后的行动分布──用一段话解释模式寻找行为──

2. Modifier le modèle de récompense, faire l'action B a +0,5 biais(模拟奖励 bug)。用 `beta = 0.1`La sanction de la PPO-KL a-t-elle empêché la politique d'utiliser ce biais ?`beta`- Vous avez commencé à exploiter ?

3. 阅读 Ouyang et al.(arXiv:2203.02155) Figure 1― 通过运行 PPO 1、5、20、100 steps,并测量相对SFT model's preference,复现标签者-preference curve―

4. 论文 Section 4.3 报告 1.3B InstructGPT 击败 175B GPT-3 ratio est d'environ 70%― Pourquoi cette proportion dans les demandes de production cachées 上会高于标签师 自己的 demandes?

5. Dans les mêmes données de préférence, le PPO perdra en DPO (Phase 10 · 08)

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | “instruction tuning” | Stage 1：在 prompt-response pairs 上用 cross-entropy fine-tune |
| Reward model | “the RM” | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | “pairwise preference loss” | -log sigmoid(r_w - r_l)；把 pairwise ranking 约简为 binary classification |
| KL penalty | “the regularizer” | `beta * KL(pi \|\| pi_SFT)` — 让 RL policy 保持接近 SFT anchor |
| PPO-ptx | “PPO with pretraining mix” | 向 PPO objective 加入一部分 pre-training log-likelihood，用来抵消 alignment tax |
| Alignment tax | “the RLHF regression” | RLHF 之后，在 RLHF 未针对的标准 benchmarks 上下降 |
| Labeler preference | “the ground truth” | human rankings 的样本；RM 是它的 statistical proxy，而不是 “human values” 的 proxy |

## Pour en savoir plus

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) Le papier de l'instructionGPT, est également la base de chaque article du pipeline RLHF
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) RLHF-pour résumé de l'événement
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) Formulation de RL basée sur les préférences
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) Extension de la HH de l'oléoduc de l'InstructGPT par voie anthropologique
