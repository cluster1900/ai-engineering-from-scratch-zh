# Descripción especulativa y EAGLE-3

> Fase 7 · Lección 16  demostró matemáticas: Leviathan  rechazar las reglas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16（speculative decoding math），Phase 10 · 12（inference optimization）
**Time:** ~75 minutes

## El objetivo del aprendizaje
- Usando una frase expresar el teorema de Leviatán,并 probar el ciclo especulativo 生成的样本与验证器分布完全一致──
- El proceso de descifrado de especificaciones de vainilla (Leviathan 2023) hasta el desarrollo de EAGLE EAGLE-2 y EAGLE-3, y dice que cada paso de la eliminación tiene una limitación definida―
- 根据接受率 `α`Y proyecto-a-verificador 成本比 `c`计算期望加速,并为每种制度 选择最优草案 长度 `N`¿Qué es eso?
- Desde zero realizar el ciclo especulativo completo:proyecto, verificación, rechazo-muestro en el medio residual, recorrido en el caché KV, en el momento del rechazo, en el momento del total aceptación, salida de tokens de bonificación.

##  problemas
En el modelo 70B, se puede hacer una descodificación autorregresista en H100, en H100, sólo 35 Tokens por segundo.

El descifrado especulativo se convertirá en un verdadero problema de descomposición.`N`Siguiente pase adelante pequeño 中提出 `N`个 Token──verificador está prefijo 加上所有 `N`个草案 上运行一次―― Si el verificador está en su lugar `i`La distribución y el borrador de una línea de trabajo, en un sentido estadístico que se definirá), se acepta; si no se rechaza, se adopta una modificación de la distribución residual.`N+1`个被接受的标志, en lugar de una.

 Teorema clave de Leviathan, Kalman, Matias (ICML 2023): la distribución de salida y la distribución obtenida directamente de la muestra de un verificador es totalmente coincidente.

Fase 7 · Lección 16 给你是数学──本课给你是训练── un buen borrador 带来的加速价值比廉价草案高 2×──EAGLE、EAGLE−2 和 EAGLE-3 (Li et al., 20242025) 将草案 = 同一模型的小版本转化为一门精确的工程学科──2026年的生产推理服务器默认使用EAGLE−3──

## 概念
### 不变量: muestreo de rechazo de Leviatán

¿ Qué ?`p(t)`Indicar en un prefijo abajo borrador a la siguiente Token de distribución,`q(t)`Indicar la distribución de los verificadores.`d ~ p` en la probabilidad `min(1, q(d) / p(d))` Acceptar  Si rechazar, entonces de la distribución residual `(q - p)_+ / ||(q - p)_+||_1`En el caso final, el modelo de obediencia`q` `p`Más allá, esto es válido; más allá, más allá, rechazo, pero el resultado sigue siendo preciso.

¿ Qué ?`N`Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente: Siguiente:: Siguiente: Siguiente: Siguiente: Siguiente: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Última: Úl`prefix + d_1 + ... + d_N`❖ El verificador se regresará simultáneamente `q_1, q_2, ..., q_{N+1}`                                                                                                                                                                                                                                                              `j`La primera vez que rechazó, desde`residual(q_j, p_j)`采样并停止──若全部接受,则从 `q_{N+1}`Como un símbolo de bonificación.

### Lo que determina la aceleración

¿ Qué ?`α`Por cada Token redactado la tasa de aceptación esperada.`c = cost(draft) / cost(verifier)`Por el costo comparado. Por el tiempo de prueba del futuro de la expectativa de aceptación de Token:

```
E[accepted] = (1 - α^(N+1)) / (1 - α)
```

Cada aceptación de Token de la expectativa total tiempo de pared es `(N * c + 1) / E[accepted]`◊ En comparación con `N`Lo más mínimo que pueda conseguir es el mejor punto.`α = 0.8, c = 0.05`: 最优 `N`Es aproximadamente 57, aceleración de 3,2×...`α = 0.95, c = 0.02`: 最优 `N`Es aproximadamente 810 y se acelera cerca de 5×.

El mayor 杆 es `α`                                                                                                                                                                                                                                                              `N = 5`时, de `α = 0.6`(proyecto de vainilla)`α = 0.9`(EGLE-3), permitirá que cada verificador adelante de la expectativa de aceptar Token número de 2.2 提升到4.1 ⋅ utilizar el mismo verificador,吞吐几乎翻倍──

### El progreso de dos años

**Vanilla speculative (Leviathan, 2023).**El modelo de proyecto es el LLM más pequeño de formación independiente en la misma familia.`α ≈ 0.6`Lo mejor es que sólo hay 2 veces más velocidad.

**EAGLE-1 (Li et al., 2024).**El Draft es un transformador de tipo micro, generalmente de una a dos capas, que se encuentra en el estado oculto de la última capa del verificador como entrada y predice directamente el próximo Token.`α`Sube a 0,7 0,8 

