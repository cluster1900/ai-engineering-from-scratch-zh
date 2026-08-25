# LLaVA 与 Visual Instruction Tuning

> LLaVA（2023 年 4 月）是地球上被复制最多的 Multimodal 架构。它用 2-layer MLP 替代了 BLIP-2 的 Q-Former，用朴素的 Token concatenation 替代了 Flamingo 的 gated cross-attention，并在 158k 条 visual-instruction turns 上训练，这些数据由 GPT-4 从纯文本 captions 生成。任何在 2023 到 2026 年间构建 VLM 的实践者，都构建过某种 LLaVA 变体。LLaVA-1.5 加入了 AnyRes。LLaVA-NeXT 提高了分辨率。LLaVA-OneVision 用一个 recipe 统一了 image、multi-image 和 video。本课会阅读这个 recipe，实现 projector，并解释为什么 “simpler won”。

**类型：** 构建
**语言：** Python（stdlib、projector + instruction-template builder）
**先修：** Phase 12 · 02（CLIP），Phase 11（LLM Engineering — instruction tuning）
**时间：** ~180 分钟

## 学习目标

- 构建一个 2-layer MLP projector，将 ViT patch Embedding（dim 1024）映射到 LLM 的 Embedding dim（dim 4096）。
- 走通 LLaVA two-stage recipe：（1）在 558k caption pairs 上做 projector alignment，（2）在 158k GPT-4-generated turns 上做 visual instruction tuning。
- 构造一个 LLaVA-format prompt，包含 image Token placeholder、system prompt 和 user/assistant turns。
- 解释为什么社区从 Q-Former 转向 MLP，尽管 Q-Former 在 Token budget 上有优势。

## 问题

BLIP-2 的 Q-Former（Lesson 12.03）把一张图像压缩成 32 个 Token。干净、高效、benchmark 表现好。但它有两个问题。

第一，Q-Former 是可训练的，但它的 Loss 不是最终任务。Stage 1 训练 ITC+ITM+ITG。Stage 2 训练 LM loss。queries 学到某种中间表示，然后 LLM 还必须解码它。瓶颈中会丢失信息。

第二，Q-Former 有 188M params，而在 LLaVA 的 2023 年规模下，你必须把它和目标 LLM 一起协同设计。换 LLM，就要重新训练 Q-Former。换 vision encoder，也要重新训练。每一种组合都是一个独立的 R&D 项目。

LLaVA 的答案简单到令人尴尬：取 ViT 的 576 个 patch Token，让每个 Token 通过一个 2-layer MLP（`1024 → 4096 → 4096`），然后把全部 576 个都塞进 LLM 的输入序列。没有瓶颈。没有基于奇怪目标的 stage 1 pretraining。只是在直接的 LM loss 上训练 MLP。

数据从哪里来？LLaVA 的第二个洞见：使用 GPT-4（text-only）生成 instruction data。把图像的 COCO caption 和 bounding-box data 输入 GPT-4，让它生成 conversations、descriptions 和 complex reasoning questions。免费得到 158k instruction-response turns。无需人工标注。

结果：一个在 8 张 A100 上运行一天、在 MMMU 上击败 Flamingo、并发布了社区可以扩展的 open checkpoint 的 VLM。到 2023 年末，它已经催生了 50+ forks。

## 概念

### 架构

LLaVA-1.5 at 13B：
- Vision encoder：CLIP ViT-L/14 @ 336（stage 1 冻结，stage 2 可选解冻）。
- Projector：带 GELU activation 的 2-layer MLP，`1024 → 4096 → 4096`。
- LLM：Vicuna-13B（后来是 Llama-3.1-8B）。

图像 + 文本 prompt 的 forward pass：

```
img -> ViT -> 576 patches of dim 1024
patches -> MLP -> 576 tokens of dim 4096
prompt: system + "<image>" placeholder + user question
replace <image> token with the 576 projected tokens
feed the full sequence to the LLM
decode response
```

图像占用 LLM context 中的 576 个 Token。在 2048 context 下，文本还剩 1472 个 Token。在 32k context 下，这只是一个舍入误差。

### Stage 1：projector alignment

