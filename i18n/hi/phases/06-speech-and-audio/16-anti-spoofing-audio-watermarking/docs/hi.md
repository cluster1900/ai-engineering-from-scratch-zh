# 语音反欺骗与音频水印  ASVspoof 5, ऑडियोसील, वेववेरीफाई

> आवाज क्लोनिंग की ऑनलाइन गति रक्षा साधनों को तेजी से पार कर गई है। 2026 के उत्पादन स्तर की भाषा प्रणाली को दो चीजों की आवश्यकता होगीः एक जो वास्तविक भाषा और नकली भाषा के लिए परीक्षण करेगा।

**Type:** Build
**Languages:** Python
**先修要求：**चरण 6 · 06 (स्पीकर पहचान), चरण 6 · 08 (वॉइस क्लोनिंग)
**Time:** ~75 minutes

## 问题

तीन प्रकार के रक्षा

1. **Anti-spoofing / deepfake detection.**给定一段音频, यह सिंथेटिक है या वास्तविक?ASVspoof बेंचमार्क(ASVspoof 2019 → 2021 → 5)
2. **Audio watermarking.**में उत्पन्न音频中Embedding अदृश्य संकेत,检测器 के बाद इसे提取可──AudioSeal(Meta) और WavMark are open options──
3. **Authenticated provenance.**                                                                                                                                                                                                                                                              

पता लगाने 处理不配合的对抗者── वॉटरमार्किंग 处理合规性,AI 生成的音频应被识别为此类音频──2026年两者都必需──

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### ASVspoof 5  2024-2025 बेंचमार्क

तुलना में पहले संस्करण, अधिकतम परिवर्तनः

- **Crowdsourced data**(不是录音棚干净数据)  现实条件──
- **~2000 speakers**(之前约 ~100) 
- **32 个 attack algorithms.**टीटीएस + आवाज रूपांतरण + विरोधी विघटन
- **Two tracks.**प्रति उपाय (CM) 独立检测;面向生物识别系统的伪造- robust ASV (SASV) ⋅

ASVspoof 5 上 上的 state-of-the-art:~7.23% EER──较旧的 ASVspoof 2019 LA:0.42% EER──真实世界部署:预计野外片段上 EER 为 5-10%──

### AASIST 和 RawNet2  检测模型家族

**AASIST**(2021, निरंतर अद्यतन तक 2026) ⋅ में स्पेक्ट्रल सुविधाएँ 上使用图表注意──当前是 ASVspoof 5 काउंटरमेजर 任务的SOTA──

**RawNet2.** कच्चे तरंग स्वरूप के कन्व्ह्यूशनल फ्रंट-एंड + TDNN बैकबोन पर आधारित                                                                                                                                                                                                                                                 

**NeXt-TDNN + SSL features.**2025 变体:ECAPA-style + WavLM सुविधाएँ + फोकल हानि──在 ASVspoof 2019 LA ऊपर 0.42% EER को प्राप्त करना──

### AudioSeal  2024 साल默认 जलचिह्न

मेटा **AudioSeal**(२०२४ साल जनवरी, v0.2 साल 12 月) 👇

