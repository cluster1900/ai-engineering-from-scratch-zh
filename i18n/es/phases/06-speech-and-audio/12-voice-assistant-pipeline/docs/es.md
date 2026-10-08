# 构建语音助手 Pipeline  Fase 6 Capstone

> Colocar todo el contenido de las lecciones 01-11 en conjunto. Construir un asistente de voz que escuche, reflexione, responda. En 2026, ya es un problema de ingeniería maduro, no un problema de investigación, pero los detalles de integración determinan si realmente puede salir a la línea.

**Type:** 构建
**Languages:** Python
**先修要求:**Fase 6 · 04, 05, 06, 07, 11; Fase 11 · 09 (Llamamiento a la función); Fase 14 · 01 (Luz de agente)
**Time:** ~120 分钟

##  problemas

Construir un ayudante de extremo a extremo:

1. 捕获麦克风输入 ((16 kHz mono) ⋅
2. 检测用户语音的开始/结束──
3. continuar la transmisión 转写。
4. Transcribirá la transcripción de un LLM con herramientas que se pueden utilizar (timer, clima, calendario).
5. Se transmitirá el texto del LLM al TTS.
6. Se puede escuchar el audio.
7. Si el usuario está en el camino de regreso, entonces se detiene.

La latencia 目标: en el CPU de la computadora portátil, desde el usuario habla terminó el discurso comenzó, 800 ms 内输出第一个TTS音频字节──Quality 目标:不漏词、不在静音时幻觉出字幕、不发生语音克隆 泄漏、不让快速注射成功──

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七个组件

1. **Audio capture。**Mic → 16 kHz mono → 20 ms trozos── usualmente en Python`sounddevice`, producción en el ambiente de uso original AudioUnit/ALSA/WASAPI。
2. **VAD（Lesson 11）。**Silero VAD @ umbral 0,5,min habla 250 ms, silencio colgado 500 ms──envía "inicio" y "fina" 信号──
3. **流式 STT（Lesson 4-5）。**•Susper-streaming•Parakeet-TDT o Deepgram Nova-3 (API)
4. **带 tool calling 的 LLM。**GPT-4o / Claude 3.5 / Gemini 2.5 Flash── herramientas Utilizando esquema JSON── Tokens de transmisión──
5. **Streaming TTS（Lesson 7）。**Kokoro-82M (最快的开放模型) o Cartesia Sonic (商业) ⋅ en 20 tokens de LLM 后启动 TTS──
6. **Playback。**El altavoz fuera; bajo带宽网络使用 opus-encode。
7. **Interruption handler。**Si VAD durante la reproducción de TTS 触发, suspender la reproducción, eliminar LLM, reiniciar STT

### Las tres modalidades de fracaso que encontrarás

1. **First-word clip。**VAD  iniciación tarde una rato ∞ usuario "hey" ∞ pierde ∞ comienzo límite ∞ 0.3, en lugar de 0.5 ∞
2. **Mid-response interrupt confusion。**Usuario: Abogado: José Manuel de la Fama
3. **Silence hallucination。**Susurro en los marcos de calentamiento de静音 上输出 "Gracias por ver"──始终使用 VAD-gate──

### 2026 Producción de estacas de referencia

| Stack | Latency | License | Notes |
|-------|---------|---------|-------|
| LiveKit + Deepgram + GPT-4o + Cartesia | 350-500 ms | commercial API | 2026 行业默认方案 |
| Pipecat + Whisper-streaming + GPT-4o + Kokoro | 500-800 ms | mostly open | 对 DIY 友好 |
| Moshi (full-duplex) | 200-300 ms | CC-BY 4.0 | Single-model；不同架构，lesson 15 |
| Vapi / Retell (managed) | 300-500 ms | commercial | 最快上线；定制能力有限 |
| Whisper.cpp + llama.cpp + Kokoro-ONNX | offline | open | 隐私 / edge |


```figure
v4-voice-latency
```

## Construcción

### 步骤 1: 带 chunking de micrófono captura(pseudocódigo)

```python
import sounddevice as sd

def mic_stream(chunk_ms=20, sr=16000):
    q = queue.Queue()
    def cb(indata, frames, time, status):
        q.put(indata.copy().flatten())
    with sd.InputStream(channels=1, samplerate=sr, blocksize=int(sr * chunk_ms/1000), callback=cb):
        while True:
            yield q.get()
```

### Paso 2: Captura de la red de VAD

```python
def capture_turn(stream, vad, pre_roll_ms=300, silence_ms=500):
    buf, pre, triggered = [], collections.deque(maxlen=pre_roll_ms // 20), False
    silent = 0
    for chunk in stream:
        pre.append(chunk)
        if vad(chunk):
            if not triggered:
                buf = list(pre)
                triggered = True
            buf.append(chunk)
            silent = 0
        elif triggered:
            silent += 20
            buf.append(chunk)
            if silent >= silence_ms:
                return b"".join(buf)
```

### 步骤 3: transmisión de STT → LLM → TTS

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### Paso 4: Llamando a herramientas dentro del ciclo de LLM

```python
tools = [
    {"name": "get_weather", "parameters": {"location": "string"}},
    {"name": "set_timer", "parameters": {"seconds": "int"}},
]

async for chunk in llm.stream(user_text, tools=tools):
    if chunk.type == "tool_call":
        result = dispatch(chunk.name, chunk.args)
        continue_streaming(result)
    if chunk.type == "text":
        await tts.stream(chunk.text)
```

### 步骤 5: Manejo de interrupciones

```python
tts_task = asyncio.create_task(tts_loop())
while True:
    chunk = await mic.get()
    if vad(chunk):
        tts_task.cancel()
        await speaker.stop()
        await new_turn()
        break
```

## Uso

¿ Qué pasa ?`code/main.py`, de los cuales hay una simulación operable, con modelos de estubes 串起全部七组件, por lo que incluso sin hardware, también puedes ver la tubería 形态──真实实现中,将 stubs 替换为:

- `silero-vad`(El artículo`pip install silero-vad`(en inglés)
- `deepgram-sdk`O `openai-whisper`
- `openai`(El artículo`gpt-4o`) o `anthropic`
- `kokoro`O `cartesia`
- Usado para la entrada y salida`sounddevice`

## 常见陷

- **永久记录 PII。**En la mayoría de las jurisdicciones judiciales, el audio completo pertenece a PII。 retener 30 天,静态加密。
- **没有 barge-in。**Su asistente debe dejar de hablar.
- **阻塞的 TTS。**Con el paso TTS 会阻塞事件ループ── utilizar async o un único trayecto──
- **没有 tool-call 错误处理。**Herramientas 会失败──LLM 必须收到错误 + volver a intentar una vez,然后优雅降级──
- **过度激进的 hallucination filters。**过过度时,助手会反复说"No puedo ayudar con eso.";过不足时,它什么都敢说──用持久的设置校准──
- **没有 wake-word 选项。**Siempre escuchando es un secreto.

## 交付

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-voice-assistant-architect.md` Presupuesto + escala + lenguaje + restricciones de cumplimiento, producción de especificaciones de pila completa

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Utiliza módulos de estubes 模拟一个完整的端到端转,并印印各阶段延迟──
2. **Medium。**Usado pre-registro `.wav`上的真实 Whisper modelo 替换STT stub──测量 WER 和端到端延迟──
3. **Hard。**添加 herramienta llamada:实现 `get_weather`(API) y `set_timer` Hacer que el LLM 通过工具 路由,并验证 Cuando el usuario dice "establecer un temporizador de 5 minutos" 时, la función correcta se inicia, y el mensaje se vuelve a confirmar.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Turn | 用户 + 助手的一次往返 | 一个由 VAD 界定的用户语音 + 一个 LLM-TTS 回复。 |
| Barge-in | 打断 | 用户在助手说话时开口；助手停止。 |
| Wake word | "Hey assistant" | 短关键词检测器；Porcupine、Snowboy、openWakeWord。 |
| End-pointing | Turn 结束 | VAD + min-silence 决策，用于判断用户已经说完。 |
| Pre-roll | 语音前缓冲 | 保留 VAD 触发前 200-400 ms 的 audio，以避免 first-word clip。 |
| Tool call | 函数调用 | LLM 发出 JSON；runtime dispatch；result 回填到 loop 中。 |

## 延伸阅读

- [LiveKit — 语音 agent quickstart](https://docs.livekit.io/agents/)  生产级参考。
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat) Para hacer tu propio trabajo en un marco amigable.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) gestión de la voz nativa 路径。
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) doble completo 参考(lección 15)。
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) la puerta de la palabra de la despertar。
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) Llamando a la función de LLM
