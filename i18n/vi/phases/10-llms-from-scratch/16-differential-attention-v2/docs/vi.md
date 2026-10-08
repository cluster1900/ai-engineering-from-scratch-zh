# Sự chú ý khác nhau (V2)

> Softmax Attention 会在每个不匹配的代币上分散少量概率. 在 100k 个代币上,这些噪音会积累并淹没信号.  Differential Transformer(Ye et al., ICLR 2025) thông qua sẽ Attention 计算为两个 softmax 的差来解决这个问题,从而减去共享噪音的下限.

**类型:**构建
**语言:**Python (stdlib)
**前置要求:**Giai đoạn 7 · 02 (tự quan tâm), Giai đoạn 7 · 15 (những biến thể chú ý), Giai đoạn 10 · 14 (giải hành kiến trúc)
**时间:**~ 60 phút

## Học mục tiêu

- 准确说明 tại sao softmax Sự chú ý  tồn tại giới hạn âm thanh thấp, cũng như tại sao nó sẽ tăng theo chiều dài của ngữ cảnh 
- 推导 sự chú ý khác biệt 公式,并解释为什么相减会抵消共享噪音成分,同时保留信号──
- Sự khác biệt giữa V1 và V2: những phần nào nhanh hơn, đơn giản hơn, ổn định hơn, và tại sao mỗi thay đổi về trình độ sản xuất trước đào tạo là cần thiết.
- Sử dụng Python tinh khiết từ zero để thực hiện sự chú ý khác biệt, và tạo ra một truy vấn tín hiệu cộng tiếng ồn trên thực nghiệm chứng minh tính năng抵消 tiếng ồn.

## 问题

标准 softmax Sự chú ý có một tính chất toán học, trong quy mô thay đổi lớn sẽ trở thành các rắc rối kỹ thuật.`q`, chú ý 权重是 `softmax(qK^T / sqrt(d))` Softmax 永远无法产生精确的零值 每个不匹配的代币都会得到一些正质量──这个残余质量就是噪音,并且会随着背景长度扩大── 在128k 个代币下,即使每个不匹配的代币只获得0.001%的概率,127,999 个代币 合并也会贡献约12%的总量──模型必须学会绕开一个随着背景 增长的噪音下限度──

Trong thực tế, biểu hiện này là để chú ý đầu 干扰:long-context RAG trong 幻觉引用、100k-Token 检索任务中的 lost-in-the-middle 失败, cũng như kim ngạch-in-haystack benchmark trong hơn 32k 后出现细微精度下降.

DIFF V1 có ba vấn đề, khiến nó không thể vào đường ống dẫn đào tạo trước tiên. Kho lưu giá trị của nó trong mỗi bước giải mã đều phải tải hai lần, nó cần các hạt nhân CUDA tùy chỉnh, phá hủy FlashAttention 兼容性, và RMSNorm mỗi người của nó trong các cuộc đào tạo dài hơn 70B sẽ dẫn đến sự không ổn định.

## 核心概念

### Softmax của tiếng ồn

对于查询 `q`和 chìa khóa `K = [k_1, ..., k_N]`,Cảnh sát 权重是:

```
w_i = exp(q . k_i / sqrt(d)) / sum_j exp(q . k_j / sqrt(d))
```

Không có gì cả.`w_i`Sẽ là không. Nếu.`k_i`Với`q`完全无关, điểm số `q . k_i`Nó sẽ xoay quanh 0波动, khác nhau.`||q||^2 / d`△ Gần thông qua bình thường hóa softmax 后, mỗi Token 仍将向加权和贡献 `O(1/N)`△无关 Token 的总贡献是 `O((N-1)/N) = O(1)`Đây không phải là một số nhỏ.

模型想要的更像是硬顶-k: 在匹配代币上给高权重, 在其他位置接近零──软max 过于平滑,无法直接做到这一点──

### Sự khác biệt 思路

Để phân chia các dự đoán của mỗi đầu của Q và K thành hai phần: Q = (Q_1, Q_2), K = (K_1, K_2)。 tính toán hai bản đồ chú ý:

```
A_1 = softmax(Q_1 K_1^T / sqrt(d))
A_2 = softmax(Q_2 K_2^T / sqrt(d))
```

输出:

```
DiffAttn = (A_1 - lambda * A_2) V
```

相减会抵消两个地图 共享的任何噪音分布―― Nếu hai地图在127,000 无关代币上有近似均重权 (确实如此) 随机初始化时),这些部分会抵消彼此――信号少数真正相关代币上的尖峰权重只有在两个地图中出现相同幅度时才会抵消,而模型训练后不会保持这种状态――

`lambda`Mỗi đầu có một số lượng có thể học được, được số hóa thành`lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init` Nó có thể là một thứ xấu.`lambda_init`默认是类似 0.8 的小正数──

### Tại sao nó giống như đầu của tiếng ồn抵消

