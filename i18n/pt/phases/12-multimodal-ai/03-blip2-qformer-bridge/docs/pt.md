# Desde CLIP até BLIP-2  Q-Former  como ponte de modalidade

> CLIP para imagens e texto, mas não pode gerar legendação, responder a problemas ou realizar diálogos. BLIP-2 (Salesforce, 2023) resolveu esse problema com um pequeno treinamento de ponteiros: 32 个学习可用桥接: 32 个学习可用桥接: 32 个学习可用桥接: 32 个学习可用桥接: 32 个学习可用桥接: 32 个学习可用桥接: 32 个学习可用桥接: 32 个学习可用桥接: 32 个学习可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 32 个可用桥接: 个接: 个接: 个接: 个接: 个接: 个接: 个接: 个接: 个接: 个接: 个接: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个: 个

**Type:** Build
**Languages:** Python (stdlib, cross-attention + learnable-query demo)
**前置要求:**Fase 12 · 02 (CLIP), Fase 7 (Transformadores)
**Time:** ~180 minutes

## Objectivo de aprendizagem
- Explicação de por que colocar um frágil encomador de visão congelado e um LLM congelado entre um encomedor de visão congelado e um LLM congelado é melhor do que o end-to-end fine tuning em termos de custo e estabilidade.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- 走读 BLIP-2 的两阶段预训练:representação (ITC + ITM + ITG), então gerativa(usando decodificador congelado de perda de LM)。
- Comparar Q-Former com o projeto MLP mais simples usado no LLaVA 并论证各自何时更占优──

## 问题
Você tem um ViT congelado, ele produz 256 patches de imagem por imagem de dim 1408 Token. Você tem um patch de 7B LLM congelado, ele espera que um token de dim 4096 seja incorporado.

A questão do BLIP-2 é: será que pode reduzir a representação de imagem com 256 tokens para um número menor de tokens (por exemplo 32), ao mesmo tempo em que mantém informações suficientes, para que o LLM possa gerar imagens com legendas e responder a questões e fazer raciocínio?

答案是:Q-Former──32 个可学习的"query" Vector,对ViT的补丁符号做交叉参加,生成一个32Token的视觉摘要为LLM使用──总计188M 参数──在接触LLM 之前,先用对比性、匹配和生成目标 训练──

## 概念
### Questões que podem ser aprendidas

Técnicas principais do Q-Former: não deixar o LLM de texto Token para se concentrar em patches de imagem, mas introduzir um novo conjunto de 32 vectores de consulta que podem ser aprendidos `Q`,并让*它们*关注图像补丁──这些查询是模型参数它们在训练期间学习,并且同一组 32查询用于每张图像──

                                                                                                                                                                                                                                                              

### Arquitetura

