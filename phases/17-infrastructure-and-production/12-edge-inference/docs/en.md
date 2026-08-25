# Edge Inference — Apple Neural Engine、Qualcomm Hexagon、WebGPU/WebLLM、Jetson

> Edge 的核心约束是内存带宽，而不是计算能力。移动端 DRAM 的带宽为 50-90 GB/s；数据中心 HBM3 可达到 2-3 TB/s，两者相差 30-50 倍。Decode 受内存限制，因此这一差距具有决定性影响。2026 年的格局分为四类。Apple M4/A18 Neural Engine 峰值达到 38 TOPS，并采用统一内存（无需 CPU↔NPU 拷贝）。Qualcomm Snapdragon X Elite / 8 Gen 4 Hexagon 达到 45 TOPS。WebGPU + WebLLM 可在 M3 Max 上以约 41 tok/s 运行 Llama 3.1 8B（Q4）（约为原生性能的 70-80%）；拥有 17.6k GitHub stars、OpenAI-compatible API，以及约 70-75% 的移动端覆盖率。NVIDIA Jetson Orin Nano Super（8GB）可容纳 Llama 3.2 3B / Phi-3；AGX Orin 通过 vLLM 以约 40 tok/s 运行 gpt-oss-20b；Jetson T4000（JetPack 7.1）的性能是 AGX Orin 的 2 倍。TensorRT Edge-LLM 支持 EAGLE-3、NVFP4、chunked prefill，Bosch、ThunderSoft 和 MediaTek 已在 CES 2026 上进行展示。

**Type:** Learn
**Languages:** Python（stdlib，简化的带宽受限 Decode 模拟器）
**Prerequisites:** Phase 17 · 04（Serving Engine 内部机制）、Phase 17 · 09（生产级 Quantization）
**Time:** ~60 分钟

## Learning Objectives

- 解释为什么移动端 LLM Inference 受内存带宽限制，而计算能力居于次要地位。
- 列举四种 Edge 目标（Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson），并将每一种目标与相应使用场景匹配。
- 说明 2026 年 WebGPU 的覆盖缺口（Firefox Android 正在追赶）以及 Safari iOS 26 的正式支持。
- 为每种目标选择 Quantization 格式（ANE 使用 Core ML INT4 + FP16，Hexagon 使用 QNN INT8/INT4，浏览器使用 WebGPU Q4，Jetson Thor 使用 NVFP4）。

## 问题

客户需要一个设备端聊天机器人：以语音为先、默认保护隐私，并且支持离线使用。在 MacBook Pro M3 Max 上，Llama 3.1 8B Q4 的运行速度约为 55 tok/s，足以使用。在 iPhone 16 Pro 上，同一个 Model 只能达到 3 tok/s，无法接受。在搭载 Snapdragon 8 Gen 3 的中端 Android 设备上，速度为 7 tok/s。通过 Chrome Android v121+ 的 WebGPU 在浏览器中运行时，速度会根据设备不同落在 4-8 tok/s。

吞吐量差异并非移植问题。它取决于带宽差距、Quantization 格式，以及用户空间能否访问 NPU。2026 年的 Edge Inference 实际上是四个不同的问题，需要四种不同的解决方案。

## 概念

### 带宽才是真正的上限

Decode 每生成一个 Token，都要读取全部权重。一个采用 Q4 的 7B Model 大小为 3.5 GB。以 50 GB/s 读取 3.5 GB 需要 70 ms，理论上限约为 14 tok/s。在 90 GB/s（高端移动 DRAM）的情况下，上限可提高到约 25 tok/s。低于这个上限时，再多的计算能力也无济于事。

数据中心 HBM3 的带宽达到 3 TB/s，只需 1.2 ms 即可读取相同的 3.5 GB，理论上限为 830 tok/s。Model 相同，权重相同，只是内存子系统不同。

### Apple Neural Engine（M4 / A18）

- 最高 38 TOPS。采用统一内存（CPU 和 ANE 共享同一内存池），没有拷贝开销。
- 可通过 Core ML + 编译后的 `.mlmodel` Model 访问，也可在 PyTorch 中通过 Metal Performance Shaders（MPS）访问。
- Llama.cpp Metal backend 使用 MPS，并不直接使用 ANE；原生 ANE 支持需要转换为 Core ML。
- 2026 年 iOS 应用的最佳实践路径：使用 INT4 权重和 FP16 activation 的 Core ML。

### Qualcomm Hexagon（Snapdragon X Elite / 8 Gen 4）

- 最高 45 TOPS。它与 CPU 和 GPU 集成在同一个 SoC 中，但使用独立的内存域。
- QNN（Qualcomm Neural Network）SDK 和 AI Hub 支持从 PyTorch/ONNX 转换。
- Chat template、Llama 3.2 和 Phi-3 都在 AI Hub 上作为一等 artifact 提供。

### Intel / AMD NPU（Lunar Lake、Ryzen AI 300）

- 40-50 TOPS。软件生态落后于 Apple/Qualcomm；OpenVINO 正在改进，但仍属于小众方案。
- 最适合 Windows ARM copilot 应用；也可在 AMD/Intel 桌面设备上原生运行，支持 local-first 场景。

### WebGPU + WebLLM

