# OpenTelemetry GenAI  端到端 Tracking Tool Appels téléphoniques

> Un agent a utilisé cinq outils, trois serveurs MCP et deux sous-agents. Vous avez besoin d'un tracé de tous les éléments.

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- Expliquer la durée de la LLM et la durée d'exécution des outils nécessaires aux attributs OTel GenAI
- 构建覆盖代理循环、LLM call、tool call 和 MCP client de dépêche de la hiérarchie de trace
- Décider de capturer quel contenu (opt-in) et de le rédiger
- Dans le cas d'un code d'outil non réécrit, les couches seront envoyées à un collectionneur local.

##  problématique
Un cas de débogage de 2 mois de 2026: le rapport de l'utilisateur mon agent a besoin de 30 secondes pour répondre; l'autre temps seulement de 3 secondes sans traces Les logs  montrent un appel LLM, mais pas d'envoi d'outils MCP serveur aller-retour, pas non plus de sous-agent

Il n'y a pas de traçage, vous ne pouvez pas localiser ce problème.

Ces conventions ont été définies par le groupe de conventions sémantiques OpenTelemetry en 2025-2026 定型── elles définissent des noms d'attributs stables, donc Datadog、Langfuse、Phoenix、OpenLLMetry 和 AgentOps peuvent résoudre des intervalles similaires── elles ont seulement besoin d'instrumentation une fois; elles peuvent être envoyées à tout backend──

## 概念
### Hiérarchie de la langue

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

Tout le processus est en train de se dérouler dans le même identifiant.

### Attributs requis

Selon les résultats de la séminaire 2025-2026,

- `gen_ai.operation.name` `"chat"`- Je suis là.`"text_completion"`- Je suis là.`"embeddings"`- Je suis là.`"execute_tool"`- Je suis là.`"invoke_agent"`Il y a une autre.
- `gen_ai.provider.name` `"openai"`- Je suis là.`"anthropic"`- Je suis là.`"google"`- Je suis là.`"azure_openai"`Il y a une autre.
- `gen_ai.request.model` Chaîne de modèle de requête `"gpt-4o-2024-08-06"`)。
- `gen_ai.response.model` 实际提供服务的模型──
- `gen_ai.usage.input_tokens`- Je suis là .`gen_ai.usage.output_tokens`Il y a une autre.
- `gen_ai.response.id` Utilisé pour l'identification de réponse du fournisseur de connexion

 Pour les couches d'outils:

- `gen_ai.tool.name` identifiant de l'outil。
- `gen_ai.tool.call.id` 具体电话 id──
- `gen_ai.tool.description` description de l'outil

 Pour les intervalles d'action:

- `gen_ai.agent.name`- Je suis là .`gen_ai.agent.id`- Je suis là .`gen_ai.agent.description`Il y a une autre.

### Les espèces de spans

- `SpanKind.CLIENT`Utilisation de la limite de processus transversale du fournisseur de LLM, du serveur MCP)
- `SpanKind.INTERNAL`Utilisez les étapes de boucle de l'agent et l'exécution de l'outil.

### Capture de contenu à option

默认情况下, spans 携带 metrics 和 timing, plutôt que des invites ou des compléments ⋅ grandes charges et PII 默认关闭──设置 ⋅`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`Et des environnements de capture de contenu spécifiques qui contiennent du contenu.

### Evénements sur les spans

Les événements au niveau des jetons peuvent être considérés comme des événements de durée 添加:

- `gen_ai.content.prompt` messages d'entrée。
- `gen_ai.content.completion` messages de sortie。
- `gen_ai.content.tool_call` 记录下来的工具调

Les événements dans une période de temps en ordre, facilité à répétition détaillée.

### Les exportateurs

Les étendues d'OTel peuvent être portées à:

