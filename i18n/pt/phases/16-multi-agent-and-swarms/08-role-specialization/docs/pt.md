# 角色专业化  Planeador, crítico, executor, verificador

> A decomposição de vários agentes mais comum de 2026: um agente 负责规划,一个执行,一个批评或验证――MetaGPT (arXiv:2308.00352) irá formalizar-se em código para instruções de papel`Code = SOP(Team)` ChatDev (arXiv:2307.07924) 通过 "chat chain" 串联 designer、programmer、reviewer、tester,并使用"communicative dehallucination"(agentes 明确请求缺失细节)  Verifier 是承重角色:Cemri et al. (MAST, arXiv:2503.13657) 表明, cada multi-agent 失败 可以追溯到缺失或损坏的验证称──PwC 报告,在 CrewAI 后,准确率提升10% 7×( → 70%) 

**类型：**Aprender + Construir
**语言：**Python (stdlib)
**先修：**Fase 16 · 04 (modelo primitivo), Fase 16 · 05 (supervisor)
**时间：**- 60 minutos.

## 问题

Os três codificadores do grupo de conversação vão escrever três tipos de código semelhantes. Você pode adicionar mais agentes, aumentar mais rodadas, mas ainda não pode atravessar a porta de qualidade.

O método de modificação não é mais agentes, mas sim agentes diferentes. Distribuir diferentes papéis.

## 概念

### Quatro papéis canônicos

**Planner.**阅读目标,产出步列或 spec――Tools:recuperar conhecimentos、docs──Output:plan estruturado──

**Executor.**Uma vez que o processo de criação de um projeto é iniciado, o projeto é executado em um processo de criação de um projeto.

**Critic.**根据 Planner 的意图审阅执行者的输出──Tools:对 artefact的仅读访问、静态分析──Output:accept/reject,并给出原因──

**Verifier.**读取 artefato 并运行确定性检查──Tools: test runner、type checker、schema validator──Output:pass/fail,并附证──

O crítico é um assunto, tem opiniões, geralmente baseado em LLM. O verificador é um objetivo, determinação, geralmente baseado em código.

### Padrão de SOP do MetaGPT

MetaGPT (arXiv:2308.00352) irá programar SOPs de engenharia de software 编码为角色提示:

- **Product Manager**编写 PRD。
- **Architect**产出 sistema de concepção:
- **Project Manager**- Descompõe as tarefas.
- **Engineer**Realização:
- **QA Engineer**- Teste de condução.

Cada papel tem um esquema de entrada/saída rigoroso.`Code = SOP(Team)`Esta expressão significa: SOPs de determinação transformarão um conjunto de LLM em um pipeline previsível.

### ChatDev de desalucinação comunicativa

ChatDev  adicionar um movimento chave: quando o executor  precisa de um plano  quando não há detalhes específicos, ele vai continuar antes de perguntar claramente ao designer  Isso pode evitar o classico LLM  fracaso: parece razoavelmente elaborar detalhes 

实现方式:role prompt 包含当你需要未被提供具体信息时,在产出出出前按名称询问相关角色──

### Por que Verificador é mais importante

Cemri et al. (MAST)  acompanhou 1642 falhas de execução de vários agentes. Dos quais 21,3% são falhas de verificação  系统交付一个没有人检查过的答案── restantes 79% geralmente também podem ser traçadas a 静默失败或从未运行──verificação é um papel de peso──

O relatório da PwC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Critico vs verificador

- O crítico é a revisão de artefatos de qualidade LLM.
- Verificador é executado em um processo de determinação do artefato.

两者都用──Critical 能捕捉 Verifier 无法表达的品味问题──Verifier 能捕捉 Critical 看不到的 bugs,因为 esses bugs 只有在运行时间才会出现──

### Anticomunicação

Cada papel no sistema é LLM, e cada papel produz "parece-me bem". É o modo de falha MAST clássico.

### Mapas de quadro

