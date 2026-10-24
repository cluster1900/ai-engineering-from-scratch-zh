# rollout 函数如何接入

> 生成、奖励、过滤和损失函数通过导入路径接入 Miles，所以一个新配方只需改代码，无需 fork。

每个 RL 配方都会改变一些东西：回答如何生成、如何打分、训练器保留哪些组。如果每项改动都需要 fork，每个团队都会背着自己的一份 Miles 副本。Miles 用一组参数避免了这一点，每个参数接收一个 Python 导入路径。

读完本节后，你能解释自定义函数接入一步中的哪个位置，并为你的改动选择最小的钩子。

## 路径如何变成函数 {#s-how-rollout-functions-plug-in-how-a-path-becomes-a-function}

这些参数中的每一个都接收形如 `my_package.my_module.my_function` 的路径。Miles 导入这个模块，并从中取出函数。Miles 还会先检查一个小型注册表，但只有它自己的测试会填充这个注册表。

所以你的函数放在你自己的文件里，位于 Miles 源码之外。把文件挂载进容器，或者把它安装成一个包，然后传入它的路径。

## 钩子，按一步中使用它们的顺序 {#s-how-rollout-functions-plug-in-the-hooks-in-the-order-a-step-uses-them}

| 钩子 | 参数 | 你的函数做什么 |
|---|---|---|
| Rollout | `--rollout-function-path` | 替换一步中的整个 rollout |
| 生成 | `--custom-generate-function-path` | 在默认 rollout 内为一个样本生成回答 |
| 奖励 | `--custom-rm-path` | 为一个样本打分 |
| 组过滤器 | `--dynamic-sampling-filter-path` | 以组为单位保留或丢弃一个提示的回答 |
| 缓冲区过滤器 | `--buffer-filter-path` | 选择离开缓冲区的组 |
| 样本过滤器 | `--rollout-sample-filter-path` | 决定哪些样本参与损失计算 |
| 数据缓冲区 | `--custom-async-data-buffer-path` | 在完全异步模式下替换已完成组的缓冲区 |
| 损失 | `--custom-loss-function-path`，配合 `--loss-type custom_loss` | 计算损失 |

## 使用最小的钩子 {#s-how-rollout-functions-plug-in-use-the-smallest-hook}

表中越往下的钩子替换的 Miles 部分越少。选择能覆盖你改动的最靠下的那个：

- 新的打分规则只需要奖励钩子。
- 多轮或调用工具的 agent 需要生成钩子。[第 3.3 节](#s-train-an-agent)展示了内置的生成函数。
- DAPO 风格的过滤器只需要组过滤器。Miles 内置了一个，它会丢弃每个回答得到相同奖励的组。
- 只有当一步本身的形态改变时，才替换整个 rollout。

更小的钩子能让 Miles 的其余部分继续为你工作：批处理、指标和差距检查。只有当生成函数支持时，部分 rollout 才能继续工作。内置的多轮和 agent 生成函数不支持，如[第 4.2 节](#s-handle-long-responses)所示。

## 只在没有合适钩子时才 fork {#s-how-rollout-functions-plug-in-fork-only-when-no-hook-fits}

有些团队 fork Miles 或 slime，以添加一个尚不存在的钩子。Miles 的 issue 跟踪器显示了这种模式：先是一个带回归测试的贡献者 fork，然后是一个 issue。如果你 fork，就让改动保持小，并把它提交回上游，这样你的 fork 就不会偏离主线。

```takeaways
- 把自定义函数写在你自己的文件里，并传入它的导入路径。
- 使用能覆盖你改动的最小钩子。
- 只为添加钩子而 fork，并把钩子提交回上游。
```

Sources: Miles function registry, rollout, reward, filter, data buffer, and loss arguments at main 08752a12; Miles issues 4238 and 3714 with their contributor forks.
