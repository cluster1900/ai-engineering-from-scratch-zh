# Dòng theo dõi 模型

> Hai RNN giả vờ mình là một người dịch.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## 问题
Sự phân loại sẽ thay đổi chuỗi dài 映射到单个标签――T dịch sẽ thay đổi chuỗi dài 映射到另一个变长序――输入和输出 nằm trong các từ vựng khác nhau, có thể là trong các ngôn ngữ khác nhau,并且不保证长度一致――

seq2seq 架构(Sutskever, Vinyals, Le, 2014) sử dụng một công thức đơn giản  giải quyết vấn đề này。 hai RNN。 một đọc câu nguồn,并 tạo ra một liên kết cố định của khối lượng Vector。 một đọc khác đọc cái vector,并逐 Token 生成 mục tiêu câu。就是你在课08 写的相同套代码,只是以不同方式粘在一起。

Đây là một trong những lý do đáng để học. Thứ nhất, vỏ bọc ngữ cảnh là thất bại có giá trị giáo dục cao nhất trong NLP. Nó giải thích sự chú ý và những người biến đổi 擅长 mọi thứ.

## 概念
**Encoder.**读取 nguồn câu của RNN.**context Vector** Đối với toàn bộ nhập khẩu cố định                                                                                                                                                                                                                                                          

**Decoder.**另一个用语文向量初始化的RNN──在每一步,它以前一次生成的代币作为输入,并产生目标词汇上的分布──通过样本或 argmax 选择下一个代币──再把它回去──重复,直到产生`<EOS>`Đơn hiệu hoặc đạt chiều dài tối đa.

**Training:**Trong mỗi bước giải mã  tính mất tích entropy chéo,并沿序列 求和──通过两个网络做标准 backprop qua thời gian──

**Teacher forcing.**Trong quá trình tập luyện, decoder trong bước `t`Đăng nhập là vị trí`t-1`Đơn vị của *ground-truth* thay vì decoder tự mình trước một lần của dự đoán. Đây sẽ ổn định đào tạo; không có nó, sơ bộ sai lầm, mô hình sẽ mãi học không.**exposure bias**

**The bottleneck.**Các mã hóa học được về nguồn của mọi thứ, tất cả phải được trục xuất vào một ngữ cảnh Vector。长句会丢细节。罕见词会被模糊掉。重排序(chat noir vs. black cat) phải được ghi nhớ, chứ không phải được tính toán。

Cảnh sát: Bài học 10 - Bằng cách để máy giải mã xem * mỗi * máy giải mã ẩn trạng thái, không chỉ là cuối cùng, để sửa chữa vấn đề này.


```figure
lstm-gates
```

##  xây dựng nó
### 步骤 1: một bộ mã hóa

```python
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, src_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(src_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)

    def forward(self, src):
        e = self.embed(src)
        outputs, hidden = self.gru(e)
        return outputs, hidden
```

`outputs`hình dạng của `[batch, seq_len, hidden_dim]`Mỗi bước vào một trạng thái ẩn.`hidden`hình dạng của `[1, batch, hidden_dim]`Bài học 08 nói rằng chúng ta giữ lại trạng thái ẩn cuối cùng như là một vector ngữ cảnh,并忽略 mỗi bước của các kết quả.

### 步骤 2: một decoder

```python
class Decoder(nn.Module):
    def __init__(self, tgt_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(tgt_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab_size)

    def forward(self, token, hidden):
        e = self.embed(token)
        out, hidden = self.gru(e, hidden)
        logits = self.fc(out)
        return logits, hidden
```

Cài giải mã Mỗi lần sử dụng bước. 输入:一批单个 Token 和当前隐藏状态.输出: 下一个 Token 的词汇库 logits,以及更新后的隐藏状态.

### 步骤 3: vòng đào tạo với giáo viên buộc

```python
def train_batch(encoder, decoder, src, tgt, bos_id, optimizer, teacher_forcing_ratio=0.9):
    optimizer.zero_grad()
    _, hidden = encoder(src)
    batch_size, tgt_len = tgt.shape
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    loss = 0.0
    loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    for t in range(tgt_len):
        logits, hidden = decoder(input_token, hidden)
        step_loss = loss_fn(logits.squeeze(1), tgt[:, t])
        loss += step_loss
        use_teacher = torch.rand(1).item() < teacher_forcing_ratio
        if use_teacher:
            input_token = tgt[:, t].unsqueeze(1)
        else:
            input_token = logits.argmax(dim=-1)

    loss.backward()
    optimizer.step()
    return loss.item() / tgt_len
```

Hai cái đáng được đặt tên là:`ignore_index=0`会跳过填补代币 上的损失.`teacher_forcing_ratio`là mỗi bước sử dụng token thực thay vì mô hình dự đoán của tỷ lệ có thể xảy ra. Từ 1.0( hoàn toàn buộc giáo viên) bắt đầu, và trong quá trình đào tạo, tăng lên khoảng 0,5, để giảm khoảng cách thiên vị tiếp xúc.

### 步骤 4: vòng suy luận (cười tham)

```python
@torch.no_grad()
def greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50):
    _, hidden = encoder(src)
    batch_size = src.shape[0]
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    output_ids = []
    for _ in range(max_len):
        logits, hidden = decoder(input_token, hidden)
        next_token = logits.argmax(dim=-1)
        output_ids.append(next_token)
        input_token = next_token
        if (next_token == eos_id).all():
            break
    return torch.cat(output_ids, dim=1)
```

