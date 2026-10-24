# Miles 从何而来

> Miles 在 2025 年 10 月作为 slime 的一份副本起步，此后发展出了自己的功能，所以请阅读它自己的发布说明。

了解 Miles 的前身之后，它会更好理解。它最初是 slime 的一份副本，slime 是智谱 GLM 团队的一个 RL 框架。它至今仍与 slime 共享大部分设计。

读完本节后，你能解释 Miles 与 slime 的关系，以及这对升级意味着什么。

## 先有 slime {#s-where-miles-came-from-slime-first}

slime 始于 2025 年 6 月。它把 Megatron 训练器与 SGLang rollout 引擎连接起来，中间有一个用于自定义数据生成的数据缓冲区。GLM 团队从 GLM-4.5 起就用它以强化学习训练自己的 GLM 模型。

## 分叉 {#s-where-miles-came-from-the-split}

| 日期 | 事件 |
|---|---|
| 2025-10-05 | slime 和 Miles 共享的最后一个 commit |
| 2025-10-09 | Miles 仓库从 slime 历史的一份副本开始 |
| 2025-11-19 | 第一篇公开的 Miles 文章，来自 RadixArk 团队 |
| 2026-08-18 | Miles v0.1.0 |
| 2026-09-26 | Miles v0.1.1 |
| 2026-10-09 | Miles v0.1.2，同一天 slime 发布 v0.4.0 |

RadixArk 是一家基于 SGLang 构建的公司，并表示会继续投入 SGLang。它的第一篇文章说，Miles 将专注于新硬件、大规模混合专家 RL 和生产环境的稳定性。文章还说，大多数新增内容会回馈给 slime。

## 它们已经分开多远 {#s-where-miles-came-from-how-far-they-have-grown-apart}

到 2026-10-20，Miles 有约 2,500 个 slime 没有的 commit，而 slime 有约 1,200 个 Miles 没有的 commit。截至那一天，Miles 有而 slime 没有的功能：

- 第三种训练器后端 torchtitan，与 Megatron 和 FSDP 并列。
- 通过 RDMA 的权重传输，以及一个由所有传输方法共享的更新驱动。
- 一个为 agent 轮次传入和传出 token 的会话服务器。
- MXFP8、NVFP4 和 INT4 训练配方。
- 多 LoRA 训练。
- 一个实验性的 Kubernetes 后端，以及一个用于测试的故障注入器。

slime 也走出了自己的路。它的 v0.3.0 添加了一个 agent 模块。它的 v0.4.0 只保留了同步模式和完全异步模式，并为 rollout 数据添加了自己的存储。

## 这对你意味着什么 {#s-where-miles-came-from-what-this-means-for-you}

- **阅读 Miles 的发布说明，而不是 slime 的。** slime 中存在的参数在 Miles 中可能不同，反之亦然。
- **使用镜像中的 SGLang。** Miles 运行一个带有 RL 钩子的、打过补丁的 SGLang。原版的 SGLang 发布并不具备全部这些钩子。
- **锁定镜像。** Miles 在每个发布周期合并了数百个 pull request。`latest` 标签会变动，所以要记录每次运行的 digest，如[第 6.4 节](#s-pick-an-image)所示。

```takeaways
- Miles 在 2025 年 10 月作为 slime 的一份副本起步，如今两者在许多功能上已有差异。
- 使用 Miles 镜像中的 SGLang 构建，而不是原版的 SGLang 发布。
- 在升级之前，阅读 Miles 的发布说明并锁定镜像 digest。
```

Sources: Miles and slime repositories and release notes; Miles launch post, 2025-11-19; Miles v0.1 post, 2026-08-18; slime README.
