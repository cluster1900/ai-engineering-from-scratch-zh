# FIPA-ACL e Acto de Discursão

> Antes do MCP, antes do A2A, havia FIPA-ACL. Em 2000, a Fundação IEEE para Agentes Físicos Inteligentes ratificou uma linguagem de comunicação de agente, que contém vinte performativos, duas linguagens de conteúdo, bem como um conjunto de protocolos de interação: contrato net, assinar/notificar, quando. Foi por isso que a ontologia saiu da indústria, porque a venda em relação à web era pesada, mas os sistemas multi-agentes promovidos pela LLM estão a re-implementar a mesma ideia, apenas sem sem semântica formal: contratos JSON  pegar performativos, linguagem natural  substituir ontologias.

**Type:** 学习
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（Why Multi-Agent）
**Time:** ~60 分钟

## 问题

O protocolo de agentes de 2026 é muito aglomerado: para ferramentas de MCP, para agentes de A2A, para auditoria empresarial ACP, para descentralização de confiança de ANP, para conteúdo em língua natural NLIP, mais CA-MCP e mais de vinte propostas de investigação.

诚实地看, a maioria deles está em redescoberta de um árvore de decisão muito específica, já há duas décadas de história. Austin ([[1962) e Searle ([[1969) ]] de teoria do discurso-ato nos deu as suas interpretações como ações. KQML ([[1993) ]] transformou-o em protocolo de fio. FIPA-ACL ([[2000]]) aprovação) deu uma padronização de referência: vinte linguagens de conteúdo SL0/SL1, bem como protocolos de interação para contrato-net e assinatura-notificação. JADE e JACK é uma plataforma de referência Java. Este esforço saiu em 2010 depois, porque a ontologia 开销太重, enquanto a web está ganhando o domínio.

Quando você vê MCP de `tools/call`Quando você vê o ciclo de vida das tarefas do A2A, ou o conteúdo compartilhado do CA-MCP, você vê uma espécie de re-descrição mais suave de decisões da FIPA, nativa do JSON.

## 概念

### Usage of speech acts Usage of speech acts Usage of speech speech speech

Austin observa que algumas frases não estão em descrição do mundo, mas em mudar o mundo. Prometo.                                                                                                                                                                                                                                                   

### 十个 FIPA performatives (parte lista)

| Performative | Intent |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该 proposal” |
| `reject-proposal` | “我拒绝该 proposal” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的 message 无法 parse” |
| `cfp` | “针对 X 发出 proposals 征集” |
| `subscribe` | “当 X 变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试了 X，但失败了” |

Lista completa`fipa00037.pdf`(FIPA ACL Message Structure) 中──重点不是记住它,而是这些内容中的每一个,都应对 LLM protocol 最终会重新添加一个原始──

### 规范的 FIPA-ACL mensagem

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

七个字段承载 protocolo envelope;一个字段(`content`(Tradutor) Carregar carga útil. O restante é que você cada vez dá o protocolo JSON, além de retempos, threading e ontologia.

###  duas plataformas legais

**JADE**(Java Agent Development framework, 19992020s) é a utilização mais ampla de tempo de execução compatível com a FIPA.

**JACK**(Software orientado para agentes, negócios) enfatizar em suas mensagens sobre o BDI (Crédito-Desejo-Intenção)

两者都在网堆 吞掉多代理使用案例 后走向衰落──MCP 和 A2A são os contêineres de 2026  runtime──

### A FIPA por que é que está fora?

- **Ontology 开销。**FIPA 要求使用共享 ontology 来 parse `content` Em ontologias 达成一致 é um processo de padronização de vários anos  Web 只是使用HTTP + JSON。
- **没人使用的 formal semantics。**SL (Linguagem Semântica) forneceu condições de verdade rigorosas, mas a maioria dos sistemas de produção usa conteúdo de forma livre,并忽略形式主義──
- **Tooling lock-in。**JADE apenas suporta Java; Jack é um produto comercial.
- **internet 赢下了 stack。**REST, em seguida, JSON-RPC, em seguida, gRPC, substituído por ACL de transporte.

### LLM 复兴是 FIPA-lite

Comparar com uma FIPA `request`Com um MCP`tools/call`- Não .

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

O mesmo envelope, diferentes sintaxis. Ambas carregam: quem, quem, quem, a intenção, a carga de pagamento, a correlação entre si.

A pesquisa de 2025 de Liu et al. ((A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP, arXiv:2505.02279) claramente aponta esta passagem: MCP para lidar com atos de fala de uso de ferramentas, A2A para lidar com atos de fala de agentes-peer, ACP para lidar com atos de fala de auditoria-trail, ANP para lidar com extensões de identidade descentralizada.

### Directamente indicativo de compensação

**FIPA 给了你、而现代 specs 放弃的东西：**

- Semântica formal: você pode provar`inform`Significa que o remetente acredita no conteúdo.
- Não há necessidade de discutir novamente se devemos ter um.`cancel`- Não, não.
- Os padrões de interação-protocolo de décadas:contrato-net, assinatura-notificação, proposta-aceitação e propriedades de corretão já conhecidas.

**现代 specs 给了你、而 FIPA 没有的东西：**

- Com todas as ferramentas modernas e compatíveis com cargas úteis nativas do JSON.
- LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- Transporte de pilha de web: https, SSE, WebSocket)
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `server/discover`Com o cartão de agente A2A  Capacidade de detecção 

Mais liberalizada da semântica de intenções, mais fácil de realizar.

### Protocolos de Interação que valham a pena transferir

A FIPA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

1. **Contract Net Protocol (CNP)。**Gerente 发出 `cfp`(convocatória de propostas); licitadores utiliz `propose`响应;gerente 接受/拒绝──这是规范的任务市场模式(Fase 16 · 16 Negociação)。
2. **Subscribe/Notify。**Subscriber 发送 `subscribe`; editor 变化时发送 `inform`É o que acontece em cada evento de 2026.
3. **Request-When。**当条件 Y 成立时执行 X──带预条件的延迟行动──2026 年的模拟是耐用工作流引擎中的延迟任务(Phase 16 · 22 Production Scaling)──

Cada um deles pode ser claramente mapeado para as filas de mensagens modernas, pesquisas HTTP + ou streaming de SSE.

### Deixar a ontologia , depois surgirá um problema .

 sem ontologia compartilhada, agentes 会从自然语言内容 推断含义──2026年有文档记录的失败模式 是 **semantic drift**Dois agentes usando a mesma palavra.`"customer"`O agente do receptor 按误解行动,而没有方案验证器 能捕获它──FIPA的 ontology 要求会在解析时间 拒绝这个消息──

Não é um problema de saúde.

- `content`SCHEMA JSON: em Wire 层 rejeitar estrutura erro.
- Artífices de tipo ((A2A): rejeição de erro de modalidade。
- Envelope 中的显式表演: Mesmo que o conteúdo seja uma linguagem natural, também pode fazer a intenção 明确无歧义。

### 2026 especificações 映射到 discurso-acto patrimônio

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent、correlation id | formal semantics、ontology |
| MCP `resources/read` | `query-ref` | explicit intent、correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle、state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard（Hayes-Roth 1985） | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

Desde cima até baixo, este quadro, o modelo é: manter a estrutura primitiva, abandonar o formalismo, deixar LLM 掩盖歧义──


```figure
sw-contract-net
```

## Construí-lo

`code/main.py`实现 um tradutor FIPA-ACL de fácil tradução. 编码和码规范的ACL封筒,并展示每种MCP / A2A message shape 如何归约为同样七个字段.

- 将五条 MCP-style 和 A2A-style mensagens 编码为FIPA-ACL。
- O FIPA-ACL 解码回现代等价形式.
- Utilização `cfp`- Não.`propose`- Não.`accept-proposal`- Não.`reject-proposal`, entre um gerente e três licitantes , executar uma negociação de contrato de rede .

运行:

```
python3 code/main.py
```

输出 é um segmento lado a lado, mostrar cada mensagem moderna de 2026 JSON 形式和 FIPA-ACL 形式, então mostrar uma vez a viagem de volta da oferta de rede de contrato.

## Use-o

`outputs/skill-fipa-mapper.md`É uma habilidade, ele vai ler qualquer agente-protocolo especificações e gerar FIPA-ACL mapeamento. Antes de adotar o novo protocolo, use-o para responder:`inform`- Não .

## Entrega-o

Não traga a FIPA-ACL para cá. Traga a lista de verificação para cá.

- Cada mensagem tem uma intenção primitiva.
- Existe correlação entre a resposta a pedido e a cancelamento?
- Existe uma linguagem de conteúdo clara ((JSON-RPC, texto simples, artefato de tipo estruturado)?
- Os protocolos de interação são de primeira classe, ou estás a começar a re-implementar a rede de contratos?
- Quando dois agentes têm diferença no significado do conteúdo, o que acontece?

Antes de entregar qualquer novo protocolo à produção, primeiro registre estes cinco problemas.

## 练习

1. 运行 `code/main.py` observar a codificação de ida e volta  identificar quais são os resultados da FIPA `tools/call`- Não.`resources/read`E a criação de tarefas A2A.
2. - Não .`cancel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `cancel`Resolveu os retrospectivos, e não resolveu nenhum caso de falha.
3. 阅读 FIPA ACL Estrutura de Mensagenshttp://www.fipa.org/specs/fipa00037/）第4.14.3 节──select a本课未覆盖的性能,并描述它的现代 JSON-RPC analog──
4. 阅读 Liu et al., arXiv:2505.02279──分别针对 MCP、A2A、ACP、ANP,列出它们保留和放弃的FIPA执行家族──
5. Para o teu próprio sistema.`request`performativo `content`Em comparação com o puramente natural-linguagem, este esquema lhe deu o que, e trouxe o que custos?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | “一种会做事的 utterance” | Austin/Searle：把 utterances 视为 actions。ACL 的理论源头。 |
| FIPA | “那个老 XML 东西” | IEEE Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope format：performative + content + metadata。 |
| Performative | “那个动词” | 一条 message 的 intent class：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单，范围更窄。 |
| Ontology | “共享词汇表” | 对 content language 所谈论概念的 formal definition。 |
| SL0 / SL1 | “FIPA content languages” | Semantic Language levels 0 and 1，即 formal content language family。 |
| Contract Net | “Task market” | Manager 发出 cfp；bidders propose；manager accepts。规范的 interaction protocol。 |
| Interaction protocol | “Messages 的模式” | 一组具有已知 correctness 的 performatives 序列：request-when、subscribe-notify 等。 |

## 延伸阅读
- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) Genear especificações modernas com patrimônio da FIPA  Conectar normas de 2025 levantamento
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) Formatos de envelope de aprovação de 2000 anos
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 完整的表演目录
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)- Não .`request`- Não .`query-ref`de atual sem estado de uso de ferramentas
- [A2A specification](https://a2a-protocol.org/latest/specification/) contrato-net 和 assinatura-notificação de agentes-peer 等价格形式
