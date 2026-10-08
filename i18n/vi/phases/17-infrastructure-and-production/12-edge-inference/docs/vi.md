# Edge Inference  Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson

> 核心边缘 约束是内存带宽,而不是计算. 移动DRAM 位于 50-90 GB/s;数据中心 HBM3 超过 2-3 TB/s差距为 30-50x;. 解码受记忆绑定限制,因此这个差距是决定性的. 到2026年,格局分成四类. 果 M4/A18 Neural Engine 在统存内存(无CPUNPU拷贝) 下峰值为 38 TOPS;; Qualcomm Snapdragon X Elite / 8 Gen 4 Hexagon 达到 45 TOPS;; WebGPU + WebM 在 M3 Max 运行 Llama 3.1 8BLL 运行 Llama 3.1 8B4) 约为7080%; 6k17. OpenAI-AGG G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G G GG GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG

**类型：**Học hỏi
**语言：**Python(stdlib, đồ chơi decode băng thông giới hạn 模拟器)
**前置要求：**Giai đoạn 17 · 04(vLLM Serving Internals)
**时间：**~ 60 phút

## Học mục tiêu

- 解释 tại sao suy luận LLM di động là giới hạn trong bộ nhớ và băng thông, trong khi tính toán là yếu tố thứ hai.
- 列举四个边缘目标(Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson),并将每个目标匹配一个用例――
- Nói ra khoảng cách bảo hiểm WebGPU năm 2026 (Firefox Android đang đang theo đuổi) và tình hình của Safari iOS 26.
- Đối với mỗi mục tiêu  chọn một định dạng định lượng ((ANE sử dụng Core ML INT4 + FP16, Hexagon sử dụng QNN INT8/INT4, trình duyệt sử dụng WebGPU Q4,Jetson Thor sử dụng NVFP4)。

## 问题

Một khách hàng muốn một chatbot trên thiết bị: thoại-làm trước, riêng tư-by-default, offline có sẵn. Trong MacBook Pro M3 Max, Llama 3.1 8B Q4 với ~55 tok/s 运行 có thể chấp nhận. Trong iPhone 16 Pro, cùng một mô hình với 3 tok/s 运行 không thể chấp nhận. Trong khi trên Snapdragon 8 Gen 3 trên Android, là 7 tok/s.

Sự khác biệt về dung lượng không phải là vấn đề  Nó là khoảng cách băng thông  nhân bằng định dạng định lượng, nhân lại bằng NPU 是否能从用户空间 访问──2026 năm kết luận cạnh là bốn vấn đề khác nhau, cần bốn bộ giải pháp khác nhau.

## 概念

### Lượng băng thông 才是真正的上限

Thử giải mã sẽ dành cho mỗi token 读取完整的权重 集合──一个Q4 7B mô hình là 3.5 GB──以 50 GB/s 读取 3.5 GB 需要70 ms理论上限约为 ~14 tok/s──在90 GB/s(高端移动DRAM) 下,上限移动到 ~25 tok/s──低于这个数字时,再多计算也没有帮助──

Datacenter HBM3 以 3 TB/s 读取同样 3.5 GB chỉ cần 1.2 ms上限是 830 tok/s──同样模型,同样重量──不同的内存子系统──

### Apple Neural Engine (M4 / A18)

- 最高 38 TOPS──Tưởng nhớ thống nhất(CPU và ANE 共享同一个池) 没有复印过费──
-  Thông qua Core ML + `.mlmodel`编译模型访问,或通过 PyTorch 经由 Metal Performance Shaders(MPS)访问。
- Llama.cpp Metal backend sử dụng MPS, không trực tiếp sử dụng ANE; bản địa ANE  cần Core ML chuyển đổi。
- 2026 năm ứng dụng iOS ải thực hành tốt nhất: sử dụng trọng lượng INT4 + FP16 kích hoạt của Core ML。

### Qualcomm Hexagon(Snapdragon X Elite / 8 Gen 4)

- 最高 45 TOPS──集成 trong SoC, cùng với CPU và GPU, nhưng có miền bộ nhớ độc lập──
- QNN(Qualcomm Neural Network)SDK và AI Hub 提供从PyTorch/ONNX的转换──
- Các mẫu trò chuyện ✓ Llama 3.2 ✓ Phi-3 都作为AI Hub 上等类型的文物发布──

### Intel / AMD NPUs ((Lunar Lake, Ryzen AI 300)

- 40-50 TOPS── Phần mềm đã bị Apple/Qualcomm  OpenVINO đang được cải thiện, nhưng vẫn còn trong niche──
- Ứng dụng đồng phi công ARM Windows; trên máy tính để bàn AMD / Intel 上 được sử dụng tại địa phương đầu tiên của bản địa 场景。

### WebGPU + WebLLM

- Thông qua WebGPU tính toán shaders trong trình duyệt trong các mô hình vận hành;无需安装。
- Trong M3 Max 上, Llama 3.1 8B Q4 约为 ~41 tok/s通过相同后端,大约是原生的70-80%.
- WebLLM có 17,6k GitHub sao; OpenAI tương thích JS API; Apache 2.0。
- 2026:Khảo sát:Chrome Android v121+、Safari iOS 26 GA,Firefox Android  vẫn đang theo đuổi──总体约为 ~70-75% bảo hiểm di động──

### Gia đình Jetson

- Orin Nano Super(8GB): 可容纳 Llama 3.2 3B、Phi-3,并具有不错的tok/s。
- AGX Orin: thông qua vLLM 以 ~40 tok/s 运行 gpt-oss-20b。
- Thor / T4000(JetPack 7.1): hiệu suất cho AGX Orin 2x, hỗ trợ EAGLE-3 và NVFP4。
- TensorRT Edge-LLM(2026) hỗ trợ giải mã suy đoán EAGLE-3 ∆nVFP4 trọng lượng ∆n prefilldatacenter optimizations 已移植到边

### Mỗi mục tiêu của định lượng  chọn

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### Edge 上的长文 陷

Llama 3.1 có khung cảnh 128K là trung tâm dữ liệu 功能. trên máy tính của 8 GB RAM, 4 GB mô hình + 32K mã thông báo của 2 GB KV cache + OS overhead = OOM.

### Voice là ứng dụng giết người

Các đại lý giọng nói đối với độ trễ  nhạy cảm (đầu tiên token < 500 ms) ―― Kết luận địa phương 会 hoàn toàn loại bỏ độ trễ mạng── với các biến thể của tiếng nói-đến văn bản (Whisper Turbo) 可在边上运行) kết hợp, kết luận cạnh 就成为生产质量的语音循环──

