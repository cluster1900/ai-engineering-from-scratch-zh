# O Homem no Loop: Propõe-E Compromete-se

> 2026 Year About HITL 共识是具体的. Não é agent 发问, user点击 Approve── é proposta-then-commit: proposta de ação 会连同无权关 持久化到可久存储; 意图、数据系、permissões tocadas、blast radius 和 rollback plan 呈现给评论员; 只有在明确肯定确认后才 commit; 执行后再验证,确认副作用 确实发生── 长图的`interrupt()`Adi PostgreSQL checkpointing ✓ Microsoft Agent Framework ✓`RequestInfoEvent`, e o Cloudflare `waitForApproval()`O modo de falha típico é a aprovação de selo de borracha: Approva?  Não passou por revisão 就被点击──文档化缓解 是带明确的挑战-and-response.

**Type:** 学习
**Languages:** Python (stdlib，带 idempotency 的 propose-then-commit state machine)
**前置要求：**Fase 15 · 12 (Execução duradoura), Fase 15 · 14 (Tripwires)
**Time:** ~60 分钟

## 问题

Agente  executa uma ação. O usuário deve decidir: aprovação ou não. Se a decisão for instantânea, é muito provável que não seja revisão. Se a decisão for estruturada, ela será mais lenta, mas é acreditável.

O padrão HITL dos anos 2023 é o mesmo: O agente quer enviar um e-mail para X com o corpo Y  aprovar? Usurador clique em Aprovação。 Todo mundo acha que o sistema é seguro。 Na prática, esta interface é muito fácil de ser rubricada: o usuário aprova rapidamente, a aprovação  quase não pode prever nada; quando o agente sai errores, o rastro de auditoria irá mostrar uma longa série de usuários já se lembram de não ter recebido aprovação 历史。

O padrão de 2026 ano, é, propor-depois-comprometer, colocar HITL movido para um substrato durável 上, adicionado estruturado metadados,并 requer compromisso positivo.`interrupt()`、Microsoft Agent Framework `RequestInfoEvent`Cloudflare`waitForApproval()` API 名称不同;形态相同──

## 概念

### Propõe-se-depois-compromete máquina de Estado

1. **Propose.**Agente 生成一提案行动──它被持久化到耐用存储(PostgreSQL、Redis、Durable Object)──incluem:
   - intenção ((agente por que fazer isso)
   - Linhagem de dados ((que fonte levou a essa proposta)
   - Permissões tocadas(哪些 escopo / arquivos / pontos finais)
   - raio da explosão ((( pior situação é o quê)
   - O plano de reestruturação se for comprometido, nós vamos revogar)
   - - (Chasto de independência)
2. **Surface.**Revisor 看到包含全部 мета数据的提案──Revisor 是人(不是代理 自己 review 自己)──
3. **Commit.**明确肯定确认──acção 执行──
4. **Verify.**执行后,读取并确认副作用──如果验证步骤 失败,系统处于已知坏状态,并触发警告──

### chave de independência

没有无权力关键 时,过渡失败 后后的试图可能重复执行已批准的行动――具体例:用户批准转移 $100 from A to B──网络短暂动── 网络短暂动── 工作流重新尝试── 用户只批准一次,但转移 执行两次── 权力关键将批准 绑定到单个单个副作用;第二次执行是无-op──

Este é o mesmo que o padrão de idempotencia usado pelas API de Stripe e AWS.

### Durabilidade: por que as aprovações podem durar no processo

A sala de espera de aprovação é um segmento não pertencente ao agente de propriedade. O fluxo de trabalho é suspensa.`interrupt()`Com o checkpointing PostgreSQL 配对, em vez de apenas usar o estado de memória:

### Aplicações de carimbos de borracha e mitigação dos desafios e das respostas

HITL Approve / Reject botões) irá produzir rápida aprovação, mas não há real revisão──documentation mitigation:challenge-and-response checklist, requer em Approve botão ntar, antes de, para questões específicas dar respostas definidas.

- Você entende que esta operação vai tocar em que recurso?
- Confirmará o raio da explosão?
- Se falhar, tens um plano de retorno?

Não é por um processo, mas sim por uma função forçante. Não pode fazer isso.

### Que é consequente?

Não é necessário que cada acção seja proposta-depois-comitada.

- **Consequential actions**(始终 HITL): não é necessário re-inscriver­se em operações financeiras, comunicações em saída, alterações na base de dados de produção, operações destrutivas do sistema de arquivos,
- **Reversible actions**(有时 HITL): Edições reversíveis de arquivos locais  mudanças de fase 
- **Reads and inspections**(從不 HITL):读取文件、列出资源、调用只读的API──

### Verificação pós-ação

O compromisso foi executado  不等于 the side effect happened──Network-partition 和 race conditions 可能让工作流 以为自己成功,而后端 实际并没有持续──verificar etapa 会在承诺 后重新阅读目标资源 以确认──这与使用`RETURNING`Cláusulas de transacções de base de dados, ou`PutObject`后执行 AWS `GetObject`É o mesmo padrão.

### Lei da UE sobre IA Artigo 14

Artigo 14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           


```figure
mx-propose-then-commit
```

## Use-o

`code/main.py`Used stdlib Python 实现 uma máquina de estado de proposta-then-commitment。 armazenamento durável é o arquivo JSON。Idempotency key 是 (thread_id, action_signature) hash。driver 模拟三种情况:干净的批准流、过渡失败 后再尝试(必须不能双执行), bem como o rubber-stamp de padrão com o fluxo de desafio-e-resposta│对比──

## Entrega-o

`outputs/skill-hitl-design.md`Revisão de um fluxo de trabalho proposto no HITL se possui uma proposta-depois-compromiso 形态,并标记缺失的元数据、idempotency、verification或挑战-and-response layers──

## 练习

1. 运行 `code/main.py` confirmar a proposta aprovada Re-tentar utilizar um registro duradouro, e não re-executação.

2. Utilização `rollback`campo  expansão de registro de proposta──模拟一次验证步骤 失败的执行──展示 rollback 会自动触发──

3. 阅读 Microsoft Agent Framework `RequestInfoEvent`Docs.  Find out API incluem mas motor de brinquedo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

4. Para uma ação específica (por exemplo, um post em uma conta pública do Twitter) desenhar uma lista de verificação de desafios e respostas.

5. 选择一个同步 批准?快速 足够的场景(不需要耐用店) ―― Explicar a causa,并说明你接受的风险类──

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | “Two-phase approval” | 持久化 proposal + positive commit + verify |
| Idempotency key | “Retry-safe token” | 每个 proposal 唯一；第二次 execution 为 no-op |
| Data lineage | “Where it came from” | 导致 proposal 的具体 source content |
| Blast radius | “Worst case” | action 出错时的影响范围 |
| Rubber-stamp | “Fast approval” | 没有真正 review 就点击 “Approve” |
| Challenge-and-response | “Forcing checklist” | Reviewer 必须明确确认具体问题 |
| RequestInfoEvent | “MS Agent Framework primitive” | 带结构化 metadata 的 durable HITL request |
| `interrupt()` / `waitForApproval()` | “Framework primitives” | 同一形态的 LangGraph / Cloudflare 等价物 |

## 延伸阅读
- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)- Não .`RequestInfoEvent`,aprobações duradouras.
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/)- Não .`waitForApproval()`和 Objetos Duráveis
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) HITL 作为缓解长远风险的
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 高风险系统的监管基线──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  A estrutura constitucional da supervisão
