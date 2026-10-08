# विस्फोर  वास्तुकला और ठीक-ठीक ट्यूनिंग

> विस्पर एक 30 सेकंड विंडो ट्रांसफार्मर एन्कोडर-डेकोडर है, 680k के लिए प्रशिक्षित है।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## समस्या

विस्पर द्वारा ओपनएआई द्वारा सितंबर 2022 में जारी किया गया था, पहला एएसआर मॉडल है जो वस्तु 形态交付 का उपयोग करता हैः ऑडियो चिपकाएं, पाठ प्राप्त करें, 99 भाषाओं का समर्थन करें, शोर के लिए मजबूत, लैपटॉप पर चलें। 2024 तक, ओपनएआई ने बड़े-वी 3 और टर्बो संस्करण जारी किए हैं। 2026 तक, विस्पर पॉडकास्ट ट्रांसक्रिप्शन से लेकर वॉयस असिस्टेंट्स तक है।

लेकिन चुप्पी एक नहीं है जो हमेशा के लिए ब्लैक बॉक्स में उपयोग की जा सकती है पाइपलाइन। डोमेन शिफ्ट इसे मार देगा। तकनीकी जारगोन, स्पीकर उच्चारण, उचित संज्ञाएँ, लघु क्लिप, मौन। आपको यह जानने की आवश्यकता हैः

1. यह अंदर है कि क्या है.
2.  कैसे सही ढंग से इसे टुकड़ा  प्रवाह या लंबे रूप ऑडियो देना
3. 什么时候细节调节,以及如何细节调节──

## अवधारणा

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准 ट्रांसफार्मर एन्कोडर-डेकोडर

- इनपुट:30 सेकंड लॉग-मेल स्पेक्ट्रोग्राम,80 मील,10 एमएस हॉप → 3000 फ्रेम──更短片会零填补,更长片会零碎──
- एन्कोडरःconv-downsample (चरण 2) + `N`ट्रांसफार्मर ब्लॉक── बड़े-v3:32 परतों,1280-अस्तित्व,20 सिर──
- डिकोडरः带 कारण स्वयं-attn + कोडर आउटपुट करने के लिए क्रॉस-attn `N`ट्रांसफार्मर ब्लॉक──大小与编码器 相同──
- आउटपुट: कवर 51,865-टोकन वक्कल के बीपीई टोकन

बड़े-v3 1.55B पैरामीटर है── टर्बो उपयोग 4-परत डिकोडर( 32 परत से कम), के साथ <1% WER 损失 परिवर्तन करने के लिए 8× विलंबता 降低──

