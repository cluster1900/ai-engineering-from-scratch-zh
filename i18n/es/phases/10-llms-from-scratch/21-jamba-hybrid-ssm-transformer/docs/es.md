# Jamba  Transformador híbrido SSM

> El modelo espacial de estado (SSM) y el transformador 想要的东西不同──Transformer 通过 Attention 换取质量,但代价是二次复杂度──SSM 通过递递推换取线性时间推理和常量内存,但质量落后──AI21 de Jamba((2024年3月) y Jamba 1.5(2024年8月) los colocan en el mismo modelo: cada 7 Mamba 层配 1 层 Transformer, cada bloque utiliza MoE,并提供可在单张80GB GPU 上运行的 256k window context. Mamba-3(ICLR 2026) a través de los conjuntos de estado y MIMO proyecciones 强化 SSM 侧──本端值到端阅读这两年类架构,并解释为什么M-M Pure 和 Transformer 长文中未持续尝试,并保留在中延伸的混合文中.

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**前置要求:**Fase 10 · 14 (arquitecturas de modelo abierto), Fase 10 · 17 (atención nativa escasa)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 解释 Jamba bloque 中的三个原始:Trasformer layers、Mamba layers、MoE, así como 1:7:even 的交错配方──
- Desde la descripción de alto nivel de la forma de transmisión del SSM, y por qué puede lograr la idea de memoria constante.
- 计算 Jamba 模型在 256k contexto 下的 KV cache 占用,并与纯变压器 模型所需内存进行比较──
- Explicar tres innovaciones de Mamba-3: Discretizamiento exponencial-trapezoidal, actualización de estado de valor complejo, MIMO) y cada innovación tiene problemas específicos.

##  problemas
La atención a la longitud de la secuencia es de segunda complejidad. El modelo espacial de estado es lineal. Esta diferencia se incrementa continuamente: en 256k tokens, un mapa de la atención de un transformador. Cada cabeza tiene 65B 个条目; el estado de transmisión de SSM no cambia de longitud de la secuencia, se fija en gran medida.

Pure-SSM 模型(Mamba、Mamba-2) en pequeña escala puede adaptarse a la perplejidad del transformador, pero en el estado de seguimiento  misión está atrasada, y en ciertos en el contexto de recuperación 类别  失败──直觉是:SSM va a comprimir la historia en estado fijo; cuando la historia es larga, la información va a salir.

显而易见的修复方法:两者都用──在需要精确召回的地方放变压器层――其他地方使用SSM层――调节比例──Jamba es el primer modelo de producción de este tipo de híbrido 配方 en un modo escalado.                                                                                                                                                                                                                                

Esta clase leerá estos tres artículos y formará la opción correcta de proporción de modelos de pensamiento.

## 概念
### Un SSM en una página

Modelo espacial del estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `h`处理序列   procesamiento`x_1, ..., x_N`¿Qué es esto ?

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

Cada paso, el estado pasa por la línea de movimiento.`A`演化,接收输入 `B x_t`,并输出 `C h_t`¿Qué es eso?`A, B, C`Todo lo que podemos aprender.`y_t`Sólo necesito`h_{t-1}`Y `x_t`No necesito nada más temprano.`x`△内存是常量──推理是每个代币 O(1)。

