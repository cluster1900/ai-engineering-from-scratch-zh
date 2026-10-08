# Metricas de inferencia  TTFT、TPOT、ITL、Goodput、P99

> El TFT es el preempleo 加队加网络──TPOT(valor igual a ITL) es el decodificación de memoria-vinculada de cada token 成本──端到端延迟是 TTFT加上 TPOT 乘以输出长度──Throughput es toda la flota 聚焦后每秒的代币 数──Pero para el producto lo que realmente importa es el buen rendimiento: al mismo tiempo satisfacer la proporción de cada SLO requisito──在低好put的下高输出意味着你正在处理无法在用户的代币中到达──2026年 TRT-LLM 上 Llama-3.1-8B-Instruct 数字的参考: mean TTFT 162 ms, mean TPOT 7.33 ms, mean E2E 1,093 ms, mean E2E 1,093 ms, mean PTFP50P90p9 DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA DATA 

**Type:** 学习
**Languages:** Python（stdlib，玩具版 percentile calculator 和 goodput reporter）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 60 分钟

## El objetivo del aprendizaje
- 精确定义 TTFT、TPOT、ITL、E2E、roughput 和 goodput,并指出每个指标测量的组件──
-  Explicar por qué significa para el LLM servir para decir que es incorrecto estadística, así como cómo leer P50/P90/P99¬
- 构建一个SLO multi-constraint (también conocido como TTFT<500 ms Y TPOT<15 ms Y E2E<2 s),并根据此计算 goodput──
- Para explicar las razones, se han mencionado dos instrumentos de referencia que no coinciden en el mismo funcionamiento con respecto a TPOT.

##  problemas
 Nuestro rendimiento es de 15.000 tokens por segundo.¿Qué pasa? Si el 40% de las solicitudes de terminación exceden los 2 segundos, el usuario ya ha abandonado la sesión.

La inferencia tiene varias latencias 轴, cada eje de fracaso de modo todo diferente. El prefijo es computacional,并随即时长 扩展. Decode es memoria-bound,并随批量 扩展. El retraso en la cola es un problema operativo.

## 概念
### TTFT  tiempo para el primer token

`TTFT = queue_time + network_request + prefill_time`

Cuando las instrucciones 很长时,预填占主导──En el Llama-3.3-70B FP8 de H100 上运行的, un prompt de 32k 需要约800 ms de prefill.

### TPOT / ITL  latencia entre tokens

Con una cantidad hay muchos nombres.`TPOT`(tiempo por token de salida)`ITL`(latencia entre tokens)`decode latency per token`Todo es lo mismo. Es el primer token. Después, continuamente se transmite el tiempo entre los tokens.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

En la misma secuencia con preempleo en pedazos de la pila Llama-3.3-70B H100 arriba, TPOT media 约为 7 ms。 sin preempleo en pedazos 时,当相邻序列 正在执行长预填, TPOT可能高达50 ms。关注 P99,而不是 media。

### La latencia E2E

`E2E = TTFT + TPOT * output_tokens + network_response`

对于长输出(>500 Token),E2E por TPOT 主导──对带长提示的短输出,E2E por TTFT 主导──报告按输出长度分组的 E2E──

### Capacidad de transmisión

`throughput = total_output_tokens / elapsed_time`

聚合指标──te dice la eficiencia de la flota── no puedo decirte el estado de salud de una sola solicitud──

### Goodput  Tu verdadero interés de indicador

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO es una restricción múltiple. Sólo cada restricción se satisface cuando una solicitud es buena.

Para 2026, Goodput ya se ha convertido en una de las presentaciones de MLPerf Inference v6.0 y en indicadores de uso de los proveedores de plataformas de IA en el seguimiento interno de SLA.

### ¿Por qué significa que es una estadística errónea?

Las distribuciones de latencia de LLM son de derecha. En un lote de decodificación, si hay una solicitud de proximidad de preemplinio, puede haber 500 tokens TPOT de aproximadamente 7 ms, mientras que hay 20 tokens TPOT de aproximadamente 60 ms.

