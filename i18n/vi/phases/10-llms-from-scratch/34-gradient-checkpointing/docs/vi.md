# Đánh giá độ và tính toán lại kích hoạt

> Backpropagation sẽ giữ lại mỗi giá trị kích hoạt trung gian. Trong các tham số 70B và 128K ngữ cảnh, giá trị kích hoạt của mỗi cấp độ có thể lên đến 3 TB.

**Type:** Build
**语言:**Python ((với đèn pin, tùy chọn)
**前置要求:**Giai đoạn 10 Bài học 04 (Pre-Training Mini-GPT), Giai đoạn 10 Bài học 05 (Scaling & Distributed)
**Time:** ~70 分钟

## 问题

训练变压器 会为每层保存后退 中需要求导的每op的输入:注意输入、Q/K/V投影、软max 输出、FFN 输入、规范 输出,以及残存流──对于隐藏的尺寸为`d`、 chiều dài chuỗi 为 `L`、đối với ∙`B`Một tầng, đó là khoảng mỗi tầng.`12 * B * L * d`个浮点数.

 Đối với `d=8192, L=8192, B=1`, trong BF16 下 là 800 MB / layer. Một mô hình 64 lớp có giá trị kích hoạt là 51 GB, nó cũng không nhân bằng kích thước microbatch, cũng không thêm trung gian chú ý-softmax (đối với mỗi đầu)`L^2`), còn không có kế hoạch vào các bản sao phụ song thoáng.

Đây là một phần mềm:BF16 trọng lượng cộng với trạng thái tối ưu hóa có thể được đặt vào 80GB, nhưng giá trị kích hoạt sẽ khiến bạn vượt ra ngoài giới hạn.

Khi thực hiện đơn giản, kiểm tra điểm mỗi bước sẽ tốn 33% FLOP vượt qua phía trước. Khi thực hiện tốt, tức theo lựa chọn thông minh của Korthikanti et al.

## 概念

### Trở lại  thực tế cần gì

`output = layer(input)`✿ Lại  muốn ✿`grad_input`和 `grad_params`Để tính toán chúng, nó cần:

