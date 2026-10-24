# 15 分钟内给你的服务器做基准测试

> 一次并发扫描就能找到延迟开始增长的那个点，而四个默认设置会改变结果。

你改了一个参数，想知道它是否有帮助。读完本节后，你能跑一次并发扫描，找到延迟的跳变点，并避开让两次运行结果不一致的四个错误。

**我们的结果：** 在我们的 L4 上，输出在 32 个用户时达到峰值，约每秒 275 token，到 64 个用户时下降。

## 跑一次扫描 {#s-benchmark-your-server-in-15-minutes-run-one-sweep}

我们的表格来自 SGLang 0.5.22 的基准测试客户端，而不是 vLLM 的客户端，温度为 0。我们对两个引擎用同一个客户端，这样[引擎对比页](#s-decide-between-vllm-and-sglang)就能用同一种方法比较两个引擎。要拿你的 GPU 和我们的表格比较，就用同一个客户端。把它装在单独的虚拟环境里，免得改动你的 vLLM 安装：

```bash
uv venv bench --python 3.12 --seed
source bench/bin/activate
uv pip install sglang==0.5.22
```

在一个终端里启动 vLLM 服务器。在第二个终端里，为每种并发各运行一次客户端。下面就是生成我们表格的命令：

```bash
for c in 1 2 4 8 16 32 64; do
  python -m sglang.benchmark.serving --backend vllm --port 8000 \
    --dataset-name random --random-input-len 512 --random-output-len 128 --random-range-ratio 1.0 \
    --max-concurrency $c --num-prompts $((c * 4 > 16 ? c * 4 : 16)) --seed 1 \
    --output-file sweep-c$c.jsonl --output-details
done
```

我们把这个循环跑了三次，分别用 `--seed 1`、`2` 和 `3`，报告中位数。使用 `--backend vllm` 时，客户端把每个请求发到 `/v1/completions`。它先发一个预热请求，并让服务器忽略序列结束 token，所以每个回答都有完整的 128 token。

每次运行都会打印一份包含四个数字的摘要。它们是输出吞吐、首 token 时间（TTFT）、每输出 token 时间（TPOT）和 token 间延迟（ITL）。把这四个数字放在一起看。只看吞吐会掩盖用户感受到的延迟。

## 读出拐点 {#s-benchmark-your-server-in-15-minutes-read-the-knee}

**拐点：** 延迟开始快速上升、而输出不再增长时的并发数。过了拐点，更多用户只会得到更慢的回答，服务器几乎写不出更多 token。

下面是 2026-10-21 在[满频会话](#l4-sessions)中，我们的 L4 用 BF16 的 `Qwen/Qwen3-8B` 跑出的扫描。每个数字都是三个种子的中位数。池是 24,096 token。

| 用户数，L4 满频会话 | 输出 tok/s | 中位 TTFT | 中位 TPOT | P99 ITL | 中位 SM 时钟 |
|---|---|---|---|---|---|
| 1 | 13.5 | 191 ms | 60.4 ms | 105 ms | 1,275 MHz |
| 8 | 112.8 | 253 ms | 65.8 ms | 67 ms | 1,485 MHz |
| 16 | 201.3 | 288 ms | 69.5 ms | 85 ms | 1,455 MHz |
| 32 | 275.1 | 1,800 ms | 101.8 ms | 613 ms | 1,275 MHz |
| 64 | 242.3 | 11,181 ms | 129.2 ms | 1,233 ms | 1,005 MHz |

在 16 个用户以内，每增加一个用户都会增加输出，而每 token 时间只从 60 ms 升到 70 ms。在这张表里，从 16 到 32 个用户，中位首 token 时间从 0.3 s 变成 1.8 s。P99 ITL 从 85 ms 变成 613 ms。

不要把这个跳变当作拐点。这次扫描在不同用户数之间没有重置 prefix cache，而且每个种子在每个用户数下发送的头几个 prompt 都相同。在 32 个用户以下，很多请求在 cache 里找到了自己的 prompt。2026-10-23 我们又跑了一次扫描，每次运行前都重置，并把时钟锁在 900 MHz：

```listing
title: median TTFT with and without a cache flush, Qwen3-8B on our L4 at 900 MHz
source: capture/gpu/out-l4/load-flushed-vs-unflushed.txt
lang: text
note: The median TTFT rows. The share that met the target and the P99 ITL lines are cut.
---
median TTFT, flushed against unflushed
users   vLLM                                   SGLang
4       650 / 145 ms (4.5x)                    532 to 645 / 141 ms (3.8 to 4.6x)
8       951 to 978 / 264 to 274 ms (3.6x)      1,174 to 1,273 / 173 to 178 ms (6.6 to 7.3x)
16      1,550 to 1,587 / 294 to 295 ms (5.3x)  1,804 to 1,944 / 218 ms (8.3 to 8.9x)
32      1,982 to 2,084 / 2,012 to 3,091 ms     3,216 to 3,228 / 2,710 to 2,917 ms
…
```

重置后，中位首 token 时间每一档都在上升。4 个用户时约 0.65 s，8 个时 1.0 s，16 个时 1.6 s。P99 ITL 从 8 个用户时的约 70 ms 跳到 16 个用户时的 522 ms。所以在这块卡上，拐点在 8 到 16 个用户之间。是 cache 把它掩盖了。请把生产并发设在你重置后测得的拐点之下。

在 64 个用户时，输出下降了。这里有两个原因叠加。每个请求 640 token，64 个用户需要的超过了 24,096 token 的池，所以请求在排队。GPU 也降频了，中位时钟是 1,005 MHz，而 16 个用户时是 1,455 MHz。我们的扫描无法把两者分开。

```figure
id: fig-5-1
kind: chart
title: the throughput peak of the old sweep
claim: Without a cache reset, output peaked at 275 tokens per second at 32 users, which is the throughput peak and not the latency knee.
caption: Users double at each step on the axis. The band spans the lowest and highest of three runs. The figure and the table show the same sweep of 2026-10-21, which had no cache reset. The latency knee with a reset is between 8 and 16 users, as the text says. From capture/gpu/summary/l4.json.
```

## 避开四个错误 {#s-benchmark-your-server-in-15-minutes-avoid-the-four-mistakes}

1. **复用热的 cache。** 使用随机数据集和固定种子时，第二次运行会发送相同的 prompt。prefix cache 会接住其中一部分，第二次运行就显得更快。下一节给出了操作规程。
2. **让模型提前停止。** 不加 `--ignore-eos` 时，有些回答会在达到输出长度之前结束。这样运行测到的 token 就比你要求的少。
3. **跳过预热。** 启动后的头几个请求要承担 kernel 编译和冷 cache 的代价。用 `--num-warmups`，或在测量前先发几个请求。
4. **忽略时钟。** 降频的 GPU，或与其他工作共享的 GPU，会跑得更慢。运行期间记录 `nvidia-smi --query-gpu=clocks.sm,temperature.gpu --format=csv -l 1`。只在时钟相近时比较两次运行。

## 在两次运行之间重置 prefix cache {#s-benchmark-your-server-in-15-minutes-reset-the-prefix-cache-between-runs}

prefix cache 保留之前 prompt 的 KV 块。它会在两次运行之间改变两件事：速度，以及有时贪心请求的输出。[可复现性页](#s-get-reproducible-outputs)展示了对输出的影响。

为了看出对速度的影响，我们用同一个种子、不重置，把同一负载跑了两次。这是 2026-10-22 和 2026-10-23 在我们 L4 节点的第二块 GPU 上进行的。我们用了 `Qwen/Qwen3-0.6B`，16 个用户发 64 个 prompt，输入 512 token，输出 128 token。那块 GPU 与其所有者共享，也没有锁频，所以请相信比值，而不是时间。

```listing
title: median TTFT in ms, the same load four times in a row
source: capture/gpu/out-l4/prefix-cache-flush.txt
lang: text
note: The vLLM row of the summary. The SGLang row is cut.
---
engine        fresh   repeat, not flushed   repeat after a flush   repeat, not flushed
…
vLLM 0.6B     925     148                   1,163                  184
```

不重置的重复运行读到的中位 TTFT 比全新运行低约 6 倍。重置之后，TTFT 回到了全新运行的水平。每 token 时间的变化不到 15%，因为 cache 命中省掉的是 prefill 工作，decode 工作保持不变。

对你要比较的每次运行都使用这套规程：

1. 每次运行都从空 cache 开始。重启服务器，或调用 `POST /reset_prefix_cache`。这个路由只在 `VLLM_SERVER_DEV_MODE=1` 时存在，而这种模式下的服务器绝不能对外暴露。
2. 每次运行都用新的 `--seed`，让随机数据集发送新的 prompt。
3. 记录命中 cache 的 token。在运行前后读取 `vllm:prefix_cache_hits_total` 和 `vllm:prefix_cache_queries_total`。
4. 如果要得到每个响应上的计数，用 `--enable-prompt-tokens-details` 启动服务器。然后读每个响应里的 `usage.prompt_tokens_details.cached_tokens`。
5. 把 cache 设置和命中的 token 数写在结果旁边。

`vllm bench sweep serve` 会在它的各次运行之间替你重置服务器 cache。

## 选择闭环还是固定速率 {#s-benchmark-your-server-in-15-minutes-choose-a-closed-loop-or-a-fixed-rate}

`--max-concurrency` 让固定数量的用户保持忙碌。服务器变慢时，用户会更晚发出下一个请求，所以负载会自己下降。这种闭环永远不会落后。

`--request-rate` 以固定速率发送请求，不管服务器跟不跟得上。超过服务器能承受的速率后，队列会增长，每个请求的首 token 都会更慢。真实流量更像固定速率。设定容量上限之前，两种都要跑。

## 使用 vLLM 客户端 {#s-benchmark-your-server-in-15-minutes-use-the-vllm-client}

vLLM 有自己的客户端 `vllm bench serve`。它报告同样的四个数字，而且不需要额外安装。在 0.31.0 中，`VLLM_USE_RUST_BENCH=1` 会运行同一个客户端的 Rust 版本。下面这个循环用它跑同样的扫描：

```bash
for c in 1 2 4 8 16 32 64; do
  vllm bench serve --model Qwen/Qwen3-8B \
    --dataset-name random --random-input-len 512 --random-output-len 128 \
    --max-concurrency $c --num-prompts $((c * 4 > 16 ? c * 4 : 16)) \
    --seed $c --ignore-eos --num-warmups 2 \
    --save-result --result-filename sweep-c$c.json
done
```

2026-10-23，我们按原样跑了这个循环，在我们 L4 节点共享的第二块 GPU 上使用 `Qwen/Qwen3-8B-FP8`。每次运行都完成并写出了结果文件。这块 GPU 在降频，所以我们不给出那次运行的数字。

2026-10-23，我们用 `Qwen/Qwen3-0.6B` 让三个客户端对同一个 vLLM 服务器进行测试：SGLang 客户端、`vllm bench serve` 和它的 Rust 版本。这是在我们 L4 节点共享的第二块 GPU 上。它的时钟在降频，但每次运行都保持在 420 到 495 MHz。每次运行前我们都重置 cache，并在两轮中交替使用各客户端。

```listing
title: output tok/s from three clients, two rounds each
source: capture/gpu/out-l4/bench-client-bias.txt
lang: text
note: The rows at 64 users from the throughput table. The other rows and the TTFT table are cut.
---
users   temperature   SGLang client    vllm bench       vllm bench, Rust
…
64      0             359, 348         379, 377         371, 365
64      0.7           331, 343         360, 363         356, 353
```

- **两个 vLLM 客户端结果一致。** `vllm bench serve` 的 Python 版和 Rust 版在 1、16 和 64 个用户时给出的数字在噪声范围内相同。
- **SGLang 客户端测得的服务器更慢。** 它的中位 TTFT 比 `vllm bench serve` 高 3% 到 10%。在 16 和 64 个用户时，它的输出吞吐低 2% 到 8%。在一个用户时，它有一轮读到的吞吐高于其他所有轮次，所以那里我们不给出吞吐差距。
- **prompt 不同。** 两个客户端从各自的随机数据集发出不同的 prompt token，所以一个小差距的一部分可能来自 prompt。
- **温度会改变结果。** 温度 0.7 比温度 0 的中位 TPOT 更高。一个用户时高 10% 到 13%，16 和 64 个用户时高 3% 到 6%。

所以我们用 SGLang 客户端、温度 0 测得的表格，可能比用 `vllm bench serve` 的运行慢几个百分点。选定一个客户端和一个温度，并在你要比较的每次运行中保持不变。

```takeaways
- 用同一个客户端扫描并发，把吞吐、TTFT、TPOT 和 ITL 放在一起看。
- 每次运行用新的种子，忽略结束 token，并先预热。
- 对每次要比较的运行，重置 prefix cache 并记录命中的 token。
- 记录 GPU 时钟，只在时钟相近时比较运行。
- 设定容量上限之前，既跑闭环，也跑固定请求速率。
- 在每个结果旁边写上客户端和温度。
```

Sources: vLLM documentation at v0.31.0 (docs/benchmarking/cli.md, docs/benchmarking/sweeps.md), the vLLM source at v0.31.0 (vllm/benchmarks/serve.py), capture/gpu/summary/l4.json (load.vllm-b), the sweep tool of the SGLang 101 manual (capture/gpu/sweep.py), the SGLang 0.5.22 benchmark client source (python/sglang/benchmark/serving.py, python/sglang/benchmark/datasets/random.py), capture/gpu/out-l4/prefix-cache-flush.txt, capture/gpu/out-l4/bench-client-bias.txt, capture/gpu/out-l4/livecheck-2026-10-23.txt, capture/gpu/out-l4/load-flushed-vs-unflushed.txt.
