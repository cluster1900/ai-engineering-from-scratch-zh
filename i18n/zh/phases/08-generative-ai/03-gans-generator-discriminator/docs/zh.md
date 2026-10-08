# 发电机与区分器

> 善良的朋友,2014年的技巧是完全跳过密度――两个网络――一个制造假冒――一个抓住它们――它们相互对抗,直到假冒与真实样本无法区分――它本不应该奏效――它也经常不奏效――但一旦奏效,对于狭窄领域,它生成的样本仍然是文献中最利的――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 问题

由于它们的MSE解码器损失对*平均值*图像是贝耶斯最优秀的,而许多合理数字的平均值是模糊的数字.你想要一种奖励*合理性*的损失,而不是奖励与某个目标接近像素层面.

善良的思想:训练一个分类器`D(x)`让我们分辨真实图像和假冒.`G(z)`欺骗`D`,我知道.`G`输出信号就是`D`当前认为某件事看起来是真实的依据.`G`改进,这个信号也会更新,追逐一个移动目标.`G`在未曾写下`log p(x)`情况学会了数据分布.

这就是对抗训练.

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

到2026年,GAN 已经不再是SOTA生成器了(扩散和流量匹配 夺走王冠) ⋅但StyleGAN 2/3 仍然是已发布的最利面型,GAN 歧视者被用于扩散训练中的 *感觉损失*,而对抗训练 支着快速的1步骤蒸(SDXL-Turbo,SD3-Turbo,LCM),让你能够交付实时扩散──

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。**将噪音向量`z ~ N(0, I)`映射到样本`x̂`△一个解码器 形状的网络(密集或转换的 conv) △

**Discriminator `D(x)`。**将样本映射为尺度概率 (或分数) 〔真实 → 1,假 → 0〕

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`△对真=1,假=0 做二进制交叉.
- **训练 `G`：** `loss_G = -log D(G(z))`,这是一个好朋友 使用的 *不和的形式`log(1 - D(G(z)))`会和,并`D`很自信时杀死梯度) 』

**Training loop。**一步 `D`一步一步`G`重复

**为什么它能工作。**如果`G`完美匹配`p_data`现在,`D`没有到比随机猜测更好,并且处于输出0.5;`G`获得渐变,达到平衡.

**为什么它会失效。**模式崩`G`找到一个`D`无法分类的模式,然后永远造它) 消失的梯度(`D`快得太快,`log D`培训不稳定性,学习率,批量,任何东西.

## 让GAN可用变体

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv、batch norm、LeakyReLU —— 第一个稳定 architecture。 |
| 2017 | WGAN, WGAN-GP | 用 Wasserstein distance + gradient penalty 替换 BCE。修复 vanishing gradient。 |
| 2017 | Spectral normalization | 对 discriminator 做 Lipschitz-bound。2026 年的 discriminators 中仍在使用。 |
| 2018 | Progressive GAN | 先训练低分辨率，再添加 layers。首次达到 megapixel results。 |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm。固定领域 photorealism 的 state of the art。 |
| 2021 | StyleGAN3 | Alias-free、translation-equivariant —— 2026 年仍然是 face gold standard。 |
| 2022 | StyleGAN-XL | Conditional、class-aware、更大 scale。 |
| 2024 | R3GAN | 以更强 regularization 重新包装；无需 tricks 即可在 1024² 上工作。 |


```figure
gan-minimax
```

## 构建它

`code/main.py`在1-D数据上训练一个小型GAN:两个高斯的混合物――生成器和分辨器都是一层隐藏MLP――我们手写实现前进,后退和最小环――目标是看到两个关键失败模式――模式崩 +消失梯度) 如何发生――

### 步骤1:不和损失

瓦尼莉·古德菲洛失败`log(1 - D(G(z)))`现在,G的梯度基本为零,G 无法改进――非和形式`-log D(G(z))`具有相反的符号:当D 很自信时它会爆发,给G一个强烈的信号.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### 步骤2:每一个生成器步骤对应一个歧视性的步骤

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

给G使用新假,否则梯度会过期――

### 步骤3: 观察模式崩

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

经典症状:两个真实模式中有一个停止被生成.

## 陷

- **Discriminator 太强。**如果D达到95%的精度,G就会死亡.
- **Generator 记住了一个 mode。**给D输入加噪音,使用微批次分辨器层,或切换到WGAN-GP──
- **Batch norm 泄漏 statistics。**实际批量+假批量流经同一个BN层 会混合它们的统计数据――改用实例规范或光谱规范――
- **Inception-score gaming。**低样本数量 下噪声很大――eval 时使用≥10k样本――
- **对于 conditional tasks，one-shot sampling 是谎言。**你仍然需要CFG尺度,刺技巧和重新样本才能得到可用的输出.

## 使用它

2026年GAN堆:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

作为组件继续存在的概念损失,而不是独立发电机.

## 交付它

保存`outputs/skill-gan-debugger.md`△ 能力 接收一次失败的GAN运行(损失曲线、样本格格、数据集大小),并输出按可能性排序的原因、单线修正和重运协议──

## 练习

1. **Easy。**使用默认设置运行 `code/main.py`然后设置`D_LR = 5 * G_LR`没有重新运行.G的损失多快崩到常数?
2. **Medium。**用WGAN损失 替换Goodfellow BCE损失:`loss_D = E[D(fake)] - E[D(real)]`没有任何`loss_G = -E[D(fake)]`将D的重量剪辑到`[-0.01, 0.01]`❖训练是否更稳定?
3. **Hard。**将1D示例扩展到2D数据(环上8个高斯人混合物) 跟踪生成器在1k、5k、10k步骤中捕获8个模式中的多少个──实现微批次差异并重新测量──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | noise-to-sample network，`G: z → x̂`。 |
| Discriminator | "D" | Classifier `D: x → [0, 1]`，real vs fake。 |
| Minimax | "The game" | joint objective 的 `min_G max_D`。 |
| Non-saturating loss | "The fix" | 对 G 使用 `-log D(G(z))`，而不是 `log(1 - D(G(z)))`。 |
| Mode collapse | "G memorized one thing" | 尽管 data 多样，Generator 只产生少量不同 outputs。 |
| WGAN | "Wasserstein" | 用 Earth-Mover distance + gradient penalty 替换 BCE；gradient 更平滑。 |
| Spectral norm | "Lipschitz trick" | 约束 D 的 weight norms 来 bound 它的 slope；稳定 training。 |
| StyleGAN | "The one that works" | Mapping network + AdaIN；faces 领域 best-in-class，2026 年仍然如此。 |

## 产品注释: 一次推断是GAN的持久优势

在开放域的生成中,GAN的样本质量上不再获胜,但它们仍然在推理成本上获胜. 在生产推理文献词汇中,一个GAN具有:

- **没有 prefill，没有 decode stages。**一次`G(z)`转发的时间:
- **没有 KV-cache pressure。**唯一状态是重量――批量大小 受激活内存限制,而不是缓存――
- **Trivial continuous batching。**由于每个请求都消耗相同的固定FLOP,服务器 目标占用率下的静态批量通常是最优的──不需要在飞行中的调度器──

这就是为什么GAN蒸 (SDXL-Turbo,SD3-Turbo,ADD,LCM) 是2026年快速的文字到图像导技术:它将20-50步的扩散管道压缩成1-4次GAN式前进通道,同时保留了扩散基的分布――逆境损失作为训练时间扣 存活下来,用来把慢发电器变成快发电器――

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) 原始 GAN 纸
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) 第一个稳定建筑
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875)   
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958)     
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423)    
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042)SDXL-Turbo──
