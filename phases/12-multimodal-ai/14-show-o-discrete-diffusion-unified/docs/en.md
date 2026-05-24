# Show-o 和 Discrete-Diffusion 统一模型

> Transfusion 混合连续和离散表示。Show-o（Xie et al., 2024 年 8 月）走的是另一条路：text tokens 使用 causal next-token prediction，image tokens 使用 MaskGIT 思路下的 masked discrete diffusion。二者都位于一个带 hybrid attention mask 的 Transformer 中。结果是在一个 backbone、每种 modality 一个 Tokenizer、一个 Loss formulation（next-token 扩展到 masked prediction）上统一了 VQA、text-to-image、inpainting 和 mixed-modality generation。本课讲解 Show-o 设计：为什么 masked discrete diffusion 是一种并行、少步数的 image generator，并将其与 Transfusion 和 Emu3 对比。

**Type:** Learn
**Languages:** Python (stdlib, masked-discrete-diffusion sampler)
**Prerequisites:** Phase 12 · 13 (Transfusion)
**Time:** ~120 minutes

## 学习目标
- 解释 masked discrete diffusion：一种先均匀 mask Tokens、再让 Transformer 恢复它们的 schedule。
- 从速度和质量上比较并行 image decoding（Show-o, MaskGIT）与 autoregressive image decoding（Chameleon, Emu3）。
- 说出 Show-o 在一个 checkpoint 中处理的三类任务：T2I、VQA、image inpainting。
- 选择一种 masking schedule（cosine、linear、truncated），并推理它对 sample quality 的影响。

## 问题
Transfusion 的 two-loss 训练有效，但 dynamics 更棘手：continuous Diffusion Loss 与 discrete NTP Loss 位于不同的数值尺度上。平衡 Loss 权重是一项 hyperparameter search。架构有效，但复杂。

Show-o 的答案是：保持两种 modalities 都是离散的（像 Chameleon 一样），但通过 masked discrete diffusion 并行生成 images，而不是顺序生成。训练目标变成一个单一的 masked-token-prediction，它自然地泛化 next-token-prediction。

## 概念
### Masked discrete diffusion (MaskGIT)

原始 Chang et al. (2022) 的 MaskGIT 技巧很优雅。从一个 fully-masked image 开始（每个 Token 都是特殊的 `<MASK>` id）。在每一步中，并行预测所有 masked Tokens，然后保留 top-K 个置信度最高的预测，并重新 mask 其余部分。大约 8-16 次迭代后，所有 Tokens 都被填充完成。每一步 unmask 多少 Tokens 的 schedule 需要调优，cosine schedules 效果很好。

训练很简单：从 [0, 1] 中均匀采样一个 masking ratio，将其应用到 image 的 VQ tokens 上，训练 Transformer 恢复被 mask 的部分。这正是 BERT 对 text 做的事情，只是扩展到了 image generation。

### Show-o：one Transformer, hybrid mask

Show-o 将 MaskGIT 放进 causal-language-model Transformer。Attention mask 如下：

- Text tokens：causal（标准 LLM）。
- Image tokens：在 image block 内 fully bidirectional（这样 masked Tokens 在预测时可以看到所有其他 image Tokens）。
- Text-to-image：text attend 到之前的 images，image attend 到之前的 text。

训练在以下任务之间交替：
1. text 序列上的标准 NTP。
2. T2I 样本：text → image，使用 masked image tokens 和 masked-token-prediction Loss。
3. VQA 样本：image → text，使用 masked text tokens（本质上就是 NTP）。

统一 Loss 是 `<MASK>` Tokens 上的 cross-entropy，它同时覆盖 text NTP（只有最后一个 Token 被“masked”）和 image masked-diffusion（随机子集被 masked）。

### Parallel sampling

Show-o 用约 16 步生成一张 image，而不是约 1000 步（每个 Token autoregressive）或约 20 步（Diffusion）。在每一步中，并行预测所有 masked Tokens；提交 top-K 高置信度 Tokens；重复。

对比：
- Chameleon / Emu3（对 Tokens autoregressive）：N_tokens 次 forward passes，通常每张 image 1024-4096 次。
- Transfusion（continuous Diffusion）：约 20 步，每步一次完整 Transformer pass。
- Show-o（masked discrete diffusion）：约 16 步，每步一次完整 Transformer pass。

在相近规模模型下，Show-o 比 Chameleon 更快；它大致匹配 Transfusion 的步数，同时每步成本更低（discrete vocab logits vs continuous MSE Loss）。

### Tasks in one checkpoint

Show-o 在推理时支持四类任务，由 prompt format 选择：

- Text generation：标准 autoregressive text output。
- VQA：image in, text out。
- T2I：text in，通过 masked discrete diffusion 输出 image。
- Inpainting：输入带有部分 masked Tokens 的 image，并填充。

