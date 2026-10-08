# Sử dụng văn bản CNN và RNN

> Chuyển đổi Học n-grams. Chuyển đổi 负责记忆.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 3 · 11 (PyTorch 入门), Giai đoạn 5 · 03 (Thiết nhập từ), Giai đoạn 4 · 02 (Tình chuyển từ đầu)
**Time:** ~75 分钟

## 问题

TF-IDF và Word2Vec tạo ra là các hàm 平 vector của từ ngữ 忽略序.`dog bites man`和 `man bites dog`                                                                                                                                                                                                                                                              

Trước khi các biến đổi đến, có hai loại kiến trúc đã lấp đầy khoảng trống này.

**用于文本的 Convolutional nets（TextCNN）。**Trong các chuỗi nhúng từ Ứng dụng biến dạng 1D。 bộ lọc chiều rộng 3 là một bộ cảm biến hình ba có thể học được: nó vượt qua ba từ và xuất ra một số lượng phân số。 chồng lên với chiều rộng khác nhau(2、3、4、5) để kiểm tra mô hình đa chiều。Max-pool đến biểu hiện cố định kích thước。平、并行、快速。

**Recurrent nets（RNN、LSTM、GRU）。**Một lần xử lý một token,维护携带信息向前传播的隐藏状态──序列、带记忆、支持灵活输入长度──它们在2014到2017年主导序列建模, sau đó sự chú ý xuất hiện──

Bài học này sẽ xây dựng hai, sau đó chỉ ra thúc đẩy sự chú ý đến các điểm thất bại xuất hiện.

## 概念

**TextCNN**(Kim, 2014) ・ Tokens 会被嵌入──宽度为 `k`của 1D convolution trong liên tục `k`-grams của embedments 上滑动 filter, tạo ra bản đồ tính năng. 对该 bản đồ thực hiện toàn cầu max-pooling 会选出最强的激活.

Tại sao có hiệu quả. Một bộ lọc là một n-gram có thể học được. Max-pooling là không thay đổi vị trí, vì vậy "không tốt" trong các bình luận đầu hoặc giữa sẽ kích hoạt cùng một tính năng.

**RNN。**Trong mỗi bước thời gian `t`, trạng thái ẩn`h_t = f(W * x_t + U * h_{t-1} + b)`                                                                                                                                                                                                                                                              `W``U``b` Thời gian `T`Trong khi đó, các loại hình này được phân loại là:`h_1 ... h_T`上做 pooling ((max、mean hoặc cuối cùng)

RNN đơn giản sẽ bị biến mất gradient.**LSTM**增加门来决定忘记什么,储存什么,输出什么,从而稳定长序列中的梯度.**GRU**Lần đầu tiên, các công cụ này được phân tích với các công cụ khác nhau.

**Bidirectional RNNs**Một RNN đang tiến hành, một khác ngược tiến hành, sau đó đính kèm các trạng thái ẩn── mỗi biểu tượng của biểu tượng đều có thể nhìn thấy cả hai phía bên trái của ngữ cảnh── đối với các nhiệm vụ gắn thẻ 至关重要──


```figure
rnn-unroll
```

##  xây dựng nó

### 步骤 1: PyTorch 中的 TextCNN

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, n_classes, filter_widths=(2, 3, 4), n_filters=64, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, n_filters, kernel_size=k)
            for k in filter_widths
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids).transpose(1, 2)
        pooled = []
        for conv in self.convs:
            c = F.relu(conv(x))
            p = F.max_pool1d(c, c.size(2)).squeeze(2)
            pooled.append(p)
        h = torch.cat(pooled, dim=1)
        return self.fc(self.dropout(h))
```

`transpose(1, 2)`sẽ`[batch, seq_len, embed_dim]`变形为 `[batch, embed_dim, seq_len]`Vì`nn.Conv1d`会把中间轴当作频道──无论输入长度如何,合集输出都是固定大小──

### 步骤 2: Kỷ lệ phân loại LSTM

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_classes, bidirectional=True, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=bidirectional)
        factor = 2 if bidirectional else 1
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * factor, n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids)
        out, _ = self.lstm(x)
        pooled = out.max(dim=1).values
        return self.fc(self.dropout(pooled))
```

Trong chuỗi làm max-pool, chứ không phải là pool trạng thái cuối cùng. Đối với phân loại, max-pooling thường so sánh với trạng thái ẩn cuối cùng, tốt hơn, vì thông tin cuối chuỗi dài thường sẽ thống trị trạng thái cuối cùng.

### 步骤 3: biến mất gradient 演示(直觉)

Không có cửa ngõ của đơn giản RNN không thể học phụ thuộc tầm xa.`A`Có phải đã xuất hiện ở bất kỳ vị trí nào trong chuỗi.`A`Trong khi độ dài của chuỗi là 100 token, thì gradient mất mát phải đi qua trọng lượng lặp lại 99 lần để truyền lại. Nếu trọng lượng nhỏ hơn 1, gradient sẽ biến mất. Nếu lớn hơn 1, nó sẽ nổ.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

