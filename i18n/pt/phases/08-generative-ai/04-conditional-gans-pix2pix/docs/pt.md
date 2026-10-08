# GANs condicionais com Pix2Pix

> O primeiro grande avanço de 2014-2017 foi controlar o GAN 生成什么──附加一个标签、一张图像,或一个句子──Pix2Pix fez uma versão de imagem, e em uma tarefa de imagem a imagem, ele ainda venceu todos os modelos de texto a imagem.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

## 问题
无条件 GAN 会采样任意人脸──做演示 有用,进生产 没用──你想要的是:*把草图 映射成照片*、*把地图 映射成空图*、*把白天场景 映射成夜间*、*给灰色尺度图片 上色*──在所有这些任务中,你会得到一个输入图片`x`, e deve ser emitido com alguma correspondência semântica.`y`Todos.`x`Todos podem responder a muitas razões.`y`◊ Erro quadrado médio vai os empurrar em resultados opacos.

GAN condicional (Mirza & Osindero, 2014) Coloque condição `c`作为输入加入 `G`和 `D`Pix2Pix (Isola et al., 2017) fez especialismo para isso: condição é imagem de entrada completa, gerador é U-Net, discriminador é *patch-based* classifier (PatchGAN), Loss é adversário + L1── mesmo em 2026 anos, este conjunto de configuração em estreito domínio imagem-à-imagem 上 ainda venceu de zero treinamento de modelo de texto-à-imagem, pois ele treina em *pared data* 上  Você tem o que é necessário sinal──

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y` Em Pix2Pix,`z`Não há ruído de entrada  Isola 发现显式噪音 会被忽略)

**Conditional D.** `D(x, y) → [0, 1]`                                                                                                                                                                                                                                                                                                                                         `y`Sim ou não`x`Uma致, não apenas julgar `y`Parece ser real.

**U-Net generator.**带有跨瓶跳连接的编码码器-decoder──对于输入和输出共享低级结构(边缘、轮) 的任务至关重要──没有这些跳转,高频细节会消失──

**PatchGAN discriminator.**D não sai um único resultado real/falso, mas sai um `N×N`Grade, cada célula  julgar cerca de 70×70 pixels de campo receptivo ∞ depois tomar média ∞ é um campo aleatório de Markov ∞ suposição:

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

L1 项稳定训练,并推动 G 接近已知目标──L1 产生更利的边缘 (medianos, não meios) ⋅`λ = 100`É Pix2Pix 默认值──

## CycleGAN  quando não tiver pares

Pix2Pix 需要对`(x, y)`Data──CycleGAN (Zhu et al., 2017) 通过额外的 Loss 放弃这个要求:*consistência do ciclo* perda──dois geradores:`G: X → Y`和 `F: Y → X`Treinar-as, fazer-te.`F(G(x)) ≈ x`且 `G(F(y)) ≈ y`                                                                                                                                                                                                                                                              

Em 2026, imagem-para-imagem não pareada (ControlNet、IP-Adapter) é finalizada, não CycleGAN, mas a consistência do ciclo 思想仍然存在几乎每一篇 未对域适应 论文中。


```figure
gx-patchgan
```

## Construí-lo
`code/main.py`Em dados 1-D, é possível implementar uma condicional GAN de micro tipo.`c`É a etiqueta de classe ((0 ou 1);;

### 步骤 1: 将条件 添加到 G 和 D 的输入

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

A codificação de um só-quente é a maneira mais simples. Os modelos maiores usarão incorporados aprendidos.

### 步骤 2: trem condicional

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

O gerador  deve corresponder * à condição determinada 下 * da distribuição real, e não marginal。

### 步骤 3: Verificação de cada classe de saída

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## 陷
- **Condition 被忽略。**G 学会 marginalize,D 从不惩罚,因为 condição sinal 太弱──修复:更强地 condição D(arreto inicial,而不只是迟), usando discriminador de projeção (Miyato & Koyama 2018)。
- **L1 weight 过低。**G 漂移到任意看起来真实输出,而不是忠实的输出――Pix2Pix-style 任务从 λ≈100 开始──
- **L1 weight 过高。**G                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **D 中 ground-truth leakage。**- Não .`(x, y)`concat como entrada D, não apenas `y`◊ não pode verificar a concordância.
- **每个 class 的 mode collapse。**Cada classe pode colapsar de forma independente.

## Use-o
2026 任务状态:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

Quando (a) você tem milhares de exemplos em pares, (b) as tarefas são estreitas e repetíveis, e (c) precisam de uma rápida inferência, o Pix2Pix continua a ser um instrumento correto.

## Entrega-o
保存 `outputs/skill-img2img-chooser.md` Especialização 接收任务描述、数据可用性(paired vs unpaired、N samples) 和延迟/质量预算,然后输出:approach(Pix2Pix、CycleGAN、ControlNet variant、SDXL + IP-Adapter)、formação de dados requisitos、inference cost 和 eval protocol(LPIPS、FID、 task-specific) ⋅

## 练习
1. **Easy.**修改 `code/main.py`, adherir a terceira classe. Confirme que G ainda está a fazer o ruído de cada classe.
2. **Medium.**Em configuração 1-D, em uso de perda de estilo perceptivo, substituir L1 (por exemplo, um pequeno D congelado como extractor de características)
3. **Hard.**Em configuração 1-D 中草拟一个CycleGAN:两个分布,两个发电机,周期损失――展示它能在没有对数据的情况下学会在两者之间映射――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## Produção: Pix2Pix  como linha de base de um conjunto de atraso

Quando você tem dados emparelhados 和狭窄任务(sketch → render、semantic map → photo、day、night)时,Pix2Pix de uma só vez inferência em latência 上比 difusão 快一个数量级──Production comparation Usualmente é:

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix em lotes estáticos de rendimento 上胜出(cada solicitação 都是相同的 FLOPs) ・・・Diffusion 在质量 和概括 上胜出。

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 论文──
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004)- Pix2Pix.
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) CycleGAN。
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585)- Pix2PixHD
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / GauGAN。
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) Projecção D。
