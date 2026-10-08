# Transformadores de visão e Patch-Token

> Em qualquer Multimodal  processamento, imagens todos devem ser transformados em Transformer  sequência de Token  que podem ser processados. Em 2020, o ViT  artigo usa 16x16 像素补丁、线性投影和位置 Embedding  respondeu a essa questão.

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 分钟

## Objectivo de aprendizagem
- HxWx3 图像转换为带有正确位置编码的补丁代码的图像转换为带有正确位置编码的补丁代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码代码
- Para determinar a dimensão do parche, a resolução, a profundidade oculta, a comprimento da sequência, o número de parâmetros e os FLOPs.
- Explicar que a ViT será promovida a partir de 2020 e até 2026 através de três melhorias do sistema de produção: pré-treinamento auto-supervisionado (DINO/MAE) ), tokens de registro e embalagens de resolução nativa (native-resolution packing).
- Por isso, a sua função é fazer uma seleção entre os tokens de registro e o CLS.

## 问题
Transformador  processar é Vector 序列。文本本本就是序列(bytes或tokens)。图像是带有三个颜色通道的2D 像素网格,不是序列。 Se você展平每一个像素,一张 224x224 RGB 图像会变成150,528 符号,而这个长度上的自我注意是完全不可行的(相对于序列长度是二次复杂性)。

O método anterior a 2020 seria de gerar um extractor de recursos da CNN: ResNet  produzir um mapa de recursos 7x7 composto por 2048-dim Vector , reintegrar estes 49 Token 输入 Transformer── This能工作, mas vai herdar a posição da CNN [[equivalência de tradução]], campos receptivos locais]],并削弱 Transformer 适应能力对规模扩展──

Dosovitskiy et al. (2020)  propôs uma questão direta: se saltar CNN 会怎么?把图像切割成固定大小的补丁(例如16x16像素),将每个补丁线性投影成一个矢量,加入位置嵌入,然后把序列输入一个瓦尼拉变压器──当时这属于异端做法不用卷积做视觉──只要数据足够多(JFT-300M,之后是LAION),它就在 ImageNet上超过ResNet,并持续改进──

Até 2026, o ViT original já é indiscutível. Todas as torres de visão de VLM de peso aberto são de uma espécie de última geração. A questão já não é se devemos usar um patch.

## 概念
### Patches como tokens