- **Jaeger / Tempo.**OSS, sur place.
- **Langfuse.**面向LLM observabilité; utilisation des jetons可视化
- **Arize Phoenix.**Evals + traçage 结合。
- **Datadog.**商业产品; 原生解析 `gen_ai.*`Les attributs
- **Honeycomb.**Il est orienté vers la colonne;

Ils utilisent tous le format OTLP, c'est-à-dire le format fil.

### Propagation à travers les PCM

Lorsque le client MCP 调用 server 时,把 W3C traceparent header 注入请求──Streamable HTTP 支持标准头条──Stdio 不原生携带HTTP头条;该规范的2026 roadmap 讨论在 JSON-RPC calls 上添加`_meta.traceparent`Je suis en train de vous dire:

Avant de le publier: manuels à chaque demande `_meta`中包含 traceparent──Serveur 记录 trace id──

### Les mesures

Outre les sphères, GenAI Semconv a également défini les métriques:

- `gen_ai.client.token.usage` histogramme。
- `gen_ai.client.operation.duration` histogramme。
- `gen_ai.tool.execution.duration` histogramme。

Ces tables de bord seront utilisées sans avoir besoin de détails par appel.

### Couche AgentOps

AgentOps (fondée en 2024) est spécialisée dans l'observabilité de la génération de génération de l'intelligence artificielle. Elle contient des cadres populaires.


```figure
t3-span-waterfall
```

## Utilisez-le
`code/main.py`Il est utilisé pour une utilisation de deux outils LLM, et effectué une fois par un agent de retour de MCP. Il n'y a pas de véritable exportateur.

需要关注的点:

- Toutes les sphères de la route sont partagées avec un identifiant de trace.
- Les liens parent-enfant  via `parentSpanId`- Je suis désolé.
- Il est indispensable`gen_ai.*`attributs 已填充──
- Capture de contenu 默认关闭; l'un des scénarios sera passé par env 打开它──

## Je le livre.
本课会产出 `outputs/skill-otel-genai-instrumentation.md` Donner une base de code d'agent, cette compétence produira un plan d'instrumentation:

## 练习
1. 运行  référencement`code/main.py` Les statistiques couvrent les données, et identifier qui est le client, qui est le interne.

2. 打开 contenu capturer env var), confirmer apparaître `gen_ai.content.prompt`et `gen_ai.content.completion`Les événements, attention à l'impact des PII

3. 添加 métriques d'exécution des outils `gen_ai.tool.execution.duration`,并按每次调用将其作为一个 histogramm样本发送──

4. La durée de la transmission du traceparent à la demande du MCP`_meta.traceparent`Le serveur MCP verra le même identifiant de trace.

5. 阅读 OTel GenAI semconv spec. 找出一个 semconv 中列出但本课代码没有发送的属性──添加它──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | 用于 traces、metrics、logs 的开放标准 |
| GenAI semconv | "GenAI semantic conventions" | LLM / tool / agent spans 的稳定 attribute names |
| `gen_ai.*` | "The attribute namespace" | 所有 GenAI attributes 都共享此前缀 |
| Span | "Timed operation" | 一个具有 start、end 和 attributes 的 work unit |
| Trace | "Cross-span ancestry" | 共享同一个 trace id 的 spans 树 |
| SpanKind | "CLIENT / SERVER / INTERNAL" | 关于 span direction 的提示 |
| OTLP | "OpenTelemetry Line Protocol" | exporters 使用的 wire format |
| Opt-in content | "Prompt / completion capture" | 默认关闭；通过 env var 启用 |
| traceparent | "W3C header" | 跨 services 传播 trace context |
| Exporter | "Backend-specific shipper" | 将 spans 发送到 Jaeger / Datadog / 等的组件 |

## 延伸阅读
- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Conventions de l'autorité de l'AI générique sur les étendues, les mesures et les événements
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) LLM et attribut de durée d'exécution des outils 列表
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) au niveau des agents `invoke_agent`débit
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) Source d'autorité de GitHub 托管
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) intégration de la production 讲解
