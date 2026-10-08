# Avaliação de áudio  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布;;本课为每种音频任务命名 2026年的指标:ASR:ASR: WER: CER: RTFx: TTS: MOS: UTMOS: SECS: WER: WER: ASR: RUND-TRIPS: MMAU: LongAudioBench:音乐: FAD: CLAP: 

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## 问题

Cada tarefa de som tem vários indicadores, cada indicador mede diferentes dimensões. Usando um indicador errado, você vai publicar um modelo no painel de controle que parece ótimo, mas que funciona muito mal no ambiente de produção.

| Task | Primary | Secondary |
|------|---------|-----------|
| ASR | WER | CER · RTFx · first-token latency |
| TTS | MOS / UTMOS | SECS · WER-on-ASR-round-trip · CER · TTFA |
| Voice cloning | SECS (ECAPA cosine) | MOS · CER |
| Speaker verification | EER | minDCF · FAR / FRR at operating point |
| Diarization | DER | JER · speaker confusion |
| Audio classification | top-1 · mAP | macro F1 · per-class recall |
| Music generation | FAD | CLAP · listening panel MOS |
| Audio language model | MMAU-Pro | LongAudioBench · AudioCaps FENSE |
| Streaming S2S | latency P50/P95 | WER · MOS |

## 概念

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### Indicador de RAS

**WER (Word Error Rate)。** `(S + D + I) / N`◊评分前先转小写、 deletes de marcadores、 regulamentar números。 `jiwer`Ou OpenAI `whisper_normalizer`◊&lt;5% = 朗读语音 atingir o nível humano。

**CER (Character Error Rate)。**Para usar a língua tradicional, o mandarim e o cantonês podem ser utilizados em diferentes línguas.

**RTFx (inverse real-time factor)。**Cada relógio de parede 秒处理的音频秒数──越高越好──Parakeet-TDT 达到3380×── sussurro-grande-v3 约为 ~30×──

**First-token latency。**Desde o áudio do vídeo para o primeiro transcrição do token 时间──对流 至关重要──Deepgram Nova-3:~150 ms──

### TTS indicativo

**MOS (Mean Opinion Score)。**1-5   的人工评分──黄金标准,但速度慢──每个样本收集 20+ 听众,每个模型 100+样本──

**UTMOS (2022-2026)。** MOS 预测器 训练得到的.  预测器.  预测器.  预测器.  预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器. 预测器.

**SECS (Speaker Encoder Cosine Similarity)。**Utilizado para clonagem de voz. Referência audio频与克隆输出之间的 ECAPA Embedding cosine.

**WER-on-ASR-round-trip。**Em TTS 输出上运行 Whisper,并相对输入文本计算 WER──用于捕捉可理解度回归──2026 SOTA:&lt;2% CER──

**TTFA (time-to-first-audio)。**端到端延迟──Kokoro-82M: ~100 ms; F5-TTS: ~1 s──

### Clonagem de voz 专用指标

**SECS + MOS + CER**Como três grupos. SECS alto mas MOS baixo de clon, explicar o som certo mas não natural; inversamente, explicar o som natural mas falar não é contra.

### Verificação de alto-falantes

**EER (Equal Error Rate)。**Taxa de aceitação falsa 等等等 false rejeição taxa 值──ECAPA 在 VoxCeleb1-O 上:0.87%──

**minDCF (min Detection Cost)。**Em pontos de exploração determinados (normalmente FAR=0,01) o aumento do custo de produção é mais próximo do que o da EER.

