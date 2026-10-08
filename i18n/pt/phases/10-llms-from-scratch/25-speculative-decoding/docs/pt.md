# Descodagem especulativa e AEGLE

> A maioria das vezes, um modelo pequeno e muito grande pode adivinhar corretamente os próximos 3-5 Tokens, enquanto o modelo grande só precisa *verificar* essa adivinhação.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 问题

Modelo de classe 70B  Descodificação de rendimento em H100 normalmente é de 40-80 tokens/segundo. Cada token precisa de uma passagem completa para frente, de HBM  leitura de todos os pesos do modelo. Você não pode em caso de não mudar de saída.

A geração autoregressiva parece natural.`x_{t+1} = sample(p(· | x_{1:t}))`Mas aqui há uma oportunidade. Se tiveres um preditor barato, podes ter quatro tokens.**大 model 的单次 forward pass**Verifique todas as 5 posições, e aceite o maior correspondência.

Leviathan、Kalai、Matias(2023,Fast Inference from Transformers via Speculative Decoding) através de uma巧妙的接受/拒绝规则精确实现这一点,该规则保留目标模型的样本分布──相同的输出分布,速度提升 2-4x──

## 概念

### 双 Modelo  configuração

- **Target model** `M_p`Você realmente quer mudar de modelo de grande porte, lento, de alta qualidade.`p(x)`- Não.
- **Draft model** `M_q`Modelo de menor qualidade:`q(x)`- 5-30x.

Cada passo:

1. Projeto de modelo autoregressivamente 提议 `K`- Títulos:`x_1, x_2, ..., x_K ~ q`- Não.
2. Modelo-alvo para todos`K+1`个位置并行运行 一次前进通行,为每个提议 Token 生成 `p(x_k)`- Não.
3. 按下面修改后的拒绝-sampling规则 从左到右接受/拒绝 每个代币──接受最长匹配前──
4. Se qualquer Token for rejeitado, então a distribuição de modificações no caso de substituir o Token não parar.`p(· | x_1...x_K)`采样一个奖金代币──

Se o projeto se encaixa perfeitamente com o objetivo, você pode obter K + 1 Token. Se o projeto estiver na posição 1 está errado, você só pode obter 1 Token.

### 精确性规则

Descrição especulativa**在 distribution 上可证明等价于从 p 采样**❖ Rejeição 规则:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

Entre eles `(p - q)+`Expressão de valor de diferença de pontos.`p ≈ q`) , quando a aceitação  aproxima 1 ⋅ quando eles não coincidem, a distribuição residual será construída, para que a amostra inteira  ainda seja precisamente obedecida `p`- Não.

**Greedy 情况。**Para a amostragem de temperatura=0, só é necessário verificar`argmax(p) == x_t`Se sim, aceita; se não, sai.`argmax(p)`Não parou.

### 期望 Rapidez

Se a taxa de aceitação do modelo de projeto de Token 级 é `α`, então cada passagem de destino para frente 生成の期望トークン 数为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

- Não .`α = 0.8, K = 4`- Não .`(1 - 0.8^5)/(1 - 0.8) = 3.36`个 Token Cada vez para frente. 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个`cost_q * K + cost_p`(K 个 projeto passo加一次目标验证)`cost_p >> cost_q * K`, o índice de aceleração da produção é`3.36× / 1 = 3.36×`- Não.

O único parâmetro real é`α`Depende completamente da alinhamento entre o projecto e o alvo.

### 训练 Draft:Destilação

随机的小模型会成为非常差的草案―― o método padrão é a destilação de destino:

