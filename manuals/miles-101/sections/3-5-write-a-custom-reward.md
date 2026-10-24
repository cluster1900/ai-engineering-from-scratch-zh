# 编写自定义奖励函数

> 自定义奖励用一个参数就能接入，而带小数的奖励需要检查 advantage 是如何中心化的。

奖励决定了模型学到什么。Miles 有一组内置奖励，当没有一个适合你的任务时，你可以指定自己的函数。

读完本节后，你能接入自己的奖励函数，并在长时间运行之前检查它的 advantage。

我们还没有在 GB10 上测量过自定义奖励。我们的运行用的是内置的 `math` 奖励，答案正确给 1，否则给 0。

## 先看内置奖励 {#s-write-a-custom-reward-check-the-built-in-rewards-first}

`--rm-type` 选择一个内置奖励。你最可能用到的是这些：

| `--rm-type` | 分数 |
|---|---|
| `math` | 答案与标签一致时为 1，否则为 0 |
| `dapo` | 答案正确为 1，否则为 -1，以 dict 返回，所以需要 `--reward-key score` |
| `deepscaler` | DeepScaleR 基于规则的分数 |
| `f1` | 与标签的 F1 重合度 |
| `gpqa` | GPQA 多选题的分数 |
| `remote_rm` | 来自 `--rm-url` 处 HTTP 奖励服务的分数 |

给数学类型加上前缀 `boxed_`，例如 `boxed_math`，就只对 `\boxed{}` 里的答案评分。

## 接入你自己的函数 {#s-write-a-custom-reward-plug-in-your-own-function}

在主机上把函数保存为 `~/miles-lab/my_rewards.py`。容器里看到的是 `/root/lab/my_rewards.py`：

```python
import re


def last_number(text):
    found = re.findall(r"-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?", text.replace(",", ""))
    return float(found[-1]) if found else None


async def custom_rm(args, sample, **kwargs):
    answer = last_number(sample.response)
    label = last_number(str(sample.label))
    return 1.0 if answer is not None and answer == label else 0.0
```

这个示例给数字答案评分。它把答案中的最后一个数和标签按数值比较。所以答案 142 不会匹配标签 42。对于不是数字的答案，请修改提取方式。

然后给[第 1.1 节](#s-run-grpo-on-one-gpu)的运行加上两项设置。`PYTHONPATH` 让 Miles 能从实验文件夹导入这个文件，而参数通过导入路径指定函数：

```bash
-e PYTHONPATH=/root/lab -e MILES_EXTRA_ARGS="--custom-rm-path my_rewards.custom_rm"
```

启动脚本会把 `PYTHONPATH` 传给负责给回答打分的 Ray worker。导入成功时，第一行 `rollout 0` 会显示由你的函数计算出的 `rollout/raw_reward`。

如果 Miles 找不到这个文件，日志会显示 `ModuleNotFoundError: No module named 'my_rewards'`。出现这个错误后，运行不会自己停下。在我们的测试中，任务挂了两个小时，一个 rollout 步也没有。watchdog 没有停掉它，因为这段时间里引擎只写了 44 行 `503 Service Unavailable`。看到这个错误时，停掉容器，修好 `PYTHONPATH`，再重新开始运行。

用 `async def` 编写函数。参数帮助里给出的是普通函数，但 Miles 会 await 它的结果，所以普通函数会失败。函数接收运行参数和一个样本，回答在 `sample.response` 里，标签在 `sample.label` 里。如果它返回 dict，就用 `--reward-key` 指定存放奖励的字段。使用 `--group-rm` 时，Miles 改为把整组作为样本列表传入，函数必须为每个样本返回一个奖励。

## 在运行前测试它 {#s-write-a-custom-reward-test-it-before-the-run}

在运行前，在容器里调用这个函数。下面的命令给一个回答打分：

```bash
docker run --rm -v "$HOME/miles-lab:/root/lab" -e PYTHONPATH=/root/lab radixark/miles:latest python -c "import asyncio, types, my_rewards; s = types.SimpleNamespace(response='So the answer is 42.', label='42'); print(asyncio.run(my_rewards.custom_rm(None, s)))"
```

它应该打印 `1.0`。然后在你手工打过分的十个回答上运行这个函数。其中要包括一个正确回答、一个错误回答、一个空回答，以及一个在长度上限处被截断的回答。一个遇到空回答就崩溃的奖励，可能让整步的 rollout 停下。

## 检查小数奖励的 advantage {#s-write-a-custom-reward-check-the-advantages-of-fractional-rewards}

GRPO 从每个回答中减去所在组的平均奖励，再除以该组的标准差。当一组里每个回答拿到的奖励都相同时，每个 advantage 都应该是 0，这一组什么也教不了。

Miles issue tracker 里的一份报告显示，对某些小数这一点不成立。在 float32 下，16 个 0.3 的平均值并不恰好是 0.3，所以会留下一个很小的余数。除以接近 0 的标准差会把它放大：每个回答约 0.029。0 或 1 的二元奖励不会遇到这个问题，因为它的平均值是精确的。

如果你的奖励会给出小数，找出每个回答奖励都相同的组，检查它们的 advantage 是否为 0。如果不是，就把奖励舍入到 float32 能精确表示的值，例如 0.25 的倍数。

```takeaways
- 有合适的内置奖励时就用它，因为它已经测试过。
- 把自定义奖励写成 async 函数，并在十个手工打分的回答上测试它。
- 检查小数奖励相同的组，确认它们的 advantage 为 0。
```

Sources: Miles reward hub, function loader, and reward arguments at main 08752a12; Miles launcher PYTHONPATH handling in the Ray backend at main 08752a12; capture/gpu/miles_grpo.py; Miles issue 4019; capture/gpu/out-gb10/custom-rm-noenv-hang.txt (live check, 2026-10-23).
