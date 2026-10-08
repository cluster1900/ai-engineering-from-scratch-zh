# OCR ve dosya anlayışı

> OCR bir üç aşamalı boru hattıdır  检查文字框、识别字符,然后排布它们──每个现代 OCR系统都会重新排序这些阶段,或将它们合并──

**类型：**学习 + 使用
**语言：**Python
**先修要求：**4. Fase 06 Ders (Detection), 7. Fase 02 Ders (Self Attention)
**时间：**~ 45 dakika

## Öğrenme hedefi

- 追踪经典 OCR borusu(detekte -> tanın -> düzen)
- Çeviri-sıra OCR eğitimi  CTC Connectionist Temporary Classification 
- PaddleOCR veya EasyOCR kullanmak  üretim belgeleri analiz etmek için, hiç eğitim gerekmiyor
- 区分 OCR、layout parsing 和 document understanding,并为每个任务选择正确工具

## 问题

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图;; 中提取结构化数据 不仅是字符,而这是总金额是价值最高的应用视觉问题之一

Bu alan üç beceri seviyesine ayrılmıştır:

1. **OCR proper**:把像素 转成文──
2. **Layout parsing**:把 OCR çıktı 分组为地区 (Üzerinde, gövde, tablo, başlık)
3. **Document understanding**: From layout 中提取 yapılandırılmış alanlar("faktura_total = $42.50")

Her katmanın klasik ve modern yöntemleri vardır. Ama resimden elde edilen metin ve toplam toplam toplam miktar arasındaki fark, çoğu ekip fark ettiğinden daha büyüktür.

## 概念

### 经典 boru hattı

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

- **Text detection**Çekirteler, söz veya söz üzerine oluşur.
- **Recognition**Her bölgeyi  kesin sabit yüksekliğe, CNN + BiLSTM + CTC ile çalıştırarak karakter dizisini oluşturun.
- **Layout**重建读取顺序(拉丁文字为自上而下、从左到右;阿拉伯语、日语则不同)

### CTC'yi anlamak için

OCR tanıma, sabit uzunluklu özellik haritasından gerçekleşecek 生成可变长度序列──CTC(Graves et al., 2006) 让你无需字符级对齐就能训练它──模型在每时间步上输出一个覆盖(语音+空白) 的分布;CTC kaybı, tüm对齐的做边缘化,这些对齐的合并重复并移除空白 后会返原为目标文──

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

CTC, 2015 yılında CRNN'in etkisinin nedeni, 2026 yılında üretilen çoğu OCR modelini de eğitmeye devam ediyor.

### 现代 son-son modelleri

- **Donut**(Kim ve diğerleri, 2022)  Bir ViT kodlayıcısı + bir metin dekodleyicisi;读取图像并直接输出 JSON──没有文字探测器,没有布局模块──
- **TrOCR** Lines seviyesindeki OCR'nin ViT + transformatör dekodörünü kullanıyor.
- **Qwen-VL-OCR / InternVL** OCR görevleri için ince ayarlanmış olan tam görme dil modelleri; 2026 yılın karmaşık belgeleri için en iyi doğruluk:
- **PaddleOCR** 成熟生産パッケージ 中的经典 DB + CRNN boru hattı; hala açık kaynaklı 主力。

Sonundan sonuna kadarki modeller daha fazla veri ve hesaplama gerektiriyor, ancak çok aşamalı boru hattlarının hata birikimi üzerinden geçti.

### Yapılandırma analizleri

运行布局探测器 (LayoutLMv3, DocLayNet),为每个地区 标注标签:Üznük, Paragraf, Şekil, Tablo, Ayağa Ayırma Notı。Okuş sırası 于是变成按布局顺序 遍历地区并拼接──

对于表格,使用 **Key-Value extraction**modeller(面向视觉丰富文档的唐nut,面向平面扫描的布局LMv3)──它们接收图像+检测的文本+位置,并预测结构化键值对──

### Değerlendirme ölçümleri

- **Character Error Rate (CER)** Levenshtein mesafe / referans uzunluğu──越低越好── Üretim hedefi:干净 tarama 上 < 2%──
- **Word Error Rate (WER)** kelime seviyesine  aynı gösterge
- **structured fields 上的 F1** Ana değer görevleri için kullanılır; ölçmek `{invoice_total: 42.50}`Evet, evet.
- **JSON 上的 Edit distance** Sonundan sonuna kadar belge analizleri için kullanılmıştır; Donut kağıdı  normalize ağaç düzenleme mesafesini başlattı。


```figure
cv3-ctc-collapse
```

## Yapın onu.

### 步骤 1: CTC Kayıp + açgözlü dekodör

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

`F.ctc_loss`Kullanılabilir zamanlarda yüksek verimlilikte CuDNN uygulaması kullanılır.

### 步骤 2: Küçük CRNN tanıtıcısı

OCR'nin en küçük CNN + BiLSTM hattı kullanıyor.

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

固定 height input (CNN maksimum birimleri) 会把高度压到 1);;宽度是CTC'nin zaman boyutu;;

### 步骤 3: Sintez OCR

生成白底黑字的数字字符串, uçtan sonuna duman testi için kullanılır.

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

Gerçek OCR verileri, fonları, gürültü, dönüm, sarı ve renk ekleyecek.

### 4 adım: Eğitim çizelgesi

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

Bu basit sentetik verilerde, kayıplar 200 adım içinde olmalı.

## Kullan

Üç条 üretim 路径:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`- Evet.
- **EasyOCR**Python-native,多语言,PyTorch omurgası
- **Tesseract** 经典方法; on models 表现困难的旧扫描文档 上仍然有用──

Dokumentleri sonundan sonuna analiz etmek için Donut veya VLM kullanın:

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

Bu nedenle, bu konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir diğer konularda, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde, bir türde,

## - Söyle.

本课产 出:

- `outputs/prompt-ocr-stack-picker.md` Bir istek, belge türüne göre 、 dili 和 yapısı  選択 Tesseract / PaddleOCR / Donut / VLM-OCR。
- `outputs/skill-ctc-decoder.md` Bir beceri, açgözlülükle yazma ve ışın araması CTC kodlayıcıları, uzunluk normallendirme dahil olacaktır.

## 练习

1. **（简单）**5 rakamlı rastgele sayısal ipler üzerinde LittleCRNN 500 adımları eğitmek için.
2. **（中等）**Çığlık arama ((çığlık_geniş = 5) açgözlülükle çözme için kullanın.
3. **（困难）**20 张收据上使用PaddleOCR,提取 line items,并针对 {item_name, price} çiftleri与手工标注地面真相 计算 F1。

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

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) 原始 CNN+RNN+CTC mimarisi
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) 原始 CTC kâğıdı;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR yığın
