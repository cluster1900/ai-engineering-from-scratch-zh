# Classificação de áudio  De MFCC para cima de k-NN para AST e BEATs

> Desde狗叫 vs 警笛到这是哪种语言,都属于音频 Classification──特征是 mels──架构每十年都会变化──评估仍然是AUC、F1 和按类回忆──

**类型：**Construção
**语言：**Python
**先修要求：**Fase 6 · 02 (Espectogramas e Mel), Fase 3 · 06 (CNNs), Fase 5 · 08 (CNNs e RNNs para texto)
**时间：**- 75 minutos.

## 问题

Você consegue um 10 segundos de vídeo. Você sabe: 它是什么? 城市声音(警笛、电钻、狗) 语音命令(sim/no/stop) 语言 ID(en/es/ar) 说话人情绪(angry/neutral),或环境声音(indoor/outdoor, babble)  所有这些都是*音频分类*,而在2026年,基线架构已经成熟:log-mel → CNN 或 Transformer → softmax──

O problema principal não é a rede, mas os dados. O problema é organizar, aumentar e avaliar, em vez de transformar a CNN em Transformer.

## 概念

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**MFCC 上的 k-NN（1990 年代基线）。**按片段展平 MFCC,计算它与带标签样本库的共数相似性,返回顶K的多数票――在干净的小数据集――Speech Commands、ESC-50) 上出乎意料地强──不需要 GPU 即可运行──

**log-mels 上的 2D CNN（2015-2019）。**- Não .`(T, n_mels)`log-mel 当作图像处理──应用 ResNet-18 或 VGG-style──对时间轴做全球平均积分──对类别做软max──在大多数2026年 kaggle 竞赛中,这仍然是基线──

**Audio Spectrogram Transformer, AST（2021-2024）。**Vai fazer patches de log-mail (por exemplo, 16×16 patches), adicionar embutidos de posição,并送入 ViT── para aprendizado supervisionado, é o SOTA do AudioSet 上的(mAP 0.485)──

**BEATs 和 WavLM-base（2024-2026）。**Em vários milhões de horas de rádio, fazer pré-treino auto-supervisionado. Usando os dados supervisionados que você realmente precisa, 1-10% é perfeito no trabalho. Até 2026, este é o ponto de partida padrão do rádio não-linguístico.

**Whisper-encoder 作为冻结 backbone（2024）。**取 Whisper 的编码器,去掉 decoder,接一个线性分类器──在语言ID 和简单事件分类 上接近 SOTA,并且不需要音频增强──这是免费午餐基线──

### O desequilíbrio é o verdadeiro desafio .

ESC-50:50 类, per类 40 个片段 平衡、简单。UrbanSound8K:10 类,10:1 不平衡──AudioSet:632 类, existem 100.000:1 long tail──有效技术包括:

- 訓練時均衡採樣 () 
- Mistura:将两片段(及其标签) 线性插值作为增强──
- EspecAugment:随机遮盖时间和频率带──简单,但关键──

###  avaliação

- Exclusivo para várias classes: comando de fala: precisão superior a 1, precisão superior a 5.
- 多类多标签(AudioSet、UrbanSound-style):precisão média média (mAP)。
- 严重不平衡: recall per class + macro F1──

Você deve saber de 2026 números:

| Benchmark | Baseline | SOTA 2026 | Source |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | BEATs paper (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | HEAR leaderboard 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | HEAR v2 results |


```figure
mfcc-pipeline
```

## Construí-lo

### 步骤 1: featurizar

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### 步骤 2: Resumo de duração fixa

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

简单但很强:跨时间的平均 +变化 会为13coef MFCC 得到一个26dim 固定 Embedding──瞬间运行完成──直到2017年,它在ESC-50上仍然能击败SOTA NN基线──

### 步骤 3: k-NN

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

### Passo 4: Avaliar para o log-mels da CNN

Em PyTorch

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

3M 参数──在单张 RTX 4090 上用约10分钟训练 ESC-50──accuridade 80%+──

### 步骤 5:2026 默认方案  bem-ajustados BEATs

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

Para os batidos, através`beats`库使用 `microsoft/BEATs-base`;transformadores API de forma igual.

## Use-o

Estaca 2026:

| Situation | Start with |
|-----------|-----------|
| Tiny dataset (<1000 clips) | MFCC means 上的 k-NN（你的基线）+ audio augmentation |
| Medium dataset (1K–100K) | BEATs 或 AST fine-tune |
| Large dataset (>100K) | 从头训练或 fine-tune Whisper-encoder |
| Real-time, edge | 40-MFCC CNN，quantized to int8（KWS-style） |
| Multi-label (AudioSet) | BEATs-iter3，配合 BCE loss + mixup + SpecAugment |
| Language ID | MMS-LID, SpeechBrain VoxLingua107 baseline |

 决策规则:**从冻结 backbone 开始，而不是新模型**❖Tuning fino Uma cabeça de batida pode atingir 95% de SOTA em poucas horas, em vez de várias semanas.

## Entrega-o

保存为 `outputs/skill-classifier-designer.md` Para uma classificação de áudio determinada 任务选择架构、增强、类平衡策略 和 eval metric──

## 练习

1. **Easy.**运行 `code/main.py`◊ Ele será em um conjunto de dados sintéticos de 4 classes ([[ diferentes tons de alto-falso puro]])
2. **Medium.**Utilize [mean, var, skew, kurtosis] 替换 `summarize`                                                                                                                                                                                                                                                              
3. **Hard.**Utilização `torchaudio`, em ESC-50 dobrar 1 上訓練一 2D CNN──報告 5x cross-validation accuracy──添加 SpecAugment(Time mask = 20, freq mask = 10)并報告 delta──

## 关键术语

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

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) Arquitetura representativa de 2021 2024 anos
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) 2024+ 默认方案──
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) 主流 aumento de áudio。
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) 延续至今 de 50 classes de referência。
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) Taxonomia do YouTube de classe 632; ainda é padrão de ouro.
