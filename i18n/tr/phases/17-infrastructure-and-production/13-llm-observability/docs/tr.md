# LLM 可观测性 Stack 选择

> 2026 yılında görülebilirlik pazarı iki kategoriye ayrılmıştır. geliştirme platformu ([[LangSmith]], [[Langfuse]], [[Comet Opik]]) monitörlük ve değerlendirmeler, ızdırıcı yönetim, seans tekrarlaması ısıtılar. [[Gateway/ tooling tool]] [[Helicone]], [[SigNoz]], [[OpenLLMetry]], [[Phoenix]]) uzaktan uzaktan uzaktan uzaktan uzaktan uzaktan uzaktan uzaktan uzanan bir işlem yapmaktadır. [[Langfuse]] MIT lisanslı bir çekirdeğidir ve OSS'ten iyi bir dengeleme elde eder. [[Özgür bulut]] her ay 50K etkinlik gerçekleştirir. [[Phoenix]] [[OpenTelemetry_OpenTelemetry_OpenTelemetry]] yerli, Elastik Lisans 2.0'i kullanmaktadır.                                                                                                                                                               

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**前置要求：**17 · 08 aşaması (Inference Metrics), 14 aşaması (Agent Mühendisliği)
**Time:** ~60 分钟

## Öğrenme hedefi
- 区分开发平台(打包:evals + prompt + sessions)
- Bu, bir çok farklı yöntemlerle kullanılabilir.
- Açıklama Telemetri  Yapışkanlık Mode, kapı aracı bağımsız değerlendirme platformu ile birleştirmenizi sağlar.
- 2026 yılının maliyet farkını belirtmek için AX'in sıfır kopyası  yöntemi ile monolit tüketimi arasında bir fark belirtmek için yaklaşık 100 katını artırmak için bir fark belirtmek için,

## 问题
Ancak, hızlı başarısızlıklar, araç döngüleri, gecikme gerilemeleri, maliyet uçları veya hızlı önbelleğe ulaşma oranı görmezsiniz. Google'da görüyorsunuz ki, LLM gözlemselliği, sekiz araç aynı sorunu çözebileceğini iddia ediyor.

它们解决不是同一个问题──LangSmith 回答为什么这次 LangGraph run 失败了?Phoenix 回答我的RAG管道是否漂浮?

选择涉及四个轴:stack(LangChain?raw SDK?multi-vendor?)$100/mo？$1000/mo?) ve kendi kendine ev sahibi olmak zorunda?

## 概念
### 两类

**开发平台**Bu tür bir deney yaparak, hangi tescilin etkili olduğunu görerek, yeni tescilin eski kazancıyla birlikte veri kümesindeki kazancının geri dönüşünü yaparak, LangSmith、Langfuse、Comet Opik'in bu sınıfına aittir.

**Gateway/telemetry 工具**Sonlama çağrıları için  hızlı, yanıtlı, token, latency, model, maliyet, Helicone, SigNoz, OpenLLMetry, Phoenix, daha hafif bir şekilde kullanılabilir.

### Langfuse  OSS 平衡

- Core Apache / MIT lisanslı; Docker kendi-host üzerinden
- Bulut ücretsiz seviye: ayda 50 bin etkinlik.
- Evals, prompt management, traces, datasetleri, dört geliştirme platformu özelliği için makul bir kapsam vardır.
- Tatlı nokta: LangSmith'in 级别 işlevini istiyorsun ama kendi kendine ev sahibi olmalısın veya OSS lisansı tutmalısın.

### Phoenix (Arize)  Telemetri-birincisi,OpenTelemetry-native

- Elastik Lisans 2.0; kendi kendine ev sahibi 很简单──
- 非常擅长 RAG 和漂移可视化──Embedding-space scatter plotları 非常擅长RAG 和漂移可视化──
- Bu, uzun süreli üretim sonrası tasarımın değil, özellikle de gelişme döneminde görülür.
- Sweet spot:RAG boru hattı 開発、 drift debugging,并与独立ゲートウェイ 搭配用于生产。

