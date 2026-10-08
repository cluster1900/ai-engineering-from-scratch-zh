# 火器与使用的短枪VLM的门际交叉注意

> 根据"深心的弗拉明戈"的描述,模型就能在没有任何渐进步骤的情况下生成新图像的标题. 它是:插入到结的跨层之间的跨层注意力,并带着学习的门,从零开始,因此LLM文本能力在初始化时可以保留.

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## 学习目标
- 解释关闭的跨界注意力 如何通过 tanh(gate) = 0 在初始化时保留结 LLM的文本能力──
- 逐步讲解 感知器复制样本:N 个图像补丁 → K 个固定 latent查询,经过交叉关注 完成。
- 描述弗拉明戈 如何使用尊重图像位置的因果掩饰 处理交错的图像文本序列──
- 复现几次多模拟提示结构 (图像标题示例,然后是一个查询图像) 』

## 问题
BLIP-2 将输入32个视觉代币. 输入结LLM的输入层. 每个提示一个图像时可以工作. 但是如果你想输入*多张*与文本交错的图像,例如这里是图像A,为它生成标题;这里是图像B,为它生成标题;现在这里是图像C,为它生成标题?LLM的自我注意力需要在单个流中处理图像代币和文本代币,并且哪些位置可以参加到哪些图像问题变得困难.

弗拉明戈的答案是:完全不要改变LLM的输入流程――在现有LLM块之间插入额外的交叉注意力层――文字代币仍然像往常一样流经LLM的因果自觉注意――每隔几个LLM块,文字代币也会通过一个新的关闭层对图像功能做交叉参加――门的初始化为零) 意思是在零步新层的无-ops  模型行为预训练的LLM 完全相同――随着训练推进,门开,视觉信息开始流动――

弗拉明戈回答的第二个问题是:如何处理每个提示中可变数量的图像 ((0、1 或多张)?感知器重样仪  一个小型跨注意力模块,接收任意数量的补丁,并生成固定数量的视觉潜伏标记──无论提示中有多少张图像,LLM跨注意力层 看到的形状都相同──

## 概念
### 结的法定律师

青岛从结的奇拉70B LLM开始──全部70B重量保持不变──现有文本 自觉和FFN 正常运行──

### 感知器重新样本

对于即时中的每张图像,ViT 会生成N个补丁代币――感知器复制器有K个固定的可学习的隐藏片――Flamingo使用K=64)――每个复制器块有两个步骤:

1. 交叉注意:K 个隐藏的参观到N 个补丁标志(Q 来自隐藏的,K / V 来自补丁) ⋅
2. 内部的自我注意力+FFN──

经过6个复制模块后,输出是K=64个dim 1024的视觉代币,无论 ViT 生成多少个补丁──224x224图像(196个补丁) 和480x480图像(900个补丁) 都会输出为64个复制模块.

对于视频,样本会按时间应用:每一的补丁产生64个隐藏,而时间定位编码让模型区分t=0 和t=N──完整的视频变成T * 64个视觉代币──

### 门的跨度注意力

