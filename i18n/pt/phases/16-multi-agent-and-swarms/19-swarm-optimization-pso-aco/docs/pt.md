# 面向 LLM's Swarm Optimization(PSO, ACO)

> Otimizar a bio-iniciativa está em regresso ao campo do LLM.**LMPSO**(arXiv:2504.09247) usando PSO, a velocidade de cada partícula é um prompt, LLM 生成下一个候选人; ele é em estruturado processo de saída ([[expressão matemática]], processo) 上效果很好──**Model Swarms**(arXiv:2410.11163) Colocar cada especialista em LLM 视为模型权重多元 上一个PSO粒子,并报告在9数据集上相比12基线有**13.3% average gain**, e por turna só são necessárias 200 instâncias.**SwarmPrompt**(ICAART 2025) será utilizado para a otimização rápida o PSO + Grey Wolf 混合**AMRO-S**(arXiv:2603.12933) são especialistas em feromônios iniciados pela ACO, utilizados para o envio de LLM multi-agente  **4.7x speedup**、 explicação de evidências de roteamento, bem como a inferência e a atualização assíncrona de qualidade de aprendizagem                                                                                                                                                                                                                                               

**类型：**Aprender + Construir
**语言：**Python (stdlib)
**先修：**Fase 16 · 09 (Redes de Swarm paralelas), Fase 16 · 14 (Consenso e BFT)
**时间：**- 75 minutos.

## 问题

Você tem um prompt, em avaliação de tarefa, obter 62%── você quer melhorá-lo── prática simples é uma modificação manual sem graus, mas esse método de expansão é muito ruim── Reforço Aprendizagem  precisa de sinais de recompensa 和 suficiente de implementações para treinar── através de prompts fazer Backpropagation 并不现实 prompt é um separador de strings, não é um pequeno parâmetro──

Otimizar biologicamente inspirado  Utilizado para o PSO do espaço de pesquisa contínua  Utilizado para a seleção de caminhos  ACO  É exatamente para este cenário projetado: sem gradiente  baseada em grupos  Cada avaliação, em baixo custo.

O mesmo modelo também se aplica a sistemas multi-agentes em meio a agentes *routing*。ACO 风格的费罗蒙轨迹 会记录哪个代理在哪类任务上表现最好,让路由器利用这个轨迹,并让费罗蒙轨迹减少,以便路线可以重新发现──

## 概念

### Refresco da OPS (Kennedy & Eberhart 1995)

Particula Swarm Optimization:连续搜索空间中的粒子种群── cada partícula tem posição `x_i`和 velocidade `v_i`❖ Por iteração:

```
v_i <- w * v_i + c1 * r1 * (p_best_i - x_i) + c2 * r2 * (g_best - x_i)
x_i <- x_i + v_i
evaluate fitness(x_i)
update p_best_i if improved
update g_best if global best
```

Entre eles `p_best`É a partícula que tem o seu melhor resultado.`g_best`É o melhor resultado do enxame,`w, c1, c2`É inercia + cognitivo + peso social,`r1, r2`É um facto.

### LLM 输出上 PSO  LMPSO

arXiv:2504.09247 将 PSO 适配到LLM 生成的结构化输出(mathematical expression 程序) ⋅ cada partícula é uma saída candidata──Velocity is a *prompt*, describe how to put current output towards personal/global best 修改──LLM ⋅Velocity prompt 生成 new output──Velocity inertia is similar ⋅fazer pequenas mudanças incrementais ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅     ⋅ ⋅                                                                                                                                                     

Isto é muito bom nos seguintes casos:
- 输出是结构化的 (可解析,可评估)
- A aptidão é automática.
- População 较小(~10-30 partículas), portanto, o MLL总 chama 保持可控──

Quando a aptidão precisa de revisão artificial, não funciona bem.

### Modelo de Enxames

arXiv:2410.11163 vai PSO de camada de saída 带到 *model* layer── cada particle é um especialista LLM(parâmetros)──Swarm 通过无 Gradient update 将参数向集体最佳 移动──报告结果:在 9 个数据集、12 基线上平均提升13.3%,且每轮只需要200 实例──

关键洞察是 LLM expert models 已经在共享参数多元中彼此接近(adapter weights、LoRA deltas) ⋅

### A nova ACO (Dorigo 1992)

Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais Animais

### AMRO-S  Usado para roteamento de agente ACO

ArXiv:2603.12933 Utilize ACO fazer roteamento multi-agente。 Cada tipo de tarefa é um destination; cada agente é uma条可能路途──产出好结果的路途 会强化 feromones──关键贡献:

- **可解释的 routing evidence。**A força feromônica é um sinal humano.
- **Quality-gated asynchronous update。**Os feromônios só passam nos controlos de qualidade, por fim, serão atualizados, e a inferência e a aprendizagem serão resolvidas.
- Em multi-agente roteamento referência 上实现 **4.7x speedup**- Não.

Portais de qualidade  muito importante: sem ele, agentes rápidos mas errados vão acumular feromônios, o sistema vai se bloquear em rotas ruins.

### 什么时候为 LLM 使用 PSO / ACO