- 通过 WebGPU compute shader 在浏览器中运行 Model，无需安装。
- 在 M3 Max 上以约 41 tok/s 运行 Llama 3.1 8B Q4，使用相同 backend 时约为原生性能的 70-80%。
- WebLLM 拥有 17.6k GitHub stars；提供 OpenAI-compatible JS API；采用 Apache 2.0。
- 2026 年覆盖情况：Chrome Android v121+、Safari iOS 26 GA，Firefox Android 仍在追赶。移动端总体覆盖率约为 70-75%。

### NVIDIA Jetson 系列

- Orin Nano Super（8GB）：可容纳 Llama 3.2 3B、Phi-3，并提供良好的 tok/s。
- AGX Orin：通过 vLLM 以约 40 tok/s 运行 gpt-oss-20b。
- Thor / T4000（JetPack 7.1）：性能是 AGX Orin 的 2 倍，支持 EAGLE-3 和 NVFP4。
- TensorRT Edge-LLM（2026）支持 EAGLE-3 speculative decoding、NVFP4 权重和 chunked prefill，将数据中心的优化方案移植到了 Edge。

### 为每种目标选择 Quantization

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 权重 + FP16 activation | Core ML 转换路径 |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converter |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | 受内存限制 |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM 路径 |

### Edge 上的长 Context 陷阱

Llama 3.1 的 128K Context 是一项数据中心 Feature。在配备 8 GB RAM 的手机上，4 GB Model + 32K Token 对应的 2 GB KV cache + OS 开销会导致 OOM。除非接受激进的 KV Quantization（Q4 KV），否则 Edge 部署通常会将 Context 保持在 4K-8K。

### 语音是杀手级应用

语音 Agent 对延迟非常敏感（首个 Token < 500 ms）。本地 Inference 可以彻底消除网络延迟。将其与 speech-to-text 结合使用（Whisper Turbo 的变体可在 Edge 上运行），Edge Inference 就能构成生产级语音循环。

### 你应该记住的数字

- Apple M4 / A18 ANE：38 TOPS。
- Qualcomm Hexagon SD X Elite：45 TOPS。
- WebLLM M3 Max：在 Llama 3.1 8B Q4 上约为 41 tok/s。
- AGX Orin：通过 vLLM 在 gpt-oss-20b 上约为 40 tok/s。
- 数据中心与 Edge 的带宽差距：30-50 倍。
- WebGPU 移动端覆盖率：约 70-75%（Firefox Android 落后）。

```figure
edge-bandwidth-pipe
```

## 使用它

`code/main.py` 使用带宽受限的数学模型，计算不同 Edge 目标的理论 Decode 吞吐量上限。它会与观测到的 benchmark 进行比较，并指出瓶颈何时来自带宽而非计算能力。

## 交付它

本课将生成 `outputs/skill-edge-target-picker.md`。给定平台（iOS/Android/浏览器/Jetson）、Model，以及延迟和内存预算后，它会选择 Quantization 格式与转换 Pipeline。

## 练习

1. 运行 `code/main.py`。对于 Snapdragon 8 Gen 3（带宽约为 77 GB/s）上采用 Q4 的 7B Model，计算 Decode 上限。将其与观测到的 6-8 tok/s 比较，runtime 的效率如何？
2. Android 上的 WebGPU 要求 Chrome v121+。为旧版浏览器设计 fallback，通过相同的 OpenAI-compatible API 使用服务端处理。
3. 你的 iOS 应用需要支持 4K Context streaming。哪一种 Model/格式组合可以让 iPhone 16 上的活动内存保持在 4 GB 以下？
4. Jetson AGX Orin 能以 40 tok/s 运行 gpt-oss-20b，而 Jetson Nano 只能容纳 3B Model。如果产品同时面向这两种设备，应如何统一 Inference stack？
5. 论证“WebLLM 在 2026 年是否已达到 production-ready”。请引用覆盖率、性能和 Firefox Android 的差距。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ANE | “Apple Neural Engine” | M 系列和 A 系列中的设备端 NPU；采用统一内存 |
| Hexagon | “Qualcomm NPU” | Snapdragon NPU；通过 QNN SDK 访问 |
| WebGPU | “浏览器 GPU” | W3C 标准化的浏览器 GPU API；2026 年支持 Chrome/Safari |
| WebLLM | “浏览器 LLM runtime” | MLC-LLM 项目；Apache 2.0；兼容 OpenAI 的 JS |
| Jetson | “NVIDIA Edge” | Orin Nano / AGX / Thor / T4000 系列 |
| TRT Edge-LLM | “Edge TensorRT” | 2026 年 TensorRT-LLM 的 Edge 移植版本；EAGLE-3 + NVFP4 |
| Unified memory | “共享内存池” | CPU 和 NPU 访问相同 RAM；没有拷贝开销 |
| Bandwidth-bound | “内存受限” | Decode 受每秒读取权重的字节数限制 |
| Core ML | “Apple 转换方案” | Apple 用于 ANE 原生 Model 的 framework |
| QNN | “Qualcomm stack” | Qualcomm Neural Network SDK |

## 延伸阅读

- [设备端 LLM 现状综述 2026](https://v-chandra.github.io/on-device-llms/) — 格局与 benchmark。
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) — Orin / AGX / Thor。
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) — 2026 年 Edge 移植版本公告。
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) — 设计与 benchmark。
- [Apple Core ML](https://developer.apple.com/documentation/coreml) — ANE 原生转换。
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) — 面向 Hexagon 的预转换 Model。
