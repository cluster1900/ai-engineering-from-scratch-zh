# 运行批处理和离线任务

> 当没人等第一个 token 时，就把并发往上提，直到吞吐量不再增长。

你必须在一夜之间处理一大批 prompt。读完本节后，你能在不在乎延迟时拿到最多的每秒 token 数。

**我们的结果：** 在我们的 L4 上用 Qwen3-8B 时，输出在 32 个用户时停止增长，接近每秒 274 个 token。

## 选择离线类还是服务器 {#s-run-batch-and-offline-jobs-pick-the-offline-class-or-the-server}

对一份固定的 prompt 列表，离线的 `LLM` 类在你的 Python 进程中运行引擎。它没有 HTTP 层，也没有需要调优的客户端：

```python
from vllm import LLM, SamplingParams

prompts = ["Summarize the history of Lisbon in three sentences.", "Write a haiku about the sea."]
llm = LLM(model="Qwen/Qwen3-8B")
params = SamplingParams(temperature=0.7, max_tokens=256)
outputs = llm.generate(prompts, params)
for out in outputs:
    print(out.outputs[0].text)
```

在一次调用中传入整个列表。引擎会自己调度所有 prompt，并让 batch 保持满载。

对于一个 OpenAI 请求文件，使用批处理命令：

```bash
vllm run-batch -i requests.jsonl -o results.jsonl --model Qwen/Qwen3-8B
```

当其他程序必须发送这些工作，或者任务要与线上流量共用 GPU 时，使用服务器。

## 找到吞吐量停止增长的点 {#s-run-batch-and-offline-jobs-find-where-throughput-stops-growing}

当没人等第一个 token 时，只有总输出才重要。提高并发，直到输出不再增长。

2026-10-17，我们在自己的 L4 上、在[满频会话](#l4-sessions)中用 512 token 的 prompt 运行了 `Qwen/Qwen3-8B`。输出从单用户的 13.5 tok/s 增长到 32 个用户的 273.9 tok/s。到 64 个用户时降到 241.4 tok/s，因为池满了，GPU 也降频了。在 2026-10-18 的另一次运行中，每秒 4 个请求的固定速率给出了 286.6 tok/s，时钟为 1,245 对比 1,275 MHz。所以在这块卡上，同时约 32 个用户时输出最多。更多用户只会让每个请求等得更久。

你的配置上的上限取决于模型、prompt 和回答的长度，以及池的大小。用你自己的长度跑一遍[扫描](#s-benchmark-your-server-in-15-minutes)来找到它。

## 为批处理任务放宽限制 {#s-run-batch-and-offline-jobs-raise-the-limits-for-a-batch-job}

有两个限制约束着 batch。它们的默认值取决于 GPU 显存以及你运行 vLLM 的方式：

- `--max-num-seqs` 限制同时运行的请求数。
- `--max-num-batched-tokens` 限制一步中的 token 数。离线的 `LLM` 类的默认值比服务器更大。vLLM 文档建议为了吞吐量把它设到 8,192 以上，尤其是在大 GPU 上跑小模型时。

[token 预算页](#s-keep-long-prompts-from-stalling-short-ones)给出了你的 GPU 上每个限制的默认值。

更大的 token 预算让长 prompt 用更少的步完成 prefill。正在运行的流在每一步中分到的更少，而批处理任务并不在乎这一点。

我们在 DGX Spark 上测量过这个预算，在低速率下 16,384 让 token 间隔变长。[长 prompt 页](#s-keep-long-prompts-from-stalling-short-ones)给出了数字。我们没有针对批处理任务测量它。

## 检查运行情况 {#s-run-batch-and-offline-jobs-check-the-run}

观察 `vllm:num_requests_running` 和 `vllm:kv_cache_usage_perc`。如果 cache 使用率一直接近 1 且请求在等待，说明池限制了 batch。用 FP8 KV cache 或更短的最大长度增加显存。如果运行中的请求数停在 `--max-num-seqs` 上限且 cache 还有空闲，就提高这个上限。

```takeaways
- 对固定列表使用离线 LLM 类，并在一次调用中传入整个列表。
- 提高并发直到输出不再增长。在我们的 L4 上大约是 32 个用户。
- 为批处理任务提高 token 预算，因为在那里第一个 token 慢一点没有任何代价。
```

Sources: capture/gpu/summary/l4.json (load.vllm, rate.vllm), vLLM documentation at v0.31.0 (docs/configuration/optimization.md), the vLLM source at v0.31.0 (vllm/entrypoints/llm.py, vllm/entrypoints/cli/).
