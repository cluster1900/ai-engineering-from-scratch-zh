# 视觉自动降低模型 (VAR):下一个规模预测

> 扩散模型在时间上代采样 (VAR在尺度上代采样,即先预测一个1×1标记,再预测2×2,然后4×4,直到最终分辨率,每个尺度都以之前的尺度为条件.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

## 问题

由于它能预测地扩展:更多计算、更多参数、更低的困惑、更好的输出――2024年之前,图像生成主要有两类AR尝试:PixelRNN/PixelCNN(逐像素) 和DALL-E 1 / Parti / MuseGAN(在VQ-VAE代码上逐代币)

两者都在生成顺序问题中困难.像素和代币在2D网格中排列,但AR模型必须使用1D拉斯特顺序访问它们.早期角落像素不知道图像最终会变成什么.

通过改变生成对象来解决生成顺序问题──VAR不是在空间中逐个预测图像代币,而是以不断提高的分辨率预测整张图像──步骤1:预测一个1×1代币(整体图像摘要)──步骤2:预测一个2×2代币 网格(更粗大特征)──步骤3:预测一个4×4 网格──步骤 K:预测最终的 (H/8) x(W/8) 网格──

每个尺度都会注意所有之前的尺度 (在尺度顺序上引起),然后在自己的尺度中并行.

## 概念

### 视频显示器

需要一个**multi-scale discrete Tokenizer**△对于图像x,它会产生一系列的分辨率逐渐提高的标志格:

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

每个z_k 使用相同的代码簿 (典型大小为4096-16384) . 每个尺度的标记化不是相互独立的,而是被训练为让各尺度的剩余需求和能够重建:

```
f ≈ upsample(embed(z_1), target_size) + ... + upsample(embed(z_K), target_size)
```

这是一个**residual VQ**变体――尺度 k 捕获尺度 1..k-1 遗漏的内容──解码器 接收所有尺度 嵌入的和并生成图像──

复式VQ标记器只训练一次 (类似于VQGAN),然后结――所有生成工作都由其完成的模型完成――

### 下一个规模预测

生成模型是一个变压器,它看到所有之前的尺度的标志,并预测下一个尺度的标志.

输入序列结构:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

位置嵌入 同时编码尺度索引和尺度内的空间位置. 注意 在尺度顺序上是因果的:尺度 k 位置 (i, j) 的标记可以注意到尺度 1..k 的所有标记,也可以注意到尺度 k 本身在所使用的内尺度 序列中更早出现的标记(VAR 使用固定位置注意,没有内尺度因果性,即在一个尺度内所有位置并行预测) ⋅

训练损失:在每个尺度 k,给定所有之前尺度的代币,预测代币 z_k――对离散 VQ代码使用交叉缩损失――结构与GPT相似,只是在这里的序列变成了尺度结构化的序列――

### 生成

推理时:
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

当K=10个尺寸时,生成需要10次变压器前进传递.每次传递都并行生成整个尺寸,而不是在尺寸内自归自归.对于256x256图像,这大约是10次传递,而DT是28-50次.

### 为什么下一个规模胜过下一个代币

三个结构性优势:
1. **从粗到细符合自然图像统计规律。**人类视觉感知和图像数据集都呈现尺度相关规律:低频结构稳定且可预测;高频细节以低频内容为条件.
2. **尺度内并行生成。**与GPT风格的代币AR不同,VAR 一步生成某个尺度的所有代币──有效生成长度是对数尺度而不是线性尺度──
3. **没有生成顺序偏置。**尺度 k 的标志可以看到整个尺度 k-1;没有左侧或上方的偏移,不会迫使早期的标志在晚期上下文可用之前就做出承诺.

### 规模定位法

等证明VAR在 ImageNet上的FID 遵循权力法缩小曲线,就像GPT的困惑一样.参数或计算量翻倍,会可靠地让错误减半.这是第一个像语言模型一样清晰表现出这种缩小行为的图像生成模型.结果是VAR尺度的预测可以由量计算预测来进行,而不是依赖于每个架构的经验猜测.

### 与传播的关系

两者把生成问题分解成一系列更容易的子问题.

- 扩散:逐渐加入噪音,学习撤销一步.
- 逐渐增加分辨率,学习预测下一个尺度.

它们是通过相同问题的不同轴线. 它们都产生可处理的条件分布. 在经验中,VAR 推理更快,更少,尺度内全并行),并且在类条件的ImageNet 上匹配或胜过DiT.


```figure
gx-var-next-scale
```

## 构建它

在`code/main.py`你将:
1. 在合成图像数据中,**multi-scale VQ Tokenizer**,我知道.
2. 训练一个**VAR-style Transformer**预测代币的下一个规模.
3. 通过调用变压器 4 次(4 个尺度)并解码来采样.
4. 验证按尺度顺序训练会让生成在尺度内并行.

这是一个玩具的实现.重点是看尺度结构化注意力面具和尺度内并行产生确实在工作.

## 交付它

本课会生成`outputs/skill-var-tokenizer-designer.md`标签是多尺度标签的设计技能:尺度数量,尺度比例,代码书尺寸,残余共享,解码架构.

## 练习

1. **尺度数量消融。**用4、6、8、10 尺度训练 VAR──衡量重建质量与 Autoregressive 通过数量关系──更多尺度 = 更细残余 = 更好质量,但通过更多──

2. **Codebook size。**训练代码书尺寸为512、4096、16384的代码书.

3. **尺度内并行检查。**模型是否注意到跨度尺度位置但不注意到内部尺度?验证面具实现

4. **VAR vs DiT scaling。**对于同一个ImageNet类条件任务,在匹配参数预算下训练VAR和DiT(例如33M、130M、458M) ──绘制FID与计算──VAR应在每个尺寸上领先DiT,在小规模上复现论文结果──

5. **Text conditioning。**扩展VAR,让它通过 adaLN 接收文本嵌入式 (CIP 集成式) 作为额外的条件输入――这是HART配方――它能让文本一致的样本上的FID 改善多少?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | 通过在 VQ Token 网格金字塔上进行 next-scale prediction 来生成图像 |
| Next-scale prediction | "Predict coarser, then finer" | 模型以不断增加的分辨率尺度预测 Token，并以所有之前尺度为条件 |
| Multi-scale VQ tokenizer | "Residual VQ" | 生成 K 个分辨率递增 Token 网格的 VQ-VAE，decoder 会对所有尺度求和 |
| Scale k | "Pyramid level k" | K 个分辨率层级之一，从 k=1 的 1x1 到 k=K 的 (H/p)x(W/p) |
| Parallel-within-scale | "One forward per scale" | 尺度 k 的所有 Token 在一次 Transformer pass 中预测，而不是自回归预测 |
| Causal-across-scales | "Scale-ordered attention" | 尺度 k 的 Token 可以 Attention 到尺度 1..k 的全部内容，但不能 Attention 到尺度 k+1..K |
| Residual VQ | "Additive tokenization" | 每个尺度的 Token 编码较低尺度留下的 residual；decoder 对所有尺度 Embedding 求和 |
| VAR scaling law | "Image GPT scaling" | FID 随 compute 遵循可预测的 power law，类似语言模型的 perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR 变体，将 MaskGIT-style iterative decoding 与 VAR 的尺度结构结合 |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding 同时携带尺度索引和尺度内空间坐标 |

## 延伸阅读
- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) VAR 论文,标准参考
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748)                     
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) VQGAN,VAR的多级代币器 所扩展的代币器家族
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937)VQ-VAE,离散图像标记化的基础
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812)文本条件 VAR