### Diarização

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time`◊漏检语音 + 误报语音 + 说话人混, cada item é uma fatia ◊AMI reuniões:DER ~10-20% 是现实水平──pianonote 3.1 + Precision-2 comercial:在录制良好的音频上 &lt;10% DER──

**JER (Jaccard Error Rate)。**Indicador de substituição do DER, para o corte de fragmentos de diferença mais estável.

### Classificação de áudio

Multi-etiqueta: todos os tipos de categorias**mAP (mean Average Precision)**◊AudioSet:BEATs-iter3 为 0.548 mAP──

互斥 Multi-classe:**top-1、top-5 accuracy**❖ Comando de fala v2:99.0% top-1 (Audio-MAE) ❖

类别 desequilíbrio:**macro F1**+ **per-class recall** Relatório por classe, exatidão total 会掩盖哪些类别失败──

### Geração de música

**FAD (Fréchet Audio Distance)。**O que é o "Música" (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (Música) (M) (Música) (M) (Música) (Música) (M) (Música) (M) (Música) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M) (M

**CLAP Score。**Utilize CLAP Embedding 的文本-音频对齐分数──&gt; 0.3 = 合理对齐──

**Listening panel MOS。**Para o consumo de música, ainda é um julgamento final.

### Indicador de referência de áudio

**MMAU (Massive Multi-Audio Understanding)。**10k 个音频 QA 对──

**MMAU-Pro。**1800 个困难条目,四类:discurso / som / música / multi-áudio──4 选 1 的随机水平为25%──Gemini 2.5 Pro 总体约 ~60%;所有模型 在多音上约 ~22%──

**LongAudioBench。**Talvez, um pouco mais tarde, o Flamingo vai passar o Gemini 2.5 Pro.

**AudioCaps / Clotho。**Captioning benchmark──SPICE、CIDER、FENSE 指标──

### Transmissão de fala para fala

**Latency P50 / P95 / P99。**Desde o end de um discurso do usuário até o primeiro relógio de parede de som 时间──Moshi:200 ms; GPT-4o Realtime:300 ms──

**WER / MOS**Usado para a saída.

**Barge-in responsiveness。**Desde o usuário quebrando até o assistente que está em voz baixa.

### 2026 排行榜

| Leaderboard | Tracks | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | English + multilingual + long-form | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | English TTS | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO from paired votes | `artificialanalysis.ai/speech` |
| MMAU-Pro | LALM reasoning | `mmaubenchmark.github.io` |
| SpeakerBench / VoxSRC | Speaker recognition | `voxsrc.github.io` |
| MMAU music subset | Music LALM | (within MMAU) |
| HEAR benchmark | Self-supervised audio | `hearbenchmark.com` |


```figure
sp-wer-align
```

## Construção

### 步骤 1:带规范化的 WER

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip

transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(
    truth="Please turn on the lights.",
    hypothesis="please turn on the light",
    truth_transform=transform,
    hypothesis_transform=transform,
)
# ~0.17
```

### 步骤 2:TTS WER de ida e volta

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### 步骤 3: para clonagem de voz de SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### 步骤 4: para geração de música

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### 步骤 5: para a verificação do EER dos oradores(com lição 6

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        frr = sum(1 for s in same_scores if s < t) / len(same_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

## Utilização

Para cada implantação, um conjunto de avaliação fixa e, em cada modelo, uma nova implementação.

1. **评分前先规范化。**转小写、去标点、展开数字―― relatório regulamentação de regras―
2. **报告分布，而不是平均值。**Latência 报 P50/P95/P99。 Classificação 报 por classe de recall。 MMAU 报 por categoria。
3. **运行一个标准公开 benchmark。**Mesmo que os seus dados de produção sejam diferentes, o relatório de alta qualidade em Open ASR / TTS Arena / MMAU também pode fazer uma avaliação com a comparação de calibre.

## 陷

- **UTMOS 外推。**É treinado em VCTK 风格的干净语音上训练; em 杂 / 克隆 / 情绪化音频评分较差.
- **MOS panel 偏差。**20 trabalhadores da Amazon Mechanical Turk ≠ 20 个目标用户──如果风险高,就为领域面板 付费──
- **FAD 依赖参考集。**跨模型比较时, deve utilizar a mesma distribuição de referência.
- **Aggregate WER。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- **公开 benchmark 饱和。**A maioria dos modelos de fronteira em referência estática acima está perto de cima.

## 发布

保存为 `outputs/skill-audio-evaluator.md`◊ para qualquer modelo de rádio  发布选择指标、基准和报告格式──

## 练习

1. **Easy。**运行 `code/main.py` em brinquedo 输入上计算 WER / CER / EER / SECS / FAD-ish / MMAU-ish。
2. **Medium。**Construir um arsenal de WER de ida e volta TTS. Vai-te o Kokoro ou F5-TTS.
3. **Hard。**Em MMAU-Pro discurso + multi-audio 子集 ((cada 50 条目) 上评测你在10 Lesson 中选择的 LALM── relatório por categoria precisão,并与已发布数字比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| WER | ASR 分数 | 规范化后 word 级别的 `(S+D+I)/N`。 |
| CER | Character WER | 用于声调语言或 char-level 系统。 |
| MOS | 人类意见 | 1-5 评分；20+ 听众 × 100 样本。 |
| UTMOS | ML MOS 预测器 | 训练得到的 model；与人工 MOS 相关性约 ~0.9。 |
| SECS | Voice-clone 相似度 | 参考音频与克隆音频之间的 ECAPA cosine。 |
| EER | Speaker verif 分数 | FAR = FRR 的阈值。 |
| DER | Diarization 分数 | (FA + Miss + Confusion) / total。 |
| FAD | Music-gen 质量 | VGGish Embedding 上的 Fréchet distance。 |
| RTFx | 吞吐量 | 每个 wall-clock 秒处理的音频秒数。 |

## 延伸阅读

- [jiwer](https://github.com/jitsi/jiwer) 带规范化工具的 WER/CER 库──
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152)O MOS 预测器  训练得到的 MOS 预测器──
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) música-gen 标准。
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜──
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) Raciocínio LALM 排行榜。
- [HEAR benchmark](https://hearbenchmark.com/) referência de áudio SSL。
