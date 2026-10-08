# 说话人识别与验证 (en inglés)

> ASR  pregunta  dicen qué?  reconocimiento de altavoces  pregunta  es quién dice? forma matemática se ve igual, es decir, Embedding plus Cosine, pero cada decisión de producción depende de un solo número EER

**类型：**Construir
**语言：**Python
**先修要求：**Fase 6 · 02 (espectrogramas y mel), Fase 5 · 22 (modelos de incorporación)
**时间：**- 45 minutos

##  problemas

Usador dice una frase de contraseña. ¿Sabes que es la persona que ellos afirman que es? ¿Confirmación*, 1:1), o es la primera persona en tu banco de inscripción?

2018 años anteriores:GMM-UBM + i-vectores。EER 尚可,但对频道转移(手机 vs.笔记本电脑) 和情绪很脆弱──20182022:x-vectores(Use angular margin 训练的 TDNN backbone)──2022+:ECAPA-TDNN 和 WavLM-large Embedding──到2026年,这个领域由三个模型和一个指标主导──

Este indicador es**EER**, es decir, tasa de error igual. Establecer su valor de decisión, hacer que la tasa de aceptación falsa = tasa de rechazo falso.

## 概念

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline。**Inscripción:录制目标说话人 530秒音频;计算固定维度 Embedding(ECAPA-TDNN 为 192-d,WavLM-large 为 256-d) ――Verificación:获取测试演说的 Embedding;计算Cosine similarity;与值比较──

**ECAPA-TDNN（2020，2026 仍占主导）。**Enfatizado Canal Atención, Propagación y Aggregación - Tiempo-Delay Red Neural ―1D bloques de con,带 apretar-excitación、multi-head atención de aglutinamiento, 后接一个线性层 得到192-d──使用添加角利率损失(AAM-softmax) 在 VoxCeleb 1+2(2,700 个说话人,1.1M 条 条语句) 上训练──

**WavLM-SV（2022+）。**Utiliza AAM pérdida de ajuste fino 预训练 WavLM-large SSL backbone──质量更高但更慢,300+ MB vs 15 MB──

**x-vector（baseline）。**TDNN + estadísticas de agrupación ― clásico方案; en CPU / edge 上 sigue siendo útil ―

**AAM-softmax。**En el espacio angular, se incluye el margen.`m`                                                                                                                                                                                                                                                              `cos(θ + m)`                                                                                                                                                                                                                                                                                                                          `m=0.2`, escala `s=30`¿Qué es eso?

### Punto de juego

- **Cosine**Usado para comparar inscripción y prueba Embedding.
- **PLDA (Probabilistic LDA)。**Se incorporará  proyectar a un espacio latente, en el que el mismo altavoz vs altavoz diferente tiene una relación de probabilidad de forma cerrada.
- **Score normalization。** `S-norm`O `AS-norm`: Usando un grupo de cohorte imposter de valores promedio y std para cada puntaje  realizar una clasificación ⋅ para la evaluación de dominio cruzado ⋅ es muy importante

### Deberías saber el número de 2026

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### Diarización

En el video, el usuario puede ver el video de la película en el que se encuentra el video de la película.`pyannote.audio`3.1, se trata de la segmentación de altavoces + incorporación + agrupamiento 封装在一次调用后面──2026 años AMI 上的 SOTA DER 约为15%(bajo a la de 2022 años 23%)──


```figure
sp-eer-crossover
```

## Construirlo
### Paso 1: de las estadísticas de la MFCC  Construcción de juguetes Embedding

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

离 SOTA 很远, sólo para la enseñanza.`code/main.py`Lo utilizaremos como datos de altavoces sintéticos.

### 步骤 2:Similaridad de la cosina + umbral

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### 步骤 3: de pares de similitudes  calcular EER

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

返回 (eer, threshold_at_eer) ⋅ dos deben reportar―

### Paso 4: utilizar SpeechBrain para hacer la producción

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### Paso 5: Usar nota de piano hacer diario

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## Usalo
Estaca de 2026 años:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## 陷
- **Channel mismatch。**En VoxCeleb (en inglés) ≠ audio de llamadas telefónicas.
- **短 utterance。**测试音频低于3秒时,EER 会急剧变差──
- **带噪声的 enrollment。**Una inscripción ruidosa 会污染 anchor。使用 ≥3 个干净样本并取平均──
- **跨条件固定阈值。**始终在来自目标域的持久的开发集 上调值──
- **对未归一化 Embedding 使用 Cosine。**Antes hacer L2 normalizan; si no la magnitud 会主导结果。

##  entregarlo
保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-speaker-verifier.md` Selección de modelos, protocolo de inscripción, plan de ajuste de umbral y medidas de protección contra el fraude.

##  ejercicios
1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Construir altavoces sintéticos (profiles de tono diferentes), ejecutar inscripciones y en la lista de ensayos de 100 pares 上计算 EER。
2. **Medium。**En 30 条 VoxCeleb1 pronunciamiento(5 个扬声器 × 每人 6 条) 上使用SpeechBrain ECAPA──比较Cosine vs PLDA 的 EER──
3. **Hard。**Uso `pyannote.audio`构建完整 enroll → diarize → verify pipeline──在 AMI dev set 上评估 DER──

## 关键术语: "El hombre es un hombre"
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
- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 经典 profundamente incrustado 论文。
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143) 20202026 años de arquitectura de la dirección.
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) Usado para SV y diarización de la columna vertebral SSL.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio)  生产级日记化 + Embedding stack──
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 当前各模型的 EER 排名──
