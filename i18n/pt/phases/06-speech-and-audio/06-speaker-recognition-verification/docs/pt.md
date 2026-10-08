# 说话人识别与验证

> ASR  pergunta  eles disseram o que?  reconhecimento de oradores  pergunta  é quem diz?  forma matemática parece ser a mesma, isto é, embutida mais cosina, mas cada decisão de produção depende de um único número EER 

**类型：**Construir
**语言：**Python
**先修要求：**Fase 6 · 02 (Espectogramas & Mel), Fase 5 · 22 (Modelos de incorporação)
**时间：**- 45 minutos.

## 问题

Usador disse uma frase de senha. Você sabe: é a pessoa que eles afirmam que é? ou é a primeira pessoa no seu banco de inscrição?

2018 anos atrás:GMM-UBM + i-vectores。EER 尚可,但对频道转移(手机 vs.笔记本电脑) 和情绪很脆弱──20182022:x-vectors(Use angular margin 训练的 TDNN backbone)──2022+:ECAPA-TDNN 和 WavLM-large Embedding──到2026年,这个领域由三个模型和一个指标主导──

Este indicador é**EER**,即 Equal Error Rate── Set Your Decision Value, make False Accept Rate = False Reject Rate──交叉点就是 EER──每篇论文、每名表、每次采购评审都会使用它──

## 概念

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline。**Inscrição:录制目标说话人 530秒音频;计算固定维度 Embedding(ECAPA-TDNN 为 192-d,WavLM-large 为 256-d) ――verificação:获取测试 utterance 的 Embedding;计算 Cosine similarity;与值比较──

**ECAPA-TDNN（2020，2026 仍占主导）。**Emfatizado Atenção de Canal, Propagação e Agregação - Time-Delay Neural Network──1D conv blocos,带 squeeze-excitação、multi-head atenção pooling,后接一个线性层 得到192-d──使用Additive Angular Margin loss(AAM-softmax)在 VoxCeleb 1+2(2,700 个说话人,1.1M 条 utterance) 上训练──

**WavLM-SV（2022+）。**Utilize AAM loss fine-tune 预训练 WavLM-large SSL backbone──质量更高但更慢,300+ MB vs 15 MB──

**x-vector（baseline）。**TDNN + compartilhamento de estatísticas.

**AAM-softmax。**Em espaço angular, entre a margem `m`                                                                                                                                                                                                                                                              `cos(θ + m)` Força de classificação entre ângulos de separação  Tipico`m=0.2`, escala `s=30`- Não.

### Ponto de pontuação

- **Cosine**Utilizado para comparar inscrição e teste Embedding.
- **PLDA (Probabilistic LDA)。**Empregar  projetar em espaço latente, em que o mesmo alto-falante vs. alto-falantes diferentes tem uma relação de probabilidade de forma fechada.
- **Score normalization。** `S-norm`Ou `AS-norm`O valor médio e o std para cada pontuação são classificados.

### Você deve saber o número de 2026

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### Diarização

Em muitos casos, a maioria dos usuários de um sistema de conversas de vídeo pode ser chamada de "página de conversas de vídeo".`pyannote.audio`3.1, ele considera a segmentação de alto-falantes + incorporação + agrupamento 封装在一次调用后面──2026 AN AMI 上的 SOTA DER 约为15%(低于2022 年的23%)──


```figure
sp-eer-crossover
```

## Construí-lo
### 步骤 1: de estatísticas da MFCC  construção de brinquedos Embedding

```python
def embed_mfcc_stats(signal, sr):
    frames = featurize_mfcc(signal, sr, n_mfcc=13)
    mean = [sum(f[i] for f in frames) / len(frames) for i in range(13)]
    std = [
        math.sqrt(sum((f[i] - mean[i]) ** 2 for f in frames) / len(frames))
        for i in range(13)
    ]
    return mean + std  # 26-d
```

离 SOTA 很远, apenas para ensino.`code/main.py`A partir de agora, o sistema de comunicação será desenvolvido em um ambiente de comunicação.

### 步骤 2:Similaridade de cosina + limiar

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### 步骤 3: de pares de semelhanças  calcular o EEE

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 1.0, 0.0)  # (fa, fr, threshold)
    for t in thresholds:
        fr = sum(1 for s in same_scores if s < t) / len(same_scores)
        fa = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        if abs(fa - fr) < abs(best[0] - best[1]):
            best = (fa, fr, t)
    return (best[0] + best[1]) / 2, best[2]
```

返回 (eer, threshold_at_eer) ⋅ dois devem ser relatados⋅

### 步骤 4: usar SpeechBrain para fazer a produção real

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### 步骤 5: usar nota de piano fazer diário

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## Use-o
Estaca de 2026:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## 陷
- **Channel mismatch。**Em VoxCeleb (WEB vídeo) ≠ áudio de telefonema-chamadas.
- **短 utterance。**测试音频低于3秒时,EER 会急剧变差──
- **带噪声的 enrollment。**Uma inscrição barulhenta 会污染アンカー。使用 ≥3 个干净样本并取平均。
- **跨条件固定阈值。**始终在来自目标域的持久的 dev set 上调值──
- **对未归一化 Embedding 使用 Cosine。**Antes fazer L2-normalize; sinon magnitude 会主导结果。

## Entrega-o
保存为 `outputs/skill-speaker-verifier.md` Selection model, protocolo de inscrição, plano de ajuste de limiares e proteções contra fraudes.

## 练习
1. **Easy。**运行 `code/main.py` Construir altavozes sintéticos (profis de tom diferentes), executar inscrições e fazer uma lista de testes de 100 pares 上计算 EER。
2. **Medium。**Em 30 条 VoxCeleb1 pronunciamento(5 个扬声器 × 每人 6 条) 上使用SpeechBrain ECAPA──比较Cosine vs PLDA 的 EER──
3. **Hard。**Utilização `pyannote.audio`构建完整 enroll → diarize → verifique pipeline──在 AMI dev set 上评估 DER──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| EER | 标题指标 | False Accept = False Reject 时的阈值。 |
| Verification | 1:1 | “这是 Alice 吗？” |
| Identification | 1:N | “是谁在说话？” |
| Open-set | 可能未知 | Test set 可以包含未 enrollment 的说话人。 |
| Enrollment | 注册 | 计算说话人的 reference Embedding。 |
| AAM-softmax | Loss | 带 additive angular margin 的 softmax；强制 cluster separation。 |
| PLDA | 经典 scoring | Probabilistic LDA；在 Embedding 之上做 likelihood-ratio scoring。 |
| DER | Diarization metric | Diarization Error Rate，即 miss + false alarm + confusion。 |

## 延伸阅读
- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 经典 deep-embedding 论文──
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143) 20202026 anos的主导架构──
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) Utilizando SV e diarização de espinha dorsal SSL.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) Diarização de nível de produção + inserção de pilhas
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 当前各模型的 EER 排名──
