# النماذج الصوتية للغة  Qwen2.5-Omni, الصوت فلامينغو, GPT-4o الصوت

> يمكن إجراء التفكير في نماذج اللغة الصوتية لعام 2026 على صوت + 环境声音 + 音乐. Qwen2.5-Omni-7B في MMAU-Pro يصل إلى GPT-4o Audio 水平── آودي فلامينغو التالي في LongAudioBench يزيد على Gemini 2.5 Pro── الفجوة بين المفتوح والغلق قد اختفت بشكل أساسي باستثناء المهام متعددة الصوتية، في هذه الفئة المهام جميع نماذج تقترب من مستوى السرعة‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

## 问题

لديك 5 ثوانات الصوت: الكلب يصرخ، شخص ما يصرخ "توقف!" ثم الصمت.

- **转写。**"قوله ماذا؟" هذا مجال "المرضى العصبي"
- **语义推理。**"هل هذا الرجل خطير؟"
- **音乐推理。**"أي أدوات تعزف المودود؟ "
- **长音频检索。**"في هذه المحادثة التي استمرت 90 دقيقة، أين قام المعلم بتفسير "النزول المتدريج" ؟

نموذج واحد يمكن أن تستخدم نفس المفاجأة للإجابة على كل هذه الأسئلة هو**audio-language model**(LALM / ALM) ∼ انها تختلف عن مجرد ASR:LALMs 输出自由形式的自然语言答案, وليس مجرد النسخة‬

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### ثلاثة أجزاء

كل مدينة للام في عام 2026 لديها نفس الهيكل

1. **Audio encoder.**مُشفّر الشمس · BEATs · CLAP · WavLM · أو كل نموذج تعريف ذاتي
2. **Projector.**خطية أو MLP،把 صوتي-مخترع ميزات 桥接到 LLM 的 Token Embedding 空间──
3. **LLM.**基于 Llama / Qwen / Gemma 的解码器──接收交错的文本 + صوتي رموز؛生成文本──

التدريب:

- **Stage 1.**结 رمز + LLM; فقط في ASR / عنوانات 数据上训练投影器。
- **Stage 2.**في التدريس التابع 音频任务上 إجراء كامل / LoRA تحسين الموسيقى
- **Stage 3（可选）。**الصوت في / الصوت خارج 会添加 كلمة فك الكلمات.

### 2026 模型地图

| Model | Backbone | Audio encoder | Output modality | Access |
|-------|----------|---------------|-----------------|--------|
| Qwen2.5-Omni-7B | Qwen2.5-7B | Custom + Whisper | text + speech | Apache-2.0 |
| Qwen3-Omni | Qwen3 | Custom | text + speech | Apache-2.0 |
| Audio Flamingo 3 | Qwen2 | AF-CLAP | text | NVIDIA non-commercial |
| Audio Flamingo Next | Qwen2 | AF-CLAP v2 | text | NVIDIA non-commercial |
| SALMONN | Vicuna | Whisper + BEATs | text | Apache-2.0 |
| LTU / LTU-AS | Llama | CAV-MAE | text | Apache-2.0 |
| GAMA | Llama | AST + Q-Former | text | Apache-2.0 |
| Gemini 2.5 Flash/Pro (closed) | Gemini | proprietary | text + speech | API |
| GPT-4o Audio (closed) | GPT-4o | proprietary | text + speech | API |

### المرجعية 现实检查(2026)

**MMAU-Pro.**1800 个 QA 对, تغطي الخطاب / الصوت / الموسيقى / المختلطة.

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**احتمالية الاختيار في العديد من المواضيع = 25%؛ معظم النماذج تقع بالقرب من هذا المستوى.

### لالم في 2026 سنة مناسبة للعمل في

