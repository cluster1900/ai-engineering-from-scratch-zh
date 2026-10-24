# 保持 CUDA graphs 和 compile 开启

> 对大多数服务器来说，默认的 compile 级别就是对的，而 eager 模式会损失几个百分点的 decode 速度。

启动要花好几分钟，你想让它更快。读完本节后，你能判断每个 compile 级别和 eager 模式的代价。

**我们的结果：** 在我们的 L4 上，冷却后的运行中 eager 模式让每 token 时间增加了约 2%。在降频的运行中，`-O0` 让一个用户时慢了约 2%，`-O3` 与默认值持平。

## 了解这些开关 {#s-keep-cuda-graphs-and-compile-on-know-the-switches}

vLLM 用一个级别同时设定 compile 和 CUDA graphs，从 `-O0` 到 `-O3`。默认是 `-O2`。[compile 页](#s-how-compile-and-cuda-graphs-are-captured)解释了每个部分的作用。

| 设置 | Compile | CUDA graphs | 用途 |
|---|---|---|---|
| `-O2`，默认 | 开 | full 和 piecewise | 生产环境 |
| `-O3` | 在 0.31.0 中与 `-O2` 相同 | | 暂时没有额外作用 |
| `-O1` | 开，融合更少 | 只有 piecewise | 更快启动，同时保留 compile 和 graphs，我们没有测量 |
| `-O0` | 关 | 关 | 测试改动时快速启动 |
| `--enforce-eager` | 关 | 关 | 调试 kernel，因为它还会跳过 kernel 预热 |

## 读懂启动的代价 {#s-keep-cuda-graphs-and-compile-on-read-what-the-start-costs}

启动日志给出了每个部分的时间。在我们的 DGX Spark 上用 `Qwen3-30B-A3B` 时，两次 graph 捕获和 compile 在约八分钟的启动中占了约 96 秒：

```listing
title: graph capture and compile time at startup
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: The first two lines are the two capture passes. The last line gives the whole engine start and the compile share.
---
(EngineCore pid=143) INFO 10-21 10:59:45 [model_runner.py:1087] Graph capturing finished in 39 secs, took 1.17 GiB
(EngineCore pid=143) INFO 10-21 11:00:51 [model_runner.py:1087] Graph capturing finished in 38 secs, took 0.31 GiB
(EngineCore pid=143) INFO 10-21 11:00:53 [core.py:373] init engine (profile, create kv cache, warmup model) took 127.54 s (compilation: 18.67 s)
```

在那次启动中，加载权重花了约 330 秒，远多于 compile。之后的启动可以读取 compile 缓存，所以 compile 的占比会变小。

## 看我们的运行结果 {#s-keep-cuda-graphs-and-compile-on-see-what-our-runs-show}

**我们测得** 2026-10-21 在 L4 的[满频会话](#l4-sessions)中，用 `Qwen/Qwen3-8B` 比较了 eager 模式和默认设置。两次运行用的是同样的池、七种并发和三个种子，每次运行前都让 GPU 冷却。

```figure
id: fig-4-3
kind: chart
title: eager mode against the default
claim: On our L4, eager mode was 1.2 to 2.3 percent slower per token at every concurrency.
caption: Bands span the lowest and highest of three runs. The two lines sit close because an 8B decode step waits on memory, not on kernel launches. From capture/gpu/summary/l4.json.
```

| 用户数，L4 满频会话 | 中位 TPOT，默认 / eager | 中位 SM 时钟，默认 / eager |
|---|---|---|
| 1 | 60.36 / 61.07 ms | 1,275 / 1,290 MHz |
| 8 | 65.75 / 66.98 ms | 1,485 / 1,515 MHz |
| 32 | 101.79 / 103.11 ms | 1,275 / 1,313 MHz |
| 64 | 129.15 / 131.42 ms | 1,005 / 1,020 MHz |

在 1 到 32 个用户时，种子范围不重叠，所以这个差距是真实的，而且很小。在我们的 DGX Spark 上，eager 模式让每 token 时间增加了 2% 到 6%。

2026-10-22，我们又在[降频会话](#l4-sessions)中，以 1 个和 32 个用户测试了各 compile 级别。默认值跑了三个种子，另外两个级别各跑了两个。三者运行时 GPU 都在降频：一个用户时中位时钟是 210 MHz，32 个用户时是 450 到 548 MHz。

| 用户数，L4 降频会话 | 中位 TPOT，默认 / `-O0` / `-O3` |
|---|---|
| 1 | 104.14 / 106.48 / 104.15 ms |
| 32 | 142.67 / 142.04 / 143.85 ms |

在一个用户时，`-O0` 慢了 2.2%，种子范围不重叠。在 32 个用户时，三个级别重叠。`-O3` 与默认值持平，正如这个版本的代码所预期的那样。因为时钟很低，请把这些看作同一会话内的比较，而不是你会看到的速度。

## 做出决定 {#s-keep-cuda-graphs-and-compile-on-decide}

生产环境保留默认值。在我们的 DGX Spark 启动中，graphs 和 compile 花了约一分半钟，而缓存会让之后的启动更快。

当你在测试改动、需要频繁重启时，用 `-O0`。它跳过 compile 和 graph 捕获，在我们这里损失了约 2% 的 decode 速度。只在调试 kernel 时用 `--enforce-eager`，因为它还会跳过预热，所以启动后的头几个请求会很慢。

```takeaways
- 生产环境保留默认的 compile 级别。
- 只想更快启动时，用 -O0，而不是 eager 模式。
- 在 vLLM 0.31.0 中，-O3 与默认值相同。
```

Sources: capture/gpu/summary/l4.json (load.vllm-b, load.vllm-eager, load.vllm-fast-b, load.vllm-O0, load.vllm-O3), capture/gpu/summary/gb10.json (load.vllm, load.vllm-eager), capture/gpu/out-gb10/server-load-vllm.log, vLLM documentation at v0.31.0 (docs/design/optimization_levels.md), the vLLM source at v0.31.0 (vllm/config/model.py).
