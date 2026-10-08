# 音频基础  波形、采样、Fourier Transform

> As ondas são sinal bruto. Os espectrogramas são a forma de expressão. As características do mel são adequadas à forma de ML.

**类型：**- aprendizagem
**语言：**Python
**前置要求：**Fase 1 · 06 (Vectores e Matrizes), Fase 1 · 14 (概率分布)
**时间：**- 45 minutos.

## 问题

O Macro produz um sinal pressão-v-tempo. A sua rede neural consome tensores. Há um conjunto de regras entre eles, que se violarem, produzem bugs silenciosos.

Cada bug nos sistemas de fala pode ser traçado a três problemas:

1. Os dados são baseados em que taxa de amostra, o modelo espera o quê?
2. O sinal é alias?
3. Você está em amostras brutas, também está em representação de frequência, em operação?

Se o fizer, o resto da Fase 6 será processado.

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`Na sequência de um nível de flutuação, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em segundo, em seguida, em seguida, em segundo, em seguida, em segundo, em segundo, em seguida, em seguida, em segundo, em segundo, em seguida, em segundo, em seguida, em seguida, em seguida, em segundo, em seguida, em seguida, em seguida, em seguida, em seguida, em segundo, em seguida, em segundo, em seguida, em seguida, em seguida, em seguida, em segundo, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em`t = n / sr`Um clip de 16 kHz,10 segundos é um conjunto de 160.000 floats.

**Sampling rate (sr)。**Cada segundo quantas amostras.

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`A taxa de amostragem pode ser definida como a máxima`sr/2`As frequências...`sr/2`边界是 *Nyquist frequência*──高于 Nyquist 的能量会被 *aliased*,也就是折叠到更低的频率中,并污染信号──下样式 前始终需要低通过过──

**Bit depth。**PCM de 16 bits ((assinado int16, gama ±32,767) é um sistema de câmbio de 24 bits, DSP interno com flutuante de 32 bits,`soundfile`É assim que o livro vai ficar em contato com o int16, mas expondo-o.`[-1, 1]`Arrays float32 do meio.

**Fourier Transform。**任意有限信号 都是不同频率的突突状 (sinusoides) 之和──Discret Fourier Transform (DFT) para `N`个 amostras 计算 `N`个 coeficientes complexos, é o mesmo que cada freqüência bin 一个.`bin k`映射到频率                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `k · sr / N`Hz──magnitude é a amplitude da frequência, ângulo é fase―

**FFT。**Transformação rápida de Fourier:当 `N`É 2 时, usado para DFT `O(N log N)`Algoritmo. Todas as bibliotecas de áudio 底层都使用FFT──16 kHz 下 1024-sample FFT 会给出 512 个可用频箱,覆盖08 kHz,解析为15.6 Hz──

**Framing + window。**Nós não vamos fazer FFT em todo o clipe. Nós o cortamos em quadros sobrepostos. Normalmente 25 ms, vamos cortar 10 ms.


```figure
mel-scale
```

## Construí-lo

### 步骤 1: read取 clip e desenhar forma de onda

`code/main.py`Apenas usar o seu site`wave`Modulo, para manter a demonstração`soundfile`Ou `torchaudio.load`(两者都回归 `(waveform, sr)`- Tópicos:

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### 步骤 2: do primeiro princípio da síntese de onda sinusa

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

16 kHz 下持续 1 秒的 440 Hz sine(concert A) é de 16.000 个 floats── utiliza codificação PCM de 16 bits, através `wave.open(..., "wb")`- Não.

### 步骤 3: Handwriting Computing DFT

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

`O(N²)` para `N=256`Não há problema, mas não há problema com o áudio real.`numpy.fft.rfft`Ou `torch.fft.rfft`- Não.

### 步骤 4: encontrar a frequência dominante

Indice de pico de magnitude `k_star`映射到频率                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `k_star * sr / N`△ em 440 Hz sine 上运行时,应返回位于bin `440 * N / sr`O pico.

### 步骤 5: demonstração de aliasing

以 10 kHz 采样 7 kHz sine  Nyquist = 5 kHz) ・7 kHz tom 高于 Nyquist,会折叠到 `10 − 7 = 3 kHz`O pico da FFT acontece em 3 kHz. É uma demonstração de alias clássica, e também é a razão pela qual cada DAC/ADC tem um filtro de baixo passo em parede de tijolos.

## Use-o

2026 ano você realmente vai entregar a pilha:

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

 决策规则:**先匹配 sample rate，再匹配其他任何东西**❖ Suspirar 期望 16 kHz mono float32―传给它 44.1 kHz estereo,你会看起来像模型 bug 的垃圾结果―

## Entrega-o

保存为 `outputs/skill-audio-loader.md`◊ Esta habilidade  ajuda você a verificar a entrada de áudio se corresponde ao modelo de download da expectativa, e se não corresponde, reproduzir corretamente 

## 练习

1. **简单。**Em 16 kHz, a substituição de 1 segundo de 220 Hz + 440 Hz + 880 Hz 混合音──运行 DFT── confirmação em canhões de pré-expectado 处有三峰──
2. **中等。**Gravar um episódio de 48 kHz, 3 segundos de seu próprio WAV.`torchaudio.transforms.Resample`(带 anti-aliasing) downsample até 16 kHz, então usar uma decimação ingênua ((( cada três amostras 取一个) downsample até 16 kHz;;对两者做FFT──aliasing 出现在哪里?
3. **困难。**Apenas usar `math`和 3 de etapa DFT, desde zero construção STFT──Framas de tamanho 400,hop 160,Hann janela──`matplotlib.pyplot.imshow`Escrever magnitudes. É o espectrograma da lição 02.

## 关键术语

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

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) Teorema de amostragem 背后的论文──
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费、经典的DSP教科书──
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用走过──
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) Usado para entender por que o áudio do mundo real não é um referencial de sinusoide puro.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/)Usando 10 minutos para resolver a frequência do bin 直觉.
