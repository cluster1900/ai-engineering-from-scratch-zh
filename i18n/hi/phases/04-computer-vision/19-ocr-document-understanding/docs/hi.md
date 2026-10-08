# ओसीआर और अभिलेख समझ

> ओसीआर एक तीन चरण पाइपलाइन है  检查文字框、识别字符,然后排布它们── प्रत्येक आधुनिक ओसीआर प्रणाली इन चरणों को पुनः क्रमबद्ध करेगी, या उन्हें एक साथ संरेखित करेगी──

**类型：**学习 + 使用
**语言：**पायथन
**先修要求：**चरण 4 पाठ 06 (डिटेक्शन), चरण 7 पाठ 02 (स्व-ध्यान)
**时间：**~ 45 मिनट

## 学习目标

- 追踪 क्लासिक ओसीआर पाइपलाइन(डिटेक्ट -> पहचानें -> लेआउट) तथा आधुनिक अंत-से-अंत 替代方案(डोनट, क्यूवेन-वीएल-ओसीआर)
-  क्रमिक-से-क्रमिक ओसीआर प्रशिक्षण  CTC को प्राप्त करना
- उपयोग PaddleOCR या EasyOCR  उत्पादन दस्तावेज विश्लेषण करने के लिए, प्रशिक्षण की आवश्यकता नहीं
- 区分 OCR、layout parsing 和 दस्तावेज़ समझ,并为每任务选择正确工具

## 问题

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图――中提取结构化数据                                                                                                                                                                                                                                         

इस क्षेत्र में तीन कौशल स्तरों में विभाजित हैः

