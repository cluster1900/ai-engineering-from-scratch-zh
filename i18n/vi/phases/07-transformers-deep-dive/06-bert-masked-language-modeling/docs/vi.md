# BERT  Mô hình hóa ngôn ngữ che đậy

> GPT 预测下一个词――BERT 预测缺失的词――只差一句话,却带来了半十年的各种嵌入式形――

**类型:**构建
**语言:**Python
**先修:**Giai đoạn 7 · 05 (Tổng biến đổi), Giai đoạn 5 · 02 (文本表示)
**时间:**~ 45 phút

## 问题

Năm 2018, mỗi nhiệm vụ NLP  phân tích cảm xúc  NER、QA、entailment đều sẽ tập luyện mô hình của mình trên dữ liệu nhãn hiệu của riêng mình.

BERT (Devlin et al. 2018) đề xuất một vấn đề: Nếu chúng ta có một bộ mã hóa Transformer, đào tạo nó trên mỗi câu trên Internet,并 buộc nó dựa trên hai bên trên văn bản dự đoán thiếu sót từ, sẽ làm thế nào?

Kết quả là: trong 18 tháng,BERT và các biến thể của nó (RoBERTa, ALBERT, ELECTRA) đã thống trị tất cả bảng xếp hạng NLP vào thời điểm đó.

Đến năm 2026, mô hình chỉ có mã hóa vẫn là công cụ phân loại, lấy lại và cấu trúc rút ra. Mỗi token của chúng chạy nhanh hơn bộ giải mã nhanh hơn 510×, trong khi các nhúng của chúng là cấu trúc của mỗi bộ sưu tập lấy lại hiện đại. ModernBERT (Dec 2024) sử dụng Flash Attention + RoPE + GeGLU sẽ thúc đẩy cấu trúc đến bối cảnh 8K.

## 核心概念

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### 训练信号

取一个句子:`the quick brown fox jumps over the lazy dog`

随机面具 15% 的 Điểm:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

训练模型在被面具的位置预测原始代号──因为 mã hóa là hai chiều, vì vậy ở vị trí 1 预测 `[MASK]`时, có thể sử dụng vị trí 2+ của `brown fox jumps`Đó là điều GPT không làm được.

### BERT mặt nạ 规则

Trong 15% Địa chỉ được chọn trong:

- 80% được thay thế`[MASK]`
- 10% được đổi thành token tùy chọn.
- 10% 保持不变──

Tại sao không luôn luôn được sử dụng?`[MASK]`? vì `[MASK]`Trong quá trình suy nghĩ sẽ không xuất hiện. Nếu mô hình đào tạo ở 100% vị trí che giấu, bạn sẽ mong đợi.`[MASK]`, sẽ có sự phân chia chuyển động giữa việc tập luyện trước và điều chỉnh tinh tế ∼10% 随机 + 10% 不变能让模型保持稳健──

### Next Sentence Prediction (NSP) và tại sao nó đã bị xóa

原始BERT còn đào tạo NSP:给定两个句子A 和 B,预测B 是否跟随在A 后面──RoBERTa (2019) đã thực hiện một thí nghiệm消融, chứng minh NSP có hại không lợi──现代编码器会跳过它──

### 2026 năm biến đổi:ModernBERT

ModernBERT năm 2024 sử dụng các bộ phận cơ bản năm 2026 xây dựng lại khối:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

Và khác với đống năm 2018, nó ban đầu hỗ trợ Flash-Attention. Trong chiều dài chuỗi 8K, tốc độ phát triển của DeBERTa-v3 nhanh hơn 23×, đồng thời GLUE là tốt hơn.

### 2026 năm vẫn chọn sử dụng của mã hóa

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

##  xây dựng nó

### 步骤 1: logic che giấu

见 `code/main.py`◊ hàm`create_mlm_batch`接收一个代币 ID 列表、语音大小 和面具概率──返回输入 IDs(已应用面具) 和标签(只在面具位置有值,其他位置为 -100这是PyTorch's ignore index 约定) ⋅

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

### 步骤 2: Trong một cơ thể nhỏ trên vận hành dự đoán MLM

Trong bao gồm 20 từ từ, 200 câu, tập luyện một bộ mã 2 tầng + đầu MLM. Không có điểm số. Chúng tôi chỉ làm kiểm tra tâm lý tiến bộ.

### Bước 3: So sánh mặt nạ 类型

展示三路规则 làm thế nào để mô hình trong không có `[MASK]`Trong trường hợp vẫn có thể sử dụng. Trong các câu không che và trên các câu che, cả hai đều nên tạo ra một sự phân bố hợp lý, vì mô hình đã gặp hai mô hình trong đào tạo.

### 步骤 4: đầu tinh chỉnh

Trong một bộ dữ liệu cảm xúc đồ chơi trên, sử dụng đầu phân loại thay thế đầu MLM. Chỉ có đầu tập luyện.

## Sử dụng nó

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`Trung像 `all-MiniLM-L6-v2`Mô hình này, là sử dụng sự mất mát tương phản 训练的BERT──encoder 是同一个──变化是 Loss──

**Cross-encoder rerankers 也是 fine-tuned BERT。**Trong `[CLS] query [SEP] doc [SEP]`上做 cặp phân loại;. câu hỏi 和 doc 之间的双向关注,正是交叉编码相比双编码 具有质量优势的原因──

**2026 年什么时候不该选 BERT。**任何生成式任务──编码器 没有合理方式 autoregressively 生成 Token──另外: bất kỳ 1B tham số nào dưới đây、 trong đó nhỏ decoder 能以更高灵活性达到相同质量的任务 (Phi-3-Mini, Qwen2-1.5B)──

## 交付 nó

见 `outputs/skill-bert-finetuner.md`◊ kỹ năng này sẽ được sử dụng để phân loại hoặc trích xuất mới  nhiệm vụ định nghĩa BERT fine-tune phạm vi của các kỹ năng này

## 练习

1. **Easy.**运行 `code/main.py`, đã in 10.000 token trên mặt nạ phân phối. xác nhận khoảng 15% được chọn, trong đó khoảng 80% biến thành`[MASK]`
2. **Medium.**实现全词掩盖: Nếu một từ được Tokenizer 切成字段,则一起掩盖所有字段,或全部不掩盖――衡量这是否能在500句子 corpus上提升MLM精度――
3. **Hard.**Trong 10.000 câu trên tập hợp dữ liệu công cộng tập luyện một BERT nhỏ (2-layer, d=64) ⋅ để tinh chỉnh cảm xúc của SST-2 `[CLS]`Địa chỉ                                                                                                                                                                                                                                                              

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
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555)Trong cùng một tính toán, nhận dạng mã thông báo thay thế đã vượt qua MLM.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) ModernBERT 论文──
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准 encoder 参考。
