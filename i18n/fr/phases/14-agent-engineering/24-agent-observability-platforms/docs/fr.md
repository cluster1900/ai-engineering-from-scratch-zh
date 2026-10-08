# Agents 可观测性: Langfuse, Phoenix, Opik

> L'opération de mise en œuvre de l'opération de mise en œuvre de l'opération de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de l'option de mise en œuvre de l'option de mise en œuvre de l'option de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'option de l'option de mise en œuvre de l'option de mise en œuvre de l'option de l'option de mise en œuvre de l'option de mise en œuvre de mise en œuvre de l'option de l'option de mise en œuvre de l'option de mise en œuvre de l'option de l'option de mise en œuvre de mise en œuvre de l'option de mise en œuvre de l'option de mise en œuvre de l'op

**类型：**Apprendre à apprendre
**语言：**Python (stdlib)
**前置要求：**Phase 14 · 23 (OTel GenAI)
**时间：**Il est 45 minutes.

## Objectif de l'apprentissage

- Il existe trois plateformes Open Source et une licence.
- 区分每个平台最擅长的方面:Langfuse (sessions instantanées de mgmt +) Phoenix (RAG + auto-instrumentation) Opik (optimisation + barreaux) 
-  Expliquer pourquoi, d'ici 2026, 89% des rapports d'organisation ont déjà déployé un agent observable
- ¢ réaliser un pipeline de trace à tableau de bord ¢ évaluation de la qualité des résultats ¢

##  problématique

OTel GenAI (leçon 23) vous a donné un schéma. Vous avez toujours besoin d'une plateforme pour ingérer des spans, des opérations d'évaluation, des versions rapides de stockage et de rétrogressions.

## 核心概念

### Langfuse (MIT)

- Chaque mois 6M+ SDK est installé, 19k+ GitHub stars.
- 功能:tracing、带 versioning + prompt management of playground、évaluer(LLM-as-judge、user反、自定义)、session replacements。
- 2025 年 6 月:原先的商业模块(LLM-as-a-judge、annotation queues、prompte expériences、Playground) en sous-source ouverte à MIT
- La mise en œuvre de la stratégie de gestion rapide est une technique de gestion rapide.

### Arize Phoenix (licence élastique 2.0)

- En outre, les données de recherche et de recherche sur les agents sont également disponibles dans les pays tiers.
- Origines de l'automatisation de l'Inference ouverte
-                                                                                                                                                                                                                                                               
- 没有快速版本  定位是与更广泛平台配合使用的漂移/行为-回归工具
- La détection des anomalies est une caractéristique de la détection des anomalies.

### Comète Opik (Apache 2.0)

- À travers des expériences A/B  réaliser une automatisation rapide 优化。
- Régimes de protection de l'information publicitaire
- Juge de la loi de droit
- Comet  auto mesure de référence: Opik logs + évaluations UZ 23.44s, tandis que Langfuse est 327.15s  approximativement 14x  différence)  va être le point de référence du fournisseur 视为方向性参考──
- La mise en œuvre de la politique de sécurité est une priorité pour les entreprises.

### Données du secteur

Selon Maxim(2026 année analyse sur le terrain):89% des organisations ont déjà déployé des agents可观测性; les problèmes de qualité sont les principaux obstacles à la production(32% des répondants les mentionnent)

### 如何选择

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### Cette façon est facile à trouver

- **没有 eval strategy。**Pas de trace de l'évaluation, c'est juste une extraction coûteuse.
- **没有 grounding 的自建 LLM-judge。**Leur expérience de travail est très révélatrice.
- **Prompt versions 没有关联到 traces。**Quand le prod apparaît en régression, vous ne pouvez pas diviser jusqu'à ce que la question soit posée.


```figure
wb-trace-ingest
```

## - Je le construis.

`code/main.py`实现 un collecteur de traces stdlib + juge évaluateur LLM:

- Ingestation des générations 形态的跨度──
- 按 session 分组,标记失败 runs gardeil trips 低置信度 evals)
- Un juge de LLM, selon la rubrique Réponses aux agents 评分──
- Résumé du tableau de bord: taux d'échec, causes de défaillance, répartition des scores évaluables

运行:

```
python3 code/main.py
```

输出: les scores d'évaluation de chaque session et la catégorisation des échecs, en accord avec Langfuse/Phoenix/Opik 会展示的内容──

## Utilisez-le

- **Langfuse**L'hébergement autonome ou dans le cloud; via OTel ou leur SDK 接入──
- **Arize Phoenix**Autonomie de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil ou de l'appareil.
- **Comet Opik**Autogestion ou cloud; boucle d'optimisation automatisée.
- **Datadog LLM Observability**适合已运行 Datadog's mixed ops+ML 团队。

## Je le livre.

`outputs/skill-obs-platform-wiring.md`选择一个平台,并将追踪 + évaluations + versions rapides 接入现有代理──

## 练习

1. Les traces de l'OTel de la semaine seront envoyées dans le cloud Langfuse.
2. Pour votre domaine, écrivez une rubrique de la Juge de LLM (facts correctness, contextes, scope de suivi)
3. Comparer la version rapide de Langfuse avec la clusterage de traces de Phoenix... lequel peut vous dire plus vite ce qui est mal ?
4. Pour votre agent, lancez-vous dans la garde-corps de rédaction des PII.
5. Dans votre corps, évaluez ces trois plateformes.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tracing | “Spans collector” | Ingest OTel / SDK spans；按 session 建索引 |
| Prompt management | “Prompt CMS” | 关联到 traces 的 versioned prompts |
| LLM-as-judge | “Automated eval” | 单独的 LLM 按 rubric 对 Agent output 评分 |
| Session replay | “Trace playback” | 逐步回放过去的 runs 以便 debugging |
| RAG relevancy | “Retrieval quality” | retrieved context 是否匹配 query |
| Trace clustering | “Behavioral grouping” | 对相似 runs 聚类，用于 drift detection |
| Guardrail enforcement | “Policy at log time” | 对 logged content 做 PII/toxicity/scope checks |

## 延伸阅读

- [Langfuse docs](https://langfuse.com/) traçabilité ̇evals ̇immédiatement
- [Arize Phoenix docs](https://docs.arize.com/phoenix) auto-instrumentation  dérive
- [Comet Opik](https://www.comet.com/site/products/opik/) Optimisation + barreaux
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Three platforms都会消费的方案
