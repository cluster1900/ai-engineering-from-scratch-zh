# 在故障之后让长时间运行继续下去

> 在多台机器上的长时间运行会丢失引擎和节点，Miles 为此提供了容错和检查点。

一块 GPU 上的运行以简单的方式失败，你重启它就行。在数百块 GPU 上跑几天的运行，途中一定会丢掉某个引擎或节点。问题在于你会随之丢掉多少运行进度。

读完本节后，你能为长时间运行设置检查点和容错，并在依赖它们之前先测试它们。

我们无法在单块 GB10 上测试容错。在一块 GPU 上，引擎死掉就意味着运行死掉，如[第 1.2 节](#s-add-a-watchdog)所示。本页内容来自 Miles 的源码和发布说明。

## 先保存检查点 {#s-survive-failures-save-checkpoints-first}

检查点限制了你在故障后重启时丢失的工作量。当存储出故障、某个检查点损坏时，或者对于最后一个检查点之后的步，它们都帮不上忙。先设置好它们，再做其他事。

容器以 `--rm` 启动，所以容器内的文件夹会随它一起消失。为检查点挂载一个主机文件夹，并在[第 1.1 节](#s-run-grpo-on-one-gpu)的运行中加上两行：

```bash
-v "$HOME/miles-lab/ckpt:/ckpt" -e MILES_EXTRA_ARGS="--save /ckpt/run-a --save-interval 20 --load /ckpt/run-a"
```

`--save-interval` 按步计数。根据步时间来选择它，让一次崩溃丢失的工作少于你能接受的量。步时间为五分钟时，间隔 12 最多丢失一小时。

## 从检查点恢复 {#s-survive-failures-resume-from-a-checkpoint}

故障之后，用一个新的日志文件再次启动同一条命令，比如 `> runs/plain-resume.log`。[第 1.1 节](#s-run-grpo-on-one-gpu)的重定向会清空旧日志，而你需要旧日志来查找故障原因。`--load` 指定父文件夹，而不是其中某个 `iter_` 文件夹。Miles 读取它的跟踪文件来找到最后保存的步。第一次运行时，文件夹是空的，Miles 会从头开始。

使用本手册的 FSDP 训练器时，恢复会还原运行的以下部分：

- 模型权重和优化器状态
- 学习率调度和随机状态
- 步数，所以运行会从下一步继续
- 在提示数据中的位置，由 rollout 一侧保存在训练器状态旁边

恢复后的运行日志应显示 `[FSDP] Loaded model from` 和 `[FSDP] Loaded optimizer from`，每条都带有该步的文件夹。如果缺少这些行，说明运行是从头开始的。我们第一次用空文件夹运行时，没有打印任何关于缺少检查点的消息。在我们的恢复检查中，加载之后训练器的第一行是 `step 2`。

在长时间运行开始之前，先在一次短运行上测试重启。Miles 总会在最后一步之后保存，所以用 `MILES_NUM_ROLLOUT=2` 运行上面的命令。然后用 `MILES_NUM_ROLLOUT=4` 再运行一次。第二次运行的第一条步行应是 `step 2`，而不是 `step 0`。我们在 GB10 上用 Qwen3-0.6B 运行了这项测试，它通过了。我们还在第 2 步的检查点上运行了下面的转换器，它写出了一个包含权重和分词器文件的模型文件夹。

## 把检查点转换为可部署的格式 {#s-survive-failures-convert-a-checkpoint-for-serving}

FSDP 训练器写出的是 PyTorch 分布式检查点，其他工具无法原样加载它们。Miles 有一个转换到 Hugging Face 模型文件夹的转换器。在容器内运行它：

```bash
python3 /root/miles/tools/convert_fsdp_to_hf.py --input-dir /ckpt/run-a/iter_0000020 --output-dir /root/lab/models/run-a-step-20 --origin-hf-dir /root/lab/models/Qwen3-0.6B
```

`--origin-hf-dir` 为转换器提供基础模型的配置和分词器。Megatron 训练器写出自己的格式，[第 6.1 节](#s-split-rollout-and-training-choose-the-trainer)列出了它的转换器。

## 打开容错 {#s-survive-failures-turn-on-fault-tolerance}

```bash
--use-fault-tolerance --ft-components rollout
```

`--ft-components` 选择 Miles 监视并替换的部分：`rollout`、`train` 或两者。不加这个参数时，Miles 监视 `rollout`。在我们运行的 Miles 版本中，每个部分都有限制：

- rollout 容错不能与专用评估集群一起使用，也不能与 `--fully-async --colocate` 一起使用。
- 训练容错会打开独立的数据并行组，而这些组需要 Megatron 训练器。

2026-10-20 的 Miles main 改变了这一点。它把 `weight_update` 加为第三个部分。它还规定 rollout 容错只能在拆分布局上配合 `p2p` 权重传输使用。在复制命令之前，先阅读你的镜像中的参数帮助。

## Miles 团队的报告 {#s-survive-failures-what-the-miles-team-reports}

Miles 团队为测试构建了一个故障注入器。他们的发布说明报告了一次 rollout 引擎崩溃的运行。它的损失曲线与一次没有崩溃的运行逐位一致。那是他们在自己硬件上的测试。在信任它之前，先在你自己的设置上重复一次崩溃测试。

## 已知问题 {#s-survive-failures-known-problems}

- Miles issue 跟踪器中的一份报告涉及六个 agent 示例启动器。每个启动器都以一次清理开始，这次清理会停止命令行中含有 `sglang` 的所有进程。在 `MILES_SCRIPT_EXTERNAL_RAY=1` 下，这次清理也会停止你启动的 Ray 集群。使用这些启动器时，请删除这次清理，或者给 Miles 一个它自己的 Ray 集群。
- 在没有容错的情况下引擎死掉后，训练器会继续向它发送请求，并且永远不会失败。给每次运行都加上看门狗。

```takeaways
- 为检查点挂载一个主机文件夹，并在一次短运行上测试重启。
- 在长时间运行之前，先阅读你的镜像参数帮助中关于容错的限制。
- 在长时间运行之前，先在你自己的设置上测试一次引擎崩溃。
```

Sources: Miles main 08752a12 files miles/backends/fsdp_utils/checkpoint.py, miles/ray/rollout/rollout_executor.py, miles/rollout/data_source.py, tools/convert_fsdp_to_hf.py, docs/user-guide/training-backend.md, miles/utils/arguments.py, docs/advanced/fault-tolerance.md, miles/ray/placement_group.py, miles/backends/training_utils/checkpoint/io.py, miles/utils/test_utils/fault_injector.py, compared with miles/utils/arguments.py at main ee36bb2a of 2026-10-20; Miles release notes v0.1.2; Miles issue 3649; capture/gpu/out-gb10/engine-died-503.log; capture/gpu/out-gb10/resume-check.txt (live check, 2026-10-23).
