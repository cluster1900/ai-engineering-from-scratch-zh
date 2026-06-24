# vLLM Serving Internals：PagedAttention、Continuous Batching、Chunked Prefill

> vLLM 在 2026 年的主导地位依赖于三个相互叠加的默认设置，而不是某个单一技巧。PagedAttention 始终开启。Continuous batching 会在 decode iterations 之间把新 requests 注入 active batch。Chunked prefill 会切分长 prompts，让 decode tokens 永远不会饥饿。把这三者全部打开后，单张 H100 SXM5 上的 Llama 3.3 70B FP8 在 128 并发下可达到 2,200-2,400 tok/s，比 vLLM 自身默认值高约 25%，约为朴素 PyTorch loop 的 3-4 倍。本课会深入到你能画图说明 scheduler 和 attention kernel 的层级，并以 `code/main.py` 中的一个玩具 continuous batcher 结束，它会像 vLLM 一样调度 prefill 和 decode。

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**前置要求：** Phase 17 · 01 (Model Serving), Phase 11 (LLM Engineering)
**Time:** ~75 minutes

## 学习目标
- 将 PagedAttention 解释为 KV cache allocator：blocks、block tables，以及为什么在生产负载下碎片化保持在 4% 以下。
- 在 iteration 层面画出 continuous batching：完成的 sequences 如何离开 batch，新的 sequences 如何加入，而不需要 drain。
- 用一句话描述 chunked prefill，并说出它保护的是哪个 latency metric（提示：是 TTFT tail，而不是平均 throughput）。
- 说出 2026 年 vLLM v0.18.0 中会影响那些一次性启用所有优化的团队的 gotcha。

## 问题
朴素的 PyTorch serve loop 一次运行一个 request：tokenize、prefill、decode 直到 EOS、返回。一个用户时这能工作。一百个用户时，它就是一队耐心等待的人。显而易见的修复方式是 static batching，但它会把窗口中的每个 request padding 到最长 prompt，把每次 decode padding 到最长预期输出，并让整个 batch 因最慢的 sequence 而停滞。你为从未使用的 padding 付出代价，快 requests 也要等待慢 requests。

vLLM 同时解决三个问题。PagedAttention 阻止 KV cache 碎片化像经典连续分配那样吃掉 60-80% 的 GPU memory。Continuous batching 允许 requests 在每次 decode iteration 之间加入和离开 batch，因此 batch 始终充满真实工作。Chunked prefill 将 32k-token prompt 拆成约 512-token 的切片，并与 decode 交错执行，因此长 prompt 不会冻结 GPU 上的每个 decode token。

2026 年的生产默认值是三者全部开启。你需要理解每个机制的作用，因为失败模式都在 scheduler 上，而不在 model 上。

## 概念
### PagedAttention 作为虚拟内存系统

KV cache 对每个 sequence 来说是 `num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element`。对于 8192 tokens 的 Llama 3.3 70B，在 BF16 下每个 sequence 约为 1.25 GB。如果你为每个 request 预留 8192 个 slots，但平均 request 只使用 1500 tokens，那么你会浪费约 82% 的已预留 HBM。经典 batching 会付出这部分浪费。

PagedAttention 借鉴了 OS virtual memory 的思想。KV cache 并不是按 sequence 连续存放的。它以固定大小的 blocks 分配（默认 16 tokens）。每个 sequence 有一个 block table，将其 logical token positions 映射到 physical block IDs。当一个 sequence 超过已分配的 blocks 时，会再添加一个 block。当它结束时，它的 blocks 会返回 pool。

碎片化从 60-80%（经典方式）降到 4% 以下（PagedAttention）。你不会通过某个 flag 启用 PagedAttention，它是 vLLM 提供的唯一 allocator。可调旋钮是 `--gpu-memory-utilization`（默认 0.9），它告诉 vLLM 在加载 weights 和 activations 后，为 KV blocks 预留多少 HBM。

### iteration 层面的 Continuous batching

旧式 “dynamic batching” 会等待一个窗口（比如 10 ms）来填充 batch，然后运行 prefill + decode + decode + decode，直到每个 sequence 完成。快 sequences 会提前离开并闲置，而 GPU 继续处理慢 sequences。

Continuous batching 在每个 decode step 之间运行。把正在运行的 sequences 集合称为 `RUNNING` list。在每次 iteration 中：

1. `RUNNING` 中任何刚达到 EOS 或 max_tokens 的 sequence 都会被移除。
2. scheduler 查看 waiting queue。如果有空闲 KV blocks，它会接纳新的 sequences（prefill 或 resumed）。
3. forward pass 在当前 `RUNNING` 中的内容上运行，为每个 sequence 发出一个新 token。

batch size 永远不会被 padding 到固定数字。输出位置不同的 sequences 共享一次 fused forward。在 2026 年的 vLLM 中，这叫做 `V1 scheduler`。关键 invariant：scheduler 每个 decode iteration 运行一次，而不是每个 request 运行一次。

### Chunked prefill 保护 TTFT tail

Prefill 是 compute-bound 的。Llama 3.3 70B 上的 32k-token prompt 在单张 H100 上需要约 800 ms 的纯 prefill。prefill 运行时，batch 中所有其他 sequences 的 decode tokens 都在等待。在 serving loop 中，一个长 prompt 的 first-token latency（TTFT）会变成几十个其他用户的 inter-token latency（ITL）抖动。

