---
id: quantization
title: Quantization Formats Compared
code: QF
subtitle: 按硬件、引擎和负载选权重格式。位数、内存、命令，以及会损失精度的陷阱。
hue: 30
sources: phases/10-llms-from-scratch/11-quantization, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell, phases/17-infrastructure-and-production/09-production-quantization, phases/11-llm-engineering/08-fine-tuning-lora
source_hash: c4748b8c82542092
---

## 生产格式并列对比
type: comparison
span: 2
from: phases/17-infrastructure-and-production/09-production-quantization/docs/en.md

| 因素 | GGUF Q4_K_M | GPTQ | AWQ | FP8 |
|---|---|---|---|---|
| 位数 | 4-5 | 4-8 | 4 | 8 |
| 最适用 | CPU、edge、笔记本 | vLLM 上的 Multi-LoRA | 数据中心 GPU 生产 | Hopper/Ada/Blackwell 数据中心 |
| 引擎 | llama.cpp, Ollama | vLLM, TGI | vLLM (Marlin-AWQ), TGI | vLLM, TRT-LLM, SGLang |
| vLLM 中 7B 的速度 | ~93 tok/s | ~712 tok/s | ~741 tok/s | 未给出数字 |
| 内核收益 | GPU 上无 | Marlin：相对非 Marlin 为 2.6x | Marlin-AWQ：相对 naive 为 10.9x | Hopper Tensor Cores 上原生 |
| 质量 | 4-5 bits 接近 BF16 | 校准一遍 | INT4 上最佳 Pass@1 | 近乎无损 |

## 何时用 X
type: tips
from: phases/17-infrastructure-and-production/09-production-quantization/docs/en.md, phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md

- CPU 或 edge 服务：GGUF Q4_K_M。
- GPU 服务、日常聊天、无 LoRA：AWQ。
- 带 multi-LoRA 的 GPU 服务：带 Marlin 的 GPTQ。
- Reasoning 负载：FP8。
- 质量已验证的 Blackwell 数据中心：NVFP4 + FP8 KV。
- 在一张消费级 GPU 上微调：用 NF4 基座做 QLoRA。
- 不确定：对每个候选格式跑 1,000-sample eval。

## 位布局
type: concepts
from: phases/10-llms-from-scratch/11-quantization/docs/en.md, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell/docs/en.md

- **FP32**：1 个符号位，8 个指数位，23 个尾数位。用于累加。
- **BF16**：1 个符号位，8 个指数位，7 个尾数位。范围与 FP32 相同。
- **FP16**：1 个符号位，5 个指数位，10 个尾数位。最大值约 65,504。
- **FP8 E4M3**：1 个符号位，4 个指数位，3 个尾数位。推理权重和激活。
- **FP8 E5M2**：1 个符号位，5 个指数位，2 个尾数位。训练梯度。
- **INT8**：从 -128 到 127 共 256 个值。需要一个缩放因子。
- **INT4**：16 个档位。需要 GPTQ 或 AWQ 才能保住质量。
- **NVFP4**：每块一个缩放因子的 4-bit FP。Blackwell。

## 量化与反量化
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/11-quantization/code/main.py, phases/10-llms-from-scratch/11-quantization/docs/en.md

```python
def quantize_symmetric(tensor, num_bits=8):
    qmin = -(2 ** (num_bits - 1))  # -128 at 8 bits
    qmax = 2 ** (num_bits - 1) - 1  # 127 at 8 bits
    abs_max = np.max(np.abs(tensor))  # per tensor: one scale
    if abs_max == 0:
        return np.zeros_like(tensor, dtype=np.int32), 1.0
    scale = abs_max / qmax
    quantized = np.clip(np.round(tensor / scale), qmin, qmax).astype(np.int32)
    return quantized, float(scale)

def dequantize_symmetric(quantized, scale):
    return quantized.astype(np.float64) * scale  # error at most scale / 2

zero_point = int(np.round(qmin - t_min / scale))  # asymmetric offset
```

## Llama 3 70B 实测
type: comparison
from: phases/10-llms-from-scratch/11-quantization/docs/en.md

| 因素 | FP16 | FP8 | GPTQ INT4 | AWQ INT4 |
|---|---|---|---|---|
| 大小 | 140GB | 70GB | 35GB | 35GB |
| 困惑度 (WikiText-2) | 3.12 | 3.14 | 4.32 | 4.18 |
| MMLU | 79.5% | 79.3% | 77.8% | 78.1% |
| Tokens/sec (A100) | 38 | 55 | 72 | 75 |

## PTQ 与 QAT
type: comparison
from: phases/10-llms-from-scratch/11-quantization/docs/en.md

