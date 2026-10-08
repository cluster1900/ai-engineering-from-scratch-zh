# Diffusão latente e difusão estável

> Em 512×512 imagens para fazer difusão de pixel-espaço, em cálculo como guerra crimes. Rombach et al. (2022) observam, gerar uma imagem não precisa de todas as 786k dimensões, você precisa de suficiente para capturar a dimensão da estrutura linguística, bem como um decodificador único para tratar o resto do espaço latente do VAE.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## 问题

5122 de difusão de pixels-espaço significa U-Net deve estar em forma`[B, 3, 512, 512]`Para uma U-Net de 500M-param, cada fase de amostragem é de cerca de 100 GFLOPS.

Estes FLOPs, muito gasto em colocar no sentido de detalhes não importantes lançado na rede, é o mesmo que os VAE com perda de frequência.

É estabilidade de difusão 配方──SD 1.x / 2.x Utilize um 860M U-Net  Processamento `64×64×4`- Não, não. - Não, não.`128×128×4`,SD3 Utilize Flow Matching's Diffusion Transformer (DiT)  substituiu U-Net──Flux.1-dev (Black Forest Labs, 2024)  lançou um DiT-MMDiT de 12B-param ⋅ todos operam no mesmo dos dois estágios do fundo.

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**Encoder `E(x) → z`, decodificador `D(z) → x` O objetivo da compressão: cada espaço轴下采样 8×, reajuste canal, fazer o tamanho total latente 约为 pixel count 的 1/16──Loss = reconstrução (L1 + LPIPS perceptual) + KL(权重很小,使 `z`Não será forçado a fazer isso, porque não precisamos de isso.`z`Faça uma análise precisa.

2. **Stage 2 — 在 `z` 上做 diffusion。**- Não .`z = E(x_real)`Quando o meu pai me disse que eu estava a falar com ele, ele disse que eu estava a falar com ele.`z_t`◊ 推理时: através da difusão 采样 `z_0`, então`x = D(z_0)`- Não.

**文本 conditioning。**Há também dois componentes extra. O código de texto é o SD 1.x com CLIP-L, SD 2/XL com CLIP-L+OpenCLIP-G, SD3 e Flux com T5-XXL.`[Q = image features, K = V = text tokens]`Não os mistura. Os tokens são a única maneira de influenciar o texto nas imagens.

**Loss Function 与 Lesson 06 完全相同。**Da mesma forma, em ruído, você só substituiu o domínio de dados.

## 架构变体

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

趋势是: usar DiT(作用于潜伏补丁的变压器) substituir U-Net, ampliar o codificador de texto(T5 在快速依赖上胜过CLIP), aumentar os canais latente(4 → 16 带来更多细节余量)


```figure
noise-schedule
```

## Construí-lo

`code/main.py`Colocar um brinquedo 1-D VAE(encoder de identidade + decodificador, apenas para demonstração; real VAE 会是 conv net) colocado na lição 06 de DDPM 之上,并通过类型免费指导 加入类条件化──它显示同一个扩散损失 无论运行在原始 1-D值上,还是运行在编码的值上都有效,这就是关键洞见──

### 步骤 1: codificador/decodificador

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

O verdadeiro VAE tem o poder de ser treinado. Para fins de ensino, esta linha de mapeamento já é suficiente para explicar a difusão pode ser`z`Não se preocupe com o espaço original.

### Passo 2:`z`- espaço em meio à difusão

A mesma DDPM que a lição 06 ∙`z = E(x)`                                                                                                                                                                                                                                                              `z_0`后,用 `D(z_0)`Descifrar.

### 步骤 3: Orientação sem classificador

Durante o treinamento, 10% do tempo foi perdido no rótulo de classe (traduzido para token zero).`ε_cond`和 `ε_uncond`E depois:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`= 无指导 (não há orientação)`w = 3`= 默认值,`w = 7+`= 和 / 过化。

### 步骤 4: 文本 condicionamento (concept, não é código)

Colocar etiqueta de classe 替换为结 text encoder 的输出──通过跨注意 把文本嵌入 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

Esta é a única diferença substancial entre o modelo de difusão condicional de classe e a difusão estável.

## 陷

- **VAE-scale mismatch。**SD 1.x VAEs em codificação 后会应用一个缩放常数(`scaling_factor ≈ 0.18215`O U-Net pode ser usado para fazer exercícios em cada ponto de controle com esse valor.
- **Text encoder silently wrong。**SD3 需要带 >=128 tokens 的 T5-XXL,fallback till only CLIP 会有损──始终检查 `use_t5=True`Se não, a fidelidade imediata irá cair.
- **混用 latent spaces。**SDXL、SD3、Flux todos usam diferentes VAEs。 em latentes SDXL 上训练的LoRA 不能用于SD3。Hugging Face difusores 0.30+ 会拒加载不匹配的检查点。
- **CFG too high。** `w > 10`A produção de imagens e de óleos, e a oferta de diversidade, em troca de um preço, foi muito adequada.`w = 3-7`- Não.
- **Negative prompts leaking。**O prompt negativo de zero se tornará um token nulo; o prompt negativo preenchido se tornará um token zero .`ε_uncond` Estas duas coisas não são iguais; alguns canais 会静默默认使用 null

## Use-o

Produção de 2026:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

## Entrega-o

保存 `outputs/skill-sd-prompter.md` Habilidade de receber um texto de texto + 目标风格,并输出:model + checkpoint、CFG scale、sampler、negative prompt、resolution、可選的 ControlNet/IP-Adapter 组合, bem como uma lista de verificação de QA passo a passo──

## 练习

1. **Easy.**Use orientação `w ∈ {0, 1, 3, 7, 15}`运行 `code/main.py`记录 cada classe de amostra média在什么`w`A classe significa que vai desviar-se do valor médio dos dados reais?
2. **Medium.**Colocar um codificador linear de brinquedos em vez de um codificador/decodificador tanh-MLP, e adicionar a perda de reconstrução.
3. **Hard.**Use difusores  Construir uma verdadeira difusão estável                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `sdxl-base`, usando CFG=7 运行 30 个 Euler passos,并计时――然后切换到 `sdxl-turbo`, usando 4 passos 和 CFG=0── o mesmo objeto, diferente qualidade, descreve o que aconteceu e as causas──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | “The VAE” | 训练好的 encoder/decoder 对；把 512² 压缩到 64²。 |
| Second stage | “The U-Net” | latent space 上的 diffusion model。 |
| CFG | “Guidance scale” | `(1+w)·ε_cond - w·ε_uncond`；调节 conditioning strength。 |
| Null token | “Empty prompt embed” | 用于 `ε_uncond` 的 unconditional embed。 |
| Cross-attention | “How text gets in” | 每个 U-Net block 都以 text tokens 作为 K 和 V 进行 attention。 |
| DiT | “Diffusion Transformer” | 用作用于 latent patches 的 transformer 替换 U-Net；扩展性更好。 |
| MMDiT | “Multi-modal DiT” | SD3 的架构：带 joint attention 的文本与图像流。 |
| VAE scaling factor | “Magic number” | 将 latents 除以约 5.4，使 diffusion 在 unit-variance 空间中运行。 |

## Numa GPU de 8GB  consumo, é executado o Flux-12B

Referência Flux 集成是经典的我有一张消费级GPU,能交付吗?配方──技巧就是把生产推理文献列出的同一个三旋配方应用到扩散 DiT:

1. **Staggered loading。**Flux 有三个不需要同时存在在VRAM 中的网络:T5-XXL text encoder(fp32 下约 10 GB)、CLIP-L(小)、12B MMDiT, bem como VAE。先编码快速,*删除*编码器,加载DiT,denoise,*删除*DiT,加载VAE,decode──消费级 8GB GPUs 一次只能容纳一个阶段──
2. **通过 bitsandbytes 做 4-bit quantization。**Em T5 encoder 和 DiT 上都使用 `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)` O volume de memória reduzido 8x, de acordo com os padrões de Aritra ([[Notebook]]), a qualidade do texto para a imagem diminuiu quase imperceptível.
3. **CPU offload。** `pipe.enable_model_cpu_offload()`Acompanha-se automaticamente os módulos de troca entre CPU e GPU por cada passo a frente.

O meu livro de história é:`10 GB T5 / 8 = 1.25 GB`quantizada,`12 B params × 0.5 bytes = ~6 GB`DiT quantizada, recaduação de ativações. Usas00 diz que é a extrema situação da inferência TP=1: não há paralelismo de modelo, maximização quantizada.

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Difusão estável。
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL。
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748)- Não.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, MMDiT──
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/)Flux.1 系列──
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index)                                                                                                                                                                                                                                                              
