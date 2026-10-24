---
id: lora-fine-tuning
title: Fine-Tuning with LoRA
code: FT
subtitle: 添加 LoRA 适配器，为 QLoRA 加载 4-bit 基座，掩盖 SFT 标签，训练、合并与调试。PyTorch、PEFT 与 bitsandbytes。
hue: 310
sources: phases/11-llm-engineering/08-fine-tuning-lora, phases/10-llms-from-scratch/06-instruction-tuning-sft, phases/19-capstone-projects/38-classifier-finetuning, phases/19-capstone-projects/39-instruction-tuning-sft
source_hash: e5edb281987b0b15
---

## 任务
type: task-table
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/19-capstone-projects/39-instruction-tuning-sft/code/main.py, phases/19-capstone-projects/38-classifier-finetuning/code/main.py

| 任务 | 代码 |
|---|---|
| 给模型加 LoRA | `model = get_peft_model(model, lora_config)` |
| 显示可训练比例 | `model.print_trainable_parameters()` |
| 以 4-bit 加载基座 | `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4")` |
| 统计可训练参数 | `count_parameters(model)` |
| 只保存适配器 | `model.save_pretrained("./lora-adapter")` |
| 把适配器合并进 W | `merge_lora_weights(model)` |
| 损失中跳过被掩盖的标签 | `F.cross_entropy(..., ignore_index=ignore_index)` |
| 只训练头 | `freeze_body(model)` |

## 一层中的 LoRA 路径
type: architecture
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md

```arch
node | x | 1,1 | Input x |
node | w | 2,1 | Frozen W | out x in
node | a | 2,2 | A | r x in, Gaussian init
node | b | 3,2 | B | out x r, zero init
node | s | 4,2 | Scale | alpha / r
node | add | 4,1 | Add | Wx + scaled BAx
node | y | 5,1 | Output y |
node | m | 5,2 | Merged W' | W + (alpha/r) BA
edge | x | w |
edge | x | a |
edge | a | b |
edge | b | s |
edge | w | add |
edge | s | add |
edge | add | y |
edge | s | m | merge
```

## 从零实现 LoRA
type: annotated-code
lang: python
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/11-llm-engineering/08-fine-tuning-lora/code/lora.py

```python
class LoRALayer(nn.Module):
    def __init__(self, in_features, out_features, rank=8, alpha=16):
        super().__init__()
        self.scaling = alpha / rank  # alpha / r
        self.A = nn.Parameter(torch.randn(in_features, rank) * (1 / math.sqrt(rank)))
        self.B = nn.Parameter(torch.zeros(rank, out_features))  # BA starts at zero
    def forward(self, x):
        return (x @ self.A @ self.B) * self.scaling  # scaled low-rank update

class LinearWithLoRA(nn.Module):
    # __init__ wraps linear and builds self.lora
        for param in self.linear.parameters():
            param.requires_grad = False  # freeze W
    def forward(self, x):
        return self.linear(x) + self.lora(x)  # Wx + scaled BAx
```

## 用 PEFT 做 QLoRA
type: annotated-code
lang: python
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md

```python
bnb_config = BitsAndBytesConfig(load_in_4bit=True,  # 4-bit base
    bnb_4bit_quant_type="nf4",  # NF4 levels
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True)  # quantize the scales too
model = AutoModelForCausalLM.from_pretrained("<model>",
    quantization_config=bnb_config, device_map="auto")
lora_config = LoraConfig(task_type=TaskType.CAUSAL_LM, r=16,
    lora_alpha=32, lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"])  # query and value
model = get_peft_model(model, lora_config)  # adds A and B
model.save_pretrained("./lora-adapter")  # 10-100MB adapter
```

## 一次 SFT 训练步
type: flow
from: phases/19-capstone-projects/39-instruction-tuning-sft/docs/en.md, phases/19-capstone-projects/39-instruction-tuning-sft/code/main.py

1. **模板**：每对数据变成 `<INST> instruction <RESP> response`。
2. **分词**：字节 id 加上 `INST_ID = 256`、`RESP_ID = 257`、`PAD_ID = 258`。
3. **整理**：`sft_collate` 把每个 batch 填充到其中最长序列的长度。
4. **掩码**：指令、填充和边界处的标签设为 `-100`。
5. **前向**：模型看到完整序列，包括指令。
6. **损失**：`shifted_loss` 用 `ignore_index=-100` 预测位置 i+1。
7. **更新**：Adam 更新主体。每 5 个 epoch 运行一次精确匹配评测。

## 关键公式
type: concepts
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/10-llms-from-scratch/06-instruction-tuning-sft/docs/en.md

- **LoRA 前向**：$y = Wx + BAx$，$W$ 冻结。
- **缩放后的更新**：$y = Wx + \frac{\alpha}{r} \cdot BAx$
- **参数量**：秩 $r$ 训练 $2 \cdot r \cdot d$ 个参数，而不是 $d^2$。
- **示例**：在 4096x4096 上 $r=16$，训练 16,777,216 中的 131,072 个，即 0.78%。
- **合并**：$W' = W + (\alpha/r) \cdot BA$。大小不变，没有推理开销。
- **全量微调显存**：fp16 的 8B 模型连同梯度和 Adam 状态约需 56GB。

