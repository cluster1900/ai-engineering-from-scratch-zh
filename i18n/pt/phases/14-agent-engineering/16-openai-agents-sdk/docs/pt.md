# OpenAI Agents SDK: Transferências, Guardrails, Tracking

> O OpenAI Agents SDK é baseado em Resposta API Construção de lightweight-grade multi-agent framework 五个原始:Agent、Handoff、Guardrail、Session、Tracing。Handoff é nomeado `transfer_to_<agent>`As ferramentas. O guardrail encontra-se em entrada ou saída.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- Explicar os cinco primitivos do OpenAI Agents SDK.
- Explicar as entregas: por que elas são construídas como ferramentas, o nome do modelo, a forma é o que, bem como o contexto como transferir.
- 区分 input guardrails、output guardrails 和 tool guardrails; explicação `run_in_parallel`Com modo de bloqueio.
- Usando o stdlib                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## 问题
Os agentes de delegados incapazes de fazer a limpeza, finalmente, colocam tudo em um instante. Os agentes sem guarda-roupa, distribuem PII, violam as políticas, ou fazem um ciclo para sempre. O SDK do OpenAI tornará o trabalho de vários agentes controlado.

## 概念
### Cinco primitivos

1. **Agent.**Mestrado em Direito Jurídico + instruções + ferramentas + manuseio:
2. **Handoff.**delegar  a outro agente ∙ , para um modelo que se apresenta em nome `transfer_to_<agent_name>`- É uma ferramenta.
3. **Guardrail.**Para a entrada (só o primeiro agente) ≈ saída (só o último agente) ≈ invocação de ferramentas (só cada ferramenta) ≈ validação ∞
4. **Session.**跨 turns 的自动对话历史──
5. **Tracing.**Gerações de LLM, chamadas de ferramentas, cargos, guarda-roupa de instalações.

### As entregas como ferramentas

模型会在它的工具名单中看 `transfer_to_billing_agent`❖调用 it will be into runtime 发射信号:

1. 复制 contexto de conversação `nest_handoff_history`Beta vai colapsar.
2. Utilize objetivo agente instruções Iniciar objetivo agente
3. Utilize o agente-alvo para continuar a correr.

É o padrão de supervisão da produção.

### Ferras de guarda

Três tipos:

- **Input guardrails.**Em qualquer chamada de LLM, antes de rejeitar os pedidos de insegurança ou de ultrapassar o escopo,
- **Output guardrails.**Em última análise, a produção de um agente foi lançada. Capturou vazamentos de PII, violações de políticas, respostas malformadas.
- **Tool guardrails.**按函数工具 运行──validate arguments、检查权限、audit execução──

Modo:

- **Parallel**(默认) ・Guardrail LLM 与 main LLM 同时运行。更低尾延迟──如果触发,主要LLM 的工作会被丢弃 (如果触发,主要LLM 的工作会被丢弃) ・浪费代币) ・
- **Blocking**(`run_in_parallel=False`O que é que é o "Guardail LLM"?

Os trifles vão sair .`InputGuardrailTripwireTriggered`- Não .`OutputGuardrailTripwireTriggered`- Não.

### Traçamento

默认开启──每次LLM geração、工具调、赞助和 guardrail 都会发射一个跨度──`OPENAI_AGENTS_DISABLE_TRACING=1`Vou sair.`add_trace_processor(processor)`Vai espalhar os seus espalhos até o seu próprio backend, ao mesmo tempo em que também será enviado para o backend do OpenAI.

### Sessões

`Session`将 conversação histórico 存储在后端 中(SQLite、Redis、自定义)`Runner.run(agent, input, session=session)`Vai carregá-lo automaticamente.

### Este é um lugar fácil de sair

- **Handoff drift.**Agente A, a mão para o Agente B, Agente B, a mão para o Agente A.
- **Guardrail bypass.**Ferramentas de proteção de ferramentas apenas em ferramentas de função; ferramentas de inserção (incluindo o leitor de arquivos e web) necessitam de uma política única.
- **Over-tracing.**O programa de informação é o que se deve fazer para que o seu conteúdo seja capturado.


```figure
ae-agent-handoff
```

## Construí-lo
`code/main.py`Utilizando o SDK  forma:

- `Agent`- Não.`FunctionTool`- Não.`Handoff`(como ferramenta de função de transmissão)
- 带 input/output/tool guardrails、handoff dispatch 和 hop counter 的 `Runner`- Não.
- Um simples emissor de espaço, usado para mostrar traços de forma.
- Um agente de triagem, irá de acordo com a consulta do usuário entregar até à faturamento ou suporte; guardrail irá estar em uma entrada acima de touch.

运行:

```
python3 code/main.py
```

O trace mostrou duas entregas bem sucedidas, uma viagem de guarda-roupa de entrada e uma árvore de espaço em relação ao conteúdo emitido pelo SDK real.

## Use-o
- **OpenAI Agents SDK**Utilizado em produtos OpenAI-first.
- **Claude Agent SDK**(Lessão 17) para produtos de primeira classe:
- **LangGraph**(Lessão 13) Para usar o estado explícito que você quer e a situação de currículo duradouro.
- **Custom**Usá-lo para precisão de controle de voz, multi-provedor, implementações federadas) situação.

## Entrega-o
`outputs/skill-agents-sdk-scaffold.md`Estafa de um aplicativo de SDK de Agentes, contendo agente de triagem, cargas, entrada/saída/arrelhas de ferramentas, loja de sessões e processador de rastreamento.

## 练习
1. 添加 handoff hop counter: supera N 次 transferências 后拒绝;;
2. - Não .`nest_handoff_history`实现为一个选项:在转前将 anteriores mensagens entrar em colapso 成一个总结──
3. 编写一个阻塞输出 guardrail──比较会触发它的提示与通过提示的延迟──
4. - Não .`add_trace_processor` Conectar ao registrador JSON                                                                                                                                                                                                                                                          
5. 阅读SDK docs──将你的sdlib brinquedo port到 `openai-agents-python`- Onde é que está?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | SDK 中的 Agent type；拥有 tools 和 handoffs |
| Handoff | "Transfer" | 模型调用以 delegate 给另一个 agent 的 tool |
| Guardrail | "Policy check" | 对 input / output / tool invocation 的 validation |
| Tripwire | "Guardrail trip" | guardrail 拒绝时抛出的 exception |
| Session | "History store" | runs 之间持久化的 conversation memory |
| Tracing | "Spans" | 覆盖 LLM + tool + handoff + guardrail 的内置 observability |
| Blocking guardrail | "Sequential check" | Guardrail 先运行；trip 时不浪费 Token |
| Parallel guardrail | "Concurrent check" | Guardrail 同时运行；latency 更低，trip 时浪费 Token |

## 延伸阅读
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) primitivos, manobras, guarda-roupa, rastreamento
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude 风格's contraparte
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 何時真正应该使用手柄
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Agentes SDK abrangência 映射到的标准
