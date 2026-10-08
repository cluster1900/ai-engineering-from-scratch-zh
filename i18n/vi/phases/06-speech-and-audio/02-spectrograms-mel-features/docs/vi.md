# Phân quang, Scale Mel và đặc điểm âm thanh

> Mạng thần kinh không quá phù hợp với việc sử dụng trực tiếp dạng sóng nguyên liệu. Chúng tiêu thụ quang phổ. Chúng tiêu thụ quang phổ mel hiệu quả tốt hơn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 分钟

## 问题

Hãy lấy một clip 10 giây 16 kHz. Đây là 160.000 bộ nổi, tất cả đều nằm ở`[-1, 1]`, và gần như với nhãn "cô ốc" hoặc "ngôn ngữ mèo"  hoàn toàn không liên quan.

Phân quang phổ giải quyết vấn đề này. Nó sẽ thu hẹp các chi tiết thời gian mà cảm giác của con người bỏ qua (microsekundes) và giữ lại cấu trúc của cảm giác quan tâm (quý tần số có năng lượng, cũng như những năng lượng này thay đổi như thế nào trong khoảng 1025 ms).

Phân quang phổ của người dùng theo cách thức cảm nhận theo số lượng: 100 Hz vs 200 Hz  nghe lên với 1000 Hz vs 2000 Hz là  cùng khoảng cách ──skala của người dùng sẽ xoay tròn trục tần số để phù hợp với điều này──spektrogram theo quy mô của người dùng là một tính năng duy nhất quan trọng trong bài phát biểu năm 2010 đến 2026 ML──

## 概念

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Short-Time Fourier Transform).**Để tạo ra một hình dạng sóng 切成重叠 frame (tương tự đặt: 25 ms window,10 ms hop = 16 kHz 下 400 mẫu / 160 mẫu)  Để tạo ra mỗi hình dạng 乘以一个窗口函数 (Hann 是默认选择;Hamming 的取舍略有不同)  Để tạo ra mỗi hình dạng FFT──把大小谱 堆叠成形为`(n_frames, n_freq_bins)`Matrix của cậu. Đây là quang phổ của cậu.

**Log-magnitude.**quy mô thô 跨越 5-6 个数量级──使用 `log(|X| + 1e-6)`Hoặc`20 * log10(|X|)`Để nén phạm vi động lực. Mỗi đường ống sản xuất đều sử dụng log-magnitude, chứ không phải là khối lượng nguyên liệu.

**Mel scale.**Tần số trung bình Hz`f` Thông qua `m = 2595 * log10(1 + f / 700)`映射到 mel `m`◊ The映射在1kHz 以下大致是线性的,在1kHz以上大致是对数的──覆盖08kHz 80 个 melbin là tiêu chuẩn ASR input──

**Mel filterbank.**Một nhóm trong thang máy mel trên cùng khoảng cách xếp hàng các bộ lọc tam giác. Mỗi bộ lọc là tổng trọng lượng của các thùng FFT lân cận.

**Log-mel spectrogram.** `log(mel_spec + 1e-10)`❖ Khởi đầu của Whisper。 Khởi đầu của Parakeet。 Khởi đầu của SeamlessM4T。2026 年通用音频前端。

**MFCCs.**取 log-mail spectrogram, áp dụng DCT(type II), giữ trước 13 个系数── nó sẽ đi đến các tính năng liên quan 并进一步缩缩──大约 2015 年之前一直是主导 tính năng, sau đó dựa trên các bản ghi nguyên liệu của CNNs/Transformers 赶上来── nó vẫn được sử dụng để nhận dạng loa(x-vector, ECAPA)──

**Resolution trade.**FFT lớn hơn = độ phân giải tần số tốt hơn, nhưng độ phân giải thời gian kém hơn──25 ms / 10 ms là giá trị mặc định của âm thanh-ML;音乐使用50 ms / 12.5 ms; phát hiện qua thời gian(những đập trống, phích âm) sử dụng 5 ms / 2 ms──


```figure
spectrogram-window
```

##  xây dựng nó

### Bước 1: đối với hình dạng

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

