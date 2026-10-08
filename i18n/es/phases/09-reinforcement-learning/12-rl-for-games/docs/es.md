# 面向游戏的 RL  AlphaZero、MuZero y LLM Razonamiento 时代

> 1992:TD-Gammon utiliza puramente TD en backgammon en el que derrotó a la humanidad.2016:AlphaGo Vita Lee Sedol.2017:AlphaZero desde cero comienza a gobernar el ajedrez, shogi y Go.2024:DeepSeek-R1 Prove el mismo juego en el razonamiento 上也有效, simplemente con GRPO 替代 PPO── juego es impulsar esta etapa cada vez más de la ruptura de referencia──

**类型：**Construir
**语言：**Python
**先修要求：**Fase 9 · 05 (DQN) Fase 9 · 08 (PPO) Fase 9 · 09 (RLHF) Fase 9 · 10 (MARL)
**时间：** 120 minutos

##  problemas

游戏具备 RL 想要的一切──清晰的回报(胜/负)──无限集★自动玩可以重置)──完美模拟(游戏本身就是模拟器)──离散或小规模连续行动空间──迫使对抗鲁棒性的多代理结构──

Además, el juego está en el mercado de la prueba de cada vez más grandes RL 突破的测试场──TD-Gammon(backgammon, 1992)──Atari-DQN(2013)──AlphaGo(2016)──AlphaZero(2017)──OpenAI Five(Dota 2,2019)──AlphaStar(StarCraft II,2019)──MuZero(modelo aprendido,2019)──AlphaTensor(multiplicación de matriz,2022)──AlphaDev(algoritmos de clasificación,2023)──DeepSeek-R1(Rasonamiento matemático,2025)

Esta piedra angular pasará a través de un único punto de vista.**self-play + search + policy improvement** Cada uno de ellos es una generalización de la anterior; especialmente el GRPO, que aplica la combinación de AlphaZero en el razonamiento de LLM, en el cual el Token es acción, el test matemático es señal de victoria.

## 概念

![AlphaZero ↔ MuZero ↔ GRPO：相同循环，不同环境](../assets/rl-games.svg)

**统一循环。**

```
while True:
    trajectory = self_play(current_policy, search)     # 和自己对局
    policy_target = search.improved_policy(trajectory) # search 改进原始 policy
    policy_net.update(policy_target, value_target)     # 在 search 输出上做 supervised 训练
```

**AlphaZero (2017)。**Silver et al. 给定一个规则已知的游戏(jaguete,jaguete,jaguete,jaguete):

- Red de valores políticos:一个塔 `f_θ(s) → (p, v)`¿Qué es eso?`p`Es un movimiento legal.`v`Es el resultado del juego esperado.
- Buscar árboles de Monte Carlo (MCTS): en cada paso,展开可能后续状态的树──使用 `(p, v)`作为前 + bootstrap──用 UCB (PUCT) 选择节点:`a* = argmax Q(s, a) + c · p(a|s) · √N(s) / (1 + N(s, a))`¿Qué es eso?
- El juego de sí mismo: hacer agente contra agente para la escena.`t`步,MTCs distribución de las visitas `π_t`成为 política 训练目标──
- Las pérdidas:`L = (v - z)² - π · log p + c · ||θ||²`¿Qué es eso?`z`Es el resultado del juego.

零人类知识――零手工演学―― una sola preparación, después de cada uno de sus miles de millones de juegos de juego propio 掌握了棋牌、shogi 和 Go――

**MuZero (2019)。**Schrittwieser et al. 移除了规则已知的要求──

- No utiliza un ambiente fijo, sino que aprende un *modelo de dinámica latente* `(h, g, f)`¿Qué es esto ?
  - `h(s)`:将 observación 编码为潜伏状态──
  - `g(s_latent, a)`:预测下一个潜伏状态 + recompensa。
  - `f(s_latent)`:预测 política previa + valor。
- MCTS en el espacio latente aprendido entra en funcionamiento.
- 适用于 Go、chess、shogi *以及* Atari  一个算法,不需要规则知识──

**Stochastic MuZero (2022)。**加入 estocástica dinámica 和 nodos de azar; expandiéndose a backgammon 这类游戏──

**Muesli、Gumbel MuZero (2022-2024)。**En la eficiencia de la muestra y la búsqueda determinista, mejoras.

**GRPO (2024-2025)。**Profundos Buscar-R1 配方── el mismo AlphaZero 形状循环, aplicado al razonamiento del modelo de lenguaje:

