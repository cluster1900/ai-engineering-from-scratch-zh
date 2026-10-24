# 选择 tensor、pipeline 或 data parallelism

> Tensor parallelism 拆分放不下的模型，data parallelism 复制放得下的模型。

一块 GPU 不够用了。读完本节后，你能用一棵简短的决策树选出并行布局。

## 回答三个问题 {#s-choose-tensor-pipeline-or-data-parallelism-answer-three-questions}

| 问题 | 如果是 | 如果否 |
|---|---|---|
| 模型能放进一块 GPU，并留出你需要的 KV cache 空间吗？ | 用 data parallelism：每块 GPU 一份完整副本，`--data-parallel-size N`。输出随副本数增长。 | 把模型拆到多块 GPU 上。下一个问题决定拆在哪里。 |
| 拆分后的模型能放进一台机器吗？ | 把拆分留在机器内部。下一个问题决定布局。 | 跨机器加上 pipeline parallelism，做法见表格下方的列表。 |
| GPU 之间有 NVLink，并且 GPU 数量能均匀拆分模型吗？ | 用 tensor parallelism，`--tensor-parallel-size N`。 | 在机器内部用 pipeline parallelism，`--pipeline-parallel-size N`。 |

当模型需要不止一台机器时：

- 把 `--pipeline-parallel-size` 设为机器数，把 `--tensor-parallel-size` 设为每台机器的 GPU 数。
- tensor-parallel 大小必须能整除模型的 attention head 数。
- 如果每台机器的 GPU 数不能整除它，就用 `--tensor-parallel-size 1`，并把 pipeline 大小设为 GPU 总数。

```figure
id: fig-6-1
kind: decision
title: three questions
claim: Three questions pick the layout, and inside one machine the link between GPUs and the split pick tensor or pipeline parallelism.
caption: Start at the top and follow the answer. From the vLLM documentation at v0.31.0.
```

## 了解每种布局的代价 {#s-choose-tensor-pipeline-or-data-parallelism-know-what-each-layout-costs}

