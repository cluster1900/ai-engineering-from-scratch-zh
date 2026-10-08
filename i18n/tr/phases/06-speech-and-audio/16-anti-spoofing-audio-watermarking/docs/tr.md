# 语音反欺骗与音频水印  ASVspoof 5, AudioSeal, WaveVerify

> Ses klonlama hızının hızının koruma aracı geçmesi için. 2026 yılı üretim sınıfı ses sistemi iki şey gerektirir: bir gerçek sesle sahte ses sınıfı denetleyicisi olacak AASIST, RawNet2), ve bir sıkıştırılabilir ve düzenlenebilir su işaretleri olacak AudioSeal.

**Type:** Build
**Languages:** Python
**先修要求：**6 · 06 aşaması (Sıcak konuşmacı tanıma), 6 · 08 aşaması (Ses klonlaması)
**Time:** ~75 minutes

## 问题

Üç sınıf ilgili savunma:

1. **Anti-spoofing / deepfake detection.**给定一段音频,它是合成的还是真实的?ASVspoof references(ASVspoof 2019 → 2021 → 5)
2. **Audio watermarking.**Bu yüzden, bu seçenekler, bir şekilde kullanılabilir.
3. **Authenticated provenance.**Audiofile ve metadata için 加密签名──C2PA / Content Authenticity Initiative──

Deteksiyon 处理不配合的对抗者──watermarking 处理合规性,AI 生成的音频应被识别为此类音频──2026 yılın ikisinin de olması gerekir──

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### ASVspoof 5  2024-2025 referans değer

Daha önce yapılan versiyonlara göre en büyük değişiklik:

- **Crowdsourced data**(Not recorded) 现实条件──
- **~2000 speakers**(Benecik 100)
- **32 个 attack algorithms.**TTS + ses dönüşümü + karşıtlık rahatsızlığı。
- **Two tracks.**Karşı Yöntem (CM) 独立检测;面向生物识别系统的伪造强硬ASV (SASV) 面向生物识别系统的伪造强硬ASV (SASV) 面向生物识别系统的反措施

ABD'nin 5'ü Üstün Çağlar: ~ 7.23% EER──2019'un eski ABD'nin 0.42% EER──真世界部署:预计野外片段上 EER 为 5-10%──

### AASIST 和 RawNet2  检测模型家族

**AASIST**(2021, devamlı olarak güncellenir 2026) ⋅ On spektral özellikler 上使用图-注意──当前是 ASVspoof 5 任务的SOTA──

**RawNet2.** Raw waveform'un konvulsiyonal ön ucundan + TDNN sırtkası¬nın temel çizgisine dayanmaktadır.

**NeXt-TDNN + SSL features.**2025 变体:ECAPA tarzı + WavLM özellikleri + odak kaybı──在 ASVspoof 2019 LA 上 0.42% EER──

### AudioSeal  2024 yıl默认 su işaretleri

