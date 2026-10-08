# Blackwell'de FP8 ve NVFP4 kullanılarak TensorRT-LLM

> TensorRT-LLM sadece NVIDIA ile sınırlı, ancak Blackwell'de üstesinden geliyor.$0.012，而 H100 + vLLM 为 $0.09/M, 7x'lik ekonomik fark oluşturur. Bu yığın, üç çeşit bir浮点精度体系 üslemelidir:FP8 KV kasesi ve dikkat çekirdeklerine yönelik olarak hala önemli, çünkü ihtiyaç duydukları hareketli aralığı vardır.NVFP4(4-bit mikroskalılaması) işleme ağırlığı ve etkinleştirme değeri;Multi-token tahmin (MTP) ve ayrıştırılmış prefill/decode ayrıca bunun üzerine 2-3x daha fazla artırmak.

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**17 · 04 aşaması (vLLM Serving Internals), 10 · 13 aşaması (Kvantisa)
**Time:** ~75 分钟

## Öğrenme hedefi

- Neden hemen yük kullanmak için NVFP4,FP8 KV kasesi ve dikkat  hâlâ önemli
- 計算境界模型 BF16、FP8 和 NVFP4 下のHBM ayak izi,并推理节省来自哪里──
- TRT-LLM'nin Blackwell'in özel özelliklerini anlatmak.
- 判断什么时候 TRT-LLM'in NVIDIA-kilitlenmesi 值得交换对 Hopper 上 vLLM'in 7x 成本差距──

## 问题

2026 yılının ekonomik ön kenarında olan sorun ise,  dolar başına ne kadar token üretilebilir ── cevap dört katlı bir şekilde seçilir:硬件代际(Hopper H100/H200 vs Blackwell B200/GB200) 精度(BF16 → FP8 → NVFP4) ✓ servis motorları(vLLM vs SGLang vs TRT-LLM)

Hopper + vLLM 上,120B MoE'nin çalışma maliyeti yaklaşık olarak her milyon token için ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0.012,便宜 7x── bir kısmı hardware'dan geliyor. Blackwell'in tek GPU LLM 吞吐对对Hopper 高 11-15x)── bir diğer kısmı yığın:FP4 权重、MTP taslak、pöreklenmiş prefill/decode, yanı sıra MoE uzman iletişim için kullanılan NVLink 5 all-to-all──

Bu, bir değişim değil. Bu, bir değişim değil. Bu, bir değişim değil.

## 概念

### Neden FP8 hâlâ KV cache'nin altını tutuyor ?

2026 yılında bir yaygın hata: NVFP4'in her yerde uygulanabileceğini varsaymak. Gerçek bu değil. KV kasesi FP8'nin 8 bit yüzen noktasına ihtiyaç duyar.

