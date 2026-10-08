# 任意分辨率 Vision: Patch-n'-Pack 和 NaFlex

> A resposta do VLM foi 9:19.5 ⋅2024 ⋅ Resumir todo o conteúdo em forma quadrada fixa ⋅ Perderam o OCR ⋅ Documentos de compreensão e alta resolução de cenário para resolver sinais realmente úteis ⋅NaViT ⋅Google,2023) mostrou que pode usar o bloqueio de diagonal mascarar parches de resolução variável ⋅Pack em um único lote de transformador ⋅ M-RoPE do Qwen2-VL ⋅2024) eliminou completamente a tabela de posição ⋅LaVA ⋅ NeXT ⋅Resolução de imagem de alta resolução da base + sub-imagens ⋅SigL 2 NaFlex ⋅2025)

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## Objectivo de aprendizagem
- A partir de então, a imagem pode ser transformada em uma sequência de parches com resolução variável.
- 针对给定任务,在 AnyRes tiling (LLaVA-NeXT) 、NaFlex (SigLIP 2) 及 M-RoPE (Qwen2-VL) 之间做选择──
- Em caso de não mudar de tamanho, para OCR, gráficos e fotografia calcular os orçamentos de tokens.
- Exercer três modos de falha de quadrado: texto estressado, conteúdo cortado, padagem de tokens em desfalque.

## 问题
Transformadores  precisa de uma sequência― um lote é de uma sobreposição de uma mesma sequência― Se a sua imagem for 224x224, cada vez obtém 196 parches Token, não precisa de enchimento, tarefa completa― usam 224  treino, usam 224 inferência, nunca mais precisa pensar em resolução―

现实不配合──文档是版(8.5x11 英寸,约 2:3)──图表截图是横版(16:9)──收据又高又窄(1:3)──医学影像通常是2048x2048或更大──移动设备截图是1170x2532(0.46:1)──

As três opções anteriores a 2024 e por que todas falharão:

