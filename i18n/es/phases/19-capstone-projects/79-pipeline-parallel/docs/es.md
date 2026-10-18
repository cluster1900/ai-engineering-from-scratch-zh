# 管道并行和气泡分析

> 张量并行性将矩阵乘法跨等级分化――管道并行性将模型跨等级分化, cada uno de los niveles de una etapa――微批次流经管道――开始和结束的空时间就是泡;最小化它是整个过程――

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 19 期 Track C 课程 42-49
**Time:** ~90 分钟

## El objetivo del aprendizaje

- Se dividirá el modelo de orden en N 个阶段,并模拟跨 N 个等级的前向管道.
- Utiliza GPipe 计划通过管道安排 M 个微批次(仅向前填充,然后向后)并计算气泡分数──
- Comparar el tiempo de la burbuja con Megatron-LM y PipeDream
- 捍卫阶段分配: El número de parámetros de cada fase es más importante que el número de parámetros de cada fase.

##  problemas

El modelo de parámetros 70B de fp16 solo necesita parámetros de 140 GB. Ningún GPU de consumo puede soportarlo. ZeRO-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          $\log(N)$ Saltar la tubería y recorrer diferentes rutas: cortar el modelo en N 个阶段, y colocar una etapa en cada nivel.  El primer nivel se desplaza hacia el 0 级, y se activa la cantidad de张移至第 1 级.

气泡是管道开始时(等待第一个微批次到达最后阶段) 和结束时(等待最后微批次回流) 的空时间──对于M 个微批次和N 个阶段,每阶段的气泡分数为 (N-1) /(M+N-1)──当M=8、N=4时,即27%.

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

Antes de comenzar cualquier operación posterior, se debe llenar el tubo de carga con todos los M 个微批次向前填充管道; luego se debe retener la activación de cada pequeño lote hacia atrás, por lo que el almacenamiento se mantiene hacia atrás, así que el M 线性增长.

### 1F1B  tiempo

交错: una vez que los pequeños lotes de la primera y última fase llegan a la última fase, empieza a su posterior y deja que fluya de nuevo.

### ¿Por qué es importante calcular la igualdad en cada etapa ?

Si la fase 0 necesita 50 ms, la fase 1 necesita 100 ms, entonces cada ciclo está en la fase 1 上门控。 otras fases cada ciclo está en el espacio de 50 ms, espera la fase 1 释放。 El mismo número de parámetros es el eje erróneo: El cálculo del transformador es principalmente dirigido por la atención añadida a cada nivel de MLP, mientras que la capa de inserción tiene muchos parámetros pero la cantidad de cálculo es muy pequeña。 La distribución de las fases debe equilibrar el FLOP de cada etapa, no el peso de cada etapa.

### Micros y lotes

管道运行 M 个微批次,每个微批次的大小为 B。有效批次大小为 M*B。管道步骤结束时的梯度是组合 M*B示例的梯度。气泡分数取决于 M;优化器看到的是 M*B──调整 M意思将泡(M 价值较低) 与每微批次内存(GPipe的激活内存价值较高,M 价值较高)进行交易。


```figure
cd-pipeline-bubble
```

## Construirlo

`code/main.py` realización:

- `PipelineStage`: un pequeño `nn.Module`, preservar los parámetros de una etapa y abrir`forward(activation)`¿Qué es eso?
- `Pipeline(stages, num_microbatches)`: utilizar cada etapa de la simulación de la mediación en la simulación de la fase de la programación de la GPipe  tiempo de la programación.
- `bubble_fraction(num_stages, num_microbatches)`El proyecto de ley de la Unión Europea (UE) no se ha aprobado.
- 4 阶段演示, imprimir cada pequeño lote de la línea y el número de burbujas de la medida

¿Qué es eso ?

```bash
python3 code/main.py
```

输出: por categoría de pequeñas cantidades de gases y por porcentaje de las burbujas en relación con la previsión de cierre.

## 野外生产模式 野外生产模式 野外生产模式 野外生产模式

Tres modos hacen que la línea de tuberías se endurezca para que pueda transportarse.

**激活检查点与管道配对。**Cuando GPipe 上运行 M 个微批次时, activar la memoria es una pequeña cantidad de M 倍次;; activar el punto de control en el tiempo posterior volver a calcular hacia el tiempo anterior, para calcular el cambio de memoria; esta combinación hace que el tubo pueda procesar secuencias largas;;

**阶段平衡是测量出来的，而不是假设的。**El equipo de producción realiza un proceso de análisis, mide cada capa de cálculo real en el hardware objetivo, y luego se realiza una división según los resultados de la medición.`--num-layers-per-stage`标志接受一列表, de modo que en las fases se permita un número de niveles desigual en cada uno de los costes de cada uno de ellos.

**发送-接收调度必须避免死锁。**Cada etapa está en línea en el que se recibe y se envía antes de que se envía.

## Usalo

Modelo de producción:

- **Megatron-LM。**Referencia de la línea de tuberías de gran escala ⋅ adopción de 1F1B, apoyo ⋅ volumen + tuberías + datos ⋅ conjunto ⋅
- **DeepSpeed Pipeline。**Se ha integrado con ZeRO; el ZeRO-1 + es el mayor conjunto de modelos abiertos.
- **PyTorch Pipe。**PyTorch 原生管道包装器, basado en `torch.distributed.pipeline.sync.Pipe`Construcción.

## 发货

Sección 80 课将每阶段参数分片存储在分片检查点中. Sección 81 课在端到端演示中组成了DDP + ZeRO + 管道.

##  ejercicios

1. 实现 1F1B并验证气泡分数与GPipe 匹配, pero activar内存有限──
2. En un modelo más profundo, analiza cada etapa del tiempo real y pasa por la etapa de reequilibrio de la mediación.
3. Añadir la acumulación de la escala de los pequeños lotes de tubos, y comprobar si la escala es igual a la escala de todos los lotes anteriores.
4. Se comparará la tubería con el punto de inspección activado, se medirá la relación entre la caída de la memoria y el coste de cálculo.
5. Se puede realizar una revisión de la estructura de los tubos en 2D.

## 关键术语: "El hombre es un hombre"

|术语 |人们怎么说|它实际上意味着什么 |
|------|----------------|------------------------|
|管道| “模型沿深度平行” |每个等级一个阶段，激活逐级流动|
|泡泡| “管道空闲时间”|开始+结束时的 (N-1) 个步骤，其中某些阶段没有工作 |
|微批次| “批次切片”|前进/后退各1个；随着 M 的增大，气泡会缩小 |
| G管道| “填充然后排水” |所有 M 都在任何后退之前前进；高激活记忆|
| 1F1B | “交错时间表” |每级一前一后；有界激活记忆|

##  más阅读

- [Huang 等人，GPipe：巨型神经网络的高效训练](https://arxiv.org/abs/1811.06965)
- [Narayanan 等人，PipeDream：DNN 训练的广义管道并行性](https://arxiv.org/abs/1806.03377)
- [Megatron-LM 管道并行文档](https://github.com/NVIDIA/Megatron-LM)
- Sección 76 - 调度使用的发送/接收原语
- Sección 19 阶段 第 78 课 - ZeRO se asocia regularmente con el tubo
