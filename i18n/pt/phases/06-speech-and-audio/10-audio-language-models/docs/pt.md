# Modelos de áudio-língua  Qwen2.5-Omni, Áudio Flamingo, GPT-4o Áudio

> Os modelos de áudio-língua de 2026 podem ser analisados em relação ao som + áudio ambiental + música. Qwen2.5-Omni-7B em MMAU-Pro alcança o GPT-4o Áudio 水平──Audio Flamingo Próximo em LongAudioBench superior a Gemini 2.5 Pro── a diferença entre o código aberto e o código fechado já desapareceu, exceto para tarefas de áudio múltipla, neste tipo de tarefas todos os modelos estão perto de um nível de aceleração─

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

## 问题

Você tem 5 segundos de conversa: "Cão grita, alguém grita "pare!", e depois fica em silêncio.

- **转写。**"Dize o quê?" É o campo da RAS.
- **语义推理。**"Este homem é perigoso?"
- **音乐推理。**"Que instrumentos estão a tocar melodia?"
- **长音频检索。**"Neste discurso de 90 minutos, onde o professor explicou a descida gradual?"

Um modelo capaz de responder a todas estas perguntas com o mesmo prompt é:**audio-language model**(LALM / ALM) ⋅ É diferente de pura ASR:LALMs 输出自由形式的自然语言答案, não é apenas transcrição ⋅

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### 3 componentes

Cada LALM de 2026 tem a mesma estrutura:

1. **Audio encoder.**Encoder de sussurros · BEATs · CLAP · WavLM · 或每个模型自定义的编码──
2. **Projector.**Linear ou MLP,把 áudio-encoder recursos 桥接到 LLM's Token Embedding 空间。
3. **LLM.**Baseado em Llama / Qwen / Gemma de decodificador──接收交错的文本 + áudio tokens;生成文本──

訓練:

- **Stage 1.**结 encoder + LLM; apenas em ASR / subtítulos dados sobre treinamento projetoor。
- **Stage 2.**Em instrução-seguindo 音频任务上进行 full / LoRA fine-tune ((QA、razão、compreensão musical) ]]
- **Stage 3（可选）。**Voz-in / voz-out 会添加语音解码器──Qwen2.5-Omni 和 AF3-Chat 会这样做──

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

### Indicador de referência 现实检查(2026)

**MMAU-Pro.**1800 个 QA 对, 覆盖语音 /音音 /音乐 / mixed──包含多音子集──

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**4 選 1 多選題的随机概率 = 25%; a maioria dos modelos está próximo deste nível.

### LALMs em 2026 ano adequado para uso em

- **呼叫中心录音的合规审计。**"Sitting chair é mencionado o necessário declaração?"
- **无障碍。**向聋人用户描述声音事件 (~ não apenas transcrição) 〜
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文──
- **播客 / 会议章节划分。**语义摘要, não apenas o orador se vira.
- **音乐目录分析。**"Find out everything with a B-section 转调的曲目──"

### Não se encaixam no que é.

- 细粒度乐理 (→ Nível de Coração)
- O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é?
- Multimúdia comparativo ((22-26% apenas comparado com
- 实时流式推理 (a maioria é inferência de lote offline)


```figure
v4-alm-tokens
```

## Construí-lo

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

### 步骤 2: projector 模式

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

É assim que o projeto geralmente é de 1-3 camadas lineares.

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

分別報告每个类别(discurso / som / música / multi-áudio) ――聚合数字会掩盖模型在哪里失败──

## Use-o

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## 陷

- **过度信任 multi-audio。**Se a sua missão precisa de "qual é o clip tem X", o desempenho de um plano de velocidade é real.
- **长音频退化。**超過10分钟後, maioria dos modelos de atribuição do orador 会崩──先日記ze(Lessão 6),再总结──
- **沉默上的幻觉。**Use Whisper encoder of LALMs 会继承同类 Whisper-style 问题──使用 VAD-gate──
- **Benchmark cherry-picking。**Postos de blog do vendedor 会突出最佳类别──自己运行 MMAU-Pro multi-audio 子集──

## Entrega-o

保存为 `outputs/skill-alm-picker.md`◊为给定的音频理解任务选择 LALM + subconjunto de referência + modalidade de saída (text vs speech) ◊

## 练习

1. **简单。**运行 `code/main.py`,查看一个玩具投影器模式 + 假 LALM 对 (audio-embedding, text-tokens) → saída de tokens 的路由──
2. **中等。**Em 100 MMAU-Pro artigos de discurso, acima para Qwen2.5-Omni-7B 打分── com o papel 报告的数字比较──
3. **困难。**Construir uma linha de base mínima de captura de áudio: BEATs encoder + projeto de 2 camadas + congelado Llama-3.2-1B── apenas em AudioCaps  上细调投影机──与Clotho-AQA 上的 SALMONN 比较──

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
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) fala-em-fala-out。
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) aberto ao longo do áudio 领先者──
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) LongAudioBench SOTA。
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) duplo-encodador 先驱。
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) 2026 实时排名──
