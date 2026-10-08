# Transformadores de audio  Arquitectura de susurros

> El audio es la frecuencia de la imagen que cambia con el tiempo. El susurro es un espectro de la voz y el texto.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## El problema

En Whisper, OpenAI, Radford et al. 2022) antes, el reconocimiento automático de voz de vanguardia, ASR, significa que las funciones extractoras de onda2vec 2.0 y HuBERT son supervisadas por sí mismas, además de una cabeza de tono fino.

Susurro hizo tres cosas:

1. **Train on everything。**Desde Internet se han obtenido 680.000 horas de audio con etiquetas débiles, que cubren 97 idiomas.
2. **Multi-task single model。**Un decodificador                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
3. **标准 encoder-decoder transformer。**Encodrador consumo de espectrogramas de log-mail──Decoder 以 autoregressive 方式生成文本代币──no vocoder, no CTC, no HMM──

Resultado:El susurro de grandes volúmenes de voz para los acentos, ruido y datos de etiquetado no está disponible.

## El concepto

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### Paso 1  repetición + ventana

Audio 为 16 kHz──clip/pad hasta 30 segundos──计算日志-mail espectograma:80 个 melbin,10 ms de paso → 约3000 frames × 80 features──这是Whisper 看到的输入图──

### Paso 2  tronco convolucionario

∆ dos capas de Conv1D, núcleo 3 ∆ paso 2, reducirá 3.000 cuadros ¥ 1.500  en caso de no aumentar un gran número de parámetros ∆ reducirá la longitud de la secuencia ¥ la mitad 

### Paso 3  codificador

Una versión de 24 capas (en inglés) de un codificador transformador, que procesará 1.500 pasos de tiempo.

### Paso 4  decodificador

Un decodificador de transformador de 24 capas. Se utiliza para generar tokens autoregresivamente en el vocabulario BPE; este vocabulario es un superconjunto del vocabulario GPT-2, y además contiene una pequeña cantidad de tokens especiales específicos para el audio.

### Paso 5  Tokens de tarea

Descodificador rápido para el control de tokens, abre, le dice a la modelo qué hacer:

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

O

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按这种约定训练的──你通过前 控制任务──这相当于2026年的指令调整,只是应用在语音上──

### Paso 6  salida

Buscar rayos de luz y ancho 5) 配合 log-prob umbral―当 `<|notimestamps|>`El símbolo no existe, selos de tiempo se hacen cada 0.02 segundos de audio.

### Tamaños de susurros

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

Grand-v3-turbo(2024) va a decodificar de 32 capas  reducido a 4―解码速度快 8×,WER 回退小于 1 个点―, este desbloqueo de velocidad de desbloqueo 正是 Whisper-turbo 在 2026年成为实时语音代理 默认选择的原因―

### Susurro No hace nada

- No hace diario (¿Quién está hablando?)
- Origin生不做实时流30 秒窗口是固定的──现代 wrappers(`faster-whisper`¿Qué es esto?`WhisperX`) a través de VAD + superposición 补上流量──
- 时没有外面的分碎,不支持30 s的长形文本――实践中效果很好,因为 el habla humana en la transcripción muy poco necesita un contexto de largo alcance――

### 2026 paisaje

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

## Construye el mismo

¿ Qué ?`code/main.py` Nosotros no entrenamos Whisper Nosotros construimos un pipeline de espectrogramas de log-mail + un formato de señal de tarea. Estos son los elementos que realmente se pueden tocar en la producción.

### Paso 1: sintetizar el audio

Se producen muestras de 16 kHz, 440 Hz, onda sinusal de 1 segundo, 16.000 muestras.

### Paso 2: Espectograma de registro de correo electrónico

完整 mel spectrogram 需要 FFT──我们做一个简化框架+每框架能量 版本,用于展示管道,而不需要`librosa`¿Qué es esto ?

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

Cuadro = 25 ms,hop = 10 ms── con Whisper                                                                                                                                                                                                                                                        

### Paso 3: Pallado hasta 30 s

Se susurra 始终处理 30 秒块──将光谱pad或剪辑) hasta 3.000 cuadros──

### Paso 4: Construir fichas de inmediato

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

Éste es el control de tareas completo. Un prefijo de 4 tokens.

## Usalo

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

Más rápido 兼容 OpenAI:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- Utiliza un modelo para hacer ASR multilingüe.
- Para la transcripción de la música en formato audio.
- Investigación / prototipo ASR最快起点──

**何时选择别的方案：**

- Rango de transmisión de ultra baja latencia Lunarshine en la misma calidad bajo superior a Whisper。
- 需要 <200 ms de tiempo real de conversación AI utilizar ASR de transmisión especial
- Diario de oradores Susurrido 不做这个;接上 pyannote──

## Envío

¿ Qué ?`outputs/skill-asr-configurator.md`◊ esta habilidad 会为新语音应用 选择ASR model、decodificación parámetros 和 preprocessing pipeline。

## Los ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar 16 kHz、10 ms de salto de 1 segundo de cuentas de marcos de señal  aproximadamente 100 cuadros──30 segundos  aproximadamente 3.000 cuadros──
2. **Medium。**Uso `numpy.fft`Construir un espectro completo de registro de correo electrónico ∙ 验证 80 个 mel bins `librosa.feature.melspectrogram(n_mels=80)`En el número de valores de diferencia en la coincidencia.
3. **Hard。**实现 streaming inferencia:将 audio 切成 10 s windows,2 s superposición, para cada pieza 运行 Whisper,再合并 transcripts──测量与 5 分钟播客样本 单次处理相比的字错率──

## Términos clave

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

## Leer más

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Papel de susurros。
- [OpenAI Whisper repo](https://github.com/openai/whisper) código de referencia + pesos del modelo。阅读 `whisper/model.py`, puede ver en aproximadamente 400 páginas de arriba hacia abajo conv1D stem + codificador + decodificador.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) Pasos 56 中描述的束搜索 + task-token logic 在这里;500 行,完全可读──
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) Prósimo; en ciertos escenarios todavía son características SOTA¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) envase de producción,比 referencia 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 años ASR amigable con los bordes, forma similar a Susurro pero más pequeño.
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) receta de ajuste fino canónico, que incluye un preprocesador de espectrograma y un manejo de timestampes de tokens
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现(encoder,decoder,cross-attention,generación),与本课的建筑图对应──
