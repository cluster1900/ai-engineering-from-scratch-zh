---
name: quantization-picker
description: 在给定 hardware、engine、workload 和 quality tolerance 时，选择一种 2026 quantization format，并产出 calibration + validation plan。
version: 1.0.0
phase: 17
lesson: 09
tags: [quantization, awq, gptq, gguf, fp8, nvfp4, calibration]
---

给定 hardware（CPU / H100 / H200 / B200 / GB200，并带数量）、engine（llama.cpp / vLLM / TRT-LLM / SGLang）、model（size + task type — routine chat / reasoning / code / multi-LoRA）和 quality tolerance（可承受 HumanEval / MATH / MMLU 上 N-point drop），选择一种 quantization format，并产出 validation plan。

产出：

1. Format recommendation。以下之一：GGUF Q4_K_M、GGUF Q5_K_M、GPTQ-Int4 + Marlin、AWQ-Int4 + Marlin、FP8、NVFP4 + FP8 KV，或 stacked combo。按 decision tree 说明理由：CPU → GGUF；reasoning → FP8；vLLM 上 multi-LoRA → GPTQ；routine GPU chat → AWQ；Blackwell 已验证 → NVFP4。
2. Memory budget。报告 weights + KV cache（按报告的 concurrency × context）+ activations。确认它能放进目标 GPU，或指出 multi-GPU requirement。
3. Calibration plan。Dataset source（AWQ/GPTQ 使用 domain-matched；generic C4/WikiText 作为最后手段）。Sample count（domain 使用 500-2000）。Validation set（从 calibration pool 中 hold out 10%）。
4. Validation plan。与任务匹配的 eval set：code 用 HumanEval，reasoning 用 MATH/MMLU，chat 用 MT-Bench。Baseline BF16 vs quantized。如果 drop ≤ quality tolerance，则发布。
5. KV cache decision。与 weight quantization 分开。reasoning 推荐 FP8 KV；如果 Attention accuracy 边缘，则使用 BF16 KV；INT8 KV 只能在验证后使用。
6. Rollback path。磁盘上保留 BF16/FP8 weights；如果 production quality 退化，用 flag 切回。

Hard rejects：
- 在没有 eval-set validation 的情况下，为 reasoning-heavy workloads 推荐 NVFP4 weights。
- 对 domain models 使用 generic web data 做 calibration。始终使用 in-domain。
- 在 HBM budget 中忘记 KV cache。始终逐项列出。
- 声称 throughput numbers 却不说明 kernels（Marlin-AWQ vs plain AWQ 是 10x）。

Refusal rules：
- 如果 workload 天生 quality-marginal（open-ended creative generation、edge-case reasoning），拒绝 aggressive INT4。保持 FP8 或 BF16。
- 如果 engine 是 llama.cpp，拒绝 GGUF 以外的任何格式。格式匹配 engine 是基本要求。
- 如果用户不能运行 1,000-sample eval，拒绝。Production 中不要 blind quantization。

Output：一页 quantization pick，列出 chosen format、HBM budget、calibration plan、validation plan、KV cache decision 和 rollback path。以一个“what to measure next”段落结束，根据关键风险点点名 eval-set delta、peak concurrency 下的 KV cache pressure，或 real batch size 下的 throughput。
