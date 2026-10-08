# Phân phối giọng nói & chuyển đổi giọng nói

> Phân phối giọng nói sẽ sử dụng giọng nói của người khác để đọc văn bản của bạn. Phân đổi giọng nói sẽ giữ lại nội dung mà bạn nói, đồng thời chuyển đổi giọng nói của bạn thành giọng nói của người khác.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## Vấn đề

Trong năm 2026, một đoạn 5 giây clip âm thanh đã đủ để sử dụng tiêu thụ cấp GPU sinh ra một bản sao âm thanh chất lượng cao của bất cứ ai. ElevenLabs, F5-TTS, OpenVoice v2, VoiceBox đã cung cấp các bản sao không bắn hoặc ít bắn.

Hai nhiệm vụ liên quan chặt chẽ:

- **Voice cloning（TTS 侧）：**Text + 5 seconds Reference Voice → The Sound's audio──
- **Voice conversion（speech 侧）：**nguồn âm thanh(A nói X) + B nói X của tiếng tham khảo → B nói X của âm thanh。

两者都将波形分解成(content、speaker、prosody), tái phân phối nội dung của một nguồn với người nói của nguồn khác 重新组合──

Các quy tắc quan trọng cần phải được đáp ứng khi phát hành vào năm 2026:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**◊ ống dẫn của bạn ◊ phải xuất ra dấu nước không nghe được,并拒绝未经同意的克隆.

## Khái niệm

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**sẽ 5 giây clip  truyền cho một trong hàng ngàn người nói trên được đào tạo mô hình ⋅ trình mã bộ đàm ⋅ clip 映射为扬声器嵌入; TTS decoder 以该嵌入 和文本 作为条件──

Người dùng:F5-TTS(2024)、YourTTS(2022)、XTTS v2(2024)、OpenVoice v2(2024)。

**Few-shot fine-tuning。**录制目标声音的 5-30 分钟音频── đối với mô hình cơ bản 进行一小时 LoRA fine-tune──质量会从还行跃升到难以区分──Coqui 和 ElevenLabs đều hỗ trợ mô hình này; cộng đồng cũng sẽ sử dụng nó cho F5-TTS──

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (例如软音词后teriors、PPGs), sau đó sử dụng loa mục tiêu nhúng 重新合成──对语言 和口音 更稳健──KNN-VC(2023)、Diff-HierVC(2023) sử dụng phương pháp này──
- **Disentanglement。**训练一个自动编码器,在瓶的潜藏空间中分离内容、扬声器 和 prosody──推理时替换扬声器嵌入──质量较低但更快──AutoVC(2019)、VITS-VC 变体使用这种方法──

**基于 Neural codec 的 cloning（2024+）。**VALL-E、VALL-E 2、NaturalSpeech 3、VoiceBox  sẽ xem âm thanh 视为来自SoundStream / EnCodec's离散代币, trên các代币 codec 上训练大型autoregressive或流相匹配模型──短提示 上的质量可与ElevenLabs 相比──

### 伦理部分, không phụ gia

**Watermarking。**PerTh (Perth) và SilentCipher (SilentCipher) sẽ được cài đặt trong âm thanh khoảng 16-32 bit ID── nó có thể được mã hóa lại, phát và thường见编辑── đã có sẵn để sản xuất nguồn mở có thể sử dụng 实现──

**Consent gates。** phải tạo ra mỗi sản phẩm được sao chép với hồ sơ đồng ý có thể xác minh 配对──我,Rohit, vào ngày 24-02-2026, được cấp quyền để sử dụng tiếng nói này cho mục đích X── lưu trữ trong nhật ký rõ ràng bị vi phạm──

**Detection。**AASIST、RawNet2 和 Wav2Vec2-AASIST đều cung cấp máy dò──ASVspoof 2025 challenge 发布的结果显示, các máy dò hiện đại 针对ElevenLabs、VALL-E 2 和 Bark 输出 EER为0.82.3%──

### Số lượng ((2026)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0,70 đối với hầu hết khán giả thường khó phân biệt với âm thanh mục tiêu.


```figure
sp-voice-factorize
```

## Hãy xây dựng nó

### Bước 1: 用 nhận dạng-sínhết học 分解(`main.py`Trung's chỉ có mã demo)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

Khái niệm rất đơn giản; thực hiện sự phức tạp chính là`tts_model`和 loa mã hóa 中。

### Bước 2: Sử dụng F5-TTS làm một bản sao không bắn

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

Bản sao tham chiếu phải hoàn toàn phù hợp với âm thanh; không phù hợp sẽ phá vỡ sự sắp xếp.

### Bước 3: Sử dụng KNN-VC thực hiện chuyển đổi giọng nói

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行 WavLM, dùng nguồn với nhóm mục tiêu 提取 per-frame embeddings, sau đó sẽ thay thế mỗi khung nguồn thành nhóm hàng xóm gần nhất trong nhóm.

### Bước 4: 嵌入 watermark

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

约32 bit payload, trong MP3 mã hóa lại và nhẹ tiếng ồn 后仍可检测。

### Bước 5: Cổng đồng ý

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## Sử dụng nó

2026 năm:

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## Những bẫy

- **Reference transcript 未对齐。**F5-TTS 和类似模型要求参考文本与参考音频 完全匹配,包括标点──
- **Reference 有混响。**Echo sẽ phá hủy clone.
- **情绪不匹配。** vui                                                                                                                                                                                                                                                             
- **Language leakage。**Phân phối người nói tiếng Anh 后让模型说法语,通常仍会带着口音; sử dụng các mô hình đa ngôn ngữ (XTTS、VALL-E X) ⋅
- **没有 watermark。**Từ tháng 8 năm 2026, EU không thể phát hành hợp pháp.

## Chuyển nó

保存为 `outputs/skill-voice-cloner.md` Thiết kế một cổng có sự đồng ý + dấu nước + mục tiêu chất lượng của việc nhân bản hoặc chuyển đổi ống ống.

## Các bài tập

1. **Easy。**运行 `code/main.py`△ thông qua tính toán hai loa trong swap 前后的kosine,演示 loa-embedding swap。
2. **Medium。**Sử dụng OpenVoice v2 clone Bạn có giọng nói của riêng bạn  đo tham chiếu với các clone  SECS  thông qua Whisper  đo CER 
3. **Hard。**Đối với 20 bản sao  ứng dụng SilentCipher watermark, sẽ sử dụng chúng thông qua 128 kbps MP3 mã hóa + mã hóa, kiểm tra lại tải trọng hữu ích.

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## Đọc thêm

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) mã nguồn mở SOTA sao chép không bắn 
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)和 [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) TTS codec thần kinh
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879) 基于解脱的语音转换──
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975) 基于检索的VC──
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) 生产可用32 bit audio watermark。
- [ASVspoof 2025 results](https://www.asvspoof.org/) cuộc thi thiết bị phát hiện và tổng hợp,2026年更新。