- **呼叫中心录音的合规审计。**"هل تم التعبير عن المواضيع الضرورية؟"
- **无障碍。**إلى أذكي المستخدم تصف صوت الأحداث (((不只是转写) 』
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文──
- **播客 / 会议章节划分。**语义摘要، وليس مجرد المتحدث يتحول
- **音乐目录分析。**"أبحث عن كل الموسيقى التي لديها قسم "ب"

### لا يُصالحك أيضاً

- 细粒度乐理 ((低于和弦层级)
- على المحادثة طويلة إجراءات مع الحديث شخص الانتماء التوجيهية ((أكثر من 10 دقيقة بعد إعادة التأثير)
- التقييمات المتعددة الصوتية (22-26% فقط مقارنة مع المعلومات)
- 实时流式推理 ((معظمها استنتاجات على الإنترنت)


```figure
v4-alm-tokens
```

## بناءها

### 步骤 1: 查询 Qwen2.5-Omni

```python
from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Omni-7B", torch_dtype="auto")

audio, sr = load_wav("clip.wav", sr=16000)
messages = [{
    "role": "user",
    "content": [
        {"type": "audio", "audio": audio},
        {"type": "text", "text": "What sounds do you hear, and what's happening?"},
    ],
}]
inputs = processor.apply_chat_template(messages, tokenize=True, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=200)
print(processor.decode(output[0], skip_special_tokens=True))
```

### 步骤 2: المُرَاكِب 模式

```python
import torch.nn as nn

class AudioProjector(nn.Module):
    def __init__(self, audio_dim=1280, llm_dim=4096):
        super().__init__()
        self.down = nn.Linear(audio_dim, llm_dim)
        self.act = nn.GELU()
        self.up = nn.Linear(llm_dim, llm_dim)

    def forward(self, audio_features):
        return self.up(self.act(self.down(audio_features)))
```

هذا هو السبب في أن المضرب عادة ما يكون 1-3 طبقات خطية.

### 步骤 3: مقياس MMAU / LongAudioBench

```python
from datasets import load_dataset
mmau = load_dataset("MMAU/MMAU-Pro")

correct = 0
for item in mmau["test"]:
    answer = call_model(item["audio"], item["question"], item["choices"])
    if answer == item["correct_choice"]:
        correct += 1
print(f"Accuracy: {correct / len(mmau['test']):.3f}")
```

分别报告每个类别(الحديث / الصوت / الموسيقى / متعددة الصوت) ――聚合数字会掩盖模型在哪里失败──

## استخدمها

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## فخ

- **过度信任 multi-audio。**إذا كانت مهمتك تتطلب "أي شريط لديه X"، فإن أداء مستوى قريب من أي وقت مضى هو حقيقي.
- **长音频退化。**超過 10 分钟 بعد، معظم النماذج من الخصبة المتحدث 会崩──先日化(درس 6),再总结──
- **沉默上的幻觉。**استخدام Whisper encoder ♂️ LALMs 会继承同类 النمط الوسوسم ♂️ ♂️ استخدام VAD-gate‬
- **Benchmark cherry-picking。**مشاركات المبيعات على المدونات 会突出最佳类别──自己运行 MMAU-Pro متعددة الصوت 子集──

## 交付 it

保存为 `outputs/skill-alm-picker.md`◊为给定的音频理解任务选择 LALM + مقياس الفرعية + الناتج-موضة(نص مقابل الكلام)。

## التدريب

1. **简单。**运行 `code/main.py`,查看一个玩具投影器模式 + 假 LALM 对 (مضمون الصوت، رموز النص) → رموز الخروج 的路由──
2. **中等。**في 100 من المواد المخطبة MMAU-Pro 上给 Qwen2.5-Omni-7B 打分――与纸 报告的数字比较――
3. **困难。**构建一个最小的音频标题基线:BEATs encoder + 2layer projector + frozen Llama-3.2-1B──只在 AudioCaps 上细调投影机──与Clotho-AQA 上的 SALMONN 比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| LALM | Audio ChatGPT | Audio encoder + projector + LLM decoder. |
| Projector | Adapter | 将音频特征映射到 LLM Embedding 空间的小型 MLP。 |
| MMAU | 这个 benchmark | 覆盖 speech、sound、music 的 10k audio-QA 对。 |
| MMAU-Pro | 更难的 MMAU | 1800 个 multi-audio / reasoning-heavy 问题。 |
| LongAudioBench | 长形式 eval | 带语义查询的多分钟片段。 |
| Voice-in / voice-out | Speech-native | 模型接收语音并输出语音，不绕经文本。 |

## 延伸阅读

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) 参考架构。
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) خطاب في خطاب خارج
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) افتتاح صوت طويل 领先者。
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) LongAudioBench SOTA。
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) مُرمّع مزدوج 先驱。
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) 2026 实时排名──