Việc mã hóa tham lam trong mỗi bước chọn tỷ lệ cược cao nhất của Token. Nó có thể đi ngược: một khi bạn đã hứa hẹn một Token, bạn không thể rút lại.**Beam search**Tôi sẽ giữ được...`k`个部分序列, và cuối cùng chọn điểm số cao nhất của chuỗi hoàn chỉnh.

### 步骤 5: nút thắt chai, được chứng minh

Trong bài tập sao chép đồ chơi 上训练模型: nguồn `[a, b, c, d, e]`, mục tiêu `[a, b, c, d, e]`                                                                                                                                                                                                                                                              

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个GRU ẩn trạng thái 无法无损记住 40-Token 输入―― thông tin tồn tại trong mỗi bước mã hóa, nhưng decoder chỉ nhìn thấy trạng thái cuối cùng―― chú ý 直接修复这一点――

## Sử dụng nó
PyTorch 提供 `nn.Transformer`Và dựa trên`nn.LSTM`                                                                                                                                                                                                                                                              `transformers`thư viện cung cấp các mô hình mã hóa-tài mã hóa hoàn chỉnh, chúng được đào tạo trên hàng tỷ token.

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

Các bộ mã hóa-chếch hóa hiện đại đã sử dụng các bộ biến đổi thay thế RNN── hình dạng cao cấp (có trình mã hóa, mã hóa, mã hóa, mã hóa) với giấy tiếp theo năm 2014 hoàn toàn giống nhau. Mỗi khối có cơ chế khác nhau.

### 什么时候仍然选择 RNN dựa trên seq2seq

Đối với các dự án mới, hầu như không bao giờ nên làm như vậy.

- Streaming dịch, cần có trong nội dung một lần tiêu thụ một nhập Token.
- Tạo văn bản trên thiết bị, chi phí lưu trữ của bộ chuyển đổi quá cao.
- Học... hiểu được nút thắt của mã hóa-đánh mã hóa, hiểu được những người biến đổi vì sao là cách nhanh nhất để chiến thắng.

### Bias tiếp xúc  và các phương pháp缓解

- **Scheduled sampling.**n học viên có tỷ lệ buộc trong quá trình đào tạo, để模型学会 phục hồi khỏi sai lầm của mình.
- **Minimum risk training.**Sử dụng điểm số BLEU không phải là điểm giao thông giao thông giao thông giao thông giao thông giao thông giao thông giao thông giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch
- **Reinforcement Learning fine-tuning.**用 метриc 奖励序列生成器──用于现代 LLM RLHF──

Điều này vẫn áp dụng cho việc tạo dựa trên biến đổi.

## 交付 nó
保存为 `outputs/prompt-seq2seq-design.md`- Có thể là:

```markdown
---
name: seq2seq-design
description: 为给定任务设计 sequence-to-sequence pipeline。
phase: 5
lesson: 09
---

给定任务（translation、summarization、paraphrase、question rewrite），输出：

1. 架构。默认使用 pretrained transformer encoder-decoder（BART、T5、mBART、NLLB）。RNN-based seq2seq 只适用于特定约束。
2. Starting checkpoint。命名它（`facebook/bart-base`、`google/flan-t5-base`、`facebook/nllb-200-distilled-600M`）。让 checkpoint 匹配任务和语言覆盖范围。
3. Decoding strategy。Greedy 用于 deterministic output，beam search（width 4-5）用于质量，带 temperature 的 sampling 用于多样性。用一句话说明理由。
4. 发布前要验证的一个 failure mode。Exposure bias 会表现为较长输出上的 generation drift；抽样 20 个位于 90th-percentile length 的输出并目检。

对于少于一百万 parallel examples 的情况，拒绝推荐从头训练 seq2seq。将任何面向用户内容却使用 greedy decoding 的 pipeline 标记为 fragile（greedy 会重复并陷入循环）。
```

## 练习
1. **Easy.**实现 đồ chơi sao chép nhiệm vụ. 在 mục tiêu等于 nguồn của input-output cặp 上训练 GRU seq2seq.
2. **Medium.**添加束宽 3 的束搜索解码──在小型平行体上对比贪心测量 BLEU──记录束搜索 胜出的地方(通常是最后几个代币) 以及它没有差异的地方──
3. **Hard.**Trong 10k cặp phân tích tập dữ liệu lên tinh chỉnh `facebook/bart-base`❖ So sánh đầu ra chùm-4 của mô hình tinh chỉnh với mô hình cơ bản trong đầu ra được giữ trên trên đầu ra.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder | Input RNN | 读取 source。产生 per-step hidden states 和最终 context Vector。 |
| Decoder | Output RNN | 从 context Vector 初始化。一次生成一个 target Token。 |
| Context vector | 摘要 | 最终 encoder hidden state。固定大小。Attention 要解决的 bottleneck。 |
| Teacher forcing | 使用真实 Token | 训练时喂入 ground-truth previous Token。稳定学习。 |
| Exposure bias | Train/test gap | 在真实 Token 上训练的模型，从未练习过从自身错误中恢复。 |
| Beam search | 更好的 decoding | 每一步保留 top-k partial sequences，而不是 greedy 地直接承诺。 |

## 延伸阅读
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) 原始 seq2seq giấy.
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078) 引入 GRU và khung mã hóa-đánh mã hóa.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Attention paper──读完本课后立刻阅读──
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 可构建的 seq2seq + Sự chú ý 代码──
