# 该用哪个路由器

> 路由器把 rollout 请求分发到各个引擎上，一旦你运行多个引擎或多轮对话，这个选择就很重要。

每个 rollout 请求在到达引擎之前都要经过路由器。在一块 GPU 上只有一个引擎时，路由器对每个请求只有一个去处。有多个引擎或 agent 会话时，它把请求发往哪里决定了引擎复用缓存的效果。

读完本节后，你能解释路由器在 Miles 运行中做什么，以及何时要更换它。

## 两种路由器 {#s-which-router-to-use-the-two-routers}

| 路由器 | 如何选择 | 路由依据 | 备注 |
|---|---|---|---|
| SGLang 路由器，一个 Rust 服务 | 默认 | token | 支持拆分的 prefill 和 decode |
| Miles 路由器，一个 Python 服务 | `--use-miles-router` | 文本请求，每个发往未完成请求最少的引擎 | 不支持拆分的 prefill 和 decode，默认在 3 次检查失败后把引擎标记为不健康 |

Miles 为运行中的每个模型启动一个路由器，它没有自己的 GPU。从 v0.1.1 版本起，Miles 总是启动自己的路由器，你无法让运行指向你自己启动的路由器。

默认的 SGLang 路由器来自 Miles 团队为 Miles 维护的一个构建。这个构建会让 RL 字段经过路由器传到引擎再传回来。两个例子是用于采样重放的采样 token 集合，以及 top 对数概率。

我们的运行使用默认路由器。我们日志中的启动行显示了这一点：

```listing
title: the router that our runs started
source: capture/gpu/out-gb10/router-launch.txt
lang: text
note: One line from the log of the e6a-base run.
---
sglang_router.launch_router --log-level warn --prometheus-port 20036 --request-timeout-secs 14400 --host 172.17.0.3 --port 20034
```

## 为 agent 会话路由 {#s-which-router-to-use-routing-for-agent-sessions}

使用 `--use-session-server` 时，路由器把一次对话的每一轮都留在同一个引擎上。这样每一轮都能复用之前各轮的缓存。Miles 会自行为这种情况设置路由策略。

当引擎上使用注意力数据并行时，Miles 让路由器感知数据并行的各个 rank。路由器随后可以在一个引擎内选择一个 rank。

## 何时更换路由器 {#s-which-router-to-use-when-to-change-the-router}

- 只有一个引擎时，保留默认。没有什么需要均衡的。
- 有多个引擎且提示为单轮时，保留默认。
- 使用 agent 会话时，打开会话服务器，并让 Miles 设置策略。
- 只有在你需要发送文本请求时才使用 Miles 路由器。它无法路由拆分的 prefill 和 decode。

请求失败时，把路由器日志和引擎日志对照着读。在路由器处失败的请求永远不会到达引擎。

```takeaways
- 只有一个引擎或提示为单轮时，保留默认的 SGLang 路由器。
- 为 agent 使用会话服务器，让每次对话都留在同一个引擎上。
- 当请求在到达引擎之前就失败时，阅读路由器日志。
```

Sources: Miles router arguments, router specification, and session server settings at main 08752a12; Miles release notes v0.1.1; the Miles router build repository; capture/gpu/out-gb10/router-launch.txt.
