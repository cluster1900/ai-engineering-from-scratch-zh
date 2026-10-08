# 音频基础  波形、采样、Fourier Transform

> तरंगरूप कच्चे संकेत हैं। स्पेक्ट्रोग्राम स्वरूपों का प्रतिनिधित्व करते हैं। मेल सुविधाएं एमएल के रूपों के अनुरूप हैं। प्रत्येक आधुनिक एएसआर और टीटीएस पाइपलाइन इस स्तर की सीढ़ियों से गुजरती है, जबकि पहला चरण नमूनाकरण और फ़ूरियर को समझना है।

**类型：**学习
**语言：**पायथन
**前置要求：**चरण 1 · 06 (वेक्टर और मैट्रिक्स), चरण 1 · 14 (概率分布)
**时间：**~ 45 मिनट

## 问题

麦克风会产生一个压力对时间信号――你的神经网络 消耗紧张器――它们之间有一套约定,一旦违反,就会产生无声的 bug:模型 训练看起来正常但 WER 翻倍,或 TTS 发布后带有声,或语音克隆系统 记得麦克风而不是说话人――

भाषण प्रणालियों में प्रत्येक बग तीन समस्याओं में से एक पर वापस आ जाता हैः

1. आंकड़े किस नमूना दर पर रिकॉर्ड किए गए हैं, मॉडल क्या उम्मीद करते हैं?
2. संकेत है या नहीं alias?
3. आप कच्चे नमूने ऊपर ऑपरेशन में हैं, या फिर आवृत्ति प्रतिनिधित्व ऊपर ऑपरेशन में हैं?

इन सब को करने के लिए, चरण 6 के शेष भाग को करने के लिए है।

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`中一维浮动阵列──样本数索引──要转换为秒,除以样本率:`t = n / sr`❖ एक 16 kHz ∙ 10 सेकंड का क्लिप एक है जिसमें 160,000  फ्लोट की सरणी है ❖

**Sampling rate (sr)。**प्रति सेकंड कितने नमूने---2026 साल का सामान्य दरः

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `sr/2`की आवृत्तियों`sr/2`边界是 *Nyquist आवृत्ति*──高于 Nyquist के ऊर्जा会被 *aliased*,也就是折叠到更低的频率中,并污染信号──下样式 前始终需要低通过过器──

**Bit depth。**16-बिट पीसीएम ((सीजीआई), रेंज ±32,767) है।`soundfile`इस तरह के एक संग्रह होगा int16 पढ़ने, लेकिन उजागर `[-1, 1]`मध्य में फ्लोट32 सरणीएँ

**Fourier Transform。**任意有限信号 都是不同频率的阴影之和──विशिष्ट फ़ौरियर परिवर्तन (DFT) के लिए `N`个 नमूने 计算 `N`个 जटिल गुणांक,也就是每频段一个.`bin k`映射到频率 `k · sr / N`Hz──मग्निटुडे = इस आवृत्ति की ऊपरी परिमाण, कोण = चरण

**FFT。**फास्ट फ़ूरियर ट्रांसफ़ॉर्म:当 `N`时, DFT के लिए प्रयोग किया जाता है`O(N log N)`एल्गोरिथ्म── प्रत्येक ऑडियो लाइब्रेरी 底层都使用FFT──16 kHz 下 1024-सैम्पल FFT 会给出512 个可用频段,覆盖08 kHz, संकल्प为15.6 Hz──

**Framing + window。**हम पूरे क्लिप को FFT नहीं करेंगे. हम इसे ओवरलैप *फ्रेमों* में काट देंगे. आम तौर पर 25 ms, 10 ms को छोड़ दें. हम प्रत्येक फ्रेम को खिड़की फ़ंक्शन पर गुणा करेंगे. हम हर फ्रेम को FFT बनाते हैं.


```figure
mel-scale
```

##  इसे निर्माण

### 步骤 1: पढ़ने क्लिप और तरंगों के रूप को चित्रित

`code/main.py`केवल प्रयोग करें`wave`मॉड्यूल, बनाए रखने के लिए डेमो 无依赖――生产环境中你会使用 `soundfile`या `torchaudio.load`(दो者都返回 `(waveform, sr)`टूपल्स):

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### 步骤 2: प्रथम प्रकृति से संश्लेषण संश्लेषण संश्लेषण

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

16 kHz नीचे 1 सेकंड के 440 Hz sine ((कंसर्ट A) 16,000 个 floats──16 बिट पीसीएम एन्कोडिंग का उपयोग करके, `wave.open(..., "wb")`写入──

### 步骤 3: हाथ से लिखना गणना DFT

```python
def dft(x):
    N = len(x)
    out = []
    for k in range(N):
        re = sum(x[n] * math.cos(-2 * math.pi * k * n / N) for n in range(N))
        im = sum(x[n] * math.sin(-2 * math.pi * k * n / N) for n in range(N))
        out.append((re, im))
    return out
