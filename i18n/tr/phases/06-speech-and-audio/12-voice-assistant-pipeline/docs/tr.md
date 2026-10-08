# 构建语音助手 Pipeline  Fase 6 Kapstone

> 01-11 derslerinin tüm içeriğini bir araya getirmek. Bir dinleme, düşünme ve cevaplama konuşma asistanı oluşturmak. 2026 yılında, bu bir araştırma sorunu değil, gelişmiş bir mühendislik sorunu haline geldi.

**Type:** 构建
**Languages:** Python
**先修要求:**6 · 04, 05, 06, 07, 11; 11 · 09 aşaması (Fonksiyon Çağırımı); 14 · 01 aşaması (Agent Çapısı)
**Time:** ~120 分钟

## 问题

构建一个端到端助手:

1. 捕获麦克风输入(16 kHz mono)
2. 检测用户语音的开始/结束──
3.  转写―― 转写── 转写──
4. Transkriptini, kullanabileceğimiz bir araçla (zaman, hava, takvim) aktarır.
5. LLM metni TTS'e akıştıracak.
6. Sesleri kullanıcıya oynatacağım.
7. Eğer kullanıcı bir kez daha yol açarsa, durdurulur.

Gecikme  hedef: dizüstü bilgisayar CPU'sinde, kullanıcı konuşmasını başlatmak, 800 ms içinde ilk TTS ses baytını çıkarmak.

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七个组件

1. **Audio capture。**Mik → 16 kHz mono → 20 ms parçaları── genellikle Python'da kullanılır `sounddevice`,生产环境中使用原生 AudioUnit/ALSA/WASAPI。
2. **VAD（Lesson 11）。**Silero VAD @ eşiği 0,5, dakika konuşma 250 ms, sessizlik 500 ms,..
3. **流式 STT（Lesson 4-5）。**Şapış-akıştıran, Parakeet-TDT veya Deepgram Nova-3 (API)
4. **带 tool calling 的 LLM。**GPT-4o / Claude 3.5 / Gemini 2.5 Flash。Alat JSON şema kullanımı。Ağlama simgeler。
5. **Streaming TTS（Lesson 7）。**Kokoro-82M (最快的开放模型) veya Cartesia Sonic (商业) ⋅在 20 个 LLM token 后启动 TTS──
6. **Playback。**Konuşmacı çıkıyor; düşük genişlik ağı kullanımı opus-kodlanmaktadır。
7. **Interruption handler。**Eğer VAD TTS oynatma sırasında 触发, durdurma oynatma,取消 LLM, STT yeniden başlatmak

### Başarısızlık üç yöntemiyle karşılaşacaksın.

1. **First-word clip。**VAD 启动晚一拍──用户的"hey" 丢失──起始门 用0.3,而不是0.5──
2. **Mid-response interrupt confusion。**Uzuor打断后 LLM 仍继续生成;助手和用户抢话──连接 VAD → cancel-LLM──
3. **Silence hallucination。**Şöyle sesleniyor: "Sözüm için teşekkürler"

### 2026 生产参考 stacks

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

## Yapım

### 步骤 1: 带 chunking 的 mikrofon yakalama(pseudocode)

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

### Adım 2: VAD kontrolü altındaki yakalama

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

### 步骤 3: STT → LLM → TTS akışı

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### 步骤 4: LLM döngüsü içinde araç çağrı

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

### 步骤 5: kesinti işleme

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

## kullanımı

- Bakın .`code/main.py`, bir çalışılabilir simülasyon var, bu yüzden bileşen olmadan, tuğla 形态──真实实现中,将 stubs 替换为:

- `silero-vad`(`pip install silero-vad`)
- `deepgram-sdk`Ya da`openai-whisper`
- `openai`(`gpt-4o`) veya `anthropic`
- `kokoro`Ya da`cartesia`
- İ/O'ya`sounddevice`

## 常见陷

- **永久记录 PII。**Çoğu yargıçlık bölgesinde, tam ses dönüşü PII'ye aittir.
- **没有 barge-in。**Kullanıcı kesilmek zorunda.
- **阻塞的 TTS。**Aynı zamanda TTS 会阻塞事件ループ── async veya单独线程── kullanmak.
- **没有 tool-call 错误处理。**Araçlar 会失败──LLM 必須 誤り + tekrar denemek için bir kez, sonra优雅降级──
- **过度激进的 hallucination filters。**过过度时,助手会反复说 "Bunu yapamam".
- **没有 wake-word 选项。**Her zaman dinlemek, 隐私风险──添加 唤醒门

## 交付

保存为 `outputs/skill-voice-assistant-architect.md`◊ belirlenmiş bütçe + ölçek + dil + uyumluluk kısıtlamaları,

## 练习

1. **Easy。**运行  İşlem`code/main.py`                                                                                                                                                                                                                                                              
2. **Medium。**Ön kaydı kullanın.`.wav`上的真实 Whisper model 替换STT stub──测量 WER 和端到端延迟──
3. **Hard。**添加 araç çağrı:实现 `get_weather`(herhangi bir API)`set_timer`▽ LLM 通過工具 路由,并验证 ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒

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

- [LiveKit — 语音 agent quickstart](https://docs.livekit.io/agents/) 生产级参考。
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat) DIY dostu çerçevesine için.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) yönetilen sesli-dev yolları。
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) tam çiftlik 参考(15 ders)
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) Uyanık söz kaplamaları。
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) LLM fonksiyonu çağrısı
