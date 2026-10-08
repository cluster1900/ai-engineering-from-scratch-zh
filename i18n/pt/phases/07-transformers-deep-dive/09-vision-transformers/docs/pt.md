# Transformadores de visão (ViT)

> 一张图像是由补丁组成的网格──一句由代币组成的网格──同一个变压器都能处理──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 05 (Transformador completo), Fase 4 · 03 (CNNs), Fase 4 · 14 (Introdução de Transformadores de visão)
**Time:** ~45 minutes

## 问题

Até 2020, a visão de computador  básica significa convolução──ImageNet、COCO 和 detecção benchmark  上的所有SOTA 都使用 CNN backbone──Transformers 则用于语言──

Dosovitskiy et al. (2020) Uma imagem vale 16x16 palavras  indicam que você pode eliminar completamente a convolução。 colocar imagem cortada em grandes patches fixas, irá cada patch 线性投影到一个嵌入,再把这个序列送入一个普通的变压器编码──在足够大的规模下(ImageNet-21k pretraining或更大),ViT pode ser combinado até mesmo superar modelos baseados em ResNet──

ViT é o início de uma tendência maior de 2026: uma estrutura, várias modalidades.

Até 2026, o ViT e seus sucessores ((DeiT、Swin、DINOv2、ViT-22B、SAM 3) já ocuparam a maior parte da área de visão.

## 概念

![Image → patches → tokens → transformer](../assets/vit.svg)

### Passo 1  Aplicação

Vai ser um .`H × W × C`Imagens que se desmontem em uma.`N × (P·P·C)`序列──tipo de configuração é:`224 × 224`Imagens,`16 × 16`Patches → 196 patches, cada um contém 768 个值──

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

Tamanho do parche é o controle da chave. Parches menores = mais tokens, melhor resolução, segunda dimensão. Atenção, maior tamanho.

### Passo 2  incorporação linear

Uma matriz de aprendizado individual vai colocar cada parche plano .`d_model`                                                                                                                                                                                                                                                              `P`- É um passo.`P`Na PyTorch, isto é realmente o que acontece.`nn.Conv2d(C, d_model, kernel_size=P, stride=P)`Só preciso de 2 anos para conseguir.

### 步骤 3  前置 `[CLS]`token,添加 embutidos posicionais

- Em primeiro lugar, adicione um que se possa aprender.`[CLS]`token── seu estado oculto final 会作为用于分类的图像表示──
- 添加可学习的位置嵌入式 (Posição embutidos)  ViT 原版)  或 sinusoidal 2D (Posição embutida) 后续变体 (Posição embutida) 
- Depois de 2024, o RoPE será expandido para a posição 2D, e não será necessário mais um incorporamento explícito.

### 步骤 4  标准 Transformador codificador

- Não .`LayerNorm → Self-Attention → + → LayerNorm → MLP → +`Blocos: ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞    ∞ ∞ ∞

### Passo 5 - cabeça

对于 Classificação:取 `[CLS]`estado oculto → linear → softmax── para DINOv2 ou SAM,则丢弃 `[CLS]`, usar directamente embutidos de parches

### importantes

| Model | Year | Change |
|-------|------|--------|
| ViT | 2020 | 原始版本。固定 patch size，完整 global attention。 |
| DeiT | 2021 | Distillation；只用 ImageNet-1k 就能训练。 |
| Swin | 2021 | 使用 shifted windows 的层级结构。固定的 sub-quadratic 成本。 |
| DINOv2 | 2023 | Self-supervised（无 labels）。最好的通用 vision features。 |
| ViT-22B | 2023 | 22B 参数；scaling laws 适用。 |
| SigLIP | 2023 | ViT + language pair，sigmoid contrastive loss。 |
| SAM 3 | 2025 | Segment anything；ViT-Large + promptable mask decoder。 |

### Porque é que demorou tanto para ter sucesso ?

ViT  necessita de uma grande quantidade de dados para combinar as CNNs, pois não tem preconceitos indutivos da CNN (invariância da tradução, localidade) ⋅ Se não houver mais de 100 milhões de imagens rotuladas ou um forte pré-treinamento auto-supervisionado, no mesmo cálculo, 下 CNNs 仍然更强.


```figure
n5-patch-stream
```

## Construí-lo

