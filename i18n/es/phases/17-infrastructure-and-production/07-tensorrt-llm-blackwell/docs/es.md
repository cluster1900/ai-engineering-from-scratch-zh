# En Blackwell, la FP8 y NVFP4 se ejecutan con TensorRT-LLM.

> TensorRT-LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        $0.012，而 H100 + vLLM 为 $Esta pila es la primera en la que se puede usar el software de control de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**Fase 17 · 04 (VLLM Serving Internals), Fase 10 · 13 (Cuantización)
**Time:** ~75 分钟

## El objetivo del aprendizaje

- 解释为什么即便权重使用NVFP4,FP8对KV缓存 和注意 仍然关键──
- 计算边界模型 在 BF16、FP8 和 NVFP4 下的HBM footprint,并推理节省来自哪里──
- Cuentan que el TRT-LLM utiliza características de Blackwell (día-0 FP4 ‒MTP ‒servicio desagregado ‒primitivos de todo a todo) ‒
- 判断什么时候 TRT-LLM de NVIDIA-lock 值得使用交换相对Hopper 上 vLLM de 7x 成本差距──

##  problemas

La respuesta depende de cuatro niveles de superposición: hardware代际(Hopper H100/H200 vs Blackwell B200/GB200) 精度(BF16 → FP8 → NVFP4) ✓ motor de servicio(vLLM vs SGLang vs TRT-LLM) y el modo de clasificación(plain vs disagregated vs Dynamo) 

En Hopper + vLLM 上,120B MoE de costo de operación de aproximadamente por millón de tokens ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0.012,便宜 7x── una parte de la diferencia proviene de hardware(Blackwell's Single GPU LLM 吞吐相对Hopper 高 11-15x)── otra parte proviene de la pila:FP4 权重、MTP draft、disagregado prefill/decode, así como el NVLink 5 todo a todo para la comunicación de expertos de MoE──

Usted no puede reproducir esto fuera de la pila NVIDIA. Esto es lo que se debe hacer: usar la capacidad de transferencia para cambiar la economía.

## 概念

### ¿Por qué FP8 sigue siendo la base de KV cache

Un error común del año 2026 es: suponer que NVFP4 puede aplicarse en todos los lugares.

NVFP4(2025-2026) se aplica a la carga y el valor de activación. La microescalación: cada bloque de carga tiene su propio factor de escala, por lo que el pequeño bloque puede cubrir diferentes rango de movilidad, sin sufrir pérdida de escala por tensor.

典型 Blackwell 配置:

- 权重:NVFP4 ((microscalación de 4 bits) ⋅
- 激活值:NVFP4──
- El caché de KV:FP8。
- Acumulador de atención:FP32 ((softmax 稳定性) ⋅

### TRT-LLM utiliza Blackwell características primitivas

- **Day-0 FP4 weights**Modelo de suministro de información: FP4 权重; TRT-LLM 无需后培训转换即可加载;;FP4 不需要 AWQ / GPTQ 步骤。
- **Multi-token prediction (MTP)**Con EAGLE: La fase 17 · 05)
- **Disaggregated serving**: prefill 和 decode 位于 GPU pools independientes, KV cache 通过 NVLink o InfiniBand 传输──与 Dynamo(Fase 17 · 20)
- **All-to-all communication primitives**: NVLink 5 reducirá la latencia de comunicación experta de MoE en comparación con Hopper  reducir 3x──TRT-LLM de los núcleos de MoE  para ello se realizó una modificación─
- **NVFP4 + MXFP8 microscaling**: Blackwell Tensor Cores 上的硬件加速尺度-factor 处理──

### Debes recordar el número

- HGX B200                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
- GB200 NVL72  通过 Dynamo 编排 TRT-LLM) alcanza el token de $0.012/M.
- H100 + vLLM en carga de trabajo comparable por encima de $0.09 / M Token.
- TRT-LLM 更新三月带来 2.8x 吞吐增益(2026)。
- Blackwell comparado con la LLM de Hopper de GPU 吞吐为11-15x──
- MLPerf Inference v6.0(2026 年 4 月):Blackwell 主导每个提交任务──

### FP4 en el precio real de la calidad

NVFP4 很激进──在 razonamiento-heavy workload ((cadena de pensamiento、mathematics、长上下文 code-gen) 上,FP4 权重会明显退化──Per-block calibración puede aliviar, pero no eliminar──Equipo de modelos de razonamiento usualmente usan FP8 权重 + FP4 激活值作为折中, o persisten en H200 上全程使用 FP8──

规则: en compromiso de usar NVFP4 权重前,始终在你的评估设上验证任务质量──

### ¿Por qué es una NVIDIA-bloqueo  decisión

TRT-LLM es C++ + CUDA + kernels de código cerrado。 el modelo necesita para un SKU de GPU específico 编译。 no apoya AMD, no apoya Intel, no apoya ARM。 si tu infra estrategia es multivendor, entonces TRT-LLM es imposible para el nivel servido de TRT-LLM; todavía puedes usar el servicio vLLM en hardware mixto。 si es sólo NVIDIA, entonces 7x 差足以为锁付。

### Cuadro de uso práctico 2026

 Para la factura de cálculo anual de $100M+, la operación Hopper + vLLM 会留下 7-10x 的优化空间──把成本主导型工作负载 迁移到布莱克威尔 + TRT-LLM + 迪纳莫──把实验层保留在H100 + vLLM 上,以获得模型代速度────每一个 NVFP4转换的模型上生产前都必须验证质量──

### Bonos de desagregación

La división de la TRT-LLM se encuentra en la fase 17 · 20 en el centro de la profundidad de la conferencia. En Blackwell, la multiplicidad de la cantidad de la carga:FP4 权重 × MTP aceleración × la colocación desagregada × cache-consciente de la ruta;.


```figure
pipeline-parallel
```

## Usalo

`code/main.py`Las características de los modelos de cálculo son: HBM footprint, decode throughput, memory-bound regime, y $/M-token: H100 + BF16 + vLLM, H100 + FP8 + vLLM, B200 + NVFP4/FP8 + TRT-LLM.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-trtllm-blackwell-advisor.md` Dado el volumen de tokens de cada año, se juzgará si Blackwell + TRT-LLM está en valor de NVIDIA-lock.

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Para un parámetro activo de 120B MoE, calcula H100 BF16、H100 FP8 y B200 NVFP4/FP8 en un rendimiento de decodificación limitado de ancho de banda de memoria―¿De dónde proviene el mayor aumento?
2. 某客户每年在H100 + vLLM 上花费2M$. Considerando la diferencia económica 7x, ¿necesitan comprar cuántos GPUs Blackwell para pasar en 12 meses a la distribución de TRT-LLM?
3. NVFP4 权重转换后, usted en MATH 上看到准确率下降 3 个点──说出两条恢复路径:一条质量第一(保留FP8 权重),一条成本第一(使用域内数据做校准)──
4. 阅读MLPerf v6.0 resultados de inferencia ―¿Cuál es la menor diferencia entre Blackwell y Hopper?
5. 计算 405B 模型在 NVFP4 权重 + FP8 KV cache、128k contexto 下所需的HBM──¿Puede ser instalado en un solo GB200 NVL72 节点?

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) 2026 年 4 月 MLPerf 结果──
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) NVLink 5 todo a todo con los núcleos de MoE。
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方 engine 文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) Orquestación desagregada en TRT-LLM 之──
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
