# İndirim Metrikleri  TTFT、TPOT、ITL、Goodput、P99

> TTFT'nin bir kez sonuçlandırma dağıtımını belirleyen dört gösterge, bir kez sonuçlandırma dağıtımını belirler. TTFT, bir kez daha doldurmak, bir kez daha ağı oluşturmak, bir kez daha ağı oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha TTFT'yi oluşturmak, bir kez daha kullanmak, bir kez daha kullanmak, bir kez daha kullanmak, bir kez daha kullanmak, bir kez daha kullanmak, bir kez daha fazla işlem yapmak, bir kez daha fazla işlem yaptırmak, bir kez daha fazla işlem yaptırmak, bir kez daha fazla işlem yaptırmak, bir kez daha fazla işlem yaptırmak, bir kez daha fazla işlem yaptırmak, bir kez daha fazla işlem yaptırmak, bir kez daha daha daha daha fazla işlem yapmak,

**Type:** 学习
**Languages:** Python（stdlib，玩具版 percentile calculator 和 goodput reporter）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 60 分钟

## Öğrenme hedefi
- 精确定义 TTFT、TPOT、ITL、E2E、roughput 和 goodput,并指出每个指标测量的组件──
- LLM hizmetini nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa nasıl yapılırsa yapılırsa nasıl yapılırsa yapılırsa nasıl yapılırsa yapılırsa yapılırsa yapılırsa yapılırsa yapılırsa yapılırsa yapılır
- 构建一个SLO多限制 (例如 TTFT<500 ms AND TPOT<15 ms AND E2E<2 s),并根据此计算好put──
- Aynı seferde TPOT'ye karşı belirlenmeyen iki referans araçını açıklamak, nedenini açıklamak.

## 问题
 Bizim çıkışımız ise saniyede 15.000 Token.那又怎么? Eğer talebinin %40'ı sonunu 2 saniyeden fazla geçirse, kullanıcı oturumdan ayrıldı.

İndirim, birçok gecikme 轴, her bir 轴'in başarısız olma biçimi farklıdır. Önbölüm hesaplama bağlıdır,并随即延长 扩展。Decode ise bellek bağlıdır,并随批量 扩展。 Sıralanma gecikmesi işletim sorunuudur。 Ağ fiziksel mesafe sorunuudur。 her bir gösterge için farklı bir gösterge kullanmanız gerekir, yüzdeliller gerekir, ayrıca kullanıcıların beklenen sonuçları elde ettiklerini açıklamak için tek bir bileşik gerekir. Bu iyi bir fikirdir。

## 概念
### TTFT  ilk token için zaman

`TTFT = queue_time + network_request + prefill_time`

Bu nedenle, H100'de Llama-3.3-70B FP8'de, 32k bir istekle 800 ms'lik bir prefill gerektirir.

### TPOT / ITL  tokenler arası gecikme

Aynı bir miktarda birçok isim var.`TPOT`(output token başına zaman)`ITL`(tokenler arası gecikme)`decode latency per token`Tıklayarak Token arasındaki zamanın devamı.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

Aynı bir ile parçalanmış prefill Llama-3.3-70B H100 yığın üzerinde, TPOT ortalama ≈ 7 ms. ≈ hiçbir parçalanmış prefill ≈ zaman, yakın bir dizi 正在执行长 prefill, TPOT可能 spike至 50 ms. ≈关注 P99,而不是 mean。

### E2E gecikmesi

`E2E = TTFT + TPOT * output_tokens + network_response`

对于长输出(>500 Token),E2E by TPOT 主导──对于带长提示的短输出,E2E by TTFT 主导──报告按输出长度分组的E2E──

### Çıktıranlık

`throughput = total_output_tokens / elapsed_time`

Bir tek istek sağlığı hakkında söyleyemem.

### İyilik  你真正关心的标志

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO bir çok kısıtlama. Sadece her kısıtlama yerine geldiğinde, bir istek iyi 🏼 İyi put budur bu oranı  %60 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi  %2 iyi     iyi   iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi  iyi

2026 yılına kadar, goodput  MLPerf Inference v6.0 gönderileri ve AI platform sağlayıcıları  SLA izleme içindeki kullanılan göstergelere dönüşmüştür.

### Neden yanlış bir istatistik demek

LLM gecikme dağıtımları doğru taraftan yer alır. Bir çözme parti içinde, eğer uzun bir önceden doldurma çağrısı varsa, 500 tane tokenin TPOT'si yaklaşık 7 ms, 20 tane de Token'in TPOT'si yaklaşık 60 ms olabilir.

