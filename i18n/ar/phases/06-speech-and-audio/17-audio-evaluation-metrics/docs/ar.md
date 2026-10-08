# تقييم صوتي  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布──本课为每种音频任务命名 2026 年的指标:ASR(WER、CER、RTFx)、TTS(MOS、UTMOS、SECS、WER-on-ASR-round-trip)、音频语言(MMAU、LongAudioBench)、音乐(FAD、CLAP) 以及说话人(EER)──也包括用于对比排行列──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## 问题

كل مهمة صوتية لها العديد من المؤشرات، كل مؤشرات تقيس مختلف الأبعاد. استخدام مؤشرات خاطئة، سوف تجعلك تنشر واحدة على لوحة التحكم تبدو رائعة، ولكن أداء سيء جدا في بيئة الإنتاج.

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

### مؤشر ASR

**WER (Word Error Rate)。** `(S + D + I) / N`◊评分前先转小写、除标点、规范化数字──使用 `jiwer`أو OpenAI `whisper_normalizer`◊&lt;5% = 朗读语音达到人类水平──

**CER (Character Error Rate)。**相同公式,字符级别──用于声调语言(ماندارين、كانتونية) ، لأن الحدود الكلمات في هذه اللغات قد تكون لها اختلافات.

**RTFx (inverse real-time factor)。**كل ساعة جدارية 秒处理的音频秒数──越高越好── پاراكيت-TDT 达到 3380×── همس-كبير-v3 约为 ~30×──

**First-token latency。**时间──对 流 至关重要──Deepgram Nova-3:~150 ms──

### TTS

**MOS (Mean Opinion Score)。**1-5   的人工评分──黄金标准,但速度慢── كل نموذج جمع 20+ 听众, كل نموذج 100+ 样本──

**UTMOS (2022-2026)。**訓練得到的MOS 预测器──在标准基准上与人工MOS 的相关性约为 ~0.9──F5-TTS:UTMOS 3.95;ground truth:4.08──

**SECS (Speaker Encoder Cosine Similarity)。**تستخدم لتقليد الصوت.

**WER-on-ASR-round-trip。**في TTS 输出上运行 فيسر,并相对于输入文本计算 WER──用于捕捉可理解度回归──2026 SOTA:&lt;2% CER──

**TTFA (time-to-first-audio)。**端到端延迟── كوكورو-82M: ~100 ms; F5-TTS: ~1 ثانية──

### النسخ الصوتية 专用指标

**SECS + MOS + CER**كثلاثة ثنائيات مجموعة. كثلاثة ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائيات ثنائية ثنائيات ثنائيات ثنية ثنية ثنائيات ثنية ثنائيات ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثنية ثن

### التحقق من المتحدث

**EER (Equal Error Rate)。**معدل قبول كاذب 等等 false rejection rate 的值──ECAPA 在 VoxCeleb1-O 上:0.87%──

