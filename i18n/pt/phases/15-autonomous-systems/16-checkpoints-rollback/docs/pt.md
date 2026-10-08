# Pontos de controlo e retorno

> Cada vez que o gráfico-estado  transformação  cidade será perdurada;. Quando o trabalhador  colapsar, sua locação  expira, outro trabalhador irá de seu último ponto de controle  contactos    Cloudflare Durable Objects                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

**Type:** 学习
**Languages:** Python（stdlib，checkpoint 与 rollback state machine）
**Prerequisites:** Phase 15 · 12（Durable execution），Phase 15 · 15（Propose-then-commit）
**Time:** ~60 分钟

## 问题

Execução duradoura ((Lessão 12) Deixe o agente de colapso recuperar. Proposta-depois-compromete ((Lessão 15) Deixe a ação aprovada ser auditada.

O sistema real vai entrar em diferentes formas:

- **LangGraph**Vai transferir cada um dos estados gráficos do ponto de verificação para o PostgreSQL. Quando o trabalhador cai, o aluguer é liberado.`interrupt()`Está suspendido, mas ele mesmo será perpetuado.
- **Cloudflare Durable Objects**A data de recebimento é de um período de tempo de até 1 ano.
- **Microsoft Agent Framework**Em fluxo de trabalho API expostos`Checkpoint`- Não é o que se passa?

无论哪种情况,真正有效的组合都是:idempotency key (prevenir重复执行) + precondition check (prevenir a re-execução)

## 概念

### Cada vez que se transforma, se perdurará.

Grafico-estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### Recuperação do arrendamento

Quando o trabalhador , o fluxo de trabalho não será perdido; arrendamento  Uma declaração de curto prazo, dizendo que o trabalhador está executando esta execução) é apenas uma transição.

### Idempotencia + pré-condições

                                                                                                                                                                                                                                                              $1000 时，从 A 向 B 转账 $100── workflow 已 commit,在执行中崩,然后恢复──如果只检查无效率关键,并且执行恢复,那么转账会运行一次 (正确),但考虑在崩和恢复之间,A 余额通过另一个工作流 降到了 $500──无效率检查 仍然通过;前条件不通过──没有前条件检查,我们就会制造通过支──

Cada movimento tem consequências requer duas coisas:

- **Idempotency key**Prevenir la re-re-execução
- **Precondition check**O estado de confirmação continua a ser conforme com o movimento aprovado.

### 动作后验证

outil 返回 200不是验证──真正的验证会重新读取目标状态,并确认副作用 确实发生了──模式包括:

- Atualização da base de dados:`UPDATE ... RETURNING *`, e depois afirma que a linha de retorno corresponde ao estado previsto.
- Envio de e-mail: enviado em seguida em carregador de envio 中检查消息 ID──
- Facile write:读回文件并计算 hash──
- API call:对目标资源 执行后续 `GET`- Não.

Se verificar o "fail", o fluxo de trabalho está em um estado de malformação conhecido.

### Planejamento de reestruturação

Propõe-se então-comitê (Leção 15) em cada um dos seus movimentos de consequência tem um plano de retrocesso.

- **In-band rollback**: direct reversal efeito colateral`INSERT`后  `DELETE`, Envio após`Send-correction-email`)。
- **Compensating transaction**O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é.
- **Out-of-band rollback**"Lembra-te, suspende o fluxo de trabalho, mantém o estado de saúde para investigação".

Não-rollback (我们不能撤销这个) deve ser nomeado na proposta. Não há rollback.

### Artigo 14 da Lei da UE sobre IA

Artigo 14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

- Ponto de controlo pode ser consultado pelo auditor.
- Rollback já está praticado, pelo menos uma vez.
- O rastro de auditoria pode continuar a existir (continuar a existir)
- A verificação falha vai causar alerta, e não será silenciosamente registrada.

Se um fluxo de trabalho for executado durante o processo de recuperação, e depois se completar um efeito colateral sem verificação + rotulagem, não poderá ser aprovado o artigo 14.o 测试。

### 尖失效模式:重复执行

Os acidentes de produção mais comuns neste domínio são:

1. 动作已批准, o chave de liberdade é K.
2. Comprometo de começar, executar, voltar 200
3. Fluxo de trabalho em perpétuo compromiso  estado  antes de colapso 
4. Resumindo o fluxo de trabalho; ver aprovado mas não comprometido; reexecutar
5. Efeito secundário 触发两次──

缓解方式: durante a execução, antes de manter uma intenção de voo, usar a chave de idempotency 执行, então apenas durante a operação verificando o sucesso é marcado como comprometido . Se a operação tiver sido iniciada, mas o estado de escrita não tiver sido iniciado, você já sabe que precisa verificar e reiniciar quando necessário.


```figure
checkpoint-replay
```

## Use-o

`code/main.py`实现一个带检查点的工作流,包含无限能力、先决条件、验证 和滚动――driver 模拟四个场景:干净运行、崩后的重试(无限能力 捕获) 预定条件失败(workflow 中止且不触发动作) 验证失败(触发滚动) ⋅

## Entrega-o

`outputs/skill-rollback-rehearsal.md`Para o fluxo de trabalho proposto design rollback-test,并审计 checkpoint backend

## 练习

1. 运行 `code/main.py`❖验证四个场景── Para o cenário de acidente durante o compromisso, confirmação de movimento em várias tentativas 中只触发一次──

2. Modificar o marcador como feito primeiro, depois fazer o modelo, deixar o status escrever em movimento depois de iniciar.

3. Para um plano de reestruturação de produção específico, por exemplo, um canal Slack será classificado como "in-band"",compensando" ou "out-of-band" ("explicar sua escolha").

4. Selecionar um fluxo de trabalho familiar. Identificar cada estado de transformação. Para cada transformação, o requisito de durabilidade é de marcação.

5. Teste de repetição de rollback: desenhar um teste de extremo a extremo, executar o fluxo de trabalho real, fazê-lo cair, e confirmar o caminho de rollback 被触发── esse teste deveria dizer o quê?

## 关键术语

| Term | 人们的说法 | 它真正的含义 |
|---|---|---|
| Checkpoint | “保存点” | 每一次 graph-state 转换都会持久化到 durable store |
| Lease | “Worker 声明” | 短期声明，表示某个 worker 正在执行一个 run；崩溃时过期 |
| Precondition | “状态关卡” | 断言状态仍与已批准动作保持一致 |
| Post-action verify | “重新读取检查” | 确认 side effect 确实在目标系统中发生 |
| In-band rollback | “直接撤销” | 用逆向操作反转 side effect |
| Compensating transaction | “SAGA 撤销” | 一个新的动作，用来抵消原动作 |
| Mark-as-done-first | “状态写入顺序” | 在从 commit 返回前持久化 committed 状态 |
| Article 14 | “EU AI Act 人类监督” | 操作性含义：可查询 checkpoint、已演练 rollback、可审计 trail |

## 延伸阅读

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) Primitivos de pontos de controlo e recuperação de arrendamento
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) Objetos duráveis 作为 estado基底。
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 监管基线──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) estrutura de confiabilidade do fluxo de trabalho de longo prazo.
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) Claude Code Routines 形态──
