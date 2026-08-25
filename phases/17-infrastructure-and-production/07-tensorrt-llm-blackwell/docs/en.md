# 硬件专用 Inference 编译——Blackwell 上的 FP8 与 NVFP4

> 硬件专用 Inference 编译以可移植性换取吞吐量，而 TensorRT-LLM——仅支持 NVIDIA、针对 Blackwell 调优——是这一取舍获得回报的最清晰案例。在配备 Dynamo 编排的 GB200 NVL72 上，SemiAnalysis InferenceX 在 2026 年 Q1-Q2 测得一个 120B Model 每百万 Token 的成本为 $0.012，而 H100 + vLLM 为 $0.09/M——经济性相差 7 倍。该技术栈叠加了三种浮点精度机制：FP8 对 KV cache 和 Attention kernel 仍然至关重要，因为它具备所需的动态范围；NVFP4（4-bit microscaling）负责权重和 activation；multi-token prediction（MTP）与解耦式 prefill/decode 又在此基础上带来 2-3 倍提升。Day-0 Model 支持可直接加载 FP4 权重，无需 post-training 转换。2026 年工程团队需要注意的是：TRT-LLM 虽然开源，但专用于 NVIDIA——针对 CUDA 和 Blackwell 优化——因此采用它意味着以可移植性换取吞吐量。在投入之前，请根据自己的 Model 与硬件组合算清账。

**Type:** Learn
**Languages:** Python（stdlib，玩具版 FP8/NVFP4 内存与成本计算器）
**Prerequisites:** Phase 17 · 04（Serving Engine 内部机制），Phase 10 · 13（Quantization）
**Time:** ~75 分钟

## 学习目标

- 解释即使权重采用 NVFP4，FP8 为何仍然对 KV cache 和 Attention 至关重要。
- 计算前沿 Model 在 BF16、FP8 和 NVFP4 下的 HBM 占用，并分析节省来自何处。
- 说出 TRT-LLM 所利用的 Blackwell 专属 Feature（day-0 FP4、MTP、解耦式 serving、all-to-all primitive）。
- 判断与 Hopper 上的 vLLM 相比，TRT-LLM 的 NVIDIA 锁定是否值得承受，以换取 7 倍成本差距。

## 问题

2026 年 Inference 经济性的前沿问题是“每一美元能够生成多少 Token”。答案取决于四层选择：硬件世代（Hopper H100/H200 与 Blackwell B200/GB200）、精度（BF16 → FP8 → NVFP4）、serving engine（vLLM、SGLang 与 TRT-LLM）以及编排方式（普通、解耦式或 Dynamo）。

在 Hopper 上使用 vLLM 时，一个 120B MoE 每百万 Token 的运行成本约为 $0.09。在 Blackwell 上使用 TRT-LLM + Dynamo 时，同一个 Model 的成本约为 $0.012——便宜 7 倍。这部分差距来自硬件（Blackwell 的单 GPU LLM 吞吐量是 Hopper 的 11-15 倍），另一部分来自技术栈：FP4 权重、MTP draft、解耦式 prefill/decode，以及用于 MoE expert 通信的 NVLink 5 all-to-all。

你无法在 NVIDIA 技术栈之外复现这一效果。这正是取舍所在——以可移植性换取经济性。本课的重点是理解各项技术栈选择分别贡献了多少差距。

## 概念

### 为什么 FP8 仍然是 KV cache 的精度下限

2026 年一个常见错误是：认为 NVFP4 可以应用于所有位置。事实并非如此。KV cache 需要 FP8（8-bit floating point），因为它存储的 Attention key 和 value 横跨较大的动态范围。将 KV Quantization 为 FP4 会导致灾难性的准确率损失——分布尾部会被截断，Attention score 随之崩溃。FP8 的 exponent bit 为 KV cache 提供了所需范围。

NVFP4（2025-2026）适用于权重和 activation。Microscaling 的原理是：每个权重 block 都有自己的 scale factor，因此小 block 可以覆盖不同的动态范围，而不会遭受 per-tensor scale 带来的损失。对于 activation，FP4 能够维持效果，因为单层内的 activation 范围较小。

典型的 Blackwell 配置如下：

- 权重：NVFP4（4-bit microscaling）。
- Activation：NVFP4。
- KV cache：FP8。
- Attention accumulator：FP32（保证 softmax 稳定性）。

### TRT-LLM 使用的 Blackwell 专属 primitive

- **Day-0 FP4 权重**：Model 提供方直接发布 FP4 权重；TRT-LLM 无需 post-training 转换即可加载。FP4 不需要 AWQ / GPTQ 步骤。
- **Multi-token prediction（MTP）**：与 EAGLE（Phase 17 · 05）思路相同，但已集成到 TRT-LLM build 中。
- **解耦式 serving**：prefill 和 decode 分别运行在独立的 GPU pool 上，KV cache 通过 NVLink 或 InfiniBand 传输。与 Dynamo（Phase 17 · 20）思路相同。
- **All-to-all 通信 primitive**：与 Hopper 相比，NVLink 5 将 MoE expert 通信延迟降低了 3 倍。TRT-LLM 的 MoE kernel 专门为此调优。
- **NVFP4 + MXFP8 microscaling**：由 Blackwell Tensor Core 对 scale factor 处理进行硬件加速。

### 你应该记住的数据

