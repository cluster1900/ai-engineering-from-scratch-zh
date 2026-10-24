---
id: gpu-cloud-docker-keys
title: GPUs, Cloud, Docker and API Keys
code: GC
subtitle: 检查 GPU、按显存估算模型大小、在 Docker 中运行 CUDA、存储 API 密钥并修复 API 错误。
hue: 135
sources: phases/00-setup-and-tooling/03-gpu-setup-and-cloud, phases/00-setup-and-tooling/04-apis-and-keys, phases/00-setup-and-tooling/07-docker-for-ai
source_hash: e45710fb5dcd7c6b
---

## 在哪里运行
type: defaults
from: phases/00-setup-and-tooling/03-gpu-setup-and-cloud/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 本地 NVIDIA GPU | $0 | 安装 CUDA + cuDNN。适合经常使用、大数据集 |
| Google Colab（免费层） | $0 | Runtime > Change runtime type > T4 GPU |
| 云 GPU（Lambda、RunPod、Vast.ai） | $0.20-2.00/hr | SSH + 安装。适合正式训练 |
| CPU | phases 1-3 | 大多数课程在 CPU 上运行良好 |
| fp16 经验法则 | 显存除以 2 | 为激活值留出余量 |

## 检查 GPU
type: annotated-code
lang: python
from: phases/00-setup-and-tooling/03-gpu-setup-and-cloud/docs/en.md, phases/00-setup-and-tooling/03-gpu-setup-and-cloud/code/gpu_check.py

```python
torch.cuda.is_available()                     # False means no GPU
torch.version.cuda                            # PyTorch CUDA version
torch.cuda.get_device_name(0)                 # GPU name
props = torch.cuda.get_device_properties(0)
vram_gb = props.total_memory / 1e9            # VRAM in GB
params_fp16 = vram_gb * 1e9 / 2               # max parameters in fp16
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
torch.cuda.synchronize()                      # before and after a GPU timing
```

## 存储并使用 API 密钥
type: flow
from: phases/00-setup-and-tooling/04-apis-and-keys/docs/en.md, phases/00-setup-and-tooling/04-apis-and-keys/code/first_api_call.py, phases/00-setup-and-tooling/04-apis-and-keys/code/first_api_call.ts

1. **Shell**：`export ANTHROPIC_API_KEY="sk-ant-..."`。绝不把密钥写进代码。
2. **.env 文件**：`ANTHROPIC_API_KEY=sk-ant-...`。把 `.env` 加入 `.gitignore`。
3. **SDK**：`anthropic.Anthropic()` 从环境中读取密钥。
4. **请求**：endpoint、密钥，以及带 `model`、`max_tokens`、`messages` 的 body。
5. **响应**：带 `content`、`usage` 和 `stop_reason` 的 JSON。

## 用 SDK 发出第一次调用
type: annotated-code
lang: python
from: phases/00-setup-and-tooling/04-apis-and-keys/docs/en.md, phases/00-setup-and-tooling/04-apis-and-keys/code/first_api_call.py

```python
client = anthropic.Anthropic()
MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-5")   # model id
response = client.messages.create(
    model=MODEL,
    max_tokens=256,
    messages=[{"role": "user", "content": "<prompt>"}]
)
print(response.content[0].text)                          # reply text
response.usage.input_tokens, response.usage.output_tokens  # billed tokens
```

## 原始 HTTP 调用
type: defaults
from: phases/00-setup-and-tooling/04-apis-and-keys/docs/en.md, phases/00-setup-and-tooling/04-apis-and-keys/code/first_api_call.py, phases/00-setup-and-tooling/04-apis-and-keys/code/first_api_call.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| Endpoint | `https://api.anthropic.com/v1/messages` | `method="POST"` |
| `x-api-key` | `ANTHROPIC_API_KEY` | 密钥头 |
| `anthropic-version` | `2023-06-01` | 版本头 |
| `LLM_MODEL` | `claude-sonnet-5` | 不带日期的 Sonnet 别名 |
| `max_tokens` | 256 | 课程中的取值 |
| `MOCK` | `"1"` | TypeScript 版本随后跳过网络请求 |

