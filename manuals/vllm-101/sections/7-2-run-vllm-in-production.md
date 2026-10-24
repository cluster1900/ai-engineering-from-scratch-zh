# 在生产环境中运行 vLLM

> vLLM 每两周发布一次，所以要锁定镜像，并为冷启动和升级做好规划。

你的服务器必须经得起重启和升级。读完本节后，你能部署一个启动快、升级安全的服务器。

## 锁定镜像 {#s-run-vllm-in-production-pin-the-image}

锁定一个确切的版本，例如 `vllm/vllm-openai:v0.31.0`，永远不要用 `latest`。大约每两周就有一个新的 minor 版本，每个版本都会改变默认值或移除参数。例如在 0.30 到 0.32 之间：

- 0.31 版本让 `--enforce-eager` 也跳过 kernel 预热。
- 0.31 版本重命名了一个 Mamba prefix-cache 参数，并移除了慢速 tokenizer 模式。
- 0.32 版本放弃了 Python 3.10，并把默认的 CORS 来源从所有来源改为无。

最后这项改动会破坏任何直接调用服务器的浏览器客户端。升级到 0.32 后，把 `--allowed-origins` 设为你信任的来源。

## 为冷启动做好规划 {#s-run-vllm-in-production-plan-for-the-cold-start}

一次启动有三个慢的部分：权重加载、编译和 CUDA graph 捕获。在我们的 DGX Spark 上，仅加载 57 GiB 的模型就花了 330 秒。

- **权重。** 把它们放在本地磁盘上。网络挂载或重新下载会让每次启动都更慢。
- **编译。** vLLM 把编译好的代码缓存在 `~/.cache/vllm` 下。把这个文件夹放在持久化 volume 上，这样重启时可以复用。
- **预加载。** 0.31 版本新增了 `vllm preload`，它会在服务器需要之前加载并预热模型。

`vllm bench startup` 测量冷启动和热启动。每个新镜像都运行一次。

这一点没有在我们的硬件上测量。我们没有对保留编译 cache 的热启动计时。

## 在接入流量之前检查健康状态 {#s-run-vllm-in-production-check-health-before-traffic}

存活探针用 `/health`。就绪探针则发送一个简短的真实请求，以证明引擎能生成内容。给两个探针都设置比你测得的冷启动时间更长的启动延迟。

## 干净地关闭 {#s-run-vllm-in-production-shut-down-cleanly}

向服务器进程发送 `SIGTERM`，而不是强制杀死。关闭之前，先把 pod 从负载均衡器中移除，这样就不会有新请求进来。给 pod 设置至少和你最长请求一样长的宽限期。强制杀死会丢掉所有正在运行的请求。

## 按这个顺序改设置 {#s-run-vllm-in-production-change-settings-in-this-order}

一次只改一个设置，每次改动后都要测量：

1. 内存：最大长度和内存比例。
2. 并发：`--max-num-seqs` 和 token 预算。
3. 数据类型：先 FP8 KV cache，再 FP8 权重。
4. 加速功能：投机解码和编译级别。

后面的每一步都依赖前面的步骤。在内存不足的服务器上测量加速功能，测到的是内存，而不是这个功能。

## 阅读安全公告 {#s-run-vllm-in-production-read-the-security-advisories}

vLLM 项目在 0.31 和 0.32 前后的几周内发布了几十条安全公告。其中有几条被评为高危。很多来自多模态输入，还有一些来自 KV 传输 connector。不要在前面没有网关的情况下把服务器暴露到互联网上。按[服务器选项页](#s-set-the-server-options-every-deployment-needs)所示使用 `--api-key`，并在选择版本之前阅读安全公告。

```takeaways
- 锁定确切的镜像，每次升级前都阅读破坏性变更。
- 把权重和编译 cache 放在本地的持久化存储上。
- 存活检查用 /health，就绪检查用真实请求，排空流量之后再发 SIGTERM。
- 在选择版本之前阅读安全公告。
```

Sources: the release notes for v0.30.0, v0.31.0, and v0.32.0, the GitHub security advisories of vllm-project/vllm (2026-09-21 to 2026-10-21), vLLM documentation at v0.31.0 (docs/design/torch_compile.md, docs/serving/online_serving/openai_compatible_server.md), the vLLM source at v0.31.0 (vllm/benchmarks/startup.py), capture/gpu/out-gb10/server-load-vllm.log.
