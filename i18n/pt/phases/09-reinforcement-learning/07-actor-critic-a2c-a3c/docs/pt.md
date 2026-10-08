# Actor-Critico  A2C e A3C

> Reforça muito barulho.`V̂(s)`O crítico, de retorno, em redução, você obtém uma expectativa semelhante, mas variância muito menor vantagem.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 04 (TD Learning), Phase 9 · 06 (REINFORCE)
**Time:** ~75 分钟

## 问题

Vanilla ReINFORCE 能工作, mas a sua variação 很糟──Monte Carlo volta `G_t`Entre os diferentes episódios, pode haver 10 vezes mais de variação.`∇ log π`A média é de produzir um estimador de gradiente, que requer milhares de episódios para impulsionar a política com poucas atualizações de DQN para alcançar a distância.

variação de utilização de retornos brutos. Se você diminuir uma linha de base`b(s_t)`Função de qualquer estado, incluindo o valor aprendido, expectativa  manter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `V̂(s_t)`Agora, vamos para o outro lado.`∇ log π`A quantidade é a vantagem.

`A(s, a) = G - V̂(s)`

Se uma ação  produz um retorno superior à média, é bom; se inferior à média, é diferente.

## 概念

![Actor-critic: policy net plus value net, TD residual as advantage](../assets/actor-critic.svg)

**两个 networks，一个 shared loss：**

- **Actor** `π_θ(a | s)`A política é a exemplo de uma acção.
- **Critic** `V_φ(s)`A estimativa de retorno esperado do estado é minimizada.`(V_φ(s) - target)²`- Treinamento.

**Advantage。**两种标准形式:

- *Vantagem MC:* `A_t = G_t - V_φ(s_t)`Não é imparcial, variação é maior.
- *Vantagem TD:* `A_t = r_{t+1} + γ V_φ(s_{t+1}) - V_φ(s_t)`△ biassadas △`V_φ`),variância 低得多──也叫 *TD residual* `δ_t`- Não.

**n-step advantage。**Entre os dois valores:

`A_t^{(n)} = r_{t+1} + γ r_{t+2} + … + γ^{n-1} r_{t+n} + γ^n V_φ(s_{t+n}) - V_φ(s_t)`

`n = 1`É uma pura TD.`n = ∞`É MC. A maioria das implementações está no Atari.`n = 5`, em uso de MuJoCo PPO `n = 2048`- Não.

**Generalized Advantage Estimation (GAE)。**Schulman et al. (2016)  propôs para todas as vantagens de n-passo fazer uma média ponderada exponencialmente:

`A_t^{GAE} = Σ_{l=0}^{∞} (γλ)^l δ_{t+l}`

