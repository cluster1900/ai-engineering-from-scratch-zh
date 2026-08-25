# Kubernetes 上的 GPU 自动扩缩容 — Karpenter、KAI Scheduler、Gang Scheduling

> 是三个层级，而不是一个。Karpenter 动态配置 node（不到一分钟，比 Cluster Autoscaler 快 40%）。KAI Scheduler 处理 gang scheduling、topology awareness 和 hierarchical queues，能够避免 8 个资源只分配到 7 个的局部分配陷阱：7 个 node 因缺少一块 GPU 而空等并持续产生费用。应用层 autoscaler（NVIDIA Dynamo Planner、llm-d Workload Variant Autoscaler）根据 Inference 专用信号进行扩缩容，例如 queue depth 和 KV cache utilization，而不是 CPU/DCGM duty cycle。经典的 HPA 陷阱在于，`DCGM_FI_DEV_GPU_UTIL` 测量的是 duty cycle：100% 既可能代表 10 个 request，也可能代表 100 个。vLLM 会预先分配 KV cache memory，因此 memory 永远不会触发缩容。本课将教你组合这三个层级，并避开默认的 Karpenter `WhenEmptyOrUnderutilized` 政策，该政策会在 Inference 进行期间终止正在运行的 GPU job。

**Type:** Learn
**Languages:** Python（stdlib，简化的 queue-depth autoscaler 模拟器）
**Prerequisites:** Phase 17 · 02（Inference Platform Economics）、Phase 17 · 04（Serving Engine Internals）
**Time:** ~75 分钟

## 学习目标

- 绘制三个 autoscaling 层级（node provisioning、gang scheduling、application-level），并说出每个层级使用的 Tool。
- 解释为什么 `DCGM_FI_DEV_GPU_UTIL` 不适合作为 vLLM 的 HPA 信号，并说出两个替代信号（queue depth、KV cache utilization）。
- 描述 gang scheduling，以及 KAI Scheduler 能够避免的局部分配失败模式（8 块 GPU 中有 7 块处于闲置状态）。
- 说出会终止正在运行的 GPU job 的 Karpenter consolidation policy（`WhenEmptyOrUnderutilized`），并说明 2026 年的安全替代方案。

## 问题

你的团队在 Kubernetes 上交付了一个 LLM serving 服务。你将 HPA 配置为使用 `DCGM_FI_DEV_GPU_UTIL` 作为信号。工作时间内，该服务的利用率固定在 100%。HPA 从不扩容，因为它已经认为资源满载。你手动增加一个 replica，TTFT 随即下降，但 HPA 仍然不扩容。这个信号误导了你。

与此同时，你使用 Cluster Autoscaler 管理 node。凌晨 2 点，一个包含 1M Token 的 Prompt 到达；集群花费 3 分钟配置一个 node，request 最终超时。

另一个问题是，你部署了一个需要跨 2 个 node 使用 8 块 GPU 的 70B Model。集群有 7 块空闲 GPU，另外 1 块 GPU 资源分散在 3 个 node 上。Cluster Autoscaler 为缺少的 1 块 GPU 配置一个 node。7 个 node 空等 4 分钟并持续产生费用，直到 Kubernetes 启动最后一块 GPU。

三个层级，三种不同的失败模式。2026 年的 GPU-aware autoscaling 并不是“打开 HPA”，而是组合 node provisioning、gang scheduling 和基于应用信号的 autoscaling。

## 概念

### 第 1 层 — node provisioning（Karpenter）

Karpenter 监视 pending pod，并在约 45-60 秒内配置 node（对于 GPU node，Cluster Autoscaler 通常需要 90-120 秒）。它会根据 `NodePool` 约束动态选择 instance type。如果你的 pod 需要 8 块 H100，而集群中没有匹配的 node，Karpenter 会直接配置一个，而不是扩展现有 group。