## API 错误
type: troubleshooting
from: phases/00-setup-and-tooling/04-apis-and-keys/outputs/prompt-api-troubleshooter.md, phases/00-setup-and-tooling/04-apis-and-keys/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 401 Unauthorized | 密钥错误或缺失 | `echo $ANTHROPIC_API_KEY \| head -c 10` |
| 403 Forbidden | 没有该 endpoint 或模型的权限 | 检查密钥权限 |
| 429 Too Many Requests | 触发限流 | 等待后重试，或降低频率 |
| 400 Bad Request | body 格式错误 | 检查字段、模型名、消息格式 |
| 500/502/503 | 服务端问题 | 等一分钟后重试 |
| Timeout | 请求耗时过长 | 减小 max_tokens 或使用流式 |
| Connection refused | base URL 错误或网络问题 | `curl -I https://api.anthropic.com` |

## 安装 Docker 并启用 GPU
type: command-table
from: phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md
span: 2

| 命令 | 作用 |
|---|---|
| `curl -fsSL https://get.docker.com \| sh` | 在 Ubuntu 上安装 Docker |
| `sudo usermod -aG docker $USER` | 免 sudo 使用 Docker。注销后重新登录 |
| `docker run hello-world` | 验证安装 |
| `sudo apt-get install -y nvidia-container-toolkit` | 让容器访问 GPU（Linux） |
| `sudo nvidia-ctk runtime configure --runtime=docker` | 注册运行时，然后 `sudo systemctl restart docker` |
| `docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi` | 在容器中测试 GPU |

## 基础镜像
type: defaults
from: phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `nvidia/cuda:12.4.1-devel-ubuntu22.04` | ~4 GB | 为 flash-attn、bitsandbytes 提供 nvcc |
| `nvidia/cuda:12.4.1-runtime-ubuntu22.04` | ~1.5 GB | 适合预编译代码。没有编译器 |
| `pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime` | ~6 GB | 已安装 PyTorch |
| `python:3.12-slim` | ~150 MB | 没有 CUDA。仅 CPU |

## 构建并运行开发镜像
type: annotated-code
lang: bash
from: phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md, phases/00-setup-and-tooling/07-docker-for-ai/code/Dockerfile

```bash
docker build -t ai-dev -f phases/00-setup-and-tooling/07-docker-for-ai/code/Dockerfile .
docker run --rm -it --gpus all \
    -v $(pwd):/workspace \               # your code
    -v ~/models:/models \                # models survive rebuilds
    -p 8888:8888 \                       # Jupyter port
    ai-dev jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root
```

## Compose 栈
type: architecture
from: phases/00-setup-and-tooling/07-docker-for-ai/code/docker-compose.yml, phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md

```arch
node | host | 1,1 | Host folders | ~/models, ~/datasets, repo | store
node | dev | 2,1 | ai-dev | Jupyter on 8888, nvidia GPU | gpu
node | qd | 3,1 | qdrant | qdrant/qdrant:v1.12.5 | store
node | vol | 3,2 | qdrant_data | /qdrant/storage | store
edge | host | dev | volumes
edge | dev | qd | http://qdrant:6333
edge | qd | vol | volume
```

## Docker 任务
type: task-table
from: phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md

| 任务 | 代码 |
|---|---|
| 启动栈 | `docker compose up -d` |
| 停止并删除卷 | `docker compose down -v` |
| 进入服务的 shell | `docker compose exec ai-dev bash` |
| 镜像大小 | `docker images` |
| 回收磁盘 | `docker system prune -a` |
| 容器中的 GPU | `docker exec -it <container_id> nvidia-smi` |
| 跟踪日志 | `docker logs -f <container_id>` |

## Docker 修复
type: troubleshooting
from: phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `No matching distribution found for torch==2.6.0+cu124` | Mac 选择了 arm64 镜像 | `FROM --platform=linux/amd64` |
| Mac 或 CPU 机器上没有 GPU | 那里没有 CUDA | 去掉 `--gpus all` 和 NVIDIA deploy 块 |
| 停止后 14 GB 模型不见了 | 没有挂载卷 | `-v ~/models:/models` |
| 宿主机无法访问服务 | 绑定在 localhost | `host="0.0.0.0"` 和 `-p 5000:5000` |

## 技巧
type: tips
from: phases/00-setup-and-tooling/03-gpu-setup-and-cloud/docs/en.md, phases/00-setup-and-tooling/04-apis-and-keys/docs/en.md, phases/00-setup-and-tooling/07-docker-for-ai/docs/en.md

- 计时第二次 GPU 运行。第一次运行包含启动开销。
- 在信任基准测试之前，先在 Colab 中运行 `!nvidia-smi`。
- 课程需要时再设置对应的 API 密钥。
- SDK 调用失败时，阅读原始 HTTP 调用。
- 把新包加入 Dockerfile 并重新构建。未变化的层来自缓存。
