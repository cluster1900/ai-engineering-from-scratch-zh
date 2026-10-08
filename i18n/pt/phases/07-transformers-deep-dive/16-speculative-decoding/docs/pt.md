# Descodagem especulativa  Projeto 、 Verificar 、 Repetição

> A descodificação autoregressiva é uma série de linhas. Cada token precisa esperar para o primeiro token. A descodificação especulativa rompeu esta cadeia: um modelo barato primeiro projeta N 个 token, um modelo caro em uma única passagem para frente.

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 07 (GPT Causal LM), Fase 7 · 12 (KV Cache & Flash Attention)
**Time:** ~60 minutes

## 问题

Um 70B LLM em H100 上采采样一个代币 需要约30ms──一个3B草案模型 需要约3ms──如果让3B草案提前生成5代币,然后让70B *只运行一次*来验证这5代币,总耗时就是`5×3 + 30 = 45 ms`, o máximo aceitável 5 Tokens; e diretamente gerar necessários `5×30 = 150 ms`︎ é o ponto de venda completo da descodificação especulativa: usando uma pequena quantidade extra de memória GPU (modelo de projeto) em troca de 24× mais baixa latência de decodificação︎

关键在必须保留分布──Leviathan et al. (2023) 以及 Chen et al. 同期提出的投机样本保证输出序列与大模型单独生成时的分布**完全相同**Não há um volume de folga.

Até 2026, quatro tipos de verificadores de projetos

1. **Vanilla speculative (Leviathan 2023)。**独立草案模型 (Llama 3 1B) + verificador (Llama 3 70B) 
2. **Medusa (Cai 2024)。**Em verificador cima adicionar vários cabeçalhos de decodificação,并行预测位置 `t+1..t+k`Não é necessário um modelo de projeto independente.
3. **EAGLE family (Li 2024, 2025)。**复用验证器 hidden states 的轻量草案; 接受率比香更接近;典型为34×。
4. **Lookahead decoding (Fu 2024)。**Iteração Jacobi; totalmente não precisa de modelo de projeto.

Cada estaca de inferência de produção de 2026 anos estão em conformidade fornecer Descodagem Especulativa.

## 核心概念

### 核心算法

给定一个验证器 `M_q`E um projecto mais barato.`M_p`- Não .

