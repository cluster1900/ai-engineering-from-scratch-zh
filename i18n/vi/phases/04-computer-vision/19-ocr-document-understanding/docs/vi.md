# OCR và hiểu văn bản

> OCR là một đường ống ba giai đoạn  检查文字框、识别字符,然后排布它们──每个现代 OCR系统都会重新排序这些阶段,或将它们合并──

**类型：**学习 + 使用
**语言：**Python
**先修要求：**Giai đoạn 4 Bài học 06 (Khám phá), Giai đoạn 7 Bài học 02 (Tự chú ý)
**时间：**~ 45 phút

## Học mục tiêu

- 追踪经典 OCR pipeline(detect -> recognize -> layout) cũng như现代 end-to-end 替代方案(Donut, Qwen-VL-OCR)
- 为 trình tự theo trình tự đào tạo OCR  thực hiện CTC(Classification Temporary Connectionist)
- Sử dụng PaddleOCR hoặc EasyOCR  để phân tích tài liệu sản xuất, không cần đào tạo
- 区分 OCR、layout parsing 和 tài liệu hiểu,并为每个任务选择正确工具

## 问题

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图.

Khu vực này được chia thành ba lớp kỹ năng:

1. **OCR proper**:把像素 转换成 văn bản
2. **Layout parsing**:把 OCR output 分组为地区 (titel, body, table, header)
3. **Document understanding**Từ layout 中提取 cấu trúc các trường (("factory_total = $42.50")

Mỗi tầng đều có phương pháp cổ điển và phương pháp hiện đại, và tôi muốn thấy sự khác biệt giữa văn bản trong hình ảnh và tổng số tiền thu nhập mà tôi cần, lớn hơn so với hầu hết các nhóm nhận ra.

## 概念

### 经典 đường ống

```mermaid
flowchart LR
    IMG["Image"] --> DET["Text detection<br/>(DB, EAST, CRAFT)"]
    DET --> BOX["Word/line<br/>bounding boxes"]
    BOX --> CROP["Crop each region"]
    CROP --> REC["Recognition<br/>(CRNN + CTC)"]
    REC --> TXT["Text strings"]
    TXT --> LAY["Layout<br/>ordering"]
    LAY --> OUT["Reading-order text"]

    style DET fill:#dbeafe,stroke:#2563eb
    style REC fill:#fef3c7,stroke:#d97706
    style OUT fill:#dcfce7,stroke:#16a34a
```

- **Text detection**生成按行或按词的四边形
- **Recognition**Để cắt từng vùng lên độ cao cố định, chạy CNN + BiLSTM + CTC để tạo chuỗi ký tự.
- **Layout**重建读取顺序(拉丁文字为自上而下、从左到右;阿拉伯语、日语则不同)

### 用一段话 hiểu CTC

Tái nhận OCR sẽ được phân phối từ bản đồ tính năng dài cố định 生成可变长度序列──CTC(Graves et al., 2006)让你无需字符级配线 就能训练它──模型在每步上输出一个覆盖(语音+空白) 的分布;CTC mất sẽ đối với tất cả các配线做边缘化, những配线在合并重复并移除空白 后会返原为目标文──

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

CTC là nguyên nhân của hiệu quả của CRNN trong năm 2015, cũng vẫn tập luyện trên hầu hết các mô hình OCR sản xuất năm 2026 

### 现代 mô hình đầu đến cuối

- **Donut**(Kim et al., 2022)  Một trình mã hóa ViT + một trình mã hóa văn bản;读取 hình ảnh并直接输出 JSON── không có máy phát hiện văn bản, không có mô-đun bố trí──
- **TrOCR** Sử dụng cho máy giải mã biến thể ViT + của OCR cấp đường.
- **Qwen-VL-OCR / InternVL** Đối với các nhiệm vụ OCR tinh chỉnh các mô hình ngôn ngữ thị giác hoàn chỉnh; trong các tài liệu phức tạp năm 2026 
- **PaddleOCR** gói sản xuất đã hoàn thành 中的经典 DB + CRNN pipeline; vẫn là nguồn mở 主力。

Các mô hình kết thúc đến kết thúc  cần nhiều dữ liệu và tính toán hơn, nhưng đã vượt qua sự tích lũy lỗi của các đường ống nhiều giai đoạn.

### Phân tích bố cục

对于结构文件,运行布局检测器(LayoutLMv3, DocLayNet),为每个地区 标注标签:Titel, đoạn, Hình, Bảng, Footnote。

对于表格,使用 **Key-Value extraction**mô hình(面向视觉丰富文档的唐纳,面向平面扫描的布局LMv3)──它们接收图像+检测文字+位置,并预测 cấu trúc các cặp giá trị khóa-quýền──

### Các số liệu đánh giá

- **Character Error Rate (CER)** Distances Levenshtein / chiều dài tham chiếu──越低越好──T mục tiêu sản xuất:干净 scans 上 < 2%──
- **Word Error Rate (WER)** từ cấp trên cùng một chỉ số.
- **structured fields 上的 F1** Sử dụng cho các nhiệm vụ có giá trị chính; đo lường `{invoice_total: 42.50}`Có phải đúng là xuất hiện không?
- **JSON 上的 Edit distance** Sử dụng để phân tích tài liệu từ đầu đến cuối; giấy donut  giới thiệu khoảng cách chỉnh sửa cây bình thường.


```figure
cv3-ctc-collapse
```

##  xây dựng nó

### 步骤 1: CTC Loss + tham lam decoder

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


def ctc_loss(log_probs, targets, input_lengths, target_lengths, blank=0):
    """
    log_probs:      (T, N, C) log-softmax over vocab including blank at index 0
    targets:        (N, S) int targets (no blanks)
    input_lengths:  (N,) per-sample time steps used
    target_lengths: (N,) per-sample target length
    """
    return F.ctc_loss(log_probs, targets, input_lengths, target_lengths,
                      blank=blank, reduction="mean", zero_infinity=True)


def greedy_ctc_decode(log_probs, blank=0):
    """
    log_probs: (T, N, C) log-softmax
    returns: list of index sequences (blanks removed, repeats merged)
    """
    preds = log_probs.argmax(dim=-1).transpose(0, 1).cpu().tolist()
    out = []
    for seq in preds:
        decoded = []
        prev = None
        for idx in seq:
            if idx != prev and idx != blank:
                decoded.append(idx)
            prev = idx
        out.append(decoded)
    return out
```

`F.ctc_loss`Trong thời gian sử dụng, thực hiện CuDNN hiệu quả hơn.

### 步骤 2:Tiny CRNN recognition

Sử dụng OCR đường tối thiểu của CNN + BiLSTM。

```python
class TinyCRNN(nn.Module):
    def __init__(self, vocab_size=40, hidden=128, feat=32):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, feat, 3, 1, 1), nn.BatchNorm2d(feat), nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(feat, feat * 2, 3, 1, 1), nn.BatchNorm2d(feat * 2), nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(feat * 2, feat * 4, 3, 1, 1), nn.BatchNorm2d(feat * 4), nn.ReLU(inplace=True),
            nn.MaxPool2d((2, 1)),
            nn.Conv2d(feat * 4, feat * 4, 3, 1, 1), nn.BatchNorm2d(feat * 4), nn.ReLU(inplace=True),
            nn.MaxPool2d((2, 1)),
        )
        self.rnn = nn.LSTM(feat * 4, hidden, bidirectional=True, batch_first=True)
        self.head = nn.Linear(hidden * 2, vocab_size)

    def forward(self, x):
        # x: (N, 1, H, W)
        f = self.cnn(x)                # (N, C, H', W')
        f = f.mean(dim=2).transpose(1, 2)  # (N, W', C)
        h, _ = self.rnn(f)
        return F.log_softmax(self.head(h).transpose(0, 1), dim=-1)  # (W', N, vocab)