| 布局 | 拆分什么 | 通信 | 最适合 |
|---|---|---|---|
| Tensor | 把每一层拆到多块 GPU 上 | 每一层之后都要通信，所以需要 NVLink 这样的快速互联 | 一块 GPU 放不下、但在一台机器内的模型 |
| Pipeline | 把各层分成多个 stage，放在不同 GPU 上 | 每个 stage 边界通信一次 | 一台机器放不下的模型，或机器内 GPU 没有 NVLink |
| Data | 不拆分，每块 GPU 持有完整副本 | 副本之间不通信 | 让放得下的模型产出更多输出 |
| Expert | mixture-of-experts 模型的各个 expert | 在 expert 层之前和之后 | 大型 MoE 模型，见 [MoE 页](#s-serve-moe-models-with-expert-parallelism) |

Tensor parallelism 也会拆分权重和 KV cache，所以每块 GPU 给 cache 留的空间更多。当权重占满一块 GPU 的大部分时，两块 GPU 能容纳的 KV 池可以是一块的好几倍。

## 检查 GPU 之间的互联 {#s-choose-tensor-pipeline-or-data-parallelism-check-the-link-between-gpus}

Tensor parallelism 每一层之后都要发送数据。在只通过 PCIe 相连的 GPU 上，例如同一台主机里的两块 L4，这些流量的开销可能超过拆分带来的收益。vLLM 文档建议在这种机器上用 pipeline parallelism，因为它只在 stage 边界发送数据。Pipeline parallelism 也接受不能均匀拆分模型的 GPU 数量。在这种机器上，先把几种布局互相对比测量，再做选择。

这一点没有在我们的硬件上测量。我们没有在两块 L4 上用 tensor parallelism 或 data parallelism 运行过 vLLM。

## 启动第二台机器 {#s-choose-tensor-pipeline-or-data-parallelism-start-a-second-machine}

vLLM 可以用 Ray（多机时的默认方式）或它自己的多进程启动器，让一个服务器跨多台机器运行。这两种我们都没有运行过。下面的步骤来自 vLLM 0.31.0 文档，针对两台各有 8 块 GPU 的机器。

首先，检查 GPU 之间能否通信。vLLM 的故障排查指南里有一个简短的测试脚本，会运行 NCCL 和 Gloo 的 all-reduce 调用。在每台机器上把它保存为 `test.py`。在两台机器上同时运行它，第一台用 `NODE_RANK=0`，第二台用 `NODE_RANK=1`：

```bash
NCCL_DEBUG=TRACE torchrun --nnodes 2 --nproc-per-node 8 \
  --rdzv_backend=static --rdzv_endpoint=<head-ip>:29400 \
  --node-rank $NODE_RANK test.py
```

 当网络和驱动都正常时，每个进程会打印四行成功信息，第一行是 `PyTorch NCCL is successful!`。指南正文写的是另一行，所以以脚本实际打印的为准。

**使用 Ray。** vLLM 仓库里有一个 `run_cluster.sh` 脚本，会在每台机器上启动 vLLM 镜像和一个 Ray 节点。给每台机器一个私有网络上的独立 `VLLM_HOST_IP`。在第一台机器上运行：

```bash
bash run_cluster.sh vllm/vllm-openai:v0.31.0 <head-ip> --head ~/.cache/huggingface -e VLLM_HOST_IP=<head-ip>
```

在第二台机器上运行：

```bash
bash run_cluster.sh vllm/vllm-openai:v0.31.0 <head-ip> --worker ~/.cache/huggingface -e VLLM_HOST_IP=<worker-ip>
```

两个 shell 都要保持打开，因为关闭其中一个就会停掉集群。然后在容器内检查 Ray 能看到每个节点和 GPU：

```bash
ray status
```

只在一台机器上启动服务器。它会使用所有机器的 GPU：

```bash
vllm serve Qwen/Qwen3-30B-A3B-Instruct-2507 \
  --tensor-parallel-size 8 --pipeline-parallel-size 2 \
  --distributed-executor-backend ray
```

**不使用 Ray。** 在两台机器上用相同的模型和大小运行 `vllm serve`。第一台机器加上 `--nnodes 2 --node-rank 0 --master-addr <head-ip>`。第二台机器加上 `--nnodes 2 --node-rank 1 --master-addr <head-ip> --headless`，它只运行 worker，不运行 API 服务器。

机器之间的流量没有加密，而且能在对方机器上执行代码。把它限制在不受信任的机器无法访问的私有网络里。

## 数一数进程 {#s-choose-tensor-pipeline-or-data-parallelism-count-the-processes}

使用 data parallelism 时，vLLM 为每份副本启动一个 engine core，再加一个让它们保持同步的 coordinator。使用 tensor parallelism 时，它在一个 engine core 下为每块 GPU 启动一个 worker。[进程页](#s-why-vllm-runs-three-kinds-of-process)给出了具体数量。

## 对超长 prompt 使用 context parallelism {#s-choose-tensor-pipeline-or-data-parallelism-use-context-parallelism-for-very-long-prompts}

对于几十万 token 的 prompt，vLLM 可以用 prefill 和 decode 的 context parallelism 把一个序列拆到多块 GPU 上。只在问题出在单个长请求时使用它，而不是很多短请求时。

```takeaways
- 模型放得下时用 data parallelism，放不下时用 tensor parallelism。
- 要超出一台机器，就加上 pipeline parallelism，并先跑 NCCL 测试。
- 在一台机器内部，GPU 没有 NVLink 时用 pipeline parallelism。
- 在没有快速互联的 GPU 上，把 tensor parallelism 和 data parallelism 对比测量。
```

Sources: the vLLM source at v0.31.0 (vllm/config/parallel.py, vllm/engine/arg_utils.py, examples/ray_serving/run_cluster.sh), vLLM documentation at v0.31.0 (docs/serving/parallelism_scaling.md, docs/usage/troubleshooting.md, docs/serving/distributed_troubleshooting.md, docs/serving/data_parallel_deployment.md, docs/serving/context_parallel_deployment.md).
