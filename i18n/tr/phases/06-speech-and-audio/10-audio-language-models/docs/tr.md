# Ses-Dil Modeller  Qwen2.5-Omni, Ses Flamingo, GPT-4o Ses

> 2026 yılının ses dili modelleri, ses + 环境音 + 音乐 için düşünülebilir. Qwen2.5-Omni-7B MMAU-Pro'da GPT-4o Audio 水平に ulaşır.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

## 问题

5 saniye sesli: köpek çığlık atıyor, birisi "dur!" diye bağırıyor, sonra sessizliğe giriyor.

- **转写。**"Ne dedi?" bu ASR'in alanı.
- **语义推理。**"Bu adam tehlikeli mi?"                                                                                                                                                                                                                                                            
- **音乐推理。**"Ne aletler melodi çalıyor?"
- **长音频检索。**"Bu 90 dakika konuşma sırasında, öğretmen nerede Gradient Descent'i açıkladı?"

Bir de aynı soruyu cevaplayabilecek bir model.**audio-language model**(LALM / ALM) :LALM'lardan farklıdır 输出自由形式的自然语言答案, sadece bir transkript değil

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### Üç bileşen şablon

2026'da her bir LALM'de aynı yapı vardır:

1. **Audio encoder.**Şapış kodlayıcı · BEATs · CLAP · WavLM · 或每个模型自定义的编码器──
2. **Projector.**Linear veya MLP,把 ses kodlayıcı özellikleri 桥接到 LLM'nın Token Embedding 空间。
3. **LLM.**Llama / Qwen / Gemma'nın dekodörüne dayanıyor.

訓練:

- **Stage 1.**结 kodlayıcı + LLM; sadece ASR / başlıklı sayı üzerinde eğitim projeksiyonu
- **Stage 2.**Bu yüzden, bu programın tümüyle uyumlu olarak yapılır.
- **Stage 3（可选）。**Ses içi / ses çıkışı 会添加语音解码器──Qwen2.5-Omni 和 AF3-Chat 会这样做──

### 2026 model harita

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

### Benchmark 现实检查(2026)

**MMAU-Pro.**1800 个 QA 对,覆盖语音音乐音乐 mixed 包含多音子集──

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**4 選 1 多選題の随機概率 = 25%; çoğu model bu seviyede bulunmaktadır.

### LALM'ler 2026 yılında nerede uygulanabilir

- **呼叫中心录音的合规审计。**"Sitting Seat'ın gerekli açıklamaları mı vardı?"
- **无障碍。**Kulaklı kullanıcıların sesli olayları anlatması
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文。
- **播客 / 会议章节划分。**语义摘要, sadece konuşmacı döner değil.
- **音乐目录分析。**"B bölümlü tüm şarkıları bul".

### Onlar da kullanımı için uygun değil.

- 细粒度乐理 (→ ∞)
- Uzun sohbetler yapılması için konuşmacıların katılımcılık önerileri
- Çok sesli bir oranla ((22-26% sadece bir oranla)
- 实时流式推理 (Büyük çoğunluk offline parti sonucu)


```figure
v4-alm-tokens
```

## Yapın onu.

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

### 步骤 2: Projector 模式

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

İşte böyle. Projector genellikle 1-3 線性層lerdir.

### 步骤 3: Benchmark MMAU / LongAudioBench

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

Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm: Bölüm:

## Kullan

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## 陷

- **过度信任 multi-audio。**Eğer göreviniz "Hat clip has X" gerektiriyorsa, hemen hemen her yere doğru performans gerçek bir performansdır.
- **长音频退化。**超過 10 分钟後, çoğu modelin konuşmacı atributı 会崩──先日記化(Lesson 6),再总结──
- **沉默上的幻觉。**Sıfırlama biçimindeki 问题──使用 VAD-gate──
- **Benchmark cherry-picking。**Satıcı blog yayınları 会突出最佳类别──自己运行 MMAU-Pro çok sesli 子集──

## - Söyle.

保存为 `outputs/skill-alm-picker.md`◊为给定的音频理解任务选择 LALM + referans alt kümesi + çıkış-modalitesi(söz karşılığı metin)。

## 练习

1. **简单。**运行  İşlem`code/main.py`,查看一个玩具投影器模式 + 假 LALM 对 (audio-embedding, text-tokens) → output tokens 的路由──
2. **中等。**100 MMAU-Pro konuşma öğesi üzerinde Qwen2.5 Omni-7B 打分── rapor 紙 報告の数字比較──
3. **困难。**构建一个最小音标基线:BEATs encoder + 2层投影机 + dondurulmuş Llama-3.2-1B──只在 AudioCaps 上细调投影机──与Clotho-AQA 上的 SALMONN 比较──

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

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) 参考架构──
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) konuşma-söz-söz-söz-söz-söz-söz
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) uzun sesli açı 领先者──
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) LongAudioBench SOTA。
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) çift kodlayıcı 先驱──
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/)2026 实时排名──
