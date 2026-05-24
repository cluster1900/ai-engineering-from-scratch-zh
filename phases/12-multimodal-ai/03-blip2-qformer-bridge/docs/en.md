# 从 CLIP 到 BLIP-2 — Q-Former 作为 Modality Bridge

> CLIP 对齐图像和文本，但不能生成 caption、回答问题或进行对话。BLIP-2 (Salesforce, 2023) 用一个小型可训练桥接解决了这个问题：32 个可学习 query Vector 通过 cross-attention 关注 frozen ViT 的 features，然后直接插入 frozen LLM 的输入流。188M 参数的桥接把一个 11B LLM 连接到 ViT-g/14。到 2026 年为止，每个基于 adapter 的 VLM —— MiniGPT-4、InstructBLIP、LLaVA 的近亲 —— 都是它的后代。本课阅读 Q-Former 的架构，解释它的两阶段训练，并构建一个 toy 版本，把 visual Token 输入到 frozen text decoder 中。

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**前置要求:** Phase 12 · 02 (CLIP), Phase 7 (Transformers)
**Time:** ~180 minutes

## 学习目标
- 解释为什么在 frozen vision encoder 和 frozen LLM 之间放一个可训练瓶颈，在成本和稳定性上优于 end-to-end finetuning。
- 实现一个 cross-attention block，其中一组固定的 learnable queries 关注外部 image features。
- 走读 BLIP-2 的两阶段预训练：representation (ITC + ITM + ITG)，然后 generative（使用 frozen decoder 的 LM loss）。
- 将 Q-Former 与 LLaVA 中使用的更简单 MLP projector 进行比较，并论证各自何时更占优。

## 问题
你有一个 frozen ViT，它为每张图像产生 256 个 dim 1408 的 patch Token。你有一个 frozen 7B LLM，它期望 dim 4096 的 Token Embedding。显而易见的桥接 —— 从 1408 到 4096 的 linear layer —— 可以工作，但把全部 256 个 patch Token 输入到 LLM 的 context 中，会让每张图像额外消耗 256 个 Token。对于 32 张图像的 batch，仅视觉模态就会消耗 8192 个 Token。

BLIP-2 的问题是：能否把 256-Token 图像 representation 压缩成少得多的 Token（比如 32 个），同时保留足够信息，让 LLM 能够为图像生成 caption、回答问题并进行推理？并且能否在不触碰 frozen backbones 的情况下训练这个桥接，把训练成本限制在桥接参数上？

答案是：Q-Former。32 个可学习的 "query" Vector，对 ViT 的 patch Token 做 cross-attend，生成一个 32-Token 的视觉摘要供 LLM 使用。总计 188M 参数。在接触 LLM 之前，先用 contrastive、matching 和 generative objectives 训练。

## 概念
### Learnable queries

Q-Former 的核心技巧：不是让 LLM 的文本 Token 去关注图像 patches，而是引入一组新的 32 个可学习 query Vector `Q`，并让*它们*关注图像 patches。这些 queries 是模型参数 —— 它们在训练期间学习，并且同一组 32 个 queries 用于每张图像。

经过 cross-attention 后，每个 query 持有图像的一个压缩摘要 —— “描述主要对象”、“描述背景”、“计数对象”等。queries 并不会字面上专门对应语义标签；它们会学习任何能让 downstream losses 下降的 encoding。

### Architecture

Q-Former 是一个小型 transformer（12 层，约 100M params），有两条路径：

1. Query path：32 个 query Vector 流经 self-attention（彼此之间），然后对 frozen ViT 的 patch Token 做 cross-attention，最后经过 FFN。
2. Text path：一个类似 BERT 的 text encoder 与 query path 共享 self-attention 和 FFN weights。text path 禁用 cross-attention。

训练时两条路径都会运行。queries 和文本通过共享 self-attention 交互，这意味着在需要文本的任务（ITM、ITG）中，queries 可以以文本为条件。VLM 交接的 inference 阶段，只让 queries 流过，产生 32 个 visual Token。

