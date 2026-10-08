# 语音克隆和语音转换

> 语音克隆会使用别人的声音读出你的文本――语音转换会在保留你所说的内容同时,把你的声音改写成别人的声音――两者都依赖于一个分解:把讲者身份与内容分离――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## 问题

在2026年,一段5秒的音频片段已经足以使用消费级GPU产生任何人的声音的高质量克隆.ElevenLabs、F5-TTS、OpenVoice v2、VoiceBox都提供了零射击或少数射击克隆.

两个紧密相关任务:

- **Voice cloning（TTS 侧）：**文字+5秒引用语音 → 该声音的音频──
- **Voice conversion（speech 侧）：**源音频(A 说 X) + B 的参考声音 → B 说 X 的音频──

两者都将波形分成内容,扬声器,演讲,再将一个来源的内容与另一个来源的扬声器重新组合.

在2026年发布时,你必须满足关键约束:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**你的管道必须输出无声水印,并拒绝未经同意的克隆.

## 概念

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**将5秒的剪辑传递给数千名演讲者中一个训练过的模型――扬声器编码器将剪辑映射为扬声器嵌入;TTS解码器以该嵌入和文本作为条件――

您的TTS (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (您的TTS) (TTS)

**Few-shot fine-tuning。**录制目标声音的5-30分钟音频──对基模型进行一小时LoRA细节调──质量会从还行跃升到难以区分──Coqui 和 ElevenLabs都支持这种模式;社区也将用于F5-TTS──

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (例如软音体后面,PPGs),然后使用重新合成的目标扬声器对语言和口音更稳健.
- **Disentanglement。**训练一个自动编码器,在瓶的潜伏空间中分离内容、扬声器 和 prosody──推理时替换扬声器嵌入──质量较低但更快──AutoVC(2019)、VITS-VC 变体使用这种方法──

**基于 Neural codec 的 cloning（2024+）。**视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频 视频

### 伦理部分,不是附加项

**Watermarking。**珀斯 (Perth) 和SilentCipher (SilentCipher) 将在音频中嵌入约16-32位ID──它可以经历重新编码,流媒体和常见编辑──已有可生产的开源实现──

**Consent gates。**必须将每个克隆的输出与可验证的同意记录配对.

**Detection。**根据"AASIST"",RawNet2 和 Wav2Vec2-AASIST"的结果显示,针对ElevenLabs、VALL-E2 和 Bark的最新检测器,输出 EER为0.82.3%──

### 号码 (第2026号)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

对于大多数听众来说,SECS >0.70通常已经难以区分与目标声音.


```figure
sp-voice-factorize
```

## 建立它

### 步骤1: 用识别合成 分解`main.py`中的仅仅代码演示)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

概念很简单;实现的主要复杂性在`tts_model`和扬声器编码器 中──

### 步骤2:用F5-TTS做零射击克隆

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

引用文本必须与音频完全匹配;不匹配会破坏对齐.

### 步骤3:使用KN-VC做语音转换

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行WavLM,为源与目标池提取每个框架嵌入,然后将每个源框架 替换为池中最近的邻居──非参数方法,使用一分钟的目标语句 即可工作──

### 嵌入水标

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

约32位的有效载荷,在MP3重新编码和轻微噪音后仍然可检测.

### 步骤5:同意门

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## 用它

2026 年的堆:

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## 陷

- **Reference transcript 未对齐。**参考文字与参考音频完全匹配,包括标点.
- **Reference 有混响。**声声声将毁掉克隆.
- **情绪不匹配。**让所有内容都变成欢乐的克隆.
- **Language leakage。**克隆英语讲者 后让模型说法语,通常仍然会带着口音;使用跨语言模型 (XTTS、VALL-E X) 。
- **没有 watermark。**欧盟无法合法发布.

## 运送它

保存为`outputs/skill-voice-cloner.md`❖设计一个有同意的门户+水印+质量目标的克隆或转换管道――

## 运动

1. **Easy。**运行`code/main.py`通过计算两个扬声器在交换前后的代数,演示扬声器嵌入式交换.
2. **Medium。**使用OpenVoice v2克隆 你自己的声音――测量参考与克隆之间的SECS――通过语测量 CER――
3. **Hard。**对于20个克隆 应用SilentCipher水印,将它们通过128 kbps MP3编码+解码,再检查有效载荷――报告比特精度――

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## 进一步阅读

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885)开源SOTA零射击克隆――
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)和 [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370)神经编码器TTS──
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879) 基于解脱的声音转换.
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975) 基于检索的VC──
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher)产品可用32位音频水标
- [ASVspoof 2025 results](https://www.asvspoof.org/)探测器与合成器的军备竞赛,2026年更新──
