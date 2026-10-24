# 保持异步调度开启

> 对大多数生成模型，异步调度默认是开启的，而少数设置会在不报错的情况下关闭它。

你读到了异步调度，想知道要不要设置它。读完本节后，你能检查你的服务器是否在用它，并说出哪些设置会关闭它。

**我们的结果：** 在一块降频的 L4 上，关闭异步调度让一个用户时每 token 慢了约 3%。请把它看作未确认的结果，因为时钟很低，而且我们只有两个种子。

## 了解它做什么 {#s-leave-async-scheduling-on-know-what-it-does}

没有异步调度时，每一步按顺序运行。调度器选出一个 batch，GPU 运行它，调度器读取结果后再选下一个 batch。调度器工作时，GPU 在等待。

有了异步调度，调度器在 GPU 还在运行当前 batch 时就选出下一个 batch。它把尚未采样的 token 记作占位符，这样就不会让一个请求超出它的 token 上限。GPU 在两步之间空闲的时间更少。[Model Runner V2 页](#s-what-model-runner-v2-changed)解释了为什么新的 model runner 让这成为可能。

## 知道它什么时候开启 {#s-leave-async-scheduling-on-know-when-it-is-on}

在 vLLM 0.31.0 中，这个设置有三个值。`--async-scheduling` 开启它，`--no-async-scheduling` 关闭它，不加参数则由 vLLM 决定。不加参数时，vLLM 会开启它，除非出现下列情况之一（还有其他情况）：

- 模型是 pooling 模型，例如 embedding 模型。
- 投机方法是 n-gram、suffix、Medusa 或 MLP speculator。EAGLE、MTP、DFlash 和 DSpark 方法、GPU n-gram 方法以及 draft 模型都会保持它开启。
- 开启了流水线并行，并且运行的是旧的 model runner。
- executor 不支持它。

在这些情况下，vLLM 会关闭它。大多数情况下它会在日志里写一条警告，但对 pooling 模型只写一行 debug 信息。服务器照常运行，所以这个变化很容易被忽略。添加投机方法或改变并行布局之后，请读一下启动日志。

## 看同一设置的两次运行差多少 {#s-leave-async-scheduling-on-see-how-much-two-runs-of-one-setting-differ}

2026-10-21，我们在[满频会话](#l4-sessions)中用 `Qwen/Qwen3-8B` 跑了两次 L4 负载扫描。一次不加参数，一次加 `--async-scheduling`。对这个不用投机解码的模型，这个参数设定的就是默认值本来的设定，所以两次运行是同一个设置。

两次运行的输出最多相差 1.8%，每 token 时间最多相差 0.8%。它们的种子范围在每种并发下都重叠。所以在这块卡上，两个配置之间几个百分点的差距，除非种子范围分开，否则只是运行间的波动。[实验笔记](#s-ref-lab-notes)里有完整表格，配置名是 `vllm-b` 和 `vllm-async`。

## 看关闭它的代价 {#s-leave-async-scheduling-on-see-what-turning-it-off-costs}

**我们测得** 2026-10-22 在我们 L4 节点的[共享 GPU 会话](#l4-sessions)中，用 `Qwen/Qwen3-8B` 比较了 `--no-async-scheduling` 和默认设置。那块 GPU 只有 2,928 token 的池，所以我们测了 1 个和 4 个用户。

| 用户数，L4 共享 GPU 会话 | 中位 TPOT，开 / 关 | 输出 tok/s，开 / 关 | 中位 SM 时钟，开 / 关 | 种子数，开 / 关 |
|---|---|---|---|---|
| 1 | 241.7 / 249.6 ms | 3.98 / 3.87 | 375 / 368 MHz | 2 / 2 |
| 4 | 272.6 / 277.2 ms | 13.02 / 12.85 | 428 / 450 MHz | 2 / 1 |

在一个用户时，关闭异步调度让每 token 时间增加了 3.3%，种子范围不重叠。这个差距大于同一设置两次运行之间 0.8% 的差别。但那个波动是我们在另一块满频 GPU 上测的。在四个用户时，它增加了 1.7%，只有一个种子。

GPU 运行在 368 到 450 MHz，远低于满频。一个用户、关闭异步调度的运行时钟低了 2%，接近效应本身的大小。所以请把它看作未确认的结果。在这些 batch size 下收益很小，我们也没有在满频或高并发下测试。

## 做出决定 {#s-leave-async-scheduling-on-decide}

不加参数，让 vLLM 来选。如果你加了投机方法或流水线并行，就在日志里找那条警告。如果出现了警告，就测量有无该功能时的每 token 时间，因为启用这个功能时你也一并失去了异步调度。

```takeaways
- 不加参数，让 vLLM 开启异步调度。
- 添加投机解码或流水线并行之后，在启动日志里找那条警告。
- 种子范围重叠的小差距，看作运行间的波动。
```

Sources: capture/gpu/summary/l4.json (load.vllm-b, load.vllm-async, load.vllm), capture/gpu/summary/l4-gpu1.json (load.vllm-fast-b, load.vllm-no-async), the vLLM source at v0.31.0 (vllm/config/scheduler.py, vllm/config/vllm.py, vllm/v1/core/sched/async_scheduler.py), vLLM documentation at v0.31.0 (docs/design/model_runner_v2.md).
