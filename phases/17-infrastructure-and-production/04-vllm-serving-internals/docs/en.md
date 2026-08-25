# Serving Engine 内部机制 — PagedAttention、Continuous Batching、Chunked Prefill

> 现代 serving engine 的 throughput 建立在三个相互叠加的默认机制之上，而非某个单一技巧。PagedAttention 始终启用。Continuous batching 会在不同 decode iteration 之间，将新请求注入当前活动 batch。Chunked prefill 会切分较长的 prompt，避免 decode Token 得不到计算资源。三者全部启用时，在单张 H100 SXM5 上运行的 Llama 3.3 70B FP8，在 128 路并发下可达到 2,200-2,400 tok/s，比 vLLM 自身的默认配置高约 25%，并达到简单 PyTorch loop 的 3-4 倍。本课将深入阅读 vLLM 的 scheduler 和 Attention kernel。vLLM 是这三项技术的参考引擎。学习深度将足以让你绘制其架构图，并最终在 `code/main.py` 中实现一个玩具版 continuous batcher，以 vLLM 的方式调度 prefill 和 decode。

**Type:** Learn
**Languages:** Python（stdlib，玩具版 continuous batching scheduler）
**Prerequisites:** Phase 17 · 01（Model Serving），Phase 11（LLM Engineering）
**Time:** ~75 分钟

## Learning Objectives

- 将 PagedAttention 解释为一种 KV cache allocator：说明 block、block table，以及为什么在生产负载下 fragmentation 能保持在 4% 以下。
- 从 iteration 层面绘制 continuous batching：说明已完成 sequence 如何离开 batch，以及新 sequence 如何在无需清空 batch 的情况下加入。
- 用一句话描述 chunked prefill，并指出它保护的是哪项 latency metric（提示：是 TTFT tail，而不是平均 throughput）。
- 说出 2026 年 vLLM v0.18.0 中，在团队同时启用所有优化时容易踩到的 gotcha。

## The Problem

一个简单的 PyTorch serving loop 每次只处理一个请求：tokenize、prefill、decode 直到 EOS，然后返回结果。只有一名用户时，这种方式可以工作。有一百名用户时，它就会变成一支由耐心用户组成的队列。显而易见的修复方式是 static batching，但它会把窗口中的每个请求 pad 到最长 prompt，把每次 decode pad 到最长预期输出，并让整个 batch 因最慢的 sequence 而停滞。你为从未使用的 padding 支付计算成本，而快速请求则要等待慢速请求。

vLLM 同时解决了三个问题。PagedAttention 避免 KV cache fragmentation 像传统 contiguous allocation 那样吞噬 60-80% 的 GPU memory。Continuous batching 允许请求在每个 decode iteration 之间加入或离开 batch，使 batch 始终充满真实工作。Chunked prefill 将一个包含 32k Token 的 prompt 拆分为约 512 Token 的 slice，并让这些 slice 与 decode 交错执行，因此较长的 prompt 不会冻结 GPU 上的所有 decode Token。

2026 年的生产默认配置是三者全部启用。你需要理解每项机制的作用，因为所有 failure mode 都发生在 scheduler 上，而不是 Model 上。

## The Concept

### 将 PagedAttention 视为 virtual memory system

每条 sequence 的 KV cache 大小为 `num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element`。对于具有 8192 个 Token 的 Llama 3.3 70B，每条 sequence 在 BF16 下大约需要 1.25 GB。如果你为每个请求预留 8192 个 slot，但平均请求只使用 1500 个 Token，那么预留的 HBM 中约有 82% 会被浪费。传统 batching 必须承担这种浪费。

PagedAttention 借用了 OS virtual memory 的思想。每条 sequence 的 KV cache 并不是连续的，而是以固定大小的 block 分配（默认每个 block 为 16 个 Token）。每条 sequence 都有一张 block table，用于将其逻辑 Token 位置映射到物理 block ID。当 sequence 增长到超出已分配 block 的范围时，再添加一个 block。当它完成时，其 block 会归还给资源池。