Entre eles `λ ∈ [0, 1]`- Não.`λ = 0`É TD ((baixa variância, alto viés)`λ = 1`É MC(alta variância, imparcial)`λ = 0.95`É o valor de 2026: Continuar a ajustar até que o dial de variação/bias chegue à posição que você quer.

**A2C：synchronous advantage actor-critic。**Em`N`个 ambientes paralelos 上收集 `T`passos── para cada passo  calcular vantagens── em lote combinado 上更新 actor 和 critic──重复── é A3C 更简单、更可扩展的兄弟──

**A3C：asynchronous advantage actor-critic。**Mnih et al. (2016)。 iniciação `N`个 worker threads, cada thread 运行一个 env── cada worker 在自己的推出上本地计算梯度,然后异步 应用到共享参数服务器──不需要重复缓冲:workers 通过运行不同轨迹来去解调──A3C 证明了你可以在CPU上规模培训──到2026年,GPU-based A2C(batched parallel envs)占主导,因为 GPUs 需要大批量──

**Combined loss。**

`L(θ, φ) = -E[ A_t · log π_θ(a_t | s_t) ]  +  c_v · E[(V_φ(s_t) - G_t)²]  -  c_e · E[H(π_θ(·|s_t))]`

Três: perda de política-gradiente, regressão de valor, bônus de entropia.`c_v ~ 0.5`- Não.`c_e ~ 0.01`É um ponto de partida canônico.


```figure
actor-critic
```

## Construí-lo

### Passo 1: um crítico

Crítico linear `V_φ(s) = w · features(s)`Utilize MSE 更新:

```python
def critic_update(w, x, target, lr):
    v_hat = dot(w, x)
    err = target - v_hat
    for j in range(len(w)):
        w[j] += lr * err * x[j]
    return v_hat
```

Em env tabular, críticos 会在几百个节目内收──在 Atari 上,把线性评论者 换为共享CNN 库 +值头──

### Passo 2: vantagem de n-passo

给定长度为 `T`O lançamento e a final de arranque`V(s_T)`- Não .

```python
def compute_advantages(rewards, values, gamma=0.99, lam=0.95, last_value=0.0):
    advantages = [0.0] * len(rewards)
    gae = 0.0
    for t in reversed(range(len(rewards))):
        next_v = values[t + 1] if t + 1 < len(values) else last_value
        delta = rewards[t] + gamma * next_v - values[t]
        gae = delta + gamma * lam * gae
        advantages[t] = gae
    returns = [a + v for a, v in zip(advantages, values)]
    return advantages, returns
```

`returns`É um alvo crítico.`advantages`É o que se passa .`∇ log π`O conteúdo.

### Passo 3: atualização combinada

```python
for step_i, (x, a, _r, probs) in enumerate(traj):
    adv = advantages[step_i]
    target_v = returns[step_i]

    # critic
    critic_update(w, x, target_v, lr_v)

    # actor
    for i in range(N_ACTIONS):
        grad_logpi = (1.0 if i == a else 0.0) - probs[i]
        for j in range(N_FEAT):
            theta[i][j] += lr_a * adv * grad_logpi * x[j]
```

Na política, cada atualização, uma implementação, ator e crítico utilizam taxas de aprendizagem separadas.

### Passo 4: paralelação (A3C vs. A2C)

- **A3C：** iniciação `N`个线程── cada thread 运行自己的env 和自己的前进通行──周期性地把 Gradient updates 推送到共享 master──master 上不加锁:races 没关系,它们只是增加噪声──
- **A2C：**Em processo único , em funcionamento .`N`个 env instâncias,把 observações empilhada 成 `[N, obs_dim]`Batch, executa batch passado para frente, batch passado para trás, utilização de GPUs, mais alta, determinista, mais fácil de fazer.

O código de brinquedo é simples, só precisamos de três linhas de Numpy.

## Encurralagens

- **Critic bias before actor gradient。**Se o crítico é aleatório, a sua linha de base é de não ter informação, enquanto você está em pura ruído, em treino. Primeiro aqueça o crítico, reabre o gradiente de política, ou use uma taxa de aprendizagem mais lenta do ator.
- **Advantage normalization。**Em cada lote, as vantagens se normalizam para zero-médio/unidade-std.
- **Shared trunk。**Para entrada de imagem, para actor 和 crítico Utilize extractor de recursos compartilhados.
- **On-policy contract。**A2C para dados precisamente repetir com uma atualização.
- **Entropy collapse。**Não há nada .`c_e > 0`Quando a política vai ser atualizada, a política vai ficar determinista e não vai explorar.
- **Reward scale。**Grandes vantagens dependem da escala de recompensa. Normalize recompensas, por exemplo, exceto para executar, para manter a concordância entre as diferentes tarefas.

## Usá-lo

A2C/A3C em 2026 é raramente a escolha final, mas são a base de todos os refinamentos de arquitetura posteriores:

| Method | Relation to A2C |
|--------|----------------|
| PPO | A2C + clipped importance ratio for multi-epoch updates |
| IMPALA | A3C + V-trace off-policy correction |
| SAC (Phase 9 · 07) | Off-policy A2C with a soft-value critic (next lesson) |
| GRPO (Phase 9 · 12) | A2C without the critic — group-relative advantage |
| DPO | A2C collapsed into a preference-ranking loss, no sampling |
| AlphaStar / OpenAI Five | A2C with league training + imitation pre-training |

Se verem vantagens no jornal de 2026, pensem em críticos de actores.

## Envia-o

保存为 `outputs/skill-actor-critic-trainer.md`- Não .

```markdown
---
name: actor-critic-trainer
description: 为给定 environment 生成 A2C / A3C / GAE configuration，并指定 advantage estimation 和 loss weights。
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

给定一个 environment 和 compute budget，输出：

1. Parallelism。A2C（GPU batched）vs A3C（CPU async）以及 workers 数量。
2. Rollout length T。每个 env 每次 update 的 steps。
3. Advantage estimator。n-step 或 GAE(λ)；指定 λ。
4. Loss weights。`c_v`（value）、`c_e`（entropy）、gradient clip。
5. Learning rates。Actor 和 critic（如果使用则分开）。

拒绝在 horizon > 1000 的 environments 上使用 single-worker A2C（太 on-policy，太慢）。拒绝在没有 advantage normalization 的情况下交付。把任何 `c_e = 0` 且 observed entropy < 0.1 的 run 标记为 entropy-collapsed。
```

## Exercícios

1. **Easy。**Em 4×4 GridWorld 上 usar MC vantagem(`G_t - V(s_t)`O estudo de desempenho de um grupo de actors-criticos foi concluído em uma análise de resultados de uma análise de desempenho de um grupo de actors-criticos.
2. **Medium。**切换到 TD-residual advantage (a vantagem residual TD-residual advantage)`r + γ V(s') - V(s)`(■■) A variação dos lotes de vantagem de medida■■
3. **Hard。**实现 GAE(λ)。扫描 `λ ∈ {0, 0.5, 0.9, 0.95, 1.0}`◊ desenhar o retorno final vs eficiência da amostra.

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Actor | “Policy net” | `π_θ(a\|s)`，由 policy gradient 更新。 |
| Critic | “Value net” | `V_φ(s)`，通过对 returns / TD targets 做 MSE regression 更新。 |
| Advantage | “比平均好多少” | `A(s, a) = Q(s, a) - V(s)` 或它的 estimators。`∇ log π` 的 multiplier。 |
| TD residual | “δ” | `δ_t = r + γ V(s') - V(s)`；one-step advantage estimate。 |
| GAE | “插值旋钮” | n-step advantages 的 exponentially weighted sum，由 `λ` parameterized。 |
| A2C | “Synchronous actor-critic” | 跨 envs batching；每个 rollout 做一次 Gradient step。 |
| A3C | “Async actor-critic” | Worker threads 把 gradients 推送到 shared param server。Original paper；2026 年较少见。 |
| Bootstrap | “在 horizon 使用 V” | 截断 rollout，添加 `γ^n V(s_{t+n})` 来闭合求和。 |

## Mais leitura

- [Mnih et al. (2016). Asynchronous Methods for Deep Reinforcement Learning](https://arxiv.org/abs/1602.01783) A3C, inicial papel crítico-actor sincronizado
- [Schulman et al. (2016). High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438) GAE。
- [Sutton & Barto (2018). Ch. 13 — Actor-Critic Methods](http://incompleteideas.net/book/RLbook2020.pdf) fundamentos; quando crítico é Rede Neural 时,把它和 Ch. 9 de função aproximação 配套阅读。
- [Espeholt et al. (2018). IMPALA](https://arxiv.org/abs/1802.01561) escalabilidade distribuída de actor-crítica com correcção de fora de política de rastreamento V。
- [OpenAI Baselines / Stable-Baselines3](https://stable-baselines3.readthedocs.io/) 值得阅读的生产 A2C/PPO implementações。
- [Konda & Tsitsiklis (2000). Actor-Critic Algorithms](https://papers.nips.cc/paper/1786-actor-critic-algorithms) resultado de convergência fundamental da decomposição ator-crítica em duas escalas.