参见 `code/main.py` Patchfifixing de puras estdlib + embebimento linear + verificações de sanidade── não realizar treinamento, pois qualquer ViT de tamanho real precisa de PyTorch e tempo de GPU ⋅

### 步骤 1: imagem falsa

Uma imagem RGB 24×24`(R, G, B)`tuples 的行列表表示──我们使用 6×6 patches → 16 个补丁, cada patch 的嵌入向量长度为 108──

### 步骤 2: parchear

```python
def patchify(image, P):
    H = len(image)
    W = len(image[0])
    patches = []
    for i in range(0, H, P):
        for j in range(0, W, P):
            patch = []
            for di in range(P):
                for dj in range(P):
                    patch.extend(image[i + di][j + dj])
            patches.append(patch)
    return patches
```

Ordem de raster: segundo a linha-maior do grid 顺序排列── todos os ViT 都使用这种顺序──

### 步骤 3: inserção linear

Vai colocar cada parche em um caso.`(patch_flat_size, d_model)`Matrix── adição `[CLS]`后,验证输出形 为 `(N_patches + 1, d_model)`- Não.

### 步骤 4: 统计真实 ViT 的参数

打印 ViT-Base 参数:12 camadas、12 cabeças、d=768、patch=16──与ResNet-50(~25M) comparar。ViT-Base 大约是 ~86M──ViT-Large ~307M──ViT-Huge ~632M──

## Use-o

```python
from transformers import ViTImageProcessor, ViTModel
import torch
from PIL import Image

processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224-in21k")
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

img = Image.open("cat.jpg")
inputs = processor(img, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, 197, 768): [CLS] + 196 patches
cls_emb = out[:, 0]                       # image representation
```

**DINOv2 embeddings 是 2026 年 image features 的默认选择。**结脊椎,训练一个很小的头――适用于 Classification、检索、检测、标题化──Meta's DINOv2 checkpoints 在所有非文本视觉任务上都超越CLIP──

**Patch-size 选择。**小模型使用 16×16(ViT-B/16)。 Previsão de densidade(segmentação) usando 8×8 ou 14×14(SAM、DINOv2)。超大模型使用 14×14。

## Entrega-o

参见 `outputs/skill-vit-configurator.md`◊ Esta habilidade irá, de acordo com o tamanho do conjunto de dados, resolução e orçamento de cálculo, para uma nova tarefa de visão  escolher uma variante ViT e tamanho do parche 

## 练习

1. **Easy.**运行 `code/main.py` Patch de verificação`(H/P) * (W/P)`,平 patch 维度等于 `P*P*C`- Não.
2. **Medium.**实现 2D sinusoidal posicionais embutidos, isto é, para cada parche `row`和 `col` criar dois códigos sinusoidais independentes, e colocá-los em conjunto.
3. **Hard.**Construir um ViT de 3 camadas ((PyTorch), usando patches 4×4 張 MNIST 图像上訓練──測試精度──然后在同样 1000 张图像上加入 DINOv2 pra-entrenamento(简化版:只训练编码器 根据掩盖补丁 预测补丁嵌入)── Precursão 是否提升?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Patch | “vision-transformer token” | 图像中一个 `P × P × C` 区域的 pixel values 所组成的扁平 Vector。 |
| Patchify | “Chop + flatten” | 将图像切成不重叠的 patches，并将每个 patch flatten 成一个 Vector。 |
| `[CLS]` token | “图像摘要” | 添加在开头的可学习 token；它的最终 Embedding 是图像表示。 |
| Inductive bias | “模型预设的假设” | ViT 的 priors 比 CNNs 少；需要更多数据来弥补差距。 |
| DINOv2 | “Self-supervised ViT” | 使用 image augmentation + momentum teacher，在没有 labels 的情况下训练。2026 年最好的通用 image features。 |
| SigLIP | “CLIP 的继任者” | ViT + text encoder，使用 sigmoid contrastive loss 训练；在相同 compute 下优于 CLIP。 |
| Swin | “Windowed ViT” | 带有 local attention + shifted windows 的层级 ViT；sub-quadratic。 |
| Register tokens | “2023 trick” | 几个额外的可学习 tokens，用来吸收 attention sinks；可以改进 DINOv2 features。 |

## 延伸阅读

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) ViT 论文──
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877)- Não.
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030)- Sim, sim.
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193)DINOv2──
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) DINOv2's registros-tokens 修复方案。
