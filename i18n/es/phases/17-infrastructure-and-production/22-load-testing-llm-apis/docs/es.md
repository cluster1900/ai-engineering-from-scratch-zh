# Pruebas de carga de LLM API  ¿Por qué k6 y Locust 会说谎

> Los testadores de carga tradicionales no son para respuestas de transmisión, longitud de salida variable, métricas de nivel de token o GPU 和而设计的── la mayoría de los equipos serán atrapados en dos trampas. GIL 陷:Locust de Token 级测量在Python GIL 下运行代币化,在高并发时会与请求生成 竞争;tokenization backlog 随后将升高报告的交代币延迟  瓶在您的客户端,而不是服务器──快速一致性陷:循环中的相同提示只测试代币分布上点; 实流量有可变长度和多样的前置配对.`--mean-input-tokens`¿ Qué es eso ?`--stddev-input-tokens`修复这一点──2026 年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm) para su uso en Token 级准确性;**k6 v2026.1.0**¿ Qué es eso ?**k6 Operator 1.0 GA（2025 年 9 月）** streaming-consciente、Kubernetes nativo, a través de TestRun/PrivateLoadZone CRDs hacer distribuidos 测试, más adaptado a las puertas CI/CD; Vegeta utiliza para la saturación de velocidad constante Go; Localidad 2.43.3 只有配合 LLM-Locust extensión 才适用于流媒体──负载模式:steady-state、ramp、spike(autoscaling test)、soak(memory leaks)。

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**Fase 17 · 08 (Métricas de inferencia), Fase 17 · 03 (GPU Autoscaling)
**Time:** ~75 minutes

## El objetivo del aprendizaje
- 解释让通用负载测试器在LLM API 上说谎的两个反模式(GIL 陷、快速-uniformity 陷)
- 针对给定目的选择工具:LLMPerf(marca de referencia ejecutada) 、k6 + extensión de transmisión 、CI gate) 、guidellm(síntesis a gran escala) 、GenAI-Perf(NVIDIA referencia) ‖
- 设计四种负载模式 ((stable、ramp、spike、soak),并说出每种模式捕捉的失败模式──
- Utilize input tokens de media + stddev 构建真实的 distribución rápida, en lugar de una longitud fija。

##  problemas
Usted utilizó k6 测试 LLM endpoint, configurar 500 usuarios concurrentes.

Se produjeron dos cosas. Primero, k6 envió 500 instrucciones idénticas. Su solicitud de coleccionismo y caché de prefijos hace que parezca que está procesando 500 códigos simultáneos, pero en realidad simplemente está procesando uno. Segundo, k6 no rastrea las respuestas de transmisión de la latencia entre tokens de la experiencia humana. Ve una conexión HTTP, en lugar de 500 tokens que llegan a diferentes intervalos.

Las pruebas de carga de los LLM son una cuestión independiente.

## 概念
### GIL 陷(Locust)

Locust utiliza Python, y en el lado del cliente 于 GIL 下运行代币化.高并发时,Tokenizer 会排在请求生成后面.

修复:LLM-Locust extensión va a mover la tokenización 移到独立进程, o utilizar el arnés de lenguaje compilado(k6、 utilizar tokenizers.rs de LLMPerf) 』

### la rápida unificación

Todos los probadores de carga conocidos te permiten configurar un prompt. En 10,000 veces                                                                                                                                                                                                                                                     

修复: desde la distribución rápida 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` 长度多样, contenido多样.

### Cuatro modos de carga

1. **Steady-state** 以 constante RPS 运行 30-60 分钟──捕捉:baseline performance regressions──
2. **Ramp** En 15 minutos, el RPS aumentará de 0 线性 a valor objetivo.
3. **Spike** Subite a 3-10 veces RPS, dura 2 minutos después de la recuperación.
4. **Soak** estado estacionario 运行 4-8 小时――捕捉:memoria fuga connection-pool drift ∼observabilidad sobreflujo―

### 2026 工具映射

**LLMPerf**(Anyscale)  Python, pero tokenization by Rust 支持──Mean/stddev prompts──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** Referencia de NVIDIA── utiliza el cliente Triton; métrico 覆盖全面── atención su ITL no contiene TTFT;LLMPerf 包含── el mismo servidor 上两个工具会产生不同的 TPOT──

**LLM-Locust**(TrueFoundry) 修复 GIL 陷的 Locust extensión──熟悉的 Locust DSL + métricas de transmisión──

**guidellm** Referencia de gran tamaño de sintetizado。

**k6 v2026.1.0**¿ Qué es eso ?**k6 Operator 1.0 GA（2025 年 9 月）**¿Qué es esto ?
- Se ha creado un nuevo sistema de streaming.
- k6 Operador utiliza TestRun / PrivateLoadZone CRDs  realizar pruebas distribuidas nativas de Kubernetes―
- Lo mejor para las puertas CI/CD y las pruebas SLA.

**Vegeta** Go,比 k6 更简单──Constant-rate HTTP saturation── no posee capacidad de conocimiento de LLM, pero es adecuado para las pruebas de gateway/limit de velocidad──

**Locust 2.43.3 stock** Para LLM hay una trampa de GIL 🏼 sólo puede combinarse con la extensión de LLM-Locust 🏼

### Puerta de SLA en el centro de CI

En PR 上运行 k6,并使用:

- En la línea de base RPS abajo de cada 30-50 veces iteraciones.
- Puerta: P50/P95 TTFT、5xx < 5%、TPOT 低于值。
- 违规时让建设 失败──

### Verdaderas distribuciones rápidas

Desde el real flux sample construct (en inglés) o desde las distribuciones públicas (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct (en inglés) construct) construct (en inglés) construct (en inglés) con) con) con) con (en inglés) con) con) con (en inglés) con) con (en inglés) con) con (en inglés) con)  (en inglés)  (en inglés)  (en inglés) )  (en inglés)  (en)  (en)  (en)  (en) )  (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en)

### Debes recordar el número

- k6 Operador 1.0 GA:2025 年 9 月。
- k6 v2026.1.0: métricas de transmisión conscientes.
- 典型LLMPerf run:在同步 X 下 100-1000 solicitudes
- 典型CI gate: cada PR 30-50 iteraciones。
- Cuatro modos: estable, rampa, punta, sumergido.


```figure
load-pattern-waves
```

## Usalo
`code/main.py`模拟带有真实快速分布的负载测试, medir el TPOT efectivo,并演示 uniform-prompt 陷──

##  entregarlo
本课生成                       `outputs/skill-load-test-plan.md`△ dado la carga de trabajo y SLA 后, seleccionar herramientas y diseñar cuatro modos de carga―

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Comparación uniforme y distribución realista  差在哪里?
2. Por la puerta CI 编写 k6 script:在100 concurrent 下 TTFT P95 < 800 ms,tiempo de ejecución 5 分钟──
3. Su prueba de remojo muestra un aumento de memoria de 50 MB por hora.
4. Prueba de punta de 10 RPS a 100 RPS. Si Karpenter + vLLM producción-pillo está en su lugar, ¿fase 17 · 03 + 18), ¿cuánto tiempo de recuperación esperado?
5. GenAI-Perf en el mismo servidor 上 report TPOT=6ms;LLMPerf  report TPOT=11ms──explicar la razón──

## 关键术语: "El hombre es un hombre"
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
