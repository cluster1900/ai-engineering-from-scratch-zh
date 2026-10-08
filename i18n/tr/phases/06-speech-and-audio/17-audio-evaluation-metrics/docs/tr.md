# Ses Değerlendirme  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布;;本课为每种音频任务命名 2026年的指标:ASR(WER、CER、RTFx)、TTS(MOS、UTMOS、SECS、WER-on-ASR-round-trip)、音频-language(MMAU、LongAudioBench)、音乐(FAD、CLAP) 以及说话人(EER) ‒

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## 问题

Her ses görevinde birden fazla gösterge vardır, her gösterge farklı boyutları ölçer. Hata göstergesini kullanmak, bir sürücünün üzerinde bir gösterge tablosu yayınlamanızı sağlar.

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

### ASR gösterge

**WER (Word Error Rate)。** `(S + D + I) / N`◊评分前先转小写、除标点、规范化数字──使用 `jiwer`Ya da OpenAI'nın`whisper_normalizer`◊&lt;5% = 朗读语音 insan seviyesine ulaşmak

**CER (Character Error Rate)。**Aynı formül, 字符级别──用于声调语言(Mandarin、Cantonese), çünkü bu dillerin 词边界可能有差义──

**RTFx (inverse real-time factor)。**Her duvar saati 秒处理的音频秒数──越高越好──パラケット-TDT 达到3380×──ささやき-大v3 约为 ~30×──

**First-token latency。**时间──对 流 至关重要──Deepgram Nova-3:~150 ms──

### TTS gösterge

**MOS (Mean Opinion Score)。**1-5 的人工评分──黄金标准,但速度慢──每个样本收集20+ 听众,每个模型100+样本──

**UTMOS (2022-2026)。**訓練された MOS 预测器──標準基準上与人工 MOS 関連性 約 ~0.9──F5-TTS:UTMOS 3.95; ground truth:4.08──

**SECS (Speaker Encoder Cosine Similarity)。**Ses klonlaması için kullanılmıştır. Reference audio频与克隆输出之间的 ECAPA Embedding cosine──&gt; 0.75 = 可识别的克隆声音──

**WER-on-ASR-round-trip。**Bu nedenle, bu konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde,

**TTFA (time-to-first-audio)。**端到端延迟──Kokoro-82M: ~100 ms; F5-TTS: ~1 saniye──

### Ses klonlaması 专用指标

**SECS + MOS + CER**作为三元组──SECS Yüksek ama MOS 低的克隆,说明音色正确但不自然;反过来则说明声音自然但说话人不对──

### Konuşmacı doğrulama

**EER (Equal Error Rate)。**Yanlış Kabul Sınıfı 等等 false rejection rate 的值──ECAPA 在 VoxCeleb1-O 上:0.87%──

**minDCF (min Detection Cost)。**Seçilen işletme noktasında (özellikle FAR=0.01) artıvalık maliyetleri, EER'den daha yakın üretim ortamına göre

### Diaryizasyon

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time`◊漏检语音 + 误报语音 + 说话人混,每项都是一个占比──AMI toplantıları:DER ~10-20% 是现实水平──pianonote 3.1 + Precision-2 ticari:在录制良好的音频上 &lt;10% DER──

**JER (Jaccard Error Rate)。**DER'in alternatif göstergesi, kısa filmlerde daha iyi bir dengedir.

### Ses sınıflandırması

Çoklu etiket: tüm sınıflar **mAP (mean Average Precision)**❖ Ses: BEATs-iter3 为 0.548 mAP──

互斥 Çoklu sınıf:**top-1、top-5 accuracy**❖ Konuşma Komutları v2:99.0% top-1

类别不平衡:**macro F1**+ **per-class recall**◊ sınıf başına rapor, toplam doğruluk 会掩盖哪些类型失败──

### Müzik jenerasyonu

**FAD (Fréchet Audio Distance)。**Gerçek Ses Sesleri ve Yaratıcı Sesleri arasındaki mesafe

**CLAP Score。**CLAP Embedding'in kullanımı:

**Listening panel MOS。**TTS Arena'daki Suno v5'in ELO'sı 1293'dir.

### Sesli dil referansı

**MMAU (Massive Multi-Audio Understanding)。**10 bin sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli sesli

**MMAU-Pro。**1800 个困难条目,四类:speech / sound / music / multi-audio──4 选 1 的随机水平为25%──Gemini 2.5 Pro 总体约 ~60%;所有模型 在多音上约 ~22%──

**LongAudioBench。**Belki de bir dakika sonra, sesli bir soru sormak için.

**AudioCaps / Clotho。**Başlıklı referans göstergesi──SPICE、CIDER、FENSE 指标──

### Konuşma-söz akışı

**Latency P50 / P95 / P99。**Kullanıcı konuşması sonuna kadar ilk sesli duvar saati 时间──Moshi:200 ms; GPT-4o Gerçek zaman:300 ms──

**WER / MOS**Dışarı çıkmak için kullanılıyor.

**Barge-in responsiveness。**Kullanıcı kesintisi ile yardımcı sesli sesli zaman arasında hedef &lt;150 ms\\'

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

## Yapım

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

### 步骤 2:TTS geri dönüş yolculuğu

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### 步骤 3: Ses klonlamasına yönelik SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### 步骤 4: müzik jenerasyonu için FAD

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### 步骤 5: Konuşmacıların EER'ini doğrulamak için kullanılır

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

## kullanımı

Bu nedenle, her seferinde bir değerlendirme harnesini oluşturmak ve her model için yenilemeler yaptırmak için üç temel kural vardır:

1. **评分前先规范化。**转小写、去标点、展开数字──报告规范化规则──
2. **报告分布，而不是平均值。**Gecikme 报 P50/P95/P99。 sınıfı başına sınıfı 报
3. **运行一个标准公开 benchmark。**Üretim verileriniz farklı olsa bile, Open ASR / TTS Arena / MMAU'da raporlar da değerlendirme yapabilmektedir.

## 陷

- **UTMOS 外推。**VCTK 风格的干净语音上训练; 杂 / 克隆 / 情绪化音频评分较差──
- **MOS panel 偏差。**20 个 Amazon Mechanical Turk işçisi ≠ 20 个目标用户──如果风险高,就为领域面板 付费──
- **FAD 依赖参考集。**跨模型比较时, aynı referans dağılımını kullanmak gerekir.
- **Aggregate WER。**总体 5% WER 可能掩盖口音语音上 30% WER──人口統計分 报告──
- **公开 benchmark 饱和。**Büyük çoğunluk sınır modeli standart referanslamasında yukarı yukarı sınırına yaklaştı. Yapı, gerçek akışın içindeki içsel bir setini yansıtıyor.

## Yayınlama

保存为 `outputs/skill-audio-evaluator.md`◊ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △  △ △ △ △                                               

## 练习

1. **Easy。**运行  İşlem`code/main.py`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △
2. **Medium。**建建一个TTS回路WER带――将你的Kokoro 或 F5-TTS 输出送进 Whisper──对 50 个提示 计算WER──标记WER &gt; 10% 的提示──
3. **Hard。**MMAU-Pro konuşması + çok sesli 子集 ((各 50 条目) 上评测你在10 Lesson 中选择的 LALM──报告每类精度,并与已发布数字比较──

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

- [jiwer](https://github.com/jitsi/jiwer) 带规范化工具的 WER/CER 库──
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152) 訓練されたMOS 预测器。
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) müzik-gen 标准。
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard)2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜。
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) LALM mantık 排行榜。
- [HEAR benchmark](https://hearbenchmark.com/) sesli SSL referansı¬rı¬
