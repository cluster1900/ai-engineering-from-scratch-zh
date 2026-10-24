# Programação Dinâmica  Iteração de Política e Iteração de Valor

> A programação dinâmica é a RL. Você já sabe as funções de transição e recompensa; você só precisa de repetir a equação Bellman, até que você saiba.$V$Ou $\pi$Não se altera mais. É um método baseado em amostras que todos tentam aproximar-se da base.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 9 · 01 (MDPs)
**Time:** ~75 minutes

## 问题

Você tem um modelo conhecido de MDP: você pode fazer qualquer par de ação de estado  consulta $P(s' \mid s, a)$和 $R(s, a, s')$ Gestores de estoque sabem a necessidade de distribuição  jogos de tela têm transições definidas  GridWorld apenas precisa de quatro linhas Python  você tem um *modelo* 

RL livre de modelos ((Q-learning、PPO、REINFORCE) é uma situação desenvolvida por não ter modelos, ou seja, você só pode samplar do ambiente. Mas quando você realmente tem um modelo, há métodos mais rápidos e melhores: programação dinâmica. Bellman concebeu esses métodos em 1957.

Você ainda precisa deles em 2026 ano, por causa de três pontos. Primeiro, a pesquisa de RL em cada ambiente tabular (GridWorld, FrozenLake, CliffWalking) vai usar DP para obter soluções, para gerar uma política padrão ouro.$V^{\ast}(s_0)$A avaliação com a DP 答案相差 30%, seu Q-learning já tem um bug.

## 概念

![Policy iteration and value iteration, side by side](../assets/dp.svg)

**两个算法，都是 Bellman 上的 fixed-point iteration。**

**Policy iteration。**交替执行两步,直到政策不再变――

1. *Evaluation:* 给定 policy $\pi$,反复应用 $V(s) \leftarrow \sum_a \pi(a \mid s) \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]$, até receber, assim calcular.$V^\pi$- Não.
2. * Melhoria:* 给定 $V^\pi$,让 $\pi$Comparado com$V^\pi$变为贪:$\pi(s) \leftarrow \arg\max_a \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]$- Não.

Receber é ter garantia, porque (a) cada passo de melhoria deve ser mantido$\pi$Não mudam, ou devem ser rigorosamente melhorados certos estados $V^\pi$,(b) O espaço das políticas deterministas é limitado. Mesmo em grandes espaços de estado, normalmente também ocorrem em cerca de 520 vezes iteras externas.

**Value iteration。**A avaliação e melhoria serão combinadas em uma análise.

```math
V(s) \leftarrow \max_a \sum_{s',r} P(s',r \mid s,a) [r + \gamma V(s')]
```

- Não .$\max_s \lvert V_{\text{new}}(s) - V(s) \rvert < \epsilon$◊                                                                                                                                                                                                                                                              

**Generalized policy iteration (GPI)。**统一视角──Valor função 和 política são bloqueados em um ciclo de melhoria bidirecional; qualquer simultaneamente promover os dois dos dois em um método coerente [[Iteração de valores asíncronos]], Iteração de políticas modificadas, Q-learning, actor-crítica, POP) são um exemplo de GPI──

**为什么 $\gamma < 1$ 很重要。**Operador Bellman em sup-norma$\gamma$- contracção:$\lVert T V - T V' \rVert_\infty \le \gamma \lVert V - V' \rVert_\infty$Contratação significa único ponto fixo 和几何收──$\gamma < 1$, tu já perdeste a garantia, precisa de um horizonte finito ou de um estado terminal absorvente.

```figure
value-iteration-gamma
```

## 动手构建

### Passo 1: 构建 GridWorld MDP model

Utilize Lesson 01 中同样4×4 GridWorld──我们添加一个 stochastic 变体:agent 以 `0.1`A probabilidade de deslocamento é de uma direcção vertical.

```python
SLIP = 0.1

def transitions(state, action):
    if state == TERMINAL:
        return [(state, 0.0, 1.0)]
    outcomes = []
    for direction, prob in action_probs(action):
        outcomes.append((apply_move(state, direction), -1.0, prob))
    return outcomes
```

