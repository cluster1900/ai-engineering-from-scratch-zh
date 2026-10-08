# Modelagem Visual Autoregressiva (VAR):Predicção em Nova Escala

> Diffusão Modelo em tempo 代采样 (代采样)  VAR em escala 代采样, isto é, primeiro prever um Token 1x1, re-prevê 2x2, então 4x4, até a resolução final, cada medida é condicionada à medida anterior.

**Type:** Build
**Languages:** Python (with PyTorch)
**Prerequisites:** Phase 7 Lesson 03 (Multi-Head Attention), Phase 8 Lesson 06 (DDPM)
**Time:** ~90 minutes

## 问题

Autoregressiva 生成之所以主导语言建模,是因为它能预测地扩展:更多计算、更多参数、更低困难、更好的输出──2024年之前, imagens generation主要有两类 AR尝试:PixelRNN/PixelCNN(逐像素) 和 DALL-E 1 / Parti / MuseGAN(在VQ-VAE códigos 上逐 Token) ⋅

两者都困难在生成顺序问题──像素和代币 排列在2D 网格中, mas AR 模型必须使用1D raster order 访问它们──早期角落像素不知道图像最终将变成什么──生成质量扩展性与文本上的GPT不同,也从未在匹配计算量时达到 Diffusion 模型质量──

VAR 通過改變生成對象來解決生成序列問題──VAR não é um espaço em que se preveja individualmente imagem Token, mas sim com uma resolução constante de aumento de pré-estimação整张图像──步骤 1: pré-estimação de um 1x1 Token(整体图像摘要)──步骤 2: pré-estimação de um 2x2 Token 网格(更粗的特征)──步骤 3: pré-estimação de um 4x4 网格──步骤 K: pré-estimação definitiva (H/8) x(W/8) 网格──

Cada medida vai prestar atenção a todas as medidas anteriores (a) e a sua própria medida vai desaparecendo.

## 概念

### O Tokenizer VQ-VAE em Multicálculo

VAR   precisa de um **multi-scale discrete Tokenizer** Para imagem x, ela gerará uma série de resoluções gradualmente melhoradas:

```
x -> encoder -> latent f
f -> tokenize at 1x1: token grid z_1 of shape (1, 1)
f -> tokenize at 2x2: token grid z_2 of shape (2, 2)
...
f -> tokenize at (H/p)x(W/p): token grid z_K of shape (H/p, W/p)
```

Cada z_k utiliza o mesmo livro de códigos (tipo: 4096-16384) ⋅ Tokenization em cada escala não é independente, mas é treinado para fazer com que cada escala seja capaz de reconstruir o resíduo de cada uma delas:

```
f ≈ upsample(embed(z_1), target_size) + ... + upsample(embed(z_K), target_size)
```

É um .**residual VQ**变体──尺度 k 捕获尺度 1..k-1 遗漏的内容──decoder 接收所有尺度 嵌入的和并生成图像──

Multi-escala VQ Tokenizer apenas treinar uma vez, assim como VQGAN), então结── todos os trabalhos gerados são realizados por seu Autoregressivo 模型完成──

### Próxima previsão

O modelo é um transformador, ele vê todos os tokens de dimensões anteriores, e prevê o próximo tokens de dimensões.

Estrutura de sequência de entrada:
```
[START, z_1 tokens, z_2 tokens, z_3 tokens, ..., z_K tokens]
```

Posição Embedding 同时编码尺度索引和尺度内的空间位置──Attention 在尺度顺序上是因果的:尺度 k、位置 (i, j) 的标记可以注意到尺度 1..k 的所有标记,也可以注意到尺度 k 本身在所使用的内尺度 序列中更早出现的标记(VAR utiliza atenção fixa posicional, não há causalidade intra-escala, isto é, todas as posições dentro de uma escala并行预测) 

訓練 Loss:在每个尺度 k,给定所有之前尺度的代币,预测代币 z_k。对离散 VQ codes 使用交叉热损耗──结构与GPT相似,只是在这里序列变成了尺度结构化的序列──

### O que é o que é?

推理时:
```
generate z_1 = sample from p(z_1)                    # 1 token
generate z_2 = sample from p(z_2 | z_1)              # 4 tokens in parallel
generate z_3 = sample from p(z_3 | z_1, z_2)         # 16 tokens in parallel
...
decode: f = sum of embed-and-upsample scales 1..K
image = VAE_decoder(f)
```

Quando K = 10 个尺度时,生成需要10次 Transformer forward pass. Per pass 都并行生成整个尺度,而不是在尺度内逐个代币自归.

### Por que a próxima escala vence a próxima token

Três vantagens estruturais:
1. **从粗到细符合自然图像统计规律。**O conhecimento visual e o conjunto de dados de imagem são apresentados em diferentes níveis de frequência.
2. **尺度内并行生成。**Diferente do GPT, o token AR, VAR, gerou uma etapa de uma determinada medida de tokens.
3. **没有生成顺序偏置。**O Token da dimensão k pode ver toda a dimensão k-1; não há posições de lado esquerdo ou superior, não forçará o Token inicial a fazer uma promessa antes de ser usado no final da fase.

### Lei de Escalada

