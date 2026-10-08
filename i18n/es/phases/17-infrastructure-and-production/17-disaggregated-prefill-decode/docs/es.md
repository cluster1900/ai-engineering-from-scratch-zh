# Preempleo/descodificación desglosado  NVIDIA Dynamo 和 llm-d

> Prefill es computacional; decode es memoria-ligado. En el mismo bloque de GPU, el Planner Switch + SLA Planner se ejecutará automáticamente a la velocidad de distribución de un recurso. La desagregación los separará en un conjunto de recursos independientes, y los desglosará a través de NIXL. RDMA/InfiniBand o TCP fallback) entre ellos para transmitir KV cache. NVIDIA Dynamo. GTC 2025 发布,1.0 GA) se encuentra en vLLM/SGLang/TRT-LLM, así que su Planner Switch + SLA Planner se ejecutará automáticamente a la velocidad de distribución prefill: Desagregación Los modelos de diseño se dividen en recursos independientes, y se dividen en recursos independientes, y se dividen en recursos independientes, y se dividen en recursos independientes.$2M 级别推理支出上节省 30–40%（即 $600-800K/ año); esto es concreto.$2M→$600-800K números es un compuesto interno, no un solo estudio de caso publicado, debe considerarse como un punto de referencia, en lugar de referencia.

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## El objetivo del aprendizaje

- Explica por qué preemplir y decodificar tienen diferentes GPUs de distribución, y la colocación de la cantidad.
- draw out desagregada arquitectura: preemplir pool ‒decode pool ‒ a través de transferencia de KV ‒ enrutador de NIXL―
- Cuentan con una desagregación de condiciones de cálculo (short prompt, short output)
- 区分 NVIDIA Dynamo (en la pila arriba) y llm-d (en la versión original de Kubernetes),并把它们匹配对应的运维场景──

##  problemas

Usted está en 8 bloques H100 上运行 Llama 3.3 70B。在混合工作负载(长提示 + 短输出) 下,GPU 在解码期间空,因为大部分计算已花在预填上──在另一类工作负载(短提示 + 长输出) 下,情况相反──定位预填 +解码意味着你将对两者都过度配置──

 presupuesto: 20-40% de GPU  tiempo de gasto en recursos erróneos  ¿Estás comprando un H100 de computación  para ejecutar un decodificador de memoria o comprando un H100 de ancho de banda HBM  para ejecutar un preempleo de computación  ambos son costosos 

Desagregación 会把 prefill 和 decode 拆分到独立资源池,并按各自瓶进行尺寸化──KV cache 通过高带宽互连从prefill pool 传输到decode pool──

## 概念

### ¿Por qué es diferente?

**Prefill** Para el momento de entrada completa  ejecutar una vez el transformador hacia adelante―Multiplificaciones de matriz 占主导;computation-bound―H100 FP8 可提供约2000 TFLOPS的有效吞吐──Batch efficiency 很好,一次前可处理许多代币―

**Decode** 一次生成一个代币,每次代都读取完整重量──memoria-ancho de banda-limitado──HBM3 提供约3TB/s──Batch efficiency 只有在高 concurrency下才好,因为重量读会在批上分摊──

Colocarlas: Usted compra simultáneamente para dos GPU optimizadas. H100  ambos son buenos, pero sin importar el costo de uso es igual. En la escalación, usted desea preemplir el pool de uso H100 / computación pesada; decodificar el pool de uso H200 / memoria pesada, o acompañar la cuantización agresiva.

### 架构

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL es el transporte internodo de NVIDIA. Puede utilizar RDMA/InfiniBand, si no utiliza fallback TCP.

### Dinamo vs llm-d

**NVIDIA Dynamo**(GTC 2025 发布,1.0 GA):
- Como orquesta 位于 vLLM、SGLang、TRT-LLM 之上──
- Planner Profiiler 测量工作负载,SLA Planner Automatic Configuration prefill:decode 比例。
- Núcleo de resistencia, extensibilidad de Python.
- 吞吐提升:NVIDIA 报告称,在 GB200 NVL72 + Dynamo 上,DeepSeek-R1 MoE 在中等延迟区间达到6x(developer.nvidia.com,2025-06);社区关于全黑威尔 + 迪纳莫 + DeepSeek-R1堆多达30x 的报告缺少单一主要来源,应视为方向性信息──
- GB300 NVL72 + Dynamo: según Dynamo 产品页(developer.nvidia.com,未注明期),相比霍珀,MoE 吞吐最高可可达50x──

**llm-d**(Red Hat + AWS, nativo de Kubernetes):
- Preemplaje / decodificación / enrutador 作为独立 Kubernetes Services。
- Por rol HPA utiliza profundidad de cola (prefill) / KV utilización (decode)
- `topologyConstraint packDomain: rack`Se colocarán los clics de preempleo + decodificación en el mismo estante para lograr una transferencia de KV de alta banda ancha.
- llm-d 0.5(2026):descarga jerárquica de KV, enrutamiento de LoRA consciente del caché, en red UCCL, escala a cero.

