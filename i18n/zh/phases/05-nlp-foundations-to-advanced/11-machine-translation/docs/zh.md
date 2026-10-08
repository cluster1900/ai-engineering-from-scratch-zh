# 机器翻译

> 翻译是为NLP研究而完成了30年的任务,

**Type:** Build
**Languages:** Python
**先修要求：**五期·10期 (注意),五期·04期 (全球,快文,字幕)
**Time:** ~75 minutes

## 问题
一个模型读取一种语言的句子,并产生另一种语言的句子――长度会变化――词序会变化――有些源语言词会映射到多个目标语言词,反之亦然――习语拒绝对一映射――英语中的"我怀念你"在法语里是"你让我缺少你" 字面意思是"你不见我"――没有任何词级配列可以在这种情况下保留下来――

机器翻译是迫使NLP发明编码器-解码器,注意力,变革者,并最终推动整个LLM范式形成的任务.

本课跳过历史课,讲解2026年可用管道:训练有素的多语言编码器-解码器 (NLLB-200或 mBART) 及进入生产的少数失败模式.

## 概念
![MT pipeline: tokenize → encode → decode with attention → detokenize](../assets/mt-pipeline.svg)

现代MT 是在平行文本上训练的变体编码器-解码器──编码器 读取按其语言标记化 处理后的源──解码器 通过跨度注意力(10课) 使用编码器的输出,一次生成一个字幕──解码 使用光束搜索以避免贪的解码陷──输出 会被解代,并与参考 评分对比──

三个操作选择决定了真实世界中的MT质量.

- **Tokenizer.**语句Piece BPE 在混合语言体上训练――跨语言共享词汇正是NLLB能实现零射击语言对的原因――
- **Model size.**果产品:NLLB-200蒸 600M 可在笔记本电脑上运行.
- **Decoding.**通用内容使用束宽 4-5──使用长度罚款 避免输出 过短──在需要术语一致性时使用限制解码──


```figure
seq2seq-alignment
```

## 构建它
### 步骤1:一个预训练的MT电话

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_id = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

src = "The cats are running."
inputs = tok(src, return_tensors="pt")

out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("fra_Latn"),
    num_beams=5,
    length_penalty=1.0,
    max_new_tokens=64,
)
print(tok.batch_decode(out, skip_special_tokens=True)[0])
```

```text
Les chats courent.
```

这里有三个重要的事情.`src_lang`告诉代币器 应用哪种脚本和细分.`forced_bos_token_id`告诉解码器要生成哪种语言──两者都是NLLB特定的技巧;mBART 和 M2M-100 使用各自的约定,不能互换──

### 步骤2:蓝色和色

BLEU 测量输出与参考之间的 n-gram 重叠――四种参考 n-gram 尺寸――1-4) 度的几何平均值,以及针对过短输出的短暂处罚――分数范围是 [0, 100]――常用――解释起来令人丧:30 BLEU 是"可用";40 是"好";50 是"特殊";低于1 BLEU 的差异属于噪音──

对于形态丰富的语言更敏感,因为BLEU会低估相匹配.

```python
import sacrebleu

hypotheses = ["Les chats courent."]
references = [["Les chats courent."]]

bleu = sacrebleu.corpus_bleu(hypotheses, references)
chrf = sacrebleu.corpus_chrf(hypotheses, references)
print(f"BLEU: {bleu.score:.1f}  chrF: {chrf.score:.1f}")
```

始终使用`sacrebleu`△它将标准化标记化,让分数能在论文中进行比较.

### 三层评估层级 (2026)

现代MT评估 使用三类互补的指标家族.

- **Heuristic**快速,基于参考的解释可解释,但对抛词不敏感.
- **Learned**(COMET,BLEURT,BERTScore) 通过人类判断,培训的神经模型与翻译和参考的语义相似性相比,自2023年以来,COMET与MT研究的关联最高,并且在质量问题上,2026年的生产违约.
- **LLM-as-judge**根据流利性,适用性,色调,文化适用性,一个大模型的提示 打分.

实用2026堆:用 `sacrebleu`计算 BLEU 和 chrF,用`unbabel-comet`计算 COMET,并使用促使 LLM 作为最终面向人类的信号. 在信任任何指标使用生产数据之前,先使用50-100个标签的人类的例子进行校准.

对于没有参考翻译的长尾语言对很重要.

### 步骤3:生产中会坏在哪里

上面的工作管道在80%的情况下会流翻译,而在剩余20%的情况下会失败.

- **Hallucination.**发明来源 中不存在的内容──常见于不熟悉的域名词汇──症状:输出 很流,但声称源源 没有陈述的事实──调解:对域名术语使用限制式解码,对受监管的内容使用人文审查,并监控输出 是否比输入长很多──
- **Off-target generation.**模型 翻译成错误语言――NLLB 在罕见的语言对上尤其容易出现这个问题――调解:验证`forced_bos_token_id`,并始终使用语言ID模型检查检查输出──
- **Terminology drift.**在doc 1 中变成"s'inscribe",在doc 2 中变成"creer un compte"――对于UI文本和用户面向字符串,一致性比原质更重要――Mitigation:词典限制解码或后编辑字典――
- **Formality mismatch.**法语 "tu" vs "vous",日语礼貌水平──模型会选择培训 中更常见的形式──对于面向客户的内容,这通常是错误的──调解:如果模型支持,用正式性标志 作为快速预写,或者在正式的 corpora 上细调 一个小模型──
- **Length explosion on short input.**很短的输入句子 经常产生过长的翻译,因为在低于约5个源代币时长度处罚会突然失效――减缓:使用与源长度 成比例的硬最大长度盖──

### 步骤 4: 为一个域进行细调

预训练模型是一般主义者――法律、医学或游戏对话翻译 会明显受益于在域的平行数据上细调――配方不奇怪:

```python
from transformers import Trainer, TrainingArguments
from datasets import Dataset

