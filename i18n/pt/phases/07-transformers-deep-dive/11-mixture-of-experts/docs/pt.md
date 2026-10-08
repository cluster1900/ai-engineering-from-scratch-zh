# Método de gestão

> Um transformador 70B denso irá ser usado para cada token  ativar todos os parâmetros― um 671B MoE Cada token apenas ativar 37B parâmetros, mas em todos os benchmarks 上胜过它──稀疏性是这个十年最重要的规模化思想──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 05 (Transformador completo), Fase 7 · 07 (GPT)
**Time:** ~45 minutes

## 问题

Quando um modelo denso é expandido, cada token tem que pagar o custo de cálculo completo. Até 2024, a fronteira já bateu na parede de computação: para se tornar significativamente mais inteligente, você precisa de cada token de um nível de índice mais FLOPs.

Mistura de Especialistas 打破了这种关联──把每个FFN 替换成 `E`个独立专家 + 一个为每个 Token 选择 `k`个专家的路由器──总参数 = `E × FFN_size`△ Cada Token de atividade = `k × FFN_size` Configuração típica para 2026:`E=256`- Não .`k=8` armazenamento`E`扩展,计算随 `k`扩展──

A fronteira de 2026 ano  quase todo é MoE:DeepSeek-V3(671B total / 37B ativo) 、Mixtral 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss──

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 替换

Bloco de transformador denso:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

Bloco de MoE:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

Cada especialista é um FFN independente (geralmente SwiGLU) ― roteador é uma camada única `k`Os especialistas não conseguem obter a mistura fechada que os produz.

### balanço de carga 问题

Se o roteador deixar 90% dos tokens passar pelo especialista 3, outros especialistas vão morrer de fome. Já tentaram três formas de reparação:

1. **Auxiliary load-balancing loss**(Switch Transformer、Mixtral)。 Adicionar um com o perito Usage Rate Divergence into Correct Ratio of Punishment项── válido, mas vai adicionar um hiperparâmetro 和 segundo Gradiente 信号──
2. **Expert capacity + token dropping**(Switch) ∼ Cada especialista `C × N/E`个 Token;溢出的 Token 跳过该层──会损害质量──
3. **Auxiliary-loss-free balancing**(DeepSeek-V3)── adicionar um viés por perito que pode ser aprendido, usado para desviar o top-k seleção do roteador── viés em perda de treinamento.

Processo de Processo de Processo Profundo V3: após cada etapa de formação, cada especialista deve verificar se a sua utilização é alta ou baixa.`±γ`微调偏──选择时使用 `scores + bias` Probabilidades de peritos usadas em gating  ainda usam original não modificado `scores` This will routing with expression 解──

### Especialistas partilhados

DeepSeek-V2/V3 também divide os especialistas em *shared* e *routed*── cada token vai passar por todos os especialistas compartilhados──expertos rotados 通過 top-k 選──expertos rotados 捕獲通用知識;routed experts 负责专门化──V3 运行 1 expert shared,加上 256 路由专家中 top-8──

### Especialistas em grãos finos

经典 MoE(GShard、Switch): Cada especialista 和完整FFN 一样宽──`E`较小(8-64),`k`较小(1-2)。

现代 MoE de grãos finos ((DeepSeek-V3、Qwen-MoE): cada especialista 更狭(1/8 de tamanho FFN)`E`很大(256+),`k`Mais grande (8+) ◊                                                                                                                                                                                                                                                           `C(256, 8) = 400 trillion`种可能的每 Token 专家──质量提升,延迟 保持不变──

### 成本图片

Cada Token ∙ ∙ ∙ ∙ ∙

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 em quase todos os índices de referência 上都胜过 Llama 3 70B (densa), simultaneamente**每个 Token 使用更少的活跃 FLOPs**△更多参数 = 更多知识──更多活跃 FLOPs = Cada Token 更多计算──MoE将它们解──

### 代价: memória

Qualquer que seja o especialista que seja enviado, todos os especialistas devem permanecer na GPU. Um modelo 671B precisa de cerca de 1,3 TB de VRAM para armazenar pesos de fp16.


```figure
expert-routing
```

## Construí-lo

参见 `code/main.py`                                                                                                                                                                                                                                                              

- `n_experts=8`个近似 SwiGLU de especialistas(para facilitar a explicação, cada um apenas um linear)
- Top-k=2 roteamento
- Peso de abertura normalizado de softmax
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

### 步骤 1: roteador

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

Preconceito  influenciar a seleção, sem influenciar o peso da porta.

### 步骤 2: Deixe 100 Tokens através do roteador

Seguir os especialistas                                                                                                                                                                                                                                                             `-γ`, utilizando insuficientemente`+γ`) depois, a taxa de utilização será distribuída de forma media entre as várias gerações.

### 步骤 3: Parâmetros em relação à

印印一 MoE config 的 density equivalent──DeepSeek-V3 形状:256 roteado + 1 compartilhado,8 ativo,d_model=7168──总参数非常惊人──活跃参数只有密度Llama 3 70B 的七分之一──

## Use-o

Abraços Face

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

Inferência de produção de 2026: vLLM 原生支持 MoE routing──SGLang 拥有最快的专家-parallel path──两者都会自动处理顶级k 选择和专家平行──

**何时选择 MoE：**
- Você quer obter uma qualidade de fronteira em menor custo por token.
- Você tem infraestrutura paralela VRAM / especialista.
- Sua carga de trabalho é token-heavy(chat、code), e não contexto-heavy(longos documentos)。

**何时不要选择 MoE：**
- Deploição de bordo: você vai pagar o custo de armazenamento completo para qualquer FLOP ativo.
- Servidor de um único utilizador crítico para a latência: roteamento de peritos 会增加 Overhead──
- 小模型(<7B):O MoE de qualidade vantagem só vai aparecer em ultrapassar um determinado limite de computação ((cerca de 6B parâmetros ativos)

## Entrega-o

参见 `outputs/skill-moe-configurator.md`◊ esta habilidade irá ser aplicada em função do orçamento paramétrico, dos tokens de formação e do objetivo de implantação, para um novo design de MoE  选择 E、k 和 a disposição de especialistas compartilhados。

## 练习

1. **Easy.**运行 `code/main.py`◊ observar atualização de viés auxiliar sem perda 如何在50次代中拉平专家使用──
2. **Medium.**Utilize o router baseado em hash (definitividade, não precisa aprender) para substituir o router aprendido. Comparar qualidade e equilíbrio.
3. **Hard.**实现 GRPO-style rollout-matched routing(DeepSeek-V3.2 技巧): record inference 期间哪些专家被触发,在 Gradient 计算期间强制使用相同路由──在一个玩具政策-gradient设置 上测量效果──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538)A origem deste pensamento.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961)- O que é isso?
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) Mistura 8×7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + MoE sem perda auxiliar + MTP。
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664)  基于偏见的平衡论文──
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒+共享专家分分点──
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的共享专家论文──
