# 实时音频处理

> Các đường ống hàng loạt xử lý một tập tin. Các đường ống thời gian thực cần phải xử lý trong 20 giây tới trước khi tiếp theo.

**类型：**构建
**语言：**Python
**先修：**Giai đoạn 6 · 02(Spectogram) Giai đoạn 6 · 04(ASR) Giai đoạn 6 · 07(TTS)
**时间：**约75分钟

## 问题

Bạn muốn một cảm giác sống động trợ lý giọng nói.  Hỗn thoại người dùng thay đổi thời gian trễ khoảng ~ 230 ms.**hear → understand → respond → speak**循环的预算是:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

Moshi (Kyutai, 2024) đạt 200 ms toàn bộ képlex──GPT-4o-time thực (2024) 约为 ~320 ms──2022年发布的轮管线是 2500 ms──这10× 改进来自三种技术:(1) 全链路流,(2) Sử dụng kết quả bán lẻ của ống dẫn không đồng bộ,(3) thế hệ bị gián đoạn──

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**Tiếng nghe thời gian thực 以固定大小的块流动──常见选择:20 ms(16 kHz 下 320 mẫu)──下游一切都必须跟上这个节奏──

**Ring buffer。**固定大小的圆形缓冲──Producer thread 写入新框架,消费者 thread 读取──避免在热路中分配内存──大小 ≈ tối đa độ trễ × tỷ lệ mẫu; 2 giây 16 kHz vòng = 32.000 mẫu──

**VAD (Voice Activity Detection)。**Khi没人说话时,关闭下游工作──Silero VAD 4.0 (2024) trên CPU mỗi khung 30 ms 运行时间 <1 ms──`webrtcvad`là một giải pháp thay thế cũ hơn.

**Streaming ASR。**随着音频到达而输出部分转录的模型──Parakeet-CTC-0.6B 在流媒体模式 (NeMo, 2024) 下,以 320 ms latency 达到25% WER──Whisper-Streaming (Macháček et al., 2023) 将 Whisper 切成块, 在 ~2s latency 下实现近流媒体──

**Interruption。**Khi trợ lý đang nói chuyện khi người dùng mở cửa, bạn phải (a) kiểm tra barge-in, (b) dừng TTS, (c) bỏ hết phần còn lại của LLM xuất.

**WebRTC Opus transport。**20 ms khung hình, 48 kHz, tự thích ứng bitrate 8128 kbps── đó là trình duyệt và tiêu chuẩn của di động──LiveKit、Daily.co、Pion là công nghệ xây dựng ứng dụng thoại năm 2026──

**Jitter buffer。**Các gói mạng có thể乱序或延迟到达──Jitter buffer 会重排并平滑; quá nhỏ → 可听的间隙, quá lớn → độ trễ──đối tượng là 6080 ms──

### 常见坑

- **Thread contention。**GIL của Python + các mô hình nặng có thể làm cho chuỗi âm thanh 饥饿── sử dụng thư viện âm thanh C-callback(sounddevice、PortAudio),并让 Python 远离热路──
- **Sample-rate conversion latency。**Trong đường ống trong trọng lượng sẽ tăng 520 ms.`soxr_hq`(■)
- **TTS priming。**Ngay cả như Kokoro như vậy, lần đầu tiên yêu cầu cũng có 100200 ms nóng lên──缓存 mô hình, và lần đầu tiên thực sự quay 前用 dummy run 预热──
- **Echo cancellation。**Không có AEC, TTS output 会 tái nhập trong mic,并触发 ASR 识别 bot 自己的声音──WebRTC AEC3 là mặc định nguồn mở──

## 动手构建

### 步骤 1: vòng đệm

```python
import collections

class RingBuffer:
    def __init__(self, capacity):
        self.buf = collections.deque(maxlen=capacity)
    def write(self, frame):
        self.buf.extend(frame)
    def read(self, n):
        return [self.buf.popleft() for _ in range(min(n, len(self.buf)))]
    def level(self):
        return len(self.buf)
```