Có thể hình dung nó như hai máy đánh âm có tiếng ồn trong cùng một âm thanh. Cả hai đều ghi âm người nói và tiếng ồn bối cảnh liên quan. Từ một tín hiệu trừ đi tín hiệu khác, tiếng ồn chia sẻ sẽ giảm.`lambda`Học được là sự cân bằng như thế này.

### V1 vs V2:差异

V1 giữ các tham số tương tự như Transformer cơ bản. Để làm cho mỗi đầu có hai truy vấn, nó sẽ làm giảm kích thước đầu một nửa. Điều này đã làm giảm khả năng biểu hiện của đầu, đau hơn nữa, cũng làm cho mỗi đầu có giá trị cache giảm một nửa.

V2 sẽ truy vấn đầu số lượng tăng gấp đôi,并 giữ đầu KV 不变( Từ dự án lên 借用参数) ――Cái chiều 保持与基线相同──相减后,额外维度将被投影回去,以匹配基线变压器的O_W投影──三件事同时发生:

1. Tốc độ giải mã với đường cơ bản 持平(KV cache chỉ tải một lần)
2. FlashAttention 可原样运行(không cần lõi tùy chỉnh)。
3. Tự động tính toán của decode 时 提高(每次从HBM加载字节 时对应更多计算)

V2 cũng di chuyển V1 để ổn định và giảm hoạt động của mỗi người RMSNorm.

### Làm gì để sử dụng nó

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | 更干净的 Attention maps，更少幻觉引用 |
| Needle-in-haystack benchmarks | 32k 之后 accuracy 显著提升 |
| Multi-document QA | 更少跨文档干扰 |
| Code completion at 8k | 收益有限，不值得改变 architecture |
| Short chat (< 4k) | 基本与 baseline 不可区分 |

收益会随着背景长度 增长而增加──在4k Token 下,噪音下限足够小,标准注意 已可用──在128k 下, nó sẽ bắt đầu gây tổn hại rõ ràng.

### Nó sẽ được kết hợp với các nút 2026 khác

| Feature | Compatible with DIFF V2? |
|---------|------------------------|
| GQA | 是（V2 增加 Q heads，而不是 KV heads） |
| MLA (DeepSeek) | 原则上是，但尚无公开论文将二者结合 |
| MoE | 是（Attention 独立于 MLP block） |
| RoPE | 是（不变） |
| YaRN / long-context scaling | 是（正是 DIFF 最有帮助的场景） |
| FlashAttention | 是，V2 支持（V1 不支持） |
| Speculative decoding | 是（Attention 改动对 spec-decode loop 不可见） |


```figure
differential-attention
```

##  xây dựng nó

`code/main.py`Sử dụng Python 实现 sự chú ý khác biệt  Một truy vấn đồ chơi có cấu trúc tín hiệu cộng tiếng ồn đã biết, có thể giúp bạn đo lường trực tiếp tỷ lệ giảm tiếng ồn 

### 步骤 1: sự chú ý softmax tiêu chuẩn

Stdlib Matrix ops: danh sách danh sách, viết tay, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi lại, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, ghi nhận, và ghi nhận, và ghi nhận,

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### Bước 2: chia Q 、K  into two halves

V1 风格:将头寸 减半──V2 风格: giữ chiều đầu,并将头数量加倍──toy thực hiện 为了教学清晰使用 V1数学完全相同,只有会计不同──

### 步骤 3: 2 nhánh mềmmax + 相减

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

Lưu ý: đầu ra trọng lượng có thể được chuyển đổi sang tiêu cực. Không có vấn đề gì.

### 步骤 4: 噪音抵消测量

构建一个长度为 1024的合成序列――将信号标志 放置已知位置,其余位置填充噪声――计算 (a) 标准软max 注意重量在信号位置上的权重,以及 (b) 权重的差别注意量 权重――测量两者的信号-噪音比――根据两支训练到多大程度产生差异,DIFF注意力通常能稳定产生高出3x-10x的信号-噪音比――

### 步骤 5: V1 vs V2 参数核算

