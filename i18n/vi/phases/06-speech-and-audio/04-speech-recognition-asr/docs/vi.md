# Tái nhận ngôn ngữ (ASR)  CTC, RNN-T, chú ý

> 语音识别 là mỗi bước tiến trình phân loại âm thanh, được thực hiện bởi một mô hình chuỗi hiểu tiếng Anh và tĩnh âm để gắn kết chúng với nhau. CTC, RNN-T và chú ý là ba cách để thực hiện nó.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

## 问题

Bạn có một đoạn phim âm thanh 10 giây 16 kHz. Bạn muốn có một chuỗi: "đóng đèn bếp" Cần đặt ra trong cấu trúc:

Có ba phương pháp hình thức giải quyết vấn đề này:

1. **CTC (Connectionist Temporal Classification)。**输出每的代币 概率, bao gồm một đặc biệt *blank*──在解码时折重复项和空──非自归,速度快──wav2vec 2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**Mạng lưới chung trong trường hợp giao dịch mã hóa 和先前Token 预测下一个Token──可流式处理──Google's端侧ASR、NVIDIA Parakeet 使用它──
3. **Attention encoder-decoder。**Bộ mã hóa sẽ được nén lên các trạng thái ẩn, bộ mã hóa sẽ được phục vụ qua các trạng thái chéo tự quay lại tạo Token。Whisper、SeamlessM4T 使用它。

Đến năm 2026, Test-clean trên SOTA của LibriSpeech sẽ đạt 1,4% (Parakeet-TDT-1.1B, NVIDIA) và 1,58% (Whisper-Large-v3-turbo)

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让 mã hóa 输出 `T`个级 phân bố, phủ `V+1`个 符号(V 个字符 + trống) ―― đối với长度为 `U < T`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `y`, bất cứ lần gấp nào sau khi nhận được `y`Các tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có tính toán có thể được.

优点:非自归、可流式处理、零前──缺点:* giả định độc lập điều kiện*, tức là mỗi预测 lẫn nhau độc lập, do đó không có mô hình ngôn ngữ bên trong。可通过光束搜索或浅融合 接入外部LM 来修──

**RNN-T 直觉。**添加一个 *predictor*网络 来 Embedding Token 历史,并添加一个 *joiner*,将预测器状态与编码器 组合成一个覆盖 `V+1`của sự phân phối chung`+1`là null / no-emit) ―― hiển nhiên xây dựng CTC 忽略的条件依赖――它可流式处理, vì mỗi bước chỉ phụ thuộc vào quá khứ和过去的Token――

优点:可流式处理 + 内部 LM。缺点:训练更复杂且更耗内存(3D loss lattice);RNN-T loss kernels 本身就是一个完整的库类──

**Attention encoder-decoder。**Mã hóa (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code) (code)

优点:离线 ASR 质量最高, dễ sử dụng tiêu chuẩn seq2seq 工具训练。缺点: tự quay trở lại chậm chạp với dung lượng xuất thành正比; không có công trình sửa đổi được không thể xử lý流式。

### WER: một số

**Word Error Rate**= `(S + D + I) / N`, trong đó S = thay thế, D = xóa, I =插入, N = tham khảo văn文本词数―― nó đối với应词级 Levenshtein edit distance──越低越好──WER cao hơn 20% thường không thể sử dụng; thấp hơn 5% đối với đọc语音 để đạt được trình độ con người──2026年标准基准 数字:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

Tất cả đều dựa trên mã hóa-cập mã hoặc RNN-T──纯 CTC 系统(wav2vec 2.0) trong thử nghiệm sạch 上大约为 1.8-2.1%──


```figure
ctc-collapse
```

##  xây dựng nó

### 步骤 1: tham lam CTC decode

```python
def ctc_greedy(frame_logits, blank=0, vocab=None):
    # frame_logits: list of per-frame probability vectors
    preds = [max(range(len(p)), key=lambda i: p[i]) for p in frame_logits]
    out = []
    prev = -1
    for p in preds:
        if p != prev and p != blank:
            out.append(p)
        prev = p
    return "".join(vocab[i] for i in out) if vocab else out
```