```

 Độ cao cố định nhập vào  CNN max-pools 会把 độ cao áp suất đến 1);; chiều rộng là chiều thời gian của CTC;;

### 步骤 3: OCR tổng hợp

生成白底黑字的数字字符串, được sử dụng để kiểm tra khói từ đầu đến cuối

```python
import numpy as np

def synthetic_line(text, height=32, char_width=16):
    W = char_width * len(text)
    img = np.ones((height, W), dtype=np.float32)
    for i, c in enumerate(text):
        x = i * char_width
        shade = 0.0 if c.isalnum() else 0.5
        img[6:height - 6, x + 2:x + char_width - 2] = shade
    return img


def build_batch(strings, vocab):
    H = 32
    W = 16 * max(len(s) for s in strings)
    imgs = np.ones((len(strings), 1, H, W), dtype=np.float32)
    target_lengths = []
    targets = []
    for i, s in enumerate(strings):
        imgs[i, 0, :, :16 * len(s)] = synthetic_line(s)
        ids = [vocab.index(c) for c in s]
        targets.extend(ids)
        target_lengths.append(len(ids))
    return torch.from_numpy(imgs), torch.tensor(targets), torch.tensor(target_lengths)


vocab = ["_"] + list("0123456789abcdefghijklmnopqrstuvwxyz")
imgs, targets, lengths = build_batch(["hello", "world"], vocab)
print(f"images: {imgs.shape}   targets: {targets.shape}   lengths: {lengths.tolist()}")
```

Real OCR dữ liệu sẽ thêm font, tiếng ồn, quay, mờ và màu sắc.

### Bước 4: Bản phác thảo đào tạo

```python
model = TinyCRNN(vocab_size=len(vocab))
opt = torch.optim.Adam(model.parameters(), lr=1e-3)

