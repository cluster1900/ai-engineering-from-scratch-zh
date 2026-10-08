# ऑडियो ट्रांसफार्मर  विस्पर आर्किटेक्चर

> ऑडियो आवृत्ति है समय के साथ छवि का परिवर्तन है। चुप्पी एक खाए हुए स्पेक्ट्रोग्राम है और शब्दों का विटोटोटोटोटो है।

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## समस्या

Whisper में, OpenAI, Radford et al. 2022) से पहले, अत्याधुनिक स्वचालित भाषण पहचान (ASR) का अर्थ है wav2vec 2.0 और HuBERTस्व-निरीक्षण सुविधा निकालने वाले उपकरण प्लस ठीक से ट्यून किए गए सिर।

चुप्पी तीन नीचे की बातें कर रहे हैंः

1. **Train on everything。**इंटरनेट से प्राप्त 680,000 घंटे कम लेबल वाली ऑडियो, 97 भाषाओं को कवर करती है।
2. **Multi-task single model。**एक डिकोडर कार्य टोकन के माध्यम से 联合训练 ट्रांसक्रिप्शन、अनुवाद、आवाज गतिविधि का पता लगाना、भाषा आईडी तथा समयशीर्षक──
3. **标准 encoder-decoder transformer。**एन्कोडर उपभोग लॉग-मेल स्पेक्ट्रोग्राम──डेकोडर 以 ऑटोरेग्रेसिव 方式生成 पाठ टोकन── कोई vocoder, कोई CTC, कोई HMM──

结果:Whisper big-v3 accents, noise, as well as no干净 labelled data के लिए भाषाएं हैं बहुत स्थिर। 2026 तक, यह प्रत्येक ओपन-सोर्स वॉयस असिस्टेंट और अधिकांश वाणिज्यिक वॉयस असिस्टेंट के डिफ़ॉल्ट स्पीच फ्रंट-एंड में है।

## अवधारणा

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### चरण 1  पुनः नमूना + विंडो

ऑडियो 为 16 kHz──clip/pad 到 30 सेकंड──计算日志-मेल स्पेक्टोग्रामः80 个 melbin,10 ms कदम → 约 3,000 फ्रेम × 80 फीचर्स──这是Whisper 看到的输入图片──

### चरण 2  घुमावदार स्टेम

 दो Conv1D परतों, कर्नेल 3  कदम 2, 3,000 फ्रेम  घटकर 1,500  तक हो जाएगा  बिना बड़ी मात्रा में मापदंडों के मामले में अनुक्रम लंबाई  आधा  कम हो जाएगा

### चरण 3  एन्कोडर

एक 24-परत  बड़े  संस्करण) ट्रांसफार्मर एन्कोडर, 1,500 个 समय चरणों को संसाधित करना──सिनोसाइडल स्थिति एन्कोडिंग、स्व-ध्यान、GELU FFN── 1,500 × 1,280 छिपे राज्यों का उत्पादन करना──

### चरण 4  डिकोडर

एक 24-परत ट्रांसफार्मर डिकोडर── यह बीपीई शब्दावली में ऑटोरेग्रेसिव रूप से उत्पन्न टोकन से आता है; यह शब्दावली जीपीटी-2 शब्दावली का सुपरसेट है, और इसमें अतिरिक्त रूप से कम मात्रा में ऑडियो-विशिष्ट विशेष टोकन शामिल हैं──

### चरण 5  कार्य टोकन

डिकोडर त्वरित नियंत्रण टोकन 开头, मॉडल बताओ क्या करना हैः

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

या

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按这种约定训练的──你通过前语 控制任务── यह 2026 के निर्देश-调整 के बराबर है, केवल भाषण में लागू होता है──

### चरण 6  आउटपुट

