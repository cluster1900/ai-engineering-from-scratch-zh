# Suspirar  Arquitetura e ajuste fino

> Whisper é um transformer de 30 segundos de janela codificador-decodificador, treinado em 680k 小时s multilíngue fracamente supervisionado áudio-texto pares。 uma arquitetura, várias tarefas,跨 99 种语言都 robust。 2026年参考 ASR。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## O problema

Whisper foi lançado pela OpenAI em setembro de 2022, sendo o primeiro modelo ASR em uso como produto: adesão de áudio, obter texto, suportar 99 idiomas, resistência ao ruído, disponível em computador portátil; até 2024, a OpenAI já lançou variantes Large-v3 e Turbo; até 2026, o Whisper foi lançado a partir da transcrição de podcast para assistentes de voz e até a base padrão de subtítulos do YouTube.

Mas o sussurro não é um tubo que pode ser usado para sempre em caixa negra.

1. É o que está dentro dela.
2. Como é que é que o vídeo é feito?
3. Como é que é que é preciso?

## O conceito

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准 transformador encoder-decoder。

- Entrada 30 segundos de log-mail espectrograma, 80 mels, 10 ms salto → 3000 quadros.
- Encoder:conv-downsample (passo 2) + `N`Blocos de transformador... em grandes camadas... 32... 1280... 20 cabeças...
- Decodificador:带 causal self-attn + para encodificador de saída fazer cross-attn `N`Blocos de transformador.
- Resultado: cobertura de 51.865 tokens de vocais de tokens BPE.

Grande-v3 tem parâmetros de 1,55B──Turbo utiliza um decodificador de 4 camadas(de 32 camadas reduzido), em <1% WER 损失换到 8× latency 降低──

**Prompt format。**Whisper é um por decodificador de prompt.

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` tag de língua; 行为强制翻译对转录
- `<|transcribe|>`Ou `<|translate|>` From arbitrary language input 翻译为英语输出,或逐字转写。
- `<|notimestamps|>` 跳过 word-level timestamps (((更快) 🙈

Faça um modelo capaz de realizar muitas tarefas.`<|en|>`改成 `<|fr|>`- Vai ser traduzido em francês.

**30-second window。**Tudo fixa em 30 segundos. Clipes mais longos precisam ser cortados. Clipes mais curtos, com padding. Windows não é um streaming original.

**Log-mel normalization。** `(log_mel - mean) / std`, entre as estatísticas vem do próprio corpo de treinamento de Whisper.`whisper.audio.log_mel_spectrogram`), em vez de `librosa.feature.melspectrogram`- Não.

### Variantes em 2026

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### Apontação fina

Fluxo de trabalho canônico de 2026:

1. 收集 10100 小时目标领域音频,并配有一致的转录──
2. Utilização `transformers.Seq2SeqTrainer`,带 `generate_with_loss`- Voltar a ligar.
3. Parâmetro-eficiente: em camadas de atenção `q_proj`- Não.`k_proj`- Não.`v_proj`上使用LoRA,可将 GPU memory 降低 4×,WER 代价 <0.3──
4. Se tiveres apenas 10 horas, congela o codificador.
5. Use Whisper  próprio Tokenizer 和 formato de prompt; absolutamente não substituir tokenizers。

社区结果:在 20 小时医疗命令上调中,将把医疗词汇上调 WER 从 12% 降至 4.5%──在 4 小时冰岛上调 Turbo,将把 WER 从 18% 降至 6%──


```figure
sp-asr-attention
```

## Construí-lo

### Passo 1: 直接运行 Suspirar

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe(
    "clip.wav",
    language="en",
    task="transcribe",
    temperature=0.0,
    condition_on_previous_text=False,  # prevents runaway repetition
)
print(result["text"])
for seg in result["segments"]:
    print(f"[{seg['start']:.2f}–{seg['end']:.2f}] {seg['text']}")
```

Você deve sempre cobrir as principais configurações padrão:`temperature=0.0`(sampulação 默认是0.0 → 0.2 → 0.4 ... cadeia de retorno)`condition_on_previous_text=False`(prevenir o problema da alucinação em cascata), bem como `no_speech_threshold=0.6`(Detecção do silêncio)

### Passo 2: forma longa em pedaços

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX 添加了 (1) Silero VAD gating,(2) 通过 wav2vec 2.0 通过做字级排列,(3) 通过 `pyannote.audio`Fazer diário... é o cavalo de trabalho da produção de transcrição em 2026.

### Passo 3: Utilize LoRA-fine-tune

```python
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1, bias="none", task_type="SEQ_2_SEQ_LM",
)
model = get_peft_model(model, lora)
# model.print_trainable_parameters()  -> ~3M trainable / 809M total
```

Depois, use o Standard Trainer loop.

### Passo 4: Revisão de cada camada de aprendizado

```python
# Grab cross-attention weights during decode to see what the decoder attends to.
with torch.inference_mode():
    out = model.generate(
        input_features=features,
        return_dict_in_generate=True,
        output_attentions=True,
    )
# out.cross_attentions: layer × head × step × src_len
```

Usando o heatmap 可视化, você verá os passos do decodificador 扫过编码框架 时形成横向对齐――这条横向就是对词时刻的理解的语──

## Usá-lo

Estaca 2026:

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2 backend) é o 2026 mais rápido CPU + GPU inferência tempo de execução, em comparação com a vanilla 快 4×, saída igual.

## Encurralagens que ainda se lançam em 2026

- **Hallucinated text on silence。**Whisper  baseado em legendas 训练, contendo "Obrigado por assistir!"、"Subscreva!"、 letra da música。调用前始终做 VAD-gate。
- **`condition_on_previous_text` cascade。**Uma alucinação vai contaminar as janelas.`False`- Não.
- **Short-clip padding。**Um enchimento de clip de 2 segundos até 30 segundos depois, pode alucinar no final.`pad=False`Ou VAD-gate.
- **Wrong mel stats。**Use librosa de mels e não Whisper de mels, vai ocorrer quase que de qualquer maneira.`whisper.audio.log_mel_spectrogram`- Não.

## Envia-o

保存为 `outputs/skill-whisper-tuner.md`◊ Para um domínio determinado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## Exercícios

1. **Easy.**运行 `code/main.py`▽It tokenize a um tipo de sutil de sussurro, calcula os orçamentos de forma decodificada,并印 10 分钟 clip ⋅
2. **Medium.**Instalação`faster-whisper`,转写一个10分钟播客,并与人类转录比较WER――尝试 `language="auto"`Com obrigação`language="en"`- Não.
3. **Hard.**Utilizando HF `datasets`, escolher um tipo de Whisper expressão de comida forte linguagem (por exemplo Urdu), em 2 小时数据上使用 LoRA fine-tune Medium 2 epochs,并报告 WER delta──

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## Mais leitura

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356)Arquitetura e receita de formação
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363)- Decodificador de 4 camadas, 8x aceleração.
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) longa-forma 、alineada-palavra 、diarizada
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2-supportado, 快 4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) LoRA canônico / caminhada completa de FT。
