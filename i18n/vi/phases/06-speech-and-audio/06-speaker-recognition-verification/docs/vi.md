# Nói chuyện người nhận dạng và chứng nhận

> ASR hỏi là họ nói gì?  Nhận thức người nói  hỏi là  là ai nói?  hình thức toán học trông giống như, tức là Nhập thêm Cosine, nhưng mỗi quyết định sản xuất đều phụ thuộc vào một số EER đơn lẻ.

**类型：**Xây dựng
**语言：**Python
**先修要求：**Giai đoạn 6 · 02 (Spectograms & Mel), Giai đoạn 5 · 22 (Các mô hình nhúng)
**时间：**~ 45 phút

## 问题

Người dùng nói một câu mật khẩu. Bạn có biết: Đây không phải là người mà họ tuyên bố là người đó không?

2018 trước:GMM-UBM + i-vectors。EER 尚可, nhưng đối với chuyển đổi kênh(cô điện thoại so với máy tính xách tay) 和情绪很脆弱。20182022:x-vectors(Using angular margin 训练的 TDNN backbone)。2022+:ECAPA-TDNN 和 WavLM-large Embedding。到2026年,这个领域由三个模型和一个指标主导──

Chỉ số này là**EER**,即 均误率──设置你的决策值,使 false accept rate = false reject rate──交叉点就是 EER──每篇论文、每名表、每次采购评审都会使用它──

## 概念

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline。**Đăng ký:录制目标说话人 530秒音频;计算固定维度 嵌入(ECAPA-TDNN 为 192-d,WavLM-large 为 256-d) ――Verification:获取测试演说的嵌入;计算Cosine similarity;与值比较──

**ECAPA-TDNN（2020，2026 仍占主导）。**Căng cường Cảnh sát kênh, Chuyện truyền và tập hợp - Time-Delay Neural Network──1D conv blocks,带 squeeze-excitation、multi-head attention pooling,后接一个线性层 得到192-d──使用Additive Angular Margin loss(AAM-softmax) 在 VoxCeleb 1+2(2,700 个说话人,1.1M 条 语句) 上训练──

**WavLM-SV（2022+）。**Sử dụng AAM mất tinh chỉnh 预训练 WavLM-lớn xương sống SSL──质量更高但更慢,300+ MB vs 15 MB──

**x-vector（baseline）。**TDNN + thống kê tập hợp.

**AAM-softmax。**Trong không gian góc 中加入边缘 `m`                                                                                                                                                                                                                                                              `cos(θ + m)`△强制类别间 phân vùng góc △典型设置为 `m=0.2`, quy mô `s=30`

### Điểm số

- **Cosine**Sử dụng để so sánh đăng ký và kiểm tra 
- **PLDA (Probabilistic LDA)。**Sẽ được tích hợp 投影 vào không gian ẩn, trong đó cùng loa so với người nói khác nhau có tỷ lệ xác suất hình thức đóng góp trên Cosine 之上, có thể giảm 1020% EER。
- **Score normalization。** `S-norm`Hoặc`AS-norm`: dùng một nhóm nhóm người giả mạo của nhóm 平均值和 std đối với mỗi điểm 进行归化―― đối với phân tích qua miền 很关键――

### Bạn nên biết số của số(2026)

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### Lượng chảy máu

Trong nhiều bài nói chuyện người nghe trong một đoạn phim, người ta sẽ thấy những gì họ đang nói.`pyannote.audio`3.1, nó đưa bộ phận loa + nhúng + cluster 封装在一次调用后面──2026 năm AMI 上的 SOTA DER 约为15%(低于2022年的23%)──


```figure
sp-eer-crossover
```

##  xây dựng nó
### 步骤 1: Từ số liệu thống kê của MFCC  cấu trúc đồ chơi Nhập

```python
def embed_mfcc_stats(signal, sr):
    frames = featurize_mfcc(signal, sr, n_mfcc=13)
    mean = [sum(f[i] for f in frames) / len(frames) for i in range(13)]
    std = [
        math.sqrt(sum((f[i] - mean[i]) ** 2 for f in frames) / len(frames))
        for i in range(13)
    ]
    return mean + std  # 26-d
```

离 SOTA 很远, chỉ dùng để dạy.`code/main.py`Giống như dữ liệu loa tổng hợp trên bằng chứng khái niệm.

### 步骤 2:Cosine similarity + threshold

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### 步骤 3: Từ các cặp tương đồng  tính EER

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 1.0, 0.0)  # (fa, fr, threshold)
    for t in thresholds:
        fr = sum(1 for s in same_scores if s < t) / len(same_scores)
        fa = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        if abs(fa - fr) < abs(best[0] - best[1]):
            best = (fa, fr, t)
    return (best[0] + best[1]) / 2, best[2]
```

返回 (eer, threshold_at_eer) ⋅两个必须报告──

### 步骤 4: sử dụng SpeechBrain để thực hiện sản xuất

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### 步骤 5: sử dụng pianonote làm nhật ký

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## Sử dụng nó
2026 năm:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## 陷
- **Channel mismatch。**Trong VoxCeleb (video trên web) mô hình tập luyện ≠ điện thoại-call âm thanh──始终在目标频道上评估──
- **短 utterance。**测试音频低于3秒时,EER 会急剧变差──
- **带噪声的 enrollment。**Một số người tham gia sẽ bị nhiễm bẩn.
- **跨条件固定阈值。**始终在来自目标域的持久的 dev set 上调值──
- **对未归一化 Embedding 使用 Cosine。**Trước làm L2 bình thường hóa; nếu không độ lớn 会主导结果。

## 交付 nó
保存为 `outputs/skill-speaker-verifier.md` lựa chọn mô hình, giao thức đăng ký, kế hoạch điều chỉnh ngưỡng và bảo vệ gian lận.

## 练习
1. **Easy。**运行 `code/main.py` xây dựng loa tổng hợp ( hồ sơ âm thanh khác nhau), thực hiện đăng ký, và trong danh sách thử nghiệm 100 cặp 上计算 EER。
2. **Medium。**Trong 30 条 VoxCeleb1 phát biểu(5 个扬声器 × 每人 6 条) 上使用SpeechBrain ECAPA──比较Cosine vs PLDA 的 EER──
3. **Hard。**Sử dụng `pyannote.audio`构建完整注册 → nhật ký → xác minh đường ống ống.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| EER | 标题指标 | False Accept = False Reject 时的阈值。 |
| Verification | 1:1 | “这是 Alice 吗？” |
| Identification | 1:N | “是谁在说话？” |
| Open-set | 可能未知 | Test set 可以包含未 enrollment 的说话人。 |
| Enrollment | 注册 | 计算说话人的 reference Embedding。 |
| AAM-softmax | Loss | 带 additive angular margin 的 softmax；强制 cluster separation。 |
| PLDA | 经典 scoring | Probabilistic LDA；在 Embedding 之上做 likelihood-ratio scoring。 |
| DER | Diarization metric | Diarization Error Rate，即 miss + false alarm + confusion。 |

## 延伸阅读
- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 经典 sâu sắc 论文。
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143) 20202026 năm chủ导架构──
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) Sử dụng SV và nhật ký hóa của SSL cột sống.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) 生产级日记化 + Lập vào hàng.
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 当前各模型的 EER 排名──
