# आवाज क्लोनिंग और आवाज रूपांतरण

> आवाज क्लोनिंग आपके पाठ को दूसरे की आवाज से पढ़ना होगा। आवाज रूपांतरण आपके शब्दों को बनाए रखने के साथ ही आपकी आवाज को दूसरे की आवाज में बदलकर लिखना होगा। दोनों एक ही चीज पर निर्भर करते हैंः स्पीकर की पहचान को विभाजित करना और सामग्री को विभाजित करना।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## समस्या

2026 में, एक 5 सेकंड का ऑडियो क्लिप  उपभोक्ता स्तर के GPU  के साथ किसी भी शोर का उच्च गुणवत्ता वाला क्लोन बनाने के लिए पर्याप्त है  ElevenLabs  F5-TTS  OpenVoice v2  VoiceBox  ने शून्य-शॉट या कुछ-शॉट क्लोनिंग प्रदान की है  यह तकनीक  दोनों ही सुसमाचार हैं  पहुंच  TTS 配音  सहायक语音),  हथियार हैं  धोखाधड़ी  राजनीतिक गहरे नकली  आईपी  चोरी) 

 दो संबद्ध कार्य:

- **Voice cloning（TTS 侧）：**पाठ + 5 सेकंड संदर्भ आवाज → The sound's audio──
- **Voice conversion（speech 侧）：**स्रोत ऑडियो(A 说 X) + B का संदर्भ आवाज → B 说 X का ऑडियो──

 दोनों तरंगों को एक दूसरे के साथ एक स्रोत की सामग्री को पुनः जोड़कर, सामग्री, वक्ता, प्रोसोडी में विभाजित करेंगे।

2026 में प्रकाशित होने पर आपको निम्नलिखित महत्वपूर्ण शर्तों को पूरा करना होगा:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**आपकी पाइपलाइन असत्य वॉटरमार्क आउटपुट करना होगा,并拒绝未经同意的克隆──

## अवधारणा

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**5 सेकंड क्लिप  प्रसारित करने के लिए एक में हजारों वक्ताओं ऊपर प्रशिक्षित मॉडल ∙ स्पीकर एन्कोडर क्लिप 映射 करने के लिए वक्ता एम्बेडिंग; TTS डिकोडर 以该 एम्बेडिंग 和 पाठ 作为条件 ∙

उपयोगकर्ता:F5-TTS(2024) 、आपकेTTS(2022) 、XTTS v2(2024) 、OpenVoice v2(2024) 👇

**Few-shot fine-tuning。**录制目标声音的 5-30 分钟音频──对基模型进行一小时 LoRA细节调──质量会从还行跃升到难以区分──Coqui 和 ElevenLabs都支持这种模式;社区也将它用于F5-TTS──

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (उदाहरण के लिए सॉफ्ट फ़ोनम पोस्टियर्स,PPGs), फिर लक्ष्य स्पीकर के साथ重新合成──对语言和口音更稳健──KNN-VC(2023)、Diff-HierVC(2023) इस विधि का उपयोग करें──
- **Disentanglement。** प्रशिक्षण एक ऑटोकोडर, बोतल गला के लटते स्थान में मध्य分离 सामग्री、 स्पीकर 和 प्रोसोडी。 सुझाव समय स्पीकर प्रतिस्थापन एम्बेडिंग── गुणवत्ता कम लेकिन अधिक तेजी से── ऑटोवीसी(2019)、VITS-VC 变体使用此方法──

**基于 Neural codec 的 cloning（2024+）。**VALL-E、VALL-E 2、NaturalSpeech 3、VoiceBox  ध्वनि 视为来自SoundStream / EnCodec के विखंडन टोकन, कोडेक टोकन में ऊपर प्रशिक्षण बड़े ऑटोरेग्रेसिव या प्रवाह-अनुरूप 模型──短 prompt 上的质量可与 ElevenLabs 相比──

### 伦理部分, कोई अतिरिक्त नहीं

**Watermarking。**PerTh (Perth) और SilentCipher (SilentCipher) (२०२४) ऑडियो में लगभग १६-३२ बिट आईडी में अदृश्य रूप से एम्बेड होंगे── यह पुनः एन्कोडिंग, स्ट्रीमिंग और सामान्य संपादन का सामना कर सकता है── पहले से ही उपलब्ध उत्पादन के लिए खुला स्रोत उपलब्ध है 实现──

