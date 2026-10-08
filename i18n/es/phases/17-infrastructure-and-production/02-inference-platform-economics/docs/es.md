# 推理平台经济学  Fuegos artificiales Juntos Baseto Modal Replicado Anyscale

> En 2026 el mercado ya no es más que un mercado de GPU  tiempo de alquiler  Se divide en plataformas de silicio personalizado  Grog, Cerebras, SambaNova)  Plataformas de GPU  Baseten  Juntos  Fireworks  Modal) y mercados de primer tipo de API  Replicaciones  DeepInfra  Fireworks  El 1 de mayo de 2026 aumentará el precio de cada bloque de GPU $1/hr，而 $4B  Valoración y la cantidad de procesamiento de 10T+ tokens por día explican que el modelo es viable  Baseten  2026$5B 估值完成了 $300M Serie E。 competencia 定位规则很简单:Fireworks 优化延迟,Together 优化目录宽度,Baseten 优化企业抛光,Modal 优化Python-native DX,Replicate 优化多模范围,Anyscale 优化分布式Python──本课会给你一个可以直接交给创始人的矩阵──

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**前置要求:**Fase 17 · 01 (Plataformas de LLM administradas), Fase 17 · 04 (VLLM Serving Internals)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- En el caso de los mercados de la industria de la producción, el mercado de la producción de productos de la industria de la producción de silicio se ha convertido en un segmento de mercado de la industria de la producción de silicio.
- Explicar por qué el modelo de precios de API "por token" se dirige a la curva de costos del motor de servicio 收, en lugar de a la curva de costos del hardware 收──
- 計算至少三供應商的每次请求有效成本,并解释什么时候/minuto (Baseten、Modal) ganó por token (Token)).
- 识别给定工作负载的正确默认平台(erradiación sin servidor, alto rendimiento constante, variantes de ajuste fino, multimodal)

##  problemas
Usted ya ha evaluado el sistema de administración de hiperescalado de la plataforma. Usted decidió que necesita un proveedor más pequeño y más rápido: Fireworks para la latencia, Juntos para la amplitud, Baseten para el modelo personalizado de ajuste fino. Ahora usted tiene seis opciones reales, mientras que las páginas de precios no coinciden. Fireworks  mostrar$/M tokens；Baseten 显示 $/minuto;Modal 显示 $/second；Replicate 显示 $/predicción. Si no se enfrenta a la carga de trabajo, no puedes hacer comparaciones cara a cara.

Más malo es que cada página de precios  detrás del modelo de negocio están diferentes. Fireworks en compartir GPU 上运行自己的定制引擎(FireAttention); por token tasa  refleja su curva de utilización. Baseten 给你Truss + GPUs dedicados; por minuto  refleja exclusividad.

Este curso se centra en las seis plataformas y te dice cuándo las diferenciarás.

## 概念
### Los tres segmentos

**Custom silicon** Groq(LPU)、Cerebras(WSE)、SambaNova(RDU)。 En el mismo modelo, el decodificación suele ser más rápida que en un grupo basado en GPU 快 5-10x。 por token 价格更高(2025年末 Groq 在 Llama-70B 上约为 ~$0.99/M), pero para los casos de uso sensibles a la latencia 无可匹敌──Groq es el medio de producción de los agentes de voz y la traducción en tiempo real──

**GPU platforms** Baseten、Together、Fireworks、Modal、Anyscale。运行在 NVIDIA(2026年为H100、H200、B200) o有时运行在 AMD 上。 se encuentran en la "arentamiento de GPU crudo" (RunPod、Lambda) y la "servicio administrado hiperescalado" (Bedrock) entre la economía de la capa.

**API-first marketplaces** Replicar 、Infraprofunda 、OpenRouter 、Fal── Catálogo amplio, pago por predicción o pago por segundo, enfatizar tiempo a primera llamada―

### Fuegos artificiales  plataforma de GPU optimizada para la latencia

- Motor FireAttention (custom); mercado propag propagandó por la latencia en la configuración de igual eficacia que en vLLM 低 4x──
- El nivel de lote ≈ 50% de la tasa sin servidor, para cargas de trabajo no interactivas.
- El modelo de prestación de servicios de tipo ajustado a la misma tasa que el modelo base, es la diferencia real entre los proveedores que recibirán una prima de su LoRA adicional en comparación con los demás.
- 2026 年中: alquiler de GPU a pedido desde 2026 年 5 月 1 日起提高$1/小时──规模化时可协商量定价──
- 财务信号: $4B 估值, por día procesando 10T+ tokens―

### Juntos  amplitud optimizada

- Más de 200 modelos, incluidos los lanzamientos de código abierto en línea en el período de lanzamiento posterior.
- En comparación con los modelos LLM, el 50% de la base de la base de la base de la base de la base de la base de la base de la base de la base de la base de la base de la base de datos es el volumen y el catálogo.
- La inferencia + ajuste fino + entrenamiento están en una API en la misma.

### Baseten  optimizado para empresas

- En el marco de la truss: se colocarán las dependencias, secretos, configuración de servicio en un manifiesto para llevar a cabo el embalaje de modelos.
- La GPU  rango de T4 a B200― por billete por minuto, y proporciona una mitigación razonable de arranque en frío―
- SOC 2 Tipo II,HIPPAA-pronto.
- $5B 估值，2026 年 1 月 Series E（来自 CapitalG、IVP、NVIDIA 的 $300M) ⋅

