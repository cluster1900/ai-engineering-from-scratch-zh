# ऑडियो-भाषा मॉडल  Qwen2.5-Omni, ऑडियो फ्लेमिंगो, GPT-4o ऑडियो

> 2026 के ऑडियो-भाषा मॉडल में ध्वनि + पर्यावरण ध्वनि + संगीत पर विचार किया जा सकता है। Qwen2.5-Omni-7B MMAU-Pro में GPT-4o Audio 水平 पर पहुंचता है।

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 分钟

## 问题

तुम 5 सेकंड के लिए है, कोई चिल्लाता है, "रोक", और फिर चुप हो जाता है।

- **转写。**"क्या कहा है? यह एएसआर का क्षेत्र है।
- **语义推理。**"क्या यह व्यक्ति खतरनाक है? " संयुक्त रूप से समझना चाहिए कुत्ता पुकार +  चिल्ला +  चुपचाप
- **音乐推理。**"कौन से वाद्ययंत्र मेलोड बजाते हैं?
- **长音频检索。**"इस 90 मिनट की व्याख्यान में, व्याख्यानकार ने ग्रेडिएंट वंश को कहां समझाया?

एक एक ही त्वरित के साथ इन सभी प्रश्नों का उत्तर देने के लिए एक मॉडल है**audio-language model**(LALM / ALM)  यह शुद्ध ASR से भिन्न है:LALMs 输出自由形式的自然语言答案, न कि केवल प्रतिलेख

## 概念

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### तीन घटक模板

2026 के प्रत्येक एलएएम में एक ही संरचना होगी।

1. **Audio encoder.**विस्पर एन्कोडर · बीएटीएस · CLAP · वेवएलएम · या प्रत्येक मॉडल स्वयं परिभाषित का एन्कोडर──
2. **Projector.**रैखिक या एमएलपी, 桥接到 LLM के टोकन एम्बेडिंग 空间──
3. **LLM.**基于 Llama / Qwen / Gemma 的解码器──接收交错的文本 + ऑडियो टोकन;生成文本──

प्रशिक्षणः

- **Stage 1.**结 एन्कोडर + LLM; केवल ASR / कैप्शनिंग 数据上训练 प्रोजेक्टर में
- **Stage 2.**音频任务上进行全 / LoRA बारीक-तुन (ऑनलाइन)
- **Stage 3（可选）。**आवाज-इन / आवाज-आउट 会添加语音解码器──Qwen2.5-Omni 和 AF3-Chat 会这样做──

### 2026 模型地图

| Model | Backbone | Audio encoder | Output modality | Access |
|-------|----------|---------------|-----------------|--------|
| Qwen2.5-Omni-7B | Qwen2.5-7B | Custom + Whisper | text + speech | Apache-2.0 |
| Qwen3-Omni | Qwen3 | Custom | text + speech | Apache-2.0 |
| Audio Flamingo 3 | Qwen2 | AF-CLAP | text | NVIDIA non-commercial |
| Audio Flamingo Next | Qwen2 | AF-CLAP v2 | text | NVIDIA non-commercial |
| SALMONN | Vicuna | Whisper + BEATs | text | Apache-2.0 |
| LTU / LTU-AS | Llama | CAV-MAE | text | Apache-2.0 |
| GAMA | Llama | AST + Q-Former | text | Apache-2.0 |
| Gemini 2.5 Flash/Pro (closed) | Gemini | proprietary | text + speech | API |
| GPT-4o Audio (closed) | GPT-4o | proprietary | text + speech | API |

### बेंचमार्क 现实检查(2026)

**MMAU-Pro.**1800 个 QA 对,覆盖 भाषण / ध्वनि / संगीत / मिश्रित──包含多音子集──

| Model | Overall | Speech | Sound | Music | Multi-audio |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | LongAudioBench 上的 SOTA | — | — | — | — |

**multi-audio 列对所有模型都很致命。**4 选 1 多选题的随机概率 = 25%; अधिकांश मॉडल इस स्तर के निकट स्थित हैं।

### LALMs में 2026 वर्ष उपयुक्त उपयोग में कहाँ

- **呼叫中心录音的合规审计。**"क्या बैठने की आवश्यकता है?
- **无障碍。**向聋人用户描述声音事件(不只是转写) 』
- **内容审核。**检测暴力语言 + 威胁语气 + 背景上下文──
- **播客 / 会议章节划分。**语义摘要,而不只是演讲者转而而来──
- **音乐目录分析。**"ब-सेक्शन वाले सभी गीतों को ढूंढना"

###  वे भी उपयुक्त नहीं हैं

- 细粒度乐理 (अधिकतर र弦 स्तर से कम)
- दीर्घ वार्ता के लिए चर्चा के लिए अनुशंसाएं
- बहु-ऑडियो तुलना (२२-२६% केवल साथ-साथ略高)
- 实时流式推理 (बहुत से लोग बैच का अनुमान लगाते हैं)