- **CrewAI**- Não .`Agent(role, goal, backstory)`É uma superfície de especialização típica.
- **LangGraph** nós podem ter pedidos especializados; bordas  obrigatoriamente executar pipeline。
- **AutoGen** Use带单词名称的角色特定的可谈谈的代理在 GroupChat 中
- **OpenAI Agents SDK** 在 角色专业代理 之间使用交付工具──


```figure
swarm-roles
```

## Construção

`code/main.py` implementar um pipeline de 4 funções para construir uma função Python simples:

- **Planner**Produção de especificações
- **Executor**Codificação de cadeia.
- **Critic**(MUL-simulado) 标记明显问题──
- **Verifier**Em sandbox`exec`) em relação ao caso de ensaio 运行生成的代码──

Demo 运行两次:一次执行者 产出正确代码(Critical + Verifier 都通过),一次执行者 产出偏离规范的代码(Critical 漏掉 bug,因为它看起来合理;Verifier 捕捉到 bug,因为 test 失败) ⋅

运行:

```
python3 code/main.py
```

## Utilização

`outputs/skill-role-designer.md`接收一个任务,并产出角色名单 ((3-5 个角色) 、 cada papel de entrada/saída esquema, bem como verificador de verificação──在把代理 接入框架 之前使用它──

## 交付

Lista de verificação:

- **至少一个确定性 Verifier。**Não é absolutamente LLM.
- **每个 role 都有明确 I/O schema。**Planeador 返回 spec, não prósa; Executor 读取该 schema。
- **Communicative dehallucination。**Quando a informação está ausente, o Procurador deve perguntar ao Planeador;
- **Critic/verifier 顺序。**Antes de operar, o sistema de verificação de erros (Critical, convenient, capturing design issues), re-operar Verifier, capturing bugs)
- **Loop budget。**Em melhoria para humanos 之前,最多 2 轮 评论执行者 评论评论执行者 评论执行者 评论评论执行者 评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论评论

## 练习

1. 运行 `code/main.py`, observar Verificador  como capturar o Bug de Crítico 漏掉── Adicionar um check de análise estática `return`Como verificador extra, ele pode capturar o teste de tempo de execução.
2. 添加第 5 个角色:"Analista de requisitos",把用户愿望转换为 Planner-ready spec―― quais são os pedidos de desalucinação comunicativos 应该向上流向它?
3. 阅读 MetaGPT Seção 3 ("Agentes") ――列出 MetaGPT 5 个角色 中每个角色的输入/输出方案──
4. 阅读ChatDev's chat-chain diagram(arXiv:2307.07924 Figura 3)。 Identificar a desalucinação comunicativa em que se rompe um ciclo ininterrupto e permanente―
5. A taxa de precisão de 7× da PwC aumenta a partir de ciclos de verificação.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | 针对 Planner/Executor/Critic/Verifier roles 调优的不同 system prompts。 |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT 的 framing：每个 role 的严格 I/O schemas 将 team 转换为 pipeline。 |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern：当细节缺失时，Executor 会询问 Planner，而不是自行编造。 |
| Critic | "LLM reviewer" | 主观、有观点的 reviewer。捕捉品味问题。可能被看似合理的 prose 欺骗。 |
| Verifier | "Deterministic check" | 基于 code 的 pass/fail。Test runner、type checker、schema validator。不会被欺骗。 |
| Verification gap | "No one checked" | MAST failures 的 21.3%。答案在没有能捕捉 bug 的 check 的情况下被交付。 |
| Revision loop | "Critic sends it back" | Critic rejection 会触发 Executor 带 feedback 重新运行。需要 budget。 |
| All-LLM anti-pattern | "Looks good to me" | 每个 role 都是 LLM，没有确定性 check。经典 MAST failure。 |

## 延伸阅读
- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) OPS-as-role-prompt  referência论文
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) Cadeia de bate-papo + desalucinação comunicativa
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomia MAST;falhas de verificação contribuem para 21,3% dos falhos
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) superfície de especificação de papel de produção
