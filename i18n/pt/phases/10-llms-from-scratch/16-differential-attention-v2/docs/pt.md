# Atenção Diferencial (V2)

> Softmax Attention 会在每个不匹配的代币上分散少量概率. Em 100k 个代币上, esses ruídos se acumulam e inundam sinal. Diferencial Transformer(Ye et al., ICLR 2025) através de Attention 计算为两个软max 的差来来解决这个问题,从而减去共享噪音的下限.

**类型:**Construção
**语言:**Python (stdlib)
**前置要求:**Fase 7 · 02 (auto-atenção), Fase 7 · 15 (variantes de atenção), Fase 10 · 14 (marcha de arquitetura)
**时间:**- 60 minutos.

## Objectivo de aprendizagem

- 准确说明为什么 softmax Atenção 存在噪声下限,以及为什么随着背景长度 增长而成
- 推导 atenção diferencial 公式,并解释为什么相减会抵消共享噪音成分,同时保留信号──
- 讲清 V1 do V2 a diferença: quais partes são mais rápidas, mais simples, mais estáveis, e por que cada mudança na fase de produção pré-formação é necessária.
- Usar Python puro para realizar a atenção diferencial de zero e fazer uma consulta sintética de sinal-mais-ruído.

## 问题

标准 softmax Atenção tem uma natureza matemática, em escala de mudança grande, se transforma em problemas de engenharia.`q`,Attenção 权重是 `softmax(qK^T / sqrt(d))` Softmax 永远无法产生精确的零值每个不匹配的代币都会得到一些正质量──这个残余质量就是噪音,并且会随着背景长度扩大── 在128k 个代币下,即使每个不匹配的代币只获得0.001%的概率,127,999 代币合并也会贡献约12%的总量──模型必须学会绕开一个随着背景 增长的噪音下限──

Em prática, este desempenho foi feito para a atenção cabeça 干扰:long-context RAG 中的幻觉引用、100k-Token 检索任务中的失败中失败,以及针头-in-haystack benchmark 在超过32k 后出现细微精度下降.

O DIFF V1 tem três problemas, o que o torna incapaz de entrar no pipeline de pré-treinamento da linha de frente. Seu cache de valor em cada etapa de decodificação tem que ser carregado duas vezes, requer kernels CUDA personalizados, prejudica a compatibilidade do FlashAttention, e seu RMSNorm por cabeça em treinamentos de longo prazo de 70B em escala acima irá causar estabilidade.

## 核心概念

### Softmax de ruído

 para a consulta `q`和 chaves `K = [k_1, ..., k_N]`,Attenção 权重是:

```
w_i = exp(q . k_i / sqrt(d)) / sum_j exp(q . k_j / sqrt(d))
```

Não há nada .`w_i`- Não, não.`k_i`Com`q`Não há problema, pontuação.`q . k_i`Também não é 0  ele vai girar em volta de zero, diferença de `||q||^2 / d` Após a normalização de softmax, cada token continua a aumentar o seu poder e contribuições`O(1/N)`△无关 Token 的总贡献是 `O((N-1)/N) = O(1)`Não é uma pequena quantidade.

模型想要的更像是硬顶-k:在匹配 Token 上给高权重,在其他位置接近零──软max 过于平滑,无法直接做到这一点──

### Diferencial 思路

Para cada cabeça de Q e K projeções 拆成两份:Q = (Q_1, Q_2),K = (K_1, K_2)。计算两个注意地图:

```
A_1 = softmax(Q_1 K_1^T / sqrt(d))
A_2 = softmax(Q_2 K_2^T / sqrt(d))
```

输出:

```
DiffAttn = (A_1 - lambda * A_2) V
```

相减会抵消两个图共享的任何噪声分布―― Se dois mapas em 127k 无关标志上有近似均重权 (quando iniciada随机确实如此), estes componentes se mutuamente抵消――信号少数真正相关标志上的尖峰权 (peso máximo) só será抵消的当两个图中出现相同幅度时,而模型训练后不会保持这种状态――

`lambda`É cada cabeça um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um um`lambda = exp(lambda_q1 dot lambda_k1) - exp(lambda_q2 dot lambda_k2) + lambda_init`Pode ser por causa dele.`lambda_init`默认是类似 0.8 的小正数──

