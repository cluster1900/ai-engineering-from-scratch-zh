# 文件理解和 OCR

> 检查文字框,识别字符,然后排列它们. 每个现代的OCR系统都会重新排列这些阶段,或将它们合并.

**类型：**学习 + 使用
**语言：**字符串
**先修要求：**阶段4课06 (检测),阶段7课02 (自我注意)
**时间：**时间45分钟

## 学习目标

- 追踪经典OCR管道 (检测 ->识别 -> 布局) 以及现代端到端的替代方案 (Donut, Qwen-VL-OCR)
- 为序列到序列OCR培训 实现CTC(连接主义时间分类)损失
- 使用PaddleOCR或EasyOCR 进行生产文件分析,无需训练
- 区分 OCR、布局解析和文件理解,并为每个任务选择正确工具

## 问题

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图.

这个领域分为三个技能层:

1. **OCR proper**转换成文字.
2. **Layout parsing**:把OCR输出 分组为区域 ((标题,体格,表格,标题)
3. **Document understanding**根据布局中提取结构化字段:"发票_总额 = 42.50美元")

每层都有经典方法和现代方法,而我想从图像中得到文字和我需要的收费总额之间的差距,

## 概念

### 经典管道

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

- **Text detection**生成按行或按词的四边形.
- **Recognition**将每个区域切割到固定高度,运行CNN+BLSTM+CTC生成字符序列.
- **Layout**重建阅读顺序(拉丁文字为自上而下、从左到右;阿拉伯语、日语则不同)

### 用一段话理解CTC

通过固定长度的特征地图 生成可变长度序列――CTC(Graves等,2006) 让你无需的字符级排列就能训练它――模型在每一步上输出一个覆盖的语 +空白) 分布;CTC损失会对所有排列做边缘化,这些排列在合并重复并移除空白后会返回为目标文本――

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

由于CRN在2015年效果的原因,CTC仍然在2026年大部分生产的OCR模型中训练.

### 现代端到端型号

- **Donut**读取图像并直接输出JSON──没有文字探测器,没有布局模块──
- **TrOCR** 用于线级OCR的VIT+变压器解码器──
- **Qwen-VL-OCR / InternVL** 为OCR任务精细调整完整的视觉语言模型; 在2026年复杂的文件上精度最好.
- **PaddleOCR**已熟成的生产包 中的经典DB + CRNN管道;仍然是开源 主力──

端到端的模型需要更多的数据和计算,但跳过了多阶段的错误积累.

### 布局分析

对于结构文档,运行布局检测器 (LayoutLMv3, DocLayNet),为每个地区标签标签标签:标题,段落,图,表,脚注――阅读顺序 于是变成按布局顺序 遍历地区并拼接──

对于表格,使用**Key-Value extraction**面向视觉丰富的文档的甜点,面向平坦扫描的布局LMv3) ――它们接收图像+检测的文本+位置,并预测结构化键值对子――

### 评估指标

- **Character Error Rate (CER)** 莱文施泰因距离/参考长度──越低越好──生产目标:干净扫描 上 < 2%──
- **Word Error Rate (WER)**词级上同样的标志――
- **structured fields 上的 F1** 用于关键价值任务;衡量`{invoice_total: 42.50}`是否正确出现.
- **JSON 上的 Edit distance** 用于端到端的文件解析; 甜点纸引入了标准化的树编辑距离――


```figure
cv3-ctc-collapse
```

## 构建它

### 步骤1:CTC损失+贪的解码器

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

`F.ctc_loss`在可用时使用高效的CuDNN实现中,贪解码器比光束搜索更简单,通常与其CER相差在1%以内.

### 步骤2:小的CRNN识别器

用线条OCR的最小CNN+BILSTM.

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

固定高度输入 (CNN) 最大积分将高度压到 1) ⋅宽度是CTC的时间尺寸.

### 步骤3:合成OCR

生成白底黑字的数字字符串,用于端到端烟雾测试.

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

真实OCR数据集会添加字体,噪音,旋转,模糊和颜色.

### 步骤4:培训草图

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

在这个简单的合成数据上,损失应该在200步内从 ~3 降到 ~0.2 .

## 使用它

三条生产路径:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`,我知道.
- **EasyOCR** 字符串原生,多语言,PyTorch脊柱.
- **Tesseract** 经典方法;在模型中表现困难的旧扫描文档上仍然有用.

对于端到端的文件解析,使用Donut或VLM:

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

对于收据,发票以及可重复的形式,细调顿.对于任意文件或带有推理的OCR,类似于Qwen-VL-OCR的VLM是当前默认选择.

## 交付它

本课产出:

- `outputs/prompt-ocr-stack-picker.md` 一个提示,会根据文档类型,语言和结构选择Tesseract / PaddleOCR / Donut / VLM-OCR──
- `outputs/skill-ctc-decoder.md` 一个技能,会从编写贪和光束搜索CTC解码器,包括长度规范化.

## 练习

1. **（简单）**在5位数随机数字符串上训练小CRNN500步.
2. **（中等）**用光束搜索(光束_宽度=5) 替换贪的解码――报告 CER 德尔塔――光束搜索 在哪些输入上获胜?
3. **（困难）**在 20 张收据上使用PaddleOCR,提取线条物,并针对 {item_name,价格} 双与手工标注地面真相 计算 F1。

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

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) 原始 CNN+RNN+CTC架构
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) 原始CTC纸;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR堆