始终报告三元组(P50、P90、P99)。 para la experiencia del usuario, P99 才是你要优化的指标──

### Números de referencia  TRT-LLM 上的 Llama-3.1-8B-Instrucción, 2026

- TTFT medio: 162 ms
- TPOT medio: 7,33 ms
- medias E2E: 1,093 ms
- P99 TPOT: 取决于分碎预填配置, usualmente varia entre 10-25 ms.

Estos son puntos de referencia de NVIDIA. Estos se basan en el tamaño del modelo.

### La trampa de medición

Las dos herramientas de referencia más utilizadas en 2026 darán resultados diferentes en relación con el TPOT en la misma operación:

- **NVIDIA GenAI-Perf**: в ITL 计算中排除 TTFT──ITL 从 Token 2 开始──
- **LLMPerf**:incluye TTFT──ITL 从 Token 1 开始──

 Para un TTFT de 500 ms  100 tokens de salida  Total decodificación de 700 ms  GenAI-Perf  report `ITL = 700/99 = 7.07 ms`,LLMPerf  informe `ITL = 1200/100 = 12.00 ms`❖ herramienta para seleccionar y cambiar el número.

始终说明使用了哪个工具──始终发布定义──

### Construir un SLO

El modelo de chat 70B de los consumidores en 2026:

- TTFT P99 <= 800 ms¬
- TPOT P99 <= 25 ms¬
- Para <300-Token 输出,E2E P99 <= 3 segundos
- Objetivo de rendimiento >= 99%:

Las SLOs empresariales se reunirán TTFT ((200-400 ms) y se ampliarán E2E―.

### Cómo medir

- 运行真流量或逼真合成(LLMPerf 使用 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`)。
- El objetivo de la ejecución de benchmark es 2x la concurrencia máxima.
- 运行 30-50 veces iteración,对合并样本取百分比──
- 发布时包含 herramienta nombre, herramienta versión, modelo, hardware, competencia, distribución rápida,


```figure
throughput-latency
```

## Usalo
`code/main.py`Es una versión de juego de la calculadora de rendimiento. Produce distribución de latencia sintética, aplica SLO,并 calcula el rendimiento. También muestra la misma traza de la diferencia entre la TPOT de GenAI-Perf y LLMPerf.

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-slo-goodput-gate.md` Dado una carga de trabajo y SLO, generará una receta de referencia de CI/CD, con buena potencia y no en potencia para el despliegue de la puerta 

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Produce con un 1% de aumento de la cola  Cuando se coloca P99 TPOT de 30 ms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
2. 某供应商 引用 Llama 3.3 70B H100 上 15,000 tok/s──在相信之前,应提出哪三个问题?
3. ¿Por qué el preempleo en pedazos puede proteger P99 TPOT, pero no puede proteger el TPOT medio?
4. Para el asistente de voz  construir un SLO de consumo  primer token es escuchado, en lugar de ser leído                                                                                                                                                                                                                                                 
5. 阅读LLMPerf README 和 GenAI-Perf docs── encontrar otros tres instrumentos que definen los indicadores incompatibles──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；在长 prompts 下由 prefill 主导 |
| TPOT | “time per output token” | 首个 Token 之后每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在大多数工具中与 TPOT 相同（不是全部，见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上 response-side network |
| Throughput | “tok/s” | Fleet efficiency；没有 latency percentiles 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足每个 SLO constraint 的请求比例 |
| P99 | “tail” | 百分之一最差情形 latency；用户体验指标 |
| SLO multi-constraint | “the joint” | 三个 latency bounds 的 AND；只要违反任意一个，请求就失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 工具对 ITL 是否包含 TTFT 的定义不一致 |

## 延伸阅读
- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) TTFT、ITL、TPOT de la autoridad definida。
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) 替代定义与测量配方──
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) Real despliegues 上的 aplicada medición。
- [LLMPerf](https://github.com/ray-project/llmperf)  Basado en el índice de referencia de código abierto de Ray.
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html) Herramienta de referencia de NVIDIA。
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) el índice de referencia de buena calidad, aceptado por la industria.
