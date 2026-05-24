---
name: edge-target-picker
description: 根据 device、model 和 latency budget，选择 edge inference target（Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson）以及匹配的 quantization format。
version: 1.0.0
phase: 17
lesson: 12
tags: [edge, ane, hexagon, webgpu, webllm, jetson, core-ml, qnn, nvfp4]
---

给定 deployment platform（iOS、Android、browser、robotics/automotive/edge server）、model 和 latency/memory budget，产出 edge target 推荐。

产出：

1. Target。命名具体的 NPU/GPU（ANE、Hexagon、WebGPU、Jetson Orin Nano / AGX / Thor）。结合 platform 和 2026 runtime 覆盖情况给出理由。
2. Bandwidth ceiling。计算理论 decode ceiling：bandwidth_GB_s / model_size_GB。与用户的 tok/s 要求对比。如果 ceiling 低于要求，拒绝或提出更小的 model / 更严格的 quantization。
3. Quantization format。选择 Q4 GGUF（browser/edge CPU）、Core ML INT4 + FP16（ANE）、QNN INT8/INT4（Hexagon）或 NVFP4 + FP8 KV（Jetson Thor / Edge-LLM）。
4. Conversion pipeline。命名准确的 converter（Core ML converter、Qualcomm AI Hub、用于 WebLLM 的 MLC-LLM、TensorRT-LLM Edge compiler）。
5. Context budget。说明在 device RAM 中与 weights 同时容纳的 max context。对于 long-context use case，指定 KV quantization（Q4 KV）或拒绝。
6. Fallback。当 device 能力不足或 WebGPU 不可用（Firefox Android、较旧 browser）时，指定使用相同 OpenAI-compatible interface 的 server-side API fallback。

硬性拒绝：
- 承诺高于 bandwidth ceiling 的 tok/s。拒绝 — physics。
- 在 2026 年通过非 Core ML runtime 直接 target ANE。只有 Core ML 原生暴露 ANE。
- 假设每个 browser 都有 WebGPU。2026 覆盖率约为 70-75% mobile；始终指定 fallback。

拒绝规则：
- 如果 model >6 GB 且 target 是 phone（4-8 GB RAM），拒绝 — 先提出更小的 model 或 aggressive quantization。
- 如果请求是在 iPhone 上对 7B model 使用 128K context，拒绝 — device RAM 无法容纳，除非使用 Q4 KV 加 sliding-window attention。
- 如果 deployment 要求在 Android 上通过 WebGPU 进行 long-context streaming，并且用户要求支持 Firefox，拒绝并要求使用 Chrome 或 server fallback。

输出：一页 plan，命名 target、ceiling、quantization、converter、context budget、fallback。以单个 metric 结尾：target fleet 中 worst-case device 上观测到的 tok/s。
