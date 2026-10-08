# 音频变换器  语架构

> 音频是频率随着时间的变化形成的图像.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## 问题

在Whisper,Radford等2022之前,最先进的自动语音识别 (ASR) 意味着WAV2vec 2.0 和HuBERT自主监督功能提取器加上精细调的头──质量高,但数据管道昂贵,而且对域名 脆弱──多语言语音识别需要按语言家庭使用不同模型──

语做了三个下注:

1. **Train on everything。**没有干净的学术资料,没有音符标签.
2. **Multi-task single model。**一个解码器通过任务代币联合训练转录"",翻译"",声活动检测"",语言识别和时刻标识"",
3. **标准 encoder-decoder transformer。**编码器 消耗日志邮件谱程――解码器以自动降低的方式生成文本代码――没有声码器,没有CTC,没有HMM――

结果:对口音,噪音以及没有干净标记的数据的语言都很稳健. 到2026年,它已经成为每个开源语音助理和大多数商业语音助理的默认语音前端.

## 概念

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### 步骤 1 重复样本+窗口

音频为16kHz──剪辑/盘到30秒──计算日志-邮件谱:80个,10ms步骤 →约3000个图片 ×80个特征──这就是Whisper 看到的输入图像──

### 步骤 2 卷积干

两个Conv1D层,内核3、步骤2,将3,000个框架降至1,500──在不增加大量参数的情况下,将序列长度减半──

### 步骤 3 编码器

一个24层的变体编码器处理1500个时间步骤――突状位置编码――自我注意力――GELU FFN――生成1500 ×1280个隐藏状态――

### 步骤 4 解码器

一个24层变压器解码器──它从BPE词汇中自动降级生成代币;这个词汇是GPT-2词汇的超级集,并额外包含少量特定音频特征代币──

### 步骤 5 任务代币

解码器快速以控制代币开头,告诉模型要做什么:

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

或

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按照这种规定的训练. 你通过预写控制任务. 这相当于2026年的指令调整,只是应用在语音上.

### 步骤 6 输出

射线搜索 (宽度5)配合日志探测门──当`<|notimestamps|>`标志不存在时,时间印章会按音频的每0.02秒预测一次.

### 语尺寸

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

现在,我们已经开始使用了这个技术,我们已经开始使用了它,我们已经开始使用了它,我们已经开始使用了它.

### 语不做什么

- 谁在说话) .
- 原生不做实时流30秒窗口是固定的──现代包装`faster-whisper`,我知道.`WhisperX`) 通过VAD+重叠 补上流量――
- 没有外部的碎,不支持30多年长文本.

### 2026年景观

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

## 建立它

见`code/main.py`我们不训练语 我们构建了日志邮件谱谱管道+任务标志快速格式化器――这些才是你在生产中实际会触碰的部分――

### 步骤1:合成音频

生成一个采样率为16kHz,频率为440Hz,时间为1秒的弦波,16000个样本.

### 步骤2: 记录邮件谱号

完整的模谱 需要FFT──我们做一个简化的框架+每框架能量 版本,用来展示管道,而不需要`librosa`其他:

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

片的窗口配合――每片的能量 在教学上代替片――

### 步骤3: 按到30秒

语 始终处理30秒的片子――将频谱片或剪辑) 到3000个图片――

### 步骤4: 构建即时代币

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

这就是完整的任务控制表面.

## 用它

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

快速兼容 OpenAI:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- 使用一个模型做多语言ASR.
- 对于杂、多样音频的稳健转录.
- 研发/原型ASR最快起点──

**何时选择别的方案：**

- 极低延迟流量月光在相同质量下优于语
- 需要200ms的实时对话AI使用专用流媒体ASR──
- 语不做这个;接上笔记.

## 运送它

见`outputs/skill-asr-configurator.md`△该技能 会为新语音应用 选择ASR模型、解码参数 和预处理管道──

## 运动

1. **Easy。**运行`code/main.py`确认16kHz,10ms跳的1秒信号框架数量约为100个,30秒则约为3000个.
2. **Medium。**使用 `numpy.fft`构建完整的日志邮件谱系.`librosa.feature.melspectrogram(n_mels=80)`在数值差异内匹配.
3. **Hard。**实现流媒体推断:将音频切成10秒窗户,2秒重叠,对每个部分 运行 语,再合并转录──测量与5分钟播客样本 单次处理相比的字错率──

## 关键词

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

## 进一步阅读

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 语纸
- [OpenAI Whisper repo](https://github.com/openai/whisper)参考码+模型重量──阅读`whisper/model.py`现在,我们可以在400行内向下看Conv1D干 +编码器 +解码器.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) 步骤 56 中描述的光束搜索 +任务标志逻辑 在这里;500 行,完全可读。
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) 前身;在某些场景下仍然是SOTA特征──
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper)生产包装比参考快4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 年的边缘友好的ASR,形状类似于语但更小──
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper)可信的细调配方,包含黑色谱仪预处理器和标志时刻标签处理.
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现(编码器"",解码器"",交叉关注"",生成),与本课的架构图对应.