1. Que`x_1..x_k`Por já descifrado.
2. **Draft**: utilização `M_p`autoregressivamente 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`, para lidar com os projetos de probabilidades`p_1..p_N`- Não.
3. **并行 verify**- Não .`x_1..x_k, d_{k+1}, ..., d_{k+N}`- Não .`M_q`- Não .`k+1..k+N+1`de probabilidades de verificação `q_1..q_{N+1}`- Não.
4. **从左到右 accept/reject 每个 draft token**Para cada um .`i`, em probabilidade`min(1, q_i(d_i) / p_i(d_i))`- Aceitação.
5. Em posição`j`Primeira rejeição: distribuição "residual" da regeneração posterior.`(q_j - p_j)_+`- Não .`t_j`- Não.`j`Depois, todos os projetos foram abandonados.
6. Se tudo .`N`个都被接受: de `q_{N+1}`采样一个额外 Token `t_{N+1}`(título de bônus gratuito)

Distribuição residual Esta técnica é fazer distribuição de saída com`M_q`A partir do princípio, um teor matemático totalmente harmonioso.

### O que é que se resolve ?

Que`α`= taxa de aceitação esperada de cada projeto de token.`c`= relação custo-projeto-verificador:

- Geração ingênua Cada token precisa de um grande modelo de chamada.
- - Não .`α`Muito bem, especulativo.`(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`- Títulos. - Preciso de um grande modelo.

Em`α = 0.75`且 `N = 5`时,典型经验法则是:big-model call 减少 3×──Draft cost is 5× cheap──总体墙-clock 约下降 2.5×──

**α 取决于：**

- A aproximação do projeto ao verificador, com os dados familiares/formação, aumentará significativamente.
- Estratégia de decodificação. Draft avariado.
- Tipo de tarefa;; Código e saída estruturada  接受更多(更可预测); 自由形式创意写作接受更少──

### Medusa  没有草案模型 的草案

Medusa Utilizador verificador                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `t`- Não .

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

Cada cabeça output seus próprios logits ∞ Inferência ∞, você de cada cabeça ∞ recebe a sequência de candidatos, e depois usar uma passagem para frente 和 árvore-atenção esquema 同时考虑所有候选继续来验证──

优点:没有第二个模型──缺点: aumentar os parâmetros treinables; precisa de um ajuste fino supervisionado 阶段(约1B Token); taxa de aceitação 比使用优秀草案的 vanila especulativo 略低──

### A ÁGuila                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

EAGLE-1/2/3 (Li et al., 20242025) irá projetar o modelo designado para um transformador muito pequeno (normalmente 1 camada), para inserir estados ocultos da última camada do verificador.

EAGLE-3 (2025)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

### Dança de cache KV

Verificação`N`个草案代币 在一次前进通中给验证器──这将将验证器的KV缓存 扩展 `N`项── Se algum projeto for rejeitado, você deve colocar o cache de volta para a comprimento do prefixo aceito──

Produção de realização`--speculative-model`、TensorRT-LLM's LookaheadDecoder) através de raspar os buffers KV 处理 this thing──先写入,接受时再 commit──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

## Construí-lo

- Não .`code/main.py` Nós utilizamos os seguintes componentes para implementar o algoritmo de amostragem especulativa central:

- Um "modelo grande", é determinista-softmax distribuída em manuscrito, assim pode ser analisado a matemática de aceitação)
- Um "modelo de projeto", é uma versão perturbada do grande modelo.
- Uma distribuição marginal semelhante ao de amostragem directa, gerada por um ciclo de aceitação/rejeição.

### 步骤 1: passo de rejeição

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`É um número aleatório uniforme.`q_prob`É verificador para probabilidade de token redigido.`p_prob`É a probabilidade do modelo de projeto. O teorema de Leviathan observa que, com a decisão de Bernoulli, a rejeição da análise residual pode ser rigorosamente mantida na distribuição do verificador.

### 步骤 2: Distribuição residual

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `q`- Não .`p`, vai apertar o valor negativo até zero, e depois reintegrar.

### 步骤 3: um passo especulativo

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个奖金 → 一次验证通过 生成六个代币──

### 步骤 4: Métido taxa de aceitação

Em diferentes projetos de qualidade 水平下运行 10,000 个投机步骤―― desenhar a taxa de aceitação com o projeto 和 verificador Distribuir relações de divergência entre KL―― você deve ver uma relação clara de união――

### 步骤 5: Verificação de distribuição de preços

 تجرب验证:loop especulativo 生成的Token 直方图应匹配直接从验证器采样得到的直方图――这是实践中的利维亚坦定理――Chi-square test 会确认差异在样本错误范围内――

## Use-o

Produção:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

截至2026年中,TensorRT-LLM 拥有最快的梅杜萨路──`faster-whisper`Por um grande sussurro, encodei um pequeno rascunho de "Descodagem Especulativa".

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- Apenas gerar 15 个 Token de geração de sequência única.
- 极具创意 / Amostra de alta temperatura ((α 会下降) ⋅
- Deploições com restrições de memória (Draft Model 会增加 VRAM)

## Entrega-o

- Não .`outputs/skill-spec-decode-picker.md`◊ esta habilidade 会为新推理工作负载 选择一种Speculative Decoding strategy (Vanila / Medusa / EAGLE / Lookahead)

## 练习

1. **Easy。**运行 `code/main.py` Confirmar em 50.000 Token 上, distribuição especulativa de tokens coincide com a distribuição de amostra direta do verificador, e p = 0,05 ⋅
2. **Medium。**Para o`α = 0.5, 0.7, 0.85`, desenhar velocidade ((( cada vez grande modelo para a frente de Token número)`N`De variação. Encontrar o melhor de cada α.`N`◊(Ponto: cada vez verifique chamada ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`(1 - α^{N+1}) / (1 - α)`◊)
3. **Hard。**实现一个小米杜萨:取课14的顶石GPT,添加3个额外LM头,分别预测位置 t+2、t+3、t+4──在小摇钱树上用联合多头损失训练──与通过截断同一个模型得到的香草草比较接受率──
4. **Hard。**实现 rollback: de um prefixo KV cache de 10 tokens 开始,入 5 个草案代币,模拟在位置 3 rejeição。验证下一轮代时你的缓存 读取结果正确匹配 "prefixo + primeiro 2 projectos aceitos"。

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等式定理──
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出; klar klar klar of Bernoulli-rejeição 证明──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774)Medusa 论文; árvore-atenção 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) EAGLE-1; baseado em estado oculto 条件の草案。
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) ÁGLA-2; profundidade dinâmica da árvore。
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840)- A ÁGuila 3...
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057)Olhe para o lado, não há um projecto.
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html)                                                                                                                                                                                                                                                              
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) Referência código de EAGLE-1/2/3
