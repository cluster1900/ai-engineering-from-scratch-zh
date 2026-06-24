# CLIP 与 Contrastive Vision-Language Pretraining

> OpenAI 的 CLIP（2021）证明了一个足以驱动接下来五年的核心想法：只使用嘈杂的 Web image-caption pairs 和一个 contrastive loss，把 image encoder 与 text encoder 对齐到同一个 Vector space 中。零 supervised labels。400M pairs。得到的 Embedding space 可以做 zero-shot classification、image-text retrieval，并作为 vision tower 接入 2026 年的每个 VLM。SigLIP 2（2025）用 sigmoid 替代 softmax，并以更低成本扩展到超过 CLIP。本课会从 InfoNCE 到 sigmoid pairwise loss 推导数学，并用 stdlib Python 构建 training step。

**Type:** Build
**Languages:** Python（stdlib，InfoNCE + sigmoid loss 实现）
**Prerequisites:** Phase 12 · 01（ViT patches），Phase 7（Transformers）
**Time:** ~180 分钟

## 学习目标
- 从 mutual information 推导 InfoNCE loss，并实现一个数值稳定的 Vectorized 版本。
- 解释为什么 sigmoid pairwise loss（SigLIP）可以扩展到 batch 32768+，且不需要 softmax 所要求的 all-gather 开销。
- 通过构造 text templates（`a photo of a {class}`）并对 cosine similarity 取 argmax，运行 zero-shot ImageNet classification。
- 说出 CLIP / SigLIP pretraining 给你的四个杠杆：batch size、temperature、prompt template、data quality。

## 问题
CLIP 之前的 vision 是 supervised。收集 labeled datasets（ImageNet：1.2M images，1000 classes），训练 CNN，然后发布。Labels 昂贵，labels 会偏向标注者能达成一致的内容，并且在没有 finetuning 的情况下，labels 无法迁移到新任务。

image-caption Web 免费提供了十亿级 loosely-labeled pairs。一张 golden retriever 的照片，alt text 是 "my dog Max in the park"，它携带了一个监督信号：文本描述了图像。问题是：你能把它转化为有用的训练吗？

CLIP 的答案：把 image-caption pairs 当作匹配任务。给定一个包含 N 张 images 和 N 条 captions 的 batch，学习将每张 image 与它自己的 caption 匹配，并区分 N-1 个 distractors。监督信号是“这两个东西属于一起；这 N-1 个不属于一起。”没有 class labels。没有人工标注。只有一个 contrastive loss。

得到的 Embedding space 能做的不止 CLIP 被训练去做的事情。ImageNet zero-shot 能工作，是因为 "a photo of a cat" 的 Embedding 会接近那些从未被显式标注为 cat 的猫图像。这就是催生每个 2026 VLM 的赌注。

## 概念
### The dual encoder

CLIP 有两个 towers：

- Image encoder `f`：ViT 或 ResNet，每张 image 输出一个 D-dim Vector。
- Text encoder `g`：小型 transformer，每条 caption 输出一个 D-dim Vector。

两个 towers 都把输出 normalize 到 unit length。由于二者都是 unit-norm，similarity 是 `cos(f(x), g(y)) = f(x)^T g(y)`。

对于一个包含 N 个（image, caption）pairs 的 batch，构建 shape 为 `(N, N)` 的 similarity Matrix `S`：

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

其中 `tau` 是学习得到的 temperature（CLIP 初始化为 0.07；在 log-space 中学习）。

### InfoNCE loss

CLIP 在 rows 和 columns 上使用 symmetric cross-entropy：

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

这就是 InfoNCE。CE 中的 softmax 强制每张 image 与它的 caption 的匹配程度高于 batch 中所有其他 caption。"negatives" 是所有其他 batch items。更大的 batches = 更多 negatives = 更强信号。CLIP 在 batch 32k 上训练；scale 很重要。

### Temperature

`tau` 控制 softmax 的 sharpness。低 tau → sharp distribution，具有 hard negative mining 效果。高 tau → soft，所有 samples 都会贡献。CLIP 学习 log(1/tau)，并进行 clipping 以防 collapse。SigLIP 2 固定初始 tau，并改用 learned bias。

### 为什么 sigmoid 扩展性更好（SigLIP）

Softmax 需要整个 similarity Matrix 保持同步。在 distributed training 中，你必须把每个 Embedding all-gather 到每个 replica，然后做 softmax。这在通信上相对于 world size 是 quadratic。

SigLIP 用 element-wise sigmoid 替代 softmax：对于每个 pair `(i, j)`，loss 是一个 binary classification，判断“这是不是匹配 pair？”positive class labels 是 diagonal，其他所有都是 negative。Loss 是：

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

如果 `i == j`，则 `y_ij = 1`，否则为 0。每个 pair 的 loss 是独立的。不需要 all-gather。每个 GPU 计算自己的 local block 并求和。SigLIP 2 可以低成本扩展到 batch 32k-512k，而 CLIP 会需要按比例增加通信。

### Zero-shot classification

给定 N 个 class names，为每个 class 构建一个 text template：

```
"a photo of a {class}"
```

用 text encoder Embedding 每个 template。用 image encoder Embedding 你的 image。Argmax cosine similarity = predicted class。不需要在目标 classes 上训练。

Prompt templates 很重要。CLIP 原论文为每个 class 使用了 80 个 templates（plain、artistic、photo、painting 等）并平均 Embeddings。ImageNet 提升 +3 points。现代用法通常选择一两个 templates。

### Linear probes 与 finetuning

Zero-shot 是 baseline。Linear probe（在 frozen CLIP features 之上为目标 classes 训练一个 linear layer）在 in-domain tasks 上胜过 zero-shot。Full finetuning 在 in-domain 上胜过 linear probe，但可能损害 zero-shot transfer。三种 regimes，三种 trade-offs。

