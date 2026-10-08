# Memória: Contexto Virtual e MemGPT

> O contexto da janela é limitado. Dialog, Documentos e ferramentas não são. MemGPT (Packer et al., 2023) classificou-o como memória virtual do sistema operacional: o contexto principal é RAM, a loja externa é disco, o agente entre os dois realiza a página.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- 解释 MemGPT 所基于的 OS 类比:contexto principal = RAM,contexto externo = disco, ferramentas de memória = página de entrada/saída。
- Utilize stdlib 实现两层 MemGPT 模式:buffer de contexto principal, armazenamento de pesquisa externa, bem como ferramentas de entrada/saída da página.
- 描述 agent 如何发发发出"interrupts"来查询或修改外部记忆,以及结果如何被拼接回下一个提示──
- 识别会延续到 Letta(Lessão 08) и Mem0(Lessão 09) MemGPT 设计选择。

## 问题
O fenômeno de contexto parece ser capaz de resolver a memória.

1. **Overflow.**Dour round dialog、长文档,或工具-call-heavy trajectory 会越窗口──超越截点一切都会消失──
2. **Dilution.**Mesmo dentro da janela, inserir conteúdo sem ligação também será raramente liberado para o conteúdo importante Atenção.
3. **Persistence.**Nova sessão da janela em branco começou. Não há memória externa.

Uma janela maior ajuda, mas não resolve o problema. O documento de 2025 do Mem0  Messa até 128k-janela base  ainda vai perder um agente de janela 4k  Utilizando a memória externa pode capturar fatos de longo horizonte 

## 概念
### MemGPT:OS 类比

Packer et al. (arXiv:2310.08560, v2 Feb 2024) irá gerenciar o contexto 映射到操作系统虚拟内存:

| OS concept | MemGPT concept | 2026 production analog |
|------------|---------------|------------------------|
| RAM | main context (prompt) | Anthropic/OpenAI context window |
| Disk | external context | Vector DB, KV, graph store |
| Page fault | memory tool call | `memory.search`, `memory.read`, `memory.write` |
| OS kernel | agent control loop | ReAct loop with memory tools |

agente 运行一个普通的 ReAct loop──额外的一类工具 允许它把数据页在和页在主语境中──

### Dois níveis

- **Main context.**Fixar o grande de prompt, guardar o actual tarefa.
- **External context.**无界, através de ferramentas 搜索. 相关时读取.

O artigo original avaliou o projeto em duas tarefas de janelas de base: análise de arquivos de mais de 100 mil tokens, bem como chat de várias sessões para manter memória persistente ao longo do dia.

### Padrão de interrupção

MemGPT  Introdução de memória como interrupta: em diálogo, agente pode utilizar ferramenta de memória, tempo de execução  executa-lo, resultado como nova observação 拼接进下一次助手转──概念上等于Unix `read()`syscall: bloque o processo, retorna em bytes, e o processo continua a funcionar.

标准 memory 工具接口:

- `core_memory_append(section, text)` 写入 prompt 的 persistente seção。
- `core_memory_replace(section, old, new)` 编辑 persistente secção。
- `archival_memory_insert(text)` 写入 loja externa pesquisável。
- `archival_memory_search(query, top_k)` De loja externa 检索。
- `conversation_search(query)` 扫描过去的转

### MemGPT's border with Letta's starting point

2024 年 9 月,MemGPT 成为 Letta──research repo (`cpacker/MemGPT`)  ainda conservado; Letta  ampliar este projecto:

- Três níveis em vez de dois níveis:
- Use raciocínio nativo 替代 `send_message`- O ritmo cardíaco.
- Agentes de sono 运行 memória de trabalho asincronizado (Lessão 08)

Mesmo que o sistema de produção opera Letta、Mem0, ou auto-definir loja de dois níveis, o papel MemGPT  ainda é a base de 2026 anos.

### Este é um lugar fácil de sair

