# Edge Inference — Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson

> 核心 edge 约束是 memory bandwidth，而不是 compute。Mobile DRAM 位于 50-90 GB/s；datacenter HBM3 超过 2-3 TB/s——差距为 30-50x。Decode 受 memory-bound 限制，因此这个差距是决定性的。到 2026 年，格局分成四类。Apple M4/A18 Neural Engine 在 unified memory（无 CPU↔NPU copy）下峰值为 38 TOPS。Qualcomm Snapdragon X Elite / 8 Gen 4 Hexagon 达到 45 TOPS。WebGPU + WebLLM 在 M3 Max 上以 ~41 tok/s 运行 Llama 3.1 8B（Q4）（大约是 native 的 70-80%）；17.6k GitHub stars、OpenAI-compatible API、~70-75% mobile coverage。NVIDIA Jetson Orin Nano Super（8GB）可容纳 Llama 3.2 3B / Phi-3；AGX Orin 通过 vLLM 以 ~40 tok/s 运行 gpt-oss-20b；Jetson T4000（JetPack 7.1）是 AGX Orin 的 2x。TensorRT Edge-LLM 支持 EAGLE-3、NVFP4、chunked prefill——由 Bosch、ThunderSoft、MediaTek 在 CES 2026 展示。

**类型：** Learn
**语言：** Python（stdlib，toy bandwidth-bound decode 模拟器）
**前置要求：** Phase 17 · 04（vLLM Serving Internals）、Phase 17 · 09（Production Quantization）
**时间：** ~60 分钟

## 学习目标

- 解释为什么 mobile LLM inference 是 memory-bandwidth-bound，而 compute 是次要因素。
- 列举四个 edge targets（Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson），并将每个目标匹配到一个 use case。
- 说出 2026 年 WebGPU coverage gap（Firefox Android 正在追赶）以及 Safari iOS 26 的落地情况。
- 为每个 target 选择一种 quantization format（ANE 用 Core ML INT4 + FP16，Hexagon 用 QNN INT8/INT4，browser 用 WebGPU Q4，Jetson Thor 用 NVFP4）。

## 问题

一位客户想要一个 on-device chatbot：voice-first、private-by-default、离线可用。在 MacBook Pro M3 Max 上，Llama 3.1 8B Q4 以 ~55 tok/s 运行——可以接受。在 iPhone 16 Pro 上，同一个 model 以 3 tok/s 运行——不可接受。在搭载 Snapdragon 8 Gen 3 的中端 Android 上，是 7 tok/s。通过 Chrome Android v121+ 上的 WebGPU 在 browser 中运行时，取决于 device，是 4-8 tok/s。

throughput 的差异不是 porting 问题。它是 bandwidth gap 乘以 quantization format，再乘以 NPU 是否能从 user-space 访问。2026 年的 edge inference 是四个不同的问题，需要四套不同的解决方案。

## 概念

### Bandwidth 才是真正的上限

Decode 会为每个 Token 读取完整的 weights 集合。一个 Q4 的 7B model 是 3.5 GB。以 50 GB/s 读取 3.5 GB 需要 70 ms——理论上限约为 ~14 tok/s。在 90 GB/s（高端 mobile DRAM）下，上限移动到 ~25 tok/s。低于这个数字时，再多 compute 也没有帮助。

Datacenter HBM3 以 3 TB/s 读取同样的 3.5 GB 只需 1.2 ms——上限是 830 tok/s。同一个 model，同样的 weights。不同的 memory subsystem。

### Apple Neural Engine（M4 / A18）

- 最高 38 TOPS。Unified memory（CPU 和 ANE 共享同一个 pool）——没有 copy overhead。
- 通过 Core ML + `.mlmodel` 编译模型访问，或通过 PyTorch 经由 Metal Performance Shaders（MPS）访问。
- Llama.cpp Metal backend 使用 MPS，不是直接使用 ANE；native ANE 需要 Core ML conversion。
- 2026 年 iOS apps 的最佳实践路径：使用 INT4 weights + FP16 activations 的 Core ML。

### Qualcomm Hexagon（Snapdragon X Elite / 8 Gen 4）

- 最高 45 TOPS。集成在 SoC 中，与 CPU 和 GPU 一起，但具有独立 memory domain。
- QNN（Qualcomm Neural Network）SDK 和 AI Hub 提供从 PyTorch/ONNX 的 conversion。
- Chat templates、Llama 3.2、Phi-3 都作为 AI Hub 上的一等 artifacts 发布。

