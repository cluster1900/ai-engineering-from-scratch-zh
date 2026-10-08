# Capstone 11  LLM 可观测性与Eval Dashboard

> Langfuse 转向开源核心──Arize Phoenix 发布了2026 GenAI semconv 映射──Helicone 和 Braintrust 都加码了按用户成本归因──Traceloop's OpenLLMetry 成为事实上的 SDK instrumentation──生产形态是使用ClickHouse 存储的痕迹,使用Postgres 存储的元数据,使用Next.js做UI,再加上一小支 eval、jobs(DeepEvalRAGAS、LLM-judge) 在样本的痕迹上运行──构建一个自主托管的版本,至少从四类SDK家族摄入,并演示在五分钟内捕获一个注入的回归──

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 小时

##  problématique
D'ici 2026, chaque opération de production de flux d'IA 团队都将在模型旁边保留一个可观性平面──成本归因──幻觉检测──漂移监控──jailbreak 信号──SLO Dashboards──PII 泄露告警──开源参考实现  Langfuse、Phoenix、OpenLLMetry  已围绕OpenTelemetry GenAI semantic conventions 收为摄入方案──现在你可以使用一个SDK仪器 覆盖OpenAI、Anthropic、Google、LangChain、LlamaIndex 和 vLLM,并发送兼容的跨度──

Vous allez construire un tableau de bord auto-hébergé, il doit être utilisé par la famille SDK, pour les traces échantillonnées, pour effectuer un groupe d'évaluations, pour effectuer des tests et des tests.

## 概念
Ingest Utilisation OTLP HTTP。SDK 生成 GenAI-semconv couvre:`gen_ai.system`- Je suis là.`gen_ai.request.model`- Je suis là.`gen_ai.usage.input_tokens`- Je suis là.`gen_ai.response.id`- Je suis là.`llm.prompts`- Je suis là.`llm.completions` Spans 落入 ClickHouse faire des analyses colonnalisées; métadonnées(utilisateurs, sessions, applications) 落入 Postgres。

Evals 作为批次工作 在样品追踪 上运行。DeepEval 评估忠诚度、毒性和答案相关性──当 trace 携带检索背景 时,RAGAS 评估检索指标──自定义 LLM-judges 运行域特定检查(PII leak、off-policy response)──Eval runs 会作为链接到父母追踪的评估跨度 写回同一个ClickHouse──

