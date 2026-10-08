# Cuantificación de la producción  AWQ, GPTQ, GGUF K-quants, FP8, MXFP4/NVFP4

> El formato de cuantización no es una opción general, sino una función del motor de hardware, de servicio y de carga de trabajo. GGUF Q4_K_M o Q5_K_M                                                                                                                                                                                                                                         

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## El objetivo del aprendizaje
- Explicar los seis formatos de cuantificación de la producción en 2026 y sus mejores escenarios de uso:
- En la actualidad, el sistema de gestión de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de datos de la red de datos de datos de la red de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de datos de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet de Internet
- 计算选的格式节省的重量内存, así como el caché KV no afectado
- Encuentro de modelos cuantificados en el tráfico de dominio 陷──

##  problemas
La cuantización reducirá la memoria y el ancho de banda HBM, y esto es lo que se necesita para decodificar. Un modelo FP16 70B tiene 140 GB de peso.

Pero la cuantificación no es gratuita. La cuantificación de forma progresiva disminuye la calidad, especialmente en tareas pesadas de razonamiento. Diferentes formatos se adaptan a diferentes motores. Diferentes equipos.

## 概念
### Los seis formatos

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/edge 默认选择

GGUF es un formato de archivo, en sí mismo no es un esquema de cuantificación, que incluye variantes K-cuánticas ((Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0)), envasado en un recipiente en el que se encuentra el sistema de producción por defecto, en 4-5 bits, en un punto de proximidad al BF16 质量.

En el vLLM, el rendimiento de la CPU es de 7B, pero no se utiliza en los núcleos de GPU.

### GPTQ  vLLM 中的 multirlo

GPTQ es un algoritmo de cuantización post-entrenamiento, con un paso de calibración.

Su ventaja única: GPTQ-Int4 en vLLM apoya los adaptadores LoRA。 Si quieres servir un modelo base con 10 a 50 variantes afinadas, cada una como una LoRA, GPTQ es tu camino―hasta principios del año 2026, NVFP4 aún no apoya a LoRA。

### AWQ  GPU de centro de datos 默认选择

Cuantización de peso consciente de activación, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantización de peso, cuantificación de peso, cuantificación de peso, cuantificación de peso, cuantificación de peso, cuantificación de peso, cuantificación, cuantificación de peso, cuantificación, cuantificación de peso, cuantificación, cuantificación, cuantificación, cuantificación, cuantificación, cuantificación, cuantificación, cuantificación, cuantificación, etc.

Además de que necesites múltiples LRAs (GPTQ) o activar Blackwell FP4 (NVFP4), o bien un nuevo servicio de GPU (GPU)  seleccionar AWQ (GPU).

### FP8  Capacidad de trabajo de la empresa

Punto flotante de 8 bits──近似无损──支持广泛──Hopper Tensor Cores 原生加速FP8──Blackwell 继承这一点──当质量不可妥协时(理性、医学、代码-gen),FP8 es una opción de seguridad de 2026 años──Memory savings es la mitad de INT4, pero el riesgo de calidad es mucho menor──

### MXFP4 / NVFP4  Blackwell 激进选择

La microescalada FP4― cada bloque de peso tiene su propio factor de escala―, pero en los Blackwell Tensor Cores arriba hay hardware aceleración―, en comparación con FP8, reducirá a la mitad el número de bits de tokens, esto es la Fase 17―07 de la economía de ganancia―.

Nota:
- Aún no hay apoyo de la LoRA (la organización de la lucha contra la pobreza)
- El trabajo de la empresa se ha convertido en un trabajo de gran alcance.
- 必須在你的評估組上逐模型驗證──

### La trampa de calibración

AWQ y GPTQ  necesitan un conjunto de datos de calibración, generalmente C4 o WikiText。 para modelos de dominio(código médico、legal), con texto web general hacer calibración, hará que el algoritmo sobre qué derechos debe protegerse tome un error de juicio。HumanEval 上的 Pass@1 可能下降几个点。

修复方式: utilizar datos en dominio hacer calibración. 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇 〇          〇                                                                                                                                                     

### La trampa de caché KV

AWQ Colocar el peso en 4 bits;. KV cache es separado, y mantiene FP16/FP8。 Para el modelo 70B de AWQ:

- Peso: aproximadamente 35 GB ((desde 140 GB INT4 y viene)
- 128 并发 × 2k contexto 下的 KV caché: aproximadamente 20 GB。
- Actividades: alrededor de 5 GB.
- Total: alrededor de 60 GB, se puede colocar en H100 80 GB.

El modelo se ha dimensionado a 4 GB, pero se olvidará de 30 a 50 GB.

Además, la cuantización de caché de KV (FP8 KV o INT8 KV) es otra opción, tiene sus propios inconvenientes, que afectará directamente la precisión de la atención, no los beneficios de gratis.

### AWQ INT4 para el razonamiento

En la cadena de pensamiento, matemáticas, código-gen de contexto largo, estas tareas se verán claramente afectadas por la intensificación cuantitativa.

### Guía de selección 2026

- Servicio de CPU/ borde: GGUF Q4_K_M──完成──
- GPU sirve chat de rutina, sin LORA.
- GPU servir multi-LoRA: GPTQ de Marlin
- Carga de trabajo de razonamiento:FP8。
- Centro de datos Blackwell 质量已验证:NVFP4 + FP8 KV
- No está claro: para cada candidato, se ejecuta una evaluación de 1.000 muestras.


```figure
gpu-memory-breakdown
```

## Usalo
`code/main.py`Se trata de una serie de modelos de tamaño, calcular seis tipos de forma de huella de memoria (peso + KV + activaciones) y de rendimiento relativo.

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-quantization-picker.md` Dado el hardware, el tamaño del modelo, el tipo de carga de trabajo y la tolerancia de calidad, elige un formato y genera un plan de calibración/validación.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◦ Para el modelo 70B de 128 y 2k contextos, calcular el total de HBM de cada formato. ¿Qué tipo de formato puede permitir que usted coloque un H100 de 80GB?
2. Tienes un modelo de codificación 7B. Elige un formato y explica la razón. Si juzgas la tolerancia de calidad, ¿cuál es el camino de recuperación?
3. 计算为医学领域模型 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校准 AWQ 校校) 校校校校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校) 校
4. 阅读Marlin-AWQ kernel paper 或 release notes──用三句话解释为什么AWQ en 7B arriba alcanza 741 tok/s, mientras que el GPTQ en bruto 约为 712──
5. ¿Cuándo combinar los pesos AWQ con el caché de FP8 KV, comparado con mantener el KV en BF16 más razonable?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant variants 的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；production GGUF 默认选择 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-train INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；Marlin kernels；INT4 下最佳 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernels；10x speedup |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上的安全 precision 默认选择 |
| MXFP4 / NVFP4 | “microscaling four” | Blackwell 4-bit FP，带 per-block scale factors |
| Calibration dataset | “cal data” | 用于选择 quantization parameters 的输入文本；必须匹配 domain |
| KV cache quantization | “KV INT8” | 与 weights 分开的选择；影响 Attention accuracy |

## 延伸阅读
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) En comparación con el índice de referencia
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的吞吐量 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南──
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) Original formulación de la AWQ。
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) Original formulación de GPTQ。
