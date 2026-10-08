# Modelos de audio-idioma  Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio

> Los modelos de audio-idioma de 2026 pueden ser analizados en el lenguaje de voz + 环境声音 + 音乐. Qwen2.5-Omni-7B en MMAU-Pro alcanza el GPT-4o Audio 水平──Audio Flamingo Next en LongAudioBench superior a Gemini 2.5 Pro── la diferencia entre el código abierto y el código cerrado ha desaparecido básicamente, excepto en las tareas de audio múltiples, en esta clase de tareas todos los modelos se acercan a un nivel de coincidencia──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

##  problemas

Tienes 5 segundos de voz: perro grita, alguien grita "¡para!", y luego está en silencio.

- **转写。**"Dice qué?" Es el ámbito de la RAS.
- **语义推理。**¿Este hombre es peligroso? Necesita un entendimiento conjunto.
- **音乐推理。**"¿Qué instrumentos están tocando la melodía?"
- **长音频检索。**"En esta sesión de 90 minutos, ¿dónde explicó el profesor el Descenso Gradiente?"

Un modelo que puede responder a todas estas preguntas con el mismo prompt es**audio-language model**(LALM / ALM) ⋅ es diferente de pura ASR:LALMs 输出自由形式的自然语言答案, no sólo una transcripción ⋅

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### 3 componentes

Cada LAM de 2026 tiene la misma estructura:

1. **Audio encoder.**Encodrador de susurros · BEATs · CLAP · WavLM · 或每个模型自定义的编码──
2. **Projector.**Lineal o MLP,把 audio-encoder características 桥接到 LLM de Token Embedding 空间。
3. **LLM.**基于 Llama / Qwen / Gemma 的解码器──接收交错的文本 + audio tokens;生成文本──

训练:

- **Stage 1.**结 codificador + LLM; sólo en ASR / subtítulo 数据上训练 प्रोजेctor。
- **Stage 2.**En instrucción-seguida 音频任务上进行 full / LoRA fine-tune ((QA、razón、comprensión musical) ]]
- **Stage 3（可选）。**Voz en / voz fuera 会添加语音解码器──Qwen2.5-Omni 和 AF3-Chat 会这样做──

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

### Indicador de referencia 现实检查(2026)

**MMAU-Pro.**1800 个 QA 对, 覆盖语音 /音声 /音乐 / mixed──包含多音频子集──

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**4 選 1 選多題的隨機概率 = 25%; la mayoría de los modelos están cerca de este nivel.

### LALMs en 2026 años adecuados para uso en

- **呼叫中心录音的合规审计。**"¿Se ha mencionado la declaración necesaria?"
- **无障碍。**向聋人用户描述声音事件 (((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文──
- **播客 / 会议章节划分。**语义摘要, no sólo el orador se vuelve.
- **音乐目录分析。**"Encuentra todo lo que hay en la sección B"

###  Ellos no se adaptan en donde

- 细粒度乐理 (低于和弦级)
- Las personas que se encuentran en el lugar de trabajo en el lugar de trabajo se encuentran en el lugar de trabajo en el lugar de trabajo.
- Múlti-audio comparado 22-26% Sólo comparado con el tiempo
- 实时流式推理 (la mayoría son inferencias de lote de línea)


```figure
v4-alm-tokens
```

## Construirlo

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

### 步骤 2: proyector 模式

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

Así es. El proyector suele ser de 1-3 capas lineales. En ASR para la formación de la técnica de audio, es la tarea de pretexto de la etapa 1.

### 步骤 3: Indicador de referencia MMAU / LongAudioBench

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

Se trata de un proyecto de investigación que se desarrolla en el ámbito de la salud y la salud.

## Usalo

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## 陷

- **过度信任 multi-audio。**Si tu tarea necesita "cuál clip tiene X", el rendimiento de casi cualquier nivel es real.
- **长音频退化。**超 10 分钟后, la mayoría de los modelos de la atribución de los oradores 会崩──先日記(LECCIÓN 6),再总结──
- **沉默上的幻觉。**Usar el código de susurros de LALMs 会继承同类 estilo de susurros 问题──使用 VAD-gate──
- **Benchmark cherry-picking。**Las publicaciones de los blogs de los vendedores 会突出最佳类别──自运行 MMAU-Pro multi-audio 子集──

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-alm-picker.md`◊为给定的音频理解任务选择 LALM + subconjunto de referencia + modalidad de salida (text vs speech) ◊

##  ejercicios

1. **简单。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`,查看一个玩具投影机模式 + 假 LALM 对 (audio-embedding, tokens de texto) → tokens de salida 的路由──
2. **中等。**En 100 artículos de discurso MMAU-Pro, por ejemplo, en Qwen2.5-Omni-7B 打分―― con el papel 报告的数字比较――
3. **困难。**Construir una línea de base de captación de audio mínima: BEATs encoder + proyector de 2 capas + congelado Llama-3.2-1B── sólo en AudioCaps  上细调投影机──与Clotho-AQA 上的 SALMONN 比较──

## 关键术语: "El hombre es un hombre"

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
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) habla-en-habla-en-saída
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) abre audio largo 领先者──
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) LongAudioBench SOTA。
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) doble codificador 先驱。
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) 2026 实时排名──
