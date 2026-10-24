---
id: gpu-kubernetes
title: GPU Autoscaling on Kubernetes
code: GP
subtitle: 用 Karpenter 管节点，用 KAI Scheduler 做 gang 调度，按队列深度扩副本，缓存感知路由，事件故事板。
hue: 212
sources: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes, phases/17-infrastructure-and-production/10-cold-start-mitigation, phases/17-infrastructure-and-production/11-multi-region-kv-locality, projects/kubernetes-event-storyboard
source_hash: 70134a16f41f0991
---

## 任务
type: task-table
from: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes, phases/17-infrastructure-and-production/10-cold-start-mitigation, phases/17-infrastructure-and-production/11-multi-region-kv-locality

| 任务 | 代码 |
|---|---|
| 阻止 GPU 作业被驱逐 | `consolidationPolicy: WhenEmpty` |
| 空节点一小时后合并 | `consolidateAfter: 1h` |
| 避开驱逐默认值 | 不用 `WhenEmptyOrUnderutilized` |
| 不要按 duty cycle 扩缩 | 不用 `DCGM_FI_DEV_GPU_UTIL` |
| 保持一个副本就绪 | `min_workers=1` |
| 节点启动时权重已在 NVMe 上 | `EC2NodeClass` 中的快照 ID |
| 按已缓存前缀路由 | `kv.cache.block_added` |
| 比较三种扩缩器 | `simulate(strategy, reqs)` |

## GPU 节点池的安全中断
type: annotated-code
lang: yaml
from: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/docs/en.md

```yaml
# Karpenter NodePool, GPU pool
disruption:
  consolidationPolicy: WhenEmpty  # never evict a running job
  consolidateAfter: 1h  # consolidate empty nodes after an hour
```

## 三层自动扩缩
type: architecture
from: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes

```arch
node | pend | 1,1 | Pending pods | need 8 H100s | client
node | karp | 2,1 | Karpenter | NodePool, ~45-60s | process
node | node | 3,1 | GPU node | NVLink domain | gpu
node | kai | 2,2 | KAI Scheduler | gang, topology, queues | process
node | app | 1,3 | Dynamo Planner / llm-d WVA | replicas | process
node | sig | 2,3 | Signals | queue depth, KV utilization | queue
node | vllm | 3,3 | vLLM replicas | serve requests | model
edge | pend | karp | provision
edge | karp | node | add node
edge | pend | kai | all or nothing
edge | kai | node | place
edge | sig | app | consume
edge | app | vllm | scale
edge | vllm | sig | publish
```

## main.py 中的扩缩策略
type: comparison
span: 2
from: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/code/main.py, phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/docs/en.md

| 维度 | DUTY_CYCLE | QUEUE_DEPTH | KAI_GANG |
|---|---|---|---|
| 信号 | `DCGM_FI_DEV_GPU_UTIL` | `len(queue)` | `len(queue)` |
| 何时扩容 | `util > TARGET_GPU_UTIL` | `qd > 5` | `qd > 3` |
| 扩容步长 | `replicas_target += 1` | `max(1, qd // 5)` | `max(2, qd // 3)` |
| 何时缩容 | `util < 20` | `qd == 0` | `qd == 0` |
| 结果 | 丢弃请求 | 对积压作出反应 | 避免部分分配导致的停滞 |

## 模拟器常量
type: defaults
from: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/code/main.py, phases/17-infrastructure-and-production/11-multi-region-kv-locality/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `NODE_PROVISION_SEC` | 50 | Karpenter 约 45-60s |
| `CLUSTER_AUTOSCALER_SEC` | 110 | 较慢的对照 |
| `MODEL_LOAD_SEC` | 45 | 70B 权重加引擎初始化 |
| `HPA_TICK_SEC` | 15 | 控制循环间隔 |
| `TARGET_GPU_UTIL` | 70 | duty cycle 目标 |
| `MAX_REPLICAS` | 16 | 副本上限 |
| `CACHE_HIT_MS` | 80 | 前缀已驻留时的 TTFT |
| `CACHE_MISS_MS` | 800 | 冷 prefill 时的 TTFT |

## 缓存感知路由
type: flow
from: phases/17-infrastructure-and-production/11-multi-region-kv-locality

1. **Router**：对前缀做哈希，例如前 512 个 token。
2. **副本**：在分配和驱逐块时发布 KV-cache 事件。
3. **vLLM Router**：把 `kv.cache.block_added` 索引为前缀哈希到副本的映射。
4. **Router**：把请求发往命中的副本。
5. **Router**：没有命中时，选队列深度最小的。
6. **全局路由器**：把 RTT 加到命中成本上。成本超过 `CACHE_MISS_MS` 时留在本地。
7. **数据驻留**：先按驻留边界划分路由器，再考虑缓存。

## 故障排查
type: troubleshooting
from: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes, phases/17-infrastructure-and-production/11-multi-region-kv-locality, phases/17-infrastructure-and-production/10-cold-start-mitigation