建模质量                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `A`La estructura es la de la estructura de la estructura.`A, B, C`替换为依据数据的形式 (也就是 选择性) 部分 (Mamba-2(2024) 替换为依据数据的形式 (也就是 选择性)  Mamba-2(2024) 进一步简化了结构── Mamba-3(2026) 则在特定位置重新加入复杂性──

关键性质是: Para el decodificador LLM, la capa SSM puede ser sustituida directamente por la capa de atención, sustituida por un estado de capa a capa de KV en constante crecimiento.

### El bloque de Jamba

El bloque de Jamba  según dos niveles digitales:

- `l`:Ratio de atención a bambá。Jamba 使用 `l = 8`, significa cada 7 Mamba 层配 1 个 Transformer 层(7 Mamba + 1 Atención = cada grupo 8 层) ⋅
- `e`: Frecuencia de MOE。Jamba 使用 `e = 2`, indican cada uno de los niveles de aplicación de MoE.

bloque 內层序列:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

Cada bloque de Jamba es de 8 niveles. La profundidad es de 4 bloques.

### ¿Por qué la proporción 1:7

AI21 hizo ablaciones: ¿Qué tipo de atención a Mamba por ejemplo puede obtener la mejor perplejidad por parámetro y en el contexto de recuerdo en sus evaluaciones de largo contexto?

- Atención 太多(1:1): la calidad aumenta, pero la memoria y la velocidad varían.
- Atención 太少(1:15):内存 muy bien, pero en el contexto de recuperación 失败。
- Lo mejor es 1: 7 o 1: 8.

直觉是:Las capas de transformador 处理精确召回和状态跟踪──Mamba capas 负责低成本的大部分处理──

### Codificación de posición

Las capas de Mamba 本身具有位置感知能力(通過递推) ―― las capas de atención de los híbridos originales basados en Mamba 没有使用RoPE,因为 SSM capas 提供位置信息──Jamba 1.5 为 Atención capas 添加RoPE,以增强更长的语境概括; esto se basa en la experiencia de evaluación de largo contexto 后改──

### El presupuesto de memoria

对于 Jamba-1 形状(32 层:28 Mamba + 4 Atención, oculta 4096,32 cabezas de atención):

- Caché KV(sólo capas de atención): en 256k BF16 下为 `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB`◊ Sólo 4 capas de atención  contribuyen a la caché KV―
- Estado de SSM: cada prefijo de token 为 `28 * hidden * state_size`, pero es un tamaño fijo de cada nivel, no se expande en la longitud de la secuencia.`28 * 4096 * 16 * 2 = 3.7 MB`¿Qué es eso?

Con el mismo escondido 32 niveles 32 cabezas llenas de MHA de Transformer puro`2 * 32 * 32 * 128 * 256k * 2 = 128 GB` KV cache  Reducido 8x── incluso en comparación con la mayoría de 2024 模型使用的 GQA(8) baseline(`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`),Jamba's 1:7 híbrido en 16 GB abajo todavía pequeño 2x。

Esto es lo que dice AI21 单张 80GB GPU 上的 256k context──full-MHA pure Transformer's KV cache 放不下; incluso la línea de base de GQA 也几乎不给权重和激活空间; mientras que Jamba 可以──

### Mamba-3: línea de base de SSM puro de 2026

Mamba-3(ICLR 2026, arXiv:2603.15569) en el lado puro-SSM introdujo tres innovaciones:

1. **Exponential-trapezoidal discretization.**Usar más expresivamente el eje de transmisión de Mamba-2 en el método de Euler.`x_t`La convolución externa superior.

2. **Complex-valued state update.**之前的Mamba 将状态矩阵从复杂(S4)降低为真实对角形(Mamba),再降低为规模身份(Mamba-2) ・・・Mamba-3 重新加入复杂值,相当于对状态进行数据依赖的旋转嵌入──这恢复了之前的真实值 简化所牺牲的状态跟踪能力──

3. **Multi-input multi-output (MIMO) projections.**No se utilizan proyecciones de tamaño de características, sino proyecciones de valor de matriz. En caso de no aumentar la latencia de decodificación, se aumenta la capacidad de construcción y la tasa de utilización de hardware.

En 1.5B 参数规模下,Mamba-3 相比Gated DeltaNet aumentará la precisión media en el downstream  0.6 个点;MIMO variante 额外增加 1.2 个点,总共提升 1.8 个点──En el mismo estado de tamaño 下,Mamba-3 以一半状态匹配Mamba-2──

Mamba-3 aún no se ha entregado en la producción híbrida a gran escala, pero es claramente la siguiente generación de Jamba-class 模型 SSM 侧的候选方案.

### ¿Cuándo usar híbrido

El híbrido 适合以下情况:

- Contexto 足足长, hasta que el caché KV de Transformer puro 变得痛苦(64k+)。
- 任务混合了短程结构 (adaptado a SSM) y a largo plazo (recuerdo) 需要变压器 (transformer) 
- ¿Quieres que se despliegue en un solo GPU en el presupuesto de almacenamiento, mientras que el caché de KV del transformador está en su interior?

Hybrid 不适合:

- Contexto 很短(<16k) ・ SSM sobrecarga 被浪费;puro Transformer 足足好。
- 任务需要在任何地方注意----深度推理、多文档交叉引用) ――Hybrid 中 Atención de las capas raridad 伤害效果──
- Estás expandiéndose a modelos fronterizos de billones de parámetros.

### El panorama competitivo

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

La situación en el año 2026: el modelo de la industria híbrida de transformación pura es la principal frontera, pero el híbrido ocupa más de 256 mil áreas de desarrollo.


