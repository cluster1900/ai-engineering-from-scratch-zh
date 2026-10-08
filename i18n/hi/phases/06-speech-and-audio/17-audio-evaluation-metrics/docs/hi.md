# ऑडियो मूल्यांकन  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布──本课为每种音频任务命名 2026年的指标:ASR(WER、CER、RTFx)、TTS(MOS、UTMOS、SECS、WER-on-ASR-round-trip)、ऑडियो-भाषा(MMAU、LongAudioBench)、音乐(FAD、CLAP)以及说话人(EER)──也包括用于对比的排行列──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## 问题

प्रत्येक ऑडियो मिशन में कई मापदंड होते हैं, प्रत्येक मापदंड अलग-अलग आयामों का माप करता है। गलत मापदंड का उपयोग करके, आप एक डैशबोर्ड पर एक प्रकाशित करेंगे जो बहुत अच्छा दिखता है, लेकिन उत्पादन वातावरण में बहुत खराब प्रदर्शन करता है।

| Task | Primary | Secondary |
|------|---------|-----------|
| ASR | WER | CER · RTFx · first-token latency |
| TTS | MOS / UTMOS | SECS · WER-on-ASR-round-trip · CER · TTFA |
| Voice cloning | SECS (ECAPA cosine) | MOS · CER |
| Speaker verification | EER | minDCF · FAR / FRR at operating point |
| Diarization | DER | JER · speaker confusion |
| Audio classification | top-1 · mAP | macro F1 · per-class recall |
| Music generation | FAD | CLAP · listening panel MOS |
| Audio language model | MMAU-Pro | LongAudioBench · AudioCaps FENSE |
| Streaming S2S | latency P50/P95 | WER · MOS |

## 概念

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### एएसआर

**WER (Word Error Rate)。** `(S + D + I) / N`◊评分前先转小写、 हटाना标点、规范化数字──使用 `jiwer`या OpenAI की `whisper_normalizer` 5% = 朗读语音 मानव स्तर पर पहुंचें

**CER (Character Error Rate)。**समान सूत्र,字符级别──用于声调语言(मंडारिन、कैंटोनिस), चूंकि इन भाषाओं के शब्द सीमा में मतभेद हो सकते हैं──

**RTFx (inverse real-time factor)。**प्रत्येक दीवार घड़ी 秒处理的音频秒数──越高越好── पैराकेट-TDT 达到3380×──ささ-大v3 约为 ~30×──

**First-token latency。**                                                                                                                                                                                                                                                              

### TTS

**MOS (Mean Opinion Score)。**1-5 的人工评分──黄金标准,但速度慢── प्रत्येक नमूना 20+ दर्शकों को एकत्रित करता है, प्रत्येक मॉडल 100+ नमूने──

**UTMOS (2022-2026)。**训练得到的MOS 预测器──在标准基准上与人工MOS 的相关性约为 ~0.9──F5-TTS:UTMOS 3.95;ground truth:4.08──

**SECS (Speaker Encoder Cosine Similarity)。**आवाज क्लोनिंग हेतु उपयोग किया गया है।

**WER-on-ASR-round-trip。**输出上运行 Whisper,并对输入文本计算 WER──用于捕捉可理解度回归──2026 SOTA:&lt;2% CER──

**TTFA (time-to-first-audio)。**端到端延迟──कोकोरो-82M: ~100 ms;F5-TTS: ~1 s──

### आवाज क्लोनिंग 专用指标

**SECS + MOS + CER**作为三元组──SECS उच्च लेकिन MOS 低的克隆,说明音色正确但不自然;反过来则说明声音自然但说话人不对──

### स्पीकर सत्यापन

**EER (Equal Error Rate)。**गलत स्वीकार दर 等等等 गलत अस्वीकार दर का 值──ECAPA 在 VoxCeleb1-O 上:0.87%──

**minDCF (min Detection Cost)。**                                                                                                                                                                                                                                                              

### डायरीकरण

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time`◊漏检语音 + 误报语音 + 说话人混, प्रत्येक项都是一个占比──AMI बैठकें:DER ~10-20% 是现实水平──pianonote 3.1 + सटीक-2 वाणिज्यिक:在录制良好的音频上 &lt;10% DER──

**JER (Jaccard Error Rate)。**DER का प्रतिस्थापन सूचक,

### ऑडियो वर्गीकरण

बहु-लेबलः सभी वर्गों पर **mAP (mean Average Precision)**◊ ऑडियोसेट:बीएटीएस-इटर3 为 0.548 mAP──

互斥 बहु-वर्ग:**top-1、top-5 accuracy** भाषण कमांड v2:99.0% शीर्ष-1

类别 असंतुलन**macro F1**+ **per-class recall**️ प्रति वर्ग रिपोर्ट,汇总 सटीकता 会掩盖哪些类别失败──

### संगीत पीढ़ी

**FAD (Fréchet Audio Distance)。**वास्तविक音频与生成音频的VGGish-Embedding 分布之间的距离──MusicGen-small 在 MusicCaps 上:4.5──MusicLM:4.0──越低越好──

**CLAP Score。**CLAP Embedding का प्रयोग करें

**Listening panel MOS。**TTS Arena में 1293 के लिए ELO (उत्पादन) के लिए एक अंतिम निर्णय है।

### ऑडियो भाषा बेंचमार्क

**MMAU (Massive Multi-Audio Understanding)。**10k 个音频 QA 对──

**MMAU-Pro。**1800 个困难条目,四类:भाषण / ध्वनि / संगीत / बहु-ऑडियो──4 选 1 का随机水平为25%──Gemini 2.5 Pro 总体约60%;所有模型在多音上约22%──

**LongAudioBench。**शायद एक घंटे के लिए, एक शब्द के साथ.

**AudioCaps / Clotho。**उपशीर्षक बेंचमार्क──SPICE、CIDER、FENSE 指标──

### भाषण-भाषण स्ट्रीमिंग

**Latency P50 / P95 / P99。**उपयोगकर्ता वार्ता समाप्त होने तक पहली श्रव्य प्रतिक्रिया की दीवार घड़ी 时间──Moshi:200 ms;GPT-4o वास्तविक समय:300 ms──

**WER / MOS**आउटपुट के लिए उपयोग किया जाता है।

**Barge-in responsiveness。**उपयोगकर्ता से उपयोगकर्ता के लिए समय का अंत करने के लिए सहायक静音 का समय।

### 2026 排行榜

| Leaderboard | Tracks | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | English + multilingual + long-form | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | English TTS | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO from paired votes | `artificialanalysis.ai/speech` |
| MMAU-Pro | LALM reasoning | `mmaubenchmark.github.io` |
| SpeakerBench / VoxSRC | Speaker recognition | `voxsrc.github.io` |
| MMAU music subset | Music LALM | (within MMAU) |
| HEAR benchmark | Self-supervised audio | `hearbenchmark.com` |


```figure
sp-wer-align
```

## 构建

### 步骤 1:带规范化的 WER

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip

transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(
    truth="Please turn on the lights.",
    hypothesis="please turn on the light",
    truth_transform=transform,
    hypothesis_transform=transform,
)
# ~0.17
```

