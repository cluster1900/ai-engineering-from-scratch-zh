# Modelos de difusão  DDPM a partir do zero

> Ho、Jain、Abbeel(2020) deu a este campo uma forma de não ser abandonada. Usando ruído 经过一千个小步骤摧毁数据── treinar uma rede neural para prever ruído── em inferência 时反转这个过程── hoje, cada modelo de imagem, vídeo, 3D e música opera neste ciclo, talvez também esteja sobre a par de fluxo ou de consistência 技巧──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## O problema

Queres um para usar.`p_data(x)`Os GANs vão jogar um jogo de mínimos de difusão regular. Os GANs vão jogar um jogo de mínimos de difusão regular.`log p(x)`de limites inferiores ((por isso você tem probabilidades), bem como (c) amostras de qualidade de SOTA correspondentes

Sohl-Dickstein et al. (2015) forneceu a resposta teórica: definir uma cadeia de Markov que se inscreve gradualmente no ruído gaussiano .`q(x_t | x_{t-1})`,并训练一个逆链 `p_θ(x_{t-1} | x_t)`Para denegar. Ho、Jain、Abbeel(2020) demonstrou a perda pode ser simplificada em uma linha  预测 noise  并整理数学──2020 ano é ainda uma curiosidade──2021 ano é produzido o estado da arte amostras──2022 ano é transformado em Estable Diffusion──2026 ano é o nível básico──

## O conceito

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process `q`.**Em`T`个小步骤中加入 Gaussian noise──Closed form  数学可处理的原因  是累积步骤 仍然是 Gaussian:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

Entre eles `α̅_t = ∏_{s=1..t} (1 - β_s)`, para um `β_t`Programação`β_t`Em T=1000 passos dentro de 1e-4 para 0,02 linear variação,`x_T`É quase assim .`N(0, I)`- Não.

**Reverse process `p_θ`.**Aprender uma rede neural`ε_θ(x_t, t)`, pré测被加入的噪音──给定 `x_t`,按下式 denotá-lo:

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

Entre eles `σ_t`É o que é.`sqrt(β_t)`É uma variação aprendida. Esta expressão é muito ruim, mas é apenas um número.`q(x_{t-1} | x_t, x_0)`Em caso de procura de solução`x_{t-1}`,并用 ruído estimado 替换 `x_0`- Não.

**Training loss.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

Os dados da amostra`x_0`, escolher um .`t`,mostra `ε ~ N(0, I)`, através de forma fechada , uma vez que o volume é alto .`x_t`Não há ruído, não há regressão, não há minimos, não há KL, não há truques de reparametrização.

**Sampling.**De`x_T ~ N(0, I)`Começo a fazer isto.`t = T`Até`1`代 passo inverso──完成──

## Por que funciona

Três sentidos:

1. **Denoising is easy; generating is hard.**Em`t=T`Os dados são ruído puro. O que é preciso resolver é um problema trivial.`t=0`,net só precisa de limpar alguns pixels... no meio.`t`O problema é difícil, mas a rede vai obter muitos gradientes entre os mesmos grupos de pesos de cada nível de ruído.

2. **Score matching in disguise.**Vincent ((2011) prova, pré-test ruído 等价格估计 `∇_x log q(x_t | x_0)`,也就是 *score*──reverse SDE Use this score 沿密度梯度 上行  一次被引导的随机走,走向高概率地区──

3. **The ELBO reduces to simple MSE.** completa variação limite inferior em cada etapa de tempo têm um termo KL;; usar a parametrização de DDPM, estes termos KL irá simplificar para com coefícios específicos de previsão de ruído MSE; Ho eliminou os coefícios (((称其为 simple loss), qualidade inversamente e * melhorar* 了。


```figure
diffusion-denoise
```

## Construí-lo

`code/main.py` realçar um DDPM 1-D──Dados é uma mistura de dois modos──net é um micro tipo de MLP, recepção `(x_t, t)`Não produz ruído previsto. Treinamento é uma linha de perda.

### Passo 1: calendário de execução (formulario fechado)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### Passo 2: amostra `x_t`em uma só vez

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### Passo 3: um passo de formação

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### Passo 4: amostragem inversa

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

Para um problema 1-D de 40 passos de tempo e 24 unidades de MLP, é cerca de 200 épocas.

## Condicionamento de tempo

Net 需要知道它正在指责哪个时间步骤── dois padrões de opções:

- **Sinusoidal embedding.**类似 Transformer codificação posicional。`embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]`❖ Transmitir para MLP, transmitir para a rede
- **Film / group-norm conditioning.**Em cada bloco, o projeto de incorporação é por escala/bias de cada canal.

Nós temos código de brinquedo Usar sinusoidal → concat. Produzir U-Nets Usar FiLM.

## Encurralagens

- **Schedule matters a lot.**Linear `β`É o padrão de DDPM, mas o cronograma cosino (Nichol & Dhariwal, 2021) em igual cálculo, abaixo dá melhor FID.
- **Timestep embedding is fragile.**- Não .`t`Como flutuante 传入对玩具 1-D 可行,但对图像会失败;始终使用正确嵌入──
- **V-prediction vs ε-prediction.**Para regime estreito ((trem muito pequeno ou muito grande t),`ε`很差──V-previsão`v = α·ε - σ·x`) mais estabilizado; SDXL、SD3 和 Flux todos usam-no.
- **Classifier-free guidance.**Inferência 时, simultâneo calcular condicional 和 incondicional `ε`, então`ε_cfg = (1 + w) · ε_cond - w · ε_uncond`, entre os `w ≈ 3-7`Lição 08 会覆盖。
- **1000 steps is a lot.**Produção utilizando DDIM ((20-50 passos)、DPM-Solver ((10-20 passos) or distilação ((1-4 passos)―see Lesson 12―

## Usá-lo

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

A difusão é a espinha dorsal gerativa geral. A correspondência de fluxo (Lessão 13) é o concorrente de 2024-2026, na mesma qualidade.

## Envia-o

保存 `outputs/skill-diffusion-trainer.md` Competência 接收数据集 + computação orçamento,并输出:schedule(linear/cosine/sigmoid)  meta de previsão ε/v/x)  número de etapas、escala de orientação、 família de amostras 和 eval protocol──

## Exercícios

1. **Easy.**Em`code/main.py`O que é que o T de 40 改成 10 ⋅ qualidade de amostra ([[histograma visual das saídas]])
2. **Medium.**Desde a previsão ε 切换到 v-prediction──重新推导 reversa etapa──比较最终样本质量──
3. **Hard.**添加 无类分类器的指导.`c ∈ {0, 1}`Como condição, durante o treinamento 10% do tempo caem, e em amostragem  usá-lo `ε = (1+w)·ε_cond - w·ε_uncond`                                                                                                                                                                                                                                                              `w = 0, 1, 3, 7`时的 condicional-modo-ataque taxa

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Forward process | “Adding noise” | 固定 Markov chain `q(x_t \| x_{t-1})`，用于摧毁 data。 |
| Reverse process | “Denoising” | Learned chain `p_θ(x_{t-1} \| x_t)`，用于重构 data。 |
| β schedule | “The noise ladder” | Per-step variance；linear、cosine 或 sigmoid。 |
| α̅ | “Alpha bar” | Cumulative product `∏(1 - β)`；给出从 `x_0` 得到 `x_t` 的 closed-form。 |
| Simple loss | “MSE on noise” | `\|\|ε - ε_θ(x_t, t)\|\|²`；所有 variational derivations 都 collapse 到这里。 |
| ε-prediction | “Predict noise” | 输出是被加入的 noise；standard DDPM。 |
| V-prediction | “Predict velocity” | 输出是 `α·ε - σ·x`；在整个 t 上有更好的 conditioning。 |
| DDPM | “The paper” | Ho et al. 2020；linear β、1000 steps、U-Net。 |
| DDIM | “Deterministic sampler” | Non-Markov sampler，20-50 steps，同一个 training objective。 |
| Classifier-free guidance | “CFG” | 混合 conditional 和 unconditional noise predictions 来放大 conditioning。 |

## Nota de produção: a inferência de difusão é um problema de contagem de etapas

Papel DDPM 运行 T=1000 reverses steps── nobody put it into production 交付── cada estaca de inferências verdadeiras 城市会选择三种策略之一  并且每种都能清晰映射到生产框架:延迟 来源:

1. **Faster sampler, same model.**DDIM(20-50 passos)、DPM-Solver++(10-20)、UniPC(8-16)。Substituição de drop-in do loop inverso; já treinado `ε_θ`Pesos 不变──将延迟 降低 20-50×──
2. **Distillation.**訓練 student 以更少步骤 匹配 teacher:Progressive Distillation(2 → 1)、Consistência Modelos(arbitrário → 1-4)、LCM、SDXL-Turbo、SD3-Turbo──
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`、TensorRT-LLM Backends de difusão`xformers`/SDPA atenção、bf16 pesos。 vai por fase latência  reduzir cerca de 2×。可与 (1) 和 (2) 叠加。

 para o servidor de difusão de produção, conversação orçamental e literatura de produção  para os LLM:`num_steps × step_cost + VAE_decode`,transformação é `batch_size × (num_steps × step_cost)^-1`TTFT 很小(um passo);TPOT-equivalente é tempo de resposta completo, pois, desde o ponto de vista do usuário, geração de imagem é all-at-one──

## Mais leitura

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585)Papel de difusão,超前于时代。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM。
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) DDIM, menores passos.
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) calendário cosínico, variação aprendida.
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) Orientação para o classificador。
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) notação unificada, melhor claro.