### Bạn nên nhớ số

- Apple M4 / A18 ANE:38 TOPS
- Qualcomm Hexagon SD X Elite:45 TOPS
- WebLLM M3 Max:Llama 3.1 8B Q4 上 ~41 tok/s。
- AGX Orin: Thông qua vLLM 在 gpt-oss-20b 上 ~40 tok/s。
- Khoảng cách băng thông giữa trung tâm dữ liệu và cạnh dữ liệu: 30-50x.
- WebGPU bảo hiểm di động: ~ 70-75%


```figure
edge-bandwidth-pipe
```

## Sử dụng nó

`code/main.py`Sử dụng băng thông giới hạn toán học tính toán các mục tiêu cạnh của các hệ thống giải mã thông qua giới hạn. Nó sẽ tương tự như các điểm chuẩn được quan sát, và nổi bật cho thấy các khối lượng băng thông ở đâu, chứ không phải là tính toán.

## 交付 nó

本课会生成 `outputs/skill-edge-target-picker.md` cho nền tảng định nghĩa (iOS/Android/browser/Jetson)  mô hình, cũng như ngân sách thời gian trễ/tớ, nó sẽ chọn định dạng định lượng và đường ống chuyển đổi

## 练习

1. 运行 `code/main.py`△ Đối với Snapdragon 8 Gen 3 ((~ 77 GB/s băng thông) trên mô hình Q4 7B, tính toán decode trần số △与观测到的 6-8 tok/s比较运行时间 是否高效?
2. Android trên WebGPU  cần Chrome v121+。 Đối với các trình duyệt cũ hơn  thiết kế một fallback thông qua cùng một API tương thích OpenAI sử dụng bên máy chủ。
3. Ứng dụng iOS của bạn  cần 4K-context streaming.  Phụ hợp mô hình/ định dạng nào có thể giúp bạn giữ được dưới 4 GB bộ nhớ tích cực trên iPhone 16?
4. Jetson AGX Orin 以 40 tok/s 运行 gpt-oss-20b。Jetson Nano chỉ có thể chứa 3B。 Nếu sản phẩm của bạn cùng lúc đối diện với hai thứ, làm thế nào để thống nhất xếp hàng suy luận?
5. 论证WebLLM 在 2026 年是否生产准备──引用覆盖,性能,以及 Firefox Android gap──

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

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) 格局与基准――
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) Orin / AGX / Thor。
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) 2026 cổng cạnh 公告。
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) 设计与基准――
- [Apple Core ML](https://developer.apple.com/documentation/coreml) Chuyển đổi người bản địa
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) 为 Hexagon 预先转换的模型──
