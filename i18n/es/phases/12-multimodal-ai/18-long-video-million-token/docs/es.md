# Contexto de millones de palabras 下的长视频理解

> Una película de 4K de 1 hora, 24 FPS, a través de parches y embebedimiento, generará aproximadamente 6 millones de tokens. Una transcripción de 2 horas de un programa de televisión de 2 horas de duración de 3 millones de tokens. Una película de Blu-ray, incluso con un aglutinamiento intensivo de compresión, también tendrá cientos de millones de tokens. Google Gemini 1.5 (marzo de 2024) se lanzó en un contexto de 1,000 millones de tokens. Este tiempo, capaz de completar confiablemente la aguja en un haystack en el video de la hora, LWM (LWM) Liu et al., febrero de 2024) mostró un camino de ampliación de la atención de los anillos.

**Type:** Build
**Languages:** Python (stdlib, needle-in-haystack simulator + agentic-retrieval router)
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## El objetivo del aprendizaje
- 计算不同 FPS 和聚合下长视频的总视觉标记 数量──
- 解释三条扩展路径:marca bruta de contexto  Gemini 1.5)                                                                                                                                                                                                                                                     
- En la Precise rate y delay up comparar VLMs de video en contexto crudo con VLMs de video de recuperación de agentes (VideoAgent)
- Por 30 minutos de video diseñar una aguja en un haystack 测试,并测量特定分钟处的召回率──

##  problemas
El parche de tamaño Qwen2.5VL en 384 original生分辨率, solo se utiliza 729 Token, después de combinar 3x3 Token, cada uno de 81 Token, en un 30 minutos de un parche de 1 FPS 计算 = 1800  = 145,800 个 Token, hasta 2025 los VLM abiertos pueden hacerlo, pero muy poco.

Una parte de 2 horas de películas por 1 FPS es 583k Token。 supersupresión 2026 年开放模型能力; necesita Gemini 2.5 Pro, o más activamente en conjunto。

Se ha desarrollado un camino de expansión.

## 概念
### Camino 1: contexto bruto (Gemini 1.5, Claude Opus)

Ushardware resolver problemas. 把 contexto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

Gemini 1.5 Pro  lanzado  apoyo al 1M Token; Gemini 1.5 Ultra  alcanza 10M; Gemini 2.5 Pro de 2026 año 能可靠处理数小时视频──论文(arXiv:2403.05530) registró en el máximo de 9.5M Token 下, la tasa de recuperación de aguja en haystack alcanzó el 99.7%──

工程上: una forma de auto-configuración de la atención de nivel de memoria local + global + escasa 实现,加上用于长文效率的MoE experto enrutamiento──完整细节未公开发表──不开源──

### 路径 2: Atención a los anillos (LWM, LongVILA)

En el caso de los anillos, cada uno de ellos tiene un solo pieza.

LWM(Liu et al., 2024) con este método entrenó un contexto de 1M-Token 模型── entrenar la cantidad de cálculo con el contexto 线性扩展, en lugar de la ampliación cuadrada, ya que el costo cuadrado de la atención se distribuye a los dispositivos en el anillo.

LongVILA(arXiv:2408.10188)把该模式适配到VLMs──1400 视频,每 192 个代币 = 268k contexto,并使用8 direcciones de paralelismo de la atención de anillo 训练──

### 路径 3:Token 压缩 (Video-XL, LongVA)

Más barato que en el contexto bruto: en el LLM se realiza la intensificación de la compresión antes de la secuencia.

Video-XL(arXiv:2409.14485) utiliza el token de resumen visual: cada clip contiene N   produce un token de resumen                                                                                                                                                                                                                                             

LongVA utilizalongo contexto transfer技术,将 LLM contexto de 200k 扩展到2M──先在长文文上训练,再通过共享表示迁移到长文文视频──

La compresión de tokens utiliza la capacidad de recoger en un tiempo específico para intercambiar su extensibilidad. El modelo suele saber lo que ocurrió, pero a veces se pierde la precisión.

### 路径 4: Recuperación de agentes (VideoAgent)

No introduzcas el vídeo completo en el LLM.

