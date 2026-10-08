# Flamingo e VLMs de pouca tiragem

> O DeepMind's Flamingo (em inglês: DeepMind's Flamingo, em 2022) completou duas coisas mais cedo do que outros. Ele prova que um único modelo pode processar imagens, vídeos e textos em qualquer sequência de erros arbitrários. Ele também prova que os VLMs podem ser realizados em contexto.

**Type:** Learn
**Languages:** Python (stdlib, gated cross-attention + Perceiver resampler demo)
**Prerequisites:** Phase 12 · 03 (BLIP-2 Q-Former)
**Time:** ~120 minutes

## Objectivo de aprendizagem
- 解释 gated cross-attention 如何通过 tanh(gate) = 0 在初始化时保留结 LLM 的文本能力──
- 逐步讲解 Perceptor resampler:N 个 image patches → K 个固定latentqueries,经 cross-attention 完成──
-  Descrição de Flamingo  como usar o mascaramento causal de respeitar a posição do quadro  tratamento de sequências de imagem-texto ◊
- 复现 few-shot Multimodal prompt 结构(3 个 image-caption示例,然后是一个查询图像) 』

## 问题
BLIP-2 vai fazer 32 tokens visuais 输入结 LLM 输入层结 LLM 每一个提示 一张图像时可以工作.但是如果你想输入*多张*与文本交交错图像,例如这里是图像A,为它生成标签;这里是图像B,为它生成标签;现在这里是图像C,为它生成标签这?LLM 需要在单一流中处理图像代币和文代币,以及哪些位置可以参加到哪些图像这个问题会变得繁.

A resposta do Flamingo é: não alterar completamente o fluxo de entrada do LLM. Em blocos existentes de LLM, entre as camadas de atenção cruzada são inseridas camadas de atenção cruzada. Tokens de texto continuam a ser como sempre.

Flamingo 回答的第二个问题是:如何处理每个提示中可变数量的图像(0、1 或多张)?Perceptor resampler  一个小型跨注意力模块,接收任意数量的补丁,并生成固定数量的视觉潜伏代币──无论提示中有多少张图像,LLM跨注意力层 看到的形状都相同──

## 概念
### O LLM congelado

Flamingo 从结的Chinchilla 70B LLM 开始──全部 70B weights 保持不变──现有的文本 自注意 和 FFN 正常运行──

### Re-estampilador de percepção

对于快速中的每张图像,ViT 会生成 N 个补丁代币――Perceptor resampler has K 个固定的可学习的潜伏(Flamingo 使用 K=64)──cada bloco de resampler tem dois passos:

1. Atensão cruzada:K 个 latentes atender até N 个 patch tokens ((Q de latentes,K / V de patches) ⋅
2. Latentes 内部的自我注意+FFN──

经过 6 个样本块 后,输出是 K=64 个 dim 1024 的视觉代币,无论 ViT 生成多少补丁──224x224 图像(196补丁) 和 480x480 图像(900补丁) 都会输出为 64 个样本代币──

Para o vídeo, o modelo irá ser aplicado por tempo: cada um dos patches é produzido em 64 patches latentes, enquanto a codificação posicional temporal faz com que o vídeo completo se torne em 64 tokens visuais.

### Atensão transversal

Em seguida, o programa de ensino superior é lançado em um novo bloco de atenção transversal.

```
x_after_llm_block = llm_block(x_before)
cross = cross_attn(x_after, resampler_output)
gated = tanh(alpha) * cross + x_after
x_before_next_block = gated
```

- `alpha`É um escalar aprendizagem inicialmente para zero.
- `tanh(0) = 0`, para que iniciaisse quando fechado ramo  contribuir para zero.
- - Não .`alpha`远离零,cross-attention 贡献会平滑增长──
- A conexão residual significa que mesmo o portão está totalmente aberto, não cobrirá o texto do LLM; ele apenas adiciona informações visuais sobre ele.

É o mais importante design seleção entre Flamingo: condicionamento visual é aditivo, fechado, e em inicialização para zero.

### Usando a atenção cruzada mascarada de entradas entrelaçadas

Em um exemplo de "<imagem A> subtítulo A <imagem B> subtítulo B <imagem C> ?" , cada token de texto  deve apenas ver os números de imagens anteriores `t`O token de texto só atende à imagem de índice `i < i_t`Of imagem resampler tokens, entre eles `i_t`É a posição`t`之前最近的图像──只看最近的前置图像或看到所有的前置图像都是有效选择; Flamingo 选择了前者──

### Aprendizagem em poucos tiros no contexto

Flamingo rápido parece:

```
<image1> A photo of a cat. <image2> A photo of a dog. <image3> A photo of a
```

模型看补全模式并输出 "bird" () 图片3 显示的任何内容) ⋅没有 Gradient steps──结 LLM 能力通过门禁横断注意保留下来 这是论文的头条,也是它重要的原因──

### Dados de formação

Flamingo utiliza três grupos de treinamento:

1. MultiModal MassiveWeb (M3W):43.3 milhões contém páginas de imagens e textos, reconstruído.
2. Pares de imagem-texto (ALIGN + LTIP): 44 milhões de
3. Video-Text Pairs (VTP): 27 milhões de clips de vídeo curtos.

OBÉLICAS(2023) é um sistema de aprendizagem de linguagem em geral.

### OpenFlamingo e Otter

OpenFlamingo(2023) é aberto e está em funcionamento. Arquitetura 相同(Re-sampler do perceptor + 结 LLaMA ou MPT 上的门塞横断注意力) ・・・Pontos de verificação são 3B、4B、9B。

