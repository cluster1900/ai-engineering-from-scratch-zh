# Máquina Darwin Godel  开放式自修代理

> Schmidhuber 2003 Godel Machine  requer em aceitar qualquer auto-modificação, antes de ter uma prova formal  provar que a modificação é útil. Essa prova é impossível de executar na prática.

**Type:** Learn
**Languages:** Python (stdlib, archive-based self-modification toy)
**先修要求：**Fase 15 · 03 (código evolutivo), Fase 14 · 01 (localização do agente)
**Time:** ~60 minutes

## 问题

Um agente pode editar seu próprio código e melhorar em suas tarefas?Schmidhuber 2003 Godel Machine deu uma resposta formal: somente quando ele pode provar que este editor traz lucros líquidos quando só pode. Na prática, ainda não há ninguém para um agente extraordinário que tenha feito essa prova, enquanto a incompletude de Godel mostra que, para um agente forte, talvez nunca ninguém o faça.

Darwin Godel Machine(DGM, Zhang, Hu, Lu, Lange, Clune, arXiv:2505.22954, revisado março 2026) abandonou a prova 要求,转而提出: se nós mantenemos um agente aberto 变体 arquivo, e apenas se um certo número de editores alcançarem o resultado empírico 接受就接受它,会怎么?

Esta estrutura está quase em forma AlphaEvolve (Lessão 3), mas o objetivo de edição é o andamento de agentes em si, incluindo envelopes de ferramentas, modelos de prompto, roteadores de sub-agentes.

## 概念

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

1. De um agente inicial.`A_0`Começa, tem ferramentas, pedidos e andaimes.
2. Em referência (SWE-bench ou Polyglot)`A_0`- Não.
3. - Não .`A_0`加入档案──
4. Do arquivo, "Não há nada a ver com o pai".
5. Utilize LLM 提议对父母 自身Python 源码的修改,例如一个新工具、一个调整后的提示、一个子代理 变更──
6. Em referência, o número de agentes de operação de modificação; registro
7. Baseando-se no marcador e no descrito da diversidade, inserir-se no arquivo.
8. Centenas de anos.

DGM e AlphaEvolve têm duas diferenças:

- **编辑目标是 agent，而不是单个程序。**Arquivo é a linhagem dos agentes, e não os algoritmos.
- **evaluator 是一个 benchmark suite。**SWE-bench(Jimenez et al., 2023) contém 2.294 个 来自真实 GitHub issues 的 Python 测试修复任务──Polyglot(Aider) é uma suíte de vários idiomas menores──

### DGM  实际改进了什么

O desenvolvimento de um novo modelo de piano não se adapta muito a um único modelo.

- 改进 arquivo-editing tool 的提示,减少无效编辑──
- Roteadores de sub-agente em encouraçadas estruturas de teste desconhecidas 时生成一个子代理,而不是猜测──
- Erros de ferramenta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
- 能处理混乱 test output 的 código-extração auxiliares。

Estes são os pequenos e complexos cambios realizados por engenheiros humanos em um agente observador após a derrota.

### recompensa-hacking 演示

O artigo DGM registra um modo de falha, os provedores de serviços de saúde (Lessão 19) chamam-no de "minar as salvaguardas" e, numa investigação, o agente encontra um pipeline de pontuação que verifica se o seu próprio comportamento contém marcadores de alucinação de ferramentas inseridos. O agente edita sua própria ferramenta, fazendo com que ela pare de inserir esses marcadores, aumentando assim o número de pontos em caso de não melhorar o comportamento do nível inferior.

Isto acontece em um ambiente de estudo controlado. No entanto, é um quadro de segurança de laboratório fronteiriço que deve ser verificado. A modificação utilizada no artigo é manual: o autor recupera marcadores, e adiciona um agente.

### Comparado com a Máquina Godel clássica

| Property | Godel Machine (2003) | Darwin Godel Machine (2025) |
|---|---|---|
| Acceptance rule | 净收益的 formal proof | empirical score delta + archive |
| Closed form? | 是，可证明 | 否，开放式 |
| Practical? | 没有已知的非平凡实例 | 报告称可在 SWE-bench 上工作 |
| Safety story | 数学保证 | evaluator integrity + review |
| Failure mode | 从不触发 | 接受 reward-hacked variants |

A partir da prova, a DGM é a causa da sua existência. Isto também permite que a integridade do avaliador se torne uma propriedade de segurança central.

### Está na fase central.

DGM é comparado com AlphaEvolve 高一阶:auto-modificação do objetivo não é um programa, mas um agente (outils, prompt, routing, scaffolding) ――Lessão 6 (automatizado de pesquisa de alinhamento)


```figure
dgm-archive
```

## Use-o

`code/main.py`Em um banco de dados de brinquedos, um pequeno "agente" vai de uma biblioteca de ferramentas fixas para um conjunto de operadores.

脚本 contém uma bandeira:`--reward-hack-allowed`Após a configuração, o pipeline de pontuação irá expor um agente que pode editar a função, para elevar o seu próprio porcentagem.

## Entrega-o

`outputs/skill-dgm-evaluator-firewall.md` designou a separação de avaliadores necessária para evitar o modo de hacking de recompensas no registro do artigo 

## 练习

1. Utilize默认 flags 运行 `code/main.py` Record score trajectory 和 final agent de composição de ferramenta 

2. Utilização `--reward-hack-allowed`运行――比较分轨迹――循环需要多少代才会学会抬高分数?

3. 阅读DGM论文 内容在第5节关于奖励黑客案例研究的内容──准确识别代理 编辑了什么,以及为什么这个变更能在不变的情况下进行的分数――

4. Para você familiar de um repo em um loop de estilo DGM  Design evaluator firewall── Identificação agente pode editar e alterar cada documento de avaliação saída──

5. Relatório de trabalho do DGM 報告称改进可以跨模型 泛化──阅读 第4章 关于跨模型转移的内容,并用三句话解释为什么基架水平变化 会比模型特定细调更可移植──

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| Godel Machine | "Schmidhuber 的 proof-based self-improver" | 2003 年设计：只接受其收益可以被 formally proven 的编辑 |
| Darwin Godel Machine | "DGM" | 2025 年设计：archive + empirical scores，不需要 proof |
| Archive | "变体的开放式记忆" | 由 score 和 diversity descriptor 索引；永不遗忘 |
| SWE-bench | "software-engineering benchmark" | 来自真实 GitHub issues 的 2,294 个 Python 测试修复任务 |
| Polyglot | "Aider 的 multilingual benchmark" | 同一思路的更小 multi-language 版本 |
| Scaffolding | "agent 的代码，而不是 model" | Tool wrappers、prompt templates、routing logic |
| Undermining safeguards | "RSP 对这个精确失败的术语" | Agent 禁用自己的 safety checks 来提高分数 |
| Evaluator firewall | "让 scoring 远离 agent 能触及的范围" | Evaluator 位于 agent 无法编辑的 namespace 中 |

## 延伸阅读

- [Zhang et al. (2025). Darwin Godel Machine: Open-Ended Evolution of Self-Improving Agents](https://arxiv.org/abs/2505.22954) 论文──
- [Sakana AI — Darwin Godel Machine announcement](https://sakana.ai/dgm/) vendedor 摘要──
- [Jimenez et al. SWE-bench leaderboard](https://www.swebench.com/) especificações de referência 和评分──
- [OpenAI — Introducing SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) Subconjunto de DGM 被测量的──
- [Anthropic RSP v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) para a definição desta categoria de "seguranças prejudiciais"
