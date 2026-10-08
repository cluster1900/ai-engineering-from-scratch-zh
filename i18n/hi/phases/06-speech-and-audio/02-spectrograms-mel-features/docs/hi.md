# स्पेक्ट्रोग्राम, मेल स्केल तथा ध्वनि विशेषताएं

> न्यूरल नेटवर्क सीधे खपत कच्चे तरंग स्वरूपों के लिए उपयुक्त नहीं है। वे स्पेक्ट्रोग्राम का उपभोग करते हैं। वे स्पेक्ट्रोग्राम के प्रभाव को बेहतर बनाते हैं। 2026 के प्रत्येक ASR、TTS और ऑडियो वर्गीकरणकर्ता का परिणाम इस एकल पूर्व-प्रक्रिया पर निर्भर करता है।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

## 问题

एक 10 सेकंड 16 kHz क्लिप लो. यह 160,000 फ्लोट है, सभी स्थित है.`[-1, 1]`, और लगभग "कुत्ता लात" या "शब्द बिल्ली" लेबल के साथ 完全不相关── कच्चे तरंग स्वरूप 信息包含, लेकिन प्रारूप पर मॉडल 很难轻松提取── दो समान ध्वनियों को यहां तक कि केवल 100 ms के अंतर में भी, कच्चे नमूना भी पूरी तरह से अलग होगा──

स्पेक्ट्रोग्राम  इस समस्या को हल करता है। यह मानव संवेदनाओं को अनदेखा करने के समय के विवरणों को संपीड़ित करता है, और संवेदनाओं की संरचना को बरकरार रखता है।

मेल स्पेक्ट्रोग्राम  आगे आगे बढ़ना ∙ मानव के लिए संख्यात्मक तरीके से संज्ञान पिच:100 हर्ट्ज बनाम 200 हर्ट्ज  1000 हर्ट्ज बनाम 2000 हर्ट्ज के साथ ध्वनि  समान दूरी   मेल पैमाने  झुकाव आवृत्ति अक्ष  मेल पैमाने पर स्पेक्ट्रोग्राम  यह मेल करने के लिए उपयुक्त है  मेल पैमाने पर स्पेक्ट्रोग्राम 2010 से 2026 तक के लिए ML भाषण में सबसे महत्वपूर्ण एकल विशेषता 

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).** 切成重叠框架 典型设置:25 ms विंडो,10 ms hop = 16 kHz 下400 नमूने / 160 नमूने)   प्रत्येक फ्रेम 乘以一个窗口函数                                                                                                                                                                                                                                       `(n_frames, n_freq_bins)`यह आपका स्पेक्ट्रोग्राम है।

**Log-magnitude.**कच्चे परिमाण 跨越 5-6 个数量级──使用 `log(|X| + 1e-6)`या `20 * log10(|X|)` संपीड़न गतिशील सीमा प्रत्येक उत्पादन पाइपलाइन में कच्चे पैमाने के बजाय लॉग-मग्निटुडे का उपयोग किया जाता है

**Mel scale.**Hz मध्य आवृत्ति `f`   के माध्यम से `m = 2595 * log10(1 + f / 700)`映射到 mel `m`◊ यह 1 kHz पर प्रदर्शित होता है निम्नानुसार लगभग रैखिक होता है, 1 kHz पर अधिकतर लगभग संख्यात्मक होता है ◊ 08 kHz के 80 मेलबिन मानक एएसआर इनपुट होते हैं ◊

**Mel filterbank.**एक समूह मेल पैमाने पर ऊपर के बीच दूरी में क्रमबद्ध त्रिकोणात्मक फिल्टरों── प्रत्येक फिल्टर आसन्न एफएफटी कंटेनरों का भारित योग── STFT परिमाण को फ़िल्टरबैंक मैट्रिक्स से गुणा किया जाएगा, जिससे एक बार मैटमुल  मिल सकता है मेल स्पेक्ट्रोग्राम──

**Log-mel spectrogram.** `log(mel_spec + 1e-10)` व्हिस्पर का इनपुट── पैराकेट का इनपुट── सीमलेस एम4टी का इनपुट── 2026 साल के आम इस्तेमाल के ऑडियो फ्रंटेंड──

**MFCCs.**取 लॉग-मेल स्पेक्ट्रोग्राम, अप्प्लाई DCT(प्रकार II), पहले 13 个 गुणांक को बरकरार रखा गया है। यह संबंधित सुविधाओं को आगे बढ़ाएगा और संपीड़ित करेगा।

**Resolution trade.**अधिक बड़ा एफएफटी = बेहतर आवृत्ति संकल्प, लेकिन अधिक खराब समय संकल्प──25 ms / 10 ms है ऑडियो-एमएल 默认值;音乐使用50 ms / 12.5 ms; पारगमन पता लगाने(ड्रम हिट, प्लॉसिव) 5 ms / 2 ms का उपयोग──


```figure
spectrogram-window
```

##  इसे निर्माण

### 步骤 1: 波形分

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

एक 10 सेकंड 16 kHz क्लिप, में `frame_len=400, hop=160`时会产生 998 个 个框架──

### 步骤 2: हान विंडो

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

FFT से पहले तत्वों में से प्रत्येक को गुणा किया जाता है। यह गैर-零端 बिंदु कटौती से उत्पन्न स्पेक्ट्रल लीक को हटा देता है।

### 步骤 3: STFT परिमाण

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

उत्पादन उपयोग `torch.stft`या `librosa.stft`(एफएफटी समर्थित  वेक्टरized)  इस लूप में शिक्षण के लिए उपयोग किया जाता है; यह होगा `code/main.py`मध्य का लघु क्लिप 上运行──

