# पाठ-से-भाषण (टीटीएस)  से टैकोट्रोन तक F5 और कोकोरो

> ASR 将语音反转为文本;TTS 将文本反转为语音──2026 साल की तकनीक分为三部分:text → टोकन → मेल, मेल → तरंग स्वरूप── प्रत्येक भाग में एक आदर्श मॉडल है जो अपने कंप्यूटर पर चल रहा है।

**Type:** Build
**Languages:** Python
**先修要求:**चरण 6 · 02 (स्पेक्ट्रोग्राम और मेल), चरण 5 · 09 (सेक2सेक), चरण 7 · 05 (पूर्ण ट्रांसफार्मर)
**Time:** ~75 minutes

## 问题

आप एक字符串:"कृपया मुझे 6 बजे पौधों को पानी देने के लिए याद दिलाएं।" आप एक 3 सेकंड के ऑडियो वीडियो के लिए आवश्यक है, सुनें प्राकृतिक, है सही प्रोसोडी ((पॉस्टन、重音), सही मूल ध्वनि के साथ "प्लान्ट्स" भेजें, और CPU पर 300 एमएस में काम कर सकते हैं, वास्तविक समय में语音助手 को समर्थन देने के लिए।

现代 TTS पाइपलाइन इस तरह दिखता हैः

1. **Text frontend。**规范化文本(日期、数字、电子邮件),转换为 Phoneme 或子词 टोकन,预测 prosody 特征──
2. **声学模型。**पाठ → मेल स्पेक्ट्रोग्राम──टैकोट्रॉन 2 (2017), फास्ट स्पीच 2 (2020), वीआईटीएस (2021), एफ5-टीटीएस (2024), कोकोरो (2024)──
3. **Vocoder。**मेल → तरंगरूप──वेवनेट (2016), वेवआरएनएन, HiFi-GAN (2020), बिगवीजीएएन (2022), तथा 2024+ के न्यूरल कोडेक वॉकोडर──

2026 तक, अंत-अंत Diffusion और flow-matching मॉडल के उद्भव के साथ, ध्वनिक + vocoder का विभाजन अस्पष्ट हो गया है।

## 概念

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017)。**Seq2seq:char-embedding → BiLSTM encoder → स्थान-संवेदनशील ध्यान → autoregressive LSTM decoder 输出 mel frames──慢(AR),长文本上不稳定──仍被作为基线引用──

**FastSpeech 2 (2020)。**गैर-स्वतः-पुनर्निरागमन── अवधि पूर्वानुमान 输出每 Phoneme 获得多少 mel frames──1-pass,比塔科特龙 快 10×──损失一些自然度(मोनोटोनिक संरेखण),但到处都在用──

**VITS (2021)。**通过变化推理将编码器 + प्रवाह आधारित अवधि + HiFi-GAN vocoder 端到端联合训练──质量高,单模型──20222024年主导开源 TTS──变体:YourTTS(बहु स्पीकर शून्य-शॉट)、XTTS v2(2024,Coqui)──

**F5-TTS (2024)。**基于流相对应的扩散变压器──自然 prosody, 5 秒参考音频 उपयोग शून्य शॉट आवाज क्लोनिंग──2026 年开源 TTS 排行榜顶尖──335M पैराम्स──

**Kokoro (2024)。**小型(82M)、可在CPU上运行、实时使用场景下一流的英文 TTS──封闭词表、仅英文、apache-2.0──

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3。**商业 state of the art──ElevenLabs v2.5 के भावना टैग("[छोसे]", "[हँसते]") और चरित्र आवाजें 在 2026 年 主导 ऑडियोबुक उत्पादन──

### Vocoder 演进

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | 仅 offline | 发布时的 SOTA |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | 接近人类 |
| 2022 | BigVGAN | 50× realtime | 可泛化到不同 speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | 与 AR models 集成 | 离散 Token，比特效率高 |

2026 तक, अधिकांश "टीटीएस" मॉडल पाठ से तरंग के रूप के अंत-अंत मॉडल हैं; मेल स्पेक्ट्रम एक आंतरिक अभिव्यक्ति है।

### 评估

- **MOS (Mean Opinion Score)。**15 分制, भीड़-भाड़ से प्राप्त── अभी भी स्वर्ण मानक है; बहुत धीमा──
- **CMOS (Comparative MOS)。**A-vs-B 偏好── प्रत्येक टिप्पणी के विश्वास अंतराल 更紧──
- **UTMOS, DNSMOS。**无参考神经MOS पूर्वानुमानों──用于排行榜──
- **CER (Character Error Rate) via ASR。**TTS आउटपुट को Whisper, गणना और इनपुट पाठ के CER के रूप में समझदारी के प्रॉक्सी के रूप में उपयोग करना
- **SECS (Speaker Embedding Cosine Similarity)。**आवाज क्लोनिंग 质量──

LibriTTS परीक्षण-स्वच्छ 上的 2026 数字:

