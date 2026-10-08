# L'IA constitutionnelle et le RLAIF

> Bai et coll. (arXiv:2212.08073, 2022) ont posé un problème: si nous remplaçons les marqueurs humains par une liste de principes de lecture de l'IA, comment?L'IA constitutionnelle a deux étapes: d'abord faire de l'autocritique et de la modification en vertu de la constitution, puis de l'IA Feedback  mener à RL. Cette technologie a créé le terme RLAIF et a été utilisé dans le pipeline de post-training de Claude 1.

**Type:** Learn
**语言：**Python (stdlib, boucle d'autocritique et de révision de jouets)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- Décrire les deux phases de l'IA constitutionnelle (la SFT critique et révisée, provenant des commentaires de l'IA), ainsi que le rôle de la constitution dans chaque phase.
-  Explication de pourquoi utiliser un étiquetteur d'IA  Remplacer un étiquetteur de préférence humaine n'est pas un RLHF plus abordable  mais modifie les modes d'échec du pipeline 
-  résumé La structure prioritaire des quatre niveaux de la constitution de Claude de 2026, ainsi que les changements qui ont eu lieu par rapport à la version réécrite de 2023 
- 描述 Classifiateurs constitutionnels, ainsi que les frais généraux de calcul de 23,7% (v1) à ~1% (v2 / 2026)

##  problématique
RLHF a besoin de marqueurs. La vitesse des marqueurs est lente, préjugée et coûteuse. Vous pouvez utiliser un modèle qui lit des principes évidents pour remplacer les marqueurs afin d'éliminer les marqueurs.

Le problème réside dans le fait que le signal de préférence généré actuellement par le même type de modèle que celui que vous étudiez est un étiquetageur.

## 概念
### Phase 1  监督式自我批判与修订

Un modèle SFT utile mais non inoffensif commence à être utilisé. Il est donné un prompt d'équipe rouge, le modèle générera une réponse initiale.

La constitution est une liste de principes. Bai et coll. 2022 utilisent 16 principes, y compris la priorité de choisir le moins de risques et la réponse étiquée à la morale.

### Phase 2  RL du retour d' AI (RLAIF)

Il est également possible de faire des recherches sur les résultats de l'analyse de la formation de base de données.

RLAIF = signal de préférence par AI 生成── la partie restante de la pipeline est encore RLHF 形──

### Pourquoi ce n'est pas juste un RLHF moins cher ?

- L'interprétation de l'étiquetage par l'AI de l'honnêteté est peut-être plus stricte ou plus lourde que celle de tout humain; cette stricteur se maintient dans l'ensemble des données.
- Le signal de préférence 具有很强的可读性: vous pouvez lire principe、批判和修订── Les étiquettes humaines sont opaques──
- Les modes d'échec 会改变──Sycophancy 会下降(AI labeler 没有需要讨好用户)──Goodhart's Law 仍然存在((proxy 现在是模型对原则集 X 的解释,它仍然是不完美的测量)──

La CAI en 2022 a pour thème: les modèles post-entraînement sont plus inoffensifs et presque aussi utiles que les modèles RLHF utilisés par rapport aux données disponibles.

### 2026 Constitution de Claude 重写

Anthropic a publié une modification significative de la constitution le 21 janvier 2026.

1. Pour expliquer comment le modèle peut être utilisé, il faut savoir que le modèle doit être généralisé.
2. Structure de quatre niveaux prioritaires:
   - Niveau 1: éviter les conséquences catastrophiques (environ 200 000 personnes ont été blessées à grande échelle, et les infrastructures sont essentielles).
   - Niveau 2: suivre les directives de Anthropic.
   - Niveau 3: la qualité de vie
   - Niveau 4: utile et candid
    conflit de sur et de sur résoudre.
3. 首个主要实验室对模型道德地位不确定性的正式承认 (关联到阶段 18 · 19 Le bien-être du modèle)
4. Édition 1.0 de CC0 其他实验室可无限制使用或改编──

### Classifiateurs constitutionnels

L'autre ligne de travail est: pas de modifier le modèle après la formation, mais de former à lire la constitution et à lire les résultats du modèle.

Ceci est un modèle de défense de couche: CAI forming behavior;classifiers  performing invariants;;

### CAI dans le cadre de la liste des

- Les instructionsGPT:préfs humains,RM,PPO
- CAI / RLAIF: préfixes d'IA générés par les principes 、RM、PPO。
- DPO / famille: perdue sous forme fermée sur les préfixes humains ou IA.
- Autonomie récompensante, autocritique: les principes sont intériorisés, le modèle joue plusieurs rôles.

Cette ligne d'axe est le signal de préférence provenant de la CAI. Le papier 2022 est une échelle frontalière.


```figure
constitutional-ai
```

## Utilisez-le
`code/main.py`Dans le lexicon des jouets 上模拟 CAI 的批判-and-revision loop。一个原则会标记有害集合 中的Token。给定初始反应,批判会识别有害Token,revision 会替换它们──经过200次代后,训练模型 已内化了修改规则──在持久的提示集 上比较基模型、RLHF-shaped toy 和 CAI-shaped toy──

## Je le livre.
本课会生成 `outputs/skill-constitution-writer.md` donner un domaine de support à la clientèle, des conseils médicaux, des aides à la codage, des outils de recherche, conformément à la constitution de 2026 Claude 结构起草四层:évitement des catastrophes, règles de plateforme, éthique du domaine, utilité.

## 练习
1. 运行  référencement`code/main.py`◊ Comparer le modèle de base du Token Ratio nocif avec la version formée par CAI ◊ Combien de mesures de révision sont nécessaires pour se rapprocher de zéro ?

2. 阅读Anthropic's 2026 constitution(anthropic.com/news/claudes-constitution) 列出一个应归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归归

3. Pour aider à la codage de l'IA  Concevoir une constitution  Désigner le niveau 1  Catastrophique:未经批准破坏性命令)  Niveau 2  Tier 3  Tier 4  Chaque niveau 保持 3-5 条 

4. CAI utilise des étiquettes AI  pour remplacer les étiquettes humaines  dit qu'un mode de défaillance similaire à la sycophancy qui peut encore se produire dans le RLAIF, et a conçu une détection pour elle

5. 阅读宪法分类器 v2 (如果可用) ⋅解释为什么~1% de calcul est différent par rapport à 23,7% , est une méthodologie de sécurité différente en nature.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Constitutional AI | “用原则训练的 AI” | 两阶段 pipeline：self-critique-and-revise SFT，然后来自 AI feedback 的 RL |
| RLAIF | “没有人的 RLHF” | 使用由 AI labeler 生成的 preferences 的 RL；pipeline 的其余部分不变 |
| Constitution | “那些原则” | critique/labeler model 会参考的自然语言规则有序列表 |
| Critique-and-revise | “SFT loop” | 生成 response → 根据某条 principle 进行 critique → revise → SFT target |
| Constitutional Classifier | “output gate” | 轻量级 classifier，用 constitution 评估 outputs 并进行 block/log |
| Four-tier priority | “冲突解决器” | 2026 Claude constitution 层级：catastrophic > platform > ethics > helpful |
| Feedback model | “AI labeler” | 读取 principle 并对一对 completions 排序的模型 |

## 延伸阅读
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback (arXiv:2212.08073)](https://arxiv.org/abs/2212.08073) Pipeline de deux étapes
- [Anthropic — Claude's Constitution (Jan 2026)](https://www.anthropic.com/news/claudes-constitution) 2026 Quatre étages de réécriture version, CC0 1.0
- [Anthropic — Constitutional Classifiers (2024-2026)](https://www.anthropic.com/research/constitutional-classifiers) v2 中 dépense de sortie de ~ ~ 1%  défense
- [Lee et al. — RLAIF vs RLHF: Scaling Reinforcement Learning from Human Feedback (arXiv:2309.00267)](https://arxiv.org/abs/2309.00267) RLAIF / RLHF 的实证比较
- [Kundu et al. — Specific versus General Principles for Constitutional AI (arXiv:2310.13798)](https://arxiv.org/abs/2310.13798) principe de la grandeur