## 默认值
type: defaults
from: phases/11-llm-engineering/08-fine-tuning-lora/outputs/skill-fine-tuning-guide.md, phases/11-llm-engineering/08-fine-tuning-lora/outputs/prompt-lora-advisor.md, phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/10-llms-from-scratch/06-instruction-tuning-sft/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| r | 16 | 大多数任务的安全起点 |
| lora_alpha | 32 | 2 x 秩；alpha = 秩较保守 |
| lora_dropout | 0.05 | 少于 5K 样本时用 0.1 |
| target_modules | q_proj, v_proj | 只有质量不足时再加 |
| QLoRA 学习率 | 2e-4 | 高于全量微调 |
| LoRA fp16 学习率 | 5e-5 | 低于 QLoRA |
| 全量 SFT 学习率 | 2e-5 | Llama 2 Chat，比预训练低 15x |
| Epoch 数 | 1-3 | 更多会有过拟合风险 |

## 故障排查
type: troubleshooting
from: phases/11-llm-engineering/08-fine-tuning-lora/outputs/skill-fine-tuning-guide.md, phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/10-llms-from-scratch/06-instruction-tuning-sft/docs/en.md, phases/19-capstone-projects/39-instruction-tuning-sft/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| Llama 模型损失为 NaN | 没有设置 pad token | 设置 pad token |
| 损失不下降 | 对 LoRA 来说学习率太低 | 试试 2e-4 |
| 损失下降，评测质量差 | 过拟合 | 减少 epoch、增加 dropout、增加数据 |
| 复杂任务表现弱 | 秩太低或目标模块不对 | 试试 r=32 或加入 MLP 层 |
| SFT 后通用能力下降 | 学习率太高 | 使用 1e-5 到 5e-5，1-3 个 epoch |
| 模型去预测指令 | 没有损失掩码 | 在指令和填充上设置 `-100` |
| 长序列 OOM | 优化器状态超出 GPU 显存 | 使用 `optim="paged_adamw_8bit"` |

## 缩写
type: glossary
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/10-llms-from-scratch/06-instruction-tuning-sft/docs/en.md

- **LoRA**：Low-Rank Adaptation。冻结 W，训练 A 和 B。
- **QLoRA**：Quantized LoRA。4-bit NF4 基座，fp16 适配器。
- **NF4**：Normal Float 4。正态分位点上的 16 个量化级别。
- **PEFT**：Hugging Face 的 LoRA、QLoRA、DoRA 和 IA3 库。
- **TRL**：Hugging Face 的 SFT、DPO、GRPO、PPO 和 ORPO 训练器。
- **SFT**：在指令-回答对上的监督微调。
- **ChatML**：使用 `<|im_start|>` 和 `<|im_end|>` token 的角色格式。
- **双重量化**：把每个块的 scale 量化为 fp8。

## 问答
type: qa
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/19-capstone-projects/39-instruction-tuning-sft/docs/en.md, phases/11-llm-engineering/08-fine-tuning-lora/outputs/skill-fine-tuning-guide.md

- **为什么 B 初始化为零？** BA 从零开始，训练从原始行为出发。
- **alpha 有什么作用？** 它把更新按 alpha / r 缩放，与基础学习率无关。
- **合并还是分开保存？** 服务多个任务时分开保存。只用一个模型时合并。
- **为什么要掩盖指令？** 不掩盖时，模型会学着预测指令，回答部分的信号随之变小。
- **什么时候不该微调？** prompt 就能解决时、需要事实知识时（用 RAG），或样本少于 500 个时。

## 提示
type: tips
from: phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md, phases/11-llm-engineering/08-fine-tuning-lora/outputs/skill-fine-tuning-guide.md, phases/19-capstone-projects/38-classifier-finetuning/docs/en.md, phases/10-llms-from-scratch/06-instruction-tuning-sft/docs/en.md

- 先试 prompt 工程，再试 RAG，最后才微调。
- 每 100 步在留出集上评测一次。保留最佳检查点。
- 在 200+ 个留出样本上比较“基座 + prompt”与“基座 + LoRA”。
- 只有 800 个样本时，冻结主体只训练头。
- 跟踪原始文本损失。上升超过 10-15% 说明 SFT 过于激进。

## 选择方法
type: command-table
from: phases/11-llm-engineering/08-fine-tuning-lora/outputs/prompt-lora-advisor.md, phases/11-llm-engineering/08-fine-tuning-lora/docs/en.md

| 选择 | 适用场景 |
|---|---|
| 全量微调，7B 约 56GB | 显存 >= fp16 模型大小的 2x |
| fp16 基座上的 LoRA，约 18GB | 显存 >= fp16 模型大小 |
| 4-bit 基座上的 QLoRA，约 6GB | 显存 >= 模型大小 / 4 |
| `r=16` | 多领域任务、指令遵循、聊天 |
| `r=32` | 代码生成、复杂推理、数学 |
