# 综合项目 14  Spekülatör-Kodulama 推理服务器

> vLLM 0.7 içindeki EAGLE-3 gerçek akımda 2.5-3x 吞吐量 getirmiştir. P-EAGLE (AWS 2026) paralel spekülasyonu daha da ileri sürdü. SGLang'ın SpecForge büyük çapta proje başını eğitmiştir. Red Hat'ın Spekülatörler merkezi düzenli açık model olarak düzeltilmiş bir taslak yayınladı.

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 小时

## 问题
Spekülatör çözme 2026 yılında bir mal haline geldi. EAGLE-3 taslak başlığı  Hedef modeline dayalı gizli durum  eğitim,并预测未来 N 个代币; hedef modeli 单次通过中进行验证。60-80%'lik kabul oranı 2-3x'e dönüştürülür.

关键技术不是模型,而在服务运营――接受率会随流量分布漂移(ShareGPT vs. code vs. domain data) 发生拒绝时的尾延迟比不使用投机更差,因此你必须报告多个批量 下的 p99,而不能只报告稳定状态代币/sec──对对Anthropic / OpenAI API 的每1M Token 成本,是可信度的杆──

## 概念
İsteğe bağlı çözme iki katlı.**draft**model (((EGLE-3 başı、ngram, veya daha küçük hedef-ağırlanmış model)**target**model 在一次通过 中验证全部 k 个 Token; herhangi bir kabul edilen önseviş şehvetin açgözlülüğü değiştirir. Kabul oranı taslak-hedef birleştirmesine ve giriş dağılımına bağlıdır.

EAGLE-3 çoğu akışta ngram taslakından iyidir. P-EAGLE için daha derin taslak ağacı paralel spekülasyonu yürütür.

Kullanım Kulernetes kullanılarak──vLLM 0.7 Her GPU veya tensor paralel şarj 运行一个复lica──HPA 基于队等而不是CPU自动扩缩容量──FP8 (Marlin) 和 INT4 (AWQ) quant 会让 GPU 内存 保持在H100 / H200 范围内──端到端报告包括吞吐量、接受率、批次 1/8/32 下的 p50/p99,以及 $/1M Token──

## Yapılandırma
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术
- Hizmet: VLLM 0.7 veya SGLang 0.4
- Tahmin yöntemleri: EAGLE-3 taslak başları, P-EAGLE paralel tahminleri, ngram geri dönüşü
- Eğitim projesi: SpecForge (SGLang) veya Red Hat Spekülatörler
- Hedef modelleri: Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- Kvantizasyon: FP8 (Marlin) ∞INT4 AWQ
- Uygulama: Kubernetes + NVIDIA cihaz eklentisi; sırada bekleme metriklerine dayalı HPA
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval, alanlar arası dağılımların kabul oranını ölçmek için kullanılır
- Referans: TensorRT-LLM spekülasyonsal çözümü, tedarikçi temel çizgi olarak


```figure
cf-spec-decode
```

## Yapın onu.
1. **Target model prep.**选择 Llama 3.3 70B── Marlin tarafından FP8 kadar kuantleştirmek──在 1xH100(或 2x tensor-parallel) 上使用 vLLM 0.7 部署──

2. **Draft source.**Red Hat Spekulyatörler'den 拉取 alinched EAGLE-3 draft head (or via SpecForge 训练一个) ⋅ yüklenmiş vLLM'nin spekülatif-dekodlama yapılandırması 中──

3. **Baseline numbers.**Espeksiyonlarda 之前:batch 1/8/32 下的代币/s、p50/p99 gecikme、GPU kullanımı、发布结果──

4. **Enable EAGLE-3.**切换配置;重新运行相同基准──报告速度化、接受率、p99尾延迟三角点──

5. **P-EAGLE.** paralel spekülasyonu etkinleştirmek; P-Eagle'nin seri EAGLE-3'ün farklılıklarıyla daha derin bir taslak ağacını ölçmek.

6. **Domain traffic.**ShareGPT、HumanEval 和 domain-specific traffic 通过同一服务器 运行──按分布测量接受率──识别草案 发生漂移的条件──

7. **Second target model.**Bu, bir diğer devirde daha da zorlaşan bir durumdur.

8. **K8s HPA.**K8'lerin aşağı bölümünde, HPA'nın takip edilmesine izin ver.`queue_wait_ms`◊ yüklerin üç katına kadar genişlemesini göstermek

9. **Cost comparison.**Bu değerlendirme, $/1M Token,并与人类克劳德索内特4.7 和 OpenAI GPT-5.4比较──发布结果──

## Kullan
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## - Söyle.
`outputs/skill-inference-server.md`描述 deliverable──一个经过测量的、带投机性解码的服务堆,一个完整的基准报告,以及一个K8s部署──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

## 练习
1. Bu nedenle, bu programın en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri, bu programın en önemli yönleri ve en önemli yönleri ile, bu programın en önemli yönleri ile, bu programın en önemli yönleri ile, bu programın en önemli yönleri ile, bu programın en önemli yönlerini belirlemekten bir önlemler.

2. √Gram geri dönüşü gerçekleştirmek: Eğer EAGLE-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

3. 运行一个受控MoE实验:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音 两种情况下对比──测量草案接受敏感性──

4.  H200'e kadar genişletilmiş (141 GB) ⋅ rapor her kopyasının ⋅ elde edilen model boyutlu baş odası, ve ayrıca bir kuantitasyon yapılmamış Llama 3.3 70B'ye hizmet edebilecek mi­

5. Aynı H100 donanımında, yukarıdaki referans TensorRT-LLM spekülasyonsal çözümü rapor ediyor.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) Referans servis yığın
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) paralel spekülatör kodlama kağıdı + entegrasyon
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) Tasarım başı eğitim boru hattı
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) Düzeltme çekim merkezi
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) Satıcı alternatif
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) Ticari referans
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) Metod kağıdı
- [vLLM repository](https://github.com/vllm-project/vllm) Kod ve referans değerleri
