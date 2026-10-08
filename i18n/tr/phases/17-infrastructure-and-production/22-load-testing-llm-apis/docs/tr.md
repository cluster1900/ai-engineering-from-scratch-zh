# Yük Testleri LLM API'leri  Neden k6 和 Locust 会嘘

> 传统载荷测试器不是为流媒体响应、可变输出长度、Token 级测量或 GPU 和而设计的──大多数团队将被两个陷咬住──GIL 陷:Locust 的Token 级测量在Python GIL 下运行代码化,在高并发时会与请求生成 竞争;tokenization backlog 随后将升高报告的交代代码延迟  瓶在您的客户端,而不是服务器──快速统一的陷:循环中的相同提示只测试代码分布上点;真流量有可变长度和多种前置配对──LLMPerf`--mean-input-tokens`+ `--stddev-input-tokens`修复这一点──2026年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm) Token 级准确性 için kullanılır;**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）** streaming-aware、Kubernetes-native, TestRun/PrivateLoadZone CRD'ler üzerinden yapılmış 测试, en uygun CI/CD kapıları;Vegeta için kullanılır Go sabit oranı doymuşluk;Locust 2.43.3  Sadece birlikte LLM-Locust uzantısı 才适用于流媒体──负载模式:steady-state、ramp、spike(autoscaling test)、soak(memory leaks)。

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**17 · 08 aşaması (Inference Metrics), 17 · 03 aşaması (GPU Otoscaling)
**Time:** ~75 minutes

## Öğrenme hedefi
- 解释让通用负载测试器在LLM API 上说谎的两个反模式(GIL 陷、即时-uniformity 陷)
- 针对给定目的选择工具:LLMPerf(benchmark run) 、k6 + streaming extension(CI gate) 、guidellm(küyük ölçekli sentetik) 、GenAI-Perf(NVIDIA referansı) 。
- 设计四种负载模式 ((stable、ramp、spike、soak),并说出每种模式捕捉的失败模式──
- Giriş jetonları kullanın 构建真实的快速分布, değil sabit uzunluk。

## 问题
K6 ile LLM son noktasını test ettin, 500 kullanıcı ayarladın.

两个事情发生了.第一,k6 发送了500个相同的提示   您的请求-coalescing和前置缓存 让它看起来像处理500个同步的解码,但实际上只是处理一个──第二,k6 不会以人眼体验的方式跟踪流媒体响应的间接代码延迟;它看到的是一个HTTP连接,而不是500个不同的间隔到达的代码──

LLM'lerin yük testi bağımsız bir öğrenci sorudur.

## 概念
### GIL 陷(Locust)

Locust Python kullanır ve müşteri tarafında 于 GIL 下运行 टोकenizasyon。高并发时,Tokenizer 会排在请求生成 后面。报告的间代代延迟 包含客户端 टोकenizasyon arka arkalanması。你以为服务器 慢;其实是测试慢。

修复:LLM-Locust uzantısı tokenizasyonunu 独立进程'a taşıyacak veya kompile dili harnessini kullanmakla birlikte

### Hızlı bir uyumluk tuzağı

Tüm bilinen yükleme testçileri bir istek ayarlamanıza izin verir. 10.000 kez yapılan döngü testlerinde her seferinde tamamen aynı istek gönderilir.

修复: 快速分布 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` 长度多样,内容多样.

### Çekilme Modu

1. **Steady-state** 以 sabit RPS 运行 30-60 分钟──捕捉:baseline performance regressions──
2. **Ramp** 15 dakika içinde RPS'nin hedef değere yükseltilmesi için 0 線性 〜 目標值 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜 〜
3. **Spike** Aniden 3-10x RPS'e yükseldi, 2 dakika sonra geri döndü.
4. **Soak** sabit durum 运行 4-8 小时──捕捉:memory leaks、connection pool drift、observability overflow──

### 2026 工具映射

**LLMPerf**(Anyscale)  Python, ama tokenizasyon BY Rust 支持──Mean/stddev prompts──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** NVIDIA'nın referansı── Triton istemcisini kullanmak; metrik 覆盖全面── dikkat ITL'si TTFT içermez;LLMPerf'in içerdiği── aynı sunucu 上两工具会产生不同的 TPOT──

**LLM-Locust**(TrueFoundry) 修复 GIL 陷の Locust uzantısı──熟悉的 Locust DSL + akış ölçütleri──

**guidellm** Büyük ölçekli sintet benchmarkı

**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）**- ...
- K6 本身(Go, compile, GIL yok) Yeni bir akış-anlama ölçümleri geliştirilmiştir.
- k6 Operator kullan TestRun / PrivateLoadZone CRDs  Kubernetes- doğuştan dağıtılmış testler gerçekleştirmek
- En uygun IC/CD kapıları ve SLA testleri

**Vegeta** Git,比 k6 更简单──Sasta oranlı HTTP doymuşluğu──LLC- farkındalık 能力, ancak geçit / oran sınırı testine uygun──

**Locust 2.43.3 stock** LLM için GIL 陷── sadece LLM-Locust uzantısını eşleştirebilir

### CI'nin Orta SLA Kapısı

K6,并使用:

- Baseline RPS'de aşağıda her 30-50 defa tekrarlanmaktadır.
- Geçit:P50/P95 TTFT、5xx < 5%、TPOT 低于值。
- 违规时让建设 失败──

### Gerçekte hızlı dağıtım

Gerçek trafik örneği oluşturmak (s) veya açık dağıtımlardan oluşturmak (s) gibi sohbet için kullanılan ShareGPT istekleri, kod için kullanılan HumanEval) 〜 anlamına gelecek + stddev 输入 LLMPerf── ne olursa olsun bir-bir-istekle döngüden kaçınmak gerekir──

### Hatırlamalı olduğun bir sayı var.

- k6 Operator 1.0 GA:2025 年 9 月。
- k6 v2026.1.0:akış açısından bilinçli ölçümler
- 典型LLMPerf run:在同步 X 下 100-1000 talepler
- 典型 CI gate: her PR 30-50 itera­ ciyonları¬
- Dört çeşit: sabit, ramp, spike, soak.


```figure
load-pattern-waves
```

## Kullan
`code/main.py`模拟带有真实快速分布的负载测试, etkili TPOT ölçüm,并演示均快速陷──

## - Söyle.
本课生成 `outputs/skill-load-test-plan.md`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △  △ △ △ △ 

## 练习
1. 运行  İşlem`code/main.py` 差在哪里?  差在哪里?
2. Çekilme kapısı 编写 k6 script:在100 concurrent 下 TTFT P95 < 800 ms,runtime 5 分钟──
3. Su testiniz, hafıza saatte 50 MB büyümesi gösterir. Üç neden belirtiyor.
4. Spike test 10 RPS'ten 100 RPS'e kadar. Eğer Karpenter + vLLM üretim-buğdayı 已就位 (İş aşaması 17 · 03 + 18) ise, beklenen iyileşme süresi ne kadar?
5. GenAI-Perf 在同一服务 上报告 TPOT=6ms;LLMPerf 报告 TPOT=11ms;;解释原因;;

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