1. Resize até a forma quadrada fixa ((224x224 ou 336x336) ⋅ extremação vai distorcer o texto e o rosto humano。
2. Crop to fixed aspect ratio── Você perderá a maior parte do conteúdo da imagem, e escolher a posição da planta é uma questão de visão ──
3. Pad até o limite mais longo. Resolveu o erro, mas para a edição de imagens, 50% ou mais de tokens serão desperdiçados em padding.

Resposta de 2024-2025: Deixe transformador 吃下图像原生分辨率的补丁,并弄清楚如何将不同构成批量 打包成一序列,同时避免浪费计算――

## 概念
### NaViT e patch-n'-pack

NaViT(Dehghani et al., 2023) é a prova de que este método pode ser escalado.

1. Para cada imagem no meio do lote, de acordo com o tamanho do parche escolhido (por exemplo 14) calcular sua grade de parche original.
2. A cada imagem, os pedaços se aplanam em sua própria sequência de comprimento variável.
3. Todos os patches de imagem serão concatenados.
4. Construir uma máscara de atenção de bloco-diagonal, fazer patches de imagem A apenas em imagem A   interno assistir.
5. 携带每个 patch 的位置信息(2D RoPE ou embalagens de posição fracionária)。

Três quadros de imagens compostas por um lote de três quadros (336x336(576 Token) 、224x224(256 Token) e 448x336(768 Token), transformam-se numa sequência de 1600 Token, com uma máscara de bloco-diagonal de 1600x1600 ⋅ não padding── não padagem── não perda de cálculo── Transformador pode processar qualquer relação de aspecto──

NaViT também introduziu no treinamento a queda de parches fraccionais em todo o lote, em que 50% dos parches são eliminados. Isso também pode regularizar, também pode acelerar o treinamento.

### AnyRes (LLaVA-NeXT)

AnyRes de LLaVA-NeXT é um alternativo de facto.

1. Do predefinido conjunto, escolha um layout de grade (1x1) (1x2) (2x1) (1x3) (3x1) (2x2) etc para fazer com que a sua relação de aspecto da imagem seja mais adequada
2. Vou cortar a imagem completa na grade; cada telha transformar em uma colheita de 336x336
3. Ao mesmo tempo gerar uma miniatura:整张图像大小到336x336,作为全球语境代币.
4. Vai enviar cada um dos blocos para um encodeador congelado de 336 números.

对于一张 672x672 图像, use 2x2 grid加缩影:4 * 576 + 576 = 2880 个视觉代币――昂贵但有效LLM 同时看局部细节和全局上下文――

Quando o seu codificador está congelado e só suporta uma resolução,AnyRes é o primeiro caminho de seleção. Isso fará que a imagem de um token explode.

### M-RoPE (Qwen2-VL)

Qwen2-VL introduziu o Embedding Multimodal Rotary Positioning. Diferente das posições fracionárias do NaViT ou do OneRes, cada parche transporta uma posição 3D:

M-RoPE 原生提供动态分辨率,无需重新训练――Inference 时输入任意HxW 图像,patch embedder 生成H/14 x W/14 个代币, cada代币 获得自己的 (t=0, r=row, c=col) 位置,RoPE usando a frequência correta de rotação Atenção,完成──Qwen2.5-VL 和 Qwen3-VL 延续了这一点──V2PE de InternVL3 é o mesmo, apenas de acordo com a modalidade 使用可编码──

Diferente de AnyRes, M-RoPE em resolução original é O(H x W / P^2) Token 没有带来的片开销. Diferente de NaViT, ainda é esperado para o futuro apenas para processar imagens simples.

### NaFlex (SigLIP 2)

NaFlex é o modelo nativo de controle de SigLIP 2. Modelo: Single Modelo em inferência 时支持多种序列长度256、729、1024 Token) ⋅内部在训练期间使用NaViT-style patch-n'-pack,并为每个 patch 使用绝对分数位置──卖点是:一个检查点,按任务在 inferência 时选择 Token budget──

语义任务(classificação、retorno) com 256 Token。OCR 或图表理解用 1024 Token。无需重新训练。

### A máscara de embalagem

Mascara de bloco-diagonal é o lugar onde a maioria das realizações são fáceis de fazer.`N_total`de sequência embalada, cobre imagem `i=0..B-1`, respectivamente`n_i`, forma `(N_total, N_total)`Mascara`M`Em dois índices inseridos no bloco da mesma imagem 时为 1,否则为 0. Você pode construir a partir da lista de comprimento acumulativo:

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

Em PyTorch, isso pode ser usado.`torch.block_diag`Ou aparentemente reunir 一行实现── FlashAttention's variable-length path(`cu_seqlens`) completamente saltou sobre a máscara, diretamente com tensor de comprimento acumulativo em sequências  interno assistir  para o lote típico, em comparação com a máscara densa 快约10x。

### Orçamentos de tokens

按任务选择策略:

- OCR / documentos: 1024-4096 Token。SigLIP 2 NaFlex em 1024, OR AnyRes 3x3 + miniatura。
- Gráficos e UI:384-448 原生分辨率下 729-1024 Token──使用带max pixels cap 的 Qwen2.5VL 动态分辨率──
- Fotos naturais: 256-576 Token 就夠了──下游 LLM 能看到足夠信息──把 Token 花在内容密度高的地方──
- Video: espaço de partilha 后每 64-128 Token,2-8 FPS──Lessão 12.17 会讲这个──

Regras de produção de 2026: escolher um limite máximo de pixels por tarefa, em relação à dimensão original 编码到该帽,打包批量,并跳过填充;;`min_pixels`和 `max_pixels`É para usar esta rotação.


```figure
mm-patch-n-pack
```

## Use-o
`code/main.py`Para um conjunto de imagens de imagens usando um conjunto inteiro de imagens para implementar o patch-n'-pack.

- 接收一个 (H, W) 图像尺寸列表──
- 按补丁尺寸 14 计算每张图像的补丁序列长度──
- E os enrolar em um conjunto de tamanhos.`sum(n_i)`Seqüência de...
- 构建块-diagonal attention mask (Máscara de atenção de blocos-diagonal)
- Comparar o custo de embalagem com o tamanho quadrado e o mosaico de qualquer tipo.
- Para um lote misturado ((receito, gráfico, tela, foto) Imprimir Tabela de orçamento do token.

Os números de saída explicam por que todos os VLM abertos de 2026 usam patch-n'-pack.

## Entrega-o
本课生成 `outputs/skill-resolution-budget-planner.md`△ deu-se uma proporção de aspecto misturada 工作负载(OCR、chartes、fotos、videoframes) e orçamento total de tokens, ele escolherá estratégia correta(NaFlex、AnyRes、M-RoPE ou quadrado fixo), e sai por configuração de pedido。 Quando você faz o tamanho VLM no produto 时使用这个技能它能避免静默的10x Token 膨胀,否则会杀杀延迟预算。

## 练习
1. Uma receita é 600x1500 ((1:2.5)。 tamanho do parche é 14 时, há quantas tokens de resolução nativa? quadrado-dimensionar até 336 后有多少?

2. Para um lote que contém quatro imagens, construem uma máscara de bloco-diagonal, com uma duração de 256,576,729,1024 ⋅ testar a Matriz de Atenção é 2585x2585, e, de fato, tem`256^2 + 576^2 + 729^2 + 1024^2`个非零条目──

3. À 1张 1792x896 图像, parche 14,比较:(a) quadrado-dimensional até 336 后编码,(b) AnyRes 2x1 + miniatura,(c) M-RoPE em nativo──哪种使用最少 Token?哪种保留最多细节?

4. 实现 fractional patch dropping: given determining a packed sequence, uniformly at random 丢弃 50% 的 Token,并相应更新块-diagonal mask──测量 mask 的稀缺性 变化──

5. 阅读 Qwen2-VL 论文(arXiv:2409.12191) do Seção 3.2──用两句话描述 `min_pixels`和 `max_pixels`Controlar o que e por que as duas fronteiras são importantes.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Patch-n'-pack | "NaViT-style packing" | 将来自不同图像的可变长度 patch sequences concatenate 到一个 batch dimension 中 |
| Block-diagonal mask | "Packing mask" | Attention mask，将每张图像的 patches 限制为只 attend 自己，而不是 pack 中的相邻图像 |
| AnyRes | "LLaVA-NeXT tiling" | 将高分辨率图像切成固定大小 tiles 的 grid，并加一个全局 thumbnail；用固定 encoder 编码每个 tile |
| NaFlex | "SigLIP 2 native-flex" | 单个 SigLIP 2 checkpoint，可在 inference 时服务 256/729/1024-Token budgets，无需重新训练 |
| M-RoPE | "Multimodal RoPE" | 3D rotary position encoding（time、row、column），无需 position tables 即可处理任意 H、W、T |
| cu_seqlens | "FlashAttention packing" | FlashAttention varlen path 使用的 cumulative-length tensor，用来替代 dense block-diagonal mask |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的 per-request knobs，用于限制非常小或非常大输入上的 Token count |
| Visual token budget | "How many tokens per image" | 每张图像发出的 patch Token 粗略数量；决定 LLM 的 prompt budget 和 Attention cost |

## 延伸阅读
- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
