#   建筑和精细调节

> 语是30秒钟的窗口变压器编码解码器,训练于680万小时的多语言弱监督音频文本对――一个架构,多种任务,跨99种语言都强――2026年参考ASR――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## 问题

微笑由OpenAI于2022年9月发布,是第一款以商品形式交付的ASR模型:粘贴音频,得到文字,支持99种语言,对噪音强,可在笔记本电脑上运行.到2024年,OpenAI已经发布了大型v3和turbo变体;到2026年,微笑从播客转录到语音助手再到YouTube字幕的默认基准.

但语不是一个可以永远当黑盒使用的管道――域名转移会杀死它:技术语、扬声器口音、正确名词、短片、沉默――你需要知道:

1. 它的内部是什么?
2. 如何正确给它分片,流媒体或长音频.
3. 什么时候调整,以及如何调整.

## 概念

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准变压器编码器-解码器――

- 输入30秒钟的日志邮件谱,80mels,10ms跳 →3000个图片──更短的剪辑 会零,更长的剪辑 会碎片──
- 编码器:conv下样本 (步骤2) + `N`转变器块――对大层v3:32层,1280层,20头――
- 解码器:带因果自动接入 +对编码器输出做交叉接入`N`变压器块──大小与编码器相同──
- 产量:覆盖51,865个代币语音的BPE代币.

轮使用4层解码器 (从32层减少),以 <1% WER 损失换至8×延迟 降低.

**Prompt format。**微笑是一个由解码器提示 中的特殊代币 控制的多任务模型:

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>`语言标签;强制翻译对转录行为──
- `<|transcribe|>`或`<|translate|>` 从任意语言输入 翻译为英语输出,或逐字转写。
- `<|notimestamps|>` 跳过字面级时间标签 ((更快) 

快速让一个模型能够完成很多任务.`<|en|>`改成`<|fr|>`现在,它会被翻译成法语.

**30-second window。**一切都固定在30秒内. 更长的剪辑需要缩. 更短的剪辑会填充.

**Log-mel normalization。** `(log_mel - mean) / std`根据Whisper的训练,你必须使用Whisper的预处理.`whisper.audio.log_mel_spectrogram`),而不是`librosa.feature.melspectrogram`,我知道.

### 2026年变种

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### 调整

2026 年的法规工作流程:

1. 收集10100小时目标领域音频,并配有一致的转录──
2. 使用 `transformers.Seq2SeqTrainer`带`generate_with_loss`呼叫回来.
3. 参数效率:在注意力层中`q_proj`,我知道.`k_proj`,我知道.`v_proj`上使用LORA,可将GPU内存降低4×,WER代价 <0.3──
4. 如果只有10小时,冷码器.
5. 使用Whisper 自己的代币和提示格式;绝不要替换代代币.

社区结果:在 20 小时内医疗指示上调中,将医疗词汇上调 WER 从 12% 降至 4.5% ⋅在 4 小时内冰岛上调 Turbo,将把 WER 从 18% 降至 6% ⋅


```figure
sp-asr-attention
```

## 建立它

### 直接运行 语

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

你应该始终覆盖关键默认:`temperature=0.0`(采样默认是0.0 → 0.2 → 0.4 ... 倒退链)`condition_on_previous_text=False`(防止化幻觉问题),以及`no_speech_threshold=0.6`(沉默检测) 

### 步骤2:长形碎片

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

通过WhisperX 添加了 (1) Silero VAD门, (2) 通过WAV2vec 2.0做字面级排列,`pyannote.audio`让日记化. 它是2026年生产转录的工作马.

### 步骤3:使用LoRA细调

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

然后使用标准训练循环. 每1000步检查点.

### 检查每层学到了什么

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

通过热图可视化,你会看到解码器步骤 扫过编码器框架 形成对角的对齐.

## 用它

根据第1个单元的规定,

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2后端) 是2026年最快的CPU+GPU推断运行时间,比尼拉快4x,输出相同.

## 陷在2026年仍存在

- **Hallucinated text on silence。**基于标题的语训练,包含"谢谢你观看!""",订阅!""",歌词――调用前始终做 VAD-gate――
- **`condition_on_previous_text` cascade。**一个幻觉会污染后续窗户.除非你需要跨块的流动性,否则设为`False`,我知道.
- **Short-clip padding。**一个2秒的剪辑填充到30秒后,可能在尾部静音中幻觉.`pad=False`或是VAD-gate.
- **Wrong mel stats。**使用图书馆的,而不是语的,会产生近乎随机的输出.`whisper.audio.log_mel_spectrogram`,我知道.

## 运送它

保存为`outputs/skill-whisper-tuner.md`为了给定域名 设计一个微笑细调或推断管道

## 运动

1. **Easy.**运行`code/main.py`△它将标记一个语式提示,计算解码的形状预算,并打印10分钟的剪辑节目.
2. **Medium.**装备`faster-whisper`转写一个10分钟播客,并与人类转录比较WER――尝试`language="auto"`与强制`language="en"`,我知道.
3. **Hard.**使用HF `datasets`选择一种 语文表现吃力的语言 (例如乌尔都语),在 2 小时数据上使用 LoRA细调 中期 2 时代,并报告 WER 德尔塔──

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## 进一步阅读

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) 原始建筑和培训配方
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363)四层解码器,8倍加快.
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747)长形,字符串,日记.
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2支持,快4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper)法典LoRA/全FT通行.
