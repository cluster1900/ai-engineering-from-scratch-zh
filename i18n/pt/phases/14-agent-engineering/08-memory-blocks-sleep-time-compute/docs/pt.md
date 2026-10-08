# Blocos de memória e computação do tempo de sono (Letta)

> MemGPT em 2024 tornou-se Letta. A evolução de 2026 adicionou duas ideias: o modelo pode editar diretamente blocos de memória funcionais separados, bem como o agente do tempo de sono do agente primário 空时异步整合记忆.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- Explicar o uso de três níveis de memória (core, recall, archive) e o papel de cada um deles.
- 解释 memory-block pattern:Human block、Persona block, bem como blocos definidos pelo usuário de objetos tipografados como um e semelhante.
- Descreva o que é o cálculo do tempo de sono, por que está fora do caminho crítico, e por que pode funcionar em comparação com o agente primário.
-  Realizar um ciclo de dois agentes de escrita, entre os quais o agente primário  fornecer resposta, o agente de tempo de sono  integrar blocos entre rotas 

## 问题
MemGPT ((Lessão 07) resolveu o fluxo de controle de memória virtual.

1. **Latency.**Cada operação de memória está localizada no caminho crítico. Se o agente tiver que cortar, juntar ou ajustar durante a espera do usuário, a latência da cauda aumentará drasticamente.
2. **Memory rot.**写入会不断累积――被矛盾推翻的事实会留下――检索会被陈旧内容淹没――
3. **Structure loss.**平的档案库 无法表达Human block 总是在提示中;Persona block 总是在提示中;Task block 按会议 交换──

Letta (letta.com) é a versão de 2026 de重写.

## 概念
### Três níveis

| Tier | Scope | Where it lives | Written by |
|------|-------|----------------|------------|
| Core | 始终可见 | 在 main prompt 内 | Agent tool call + sleep-time rewrites |
| Recall | 对话历史 | 可检索 | 自动轮次日志 |
| Archival | 任意事实 | Vector + KV + graph | Agent tool call + sleep-time ingest |

O núcleo é o núcleo MemGPT。Recall é o buffer de conversação  e sua parte final de expulsão。Arquivo é o arquivo externo。 Esse dissociamento resolveu as duas camadas de carga do MemGPT。

### Blocos de memória

O bloco é um nível central, em uma seção tipada, persistente, editável.

- **Human block** 关于用户的事实(姓名、角色、偏好、目标) 
- **Persona block** autoconceito do agente (身份、语气、约束)

Letta generaliza-lo para blocos definidos pelo usuário: para uso de objetivos atuais `Task`Bloco, para base de dados`Project`Bloco, para uso de hard binding `Safety`Bloco... Cada bloco tem...`id`- Não.`label`- Não.`value`- Não.`limit`(字符上限)`description`(让模型知道何时编辑它)

Blocos 可通过 ferramenta superfície 编辑:

- `block_append(label, text)`
- `block_replace(label, old, new)`
- `block_read(label)`
- `block_summarize(label)`                                                                                                                                                                                                                                                              

### Computação do tempo de sono

2025 年 Letta 的新增项:在后台运行第二个代理,位于关键路径外──Sleep-time agents 处理对话录录和代码库文本,将 `learned_context`写入共享区块,并整合或作废档案记录──

A propriedade que obtém:

- **No latency cost.**Resposta primária Não aguardo operações de memória
- **Stronger model allowed.**O agente de tempo de sono pode ser mais caro, um modelo mais lento, porque não tem latencia.
- **Natural consolidation window.**Quando o usuário não está esperando, executar de novo,

Esta forma corresponde ao modo de trabalho humano: você completa tarefas, dorme, longa-term memória em noite.

### Letta V1 e o raciocínio nativo

Letta V1 (`letta_v1_agent`, 2026) abandon `send_message`/ batimento cardíaco e em linha`Thought:`Tokens, transformação e apoio raciocínio nativo. Resposta API (OpenAI) 和带延伸思维的消息 API (Antropic) 会在单独的频道上发出推理,并跨轮次传递(在生产中跨供应商加密) ‧Control loop 仍是 ReAct──Tensor trace 是结构性的,而不是快速形──

### Este é um lugar fácil de sair

- **Block bloat.**Não há limites .`block_append`会很快触及限度──在会导致超出帽 的写入前接入区块总结──
- **Silent drift.**Agente de sono reescreveu o bloco, enquanto o agente principal, de não notar, mostrou diferenças entre os blocos.
- **Poisoned consolidation.**Agente de sono irá processar o conteúdo do atacante no núcleo. Lição 27


```figure
memory-blocks
```

## Construí-lo
`code/main.py`实现:

- `Block` id、etiqueta、valor、limit、descrição。
- `BlockStore` CRUD + `near_limit(label)`- Ajudante.
- 两个脚本化代理  `PrimaryAgent`Serviço de uma vez,`SleepTimeAgent`Em rotas entre os integrantes.
- Uma traça, mostra contendo blocos de escritos, bem como uma passagem de tempo de sono, resume um bloco e faz a abertura de um velho fato.

运行:

```
python3 code/main.py
```

Transcrição mostra esta separação: viradas primárias  muito rapidamente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

## Use-o
- **Letta**(letta.com) Como implementação de referência──可 auto-hosting 或使用管理云──
- **Claude Agent SDK skills**Como um bloco de conhecimento, a habilidade é um bloco de instruções, agente, que pode ser carregado.
- **Custom builds**适用于希望控制存储后端的团队──使用Letta API contract,以便后续迁移──

## Entrega-o
`outputs/skill-memory-blocks.md`O sistema de blocos em forma de Letta, com ganchos de sono, incluindo regras de segurança e cablagem de citação.

## 练习
1. - Adicione um .`block_summarize`ferramenta:当 `near_limit`返回 true 时, usando o modelo gerado de resumo 替换块值──哪个触发值能同时最小化总结调用 和块溢出?
2. Em arquivo, para realizar a dedução do tempo de sono: o texto de dois registros tem >90% de token sobreposição quando se dobra para um.
3. Por blocos 加版本──每次写入都记录旧值和差──暴露 `block_history(label)`Deixe os operadores tentarem por que o agente esqueceu X──
4. Quando eles tocam o bloco de segurança, submeter e solicitar uma segunda revisão do agente.
5. A Letta API (`letta_v1_agent`O esquema de bloco tem alguma mudança, o raciocínio nativo como mudar a forma do rastro?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Memory block | “可编辑的 prompt section” | Core memory 中 typed、persistent、LLM-editable 的 segment |
| Human block | “用户记忆” | 关于用户的事实，固定在 core 中 |
| Persona block | “Agent 身份” | Self-concept、语气、约束，固定在 core 中 |
| Sleep-time compute | “异步记忆工作” | 第二个 agent 在 critical path 之外执行整合 |
| Core / Recall / Archival | “层级” | 三层记忆拆分：始终可见 / 对话 / external |
| Block limit | “上限” | 每个 block 的字符限制；迫使进行 summarization |
| Native reasoning | “Thinking channel” | Provider-level reasoning output，而不是 prompt-level `Thought:` |
| Learned context | “Sleep output” | Sleep-time agent 写入 shared blocks 的事实 |

## 延伸阅读
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) padrão de bloco
- [Letta, Sleep-time Compute blog](https://www.letta.com/blog/sleep-time-compute) 异步整合
- [Letta, Rearchitecting the Agent Loop](https://www.letta.com/blog/letta-v1-agent) 原生 Raciocínio 重写
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) 起源
