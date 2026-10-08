# 编码器-解码器模型

> 编码器负责理解. 解码器负责生成. 把它们重新组合在一起,就得到一个专为输入 →输出任务构建模型:翻译、总结、改写、转录。

**Type:** Learn
**Languages:** Python
**先修要求:**转换器 (全变体),7期06期 (BERT),7期07期 (GPT)
**Time:** ~45 minutes

## 问题

为了实现2017年的不同目标,我们做了精简的设计.

- 翻译:英语 → 法语.
- 摘要:5000个标题文章 →200个标题摘要──
- 音频标识 →文本标识──
- 结构化抽取: 散文 → JSON。

对于这些任务,编码器-解码器是最贴合的形式.编码器 生成源内容的密集表示. 解码器 生成输出,并对该表示执行交叉注意力.

两篇论文定义了现代做法:

1. **T5**"文本转移变换器"将每个NLP任务都重新表述为文本进出,文本出.
2. **BART**无声自动编码器:以多种方式破坏输入 (Lewis et al. 2019).让解码器重建原始内容――

到2026年,编码-解码格式仍然存在输入结构中非常重要的地方:

- 语 (语音 →文字).
- 谷歌的翻译技术
- 一些具有明确的文本和编辑结构的代码完成 /修复模型.
- 为了结构化推理,任务的Flan-T5及其变体.

只有解码器才赢得聚光灯,但解码器从未消失.

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### 前向循环

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

关键在于,对每个输入的编码器只运行一次. 编码器以自动降低的方式运行,但每个步骤都交叉到达同一个编码器.

### 预训练  腐败的跨度

随机选择输入中的跨度平均长度 3 个代币,总计 15%) ⋅使用唯一的哨兵 替换每个跨度:`<extra_id_0>`,我知道.`<extra_id_1>`等等. 解码器只输出被破坏的跨度,并带上应对的哨兵前:

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

与预测整个序列相比,这是一个更便宜的信号. 在T5论文的摘录中,它与MLM (BERT) 和前LM (UniLM) 有竞争力.

### 预训练 多噪音击

试了五种噪音功能:

1. 标志掩盖.
2. 删除代码.
3. 文字填写: 面具,解码器,插入正确长度的内容
4. 换句话变化.
5. 文件转换.

文本填写+句子调整的组合产生了最佳下游结果──解码器始终重建原始内容──BART的输出是完整序列,而不仅仅是被破坏的跨度,所以预训练计算高于T5──

### 推理

与GPT相似的自动降低性生成――贪/束/顶部采样都适用――束搜索(宽度45) 是翻译和摘要的标准做法,因为输出分布比聊更窄――

### 2026年何时选择各个变体

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

自2022年起,趋势是:仅使用解码器接管过去由编码器-解码器 主导的任务,因为 (a) 命令调节的仅使用解码器的LLM可以通过提示泛化到任何任务, (b) 单一架构比两个架构更容易扩展, (c) RLHF 假设使用解码器――解码器-解码器 仍然保留输入方式, 不同的语音图像) 或光束搜索质量很重要景景.


```figure
encoder-decoder
```

## 构建它

见`code/main.py`                                                                                                                                                                                                                                                              

### 步骤1:跨度腐败

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

目标 格式遵循T5 约定:`<sent0> span0 <sent1> span1 ...`△腐败输入 会把未改变的代币与跨度位置的哨兵代币 交错排列──

### 步骤2:检查回路

给定腐败输入和目标,重建原始句子. 如果你的腐败是可逆的,那么继续通过就是很好的定义.

### 步骤3:BART噪音

五个函数:`token_mask`,我知道.`token_delete`,我知道.`text_infill`,我知道.`sentence_permute`,我知道.`document_rotate`组合其中两个并显示结果.

## 使用它

抱脸 参考:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

任务名称进入输入文本. 一个模型可以处理数十种任务,因为每个任务都是文本输入,文本输出. 到2026年,这个模式已经被指示调节的仅解码器模型泛化,但T5 最先将其规范化.

## 交付它

见`outputs/skill-seq2seq-picker.md`△该技能将根据输入输出 结构、延迟和质量目标,为一个新任务做出在编码器-解码器和仅编码器之间选择──

## 练习

1. **Easy.**运行`code/main.py`对于一个30代码句子应用范围的腐败,验证将非传递源代码与解码目标范围的复制.
2. **Medium.**实现BART 的`text_infill`噪音:用单个`<mask>`标志 随时的跨度,解码器 必须推断正确的跨度 长度和内容.
3. **Hard.**在一个很小的英语 →猪拉丁语体200对) 上细调`flan-t5-small`△在50对的设置上测量蓝色――与在相同数据和相同的计算下细调`Llama-3.2-1B`结果进行比较.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | “Seq2seq transformer” | 两个 stack：用于输入的 bidirectional encoder，以及带 cross-attention、用于输出的 causal decoder。 |
| Cross-attention | “源内容与目标内容对话的地方” | decoder 的 Q × encoder 的 K/V。这是 encoder 信息进入 decoder 的唯一位置。 |
| Span corruption | “T5 的预训练技巧” | 用 sentinel Token 替换随机 span；decoder 输出这些 span。 |
| Denoising objective | “BART 的游戏” | 对输入应用 noise function，训练 decoder 重建 clean sequence。 |
| Sentinel token | “`<extra_id_N>` 占位符” | 特殊 Token，用于在 source 中标记被破坏的 span，并在 target 中重新标记它们。 |
| Flan | “Instruction-tuned T5” | 在超过 1,800 个任务上 fine-tuned 的 T5；让 encoder-decoder 在 instruction-following 上具备竞争力。 |
| Beam search | “Decoding strategy” | 在每一步保留 top-k 个 partial sequence；是翻译/摘要的标准做法。 |
| Teacher forcing | “Training-time input” | 训练期间，把真实的前一个输出 Token 喂给 decoder，而不是采样出来的 Token。 |

## 延伸阅读

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) T5──
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461)   
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416)   
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356)                                  
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现.