始终报告三元组(P50、P90、P99) ・・・ kullanıcı deneyimi için,P99 才是你要优化指标──

### Referans numaraları  TRT-LLM 上的 Llama-3.1-8B-Instruct,2026

- Ortalama TTFT: 162 ms
- Ortalama TPOT: 7,33 ms
- E2E ortalaması: 1,093 ms
- P99 TPOT: 取決於碎片-prefill konfigürasyonu, genellikle 10-25 ms 之间 değişir.

Bunlar NVIDIA tarafından yayınlanan referans noktasıdır. Bunlar model boyutuna göre gerçekleşir.

### Ölçüm tuzağı

2026 yılında en sık kullanılan iki referans aracı aynı anda çalıştırılınca TPOT'ye karşı farklı sonuçlar vermiştir:

- **NVIDIA GenAI-Perf**: 在 ITL 计算中排除 TTFT──ITL 从 Token 2 开始──
- **LLMPerf**:包含 TTFT──ITL 从 Token 1 开始──

500 ms için TTFT  100 ışığa token  700 ms için toplam dekode talebi için, GenAI-Perf  rapor `ITL = 700/99 = 7.07 ms`,LLMPerf  rapor `ITL = 1200/100 = 12.00 ms`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

始终说明使用了哪个工具──始终发布定义──

### SLO'nun oluşturulması

2026 yılında tüketicilerin 70B sohbet modeli:

- TTFT P99 <= 800 ms¬
- TPOT P99 <= 25 ms¬
- <300-Token 输出,E2E P99 <= 3 saniye
- İyi üretim hedefi >= 99%

İşletme SLOs TTFT 200-400 ms 并放宽 E2E                                                                                                                                                                                                                                                     

### Ölçüm nasıl

- 运行真流量或真实合成(LLMPerf 使用 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`)。
- Benchmark çalışmasının amacı 2x en yüksek eşzamanlılıktır.
- 运行 30-50 defa tekrarlama,对合并样本取百分点──
- 发布时包含工具名、工具版本、模型、硬件、竞争、即时分布──


```figure
throughput-latency
```

## Kullan
`code/main.py`Bu, bir oyuncu sürümü iyilik hesaplayıcıı, sentetik gecikme dağılımını üretir, SLO uygulamasını,并计算 goodputı, aynı izleri gösterir.

## - Söyle.
本课会生成 `outputs/skill-slo-goodput-gate.md`❖ Bir iş yükü ve SLO'yu belirleyerek, CI/CD'nin kullanılabilir bir referans tarifi üretir.

## 练习
1. 运行  İşlem`code/main.py` %1 kuyruk tırnaklı bir dağıtım ile üretilir.
2. Bir satıcı 引用Llama 3.3 70B H100 上 15,000 tok/s──在相信之前,应提出哪三个问题?
3. Neden parçalanmış prefill P99 TPOT'i koruyabilir ama TPOT'i koruyamaz?
4. Ses asistanı  oluşturmak bir tüketici SLO ((birinci token is heard, instead of being read) ‒ kullanıcı için en çok görülecek işaret nedir?
5. 阅读LLMPerf README 和 GenAI-Perf doküsleri。 bulun başka üç bu araç tanımlama çelişkili gösterge¬leri。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；在长 prompts 下由 prefill 主导 |
| TPOT | “time per output token” | 首个 Token 之后每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在大多数工具中与 TPOT 相同（不是全部，见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上 response-side network |
| Throughput | “tok/s” | Fleet efficiency；没有 latency percentiles 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足每个 SLO constraint 的请求比例 |
| P99 | “tail” | 百分之一最差情形 latency；用户体验指标 |
| SLO multi-constraint | “the joint” | 三个 latency bounds 的 AND；只要违反任意一个，请求就失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 工具对 ITL 是否包含 TTFT 的定义不一致 |

## 延伸阅读
- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) TTFT、ITL、TPOT'un yetkisi tanımlanmaktadır.
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) 替代定义与测量配方──
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) Gerçek yerleşimler 上的应用测量──
- [LLMPerf](https://github.com/ray-project/llmperf)Ray'in açık kaynaklı referans değerine dayanıyor.
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html) NVIDIA'nın referans aracı
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) endüstri tarafından kabul edilen  iyilik referansına dayanan 
