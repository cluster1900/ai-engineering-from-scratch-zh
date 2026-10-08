# Kendine Konutlanan Hizmetler 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> 2026 yılında, dört motor yönetici kendi kendine kontrol sonucu seçmek için.**llama.cpp**CPU'da en hızlı  model 支持最广,对量化和线程 拥有完全控制──**Ollama**Llama.cpp 慢約15-30% (Go + CGo + HTTP serializasyon) ), sınıf üretim yük altında 吞吐量差 3x**TGI 于 2025 年 12 月 11 日进入维护模式** Sadece hata düzeltmeleri yapılır, çiğ üretimi vLLM'den %10 oranında yavaşlar, ancak geçmişte gözlemlebilirlik ve HF ekosistem entegrasyonu açısından genellikle üst düzey seviyededir. Bu bakım durumu, yeni projeler için daha güvenli bir öntanımlı seçenek haline getirir.**vLLM**Yeni gelişmiş PyTorch 2.10、RTX Blackwell SM120、H200 optimizasyonu──**SGLang**Yapılan çalışmaların sonucunda, bu işlemler, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir süre sonra, bir sürece, bir sürece, bir sürece, bir sürece, bir sürece, bir sürecececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececececece

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## Öğrenme hedefi
- Bu nedenle, bu işlemci, bir bilgisayarın kullanıcısı olarak kullanılır.
- 2026 yılının TGI 维护模式状态 (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态)  (TGI 维护模式状态) )  (TGI 维护模式 )  (TGI 维护模式 维护模式模式 ) )  (TGI 维护模式 维护模式 ) )  (TGI 维护模式 维护模式 )  (TGL ) )  (TGL )  (TGL ) )  (TGL ) 
- 描述全程使用相同 GGUF 或 HF weights 的 dev/staging/prod pipeline──
-  açıklama neden  sadece CPU                                                                                                                                                                                                                                                           

## 问题
Senin takım yeni bir kendi kendine yönetim LLM projesi başlattı. Bir mühendis Ollama'da, bir başka VLLM'de, bir üçüncü ise TGI'de açık kutu kullanımı yok mu?

2026 yılında, seçim ağacı önemlidir: önce hardware, sonra ölçek, sonra iş yükü.

## 概念
### 5 motor

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件 öncelik kararları

**仅 CPU**→ llama.cpp。Ollama da kullanılabilir, ama daha yavaş── CPU'da başka motor yok.

**AMD GPU**→ vLLM(AMD ROCm 支持)。SGLang 也能用──TRT-LLM 被 NVIDIA 锁定,所以排除──

**NVIDIA Hopper (H100 / H200)**→ vLLM veya SGLang veya TRT-LLM──三者都是顶级──

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

**Apple Silicon (M-series)**→ llama.cpp(Metal) ・ Ollama ona bir封装 yaptı。

### 规模其次决策

**1 个用户 / local dev**→ Ollama。一条命令,数秒内 ilk işaret。

**10-100 个用户 / 小团队**→ VLLM tek GPU。

**100-10k 个用户 / production**→ vLLM üretim aşaması ((17 · 18) veya SGLang。

**10k+ 个用户 / enterprise**→ VLLM üretim aşaması + ayrıştırılmış(17 · 17) aşaması+ LMCache(17 · 18) aşaması

### İş yükü Üçüncü karar

**General chat / Q&A**→ vLLM 在广泛默认场景中胜出──

**Agentic multi-turn（tools、planning、memory）**→ SGLang'ın RadixAttention(Fase 17 · 06) 占优。

**带有大量 prefix reuse 的 RAG**→ SGLang。

**Code generation**→ vLLM 可以;SGLang 在缓存上略好。

**Long context (128K+)**→ vLLM + parçalı ön doldurma; SGLang + katlı KV。

### TGI 维护陷

Hugging Face TGI 于 2025 年 12 月 11 日进入维护模式  之后只做bug fixes──过去:顶级可观测性、同类最佳 HF 生态系统集成(model kart、安全工具),raw throughput 略落后于 vLLM──

2026 yılındaki yeni projelere yönelik: TGI'yi gizlemek. mevcut TGI'yi dağıtmak devam edebilir, ancak nihai olarak taşınmalıdır.

### Pipeline 模式

Dev(Ollama)→ aşamalama(llama.cpp)→ prod(vLLM)。全程使用相同的GGUF或HF weights──工程师在笔记本上快速代; aşamalama 镜像生产量化;prod 是服务 目标──

### Ollama dikkat faktörleri

Ollama  çok uygundur dev. Bu paylaşım üretimi için uygun değildir: Git HTTP serializasyon, satış artışını, para birimi yönetimi vLLM'den daha basit, OpenTelemetry  destek geride kaldı. Ollama'yı kullanmak için kullanın.

### Özgür yönetim vs yönetim başka bir karardır

17 · 01(Yönetilen hiperkalerler) 、· 02(Inference platformları) 覆盖 managed。本课假设你已经决定自托管──自托管的理由:data residency、custom fine-tune、规模化后的总成本所有、托管服务上不可用域名模型──

### Hatırlamalı olduğun bir sayı var.

- TGI 维护模式:2025 年 12 月 11 日。
- VLLM v0.15.1:2026 年 2 月;PyTorch 2.10;Blackwell SM120 支持──
- SGLang 生产足迹: 400.000+ GPU'lar
- Ollama üretimi 相对 llama.cpp 差:慢 15-30%;生产负载下 3x。


```figure
data-parallel
```

## Kullan
`code/main.py`Bu bir karar ağacı yürüyüşçüsü: given determined hardware + scale + workload, choose one engine并解释原因──

## - Söyle.
本课产 出 `outputs/skill-engine-picker.md`❖ Bir motor seçin ve bir göç planı yazın.

## 练习
1. Hardware / ölçek / iş yükünü kullan 运行 `code/main.py`Dışarı çıkış senin içgüdülerine uygun mu?
2. Alt tarafınız 12 张 H100 ve 8 张 MI300X AMD. Hangi motor kullanıyor?
3. Bir ekip 2026 yılında TGI'yi kullanmayı düşünüyor çünkü bu bizim bildiğimiz bir şey.
4. Ollama dev ve vLLM prod: kuantitasyon, yapılandırma ve gözlemlenebilirlik...
5. RAG 产品的P99 prefix length 为 8K,并且租户间复用率很高──选择一个引擎,并结合阶段17 · 11 + 18 组成堆──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | “CPU 那个” | 最广 model 支持，CPU 上最快 |
| Ollama | “笔记本那个” | 一条命令安装，dev-grade throughput |
| TGI | “HF 的 serving” | 自 2025 年 12 月起维护模式 |
| vLLM | “默认选择” | 2026 年广泛生产 baseline |
| SGLang | “agentic 那个” | Prefix-heavy，RadixAttention |
| TRT-LLM | “NVIDIA 锁定” | Blackwell throughput 领先者，仅 NVIDIA |
| GGUF | “llama.cpp 格式” | Bundled K-quant variants |
| Production-stack | “vLLM K8s” | Phase 17 · 18 reference deployment |
| Pipeline pattern | “dev→stage→prod” | 同一 weights 上的 Ollama → llama.cpp → vLLM |

## 延伸阅读
- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) açıklama notları。
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
