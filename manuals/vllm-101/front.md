# 如何阅读本手册

> 本手册帮你用 vLLM 部署、规划容量、调优和排查开源模型，并为每个决策给出实测答案。

vLLM 文档告诉你每个参数做什么。本手册告诉你，对你的 GPU 和你的流量来说，哪些参数重要，以及我们改动它们之后发生了什么。

## 从这里开始 {#s-front-start-here}

下面这些命令会给你一个服务器：

```bash
uv venv --python 3.12 --seed
source .venv/bin/activate
uv pip install vllm==0.31.0 --torch-backend=auto
vllm serve Qwen/Qwen3-0.6B --reasoning-parser qwen3 2>&1 | tee server.log
curl http://localhost:8000/v1/models
```

在第二个终端里运行 `curl` 命令。[第 1 部分](#s-install-vllm-and-serve-your-first-model)会逐条讲解每个命令，以及你应该看到的输出。

## 读完本手册后你能做什么 {#s-front-what-you-can-do-after-this-manual}

- 安装 vLLM，部署一个模型，并读懂决定大多数答案的启动日志行。
- 预测你的 GPU 能容纳多少用户，并修复启动时的显存不足（out-of-memory）错误。
- 为你的流量挑出最重要的一两个参数，其余保持默认值。
- 根据测量结果判断 speculative decoding、FP8 或某个编译级别何时值得使用。
- 从你看到的症状出发，排查一个变慢或出错的服务器。

## 本手册写给谁 {#s-front-who-this-manual-is-for}

你已经通过 API 调用过模型，现在想自己部署一个开源模型。你知道 token 和 GPU 是什么。你没有读过推理服务引擎的代码，也不需要读。

## 各部分的顺序 {#s-front-how-the-parts-are-ordered}

第 1 到第 7 部分按你的工作顺序排列。你先启动服务器，再规划它的容量，按你的流量调优，加上加速功能，测量它，扩展它，最后在生产中运行它。每一页回答一个问题，并以一个检查结尾，证明改动生效了。

第 8 部分讲 vLLM 的内部原理。当某个默认值让你意外时再读它。参考页收录参数表、指标、故障索引和实验记录。

```parts
```

## 我们的测试环境 {#s-front-what-we-tested-on}

我们在 vLLM 0.31.0 上测试，用了一块 NVIDIA L4 和一台 DGX Spark。L4 部署 Qwen3-8B，DGX Spark 部署 Qwen3-30B-A3B。本手册中每个实测数字都会注明它来自哪台机器。[实验记录](#s-ref-lab-notes)给出随机种子、时钟频率和完整表格。

### 四个 L4 测试时段 {#l4-sessions}

L4 并不是以同一个速度运行。它的 SM 时钟会随温度以及节点上的其他任务变化。因此，同样的 Qwen3-8B 负载在不同时段得到不同的耗时。本手册中每张 L4 表格都会注明它的时段。只在同一个时段内比较两个数字。

| 时段 | 日期 | SM 时钟中位数 | 1 个用户，TPOT 中位数 | 32 个用户，输出 tok/s |
|---|---|---|---|---|
| 满频，每次运行前先降温 | 2026-10-17 至 2026-10-21 | 1,000 至 1,560 MHz | 60.4 ms | 273.9 至 275.1 |
| 降频 | 2026-10-22 | 1 个用户时 210 MHz，32 个用户时 450 MHz | 104.1 ms | 186.7 |
| 锁定在 900 MHz | 2026-10-22 | 881 至 900 MHz，1 个用户基线为 210 MHz | 99.0 ms | 208.8 |
| 共享 GPU，2,928 个 token 的缓存池 | 2026-10-22 | 368 至 450 MHz | 241.7 ms | 未运行 |

降频的 GPU 运行在满频以下，原因是它过热，或者它与其他任务共享功率。用 `nvidia-smi -lgc` 锁频只会设定最高时钟。它无法阻止过热的 GPU 降到锁定值以下。

Sources: vLLM documentation at v0.31.0 (docs/getting_started/quickstart.md, docs/features/reasoning_outputs.md), capture/gpu/summary/l4.json, capture/gpu/summary/l4-gpu1.json, capture/gpu/summary/gb10.json.