| 症状 | 原因 | 修复 |
|---|---|---|
| 在 100% 时 HPA 从不扩容 | duty cycle 掩盖了 10 个与 100 个请求的差别 | 按队列深度或 KV 利用率扩缩 |
| 内存 HPA 从不缩容 | vLLM 预先分配 KV cache | 不再把内存作为信号 |
| 8 个 pod 中 7 个在等待并烧钱 | 没有 gang 调度 | KAI Scheduler，全有或全无 |
| 运行中的推理被驱逐 | `WhenEmptyOrUnderutilized` | `WhenEmpty` 加 `consolidateAfter: 1h` |
| 凌晨 2 点请求超时 | 节点创建花了 3 分钟 | Karpenter 加预热池 |
| 缓存命中率降到 8% | 轮询负载均衡 | 缓存感知路由器 |
| 副本在灾备中拒绝启动 | tokenizer 或量化配置未同步 | 备份三文件灾备清单 |
| prefill 与 decode 共用一个 HPA | 两类 pod，两种触发条件 | 按角色在各自的 `Services` 上设 HPA |

## 事件故事板项目
type: annotated-code
lang: bash
span: 2
from: projects/kubernetes-event-storyboard/README.md, projects/kubernetes-event-storyboard/stages/01-parse-snapshots/docs/en.md

```bash
python3 scripts/project_test.py kubernetes-event-storyboard --init /tmp/kubernetes-event-storyboard-work
python3 scripts/project_test.py kubernetes-event-storyboard --stage 1 --path /tmp/kubernetes-event-storyboard-work --strict
python3 scripts/project_test.py kubernetes-event-storyboard --all --solution --strict
cd projects/kubernetes-event-storyboard/solution
go run . --input fixtures/rollout.json --out /tmp/context-pack.json  # Go pack
node --experimental-strip-types cli.ts /tmp/context-pack.json /tmp/timeline.html  # HTML
kubectl get events -A -o json  # export your own snapshot
```

## 故事板各阶段
type: flow
from: projects/kubernetes-event-storyboard/solution/main.go, projects/kubernetes-event-storyboard/solution/main.ts, projects/kubernetes-event-storyboard/stages

1. **解析**：`Parse([]byte)(Bundle,error)` 检查 `observedAt` 和两个 items 数组。
2. **分组**：`Group(Bundle)([]Row,error)` 对每个事件 UID 取最大 count，再求和。
3. **关联**：沿 ownerReferences 走到 `deployment.kubernetes.io/revision`。
4. **导出**：`Export(Bundle)(Pack,error)` 写出带脱敏的 `schemaVersion` 1。
5. **parsePack**：`parsePack(text)` 检查版本、计数和时间顺序。
6. **timeline**：`timeline(pack)` 返回已转义的 HTML，带 Warning 过滤。

## 故事板错误
type: command-table
from: projects/kubernetes-event-storyboard/solution/main.go, projects/kubernetes-event-storyboard/solution/main.ts

| 命令 | 作用 |
|---|---|
| `bundle exceeds one MiB` | 输入超过 1<<20 字节 |
| `trailing JSON` | bundle 之后还有多余数据 |
| `observedAt must be RFC3339` | 抓取时间戳无效 |
| `invalid occurrence range or count` | last 早于 first，或 count 小于 1 |
| `event UID changed identity` | UID 被另一个对象或原因复用 |
| `invalid or duplicate workload UID` | 工作负载 UID 为空或重复 |
| `invalid context pack` | TypeScript 拒绝 Go 生成的包 |

## 问答
type: qa
from: phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes, phases/17-infrastructure-and-production/11-multi-region-kv-locality, projects/kubernetes-event-storyboard/stages

- **Karpenter 还是 Cluster Autoscaler？** Karpenter 约 45-60s。Cluster Autoscaler 对 GPU 节点约 90-120s。
- **prefill pod 用什么信号？** 队列深度。decode pod 按 KV cache 压力扩缩。
- **跨区域路由？** 很少。440 ms 往返超过了从 800 到 80 ms 的节省。
- **轮询的代价是什么？** 缓存命中约 80 ms，未命中约 800 ms。相差 10x。
- **两次快照的 count 分别为 2 和 4？** 同一序列。count 是 4，不是 6。
- **发现两个 revision？** revision 记为未知。绝不从名字猜测。

## 提示
type: tips
from: phases/17-infrastructure-and-production/11-multi-region-kv-locality, phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes, phases/17-infrastructure-and-production/10-cold-start-mitigation

- 把 `tokenizer.json` 或 `tokenizer.model` 与权重一起备份。
- 备份 `quantize_config.json` 和 `vllm_config.yaml`。
- 每季度做一次灾备演练。
- 把 KAI 作为第二调度器运行，并给工作负载加注解来使用它。
- 张量并行工作负载保持在同一个 NVLink 域内。
- 只把 `min_workers=1-2` 给实时聊天和语音链路。
