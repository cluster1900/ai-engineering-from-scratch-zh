# Native Sparse Attention (Dân sâu tìm NSA)

> Trong 64k Token, Attention sẽ ngâm 70-80% decode 延迟. Mỗi mô hình mở 实验室 có các chương trình sửa chữa nó. DeepSeek của NSA (ACL 2025) là chương trình thực sự đứng vững.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## Học mục tiêu

- Nói ra ba chi nhánh của NSA, và mỗi chi nhánh bắt được thông tin gì.
- Giải thích tại sao NSA là một cách tự nhiên có thể đào tạo, trong khi phương pháp chú ý ít trước đây chỉ có thể được sử dụng để suy luận.
- Trong bối cảnh 64k, theo kích thước khối nén và lựa chọn top-k, tính toán NSA tương đương với sự chú ý đầy đủ
- Trong một chuỗi tổng hợp ngắn, sử dụng stdlib Python 实现三分支组合,并验证 gating weights.

## 问题

序列长度为 N 时,Full attention 的时间成本是 `O(N^2)`, mỗi tầng KV cache là `O(N)`▽ 在 64k Token 下,计算和存储带宽 数字都非常灾难──NSA 论文中的理论估计测量值显示: 在 64k 下,注意 占总解码 延迟的 70-80%──后续所有指标,包括 TTFT、tokens/sec、每百万 Token 成本,都被注意 成本主导──

Sự ít sự chú ý là một câu trả lời rõ ràng. Trước đây, sự cố gắng phân chia lớn thành hai loại. Sự ít có thể cố định được cố định được cố định bởi một mô hình, vì mô hình không bao giờ được yêu cầu thông qua mô hình ít thông tin.

Native Sparse Attention(Yuan et al., DeepSeek + PKU + UW, ACL 2025 best paper, arXiv:2502.11089) 两者兼具:模型在预训期间学习的稀缺模式,以及一个内核一致的算法实现,使它在推断时真正交付计算节省──两年后,NSA 或其直接后方案将成为每个边界长文本模型的默认注意──

## 概念

### 3 bộ phận

Đối với mỗi truy vấn, NSA sẽ nhắm vào bộ nhớ cache KV

1. **Compressed branch.**Địa chỉ 被分组为大小为 `l`Các khối thường là 32 hoặc 64) ⋅ mỗi khối ⋅ thông qua một MLP nhỏ được học tập ⋅ được nén thành một token tổng kết đơn lẻ ⋅ truy vấn sẽ tham dự vào các token nén này, để có được toàn bộ chuỗi của ⋅

2. **Selected branch.**Sử dụng điểm chú ý của chi nhánh nén, nhận dạng xuất hiện với truy vấn hiện tại, xem các khối trên cùng của các khối này.

3. **Sliding-window branch.**truy vấn sẽ tham dự đến gần nhất `W`个 Token (thường là 512), được sử dụng trong bối cảnh địa phương.

