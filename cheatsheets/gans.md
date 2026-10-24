---
id: gans
title: GANs from DCGAN to StyleGAN
code: GA
subtitle: 损失函数、DCGAN 代码、Pix2Pix、CycleGAN 与 StyleGAN。默认值、失败特征与修复方法。
hue: 12
sources: phases/08-generative-ai/01-generative-models-taxonomy-history, phases/08-generative-ai/03-gans-generator-discriminator, phases/08-generative-ai/04-conditional-gans-pix2pix, phases/08-generative-ai/05-stylegan, phases/04-computer-vision/09-image-generation-gans
source_hash: bcbf16df3147b7bf
---

## StyleGAN 生成器
type: architecture
from: phases/08-generative-ai/05-stylegan/docs/en.md

```arch
node | z | 1,1 | z | N(0, I), 512 dims | store
node | map | 2,1 | Mapping network | 8-layer MLP | model
node | w | 3,1 | w in W | roughly disentangled | store
node | const | 1,2 | Learned constant | 4×4×512 | store
node | synth | 2,2 | Synthesis block | upsample, conv, AdaIN, noise | gpu
node | img | 3,2 | Image | 4 up to 1024 | client
node | noise | 1,3 | Per-layer noise | learned per-channel scale | process
edge | z | map |
edge | map | w |
edge | w | synth | AdaIN at every block
edge | const | synth |
edge | noise | synth |
edge | synth | img | resolution doubles
```

## 一个训练步
type: flow
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/code/main.py

1. **采样**：抽取一个真实 batch，并从 N(0, I) 抽取噪声 `z`。
2. **D 步**：真实图像以 1 为目标打分，`G(z).detach()` 以 0 为目标打分。
3. **G 步**：生成新的假样本。`D(G(z))` 以 1 为目标打分。
4. **重复**：每个 batch 先做一步 D，再做一步 G。
5. **探测**：每 100 步统计每个模式的样本数。低于 50 时告警。
6. **检查**：每个 epoch 结束时查看 64 个样本。
7. **均衡**：`p_G = p_data`，且 D 处处输出 0.5。

## 损失与公式
type: concepts
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md

- **Minimax**：$\min_G \max_D \; \mathbb{E}_x[\log D(x)] + \mathbb{E}_z[\log(1 - D(G(z)))]$
- **D 损失**：二元交叉熵，真实 = 1，伪造 = 0。
- **G 损失**：$-\log D(G(z))$。这是非饱和形式。
- **WGAN**：$\text{loss}_D = \mathbb{E}[D(\text{fake})] - \mathbb{E}[D(\text{real})]$，$\text{loss}_G = -\mathbb{E}[D(\text{fake})]$
- **Pix2Pix G**：$-\log D(x, G(x)) + \lambda \cdot \lVert y - G(x) \rVert_1$
- **Cycle**：$F(G(x)) \approx x$ 且 $G(F(y)) \approx y$。
- **AdaIN**：$y_{\text{scale}} \cdot \frac{x - \mathrm{mean}(x)}{\mathrm{std}(x)} + y_{\text{bias}}$
- **截断**：$w' = \hat{w} + \psi \cdot (w - \hat{w})$。$\psi < 1$ 以多样性换取质量。

## DCGAN train_step
type: annotated-code
lang: python
from: phases/04-computer-vision/09-image-generation-gans/code/main.py, phases/04-computer-vision/09-image-generation-gans/docs/en.md