Détection de dérive  observer avec le temps de changement Embedding 空间分布(basée sur la divergence de PSI ou KL de l'embedding prompt) ainsi que l'évaluation du score 趋势。Alertes  entrez dans Prometheus AlertManager, puis dans Slack / PagerDuty。UI 使用 Next.js 15 和 Recharts。

## 架构
```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## 技术
- Ingest: SDK OpenTelemetry + conventions sémantiques GenAI; transport HTTP OTLP
- Collecteur: Collecteur OpenTelemetry, avec processeur de prélèvement de la queue (pour le contrôle des coûts)
- Stockage: CliqueHouse 存 spans, Postgres 存 métadonnées, S3 存 archive d'événements bruts
- Evals: DeepEval, RAGAS 0.2, Arize Phoenix évaluateur pack, juge spécialisé en LLM
- Drift: PSI / KL sur les intégrations rapides combinées (transformateurs de phrases) hebdomadaire
- Alerte: Prometheus AlertManager -> Slack / PagerDuty
- UI: Next.js 15 App Router + Recharts + actions serveur
- Les SDK sont fournis avec support: OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM


```figure
ce-otel-drift
```

## - Je le construis.
1. **Collector config.**Configurer OpenTelemetry Collector, contenant un récepteur HTTP OTLP, un échantillon de queue de 100% de traces d'erreur et 10% de traces de succès, ainsi que des exportateurs de ClickHouse et S3.

2. **ClickHouse schema.** `spans`Les columnes 镜像 GenAI semconv:`gen_ai_system`- Je suis là.`gen_ai_request_model`- Je suis là.`input_tokens`- Je suis là.`output_tokens`- Je suis là.`latency_ms`- Je suis là.`prompt_hash`- Je suis là.`trace_id`- Je suis là.`parent_span_id`, réajouter un JSON pour les charges utiles longues.

3. **SDK coverage test.**Utilisez chaque SDK(OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM) et OpenLLMetry auto-instrument 编写一个小型客户端应用──验证每个 SDK 都能生成可нониcal GenAI spans,并落入 ClickHouse──

4. **Eval jobs.**Une tâche planifiée 读取最近 15 分钟的样本痕迹,并运行DeepEval fidélité、toxicité 和答案相关性──输出是链接到父母痕迹的评估跨度──

5. **Custom LLM-judge.**Un juge de fuite d'informations sur les données: donne une réponse, rédige un LLM de garde pour évaluer la probabilité de fuite d'informations sur les données  entrée dans la file de triation 

6. **Drift detection.**Emploi hebdomadaire 计算本周 集结即时嵌入与过去 4 周基线 之间的 PSI──如果PSI 超过门,则告警──

7. **Dashboard.**Utilisation de la page suivante.js 15, contenant le site:voir ci-dessous:

8. **Alerting chain.**Exportateur Prometheus 读取 eval score aggregates 和 latency percentiles;Alertmanager va mettre en garde 路由到Slack, va mettre en garde contre les violations critiques 路由到PagerDuty。

9. **Regression probe.**Enregistrer un bug: est évalué chatbot avec 1% de chances de commencer à divulguer de faux SSN.

## Utilisez-le
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## Je le livre.
`outputs/skill-llm-observability.md`Il est possible de faire une demande de Master en cours de formation en ligne, de faire une analyse des traces de la formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours de formation en cours en cours de formation en cours de formation en cours en cours de formation en cours de formation en cours en cours de formation en cours en cours de formation en cours en cours de formation en cours en cours de formation en cours de formation en cours en cours en cours de formation en cours.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTR（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## 练习
1. Pour le cadre de Haystack 添加定制仪器化──验证法典跨度 以忠实 `gen_ai.*`attributs 落入 ClickHouse。

2. Dans les mêmes traces, la mise en place de l'évaluation de la valeur de DeepEval est transformée en évaluateur Phoenix.

3. 强化漂移探测器: selon l'app-id et non selon la PSI.

4. 添加一个"user impact" 页面: coûts par utilisateur 和 taux d'échec par utilisateur,并带有闪光线──

5. construire une politique de prélèvement de la queue: conserver des traces de toxicité de 100% > 0,5 et refaire des traces restantes en faisant un échantillon stratifié de 10% ⋅

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GenAI semconv | "OTel LLM attributes" | 2025 OpenTelemetry spec，用于 LLM span attributes（system、model、tokens） |
| Tail sampling | "Post-trace sample" | Collector 在 trace 完成后决定保留还是丢弃（可以查看 errors） |
| PSI | "Population stability index" | 比较两个分布的 drift metric；> 0.2 通常表示有意义的 drift |
| LLM-judge | "Eval as model" | 一个 LLM 按 rubric（faithfulness、toxicity、PII）为另一个 LLM 的 output 打分 |
| Tail-sampling policy | "Keep-rule" | 决定哪些 traces 持久化、哪些丢弃的规则；errored + sample-rate |
| Eval span | "Linked eval trace" | 携带 eval score、并链接到原始 LLM call span 的 child span |
| Cost per user | "Unit economics" | 在一个窗口内归因到某个 user_id 的美元成本；关键 product metric |

## 延伸阅读
- [Langfuse](https://github.com/langfuse/langfuse) reference à l'observabilité à noyau ouvert 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  avoir un support de dérive fort
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) Famille de KDD d'instrumentation automatique
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) schéma d'ingestion
- [Helicone](https://www.helicone.ai) 另一个 hébergé observabilité
- [Braintrust](https://www.braintrust.dev) 另一个 eval-first plateforme
- [ClickHouse documentation](https://clickhouse.com/docs) magasin de couches de couches
- [DeepEval](https://github.com/confident-ai/deepeval) bibliothèque d'évaluation
