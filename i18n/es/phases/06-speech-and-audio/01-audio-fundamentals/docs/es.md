# 音频基础  波形、采样、Fourier Transform

> Las formas de onda son la señal bruta. Los espectrogramas son la forma de expresión. Las características del mel son adecuadas a la forma de ML. Cada moderno ASR y TTS del oleoducto han pasado por esta escala, y el primer paso es entender la muestreo y Fourier.

**类型：**El aprendizaje
**语言：**Python
**前置要求：**Fase 1 · 06 (Vectores y Matrices), Fase 1 · 14 (概率分布)
**时间：**- 45 minutos

##  problemas

麦克风 generará una señal de presión contra el tiempo―Su red neuronal 消耗 tensors―entre ellos hay un conjunto completo de reglas, una vez que se infringe, se producirá un error silencioso: el modelo 训练看起来正常但 WER 翻倍, o TTS 发布后带有声, o el sistema de clonación de voz 记得是麦克风而不是说话人―

Cada error en los sistemas de habla se remonta a uno de los tres problemas:

1. ¿Qué datos se registran en la muestra? ¿Qué espera el modelo?
2. ¿Se llama el alias?
3. ¿Estás en la muestra prima de operación, también en la representación de frecuencia de operación?

Si lo haces, el resto de la Fase 6 está disponible para tratar.

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`En el medio de una dimensión de la matriz flotante, según el número de muestras, se debe convertir en segundos, a partir de la tasa de muestras:`t = n / sr`❖ Un clip de 16 kHz,10 segundos es un conjunto de 160.000 floats.

**Sampling rate (sr)。**Cada segundo cuántas muestras.

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`La tasa de muestreo puede indicar claramente el máximo hasta `sr/2`Las frecuencias de la radio.`sr/2`边界是 *Nyquist frecuencia*──高于 Nyquist energía se encuentra *aliased*,也就是折叠到更低的频率中,并污染信号──下样式 前始终需要低通过过──

**Bit depth。**PCM de 16 bits ((firmado int16, rango ±32,767) es un sistema de intercambio de 24 bits, DSP interno con float de 32 bits,`soundfile`Así que leeré en el 16 pero expondo.`[-1, 1]`Arrays float32 en el centro.

**Fourier Transform。**任意有限信号 都是不同频率的突突状的 之和──Discrete Fourier Transform (DFT) hacia `N`个 muestras 计算 `N`个 coeficientes complejos,也就是每个频率bin 一个.`bin k`映射到频率                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `k · sr / N`Hz──Magnitud es la amplitud de la frecuencia, ángulo es la fase―

**FFT。**Transformación rápida de Fourier:当 `N`Es 2 de la hora, para uso en DFT `O(N log N)`Algorithm。 cada biblioteca de audio 底层都使用FFT──16 kHz 下 1024-sample FFT 会给出512 个可用频箱,覆盖08 kHz,解析为15.6 Hz──

**Framing + window。**Nosotros no vamos a hacer FFT a todo el clip. Nosotros lo cortamos en *framees* sobrepostas (normalmente 25 ms, saltamos 10 ms), vamos a hacer cada frame multiplicado por la función de ventana (Hann、Hamming) para eliminar la falta de continuidad, luego hacemos FFT a cada frame.


```figure
mel-scale
```

## Construirlo

### Paso 1: leer clip y dibujar forma de onda

`code/main.py`Sólo usar el código `wave`Modulo de desarrollo de la tecnología de la información y de la información`soundfile`O `torchaudio.load`(两者都回归 `(waveform, sr)`Túples:

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### Paso 2: desde el principio de la primera naturaleza de la onda senoideal

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

16 kHz 下持续 1 秒的 440 Hz sine(concert A) es de 16.000 个 floats── utilizar el codificación PCM de 16 bits, a través `wave.open(..., "wb")`¿Cómo es que no lo sabes?

### Paso 3: Escribe el DFT

```python
def dft(x):
    N = len(x)
    out = []
    for k in range(N):
        re = sum(x[n] * math.cos(-2 * math.pi * k * n / N) for n in range(N))
        im = sum(x[n] * math.sin(-2 * math.pi * k * n / N) for n in range(N))
        out.append((re, im))
    return out
```

`O(N²)` para `N=256`Para confirmar la corrección no hay problema, pero para el audio real no hay necesidad.`numpy.fft.rfft`O `torch.fft.rfft`¿Qué es eso?

### Paso 4: encontrar la frecuencia dominante

Indice de pico de magnitud `k_star`映射到频率                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `k_star * sr / N`△ en 440 Hz sines 上运行时,应返回位于bin `440 * N / sr`El pico de la vida.

### 步骤 5: muestra el alias

Es decir, el tono de 10 kHz 采样 7 kHz sine  Nyquist = 5 kHz)  7 kHz 高于 Nyquist,会折叠到 `10 − 7 = 3 kHz` El pico de FFT se encuentra en 3 kHz. Esto es un alias clásico, también es la razón por la cual cada DAC/ADC tiene un filtro de paso bajo de pared de ladrillo.

## Usalo

2026 años de tu actual reunión de entrega:

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

 决策规则:**先匹配 sample rate，再匹配其他任何东西**❖ Susurro 期望16 kHz mono float32―传给它44.1 kHz estéreo, y te verás como el resultado de un error de modelo―

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-audio-loader.md`◊ Esta habilidad ◊ ayudar a comprobar si la entrada de audio se ajusta a las expectativas del modelo de audio, y si no se ajusta correctamente a la muestra ◊

##  ejercicios

1. **简单。**En 16 kHz abajo sintetizado de 1 segundo 220 Hz + 440 Hz + 880 Hz 混合音──运行 DFT── confirma en los contenedores de espera 处有三峰──
2. **中等。**录制一段 48 kHz、3 segundos de tu propio WAV 语音──使用 `torchaudio.transforms.Resample`(带 anti-aliasing) muestra abajo hasta 16 kHz, luego usando una decimación ingenua ((( cada tres muestras 取一个) muestra abajo hasta 16 kHz──对两者做FFT──aliasing 出现在哪里?
3. **困难。**Sólo usar `math`Y Paso 3 de DFT, desde zero construcción STFT──Cuadro tamaño 400,hop 160,Hann ventana──用 `matplotlib.pyplot.imshow`绘制 magnitudes── ése es el espectrograma de la Lección 02──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sample rate | 每秒多少个 samples | ADC 测量 signal 的 frequency，单位为 Hz。 |
| Nyquist | 你可以表示的最大 frequency | `sr/2`；高于它的能量会 alias 回低频。 |
| Bit depth | 每个 sample 的 resolution | `int16` = 65,536 levels；`float32` = `[-1, 1]` 中的 24-bit precision。 |
| DFT | sequences 的 Fourier Transform | `N` samples → `N` 个 complex frequency coefficients。 |
| FFT | 快速 DFT | `O(N log N)` algorithm，要求 `N` = 2 的幂。 |
| Bin | Frequency column | `k · sr / N` Hz；resolution = `sr / N`。 |
| STFT | Spectrogram 的底层机制 | 随时间进行 framed + windowed FFT。 |
| Aliasing | 奇怪的 frequency 幽影 | 高于 Nyquist 的能量镜像到更低 bins。 |

## 延伸阅读

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) teorema de muestreo 背后的论文──
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费、经典的DSP教科书──
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用走过──
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) Para entender por qué el audio del mundo real no es un referente del senouroide puro.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) Usando 10 minutos para resolver la frecuencia de la caja de tu intuition.
