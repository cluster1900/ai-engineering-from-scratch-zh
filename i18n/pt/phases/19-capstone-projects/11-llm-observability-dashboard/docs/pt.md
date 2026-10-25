# Capstone 11  LLM 可观测性与 Eval Dashboard

> Langfuse                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 小时

## 问题
Até 2026, cada operação de produção de fluxo de IA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

Você vai construir um painel de controle auto-hosted, que pelo menos de quatro tipos de SDK ingestão família, para rastrear amostras 运行一小组 eval jobs,检测漂移并发发告警――衡门:给定一个故意注入的回归(一个开始产生 PII的提示), o painel de controle pode capturar em cinco minutos并触发告警――

## 概念
Ingest Utilize OTLP HTTP──SDK 生成 GenAI-semconv spans:`gen_ai.system`- Não.`gen_ai.request.model`- Não.`gen_ai.usage.input_tokens`- Não.`gen_ai.response.id`- Não.`llm.prompts`- Não.`llm.completions` Espanhas 落入 ClickHouse fazer análises colunárias; metadados(users、sessions、apps) 落入 Postgres。

Evals como empregos em lote em traços de amostra 上运行。DeepEval 评估 fidelidade、toxicidade 和 resposta relevância。当 trace 携带检索文脈 时,RAGAS 评估检索 métricas。自定义 LLM-judges 运行域特定检查(PII leak、off-policy response)。Eval runs 会作为链接到父母trace 的 eval span 写回同一个 ClickHouse。

Detecção de deriva  observar com o tempo de mudança Embedding 空间分布(bases prompt Embeddings de PSI ou KL divergência) bem como avaliação-score 趋势。Alertas  entrar Prometheus AlertManager, em seguida, até Slack / PagerDuty。UI 使用 Next.js 15 和 Recharts。

## Arquitetura
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
- Ingestão: SDKs OpenTelemetry + convenções semânticas GenAI; transporte HTTP OTLP
- Colector: OpenTelemetry Collector, com processador de amostragem de cauda (para custos controlados)
- Armazenamento: ClickHouse 存 spans, Postgres 存 metadados, S3 存 arquivo de eventos brutos
- Evals: DeepEval, RAGAS 0.2, Arize Phoenix evaluator pack, jurado LLM personalizado
- Drift: PSI / KL em embutidos conjuntos de prompt (transformadores de sentença) semanalmente
- Alerta: Prometheus Alertmanager -> Slack / PagerDuty
- UI: Next.js 15 App Router + Recharts + ações do servidor
- 开箱即用支持的 SDKs: OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM


```figure
ce-otel-drift
```

## Construí-lo
1. **Collector config.**Configurar o OpenTelemetry Collector, contendo o receptor HTTP OTLP, um retendo 100% de rastreos de erro e 10% de rastreos de sucesso, bem como exportadores de ClickHouse e S3.

2. **ClickHouse schema.**   `spans`As colunas 镜像 GenAI semconv:`gen_ai_system`- Não.`gen_ai_request_model`- Não.`input_tokens`- Não.`output_tokens`- Não.`latency_ms`- Não.`prompt_hash`- Não.`trace_id`- Não.`parent_span_id`, mais uma caixa JSON para grandes cargas úteis.

3. **SDK coverage test.**Utilize cada SDK(OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM) e OpenLLMetry auto-instrument 编写一个小型客户端应用――验证每个 SDK 都能生成可нониcal GenAI spans,并落入 ClickHouse──

4. **Eval jobs.**Uma tarefa programada 读取最近15分钟的样本痕迹,并运行DeepEval fidelidade、toxicidade 和答案相关性──输出是链接到父母痕迹的评价跨度──

5. **Custom LLM-judge.**Um juiz de vazamento de PII: deu uma resposta, convocou um guarda LLM para avaliar a probabilidade de vazamento de PII.

6. **Drift detection.**Trabalho semanal 计算本周 集结即时嵌入与过去 4 周基线 间 PSI──如果 PSI 超过门,则告警──

7. **Dashboard.**Utilize Next.js 15,包含页面:overview(spans/sec、cost/user、p95 latency) 、traces(search + waterfall) 、evals(trendência de fidelidade、toxicidade) 、drift(PSI ao longo do tempo) 、alertas。

8. **Alerting chain.**Exportador Prometheus 读取 eval score aggregates 和 latency percentiles;Alertmanager irá alertas 路由到Slack,将关键违规 路由到PagerDuty。

9. **Regression probe.**Inject a bug: É avaliado um chatbot com 1% de probabilidade de começar a vazamento de falsos SSNs.

## Use-o
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## Entrega-o
`outputs/skill-llm-observability.md`É um objeto de entrega. É um aplicativo de LLM, o painel de trabalho pode ingerir os seus traços, executar avaliações, emitir notificações e mostrar a divisão de custos/usuários no Next.js.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTD（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## 练习
1. Para o quadro de "Haystack" adicione instrumentos personalizados.`gen_ai.*`atributos 落入 ClickHouse。

2. Em um mesmo grupo de traços, o DeepEval é transformado em avaliadores Phoenix.

3. 强化漂移探测器:按app-id而不是全局计算PSI──显示 per-app drift trails──

4. 添加一个"user impact" 页面: custo-per-usuário 和 rate-failure-per-user,并带有闪光线──

5. Construir uma política de amostragem de cauda: manter 100% de toxicidade > 0,5 traços, refazer 10% de amostragem estratificada sobre os restantes traços.

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
- [Langfuse](https://github.com/langfuse/langfuse) referência observabilidade de núcleo aberto 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)                                                                                                                                                                                                                                                              
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) Família de SDK de auto-instrumentação
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) esquema de ingestão
- [Helicone](https://www.helicone.ai) 另一个托管可观性
- [Braintrust](https://www.braintrust.dev) 另一个 eval-first plataforma
- [ClickHouse documentation](https://clickhouse.com/docs) loja de comprimento columnar
- [DeepEval](https://github.com/confident-ai/deepeval) Biblioteca de avaliadores
