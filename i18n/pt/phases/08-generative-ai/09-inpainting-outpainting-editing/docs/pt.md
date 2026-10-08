# Pintura, Pintura e Edição de Imagens

> Text-to-image 会创造新事物──Inpainting 会修复旧事物──Em ambiente de produção, 70% dos custos de trabalho em imagens são editados: substituir o contexto、 remover o logotipo、 ampliar o quadro、 reproduzir apenas uma mão──Inpainting 正是传播 体现价值──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## 问题

客户发来一张完美产品照片,但背景有分散注意的标牌―― você quer apagar essa placa, e fazer com que todas as outras partes mantenham a imagem de forma uniforme―― você não pode passar de texto para imagem, porque o resultado terá diferentes cores, diferentes luzes, diferentes ângulos de produto―― você só quer reproduzir a área mascarada, e deseja reproduzir o conteúdo respeitando o que o rodeia――

É assim que se pinta.

- **Inpainting.**Em mascaras, retém imagens externas.
- **Outpainting.**Em mascaras externas, reproduzidas ou expandidas para fora do quadro, conservadas dentro.
- **Image editing.**Re-generar todo o gráfico, mas manter a concordança de linguagem ou estrutura do gráfico original.

Cada linha de difusão de 2026 anos DATA带有涂料模式──Flux.1-Fill、Stable Diffusion Inpaint、SDXL-Inpaint、DALL-E 3 Edit──它们基于同一个原理──

## 概念

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 朴素方法 (e por que é errado)

带着面具 运行标准文字-to-image── em cada etapa de amostragem, substituir o ruído latente em uma área de mágica por imagens de limpeza difundidas para a frente── é capaz de funcionar...... mas o efeito é muito ruim── o artefato da fronteira 会出, pois o modelo não sabe o que a máscara deve ter na área──

### Modelo de pintura

Treinar uma U-Net modificada, deixá-la receber 9 canais de entrada, em vez de 4:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

Os canais extras são uma cópia da imagem fonte codificada pelo VAE, adicionada a uma única máscara de canal.

SD-Inpaint、SDXL-Inpaint、Flux-Fill 都使用这种9频道(或类似)输入──diffuser`StableDiffusionInpaintPipeline`- Não.`FluxFillPipeline`- Não.

### SDEdit (Meng et al., 2022)  免费编辑

- Dá-lhe uma imagem de um meio.`t`, e depois usar um novo prompt de `t`Reverso para 0── Não precisa de re-treinamento──`t`A seleção é um balanço entre a verdade e a liberdade de criação:

- `t/T = 0.3`→  quase compatível, apenas faz pequenas mudanças de estilo
- `t/T = 0.6`→ 中等编辑,保留粗略结构
- `t/T = 0.9`→  aproximar-se do ruído 生成,对源图保留最小

### InstructPix2Pix (Brooks et al., 2023)

Em`(input_image, instruction, output_image)`O sistema de difusão é um sistema de difusão de imagens e textos.

### RePaint (Lugmayr et al., 2022)

Conserve um padrão padrão de difusão incondicional. Em cada passo inverso, reproduzir um novo modelo: ocasionalmente saltar para um estado mais ruidoso e reproduzir-se. Assim, é possível evitar artefatos de fronteira.


```figure
inpaint-mask-reinject
```

## Construí-lo

`code/main.py`Em 5 dimensões de dados realizamos uma versão de brinquedo de pintura em 1D. Em 5 dimensões de dados misturados, nós treinamos um DDPM, cada um dos quais é de 5 flutuantes de um dos dois cluster.

### Passo 1: 5 D dados DDPM

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### Passo 2: Denoiser de treinamento em todas as 5 dimensões

标准 DDPM──Net para entrada de ruído 5D 输出 5D predicção de ruído──

### Passo 3: Usar a máscara consciente inversa

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

É um método simples, e é válido em dados 1D de brinquedos.

### Passo 4: desenho

O desenho é o desenho de uma máscara. O desenho é o desenho de uma máscara.

## 陷

- **Seams.**朴素方法会留下可见边界,因为 Gradient 信息不会跨面具 流动──修复方式:把面具 膨胀 8-16 个像素,或使用正确的涂料模型──
- **Mask leakage.**Se a qualidade da imagem de condicionamento não estiver em massa, ou se houver ruído, a imagem contaminará a massa.
- **CFG interacts with mask size.**Pequeno uso de alta CFG, em especial, para reduzir o CFG.
- **SDEdit fidelity cliff.**De`t/T = 0.5`Até`t/T = 0.6`Talvez perca a identidade do seu corpo.
- **Prompt mismatch.**Rapidamente 应该描述*整张*图,而不只是新内容──用 A cat sitting on a chair, instead of a cat──

