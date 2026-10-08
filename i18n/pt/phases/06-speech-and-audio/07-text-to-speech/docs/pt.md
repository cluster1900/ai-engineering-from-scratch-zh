# Text-to-Speech (TTS)  De Tacotron até F5 e Kokoro

> ASR 将语音反转为文本; TTS 将文本反转为语音──2026 年的技术分为三部分:text → Token → mel,mel → waveform──cada parte tem um modelo embuído que funciona no computador de computador de notebook──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 6 · 02 (Espectogramas & Mel), Fase 5 · 09 (Seq2Seq), Fase 7 · 05 (Transformador completo)
**Time:** ~75 minutes

## 问题

Você precisa de um 3 segundos de audio, para ouvir natural, há uma prosodia correta (((pausação、重音), para emitir "plantes", e pode estar na CPU, em 300 ms, para funcionar, para apoiar o assistente de voz em tempo real. Você também precisa trocar de som, processar entrada com código alterado ((("Lembra-me às 6 horas, daijoubu?"), e em seu nome.

O oleoduto moderno TTS parece assim:

1. **Text frontend。**规范化文本(日期、数字、电子邮件),转换为 Phoneme 或 subword Token,预测 prosody 特征──
2. **声学模型。**Text → mel spectrogram。Tacotron 2 (2017), FastSpeech 2 (2020), VITS (2021), F5-TTS (2024), Kokoro (2024)。
3. **Vocoder。**Mel → forma de onda──WaveNet (2016), WaveRNN, HiFi-GAN (2020), BigVGAN (2022), bem como vocoders de codec neural de 2024+──

Até 2026, com o surgimento de modelos de difusão e de correspondência de fluxo, a divisão de acoustic + vocoder se tornou maluca.

## 概念

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017)。**Seq2seq:char-embedding → BiLSTM encoder → atenção localização sensível → autoregressivo LSTM decoder 输出 mel frames──慢(AR),长文本上不稳定──仍被作为基线引用──

**FastSpeech 2 (2020)。**Não autoregressivo──Duration predictor 输出每个 Phoneme 获得多少 mel frames──1-pass,比塔科特龙 快 10×──损失一些自然度(monotonic alignment),但到处都在使用──

**VITS (2021)。**通過變化推論將編碼器 + 流量基時間 + HiFi-GAN vocoder 端到端联合训练──質量高,单模型──20222024年主导开源 TTS──变体:YourTTS(multi-speaker zero-shot)、XTTS v2(2024,Coqui)──

**F5-TTS (2024)。**Baseado em fluxo de correspondência de Transformador de Diffusão, uso de 5 segundos de referência para clonar voz de tiro zero, 2026

**Kokoro (2024)。**小型(82M)、可在 CPU 上运行、实时使用场景下一流的英文 TTS──封闭词表、仅英文、apache-2.0──

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3。**商业 state of the art──ElevenLabs v2.5 的情感标签("[ sussurrou]", "[risando]")和角色声音 在 2026 年 主导无线书制作──

### Vocoder 演进

| Era | Vocoder | Latency | Quality |
|-----|---------|---------|---------|
| 2016 | WaveNet | 仅 offline | 发布时的 SOTA |
| 2018 | WaveRNN | ~realtime | good |
| 2020 | HiFi-GAN | 100× realtime | 接近人类 |
| 2022 | BigVGAN | 50× realtime | 可泛化到不同 speakers/langs |
| 2024 | SNAC, DAC (neural codecs) | 与 AR models 集成 | 离散 Token，比特效率高 |

Até 2026, a maioria dos modelos "TTS" são modelos de texto a forma de onda; o espectrograma de mel é uma forma de expressão interna.

###  avaliação

- **MOS (Mean Opinion Score)。**15 分制, crowd-sourced── ainda é padrão de ouro; muito lento──
- **CMOS (Comparative MOS)。**A-vs-B 偏好── cada anotação de intervalos de confiança 更紧──
- **UTMOS, DNSMOS。**Não há referência a pré-dicionários neurais de MOS.
- **CER (Character Error Rate) via ASR。**Para obter a saída de TTS  através de Whisper, calcular com o texto de entrada CER como proxy de inteligência
- **SECS (Speaker Embedding Cosine Similarity)。**Clonagem de voz 质量──

LibriTTS test-clean 上的 2026 数字:

| Model | UTMOS | CER (via Whisper) | Size |
|-------|-------|-------------------|------|
| Ground truth | 4.08 | 1.2% | — |
| F5-TTS | 3.95 | 2.1% | 335M |
| XTTS v2 | 3.81 | 3.5% | 470M |
| VITS | 3.62 | 3.1% | 25M |
| Kokoro v0.19 | 3.87 | 1.8% | 82M |
| Parler-TTS Large | 3.76 | 2.8% | 2.3B |


```figure
sp-tts-stack
```

## Construí-lo

### 步骤 1: fonemizar entrada

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

O telefone é um ponteiro geral. Evite fazer o texto bruto entrar em qualidade de nível VITS.

### 步骤 2:运行 Kokoro(2026 CPU 默认)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

O que é que é que é?

### 步骤 3: Utilize voice cloning 运行 F5-TTS

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

传入一个 5 秒参考片段及其转录;F5 会克隆 prosódia 和 timbre。

### 步骤 4: implementar o vocoder HiFi-GAN do zero

Muito grande, não pode ser inserido no script do tutorial, mas é assim:

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

訓練:adversarial(discriminador em janelas curtas) + mel-spectrogram reconstrução Perda + função de correspondência Perda──已商品化使用 `hifi-gan`O repo ou os pontos de controlo pré-treinados da Nvidia-NeMo.

### 步骤 5: o pipeline completo (pseudocode)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## Use-o

2026  

| Situation | Pick |
|-----------|------|
| 实时 English voice assistant | Kokoro (CPU) 或 XTTS v2 (GPU) |
| 从 5 s reference 进行 voice cloning | F5-TTS |
| 商业 character voices | ElevenLabs v2.5 |
| Audiobook narration | ElevenLabs v2.5 或 XTTS v2 + fine-tune |
| Low-resource language | 在 5–20 h target-lang data 上训练 VITS |
| Expressive / emotion tags | ElevenLabs v2.5 或 StyleTTS 2 fine-tune |

截至2026年的开源领先者:**F5-TTS 代表质量，Kokoro 代表效率**Se não és um historiador, não escolha o Tacotron.

## 陷

- **没有 text normalizer。**"Dr. Smith" 读作 "Doctor" 还是"Drive"?"2026" 读作 "twenty twenty six" 还是"two zero two six"?
- **OOV proper nouns。**"Ghumare" → "ghyu-mair"?
- **Clipping。**A saída do vocoder  muito pouco clipping, mas a inferência 时 mel escalação desajuste `np.clip(wav, -1, 1)`- Não.
- **Sample-rate mismatch。**Kokoro 输出 24 kHz; seu pipeline downstream 期望 16 kHz → re-sample, senão surgirá aliasing。

## Entrega-o

保存为 `outputs/skill-tts-designer.md`◊ Para uma determinada voz, latência e linguagem alvo   desenhar um pipeline TTS ◊

## 练习

1. **Easy。**运行 `code/main.py` Construir um dicionário de fonemas, estimar a duração de cada fonema,并印一假的"mel"schedule──
2. **Medium。**安装 Kokoro,分別使用语音 `af_bella`和 `am_adam`合成同一句话──比较 áudio durações 和主观质量──
3. **Hard。**录制一段你自己的5秒参考片段――使用F5-TTS clone 它──报告引用和克隆输出 之间SECS──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Phoneme | 声音单位 | 抽象声音类别；English 中有 39 个（ARPABet）。 |
| Duration predictor | 每个 Phoneme 持续多久 | Non-AR model output；每个 Phoneme 的整数 frames。 |
| Vocoder | Mel → waveform | 将 mel-spec 映射到 raw samples 的 Neural net。 |
| HiFi-GAN | 标准 vocoder | 基于 GAN；主导 2020–2024。 |
| MOS | 主观质量 | 来自 human raters 的 1–5 mean opinion score。 |
| SECS | Voice-clone metric | target 和 output speaker Embedding 之间的 cosine similarity。 |
| F5-TTS | 2024 开源 SOTA | Flow-matching Diffusion；zero-shot cloning。 |
| Kokoro | CPU English leader | 82M-param model，Apache 2.0。 |

## 延伸阅读

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) linha de base sec2 sec
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) 端到端 baseada em fluxo。
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) 当前开源 SOTA。
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) Vocoder ainda em uso em 2026
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) 2024 TTS Inglês amigável com CPU。