### 步骤 2:TTS वापसी-यात्रा WER

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### 步骤 3: आवाज क्लोनिंग के लिए उपयोग करने के लिए SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### 步骤 4: संगीत पीढ़ी के लिए उपयोग किया जाता है

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### 步骤 5: स्पीकर की ईईआर सत्यापन के लिए प्रयोग किया गया है

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        frr = sum(1 for s in same_scores if s < t) / len(same_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

## उपयोग

प्रत्येक तैनाती के लिए एक निश्चित मूल्यांकन हर्नर तैयार किया गया है और प्रत्येक मॉडल 更新时运行──三条基本规则:

1. **评分前先规范化。**转小写、去标点、展开数字―― रिपोर्ट नियमन नियमन
2. **报告分布，而不是平均值。**लटेंसी 报 P50/P95/P99。 वर्गीकरण 报 प्रति वर्ग यादृच्छिक──MMAU 报 प्रति श्रेणी──
3. **运行一个标准公开 benchmark。**यहां तक कि आपके उत्पादन डेटा में भी भिन्नता है, ओपन एएसआर / टीटीएस एरेना / एमएमएयू में रिपोर्ट भी समीक्षा करने और तुलना करने में सक्षम है।

## 陷

- **UTMOS 外推。**यह VCTK 风格 के शुद्ध语音上训练; 杂 / 克隆 / 情绪化音频评分较差──
- **MOS panel 偏差。**20 个 अमेज़न मैकेनिकल तुर्क कार्यकर्ता ≠ 20 个目标用户──如果风险高,就为领域面板 付费──
- **FAD 依赖参考集。**跨模型比较时, एक ही संदर्भ वितरण का उपयोग करना होगा
- **Aggregate WER。** कुल 5% WER संभव है मुखौटे पर 30% WER को कवर करें  जनसंख्या सांख्यिकीय स्लाइस के अनुसार  रिपोर्ट
- **公开 benchmark 饱和。**अधिकांश सीमा मॉडल मानक बेंचमार्क में ऊपर की सीमा के करीब आ गए हैं।

## 发布

保存为 `outputs/skill-audio-evaluator.md`为任意音频模型 发布选择指标、基准和报告格式──

## अभ्यास

1. **Easy。**运行 `code/main.py`在玩具 输入上计算 WER / CER / EER / SECS / FAD-ish / MMAU-ish
2. **Medium。**建建一个TTS回路WER带――将你的Kokoro或F5-TTS 输出送进语──对50 个提示 计算WER──标记WER&gt; 10% 的提示──
3. **Hard。**MMAU-Pro भाषण + बहु-ऑडियो 子集 ((各 50 条目) 上评测你在10 Lesson 中选择的 LALM── प्रति श्रेणी सटीकता,并与已发布数字比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| WER | ASR 分数 | 规范化后 word 级别的 `(S+D+I)/N`。 |
| CER | Character WER | 用于声调语言或 char-level 系统。 |
| MOS | 人类意见 | 1-5 评分；20+ 听众 × 100 样本。 |
| UTMOS | ML MOS 预测器 | 训练得到的 model；与人工 MOS 相关性约 ~0.9。 |
| SECS | Voice-clone 相似度 | 参考音频与克隆音频之间的 ECAPA cosine。 |
| EER | Speaker verif 分数 | FAR = FRR 的阈值。 |
| DER | Diarization 分数 | (FA + Miss + Confusion) / total。 |
| FAD | Music-gen 质量 | VGGish Embedding 上的 Fréchet distance。 |
| RTFx | 吞吐量 | 每个 wall-clock 秒处理的音频秒数。 |

## 延伸阅读

- [jiwer](https://github.com/jitsi/jiwer) 带规范化工具的 WER/CER 库
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152)  प्रशिक्षित MOS 预测器──
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) संगीत-जन 标准。
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜──
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) LALM तर्क 排行榜──
- [HEAR benchmark](https://hearbenchmark.com/) ऑडियो एसएसएल बेंचमार्क──