| 因素 | PTQ | QAT |
|---|---|---|
| 成本 | 几分钟到几小时 | 完整训练轮次 |
| INT8 质量 | 极佳（< 0.1% 损失） | 极佳 |
| INT4 质量 | 配合 GPTQ/AWQ 良好（1-3% 损失） | 更好（< 1% 损失） |
| INT2 质量 | 差 | 对某些任务可用 |
| 校准数据 | 128-1024 个例子 | 完整训练数据集 |

## 敏感度，从低到高
type: flow
from: phases/10-llms-from-scratch/11-quantization/docs/en.md

1. **Weights**：接近零的高斯分布。INT4 配合 GPTQ 或 AWQ 可用。
2. **Activations**：范围更宽，带离群值。谨慎使用 INT8。
3. **KV cache**：误差会在后续所有 token 上累积。用 FP8 或 INT8。
4. **Attention logits**：softmax 会放大误差。把它们留在 FP16。

## HBM 预算：AWQ 下的 70B
type: architecture
from: phases/17-infrastructure-and-production/09-production-quantization/docs/en.md

```arch
node | w | 1,1 | Weights | ~35 GB INT4 | store
node | kv | 2,1 | KV cache | ~20 GB, 128 x 2k | store
node | act | 3,1 | Activations | ~5 GB | store
node | gpu | 2,2 | H100 80GB | total ~60 GB | gpu
edge | w | gpu |
edge | kv | gpu |
edge | act | gpu |
```

## 量化并提供服务
type: task-table
span: 2
from: phases/10-llms-from-scratch/11-quantization/docs/en.md

| 任务 | 代码 |
|---|---|
| 转换成 GGUF | `python llama.cpp/convert_hf_to_gguf.py <model> --outtype f16 --outfile <f16>.gguf` |
| 做 Q4_K_M | `llama.cpp/build/bin/llama-quantize <f16>.gguf <out>.gguf Q4_K_M` |
| 提供 GGUF 服务 | `llama.cpp/build/bin/llama-server -m <out>.gguf -c 4096 -ngl 99` |
| GPTQ 配置 | `GPTQConfig(bits=4, group_size=128)` |
| GPTQ 校准 | `model.quantize(calibration_texts[:128], batch_size=1)` |
| AWQ 配方步骤 | `AWQModifier(duo_scaling="both")` |
| AWQ scheme | `QuantizationModifier(ignore=["lm_head"], scheme="W4A16_ASYM", targets=["Linear"])` |
| 提供 AWQ 或 GPTQ 服务 | `vllm serve <model> --max-model-len 8192` |

## 4-bit 的 QLoRA 基座
type: annotated-code
lang: python
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md

```python
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,  # frozen base in 4-bit
    bnb_4bit_quant_type="nf4",  # levels at normal quantiles
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,  # scale constants to fp8
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-8B",
    quantization_config=bnb_config,
    device_map="auto",
)
model = get_peft_model(model, lora_config)  # adapters train in fp16
```

## 排障
type: troubleshooting
from: phases/17-infrastructure-and-production/09-production-quantization/docs/en.md, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell/docs/en.md, phases/10-llms-from-scratch/11-quantization/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| HumanEval Pass@1 掉了好几分 | 用通用网页文本校准 | 用领域内数据校准 |
| 4-bit 模型之后 HBM 不够 | KV cache 仍是 FP16/FP8 | 把权重、KV 和激活一起预算 |
| MATH 掉约 3-5 分 | 在 reasoning 模型上用了 AWQ INT4 | 发布 FP8 或 BF16 |
| vLLM 里 7B 约 93 tok/s | GGUF 用错了引擎 | 用 llama.cpp 提供 GGUF |
| Attention 分数崩塌 | KV cache 用了 FP4 | 把 KV cache 留在 FP8 |
| 朴素 INT4 毁掉模型 | 舍入误差累积 | 用带校准的 GPTQ 或 AWQ |
| 困惑度差值 > 2.0 | 哪里出错了 | 检查方法和缩放 |
| NVFP4 上没有 LoRA | 尚无 LoRA 支持（2026 年初） | 在 vLLM 里用 GPTQ-Int4 |

## 问题
type: qa
from: phases/10-llms-from-scratch/11-quantization/docs/en.md, phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell/docs/en.md, phases/17-infrastructure-and-production/09-production-quantization/docs/en.md

- **怎样的困惑度差值算好？** 低于 0.5 极佳。
- **GPTQ 要多少校准例子？** 128 个例子很典型。
- **典型的 Blackwell 配置？** NVFP4 权重和激活，FP8 KV cache，FP32 attention 累加器。
- **AWQ 还是 GPTQ？** 同样的 4-bit 占用。按 LoRA 支持来选。
- **70B 用 GGUF Q4_K_M？** 大约 40GB。在配备 64GB 的 M3 Max 上每秒 10-15 tokens。
