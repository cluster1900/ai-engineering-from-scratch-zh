# Şapışmak  Mimarlık ve Güzel Düzenleme

> Whisper, 30 saniyelik bir pencere transformatörü kodlayıcı-dekoderidir, 680k bol dilli zayıf denetimli ses metni çiftlerine eğitilmiştir.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## Sorun

Whisper, OpenAI tarafından 2022 yılının 9 ayında yayınlandı. İlk olarak bir ürün olarak 形态交付 ASR modeli olarak yayınlandı: İpleme ses, metin elde etmek, 99 种语言 desteklemek, gürültüye dayanıklı, dizüstü bilgisayar üzerinde çalışılabilir. 2024 yılına kadar, OpenAI, Large-v3 ve Turbo çeşitlerini yayınladı. 2026 yılına kadar, Whisper podcast transkripsiyonundan ses asistanlarına kadar YouTube altyazmalarının öntanımlı temelini yeniden oluşturdu.

Ama fısıltılı bir şey değil. Sessizlik.

1. İçinde ne var ki?
2. Nasıl olur da parça parça, akış veya uzun formatlı ses veririz?
3. Ne zaman ince ayarlama, nasıl ince ayarlama...

## Anlaşım

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准 transformer kodlayıcı-dekodör

- Giriş: 30 saniyelik log-mel spektrogramı, 80 mels, 10 ms hop → 3000 çerçeve.
- Kodlayıcı:conv-downsample (added 2) + `N`Transformer blokları──对Large-v3:32 katman,1280-dim,20 başlı──
- Dekodör:带 causal self-attn + kodlayıcı çıkışına karşı yapılmış çapraz atn `N`Transformer blokları──大小与编码器 相同──
- Çıktı: 51 865-token sözcük BPE jetonları için kapsamlı.

Büyük-v3 1.55B parametreleri vardır. Turbo 4 katlı dekodör kullanmakla 32 katlıktan azaltılır.

**Prompt format。**Whisper bir dekodör istekleri arasından özel simgeler  kontrolünün çok görevli modeli:

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` dil etiketi; zorunlu çeviri-transkripsiyon 行为──
- `<|transcribe|>`Ya da`<|translate|>`  翻译为英语输出,或逐字转写。
- `<|notimestamps|>` 跳过 word level timestamps(更快)。

Bir modelin çok sayıda görevi başarmasına izin ver.`<|en|>`改成 `<|fr|>`Fransızca yazılacak.

**30-second window。**Birden fazla video çekimleri, daha kısa videolar, daha fazla video çekimleri, daha kısa videolar, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri ve daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri ve daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri ve daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri ve daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, daha fazla video çekimleri, Windows için neden nedenleri çekimleri, Windows için daha fazla video çekimleri, Windows için daha fazla video çekimleri çekimleri çekimleri, Windows için daha fazla video çekimleri çekimleri, Windows için daha fazla video çekimleri çekimleri çekimleri çekimleri çekimleri, Windows için çekimleri, Windows için çekimleri çekimleri çekimleri

**Log-mel normalization。** `(log_mel - mean) / std`, Whisper'in kendi eğitim korpusundan gelen istatistikler.`whisper.audio.log_mel_spectrogram`), yerine `librosa.feature.melspectrogram`- Evet.

### 2026'da değişiklikler

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### Düzgün ayarlama

2026 yılının kanonik çalışma akışı:

1. 收集 10100 小时目标领域音频,并配有一致的转录──
2. Kullanım`transformers.Seq2SeqTrainer`,带 `generate_with_loss`Arama.
3. Parametre-efikas: `q_proj`- Evet.`k_proj`- Evet.`v_proj`上使用LoRA,可将 GPU belleği 降低 4×,WER 代价 <0.3──
4. Eğer sadece 10 saat varsa, kodlayıcıyı dondur.
5. Whisper  kendi Tokenizer 和 prompt biçimi kullanın; kesinlikle tokenizerleri değiştirmeyin。

社区结果: 20 saat içinde tıbbi diktasyonda üstün ayarlama Ortalama, tıbbi sözlüklerin üstündeki WER'i %12'den %4.5'e düşürecek. 4 saat içinde İzlandaca üstündeki ince ayarlama Turbo, WER'i %18'den %6'a düşürecek.


```figure
sp-asr-attention
```

## Yapın

### Adım 1: 直接运行 Fısıltı

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe(
    "clip.wav",
    language="en",
    task="transcribe",
    temperature=0.0,
    condition_on_previous_text=False,  # prevents runaway repetition
)
print(result["text"])
for seg in result["segments"]:
    print(f"[{seg['start']:.2f}–{seg['end']:.2f}] {seg['text']}")
```