```

`O(N²)` पर `N=256`सही होने की पुष्टि करने के लिए कोई समस्या नहीं है, लेकिन वास्तविक ऑडियो के लिए कोई उपयोग नहीं है।`numpy.fft.rfft`या `torch.fft.rfft`

### 步骤 4: प्रमुख आवृत्ति का पता लगाएं

परिमाण शिखर सूचकांक `k_star`映射到频率 `k_star * sr / N` 440 हर्ट्ज़ के समय                                                                                                                                                                                                                                                           `440 * N / sr`का शिखर

### 步骤 5: प्रदर्शन उपनाम

以 10 kHz 采样 7 kHz sine                                                                                                                                                                                                                                                          `10 − 7 = 3 kHz`FFT पीक 会出现在3kHz── यह क्लासिक उपनाम डेमो है, यह भी प्रत्येक DAC/ADC शहर में ईंट-दीवार कम पास फ़िल्टर के कारण है──

## इसका उपयोग करें

2026 साल के आप वास्तविक बैठक के वितरण के ढेरः

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

决策规则:**先匹配 sample rate，再匹配其他任何东西** चुप्पी  16 kHz मोनो फ्लोट32                                                                                                                                                                                                                                                       

## 交付 यह

保存为 `outputs/skill-audio-loader.md` यह कौशल आपको ऑडियो इनपुट की जांच करने में मदद करेगा कि क्या यह निम्न मॉडल की अपेक्षाओं के अनुरूप है, और यदि यह सही नहीं है तो सही रीसैम्पलिंग

## अभ्यास

1. **简单。**16 kHz में नीचे संश्लेषण 1 सेकंड में 220 Hz + 440 Hz + 880 Hz 混合音──运行 DFT── पुष्टि पूर्वानुमान कंटेनरों में 处有三峰──
2. **中等。**录制一段 48 kHz、3 सेकंड का अपना स्वयं का WAV 语音──使用 `torchaudio.transforms.Resample`(带反结) 16 kHz तक नीचे नमूना, फिर साफ़ दशमलव का उपयोग करें(每三样本 取一个) 16 kHz तक नीचे नमूना――对两者做FFT──结 出现在哪里?
3. **困难。**केवल उपयोग करें`math`和 चरण 3 का डीएफटी, शून्य से निर्माण STFT── फ्रेम आकार 400,hop 160,हैन विंडो──`matplotlib.pyplot.imshow`् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ् ्

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sample rate | 每秒多少个 samples | ADC 测量 signal 的 frequency，单位为 Hz。 |
| Nyquist | 你可以表示的最大 frequency | `sr/2`；高于它的能量会 alias 回低频。 |
| Bit depth | 每个 sample 的 resolution | `int16` = 65,536 levels；`float32` = `[-1, 1]` 中的 24-bit precision。 |
| DFT | sequences 的 Fourier Transform | `N` samples → `N` 个 complex frequency coefficients。 |
| FFT | 快速 DFT | `O(N log N)` algorithm，要求 `N` = 2 的幂。 |
| Bin | Frequency column | `k · sr / N` Hz；resolution = `sr / N`。 |
| STFT | Spectrogram 的底层机制 | 随时间进行 framed + windowed FFT。 |
| Aliasing | 奇怪的 frequency 幽影 | 高于 Nyquist 的能量镜像到更低 bins。 |

## 延伸阅读

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) नमूना प्रमेय 背后的论文──
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费、 क्लासिक DSP 教科書──
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用步行──
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) यह समझने के लिए कि वास्तविक विश्व ऑडियो का उपयोग क्यों किया जाता है, यह शुद्ध सिनोसाइड के संदर्भ में नहीं है।
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) 10 मिनट के साथ शुद्ध आवृत्ति बिन 直觉──