`transitions(s, a)` Retorno `(s', r, p)`É o modelo inteiro.

### Passo 2: Avaliação das políticas

给定政策 `π(s) = {action: prob}`, 代 Bellman equação, até $V$Não se alteram:

```python
def policy_evaluation(policy, gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = sum(pi_a * sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a))
                   for a, pi_a in policy(s).items())
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            return V
```

### Passo 3: Melhoria das políticas

Usado em relação a$V$A política gananciosa$\pi$Se eu...$\pi$Não há mudança, vamos voltar, porque já chegamos ao óptimo.

```python
def policy_improvement(V, gamma=0.99):
    new_policy = {}
    for s in states():
        best_a = max(
            ACTIONS,
            key=lambda a: sum(p * (r + gamma * V[s_prime])
                              for s_prime, r, p in transitions(s, a)),
        )
        new_policy[s] = best_a
    return new_policy
```

### Passo 4: 组合起来

```python
def policy_iteration(gamma=0.99):
    policy = {s: "up" for s in states()}   # arbitrary start
    for _ in range(100):
        V = policy_evaluation(lambda s: {policy[s]: 1.0}, gamma)
        new_policy = policy_improvement(V, gamma)
        if new_policy == policy:
            return V, policy
        policy = new_policy
```

Em 4×4 上典型会在 46次外回复 内收──输出 $V^{\ast}(0,0) \approx -6$, e uma política de redução rigorosa do número de passos.

### Passo 5: Iteração de valor (单 loop 版本)

```python
def value_iteration(gamma=0.99, tol=1e-6):
    V = {s: 0.0 for s in states()}
    while True:
        delta = 0.0
        for s in states():
            v = max(sum(p * (r + gamma * V[s_prime])
                       for s_prime, r, p in transitions(s, a))
                   for a in ACTIONS)
            delta = max(delta, abs(v - V[s]))
            V[s] = v
        if delta < tol:
            break
    policy = policy_improvement(V, gamma)
    return V, policy
```

O mesmo ponto fixo, menor número de código-fonte.

## 常见陷

- **忘记处理 terminals。**Se você aplicar o estado de absorção Bellman, ele ainda vai obter uma ação melhor que nada mudar.`if s == terminal: V[s] = 0`- Proteção.
- **Sup-norm vs L2 convergence。**Utilização `max |V_new - V|`Não use o valor médio. A garantia teórica é sup-norma.
- **In-place vs synchronous updates。**Originally actualizada `V[s]`(Gauss-Seidel) Comparado ao uso individual`V_new`dict(Jacobi)收更快──Código de produção Utilize in-place──
- **Policy ties。**Se duas ações tiverem o mesmo valor Q,`argmax`Possivelmente, cada iteração, usando diferentes formas de romper a situação, conduzirá à estabilidade da política, à revisao de balanços, à utilização de uma relação estável, à primeira ação da ordem fixa.
- **State-space explosion。**DP cada vez que varrer é$O(\lvert S \rvert \cdot \lvert A \rvert)$◊ o mais utilizado em cerca de 107 estados.


## Use-o

Em 2026, o DP é o verdadeiro ponto de partida, também o ciclo interno dos planejadores:

| Use case | Method |
|----------|--------|
| 精确求解小型 tabular MDP | Value iteration（更简单）或 policy iteration（outer steps 更少） |
| 验证 Q-learning / PPO 实现 | 在 toy environment 上与 DP-optimal $V^{\ast}$ 对比 |
| Model-based RL（Phase 9 · 10） | 在 learned transition model 上做 Bellman backup |
| AlphaZero / MuZero 中的 Planning | Monte Carlo Tree Search = async Bellman backup |
| Offline RL（CQL、IQL） | Conservative Q-iteration，即带有 OOD actions penalty 的 DP |

Quando alguém diz que a função de valor ideal é o ponto fixo do DP, quando você vê no artigo$V^{\ast}$Ou $Q^{\ast}$Por favor, imagine este ciclo.