Fragmentation 从传统方式的 60-80% 降至 PagedAttention 的 4% 以下。你不需要通过 flag 启用 PagedAttention，因为它是 vLLM 唯一提供的 allocator。可调参数是 `--gpu-memory-utilization`（默认值为 0.9），它会告诉 vLLM，在加载权重和 activation 后应为 KV block 预留多少 HBM。

### iteration 层面的 Continuous batching

旧式的“dynamic batching”会等待一个窗口（例如 10 ms）来填满 batch，然后持续运行 prefill + decode + decode + decode，直到所有 sequence 都完成。快速 sequence 会提前完成并处于空闲状态，而 GPU 仍要继续处理较慢的 sequence。

Continuous batching 在每个 decode step 之间运行。将正在运行的 sequence 集合称为 `RUNNING` list。每次 iteration 都会执行以下操作：

1. 从 `RUNNING` 中移除刚刚达到 EOS 或 max_tokens 的所有 sequence。
2. Scheduler 检查 waiting queue。如果存在空闲 KV block，就接纳新的 sequence（进入 prefill 或恢复执行）。
3. Forward pass 在当前 `RUNNING` 中的所有内容上运行，并为每条 sequence 输出一个新 Token。

Batch size 永远不会被 pad 到固定数量。处于不同输出位置的 sequence 可以共享一次 fused forward。在 2026 年的 vLLM 中，这被称为 `V1 scheduler`。关键 invariant 是：scheduler 每个 decode iteration 运行一次，而不是每个请求运行一次。

### Chunked prefill 保护 TTFT tail

Prefill 受 compute 限制。在单张 H100 上，Llama 3.3 70B 处理一个包含 32k Token 的 prompt，大约需要 800 ms 的纯 prefill 时间。在 prefill 运行期间，batch 中其他所有 sequence 的 decode Token 都必须等待。在 serving loop 中，一个较长 prompt 的 first-token latency（TTFT），会变成其他几十名用户的 inter-token latency（ITL）波动。

Chunked prefill 将 prefill 拆分为固定大小的 chunk（默认 512 个 Token），并将每个 chunk 作为一个单元进行调度。在不同 chunk 之间，scheduler 可以让 decode sequence 前进一个 Token。你以少量绝对 prefill latency 损失为代价（每个 chunk 增加几毫秒），换取低得多的 decode-time jitter。已发布的 benchmark 显示，在混合负载下，P99 ITL 可从约 50 ms 降至约 15 ms。

### 三项默认机制会相互作用

这三项 Feature 都以另外两项为基础。PagedAttention 为 scheduler 提供细粒度 KV resource，使其能够进行资源权衡。Continuous batching 需要这种细粒度资源，这样接纳新 sequence 时才不必进行全局重排。Chunked prefill 则是 scheduler 在同一个 `RUNNING` list 上做出的决策，它只是另一项 scheduler policy，而不是一个独立系统。

你不需要了解每个 flag。你需要知道 scheduler 优化的目标：在 KV-block budget 下提高 goodput，同时遵循 chunked prefill slicing 的约束。

### 2026 年 v0.18.0 的 gotcha

在 vLLM v0.18.0 中，不能将 `--enable-chunked-prefill` 与使用 draft model 的 speculative decoding（`--speculative-model`）组合使用。文档中说明的例外，是 V1 scheduler 中的 N-gram GPU speculative decoding。没有阅读 release notes 就开启所有 flag 的团队，会在启动时遇到 runtime error，而不是轻微的性能回退。如果 speculative decoding 带来的收益值得你启用 chunked prefill，请重新审视这个选择。2026 年正确的答案通常是使用不带 chunked prefill 的 EAGLE-3，而不是使用根本无法编译的 draft model 加 chunked prefill。

### 应该记住的数字

- Llama 3.3 70B FP8、H100 SXM5、128 路并发、三项机制全部启用：2,200-2,400 tok/s。
- 相同 Model，默认 vLLM（无 chunked prefill）：约 1,800 tok/s。
- 相同 Model，简单 PyTorch forward loop：约 600 tok/s。
- 生产负载下，PagedAttention 的 KV fragmentation 浪费：<4%。
- 混合负载下的 P99 ITL：启用 chunked prefill 时约 15 ms，未启用时约 50 ms。

