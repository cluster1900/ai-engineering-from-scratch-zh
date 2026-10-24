# 设置每个部署都需要的服务器选项

> 少数几个服务器选项决定了谁能访问服务器、客户端发送什么模型名，以及日志保留什么。

你的第一个服务器已经能用，现在其他程序要调用它。读完本节后，你能设置地址、模型名、API key、chat template 和日志。

我们没有测量这些选项对速度的影响。我们在 L4 上用小模型 Qwen3-0.6B 检查了地址、模型名、API key、YAML 文件和已被移除的日志参数。其余内容来自 0.31.0 的 vLLM 文档和源码。

## 选择地址和端口 {#s-set-the-server-options-every-deployment-needs-pick-the-address-and-the-port}

| 选项 | 0.31.0 的默认值 | 何时设置 |
|---|---|---|
| `--host` | 不设置，所以服务器监听所有网络接口 | 服务器只应响应一个接口时，例如本地测试用 `127.0.0.1` |
| `--port` | 8000 | 另一个程序占用了 8000 端口，或者你在一台机器上运行两个服务器 |

默认值监听所有接口，所以网络上的其他机器能访问这台服务器。在你自己的机器上测试时，设置 `--host 127.0.0.1`。

## 给模型一个稳定的名称 {#s-set-the-server-options-every-deployment-needs-give-the-model-a-stable-name}

默认情况下，API 中的模型名就是你传给 `vllm serve` 的名称，例如 `Qwen/Qwen3-8B`。客户端必须发送完全相同的名称。`--served-model-name` 用来设置客户端改用的名称：

```bash
vllm serve Qwen/Qwen3-8B --served-model-name chat
```

现在客户端发送 `"model": "chat"`。这样你就能换用新的 checkpoint，而无需改动客户端。这个名称还会作为指标的 `model_name` 标签。如果你给出多个名称，服务器会响应其中每一个。

## 要求 API key {#s-set-the-server-options-every-deployment-needs-require-an-api-key}

`--api-key` 让服务器要求在 `Authorization` 请求头中提供 key。你也可以用 `VLLM_API_KEY` 环境变量设置它，这样 key 不会出现在进程列表里。

先停掉在 8000 端口上运行的服务器。然后在第一个终端里带着 key 启动服务器：

```bash
VLLM_API_KEY=change-me vllm serve Qwen/Qwen3-8B --host 127.0.0.1 2>&1 | tee server.log
```

服务器就绪后，在第二个终端里带着 key 发送请求：

```bash
curl http://localhost:8000/v1/models -H "Authorization: Bearer change-me"
```

key 只保护 `/v1`、`/v2`、`/inference` 和 `/cohere` 下的路由。同一端口上的其他路由，例如 `/invocations`、`/metrics` 和 `/health`，仍然开放。我们在 L4 上检查过这一点。不带 key 时，`/v1/models` 返回 401。`/health` 和 `/metrics` 返回 200，发往 `/invocations` 的聊天请求也返回 200。

所以，key 并不能让服务器在公网上变得安全。要在它前面放一个网关，正如[生产环境页](#s-run-vllm-in-production)所说。

## 修正 chat template {#s-set-the-server-options-every-deployment-needs-fix-the-chat-template}

vLLM 用模型仓库中的 chat template 来格式化聊天消息。有些仓库没有 template，或者 template 有误。这时模型看到的是格式错误的 prompt，回答质量会变差。

`--chat-template` 接受文件路径或 template 文本。`--default-chat-template-kwargs` 为每个请求设置 template 值，例如对 Qwen3 设置 `'{"enable_thinking": false}'`。请求仍然可以设置自己的 `chat_template_kwargs`。[推理模型页](#s-serve-reasoning-models)对 Qwen3 用到了这一点。

## 控制日志保留什么 {#s-set-the-server-options-every-deployment-needs-control-what-the-log-keeps}

| 选项 | 默认值 | 作用 |
|---|---|---|
| `--enable-log-requests` | 关闭 | 为每个请求写一行，包含它的 ID 和参数 |
| `--max-log-len` | 无限制 | 把这些行中的 prompt 文本截断到这么多字符 |
| `VLLM_LOGGING_LEVEL` | `INFO` | 设置 vLLM 的日志级别，例如遇到棘手问题时用 `DEBUG` |
| `--uvicorn-log-level` | `info` | 设置 HTTP 服务器的日志级别 |
| `--disable-uvicorn-access-log` | 关闭 | 去掉每个 HTTP 请求对应的日志行，例如每次 `/health` 探测 |

在 `DEBUG` 级别下开启 `--enable-log-requests` 时，请求日志行会包含 prompt。不要在处理私密数据的服务器上使用这种设置。

旧版本有一个 `--disable-log-requests` 参数。在 0.31.0 中这个参数已经不存在，请求日志行默认关闭，除非你开启它们。

## 关闭使用统计 {#s-set-the-server-options-every-deployment-needs-turn-off-usage-statistics}

vLLM 默认会发送关于硬件和模型配置的匿名使用数据。要关闭它，在服务器的环境中设置 `VLLM_NO_USAGE_STATS=1` 或 `DO_NOT_TRACK=1`。

## 把选项保存在文件里 {#s-set-the-server-options-every-deployment-needs-keep-the-options-in-a-file}

`vllm serve --config config.yaml` 从 YAML 文件读取选项。每个 key 是参数的长名称去掉两个短横线，例如 `served-model-name: chat`。命令行上的选项优先于文件中的同名选项。

## 检查这些选项 {#s-set-the-server-options-every-deployment-needs-check-the-options}

阅读日志顶部附近的 `non-default args` 那一行。它列出你改动过默认值的每个选项：

```bash
grep "non-default args" server.log
```

然后分别带 key 和不带 key 调用 `/v1/models`。不带 key 时，服务器返回 HTTP 401。

```takeaways
- 本地测试时把 --host 设为 127.0.0.1，因为默认值监听所有接口。
- 设置 --served-model-name，让客户端在更换 checkpoint 时保持同一个名称。
- 同时使用 API key 和网关，因为 key 只保护部分路由。
```

Sources: vLLM documentation at v0.31.0 (docs/configuration/serve_args.md, docs/usage/usage_stats.md, docs/usage/security.md, docs/usage/troubleshooting.md), the vLLM source at v0.31.0 (vllm/entrypoints/launchers/cli_args.py, vllm/entrypoints/launchers/launcher.py, vllm/engine/arg_utils.py, vllm/config/model.py, vllm/envs.py), capture/gpu/out-gb10/server-load-vllm.log, capture/gpu/out-l4/livecheck-2026-10-22.txt.