Một clip 10 giây 16 kHz, trong `frame_len=400, hop=160`时会产生998 个 khung.

### 步骤 2: cửa sổ Hann

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

Trong FFT  trước từng yếu tố được nhân. Nó sẽ di chuyển các rò rỉ quang phổ do cắt không-零端 điểm gây ra.

### 步骤 3: STFT độ lớn

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

Sản xuất `torch.stft`Hoặc`librosa.stft`(FFT hỗ trợ ơ vectorized) ∞ trong vòng này được sử dụng cho việc dạy học; nó sẽ là ∞`code/main.py`Trung 短片 上运行──

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

Trong `n_fft=400`Khi 80 mels của 0-8 kHz sẽ có được một`(80, 201)`Matrix.`(n_frames, 201)`Tăng độ STFT của nó nhân với sự chuyển giao của nó, tức là có thể đạt được.`(n_frames, 80)`Các quang phổ mel.

### 步骤 5: log-mel

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

常见替代方案:`librosa.power_to_db`(thường chuẩn hóa dB tham chiếu)`10 * log10(power + eps)`❖ Nhầm sử dụng clip phức tạp hơn + bình thường hóa ví dụ(参见 Nhầm `log_mel_spectrogram`(■)

### 步骤 6: MFCC

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

Đối với mỗi khung log-mail  áp dụng DCT, giữ trước 13 hệ số. Đây là Matrix MFCC của bạn.

## Sử dụng nó

2026 năm:

| Task | Features |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mels, 10 ms hop, 25 ms window |
| TTS acoustic model (VITS, F5-TTS, Kokoro) | 80 mels, 5–12 ms hop，用于精细 temporal control |
| Audio classification (AST, PANNs, BEATs) | 128 log-mels, 10 ms hop |
| Speaker embedding (ECAPA-TDNN, WavLM) | 80 log-mels 或 raw-waveform SSL |
| Music (MusicGen, Stable Audio 2) | EnCodec discrete tokens（不是 mels） |
| Keyword spotting | 40 MFCCs，用于 tiny devices |

经验法则:**如果你不是在处理 music，就从 80 log-mels 开始。**Bất cứ sự khác biệt nào cần phải chịu trách nhiệm.

## Năm 2026 vẫn sẽ vào trong bẫy sản xuất

- **Mel count mismatch.**Sử dụng 80 mels 训练, sử dụng 128 mels suy luận.
- **Sample-rate mismatch upstream.**Trong 22,05 kHz  tính toán mels với 16 kHz khác nhau.
- **dB vs log.**Whisper 期望 log-mel, chứ không phải dB-mel. Một số đường ống HF sẽ tự phát hiện. Mã tùy chỉnh của bạn không.
- **Normalization drift.**训练时使用每发音规范化,输入时使用全球规范化──这是让 WER 翻倍的生产 bug──
- **Leakage from padding.**Để kết thúc clip, thực hiện việc đệm bằng không 会在后背框架中产生平谱──使用对称 đệm或复制──

## 交付 nó

保存为 `outputs/skill-feature-extractor.md`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊                                                                                                                                                                                        

## 练习

1. **Easy.**运行 `code/main.py`Nó được kết hợp thành một tần số từ 200 → 4000 Hz, và in mỗi khung của argmax mel bin.
2. **Medium.**Sử dụng `{40, 80, 128}`Trung `n_mels`和 `{200, 400, 800}`Trung `frame_len`重新运行── đo trục thời gian 上 sắc nét đỉnh băng thông── loại kết hợp nào tốt nhất giải quyết chirp?
3. **Hard.**实现 `power_to_db`,并比较 AudioMNIST 上微小CNN phân loại sử dụng:`ref=max`Các điểm trên là:

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
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) nguyên thủy của quy mô.
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) 阅读 thực hiện tham chiếu
- [librosa feature extraction docs](https://librosa.org/doc/main/feature.html) `mfcc``melspectrogram`和 hop/window của tham chiếu:
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) Sử dụng cho đường ống quy mô sản xuất của các mô hình Parakeet + Canary
