# Profundos-V3 架构讲解

> A fase 10 · Lição 14  nomeou cada modelo aberto como um conjunto de seis arquiteturas ajustadas. DeepSeek-V3 🏻 12 de janeiro de 2024,                                                                                                                                                                                                                                          

**类型：**- aprendizagem
**语言：**Python(stdlib,参数计算器)
**先修要求：**Fase 10 · 14(open model讲解) 、Fase 10 · 17(NSA) 、Fase 10 · 18(MTP) 、Fase 10 · 19(DualPipe)
**时间：**Cerca de 75 minutos

## Objectivo de aprendizagem

- De cima para baixo ler Configuração DeepSeek-V3, e usou seis GPT-2 旋加四 DeepSeek 特有新增项来解释每个字段──
- 推导总参数(671B)、活跃参数(37B), bem como suas respectivas componentes。
- 計算 128k context 下 MLA's KV cache 占用,并与一个活跃参数相同、使用 GQA's dense model 需要付出的价格进行比较──
- Em um comunicado publicado em 16 de janeiro de 2012, o Instituto de Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesquisa em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada em Pesada.

## 问题

DeepSeek-V3 é a primeira estrutura em que existe uma diferença de substância entre a família de Llama e o modelo aberto. Llama 3 405B é o primeiro a regular o GPT-2. DeepSeek-V3 é o GPT-2 com todas as seis rotas, mais uma vez, é o primeiro a integrar quatro rotas.

Aprender a sua vantagem é: DeepSeek-V3 de pesos abertos  Publicar alterou o significado da capacidade de fronteira no modelo aberto . Esta estrutura é uma das muitas corridas de treinamento de 2026 .

## 核心概念

### Não mudou o núcleo, mais uma vez.

DeepSeek-V3  ainda é autoregressivo── ainda é um bloco de decodificador empilhado── cada bloco  ainda é um bloco de atenção, mais MLP, mais dois RMSNorm── ainda é um bloco de MLP em que ainda é usado o SwiGLU── ainda é um bloco de RoPE──Pre-norma── ainda é um bloco de código aberto.

### 转折:用 MLA 取代 GQA

A partir da Fase 10 · 14 Você já sabe, GQA 通過讓多组 Q heads 共享 K 和 V 来缩小 KV cache──Multi-Head Latent Attention(MLA) 更进一步:K 和 V 被压缩到一个共享的低排的潜伏表示(`kv_lora_rank`), então em cálculo por cabeça 解压──KV cache apenas armazenado latente, geralmente é por token Cada camada 512 个浮点数, em vez de 8 x 128 = 1024 个浮点数──

Em contexto de 128k, use DeepSeek-V3 de MLA, para cada token, cada camada, um compartilhamento latente.`c^{KV}`;K 和 V são através de projeção de alta a partir deste latente 派生, enquanto estas projeções de alta podem ser absorvidas para o matmul posterior):

```
kv_cache = num_layers * kv_lora_rank * max_seq_len * bytes_per_element
         = 61 * 512 * 131072 * 2
         = 7.6 GB
```

Uma hipóteses de GQA 基线(Llama 3 70B 形,8 KV cabeças, cabeças dim 128) precisa:

```
kv_cache = 2 * 61 * 8 * 128 * 131072 * 2
         = 30.5 GB
```

Em contexto de 128k, MLA é menor do que Llama-3-70B.

权衡是:MLA 计算时增加一步按头的解压――额外计算量相对省的带宽很小――对长背景 推理说,净收益为正――

### Roteamento:equilíbrio de carga sem perda auxiliar

Os roteadores do MoE decidem cada token por alguns dos principais especialistas em processamento. Roteadores simples vão concentrar muito trabalho em poucos especialistas, levando a outros especialistas a colocar.

DeepSeek-V3 introduziu um tipo de programa auxiliar sem perda.`e`- Não, não.`bias_e`Se a carga for insuficiente, aumenta-a. Não adicione extra perdas.

Efeito da perda de capital: não pode ser medido.

### MTP: mais intenso treinamento + 免费草案

A partir da fase 10 · 18 você já sabe, DeepSeek-V3  aumentou o módulo MTP de D=1, para ser usado para prever os dois tokens de posições seguintes.

参数: em 671B principal 之上增加 14B──开销:2.1%──

### 训练:DualPipe

A partir da fase 10 · 19 Você já sabe, DualPipe é uma forma de pipeline bidirecional, que irá avançar e retroceder com os pedaços de todo-a-todo 通信重叠── em DeepSeek-V3 2.048-H800 尺度, ele aproximadamente retrocede 1F1B original reunião por causa de bolhas de pipeline 损失的245k GPU-hours──

