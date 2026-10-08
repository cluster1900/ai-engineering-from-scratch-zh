# Reconhecimento do discurso (ASR)  CTC, RNN-T, atenção

> O reconhecimento do som é realizado em cada etapa do tempo, depois de um modelo de sequência de entendendo o inglês e o silencioso ligá-los juntos.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

## 问题

Você tem um 10 segundos, 16 kHz de vídeo. Você quer obter um fio: "acende as luzes da cozinha". O desafio está na estrutura:

Três formas de formalização podem resolver este problema:

1. **CTC (Connectionist Temporal Classification)。**输出每的代币 概率, incluindo um especial *blank*──在解码时折重复项和空──非自归,速度快──wav2vec 2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**Rede conjunta em um determinado codificador 和先前Token 情况下预测下一个Token──可流式处理──Google's端侧ASR、NVIDIA Parakeet 使用它──
3. **Attention encoder-decoder。**O encoder vai ser encodado para estados ocultos, o decodador atende através de cruzamentos.

Até 2026, o teste de LibriSpeech-clean 上的SOTA WER为1.4% (Parakeet-TDT-1.1B, NVIDIA) 和1.58% (Whisper-Large-v3-turbo)──差异很小;部署差异很大──

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让编码 输出 `T`个级分布,覆盖 `V+1`个 Token(V 个字符 + em branco) ⋅对于长度为 `U < T`Do que é que é que é?`y`- Não , não .`y`Definição: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: CTC: C

优点:非自归、可流式处理、零前──缺点:*assunção de independência condicional*, isto é, cada predicção é independente de si mesma, portanto, não há um modelo de linguagem interna──可通过束搜索或浅融合──接入外部LM 来修正──

**RNN-T 直觉。**添加一个 *predictor* network 来 Embedding Token 历史,并添加一个 *joiner*,将预测器状态与编码器 组合成一个覆盖 `V+1`De distribuição conjunta`+1`É nula / não emitida) ―― Obviamente construção CTC 忽略的条件依赖──它可流式处理,因为每一步只依赖过去和过去的代币──

优点:可流式处理 + 内部 LM。缺点:训练更复杂且更耗内存(3D loss lattice);RNN-T loss kernels 本身就是一个完整的库类别──

**Attention encoder-decoder。**Encoder(6-32 层变体) Processar log-mail ──Decoder(6-32 层变体)cross-attends 到 encoder 输出,并自归归生成 Token──没有对齐约束,Attention 可以查看音频中的任意位置──除非限制Attention(chunked Whisper-Streaming, 2024),否则不可流式处理──

优点:离线 ASR 质量最高,易用标准seq2seq 工具训练──缺点:自归延迟与输出长度成正比;没有工程改造就无法流式处理──

### WER: um número

**Word Error Rate**- Não .`(S + D + I) / N`, em que S= substituir, D= eliminar, I= inserir, N= referência文文本词数──它对应词级 Levenshtein edit distance──越低越好──WER Superior a 20% normalmente inconveniente; inferior a 5% para atingir o nível humano──2026年标准基准 数字:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

Estes são todos baseados em codificador-decodificador ou RNN-T── puro sistema CTC  (wav2vec 2.0) em teste-limpo  上大约为 1.8-2.1%──


```figure
ctc-collapse
```

## Construí-lo

### 步骤 1: codificação de CTC gananciosa

```python
def ctc_greedy(frame_logits, blank=0, vocab=None):
    # frame_logits: list of per-frame probability vectors
    preds = [max(range(len(p)), key=lambda i: p[i]) for p in frame_logits]
    out = []
    prev = -1
    for p in preds:
        if p != prev and p != blank:
            out.append(p)
        prev = p
    return "".join(vocab[i] for i in out) if vocab else out
```

两条规则: folhação连续重复项, abandonado em branco.`a a _ _ a b b _ c`→ `a a b c`- Não.

### 步骤 2: CTC de busca de feixe

```python
def ctc_beam(frame_logits, beam=8, blank=0):
    import math
    beams = [([], 0.0)]  # (tokens, log_prob)
    for p in frame_logits:
        log_p = [math.log(max(pi, 1e-10)) for pi in p]
        candidates = []
        for seq, lp in beams:
            for t, lpt in enumerate(log_p):
                new = seq[:] if t == blank else (seq + [t] if not seq or seq[-1] != t else seq)
                candidates.append((new, lp + lpt))
        candidates.sort(key=lambda x: -x[1])
        beams = candidates[:beam]
    return beams[0][0]
```

生产环境使用带 LM fusion                                                                                                                                                                                                                                                           

### 步骤 3:

```python
def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    dp = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        dp[i][0] = i
    for j in range(len(h) + 1):
        dp[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(r)][len(h)] / max(1, len(r))
```

### 步骤 4:对 Whisper  Execução da inferência

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

É a primeira linha de ASR de 2026 mais forte em uso geral.

### 步骤 5: usar Parakeet ou wav2vec 2.0  para fazer streaming

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

Streaming ASR  necessita de atenção de codificador em pedaços 和 estado de transporte; usar apoio de sua biblioteca(`chunk_length_s`de `transformers`(PIP)

## Use-o

2026 ano de:

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## O ano 2026 ainda vai chegar a uma cratera de produção.

- **没有 VAD。**"Obrigado por assistir!" (始终使用 VAD做门控──)
- **字符 vs 词 vs subword WER。**Em normalização (小写、去标点) *之后* WER
- **Language ID drift。**O LID automático do sussurro irá transferir o vídeo de ruído erroneamente para o japonês ou o galego; quando você determinar a linguagem, forçar `language="en"`- Não.
- **长片段不做 chunking。**Suspirar há 30 segundos de janela.`chunk_length_s=30, stride=5`- Não.

## Entrega-o

保存为 `outputs/skill-asr-picker.md`◊ For given determin deployment objective selection model、decoding strategy、chunking 和 LM fusion──

## 练习

1. **Easy。**运行 `code/main.py` Ele irá fazer um decodificador ganancioso de CTC de construção manual, e calcular em relação ao WER do texto de referência.
2. **Medium。**O primeiro passo é a busca de prefixos em árvores.
3. **Hard。**Em[LibriSpeech test-clean](https://www.openslr.org/12)上使用 `whisper-large-v3-turbo`△计算前 100 条 条 发表的 WER──与已发布数字比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| CTC | blank-token loss | 对所有 frame-to-token 对齐做 marginal；非 AR。 |
| RNN-T | streaming loss | CTC + next-token predictor；处理词序。 |
| Attention enc-dec | Whisper-style | Encoder + cross-attending decoder；最佳离线质量。 |
| WER | 你报告的数字 | 词级 `(S+D+I)/N`。 |
| Blank | 空白 | CTC 中表示“此帧无发射”的特殊 Token。 |
| LM fusion | 外部 language model | 在 beam search 期间加入加权 LM log-probs。 |
| VAD | 静音门控 | Voice activity detector；裁剪非语音。 |

## 延伸阅读

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 论文──
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 论文。
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022 ano canônico 论文; v3-turbo 扩展 lançado em 2024 年。
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) 2026 Líder de RAS Aberto 榜首──
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 覆盖 25+ modelos 的实时基准──
