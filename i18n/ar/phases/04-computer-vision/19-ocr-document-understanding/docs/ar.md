# تفاهم المعلومات والموارد

> OCR هو خط أنابيب ثلاث مراحل  检查文字 مربعات、识别字符,然后排布它们── كل نظام OCR الحديثة سوف يعيد ترتيب هذه المراحل، أو سوف يجمعها──

**类型：**学习 + استخدام
**语言：**بايثون
**先修要求：**المرحلة 4 الدروس 06 (الاكتشاف) ، المرحلة 7 الدروس 02 (الاهتمام الذاتي)
**时间：**45 دقيقة

## 學习目标

- 追踪经典 OCR pipeline(الاكتشاف -> التعرف -> التخطيط)以及现代 اختتام إلى نهاية 替代方案(دونوت، Qwen-VL-OCR)
- لتربية التسلسل إلى التسلسل لـ OCR  تحقيق CTC(التصنيف الزمني المتصل) الخسارة
- استخدام PaddleOCR أو EasyOCR  لتحليل وثائق الإنتاج، لا حاجة للتدريب
- 区分 OCR、布局解析 和理解 الوثائق,并为每任务选择正确工具

## 问题

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图.

هذا المجال ينقسم إلى ثلاثة مستويات مهارة:

1. **OCR proper**:把像素 转换成文本──
2. **Layout parsing**:把 OCR output 分组为 regions ((عنوان، جسم، جدول، رأس)
3. **Document understanding**: من التخطيط 中提取 الحقول المهيكلة (("فواتير_جميع = 42.50 دولار")

كل طبقة لديها طريقة كلاسيكية وطريقة حديثة، وأريد أن أجد الفجوة بين النص والكمية الإجمالية التي أحتاج إليها من الصورة، أكبر مما أدركه معظم الفريق.

## 概念

### خط الأنابيب الكلاسيكي

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
- **Recognition**‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬
- **Layout**重建阅读顺序(拉丁文字为自上而下、从左到右;阿拉伯语、日语则不同)

### معنى الفهم

التعرف على OCR سوف تتبع خريطة ميزات ذات طول ثابت 生成可变长度序列──CTC(Graves et al., 2006)让你无需字符水平排列 就能训练它──模型在每步时间上输出一个覆盖(语音 +空白)

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

CTC هو سبب تأثير CRN في عام 2015 ، ومازال يمتد على معظم نماذج OCR الإنتاج في عام 2026.

### 现代 نماذج من نهاية إلى نهاية

- **Donut**(كيم وزملاء، 2022)  واحد كودر ViT + واحد كودر نص ؛读取图像并直接输出 JSON── بدون كشف نص، بدون وحدات التخطيط──
- **TrOCR** باستخدام VT + مُعدل المتحول لـ OCR على مستوى الخط
- **Qwen-VL-OCR / InternVL** لمهمات OCR تم تحسين نماذج اللغة الرؤية الكاملة ؛ في 2026 سنوات المستندات المعقدة
- **PaddleOCR** منتج منتج منتج 中的经典DB + CRNN خط الأنابيب؛ لا يزال مفتوح المصدر 主力。

النماذج من النهاية إلى النهاية  تحتاج إلى المزيد من البيانات والحسابات ، ولكن قفزت من تراكم الأخطاء في خطوط الأنابيب متعددة المراحل 

### تحليل التخطيط

对于结构文档,运行布局检测器(LayoutLMv3, DocLayNet),为每个地区 标注标签: عنوان, الفقرة, الرسم, الجدول, الملاحظة القدم。

对于表格,使用 **Key-Value extraction**نموذجات (((面向视觉丰富文档的甜圈,面向平坦扫描的布局LMv3) ――它们接收图像 +检测文本 + 位置,并预测结构的关键-值对子──

### مقاييس التقييم

- **Character Error Rate (CER)** مسافة ليفينشتاين / طول المرجعية──越低越好── هدف الإنتاج:干净扫描 上 < 2%──
- **Word Error Rate (WER)**مستوى الكلمة على نفس المعلمة
- **structured fields 上的 F1** تستخدم مهام القيمة الرئيسية ؛ قياس `{invoice_total: 42.50}`نعم نعم حقاً
- **JSON 上的 Edit distance** باستخدام تحليل المستندات من النهاية إلى النهاية؛ ورقة الدونات  قدمت مسافة تصميم الأشجار المعتادة‬


```figure
cv3-ctc-collapse
```

## بناءها

### 步骤 1: CTC الخسارة + طمع المفكّر

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

`F.ctc_loss`في الوقت المتاح استخدام تنفيذ CuDNN عالية الفعالية.

### 步骤 2: متعرف CRNN صغير

باستخدام خط OCR من أقل CNN + BiLSTM.

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

 ارتفاع ثابت المدخلات                                                                                                                                                                                                                                                           

### الخطوة الثالثة: OCR الاصطناعي

生成白底黑字的数字字符串,用于端到端烟雾测试──

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

مجموعة بيانات OCR الحقيقية سوف تضيف الخطوط، الضوضاء، التناوب، اللون والغموض.

### الخطوة الرابعة: رسم التدريب

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

في هذه البيانات الصناعية البسيطة، الخسارة يجب أن تكون في 200 خطوة من ~ 3  ينخفض إلى ~ 0.2 ‬

## استخدمها

三条 طريق الإنتاج:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`.
- **EasyOCR** Python-أصلي 多语言  PythonTorch العمود الفقري
- **Tesseract** 经典方法;在模型表现困难的旧扫描文档上仍然有用──

للفحص المستند من النهاية إلى النهاية، استخدم Donut أو VLM:

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

بالنسبة للحصول على الرسائل والإصدارات والشكلات القابلة للرد، والتحديد على الملفات. بالنسبة لأي مستند أو معدل من الملفات، مثل Qwen-VL-OCR، فإن VLM هو الاختيار المُعتمد حاليا.

## 交付 it

本课产出:

- `outputs/prompt-ocr-stack-picker.md` إشارة، سوف تبعاً لنوع الوثيقة、لغة 和 هيكل  اختيار Tesseract / PaddleOCR / Donut / VLM-OCR‬
- `outputs/skill-ctc-decoder.md` مهارة، سوف تبدأ في كتابة طموحة و تشغيل القيود المعدنية CTC، بما في ذلك التطبيع الطول

## التدريب

1. **（简单）**في سلسلة رقمية عشوائية 5 أرقام 上 تدريب TinyCRNN 500 خطوة ∙ تقرير تمتد على مجموعة ∙ ∙ ∙ ∙
2. **（中等）**استخدام البحث عن الشعاع (((الشارع_الواسعة=5) استبدال التشفير البشعري.
3. **（困难）**في 20 张收据上使用PaddleOCR,提取行 العناصر,并针对 {item_name, price} زوجات مع手工标注地面 الحقيقة 计算 F1。

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

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717)  原始 CNN+RNN+CTC الهندسة المعمارية
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) أوراق CTC الأصلية;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR كومة
