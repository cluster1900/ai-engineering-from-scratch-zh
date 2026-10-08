# Modelos omni: Qwen2.5-Omni y pensador-hablante 拆分

> GPT-4o tiene un impacto en la presentación de productos de mayo de 2024, no por el modelo de nivel inferior, sino por la forma del producto: una interfaz de voz, habla, el modelo ve lo que ve la cámara, y en 250ms interna en respuesta al voz.

**Type:** Build
**Languages:** Python（stdlib，streaming pipeline 延迟模拟器 + VAD 循环）
**Prerequisites:** Phase 12 · 19（audio-LLMs），Phase 12 · 16（any-to-any）
**Time:** ~180 分钟

## El objetivo del aprendizaje
- Se dividirá en pensador y hablador, y explicará por qué se ha ido haciendo streaming.
- 逐组件计算一次对话交互的时间到第一音频字节 (TTFAB) presupuesto──
- 描述 TMRoPE 在 Thinker 内部跨视觉、音频和文本的时间对齐位置编码──
- En el caso de los niños, el tiempo de trabajo es de aproximadamente un año.

##  problemas
Un asistente de voz en tiempo real debe hacer muchas cosas rápidamente:

1. 听用户──实时语音 Tokenization, detección de actividad de voz(VAD) para juzgar el usuario 何时说完──
2. Opcional para ver. En 2-4 FPS, ingrese la imagen de la cámara, y la transmisión con el audio hasta el pensador.
3. 思考── Based on dialogistorical organization
4. Se trata de un símbolo de la forma de onda, que se transmite al usuario.

Cada paso aumenta la demora. El tiempo de retraso del diálogo se reduce a 500 ms.

Cada componente necesita streaming. No puedo poner todo en lote.

## 概念
### Pensador y hablador

Qwen2.5-Omni 的分解:

- Pensador: un 7B-80B 文本生成 Transformer。消费交错的文本 + 图像 + 音频 Token。输出表示要说什么的文本 Token。
- Hablante: un menor de voz de generación de Transformer(200M-1B) ――消费 Thinker 的文本输出代币加上最近的语音上下文代币──输出离散语音代币(residual-VQ 索引)──
- Decodificador de voz: un decodificador de forma de onda de streaming (SNAC、MoVQGAN familia),将语音 Token 实时转换为音频样本──

Este tipo de separación es importante. El pensador debe ser lo suficientemente grande como para tener una buena capacidad de razonamiento. El hablante puede ser muy pequeño, ya que su tarea es local: convertir el texto en un símbolo de voz.

两者并行运行:

1. Pensador 发发出文本 Token t_i。
2. Hablante 消费 t_i( 通过流),并发出语音 Token s_i、s_{i+1}、...、s_{i+k}。
3. Decodificador de voz en Token de voz hasta el momento de consumirlos,并发发发音频样本──
4. Cuando el pensador llegó a la letra Token t_{i+3} 时, el hablante 已为 t___..t_{i+2} streaming 了音频。

### TMRoPE  时间对齐的 Multimodal 位置