- **Localized.**以 16 kHz 采样分辨率 ((1/16000 s) प्रति 检测 जलचिह्न
- **Generator + detector jointly trained.**जनरेटर सीखना इम्बेडिंग अक्षम्य संकेत; डिटेक्टर सीखना बढ़ावों में पश्चात इसे खोजने
- **Robust.**能经受 MP3 / AAC 压缩、EQ、速度-परिवर्तन ±10%、噪音 मिश्रण +10 dB SNR。
- **Fast.**डिटेक्टर 以 485× वास्तविक समय 运行;比WavMark 快 1000×──
- **Capacity.**16-बिट उपयोगिता लोड ((可编码 मॉडल आईडी、 पीढ़ी समय टिकट、 उपयोगकर्ता आईडी) प्रत्येक कथन को एम्बेड करना

### वेवमार्क

AudioSeal 之前的开放基线──परिवर्तनीय तंत्रिका नेटवर्क,32 बिट्स/सेक.──问题:

- समक्रमण क्रूर बल 很慢──
- 可被高斯音或MP3 压缩移除──
- वास्तविक समय के लिए उपयुक्त नहीं है।

### WaveVerify(2025 साल 7 月)

解决 AudioSeal की कमजोरियों, विशेष रूप से समय के साथ हेरफेरों को ठीक करना (उपयोग करना)

### प्रतिरोधक उपयोग की कमी

AudioMarkBench सेः "पीच शिफ्ट के तहत, सभी वॉटरमार्क 0.6 से नीचे बिट रिकवरी सटीकता दिखाते हैं, जो लगभग पूर्ण हटाने का संकेत देता है। "**Pitch-shift 是通用攻击。**2026 साल में कोई भी वॉटरमार्क नहीं होगा जो गतिशील पिच संशोधन का पूरी तरह से प्रतिरोध कर सके।

### सी2पीए / सामग्री प्रामाणिकता पहल

यह एक स्पष्ट रूप से 形式  音频文件带带带关于创建工具、作者、日期的加密签名转载数据──Audobox / Seamless 使用它──适合来源; लेकिन यदि दुष्ट इच्छावादी पुनः编码并剥离转载数据, तो यह शक्तिहीन है──


```figure
v4-audio-watermark
```

##  इसे निर्माण

### 步骤 1: एक सरल स्पेक्ट्रल विशेषता डिटेक्टर(खेलौना)

```python
def spectral_rolloff(spec, percentile=0.85):
    cum = 0
    total = sum(spec)
    if total == 0:
        return 0
    threshold = total * percentile
    for k, v in enumerate(spec):
        cum += v
        if cum >= threshold:
            return k
    return len(spec) - 1

def is_suspicious(audio):
    spec = magnitude_spectrum(audio)
    rolloff = spectral_rolloff(spec)
    return rolloff / len(spec) > 0.92
```

सिंथेटिक भाषण में आमतौर पर असामान्य समतल की उच्च आवृत्ति ऊर्जा होती है।

### 步骤 2: ऑडियोसील एम्बेड + पता लगाने

```python
from audioseal import AudioSeal
import torch

generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark

result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
# result: float in [0, 1] — probability of watermark presence
# decoded_payload: 16 bits; match against embedded payload
```

### 步骤 3: मूल्यांकन  ईईआर

```python
def eer(real_scores, fake_scores):
    thresholds = sorted(set(real_scores + fake_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in fake_scores if s >= t) / len(fake_scores)
        frr = sum(1 for s in real_scores if s < t) / len(real_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

### 步骤 4: 生产集成

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

प्रत्येक उत्पादन में शामिल हैंः 1) वॉटरमार्क, 2) हस्ताक्षरित घोषणा पत्र, 3) प्रतिधारण नीति के लेखांकन लॉग के अनुरूप

## इसका उपयोग करें

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## 陷

- **Watermark 从未被 detector 运行检测。** कोई मतलब नहीं                                                                                                                                                                                                                                                             
- **Detection 没有 calibration。**अमरीका में एएसआईएसटी की संख्या घटने लगी है।
- **Pitch-shift gap.**激进的音速转移 会移除大多数水标――检测后退――
- **Metadata strip-and-rehost.**C2PA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
- **把 liveness 当成 detection。**要求用户说一个随机短语──它可以阻止重播攻击,但不能阻止实时克隆──

## 交付 यह

保存为 `outputs/skill-spoof-defender.md`◊ लिए आवाज-जन 部署 चयन पता लगाने मॉडल、वाटरमार्क、उत्पत्ति घोषणापत्र 和 परिचालन प्लेबुक。

## अभ्यास

1. **Easy.**运行 `code/main.py`在合成音频 上使用玩具探测器 +玩具水印嵌入/探测──
2. **Medium.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `audioseal`, में TTS 输出中16 बिट उपयोगिता लोड एम्बेडिंग, पुनः पुनः解码──用噪音破坏音频并测量 बिट रिकवरी सटीकता──
3. **Hard.**ASVspoof 2019 LA 上 फाइन-ट्यून 一个RawNet2或AASIST──测量EER──在一组持续的F5-TTS 生成片段上测试,观察 OOD पता लगाने 如何退化──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| ASVspoof | benchmark | 两年一次的 challenge；2024 = ASVspoof 5。 |
| CM (countermeasure) | Detector | Classifier：真实语音 vs synthetic / converted。 |
| SASV | Speaker verif + CM | 集成的 biometric + spoof detection。 |
| AudioSeal | Meta watermark | Localized，16-bit payload，比 WavMark 快 485×。 |
| Bit Recovery Accuracy | Watermark survival | 攻击后恢复的 payload bits 比例。 |
| C2PA | Provenance manifest | 关于创建 / 作者身份的加密 metadata。 |
| AASIST | Detector family | 基于 graph-attention 的 anti-spoofing SOTA。 |

## 延伸阅读

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 当前 बेंचमार्क。
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 默认 जलचिह्न──
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150)  面向时代攻击的MoE探测器──
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) SOTA का पता लगाने की रीढ़ की हड्डी──
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) मजबूती मूल्यांकन。
- [C2PA specification](https://c2pa.org/specifications/specifications/) प्रवासन प्रातिनिधिक 格式──
