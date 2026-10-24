# 让长会话保持低成本

> 旧的对话轮次只要还在 cache 里就不花任何代价，而 offload 能在 GPU 池满时保住它们。

长对话会随着增长而变慢。读完本节后，你能让之前的轮次保持缓存，而不必做一次完整的 prefill。

## 长会话为什么会变慢 {#s-keep-long-sessions-cheap-why-a-long-session-slows-down}

聊天的每一轮都会把整个对话重新发送一遍。没有 cache 时，服务器在每个请求上都要计算之前的每一轮，所以第一个 token 随着轮次增加而越来越慢。

只要之前的轮次还留在 cache 里，prefix cache 就能消除这部分成本。第 10 轮以与第 9 轮相同的 token 开头，所以第 9 轮的 block 会命中。只有新的用户消息和回答需要计算。

cache 只会保留一个 block，直到某个运行中的请求需要这块显存。在繁忙的服务器上，一个停顿了一分钟的用户发送下一轮时，他的 block 可能已经没了。这时整个对话要重新计算。

## 让 prompt 在各轮之间保持稳定 {#s-keep-long-sessions-cheap-keep-the-prompt-stable-across-turns}

命中需要相同的 token、相同的顺序：

- 按原样发送之前的轮次。不要在轮次之间裁剪、总结或重新格式化它们。
- 在整个会话中保持 system prompt 和 tool 列表不变。
- 如果必须缩短对话，从中间删掉整轮，而不是从开头删。开头的改动会让之后的每个 block 都未命中。

## 把 block offload 到主机内存 {#s-keep-long-sessions-cheap-offload-blocks-to-host-memory}

当 GPU 池太小、放不下空闲的会话时，vLLM 可以在丢弃 block 之前把它们复制到 CPU 内存。之后的请求从 CPU 内存重新加载它们，这比对长上下文做一次完整的 prefill 更快。

原生 offload 只需要一个参数，即要使用的 CPU 内存大小（单位 GiB）：

```bash
vllm serve Qwen/Qwen3-8B --kv-offloading-size 32
```

`--kv-offloading-backend` 选择实现。`native` 是默认值，使用 vLLM 内部的代码。`lmcache` 使用 LMCache 库，并且需要一个单独的 LMCache 服务器进程。offload 用 CPU 内存和 PCIe 传输时间来换取计算。

未在我们的硬件上测量。我们没有在 L4 或 GB10 上对比过从 CPU 内存重新加载与做一次 prefill 的时间。

## 在多台服务器之间使用共享 cache {#s-keep-long-sessions-cheap-use-a-shared-cache-across-servers}

当路由器后面有多台服务器时，用户的下一轮可能被发到一台从没见过之前轮次的服务器。有两种解决办法。把一个会话总是发到同一台服务器的路由器，能让命中保留在那台服务器上。通过 LMCache 或 Mooncake 这样的 KV connector 使用共享 KV 存储，可以让任何服务器加载这些 block。[KV connector 页](#s-how-kv-connectors-move-the-cache)解释了第二种。

## 检查会话 cache {#s-keep-long-sessions-cheap-check-the-session-cache}

发送一个对话的第 1 轮，然后发送开头带着第 1 轮的第 2 轮。在第 2 轮前后读取 prefix cache 计数器：

```bash
curl -s localhost:8000/metrics | grep -E "^vllm:(external_)?prefix_cache_(queries|hits)_total"
```

在第 2 轮期间，`vllm:prefix_cache_hits_total` 大约增加第 1 轮的长度，向下取整到完整的 16-token block。我们在一块 L4 上用 Qwen3-0.6B 检查过这一点。第 1 轮有 2,182 个 prompt token。在第 2 轮中，计数器增加了 2,176，也就是 136 个完整的 block。开启 offload 时，启动日志会写出 connector 的名字，原生后端是 `OffloadingConnector`。从 CPU 内存取回的 block 计入 `vllm:external_prefix_cache_hits_total` 计数器。

```takeaways
- 只要之前轮次的 block 还在池里，prefix cache 就让它们不花任何代价。
- 原样发送之前的轮次，绝不要改动对话的开头。
- 当空闲会话放不进 GPU 池时，把 block offload 到 CPU 内存。
```

Sources: the vLLM source at v0.31.0 (vllm/config/cache.py, vllm/config/vllm.py, vllm/v1/kv_offload/base.py, vllm/v1/kv_offload/config.py, vllm/v1/kv_offload/factory.py, vllm/v1/metrics/loggers.py, vllm/distributed/kv_transfer/kv_connector/factory.py), vLLM documentation at v0.31.0 (docs/features/kv_offloading_usage.md, docs/design/prefix_caching.md), capture/gpu/out-l4/livecheck-2026-10-22.txt.
