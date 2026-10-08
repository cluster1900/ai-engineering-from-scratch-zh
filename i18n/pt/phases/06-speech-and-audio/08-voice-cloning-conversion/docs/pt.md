# Clonagem de voz e conversão de voz

> A clonagem de voz vai usar a voz de outra pessoa para ler o seu texto. A conversão de voz vai manter o que você diz, ao mesmo tempo em que a sua voz é transformada em voz de outra pessoa.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## O problema

Em 2026, um vídeo de 5 segundos já é suficiente para produzir clones de alta qualidade de qualquer som com GPU de consumo. ElevenLabs, F5-TTS, OpenVoice v2, VoiceBox já fornecem clonagem de zero tiros ou poucos tiros. Esta tecnologia é uma tecnologia de acesso TTS, distribuição de voz, assistência ao som, também arma.

Duas missões estreitamente relacionadas:

- **Voice cloning（TTS 侧）：**texto + 5 segundos de referência voz → O áudio do som.
- **Voice conversion（speech 侧）：**A voz de referência de B → B disse X

 ambos vão dividir a forma de onda em contato, alto-falantes, prosódia, re-posição de um conteúdo de origem com outro de origem de alto-falantes 重新组合──

Quando você lançar em 2026 deve cumprir as seguintes regras:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**O seu gasoduto tem de emitir uma marca de água inaudivel, e não pode ser clonado sem consentimento.

## O conceito

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**Clip de 5 segundos  Transmitir a um modelo treinado por milhares de oradores ⋅ Encoder de oradores ⋅ Clip de mapeamento para incorporar oradores ⋅ TTS decoder 以该嵌和文本 ⋅ Como condição

Utilizador:F5-TTS(2024)、YourTTS(2022)、XTTS v2(2024)、OpenVoice v2(2024)。

**Few-shot fine-tuning。**录制目标声音的 5-30 分钟音频──对基模型进行一小时 LoRA fine-tune──质量会从还行跃升到难以区分──Coqui 和 ElevenLabs都支持这种模式;社区也将它用于F5-TTS──

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (por exemplo, posteriors de fonemas suaves, PPGs), então use target speaker embuilding 重新合成──对语言 和口音 更稳健──KNN-VC(2023)、Diff-HierVC(2023) Use this method──
- **Disentanglement。**訓練一個自動編碼器,在瓶頸的潜伏中分离内容、音箱 和 prosody──推理时替换音箱嵌入──質量较低但更快──AutoVC(2019)、VITS-VC 变体使用这种方法──

**基于 Neural codec 的 cloning（2024+）。**VALL-E、VALL-E 2、NaturalSpeech 3、VoiceBox  Veja o áudio 视为来自SoundStream / EnCodec's离散代币, em codec tokens 上训练大型autoregressive或流量匹配模型──短提示 上的质量可与ElevenLabs 相比──

### 伦理部分, não adicionais

**Watermarking。**PerTh (Perth) e SilentCipher (SilentCipher) (em 2024) serão inseridos no áudio de forma impercepível em cerca de 16-32 bits de ID.

**Consent gates。** deve fazer cada produção clonada com o registro de consentimento de verificação 配对──我, Rohit, em 2026-04-22, autorizou esta voz para uso com propósito X── armazenada em registro de manipulação evidente──

**Detection。**AASIST、RawNet2 和 Wav2Vec2-AASIST 都提供探测器──ASVspoof 2025 challenge 发布的结果显示,state-of-the-art detectors 针对ElevenLabs、VALL-E 2 和 Bark 输出 EER为0.82.3%──

### Números (XXXXX)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0,70 para a maioria dos ouvintes já é difícil de distinguir entre os sons de destino e os de audiência.


```figure
sp-voice-factorize
```

## Construí-lo

### Passo 1: Use reconhecimento-síntese 分解(`main.py`(Demo de código só)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

O conceito é muito simples; a principal complexidade da realização é a de`tts_model`和 alto-falantes codificador 中。

### Passo 2: Use o F5-TTS para fazer um clone de tiro zero

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

Transcrição de referência  deve ser totalmente adequada ao áudio; não adequada irá prejudicar o alinhamento.

### Passo 3: Utilize KNN-VC fazer conversão de voz

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行 WavLM, 提取 per-frame embeddings, then will each source frame  substituir 为 pool middle's nearest neighbor──非参数方法, using一分钟 target speech 即可工作──

### Passo 4: 嵌入 watermark

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

Cerca de 32 bits de carga útil, em MP3 recodificar e baixo ruído ainda pode ser verificado.

### Passo 5: Portal de consentimento

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## Usá-lo

Estaca de 2026:

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## Encurralagens

- **Reference transcript 未对齐。**F5-TTS 和类似模型要求参考文献与参考音频 完全匹配,包括标点──
- **Reference 有混响。**Echo vai destruir o clone.
- **情绪不匹配。**                                                                                                                                                                                                                                                             
- **Language leakage。**Clone English speaker 后让模型说法语,通常仍会带着口音; usar modelos translinguários XTTS、VALL-E X) ⋅
- **没有 watermark。**A partir de 2026 em agosto, a publicação no mercado europeu não é legal.

## Envia-o

保存为 `outputs/skill-voice-cloner.md` conceber um portão de consentimento + marca de água + alvo de qualidade de clonagem ou de conversão 

## Exercícios

1. **Easy。**运行 `code/main.py`△ através do cálculo dos dois alto-falantes 在 swap 前后的kosine,演示扬声器嵌入式 swap──
2. **Medium。**Utilize OpenVoice v2 clone Sua própria voz, referência de medida e entre clone, SECS, através de Whisper, medida CER,
3. **Hard。**Para 20 clones  aplicar SilentCipher watermark, irá encodá-los através de 128 kbps MP3 + decodear, reexaminar a carga útil ― relatar bit-accurididade ―

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## Mais leitura

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) Clonagem de código aberto SOTA de tiro zero。
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)和 [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) TTS de codec neural 
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879)  Conversão de voz baseada em desembaraçamento。
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975)  Baseada em recuperação de VC──
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) 生产可用32bit áudio watermark──
- [ASVspoof 2025 results](https://www.asvspoof.org/) detector e sintetizador de competição de armamento, 2026
