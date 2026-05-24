# OCR 与文档理解

> OCR 是一个三阶段 pipeline —— 检测 text boxes、识别 characters，然后排布它们。每个现代 OCR system 都会重新排序这些阶段，或将它们合并。

**类型：** 学习 + 使用
**语言：** Python
**先修要求：** Phase 4 Lesson 06 (Detection), Phase 7 Lesson 02 (Self-Attention)
**时间：** ~45 分钟

## 学习目标

- 追踪经典 OCR pipeline（detect -> recognise -> layout）以及现代 end-to-end 替代方案（Donut, Qwen-VL-OCR）
- 为 sequence-to-sequence OCR training 实现 CTC（Connectionist Temporal Classification）loss
- 使用 PaddleOCR 或 EasyOCR 进行 production document parsing，无需训练
- 区分 OCR、layout parsing 和 document understanding，并为每个任务选择正确工具

## 问题

充满文本的 images 无处不在：收据、发票、ID、扫描书籍、表单、白板、标牌、截图。从中提取结构化数据 —— 不只是 characters，而是“这是总金额” —— 是价值最高的 applied-vision 问题之一。

这个领域分为三个技能层：

1. **OCR proper**：把 pixels 转成 text。
2. **Layout parsing**：把 OCR output 分组为 regions（title, body, table, header）。
3. **Document understanding**：从 layout 中提取 structured fields（"invoice_total = $42.50"）。

每一层都有经典方法和现代方法，而“我想从 image 中得到 text”和“我需要这张收据的总金额”之间的差距，比大多数团队意识到的更大。

## 概念

### 经典 pipeline

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

- **Text detection** 生成按行或按词的 quadrilaterals。
- **Recognition** 将每个 region 裁剪到固定高度，运行 CNN + BiLSTM + CTC 来生成 character sequence。
- **Layout** 重建 reading order（拉丁文字为自上而下、从左到右；阿拉伯语、日语则不同）。

### 用一段话理解 CTC

OCR recognition 会从固定长度的 feature map 生成可变长度 sequence。CTC（Graves et al., 2006）让你无需 character-level alignment 就能训练它。模型在每个 time step 上输出一个覆盖（vocab + blank）的 distribution；CTC loss 会对所有 alignments 做 marginalise，这些 alignments 在合并重复并移除 blanks 后会还原为 target text。

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

CTC 是 CRNN 在 2015 年奏效的原因，也仍然训练着 2026 年的大多数 production OCR models。

### 现代 end-to-end models

- **Donut** (Kim et al., 2022) —— 一个 ViT encoder + 一个 text decoder；读取 image 并直接输出 JSON。没有 text detector，没有 layout module。
- **TrOCR** —— 用于 line-level OCR 的 ViT + transformer decoder。
- **Qwen-VL-OCR / InternVL** —— 为 OCR tasks fine-tuned 的完整 vision-language models；在 2026 年复杂 documents 上 accuracy 最好。
- **PaddleOCR** —— 成熟 production package 中的经典 DB + CRNN pipeline；仍然是 open-source 主力。

End-to-end models 需要更多数据和 compute，但跳过了 multi-stage pipelines 的 error accumulation。

### Layout parsing

对于 structured documents，运行 layout detector（LayoutLMv3, DocLayNet），为每个 region 标注 label：Title, Paragraph, Figure, Table, Footnote。Reading order 于是变成“按 layout order 遍历 regions 并拼接”。

对于 forms，使用 **Key-Value extraction** models（面向 visually-rich documents 的 Donut，面向 plain scans 的 LayoutLMv3）。它们接收 image + detected text + positions，并预测 structured key-value pairs。

### Evaluation metrics

- **Character Error Rate (CER)** —— Levenshtein distance / reference length。越低越好。Production target：干净 scans 上 < 2%。
- **Word Error Rate (WER)** —— word level 上相同的指标。
- **structured fields 上的 F1** —— 用于 key-value tasks；衡量 `{invoice_total: 42.50}` 是否正确出现。
- **JSON 上的 Edit distance** —— 用于 end-to-end document parsing；Donut paper 引入了 normalised tree edit distance。

## 构建它

### 步骤 1: CTC Loss + greedy decoder

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

`F.ctc_loss` 在可用时使用高效的 CuDNN implementation。greedy decoder 比 beam search 更简单，通常与其 CER 相差在 1% 以内。

### 步骤 2：Tiny CRNN recogniser

用于 line OCR 的最小 CNN + BiLSTM。

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

固定高度 input（CNN max-pools 会把高度压到 1）。宽度是 CTC 的 time dimension。

### 步骤 3： Synthetic OCR

生成白底黑字的 digit strings，用于 end-to-end smoke test。

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

真实 OCR dataset 会添加 fonts、noise、rotation、blur 和 colour。上面的 pipeline 是相同的。

### 步骤 4： Training sketch

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

在这个简单 synthetic data 上，loss 应该会在 200 steps 内从 ~3 降到 ~0.2。

## 使用它

三条 production 路径：

- **PaddleOCR** —— 成熟、快速、多语言。一行用法：`paddleocr.PaddleOCR(lang="en").ocr(image_path)`。
- **EasyOCR** —— Python-native、多语言、PyTorch backbone。
- **Tesseract** —— 经典方法；在 models 表现困难的旧扫描 documents 上仍然有用。

对于 end-to-end document parsing，使用 Donut 或 VLM：

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

对于收据、发票以及结构可重复的 forms，fine-tune Donut。对于任意 documents 或带 reasoning 的 OCR，类似 Qwen-VL-OCR 的 VLM 是当前默认选择。

## 交付它

本课产出：

- `outputs/prompt-ocr-stack-picker.md` —— 一个 prompt，会根据 document type、language 和 structure 选择 Tesseract / PaddleOCR / Donut / VLM-OCR。
- `outputs/skill-ctc-decoder.md` —— 一个 skill，会从头编写 greedy 和 beam-search CTC decoders，包括 length normalisation。

## 练习

1. **（简单）** 在 5-digit random numeric strings 上训练 TinyCRNN 500 steps。报告 held-out set 上的 CER。
2. **（中等）** 用 beam search（beam_width=5）替换 greedy decoding。报告 CER delta。beam search 在哪些 inputs 上获胜？
3. **（困难）** 在 20 张收据上使用 PaddleOCR，提取 line items，并针对 {item_name, price} pairs 与手工标注 ground truth 计算 F1。

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

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) —— 原始 CNN+RNN+CTC architecture
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) —— 原始 CTC paper；密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) —— 无 OCR 的文档理解 transformer
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) —— 开源生产级 OCR stack
