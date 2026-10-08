# Edge Inference  Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson

> 核心边缘 约束是内存带宽,而不是计算──Mobile DRAM 位于 50-90 GB/s;datacenter HBM3 超过 2-3 TB/s 差为 30-50x──Decode 受记绑定 限制,因此这个差为决定性的──到2026年,格局分成四类──Apple M4/A18 Neural Engine 在统一内存(无CPUNPU拷贝) 下峰值为38 TOPS──Qualcomm Snapdragon X Elite / 8 Gen 4 Hexagon 达到45 TOPS──WebGPU + WebM 在 M3 Max 上运行 Llama 3.1 8B ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**类型：**Öğrenin
**语言：**Python(stdlib, oyuncak bant genişliği sınırlı dekode 模拟器)
**前置要求：**17 · 04(vLLM Servis İçeri)
**时间：**~ 60 dakika

## Öğrenme hedefi

- Neden mobil LLM sonuçları hafıza bant genişliği sınırlı, hesaplama ise ikinci bir faktördür
- 列举四个边缘目标(Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson),并将每个目标匹配一个用例──
- 2026 yılında WebGPU kapsamı boşluğu hakkında konuşuyoruz.
- Bu nedenle, her hedef için bir miktarlama biçimi seçin.

## 问题

Bir müşteri bir cihaz üzerinde bir sohbet robotu istiyor: ses-birinci、 özel-öntemle、 açıklıktan kullanılabilir. MacBook Pro M3 Max 上,Llama 3.1 8B Q4 以 ~55 tok/s 运行可接受. iPhone 16 Pro 上, aynı model 以 3 tok/s 运行不可接受.

Çıktılık farkı portlama değil 问题──它是带宽差 乘以量化格式,再乘以 NPU 是否能从用户空间 访问──2026 yılının kenar sonucu dört farklı problemdir, dört farklı çözüm gerektirir──

## 概念

### Çubuğun genişliği sadece gerçek bir sınır.

Dekode 会为每个代币 读取完整的权重 集合──一个 Q4 的 7B modeli ise 3.5 GB──以 50 GB/s 读取 3.5 GB 需要 70 ms理论上限约为 ~14 tok/s──在 90 GB/s 高端手机 DRAM) 下,上限移动到 ~25 tok/s──低于这个数字时,再多计算也没有帮助──

Datacenter HBM3 以 3 TB/s 读取同样 3.5 GB 需1.2 ms上限是830 tok/s──同一个模型,同样的重量──不同的内存子系统──

### Apple Sinir Motoru ((M4 / A18)

- Maksimum 38 TOPS──Birleştirilmiş bellek(CPU ve ANE 共享同一个池)没有复印上支──
- Kore ML +  üzerinden`.mlmodel`编译模型访问,或通过 PyTorch 经由 Metal Performance Shaders(MPS)访问。
- Llama.cpp Metal Backend kullanın MPS, doğrudan kullanmayın ANE; native ANE  Core ML dönüşüm gerektirir。
- 2026 yıl iOS uygulamalarının en iyi uygulama yolu: INT4 ağırlıklarını kullanmak + FP16 etkinleştirmelerinin temel ML-i

### Qualcomm Hexagon(Snapdragon X Elite / 8 Gen 4)

- Maksimum 45 TOPS── SoC'de, CPU ve GPU ile birlikte, ancak bağımsız bellek alanı vardır──
- QNN(Qualcomm Neural Network) SDK ve AI Hub 提供从PyTorch/ONNX 的转换──
- Çat şablonları ✓ Lama 3.2 ✓ Phi-3 ✓ AI Hub ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓  ✓  ✓ ✓ ✓     ✓      ✓                                                                                                                                                                                           

### Intel / AMD NPU'ları(Lunar Lake, Ryzen AI 300)

- 40-50 TOPS──Softüer Apple/Qualcomm'a geri kalıyor. OpenVINO gelişmekte, ama hala niche.
- Windows ARM yardımcı pilot uygulamalarına en uygun olan; AMD/Intel masaüstülerinde yerel olarak kullanılır.

### WebGPU + WebLLM

- WebGPU hesaplama şaderleri ile tarayıcıda çalıştırılır.
- M3 Max'e göre Llama 3.1 8B Q4 yaklaşık olarak ~41 tok/s'in aynı arka uçtan geçiyor, yaklaşık olarak yerlilerin %70-80%'i.
- WebLLM 17.6k GitHub yıldızları; OpenAI uyumlu JS API; Apache 2.0
- 2026 kapsamı:Chrome Android v121+、Safari iOS 26 GA,Firefox Android 仍在追赶──总体约为 ~70-75% cep telefonu kapsamı──

### NVIDIA Jetson ailesi

