# Agno ve Mastra:生产 Runtime

> Agno (Python) 和 Mastra (TypeScript) 2026 yılının üretim Runtime 组合。Agno 目標是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于 Vercel AI SDK 底层,提供代理、工具、工作流、统一模型路由和复合存储──

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## Öğrenme hedefi
- 识别Agno'nun performans hedefleri, yanı sıra bu hedefler hangi durumlarda önemlidir.
- Mastra'nın üç primitifini anlatmak için: Ajanlar, Araçlar, İş Akışları ve desteklenen sunucu adaptörleri.
- 解释为什么无状态、session-scoped FastAPI arka planı, önerilir Agno 生产路径──
- 根据给定堆 选择 Agno 或 Mastra(Python-first vs TypeScript-first) 💚

## 问题
LangGraph、AutoGen、CrewAI hepsi çerçeve ağırlıklı.  Eğer Agent döngüsü,  hızlı,  ve benim Runtime 里运行  的团队,  Agno (Python) veya Mastra (TypeScript)                                                                                                                                                                                                                              

## 概念
### Agno

- Python Runtime, önümüzdeki Phi-data.
-  hiçbir grafik yok  zincirler veya karmaşık modeller   sadece saf Python。
- Dokümanlarındaki performans hedefleri: Yaklaşık 2μs Ajan 实例化、 her Ajan Yaklaşık 3.75 KiB bellek、 Yaklaşık 23 model sağlayıcıları¬
- 生产路径:无状态、session-scoped 的 FastAPI arka uçı。 her istek yeni bir Ajan başlatıldı;session state 存在 DB 中。
- Origin生 Multimodal(metin, görüntü, ses, video, dosya) ve ajantik RAG。

Her saniye binlerce kısa yaşam döngüsü ajanı (Chat Fan-in 評価 tüpleri) olduğunda, bu hız hedefleri çok önemlidir.

### Mastra

- TypeScript, Vercel AI SDK'sının üzerine inşa edilmiştir.
- Üç ilkel:**Agents**- Evet.**Tools**(Zod tipi)**Workflows**- Evet.
- Birleştirilmiş Modeldeki Router  跨 94 个供应商 的 3,300+ model(2026 年 3 月) ⋅
- Yapılandırılmış depolama: bellek, iş akışları, gözlemlenme; farklı arka planlara bağlanabilir; büyüklüğü ölçülebilirlik 推 ClickHouse。
- Apache 2.0, 源码中`ee/`Kaynak kullanımı için mevcut işletme lisansı kullanılıyor.
- 支持 Express、Hono、Fastify、Koa'nın sunucu adaptörleri; Next.js 和 Astro için birinci sınıf entegrasyon sağlar。
- 提供 Mastra Studio(localhost:4111) debugging için kullanılır。
- 1.0 版本时(2026年1月) GitHub yıldızları 22k+ 、300k+ Her hafta npm indirmeler vardır。

### Konumlandırma

两者都不是成为LangGraph──它们竞争的是:

- **Language fit.**Agno 面向 Python-first 团队;Mastra 面向 TypeScript-first。
- **Runtime ergonomics.**Agno = neredeyse sıfır;Mastra = 与 Vercel ekosistem 集成。
- **Observability.**两者都集成 Langfuse/Phoenix/Opik(Lection 24), ama Mastra Studio ilk tarafı。

### Her birini ne zaman seçmeliyiz?

- **Agno** Python arka planı  Büyük miktarda kısa yaşam döngüsü Agent  güçlü performans gereksinimleri  FastAPI  ekip 
- **Mastra** TypeScript arka planı、Next.js / Vercel dağıtım、统一 çok sağlayıcı model yönlendirme、Zod-typed tools。
- **LangGraph**(Disim 13)  Asgari durumda ve açıklama grafik mantıklama daha önemli zaman.
- **OpenAI / Claude Agent SDK** When you want provider 产品化后的形态时(Düşünmeler 1617)

### Bu örneği kolayca yanılıyor.

- **Perf-for-perf's-sake.**Çünkü 2μs'in sonu doğru geliyor. Ama iş yükü her isteğin sonucu.
- **Ecosystem lock-in.**Mastra'nın Vercel aromalı entegrasyonu Vercel'de yukarıda eklemeler, başka yerlerde ise azalmalar olabilir.
- **Enterprise license confusion.**Mastra'nın `ee/`Kayıt kaynaklı değil, Apache 2.0 değil. Eğer bir fırka planlıyorsan, lütfen lisansları okuyun.


```figure
wb-runtime-spawn
```

## Yapın onu.
Bu ders esas olarak karşılaştırmalı  单一代码文物 无法公正呈现两个框架──参见`code/main.py`Orta yan yana oyuncak:一个最小的运行 Ajan、stream output、persist session流程,实现了两次(一次Agnó şeklinde,一次Mastra şeklinde)

- Yapma .

```
python3 code/main.py
```

İki farklı yapı, ancak aynı işlev izlerini göreceğiz.

## Kullan
- **Agno** 需要速度和 FastAPI 形态的Python arka uçları。
- **Mastra** 拥有多个供应商和工作流原始的TypeScript arka planı。
- 两者都提供第一方可观度──两者都集成 Langfuse──

## - Söyle.
`outputs/skill-runtime-picker.md`Bu, bir dizi zaman bütçesine ve operasyonel biçimine göre, Agno、Mastra、LangGraph veya sağlayıcı SDK'de yapılacak seçimdir.

## 练习
1. 阅读 Agno's docs──把 stdlib ReAct loop(Lesson 01)移植到 Agno──什么消失了?什么保留下来?
2. 阅读Mastra's docs──把同一个循环 移植到Mastra──工具打字中发生了什么变化(Zod vs. nothing)?
3. Benchmark: Your Stack Up Agent  Exampleized latency──Agno'nun 2μs'i iş yükünüz için önemli mi?
4. 設計 göç: Eğer Python'da çalışıyorsan CrewAI, Agno'ya göç edersen neyi yok edersin?
5. 阅读 Mastra'nın `ee/`Lisans şartları... Hangi kısıtlamalar açık kaynaklı çatalları etkileyecek?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | “Fast Python agents” | 无状态、session-scoped 的 Agent Runtime |
| Mastra | “TypeScript agents on Vercel AI SDK” | Agents + Tools + Workflows + Model Router |
| Unified Model Router | “Multi-provider access” | 跨 94 个 providers、面向 3,300+ models 的单一 client |
| Composite storage | “Multiple backends” | Memory/workflows/observability 分别接入不同 store |
| Mastra Studio | “Local debugger” | 用于 introspecting Agents 的 localhost:4111 UI |
| Source-available | “Not OSS” | License 允许阅读 source，但限制 commercial use |

## 延伸阅读
- [Agno Agent Framework docs](https://www.agno.com/agent-framework) 性能目標、FastAPI entegrasyonu
- [Mastra docs](https://mastra.ai/docs) primitif  sunucu adaptörleri  Model yönlendiricisi
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) devlet grafikleri 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) Mastra entegrasyonları 引用的可观性比较