- Não . - Não .`(H, W, 3)`De imagens`x`和 tamanho do parche `P`, você vai cortar a imagem em um .`(H/P) x (W/P)`De um parche não sobrepondo 网格── cada parche  都 `P x P x 3`de quadrados de imagem.`3 P^2`Vector: aplicação de uma forma para`(3 P^2, D)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `W_E`, colocar cada parche de mapa para a dimensão oculta do modelo .`D`- Não.

Para o ViT-B/16 esta configuração clássica:
- Resolução 224, tamanho do parche 16 → rede 14x14 → 196 个 parche tokens。
- Cada parche é .`16 x 16 x 3 = 768`个像素值, projeção até `D = 768`- Não.
- 加入一个可学习的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `[CLS]`token → comprimento de sequência 197。

Projeção de parche em matemática é igual ao tamanho do kernel`P`- É um passo.`P`、output passagem numeral para `D`de 2D convolução.`nn.Conv2d(3, D, kernel_size=P, stride=P)`Linear projeção的说法是概念表述;核心表述更高效──

### Embedings de posição

Patch 没有内在顺序  Transformer 看到的是一个集合──早期 ViT 加入可学习的 1D 位置 嵌入式((cada posição um vetor de 768-dimensões,总共 197 个) ── Isso pode funcionar, mas vai ligar o modelo à resolução de treinamento: se for necessário alterar a grade, é necessário inserir um valor de posição──

现代视觉背骨 使用 2D-RoPE(Qwen2-VL 的 M-RoPE、SigLIP 2 的默认方案) 或因数化 2D-RoPE 会根据补丁的(排列,列)索引旋转查询 和键向量,因此模型可以从旋转角度推断对 2D位置──不需要位置表──模型在推理时可以处理任意格格尺寸──

### Títulos CLS ‧ saída combinada 和 registros de tokens

O que é que é o "imagem"?

1. `[CLS]`token──把一个可学习向量 前置到补丁序列──经过所有变压器块 后,CLS token's hidden state 就是图像表示──继承自BERT──原始 ViT、CLIP 使用这种方式──
2. Mean pool──对 patch tokens 的输出隐藏状态 取平均──SigLIP、DINOv2 和大多数现代VLM使用这种方式──
3. Registo de tokens──Darcet et al. (2023)  observado, não há aparente sink token  treino de ViT 会产生高范数的artifact patches,并劫持自我注意──加入 416 个可学习的登录代币 可以吸收这个部分负载,并提升密集预测质量(segmentação、深度)──DINOv2 和 SigLIP 2 都随模型提供登录──

Esta escolha afetará a tarefa de entrada. CLS  adapta à classificação. Para colocar os patches 输入 LLM's VLM, você vai saltar completamente o pooling.

### Pre-treinamento: supervisão, comparação, mascaragem, auto-disciplina

O ViT de 2020 utilizou a classificação supervisionada JFT-300M  realizar um treinamento prévio.

- CLIP (2021): fazer imagens-texto contraditórios em 400M para dados de gráficos.
- MAE (2021, He et al.): mascar 75% dos patches, reconstruir imagem, auto-supervisionada, adequada para imagem pura,
- DINO (2021) / DINOv2 (2023): uso de aluno-professor fazer auto-distilação, sem rótulos, sem legendas.
- SigLIP / SigLIP 2 (2023, 2025):带 sigmoid loss 和 NaFlex 原生宽高比支持的 CLIP──2026年开放VLMs(Qwen、Idefics2、LLaVA-OneVision) 中的主流视觉塔──

Você escolheu o pré-treinamento decidirá a espinha dorsal 擅长什么:CLIP/SigLIP 擅长与文本做语义匹配,DINOv2 擅长密集视觉特征,MAE 适合作为下游细节调的起点──

### Leis de escalagem

A escalação da ViT ((Zhai et al. 2022) indica que a qualidade da ViT está no tamanho do modelo, no tamanho dos dados e no cálculo acima segue as regras previsíveis.
- Modelo maior + mais dados → melhor qualidade.
- O tamanho do parche é o comprimento da sequência e a fidelidade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- A resolução é outro grande pólio. De 224 a 384 e de 512 a 512 quase sempre são úteis, mas os FLOP são feitos em segundo grau.

ViT-g/14(1B params、patch 14、resolução 224 → 256 tokens) e SigLIP SO400m/14(400M params、patch 14) são dois principais codificadores de VLMs abertos em 2026 ⋅

### Contagem de parâmetros para um ViT

完整计算位于 `code/main.py`❖ Para 224 abaixo ViT-B/16:

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

Antes de fazer o checkpoint, primeiro, use este método para calcular o tamanho da coluna vertebral.

### Configuração de produção 2026

A maioria dos VLMs abertos em 2026 随模型 provided encoder is original生 resolution (NaFlex) under SigLIP 2 SO400m/14──
- Parâmetros de 400 M:
- Tamanho do parche 14, resolução 384 → 每张图像 729 个 parche tokens──
- 图像级任务使用平均池;VQA 中所有的729 补丁都流入LLM──
- 4 tokens de registro, em transferência de LLM
- Utilize 2D-RoPE,并带有面向本地面对比的图像水平扩展──

Cada decisão nesta configuração pode ser traçada a um artigo que você pode ler.


```figure
image-patch-tokens
```

## Use-o
`code/main.py`É um tokenizer de parcheiro e calculadora de geometria.

- Patching 后的格格形 和序列长度──
- Uma imagem de brinquedo de 8x8 像素 像素 图像的代码序列(逐步走过平坦 +项目路径) ⋅
- 按补丁嵌入、位置嵌入、变压器块 和头 拆分的参数数数──
- 目標 resolution 下单次前進通過のFLOPs──
- ViT-B/16 @ 224、ViT-L/14 @ 336、DINOv2 ViT-g/14 @ 224、SigLIP SO400m/14 @ 384 的对比表──

运行它──把参数 counts 和已发布数字对齐──调整补丁尺寸和解析度,感受 Token 数量成本──

## Entrega-o
本课会生成 `outputs/skill-patch-geometry-reader.md` dado uma configuração ViT ((patch size、resolução、hidden dim、depth), que gerará带有理由说明的令牌-count、parameter-count 和 VRAM estimation。 cada vez que você escolher para VLM 视觉背骨 时,都使用这个技能  它能避免Token 爆炸然后把我的LLM context 填满的意外──

## 练习
1. 計算 Qwen2.5 VL 在原生 1280x720 输入、patch size 14 下的补丁符号序列长度──它和只使用 CLS 的表示相比如何?

2. Uma tela de 1080p ((1920x1080) em patch 14 下会产生多少代币?30 FPS、5 分钟视频会有多少代币?哪种成本削减最有效:pooling、frame sampling,还是代币合并?

3. Utilize pure Python  implementar tokens de patch  上的 mean pooling 验证对 DINOv2 输出 196 代币做做 mean-pool,与请求 pooled embedding 时模型 `forward`Resultados de retorno são iguais.

4. 阅读 "Vision Transformers Need Registers" (ArXiv:2309.16588) 阅读 "Vision Transformers Need Registers" (ArXiv:2309.16588) 阅读: 阅读: 阅读: 视觉变化器需要注册") 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读: 阅读 阅读: 阅读 阅读 阅读 阅读 阅读 阅读 阅读 阅读: 阅读 阅: 阅读 阅读 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅: 阅:

5. 修改 `code/main.py`以支持 patch-n'-pack:给定一组不同分辨率的图像,生成一个包装序列 和块-diagonal attention mask──到达课时 12.06 时再进行验──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Patch | “16x16 像素方块” | 输入图像中固定大小、非重叠的区域；会变成一个 Token |
| Patch embedding | “Linear projection” | 一个共享的学习 Matrix（或 stride=P 的 Conv2d），将展平后的 patch 像素映射到 D-dim Vector |
| CLS token | “Class token” | 前置的可学习 Vector，其最终 hidden state 表示整张图像；在 2026 年是可选项 |
| Register token | “Sink token” | 额外的可学习 Token，用于吸收 ViT 在 pretraining 期间产生的高范数 Attention artifacts |
| Position embedding | “Positional info” | 每个位置的 Vector 或旋转，使序列具备顺序感知；2D-RoPE 是现代默认方案 |
| Grid | “Patch grid” | 对于给定 resolution 和 patch size，patch 形成的 (H/P) x (W/P) 2D 数组 |
| NaFlex | “Native flexible resolution” | SigLIP 2 特性：单个模型无需重新训练即可服务多种 aspect ratios 和 resolutions |
| Backbone | “Vision tower” | 预训练 image encoder，其 patch-token 输出会在 VLM 中输入 LLM |
| Pooling | “Image-level summary” | 将 patch tokens 转换为一个 Vector 的策略：CLS、mean、attention pool 或 register-based |
| Patch 14 vs 16 | “Finer vs coarser grid” | Patch 14 每张图像产生更多 Token，对 OCR 有更好 fidelity，但更慢；patch 16 是经典默认值 |

## 延伸阅读
- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) 原始 ViT。
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) MAE, auto-supervisão pré-treinamento。
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) Auto-distilação em grande escala, sem rótulos。
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) registos de tokens 和 artefacto 分析。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)2026: Torre de Visão
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) 经验性 escalar leis