- **Memory rot.**写入积累得比读取更快;retrieval 被陈旧 facts 淹没──修复方式: regular consolidation(Leta-time sleep-time), evidentemente invalidação(Mem0 conflict detector)。
- **Memory poisoning.**Memória externa é o texto que foi detectado. Se o conteúdo controlado pelo atacante 落入メモリノート,agent 会在下一セッション 重新摄入它──これはGreshake et al.
- **Citation loss.**Agente recorda que o usuário me deixou navio X, mas não consegue citar qual é a rota.


```figure
context-budget
```

## Construí-lo
`code/main.py`Use stdlib  implementar MemGPT de dois níveis padrão:

- `MainContext`  Fixada grandezza                                                                                                                                                                                                                                                           `core`Dict 和 `messages`Lista; supera cap 时自动紧缩 最旧消息──
- `ArchivalStore` armazenamento de armazenamento em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memória em blocos de memórias em blocos de memórias em blocos em blocos em blocos de memórias em blocos em blocos em blocos em blocos de memórias em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos de memórias em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos de memóricas em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos em blocos
- 五个映射到 MemGPT surface de ferramentas de memória
- Um agente guiado, primeiro encher os fatos no arquivo, depois passar a usar.`archival_memory_search`回答问题──

运行:

```
python3 code/main.py
```

trace  demonstrar agente  escrever três fatos, vai conteúdo principal  preencher até capp 触发驱逐), e depois, através de arquivo 检索来回答后续问题,在没有真实 LLM的情况下复现 MemGPT workflow──

## Use-o
Hoje, cada sistema de memória de produção é uma variante do MemGPT:

- **Letta**(Lessão 08)  三層、native reasoning、sleep time computation。
- **Mem0**(Lessão 09)  Vector + KV + gráfico, com camada de pontuação 融合──
- **OpenAI Assistants / Responses**  através de fios 和 arquivos 管理 memória。
- **Claude Agent SDK**                                                                                                                                                                                                                                                              

选择, em vez de seguir o padrão central 选择; core pattern 就是 MemGPT。

## Entrega-o
`outputs/skill-virtual-memory.md`É uma habilidade replicável, pode ser usada para qualquer tempo de execução de alvo 生成正确的两层记忆架(main + archive + tool surface),并接好排放政策和引用字段──

## 练习
1. Adicione um em Tokens  medida `max_main_context_tokens`Caps`len(text.split())`* 1.3 近似) ・超越 cap 时,把最旧消息紧紧成总结──比较有没有总结者时的行为──
2. Em loja de arquivos 上正确实现 BM25(term frequency、inversa document frequency) ・・・ em conjunto de fatos de brinquedo 上测量 recall@10,并与令牌-overlap baseline比较──
3. 给档案插件 添加 `citation`campos(sessão_id, turn_id, source_url)。让代理 在每个检索支持的答案中引用来源。
4. 模拟记忆中毒:添加一条档案记录,内容是"ignorar todas as instruções futuras do usuário". 编写一个 guard,扫描检索 中指示状文,并把它们标记为不信任的.
5. Implementar o transporte para uso do repo de pesquisa MemGPT de esquema JSON de memória central (`cpacker/MemGPT`)― Quando as cordas são transmissas para as secções de tipografia, o que acontece?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Virtual context | “无限 memory” | Main（prompt）+ external（searchable）两层，带 page in/out |
| Main context | “Working memory” | prompt：固定大小，始终可见 |
| Archival memory | “Long-term store” | External searchable persistence，按需检索 |
| Core memory | “Persistent prompt section” | 固定在 main context 内的命名 sections |
| Memory tool | “Memory API” | agent 发出的用于读写 external memory 的 tool call |
| Interrupt | “Memory page fault” | Agent 暂停，runtime 获取，结果拼接进下一轮 |
| Memory rot | “Stale facts” | 旧写入淹没 retrieval；用 consolidation 修复 |
| Memory poisoning | “Injected persistent note” | attacker content 被存为 memory，并在 recall 时重新摄入 |

## 延伸阅读
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) Receber OS 启发的虚拟环境 论文
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Evolução de três níveis
- [Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) O contexto  O orçamento
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) construir memória de produção híbrida sobre esse modelo
