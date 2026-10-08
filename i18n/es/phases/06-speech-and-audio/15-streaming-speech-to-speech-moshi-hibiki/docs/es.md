# Transmisiones de voz a voz  Moshi、Hibiki y diálogo duplex completo

> 2024-2026 años redefinió el lenguaje AI。Moshi  publicó un único modelo, puede realizarse con 200 ms de retraso simultáneamente escuchando y diciendo。Hibiki 逐块完成 speech-to-speech 翻译。 ambos abandonaron ASR → LLM → TTS pipeline, y se dirigieron a la estructura completa unificada basada en el código de Mimi Token。 este es el nuevo diseño de referencia。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

##  problemas

Cada agente de voz construido basado en la Lección 11 + 12 tiene un límite de retraso básico, aproximadamente en 300-500 ms: VAD 触发, STT 处理, LLM 推理, TTS 生成── cada etapa tiene su propio límite de retraso mínimo── puedes modificar y hacer paralelismo, pero la forma de la tubería tiene un límite superior──

Moshi ((Kyutai,2024-2026) planteó un problema diferente: ¿qué pasaría si no hubiera un tubo de corriente? ¿qué pasaría si un modelo recibiera directamente la voz y la saqueaba continuamente, mientras que el texto era un monólogo interno intermedio?

La respuesta es:**full-duplex speech-to-speech**△ teoría de retraso 160 ms(80 ms Mimi marco + 80 ms retraso acústico) ー 在单张 L4 GPU 上的实际延迟为200 ms──这是顶级管道 语音代理能达到延迟的一半──

## 核心概念 核心概念 核心概念 核心概念

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### Arquitectura de Moshi

**输入。**两条 Mimi corriente de códec, media de 12,5 Hz × 8 libros de códigos:

- Río 1: usuario音频(Mimi-encodificado, continuo hasta llegar)
- Río 2:Moshi 自己的音频(由Moshi 生成)

**Transformer。**Un transformador temporal de parámetro 7B, que procesa dos corrientes y un texto en el monólogo interno.

1. 消耗最新用户 Mimi Token ((8 个代码簿) ⋅
2. 消耗最近的 Moshi Mimi Token ((8 个代码簿,按生成结果) 』
3. 生成下一个 Moshi 文本 Token (monólogo interno)
4. 生成下一个Moshi Mimi Token (a través de un pequeño Transformer de Profundidad) 生成 8 个代码簿)

Moshí puede escuchar al usuario en conversación; puede interrumpirse en el usuario en interrupción; puede realizar retorno de canal (mhm) sin interrumpirse en su principal discurso。

**Depth Transformer。**En un marco dentro de 8, los libros de código no son de la misma manera que se predice, existen en el libro de código 间依赖── un pequeño transformador de 2 capas depth transformator 会在 80 ms内按顺序预测它们──这是 AR codec LM's estándar de desglose modo(VALL-E、VibeVoice también se utiliza)──

### ¿Por qué el texto interno del monólogo ayuda?

Si no hay texto claro, el modelo debe estar en el flujo acústico. La idea de Moshi es: obligar a que se produzca un texto junto al audio.

### Hibiki:translación de habla a habla

Igual arquitectura, utiliza traducción para entrenamiento, fuente de lenguaje, fuente de audio, objetivo de lenguaje, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, audio, etc.

Primero apoyo a cuatro idiomas; puede utilizar aproximadamente 1000 horas de datos para adaptarse a nuevos idiomas.

### Más amplio de la pila de Kyutai(2026)

- **Moshi** diálogo duplex completo(法语优先,英语支持良好)
- **Hibiki / Hibiki-Zero** Traducción simultánea del habla
- **Kyutai STT** streaming de ASR ((500 ms o 2,5 segundos mirando hacia adelante)
- **Kyutai Pocket TTS** 100M-param TTS 可在 CPU 上运行(2026 年 1 月)
- **Unmute** En el servicio público, la combinación de estas capacidades

L40S GPU 上的吞吐量:64 个并发 sesión, 3× en tiempo real.

### Césamo de CSM  近亲

Sesame CSM (en inglés) utilizó similar thinking, una con la espina dorsal de la cabeza del códec Llama-3 de Mimi. Pero CSM es un solo proceso de recepción de contexto + texto, generación de voz), y no un dúplex completo.

### Números de rendimiento 2026

| Model | Latency | Use case | License |
|-------|---------|----------|---------|
| Moshi | 200 ms (L4) | full-duplex English / French dialogue | CC-BY 4.0 |
| Hibiki | 12.5 Hz framerate | French ↔ English streaming translation | CC-BY 4.0 |
| Hibiki-Zero | same | 5 language-pairs, no aligned data | CC-BY 4.0 |
| Sesame CSM-1B | 200 ms TTFA | context-conditioned TTS | Apache-2.0 |
| GPT-4o Realtime | ~300 ms | closed, OpenAI API | commercial |
| Gemini 2.5 Live | ~350 ms | closed, Google API | commercial |


```figure
sp-fullduplex
```

## Construirlo

### 步骤 1:interfaz

Moshi expone un servidor WebSocket, recibe un pedazo de audio codificado Mimi de 80 ms, y regresa un pedazo de audio codificado Mimi de 80 ms.

```python
import asyncio
import websockets
from moshi.client_utils import encode_audio_mimi, decode_audio_mimi

async def moshi_chat():
    async with websockets.connect("ws://localhost:8998/api/chat") as ws:
        mic_task = asyncio.create_task(stream_mic_to(ws))
        spk_task = asyncio.create_task(stream_from_to_speaker(ws))
        await asyncio.gather(mic_task, spk_task)
```

### Paso 2: bucle de doble completo

```python
async def stream_mic_to(ws):
    async for chunk_80ms in mic_stream_at_12_5_hz():
        mimi_tokens = encode_audio_mimi(chunk_80ms)
        await ws.send(serialize(mimi_tokens))

async def stream_from_to_speaker(ws):
    async for msg in ws:
        mimi_tokens, text_token = deserialize(msg)
        audio = decode_audio_mimi(mimi_tokens)
        await play(audio)
```

两个方向同时运行──Python asyncio o Rust futuros es el estándar de transmisión──

### 步骤 3:objetivo de formación

 Para cada marco de 80 ms `t`¿Qué es esto ?

- Entrada:`user_mimi[0..t]`¿Qué es esto?`moshi_mimi[0..t-1]`¿Qué es esto?`moshi_text[0..t-1]`
- Previsión:`moshi_text[t]`, y luego es`moshi_mimi[t, codebook_0..7]`

文本先于音频预测(monólogo interno);音频在深度变压器 内按代码簿 顺序预测。

### Paso 4:Moshi gana en donde, pierde en donde

Moshi 赢在:

- En hardware barato se realiza menos de 250 ms de final a final de retraso.
- El canal de atrás natural y el corte.
- No necesita código de pegamento de tubería.

Moshi no es bueno:

- No hay entrenamiento para esto; necesitas un camino de LLM independiente)
- 长推理(Moshi es un modelo de diálogo 8B 左右, no Claude/GPT-4)。
- La precisión de los hechos en el tema de la minoría.
- La mayoría de las empresas de producción en el año 2026 siguen utilizando el oleoducto.

## Usalo

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## 陷

- **有限的 tool calling。**Moshi es un modelo de diálogo, no un marco de agentes.
- **特定声音 conditioning。**Moshi utiliza una sola capacitación persona; clonación de voz es otra sola capacitación.
- **语言覆盖。**法语 + 英语 muy bueno; otros idiomas limitados。 Hibiki-Zero tiene ayuda, pero todavía necesitas entrenamiento datos。
- **资源成本。**Una sesión completa de Moshi ocuparía una ranura de GPU; no es barato el modo de desplegamiento compartido de inquilinos.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-duplex-pipeline.md` para una carga de trabajo de un agente de voz  选择 pipeline o full-duplex 架构,并给出理由──

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Se simula en símbolo de forma de dos corrientes + monólogo interno 
2. **Medium。**Desde HuggingFace 拉取 Moshi,运行服务器,测试一次对话――测量从用户话语结束到 Moshi 开始响应的墙钟延迟――
3. **Hard。**拿你的课12管道代理,在20 条匹配测试语句 上与莫希比较P50延迟──写出管道──仍然在架构上取胜的情况──

## 关键术语: "El hombre es un hombre"

| Term | 人们常说的意思 | 实际含义 |
|------|-----------------|-----------------------|
| Full-duplex | 同时听和说 | 同一个模型上同时活跃两条 audio stream。 |
| Inner monologue | 模型的文本 stream | Moshi 在输出音频的同时发出文本 Token。 |
| Depth transformer | codebook 间预测器 | 在一个 80 ms frame 内预测 8 个 codebook 的小型 Transformer。 |
| Mimi | Kyutai 的 codec | 12.5 Hz × 8 codebooks；semantic+acoustic；驱动 Moshi。 |
| Streaming S2S | 实时 audio → audio | 逐块翻译/对话，没有 pipeline stage。 |
| Back-channeling | “Mhm” 反应 | Moshi 可以发出小的确认反馈，而不打断自己的 turn。 |

## 延伸阅读

- [Défossez et al. (2024). Moshi — speech-text foundation model](https://arxiv.org/html/2410.00037v2) 论文──
- [Kyutai Labs (2026). Hibiki-Zero](https://arxiv.org/abs/2602.12345) 无需对齐数据的流媒体翻译──
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) Específico del MCS。
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) Instalar + servidor。
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 封闭商业同类──
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling)  marco de base de las TTS/STT