在结 LLM 的每一个层间的 Flamingo 使用M=4)插入一个新的关闭的跨越注意力区块:

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha`是一个初始化为零的可学习的尺度.
- `tanh(0) = 0`由于初始化时关门分支 贡献为零.
- 随着`alpha`远离零,跨越关注 贡献会平滑增长.
- 连接的意思是即使门完全开放,也不会覆盖LLM的文本表示;它只是在上面添加视觉信息.

这是弗拉明戈中最重要的设计选择:视觉调节是添加式, 关闭, 在初始化时为零.

### 用于织的输入的掩饰交叉注意

在类似"<图片A>标签A <图片B>标签B <图片C> ?"的提示中,每个文字标签应该只看到序列中位于之前的图像──横跨注意力面具强制执行:位置`t`只是看图像索引`i < i_t`图像复样符号,其中`i_t`是位置`t`之前最近的图像. 仅仅看到最近的前置图像.

### 在环境中学习

闪的提示看起来像:

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

模型看补全模式并输出"鸟" (或图片显示任何内容) ⋅没有渐进步骤.

### 培训数据

佛兰哥使用三个数据集训练:

1. 多模式大规模网络 (M3W):4300万包含交错图像和文本的网页,重建阅读顺序:
2. 图像-文字对 (ALIGN + LTIP):44亿对──
3. 视频短视频片段:2700万个短视频片段.

标志性:2023年) 是交错网页语料的开放复现,Idefics、Idefics2 和大多数开放的Flamingo像模型都在训练中.

### 开放和

开放复现――建筑 相同――感知器复样器+结 LLaMA 或 MPT 上的门口横跨注意力) ・检查点为3B、4B、9B──由于基础LLM 更小且数据更少,质量落后于 Flamingo──

基于OpenFlamingo,并通过MIMIC-IT (MIMIC-IT) 进行指令调整,表明关闭横跨注意力也适用于下列指令.

### 后代

- 思想/思想2 /思想3:Hugging Face 的关闭横跨注意力谱系,逐步简化(思想2 放弃复制样品,改为使用带适应性聚合的直接补丁代币) 。
- 团队转向早期融合 (Lesson 12.11);在需要结脊柱的生产环境中,团式关闭的交叉关注仍然存在.
- 双子座的交叉输入:概念继承了弗拉明戈的交叉格式灵活性,尽管确定的机制是专有的.

### 与BLIP-2的比较

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | 输入处一次性使用 Q-Former | 每 M 层使用 gated cross-attention |
| Visual tokens | 每张图像 32 个 | 每张图像每个 cross-attn layer 64 个 |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | 弱 | 强 — 论文的核心 |
| Interleaved inputs | 无原生支持 | Yes，设计目标 |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | 8 个 A100 上数天 | 数千个 TPUv4 上数周 |

预算有限的单图VQA 选择BLIP-2――需要交错输入、少量投篮或多图推理时选择Flamingo/Idefics2――


```figure
cross-attention-fusion
```

## 使用它
`code/main.py`演示:

1. 在36个假补丁代币上运行感知器复制样本,使用8个可学习的隐藏符号 (纯Python交叉注意) 👇
2. 一个关闭的跨越注意力步骤,其中`alpha = 0`→ 输出等于输入 (LLM 不变),然后`alpha = 2.0`混入视觉贡献――
3. 一个插件面具制造商,为"(图片1) (文本1) (图片2) (文本2) "序列生成2D注意力面具──

## 交付它
本课产出发 `outputs/skill-gated-bridge-diagnostic.md`△给定一个开放的VLM配置(样本 Y/N、跨接频率、网关方案),它会识别弗拉明戈系的元素并解释结结策略──适用于调试为什么某次细调 降低文本性能(答案:网关 过快开得太大) △

## 练习
1. 计算Flamingo-9B的视觉参数数:9B LLM + 1.4B 关闭横向注意力层 + 64M 复制样品.

2. 在 PyTorch 中实现关闭残留`y = tanh(alpha) * cross + x`通过实验展示当`alpha=0`时,初始化处`y==x`精确成立.

3. 阅读OpenFlamingo第3.2节 (arXiv:2308.01390),了解当每个提示的图像数量不同时,他们如何处理批量中多张图像――描述填充策略――

4. 为什么弗拉门戈的跨注意力面具让文字代币出席到*最近*前置图像,而不是所有前置图像?阅读弗拉门戈论文2.4节并解释交易.

5. 背景中的几次拍摄:为一个新的Flamingo变体构建一个包含4个图像 →主对象的颜色示例的提示――描述当示例数量从0到8变时,预期精确性模式如何变化――

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | 从可变数量的 input patches 中生成 K 个固定 tokens 的 module |
| Gated cross-attention | "Tanh-gated bridge" | residual layer `y = tanh(alpha)*cross + x`，learnable alpha，初始化为 0 |
| Interleaved input | "Mixed sequence" | 图像和文本按阅读顺序自由混合的 prompt format |
| Frozen LLM | "No LLM gradients" | 文本 LLM 的 weights 不更新；只训练 resampler + cross-attn layers |
| Few-shot | "In-context examples" | 在 prompt 中给出少量（image, answer）对；模型无需 finetuning 即可泛化 |
| OBELICS | "Interleaved web corpus" | 包含 141M 个网页的开放数据集，图像和文本按阅读顺序排列 |
| Chinchilla | "70B frozen base" | Flamingo 的冻结文本 LLM，来自 DeepMind 的 Chinchilla paper |
| Gate schedule | "How alpha moves" | 训练期间 cross-attention gate 打开的速率 |
| Cross-attn frequency | "Every M layers" | 插入 gated cross-attention block 的频率；Flamingo 使用 M=4 |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION 的 3-9B 开放 checkpoint；architecture 与 Flamingo 相同 |

## 延伸阅读
- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) 原始论文──
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) 开放复现――
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527)交错网页语料――
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 通用感知器架构──
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726)经过指令调整的弗拉明戈后续模型.
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) 弗拉门戈方法的现代化简化