| Model | UTMOS | CER (via Whisper) | Size |
|-------|-------|-------------------|------|
| Ground truth | 4.08 | 1.2% | — |
| F5-TTS | 3.95 | 2.1% | 335M |
| XTTS v2 | 3.81 | 3.5% | 470M |
| VITS | 3.62 | 3.1% | 25M |
| Kokoro v0.19 | 3.87 | 1.8% | 82M |
| Parler-TTS Large | 3.76 | 2.8% | 2.3B |


```figure
sp-tts-stack
```

##  इसे निर्माण

### 步骤 1: इनपुट को ध्वन्यात्मक करें

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

फोनमे है जनरल ब्रिज梁. कच्चे पाठ को VITS स्तर की गुणवत्ता में डालने से बचें.

### 步骤 2:运行 Kokoro(2026 CPU 默认)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

离线运行,单文件,82M पैराम्स

### 步骤 3: आवाज क्लोनिंग का उपयोग करें 运行 F5-TTS

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

传入一个 5 秒参考片段及其转录;F5 会克隆试听和调音

### 步骤 4: शून्य से HiFi-GAN वॉकोडर को लागू करें

太大, ट्यूटोरियल स्क्रिप्ट में नहीं डाल सकते, लेकिन इस तरह के रूप मेंः

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

訓練:adversarial(short windows पर भेदभाव) + mel-spectrogram reconstruction Loss + feature-matching Loss──已商品化使用 `hifi-gan`रेपो या एनवीडीआई-नेमो के पूर्व प्रशिक्षित चेकपोस्टों में

### 步骤 5: पूरी पाइपलाइन (pseudocode)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## इसका उपयोग करें

2026 साल तकनीकी:

| Situation | Pick |
|-----------|------|
| 实时 English voice assistant | Kokoro (CPU) 或 XTTS v2 (GPU) |
| 从 5 s reference 进行 voice cloning | F5-TTS |
| 商业 character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 或 XTTS v2 + fine-tune |
| Low-resource language | 在 5–20 h target-lang data 上训练 VITS |
| Expressive / emotion tags | ElevenLabs v2.5 或 StyleTTS 2 fine-tune |

2026 तक के लिए ओपन सोर्स लीडरः**F5-TTS 代表质量，Kokoro 代表效率** जब तक आप इतिहासकार नहीं हैं, तब तक टैकोट्रॉन का चयन न करें

## 陷

- **没有 text normalizer。**"डॉ. स्मिथ" 读作 "डॉ. " या "ड्राइव" ?2026" 读作 "बीस बीस छह" या "दो शून्य दो छह"?
- **OOV proper nouns。**"गुमारे" → "ग्यू-मैर"?
- **Clipping。**Vocoder आउटपुट  बहुत कम क्लिपिंग, लेकिन निष्कर्ष 时 mel स्केलिंग असंगति हो सकता है ± 1.0`np.clip(wav, -1, 1)`
- **Sample-rate mismatch。**कोकोरो 输出 24 kHz; आपका डाउनस्ट्रीम पाइपलाइन 期望 16 kHz → पुनः नमूना, अन्यथा उपनाम दिखाई देगा。

## 交付 यह

保存为 `outputs/skill-tts-designer.md`◊ एक विशिष्ट आवाज, लटेंसी और भाषा लक्ष्य  एक टीटीएस पाइपलाइन डिजाइन करना

## अभ्यास

1. **Easy。**运行 `code/main.py` से खिलौना वक्सा 构建 Phoneme शब्दकोश, अनुमानित प्रत्येक Phoneme की अवधि,并印一假的"मेल" शेड्यूल
2. **Medium。**安装 Kokoro,分別使用语音 `af_bella`和 `am_adam`合成同一句话──比较音频持续时间 和主观质量──
3. **Hard。**录制一段你自己的5秒参考片段──使用F5-TTS क्लोन 它──报告引用和克隆输出 之间SECS──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Phoneme | 声音单位 | 抽象声音类别；English 中有 39 个（ARPABet）。 |
| Duration predictor | 每个 Phoneme 持续多久 | Non-AR model output；每个 Phoneme 的整数 frames。 |
| Vocoder | Mel → waveform | 将 mel-spec 映射到 raw samples 的 Neural net。 |
| HiFi-GAN | 标准 vocoder | 基于 GAN；主导 2020–2024。 |
| MOS | 主观质量 | 来自 human raters 的 1–5 mean opinion score。 |
| SECS | Voice-clone metric | target 和 output speaker Embedding 之间的 cosine similarity。 |
| F5-TTS | 2024 开源 SOTA | Flow-matching Diffusion；zero-shot cloning。 |
| Kokoro | CPU English leader | 82M-param model，Apache 2.0。 |

## 延伸阅读

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) सीक्व2सेक्व बेसलाइन。
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) 端到端 प्रवाह आधारित──
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 当前开源 SOTA。
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) 2026 वर्ष में अभी भी जारी किए जा रहे vocoder
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 सीपीयू-अनुकूल अंग्रेजी टीटीएस。