1. 选择一个小建筑(70B objetivo para aproximadamente 1B,7B objetivo para cerca de 500M)
2. Em grande escala, o texto é executado em um modelo-alvo; armazenar suas distribuições de tokens seguintes.
3. Utilize KL divergência  тренинг чертеж, fazer sua correspondência distribuição do alvo (((em vez de correspondência tokens de verdade de base) 👇

O resultado é:`α`Em codificação, normalmente é de 0,6-0,8, em natural language chat, é de 0,7-0,85── em produção, é de 2-3x──

### A ÁGuila:Drafting de árvore + Reutilização de características

Li、Wei、Zhang、Zhang(2024,AGAGLE: Especulativa Amostragem Requer Rethinking Feature Uncertainty) observar a padrão de descodificação especulativa 中的两个低效点:

1. Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
2. Draft 输出一条线性链──若草案 能输出一个候选人 *tree*(每个节点有多个猜测),target的单次进步通过树注意面具并行验证多条候选人路径,并选择最长接受分支──

A mudança de Eagle-1:
- Draft input = alvo em seu estado oculto final, em vez de tokens brutos.
- Arquitetura de projeto = 1 个变压器解码器层(不是独立的小模型) ⋅
- Output = cada profundidade tem K = 4-8 candidatos 、 profundidade 为 4-6 de árvore。

EAGLE-2(2024) 加入动态树拓科:在草案不确定位置,树变宽;在草案自信的位置,树保持较窄──在不增加验证成本的情况下提高 `α_effective`- Não.

EAGLE-3(Li et al. 2025,EAGLE-3: Escalada de aceleração de inferência de grandes modelos de linguagem através de treinamento-tempo Test) removeu a dependência de recursos de camada superior fixa,并用新test-time simulation loss 训练草案,也就是让在匹配的目标试题时间分布的输出上训练,而不是在教师强制训分配上训练──接受率从0.75(EAGLE-2)升至0.82(EAGLE-3),mean tokens/verificar 3.0 从升至4.5:

### Verificação da Atenção à Árvore

Quando projeto 输出树 时,target model **tree attention mask**Em um único passado para frente, verifique-se que a máscara de atenção da árvore é uma máscara causal, que codifica a topologia da árvore, e não a estrutura linear pura. Em cada token, apenas se atende aos antepassados que a encontram no árvore.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

Se `a, b`É o primeiro candidato da competição,`c, d, e, f`É o segundo token candidatos, então todas as seis posições são verificadas em uma passagem avançada.

### Que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é

**有效：**
- Chat / completamento, e文本可预测(código、常见英语、output estruturado)`α`- Não.
- Decodificação 阶段有未使用GPU computação de configuração (memória-bound phase) ――Tree drafting 使用可用FLOPs──

**无效 / 没有收益：**
- 高随机性输出( alta temperatura de escrita criativa)`α`- Eu vou .`1/|vocab|`Baixa-te.
- Muito alta concurência de batches, batches já preenchidos, verificação de árvores.
- Modelos de alvo muito pequenos, neste momento, o projeto não tem muito.

Os grupos de produção geralmente relatam chat, há 2-3x de velocidade do relógio de parede, geração de código, há 3-5x, enquanto a escrita criativa, está perto de zero.


```figure
speculative-decoding
```

## Construí-lo

`code/main.py`- Não .

- Uma referência para a realização`speculative_decode(target, draft, prompt, K, temperature)`, realiza a rejeição precisa 规则,并验证它保留目标的分布(empírica KL < 0.01 vs. simples amostragem de alvo)
- Um desenhador de árvore de estilo EAGLE, usando ramificação de p-top 构建深度-K tree──
- Um fabricante de máscara de atenção para árvores, para verificar o desenho causal.
- Um arame de taxa de aceitação, em pequena LM 上运行两者(do objetivo GPT-2-médio destilar um GPT-2-pequeno)

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## Use-o

- **vLLM**和 **SGLang**提供一等 descodificação especulativa 支持──Bandês:`--speculative_model`- Não.`--num_speculative_tokens`- É o que eu quero.`--spec_decoding_algorithm eagle`bandeira 支持。
- **NVIDIA TensorRT-LLM**Os árvores de Medusa e ÁGuila.
- **Reference draft models**- Não .`Qwen/Qwen3-0.6B-spec`(Para utilização em projetos de Qwen3-32B)`meta-llama/Llama-3.2-1B-Instruct-spec`(Para uso em projetos de 70B)
- **Medusa heads**(Cai et al. 2024,Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads): não utiliza modelo de projeto, mas em objetivo 自身 添加 K 个并行预测 heads──部署更简单,acceptance 略低于EAGLE──

## Entrega-o

本课会产出 `outputs/skill-speculative-tuning.md`, é uma habilidade, usada para analisar a carga de trabalho do modelo-alvo,并选择:draft model、K(draft length)、tree width、temperature,以及何時 fallback até decodear simples。

## 练习

1. 实现精确拒绝 规则并进行实证验证──通过 `speculative_decode`和 simples amostragem de alvo 分別运行 10K amostras; calcular duas distribuições de saída 间 TV distância──应小于0.01──

2. 計算 speedup 公式──给定固定 `α`和 `K`, desenhar cada vez o objetivo-para-a frente de expectativas Token números── encontrar o ∈ α {0,5, 0,7, 0,9} 时的最优 K──

3. Treinar um pequeno esboço. Tome um alvo de 124M GPT-2, e coloque 100M tokens.`α` Previsão: 0,6-0,7

4. 实现EAGLE-style tree drawing── não usar cadeia, mas sim fazer o desenho em cada profundidade 输出 top-3 ramos── construir a máscara de atenção da árvore──验证 target 接受最长正确 ramos──

5. 测量 failure modes──在 temperature=1.5(高随机性) 下运行 especulativo decodificar──展示 α 崩塌,并且由于草案 overhead,该算法比平面 decodificar 更慢──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind s simultânea especulativa de amostragem 论文
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) projecto de modelo de cabeças paralelas  substitução
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) reutilização de características 和 desenho de árvores
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态 Topologia de árvores
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) correspondência entre o tempo de ensaio e o tempo de trem
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) Jacobi/lookahead decodificação, um tipo de alternativa não precisa de especulador
