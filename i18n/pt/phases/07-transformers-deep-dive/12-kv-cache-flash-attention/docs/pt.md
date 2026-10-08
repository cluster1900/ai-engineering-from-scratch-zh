# Cache KV, atenção flash e optimização de sugestões

> O treinamento é seguido e é limitado por FLOP.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 7 · 02 (Autotensão), Fase 7 · 05 (Transformador completo), Fase 7 · 07 (GPT)
**Time:** ~75 minutes

## 问题

Um simples decodificador de auto-regressão`N`个 tokens 需要做 `O(N²)`工作: cada passo será recalculado atenção em uma completa ante. Em relação a uma resposta de 4K-token, isso significa 16M vezes atenção 运算, a maioria delas são redundantes.

Além disso, a atenção pessoalmente também irá transportar uma grande quantidade de dados. Atenção padrão irá materializar uma matriz de pontuação N×N, N×d softmax output, N×d final output, para o número de vezes que o HBM pode ler. Para N≥2K, a atenção será primeiro limitada à memória, em vez de FLOP.

Dao et al.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

1. **KV cache。**存储每个前代币的K和V向量──每个新代币的注意 都是缓存键的计算的查询──推理从每个代步的推理──`O(N²)`- Desce para aqui .`O(N)`- Não.
2. **Flash Attention。**Para atenção  calcular fazer tijolo, fazer a matriz N×N completa  nunca entrará em HBM── todos os softmax + matmul são completados em SRAM── em A100 para cima de parede de relógio de aceleração é 24×; em apoio FP8 para H100 para cima de 510×──

Até 2026, ambos já são de uso geral. Cada nível de produção de sugestões.

## 核心概念

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### Matemática do cache KV

Cada camada de decodificação, cada token, cada cabeça:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

Para um modelo 7B, 32 camadas 32 cabeças d_head=128 fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

对于Llama 3 70B(80 层、d_head=128、使用 8 个KV heads 的 GQA):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

É por isso que, no contexto de 128K, apenas o cache KV do tamanho do lote 1 ocuparia a maior parte do espaço de 40 GB A100.

**GQA 是 KV-cache 的关键收益。**Utilizando 64 cabeças, a MHA vai precisar de 32 GB.

### Atenção flash  azulejos 技巧

标准 atenção:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

Três vezes HBM 往返── em H100, HBM 带宽是3TB/s;SRAM é 30TB/s── em comparação a manter todo o conteúdo no chip, cada vez HBM 往返都会带来约10倍的减速──

Atenção flash:

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

Cada telha só precisa de uma vez para o HBM.`O(N²)`- Desce para aqui .`O(N)`❖ Passagem para trás 会从前进pass 中重新计算部分值, em vez de todos eles sobreviver para baixo 这是另内存收益

**数值技巧。**Correndo softmax em azulejos  entre manutenção `(max, sum)`, portanto, a redução final é precisa. Não é quase o mesmo que a saída calculada com o bit de atenção padrão.

**版本演进：**

| Version | Year | Key change | Speedup on reference hardware |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Tiled SRAM kernel | A100 上 2× |
| Flash 2 | 2023 | 更好的并行性，causal-first ordering | A100 上 3× |
| Flash 3 | 2024 | Hopper asynchrony、FP8 | H100 上 1.5–2×（~740 TFLOPs FP16） |
| Flash 4 | 2026 | Blackwell 5-stage pipeline、software exp2 | Inference-first（最初仅 forward） |

Flash 4  发布时只支持前进通过──训练仍然使用 Flash 3──Flash 4 的 GQA 和 varlen 支持仍在等中(2026年中)──

### Descodagem especulativa  另一个延迟优化

廉价模型提出N 个代币――大模型并行验证全部N 个代币――如果验证接受 k 个代币,你就就用1次大模型前传 换来了 k 次生成――对于代码和散文,典型 k=35──

2026:
- **EAGLE 2 / Medusa。**集成式草案头,共享验证器的隐藏状态──23× speedup,且无质量损失──
- **Speculative decoding with draft model。**No hardware de consumo, há 2×4x de velocidade.
- **Lookahead decoding。**Iteração Jacobi; Não precisa de modelo de projeto.

### Batchagem contínua

经典批次推断: esperar a sequência mais lenta 结束, então iniciar um novo lote.

Batchings contínuos ([[{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:{{url:}}}}}}}}}}) }}) }}) }}) }}

### PagedAttention  Colocar o cache KV 当作虚拟内存

O cache de KV é distribuído em blocos de 16 tokens; tabela de página irá mapear a posição lógica para blocos físicos. Pode ser compartilhada entre os blocos de KV e outros.


拖动维度参数, observar o tamanho do cache 如何变化──把序列长度或批量大小 推高, você verá que ele é muito rápido em excesso do tamanho de uma única GPU──

```figure
kv-cache-sizer
```

```figure
flash-attention-memory
```

## Construí-lo

- Não .`code/main.py`❖ Nós realizamos:

1. Um simples.`O(N²)`Decodificador incremental.
2. Um .`O(N)`Descóderas em cache KV:
3. Uma simulação do Flash Attention running-max algoritmo de softmax de azulejos.

### 步骤 1: cache KV

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

很简单: em cada camada  de cada cabeça de lista, continua adicionar cada token de K V vetores

### 步骤 2: softmax de azulejos

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

输出与一次性计算 `softmax(qK) V`Um pouco idêntico, mas qualquer momento de trabalho conjunto são apenas um.`tile × d_head`Bloco, em vez de completo `N × d_head`- Não.

### 步 3: Na geração de 100 tokens 上比较天真 vs. em cache decodificação

统计注意 操作数――Naive:`O(N²)`= 5050──Cachado:`O(N)`= 100...

## Use-o

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

跨请求的前缓存是2026年重要收益相同的系统提示、少数shot示例,或长文文文文文 都能在多次调用之间复用 KV──对于反复使用工具提示的代理 工作负载,前缓存通常能带来5× 吞吐量提升──

## Entrega-o

- Não .`outputs/skill-inference-optimizer.md`◊ Esta habilidade será utilizada para uma nova proposta de selecção de atenção implementação ‒ estratégia de cache KV ‒ quantização ‒ descodificação especulativa ‒

## 练习

1. **Easy.**运行 `code/main.py` Confirmar os decodificadores ingênuos e em cache  produzir a mesma saída;
2. **Medium.**实现 prefix caching:给定一个提示 P 和多个完成,先对P 运行一次前行通过来填充KV缓存,然后按每个完成 分支――测量对对每个完成 重新编码 P 的速度――
3. **Hard.**实现一个玩具版 PagedAttention:KV cache 使用固定的16代币块,并带有免费列表──当一个序列 完成时,把它的块归归池中──模拟1000个长度不同的聊天完成──比较它与连续分配的内存碎片情况──

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

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135)Flash 1
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691)Flash 2
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608)Flash 3
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) Blackwell 5 estágios de pipeline 和 software-exp2 技巧; ler repo README, saber o que este curso menciona sobre as advertências de lançamento apenas para o futuro。
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) vLLM 论文──
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) Descodificação de especificações。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) 本课引用的集成草案方法的EAGLE-1/2 paper──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) Com a Águia, a Medusa foi citada.
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) 关于16 token block 和 page-table design 
