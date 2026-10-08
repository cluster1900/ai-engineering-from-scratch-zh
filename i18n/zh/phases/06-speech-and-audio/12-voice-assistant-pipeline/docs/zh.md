# 构建语音助手管道 第6阶段 石头

> 让课程01-11的内容全部连在一起. 构建一个会听,会思考,会应对的语音助理.

**Type:** 构建
**Languages:** Python
**先修要求:**阶段 6 · 04, 05, 06, 07, 11;阶段 11 · 09 (职能调用);阶段 14 · 01 (代理循环)
**Time:** ~120 分钟

## 问题

构建一个端到端助手:

1. 捕获麦克风输入 ((16kHz单频) ⋅
2. 检测用户语音的开始/结束.
3. 进行流媒体转写.
4. 将转录传给一个可以调用工具的LLM (时间,天气,日历).
5. 将LLM文本流向TTS.
6. 播放给用户.
7. 如果用户在回复中途打断,则停止.

延迟目标:在笔记本电脑CPU上,从用户说完话开始,800 ms内输出第一个TTS音频字节――质量 目标:不漏词、不静音时幻觉出字幕、不发生语音克隆 泄漏、不让快速注射成功――

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七个组件

1. **Audio capture。**微 → 16 kHz 单 → 20 ms 块──通常在 Python 中使用`sounddevice`产业环境中使用原生音频单元/ALSA/WASAPI。
2. **VAD（Lesson 11）。**声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声声
3. **流式 STT（Lesson 4-5）。**声流,子-TDT或深度图 Nova-3 (API) 部分+最终转录.
4. **带 tool calling 的 LLM。**工具 使用 JSON 模式──流程代币──
5. **Streaming TTS（Lesson 7）。**卡特西亚索尼克 (Kokoro-82M) 后启动TTS.
6. **Playback。**发音机已关闭;低带宽网络使用操作代码――
7. **Interruption handler。**如果VAD在TTS播放期间触发,停止播放,取消LLM,重启STT──

### 你会遇到三个失败模式

1. **First-word clip。**开始使用0.3而不是0.5的门.
2. **Mid-response interrupt confusion。**用户打断后LLM 继续产生;助手和用户抢话――连接 VAD →取消LLM──
3. **Silence hallucination。**语 在静音加热上输出"谢谢你观看"──始终使用VAD-gate──

### 2026 生产参考堆

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

### 步骤1: 带 的微信捕获(伪码)

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

### 步骤2:VAD 门控轮次捕获

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

### 步骤3:流媒体STT → LLM → TTS

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### 步骤 4: LLM循环中的工具调用

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

### 步骤 5: 干扰处理

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

## 使用

查看`code/main.py`它们中的一个可运行的模拟,使用模块 串起全部七个组件,所以即使没有硬件,你也可以看到管道形态.

- `silero-vad`(`pip install silero-vad`)
- `deepgram-sdk`或`openai-whisper`
- `openai`(`gpt-4o`) 或`anthropic`
- `kokoro`或`cartesia`
- 为了I/O`sounddevice`

## 常见陷

- **永久记录 PII。**在大多数司法管辖区,完整转换音频都属于PII──保留 30 天,静态加密──
- **没有 barge-in。**用户会打断. 你的助手必须停止说话.
- **阻塞的 TTS。**同步TTS 会阻塞事件循环――使用异步或单独线程――
- **没有 tool-call 错误处理。**工具会失败――LLM 必须收到错误+再尝试一次,然后优雅降级――
- **过度激进的 hallucination filters。**过过度时,助手会反复说"我不能帮助.";过不足时,它什么都敢说――用持久的设置校准――
- **没有 wake-word 选项。**总是听着是隐私风险──添加唤醒口或开启唤醒口.

## 交付

保存为`outputs/skill-voice-assistant-architect.md`△给定预算+规模+语言+合规限制,产出完整的堆积规范

## 练习

1. **Easy。**运行`code/main.py`△它使用模块模拟一个完整的端到端转,并打印各阶段的延迟.
2. **Medium。**预录的`.wav`上的真实 语模型 替换STT stub──测量WER 和端到端延迟──
3. **Hard。**添加工具调用:实现 `get_weather`(任意的API) 和 `set_timer`△让LLM 通过工具 路由,并验证 当用户说"设置5分钟计时器"时,正确函数会触发,且语音回复会确认──

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

- [LiveKit — 语音 agent quickstart](https://docs.livekit.io/agents/) 生产级参考――
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat)对 DIY友好的框架.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)管理的语音原生路径──
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi)全副本 参考(15课)
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/)警报关门――
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) LLM 职能调用――