### 步骤 4: मेल फिल्टरबैंक

```python
def hz_to_mel(f):
    return 2595.0 * math.log10(1.0 + f / 700.0)

def mel_to_hz(m):
    return 700.0 * (10 ** (m / 2595.0) - 1)

def mel_filterbank(n_mels, n_fft, sr, fmin=0, fmax=None):
    fmax = fmax or sr / 2
    mels = [hz_to_mel(fmin) + (hz_to_mel(fmax) - hz_to_mel(fmin)) * i / (n_mels + 1)
            for i in range(n_mels + 2)]
    hzs = [mel_to_hz(m) for m in mels]
    bins = [int(h * n_fft / sr) for h in hzs]
    fb = [[0.0] * (n_fft // 2 + 1) for _ in range(n_mels)]
    for m in range(n_mels):
        for k in range(bins[m], bins[m + 1]):
            fb[m][k] = (k - bins[m]) / max(1, bins[m + 1] - bins[m])
        for k in range(bins[m + 1], bins[m + 2]):
            fb[m][k] = (bins[m + 2] - k) / max(1, bins[m + 2] - bins[m + 1])
    return fb
```

`n_fft=400`时, 08 kHz के 80 मील कवर एक मिल जाएगा `(80, 201)`मैट्रिक्स `(n_frames, 201)`STFT की परिमाण  गुणा करने के लिए इसके पार करने, यह प्राप्त किया जा सकता `(n_frames, 80)`मेल स्पेक्ट्रोग्राम के

### 步骤 5: लॉग-मेल

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(संदर्भ-सामान्य डीबी)`10 * log10(power + eps)`✿ विस्मय 使用更复杂的剪辑 + सामान्यीकरण 例例(参见 विस्मय 的 ✿`log_mel_spectrogram`)。

### 步骤 6: एमएफसीसी

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

प्रत्येक लॉग-मेल फ्रेम पर DCT लागू करें, पहले 13 गुणांक को बनाए रखें।

## इसका उपयोग करें

2026 साल स्टैक:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。** किसी भी पक्ष से                                                                                                                                                                                                                                                            

## 2026 में उत्पादन की गति में प्रवेश करना जारी रहेगा

- **Mel count mismatch.**प्रयोग 80 मील्स  प्रशिक्षण, उपयोग 128 मील्स निष्कर्ष 静默失败──在两端都记录特征形──
- **Sample-rate mismatch upstream.**में 22.05 kHz  गणना की गई मेल्स 16 kHz से भिन्न है ⋅
- **dB vs log.**विस्पर 期望 लॉग-मेल, बजाय dB-मेल. कुछ एचएफ पाइपलाइनों स्वतः पता लगाना होगा; अपने कस्टम कोड नहीं होगा.
- **Normalization drift.** प्रशिक्षण समय उपयोग प्रति-उत्पादन सामान्यीकरण, इन्फरेंस  समय उपयोग वैश्विक सामान्यीकरण── यह WER 翻倍 उत्पादन बग──
- **Leakage from padding.**क्लिप के अंत में शून्य-पैडिंग की प्रक्रिया के लिए, पछाड़ फ्रेम में एक सपाट स्पेक्ट्रम उत्पन्न होता है।

## 交付 यह

保存为 `outputs/skill-feature-extractor.md`◊ इस कौशल को एक विशिष्ट मॉडल लक्ष्य के लिए                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

## अभ्यास

1. **Easy.**运行 `code/main.py` यह एक चिपके हुए में मिला है  आवृत्ति से 200 → 4000 हर्ट्ज़ 扫过),并印每框的 argmax mel bin──绘图可选)并确认它与扫匹配──
2. **Medium.**उपयोग `{40, 80, 128}`मध्य `n_mels`和 `{200, 400, 800}`मध्य `frame_len`重新运行── समय अक्ष मापने ऊपर तेज-पीक बैंडविड्थ── किस प्रकार के संयोजन को सबसे अच्छी तरह से चिपड़ा हल किया गया है?
3. **Hard.**实现 `power_to_db`,并比较 AudioMNIST 上微小CNN वर्गीकरण 使用以下输入时的ASR सटीकताः(क) कच्चे लॉग-मेल,(ब) 带 `ref=max`                                                                                                                                                                                                                                                              

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Frame | 一个 slice | 输入给一次 FFT 的 25 ms waveform chunk。 |
| Hop | Stride | 相邻 frames 之间的 samples；10 ms 是 ASR 默认值。 |
| Window | Hann/Hamming 那类东西 | 逐点 multiplier，将 frame 边缘渐变到零。 |
| STFT | Spectrogram generator | Framed + windowed FFT；产生 time × frequency Matrix。 |
| Mel | Warped frequency | 对数感知 scale；`m = 2595·log10(1 + f/700)`。 |
| Filterbank | 那个 Matrix | 将 STFT 投影到 mel bins 的 triangular filters。 |
| Log-mel | Whisper 的 input | `log(mel_spec + eps)`；在 2026 年已标准化。 |
| MFCC | Old-school feature | log-mel 的 DCT；13 个 coeffs，去相关。 |

## 延伸阅读
- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) एमएफसीसी 论文──
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) 原始 mel स्केल──
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读 संदर्भ कार्यान्वयन──
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html) `mfcc``melspectrogram`和 hop/window का संदर्भ
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) पैराकेट + कैनरी मॉडल के उत्पादन पैमाने पाइपलाइन के लिए उपयोग किया गया है