pairs = [
    {"src": "The defendant pleaded guilty.", "tgt": "L'accusé a plaidé coupable."},
]

ds = Dataset.from_list(pairs)


def preprocess(ex):
    return tok(
        ex["src"],
        text_target=ex["tgt"],
        truncation=True,
        max_length=128,
        padding="max_length",
    )


ds = ds.map(preprocess, remove_columns=["src", "tgt"])

args = TrainingArguments(output_dir="out", per_device_train_batch_size=4, num_train_epochs=3, learning_rate=3e-5)
Trainer(model=model, args=args, train_dataset=ds).train()
```

几千个高质量平行例子 超过了几十万个噪音的网页剪辑例子――训练数据质量是生产中最大的单一杆――

## 使用它
2026年MT生产堆:

| Use case | Recommended starting point |
|---------|---------------------------|
| Any-to-any, 200 languages | `facebook/nllb-200-distilled-600M`（laptop）或 `nllb-200-3.3B`（production） |
| English-centric, high quality, 50 languages | `facebook/mbart-large-50-many-to-many-mmt` |
| Short runs, cheap inference, English-French/German/Spanish | Helsinki-NLP / Marian models |
| Latency-critical browser-side | ONNX-quantized Marian（~50 MB） |
| Maximum quality, willing to pay | GPT-4 / Claude / Gemini with translation prompts |

截至2026年,在一些语言对上已经超过了专业的MT模型,特别是在语法内容和长文上.取舍是每代币成本和延迟.

## 交付它
保存为`outputs/skill-mt-evaluator.md`其他:

```markdown
---
name: mt-evaluator
description: Evaluate a machine translation output for shipping.
version: 1.0.0
phase: 5
lesson: 11
tags: [nlp, translation, evaluation]
---

给定 source text 和 candidate translation，输出：

1. Automatic score estimate。你预期的 BLEU 和 chrF ranges。说明是否有 reference。
2. 五点 human-verifiable check list：(a) content preservation（无 hallucinations），(b) correct language，(c) register / formality match，(d) terminology consistency with glossary if provided，(e) 无 truncation 或 length explosion。
3. 一个需要探查的 domain-specific issue。例如 legal：named entities 和 statute citations。medical：drug names 和 dosages。UI：placeholder variables `{name}`。
4. Confidence flag。"Ship" / "Ship with review" / "Do not ship"。将它与 step 2 中发现的问题 severity 绑定。

如果 output 没有 language-ID check，拒绝 ship translation。除非 user 明确选择 reference-free scoring（COMET-QE, BLEURT-QE），否则拒绝在没有 reference 的情况下 evaluate。标记任何超过 1000 tokens 的内容，因为它很可能需要 chunked translation。
```

## 练习
1. **Easy.**使用 `nllb-200-distilled-600M`将一个 5 句英文段落翻译成法语,再翻译回英语――衡量回路与原始的接近程度――你应该看到语义保存,同时伴随着词选择漂移――
2. **Medium.**使用 `fasttext lid.176`或`langdetect`实现语言身份检查.将其集成到MT调用中,让非目标代人在返回前被捕.
3. **Hard.**在你选择的5000个对域名体内上调`nllb-200-distilled-600M`在细调前后,使用延长的设置测量BLEU――报告哪些类型的句子得到改善,哪些出现回归――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| BLEU | Translation score | 带 brevity penalty 的 N-gram precision。[0, 100]。 |
| chrF | Character F-score | Character-level F-score。对形态丰富的语言更敏感。 |
| NMT | Neural MT | 在 parallel text 上训练的 Transformer encoder-decoder。2017+ default。 |
| NLLB | No Language Left Behind | Meta 的 200-language MT model family。 |
| Constrained decoding | Controlled output | 强制特定 tokens 或 n-grams 在 output 中出现 / 不出现。 |
| Hallucination | Invented content | source 不支持的 model output。 |

## 延伸阅读
- [Costa-jussà et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation](https://arxiv.org/abs/2207.04672)NLLB论文──
- [Post (2018). A Call for Clarity in Reporting BLEU Scores](https://aclanthology.org/W18-6319/)为什么?`sacrebleu`是报告BLEU唯一正确的方式.
- [Popović (2015). chrF: character n-gram F-score for automatic MT evaluation](https://aclanthology.org/W15-3049/)纸
- [Hugging Face MT guide](https://huggingface.co/docs/transformers/tasks/translation) 实用细调通行.
