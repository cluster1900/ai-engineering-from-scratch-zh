# STAR, V-STAR, SILENT-STAR  Réflexion autodidacte

> Le dernier cycle de réforme de soi se situe à l'intérieur de la logique. Le modèle génère une chaîne de pensées, conserve les résultats obtenus avec la réponse correcte et met en place des ajustements sur ces résultats. C'est le STaR.

**Type:** 学习
**Languages:** Python (stdlib, bootstrap-loop 模拟器)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon 框架)
**Time:** ~60 分钟

##  problématique

Le modèle de raisonnement est une méthode directe qui consiste à recueillir les traces de raisonnement de l'homme.

STaR (Self-Teught Reasoner, Zelikman et al., 2022)  propose un problème: si un modèle écrivait ses propres raisonnements, et selon les réponses connues, leur donnait un partage, comment ?

1. 采样一个推理的痕迹 和答案──
2. Si la réponse est vraie, conservez cette trace.
3. Dans les traces de la conservation,
4. Je vous en prie.

Il est valable. GSM8K et CommonsenseQA ont tous été améliorés sans nouveaux signes artificiels. Mais ce cycle a un décalage interne: toute raison de produire une réponse correcte sera conservée, quel que soit le raisonnement.

## 概念

### STaR: dans le résultat valide sur le démarrage

On commence par un modèle de base de capacité de raisonnement faible. Dans chaque question de formation, on prend une logique et une réponse. Si la réponse correspond à l'étiquette, on conserve le (problème, logique, réponse) triple.

Il y a un changement important. Si le modèle ne peut jamais répondre à un problème, ce cycle ne peut pas apprendre de lui.**rationalization**Pour les problèmes de défaillance du modèle, insérez la réponse correcte comme indication, et réinvitez le modèle à générer une raison qui va vers cette réponse.

Originaire du résultat (Zelikman et coll., 2022): un modèle de base GPT-J  via la rationalisation de la STaR à plusieurs rotations, est passé de 5,8% à 10,7% sur GSM8K, est passé de 5 个百分点.

### V-STaR: avec vérificateur d' entraînement du DPO

STaR 会丢弃错误理性――Hosseini et al. (2024) 观察到这些也是数据:每一对 (rational, "est-ce que c'est vrai") 都可以训练验证者── ils utilisent la Direct Preference Optimization sur les méthodes de vérification des erreurs et des erreurs pour construire un classement──

报告的差异: en GSM8K 和 MATH 上, par rapport aux lignes de base d'amélioration de l'auto-amélioration précédentes 提升 +4至 +17 个百分点, dont la plupart des bénéfices proviennent du vérificateur utilisé pour la sélection du temps d'inférence, plutôt que pour le raffinage du générateur supplémentaire 

### Quiet-STAR: chaque jeton est interne

Zelikman et coll. (2024)  proposent: si le modèle apprend à générer une courte logique interne à chaque position de jeton, et non seulement entre les questions et les réponses, que se passe-t-il?

结果:Mistral 7B dans le cas d'une mise à jour fine spécifique à la tâche, en GSM8K en haut de zéro-shot 绝对表现从 5.9% 提升到 10.9%,CommonsenseQA 提升到 36.3% 提升到 47.2%──模型学会了"when to think":困难 Token 会得到更长的内部理性;简单 Token 几乎没有──

### Pourquoi les trois ont-ils des préoccupations communes en matière de sécurité ?

Trois méthodes utilisent la réponse finale comme un signal de degré. Une raisonnée avec des défauts permet d'obtenir la réponse correcte, que ce soit en utilisant des méthodes de devinettes ou en utilisant des méthodes non généralisées.

Le vérificateur de V-STaR 通过学习对理性 排序来缓解这一点, mais le vérificateur est formé sur le même ensemble de balises. Il peut apprendre à préférer le format de bon mais erroné raisonnement, plutôt que l'incertitude honnête.

