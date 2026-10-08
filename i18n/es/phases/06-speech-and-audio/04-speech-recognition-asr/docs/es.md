# Reconocimiento del habla (RAS)  CTC, RNN-T, atención

> El reconocimiento de los idiomas se realiza en cada paso del tiempo en el proceso de clasificación de los idiomas, luego se unen a través de un modelo de secuencias de idiomas y idiomas que los unen.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

##  problemas

Tienes un 10 segundos, 16 kHz de audio. Tú quieres conseguir una cadena: "Enciende las luces de la cocina".

Tres formas formalizadas pueden resolver este problema:

1. **CTC (Connectionist Temporal Classification)。**输出每的代币 概率, incluyendo un especial *blanco*──在解码时折重复项和空──非自归,速度快──wav2vec 2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**Red conjunta en caso de un codificador 和先前Token 预测下一个Token──可流式处理──Google's端侧ASR、NVIDIA Parakeet 使用它──
3. **Attention encoder-decoder。**El codificador se acumulará a estados ocultos, el decodificador se cruzará a través de un proceso de recarga.

Hasta 2026 años, el SOTA de LibriSpeech test-clean arriba fue de 1.4% (Parakeet-TDT-1.1B, NVIDIA) y 1.58% (Whisper-Large-v3-turbo)

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让 codificador 输出 `T`个级分布,覆盖 `V+1`个 Token(V 个字符 + blanco) ――对于长度为 `U < T`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `y`, cualquier doblaje después de obtener `y`Las pérdidas de CTC se aplican a todas las operaciones de cálculo.

优点:非自归、可流式处理、零前──缺点:* suposición de independencia condicional*, es decir, cada predicción se hace independiente, por lo tanto no hay un modelo de lenguaje interno―可通过束搜索或浅融合 接入外部LM 来修正―

**RNN-T 直觉。**添加一个 *predictor* red 来 Embedding Token 历史,并添加一个 *joiner*,将预测器状态与编码器 组合成一个覆盖 `V+1`De la distribución conjunta`+1`Es nula / no emitida) ―― Obviamente construccion CTC 忽略的条件依赖──它可流式处理,因为每一步只依赖过去和过去的代币──

优点:可流式处理 + 内部 LM。缺点: entrenamiento más complejo y más consumido de memoria(3D de pérdida red);RNN-T de pérdida kernels 本身就是一个完整的库类──

**Attention encoder-decoder。**Encoder (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés).

优点:离线 ASR 质量最高,易用标准seq2seq 工具训练──缺点:自归延迟与输出长度成正比;没有工程改造就无法流式处理──

### WER: Una cifra

**Word Error Rate**¿ Qué es esto ?`(S + D + I) / N`, entre los cuales S= sustitución, D= eliminación, I= inserción, N= referencia en el texto.

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

Estos se basan en un codificador-decodificador o RNN-T── puro sistema CTC  (wav2vec 2.0) en el test-clean 上大约为 1.8-2.1%──


```figure
ctc-collapse
```

## Construirlo

### Paso 1: codificación codificada por CTC

```python
def ctc_greedy(frame_logits, blank=0, vocab=None):
    # frame_logits: list of per-frame probability vectors
    preds = [max(range(len(p)), key=lambda i: p[i]) for p in frame_logits]
    out = []
    prev = -1
    for p in preds:
        if p != prev and p != blank:
            out.append(p)
        prev = p
    return "".join(vocab[i] for i in out) if vocab else out
```

两条规则: 折叠连续重复项, abandonado en blanco. Ejemplo:`a a _ _ a b b _ c`¿ Qué es esto ?`a a b c`¿Qué es eso?

### 步骤 2:Bases de búsqueda CTC

```python
def ctc_beam(frame_logits, beam=8, blank=0):
    import math
    beams = [([], 0.0)]  # (tokens, log_prob)
    for p in frame_logits:
        log_p = [math.log(max(pi, 1e-10)) for pi in p]
        candidates = []
        for seq, lp in beams:
            for t, lpt in enumerate(log_p):
                new = seq[:] if t == blank else (seq + [t] if not seq or seq[-1] != t else seq)
                candidates.append((new, lp + lpt))
        candidates.sort(key=lambda x: -x[1])
        beams = candidates[:beam]
    return beams[0][0]
```

Se busca el haz de árbol de prefijo de la fusión LM.

### 步骤 3:RESPONSA

```python
def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    dp = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        dp[i][0] = i
    for j in range(len(h) + 1):
        dp[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(r)][len(h)] / max(1, len(r))
```

### Paso 4: Sobre el susurro  ejecutar la inferencia

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

Esta es la primera línea de ASR de 2026 con más potencia en general.

### Paso 5: utilizar Parakeet o wav2vec 2.0 para transmitir

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

La transmisión de ASR  necesita un codificador en pedazos atención 和 estado de transporte; usar apoyo de su biblioteca (`chunk_length_s`de la `transformers`el oleoducto) 

## Usalo

2026 años de:

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## 2026 año todavía se lanzará a la producción de crateras

- **没有 VAD。**En su momento de la presentación, el director de la revista de televisión, el director de televisión, el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, el director de televisión y el director de televisión, se ha visto como una vez envuelto por haber visto.
- **字符 vs 词 vs subword WER。**En normalización (小写、去标点) * después* de la normalización (小写、去标点)
- **Language ID drift。**El LID automático de susurros puede enviar un error de ruta a japonés o gales; cuando se determina el idioma, se obliga a hacerlo.`language="en"`¿Qué es eso?
- **长片段不做 chunking。**Susurro tiene 30 segundos de ventana.`chunk_length_s=30, stride=5`¿Qué es eso?

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-asr-picker.md`◊ para la determinación de los objetivos de la implementación de modelos de selección, estrategia de decodificación, desmontaje y fusión de LM

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Se puede hacer un codificador codificado por CTC de la construcción manual, y calcular en relación con el WER de la referencia.
2. **Medium。**Correcto ejecutar el paso 2 en la búsqueda de prefijos en el rayo de árbol.
3. **Hard。**En el[LibriSpeech test-clean](https://www.openslr.org/12)上使用 `whisper-large-v3-turbo`△ calcular △ 100 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条                                                                                                                                                                                                                                                                                                                            

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| CTC | blank-token loss | 对所有 frame-to-token 对齐做 marginal；非 AR。 |
| RNN-T | streaming loss | CTC + next-token predictor；处理词序。 |
| Attention enc-dec | Whisper-style | Encoder + cross-attending decoder；最佳离线质量。 |
| WER | 你报告的数字 | 词级 `(S+D+I)/N`。 |
| Blank | 空白 | CTC 中表示“此帧无发射”的特殊 Token。 |
| LM fusion | 外部 language model | 在 beam search 期间加入加权 LM log-probs。 |
| VAD | 静音门控 | Voice activity detector；裁剪非语音。 |

## 延伸阅读

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 论文──
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 论文。
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022 años canónico 论文; v3-turbo 扩展 publicado en 2024 年。
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) 2026 Líder de ASR abierto 榜首──
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 覆盖 25+ modelos 的实时基准──
