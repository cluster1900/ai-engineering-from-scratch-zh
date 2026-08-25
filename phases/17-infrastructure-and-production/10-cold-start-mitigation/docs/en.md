# Serverless LLMs 的 Cold Start Mitigation

> 一个 20 GB model image 从 cold 到 serving 需要 5-10 分钟（7B）到 20+ 分钟（70B）。在真正的 serverless 世界里，这不是 warm-up，而是 outage。Mitigations 作用在五层：pre-seeded node images（AWS 上的 Bottlerocket、dual-volume arch）、model streaming（NVIDIA Run:ai Model Streamer，vLLM 原生支持）、GPU memory snapshots（Modal checkpoints，restart 最多快 10x）、warm pools（`min_workers=1`）、tiered loading（ServerlessLLM 的 NVMe→DRAM→HBM pipeline，latency 降低 10-200x），以及传输 input Token（KB）而不是 KV cache（GB）的 live migration。Modal 发布的 2-4s cold starts 是下限；Baseten 默认 5-10s，配合 pre-warming 可达 sub-second。本课教你测量、预算并叠加这五层。

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：** Phase 17 · 02 (Inference Platform Economics), Phase 17 · 03 (GPU Autoscaling)
**Time:** ~60 minutes

## 学习目标
- 列举 cold-start mitigation 的五层，并在每一层说出一个 tool 或 pattern。
- 将 70B model 的总 cold-start time 计算为 (node provision) + (weights download) + (weights load into HBM) + (engine init) 之和。
- 解释为什么 live migration 传输 input Token（KB）而不是 KV cache（GB），以及代价是什么（recomputation）。
- 说出 warm-pool trade-off（为 idle GPU 付费，或接受 cold-start tail），以及 `min_workers > 0` 变成必需的 SLA threshold。

## 问题
你的 serverless LLM endpoint 在夜间 scale to zero。早上 8 点流量激增。第一个 request 需要等待：

1. Karpenter provision 一个 GPU node：45-60s。
2. Container pull 一个带 weights 的 30 GB image：120-300s。
3. Engine 将 weights load 到 HBM：45-120s，取决于 model size 和 storage speed。
4. vLLM 或 TRT-LLM 初始化 CUDA graphs、KV cache pool、Tokenizer：10-30s。

总计：220-510s（大约 3-8 分钟）后才会返回一个 Token。你的 SLA 是 2s。你发布一个 warm-pool（`min_workers=1`），问题似乎消失了，但现在你要为一个 idle GPU 24x7 付费。如果你的 service 有 5 个 products，每个都有一个 warm replica，那就是 5 × 24 × 30 = 3,600 GPU-hours/month，无论是否有一个用户调用过。

Cold-start mitigation 是在接近 always-on latency 的同时保留 serverless economics 的方法。

## 概念
### Layer 1 — 预置节点镜像（Bottlerocket）

在 AWS 上，Bottlerocket 的 dual-volume architecture 将 OS 与 data 分离。用已 pre-pulled 的 container image 对 data volume 做 snapshot；在你的 `EC2NodeClass` 中引用 snapshot ID。新 node 启动时 weights 已经在 local NVMe 上，步骤 2 和步骤 3 的一部分会消失。它与 Karpenter 原生配合。典型节省：大型 models 每次 cold start 节省 2-4 分钟。

GCP 上的等价方案：带有 pre-baked container layers 的 custom VM images。Azure 上：采用相同 pattern 的 managed disk snapshots。

### Layer 2 — model streaming (Run:ai Model Streamer)

不是等完整 file load 完再回答第一个 request，而是逐层将 weights stream 到 GPU memory，并在第一个 transformer block 常驻后立即开始 processing。NVIDIA Run:ai Model Streamer 在 vLLM 2026 中原生提供。支持 S3、GCS 和 local NVMe。通过将 I/O 与 compute setup 重叠，大型 models 的 weight-load time 大约减半。

### Layer 3 — GPU memory snapshots (Modal)

