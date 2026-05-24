---
name: deepseek-v3-reader
description: 读取 DeepSeek-family config，并生成逐组件的架构分析。
version: 1.0.0
phase: 10
lesson: 20
tags: [deepseek-v3, deepseek-r1, mla, moe, mtp, dualpipe, architecture]
---

给定一个 DeepSeek-family model（V3、R1 或任何衍生版本）及其 config（hidden_size、layers、num_experts、kv_lora_rank 等），生成一份架构分析，按组件拆解该模型，并识别它使用了哪些 DeepSeek-specific innovations。

生成：

1. 逐字段 config 解读。对每个字段，说明它映射到的组件以及它贡献的参数量。格式：`field_name: value → interpretation → parameter contribution`。
2. 参数拆解。总参数、active parameters、active ratio。按 embedding、per-layer attention、per-layer MLP（dense vs expert）、router、MTP module、LM head、RMSNorm total 拆分。
3. 目标上下文下的 KV cache。报告 BF16 和 FP8 数值。包含与相同上下文和 hidden size 下 Llama-3-style GQA(8/128) baseline 的对比。
4. 创新检查清单。对 MLA、MTP、aux-loss-free routing、DualPipe，分别识别模型是否使用它，以及这在 config/paper 的哪里可见。
5. Sanity check。计算模型在特定部署目标上的推理内存预算（weights + KV cache + activations）：H100 80GB、H200 141GB、MI300X 192GB、single node vs multi-node。报告是否放得下，以及需要什么 quantization。

硬性拒绝：
- 任何把 DeepSeek-V3 与 GPT-class dense models 混为一谈的分析。二者架构有实质差异。
- 在未指定上下文长度的情况下声称 MLA 比 GQA 更快。在短上下文（4k 以下）它们相当；MLA 在长上下文下胜出。
- 将 MTP 解读为 speculative decoding 的替代品。它是 pre-training objective，也可兼作 draft。

拒绝规则：
- 如果提供的 config 缺少 `kv_lora_rank`、`num_experts` 或 `first_k_dense_layers`，拒绝处理，因为这不是 DeepSeek-family model。
- 如果用户要求精确匹配已发布参数量（精确到最接近的 100M），拒绝并说明已发布数字包含实现相关的结构参数，简化计算器无法精确复现。引导他们阅读 paper 的 Section 2 appendix。
- 如果目标部署设备是 consumer GPU（24GB 或更低），拒绝并建议改用 quantized distilled DeepSeek-family derivative。

输出：一页架构分析，列出字段、参数拆解、KV cache、创新检查清单和部署适配情况。最后用一段“下一步阅读什么”收尾，根据分析暴露出的问题，点名 NSA（Phase 10 · 17）、V2 paper 中的 MLA ablations，或 V3 technical report 的 Section 2 appendix。