**EAGLE-2 (Li et al., 2024).**加入动态草案树:不是提出单条包含 `N`个 Token 的序列, en lugar de proponer un pequeño árbol de candidatos, con una prueba de árbol hacia adelante (con atención de árbol) para cada candidato, luego avanzar en el camino de la mayor probabilidad.`α`Ha subido hasta 0,85 y más.

**EAGLE-3 (Li et al., 2025, NeurIPS).**También se hicieron dos cambios. Primero, eliminó completamente la pérdida de características de predicción: EAGLE-1/2  entrenamiento proyecto de estados ocultos de la comprobación de ajuste, lo que limita los beneficios que más datos pueden traer. Segundo, prueba de tiempo de entrenamiento (TTT): durante el entrenamiento del proyecto, considerar el proyecto de previo propio como una entrada de la predicción de la reacción a los siguientes pasos, en consonancia con su forma de funcionamiento en la supresión. Esto ayudará a la distribución de entrenamiento y pruebas, y evitará la acumulación de errores.

### Revuelo de la caché KV

验证会在一次通过中将验证器的 KV cache 扩展 `N`个条目──如果在位置 `j` ocurrir rechazo, entonces posición `j-1`后的缓存 内容就是错误的──常见实现有两种:写入 scratch buffer 并在接受时提交(vLLM、TensorRT-LLM), o mantener un caché KV físico加逻辑长度,并拒绝时截断──无论如何,rollback 成本都是每个层每个头的字节,与前进通过 成本相比可以忽略──

 Para la búsqueda de árboles EAGLE-2, el verificador usará la máscara no causal de la máscara de árboles 运行 Attention。工程上细节繁, pero calcular es en esencia una vez con máscara personalizada 调用。

### Proyectos de arquitecturas para 2026

| Strategy | Draft type | `α` | Speedup | Training cost |
|----------|-----------|-----|---------|---------------|
| Vanilla | 独立小型 LLM | 0.55-0.70 | 1.8-2.3× | 无（复用现有小模型） |
| Medusa | 验证器上的额外 LM heads | 0.65-0.75 | 2-3× | ~1B SFT tokens |
| EAGLE-1 | hidden states 上的 1-layer transformer | 0.70-0.80 | 2.5-3× | ~60B tokens |
| EAGLE-2 | EAGLE-1 + dynamic draft tree | 0.80-0.88 | 3-4× | ~60B tokens |
| EAGLE-3 | Multi-layer feature fusion + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B tokens |
| Lookahead | 无 draft（Jacobi iteration） | N/A | 1.3-1.6× | 无 |

2026 años de producción en medio ambiente: vLLM y SGLang en el tiempo disponible en forma de uso de EAGLE-3, en caso contrario utilizar EAGLE-2──TensorRT-LLM para Meta y NVIDIA


```figure
l5-spec-decode-eagle
```

## Construirlo
¿ Qué ?`code/main.py` Este es un ciclo especulativo completo de Leviathan, que contiene todas las partes componentes: proyecto de N  verificador y paso de paso  por posición de rechazo  muestreo residual  token de bonificación  rollback de KV, así como para verificar la distribución de salida y directamente desde `q`采样一致的经验检查── también se han realizado pruebas de la experiencia de la

### Paso 1: Rechazar las reglas

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### 步骤 2: distribución residual

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### 步骤 3: un paso especulativo completo

`spec_step`函数 de `p`proyecto `N`个 Token, luego en una vez并行 `q`Evaluation 中验证它们──它将对每一个草案的代币 应用拒绝规则,并在第一次拒绝时从残中采样修正──如果全部接受,则从`q_{N+1}`输出一个奖金代币――

### 步骤 4: contabilidad de KV

模拟器会为每位工跟踪逻辑                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 `kv_length` Acceptar`k`个 borrador 时,`kv_length += k`♪ en su posición`j`Cuando se rechaza, el caché ya está escrito.`j`, pero la longitud lógica se fijará para`prefix_length + j + 1`, es decir, el token de corrección 后一个位置──后续读取将截截至逻辑长度──

### 步骤 5: el cheque de Leviatán

运行 50,000 个投机步骤――统计被接受 证券的经验分布――与从 `q`直接采样 50,000 veces hacer comparación 统计量应显著低于关键值──该定理在实践中成立──

### Paso 6: aceleración vs. α

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `p`Para su desvío`q`, calidad del borrador de análisis,`α`, y luego dibujar diferente .`α`Y `N`Se publicó una carta de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de ejemplos de`α ≈ 0.9`) ¿Cómo desbloquear cada prueba de 45 Tokens?

## Usalo
Uso de EAGLE-3 de producción de la clase `vllm serve`¿Qué es esto ?

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

