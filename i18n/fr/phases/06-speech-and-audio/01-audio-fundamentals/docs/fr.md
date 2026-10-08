# 音频基础  波形、采样、Fourier Transform

> Les formes d'onde sont le signal brut, les spectrogrammes sont la forme de représentation, les caractéristiques de la méle sont adaptées à la forme de la mémoire.

**类型：**Apprendre à apprendre
**语言：**Python
**前置要求：**Phase 1 · 06 (vecteurs et matrices), phase 1 · 14 (概率分布)
**时间：**- 45 minutes

##  problématique

麦克风 produira un signal pression-contre-temps. Votre réseau neural consomme des tensors. Il existe un ensemble de protocoles entre eux, qui, une fois contrevenus, produira un bug silencieux.

Chaque bug dans les systèmes de parole remonte à trois problèmes:

1. Les données sont basées sur le taux d'échantillonnage enregistré, modèle ?
2. Le signal est-il alias ?
3. Vous êtes en train de faire des échantillons bruts, ou de faire des représentations de fréquences ?

Pour les autres, la phase 6 est facile à gérer.

## 概念

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Waveform。** `[-1.0, 1.0]`En moyenne, le nombre d'échantillons est de 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,005 à 0,00 à 0,005 à 0,00 à 0,005 à 0,00 à 0,005 à 0,00 à 0,005 à 0,00 à 0,005 à 0,005 à 0,00 à 0,005 à 0,00 à 0,005 à 0,005 à 0,005 à 0,00 à 0,005 à 0,00 et à 0,00 à 0,00 à 0,00 à 0,00 à 0,00 à 0,00 à 0,00 à 0,00 en moyenne moyenne moyenne moyenne moyenne moyenne moyenne moyenne.`t = n / sr`Une vidéo de 16 kHz à 10 secondes est une série de 160 000 flots.

**Sampling rate (sr)。**Pour chaque seconde, combien d'échantillons ?

| Rate | Use |
|------|-----|
| 8 kHz | Telephony、legacy VOIP。Nyquist 在 4 kHz，会损失辅音。ASR 中应避免。 |
| 16 kHz | ASR 标准。Whisper、Parakeet、SeamlessM4T v2 都使用 16 kHz。 |
| 22.05 kHz | 较旧 models 的 TTS vocoder training。 |
| 24 kHz | 现代 TTS（Kokoro、F5-TTS、xTTS v2）。 |
| 44.1 kHz | CD audio、music。 |
| 48 kHz | Film、pro audio、high-fidelity TTS（VALL-E 2、NaturalSpeech 3）。 |

**Nyquist-Shannon。** `sr`Le taux d'échantillonnage peut être clairement indiqué au maximum.`sr/2`Les fréquences de la radio.`sr/2`边界是 *Nyquist fréquence*──高于 Nyquist's能量会被 *aliased*,也就是折叠到更低的频率中,并污染信号──下样式 前始终需要低通过过──

**Bit depth。**PCM à 16 bits (signé int16, rangée ±32,767) est un système de change général à 24 bits, un système de diffusion interne à 32 bits.`soundfile`Je vais lire le 16 mais je vais le découvrir.`[-1, 1]`Les matrices float32 au milieu

**Fourier Transform。**任意有限信号 都是不同频的阴影之和──Discret Fourier Transform (DFT) à`N`个 échantillons 计算 `N`个 complexes coefficients, y'a aussi chaque fréquence bin 一个.`bin k`映射到频率 `k · sr / N`Hz── la magnitude est la fréquence, l'amplitude est la phase──

**FFT。**Transformation rapide de Fourier:当 `N`Il est utilisé pour la DFT.`O(N log N)`L'algorithme. Chaque bibliothèque audio utilise des FFT. 16 kHz.

**Framing + window。**Nous ne ferons pas de FFT à l'ensemble du clip. Nous le ferons en *frame* superposés.


