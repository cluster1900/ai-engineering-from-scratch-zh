# 在 Kubernetes 上运行 vLLM

> vLLM 之上的一层负责路由和扩缩容，你根据需要的功能来选择它。

你要在集群上运行很多 vLLM 服务器。读完本节后，你能选出在 Kubernetes 上运行 vLLM 的那一层。

## 从一个 Deployment 能提供什么开始 {#s-run-vllm-on-kubernetes-start-with-what-one-deployment-gives-you}

vLLM 文档展示了一套普通的 Kubernetes 部署。它包括一个存放权重的 volume、一个存放 Hugging Face token 的 secret、一个运行 `vllm serve` 的 Deployment，以及一个 Service。vLLM 仓库里有一个小型 Helm chart，打包了同样的组件。它额外加了一个下载模型的 job 和一个可选的 Kubernetes autoscaler。

下面是我们自己写的最小版本，针对一块 GPU 和一个模型。我们没有在集群上运行过它。它需要一个由 NVIDIA device plugin 提供 `nvidia.com/gpu` 的集群。对于访问受限的模型，加一个名为 `hf-token`、带 `token` 键的 Secret。创建一个名为 `vllm-api-key`、带 `key` 键的 Secret，让 `/v1` 路由需要这个 key。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-qwen3-8b
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vllm-qwen3-8b
  template:
    metadata:
      labels:
        app: vllm-qwen3-8b
    spec:
      terminationGracePeriodSeconds: 120
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.31.0
          args: ["Qwen/Qwen3-8B", "--max-model-len", "8192", "--reasoning-parser", "qwen3"]
          ports:
            - containerPort: 8000
          env:
            - name: HF_TOKEN
              valueFrom:
                secretKeyRef:
                  name: hf-token
                  key: token
                  optional: true
            - name: VLLM_API_KEY
              valueFrom:
                secretKeyRef:
                  name: vllm-api-key
                  key: key
          resources:
            limits:
              nvidia.com/gpu: 1
          startupProbe:
            httpGet:
              path: /health
              port: 8000
            periodSeconds: 10
            failureThreshold: 90
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            periodSeconds: 30
            failureThreshold: 3
          volumeMounts:
            - name: hf-cache
              mountPath: /root/.cache/huggingface
            - name: shm
              mountPath: /dev/shm
      volumes:
        - name: hf-cache
          emptyDir: {}
        - name: shm
          emptyDir:
            medium: Memory
            sizeLimit: 2Gi
---
apiVersion: v1
kind: Service
metadata:
  name: vllm-qwen3-8b
spec:
  selector:
    app: vllm-qwen3-8b
  ports:
    - port: 8000
      targetPort: 8000
```

镜像会启动 `vllm serve`，所以 `args` 只包含模型和参数。启动探针允许间隔 10 秒检查 90 次，也就是 15 分钟。我们的 DGX Spark 首次启动花了约 8 分钟，所以要根据你自己测得的冷启动时间设置这个上限。这些探针能防止 Kubernetes 在加载权重期间发送流量或重启 pod。

把 `emptyDir` cache 换成 PersistentVolumeClaim，这样新 pod 就不会再下载一次权重。挂在 `/dev/shm` 的内存 volume 为进程提供共享内存，作用和 Docker 的 `--ipc=host` 一样。API key 不保护 `/health` 和 `/metrics`，所以还要用 NetworkPolicy 限制哪些 pod 能访问这个 Service。

这足以运行一个模型的几个副本。普通 Service 随机分发请求，所以用户的下一轮对话可能被发到从未缓存过之前几轮的副本上。基于 CPU 使用率的 autoscaler 也用错了信号，因为 GPU 负载不等于 CPU 负载。

## 根据需要的功能选择一层 {#s-run-vllm-on-kubernetes-pick-a-layer-for-the-features-you-need}

| 层 | 它增加了什么 | 何时选择 |
|---|---|---|
| vLLM production stack | 一个 Helm chart、一个让会话固定在同一副本的 router、通过 LMCache 的 KV cache 卸载，以及 Grafana 仪表盘 | 你想要 vLLM 项目的参考部署 |
| llm-d | 一个读取 vLLM 指标和 KV cache 事件来选择副本的 router、prefill 与 decode 拆分、大规模 expert parallelism | 你在集群上运行大模型，或拆分 prefill 和 decode |
| KServe | 一个带 vLLM runtime 的模型服务平台，以及一个基于 llm-d 的 LLM 资源 | 你的公司已经在用 KServe 部署其他模型 |
| AIBrix | 一个控制平面，提供路由、LoRA 管理和基于引擎指标的自动扩缩容 | 你需要用一个控制平面管理很多模型和 adapter |
| Ray Serve LLM | 在 Ray Serve 内运行 vLLM，支持多模型部署 | 你的技术栈已经运行在 Ray 上 |

llm-d 在 2026-10-20 发布了 1.0 版本。它在 2026 年 3 月作为 sandbox 项目加入 CNCF。它的 router 遵循 Gateway API Inference Extension，这是一个用于路由到模型服务器的 Kubernetes 项目。

## 了解这些层使用了哪些 vLLM 功能 {#s-run-vllm-on-kubernetes-know-which-vllm-features-the-layers-use}

这些层读取的是相同的 vLLM 接口。检查你的 vLLM 版本是否支持你所用的层需要的那些接口：

- **指标。** router 读取 `vllm:num_requests_waiting`、`vllm:num_requests_running` 和 `vllm:kv_cache_usage_perc` 来选择副本。
- **KV cache 事件。** 使用 `--kv-events-config` 时，vLLM 会发布它存入和移除的每个 block。router 用这些事件把请求发给持有其前缀的副本。
- **KV connector。** prefill 与 decode 拆分以及共享 cache 使用 `--kv-transfer-config`。
- **健康检查。** `/health` 服务于启动、存活和就绪探针。

这一点没有在我们的硬件上测量。我们没有在集群上运行过，也没有应用上面的 manifest。

```takeaways
- 从一个 Deployment、一个 GPU 限额和一个比冷启动时间更长的启动探针开始。
- 普通 Deployment 适合几个副本，但它随机路由，并且按错误的信号扩缩容。
- 根据你需要的功能选择那一层：会话路由、prefill 与 decode 拆分，或很多 adapter。
- 检查你的 vLLM 版本是否支持你所用的层读取的指标、事件和 connector。
```

Sources: vLLM documentation at v0.31.0 (docs/deployment/k8s.md, docs/deployment/frameworks/helm.md, docs/deployment/integrations/), the llm-d v1.0.0 release notes and architecture documents (2026-10-20), the CNCF announcement of llm-d (2026-03-24), the production-stack, AIBrix, and KServe documentation (accessed 2026-10-21), our GB10 start log capture/gpu/out-gb10/server-load-vllm.log (arguments at 10:53:02, server ready at 11:00:59), vLLM source at v0.31.0 vllm/entrypoints/serve/middleware/authenticate.py (the key guards only paths under /v1, /v2, /inference and /cohere).
