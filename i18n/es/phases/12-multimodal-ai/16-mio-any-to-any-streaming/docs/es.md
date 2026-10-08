# MIO con modelos multimodal de transmisión de cualquier persona

> GPT-4o  entregó una mayoría de los modelos abiertos  imposible de repetir productos: una energía real en el momento de escuchar el voz  ver el vídeo  y abrir la respuesta  agente  hasta el final de 2024, la respuesta del ecosistema abierto es MIO  Wang et al., septiembre 2024)  MIO Tokenize 文本、图像、语音和音乐, entrenar un transformador causal en la secuencia de cambios,并能从任意模式 生成到任意模式── Cualquier GPT  Zhan et al., febrero 2024) es la prueba del concepto; MIO es escalado; Unified-IO 2  Allen AI, diciembre 2023) es con visión + acción de proximidad  Read any-to-any 模式  四个 Tokenizer、 una decodeador  Transformer-friendly 

**Type:** Learn
**Languages:** Python (stdlib, four-modality token allocator + streaming decode loop)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 6 (Speech and Audio)
**Time:** ~120 minutes

## El objetivo del aprendizaje
- Diseñar un vocabulario compartido, utilizado para contener textos, imágenes, palabras y música Token, y no ocurrirá conflictos.
- Desde compresión + 重建取舍角度比较 SEED-Tokenizer (图像) y SpeechTokenizer residual-VQ (语音) ⋅
- Explicar la construcción de cualquiera-a-cualquier 生成能力 de cuatro fases curriculum.
- Cuál es el resultado de la investigación?

##  problemas
Un modelo multimodal unificado  fácil de afirmar, pero muy difícil de escalar construir. Hasta el año 2024, la mayoría de los sistemas "de cualquier a cualquier" son de tipo: modelo de visión → 文本表示 → modelo de habla → 音频──.

工程挑战:

- Cada modalidad debe tener un Tokenizer, comprimirlo para que se acerque lo suficiente a los sin pérdidas para reconstruir, y generar Token a la velocidad de consumo del Transformer.
- 单一词汇 必须为文本(32k+) 图像(16k+) 语音(4k+) 音乐(8k+) distribución espacio──最低也需要四万多条目──
- 训练数据必须覆盖每种输出输入对 (text→image、image→speech、speech→image等),或者模型必须能够组合──
- Inferencia 必须足足足快地流 输出 Token,以满足对话延迟 ((<500ms tiempo-a-primero-bio-audio) ]]

## 概念
### Cuatro modalidades de cuatro Tokenizadores

MIO de la pila de Tokenizer:

- Texto: estándar BPE, vocab ~32000。
- Imagen:SEED-Tokenizer (2023)  带离散代码簿 的量化VAE,4096 条目,每张图像 32x32 个代码.
- Discurso:Discurso Tokenizer residual-VQ (2023)  将 16kHz waveform 编码为 8 层级代码书;第一层是粗粒度内容,后续层加入 prosody 和扬声器身份──
- Música: similar similar a residual-VQ(Meta de la familia MusicGen / Encodec),4-8 个 código libros。

Cada modalidad produce un número total de tokens. Estos tokens obtienen rangos de identidades no superpuestos entre sí en el vocabulario compartido:

```
text:   0..31999
image:  32000..36095  (4096 image tokens)
speech: 36096..40191  (4096 speech base tokens, plus residual layers)
music:  40192..48383  (8192 music tokens)
sep:    48384..48390  (<image>, <speech>, <music>, </...>, etc.)
```

总计: aproximadamente 48k vocabulario──input Embedding 和 output projection 覆盖全部条目──

### Descódigo de transmisión

语音生成使用残留-VQ──Transformer 预测 base(layer 0) Token de habla; un cuantificador residual decodificado en paralelo 预测后续层── cada capa 0 Token 大约对应 16kHz 音频中的 50ms──

En streaming 模式:

1. Usuario en tiempo real Tokenizer audio cada 50 ms  Emite voz Token
2. MIO en Token hasta el momento de consumirlos
3. Token de salida 随生成流式输出; decodificador de voz paralelo 以约50-150ms 延迟将其转换为音频样本──
4. Tiempo a primer byte de audio:MIO papel Medio de 300-500ms, cerca de 250ms de GPT-4o

Mini-Omni (arXiv:2408.16725) ✓ GLM-4-Voice (arXiv:2412.02612) y Moshi (arXiv:2410.00037) son diseños de transmisión de voz-LLM complementarios.

### Cuatro fases del currículo

El plan de estudios de formación de MIO:

1. Estadio 1  Alineación──Más grande modalidad-pare corpora: texto-imagen、texto-discurso、texto-música──cada pareja utiliza su propio segmento de vocabulario Token──entrenar compartido vocabulario──
2. Etapa 2  interconectados──Multi-modalidad interconectados documentos(带图像 + 视频的博客、带转录的播客等)──entrenamiento en el contexto de la modalidad cruzada──
3. Etapa 3  mejorado en el habla, para mejorar la calidad del lenguaje y no perder la capacidad de texto.
4. Etapa 4  SFT──跨 modalidad                                                                                                                                                                                                                                                          