- 游戏: responder a un problema matemático / codificación / razonamiento。胜利= verificador(caso de prueba 通过、数值答案匹配) retornar 1。
- Política:LLM。Acciones:Token。Estado:prompt + respuesta-hasta ahora─
- 没有批评(PPO 风格的 V_φ) ;;相反,对每一个提示,从政策采样 `G`个 completamiento──计算每个完成的奖励──使用 **group-relative advantage** `A_i = (r_i - mean_r) / std_r`作为 REINFORCE 风格更新的信号──
- Para la política de referencia, más penalización KL, así como para la RLHF.
- 完整 Perdida:

  `L_GRPO(θ) = -E_{q, {o_i}} [ (1/G) Σ_i A_i · log π_θ(o_i | q) ] + β · KL(π_θ || π_ref)`

没有奖励模型,没有批评,没有MCTS──grupos-relativos baseline 替换了三者──在推理基准上,使用少得多的计算 达到或超过PPO-RLHF质量──

**完整的 R1 配方。**DeepSeek-R1 ((DeepSeek 2025) es un artículo en el que se incluyen dos modelos:

- **R1-Zero。**Desde el modelo base de DeepSeek-V3 开始──没有 SFT──直接应用 GRPO, utilizando dos componentes de recompensa:* recompensas de precisión*(basadas en reglas  最终答案是否能解析成正确数字 / 代码是否通过单元测试) y *format reward*(completation 是否把链思路包在`<think>…</think>`标签内) ・经过数千步后, el tiempo de respuesta promedio de aproximadamente 100 增长到约10,000 Token, matemática de referencia 分数上升到接近 o1预览 水平──模型 从零开始学会推理──缺点: su cadena de pensamiento 往往难以阅读、混用语言,并且缺少风格打磨──
- **R1。**Usado en cuatro fases del oleoducto 修复 R1-Zero de la lectura problema:
  1. **Cold-start SFT。**收集数千条格式清晰的长度CoT示范――对基模型做监督细节――这提供了一个可读的起点――
  2. **Reasoning-oriented GRPO。**Utiliza la recompensa de precisión+formato,并加入 *la recompensa de coherencia de lenguaje* para evitar el cambio de código。
  3. **Rejection sampling + SFT 第 2 轮。**Desde el punto de control de RL 采样约600K 条推理轨迹, sólo conservar el resultado final correcto y CoT可读的样本,并与约200K 条非推理 SFT ejemplo(escritura、QA、autoconocimiento)组合──再次调整基础──
  4. **Full-spectrum GRPO。**Re-realizar una ronda de RL, abarcar el razonamiento (recompensación basada en reglas) y la alineación general (recompensación basada en preferencias de utilidad/inharmonía)

Resultados en pesas abiertas 下于 AIME 和 MATH-500 上匹配 o1,并且足够小,可以蒸蒸──同一篇论文还发布了六种蒸的密集模型(从Qwen-1.5B到Llama-70B), el método es de rasgo de razonamiento R1 上对学生做SFT  学生端没有RL──强RL的蒸 在学生规模持续优于从零开始的RL──

**为什么 reasoning 用 GRPO 而不是 PPO。**DeepSeekMath 论文(2024 年 2 月) da tres razones: 1) No necesita entrenar la red de valor, la memoria se reduce a la mitad; 2) la línea de base del grupo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

**Search-free vs search-based。**游戏领域已经分叉:

- *长视野的完美信息游戏*(Go、棋): todavía es basado en búsqueda。AlphaZero / MuZero 占主导。
- *Rasonamiento LLM*: producción中还没有 MCTS; hacer un GRPO completo, calcular con el mejor de los modelos de recompensas de proceso (PRM) 暗示阶段搜索 正被重新加入──


```figure
f3-selfplay-ladder
```

## Construcción

`code/main.py`El código medio se ha realizado.**微型 GRPO** Un grupo de bandidos de la muestra. El algoritmo es el mismo que el LLM; sólo la política y el medio ambiente.

### Paso 1: Un entorno de verificación de microtipo

```python
QUESTIONS = [
    {"prompt": "q1", "correct": 3},
    {"prompt": "q2", "correct": 1},
]

def verify(prompt_idx, answer_token):
    return 1.0 if answer_token == QUESTIONS[prompt_idx]["correct"] else 0.0
```

En el GRPO real, el verificador realizará pruebas de unidad o revisará la equivalencia matemática.

### Paso 2: política: cada instante 上对 K 个 respuesta Token hacer softmax

