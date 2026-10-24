# 用工具调用和多轮对话训练 agent

> agent rollout 有很多轮和工具调用，Miles 通过一个按名字选择的 generate 函数来运行它们。

数学 rollout 是一个 prompt 加一个回答。agent rollout 则是一段对话：模型写一段、调用工具、读取结果、再接着写。每一轮都会加入新的 token，训练器必须严格按引擎生成时的样子给它们打分。

读完本节后，你能为 agent 配方选一个起点，并知道哪些设置能让它的各轮保持一致。

我们还没有在 GB10 上跑过 agent 配方。本页内容来自 Miles 的源码和示例。

## 从示例开始 {#s-train-an-agent-start-from-an-example}

Miles 有几个 agent 配方，其中两个在 experimental 文件夹里。选出最接近你任务的那个，再改它的工具和数据：

| 示例 | agent 做什么 |
|---|---|
| `retool_v2` | 写 Python，在沙箱里运行，并在推理过程中使用输出 |
| `search-r1`，实验性 | 在多轮中调用搜索工具 |
| `swe-agent-harbor-docker` | 在本地 Docker 沙箱里完成代码和终端任务 |
| `tau-bench`，实验性 | 用工具调用服务一个模拟客户 |

`retool_v2` 还有一个用 `--fully-async --num-gpus-per-node 1` 在单 GPU 上运行的模式。对单 GPU 实验来说，这是最接近的起点。

## 选择 generate 函数 {#s-train-an-agent-choose-the-generate-function}

每个样本的 rollout 来自一个 generate 函数。Miles 内置了三个：单轮、多轮和 agent 式工具调用。用 `--custom-generate-function-path` 指定你自己的函数，它接受一个 Python 导入路径。

generate 函数接收一个样本、它的采样设置和 router 地址。它负责填好这个样本：token、来自引擎的 log 概率，以及一个 loss mask。loss mask 标出模型自己写的 token，只有这些 token 计入 loss。工具输出是上下文，不是模型输出。

## 让每一轮的 token 保持精确 {#s-train-an-agent-keep-the-tokens-of-each-turn-exact}

在两轮之间，agent 循环常常把 token 转成文本，再转回 token。这一来一回可能改变 token，于是训练器打分的序列并不是引擎生成的那个。

Miles 用一个 session server 避免这个问题，它在每一轮都直接传入和传出 token。加上 `--use-session-server` 后，router 还会把同一段对话的所有轮次留在同一个引擎上。这样每一轮都能复用之前各轮的 cache。

[第 4.2 节](#s-handle-long-responses)的 partial rollout 不能和这些配方一起用。session server 以及多轮和 agent 的 generate 函数都会拒绝它。

## 要关注什么 {#s-train-an-agent-what-to-watch}

- 模型写的 token 占比和工具写的 token 占比。如果一个配方里大部分 token 由工具写出，模型每一步学到的就很少。
- 训练器和引擎之间的差距，见[第 5.2 节](#s-check-the-first-step)。差距远高于你单轮时的范围，说明两轮之间的 token 不一致。
- 步时间。工具会增加墙钟时间，这段时间 GPU 都在等待。

```takeaways
- 从最接近你任务的 Miles 示例开始一个 agent 配方。
- 屏蔽工具输出，让只有模型写的 token 计入 loss。
- 使用 session server，让每一轮保留精确的 token 和它的 cache。
```

Sources: Miles examples (retool_v2, search-r1, swe-agent-harbor-docker, tau-bench), generate hub, session server, and router arguments at main 08752a12; Miles fully async documentation.
