# Susurro  Arquitectura y ajuste fino

> Whisper es un transformer de ventana de 30 segundos, codificador-decodificador, entrenado en 680k 小时 de pares de audio-texto multilingües débilmente supervisados.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## El problema

Whisper fue lanzado por OpenAI en septiembre de 2022, es el primer modelo ASR de entrega de forma de producto: pega audio, obtenga texto, soporte 99 idiomas, para el ruido robusto, se puede usar en un ordenador portátil. Hasta 2024, OpenAI ya ha lanzado las variantes Large-v3 y Turbo; hasta 2026, Whisper es desde la transcripción de podcast hasta los asistentes de voz y hasta la base predeterminada de los subtítulos de YouTube.

Pero el susurro no es una tubería que se puede usar siempre en la caja negra. El cambio de dominio lo matará.

1. En el interior es lo que es.
2. ¿Cómo es que se puede hacer un audio en forma larga o en streaming?
3. ¿Qué es lo que hace que se haga el tono?

## El concepto

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准 transformador codificador-decodificador

- Entrada de 30 segundos de espectrograma log-mel, 80 mels, 10 ms salt → 3000 cuadros.
- Encoder:conv-downsample (paso 2) + `N`Bloques de transformadores... en grandes capas de 32 v... 1280 de 20 cabezas...
- Decodificador:带 causal auto-attn + para la salida del codificador hacer cross-attn `N`Bloques de transformador.
- Producción: cobertura de 51.865 tokens de la palabra de la palabra BPE.

Gran v3 tiene parámetros 1.55B──Turbo utiliza un decodificador de 4 capas(desde 32 capas reducido), en <1% WER 损失换到 8× latency 降低──

**Prompt format。**Whisper es un descifrador de instrucciones de entre los tokens especiales  control de multitarea modelo:

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` etiqueta de lenguaje; 行为强制翻译对转录
- `<|transcribe|>`O `<|translate|>` From arbitrary language input 翻译为英语输出,或逐字转写。
- `<|notimestamps|>` 跳过 word-level timestamps(更快)。

Pronto, haga que un modelo pueda realizar muchas tareas.`<|en|>`改成    cambió`<|fr|>`, se traducirá en francés.

**30-second window。**Todo está fijado en 30 segundos. Más clips necesitan chunking. Más clips cortas, se empolvarán. Windows no es un streaming original, eso es lo que hace que exista WhisperX.

**Log-mel normalization。** `(log_mel - mean) / std`, entre las estadísticas proviene de Whisper su propio cuerpo de entrenamiento.`whisper.audio.log_mel_spectrogram`), en lugar de `librosa.feature.melspectrogram`¿Qué es eso?

### Variantes en 2026

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### Arreglamiento

Flujo de trabajo canónico de 2026:

1. 收集 10100 小时目标领域音频,并配有配线的转录──
2. Uso `transformers.Seq2SeqTrainer`,带 `generate_with_loss`Llamadas de nuevo.
3. Parámetro-eficiente: en las capas de atención de`q_proj`¿Qué es esto?`k_proj`¿Qué es esto?`v_proj`上使用LoRA,可将 GPU memoria 降低 4×,WER 代价 <0.3──
4. Si sólo tienes 10 horas, congela el codificador. Sólo modifica el decodificador.
5. Use Whisper  propio Tokenizer 和 formato de pedido; absolutamente no sustituir los tokenizadores。

社区结果: en 20 horas dictado médico en alta sintonía Medium, reducirá el vocabulario médico en alta sintonía de WER de 12% 降低到4.5%── en 4 horas islandés en alta sintonía Turbo, reducirá WER de 18% 降低到6%──


```figure
sp-asr-attention
```

## Construye el mismo

### Paso 1: 直接运行 Susurro

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

Usted debe siempre cubrir los principales valores predeterminados:`temperature=0.0`(muestreo 默认是 0.0 → 0.2 → 0.4 ... cadena de retroceso)`condition_on_previous_text=False`(prevención del problema de alucinación en cascada), así como `no_speech_threshold=0.6`(detección de silencio)

### Paso 2: forma larga en pedazos

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX 添加了 (1) Silero VAD gateing,(2) 通过 wav2vec 2.0 hacer alineación a nivel de palabra,(3) 通过 `pyannote.audio`Hacer diarios... es el caballo de trabajo de la producción de transcripciones en 2026...

### Paso 3: Utilice la ajuste fino de LoRA

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

Luego utiliza el estándar de entrenador de bucle. En cada 1000 pasos de control.

### Paso 4: Revisa cada uno lo que ha aprendido

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

Usando el mapa de calor 可视化, verás los pasos del decodificador 扫过编码框架 时形成横向对齐――这条横向就是对字时刻的理解的语──

## Usalo

Estaca 2026:

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2 backend) es el tiempo de ejecución de la CPU + GPU más rápido del año 2026, que la vanilla 快 4×, la misma salida.

## Las trampas que todavía se envían en 2026

- **Hallucinated text on silence。**Susurro  basado en los títulos  entrenamiento, contenido "Gracias por ver!"、"Subscribe!"、títulos de la canción。调用前始终做 VAD-gate。
- **`condition_on_previous_text` cascade。**Una alucinación se contaminará después de las ventanas.`False`¿Qué es eso?
- **Short-clip padding。**Un relleno de 2 segundos hasta 30 segundos después, puede alucinar en su final.`pad=False`O por la puerta de VAD.
- **Wrong mel stats。**Usar librerías de la biblioteca y no de susurros, se producirá casi de manera casual.`whisper.audio.log_mel_spectrogram`¿Qué es eso?

## Envío

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-whisper-tuner.md`◊ para un dominio determinado  diseñar una fluidez de susurros o de inferencias ◊

## Los ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`▽ se tokeniza un mensaje de estilo de susurro, calcula los presupuestos de forma decodificados,并印发 10 分钟 clip ⋅
2. **Medium.**Instalación`faster-whisper`,转写一个10分钟播客,并与人类转录比较WER――尝试 `language="auto"`Con la obligación`language="en"`¿Qué es eso?
3. **Hard.**Uso de HF `datasets`, seleccionar una forma de susurrar expresar comida fuerte lenguaje (por ejemplo, Urdu), en 2 小时数据上使用 LoRA fine-tune Medium 2 epochs,并报告 WER delta──

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## Leer más

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) Arquitectura original 和 receta de entrenamiento。
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363) Decodificador de 4 capas, 8x aceleración
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) forma larga 、ordenada en palabras 、diarizada ‖
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2 respaldado, rápido 4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) canónica LoRA / Full-FT paseo por la misma──