```python
def policy_probs(theta, p_idx):
    return softmax(theta[p_idx])
```

Es decir, la producción de la capa final del LLM en condiciones inmediatas.

### 步骤 3: muestreo de grupo y ventaja relativa del grupo

```python
def grpo_step(theta, p_idx, G=8, beta=0.01, lr=0.1, rng=None):
    probs = policy_probs(theta, p_idx)
    samples = [sample(probs, rng) for _ in range(G)]
    rewards = [verify(p_idx, s) for s in samples]
    mean_r = sum(rewards) / G
    std_r = stddev(rewards) + 1e-8
    advs = [(r - mean_r) / std_r for r in rewards]

    for a, A in zip(samples, advs):
        grad = onehot(a) - probs
        for i in range(len(probs)):
            theta[p_idx][i] += lr * A * grad[i]
    # KL penalty：把 theta 拉向 reference
    for i in range(len(probs)):
        theta[p_idx][i] -= beta * (theta[p_idx][i] - reference[p_idx][i])
```

La ventaja en relación con el grupo es la técnica de DeepSeek de 2024 años.

### Paso 4: Con relación al punto de partida de REINFORCE (en inglés)

Igual configuración, igual computación, ordinario REINFORCE, GRPO, más rápido, más estable.

### Paso 5: observar la entropía y KL

Con RLHF similares diagnósticos: hasta el referente de la media KL、entropía de la política、 recompensa-over-time― una vez que estos estabilizadas, el entrenamiento ya está terminado―

## 常见陷

- **通过操纵 verifier 进行 reward hacking。**GRPO  ha heredado el riesgo de RLHF: si el verificador  err err errore o puede ser utilizado, LLM encontrará exploit― 鲁棒 verificador 多种试例、正式证据) es muy importante―
- **Group size 太小。**Diferencias de grupo en línea de referencia`1/√G`缩放――低于 `G = 4`时, señal de ventaja 会很噪音; 标准选择是`G = 8`¿ Qué ?`64`¿Qué es eso?
- **Length bias。**Diferente de la duración de LLM  tiene diferentes probabilidades de registro ⋅ según el número de tokens, o el uso de un registro de nivel de secuencia, o el corte hasta la longitud máxima ⋅
- **纯 self-play 循环。**AlphaZero 风格训练可能在一般数量游戏中卡进统治循环──可通过多样化对手池联赛比赛,课 10)缓解──
- **Search-policy mismatch。**AlphaZero trenamiento política 去模仿搜索结果──如果政策网太小,不能表示搜索的分布,训练会停滞──
- **Compute floor。**MuZero / AlphaZero  necesita computación de volumen ⋅ una sola ablación 往往就是数百 GPU-hora ⋅ para aprender de micro-demo es existente ⋅ por ejemplo Connect Four 上的 AlphaZero) ⋅
- **Verifier coverage。**Para la solución de errores también se pueden pasar pruebas de unidad, reforzar el verificador de errores.

## Uso

2026 版图, por dominio 划分:

| Domain | 主导方法 |
|--------|-----------------|
| Two-player zero-sum board games（Go、chess、shogi） | AlphaZero / MuZero / KataGo |
| Imperfect info card games（poker） | CFR + deep learning（DeepStack、Libratus、Pluribus） |
| Atari / pixel games | Muesli / MuZero / IMPALA-PPO |
| Large multiplayer strategy（Dota、StarCraft） | PPO + self-play + league（OpenAI Five、AlphaStar） |
| LLM math/code reasoning | GRPO（DeepSeek-R1、Qwen-RL、open replications） |
| LLM alignment | DPO / RLHF-PPO（不是 GRPO；verifier 是 preference，不是 verifiable） |
| Robotics | PPO + DR（不是 game-RL，但使用相同的 policy-gradient tools） |
| Combinatorial problems | AlphaZero variants（AlphaTensor、AlphaDev） |

Esta * Cuadro*  Auto-juego  mejoras aumentadas por búsqueda  destilación de políticas  横跨文本、像素和物理控制。GRPO es el ejemplo más joven; más ejemplos también surgirán。

## 交付

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-game-rl-designer.md`¿Qué es esto ?

```markdown
---
name: game-rl-designer
description: 为给定 domain 设计 game-RL 或 reasoning-RL training pipeline（AlphaZero / MuZero / GRPO）。
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

给定一个目标（perfect-info game / imperfect-info / Atari / LLM reasoning / combinatorial），输出：

