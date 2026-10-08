# Espectogramas, Escala Mel e características de frequência

> A rede neural não é muito adequada para o consumo direto de forma de onda crua. Eles consomem espectrogramas. Eles consomem mel espectrogramas.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

## 问题

Tome um clip de 10 segundos 16 kHz. Isto é 160.000 floats, todos localizados.`[-1, 1]`, e quase com a etiqueta "barbão de cão" ou "a palavra gato" 完全不相关──原波形 包含信息,但形式上模型 很难轻提取──两个相同的声名甚至只隔离100 ms,原样也会完全不同──

O espectrograma resolveu este problema. Ele comprimiu os detalhes do tempo que a percepção humana ignora, e manteve a estrutura da percepção em questão, bem como como como as energias mudam em uma janela de tempo de cerca de 1025 ms.

Mel espectrograma  avanço adicional. O espectro humano em sentido numérico percebe a pitch: 100 Hz vs 200 Hz  ouve-se com 1000 Hz vs 2000 Hz  é a mesma distância .

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).**A definição de um sistema de câmbio de onda é: um sistema de câmbio de onda de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de`(n_frames, n_freq_bins)`É a Matriz... é o teu espectrograma.

**Log-magnitude.**grandeza bruta 跨越 5-6 个数量级──使用 `log(|X| + 1e-6)`Ou `20 * log10(|X|)`Para comprimir a gama dinâmica, cada linha de produção utiliza a magnitude de log, em vez de magnitude bruta.

**Mel scale.**Frequência de Hz`f` através `m = 2595 * log10(1 + f / 700)`- Não .`m`◊ O que é o que se faz em 1 kHz abaixo é linear, em 1 kHz acima é o que se faz em número.

**Mel filterbank.**Uma série de filtros triangulares em escala de mel, em escala de alta distância, em linha de linha. Cada filtro é a soma ponderada de depósitos de FFT próximos.

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`──Inputo do sussurro──Inputo do parakeet──Inputo do M4T sem fio──2026 Ano de uso geral do áudio frontend──

**MFCCs.**取 log-mail spectrogram, aplicar DCT ((tipo II), manter 个系数前 13 个.

**Resolution trade.**FFT maior = melhor resolução de frequência, mas menor resolução de tempo: 25 ms / 10 ms é o valor de áudio-ML 默认;音乐使用 50 ms / 12.5 ms;transiente detecção(bateria hits, plosives) utiliza 5 ms / 2 ms。


```figure
spectrogram-window
```

## Construí-lo

### Passo 1: para a forma

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

Um clip de 10 segundos, 16 kHz, em`frame_len=400, hop=160`时会产生 998 个框架.

### 步骤 2: Janela Hann

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

Em FFT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

### 步骤 3: Magnitude de STFT

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

Produção `torch.stft`Ou `librosa.stft`(FFT-supportado ≈ vectorizado) ∞ Este ciclo é usado para ensinar; ele vai estar em ∞`code/main.py`Clip de curta duração

### 步骤 4: Mel filterbank

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

Em`n_fft=400`Quando, cobrir 08 kHz de 80 mels vai conseguir um `(80, 201)`Matrix.`(n_frames, 201)`A magnitude do STFT multiplicada pela transposição, é possível obter.`(n_frames, 80)`O espectrograma mel.

### 步骤 5: log-mel

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(dB normalizado de referência)`10 * log10(power + eps)`❖ Suspirar  使用更复杂的剪辑 + normalizar 例例`log_mel_spectrogram`)。

### 步骤 6: MFCCs

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

Para cada quadro de log-mail  aplicar DCT, reservar  13 个系数──这是你的MFCC矩阵──第一个系数通常会被丢弃它编码总能)──

## Use-o

2026 ano estaca:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。**Qualquer um de nós precisa assumir a responsabilidade.

## 2026 ainda entrará na armadilha da produção

- **Mel count mismatch.**Utilize 80 mels  treinar, utilize 128 mels inferência── silencioso 失败──
- **Sample-rate mismatch upstream.**Em 22,05 kHz  calculado mels com 16 kHz Diferente.
- **dB vs log.**O bisbilhão 期望 log-mel, em vez de dB-mel― algumas canais HF 会 autodetect; seu código personalizado não irá―
- **Normalization drift.** training时使用 per-utterance normalization,inference 时使用 global normalization── é o que vai fazer WER 翻倍的生产 bug──
- **Leakage from padding.**Para o fim do clipe, é realizado um padagem zero.

## Entrega-o

保存为 `outputs/skill-feature-extractor.md`◊ Esta habilidade 会为给定模型目标 选择 feature type、mel count、frame/hop 和 normalização。

## 练习

1. **Easy.**运行 `code/main.py`△ Ele se encontra em uma freqüência de 200 → 4000 Hz 扫过),并印每一个框架的 argmax mel bin──绘图(可选)并确认它与扫匹配──
2. **Medium.**Utilização `{40, 80, 128}`Em meio`n_mels`和 `{200, 400, 800}`Em meio`frame_len`重新运行──测时间轴 上尖峰带宽──哪种组合最好解析了?
3. **Hard.** realização `power_to_db`,并比较 AudioMNIST 上微小CNN classificador 使用以下输入时的ASR精度:`ref=max`dos dB-mel, ((c) MFCC-13 + delta + delta-delta。 relatar a precisão superior­-1.

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
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) 原始 mel scale。
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读 execução de referência。
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html)- Não .`mfcc`- Não.`melspectrogram`和 hop/window's reference:
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) Utilizado para o gasoduto em escala de produção dos modelos Parakeet + Canary 
