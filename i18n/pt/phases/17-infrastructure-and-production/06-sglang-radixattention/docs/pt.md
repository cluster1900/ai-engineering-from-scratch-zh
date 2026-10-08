# 面向 Prefix-Heavy Workloads 的 SGLang 与 RadixAttention

> SGLang vai armazenar o cache KV como um mesmo, recursos utilizáveis, e armazenar em árvore de radix. Em Llama 3.1 8B, com GPUs de 1K com GPT, o vLLang alcança cerca de 16.200 tok/s, enquanto o vLLM alcança cerca de 12.500, vantagem de cerca de 29%. Em prefixos RAG pesados, essa vantagem pode chegar a 6.4x, em caixas de clonagem de voz, em alta taxa de carga de trabalho superior a 86% da taxa de lançamento de projetos de tecnologia do LinkedIn, já está em risco de desaparecer em 400.000 de horas.

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**前置要求：**Fase 17 · 04 (vLLM Serving Internals), Fase 14 (Agentic RAG)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- draw out RadixAttenção:prefixos  como armazenar em árvore de radix, bem como blocos KV  como em sequências de raízes no mesmo ramo  comparticipação
- Explicar a agendamento de cache-consciente, bem como por que o FCFS não se adapta ao tráfego pesado de prefixos.
- 给定 prefix-cache hit rate 和 prompt length distribution, calculação de uma determinada carga de trabalho de velocidade prevista
- Dizer que 6.4x esse número é real, e não uma disciplina de ordens rápidas.

## 问题
经典服务 会将每个请求的提示 当作不透明──即使5000 RAG 请求都以同一个2000-Token系统提示加同一个检索序言 开头,vLLM也会对这个2000-Token预写填5000次──GPU 一次又一次地做同样工作──

 observar conclusão é:agentic 和 RAG workloads 几乎总是共享长的预写.

RadixAttention está fazendo isso. Os tokens são indexados na árvore radix; cada nó possui uma sequência de tokens no caminho da raiz para o nó.

O desafio está na programação. Se dois pedidos compartilham o prefixo de 2000 tokens, e o terceiro pedido apenas compartilham o mesmo prefixo de 200 tokens, você vai querer colocar dois pedidos de partilha de tempo juntos para o serviço, deixando o prefixo de tempo longo para o HBM.

## 概念
### Como índice de KV de árvore de radix

árvore de radix(trie compacto) armazenamento Sequências de Tokens。 cada nó ▌tem um intervalo de Tokens, bem como blocos KV calculados para esse intervalo。

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

Uma nova solicitação com um sistema de pedido + "Contexto: <doc A>" + "Question: Carol" 进来──调度器遍历:system prefix 匹配(复用124 blocos),doc-A ramo 匹配(复用31 blocos), então apenas para "Question: Carol" 分配新块(4 blocos)──Pre-emplen custo: 4 blocos de novos tokens──没有这棵树:160 blocos──pre-emplen 省约 ~40x──

### Programação de cache

Se o cache não cessa de funcionar, o uso repetido de árvores radix não faz sentido.

1. **Depth-first dispatch**◊ Selecionar a seguinte solicitação na fila, priorizar a seleção com o conjunto de execução atual  Rooted to the same branch of the request― Isso fará com que o ramo quente  mantenha-se fichado―
2. **Branch level 的 LRU，而不是 block level 的 LRU** Destruir todas as ramas (de folhas mais curtas usadas 开始), em vez de blocos individuais, assim a forma do cache 才与基根形 匹配──

FCFS  violaram estes dois pontos ⋅ Compartilhar 2.000 Token requisites ⋅ Em seguida, distribuir 50 Token requisites ⋅ Depois, 2.000-Token ramo foi expulso, para acomodar 50 Token naquela solicitação ⋅

### Você deve lembrar-se de referência números

