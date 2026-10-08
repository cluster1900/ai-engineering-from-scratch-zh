# Ses Klonlaması ve Ses Değişimi

> Ses klonlaması, başkalarının sesini kullanarak metni okuyacaktır. Ses dönüşümü, söylediğiniz içeriği saklamakla birlikte, sesinizi başkalarının sesine yazmakla birlikte, aynı şeyi çözmeye bağlıdır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## Sorun

2026 yılında, bir beş saniyelik ses klipi tüketim seviyesindeki GPU'yla herkesin sesinin yüksek kaliteli klonunu oluşturmak için yeterli oldu. ElevenLabs、F5-TTS、OpenVoice v2、VoiceBox zaten sıfır çekim veya birkaç çekim klonlamasını sağladı. Bu teknik hem iyi haberdir, hem de bir silahtır.

İki yakın ilişkili görev:

- **Voice cloning（TTS 侧）：**Metin + 5 saniye referans sesi → The sound's audio──
- **Voice conversion（speech 侧）：**Kaynak ses(A diyor X) + B'nin referans sesi → B diyor X'in ses。

 ikisi de dalga biçimini ayırıp  içerik  konuşmacı  prosody olarak ayırır,  bir kaynak içerikini diğer kaynak konuşmacı ile yeniden yeniden yeniden birleştirir.

2026 yılında yayınlandığında, şu önemli şartları yerine getirmelisin:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**Pipeline'nin sessiz bir su işaretini çıkartması gerekiyor, onaysız bir klon reddetmek zorunda.

## Anlaşım

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**5 saniyelik klip   transmettre à un modèle de mille de locuteurs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

İstifadeden kullanıcı:F5-TTS(2024)、YurTTS(2022)、XTTS v2(2024)、OpenVoice v2(2024)。

**Few-shot fine-tuning。**录制目标声音的 5-30 分钟音频──对基模型进行一小时 LoRA fine-tune──质量会从还行跃升到难以区分──Coqui 和 ElevenLabs 都支持这种模式;社区也将它用于F5-TTS──

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (例如软音词后teriors、PPGs), sonra hedef hoparlör kullanarak 重新合成──对语言 和口音 更稳健──KNN-VC(2023)、Diff-HierVC(2023) kullanın bu yöntem──
- **Disentanglement。**訓練一個自動編碼器,在瓶頸的潜伏空間中分离内容、音箱 和 prosody──推理時替代音箱嵌入──質量較低但更快──AutoVC(2019)、VITS-VC 变体使用此方法──

**基于 Neural codec 的 cloning（2024+）。**VALL-E、VALL-E 2、NaturalSpeech 3、VoiceBox  Audio 视为来自SoundStream / EnCodec'ın 离散代币,在代码代币上训练大型autoregressive或流匹配模型──短提示 上的质量可与ElevenLabs 相比──

### 伦理部分, fazladan değil

**Watermarking。**Perth) ve SilentCipher (Silençç Çip) (Yeni Yıl 2024) ses içindeki 16-32 bitlik bir ID yerleştirilmiştir.

**Consent gates。**Her klon edilmiş çıkışın onaylanabilir onay kayıtlarıyla birlikte yapılması gerekiyor. 2026-04-22 tarihinde Rohit, bu sesin X amaç için kullanılması için yetkili olarak kullanılmıştır.

**Detection。**AASIST、RawNet2 和 Wav2Vec2-AASIST, Detektoru sağlıyor──ASVspoof 2025 meydan okuma  yayınlanan sonuçlar göstermektedir, ElevenLabs、VALL-E 2 和 Bark için en son detektorlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### Sayılar2026)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0.70 çoğunluk için genellikle hedef sesleri ayırt etmek zor olmuştur.


```figure
sp-voice-factorize
```

## Yapın

### Adım 1: Uz tanımlama-sentezi 分解(`main.py`İçinde sadece kodlu demo)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

概念上很简单; gerçekleştirmenin ana karmaşıklığı `tts_model`和 hoparlör kodlayıcı 中。

### İkinci adım: F5-TTS ile sıfır çekim klonu yap

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

Referans transkripti 必須 音声 完全匹配;不匹配会破坏配列──

### Adım 3: KNN-VC kullanarak ses dönüştürü

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行 WavLM,为源与目标池 提取 per-frame embeddings,然后将每个源框架 替换为池中的最近邻居──非参数方法,使用一分钟目标语句 即可工作──

### Adım 4: 嵌入 watermark

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

32 bitlik payload, MP3 yeniden kodlama ve hafif gürültü sonrası kontrol edilebilir.

### Adım 5: İzn verme kapısı

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## Kullan

2026 yılının birimi:

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## Tuzaklar

- **Reference transcript 未对齐。**F5-TTS 和类似模型要求参考文本与参考音频 完全匹配,包括标点──
- **Reference 有混响。**Echo Clone'u yok edecek.
- **情绪不匹配。**sever in eğitim referansı                                                                                                                                                                                                                                                          
- **Language leakage。**Klon İngilizce konuşan 后让模型说法语,通常仍会带着口音;跨语言模型的使用;;XTTS、VALL-E X) ⋅
- **没有 watermark。**2026'ın 8 ayından itibaren, AB'de yasadışı olarak yayınlanamaz.

## Gönder

保存为 `outputs/skill-voice-cloner.md`◊ bir onay kapısı + su işaretleri + kalite hedefi oluşturmak veya dönüşüm borusu oluşturmak için bir tasarım yapmak。

## Egzersizler

1. **Easy。**运行  İşlem`code/main.py`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                            
2. **Medium。**Kullan OpenVoice v2 klonu Kendi sesin, ölçüm referansı ve klon arasındaki SECS,
3. **Hard。**SilentCipher su işaretini uygulayarak, 20 klon için 128 kbps MP3 kodlama+deskripsiyon yaparak, yeniden yararlı yük kontrolü yaparak, bit doğruluğunu rapor edecektir.

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## Daha Fazla Okumak

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) Açık kaynaklı SOTA sıfır çekim klonlaması。
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)和 [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) Nöral kodek TTS。
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879)  Çelişkinlik temelinde ses dönüşümü。
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975)   VC'nin kurtarılmasına dayalı
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) 生产可用32 bit sesli su işaretleri
- [ASVspoof 2025 results](https://www.asvspoof.org/) Detektor ve sentesizer'ın silahlılık yarışması,2026 yıl更新。
