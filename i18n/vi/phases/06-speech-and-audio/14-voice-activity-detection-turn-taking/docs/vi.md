# Khám phá hoạt động giọng nói và quay  Silero、Cobra 和 Flush Trick

> Thành công của mỗi đại lý giọng nói phụ thuộc vào hai phán quyết: người dùng hiện đang đang nói chuyện,以及他们是否说完了?VAD  trả lời câu hỏi thứ nhất- phát hiện lượt đi(VAD + âm thầm-bàn trùm + mô hình điểm cuối ngữ nghĩa) trả lời câu hỏi thứ hai。任一判断出错, trợ lý của bạn phải hoặc cắt đứt người dùng, hoặc phải hoặc luôn nói个不停。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

## 问题

Đại lý giọng nói trong mỗi 20 ms phần trên thực hiện ba phán quyết khác nhau:

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** phát hiện khởi phát
3. **用户是否说完了？** hướng cuối  hướng cuối 

朴素答案 (Energy threshold) 在任何噪音下都会失败:交通声,键盘声,人群杂声, 2026 年的答案是:Silero VAD (VAD) (开放,深度学习) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Tập học) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (Từ) (T

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### 三层 VAD 级联

**Tier 1: energy gate。** -40 dBFS đối với RMS 设值, có thể vượt qua âm thanh tĩnh rõ ràng, nhưng bất kỳ âm thanh nào vượt quá  giá trị đều sẽ bị kích hoạt

**Tier 2: Silero VAD**(2020-2026, MIT) ・ 1M tham số。 trên 6000+ ngôn ngữ 上练。 trên mỗi 30 ms phần CPU 约 1 ms 运行完成。5% FPR 下 TPR 为 87.7%。

**Tier 3: semantic turn detector。**Mô hình phát hiện lượt của LiveKit (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: LiveKit) (tiếng Anh: [từ tiếng Anh: [từ] (từ]) (từ) (từ) (từ))) (từ) (từ) (từ) (từ) (từ) (từ) (từ) (từ) (từ) (từ)))

### 关键参数 và giá trị默认

- **Threshold。**Silero 输出 xác suất; trong &gt; 0.5(默认) hoặc &gt; 0.3( nhạy cảm)时分类为语音──值越低,首词被截断越少,但错积极越多──
- **Minimum speech duration。**拒绝短于250 ms của bài phát biểu, thường là ho hoặc tiếng ồn ghế.
- **Silence hangover（end-pointing）。**VAD quay lại đến 0 之后, chờ 500-800 ms để tái công bố kết thúc lượt.
- **Pre-roll buffer。**Trong VAD 触发前保留 300-500 ms của âm thanh 防止 hey bị cắt

### Tránh nước nước (Kyutai 2025)

