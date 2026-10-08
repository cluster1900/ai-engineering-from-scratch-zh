# 面具语言建模

> 预测下一个词――BERT 预测缺失的词――只差一句话,却带来了半十年的各种嵌入式形态――

**类型:**构建
**语言:**字符串
**先修:**转变器 (全变体),5期 (文本表示)
**时间:**时间45分钟

## 问题

2018年,每个NLP任务都将在自己的标记数据上从头开始训练自己的模型.当时还没有可以精细调的预训练的理解英语检查点.ELMo (2018) 证明可以使用双向LSTM预训文本嵌入式;它有帮助,但泛化能力不够.

伯特 (Devlin et al. 2018) 提出了一个问题:如果我们拿到一个变压器编码器,在互联网上的每个句子上训练它,并强制它根据两侧下文预测缺失词,会怎么样?

结果是:在18个月内,BERT及其变体 (罗伯塔,阿尔伯特,埃莱克特拉) 统治了当时所有NLP排名榜.

到2026年,仅编码模型仍然是分类,检索和结构化抽取的正确工具,它们的每个代币运行速度比解码器快510×,而它们的嵌入式是每个现代检索堆的骨架.

## 核心概念

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### 训练信号

取一个句子:`the quick brown fox jumps over the lazy dog`,我知道.

随机面具 15% 的标志:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

训练模型在被掩盖的位置预测原始代币――因为编码器是双向的,所以在位置 1 预测`[MASK]`时,可以使用位置2+ 的 `brown fox jumps`这正是GPT做不到的事情.

### 规则 规则

在被选中使用预测的15%代币中:

- 80% 被替换为`[MASK]`,我知道.
- 10% 被替换为随机代币.
- 保持不变的10%

为什么不总是用?`[MASK]`因为`[MASK]`如果训练模型在100%的掩盖位置,`[MASK]`随着时间的10% 随着时间的10% 不变能让模型保持稳定.

### 下一句预测 (NSP) 以及为什么它被移除

原始BERT还训练了NSP:给定两个句子A 和B,预测B 是否跟随A 后面――RoBERTa (2019) 对它进行消融实验,证明NSP有害无益――现代编码器会跳过它――

### 2026 年变化:ModernBERT

2024 年的ModernBERT论文使用2026 年的基础组件重建区块:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

并且与2018年的堆不同,它原生支持闪光注意力. 在序列长度8K时,推理速度比DeBERTa-v3快23×,同时GLUE分数更好.

### 2026年仍然选择编码器的使用例

| Task | 为什么 encoder 胜过 decoder |
|------|------------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = 每个 Token 更好的 Embedding 质量 |
| Classification (sentiment, intent, toxicity) | 一次 forward pass；没有生成开销 |
| NER / token labeling | 逐位置输出，天然 bidirectional |
| Zero-shot entailment (NLI) | encoder 顶部的 classifier head |
| Reranker for RAG | Cross-encoder scoring，比 LLM rerankers 快 10x |


```figure
transformer-residual
```

## 构建它

### 步骤1:掩盖逻辑

见`code/main.py`△函数`create_mlm_batch`接收一个代币ID列表,语音大小和面具概率──返回输入IDs(已应用面具) 和标签(只在面具位置有值,其他位置为 -100这是PyTorch的无视指数约定) ⋅

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### 步骤2: 在一个微型的体内上运行MLM预测

在包含20个词的词汇"",200个句子上训练一个2层编码器+MLM头"",没有Gradient"",我们只做了前进通过智力检查"",完整训练需要PyTorch"",

### 步骤3: 面具类型

展示三路规则如何让模型在没有`[MASK]`在未蒙面的句子和蒙面的句子上分别预测.

### 步骤 4: 调整头

在一个玩具情感数据集上,使用分类头 替换MLM头.

## 使用它

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`像中像`all-MiniLM-L6-v2`这种模型是使用反比损失的训练.

**Cross-encoder rerankers 也是 fine-tuned BERT。**在`[CLS] query [SEP] doc [SEP]`上做对分类――查询和文档之间的双向关注,正是交叉编码相比双编码 具有质量优势的原因――

**2026 年什么时候不该选 BERT。**任何生成式任务──编码器 没有合理的方式自动生成代币──另外:任何1B参数以下,其中小型解码器可以以更高灵活性达到相同质量的任务 (Phi-3-Mini,Qwen2-1.5B) ─

## 交付它

见`outputs/skill-bert-finetuner.md`△这个技能将用于新的分类或提取任务界定BERT细调的范围(脊椎选择,头条规格,数据,阶段,停止条件)

## 练习

1. **Easy.**运行`code/main.py`印出了1万个标志 上面面具分布. 确认约15%被选中,其中约80%被改成`[MASK]`,我知道.
2. **Medium.**实现全词掩盖:如果一个词被标记器切成字符,则一起掩盖所有字符,或全部不掩盖――衡量这是否能在500句子的体内上提升LM准确性――
3. **Hard.**在公共数据集中的10,000个句子上训练一个小的 (2层,d=64) BERT──为SST-2情感细调`[CLS]`标记与参数匹配的解码器仅基线比较谁赢?

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| MLM | "Masked language modeling" | 训练信号：随机将 15% 的 Token 替换为 `[MASK]`，预测原始 Token。 |
| Bidirectional | "双向看" | Encoder Attention 没有 causal mask——每个位置都能看到其他所有位置。 |
| `[CLS]` | "The pooler token" | 一个添加到每个 sequence 开头的特殊 Token；它的最终 Embedding 用作句子级表示。 |
| `[SEP]` | "Segment separator" | 分隔成对的 sequence（例如 query/doc、sentence A/B）。 |
| NSP | "Next sentence prediction" | BERT 的第二个 pretraining 任务；在 RoBERTa 中被证明无用，2019 年后被移除。 |
| Fine-tuning | "适配一个任务" | 基本保持 encoder 冻结；在其上训练一个小 head 来完成下游任务。 |
| Cross-encoder | "一个 reranker" | 一个同时接收 query 和 doc 作为输入，并输出相关性分数的 BERT。 |
| ModernBERT | "2024 refresh" | 用 RoPE、RMSNorm、GeGLU、交替 local/global attention、8K context 重建的 encoder。 |

## 延伸阅读

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) 原始论文──
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692)如何正确训练BERT;移除NSP──
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555)在同样的计算下,取代代代码检测 胜过了MLM.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663)现代BERT论文──
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准编码器 参考――
