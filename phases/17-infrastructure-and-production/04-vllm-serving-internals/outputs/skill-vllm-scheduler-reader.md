---
name: vllm-scheduler-reader
description: 通过读取 scheduler 层级参数，诊断 vLLM serving 配置，并识别 PagedAttention、continuous batching 和 chunked prefill 中哪一个是瓶颈。
version: 1.0.0
phase: 17
lesson: 04
tags: [vllm, paged-attention, continuous-batching, chunked-prefill, serving, scheduler]
---

给定一个 vLLM serving 配置（model、dtype、hardware、`--gpu-memory-utilization`、`--max-num-batched-tokens`、`--enable-chunked-prefill`、`--speculative-model` 或 `--speculative-config`、max concurrency，以及观测到的指标集：TTFT mean/P99、ITL mean/P99、throughput tok/s），产出一份 scheduler 层级诊断。

产出：

1. 配置读取。对每个 flag，说明它控制的 scheduler 行为以及 2026 默认值。标记任何设置为非默认值的 flag，并指出原因。
2. 瓶颈识别。将瓶颈分类为以下之一：PagedAttention 配置不足（KV block starvation）、continuous-batching 停滞（WAITING queue 增长）、chunked-prefill 尺寸不当（TTFT tail spike）、decode compute-bound（ITL floor），或 HBM-bound（无法容纳 batch）。用报告的指标进行论证。
3. 参数建议。给出具体、有顺序的行动：要切换哪个 flag、要尝试哪个值、要观察哪个指标。在耗尽 scheduler 层级调优之前，不要建议“try more GPUs”。
4. 兼容性检查。专门针对 vLLM v0.18.0：将 `--enable-chunked-prefill` + `--speculative-model` 组合标记为硬性不兼容。如果两者都需要，建议使用 V1 中有文档说明的例外：N-gram GPU speculative decoding。
5. 接下来读什么。根据诊断暴露的问题，指向 vLLM v0.18.0 release notes、PagedAttention paper，或 Aleksa Gordic V1 scheduler walkthrough 之一。

硬性拒绝：
- 在没有四个核心指标（TTFT、ITL、throughput、concurrency）的情况下进行诊断。拒绝并要求提供指标集。
- 在未检查 speculative-decoding 配置的情况下推荐 `--enable-chunked-prefill`。
- 将 `DCGM_FI_DEV_GPU_UTIL` 视为扩展信号。vLLM 会预分配 KV；duty-cycle 数字具有误导性。

拒绝规则：
- 如果报告的 throughput 在 H100 上低于 100 tok/s，瓶颈很可能不在 vLLM；应检查 client 侧 Tokenizer、Python GIL，或请求级串行化。
- 如果 `--gpu-memory-utilization` 设置低于 0.7，拒绝继续调优；operator 选择把 HBM 留在台面上，修复方式是在切换 scheduler flag 之前先提高上限。
- 如果 operator 要求 draft-model speculation 上的 speculative-decoding + chunked-prefill 配方，拒绝并指出 v0.18.0 不兼容。改为指向 Phase 17 · 05 中的 EAGLE-3。

输出：一页 scheduler 诊断，列出 flags、瓶颈、有序建议、兼容性说明，以及下一步阅读指针。结尾用一段“接下来要测量什么”，根据识别出的瓶颈，点名 P99 ITL、block allocation rate，或 WAITING queue depth 之一。
