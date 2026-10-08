# 预存器,闪存注意力和推理优化

> 训练是并行且受FLOP限制的. 推理是串行且受内存带宽限制的.

**Type:** Build
**Languages:** Python
**先修要求：**转换器 (GPT) 转换器 (GPT) 转换器 (GPT)
**Time:** ~75 minutes

## 问题

一个简单的自归解码器 生成`N`个代币需要做`O(N²)`工作:每一步都会在完整前上重新计算注意力――对一个4K标记的响应,这意味着16M次的注意力运算,其中大多数都是冗余的――前标记的每个隐藏状态一旦计算出来就是确定的你只需要让新标记的查询 去和此前所有的标记 缓存下来的钥匙和值做计算――

除此之外,注意力本人也会运输大量数据――标准注意力 会物化一个N×N分数矩阵、N×d软max输出、N×d最终输出对HBM的读写次数太多――对于N≥2K,注意力将先成为内存的束,而不是FLOP的束――经典注意力内核对现代GPU的利用率低于410×──

道等人提出的两个优化,把前沿推理从慢推到快推:

1. **KV cache。**存储每个前代币的K和V向量──每个新代币的注意力都是一个对缓存密钥的计算的查询──推理从每个代步的推理.`O(N²)`降到`O(N)`,我知道.
2. **Flash Attention。**为了注意 计算做,使完整的N×N矩阵永远不会进入HBM──所有软max + 都在SRAM中完成──在A100上面墙钟加速为24×;在支持FP8的H100上面为510×──

到2026年,它们都已经被通用配置了. 每个生产级推.

## 核心概念

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### 预存计算

每个解码层,每一个代币,每一个头:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

对于一个7B模型,32层,32个头,d_head=128fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

对于Llama 3 70B ((80层、d_head=128、使用8个KV头的GQA):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

这就是为什么在128K背景下,只有批量1的KV缓存将占据40GBA100的大部分显现存储.

**GQA 是 KV-cache 的关键收益。**使用64个头的MHA 会需要32GB──MLA还能进一步缩小──

### 闪光注意  技巧

标准注意:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

在H100上,HBM带宽为3TB/s;SRAM是30TB/s. 相比之下,把所有内容保留在芯片上,每次HBM往返都会带来约10倍的减速.

闪光注意:

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

每个只需要一次HBM往返.`O(N²)`降到`O(N)`△反向传递 会从前向传递中重新计算部分值,而不是把它们全部存活下来.

**数值技巧。**运行软max 在之间维护`(max, sum)`由于这种情况,最终归结是精确的. 这不是近似的.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

发行时只支持前进通过――训练仍然使用Flash 3――Flash 4的GQA 和 varlen 支持仍在等待中(2026年中) ――

### 另一个延迟优化

廉价模型提出了N 个代币――大模型并行验证全部N 个代币――如果验证接受了K 个代币,你就用1次大模型前进通过 换来K 次生成――对于代码和散文,典型的K=35――

2026年默认做法:
- **EAGLE 2 / Medusa。**集成式草案头,共享验证器的隐藏状态──23×加速,且无质量损失──
- **Speculative decoding with draft model。**在消费级硬件上,有24x的速度.
- **Lookahead decoding。**简单的版本:

### 连续批发

经典批量推断:等待最慢的序列结束,然后启动一个新的批量.

持续批量 (最早在Orca中发布,如今用于vLLM、TensorRT-LLM、SGLang):旧请求一完成,就把新请求换成批量――对于典型聊天工作负载,吞吐量提升510×──

### 页面注意  把KV缓存当作虚拟内存

基于 16 代币区块的 KV 缓存 分布;页面表将逻辑位置映射到物理区块. 它可以在并行采样之间共享 KV 射搜索,并行采样) 为了快速缓存 热切换前,并对内存做碎片整理.相比简单的连续分配,吞吐量提升 4×.


拖动维度参数,观察缓存尺寸如何变化――把序列长度或批量尺寸推高,你会看到它快速超过单张GPU容量――

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

## 构建它

见`code/main.py`我们实现了:

1. 一个简单的`O(N²)`增量解码器
2. 一个`O(N)`存储KV的解码器──
3. 一模拟闪光注意力运行最大算法的软max──

### 步骤1:KV缓存

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

很简单:在每个层面的每个头列表中,持续添加每个标志的K、V向量.

### 步骤 2: 软max

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

输出与一次性计算`softmax(qK) V`虽然它是相同的,但任意时刻的工作组都只是一个.`tile × d_head`区块,而不是完整的`N × d_head`,我知道.

### 步骤3: 在100代代币上比较天真与缓存解码

统计注意力 操作数――无知:`O(N²)`存:`O(N)`现在,我已经开始了.

## 使用它

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

产业部署:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

跨请求的预写缓存是2026年重要收益 同样的系统提示、少数截图示例,或长文本文档 都能在多次调用之间复用KV──对于反复使用工具提示的代理工作负载,预写缓存通常能带来5× 吞吐量提升──

## 交付它

见`outputs/skill-inference-optimizer.md`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │

## 练习

1. **Easy.**运行`code/main.py`△确认无明和缓存解码器 产生相同输出;注意 op-count 的差异──
2. **Medium.**实现预写缓存:给定一个提示 P 和多个完成,先对 P 运行一次前进传输来填充KV缓存,然后按每个完成 分支――测量对每个完成 重新编码 P 的速度――
3. **Hard.**实现一个玩具版 关注:KV缓存 使用固定的16代币区块,并带有免费列表.

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

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)闪电1
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691)闪电2
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608)闪电3
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention)黑5阶段管道和软件-exp2 技巧;阅读 repo README,了解本课提到的前进发射警告――
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)  论文
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192)规格解码――
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 本课引用的集成草案方法的EAGLE-1/2论文
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774)与一样被引用的梅杜萨方法.
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html)关于16个代币区块和页面表设计的经典深度潜水.