缺少某阶段会削弱特定能力: saltar la etapa 2,模型会失去跨modality context; saltar la etapa 3,语音会很差──

### La cadena del pensamiento visual

MIO 引入-chain-of-visual-thought:模型发出中间图像 Token 作为推理步骤──对于 "¿el gato está subiendo a un árbol?",模型会:

1. 发发发 `<image>`Token 来染场景 (en inglés)
2. 发出文本分析该草图──
3. 发发出最终答案──

En las tareas de razonamiento espacial, los puntos de referencia hay una elevación.

### Cualquier competidor

- CualquierGPT(arXiv:2402.12226): 4 种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种
- Unified-IO 2 ((arXiv:2312.17172): aumentar las salidas de acción de visión, profundidad, normalidad, tareas de mayor tamaño, tamaño, menor.
- NExT-GPT(arXiv:2309.05519):LLM + decodificadores de difusión específicos de modalidad―no de un solo modelo 方法―
- CoDi(arXiv:2305.11846):difusión composible; a través de compartido latente 实现 cualquiera-a-cualquiera。

MIO 最接近纯标志性任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何任何

### Presupuesto de la latencia

Para un producto de diálogo, el retraso de cada componente es importante:

- Mic hasta audio Token: ~50ms。
- Preemplazo de audio Token + historia):8B modelo 上 ~100ms。
- La primera salida Token: ~ 50ms
- Descóder de voz paralelo residual-VQ +: ~ 100-150 ms。

总时间-to-first-audio-byte:最低约 ~300ms──GPT-4o 声称 ~250ms──Moshi 声称 160ms──根据公开基准,MIO/AnyGPT 位于400-600ms 范围──

### ¿Por qué cualquier-a-alguno  todavía difícil

Incluso en 2026, abrir cualquier modelo en dos ejes sigue quedando atrás de los cerrados:

- 语音质量──residual-VQ Tokenizer 是有损的; en comparación con las voces de clase ElevenLabs, el diálogo 语音听起来更机械──
- El razonamiento de modalidad cruzada ―让模型 "cantando sobre lo que ves" ― sigue siendo más fácil de perder que tareas de visión pura ―

Estos son problemas de investigación abiertos.


```figure
any-to-any-stream
```

## Usalo
`code/main.py`¿Qué es esto ?

- definición de la asignación de vocabulario de cuatro modalidades并印印它──
- Para hacer una entrada multimodal 列表 (texto, imagen, audio, música) a través del router Tokenizer 路由──
- 模拟文字-to-speech response 的流媒体解码,并统计延迟──
- En el caso de las latencias de un codificador, pre-cargar y decodificador, calcular el tiempo esperado de primer byte de audio.

##  entregarlo
本课产 出  `outputs/skill-any-to-any-pipeline-auditor.md` Determinar una especificación de producto de conversación, modalidades en ▌modalidades fuera ▌objetivos de latencia), revisar las opciones de diseño de la familia MIO y calcular el presupuesto de latencia ▌

##  ejercicios
1. Su producto acepta la entrada de voz y regresa a la salida de voz.

2. SpeechTokenizer residual-VQ utiliza 8 libros de código, explica por qué los niveles de residuos paralelas de decodificación son necesarios, así como lo que trae el retraso de la conservación.

3. Tu vocabulario tiene 32k de texto + 4k de imagen + 4k de habla. Añade 8k de música y aproximadamente 10 separadores.

4. ¿Qué tipo de problemas se beneficiarán? ¿Qué tipo de problemas se verán perjudicados?

5. 阅读 Moshi(arXiv:2410.00037)。 describir su "monólogo interno" 技术,并与MIO的链接视觉思想比较──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Any-to-any | "Multimodal in/out" | 一个单一模型，能够在任意方向接受并发出 text、image、speech 和 music |
| Residual-VQ | "Speech tokenizer stack" | Multi-codebook Tokenization，每一层都添加信息；base layer 是内容，后续层是 prosody |
| SEED-Tokenizer | "Image codes" | MIO 使用的离散 image Tokenizer，带 4096-entry codebook |
| Chain-of-visual-thought | "Visual scratchpad" | 模型在最终答案前生成一张中间图像作为 reasoning step |
| Time-to-first-audio-byte | "TTFAB" | 从用户语音到第一个 audio output 的延迟；<500ms 才有对话感 |
| Four-stage curriculum | "Training recipe" | Alignment -> interleaved -> speech-enhanced -> SFT，按此顺序 |

## 延伸阅读
- [Wang et al. — MIO (arXiv:2409.17692)](https://arxiv.org/abs/2409.17692)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Lu et al. — Unified-IO 2 (arXiv:2312.17172)](https://arxiv.org/abs/2312.17172)
- [Wu et al. — NExT-GPT (arXiv:2309.05519)](https://arxiv.org/abs/2309.05519)
- [Tang et al. — CoDi (arXiv:2305.11846)](https://arxiv.org/abs/2305.11846)