### Arize AX  ölçek oyunu

- Ticari  Iceberg/Parquet 实现 zero-copy data lake 集成。
- 声称在尺度下比单形可观性(Datadog-class)便宜约100x──计算方式:你把痕迹存在自己 S3 上的Parquet 中;Arize 直接读取──
- Tatlı nokta:> 10M iz/gün DATA LAKE DATA LAKE DATA LAKE DATA DOG 价格

### LangSmith  LangChain/LangGraph  öncelik

- Ticari, $39/istifadeler/ay.
- LangChain ve LangGraph yığınları sınıfında en iyidir. Eğer bunları kullanmazsan, çekicilik çok zayıflar.
- Sweet spot: Ekip LangChain'a girdi,并愿意付费──

### Helicone   proxy tabanlı en az uygulanabilir

- - Evet.`OPENAI_API_BASE`替换为 Helicone proxy,15-30 分钟完成设置──
- MIT lisanslı; 100K ücretsiz, ücretli 20 dolarlık ücret
- 包含 failover、caching、rate limits  也可充当 gateway──
- Ajan / çok adımlı izlerin derinliği daha zayıf.
- Sweet spot: 快速开始、单堆应用、需要 gateway + observability 合一。

### Opik (Comet)  OSS geliştirme platformu

- Apache 2.0, tamamen OSS.
- Langfuse ile aynı, Komet ile 传承。
- Tatlı nokta: zaten Comet'in ML 团队'unu kullanıyorum, aynı panelde LLM'yi elde etmeyi umuyorum.

### SigNoz  OpenTelemetry-first 完整 APM

- Apache 2.0: OpenTelemetry ile birlikte genel APM ve LLM ile birlikte işleme
- Tatlı nokta:跨服务和LLM çağrıları

### 粘合层:OpenTelemetry + GenAI semantik sözleşmeleri

OpenTelemetry 2025 yılının sonlarında GenAI semantik konvensiyonlarını yayınladı .`gen_ai.system`- Evet.`gen_ai.request.model`- Evet.`gen_ai.usage.input_tokens`)■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

1. Her LLM çağrısı GenAI'nin sözleşmelerine uygun olarak gönderilmektedir.
2. 路由到 gateway (Gedway) günlük kullanım için.
3. 双写到 eval platform (Phoenix / Langfuse) geri dönüşler için kullanılır.
4. 归档到数据湖(Iceberg), Arize AX veya DuckDB üzerinden kullanılır.

### 陷: 在错误层做工具化

Bu nedenle, bu uygulamaların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılan araçların kullanımı için kullanılacaktır.

### Örnek almak. Her şeyi saklayamazsın.

• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

### Hatırlamalı olduğun bir sayı var.

- Langfuse ücretsiz bulut: ayda 50K etkinlik.
- LangSmith: 39 dolar / kullanıcı / ay
- Helikon ücretsiz: ayda 100 bin adet.
- Arize AX iddiası: ölçekte aşağı monolitten 便宜約100x。
- OpenTelemetry GenAI konventleri:2025  yayın,2026  yaygın olarak kabul edilmektedir.


```figure
i4-otel-glue
```

## Kullan
`code/main.py`模拟在不同保留策略中(100% ingest、sampling、sampling + errors) 下一天 1M 痕迹──报告存储成本以及每种策略下丢失的内容──

## - Söyle.
本课会产 出 `outputs/skill-observability-stack.md`❖ Satır, ölçek, bütçe, lisans pozisyonu  seçme araçları

## 练习
1. Senin takım LangChain kullanıyor,并希望 OSS kendi kendine konutlanmış gözlemselliği──选择 Langfuse 或 Opik 并说明理由──
2. 5M iz / gün ve Datadog 报价 $ 150K / ay 时,计算Arize AX'ın 破平率──
3. 设计一组你的组织指南 应要求每一个LLM call 都必须包含的OpenTelemetry GenAI属性──
4. Phoenix'in üretime yeterli olup olmadığını...
5. Helicone'da 20 ms proxy overhead var. P99 TTFT 300 ms'dir.

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
