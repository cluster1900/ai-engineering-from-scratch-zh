# KV connector 如何搬运 cache

> 本页解释 connector 接口和传输层。

有些部署需要把请求的 KV cache 放到计算它的 GPU 以外的地方。读完本节后，你能说出 KV connector 承担的工作，以及 disaggregated prefill 能带来什么、不能带来什么。

## 为什么要搬运 cache {#s-how-kv-connectors-move-the-cache-why-move-the-cache}

有三种部署需要它：

- **Disaggregated prefill。** 一个服务器计算 prompt，另一个服务器生成回答。KV cache 必须从第一个搬到第二个。
- **卸载。** GPU 上放不下的 block 被移到 CPU 内存或存储中。之后有请求需要相同的前缀时，它们再被搬回来。
- **共享 cache。** 几个服务器从同一个存储读取前缀，这样计算过一次的前缀能服务所有服务器。

## 一个接口，多种传输方式 {#s-how-kv-connectors-move-the-cache-one-interface-many-transports}

vLLM 把这些工作放在同一个接口后面，即 KV connector。scheduler 询问 connector 一个请求的哪些 block 可以从外部加载。然后它把这些 token 算作已计算，和 prefix cache 命中一样。worker 在每次前向计算前后请 connector 加载或保存 block。

在 0.31.0 中，仓库里有面向几种传输方式的 connector：

| Connector | 用什么搬运 cache |
|---|---|
| NIXL | NVIDIA 传输库，通过 RDMA 或网络 |
| Mooncake | Mooncake 传输引擎 |
| LMCache | LMCache 库，用于 CPU、磁盘和共享存储 |
| Offloading | 原生卸载到 CPU 内存 |
| MultiConnector | 两个或更多 connector 组合使用 |

用 `--kv-transfer-config` 设置 connector，它给出 connector 名称、服务器的角色和传输方式的选项。角色说明服务器是产出 cache、消费 cache，还是两者都做。

## disaggregation 能带来什么 {#s-how-kv-connectors-move-the-cache-what-disaggregation-buys}

vLLM 文档说，disaggregated prefill 不会提高吞吐。它给出了使用它的另外两个理由。你可以在不同的服务器上分别调优首 token 和流式输出。你还可以防止长 prompt 拖慢其他用户的流式输出，从而控制 token 间延迟的尾部。

代价是每个请求都要传输一次，还要运行更多机器。如果加载失败，默认策略是让请求失败。还有一个可选的重新计算策略。

## 接下来的方向 {#s-how-kv-connectors-move-the-cache-where-it-goes}

connector 接口是代码中最活跃的部分之一。2026 年 10 月，进行中的工作有三部分。一是不依赖 tensor-parallel 大小的 KV 卸载。二是为传输的 block 增加压缩层。最后是修复远程读取期间 block 被释放的问题。基于某个 connector 开发时要锁定版本，并先阅读它的未关闭 issue。

```takeaways
- KV connector 让 vLLM 能在计算 cache block 的 GPU 之外加载和保存它们。
- Disaggregated prefill 分别控制首 token 和流式输出，并不提高吞吐。
- 基于某个 connector 开发之前，先锁定版本并阅读未关闭的 issue。
```

Sources: the vLLM source at v0.31.0 (vllm/distributed/kv_transfer/, vllm/config/kv_transfer.py), vLLM documentation at v0.31.0 (docs/features/disagg_prefill.md, docs/features/nixl_connector_usage.md), vLLM issues 61886, 59538, and 61229.