Tian et al. provem que VAR em ImageNet em FID  segue a curva de escalagem de lei de poder, assim como a perplexidade do GPT ∙∙∙∙∙ parâmetros ou quantidade de cálculo duplicadas, será confiável para fazer o erro ∙ redução em metade ∙∙∙ . É o primeiro modelo de gerenciamento de imagens de escala que demonstra claramente esse comportamento de escalagem ∙∙∙ , resultado é que a previsão em escala VAR pode ser calculada por quantidade ∙ ∙ , em vez de depender de cada estrutura ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ 

### Relação com a Difusão

VAR e Diffusion Compartilham uma história de compressão de dados: ambos dividem o problema de geração em uma série de subproblemas mais fáceis.

- Difusão: gradualmente, inserir o ruído, aprender a retirar o ruído.
- VAR: Gradualmente aumentar a resolução, aprender a prever a próxima medida.

它们是穿越相同问题的不同轴线──两者都产生可处理的条件分布──经验上,VAR 推理更快(pass 更少,尺度内全并行),并且在类条件的ImageNet 上匹配或胜过DiT──文本条件的VAR(VARclip、HART) é uma direção de estudo ativa──


```figure
gx-var-next-scale
```

## Construí-lo

Em`code/main.py`- Não, não.
1. Em sintese image数据(2D anéis de Gaussian) construir um pequeno **multi-scale VQ Tokenizer**- Não.
2. Treinar um .**VAR-style Transformer**Para o próximo token de previsão em escala.
3. 通過调用變壓器 4 次(4 个尺度)并解码来采样──
4. 验证按尺度顺序训练会让生成在尺度内并行──

É uma implementação de brinquedo. O foco é ver a dimensão estruturada.

## Entrega-o

本课会生成 `outputs/skill-var-tokenizer-designer.md`, é uma habilidade para o design de Tokenizer em várias escalas: quantidade de dimensões, proporção de dimensões, tamanho do livro de códigos, compartilhamento residual, arquitetura de decodificadores.

## 练习

1. **尺度数量消融。**Usar 4、6、8、10 个尺度训练 VAR──衡重建质量与 Autoregressive pass 数量关系──更多尺度 = 更细残量 = 更好质量,但通过更多──

2. **Codebook size。**O tamanho do livro de códigos é 512、4096、16384 de Tokenizer。 um livro de códigos maior porta melhor reconstrução, mas prever é mais difícil― encontrar um ponto de viragem―

3. **尺度内并行检查。**Para um bom treinamento VAR, aparente medição padrão de atenção.

4. **VAR vs DiT scaling。**Para a mesma tarefa condicional de classe ImageNet, em combinação com o orçamento de DiT e VAR (por exemplo, 33M,130M、458M)  desenhar FID vs computação── VAR  deve liderar o DiT em cada dimensão, em pequena escala ⋅

5. **Text conditioning。**扩展 VAR,让它通过 adaLN 接收文本嵌入(CLIP pooled) como entrada de condicionamento extra──这是HART 配方──它能让文本一致样本上的FID 改善多少?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| VAR | "Visual AutoRegressive" | 通过在 VQ Token 网格金字塔上进行 next-scale prediction 来生成图像 |
| Next-scale prediction | "Predict coarser, then finer" | 模型以不断增加的分辨率尺度预测 Token，并以所有之前尺度为条件 |
| Multi-scale VQ tokenizer | "Residual VQ" | 生成 K 个分辨率递增 Token 网格的 VQ-VAE，decoder 会对所有尺度求和 |
| Scale k | "Pyramid level k" | K 个分辨率层级之一，从 k=1 的 1x1 到 k=K 的 (H/p)x(W/p) |
| Parallel-within-scale | "One forward per scale" | 尺度 k 的所有 Token 在一次 Transformer pass 中预测，而不是自回归预测 |
| Causal-across-scales | "Scale-ordered attention" | 尺度 k 的 Token 可以 Attention 到尺度 1..k 的全部内容，但不能 Attention 到尺度 k+1..K |
| Residual VQ | "Additive tokenization" | 每个尺度的 Token 编码较低尺度留下的 residual；decoder 对所有尺度 Embedding 求和 |
| VAR scaling law | "Image GPT scaling" | FID 随 compute 遵循可预测的 power law，类似语言模型的 perplexity |
| HART | "Hybrid VAR + text" | Text-conditional VAR 变体，将 MaskGIT-style iterative decoding 与 VAR 的尺度结构结合 |
| Scale position embedding | "(scale, row, col) triple" | Positional encoding 同时携带尺度索引和尺度内空间坐标 |

## 延伸阅读
- [Tian et al., 2024 — "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction"](https://arxiv.org/abs/2404.02905) VAR 论文,标准参考
- [Peebles and Xie, 2022 — "Scalable Diffusion Models with Transformers"](https://arxiv.org/abs/2212.09748) DiT, Difusão em relação à linha de base
- [Esser et al., 2021 — "Taming Transformers for High-Resolution Image Synthesis"](https://arxiv.org/abs/2012.09841) VQGAN,VAR's multi-escala Tokenizer
- [van den Oord et al., 2017 — "Neural Discrete Representation Learning"](https://arxiv.org/abs/1711.00937) VQ-VAE, base de Tokenization de imagens
- [Tang et al., 2024 — "HART: Efficient Visual Generation with Hybrid Autoregressive Transformer"](https://arxiv.org/abs/2410.10812) VAR condicional de texto
