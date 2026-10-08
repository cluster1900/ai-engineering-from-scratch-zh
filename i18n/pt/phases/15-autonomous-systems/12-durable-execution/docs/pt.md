# 长时间运行的后台 Agentes:持久化执行

> Classe de produção ciclo de longo Agentes não funcionam em`while True`O Mestrado em Ciências Humanas (M.L.M.) 调用都将成为一个带有检查点、retry 和重播的活动──Temporal of OpenAI Agents SDK 集集成已于2026年 3月 GA──Claude Code Routines (Anthropic) 调用可以运行定时的Claude Code 调用,而不需要持久的本地进程──Session 会在等待人工输入暂停,能在部署后继续存在,并从以`thread_id`Por exemplo, o sistema de controle de dados é um sistema de controle de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**先修要求：**Fase 15 · 10 (modos de autorização), Fase 15 · 01 (agentes de longo horizonte)
**Time:** ~60 minutes

## 问题

设设一个运行四小时的代理――它调用了三个工具,两次提示用户,并进行了四十次LLM 调用――运行了一半时,承载了它的主机重启了――会发生什么?

- Em uma forma simples.`while True`循环中: Tudo vai ser perdido. RUN 从头开始. 三工具调用 (三工具调用) 带有真实副作用) 会再次执行.
- Utilize persistência execução:Run 会从最近的检查点恢复──已完成的活动不会再执行;他们的结果将从持久化日志中重复播放──用户不需要再次批准已批准的事物──已完成的LLM调用不会再计费──

É o mesmo modelo que os motores de fluxo de trabalho têm fornecido há décadas.

A linha principal deste curso é: a duração do ciclo de confiabilidade vai diminuir. Se o projeto for correto, é uma nova forma de falha de segurança, se o projeto for errado, será falha de forma insegura.

## 概念

### Actividades  Fluxos de trabalho e repetição

- **Workflow**O código de organização das atividades deve ser definido, para que o logue de eventos possa ser reproduzido, sem que surjam diferenças inesperadas.
- **Activity**Uma unidade de trabalho não definida, que pode ser derrotada, é chamada de chamada de ferramenta, é escrita de arquivo, é requerida por HTTP.
- **Event log**• manutenção da loja de apoio. Todas as atividades iniciadas, completadas, falhas retiradas e todas as decisões do fluxo de trabalho são registradas.
- **Replay**Quando o processo de recuperação é iniciado, o fluxo de trabalho será re-executado; cada atividade já concluída retornará aos resultados registrados, mas não será re-executada.

Esta é a mesma forma que React  para DOM virtual, ou Git  Commits  Rebuild working tree                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

### Por que o LLM é adequado a este modelo

LLM 调用 tem as seguintes características:
- Não-confiança: temperatura > 0; até mesmo a temperatura 0 também varia e se move em versões do modelo.
- 昂贵(成本和延迟)
- Talvez não seja o caso.
- 带有副作用 (如果它们调用工具) 

Esta é a imagem típica da atividade. Colocar o envelope de cada LLM para a atividade, obtendo uma retratação exponencial de back-off, um checkpoint transversal e uma traça de modificação replicável.

### É`thread_id`Por um ponto de controlo

LangGraph、Microsoft Agent Framework、Cloudflare Durable Objects 和 Claude Code Routines foram recebidos para a mesma API 形态:一个 `thread_id`(ou similar) sessão de identificação; cada transição de estado são mantidas em postgreSQL 默认,SQLite usados para dev, redis usados para cache);resume 会读取最新检查点──

后端选择 é muito importante:

- **PostgreSQL**O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é?
- **SQLite**: só para desenvolvimento local; através do host 会失数据。
- **Redis**: velocidade rápida, mas se não for configurado AOF/snapshot 则是临时性的──
- **Cloudflare Durable Objects**: transparente distribuído; de única chave limitada;可存活数小时到数周。

### O trabalho de entrada como um primeiro estado

Proporcionar-depois-comprometer-Leção 15) requer uma espera duradoura do estado humano.

### Degradação de 35 minutos

METR observou que todos os agentes de quantidade medida 类别在连续运行超过约35分钟后都出现可靠性衰退――任务时间长翻倍,失败率大致变为四倍――持久化执行不会修复这一点;它只是让你能够运行超过可靠性曲线支持的时长――安全模式是将耐久性与重入时需要新 HITL的检查点结合,并配合预算杀开机(Lesson 13),壁钟时间如何都限制总计算――

### O que é que se passa ?

- 运行时间短于几分钟且没有人工输入――开销 > 收益――
- 严格只读的信息检索──
- Precisão de exigência em uma janela de contexto de tarefas de conclusão interna do fim de uma tarefa (certa tarefas de conclusão; certas tarefas de geração única)


```figure
memory-consolidation
```

## Use-o

`code/main.py`Utilize stdlib Python  implementar um mínimo de duração de executar motor──suporte:

- `@activity`decorador,将 inputs 和 outputs 记录到JSON event log──
- Uma função de fluxo de trabalho para a organização de atividades                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
- Um .`run_or_replay(workflow, event_log)`função, pode reproduzir atividades completadas, sem reexecutá-las.

O motorista 会模拟一个三 Activity 的工作流,在中途崩,并展示 (a) 朴素再试会重新执行所有内容,而 (b) replay 只运行缺失的活动──

## Entrega-o

`outputs/skill-durable-execution-review.md`A Comissão examinará se o Agente 部署 possui uma forma de execução de duração correta:Atividades, determinismo, ponto de verificação, estado de entrada humana e política de HITL-on-resume.

## 练习

1. 运行 `code/main.py`◊ observar simples retest  entre a reprodução  Actividade  execução de diferença de número de vezes ◊ Modificar ponto de choque,并 mostrar o número de reprodução 会相应变化。

2. Engenharia de brinquedo`thread_id` Simula duas sessões de partilha do mesmo motor, e confirma os registros de eventos deles Não vai entrar em conflito.

3. Em um motor de brinquedo, selecione uma atividade. Introduza um não-determinismo.`Workflow.now()`APIs) 

4. 阅读 LangChain's Runtime behind production deep agents 文章──列出 runtime 持久化的每种状态,并说明每种覆盖了哪种失败模式──

5. Para uma tarefa de codificação autônoma de 6 horas  Desenhar a política de checkpoint.

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|---|---|---|
| Workflow | “Agent 的脚本” | 确定性编排代码；可从 event log replay |
| Activity | “一个步骤” | 非确定性单元（LLM call、tool call）；执行前后都会被记录 |
| Event log | “backing store” | 每一次 state transition 的持久化记录 |
| Replay | “恢复” | 重新运行 Workflow；已完成 Activities 返回已记录结果，不重新执行 |
| Checkpoint | “保存点” | 以 thread_id 为 key 的持久化 state；resume 时最新状态胜出 |
| thread_id | “Session key” | 用来限定 durable state 范围的 identifier |
| 35-minute degradation | “可靠性衰减” | METR：成功率随周期大约呈二次下降 |
| Non-determinism | “replay 漂移” | Wall clock、random、LLM output；必须注册为 side effect |

## 延伸阅读

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) orçamento, voltas e currículo 语义。
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) RequestInfoEvent 形态。
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents)  Requisitos específicos de tempo de execução。
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) Mestrado em Direito Jurídico 调用 形态──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 35 minutos de degradação 参考。