Q-Former é um transformador pequeno ((12 层, cerca de 100M params),

1. Pergunta caminho:32 个 query Vector 流经自注意(彼此之间), então sobre o parche congelado ViT Token fazer atenção cruzada, finalmente atravessou FFN。
2. Caminho de texto: um codificador de texto similar a BERT com o caminho de consulta 共享自我注意 和 FFN weights──text path 禁用横断注意──

訓練時兩条路径都会运行──questions 和文本通過共享自我注意 交互, isto significa que, em tarefas que necessitam de texto (ITM、ITG), as perguntas podem ser condicionadas a texto──VLM 交互的推断 阶段, apenas deixe que as perguntas fluam, produzindo 32 Token visuais──

### Formação em duas fases

BLIP-2 分两阶段预训练:

Fase 1: aprendizagem de representação ((无 LLM)。三种损失:
- ITC (imagem-texto contrastivo): contrastivo de estilo CLIP,作用于 pooled query Token 和 text CLS Token。
- ITM (imagem-texto de correspondência):clasificador binário  这对图像-text 是否匹配?
- ITG (Generação de texto baseado em imagem): cabeçalho LM causal no texto, em consultas 为条件――迫使查询 编码可由文本生成的内容――

Apenas treinar Q-Former。 ViT é congelado。 sem LLM  participar。

Fase 2: aprendizagem gerativa. Adentrar um LLM congelado.

Fase 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

### Economia de parâmetros

BLIP-2 Utilize ViT-g/14(1.1B, congelado) + OPT-6.7B(6.7B, congelado) + Q-Former(188M, treinado) = 总计 8B, treinamento 188M。Q-Former 本身约为完整堆积 参数的 2.4%── treinamento custo também体现这一点:少量 A100 上训数天,而不是结尾训数周──

质量:BLIP-2 在零射VQA 上达到或超过 Flamingo-80B,同时体量小 50 倍──这个桥接有效──

### Instrução BLIP e instrução感知型 Q-Former

InstructBLIP (2023) Usando um extra-输入 expandido Q-Former:instruction text 本身──在交叉注意时,查询 现在可以访问图像补丁和指示──查询可以根据指示 专门化("contar os carros"、"descrever o humor"),而不是学习单个固定摘要──在举办任务上基准 提升──

### MiniGPT-4 com abordagem apenas de projector

MiniGPT-4 mantém o Q-Former, mas apenas treina a projeção linear, ao mesmo tempo que termina com todas as outras partes.

### Por que a LLaVA foi mais simples

LLaVA(2023,Lessão 12.05) substituiu o MLP de 2 camadas comum por Q-Former, que irá projetar cada parche ViT para o LLM 空间  para 24x24 网格, cada imagem 576 个 Token, todas são introduzidas no LLM.

Até 2026, os domínios aparecerão: Q-Former em cenários importantes de orçamento de tokens; MLP projector ocupa a maior parte dos cenários prioritários em cada token.

### A atenção cruzada: Flamingo, este ancestral

Flamingo(Lessão 12.04) Antes do BLIP-2, usou a mesma atenção cruzada 思路, mas ocorre em cada camada LLM congelada, em vez de como um único ponte. BLIP-2 mostra que você só pode comprimir para a camada de entrada, ainda válido.

### Os descendentes de 2026

- Q-Ex:BLIP-2、InstructBLIP、MiniGPT-4, bem como a maioria dos casos de vídeos em que o orçamento do Token é usado.
- Re-estampilador do perceptor:Flamingo 的变体(Lessão 12.04);Família Idefics、Eagle、OmniMAE。
- Projector MLP:LLaVA、LLaVA-NeXT、LLaVA-OneVision、Cambrian-1。
- Poço de atenção:VILA、PaliGemma。

Quadridodo válido. O problema decisivo é se você está limitado ao orçamento do token, ou se ele está limitado à qualidade por token.


```figure
modality-projection
```

## Use-o
`code/main.py`Construir uma atenção transversal no estilo Q-Former:

1. 模拟 256 个 image patch Token ((dim 128) 』
2. 实例化 32 个可学习的查询 (questionadas com aprendizagem)
3. 运行 escalado-pontos-produto atenção cruzada ((Q de consultas, K/V de patches)
4. 通過線形層 投影到 LLM-dim ((512) ⋅
5. 输出 32 个 LLM-ready visual Token──

Todas as matemáticas usam Python puro (~) e vector (~) usando loops aninhados (~) e toys (~) mas forma (~) é exacta (~) e imprimem Matrix de peso de atenção (~) para que possa ver cada consulta de quais parches (~)

## Entrega-o
本课生成 `outputs/skill-modality-bridge-picker.md` fornecer um objetivo VLM 配置(vision encoder Token 数、LLM context budget、部署约束、质量目标), ele irá recomendar Q-Former vs MLP vs Perceiver resampler, e fornecer um motivo breve bem como uma estimativa de parâmetros de cada tipo de ponte。

## 练习
1. Utilize PyTorch  realçar bloqueio de atenção cruzada.

2. Em BLIP-2, fase 1, Q-Former 同时运行三种损失:ITC、ITM、ITG── usando pseudocód 写出每种的前进签名── qual dos dois requer um encoder de texto que está ativo?

3. Comparar: Q-Former (Q-Former) 12 Layer,768 Hidden) vs 2 Layer MLP projector (Q-Former) 1408 → 4096, dos Layer)

4. 阅读 BLIP-2 paper(arXiv:2301.12597) Seção 3.2, compreender Q-Former 如何初始化──解释为什么从BERT-base初始化(而不是随机初始化) 会加速收──

5. Para um vídeo de 10 minutos, em 1 FPS 采样到60 ,计算每 Token 成本:(Q-Former → 32 tokens/frame) vs (MLP projector → 576 tokens/frame) ―― qual um pode colocar em 128k-Token LLM context window?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Q-Former | "Querying transformer" | 带有 32 个可学习 query Vector 的小型 transformer，对 frozen ViT features 做 cross-attend |
| Learnable queries | "Soft prompt for vision" | 一组固定参数，作为 cross-attention 的 query 侧；按模型学习，在所有输入之间共享 |
| Cross-attention | "Q from here, K/V from there" | query、key、value 来自不同来源的 Attention；queries 从 ViT patches 拉取信息的方式 |
| ITC | "Image-text contrastive" | 应用于 Q-Former pooled queries vs text CLS 的 CLIP-style loss |
| ITM | "Image-text matching" | 在 hard-negative-mined pairs 上的 binary classifier；迫使 queries 区分细粒度不匹配 |
| ITG | "Image-grounded text generation" | 文本以 queries 为条件生成时的 causal LM loss；迫使 queries 编码 text-decodable content |
| Two-stage pretraining | "Representation then generative" | Stage 1 单独训练 Q-Former（ITC/ITM/ITG）；Stage 2 接入 frozen LLM，并且只训练 projection + Q-Former |
| Frozen backbone | "Do not finetune" | vision encoder 和 LLM weights 固定；只训练 bridge |
| Projection head | "Linear to LLM dim" | 将 Q-Former 输出映射到 LLM Embedding dimension 的最终 linear layer |
| Perceiver resampler | "Flamingo's version" | 类似的 learnable-query cross-attention，由 Flamingo 在每一层使用，而不是作为单个 bridge |

## 延伸阅读
- [Li et al. — BLIP-2 (arXiv:2301.12597)](https://arxiv.org/abs/2301.12597) 核心文件──
- [Li et al. — BLIP (arXiv:2201.12086)](https://arxiv.org/abs/2201.12086) 使用 ITC/ITM/ITG 三件套的前身──
- [Li et al. — ALBEF (arXiv:2107.07651)](https://arxiv.org/abs/2107.07651) "align antes de fusão"  estágio 1 treinamento concept ancestor。
- [Dai et al. — InstructBLIP (arXiv:2305.06500)](https://arxiv.org/abs/2305.06500) instrução-consciente Q-Former。
- [Zhu et al. — MiniGPT-4 (arXiv:2304.10592)](https://arxiv.org/abs/2304.10592)                                                                                                                                                                                                                                                              
- [Jaegle et al. — Perceiver IO (arXiv:2107.14795)](https://arxiv.org/abs/2107.14795) A estrutura geral da atenção cruzada entre as questões de aprendizagem e de consulta.