### Modal  Python nativo optimizado

- Infraestructura como código de Python`@modal.function(gpu="A100")`Disfrazar una función, y luego usar una orden de la oficina.
- facturación por segundo──pre-calor 时 frío comienzo 为 2-4s;小模型低于1s──
- $87M Series B，估值 $1.1B(2025)。En encuestas independientes la experiencia de desarrolladores obtendrá la mayor porcentaje。

### Replicación  ancho multimodal

- Pagos por predicción, imágenes, videos y modelos de audio.
- Ecosistema de integración (Zapier, Vercel, CMS)
- En las tasas de LLM por token, la competencia es menor, pero gana en la variedad multimodal.

### En cualquier escala  Radial nativo

- 构建在 Ray 上;RayTurbo es el motor de inferencia patentado de Anyscale (en inglés) ]]
- Lo mejor es que se adapte a las cargas de trabajo distribuidas de Python, de las cuales el paso de inferencia es un nodo en el gráfico.
- Gestionado Ray clusters; con Ray AIR 和 Ray Serve profundidad集成──

### Por token y por minuto:分分分在什么时候胜出

Cuando la carga de trabajo es poco sensible a la latencia y se estalla, por token es razonable, porque solo se paga por el uso real. Cuando la utilización es alta y predecible, por minuto es razonable, porque una vez que se hace GPU 和, se ganará por token.

粗略规则:当工作负载高于专用GPU 约30%的持续利用率时,每分钟,Baseten、Modal) comienza a ganar por token,Fireworks、Together)

### El motor personalizado es el verdadero foso

Cada plataforma en vLLM y SGLang 之都声称拥有自定义引擎──FireAttention、RayTurbo、Baseten的推理堆──custom-engine 声称带有营销色;更诚实的表述是, vLLM + SGLang 代表大约80% de la producción de la producción de la inferencia de código abierto, mientras que la diferencia entre la capa de plataforma es DX、attribution 和 SLAs──

### Números que debes recordar

- Alquiler de GPU de fuegos artificiales: desde 2026 年 5 月 1 日起提高 $1/小时──
- Reclamación de fuegos artificiales: en la configuración de efectos equivalentes, la latencia es 4x menor que en VLLM.
- Juntos: en LLMs, el 50% de los casos de replicación son convenientes.
- Valoración del baseto:$5B（Series E，2026 年 1 月，$300M de ronda)
- Valoración de los activos: $1.1B ((Sería B,2025)。
- por minuto en ~30% 持续利用率时胜过每令子


```figure
cost-per-token
```

## Usalo
`code/main.py`En una carga de trabajo sintética, los modelos de precios se transforman en seis modelos.$/day 和 effective $/M tokens──运行它来找出每代币与每分钟的破解平衡──

##  entregarlo
本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-inference-platform-picker.md` Determinar el perfil de carga de trabajo, seleccionar la plataforma de inferencia primaria y obtener el segundo puesto.

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Para un bloque de H100 de modelo 70B, en qué constante utilizamiento bajo Baseten (por minuto) se ganará Fireworks (por token)?
2. Su producto ofrece generación de imágenes, chat y habla a texto.
3. Los fuegos artificiales aumentarán el precio de tu modelo principal en un millón de dólares por hora. Si el 40% del tráfico se transfiere a la categoría de lote, se le dará un 50% de descuento.
4. Un cliente supervisado requiere SOC 2 Tipo II + HIPAA + GPUs dedicados. ¿Cuál de las tres plataformas se puede utilizar, cuál de las cuales está en FinOps?
5. Comparar Fireworks sin servidor, juntos bajo demanda, baseta dedicada y API de Replicación en Llama 3.1 70B por 1.000 predicciones de costo. ¿Cuál es el más barato? 10.000?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Custom silicon | "non-GPU chips" | Groq LPU、Cerebras WSE、SambaNova RDU — 针对 decode 优化 |
| FireAttention | "Fireworks engine" | Custom attention kernel；市场宣传为 latency 比 vLLM 低 4x |
| Truss | "Baseten's format" | Model packaging manifest；dependencies + secrets + serving config |
| Per-token | "API pricing" | 按消耗的 tokens 收费；无需为空闲付费 |
| Per-minute | "dedicated pricing" | 按 wall-clock GPU time 收费；在高 utilization 时胜出 |
| Per-prediction | "Replicate pricing" | 按 model invocation 收费；常见于 image/video |
| RayTurbo | "Anyscale engine" | Ray 上的 proprietary inference；在 Ray clusters 上与 vLLM 竞争 |
| Batch tier | "50% off" | 降价的 non-interactive queue；常见于 Fireworks、OpenAI |
| Fine-tuned at base rate | "Fireworks LoRA" | 以 base model 的 rate 对 LoRA-served requests 收费（差异点） |

## 延伸阅读
- [Fireworks Pricing](https://fireworks.ai/pricing) tarifas por token ‧tier de lote ‧ alquiler de GPU ‧
- [Baseten Pricing](https://www.baseten.co/pricing/) tasas por minuto  capacidad comprometida  niveles de empresa¬
- [Modal Pricing](https://modal.com/pricing) velocidades de GPU por segundo 和 nivel libre.
- [Together AI Pricing](https://www.together.ai/pricing) catálogo de modelos y tasas por token¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Anyscale Pricing](https://www.anyscale.com/pricing) RayTurbo y gestionó el precio de Ray.
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) evaluación comparativa¬
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) paisaje de vendedores。
