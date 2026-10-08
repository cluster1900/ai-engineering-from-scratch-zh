# 视频生成

> 图像是一个2D Tensor──视频是一个3D Tensor──理论相同;计算难度高出10-100x──OpenAI的 Sora(2024年 2 月) provou que é viável──到2026年,Veo 2、Kling 1.5、Runway Gen-3、Pika 2.0 和 WAN 2.2 已经能够从文本生成 1080p 的生产级视频,而开权重堆(CogVideoX、HunyuanVideo、Mochi-1、WAN 2.2)落后约12个月──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 8 · 07 (Difusão latente), Fase 7 · 09 (ViT), Fase 8 · 06 (DDPM)
**Time:** ~45 minutes

## 问题

Um vídeo de 10 segundos,1080p、24fps contém 240 pixels, por 20×1080×3 pixels── os dados originais de cada clip são de aproximadamente 1,5 GB── difusão no espaço de pixels indispensável── você precisa:

1. **时空压缩。**Um VAE, em vez de um único vídeo, é codificado para patches espaciais e temporais.
2. **时间一致性。**O "Internet" precisa ser construído em alguns segundos.
3. **Compute budget。**Em tamanho do mesmo modelo, vídeo treinamento em imagem 10-100x.
4. **Conditioning。**文本、图像(第一)、音频或另一个视频── a maioria dos modelos de produção aceita estas quatro espécies──

 resolver este problema                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          **Diffusion Transformer (DiT)**, em enorme ((impressão, subtítulos, vídeos)

## 概念

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### Paragem

Utilize 3D VAE( LEARN TO of 时空压缩)编码视频──latent 的形状 是 `[T_latent, H_latent, W_latent, C_latent]`                                                                                                                                                                                                                                                              `[t_p, h_p, w_p]`Para o modelo de Sora,`t_p = 1`(Pacos por peças) ou`t_p = 2`(每两) ⋅ 1 10 segundos 1080p 视频会压缩成约20,000-100,000 块贴子⋅

### Dieta de espaço-tempo

Uma transformação 处理平化的 patch 序列── cada patch  都有一个3D positional embedding(time + y + x)──Attention 处理平化的 patch 序列── attention 处理平化的 patch 序列──每一个 patch 都有一个3D positional embedding(时间 + y + x)──Attention 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注 关注

- **Spatial attention**Em cada um dos patches, a execução é feita internamente.
- **Temporal attention**Em mesma posição espacial, transcorrendo.
- **Full 3D attention**Preço 16-100x; uso apenas em baixa resolução ou em estudos.

### 文本 condicionamento

Use um grande codificador de texto  realizar Atensão cruzada(Sora utiliza T5-XXL,CogVideoX-5B utiliza T5-XXL)  Prompts  muito importante, o training集 de Sora contém re-captions de GPT 生成, em média 200 tokens em cada clip。

### 訓練

Em latentes espaciotemporais 上使用标准扩散损失 (ε 或 v prediction) ◦数据:web video + 约 100M clips curated + synthetic text captions──Computer: até mesmo em pequenas investigações também é necessário 10.000+ horas de GPU; em grande escala 则是 100,000+──

## 2026                                                                                                                                                                                                                                                              

| Model | Date | Max duration | Max res | Open weights? | Notable |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | No | 第一个在 scale 下展示 world simulator 属性的模型 |
| Sora Turbo | 2024-12 | 20s | 1080p | No | 推理快 5x 的生产版 Sora |
| Veo 2 (Google) | 2024-12 | 8s | 4K | No | 2025 年最高质量 + physics |
| Veo 3 | 2025 Q3 | 15s | 4K | No | 原生音频和更强的相机控制 |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | No | 2025 Q1 最好的人体运动 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | No | 在其之上的专业视频工具 |
| Pika 2.0 | 2024-10 | 5s | 1080p | No | 最强角色一致性 |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Yes (2B, 5B) | 第一个开放的 5B-scale 视频模型 |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Yes (13B) | 2024 年末开放 SOTA |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Yes (10B) | 许可证最宽松 |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Yes | 2025 年中最强开放模型 |

Pesos abertos em campo de vídeo reduzir a velocidade da diferença em relação ao campo de imagem mais rápido: até 2026 anos, HunyuanVideo + WAN 2.2 LoRAs  já impulsionaram a maioria dos fluxos de trabalho de código aberto.


```figure
video-diffusion-denoise
```

## Construí-lo

`code/main.py`模拟核心的空间时代的 DiT 思路:patchify 一个小型合成视频,加入 per-patch position embedding,并用变压器式注意 在 patches 上对整个序列的指标――不用 numpy;纯 Python──我们展示了即使在1-D 中,当相邻 patches 共享指标和位置嵌入时,也会出现时间一致性──

### Passo 1: Parchear um "vídeo" sintético 1D

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### 步骤 2: Embedding de cada posição

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### 步骤 3: denoiser 看到整个序列

Nossa rede de micro-tipos não denota cada um, mas combina todos os valores + as suas posições, e prevê todos os ruídos.

### 步骤 4: 时间一致性测试

訓練後,サンプル 一个视频──測量 frame-to-frame delta──如果模型学到了时间结构,deltas 会比独立样本 每一更小──

## 陷

- **独立逐帧 sampling = flicker。**Se você estiver usando difusão de imagem em cada um, clique, porque o ruído de cada um é independente.
- **朴素 3D attention = OOM。**Para um 10 segundos 1080p latente fazer atenção 3D completa, é preciso milhares de milhões de vezes de operação, fazê-lo factorizar para o espaço + tempo.
- **数据 captioning 比规模更重要。**A maior parte do trabalho anterior foi com cerca de 10 vezes mais detalhes de títulos.
- **First-frame conditioning。**A maioria dos modelos de produção também aceita uma imagem como primeira.
- **Physics drift。**长 clips(>10s) 会积累细微不一致──Sliding-window generation + keyframe ancoragem 会有帮助──

## Use-o

| Use case | 2026 pick |
|----------|-----------|
| 最高质量 text-to-video，hosted | Veo 3 or Sora |
| 可控相机的 cinematic | Runway Gen-3 with motion brushes |
| 跨 clips 的角色一致性 | Pika 2.0 or Kling 2.1 |
| Open weights，快速 fine-tune | WAN 2.2 + LoRA |
| Image-to-video | WAN 2.2-I2V, Kling 2.1 I2V, or Runway |
| Audio-to-video lip sync | Veo 3 (native audio) or a dedicated lip-sync model |
| 视频编辑 | Runway Act-Two, Kling Motion Brush, Flux-Kontext (still-frame) |

Em termos de qualidade, o custo por segundo de vídeo diminuiu 20 vezes entre 2024 e 2026.

## Entrega-o

保存 `outputs/skill-video-brief.md` Habilidade de receber um vídeo breve ((durada, relação de aspecto, estilo, plano de câmera, consistência do assunto, áudio),并输出: modelo + hospedagem, esquadrão de aceleração, linguagem da câmera, descrição do assunto, descrição de movimento)

## 练习

1. **Easy.**Em`code/main.py`Por exemplo, comparar (a) amostragem independente por quadro e (b) amostragem conjunta de sequência de quadro a quadro delta。 relatório delta dos valores médio 和 variância。
2. **Medium.**Adicionar uma condição de primeiro quadro: vai quadro 0 pin até um determinado valor e amostra sua parte restante.
3. **Hard.**Utilize HuggingFace difusores em local GPU 上运行 CogVideoX-2B──对 720p、6 秒 clip 计时 20 个推断步骤──Profile space-time attention 以识别瓶──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Video VAE | "3-D VAE" | 将 `(T, H, W, C)` 压缩为 spatiotemporal latent 的 Encoder。 |
| Patches | "The tokens" | latent 的固定大小 3-D blocks；作为 DiT 的输入。 |
| Factorized attention | "Spatial + temporal" | 先在空间上运行 Attention，再在时间上运行；跳过 full 3-D attention。 |
| Image-to-video (I2V) | "Animate this photo" | 模型接收一张图像 + 文本，并输出从它开始的视频。 |
| Keyframe conditioning | "Anchor frames" | Pin 特定帧来控制视频的 arc。 |
| Motion brush | "Directional hint" | 用户在图像上绘制 motion vectors 的 UI 输入。 |
| Re-captioning | "Dense captions" | 使用 LLM 用详细 prompts 重新标注训练 clips。 |
| Flicker | "Temporal artifact" | Frame-to-frame 不一致；通过 coupled denoising 修复。 |

## 生产说明:videos latentes é memória-análgama  problema

Um clip de 10 segundos 1080p、24 fps  contém 240 quadros × 1920 × 1080 × 3 ≈ 1,5 GB de pixels originais── atravessado por 4× compressão de vídeo VAE(`2 × spatial × 2 × temporal`O que é que você precisa fazer para fazer isso?

Três botões de produção, todos diretamente provenientes da literatura de inferência de produção:

- **跨 DiT 的 TP。**Modelos de texto a vídeo geralmente ≥10B parâmetros。4 个 H100 上 TP=4 é a configuração padrão; 405B-classe modelos Utilize PP=2 × TP=2。 Per etapa latência 随 TP 大致线性下降,直到撞上全降墙──
- **Frame batching = continuous batching。**Em tempo de geração, o conceito de vídeo é um conjunto de quadros Attention 连接的框架──Continuous batching(in-flight scheduling)`t-1`Está a voltar e começa a se tornar um quadro.`t+1`- Não.
- **Clip-level prefill cache。**Para a condição de imagem a vídeo, assim como o preenchimento de um pronto de LLM: calcular uma vez, e passar o decodificador temporal.

## 延伸阅读
- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) Sora 技术报告──
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) CogVideoX。
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603) HunyuanVideo。
- [Genmo (2024). Mochi-1 Technical Report](https://www.genmo.ai/blog/mochi)Mochi-1:
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) 2025  中开放 SOTA。
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) 开创性 vídeo difusão 论文──
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) Precursão de difusão de vídeo estável
