# Evidence: cheatsheets/managed-llm-platforms.md

Abbreviations: P17 = phases/17-infrastructure-and-production. L01 = P17/01-managed-llm-platforms, L02 = P17/02-inference-platform-economics, L10 = P17/10-cold-start-mitigation, L28 = P17/28-self-hosted-serving-selection. d = docs/en.md, c = code/main.py.

## 三大云厂商并列对比 (comparison)
- Strategy marketplace, exclusive OpenAI, Gemini first: L01/d:26, 28, 30
- Catalog Claude, Llama, Titan, Mistral, Cohere: L01/d:26. GPT, o-series, DALL·E, Whisper: L01/d:28. Gemini plus Model Garden: L01/d:30
- Median TTFT ~75 ms on-demand, ~50 ms with PTUs: L01/d:72-73. Vertex 60 ms in main.py: L01/c:31
- Provisioned Throughput $21-$50/hr: L01/d:42. PTU up to 70% savings: L01/d:40, 76. Per Gemini SKU: L01/d:44
- Break-even about half peak: L01/d:42. ~40-60% sustained: L01/d:40, 75. Less publicly advertised: L01/d:44
- Application Inference Profiles: L01/d:48. Scopes, tags, PTU reservations: L01/d:52. Project per team, BigQuery Billing Export: L01/d:50
- Compliance rows: L01/d:64-66

## 推理平台并列对比 (comparison)
- Optimizes latency, catalog breadth, enterprise polish, Python-native DX: L02/d:3
- Billing per token, per minute, per second: L02/d:17, 56
- Rates 0.90, 0.88, 0.55, 0.48: L02/c:27-30
- Reserved floor 1440 and 60: L02/c:29-30. Field definition: L02/c:23
- Cold start 1.5, 2.0, 5.0, 2.5 s: L02/c:27-30
- Batch tier ~50%: L02/d:35. 200+ models: L02/d:42. Truss, SOC 2 Type II: L02/d:48, 50. @modal.function(gpu="A100"): L02/d:55

## 何时选用云厂商 (concepts)
- Bedrock one API, one IAM surface: L01/d:26
- Cost per team, product, feature without post-processing: L01/d:48
- Azure TTFT < 100 ms at P99 with PTUs: L01/d:36
- Vertex 1M-token Gemini context, multimodal: L01/d:30
- Two-provider minimum: L01/d:60, 105
- Claude from Bedrock, GPT from Azure, same gateway: L01/d:60

## 何时选用平台或自托管 (concepts)
- Groq for voice agents: L02/d:26
- Fireworks latency, fine-tuned at base rate: L02/d:34, 36
- Together releases within days: L02/d:42
- Baseten Truss, dedicated GPUs, SOC 2 Type II, HIPAA: L02/d:19, 48-50
- Modal Python, per-second billing: L02/d:55-56
- Replicate pay-per-prediction, image video audio: L02/d:61
- Anyscale one node in a larger graph: L02/d:68
- Self-host reasons: L28/d:82

## 选择自托管引擎 (flow)
1. CPU llama.cpp: L28/d:34
2. AMD vLLM ROCm, TRT-LLM NVIDIA-locked: L28/d:36
3. Blackwell TRT-LLM on B200/GB200: L28/d:40, L28/c:40
4. 1 user Ollama: L28/d:46
5. 10-100 users vLLM single-GPU: L28/d:48
6. 100-10k users production-stack or SGLang: L28/d:50
7. Agentic RadixAttention: L28/d:58
8. Pipeline and GGUF vs safetensors: L28/d:74

## 70B 模型的冷启动（秒） (comparison)
- node provision 50.0, 50.0, 50.0, 0.5: L10/c:28
- image pull 180.0, 0.0, 180.0, 0.0: L10/c:29
- weights to HBM 75.0, 75.0, 35.0, 0.0: L10/c:30
- engine init 20.0, 20.0, 20.0, 2.0: L10/c:31
- first forward 3.0, 3.0, 3.0, 0.5: L10/c:32
- Tool row, Bottlerocket with EC2NodeClass, Run:ai Model Streamer, Modal checkpoints: L10/d:31, 37, 41
- Gain row, 328s total: L10/d:74. 2-4 minutes saved: L10/d:31. ~2x speedup: L10/d:82. 10x faster: L10/d:41

## 在代码中运行模型 (task-table)
- simulate(tokens_in_per_day, tokens_out_per_day, sla_ttft_ms, use_ptu): L01/c:35
- break_even_demo(): L01/c:65
- lock_in_cost(): L01/c:80
- cost_per_day(v, tokens_per_day, predictions_per_day): L02/c:36
- utilization_breakeven(): L02/c:74
- total_for_stack, pre_seeded, streamer: L10/c:36, 88
- warm_pool_break_even(gpu_hourly=4.50, cold_seconds=328, sla_tolerated_drops_per_day=5): L10/c:93
- pick_engine(hardware, scale, workload): L28/c:9

## 故障排查 (troubleshooting)
- TTFT < 100 ms needs PTUs or Provisioned Throughput: L01/d:36
- Pay for reservation when idle, break-even 40-60%: L01/d:40
- Bedrock bill up 4x: L01/d:93. Profiles: L01/d:48
- Tags from resource groups, Application Insights or gateway headers: L01/d:52
- Two-provider minimum, outages: L01/d:60
- 3-8 minutes raw: L10/d:24. Stack of mitigations: L10/d:11, 29-53
- Snapshots per GPU topology, re-checkpoint: L10/d:41
- TGI maintenance mode Dec 11, 2025, vLLM or SGLang: L28/d:68-70

## 问答 (qa)
- ~25 ms slower, shared vs dedicated: L01/d:12, 34
- ~30% in docs: L02/d:75. ~60-70% in main.py: L02/c:113-114
- TTFT P99 < 60s on 70B+: L10/d:45
- 3,600 GPU-hours/month: L10/d:24
- Input KB, KV GB, recompute cheaper: L10/d:53
- Ollama 15-30% slower, 3x gap: L28/d:27, 89

## 术语表 (glossary)
- PTU: L01/d:102
- BAA: L01/d:106
- Application Inference Profile, CloudWatch: L01/d:48, 103
- Truss: L02/d:113
- FireAttention: L02/d:112
- RayTurbo: L02/d:117
- min_workers, min_workers=1: L10/d:3, 114
- GGUF K-quant variants: L28/d:118
