# LLM 可观测性 Stack 选择

> Le marché de la visibilité de 2026 est divisé en deux catégories: plateforme de développement: LangSmith, Langfuse, Comet Opik) met en place des contrôles et des évaluations, une gestion rapide, une répétition de session, mais ne se concentre pas sur la mesure de distance. Langfuse est un noyau MIT et a obtenu un bon équilibre en matière d'observabilité en nuage gratuit. Chaque mois, il y a 50 000 événements. Phoenix est né d'OpenTelemetry, adopte une licence élastique 2.0  Très adapté à la dérive/RAG, mais ne se sert pas de la visibilité de la production régulière.

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**前置要求：**Phase 17 · 08 (métrologie d'inférence), phase 14 (ingénierie des agents)
**Time:** ~60 分钟

## Objectif de l'apprentissage
- 区分开发平台(打包:evals + prompts + sessions)
- Il est également possible de trouver des outils de recherche pour les utilisateurs.
-  Explication OpenTelemetry  Mode de collage, il vous permet de mettre en place un gateway  outils avec une plateforme d'évaluation indépendante   组合起来──
- Pour expliquer les différences de coûts de 2026 ans, il est nécessaire de noter que le taux de copie zéro de l'AX est supérieur à celui de consommation monolithique.

##  problématique
Vous avez une fonction de LLM ⇒ elle peut fonctionner. Mais vous ne voyez pas d'échecs rapides, de boucles d'outils, de régressions de latence, de pics de coûts ou de taux de succès de cache rapides. Vous Google LLM observabilité, vous verrez 8 outils qui prétendent résoudre le même problème, et le prix de l'article est également divisé en 3 catégories.

它们解决的不是同一个问题──LangSmith 回答为什么这次LangGraph run 失败了?Phoenix 回答我的RAG管道是否漂浮?

选择涉及四个轴:stack(LongChain?Raw SDK?multi-vendor?) 许可证宽容(accepter uniquement MIT?Elastic 可以?commercial 没问题?) 预算?$100/mo？$1000/mo) et l'hébergeur personnel (obligatoire)

## 概念
### 两类

**开发平台**Prenez une expérience en cours, regardez quel prompt est efficace, faites une régression avec le nouveau prompt et l'ancien gagnant dans le jeu de données.

**Gateway/telemetry 工具**Pour les appels à déduction, faire des outils de collecte  rapidité, réponse, token, latence, modèle, coût, hélicone, signoz, openLLmetry, phoenix, plus légère, peut être utilisé par OpenTelemetry et un ensemble d'outils d'évaluation indépendants.

### Langfuse  OSS 平衡

- Core Apache / MIT sous licence; par l'intermédiaire de Docker auto-hôte.
- Niveau gratuit en nuage: 50 000 événements par mois.
- Les Evals, la gestion instantanée, les traces, les ensembles de données, les quatre fonctionnalités de la plateforme de développement sont couvertes de manière raisonnable.
- Bon point: vous voulez des fonctionnalités de LangSmith, mais vous devez être auto-hôte ou avoir une licence OSS.

### Phoenix (Arize)  Télémétrie-première, Télémétrie ouverte-native

- Licence élastique 2.0; auto-hébergeur 很简单──
- 非常擅长 RAG 和漂移可视化──Embedding-space scatter plots 很擅长RAG 和漂移可视化── sont des éléments de la même fonction.
- Il n'est pas conçu pour une production post-production durable.
- Le point de départ: le pipeline RAG  développé  débogage dérivé,并与独立门户 搭配用于生产。

### Arize AX  jeu à l'échelle

- Commercial. À travers le parc de glace.
- 声称在尺度下比单形可观性(Datadog-class)便宜约100x──计算方式:你把痕迹存在自己 S3 上的Parquet 中;Arize 直接读取──
- Bon point:> 10 millions de traces par jour, il y a déjà un lac de données, il faut des tableaux de bord spécifiques à la LM mais il ne faut pas payer le prix de Datadog.

### LangSmith  LangChain/LangGraph  priorité

- Commercial, 39$/utilisateur/mois.
- Les piles LangChain et LangGraph sont les meilleures de leur catégorie. Si vous ne les utilisez pas, l'attraction sera très faible.
- Le groupe est déjà engagé dans la LangChain, il est prêt à payer.

### Helicone  basé sur le proxy

