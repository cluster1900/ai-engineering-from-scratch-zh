---
id: async-disaggregated-inference
title: Async, Hogwild and Disaggregated Inference
code: AD
subtitle: 共享、拆分、路由和卸载 KV 缓存。公式、交叉点数值，以及每种方法吃亏的场景。
hue: 170
sources: phases/10-llms-from-scratch/22-async-hogwild-inference, phases/17-infrastructure-and-production/11-multi-region-kv-locality, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache
source_hash: 72cc74e8fb23f65f
---

## 核心概念
type: concepts
from: phases/10-llms-from-scratch/22-async-hogwild-inference/docs/en.md, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/docs/en.md, phases/17-infrastructure-and-production/11-multi-region-kv-locality/docs/en.md, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/docs/en.md

- **Prefill**：对整个提示做一次前向。计算受限。
- **Decode**：一次一个 token。读取全部权重。内存带宽受限。
- **Hogwild!**：同一 LLM 的 N 个副本写入同一个共享 KV 缓存。
- **涌现式协作**：推理模型无需微调即可分工。
- **RoPE**：位置是旋转，因此共享的缓存条目保持有效。
- **分离部署**：prefill 池和 decode 池。KV 在两者之间传输。
- **缓存感知路由**：把请求发往持有其前缀的副本。
- **KV 卸载**：KV 缓存离开 GPU，先到 CPU DRAM，再到磁盘。

## 四种方法对比
type: comparison
span: 2
from: phases/10-llms-from-scratch/22-async-hogwild-inference/docs/en.md, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/docs/en.md, phases/17-infrastructure-and-production/11-multi-region-kv-locality/docs/en.md, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/docs/en.md

| 因素 | Hogwild! | 分离部署 | 缓存感知路由 | LMCache |
|---|---|---|---|---|
| 做什么 | N 个 worker，一个共享 KV 缓存 | Prefill 与 decode 在不同的池上 | 按前缀哈希匹配路由 | 跨引擎的 KV，放在 CPU DRAM + 磁盘 |
| 胜出场景 | 长推理，p 高 | 提示 >512 tokens + 输出 >200 tokens | 前缀在副本间重复 | KV 超出 HBM |
| 吃亏场景 | 短的交互式聊天 | 小集群（< 4 GPUs） | 跨区域 RTT 超过省下的 prefill | 短上下文（<1K tokens） |
| 数值 | p = 0.7、N = 4 时 1.8x | GB200 NVL72 上 DeepSeek-R1 约 ~6x | 命中约 ~80 ms，未命中约 ~800 ms | 低压力下 3-5% 开销 |
| 状态 | 研究阶段，2026 年 4 月 | Dynamo 1.0 GA，llm-d 0.5 | vLLM Router，llm-d router | vLLM 0.11.0 异步路径 |

## 分离式服务栈
type: architecture
from: phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/docs/en.md, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/docs/en.md, phases/17-infrastructure-and-production/11-multi-region-kv-locality/docs/en.md

```arch
node | client | 1,1 | Client | request | client
node | router | 2,1 | Router | cache-aware, KV events | process
node | prefill | 3,1 | Prefill pool | compute-heavy | gpu
node | decode | 3,2 | Decode pool | memory-heavy | gpu
node | lmc | 2,2 | LMCache | CPU DRAM + Ceph/S3 | store
edge | client | router | prompt
edge | router | prefill | prompt only
edge | prefill | decode | KV over NIXL
edge | decode | lmc | unused KV
edge | decode | client | tokens
```

## 一次 Hogwild! 步骤
type: flow
from: phases/10-llms-from-scratch/22-async-hogwild-inference/docs/en.md, phases/10-llms-from-scratch/22-async-hogwild-inference/code/main.py

1. **提示**：告诉每个 worker 它是 N 个实例之一，并避免重复工作。
2. **Worker**：读取整个共享缓存，包括其他 worker 的 token。
3. **Worker**：看到已完成的工作，选择另一个子目标。
4. **Worker**：在下一个缓存位置写入一个 token。
5. **缓存**：顺序由写入到达时间决定。没有按 worker 的索引。
6. **其他 worker**：在下一步立即看到该 token。

## 代码中的成本模型
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/22-async-hogwild-inference/code/main.py, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/code/main.py

```python
def expected_speedup(T_serial: int, p: float, c: int, N: int,
                     steps_per_worker: int) -> float:
    parallel = T_serial * ((1 - p) + p / N) + c * N  # Amdahl plus coordination
    return T_serial / parallel

def ms_disaggregated(prompt: int, output: int, use_rdma: bool = True) -> float:
    prefill_ms = prompt / PREFILL_TOK_PER_MS
    kv_bytes = prompt * KV_BYTES_PER_TOKEN_70B_FP8
    transport = NIXL_RDMA_GB_S if use_rdma else NIXL_TCP_GB_S
    transfer_ms = (kv_bytes / 1e9) / transport * 1000  # the transfer tax
    decode_ms = output / DECODE_TOK_PER_MS_DECODE_GPU  # faster decode pool
    return prefill_ms + transfer_ms + decode_ms
```