三分支的输出通过学习按位置门组合:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win`là truy vấn trên của các MLP nhỏ  tạo ra trọng lượng cổng.

### Tại sao nó có thể được đào tạo?

选择步骤 ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  () )  () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () () (

NSA đã lật ngược điểm này: tập trung phân khúc nén Bản thân nó là tác động đến toàn bộ chuỗi có thể nhỏ gọn phân khúc chú ý.`top_k`操作在前向计算图 上是无运, nó chỉ kiểm soát những khối nào sẽ được tải từ内存.

Đó là lý do NSA có thể sử dụng từ đầu đến cuối để đào tạo trước.

### Bộ hạt nhân được sắp xếp với phần cứng

NCA của hạt nhân là cho hiện đại GPU bộ nhớ hierarchy 设计的──kernel 按 GQA nhóm 加载查询(buo bên ngoài), cho mỗi nhóm 获取应对稀少的 KV khối(buo bên trong), và trên SRAM 上运行 注意──由于每个查询组 看到相同的选择块──选择是 per query-group,而不是 per query-head,KV 加载会在组内摊销──算术强度维持在较高水平──

论文报告称,Triton kernels 在 64k decode 上比 FlashAttention 快 9x,并且速度率 会随序列长度增长──前进和后进 kernels 均已提供──

### 计算预算

Làm cho`N`为序列长度,`l`Với kích thước khối nén,`k`Vì số lượng lựa chọn top-k,`w`Vì cửa sổ trượt,`b`Vì kích thước khối được chọn thường bằng `l`(■)

- Lớp sập: mỗi truy vấn có`O(N/l)`个 chìa khóa, do đó tổng计 `O(N * N / l)`
- Nh chọn chi nhánh: mỗi truy vấn có `O(k * b)`个 chìa khóa, do đó tổng计 `O(N * k * b)`
- Lớp trượt: mọi câu hỏi có`O(w)`个 chìa khóa, do đó tổng计 `O(N * w)`

总计:`O(N * (N/l + k*b + w))`

Khi đó`N = 64k, l = 64, k = 16, b = 64, w = 512`: mỗi truy vấn của chi phí`1000 + 1024 + 512 = 2536 keys`❖ Cẩn thận`64000 keys`◊ Số lượng giảm 25x♦

Khi đó`N = 128k, l = 64, k = 16, b = 64, w = 512`: mỗi truy vấn của chi phí`2000 + 1024 + 512 = 3536 keys`❖ Cẩn thận`128000 keys`❖ giảm 36x♦ lợi ích tăng theo chuỗi độ dài, đó chính là ý nghĩa cốt lõi của nó♦

### Làm thế nào để so sánh

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA(Moonshot, arXiv:2502.13189) cùng期发布, cũng đã áp dụng tương tự như三个胜过一个的思路, sẽ MoE 原则应用到注意区块──NSA 和 MoBA 是理解2026 long-context pre-training 必须掌握的两个架构──


```figure
sliding-window-attention
```

##  xây dựng nó

`code/main.py`Trong một chuỗi tổng hợp ngắn thực hiện ba chi tiết,并 hiển thị:

- compression MLP (để dạy rõ ràng, sử dụng một đường cơ sở trung bình đơn giản; thực tế NSA sử dụng MLP học)
- Từ điểm số của các nhánh nén 驱动的顶-k块选择――
- Gần đây`w`个Thoccon 上的 trượt cửa sổ chú ý.
- Kết hợp được khóa.
- Hãy chú ý đến việc in số tính toán so với các bài viết khác.

### 步骤 1: Took mã hóa thành khối

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 步骤 2: Nhánh nén

运行 truy vấn 针对键压缩的软max Attention──compressed-branch scores 同时作为顶级k选择的信号──

### 步骤 3: chọn khối top-k

 chọn điểm số cao nhất `k`个压缩块的索引──加载这些块 中的原始未压缩代币,并运行在上面 注意──

### 步骤 4: cửa sổ trượt

取最后 `w`个Token,并针对它们运行标准注意.

### 步骤 5: cổng + kết hợp

truy vấn 上的小型 MLP 产生三个门权量――最终输出是三个分支输出的权重总量――

### 步骤 6: tính toán

印每分支、每次查询参加的键 数量以及总数──与 `N`(full attention) để so sánh.`l = 32, k = 4, w = 128`,NSA , mỗi câu hỏi xem`32 + 128 + 128 = 288`个 chìa khóa, và sự chú ý là 1024, giảm 3,5x.

## Sử dụng nó

NSA đang đang tìm kiếm sâu  đường ống đào tạo dài của riêng mình 中使用──截至 2026 年 4 月,

- **DeepSeek internal**:native, đã phát hành quyền重使用 NSA hoặc sau đó DSA (Deepseek Sparse Attention)
- **vLLM**: đang phát triển hỗ trợ NSA thí nghiệm cho trọng lượng DeepSeek-V3.x
- **SGLang**: đã xuất bản các tiêu chuẩn của NSA; đường sản xuất theo dõi vLLM。
- **llama.cpp / CPU**: không hỗ trợ; trong CPU thông qua, phân hủy lõi không có giá trị.

什么时候使用 NSA:

- 面向64k+ ngữ cảnh, và có một ngân sách tính toán nghiêm ngặt của đào tạo trước hoặc tiếp tục đào tạo chạy.
- Đối với DeepSeek  các điểm kiểm soát trong bối cảnh dài của riêng mình  đưa ra suy luận 👇

什么时候不要使用:

- phục vụ 现有密集注意预训模型──没有持续培训,无法后装 NSA──
- Context 低于 16k──三分支开销会超过省收益──
- Batch-1 chat tương tác. Khóa giải nhạy cảm với độ trễ sẽ được hưởng lợi, nhưng chỉ được thành lập trong bối cảnh dài.

## 交付 nó

本课会产出 `outputs/skill-nsa-integrator.md` Đưa ra một quy định trước khi chạy đào tạo trong bối cảnh dài, nó sẽ tạo ra một kế hoạch tích hợp NSA: kích thước khối nén, cửa sổ trượt, chiều rộng MLP cổng, lựa chọn lõi, cũng như để chứng minh cấu trúc biến thành hợp lý hơn các đánh giá ngữ cảnh dài cụ thể.

## 练习

1. Trong 1024-Token  tổng hợp chuỗi trên chạy`code/main.py` Trong ba cài đặt trước `(l, k, w)`并打印计算 số lượng. Tìm ra trong test kim cáp trong đống cỏ. 上保持对全关注 95% remembering同时, mỗi truy vấn khóa số lượng tối thiểu của cài đặt trước.

2. Để thay thế cho một máy nén trung bình được học MLP nhỏ ((2-layer, hidden 32) ⋅ trong một tín hiệu là khối 平均值的合成任务上训练它──测量它在保持的数据上相对于平均池基线的困难差距──

3. 实现 gate MLP── nó được dùng để truy vấn 作为输入,输出三个 scalars──显示 gate 的行为是合理的: 在随机查询上接近均权重; 当查询命中远前的块时,给选择分支 给出较高权重──

4. 计算 NSA-Enabled 70B 模型 trong bối cảnh 128k 下的 KV cache memory budget──KV heads 为 8,head dim 为 128,BF16──与全注意以及 MLA(Phase 10 · 14 显示 MLA 的数字) để so sánh── tìm ra KV cache hạt mỏng của NSA 等到全注意序列长度──

5. 阅读 NSA 论文(arXiv:2502.11089) 第 4 节,并用三句话解释为什么压缩分支的注意分会被重复用于顶级选项,而不是计算一个单独的路由分分――将答案关联到渐进流――

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | “粗粒度视图” | 在 block-averaged keys 上做 Attention，以每个 query `O(N/l)` 个 keys 提供 global context |
| Selected branch | “Top-k blocks” | 在 compressed-branch scores 最高的 `k` 个 blocks 上做细粒度 Attention |
| Sliding window | “Local context” | 在最后 `W` 个 Token 上做 Attention，以捕获短程模式 |
| Native trainability | “打开 sparsity 进行 pre-train” | sparsity pattern 在 pre-training 期间学习，而不是在 inference 时外挂 |
| Compression block size l | “粗粒度视图的 group size” | 多少个 Token 被合并成一个 summary；通常为 32-64 |
| Top-k | “要保留的 blocks” | 读取其未压缩 Token 的 compressed blocks 数量；通常为 16 |
| Sliding window W | “Local attention radius” | 通常为 512；更短会损害 local coherence，更长会浪费计算 |
| Branch gate | “如何混合三个分支” | per-position MLP 输出，对三个分支的贡献加权 |
| Hardware alignment | “Kernel-friendly sparsity” | 选择 sparse pattern，使实际 GPU kernel 能达到理论 speedup |
| DSA | “NSA 的后继者” | Deepseek Sparse Attention，DeepSeek 系谱中继 NSA 之后的架构 |

## 延伸阅读

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) 论文
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437)NSA 面向的架构家族
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) 同期工作, hướng tới các khối
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) cửa sổ trượt 起源
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453)NSA 改进的推理时间稀缺度基线
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691) NSA hạt nhân trong 64k hạ đánh bại toàn bộ sự chú ý cơ sở
