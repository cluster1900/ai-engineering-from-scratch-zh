# Servicio de auto-acogida 选择  llama.cpp, Ollama, TGI, vLLM, SGLang

> En 2026 cuatro motores se basaron en la inferencia de la autosuficiencia.**llama.cpp**En el modelo de CPU 支持最广, en cuanto a cuantización y threading 拥有完全控制──**Ollama**Es un programa de instalación de orden en el desarrollo de notas, comparado con llama.cpp 慢约15-30% ((Go + CGo + HTTP serialization), en la clase de producción 差分3x下载**TGI 于 2025 年 12 月 11 日进入维护模式** Sólo se hacen correcciones de errores, el rendimiento bruto es de aproximadamente un 10%, pero en el pasado en materia de observabilidad y integración de sistemas de HF es generalmente de alto nivel.**vLLM**Es la primera versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de la versión de PiToría.**SGLang**Es un sistema de procesamiento de datos de base de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de la red de datos de datos de la red de datos de la red de datos de datos de la red de datos de datos de la red de datos de datos de la red de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de la red de datos de datos de datos de datos de la red de datos de datos de datos de la red de datos de datos de la red de datos de datos de datos de la red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red de red

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** 覆盖 engines 的所有 Phase 17 课程（04、06、07、09、18）
**Time:** ~45 分钟

## El objetivo del aprendizaje
- En given hardware (CPU / AMD / NVIDIA Hopper / Blackwell) √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √
- Explicar el estado del TGI en 2026 y por qué hará que los nuevos proyectos se dirigen hacia el VLLM o SGLang.
- 描述全程使用相同 GGUF或 HF weights 的 dev/staging/prod pipeline。
- Explica por qué sólo la CPU se obligará a usar llama.cpp, mientras que la AMD se excluirá TRT-LLM。

##  problemas
Su equipo ha iniciado un nuevo proyecto de LLM de autosuficiencia. Un ingeniero dice Ollama, otro dice VLLM, el tercer dice ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿

En 2026 la selección de árboles es importante: primero ver el hardware, después ver la escala, después ver la carga de trabajo. También hay un evento específico de 2025.

## 概念
### 五个引擎

| Engine | Best for | Notes |
|--------|----------|-------|
| **llama.cpp** | CPU / edge / minimal deps / 最广 model 支持 | CPU 上最快，完全控制 |
| **Ollama** | Dev laptops、单用户、一条命令安装 | 比 llama.cpp 慢 15-30%；生产 throughput 差距 3x |
| **TGI** | HF ecosystem、regulated industries | **2025 年 12 月 11 日维护模式** |
| **vLLM** | 通用生产、100+ 用户 | 广泛的生产默认选择；v0.15.1 2026 年 2 月 |
| **SGLang** | Agentic 多轮、prefix-heavy workloads | 生产中有 400,000+ GPUs |

### 硬件 decisión de prioridad

**仅 CPU**→ llama.cpp──Ollama también puede usar, pero más lento──no hay otro motor en la CPU que tenga competencia──

**AMD GPU**→ vLLM(AMD ROCm 支持)。SGLang 也能用──TRT-LLM 被 NVIDIA 锁定,所以排除──

**NVIDIA Hopper (H100 / H200)**→ VLLM o SGLang o TRT-LLM──三者都是顶级──

**NVIDIA Blackwell (B200 / GB200)**→ TRT-LLM es el líder de rendimiento (Fase 17 · 07)。vLLM 和 SGLang 紧随其后。

**Apple Silicon (M-series)**→ llama.cpp(Metal) ――Ollama ha realizado un envase en su contra.

###  tamaño de la decisión

**1 个用户 / local dev**→ Ollama。一条命令,数秒内 primer-token。

**10-100 个用户 / 小团队**→ VLLM de un solo GPU。

**100-10k 个用户 / production**→ vLLM producción-estaca(Fase 17 · 18) o SGLang。

**10k+ 个用户 / enterprise**→ VLLM producción-pillo + desagregado(Fase 17 · 17) + LMCache(Fase 17 · 18)。

### Carga de trabajo

**General chat / Q&A**→ vLLM en un amplio escenario de la victoria

**Agentic multi-turn（tools、planning、memory）**→ SGLang's RadixAttention(Fase 17 · 06) 占优。

**带有大量 prefix reuse 的 RAG**→ SGLang。

**Code generation**→ vLLM puede;SGLang en caché 上略好。

**Long context (128K+)**→ VLLM + preempleo en pedazos; SGLang + KV en capas。

### TGI 维护陷

Hugging Face TGI 于 2025 年 12 月 11 日进入维护模式  之后只做bug fixes──过去:顶级可观测性、同类最佳HF 生态系统集成(modelo de tarjetas、 herramientas de seguridad), cru cru cru 略落后于 vLLM──

Para el nuevo proyecto de 2026: evitar el TGI. La implementación de TGI existente puede continuar, pero finalmente debe ser transferida.

### El gasoducto 模式

Dev(Ollama)→ encendiendo(llama.cpp)→ prod(vLLM)。

### Ollama  注意事项

Ollama 很适合 dev. 很适合分享生产:Go HTTP serialization 会增加开销,Concurrency management比 vLLM 更简单,OpenTelemetry 支持滞后――把 Ollama 用在它擅长的地方  一个用户、一条命令  然后在分享场景切换到vLLM。

### Autotestanza vs gestión es otra decisión

Fase 17 · 01(hiperscalers administrados) 、· 02(plataformas de inferencia) 覆盖 managed──本课假设你已经决定自托管──自托管的理由:data residency、custom fine-tune、规模化后的总成本所有权、托管服务上不可用域名模型──

### Debes recordar el número

- TGI 维护模式:2025 年 12 月 11 日。
- VLLM v0.15.1:2026 年 2 月;PyTorch 2.10;Blackwell SM120 支持──
- SGLang 生产足迹: 400.000+ GPUs
- El rendimiento de Ollama 相对 llama.cpp 的差距:慢 15-30%;生产负载下 3x。


```figure
data-parallel
```

## Usalo
`code/main.py`Es un caminante de árbol de decisión: dado hardware + escala + carga de trabajo, seleccionar un motor y explicar la razón.

##  entregarlo
本课产 出  `outputs/skill-engine-picker.md` Elegir un motor y escribir un plan de migración

##  ejercicios
1. Con tu hardware / escala / carga de trabajo 运行 `code/main.py`¿La salida está en consonancia con tu instinto?
2. Su infra es de 12 张 H100 y 8 张 MI300X AMD. ¿Con qué motor? ¿Por qué TRT-LLM es indiscutible?
3. Un equipo piensa usar TGI en 2026, porque es algo que conocemos.
4. Ollama dev hasta vLLM prod:cuantización, configuración y observabilidad ¿Qué ocurre con el cambio?
5. RAG 产品的P99 prefijo longitud 为 8K,并且租户间复用率很高──选择一个引擎,并结合阶段17 · 11 + 18 组成堆──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| llama.cpp | “CPU 那个” | 最广 model 支持，CPU 上最快 |
| Ollama | “笔记本那个” | 一条命令安装，dev-grade throughput |
| TGI | “HF 的 serving” | 自 2025 年 12 月起维护模式 |
| vLLM | “默认选择” | 2026 年广泛生产 baseline |
| SGLang | “agentic 那个” | Prefix-heavy，RadixAttention |
| TRT-LLM | “NVIDIA 锁定” | Blackwell throughput 领先者，仅 NVIDIA |
| GGUF | “llama.cpp 格式” | Bundled K-quant variants |
| Production-stack | “vLLM K8s” | Phase 17 · 18 reference deployment |
| Pipeline pattern | “dev→stage→prod” | 同一 weights 上的 Ollama → llama.cpp → vLLM |

## 延伸阅读
- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) notas de liberación。
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
