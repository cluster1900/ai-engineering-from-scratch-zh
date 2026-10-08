# Las leyes de escala

> 2020 年 Kaplan 论文说:模型越大,Loss 越低──2022 年 Hoffmann 论文说:你们训练不足──Computer 会进入两个桶:参数和Token,而两者分配不显而易见──

**Type:** Learn
**Languages:** Python
**先修要求:**Fase 7 · 05 (transformador completo), Fase 7 · 07 (GPT)
**Time:** ~45 分钟

##  problemas

Cuando tienes la computación de entrenamiento de C FLOPs y quieres obtener el mejor modelo, te enfrentas a dos rotativas:

1. **多少参数 (N)？**模型越大, capacidad越高──
2. **多少训练 Token (D)？**Cada vez más datos, cada vez más capacidad de utilización.

FLOPs 近似按 `6 × N × D`¿Qué mejor? ¿Qué mejor?

Antes de 2022 años, la respuesta es 尽推高 N── GPT-3 (2020) es 175B 参数, en aproximadamente 300B Token 上训──比例为每参数 1.7 个 Token── Kaplan Scaling Laws 支持这一点──

Hoffmann et al. (2022)  entrenaron a un grupo llamado la familia de modelos pequeños de Chinchilla, encontraron diferentes conclusiones:**每个参数 20 个 Token** GPT-3  entrenamiento insuficiente 10×──Chinchilla(70B 参数,1.4T Token) en el caso de la estimación de costes bajos 2.5×, en todos los puntos de referencia 上都击败了 GPT-3(175B,300B Token)

2026 es el mundo de Chinchilla, pero hay un giro importante. En 15 millones de tokens, la proporción es de 1,875 tokens por parámetro. Para un modelo de uso a gran escala, el costo de la hipótesis es más importante que el costo de la formación, por lo que para una mayor utilización, el uso de los más pequeños tokens puede ser superado.

## 概念

![Chinchilla 曲线：不同 N/D 比例下的 Loss vs compute](../assets/scaling-laws.svg)

### Ley de Hoffmann

De Chinchilla, la pérdida sigue:

```
L(N, D) = A / N^α + B / D^β + E
```

- `N`= 参数(非 Embedding)
- `D`= 训练 Token。
- `α ≈ 0.34`¿ Qué ?`β ≈ 0.28`(Gran número de palabras)
- `E ≈ 1.69`, no se puede perder.
- `A ≈ 406`¿ Qué ?`B ≈ 411`¿Qué es eso?

Con la expansión, dos conjuntos se ponderan mutuamente ⋅ en cálculo fijo ⋅ C = 6ND) ⋅`N`求导并求解:

```
N_opt ≈ 0.6 × (C/6)^0.5
D_opt ≈ 0.6 × (C/6)^0.5
D_opt / N_opt ≈ 20
```

Optimo para el cálculo: cada parametro 20 tokens.

### ¿Por qué todavía tienes que hacer exceso de entrenamiento?

Sin embargo, el costo de entrenamiento sólo paga una vez; el costo de la evaluación siempre paga.

对于每月服务100亿代币的聊天机器人,推理会主导总成本──Llama 的方法是:模型更小,训练更久──8B 在 15T代币上训练,是高度推理优化的:

- Puede ponerse en la GPU de consumo.
- 延迟只是 70B Chinchilla-óptima de una pequeña parte.
- Para la mayoría de las tareas, la calidad es lo suficientemente cercana.

DeepMind 2024年论文("Over-training is the new optimal")将这一点形式化──对于推理主导工作负载,合适比例更接近每参数 100-500 个代币,具体取决于服务量──

### 涌现 vs 平滑性

Algunas capacidades (arbitramiento, muchos pasos de la teoría, seguimiento de la cadena de pensamiento) aparecerán de repente en cierta escala.

Schaeffer et al. (2023) 认为这是测量伪影:涌现指标使用不连续评分(cumplimiento exacto、值精度),会隐藏底层logits的平滑改进──连续指标(cross-entropy) muestra que la curva es plana──

Para 2026, el consenso es: a través de pérdidas continuas  realizar predicciones es fiable.

### 2026 año de la imagen

Las leyes de escalación siguen vigentes, pero:

| 因素 | 如何变化 |
|--------|-------------|
| 数据质量 | 筛选“好”Token（Phi-style）可使曲线移动，相当于 >2× effective compute |
| MoE | 总参数与 active FLOPs 解耦；Scaling Laws 按 per-active-FLOP 计算 |
| 后训练 | 某些能力（指令遵循、代码）受 SFT+RLHF 的影响比 pretraining 更大 |
| Multimodal | 图像 + 文本 Token 一起缩放；每种模态有单独曲线 |
| 合成数据 | 模型生成训练数据；effective compute 可以复合增长 |

