# Overlap 调度器

> Overlap 调度器在 GPU 跑 batch N 的同时，在 CPU 上准备 batch N+1，在 v0.5.22 它是默认路径。

给一个简单的服务循环做 profile，你会在 decode 步之间的 GPU 时间线上找到空隙。每个空隙里，GPU 在等，而 Python 读采样到的 token、检查 stop string、释放内存、建下一批。小模型上一步 decode 只要几毫秒，所以一毫秒的空隙就是步长的很大一部分。

读完本节后，你能解释 SGLang 如何隐藏步之间的 CPU 活，并说出 overlap 何时关掉。你能决定 `--disable-overlap-schedule` 该不该出现在你的命令里。

## 代价：GPU 步之间的 CPU 时间 {#s-the-overlap-scheduler-the-cost-cpu-time-between-gpu-steps}

**Overlap 调度：** 在另一批的 GPU 活进行的同时，跑这一批的 CPU 活。

SGLang 团队在 v0.4 发行帖里描述了这个问题。Batch 调度、内存分配和前缀匹配让 GPU 在步之间空闲 {{team 2024-12}}。他们的答案是一个超前一批、并为下一批准备好全部元数据的调度器。他们报告因此有 1.1x 的吞吐收益 {{team 2024-12}}。那个数字是他们的主张，在他们的 GPU 上测得。

显而易见的修法是第二个线程，在第一个跑 GPU 时建 batch。Python 线程共享一个解释器，所以调度线程和前向线程会轮流。SGLang 先试过线程。从 2025 年 10 月的 pull request #11210 起，它改成在一个线程里用两条 CUDA stream {{code}}。

## 在 CUDA 上怎么工作 {#s-the-overlap-scheduler-how-it-works-on-cuda}

循环先在 GPU 上启动 batch N+1，然后在 CPU 上处理 batch N 的结果 {{code}}。GPU 永远不用等前一步的记账。

有一个问题。Batch N+1 需要 batch N 采样到的 token，而那些 token 在建 N+1 时还在 GPU 上。SGLang 用占位 token id 建 N+1。`FutureMap` 在 GPU 上用 N 的输出填上占位。CPU 在启动之前永远不需要读那些 token {{code}}。

```figure
id: fig-2-4
kind: timeline
title: the same three decode steps without and with overlap
claim: Without overlap the GPU waits for CPU bookkeeping after every step, and with overlap the CPU processes step N while the GPU already runs step N+1.
caption: Read left to right in time. Plum bars are GPU forward passes, blue bars are CPU work, grey hatched bars are idle GPU. The shape is schematic, the loop order is from event_loop_overlap at v0.5.22.
```

## 在 Mac 上怎么工作 {#s-the-overlap-scheduler-how-it-works-on-a-mac}

MLX 后端有自己的 overlap 循环，`event_loop_overlap_mlx` {{code}}。MLX 惰性求值，所以循环用 `mx.async_eval` 排队两个 decode graph。文档字符串说 GPU 在当前步之后立刻跑下一步，设备上没有调度空隙。当有 prefill 到来、请求完成，或等待队列有新活时，链条会断。然后循环建一个新的步。

