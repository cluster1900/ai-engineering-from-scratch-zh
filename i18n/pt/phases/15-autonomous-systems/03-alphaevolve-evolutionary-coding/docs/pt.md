# AlphaEvolve  演化式编码 Agentes

> Para criar um modelo de codificação de fronteira com o avaliador de evolução e controle de máquinas 配对──让循环运行足够久──, ele encontrará um processo de matriz multiplicadora 4x4 复数 乘法, usando apenas 48 vezes o volume乘法, que é a primeira vez em 56 anos que ultrapassa Strassen──, ele também encontrou uma heurística de regulação Borg no âmbito do Google, recuperando cerca de 0,7% do recurso de cálculo em conjunto no ambiente de produção──, esta estrutura está tentando manter-se simples──, e recebe os benefícios da rigorosa avaliação do avaliador──.

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01（长周期 framing），Phase 15 · 02（self-taught reasoning）
**Time:** 约 60 分钟

## 问题

LLM pode escrever código;. Algorithms de desenvolvimento podem ser pesquisados no espaço de código;. Os dois foram tentados separadamente durante décadas, também atingiram o limite superior. LLM é um limite fictício: o modelo escreverá o código que parece razoável, mas não conseguiu o seu chamado funcionamento.

AlphaEvolve(Novikov et al., DeepMind, arXiv:2506.13131, junho 2025) colocá-los juntos. LLM propôs editores específicos para a base de dados de programas; avaliador automático para cada variação; alta parte dos variações para serem os pais da próxima geração. LLM é responsável por passos caros: escrever código parecido razoável; avaliador  capturar a ficção.

Os resultados do relatório do trabalho incluem: 48 vezes a escala de multiplicidade de 4x4 复数 Matrix 乘法(Strassen 1969 的上界是 49), Borg 调度 heurística no Google 生产环境,32.5% do kernel FlashAttention 加速, bem como Gemini 训练吞吐量提升──

Esta estrutura é eficaz, porque o avaliador pode fazer uma revisão de máquina.

## 概念

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

1. De um programa de sementes verdadeiramente, mas bem-sucedido.`P_0`Começa.
2. 维护一个变体程序数据库, cada variação é avaliada pelo avaliador 打分──
3. A partir da base de dados, um ou mais pais (em estilo MAP-elite ou baseado em ilhas)
4. Prompt LLM ((Use Gemini Flash 生成大量候选,use Gemini Pro 处理困难候选)产出父母的修改变体──
5. 编译、运行, e em realizada avaliador 上评估该变体──
6.  De acordo com o número e a função Vector irá inserir-se na base de dados
7. - Não, não.

Há dois detalhes importantes. Primeiro, Prompt 给 LLM não é apenas um programa-mãe, geralmente também inclui várias variantes principais da base de dados, a assinatura do avaliador, bem como a descrição de tarefas curtas. A tarefa do modelo é propor uma mudança de direção de um possível aumento da porcentagem. Segundo, a base de dados é estruturada.

### Por que o avaliador não é necessário consultar

Os benefícios do AlphaEvolve vêm de áreas de avaliação rápida, de determinação e de dificuldade para a fraude:

- **Matrix multiplication algorithm**: um teste unitário, para executar Matrix 乘法并逐 bit 检查相等性。
- **Borg scheduling heuristic**Um simulador de produção, usado para reinstalar o histórico de carga e de pesquisa de desperdício de recursos de cálculo.
- **FlashAttention kernel**O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é?
- **Gemini training throughput**:以每步GPU-secondes 衡量──

Em cada caso, o avaliador capturou a categoria de erros que deveria ter dominado o LLM: declarações de legitimidade falsas, declarações de desempenho que desapareceram no hardware, bem como falhas de casos de fronteira.

### O hacking de recompensas é a outra face da mesma declaração

演化会优化评估者 测量的任何东西――如果评价者不完美,循环就会找到这种不完美――在未经验领域,循环会优化表层特征,而不是预期行为――DeepMind em seu trabalho explicitamente aponta este ponto:O sucesso da AlphaEvolve apenas se moverá para o evaluador 严谨性与搜索野心相匹配的领域――

2025-2026 年代码搜索循环 具体例:

- 奖励完成时间的优化目标,会奖励提交空解法──
- 奖励测试内正确性的基准 分数,会奖励记忆测试并过拟──
- Um 代码质量代理 会奖励删除注释和重写变量名,即使语义没有变化──

O método de revisão do AlphaEvolve é: utilizar o MLL de um avaliador de duração não visto e, ao avaliar, gerar entrada.

### Por que LLM + busca 优于单独使用任一方

O LLM pode produzir modificações compatíveis, em sentido linguístico, parecendo razoáveis. Ao longo de 2000 páginas de Python, os dados geralmente produzem erros de linguagem.

Em contrapartida, o avaliador irá capturar a ficção do LLM. LLMs irá afirmar com confiança que uma função  em condições extremas é O n log n) , mas na verdade é O n^2;