## Entrega-o

保存为 `outputs/skill-dp-solver.md`- Não .

```markdown
---
name: dp-solver
description: 通过 policy iteration 或 value iteration 精确求解小型 tabular MDP。报告收敛行为。
version: 1.0.0
phase: 9
lesson: 2
tags: [rl, dynamic-programming, bellman]
---

给定一个已知 model 的 MDP，输出：

1. 选择。Policy iteration vs value iteration。理由需关联 |S|、|A|、γ。
2. 初始化。V_0、starting policy。Convergence sensitivity。
3. 停止条件。Sup-norm tolerance ε。预期 sweeps 数。
4. 验证。精确计算的 V*(s_0)。提取出的 Greedy policy。
5. 使用方式。这个 baseline 将如何用于 debug/evaluate sampling-based methods。

拒绝在 state spaces > 10⁷ 上运行 DP。没有 sup-norm check 时，拒绝声称收敛。将 infinite-horizon task 上任何 γ ≥ 1 标记为 guarantee violation。
```

## 练习

1. **Easy.**Em 4×4 GridWorld $\gamma \in \lbrace 0.9, 0.99 \rbrace$运行 valor Iteração──直到 $\max \lvert \Delta V \rvert < 10^{-6}$Quantas vezes é preciso varrer?$V^{\ast}$Impressão para 4×4 grid.
2. **Medium.**Na *stochastic* GridWorld(slip probabilidade `0.1`) acima comparar a iteração de política 和 a iteração de valor.$V^{\ast}(0,0)$Qual das iterações é mais rápido?
3. **Hard.**构建修改政策反复:在评估阶段 中,只运行 $k$O segundo varre, em vez de operar até receber.$k \in \lbrace 1, 2, 5, 10, 50 \rbrace$ desenho $V^{\ast}(0,0)$erro vs $k$ esta curva  diz-te que informação de avaliação/melhora tradeoff?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Policy iteration | “DP algorithm” | 交替进行 evaluation（$V^\pi$）和 improvement（相对于 $V^\pi$ 的 greedy $\pi$），直到 policy 不再变化。 |
| Value iteration | “Faster DP” | Bellman optimality backup 在一次 sweep 中应用；几何收敛到 $V^{\ast}$。 |
| Bellman operator | “The recursion” | $(T V)(s) = \max_a \sum P (r + \gamma V(s'))$；sup-norm 下的 $\gamma$-contraction。 |
| Contraction | “Why DP converges” | 任何满足 $\lVert T x - T y \rVert \le \gamma \lVert x - y \rVert$ 的 operator $T$ 都有唯一 fixed point。 |
| GPI | “Everything is DP” | Generalized Policy Iteration：任何推动 $V$ 和 $\pi$ 达到相互一致的方法。 |
| Synchronous update | “Jacobi-style” | 在一次 sweep 中始终使用旧的 $V$；便于清晰分析，但更慢。 |
| In-place update | “Gauss-Seidel-style” | 使用正在被更新的 $V$；实践中收敛更快。 |

## 延伸阅读

- [Sutton & Barto (2018). Ch. 4 — Dynamic Programming](http://incompleteideas.net/book/RLbook2020.pdf) Iteração de política 和 Iteração de valor 
- [Bertsekas (2019). Reinforcement Learning and Optimal Control](http://www.athenasc.com/rlbook.html) Tratamento rigoroso do mapeamento de contrações 论证的严谨处理──
- [Puterman (2005). Markov Decision Processes](https://onlinelibrary.wiley.com/doi/book/10.1002/9780470316887) Iteração de políticas modificada  e análise de convergência
- [Howard (1960). Dynamic Programming and Markov Processes](https://mitpress.mit.edu/9780262582300/dynamic-programming-and-markov-processes/) Origins de política de iteração papel。
- [Bertsekas & Tsitsiklis (1996). Neuro-Dynamic Programming](http://www.athenasc.com/ndpbook.html) Desde DP até aproximadamente-DP / profunda RL de ponte, posteriormente cada parte do curso será usada até
