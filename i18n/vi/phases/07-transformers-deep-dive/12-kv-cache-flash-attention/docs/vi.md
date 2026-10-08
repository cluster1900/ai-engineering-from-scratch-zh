# KV Cache, Flash Attention và Optimization

> 训练是并行且受FLOP 限制的. 推理是串行且受内存带宽限制的. 瓶不同,技巧也不同.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 7 · 02 (Tự chú ý), Giai đoạn 7 · 05 (Tổng biến đổi), Giai đoạn 7 · 07 (GPT)
**Time:** ~75 minutes

## 问题

Một bộ giải mã tự quay trở lại đơn giản`N`个 token 需要做 `O(N²)`工作: Mỗi bước sẽ được tính lại sự chú ý trên toàn bộ tiền. Đối với một phản ứng của 4K-token, điều này có nghĩa là 16M lần chú ý vận hành, hầu hết trong số đó là dư thừa.

Ngoài ra, sự chú ý tự nhiên cũng sẽ di chuyển rất nhiều dữ liệu. Sự chú ý tiêu chuẩn sẽ chuyển hóa một matrix điểm N×N, đầu ra mềm tối đa N×d, đầu ra cuối cùng N×d đối với số lượng đọc đọc của HBM quá nhiều. Đối với N≥2K, sự chú ý sẽ được ràng buộc bởi bộ nhớ, chứ không phải FLOP.

Dao et al.  đề xuất hai ưu đãi, đưa ra các suy nghĩ về phía trước từ 慢推到快:

1. **KV cache。**存储 từng token trước K và V vector.                                                                                                                                                                                                                                                         `O(N²)`降到 `O(N)`
2. **Flash Attention。**Để chú ý  tính toán làm tay, làm cho matrix N×N hoàn chỉnh  không bao giờ vào HBM。 tất cả các softmax + matmul đều hoàn thành trong SRAM。 trên A100 tăng tốc độ đồng hồ tường là 24×; trên H100 của FP8 là 510×。

Đến năm 2026, cả hai đều đã được sử dụng chung. Mỗi cấp sản xuất được đưa ra.

## 核心概念

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### KV cache toán học

Mỗi lớp giải mã, mỗi token, mỗi đầu:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

Đối với một mô hình 7B, 32 tầng, 32 đầu, d_head=128 fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