**Consolidation 陷阱**：Karpenter 默认的 `consolidationPolicy: WhenEmptyOrUnderutilized` 对 GPU pool 很危险。它会终止正在运行的 GPU node，以便将 pod 迁移到更便宜且规模更合适的 instance。对于 Inference 工作负载，这意味着驱逐正在处理 request 的 pod，并在新 node 上重新加载 70B Model。结果是数分钟的容量损失和 request 失败。

GPU pool 的安全设置：

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

这允许 Karpenter 在 node 真正空闲一小时后执行 consolidation，但绝不会驱逐正在运行的 job。

### 第 2 层 — gang scheduling（KAI Scheduler）

KAI Scheduler（项目原名为“Karp”，后来更名）处理默认 kube-scheduler 无法完成的任务：

**Gang scheduling** — 全部调度或全部不调度。需要 8 块 GPU 的分布式 Inference pod 要么同时启动全部 8 个，要么一个都不启动。如果没有这一机制，就会陷入局部分配陷阱：8 个 pod 中有 7 个启动，之后无限等待并持续产生费用。

**Topology awareness** — 了解哪些 GPU 共享 NVLink、哪些位于同一个 rack，以及哪些 GPU 之间存在 InfiniBand。随后据此放置 pod。DeepSeek-V3 67B tensor-parallel 工作负载必须位于同一个 NVLink domain 中；KAI Scheduler 会遵守这一要求。

**Hierarchical queues** — 多个团队通过优先级和 quota 竞争同一个 GPU pool。只有在优先级规则允许的情况下，Team A 突发的 production 需求才会抢占 Team B 的 Training job。

KAI 作为 secondary scheduler 与 kube-scheduler 一同部署；你需要为工作负载添加 annotation 以使用它。Ray 和 vLLM production-stack 均提供集成。

### 第 3 层 — 应用层信号

**HPA 陷阱**：`DCGM_FI_DEV_GPU_UTIL` 是 duty-cycle metric，它测量 GPU 在每个采样间隔内是否正在工作。100% 利用率既可能代表 10 个并发 request，也可能代表 100 个；无论哪种情况，GPU 都处于忙碌状态。根据 duty cycle 扩缩容等同于盲目扩缩容。

更糟的是，vLLM 和类似 engine 会预先分配 KV cache memory，最高达到 `--gpu-memory-utilization` 指定的比例。即使只有一个 request，memory 用量也会保持在接近 90% 的水平。基于 memory 的 HPA 永远不会缩容。

**2026 年的替代信号**：

- Queue depth（等待 prefill 的 request 数量）。
- KV cache utilization（已分配给活跃 sequence 的 block 比例）。
- 每个 replica 的 P99 TTFT（你的 SLA 信号）。
- Goodput（每秒满足全部 SLO 的 request 数量）。

NVIDIA Dynamo Planner 和 llm-d Workload Variant Autoscaler 会使用这些信号并扩缩 replica。对于 LLM serving，它们会完全取代 HPA。

### 何时使用什么

| 扩缩决策 | Tool |
|----------------|------|
| 添加/移除 node | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于 queue depth 的自定义 HPA） |
| 选择 GPU 类型 | Karpenter NodePool |
| 抢占低优先级任务 | KAI Scheduler queues |

### 分离式 prefill/decode 让一切更加复杂

如果你运行分离式 prefill/decode（Phase 17 · 17），就会有两类 pod，且两者的扩缩触发器不同：prefill pod 根据 queue depth 扩缩，decode pod 根据 KV cache pressure 扩缩。llm-d 将二者公开为独立的 `Services`，并为每种角色配置单独的 HPA。不要尝试在二者前方使用同一个 HPA。

### Cold start 在这里同样重要

Cold-start 缓解（Phase 17 · 10）会使 node provisioning 时间直接影响用户体验。Karpenter 的 45-60 秒预热时间，加上 20GB Model 加载和 engine 初始化，意味着从零开始处理 request 需要 2-5 分钟。对于 SLO 关键路径，应保留 warm pool（`min_workers=1`），或者在应用层使用 Modal 风格的 checkpointing。

