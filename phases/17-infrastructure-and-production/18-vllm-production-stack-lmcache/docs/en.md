# 使用 LMCache KV Offloading 的 vLLM Production Stack

> vLLM 的 production-stack 是参考 Kubernetes 部署，把 router、engines 和 observability 连接在一起。LMCache 是 KV-offloading 层，它把 KV cache 从 GPU memory 中抽取出来，并在 queries 和 engines 之间复用（先是 CPU DRAM，然后是 disk/Ceph）。vLLM 0.11.0 KV Offloading Connector（2026 年 1 月）通过 Connector API（v0.9.0+）让这一过程变成 asynchronous 且 pluggable。Offload latency 不会直接面向用户。即使没有 shared prefixes，LMCache 也很有价值：当 GPU 用尽 KV slots 时，被 preempted 的 requests 可以从 CPU 恢复，而不是重新计算 prefill。基于 4 台 a3-highgpu-4g、共 16x H100（80GB HBM）的已发布 benchmark：当 KV cache 超过 HBM 时，native CPU offload 和 LMCache 都会显著提升 throughput；在 KV footprint 较低时，所有配置都与 baseline 相当，只带来很小 overhead。

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**前置要求：** Phase 17 · 04 (vLLM Serving Internals), Phase 17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## 学习目标
- 画出 vLLM production-stack 各层：router、engines、KV offload、observability。
- 解释 KV Offloading Connector API（v0.9.0+），以及 0.11.0 asynchronous path 如何隐藏 offload latency。
- 量化 LMCache CPU-DRAM 何时有帮助（KV > HBM），以及何时只增加 overhead（KV 小到足以放入 HBM）。
- 根据 deployment constraints，在 native vLLM CPU offload 和 LMCache connector 之间做选择。

## 问题
你的 vLLM serving 在 concurrency 上升时显示 GPU HBM 达到 100%，并出现 preemption events。Requests 被 evict、requeue，然后同一个 2K-token prompt 在一分钟内被重新 prefill 四次。GPU compute 被花在重复的 prefills 上；goodput 远低于 raw throughput。

增加更多 GPU 的成本是线性的。增加更多 HBM 不可能。但 CPU DRAM 很便宜，一个 socket 就有 512 GB+，latency 比 HBM 差几个数量级，但对“临时保温”的 KV cache 来说足够。

LMCache 会把 KV cache 抽取到 CPU DRAM，让 preempted requests 快速恢复，并让 engines 之间的 repeated prefixes 共享 cache，而不需要每个 engine 都重新 prefill。

## 概念
### vLLM production-stack

`github.com/vllm-project/production-stack` 是参考 Kubernetes 部署：

- **Router** — cache-aware（Phase 17 · 11）。消费 KV events。
- **Engines** — vLLM workers。每个 GPU 一个，或每个 TP/PP group 一个。
- **KV cache offload** — LMCache deployment 或 native connector。
- **Observability** — Prometheus scrape、Grafana dashboards、OTel traces。
- **Control plane** — service discovery、config、rolling updates。

以 Helm chart + operator 形式交付。

### KV Offloading Connector API (v0.9.0+)

vLLM 0.9.0 引入了 Connector API，用于 pluggable KV cache backends。你的 engine 会把 blocks offload 到 connector；connector 存储它们（RAM、disk、object storage、LMCache）。当 request 需要某个 block 时，connector 会把它加载回来。

vLLM 0.11.0（2026 年 1 月）增加了 asynchronous offload path：在常见情况下，offload 可以在后台发生，因此 engine 不会被它阻塞。End-to-end latency 和 throughput 仍然取决于 workload shape、KV cache hit rate 和 system pressure；vLLM 自己的说明也指出，custom-kernel offload 在 low hit rates 下可能降低 throughput，并且 async scheduling 与 speculative decoding 存在已知的 interaction issues。

### Native CPU offload vs LMCache

**Native vLLM CPU offload**：engine-local。把 KV blocks 存储在 host RAM 中。实现快，零 network hop。不能跨 engines。

