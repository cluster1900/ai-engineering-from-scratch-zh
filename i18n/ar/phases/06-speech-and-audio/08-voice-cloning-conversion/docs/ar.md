# إستنساخ الصوت وتحويل الصوت

> إن تمتلك صوتك لتتبع صوت شخص آخر لتقرأ نصك. سيتم تحويل الصوت في الوقت الذي يتم فيه حفظ ما تقولينه.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## المشكلة

في عام 2026، تمت إعداد مقطع صوتي لمدة 5 ثوانٍ لتكون مستخدمًا لـ "GPU" لتحقيق نسخة عالية الجودة لأي صوت. ElevenLabs、F5-TTS、OpenVoice v2、VoiceBox قد قدم نسخة صفر إطلاق أو قليل إطلاق. هذه التقنية هي إنجيل: التسجيل التسويقي والتسويق، والمساعدة في الصوت، وهي أيضا سلاح:

مهمتين متعلقة:

- **Voice cloning（TTS 侧）：**النص + 5 ثانية صوت مرجع → صوت الصوت
- **Voice conversion（speech 侧）：**الصوت المصدر ((A 说 X) + صوت مرجعية B → صوت B 说 X

كلتا الحالتين تفرز شكل الموجة إلى محتوى المتحدث، وترجمة أخرى، وتقاسم محتوى مصدر واحد مع مصدر آخر.

يجب أن تلبي هذه القيود الرئيسية عندما تنشر عام 2026:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**أنبوبك يجب أن يخرج علامة مياه لا يمكن سماعها، ومع ذلك رفضت نسخة من الموافقة

## المفهوم

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**سوف تقوم بتقديم مقطع 5 ثواني إلى نموذج تم تدريبه من قبل آلاف المتحدثين.

المستخدم:F5-TTS(2024)、TTS الخاص بك(2022)、XTTS v2(2024)、OpenVoice v2(2024)。

**Few-shot fine-tuning。**录制目标声音的 5-30 分钟音频──对基模型 进行一小时 LoRA fine-tune──质量会从还行跃升到难以区分──Coqui 和 ElevenLabs 都支持这种模式;社区也将它用于F5-TTS──

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (على سبيل المثال، المواصفات المرنة المرنة، والPPGs) ، ثم باستخدام المتحدث المستهدف تضمين 重新合成──对语言 和口音 更稳健──KNN-VC(2023)、Diff-HierVC(2023) استخدام هذه الطريقة──
- **Disentanglement。**訓練一個自動編碼,在瓶頸的隱藏空間中分离內容、音箱 和 prosody──推理時替代音箱嵌入──質量較低但更快──AutoVC(2019)、VITS-VC 變體使用此方法──

**基于 Neural codec 的 cloning（2024+）。**وال-إيه وال-إيه 2٬الطبيعي 3٬صوت صندوق  سوف نرى الصوت 视为来自SoundStream / EnCodec الاختراقات الارقام، في الارقام الارقام الارقام

### 伦理部分، ليس إضافية

**Watermarking。**PerTh (Perth) و SilentCipher (SilencCipher) (Perth)) (Perth) و SilentCipher) (Perth) (Perth) و SilentCipher) (Perth) (Perth) و SilentCipher) (Perth) (Perth) و SilentCipher) (Perth) (Perth) و SilentCipher) (Perth) (Perth) و SilentCipher) (Perth) (Perth) و SilentCipher) (Perth) (Perth) و Perth) (Perth) (Perth) و (Perth) و (Perth) و (Silencipher) (Perth) (Perth) (Perth) (Perth) و Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth) (Perth)) (Perth) (Perth) (Perth)) (Perth) (Perth)) (Perth) (Perth)) (Perth) (Perth)) (Perth) (Perth)) (Perth)) (Perth)) (Perth)) (perth) (perth) (perth)) (perth)) (perth)) (perth) (perth)) (perth)) (perth) (perth)) (perth) (perth)) (perth)) (perth) (perth)) (perth)) (perth) (perth)) (perth) (perth)) (perth) (perth)) (perth) (perth) (perth))) (perth) ().) ().) ().) ().) ().) ().) ().) ().) (). ().) (). (). ().) (). (). ().) (). (). (). ().) (). ().) (). (). ().) (). (). ().) (). (

**Consent gates。**يجب أن يتم استخدام كل إنتاج مستخدم مع سجل موافقة يمكن التحقق من الاختيار.

**Detection。**AASIST、RawNet2 和 Wav2Vec2-AASIST 都提供 مفشّر──ASVspoof 2025 challenge 发布的结果显示,state-of-the-art detectors 针对ElevenLabs、VALL-E 2 和 Bark 输出 EER为 0.82.3%──

### الأرقام (١٢٢٦)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0.70 بالنسبة لمعظم المستمعين عادة ما يكون من الصعب التمييز بين الصوت المستهدف.


```figure
sp-voice-factorize
```

## بناءها

### الخطوة الأولى: استخدام التعرف-التوليف 分解(`main.py`(مظهر رمز فقط)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

مفهوم بسيط جدا، والتحقيق المشكك الرئيسي هو`tts_model`ومدفوع المتكبرين 中。

### الخطوة الثانية: استخدم F5-TTS لتصنع نسخة صفر إطلاق

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

النص المرجعي يجب أن يتوافق تماما مع الصوت ؛ عدم التوافق سوف يفسد التنظيم

### الخطوة 3: استخدام KNN-VC القيام بتحويل الصوت

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行 WavLM، لـ مصدر مع مجموعة الهدف 提取 لكل إطار من إضافة، ثم سوف كل إطار مصدر بدل لجمعية أقرب الجار في وسط المجموعة── غير المعايير طريقة، استخدام دقيقة واحدة من خطاب الهدف 即可工作──

### الخطوة الرابعة: 嵌入 watermark

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

حوالي 32 بتات الحمل المفيد، في MP3 إعادة تشفير و ضجيج خفيف  بعد لا يزال قابل للتحقق.

### الخطوة 5: بوابة الموافقة

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## استخدمها

2026 سنة:

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## الفخاخ

- **Reference transcript 未对齐。**F5-TTS 和类似模型要求参考文本与参考音频 完全匹配,包括标点──
- **Reference 有混响。**"إيكو" ستدمير النسخة "بمدى قريب"
- **情绪不匹配。**                                                                                                                                                                                                                                                             
- **Language leakage。**الكلونات الناطقة باللغة الإنجليزية 后让模型说法语,通常仍会带着口音; استخدام النماذج متعددة اللغات XTTS、VALL-E X)
- **没有 watermark。**اعتبارا من 2026، في الاتحاد الأوروبي لا يمكن إصدارها بشكل قانوني.

## أرسله

保存为 `outputs/skill-voice-cloner.md` تصميم بوابة مع موافقة + علامة مياه + هدف جودة من النسخ أو أنابيب التحويل‬

## التمارين

1. **Easy。**运行 `code/main.py`△ من خلال حساب المتحدثين 在 swap 前后的kosine,演示 المتحدثين-إدغام تبادل‬
2. **Medium。**استخدم OpenVoice v2 النسخة صوتك الخاص.
3. **Hard。**على 20 نسخة  تطبيق SilentCipher علامة مياه، سوف يتمكن من خلال 128 كيبس MP3 ترميز+ترميز، إعادة الاختبار الحمل المفيد.

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## المزيد من القراءة

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) إستنساخ SOTA مفتوح المصدر صفر إطلاقها
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)和 [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) TTS عصبي- كوديك
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879)  تحويل الصوت على أساس التفريق
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975)  على أساس الاستعراض
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) 生产可用32 بت صوت علامة مياه
- [ASVspoof 2025 results](https://www.asvspoof.org/) كشف وترابط السلاح،2026
