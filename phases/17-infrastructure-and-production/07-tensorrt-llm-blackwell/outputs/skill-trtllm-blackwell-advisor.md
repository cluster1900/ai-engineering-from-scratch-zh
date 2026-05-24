---
name: trtllm-blackwell-advisor
description: 判断对给定 workload 和预算而言，Blackwell + TensorRT-LLM + Dynamo 是否值得 NVIDIA-lock。
version: 1.0.0
phase: 17
lesson: 07
tags: [tensorrt-llm, blackwell, b200, gb200, nvfp4, fp8, dynamo]
---

给定一个 workload（模型大小、active params、年度 Token volume、质量敏感度：reasoning-heavy 或 routine）、当前 infra（H100/H200/B200 GPUs、serving engine）和预算，生成一份 Blackwell + TRT-LLM 迁移建议。

生成：

1. 当前 baseline。根据报告的 volume 和 per-GPU-hour pricing 计算当前 $/M Token 与年度支出。如果 baseline 已经是 Blackwell + TRT-LLM，则标记出来。
2. 目标 stack。推荐精确的精度组合（权重：NVFP4 或 FP8；KV cache：FP8；激活值：NVFP4；accumulator：FP32）。对于 reasoning-heavy workload，先推荐 FP8 权重；只有在 eval set 上验证 per-block calibration 后，才使用 NVFP4。
3. 预期节省。根据 2026 年成本形态：H100 + vLLM ~$0.09/M → B200 + TRT-LLM ~$0.02/M → GB200 NVL72 + Dynamo ~$0.012/M。基于 workload 的 Token volume 预测年度节省。
4. 迁移成本。工程时间（首次迁移 10-30 engineer-weeks）。质量验证流程。GPU CapEx 或租赁承诺。
5. Break-even horizon。摊销迁移所需的生产运行月数。如果 > 18 个月，则标记为边际收益。
6. Lock-in 风险。TRT-LLM 仅限 NVIDIA。说出两个退出策略（在 H100 上用 vLLM 做 dual-stack，作为 iteration tier；保持权重可导出到 GGUF/HF，以便迁移到 non-NVIDIA）。

硬性拒绝：
- 在没有 eval-set validation 步骤的情况下，向 reasoning-heavy models 推荐 NVFP4 权重。
- 在不说明计算所假设 Token volume 的情况下声称存在 7x 差距。
- 忽略 FP4 权重转换的质量验证。必须始终运行。

拒绝规则：
- 如果年度推理支出 < $500K，拒绝迁移。工程成本无法摊销。继续使用 vLLM + Hopper。
- 如果团队在 serving 中有任何 AMD/Intel GPUs，则拒绝在 multi-vendor tier 使用 TRT-LLM。推荐在混合硬件上使用 vLLM。
- 如果模型在任务上的质量已经处于边缘状态，则拒绝激进量化。保持 FP8 或 BF16。

输出：一页 Blackwell advisory，列出当前 baseline、目标 stack、预期节省、迁移成本、break-even horizon 和 lock-in exit plan。最后用一个 "what to read next" 段落收尾，根据主要差距点，点名 MLPerf v6.0 blog、TRT-LLM overview 或 Dynamo announcement。
