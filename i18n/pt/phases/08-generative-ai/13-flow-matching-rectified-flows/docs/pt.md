# Fluxo de correcção com fluxos corrigidos

> Os modelos de difusão precisam de 20-50 个采样步骤, pois eles vão se seguir de ruído a dados de 曲路径走走走.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## 问题

O processo de reversão do DDPM é um processo de`N(0, I)`De volta à distribuição de dados, os 1000 passos são reduzidos a 20 a 50 passos de determinação.

Se puderes treinar um modelo, fazendo com que o caminho do ruído para os dados seja uma linha reta, então...`t=1`Até`t=0`de um único passo de Euler 就能工作──Flow matching 直接构建这一点:定义从 `x_1 ∼ N(0, I)`Até`x_0 ∼ data`Of direct line input, treinamento campo vetorial `v_θ(x, t)`Para combinar o tempo de condução, e inferir 时积分.

Fluxo rectificado (Liu 2022): mais adiante: com o processo de refluxo 代地拉直路径, gerar um ODE gradualmente mais próximo da linha.

## 核心概念

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### Fluxo de linha

 definição:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

Entre eles `x_0 ~ data`- Não .`x_1 ~ N(0, I)`  O número de direções de tempo a longo desta linha é constante:

```
dx_t / dt = x_1 - x_0
```

Definir um campo Neural Vector`v_θ(x_t, t)`,并训练它匹配这个导数:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

É isso.**conditional flow matching**Perda (Lipman 2023)  Treinamento não precisa de simulação: você nunca desenvolve ODE `(x_0, x_1, t)`Não faz regressão.

### 采样

Em inferência, ao longo do tempo* contra-direção*积分学到的矢量场:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

De`x_1 ~ N(0, I)`Começa, com o passo de Euler.`t=0`- Não.

### Fluxo rectificado (Liu 2022)

Fluxo direto pode funcionar, mas o caminho de aprendizagem não é direto, porque muitos`x_0`Pode ser projetado para o mesmo.`x_1`❖ Passo de refluxo do fluxo corrigido:

1. Use as equipas de treinamento de fluxo modelo v_1──
2. 通過將 v_1 从 `x_1`积分到其落点 `x_0`, por exemplo , N para`(x_1, x_0)`- Não.
3. Em estas parâmetros de amostra, os parâmetros são agora iguais à ODE, e a linha de inserção entre eles é realmente mais plana.
4. - Não, não.

Na prática, 2 vezes reflow 代就能接近线性, de modo a realizar a inferência de 2-4 passos──SDXL-Turbo、SD3-Turbo、LCM 都是来自流量匹配模型──蒸而来──

### Por que ganhou em 2024 no campo das imagens ?

Três razões:

1. **Simulation-free training**O ODE não é necessário durante o treino.
2. **更好的 Loss geometry**A direção linear tem um sinal-ruído uniforme, enquanto o DDPM ε-perda em cronograma                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
3. **更快的 inference**A destilação de consistência pode ser atingida em 1 passo.

## Combinação de fluxos vs DDPM:精确联系

带 Gaussian-conditional path ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ `x_t = α(t) x_0 + σ(t) x_1`O calendário, o fluxo correspondente, a recuperação da difusão reformulada por Stratonovich, entre eles.`v = α'·x_0 - σ'·x_1`■ para os caminhos gaussianos, ambos estão em números iguais■

A combinação de fluxo  aumenta é: objetivo de * claridade * normal velocidade) 、更干净的 Loss, bem como tentar liberdade de interpolantes não gaussianos。


```figure
normalizing-flow
```

## Construí-lo

`code/main.py`Em duas pontas mistura de Gaussian 上 alcançar 1D fluxo de correspondência── campo vetorial `v_θ(x, t)`É um pequeno MLP, usando treinamento de objetivos diretos.

### 步骤 1: perda de treinamento

```python
def train_step(x0, net, rng, lr):
    x1 = rng.gauss(0, 1)
    t = rng.random()
    x_t = t * x1 + (1 - t) * x0
    target = x1 - x0
    pred = net_forward(x_t, t)
    loss = (pred - target) ** 2
    # backprop + update
```

### 步骤 2: inferência em vários passos

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### 步骤 3: Comparar o número de etapas

O modelo de 4 etapas já pode ser adaptado à qualidade de 20 etapas, o que significa muito para a latência.

## - É fácil de pisar.

