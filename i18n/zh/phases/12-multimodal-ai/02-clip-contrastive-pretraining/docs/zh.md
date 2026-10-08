# 视觉语言预训与CLIP

> 开放AI的CLIP(2021) 证明了足以驱动接下来的五年核心思想:只使用杂的Web图像标题对和一个反驳损失,把图像编码器和文本编码器与同一个矢量空间相齐.零监督标签.

**Type:** Build
**Languages:** Python（stdlib，InfoNCE + sigmoid loss 实现）
**Prerequisites:** Phase 12 · 01（ViT patches），Phase 7（Transformers）
**Time:** ~180 分钟

## 学习目标
- 从互通信息推导InfoNCE损失,并实现一个数值稳定的矢量化版本.
- 解释为什么sigmoid对式损失 (SigLIP) 可以扩展到32768+批量,且不需要软max 所要求的全部集成 开销――
- 通过构建文本模板`a photo of a {class}`)并对宇宙相似性取 argmax,运行零射影像网分类──
- 给你四个杆:批量大小,温度,快速模板,数据质量.

## 问题
之前的CLIP视觉是监督的.收集标记数据集. 图像网:1.2M图像,1000类),训练CNN,然后发布.

免费提供十亿级宽松标签的双子. 一张金色车的照片,另一个文字是"我的狗马克斯在公园里",它带着监督信号:文本描述图像.

答案:把图像标题对当作匹配任务――给定一个包含N张图像和N条标题的批量,学习将每个图像与其自己的标题匹配,并区分N-1个分散注意力的信号――监督信号是这两个东西属于一起;这两个东西不属于一起――没有类标签――没有人工标签――只有一个反驳的损失――

得到的嵌入空间 能做不止 CLIP 被训练做的事情──ImageNet零射 能工作,是因为"一张猫的照片"的嵌入会接近那些从未被明显标记为猫的猫图像──这就是导致每一个2026 VLM的注──

## 概念
### 双码码器

现在有两个塔楼.

- 图像编码器`f`输出一个D-dim向量.
- 文字编码器`g`输出一个D-dim向量.

两个塔都把输出正常化到单位长度.`cos(f(x), g(y)) = f(x)^T g(y)`,我知道.

对于一个包含N 个的组件,构建形状为`(N, N)`的相似性矩阵`S`其他:

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

其中`tau`是学习得到的温度 ((CLIP初始化为0.07;在日记空间中学习)

### 信息NCE损失

在列和列上使用对称交叉:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

这就是InfoNCE──CE 中的软度max 强制每张图像与其标题的匹配程度高于批次中所有其他标题──"负面"是所有其他批次的物品──更大的批次 = 更多负面 = 更强信号──CLIP 在批次32k上训练;规模 很重要──

### 温度

`tau`控制软max的尖度──低tau →尖分布,具有硬负面挖矿效果──高tau →软,所有样本都会贡献──CLIP 学习日志(1/tau),并进行剪辑以防崩──SigLIP 2 固定初始tau,并改用学习偏见──

### 为什么sigmoid 扩展性更好(SigLIP)

在分布式训练中,你必须把每个嵌入式的全部集合到每个复制品,然后做软max.

标签 用元素智能的标签 替代软max:对每对`(i, j)`输出是二进制分类,判断这是匹配对吗?正分类标签是横向,其他所有都是负面.

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

如果`i == j`则`y_ij = 1`否则为0――每对的损失是独立的――不需要全部收集――每个GPU 计算自己的本地块并求和――SigLIP 2可以低成本扩展到32k-512k批量,而CLIP 会需要按比例增加通信――

### 零射分类

给定N 个类名字,为每个类 构建一个文本模板:

```
"a photo of a {class}"
```

用文字编码器 嵌入 每个模板――用图像编码器 嵌入你的图像――Argmax 代码相似性 = 预测类――不需要在目标类上训练――

快速模板很重要──CLIP 原论文为每个类使用了80个模板(平面,艺术,照片,绘画等)并平均嵌入式──ImageNet 提升+3分──现代用法通常选择一个两个模板──

### 线性探测器与细调

零射就是基线――线性探测器(在冷的CLIP功能上 之上为目标类 训练一个线性层) 在域内任务上胜过零射──全细调 在域内上胜过线性探测器,但可能损害零射转移──三种政权,三种交易――

### 标LIP 2:NaFlex 和密集特征

加入:
- 处理变量面积比例和分辨率.
- 更好的密集特征,用于细分和深度估计,目标是作为冷的脊柱在VLM中.
- 多语言:在100多种语言上训练,而CLIP仅使用英语.
- 度最高达400米.

在2026年开放的VLM中,SigLIP 2 SO400m/14是默认的视觉塔.

### 其他技术: 技术技术

果,2021):与CLIP相似的想法,1.8B双尺度,90%噪音――证明噪音的数据可以扩展――OpenCLIP(LAION):在LAION-400M / 2B 上对CLIP的开放复制,多种尺度,是常用的开放检查点――EVA-CLIP:从面具图像建模初始化;是VLM的强大脊柱――BASIC:Google的CLIP+ALIGN混合物――它们都属于同一家,只是数据和调整不一样――

### 零射击的天花板

继续提升需要更大的数据 (SigLIP 2 达到 80%+) 或结构变化 (监督的头、更多参数) ‧基准正在和;真正的价值是下游VLMs 消费的嵌入空间──


```figure
multimodal-fusion
```

## 使用它
`code/main.py`实现了:

1. 一个玩具双码码器,让你无需,就能看到InfoNCE的形状.
2. 纯Python的InfoNCE损失 (通过日志-总和-exp保证数值稳定)
3. 根据比较的sigmoid对对损失.
4. 一个零射分类例程:计算与一组文本提示的共数相似性,并使用 argmax 进行预测.

运行它并观察损失曲线──绝对数值是玩具;形状与真实CLIP教练 输出一致──

## 交付它
本课生成 `outputs/skill-clip-zero-shot.md`△给定一组图像 (通过路径) 和一组目标类,它会使用 CLIP 模板构建文本提示,使用指定检查点 (例如)`openai/clip-vit-large-patch14`) 嵌入 两侧,并返回带着相似度分数的前1/前5预测――该技能 拒绝对提示列表 中不存在的类做出判断――

## 练习
1. 手动为一个包含4个对的批量实现InfoNCE──构建4x4相似性矩阵,运行软max,取出横向,计算交叉透──使用这个手算结果验证你的Python实现──

2. 除了温度,SigLIP还使用偏差参数.`b`其他:`S'[i,j] = S[i,j]/tau + b`△当批次时,存在较大的阶级不平衡 (每行负面远远于积极)`b`起什么作用?阅读SIGLIP第3节

3. 为猫与狗 构建一个零射击分类器.`a photo of a {class}`和 `a picture of a {class}`△在100张测试图像上测量精度――模板的组合是否优于单个模板?

4. 计算 512-GPU、批量 32k 运行时,软max InfoNCE 与 sigmoid 双向通信成本──哪个按 O N) 尺度,哪个按 O N^2 尺度?引用 SigLIP 第4节──

5. 阅读OpenCLIP扩展规则论文 ((arXiv:2212.07143,Cherti等.) 根据图表复现他们关于数据扩展的结论:在固定模型尺寸下,ImageNet零截图准确性与训练数据尺寸之间的日志线性关系是什么?

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
- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020)        
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343)   
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)多语言+纳弗莱克斯──
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) 用噪音的网络数据尺度.
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143)开放CLIP扩展法则──
