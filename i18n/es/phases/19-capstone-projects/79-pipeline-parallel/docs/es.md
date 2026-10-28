# Paralelo del oleoducto con la burbuja  análisis

> Paralelamente tensor Colocar la matriz multiplicada a varios rango arriba. Colocar el modelo cortado a varios rango arriba, cada rango una etapa.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 分钟

## El objetivo del aprendizaje

- Colocar un modelo ordenado desmontado en N 个 etapa y en N 个 rango 上模拟前沿管道。
- Usar GPipe 调度(先只做前满,再倒退) hacer M 个微洗管 过管,并计算泡 比如──
- Con Megatron-LM、PipeDream 调度比较泡
- 论证阶段 分配: cada etapa 算力相等, es más importante que cada etapa 参数相等.

##  problemas

fp16 下的 70B 参数模型,光参数需要140 GB──没有任何消费级GPU 装备下──ZeRO-3 会将参数分片分分到各级别,但每一步前进 仍然要让每个级别都聚集 完整一层,每层付出$\log(N)$跳──管道平行 换一条路:把模型切成 N 个阶段,每个阶段 放一个──Layer 1 的前进 在阶段 0 做完,把激活张量交给阶段 1;rank 1 跑层 2 再交给阶段 2;以此类推──Backward 反向流回──内存近似线性下降,因为 cada阶段只有一阶段;计算是串行的,这就是泡问题──

La burbuja es un tubo de aire libre que abre la primera burbuja hasta el último paso) y el último de la burbuja es el último de la burbuja.$(N-1)/(M+N-1)$◦M=8、N=4 时是27%;M=64、N=4 时是4.5%── cada paso de microbatch 越多,bubble 越小, esto significa que el tamaño de lote de cada microbatch 更小

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

Antes de usar todos los microbatches M, antes de llenar el tubo, después de empezar hacia atrás, después de retroceder hacia atrás, cada microbatches debe permanecer activados hacia atrás, para que el tiempo de M crezca.$(N-1)/(M+N-1)$◊把 M 取得远大于N,就能把泡藏起来──

### 1F1B 调度

交错: un microbatch hacia adelante, una hasta la última etapa, inmediatamente comienza hacia atrás y deja que vuelva a fluir. Cada etapa se cambia una vez hacia adelante, una vez hacia atrás.

### ¿Por qué cada etapa es tan importante?

Si la etapa 0 necesita 50 ms, la etapa 1 necesita 100 ms, cada ciclo se encuentra en la etapa 1 上。 otra etapa Cada ciclo vacío igual a 50 ms, igual a la etapa 1 放行。参数相等是错轴:transformer的算力由每层的注意加 MLP 主导,嵌入层参数多但算力少──Stage 分配应按每个阶段的 FLOPs 均衡,而不是按权重数均衡──

### Microbate y lote

Pipeline 跑 M 个、每个大小为 B 的微洗──有效批量是 $M \cdot B$◊ Un paso de tubería                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       $M \cdot B$个样本的梯度──Bubble 比例取决于M; optimizador ver lo que es $M \cdot B$△调 M,就是在泡 (M) △大则更低) y entre cada microbatch (GPipe 下 M) △激活内存更高)

```figure
cd-pipeline-bubble
```

## Construirlo

`code/main.py` realización:

- `PipelineStage`Un pequeño .`nn.Module`, tiene una etapa de parámetros,并暴露 `forward(activation)`¿Qué es eso?
- `Pipeline(stages, num_microbatches)`En la fase de simulación, la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura de la estructura
- `bubble_fraction(num_stages, num_microbatches)`: cierre de la fórmula$(N-1)/(M+N-1)$¿Qué es eso?
- Una demostración de 4 etapas: imprimir en microbatch, así como la burbuja de la prueba, por ejemplo.

运行:

```bash
python3 code/main.py
```

输出: por etapa×microbatch de Gantt 图, así como por burbuja de previsión relativa cerrada 百分比──

## Práctica en el medio ambiente de producción

Tres modos pueden hacer que el oleoducto sea paralelo a la dureza hasta el grado de que pueda ser conectado.

**Activation checkpointing 与 pipeline 搭配。**GPipe 上有M 个微巴赫 在飞时,激活内存是单个微巴赫的M 倍──Activación de control en el tiempo hacia atrás 重算前, utilizando el poder de cambiar de内存; 两者结合,长序列上的管道才可行──

**Stage 均衡靠测量，不靠假设。**El equipo de producción se encargará de realizar una primera ronda de perfiles, evaluando cada nivel de cálculo real en el hardware objetivo, y luego evaluando los resultados de la medición.`--num-layers-per-stage` acepta la lista, para que cada etapa cada nivel de costo sea diferente cuando se utilice un número de niveles desigual 

**Send/recv 调度必须避免死锁。**Si cada etapa tiene que enviar una nueva recopilación, en línea se encontrará un cierre.

## Usalo

El uso en el producto:

- **Megatron-LM。**Paralelas de tuberías de gran tamaño ⋅ uso 1F1B,并支持 tensor + pipeline + data parallel 组合──
- **DeepSpeed Pipeline。**La tubería ZeRO-1 + es el conjunto habitual de muchos de los modelos de mayor tamaño de código abierto.
- **PyTorch Pipe。**PyTorch origin生的 pipeline 包装, basado `torch.distributed.pipeline.sync.Pipe`¿Qué es eso?

##  entregarlo

Sección 80 课把每一阶段的参数分片存进分片检查点──第 81 课在端到端演示里组合 DDP + ZeRO +管道精神(上如此;演示为了运行而仍保持管道为模拟)

##  ejercicios

1. 实现 1F1B, prueba burbuja 比例与GPipe 一致,但激活内存有上界──
2. En un modelo más profundo, analizar la realidad en cada etapa del tiempo, y en la medida en que se mide la etapa de reequilibrio de la hora de la pared.
3. 跨管道微巴查的梯度累积,检查梯度等等等等价全批前的梯度──
4. 给管道 配上激活检查点,测量内存下降与算力代价──
5. Colocar el tubo con DDP 结合(cada tubo de rango en el grupo de datos paralelas 组中复制),并推理二维调度──

## 关键术语: "El hombre es un hombre"

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
- Fase 19 Lección 76 - las primitivas de envío/recuperación que utiliza el calendario
- Fase 19 Lección 78 - ZeRO es ortogonal a la tubería y a menudo se combina