NVFP4 ((2025-2026) ağırlık ve aktiv değer için uygundur. Mikroskalalama: Her ağırlık bloğunun kendi ölçek faktörü vardır, bu nedenle küçük blok farklı hareketli boyutları kaplayabilir, ve her tenzor ölçek kaybından etkilenmez.

典型 Blackwell 配置:

- 权重:NVFP4(4 bit mikroskalyeleme)
- 激活值:NVFP4。
- KV önbelleği:FP8。
- Dikkat Akülatörü:FP32 ((softmax 稳定性)

### TRT-LLM kullanımı Blackwell Özellikleri

- **Day-0 FP4 weights**Model Provide Directly Publish FP4 权重;TRT-LLM 无需后培训转换 即可加载──FP4 不需要 AWQ / GPTQ 步骤──
- **Multi-token prediction (MTP)**EGAGLE ile aynı fikirde ama TRT-LLM yapısına kadar yoğunlaşmış.
- **Disaggregated serving**:prefill 和 decode 位于独立GPU pool,KV cache 通过 NVLink 或 InfiniBand 传输──与Dynamo(Phase 17 · 20)
- **All-to-all communication primitives**NVLink 5 , Hopper'a kıyasla MoE uzman iletişim gecikmesini 3x ¥ azaltacaktır.
- **NVFP4 + MXFP8 microscaling**Blackwell Tensor Cores Üstündeki Hardware Akselere Skala Faktörü

### Hatırlamalı olduğun bir sayı var.

- HGX B200 TRT-LLM ile GPT-OSS-120B'de 0.02 $2/M Token'e ulaştı.
- GB200 NVL72 通过Dynamo (TRT-LLM) $0.012/M Token (Token)
- H100 + vLLM 在可比工作负荷上约为0.09 $9/M Token──
- TRT-LLM 更新三月带来 2.8x 吞吐增益(2026)。
- Blackwell'in Hopper'ın tek GPU LLM's 吞吐为11-15x
- MLPerf Inference v6.0(2026年 4月):Blackwell 主导每个提交任务──

### FP4 On Quality Gerçek Fiyat

NVFP4  çok aktif.  Raciyeleme ağır iş yükünde ([[fikir zinciri]], matematik 长上下文 kod-gen) üzerinde,FP4 权重会明显退化── Per blok kalibrasyonu hafifletilebilir, ancak ortadan kaldırılamaz──  Raciyeleme modelleri yayınlama ekibi genellikle FP8 权重 + FP4 激活值 as折中, veya H200 上全程使用 FP8──

規則: 权重前,始终在你的 eval set上验证任务质量.

### Neden bu bir NVIDIA-kalkalama  karar

TRT-LLM C++ + CUDA + kapalı kaynak çekirdekleridir. Model belirli GPU SKU için gereklidir.

### 2026 yıl pratik hizmetleri

⇒ H100 + vLLM üzerinde deney seviyesi, model generasyon hızını elde etmek için ⇒ Hopper + vLLM için 7-10x  optimization space ∼ ⇒ Cost-dominant workload ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ 

### Ayrımlama bonusu

TRT-LLM'nin ayrıştırılmış servisi(分离的预填和解码池)将在Phase 17 · 20 中深入讲解──在Blackwell 上,乘数会叠加:FP4 权重 × MTP hızlandırması × ayrıştırılmış yerleştirme × cache-aware yönlendirme──7x 数字假设使用的是这套完整的堆──


```figure
pipeline-parallel
```

## Kullan

`code/main.py`HBM ayak izi, dekodlama çıkışı, hafıza bağlı rejim ve $/M-token:H100 + BF16 + vLLM、H100 + FP8 + vLLM、B200 + NVFP4/FP8 + TRT-LLM──

## - Söyle.

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md` Gösterilen iş yükü  Model size size y y y y y Token volume, Blackwell + TRT-LLM yığınının NVIDIA-kalka değer olup olmadığını yargılayacaktır.

## 练习

1. 运行  İşlem`code/main.py` %30'luk aktif parametreler için 120B MoE, hesap H100 BF16、H100 FP8 ve B200 NVFP4/FP8 üzerinde hafıza bant genişliği sınırlı dekodleme throughput─ en büyük atılım nereden geliyor?
2. H100 + vLLM'de yılda 2 milyon dolar harcanıyor. 7 kat ekonomik farkı düşününce, 12 ay içinde satışa çıkıp TRT-LLM'nin maliyetine geçmek için Blackwell GPU'larını ne kadar satın almaları gerekiyor?
3. NVFP4 权重转换后, MATH 上 准确率下降 3 个点――说出两条恢复路径:一条质量第一(保留 FP8 权重),一条成本第一(域内数据用做校准)
4. MLPerf v6.0 sonuçları... Blackwell-over-Hopper'ın en küçük farkı ne?
5. 計算 405B 模型在 NVFP4 权重 + FP8 KV cache、128k bağlamı 下所需的HBM──它能装进单个GB200 NVL72 节点吗?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) 2026 yıl 4 月 MLPerf 结果──
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) NVLink 5 tüm ile birlikte MoE çekirdekleri
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方 engine 文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)TRT-LLM'de ayrıntılı orkestrasyon.
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)Blackwell Numarks'ın referans değerleri paketini yayınlamak.
