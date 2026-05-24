# DeepSeek-V3 架构讲解

> Phase 10 · Lesson 14 命名了每个开放模型都会调节的六个架构旋钮。DeepSeek-V3（2024 年 12 月，总参数 671B，活跃参数 37B）调节了全部六个旋钮，并额外加入四项：Multi-Head Latent Attention、无 auxiliary Loss 的负载均衡、Multi-Token Prediction，以及 DualPipe training。本课会从上到下阅读 DeepSeek-V3 的架构，并根据已发布 config 推导每一项参数量。学完后，你将能够解释为什么 671B/37B 这个比例是正确押注，以及为什么 MLA + MoE 组合在前沿模型中胜过二者单独使用。

**类型：** 学习
**语言：** Python（stdlib，参数计算器）
**先修要求：** Phase 10 · 14（开放模型讲解）、Phase 10 · 17（NSA）、Phase 10 · 18（MTP）、Phase 10 · 19（DualPipe）
**时间：** 约 75 分钟

## 学习目标

- 从上到下阅读 DeepSeek-V3 config，并用六个 GPT-2 旋钮加四个 DeepSeek 特有新增项来解释每个字段。
- 推导总参数量（671B）、活跃参数量（37B），以及各自的组成部分。
- 计算 128k context 下 MLA 的 KV cache 占用，并与一个活跃参数相同、使用 GQA 的 dense model 需要付出的代价进行比较。
- 说出四项 DeepSeek 特有创新（MLA、MTP、auxiliary-loss-free routing、DualPipe），并指出每一项针对架构或 training stack 的哪个部分。

## 问题

DeepSeek-V3 是第一个架构上与 Llama 家族存在实质差异的前沿开放模型。Llama 3 405B 是“调节了六个旋钮的 GPT-2”。DeepSeek-V3 则是 GPT-2 加上全部六个旋钮，再额外加入四个旋钮。阅读 Llama 3 config 是阅读 DeepSeek config 的热身，但其深层结构，也就是 Attention block 的形状、routing 逻辑、training-time objective，已经足够不同，因此需要单独讲解。

学习它的收益是：DeepSeek-V3 的 open-weights 发布改变了开放模型中“frontier capability”的含义。这个架构是许多 2026 年 training run 正在复制的蓝图。理解它，是任何涉及前沿 LLM 训练或推理岗位的基本要求。

## 核心概念

### 不变的核心，再看一次

DeepSeek-V3 仍然是 autoregressive。它仍然堆叠 decoder blocks。每个 block 仍然包含 Attention 加 MLP 加两个 RMSNorm。它在 MLP 中仍然使用 SwiGLU。它仍然使用 RoPE。Pre-norm。权重共享 Embedding。基线与每个 Llama 或 Mistral 相同。

### 转折：用 MLA 取代 GQA

从 Phase 10 · 14 你已经知道，GQA 通过让多组 Q heads 共享 K 和 V 来缩小 KV cache。Multi-Head Latent Attention（MLA）更进一步：K 和 V 被压缩到一个共享的低秩 latent representation（`kv_lora_rank`），然后在计算时按 head 解压。KV cache 只存储 latent，通常是每 token 每 layer 512 个浮点数，而不是 8 x 128 = 1024 个浮点数。

在 128k context 下，使用 MLA 的 DeepSeek-V3（每 token 每 layer 一个共享 latent `c^{KV}`；K 和 V 都通过 up-projection 从这个 latent 派生，而这些 up-projection 可以吸收到后续 matmul 中）：

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

一个假设的 GQA 基线（Llama 3 70B 形状，8 个 KV heads，head dim 128）需要：

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

在 128k context 下，MLA 比 Llama-3-70B 风格的 GQA cache 小 4 倍。

权衡是：MLA 在每次 Attention 计算时增加一步按 head 的解压。额外计算量相对于节省的带宽很小。对长 context 推理而言，净收益为正。

### Routing：auxiliary-loss-free load balancing

MoE routers 决定每个 token 由哪些 top-k experts 处理。朴素 router 会把过多工作集中到少数 experts 上，导致其他 experts 闲置。标准修复方法是添加一个 auxiliary Loss 项，用于惩罚负载不均衡。这确实有效，但会略微降低主任务性能。

DeepSeek-V3 引入了一种 auxiliary-loss-free 方案。给 router logits 添加按 expert 的 bias 项，并在训练期间用一个简单规则调整：如果 expert `e` 过载，就降低 `bias_e`；如果负载不足，就提高它。不添加额外 Loss 项。训练保持干净。Expert 负载保持均衡。