调度器在 CUDA 和 MLX 上是同一个 Python 调度器。批处理、radix tree 记账，以及 [第 2.2 节](#s-the-scheduler-loop-and-schedule-policy) 里的日志行都一样。只有前向和 overlap 机制不同。

## 我们关掉它时发生了什么 {#s-the-overlap-scheduler-what-happened-when-we-turned-it-off}

SGLang 文档的 Apple silicon 页把 `--disable-overlap-schedule` 列为 MLX 后端的关键参数之一。我们把它加进服务器命令，并跑了并发 8 基准。服务器答完了自己的 warm-up 和基准的 warm-up。然后调度器在真实运行的第一批上死了。

```listing
title: the scheduler crash with --disable-overlap-schedule on MLX
source: capture/out/server-no-overlap.log
lang: text
note: The traceback is cut between the event loop and run_batch. File paths are from our checkout of v0.5.22.
---
[2026-10-16 14:07:15] Prefill batch, #new-seq: 1, #new-token: 1, #cached-token: 511, token usage: 0.00, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 0.39
[2026-10-16 14:07:16] Scheduler hit an exception: Traceback (most recent call last):
…
    scheduler.event_loop_normal()
…
  File "/private/tmp/sglang-research/sglang-v0.5.22/python/sglang/srt/managers/scheduler.py", line 4746, in run_batch
    self._relay_forward_payload(
  File "/private/tmp/sglang-research/sglang-v0.5.22/python/sglang/srt/managers/scheduler.py", line 4852, in _relay_forward_payload
    self.future_map.stash(future_indices, payload)
  File "/private/tmp/sglang-research/sglang-v0.5.22/python/sglang/srt/managers/overlap_utils.py", line 639, in stash
    self.output_tokens_buf[indices] = payload.bonus_tokens.to(
…
RuntimeError: Expected all tensors to be on the same device, but found at least two devices, mps:0 and cpu!
```

从栈底往上读。关掉 overlap 时，分发器选 `event_loop_normal`，通用循环。那个循环调用 `run_batch`，它仍然通过 overlap 机制的 `FutureMap` 中继采样到的 token。在 MLX 上缓冲区住在 Metal 设备上，采样到的 token 却到了 CPU，PyTorch 拒绝混用。MLX 的 overlap 循环不走这条路径，所以默认服务器永远到不了这里。

主进程随后关掉了一切。32 条基准请求全部失败：8 条在响应中被切断，24 条在服务器消失后连不上。

```listing
title: the client side of the crash
source: capture/out/no-overlap-bench-random-c8.txt
lang: text
note: The first characters of two of the 32 error lines, and the final line. Each error line holds a full traceback.
---
Warmup completed with 1 sequences. Starting main benchmark run...
…
requests.exceptions.ConnectionError: HTTPConnectionPool(host='0.0.0.0', port=30000): Max retries exceeded with url: /server_info (Caused by NewConnectionError("HTTPConnection(host='0.0.0.0', port=30000): Failed to establish a new connection: [Errno 61] Connection refused"))
```

它在我们这一次 MLX 录制里以这种方式失败。我们按发现的样子报告：平台文档推荐的旗标，在钉住的发行版上把平台弄崩了。

同一套 kit 配置在 CUDA 上没有错误，在 L4 和 GB10 上 64 条请求全部服务成功。每块卡在 8 个用户下各跑了一次 overlap 开和一次关。两次结果不一致：

| Card, model | Output tok/s, overlap on / off | Median TPOT, overlap on / off |
|---|---|---|
| L4, Qwen3-8B | 73.71 / 84.17 | 91.24 / 69.38 ms |
| GB10, Qwen3-30B-A3B | 78.92 / 73.59 | 97.30 / 103.21 ms |

在 L4 上，没有 overlap 的服务器快 14%，在 GB10 上慢 7%。这些是没有时钟记录的单次运行，所以烫卡可以解释任何一边。它们没有展示 SGLang 团队报告的 1.1x 收益，也没有证伪它。

## 同一根因的一次 GPU 事故 {#s-the-overlap-scheduler-a-gpu-incident-with-the-same-root}

在 CUDA 上，一位用户开着 overlap 跑，在 token usage 94% 时紧挨着 `KV cache pool is full` 撞上了分配失败 {{issue #14972}}。在 overlap 下，下一批在上一批的 token 还在算时就被规划了。收回必须考虑会在下一步才完成的请求。Pull request #15626 提出的修法未合并就关闭了。在 v0.5.22，调度器会把将按长度完成的请求从下一次 decode batch 里拿掉。它也会在完成中的请求将释放 KV 的那一步跳过收回 {{code}}。

两个故事有同一个教训。Overlap 是调度器脑子里时间线的第二份拷贝，每个功能都必须与它一致。

## 我们的立场 {#s-the-overlap-scheduler-our-position}

除非你自己卡上的测量说不该开，否则保持 overlap 开着。它是默认，设计就是为了隐藏你本来每一步都要付的 CPU 时间。我们在 CUDA 上的两次单次运行不一致，所以改之前先带时钟记录测两种设置。

关掉它只有一个理由：在你调试错误输出或挂起时把它排除掉。预期关掉的路径测试更少，依赖它之前先在你的硬件上测。SGLang 自己会在它不能工作的地方关掉 overlap，例如没有 MLX 的 Apple MPS，以及 CPU 上的 speculative decoding {{code}}。

```takeaways
- 除非你自己的测量说不该开，否则保持 overlap 调度器开着。
- 只用 --disable-overlap-schedule 来隔离 bug，并且先测。
- 在 v0.5.22 的 MLX 上不要加 --disable-overlap-schedule。
- 从栈底读 scheduler traceback，找到失败的组件。
```

Sources: python/sglang/srt/managers/scheduler.py (event_loop_overlap, event_loop_normal, _dispatch_event_loop_once, run_batch, _relay_forward_payload, update_running_batch), python/sglang/srt/managers/overlap_utils.py (FutureMap.stash), python/sglang/srt/hardware_backend/mlx/scheduler_mixin.py (event_loop_overlap_mlx) at v0.5.22; docs/docs/hardware-platforms/apple_metal.mdx at v0.5.22; LMSYS, "SGLang v0.4: Zero-Overhead Batch Scheduler", 2024-12-04, https://lmsys.org/blog/2024-12-04-sglang-v0-4/; pull request https://github.com/sgl-project/sglang/pull/11210; issue https://github.com/sgl-project/sglang/issues/14972 and pull request https://github.com/sgl-project/sglang/pull/15626; capture/out/server-no-overlap.command.txt, server-no-overlap.log, no-overlap-bench-random-c8.txt, capture/gpu/out-l4/bench-random-c8.txt, capture/gpu/out-l4/no-overlap-bench-random-c8.txt, capture/gpu/out-gb10/bench-random-c8.txt, capture/gpu/out-gb10/no-overlap-bench-random-c8.txt