LSTMs  thông qua **cell state** sửa chữa vấn đề này: nó chỉ có cách tương tác gia tăng qua mạng. ]] Lửa cổng sẽ được thu nhỏ bằng cách nhân, nhưng các gradient vẫn có thể di chuyển dọc theo "máy cao tốc" (GRU sử dụng ít hơn các tham số để làm những điều tương tự.

### Bước 4: Tại sao nó vẫn chưa đủ

Ngay cả khi có LSTM, ba vấn đề vẫn còn tồn tại.

1. **Sequential bottleneck。**Trong dài dài dài 1000 bước, RNN cần 1000 bước tiến/lái lại. Không thể theo chiều dài của thời gian.
2. **Encoder-decoder setups 中的固定大小 context vector。**Bộ giải mã chỉ có thể nhìn thấy trạng thái ẩn cuối cùng của bộ giải mã, trong khi nó nén toàn bộ nhập nhập.
3. **Distant-dependency accuracy ceiling。**LSTMs  tốt hơn RNN đơn giản, nhưng vẫn khó vượt qua 200+ bước  truyền thông cụ thể.

Cảnh sát giải quyết ba vấn đề này. Các biến thể hoàn toàn loại bỏ sự tái phát. Bài học 10 là điểm chuyển đổi.

## Sử dụng nó

PyTorch của `nn.LSTM``nn.GRU`和 `nn.Conv1d`已生产准备──训练代码是标准的──

Hugging Face  cung cấp các nhúng sẵn, bạn có thể đưa chúng vào như là lớp đầu vào:

```python
from transformers import AutoModel

encoder = AutoModel.from_pretrained("bert-base-uncased")
for param in encoder.parameters():
    param.requires_grad = False


class BertCNN(nn.Module):
    def __init__(self, n_classes, filter_widths=(2, 3, 4), n_filters=64):
        super().__init__()
        self.encoder = encoder
        self.convs = nn.ModuleList([nn.Conv1d(768, n_filters, kernel_size=k) for k in filter_widths])
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, input_ids, attention_mask):
        with torch.no_grad():
            out = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        x = out.transpose(1, 2)
        pooled = [F.max_pool1d(F.relu(conv(x)), kernel_size=conv(x).size(2)).squeeze(2) for conv in self.convs]
        return self.fc(torch.cat(pooled, dim=1))
```

适用约束 kiểm tra danh sách

- **Edge / on-device inference。**带 GloVe Embeddings of TextCNN 比变压器 小 10-100x── Nếu mục tiêu triển khai của bạn là điện thoại, đây là đống cần sử dụng──
- **Streaming / online classification。**RNN một lần xử lý một token; các nhà biến đổi  cần toàn bộ bộ bộ ⋅ đối với thực thời gian输入文本, LSTMs  vẫn thắng ⋅
- **用于 baselines 的 tiny models。**Trong nhiệm vụ mới, nhanh chóng thay đổi. Trong CPU, 5 phút tập một TextCNN.
- **有限数据下的 Sequence labeling。**BiLSTM-CRF (đọc 06) Đối với 1k-10k 标注句子的NER, vẫn là kiến trúc cấp sản xuất.

Mọi thứ khác đều được chuyển đổi.

## 交付 nó

保存为 `outputs/prompt-text-encoder-picker.md`- Có thể là:

```markdown
---
name: text-encoder-picker
description: Pick a text encoder architecture for a given constraint set.
phase: 5
lesson: 08
---

Given constraints (task, data volume, latency budget, deploy target, compute budget), output:

1. Encoder architecture: TextCNN, BiLSTM, BiLSTM-CRF, transformer fine-tune, or "use a pretrained transformer as a frozen encoder + small head".
2. Embedding input: random init, GloVe / fastText frozen, or contextualized transformer embeddings.
3. Training recipe in 5 lines: optimizer, learning rate, batch size, epochs, regularization.
4. One monitoring signal. For RNN/CNN models: attention mechanism absence means they miss long-range deps; check per-length accuracy. For transformers: fine-tuning collapse if LR too high; check train loss.

Refuse to recommend fine-tuning a transformer when data is under ~500 labeled examples without showing that a TextCNN / BiLSTM baseline has plateaued. Flag edge deployment as needing architecture-before-everything.
```

## 练习

1. **Easy。**Trong một tập dữ liệu đồ chơi 3 lớp 上训练 TextCNN(你自己发明数据) ――验证 过宽度(2、3、4) của trung bình F1 优于单一宽度(3)。
2. **Medium。**Để phân loại LSTM 实现 max-pool、mean-pool 和 cuối cùng-state pooling──在一个小数据集上比较;记录哪种pooling 获胜,并假设原因──
3. **Hard。**构建 BiLSTM-CRF NER tagger(结合课06 和本课) ――在 CoNLL-2003 上训练――与课06 的CRF-单独基线以及BERT细调比较――报告训练时间、记忆 和 F1――

## 关键术语
| Term | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| TextCNN | 用于文本的 CNN | 在 word embeddings 上堆叠 1D convolutions，并使用 global max-pool。Kim (2014)。 |
| RNN | Recurrent net | 在每个 time step 更新 hidden state：`h_t = f(W x_t + U h_{t-1})`。 |
| LSTM | Gated RNN | 增加 input / forget / output gates + 一个 cell state。能在长序列中稳定训练。 |
| GRU | 更简单的 LSTM | 两个 gates 而不是三个。准确率相近，参数更少。 |
| Bidirectional | 两个方向 | Forward + backward RNN 拼接。每个 token 都能看到其 context 的两侧。 |
| Vanishing gradient | 训练信号消失 | Plain RNNs 中反复乘以 <1 的 weights，会让早期 step 的 gradients 实际上变为零。 |

## 延伸阅读
- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) TextCNN 论文──八页──可读──
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) LSTM 论文──出乎意料地清晰──
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) 让LSTMs trở nên dễ hiểu cho tất cả mọi người.
