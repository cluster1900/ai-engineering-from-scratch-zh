# O oleoduto paralelo à bolha  análise

> Paralelo tensor Colocar a matriz multiplicando-se para várias classes de cima e baixo. Colocar o modelo cortando para várias classes de cima e baixo.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 分钟

## Objectivo de aprendizagem

- Colocar um modelo de ordem desmontado em N 个 estágio e em N 个 rango 上模拟前沿管道。
- Use GPipe 调度(先只做前面 填满,再倒退) Deixe M 个微洗管 过管,并计算泡 比例。
- Com Megatron-LM、PipeDream 调度比较泡
- 论证 fase 分配: cada fase 算力相等, é mais importante que cada fase 参数相等.

## 问题

fp16 下的 70B 参数模型,光参数需要140 GB──没有任何消费级 GPU 装备下──ZeRO-3 会将参数分片分分到各级别,但每一步前进 仍然要让每个级别都聚集 完整一层,每层付出 $\log(N)$跳──pipeline parallel 换一条路:把模型切成 N 个阶段,每个级别 放一个──Layer 1 的前进 在级别 0 做完,把激活张量交付给级别 1;级别 1 跑层 2 再交付给级别 2;以此类推──Retroverse反向流回──内存近似线性下降,因为 cada nível só tem uma fase;计算是串行的,这就是泡泡 问题──

Bubble é um tubo de água 开头的空(等第一微巴赫到最后阶段) 和结尾的空(等最后一个微巴赫 回抽) ⋅ M 个微巴赫、N 个阶段 时, 个阶段的泡 比如是$(N-1)/(M+N-1)$M=8、N=4 时是27%; M=64、N=4 时是4.5%── cada passo de microbatch 越多,bubble 越小, isto significa que cada microbatch é de grandeza de lote 更小

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

### GPipe 调度

Antes de usar todos os M 个 microbatch Colocar o pipeline para frente 填满,再开始任何后退; então反向排空。 cada microbatch deve ser ativado para trás, para que o内存 continue crescendo 线性 M 个周期, atrás 占占 M+N-1 个周期, atrás 占 M+N-1 个个个―― cada fase é válida como 2M 个周期; cada fase é uma bolha é 2(N-1) 个周期―― quando cada vez avança e cada vez para trás, cada vez que ocupa uma unidade de tempo, quando a bolha, por exemplo, é$(N-1)/(M+N-1)$◊把 M 取得远大于N,就能把泡藏起来──

### 1F1B 调度

交错: uma microbatch avança, uma até a última fase, imediatamente começa para trás e deixa-a voltar a correr.

### Por que é importante a cada etapa?

Se estágio 0 precisa de 50 ms, estágio 1 precisa de 100 ms, cada ciclo está em estágio 1 上。 outro estágio Cada ciclo está em vácuo igual a 50 ms, igual a estágio 1 放行。参数相等是错轴:transformer的算力由每层的注意加 MLP 主导,嵌入层参数多但算力少──Stage 分配应按每个阶段的 FLOPs 均衡,而不是按权重数均衡──

### Microbate e lote

Pipeline 跑 M 个、每个大小为 B 的微包――有效批量是 $M \cdot B$◊ um passo de pipeline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       $M \cdot B$个样本的梯度──Bubble 比例取决于M; optimizer sees what $M \cdot B$△调 M,就是在泡 (B) △ M 大则更低) 和每微包内存 (GPipe 下 M 大则激活内存更高) △

```figure
cd-pipeline-bubble
```

## Construí-lo

`code/main.py`实现:

- `PipelineStage`Um pequeno .`nn.Module`, tem um estágio de parametros,并暴露 `forward(activation)`- Não.
- `Pipeline(stages, num_microbatches)`A primeira fase é a de um grupo de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos de grupos.
- `bubble_fraction(num_stages, num_microbatches)`: closed式公式 $(N-1)/(M+N-1)$- Não.
- Uma demonstração em 4 etapas: imprimir em microbatch, bem como a bolha de teste, por exemplo.

运行:

```bash
python3 code/main.py
```

输出: por fase×microbatch de Gantt 图, bem como relativa à bolha de previsão fechada 百分比──

## Práctica no ambiente de produção

Três modos podem tornar o oleoduto paralelo ao nível de endurecimento possível.

**Activation checkpointing 与 pipeline 搭配。**GPipe 上有M 个微巴奇 在飞时,激活内存是单个微巴奇的M 倍──Activação de ponto de cheque em retrospectiva 时重算前, usando cálculos para mudar a memória; 两者结合,长序列上的管道才可行──

**Stage 均衡靠测量，不靠假设。**O grupo de produção irá primeiro executar uma rodada de perfil, testar a capacidade de cálculo real em cada camada de hardware de meta (FLOPs e Wall clock), re-pós-média de resultados de divisão.`--num-layers-per-stage` aceitar a lista, para que cada fase tenha um número de camadas diferentes de cada nível de custo.

**Send/recv 调度必须避免死锁。**Se cada etapa tiver de enviar recovidas, os cursos serão fechados.

## Use-o

O uso em produção:

- **Megatron-LM。**Utilização de 1F1B,并支持 tensor + pipeline + data parallel 组合──
- **DeepSpeed Pipeline。**Com o ZeRO 集成;ZeRO-1 + pipeline é a maior gama de modelos de código aberto.
- **PyTorch Pipe。**PyTorch origin生的 পাইপলাইন 包装,基于 `torch.distributed.pipeline.sync.Pipe`- Não.

## Entrega-o

Seção 80 课把每阶段的参数分片存进分片检查点―― 第 81 课在端到端演示里组合 DDP + ZeRO + pipeline精神 () 

## 练习

1. 实现 1F1B, testing bubble 比例与GPipe 一致,但激活内存有上界──
2. Em um modelo mais profundo, analise a realidade em cada fase do tempo, e em cada fase de reequilíbrio.
3.  através do microbatch do pipeline fazer gradiência acumulada, inspecção gradiência é igual ao preço do lote completo para frente
4. ∆o controlo de ativação do gasoduto 配上, medida do seu volume de memória e redução do seu valor de cálculo
5. Colocar o pipeline em conjunto com o DDP (conjuntos de cada pipeline em conjunto com os dados), e sugerir a segunda dimensão da sua configuração.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Pipeline | “沿深度的模型并行” | 每个 rank 一个 stage，激活逐 stage 流动 |
| Bubble | “Pipeline 空闲时间” | 首尾各 (N-1) 步，部分 stage 没有工作 |
| Microbatch | “Batch 的切片” | 一次 forward/backward 单元；M 增大则 bubble 缩小 |
| GPipe | “先填满再排空” | M 次 forward 全部完成后再 backward；激活内存高 |
| 1F1B | “交错调度” | 每 stage 一次 forward 一次 backward；激活内存有界 |

## 延伸阅读

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- Fase 19 Lição 76 - as primitivas de envio/recovery que o cronograma usa
- Fase 19 Lição 78 - O ZeRO é ortogonal ao oleoduto e muitas vezes combinado
