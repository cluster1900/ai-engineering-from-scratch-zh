# ControlNet, LoRA & Conditização

> 仅靠文本是一种拙的控制信号――ControlNet 让你建立一个预训练的扩散模型,并使用深度地图、pose skeleton、scribble或边形图像来引导它──LoRA 让你通过训练1000万参数来细调一个2B-参数模型──二者结合,将稳定扩散从玩具变成2026年各机构都在交付图像管道──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 10 (LLMs from Scratch — LoRA 基础)
**Time:** ~75 minutes

## 问题

 Como "uma mulher de vestido vermelho andando um cão numa rua movimentada" Esse tipo de pedido, não diz modelo cão está em * onde*、 mulher é o que é * postura*, ou de rua * através de relações *── texto apenas pode fixar você especificar um imagem necessária de informações 10%── o resto é informação visual, não pode ser usado para descrição de texto高效──

Para cada sinal (posição, profundidade, capacidade, segmentação) de zero treinamento um novo modelo condicional, custo muito alto. Você quer manter a coluna vertebral SDXL de 2.6B-param 结, então, pegue em uma pequena rede lateral de condicionamento de leitura, deixando-a leve e moderada.

Você também quer, em caso de não re-treinar um modelo completo, ensinar um novo conceito de modelo ((sua cara, seu produto, seu estilo) ―― você precisa de um pequeno delta de 100x―.

ControlNet + LoRA + texto = 2026 anos Toolbox do praticante。 a maioria dos tipos de produção de imagem irá ser feita em base SDXL / SD3 / Flux 之上叠加 2-5 个 LoRA、1-3 个 ControlNet, bem como um IP-Adapter。

## 概念

![ControlNet clones the encoder; LoRA adds low-rank deltas](../assets/controlnet-lora.svg)

### ControlNet (Zhang et al., 2023)

取一个预训练的SD──*克隆* U-Net的编码器 半边──结原始模型──训练这个克隆版本,让它接受额外的条件输入(边缘,深度,pose)──使用 *zero-convolution* skip connections(初始化为零的1×1 convs,一开始是无-op,随后学习 delta) 把克隆版本连接回原始模型的解码器 半边──

```
SD U-Net decoder:   ... ← orig_enc_features + zero_conv(controlnet_enc(condition))
```

Zero-conv Iniciación significa que o ControlNet Inicio é igual à identidade, mesmo que o treinamento anterior não causará danos.

Cada modalidade do ControlNet será como um pequeno modelo secundário                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

```
features += weight_a * control_a(depth) + weight_b * control_b(pose)
```

### LoRA (Hu et al., 2021)

对于模型中任意线性层 `W ∈ R^{d×d}`, 结 `W`Não adicione um delta de baixo nível:

```
W' = W + ΔW,  ΔW = B @ A,  A ∈ R^{r×d},  B ∈ R^{d×r}
```

Entre eles `r << d` Para atenção, por exemplo, o 4-16 é a classificação padrão; para a gravidade, o 64-128 é mais comum.`2 · d · r`- Não .`d²` `d=640`A atenção do SDXL,`r=16`时 cada adaptador 只有 20k 参数,而不是410k,减少了20x──放到整个模型上,一个LoRA通常是20-200MB,而基础是5GB──

Em inferência, você pode reduzir a LoRA:`W' = W + α · B @ A`- Não.`α = 0.5-1.5`很常见──多个LoRA会以加法方式叠加 (normalmente é preciso notar que elas se afetam de forma não linear)──

### Adaptador IP (Ye et al., 2023)

Um adaptador muito pequeno, aceita um 张*图像* como condicionamento ([[:en:Clip image encoder]]) ⋅ utilizou um código de imagem CLIP para criar imagens, e os injetou com os tokens de texto ⋅ para cada modelo base ⋅ 20MB⋅ também permite que você gerar ⋅ imagens ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                          

## - Matrix

| Tool | 它控制什么 | Size | 何时使用 |
|------|------------|------|----------|
| ControlNet | 空间结构（pose、depth、edges） | 70-360MB | 精确 layout、composition |
| LoRA | 风格、主体、概念 | 20-200MB | 个性化、风格 |
| IP-Adapter | 来自 reference image 的风格或主体 | 20MB | 文本无法描述外观 |
| Textual Inversion | 将单个概念作为新 token | 10KB | 旧方案，大多已被 LoRA 替代 |
| DreamBooth | 对主体做 full fine-tune | 2-5GB | 强身份一致性、高计算成本 |
| T2I-Adapter | 更轻量的 ControlNet 替代方案 | 70MB | Edge devices、inference budget |

ControlNet ≈ 空间──LoRA ≈ 语义──两者一起使用──


```figure
v4-controlnet-zero
```

## Construí-lo

`code/main.py`Em 1-D acima simula estes dois mecanismos:

1. **LoRA。**Uma camada linear pré-treinada .`W`Treinar um de baixo nível.`B @ A`,使 `W + BA`匹配目标 linear layer── mostra `r = 1`足以完美学习 一级1 修正──

2. **ControlNet-lite。**Um predictor base congelado, bem como uma leitura extra sinal de rede lateral. A saída da rede lateral é feita por um gate inicialmente configurado para zero.

### 步骤 1: Matemática de LoRA

```python
def lora(W, A, B, x, alpha=1.0):
    # W is frozen; A, B are the trainable low-rank factors.
    return [W[i][j] * x[j] for i, j in ...] + alpha * (B @ (A @ x))
```

### 步骤 2: rede lateral zero-init

```python
side_out = control_net(x, condition)
gated = gate * side_out  # gate initialized to 0
h = base(x) + gated
```

Em passo 0, saída e base são completamente iguais.`gate`Não haverá deslocamentos catastróficos.

## 常见坑

- **LoRA 过度缩放。** `α = 2`Ou `α = 3`É uma forma comum de torná-lo mais forte, mas pode produzir excesso de formação ou perda de saída.`α ≤ 1.5`- Não.
- **ControlNet weight 冲突。**Ao mesmo tempo de uso peso 1.0 de Pose ControlNet e peso 1.0 de Depth ControlNet normalmente serão superados.
- **LoRA 用在错误的 base 上。**SDXL LoRA em SD 1.5 上会静默 no-op, pois as dimensões de atenção não se correspondem.
- **Textual Inversion 漂移。**Em um ponto de controlo, os tokens de treinamento, trocados para outro ponto de controlo, vão ser gravemente deslocados.
- **LoRA weight-merging 和存储。**Você pode colocar o LoRA em pedaços de peso do modelo base, para obter inferências mais rápidas, mas perderá no tempo de execução.`α`De que forma?

## Use-o

| Goal | 2026 pipeline |
|------|---------------|
| 复现某个品牌的艺术风格 | 在约 ~30 张精选图像上训练的 rank 32 LoRA |
| 把我的脸放进生成图像 | DreamBooth 或 LoRA + IP-Adapter-FaceID |
| 指定 pose + prompt | ControlNet-Openpose + SDXL + text |
| Depth-aware composition | ControlNet-Depth + SD3 |
| Reference + prompt | IP-Adapter + text |
| 精确 layout | ControlNet-Scribble 或 ControlNet-Canny |
| 替换背景 | ControlNet-Seg + Inpainting（Lesson 09） |
| 快速 1-step 风格 | SDXL-Turbo 上的 LCM-LoRA |

## Entrega-o

保存 `outputs/skill-sd-toolkit-composer.md`△ este habilidade 接收一个任务(assets de entrada:prompt、可选参考图片、可选姿、可选深度、可选拼写),并输出工具堆、重量 和可复现的种子协议──

## 练习

1. **Easy。**Em`code/main.py`- Não, não.`r`De 1 a 4... LoRA em que nível?
2. **Medium。**Em duas transformações alvo, treinar dois LoRA independentes. Carregar juntos e mostrar a sua interacção. Quando essa interacção irá romper com a linha?
3. **Hard。**Utilize difusores 叠加:SDXL-base + Canny-ControlNet(peso 0,8) + 一个风格 LoRA(α 0,8) + IP-Adapter(peso 0,6)。

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|------------|------------------|
| ControlNet | "Spatial control" | 克隆 encoder + zero-conv skips；读取一张 conditioning image。 |
| Zero convolution | "Starts as identity" | 初始化为零的 1×1 conv；ControlNet 一开始是 no-op。 |
| LoRA | "Low-rank adapter" | `W + B @ A`，`r << d`；比 full fine-tune 少 100x 参数。 |
| rank r | "The knob" | LoRA 压缩；典型值为 4-16，重度个性化使用 64+。 |
| α | "LoRA strength" | LoRA delta 的 runtime scaling。 |
| IP-Adapter | "Reference image" | 通过 CLIP-image tokens 实现的小型 image-conditioning adapter。 |
| DreamBooth | "Full subject fine-tune" | 在约 ~30 张主体图像上训练完整模型。 |
| Textual Inversion | "New token" | 只学习一个新的 word embedding；旧方案，大多已被替代。 |

## 生产说明:LoRA swaps, ControlNet lanes, serviço multi-tenant

Uma verdadeira SaaS de texto para imagem, realizada em um mesmo ponto de controle base, serviu centenas de LoRAs e dez de ControlNet, serviu problemas como a multi-pensificação de LLM (produção de literatura em batches contínuos e LoRAX / S-LoRA).

- **Hot-swap LoRAs，不要 merge。**- Não .`W' = W + α·B·A`Merger para a base, podemos fazer inferências por cada passo quase ~ 3-5%, mas vai acabar `α`E basei-lo em loura como rank-r de delta.`pipe.load_lora_weights()`+ `pipe.set_adapters([...], adapter_weights=[...])`, pode ser usado a pedido para ativar.`2 · d · r · num_layers`Pesos, ou seja, MB 级、亚秒级。
- **ControlNet 作为第二条 attention lane。**O codificador do clone e a base e a execução dos dois movimentos. O peso do clone é de 1.0 de ControlNet = cada passo de dois passes adicionais adicionais, em vez de um passes combinados.
- **Quantized LoRAs 也适用。**Se você quantificar base (cf. Lição 07, Fluxo em 8GB), LoRA delta também pode fazer a quantificação de 8 bits ou 4 bits.

Flux-específico: notebook de Niels Flux-on-8GB irá base  quantizada para 4 bits; na base quantizada acima superposição estilo LoRA(`pipe.load_lora_weights("user/style-lora")`),并使用 `weight_name="pytorch_lora_weights.safetensors"`, ainda pode trabalhar. Esta é a receita da maioria das organizações SaaS de 2026

## 延伸阅读

- [Zhang, Rao, Agrawala (2023). Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543) ControlNet。
- [Hu et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685) LoRA( inicialmente utilizada em LLM; posteriormente transferida para difusão)
- [Ye et al. (2023). IP-Adapter: Text Compatible Image Prompt Adapter](https://arxiv.org/abs/2308.06721) Adaptador IP。
- [Mou et al. (2023). T2I-Adapter: Learning Adapters to Dig Out More Controllable Ability](https://arxiv.org/abs/2302.08453) Alternativa mais leve do ControlNet.
- [Ruiz et al. (2023). DreamBooth: Fine Tuning Text-to-Image Diffusion Models for Subject-Driven Generation](https://arxiv.org/abs/2208.12242)- O DreamBooth.
- [HuggingFace Diffusers — ControlNet / LoRA / IP-Adapter docs](https://huggingface.co/docs/diffusers/training/controlnet) 参考管道──