Modal 在首次 load 后对 GPU state（weights、CUDA graphs、KV cache region）做 checkpoint。后续 restarts 直接 deserialize 到 HBM，比重新初始化快 10x。这最接近“在 2 秒内 boot 一个 warm GPU”。Trade-off：snapshots 绑定 per-GPU-topology，所以如果 Karpenter 将你迁移到不同 SKU，你需要重新 checkpoint。

### Layer 4 — warm pools (min_workers=1)

最简单的 mitigation：保持一个 replica 始终 ready。Cost 是一个 GPU 的 hourly rate 24x7。对小 models 来说这个 arithmetic 很残酷（你每小时支付 $0.85-$1.50 来避免 30s cold start），对大 models 则更友好（每小时支付 $4 来避免 5 分钟 cold start）。warm pools 变得必需的 SLA threshold：通常是 70B+ model 上 TTFT P99 < 60s。

### Layer 5 — tiered loading (ServerlessLLM)

ServerlessLLM 将 storage 视为一个 hierarchy：NVMe（快但大）、DRAM（中等但可分层）、HBM（小但即时）。Weights 预先 load 到 DRAM；按需 load 到 HBM。Paper 报告，相比 naive disk-to-HBM，cold loads 的 latency 降低 10-200x。Production adoption 仍处早期，但已经存在与 vLLM 的 integrations。

### Layer 6 — live migration (bonus pattern)

当某个 node 不可用时（spot eviction、node drain），传统 pattern 是 cold-start 另一个 replica 并 drain request queue。Live migration 将 input Token（kilobytes）移动到已 load model 的 destination，并在 destination 上 recompute KV cache。Recomputation 比通过网络传输 GB 级 KV cache 更便宜。适用于 disaggregated deployments。

### The warm-pool math

对于 P99 TTFT SLA 为 2s 的 service，问题不是“要不要 warm pool”，而是“需要多少 warm replicas，以及哪些 paths 获得它们”。

- High-value interactive paths（live chat、voice agent）：`min_workers=1-2`。
- Background batch paths（nightly classification）：接受 scale-to-zero，可容忍 5-10 分钟 cold start。
- Premium tier：每个 tenant 使用 `min_workers` 和 dedicated capacity。

### Measure before optimizing

全新 node 上 70B model 的 cold-start anatomy（示例）：

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### Numbers you should remember

- Modal cold start：2-4s（使用 GPU snapshots）。
- Baseten 默认 cold start：5-10s；使用 pre-warming 时 sub-second。
- 原始 70B cold start：3-8 分钟。
- Run:ai Model Streamer：~2x weight-load speedup。
- ServerlessLLM tiered loading：latency 降低 10-200x（paper numbers）。

```figure
cold-start-pipeline
```

## 使用它
`code/main.py` 对带有和不带各类 mitigation 的 cold-start path 建模。报告 total cold-start time、warm-pool cost，以及 warm pool 回本所需的 break-even request rate。

## 交付它
本课会产出 `outputs/skill-cold-start-planner.md`。给定 SLA、model size 和 traffic shape，选择要叠加哪些 mitigations。

## 练习
1. 运行 `code/main.py`。计算 break-even request rate：超过这个速率后，warm replica 会比因 SLO 下额外 request drops 而支付 cold-start tax 更便宜。
2. 你部署一个 13B model，P99 TTFT SLA 为 3s。选择能达成它的最小 mitigation stack（最少 layers）。
3. Bottlerocket pre-seeding 消除了 image pull，但 weights 仍需从 snapshot load 到 HBM。如果 snapshot-backed NVMe 的读取速度为 7 GB/s，计算 70B model 的 wall-clock。
4. 你的 serverless provider 提供 GPU snapshots（Modal），但你的团队拒绝，理由是“snapshots 会泄露 PII”。论证双方观点：现实风险是什么，mitigation 是什么（ephemeral snapshots、encryption、namespace isolation）？
5. 设计一个 tiered warm-pool policy：paid users、trial users 和 batch workloads 分别需要多少 warm replicas？展示计算过程。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) — Modal 发布的 benchmarks 和 checkpoint architecture。
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) — pre-seeded data volume snapshot pattern。
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) — 将 weights load 与 compute setup 重叠。
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/) — pre-warming playbook。
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) — tiered loading design。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) — disaggregated deployments 的 live migration。
