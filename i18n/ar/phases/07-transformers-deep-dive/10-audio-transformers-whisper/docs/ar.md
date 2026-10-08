# محولات الصوت  هيكل التهوس

> الصوت هو التردد مع مرور الوقت  تغير تشكيل الصور。 التهمس هو واحد يأكل المجموعات الضوئية 并吐回文字的 ViT。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## المشكلة

في فيسبر ((OpenAI,Radford et al. 2022) قبل، الحالة من الفن التعرف الآلي على الكلام ((ASR) يعني wav2vec 2.0 和 HuBERTمصدرات الميزات ذاتية الإشراف بالإضافة إلى رأس دقيقة تدفقها──质量高, ولكن أنابيب البيانات 昂贵,而且对域 脆弱──多语言语音识别 需要按语言家族 使用不同模型──

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

1. **Train on everything。**680,000 ساعة من الإنترنت تم الحصول عليها من الصوت الضعيف، يغطي 97 لغة.
2. **Multi-task single model。**واحد مُعبر من خلال رموز المهمة 联合训练 نقل 翻译 检测语音活动 语言 ID 和时间打印──
3. **标准 encoder-decoder transformer。**رمز التشفير استخدام المخططات المتطرفة للطبقات المرسومة──مُشردة باستخدام طريقة تحكمية  طريقة إنتاج رموز نصية──لا vocoder، لا CTC، لا HMM──

结果:Whisper large-v3 على الاهتزازات والضوضاء، فضلا عن عدم وجود بيانات معينة مع علامات 语言都很稳健── بحلول عام 2026، فإنه أصبح كل مساعد صوت مفتوح المصدر ومعظم مساعدات الصوت التجارية المتخلفة في نهاية الخطاب الأمامي──

## المفهوم

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### الخطوة 1  إعادة العينة + النافذة

الصوت 为 16 kHz──clip/pad 到 30 秒──计算日志-邮件谱谱:80 个 melbins,10 ms step → 约3000框 × 80 ميزة──这是Whisper 看到的输入图片──

### الخطوة 2  جذع التخويف

طبقتين من "كونف1دي"، "النيز 3′′، "الخطوة 2" ، سيقلل 3000 إطار إلى 1500′′، في حالة عدم زيادة عدد كبير من المعلمات، سيقلل طول التسلسل إلى النصف".

### الخطوة 3  مُشفّر

واحد 24 طبقة ((كبير  إصدار) محفوفة تحويلات، معالجة 1500 个 خطوات زمنية── تشفير الموقف السينوسيدالي٬ الاهتمام الذاتي٬ GELU FFN── توليد 1500 × 1,280 حالة مخفية──

### الخطوة 4  المفكّر

واحد من 24 طبقة مبدع المعدل تعريفات. انها من كلمات BPE داخل إشارات تصرفية. هذا الكلمات هي مجموعة كبيرة من كلمات GPT-2، ومضافة إلى ذلك يحتوي على عدد قليل من الوهام الخاصة الصوتية الخاصة.

### الخطوة 5  رموز المهمة

إفتح رمز التحكم، أخبر الموديل ماذا يفعل:

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

أو

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按这种约定训练的──你通过前 控制任务──这相当于2026年指令调整,只是应用在语音上──

### الخطوة 6  الخروج

البحث عن الشعاع ((اعرض 5)配合 السفر السجل-بص`<|notimestamps|>`الـ "أوين" لا يوجد، و "أوين" سيتم تحديدها كل 0.02 ثانية

### أحجام التهوس

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

الكبير-v3-توربو(2024) سوف يقوم بتشخيص المعدات من 32 طبقة  خفض إلى 4。解码 سرعتها بسرعة 8×،WER 回退小于 1 个点── هذا التشخيص سرعة إفراج العبء 正是 Whisper-turbo 在 2026 سنة تصبح وكلاء صوت في الوقت الحقيقي 默认选择的原因──

### * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

-                                                                                                                                                                                                                                                               
- 30 秒窗口是固定的──现代 wrappers(`faster-whisper`.`WhisperX`) من خلال VAD + التداخل 补上流量──
- لا يوجد تشكيل خارجي، لا يدعم أكثر من 30 سنة من السياق الطويل الأشكال.

### 2026 المشهد

| Task | Model | Notes |
|------|-------|-------|
| English ASR | Whisper-turbo, Moonshine | Moonshine 在 edge 上快 4× |
| Multilingual ASR | Whisper-large-v3 | 97 种语言 |
| Streaming ASR | faster-whisper + VAD | 可达到 150 ms latency targets |
| TTS | Piper, XTTS-v2, Kokoro | Encoder-decoder pattern，但形状类似 Whisper |
| Audio + language | AudioLM, SeamlessM4T | Text tokens + audio tokens 在一个 transformer 中 |


```figure
n5-mel-decode
```

## بناءها

见 `code/main.py` نحن لا نتدرب على التهديدات التهريبية  نحن نبني خط أنابيب لوج-ميل + صيغة عرضية لمؤشرات المهام  هذه هي الجزء الذي تتمكن من التواصل معه في الإنتاج

### الخطوة الأولى: قم بتجميع الصوت

تكوين معدل أخذ 16 كيلوهرتز، وتردد 440 هرتز، وتطول 1 ثانية من موجة الصين 16.000 عينات.

### الخطوة الثانية: طيف الملفات المرجعية

完整 mel spectrogram 需要 FFT──我们做一个简化框架+每框架能量 版本,用于展示管道,而不需要 `librosa`:

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

الإطار = 25 ms، التسوق = 10 ms── مع تصفير النافذة 匹配── في كل إطار الطاقة في تعليمي بدلا من المبلات──

### الخطوة الثالثة: إرسال إلى 30 ثانية

تصمّم 始终处理 30 秒 chunks──将光谱片

### الخطوة الرابعة: قم بتصميم رموز سريعة

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

هذا هو سطح التحكم الكامل في المهام.

## استخدمها

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

أكثر سريعة

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- استخدام نموذج للعمل على ASR متعددة اللغات
- على 杂、多样音频的稳健转录──
- البحث / النموذج الأول ASR最快起点──

**何时选择别的方案：**

- تحريك ضوء القمر في نفس الجودة تحت أفضل من التهوس
- 需要 <200 ms of real-time conversational AI使用专用流媒体 ASR──
- مذكرات المتحدثينهتز 不做這個;接上 pyannote。

## أرسله

见 `outputs/skill-asr-configurator.md`◊ هذه المهارة 会为新语音应用 选择ASR模型、解码参数 和预处理管道──

## التمارين

1. **Easy。**运行 `code/main.py` تأكيد 16 كيلوهرتز  10 ميس ارتفاع عدد إطار الإشارة 1 ثانية  حوالي 100 إطار  30 ثانية  حوالي 3000 إطار 
2. **Medium。**استخدام `numpy.fft`构建完整的日志邮件谱谱仪──验证 80 个邮箱与 `librosa.feature.melspectrogram(n_mels=80)`في عدد الأخطاء في التطابق
3. **Hard。**实现 streaming inference:将音频 切成 10 s windows,2 s overlap,对每块 运行 语,再合并转录──测量与 5 分钟播客样本 单次处理相比的字错率──

## الشروط الرئيسية

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mel spectrogram | “Audio image” | 2D representation：一个轴是 frequency bins，另一个轴是 time frames；每个 cell 是 log-scaled energy。 |
| Log-mel | “Whisper 看到的东西” | 经过 log 的 Mel spectrogram；近似人类对 loudness 的感知。 |
| Frame | “一个 time slice” | 25 ms 的 samples window；以 10 ms stride overlap。 |
| Task token | “speech 的 prompt prefix” | decoder prompt 中类似 `<\|transcribe\|>` / `<\|translate\|>` 的 special tokens。 |
| Voice activity detection (VAD) | “找到 speech” | 在 ASR 前移除 silence 的 gate；大幅降低 cost。 |
| CTC | “Connectionist Temporal Classification” | 用于 alignment-free training 的经典 ASR loss；Whisper 不使用它。 |
| Whisper-turbo | “小 decoder，完整 encoder” | large-v3 encoder + 4-layer decoder；解码快 8×。 |
| Faster-whisper | “生产 wrapper” | CTranslate2 reimplementation；int8 quantization；比 OpenAI reference 快 4×。 |

## المزيد من القراءة

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356)ورقة فسخة
- [OpenAI Whisper repo](https://github.com/openai/whisper) رمز المرجعية + أوزان النموذج。阅读 `whisper/model.py`يمكن أن ترى في حوالي 400 صفوف من فوق إلى أسفل جذع Conv1D + مرموز + مرموز
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py)الخطوات 56 中描述的束搜索 + 任务标记逻辑 在这里;500 行,完全可读──
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) سابقة؛ في بعض المواقف لا تزال ميزات SOTA
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) غلاف الإنتاج،比 مرجع 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 سنة حافة صديقة ASR، شكل يشبه همس ولكن更小──
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) وصفة تحسينات القنوني، تتضمن معالجة المقبلات من طيف المياه و معالجة علامات الزمنية
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现 ((مُرمّد، مُمَرّد، تَصَلُّف، تَصَلُّف) ، مع بيان هيكلة هذا الدروس على الصفحة