### Por que é que é assim ?

Pode-se imaginar como dois microfones com ruído em um mesmo som. Ambos são gravados pelo orador e pelo ruído de contexto relacionado. De um sinal para outro, o ruído compartilhado diminui.`lambda`Aprender é assim.

### V1 vs V2: diferença

V1  manteve o mesmo parâmetro que o Transformer de linha de base. Para que cada cabeça tenha duas consultas, ele reduzirá a dimensão da cabeça para metade. Isso sacrificou a capacidade de expressão da cabeça, mais doloroso ainda, também faz com que o cache de valor de cada cabeça seja reduzido para metade.

V2 vai fazer cabeças de consulta número multiplicado,并保持 KV heads 不变(de projeção de alta 借用参数) ――Dimenção de cabeça 保持与基线相同──相减后,额外维度将被投影回去,以匹配基线变压器的O_W投影──三件事同时发生:

1. A velocidade de decodificação é comparada com a linha de base.
2. FlashAttention 可原样运行(Não é necessário kernel personalizado)。
3. Decodificar 时的算法强度 提高(每次从HBM加载字节 时对应更多计算) ⋅

O V2 também mudou o V1 para estabilizar a fase de redução da operação da RMSNorm por cabeça. Em escala de pré-treino de nível 70B, o RMSNorm vai fazer o treinamento de última fase instável.

### Qual é o tempo de usar?

| Workload | Benefit |
|----------|---------|
| Long-context RAG (64k+) | 更干净的 Attention maps，更少幻觉引用 |
| Needle-in-haystack benchmarks | 32k 之后 accuracy 显著提升 |
| Multi-document QA | 更少跨文档干扰 |
| Code completion at 8k | 收益有限，不值得改变 architecture |
| Short chat (< 4k) | 基本与 baseline 不可区分 |

收益会随着背景长度 增长而增加──在4k Token 下, noise downlimit足够小,标准注意力 已可用──在128k 下, it will begin to notice harmful effects── em 4k Token 下, noise downlimit足够小,标准 Attention 已可用── em 128k 下, ele vai começar a causar efeitos nocivos visíveis── em 128k 下, ele vai começar a causar efeitos nocivos── em 128k 下, ele vai aumentar o volume de ruído.

### Como é que ele combina com outros botões 2026

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

## Construí-lo

`code/main.py`Usando Python, conseguimos uma atenção diferencial. Uma consulta de brinquedo com uma estrutura de sinal e ruído conhecida, permite que você mede diretamente a taxa de resíduos de ruído.

### 步骤 1: atenção softmax padrão

Obras de matriz: lista de listas, matmul·, com o máximo de valor reduzido para garantir o valor de estabilidade numérica, softmax.

```python
def softmax(row):
    m = max(row)
    exps = [math.exp(x - m) for x in row]
    s = sum(exps)
    return [e / s for e in exps]
```

### Passo 2: Dividir em duas partes

V1 风格:将头寸 减半──V2 风格: manter a cabeça dimensão,并将头寸 数量加倍──toy implementação 为了教学清晰使用 V1数学完全相同,只有会计不同──

### 步骤 3: 两个软max ramos + 相减

```python
A1 = [softmax([dot(q1, k) / scale for k in K1]) for q1 in Q1]
A2 = [softmax([dot(q2, k) / scale for k in K2]) for q2 in Q2]
diff_weights = [[a1 - lam * a2 for a1, a2 in zip(r1, r2)] for r1, r2 in zip(A1, A2)]
out = [[sum(w * v[j] for w, v in zip(row, V)) for j in range(d_v)] for row in diff_weights]
```

Nota: O output power can be for negative. Não há problema. O cache de valor ainda pode ser processado com o contributo do símbolo.

### 步骤 4: 噪声抵消测量

Construir uma sequência de composição de 1024 de longitude.                                                                                                                                                                                                                                                       

### 步骤 5: V1 vs V2 参数核算