### 你应记住的数字

- Karpenter node provisioning：约 45-60 秒；Cluster Autoscaler 约 90-120 秒（GPU node）。
- KAI Scheduler 可避免局部分配浪费，即 8 个资源只分配到 7 个的陷阱。
- 将 `DCGM_FI_DEV_GPU_UTIL` 用作 HPA 信号：不可行；应使用 queue depth 或 KV utilization。
- Karpenter `WhenEmptyOrUnderutilized`：会终止正在运行的 GPU job。对于 Inference，应使用 `WhenEmpty + consolidateAfter: 1h`。

```figure
autoscaling
```

## 使用它

`code/main.py` 会在具有突发流量的 GPU 工作负载上模拟一个三层 autoscaler。它比较朴素 HPA（duty cycle）、queue-depth HPA 和使用 KAI gang scheduling 的扩缩方案，并报告未满足的 request 数量、GPU 闲置分钟数以及综合得分。

## 交付它

本课会生成 `outputs/skill-gpu-autoscaler-plan.md`。给定集群 topology、工作负载形态和 SLO，它会设计一个三层 autoscaling 方案。

## 练习

1. 运行 `code/main.py`。在突发工作负载下，朴素 duty-cycle HPA 会丢弃多少个本可被 queue-depth HPA 处理的 request？这一差异来自哪里？
2. 为一个在 H100 SXM5 上运行 Llama 3.3 70B FP8 的集群设计 Karpenter NodePool。指定 `capacity-type`、`disruption.consolidationPolicy`、`consolidateAfter`，以及一个用于阻止非 GPU 工作负载进入这些 node 的 taint。
3. 你的团队报告 deployment 卡在 Pending 状态，因为“有可用 GPU，但 pod 无法调度”。进行诊断：这是 Karpenter、kube-scheduler 还是 KAI Scheduler 的问题？哪些 metric 可以确认？
4. 为分离式 prefill pod 选择一个 autoscaling 信号，再为 decode pod 选择另一个信号。说明两种选择的理由。
5. 计算 `WhenEmptyOrUnderutilized` consolidation 陷阱对一个 24x7 production 服务造成的成本。该服务平均每天发生 60 次会丢弃 request 的事件，且 P99 TTFT > 10s。

## 关键术语

| 术语 | 人们通常怎么说 | 它的实际含义 |
|------|----------------|------------------------|
| Karpenter | “node provisioner” | Kubernetes node autoscaler；不到一分钟即可完成 provisioning |
| Cluster Autoscaler | “旧 autoscaler” | Kubernetes node autoscaler 的前身；速度更慢，基于 group |
| KAI Scheduler | “GPU scheduler” | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | “全有或全无” | 以原子方式调度 N 个 pod，或者将它们全部推迟 |
| Topology awareness | “感知 rack” | 根据 NVLink/IB/rack 位置放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | “GPU 利用率” | Duty-cycle metric；不是 LLM 的扩缩信号 |
| Queue depth | “等待中的 request” | 适合 prefill-bound 扩缩的 HPA 信号 |
| KV cache utilization | “memory pressure” | 适合 decode-bound 扩缩的 HPA 信号 |
| Consolidation | “Karpenter consolidation” | 为迁移到更便宜的 instance type 而终止 node |
| `WhenEmpty + 1h` | “安全的 consolidation” | 不会驱逐正在运行的 GPU job 的政策 |

## 延伸阅读

- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) — 设计文档和配置示例。
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) — consolidation policy 语义和 GPU 安全默认值。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) — Dynamo Planner 扩缩信号。
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html) — Ray 集成模式。
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) — 针对托管 Kubernetes 的指导。
- [llm-d GitHub](https://github.com/llm-d/llm-d) — Workload Variant Autoscaler 设计。
