# LLM Production de l'ingénierie du chaos

> En 2026 année, l'orientation vers les LLM en génie du chaos est devenue une pratique indépendante. Dans la production, les conditions préalables de l'expérience sont: déjà définies SLI/SLO, trace+métrie+log observabilité, rollback automatisé, manuels de conduite, sur appel.

**类型：**Apprendre à apprendre
**语言：**Python, jouet et chaos, pilote d'expérience
**前置条件：**Phase 17 · 23(SRE pour l'IA),Phase 17 · 13(Observabilité)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- Il a expliqué pourquoi sauter sur n'importe lequel de ces éléments va gâcher cette pratique.
- Œuvre de quatre plans de contrôle, de cible, de sécurité, d'observabilité) et de retour dans la boucle de rétroaction de l'OELS.
- 枚举五个LLM-specific experiments(surcharge de mémoire, défaillance du réseau, panne de fournisseur, déformation rapide, tempête de délocalisation de véhicules électriques)
- Selon la pile 选择工具  Harness、LitmusChaos、Chaos Mesh。

##  problématique

La stack de chaos de l'interface traditionnelle est déjà très mature. La stack de LLM a ajouté de nouveaux modes d'échec. Une mise à jour de 4K avec un caractère toxique poisonné permettra au tokeniseur de rester en 12 secondes.

Ces éléments ne sont pas présentés dans les tests unitaires. L'ingénierie du chaos est une méthode que vous trouvez avant que les utilisateurs ne les rencontrent.

## 概念

### Préposition condition

Si vous n'avez pas ce qui suit, ne pas créer de chaos dans la production:

1. **SLI/SLO**  Indicateurs et objectifs définis du niveau de service.
2. **Observability** traces, métriques, journaux,并连接到仪表板──
3. **Automated rollback** Phase 17 · 20 réouverture du drapeau politique
4. **Runbooks** 结构化,Phase 17 · 23。
5. **On-call** Quelqu'un est responsable de la réponse.

L'absence de tout, tout signifie que le chaos deviendra un vrai incident.

### Quatre avions + rétroaction

**Control plane** programmeur d'expériences(flux de travail de Litmus、programme Chaos Mesh、Ui de l'utilisation)

**Target plane** services, pods, nœuds, équilibrateurs de charge, entrepôts de données

**Safety plane** interrupteur de compression  fenêtres de suppression  limites de rayon d'explosion  portes de budget d'erreur 

**Observability plane** 常规 métriques + correlation trace-ID, utilisées pour distinguer les défaillances induites par le chaos et les défaillances naturelles。

**Feedback loop** 发现结果反到 SLO ajustement、 actualisations du manuel de conduite、 corrections de code。

### Les gardiens sont obligatoires

- **Burn-rate alert**Si le budget d'erreur quotidien dépasse le 2x de l'espérance, la pratique est suspendue.
- **Suppression windows**: pendant l'expérimentation, des alertes non expérimentales dans le rayon d'explosion
- **Trace-ID correlation**Toutes les erreurs induites par l'expérience portent une étiquette, laissez-les revenir.

### 五个LLM-spécifiques expériences

1. **Memory overload**                                                                                                                                                                                                                                                              

2. **Network failure** 切断 inference gateway 连接与供应商 之间的连接──观察:fallback 是否在 SLA内生效?

3. **Provider outage simulation** OpenAI 100% 返回 429──观察:route ou non failover vers Anthropic ?

4. **Malformed prompt** Inserir dans le jeton 卡住的用荷(exemple: un code enfoncé profondément 巨型UTF-8 codepoint) 观察:单个请求 是否会锁死一个工人?

5. **KV eviction storm**                                                                                                                                                                                                                                                              

### Cadence

- **每周** Dans les essais de petits canaris, il est possible de réaliser 5% de la production 流量上运行.
- **每月** 针对特定场景 安排游戏日;跨团队参与;后死――
- **每季度** vérification de la résilience entre les équipes; mise à jour de la carte de la dépendance。

### Les outils

- **Harness Chaos Engineering** 商业工具; recommandations d'expériences dérivées de l'IA; réduction de l'échelle des rayons d'explosion; intégration des outils du MCP。
- **LitmusChaos** CNCF diplômé; basé sur le flux de travail Kubernetes。
- **Chaos Mesh** Cdcf sandbox;Cdc native des Kubernètes 风格。
- **Gremlin** 商业工具; large soutien
- **AWS FIS**- Je suis là .**Azure Chaos Studio** Offres de cloud gérées。

### Depuis le début

Première expérience: dans un flux stable, un module est décodé et une copie est décodée. Observer le redirigement et la récupération.

Première expérience spécifique à la LLM: injection d'un fournisseur 429, durée 5 minutes. Observer le retrait. La plupart des équipes découvrent que leur retrait n'a pas été pleinement testé.

### Tu devrais te rappeler le nombre

- Quatre plans: contrôle, cible, sécurité, observabilité
- Pause de taux de brûlure: prévue de la brûlure quotidienne du budget 2x
- Cadence:canary hebdomadaire, jour de jeu mensuel, audit trimestriel.
- 五个LLM experiments: mémoire, réseau, fournisseur, prompt malformé, KV storm


```figure
i4-chaos-guard
```

## Utilisez-le

`code/main.py`Utilisez les portes d'avion de sécurité 模拟三个混沌实验──报告哪些实验 会触发燃烧率中断──

## Je le livre.

本课会生成 `outputs/skill-chaos-plan.md`△ donner une stack et une maturité, choisir les trois premières expériences et les outils.

## 练习

1. 运行  référencement`code/main.py`Quelle expérience a provoqué la vitesse de combustion ?
2. Pour un service RAG basé sur vLLM, la conception de cinq expériences de chaos... inclut les critères de réussite...
3. Votre alerte de taux de brûlure suspend une expérience. Comment pouvez-vous déterminer si la cause est le chaos ou la nature ?
4. Le chaos devrait-il se produire dans la production ou se produire seulement en scène ?
5. Il existe trois modes de défaillance spécifiques à la LLM:

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
