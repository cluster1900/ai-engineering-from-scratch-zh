# Evaluación de audio  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布;;本课为每种音频任务命名 2026年的指标:ASR(WER、CER、RTFx) 、TTS(MOS、UTMOS、SECS、WER-on-ASR-round-trip) 、audiolingue(MMAU、LongAudioBench) 、音乐(FAD、CLAP) 以及说话人(EER) ∼ también se utiliza para la clasificación de comparaciones。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

##  problemas

Cada tarea de audio tiene varios indicadores, cada indicador mide diferentes dimensiones. Usando un indicador de error, se publicará un modelo en el panel de control que se ve muy bien, pero que se desempeña muy mal en el entorno de producción.

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

### Indicador de ASR

**WER (Word Error Rate)。** `(S + D + I) / N`◊评分前先转小写、 eliminar los puntos de referencia、 regularizar los números。`jiwer`O de la apertura de la`whisper_normalizer`◊&lt;5% = 朗读语音 alcanzar el nivel humano。

**CER (Character Error Rate)。**Para usar el lenguaje de la voz, el mandarín puede tener diferentes significados.

**RTFx (inverse real-time factor)。**Cada reloj de pared 秒处理的音频秒数──越高越好──Parakeet-TDT 达到3380×──Šipper-large-v3 约为 ~30×──

**First-token latency。**Desde el audio de la entrada hasta la primera transcripción del token 时间──对流 至关重要──Deepgram Nova-3:~150 ms──

### TTS

**MOS (Mean Opinion Score)。**1-5  的人工评分──黄金标准,但速度慢──每样本收集 20+ 听众,每样本 100+ 样本──

**UTMOS (2022-2026)。**MOS 预测器 训练得到的. 在标准基准上与人工MOS的相关性约为 ~0.9──F5-TTS:UTMOS 3.95; ground truth:4.08──

**SECS (Speaker Encoder Cosine Similarity)。**Utilizado para la clonación de voz. Referencia audio频与克隆输出之间的 ECAPA Embedding cosine.

**WER-on-ASR-round-trip。**En TTS 输出上运行 Whisper,并相对输入文本计算 WER──用于捕捉可理解度回归──2026 SOTA:&lt;2% CER──

**TTFA (time-to-first-audio)。**端到端延迟──Kokoro-82M: ~100 ms; F5-TTS: ~1 s──

### Cloning de voz 专用指标

**SECS + MOS + CER**Como tres grupos. Se dice que el sonido es natural, pero el habla no es natural.

### Verificación de altavoces

**EER (Equal Error Rate)。**Taxa de aceptación falsa 等等等 false rejection rate 的值──ECAPA 在 VoxCeleb1-O 上:0.87%──

**minDCF (min Detection Cost)。**En el punto de operación seleccionado (normalmente FAR=0.01) se incrementan los costes de producción.

### Diarización

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time`◊漏检语音 + 误报语音 + 说话人混, cada uno de ellos es un porcentaje.

**JER (Jaccard Error Rate)。**Indicador de sustitución de DER, por el que se puede decir que el cambio de tiempo en el tiempo es más estable.

### Clasificación de audio

Multi-etiqueta: todos los tipos de etiquetas**mAP (mean Average Precision)**◊AudioSet:BEATs-iter3 为 0.548 mAP──

互斥 Multi-clase:**top-1、top-5 accuracy**❖ Comando de habla v2:99.0% top-1 ❖Audio-MAE)

类别 desequilibrio:**macro F1**¿ Qué es eso ?**per-class recall** Reporte por clase, exactitud de los datos, y en general,

### Generación de música

**FAD (Fréchet Audio Distance)。**En la actualidad, el número de usuarios de la música en el mundo de la música es de aproximadamente un millón de personas.

**CLAP Score。**Utiliza CLAP Embedding 的文本-音频对齐分数──&gt; 0.3 = 合理对齐──

**Listening panel MOS。**El ELO de Suno v5 en TTS Arena es 1293 (desde la elección de la música artificial)

### Indicador de referencia de lenguaje de audio

**MMAU (Massive Multi-Audio Understanding)。**10k 个音频 QA 对──

**MMAU-Pro。**1800 个困难条目,四类: habla / sonido / música / multi-audio──4 选 1 的随机水平为25%──Gemini 2.5 Pro 总体约 ~60%;所有模型 在多音上约 ~22%──

**LongAudioBench。**Quizás, por lo menos, hay un poco de información.

**AudioCaps / Clotho。**Capción de referencia: SPICE, CIDER, FENSE

### Transmisiones de habla a palabra

**Latency P50 / P95 / P99。**Desde el usuario habla termina hasta el primer reloj de pared audible 时间──Moshi:200 ms;GPT-4o tiempo real:300 ms──

**WER / MOS**Usado para la salida.

**Barge-in responsiveness。**Desde el tiempo del usuario hasta el tiempo del asistente.

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

## Construcción

### 步骤 1: con el EER de regulación

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

### 步骤 2:TTS viaje de ida y vuelta WER

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### Paso 3: para la clonación de voz de SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### Paso 4: para la generación de música de FAD

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### Paso 5: para la verificación de la EER de los altavoces (con la lección 6)

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

## Uso

Para cada implementación, se dispone de un arnés de evaluación fijo y se actualiza el modelo en cada fase de ejecución.

1. **评分前先规范化。**转小写、去标点、展开数字―― informe de las normas de normalización―
2. **报告分布，而不是平均值。**Latencia 报 P50/P95/P99。Clasificación 报 por clase de recuerdo。MMAU 报 por categoría。
3. **运行一个标准公开 benchmark。**Incluso si tu producción de datos no es igual, en el Open ASR / TTS Arena / MMAU, el informe también puede hacer que se realice una evaluación con la comparación de calificaciones.

## 陷

- **UTMOS 外推。**Se ha entrenado en el estilo de voz de VCTK; es inferior a la de la voz de la voz de la voz de la voz.
- **MOS panel 偏差。**20 trabajadores de Amazon Mechanical Turk ≠ 20 个目标用户──如果风险高,就为领域组 付费──
- **FAD 依赖参考集。**跨模型比较时, debe utilizarse la misma distribución de referencia.
- **Aggregate WER。**总体 5% WER 可能掩盖口音语音上的 30% WER──en función de la estadística 报告──
- **公开 benchmark 饱和。**La mayoría de los modelos fronterizos en el estándar de referencia arriba se ha acercado a la límite superior.

##  publicación

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-audio-evaluator.md`◊ para cualquier modelo de audio  发布选择指标、基准 和报告格式──

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` en juguete 输入上计算 WER / CER / EER / SECS / FAD-ish / MMAU-ish。
2. **Medium。**Construir un arnés WER de ida y vuelta TTS──将你的Kokoro 或 F5-TTS 输出送进 Whisper──对 50 个提示 计算 WER──标记 WER &gt; 10% 的提示──
3. **Hard。**En MMAU-Pro discurso + multi-audio 子集(cada 50 条目) 上评测你在10 中选择的 LALM──报告每类准确性,并与已发布数字比较──

## 关键术语: "El hombre es un hombre"

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
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152)                                                                                                                                                                                                                                                              
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) música-gen 标准。
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜──
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) Razón LALM 排行榜。
- [HEAR benchmark](https://hearbenchmark.com/) audios de referencia SSL。
