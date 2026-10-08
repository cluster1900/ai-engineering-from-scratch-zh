# InternVL3: Pré-formação Nativa Multimodal

> InternVL3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## Objectivo de aprendizagem
- 解释为什么后期VLM training 会累积对齐债,并引用三个可测量症状(luvião catastrófica、resposta deriva、visual-texto inconsistência)
- Descrição do mix de corpus de pré-treino nativo do InternVL3, bem como texto: interleaved: por que é importante:
- Comparar V2PE (variable visual position encoding) e M-RoPE do Qwen2-VL
- O Visual Resolution Router (ViR) e o Dividido Vision-Language (DvD) são duas optimizações de implantação.

## 问题
O treinamento pós-hoc em VLM é um método de aceitação.

1. Mestrado em LLM congelado + codificador de visão congelado + projetor treinável, em pares de legendas
2. Descongelar o Mestrado em Direito e Direito, em dados de instrução
3. Seleção de ajustes específicos de tarefa:

A dívida de alinhamento 会表现出三个症状:

- O esquecimento catastrófico. O esquecimento de texto.
- A resposta derivação. A variação de uma mesma pergunta visual é diferente. A ligação entre o codificador de visão e o LLM é mais fraca do que a ligação entre os tokens do LLM.
- Incoerência visual-textual. VLM pode descrever corretamente uma imagem, e então responder a um problema de contradição com sua própria descrição.

Estes sintomas são documentados em toda a parte. MM1.5 Secção 4 sobre eles foi quantitativa.

## 概念
### Pre-treino nativo multimodal

InternVL3 desde o início começou em um corpo original de multimodal.

