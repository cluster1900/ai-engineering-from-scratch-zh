# 构建语音助手 पाइपलाइन  चरण 6 कैपस्टोन

> सबक 01-11 को एक साथ रखना है। एक भाषण सहायक का निर्माण करना है जो सुनने, सोचने, प्रतिक्रिया करने के लिए होगा। 2026 में, यह एक परिपक्व इंजीनियरिंग समस्या है, न कि एक अध्ययन समस्या, लेकिन एकीकरण विवरण यह तय करेगा कि यह वास्तव में ऑनलाइन हो सकता है या नहीं।

**Type:** 构建
**Languages:** Python
**先修要求:**चरण 6 · 04, 05, 06, 07, 11; चरण 11 · 09 (फंक्शन कॉल); चरण 14 · 01 (एजेंट लूप)
**Time:** ~120 分钟

## 问题

构建一个端到端助手:

1. 捕获麦克风输入(16 किलोग्राम मोनो) ⋅
2. 检测用户语音的开始/结束──
3. 转写──
4. एक LLM को ट्रांसक्रिप्ट 传递 कर सकते हैं जो टूल को अनुकूलित कर सकते हैं
5. टीटीएस तक LLM पाठ स्ट्रीमिंग करेगा
6.  ऑडियो 播放给用户
7. यदि उपयोगकर्ता में वापसी के बीच का रास्ता टूट जाता है, तो रुक जाता है।

लटेंसी  लक्ष्य: लैपटॉप सीपीयू पर, उपयोगकर्ता से बोलने के लिए शुरू, 800 ms 内输出 प्रथम TTS ऑडियो बाइट्स。 गुणवत्ता  लक्ष्य:不漏词、不在静音时幻觉出字幕、不发生语音克隆 泄漏、不让快速注射成功──

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七个组件

1. **Audio capture。**माइक्रो → 16 kHz मोनो → 20 ms टुकड़े── आमतौर पर Python में प्रयोग `sounddevice`, उत्पादन वातावरण में उपयोग मूलभूत AudioUnit/ALSA/WASAPI。
2. **VAD（Lesson 11）。**Silero VAD @ threshold 0.5,min speech 250 ms,silence hangover 500 ms──发出"start"和"end"信号──
3. **流式 STT（Lesson 4-5）。**विस्पर-स्ट्रीमिंग、पाराकीट-टीडीटी या डीपग्राम नोवा-3(एपीआई)。 आंशिक + अंतिम प्रतिलेखन──
4. **带 tool calling 的 LLM。**GPT-4o / Claude 3.5 / Gemini 2.5 फ्लैश──Tools JSON schema──Stream tokens──
5. **Streaming TTS（Lesson 7）。**कोकोरो-82एम (अधिकतर ओपन) या कार्टेशिया सोनिक (अधिकतर ओपन)
6. **Playback。**स्पीकर आउट;低带宽网络使用 oppus-encode──
7. **Interruption handler。**यदि VAD में TTS प्लेबैक  के दौरान触发, रोक प्लेबैक,取消LLM, पुनः आरंभ STT

### आप तीन विफलता मोड का सामना करेंगे

1. **First-word clip。**VAD 启动晚一拍──用户的"हाय" 丢失──起始门 0.3 से 0.5 के बजाय 0.3
2. **Mid-response interrupt confusion。**उपयोगकर्ता के ब्रेकअप के बाद LLM  जारी है; सहायक और उपयोगकर्ता 抢话──连接 VAD → रद्द-LLM──
3. **Silence hallucination。**Whisper 在静音 वार्मिंग फ्रेम 上输出 "देखने के लिए धन्यवाद"──始终使用VAD-gate──

### 2026 生产 संदर्भ स्टैक

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

## 构建

### 步骤 1: 带 chunking के माइक्रो कैप्चर(pseudocode)

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

### चरण 2: वार्ड के नियंत्रण में आने वाली क्रमिक पकड़े

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

### 步骤 3: स्ट्रीमिंग STT → LLM → TTS

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### 步骤 4: LLM लूप 內工具 calling

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

### 步骤 5: विराम प्रक्रिया

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

## उपयोग

查看 `code/main.py`, जिसमें एक चलाने योग्य सिमुलेशन है, स्टब मॉडल के साथ 串起全部七组件, इसलिए भले ही कोई हार्डवेयर न हो, आप भी पाइपलाइन देख सकते हैं 形态──真实实现中,将 stubs 替换为:

- `silero-vad`(`pip install silero-vad`)
- `deepgram-sdk`या `openai-whisper`
- `openai`(`gpt-4o`) या `anthropic`
- `kokoro`या `cartesia`
- उपयोग में आई / ओ `sounddevice`

## 常见陷

- **永久记录 PII。**अधिकांश न्यायिक अधिकार क्षेत्र में, पूर्ण बारी ऑडियो PII के अंतर्गत आता है।
- **没有 barge-in。**उपयोगकर्ता का बोलना बंद हो जाएगा।
- **阻塞的 TTS。**समतुल्य या एकल-आधारित मार्गों का उपयोग करके।
- **没有 tool-call 错误处理。**उपकरण 会失败──LLM 必须收到错误 + पुनः प्रयास एक बार,然后优雅降级──
- **过度激进的 hallucination filters。**过过度时,助手会反复说"मैं इसके साथ मदद नहीं कर सकता. ";过不足时,它什么都敢说──用持久的设置校准──
- **没有 wake-word 选项。**हमेशा सुनना है 隐私风险──添加 जागृति शब्द गेट ((Porcupine या openWakeWord) 

## 交付

保存为 `outputs/skill-voice-assistant-architect.md` निर्धारित बजट + पैमाने + भाषा + अनुपालन प्रतिबंध, पूर्ण स्टैक विनिर्देशों का उत्पादन

## अभ्यास

1. **Easy。**运行 `code/main.py`यह स्टब मॉड्यूल का उपयोग करके 模拟一个完整的端到端转,并印印各阶段延迟
2. **Medium。**पूर्व रिकॉर्डिंग के साथ`.wav`上的真实 व्हिस्पर मॉडल 替换STT stub──测量 WER 和 एंड-टू-एंड लटेंसी──
3. **Hard。**添加 उपकरण कॉलः实现 `get_weather`(वैकल्पिक एपीआई) और `set_timer`让LLM 通过工具 路由,并验证当用户说"设置5分钟计时器"时,正确函数会触发,且语音回复会确认

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
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat) DIY मित्रतापूर्ण ढांचे के लिए
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) प्रबंधित आवाज-मौलिक 路径。
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) पूर्ण-डूप्लेक्स 参考(पढ़ना 15)
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) जागृति शब्द गेटिंग。
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) LLM कार्य कॉल करना
