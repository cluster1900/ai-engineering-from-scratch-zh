# Multi-Token Prediction (MTP)

> 从 GPT-2 到 Llama 3，每个自回归 LLM 在每个位置都基于一个 loss 训练：预测下一个 Token。DeepSeek-V3 在每个位置增加了第二个 loss：预测再后面的那个 Token。额外的 14B 参数（在 671B 模型上）通过 Gradient flow 被蒸馏回主模型，而训练好的 MTP heads 在推理时被重新用于 speculative-decoding drafters，接受率超过 80%。1.8× 生成吞吐量几乎是免费获得的。本课将基于 DeepSeek 技术报告构建 sequential MTP module，计算 loss 和 shared-head 参数布局，并解释为什么 MTP 保留了 causal chain，而 Gloeckle et al. 最初的 parallel MTP 破坏了它。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04（预训练 mini GPT）、Phase 10 · 15（speculative decoding）
**Time:** ~60 分钟

## 学习目标

- 说明 MTP 训练目标，并推导不同 prediction depth 上的 joint loss。
- 解释 Gloeckle et al. 的 parallel MTP heads（2024）与 DeepSeek-V3 的 sequential MTP modules 之间的区别，以及为什么 sequential 设计能保留 causal chain。
- 计算在预训练运行中加入 MTP modules 的参数和内存开销。
- 从零实现一个 MTP module：shared embedding、per-depth transformer block、projection 和 shared output head。

## 问题

Next-token prediction 是标准的 LLM 训练目标。每个 hidden state 都被监督去预测唯一一件事：紧随其后的 Token。这是一个出人意料地弱的信号。序列中的大部分信息都延伸到一个 Token 之外：结构、一致性、事实性、算术流程。模型必须通过在数万亿 Token 上累积许多 one-token 信号来学习这些内容。

MTP 提出的问题是：如果每个 hidden state 都被监督去一次预测多个未来 Token 会怎样？Gloeckle et al.（Meta, 2024）证明这有帮助。他们的实现是在 backbone 之上放置几个独立的 output heads，每个 head 预测不同的 offset。并行、简单，但这些 heads 看到的是同一个 hidden state，没有任何层级式 refinement，而且预测之间不会按因果链衔接，因此无法用于 speculative decoding。

DeepSeek-V3（2024 年 12 月）将 MTP 重新设计为 sequential modules，在每个 prediction depth 上保留 causal chain。模型从 `h_i^(0)` 预测 `t+1`，然后从新的 hidden state `h_i^(1)` 预测 `t+2`，而 `h_i^(1)` 结合了 `h_i^(0)` 和 `E(t+1)` Embedding，依此类推。每个 depth 都有自己的小型 transformer block。shared embedding 和 shared output head 让参数开销保持在适中范围。在 DeepSeek-V3 的规模下，MTP modules 在 671B 主模型权重之上增加了 14B 参数。这个 2% 的开销换来了更密集的训练信号，以及推理时现成的 speculative-decoding draft。

本课会从零构建单个 MTP module 和 D-depth loss。数学很整洁。实现约 150 行。

## 核心概念

### sequential MTP 配方

DeepSeek-V3 在主模型之上添加 `D` 个 MTP modules。每个 module `k`（其中 `k = 1..D`）预测深度 `k` 的 Token，也就是在给定直到位置 `i` 的 prefix 时预测 `t_{i+k}`。

Module `k` 包含：

- 一个 Transformer block `T_k`，拥有自己的 attention 和 MLP。
- 一个 projection matrix `M_k`，将前一深度的 hidden state 与下一深度的 ground-truth Token 的 Embedding 结合起来。
- shared embedding `E`（与主模型相同）。
- shared output head `Out`（与主模型相同）。

训练时，对于截至位置 `i` 的 prefix，per-depth hidden state 为：

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

per-depth prediction 为：

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

per-depth loss 是相对于 ground-truth `t_{i+k}` 的 cross-entropy：

```
L_k = CE(logits_{i+k}, t_{i+k})
```

