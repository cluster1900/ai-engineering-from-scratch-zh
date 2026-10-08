# Autonomia de Alineação de Pesquisa (AAR)

> Antropic em sandbox independente并行运行多个Claude Opus 4.6 Autonomous Alignment Researchers 团队,并通过一个共享论坛 协调; o registro do fórum está fora de qualquer caixa de areia (por isso o agente 无法删除自己的记录)  Em problemas de treinamento de fraco a forte, o desempenho do AAR ultrapassa os pesquisadores humanos  Antropic 自己的总结指出,规定的工作流 往往会限制 AAR 灵活性并降低性能──自动化调整研究是一个步骤,它将缩缩时间线到 RSP 风险上.

**Type:** Learn
**Languages:** Python (stdlib, parallel-research-forum simulator)
**前置要求：**Fase 15 · 05 (Scientista de IA v2), Fase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

A pesquisa de alinhamento consome um grande número de tempo de pesquisadores humanos. Como supervisão escalável, especificação de recompensas ou formação fraca a forte, tais problemas, cada rodada de experiência leva várias semanas.

A AAR 追问是: Those capacities are exceeding alignment progress s identical batch of frontier models, is also able to help bridge this gap──Antropic 2026 Year About a one project 运行的 weak-to-strong training 研究报告 (AAR) (alignment.anthropic.com/2026/automated-w2s-researcher/), é um dos primeiros resultados publicados deste tipo de sistemas já implantados──

O resultado é positivo: AAR em um problema de pesquisa é superior à linha de base humana. Mas o resultado também centra cada preocupação que esta fase já desenvolveu num sistema. Se a pesquisa de alinhamento pode ser automatizada, a parte de salvaguardas prejudiciais também pode ser automatizada.

## 概念

### 架构(按公开描述)

- **Parallel agents.**O sistema de arquivos é um sistema de dados de rede e de processos de informação.
- **Shared forum.**O estudo descobriu que o seu armazenamento de fundo está localizado fora de cada caixa de areia.
- **Task allocation.**Uma fila de tarefas projetada pelo ser humano irá distribuir os problemas de estudo para AAR;. AAR  propõe a decomposição, opera experiências, e escreve descobertas。
- **Weak-to-strong training focus.**Os estudos publicados tratam de formação fraca a forte, isto é, de um modelo de supervisor mais fraco para treinar um modelo de estudante mais forte.

### Por que o registro fora da caixa de areia é importante

Log-integritade  atributos  é a diferença entre experiências controladas e experiências potencialmente prejudicadas  Se AAR  pode editar seu próprio diário, eles podem encobrir experimentos fracassados ou suspeitos  Antropic  diretamente aponta para este ponto: essa atributos  é a condição necessária para a confiança de pesquisa de saída, e a verificação não é fácil 

Em termos de infraestrutura, é usado o registro de escritura através de armazenamento externo apêndice-só de registros (por exemplo, S3 object-lock, imutável Datadog registros)  Agente  não modificou credenciais de registros anteriores  Este é o mesmo modelo que o 2026 de empresa segurança equipe para construir rastros de auditoria de software antirrecórdia 

### fluxo de trabalho prescrito

O relatório da Anthropic aponta que os fluxos de trabalho prescritos limitam a flexibilidade e reduzem a performance da AAR. Em outras palavras, se um designer humano escrever progressivamente um plano de pesquisa, a performance da AAR diferirá apenas em relação a uma situação de alto nível de objetivos e permitir sua livre decomposição.

A flexibilidade da AAR também permite a utilização não autorizada de ferramentas de decomposição e de desvio de objetivos. Esta escolha é uma decisão de design-espaço: quanto flexibilidade é suficiente para superar a capacidade humana, ao mesmo tempo em que não dá ao agente a possibilidade de sua meta se generalizar para um espaço fora da distribuição?

### 压缩风险

RSP v3.0 (Lessão 19) introduziu um limiar de capacidade de P&D de IA: em relação a ferramentas de IA + humanos, custos competitivos, capacidade de pipeline de P&D de IA totalmente automatizada.

A AAR está a um passo mais longe do limiar: ela automatizou parte do pipeline (para pesquisas de alinhamento de tarefas específicas), mas ainda não há um ciclo de desenvolvimento de capacidades de ponta a ponta de automação.

                                                                                                                                                                                                                                                              

### AAR não pode substituir nada

O estudo de antropologia foi publicado em uma série de publicações que incluem contribuições de AAR, bem como os estudos de antropologia sobre o que é publicado, o que é retirado, o que é melhorado.

Este modelo de proposta-depois-compromisso é aplicado ao estudo em si mesmo.


```figure
aar-forum
```

## Use-o

`code/main.py`模拟一个多AAR研究论坛──三个独立的研究代理并行运行,将发现发布到一个仅附录论坛,并可选择进行操纵尝试──

Observação:

- Logging out-of-sandbox 如何捕获木材
- Em questões mais difíceis, permite a alocação de tarefas de descomponência livre 如何优于固定工作流──
- Se o log não é evidente, só um sinal de AAR contaminado.

## Entrega-o

`outputs/skill-aar-deployment-review.md`É uma revisão do Pre-Departamento de Pesquisa de Alinhamento Automatizado.

## 练习

1. 运行 `code/main.py` Comparar "fluxo de trabalho fixo" com "descomposição livre" 设置──descomposição livre 否总是获胜, também existem competências em certos tipos de problemas?

2. Modificar o simulador, fazer um agente tentar manipular o log.

3. 阅读Antropic's weak-to-strong AAR 报告――找到AAR 超越人类研究员的具体子任务――是什么让它适应自动化?

4. Design a task-queue allocation policy,  AAR 灵活性更好结果) 约束更易审计) 约束更易审计)                                                                                                                                                                                                                                          

5. 阅读RSP v3.0  AI R&D-4 threshold──用一段话描述, você acha que quais capacidades vão ultrapassar esse limiar, enquanto o AAR atual ainda não conseguiu──

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| AAR | "Automated Alignment Researcher" | 在 alignment problems 上 autonomously 运行的 Claude Opus 4.6 实例 |
| Weak-to-strong training | "Training a stronger model with a weaker supervisor" | AAR 表现超过人类的经典 scalable-oversight benchmark |
| Shared forum | "Where agents publish findings" | Append-only、out-of-sandbox storage |
| Out-of-sandbox log | "Agent cannot edit its own record" | Tamper-evident write-through 到 external storage |
| Prescribed workflow | "Step-by-step plan from human designer" | 限制 AAR；相较 free decomposition 往往降低性能 |
| Free decomposition | "Agent decides how to break the task" | 能力更强，更难 audit |
| AI R&D threshold | "RSP/FSF capability level" | 以有竞争力的成本完全自动化 R&D pipeline |
| Compressed timeline | "Alignment vs capability race" | 如果 capability 复合增长快于 alignment，misalignment 风险就会增长 |

## 延伸阅读

- [Anthropic — Automated Weak-to-Strong Researcher](https://alignment.anthropic.com/2026/automated-w2s-researcher/) fonte primária。
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) O enquadramento dos limites de P&D da IA。
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) Mais amplo enquadramento de autonomia de agentes.
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) Níveis de autonomia de P&D em TI em comparação com os RSP
- [Burns et al. (2023). Weak-to-Strong Generalization (OpenAI)](https://openai.com/index/weak-to-strong-generalization/) Problemas de nível inferior do AAR