冻结 ViT。冻结 LLM。只训练 2-layer MLP。Dataset：558k image-caption pairs（LAION-CC-SBU）。Loss：在 projected image Token 条件下，对 caption 做 language modeling。

以 batch 128 训练单个 epoch，几小时就能完成。projector 学会把 ViT-space 映射到 LLM-space。没有 task-specific supervision。

### Stage 2：visual instruction tuning

解冻 projector（仍然可训练）。解冻 LLM（通常全量，有时用 LoRA）。在 158k visual-instruction turns 上训练。

instruction data 是关键技巧。Liu et al. 的生成方式：
1. 取一张 COCO 图像。
2. 提取文本描述（5 条 human captions + bounding-box list）。
3. 用三种 prompt templates 发送给 GPT-4：
   - Conversation：“生成一段用户和 assistant 围绕这张图片来回交流的对话。”
   - 详细描述：“Give a rich, detailed description of the image.”
   - 复杂推理：“提出一个需要根据图像进行推理的问题，然后回答它。”
4. 将 GPT-4 的输出解析为（instruction, response）pairs。

整个过程并不直接接触图像——只接触文本描述。GPT-4 会 hallucinate 合理的图像内容。有一些噪声，但它奏效了：158k turns 足以解锁对话能力。

### 为什么社区复制了这个方案

- 没有需要调参的 stage-1-specific losses。全程使用 LM loss。
- Projector 训练以小时计，而不是以天计。
- 通过只重新训练 projector，就可以替换 LLM（LLaVA-Llama2、LLaVA-Mistral、LLaVA-Llama3）。
- Visual-instruction data pipeline 使用 GPT-4，且针对新领域重新生成的成本很低。

### LLaVA-1.5 与 LLaVA-NeXT

LLaVA-1.5（2023 年 10 月）加入：
- 将 academic-task data（VQA、OKVQA、RefCOCO）混入 instruction tuning。
- 更好的 system prompt。
- 2048 → 32k context。

LLaVA-NeXT（2024 年 1 月）加入：
- AnyRes：把高分辨率图像切成 2x2 或 1x3 网格的 336x336 crops，再加一个 global low-res thumbnail。每个 crop 变成 576 个 Token；每张图像总计约 2880 个 visual Token。OCR 和 chart 任务大幅提升。
- 使用 ShareGPT4V（高质量 GPT-4V captions）的更好 instruction data mixture。
- 更强的 base LLMs（Mistral-7B、Yi-34B）。

### LLaVA-OneVision

Lesson 12.08 会深入讲 OneVision。简短版本：同一个 projector，但用一个 curriculum 训练，在一个模型中覆盖 single-image、multi-image 和 video，并共享 visual-token budget。

### 与 Q-Former 的比较

| | Q-Former（BLIP-2） | MLP（LLaVA） |
|---|---|---|
| 每张图像的 visual Token | 32 | 576（base）或 2880（AnyRes） |
| 可训练参数 | 188M + LM | 40M + LM |
| Stage 1 loss | ITC+ITM+ITG | 仅 LM |
| LLM drop-in | 需要重新训练 | 最小重新训练即可替换 |
| Multi-image | 别扭 | 自然（concat） |
| Video | 别扭 | 自然（per-frame concat） |
| Token budget | 小 | 大 |

MLP 赢在简单性和 Token 灵活性。Q-Former 赢在 Token budget。到 2023 年末，Token budget 已经不再是约束瓶颈（LLM contexts 增长到 32k-128k+），简单性占了上风。

### Prompt format

```
A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions. USER: <image> Describe this image in detail. ASSISTANT: The image shows ...
```

`<image>` 是 placeholder Token。在 tokenization 之前，它会被替换为 576 个 visual Token（AnyRes 下为 2880 个）。Tokenizer 看到的序列会比它训练时稍长，但 LLM 能处理这种新输入，因为 stage 1 已经教会了它。

### 参数经济性

LLaVA-1.5-7B 分解：
- CLIP ViT-L/14 @ 336：303M（stage 1 冻结，stage 2 通常解冻）。
- Projector（2x linear）：~22M 可训练。
- Llama-7B：7B。
- 总计：7.3B params。stage 2 期间可训练：完整 7B + 22M projector。