Otter(2023) baseado em OpenFlamingo, e MIMIC-IT(((a Numero de instruções multimodal) para realizar a sintonia de instruções, mostrando a atenção cruzada fechada também é aplicável para instruções seguintes。

### Os descendentes

- Idefics / Idefics2 / Idefics3: Gated cross-attention lineage of Hugging Face,逐步简化(Idefics2 放弃 resampler,改为使用带适应性聚合的直接补丁代币) ⋅
- Transição Flamingo-Chameleon: até 2024 anos, muitos equipos se voltaram para a fusão precoce.
- Introdução interleaved de Gemini: conceito herdou a flexibilidade de formato interleaved de Flamingo, embora o mecanismo seja proprietário.

### Comparar com BLIP-2

| | BLIP-2 | Flamingo |
|---|---|---|
| Visual bridge | 输入处一次性使用 Q-Former | 每 M 层使用 gated cross-attention |
| Visual tokens | 每张图像 32 个 | 每张图像每个 cross-attn layer 64 个 |
| Frozen LLM | Yes | Yes |
| Few-shot in-context | 弱 | 强 — 论文的核心 |
| Interleaved inputs | 无原生支持 | Yes，设计目标 |
| Training data | 130M pairs | 1.3B pairs + 43M interleaved pages |
| Parameter count | 188M trained | ~10B trained (cross-attn layers) |
| Compute | 8 个 A100 上数天 | 数千个 TPUv4 上数周 |

预算有限的单图 VQA 选择 BLIP-2――需要交错输入、少数射或多图推理时选择 Flamingo/Idefics2――


```figure
cross-attention-fusion
```

## Use-o
`code/main.py`演示:

1. Em 36 tokens de patch falsos, usando 8 latentes aprendizes, a atenção cruzada do Python)
2. Um passo de atenção cruzada fechado, entre eles.`alpha = 0`→ 输出等于输入 (LLM 不变), então `alpha = 2.0`→ 混入视觉贡献──
3. Um construtor de máscara interleaved,为 "(imagem 1) (texto 1) (imagem 2) (texto 2)" 序列生成 2D attention mask──

## Entrega-o
本课产 出 `outputs/skill-gated-bridge-diagnostic.md` fornecer uma configuração de VLM aberta (resampler Y/N、cross-attn frequency、gate scheme), que irá identificar elementos da linhagem Flamingo e explicar a estratégia de congelamento.

## 练习
1. 计算 Flamingo-9B's visual parameter count:9B LLM + 1.4B gated cross-attention layers + 64M resampler── training parameters occuping the total parameters ratio is what?

2. Em PyTorch , realçar resíduos fechados`y = tanh(alpha) * cross + x` através de experiências`alpha=0`时, inicialização `y==x`精确成立── Não é verdade.

3. 阅读OpenFlamingo Seção 3.2(arXiv:2308.01390), entender quando cada pedido tem diferentes números de imagens, como eles processam os lotes de imagens em lotes.

4. Por que a máscara de atenção cruzada do Flamingo  Deixar que o token de texto atenda às imagens pré-postas mais recentes, em vez de todas as imagens pré-postas?

5. Em contexto, algumas fotos: para uma nova variante Flamingo Construir uma que contenha 4 个image → principal objeto de cor  Exemplos de exemplo  Impressão.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Perceiver resampler | "Fixed-latent cross-attention" | 从可变数量的 input patches 中生成 K 个固定 tokens 的 module |
| Gated cross-attention | "Tanh-gated bridge" | residual layer `y = tanh(alpha)*cross + x`，learnable alpha，初始化为 0 |
| Interleaved input | "Mixed sequence" | 图像和文本按阅读顺序自由混合的 prompt format |
| Frozen LLM | "No LLM gradients" | 文本 LLM 的 weights 不更新；只训练 resampler + cross-attn layers |
| Few-shot | "In-context examples" | 在 prompt 中给出少量（image, answer）对；模型无需 finetuning 即可泛化 |
| OBELICS | "Interleaved web corpus" | 包含 141M 个网页的开放数据集，图像和文本按阅读顺序排列 |
| Chinchilla | "70B frozen base" | Flamingo 的冻结文本 LLM，来自 DeepMind 的 Chinchilla paper |
| Gate schedule | "How alpha moves" | 训练期间 cross-attention gate 打开的速率 |
| Cross-attn frequency | "Every M layers" | 插入 gated cross-attention block 的频率；Flamingo 使用 M=4 |
| OpenFlamingo | "Open reproduction" | MosaicML/LAION 的 3-9B 开放 checkpoint；architecture 与 Flamingo 相同 |

## 延伸阅读
- [Alayrac et al. — Flamingo (arXiv:2204.14198)](https://arxiv.org/abs/2204.14198) 原始论文──
- [Awadalla et al. — OpenFlamingo (arXiv:2308.01390)](https://arxiv.org/abs/2308.01390) 开放复现──
- [Laurençon et al. — OBELICS (arXiv:2306.16527)](https://arxiv.org/abs/2306.16527) 交错网页语料──
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) 通用 Arquitetura Perceptor。
- [Li et al. — Otter (arXiv:2305.03726)](https://arxiv.org/abs/2305.03726) 经过 instrução-tuned 的 Flamingo 后续模型──
- [Laurençon et al. — Idefics2 (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246) A abordagem flamengo é modernamente simplificada.
