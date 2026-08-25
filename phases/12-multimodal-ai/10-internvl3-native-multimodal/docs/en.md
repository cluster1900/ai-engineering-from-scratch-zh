# InternVL3：Native Multimodal Pretraining

> InternVL3 之前的每个开源 VLM 都遵循同一个三步配方：拿一个在数万亿 text tokens 上训练过的 text LLM，接上一个 vision encoder，然后 fine-tune 接缝处。这能工作，但会产生 alignment debt：text LLM 已经把完整的 pretraining budget 花在纯文本上，并不原生理解 visual tokens。当你事后加入 vision 时，LLM 必须重新学习如何把 visual input 和自身 text reasoning 关联起来，同时还不能遗忘文本能力。InternVL3（Zhu et al., April 2025）拒绝 post-hoc 路线：一次 pretraining run，从第一步开始交错训练 text 和 Multimodal。结果是在 78B params 开源条件下，在 MMMU-Pro 上匹配 Gemini 2.5 Pro。本课会解读 native pretraining 的论据，以及采用它之后会发生什么变化。

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## 学习目标
- 解释为什么 post-hoc VLM training 会累积 alignment debt，并引用三个可测量症状（catastrophic forgetting、answer drift、visual-text inconsistency）。
- 描述 InternVL3 的 native pretraining corpus mix，以及 text : interleaved : caption 的比例为什么重要。
- 比较 V2PE（variable visual position encoding）和 Qwen2-VL 的 M-RoPE。
- 说出 Visual Resolution Router (ViR) 和 Decoupled Vision-Language (DvD) 这两个 deployment optimizations。

## 问题
Post-hoc VLM training 是默认做法。LLaVA、BLIP-2、Qwen-VL、Idefics 都会拿一个已经 pretrained 的 LLM（Llama、Vicuna、Qwen、Mistral）并加入 vision。训练阶段通常如下：

1. Frozen LLM + frozen vision encoder + trainable projector，在 caption pairs 上训练以对齐 Embeddings。
2. Unfreeze LLM，在 instruction data（LLaVA-Instruct、ShareGPT4V）上训练。
3. 可选的 task-specific fine-tune。

alignment debt 会表现出三个症状：

- Catastrophic forgetting。post-hoc VLM 会遗忘 text-only 技能。GSM8K 分数下降 5-10 分。Hellaswag 分数下降。纯文本 agents 退化。
- Answer drift。同一个 visual question 的细微表述变化会得到不同答案。vision encoder 与 LLM 的连接，比 LLM 自身 tokens 之间的绑定更弱。
- Visual-text inconsistency。VLM 可以正确描述一张图像，然后又回答出一个与其自身描述相矛盾的问题。visual tokens 不会像文本那样参与 LLM 的内部一致性检查。

这些症状都有充分记录。MM1.5 Section 4 对它们进行了量化。LLaVA-OneVision 的 ablations 也暗示了它们。Native pretraining 就是答案。

## 概念
### Native Multimodal pretraining

InternVL3 从头开始在一个原生 Multimodal 的 corpus 上训练。数据配比如下：

- 40% text-only data（FineWeb、Proof-Pile-2 等）
- 35% interleaved image-text data（OBELICS、MMC4-style）
- 20% paired image-caption data
- 5% video-text data

Vision tokens、text tokens，以及 cross-modal interactions，都从第一个 gradient step 开始参与同一个 Loss。没有 alignment pretraining，没有 projector freezing stage，也没有需要恢复的 catastrophic forgetting。

base model 的训练是单阶段的。Instruction tuning 会随后进行，但 base model 已经把 visual tokens 理解为一等公民。

### V2PE (variable visual position encoding)

Qwen2-VL 使用 M-RoPE，并采用固定的 axis allocation。InternVL3 引入 V2PE：position encoding 会按 modality type（text、image、video）变化，并带有可学习 scaling。实践中：

- Text tokens 获得 1D position（text index）。
- Image patches 获得 2D position（row, col）。
- Video frames 获得 3D position（time, row, col）。

三者共享同一个 RoPE frequency base，但每个 band 的 hidden-dim allocation 是一个学习参数，而不是固定划分。这让 pretraining 期间可以自由权衡 temporal 与 spatial frequency resolution。

V2PE 的 ablation claim：在同等 compute 下，video benchmarks 比 M-RoPE 高 1-2 分。不是革命性变化，但更干净。

### Visual Resolution Router (ViR)

Deployment optimization。并非所有图像都需要 full-resolution encoding。一张只有一个低细节物体的照片，如果按 1280px native 编码，会浪费 tokens。ViR 是一个小 classifier，会在 encoding 之前预测回答问题所需的最低 resolution。

routing 有三档：low-res（256 tokens）、medium（576）、high（2048+）。在 production traffic 中，60% 的 queries 使用 low 或 medium 就足够。净效果：在相同质量下 throughput 提升 2-3x。

### Decoupled Vision-Language deployment (DvD)

当你 serve 一个大型 VLM 时，vision encoder 每张图像运行一次，但 LLM 会为每个 output token 自回归运行。两个组件的瓶颈不同（vision = conv + attention 的 GPU memory bandwidth；LLM = KV cache）。DvD 将它们拆到不同 GPU 上，并在二者之间 streaming。