**minDCF (min Detection Cost)。**في نقطة تشغيل محددة ((عادة FAR=0.01) زيادة تكلفة السلطة.

### الإسهال

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time` التحقق من语音 + 误报语音 + 说话人混, كل شيء هو واحد占比──AMI الاجتماعات:DER ~10-20% 是现实水平──piannote 3.1 + دقة-2 التجارية:在录制良好的音频上 &lt;10% DER──

**JER (Jaccard Error Rate)。**مؤشر بديل لـ DER، على قصير المقطع

### تصنيف الصوت

متعددة العلامات: جميع الصفوف**mAP (mean Average Precision)**◊مجموعة صوتية:BEATs-iter3 为 0.548 mAP‬

互斥 متعددة الفئات:**top-1、top-5 accuracy**❖ أوامر الكلام v2:99.0% أعلى-1

类别 عدم توازن:**macro F1**+ **per-class recall** تقرير الفئة، دقة التسجيلات الكلية 会掩盖哪些类类失败──

### جيل الموسيقى

**FAD (Fréchet Audio Distance)。**الفاصل بين الموسيقى والإعدادات الموسيقية.

**CLAP Score。**استخدام CLAP Embedding 的文本-音频对齐分数──&gt; 0.3 = 合理对齐──

**Listening panel MOS。**بالنسبة للموسيقى المستهلكة، لا يزال الحكم النهائي.

### مقياس اللغة الصوتية

**MMAU (Massive Multi-Audio Understanding)。**10 ألف صوت

**MMAU-Pro。**1800 个困难条目,四类: التحدث / الصوت / الموسيقى / متعددة الصوتات──4 选择 1 的随机水平为25%──Gemini 2.5 Pro 总体约 ~60%;所有模型 在多音频上约 ~22%──

**LongAudioBench。**ربما ساعة واحدة، مع معنى استفسارها.

**AudioCaps / Clotho。**الإشارة إلى المرجعية.

### التدفق من حديث إلى حديث

**Latency P50 / P95 / P99。**من المستخدم الحديث ينتهي إلى أول سماع للرد فعل الجدار الساعة 时间──Moshi:200 ms;GPT-4o الوقت الحقيقي:300 ms──

**WER / MOS**تستخدم للخروج

**Barge-in responsiveness。**من المستخدم إلى المساعد في الصوت.

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

## الإنشاء

### الخطوة الأولى: إعادة تنظيم المعلومات

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

### 步骤 2:TTS رحلة ذهاب وإياب WER

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### الخطوة 3: تستخدم لتقليد الصوت من SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### الخطوة 4: لتوليد الموسيقى

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### الخطوة 5: تستخدم للتحقق من EER المتحدثة (((مع الدروس 6

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

## استخدام

وكل عملية نشر تعتمد على حزمة تقييم ثابتة وكل نموذج يتم تحديثه

1. **评分前先规范化。**转小写、去标点、展开数字──报告规范化规则──
2. **报告分布，而不是平均值。**التأخير 报 P50/P95/P99。 التصنيف 报 لكل فئة التذكر。MMAU 报 لكل فئة。
3. **运行一个标准公开 benchmark。**حتى لو كانت بيانات الإنتاج الخاصة بك مختلفة، في تقرير ASR / TTS Arena / MMAU على مفتوحة يمكن أن تجعل المراجعة تقارنة مع الكتالي.

## فخ

- **UTMOS 外推。**انها تتدرب على الصوت النقي في VCTK 风格 ؛ على 杂 / 克隆 / 情绪化音频评分较差──
- **MOS panel 偏差。**20 个 Amazon Mechanical Turk worker ≠ 20 个目标用户──如果风险高,就为领域组 付费──
- **FAD 依赖参考集。**跨模型比较时, يجب استخدام نفس التوزيع المرجعي
- **Aggregate WER。**总体 5% WER 可能掩盖口音语音上的 30% WER── حسب النقطة السكانية 报告──
- **公开 benchmark 饱和。**معظم النموذج الحدود في المعايير المرجعية فوق قد اقترب من السطح العلوي.

##  إصدار

保存为 `outputs/skill-audio-evaluator.md`◊ للنموذج الصوتي المفضل 发布选择指标、基准 和报告格式──

## التدريب

1. **Easy。**运行 `code/main.py` في الدراجة 输入上计算 WER / CER / EER / SECS / FAD-ish / MMAU-ish‬
2. **Medium。**构建一个TTS回路 WER harness──将你的Kokoro 或 F5-TTS 输出送进 Whisper──对 50 个提示 计算 WER──标记 WER &gt; 10% 的提示──
3. **Hard。**في MMAU-Pro خطاب + متعددة الصوت 子集(各 50 条目) 上评测你在10 درسي中选择的 LALM──报告每类准确性,并与已发布数字比较──

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
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152)  تدريب الحصول على MOS 预测器。
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) الموسيقى-جن 标准。
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜。
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) منطق LALM 排行榜
- [HEAR benchmark](https://hearbenchmark.com/) مؤشر صوتي SSL المرجعي
