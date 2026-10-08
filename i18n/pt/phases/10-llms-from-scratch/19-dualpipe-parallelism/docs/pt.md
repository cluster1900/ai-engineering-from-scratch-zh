# Paralelo de DualPipe

> DeepSeek-V3 utiliza 2.048 张 H800 GPUs 训练,MoE especialistas distribuídos em vários nodos.

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05（distributed training、FSDP、DeepSpeed），Phase 10 · 14（open-model architectures 和 MoE）
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Explicar quatro componentes do DualPipe para frente e para trás, e por que cada parte tem sua própria janela de sobreposição.
- 解释大规模下管道泡泡 问题,以及 泡无 在实践中和在营销语境中的区别──
- Hand工跟踪 8 个PP 级别和 16 个微批的双管时间表,并确认前流和反流 会填满彼此的空槽位──
- Explicação de DualPipeV(Sea AI Lab,2025): 取舍:在 Expert Parallelism 不活时,以略大的泡为价格,去掉2x 参数复制──

## 问题
Em 2k H800 GPUs, o modelo 671B MoE vai encontrar três garrafas superpuestas:

1. **内存压力。**Cada GPU tem um modelo de sequência de 8K, 61 camadas, 128 cabeças, a memória de ativação é muito grande.
2. **Pipeline bubbles。**传统管道平行性(GPipe、1F1B) vai deixar GPUs em espera de sua fase de entrada ou Gradiente 时处于空──8 个阶段.
3. **跨节点 all-to-all。**Usando o paralelismo de especialistas, o MoE irá dividir os especialistas em vários pontos. Cada passagem avançada irá desencadear uma vez todos os tokens, para enviar os tokens para os seus especialistas, e depois também irá desencadear outra vez todos os tokens.

