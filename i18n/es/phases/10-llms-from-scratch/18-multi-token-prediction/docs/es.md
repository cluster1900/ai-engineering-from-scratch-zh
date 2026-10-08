# Predicción de múltiples tokens (MTP)

> Desde GPT-2 hasta Llama 3, cada auto-regreso LLM en cada posición se basa en una pérdida  entrenamiento: predicción siguiente Token。DeepSeek-V3 en cada posición aumenta una segunda pérdida: predicción de nuevo detrás de ese Token。 Parámetros adicionales 14B  en el modelo 671B ) a través del flujo Gradiente 被蒸回主模型, mientras que los cabezas de MTP bien entrenados en la teoría se reutilizan en los diseñadores de decodificación especulativa, la tasa de aceptación supera el 80%―1.8× de producción de la capacidad de desagregación casi es gratuita obtida―. Este curso se basará en la tecnología de DeepSeek 报告 construir módulo MTP secuencial compartido, calcular pérdida y la cabeza  参数布局,并解释为什么 MTP guardó la cadena causal, mientras que Gloeckle et al. inicialmente paralelos MTP destruyó .

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04（预训练 mini GPT）、Phase 10 · 15（speculative decoding）
**Time:** ~60 分钟

## El objetivo del aprendizaje

- Explicar MTP  entrenamiento objetivo,并推导 diferentes profundidad de predicción  上的关节损失──
- 解释 Gloeckle et al. de cabezas MTP paralelas(2024) entre los módulos MTP secuenciales de DeepSeek-V3  , y por qué secuenciales 设计能保留因果链──
- 计算在预训运行中加入 MTP módulos 计算在预训运行中加入 MTP módulos 计算在预训运行中加入 MTP módulos 计算在预训运行中加入 MTP módulos 计算在预训运行中加入 MTP módulos 计算在预训运行中加入 MTP módulos 计算在预训运行中加入 MTP módulos 计算在预训中加入 MTP módulos 计算在预训中加入 MTP módulos 计算在预训中加入 MTP módulos 计算在预训中加入 MTP módulos 计算在预训中加入 MTP módulos 计算
- Desde el punto de vista de la implementación de un módulo MTP:embedado compartido, bloque de transformador por profundidad, proyección y cabeza de salida compartida.

##  problemas

La predicción de los tokens siguientes es el objetivo de la formación estándar de LLM. Cada estado oculto es supervisado para predecir una sola cosa: los tokens siguientes. Es un mensaje deficiente. La mayor parte de la información en el proceso se extiende a un token: estructura, coincidencia, realidad, proceso de cálculo. El modelo debe pasar en millones de tokens acumulando muchos signos para aprender estos contenidos.

MTP planteó la pregunta es: si cada estado oculto son supervisados para una vez predecir múltiples futuros Token 会怎么?Gloeckle et al. (Meta, 2024) prueba que esto ayuda. Su realización se realiza en la columna vertebral 之上放置了几个独立的输出头, cada cabeza 预测不同的偏移──并行、简单, pero estos cabezas 看到的是同一个隐藏状态,没有任何层级的精炼,而且预测之间不会按因果接,因此无法用于投机解码──

DeepSeek-V3 (en inglés) (2024 12 月) va a MTP 重新设计为序列模块,在每个预测深度上保留因果链――模型从 `h_i^(0)`预测  ¿ Qué es eso ?`t+1`, y luego de un nuevo estado oculto .`h_i^(1)`预测  ¿ Qué es eso ?`t+2`, y`h_i^(1)`¿ Qué es eso ?`h_i^(0)`Y `E(t+1)`Embedding, según este tipo de sugerencias. Cada profundidad tiene su propio pequeño bloque de transformador. Embedding compartido y cabeza de salida compartida.

Este curso se desarrollará desde el punto de vista de la construcción de un módulo MTP y la pérdida de profundidad de D.

## 核心概念 核心概念 核心概念 核心概念

### MTP secuencial 配方

DeepSeek-V3 está en el modelo principal.`D`个 MTP módulos── cada módulo `k`(entre ellos `k = 1..D`)预测 profundidad `k`El símbolo, es decir, está en posición determinada.`i`时预测                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `t_{i+k}`¿Qué es eso?

Modulo `k`包含:

- Un bloque de transformador .`T_k`, tener su propia atención y MLP.
- Una matriz de proyección`M_k`, se combinará el estado oculto de la primera profundidad con el emblemático de la verdad de la primera profundidad.
- Embedado compartido `E`(与主模型相同)
- cabezal de salida compartida `Out`(与主模型相同)

                                                                                                                                                                                                                                                              `i`El prefijo, por estado oculto profundo 为:

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

Previsión por profundidad 为:

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

La pérdida de profundidad es en relación con la verdad fundamental.`t_{i+k}`La entropía cruzada:

```
L_k = CE(logits_{i+k}, t_{i+k})
```

