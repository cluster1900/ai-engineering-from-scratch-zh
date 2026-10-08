# Modèles audio-langue  Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio

> Les modèles audio-linguistiques de 2026 peuvent être analysés pour le langage vocable + 环境声音 + 音乐. Qwen2.5-Omni-7B atteint le GPT-4o Audio 水平.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

##  problématique

Tu as 5 secondes de silence. Les questions utiles vont sur plusieurs dimensions.

- **转写。**"Dié quoi ?" C'est le domaine de l'ASR.
- **语义推理。**"C'est dangereux ?" Il faut comprendre le chien qui crie.
- **音乐推理。**"Quels instruments jouent la mélodie?"
- **长音频检索。**" Dans cette séance de 90 minutes, où le professeur a-t-il expliqué la descente graduelle ? "

Un modèle qui peut répondre à toutes ces questions avec le même prompt est:**audio-language model**(LALM / ALM) ⋅ Il est différent de pur ASR:LALMs 输出自由形式的自然语言答案, et pas seulement de la transcription ⋅

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### 3 pièces

Chaque LALM de 2026 aura la même structure:

1. **Audio encoder.**Encodeur de chuchotement · BEATs · CLAP · WavLM · 或每个模型自定义的编码──
2. **Projector.**Linear ou MLP, 桥接到 LLM's Token Embedding 空间──
3. **LLM.**Basé sur le décodeur de Llama / Qwen / Gemma.

训练:

- **Stage 1.**结 encodeur + LLM; seulement dans ASR / sous-titres 数据上训练投影机。
- **Stage 2.**Dans l'instruction suivante 音频任务上进行 full / LoRA fine-tune ((QA、réasonnement、compréhension musicale) ]]
- **Stage 3（可选）。**Voir-en / voix-out 会添加语音解码器──Qwen2.5-Omni 和 AF3-Chat 会这样做──

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

### Indice de référence 现实检查(2026)

**MMAU-Pro.**1800 个 QA 对, couvrir le discours / son / musique / mélangé──包含多音子集──

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**4 選 1 選多題的随机概率 = 25%; la plupart des modèles sont situés à ce niveau.

### LALMs en 2026 année adapté à l'emploi

- **呼叫中心录音的合规审计。**"Le siège est-il mentionné dans les déclarations nécessaires?"
- **无障碍。**À l'aide de l'écriture de l'article suivant:
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文──
- **播客 / 会议章节划分。**语义摘要, et non seulement le locuteur se tourne.
- **音乐目录分析。**" Trouver tout ce qui a une section B "

### Ils ne sont pas adaptés à l'usage.

- 细粒度乐理 (→ Le niveau de la ligne)
- Les discussions ont été menées à travers le monde entier.
- Comparison audio multi-comparison (22-26% seulement comparé à un niveau plus élevé)
- La plupart sont des déductions de lot hors ligne)


```figure
v4-alm-tokens
```

## - Je le construis.

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

### 步骤 2: projetteur 模式

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

C'est ainsi que le projecteur est généralement en 1 à 3 couches linéaires.

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

Résumé: Le groupe de travail de la société de l'information et de l'information a été créé en décembre 2009.

## Utilisez-le

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## La trappe

- **过度信任 multi-audio。**Si votre mission nécessite " quel clip a X ", la performance de l'horizon est réelle.
- **长音频退化。**超过 10 分钟后, la plupart des modèles de l'attribution des orateurs 会崩──先日記ze(L'enseignement 6),再总结──
- **沉默上的幻觉。**Utilisation de l'encodeur Whisper de LALMs 会继承同类 Whisper-style 问题──使用 VAD-gate──
- **Benchmark cherry-picking。**Les articles de blog des vendeurs seront classés parmi les meilleurs.

## Je le livre.

保存为 `outputs/skill-alm-picker.md`◊为给定的音频理解任务选择 LALM + référence sous-ensemble + sortie-modalité(text vs speech)。

## 练习

1. **简单。**运行  référencement`code/main.py`,查看一个玩具投影机模式 + 假 LALM 对 (audio-embedding, text-tokens) → sortie des jetons 的路由──
2. **中等。**Dans 100 articles de discours MMAU-Pro, donnez à Qwen2.5-Omni-7B 打分── avec le rapport 报告的数字比较──
3. **困难。**Construire une base de sous-titres audio minimale:BEATs encodeur + projecteur à 2 couches + Llama-3.2-1B gelé── seulement dans AudioCaps  上 fine-tune projecteur── comparer avec Clotho-AQA 上的 SALMONN──

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
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) discours dans le discours-out
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) ouvrir un long-audio 领先者。
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) LongAudioBench SOTA。
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) double encodeur 先驱。
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) 2026 实时排名──