### Scheduler 的形态

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # 在一个 batch 中调度 prefill chunk + decode
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # 例如 512 个 Token
        else:
            batch.append(decode_one_token(s))     # 1 个 Token

    run_forward(batch)                            # 一次 fused GPU 调用
```

`code/main.py` 使用 stdlib Python 精确实现了这个 loop，其中使用了虚构的 Token 数量和 forward latency。运行后可以看到，chunked prefill 如何在较长的 prefill 期间保持 decode sequence 活跃。

```figure
tensor-parallel
```

## Use It

`code/main.py` 模拟了一个具有可切换 Feature 的 vLLM 风格 scheduler。运行它可以观察：

- `NAIVE` mode：每次处理一个请求，不使用 batching。
- `STATIC` mode：执行 pad 并等待，即传统 batching。
- `CONTINUOUS` mode：在 iteration 层面接纳和释放请求。
- `CONTINUOUS + CHUNKED` mode：将 prefill slice 与 decode 交错执行。

输出会显示总 throughput（每 virtual second 的 Token 数）、TTFT mean 和 P99 ITL。在混合流量下，`CONTINUOUS + CHUNKED` 行应该占据明显优势。

## Ship It

本课会产出 `outputs/skill-vllm-scheduler-reader.md`。给定一份 serving config（batch size、KV memory utilization、chunked prefill size、speculative config），它会生成 scheduler diagnosis，指出三项默认机制中的哪一项构成 bottleneck，以及应该调整什么。

## Exercises

1. 运行 `code/main.py`。在同时包含短请求和长请求的 workload 上比较 `STATIC` 与 `CONTINUOUS`。Throughput 差距来自哪里：prefill efficiency、decode efficiency，还是 tail latency？
2. 修改玩具版 scheduler，添加 `--max-num-batched-tokens`。对于运行 Llama 3.3 70B FP8 的 H100，正确的值是多少？（提示：它取决于 KV block size 和空闲 block 数量，而不是原始 HBM。）
3. 重新阅读 vLLM v0.18.0 release notes。哪些 flag 组合是互斥的？将它们列出来。
4. 对一段包含 1,000 个请求的 trace 计算 KV cache fragmentation 浪费。其中平均输出为 1,500 个 Token，标准差为 600 个 Token，分别采用：(a) 按请求连续分配，最大值为 8192；(b) 使用 16-Token block 的 PagedAttention。
5. 用一段话解释为什么 chunked prefill 能改善 P99 ITL，却无法单独改善 throughput。实践中的 throughput 提升来自哪里？

## Key Terms

| Term | 人们怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| PagedAttention | “那个 KV 技巧” | KV cache 的固定大小 block allocator；fragmentation <4% |
| Block table | “page table” | 将每条 sequence 的逻辑 Token 位置映射到物理 KV block |
| Continuous batching | “正确实现的 dynamic batching” | 每个 decode iteration 都会做出接纳和释放决策 |
| Chunked prefill | “拆分 prefill” | 将较长的 prefill 拆分为 512-Token slice，并与 decode 交错执行 |
| TTFT | “first Token time” | Prefill + queue + network；较长 prompt 下主要由 prefill 决定 |
| ITL | “inter-token latency” | 连续 decode Token 之间的时间；主要由 batch size 决定 |
| Goodput | “满足 SLO 的 throughput” | 所有请求仍能达到 TTFT 和 ITL 目标时的 Token/sec |
| V1 scheduler | “新的 scheduler” | vLLM 的 2026 年 scheduler；N-gram spec decode 是兼容 chunked prefill 的路径 |
| `--gpu-memory-utilization` | “memory 调节旋钮” | 加载权重和 activation 后，为 KV block 预留的 HBM 比例 |

## Further Reading

- [vLLM 文档 — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) — 关于 chunked prefill 与 speculative decoding 兼容性的官方来源。
- [vLLM Release Notes（NVIDIA）](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) — 2026 年的发布节奏和特定版本行为。
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) — 最初的讲解文章，至今仍定义着理解 allocator 的方式。
- [PagedAttention 论文（arXiv:2309.06180）](https://arxiv.org/abs/2309.06180) — fragmentation 分析和 scheduler 设计。
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) — 包含 flame graph 的详细 V1 scheduler 解析。
