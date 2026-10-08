# 控制网,LORA和空调

> 仅靠文本是一种拙的控制信号――ControlNet 让你建立一个预先训练的扩散模型,并使用深度地图,姿势骨架,脚本或边缘图像来引导它――LoRA 让你通过训练1000万个参数来调整一个2B参数模型――二者结合,将稳定扩散从玩具变成2026年各机构都在交付的图像管道――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

## 问题

像"一个穿着红色衣服的女人在拥挤的街上散步狗"这样的提示,并没有告诉模型狗在*哪里*、女人是什么*姿势*,或街道的*透视关系*──文本大约只能固定你指定一个图像需要信息的10%──其余部分是视觉信息,无法用文字高效描述──

为每种信号 (从零训练到一个新的条件模型,成本过高――你希望保持2.6B-param SDXL脊柱,接上一个读取条件的小型侧网络,让它轻微调节脊柱的中间特征――这就是控制网――

你还希望在不重新训练完整模型的情况下,教会模型新概念(你的脸、你的产品、你的风格) ――你需要一个小100x的三角形――这就是LoRA,即插入现有注意力重量的低级适配器――

控制网+LoRA+文字 = 2026年实践者工具箱――大多数生产级图像管道会在SDXL/SD3/流动基础上叠加2-5个LoRA、1-3个控制网,以及一个IP-适配器――

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### 控制网 (Zhang等, 2023)

取一个预训练的SD──*克隆*U-Net编码器 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边缘、深度、位置)──使用 *零转*跳转连接(初始化为零的1×1连接器,一开始是无操作,随后学习三角) 把克隆版本连接到原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

零控制初始化意味着控制网一开始等于身份,即使训练前也不会造成损害.

每种模式的控制网会作为小型副模型发布:SDXL 约360M,SD 1.5 约70M)

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### 劳拉 (Hu等,2021年)

对于模型中任意的线性层`W ∈ R^{d×d}`结 `W`并添加一个低级的三角形:

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

其中`r << d`对注意,说,排名4-16是标准配置;对重量细调,说,排名64-128更常见.`2 · d · r`没有什么.`d²`为了`d=640`为了让我们能得到更多的帮助,`r=16`时每个适配器只有20k参数,而不是410k,减少了20x──放到整个模型上,一个LoRA通常是20-200MB,而基础是5GB──

在推断时,你可以缩小LORA:`W' = W + α · B @ A`,我知道.`α = 0.5-1.5`很常见. 许多LoRA会以加法方式叠加.

### 适应器 (Ye et al., 2023)

一个很小的适配器,接受一张*图像*作为条件(与文本一起) ⋅它使用Clip图像编码器生成图像代币,并将它们与文本代币一起注入交叉注意力──每个基模型约 ~20MB──它让你无需LoRA,也可以实现生成一张具有这张参考图形风格的图像──

## 可组合性 矩阵

| Tool | 它控制什么 | Size | 何时使用 |
|------|------------|------|----------|
| ControlNet | 空间结构（pose、depth、edges） | 70-360MB | 精确 layout、composition |
| LoRA | 风格、主体、概念 | 20-200MB | 个性化、风格 |
| IP-Adapter | 来自 reference image 的风格或主体 | 20MB | 文本无法描述外观 |
| Textual Inversion | 将单个概念作为新 token | 10KB | 旧方案，大多已被 LoRA 替代 |
| DreamBooth | 对主体做 full fine-tune | 2-5GB | 强身份一致性、高计算成本 |
| T2I-Adapter | 更轻量的 ControlNet 替代方案 | 70MB | Edge devices、inference budget |

控制网 ≈ 空间──LoRA ≈ 语义──两者一起使用──


```figure
v4-controlnet-zero
```

## 构建它

`code/main.py`在1D上模拟这两种机制:

1. **LoRA。**一个预训练的线性层`W`结它训练一个低级的`B @ A`让`W + BA`匹配目标线性层――展示`r = 1`足以完美学习一个级-1的纠正.

2. **ControlNet-lite。**一个结的基础预测器,以及一个读取额外信号的 侧网络──侧网络的输出由一个初始化为零的可学习标量门控制 (我们的零-conv 版本) ──训练并观察门 逐步升高──

### 步骤1: 洛拉数学

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 步骤 2:零点侧网络

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

在步骤0,输出与基础完全相同.`gate`没有灾难性漂移.

## 常见坑

