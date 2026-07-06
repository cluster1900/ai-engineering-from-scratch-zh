---
name: speculative-tuning
description: Profile 一个 decode 工作负载，并为 speculative decoding 选择 draft model、draft length K、temperature gate 和 fallback policy。
version: 1.0.0
phase: 10
lesson: 25
tags: [speculative-decoding, draft-model, alpha, throughput, inference, decode-latency]
---

给定 target model（size、family、tokenizer）、工作负载 telemetry（task mix、prompt-vs-decode token ratio、p50/p99 decode latency、accelerator 和 HBM headroom、average batch size、sampling temperature distribution），以及可用的 draft checkpoints，输出：

1. Draft choice。从 same-family small（Llama-3.2-1B for Llama-70B）、distilled draft（Qwen3-0.6B-spec）、接到 target 上的 Medusa heads 中选择；如果没有 draft 的 FLOP cost ratio 低于 30 percent，则选择 "no spec decode"。逐字节确认 tokenizer 与 target 匹配；拒绝不匹配的 tokenizer。
2. Draft length K。最大化 E[tokens] / (1 + K x c)，其中 c 是 draft-to-target cost ratio。使用在 5_000 tokens 的 in-distribution data 上进行 calibration run 得到的 measured alpha，展示 K 为 2、3、4、5、6 时的计算过程。chat 默认 K=4，code 默认 K=6，高 temperature creative writing 默认 K=2。
3. Temperature gate。设置一个 temperature threshold，高于该阈值时禁用 spec decode。默认 0.8；如果 calibration 显示 alpha 更早崩塌，则降到 0.6。拒绝任何依赖 per-request inspection 且会增加超过 50 microseconds 的 temperature gate。
4. Tree budget。如果 serving stack 支持 tree drafting，在 batch 低于 8 时选择小型固定 tree（depth 2，branch 3-2）；batch 超过 32 时使用 flat chain。说明 verifier 的 KV scratch size（bytes），并确认它适配 HBM headroom。
5. Fallback policy。指定 metric（最近 1_000 次 verifies 的 sliding-window measured alpha）和 threshold（alpha 低于 0.4），达到该条件时 server 会对该 request stream 回退到 plain autoregressive decode。包括 fallback decision 的 per-request lifetime。

当 batch size 高于 verifier 变为 compute-bound 的点时，拒绝 spec decode。超过该点后，speculator 本应吸收的 unused FLOPs 已不存在；throughput 会下降。对任何 measured alpha 低于 0.4 的 task family 拒绝 spec decode；draft overhead 占主导，wall-clock latency 会变差。拒绝未在 held-out 1_000-token sample 上针对 target 验证过的 draft：未经验证的 draft 是静默的 KL drift。

示例输入: "8xH100 上的 Llama-3.3-70B，chat workload，batch 16，p50 decode 28 ms，p99 60 ms，temperature distribution mean 0.4 / max 1.2，calibration 显示 chat 上 alpha 0.78，code 上 0.61。"

示例输出:
- Draft: Llama-3.2-1B-Instruct-spec。相同 tokenizer，相同 family，ratio c 约为 0.03。
- K: 4。E[tokens/verify] = 3.4 chat, 2.5 code。K=5 增加 0.1 token chat，但要额外支付 0.03 c；拒绝。
- Temperature gate: 0.8。高于 0.8 时，alpha 在 calibration set 上降到 0.45 以下。
- Tree budget: depth 2 branch (3, 2)。batch 16 时 KV scratch 480 MB，能够适配。
- Fallback: 最近 1_000 次 verifies 的 sliding-window alpha 低于 0.40 时，对该 stream 禁用 spec decode 30 s，然后再次 probe。
