# 声活动检测和转变  Silero、Cobra 和 Flush 技巧

> 每个语音代理的成功都取决于两个判断:用户现在是否在说话,以及他们是否说完了?VAD 回答第一个问题――转检测(VAD +沉默挂机 +语义终点模型)回答第二个问题――任一判断出错,你的助理要么断断用户,要么一直说个不停――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

## 问题

语音代理在每一个20ms部分上做出三个不同的判断:

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** 开始检测――
3. **用户是否说完了？**终点指向转终点

朴素答案 (简单答案) 任何噪音都会失败:交通声,键盘声,人群杂声.

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### 三层VAD级联

**Tier 1: energy gate。**最便宜的:以 -40 dBFS对RMS设定值.

**Tier 2: Silero VAD**在 6000+ 种语言上升训练. 在单个CPU线程上,每 30 ms 块运行完成.

**Tier 3: semantic turn detector。**语中停顿和说完了──使用语言上下文语 + 最近的词语),而不仅仅是沉默──

### 关键参数及其默认值

- **Threshold。**字符输出概率;在 &gt; 0.5(默认) 或 &gt; 0.3(敏感) 时分类为语音──值越低,首词被截断越少,但错误积极 越多──
- **Minimum speech duration。**拒绝短于250ms的演讲,通常是咳或椅子噪音.
- **Silence hangover（end-pointing）。**之后,等待500-800ms再宣布转换结束――太短 → 打断用户――太长 → 感觉迟――
- **Pre-roll buffer。**在VAD 触发前保留300-500ms的音频.

### 水技巧 (台2025年)

流媒体STT模型有前进延迟 ((Kyutai STT-1B 为500ms,STT-2.6B 为2.5s) ⋅通常你会在演讲结束后等那么久才能得到转录──**向 STT 发送 flush signal**强制即时输出.STT 以4x实时处理,所以500ms缓冲器约125ms就能完成.

端到端:125 ms VAD + 冲动STT = 对话式延迟――

### 2026 年的VAD

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

科布拉是合规性/准确率升级的.


```figure
sp-vad-cascade
```

## 构建它

### 步骤1:能源门

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

### 步骤3:转端状态机

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

### 步骤 4: 鱼技巧 骨架

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

声流不支持,因为它基于区块,并且总是等待块子.

## 使用它

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

经验法则:除非你真的别无选择,否则永远不要发布只有能源的VAD──

## 陷

- **Fixed threshold。**静态环境中可用,杂环境中失败.
- **Silence hangover 太短。**代理会在句中打断用户──500-800 ms 是对话语音的最佳区间──
- **Hangover 太长。**感觉迟──用目标用户做A/B测试──
- **没有 pre-roll buffer。**用户音频的前200-300ms 会丢失──始终保留滚动前滚动──
- **忽略 semantic endpointing。**Hmm,让我想... 包含长停顿.

## 发布它

保存为`outputs/skill-vad-tuner.md`为了一个工作负载选择VAD模型,门,转,前滚和转转检测策略.

## 练习

1. **Easy。**运行`code/main.py`〔它模拟语音,沉默,语音,咳〕
2. **Medium。**装备`silero-vad`处理一段 5 分钟录音,调优门,同时最小化首词截断和误触发――报告精度/召回――
3. **Hard。**构建一个小型转换探测器:Silero VAD + 基于最近10个字的嵌入式的3层MLP(使用句子转换器) ――在手工标注的转换数据集 上练――以10% F1 击败Silero-only。

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

- [Silero VAD](https://github.com/snakers4/silero-vad) 开放 VAD 的参考实现.
- [Picovoice Cobra VAD](https://picovoice.ai/products/cobra/) 商业准确率领导者
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) 低于200ms的工程技巧.
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) 生产环境中的语义终点表示――
- [WebRTC VAD](https://webrtc.googlesource.com/src/)遗产基线――
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio)日记化 级分类化
