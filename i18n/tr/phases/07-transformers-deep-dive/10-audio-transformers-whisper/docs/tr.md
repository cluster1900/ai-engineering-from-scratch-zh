# Ses Transformatörleri  Fısıltıcı Arsitektur

> Ses, frekansın değişmesi ve zamanla şekillendirilmesi olan bir görüntü.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## Sorun

Whisper,Radford et al. 2022) öncesinde, state-of-the-art otomatik konuşma tanıma(ASR) wav2vec 2.0 ve HuBERT self-supervised feature extractors 加上精细调的头──质量高,但数据管道 昂贵,而且对域 脆弱──多语言语音识别 需要按语言家族 使用不同模型──

Şapşır üç şey yaptı:

1. **Train on everything。**İnternetten çekilen 680,000 saat zayıf etiketlenmiş ses, 97 种语言をカバーする──無干净の学術コープ──無音響レーベル──
2. **Multi-task single model。**Bir dekodör  görev işaretleri 联合训练 transkripsiyon、 çevirme、 ses etkinliği algılaması、 dil kimliği 和 zamanlamayı。
3. **标准 encoder-decoder transformer。**Kodlayıcı  tüketimi log-mail spektrogramları── dekoder 以 autoregressive 方式生成文本トークン──無 vocoder,無 CTC,無 HMM──

结果:Whisper large-v3 accents, noise, as well as no干净 labeled data 的语言都很稳健──2026 yılına kadar, her açık kaynak ses asistanı ve çoğu ticari ses asistanının önde gelen konuşma ön ucudur.

## Anlaşım

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### Adım 1  Yeniden örnekleme + pencere

Ses 16 kHz için──klipp/pad 30 saniyede── hesaplama log-mel spektrogramı:80 个 melbin,10 ms adım → 约3000 frame × 80 özellik──这是 Whisper 看到的输入图──

### Adım 2  kıvrımlı gövde

İki Conv1D katman, çekirdek 3 ̊ adım 2, 3.000 çerçeve ̊ düşecek 1,500 ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊    ̊                                                                                                                                          

### Adım 3  kodlayıcı

Bir 24 katmanlı 版本)transformer encoder, 1,500 个 zaman aşamasını işleme.

### Adım 4  dekodör

Bir 24 katmanlı transformatör dekodörü. BPE sözlüklerinde otomatik olarak üretilen tokenler içerir; bu sözlük GPT-2 sözlüklerinin bir süpersetidir, ayrıca az miktarda ses özel özel token içerir.

### Adım 5  görev işaretleri

Dekoder hızlı bir şekilde kontrol jetonlarını açıp, model'e ne yapması gerektiğini söyle:

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

Ya da

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按这种约定训练的──你通过前语 控制任务──这相当于2026年的指示调整,只是应用在演讲上──

### Adım 6  çıkış

Çığlık arayışı ((genişlik 5) 配合 log-prob eşiği。当 `<|notimestamps|>`Zaman damgaları her 0.02 saniyede bir kez gerçekleşir.

### Şapşırma boyutları

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

Büyük-v3-turbo(2024) 32 katmanlı bir dekodör olacak 削减到4──解码速度快8×,WER 回退小于1个点──

### Şapşırın ne yaparsın

- Bu bölümde bir günlüğü yapıyorum.
- Gerçek zamanlı yayın yapmıyor.`faster-whisper`- Evet.`WhisperX`) VAD + üst üstelik 补上流
- 没有外部碎片化 时,不支持超过30s的长形文本――实践中效果很好,因为人类言论在转录中很少需要长远文本――

### 2026 manzarası

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

## Yapın

Görüyorum .`code/main.py`▽ 我们不训练 Whisper 我们构建log-mail 频谱管道 +任务标签快速格式化器──这些才是你在生产中实际会触碰的部分──

### Adım 1: Ses sentezi

16 kHz  440 Hz  1 saniyelik sinüs dalgası  16.000 örnek

### Adım 2: Log-mail spektrogramı

完整 mel spektogram 需要 FFT──我们做一个简化的框架+per-frame energy 版本,用于展示管道,而不需要 `librosa`- ...

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

Çerçeve = 25 ms,hop = 10 ms──Whisper'in pencerelerle uyumlu olması──Fram enerjisi

### Adım 3: 30 saniye kadar.

Sısırtma 始终处理 30 秒块──将光谱片

### 4 . Adım: İndirme simgelerini oluştur

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

İşte tam bir görev kontrol yüzeyi.

## Kullan

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

Daha hızlı 兼容 OpenAI:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- Bir model kullanın çok dilli ASR yapmak için.
- 杂、多样音的稳健转录──
- Araştırma / prototip ASR最快起点──

**何时选择别的方案：**

- Lunshine Lunshine Lunshine Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Lunance Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line Line                                                                                                      
- 需要 <200 ms 的实时对话 AI使用专用流媒体 ASR──
- Konuşmacı günlükleştirme Sipper 不做这个;接上 pyannote──

## Gönder

Görüyorum .`outputs/skill-asr-configurator.md`◊ bu beceri 会为新语音应用 选择ASR model、解码参数 和预处理管线──

## Egzersizler

1. **Easy。**运行  İşlem`code/main.py`❖ 16 kHz、10 ms hop'un 1 saniye sinyal çerçevesinin sayısını onaylayın ❖ 100 çerçeve için ❖ 30 saniye için 3000 çerçeve için ❖
2. **Medium。**Kullanım`numpy.fft`构建完整的日志邮件谱仪――验证 80 个邮箱与 `librosa.feature.melspectrogram(n_mels=80)`Hedef hataları içinde uyum.
3. **Hard。**实现 streaming inference:将 audio 切成 10 s windows,2 s overlap,对每块 运行 语,再合并转录──测量与 5 分钟播客样本 单次处理相比的字错率──

## Anahtar Terimler

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

## Daha Fazla Okumak

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Fısıltı kağıdı。
- [OpenAI Whisper repo](https://github.com/openai/whisper) referans kodu + model ağırlıkları。阅读 `whisper/model.py`, yaklaşık 400 行内内向下で Conv1D kök + kodlayıcı + dekodör görebilirsiniz.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) Adımlar 56 中描述的束搜索 + görev-tökeni mantığı 在这里;500 行,完全可读──
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) Önceki; bazı durumlarda hala SOTA özellikleri vardır.
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) üretim ambalajı,bkz referans 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 yıl kenar dostu ASR, şekli Şapışmaya benzer ama daha küçük
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) Kanonik ince ayarlama tarifi, mel spektrogram önceden işleme ve simge-zaman damgası kullanımı içerir。
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现(encoder、decoder、cross-attention、generation),与本课的架构图对应──
