# Clasificación de audio  Desde MFCC arriba de k-NN hasta AST y BEATs

> Desde 狗叫 vs 警笛到这是哪种语言,都属于音频分类──特征是 mels──架构每十年都会变化──评估仍然是AUC、F1 和按类回忆──

**类型：**Construcción
**语言：**Python
**先修要求：**Fase 6 · 02 (Espectogramas y Mel), Fase 3 · 06 (CNN), Fase 5 · 08 (CNN y RNN para texto)
**时间：**~ 75 minutos

##  problemas

Usted consigue un 10 segundos de audio. Usted piensa saber: ¿Qué es eso? 城市声音(警笛、电钻、狗) 语音命令(yes/no/stop) 语言 ID(en/es/ar) 说话人情绪(angry/neutral), o ambiente 声音(inner/outdoor, babble) 

El problema principal no es la red, sino los datos. El 80% de los problemas se encuentran en organizar, aumentar y evaluar, en lugar de convertir la CNN en un Transformer.

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC, calcularla con la similitud cosínea de la base de muestras de etiquetas, devolver la mayoría de votos de la parte superior K.

**log-mels 上的 2D CNN（2015-2019）。**¿ Qué ?`(T, n_mels)`Log-mel 当作图像处理──应用 ResNet-18 或 VGG-style──对时间轴做全球平均积分──对类别做软max──在大多数2026年卡格尔竞赛中,这仍然是基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**Para el aprendizaje supervisado, es el software de audioSet (MAP 0.485)

**BEATs 和 WavLM-base（2024-2026）。**En un millón de horas de audio, realice un entrenamiento previo auto supervisado. Utiliza el 1-10% de los datos supervisados que necesita en su origen para ajustar bien las tareas. Hasta 2026, este es el punto de partida de la serie.

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper 的编码器,取掉解码器,接一个线性分类器──在语言ID 和简单事件分类 上接近 SOTA,并且不需要音频增强──这是免费午餐基线──

### El desbalance es el verdadero reto

ESC-50:50 类, por clase 40 个片段 平衡、简单。UrbanSound8K:10 类,10:1 不平衡──AudioSet:632 类, existen 100.000:1 cola larga──有效技术包括:

- 訓練時均衡抽樣 (la evaluación no es necesaria)
- Mezcla:将两个片段(及其标签) 线性插值作为增强──
- EspecAugment:随机遮盖时间和频率带──简单,但关键──

###  evaluación

- Exclusivo para múltiples clases: "Comando de habla": precisión superior a 1 ∞ precisión superior a 5 ∞
- ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]> ]]>
- 严重不平衡:recall por clase + macro F1。

Usted debe saber de 2026 números:

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

## Construirlo

### 步骤 1:featurise

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 步骤 2: Resumen de la longitud fija

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均 +变量 会为13coef MFCC 得到一个26dim 固定 Embedding──瞬间运行完成──直到2017年, todavía puede derrotar a SOTA NN 基线──

### 步骤 3:k-NN

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1e-12
    nb = math.sqrt(sum(x * x for x in b)) or 1e-12
    return dot / (na * nb)

def knn_classify(q, bank, labels, k=5):
    sims = sorted(range(len(bank)), key=lambda i: -cosine(q, bank[i]))[:k]
    votes = Counter(labels[i] for i in sims)
    return votes.most_common(1)[0][0]
```

### Paso 4: Aumento a los registros de la CNN

En PyTorch en el centro:

```python
import torch.nn as nn

class AudioCNN(nn.Module):
    def __init__(self, n_mels=80, n_classes=50):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.head = nn.Linear(128, n_classes)

    def forward(self, x):  # x: (B, 1, T, n_mels)
        return self.head(self.body(x).flatten(1))
```

3M 参数──在单张 RTX 4090 上用约10分钟训练 ESC-50──acurate 80%+──

### 步骤 5:2026 默认方案  ajustes de las notas

```python
from transformers import ASTFeatureExtractor, ASTForAudioClassification

ext = ASTFeatureExtractor.from_pretrained("MIT/ast-finetuned-audioset-10-10-0.4593")
model = ASTForAudioClassification.from_pretrained(
    "MIT/ast-finetuned-audioset-10-10-0.4593",
    num_labels=50,
    ignore_mismatched_sizes=True,
)

inputs = ext(audio, sampling_rate=16000, return_tensors="pt")
logits = model(**inputs).logits
```

Para los golpe, a través `beats`库使用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `microsoft/BEATs-base`La forma de los transformadores API es la misma.

## Usalo

Estaca 2026:

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

 决策规则:**从冻结 backbone 开始，而不是新模型**❖Tuning fino Una cabeza de BET puede alcanzar el 95% de SOTA en pocas horas, en lugar de varias semanas.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-classifier-designer.md` para una clasificación de audio determinada  tasas de selección de arquitectura, aumentos, estrategia de equilibrio de clases y métricas de evaluación

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ se desarrolla en un conjunto de datos sintéticos de 4 clases ([[ diferentes tonos de sonido alto)                                                                                                                                                                                                                                                  
2. **Medium.**Usó [mean, var, skew, kurtosis] 替换 `summarize`◊ En el mismo conjunto de datos sintéticos arriba, ¿la agrupación de 4 momentos ha superado el mean+var?
3. **Hard.**Uso `torchaudio`, en ESC-50 plega 1 上訓練一 2D CNN── informe 5 veces la precisión de validación cruzada── Añadir especificación(máscara de tiempo = 20, máscara de frecuencia = 10)并报告 delta──

## 关键术语: "El hombre es un hombre"

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| AudioSet | 音频领域的 ImageNet | Google 的 2M-clip、632-class weakly-labeled YouTube dataset。 |
| ESC-50 | 小型 Classification benchmark | 50 类 × 40 个环境声音片段。 |
| AST | Audio Spectrogram Transformer | log-mel patches 上的 ViT；2021 SOTA。 |
| BEATs | Self-supervised audio | Microsoft 模型，iter3 截至 2026 年领先 AudioSet。 |
| Mixup | 成对 augmentation | `x = λ·x1 + (1-λ)·x2; y = λ·y1 + (1-λ)·y2`。 |
| SpecAugment | 基于 mask 的 augmentation | 将 spectrogram 的随机时间和频率 band 置零。 |
| mAP | 主要 multi-label metric | 跨类别和阈值的 mean average precision。 |

## 延伸阅读

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) Arquitectura representativa de 2021 2024 años
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 默认方案──
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) 主流 aumento de audio。
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今 de 50 clases de referencia。
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) Taxonomía de YouTube de clase 632; sigue siendo el estándar de oro.
