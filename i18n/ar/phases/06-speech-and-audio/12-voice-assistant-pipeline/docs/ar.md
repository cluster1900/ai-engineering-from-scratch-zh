# 构建语音助手 خط الأنابيب  المرحلة 6 Capstone

> وضع كل المحتويات في الدروس 01-11 مرتبطة. بناء مساعدة صوتية تسمع. تُفكر. تُجاوب. في عام 2026، هذا هو بالفعل مشكلة هندسية متقدمة، وليس مشكلة دراسية، ولكن التفاصيل المجمعة تعتزم ما إذا كان يمكن أن يصل إلى الإنترنت حقا.

**Type:** 构建
**Languages:** Python
**先修要求:**المرحلة 6 · 04, 05, 06, 07, 11; المرحلة 11 · 09 (تدعو الوظيفة) ؛ المرحلة 14 · 01 (حلقة العملاء)
**Time:** ~120 分钟

## 问题

构建一个端到端助手:

1. 捕获麦克风输入 ((16 كيلوهرتز)
2. 检测用户语音的开始/结束──
3. 进行 سلسلة 转写。
4. سوف نقل 传给一个可以调用工具的LLM (تايمر,ثقس,قوّم)
5. ستقوم بتمرير رسائل الجامعة إلى TTS
6. سوف نضيف الصوت للمستخدم
7. إذا كان المستخدم في طريق الانتقال، فانقطاع.

الامتداد  هدف: على جهاز الكمبيوتر المحمول، من المستخدم يقول完话开始,800 ms 内输出第一 TTS صوت البايت.

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七组件

1. **Audio capture。**ميكروفون → 16 كيلوهرتز مونو → 20 ms قطعة `sounddevice`, توليد البيئة استخدام الأصليات AudioUnit/ALSA/WASAPI
2. **VAD（Lesson 11）。**سيلرو فاد @ عتبة 0.5 دقيقة خطاب 250 ms، صمت تعليق 500 ms── إصدار "البدء" و "النهاية" 信号──
3. **流式 STT（Lesson 4-5）。**التهريب الهزئ ‧الباراكيت-تي دي تي أو ديبجرام نوفا-3(API)。 النسخة الجزئية + النهائية‬
4. **带 tool calling 的 LLM。**GPT-4o / Claude 3.5 / Gemini 2.5 Flash── أدوات استخدام نظام JSON── رموز التيار──
5. **Streaming TTS（Lesson 7）。**Kokoro-82M(最快的开放模型) أو كارتيسيا سونيك(商业) ・・・在 20 个 LLM توكن 后启动 TTS。
6. **Playback。**المتحدث خارج؛ 低带宽网络使用 oppus-encode。
7. **Interruption handler。**إذا كان VAD أثناء تشغيل TTS 触发, توقف تشغيل,取消 LLM, إعادة تشغيل STT

### ستواجهين ثلاثة أساليب فشل

1. **First-word clip。**VAD 启动晚一拍──用户的"هي" 丢失──起始门 用0.3,而不是0.5──
2. **Mid-response interrupt confusion。**مستمرة إنتاج المعلم بعد انقطاع المستخدم
3. **Silence hallucination。***فيسر في إطارات التدفئة الصوتية*

### 2026 أسطولات المعلومات

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

## الإنشاء

### الخطوة الأولى: 带 chunking 的 mic capture(pseudocode)

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

### الخطوة الثانية: إصابة الجولة التي تسيطر عليها

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

### 步骤 3: التدفق STT → LLM → TTS

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### 步骤 4: LLM حلقة 內工具呼叫

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

### الخطوة 5: التعامل مع التقطيع

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

## استخدام

查看 `code/main.py`، من بينها محاكاة قابلة للتشغيل ، باستخدام نماذج الحصن 串起全部七组件 ، حتى لو لم يكن هناك أجهزة ، يمكنك أيضًا رؤية خط الأنابيب 形态。 في الواقع التحقق ، سوف يتم استبدال الحصن 替换为:

- `silero-vad`(`pip install silero-vad`)
- `deepgram-sdk`أو`openai-whisper`
- `openai`(`gpt-4o`) أو `anthropic`
- `kokoro`أو`cartesia`
- تستخدم في الإدخال`sounddevice`

## 常见陷

- **永久记录 PII。**في معظم مناطق القانون، الصوت كامل المدير ينتمي إلى PII── الحفاظ على 30 天,静态加密──
- **没有 barge-in。**المستخدم سوف يتوقف. المساعد الخاص بك يجب أن يتوقف عن الحديث.
- **阻塞的 TTS。**مع التخطيط التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل التنقل
- **没有 tool-call 错误处理。**أدوات 会失败──LLM 必须收到错误 + 尝试一次,然后优雅降级──
- **过度激进的 hallucination filters。**过过度时,助手会反复说 "لا أستطيع المساعدة في ذلك. "过不足时,它什么都敢说──用持久的设置校准──
- **没有 wake-word 选项。**دائماً الاستماع هو隐私风险。添加 wake-word gate ((البوركوبين أو openWakeWord)。

## 交付

保存为 `outputs/skill-voice-assistant-architect.md` تم تحديد الميزانية + الحجم + اللغة + القيود الملتزمة، وتحقيق الميزانية الكاملة

## التدريب

1. **Easy。**运行 `code/main.py` يستخدم وحدات القطع 模拟一个完整的端到端转,并印印各阶段延迟──
2. **Medium。**تستخدم التسجيلات`.wav`上的真实 Whisper النموذج 替换STT stub──测量 WER 和端到端延迟──
3. **Hard。**添加 أداة الاتصال:实现 `get_weather`(أي إيه بي) و `set_timer` جعل الـ LLM 通過 أدوات 路由,并验证 عندما يقول المستخدم "وضع 5 دقيقة التوقيت" ، صحيحة

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
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat) على إطار صداقة DIY
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) إدارة الصوت الأصلي 路径。
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) كامل المزدوج 参考(درس 15)
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) إيقاف الكلمات المفتوحة
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) دعوة وظيفة LLM
