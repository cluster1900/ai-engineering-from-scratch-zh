# 为什么 vLLM 运行三种进程

> 本页解释 API 服务器、engine core 和 worker，以及它们为什么是独立的进程。

用一块 GPU 运行 `vllm serve` 会启动三个进程，每增加一块 GPU，进程数就会增长。读完本节后，你能说出每个进程的名字和它负责的内容，并预测一个并行部署的进程数。

## 争抢同一个 CPU 的三项工作 {#s-why-vllm-runs-three-kinds-of-process-three-jobs-that-compete-for-one-cpu}

推理引擎要做三类工作。它处理 HTTP，并在文本和 token 之间来回转换。它决定下一个 step 运行哪些请求。它在 GPU 上运行模型。

在一个 Python 进程里，这些工作要轮流使用同一个解释器锁。服务器在对长 prompt 做 tokenize 时，scheduler 在等待，GPU 又在等 scheduler。在快速的 GPU 上，一个 decode step 只需要几毫秒。于是 step 之间几毫秒的 Python 工作，就会让 GPU 在很大一部分时间里闲置。

vLLM 给每项工作分配自己的进程：

| 进程 | 负责什么 | 数量 |
|---|---|---|
| API 服务器 | HTTP、OpenAI 路由、tokenize、多模态输入，以及发回客户端的流 | 默认一个，或每个 data-parallel rank 一个 |
| Engine core | scheduler、KV cache 管理器，以及把工作发给 worker 的循环 | 每个 data-parallel rank 一个 |
| GPU worker | 一块 GPU 上的权重和前向计算 | 每块 GPU 一个，所以每个 engine core 有 tensor 大小乘以 pipeline 大小个 |

API 服务器和 engine core 通过 ZeroMQ socket 交换消息。engine core 和它的 worker 共享内存队列。data-parallel 部署还会多一个进程，即让各个 rank 保持同步的 coordinator。

## 数一数进程 {#s-why-vllm-runs-three-kinds-of-process-count-the-processes}

vLLM 设计文档给出了进程数的公式。把 API 服务器、data-parallel engine core 和 GPU worker 加起来，data parallelism 再加一个 coordinator。用 `-tp 4` 启动的服务器运行一个 API 服务器、一个 engine core 和四个 worker，共六个进程。

出问题时这一点很重要。worker 里的崩溃会出现在 engine core 的日志里。tokenizer 慢会表现为首 token 时间很长、而 GPU 闲置。读日志时，先找出是哪个进程写的这一行。

```figure
id: fig-8-1
kind: tree
title: six processes for four GPUs
claim: A server with tensor parallel size 4 runs six processes: one API server, one engine core, and four GPU workers.
caption: Read from the top down. Each worker owns one GPU. From the vLLM design documents at v0.31.0.
```

## 为什么不用线程 {#s-why-vllm-runs-three-kinds-of-process-why-not-threads}

同一个 Python 进程里的线程共享解释器锁，所以消除不了等待。独立进程还让 vLLM 可以重启或替换其中一部分。仓库里还有一个用 Rust 写的实验性前端。它替代 Python API 服务器，通过同样的 socket 与同一个 engine core 通信。

独立进程有代价：每个请求和每个输出都要跨进程边界复制一次。和一个模型 step 相比，这次复制很小，所以这个设计接受了它。环境变量 `VLLM_ENABLE_V1_MULTIPROCESSING=0` 会改为在 API 服务器进程里运行 engine core。可复现指南在离线运行时使用它，因为单个进程能让调度顺序可重复。

```takeaways
- API 服务器、engine core 和 worker 各自运行在自己的进程里。
- 进程数等于 API 服务器加 engine core 加 GPU worker，data parallelism 再加一个 coordinator。
- 读一行日志之前，先找出是哪个进程写的。
```

Sources: the vLLM source at v0.31.0 (vllm/v1/engine/core.py, vllm/v1/engine/core_client.py, vllm/v1/executor/multiproc_executor.py, vllm/envs.py, rust/README.md), vLLM documentation at v0.31.0 (docs/design/arch_overview.md, docs/usage/reproducibility.md).