```figure
v4-alm-tokens
```

##  इसे निर्माण

### 步骤 1: 查询 Qwen2.5-Omni

```python
from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Omni-7B", torch_dtype="auto")

audio, sr = load_wav("clip.wav", sr=16000)
messages = [{
    "role": "user",
    "content": [
        {"type": "audio", "audio": audio},
        {"type": "text", "text": "What sounds do you hear, and what's happening?"},
    ],
}]
inputs = processor.apply_chat_template(messages, tokenize=True, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=200)
print(processor.decode(output[0], skip_special_tokens=True))
```

### 步骤 2: प्रोजेक्टर 模式

```python
import torch.nn as nn

class AudioProjector(nn.Module):
    def __init__(self, audio_dim=1280, llm_dim=4096):
        super().__init__()
        self.down = nn.Linear(audio_dim, llm_dim)
        self.act = nn.GELU()
        self.up = nn.Linear(llm_dim, llm_dim)

    def forward(self, audio_features):
        return self.up(self.act(self.down(audio_features)))
```

यही है। प्रोजेक्टर आमतौर पर 1-3  रैखिक परतें हैं।

### 步骤 3: बेंचमार्क MMAU / LongAudioBench

```python
from datasets import load_dataset
mmau = load_dataset("MMAU/MMAU-Pro")

correct = 0
for item in mmau["test"]:
    answer = call_model(item["audio"], item["question"], item["choices"])
    if answer == item["correct_choice"]:
        correct += 1
print(f"Accuracy: {correct / len(mmau['test']):.3f}")
```

分别报告每个类别(भाषण / ध्वनि / संगीत / बहु-ऑडियो) ――聚合数字会掩盖模型在哪里失败──

## इसका उपयोग करें

| Task | 2026 pick |
|------|-----------|
| 自由形式 audio QA（open） | Qwen2.5-Omni-7B |
| 长音频上最好的 open 模型 | Audio Flamingo Next |
| 最好的 closed 模型 | Gemini 2.5 Pro |
| Voice-in / voice-out agent | Qwen2.5-Omni 或 GPT-4o Audio |
| 音乐推理 | Audio Flamingo 3 或 2（music-specialized AF-CLAP） |
| 呼叫中心审计 | Gemini 2.5 Pro via API，结合基于你的 policy docs 的 RAG |

## 陷

- **过度信任 multi-audio。**यदि आपके कार्य को "कौन सी क्लिप में X है" की आवश्यकता है, तो निकटतम क्षैतिज प्रदर्शन वास्तविक है।
- **长音频退化。**超过10分钟后,大多数模型的讲者属性 会崩――先日记ze(6 पाठ),再总结――
- **沉默上的幻觉。**प्रयोग Whisper एन्कोडर के LALMs 会继承同类 Whisper-style 问题──使用 VAD-gate──
- **Benchmark cherry-picking。**विक्रेता ब्लॉग पोस्ट 会突出最佳类别──自己运行 MMAU-Pro मल्टी ऑडियो 子集──

## 交付 यह

保存为 `outputs/skill-alm-picker.md`◊为给定的音频理解任务选择 LALM + बेंचमार्क उपसमूह + आउटपुट-मोडालिटी(पाठ बनाम भाषण)

## अभ्यास

1. **简单。**运行 `code/main.py`,查看一个玩具投影机模式 + 假 LALM 对 (ऑडियो-嵌入, पाठ- टोकन) → आउटपुट टोकन 的路由──
2. **中等。**100 एमएमएयू-प्रो भाषण वस्तुओं में Qwen2.5-Omni-7B 打分── के साथ पेपर 报告的数字比较──
3. **困难。**构建一个最小的音频标题基线:बीईटीएस एन्कोडर + 2 लेयर प्रोजेक्टर + जमे हुए लामा-3.2-1बी── केवल AudioCaps 上细调 प्रोजेक्टर──与Clotho-AQA 上的 SALMONN 比较──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| LALM | Audio ChatGPT | Audio encoder + projector + LLM decoder. |
| Projector | Adapter | 将音频特征映射到 LLM Embedding 空间的小型 MLP。 |
| MMAU | 这个 benchmark | 覆盖 speech、sound、music 的 10k audio-QA 对。 |
| MMAU-Pro | 更难的 MMAU | 1800 个 multi-audio / reasoning-heavy 问题。 |
| LongAudioBench | 长形式 eval | 带语义查询的多分钟片段。 |
| Voice-in / voice-out | Speech-native | 模型接收语音并输出语音，不绕经文本。 |

## 延伸阅读

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) 参考架构──
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) भाषण-में-भाषण-आउट
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) खुली लंबी ऑडियो 领先者──
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) LongAudioBench SOTA。
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) दोहरे एन्कोडर 先驱──
- [MMAU-Pro leaderboard](https://mmaubenchmark.github.io/) 2026 实时排名──
