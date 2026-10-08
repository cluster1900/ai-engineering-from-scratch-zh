# Détection de l'activité vocale et prise de tour  Silero、Cobra 和 Flush Trick

> Le succès de chaque agent de voix dépend de deux jugements: le utilisateur est-il actuellement en conversation, ainsi que s'ils sont-ils déjà terminés?

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

##  problématique

L'agent de la voix a fait trois jugements différents dans chaque pièce de 20 ms:

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** détection de l'apparition de la maladie.
3. **用户是否说完了？** point de fin  tour de fin

朴素答案 (Energy Threshold) 在任何噪音下都会失败:交通声,键盘声,人群杂声, 2026 年的答案是:Silero VAD (Opening, Deep Learning Training) + modèle de détection de tournées, d'indication de bout en bout) + 基于 VAD 校准的沉默乱──

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### 3 étages de la VAD

**Tier 1: energy gate。**Le RMS peut faire passer des sons silencieux évidents, mais tout bruit supérieur à la valeur sera émis.

**Tier 2: Silero VAD**Les paramètres de la mise à jour de la CPU sont les paramètres de la mise à jour de la CPU (environ 1 ms) et de la mise à jour de la CPU (environ 1 ms).

**Tier 3: semantic turn detector。**Le modèle de détection de tour de LiveKit (en 2024) ou votre propre petit classifiateur (en français).

### 关键参数 et sa valeur par défaut

- **Threshold。**Silero 输出 probabilité;在 &gt; 0.5(默认) ou &gt; 0.3(sensitive)时分类为语音──值越低,首词被截断越少,但错阳性越多──
- **Minimum speech duration。**Réjecter un discours de moins de 250 ms, c'est généralement un bruit de toux ou de fauteuil.
- **Silence hangover（end-pointing）。**Après VAD, attendez 500 à 800 ms pour réaffirmer la fin du tour.
- **Pre-roll buffer。**Réservez 300 à 500 ms d'audio pour empêcher qu'ils ne soient coupés.

### Le truc de la flûte (Kyutai 2025)

Les modèles STT en streaming ont un retard d'attente anticipé (((Kyutai STT-1B pour 500 ms, STT-2.6B pour 2,5 s)  Vous attendrez généralement en fin de discours 后等那么久才能得到转录──Flush trick:当 VAD 触发结束演讲时,**向 STT 发送 flush signal**, Forcément immédiatement de sortie;. STT utilisant environ 4x en temps réel  traitement, donc 500 ms tampon  environ 125 ms en cours de réalisation;.

端到端:125 ms VAD + flush STT = pour la latence de la conversation

### 2026 VAD par rapport à

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

Silero est une véritable option préconisée. Cobra est un système de production de VAD à usage exclusif de l'énergie qui n'aura aucune place dans l'environnement de production de 2026.


```figure
sp-vad-cascade
```

## - Je le construis.

### 步骤 1: porte d'énergie

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### 步骤 2: Silero VAD dans Python

```python
from silero_vad import load_silero_vad, get_speech_timestamps

vad = load_silero_vad()
audio = torch.tensor(waveform_16k, dtype=torch.float32)
segments = get_speech_timestamps(
    audio, vad, sampling_rate=16000,
    threshold=0.5,
    min_speech_duration_ms=250,
    min_silence_duration_ms=500,
    speech_pad_ms=300,
)
for s in segments:
    print(f"{s['start']/16000:.2f}s - {s['end']/16000:.2f}s")
```

### 步骤 3: machine d'état de tournage

```python
class TurnDetector:
    def __init__(self, silence_hangover_ms=500, min_speech_ms=250):
        self.state = "idle"
        self.speech_ms = 0
        self.silence_ms = 0
        self.silence_hangover_ms = silence_hangover_ms
        self.min_speech_ms = min_speech_ms

    def update(self, is_speech, chunk_ms=20):
        if is_speech:
            self.speech_ms += chunk_ms
            self.silence_ms = 0
            if self.state == "idle" and self.speech_ms >= self.min_speech_ms:
                self.state = "speaking"
                return "START"
        else:
            self.silence_ms += chunk_ms
            if self.state == "speaking" and self.silence_ms >= self.silence_hangover_ms:
                self.state = "idle"
                self.speech_ms = 0
                return "END"
        return None
```

### 步骤 4: détourner le visage

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT(Kyutai、Deepgram、AssemblyAI) doit soutenir le flush, cette méthode est seulement efficace。Whisper streaming n'est pas pris en charge, car il est basé sur un bloc, et il est toujours en attente de morceaux。

## Utilisez-le

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

經驗法则: Sauf si vous avez vraiment aucun choix, sinon ne publiez jamais de VAD à usage énergétique uniquement.

## La trappe

- **Fixed threshold。**Environnement tranquille utilisable, en milieu difficile échoué.
- **Silence hangover 太短。**L'agent 会在句中打断用户──500-800 ms est la meilleure zone de dialogue.
- **Hangover 太长。**感觉迟──用目标用户做 A/B test──
- **没有 pre-roll buffer。**Les utilisateurs audio de la première 200-300 ms 会失失──始终保留滚滚预滚──
- **忽略 semantic endpointing。**Je pense que...  包含长停顿──用户讨厌思路中途被打断── utiliser un détecteur de tour de LiveKit ou un autre système similaire──

##  La publier

保存为 `outputs/skill-vad-tuner.md` Pour une charge de travail  choisir le modèle VAD ▌trois-

## 练习

1. **Easy。**运行  référencement`code/main.py`Il est similaire à la parole + le silence + la parole + la toux.
2. **Medium。**Montage`silero-vad`, traitement un passage 5 minutes enregistrement, modification du seuil d'optimisation, en minimisant simultanément la première phrase de coupure et de mauvais contact.
3. **Hard。**Construire un mini détecteur de virage: Silero VAD +  Basé sur les 3 niveaux de MLP de l'intégration des 10 derniers mots (Utiliser des transformateurs de phrases) ⋅

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| VAD | Voice detector | 逐帧二元判断：这是 speech 吗？ |
| Turn detection | End-pointing | VAD + silence-hangover + semantic endpoint。 |
| Silence hangover | Wait-after-speech | 宣布 turn end 前等待的时间；500-800 ms。 |
| Pre-roll | Pre-speech buffer | 在 VAD 触发前保留 300-500 ms audio。 |
| Flush trick | Kyutai hack | VAD → flush-STT → 125 ms，而不是 500 ms delay。 |
| Semantic endpoint | “他们是真的想停下吗？” | 查看 words 的 ML classifier，而不只是看 silence。 |
| TPR @ FPR 5% | ROC point | 标准 VAD benchmark；Silero 为 87.7%，WebRTC 为 50%。 |

## 延伸阅读

- [Silero VAD](https://github.com/snakers4/silero-vad) 开放 VAD 参考实现──
- [Picovoice Cobra VAD](https://picovoice.ai/products/cobra/) 商业准确率领导者──
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) 低于200 ms de techniques de construction
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) L'établissement de l'extrémité sémantique dans le milieu de production
- [WebRTC VAD](https://webrtc.googlesource.com/src/) base de l'héritage。
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) quotidialisation 级 segmentation。
