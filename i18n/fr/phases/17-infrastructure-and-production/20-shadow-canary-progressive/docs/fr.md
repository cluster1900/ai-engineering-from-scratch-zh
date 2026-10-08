# Traffic d'ombre de la LLM, déploiement canarien et déploiement progressif

> Le déploiement de LLM combine la partie la plus difficile du déploiement de logiciels: aucun test unitaire, aucun mode d'échec, des signaux sont en retard. Le système est: 1) mode ombre  va produire des demandes copiées à un modèle candidat, enregistrer des journaux et comparer avec les utilisateurs 零; il peut capturer des problèmes de distribution évidents, mais pas de garantie de qualité; 2) déploiement canarien                                                                                                                                                                                                        

**Type:** 学习
**语言：**Python, simulateur de progression canarien)
**Prerequisites:** Phase 17 · 13（Observability），Phase 17 · 21（A/B Testing）
**Time:** ~60 分钟

## Objectif de l'apprentissage

- 区分影音模式 (零影响比较) 卡纳里 (canary) 直播流量 (progressive)  A/B (stability confirmation)                                                                                                                                                                                                                                          
- 列举五个LLM-specific canary metrics (la latence, les coûts, les demandes, les erreurs, les refus, la distribution de la longueur de sortie, les commentaires des utilisateurs)
- 解释为什么LLM non-determinisme ((maximum 15%) va changer le déploiement
- 设计一个耗时数秒的政策转变) plutôt que de quelques小时的重新部署) de la déploiement 路径──

##  problématique

Vous avez publié un nouveau modèle. Les évaluations hors ligne montrent une précision de 3%. Vous êtes en production pour l'activer.

Tout cela aurait pu être évité. Le mode ombre permettra à tout utilisateur de voir une hausse de 40% des coûts. Le mode canarien est en train de changer.

## 概念

### Mode d'ombre

Les demandes de candidature reception et production similaires; les résultats seront enregistrés, mais ne seront pas retournés aux utilisateurs ∼ à l'utilisateur ∼ impact ∼ enregistrement:

- Le contenu de la production diffère de celui de la production.
- Compte des jetons (delta de coût)
- La latence
- Réjection et erreur.

能捕捉:cost blow-ups、length regressions、manifest refusal changes、hard errors──不能捕捉:user will perceive its quality delta──Shadow is a smoke test, not a quality test──

### Déploiement des Canaries

带 gate 的渐进性交通转移──典型进度:1% → 10% → 25% → 50% → 75% → 100%──每一步基于 5 个指标 设置门:

1. **Latency percentiles** P50、P95、P99。 violation:canary of P99 > baseline of 1.5x。
2. **Cost per request** 混合 $──违规:高于基线 >20%──
3. **Error / refusal rate** 5xx 加明显拒绝──违规:baseline 的 2x──
4. **Output length distribution** moyenne + P99。 violation:changement de distribution。
5. **User-feedback rate** pouce vers le bas / dépôt de billets  violations: baseline 的 1.5x。

### Le non-déterminisme est une nouvelle variance .

Les mêmes entrées produisent des sorties non entièrement identiques.

- Résultats de la recherche sur les résultats de l'analyse de la recherche
- Variance de taille du lot (la même demande dans le lot de 128 et le lot de 16 sont différents)
- Prise d'échantillons à température > 0)

实测: dans les mêmes ensembles d'évaluation 上, la variation de précision de course à course maximale de 15%。 Stable Dans le déploiement signifie que les mesures 处于预期变化内, plutôt que dans la ligne de base 完全相同──把门 设置在噪声 floor 之上──

### Le coût est variable

Un bon modèle de 20% Chaque fois que vous le faites, vous pouvez le dépenser 3 fois.

### Le retour est une arme .

- Flag de politique (système de flag de fonctionnalités): dans la configuration, le changement est effectué en plusieurs secondes.
- Modèle en pinage (régilier digeste): modèle en pinage (régilier)
- Rollback = renverser le drapeau + fixer le digeste fixé à l'ancien.

Si votre pile doit être redéploiée pour revenir en arrière, réparer ce point avant le déploiement.

### Les outils

**Argo Rollouts**- Je suis là .**Flagger** Contrôleur de livraison progressive Kubernetes │

**Istio weighted routing** service-mesh 级流量拆分──

**KServe / Seldon Core** 内置 canary 

**Feature flags** LancementDarkly、Flagsmith、Unleash──Flip au niveau politique, sans besoin de redéploiement──

### Cadence des métriques

Les portes canaries Chaque 5-15 minutes de vérification une fois, dépend en particulier du volume de trafic. 1% du trafic. et 10 minutes par minute. Chaque fenêtre a 50 à 150 points de données.

### A/B 步骤是可选的

Si le nouveau modèle 明显不同( différents comportements、 différentes courbes de coûts、 différents tons), faire un test A/B à 50% à travers le canary 后通过

### Tu devrais te rappeler le nombre

- Progression des Canaries: 1% → 10% → 25% → 50% → 75% → 100%
- Plafond de non-déterminisme: variance de même entrée en même temps maximale de 15%
- 五个加拿大指标: latency,cost,error/refusal,length of output,feedback de l'utilisateur
- Portée de coût:高于基线 >20% 即为违规――
- Retour en arrière: quelques secondes, plutôt que quelques heures.


```figure
i4-canary-ramp
```

## Utilisez-le

`code/main.py`模拟带有注入回归的加拿大推广――rapport du déploiement dans quelle étape 停止, ainsi que dans quelle porte est touché

## Je le livre.

本课生成 `outputs/skill-rollout-runbook.md` déterminer le modèle de candidature, la ligne de base et la tolérance au risque, concevoir l'ombre→canary→100% plan♦

## 练习

1. 运行  référencement`code/main.py`◊ Injectation de régression des coûts de 25% ◊ canary 会在哪个阶段 停止?
2. Votre nouveau modèle en ligne a un gain de précision de 3%, mais le coût/ demande est de +18%── est-il publié?
3. Œuvrer à un retour de roulement de moins de 60 secondes Œuvrer à une infrastructure nécessaire Œuvrer à un roulement de roulement de moins de 60 secondes Œuvrer à une infrastructure de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de roulement de rou
4. Non-déterminisme dans votre évaluation 上 montrer ±7%── définir des portes canaries, éviter la fausse alarme── vous utilisez quelles multiplicateurs?
5. Mode d'ombre dans les canaries  prématurément capture jusqu'à 40% spike de coût ⇒ write out触发 shadow ⇒ règle d'alerte ⇒

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Shadow mode | “duplicate to new” | 用于 logging 的零影响 send-to-candidate |
| Canary | “progressive traffic” | 带 gates、暴露给用户的渐进式 rollout |
| Gates | “rollout checks” | 阻止 progression 的 metric thresholds |
| Non-determinism | “LLM variance” | 不可消除的 run-to-run differences |
| Policy flag | “flag flip rollback” | Config-level rollback，数秒而不是数小时 |
| Model pin | “registry digest” | 指向 model version 的不可变 reference |
| Argo Rollouts | “K8s progressive” | Kubernetes-native canary/rollback controller |
| KServe | “inference K8s” | 带 canary primitives 的 model serving |
| Istio weighted | “mesh split” | Service-mesh traffic splitter |

## 延伸阅读

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