**Consent gates。** प्रत्येक क्लोन किए गए आउटपुट को सत्यापित करने योग्य सहमति रिकॉर्ड के साथ 配对──我, रोहित, 2026-04-22, को इस आवाज को X उद्देश्य के लिए उपयोग करने का अधिकार देना होगा भंडारण में छेड़छाड़-प्रमाणित लॉग में

**Detection。**AASIST、RawNet2 和 Wav2Vec2-AASIST 都提供探测器──ASVspoof 2025 challenge 发布的结果显示, state-of-the-art detectors 针对ElevenLabs、VALL-E 2 和 Bark 输出 EER为0.82.3%──

### संख्याएँ (२०२६)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0.70 अधिकांश श्रोताओं के लिए आमतौर पर लक्ष्य आवाज से अलग करना मुश्किल हो जाता है।


```figure
sp-voice-factorize
```

## इसे बनाओ

### चरण 1: उपयोग पहचान संश्लेषण 分解(`main.py`中的 केवल कोड डेमो)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

 अवधारणा बहुत सरल है; मुख्य जटिलता `tts_model`和 स्पीकर एन्कोडर 中──

### चरण 2: F5-TTS के साथ शून्य शॉट क्लोन बनाने

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

संदर्भ प्रतिलिपि 必須與音響 完全匹配;不匹配會破坏排列──

### चरण 3: KNN-VC के साथ आवाज रूपांतरण करें

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行 WavLM,为源与目标池 提取每框架嵌入,然后将每个源框架 替换为池中的最近邻居──非参数方法,使用一分钟目标语句 即可工作──

### चरण 4: 嵌入 वॉटरमार्क

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

 32 बिट के बारे में उपयोगिता लोड, में MP3 पुनः एन्कोड और हल्के शोर  के बाद अभी भी परीक्षण किया जा सकता है

### चरण 5: सहमति गेट

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## इसका प्रयोग करें

2026 वर्ष का स्टैकः

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## फंदे

- **Reference transcript 未对齐。**F5-TTS 和类似模型要求参考文字与参考音频 完全匹配,包括标点──
- **Reference 有混响。**इको एक क्लोन को नष्ट कर देगा।
- **情绪不匹配。**खुश के प्रशिक्षण संदर्भ जाते सब कुछ खुश क्लोन में बदल जाए जाते भावनाओं अनुरूप उद्देश्य उद्देश्य 
- **Language leakage。**क्लोन अंग्रेजी बोलने वाले 后让模型说法语,通常仍会带着口音;跨语言模型的使用(XTTS、VALL-E X) ⋅
- **没有 watermark。**2026 के अगस्त महीने से, यूरोपीय संघ में ⇒ कानूनी रूप से जारी नहीं किया जा सकता है।

## इसे भेजें

保存为 `outputs/skill-voice-cloner.md`◊ एक अनुमति गेट + वॉटरमार्क + गुणवत्ता लक्ष्य के साथ क्लोनिंग या रूपांतरण पाइपलाइन डिजाइन करना ◊

## व्यायाम

1. **Easy。**运行 `code/main.py`通过计算两个扬声器在交换前后的kosine,演示扬声器嵌入式交换
2. **Medium。**उपयोग करें ओपनवॉइस v2 क्लोन अपनी आवाज── माप संदर्भ और क्लोन के बीच SECS── के माध्यम से चुप्पी  माप CER──
3. **Hard。**20 क्लोन पर SilentCipher वॉटरमार्क लगाकर उन्हें 128 kbps MP3 एन्कोड+डेकोड करके पुनः परीक्षण किया जाएगा।

## प्रमुख शर्तें

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## आगे पढ़ना

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) ओपन सोर्स SOTA शून्य शॉट क्लोनिंग。
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)和 [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) तंत्रिका-कोडेक टीटीएस。
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879)  डिस्टैगमेंट के आधार पर आवाज रूपांतरण
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975)  पुनर्प्राप्ति के आधार पर वीसी──
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) 生产可用32 बिट ऑडियो वॉटरमार्क
- [ASVspoof 2025 results](https://www.asvspoof.org/) डिटेक्टर और सिंथेसाइज़र की सशस्त्र प्रतियोगिता,2026 साल अपडेट。
