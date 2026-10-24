---
id: managed-llm-platforms
title: Managed Platforms and Self-Hosting Compared
code: MN
subtitle: 选择云厂商、推理平台或自托管引擎。为它定价、估算规模、缩短冷启动。
hue: 28
sources: phases/17-infrastructure-and-production/01-managed-llm-platforms, phases/17-infrastructure-and-production/02-inference-platform-economics, phases/17-infrastructure-and-production/10-cold-start-mitigation, phases/17-infrastructure-and-production/28-self-hosted-serving-selection
source_hash: 989d353d0e149310
---

## 三大云厂商并列对比
type: comparison
span: 2
from: phases/17-infrastructure-and-production/01-managed-llm-platforms

| 因素 | Bedrock | Azure OpenAI | Vertex AI |
|---|---|---|---|
| 策略 | 模型市场 | 独家 OpenAI 模型 | Gemini 优先 |
| 模型目录 | Claude、Llama、Titan、Mistral、Cohere | GPT、o 系列、DALL·E、Whisper | Gemini 加 Model Garden |
| TTFT 中位数 | 按需 ~75 ms | 使用 PTU 时 ~50 ms | `main.py` 中 60 ms |
| 专用容量 | Provisioned Throughput，$21-$50/hr | PTU，最多节省 70% | 按 Gemini SKU |
| 盈亏平衡点 | 约为峰值利用率的一半 | 持续利用率 ~40-60% | 公开信息较少 |
| 成本归因 | Application Inference Profiles | 作用域、标签、PTU 预留 | 每个团队一个项目，导出到 BigQuery |
| 合规 | BAA、VPC 端点、护栏 | HIPAA、SOC 2、ISO 27001 | HIPAA、GDPR、按区域的数据驻留 |

## 推理平台并列对比
type: comparison
span: 2
from: phases/17-infrastructure-and-production/02-inference-platform-economics

| 因素 | Fireworks | Together | Baseten | Modal |
|---|---|---|---|---|
| 优化方向 | 延迟 | 模型目录广度 | 企业级完善度 | Python 原生开发体验 |
| 计费 | 按 token | 按 token | 按分钟 | 按秒 |
| `main.py` 中的费率 | $0.90/M output | $0.88/M output | $0.55/min | $0.48/min |
| 预留下限 | 无 | 无 | 1440 min/day | 60 min/day |
| `main.py` 中的冷启动 | 1.5 s | 2.0 s | 5.0 s | 2.5 s |
| 关键事实 | Batch 档约为 serverless 的 ~50% | 200+ 个模型 | Truss，SOC 2 Type II | `@modal.function(gpu="A100")` |

## 何时选用云厂商
type: concepts
from: phases/17-infrastructure-and-production/01-managed-llm-platforms

- **Bedrock**：需要用一个 API、一套 IAM 访问 Claude、Llama 等模型。
- **Bedrock**：需要按团队、产品或功能统计成本，且不做后处理。
- **Azure OpenAI**：需要 GPT 模型，并在 PTU 上把 TTFT P99 控制在 100 ms 以内。
- **Vertex AI**：需要 1M token 的 Gemini 上下文或多模态输入。
- **双厂商**：每个产品关键调用都运行在两家云厂商上。
- **常见组合**：Bedrock 上的 Claude、Azure OpenAI 上的 GPT，加一个网关。

## 何时选用平台或自托管
type: concepts
from: phases/17-infrastructure-and-production/02-inference-platform-economics, phases/17-infrastructure-and-production/28-self-hosted-serving-selection

- **定制芯片**：延迟至关重要。语音 agent 选 Groq。
- **Fireworks**：需要低延迟，且 LoRA 按基座模型费率计费。
- **Together**：需要在新开源模型发布几天内就用上。
- **Baseten**：需要微调模型、专用 GPU、SOC 2 和 HIPAA。
- **Modal**：团队写 Python，想要按秒计费。
- **Replicate**：按次预测提供图像、视频和音频模型服务。
- **Anyscale**：推理只是更大 Ray 计算图中的一个节点。
- **自托管**：数据驻留、定制微调、规模化成本，或没有托管模型可用。

## 选择自托管引擎
type: flow
from: phases/17-infrastructure-and-production/28-self-hosted-serving-selection

1. **硬件为 CPU**：用 llama.cpp。在 CPU 上没有其他引擎有竞争力。
2. **硬件为 AMD**：用带 ROCm 的 vLLM。TRT-LLM 绑定 NVIDIA。
3. **硬件为 Blackwell**：TRT-LLM 在 B200/GB200 上领先，vLLM 和 SGLang 紧随其后。
4. **规模 1 个用户**：用 Ollama。一条命令，几秒出首 token。
5. **规模 10-100 用户**：在单 GPU 上用 vLLM。
6. **规模 100-10k 用户**：用 vLLM production-stack 或 SGLang。
7. **负载为 agent 型或前缀密集型**：用 SGLang RadixAttention。
8. **流水线**：开发用 Ollama，预发用 llama.cpp，生产用 vLLM。把 GGUF 转成 safetensors。

## 70B 模型的冷启动（秒）
type: comparison
span: 2
from: phases/17-infrastructure-and-production/10-cold-start-mitigation