inpainting 能力来自 masked-prediction 训练，几乎是免费的。mask VQ-token grid 的一个区域，输入其余部分加一个 text prompt，预测 masked Tokens。

### Masking schedule

每一步 unmask 多少 Tokens 的 schedule 会塑造质量。Show-o 推荐 cosine：

```
mask_ratio(t) = cos(pi * t / (2 * T))   # t = 0..T
```

第 0 步，所有 Tokens 都被 masked（ratio 1.0）。第 T 步，没有 Tokens 被 masked。Cosine 将权重集中在中间区间的 ratios，在那里预测最有信息量。Linear schedules 也可用，但更快进入 plateau。

### Show-o2

Show-o2（2025 follow-up, arXiv 2506.15564）扩展了 Show-o：更大的 LLM base、更好的 Tokenizer、改进的 mask schedule。架构模式相同。

### Where Show-o sits

在 2026 taxonomy 中：

- Discrete tokens + NTP：Chameleon、Emu3。简单但推理慢。
- Discrete tokens + masked diffusion：Show-o、MaskGIT、LlamaGen、Muse。并行采样，但仍受 Tokenizer lossy 限制。
- Continuous + Diffusion：Transfusion、MMDiT、DiT。质量最高，训练更复杂。
- Continuous + flow matching in a VLM：JanusFlow、InternVL-U。最新路线。

按任务选择：当你想在一个 open model 中同时获得 T2I + inpainting + VQA，并且速度合理时，选择 Show-o；当质量最重要且你能承担 two-loss plumbing 时，选择 Transfusion。

## 使用它
`code/main.py` 模拟 Show-o sampling：

- 一个包含 16 个 VQ tokens 的 toy grid。
- 一个 mock “Transformer”，它基于 prompt 和当前 unmasked Tokens 预测 logits。
- 使用 cosine schedule 做 8 步并行 masked sampling。
- 打印中间状态（mask pattern evolution）和最终 Tokens。

运行它，观察 mask 如何一步步消解。

## 交付它
本课产出 `outputs/skill-unified-gen-model-picker.md`。给定一个既需要 understanding（VQA, captioning）又需要 generation（T2I, inpainting）的产品，并且有 open-weights 约束，它会在 Show-o family、Transfusion/MMDiT family 和 Emu3 / Chameleon family 之间做选择，并给出具体 trade-offs。

## 练习
1. Masked discrete diffusion 在约 16 步内完成采样。为什么不是 1 步？如果你在第 0 步 unmask 所有内容，会出什么问题？

2. 使用 masked diffusion 时，inpainting 几乎是免费的。提出一个产品用例（真实或假设），其中 Show-o 的 inpainting 胜过 specialist model。

3. Cosine schedule vs linear schedule：跟踪 T=8 时每一步 unmasked Tokens 的数量。哪一个更均衡？

4. 一张 512x512 的 Show-o image 是 1024 Tokens。在 vocab K=16384 时，模型输出 1024 * log2(16384) = 14,336 bits（约 1.75 KiB）的数据。Stable Diffusion 输出 512*512*24 bits = 6,291,456 bits（约 768 KiB）的 raw pixels。compression ratio 是多少？它换来了什么质量？

5. 阅读 LlamaGen（arXiv:2406.06525）。LlamaGen 的 class-conditional autoregressive image model 与 Show-o 的 masked approach 有何不同？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Masked discrete diffusion | “MaskGIT-style” | 训练模型预测 masked Tokens；推理时，迭代式 unmask 置信度最高的预测 |
| Cosine schedule | “Unmask schedule” | mask ratio 随推理步数衰减；将置信度增长集中在中间区间 |
| Parallel decoding | “All tokens at once” | 每一步用一次 forward pass 预测完整的 masked Token 序列，然后提交 top-K |
| Hybrid attention | “Causal + bidirectional” | 一种 mask：对 text tokens 是 causal，在 image blocks 内是 bidirectional |
| Inpainting | “Fill-in generation” | 以部分 Tokens 被 masked 的 image 为条件，预测缺失部分；从训练目标中免费获得 |
| Commitment rate | “Top-K per step” | 每次迭代中有多少 Tokens 被声明为“完成”；控制推理与质量的 trade-off |

## 延伸阅读
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
- [Show-o2 (arXiv:2506.15564)](https://arxiv.org/abs/2506.15564)
- [Chang et al. — MaskGIT (arXiv:2202.04200)](https://arxiv.org/abs/2202.04200)
- [Sun et al. — LlamaGen (arXiv:2406.06525)](https://arxiv.org/abs/2406.06525)
- [Chang et al. — Muse (arXiv:2301.00704)](https://arxiv.org/abs/2301.00704)