### Config,逐字段解析

A versão em baixo é a configuração do DeepSeek-V3:

```
hidden_size: 7168
intermediate_size: 18432   (dense MLP hidden size, used on first few layers)
moe_intermediate_size: 2048 (expert MLP hidden size)
num_hidden_layers: 61
first_k_dense_layers: 3    (first 3 layers use dense MLP)
num_attention_heads: 128
num_key_value_heads: 128   (formally equal to num_heads under MLA, but
                           the real compression is in kv_lora_rank)
kv_lora_rank: 512          (MLA latent dimension)
num_experts: 256            (MoE expert count per block)
num_experts_per_tok: 8      (top-8 routing)
shared_experts: 1           (always-on shared expert per block)
max_position_embeddings: 163840
rope_theta: 10000.0
vocab_size: 129280
mtp_module: 1               (1 MTP module at depth 1)
```

解析如下:

- `hidden_size=7168`: Implantação 维度。
- `num_hidden_layers=61`O que é que se passa?
- `first_k_dense_layers=3`:前3个块 使用大小为18432 的密集 MLP──其余58个使用 MoE──
- `num_attention_heads=128`- Não. - Não.
- `kv_lora_rank=512`K 和 V é comprimido para esta dimensão latente, não pressão de cabeça.
- `num_experts=256, num_experts_per_tok=8`Cada bloco MoE tem 256 especialistas, usando o top-8 routing.
- `shared_experts=1`Além dos 256 especialistas enviados, há um especialista sempre em cada token contribuindo para o output.
- `moe_intermediate_size=2048`Cada especialista tem um tamanho oculto de MLP. É mais denso do que o MLP.

### 参数核算

完整计算在 `code/main.py`Centro: conclusão central:

- Embarcação:`vocab * hidden = 129280 * 7168 = ~0.93B`- Não.
- Antes de 3 blocos densos:带 MLA 的注意(per bloco 约144M) + denso MLP(per bloco 约260M) + normas。总计约1.2B。
- 58 blocos de MoE:带 MLA 的注意(约144M) + 256 专家(每约30M) + 1 专家共享(30M) + norma──按包含所有专家 计算,每块 总计约7.95B──58 专家共计 461B──
- MTP módulo:14B:

总计:core architecture 约476B + 14B MTP;而已发布的671B 数字还会单独计入额外结构参数(tensores de viés, componentes específicos de especialistas, escalação de especialistas compartilhada, etc.) ⋅ Nós vemos os números existentes no calculador com a diferença entre os valores publicados em 3 a 5% dentro, diferença de DeepSeek 报告 Section 2 apêndice 中记录的细粒度核算──

Para frente de cada vez active parameter:

- Atenção: cada camada 144M * 61 = 8,8B
- MLP ativo:前 3 層密度(3 * 260M = 780M),58 个 MoE layers 中每层激活 8 个路由 + 1 个共享 +路由过费――每层活 MLP 约 260M──总计:3 * 260M + 58 * 260M = ~15.9B──
- Embebimento + normas:1.2B。
- 总活跃: aproximadamente 26B núcleo + 14B MTP(trenagem时使用,但推理时不总是运行)≈ 37B。

### 671B / 37B Por exemplo

18 vezes mais raro proporção (((parâmetros activos é 5,5%) de total parâmetros;;DeepSeek-V3 é já publicado mais raro de pesos abertos de frente do modelo MoE;;Mixtral 8x7B proporção é 13/47;;28%), deve ser denso 得多;;Llama 4 Maverick proporção é 17B/400B;;4.25%), comparado a isso equivalente;;DeepSeek apostou: em frente da escala, mais especialistas adicionam menor porcentagem de ativação, vai trazer melhores resultados na qualidade de cada FLOP;;

### DeepSeek-V3 posição

| 模型 | 总参数 | 活跃参数 | 比例 | Attention | 新想法 |
|-------|------|-------|-------|-----------|-------------|
| Llama 3 70B | 70B | 70B | 100% | GQA 64/8 | — |
| Llama 4 Maverick | 400B | 17B | 4.25% | GQA | — |
| Mixtral 8x22B | 141B | 39B | 27% | GQA | — |
| DeepSeek V3 | 671B | 37B | 5.5% | MLA 512 | MLA + MTP + aux-free + DualPipe |
| Qwen 2.5 72B | 72B | 72B | 100% | GQA 64/8 | YaRN 扩展 |

### 后续: R1、V4