**Prompt format。**विस्पर एक है द्वारा डिकोडर संकेत मध्य के विशेष टोकन  नियंत्रण के मल्टीटास्क मॉडलः

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` भाषा टैग;强制 अनुवाद- बनाम-अनुवाद 行为──
- `<|transcribe|>`या `<|translate|>`  翻译为英语输出,或逐字转写──
- `<|notimestamps|>` 跳过 शब्द स्तर के समय टिकटों(更快)。

जल्दी 让一个模型能够完成很多任务――把 `<|en|>`改成 `<|fr|>`, यह फ्रेंच में अनुवाद किया जाएगा.

**30-second window。**एक ही समय में सब कुछ तय किया गया है 30 सेकंड में। अधिक लम्बे क्लिप को चकनाचूर करने की आवश्यकता है; कम क्लिप को पैडिंग करना होगा। विंडोज मूल स्ट्रीमिंग नहीं है, यही कारण है कि WhisperX, Whisper-Streaming और तेज-विस्फोर अस्तित्व है।

**Log-mel normalization。** `(log_mel - mean) / std`, इनमें से आंकड़े से आते हैं Whisper  अपने प्रशिक्षण कॉर्पस──आप*मजबूत* उपयोग करना चाहिए Whisper के पूर्व प्रसंस्करण`whisper.audio.log_mel_spectrogram`), बजाय `librosa.feature.melspectrogram`

### 2026 में वैरिएंट

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### ठीक से समायोजित करना

2026 साल का कैनोनिक वर्कफ़्लोः

1. 收集 10100 小时目标领域 ऑडियो,并配有配列转录──
2. उपयोग `transformers.Seq2SeqTrainer`,带 `generate_with_loss`वापस कॉल करें
3. पैरामीटर-प्रभावी: ध्यान परतों में`q_proj``k_proj``v_proj`上使用LoRA,可将 GPU स्मृति 降低4×,WER 代价 <0.3──
4. यदि आप केवल <10 小时, फ्रीज एन्कोडर.
5. प्रयोग Whisper  अपने टोकनाइज़र 和 शीघ्र प्रारूप; बिल्कुल टोकनाइज़र को प्रतिस्थापित करने की जरूरत नहीं है。

社区结果: 20 घंटे में मेडिकल डिक्टेशन ऊपर ठीक-ठीक मध्यम, होगा मेडिकल शब्दावली ऊपर WER 12% से घटकर 4.5% तक


```figure
sp-asr-attention
```

## इसे बनाओ

### चरण 1: 直接运行 चुप्पी

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

आप हमेशा कवर करना चाहिए की कुंजी डिफ़ॉल्टः`temperature=0.0`(सैंपलिंग 默认是 0.0 → 0.2 → 0.4 ... बैकबैक चेन)`condition_on_previous_text=False`(प्रतीक्षा प्रकोप hallucination समस्या), तथा `no_speech_threshold=0.6`(चुपचाप का पता लगाने)

### चरण 2: टुकड़े टुकड़े लंबे आकार

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

विस्परएक्स 添加了 (1) सिलेरो VAD गेटिंग,(2) 通过 wav2vec 2.0 通过做文字级排列,(3) 通过 `pyannote.audio`यह 2026 में ट्रांसक्रिप्शन का कामकाजी घोड़ा है।

### चरण 3: लोरा फाइन-ट्यूनिंग का उपयोग करें

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

फिर मानक ट्रेनर लूप का उपयोग करें।

### चरण 4:  जांच प्रत्येक स्तर सीखा क्या है

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

हीटमैप को देखकर आप डेकोडर चरणों को देखेंगे  एन्कोडर फ्रेम को साफ़ करते समय डायगोनल संरेखण का गठन करते समय 

## इसका प्रयोग करें

2026 स्टैकः

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2 बैकेंड) 2026 के सबसे तेज CPU + GPU निष्कर्षण रनटाइम है, वैनिला 快 4×, आउटपुट समान है

## 2026 में भी फंसे हुए जाल

- **Hallucinated text on silence。**विस्पर  आधारित कैप्शन  प्रशिक्षण, जिसमें शामिल है "देखने के लिए धन्यवाद!"",सब्स्क्राइब करें!"",गीत गीतों。调用前始终做 VAD-gate。
- **`condition_on_previous_text` cascade。**एक भ्रम होगा दूषित बाद खिड़कियों. जब तक आप पार टुकड़े की धारा की जरूरत है, अन्यथा सेट करने के लिए`False`
- **Short-clip padding。**एक 2 सेकंड क्लिप पैडिंग 30 सेकंड के बाद, हो सकता है अंत में静音中幻觉.`pad=False`या वाड-गेट
- **Wrong mel stats。**प्रयोग पुस्तकालय के मेल्स, न कि चुप्पी के मेल्स, लगभग किसी भी समय उत्पन्न होगा।`whisper.audio.log_mel_spectrogram`

## इसे भेजें

保存为 `outputs/skill-whisper-tuner.md`                                                                                                                                                                                                                                                              

## व्यायाम

1. **Easy.**运行 `code/main.py`यह एक चुस्की शैली प्रोंपट टोकन, गणना decoded आकार बजट,并印 10 मिनट क्लिप के टुकड़ा अनुसूची 
2. **Medium.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `faster-whisper`,转写一个10分钟播客,并与人类转录比较WER――尝试 `language="auto"`बाध्यता के साथ`language="en"`
3. **Hard.**उपयोग HF `datasets`, चुनें एक प्रकार की चुप्पी अभिव्यक्ति खाने की भाषा (उदाहरण के लिए उर्दू), में 2 小时数据上使用 LoRA बारीक-टीन मध्यम 2 युग,并报告 WER delta──

## प्रमुख शर्तें

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## आगे पढ़ना

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) 原始 वास्तुकला 和 प्रशिक्षण नुस्खा。
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363) 4 परतों का डिकोडर, 8x गति
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) दीर्घ-रूप शब्द-अनुरूप  डायरीकृत 
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2 समर्थित,快4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) कैनोनिक लोरा / फुल-एफटी वॉचथ्रू──