Đối với Llama 3 70B ((80 层、d_head=128、使用 8 个 KV heads 的 GQA):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

Đó là lý do tại sao Llama 3 70B trong bối cảnh 128K, chỉ có bộ nhớ cache KV kích thước 1 sẽ chiếm một phần lớn lưu trữ 40 GB A100.

**GQA 是 KV-cache 的关键收益。**Sử dụng 64 đầu MHA 会 cần 32 GB. MLA còn có thể nén hơn nữa.

### Flash Attention  tay tay 技巧

标准 chú ý:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

Trong H100, HBM 带宽 là 3 TB/s; SRAM là 30 TB/s.

Lưu ý:

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

Mỗi tấm chỉ cần một lần HBM quay trở lại.`O(N²)`降到 `O(N)`❖ Pass ngược 会从前传中重新计算部分值, thay vì đưa chúng tất cả tồn tại 

**数值技巧。**Đi softmax trong các tấm  giữa bảo trì `(max, sum)`, do đó kết quả kết hợp là chính xác. Đây không phải là gần như.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

Flash 4 发布时只支持前进通过──训练仍使用 Flash 3──Flash 4 的 GQA 和 varlen 支持仍在等中(2026年中)──

### Tự đoán giải mã  另一个延迟优化

廉价模型提出N 个代币――大模型并行验证全部N 个代币――如果验证接受 k 个代币,你就就用1次大模型前传 换来 k 次生成――对于代码和散文,典型 k=35──

2026:
- **EAGLE 2 / Medusa。**集成式草案头,共享验证器的隐藏状态──23×加速,且无质量损失──
- **Speculative decoding with draft model。**Trên các thiết bị tiêu dùng có tốc độ tăng gấp 2×4 lần.
- **Lookahead decoding。**Jacobi lặp lại; không cần mô hình dự thảo.

### Lượng hàng liên tục

经典批次推断: chờ đợi chuỗi chậm nhất kết thúc, sau đó khởi động một loạt mới.

Lưu ý liên tục (vgl: vLLM, TensorRT-LLM, SGLang): Old request one completed,就把新请求换 into batch.

### PagedAttention  Đặt cache KV 当作虚拟内存

VLLM's core selling point──KV cache 以16 token blocks 分配;page table 将逻辑 vị trí được映射到物理块──它 có thể được chia sẻ giữa các con đường采样 KV(beam search、parallel sampling) 、为快速缓存 热切换前,并对内存做碎片整理──相比简单的连续分配,吞吐量提升4×──


拖动维度参数,观察缓存 kích thước 如何变化──把序列长度或批量大小推高, bạn sẽ thấy nó nhanh chóng vượt quá dung lượng của đơn张 GPU──

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

##  xây dựng nó

见 `code/main.py`❖ Chúng tôi thực hiện:

1. Một cái đơn giản `O(N²)`decoder tăng dần.
2. Một `O(N)`KV-cache decoder
3. Một mô hình Flash Attention chạy-max thuật toán của phay mềmmax

### 步骤 1: KV cache

```python
class KVCache:
    def __init__(self, n_layers, n_heads, d_head):
        self.K = [[[] for _ in range(n_heads)] for _ in range(n_layers)]
        self.V = [[[] for _ in range(n_heads)] for _ in range(n_layers)]

    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)

    def read(self, layer, head):
        return self.K[layer][head], self.V[layer][head]
```

很简单: Trong danh sách của mỗi tầng, tiếp tục thêm các vector K  V của mỗi token.

### 步骤 2: Softmax

```python
def tiled_softmax_dot(q, K, V, tile=4):
    """Flash-attention-style softmax(qK^T)V with running max/sum."""
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

输出与一次性计算 `softmax(qK) V`Một chút giống hệt nhau, nhưng bất cứ lúc nào của bộ làm việc đều chỉ là một.`tile × d_head`khối, thay vì hoàn chỉnh `N × d_head`

### 步骤 3: Trong thế hệ mã thông báo 100 上比较 ngây thơ vs giải mã cache

统计 chú ý 操作数――Naive:`O(N²)`= 5050。Cached:`O(N)`= 100 ⋅代码会打印二者⋅

## Sử dụng nó

```python
# HuggingFace transformers auto-enables KV cache on decoder-only generate().
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-3B",
    attn_implementation="flash_attention_2",  # use FA3 if Hopper
    torch_dtype="bfloat16",
)
# generate() uses KV cache automatically
```

VLLM 生产部署:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

跨请求的预音缓存是2026年重要收益相同系统提示、少数截图例,或长文档 都能在多次调用之间复用 KV──对于反复使用工具提示的代理 工作负载,预音缓存通常能带来5× 吞吐量提升──

## 交付 nó

见 `outputs/skill-inference-optimizer.md`◊ kỹ năng này sẽ được sử dụng cho các biện pháp mới để triển khai KV cache chiến lược, định lượng và giải mã giả định.

## 练习

1. **Easy.**运行 `code/main.py`❖ xác nhận những decoder ngây thơ và được ghi nhớ cache  tạo ra cùng một output; chú ý đến sự khác biệt op-count ❖
2. **Medium.**实现 tiền tố cache:给定一个提示 P 和多个完成,先对P 运行一次前传来填充KV缓存,然后按每个完成 分支――测量对对每个完成 重新编码 P 的速度――
3. **Hard.**实现一个玩具版 PagedAttention:KV cache 使用固定的16代币块,并带有免费列表──当一个序列 完成时,把它的块归回池中──模拟1000个长度不同的聊天完成──比较它与连续分配的内存碎片情况──

## 关键术语

| Term | 人们的说法 | 它实际上的含义 |
|------|------------|----------------|
| KV cache | “让 decoding 变快的技巧” | 存储每个前缀 token 的 K 和 V；新 queries attend to 它们，而不是重新计算。 |
| HBM | “GPU 主内存” | High Bandwidth Memory；H100 上 80 GB，B200 上 192 GB。带宽约 3 TB/s。 |
| SRAM | “片上内存” | 每个 SM 的高速内存，H100 上每个 SM 约 256 KB。带宽约 30 TB/s。 |
| Flash Attention | “Tiled attention kernel” | 在 HBM 中不物化 N×N 的情况下计算 attention。 |
| Continuous batching | “No-wait batching” | 不清空 batch，直接换出完成的 sequences、换入新的 sequences。 |
| PagedAttention | “vLLM 的核心卖点” | KV cache 以固定 blocks 分配，并通过 page table 管理；消除碎片。 |
| Prefix caching | “复用长 prompts” | 在请求之间缓存共享前缀的 KV；对 agents 来说是重大成本削减。 |
| Speculative decoding | “Draft + verify” | 廉价 draft model 提出 tokens；大模型在一次 pass 中验证 k 个。 |

## 延伸阅读

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) Flash 1。
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) Flash 2。
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) Flash 3。
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) Blackwell 5 giai đoạn đường ống và phần mềm-exp2 技巧; đọc repo README, hiểu trong bài viết này đề cập đến cảnh báo phóng chỉ cho tương lai。
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) vLLM 论文。
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) mã hóa thông số kỹ thuật số
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 本课引用的集成草案方法的EAGLE-1/2 bài báo
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) Phương pháp Medusa được trích dẫn với Eagle
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) 关于16 token block 和 trang-table design của canonical deep dive──