给定一个配置 ((hidden=4096, heads=32, d_head=128),打印:

- Transformador de linha de base: Q、K、V V`hidden * hidden`, MLP é 4 * escondido
- DIFF V1: Q、K Vólos de tamanho`hidden * hidden`, V grande por`hidden * hidden`(不变), cabeça dim 在内部减半──增加 per-head `lambda`- Não, não. - Não, não.
- DIFF V2: Q`2 * hidden * hidden`, K , grande por`hidden * hidden`, V grande por`hidden * hidden`◊ Extra-dimensional                                                                                                                                                                                                                                                            `lambda`- É o que é?

O custo extra do tamanho do brinquedo V2 `hidden * hidden`),并打印出来──

## Use-o

截至2026年4月,DIFF V2  ainda não foi lançado em cada servidor de inferência de produção, mas vLLM 和 SGLang está em desenvolvimento integrado.

- Microsoft 内部 longo contexto 生产模型。
- O estudo de recuperação de vários aspectos em um contexto de 256k+
- A atenção DIFF e a atenção de janela deslizante em camadas de troca de arquiteturas híbridas.

Você vai escolher o cenário em 2026:

- Desde zero treinamento um novo modelo de contexto eficaz com o objetivo de 64k+. Desde o início, a atenção diferencial é incluída; depois, o re-treinamento custa muito alto.
- A fine-tuning um modelo de longo contexto, e perdido no meio 失败主导你的 eval──在 Q projeções 上做 LoRA 可以近似 DIFF 结构──

Não vais escolher a cena:

- Você está servindo um modelo denso pré-treinado de longo contexto de desempenho estável e estável.
- O seu contexto é sempre inferior a 16k.

## Entrega-o

本课会生成 `outputs/skill-diff-attention-integrator.md` determinar uma arquitetura modelo, a duração do contexto-alvo, o perfil de alucinação e o orçamento de formação, que irá gerar um plano de integração, para utilizar a atenção diferenciada  adicionar uma nova corrida pré-formação ou um ajuste fino do LoRA 

## 练习

1. 运行 `code/main.py` experimentar em consulta sintética  atenção diferencial  relatório de sinal-ruído ratio 高于标准softmax Attention ・ alterar a amplitude de ruído,并展示标准 Attention 变得不可用交叉点──

2. Para um modelo de classe 7B ((hidden=4096, cabeças=32, d_head=128, 32 camadas), calcular a partir da linha de base até DIFF V1 e a partir da linha de base até DIFF V2 variação de parâmetros.

3. 阅读DIFF V1 论文(arXiv:2410.05258) 章 3, bem como DIFF V2 Hugging Face blog 章 2, use dos dois termos para explicar por que a RMSNorm per-head de V1 é necessária, bem como por que a V2 pode ser removida sem causar divergências de treinamento 

4. 实现一个ablation:分别用 `lambda = 0`(puro primeiro softmax)`lambda = 1`(完整相减) calcular atenção diferencial.`lambda`- Não.

5. 将玩具 扩展到 GQA + DIFF V2──选择 8 个 KV heads 和 32 个 Q heads──展示 KV cache size 与相同 (8, 32) 配置的基线 GQA模型 匹配──

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

- [Ye et al. — Differential Transformer (arXiv:2410.05258, ICLR 2025)](https://arxiv.org/abs/2410.05258) Origins, contenção de teorias de ausência de ruído e ablações de longo contexto
- [Microsoft unilm — Differential Transformer V2 (Hugging Face blog, January 2026)](https://huggingface.co/blog/microsoft/diff-attn-v2) 面向生产的重写版本,匹配基线解码,并兼容FlashAttention
- [Understanding Differential Transformer Unchains Pretrained Self-Attentions (arXiv:2505.16333)](https://arxiv.org/abs/2505.16333)  Sobre por que a redução de energia recuperação pré-treinada Atenção  estrutura  teoria análise
- [Shared DIFF Transformer (arXiv:2501.17900)](https://arxiv.org/html/2501.17900) 参数共享变体
- [Vaswani et al. — Attention Is All You Need (arXiv:1706.03762)](https://arxiv.org/abs/1706.03762) Transformador de linha de base do DIFF
- [Liu et al. — Lost in the Middle (arXiv:2307.03172)](https://arxiv.org/abs/2307.03172) Atenção do FIDD 面向的长文段基准