两条规则: 折叠连续重复项, bỏ trống. Ví dụ:`a a _ _ a b b _ c`→ `a a b c`

### 步骤 2:CTC

```python
def ctc_beam(frame_logits, beam=8, blank=0):
    import math
    beams = [([], 0.0)]  # (tokens, log_prob)
    for p in frame_logits:
        log_p = [math.log(max(pi, 1e-10)) for pi in p]
        candidates = []
        for seq, lp in beams:
            for t, lpt in enumerate(log_p):
                new = seq[:] if t == blank else (seq + [t] if not seq or seq[-1] != t else seq)
                candidates.append((new, lp + lpt))
        candidates.sort(key=lambda x: -x[1])
        beams = candidates[:beam]
    return beams[0][0]
```

生产环境使用带 LM fusion                                                                                                                                                                                                                                                           

### 步骤 3:WER

```python
def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    dp = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        dp[i][0] = i
    for j in range(len(h) + 1):
        dp[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(r)][len(h)] / max(1, len(r))
```

### 步骤 4: đối với Whisper  thực hiện suy luận

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

Đây là một dòng viết của ASR phổ biến mạnh nhất năm 2026 ⋅ trên GPU 24 GB với khoảng 20x thời gian thực ⋅

### Bước 5: sử dụng Parakeet hoặc wav2vec 2.0 để phát trực tuyến

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

Streaming ASR  cần phần mã hóa chú ý và trạng thái vận chuyển; sử dụng hỗ trợ kho của nó(用于 Parakeet của NeMo, hoặc带 `chunk_length_s`của `transformers`đường ống) 

## Sử dụng nó

2026 năm của:

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## Năm 2026 vẫn sẽ phát triển các mỏ sản xuất

- **没有 VAD。**Trong thanh thanh lên vận hành Phầmầm 会产生幻觉 ((("Cảm ơn đã xem!")
- **字符 vs 词 vs subword WER。**Trong bình thường hóa (小写、去标点) *之后* báo cáo词级 WER。
- **Language ID drift。**LID tự động của Whisper sẽ chuyển đoạn âm thanh sai lầm từ tiếng Nhật hoặc tiếng Wales; Khi bạn xác định ngôn ngữ, bắt buộc`language="en"`
- **长片段不做 chunking。**Whisper có 30 giây cửa sổ.`chunk_length_s=30, stride=5`

## 交付 nó

保存为 `outputs/skill-asr-picker.md`◊ Để được triển khai mục tiêu chọn mô hình, giải mã chiến lược, chia cắt và hợp nhất LM

## 练习

1. **Easy。**运行 `code/main.py`Nó sẽ làm việc để giải mã CTC của công trình xây dựng bằng tay, và tính toán so với WER của tài liệu tham khảo.
2. **Medium。**Cần được thực hiện chính xác Bước 2 trong việc tìm kiếm rải cây tiền tố (prefix-tree beam search)
3. **Hard。**Trong [LibriSpeech test-clean](https://www.openslr.org/12)上使用 `whisper-large-v3-turbo`△计算前 100 条 条 语句的 WER──与已发布数字比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| CTC | blank-token loss | 对所有 frame-to-token 对齐做 marginal；非 AR。 |
| RNN-T | streaming loss | CTC + next-token predictor；处理词序。 |
| Attention enc-dec | Whisper-style | Encoder + cross-attending decoder；最佳离线质量。 |
| WER | 你报告的数字 | 词级 `(S+D+I)/N`。 |
| Blank | 空白 | CTC 中表示“此帧无发射”的特殊 Token。 |
| LM fusion | 外部 language model | 在 beam search 期间加入加权 LM log-probs。 |
| VAD | 静音门控 | Voice activity detector；裁剪非语音。 |

## 延伸阅读

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 论文。
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 论文。
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022 năm canonical 论文; v3-turbo 扩展 được phát hành vào năm 2024 年。
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) 2026 Open ASR Leaderboard 榜首──
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 覆盖 25+ mô hình của thực thời điểm chuẩn 
