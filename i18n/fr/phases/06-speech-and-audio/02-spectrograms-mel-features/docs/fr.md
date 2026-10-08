# Spectrogrammes, échelle de mélange et caractéristiques du son

> Les réseaux neuraux ne sont pas trop adaptés à la consommation directe de la forme d'onde brute. Ils consomment des spectrogrammes. Ils consomment des méles spectrogrammes.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

##  problématique

Prenez une vidéo de 10 secondes 16 kHz. C'est 160 000 floats, tout est dans la zone.`[-1, 1]`, et presque avec l'étiquette "barbeau de chien" ou "le mot chat" 完全不相关──raw waveform 包含信息, mais en forme modèle 很难轻松提取──两个相同的音词甚至只隔离100 ms,raw sample也会完全不同──

Le spectrogramme résolve ce problème. Il comprime les détails du temps que la perception humaine ignore, et conserve la structure de la perception concernée, quelle fréquence a de l'énergie, ainsi que la façon dont ces énergies changent dans une fenêtre de temps d'environ 1025 ms.

Le spectrogramme de méle est le même à 1000 Hz que 2000 Hz. L'échelle de méle est la même à l'extrémité. L'axe de fréquence de méle est le plus important de la langue de l'année 2010 à 2026 en ML.

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).**Pour chaque cadre, une gamme de spectre de magnitude est constituée de formes différentes.`(n_frames, n_freq_bins)`C'est ton spectrogramme.

**Log-magnitude.**La taille brute 跨越 5-6 个数量级──使用 `log(|X| + 1e-6)`Ou `20 * log10(|X|)`Pour réduire la gamme dynamique, chaque pipeline de production utilise une magnitude de log, et non une magnitude brute.

**Mel scale.**Fréquence moyenne Hz `f`- Je suis là.`m = 2595 * log10(1 + f / 700)`映射到 mel `m`◊ Le tableau de bord est à 1 kHz, le plus grand est à 1 kHz, le plus grand est à un nombre de ◊ couvrant 80 bits de 08 kHz, c'est l'entrée standard ASR.

**Mel filterbank.**Un groupe de filtres triangulaires à l'échelle de la méle. Chaque filtre est la somme pondérée des poubelles FFT adjacentes.

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`❖ Entrée de Whisper── Entrée de Parakeet── Entrée de M4T sans fil── entrées en ligne en 2026

**MFCCs.**取 log-mail spectrogram, appliquer DCT(type II), conserver le coefficient 13 个. Il va être associé à la fonction et s'est encore comprimé.

**Resolution trade.**La résolution de fréquence est meilleure, mais la résolution de temps est moins élevée.


```figure
spectrogram-window
```

## - Je le construis.

### 步骤 1: Pour la forme

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

Une vidéo de 10 secondes 16 kHz, en`frame_len=400, hop=160`Il y aura 998 cadres.

### 步骤 2: fenêtre Hann

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

En FFT, le flux d'éléments est multiplié par un autre.

### 步骤 3: grandeur de la FST

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

Production `torch.stft`Ou `librosa.stft`(FFT-supporté ∞ vectorié) ∞ dans ce boucle utilisé pour l'enseignement; il sera en ∞`code/main.py`Le clip court du milieu

### 步骤 4: filtre de la banque

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

Dans le`n_fft=400`Je vais en avoir un.`(80, 201)`Matrice !`(n_frames, 201)`La magnitude de la STFT multipliée par sa transposition, est obtenue.`(n_frames, 80)`Le spectrogramme de la lumière.

### 步骤 5: log-mel

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(db normalité de référence)`10 * log10(power + eps)`◊ Sous-pardons Utilisation de clips plus complexes + normalisation Exemple:`log_mel_spectrogram`)。

### 步骤 6: CFPM

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

Pour chaque cadre log-mail  appliquer DCT, conserver 13 个系数──这是你的MFCC矩阵──第一个系数通常会被丢弃(它编码总能)──

## Utilisez-le

2026 année de stack:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。**Toutes les parties doivent assumer leur responsabilité.

## L'année 2026 entrera encore dans la production

- **Mel count mismatch.**Utilisez 80 mels entraînement, utilisez 128 mels inférence―静默失败―在两端都记录特征形―
- **Sample-rate mismatch upstream.**Dans la mise en page de la série, le nombre de coups de fil est de 22,05 kHz.
- **dB vs log.**S'il vous plaît, faites-le.
- **Normalization drift.**訓練時使用每發表標準化,inference 時使用全球標準化──這是讓WER 翻倍的產品 bug──
- **Leakage from padding.**Pour le dernier des clips, le rembourrage à zéro se produit dans les cadres de trailings, ce qui produit un spectre plat.

## Je le livre.

保存为 `outputs/skill-feature-extractor.md`◊ Cette compétence sera utilisée pour déterminer le modèle cible   sélectionner le type de fonctionnement  comptage de courrier  cadre/hop 和 normalisation 

## 练习

1. **Easy.**运行  référencement`code/main.py`△ Il se trouve dans une fréquence de 200 → 4000 Hz 扫过),并印每个框架的 argmax mel bin──绘图(可选)并确认它与扫匹配──
2. **Medium.**Utilisation `{40, 80, 128}`Le centre`n_mels`et `{200, 400, 800}`Le centre`frame_len`重新运行── mesure de l'axe de temps  hauteur de bande passante                                                                                                                                                                                                                                                     
3. **Hard.** réaliser `power_to_db`,并比较 AudioMNIST 上 minuscule classifiateur CNN Utilisation de la précision ASR de la mise en ligne suivante:`ref=max`Les résultats de l'analyse de la CFC sont les suivants:

## 关键术语
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
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) Équelles de l'échelle de l'élément
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读 la mise en œuvre de référence。
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html) `mfcc`- Je suis là.`melspectrogram`Et le point de référence de la fenêtre.
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) Utilisé dans le pipeline à grande échelle de production des modèles Parakeet + Canary 
