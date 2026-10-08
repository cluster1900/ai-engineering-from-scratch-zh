# Memória compartilhada e quadro de papel

> O sistema de multi-agentes de 2026 terá dois métodos:**message pool**(todos podem ver as mensagens de todos, como AutoGen GroupChat ou MetaGPT) e**带 subscription 的 blackboard**(Agent 订阅相关事件, como Context-Aware MCP ou Matrix framework) ⋅ ambos são o único estado do sistema de multi-agentes  Isso significa que um bug interessante também está escondido aqui ⋅ referência falha modelo é ⋅**memory poisoning**O agente de um processo de envenenamento, o outro agente, coloca-o como um conteúdo verificado, a precisão está diminuindo gradualmente, e essa diminuição é mais difícil de debug.

**类型：**Aprender + Construir
**语言：**Python,`threading`)
**先修：**Fase 16 · 04(Modelo primitivo),Fase 16 · 09(Redes de enxames paralelas)
**时间：**Cerca de 75 minutos

## 问题

Multi-Agent  sistema precisa de um local para fazer o agente compartir fatos  Uma opção literal é  colocar todo o conteúdo através de mensagem   Mas isso equivale a usar uma duplicação extra para reinventar o estado de compartilhamento   Outra opção é  dar a todos um todo-escala   Mas o todo-escala                                                                                                                                                                                                                  

Quando um dos Agentes  produz uma ilusão e escreve uma ilusão no estado compartilhado, depois de cada leitura do estado, o Agente vai considerar essa ilusão como um fato.

É o envenenamento da memória. É a taxonomia MAST.

## 概念

### 两种主要拓

**Full message pool。**Cada Agente 读取每条消息──AutoGen GroupChat 和 MetaGPT Use this method──简单,透明,可检查,但不能扩展到大约10 Agentes,因为每个Agente的上下文都会被其他Agente的工作填满──

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**带 subscription 的 Blackboard。**Agente  declarar seus próprios temas de interesse; substrato de nível inferior apenas via relatórios. CA-MCP(arXiv:2601.11595) e Matrix framework descentralizado(arXiv:2511.21686) usar este método.

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### Caso de uso

- **Full pool**适合代理 数量少 ((< 10) 角色异构、对话是短周期的情况──当所有人能看到所有内容时,推理谁说什么非常直接──
- **Blackboard**适合代理 数量多、角色同质但实例众多(swarms) 、对话长期运行情况──Rutning 能节省 Token 成本并减少上下文污染──

生产系统通常混合使用:顶部使用一个小型全池 (página de planejamento),下方使用黑板 (página de trabalho) .

### Um envenenamento da memória

Três agentes  executar uma tarefa de estudo. A. é um agente de recuperação. A. é um agente de resumo.

1. A obtenção de uma página,并向共享状态写入消息:O estudo relata uma melhoria de 42 por cento na precisão.
2. A página obtida realmente escreveu que a melhoria foi de 4,2%.
3. B 读取共享状态后写入:Grande ganho de 42 por cento de precisão relatado (fonte: A).
4. C 读取共享状态后写入: Recomendação de adoção  42% de elevação é transformadora.
5. O último relatório cita um número de 42% que nunca existiu.

没有 Agent 崩──没有测试失败──系统工作正常──这个幻觉通过共享状态,从一个代理的上下文进入每个下游代理的推理中──

### Por que é que é um problema estrutural?

 Quando não há condição de partilha, a visão de Agente A permanece na sua substituição.  Quando a visão de Agente A permanece na sua substituição.

O problema não é o estado de partilha em si, mas o estado de partilha.**没有 provenance，也没有独立 verifier**❖ Três medidas de alívio podem ser tomadas para tratar este problema:

1. **每次写入都标注 provenance。**Cada entrada no estado de comunhão têm registro de quem escreveu, quando escreveu, em que momento escreveu, e também de qual fonte citou o agente.
2. **对写入做 versioning；把它们视为 append-only。**修正 é uma nova entrada, usada para substituir a antiga entrada, em vez de original地更新──audit trail 会被保留──
3. **至少保留一个无法写入共享状态的 Agent。**Agente de verificação de somente leitura 抽样入目、重新获取来源,并标记不一致──因为 não pode ser escrito em piscina, por isso não será envenenado em piscina──

### Tabela negra 先例 (Hayes-Roth, 1985)

Blackboard 模式比LLM agentes早了四十年──Hayes-Roth(1985,A Blackboard Architecture for Control) descreveu especialistas Knowledge Sources:它们观察一个全局黑板,贡献部分解决方案,并触发其他来源──2026年的黑板(CA-MCP、矩阵) é o mesmo modelo, apenas usando LLM agentes 作为知识来源, usando JSON blobs 作为部分解决方案──旧文献已经记录了写作,机会主义控制和一致性的解决方案,而现代系统正在重新发现它们──

### Projeção vs visão completa

純黒板 会給每名購読者同等的投影 (Pura carta negra 会給每名購読者同等的投影) 按主題 限定) 更多激進的設計是 更多激进的设计是 更多激进的设计是 更多激进的设计是 更多激进的设计是 更多激进的设计是 更多激进的设计是 更多激进的设计是 更多激进的设计是 更多的设计是 更多的**per-agent projection**Cada agente obtém uma visão determinada por seu papel. Os reductores de estado do LangGraph são a norma para 2026 para realizar a função de redução.

