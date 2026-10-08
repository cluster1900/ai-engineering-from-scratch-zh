# Auto-melhoria limitada design

> Os estudos já receberam quatro primitivas de um ciclo de auto-melhoria de restrições. Invariantes formais devem ser criadas em cada edição. Ancores de alinhamento não podem ser alterados. Constraensões multi-objetivas exigem cada dimensão.

**Type:** Learn
**语言：**Python (stdlib, circuito limitado com verificação invariante)
**Prerequisites:** Phase 15 · 07 (RSI), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## 问题

O simulador de corrida da lição 7 mostra que pequenas diferenças de velocidade compõem enormes diferenças. O estudo de caso DGM da lição 4 mostra que o loop pode manipular ativamente seus próprios avaliadores.

ICLR 2026 RSI Workshop resumo (openreview.net/pdf?id=OsPQ6zTQXV) identificou quatro primitivas assim. Antropic's RSP v3.0 (Lessão 19) e DeepMind's FSF v3 (Lessão 20) estão citados em limites de capacidade.

诚实表述是:这些是缓解. O resultado do teorema da informação limita o alcance de qualquer sistema capaz de provar sua própria natureza posterior, e no momento nenhum projeto fecha o problema de forma.

## 概念

### Primitivo 1: invariantes formais

Invariante é uma característica que deve ser estabelecida em cada auto-modificação.

- Distribuição de produção 以固定的宪章为条件 (Lessão 17)
- Não há ferramenta chamada de endpoint não autorizado.
- A memória escreve através de um caminho já registrado.
- O módulo hash do avaliador coincide com a versão de aprovação.

Invariantes por loop 无法编辑的外部代码检查──如果某一提议修改 违反变量,就会被拒绝──这会捕捉 DGM 风格的评价者-tampering 模式(Lesson 4)──

O problema consiste em escolher as duas variantes necessárias para a segurança e também poderem ser calculadas em tempo razoável.

### Primitivo 2: âncoras de alinhamento

Ancor de alinhamento é o ângulo de um ciclo 核心目标的不可变表示,被固定在循环的编辑表面外.

- Cada invocação é feita apenas de leitura do texto constitucional.
- ▌a avaliação de um repositório independente e com controlo de acesso independente.
- Por assinatura humana e em cada ciclo 重新验证的工具-permission manifesto──

O papel da âncora é impedir a deriva objetiva. O loop pode melhorar a maneira de se perseguir o objetivo, mas não pode editar o objetivo em si.

微妙的失败模式: Mesmo o loop não pode editar âncora, já está em leitura âncora 方式发生漂移的循环 仍然可以重新解释它.

### Primitivo 3: restrições multi-objetivas

Apenas optimizar um único escore escalar do loop encontrará atalhos.

- Performance (referencial de nível de tarefa)
- Segurança ((avaliações da equipa vermelha  conhecido-mau 
- Equidade ((subgrupos sensíveis)
- Robustez ((ensembles de ensaio OOD ]], manipulação de entrada adversária)

Só quando cada restrição for estabelecida, a modificação será aceita. Leção 13 do governador de custos irá colocá-la sobre as restrições financeiras.

### Primitivo 4: detecção de regressão

As pontuações de cada ciclo vão comparar com as distribuições históricas.

Uma prática real: armazenamento de resultados por tarefa de N 个周期.

### 信息论限制

A complexidade de Kolmogorov e o teorema de Lob sobre sistemas capazes de provar a sua natureza estabeleceram as fronteiras superiores. A Máquina formal de Godel de Schmidt [4] Leção 4) 准 é esse tipo de fronteira superior; atualmente ainda não há ninguém que tenha concluído a prova extraordinária. Os resultados de Lob mostram: se um sistema pode provar que acredita que se eu provar que deveria fazer X, então fará X, ele fará X sem provar que deveria fazer X, é um famoso fracasso de auto-referência.

Isto significa para os nossos primitivos que não conseguem fechar o problema de segurança. Eles farão com que a falha silenciosa se torne mais cara. Um ciclo malicioso ou desviado. Se o original se contornaria com a falta de verificação, agora deve destruir ativamente uma verificação evidente, que é uma assinatura mais fácil de detectar.

### Um exemplo de trabalho

Suponha que um agente proponha uma edição.

1. Verificações invariáveis: hashes do módulo, manifesto de autorização de ferramentas, cabeçalho constitucional,
2. Verificação de âncora: declaração objetiva com a versão de aprovação
3. Avaliação multiobjetiva: níveis de desempenho, segurança, justiça, robustez e segurança.
4. Detecção de regressão: não há nenhum eixo de descida superior à tolerância.

Todos têm de passar, qualquer falha vai parar.


```figure
bounded-gates
```

## Use-o

`code/main.py`Na lição 4 de DGM, jogador de estilo                                                                                                                                                                                                                                                         

## Entrega-o

`outputs/skill-bounded-loop-review.md`O auditório de uma proposta de ciclo limitado, e avalia qual é a realidade de quatro primitivas, em vez de apenas ver qual é a afirmação de que é a realidade.

## 练习

1. Em todos os primitivos são iniciados em função .`code/main.py`❖ O ciclo de confirmação  ainda pode melhorar na métrica primária, ao mesmo tempo em que não deixa o hack 胜──

2. 禁用回归检测――construir uma entrada, fazendo com que leve à perda de capacidade silenciosa 接受──

3. 禁用 multi-objective constraint── demonstrar o loop no eixo de desempenho 上收, simultaneamente no eixo de segurança 下降──

4. Como agente de codificação, desenhar uma âncora de alinhamento.

5. 阅读 ICLR 2026 RSI Workshop resumo。selection四个原始的中一个,并为当前状态艺术 提出一个具体改进──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|---|---|---|
| Invariant | “始终为真的属性” | 每次 edit 前后由外部代码检查的属性 |
| Alignment anchor | “固定的目标” | 位于 loop edit surface 之外的不可变 core-goal representation |
| Multi-objective constraint | “所有 axes 都必须成立” | Performance、safety、fairness、robustness——全部必需 |
| Regression detection | “下降时暂停” | 当历史 metric deltas 暗示 capability loss 时暂停 loop |
| Kolmogorov bound | “信息论限制” | 限制系统能够证明其自身后继系统性质的范围 |
| Lob's theorem | “self-reference 陷阱” | 系统可以在没有证明自己应该做某事的情况下，依据“我应该”采取行动 |
| Gate stack | “分层检查” | 多个 primitives 的组合；任何 failure 都会拒绝 edit |
| Bounded improvement | “mitigation，而不是 proof” | 提高 silent-failure 成本；不会关闭 safety problem |

## 延伸阅读

- [ICLR 2026 RSI Workshop summary (OpenReview)](https://openreview.net/pdf?id=OsPQ6zTQXV)Quatro primitivas de receita.
- [Anthropic Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) limiares de capacidade multi-objetiva。
- [DeepMind Frontier Safety Framework v3](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/)                                                                                                                                                                                                                                                              
- [Schmidhuber (2003). Godel Machines](https://people.idsia.ch/~juergen/goedelmachine.html) Estes primitivos são ancestrais formalmente provados.
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) Ancoramento de alinhamento baseado em razão。
