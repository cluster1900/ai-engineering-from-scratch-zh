# 语音反欺骗与音频水印  ASVspoof 5, AudioSeal, WaveVerify

> Hệ thống tiếng nói cấp sản xuất năm 2026 cần hai thứ: một sẽ thực ngữ và giả ngữ phân loại kiểm tra loại tiếng nói (AASIST, RawNet2), và một có thể chịu áp suất và biên tập dấu nước (AudioSeal) ⋅ cả hai đều phải lên mạng, nếu không bạn không cần lên mạng tiếng cloning⋅

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 6 · 06 (Tình nhận loa), Giai đoạn 6 · 08 (Tình clon giọng nói)
**Time:** ~75 minutes

## 问题

3 loại liên quan phòng thủ:

1. **Anti-spoofing / deepfake detection.**给定一段音频, nó là giả tạo hay thực sự?ASVspoof tiêu chuẩn(ASVspoof 2019 → 2021 → 5) là tiêu chuẩn vàng。
2. **Audio watermarking.**Trong tạo âm thanh trongEmbedding tín hiệu không thể nhận thức được, kiểm tra器 sau đó có thể提取它──AudioSeal(Meta) và WavMark là mở các tùy chọn──
3. **Authenticated provenance.**Đối với các tập tin và siêu dữ liệu  tiến hành ký kết mật mã C2PA / Content Authenticity Initiative

Khám phá  xử lý không hợp tác đối thủ. Watermarking  xử lý hợp pháp, AI sinh ra của âm thanh nên được nhận dạng cho loại âm thanh này.

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### ASVspoof 5  điểm tham chiếu 2024-2025

相比以前版本,最大的变化:

- **Crowdsourced data**(không có dữ liệu thu âm)
- **~2000 speakers**(之前约 ~100) ⋅
- **32 个 attack algorithms.**TTS + chuyển đổi giọng nói + nhiễu loạn đối kháng。
- **Two tracks.**Phản ứng (CM) 独立检测;面向生物识别系统的伪造强硬ASV (SASV)

ASVspoof 5 上的最新状态:~7.23% EER──较旧的 ASVspoof 2019 LA:0.42% EER──真实世界部署:预计野外片段上 EER 为 5-10%──

### AASIST 和 RawNet2  检测模型家族

**AASIST**(2021, tiếp tục cập nhật đến 2026) ⋅ Trong các tính năng phổ trên sử dụng đồ thị-trông tâm ⋅ 当前是 ASVspoof 5 phản biện 任务的SOTA⋅

**RawNet2.**Dựa trên dạng sóng nguyên liệu đầu tiên khoan dung + cột sống TDNN.

**NeXt-TDNN + SSL features.**2025 变体:ECAPA-style + WavLM tính năng + mất tiêu cực──在 ASVspoof 2019 LA 上 đạt 0,42% EER──

### AudioSeal  2024 年默认 watermark

Meta của **AudioSeal**(2024 年 1 月,v0.2 2024 年 12 月) ⋅ 关键设计:

- **Localized.**以 16 kHz 采样分辨率 ((1/16000 s) từng lần kiểm tra dấu nước。
- **Generator + detector jointly trained.**Generator 学会Embedding không thể nghe thấy tín hiệu; phát hiện viên 学会在增强后找到它.
- **Robust.**能经受 MP3 / AAC 压缩、EQ、 tốc độ thay đổi ±10%、 hỗn hợp tiếng ồn +10 dB SNR。
- **Fast.**Đám tử 以 485× thời gian thực 运行;比WavMark 快 1000×。
- **Capacity.**16 bit tải trọng hữu ích ((可编码 mô hình ID、 thế hệ thời gian dấu、 người dùng ID) có thểEmbedding mỗi phát biểu。

### WavMark

AudioSeal 之前的开放基线──Invertible neural network,32 bit/sec──问题:

- Đồng bộ hóa lực lượng thô 很慢──
- 可被Gaussian noise 或 MP3 压缩移除──
- Không phù hợp với thời gian thực.

### WaveVerify(2025 年 7 月)

解决 AudioSeal's weaknesses, đặc biệt là thao tác thời gian(reversal, speed)  sử dụng dựa trên FiLM's generator + Mixture-of-Experts detector──在标准攻击上与 AudioSeal 竞争;能处理时间编辑──

### Khả năng sử dụng đối thủ

Từ AudioMarkBench:"Trong độ chuyển động, tất cả các dấu nước cho thấy độ chính xác phục hồi Bit dưới 0,6, cho thấy loại bỏ gần như hoàn chỉnh". **Pitch-shift 是通用攻击。**2026 năm không có bất kỳ dấu nước nào có thể chống lại hoàn toàn sự thay đổi độ phát âm của kích thích. Đó là lý do tại sao bạn cần phát hiện.

### C2PA / Động thái xác thực nội dung

Không phải là công nghệ ML, mà là một dạng biểu hiện format──音频文件携带关于创建工具、作者、日期的加密签名转载数据──Audobox / Seamless 使用它──适合来源; nhưng nếu kẻ ác ý tái mã hóa và tách rời metadata, nó sẽ không có khả năng为力──


```figure
v4-audio-watermark
```

##  xây dựng nó

### 步骤 1: Một máy dò tính quang phổ đơn giản (toy)

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

Nói chuyện tổng hợp thường có năng lượng cao bình thường.

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

### 步骤 3: đánh giá  EER

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

### Bước 4: 生产集成

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

Mỗi lần tạo đều bao gồm: 1) dấu nước, 2) bản khai báo đã ký, 3)  phù hợp với nhật ký kiểm toán của chính sách lưu giữ.

## Sử dụng nó

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## 陷

- **Watermark 从未被 detector 运行检测。**Không có ý nghĩa gì. Đưa máy dò vào máy tính thông tin của anh.
- **Detection 没有 calibration。**Trong ASVspoof LA 上训练的AASIST 会过;真世界准确率下降──针对你的域做校准──
- **Pitch-shift gap.**激进的音调转会移除大多数水标――准备检测倒退――
- **Metadata strip-and-rehost.**C2PA  dễ dàng thông qua tái mã hóa 始终把加密 + nhận thức 水标)防御一起加入──
- **把 liveness 当成 detection。**要求用户说一个随机短语──它 có thể ngăn chặn các cuộc tấn công lặp lại, nhưng không thể ngăn chặn việc nhân bản thời gian thực──

## 交付 nó

保存为 `outputs/skill-spoof-defender.md` Đối với bộ phận thoại 部署 chọn mô hình phát hiện, dấu nước, biểu hiện xuất xứ và sổ tay hoạt động

## 练习

1. **Easy.**运行 `code/main.py`▽ 在合成音频 上使用 đồ chơi phát hiện + đồ chơi dấu nước nhúng / phát hiện。
2. **Medium.**                                          `audioseal`, trong TTS 输出中Embedding 16-bit payload,再重新解码──用噪音破坏音频并测量Bit Recovery Accuracy──
3. **Hard.**Trong ASVspoof 2019 LA 上细调 一个 RawNet2 或 AASIST──测量 EER──在一组持续的F5-TTS 生成片段上测试,观察OOD检测 如何退化──

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

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 当前 điểm chuẩn
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 默认 dấu nước
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150) 面向时代攻击的 MoE探测器──
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) Hủy sống phát hiện SOTA。
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) đánh giá độ bền。
- [C2PA specification](https://c2pa.org/specifications/specifications/) xuất xứ biểu hiện 格式。
