# 拆分 prefill 和 decode

> 只有当长 prompt 拖累了其他用户的流式输出时，分开的 prefill 和 decode 服务器才划算。

长 prompt 会拖慢每个用户的流式输出。读完本节后，你能判断 disaggregated serving 什么时候划算。

## 了解它解决的问题 {#s-split-prefill-and-decode-know-the-problem-it-solves}

在一台服务器上，长 prompt 会和正在运行的流共享每个 step。在它计算期间，每个流等待下一个 token 的时间都会长一点。长 prompt 一多，所有人的最差 token 间隔都会变大。

Disaggregated serving 运行两种服务器。prefill 服务器计算 prompt 并构建它的 KV cache。decode 服务器接收这份 cache 并生成回答。这样长 prompt 就永远不会和流共享 step。

## 了解它解决不了的问题 {#s-split-prefill-and-decode-know-what-it-does-not-solve}

vLLM 文档说，disaggregated prefill 不会提高吞吐。它让你把首 token 和流式输出作为两个独立的数字来控制，并能控制 token 间延迟的尾部。代价是每个请求都要传输一次 KV cache，还要运行更多服务器。

即使对尾部，收益也是有条件的，而不是默认就有。论文 "Revisiting Disaggregated Large Language Model Serving for Performance and Energy Implications" 比较了拆分的服务器和同时运行两个阶段的服务器。它发现收益并无保证，取决于请求负载和搬运 KV cache 的路径。我们自己没有测量过这一点。

当 token 间延迟的第 99 百分位很重要、并且是长 prompt 造成的时，选它。不要为了在同样的 GPU 上服务更多用户而选它。在保留它之前，在真实负载下把它和同样 GPU 上的普通服务器做比较。

## 部署它 {#s-split-prefill-and-decode-set-it-up}

每个服务器在 `--kv-transfer-config` 中得到一个 KV connector 和一个角色。NIXL connector 是常见的选择。它需要 NIXL 库，而 vLLM wheel 不会安装它。先在 vLLM 所在的同一环境里安装它。0.31.0 的 vLLM requirements 锁定的版本是 1.4.1：

```bash
uv pip install nixl==1.4.1
```

prefill 服务器产出 cache，decode 服务器消费它。在一台有两块 GPU 的主机上，给每个服务器分配自己的 GPU、自己的端口和自己的 NIXL side channel 端口：

```bash
CUDA_VISIBLE_DEVICES=0 VLLM_NIXL_SIDE_CHANNEL_PORT=5600 \
vllm serve Qwen/Qwen3-8B --port 8100 \
  --kv-transfer-config '{"kv_connector": "NixlConnector", "kv_role": "kv_producer"}'
```

```bash
CUDA_VISIBLE_DEVICES=1 VLLM_NIXL_SIDE_CHANNEL_PORT=5601 \
vllm serve Qwen/Qwen3-8B --port 8200 \
  --kv-transfer-config '{"kv_connector": "NixlConnector", "kv_role": "kv_consumer"}'
```

每个服务器都会在启动日志中写出 `Creating v1 connector with name: NixlConnector` 和 `Initializing NIXL wrapper`。如果日志显示 `NIXL is not available`，说明环境里缺少这个库。

然后在前面放一个 router。对每个请求，router 先把它发给 prefill 服务器，并从响应中读取 KV 传输参数。然后它带着这些参数把请求发给 decode 服务器，让 decode 服务器能加载 cache。vLLM 仓库里有用于这种部署的示例脚本和一个 proxy。它自己的 CI 在成对的 L4 GPU 上测试这种部署。

如果 cache 传输失败，默认策略会让请求失败。把 `kv_load_failure_policy` 字段设为 `recompute`，则会改为在 decode 服务器上重新计算 prompt。

这一点没有在我们的硬件上测量。我们没有在两块 L4 上用 vLLM 运行过 disaggregated serving。

```figure
id: fig-6-3
kind: flow
title: prefill and decode on two servers
claim: A prefill server computes the prompt, and a KV connector copies its cache to a decode server that writes the tokens.
caption: Teal arrows move the KV cache. The dotted arrow is the token stream. From the vLLM documentation at v0.31.0.
```

## 确定两边的规模 {#s-split-prefill-and-decode-size-the-two-sides}

prefill 服务器和 decode 服务器的比例取决于你的 prompt 和回答长度。长 prompt 配短回答需要更多 prefill 容量。短 prompt 配长回答需要更多 decode 容量。在每一边测量首 token 和流式输出，并且一次只调动一台服务器。

```takeaways
- 拆分 prefill 和 decode 是为了保护流式输出不受长 prompt 影响，而不是为了提高吞吐。
- 每个服务器都需要一个 KV connector 和一个角色，由 router 把每个请求发给两边。
- 设置失败策略，因为默认会让请求失败。
- 在保留它之前，在真实负载下把它和同样 GPU 上的普通服务器做比较。
```

Sources: vLLM documentation at v0.31.0 (docs/features/disagg_prefill.md, docs/features/nixl_connector_usage.md), the vLLM source at v0.31.0 (vllm/config/kv_transfer.py, vllm/distributed/kv_transfer/), the vLLM CI configuration at v0.31.0 (.buildkite), Revisiting Disaggregated Large Language Model Serving for Performance and Energy Implications (arXiv 2601.08833), requirements/kv_connectors.txt at v0.31.0, the vLLM source at v0.31.0 (vllm/distributed/kv_transfer/kv_connector/factory.py, vllm/distributed/kv_transfer/kv_connector/v1/nixl/base_worker.py).