Meta **AudioSeal**(Key Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design: KEY Design

- **Localized.**E 16 kHz 采样分辨率 ((1/16000 s) 逐检测水标──
- **Generator + detector jointly trained.**Generator öğrenci: Sessiz sinyal yerleştirme; Detektor öğrenci: büyütme sırasında 
- **Robust.**能经受 MP3 / AAC 压缩、EQ、速度变化 ±10%、噪音 mix +10 dB SNR。
- **Fast.**Detektor E 485× gerçek zamanlı 运行;比 WavMark 快 1000×──
- **Capacity.**16 bitlik payload ((可编码模型 ID、世代タイムスタンプ、ユーザー ID)

### WavMark

AudioSeal 之前的开放基线──Invertible neural network,32 bit/sec──问题:

- Sinkronizeci güçler 很慢──
- Can by Gaussian noise or MP3  压缩移除──
- Gerçek zaman için uygun değil.

### WaveVerify(2025年 7月)

解決 AudioSeal'ın zayıf noktaları, özellikle de zamansal manipülasyonlar(altınlama, hız)  FiLM'e dayalı jeneratör + Uzmanların Karışıklığı detektörü kullanmak  在标准攻击上与 AudioSeal 竞争;能处理 temporal edits──

### Mücadeleci kullanımında eksiklikler

AudioMarkBench'ten: "Pitch shift altında, tüm su işaretleri Bit Recovery Düzgünlüğünü 0.6'dan aşağı gösterir. Bu neredeyse tamamlanmış kaldırımı gösterir". **Pitch-shift 是通用攻击。**2026 yılında hiçbir su işaretleri ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒ ⇒       ⇒      ⇒                                                                                                                                                                                                                  

### C2PA / İçerik Doğruluk Girişimi

Bu, bir açık formatı değil. ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]>


```figure
v4-audio-watermark
```

## Yapın onu.

### 步骤 1: 一个简单的光谱特征探测器(玩具)

```python
def spectral_rolloff(spec, percentile=0.85):
    cum = 0
    total = sum(spec)
    if total == 0:
        return 0
    threshold = total * percentile
    for k, v in enumerate(spec):
        cum += v
        if cum >= threshold:
            return k
    return len(spec) - 1

def is_suspicious(audio):
    spec = magnitude_spectrum(audio)
    rolloff = spectral_rolloff(spec)
    return rolloff / len(spec) > 0.92
```

Sintez konuşma genellikle bu değil, AASIST'i kullanan yüksek frekanslı bir enerji üretimi sistemidir.

### 步骤 2: AudioSeal embed + detect

```python
from audioseal import AudioSeal
import torch

generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark

result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
# result: float in [0, 1] — probability of watermark presence
# decoded_payload: 16 bits; match against embedded payload
```

### 步骤 3: değerlendirme  EER

```python
def eer(real_scores, fake_scores):
    thresholds = sorted(set(real_scores + fake_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in fake_scores if s >= t) / len(fake_scores)
        frr = sum(1 for s in real_scores if s < t) / len(real_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

### 4 adım: 生产集成

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

Her zaman oluşturulan bilgiler şunları içerir: 1) su işaretleri, 2) imzalanan manifestolar, 3) tutma politikası denetim loguna uygun.

## Kullan

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## 陷

- **Watermark 从未被 detector 运行检测。**- İzleyiciyi de içeri sok.
- **Detection 没有 calibration。**ABD'de eğitim alanında AASIST'in sayısı düştü.
- **Pitch-shift gap.**激进的音速变化 会移除大多数 watermarks── 激进的音速变化 会移除大多数 watermarks── 激进的音速变化 会移除大多数 watermarks── 激进的音速变化 会移除大多数 watermarks── 激进的音速变化 会移除大多数 watermarks── 激进的音速变化 会移除大多数 watermarks── 激进的音速变化 会移除的音速变化 会移除的音速变化 会移除的音速变化 会移除的音速变化 会移动的音速变化
- **Metadata strip-and-rehost.**C2PA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
- **把 liveness 当成 detection。**要求用户说一个随机短语──它能阻止重播攻击,但不能阻止实时克隆──

## - Söyle.

保存为 `outputs/skill-spoof-defender.md`◊为语音-gen 部署选择检测模型、水标、来源宣言 和操作玩本──

## 练习

1. **Easy.**运行  İşlem`code/main.py`。在合成 ses 上使用 oyuncak detektörü + oyuncak su işaretini gömmek/detekt etmek。
2. **Medium.**- Yapımcılık`audioseal`,在 TTS 输出中Embedding 16-bit payload,再重新解码──用噪音破坏音频并测量 Bit Recovery Accuracy──
3. **Hard.**ABD'de yapılan bir testte, OOD tespitinin nasıl geri dönüşeceğini gözlemleyerek, bir grup F5-TTS'in test yapıldığı bir grupta,

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| ASVspoof | benchmark | 两年一次的 challenge；2024 = ASVspoof 5。 |
| CM (countermeasure) | Detector | Classifier：真实语音 vs synthetic / converted。 |
| SASV | Speaker verif + CM | 集成的 biometric + spoof detection。 |
| AudioSeal | Meta watermark | Localized，16-bit payload，比 WavMark 快 485×。 |
| Bit Recovery Accuracy | Watermark survival | 攻击后恢复的 payload bits 比例。 |
| C2PA | Provenance manifest | 关于创建 / 作者身份的加密 metadata。 |
| AASIST | Detector family | 基于 graph-attention 的 anti-spoofing SOTA。 |

## 延伸阅读

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 当前 referans göstergesi。
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 默认 su işaretleri。
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150) 面向时代攻击的MoE探测器──
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) SOTA algılama omurgası。
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) Güçlülik değerlendirme
- [C2PA specification](https://c2pa.org/specifications/specifications/) köken manifesti 格式。
