# OpenTelemetry GenAI 语义约定

> Le SIG de la génération de Télémetry (OpenTelemetry) a défini le schéma standard de la télémétrie des agents. Les noms de domaine, les attributs et les règles de capture de contenu sont utilisés entre les fournisseurs, de sorte que les traces des agents dans Datadog, Grafana, Jaeger et Honeycomb signifient la même chose.

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 分钟

## Objectif de l'apprentissage
- Il faut savoir que les générations de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de génération de
- - Je suis là .`invoke_agent`CLIENT et champs internes, ainsi que leurs scénarios de mise en œuvre respectifs.
- 列出顶层 Attributs GenAI: nom du fournisseur, modèle de demande, identifiant de la source de données
- 解释 contenu-capture contrat:opt-in`OTEL_SEMCONV_STABILITY_OPT_IN`、récommande de référence externe¬¬

##  problématique
Chaque fournisseur a élaboré son propre nom de domaine. Les équipes d'opérations doivent définir chaque cadre en construisant des tableaux de bord séparément.

## 概念
### Catégories de champs

1. **Model / client spans.**覆盖原始 LLM calls──由 fournisseur SDKs(Anthropic、OpenAI、Bedrock) et adaptateurs de modèles de cadre 发发出──
2. **Agent spans.** `create_agent`(agent de construction 时)`invoke_agent`(运行 agent 时)
3. **Tool spans.**Chaque fois que l'outil est invoqué, il y a un lien entre les parents et les enfants.

### Nom de l'agent

- Nom de domaine:`invoke_agent {gen_ai.agent.name}`- Le retour`invoke_agent`Il y a une autre.
- Une espèce de spande:
  - **CLIENT** Utilisé pour les services d'agents à distance OpenAI Assistants API、Bedrock Agents)
  - **INTERNAL** Utilisé dans les cadres d'agents en cours de processus (LangChain, CrewAI, local ReAct)

### Attributs clés

- `gen_ai.provider.name` `anthropic`- Je suis là.`openai`- Je suis là.`aws.bedrock`- Je suis là.`google.vertex`Il y a une autre.
- `gen_ai.request.model` Identification du modèle
- `gen_ai.response.model` 解析后的模型(可能因路由而不同于请求)。
- `gen_ai.agent.name` identifiant de l'agent
- `gen_ai.operation.name` `chat`- Je suis là.`completion`- Je suis là.`invoke_agent`- Je suis là.`tool_call`Il y a une autre.
- `gen_ai.data_source.id`Pour RAG: enquête sur le corps ou le magasin.

L'Anthropic 、Azure AI Inference 、AWS Bedrock 、OpenAI sont des conventions spécifiques à la technologie ∼

### Capture de contenu

默认规则:instrumentations 默认 NE DEVRAIENT PAS capturer les entrées/sorties。Capture 通过以下方式选择:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

推的生产模式:将内容存储在外部(S3、你的日志店),在跨度上记录引用(pointer ID, et non la prose) ⋅

### Stabilité

截至 2026 年 3 月, la plupart des conventions 仍是实验性──使用以下方式选择到稳定预览:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ 会将 GenAI attributs 原生映射到其LLM Observability schema。其他后台(Grafana、Honeycomb、Jaeger) support raw attributs。

### Cette façon est facile à trouver

- **在 spans 中捕获完整 prompts。**Les données des clients seront enregistrées dans les opérations.
- **没有 `gen_ai.provider.name`。**attribution 缺失时,des tableaux de bord multi-fournisseurs 会失效。
- **没有 parent links 的 spans。**Il existe des outils isolés.
- **没有设置 stability opt-in。**Au bout du temps, tes attributs pourraient être renommés.


```figure
ae-genai-span-tree
```

## - Je le construis.
`code/main.py`实现 un émetteur stdlib d'espace correspondant aux conventions de GenAI:

- 带 GenAI schéma d' attribut `Span`Il y a une autre.
- 带 `start_span`、contexts de contextes`Tracer`Il y a une autre.
- Un agent scripté, il sort:`create_agent`- Je suis là.`invoke_agent`(INTERNAL) ≈ pour les appels de LLM ≈ pour les appels de licence`chat`à l'intérieur de la zone de décharge
- Un mode de capture de contenu, mettra les invites stockées à l'extérieur et se déroulera sur les identifiants de registre.

Je vais le faire.

```
python3 code/main.py
```

输出: un arbre de portée qui contient tous les attributs GenAI nécessaires, ainsi qu'un " magasin externe " affichant des références de contenu opt-in.

## Utilisez-le
- **Datadog LLM Observability**(v1.37+) attributs de la projection de l'origine
- **Langfuse / Phoenix / Opik**(Léction 24)  auto-instrument 生态。
- **Jaeger / Honeycomb / Grafana Tempo** traces OTel brutes; à partir des attributs de GenAI construire des tableaux de bord。
- **Self-hosted** Utilisez un processeur GenAI 运行 OTel Collector。

## Je le livre.
`outputs/skill-otel-genai.md`L'OTel GenAI couvre 接入现有代理,并带有内容捕获默认和外部参考存储.

## 练习
1. Utilisation `invoke_agent`(INTERNAL) + par outil couvre l'instrument Votre leçon 01 ReAct loop── envoyer à une instance Jaeger──
2. En mode "références seulement" 中添加内容捕获:prompts 写入 SQLite,span attributs 只携带行ID──
3. 阅读 `gen_ai.data_source.id`Je vais vous le dire.
4.  mise en place `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`,并验证 tes attributs ne seront pas récoltées renommé.
5. Construire un tableau de bord: uniquement à partir des attributs de GenAI voir "quels sont les erreurs d'outil avec quels modèles related"―

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GenAI SIG | "OpenTelemetry GenAI group" | 定义 schema 的 OTel working group |
| invoke_agent | "Agent span" | 表示一次 agent run 的 span name |
| CLIENT span | "Remote call" | 调用 remote agent service 的 span |
| INTERNAL span | "In-process" | in-process agent run 的 span |
| gen_ai.provider.name | "Provider" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "RAG source" | retrieval 命中了哪个 corpus/store |
| Content capture | "Prompt logging" | 对 messages 的 opt-in capture；prod 中存储在外部 |
| Stability opt-in | "Preview mode" | 用于固定 experimental conventions 的 env var |

## 延伸阅读
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 规范
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 默认提供 GenAI spans
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Spans OTel à l'intérieur
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) Context de trace du W3C 传播