Estes problemas têm soluções individuais: memória com controle de gradiente, bolhas de tubo com Zero Bubble ((Sea AI Lab,2023), tudo para todos com kernels de comunicação paralelas de especialistas。DualPipe faz isso para que eles trabalhem em conjunto。 este cronograma está em um único pedaço de frente para trás 内重叠计算和通信, simultaneamente a partir do pipeline 两端注入微批,并用由此产生的时间表将全到所有 藏在计算窗口中。

 relatório Resultado: em DeepSeek-V3 de 14,8T-token  treinamento operacional, bolhas de tubo quase eliminadas, GPU utilization rate superior a 95%。

## 概念
### Paralelo de oleodutos 复习

Desembaraçar um modelo de camada N em um dispositivo P.`i`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `i * N/P .. (i+1) * N/P - 1` um micro-batch do dispositivo 0 a P-1  executar para frente, e depois do P-1 a 0  executar para trás  cada dispositivo só em um dispositivo anterior envia sua saída, para começar a sua própria fase de avanço; também apenas em um dispositivo inferior envia para cima  Gradiente  depois, para começar para trás 

GPipe(Huang et al., 2019) uma vez de uma micro-parcela, isso vai desperdiçar a maior parte do tempo da GPU.

DualPipe é o próximo passo.

### Pensa-se em uma descomposição de pedaços

Cada pedaço para a frente é dividido em quatro componentes:

- **Attention。**Projeções Q/K/V Attenção Projeção de saída
- **All-to-all dispatch。**Enviar tokens para os seus especialistas.
- **MLP。**Especialista em MoE 計算。
- **All-to-all combine。**O que é que se passa com o sistema de comunicação?

Uma parte atrasada irá juntar-se a estas partes Gradient 版本──DualPipe para a sua regulação, fazendo com que tudo para todos despachem com a atenção 计算并行下一个部分,并使所有到所有结合与后续部分的 MLP 计算并行发生──

### 思路 2: programação bidireccional

A maioria dos cronogramas do pipeline, desde o estágio 0, vai para o estágio P-1──DualPipe desde os dois extremos simultaneamente para o micro-batches──Estágio 0 verá micro-batches avançadas a partir de lá; estágio P-1 também verá micro-batches avançadas a partir de lá──

Para conseguir isso, equipamento `i` deve ter simultaneamente uma camada de tubo inicial `i`和 camada de tubo tardia `P - 1 - i` é a parte dual do DualPipe: cada dispositivo mantém duas camadas de modelo que necessita de serviço (uma para cada direção)  Em escala de DeepSeek-V3, é 2x o custo de replicação de parâmetros. É aceitável, pois o Expert Parallelism  já distribuiu os especialistas em MoE muito raramente, duplicando duas camadas não-especialistas não conta com grandes custos

关键在于, uma direcção em frente e outra direcção em retorno, 会恰好在单向时间表 产生泡的位置重叠──泡消失──

### Um cronograma rastreado à mão

考虑 P = 4 filetes、8 micro-partidas,分为 4 个 前进 / 4 个逆转──时间从左到右移动;行是设备级──

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

读取 F4/F5R 这种记法:rank 1 在同一个时间槽中,同时运行微批4 的前面(在管道中从左到右) 和微批5 的前面(从右到左) 这是操作层面的含义双向

Em rank 2 处,交叉流更早重叠; em rank 0 和 P-1 处,它们最晚重叠──在时间表的稳定中阶段,每个级都运行 X 方向向前,并与 Y 方向向后重叠──计算保持忙碌──计算前行的全向传递的全向传递 隐藏在后行 计算中──全向结合 隐藏在前行 计算中──泡泡被挤出──

### Contabilidade de bolhas

标准 1F1B pipeline bubble ((( cada classificação 浪费的时间):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

Zero Bubble  melhoramento irá reduzir-lo, mas não pode baixar para zero. DualPipe em fase de estabilização, se o número de micro-batches pode ser submetido a 2 vezes a profundidade do pipeline 整除, já há zero bolhas.

营销语境中: 泡无──技术语境中:泡 不会随着微批数量增长──Sea AI Lab 的后续分析(DualPipeV / Cut-in-half) indicam que só existem burbujas totalmente zero no Expert Parallelism 不是瓶时才;

### DualPipeV  o refinamento

Sea AI Lab(2025) observou, quando o EP COM se sobrepõe não é de peso, 2x 参数复制是浪费的。 seu cronograma DualPipeV vai dobrar a injeção bidirecional V-shape                                                                                                                                                                                                                                  

取舍如下:

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| 每个设备的参数副本 | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### O que significa o 14.8T-token ?

O DeepSeek-V3 foi desenvolvido em 2.048 张 H800 GPUs, que consumiu 14,8T de tokens, cerca de 2,8M de horas de GPUs. Se usarem 1F1B simples, eles perderão 12 a 15% das bolhas de pipeline, ou seja, 340 a 420K de horas de GPU, o suficiente para treinar um modelo completo de 70B. DualPipe recuperou a maior parte deles. Não há registro interno, é muito difícil quantificar diretamente sua contribuição, mas a declaração no artigo é que a média de utilização de GPUs é superior a 95%.

Para um funcionamento menor (menos de 1k GPUs), DualPipe algumas bolhas de tubo em relação ao custo total são menores, e o treinamento de modelo denso é muito pouco utilizado para todos os sistemas.

### Está na posição central da pilha

- Com**FSDP**(Fase 10 · 05)互补──FSDP vai dividir os parâmetros do modelo para as fileiras 上;DualPipe 调度 ranks 上的计算──二者可以结合──
- Com**ZeRO-3**gradiente de fragmentação 兼容──两份副本复制的会计管理 需要与 ZeRO 配合──
- 需要针对具体集群拓学 调优的 **custom all-to-all kernels**❖ Os kernels de código aberto do DeepSeek são um referência para a implementação.


```figure
expert-capacity
```

## Use-o
`code/main.py`É um simulador de cronograma de pipeline.`(P, n_micro_batches, schedule)`,并印 1F1B、Zero Bubble、DualPipe 和 DualPipeV de utilização de fase estável em si mesma── é uma ferramenta de ensino: números e afirmações definitivas no artigo concordam, mas não são declarações sobre a produção de experiências aceleradas──

O valor deste simulador está em: usar diferentes P e micro-parcela contas  executar, observar 1F1B fração de bolha  como crescer, enquanto DualPipe                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

O que fazer para fazer isso?

- 选择一个能被你的微批数 整除的管道-paralelo profundidade。
- 确保你的专家-parallel mesh 支持双向的所有-to-all──DeepSeek 的核心是参考──
- A primeira vez que se realiza, o esperado está no cronograma.
- Monitorar a utilização de GPU de cada nível, não apenas a utilização geral.

## Entrega-o
本课会生成 `outputs/skill-dualpipe-planner.md` determinar uma especificação do cluster de treinamento (GPU), que irá apresentar uma estratégia de paralelismo de pipeline, um algoritmo de programação que deverá ser utilizado, bem como uma fração de bolha de previsão sob a escala do objetivo.

## 练习
1. Em`(P=8, micro_batches=16, schedule=dualpipe)`和 `(P=8, micro_batches=16, schedule=1f1b)`上运行 `code/main.py`△ calcular a utilização de GPU 差异,并将其表示为每百万训练代币回收的 GPU-hours──

2. Manual de desenho`(P=4, micro_batches=8, schedule=dualpipe)`A tabela de cronograma é feita com o ID do micro-batch e a direção para marcar cada buraco de tempo.

3. 阅读DeepSeek-V3 relatório técnico(arXiv:2412.19437) 图 5──找出 DualPipe forward piece 中全到全发送的重叠窗口──解释计算时间表 如何隐藏它──

4. 計算 DualPipe para um modelo 70B denso de P=8 fases de oleoduto, bem como para um modelo 671B MoE de P=16 fases de oleoduto, 2x 参数开销――说明为什么MoE 情况下开销比例较小的(A maioria dos参数 são especialistas, e são divididos em grandes grupos EP 上) ⋅

5. Para comparar, utilizar o artigo Secção 3.4  Como referência, encontrar DualPipe  adicionado enquanto que Chimera                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline bubble | “每个 rank 的空闲时间” | pipeline stage 等待其输入或 Gradient 时浪费的 GPU cycles |
| 1F1B | “默认 pipeline schedule” | one forward / one backward 交错调度；DualPipe 击败的 baseline |
| Zero Bubble | “Sea AI Lab 2023” | 将 backward 拆成 B（input Gradient）和 W（weight Gradient）；几乎完全收紧 pipeline |
| DualPipe | “DeepSeek-V3 schedule” | bidirectional pipeline + compute-comm overlap；bubbles 不随 micro-batch count 增长 |
| DualPipeV | “Cut-in-half” | V-shape 改进版，以略大的 bubbles 为代价去掉 2x 参数复制 |
| Chunk | “pipeline work 的单位” | 一个 micro-batch 通过一个 pipeline stage 的 forward 或 backward pass |
| All-to-all dispatch | “把 tokens 发送给 experts” | 将 tokens 路由到其分配的 MoE experts 的跨节点通信 |
| All-to-all combine | “把 expert outputs 带回来” | MLP 之后收集 expert outputs 的跨节点通信 |
| Expert Parallelism (EP) | “Experts across GPUs” | 将 MoE experts 分片到 ranks 上，使不同 GPUs 持有不同 experts |
| Pipeline Parallelism (PP) | “Layers across GPUs” | 将 model layers 分片到 ranks 上；DualPipe 调度的维度 |
| Bubble fraction | “浪费的 GPU 时间” | (bubble_time / total_time)；DualPipe 推向零的比例 |

## 延伸阅读
- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437)                                                                                                                                                                                                                                                              
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) implementação de referência de código aberto, contendo DualPipeV
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) Zero Bubble 前身
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63)  influenciar o modo de EP-off do DeepSeek  análise
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) DualPipe comparado com 1F1B
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) Parallelismo de oleodutos primitivos 论文和泡泡 问题
