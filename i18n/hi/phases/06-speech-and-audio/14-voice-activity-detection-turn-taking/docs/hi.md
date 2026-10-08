# आवाज गतिविधि का पता लगाने और टर्न-टेकिंग  सिलेरो、कोबरा और फ्लश ट्रिक

> प्रत्येक आवाज एजेंट की सफलता दो निर्णयों पर निर्भर करती हैः उपयोगकर्ता अभी बोल रहा है या नहीं, तथा वे क्या बोल चुके हैं?

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

## 问题

आवाज एजेंट प्रत्येक 20 एमएस टुकड़ा ऊपर तीन अलग-अलग निर्णय कियाः

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** आरंभ का पता लगाना──
3. **用户是否说完了？** अंत-निर्देशन टर्न-एंड

朴素答案 (ऊर्जा की सीमा) किसी भी शोर के तहत都会失败:交通声、键盘声、人群杂声。2026 साल का उत्तर है:Silero VAD(開放、Deep Learning 训练) + वक्र-भेषण मॉडल(सिमांतिक अंतनिर्देश) + VAD पर आधारित 校准 की चुप्पी हंगावर。

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### त्रिस्तरीय वार्ड

**Tier 1: energy gate。**RMS  मूल्य  के लिए  40 dBFS पर  स्पष्ट शोर  से अधिक हो सकता है, लेकिन  मूल्य से अधिक कोई भी शोर  से अधिक हो सकता है।

**Tier 2: Silero VAD**(2020-2026, एमआईटी) ∙1 एम पैरामीटर ∙ 6000+ भाषाओं में 上 प्रशिक्षण ∙∙ एक ही सीपीयू थ्रेड ∙ प्रत्येक 30 एमएस खंड ∙ 1 एमएस 运行完成 ∙5% FPR ∙ TPR 为 87.7% ∙

**Tier 3: semantic turn detector。**LiveKit का टर्न-डिटेक्शन मॉडल ((2024-2026) या आपका अपना छोटा वर्गीकरणकर्ता──区分句中停顿和说完了──使用语言上下文(intonation + हालिया शब्द),而不只是沉默──

### 关键参数 और उसके默认值

- **Threshold。**Silero 输出概率;在 &gt; 0.5(默认) या &gt; 0.3(敏感)时分类为语音──值越低,首词被截断越少,但错误积极越多──
- **Minimum speech duration。** 250 ms से कम की बात से इनकार करना, आमतौर पर यह खौफ या कुर्सी का शोर होता है
- **Silence hangover（end-pointing）。**VAD लौटकर 0  के बाद, 500-800 ms प्रतीक्षा करें फिर से टर्न-ऑफ-एंड घोषित करें── बहुत कम → 打断用户── बहुत लंबा → 感觉迟──
- **Pre-roll buffer。**VAD 触发前保留 300-500 ms का ऑडियो──防止被截断──

### फ्लश ट्रिक ((क्यूटाई 2025)

स्ट्रीमिंग STT मॉडल में आगे की ओर देखने में देरी होती है ((क्यूताई STT-1B 500 ms, STT-2.6B 2.5 s) ➡️ आमतौर पर आप अंत-ऑफ-स्पीच में प्रतीक्षा करेंगे ➡️**向 STT 发送 flush signal**, जबरन तत्काल आउटपुट──STT से लगभग 4× वास्तविक समय प्रक्रिया, इसलिए 500 ms बफर 约125 ms तक पूरा हो सकता है──

端到端:125 ms VAD + फ्लश STT = 对话式延迟──

### 2026 VAD के मुकाबले

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

सिलेरो सही है। कोबरा एक संयोजन है। 2026 में केवल ऊर्जा के साथ ही वीएडी उत्पादन वातावरण में कोई स्थान नहीं है।


```figure
sp-vad-cascade
```

##  इसे निर्माण

### 步骤 1: ऊर्जा गेट

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### 步骤 2: पायथन के बीच के Silero VAD

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

### 步骤 3: टर्न-एंड राज्य मशीन

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

### 步骤 4: फ्लश ट्रिक 骨架

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT(क्यूटाई、डीपग्राम、 असेंबलीएआई) को फ्लश का समर्थन करना चाहिए, यह विधि才有效── व्हिस्पर स्ट्रीमिंग समर्थित नहीं है, क्योंकि यह ब्लॉक पर आधारित है, और हमेशा टुकड़ों का इंतजार कर रहा है──

## इसका उपयोग करें

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

 अनुभव नियम: जब तक आप वास्तव में कोई विकल्प नहीं रखते, तब तक हमेशा केवल ऊर्जा-केवल VAD जारी न करें।

## 陷

- **Fixed threshold。**शांत वातावरण में उपलब्ध,杂环境 में विफल.
- **Silence hangover 太短。**एजेंट 会在句中打断用户──500-800 ms बातचीत में सबसे अच्छा क्षेत्र है──
- **Hangover 太长。**感觉迟──用目标用户做A/B test──
- **没有 pre-roll buffer。**उपयोगकर्ता ऑडियो का पिछला 200-300 ms 会失失──始终保留滚动前滚---
- **忽略 semantic endpointing。**Hmm, मुझे सोचने दो... 包含长停顿──用户讨厌思路中途被打断──使用LiveKit के टर्न-डिटेक्टर अथवा इसी तरह के कार्यक्रम──

##  इसे जारी करें

保存为 `outputs/skill-vad-tuner.md` एक कार्यभार के लिए VAD मॉडल, सीमा, हांगोवर, प्री-रोल और वक्र-डिटेक्शन रणनीति चुनें

## अभ्यास

1. **Easy。**运行 `code/main.py`∼ यह बोलने + चुप रहने + बोलने + खांसी 序列,并测试三层 VAD──
2. **Medium。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `silero-vad`,处理一段 5 分钟录音,调优门,同时最小化首词截断和误触发――报告精度/回忆──
3. **Hard。**构建一个小型转变检测器:Silero VAD + 基于最近的10个字的嵌入式的3层 MLP(使用句子转变器) ⋅在手工标注的转变数据集 上练──以10% F1 击败Silero-only──

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

- [Silero VAD](https://github.com/snakers4/silero-vad) 开放 VAD के संदर्भ में प्राप्ति हेतु
- [Picovoice Cobra VAD](https://picovoice.ai/products/cobra/) 商业准确率 नेता
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt)  200 ms से कम की इंजीनियरिंग तकनीक
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) 生产环境中的 सेमेटिक एंडपॉइंटिंग
- [WebRTC VAD](https://webrtc.googlesource.com/src/) विरासत आधार रेखा
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) दैनिककरण 级 विभाजन──