बीम खोज ((चौड़ाई 5) संगत लॉग-प्रोब सीमा`<|notimestamps|>`टोकन मौजूद नहीं है, समय टिकटों को ऑडियो के अनुसार हर 0.02 सेकंड में एक बार पूर्वानुमानित किया जाता है।

### चुप्पी आकार

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

बड़े-v3-turbo(2024) को 32 परतों से कटौती करने के लिए 4 ⋅解码速度快 8×,WER वापस वापस लौटना 1 个点.

### चुप्पी ऩा क्या करना

- ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
- मूल जीवन नहीं कर रहा है वास्तविक समय स्ट्रीमिंग30 秒 खिड़की है निश्चित──现代 wrappers(`faster-whisper``WhisperX`) VAD + ओवरलैप के माध्यम से 补上流
- 没有外部 时,不支持超过30s的长形式背景──实践中效果很好,因为人类语言在转录中很少需要长距离的背景──

### 2026 परिदृश्य

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

## इसे बनाओ

见 `code/main.py`我们不训练 Whisper我们构建日志频谱管道+任务标签快速格式化器──这些才是你在生产中实际会触碰的部分──

### चरण 1: ऑडियो संश्लेषित करें

16 किलोहर्ट्ज, 440 हर्ट्ज, 1 सेकंड की सिनेस वेव, 16,000 नमूने

### चरण 2: लॉग-मेल स्पेक्ट्रोग्राम

完整 mel spectrogram 需要 FFT──我们做一个简化框架 + प्रति फ्रेम ऊर्जा 版本,用于展示管道,而不需要 `librosa`:

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

फ्रेम = 25 ms,hop = 10 ms── विन्डोजिंग 匹配── Whisper के साथ 

### चरण 3: पैड 30 सेकेण्ड तक

विस्पर 始终处理 30 सेकंड के टुकड़े──将谱谱板或剪辑) 3,000 फ्रेम──

### चरण 4: परंप्ट टोकन बनाएं

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

यह पूर्ण कार्य नियंत्रण सतह है।

## इसका प्रयोग करें

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

अधिक तेजी से, और अधिक अनुकूल OpenAI:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- उपयोग एक मॉडल बनाने बहुभाषी ASR。
- 杂、多样音频的稳健转录──
- अनुसंधान / प्रोटोटाइप एएसआर最快起点──

**何时选择别的方案：**

- ऊपरी किनारे की अल्ट्रा-कम विलंबता स्ट्रीमिंगमूनशाइन में समान गुणवत्ता में बेहतर है विस्पर
- 需要 <200 ms का रीयल-टाइम वार्तालाप एआई विशेष स्ट्रीमिंग एएसआर का उपयोग करना
- स्पीकर डायरीकरण चुप्पी 不做这个;接上 pyannote──

## इसे भेजें

见 `outputs/skill-asr-configurator.md`◊ इस कौशल 会为新语音应用 选择ASR मॉडल、解码参数 和预处理管道──

## व्यायाम

1. **Easy。**运行 `code/main.py`❖ 16 kHz、10 ms hop के 1 सेकंड सिग्नल फ्रेम की गिनती को 100 फ्रेम के बारे में ❖ 30 सेकंड के बारे में 3,000 फ्रेम के लिए ❖
2. **Medium。**उपयोग `numpy.fft`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `librosa.feature.melspectrogram(n_mels=80)`में संख्यात्मक त्रुटि में मेल-जोल
3. **Hard。**实现 स्ट्रीमिंग निष्कर्षः将音频 切成 10 s windows,2 s ओवरलैप,对每块 运行 语,再合并转录──测量与5分钟播客样本 单次处理相比的字-错误率──

## प्रमुख शर्तें

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

## आगे पढ़ना

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) चुप्पी कागज。
- [OpenAI Whisper repo](https://github.com/openai/whisper) संदर्भ कोड + मॉडल वजन──阅读 `whisper/model.py`, आप लगभग 400 लाइनों में ऊपर से नीचे देख सकते हैं Conv1D स्टैम + एन्कोडर + डिकोडर
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) चरण 56 中描述的束搜索 + कार्य-चिह्न तर्क 在这里;500 行,完全可读──
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) पूर्व身; कुछ परिदृश्यों में अभी भी SOTA विशेषताएं हैं
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) उत्पादन के लिए लपेटें, तुलनात्मक 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 साल की एज-फ्रेंडली एएसआर, आकार जैसे चुस्की लेकिन更小──
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) कैनोनिक सूक्ष्म-ट्यूनिंग नुस्खा, जिसमें मेल स्पेक्ट्रोग्राम प्रीप्रोसेसर तथा टोकन-टाइमस्टैम्प हैंडलिंग शामिल है
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现(encoder、decoder、cross-attention、generation), के साथ इस पाठ के वास्तुकला आरेख 对应──
