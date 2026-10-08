# Đánh giá âm thanh  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布;; 本课为每种音频任务命名 2026 年的指标:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## 问题

Mỗi nhiệm vụ âm thanh có nhiều chỉ số, mỗi chỉ số đo kích thước khác nhau. Sử dụng chỉ số sai, bạn sẽ phát hành một mô hình trên bảng điều khiển trông tuyệt vời, nhưng hoạt động rất kém trong môi trường sản xuất.

| Task | Primary | Secondary |
|------|---------|-----------|
| ASR | WER | CER · RTFx · first-token latency |
| TTS | MOS / UTMOS | SECS · WER-on-ASR-round-trip · CER · TTFA |
| Voice cloning | SECS (ECAPA cosine) | MOS · CER |
| Speaker verification | EER | minDCF · FAR / FRR at operating point |
| Diarization | DER | JER · speaker confusion |
| Audio classification | top-1 · mAP | macro F1 · per-class recall |
| Music generation | FAD | CLAP · listening panel MOS |
| Audio language model | MMAU-Pro | LongAudioBench · AudioCaps FENSE |
| Streaming S2S | latency P50/P95 | WER · MOS |

## 概念

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### ASR 指标

**WER (Word Error Rate)。** `(S + D + I) / N`◊评分前先转小写、除标点、规范化数字──使用 `jiwer`Hoặc OpenAI của `whisper_normalizer`◊&lt;5% = 朗读语音 đạt đến mức độ của con người.

**CER (Character Error Rate)。**相同公式,字符级别──用于声调语言(Mandarin、Cantonese), vì các từ giới hạn của những ngôn ngữ này có thể có ý nghĩa khác nhau──

**RTFx (inverse real-time factor)。**Mỗi chiếc đồng hồ tường 秒 xử lý của số lượng âm thanh giây.

**First-token latency。**Từ音频输入到第一个转录 时间――对流媒体至关重要――Deepgram Nova-3:~150 ms――

### TTS 指标

**MOS (Mean Opinion Score)。**1-5 的人工评分──黄金标准,但速度慢──每个样本收集20+ 听众,每个模型100+样本──

**UTMOS (2022-2026)。**训练得到的MOS 预测器──在标准基准上与人工MOS 的相关性约为 ~0.9──F5-TTS:UTMOS 3.95;ground truth:4.08──

**SECS (Speaker Encoder Cosine Similarity)。**Sử dụng cho việc nhân bản giọng nói. Reference audio频与克隆输出之间的 ECAPA Embedding cosine.

**WER-on-ASR-round-trip。**Trong TTS 输出上运行 Whisper,并相对于输入文本计算 WER──用于捕捉可理解度回归──2026 SOTA:&lt;2% CER──

**TTFA (time-to-first-audio)。**端到端延迟──Kokoro-82M: ~100 ms; F5-TTS: ~1 s──

### Phân tạo giọng nói 专用指标

**SECS + MOS + CER**作为三元组──SECS 高但MOS 低的克隆,说明音色正确但不自然;反过来则说明音声自然但说话人不对──

### Kiểm tra loa

**EER (Equal Error Rate)。**Tỷ lệ chấp nhận sai 等等等 false reject rate 的值──ECAPA 在 VoxCeleb1-O 上:0.87%──

**minDCF (min Detection Cost)。**Trong các điểm hoạt động được chọn (thường là FAR=0.01) tăng chi phí quyền lực hơn EER hơn gần môi trường sản xuất hơn

### Lượng chảy máu

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time`❖漏检语音 + 误报语音 + 说话人混, mỗi项都是一个占比──AMI họp:DER ~10-20% 是现实水平──pianonote 3.1 + Precision-2 thương mại:在录制良好的音频上 &lt;10% DER──

**JER (Jaccard Error Rate)。**DER là một chỉ số thay thế, đối với đoạn ngắn.

### Định dạng âm thanh

Multi-label: tất cả các loại trên **mAP (mean Average Precision)**❖AudioSet:BEATs-iter3 为 0.548 mAP。

互斥 đa lớp:**top-1、top-5 accuracy**❖Hướng dẫn phát âm v2:99.0% top-1 (Audio-MAE)

类别 không cân bằng:**macro F1**+ **per-class recall** báo cáo cho từng lớp, tổng độ chính xác sẽ che giấu những loại thất bại nào.

### Tạo nhạc

**FAD (Fréchet Audio Distance)。**Sự phân chia giữa thực tế âm thanh và âm thanh phát sinh của VGGish-Embedding.

**CLAP Score。**Sử dụng CLAP Embedding 的文本-音频对齐分数──&gt; 0.3 = 合理对齐──

**Listening panel MOS。**Đối với tiêu dùng âm nhạc vẫn là quyết định cuối cùng.

### Chỉ số chuẩn ngôn ngữ âm thanh

**MMAU (Massive Multi-Audio Understanding)。**10k 个音频 QA đối với

**MMAU-Pro。**1800 个困难条目,四类:speech / sound / music / multi-audio──4 选 1 的随机水平为25%──Gemini 2.5 Pro 总体约 ~60%;所有模型 在多音上约 ~22%──

**LongAudioBench。**Có lẽ, có một câu hỏi.

**AudioCaps / Clotho。**Định nghĩa tiêu chuẩn:

### Streaming speech-to-speech

**Latency P50 / P95 / P99。**Từ người dùng nói chuyện kết thúc đến thứ nhất có thể nghe được phản ứng của tường đồng hồ  thời gian: Moshi:200 ms; GPT-4o Thời gian thực: 300 ms。

**WER / MOS**dùng để xuất khẩu.

**Barge-in responsiveness。**Từ người dùng打断到助手静音的时间──目标&lt;150 ms──

### 2026 排行榜

| Leaderboard | Tracks | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | English + multilingual + long-form | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | English TTS | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO from paired votes | `artificialanalysis.ai/speech` |
| MMAU-Pro | LALM reasoning | `mmaubenchmark.github.io` |
| SpeakerBench / VoxSRC | Speaker recognition | `voxsrc.github.io` |
| MMAU music subset | Music LALM | (within MMAU) |
| HEAR benchmark | Self-supervised audio | `hearbenchmark.com` |


```figure
sp-wer-align
```

## 构建

### 步骤 1:带规范化的 WER

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip

transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(
    truth="Please turn on the lights.",
    hypothesis="please turn on the light",
    truth_transform=transform,
    hypothesis_transform=transform,
)
# ~0.17
```

