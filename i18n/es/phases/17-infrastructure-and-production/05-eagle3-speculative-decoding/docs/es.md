# Descodage especulativo EAGLE-3 en el ambiente de producción

> El descifrado especulativo se convertirá en un modelo de proyecto rápido y se asociará con el modelo objetivo. El proyecto propone K 个 Token; el objetivo en una sola vez en el futuro. El token aceptado es gratuito. Hasta 2026, EAGLE-3 es una variable de producción, que se encuentra en los estados ocultos del modelo objetivo.

**类型：**El aprendizaje
**语言：**Python(stdlib, simulador de tasa de aceptación de los juguetes)
**先修要求：**Fase 17 · 04(vLLM Servir a los Internos),Fase 10 · 18(Predicción de múltiples tokens)
**时间：** 60 minutos

## El objetivo del aprendizaje

- En palabras de la tercera generación de la descodificación especulativa,并解释Eagle-3 相比Eagle-2 和经典草案模型 改变了什么──
- definición de tasa de aceptación alfa, según alfa 和 K(duración del borrador) calcular el esperado acelerar,并识别目标并发下
- Explicar por qué el descifrado especulativo en vLLM 2026 es opt-in (no-defendido), y por qué no mide alfa en su inicio es producción-en-modo.
- 写出测量计划: utilizar qué índice de referencia, qué distribución rápida, qué punto de concurrencia, qué métrica, como la línea de entrada.

##  problemas

El decodificación es de memoria-limitada. En una operación Llama 3.3 70B FP8 de H100, cada Token decodificado 会读取约140 GB/s的权重并输出一个 Token──GPU computación En el decodificación 期间 casi空,瓶是HBM bandwidth, y no matmul throughput──

La descifrado especulativo aprovechó esta diferencia. Utilizó un modelo de proyecto barato para producir K 个候选标记, luego hizo que el modelo objetivo en un solo pase adelante, verificara todos los K 个. Cada token que pasó fue verificado.

经典草案模型 方法使用同一家族的更小模型(Llama 3.2 1B 为 Llama 3.3 70B起草案)  它能工作,但接受率一般,因为更小模型的分布会偏离目标──EAGLE、EAGLE-2,再到EAGLE-3,直接在目标模型的内部状态上训练轻量草案头,因此草案的分布更紧跟目标──这就是为什么alpha会从草案模型的0.4升至EAGLE-3的0.6-0.8──

关键限制:EAGLE-3 在 vLLM 2026 中是选择进.`speculative_config` sin bandera,  sin aceleración.  Si el equipo no mide el flujo real alfa, se abre directamente, verá a menudo la latencia de cola 变差, en lugar de变好.

## 概念

### Descodación especulativa  realmente trajo que

没有 especificación decodificar 时, cada token de costo es una meta de adelanto. 时, cada token de adelanto de destino es el número de espera 时, cada token de adelanto es el número de espera 时, cada token de adelanto de destino es el número de espera 时, cada token de adelanto de cada token es el número de espera 时, cada token de adelanto de cada token de destino es el número de espera 时, cada token de adelanto de cada token de destino es el número de espera 时, cada token de adelanto de cada token de destino 时, cada token de adelanto de cada token de un token de destino 时, cada token de adelanto de un token de un token de un token de un token de un token de un token de un token de un token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro token de otro.`1 + K * alpha`◊ acelerar que es `(1 + K * alpha) / (1 + epsilon)`, de los cuales el epsilon es el costo general de proyecto más verificación.`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`◊ Los números del mundo real se concentran normalmente en 2-3x, porque el alfa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

### ¿Por qué el alfa es la única métrica importante?

Los Tokens rechazados no desaparecerán, se obligarán a que el primer Token rechazado realice un segundo objetivo adelante. En la carga de trabajo de alfa  disminuye a 0.4, debes pagar el proyecto de gastos generales, así como la revisión, así como la re-rollación. Por ejemplo, 256 concurrencias), el lote de decodificación  ya es suficiente, el objetivo solo  y el objetivo con verificación  la diferencia entre el ancho de banda de memoria  se reducirá                                                                                                                                                                                                        

Alpha 会随着工作负载变化──在 ShareGPT 风格的通用聊天天天, con ShareGPT 训练的 EAGLE-3 能达到0.6-0.8──在域特定流量(code、medical、legal) 上,使用通用数据训练的草案头 会降至0.4-0.6──训练域特定草案头可以恢复 alfa;相比,与目标细节调整,这是一个轻量、快速的训练任务──

### ÁGuila 代际一览