Khả năng quyết định độ trễ đệm tối đa ⋅ 16 kHz ⋅ 32.000 mẫu = 2 s⋅

### 步骤 2: VAD cổng

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

生产环境中替换为 Silero VAD:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤 3: Streaming ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: xử lý gián đoạn

```python
class Dialog:
    def __init__(self):
        self.tts_task = None

    def on_user_speech(self, frame):
        if self.tts_task and not self.tts_task.done():
            self.tts_task.cancel()   # barge-in
        # then feed to streaming ASR

    def on_final_user_utterance(self, text):
        self.tts_task = asyncio.create_task(self.reply(text))

    async def reply(self, text):
        async for tts_chunk in llm_then_tts(text):
            speaker.write(tts_chunk)
```

Đây là một phần của các công nghệ truyền hình và truyền hình.


```figure
nyquist-aliasing
```

## Sử dụng nó

2026 技术:

| 层 | 选择 |
|-------|------|
| Transport | LiveKit (WebRTC) or Pion (Go) |
| VAD | Silero VAD 4.0 |
| Streaming ASR | Parakeet-CTC-0.6B or Whisper-Streaming |
| LLM first-token | Groq, Cerebras, vLLM-streaming |
| Streaming TTS | Kokoro or ElevenLabs Turbo v2.5 |
| Echo cancel | WebRTC AEC3 |
| End-to-end native | OpenAI Realtime API or Moshi |

## 常见陷

- **Buffering 500 ms to be safe。**Buffer là tầng trần độ của bạn.
- **Not pinning threads。**Phục hồi âm thanh trong cấp độ ưu tiên thấp hơn các chủ đề của UI 上 =  tải xuống xảy ra lỗi。
- **TTS chunks too small。**Các mảnh nhỏ hơn 200 ms sẽ cho phép các tác phẩm của Vocoder có thể nghe được. 320 ms là điểm ngọt ngào.
- **No jitter buffer。**Trực sự mạng lưới có sự căng thẳng; không có sự bình thường sẽ xuất hiện pops.
- **Single-shot error handling。**Các ống dẫn âm thanh phải có khả năng chống tai nạn. Một ngoại lệ là việc giết người.

## 交付 nó

保存为 `outputs/skill-realtime-designer.md` Thiết kế một đường ống âm thanh thời gian thực, và cho mỗi giai đoạn  đưa ra ngân sách trễ cụ thể.

## 练习

1. **Easy。**运行 `code/main.py`◊ Nó giống như bơm vòng + năng lượng VAD; vì một giả 10 giây dòng 印阶段延迟
2. **Medium。**Sử dụng `sounddevice`, xây dựng một đường qua vòng lặp, với khung 20 ms  xử lý micro của bạn, và in mỗi khung  Bác trạng thái VAD
3. **Hard。**Sử dụng `aiortc` cấu trúc một thử nghiệm phản ứng duplex đầy đủ:browser → WebRTC → Python → WebRTC → browser。 dùng 1 kHz xung  đo độ trễ kính-vàng kính。

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Ring buffer | circular queue | 用于 audio frames 的固定大小、lock-free（或 SPSC-locked）FIFO。 |
| VAD | Silence gate | 标记 speech 与 non-speech 的 model 或 heuristic。 |
| Streaming ASR | Real-time STT | 随着 audio 到达输出 partial text；bounded lookahead。 |
| Jitter buffer | Network smoother | 对乱序 packets 进行 queue reordering；典型值 60–80 ms。 |
| AEC | Echo cancellation | 减去 speaker-to-mic feedback path。 |
| Barge-in | User interrupt | 系统在 TTS 中途检测到用户说话；必须取消 playback。 |
| Full duplex | Simultaneous both ways | 用户和 bot 可以同时说话；Moshi 是 full duplex。 |

## 延伸阅读

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) Chunked gần dòng dòng thì thầm 
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) Full duplex 200 ms latency
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) sản xuất âm thanh đại lý dàn nhạc;;
- [Silero VAD repo](https://github.com/snakers4/silero-vad) Sub-1 ms VAD, Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) mã nguồn mở 下的回音取消──