- 40% de dados apenas de texto ((FineWeb、Proof-Pile-2 etc)
- 35% de dados de imagem-texto interligados (obélicos, estilo MMC4)
- 20% de dados de captura de imagem em par
- 5% de dados de vídeo-texto

Tokens de visão, tokens de texto, bem como interações entre os módulos, todos começaram a participar do mesmo passo de gradiente, sem pre-treino de alinhamento, sem fase de congelamento do projeto, nem precisa de recuperação do esquecimento catastrófico.

O treinamento do modelo base é de uma fase única. A instrução é seguida de um processo de sintonização.

### V2PE (codificação de posição visual variável)

Qwen2-VL Utilize M-RoPE,并 adopt fixed axis allocation──InternVL3  Introdução V2PE:position encoding 会按 Modality type((text、image、video) variação,并带有可学习扩展──实践中:

- Tokens de texto  obter posição 1D (index de texto)
- Patches de imagem  obter posição 2D ((row, col) 。
- Quadros de vídeo  obter posição 3D ((tempo, fila, col) ⋅

Os participantes compartilham a mesma base de frequência RoPE, mas a alocação oculta de cada banda é um parâmetro de aprendizagem, e não um divisor fixo.

A afirmação de ablação de V2PE: em comparação com a computação abaixo, os índices de referência de vídeo em comparação com M-RoPE são altos de 1-2 分── não são mudanças revolucionárias, mas mais nítidas──

### Roteador de resolução visual (ViR)

Otimizar a implantação. Não é necessário codificar todas as imagens em resolução completa. Se for de 1280px, os tokens serão desperdiçados.

Routing 有三档:low-res(256 tokens) 、medio(576) 、high(2048+) ⋅ em tráfego de produção, 60% das consultas Usar baixo ou médio 就足夠──净效果:在相同质量下吞吐量 提升 2-3x──

### Descopação de Língua de Visão (DvD)

Quando você serve um grande VLM, codificador de visão Cada imagem é executada uma vez, mas LLM irá para cada token de saída auto-regressar ao funcionamento.

Para um modelo de codificador 8B + 400M, o DVD comparado co-locado 大约能让每节点吞吐量翻倍──

### Qualidade de uma fase versus de várias fases

InternVL3  principal referência afirmação: em 78B params 下匹配 Gemini 2.5 Pro 的 MMMU-Pro──在 38B 下匹配 GPT-4o──在 8B 下领先 open-8B leaderboard──全部基于单阶段预训+说明调节配方──

A hipótese de alinhamento-devedores é viavel: em relação ao ganho de referência de visão, o InternVL3-8B em referência de texto (((MMLU、GSM8K) perde o número de pontos, em comparação com o Qwen2.5-VL-7B 更少── este modelo é mais parecido com um generalista, porque o treinamento é um único, em vez de dois fragmentos de ortografia──

### InternVL3.5 e InternVL-U

InternVL3.5 ((Agosto 2025) ampliou esta receita.

InternVL-U(2026) aderir à geração unificada, também é em um mesmo espinha dorsal 顶部通过MMDiT heads 输出图像──在这里"U" 代表"Understanding + generation", seguir modelos unificados de estilo Transfusion(Lessão 12.13)──同一个原生-pre-train backbone 同时支持理解和世代头──

### Pre-treinamento nativo

Pre-treinamento nativo Não é gratuito:

- Computação. O custo e o treinamento de um novo VLM para um novo LLM.
- Dados──massas corporações de imagem-texto interligadas 很稀缺──OBELICS Há 141M documentos;MMC4 Há 571M──纯文本可以达到15T tokens──Multimodal pre-training data scarcity is hard约束──
- Base-LLM reutilização. Native pretraining  abandonado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

O nível de dívida de alinhamento é superior à perda de reutilização, pior.


```figure
l5-native-pretrain
```

## Use-o
`code/main.py`É um misturador de treinamento e um simulador de roteador ViR.

- 接收一个目标 corpus mix(%text、%interleaved、%caption、%video),并计算每种方式的预期步骤──
- Em um lote de consultas 上模拟 ViR routing(distribuição: 50% de baixo detalhe ∼ 30% médio ∼ 20% de alto detalhe),并报告平均令牌数量──
-  baseado em codificadores versus LLM FLOPs  relatar estimativas de rendimento de DvD。
- Não é necessário que o nível de formação seja mais elevado do que o nível de formação.

## Entrega-o
本课会产出 `outputs/skill-native-vs-posthoc-auditor.md` determinar um plano de treinamento VLM proposto, que deve ser selecionado nativo ou pós-hoc, marcar o risco de alinhamento-devedores,并推 corpus mix.

## 练习
1. Estimação do delta de computação entre InternVL3-8B (pre-treino nativo) e LLaVA-OneVision-7B (post-hoc) ⋅ GPU-hora proporção aproximadamente é quanto?

2. InternVL3  relatório de proporção é 40% texto / 35% interleaved / 20% legenda / 5% vídeo。 Se o seu objetivo é a tarefa de vídeo-pesado, por favor, propor uma nova proporção,并论证为什么基础模型 仍然需要大量的文字和字幕数据──

3. 阅读MM1.5 Seção 4 中关于忘记的内容――说出后校训练中出现最大回归的确切基准―― essa regressão 损失了多少?

4. O ViR vai enviar 60% do tráfego 路由到低解析度编码──它会误路由哪类查询──在需要高分辨率时发送到低分辨率时? propõe três modos de falha do roteador──

5. O DVD vai destruir a visão e o LLM em diferentes GPUs.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Native multimodal pretraining | "From scratch together" | Text + image + video tokens 从第 1 步开始参与 Loss，而不是之后再接上 |
| Alignment debt | "Post-hoc penalty" | 由把 vision 接到 frozen LLM 上导致的 text skills 和 answer consistency 可测量退化 |
| V2PE | "Variable visual pos encoding" | 每个 modality 的可学习 position encoding allocation；InternVL3 的 M-RoPE 后继方案 |
| ViR | "Resolution router" | 小 classifier，在 encoding 前按 query 选择所需最低 resolution，从而节省 inference tokens |
| DvD | "Decoupled deployment" | Vision encoder 在一个 GPU 上，LLM 在另一个 GPU 上，并通过 stream handoff；可让大型 VLMs 的 throughput 翻倍 |
| InternVL-U | "Unified understanding + generation" | 2026 年后续版本，为 native-pretrain backbone 加入 image-generation heads |
| Interleaved corpus | "OBELICS / MMC4" | 文本和图像按自然阅读顺序排列的 documents；native pretraining 的原材料 |

## 延伸阅读
- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