### AlphaEvolve em posição central na pilha de fronteira

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

Estes quatro sistemas são variantes da mesma combinação: gerador, avaliador, ciclo de reapreciação.


```figure
alphaevolve-loop
```

## Use-o

`code/main.py`Em um brinquedo símbolo-regressão  problema de realizar um mínimo AlphaEvolve-like ciclo                                                                                                                                                                                                                                                   

Observação:

- O melhor resultado é o que acontece com a geração.
- MAP-elite grid                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
- 移除 held-out test (exceto avaliação de formação) 如何让循环出现惊人过拟合──

## Entrega-o

`outputs/skill-evaluator-rigor-audit.md`É em novos domínios considerar as condições pré-impostas do ciclo de estilo AlphaEvolve: o seu avaliador é capaz de capturar o seu fracasso de preocupação?

## 练习

1. 运行 `code/main.py` Record best分数轨迹──禁用 avaliador de tempo todo`--no-holdout`)并重新运行──量化过拟合──

2. 阅读 AlphaEvolve 论文中关于MAP-elite grid 的第 3部分──为一个新问题 (por exemplo, passes de otimização de compilador)

3. 48 vezes multiplicada 4x4  Resultados em 56 anos depois melhorou Strassen 49-mul 上界──阅读论文附录 F,并使用三句话解释为什么这个问题评价者 特别容易做对,以及为什么大多数领域不是这样──

4.  propõe um domínio de fracasso do AlphaEvolve.

5. 针对你熟悉的一个领域,写出你会使用的评价者签名──包括 (a) 正确性条件, (b) 性能指标, (c) 输入生成规则, (d) 至少一个反奖励黑客检查──

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AlphaEvolve | “DeepMind 的演化式编码 agent” | Gemini + 程序数据库 + 可机器检查的 evaluator |
| MAP-elites | “保留多样性的 archive” | 由 feature Vectors 作为 key 的 grid；每个 cell 保存具有该 descriptor 的最佳变体 |
| Island model | “并行演化子种群” | 会周期性迁移的独立种群；防止过早收敛 |
| Machine-checkable evaluator | “确定性 oracle” | LLM 无法伪造的 unit test、simulator 或 benchmark，是这个循环的前置条件 |
| Reward hacking | “优化测量值，而不是目标” | 循环找到一种最大化分数但不完成预期任务的方法 |
| Seed program | “起点” | 循环从中演化的初始正确但次优程序 |
| Held-out evaluator | “LLM 从未见过的评估数据” | 在评估时生成的输入，用于防止记忆 |

## 延伸阅读

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) 完整论文──
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) 供应商撰寫的结果说明──
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) 被发现的算法, incluindo 48-mul 4x4 matmul
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6)- Não, não.
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) A autonomia do grupo de avaliadores será definida como uma direção de estudo fundamental.
