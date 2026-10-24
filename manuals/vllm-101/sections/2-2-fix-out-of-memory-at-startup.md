# 修复启动时的显存不足

> 大多数启动失败取决于一个设置：GPU 显存比例。其余的大多可以通过缩短最大长度或降低并发上限来修复。

服务器在打印 KV cache 大小那一行之前就停止了。读完本节后，你能从日志的最后几行读出原因，并选出能修复它的那一个参数。

## 了解 vLLM 启动时占用什么 {#s-fix-out-of-memory-at-startup-know-what-vllm-claims-at-startup}

vLLM 在处理请求之前会做四件事：

1. 加载权重。
2. 用一个满 batch 运行一次 profile，测量激活显存。
3. 捕获 CUDA graph。
4. 把它那份 GPU 显存中剩下的部分交给 KV cache。

这份额度就是 `--gpu-memory-utilization`。默认值是 0.92，所以 vLLM 会为自己占用 GPU 总显存的 92%。这个数字是单个 vLLM 实例的上限，而不是服务器启动时空闲显存的比例。在统一内存上（例如 DGX Spark），它并不总是硬上限，[DGX Spark 页](#s-size-memory-on-a-dgx-spark)对此有说明。

## 在日志里找到你的失败原因 {#s-fix-out-of-memory-at-startup-find-your-failure-in-the-log}

读服务器日志的最后 30 行。大多数启动失败都属于以下三种情况之一。

| 日志里说的是 | 原因 | 修复 |
|---|---|---|
| 以最大长度服务一个请求所需的 KV cache 大于可用的 KV cache 显存 | 权重和 profile 留下的显存不够一个满长度请求 | 降低 `--max-model-len`。错误信息会给出能放下的最大长度。 |
| 设备上的空闲显存小于期望的 GPU 显存使用率 | 有其他进程占用了 GPU 显存 | 把 `--gpu-memory-utilization` 降到空闲比例以下，或者停止那个进程 |
| profile 运行或 graph 捕获期间 CUDA 显存不足 | profile 中的 batch 或 graph 需要的显存多于剩余显存 | 降低 `--max-num-seqs` 或 `--max-num-batched-tokens`，或者降低 `--max-cudagraph-capture-size` |

```figure
id: fig-2-2
kind: decision
title: where a start fails
claim: The last line before the start fails tells you which of three settings to change.
caption: Read down each column: where the log stops, the cause, and the flag to change. From the vLLM source at v0.31.0 and our runs on the L4.
```

## 修复共享的 GPU {#s-fix-out-of-memory-at-startup-fix-a-shared-gpu}

在共享的 GPU 上，自己设置这个比例。我们在一块另一个团队也在用的 L4 上运行 vLLM 0.31.0。他们的进程占用了一部分显存，所以我们设置了 `--gpu-memory-utilization 0.83` 和一个 2,928 token 的池。

第一次启动仍然失败了，因为我们把最大长度也设成了 2,928 token。以这个长度服务一个请求所需的 KV cache 比空闲的略多，错误信息说 2,912 token 能放下：

```listing
title: the maximum length error on the shared L4 GPU
source: capture/gpu/incidents/l4-gpu1-vllm-maxlen-oom.txt
lang: text
note: The first line gives the settings. The second line gives the error and the length that fits. Our capture cut the second line at 420 characters. In vLLM 0.31.0, the rest of the message tells you to raise the memory fraction or to lower the maximum length.
---
(APIServer pid=3681321) INFO 10-22 00:35:04 [api_utils.py:286] non-default args: {'model_tag': 'Qwen/Qwen3-8B', 'host': '127.0.0.1', 'port': 30100, 'model': 'Qwen/Qwen3-8B', 'max_model_len': 2928, 'gpu_memory_utilization': 0.83, 'num_gpu_blocks_override': 183}
(EngineCore pid=3682071) ERROR 10-22 00:36:18 [core.py:1433] ValueError: To serve at least one request with the model's max seq len (2928), (0.4 GiB KV cache is needed, which is larger than the available KV cache memory (0.4 GiB). Based on the available memory, the estimated maximum model length is 2912. Try increasing `gpu_memory_utilization` (which also controls CPU memory on the CPU backend) or decreasing `max_mod
```

我们设置了 `--max-model-len 2048`，这对我们 640 token 的请求已经足够，服务器随即启动。后来我们把它提高到 2,304 token，好让带 2,048 token 前缀的测试能放下。

所以在共享的 GPU 上，比例和最大长度是共同起作用的。先把最大长度降到你发送的最长请求，再去降低比例。

## 直接设置 KV cache 大小 {#s-fix-out-of-memory-at-startup-set-the-kv-cache-size-directly}

如果你知道想要的 KV cache 大小，用 `--kv-cache-memory-bytes` 按字节设置它。这样 vLLM 在分配 cache 时会忽略 `--gpu-memory-utilization`。当两个 vLLM 实例共用一块 GPU、各自需要一个已知大小的池时，就用这个参数。

`--num-gpu-blocks-override` 为测试设置 16-token block 的数量，就像[我们的固定池](#s-count-the-memory-before-you-pick-a-gpu)那样。不要在生产环境中使用它，因为它不会检查显存是否真的存在。

## 检查修复结果 {#s-fix-out-of-memory-at-startup-check-the-fix}

像[第一次启动](#s-install-vllm-and-serve-your-first-model)那样，用 `tee server.log` 再次启动服务器，并等待池大小那一行：

```bash
grep "GPU KV cache size" server.log
```

如果这一行出现了，说明服务器有了池。把它的大小与[你的计算结果](#s-count-the-memory-before-you-pick-a-gpu)比较。

```takeaways
- 读日志的最后 30 行，把失败对应到三种情况之一。
- 在共享的 GPU 上，先降低最大模型长度，再降低显存比例。
- 两个实例共用一块 GPU 时，使用精确设置 KV 显存的参数。
```

Sources: capture/gpu/incidents/l4-gpu1-vllm-maxlen-oom.txt, vLLM documentation at v0.31.0 (docs/configuration/optimization.md), the vLLM source at v0.31.0 (vllm/config/cache.py, vllm/config/scheduler.py), our L4 run on the shared GPU on 2026-10-22.
