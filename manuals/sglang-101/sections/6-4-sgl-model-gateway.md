# sgl-model-gateway 与缓存感知路由

> 有好几台服务器时，路由器决定你的缓存命中率，所以把每段对话送回已经持有其前缀的那台服务器。

你启第二台服务器来加倍容量。吞吐升了，可长对话的首 token 时间变差。每台服务器有自己的 KV cache，聊天的第 5 轮去了从没见过第 1 到 4 轮的那台。那台服务器又把整段历史 prefill 一遍。[第 3.4 节](#s-prefix-friendly-prompts) 量过一台服务器上前缀未命中的代价。忽略前缀的路由器故意制造同样的未命中。

读完本节后，你能解释 `sgl-model-gateway` 如何为每条请求选服务器。你也能为你的流量选路由策略，并检查网关是否保住命中率。

## 请求被路由的两个地方 {#s-sgl-model-gateway-two-places-where-requests-get-routed}

SGLang 在两个地方路由请求，默认不同。

**一台服务器内部：** `--dp-size` 大于 1 时，数据并行控制器把请求分给各份副本。它的默认方法 `auto` 在非拆分场景解析成 `round_robin` {{code}}。轮询忽略前缀，像 [图 6.1b](#fig-6-1b) 展示的那样。

**服务器前面：** `sgl-model-gateway` 是一个单独的 Rust 程序，路由到很多 SGLang 服务器。它在 2025-12-05 的 pull request [#14312](https://github.com/sgl-project/sglang/pull/14312) 之前叫 `sgl-router`，为了 "less confusion"。它的默认策略是 `cache_aware` {{code}}。

一份现场报告展示了差别。Jarvislabs 发现默认路由把每条请求轮流送到下一块 GPU。它不看一段对话的缓存在哪里 {{field Jarvislabs 2026-08}}。

在他们的流量上，23% 的输入 token 被再算一遍。一个把每段对话钉到一块 GPU 的请求头，把缓存命中率从 64.7% 抬到 92.1%，并把中位 TTFT 砍半。他们的 [帖子](https://jarvislabs.ai/blog/managed-endpoints) 没有点名做轮询的组件。服务器内默认匹配他们的描述。

## cache_aware 如何选服务器 {#s-sgl-model-gateway-how-cache-aware-picks-a-server}

网关为每个模型保留一棵近似 radix 树。每个树节点记录哪些服务器见过那个前缀。树存的是请求文本的字符，不是 token，所以网关从不跑 tokenizer 来路由 {{code}}。

**Match rate：** 新请求与树匹配的字符数，除以请求长度。

```figure
id: fig-6-4
kind: decision
title: how cache_aware picks a server
claim: The gateway checks load balance first, then sends a request to the server with the longest match only when more than 30 percent of its text matches.
caption: Read top to bottom. Amber boxes are tests, blue boxes are outcomes, and both outcomes insert the request text into the tree. Defaults from the gateway command line at v0.5.22.
```

对每条请求，`select_worker` 做三件事 {{code}}：

1. 它检查平衡。两个测试都通过时系统不平衡。最忙服务器的负载比最轻的高超过 64，并且超过最轻的 1.5 倍。然后请求去最轻的服务器。
2. 否则它算匹配率。高于 0.3 时，请求去最长匹配的服务器。
3. 低于 0.3 时，请求去最轻的服务器，平局时随机选。

网关然后在选中的服务器下插入请求文本。每 120 秒，一个后台任务删掉最近最少使用的叶子，直到每棵树最多 67,108,864 个节点 {{code}}。

策略文件顶部的注释说低匹配去 "the worker with smallest tree size"。代码把它送到负载最轻的 worker。代码说了算，本手册描述代码。

## 树是猜测 {#s-sgl-model-gateway-the-tree-is-a-guess}

网关从不问服务器缓存了什么。它的树记下它把文本送到哪里，服务器之后可以逐出那个前缀。所以网关可以把请求送到已经不再持有其前缀的服务器。那条请求然后像任何其他未命中一样 prefill。用 [第 5.2 节](#s-the-metrics-endpoint) 的 `sglang:cache_hit_rate` 在服务器上检查命中率，不要只看路由决定。

## 要紧的设置 {#s-sgl-model-gateway-settings-that-matter}

| Flag | Default | Effect |
|---|---|---|
| `--policy` | `cache_aware` | also `random`, `round_robin`, `power_of_two`, `prefix_hash`, `manual` |
| `--cache-threshold` | 0.3 | the match rate above which prefix affinity wins |
| `--balance-abs-threshold` | 64 | the load gap that marks the system as imbalanced |
| `--balance-rel-threshold` | 1.5 | the load ratio that marks the system as imbalanced |
| `--eviction-interval` | 120 | seconds between tree cleanups |
| `--max-tree-size` | 67108864 | tree nodes kept per model |
| `--prometheus-port` | 29000 | the gateway's own metrics |
| `--request-timeout-secs` | 1800 | the longest request the gateway waits for |

全部默认来自 v0.5.22 发布里的网关源码 {{code}}。那份源码说版本 0.3.2。仓库里最新的网关标签 `gateway-v0.3.1` 指向 2026-01-08 的一次提交。按你跑的提交钉网关，不要按那个标签。

源码里还有 `bucket` 和 `consistent_hashing` 策略。命令行在 v0.5.22 不接受它们。对两台普通服务器，启动命令是 `python -m sglang_router.launch_router --worker-urls http://127.0.0.1:30000 http://127.0.0.1:30001 --policy cache_aware`。

## 我们的立场 {#s-sgl-model-gateway-our-position}

对轮次共享长前缀的聊天和智能体流量用 `cache_aware`。对带唯一 prompt 的批流量用 `power_of_two` 或 `round_robin`，因为匹配率低于 0.3 反正没有亲和。不要把多轮流量放在默认轮询的服务器内 `--dp-size` 后面。在网关后面跑分开的服务器，或设不同的 `--load-balance-method`。

SGLang 团队在 v0.4 引入了缓存感知路由器 {{team 2024-12}}。他们报告吞吐最多高 1.9 倍，命中率好 3.8 倍。那是他们工作负载上的数字。改前后量你自己的命中率。

## 把路由器和引擎钉在一起 {#s-sgl-model-gateway-pin-the-router-with-the-engine}

一位用户报告在 GB200 NVL72 上用 DeepSeek-R1 时 SGLang 吞吐回退了两倍（[issue #22095](https://github.com/sgl-project/sglang/issues/22095)）。回退在 SGLang 外面的路由器里。同一份 SGLang 构建下，Dynamo router 0.8.1 给了每秒 132,140 个 token，Dynamo router 1.0.0 给了 69,767。把路由器和引擎当成一个系统基准，并钉住两个版本。

第二个事故展示路由和服务发现会互相影响。有拆分和 Kubernetes 服务发现时，`cache_aware` 以 "Failed to select prefill/decode worker" 失败，用户切到了轮询（[issue #10608](https://github.com/sgl-project/sglang/issues/10608)）。该 issue 已关闭，我们找不到关掉它的修法。在依赖一种策略之前，测你精确的部署模式。

## 要量什么 {#s-sgl-model-gateway-what-to-measure}

在改策略前后，比较每台服务器上的 `sglang:cache_hit_rate`。在端口 29000 上看网关自己的指标，留意重试和开路。网关默认对失败请求最多重试 5 次，并在 10 次失败后打开一台服务器的熔断 {{code}}。TTFT 上升而命中率下降，意味着请求不再到达持有其前缀的服务器。关于生产里网关的更广视角，见 [AI gateways](phases/17-infrastructure-and-production/19-ai-gateways) 一课。

```takeaways
- 对聊天流量，把好几台 SGLang 服务器放在带 cache_aware 策略的 sgl-model-gateway 后面。
- 对多轮对话，避免服务器内轮询数据并行。
- 当 prompt 不共享长前缀时，用 power_of_two 或 round_robin。
- 在服务器上检查 sglang:cache_hit_rate，因为网关树是猜测。
- 把路由器和引擎一起基准并钉住。
```

Sources: sgl-model-gateway/src/main.rs, sgl-model-gateway/src/policies/cache_aware.rs, sgl-model-gateway/Cargo.toml, python/sglang/srt/arg_groups/serving_hook.py (handle_load_balance_method), and python/sglang/srt/managers/data_parallel_controller.py, all at v0.5.22. Pull request #14312, issues #22095 and #10608. Jarvislabs, "Managed Endpoints", 2026-08-26. LMSYS, "SGLang v0.4", 2024-12-04.
