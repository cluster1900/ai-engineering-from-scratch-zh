# Ajan 可观测性: Langfuse, Phoenix, Opik

> Üç açıktır Çeviri Ajan 可观测性平台主导了 2026 年──Langfuse (MIT)  Her ay 6M+ kurulum, izleme + istintap yönetimi + değerlendirmeler + oturum tekrarlaması──Arize Phoenix (Elastic 2.0)  深入的 Ajan 专用 evals、RAG 相关性、OpenInference auto-instrumentation──Comet Opik (Apache 2.0) 自动化 prompt 优化、guardrails、LLM-judge 幻觉检测──

**类型：**Öğrenme
**语言：**Python (stdlib)
**前置要求：**14 · 23 aşama (OTel GenAI)
**时间：**45 dakika kadar .

## Öğrenme hedefi

- Üç tane açık kaynaklı ajanı ve lisansını açıklayın.
- 区分每个平台最擅长的方面:Langfuse (hızlı mgmt + seanslar) Phoenix (RAG + otomatik aletleştirme) Opik (optimize + koruma rayları) 
- 2026 yılına kadar, %89'u raporlar için bir ajanı göndermişlerdir.
- 实现一个带有LLM-juj 评估的 stdlib 追踪到仪表管道──

## 问题

OTel GenAI(Lection 23) size bir şema verdi. Süreleri içeren bir platform gerekecek.

## 核心概念

### Langfuse (MIT)

- Her ay 6M+ SDK'lar 19k+ GitHub yıldızları yükler.
- 功能:tracing、带 versioning + playground's prompt management、评估(LLM-as-judge、user反、自定义)、session replies──
- 2025年 6月:原先的商业模块(LLM-as-a-judge、注释队列、快速实验、Playground) MIT 下 açık kaynaklı olarak
- En iyi: Çekil-Sıcak Çekil-Yönetim Çubuğu'nun Sonundan Sonuna Kadar Görüntülenmesi

### Arize Phoenix (Elastik Lisans 2.0)

- Daha derinlemesine Ajan 专专用评估: iz kümeleri, anormallik tespitleri, RAG'nin geri alım ilgisi
- Origin生 OpenInference otomatik aletleştirme
- Çekim için kullanılan Arize AX                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
- 没有快速版本  定位是与更广泛平台配合使用的漂移/行为-regression 工具──
- En iyi:RAG 相关性、行動 drift、異常検出──

### Komet Opik (Apache 2.0)

- A/B deneyleri ile otomatikleştirme hızını gerçekleştirmek 优化。
- Korumalar (PII redaksiyonu, konu kısıtlamaları)
- LLM-hakimi 幻觉检测。
- Comet'in kendi ölçümlerinin referans göstergesi: Opik logları + değerlendirmeler 23.44s kullanılırken Langfuse 327.15s'dir (yaklaşık 14x 差)
- En iyi: optimizasyon döngüsü, otomatik deneyler, koruma korumaları.

### Yapım verileri

Maxim'e göre:2026 yılındaki alan analizi:% 89'u Ajanı Gözetimsel olarak görevlendirdi; kalite sorunu en büyük üretim engelli.

### Nasıl seçilir

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### Bu yol kolayca yanlış bir yerde

- **没有 eval strategy。**没有评估的追踪 只是昂贵的伐木――
- **没有 grounding 的自建 LLM-judge。**KRITİK ŞEKİLER (DESİN 05) 适用  yargıçlar 需要外部工具进行事实验证──
- **Prompt versions 没有关联到 traces。**Eğer bir sorun ortaya çıkınca, sorunun nedenini ayıramazsın.


```figure
wb-trace-ingest
```

## Yapın onu.

`code/main.py`实现一个stdlib 痕迹收集器 + LLM-juj评审员:

- GenAI 形态的跨度を摂取する──
- 按会议 分组,标记失败 runs(gardrail trips、低置信度 evals)
- Bir yazılı LLM yargıç, Ajan cevapları için rubrika göre 评分──
- 类似仪表板的概要:失败率、顶级失败原因、eval skor dağılım──

运行:

```
python3 code/main.py
```

输出: Her seansın değerlendirme puanları ve başarısızlık kategorisasyonu, Langfuse/Phoenix/Opik 会 gösterisinin içeriği ile uyumlu olarak

## Kullan

- **Langfuse**Kendi kendine barındırılan veya bulut; OTel veya onların SDK 接入.
- **Arize Phoenix**Kendi kendine otomatik olarak otomatik bir araç olarak kullanılır.
- **Comet Opik**Kendi kendine barındırılmış veya bulut; otomatik optimizasyon döngüsü。
- **Datadog LLM Observability**适合已运行 Datadog'ın karışık operasyonları+ML 团队。

## - Söyle.

`outputs/skill-obs-platform-wiring.md`選一個平台,并將 接入现有代理── 接入现有代理── 选择一个平台,并将 追踪+评估+快速版本

## 练习

1. Bir hafta boyunca Langfuse bulutuna gönderilen OTel izleri. Hangi seanslar başarısız oldu? Neden?
2. Bu konuda bir bölüm yazmak için, bir bölüm yazmak için.
3. Langfuse sürüm sürümlerini Phoenix'in iz kümelerinden kıyasla. Hangisi daha hızlı size hangi şeylerin kötü olduğunu söyleyebilir?
4. Opik'in koruma dokümanlarını okuyun. Senin için bir ajan çalıştır.
5. Bu üç platformı göz ardı et, satıcıyı göz ardı et, kendi değerini ölç.

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

- [Langfuse docs](https://langfuse.com/) izleme 、evals 、immedi
- [Arize Phoenix docs](https://docs.arize.com/phoenix) Otomatik aletleşme
- [Comet Opik](https://www.comet.com/site/products/opik/) Optimize + koruma
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Üç platformda her şey tüketilmektedir