1. Environment fit。规则是否已知？Markov？Stochastic？Multi-agent？用于判断 AlphaZero vs MuZero vs GRPO。
2. Search strategy。MCTS（带 learned prior 的 PUCT）、Gumbel-sampled、best-of-N，或 none。
3. Self-play plan。Symmetric self-play / league / offline data / verifier-generated。
4. Target signal。Game outcome / verifier reward / preference / learned model。包含 robustness plan。
5. Diagnostics。相对 baseline 的 win rate、ELO curve、verifier pass rate、到 reference 的 KL。

对 imperfect-info games 拒绝使用 AlphaZero（转向 CFR）。没有可信 verifier 时拒绝 GRPO。没有固定 baseline opponent set 时拒绝任何 game-RL pipeline（否则 self-play ELO 未校准）。
```

##  ejercicios

1. **Easy。**En el`code/main.py`En el caso de los bandidos GRPO, se puede realizar un plan de acción de 2 个提示 × cada 4 个答案.`G=8`En < 1000 veces actualización
2. **Medium。**En el mismo bandido, comparar la eficiencia de la muestra y la variación de la recompensa con la diferencia de GRPO.
3. **Hard。**扩展到长度为 2 的推理链:agent 发发发两个代币,verifier对代币对代币 给奖励──测量 GRPO 如何处理两步序列 上的信用分配──(提示:按 *full sequence* 计算组优势,并传播到两个代币位置──)

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| MCTS | “带 learned net 的 tree search” | Monte Carlo Tree Search；使用 learned `(p, v)` prior 的 UCB1/PUCT selection。 |
| AlphaZero | “Self-play + MCTS” | Policy-value net 被训练来匹配 MCTS visits 和 game outcome。 |
| MuZero | “Learned-model AlphaZero” | 相同循环，但通过 learned dynamics 在 latent space 中进行。 |
| GRPO | “Critic-free PPO” | Group Relative Policy Optimization；带 group-mean baseline + KL 的 REINFORCE。 |
| PUCT | “AlphaZero 的 UCB” | `Q + c · p · √N / (1 + N_a)` —— 平衡 value estimate 与 prior。 |
| Self-play | “Agent vs past self” | Zero-sum 的标准做法；提供对称训练信号。 |
| League play | “Population-based self-play” | 将 past + current + exploiters 采样为 opponents。 |
| Verifier reward | “Verifiable RL” | Reward 来自 deterministic checker（tests pass、answer matches）。 |
| Process reward | “PRM” | 为每个 reasoning step 打分，而不只是最终答案。 |

## 延伸阅读

- [Silver et al. (2017). Mastering the game of Go without human knowledge (AlphaGo Zero)](https://www.nature.com/articles/nature24270)¿Qué es eso?
- [Silver et al. (2018). A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play (AlphaZero)](https://www.science.org/doi/10.1126/science.aar6404)¿Qué es eso?
- [Schrittwieser et al. (2020). Mastering Atari, Go, chess and shogi by planning with a learned model (MuZero)](https://www.nature.com/articles/s41586-020-03051-4)¿Qué es eso?
- [Vinyals et al. (2019). Grandmaster level in StarCraft II (AlphaStar)](https://www.nature.com/articles/s41586-019-1724-z)¿Qué es eso?
- [DeepSeek-AI (2024). DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (GRPO)](https://arxiv.org/abs/2402.03300)  Introducción de los trabajos de GRPO y de la línea de base de relación entre grupos.
- [DeepSeek-AI (2025). DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) 完整的四阶段 R1 配方以及 R1-Zero ablación。
- [Brown et al. (2019). Superhuman AI for multiplayer poker (Pluribus)](https://www.science.org/doi/10.1126/science.aay2400) CFR de gran tamaño + aprendizaje profundo。
- [Tesauro (1995). Temporal Difference Learning and TD-Gammon](https://dl.acm.org/doi/10.1145/203330.203343) 开创这一切的论文──
- [Hugging Face TRL — GRPOTrainer](https://huggingface.co/docs/trl/main/en/grpo_trainer) Utiliza funciones de recompensa personalizadas  aplicar GRPO  
- [Qwen Team (2024). Qwen2.5-Math — GRPO replication](https://github.com/QwenLM/Qwen2.5-Math) Multi escala  R1 配方的开放复制──
- [Sutton & Barto (2018). Ch. 17 — Frontiers of Reinforcement Learning](http://incompleteideas.net/book/RLbook2020.pdf) En el marco de los cursos de formación, el programa de formación de la Universidad de Madrid (U.S.A.) se desarrolla para el desarrollo de la formación profesional.
