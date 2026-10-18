# 管道并行和气泡分析

> 张量并行性将矩阵乘法跨等级分化――管道并行性将模型跨等级分化,每个等级一个阶段――微批次流经管道――开始和结束的空时间就是泡;最小化它是整个过程――

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 19 期 Track C 课程 42-49
**Time:** ~90 分钟

## Objectivo de aprendizagem

- Se o modelo de ordem for dividido em N 个阶段, e se elevará para um tubo de direção anterior de N 个等级.
- Utilize GPipe 计划通过管道安排 M 个微批次(仅向前填充,然后向后)并计算气泡分数──
- Comparar a bolha com Megatron-LM e PipeDream
- Defender a distribuição de fases: o número de parâmetros de cada fase é mais importante do que o número de fases de cada fase.

## 问题

O modelo de parâmetros 70B no fp16 precisa apenas de parâmetros de 140 GB. Nenhum GPU de consumo pode suportá-lo.$\log(N)$︎ O tubo é executado através de diferentes rotas: ︎ o modelo é cortado em N 个阶段, e colocado em cada nível em um estágio. ︎ O primeiro nível é executado em 0 ︎, ︎ o primeiro nível é executado em 2 ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎, ︎

气泡是管道开始时(等第一微批到最后阶段) 和结束时(等最后微批回流) 的空时间──对于M 个微批和N 个阶段,每阶段的气泡分数为 (N-1) /(M+N-1)──当M=8、N=4时,即27%.──当M=64、N=4时,为4.5%──当M=64、N=4时,即4.5%──当每阶段有很多微批时,气泡就会缩小,这意味着每微批批的批次大小小小小小,驱动器批次设计的约.──

## 概念

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe 时间表

Antes de começar qualquer operação posterior, use todos os M 个微批次向前填充管道; então reverso向倒流. Cada micro lote de ativação deve ser mantida até o futuro, de modo que o内存 cresça linearmente.

### 1F1B 时间表

交错: assim que os pequenos lotes de avanços chegam à fase final, vamos começar a sua posterior direção e deixá-los fluir de volta.

### Por que é importante calcular a igualdade de cada fase

Se a fase 0  precisa de 50 ms, a fase 1  precisa de 100 ms, então cada ciclo está na fase 1 上门控。 outros estágios cada ciclo está em vácuo  50 ms, espera a fase 1 释放。 o mesmo número de parâmetros é o eixo errado: o cálculo do transformador é principalmente orientado pela atenção adicionada a cada nível MLP, enquanto o nível embuxado tem muitos parâmetros, mas a quantidade de cálculo é muito pequena。 a distribuição de estágios deve equilibrar o FLOP de cada etapa, e não o peso de cada etapa.

### Micro e lote

管道运行 M 个微批次,每个微批次的大小为 B。有效批次大小为 M*B。管道步骤结束时的梯度是组合 M*B示例的梯度。气泡分数取决于 M;优化器看到的是 M*B──调整 M significa que vai burburar(M 值较低) com cada pequena批次内存(GPipe 激活内存值较高,M 值较高) realizar transações。


```figure
cd-pipeline-bubble
```

## Construí-lo

`code/main.py`实现:

- `PipelineStage`Um pequeno .`nn.Module`, preservar um estágio de parâmetros e abrir`forward(activation)`- Não.
- `Pipeline(stages, num_microbatches)`: usar cada fase de simulação pendurado em simulação fase em GPipe 时间表──
- `bubble_fraction(num_stages, num_microbatches)`O que é o "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de "Colour" de " "Colour" é " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " "
- 4 fase de demonstração, impressão de cada pequeno lote de linhas e de quantidade de bolhas de medição.

- Não .

```bash
python3 code/main.py
```

输出: gradual e por porção de gás e porção de bolhas em relação à previsão fechada.

## 野外生产模式

Três modos de endurecimento de tubos para transporte

**激活检查点与管道配对。**Quando o GPipe 上运行 M 个微批次时, a memória activa é uma memória de um pequeno lote de M 倍次;; o ponto de inspeção activa é recalculado no tempo posterior para calcular a memória de troca; essa combinação permite que o tubo possa processar longas sequências;;

**阶段平衡是测量出来的，而不是假设的。**O grupo de produção executa um processo de análise, mede cada camada de cálculo real do hardware do objetivo (FLOP 和挂钟), e depois faz uma divisão de acordo com os resultados da medição.`--num-layers-per-stage`                                                                                                                                                                                                                                                              

**发送-接收调度必须避免死锁。**Cada fase está em linha de recepção, fechamento e envio de tubos.

## Use-o

Modelo de produção:

- **Megatron-LM。**Referência para as operações de tráfego de grande escala. Adopção 1F1B, apoio à quantidade de tráfego de dados + tráfego de dados
- **DeepSpeed Pipeline。**Com o ZeRO 集成; o ZeRO-1 + 管道 é o maior conjunto de modelos abertos.
- **PyTorch Pipe。**PyTorch 原生管道包装器, baseada em `torch.distributed.pipeline.sync.Pipe`Construção.

## 发货

Seção 80 课将每阶段参数分片存储在分片检查点中. Seção 81 课在端到端演示中组成了DDP + ZeRO + 管道 (DDP + ZeRO + 管道) 本质上;演示在运行时保持管道模拟) 

## 练习

1.  Realizar 1F1B  Não verificar a quantidade de bolhas  com GPipe , mas ativar 
2. Em modelos mais profundos, analise cada fase do tempo real, e passe a fase de reequilíbrio das pendências de medição.
3. Adicionar a acumulação de gradientes de pequenos lotes de tubos, e verificar se a gradiência é igual à equivalência de todos os lotes de gradientes de direcção anterior.
4. O conjunto de tubos e pontos de inspeção ativados, e a redução da memória e a relação entre custos de cálculo e medição.
5. • Capacitação de cada nível de tubos em dados e em conjunto com o DDP

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|----------------|------------------------|
|管道| “模型沿深度平行” |每个等级一个阶段，激活逐级流动|
|泡泡| “管道空闲时间”|开始+结束时的 (N-1) 个步骤，其中某些阶段没有工作 |
|微批次| “批次切片”|前进/后退各1个；随着 M 的增大，气泡会缩小 |
| G管道| “填充然后排水” |所有 M 都在任何后退之前前进；高激活记忆|
| 1F1B | “交错时间表” |每级一前一后；有界激活记忆|

##  weiterlesen

- [Huang 等人，GPipe：巨型神经网络的高效训练](https://arxiv.org/abs/1811.06965)
- [Narayanan 等人，PipeDream：DNN 训练的广义管道并行性](https://arxiv.org/abs/1806.03377)
- [Megatron-LM 管道并行文档](https://github.com/NVIDIA/Megatron-LM)
- 第19 阶段 第76 课 - 调度使用的发送/接收原语
- No 19 阶段 No 78 课 - ZeRO e os canais estão em contacto regular e se compõem
