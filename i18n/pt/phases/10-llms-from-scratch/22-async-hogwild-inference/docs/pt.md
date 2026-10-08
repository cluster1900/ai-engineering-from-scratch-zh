# Sincronizar com Hogwild!

> A descodificação especulativa ((Fase 10 · 15) irá acontecer em uma única sequência de tokens de execução em conjunto. Inferência(Rodionov et al., arXiv:2504.06261) faz outra coisa:并行运行同一个LLM的 N个实例,并让它们共享一个关键价值缓存──每个工人都能立即看到其他工人生成的代币──现代推理模型QwQ、DeepSeek-R1无需任何细节调整,就能通过这个共享缓存自我协调── esse método ainda está em fase de experimentação, mas abre uma nova dimensão do paralelismo de inferências, e também decodifica com especificações 正交──本课会使用 stdlib Python 实现一个两个工人Hogwild! Simulador,并解释为什么共存缓存合作 会从现有模型的推理能力 中涌现出来──

**类型：**Construir
**语言：**Python (stdlib)
**先修：**Fase 10 · 12 ((optimização da inferência),Fase 10 · 15 ((descodificação especulativa)
**时间：**- 60 minutos.

## Objectivo de aprendizagem

- 描述三种常见的平行LLM topologies ((voting、subtask、Hogwild!),并说明每一个针对的问题──
- Configuração central de Hogwild: vários trabalhadores, um cache de KV compartilhado, através da auto-promulgação, a coordenação emergente.
- De acordo com o número de trabalhadores.`N`、paralelas em nível de tarefa `p`E despesas gerais de coordenação`c`計算 Hogwild! de tempo de parede de velocidade.
- Em brinquedo problema, implementar um simulador Hogwild! de dois trabalhadores,并观察 emergente divisão de tarefas.

## 问题

现代 LLMs 通过生成长时间的推理链来解决困难问题5000 tokens 步骤逻辑 很常见,深度数学问题出现数万代币也不少见;; no modelo 70B 上以35代币/秒解码,50k代币 需要24分钟;; esse modelo não possui interagem.

A descodificação especulativa ((Fase 10 · 15) através de uma única sequência interna并行化, pode trazer 3-5x de velocidade.

Obviamente, a questão é: podemos transcender sequências e organizar?

已有工作包括: grupos de votação(运行 N 个模型,选择多数答) 、tree-of-thought (tree of thought) 、分支出 reasoning paths 并重新组合) 和多代理框架 (((para cada agente, divide sub-task,并使用协调员) ⋅ estes tudo podem fornecer ajuda em domínios de tarefas específicos.

Hogwild! Inferência  Adotou diferentes métodos。N 个工共享一个KV cache。 Cada trabalhador 个工都会立即看到其他工人生成的代币,就像这些代币 已经在自己的背景中一样── trabalhadores, sem qualquer treinamento ou ajuste fino, se descobrirão como分工──Modernos modelos de raciocínio ((QwQ、DeepSeek-R1、Claude-family reasoning mode) 能够读取共享缓存,并说出类似我看到工人2 已经处理了基案,所以我来处理诱导步这样的话──

Até 2026 anos, a velocidade depende da carga de trabalho, e ainda está em fase de experimentação.

## 概念

###  configuração

Ini始化 N 个 worker processes,全部运行同一个 LLM── não usar caches KV por trabalhador, mas manter um caché compartilhado──当 worker `i`Títulos de produção`t_j`时, este token será escrito no próximo local do cache compartilhado.`k`执行下一步时,它读取缓存的当前状态 (), incluindo até agora todos os N 个工 生成的全部内容) 

Em tempo de passo, os trabalhadores vão competir para escrever tokens. Não há índice de posição por trabalhador.

### Por que a coordenação vai surgir ?

Os trabalhadores 共享一个缓存. Você é uma das N instâncias que trabalham juntas neste problema. Cada instância lê a memória compartilhada e pode ver o que outras instâncias escreveram. Evite o trabalho redundante.

Hogwild! paper ((Rodionov et al., 2025) relatou o seguinte observado:

- Os trabalhadores vão elaborar planos, e, através do caché, transmitir-nos aos outros trabalhadores.
- Os trabalhadores observarão os erros dos outros trabalhadores no raciocínio, e indicarão estas questões.
- Os trabalhadores vão estar a planear 失败时适应情况,并提出替代方案──
- Quando o requisito de inspecção de despedimento é imediato, os trabalhadores vão inspeccioná-lo e voltar para outros trabalhos.

Estes não precisam de ajuste fino. Comportamento emergente do modelo já possui capacidades de raciocínio.

### 命名

Este artigo leva o nome de Hogwild! SGD(Recht et al., 2011), um tipo de optimizador de atualização assíncrona.

### RoPE  Deixe isso ser viável

Embutidos de posição rotativa ((RoPE, Su et al. 2021) através de rotação de Q 和 K vetores 中 的编码位置信息──因为 posições são rotações, em vez de compensações de fixação, então a posição do token pode ser movida, sem necessidade de recalcular a entrada do cache KV── quando trabalha`i`写入 cache compartilhado posição `p`时,读取该职位的其他员工可以直接使用缓存输入不需要重转

Em um modelo de posição aprendida ou absoluta, Hogwild!

### Muralho-tempo 数学

设 `T_serial`É um trabalhador que resolve sozinho o problema.`p`É uma fração paralelavel de nível de tarefa.`c`É por passo coordenada sobrehead (((读取扩展后的缓存,并决定要写什么)

Tempo de trabalho individual:`T_serial`- Não.
Se a coordenação é gratuita, N-trabalhador Hogwild! tempo é:`T_serial * ((1 - p) + p / N)`É o clássico de Amdahl.
加入 coordenação sobrecarga 后:`T_serial * ((1 - p) + p / N) + c * steps_per_worker`- Não.

Para que o trabalhador tenha produtividade,`c`必須相對每步解码時間 足夠小── 對於生成5k+ tokens的推理模型, trabalhadores podem suportar uma coordenação de mais de 100 tokens, e ainda estão na frente── 對於短聊任務,協調會占主导,Hogwild! 会比串差更──

###  exemplos concretos

Problemas de raciocínio: 10k tokens de cadeia de pensamento.`p = 0.7`• a coordenação de cada trabalhador com o seu custo geral;`c = 200`Tokens── utilização `N = 4`trabalhadores:

- Tempo de série: 10000 passos de decodificação:
- Hogwild! tempo: 10000 * (0,3 + 0,7 / 4) + 200 * 4 = 10000 * 0,475 + 800 = 5550 passos de decodificação。
- Aceleração: 10000 / 5550 = 1,8x.

Isto é apenas um benefício médio. Mas em problemas de raciocínio mais longos (50 mil tokens) em que a coordenação será reduzida, a velocidade será impulsionada para 2,5-3x.

### - Não, não.

- 长 Raciocínio problemas ((1000 tokens), entre as quais a tarefa pode atravessar sub-objetivos independentes并行化。
- 已被训练为步骤思考的推理模型── não-razoing modelos 无法很好地自我协调── já foram treinados para pensar modelos de raciocínio passo a passo.
- Implementações de um único nó, e há suficiente VRAM 容纳 cache compartilhado, além de processos de trabalho N 个.

### 什么时候不使用

- 短互动聊天──Coordenação sobrehead 会占主导──
- 无法并行化任务(单一线性证明、单一编译) ――N=1 是上限──
- Modelos não racionais não surgirão de coordenação.
- Implementações de vários nós. Caches compartilhadas. Precisam de sincronização de trabalhadores cruzados muito rápida.

###  Estado de experiência

截至2026年4月,Hogwild! é um método de pesquisa,并有开源 PyTorch implementação── ainda não apareceu adoção de produção──三阻因素:

1. 跨同步进程 管理共享 KV cache 是非平凡的工程问题──
2. Coordenação emergente depende da tarefa; referências ainda estão em construção.
3. Com relação aos benefícios que a descodificação especulativa já trouxe, as velocidades são mais moderadas; as duas podem ser combinadas, mas a complexidade do projeto posterior à combinação é de uma mesma dimensão.

Vale a pena saber. Vale a pena experimentar.


```figure
continuous-batching
```

## Construí-lo

`code/main.py`Realizar um simulador Hogwild!

-  dois processos de trabalho, cada um são de determinação LLM, irá gerar com probabilidade conhecida vários tipos de tokens (work-tokens, observe-tokens, coordenadas-tokens) um dos
- Um cache compartilhado, apenas uma lista de tokens, dois trabalhadores estão lendo e escrevendo.
- Uma lógica de coordenação simples: quando um trabalhador vê outro trabalhador já produzido suficientes tokens de trabalho em uma categoria, ele escolhe uma categoria diferente.

Simulador 会在固定步骤预算 下运行,并报告:

- 產生工作代號 总数──
- 总 tempo de parede(pasos de trabalhadores 数量)。
- Comparado com o trabalho solitário, a velocidade é eficaz.
- O trabalhador escreveu o sinal.

### 步骤 1: cache compartilhado

Uma lista de dois trabalhadores que vão ser adicionados.`threading.Lock`Aqui estamos usando o contador.

### 步骤 2: Loop de trabalhador

Cada trabalhador em cada passo:

- 读取当前 cache compartilhado
- De acordo com o que já foi escrito, decidiu qual tipo de token deve ser escrito.
- - Escrevi um símbolo.

### 步骤 3: heurística de coordenação

Se a categoria X já tem K 个 token no cache, e o trabalhador originalmente queria escrever a categoria X, então o trabalhador vai mudar para a categoria Y. É um brinquedo substitutivo, usado para indicar o comportamento do modelo de raciocínio:

### 步骤 4: aceleração de medida

Diferentemente, os números de trabalho devem ser de 1,5-1,8x.

### 步骤 5: sobre a coordenação 施压

Reduzir a sensibilidade da heurística de coordenação.  Reaplicar.  Observar Se não houver uma boa coordenação, N=2 terá espaço para produzir os mesmos tokens, a velocidade cairá para 1 abaixo.  Isto é de acordo com a observação do papel: esta técnica só é válida nos trabalhadores que possuem capacidade de raciocínio auto-coordenado.

## Use-o

截至 2026 年 4 月, integração Hogwild! em produção ainda é de pesquisa- grau── implementação de referência de Yandex/HSE/IST baseada em PyTorch, objetivo é DeepSeek-R1 和 QwQ modelos 上 上的单节多进程设置──

务实的采用路径:

1. Profil de sua tarefa de raciocínio-carga de trabalho──metagem de tokens 中探究的战略──多种策略──案例分析──搜索) 与线路的占比──
2. Se exploração 占主导,运行两工Hogwild! experimentar.
3. Se a melhoria for inferior a 1,3x, indica que está em regime dominado pela coordenação.
4. Se a melhoria for superior a 1,5x, avançar até N=4 e novamente medir.

Com o decodificação especulativa 组合: cada Hogwild! trabalhador 都可以独立使用规范解码──两种速度升级 会(大致)相乘,使使3x规范解码 和 1.8x Hogwild! 达到对天真单工解码的有效5.4x──

## Entrega-o

本课会生成 `outputs/skill-parallel-inference-router.md` determinar um perfil de carga de trabalho de raciocínio (tokoen budget, task parallelism profile, model family, deployment target), que será conduzido entre a votação, a criação de um "tree-of-thought", o "multi-agent", o "Hogwild!" e as estratégias de decodificação especulativa.

## 练习

1. Utilize默认设置运行 `code/main.py`Confirmar no mesmo tempo de parede dentro, N=2 Hogwild! configuração em relação a N=1 linha de base  produzir mais tokens de trabalho

2. Reduzir a intensidade da heurística de coordenação `coordination_weight=0.1`O trabalho de trabalho é mais rápido que o trabalho de trabalho.

3. Calcule uma tarefa de raciocínio de 50k-token em`p=0.8, c=500`且 N=4 trabalhadores 时的预期 Hogwild! speedup──再对对一个1k-token chat task 在 `p=0.3, c=200`E N=4 时做同样计算――为什么一个是收益,另一个是损失?

4. 阅读Hogwild! paper's Section 4 (a avaliação preliminar)  encontrar autores 报告的两个失败模式──describe a better coordination prompt

5. Em jogo, Hogwild! com o decodificação especulativa 组合: cada trabalhador 内部 use 2-token spec-decode── relatório multiplicative speedup── quando dois trabalhadores estão pensando em expandir com um prefixo de caché compartilhado 时, surgirá o problema de contabilidade?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Hogwild! | “Parallel workers, shared cache” | 同一个 LLM 的 N 个 instances 并发运行，并共享一个 KV cache；通过 self-prompting 实现 emergent coordination |
| Shared KV cache | “The coordination medium” | 一个不断增长的 KV buffer，所有 workers 都会读取和写入；让 tokens 能在 workers 之间立即可见 |
| Emergent coordination | “No training needed” | 具备 reasoning 能力的 LLMs 可以读取 shared cache，并在没有任何 fine-tuning 或显式 protocol 的情况下分工 |
| Coordination overhead (c) | “Tokens spent orienting” | 每个 worker 读取扩展后的 cache 并决定下一步做什么的成本；相对于总 decode time 必须保持较小 |
| Parallelizable fraction (p) | “What can run in parallel” | Task-level parallelism：总工作中并非内在 sequential 的比例 |
| RoPE enables Hogwild! | “Rotary positions are shift-invariant” | 因为 positions 是 rotations，写入 shared cache 不需要重新计算之前的 tokens |
| Voting ensemble | “Run N, pick the majority” | 最简单的 parallel inference topology；适用于 classification，对 long-form reasoning 帮助较小 |
| Tree of thought | “Branch and prune” | 探索多个 branches 并进行 pruning 的 reasoning strategy；使用显式 coordination logic |
| Multi-agent framework | “Assign sub-tasks” | 每个 agent 获得一个 role；由 coordinator 编排；protocol overhead 很重 |

## 延伸阅读

- [Rodionov et al. — Hogwild! Inference: Parallel LLM Generation via Concurrent Attention (arXiv:2504.06261)](https://arxiv.org/abs/2504.06261)O artigo, em QwQ e DeepSeek-R1
- [Recht, Re, Wright, Niu — Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent (arXiv:1106.5730, NeurIPS 2011)](https://arxiv.org/abs/1106.5730) 原始 Hogwild!,名称来源
- [Su et al. — RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864) RoPE, que permite inferir o caché compartilhado
- [Yao et al. — Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601)A estratégia de raciocínio da árvore do pensamento, Hogwild!
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) Descódigo especulativo, Hogwild!
- [Hogwild! reference PyTorch implementation](https://github.com/eqimp/hogwild_llm) Experimentos em papel