## 运行模拟器
type: task-table
span: 2
from: phases/10-llms-from-scratch/22-async-hogwild-inference/code/main.py, phases/17-infrastructure-and-production/11-multi-region-kv-locality/code/main.py, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/code/main.py, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/code/main.py

| 任务 | 代码 |
|---|---|
| Hogwild! 基线，一个 worker | `run_hogwild(n_workers=1, step_budget=200, target_per_category=100, coordination_weight=0.8)` |
| 两个 worker 的 Hogwild! | `run_hogwild(n_workers=2, step_budget=200, target_per_category=100, coordination_weight=0.8)` |
| 扫描协作程度 | `for cw in (0.0, 0.2, 0.5, 0.8, 1.0):` |
| 比较三种路由器 | `for strategy in ("ROUND_ROBIN", "REGIONAL", "GLOBAL"):` |
| 共置部署的请求时间 | `ms_colocated(prompt, output)` |
| 基于 TCP 的分离部署 | `ms_disaggregated(prompt, output, use_rdma=False)` |
| 比较卸载配置 | `for cfg in ("NATIVE_ONLY", "CPU_OFFLOAD", "LMCACHE"):` |

## 模拟器中的常量
type: defaults
from: phases/17-infrastructure-and-production/11-multi-region-kv-locality/code/main.py, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/code/main.py, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `CACHE_HIT_MS` | 80 | 前缀常驻时的 TTFT |
| `CACHE_MISS_MS` | 800 | 冷 prefill 时的 TTFT |
| `REPLICAS_PER_REGION` | 4 | 三个区域 |
| `PREFILL_TOK_PER_MS` | 40.0 | 每 GPU |
| `KV_BYTES_PER_TOKEN_70B_FP8` | 125_000 | 每 token 的 KV 大小 |
| `NIXL_RDMA_GB_S` | 100 | RDMA 传输速率 |
| `NIXL_TCP_GB_S` | 10 | TCP 回退速率 |
| `KV_BLOCK_TOKENS` | 16 | 每个 KV 块的 token 数 |

## 故障排查
type: troubleshooting
from: phases/17-infrastructure-and-production/11-multi-region-kv-locality/docs/en.md, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/docs/en.md, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/docs/en.md, phases/10-llms-from-scratch/22-async-hogwild-inference/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 前缀命中率降到 8% | 轮询式 ALB | 基于前缀哈希的缓存感知路由器 |
| 故障切换后副本无法启动 | 缺少 tokenizer 或量化配置 | 三文件 DR 清单 |
| 分离部署反而更慢 | 提示短，传输开销 | 对 < 512 tokens 的提示采用共置 |
| 同一个 2K 提示被重复 prefill | HBM 100% 时被抢占 | LMCache 或原生 CPU 卸载 |
| 跨区域路由抬高 TTFT | 440 ms 往返 | 保持区域内路由 |
| EU 请求在 us-east-1 上处理 | 路由器忽略数据驻留 | 按驻留要求划分路由器 |
| Hogwild! 加速比低于 1 | worker 重复工作 | 使用推理模型 |
| Hogwild! 收益低于 1.3x | 协作开销占主导 | 退回单 worker |

## 何时选用
type: tips
from: phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/docs/en.md, phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/docs/en.md, phases/10-llms-from-scratch/22-async-hogwild-inference/docs/en.md

- 需要托管的上层编排器时用 Dynamo。
- 需要 Kubernetes 原生原语时用 llm-d。
- 单个引擎有 HBM 压力时用原生 CPU 卸载。
- 多个引擎共享前缀时用 LMCache。
- Hogwild! 只在单节点上用。跨节点是延迟灾难。
- 只有两个 worker 带来超过 1.5x 时，才把 Hogwild! 推到 N=4。

## 问答
type: qa
from: phases/10-llms-from-scratch/22-async-hogwild-inference/docs/en.md, phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/docs/en.md, phases/17-infrastructure-and-production/11-multi-region-kv-locality/docs/en.md

- **KV 传输成本？** 70B FP8 上 4K 提示的 KV 经 NIXL 传输需 20-80 ms。
- **Hogwild! 配合投机解码？** 加速比相乘。3x 和 1.8x 得到 5.4x。
- **为什么要最小化 prefill 加网络？** 跨区域路由会给请求增加 440 ms 往返。拿它和缓存命中省下的 prefill 比较。
- **32% 的情况下是什么让 DR 失败？** 缺少 tokenizer 或量化配置。
- **共置的浪费？** 20-40% 的 GPU 时间花在了不对路的资源上。

## 术语表
type: glossary
from: phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/docs/en.md, phases/17-infrastructure-and-production/11-multi-region-kv-locality/docs/en.md, phases/10-llms-from-scratch/22-async-hogwild-inference/docs/en.md

- **NIXL**：Dynamo 的 KV 传输层。RDMA/InfiniBand 或 TCP 回退。
- **RTT**：往返时间。美国-欧洲约 ~75 ms，美国-亚太约 ~220 ms。
- **p**：可并行运行的工作占比。
- **c**：每个 worker 以 token 计的协作开销。
- **UCCL**：llm-d 0.5 的网络层。
