# Üretim Kvantılandırması  AWQ, GPTQ, GGUF K-kvantları, FP8, MXFP4/NVFP4

> Kvantisaj biçimi genel bir seçenek değil, ancak donanım、 hizmet eden motor、 iş yükü fonksiyonu¬GGUF Q4_K_M veya Q5_K_M  llama.cpp 和 Ollama 交付, CPU ve kenar 场景¬GPTQ vLLM 内部胜出, size uygun olarak aynı taban üzerinde multi-LoRA çalıştırma durumunda bulunmaktadır. Marlin-AWQ çekirdeklerinin AWQ'ı 7B sınıfı modelinde yaklaşık 741 tok/s'e ulaşabilmektedir ve INT4'de en iyi Pass@1, 2026 yılının veri merkezi üretiminin öntanımlı seçimi¬FP8 Adaper kışında, cache ve Blackwell'in üst kesiminde, benzersiz ve geniş destekle­tilmektedir. NVFP4 ve MXFP4 Blackwell mikroskobik üretiminin) her bir seri boyutunda, bir testin aşılması gerekir.

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## Öğrenme hedefi
- 2026 yılında altı çeşit üretim kuantitasyon biçimi ve en iyi uygulanabilir ortamı anlatılmaktadır.
- Bu, bir süre önce bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir süre sonra bir
- 計算所選式省の重量メモリ,以及未影響のKVキャッシュ──
- Konu: Kvantizasyonlu modeller bulma tarzı

## 问题
Kvantisalizasyon, hafıza ve HBM bant genişliğini azaltır, bu da çözme gerektirir. FP16 70B modelinde 140 GB 权重 vardır.

Ancak, kuantitasyon ücretsizdir. Kadrenli kuantitasyon, kaliteyi düşürür, özellikle de akıl yürütme ağır görevlerde. Farklı biçimlerde farklı motorlara uyum sağlar. Farklı donanımlarda farklı hassasiyetlere destek verir.

## 概念
### Altı format

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/ge 默认选择

GGUF bir dosya biçimidir, kendiliğinden ölçümlü bir çözüm değildir, K-quant varianlarını kullanır.

Bu biçim GPU çekirdekleri için kullanılmaz.

### GPTQ  vLLM 中的多洛拉

GPTQ, eğitim sonrası bir kuantitasyon algoritmasıdır, kalibrasyon geçişleri vardır.

Bunun özel avantajları:GPTQ-Int4 vLLM'de LoRA adaptörlerini destekler. Eğer bir temel modelle birlikte 10-50 ince ayarlanmış variantı servis etmek istiyorsanız, her biri bir LoRA olarak,GPTQ İşte yolunuz.

### AWQ  veri merkezi GPU 默认选择

Aktiflik-Aydın Ağırlık Kvantisiasyonu──量化时保护约1% 最显著的权重──Marlin-AWQ çekirdekleri:相比天真 实现有10.9x速度──7B 上约 741 tok/s,是INT4格式中 Pass@1 最好的──

Ancak çoklu LoRA (GPTQ) veya Blackwell FP4 (NVFP4) geliştirilmesine ihtiyacınız yok.

### FP8  Güvenilir orta 带

8-bit yüzen nokta──近似无损──支持广泛──Hopper Tensor Cores 原生加速FP8──Blackwell 继承这一点──当质量不可妥协时(推理、医学、代码-gen),FP8 2026 yılının güvenli bir默认选择──Memory savings is INT4'in yarısı, ancak质量风险 çok az──

### MXFP4 / NVFP4  Blackwell 激进选择

Mikroskala FP4── her ağırlık bloku kendi ölçek faktörüne sahiptir── öne çıkar, ancak Blackwell Tensor Cores'te üzerinde bir donanım hızlandırılması vardır── FP8'ye göre, her token 字节 sayısını yarıya düşürür, bu 17 · 07'ün ekonomik kazancıdır──

Dikkat:
- Daha fazla LoRA desteği yok.
- Düşünüyor-koşlu iş yükleri 上质量下降可见──
- 必須在你的评估集合上逐模型验证──

### Kalibrasyon tuzakı

AWQ ve GPTQ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

修复方式: domen içindeki verileri kullanmak, kalibrasyon yapmak.

### KV'nin önbellek tuzağı

AWQ 4 bitlere kadar ağırlığı küçültmek KV kasesi ayrılmış, FP16/FP8 olarak tutulmuştur.

- Ağırlık: Yaklaşık 35 GB ((140 GB INT4 ve sonra)
- 128 并发 × 2k bağlamı 下的 KV缓存:约20 GB──
- Aktifleştirmeler: yaklaşık 5 GB.
- Toplam: 60 GB, H100'e 80 GB koyabilirsiniz.

Bu yüzden, bu modelin 4 GB'ye kadar ölçülmesini unutmayacağım.

Ayrıca, KV cache kuantizasyonu ((FP8 KV veya INT8 KV) başka bir seçenektir, kendi özelliği vardır, doğrudan dikkat doğruluğunu etkileyecektir, ücretsiz değil.

### AWQ INT4 akıl yürütme riskleri vardır

Düşünce zinciri, matematik, uzun bağlam kod-gen, bu görevler belirgin olarak hızlandırılmış ölçüde etkilenir.

### 2026 seçme rehberi

- CPU/gezer servis:GGUF Q4_K_M──完成──
- GPU servis ➤ rutin sohbet ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ 
- GPU servis  multi-LoRA:带 Marlin'in GPTQ
- Dönüşümleme iş yükü:FP8。
- Blackwell veri merkezi 质量已验证:NVFP4 + FP8 KV
- Açıkçası: Her aday için 1000 örnek değerlendirme.


```figure
gpu-memory-breakdown
```

## Kullan
`code/main.py`Bu, bir dizi model boyutları, hesaplama altı biçimindeki bellek ayak izi (vezler + KV + aktivasyonlar) ve nispeten geçiş için kullanılır.

## - Söyle.
本课会产 出 `outputs/skill-quantization-picker.md`❖ Hardver ❖ model boyutu ❖ iş yükü tipi ❖ kalite toleransı ❖ şekil seçilir ve kalibrasyon/valyatifasyon planı üretir.

## 练习
1. 运行  İşlem`code/main.py`◦ 128 ve 2k bağlamı için 70B modelinde, her biçimdeki toplam HBM'yi hesaplayın. Hangi biçim size bir H100 80GB'yi yerleştirir?
2. Eğer kalite toleransını yanlış değerlendirseniz, geri dönüş yolu nedir?
3. 計算為醫學領域模型 校准 AWQ 必要な校准-dataset boyutu― Neden daha fazla veri her zaman daha iyi değil?
4. Marlin-AWQ çekirdek kağıdı veya yayın notları kullanın.
5. KV'yi BF16'da tutmak için AWQ ağırlıklarını FP8 KV'ye ayırmak daha mantıklı mı?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant variants 的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；production GGUF 默认选择 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-train INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；Marlin kernels；INT4 下最佳 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernels；10x speedup |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上的安全 precision 默认选择 |
| MXFP4 / NVFP4 | “microscaling four” | Blackwell 4-bit FP，带 per-block scale factors |
| Calibration dataset | “cal data” | 用于选择 quantization parameters 的输入文本；必须匹配 domain |
| KV cache quantization | “KV INT8” | 与 weights 分开的选择；影响 Attention accuracy |

## 延伸阅读
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) Referans değerine karşı.
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的吞吐量 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南──
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗子──
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) 原始 AWQ formülasyonı。
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) 原始 GPTQ formülasyonı。
