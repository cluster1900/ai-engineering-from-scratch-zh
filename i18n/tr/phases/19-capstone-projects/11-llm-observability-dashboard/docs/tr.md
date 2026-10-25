# Capstone 11  LLM 可观测性与Eval Dashboard

> Langfuse  dönüşüm açık çekirdek için. Arize Phoenix  yayınladı 2026 GenAI semconv 映射──Helicone 和 Braintrust 都加码了按用户成本归因──Traceloop'un OpenLLMetry 成为事实上的 SDK instrumentation──生产形态是使用ClickHouse 存储的痕迹,使用Postgres 存储的元数据,使用Next.js 做 UI,再加上一小支 eval、工作(DeepEval RAGAS、LLM-judge) 在样品的痕迹上运行──构建一个自主托管的版本,至少从四类 SDK aile ingest,并演示在五分内捕获一个注入的回归──

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 小时

## 问题
2026 yılına kadar, her çalışmanın üretim akımının AI  ekibi  modelin yanında bir gözlemlebilirlik düzeni koruyacaktır.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

Siz kendi kendine barındırılmış bir tablo oluşturur, en az dört SDK ailesinden alınacak, örnek izleri doğrultusunda 运行一小组 eval jobs,检测漂移并发发告警――衡量门:给定一个故意注入的回归(一个开始产生 PII 的提示),dashboard 能在五分钟内捕获它并触发告警――

## 概念
İçeri alın OTLP HTTP。SDK 生成 GenAI-semconv alanları:`gen_ai.system`- Evet.`gen_ai.request.model`- Evet.`gen_ai.usage.input_tokens`- Evet.`gen_ai.response.id`- Evet.`llm.prompts`- Evet.`llm.completions`❖ İlaçlar 落入 ClickHouse yapım sütun analitikleri; metadatalar  kullanıcılar ̇ oturumlar ̇ uygulamalar 落入 Postgres。

Evals 作为批次工作 在样品痕上运行──DeepEval 评估忠诚度、毒性 和答案相关性──当 trace 携带检索文脈 时,RAGAS 评估检索指标──自定义 LLM-jujisses 运行域特异检查(PII sızması、政策 dışı yanıt)──Eval runs 会作为链接到父母追踪的 eval 写回同一个 ClickHouse──

Drift algısı  observer with time change Embedding 空间 distribution(based prompt Embeddings'in PSI veya KL farklılığı) ve eval-score 趋势。Alerts  Prometheus AlertManager'e girin, sonra Slack / PagerDuty。UI kullanın Next.js 15 和 Recharts。

## Yapılandırma
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
- İçebilirlik: OpenTelemetry SDK + GenAI semantik sözleşmeleri; OTLP HTTP taşımacılığı
- Toplayıcı: OpenTelemetry Toplayıcı, kuyruğu örnekleme işlemci ile birlikte
- Kayıt: ClickHouse 存 spans,Postgres 存 metadata,S3 存 çiğ olay arşivini
- Evals: DeepEval, RAGAS 0.2, Arize Phoenix değerlendirici paketi, özel LLM yargıç
- Aktarım: PSI / KL haftalık toplu hızlı yerleştirmeler (cümle dönüştürücüler)
- Alarm: Prometheus Alertmanager -> Slack / PagerDuty
- UI: Next.js 15 App Router + Recharts + sunucu eylemleri
- 开箱即用支持的 SDKs: OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM


```figure
ce-otel-drift
```

## Yapın onu.
1. **Collector config.** Configuration OpenTelemetry Collector, OTLP HTTP alıcısı, %100 hata izlerini ve %10 başarının izlerini koruyan bir kuyruğu örneği, ayrıca ClickHouse ve S3 ihracatçılarına aktarımını içerir.

2. **ClickHouse schema.**Çekil`spans`镜像 GenAI semconv:`gen_ai_system`- Evet.`gen_ai_request_model`- Evet.`input_tokens`- Evet.`output_tokens`- Evet.`latency_ms`- Evet.`prompt_hash`- Evet.`trace_id`- Evet.`parent_span_id`, tekrar uzun payloadlar için kullanılacak bir JSON çantası ekle. kullanıcı id ve app id'e göre ikincici indeksler ekle.

3. **SDK coverage test.**Bu uygulamaların her biri, OpenAI, Antropic, Google, LangChain, LlamaIndex, vLLM ve OpenLLMetry otomatik aletleri kullanıyor.

4. **Eval jobs.**Bir programlı iş 读取最近 15 分钟的样本痕迹,并运行DeepEval sadakat、toksiklik 和回答相关性──输出是链接到父母的追踪的评价跨度──

5. **Custom LLM-judge.**Bir PII sızdırma yargıç:给定一个答案,调用一个警卫 LLM 来评分 PII sızdırma olasılığını──高分答案 进入 triage queu──

6. **Drift detection.**Haftalık iş 计算本周 聚合式快速嵌入与过去 4 周基线 之间 PSI── PSI                                                                                                                                                                                                                                                

7. **Dashboard.**kullan Next.js 15,包含页面:view(spans/sec、cost/user、p95 latency) 、traces(search + waterfall) 、evals(faithfulness trend、toxicity) 、drift(PSI over time) 、alertes。

8. **Alerting chain.**Prometheus ihracatçı 读取 eval skor agregat 和 latency percentiles;Alertmanager uyarıları 路由至Slack, 路由至PagerDuty─

9. **Regression probe.**Bir hata girdi: değerlendirilmiş chatbot %1 olasılığı var. Sahte SSN'ler yayılmaya başlıyor.

## Kullan
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## - Söyle.
`outputs/skill-llm-observability.md`Bu uygulama, bir LLM uygulaması, bir masaüstü, onun izlerini ▌ yürütme değerlendirmeler ▌ hareket     bildirici polis, ve Next.js'te maliyet/kullanıcı dağılımı göstermek için kullanılabilir.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTD（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## 练习
1. Haystack çerçevesini eklemek için özel aletler kullanmak için.`gen_ai.*`落入 ClickHouse。

2. Aynı grup izlerde, "DeepEval"i Phoenix değerlendiricileri olarak değiştirmek için kullanılıyor.

3. 强化漂移探测器:app-id yerine tüm局计算 PSI değil, uygulama başına sürükleyici izleri gösterir.

4. 添加一个"user impact" 页面:user-cost 和 failure-rate-per-user,并带有火花链──

5. Buğday örneği politikası oluşturmak: %100 toksisite > 0.5'lik izleri tutmak, geri kalan izlere yeniden %10 katmanlı örnek yapmak.

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
- [Langfuse](https://github.com/langfuse/langfuse) reference açık çekirdek gözlemsellik 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  güçlü akıntı desteği olan başka bir referans
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) Otomatik aletleşme SDK ailesi
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) içme şeması
- [Helicone](https://www.helicone.ai) 另一个托管可观性
- [Braintrust](https://www.braintrust.dev) 另一个 eval-first platform
- [ClickHouse documentation](https://clickhouse.com/docs) sütun uzantısı depolama
- [DeepEval](https://github.com/confident-ai/deepeval) değerlendirici kütüphanesi
