# 让运行之间保持可比

> 一次无法与其他运行比较的运行什么也教不了你，所以在启动之前就记录每次运行用了什么。

项目进行两周后，你会想知道为什么上周二的运行比今天的学得更快。只有两次运行记录了相同的事实，你才能回答这个问题。

读完本节后，你能记录每次运行，以便之后进行比较，也能重放某一步来调试它。

## 为每次运行记录这些事实 {#s-keep-runs-comparable-record-these-facts-for-every-run}

| 事实 | 我们如何记录 |
|---|---|
| 镜像 digest | `docker image inspect`，如[第 1.1 节](#s-run-grpo-on-one-gpu-pull-the-image-and-record-what-you-pulled)所述 |
| Miles commit 和 SGLang 版本 | 从镜像内部读取 |
| 完整命令 | 启动器会打印它，并且我们保留脚本 |
| 种子 | `--seed` 和 `--rollout-seed` |
| 训练器日志和引擎日志 | 每次运行一个日志文件，不与其他运行混在一起 |
| GPU 温度和暂停 | 温度保护日志，如[第 1.2 节](#s-add-a-watchdog-guard-the-gpu-heat)所述 |
| 退出码 | 每次运行一行状态 |

把引擎日志和训练器日志放在一起。在我们遇到的四次故障中，一次始于引擎，三次始于训练器，所以两者你都需要。

## 每次运行只改一处 {#s-keep-runs-comparable-change-one-thing-per-run}

只有当两次运行仅有一项设置不同时才比较它们。我们第一次卸载运行同时改变了卸载设置和引擎内存比例，结果显示 rollout 快了 12%。同一天只改变卸载设置的一对运行显示快了 1% 至 3%。[第 2.2 节](#s-choose-what-to-offload)给出了两者。

在相同的步号上比较时间。rollout 时间随回答长度变化，而随着模型学习，回答会变短。仅仅因为这个原因，不同步上的中位数就可能不同，如[第 5.3 节](#s-repeat-a-run)所示。

## 保存重放某一步所需的数据 {#s-keep-runs-comparable-save-what-you-need-to-replay-a-step}

Miles 可以保存一次运行的数据，让你能在没有另一部分的情况下重放其中一部分：

- `--save-debug-event-data` 写出每一步的事件。我们的每次运行都保留了这些数据。
- `--save-debug-rollout-data` 写出 rollout 样本。用 `--load-debug-rollout-data` 和 `--debug-train-only` 加载它们，就能在没有引擎的情况下用同样的样本再次训练。
- `--debug-rollout-only` 只运行引擎一侧。

重放是测试某项损失或奖励改动最快的方法。每次重放看到的都是相同的样本，所以差异来自你的改动，而不是来自采样器。

```takeaways
- 为每次运行记录镜像 digest、commit、命令、种子和两份日志。
- 每次运行只改一项设置，并保留一次同一会话中的基线。
- 计划测试训练改动时保存 rollout 数据，并用 --debug-train-only 重放它。
```

Sources: capture/gpu/out-gb10/image-identity.txt; capture/gpu/miles_grpo.py; capture/gpu/heat-guard.sh; Miles debug arguments at main 08752a12.
