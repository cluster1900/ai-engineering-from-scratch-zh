# Espectogramas, Escala de Mel y características de la frecuencia

> Las redes neuronales no están muy adaptadas a la forma de onda en bruto. Ellos consumen espectrogramas. Ellos consumen mel espectrogramas.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

##  problemas

Toma un clip de 10 segundos 16 kHz. Es un 160.000 float, todo está en el lugar.`[-1, 1]`, y casi con la etiqueta "barbando perro" o "la palabra gato" 完全不相关──原波形 包含信息,但形式上模型 很难轻松提取── dos fonemas idénticos incluso solo a distancia de 100 ms, muestra cruda también será completamente diferente──

Espectrograma  resuelve este problema. Se comprime el tiempo que el percepto humano ignora, y se conserva la estructura de la atención del percepto, qué frecuencia tiene energía, y cómo estas energías cambian en una ventana de tiempo de aproximadamente 1025 ms.

Espectograma de mel  más avanzado. El espectro humano en sentido numérico de percepción de tono: 100 Hz vs 200 Hz  sonar con 1000 Hz vs 2000 Hz es la misma distancia ∙∙ Escala de mel ∙ El eje de frecuencia se torcerá para que coincida con este punto ∙ Espectograma de escala de mel es la característica única más importante del discurso de ML 2010-2026 ∙

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).**La configuración típica es de 25 ms de ventana, 10 ms de salto = 16 kHz, 400 muestras / 160 muestras.`(n_frames, n_freq_bins)`Es tu espectrograma.

**Log-magnitude.**magnitud bruta 跨越 5-6 个数量级──使用 `log(|X| + 1e-6)`O `20 * log10(|X|)`Para comprimir el rango dinámico, cada tubería de producción utiliza la magnitud de registro, en lugar de la magnitud en bruto.

**Mel scale.**Frecuencia de Hz mediana `f` Por el `m = 2595 * log10(1 + f / 700)`映射到 mel `m`◊ El programa se ejecuta a 1 kHz, en 1 kHz, en 80 millas de 08 kHz, que son las entradas estándar de ASR.

**Mel filterbank.**Un grupo en la escala mel arriba entre los intervalos de filas de filtros triangulares. Cada filtro es la suma ponderada de los contenedores FFT vecinos.

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`──Inputo de susurros──Inputo de paraguas──Inputo de M4T sin filtros──2026 Anterior de audio de uso general──

**MFCCs.**取 log-mail spectrogram, aplicar DCT(tipo II), conservará el primer 13 个系数── se irá a la función relacionada y se comprimirá más adelante── aproximadamente 2015 años antes ha sido la función dominante, después basado en los registros en bruto de CNNs/Transformers 赶到了上来── todavía se utiliza para el reconocimiento de altavoces(x-vectores, ECAPA)──

**Resolution trade.**Más grande FFT = mejor resolución de frecuencia, pero más inferior de tiempo resolución──25 ms / 10 ms es audio-ML 默认值;音乐使用50 ms / 12.5 ms;transitente detección(batería golpes, plosivos) utilizar 5 ms / 2 ms──


```figure
spectrogram-window
```

## Construirlo

### Paso 1: a la forma de la

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

Un clip de 10 segundos 16 kHz, en`frame_len=400, hop=160`Se producen 998 cuadros.

### Paso 2: Ventana de Hann

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

En el FFT  previo a cada elemento se multiplican . se eliminará la fuga espectral causada por la interrupción de puntos de no-zero .

### Paso 3: magnitud de la FST

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

Producción `torch.stft`O `librosa.stft`(FFT-supported 矢量化) ⋅ Este bucle es para enseñar; se encuentra en `code/main.py`El medio de corto clip arriba

### Paso 4: el banco de filtros

```python
def hz_to_mel(f):
    return 2595.0 * math.log10(1.0 + f / 700.0)

def mel_to_hz(m):
    return 700.0 * (10 ** (m / 2595.0) - 1)