### Par rapport à

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | 如果正确，则保留 (rationale, answer) | 1x | 丢弃所有错误 rationales | shortcut rationales |
| STaR + rationalization | 上述方法 + 带正确答案提示的重试 | 1x | 更少 | rationalized rationales 可能不可信 |
| V-STaR | STaR + 来自两个类别的 DPO verifier | Nx (best-of-N) | 最小 | verifier 可能强化自信的错误 |
| Quiet-STaR | per-Token rationale + mixing weight | 1.5-3x | 最小 | 仍然是 answer-conditioned Gradient |

### Il est en 2026 en position centrale

Le STaR 已不新了──但这个模式在 2025-2026年到处重现──可验证数学问题上的 RL (DeepSeek-R1, Kimi-k1.5, o1) est la version accrue du signal de gradient de réponse du STaR── Les modèles de récompense des processus (Lightman et al., 2023; "Vérifions étape par étape") d'OpenAI sont des alternatives supervisées par le processus──AlphaEvolve (Léction 3) est une STaR face à code, simplement en utilisant l'évaluateur de programme 标签──Darwin Godel Machine (Léction 4) est un agent qui s'échafaude sur lui-même le STaR──

Comprendre que le STAR va rendre tout cela clair. C'est le plus petit cycle d'auto-amélioration possible.


```figure
reflection-loop
```

## Utilisez-le

`code/main.py`会在一个玩具算法任务 上运行模拟 STaR循环── Vous pouvez observer:

- La précision des tirs de la bande de démarrage augmente.
- 捷径如何混入:模拟器 contient un logiciel "farouche" 类, il a 40% du temps pour obtenir la réponse correcte, mais la généralisation est très mauvaise.
- Un vérificateur (V-STaR 风格) comment aider dans l'inférence, mais ne peut pas complètement éliminer les voies d'introduction pendant l'entraînement

## Je le livre.

`outputs/skill-star-loop-reviewer.md` vous aider à planifier un projet de logique autodidacte 

## 练习

1. 运行模拟器──将快捷通路频率 设为零,然后设为0.4──尽管两次运行都在训练分布上达到>90%,最终精度会相差多少?

2. 给模拟器添加一个持久的OOD test──从不同分布中抽取问题,并在分发和OOD sets 上评估 bootstrapped model──量化差距──

3. 阅读 Quiet-STaR 论文 (arXiv:2403.09629) Section 3──分别用三句话解释 "fin de pensée" Token 和 tête de poids mélangé──

4. Comparer le filtre de conservation si correct de STaR à un programme de remplacement supervisé par le processus, il sera indépendant de récompenser chaque étape rationnelle.

5. Œuvre d'évaluation, pour saisir les rationales des raccourcis du modèle déployé.

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | 在得到正确答案的模型生成 rationales 上 fine-tune；重复 |
| Rationalization | "Hinted retry" | 注入正确答案，并在 base model 失败的问题上重新 prompt 生成 rationale |
| V-STaR | "Verifier STaR" | 在正确和错误 rationales 上 DPO-train 一个 verifier，并将其用于 inference-time selection |
| Quiet-STaR | "Per-token rationales" | 在每个 Token 位置生成隐藏 thoughts；与 baseline prediction 混合 |
| Answer-conditioned gradient | "Outcome-based signal" | 训练循环奖励最终答案，而不是 reasoning steps |
| Process reward model | "Step-level verifier" | 在 per-step correctness 上训练的 reward model，而不是 outcome；与 STaR 形成对比 |
| Shortcut rationale | "Right answer, wrong reasoning" | 一个通过无法泛化的模式得到标签的 rationale；STaR 会保留这些 |

## 延伸阅读

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) 原始论文──
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) 加入用于推理时间选择的DPO vérificateur。
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) par token 内部 rationales。
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) modèles de récompense de processus,即替代 Gradient 信号。
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) RL sur des missions de vérification, sera étendu à la formation frontalière 