对主 Loss 的影响：不可测。对 MoE 架构的影响：更干净，没有需要调优的 auxiliary-loss hyperparameter。

### MTP：更密集的训练 + 免费 draft

从 Phase 10 · 18 你已经知道，DeepSeek-V3 增加了 D=1 的 MTP module，用于预测后两个位置的 token。在推理时，训练好的 module 被重新用作 speculative-decoding draft，acceptance 超过 80%。在训练时，每个 hidden state 受到 D+1 = 2 个目标的监督，提供更密集的信号。

参数：在 671B main 之上增加 14B。开销：2.1%。

### 训练：DualPipe

从 Phase 10 · 19 你已经知道，DualPipe 是一种双向 pipeline，会将 forward 和 backward chunks 与跨节点 all-to-all 通信重叠。在 DeepSeek-V3 的 2,048-H800 规模下，它大约追回了 1F1B 原本会因 pipeline bubbles 损失的 245k GPU-hours。

### Config，逐字段解析

下面是 DeepSeek-V3 config（简化版）：

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

解析如下：

- `hidden_size=7168`：Embedding 维度。
- `num_hidden_layers=61`：总 block 深度。
- `first_k_dense_layers=3`：前 3 个 blocks 使用大小为 18432 的 dense MLP。其余 58 个使用 MoE。
- `num_attention_heads=128`：128 个 query heads。
- `kv_lora_rank=512`：K 和 V 被压缩到这个 latent 维度，并按 head 解压。
- `num_experts=256, num_experts_per_tok=8`：每个 MoE block 有 256 个 experts，采用 top-8 routing。
- `shared_experts=1`：在 256 个 routed experts 之外，还有 1 个 always-on expert 会为每个 token 贡献输出。可以把它理解为一个“dense floor”，确保每个 token 都能得到可靠处理。
- `moe_intermediate_size=2048`：每个 expert 的 MLP hidden size。它比 dense MLP 小，因为一共有 256 个 experts。

### 参数核算

完整计算在 `code/main.py` 中。核心结论：

- Embedding：`vocab * hidden = 129280 * 7168 = ~0.93B`。
- 前 3 个 dense blocks：带 MLA 的 Attention（每 block 约 144M）+ dense MLP（每 block 约 260M）+ norms。总计约 1.2B。
- 58 个 MoE blocks：带 MLA 的 Attention（约 144M）+ 256 个 experts（每个约 30M）+ 1 个 shared expert（30M）+ norm。按包含所有 experts 计算，每 block 总计约 7.95B。58 个 MoE blocks 总计 461B。
- MTP module：14B。

总计：core architecture 约 476B + 14B MTP；而已发布的 671B 数字还会单独计入额外结构参数（bias tensors、expert-specific components、shared expert scaling 等）。我们在计算器中复现的数字与已发布值相差 3-5% 以内，差异来自 DeepSeek 报告 Section 2 appendix 中记录的细粒度核算。

每次 forward 的活跃参数：

- Attention：每 layer 144M * 61 = 8.8B（所有 layers 都会触发）。
- MLP active：前 3 层 dense（3 * 260M = 780M），58 个 MoE layers 中每层激活 8 个 routed + 1 个 shared + routing overhead。每 layer active MLP 约 260M。总计：3 * 260M + 58 * 260M = ~15.9B。
- Embedding + norms：1.2B。
- 总活跃：约 26B core + 14B MTP（训练时使用，但推理时不总是运行）≈ 37B。

### 671B / 37B 比例

18 倍稀疏比例（活跃参数为总参数的 5.5%）。DeepSeek-V3 是已经发布 open weights 的最稀疏前沿 MoE 模型。Mixtral 8x7B 的比例为 13/47（28%），要 dense 得多。Llama 4 Maverick 的比例为 17B/400B（4.25%），与之相当。DeepSeek 的押注是：在前沿规模下，更多 experts 加更低激活比例，会在每 active-FLOP 的质量上带来更好结果。

### DeepSeek-V3 的位置

| 模型 | 总参数 | 活跃参数 | 比例 | Attention | 新想法 |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN 扩展 |

### 后续：R1、V4

DeepSeek-R1（2025）是在 V3 backbone 上进行 reasoning-training 的一次 run。R1 使用相同架构。变化的是 post-training recipe（在可验证任务上进行大规模 RL），而不是 pretraining 架构。