- Orin Nano Super(8GB): 可容纳 Llama 3.2 3B、Phi-3,并具有不错的 tok/s。
- AGX Orin: VLLM üzerinden 以 ~40 tok/s 运行 gpt-oss-20b。
- Thor / T4000(JetPack 7.1): AGX Orin'in 2x performansına, EAGLE-3 ve NVFP4'e destek
- TensorRT Edge-LLM(2026) EAGLE-3 spekülatör çözümü, NVFP4 ağırlıkları, parçalara ayırılmış prefill, veri merkezi optimizasyonları, 已移植到边──

### Her hedef için bir miktar 选择

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### Kenar üst uzun bağlamlı bir tuzak

Llama 3.1'in 128K bağlamı ise veri merkezi funksiyonlarıdır. 8 GB RAM'ın cep telefonlarında, 4 GB model + 32K tokenlerinin 2 GB KV önbelleği + OS overhead = OOM。 Edge dağıtımları, 4K-8K'de kalmak için bağlamı kullanır.

### Ses , katil uygulamasıdır .

Ses ajanları  latence karşı duyarlı(birinci token < 500 ms) ―― Yerel sonuçlar, ağ gecikmesini tamamen ortadan kaldıracak── konuşma-sözlü bir şekilde konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma yaparak konuşma.

### Hatırlamalı olduğun bir sayı var.

- Apple M4 / A18 ANE:38 TOPS
- Qualcomm Hexagon SD X Elite:45 TOPS
- WebLLM M3 Max:Llama 3.1 8B Q4 上 ~41 tok/s
- AGX Orin: VLLM ile Gpt-oss-20b'ye
- Veri merkezi kenarında bant genişliği boşluğu 30-50x.
- WebGPU mobil kapsamı: ~70-75%


```figure
edge-bandwidth-pipe
```

## Kullan

`code/main.py`Band genişliği sınırlı matematik kullanmak için her kenar hedefinin teorik dekodeleme geçiş tavanları kullanmak.

## - Söyle.

本课会生成 `outputs/skill-edge-target-picker.md` belirlenmiş platform (iOS/Android/browser/Jetson)  model, ayrıca gecikme/hüzdedecek bütçe, kuantitasyon biçimini ve dönüşüm borusunu seçer.

## 练习

1. 运行  İşlem`code/main.py`△ Snapdragon 8 Gen 3 ((~77 GB/s bant genişliği) üzerinde Q4 7B modeli için, hesaplama kodlama tavanı──与观测到的 6-8 tok/s比较运行时间是否高效?
2. Android'in üstündeki WebGPU'ları Chrome v121+ gerektirir. Eski tarayıcılar için aynı OpenAI uyumlu API'yi kullanarak bir geri dönüş tasarlama yaparlar.
3. iOS uygulamanız 4K bağlam akışı gerektiriyor. Hangi model/format kompleksi iPhone 16'da 4 GB'dan daha düşük aktif bellek tutmanıza izin verebilir?
4. Jetson AGX Orin 40 tok/s ile 运行 gpt-oss-20b。Jetson Nano sadece 3B'yi tutabilir。 Eğer ürünlerin aynı anda iki tarafta olursa, nasıl bir sonuç yığını birleştirebilirsin?
5. 论证WebLLM  2026 yılında üretim hazır mı?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ANE | "Apple neural engine" | M-series 和 A-series 中的 on-device NPU；unified memory |
| Hexagon | "Qualcomm NPU" | Snapdragon NPU；用于访问的 QNN SDK |
| WebGPU | "browser GPU" | W3C-standardized browser GPU API；Chrome/Safari 2026 |
| WebLLM | "browser LLM runtime" | MLC-LLM project；Apache 2.0；OpenAI-compatible JS |
| Jetson | "NVIDIA edge" | Orin Nano / AGX / Thor / T4000 family |
| TRT Edge-LLM | "edge TensorRT" | TensorRT-LLM 的 2026 edge port；EAGLE-3 + NVFP4 |
| Unified memory | "shared pool" | CPU 和 NPU 看到同一块 RAM；没有 copy overhead |
| Bandwidth-bound | "memory limited" | Decode 受读取 weights 的 bytes/sec 限制 |
| Core ML | "Apple conversion" | 用于 ANE-native models 的 Apple framework |
| QNN | "Qualcomm stack" | Qualcomm Neural Network SDK |

## 延伸阅读

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) 格局与基准──
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) Orin / AGX / Thor。
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/)2026 kenar limanı 公告──
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) デザイン与基準──
- [Apple Core ML](https://developer.apple.com/documentation/coreml) ANE-devli dönüşüm
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) Heksagon 预先转换的模型──
