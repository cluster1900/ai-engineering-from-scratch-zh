# 不停止训练也能运行评估

> 在训练引擎上评估会暂停 rollout，而一个独立的评估集群能避免暂停，代价是它自己的 GPU。

你希望每隔几步得到一个评估分数，比如在留出的数学集上的准确率。这种评估需要生成，而生成需要引擎。问题在于用哪些引擎。

读完本节后，你能选择评估在哪里运行，并把它设置好。

我们无法在单块 GB10 上测量专用集群，因为它需要自己的 GPU。本页内容来自 Miles 的源码和文档。

## 运行评估的三个地方 {#s-run-a-separate-eval-fleet-three-places-to-run-evaluation}

| 位置 | 如何选择 | 代价 |
|---|---|---|
| 训练引擎 | 默认 | 评估运行时 rollout 生产停止 |
| 专用集群 | `--eval-num-gpus N` | 任务中的 N 块 GPU 用于评估，训练从不为它停下 |
| 你自己的服务 | 把 `--eval-function-path` 设为检查点评估函数 | 只有检查点导出 |

你不能同时选择评估集群和面向你自己服务的检查点评估函数。[第 6.3 节](#s-survive-failures)中的 rollout 容错也不能与评估集群一起使用。

## 在训练引擎上评估 {#s-run-a-separate-eval-fleet-evaluate-on-the-training-engines}

设置间隔和数据：

```bash
-e MILES_EXTRA_ARGS="--eval-interval 10 --eval-prompt-data gsm8k_test /root/lab/datasets/gsm8k/test.parquet"
```

[第 1.1 节](#s-run-grpo-on-one-gpu)的启动器已经把 GSM8K 测试集下载到实验文件夹中。

评估运行时 rollout 会停止，已经在运行的请求会先完成。引擎已经持有当前权重，所以不会发生额外的权重传输。在一块 GPU 上以及评估集较小时使用这种模式。

这条命令在我们的 GB10 上没有成功。我们在一次 2 步的运行上用 `--eval-interval 1` 运行了两次。两次中，第一次评估都发送了 1,319 道测试题，路由器回复 `503 Service Unavailable`，任务在第 0 步之前就停止了。我们没有找到原因。在把评估加到长时间运行之前，先在一次 2 步的运行上测试它。

## 在专用集群上评估 {#s-run-a-separate-eval-fleet-evaluate-on-a-dedicated-fleet}

```bash
--eval-num-gpus 1 --eval-interval 10 --eval-hf-dir /dev/shm/miles_eval_hf --eval-prompt-data aime /root/lab/datasets/aime/aime.jsonl
```

先把你自己的评估文件放进实验文件夹。启动器不会下载 AIME。评估集群还需要自己的 GPU，所以我们的单 GPU 启动器无法启动它。

评估集群在自己的路由器后面运行自己的引擎。在每个评估步，训练器把一份检查点快照写到 `--eval-hf-dir`，交给评估集群，然后继续训练。评估集群加载这份快照。它不参与训练中的权重更新。

即使评估点在几步之后才完成，它仍会出现在它所属的那一步。`eval/lag_steps` 报告它晚了多少步完成。

评估集群的引擎会复制 rollout 引擎的每一项 `--sglang-*` 设置。用对应的 `--eval-sglang-*` 参数修改其中一项，例如 `--eval-sglang-mem-fraction-static 0.9`，因为评估集群不与训练共享 GPU。

## 按暂停的代价来选择 {#s-run-a-separate-eval-fleet-choose-by-the-cost-of-the-pause}

从训练引擎开始。当评估暂停占了步时间的很大一部分，并且你能腾出整块 GPU 时，再改用评估集群。放在 `/dev/shm` 中的暂存文件夹能让快照不落盘。

```takeaways
- 先用一次 2 步的运行在训练引擎上测试评估，因为它在我们的 GB10 上失败了。
- 当你能腾出 GPU 时使用专用集群，并关注 eval/lag_steps。
- 用 --eval-sglang-* 参数修改评估集群的引擎设置。
```

Sources: capture/gpu/miles_grpo.py; Miles main 08752a12 files docs/user-guide/fully-async.md, miles/utils/arguments.py, miles/backends/sglang_utils/arguments.py, miles/backends/sglang_utils/sglang_config.py, miles/ray/rollout/eval_fleet.py, miles/ray/rollout/eval_dispatch.py, miles/ray/rollout/rollout_executor.py, miles/rollout/checkpoint_eval.py; capture/gpu/out-gb10/tracker-eval-checks.txt (live check, 2026-10-23).