对于一个 8B + 400M encoder model，DvD 相比 co-located 大约能让每节点 throughput 翻倍。

### Single-stage vs multi-stage quality

InternVL3 的主要 benchmark claim：在 78B params 下匹配 Gemini 2.5 Pro 的 MMMU-Pro。在 38B 下匹配 GPT-4o。在 8B 下领先 open-8B leaderboard。全部基于 single-stage pretrain + instruction-tune recipe。

alignment-debt hypothesis 是可测的：相对于 vision-benchmark gain，InternVL3-8B 在 text benchmarks（MMLU、GSM8K）上的分数损失，比 Qwen2.5-VL-7B 更少。该模型更像一个 generalist，因为训练是一体的，而不是两段拼接。

### InternVL3.5 and InternVL-U

InternVL3.5（August 2025）扩展了这个 recipe。同样的 native-pretrain approach，更多数据，更多 params。MMMU 的改进是增量式的。

InternVL-U（2026）加入 unified generation，也就是在同一个 backbone 顶部通过 MMDiT heads 输出图像。这里的 "U" 代表 "Understanding + generation"，追随 Transfusion-style unified models（Lesson 12.13）。同一个 native-pretrain backbone 同时支持 understanding 和 generation heads。

### native pretraining 的取舍

Native pretraining 不是免费的：

- Compute。从头训练一个新 VLM 的成本和训练一个 text LLM 相同：数百万 GPU-hours。Post-hoc adaptation 复用现有 LLM weights，节省大部分成本。
- Data。大规模 interleaved image-text corpora 很稀缺。OBELICS 有 141M documents；MMC4 有 571M。纯文本可以达到 15T tokens。Multimodal pretraining data scarcity 是硬约束。
- Base-LLM reuse。Native pretraining 放弃了之后换入新 LLM 的选项。Post-hoc 允许你只重新训练 adapter，就把 Llama-3.1 换成 Llama-4。

InternVL3 的赌注是：alignment debt 比 reuse loss 更糟。benchmarks 支持这个主张。生产成本也阻止未来 labs 低成本复制。Post-hoc VLMs 会继续存在，因为对大多数项目来说它们仍然更便宜。

```figure
l5-native-pretrain
```

## 使用它
`code/main.py` 是一个 training-corpus mixer 和 ViR router simulator。它会：

- 接收一个目标 corpus mix（%text、%interleaved、%caption、%video），并计算每种 modality 的 expected steps。
- 在一批 queries 上模拟 ViR routing（distribution：50% low-detail、30% medium、20% high-detail），并报告 average token count。
- 基于 encoder vs LLM FLOPs 报告 DvD throughput estimates。
- 并排打印 post-hoc vs native pretraining 在 params、compute、data，以及 expected alignment-debt symptoms 上的对比。

## 交付它
本课会产出 `outputs/skill-native-vs-posthoc-auditor.md`。给定一个拟议的 VLM training plan，它会审计应该选择 native 还是 post-hoc，标记 alignment-debt risk，并推荐 corpus mix。当你在估算一个新的 open-VLM 项目规模并需要选择训练策略时使用它。

## 练习
1. 估算 InternVL3-8B（native pretrain）和 LLaVA-OneVision-7B（post-hoc）之间的 compute delta。GPU-hours 的比例大约是多少？是什么解释了这个差距？

2. InternVL3 报告的比例是 40% text / 35% interleaved / 20% caption / 5% video。如果你的目标任务偏 video-heavy，请提出一个新比例，并论证为什么 base model 仍然需要大量 text 和 caption data。

3. 阅读 MM1.5 Section 4 中关于 forgetting 的内容。说出 post-hoc training 中出现最大 regression 的确切 benchmark。这个 regression 损失了多少？

4. ViR 将 60% 的 traffic 路由到 low-resolution encoding。它会误路由哪类 queries（在需要 high-res 时发送到 low-res）？提出三个 router-failure modes。

5. DvD 将 vision 和 LLM 拆到不同 GPU 上。在什么 traffic pattern 下，DvD 会损害 throughput 而不是提升 throughput？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Native multimodal pretraining | "From scratch together" | Text + image + video tokens 从第 1 步开始参与 Loss，而不是之后再接上 |
| Alignment debt | "Post-hoc penalty" | 由把 vision 接到 frozen LLM 上导致的 text skills 和 answer consistency 可测量退化 |
| V2PE | "Variable visual pos encoding" | 每个 modality 的可学习 position encoding allocation；InternVL3 的 M-RoPE 后继方案 |
| ViR | "Resolution router" | 小 classifier，在 encoding 前按 query 选择所需最低 resolution，从而节省 inference tokens |
| DvD | "Decoupled deployment" | Vision encoder 在一个 GPU 上，LLM 在另一个 GPU 上，并通过 stream handoff；可让大型 VLMs 的 throughput 翻倍 |
| InternVL-U | "Unified understanding + generation" | 2026 年后续版本，为 native-pretrain backbone 加入 image-generation heads |
| Interleaved corpus | "OBELICS / MMC4" | 文本和图像按自然阅读顺序排列的 documents；native pretraining 的原材料 |

## 延伸阅读
- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