1. **OCR proper**:把 पिक्सेल 转换成文字──
2. **Layout parsing**:把 OCR आउटपुट 分组为区域(शीर्षक, शरीर, तालिका, शीर्षक)
3. **Document understanding**: लेआउट से 中提取 संरचित फ़ील्ड्स (("इंवॉइस_कुल = $42.50")

प्रत्येक स्तर में क्लासिक और आधुनिक तरीके होते हैं, और मैं छवि से पाठ प्राप्त करने के लिए और मुझे इस राशि की कुल राशि के बीच अंतर की आवश्यकता होती है, जो अधिकांश टीमों की तुलना में अधिक है।

## 概念

### 经典 पाइपलाइन

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

- **Text detection**                                                                                                                                                                                                                                                              
- **Recognition**प्रत्येक क्षेत्र को तय ऊंचाई तक काटना, CNN + BiLSTM + CTC को चलाने के लिए चरित्र अनुक्रम उत्पन्न करना
- **Layout**पुनः निर्माण पढ़ने का क्रम (((लैटिन लिपि स्वर् ऊपर और नीचे से  से बाएं से दाएं; अरबी भाषा 日语则不同) 

### CTC को समझने के लिए

OCR मान्यता निश्चित लंबाई के सुविधा मानचित्र से उत्पन्न होगा 生成可变长度序列──CTC(Graves et al., 2006) आपको वर्ण-स्तर संरेखण की आवश्यकता नहीं है 就能训练它──模型在每时间步上输出一个覆盖(语音 + रिक्त) का वितरण;CTC हानि सभी संरेखणों पर होगा, इन संरेखणों को एक साथ जोड़ें, फिर से जोड़ें और रिक्त स्थानों को हटा दें 后会返原为目标文──

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

सीटीसी 2015 में सीआरएनएन के प्रभाव का कारण है, 2026 में अधिकांश उत्पादन ओसीआर मॉडल पर भी प्रशिक्षण जारी है।

### 现代 एंड-टू-एंड मॉडल

- **Donut**(किम और अन्य, 2022)  एक वीआईटी एन्कोडर + एक पाठ डिकोडर;读取图像并直接输出 JSON──没有文字探测器,没有布局模块──
- **TrOCR** लाइन-स्तर ओसीआर के वीटी + ट्रांसफार्मर डिकोडर के साथ प्रयोग किया गया है。
- **Qwen-VL-OCR / InternVL** OCR कार्यों के लिए परिष्कृत पूर्ण दृष्टि-भाषा मॉडल; 2026 में जटिल दस्तावेजों पर सटीकता सर्वोत्कृष्ट
- **PaddleOCR** परिपक्व उत्पादन पैकेज 中的经典 DB + CRNN पाइपलाइन; अभी भी ओपन सोर्स है 主力。

अंत-से-अंत मॉडल  अधिक डेटा और गणना की आवश्यकता है, लेकिन बहु-चरण पाइपलाइनों के त्रुटि संचय से अधिक कूद गया है 

### लेआउट पार्सिंग

对于结构文档,运行布局检测器(LayoutLMv3, DocLayNet),为每个地区 标注标签标签:शीर्षक, पैराग्राफ, आकृति, तालिका, पाद लेख。पठन क्रम 于是变成按布局顺序 遍历地区并拼接──

对于表格,使用 **Key-Value extraction**मॉडल(आदर्श रूप से समृद्ध दस्तावेजों का डोनट,आदर्श रूप से सादे स्कैन का लेआउटLMv3)──它们接收图像+检测文本+स्थिति,并预测 संरचित कुंजी-मूल्य जोड़े──

### मूल्यांकन मेट्रिक्स

- **Character Error Rate (CER)** लेवेंसस्टीन दूरी / संदर्भ लंबाई──越低越好──उत्पादन लक्ष्य:干净 स्कैन 上 < 2%──
- **Word Error Rate (WER)** शब्द स्तर ऊपर एक ही संकेत
- **structured fields 上的 F1** प्रमुख-मूल्य कार्यों के लिए उपयोग किया जाता है; माप `{invoice_total: 42.50}`                                                                                                                                                                                                                                                              
- **JSON 上的 Edit distance** अंत-से-अंत दस्तावेज़ विश्लेषण के लिए उपयोग किया गया; डोनट पेपर  ने एक सामान्य वृक्ष संपादन दूरी शुरू की 


```figure
cv3-ctc-collapse
```

##  इसे निर्माण

### 步骤 1: सीटीसी हानि + लालची डिकोडर

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

`F.ctc_loss`उपयोग के समय उच्च कुशल CuDNN कार्यान्वयन में उपयोग करते समय, लालची डिकोडर बीम खोज से अधिक सरल है, आमतौर पर इसके सीईआर के साथ 1% के भीतर है।

### 步骤 2:छोटा CRNN पहचानकर्ता

लाइन ओसीआर के न्यूनतम सीएनएन + BiLSTM पर उपयोग करेंः

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

固定 height input(CNN max-pools 会把高度压到 1)──宽度是CTC का समय आयाम──

### 步骤 3: सिंथेटिक ओसीआर

生成白底黑字的数字字符串, अंत से अंत तक धुएं परीक्षण के लिए प्रयोग किया जाता है

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

वास्तविक ओसीआर डेटासेट में फ़ॉन्ट, शोर, घूर्णन, धुंध और रंग जोड़े जाएंगे।

### 步骤 4: प्रशिक्षण स्केच

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

इस सरल सिंथेटिक डेटा में, हानि 200 कदम में होना चाहिए अंदर ~ 3 ~ 0.2 से नीचे

## इसका उपयोग करें

三条 उत्पादन मार्ग:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`
- **EasyOCR** पायथन-नेटिव、多语言、पायटॉर्च रीढ़ की हड्डी──
- **Tesseract** 经典方法;  经典方法;  经典方法;  经典方法;  经典方法;  经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典方法; 经典文件; 经典文件; 经典的模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型; 模型

एंड-टू-एंड दस्तावेज़ पार्सिंग के लिए, Donut या VLM का उपयोग करेंः

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

收据、发票以及结构可重复的形式,fine-tune Donut── किसी भी दस्तावेज अथवा तर्क के साथ OCR के लिए, Qwen-VL-OCR के समान VLM है।

## 交付 यह

本课产出:

- `outputs/prompt-ocr-stack-picker.md` एक संकेत, दस्तावेज प्रकार, भाषा एवं संरचना के आधार पर  चयन Tesseract / PaddleOCR / Donut / VLM-OCR
- `outputs/skill-ctc-decoder.md` एक कौशल, लालची और बीम-खोज सीटीसी डिकोडर, लंबाई सामान्यीकरण सहित से शुरू होगा

## अभ्यास

1. **（简单）**५ अंकों की यादृच्छिक संख्यात्मक स्ट्रिंग में अप ट्रेनिंग TinyCRNN ५०० कदमों में--- रिपोर्ट आयोजित सेट ऊपर के CER---
2. **（中等）**प्रयोग बीम खोज ((beam_width=5) लोभी डिकोडिंग को प्रतिस्थापित करें।
3. **（困难）**张收据上使用PaddleOCR,提取线条,并针对 {item_name, price} जोड़े 与手工标注地面真相 计算 F1。

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

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) 原始 सीएनएन+आरएनएन+सीटीसी वास्तुकला
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) मूल सीटीसी पेपर;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR स्टैक
