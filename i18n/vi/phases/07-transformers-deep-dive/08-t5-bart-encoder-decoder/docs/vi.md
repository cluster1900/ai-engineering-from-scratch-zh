# T5, BART  Mô hình mã hóa-tử lý

> Encoder 负责理解. Decoder 负责生成. 把它们重新组合在一起,就得到一个专为输入 →输出 任务构建的模型:翻译、总结、改写、转录.

**Type:** Learn
**Languages:** Python
**先修要求:**Giai đoạn 7 · 05 (Tổng biến đổi), Giai đoạn 7 · 06 (BERT), Giai đoạn 7 · 07 (GPT)
**Time:** ~45 minutes

## 问题

Chỉ có GPT và chỉ có BERT làm việc đơn giản hơn để đạt được mục tiêu khác nhau đối với cấu trúc năm 2017.

- Dịch: tiếng Anh → tiếng Pháp.
- Kết luận: 5.000-Token 文章 → 200-Token 摘要──
- Nhận dạng ngôn ngữ: 音频 Token → 文本 Token。
- 结构化抽取: 散文 → JSON。

Đối với những nhiệm vụ này, trình mã hóa-cập mã là hình thức thích hợp nhất. Các trình mã hóa tạo ra nguồn nội dung dày đặc. Các trình mã hóa tạo ra đầu ra, và thực hiện qua từng bước cho biểu hiện này.

两篇论文定义了现代做法:

1. **T5**(Raffel et al. 2019). "Transformer Transfer Text-to-Text". sẽ mô tả lại mỗi nhiệm vụ NLP như text-in, text-out.
2. **BART**(Lewis et al. 2019). "Tranformator hai chiều và tự động hồi phục. " 去噪音 tự động mã hóa:以多种方式破坏输入(shuffle、mask、delete、rotate),让解码重建原始内容──

Đến năm 2026, định dạng mã hóa-tài mã vẫn tồn tại trong cấu trúc nhập rất quan trọng:

- Nhầm (những lời nói → văn bản).
- Google's Translation Technology
- Một số có một ngữ cảnh rõ ràng và chỉnh sửa 结构 模型 模型
- Sử dụng lý luận có cấu trúc nhiệm vụ của Flan-T5  và các biến thể của nó.

Chỉ có bộ giải mã đã giành được đèn聚光, nhưng bộ giải mã giải mã vẫn còn tồn tại.

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### Chuyển tiếp

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

关键 là, bộ mã hóa cho mỗi đầu vào chỉ chạy một lần. Bộ mã hóa được sử dụng theo cách tự động, nhưng mỗi bước đều đi ngang đến cùng một bộ mã hóa.

### T5 预训练  phạm vi tham nhũng

随机选择输入中的 span(平均长度 3 个 Token,总计 15%) ―― dùng một chiếc Sentinel duy nhất 替换 mỗi span:`<extra_id_0>``<extra_id_1>`等等──decoder chỉ输出被破坏的跨度,并带上应对的哨兵 前:

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

So với dự đoán toàn bộ chuỗi, đây là một tín hiệu rẻ hơn. Trong sự trừu tượng của bài luận T5, nó có sức cạnh tranh với MLM (BERT) và tiền tố-LM (UniLM).

### BART 预训练                                                                                                                                                                                                                                                            

BART 尝试了五种噪音功能:

1. - Đánh dấu.
2. - Đánh dấu.
3. Đánh văn bản:                                                                                                                                                                                                                                                             
4. Chuyển đổi câu.
5. Chuyển đổi tài liệu.

Bộ kết hợp của việc lấp đầy văn bản + chuyển đổi câu tạo ra kết quả tốt nhất.

### 推理

Với GPT tương tự như thế hệ tự do giảm đi, ốm phỉnh / chùm / top-p sampling đều có thích hợp.

### 2026 年何时选择各变体

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

Từ khoảng năm 2022 xu hướng là: chỉ có trình giải mã đã tiếp quản quá khứ bởi trình giải mã-chỉ có trình giải mã 主导的任务, vì (a) chỉ dẫn-tuned giải mã-chỉ có thể thông qua yêu cầu 泛化到任何任务, (b) đơn cấu trúc hơn hai cấu trúc dễ dàng mở rộng hơn, (c) RLHF giả sử sử sử dụng giải mã.


```figure
encoder-decoder
```

##  xây dựng nó

见 `code/main.py`Chúng tôi đã tạo ra một bộ đồ chơi để thực hiện sự tham nhũng trong thời gian của T5 风格 Đây là một phần đơn giản hữu ích nhất của bài học này, vì nó xuất hiện sau đó trong hầu hết các bộ máy mã hóa-đánh mã 预训配配备

### 步骤 1: phạm vi tham nhũng

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

mục tiêu 格式 theo T5 约定:`<sent0> span0 <sent1> span1 ...` nhập nhập tham nhũng 会把未改变的代码与跨度位置上的哨兵代码 交错排列──

### 步骤 2: xác minh đi lại và đi lại

给定腐败输入 和目标,重建原始句子──如果你的腐败是可逆的,那么通过前进就是良定义的──这是一个智力检查真实训练从不这样做,但这个测试成本很低,并且能捕捉跨度账本中的偏差──

### 步骤 3: BART tiếng ồn

五个函数:`token_mask``token_delete``text_infill``sentence_permute``document_rotate`◊组合 trong số đó hai并 hiển thị kết quả

## Sử dụng nó

HuggingFace 参考:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

T5 技巧: nhiệm vụ名称进入输入文本──同一个模型可以处理数十种任务,因为每个任务都是文字进,文字出──到2026年,这个模式已经被指示调解器-仅模型泛化,但T5 最先将其规范化──

## 交付 nó

见 `outputs/skill-seq2seq-picker.md` Kỹ năng này sẽ được lựa chọn giữa các nhiệm vụ mới chỉ có trình mã hóa-đánh mã và chỉ có trình mã hóa-đánh mã dựa trên cấu trúc 、延迟和质量目标.

## 练习

1. **Easy.**运行 `code/main.py`, đối với một 30-Token 句子应用跨度腐败,验证将非哨源代币与解码目标跨度 拼接后可以复现原始句子──
2. **Medium.**实现 BART của `text_infill`tiếng ồn: dùng đơn `<mask>`Các mã  thay thế theo thời gian, decoder  phải xác định đúng thời gian 长度和内容── hiển thị một ví dụ──
3. **Hard.**Trong một tiếng Anh rất nhỏ → Lâm-từ corpus(200 đối) trên âm thanh tốt `flan-t5-small`△ trong bộ 50 cặp được giữ trên đo BLEU。 với trong cùng dữ liệu và cùng tính toán 下 tinh chỉnh `Llama-3.2-1B`Kết quả được so sánh:

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

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) T5。
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461) BART。
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) Flan-T5──
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Whisper,2026 年的法典编码-解码器──
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现。