### Intel / AMD NPUs（Lunar Lake, Ryzen AI 300）

- 40-50 TOPS。Software 落后于 Apple/Qualcomm；OpenVINO 正在改进，但仍属 niche。
- 最适合 Windows ARM copilot apps；在 AMD/Intel desktops 上用于 local-first 的 native 场景。

### WebGPU + WebLLM

- 通过 WebGPU compute shaders 在 browser 中运行 models；无需安装。
- 在 M3 Max 上，Llama 3.1 8B Q4 约为 ~41 tok/s——通过同一 backend，大约是 native 的 70-80%。
- WebLLM 有 17.6k GitHub stars；OpenAI-compatible JS API；Apache 2.0。
- 2026 coverage：Chrome Android v121+、Safari iOS 26 GA，Firefox Android 仍在追赶。总体约为 ~70-75% mobile coverage。

### NVIDIA Jetson family

- Orin Nano Super（8GB）：可容纳 Llama 3.2 3B、Phi-3，并具有不错的 tok/s。
- AGX Orin：通过 vLLM 以 ~40 tok/s 运行 gpt-oss-20b。
- Thor / T4000（JetPack 7.1）：性能为 AGX Orin 的 2x，支持 EAGLE-3 和 NVFP4。
- TensorRT Edge-LLM（2026）支持 EAGLE-3 speculative decoding、NVFP4 weights、chunked prefill——datacenter optimizations 已移植到 edge。

### 每个 target 的 Quantization 选择

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### Edge 上的 long-context 陷阱

Llama 3.1 的 128K context 是 datacenter 功能。在 8 GB RAM 的手机上，4 GB model + 32K tokens 的 2 GB KV cache + OS overhead = OOM。Edge deployments 会把 context 保持在 4K-8K，除非接受激进的 KV quantization（Q4 KV）。

### Voice 是 killer app

Voice agents 对 latency 敏感（first token < 500 ms）。Local inference 会完全消除 network latency。与 speech-to-text（Whisper Turbo variants 可在 edge 上运行）结合后，edge inference 就成为 production-quality voice loop。

### 你应该记住的数字

- Apple M4 / A18 ANE：38 TOPS。
- Qualcomm Hexagon SD X Elite：45 TOPS。
- WebLLM M3 Max：Llama 3.1 8B Q4 上 ~41 tok/s。
- AGX Orin：通过 vLLM 在 gpt-oss-20b 上 ~40 tok/s。
- Datacenter-edge bandwidth gap：30-50x。
- WebGPU mobile coverage：~70-75%（Firefox Android 落后）。

## 使用它

`code/main.py` 使用 bandwidth-bound 数学计算各 edge targets 的理论 decode throughput ceilings。它会与观测到的 benchmarks 对比，并突出显示瓶颈在哪里是 bandwidth，而不是 compute。

## 交付它

本课会生成 `outputs/skill-edge-target-picker.md`。给定 platform（iOS/Android/browser/Jetson）、model，以及 latency/memory budget，它会选择 quantization format 和 conversion pipeline。

## 练习

1. 运行 `code/main.py`。对于 Snapdragon 8 Gen 3（~77 GB/s bandwidth）上的 Q4 7B model，计算 decode ceiling。与观测到的 6-8 tok/s 比较——runtime 是否高效？
2. Android 上的 WebGPU 需要 Chrome v121+。为较旧的 browsers 设计一个 fallback——通过相同的 OpenAI-compatible API 使用 server-side。
3. 你的 iOS app 需要 4K-context streaming。哪种 model/format 组合能让你在 iPhone 16 上保持低于 4 GB active memory？
4. Jetson AGX Orin 以 40 tok/s 运行 gpt-oss-20b。Jetson Nano 只能容纳 3B。如果你的产品同时面向两者，如何统一 inference stack？
5. 论证“WebLLM 在 2026 年是否 production-ready”。引用 coverage、performance，以及 Firefox Android gap。

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

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) — 格局与 benchmarks。
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) — Orin / AGX / Thor。
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) — 2026 edge port 公告。
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) — 设计与 benchmarks。
- [Apple Core ML](https://developer.apple.com/documentation/coreml) — ANE-native conversion。
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) — 为 Hexagon 预先转换的 models。
