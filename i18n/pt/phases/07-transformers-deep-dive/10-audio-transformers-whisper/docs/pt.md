# Transformadores de áudio  Arquitetura de sussurros

> O áudio é a frequência que se transforma ao longo do tempo. O sussurro é um espectro que come e retoma o texto.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## O problema

Em Whisper, "OpenAI, Radford et al. 2022) antes, state-of-the-art automático de reconhecimento de fala "ASR" significa wav2vec 2.0 e "HUBERT" extractores de recursos auto-supervisionados, adicionados a cabeças bem sintonizadas.

O sussurro fez três coisas:

1. **Train on everything。**O vídeo foi gravado em uma tela de vídeo com uma imagem de vídeo de um dos principais vídeos da série.
2. **Multi-task single model。**Um decodificador  através de tokens de tarefa 联合训练 transcrição、tradução、 detecção de atividade vocal、 ID de idioma 和 timestamping。
3. **标准 encoder-decoder transformer。**Encoder consumo de log-mail espectrogramas──Decoder 以 autoregressivo 方式生成文本トークン──没有 vocoder,没有 CTC,没有HMM──

Resultado:Susper grande-v3 para acentos, ruído, bem como dados de não-fictícios rotulados.

## O conceito

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### Passo 1  Re-sampula + janela

Audio é de 16 kHz──clip/pad até 30 segundos── calcular o espectro de log-mail: 80 个 melbins,10 ms de passo → cerca de 3.000 quadros × 80 recursos── é isso que Whisper 看到的输入图──

### Passo 2  tronco convolucional

As duas camadas de Conv1D, o núcleo 3 ̊ passo 2, reduzirão 3.000 quadros ̊ para 1.500 ̊ em caso de não aumentar um grande número de parâmetros ̊ diminuirão a duração da sequência ̊ a metade ̊

### Passo 3  codificador

Uma versão de 24 camadas (grande) transformador de codificação, processando 1.500 etapas de tempo.

### Passo 4  decodificador

Um decodificador de transformador de 24 camadas. Ele é usado para produzir tokens autoregressivamente no vocabulário BPE; este vocabulário é um superconjunto do vocabulário GPT-2, e também contém uma pequena quantidade de tokens especiais específicos de áudio.

### Passo 5  Tokens de tarefa

O decodificador imediato, para que os tokens de controle sejam abertos, diga ao modelo o que fazer:

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

Ou

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

O modelo é de acordo com esta formação. Você passa por prefixo de tarefa de controle. Isso equivale a instrução de 2026 ano, apenas aplicado na fala.

### Passo 6  saída

Pesquisa de feixe ((largura 5)配合 log-prob limiar。当 `<|notimestamps|>`O sinal não existe, selos de tempo serão emitidos por áudio a cada 0,02 segundos.

### Dimensões de sussurros

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

Grande-v3-turbo(2024) vai decodificar de 32 camadas  reduzir para 4──解码速度快 8×,WER 回退小于 1 个点── esta velocidade de desbloqueio de decodificação 正是 Whisper-turbo 在 2026年成为实时语音代理 默认选择的原因──

### Suspirar Não fazer nada

- Não faz diário (Who is talking?)
- Origin生不做实时流30 秒窗口是固定的──现代 wrappers(`faster-whisper`- Não.`WhisperX`) através de VAD + sobreposição 补上流量──
- 时没有外部chunking 时,不支持超过30 s的长形文本――实践中效果很好,因为人类言语在转录中很少需要长远文本――

### 2026 paisagem

| Task | Model | Notes |
|------|-------|-------|
| English ASR | Whisper-turbo, Moonshine | Moonshine 在 edge 上快 4× |
| Multilingual ASR | Whisper-large-v3 | 97 种语言 |
| Streaming ASR | faster-whisper + VAD | 可达到 150 ms latency targets |
| TTS | Piper, XTTS-v2, Kokoro | Encoder-decoder pattern，但形状类似 Whisper |
| Audio + language | AudioLM, SeamlessM4T | Text tokens + audio tokens 在一个 transformer 中 |


```figure
n5-mel-decode
```

## Construí-lo

- Não .`code/main.py` Nós não treinamos Whisper Nós construímos um pipeline de espectrogramas de log-mail + um formatador de tokens de tarefa.

### Passo 1: sintetizar áudio

Produção de uma amostra de 16 kHz, frequência de 440 Hz, duração de 1 segundo, onda sinusal, 16.000 amostras.

### Passo 2: Espectograma de log-mail

完整 mel spectrogram 需要 FFT──我们做一个简化框架+per-frame energy 版本,用于展示管道,而不需要 `librosa`- Não .

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

Frame = 25 ms,hop = 10 ms── com Whisper 

### Passo 3: pad até 30 s

Whisper 始终处理 30 秒块──将谱谱pad或剪辑) até 3.000 quadros──

