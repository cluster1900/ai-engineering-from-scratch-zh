# Ses Aktivitesini tespit etmek ve dönüş yapma  Silero、Cobra 和 Flush Trick

> Her ses ajansının başarısı iki yargılama üzerine kurulu: user is currently in talking,以及 they are saying completed?VAD  answer the first question──turn-detection──VAD + silence-hangover + semantic endpoint model── answer the second question──任一判断出错, your assistant 要么断断用户,要么一直说个不停──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

## 问题

Sesli ajanın her 20 ms parçasında üç farklı yargılama yapması:

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** Başlangıç algısı。
3. **用户是否说完了？** son gösterim  dönüş)

朴素答案 (enerji eşiği) 任何噪音下都会失败:交通声、键盘声、人群杂声。2026 yılının cevabı: Silero VAD(開放、Deep Learning 训练) + dönüş algılama modeli(semantik son gösterme) + VAD 校准的沉默乱──

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### Üç katlı VAD 级联

**Tier 1: energy gate。**En uygun olan: -40 dBFS RMS  değerini belirgin bir sesden geçebilir, ancak  değerinden fazla bir ses tetiklenebilir.

**Tier 2: Silero VAD**(2020-2026, MIT) ・1M parametreleri。 6000+ dilde 上訓練。 On a single CPU thread 上, per 30 ms piece 运行完成。5% FPR 下 TPR 为 87.7%。

**Tier 3: semantic turn detector。**LiveKit'in dönüş algılama modeli ((2024-2026) veya kendi küçük sınıflandırıcınız。区分句中停顿和说完了──使用语言上下文(intonation + recent words),而不只是沉默──

### 关键参数 ve onun özelleştirilmiş değeri

- **Threshold。**Silero 输出 olasılığı;在 &gt; 0.5(默认) veya &gt; 0.3(敏感)时分类为语句──值越低,首词被截断越少,但虚假积极越多──
- **Minimum speech duration。**250 ms'den kısa konuşmayı reddetmek, genellikle öksürük veya sandalye gürültüsüdür.
- **Silence hangover（end-pointing）。**VAD geri dönüp 0'ya kadar, 500-800 ms bekleyin.
- **Pre-roll buffer。**VAD'de 300-500 ms ses saklayın.

### Flush numarası ((Kyutai 2025)

STT modellerinin akışı ileriye bakma gecikmesi vardır.**向 STT 发送 flush signal**, zorunlu anında çıkış, STT yaklaşık 4× gerçek zamanlı işlem, bu yüzden 500 ms tampon yaklaşık 125 ms tamamlanabilir.

端到端:125 ms VAD + flush STT = 对话式延迟──

### 2026 VAD karşılığı

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

Silero doğru bir seçeneği seçmektedir. Cobra, 2026 yılında üretim ortamında yer almıyor.


```figure
sp-vad-cascade
```

## Yapın onu.

### 步骤 1: enerji kapısı

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

### 步骤 3: dönüşümlü devlet makinesi

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

### 4 adım: Kırmızı numara 骨架

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT(Kyutai、Deepgram、AssemblyAI) Flush'i desteklemek zorundadır, bu yöntem sadece geçerlidir。Susper streaming desteklenmiyor, çünkü blok tabanlı ve her zaman parçaları bekliyor。

## Kullan

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

経験法: Eğer gerçekten başka seçeneğin yoksa, asla enerjiyle ilgili bir VAD yayınlama.

## 陷

- **Fixed threshold。**Sakin ortamda kullanılabilir, 杂 ortamda başarısızlık.
- **Silence hangover 太短。**Agent 会在句中打断用户──500-800 ms is the best zone of dialog语音──
- **Hangover 太长。**感觉迟──用目标用户做A/B test──
- **没有 pre-roll buffer。**Kullanıcı sesinin ön 200-300 ms 会失──始终保留滚滚 pre-roll──
- **忽略 semantic endpointing。**Hmm, düşünmeme izin verin... 包含长停顿──用户讨厌思路中途被打断──使用LiveKit'in dönüş detektörü或类似方案──

## Yayınla

保存为 `outputs/skill-vad-tuner.md`◊ Bir iş yükü için VAD modeli, eşiği, döngü, ön döngü ve dönüş algılama stratejisini seçmek

## 练习

1. **Easy。**运行  İşlem`code/main.py`∼ It模拟 konuşma + sessizlik + konuşma + öksürük 序列,并测试三层 VAD──
2. **Medium。**- Yapımcılık`silero-vad`,处理一段 5 分钟录音,调优门,同时最小化首词截断和误触发──报告精度/回忆──
3. **Hard。**构建一个小型转变探测器:Silero VAD + 基于最近10个字的嵌入式的3层 MLP(使用句子变换器) ――在手工标注的转变数据集 上练──以10% F1 击败Silero-only──

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

- [Silero VAD](https://github.com/snakers4/silero-vad) 开放 VAD'ın referansı gerçekleşmek için.
- [Picovoice Cobra VAD](https://picovoice.ai/products/cobra/) 商业准确率领导者──
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) 低于200 ms 的工程技巧──
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) 生产环境中的 semantik son gösterimleri
- [WebRTC VAD](https://webrtc.googlesource.com/src/) miraslı temel çizgi
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) günlükleşme 级 bölünme。
