# 用 expert parallelism 部署 MoE 模型

> Expert parallelism 把 MoE 模型的各个 expert 分散到多块 GPU 上，而一块 GPU 仍然可以部署小型 MoE 模型。

你要部署一个 mixture-of-experts 模型。读完本节后，你能判断 expert parallelism 什么时候有帮助。

**我们的结果：** 一台 DGX Spark 不用 expert parallelism 就部署了 Qwen3-30B-A3B，64 个用户时每秒 239 个 token。

## 了解 MoE 模型带来的变化 {#s-serve-moe-models-with-expert-parallelism-know-what-changes-with-a-moe-model}

mixture-of-experts 层有很多 expert，而每个 token 只用其中少数几个。`Qwen/Qwen3-30B-A3B-Instruct-2507` 有 300 亿参数，每个 token 激活约 30 亿。所以模型需要容纳全部权重的内存，但每个 token 只消耗一小部分的算力。

## 模型放得下就从一个设备开始 {#s-serve-moe-models-with-expert-parallelism-start-with-one-device-if-the-model-fits}

在我们的 DGX Spark 上，一块 GB10 就以 BF16 容纳了整个模型。权重占 56.93 GiB，服务器在 64 个用户时给出 239.3 tok/s。一个设备不需要 GPU 之间的通信。如果模型和它的 KV cache 放得下，就从这里开始。

我们的解读：一个包含很多 token 的 batch 会用到很多不同的 expert，所以 batch 越大，一个 decode step 读取的权重就越多。在内存带宽有限的设备上，这使每个 token 的时间随 batch 增长。在我们的 GB10 上，每个 token 的中位时间从 1 个用户时的 32 ms 增长到 64 个用户时的 244 ms。

## 对大模型加上 expert parallelism {#s-serve-moe-models-with-expert-parallelism-add-expert-parallelism-for-large-models}

在一台有八块 GPU 的机器上，把 expert 分散到全部 GPU 上：

```bash
vllm serve <model> --data-parallel-size 8 --enable-expert-parallel
```

对于一台机器放不下的模型，例如大型 DeepSeek 模型，在每台机器上运行一条命令。这个例子用两台各有八块 GPU 的机器。先按 vLLM 文档中 expert parallel 指南的说明，在两台机器上安装 DeepEP 和 DeepGEMM。它们不在常规安装里，而使用 DeepEP backend 的服务器在没有 DeepEP 时会在启动阶段停止。第一台机器接收请求：

```bash
vllm serve <model> --enable-expert-parallel \
  --all2all-backend deepep_low_latency \
  --data-parallel-size 16 --data-parallel-size-local 8 \
  --data-parallel-address 192.168.1.100 --data-parallel-rpc-port 13345
```

第二台机器以 headless 方式运行，没有 API 服务器。它的起始 rank 是它之前各台机器上的 rank 总数：

```bash
vllm serve <model> --enable-expert-parallel \
  --all2all-backend deepep_low_latency \
  --data-parallel-size 16 --data-parallel-size-local 8 \
  --data-parallel-start-rank 8 \
  --data-parallel-address 192.168.1.100 --data-parallel-rpc-port 13345 \
  --headless
```

把地址设为第一台机器的 IP，两台机器使用相同的 RPC 端口。跨机器时，vLLM 文档使用 DeepEP kernel 来交换 token。

使用 expert parallelism 时，每块 GPU 持有一部分 expert，token 要被发送到持有其 expert 的 GPU 再发回来。attention 层在每块 GPU 上以 data parallel 方式运行。token 的 all-to-all 交换需要 GPU 之间的快速互联。

另外两个功能在大规模时有帮助：

- **Expert 负载均衡。** `--enable-eplb` 会移动繁忙的 expert 来分散负载，因为有些 expert 收到的 token 远多于其他 expert。
- **弹性 expert parallelism。** 它能在运行中的部署里增减 GPU。0.32 版本把它带到了 Model Runner V2。

这一点没有在我们的硬件上测量。我们每台机器只有一块 GPU，所以没有运行过 expert parallelism。

## 检查部署 {#s-serve-moe-models-with-expert-parallelism-check-the-setup}

在多 GPU 部署上，随着负载增长观察每个 token 的时间，并和同一个模型在更少 GPU 上的表现比较。如果每个 token 的时间比输出增长得更快，就是 GPU 之间的交换限制了 step。

```takeaways
- MoE 模型需要容纳全部 expert 的内存，但只需要少数几个 expert 的算力。
- 模型放得下就从一个设备开始，因为一个设备不需要交换。
- 对一台机器放不下的模型，在快速互联上使用 expert parallelism。
```

Sources: capture/gpu/summary/gb10.json (load.vllm), capture/gpu/out-gb10/server-load-vllm.log, vLLM documentation at v0.31.0 (docs/serving/expert_parallel_deployment.md), the vLLM source at v0.31.0 (vllm/config/parallel.py), the release notes for v0.32.0.