Projeção por agente  expandência mais forte, mas precisa de esquema                                                                                                                                                                                                                                                        

### Conteúdo de escrita 模式

Multidão de agentes, simultaneamente, escrever uma questão de concurência, não apenas LLM.

- **Sequential writer（single producer）。**Todos os escritos são feitos por um agente coordenador.
- **带 versioning 的 optimistic concurrency。**Cada entrada tem uma versão; autor em versão incompatível 失败并重试──经典数据库技术──
- **Topic partitioning。**Não há controvérsia entre os tópicos, mas há limites de partição bem concebidos.

A maioria dos escritores usam o texto seqüencial, porque o LLM é suficientemente lento, fazendo com que a contenção seja muito pequena, e o volume não é muito grande.

### Verificador inconstitucional

O último passo importante é o verificador de leitura apenas.

- Verificador e grupo de partilha de status ([[读取 blackboard]] ou pool)
- Verificador  não condição de escritura handle  só pode escrever em um canal de verificação individual。
- Verificador 独立获取 escreve 中引用的来源──标记分歧──
- Verificador  seu próprio contacto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

Sem essa separação, o verificador entra em contato com as novas entradas na piscina, o que significa que a piscina de veneno vai ser verificador de veneno, enquanto o verificador vai ser também veneno suas próprias verificações.


```figure
swarm-blackboard
```

## Construí-lo

`code/main.py`Usando o Python, realizou duas expansões, bem como um ataque de intoxicação de brinquedo e três medidas de alívio.

- `MessagePool` 线程安全的附加日志,支持完整读出──
- `Blackboard` 按主题按键的pub/sub,支持每代理订阅──
- `ProvenanceEntry` Cada vez que escrevo tudo o que escrevo (a)
- `PoisoningScenario` 运行一个三 代理研究任务,其中 Agent A 幻觉出小数点――印印最终报告――
- `Verifier` Um Agente de somente leitura, irá recuperar fontes e marcar incongruências.

运行:

```
python3 code/main.py
```

预期输出:
- Execução 1 ((sem verificador): 42% das evidências serão divulgadas até o relatório final―
- Execução 2 ((ha verificador): verificador 标记不一致,pool 被标记为 旗,最终报告包含 retraction──

## Use-o

`outputs/skill-memory-auditor.md`É uma habilidade, usada para auditoria de qualquer sistema de memória compartilhada de multi-agentes, design, verificação de origem, versão e separação de verificadores.

##  Publicá-lo

对于任何共享记忆 设计:

- Cada vez que escrevo, tenho registos de origem:`(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`- Não.
- 让日志保持 apêndice-only──Correções é citada por substituição de entrada nova──
- 部署 pelo menos um agente verificador de somente leitura com acesso à fonte independente.
- O verificador de saída será enviado para um canal único, em vez de voltar ao pool compartilhado.
- 记录 supersessions 在写中比例  比例上升是幻觉模式的早期证据──

## 练习

1. 运行 `code/main.py`Confirmar que a primeira corrida vai divulgar o seu visual, e a segunda corrida vai capturá-lo.
2. Adicionar um segundo visão:agente B                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
3. Vai fazer uma divisão de tópicos com um total de grupos`prices`- Não.`summaries`- Não.`analyses`O tema de partição vai fazer que os cenários de intoxicação mais difíceis de implementar, e para que não ajudam?
4. 阅读 Hayes-Roth(1985,A Blackboard Architecture for Control) .
5. 阅读 CA-MCP(arXiv:2601.11595)。将其 Compartilhado Context Store 映射到 `code/main.py`Classe de MessagePool ou Blackboard. CA-MCP acrescentou quais primitivas?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Message pool | “Shared chat history” | 每个 Agent 都会读取的 append-only log。完全透明，但扩展性差。 |
| Blackboard | “Shared workspace” | 按 topic keyed 的 pub/sub。Agent 订阅相关 topics。扩展更远。 |
| Provenance | “谁写了什么” | 每次写入的 metadata：writer、timestamp、prompt、sources。 |
| Memory poisoning | “幻觉在扩散” | 一个 Agent 的错误进入共享状态，下游 Agent 将其当作事实。 |
| Append-only | “没有原地更新” | Corrections 是用来 supersede 的新 entries。保留 audit trail。 |
| Unwritable verifier | “Independent auditor” | read-only Agent，会重新获取 sources 并标记不一致。 |
| Projection | “Scoped view” | 从 global state 计算出的 per-agent view。LangGraph reducers 是规范案例。 |
| Knowledge Source | “Specialist agent” | Hayes-Roth 在 1985 年对 blackboard participant 的称呼。 |

## 延伸阅读

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomia MAST; intoxicação da memória é uma falha de coordenação
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) Usado para coordinar servidores MCP Compartilhado conteúdo loja
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686)Baseado em uma fila de mensagens, sem orquestra central.
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Projeção por agente em produção 模式
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Notas de proveniência e verificação do Departamento de Produção