## Usá-lo

| Task | Pipeline |
|------|----------|
| 移除物体，小 mask | SD-Inpaint 或 Flux-Fill，标准 prompt |
| 替换天空 | SD-Inpaint + "blue sky at sunset" |
| 扩展画布 | SDXL outpaint mode（8px feather）或带 outpaint mask 的 Flux-Fill |
| 重新生成手 / 脸 | SD-Inpaint，prompt 重新描述主体 + ControlNet-Openpose |
| 改变某个区域的风格 | 在 mask 区域上使用 `t/T=0.5` 的 SDEdit |
| "Make it sunset" | InstructPix2Pix 或 Flux-Kontext |
| 背景替换 | SAM mask → SD-Inpaint |
| 超高保真 | 最难场景使用 Flux-Fill 或 GPT-Image（hosted） |

SAM(Meta's Segment Anything,2023) + difusão de tinta é 2026 √'s background transfer pipeline。SAM 2(2024)

## Envia-o

保存 `outputs/skill-editing-pipeline.md` Habilidade 接收一张原图 + 编辑描述 + 可选面具(或 SAM prompt),并输出:mask 生成方法、base model、CFG scales(image + text)、SDEdit-t 或 inpainting mode, bem como lista de verificação QA。

## 练习

1. **Easy.**Em`code/main.py`Em que proporção, a quantidade de tinta em massa (residual) é igual à geração incondicional?
2. **Medium.**实现 RePaint: cada até 10 个反转步骤,跳回 5 步(加噪)并重新指责──测量它是否降低面具 边缘的边界残留──
3. **Hard.**Utilize Hugging Face diffusers तुलना:SD 1.5 Inpaint + ControlNet-Openpose 与 Flux.1-Fill, в 20 个 任务上测试──分别评分 pose adherence 和 identity preservation──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Inpainting | “填洞” | 在 mask 内重新生成；保留外部像素。 |
| Outpainting | “扩展画布” | 在画布外重新生成；保留内部。 |
| 9-channel U-Net | “正确的 inpainting model” | 输入为 `noisy \| encoded-source \| mask` 的 U-Net。 |
| SDEdit | “带 noise level 的 img2img” | 加噪到时间 `t`，用新 prompt denoise。 |
| InstructPix2Pix | “纯文本编辑” | 在 (image, instruction, output) 三元组上 fine-tuned 的 diffusion。 |
| RePaint | “无需重新训练” | 在 reverse 过程中周期性 re-noise，以减少 seams。 |
| SAM | “Segment Anything” | 通过点击或框生成 mask；与 inpaint 配合使用。 |
| Flux-Kontext | “带上下文编辑” | 接收 reference image + instruction 进行编辑的 Flux 变体。 |

## 生产提示:edit pipelines muito sensível ao atraso

Users edit image time, expectativa de volta em menos de 5 segundos. Em L4 acima, 10242 de 30 passos SDXL-Inpaint  precisa de 3-4 segundos, reajustar SAM mascaras geração ((cerca de 200 ms) e VAE codificação / decodificação ((cerca de 500 ms) ⋅

- **SAM-H 是慢的那个。**10242 下 SAM-H 约200 ms; SAM-ViT-B 约40 ms,质量损失很小──SAM 2(vídeo) vai aumentar o tempo dimensão de expansão; não o use para editoriação única──
- **能跳过 encode 就跳过。** `pipe.image_processor.preprocess(img)`Vai codificar até os latentes. Se tiver um latentes gerados uma vez mais,`latents=...`- Não, não. - Não, não.
- **Mask dilation 也影响吞吐。**"Máscara" significa "Máscara" significa "Máscara" (U-Net forward pass)`diffusers`de `StableDiffusionInpaintPipeline`O que quer que seja, tudo vai funcionar na U-Net; apenas um sistema de 9 canais pode ser usado para fazer computação mascarada.
- **Flux-Kontext 是 2025 年的答案。**Para o`(source_image, instruction)`Faça uma única passagem para frente: sem máscara única, sem barulho SDEdit. Em H100, cerca de 1,5 segundos de conclusão de uma edição.

## 延伸阅读

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 无需训练的涂料──
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) SDEdit。
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) 文本指令编辑。
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643)SAM, máscara.
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714)- O vídeo SAM.
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) Atenção 层级编辑。
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) 2024 ferramentas
