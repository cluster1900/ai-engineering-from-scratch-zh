# 风格

> 大多数生成器会把`z`,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`z`映射到中间表示`w`然后通过AdaIN在每个分辨率级别*注入*`w`,这次转变开了隐藏空间,并让照片级真实的人脸在连续七年里成为已解决的问题.

**类型：**构建
**语言：**字符串
**前置要求：**阶段8 · 03 (GAN),阶段4 · 08 (规范化),阶段3 · 07 (CNN)
**时间：**时间45分钟

## 问题

通过一层转换的转变将`z`映射成一张图像──问题是:`z`控制一切,包括姿态,光照,身份,背景,而且它们都在一起.`z`你不能要求模型同一个人,不同的姿态,因为这个表示不是那样分解的.

提出:停止把`z`直接送进一个常量的层.`4×4×512`作为网络输入.学习一个8层MLP,把.`z ∈ Z → w ∈ W`通过 *适应实例正常化* (AdaIN) 在每个分辨率注入 `w`首先将每个con特征地图正常化,然后使用`w`的的的的的的的的的的的

结果是:`W`对于高层风格(姿态、身份) 与细粒度风格(光照、颜色) 有大致正交的轴──你可以使用图像A的`w`作为低分辨率层级的风格,并使用图像B的`w`作为高分辨率层级的风格,从而在两张图之间交换风格.

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`八层的MLP.`Z = N(0, I)^512`,我知道.`W`不被强制为高斯人,而是学习适应数据的形状.

**Synthesis network。**从一个学到的常量`4×4×512`开始──每个分辨率区块:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`△分辨率翻倍:4, 8, 16, 32, 64, 128, 256, 512, 1024──

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

其中`y_scale`和 `y_bias`现在`w`根据特征地图正常化,然后重新施加风格.

**逐层 noise。**对于每个特征地图, 添加单通道高斯噪音,并由学到的单通道因子进行缩放.

**Truncation trick。**时,采样`z`计算`w = mapping(z)`然后`w' = ŵ + ψ·(w - ŵ)`在其中`ŵ`是许多样本上的平均`w`,我知道.`ψ < 1`用多样性换质量――几乎每个StyleGAN演示都使用`ψ ≈ 0.7`,我知道.

## 风格GAN 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

到2026年,StyleGAN3 仍然是以下场景的默认选择: (a) 高FPS的狭窄领域照片级真实生成, (b) 短片域调整, (c) 基于逆转的编辑, (f) 找到重建真实照片.`w`重新编辑这个`w`对于开放领域的文字到图像,它不是合适的工具,传播才是.


```figure
gx-stylegan-mapping
```

## 构建它

`code/main.py`实现一个1-D的玩具版 style-GAN lite:一个映射MLP,一个合成函数,它接收学到的常量向量,并从`w`派生的尺度/偏差 进行调节,还有逐层噪音.`w`能达到或超过`z`拼接进生成器输入方式──

### 步骤1:绘图网络

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 步骤 2:适应实例正常化

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

每个特征地图的规模和偏差都通过线性投影`w`得到了.

### 步骤3:每层噪音

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

每个通道的西格玛是可学习的.

## 陷

- **Droplet artifacts。**通过缩小卷积重量来修复它──
- **Texture sticking。**通过使用窗口的选器修复这一点.
- **Mode coverage。**切割`ψ < 0.7`虽然它看起来很干净,但它只从一个非常狭窄的形区域采样;如果需要多样性,使用.`ψ = 1.0`,我知道.
- **Inversion 有损。**把真实照片倒向`W`通常通过优化或编码 (e4e,ReStyle,HyperStyle) 完成.

## 使用它

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

对于答案是一个人的脸部照片的产品级演示,StyleGAN 在推断成本,在4090上 <10ms) 和相同质量门下度上胜过传播

## 交付它

保存`outputs/skill-stylegan-inversion.md`〔技能 接收一张真实照片并输出:逆转方法 (e4e / ReStyle / HyperStyle) 、预期隐藏损失、编辑预算(在出现文物之前你能在`W`中移动多远),以及已知有效编辑方向的列表.

## 练习

1. **简单。**分别使用`adain_on=True`和 `adain_on=False`运行`code/main.py`△与固定隐形相比,与扰动隐形下输出分布范围.
2. **中等。**实现混合规律化:对于一个训练批次,计算`w_a`,我知道.`w_b`在合成的前半段应用`w_a`后半段应用`w_b`解码器 是否学到了分开的风格?
3. **困难。**取一个预训练的StyleGAN3FFHQ模型(ffhq-1024.pkl) 通过在带标签样本上训练SVM,找到控制 微笑 的 `w`报告在身份漂移前可以推动多远的向.

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Mapping network | “那个 MLP” | `f: Z → W`，8 层，把 latent geometry 与数据统计解耦。 |
| W space | “Style space” | Mapping network 的输出；大致 disentangled。 |
| AdaIN | “Adaptive instance norm” | Normalize feature map，然后由 `w`-projection 做 scale + shift。 |
| Truncation trick | “Psi” | `w = mean + ψ·(w - mean)`，ψ<1 用多样性换质量。 |
| Path-length regularization | “PL reg” | 惩罚 `w` 中单位变化导致的图像大幅变化；让 `W` 更平滑。 |
| Weight demodulation | “StyleGAN2 的修复” | Normalize conv weights 而不是 activations；消除 droplet artifacts。 |
| Alias-free | “StyleGAN3 的技巧” | Windowed sinc filters；消除 texture 粘在 pixel grid 上的问题。 |
| Inversion | “为真实图像找到 w” | Optimize 或 encode `x → w`，使 `G(w) ≈ x`。 |

## 生产说明:为什么StayGAN在2026年仍然能上线

现在,我们已经开始使用了它.`num_steps = 1`没有VAE解码,没有跨度注意力通过. 用生产术语说,这是任何图像生成器的延迟下限.**300× 差距**对于狭窄领域的产品,它在TCO上胜出.

两个运维后果:

- **没有 scheduler，没有 batcher。**以目标占用量做静态批量是最优的――持续批量――对于 LLM 和传播不可或缺) 没有收益,因为每个请求消耗相同的 FLOPs――
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`从地图网络范围内的一个狭形区域采样――这是对样本变异的唯一杆――峰值负载时降低的服务层.`ψ`为了优质用户,

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) 风格GAN──
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958)     
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423)    
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766)e4e逆转――
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273)      
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441)现代最小化甘食谱