**使用 PSO 当：**
- Espaço de pesquisa é continuado, ou pode ser mapeado para continuado parametros ((impedimentos rápidos、 pesos LoRA、 números de valor gerando parametros) ⋅
- Fitness 便宜且自动──
- População pode ser muito pequena.

**使用 ACO 当：**
- Você tem roteamento ou seleção de caminho 问题──
- As decisões vão se reforçar com o tempo.
- Você precisa de provas explicáveis para as decisões de roteamento.

**不要使用二者当：**
- Fitness  necessita de revisão artificial ((( cada vez mais
- O espaço de pesquisa é dispersado e combinado, enquanto o PSO não pode cobrir os algoritmos genéticos modificados.
- As decisões em tempo real                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Por que bio-inspirado  ainda vence

基于 Gradient的方法需要可微信号──LLM sortidas 和路由决策 并不自然可微──Pseudo-gradient 方法(reforço-aprendizado routers、DPO-style prompt tuners) 可行,但需要昂贵的训练──

PSO e ACO só precisam de uma função *evaluador*― se você puder fazer uma decisão de saída ou roteamento de candidato 打分, você pode otimizar neste espaço― isso faz o seu uso mais fácil―

### 实用限制

- **Population budget。**N partículas × T iterações × custo por eval.$0.02 / call 的情况，一个 20-particle PSO 跑 50 iterations 大约花费 ~$20― de acordo com o plano
- **Exploration vs exploitation。**A taxa de decomposição dos feromônios com a inércia do PSO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
- **Catastrophic drift。**Se a paisagem de fitness mudar, duas espécies de algoritmos podem convergir, depois divergir, monitorando a estabilidade de melhor forma.


```figure
swarm-stigmergy
```

## Construção

`code/main.py`实现:

- `LMPSO` 在数值提示参数(温度、top_k weights) 上运行 PSO──每个粒子的LLM generation 被模拟为一个脚本化健身函数──运行算法 30 iterações,并显示g_best convergence──
- `AMRO_S` ACO 风格 routing──3 个 agents、4 种任务类型、pheromone matrix、100 个 routed tasks──打印一段时间内(task_type → agents choices) de distribuição, mostrar formação de trilha──
- Comparar: em um mesmo fluxo de tarefas 上比较随机路由与ACO路由――衡量质量和延迟――

运行:

```
python3 code/main.py
```

预期输出:
- LMPSO: g_best fitness em 30 iterações 内从随机值提升到接近最佳.
- AMRO-S:Tabela de feromonas  estabilizar até cada tipo de tarefa; roteamento ACO em qualidade acima do aleatório 高约 ~30-40%, ao mesmo tempo reduzindo a latência ((更少反试) 

## Utilização

`outputs/skill-swarm-optimizer.md` ajudar em algoritmos genéticos e optimizadores baseados em gradientes  entre escolha, para problemas de otimização de LLM / agente

## 交付

- **从小开始。**10-20 partículas,20-50 iterações― apenas quando a curva de convergência  mostram claramente os resultados
- **记录每轮 pheromones 或 g_best。**没有 trail 的 swarm optimizers 很难 debug──
- **Quality-gate updates。** Especialmente ACO routing: rápidos mas errados agentes  absolutamente não pode acumular feromona
- **在 distribution shift 时 reset decay。**Quando a distribuição de avaliação muda, os feromônios de envelhecimento já passam de tempo; se reinicia ou se temporariamente aumenta a taxa de decomposição.
- **限制每轮成本。**O custo de saída por reiterado é de 500 dólares por rodada, e o aumento de 0,5% da operação não é possível.

## 练习

1. 运行 `code/main.py` Observar a convergência do LMPSO  alterar o tamanho da população 为 5、10、20、50──在哪个尺寸上时间到 konverge 开始和?
2. 实现一个 灾难性漂移 实验:在回复30 后改变健身功能──PSO 适应得多快?Reset `p_best`- Ajudou?
3. 给AMRO-S 添加质量门:只有 eval score > 0.7 of runs 才存储热.
4. 阅读 LMPSO(arXiv:2504.09247) ――把论文中的速度作为一个提示 映射回你的数值速度──模拟中丢失了什么,又保留了什么?
5. 阅读 AMRO-S(arXiv:2603.12933)。实现带异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异步异化异化异化异化异化异化异化异化异化异化异化异化异化

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| PSO | "Particle Swarm Optimization" | Kennedy-Eberhart 1995。基于种群的无 Gradient Optimizer。 |
| ACO | "Ant Colony Optimization" | Dorigo 1992。通过 pheromone trails 进行 path/route optimization。 |
| LMPSO | "PSO with LLM generation" | arXiv:2504.09247。Velocity 是 prompt；LLM 生成 candidates。 |
| Model Swarms | "PSO on expert weights" | arXiv:2410.11163。在 model parameter subspace 上进行无 Gradient update。 |
| AMRO-S | "ACO for agent routing" | arXiv:2603.12933。覆盖 task-type × agent 的 pheromone matrix。 |
| p_best / g_best | "Personal / global best" | 每个 particle 和整个 swarm 目前找到的最佳 solutions。 |
| Pheromone | "Routing memory" | Edge 上的强度；随时间衰减；根据 quality deposit。 |
| Quality-gated update | "Only learn from good runs" | 以 quality check 为条件进行 pheromone deposit。 |
| Catastrophic drift | "Distribution shift" | Fitness landscape 改变；旧的 p_best 和 pheromones 变得过时。 |

## 延伸阅读

- [Kennedy & Eberhart — Particle Swarm Optimization](https://ieeexplore.ieee.org/document/488968) 1995 ano PSO 论文
- [Dorigo — Ant Colony Optimization](https://www.aco-metaheuristic.org/about.html) 1992 ano ACO 基础
- [LMPSO — Language Model Particle Swarm Optimization](https://arxiv.org/abs/2504.09247) 面向结构化 LLM outputs of PSO
- [Model Swarms — gradient-free LLM expert optimization](https://arxiv.org/abs/2410.11163) Em subespaço de peso do modelo
- [AMRO-S — ant-colony multi-agent routing](https://arxiv.org/abs/2603.12933) 带 gate de qualidade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