```figure
mel-scale
```

## - Je le construis.

### 步骤 1: lire le clip et dessiner la forme d'onde

`code/main.py`Il suffit d'utiliser le stdlib `wave`Module, pour maintenir la démo 无依赖;;`soundfile`Ou `torchaudio.load`(Les deux sont de retour `(waveform, sr)`- les deux couches:

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### 步骤 2: du principe de la première nature synthèse de l'onde sinusoïde

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

16 kHz 下持续 1 秒的 440 Hz sine(concert A) est de 16 000 个 floats──`wave.open(..., "wb")`Je suis là.

### 步骤 3: DFT à la main

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

`O(N²)` Pour `N=256`Pour confirmer la validité, il n'y a pas de problème, mais pour le vrai audio, il n'y a pas besoin.`numpy.fft.rfft`Ou `torch.fft.rfft`Il y a une autre.

### 步骤 4: trouver la fréquence dominante

Indice de pointe de la magnitude `k_star`映射到频率 `k_star * sr / N`◊ Dans 440 Hz sine 上运行时,应返回位于bin `440 * N / sr`Le sommet de la montagne.

### 步骤 5: démonstration de l'aliasage

À partir de 10 kHz, le son de 7 kHz est plié jusqu'à`10 − 7 = 3 kHz`Le pic de FFT se produit à 3 kHz. C'est aussi la raison pour laquelle chaque DAC/ADC a un filtre à basse fréquence.

## Utilisez-le

2026 année de votre réelle livraison:

| Task | Library | Why |
|------|---------|-----|
| 读/写 WAV/FLAC/OGG | `soundfile`（libsndfile wrapper） | 最快、稳定、返回 float32。 |
| Resample | `torchaudio.transforms.Resample` 或 `librosa.resample` | 内置正确的 anti-aliasing。 |
| STFT / Mel | `torchaudio` 或 `librosa` | GPU-friendly；PyTorch ecosystem。 |
| Real-time streaming | `sounddevice` 或 `pyaudio` | Cross-platform PortAudio bindings。 |
| Inspect a file | `ffprobe` 或 `soxi` | CLI、快速、报告 sr/channels/codec。 |

Règles de décision:**先匹配 sample rate，再匹配其他任何东西**❖ Sourire 期望 16 kHz mono float32―传送给它44.1 kHz stéréo, vous allez avoir l'air comme le résultat de la poubelle du modèle bug―

## Je le livre.

保存为 `outputs/skill-audio-loader.md`◊ Cette compétence vous aide à vérifier si l'entrée audio correspond à l'attente du modèle de jeu et à réessayer correctement si elle ne correspond pas.

## 练习

1. **简单。**Dans les 16 kHz, la synthèse de 1 seconde est de 220 Hz + 440 Hz + 880 Hz.
2. **中等。**Enregistrer un passage de 48 kHz, 3 secondes de votre propre WAV.`torchaudio.transforms.Resample`(带 anti-aliasing) échantillon en bas jusqu'à 16 kHz, puis utilise une décimation naïve ((( chaque trois échantillons 取一个) échantillon en bas jusqu'à 16 kHz──对两者做FFT──aliasing 出现在哪里?
3. **困难。**Il suffit de l'utiliser`math`Et la phase 3 du DFT, de la conception de STFT, est la taille du cadre 400, le lieu 160, la fenêtre de la main.`matplotlib.pyplot.imshow`绘制大小──这是02l'écriture du spectrogramme de la leçon──

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

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) théorème de l'échantillonnage 背后的论文──
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) 免费、经典的DSP教科书──
- [librosa docs — audio primer](https://librosa.org/doc/latest/tutorial.html) 带代码的实用走过──
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.routledge.com/Room-Acoustics/Kuttruff/p/book/9781482260434) Pour comprendre pourquoi l'audio du monde réel n'est pas un référencement du sinus net.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/)Avec 10 minutes de fréquence,
