# Il s'agit d'un document de certification.

> L'ASR  demande  dit quoi?  reconnaissance des intervenants  demande  est qui dit?  forme mathématique ressemble à, c'est-à-dire Embedding plus cosine, mais chaque décision de production dépend d'un seul EER numéros

**类型：**Construire
**语言：**Python
**先修要求：**Phase 6 · 02 (spectrogrammes et mécanismes), phase 5 · 22 (modèles d'intégration)
**时间：**- 45 minutes

##  problématique

Utilisateur dit une phrase de mot de passe. Vous vous demandez si c'est la personne qu'ils prétendent être ou si c'est la première personne dans votre banque d'inscription ou si c'est une personne non connue ouverte ?

2018 之前:GMM-UBM + i-vecteurs。EER 尚可,但对频道转移(手机对笔记本电脑) 和情绪很脆弱。20182022:x-vecteurs(Use angular margin 训练的TDNN backbone)。2022+:ECAPA-TDNN 和 WavLM-large Embedding。到2026年, ce domaine est dominé par trois modèles et un indicateur────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Cet indicateur est**EER**,即 Equal Error Rate── Set your decisionvalue, make False Accept Rate = False Reject Rate──交叉点就是 EER──每篇论文、每名表、每次采购评审都会使用它──

## 概念

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline。**Enregistrement:录制目标说话人 530秒音频;计算固定维度 Embedding(ECAPA-TDNN 为 192-d,WavLM-large 为 256-d) ――Verification:获取测试 utterance 的 Embedding;计算 Cosine similarity;与值比较──

**ECAPA-TDNN（2020，2026 仍占主导）。**Accentué Attention Channel, Propagation et Aggregation - Time-Delay Neural Network──1D conv blocs,带 squeeze-excitation、multi-head attention pooling,后接一个线性层 得到192-d──使用Additive Angular Margin loss(AAM-softmax) 在 VoxCeleb 1+2(2,700 个说话人,1.1M 条 语句) 上训练──

**WavLM-SV（2022+）。**Utilisez la perte d'AAM afin de régler les problèmes de l'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran d'écran

**x-vector（baseline）。**La mise en commun des statistiques TDNN +  classique; en CPU / edge 上 encore utile 

**AAM-softmax。**Dans l' espace angulaire, vous pouvez ajouter une marge `m`                                                                                                                                                                                                                                                              `cos(θ + m)` Forces de séparation angulaire  Typical Setup`m=0.2`, l' échelle `s=30`Il y a une autre.

### Score

- **Cosine**Pour comparer l'inscription et le test Embedding.
- **PLDA (Probabilistic LDA)。**L'intégration  projeter dans l'espace latent, dans lequel le même haut-parleur vs. un haut-parleur différent a un rapport de probabilité de forme fermée.
- **Score normalization。** `S-norm`Ou `AS-norm`: utilisez un groupe de cohorte imposteurs de valeur moyenne et std pour chaque score  effectuer une classification ⋅ pour l'évaluation cross-domaine ⋅ est très important

### Tu devrais savoir le nombre de 2026

| Model | VoxCeleb1-O EER | Params | Throughput (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (classic) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Pyannote 3.1 segmentation + embedding | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### Diarrhée

Dans le cadre de la formation, le groupe de travail a été formé pour la formation de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle de la formation professionnelle en sciences de la formation professionnelle de la formation professionnelle en sciences de la formation professionnelle en sciences de la formation professionnelle en sciences de la formation professionnelle en sciences de la formation professionnelle en sciences de la formation en sciences de la formation professionnelle en sciences de la formation en sciences de la formation en sciences de la formation en sciences de la formation en sciences de la formation en sciences de sciences de la formation en sciences de sciences de sciences de sciences de sciences.`pyannote.audio`3.1, il a réduit la segmentation des haut-parleurs + l'intégration + le regroupement 封装在一次调用后面──2026 ans AMI 上的 SOTA DER 约为15%(低于2022年23%)──


```figure
sp-eer-crossover
```

## - Je le construis.
### étape 1: à partir des statistiques de la CFP  Construire des jouets Embedding

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

离 SOTA 很远, uniquement pour l'enseignement`code/main.py`Le détecter comme des données de haut-parleurs synthétiques.

### 步骤 2:Semblance de cousin + seuil

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### 步骤 3: à partir de paires de similitudes  calculer la RAE

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

返回 (eer, threshold_at_eer) ⋅ dois être rapporté

### 步骤 4: utiliser SpeechBrain pour réaliser la production

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### 步骤 5: utiliser la note de piane faire un journal

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## Utilisez-le
Stack de l'année 2026:

| Situation | Pick |
|-----------|------|
| Closed-set 1:1 verification, edge | ECAPA-TDNN + cosine threshold |
| Open-set verification, cloud | WavLM-SV + AS-norm |
| Diarization (meetings, podcasts) | `pyannote/speaker-diarization-3.1` |
| Anti-spoofing (replay / deepfake detection) | AASIST or RawNet2 |
| Tiny embedded (KWS + enrollment) | Titanet-Small (NeMo) |

## La trappe
- **Channel mismatch。**Le modèle de formation sur VoxCeleb (vidéo) ≠ audio de téléphone-appel.
- **短 utterance。**测试音频低于3秒时,EER 会急剧变差──
- **带噪声的 enrollment。**Une inscription bruyante 会污染 anchor。使用 ≥3 个干净样本并取平均。
- **跨条件固定阈值。**始终在来自目标域的持久的 dev set 上调值──
- **对未归一化 Embedding 使用 Cosine。**Précédent L2 normaliser; sinon la magnitude 会主导结果。

## Je le livre.
保存为 `outputs/skill-speaker-verifier.md` la sélection de modèles, le protocole d'inscription, le plan de réglage des seuils et les mesures de protection contre la fraude.

## 练习
1. **Easy。**运行  référencement`code/main.py` Construire des haut-parleurs synthétiques (profiles de ton différents), effectuer l'inscription et faire une liste d'essai de 100 paires 上计算 EER。
2. **Medium。**Dans la section 30 de VoxCeleb1 (en anglais) 5 orateurs × 每人 6 条) utilisent le SpeechBrain ECAPA.
3. **Hard。**Utilisation `pyannote.audio`构建完整 enroll → diarize → verifier pipeline──在 AMI dev set 上评估 DER──

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
- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) 经典 论文──
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143) 20202026 année de la structure principale.
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) Utilisé pour SV et la mise en jour de l'épine dorsale SSL.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) Diarrisation de la production + intégration de la pile
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) 排名 当前各模型的 EER
