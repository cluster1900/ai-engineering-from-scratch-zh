# न्यूरल ऑडियो कोडक्स  एनकोडेक, एसएनएसी, मिमी, डीएसी 和 सेमेन्टिक-अकाउस्टिक स्प्लिट

> 2026 के साल के ध्वनिका उत्पादन लगभग सभी टोकन हैं। EnCodec、SNAC、Mimi 和 DAC 会将连续波形转换为变体 可以预测的离散序列──语义-विरोध- ध्वनिका टोकन 拆分, यानी पहला कोडबुक 作为语义, शेष作为 ध्वनिका,是自变体自来音频领域最重要的结构转变──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

语言模型处理离散 Token──音频是连续的── यदि आप भाषा / संगीत के लिए LLM 风格的模型构建 करना चाहते हैं, जैसे MusicGen、Moshi、Sesame CSM、VibeVoice、Orpheus, आपको सबसे पहले एक की आवश्यकता है **neural audio codec**एक कोडर को पुनः बनाने के लिए एक कोडर को तैयार करनाः

दो परिवारों का अस्तित्व हुआ है:

1. **Reconstruction-first codecs** EnCodec、DAC──优化感知音频质量── टोकन अकास्टिक के हैं, वे भाषण व्यक्ति की पहचान、音色、背景噪音在内的一切──
2. **Semantic-first codecs** मिमी (क्युताई)、SpeechTokenizer──强制第一代码簿 编码语言 / 音素内容,通常通过从波LM蒸留 得到──后续代码簿 是音响 细节──

2024-2026 के वर्षों की अंतर्दृष्टि हैः**当你尝试从文本生成时，纯 reconstruction codec 会给你模糊的语音。**覆盖 कोडेक टोकन के LLM 必须在同一个代码书中同时学习语言结构和声学结构,这无法良好扩展──把它们分开出来,即语义代码书 0、声学代码书 1-N,正是莫西和芝麻 CSM 能工作的原因──

## 概念

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### 核心技巧: अवशिष्ट वेक्टर क्वांटिज़ेशन (RVQ)

एक बड़ी कोडबुक का उपयोग करने के बजाय, अच्छे गुणवत्ता प्राप्त करने के लिए लाखों कोड की आवश्यकता हो सकती है), आधुनिक ध्वनी कोडक का उपयोग किया जाता है।**RVQ**:一串小代码簿 级联──第一代码簿 量化编码器 输出;第二代量化残留;依此类推── प्रत्येक代码簿有1024 个代码簿──8个代码簿 = 1024^8 = 10^24 的有效词表──

                                                                                                                                                                                                                                                              

### 2026 वर्ष के सबसे महत्वपूर्ण चार कोडक

**EnCodec (Meta, 2022)。**基线──波形的编码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码`1D conv + transformer + 1D conv`架构──MusicGen इसे प्रयोग करें──

**DAC (Descript, 2023)。**L2 मानकीकृत कोडबुक ∞ चक्रवर्ती सक्रियण फ़ंक्शन और सुधार के नुकसान का RVQ── सभी खुले कोडबुक में पुनर्निर्माण निष्ठा उच्चतम, कभी-कभी 12 कोडबुक ∞ का उपयोग करते समय मूल भाषा के साथ लगभग असमंजस हो जाता है──44.1 kHz 全频带──

**SNAC (Hubert Siuzdak, 2024)。**बहु-मात्रा RVQ, कच्चे आकार के कोडबुक की फ्रेम दर 细粒度 कोडबुक से कम है।

**Mimi (Kyutai, 2024)。**2026 साल की महत्वपूर्ण सफलता──12.5 हर्ट्ज फ्रेम रेट(极低),8 个 कोडबुक @ 4.4 kbps──Codebook 0 是 **从 WavLM distill 得到的**, प्रशिक्षण लक्ष्य है पूर्वानुमान WavLM के भाषा सामग्री विशेषताएं;; कोडबुक 1-7 ध्वनिक अवशिष्ट हैं;; यह मोशी ((15 पाठ) और सीसैम सीएसएम से जुड़ा हुआ है;;

### भाषा निर्माण के लिए फ्रेम रेट बहुत महत्वपूर्ण है

कम फ्रेम दर = कम क्रम = अधिक तेज़ एलएम

| Codec | Frame rate | 1 s = N frames | 适合 |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | 音乐、通用音频 |
| DAC-44.1k | 86 Hz | 86 | 高保真音乐 |
| SNAC-24k (coarse) | ~12 Hz | 12 | AR-LM 高效生成 |
| Mimi | 12.5 Hz | 12.5 | 流式语音 |

12.5 हर्ट्ज में नीचे, 10 सेकंड में केवल 125 कोडैक फ्रेम हैं, ट्रांसफार्मर आसानी से उन्हें पूर्वानुमानित कर सकता है।

### 语义 टोकन बनाम 声学 टोकन

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Semantic token（Mimi 中的 codebook 0）。**编码说了什么,即音素、词、内容──通过辅助预测 Loss from WavLM distill 得到──
- **Acoustic tokens（codebooks 1-7）。**编码音色、说话人身份、律、背景噪音、精细细节──

AR LM 先预测 सांकेतिक टोकन(以文本为条件),再预测 ध्वनिक टोकन(以 सांकेतिक + स्पीकर संदर्भ 为条件) ・・・ इस प्रकार का कारककरण है आधुनिक TTS 能够零射 克隆声音的原因: सांकेतिक मॉडल 处理内容; ध्वनिक मॉडल 处理音色。

### 2026 पुनर्निर्माण गुणवत्ता (बिट प्रति सेकंड, बिटरेट 越低越好)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

像 Opus जैसे पारंपरिक कोडेक में प्रति बिट की संज्ञानात्मक गुणवत्ता पर अभी भी विजय प्राप्त है।**离散 Token**(Opus 不产生这种 टोकन) और **generative-model quality**(LM 能如何使用这些代币)


```figure
rvq-codec-cascade
```

##  इसे निर्माण

### 步骤 1: EnCodec के साथ एन्कोड

```python
from encodec import EncodecModel
import torch

model = EncodecModel.encodec_model_24khz()
model.set_target_bandwidth(6.0)  # kbps

wav = torch.randn(1, 1, 24000)
with torch.no_grad():
    encoded = model.encode(wav)
codes, scale = encoded[0]
# codes: (1, n_codebooks, n_frames), dtype=int64
```

6 kbps 时`n_codebooks=8` प्रत्येक कोड 0-1023 है 10-बिट) 