```figure
swiglu-ffn
```

## Usalo
`code/main.py`Es un calculador de memoria para arquitecturas híbridas.

- 目标 context 下的 KV cache──
- Memoria de estado de SSM.
- Una serie de modelos en el contexto N 下 的总内存──

El calculador soportado:

- Línea de base de Transformador puro (KV cache 随 N 增长)
- El estilo Jamba 1: 7 híbrido.
- Pure-SSM(totalmente sin caché KV)。

对于已发布形状,数字直接来自Jamba-1 和 Jamba-1.5 论文;对于假设变体,则是外推得到──

En el caso de la actual situación, el gobierno de la República de China ha adoptado medidas para la reducción de las emisiones de gases de efecto invernadero.

- La mayoría de la producción de servicios de gestión de la información (vLLM、SGLang) apoya Jamba 和 Mamba──检查具体版本──
- En el contexto 256k, Jamba tiene un incremento de la capacidad de almacenamiento de la misma secuencia de VRAM.
- Mamba-3  como modelo independiente todavía no está en producción, sólo un avance de investigación de 1.5B 

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-hybrid-picker.md` especificación de carga de trabajo determinada (profil de longitud de contexto, mezcla de tareas, presupuesto de memoria), que se dará entre el híbrido de estilo Transformer, Jamba y el SSM puro, y se explicará el peso de la memoria y el peso de la calidad.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`, calcular 32 niveles de Transformer puro (escondido 4096,32 cabezas) y el mismo tipo de Jamba-1 híbrido en el contexto de 256k.

2. 修改计算器,建模 1:3 híbrido(4 Mamba: 1 Atención) y 1:15 híbrido(14 Mamba: 1 Atención) ─ dibujar KV cache vs ratio──在哪个比率 下 KV cache等于SSM estado de memoria?

3. 阅读 Jamba 论文(arXiv:2403.19887) 的第 3 节──解释为什么 AI21 utiliza Mamba-1 y no Mamba-2, aunque Mamba-2 更快──提示:hybrid ablation section 记录了这一点──

4. 计算 Jamba 1.5 Large 中 MoE-todo otro nivel de parámetros sobrecargos(总计 398B,激活 94B) ――将活比与DeepSeek-V3(37B/671B) Comparar,并解释为什么 Jamba de la estructura将把活比推得更高──

5. 阅读 Mamba-3 论文(arXiv:2603.15569) 的第 3 节──用三句话解释为什么复杂-valued state update 等价于数据依赖的旋转嵌入──把答案关联到阶段 7 · Lesson 04 的 RoPE 推导──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | “带固定状态的递推” | 具有学习到的递推 `h_t = A h_{t-1} + B x_t` 的层；每个 token 使用常量内存 |
| Selective SSM | “Mamba 的技巧” | 依赖数据的 A、B、C 参数，使模型在线性时间下获得类似 gating 的选择性 |
| Attention-to-Mamba ratio | “多少个 Attention layers” | 在 Jamba 中，`l = 8` 表示每 7 个 Mamba layers 配 1 个 Attention layer |
| Jamba block | “8 层一组” | 一个 Attention + 七个 Mamba + 在交替位置使用 MoE |
| SSM state | “隐藏缓冲区” | 固定大小的逐层状态，用于替代 Mamba layers 的 KV cache |
| 256k context | “Jamba 的旗舰数字” | Jamba-1 可在单张 80GB GPU 上容纳的序列长度；pure Transformer 在该大小下无法做到 |
| Mamba-3 | “2026 pure SSM” | 当前最佳 pure-SSM architecture，具有 complex state + MIMO；是 hybrid 重新构建时围绕的 baseline |
| MIMO | “Multi-input multi-output” | Mamba-3 的创新，使用 matrix-valued projections 而不是逐 feature 标量 |
| Exponential-trapezoidal discretization | “Mamba-3 的递推” | 更有表达力的递推，包含 Mamba-2 的 Euler-method discretization |
| Hybrid architecture | “混合 Attention 和 SSM” | 任何交错 Transformer 和 SSM layers 的模型；Jamba 是生产级原型 |

## 延伸阅读
- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) 原始 Jamba 论文,ratio ablaciones,256k contexto 声明
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) Jamba 构建所基于的选择性SSM 论文
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060)  simplificación del espacio estructurado-estado 后继者
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) Estado de valor complejo  MIMO  2026 frontera de SSM pura
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) S4 论文,面向LLMs de SSM 谱系起点