Chunked prefill 将 prefill 拆成固定大小的 chunks（默认 512 tokens），并以 chunk 为单位调度。chunk 之间，scheduler 可以让 decode sequences 前进一个 token。你用少量绝对 prefill latency 增量（每个 chunk 几 ms）换来明显更低的 decode-time jitter。在已发布 benchmarks 中，混合负载下的 P99 ITL 从约 50 ms 降到约 15 ms。

### 三个默认设置会相互作用

这三个功能都假设彼此存在。PagedAttention 为 scheduler 提供了细粒度的 KV resource 以供权衡。Continuous batching 需要这种细粒度 resource，这样接纳新 sequence 时不需要强制全局 reshuffle。Chunked prefill 是 scheduler 在同一个 `RUNNING` list 上做出的决策，它只是另一个 scheduler policy，而不是独立系统。

你不需要知道每个 flag。你需要知道 scheduler 优化的内容：在 KV-block budget 约束下的 goodput，并受 chunked prefill slicing 约束。

### 2026 年 v0.18.0 的 gotcha

在 vLLM v0.18.0 中，你不能将 `--enable-chunked-prefill` 与 draft-model speculative decoding（`--speculative-model`）结合使用。文档说明的例外是 V1 scheduler 中的 N-gram GPU speculative decoding。那些不读 release notes 就打开所有 flag 的团队，会在启动时遇到 run-time error，而不是软性 regression。如果你的 speculative 收益值得启用 chunked prefill，那就重新审视选择：2026 年的正确答案通常是 EAGLE-3 且不使用 chunked prefill，而不是 draft model 加上无法编译的 chunked prefill。

### 你应该记住的数字

- Llama 3.3 70B FP8，H100 SXM5，128 并发，三者全开：2,200-2,400 tok/s。
- 同一 model，默认 vLLM（无 chunked prefill）：~1,800 tok/s。
- 同一 model，朴素 PyTorch forward loop：~600 tok/s。
- 生产负载下 PagedAttention 的 KV 碎片化浪费：<4%。
- 混合负载下 P99 ITL：使用 chunked prefill 时 ~15 ms，不使用时 ~50 ms。

### scheduler 的样子

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py` 正是这个 loop 的 stdlib Python 版本，使用假的 token counts 和假的 forward latency。运行它会展示 chunked prefill 如何在长 prefill 期间让 decode sequences 保持活跃。


```figure
tensor-parallel
```

## 使用它
`code/main.py` 模拟了一个 vLLM 风格的 scheduler，并带有可切换功能。运行它可以看到：

- `NAIVE` mode：一次一个 request，无 batching。
- `STATIC` mode：padding 并等待，经典 batching。
- `CONTINUOUS` mode：iteration 级别的 admission 和 release。
- `CONTINUOUS + CHUNKED` mode：prefill 切片与 decode 交错。

输出会展示总 throughput（tokens per virtual second）、TTFT mean 和 P99 ITL。`CONTINUOUS + CHUNKED` 这一行在混合流量上应该占优。

## 交付它
本课会生成 `outputs/skill-vllm-scheduler-reader.md`。给定一个 serving config（batch size、KV memory utilization、chunked prefill size、speculative config），它会生成一个 scheduler diagnosis，指出三个默认设置中的哪一个正在成为瓶颈，以及应该调什么。

## 练习
1. 运行 `code/main.py`。在包含短 requests 和长 requests 的混合 workload 上比较 `STATIC` 与 `CONTINUOUS`。throughput 差距来自哪里，是 prefill efficiency、decode efficiency，还是 tail latency？
2. 修改这个玩具 scheduler，添加 `--max-num-batched-tokens`。对于运行 Llama 3.3 70B FP8 的 H100，正确取值是多少？（提示：它是 KV block size 和空闲 blocks 数量的函数，而不是原始 HBM 的函数。）
3. 重新阅读 vLLM v0.18.0 release notes。哪些 flag 组合是互斥的？列出它们。
4. 针对 1,000 个 requests 的 trace 计算 KV cache 碎片化浪费，平均 1,500 output tokens，std 600 tokens，分别在以下条件下：(a) 以 8192 max 进行 contiguous per-request allocation，(b) 使用 16-token blocks 的 PagedAttention。
5. 用一段话解释为什么 chunked prefill 有助于 P99 ITL，但单独看并不会提升 throughput。实践中的 throughput 收益来自哪里？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | “KV trick” | 用于 KV cache 的固定大小 block allocator；碎片化 <4% |
| Block table | “page table” | 每个 sequence 从 logical token position 到 physical KV block 的映射 |
| Continuous batching | “dynamic batching, but right” | 每个 decode iteration 都做 admit/release 决策 |
| Chunked prefill | “prefill splitting” | 将长 prefill 拆成 512-token 切片并与 decode 交错 |
| TTFT | “first token time” | Prefill + queue + network；在长 prompts 下由 prefill 主导 |
| ITL | “inter-token latency” | 连续 decode tokens 之间的时间；由 batch size 主导 |
| Goodput | “满足 SLO 的 throughput” | 每个 request 仍命中 TTFT 和 ITL targets 时的 tokens/sec |
| V1 scheduler | “new scheduler” | vLLM 的 2026 scheduler；N-gram spec decode 是与 chunked-prefill 兼容的路径 |
| `--gpu-memory-utilization` | “memory knob” | 在 weights 和 activations 之后为 KV blocks 预留的 HBM 比例 |

## 延伸阅读
- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) — 关于 chunked-prefill 与 speculative-decoding 兼容性的官方来源。
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) — 2026 release cadence 和特定版本行为。
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) — 仍然定义如何理解 allocator 的原始文章。
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) — 碎片化分析与 scheduler design。
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) — 带有 flame graphs 的详细 V1 scheduler walkthrough。
