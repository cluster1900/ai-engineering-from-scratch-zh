# Modelos geracionais  分类法与历史

> Cada modelo de imagem, modelo de texto, modelo de vídeo e modelo 3D pertencem a uma das cinco categorias.

**类型:**- aprendizagem
**语言:**Python
**先修要求:**Fase 2 (Fundamentos do ML), Fase 3 (Centro de Aprendizagem Profunda), Fase 7 · 14 (Transformadores)
**时间:**- 45 minutos.

## 问题

Modelo gerativo fazer uma coisa: determinar de uma distribuição desconhecida.`p_data(x)`Extrair amostras de treinamento, sair parece que são de uma nova distribuição.

- Não.`p_data`Existe em um espaço com milhões de dimensões. Uma imagem RGB de 512x512 tem cerca de 786k dimensões. O modelo está localizado dentro do espaço em um pequeno variável, e você pode ter apenas 10M de amostras.

Há cinco famílias que sobreviveram nos últimos 12 anos. Entender o que cada família faz, vai dizer-lhe por que venceu em certas tarefas e por que se desmoronou em outras.

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**- Não .`log p(x)`写成一个你真的能计算的求和──Modelos autoregressivos (PixelCNN, WaveNet, GPT) serão `p(x) = ∏ p(x_i | x_<i)`因式分解──Normalizing flows (RealNVP, Glow) `p(x)`构成一个简单基础 分布的可逆变换――优点:精确概率,干净的训练 Loss──缺点:autoregressive 推理是顺序的(长序列会慢),flow 需要可逆架构(架构限制很强)。

