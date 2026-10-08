# L'AI SRE  Multi-Agent 事件响应、Runbooks、预测性检测

> L'AI SRE 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过使用基础基础数据 通过RAG 通过RAG 通过RAG RAG 通过RAG 通过RAG 通过RAG RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG 通过RAG RAG 通过使用

**Type:** Learn
**Languages:** Python (stdlib, toy multi-agent incident triage simulator)
**Prerequisites:** Phase 17 · 13 (Observability), Phase 17 · 24 (Chaos Engineering)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 画出多代理 AI SRE 架构图:superviseur + agents spécialisés (日志、指标、runbooks) + passerelle d'approbation humaine。
- Expliquer pourquoi la portée de la remise en état automatique est très étroite, plutôt que très large, le service de ré-architecture.
- Deux modèles concordent = 置信;不一致 = escalade。
- 引用 MIT 89% de détection précoce 结果, ainsi que la contrainte opérationnelle: aucune action de prédiction sont simplement des tableaux de bord。

##  problématique
Un ingénieur en ligne a reçu un message à 3 heures du matin:  taux d'erreur dans le processus de vérification 很高──他们检查 Datadog、Loki、三个跑本、部署日志──30分钟后, ils ont réalisé que la cause principale était la hausse du cache KV 导致 vLLM OOM── ils ont redémarré le pod; l'erreur a disparu──

D'ici 2026, ce type d'enquête peut être automatisé. Selon le service de collecte de données.

完全自主修复是另一个问题──Restart pod:安全──Scale GPU pool:如果政策 允许则安全──Rearchitect the service:绝对不行──关键原则是划清这条狭窄边界──

## 概念
### Architecture multi-agent

```
          Incident
             │
             ▼
        Supervisor
        /    |    \
       ▼     ▼     ▼
  Log agent  Metric agent  Runbook agent
       │     │     │
       └─────┴─────┘
             │
             ▼
        Hypothesis + evidence
             │
             ▼
        Human approval
             │
             ▼
        Action (narrow set)
```

Le superviseur va organiser l'incident  décomposer en sous-questions。 les agents spécialisés  avoir accès aux outils  recherche de journaux、PromQL、 récupération de documents)。 le superviseur  effectuer un ensemble, va présenter l'hypothèse + les preuves  à l'humanité―  humanité ratification ou redirection。

### Département de traitement automatique

**Safe (narrow)**:restart pod、revert déploiement spécifique、en pré-approuvé borders dans la gamme de la base、activer le drapeau de fonctionnalités pré-approuvé

**Not safe (broad)**: modifier la topologie des services, modifier les limites des ressources, déployer un nouveau code, modifier l'IAM, modifier les bases de données,

Tout le monde est en surpoids. Avec l'AI SRE, le rassemblement de sécurité s'agrandit, mais la frontière est réelle.

### Pour une évaluation de l'efficacité de l'appareil

 Deux modèles analysent indépendamment le même incident Si elles sont en accord avec la cause profonde, la confiance est plus élevée Si elles ne sont pas en accord, elles sont accompagnées de deux hypothèses visibles  pour l'homme Simple mode, mais il est un mécanisme efficace de causes profondes hallucinées

### Mémoire opérationnelle

团队人员流动是传统SRE的隐形杀手 部落知识 会流失──AI SRE va enregistrer des livres de conduite + des morts 存入向量DB;agents 会在每一个新事件中检索──当新工程师加入时,AI 拥有完整历史──

### Prévision préalable à l'incident

MIT 2025 Studi: dans le test de mise en place, basé sur l'historique √√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√√

现实检查: aucune activation de prédiction ne sont que des tableaux de bord. La question opérationnelle est:

### Produits en 2026

- **Datadog Bits AI** Datadog 内部的托管 SRE copilot。
- **Azure SRE Agent** Native de l'Azur
- **NeuBird Hawkeye** évaluation adversitaire + mémoire opérationnelle。
- **PagerDuty AIOps** triage + déduplication。
- **Incident.io Autopilot** commandant d'incident + coordination。

### Les livres de conduite en tant que code

Les runbooks de Confluence  page développé pour une section structurée de la série de tests de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test de test

### Les chiffres que vous devriez vous rappeler

- Détection précoce du MIT: 89% des pannes,10-15 minutes de délai.
- Trier par plusieurs agents: superviseur +(日志、指标、runbooks) + humain。
- Sette de remise en état automatique sécurisée: redémarrer le module, réinstaller à l'échelle de la frontière.
- Évaluation adverse: deux modèles indépendants; accord = confiance。


```figure
i4-incident-agents
```

## Utilisez-le
`code/main.py`模拟多代理分类:log agent 找到错误,metric agent 找到 CPU spike,runbook agent 匹配到已知问题──Supervisor 排序──

## Je le livre.
本课会生成 `outputs/skill-ai-sre-plan.md` Basé sur le volume d'incidents en cours, la maturité de l'équipe, concevoir un déploiement d'IA SRE

## 练习
1. 运行  référencement`code/main.py`Si les agents log et métriques ne sont pas en accord, comment le superviseur peut-il les résoudre ?
2. Pour votre service définissez trois actions de remède automatique sûres.
3. 编写一个结构化 runbook template:sections、required fields、verification commands。
4. La police est-elle pré-détectée ou bien les deux ?
5. 论证一个3人团队应在2026年采用AI SRE,还是等.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| AI SRE | “agent for on-call” | LLM-backed incident investigation + coordination |
| Supervisor agent | “the orchestrator” | 将 incidents 拆分为 sub-queries 的顶层 agent |
| Specialized agent | “domain agent” | 拥有 tool access（日志、指标、runbooks）的 sub-agent |
| Auto-remediation | “AI fixes it” | 狭窄的预先批准 action；不是宽泛的 re-architecture |
| Operational memory | “vector runbooks” | vector DB 中用于 RAG 的 post-mortems + runbooks |
| Adversarial eval | “two-model check” | 独立分析；agreement = confidence |
| NeuBird Hawkeye | “the adversarial one” | 具备 adversarial-eval + memory pattern 的产品 |
| Bits AI | “Datadog's SRE agent” | Datadog 托管的 AI SRE |
| Pre-incident prediction | “early detection” | outage prediction 的 10-15 分钟 lead time |

## 延伸阅读
- [incident.io — AI SRE Complete Guide 2026](https://incident.io/blog/what-is-ai-sre-complete-guide-2026)
- [InfoQ — Human-Centred AI for SRE](https://www.infoq.com/news/2026/01/opsworker-ai-sre/)
- [DZone — AI in SRE 2026](https://dzone.com/articles/ai-in-sre-whats-actually-coming-in-2026)
- [Datadog Bits AI](https://www.datadoghq.com/product/bits-ai/)
- [NeuBird Hawkeye](https://www.neubird.ai/)
- [awesome-ai-sre](https://github.com/agamm/awesome-ai-sre)