def mel_filterbank(n_mels, n_fft, sr, fmin=0, fmax=None):
    fmax = fmax or sr / 2
    mels = [hz_to_mel(fmin) + (hz_to_mel(fmax) - hz_to_mel(fmin)) * i / (n_mels + 1)
            for i in range(n_mels + 2)]
    hzs = [mel_to_hz(m) for m in mels]
    bins = [int(h * n_fft / sr) for h in hzs]
    fb = [[0.0] * (n_fft // 2 + 1) for _ in range(n_mels)]
    for m in range(n_mels):
        for k in range(bins[m], bins[m + 1]):
            fb[m][k] = (k - bins[m]) / max(1, bins[m + 1] - bins[m])
        for k in range(bins[m + 1], bins[m + 2]):
            fb[m][k] = (bins[m + 2] - k) / max(1, bins[m + 2] - bins[m + 1])
    return fb
```

En el`n_fft=400`Cuando, cubrir 08 kHz de 80 mels conseguiré uno `(80, 201)`Matrix, será.`(n_frames, 201)`La magnitud de la STFT multiplicada por su transposición, se puede obtener.`(n_frames, 80)`Es un espectrograma de mel.

### 步骤 5: registro

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(dB normalizado de referencia)`10 * log10(power + eps)`✿ Susurro  ♂️ Uso de clip más complejo ♂️ normalización ejemplos ♂️ ♂️`log_mel_spectrogram`)。

### Paso 6: CFPM

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

Para cada marco de log-mail  aplicar DCT, conservar 个系数前13 个──这是你的MFCC矩阵──第一个系数通常会被丢弃(它编码总能)──

## Usalo

2026 año de pila:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。**任何偏离都需要承担举证责任──

## El año 2026 todavía entrará en la trampa de la producción

- **Mel count mismatch.**Utiliza 80 mels  entrenamiento, utiliza 128 mels inferencia― 静默失败― 在两端都记录特征形―
- **Sample-rate mismatch upstream.**En 22,05 kHz  calculado mels con 16 kHz Diferencia entre la presentación * antes* 修复 SR。
- **dB vs log.**Susurrar 期望 log-mel, en lugar de dB-mel― algunas tuberías HF 会自识别; tu código personalizado 不会―
- **Normalization drift.**訓練時使用每發表標準化,inference 時使用全球標準化──這是讓 WER 翻倍的產品 bug──
- **Leakage from padding.**Para el final del clip se realiza el relleno cero en los marcos de remodelación se produce un espectro plano. Se utiliza relleno simétrico o replicación.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-feature-extractor.md`◊ esta habilidad 会为给定模型目标 选择功能类型、邮件数、框架/hop 和正常化──

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`△ se encuentra en una frecuencia de 200 → 4000 Hz 扫过),并印每一个框架的 argmax mel bin──绘图(可选)并确认它与扫匹配──
2. **Medium.**Uso `{40, 80, 128}`En el centro`n_mels`Y `{200, 400, 800}`En el centro`frame_len`重新运行── medir el eje del tiempo Up sharp-peak bandwidth── ¿Qué tipo de combinación mejor resuelve el chirp?
3. **Hard.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `power_to_db`,并比较 AudioMNIST 上微小CNN clasificador 使用以下输入时的ASR精度:(a) registro crudo,(b) 带 `ref=max`La precisión de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información de la información.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Frame | 一个 slice | 输入给一次 FFT 的 25 ms waveform chunk。 |
| Hop | Stride | 相邻 frames 之间的 samples；10 ms 是 ASR 默认值。 |
| Window | Hann/Hamming 那类东西 | 逐点 multiplier，将 frame 边缘渐变到零。 |
| STFT | Spectrogram generator | Framed + windowed FFT；产生 time × frequency Matrix。 |
| Mel | Warped frequency | 对数感知 scale；`m = 2595·log10(1 + f/700)`。 |
| Filterbank | 那个 Matrix | 将 STFT 投影到 mel bins 的 triangular filters。 |
| Log-mel | Whisper 的 input | `log(mel_spec + eps)`；在 2026 年已标准化。 |
| MFCC | Old-school feature | log-mel 的 DCT；13 个 coeffs，去相关。 |

## 延伸阅读
- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) MFCC 论文──
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) Original escala mel。
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读 la aplicación de referencia。
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html)¿ Qué es esto ?`mfcc`¿Qué es esto?`melspectrogram`Y la referencia de la ventana.
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) Utilizado en la producción de modelos de Parakeet + Canary en escala de producción。