### Passo 4: Construação de tokens de prompt

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

É a superfície completa de controle de tarefas. Um prefixo de 4 tokens.

## Usá-lo

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

Mais rápido 兼容 OpenAI:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- Utilize um modelo fazer ASR Multilingue.
- Para a transcrição de áudio de vários tipos.
- Pesquisa / protótipo ASR最快起点──

**何时选择别的方案：**

- Rápido em alta latência.
- 需要 <200 ms de AI conversacional em tempo real usando ASR de streaming especializado
- Diário de oradores Suspar 不做这个;接上 pyannote──

## Envia-o

- Não .`outputs/skill-asr-configurator.md`◊ esta habilidade 会为新语音应用 选择ASR model、decoding parameters 和 preprocessing pipeline──

## Exercícios

1. **Easy。**运行 `code/main.py`Confirmar 16 kHz、10 ms de salto de 1 segundo de contagem de quadros de sinal ∼ 100 quadros──30 segundos ∼ 3.000 quadros──
2. **Medium。**Utilização `numpy.fft`Construir um espectro completo de log-mail ∙ 验证 80 个 mel bins `librosa.feature.melspectrogram(n_mels=80)`Em números de erro de valor em correspondência.
3. **Hard。**实现 streaming inferência:将 audio 切成 10 s windows,2 s overlap,对每块 运行  sussurrar,再合并 transcripts──测量与 5 分钟播客样本 单次处理相比的字错率──

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mel spectrogram | “Audio image” | 2D representation：一个轴是 frequency bins，另一个轴是 time frames；每个 cell 是 log-scaled energy。 |
| Log-mel | “Whisper 看到的东西” | 经过 log 的 Mel spectrogram；近似人类对 loudness 的感知。 |
| Frame | “一个 time slice” | 25 ms 的 samples window；以 10 ms stride overlap。 |
| Task token | “speech 的 prompt prefix” | decoder prompt 中类似 `<\|transcribe\|>` / `<\|translate\|>` 的 special tokens。 |
| Voice activity detection (VAD) | “找到 speech” | 在 ASR 前移除 silence 的 gate；大幅降低 cost。 |
| CTC | “Connectionist Temporal Classification” | 用于 alignment-free training 的经典 ASR loss；Whisper 不使用它。 |
| Whisper-turbo | “小 decoder，完整 encoder” | large-v3 encoder + 4-layer decoder；解码快 8×。 |
| Faster-whisper | “生产 wrapper” | CTranslate2 reimplementation；int8 quantization；比 OpenAI reference 快 4×。 |

## Mais leitura

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356)Papel de sussurros.
- [OpenAI Whisper repo](https://github.com/openai/whisper) código de referência + peso do modelo。阅读 `whisper/model.py`, pode ver em cerca de 400 páginas dentro de cima para baixo Conv1D tronco + codificador + decodificador.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) Passo 56 中描述的束搜索 + task-token logic 在这里;500 行,完全可读──
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) 前身; em certos cenários ainda existem características SOTA。
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) embalagem de produção,比 referência 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 ano ASR amigável com bordas, forma similar Whisper mas ainda menor
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) receita de ajuste fino canônico, contendo pré-processador de espectrograma mel, e manipulação de marcas de tempo de tokens.
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现(encoder, decoder, cross-attention, generation),与本课的建筑图对应──