- Llama 3.1 8B、H100、ShareGPT 1K Instruções:SGLang ~ 16.200 tok/s, em relação a vLLM ~ 12.500(cerca de 29% 优势) ⋅
- Prefixo RAG-pesado ((seme sistema + 相同doc, variação de questão):SGLang 上最高可达 6.4x。
- Cargas de trabalho de clonagem de voz: 86,4% taxa de acessos de prefixos-cache.
- As taxas de produção de clientes SGLang: depende da disciplina imediata, para 50-99%.
- 2026 já está implantado em mais de 400.000 GPUs.

### Ordenar 陷

6.4x Este número depende da ordem de modelo de pedido de pedido. Se o seu cliente em certas solicitações forçar a criação de um pedido de pedido.`[system, tools, context, history, question]`, entre outros pedidos ,`[system, context, tools, history, question]`, árvore não consegue encontrar prefixo compartilhado. Para humanos parece-se com algo compartilhado. Para árvore radix, são duas sequências diferentes.

工程师的杆: Seu modelo de prompt é o cache key. Fixação de ordem. Coloque todos os imutáveis conteúdos.

O caso real do estudo: mover conteúdo dinâmico  mover prefixo cachéable, fazer uma vez a taxa de impacto de cache de implementação  através de uma mudança de 7%  aumentar para 74% 

### RadixAttention Win Where,输 Where

Ganhos:
- RAG ((a mesma preâmbulo de recuperação, alteração da questão)
- Agentes (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s) (s)
- 带长系统提示 的聊天──
- 具有重复 preámbulos de voz / visão cargas de trabalho。

Perde ((voltar para o nível de VLLM de rendimento):
- Use unique prompts of single-shot generation ((completamento de código、 não há sistema de prompts de chat aberto)。
- Cada pedido dá um conteúdo único 交错插入 prefixo de pedidos dinâmicos。

### Por que é um cronograma  problema, não apenas kernel  problema

Você pode fazer reutilização de KV  implementar em um truque de kernel. SGLang's insight is, only when the regulator lets hot branch  keep resident 时,reuse 才会有收益.

### Interações com o VLLM

Estes dois sistemas não são uma competição rigorosa.`--enable-prefix-caching`O diferencial se reduziu, mas não desapareceu completamente, toda a pilha de SGLang é radix-primeira; o VLLM é posteriormente conectado para cima de onde vai.


```figure
roofline
```

## Use-o
`code/main.py` implementar um cache KV de brinquedo radix-tree, bem como um com duas estratégias de cronograma:FCFS e cache-consciente.

## Entrega-o
本课会生成 `outputs/skill-radix-scheduler-advisor.md` fornecer uma descrição da carga de trabalho (formato de modelo de solicitação, padrão de recuperação, número de inquilinos concorrentes), que gerará uma receita de solicitação de solicitação, bem como uma decisão sobre se é necessário adotar o SGLang.

## 练习
1. 运行 `code/main.py`◊ Na mesma carga de trabalho 上比较FCFS 和缓存意识──delta De onde vem, é prefill poupança ‧decode poupança, ou atraso na fila?
2. Modificar carga de trabalho, fazer pedidos 随机排列 `[system, tools, context]`O que é que vai acontecer?
3. 计算在 Llama 3.1 8B 上, como uma branca de radix 保持一个2000-Token system prompt resident 的 HBM cost──与没有预写的重复使用的16序列批费做比较──
4. 阅读 SGLang RadixAttention paper──用三句话解释为什么在前重负载下,树形 LRU expulso 优于块形 LRU──
5. 某客户报告缓存击率 只有8%──说出三个可能原因,以及你会为每一个原因运行的诊断──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "SGLang 那个东西" | KV cache 以 radix tree 索引，使 shared prefixes 能复用 blocks |
| Radix tree | "compact trie" | 每个 node 拥有一个 Token range 及其 KV blocks 的 tree |
| Cache-aware scheduler | "hot-branch-first" | 优先处理共享 resident branch 的请求的调度器 |
| Prefix-cache hit rate | "你的 prompt 有多少是免费的" | 从复用 KV blocks 服务的 prompt Tokens 比例 |
| FCFS | "first-come first-served" | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | "驱逐 leaf" | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | "cache key" | prompt 的 component order 决定 tree 能共享什么 |
| System prompt pinning | "resident prefix" | 保持 immutable system portion pinned，以避免 eviction thrash |

## 延伸阅读
- [SGLang GitHub](https://github.com/sgl-project/sglang) fonte 和 docs。
- [SGLang documentation](https://sgl-project.github.io/) RadixAttention 和 agendamento 细节──
- [SGLang paper — 高效编程 Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) design referência。
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) referência numeral e racionalização do agendador。
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) vLLM  própria realização de radix-like, para comparar