Muon Optimizer (Kimi Moonlight, 2024) muestra, en la cantidad de datos de correspondencia, que en comparación con AdamW hay aproximadamente 2× de la computación efectiva                                                                                                                                                                                                                                           


```figure
scaling-laws
```

## Construirlo

¿ Qué ?`code/main.py` Hemos logrado la Equipación de pérdida de Chinchilla, y en varios cálculos  presupuesto bajo búsqueda de solución de cálculo-óptima `(N, D)`¿Qué es eso?

### Paso 1: pérdida de chinchilla

```python
def chinchilla_loss(N, D, A=406.4, B=410.7, alpha=0.34, beta=0.28, E=1.69):
    return A / N ** alpha + B / D ** beta + E
```

En fijo`C = 6ND`¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡`L` dibujo `(N, D)`Encuentra el valor mínimo.

### Paso 2: 计算最优边界

 para el `1e17`¿ Qué ?`1e25`Computación de FLOPs  presupuesto, encontrar en el`6ND = C`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `(N, D)` Procentaje de pruebas`D/N ≈ 20`¿Qué es eso?

### Paso 3: Costo de formación excesiva

計算訓練一個小 10× 的模型(最优 N 的 1/10,最优 D 的 10×) de los extraños pagados.

### Paso 4: Comparar con el modelo real

填入 GPT-3、Chinchilla、Llama 3 8B、DeepSeek-V3(params activos) de ya conocidos `(N, D)`Para,并比较预测 Loss y informe de pérdida

## Usalo

Usted no es muy posible entrenar a sí mismo frontera 模型...... pero las leyes de escalación 能告诉你:

1. **你的 fine-tune 是否有足够数据。**Si la tarea específica de datos es inferior al modelo base Cada parámetro 20 Tokens, esperan que se encuentren en un piso de pérdida 处和。
2. **是否选择更大的 base model。**Si todo tu presupuesto se gasta en la reflexión, priorizar la elección de modelos más pequeños, entrenar más tiempo.
3. **收益在哪里递减。** Más de 1000 veces                                                                                                                                                                                                                                                            

**2026 年的研究轨迹：**

- **数据受限状态。**El nivel de conocimiento de la tecnología de la información en línea es el nivel de conocimiento de la información en línea.
- **Compute-multiplier 技巧。**Muon Optimizer, MoE, mejores datos, cada uno se mueve en números constantes, no en líneas de velocidad.
- **RL 的 Scaling Laws。**开放问题──Estimientes tempranos indican que las muestras de RL contienen la ley de poder, pero el índice y la preparación son muy diferentes──

##  entregarlo

¿ Qué ?`outputs/skill-training-budget-estimator.md` Esta habilidad se desarrollará en un determinado cálculo  presupuesto   implementación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `(N, D, hours, GPU)`¿Qué es eso?

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`△ Impresión de la computación  presupuesto `1e20`¿Qué es esto?`1e22`¿Qué es esto?`1e24`La mejor de las Chinchilla .`(N, D)` Comparar con el modelo real
2. **Medium.**实现 Hoffmann Loss-as-function-of-computación 曲线──为 computación-optimal frontier 绘制 Loss vs `log10(C)` Identificar la ley                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `>10^28`Los FLOP 才能让交叉热再降低 0.1──
3. **Hard.**En el mismo conjunto de datos, entrenar 5 modelos pequeños, para que se adapten a su propia ley de escalación.`α`Y `E`¿Cómo coincide su índice con los resultados publicados?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Parameters (N) | “模型大小” | 非 Embedding 权重数量；决定容量。 |
| Tokens (D) | “训练数据” | 见过的训练 Token 数；决定参数被利用得有多充分。 |
| Compute (C) | “花费的 FLOPs” | 对标准 Transformer 来说，约为 `6 × N × D`。 |
| Chinchilla-optimal | “D/N ≈ 20” | 最小化 pretraining 每 FLOP Loss 的比例。 |
| Over-training | “超过 Chinchilla” | 花费额外训练 FLOPs 来节省推理 FLOPs；D/N >> 20。 |
| Irreducible loss | “底部” | Scaling Law 中的 `E` 项；数据本身的熵。 |
| Emergent capability | “规模上的突然跳变” | 通常是评分器伪影；连续 Loss 是平滑的。 |
| Effective compute | “训练效率倍增器” | 更好的数据 / Optimizer / 架构会倍增每个 FLOP 的作用距离。 |

## 延伸阅读

- [Kaplan et al. (2020). Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) 第一篇 Ley de la escala 论文; entrenamiento insuficiente。
- [Hoffmann et al. (2022). Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) Chinchilla。
- [Schaeffer et al. (2023). Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) 涌现作为测量伪影──
- [Sardana, Frankle (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448) Por qué el exceso de entrenamiento de Llama  adaptarse a su carga laboral 
- [Jordan et al. (2024). Muon: An optimizer for hidden layers in neural networks](https://kellerjordan.github.io/posts/muon/) 2x multiplicador de cálculo。