DeepSeek-R1(2025) é uma vez executada no V3 spine 上 para realizar o raciocínio-treinamento. R1 utiliza a mesma estrutura. A mudança é a receita pós-treinamento.

DeepSeek-V4 (se publicar) prevê manter MLA + MoE + MTP,并加入 DSA (DeepSeek Sparse Attention), é a fase 10 · 17 na NSA.


```figure
moe-routing
```

## Use-o

`code/main.py`É especialmente adaptado para DeepSeek-V3 形状参数计算器──运行它,将输出与论文中的数字进行比较,并用它测试假设变体(256 especialistas vs 512、top-8 vs top-16、MLA rank 512 vs 1024)。

需要关注:

- 总参数 vs 已发布的671B──
- 活参数对已发布的37B──
- O contexto de 128k, em baixo, é o comparativo entre MLA e GQA.
- Por camada de desmantelamento, para observar os parâmetros orçamento real flores em onde.

## Entrega-o

本课会生成 `outputs/skill-deepseek-v3-reader.md` Dado um modelo da família DeepSeek (((V3、R1, ou qualquer futuro variação), ele gerará uma estrutura de cada componente, nomeará cada segmento da configuração, por componente, e identificará o modelo usando quatro DeepSeek especiais e inovações.

## 练习

1. 运行 `code/main.py` Comparar as estimativas de parâmetros gerais do calculador com as 671B publicadas, e identificar as diferenças provenientes do qual.

2. Modificar a configuração, transformar o ranking do MLA de 512 para 256k.

3. Comparar DeepSeek-V3 de ((256 especialistas,top-8)routing com uma suposição de ((512 especialistas,top-8) variação;;

4. 阅读DeepSeek-V3 technical report ((arXiv:2412.19437) Seção 2.1 关于MLA的内容──用三句话解释为什么K 和 V 的解压矩阵可以在推理效率上被吸收到后续matmul中──

5. DeepSeek-V3 para a maioria das operações usando treinamento FP8― calculado com FP8 vs BF16  armazenamento de 671B pesos― Relaciona-se com o orçamento de treinamento de tokens 14.8T?

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| MLA | “Multi-Head Latent Attention” | 将 K 和 V 压缩到共享低秩 latent（kv_lora_rank，通常为 512），并按 head on-the-fly 解压；KV cache 只存储 latent |
| kv_lora_rank | “MLA compression dim” | K 和 V 共享 latent 的大小；DeepSeek-V3 使用 512 |
| First k dense layers | “早期 layers 保持 dense” | 前几个 MoE-model layers 跳过 MoE router，并运行 dense MLP 以提高稳定性 |
| num_experts_per_tok | “Top-k routing” | 每个 token 会触发多少个 routed experts；DeepSeek-V3 使用 8 |
| Shared experts | “Always-on experts” | 无论 routing 如何都会处理每个 token 的 experts；DeepSeek-V3 使用 1 |
| Auxiliary-loss-free routing | “Bias-adjusted load balance” | 在训练期间调整按 expert 的 bias 项，以在不添加 Loss 项的情况下保持 expert 负载均衡 |
| MTP module | “额外 prediction head” | 从 h^(1) 和 E(t+1) 预测 t+2 的 Transformer block；更密集训练，免费的 speculative-decoding draft |
| DualPipe | “Bidirectional pipeline” | 将 forward/backward 计算与跨节点 all-to-all 重叠的 training schedule |
| Active parameter ratio | “Sparsity” | active_params / total_params；DeepSeek-V3 达到 5.5% |
| FP8 training | “8-bit training” | 使用 FP8 存储训练数据，并在许多 compute ops 中使用 FP8；相比 BF16 大约内存减半，质量代价很小 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report（arXiv:2412.19437）](https://arxiv.org/abs/2412.19437)  Completa estrutura  treinamento e resultados
- [Hugging Face 上的 DeepSeek-V3 model card](https://huggingface.co/deepseek-ai/DeepSeek-V3) config 文件与部署说明
- [DeepSeek-V2 paper（arXiv:2405.04434）](https://arxiv.org/abs/2405.04434) 引入 MLA's前身模型
- [DeepSeek-R1 paper（arXiv:2501.12948）](https://arxiv.org/abs/2501.12948) 基于 V3 架构的推理培训 后继模型
- [Native Sparse Attention（arXiv:2502.11089）](https://arxiv.org/abs/2502.11089) Profundos Buscar Família Atenção de Futuro Direcção
- [DualPipe repository](https://github.com/deepseek-ai/DualPipe) Referência ao calendário de formação
