# 综合项目 14  Descodage especulativo 推理服务器

> EAGLE-3 en vLLM 0.7 en el tráfico real trajo 2.5-3x 吞吐量. P-EAGLE (AWS 2026)  Preocupación paralela  SGLang's SpecForge extendió el entrenamiento de la cabeza de proyecto  Red Hat's Speculators hub  Aspect Open Model  Publicó un proyecto alineado  TensorRT-LLM  Lleve el descodage especulativo en NVIDIA  capacidades                                                                                                                                                                                                                                                                                                                                                                                                                    

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 小时

##  problemas
El descifrado especulativo en 2026 se convirtió en una mercancía. EAGLE-3 se convirtió en un proyecto de cabeza basado en el modelo objetivo  entrenamiento en estado oculto,并预测未来 N 个代币; el modelo objetivo en un solo paso se verificó. 60-80% de la tasa de aceptación se convertirá en 2-3x de la potencia de desglose de extremo a extremo. VLLM 0.7 原生集集集成了这一能力. SGLang + SpecForge 提供训练管线. Red Hat's Speculators为 Llama 3.3 70B、Q3-Coder-30B MoE、GPT-OSS-120B 发布一致的草案.

关键技术不在模型,而在服务运营中. 接受率会随流量分布漂移 (ShareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 发生拒绝 (shareGPT vs code vs domain data) 时的尾延迟比不使用投机更差,因此你必须报告多个批量 下的 p99,而不能只报告稳定状态代币/sec──相对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对.

## 概念
La descifrado especulativo tiene dos niveles.**draft**modelo (Eagle-3 head, ngram, or even smaller of target-aligned model) en cada paso se propone un token de selección.**target**Modelo en un solo paso 中验证全部 k 个 Token; cualquier prefijo aceptado puede sustituir el camino codicioso.

EAGLE-3 en la mayoría de los trámites es superior al borrador de gramos. P-EAGLE para un borrador más profundo.

Despliegue utilizando Kubernetes。vLLM 0.7 Cada GPU o tensor-parallel fragmento 运行一个复制──HPA 基于队等而不是 CPU自动扩缩容量──FP8 (Marlin) 和 INT4 (AWQ) quant 会让 GPU memory 保持在H100 / H200 的范围内──端到端报告包括吞吐量、接受率、批次 1/8/32 下的 p50/p99,以及 $/1M Token──

## 架构
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术
- Servidores: VLLM 0,7 o SGLang 0,4
- Métodos especulativos: cabezas de proyecto EAGLE-3  especulación paralela P-EAGLE  retroceso en gramos
- Formación de proyectos: SpecForge (SGLang) o Red Hat Speculators
- Modelos objetivo: Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- Cuantificación: FP8 (Marlin) ∞INT4 AWQ
- Despliegue: Kubernetes + NVIDIA dispositivo de complemento; basado en la métrica de espera en fila de HPA
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval, para medir la tasa de aceptación entre dominios
- Referencia: Descodación especulativa TensorRT-LLM, como línea de base del proveedor


```figure
cf-spec-decode
```

## Construirlo
1. **Target model prep.**选择 Llama 3.3 70B──a través de Marlin cuantizar hasta FP8──en 1xH100(o 2x tensor-paralelo)

2. **Draft source.**Desde Red Hat Speculators 拉取 alineado EAGLE-3 draft head (en inglés)  o a través de SpecForge 训练一个)                                                                                                                                                                                                                                                                                                           

3. **Baseline numbers.**En especulación 之前:batch 1/8/32 下的代币/s、p50/p99 latencia、GPU utilización──发布结果──

4. **Enable EAGLE-3.**切换 config; volver a ejecutar el mismo benchmark― report speedup、 accept rate、p99 tail-latency delta―

5. **P-EAGLE.**Activación de la especulación paralela; medición de la diferencia entre el árbol de proyección más profundo y el EAGLE-3 de serie                                                                                                                                                                                                                                              

6. **Domain traffic.**Se puede utilizar para compartir GPT, HumanEval y tráfico específico de dominio a través del mismo servidor, operando en función de la tasa de aceptación de la medición distribuida, y para identificar los requisitos de la derivación.

7. **Second target model.**En Qwen3-Coder-30B MoE 上运行同一管线──Draft 更棘手(MoE enrutamiento ruido)──报告结果──

8. **K8s HPA.**En K8s, la policía no deja que el HPA lo siga.`queue_wait_ms`◊ mostrar la carga cambió por tres veces en el tiempo de escalado.

9. **Cost comparison.**En la misma evaluación 上计算 $/1M Token,并与人类克劳德索内特4.7 和 OpenAI GPT-5.4比较──发布结果──

## Usalo
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

##  entregarlo
`outputs/skill-inference-server.md`描述 deliverable──一个经过测量的、带投机式解码的服务堆,一个完整的基准报告,以及一个K8s部署──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

##  ejercicios
1. Cuando se elabora un proyecto, se realiza una versión posterior de la misma, por ejemplo, Llama 3.3 -> 3.4 drift, se mide la degradación de la tasa de aceptación, se construye una alerta de monitoreo, se evalúa la tasa de aceptación y se evalúa la tasa de degradación de la alerta.

2.  lograr el retroceso de los gramos: si la tasa de aceptación de EAGLE-3 es inferior a un umbral determinado, entonces se cambia a un proyecto de gramos―;

3. 运行一个受控MoE experiment:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音两种情况对比──测量草案接受敏感性──

4.  Expandir hasta H200 (141 GB) ⋅ report cada réplica ⋅ obtener el tamaño del modelo de la cabeza, así como si se puede servir a una Llama 3.3 70B ⋅

5. En el mismo hardware H100, el valor de referencia TensorRT-LLM es el decodificación especulativa.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) pila de servicio de referencia
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) papel paralelo de decodificación especulativa + integración
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) Línea de formación de la cabeza de proyecto
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) centro de proyección alineado
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) Alternativa de proveedor
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) Referencia comercial
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) Papel de método
- [vLLM repository](https://github.com/vllm-project/vllm) código y valores de referencia