### 步骤 2:TTS WER đi lại và đi lại

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### 步骤 3: Được sử dụng để sao chép giọng nói của SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### Bước 4: sử dụng cho việc tạo ra nhạc của FAD

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### Bước 5: Sử dụng để xác minh EER của loa(với Bài học 6 tương tự mã)

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        frr = sum(1 for s in same_scores if s < t) / len(same_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

## 使用

Để mỗi lần triển khai, áp dụng một vòng đánh giá cố định, và trong mỗi lần mô hình 更新时运行.

1. **评分前先规范化。**转小写、去标点、展开数字―― báo cáo quy định quy định
2. **报告分布，而不是平均值。**Trần độ 报 P50/P95/P99。Tân loại 报 cho mỗi lớp nhớ lại。MMAU 报 cho mỗi loại。
3. **运行一个标准公开 benchmark。**Ngay cả khi dữ liệu sản xuất của bạn khác nhau, trong Open ASR / TTS Arena / MMAU 上报告 cũng có thể làm cho đánh giá được thực hiện với các phân tích so sánh.

## 陷

- **UTMOS 外推。**Nó được đào tạo trên âm thanh trong VCTK 风格; đối với 杂 / 克隆 / 情绪化音频评分较差.
- **MOS panel 偏差。**20 个 Amazon Mechanical Turk nhân viên ≠ 20 个目标用户──如果风险高,就为领域面板 付费──
- **FAD 依赖参考集。**跨模型比较时, phải sử dụng phân bố tham khảo tương tự.
- **Aggregate WER。**总体 5% WER 可能掩盖口音语音上的 30% WER──按人口统计分片 报告──
- **公开 benchmark 饱和。**Hầu hết các mô hình biên giới trong tiêu chuẩn chuẩn đã gần như đạt được giới hạn trên.

## 发布

保存为 `outputs/skill-audio-evaluator.md`◊ vì mô hình âm thanh tùy chọn 发布选择指标、基准 和报告格式──

## 练习

1. **Easy。**运行 `code/main.py` Trong toy 输入上计算 WER / CER / EER / SECS / FAD-ish / MMAU-ish。
2. **Medium。**构建一个TTS回路WER带――将你的Kokoro或F5-TTS 输出送进 语――对50 个提示 计算WER――标记WER&gt; 10% 的提示――
3. **Hard。**Trong bài học 10, bạn đã chọn một bài báo về sự chính xác của các bài báo trên mỗi hạng mục,并与已发布数字比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| WER | ASR 分数 | 规范化后 word 级别的 `(S+D+I)/N`。 |
| CER | Character WER | 用于声调语言或 char-level 系统。 |
| MOS | 人类意见 | 1-5 评分；20+ 听众 × 100 样本。 |
| UTMOS | ML MOS 预测器 | 训练得到的 model；与人工 MOS 相关性约 ~0.9。 |
| SECS | Voice-clone 相似度 | 参考音频与克隆音频之间的 ECAPA cosine。 |
| EER | Speaker verif 分数 | FAR = FRR 的阈值。 |
| DER | Diarization 分数 | (FA + Miss + Confusion) / total。 |
| FAD | Music-gen 质量 | VGGish Embedding 上的 Fréchet distance。 |
| RTFx | 吞吐量 | 每个 wall-clock 秒处理的音频秒数。 |

## 延伸阅读

- [jiwer](https://github.com/jitsi/jiwer) 带规范化工具的 WER/CER 库
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152)                      
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) nhạc-gen 标准。
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜。
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) Lập luận LALM 排行榜。
- [HEAR benchmark](https://hearbenchmark.com/) audio SSL điểm chuẩn
