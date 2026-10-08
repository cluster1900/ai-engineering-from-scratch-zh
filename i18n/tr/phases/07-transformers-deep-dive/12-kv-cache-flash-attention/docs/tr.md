# KV Kaş, Akıllı Dikkat ve Öneriler Optimizasyonu

> 訓練是并行且受FLOP 限制的──推理是串行且受内存带宽限制的──瓶不同,技巧也不同──

**Type:** Build
**Languages:** Python
**先修要求：**7. · 02 aşaması (Öz dikkat), 7. · 05 aşaması (Tüm Transformer), 7. · 07 aşaması (GPT)
**Time:** ~75 minutes

## 问题

Bir basit kendi kendine geri dönüş decoder üretildi`N`个代币 需要做 `O(N²)`工作: Her adım tamamen ön plana yeniden hesaplanır. 4K-token tepkisi için 16M kez dikkat 运算 anlamına gelir. Bunların çoğu reduktifdir.

Ayrıca, dikkat, kendi içinde büyük miktarda veri taşımayacaktır. Standart dikkat, bir N×N puan matrisi, N×d softmax çıkışı, N×d son çıkışı, HBM'nin okuma süresi için çok fazla olacaktır. N≥2K için, dikkat önce FLOP'den ziyade hafıza bağlanmış olacaktır.

Dao et al.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

1. **KV cache。**存储 her ön  token'in K ve V vektörleri── her yeni token'ın dikkatleri 缓存 anahtarlarının hesaplanması için bir sorguydu── her nesil adımından gelen bir önerme `O(N²)`降到 `O(N)`- Evet.
2. **Flash Attention。**Dikkat  hesaplama yapmak, tam N×N matrisi  asla HBM'ye girmeyecek ⋅ tüm yumuşak maksimum + matmul SRAM'da tamamlanmıştır ⋅ A100'de duvar saati hızlandırması 24×; FP8'in H100'inde 510×。

2026 yılına kadar, her ikisi de genel bir konuma sahip olmuştur. Her üretim aşamasında, Flash Dikkatini etkinleştirilmiştir.

## 核心概念

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### KV önbelleği matematik

Her dekoder katmanı, her token, her baş:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

Bir 7B modeli için 32 kat 32 baş = 128 fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

Llama 3 70B için 80 层、d_head=128、 8 KV başlarının GQA kullanmak:

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

Bu 10 GB'lık bir Llama 3 70B'nin 128K bağlamında, sadece 1 seri büyüklüğündeki KV kasesi 40 GB A100'in büyük kısmını oluşturacaktır.

**GQA 是 KV-cache 的关键收益。**64 baş kullanmak için 32 GB gerekir.

### Akşam dikkat  kapaklama 技巧

标准 dikkat:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

Üç kez HBM 往返── H100 üzerinde, HBM 带宽ı 3 TB/s; SRAM 30 TB/s── karşılaştırıldığında, tüm içeriği çipi üzerinde tutmak, her HBM 往返都带来约10倍的减速──

Akıllı Dikkat:

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

Her tek tek tek tek bir HBM'ye ihtiyaç var.`O(N²)`降到 `O(N)`❖ Geri geçiş, ileri geçişten geri geçişin değerlerini yeniden hesaplamak yerine, hepsini geri bırakmak için kullanılır.

**数值技巧。**Softmax                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `(max, sum)`, bu nedenle nihai birleştirme doğru değildir. Bu, hesaplanan çıkışın standart dikkat bitine benzer olması için yapılır.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

Flash 4  yayınlama sırasında sadece ileri geçmeyi destekler. Eğitim hala Flash 3 ⋅ Flash 4'ün GQA 和 varlen 支持仍在等待中(2026年中) ⋅

### Speküel çözme  另一个延迟优化

廉价模型提出 N 个代币――大模型并行验证全部N 个代币―― eğer验证 k 个代币 kabul ederse, 1 kez büyük model ileri geçişi kullanır 换来 k 次生成――对于代码和散文,典型 k=35──

2026 Yıllık Yöntem:
- **EAGLE 2 / Medusa。**集成式草案头,共享验证器的隐藏状态──23×加速,且无质量损失──
- **Speculative decoding with draft model。**İsteğe bağlı olarak 2×4 hızlandırma.
- **Lookahead decoding。**Jacobi İterasyonu; ̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆̆

### Sürekli serileme

经典批次推断: 缓慢的序列的等待 结束,然后启动一个新批次.

Sürekli serilişim ((最早在 Orca 中发布,如今用于vLLM、TensorRT-LLM、SGLang): eski istek bir bitmiş, yeni istek bir seriye değiştirilmiştir.

### PagedAttention  KV cacheyi as作虚拟内存 koymak

vLLM'nin çekirdek satış noktası。KV kasesi 16 token blokları ile bölünür; sayfa tablosu logik konumlarını fiziksel bloklara haritalarlar。 KV'de paylaşılabilir ve                                                                                                                                                                                                                                      


拖动维度参数, observe cache size 如何变化──把序列长度或批量大小 推高, you'll see it moreover fast over the capacity of a single张 GPU──

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

## Yapın onu.

Görüyorum .`code/main.py`❖ Biz gerçekleştirmek:

1. Bir basit şey.`O(N²)`Gelişmiş dekodör.
2. Bir tane .`O(N)`KV-cached decoder。
3. Bir Flash dikkat çalıştırma maksimum algoritması benzerlik softmax.

### 步骤 1: KV önbelleği

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

很简单:在每层、每个头的列表中,持续添加每个代币的 K、V vektörleri──

### 步骤 2: kapaklı softmax

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

输出与一次性计算 `softmax(qK) V`Biraz aynı ama her zaman çalışmak bir seti sadece bir`tile × d_head`- Tamamlı değil.`N × d_head`- Evet.

### 步骤 3: 在 100 token nesli 上比较 naïve vs. önbelleğe kodlama

统计注意 操作数。 Naive:`O(N²)`= 5050♦ Kaydedilmiş:`O(N)`= 100¬代码会打印二者¬

## Kullan

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

跨请求的前置缓存是2026 yılının önemli kazancı  Aynı sistem prompt、few-shot örnekleri, veya长文脈文档 都能在多次调用之间重复使用 KV──对于反复使用工具提示的代理 工作负载,前置缓存通常能带来5× 吞吐量提升──

## - Söyle.

Görüyorum .`outputs/skill-inference-optimizer.md`Bu beceriler yeni bir strateji için kullanılacak.

## 练习

1. **Easy.**运行  İşlem`code/main.py`❖ Naif ve önbelleğe alınmış dekodörlerin aynı çıkışları oluşturduğunu belirleyin; dikkat et op-count'ın farkına
2. **Medium.**实现 prefix caching:给定一个提示 P 和多个完成,先对P 运行一次前行通过来填充KV缓存,然后按每个完成 分支――测量对对每个完成 重新编码 P 的速度――
3. **Hard.**实现一个玩具版 PagedAttention:KV cache 使用固定的16-token blocks,并带有免费列.

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

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) Flash 1..
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) Flash 2..
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) Flash 3..
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) Blackwell 5 aşamalı boru hattı 和 yazılım-exp2 技巧; README repo, bu dersden bahsedilen sadece ileriye atılma uyarıları için bilgi alın。
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) vLLM 论文。
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) Spec kodlaması。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 本课引用的集成草案方法的EAGLE-1/2 makale
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) Birbirine yaklaşmak için Medusa'ya yaklaşmak için Eagle'a bir araya gelmek için.
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html)16 token blok ve sayfa-tablo tasarımının kanonik derin dalışları hakkında.