- - Je suis là.`OPENAI_API_BASE`替换为 Helicone proxy,15-30 分钟完成设置──
- L'équipe de l'équipe de recherche de l'Université de Londres a été créée pour la première fois en 2008 et a été créée en 2008.
- 包含 failover、caching、rate limits  也可充当 gateway──
- Pour les traces d'agent / multi-étape, la profondeur est inférieure.
- Bon point: rapide démarrage, app à pile unique, besoin de passerelle + observabilité

### Opik (Comet)  Plateforme de développement OSS

- Apache 2.0, complètement OSS.
- 功能集与 Langfuse 类似,带有彗星 传承──
- Bon point: déjà utilisé ML Team de Comet, souhaitant obtenir LLM dans le même panneau 可观测性──

### SigNoz  OpenTelemetry-first 完整APM

- Apache 2.0: par le biais d'OpenTelemetry
- Le point de vue de l'entreprise:

### 粘合层:OpenTelemetry + Conventions sémantiques de génie

OpenTelemetry a publié à la fin de 2025 des conventions sémantiques de GenAI`gen_ai.system`- Je suis là.`gen_ai.request.model`- Je suis là.`gen_ai.usage.input_tokens`Les outils de consommation de l'OTel peuvent être utilisés entre eux.

1. De chaque appel de LLM  émis conformément aux conventions de la GenAI OTel 
2. 路由到 gateway (Helicone / Portkey) pour une utilisation quotidienne
3. 双写到 eval platform (Phoenix / Langfuse) est utilisé pour les régressions.
4. 归档到数据湖(Iceberg), utilisé pour effectuer une analyse à long terme via Arize AX ou DuckDB

### 陷: dans l'erreur de niveau faire des outils

Dans le cadre d'un agent 内部做工具化 (par exemple, ajouter des traces LangSmith) vous mettra 合到该框架── dans le cadre HTTP/OpenAI-SDK 层做工具化 (via OpenLLMetry ou votre passerelle) 更多可移植──

### Tu ne peux pas garder tout.

Lorsque le nombre de demandes > 1M demandes/jour 时, le coût de la rétention complète dépassera les appels de LLM.

### Tu devrais te rappeler le nombre

- Cloud libre Langfuse: 50 000 événements par mois
- LangSmith: 39 $ par utilisateur par mois.
- Helicone gratuite: 100 000 réactifs par mois.
- Arize AX affirme: à l'échelle, en moyenne, il est moins cher que le monolithique.
- Conventions de la génération de l'OpenTelemetry: 2025  publié, 2026  largement adopté.


```figure
i4-otel-glue
```

## Utilisez-le
`code/main.py`模拟在不同保留策略(100% ingestion,échantillonnage,échantillonnage + erreurs) 下一天 1M de traces。 rapport sur les coûts de stockage ainsi que sur les contenus perdus de chaque stratégie。

## Je le livre.
本课会产出 `outputs/skill-observability-stack.md` Selon la position de la licence  la taille  le budget  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la position de la licence  la qualité de la licence 

## 练习
1. Vous avez besoin de l'observabilité de l'OSS, vous avez besoin de l'observabilité de l'OSS.
2. Dans 5 millions de traces par jour et Datadog 报价$ 150K / mois 时, calculer la rupture d'Even de Arize AX 
3. 设计一组你的组织指导方针 应要求每一个LLM call都必须包含的OpenTelemetry GenAI attributs──
4. Le Phoenix est-il suffisant pour la production ?
5. L'hélicone a 20 ms de charge de dépôt.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OpenLLMetry | “OTel for LLMs” | 面向 LLMs 的开源 OpenTelemetry instrumentation |
| GenAI conventions | “OTel attributes” | LLM calls 的标准 OTel attribute names |
| LangSmith | “LangChain observability” | 与 LangChain ecosystem 打包的 commercial platform |
| Langfuse | “OSS LangSmith” | 具备类似功能集的 MIT OSS |
| Phoenix | “Arize dev tool” | OpenTelemetry-native dev/eval platform |
| Arize AX | “scale observability” | Commercial zero-copy Iceberg/Parquet observability |
| Helicone | “proxy observability” | 收集 LLM telemetry + gateway features 的 HTTP proxy |
| Opik | “Comet LLM” | 来自 Comet 的 Apache 2.0 OSS dev platform |
| Session replay | “trace rerun” | 带 tool calls 的完整 agent session replay |
| Eval | “offline test” | 在 labeled dataset 上运行 candidate model/prompt |

## 延伸阅读
- [SigNoz — 2026 顶级 LLM 可观测性工具](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — 设置 Langfuse、LangSmith、Helicone、Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