for step in range(200):
    strings = ["abc" + str(step % 10)] * 4 + ["xyz" + str((step + 1) % 10)] * 4
    imgs, targets, target_lens = build_batch(strings, vocab)
    log_probs = model(imgs)  # (W', 8, vocab)
    input_lens = torch.full((8,), log_probs.size(0), dtype=torch.long)
    loss = ctc_loss(log_probs, targets, input_lens, target_lens, blank=0)
    opt.zero_grad(); loss.backward(); opt.step()
```

Trong dữ liệu tổng hợp đơn giản này, mất mát nên xảy ra trong 200 bước từ ~3 giảm xuống ~0.2

## Sử dụng nó

三条 sản xuất 路径:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`
- **EasyOCR** Python-native、多语言、PyTorch xương sống。
- **Tesseract** 经典方法; trên các mô hình biểu hiện khó khăn của các tài liệu quét cũ 上仍然有用──

Đối với phân tích tài liệu từ đầu đến cuối, sử dụng Donut hoặc VLM:

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

Đối với các hình thức nhận, phát phiếu và cấu trúc có thể lặp lại, tinh chỉnh Donut. Đối với bất kỳ tài liệu hoặc lý luận OCR, tương tự như Qwen-VL-OCR của VLM là hiện tại được chọn lựa.

## 交付 nó

本课产 出:

- `outputs/prompt-ocr-stack-picker.md` Một lời nhắc, sẽ tùy thuộc vào loại tài liệu, ngôn ngữ và cấu trúc  chọn Tesseract / PaddleOCR / Donut / VLM-OCR。
- `outputs/skill-ctc-decoder.md` Một kỹ năng, sẽ bắt đầu viết tham lam và phân mã CTC tìm kiếm chùm, bao gồm cả chuẩn hóa chiều dài.

## 练习

1. **（简单）**Trong chuỗi số ngẫu nhiên 5 chữ số 上训练 TinyCRNN 500 bước.
2. **（中等）**Sử dụng tìm kiếm chùm chùm ((beam_width=5) thay thế mã hóa tham lam ⋅ báo cáo CER delta⋅ tìm kiếm chùm chùm Trong những đầu vào nào có thể đạt được thành công?
3. **（困难）**Trong 20 张收据上使用 PaddleOCR,提取线条,并针对 {item_name, price} cặp với手工标注地面真相 计算 F1。

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|----------------------|
| OCR | “Text from pixels” | 将 image regions 转换为 character sequences |
| CTC | “Alignment-free loss” | 无需 per-timestep labels 即可训练 sequence model 的 Loss；对 alignments 做 marginalise |
| CRNN | “Classic OCR model” | Conv feature extractor + BiLSTM + CTC；这个 2015 baseline 仍用于 production |
| Donut | “End-to-end OCR” | ViT encoder + text decoder；直接从 image 输出 JSON |
| Layout parsing | “Find regions” | 在 document 中检测并标注 Title/Table/Figure/Paragraph regions |
| Reading order | “Text sequence” | 将 recognised regions 排列成 sentence；对拉丁文字很简单，对 mixed layouts 并不简单 |
| CER / WER | “Error rates” | character 或 word granularity 上的 Levenshtein distance / reference length |
| VLM-OCR | “LLM that reads” | 为 OCR tasks 训练或提示的 vision-language model；当前在复杂 documents 上是 SOTA |

## 延伸阅读

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) 原始 CNN+RNN+CTC kiến trúc
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC giấy nguyên thủy;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR stack