```python
opt_d.zero_grad()
d_real = D(real)                    # logits, sigmoid only in the loss
d_fake = D(G(z).detach())           # no gradient flows into G
loss_d = (F.binary_cross_entropy_with_logits(d_real, torch.ones_like(d_real))
          + F.binary_cross_entropy_with_logits(d_fake, torch.zeros_like(d_fake)))
loss_d.backward()
opt_d.step()
opt_g.zero_grad()
d_fake = D(G(z))                    # second pass keeps the graph
loss_g = F.binary_cross_entropy_with_logits(d_fake, torch.ones_like(d_fake))
loss_g.backward()                   # non-saturating G loss
opt_g.step()
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/09-image-generation-gans/code/main.py, phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/04-conditional-gans-pix2pix/code/main.py, phases/08-generative-ai/05-stylegan/code/main.py

| 任务 | 代码 |
|---|---|
| 构建生成器 | `Generator(z_dim=64, img_channels=3, feat=32)` |
| 给 D 的卷积套上 SN | `spectral_norm(c)` |
| 创建优化器 | `Adam(lr=2e-4, betas=(0.5, 0.999))` |
| 在 eval 模式下采样 | `sample(G, n=8, z_dim=z_dim, device=device)` |
| 统计参数量 | `sum(p.numel() for p in G.parameters())` |
| 给 G 或 D 加条件 | `inp = z + one_hot(c, num_classes)` |
| 把 z 映射到 w | `w = mapping(z, mapping_net)` |
| 截断 w | `w_bar[i] + psi * (w_test[i] - w_bar[i])` |

## 四种 GAN 对比
type: comparison
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md
span: 2

| 因素 | DCGAN | Pix2Pix | CycleGAN | StyleGAN |
|---|---|---|---|---|
| 输入 | 噪声 z | 图像 x，dropout 充当噪声 | 来自域 X 的图像 | z 映射为 w |
| 生成器 | 转置卷积，tanh 输出 | 带 skip 的 U-Net | G: X 到 Y 与 F: Y 到 X | 常量加每块 AdaIN |
| 额外损失 | 无 | λ 乘以 L1 | 循环一致性 | StyleGAN2 中的 path-length 正则 |
| 数据 | 仅图像 | 成对 (x, y) | 不成对 | 窄领域，人脸 |
| 用途 | 32x32 基线 | 草图到照片 | 马变斑马、季节转换 | 照片级人脸、编辑 |

## 单次前向与多步对比
type: comparison
from: phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md

| 因素 | Pix2Pix | SD-Img2Img | SDXL-Turbo | ControlNet + SDXL |
|---|---|---|---|---|
| 步数 | 1 | 20 | 1-4 | 20-30 |
| 单张 L4 上 512² | ~30 ms | ~1.2 s | ~0.15-0.35 s | ~3-5 s |

## 默认值
type: defaults
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/04-computer-vision/09-image-generation-gans/code/main.py, phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Adam `lr` | 2e-4 | DCGAN 中 G 和 D 的默认值 |
| Adam `betas` | (0.5, 0.999) | 较低的 beta1 |
| `z_dim` | 64 | 32x32 DCGAN 的噪声维度 |
| D 的 LeakyReLU 斜率 | 0.2 | D 的所有层 |
| Pix2Pix 中 L1 的 λ | 100 | 从这里开始，逐步退火 |
| PatchGAN 感受野 | 约 70×70 | 每个输出单元对应的像素 |
| 截断 ψ | 0.7 | 要多样性就用 1.0 |
| TTUR 比例 | 2-4 | D 比 G 学得快 |

## 故障排查
type: troubleshooting
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| D 损失低，G 损失振荡，多样性下降 | 模式坍缩 | Minibatch discrimination、谱归一化、标签 |
| D 准确率 ~100%，G 损失巨大且不动 | D 胜出 | 更小的 D、更低的 D 学习率、标签平滑 |
| 两个损失都摆动且无趋势 | 振荡 | TTUR 或 Wasserstein 损失 |
| D 准确率高于 95% | D 太强 | 把 D 学习率降低 2-5x |
| 某个真实模式从不出现 | G 记住了一个模式 | 给 D 的输入加噪声，或用 WGAN-GP |
| 输出忽略条件 | D 中条件信号太弱 | 尽早给 D 加条件，projection D |
| Pix2Pix 输出模糊 | L1 权重过高 | 稳定后逐步降低 λ |
| 水滴状伪影 | AdaIN 把均值置零 | StyleGAN2 的权重解调 |

## 术语
type: glossary
from: phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md

- **DCGAN**：带步长的卷积、batch norm，G 中用 ReLU，D 中用 LeakyReLU。
- **WGAN-GP**：Wasserstein 距离加梯度惩罚。
- **SN**：谱归一化。约束 D 每层的 Lipschitz 常数。
- **TTUR**：双时间尺度更新规则。两个学习率。
- **cGAN**：条件 GAN。G(z, c) 和 D(x, c) 都能看到条件。
- **PatchGAN**：D 输出一个 N × N 的逐块分数网格。
- **AdaIN**：自适应实例归一化。先归一化，再按 w 缩放和平移。
- **FID**：Fréchet Inception Distance。越低越好。

## 何时用哪个
type: tips
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/03-gans-generator-discriminator/docs/en.md, phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md, phases/08-generative-ai/01-generative-models-taxonomy-history/docs/en.md

- **GAN**：10 ms 以内的实时生成、风格迁移、图像到图像翻译。
- **StyleGAN3**：固定姿态的照片级人脸。
- **Pix2Pix**：数千个成对样本、窄任务、需要快速推理。
- **CycleGAN**：没有成对数据的图像翻译。
- **冻结映射网络**：用少量图像做领域适配。
- **Diffusion 或 flow matching**：任何多模态或开放式任务。

## 问答
type: qa
from: phases/04-computer-vision/09-image-generation-gans/docs/en.md, phases/08-generative-ai/04-conditional-gans-pix2pix/docs/en.md, phases/08-generative-ai/05-stylegan/docs/en.md, phases/08-generative-ai/01-generative-models-taxonomy-history/docs/en.md

- **为什么 D 步里用 `G(z).detach()`？** 它阻止 D 更新时梯度流入 G。
- **为什么用非饱和损失？** 早期 `D(G(z))` 接近零。原始 G 损失此时梯度消失。
- **为什么采样前切换到 eval 模式？** 这样 batch norm 使用滑动统计量。
- **为什么 D 要看到 (x, y) 这一对？** 没有 x，D 无法检查一致性。
- **为什么 StyleGAN 仍在使用？** 只需一次前向。在 4090 上生成 1024² 人脸不到 10 ms。
- **GAN 能给出 p(x) 吗？** 不能。它是隐式密度模型，只能采样。