El pensador necesita integrar imágenes (por ejemplo, a 4 FPS hasta) 音频(a 50 /s hasta) y de la historia del diálogo 简单的序列顺序(

TMRoPE para cada token de distribución absoluta tiempo──t=2.3s 的视觉 Token──t=2.32s 的音频 Token──来自用户文本 Token stop 位于 t=2.35s──RoPE 按时间旋转注意;模型将把它们看作在时间发生在同时──

Esto es hacer que él un lado a la derecha de decir hola capaz de trabajar infraestructura: el modelo en el mismo concepto en el momento de ver el vídeo y el audio.

### Transmisiones 语音合成

语音 Token 必须流通──Mini-Omni(Xie & Wu, 2024) propone que los modelos de lenguaje puedan escuchar, hablar mientras piensan en streaming:pensador 输出 Token 和 Talker 输出 Token 在同一个序列中交错──Talker 在 Thinker 确认下一个文本 Token 后立即启动──没有批量 边界──

Moshi(Défossez et al., 2024 年 10 月) es la realización abierta más rápida.

### VAD y la toma de vueltas

Detección de la actividad de voz 运行在输入侧──两种模式:

- Medio dúplex: usuario habla, modelo oye.
- El doble: ambos pueden hablar simultáneamente. El modelo puede ser retrocanal.

Qwen2.5 Omni 默认支持半duplex, 通过静音值进行转换──Full-duplex 需要应用层处理──

### Qwen3-Omni(2025 年 11 月)

后继版本──Qwen3-80B Thinker, Greater Talker,改进的TMRoPE-v2──延迟接近GPT-4o的250ms──开放权重──在OmniBench 上的基准与Gemini 2.0 Live 具有竞争力──

### Presupuesto de latencia de producción

对于典型流媒体 交互:

- Mic -> 音频 Token:40-80ms。
- Preempto: 7B 上 100-200ms, 70B 上高得多──
- El primer pensador.
- Hablante 处理第一个文本 Token:20ms。
- La primera señal de compromiso: 40 minutos.
- Descodificación residual-VQ: 30 ms.
- 语音 forma de onda decodificación: 50-80ms。

总 TTFAB:7B 上 320-510ms,70B 上 600-900ms。 Frontier 质量通常意味着70B+;这就是边界 延迟差距的来源──

### Matemáticas de la tasa de tokens

对于16kHz 语音和50Hz 基础层语音代币,你每秒输出需要50语音代币――Horror 必须发发发 ≥50 tok/s 才能跟上――在H100上, típico rendimiento LLM es de 30-80 tok/s, por lo tanto, pequeño(200-300M)Horror 足够快;7BHorror 会落后――

Es por eso que habrá un modelo de hablante especializado en pequeño, en lugar de un modelo principal de uso directo.


```figure
l5-thinker-talker
```

## Usalo
`code/main.py`¿Qué es esto ?

- Usar el símbolo de simulación de velocidad de emisión de un pensador-hablante.
- Para la configuración de tamaño de modelo y microcopia de tasas de toma de datos TTFAB
- Usar VAD 静音值演示 medio doble de turno.

##  entregarlo
本课产 出  `outputs/skill-omni-streaming-budget.md`△ Give Determinar un objetivo real de los productos de voz en el mundo TTFAB 和功能集合 (Visión en el bilingüe), seleccionar Qwen2.5Omni、Qwen3-Omni、Moshi o Mini-Omni, y determinar la dimensión del pensador/hablante.

##  ejercicios
1. Tu objetivo TTFAB es 300ms. En el pensador 7B y el hablador 300M, escribe el retraso de cada componente.

2. Qwen2.5-Omni utiliza TMRoPE。 describir un instante así 中模型看的内容: usuario en t=1s 开始说话,摄像头在 t=1.2s 捕捉到一个手势──

3. El modelo de apoyo a la demanda de escucha en simultáneo con la emisión de audio. Propone un formato de entrenamiento para enseñar este punto.

4. 阅读Moshi 论文 Sección 4── describir el monólogo interno 分离, así como por qué evitó el pensador-hablante 分离──

5.  calcular rendimiento  presupuesto: para seguir a 16kHz 语音和 50 基础层 Token/秒, el hablante 必须发发发 Token a más rápido velocidad?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Thinker | “推理大脑” | 生成要说什么的大型文本生成 Transformer |
| Talker | “语音生成嘴巴” | 从 Thinker 文本生成离散语音 Token 的小型 Transformer |
| TTFAB | “延迟预算” | Time-to-first-audio-byte：从用户语音结束到第一个音频 sample 输出 |
| TMRoPE | “时间对齐 RoPE” | 使用跨视觉、音频、文本的绝对时间戳的位置编码 |
| Half-duplex | “Turn-taking” | 用户和模型交替；VAD 静音检测用户已说完 |
| Full-duplex | “同时进行” | 模型可以同时说话和聆听；具备 backchannel 能力 |
| Inner monologue | “Moshi 分离” | 单模型设计，其中思考流和说话流交错 |

## 延伸阅读
- [Xu et al. — Qwen2.5-Omni (arXiv:2503.20215)](https://arxiv.org/abs/2503.20215)
- [Qwen Team — Qwen3-Omni (arXiv:2509.17765)](https://arxiv.org/html/2509.17765v1)
- [Xie & Wu — Mini-Omni (arXiv:2408.16725)](https://arxiv.org/abs/2408.16725)
- [Défossez et al. — Moshi (arXiv:2410.00037)](https://arxiv.org/abs/2410.00037)
- [Zeng et al. — GLM-4-Voice (arXiv:2412.02612)](https://arxiv.org/abs/2412.02612)
