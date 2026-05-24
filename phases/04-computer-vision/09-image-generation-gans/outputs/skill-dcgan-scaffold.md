---
name: skill-dcgan-scaffold
description: 根据 z_dim、image_size 和 num_channels 编写完整 DCGAN scaffold，包括 training loop 和 sample saver
version: 1.0.0
phase: 4
lesson: 9
tags: [computer-vision, gan, dcgan, scaffolding]
---

# DCGAN Scaffold

给定三个参数，输出一个可运行的 DCGAN 项目骨架，并为目标图像分辨率正确设定 architecture 尺寸。

## 何时使用

- 在小数据集上启动新的 generative 实验。
- 用一个可运行的最小示例教学 DCGAN 基础知识。
- 原型开发 conditional GAN（label injection 会发生在同一个 scaffold 中）。

## 输入

- `image_size`: 32、64、128 之一（必须是 2 的幂）。
- `num_channels`: 1（grayscale）或 3（RGB）。
- `z_dim`: 通常为 64 或 128。
- `with_spectral_norm`: yes | no；默认 yes。

## Architecture sizing

G 中 transposed conv block 和 D 中 strided conv block 的数量取决于 `image_size`：

| image_size | G blocks | D blocks |
|------------|----------|----------|
| 32         | 4        | 4        |
| 64         | 5        | 5        |
| 128        | 6        | 6        |

每增加一个 block，空间维度会翻倍（G）或减半（D）。Feature 数量从 32 开始，并按 `feat_base * 2^block_index` 缩放。

## 输出文件

- `model.py` — Generator + Discriminator 类
- `train.py` — training loop、loss、optimiser 设置
- `sample.py` — sample grid saver
- `config.json` — hyperparameters
- `README.md` — 10 行 quickstart

## 报告

```
[scaffold]
  image_size:       <int>
  num_channels:     <int>
  z_dim:            <int>
  spectral_norm:    yes | no

[arch]
  G blocks:         <N>, channels: [list]
  D blocks:         <N>, channels: [list]
  G params (est):   <N>
  D params (est):   <N>

[training defaults]
  optimizer:   Adam(lr=2e-4, betas=(0.5, 0.999))
  batch_size:  64
  epochs:      50
  sample_every: 1 epoch

[files written]
  - model.py
  - train.py
  - sample.py
  - config.json
  - README.md
```

## 规则

- 始终在 G 的输出上使用 `nn.Tanh()`，并在训练期间将数据缩放到 [-1, 1]。
- 始终在 D 中使用 `LeakyReLU(0.2)`。
- 当 `with_spectral_norm == yes` 时，用 `spectral_norm()` 包装 D 中的每个 conv，并移除 D 中的 BatchNorm。保留 G 中的 BatchNorm。
- 绝不要为 image_size > 128 输出 scaffold —— DCGAN 在此之上会变得不稳定；请将用户引导到 StyleGAN 或 diffusion model。
