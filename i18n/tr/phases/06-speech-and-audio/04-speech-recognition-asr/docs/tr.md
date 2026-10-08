# Konuşma Tanıma (ASR)  CTC, RNN-T, Dikkat

> 语音识别, her zamanın bir aşamasında ses ses sınıfı yapılır, sonra bir İngilizce ve静音'ün bir dizi modeli tarafından onları birleştirir. CTC、RNN-T 和 Dikkat, üç yolla gerçekleştirilmektedir.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

## 问题

Bir 10 saniye 16 kHz sesli bir parça vardır. Bir bir parça almak istiyorsun. "Köşenize ışıkları açın" gibi bir şey var.

Üç biçimlendirme yolu bu sorunu çözmek için kullanılabilir:

1. **CTC (Connectionist Temporal Classification)。**输出每的代币 概率,包括一个特殊的 *blank*──在解码时折叠重复项和空──非自归,速度快──wav2vec 2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**Ortak ağ 和先前Token 条件下预测下一个Token──可流式处理──Google'ın端侧 ASR、NVIDIA Parakeet 使用它──
3. **Attention encoder-decoder。**Kodlayıcı, gizli durumlara kısaltılır, dekodör 通過交叉等待自回归生成 Token──Whisper、SeamlessM4T 使用它──

2026 yılına kadar, LibriSpeech test-clean 上的 SOTA %1.4% (Parakeet-TDT-1.1B, NVIDIA) 和 1.58% (Whisper-Large-v3-turbo) 〜差异很小;部署差异很大──

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让编码器 输出 `T`个级分布,覆盖 `V+1`个Token(V 个字符 + blank) ⋅对于长度为 `U < T`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `y`Herhangi bir çarpışmanın ardından elde edelim.`y`CTC kaybı, tüm bu tür karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı karşı

优点:非自归、可流式处理、零前──缺点:* koşullu bağımsızlık varsayımı*, yani her 预测 birbirinden bağımsızdır, bu nedenle iç dil modeli yoktur。可通过束搜索或浅融合 接入外部LM 来修正。

**RNN-T 直觉。**添加一个 *预测器* 网络 来 Embedding Token 历史,并添加一个 *joiner*,将预测器状态与编码器 组合成一个覆盖 `V+1`Bu arada, bu da bir arada.`+1`CTC 忽略的条件依赖──它可流式处理,因为每一步只依赖于过去和过去的代币──

优点:可流式处理 + 内部 LM。缺点:训练更复杂且更耗内存(3D kaybı ağ);RNN-T kaybı çekirdekleri 本身就是一个完整的库类──

**Attention encoder-decoder。**Kodlayıcı(6-32 katlı transformatör) işlem log-mel ── dekoder(6-32 katlı transformatör) çapraz olarak kodlayıcıya ulaşır 输出,并自归归生成 Token。没有对齐约束,注意可以查看音频中的任意位置──除非限制注意(切碎的语流, 2024),否则不可流式处理──

优点:离线 ASR 质量最高,易用标准seq2seq 工具训练──缺点:自归延迟与输出长度成正比;没有工程改造就无法流式处理──

### WER: bir sayı

**Word Error Rate**= `(S + D + I) / N`, içinde S= değiştir, D= kaldır, I=插入, N= references文文本词数──它对应词级 Levenshtein edit distance──越低越好──WER 越低越好──WER 越低于20% 通常不可用;低于5%对朗读语音而言达到人类水平──2026年标准基准 数字:

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

Bunlar hepsi kodlayıcı-dekodöre veya RNN-T'ye dayanmaktadır.


```figure
ctc-collapse
```

## Yapın onu.

### 步骤1: açgözlülük CTC çözümü

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

两条规则: 折叠连续重复项, 丢弃空白.`a a _ _ a b b _ c`→ `a a b c`- Evet.

### 步骤 2: ışın araması CTC

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

生产环境使用带 LM fusion 之前兆树束搜索;这是概念骨架──

### 步骤 3:DURU

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

### 步骤 4:对 Whisper 执行 inference

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

Bu 2026 yılının en güçlü genel ASR's bir yazı biçimidir. 24 GB GPU'da yaklaşık 20× gerçek zamanlı 运行.

### 5 adım: Parakeet veya wav2vec 2.0 kullanın  Akışta yayın yapın

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

Akış ASR   parça kodlama dikkat 和 taşınma durumu; kullanmak destek onun deposu(用于 Parakeet 的 NeMo,或带 `chunk_length_s``transformers`(Hızlı)

## Kullan

2026 yılının sonu:

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## 2026 yılında hala üretim çukurları olacak.

- **没有 VAD。**"Sözünüzü dinlediğiniz için teşekkürler!"
- **字符 vs 词 vs subword WER。**Normalleşme sırasında, küçük yazılar, işaret noktaları,
- **Language ID drift。**Şapışmanın otomatik LID'i ses bölümünü yanlış yolla Japonca veya Welshca yönlendirecek.`language="en"`- Evet.
- **长片段不做 chunking。**Şapışın, 30 saniyelik bir pencerede.`chunk_length_s=30, stride=5`- Evet.

## - Söyle.

保存为 `outputs/skill-asr-picker.md`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊                                                                                                                                                                                                                                                                            

## 练习

1. **Easy。**运行  İşlem`code/main.py`◊ elle yapılmış CTC 输出 贪心的解码,并计算对参考文本的 WER ◊
2. **Medium。**Doğru gerçekleştirmek Adım 2 İçin önlük-taş ışın arama (Blank merge rule) ◊ 10 örnekli sintetizasyon verilerinde açgözlülükle karşılaştırmak
3. **Hard。**- Evet .[LibriSpeech test-clean](https://www.openslr.org/12)上使用 `whisper-large-v3-turbo`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                  

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

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 论文。
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 论文。
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022 yılının kanonik 论文; v3-turbo 扩展 yayınlanan 2024 yılında。
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b)2026 Açık ASR Lider Tablosu 榜首──
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 覆盖 25+ model 的实时基准──
