# Evidence: cheatsheets/gpu-cloud-docker-keys.md

Abbreviations: P0 = phases/00-setup-and-tooling. D3 = P0/03-gpu-setup-and-cloud/docs/en.md, C = P0/03-gpu-setup-and-cloud/code/gpu_check.py, D4 = P0/04-apis-and-keys/docs/en.md, F = P0/04-apis-and-keys/code/first_api_call.py, FT = P0/04-apis-and-keys/code/first_api_call.ts, PT = P0/04-apis-and-keys/outputs/prompt-api-troubleshooter.md, D7 = P0/07-docker-for-ai/docs/en.md, DF = P0/07-docker-for-ai/code/Dockerfile, DC = P0/07-docker-for-ai/code/docker-compose.yml.

## 在哪里运行 (defaults, 5)
- Local NVIDIA GPU, $0, CUDA + cuDNN, regular use, large datasets: D3:25-28
- Google Colab free tier, $0, Runtime > Change runtime type > T4 GPU: D3:30-33, 76
- Cloud GPU (Lambda, RunPod, Vast.ai), $0.20-2.00/hr, SSH + install, serious training: D3:35-38
- Phases 1-3 run fine on CPU: D3:17, 94
- fp16 rule of thumb 2 bytes per parameter, keep a margin: D3:133, 141

## 检查 GPU (annotated-code, 8 lines)
- torch.cuda.is_available(): D3:66, C:13
- torch.version.cuda: D3:67, C:20
- torch.cuda.get_device_name(0): D3:69, C:21
- get_device_properties(0), total_memory / 1e9: C:23-24, 49
- params_fp16 = vram_gb * 1e9 / 2: C:50
- device line: D3:97
- torch.cuda.synchronize() around the GPU timing: D3:121-124, C:40-44

## 存储并使用 API 密钥 (flow, 5 steps)
1. export ANTHROPIC_API_KEY, never put keys in code: D4:42-45
2. .env file, add it to .gitignore: D4:49-52, FT:24-25, 54
3. anthropic.Anthropic() client: D4:63, F:15
4. endpoint, key, body with model, max_tokens, messages: D4:28-31, F:37-41
5. content, usage, stop_reason fields: D4:147

## 用 SDK 发出第一次调用 (annotated-code, 9 lines)
- anthropic.Anthropic(): D4:63
- LLM_MODEL default claude-sonnet-5: D4:65, 76, F:5
- client.messages.create with model, max_tokens=256, messages: D4:67-71
- response.content[0].text: D4:73
- response.usage.input_tokens, output_tokens: F:22

## 原始 HTTP 调用 (defaults, 6)
- https://api.anthropic.com/v1/messages, method="POST": D4:103, 115
- x-api-key from ANTHROPIC_API_KEY: D4:106
- anthropic-version 2023-06-01: D4:107
- LLM_MODEL default claude-sonnet-5, un-dated Sonnet alias: D4:110, 76
- max_tokens 256: D4:111
- MOCK set to "1" skips the network: FT:3, 71

## API 错误 (troubleshooting, 7)
- 401 Unauthorized, key wrong or missing: PT:12, echo check PT:21, D4:149
- 403 Forbidden: PT:13
- 429 Too Many Requests: PT:14
- 400 Bad Request: PT:15
- 500/502/503: PT:16
- Timeout, reduce max_tokens or use streaming: PT:17
- Connection refused, curl -I https://api.anthropic.com: PT:18, 24

## 安装 Docker 并启用 GPU (command-table, 6)
- curl -fsSL https://get.docker.com | sh: D7:91
- sudo usermod -aG docker $USER, log out and back in: D7:92-93
- docker run hello-world: D7:100
- sudo apt-get install -y nvidia-container-toolkit: D7:115
- sudo nvidia-ctk runtime configure --runtime=docker, sudo systemctl restart docker: D7:116-117
- docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi: D7:123

## 基础镜像 (defaults, 4)
- nvidia/cuda:12.4.1-devel-ubuntu22.04, ~4 GB, nvcc for flash-attn, bitsandbytes: D7:133-136
- nvidia/cuda:12.4.1-runtime-ubuntu22.04, ~1.5 GB, no compilers: D7:138-141
- pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime, ~6 GB: D7:143-146
- python:3.12-slim, ~150 MB, CPU only: D7:148-151

## 构建并运行开发镜像 (annotated-code, 6 lines)
- docker build -t ai-dev -f .../Dockerfile .: D7:215
- docker run --rm -it --gpus all, -v $(pwd):/workspace, -v ~/models:/models, -p 8888:8888, jupyter command: D7:234-238
- models survive rebuilds: D7:243, 264
- Dockerfile EXPOSE 8888: DF:49

## Compose 栈 (architecture, 4 nodes, 3 edges)
- Host folders ../../../, ~/models, ~/datasets mounted into ai-dev: DC:13-16
- ai-dev with Jupyter on 8888 and nvidia GPU reservation: DC:2-21
- qdrant image qdrant/qdrant:v1.12.5: DC:23-24
- qdrant_data volume at /qdrant/storage: DC:28-32
- http://qdrant:6333 by service name: D7:314

## Docker 任务 (task-table, 7)
- docker compose up -d: D7:311
- docker compose down -v deletes the qdrant volume: D7:331-334
- docker compose exec ai-dev bash: D7:383
- docker images: D7:344
- docker system prune -a: D7:347
- docker exec -it <container_id> nvidia-smi: D7:350
- docker logs -f <container_id>: D7:356

## Docker 修复 (troubleshooting, 4)
- No matching distribution for torch==2.6.0+cu124 on a Mac, --platform=linux/amd64: D7:220, DF:1
- No GPU: drop --gpus all and the NVIDIA deploy block: D7:220, 370
- 14 GB model downloads vanish without volume mounts: D7:243, 250
- Server bound to localhost not reachable, host="0.0.0.0", -p 5000:5000: D7:376, 385

## 技巧 (tips, 5)
- First GPU run includes start-up cost: D3:137
- Run !nvidia-smi in Colab first: D3:77
- Set up keys when the lesson requires it: D4:132
- Raw HTTP helps when debugging: D4:121
- Add packages to the Dockerfile and rebuild, cached layers: D7:365, 394