Stage 2 的训练成本：8xA100 上约 20 小时。这是关键数字——一天、一个节点、可复现。这就是 LLaVA 扩散开来的原因。

```figure
mm-llava-projector
```

## 使用它

`code/main.py` 实现：

1. 纯 Python 中的 2-layer MLP projector（toy scale 下 dim 16 → 32 → 32）。
2. Prompt-building pipeline：system prompt + 用 N 个 projected Token 替换 `<image>` + user turn + assistant generation placeholder。
3. 一个 visualizer，用来展示 576-token visual block 在 LLM context 中的样子（占用 2k / 32k / 128k context 的百分比）。

## 交付它

本课产出 `outputs/skill-llava-vibes-eval.md`。给定一个 LLaVA-family checkpoint，它会运行一个 10-prompt vibes-eval suite（3 个 captioning、3 个 VQA、2 个 reasoning、2 个 refusal），并报告一个人类可读的 scorecard。它不是 benchmark；而是 smoke test，用来确认 projector 和 LLM 连接良好。

## 练习

1. 计算 `1024 → 4096 → 4096` 的 2-layer MLP projector 的 trainable-parameter count。带 GELU 和 bias 时，它占 LLaVA-13B 的比例是多少？

2. 为一个 “refusal” case 构造 LLaVA prompt——图像包含私人个体。写出预期的 assistant response。为什么 LLaVA 应该 zero-shot 拒绝这个请求？需要什么训练数据来强化拒绝？

3. 阅读 LLaVA-NeXT blog 的 AnyRes 部分。计算一张 1344x672 图像在 AnyRes 下的 visual Token count。与 336x336 下的 base 576 Token 对比。

4. LLaVA stage-1 projector 使用 captions 上的 LM loss 训练。如果跳过 stage 1，直接进入 stage 2（visual instruction tuning），会发生什么？引用 Prismatic VLMs ablation（arXiv:2402.07865）作答。

5. LLaVA-Instruct-150k 使用 GPT-4 和 COCO captions 生成 instructions。对于一个新领域（medical X-rays、satellite imagery），描述生成 domain instructions 的四步 data pipeline。每一步可能出什么问题？

## 关键术语

| 术语 | 人们的说法 | 它实际上的含义 |
|------|----------------|------------------------|
| Projector | “MLP bridge” | 带 GELU 的 2-layer MLP，将 ViT dim 映射到 LLM dim |
| Image Token | “<image> placeholder” | Prompt marker，在 inference 前被 N 个 projected visual Token 替换 |
| Visual instruction tuning | “LLaVA stage 2” | 在 GPT-4-generated（image, instruction, response）triplets 上训练 |
| Stage 1 alignment | “Projector pretraining” | 冻结 ViT 和 LLM，用 captions 上的 LM loss 训练 projector |
| AnyRes | “Multi-crop tiling” | 将高分辨率图像切分为 tile grid，并拼接每个 tile 的 visual Token |
| LLaVA-Instruct | “GPT-4-generated” | 从 COCO captions + GPT-4 合成的 158k instruction-response pairs |
| Vision encoder freeze | “Backbone locked” | CLIP weights 在 stage 1 不更新，有时在 stage 2 也不更新 |
| ShareGPT4V | “Better captions” | 由 GPT-4V 生成的 1M dense captions，用于更高质量 alignment |
| VQA | “Visual question answering” | 回答关于图像的自由形式问题的任务 |
| Prismatic VLMs | “Design-space paper” | Karamcheti 2024 ablation，系统测试 projector 和 data choices |

## 延伸阅读

- [Liu et al. — Visual Instruction Tuning (arXiv:2304.08485)](https://arxiv.org/abs/2304.08485) — LLaVA 论文。
- [Liu et al. — Improved Baselines with Visual Instruction Tuning (arXiv:2310.03744)](https://arxiv.org/abs/2310.03744) — LLaVA-1.5。
- [Chen et al. — ShareGPT4V (arXiv:2311.12793)](https://arxiv.org/abs/2311.12793) — dense captions 数据集。
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865) — design-space ablations。
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326) — 统一的单图、多图、视频。