| 阶段 | 原始 | 预置镜像 | 模型流式加载 | GPU 快照 |
|---|---|---|---|---|
| 节点开通 | 50.0 | 50.0 | 50.0 | 0.5 |
| 拉取镜像 | 180.0 | 0.0 | 180.0 | 0.0 |
| 权重载入 HBM | 75.0 | 75.0 | 35.0 | 0.0 |
| 引擎初始化 | 20.0 | 20.0 | 20.0 | 2.0 |
| 首次前向 | 3.0 | 3.0 | 3.0 | 0.5 |
| 工具 | 无 | Bottlerocket、`EC2NodeClass` | Run:ai Model Streamer | Modal checkpoints |
| 收益 | 共 328s | 节省 2-4 分钟 | 权重加载加速 ~2x | 重启快 10x |

## 在代码中运行模型
type: task-table
span: 2
from: phases/17-infrastructure-and-production/01-managed-llm-platforms/code/main.py, phases/17-infrastructure-and-production/02-inference-platform-economics/code/main.py, phases/17-infrastructure-and-production/10-cold-start-mitigation/code/main.py, phases/17-infrastructure-and-production/28-self-hosted-serving-selection/code/main.py

| 任务 | 代码 |
|---|---|
| 各云厂商的成本与 TTFT | `simulate(tokens_in_per_day, tokens_out_per_day, sla_ttft_ms, use_ptu)` |
| Azure PTU 盈亏平衡扫描 | `break_even_demo()` |
| 双厂商最低配置的成本 | `lock_in_cost()` |
| 单一厂商每天的成本 | `cost_per_day(v, tokens_per_day, predictions_per_day)` |
| 按 token 与按分钟计费扫描 | `utilization_breakeven()` |
| 一套缓解手段下的冷启动 | `total_for_stack({"pre_seeded", "streamer"})` |
| 预热池盈亏平衡 | `warm_pool_break_even(gpu_hourly=4.50, cold_seconds=328, sla_tolerated_drops_per_day=5)` |
| 按硬件、规模、负载选引擎 | `pick_engine(hardware, scale, workload)` |

## 故障排查
type: troubleshooting
from: phases/17-infrastructure-and-production/01-managed-llm-platforms, phases/17-infrastructure-and-production/10-cold-start-mitigation, phases/17-infrastructure-and-production/28-self-hosted-serving-selection

| 症状 | 原因 | 修复 |
|---|---|---|
| 按需模式下 P99 TTFT 超过 100 ms | 共享容量与其他流量竞争 | 购买 PTU 或 Provisioned Throughput |
| 流量低时 PTU 账单很高 | 空闲时也要为预留付费 | 只在持续利用率 ~40-60% 时预留 |
| 流量不变，Bedrock 账单涨了 4x | 没有按功能归因 | 通过 Application Inference Profiles 路由调用 |
| Azure 上没有按请求的成本 | 标签来自资源组 | Application Insights 自定义指标或网关请求头 |
| 厂商故障时产品宕机 | 单一厂商锁定 | 在一个网关后至少接两家厂商 |
| 首 token 要 3-8 分钟 | 缩容到零后 70B 原始冷启动 | 叠加预置镜像、流式加载和快照 |
| 快照在新节点上恢复失败 | 快照与 GPU 拓扑绑定 | 在新 SKU 上重新做检查点 |
| 新项目选了 TGI | 自 Dec 11, 2025 起进入维护模式 | 默认用 vLLM 或 SGLang |

## 问答
type: qa
from: phases/17-infrastructure-and-production/01-managed-llm-platforms, phases/17-infrastructure-and-production/02-inference-platform-economics, phases/17-infrastructure-and-production/10-cold-start-mitigation, phases/17-infrastructure-and-production/28-self-hosted-serving-selection

- **为什么 Bedrock 慢约 ~25 ms？** 共享按需容量。Azure PTU 为你的租户预留 GPU。
- **按分钟何时优于按 token？** 文档说持续利用率超过 ~30% 时。`main.py` 显示在预留分钟计费下约为 ~60-70%。
- **何时必须用预热池？** 通常是 70B+ 模型要求 TTFT P99 < 60s 时。
- **预热池成本多少？** 5 个产品各保留一个热副本，每月 3,600 GPU-hours。
- **为什么实时迁移搬的是 token？** 输入只有 KB，KV cache 有 GB。重算更便宜。
- **为什么不在生产中用 Ollama？** 比 llama.cpp 慢 15-30%，生产负载下差距达 3x。

## 术语表
type: glossary
from: phases/17-infrastructure-and-production/01-managed-llm-platforms, phases/17-infrastructure-and-production/02-inference-platform-economics, phases/17-infrastructure-and-production/10-cold-start-mitigation, phases/17-infrastructure-and-production/28-self-hosted-serving-selection

- **PTU**：Provisioned Throughput Unit。预留的推理 GPU，按小时计价。
- **BAA**：Business Associate Agreement。处理 PHI 时必需，三家都提供。
- **Application Inference Profile**：带标签的 Bedrock profile，在 CloudWatch 中按 profile 统计成本。
- **Truss**：Baseten 的清单文件，描述依赖、密钥和服务配置。
- **FireAttention**：Fireworks 的自研注意力 kernel。
- **RayTurbo**：Anyscale 基于 Ray 的专有推理引擎。
- **min_workers**：serverless 保活实例数。`min_workers=1` 即预热池。
- **GGUF**：llama.cpp 的权重格式，内含 K-quant 变体。