跨 depth 的 joint loss：

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda` 是一个较小的权重因子，DeepSeek-V3 在训练前 10% 使用 0.3，之后使用 0.1。总训练 loss 为 `L_main + L_MTP`。

### 为什么是 sequential，而不是 parallel

Gloeckle 最初的 parallel MTP 有 D 个 output heads，每个都直接应用到 `h_i^(0)`。每个 head 都从同一个 backbone hidden state 预测 `t_{i+k}`。这样可以正常训练，但这些预测并不相互条件化。你不能用 `head_1` 的输出来帮助 `head_2`，这些 heads 是并行触发的。

DeepSeek-V3 的 sequential 设计从 `h_i^(k-1)` 加上实际 next-token embedding `E(t_{i+k})` 构建 `h_i^(k)`。这保留了 causal chain：为了预测 `t_{i+k+1}`，深度 `k+1` 的 module 会看到 `t_{i+k}` 处的内容。这在结构上与自回归 decoder 消费自身输出的方式相同，因此 MTP modules 可以直接作为 speculative-decoding drafters 使用。

推理时：将 `h_i^(k-1)` 和草拟出的 `t_{i+k}` 输入 module `k+1`，得到对 `t_{i+k+1}` 的预测。重复即可。这正是 EAGLE-style draft，只是使用训练好的 MTP module 作为 draft network。DeepSeek-V3 报告第一个 MTP module 的接受率超过 80%，并获得约 1.8× 加速。

### 参数核算

对于 hidden 为 `h`、词表为 `V` 的模型：

- 主模型：数十亿参数，加上一个大小为 `V * h` 的 output head。
- Shared output head：复用主模型的 head。没有额外参数。
- Shared embedding：复用主模型的 embedding。没有额外参数。
- 每个 MTP module：
  - Projection `M_k`：`(2h) * h = 2h^2`。
  - Transformer block `T_k`：attention（MHA 为 `4h^2`）加 MLP（SwiGLU 且 ratio 为 8/3 时通常为 `8h^2`）。每个 block 约 `12h^2`。

每个 module 的总额外参数：`~14h^2`。对于 DeepSeek-V3 的 `h = 7168`，D = 1 module：纸面上是 `~14 * 7168^2 = ~720M` 参数。DeepSeek-V3 报告的是 14B，差异主要来自 MTP module 中的 expert layers 也采用 MoE。

### speculative-decoding 回报

在预训练期间，MTP modules 会让训练变慢约 10%（更多 forward compute，额外 loss）。回报有两方面：

1. 更密集的训练信号。每个 hidden state 都看到 D+1 个监督目标。在 MMLU、GSM8K、MATH、HumanEval 上的测量效果：DeepSeek-V3 的消融实验中有稳定的几个百分点提升。

2. 推理时免费的 speculative decoding draft。MTP module 已经被训练来预测接下来的几个 Token。重新用作 draft network 时，它能达到 80%+ 的接受率。在这个水平下，N=3 或 N=5 的 spec decoding 可带来 1.8× 吞吐量。10% 的训练时成本会在第一次运行推理时就开始回本。

### 与 EAGLE 的关系

EAGLE 在预训练之后单独训练一个小型 draft model。MTP 将 draft 烘焙进预训练。两种方法会收敛到类似的接受率，但 pipeline 不同：

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | 预训练之后 | 预训练期间 |
| Backward-compatible with existing weights | 是 | 否（需要重新训练） |
| Draft params | 1-2 个 transformer layers | 1 个 transformer block + projection |
| Acceptance rate | 0.88-0.92 | depth 1 时 0.80+ |
| Benefit beyond speedup | 仅 speculative decoding | 更密集的训练信号 + 加速 |

```figure
multi-token-predict
```

## 构建它

`code/main.py` 端到端构建一个 MTP module：shared embedding、projection、transformer block、shared output head。然后它会在一段简短的 synthetic sequence 上计算 per-depth cross-entropy loss，并按组件打印参数量。32 个 Token 的 toy vocabulary 让数字更易读。

### 步骤 1：shared embedding table

一个 `vocab_size x hidden` table 被主模型和每个深度上的每个 MTP module 共同使用。不是第二份副本，而是同一个 tensor。

### 步骤 2：per-depth combination

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

真实的 DeepSeek-V3 会将两个经过 RMSNorm 的 Vector concat 为 `[2h]`，并用一个 `h x 2h` Matrix 投影。这个 toy 为了 stdlib 简洁，用 Vector 加法来代替。

### 步骤 3：depth k 的 transformer block

Self-attention 加 MLP。在 toy 中，一个单层 linear attention block 和一个 SwiGLU MLP 让结构可见，同时避免使用 numpy。

### 步骤 4：shared output head

复用主模型的 output projection。输出覆盖 vocabulary 的 logits。

### 步骤 5：per-depth loss

softmax(logits) 相对于 offset `k` 处 ground-truth Token 的 cross-entropy。使用 `lambda / D` 缩放因子跨 depth 聚合。

### 步骤 6：参数核算

打印总参数量、shared（embedding、head）参数量，以及 per-module 额外参数量。展示 MTP 额外参数与主模型大小的比例。

## 使用它

MTP 已集成到 DeepSeek-V3（2024 年 12 月）和 DeepSeek-R1 系列中。推理时：

- DeepSeek 自己的 serving stack 可开箱即用地将 MTP modules 作为 speculative decoders 使用。
- 截至 2026 年 4 月，vLLM 和 SGLang 已有 DeepSeek-V3 MTP 的集成路径。
- AMD 的 ROCm SGLang 教程展示了一个具体的 MTP speculative-decoding 配置，并在 V3 checkpoint 上测得 1.8× 加速。

在新的预训练运行中使用 MTP 的场景：

- 你控制完整的预训练 pipeline，并希望预先获得更密集的训练信号。
- 你知道自己会大规模服务该模型，并希望免费获得 speculative decoding。
- 你的 hidden size 至少为 4096。在 1B 规模下，开销带来的损害通常超过收益。

不适合使用的场景：

- 对现有预训练 dense model 做 fine-tuning。MTP module 尚未训练。
- 研究模型中你希望有一个干净的 baseline 进行对比。MTP 会改变架构。

## 交付它

本课会生成 `outputs/skill-mtp-planner.md`。给定一个预训练运行规格（模型大小、数据、compute），它会返回一个集成 MTP 的方案：depth 数 D、`lambda` schedule、内存开销，以及推理时的 speculative-decoding wiring。

## 练习

1. 运行 `code/main.py`。展示随着 synthetic signal 增强，per-depth loss 单调下降。修改 synthetic，使其使用固定模式，并验证 depth-1 和 depth-2 loss 都会收敛。

2. 计算一个 dense 70B 模型（hidden 8192，80 层）在 D=1 MTP module 下的参数开销。与 DeepSeek-V3 报告的 14B 开销进行比较。解释为什么 DeepSeek 的数字更高：MTP transformer block 继承了相同的 MoE 结构，从而放大了 per-module 参数量。

3. 在 toy 中实现 D=2：添加第二个 MTP module，接收 h^(1) 并预测 `t_{i+2}`。验证 joint loss 和参数核算与 DeepSeek paper 的 equations 19-21 匹配。

4. 将 toy 切换为 parallel MTP（Gloeckle-style）：在主 hidden state 之上添加 D 个 output heads，每个预测不同 offset。测量在同一个 synthetic signal 上，每个 depth 的 loss 与 sequential 版本相比如何。对于 k > 1，sequential 版本应产生更低的 depth-k loss，因为它以中间预测为条件。

5. 将训练好的 MTP module 用作 EAGLE-style draft：推理时调用 module k 来提出 `t_{i+k}`。在 held-out sequence 上，测量这些 draft Token 相对于主模型预测的接受率。如果你在 toy 上达到 50%+，就复现了 MTP-as-draft 的经验性质。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | “额外 loss block” | 一个小型 transformer block 加 projection，用来预测主模型前方 `k` 个位置的 Token |
| Prediction depth | “哪个 offset” | 整数 `k`，使得 module `k` 基于截至位置 `i` 的 prefix 预测 `t_{i+k}` |
| Parallel MTP | “Gloeckle-style” | 位于同一个 backbone hidden state 之上的 D 个独立 heads，没有条件链 |
| Sequential MTP | “DeepSeek-V3 style” | 每个 module 都以先前 depth 的 hidden state 加下一个 Token 的 embedding 为条件；保留 causal chain |
| Shared output head | “复用主 head” | MTP modules 调用主模型的 LM head，而不是单独的 output projection |
| Shared embedding | “复用主 table” | 同一个 vocabulary embedding table 在所有地方使用；没有重复参数 |
| Projection matrix M_k | “结合 hidden + next-token” | 一个 `h x 2h` linear layer，将前一个 hidden state 和 target-token embedding 折叠为下一深度的输入 |
| Joint loss L_MTP | “平均额外 losses” | per-depth cross-entropy losses 的算术平均值，并按 `lambda` 缩放 |
| Acceptance rate at depth 1 | “MTP draft 多常正确” | D=1 MTP module 的 top-1 prediction 等于主模型 top-1 prediction 的比例；DeepSeek-V3 上超过 80% |
| Lambda weighting | “额外 loss 的重要性” | per-depth 缩放因子；DeepSeek-V3 在训练开始时为 0.3，之后为 0.1 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) — 完整的 sequential MTP 描述（Section 2.2），包括 joint-loss equations 和推理时的 1.8× 加速
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) — DeepSeek 设计所改进的 parallel MTP baseline
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) — 685B 总量（671B main + 14B MTP），部署说明
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) — MTP 所适配的 speculative-decoding 框架
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) — EAGLE 的 2025 draft architecture，也是 MTP 竞争的对应方案
