# 把 rollout 和训练拆分到不同的 GPU

> 在多块 GPU 上，rollout 和训练可以在不同的设备上运行，由一种传输方法在它们之间搬运权重。

在一块 GPU 上，训练器和引擎轮流运行，权重更新是 GPU 内部的一次复制。在多块 GPU 上你有选择：让两边留在同一批 GPU 上轮流运行，或者给每一边各自的 GPU，并把权重发送过去。

读完本节后，你能为多 GPU 的运行选择一种布局和一种权重传输方法。

我们无法在单块 GB10 上测量这些。本页内容来自 Miles 的源码和文档。

## 选择布局 {#s-split-rollout-and-training-choose-a-placement}

| 布局 | 参数 | 使用的 GPU | 每一边是否等待另一边 |
|---|---|---|---|
| 共置 | `--colocate` | 训练器 GPU 和 rollout GPU 中较多的那一方 | 是，每一步都等 |
| 拆分 | 不加 `--colocate` | 训练器 GPU 加上 rollout GPU | 是，除非你运行异步训练 |

用这些参数设置大小：

- `--actor-num-nodes` 和 `--actor-num-gpus-per-node` 设置训练器 GPU。
- `--rollout-num-gpus` 设置拆分布局中的 rollout GPU。
- `--rollout-num-gpus-per-engine` 设置每个 rollout 引擎使用多少块 GPU。

从共置开始。只有当 rollout 阶段占了一步的大部分时间，并且你有 GPU 可以分给它时，才拆分。拆分布局会让训练器 GPU 在 rollout 期间空闲，除非你同时运行异步训练，如[第 4.1 节](#s-run-rollout-and-training-at-once)所述。

## 选择权重的搬运方式 {#s-split-rollout-and-training-choose-how-the-weights-move}

在拆分布局中，每次更新之后权重都会离开训练器 GPU。`--update-weight-transfer-mode` 选择传输方法：

| 方法 | 做什么 | 需要 |
|---|---|---|
| `broadcast`，默认 | 通过 NCCL 逐个发送每个张量 | 不需要额外条件 |
| `broadcast_packed` | 把每个桶打包成一次发送 | Megatron 训练器和拆分布局 |
| `p2p` | 用 Mooncake 通过 RDMA 搬运权重 | Mooncake 和 RDMA 网络 |
| `disk-delta` | 只把变化的字节写到共享文件夹，由每个引擎加载 | `--update-weight-disk-dir` |

在 `--colocate` 下，Miles 改用 GPU 内部的复制，传输模式不适用。

## 选择训练器 {#s-split-rollout-and-training-choose-the-trainer}

本手册使用 FSDP 训练器，因为它能原样加载 Hugging Face 模型文件夹。Miles 还有另外两种训练器，由 `--train-backend` 选择：

| 训练器 | 模型输入 | 模型并行 | LoRA |
|---|---|---|---|
| `megatron`，默认 | Megatron `torch_dist` 检查点，从 Hugging Face 文件夹转换一次得到 | 张量、流水线、上下文和专家并行 | 是 |
| `fsdp` | Hugging Face 文件夹 | 否。它把权重和优化器状态分片到数据并行的 GPU 上，每块 GPU 仍运行完整的层 | 否 |
| `torchtitan` | Hugging Face 文件夹，限于 torchtitan 实现了的模型 | 张量、流水线、上下文和专家并行 | 否 |

本手册中的一些功能只在 Megatron 上有效：带 `--colocate` 的完全异步训练、训练容错、MTP 训练，以及 `--ci-test` 的第 0 步检查。Miles 文档推荐在大模型和多节点任务上使用 Megatron。

**torch_dist：** Megatron 的检查点格式。它不依赖并行布局，所以你之后可以改变布局而无需重新转换。

在第一次 Megatron 运行之前，把模型转换一次。架构参数来自 Miles 中该模型的模型文件，这里是 `qwen3-4B`：

```bash
cd /root/miles
MODEL_ARGS=$(python3 miles/utils/external_utils/model_args_utils.py qwen3-4B)
PYTHONPATH=/root/Megatron-LM python3 tools/convert_hf_to_torch_dist.py $MODEL_ARGS --hf-checkpoint /root/lab/models/Qwen3-4B --save /root/lab/models/Qwen3-4B_torch_dist
```

在容器内运行这些命令，并像[第 1.1 节](#s-run-grpo-on-one-gpu)那样挂载实验文件夹。我们的启动器只构建 FSDP 运行。对于 Megatron，请从 Miles 源码 `scripts` 文件夹中适合你模型的启动器开始。我们没有在 GB10 上运行 Megatron 或 torchtitan 训练器。我们只为 Qwen3-0.6B 运行了到 `torch_dist` 的转换，它写出了检查点文件夹。

## 在多个节点上启动运行 {#s-split-rollout-and-training-start-a-run-on-more-than-one-node}

在 Miles 提交任务之前，每个节点都必须处在同一个 Ray 集群中。Miles 的启动器用以下两种方式之一做到这一点：

- 每种节点角色一条命令。`worker` 命令加入头节点的集群并等待。`train` 命令启动头节点，等待所有 GPU 就绪，然后提交任务。
- 在头节点上运行一条命令，它通过 ssh 连接其他主机并把它们加入集群。

要使用你自己启动的 Ray 集群，请设置 `MILES_SCRIPT_EXTERNAL_RAY=1`。启动器随后会跳过自己的 `ray start`，只提交任务。在每个节点上把 `MASTER_ADDR` 设为头节点的地址，让 Ray 和训练器使用正确的网络接口。然后用 `--actor-num-nodes` 和 `--actor-num-gpus-per-node` 设置训练器的大小。

[第 6.3 节](#s-survive-failures)列出了某些启动器在使用你自己的 Ray 集群时的一个已知问题。我们没有在多个节点上运行过 Miles。

## 拆分之后要测量什么 {#s-split-rollout-and-training-what-to-measure-after-the-split}

- `perf/update_weights_time` 与 `perf/step_time` 的对比。在多台机器上，传输不再是单块 GPU 内部的复制。
- 每一边的空闲时间，来自 `perf/train_wait_time` 和 rollout 计时器。
- 使用新方法完成第一次更新后，训练器和引擎之间的差距，如[第 5.2 节](#s-check-the-first-step)所述。

```takeaways
- 从共置开始，只有当 rollout 占了一步的大部分时间时才拆分。
- 保持 broadcast，直到权重传输占了一步中的很大一部分。
- 拆分之后，测量更新时间和两边的空闲时间。
- 在确定运行规模之前先选好训练器，因为只有 Megatron 支持模型并行和 LoRA。
```

Sources: Miles main 08752a12 files docs/user-guide/training-backend.md, docs/user-guide/launch-script.md, miles/utils/external_utils/command_utils/ray_backend/backend.py, miles/utils/lora/arguments.py, tools/convert_hf_to_torch_dist.py, scripts/models/qwen3-4B.py, miles/ray/placement_group.py, miles/utils/arguments.py, miles/backends/training_utils/weight_update/protocol.py, miles/backends/training_utils/weight_update/protocols/broadcast.py, miles/backends/training_utils/weight_update/protocols/delta.py, miles/backends/training_utils/metrics/perf.py, docs/advanced/disaggregated-rollout.md, docs/advanced/p2p-weight-transfer.md; capture/gpu/out-gb10/live-check-summary.txt (live check, 2026-10-23).