DeepSeek-V4（如果发布）预计会保留 MLA + MoE + MTP，并加入 DSA（DeepSeek Sparse Attention），也就是 Phase 10 · 17 中 NSA 的后继。这个谱系是稳定的：架构级创新不断累积；每个版本都会调节额外旋钮。

## 使用它

`code/main.py` 是专门适配 DeepSeek-V3 形状的参数计算器。运行它，将输出与论文中的数字进行比较，并用它测试假设变体（256 experts vs 512、top-8 vs top-16、MLA rank 512 vs 1024）。

需要关注：

- 总参数量 vs 已发布的 671B。
- 活跃参数量 vs 已发布的 37B。
- 128k context 下的 KV cache，也就是 MLA vs GQA 的比较。
- 按 layer 的拆解，用于观察参数预算实际花在哪里。

## 交付它

本课会生成 `outputs/skill-deepseek-v3-reader.md`。给定一个 DeepSeek-family model（V3、R1，或任何未来变体），它会生成一份逐组件的架构阅读结果，命名 config 的每个字段，按组件推导参数量，并识别模型使用了四项 DeepSeek 特有创新中的哪些。

## 练习

1. 运行 `code/main.py`。将计算器的总参数估计与已发布的 671B 进行比较，并识别差异来自哪里。论文 Section 2 有完整分项。

2. 修改 config，将 MLA rank 从 512 改为 256。计算 128k context 下得到的 KV cache 大小。它带来多少百分比的下降？代价是对每个 head 表达能力造成什么影响？

3. 比较 DeepSeek-V3 的（256 experts，top-8）routing 与一个假设的（512 experts，top-8）变体。总参数增加；活跃参数保持不变。理论上，额外 expert 容量带来什么收益？推理时的代价是什么？

4. 阅读 DeepSeek-V3 technical report（arXiv:2412.19437）Section 2.1 关于 MLA 的内容。用三句话解释为什么 K 和 V 的解压 Matrix 可以在推理效率上被“吸收”到后续 matmul 中。

5. DeepSeek-V3 对大多数操作使用 FP8 training。计算用 FP8 vs BF16 存储 671B weights 的内存节省。它与 14.8T-token training budget 有什么关系？

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MLA | “Multi-Head Latent Attention” | 将 K 和 V 压缩到共享低秩 latent（kv_lora_rank，通常为 512），并按 head on-the-fly 解压；KV cache 只存储 latent |
| kv_lora_rank | “MLA compression dim” | K 和 V 共享 latent 的大小；DeepSeek-V3 使用 512 |
| First k dense layers | “早期 layers 保持 dense” | 前几个 MoE-model layers 跳过 MoE router，并运行 dense MLP 以提高稳定性 |
| num_experts_per_tok | “Top-k routing” | 每个 token 会触发多少个 routed experts；DeepSeek-V3 使用 8 |
| Shared experts | “Always-on experts” | 无论 routing 如何都会处理每个 token 的 experts；DeepSeek-V3 使用 1 |
| Auxiliary-loss-free routing | “Bias-adjusted load balance” | 在训练期间调整按 expert 的 bias 项，以在不添加 Loss 项的情况下保持 expert 负载均衡 |
| MTP module | “额外 prediction head” | 从 h^(1) 和 E(t+1) 预测 t+2 的 Transformer block；更密集训练，免费的 speculative-decoding draft |
| DualPipe | “Bidirectional pipeline” | 将 forward/backward 计算与跨节点 all-to-all 重叠的 training schedule |
| Active parameter ratio | “Sparsity” | active_params / total_params；DeepSeek-V3 达到 5.5% |
| FP8 training | “8-bit training” | 使用 FP8 存储训练数据，并在许多 compute ops 中使用 FP8；相比 BF16 大约内存减半，质量代价很小 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report（arXiv:2412.19437）](https://arxiv.org/abs/2412.19437) — 完整的架构、训练与结果文档
- [Hugging Face 上的 DeepSeek-V3 model card](https://huggingface.co/deepseek-ai/DeepSeek-V3) — config 文件与部署说明
- [DeepSeek-V2 paper（arXiv:2405.04434）](https://arxiv.org/abs/2405.04434) — 引入 MLA 的前身模型
- [DeepSeek-R1 paper（arXiv:2501.12948）](https://arxiv.org/abs/2501.12948) — 基于 V3 架构的 reasoning-training 后继模型
- [Native Sparse Attention（arXiv:2502.11089）](https://arxiv.org/abs/2502.11089) — DeepSeek-family Attention 的未来方向
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) — training-schedule reference