- `input`(Được sử dụng trong tính toán trên mạng`grad_params = input.T @ grad_output`(văn)
- Một số số hoạt động dẫn số trung gian số lượng ((ReLU/GELU/softmax 的导数依赖激活值)

chuyển tiếp 会在 autograd đồ thị 中自动保存这些内容──每个 `tensor.retain_grad()`Và mỗi người cần nhập vào sẽ giữ một trích dẫn.

### 朴素 Đường kiểm soát đầy đủ

Tháo mạng ra`N`个段――前进 期间, chỉ lưu *input* của từng phân đoạn.

Example: 32 tầng biến đổi 拆 thành 32 个段, mỗi phân đoạn 1 层.

- Tưởng thức:32 个 lớp đầu vào ((小) đối với 32 *( mỗi khối lượng kích hoạt)
- 额外计算: mỗi phân đoạn 额外 1 lần tiến,也就是总向FLOPs 约增加33%(因为向后是向前的2x,完整步骤从1 + 2 = 3个单位变为1 + 1 + 2 = 4个单位) 

Đây là chương trình đầu tiên của Chen et al. 2016: mỗi `sqrt(L)`Layer đặt một điểm kiểm soát, để cân bằng bộ nhớ và tính toán. Đối với L=64, là 8 điểm kiểm soát.

### Địa chỉ chọn lọc (Korthikanti 2022)

Không phải tất cả các giá trị kích hoạt đều như vậy.`B*L*L*heads`,并随序列长度 *二次* 增长──FFN kích hoạt ẩn là `B*L*4d`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

Việc kiểm soát chọn lọc sẽ giữ lại giá trị hoạt động của dự trữ thấp (được tính toán theo quy mô tuyến tính), chỉ tính lại phần đắt tiền (đánh chú ý)  Bạn sử dụng rất ít FLOPs để tính toán lại, nhưng tiết kiệm được bộ nhớ (L^2) 

Megatron-Core sẽ thực hiện nó cho việc tính toán lại kích hoạt chọn lọc. Hầu hết các cuộc đào tạo biên giới 2024+ đều sử dụng nó.

### Thả tải

重新计算的替代方案: 在前进和后退之间把激活值传到CPU RAM──它需要PCIe带宽;当空带宽的收益高于重现化 成本时很有用──混合策略很常见: một số lớp kiểm soát, một số khác bị tải xuống──

FSDP2 sẽ tải xuống như một lựa chọn được cung cấp. Khi GPU được hạn chế bộ nhớ, nhưng chuyển giao CPU-GPU còn dư lượng, tải xuống biểu hiện rất tốt.

### Mô hình chi phí tính lại

Mỗi`k`Đường kiểm soát, một lần, tổng cộng.`L`层时, đơn giản kiểm soát điểm của từng bước FLOPs:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

Sử dụng kiểm tra chọn lọc, bạn chỉ tính lại hạt nhân chú ý, thay vì toàn bộ tầng:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Mô hình tiết kiệm trí nhớ

Mỗi khối lượng kích hoạt:`A` `L`层, tổng bộ nhớ kích hoạt:`L * A`

Điểm kiểm soát đầy đủ (với kích thước phân đoạn 1):只保存 `L * input_volume`(Đối với standard transformer 约为 `L * 1/10 A`❖节省约 `9 * L * A * 1/10`

Mỗi`k`Đường kiểm soát một lần: bảo tồn`L/k * A`, tái thêm vào phần hoạt động`k-1`层的量──

Khi đó`k = sqrt(L)`时, bộ nhớ và tính toán lại chi phí theo`sqrt(L)`缩放, đây là cân bằng tốt nhất của các lớp chi phí đồng nhất.

### 什么时候不该 检查站

- giai đoạn đường ống ở giữa các tầng bên trong của chuyến bay đã được hoàn thành.
- Nếu lớp đầu tiên và cuối cùng chủ yếu dẫn đầu tính toán của giai đoạn này, thì không cần kiểm tra chúng.
- 已使用 FlashAttention's attention kernels:Flash 已会快速重新计算 softmax, do đó, kiểm tra cấp độ lớp bổ sung 叠加收益很小──

### Các mẫu thực hiện

1. **Function wrapper：**用 `torch.utils.checkpoint.checkpoint(fn, input)`包裹一个段子――PyTorch chỉ để giữ `input`, trong thời gian trở lại tính lại tất cả mọi nội dung khác.

2. **Decorator-based：**Để đánh dấu các lớp như checkpoint; huấn luyện viên trong thời gian cấu hình quyết định những phân đoạn nào được đóng gói.

3. **Manual explicit recompute：**tự编写 ngược đi,调用自定义的 `recompute_forward`, Using save's input  sao chép tiếp tục

三者给出的功能结果 相同── wrappers là tiêu chuẩn quen thuộc sử dụng法──

### Đối tác với TP / PP / FP8

- **Tensor parallel：**Các đầu vào điểm kiểm soát trong việc tính lại phải được thu thập hoặc giải cứu; cần phải xử lý chi phí truyền thông.
- **Pipeline parallel：**Mô hình điển hình là điểm kiểm soát từng giai đoạn đường ống dẫn, để các microbacch có thể sử dụng lại bộ nhớ kích hoạt.
- **FP8 recompute：**tính lại lịch sử amax trong thời gian cập nhật phải phù hợp với các lịch sử trước, nếu không thì FP8 quy mô 会漂移── hầu hết các khung sẽ có quy mô chụp ảnh ngắn gọn──


```figure
activation-recompute
```

##  xây dựng nó

### 步骤 1:带 Segments của Mô hình đồ chơi

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### 步骤 2: cần tất cả các hoạt động của đơn giản Lại

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 步骤 3: Checkpoint-Tất cả bộ nhớ

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤 4:Mô hình chi phí

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤 5: Memory Estimator

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### 步骤 6: Kích thước phân đoạn tối ưu

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤 7: Quyết định kiểm soát chọn lọc

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## Sử dụng nó

- **torch.utils.checkpoint**- Có thể là:`from torch.utils.checkpoint import checkpoint`,PyTorch 中的规范包装──它包裹一个函数; chỉ lưu输入, và 后期重新计算──
- **Megatron-Core activation recomputation**:支持 `selective``full`和 `block`Các phương pháp: là các phương pháp chuẩn mực của đào tạo biên giới 2024+.
- **FSDP2 offload**: FSDP2 中中 `module.to_empty(device="cpu")`配合 `offload_policy`, sẽ đưa các kích hoạt phân mảnh đến CPU, thay vì tính lại.
- **DeepSpeed ZeRO-Offload**: được sử dụng cho các trạng thái tối ưu hóa và kích hoạt của CPU, với kiểm tra điểm 互补──

## 交付 nó

本课会产出 `outputs/prompt-activation-recompute-policy.md`, đây là một lời nhắc: nó nhận cấu hình mô hình của bạn (với bộ nhớ GPU có sẵn) và chính sách tính toán lại từng cấp không có / chọn lọc / đầy đủ / tải xuống)

## 练习

1. 验证正确性──运行 `model_forward`+ `model_backward`(Tình thức kích hoạt hoàn chỉnh) đối với`model_forward_checkpointed`+ `model_backward_checkpointed`(các phân đoạn)  Các gradient tham số phải có độ chính xác máy

2. 扫描 kích thước phân đoạn `k`, từ 1 đến `L`❖ vẽ FLOP trên đầu và trí nhớ ❖ tìm đường cong ❖

3. 实现选择性检查点:保存注意模块输入,但不保存其中间量── đối với seq=8192 của 32 tầng mô hình,测量 đối với FLOP trênhead của toàn tầng kiểm soát点──

4. 添加脱载──把段输入 保存到一个模拟的 CPU缓冲(一个单独的列表)──将 PCIe băng thông作为字节/时间测量,并找出脱载与重计算之间的破解点──

5. Benchmark Một biến thể PyTorch thực sự,分别使用和不使用 `torch.utils.checkpoint`△测量 bộ nhớ`torch.cuda.max_memory_allocated`(với thời gian bước).

## 关键术语
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- ban đầu được hình thức hóa các điểm kiểm soát gradient
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- tính toán lại hoạt động chọn lọc và phân tích chi phí hình thức hóa
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)-- 通过逆模式重现实现的另一种常态记忆方法
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- quy mô dưới kích hoạt tải xuống
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准 API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)-- chọn lọc 、full 和 block mode
