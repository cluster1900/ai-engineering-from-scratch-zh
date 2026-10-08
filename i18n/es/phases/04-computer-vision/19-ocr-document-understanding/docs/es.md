# OCR y comprensión de archivos

> OCR es una tubería de tres etapas  检查 text boxes、 identificar caracteres, luego eliminarlos。 Cada sistema moderno de OCR puede reordenar estas etapas, o combinarlas─

**类型：**学习 + 使用
**语言：**Python
**先修要求：**Fase 4 Lección 06 (Detección), Fase 7 Lección 02 (Autoatención)
**时间：**- 45 minutos

## El objetivo del aprendizaje

- 追踪经典 OCR pipeline(detect -> recognize -> layout) así como moderno de extremo a extremo 替代方案(Donut, Qwen-VL-OCR)
- Por la formación de secuencia a secuencia en OCR  lograr CTC(Clasificación temporal de conexión) pérdida
- Utiliza PaddleOCR o EasyOCR para analizar documentos de producción, sin necesidad de entrenamiento
- 区分 OCR、layout parsing 和 document understanding,并为每个任务选择正确工具

##  problemas

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图;; de la cual se extraen datos estructurales                                                                                                                                                                                                                                        

Este campo se divide en tres niveles de habilidades:

1. **OCR proper**:把 píxeles 转换成文本──
2. **Layout parsing**:把 OCR de salida 分组为 regiones (título, cuerpo, tabla, encabezado)
3. **Document understanding**En el caso de los campos estructurados, la factura total es de $42.50".

Cada uno tiene métodos clásicos y métodos modernos, y quiero que la diferencia entre el texto que se obtiene en la imagen y la cantidad total de ingresos que necesito sea mayor que lo que la mayoría de los equipos se dan cuenta.

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

- **Text detection**生成按行或按词的四边形──
- **Recognition**Cortar cada región a una altura fija, ejecutar CNN + BiLSTM + CTC para generar secuencia de caracteres.
- **Layout**重建阅读顺序(拉丁文字为自上而下、从左到右;阿拉伯语、日语则不同)

### Usé un mensaje para entender CTC

Reconocimiento de OCR se hará a partir de un mapa de características de longitud fija. Secuencia de longitud variable. CTC(Graves et al., 2006) hacer que no se necesite alineación a nivel de caracteres, así que puedes entrenarlo.

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

CTC es la causa de la eficacia de CRN en 2015, también sigue entrenando en la mayoría de los modelos OCR de producción de 2026.[12]

### Modelos de extremo a extremo modernos

- **Donut**(Kim et al., 2022)  Un codificador ViT + un decodificador de texto;读取图像并直接输出 JSON──没有检测器,没有布局模块──
- **TrOCR** Utilizado en el decodificador de transformador ViT + de OCR de nivel de línea。
- **Qwen-VL-OCR / InternVL** Para las tareas de OCR, los modelos de lenguaje de visión completo son ajustados; en 2026 años de documentos complejos, la precisión es la mejor.
- **PaddleOCR** Completo paquete de producción 中的经典 DB + CRNN; sigue siendo de código abierto 主力。

Los modelos de extremo a extremo necesitan más datos y computación, pero superaron la acumulación de errores de las tuberías de múltiples etapas.

### Parse de diseño

对于结构文档,运行布局检测器(LayoutLMv3, DocLayNet),为每个地区 标注标签:Título, párrafo, figura, tabla, pie de página。

对于表格,使用 **Key-Value extraction**modelos(面向视觉丰富文档的甜点,面向平面扫描的布局LMv3)──它们接收图像+检测文本+位置,并预测结构的键值对──

### Metricas de evaluación

- **Character Error Rate (CER)** Distancia de Levenshtein / longitud de referencia──越低越好──Objetivo de producción:干净 scans 上 < 2%──
- **Word Error Rate (WER)** nivel de palabra 上同标――
- **structured fields 上的 F1** Utilizadas para tareas de valor clave; medir `{invoice_total: 42.50}`¿Es cierto que se ha producido?
- **JSON 上的 Edit distance** Utilizado para el análisis de documentos de extremo a extremo; papel de donación  introdujo una distancia de edición de árboles normalizada。


```figure
cv3-ctc-collapse
```

## Construirlo

### 步骤 1: CTC Perdida + codiciador codicioso

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

`F.ctc_loss`En el tiempo disponible, la implementación de CuDNN de alto rendimiento se utiliza en una descifradora codiciosa que busca por rayos más sencilla, generalmente con un porcentaje de CER de menos de 1% en el interior.

### 步骤 2: Reconocedor de CRNN pequeño

Utilizando la línea OCR de CNN + BiLSTM menor.

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

Inputo de altura fija CNN max-pools 会把高度压到 1)──宽度是CTC的时间尺寸──

### Paso 3: OCR sintético

生成白底黑字的数字字符串, para la prueba de humo de extremo a extremo

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

El verdadero conjunto de datos OCR 会添加字体、噪音、旋转、模糊 和颜色──

### Paso 4: Esbozo de formación

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

En este simple dato sintético arriba, la pérdida debería ser en 200 pasos dentro de ~3  descendiendo a ~0.2 ⋅

## Usalo

条 路径 de producción:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`¿Qué es eso?
- **EasyOCR** Python nativo、多语言、PyTorch espina dorsal。
- **Tesseract** 经典方法; en los modelos expresa dificultad de los documentos de análisis antiguos 上仍然有用──

Para el análisis de documentos de extremo a extremo, utilizar Donut o VLM:

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

Para los documentos o con el razonamiento OCR, similar a Qwen-VL-OCR, el VLM es una opción ahora aceptada.

##  entregarlo

本课产 出:

- `outputs/prompt-ocr-stack-picker.md` Una pregunta, en función del tipo de documento, lenguaje y estructura  seleccionar Tesseract / PaddleOCR / Donut / VLM-OCR。
- `outputs/skill-ctc-decoder.md` Una habilidad, comenzará a escribir codiciosos y beam-search CTC decoders, incluyendo la normalización de longitud.

##  ejercicios

1. **（简单）**En 5 dígitos de cuerdas numéricas aleatorias 上训练TinyCRNN 500 pasos。 informe sostenido conjunto 上的 CER。
2. **（中等）**Usar búsqueda de haz (((beam_width=5) para reemplazar la codificación codificada.
3. **（困难）**En 20 张收据上使用PaddleOCR,提取线条,并针对 {item_name, price} pares con手工标注地面真相 计算 F1。

## 关键术语: "El hombre es un hombre"

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

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) Original CNN+RNN+CTC arquitectura
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) Original papel CTC;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR estaca