Các mô hình STT được phát trực tuyến có sự chậm trễ nhìn về phía trước (((Kyutai STT-1B dài 500 ms, STT-2.6B dài 2,5 s)  Thông thường bạn sẽ chờ đợi quá lâu để có được bản sao.**向 STT 发送 flush signal**, bắt buộc ngay lập tức xuất khẩu;;STT 以约 4x thời gian thực xử lý, vì vậy 500 ms buffer 约125 ms 就能完成;;

端到端:125 ms VAD + flush STT = đối thoại式 latency

### 2026 VAD đối với

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

Silero là một lựa chọn được chọn đúng đắn. Cobra là một hệ thống tăng trưởng về quy mô và tỷ lệ tăng trưởng.


```figure
sp-vad-cascade
```

##  xây dựng nó

### 步骤 1: cổng năng lượng

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### 步骤 2: Python 中的 Silero VAD

```python
from silero_vad import load_silero_vad, get_speech_timestamps

vad = load_silero_vad()
audio = torch.tensor(waveform_16k, dtype=torch.float32)
segments = get_speech_timestamps(
    audio, vad, sampling_rate=16000,
    threshold=0.5,
    min_speech_duration_ms=250,
    min_silence_duration_ms=500,
    speech_pad_ms=300,
)
for s in segments:
    print(f"{s['start']/16000:.2f}s - {s['end']/16000:.2f}s")
```

### 步骤 3: máy chế độ quay cuối

```python
class TurnDetector:
    def __init__(self, silence_hangover_ms=500, min_speech_ms=250):
        self.state = "idle"
        self.speech_ms = 0
        self.silence_ms = 0
        self.silence_hangover_ms = silence_hangover_ms
        self.min_speech_ms = min_speech_ms

    def update(self, is_speech, chunk_ms=20):
        if is_speech:
            self.speech_ms += chunk_ms
            self.silence_ms = 0
            if self.state == "idle" and self.speech_ms >= self.min_speech_ms:
                self.state = "speaking"
                return "START"
        else:
            self.silence_ms += chunk_ms
            if self.state == "speaking" and self.silence_ms >= self.silence_hangover_ms:
                self.state = "idle"
                self.speech_ms = 0
                return "END"
        return None
```

### 步骤 4: Trận thuật lội 骨架

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT(Kyutai、Deepgram、AssemblyAI) phải hỗ trợ flush, phương pháp này才有效──Whisper streaming không hỗ trợ, vì nó dựa trên khối, và luôn là chờ các mảnh──

## Sử dụng nó

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

经验法则: trừ khi bạn thực sự别无选择, nếu không bạn không bao giờ phát hành chỉ năng lượng VAD。

## 陷

- **Fixed threshold。**                                                                                                                                                                                                                                                              
- **Silence hangover 太短。**Agent 会在句中打断用户──500-800 ms là khu vực tốt nhất trong cuộc trò chuyện.
- **Hangover 太长。**感觉迟──用目标用户做 A/B test──
- **没有 pre-roll buffer。**Người dùng âm thanh của trước 200-300 ms 会丢失──始终保留滚 pre-roll──
- **忽略 semantic endpointing。**Hmm, để tôi nghĩ... 包含长停顿──用户讨厌思路中途被打断──使用LiveKit's turn-detector或类似方案──

##  phát hành nó

保存为 `outputs/skill-vad-tuner.md` Đối với một khối lượng công việc  chọn mô hình VAD, ngưỡng, chuyển động, trước khi quay và chiến lược phát hiện chuyển động 

## 练习

1. **Easy。**运行 `code/main.py`∼It模拟 nói + im lặng + nói + ho 序列,并测试三层 VAD──
2. **Medium。**                                          `silero-vad`, xử lý một đoạn 5 分钟录音,调优门, đồng thời giảm thiểu đầu từ cắt và lỗi触发.
3. **Hard。**构建一个小型转变检测器:Silero VAD + 基于最近10个字的嵌入的3层 MLP(使用句子变换器) ――在手工标注的转变数据集 上练――以10% F1 击败Silero-only。

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| VAD | Voice detector | 逐帧二元判断：这是 speech 吗？ |
| Turn detection | End-pointing | VAD + silence-hangover + semantic endpoint。 |
| Silence hangover | Wait-after-speech | 宣布 turn end 前等待的时间；500-800 ms。 |
| Pre-roll | Pre-speech buffer | 在 VAD 触发前保留 300-500 ms audio。 |
| Flush trick | Kyutai hack | VAD → flush-STT → 125 ms，而不是 500 ms delay。 |
| Semantic endpoint | “他们是真的想停下吗？” | 查看 words 的 ML classifier，而不只是看 silence。 |
| TPR @ FPR 5% | ROC point | 标准 VAD benchmark；Silero 为 87.7%，WebRTC 为 50%。 |

## 延伸阅读

- [Silero VAD](https://github.com/snakers4/silero-vad) 开放 VAD để thực hiện
- [Picovoice Cobra VAD](https://picovoice.ai/products/cobra/) 商业准确率领导者──
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) 低于200 ms 的工程技巧──
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) 生产环境中的语义终点化――
- [WebRTC VAD](https://webrtc.googlesource.com/src/) cơ sở di sản.
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) nhật ký 级 phân đoạn。