- **LoRA 过度缩放。** `α = 2`或`α = 3`是常见的让它更强大的,但会产生过度风格化或损坏的输出.`α ≤ 1.5`,我知道.
- **ControlNet weight 冲突。**同时使用量 1.0 的Pose ControlNet和量 1.0 的Deepth ControlNet通常会冲冲.权重总和 ≈ 1.0 是安全默认值.
- **LoRA 用在错误的 base 上。**由于注意力尺寸不匹配,SDXL LoRA 在SD 1.5 上会静默无操作.
- **Textual Inversion 漂移。**在一个检查点上训练的代币,转换到另一个检查点会严重漂移.
- **LoRA weight-merging 和存储。**您可以将LoRA烤到基模型中重量,以获得更快的推断,但会在运行时间中失去缩小.`α`能力──保留两个版本──

## 使用它

| Goal | 2026 pipeline |
|------|---------------|
| 复现某个品牌的艺术风格 | 在约 ~30 张精选图像上训练的 rank 32 LoRA |
| 把我的脸放进生成图像 | DreamBooth 或 LoRA + IP-Adapter-FaceID |
| 指定 pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| 精确 layout | ControlNet-Scribble 或 ControlNet-Canny |
| 替换背景 | ControlNet-Seg + Inpainting（Lesson 09） |
| 快速 1-step 风格 | SDXL-Turbo 上的 LCM-LoRA |

## 交付它

保存`outputs/skill-sd-toolkit-composer.md`△该技能 接收一个任务(输入资产:快速、可选参考图像、可选姿势、可选深度、可选刺),并输出工具堆、重量 和可复现的种子协议──

## 练习

1. **Easy。**在`code/main.py`中,将洛拉级`r`从1变到4......LoRA在哪个级别下可以精确匹配的2级目标三角形?
2. **Medium。**在两个目标转变中,上训练两个独立的LORA.将它们一起加载,并展示它们的加法交互.
3. **Hard。**使用扩散器 叠加:SDXL-base + Canny-ControlNet(重量0.8) + 一个风格LoRA(α 0.8) + IP-Adapter(重量0.6) ・・・随着堆重量变化,测量FID-vs即时-附属性交易──

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| ControlNet | "Spatial control" | 克隆 encoder + zero-conv skips；读取一张 conditioning image。 |
| Zero convolution | "Starts as identity" | 初始化为零的 1×1 conv；ControlNet 一开始是 no-op。 |
| LoRA | "Low-rank adapter" | `W + B @ A`，`r << d`；比 full fine-tune 少 100x 参数。 |
| rank r | "The knob" | LoRA 压缩；典型值为 4-16，重度个性化使用 64+。 |
| α | "LoRA strength" | LoRA delta 的 runtime scaling。 |
| IP-Adapter | "Reference image" | 通过 CLIP-image tokens 实现的小型 image-conditioning adapter。 |
| DreamBooth | "Full subject fine-tune" | 在约 ~30 张主体图像上训练完整模型。 |
| Textual Inversion | "New token" | 只学习一个新的 word embedding；旧方案，大多已被替代。 |

## 生产说明:LoRA交换,ControlNet车道,多租户服务

一个真实的文本到图像SaaS会在同一基点上服务数百个LoRA 和十几个控制网――服务 问题很像LLM多租的(生产文献中在连续批量和LoRAX / S-LoRA 下讨论LLM场景):

- **Hot-swap LoRAs，不要 merge。**将`W' = W + α·B·A`合并到底,可以让每一步推断 快约~35%,但会结`α`作为R级海域热载在VRAM中;`pipe.load_lora_weights()`其他`pipe.set_adapters([...], adapter_weights=[...])`按要求激活.`2 · d · r · num_layers`体重,即MB级,亚秒级.
- **ControlNet 作为第二条 attention lane。**克隆的编码器与基层并行运行――两个重量都为 1.0 的控制网 = 每步两次额外前进通过,而不是一次合并的通过――批量大小的头 会第二次下降――为每一个活跃的控制网 预算约为 ~1.5 × 步骤成本――
- **Quantized LoRAs 也适用。**如果您量化了基数,请见课07号,Flux在8GB上),LoRA 德尔塔也能干净地量化到8位或4位.

流量特定:尼尔斯的Flux-on-8GB笔记本电脑将基数量化为4位;在这个量化基数上叠加式LoRA(`pipe.load_lora_weights("user/style-lora")`),并使用`weight_name="pytorch_lora_weights.safetensors"`现在还可以工作.这是2026年大多数SaaS机构的配方.

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543)控制网
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA (最初用于 LLM;后来移植到传播)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) IP-适配器──
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453)控制网的更轻量替代方案
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242)梦幻.
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考管道――