Hep kapsamalı kilit öntanımlılar:`temperature=0.0`(sampling 默认是 0.0 → 0.2 → 0.4 ... fallback zinciri)`condition_on_previous_text=False`(kaskadör halüsinasyon problemini önlemek), ve`no_speech_threshold=0.6`(Sessizlik algısı)

### Adım 2: Uzun şekilli parçalar

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX 添加了 (1) Silero VAD geçit,(2) 通过 wav2vec 2.0 通过做字级对齐,(3) 通过 `pyannote.audio`Günlükleştirme yapmak. 2026 yılında transkripsiyon üretimi için bir iş atıdır.

### Adım 3: LoRA ince ayar kullan

```python
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1, bias="none", task_type="SEQ_2_SEQ_LM",
)
model = get_peft_model(model, lora)
# model.print_trainable_parameters()  -> ~3M trainable / 809M total
```

Sonra Standart Trainer döngüsü kullanın.

### Dördüncü adım: Her aşama ne öğrendiklerini kontrol et.

```python
# Grab cross-attention weights during decode to see what the decoder attends to.
with torch.inference_mode():
    out = model.generate(
        input_features=features,
        return_dict_in_generate=True,
        output_attentions=True,
    )
# out.cross_attentions: layer × head × step × src_len
```

Heatmap 可視化 ile dekodör adımlarını göreceksiniz. Kodlayıcı çerçevelerini tararken diyagonal bir uyum oluşturursunuz.

## Kullan

2026 yığın:

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2 backend) 2026 yılının en hızlı CPU+GPU sonuç süresi, vanilya 快 4×, output aynı.

## 2026'da hala yolculuk eden tuzaklar

- **Hallucinated text on silence。**Şapış  başlıklara dayalı 訓練, içeren "Seyrettiğiniz için teşekkürler!"、"Abone olun!"、 şarkı sözleri──调用前始终做 VAD-gate──
- **`condition_on_previous_text` cascade。**Bir halüsinasyon, pencerelerin kirlenmesini sağlar.`False`- Evet.
- **Short-clip padding。**Bir 2 saniyelik klip doldurma 30 saniye sonra, belki de son sesinde halüsinasyon yapar.`pad=False`Ya da VAD kapısı.
- **Wrong mel stats。**Kütüphanenin fısıltıları değil, fısıltıları kullanın.`whisper.audio.log_mel_spectrogram`- Evet.

## Gönder

保存为 `outputs/skill-whisper-tuner.md`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

## Egzersizler

1. **Easy.**运行  İşlem`code/main.py`▽ It will tokenize a Whisper-style prompt, hesaplama biçim bütçelerini çözünür,并印 10 分钟片的分分表──
2. **Medium.**- Yapımcılık`faster-whisper`,转写一个10分钟播客,并与人类转录比较WER――尝试`language="auto"`İhtiyaçlı`language="en"`- Evet.
3. **Hard.**HF kullan `datasets`, seçme bir biçim Şapışma ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️ ️   ️ ️    ️   ️                                                                  

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## Daha Fazla Okumak

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) 原始建築 和 eğitim tarifi。
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363)4 katlı dekodör, 8× hızlandırma.
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) uzun biçimli 、 sözcüksel 、 diaryed。
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2 desteklenmiş, 快 4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) Kanonik LoRA / tam FT yürüyüşü。