### Two-stage training

BLIP-2 分两阶段预训练：

Stage 1：representation learning（无 LLM）。三种 losses：
- ITC (image-text contrastive)：CLIP-style contrastive，作用于 pooled query Token 和 text CLS Token。
- ITM (image-text matching)：binary classifier —— 这对 image-text 是否匹配？使用 hard-negative-mined。
- ITG (image-grounded text generation)：文本上的 causal LM head，以 queries 为条件。迫使 queries 编码可由文本生成的内容。

只训练 Q-Former。ViT 是 frozen。没有 LLM 参与。

Stage 2：generative learning。接入一个 frozen LLM（OPT-2.7B 或 Flan-T5-XL 等）。通过一个小型 linear layer 将 32 个 query 输出投影到 LLM 的 Embedding dim。把它们前置到文本 prompt。只在拼接后的 prompt + image + caption 序列上的 LM loss 训练 linear projection 和 Q-Former。

Stage 2 之后，Q-Former + projection 就是完整的 visual adapter。Inference 时：image → ViT → Q-Former → linear proj → 前置到 text → frozen LLM 发出输出。

### Parameter economics

BLIP-2 使用 ViT-g/14（1.1B，frozen）+ OPT-6.7B（6.7B，frozen）+ Q-Former（188M，trained）= 总计 8B，训练 188M。Q-Former 本身约为完整 stack 参数的 2.4%。训练成本也体现这一点：少量 A100 上训练数天，而不是 end-to-end 训练数周。

质量：BLIP-2 在 zero-shot VQA 上达到或超过 Flamingo-80B，同时体量小 50 倍。这个桥接有效。

### InstructBLIP 与指令感知型 Q-Former

InstructBLIP (2023) 用一个额外输入扩展了 Q-Former：instruction text 本身。在 cross-attention 时，queries 现在可以访问图像 patches 和 instruction。queries 可以按 instruction 专门化（"count the cars"、"describe the mood"），而不是学习单个固定摘要。在 held-out tasks 上 benchmark 提升。

### MiniGPT-4 与 projector-only approach

MiniGPT-4 保留了 Q-Former，但只训练输出 linear projection，同时冻结其他所有部分。便宜，但代价是质量 —— queries 是 BLIP-2 的，不是你的。适合快速迭代，但不是最佳架构。

### Why LLaVA went simpler

LLaVA（2023，Lesson 12.05）用普通的 2-layer MLP 替换了 Q-Former，将每个 ViT patch Token 投影到 LLM 空间 —— 对 24x24 网格，每张图像 576 个 Token，全部输入 LLM。压缩更差，但让 LLM 能关注原始 patches。当时这很有争议；到 2023 年末它成为主流，因为 visual instruction data（LLaVA-Instruct-150k）证明 MLP 可以训练到保留足够信号。取舍是：LLaVA 的 context 填得更快，但它能自然扩展到 multi-image 和 video。

到 2026 年，领域出现分流：Q-Former 在 Token budget 重要的场景中保留（长视频、多图像）；MLP projector 在每 Token 原始质量优先的场景中占主导。

### Gated cross-attention：Flamingo，这个 ancestor

Flamingo（Lesson 12.04）早于 BLIP-2，使用了相同的 cross-attention 思路，但它发生在每个 frozen LLM layer，而不是作为单个桥接。BLIP-2 表明你可以只压缩到 input layer，仍然有效。Gemini 和 Idefics 结合了两者：交错 input Token 加上可选的 gated cross-attention，用于 in-context few-shot。

### The 2026 descendants

- Q-Former：BLIP-2、InstructBLIP、MiniGPT-4，以及大多数出于 Token budget 原因的视频语言模型。
- Perceiver resampler：Flamingo 的变体（Lesson 12.04）；Idefics family、Eagle、OmniMAE。
- MLP projector：LLaVA、LLaVA-NeXT、LLaVA-OneVision、Cambrian-1。
- Attention pool：VILA、PaliGemma。