给定一个配置 ((隐藏=4096,头=32,头=128),打印:

- Đổi biến cơ bản: Q、K、V Vỳ tự lớn`hidden * hidden`, MLP vì 4 * ẩn
- DIFF V1:Q、K khác nhau`hidden * hidden`, V lớn vì`hidden * hidden`(不变), đầu mờ trong bên trong giảm nửa.`lambda`参数(O( đầu * d_head))
- DIFF V2:Q`2 * hidden * hidden`, K, lớn hơn`hidden * hidden`, V lớn vì`hidden * hidden`◊ thêm dimension sẽ ở O_W 前投投回去──增加相同 `lambda`参数。

Toy 会测量 V2 的额外参数成本(大约每个注意区 额外 `hidden * hidden`),并打印出来──

## Sử dụng nó

截至 2026 年 4 月, DIFF V2  chưa được phát hành trên mỗi máy chủ suy luận sản xuất, nhưng vLLM 和 SGLang đang đang tiến hành tập hợp.

- Microsoft 内部 long-context 生产模型──
- Nhiều mặt đối với 256k+ ngữ cảnh của mở mô hình đào tạo trong nghiên cứu
- Để tập trung sự chú ý của DIFF với sự chú ý của cửa sổ trượt trong các lớp thay đổi trên các kiến trúc lai ở hợp nhất.

Bạn sẽ chọn nó vào năm 2026:

- Từ zero tập luyện một mô hình mới với mục tiêu là 64k+ ngữ cảnh hiệu quả. Từ đầu, bạn có thể tham gia vào sự chú ý khác biệt.
- Định nghĩa một mô hình ngữ cảnh dài, và mất ở giữa 失败主导你的 eval──在 Q dự đoán 上做 LoRA có thể gần giống DIFF 结构──

Bạn sẽ không chọn cảnh của nó:

- Bạn đang phục vụ một mô hình dày đặc được đào tạo trước khi có kết cấu dài  hiệu suất ổn định ⋅ đối với trọng lượng hiện có, chi phí đào tạo lại thường rất khó để trả lại ⋅
- Nội dung của bạn luôn dưới 16k.

## 交付 nó

本课会生成 `outputs/skill-diff-attention-integrator.md` Đặt một mô hình kiến trúc, chiều dài của ngữ cảnh mục tiêu, hồ sơ ảo giác và ngân sách đào tạo, nó sẽ tạo ra một kế hoạch tích hợp, để đưa ra sự chú ý khác biệt  thêm vào một cuộc chạy trước đào tạo mới hoặc LoRA tinh chỉnh 

## 练习

1. 运行 `code/main.py`▽验证在合成查询 上,differencial attention 报告的信号-噪音比 高于标准软max Attention。改变噪音幅度,并显示标准 Attention 变得不可用交叉点──

2. Đối với một mô hình cấp 7B (khí = 4096, đầu = 32, đầu = 128, 32 lớp), tính toán từ đường cơ sở đến DIFF V1 và từ đường cơ sở đến DIFF V2 thay đổi số lượng các thành phần nào đã tăng số lượng, những thành phần nào vẫn không thay đổi.

3. 阅读 DIFF V1 论文(arXiv:2410.05258) Phần 3, cũng như Phần 2 của blog Hugging Face của DIFF V2                                                                                                                                                                                                                                             

4. 实现一个ablation:分别用 `lambda = 0`(Tất cả mềm đầu tiên)`lambda = 1`(完整相减) tính toán sự khác biệt chú ý. 在合成查询 上,测量信号-to-noise 如何随着扫变.`lambda`

5. Để mở rộng đến GQA + DIFF V2── chọn 8 đầu KV và 32 đầu Q── hiển thị kích thước cache KV tương tự (8, 32) 配置基线 GQA模型匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Differential attention | “两个 softmax 相减” | 将 Q、K 拆成两半，计算两个 softmax maps，从第一个中减去第二个（由 lambda 缩放），然后乘以 V |
| Noise floor | “softmax 的非零尾部” | Softmax 放在每个无关 Token 上的 O(1/N) 权重，在 long contexts 中会累加到 O(1) |
| lambda | “相减的缩放系数” | 每个 head 的可学习标量，参数化为 `exp(lq1.lk1) - exp(lq2.lk2) + lambda_init`；可以为负 |
| DIFF V1 | “ICLR 2025 版本” | 原始 Differential Transformer；将 head dim 减半以保持参数量，需要 custom kernel，decode 更慢 |
| DIFF V2 | “2026 年 1 月修复版” | 在保持 KV heads 的同时将 Q heads 加倍；decode speed 与 baseline 持平，并兼容 FlashAttention |
| Per-head RMSNorm | “V1 稳定器” | V1 在差分之后应用的额外 norm；V2 移除了它，以避免后期训练不稳定 |
| Signal-to-noise ratio | “有多少 Attention 被浪费了” | 真实 signal 位置上的权重与无关位置平均权重之间的比率 |
| Lost in the middle | “Long-context failure mode” | 一个实证现象：长 context 中间位置文档的检索 accuracy 会下降——DIFF attention 可以缓解这一点 |
| Arithmetic intensity | “每加载一个 byte 对应多少 FLOPs” | V2 在 decode 时通过每次 KV 加载对应双倍 queries 来提高的比率；对 memory-bound decode 很重要 |

## 延伸阅读

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) 原始论文,包含噪音抵消理论和长文段ablations
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) 面向生产的重写版本,匹配基线解码,并兼容 FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333) 关于为什么减速恢复预训注意 结构理论分析
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) 参数共享变体
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) DIFF 所相减的基线变压器
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) DIFF chú ý 面向的长文段基准
