# OCR e compreensão de arquivos

> O OCR é um pipeline de três fases  检查文字框、识别字符,然后排布它们──每个现代 OCR system 都会重新排序这些阶段,或将它们合并──

**类型：**学习 + 使用
**语言：**Python
**先修要求：**Fase 4 Lição 06 (Detecção), Fase 7 Lição 02 (Autoatenção)
**时间：**- 45 minutos.

## Objectivo de aprendizagem

- 追踪经典 OCR pipeline(detect -> recognize -> layout)
- 实现 CTC(Classificação Temporal Conexão) perda
- Utilize PaddleOCR ou EasyOCR  para fazer análise de documentos de produção, não é necessário treinar
- 区分 OCR、layout parsing 和 document understanding,并为每个任务选择正确工具

## 问题

充满文本的图像 无处不在:收据,发票,ID,扫描书籍,表单,白板,标牌,截图;; 从中提取结构化数据  不仅是字符,而是这是总金额  是价值最高的应用视觉问题之一

Este domínio está dividido em três níveis de habilidades:

1. **OCR proper**:把 pixels 转成文──
2. **Layout parsing**:把 OCR output 分组为 regions (título, corpo, tabela, cabeçalho)
3. **Document understanding**A partir do layout 中提取 estruturados campos (("factura_total = $42.50")

Cada camada tem métodos clássicos e métodos modernos, e eu quero que a diferença entre o texto na imagem e a quantidade total de receitas que eu preciso dessa camada seja maior do que a maioria das equipes percebe.

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
- **Recognition**Cortar cada região para uma altura fixa, executar CNN + BiLSTM + CTC para gerar uma sequência de caracteres.
- **Layout**重建阅读顺序(拉丁文字为自上而下、从左到右;阿拉伯语、日语则不同)

### Usage of understanding CTC

OCR reconhecimento irá de um mapa de características de duração fixa 生成可变长度序列──CTC(Graves et al., 2006) 让你无需字符级排列就能训练它──模型在每时间步上输出一个覆盖(语音+空白) de distribuição;CTC loss 会对所有排列做边缘化,这些排列在合并重复并移除空白 后会返原为目标文──

```
raw output: "h h h _ _ e e l l _ l l o _ _"
after merge repeats and remove blanks: "hello"
```

O CTC é a causa do desempenho do CRN em 2015, ainda está treinando a maioria dos modelos OCR de produção em 2026.

### Modelos de ponta a ponta moderna

- **Donut**(Kim et al., 2022)  Um codificador ViT + um decodificador de texto; read取 image 并直接输出 JSON──没有文字探测器,没有布局模块──
- **TrOCR** Utilizado em decodificador de transformer ViT + de OCR de nível de linha。
- **Qwen-VL-OCR / InternVL** Para tarefas OCR, modelos de linguagem de visão completa são ajustados; em 2026 anos documentos complexos 
- **PaddleOCR** Compreendido pacote de produção 中的经典 DB + CRNN pipeline; ainda é de código aberto 主力。

Modelos de ponta a ponta precisam de mais dados e computação, mas superaram a acumulação de erros de oleodutos em várias etapas.

### Partilha de layout

对于结构文件,运行布局检测器(LayoutLMv3, DocLayNet),为每个地区 标注标签标签:Título, parágrafo, Figura, Tabela, Nota de rodapé。

对于表格,使用 **Key-Value extraction**modelos(Fação dos documentos visuais ricos, face face face plain scans of LayoutLMv3)。 eles recebem imagem + texto detectado + posições,并预测 pares de valores-chave estruturados。

### Metricas de avaliação

- **Character Error Rate (CER)** Distância de Levenshtein / comprimento de referência──越低越好──Objetivo de produção:干净 scans 上 < 2%──
- **Word Error Rate (WER)** Nível de palavra 上同标――
- **structured fields 上的 F1** Utilizadas para tarefas de valor-chave; medir `{invoice_total: 42.50}`É verdade que aparecem.
- **JSON 上的 Edit distance** Utilizado para análise de documentos de ponta a ponta; papel de donut  introduziu uma distância de edição de árvores normalizada。


```figure
cv3-ctc-collapse
```

## Construí-lo

### 步骤 1: CTC Loss + codificador ganancioso

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

`F.ctc_loss`Em uso de implementação de CuDNN de alta eficiência, o decodificador ganancioso é mais simples do que a busca de feixe, geralmente com uma diferença de 1% em relação ao CER.

### 步骤 2: Reconhecedor de CRNN pequeno

Utilizando a linha OCR de menor CNN + BiLSTM.

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

Input de altitude fixaCNN max-pools 会把高度压到 1)──宽度是CTC的时间维度──

### 步骤 3: OCR sintético

生成白底黑字的数字字符串, para uso em teste de fumo de ponta a ponta.

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

O verdadeiro conjunto de dados OCR vai adicionar fontes, ruído, rotação, borbulho e cor.

### 步骤 4: Esboço de formação

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

Neste simples dados sintéticos, a perda deve acontecer em 200 passos, de ~3  para ~0.2 ⋅

## Use-o

三条 produção 路径:

- **PaddleOCR** 成熟、快速、多语言──一行用法:`paddleocr.PaddleOCR(lang="en").ocr(image_path)`- Não.
- **EasyOCR**Python-nativo, multi-linguística, ortografia de PyTorch.
- **Tesseract** 经典方法; em modelos, os documentos de escavação antigos mostram dificuldade; 上仍然有用──

Para análise de documentos de ponta a ponta, utilizar Donut ou VLM:

```python
from transformers import DonutProcessor, VisionEncoderDecoderModel

processor = DonutProcessor.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
model = VisionEncoderDecoderModel.from_pretrained("naver-clova-ix/donut-base-finetuned-cord-v2")
```

Para os recebimentos, emissão e estrutura de formulários, de ajustes e de refazendas, o VLM é uma opção de referência.

## Entrega-o

本课产出:

- `outputs/prompt-ocr-stack-picker.md` Um prompt, irá de acordo com o tipo de documento, linguagem, estrutura, selecionar Tesseract / PaddleOCR / Donut / VLM-OCR。
- `outputs/skill-ctc-decoder.md` Uma habilidade, vai começar a escrever codificadores CTC com codificação de comprimento e busca de feixe, incluindo normalização de comprimento.

## 练习

1. **（简单）**Em 5 dígitos de cadeias numéricas aleatórias 上训练 TinyCRNN 500 passos。 relatório mantido fora conjunto 上的 CER。
2. **（中等）**Usar pesquisa de feixe ((beam_width=5) para substituir a codificação gananciosa.
3. **（困难）**Em 20 张收据上使用PaddleOCR,提取 line items,并针对 {item_name, price} pares 与手工标注地面真相 计算 F1。

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

- [CRNN (Shi et al., 2015)](https://arxiv.org/abs/1507.05717) Origins CNN+RNN+CTC arquitetura
- [CTC (Graves et al., 2006)](https://www.cs.toronto.edu/~graves/icml_2006.pdf) Origins CTC papel;密集包含算法思想
- [Donut (Kim et al., 2022)](https://arxiv.org/abs/2111.15664) 无 OCR 的文档理解变压器
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) 开源生产级 OCR stack
