# 服务器对你的请求做了什么

> 每个请求都有代价不同的两个阶段，四个数字告诉你一台服务器如何为所有用户处理它们。

你在 [第 1.1 节](#s-install-sglang-and-serve-your-first-model) 发了两条请求，都在一秒内回来了。十个用户时，同一台服务器可能让其中一些人为了第一个字等上几秒。原因就在每个请求的两个阶段里。

读完本节后，你能说出一个请求的两个阶段，以及评判一台服务器的四个数字。你也能说清 SGLang 控制什么，以及什么留给模型和你。

## 两个阶段，两种代价 {#s-what-the-server-does-with-your-request-two-phases-with-two-different-costs}

**Prefill：** 对整段 prompt 做一次前向。它在一批里算出每个 prompt token 的 key 和 value，并产出第一个输出 token。**Decode：** 产出后续每个 token 的循环，每个请求的每个 token 一次前向。

两个阶段用 GPU 的方式不同。Prefill 每次有很多 token，所以算术单元忙得过来。Decode 每个请求每次只有一个新 token。

每一步 decode 都要读这一步需要的权重，以及缓存好的 key 和 value，却只做很少算术。对稠密模型，那是每一份权重。对 mixture-of-experts 模型，那是共享权重和 router 选中的专家。内存带宽决定 decode 速度，算力决定 prefill 速度。

我们在一台 Mac 上用 0.6B 模型测过这个差别。一段 512 token 的 prompt，中位首 token 时间是 163 ms。之后每个新 token 平均要 4.38 ms。

```listing
title: one request at a time, 512 tokens in and 128 tokens out
source: capture/out/bench-random-c1.txt
lang: text
note: Cut from the benchmark summary. The latency percentiles other than the median and the inter-token block are cut.
---
Max request concurrency:                 1         
Successful requests:                     16        
…
Median TTFT (ms):                        162.98    
…
Mean TPOT (ms):                          4.38      
```

也就是每个 prompt token 最多大约 0.32 ms，对上每个输出 token 的 4.38 ms，在这台 Mac 上大约 14 倍。0.32 ms 是上限，因为 TTFT 还包含排队和第一步 decode。在我们的 L4 上用 Qwen3-8B，这个倍数大约是 160：512 token 的 prompt 要 189 ms，对上每个输出 token 60 ms。服务引擎可以共享并跳过 prefill 的活。它主要把 decode 批在一起，好让一次读权重服务很多请求。[第 4.4 节](#s-speculative-decoding) 展示削减 decode 步的另一种办法。

```figure
id: fig-1-1
kind: comparison
title: prefill against decode on the capture Mac
claim: The median TTFT divided by the prompt length is about 0.32 ms per prompt token, and one output token costs 4.38 ms in decode.
caption: Read left to right. Both columns come from one benchmark run with one request at a time. From capture/out/bench-random-c1.txt.
```

## 四个数字 {#s-what-the-server-does-with-your-request-the-four-numbers}

用四个数字一起评判一台服务器。只给其中一个的报告几乎什么都没告诉你。

- **Time to first token (TTFT)：** 用户等到第一个字要多久。Prefill 和排队决定它。
- **Time per output token (TPOT)：** 首 token 之后，token 之间的平均间隔。**Inter-token latency (ITL)** 是同一间隔按逐个 token 量的，所以它的尾部能看出卡顿。Decode 决定这两者。
- **Throughput：** 所有用户合计的每秒输出 token 数。批处理决定它。
- **Goodput：** 同时满足 TTFT 目标和 TPOT 目标的每秒请求数。用户感觉到的是这个数字。

前三个彼此折损。更大的 batch 抬高吞吐，也让每个用户的 token 更慢。一大块 prefill 能更快跑完长 prompt，却会卡住同批里的每一次 decode。[第 5.1 节](#s-sglang-benchmark-serving) 在一次真实扫描里展示了这种折损。

SGLang 的基准工具打印 TTFT、TPOT、ITL 和吞吐。它在 0.5.22 不打印 goodput，所以要从每条请求的记录自己算。[推理指标一课](phases/17-infrastructure-and-production/08-inference-metrics-goodput) 会建起那个计算。

## SGLang 管什么，不管什么 {#s-what-the-server-does-with-your-request-what-sglang-owns-and-what-it-does-not}

SGLang 管的是从请求到 token 之间的时间。它决定算哪些 prompt token、复用哪些，以及每个请求何时运行。

```figure
id: fig-1-2
kind: layers
title: what SGLang owns
claim: SGLang owns tokenizing, scheduling, the KV cache, and the forward pass, while the model and the operator own quality, memory, and routing.
caption: Read top to bottom, from the client to the weights. Grey layers are outside SGLang. From the v0.5.22 source and capture/out/server-default.log.
```

有三样东西在外面。模型决定答案说什么。在我们的 Mac 上，一个 0.6B 模型被要求说出一颗行星，回答是 "Ardens"，那不是行星。SGLang 正确且快速地送出了那个答案，没有任何服务引擎能让模型变对。

你作为运维，决定 SGLang 拿到多少内存，以及请求去哪台机器。SGLang 为第二件事有单独的 router，[第 6.4 节](#s-sgl-model-gateway) 会讲。

## 一次请求的路径 {#s-what-the-server-does-with-your-request-the-path-of-one-request}

在 SGLang 内部，你的 `/generate` 请求穿过三个进程。Tokenizer manager 把文本变成 token id。Scheduler 在缓存里找到五个 prompt token 中的两个，并计算另外三个。Detokenizer 把新的 token id 变成文本。

调度器在一行里记下了它那一侧的请求：

```listing
title: the scheduler's view of the request on our L4
source: capture/gpu/out-l4/server-default.log
lang: text
note: The prefill line and the response line of the /generate request from section 1.1.
---
[2026-10-17 14:43:41] Prefill batch, #new-seq: 1, #new-token: 3, #cached-token: 2, token usage: 0.00, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 2.82
[2026-10-17 14:43:41] INFO:     127.0.0.1:58314 - "POST /generate HTTP/1.1" 200 OK
```

`#new-token: 3` 和 `#cached-token: 2` 加起来就是五个 prompt token。这一对是 SGLang 打印的最有用的一行。[第 3.4 节](#s-prefix-friendly-prompts) 单靠它找打不中缓存的 prompt。

```figure
id: fig-1-3
kind: sequence
title: one /generate request through the three processes
claim: The tokenizer manager, the scheduler, and the detokenizer each touched the request once, and the prefill computed 3 of 5 tokens.
caption: Read top to bottom. Numbers are from our L4 request in section 1.1. From capture/gpu/out-l4/generate.txt and capture/gpu/out-l4/server-default.log.
```

## 我们的立场 {#s-what-the-server-does-with-your-request-our-position}

按流量形状选 SGLang，绝不要按头条数字选。智能体、带固定 system prompt 的聊天，以及带固定 preamble 的检索，都共享长前缀。对那种流量，前缀缓存每个请求都省下 prefill 的活。如果每条 prompt 都唯一且很长，先在你自己的 prompt 上测两个引擎，再做决定。

不信任任何不写明版本的 SGLang 基准。网上最常被转的数字，「SGLang 比 vLLM 快 29%」，来自一次离线测试，它列出的是 SGLang v0.2.3 {{field AIMultiple 2026-01}}。[第 5.3 节](#s-reading-other-peoples-benchmarks) 展示独立测试在哪里一致，以及我们自己的对照运行。

要看调度器、缓存和每次前向如何做这些活，读第 2 到第 4 部分。从 [第 2.1 节](#s-sglang-serve-and-the-three-processes) 开始，它跟着请求穿过三个进程。

```takeaways
- 在给定并发下，同时报告 TTFT、TPOT、吞吐和 goodput。
- 预期 decode 每个 token 的代价是 prefill 的几十到几百倍。
- 调试每条请求时，检查调度器日志里的 #new-token 和 #cached-token。
- 当你的 prompt 共享前缀时选 SGLang，不共享时先测再选。
```

Sources: capture/out/bench-random-c1.txt, capture/out/generate.txt, capture/out/server-default.log, capture/gpu/out-l4/server-default.log; python/sglang/benchmark/serving.py and python/sglang/srt/entrypoints/http_server.py at v0.5.22; AIMultiple, "LLM Inference Engines" (https://aimultiple.com/inference-engines, 2026-01-25), capture/gpu/summary/l4.json (load.default)