### SigLIP 2：NaFlex 和 dense features

SigLIP 2（2025）加入：
- NaFlex：单个 model 处理 variable aspect ratios 和 resolutions。
- 更好的 dense features，用于 segmentation 和 depth estimation，目标是在 VLMs 中作为 frozen backbone。
- Multilingual：在 100+ languages 上训练，而 CLIP 仅 English-only。
- 1B param scale，而 CLIP 最高到 400M。

在 2026 年的 open VLMs 中，SigLIP 2 SO400m/14 是默认 vision tower。对于纯 image-text retrieval，如果具体的 LAION-2B training distribution 匹配你的 query pattern，CLIP 仍然是默认选择。

### ALIGN, BASIC, OpenCLIP, EVA-CLIP

ALIGN（Google，2021）：与 CLIP 相同的想法，1.8B pair scale，90% noisy。证明 noisy data 可以 scale。OpenCLIP（LAION）：在 LAION-400M / 2B 上对 CLIP 的 open reproduction，多种 scales，是常用的 open checkpoint。EVA-CLIP：从 masked image modeling 初始化；是 VLMs 的强 backbone。BASIC：Google 的 CLIP+ALIGN hybrid。它们都属于同一 family，只是 data 和 tuning 不同。

### The zero-shot ceiling

CLIP-class models 的 ImageNet zero-shot 上限约为 76%（CLIP-G、OpenCLIP-G）。继续提升需要更大的 data（SigLIP 2 达到 80%+）或 architecture changes（supervised heads、更多 parameters）。Benchmark 正在饱和；真正的价值是下游 VLMs 消费的 Embedding space。


```figure
multimodal-fusion
```

## 使用它
`code/main.py` 实现了：

1. 一个 toy dual encoder（hash-based image features、text char features），让你无需 numpy 就能看到 InfoNCE 的形状。
2. 纯 Python 的 InfoNCE loss（通过 log-sum-exp 保证 numerical stability）。
3. 用于对比的 sigmoid pairwise loss。
4. 一个 zero-shot classification routine：计算与一组 text prompts 的 cosine similarity，并用 argmax 进行 prediction。

运行它并观察 loss curve。绝对数值是 toy；形状与真实 CLIP trainer 输出一致。

## 交付它
本课生成 `outputs/skill-clip-zero-shot.md`。给定一组 images（通过 path）和一组 target classes，它会使用 CLIP template 构建 text prompts，用指定 checkpoint（例如 `openai/clip-vit-large-patch14`）Embedding 两侧，并返回带 similarity scores 的 top-1 / top-5 predictions。该 skill 拒绝对 prompt list 中不存在的 classes 做出判断。

## 练习
1. 手动为一个包含 4 个 pairs 的 batch 实现 InfoNCE。构造 4x4 similarity Matrix，运行 softmax，取出 diagonal，计算 cross-entropy。用这个手算结果验证你的 Python 实现。

2. 除了 temperature，SigLIP 还使用 bias parameter `b`：`S'[i,j] = S[i,j]/tau + b`。当 batch 存在较大的 class imbalance（每行 negatives 远多于 positives）时，`b` 起什么作用？阅读 SigLIP Section 3（arXiv:2303.15343）。

3. 为 cats vs dogs 构建一个 zero-shot classifier。尝试两个 prompt templates：`a photo of a {class}` 和 `a picture of a {class}`。在 100 张 test images 上测量 accuracy。Templates 的 ensemble 是否优于单个 template？

4. 计算 512-GPU、batch 32k 运行时，softmax InfoNCE 与 sigmoid pairwise 的 communication cost。哪个按 O(N) scale，哪个按 O(N^2) scale？引用 SigLIP Section 4。

5. 阅读 OpenCLIP scaling-laws paper（arXiv:2212.07143，Cherti et al.）。根据图表复现他们关于 data scaling 的结论：在 fixed model size 下，ImageNet zero-shot accuracy 与 training data size 之间的 log-linear relationship 是什么？

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| InfoNCE | "Contrastive loss" | 对一个 batch 的 similarity Matrix 做 cross-entropy；每个 item 的 positive 是它配对的 item，negatives 是其他所有项 |
| Sigmoid loss | "SigLIP loss" | Per-pair binary cross-entropy；没有 softmax，没有 all-gather，在 distributed training 中低成本 scale |
| Temperature | "tau" | 在 softmax/sigmoid 之前缩放 logits 的 scalar；控制 distribution 的 sharpness |
| Zero-shot | "no-finetune classification" | 使用 text prompts 构建 class Embeddings，并通过 cosine similarity 分类；不在目标 classes 上训练 |
| Prompt template | "a photo of a ..." | 围绕 class name 的文本脚手架；会影响 zero-shot accuracy 1-5 points |
| Dual encoder | "Two-tower" | 一个 image encoder + 一个 text encoder，输出到共享 D-dim space |
| Hard negative | "Tough distractor" | 与 positive 足够相似的 negative，迫使 model 努力将它们分开 |
| Linear probe | "Frozen + one layer" | 只在 frozen features 之上训练一个 linear classifier；衡量 feature quality |
| NaFlex | "Native flexible resolution" | SigLIP 2 的能力：无需 resize 即可摄入任意 aspect ratio 和 resolution 的 images |
| Temperature scaling | "log-parametrized tau" | CLIP 将 `log(1/tau)` 参数化，使 gradients 表现良好；通过 clipping 防止 collapse 到接近零的 tau |

## 延伸阅读
- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020) — CLIP paper。
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) — SigLIP。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) — multilingual + NaFlex。
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) — 用 noisy web data scale。
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) — OpenCLIP scaling laws。
