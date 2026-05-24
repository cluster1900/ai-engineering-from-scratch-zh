---
name: skill-quantization
description: 根据硬件、质量和延迟约束，为部署 LLMs 选择合适的 quantization 策略
version: 1.0.0
phase: 10
lesson: 11
tags: [quantization, inference, deployment, optimization, fp8, int4, int8, gptq, awq, gguf]
---

# Quantization 决策框架

部署语言模型时，使用这个框架来选择合适的数字格式、quantization 方法和质量验证策略。

## 输入要求

提供：
- **模型**（名称、参数量、原始精度）
- **目标硬件**（GPU 型号/VRAM、CPU、Apple Silicon、edge device）
- **延迟目标**（tokens/second、time to first token）
- **质量下限**（最大可接受的 perplexity increase、benchmark delta）
- **服务模式**（batch size、max context length、concurrent users）

## 快速选择

| 你的情况 | Format | Method | 预期质量损失 |
|---------------|--------|--------|----------------------|
| H100 GPU，最大吞吐量 | FP8 E4M3 | Native H100 casting | < 0.1% |
| A100/A10，需要 2x 吞吐量 | INT8 | LLM.int8() or SmoothQuant | < 0.5% |
| 单张 24GB GPU，70B 模型 | INT4 | AWQ or GPTQ | 1-3% |
| MacBook / Apple Silicon | INT4 GGUF | Q4_K_M via llama.cpp | 1-2% |
| Mobile / edge device | INT4 or INT3 | QAT + device-specific | 2-5% |
| 最大压缩，允许一定损失 | INT2 | QuIP# or AQLM | 5-15% |
| 训练（mixed precision） | BF16 + FP32 accum | Native framework support | 0% |

## 按组件选择精度

并非所有 tensors 都应该采用相同处理。

| Component | 安全下限 | 推荐 | 避免 |
|-----------|-------------|-------------|-------|
| FFN weights | INT4 | INT4 (AWQ/GPTQ) | 未使用 QAT 的 INT2 |
| Attention weights | INT4 | INT8 or FP8 | INT2 |
| Embedding layer | INT8 | FP16（保留原始） | INT4 |
| Output head | INT8 | FP16（保留原始） | INT4 |
| KV cache | FP8 | FP8 or INT8 | 长 context 下的 INT4 |
| Attention logits | FP16 | FP16 or BF16 | INT8 |
| Activations（inference） | INT8 | FP8 or INT8 | INT4 |

## 方法比较

### GPTQ
- **适用场景：** GPU inference，并且你想要 Hugging Face 兼容的模型
- **Calibration data：** 128 个示例，每个 2048 tokens
- **时间：** 在 A100 上处理 70B 需要 30-60 分钟
- **工具：** `auto-gptq`、`exllama`、`exllamav2`
- **优势：** 经过充分测试，Hugging Face 上有庞大的 model zoo
- **弱点：** 应用速度比 AWQ 慢，在某些模型上质量略低于 AWQ

### AWQ
- **适用场景：** GPU inference，并且你想要最好的 quality-per-bit
- **Calibration data：** 128 个示例
- **时间：** 在 A100 上处理 70B 需要 15-30 分钟
- **工具：** `autoawq`、`vLLM`（native support）
- **优势：** 最佳 INT4 质量，应用速度快，集成 vLLM
- **弱点：** model zoo 比 GPTQ 小

### GGUF
- **适用场景：** CPU inference、Apple Silicon、llama.cpp 生态
- **Variants：** Q2_K、Q3_K_S/M/L、Q4_K_S/M、Q5_K_S/M、Q6_K、Q8_0、F16
- **推荐默认值：** Q4_K_M（最佳质量/大小平衡）
- **工具：** `llama.cpp`、`ollama`、`LM Studio`
- **优势：** 自包含文件、mixed precision、庞大生态
- **弱点：** 对 GPU 不是最优（为 CPU/Metal 设计）

### SmoothQuant
- **适用场景：** GPU 上的 INT8，需要同时进行 weight 和 activation quantization
- **核心思想：** 通过 per-channel scaling 将 quantization 难点从 activations 迁移到 weights
- **工具：** `smoothquant`、`TensorRT-LLM`
- **优势：** 支持 W8A8（weights 和 activations 都使用 INT8），实现 2x 加速
- **弱点：** 仅限 INT8，不能扩展到 INT4

## 质量验证协议

完成 quantization 后，部署前进行验证：

1. **Perplexity test。** 在 WikiText-2 或你的领域语料上计算。Delta < 0.5 非常好，0.5-1.0 良好，> 2.0 是问题。

2. **Benchmark sweep。** 运行 MMLU（通用）、GSM8K（数学）、HumanEval（代码）。数学和代码对精度损失最敏感。

3. **输出比较。** 分别从原始模型和 quantized model 生成 100 个回答。使用 LLM-as-judge 计算 win rate。目标：quantized model 在 > 90% 的 prompts 上获胜或打平。

4. **延迟测量。** 在 batch size 1 和你的目标 batch size 下测量 tokens/second。确认加速值得付出质量成本。

5. **长 context 测试。** 如果服务长 context（> 4K tokens），在你的最大 context length 下测试。KV cache quantization errors 会随 sequence length 叠加。

## Memory Budget Calculator

```
Weight memory (GB) = parameters (B) * bits / 8 / 1.073741824
KV cache per token (MB) = 2 * num_layers * d_model * bits / 8 / 1048576
KV cache for context (GB) = kv_per_token * max_context_length / 1024
Activation memory (GB) ~ 1-4 GB (relatively constant, depends on batch size)
Total = weight_memory + kv_cache + activation_memory + overhead (10-20%)
```

Llama 3 70B 在 INT4、32K context 下的示例：
- Weights：70B * 4 / 8 / 1.07 = 32.6 GB
- KV cache（FP16）：2 * 80 * 8192 * 16 / 8 / 1e9 * 32768 = ~40 GB
- KV cache（FP8）：~20 GB
- 使用 FP8 KV 的总量：~55 GB（适配一张 80GB A100）

## 常见错误

| 错误 | 失败原因 | 修复 |
|---------|-------------|-----|
| 将 Embedding layer quantize 到 INT4 | 第一层会把错误放大到整个模型 | 将 Embeddings 保持在 FP16 或 INT8 |
| 对 INT4 使用 per-tensor scales | 一个 outlier row 会破坏所有 rows 的精度 | 使用 per-channel 或 per-group scales |
| 不校准 GPTQ/AWQ | 没有代表性数据时 scale factors 会出错 | 使用来自你领域的 128 个示例 |
| 所有层使用相同 bit-width | 第一层/最后一层更敏感 | Mixed precision：first/last 使用更高 bits |
| 在非常长 context 下 quantize KV cache | 错误会随 sequence length 二次叠加 | KV cache 使用 FP8，而不是 INT4 |
| 跳过质量验证 | 某些模型 quantize 效果很差（尤其在边界处） | 始终运行 perplexity + task evals |

## 部署 Recipes

### Recipe 1: vLLM with AWQ（GPU server）
```
pip install vllm autoawq
vllm serve model-awq --quantization awq --dtype half --max-model-len 8192
```

### 配方 2：llama.cpp with GGUF (MacBook)
```
./llama-server -m model.Q4_K_M.gguf -c 4096 -ngl 99
```

### 方案 3: TensorRT-LLM with FP8 (H100)
```
trtllm-build --model_dir model --output_dir engine --dtype float16 --use_fp8
```