**LMCache connector**：cluster-scale。把 blocks 存储在 shared LMCache server（CPU DRAM + Ceph/S3 tier）中。任何 engine 都可以访问 blocks。已有 16x H100 benchmarks 发布。

当单个 engine 有 HBM pressure 时选择 native。当多个 engines 共享 prefixes 时选择 LMCache（带 common system prompts 的 RAG、带 shared templates 的 multi-tenant）。

### Benchmark behavior

分布在 4 台 a3-highgpu-4g 上的 16x H100（80 GB HBM）测试：

- Low KV footprint（short prompts、low concurrency）：所有配置都与 baseline 相当，LMCache 增加约 3-5% overhead。
- Moderate footprint：LMCache 开始在 engines 之间的 prefix reuse 上带来帮助。
- KV 超过 HBM：native CPU offload 和 LMCache 都会显著提升 throughput；LMCache 增益更大，因为有 cross-engine sharing。

### When LMCache is decisive

- 多个 tenants 共享 system prompts 的 multi-tenant serving。
- document chunks 在 queries 之间重复的 RAG。
- 同一 base 上的 fine-tuned variants（LoRA），其中 base-model KV reuse 会减少重复工作。
- Preemption-heavy workloads：从 CPU restore 比重新 prefill 更便宜。

### When NOT to enable

- HBM pressure 很小：你会付出 overhead 却没有收益。
- Short contexts（<1K tokens）：transfer time > 重新 prefill。
- Single-tenant single-prompt workload：没有可捕获的 reuse。

### Integration with disaggregated serving

Phase 17 · 17 disaggregated serving + LMCache 会叠加增益：从 prefill pool 到 decode pool 的 KV transfers 如果未被使用，会落入 LMCache；后续 queries 会从 LMCache 拉取。Phase 17 · 11 cache-aware router 可以把请求路由到 local cache 或 LMCache-shared cache 匹配的 engine。

### Numbers you should remember

- vLLM 0.9.0：Connector API 发布。
- vLLM 0.11.0（2026 年 1 月）：asynchronous offload path；end-to-end latency impact 取决于 workload、KV hit rate 和 system pressure（不是绝对保证）。
- 16x H100 benchmark：当 KV footprint 超过 HBM 时，LMCache 有帮助。
- 小 HBM pressure：有 3-5% overhead 且无收益。

## 使用它
`code/main.py` 会模拟一个有无 LMCache 的 preemption-heavy workload。报告避免的 re-prefills、throughput gain 和 break-even HBM utilization。

## 交付它
本课会产出 `outputs/skill-vllm-stack-decider.md`。给定 workload shape 和 vLLM deployment，判断选择 native、LMCache，还是两者都不选。

## 练习
1. 运行 `code/main.py`。LMCache 从什么 HBM utilization 开始划算？
2. 某个 tenant 每小时 200 个 queries 共享一个 6K-token system prompt。计算每个 tenant 预期的 LMCache savings。
3. LMCache server 是 single point of failure。设计 HA strategy（replicas、fallback to native）。
4. LMCache 在 spinning disk 上存到 Ceph。对于 70B FP8 下 4K-token KV（500 MB），read time 相比 re-prefill 如何？
5. 论证 vLLM 0.11.0 asynchronous path 是否“免费”：overhead 藏在哪里？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | “参考部署” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的 pluggable KV store interface |
| Native CPU offload | “engine-local spill” | 把 KV 存到同一 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | CPU DRAM + disk 上的 cross-engine KV cache server |
| 0.11.0 async | “non-blocking offload” | 隐藏在 engine stream 后面的 offload |
| Preemption | “evict to make room” | HBM 满时的 KV cache shuffle |
| Prefix reuse | “same system prompt” | 多个 queries 共享开头；cache hit |
| Ceph tier | “disk tier” | cache hierarchy 中 DRAM 下方的 durable storage |

## 延伸阅读
- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) — Helm chart + operator。
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) — Connector implementation。
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) — asynchronous path details。