Si quieres un orquestrador de pila, usa Dynamo. Si quieres primitivos nativos Kubernetes, y ya estás en el sistema CNCF, usa llm-d.

### 经济性

内部 composite (no es un solo estudio de caso publicado, sólo como un grado cuantitativo):

- El gasto de la distribución de los servicios colocados es de 2 millones de dólares anuales.
- 切换到使用 Dinamo de porción desagregada。
- La misma cantidad de solicitudes, la misma latencia P99 SLA.
- 报告节省:$600K–$800K/año (recibo de 30 a 40%)
- 无新增硬件──

Se obtiene este número de múltiples declaraciones de clientes, no de un solo estudio de caso citable; el punto de datos más cercano a la publicación es el enrutamiento Dynamo KV de Baseten  trae 2 veces más rápido TTFT / 61% más alto rendimiento  baseten.co,2025-10), así como VAST + CoreWeave en 4060% KV tasa de éxito  下预测 tokens/$ 增加 60130% vastdata.com,2025-12)  El ahorro proviene de cada fuente para realizar un tamaño correcto; pre-reemplazo 工作负载 带 8K+ prefixes RAG) con un balance de carga beneficiada más.

### ¿Cuándo no desagregar

- Las instrucciones < 512 tokens 且输出 < 200 tokens:传输税主导收益。
- 小型集群 ((< 4 GPUs): no hay suficiente diversidad de piscina。
- 团队 no puede transportar dos GPU pools y realizar escala por rol: Dinamo 会有帮助, pero no es sin complejidad.
- 没有 RDMA fabric: TCP transferencia de impuestos 更重──

### Router y fase 17 · 11 集成

Los routers desglosados son KV-cache-aware (fase 17 · 11)  la solicitud se cae hasta el grupo de decodificación de sus prefijos; si no se ajusta, se va preemplir → decodificar。 la tasa de éxito y la desagregación 会叠加收益, el router caché decide si incluso necesita un nuevo preempleo。

### El MoE de Blackwell es el único lugar realmente digital.

GB300 NVL72 + Dynamo  demostró en comparación con las líneas de base Hopper 50x de MoE 吞吐──MoE experto enrutamiento en preempleo arriba computación-pesado, pero en decodificación arriba memoria-pesado experto caches), por lo que la desagregación es doblemente beneficioso──2026 años modelo fronterizo que sirve 以 MoE 为主----DeepSeek-V3、未来 GPT-5 variantes)──

### Debes recordar el número

Indicador de cambios de números, NVIDIA y la pila de inferencias Cada trimestre todos los resultados de la publicación de actualización.

- GB200 NVL72 + Dynamo 上的 DeepSeek-R1:中等延迟区间相相比基线约 ~6x 吞吐(developer.nvidia.com,2025-06);社区关于全黑威尔 + 迪纳摩堆高达30x的说法是方向性聚合,没有单一的首要来源──
- GB300 NVL72 + Dynamo:相比 Hopper,MoE 吞吐最高可达 50x(desarrollador.nvidia.com,未注明期)
- 节省点(内部 composite, no un solo estudio de caso):$2M 年度支出中节省 $600-800K/ año.
- El límite de desagregación:compromete > 512 tokens + salida > 200 tokens。
-  Por transferencia de KV de NIXL: 70B FP8  4K-prompt KV 需要 20-80 ms──


```figure
prefill-decode-split
```

## Usalo

`code/main.py`模拟 colocated vs disaggregated serving── reporting throughput、cost per request, as well as prompt-length crossover──

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-disaggregation-decider.md` Dado la carga de trabajo y el grupo, el juicio sobre si debe desagregarse

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`¿En qué longitud rápida abajo, la desagregación será mejor que la colocación?
2. Para un largo prefijo P99 para 8K, salida para 300 de servicio RAG  diseño de preempleo y decodificación de la piscina.
3. Dynamo vs llm-d:为一家纯Kubernetes shop 选择一个方案,且没有Python runtime 偏好。
4. 计算 KV transfer cost:70B FP8 上 4K prefill = ~500 MB KV──在 RDMA 100 GB/s 下, transfer = 5 ms──在 TCP 10 GB/s 下 = 50 ms── ¿cuál afectará a su SLA?
5. ¿Cómo se presenta la desagregación de los diferentes expertos de MOE para cada token?

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “split prefill/decode” | 为每个阶段使用独立 GPU pools |
| NIXL | “NVIDIA transport” | Dynamo 的 inter-node KV transfer（RDMA/TCP） |
| NVIDIA Dynamo | “the orchestrator” | vLLM/SGLang/TRT-LLM 的 stack-above coordinator |
| llm-d | “Kubernetes native” | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | “Dynamo auto-config” | 测量工作负载，配置 pool ratios |
| SLA Planner | “Dynamo policy” | 自动按速率匹配 prefill:decode 以满足 SLOs |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放在同一 rack 上以实现快速 KV |
| UCCL | “unified collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “expert per token” | DeepSeek-V3 pattern；disaggregation 有帮助 |

## 延伸阅读

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