En el H100 de la serie 64 utiliza el SGLang de EAGLE-3: según el papel de EAGLE-3, en comparación con el decodage de vainilla de la serie 64, el rendimiento aumentó aproximadamente 1.38×。

适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适用 适用 适合 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适   适 适 适 适 适 适  适 适   适 适   适 适 适   适 适    适 适  适 适      适      适 适   适         适    适 适                适                                       

-  cualquier latencia de p50 por encima de la suma de sumo más importante 
- 代码生成和结构化输出(JSON、SQL) ・・・ debido a la distribución de objetivos de altitud predecible,`α`Más alto que 0,9...
- 长文本生成 ((1000 Tokens) 』 La aceleración de la distribución de los tokens se mantiene en el mercado.

No está bien.

- 很小的模型(<3B) ――Drafts 并不比验证器便宜太多──
- 极小批-1 CPU 部署──Draft model 內存开销可能不值得──
- Es un proyecto muy caliente.`α`Se derrumbará.

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-eagle3-tuner.md` dar una idea de la carga de trabajo (model, tamaño de lote, latencia de objetivo, perfil de tarea), que se propone la descodación especulativa estrategia y la modificación de la familia de proyectos`N`、profundidad de árbol 、concambio de temperatura)

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar que el chi-cuadrado de Leviathan distribuido en el control se mantiene bajo el 95% del valor crítico en las muestras de 50.000 

2. En el`α`Fixado en 0,9 且 `c`Fixado en 0.04 时,将 `N`Desde 1 扫描到10──绘制每次验证器调用期望 Token 数和每个 Token 的实际墙时间──找出使墙时间 最小的 图`N`❖ Explicar la forma de la línea

3. Modificar el código para que se parezca a EAGLE-2 buscar árboles: cada paso, borrador  propuesta de forma `[2, 2, 2]`La probabilidad de que el proceso sea aceptado es de un máximo de probabilidad.`α`Y también el total de tokens utilizados en cada prueba de la máquina de calcular números.

4. Para dos并发序列实现 lotados KV rollback 模拟器── Todos los proyectos de la secuencia A fueron aceptados; la secuencia B en posición 2 拒绝── mostrar la verdad de cada secuencia`kv_length`Todo está actualizado y no hay pérdida de trabajo.

5. 阅读EAGLE-3 paper's Section 4(Training-Time Test) ―― Usó dos palabras para explicar por qué no hay entrenamiento de proyectos ingenuos de TTT que sufrirá sesgo de exposición, así como por qué en el entrenamiento se trata de preparar su propio pronóstico contra el que pueda reparar este problema―, en especial en la literatura de muestreo programado de la siguiente segunda semana 关联起来──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Leviathan rule | “min(1, q 除以 p)” | 以概率 `min(1, q(d)/p(d))` 进行 Bernoulli accept/reject；当 rejection 时从 residual 中采样，可精确保留验证器分布 |
| Residual distribution | “(q 减 p) 的正部，归一化” | `(q - p)_+` 在零处截断并重新归一化，是 rejection 时应采样的正确分布 |
| Acceptance rate α | “draft 对的频率” | 在拒绝规则下，每个 Token 的期望 Bernoulli 成功概率；支配所有加速数学 |
| EAGLE-1 | “hidden-state draft” | 条件化于验证器 last-layer hidden state 的微型 Transformer draft（Li et al., 2024） |
| EAGLE-2 | “dynamic draft tree” | EAGLE-1 加上一棵候选 continuation 树，并在一次验证器 pass 中用 tree attention 打分 |
| EAGLE-3 | “training-time test” | 去掉 feature-prediction loss，基于直接 Token prediction 训练，并在训练时把 draft 自己的输出反馈给它 |
| Training-time test (TTT) | “exposure bias 修复” | 训练时以 autoregressive 方式运行 draft，使训练和测试输入分布匹配，是 scheduled sampling 的直接类比 |
| KV rollback | “撤销被拒绝的 draft” | rejection 后将验证器 KV cache 重置到已接受 prefix 长度的 bookkeeping |
| Bonus token | “免费的那个” | 当全部 `N` 个 draft 都被接受时，以零额外验证器成本从 `q_{N+1}` 额外采样一个 Token |
| Tree attention | “一次验证许多候选” | 使用尊重 draft tree 拓扑的 non-causal mask 的 Attention；在一次 forward pass 中为树中的每个节点计算 `q_i` |

## 延伸阅读
- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) 基础论文与等价性定理  基础论文与等价性定理
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318) Como el método propuesto por la independencia, prueba clara
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) EAGLE-1, basado en un proyecto con condiciones de estado oculto
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) búsqueda dinámica de árboles
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) 2026 años de producción
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774)  otro tipo de proyecto  método
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html)  覆盖所有策略 接入的权威生产参考