四者都有效。决定性问题是你受限于 Token budget，还是受限于 quality-per-token。

## 使用它
`code/main.py` 构建了一个 stdlib Q-Former-style cross-attention：

1. 模拟 256 个 image patch Token（dim 128）。
2. 实例化 32 个 learnable queries（dim 128）。
3. 运行 scaled-dot-product cross-attention（Q 来自 queries，K/V 来自 patches）。
4. 通过 linear layer 投影到 LLM-dim（512）。
5. 输出 32 个 LLM-ready visual Token。

所有数学都用纯 Python（对 Vector 使用 nested loops）。Toy 但 shape 正确。会打印 attention-weight Matrix，这样你可以看到每个 query 从哪些 patches 拉取信息。

## 交付它
本课生成 `outputs/skill-modality-bridge-picker.md`。给定一个目标 VLM 配置（vision encoder Token 数、LLM context budget、部署约束、质量目标），它会推荐 Q-Former vs MLP vs Perceiver resampler，并给出简短理由以及每种 bridge 的参数量估算。

## 练习
1. 用 PyTorch 实现 cross-attention block。验证在 32 个 queries 和 256 个 keys/values 下，attention-weight Matrix 是 32 x 256，并且 softmax 后每一行求和为 1。

2. 在 BLIP-2 stage 1 中，Q-Former 同时运行三种 losses：ITC、ITM、ITG。用 pseudo-code 写出每种的 forward signature。哪一种需要 text encoder path 处于 active？

3. 比较参数量：Q-Former（12 层，768 hidden）vs 2-layer MLP projector（1408 → 4096，两层）。在多大规模的 LLM 上，188M Q-Former 的成本会通过训练效率收回？

4. 阅读 BLIP-2 paper（arXiv:2301.12597）Section 3.2，了解 Q-Former 如何初始化。解释为什么从 BERT-base 初始化（而不是随机初始化）会加速收敛。

5. 对一个 10 分钟视频，以 1 FPS 采样到 60 帧，计算每帧 Token 成本：(Q-Former → 32 tokens/frame) vs (MLP projector → 576 tokens/frame)。哪一个能放进 128k-Token LLM context window？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | 带有 32 个可学习 query Vector 的小型 transformer，对 frozen ViT features 做 cross-attend |
| Learnable queries | "Soft prompt for vision" | 一组固定参数，作为 cross-attention 的 query 侧；按模型学习，在所有输入之间共享 |
| Cross-attention | "Q from here, K/V from there" | query、key、value 来自不同来源的 Attention；queries 从 ViT patches 拉取信息的方式 |
| ITC | "Image-text contrastive" | 应用于 Q-Former pooled queries vs text CLS 的 CLIP-style loss |
| ITM | "Image-text matching" | 在 hard-negative-mined pairs 上的 binary classifier；迫使 queries 区分细粒度不匹配 |
| ITG | "Image-grounded text generation" | 文本以 queries 为条件生成时的 causal LM loss；迫使 queries 编码 text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 单独训练 Q-Former（ITC/ITM/ITG）；Stage 2 接入 frozen LLM，并且只训练 projection + Q-Former |
| Frozen backbone | "Do not finetune" | vision encoder 和 LLM weights 固定；只训练 bridge |
| Projection head | "Linear to LLM dim" | 将 Q-Former 输出映射到 LLM Embedding dimension 的最终 linear layer |
| Perceiver resampler | "Flamingo's version" | 类似的 learnable-query cross-attention，由 Flamingo 在每一层使用，而不是作为单个 bridge |

## 延伸阅读
- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597) — 核心 paper。
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) — 使用 ITC/ITM/ITG 三件套的前身。
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) — "align before fuse" —— stage 1 training 的概念祖先。
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) — instruction-aware Q-Former。
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592) — 仅 projector 的方法。
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) — learnable-query cross-attention 的通用架构。