- HGX B200 通过 TRT-LLM 运行 GPT-OSS-120B 时，成本为 $0.02/M Token。
- GB200 NVL72 通过 Dynamo（编排 TRT-LLM）运行时，成本为 $0.012/M Token。
- H100 + vLLM 在可比工作负载下约为 $0.09/M Token。
- TRT-LLM 在三个月更新中实现了 2.8 倍吞吐量提升（2026 年）。
- Blackwell 的单 GPU LLM 吞吐量是 Hopper 的 11-15 倍。
- MLPerf Inference v6.0（2026 年 4 月）：Blackwell 在所有提交的任务中占据主导地位。

### FP4 在质量方面的实际代价

NVFP4 相当激进。在高度依赖推理的工作负载中（chain-of-thought、数学、长 Context code-gen），FP4 权重会带来明显的质量下降。Per-block calibration 可以缓解但无法消除这一问题。发布推理 Model 的团队通常采用 FP8 权重 + FP4 activation 作为折中方案，或者继续在 H200 上全程使用 FP8。

规则是：在决定采用 NVFP4 权重之前，始终先使用自己的 Evaluation set 验证任务质量。

### 为什么这是一个锁定 NVIDIA 的决策

TRT-LLM 由 C++ + CUDA + 闭源 kernel 构成。Model 需要针对特定 GPU SKU 进行编译。不支持 AMD，不支持 Intel，也不支持 ARM。如果你的基础设施策略是多供应商，那么对于由 TRT-LLM 提供服务的层级，TRT-LLM 从一开始就不适用——你仍然可以在混合硬件上通过 vLLM 提供服务。如果你只使用 NVIDIA，那么 7 倍的差距足以补偿这种锁定。

### 2026 年实用方案

如果每年 Inference 账单超过 $100M，继续使用 Hopper + vLLM 意味着放弃 7-10 倍的潜在收益。将成本占主导的工作负载迁移到 Blackwell + TRT-LLM + Dynamo。将实验层保留在 H100 + vLLM 上，以保证 Model 迭代速度。在投入生产前，验证每个转换为 NVFP4 的 Model 的质量。

### 解耦带来的额外收益

Phase 17 · 20 将深入介绍 TRT-LLM 的解耦式 serving（将 prefill 和 decode 分配到独立的资源池）。在 Blackwell 上，这些倍增因素会相互叠加：FP4 权重 × MTP 加速 × 解耦式放置 × cache-aware routing。7 倍这一数字假设使用了完整技术栈。

```figure
pipeline-parallel
```

## 使用它

`code/main.py` 会计算 Model 在三种技术栈下的 HBM 占用、decode 吞吐量（memory-bound 场景）和 $/M-Token：H100 + BF16 + vLLM、H100 + FP8 + vLLM，以及 B200 + NVFP4/FP8 + TRT-LLM。运行它可以观察各项效果如何叠加，以及每项变化对总体差距的贡献比例。

## 交付它

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md`。给定工作负载、Model 大小和年度 Token 量，它会判断 Blackwell + TRT-LLM 技术栈是否值得承担 NVIDIA 锁定。

## 练习

1. 运行 `code/main.py`。对于 active parameter 比例为 30% 的 120B MoE，计算 H100 BF16、H100 FP8 和 B200 NVFP4/FP8 上受内存带宽限制的 decode 吞吐量。最大的跃升来自哪里？
2. 某客户每年在 H100 + vLLM 上花费 $2M。考虑 7 倍经济性差距，如果要在 12 个月内摊平迁移到 TRT-LLM 的成本，他们购买 Blackwell GPU 的盈亏平衡数量是多少？
3. 将权重转换为 NVFP4 后，你发现 MATH 准确率下降了 3 个百分点。说出两条恢复路径：一条质量优先（保留 FP8 权重），一条成本优先（使用域内数据进行 calibration）。
4. 阅读 MLPerf v6.0 Inference 结果。哪项任务中 Blackwell 相对 Hopper 的差距最小？为什么？
5. 计算一个 405B Model 在使用 NVFP4 权重、FP8 KV cache 和 128k Context 时所需的 HBM。它能否装入单个 GB200 NVL72 节点？

## 关键术语

| 术语 | 人们怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| FP8 | “eight-bit float” | 8-bit floating point；由于动态范围充足，用于 KV cache 和 Attention |
| NVFP4 | “four-bit micro” | NVIDIA 的 4-bit microscaling FP 格式；用于 Blackwell 上的权重和 activation |
| MXFP8 | “MX eight” | Microscaling FP8 变体；由 Blackwell Tensor Core 提供硬件加速 |
| Day-0 FP4 | “ship FP4 weights” | Model 提供方发布已经采用 FP4 的权重；无需 post-training 转换步骤 |
| MTP | “multi-token prediction” | TRT-LLM 集成的 speculative decoding draft（Phase 17 · 05） |
| Disaggregated serving | “split prefill/decode” | Prefill 和 decode 位于独立 GPU pool；KV 通过 NVLink/IB 传输 |
| All-to-all | “MoE expert comm” | 将 Token 路由到 expert GPU 的通信模式；NVLink 5 将延迟降低 3 倍 |
| InferenceX | “SemiAnalysis inference bench” | 2026 年获得行业认可的单位 Token 成本 benchmark |

## 延伸阅读

- [NVIDIA——Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/)——2026 年 4 月 MLPerf 结果。
- [NVIDIA——Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/)——NVLink 5 all-to-all 与 MoE kernel。
- [TensorRT-LLM 概览](https://nvidia.github.io/TensorRT-LLM/overview.html)——官方 engine 文档。
- [NVIDIA——Dynamo 简介](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)——位于 TRT-LLM 之上的解耦式编排。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)——发布 Blackwell 数据的 benchmark suite。