**2. Explicit density, approximate。**De baixo para baixo`log p(x)`(ELBO)并优化这个界限──VAEs (Kingma 2013) 使用带变化后的编码-decoder──Diffusion models (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──Diffusion 是 2026 年图像、视频和 3D 的主导脊柱──

**3. Implicit density。** completamente saltar densidade; aprender um gerador de gerar amostras `G(z)`E um discriminador de julgamento falso .`D(x)` GANs (Goodfellow 2014) ・推理很快(一次进步通过), mas o processo de treinamento saiu de um lugar pouco estável── mesmo em 2026 anos, StyleGAN 1/2/3 em campo fixo de fotorealismo ((人脸、卧室) continua a ser o estado da arte──

**4. Score-based / continuous-time。**直接学习 log-density 的 Gradient `∇_x log p(x)`(score) ――Song & Ermon (2019)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

**5. 基于 Token 的离散 codes 上的 autoregressive。**Use VQ-VAE ou quantizador residual vai comprimir os dados em um segmento de tokens separados mais curto, e depois usar o transformador para sequência de tokens 建模──Parti、MuseNet、AudioLM、VALL-E、Sora são todos usados dessa maneira── é uma classe 1 + um tokenizer aprendido──

## 简史

| 年份 | 模型 | 为什么重要 |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | 第一个拥有可用训练 Loss 的 deep generative model。 |
| 2014 | GAN (Goodfellow) | Implicit density，没有 likelihood，却能产生惊人锐利的样本。 |
| 2015 | DRAW, PixelCNN | 顺序图像生成。 |
| 2017 | Glow, RealNVP | 可逆 flows；通过 depth 获得精确 likelihood。 |
| 2017 | Progressive GAN | 第一个 megapixel 人脸。 |
| 2019 | StyleGAN / StyleGAN2 | 在人脸这个单一领域中，photorealistic faces 依然很难被击败。 |
| 2020 | DDPM (Ho) | Diffusion 变得实用。 |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image 进入主流。 |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = 商品化。 |
| 2022 | ControlNet, LoRA | 对 pretrained diffusion 进行精细控制。 |
| 2023 | SDXL, Midjourney v5, Flow matching | 规模 + 更好的训练动态。 |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion；flow matching 胜出。 |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | 生产级视频。 |
| 2026 | Consistency + Rectified Flow | 从 diffusion backbones 进行一步采样。 |

## 五问分诊

Quando um novo modelo gerativo aparece, antes de responder a estas cinco questões,

1. **建模的是什么？**Pixels, latentes, tokens separados, Gaussians 3D, malhas, formas de onda?
2. **Density 是 explicit 还是 implicit？**Eles escreveram?`log p(x)`- Não .
3. **Sampling：one-shot 还是 iterative？**Iterativo significa "a pensar mais devagar"; um tiro geralmente significa adversário ou destilado.
4. **Conditioning：unconditional、class、text、image、pose？**Isso decidiu a perda e a construção.
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**Cada um tem modos de falha conhecidos.

Você vai responder novamente a estas cinco perguntas em cada aula desta fase. Até o fim, elas se tornarão sua condição de reflexão.


```figure
autoencoder-bottleneck
```

## Construí-lo

O código deste curso é de uma visualização de nível leve: usar três métodos de brinquedo ([[densação do núcleo]], histograma de separação, bem como gerador de GAN-ish) para se adaptar a uma mistura de Gaussia de 1D a partir de uma amostra, para que você possa ver a diferença explícita versus implícita de densidade em uma questão que pode ser impressa em uma tela.

运行 `code/main.py` Ele extrai 2000 amostras de uma mistura gaussiana de dois picos, e imprime:

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

Nota: Os dois primeiros permitem que você pergunte: "Isso é muito possível?"

## Use-o

2026 ano, qual família se adapta a qual missão?

| 任务 | 最佳家族 | 原因 |
|------|-------------|-----|
| Photoreal faces，窄领域 | StyleGAN 2/3 | 仍然最锐利，推理最快。 |
| 通用 text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3。 |
| 快速 text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM。 |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling。 |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) 或 flow matching (AudioCraft 2) | 离散 tokens 扩展成本低。 |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS 用于重建，diffusion 用于 novel-view。 |
| Density estimation（不采样） | Flows | 唯一拥有精确 `log p(x)` 的家族。 |
| Simulation / physics | Flow matching, score SDE | 直线路径，平滑 Vector fields。 |

## Entrega-o

保存为 `outputs/skill-model-chooser.md`- Não.

Esta habilidade  receber uma tarefa descrição并输出:(1) Para usar qual família,(2) Three open options e três hospedados                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

## 练习

1. **Easy。**Para os seguintes cinco produtos, identificando sua família e espinha dorsal: ChatGPT imagem, Midjourney v7 ̊ Sora ̊ Runway Gen-3 ̊ ElevenLabs‬
2. **Medium。**Você vai ler o artigo que afirma que a difusão é mais rápida que 100 vezes.
3. **Hard。**选择一个你关心的领域 (例如蛋白质结构,CAD,分子轨迹) ⋅ 为了 esse domínio, o modelo SOTA atual responde a cinco perguntas, e desenha um modelo melhor que mudará o que ⋅

## 关键术语

| 术语 | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Generative model | “它会生成新东西” | 学习 `p_data(x)` 的 sampler，可选地暴露 `log p(x)`。 |
| Explicit density | “你可以计算它” | 模型提供 closed-form 或 tractable 的 `log p(x)`。 |
| Implicit density | “GAN-style” | 只有 sampler——无法计算给定点的 `p(x)`。 |
| ELBO | “Evidence lower bound” | `log p(x)` 的一个 tractable 下界；VAEs 和 diffusion 会优化它。 |
| Score | “log-density 的 Gradient” | `∇_x log p(x)`；diffusion 和 SDE models 学习这个 field。 |
| Manifold hypothesis | “数据存在于一个表面上” | 高维数据集中在低维 manifold 上；这就是 dimensionality reduction 有效的原因。 |
| Autoregressive | “预测下一个片段” | 将 joint 因式分解为 conditionals 的乘积。 |
| Latent | “压缩 code” | 一种低维表示，decoder 可以从中重建输入。 |

## Produção: 5 famílias, 5 tipos de formações

Cada família é projetada em diferentes servidores de inferência.

- **Autoregressive（类别 1 和 5）。**顺序 decode 主导 latency;KV-cache、continuous batching 和 speculative decoding 都可以直接应用──
- **VAE / diffusion / flow-matching（类别 2 和 4）。**Não há decodificação no sentido de LLM.`num_steps × step_cost`, e`step_cost`É em resolução latente completa 上一次变压器 或 U-Net forward──生产旋是步数(DDIM / DPM-Solver / destilação)、batch size 和 precision(bf16 / fp8 / int4)。
- **GAN（类别 3）。**Uma vez para frente passar, sem cronograma, sem KV-cache, TFT ≈ total latência, é por isso que o StyleGAN em um campo estreito UX, acima ainda venceu.

Quando você vê em resumo de artigo mais rápido do que a difusão, traduzi-o em menos passos × custo de passos semelhantes × custo de passos mais barato.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN 论文──
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 论文──
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM 论文──
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为 SDE difusão。
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) fluxo de correspondência 论文。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) Difusão estável 3。