- **经典 draft model**La base de datos es simple, carga dos modelos, borrador Cada vez objetivo adelante 运行 K 次 次 前面。
- **EAGLE-1（2024）**En el estado oculto del objetivo, hay una pequeña cantidad de parámetros sobre el objetivo.
- **EAGLE-2（2025）**El proyecto de programación de proyectos de la organización de la organización de la organización de la organización de proyectos de la organización de proyectos de la organización de proyectos de proyectos de la organización de proyectos de proyectos de la organización de proyectos de proyectos de la organización de proyectos de proyectos de la organización de proyectos de proyectos de la organización de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de la organización de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos de proyectos
- **EAGLE-3（2025-2026）**:Drafto cabeza en varias capas objetivo 上训练((不只是最后一层), alineamiento 更好──通用聊天天阿尔法 约 0.6-0.8──

### 2026 Cuota de producción

1. Antes en el modo ordinario en línea modelo objetivo.
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `speculative_config`Initiar el proyecto de EAGLE-3―Rehabilitar el marco de referencia―
3. 记录 率接受率 alpha──vLLM V1 将其报告为 `spec_decode_metrics.accepted_tokens_per_request`除以要求草案长度 即可得到alpha
4. Si la distribución de producción de flujo 上 alfa < 0.55, desactivar el código de especificaciones, o entrenar el borrador EAGLE-3 específico del dominio.
5. En producción并发下重新运行── confirmar P99 ITL 没有变差──

### 生产陷:P99 cola

Descodificación de especificaciones 会降低 mean ITL──如果没有调优,P99可能变差──被拒绝的草案会触发两段式序列(草案 + verify-fail + rollo)──在满批 下,这两次通过 会串行化──关注 P99 ITL,而不是 P50──

### EAGLE-3 ya está desplegado en

Google en 2025 AI Overviews ha implementado un decodificación especulativa (la misma calidad, respuesta más rápida)`speculative_config`作为文档化接口发布;En V1 de N-gram GPU de descifrado especulativo es兼容 碎片 prefill的变体──SGLang 支持 EAGLE-3,并将其作为预写-heavy workloads 的推草案路径──

### Una línea de equilibrio matemático

预期加速:`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`¿Qué es eso?`S = 1`¿Qué es eso?`alpha_breakeven = verify_overhead / K` Para el tipo de facturación de sobrecarga ≈ 0,15 ≈ K=5:`alpha_breakeven = 0.03`▽ pero es el decodificador original 数学──在高并发下, verificar sobrehead 会上升, mientras que decodificar lote 已 distribuye la memoria entre varias secuencias, por lo que en la práctica el alfa_breakeven válido 会爬升到约0.45-0.55──

### 什么时候 no usar el decodificación especulativa

- Batch-1 离线生成,且延迟不重要──使用普通目标──
- 输出很短(< 50 Token) ――Ejecución general y verificación de costes 占主导。
- 没有 dominio-entrenado jefe de reclutamiento 专业领域──Alpha 太低──
- vLLM v0.18.0 加 proyecto de modelo de especificación de código 加 `--enable-chunked-prefill`◊ Este conjunto no puede ser compilado. La excepción de la documentación es el decodificación de especificaciones de GPU N-gram en V1.


```figure
mx-speculative-tree
```

## Usalo

`code/main.py`En una serie de valores alfa y longitud del borrador K 上模拟有无投机式解码的解码循环──它会打印破等 alpha、测得的速度和尾行行为──在多个 (alpha, K) 组合上运行它,准确观察投机式解码 在哪里不再划算──

##  entregarlo

本课产 出  `outputs/skill-eagle3-rollout.md` Dado un modelo objetivo  distribución del tráfico  descripción y objetivo de concurrencia, generará un plan de implementación EAGLE-3 de la fase: referencia de referencia  configuración hable  medida alfa  alfa >= 0,55  observación P99 ITL 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿Cuál es la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la velocidad de la veloc
2. 假设生产流量由70%通用聊天、30%代码 组成──通用聊天在使用ShareGPT 训练的EAGLE-3 上达到alpha 0.7;代码 达到alpha 0.4──混合alpha 是多少?
3. 阅读 vLLM `speculative_config`文档──说出三种模式(drafts model、EAGLE、N-gram), así como cualquiera de las formas de preemplazo en pedazos de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de
4. Activación de EAGLE-3  Después ves que el ITL medio baja un 25%, pero el P99 ITL sube un 15%―
5. 计算 Llama 3.3 70B de EAGLE-3 proyecto de memoria costo. ¿Cómo se compara con Llama 3.2 1B 作为经典草案 运行相比?

## 关键术语: "El hombre es un hombre"

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Speculative decoding | “draft plus verify” | 用便宜模型提出 K 个 Token，在一次 target forward 中验证全部 K 个 |
| Acceptance rate alpha | “spec accept rate” | draft Token 被 target 接受的比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值 4-8 |
| Verify overhead epsilon | “spec overhead” | verify-and-reroll 相比普通 target forward 的额外成本；随 batch 增长 |
| EAGLE-3 | “latest EAGLE” | 2025-2026 变体；在多个 target layers 上训练 draft head；通用聊天上 alpha 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中显式 opt-in；没有默认值就没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中 N-gram lookups 的 GPU-side draft；兼容 chunked-prefill |
| Break-even alpha | “no-op alpha” | spec decode 提供零加速时的 alpha；在生产并发下关注它 |
| Rejected-draft two-pass | “reroll cost” | drafts 被拒绝时发生两次 target forward；推高 P99 tail |

## 延伸阅读

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/)¿ Qué es esto ?`speculative_config`Y V1 En piezas de preempleo 兼容性权威来源──
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) 精确字段集合──
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) 原始 Eagle draft-head 表述──
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) proyectos adaptativos 和 árboles。
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) Utiliza el sistema de decodificación especulativa de LLM de alto rendimiento。
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) Lista de control de la implementación de la producción。
