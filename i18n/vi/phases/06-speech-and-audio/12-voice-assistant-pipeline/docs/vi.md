# 构建语音助手 đường ống  Giai đoạn 6 Capstone

> Hãy kết hợp tất cả các nội dung của bài học 01-11 với nhau. Hãy xây dựng một trợ lý tiếng nói sẽ nghe, suy nghĩ, phản ứng. Năm 2026, đây đã là một vấn đề kỹ thuật trưởng thành, chứ không phải là vấn đề nghiên cứu, nhưng các chi tiết tích hợp quyết định liệu nó có thể thực sự lên đường hay không.

**Type:** 构建
**Languages:** Python
**先修要求:**Giai đoạn 6 · 04, 05, 06, 07, 11; Giai đoạn 11 · 09 (Tạm dịch gọi); Giai đoạn 14 · 01 (Tạm dịch vòng lặp)
**Time:** ~120 分钟

## 问题

构建一个端到端助手:

1. 捕获麦克风输入 ((16 kHz mono) ⋅
2. 检测用户语音的开始/结束──
3. 进行流 转写。
4. sẽ chuyển bản sao  truyền cho một LLM có thể sử dụng các công cụ (timer, thời tiết, lịch).
5. Sẽ truyền tin nhắn LLM đến TTS.
6. sẽ phát âm thanh cho người dùng.
7. Nếu người dùng đang quay lại trong quá trình chia tay, thì dừng lại.

延迟 目标: trên máy tính xách tay, từ người dùng nói xong话 bắt đầu, 800 ms 内输出 đầu tiên TTS tiếng nói byte。 chất lượng 目标:不漏词、不在静音时幻觉出字幕、不发生语音克隆 泄漏、不让快速注射成功。

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七个组件

1. **Audio capture。**Mic → 16 kHz mono → 20 ms chunks── thường được sử dụng trong Python `sounddevice`, sản xuất môi trường sử dụng nguyên sinh AudioUnit/ALSA/WASAPI。
2. **VAD（Lesson 11）。**Silero VAD @ ngưỡng 0,5,min nói 250 ms, câm lặng đâm 500 ms── phát phát "bắt đầu" 和 "sự kết thúc" 信号──
3. **流式 STT（Lesson 4-5）。**Whisper-streaming、Parakeet-TDT 或 Deepgram Nova-3(API)。Các bản sao phần + cuối cùng。
4. **带 tool calling 的 LLM。**GPT-4o / Claude 3.5 / Gemini 2.5 Flash。 Công cụ sử dụng JSON scheme。Stream token。
5. **Streaming TTS（Lesson 7）。**Kokoro-82M(最快的开放模型) 或 Cartesia Sonic(商业) ・ 在 20 个 LLM token 后启动 TTS。
6. **Playback。**Người phát biểu ra; 低带宽网络使用 opus-encode。
7. **Interruption handler。**Nếu VAD trong thời gian phát lại TTS 触发, dừng phát lại,取消 LLM, khởi động lại STT。

### Bạn sẽ gặp phải ba chế độ thất bại

1. **First-word clip。**VAD  khởi động một lần. Người dùng "hey" 丢失.
2. **Mid-response interrupt confusion。**Người dùng đã chấm dứt LLM  vẫn tiếp tục tạo ra; trợ助和用户抢话──连接 VAD → hủy-LLM──
3. **Silence hallucination。**Whisper 在静音 暖-up frame 上输出 "Cảm ơn đã xem"──始终使用 VAD-gate──

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

### 步骤 1: 带 chunking của microphone bắt được(pseudocode)

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

### Bước 2: VAD 门控的轮次捕获

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

### 步骤 4: LLM vòng trong công cụ gọi

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

### 步骤 5: xử lý gián đoạn

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

查看 `code/main.py`, trong đó có một mô phỏng có thể vận hành, sử dụng các mô hình stub 串起全部七组件, vì vậy ngay cả khi không có phần cứng, bạn cũng có thể thấy đường ống 形态。 thực hiện trong, sẽ stubs 替换为:

- `silero-vad`(`pip install silero-vad`(văn)
- `deepgram-sdk`Hoặc`openai-whisper`
- `openai`(`gpt-4o`) hoặc `anthropic`
- `kokoro`Hoặc`cartesia`
- Sử dụng cho I/O `sounddevice`

## 常见陷

- **永久记录 PII。**Trong hầu hết các khu vực pháp lý, âm thanh hoàn chỉnh thuộc về PII。 giữ lại 30 天,静态加密。
- **没有 barge-in。**Người dùng sẽ đập đập. Người trợ lý của bạn phải dừng nói.
- **阻塞的 TTS。**Đồng thời TTS 会阻塞事件循环──使用异步或单独线程──
- **没有 tool-call 错误处理。**Công cụ 会失败──LLM 必须收到错误 + thử lại một lần,然后优雅降级──
- **过度激进的 hallucination filters。**过过度时,助手会反复说"Tôi không thể giúp được điều đó. ";过不足时,它什么都敢说──用持久的设置校准──
- **没有 wake-word 选项。**Luôn lắng nghe là sự ẩn náu.

## 交付

保存为 `outputs/skill-voice-assistant-architect.md` Giới hạn ngân sách + quy mô + ngôn ngữ + tuân thủ, sản xuất đầy đủ các quy mô.

## 练习

1. **Easy。**运行 `code/main.py`Nó sử dụng các mô-đun stub mô-đun mô-đun một vòng hoàn chỉnh, và in các giai đoạn trễ.
2. **Medium。**Sử dụng dự án ghi âm`.wav`上的真实 Whisper model 替换 STT stub──测量 WER 和 cuối đến cuối độ trễ──
3. **Hard。**添加 công cụ gọi:实现 `get_weather`(bản ứng API tùy chọn) và `set_timer`▽让LLM 通过工具 路由,并验证 当用户说"set a 5 minute timer"时,正确函数会触发,且语音回复会确认──

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
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat) Đối với DIY thân thiện khung hình.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) quản lý giọng nói bản địa 路径。
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) toàn bộ duplex 参考(Dạy 15)。
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) báo thức.
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) LLM chức năng gọi:.
