# BERT  Maskeli Dil Modelleştirme

> GPT 预测下一个词――BERT 预测缺失的词――只差一句,却带来了半十年的各种嵌入式――

**类型:**Yapım
**语言:**Python
**先修:**7. aşama · 05 (Tüm Transformer), 5. aşama · 02 (文本表示)
**时间:**~ 45 dakika

## 问题

2018 yılında, her NLP görevi 情感分析、NER、QA、entailment都将在自己的标签数据上从头训练自己的模型──当时还没有可以细调的预训练的 理解英语检查点──ELMo (2018) 双向的LSTM预训文本嵌入式的实用性证明; bu yardımcı, ancak generalization能力不足──

BERT (Devlin et al. 2018) bir soruyu ortaya koydu: Eğer bir Transformer kodlayıcısı alırsak, internet'teki her cümle üzerinde eğitirsek ve iki tarafta da görülen kayıp kelimelere göre zorlasak, ne olacak?

Sonuç: 18 个月内,BERT 及其变体 (RoBERTa, ALBERT, ELECTRA) 统治了当时所有的NLP leaderboard──到2020年,地球上每一个搜索引擎、内容审核管道和语义搜索系统里都有一个BERT──

2026 yılına kadar, sadece kodlayıcı  modeller hala sınıflandırma, kurtarma ve yapılandırma çekiminin doğru araçlarıdır. Onlar her bir simgelerin çalışması hızını dekodörden 快 510× daha hızlı yaparken, onların gömülmeleri her modern kurtarma yığınının yapısal yapılarıdır. ModernBERT (Aralık 2024) Flash Attention + RoPE + GeGLU ile yapısal yapısal yapısal yapısal yapısal yapısal bir 8K bağlamına ilerleyecektir.

## 核心概念

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### 訓練信号

Bir cümle:`the quick brown fox jumps over the lazy dog`- Evet.

随机 maski 15% 的 İşaret:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

訓練模型在被蒙面的位置预测原始 Token──因为编码器是双向的,所以在位置 1 预测 `[MASK]`时, 2+ ′'den kullanılabilir.`brown fox jumps`Bu GPT'nin yapmadığı bir şey.

### BERT maske 规则

Seçili %15 Token İçinde:

- % 80 değiştirilir`[MASK]`- Evet.
- % 10'u her zamanki simgeler için değiştirilmiştir.
- %10 değişmez.

Neden her zaman kullanılmaz ?`[MASK]`? Çünkü`[MASK]`Eğer bir eğitim modeli %100 maskeli bir konumda ise, beklenir.`[MASK]`, hazırlık ve ince ayarlama arasında dağılım gerginliği oluşur. %10 随机 + 10% 不变能让模型保持稳健──

### Sonraki Ceza Tahmini (NSP)  ve neden kaldırıldı

İlk BERT, NSP'yi de eğitmiştir: given two sentences A 和 B, prediction B is whether or not following in A 后面──RoBERTa (2019) bunun için bir giderme deneyi yaptı, NSP'nin zararlı olmadığını kanıtladı──modern encoder will jump over it──

### 2026 yılının değişimi:ModernBERT

2024 ModernBERT makalesinde 2026 yılının temel bileşenleri ile blok yeniden inşa edildi:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

Ayrıca 2018'deki yığınla farklı olarak, Flash-Attention'ı desteklemektedir.

### 2026 yıl hâlâ seç kodlayıcı

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

## Yapın onu.

### 步骤 1: maskeli mantık

Görüyorum .`code/main.py`。函数 `create_mlm_batch`接收一个代码 ID 列表、语音大小 和面具概率──返回输入 IDs(已应用面具) 和标签((只在面具位置有值,其他位置为 -100这是PyTorch's ignore index 约定) 

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

### 步骤 2: 在一个微型 corpus 上运行 MLM öngörü

20 kelimelik kelime havuzu içinde, 200 cümlelik bir iki katmanlı kodlayıcı + MLM başı eğitimi.

### 步骤 3: Maske 类型 ile karşılaştır

展示三路规则  nasıl modellerin yokluğunda `[MASK]`Bu iki yöntem de eğitim sırasında iki farklı yöntem görüldüğü için, uygun bir belirti dağıtımı oluşturmalıdır.

### 4 adım: ince ayarlı baş

Bir oyuncak duygusu verisi kümesi üzerinde, sınıflandırma başlığı ile değiştirilmiştir MLM başlığı.

## Kullan

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`Orta gibi`all-MiniLM-L6-v2`Bu model, kontrast kaybı  TRENING BERT ∞ kodlayıcı aynı ∞ değişim ∞ kaybı ∞

**Cross-encoder rerankers 也是 fine-tuned BERT。**- Evet .`[CLS] query [SEP] doc [SEP]`上做 çift sınıflandırma── sorgu 和 doc  arasındaki iki yönlü dikkat,正是 çapraz kodlayıcı 相比双码码 具有质量优势的原因──

**2026 年什么时候不该选 BERT。**任何生成式任务──编码器 没有合理方式 autoregressively 生成 Token──另外: herhangi bir 1B parametresi 以下、其中小型 dekoder 能以更高灵活性达到相同质量的任务 (Phi-3-Mini, Qwen2-1.5B)──

## - Söyle.

Görüyorum .`outputs/skill-bert-finetuner.md`◊ Bu beceri Yeni sınıflandırma veya çıkarma için  görev tanımı BERT ince ayarlamalar                                                                                                                                                                                                                                                    

## 练习

1. **Easy.**运行  İşlem`code/main.py`, ve 10.000 Token'i yazdırır. Üst maske dağıtıldı. %15'i seçilmiş, %80'i de seçilmiş.`[MASK]`- Evet.
2. **Medium.**实现全字掩饰:如果一个词被 Tokenizer 切成字段,则一起掩饰所有字段,或全部不掩饰――衡量这是否能在500-句 corpus上提升MLM精度――
3. **Hard.**Toplu verilerden gelen 10.000 cümle üzerinde eğitim küçük bir (2 katman, d=64) BERT── için SST-2 duygu ince ayarlama `[CLS]`Token. Param 匹配的解码器-only baseline

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
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) 如何正确训练 BERT;移除 NSP──
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555)Aynı hesaplama sırasında, değiştirilmiş simgeler tespit edilmesi MLM'den üstün geldi.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663)ModernBERT 论文。
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准 encoder 参考。