跨 profundidad de pérdida articular:

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda`Es un factor de peso menor, Profundo Buscar-V3 en el entrenamiento del 10% antes de usar 0.3, después de usar 0.1―`L_main + L_MTP`¿Qué es eso?

### ¿Por qué es secuencial, en lugar de paralelo?

Gloeckle inicial paralelo MTP tiene D  cabezas de salida, cada uno directamente aplicado hasta `h_i^(0)` Cada cabeza está en el mismo estado oculto de la columna vertebral 预测 `t_{i+k}`Así se puede entrenar normalmente, pero estas predicciones no se condicionan entre sí.`head_1`                  `head_2`, estas cabezas son de la misma manera que los de la cabeza.

Proyecto de diseño de DeepSeek-V3`h_i^(k-1)`Además de la incorporación real de los siguientes tokens `E(t_{i+k})` Construcción `h_i^(k)`Esto ha mantenido la cadena causal: para la predicción.`t_{i+k+1}`, profundidad `k+1`El módulo se verá`t_{i+k}`处的内容──这在结构上与自归解码器 消费自输出方式相同, por lo tanto los módulos MTP pueden ser directamente utilizados como diseñadores de decodificación especulativa──

推理时:将 `h_i^(k-1)`Y la propuesta`t_{i+k}`输入 módulo `k+1`, obtener para`t_{i+k+1}`Este es un proyecto de estilo EAGLE, simplemente usando un buen módulo MTP entrenado como red de proyecto. DeepSeek-V3 informa que la tasa de aceptación del primer módulo MTP supera el 80%, y obtiene aproximadamente 1,8× 加速──

### 参数核算 (en inglés)

 Por el secreto `h`、词表为 `V`El modelo:

- Un modelo principal: miles de millones de parámetros, más un pequeño por`V * h`de la cabeza de salida.
- Cabeza de salida compartida: cabezal del modelo principal de reposición.
- Embedado compartido: Replicación del modelo principal.
- Cada módulo MTP:
  - Proyección `M_k`¿Qué es esto ?`(2h) * h = 2h^2`¿Qué es eso?
  - Bloqueo de transformador `T_k`Por lo tanto, no hay que olvidar que el gobierno de la República Federal ha sido un Estado miembro de la Unión Europea.`4h^2`)加 MLP(SwiGLU 且比为8/3 时通常为`8h^2`)― cada bloque 约 `12h^2`¿Qué es eso?

Parámetros totales de cada módulo:`~14h^2`◊ Para DeepSeek-V3 `h = 7168`,D = 1 módulo: papel en la superficie es `~14 * 7168^2 = ~720M`参数──DeepSeek-V3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

### Descripción especulativa 回报

Durante el entrenamiento preliminar, los módulos MTP permiten que el entrenamiento se ralentice en un 10% (más computación avanzada, pérdidas extra)

1. Más intenso de entrenamiento de señales. Cada estado oculto se ve D+1 个监督目标. En MMLU, GSM8K, MATH, HumanEval, el efecto de medición:

2. 推理时免费的投机解码草案──MTP módulo 已 sido entrenado para predecir los siguientes pocos Token──重新使用网络草案时,它能达到80%+ de aceptación──En este nivel, N=3 o N=5 de especificación de la descifrado puede traer 1,8× 吞吐量──10% de la costos de entrenamiento se comenzarán a volver a escribir en la primera ejecución de la推理──

### Relación con el águila

EAGLE en el entrenamiento previo, entrenamiento individual un modelo de proyecto pequeño. MTP se redactará en el entrenamiento previo. Dos métodos recibirán tasas de aceptación similares, pero el pipeline es diferente:

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | 预训练之后 | 预训练期间 |
| Backward-compatible with existing weights | 是 | 否（需要重新训练） |
| Draft params | 1-2 个 transformer layers | 1 个 transformer block + projection |
| Acceptance rate | 0.88-0.92 | depth 1 时 0.80+ |
| Benefit beyond speedup | 仅 speculative decoding | 更密集的训练信号 + 加速 |


```figure
multi-token-predict
```

## Construirlo

`code/main.py`端到端构建一个MTP模块:shared embedding、projección、transformer block、shared output head──然后它会在一段简短的合成序列上计算每深度交叉输入损失,并按组件印印参数──32 个代币的玩具词汇 让数字更易读──

### 步骤 1: tabla de incorporación compartida

Una de ellas .`vocab_size x hidden`La tabla está formada por el modelo principal y cada módulo MTP de cada profundidad 共同使用──不是 la segunda copia, sino el mismo tensor──

### 步骤 2: combinación por profundidad

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

El verdadero DeepSeek-V3 se reunirá en dos momentos de RMSNorm para el concato vectorial .`[2h]`, no con una `h x 2h`Matrix 投影── Este juguete 为了 stdlib 简洁, utiliza Vector加法来代替──

### Paso 3: Profundidad de k del bloque de transformador

Autoatención加 MLP──在玩具中, una sola capa de bloqueo de atención lineal 和 una SwiGLU MLP 让结构可见,同时避免使用numpy──

### Paso 4: cabezal de salida compartida

复用主模型的输出覆盖词汇的逻辑──

### 步骤 5: pérdida por profundidad

Softmax (logits)`k`处 verdad fundamental Token 的交叉化──使用 `lambda / D`缩放因子跨深度 聚合──

### Paso 6: Parámetro de cálculo

打印总参数、shared(embedding、head) 参数, así como por módulo 额外参数── mostrar MTP 额外参数与主模型大小的比例──

## Usalo

MTP 已集成到DeepSeek-V3(2024 年 12 月) y DeepSeek-R1 系列中──推理时:

- Profundos Buscar su propia pila de servicio 可开箱即用地将 MTP módulos 作为投机解码器 使用。
- 截至 2026 年 4 月,vLLM 和 SGLang 已有DeepSeek-V3 MTP的集成路径──
- El programa de instrucción de ROCm SGLang de AMD muestra una configuración especulativa de MTP específica y se encuentra en el punto de control V3.

En el nuevo pre-training de la operación de uso de MTP:

- Usted controla la línea completa de entrenamiento previo, y desea obtener un entrenamiento más intenso por adelantado.
- Sabes que serás un gran servicio para este modelo, y quieres obtener descifrado especulativo gratis.
- Su tamaño oculto es de al menos 4096... en la escala 1B, los daños causados por la venta suelen superar los beneficios.

No está en condiciones de utilizarse:

- Modulo de MTP  aún no entrenado―
- En el estudio, usted desea tener una línea de base de calidad para hacer comparaciones.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-mtp-planner.md` Dado un pre-training de la operación de la configuración de los modelos, el modelo de la gran tamaño de datos, la computación, que regresará a un programa de MTP integrado:`lambda`el calendario, la memoria y la distribución de los cables de decodificación especulativa.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` mostrar con señal sintética 增强, per-depth loss 单调下降── modificación sintética, hacer que use un modo fijo,并验证 profundidad-1 和 profundidad-2 pérdida 收──

2. 计算一个密集70B 模型(oculto 8192,80 层) en el módulo D=1 MTP 下的参数开销──与 DeepSeek-V3 报告的 14B 开销进行比较──解释为什么 DeepSeek 的数字更高:MTP变压器块 继承了相同的MoE 结构,从而增加了每模块参数──

3. En el juego se realiza D=2: añadir un segundo módulo MTP, recibir h^(1) 并预测 `t_{i+2}` Verificación de pérdida conjunta 和 parametros de cálculo con las ecuaciones de DeepSeek paper 19-21 匹配──

4. 将玩具 切换为平行MTP(Gloeckle-style): en el estado oculto principal 之上添加D 个输出头,每预测不同的抵消――测量在同一个合成信号上,每次深度的损失与序列版本相比如何――对于 k > 1,sequential 版本应产生更低的深度-k损失,因为它在中间预测为条件――

5. Se ha de preparar un buen módulo MTP con un proyecto de estilo EAGLE:`t_{i+k}` En la secuencia de espera, medir estos proyectos de Token en comparación con el modelo principal de previsión de la tasa de aceptación.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | “额外 loss block” | 一个小型 transformer block 加 projection，用来预测主模型前方 `k` 个位置的 Token |
| Prediction depth | “哪个 offset” | 整数 `k`，使得 module `k` 基于截至位置 `i` 的 prefix 预测 `t_{i+k}` |
| Parallel MTP | “Gloeckle-style” | 位于同一个 backbone hidden state 之上的 D 个独立 heads，没有条件链 |
| Sequential MTP | “DeepSeek-V3 style” | 每个 module 都以先前 depth 的 hidden state 加下一个 Token 的 embedding 为条件；保留 causal chain |
| Shared output head | “复用主 head” | MTP modules 调用主模型的 LM head，而不是单独的 output projection |
| Shared embedding | “复用主 table” | 同一个 vocabulary embedding table 在所有地方使用；没有重复参数 |
| Projection matrix M_k | “结合 hidden + next-token” | 一个 `h x 2h` linear layer，将前一个 hidden state 和 target-token embedding 折叠为下一深度的输入 |
| Joint loss L_MTP | “平均额外 losses” | per-depth cross-entropy losses 的算术平均值，并按 `lambda` 缩放 |
| Acceptance rate at depth 1 | “MTP draft 多常正确” | D=1 MTP module 的 top-1 prediction 等于主模型 top-1 prediction 的比例；DeepSeek-V3 上超过 80% |
| Lambda weighting | “额外 loss 的重要性” | per-depth 缩放因子；DeepSeek-V3 在训练开始时为 0.3，之后为 0.1 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 完整的序列MTP 描述(Sección 2.2), incluyendo las ecuaciones de pérdida conjunta 和推理时的 1.8× 加速
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) Profundidad de búsqueda  diseño de la línea de base paralela de MTP
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 685B 总量(671B principal + 14B MTP),部署说明
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) MTP 所适配的 especulativo-decodificación 框架
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) Proyecto de arquitectura de 2025 de EAGLE, también MTP 竞争对应方案