### 步骤 2:डेकोड और पुनः माप

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### 步骤 3: अर्थिक-ध्वनि विभाजन(मिमी 风格)

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

अर्थशास्त्र कोडबुक 0 के साथ WavLM 对齐――आप एक पाठ से अर्थशास्त्र ट्रांसफार्मर, शब्द表比直接到音频小得多―― प्रशिक्षित कर सकते हैं।

### 步骤 4: क्यों कोडक टोकन ऊपर AR LM के लिए उपलब्ध है

मिमी के लिए 12.5 हर्ट्ज × 8 कोडबुक, एक 10 सेमी 语音片段:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 टोकन ट्रांसफार्मर के लिए बहुत छोटा है। एक 256M पैरामीटर वाला ट्रांसफार्मर आधुनिक GPU में 10 सेकंड के लिए उत्पन्न किया जा सकता है।

## इसका उपयोग करें

问题 → कोडक 映射:

| Task | Codec |
|------|-------|
| 通用音乐生成 | EnCodec-24k |
| 最高保真 reconstruction | DAC-44.1k |
| 覆盖语音的 AR LM (TTS) | SNAC or Mimi |
| 流式全双工语音 | Mimi (12.5 Hz) |
| 带文本的音效库 | EnCodec + T5 condition |
| 细粒度音频编辑 | DAC + inpainting |

经验法则:**如果你在构建 generative model，从 Mimi 或 SNAC 开始。如果你在构建压缩 pipeline，使用 Opus。**

## 常见坑

- **Codebook 太多。**⇒ कोडबुक में वृद्धि ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒   ⇒ ⇒ ⇒     ⇒                                                                                                                                                             
- **Frame-rate mismatch。**12.5 हर्ट्ज में मिमी ऊपर प्रशिक्षण LM, फिर 50 हर्ट्ज में EnCodec ऊपर बारीक-टीनिंग,
- **假设所有 codebook 都等价。**मिमी में, कोडबुक 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- **把 reconstruction quality 当作唯一指标。**यदि अर्थिक संरचना बहुत खराब है, तो एक कोडेक भी पुनर्निर्माण  अच्छा है, LM आधारित उत्पादन के लिए भी संभव है कोई उपयोग नहीं है।

## 交付 यह

保存为 `outputs/skill-codec-picker.md`एक कोडक चुनें

## अभ्यास

1. **Easy。**运行 `code/main.py`यह एक खिलौना स्केलर + अवशिष्ट क्वांटायज़र को प्राप्त करता है,并测量 के साथ कोडबुक पुनर्निर्माण त्रुटि 如何变化
2. **Medium。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `encodec`, में आरक्षित语音片段上比较 1、4、8、32 代码簿──绘制 PESQ या MSE बनाम बिटरेट──
3. **Hard。**加载 Mimi──Encode 一片段──把代码簿 0 替换为随机整数;decode──然后以类似的方式替换代代码簿 7──比较这两种破坏,代码簿 0 腐败 应该摧毁可理解度;代码簿 7 腐败 应该几乎不改变任何东西──

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| RVQ | Residual quantization | 小 codebook 级联；每个 codebook 量化前一个 residual。 |
| Frame rate | Codec speed | 每秒有多少个 Token-frame。更低 = 更快的 LM。 |
| Semantic codebook | Codebook 0 (Mimi) | 从 SSL 特征 distill 得到的 codebook；编码内容。 |
| Acoustic codebooks | 其他所有 codebook | 音色、韵律、噪声、精细细节。 |
| PESQ / ViSQOL | Perceptual quality | 与 MOS 相关的客观指标。 |
| EnCodec | Meta codec | RVQ 基线；MusicGen 使用它。 |
| Mimi | Kyutai codec | 12.5 Hz frame rate；semantic-acoustic split；支撑 Moshi。 |

## 延伸阅读

- [Défossez et al. (2023). EnCodec](https://arxiv.org/abs/2210.13438) RVQ 基线。
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546) सर्वोच्च सुरक्षा वास्तव में खुला कोडक
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) बहु-मात्रा RVQ。
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) अर्थ-ध्वनि विभाजन, वावएलएम डिस्टिलिशन
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) 两阶段 अर्थिक/ ध्वनिक 范式。
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) सबसे पहले उपलब्ध RVQ कोडक
