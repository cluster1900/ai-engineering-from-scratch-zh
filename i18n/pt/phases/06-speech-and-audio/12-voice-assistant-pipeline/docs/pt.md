# 构建语音助手 Pipeline  Fase 6 Capstone

> Colocar todos os conteúdos das lições 01-11 juntos. Construir um assistente de voz que vai ouvir, pensar, responder. Em 2026, já é um problema de engenharia maduro, não um problema de pesquisa, mas o detalhe integrado decide se ele pode realmente sair em linha.

**Type:** 构建
**Languages:** Python
**先修要求:**Fase 6 · 04, 05, 06, 07, 11; Fase 11 · 09 (Calling Function); Fase 14 · 01 (Agent Loop)
**Time:** ~120 分钟

## 问题

Construir um assistente de ponta a ponta:

1. 捕获麦克风输入 ((16 kHz mono) ⋅
2. 检测用户语音的开始/结束──
3.   转写──
4. Transcrição de um LLM que pode ser usado para ferramentas (timer, tempo, calendário).
5. Vai transmitir texto de LLM para TTS.
6. O áudio será reproduzido para o usuário.
7. Se o usuário estiver em contato, então parar.

Latência objectivo: em CPU do computador portátil, desde o usuário falar terminado começar, 800 ms 内输出第一 TTS áudio byte──Quality 目标:不漏词、不在静音时幻觉出字幕、不发生语音克隆 泄漏、不让即时注射成功──

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七个组件

1. **Audio capture。**Mic → 16 kHz mono → 20 ms pedaços── normalmente em Python`sounddevice`, produção ambiente utilizao original AudioUnit/ALSA/WASAPI。
2. **VAD（Lesson 11）。**Silero VAD @ limiar 0,5,min fala 250 ms, silêncio pendurar 500 ms;;
3. **流式 STT（Lesson 4-5）。**Whisper-streaming、Parakeet-TDT 或 Deepgram Nova-3(API)。Transcrições parciais + finais。
4. **带 tool calling 的 LLM。**GPT-4o / Claude 3.5 / Gemini 2.5 Flash。 Ferramentas utilizam esquema JSON。 Tokens de fluxo。
5. **Streaming TTS（Lesson 7）。**Kokoro-82M (最快的开机) 模型) 或 Cartesia Sonic (商业) ⋅在 20 个 LLM tokens 后启动 TTS──
6. **Playback。**O alto-falantes fora; baixo带宽网络使用 opus-encode。
7. **Interruption handler。**Se VAD durante a reprodução do TTS 触发, parar de reprodução, eliminar LLM, reiniciar STT

### Três modos de falha que você encontrará

1. **First-word clip。**VAD  iniciação tarde um tempo. O "hei" do usuário 丢失── iniciação prazo Usar 0,3, em vez de 0,5──
2. **Mid-response interrupt confusion。**Utilizador  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar a gerar  Continuar  Continuar a gerar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continuar  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued  Continued
3. **Silence hallucination。**Suspirar em quadros de aquecimento em静音 上输出 "Obrigado por assistir"──始终使用 VAD-gate──

### 2026 Produtos de produção

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

## Construção

### 步骤 1: 带 chunking 的 mic capture(pseudocode)

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

### Passo 2: Captura de turnos de passageiros

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

### 步骤 3: streaming STT → LLM → TTS

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### 步骤 4: chamada de ferramenta dentro do loop LLM

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

### 步骤 5: Manutenção de interrupção

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

## Utilização

- Não .`code/main.py`, em que há uma simulação operacional, usando modelos de estúdios 串起全部七组件, assim mesmo sem hardware, você também pode ver pipeline 形态──真实实现中,将 stubs 替换为:

- `silero-vad`(`pip install silero-vad`)
- `deepgram-sdk`Ou `openai-whisper`
- `openai`(`gpt-4o`) ou `anthropic`
- `kokoro`Ou `cartesia`
- Utilizando I/O `sounddevice`

## 常见陷

- **永久记录 PII。**Na maioria dos jurisdições judiciais, o áudio completo pertence ao PII。
- **没有 barge-in。**O usuário vai-se interromper.
- **阻塞的 TTS。**Simpele TTS 会阻塞事件ループ── use async or单独线程──
- **没有 tool-call 错误处理。**Ferramentas 会失败──LLM 必须收到错误 + Re-try once,然后优雅降级──
- **过度激进的 hallucination filters。**过过度时,助手会反复说"Eu não posso ajudar com isso. ";过不足时,它什么都敢说──用持久的设置校准──
- **没有 wake-word 选项。**Sempre ouvindo é o "隐私风险"",Add-add wake-word gate" ("Porco-verde" ou "OpenWakeWord") "

## 交付

保存为 `outputs/skill-voice-assistant-architect.md` Foram definidos os orçamentos + escala + linguagem + restrições de conformidade, produzindo uma série completa de especificações.

## 练习

1. **Easy。**运行 `code/main.py` Utiliza módulos de estúdio 模拟一个完整的端到端转,并印印各阶段延迟
2. **Medium。**Usado em pré-registro`.wav`上的真实 Whisper modelo 替换STT stub──测量 WER 和端到端延迟──
3. **Hard。**添加 chamada de ferramenta:实现 `get_weather`(API) e `set_timer` Deixar LLM 通過工具 路由,并验证 Quando o usuário diz "set a 5 minute timer" 时,正确函数会触发,且语音回复会确认──

## 关键术语
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
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat) Para um quadro amigável de DIY.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) gestão de voz nativa 路径。
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) duplex completo 参考(Lessão 15)。
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/)- O que é isso?
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) Chamando a função de LLM
