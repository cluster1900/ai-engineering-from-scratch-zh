# Refleção: Aprendizagem por reforço verbal

> Baseado em RL Gradiente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Explicar os três componentes da reflexão (Actor, Evaluação, Auto-Reflector) e o papel da memória episódica:
- 实现 um stdlib Reflexion loop, contendo avaliador binário, buffer de reflexão e novas re-tentativas.
-  para uma determinada tarefa, entre fontes de feedback escalar, heurística e auto-avaliação  fazer escolha 
- Explicar por que o reforço verbal pode capturar RL baseado em gradiente requer milhares de tentativas para corrigir erros.

## 问题
Um agente  missão falhou. Em RL padrão, você vai re-lançar milhares de experimentos, calcular gradientes, atualizar pesos.

Reflexão ((Shinn et al., arXiv:2303.11366) apresentou outra questão: se o agente  apenas pensar em si mesmo por que falhou,  colocar essa ideia em seguida 里再试一次,会怎么?

O resultado é: no ALFWorld, superou ReAct e outras linhas de base não-finamente sintonizadas. No HotpotQA, ele teve alguma melhoria em relação ao ReAct. Na geração de código HumanEval/MBPP, ele atingiu o estado de arte de então.

## 概念
### Os três componentes

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

Mais uma estrutura de dados:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

Uma vez, o Actor irá executar o teste. Se o resultado for menor, o Auto-Reflector irá gerar uma reflexão.

### Três tipos de avaliadores

1. **Scalar** Exterior binário sinal―ALFWorld Sucesso ou fracasso―HumanEval testes 通过或失败―最简单,信号 最强―
2. **Heuristic** 预定义的失败签名──如果代理连续两次产生相同行动,就标记为卡卡了──如果轨迹超过50步,就标记为不效──
3. **Self-evaluated** LLM para a sua própria trajetória 打分──当没有基础真理 时需要它──Signal 较弱;适合与工具基底证实 搭配使用(Lesson 05  CRITIC) ‖

O método de utilização é um mix de: utilizabilidade em escala, utilizabilidade em autoevaluação, heurística como trilhas de segurança.

### Por que isso generaliza

A reflexão é um novo algoritmo, não é como dizer que é um modelo nomeado.

- Letta's computação do tempo de sono ((Lessão 08): um agente independente Reflexião sobre as conversas passadas,并写入记忆块──
- Claude Code `CLAUDE.md`/ save memory 模式:将反思 捕获为学习,并预pendi到未来会议──
- Pro-flow de trabalho `/learn-rule`comando:将 correções 捕获为显式规则──
- Nodos de reflexão de LangGraph: um nó para saída 打分, e em necessidade时路由到精炼。

Todos eles vêm da mesma percepção: a linguagem natural é um meio suficientemente rico, que pode ser transportado entre corridas.

### Que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é que é

Reflexão  Aplicada a:

- Há um sinal de falha claro.
- classe de tarefas 可复现(O mesmo tipo de problemas irá aparecer novamente)。
- Reflecção Há espaço para melhorar a trajetória (Have adequado orçamento de acção)

Reflexão não é aplicável:

- A primeira tentativa já foi bem sucedida.
- 失败来自外部因素(red down、tool broken) 反思red down对未来运行 没有帮助──
- Reflexão transformada em fantasma para uma história de um tempo em que se passa.

2026 年の陷:memory rot──Reflections 会累积; alguns deles já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já já


```figure
react-trace
```

## Construí-lo
`code/main.py`Em um puzzle de brinquedo 上实现 Reflexão: gerar uma lista de 3 elementos, fazer a sua soma 等等到目标值──Actor 产出候选人名单;Evaluator 检查 sum;Self-Reflector 写一行关于哪里出错的诊断──Reflexão 会进入 剧情记忆,供下一次试用──

Componentes:

- `Actor`Uma política escrita, em reflexões, melhorará.
- `Evaluator.binary()`  Baseado na quantidade de destino de passagem/falha。
- `SelfReflector` 生成一行 diagnóstico de falha
- `EpisodicMemory` 一个带 TTL semântica lista limitada

运行:

```
python3 code/main.py
```

Trace 展示三次试点──Trial 1 失败,存储一段反思;Trial 2 看到反思 后有改进但仍失败;Trial 3 成功──与基线运行(无反思)对比它会卡在试点1的答案上──

## Use-o
LangGraph vai refletir  como padrão de nó  fornecer。Claude Code `/memory`comando 和 pro-workflow `/learn-rule`O sistema de controle de tempo de sono de Letta é um sistema de controle de tempo de sono de Letta, que permite que o agente principal continue a ser observado em tempo de inatividade.`Session`Vamos construir-lhe.

## Entrega-o
`outputs/skill-reflexion-buffer.md`创建并维护一个剧情缓冲,包含反思捕获、TTL 和减复式――给定一个任务类 和一次失败,它会产出一段真正帮助下一次试验的反思(而不是泛泛的要更加小心) 

## 练习
1. Do avaliador binário 切换到返回距离米τρ离目标有多远) do avaliador escalar── é recebido mais rápido?
2. Para reflexões adicionar 10 ensaios de TTL.
3. 实现 heurística evaluator: se a mesma ação reaparecer,就将试验 标记为卡了──
4. Utilização de Refleções Ignorar Refleções Actor adversário 运行 Reflexion―Para forçar o Actor a notá-las, a menor reflexão de prompt engineering é o quê?
5. 阅读反思论文 中关于AlfWorld的第4节 从概念上复现 130% melhoramento da taxa de sucesso: Com relação à vanilla ReAct, o delta chave é o quê?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Reflexion | “Self-correction” | Shinn et al. 2023 — Actor、Evaluator、Self-Reflector 加 episodic memory |
| Verbal reinforcement | “Learning without gradients” | prepend 到下一次 trial prompt 的自然语言 reflection |
| Episodic memory | “Per-task reflections” | 针对一个 task class 的 prior reflections bounded buffer |
| Scalar evaluator | “Binary success signal” | 来自 ground truth 的 pass/fail 或 numeric score |
| Heuristic evaluator | “Pattern-based detector” | 预定义 failure signatures（例如 stuck-loop、too-many-steps） |
| Self-evaluator | “LLM-as-judge on own trace” | 没有 ground truth 时使用的 lower-signal fallback — 与 tool-grounded verification 搭配 |
| Memory rot | “Stale reflections” | Episodic buffer 被过时 entries 填满；用 compaction/TTL 修复 |
| Sleep-time reflection | “Async self-reflection” | 在 hot path 之外运行 Self-Reflector，使 primary agent 保持快速 |

## 延伸阅读
- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366)Papel clássico
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) produção 中的异步反射
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) Configurar um buffer episódico como parte do contexto
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) padrão de nó de reflecção