VideoAgent ((arXiv:2403.10517):

1. LLM 读取问题──
2. LLM Pide herramienta de recuperación 提供相关片段(mostrame segmentos con un gato)。
3. Herramienta 返回匹配的剪辑时间标签──
4. LLM 通过VLM 读取这些片段──
5. LLM  organización de respuesta, o presentar una consulta posterior.

Es una aplicación de LLM como agente en el largo vídeo 模式──Inferencia 更便宜──

### Indicador de referencia de agujas en un manto de heno

标准 long-context 测试: en cualquier posición en el vídeo, inserta un marcador de texto o de la imagen único, y luego presenta una pregunta que necesita recordar este marcador.

Metrícula:跨视频长度和标记位置的 Recall@k。

Gemini 2.5 Pro en el 90 min de video en el máximo tiempo: >99% 召回率──開啟 72B 模型(Qwen2.5-VL-72B、InternVL3-78B) en el 30 min de la sesión: 85-90%, más de 60 minutos después de la baja──

Si la herramienta es suficiente, VideoAgent en 2+ 小时场景下 puede adaptarse o superar el modelo en contexto crudo, ya que la recuperación puede hacerse con una aguja.

### ¿Qué camino elegir?

对于边界精度的 15 分钟片段:开放 72B + 原生 context 通常可行──选择 Qwen2.5-VL-72B──

对于30分钟到1小时内容:开放模型选择 LongVILA 或 Video-XL;闭源选择 Gemini 2.5 Pro──质量门很重要,边界走闭源──

对于2+ 小时内容:VideoAgent或类似检索模式──或, resumen en más pequeños trozos,并输入 jerárquicos resúmenes──

### Modelo de producción 2026

En la práctica, las líneas de producción de video de nivel largo son de tipo mixto:

1. Para todo el vídeo, el muestreo dinámico-FPS + agrupamiento agresivo se obtiene un total de 100k-Token.
2. 传给72B VLM 生成全局摘要──
3. Si el usuario plantea detalles, use este resumen como índice 运行代理检索──

Esto combina la capacidad de comprensión y recuperación de detalles locales del contexto bruto.


```figure
mm-video-token-budget
```

## Usalo
`code/main.py`¿Qué es esto ?

- 计算 1 分钟到 3 小时视频在不同 FPS + pooling 下的 Token 预算。
- 模拟一次针-in-a-haystack 运行: 在随机时刻 注入标记,提出问题,并评估召回──
- incluye un simulador de enrutador de recuperación de agentes, para seleccionar clips específicos de VLM 

运行预算表,感受尺度差距──

##  entregarlo
本课产 出  `outputs/skill-long-video-strategy-planner.md` Dado el tiempo de tiempo de vídeo y la complejidad de la consulta, se puede elegir entre el contexto bruto, la compresión y la recuperación de agentes, y calcular el retraso + la expectativa de calidad.

##  ejercicios
1. Un episodio de 45 minutos de conferencia, 1 FPS, por cada 81 Token.

2. Diseñar una aguja en un haystack 测试: ¿Enfijarás un marcador en los primeros minutos, exactamente en forma de consulta?

3. En 1 小时视频上比较 bruto-context Qwen2.5-VL-72B(80k context) con VideoAgent(Claude 3.5 + retrieval) ―― ¿Cuál es el resultado final?

4. El costo de memoria de la atención de anillo se expande con la longitud lineal de la secuencia, también con la cantidad de dispositivos se expande lineal. Explica por qué, así como si se pierde la rotación de anillo.

5. 阅读双子座 1.5 第5节关于针子的内容──论文对1M y 10M Token 边界处的召回有什么发现?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Brute context | “只是更多 Token” | 将 LLM context 扩展到数百万 Token；一次性处理所有内容 |
| Ring attention | “LWM-style parallel” | 分布式 attention 模式：每个设备持有一个 chunk 并轮转 |
| Token compression | “Summary tokens” | 在进入 LLM 前，通过 learned compressor 减少每个 clip 的 Token |
| Needle-in-haystack | “NIH test” | 在随机位置插入唯一 marker，在测试时要求模型回忆它 |
| Agentic retrieval | “LLM as query planner” | LLM 向 retrieval tool 请求相关 clips，通过 VLM 读取它们，并组织答案 |
| VideoAgent | “Retrieval pattern for video” | 规范的 agentic-retrieval 设计：question -> tool -> clip -> answer |

## 延伸阅读
- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)