- **Time parameterization。**Fluxo de correspondência 使用 `t ∈ [0, 1]`, entre os `t=0`- dados,`t=1`É ruído.`t ∈ [0, T]`, entre os `t=0`- dados,`t=T`É um ruído. É a mesma direção, é diferente.
- **Schedule choice。**A linha direta do fluxo corrigido é o cronograma de correspondência de fluxo, mas você também pode usar o cosino ou o t-sampling normal lógico (SD3) para obter uma melhor cobertura de escala.
- **Reflow cost。**Para reflow gerar um conjunto de dados de parâmetros é equivalente a cada amostra executar uma inferência completa.
- **Classifier-free guidance 仍然适用。**Só preciso de transformar em v:`v_cfg = (1+w) v_cond - w v_uncond`- Não.

## Use-o

| Use case | 2026 stack |
|----------|-----------|
| Text-to-image，最佳质量 | Flow matching：SD3、Flux.1-dev |
| Text-to-image，1-4 步 | Distilled flow matching：Flux.1-schnell、SD3-Turbo、SDXL-Turbo |
| 实时 inference | 来自 flow-matched base 的 consistency distillation（LCM、PCM） |
| Audio generation | Flow matching：Stable Audio 2.5、AudioCraft 2 |
| Video generation | Flow matching 与 Diffusion 混合（Sora、Veo、Stable Video） |
| Science / physics（particle trajectories、molecules） | Flow matching + equivariant Vector field |

Só se um artigo de 2025-2026 anos diz que é mais rápido do que a difusão, é quase sempre o fluxo de correspondência + destilação.

## Entrega-o

保存 `outputs/skill-fm-tuner.md` esta habilidade 接收一个Difusion-style model spec,并将其转换为流量匹配训练配置:schedule choice、time sampling distribution(uniform/logit-normal) Optimização、reflow plan、target step count、eval protocol──

## 练习

1. **Easy。**运行 `code/main.py`, comparar a demonstração da distribuição de dados reais em 1 passo com a MSE em 20 passos.
2. **Medium。**Do uniforme .`t`A tomada de amostras 切换到logit-normal (→ "normal")
3. **Hard。**实现一次反流 代: 通过积分第一个模型 生成对 (x_0, x_1), 在这些对上训练第二个模型,并比较1步样品质量──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Flow matching | “Straight-line diffusion” | 训练 `v_θ(x, t)`，使其沿 interpolant 匹配 `x_1 - x_0`。 |
| Rectified flow | “Reflow” | 拉直已学习 flows 的迭代过程。 |
| Velocity field | “v_θ” | model 的输出，即移动 `x_t` 的方向。 |
| Straight-line interpolant | “The path” | `x_t = (1-t)·x_0 + t·x_1`；目标导数很简单。 |
| Euler sampler | “1st order ODE solver” | 最简单的 integrator；当路径较直时效果很好。 |
| Logit-normal t | “SD3 sampling” | 将 `t` sampling 集中到 gradients 最强的中间值附近。 |
| Consistency distillation | “1-step sampler” | 训练 student 将任意 `x_t` 直接映射到 `x_0`。 |
| CFG with velocity | “v-CFG” | `v_cfg = (1+w) v_cond - w v_uncond`；同样技巧，新的变量。 |

## Nota de produção:Flux.1-schnell é o melhor formato de correspondência de fluxo

Fluxo de correspondência de produção 胜利案例是Flux.1-schnell: um fluxo-parado DiT, é distiu até 1-4 个推理步骤, ao mesmo tempo mantendo Flux-dev 级别的质量。Niels de Run Flux em uma máquina de 8GB notebook 是参考部署方案:T5 + CLIP encode,quantized MMDiT denoise(schnell 用 4 步,而 dev 用 50 步),VAE decode──核成本计算如下:

| Variant | Steps | Latency at 1024² on L4 | Total FLOPs (relative) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (raw) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (12× faster) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2-step | 2 | ~0.3 s | 0.03× |

Regras de produção:**flow-matched base + distillation = 2026 年快速 text-to-image 的默认方案。**Cada fabricante principal está em publicação este conjunto:SD3-Turbo(SD3 + fluxo + destilação)、Flux-schnell(Flux-dev + rectificado-fluxo de endereçamento)、CogView-4-Flash──Pura base de difusão Apenas existe em pontos de controle legais

## 延伸阅读
- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) fluxo rectificado。
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) correspondência de fluxo。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, fluxo rectificado de grande escala
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) 覆盖 FM + Diffusion 的通用框架──
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) Destilação em 1 passo de difusão/fluxo.
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) Variante turbo。
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) produção  entre os fluxos de correspondência
