# Indicações de referência:SWE-bench,GAIA,AgentBench

> Três benchmarks 构构成 2026年代理评价的点──SWE-bench 测试代码 patching──GAIA 测试一般主义工具使用──AgentBench 测试多环境推理──要了解它们的组成、污染、叙事,以及它们不衡量什么──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## Objectivo de aprendizagem

- Para explicar o uso do arame de teste do SWE-bench, não explico por que é usado em testes unitários como um gate.
- Explicação de por que o banco SWE Verificado ((OpenAI, 500 tarefas) existe, bem como o que foi removido.
- Descrição de design de GAIA: para humanos simples, para IA dificuldade; três dificuldades graduais。
- Explicar os oito ambientes do AgentBench, bem como o seu principal bloqueador para os LLMs de código aberto.
- 总结 SWE-bench+ 发现污染及其影响──

## 问题

Os rankings vão dizer-lhe qual modelo, em um determinado índice, vence.

- Referência: "Soluções contaminadas" (resoluções em dados de formação, vazamento de testes)
- Referência (s) ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐
- O avaliador é robusto ou não ((AST matching, verificações de estado, revisão humana)

Antes de citar um determinado número, primeiro compreenda estes três pontos de referência e seus modos de falha.

## 概念

### SWE-bench ((Jimenez et al., ICLR 2024 oral)

- De 12 repositórios de Python de 2.294 problemas reais do GitHub.
- Agente 得到:pre-fix commit 的代码库 + natural-language issue description──
- Agente 产出: um parche.
- Avalador: aplicativo patch,运行 repo's test suite──patch 必须让 FAIL_TO_PASS tests(previously failing,现在passing)翻转,同时不破坏 PASS_TO_PASS tests──

SWE-agent(Yang et al., 2024) alcançou 12,5% no momento da publicação, cujo foco é a interface agente-computador(comandos de editor de arquivos、modelo 能理解的搜索语法) ⋅

### Banco SWE Verificado

OpenAI,2024年 8月──curated artificial 500-task subset── remove ambiguos problemas、 testes não confiáveis, bem como corrigir tarefas não definidas── é o principal ponto de referência

### Contaminação

-  Mais de 94% dos problemas de SWE-bench já foram eliminados na maioria dos modelos
- **SWE-bench+**O resultado foi o resultado de uma análise de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados
- Verificado mais limpo, mas não totalmente sem contaminação.

实践影响: um modelo em SWE-bench consegue 50% de resultados, em SWE-bench+ 上可能只有 35%──

### GAIA(Mialon et al., Nov. 2023)

- 466 perguntas; 300 delas reservadas para o ranking privado de huggingface.co/gaia-benchmark.
- 设计理念:对人类在概念上简单(92%), mas para a IA 困难(带插件的GPT-4:15%) 
- 测试 raciocínio, uso multimodal, web, ferramentas,
- Nível 3 需要跨modalidades 的长工具链――

GAIA Usado para medir a capacidade generalista ── não a confundir com os referências específicos do código ──

### Agente Bench ((Liu et al., ICLR 2024)

- 8 ambientes, cobrir código ((Bash、DB、KG) 、 jogos ((Alfworld、LTP) 、web(WebShop、Mind2Web) e geração aberta。
- Multiplo-turnos, cada divisão de cerca de 4K-13K turnos.
- O principal descoberto: raciocínio a longo prazo, tomada de decisões e instrução seguindo os LLM OSS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### Estes não medem o que

- O custo operacional do mundo real (Token, Wall-Clock)
- Condições adversas.
- O desempenho do domínio onde você está (Leção 30)
- Falhas de cauda ((marcos de referência, mediana; operadores de produção 关心最差的1%) 

### Benchmarking 常见错误

- **执着于单一数字。**SWE-banco 50%  Diga-lhe informações menor que P50 / P75 / P95 custo + distribuição de passo.
- **Contaminated claims。**报告 SWE-bench 却不提 Verificados ou SWE-bench+ é enganoso
- **Benchmark-as-development-target。**Para o ponto de referência 优化会偏离生产有用性──


```figure
ae-swebench-gate
```

## Construí-lo

`code/main.py`实现 um brinquedo edição SWE-bench-like harness:

- Tarefas de correção de bugs sintéticas (Tasks 3)
- Um agente de guião, vai apresentar patches.
- Um test runner, usado para verificar FAIL_TO_PASS (bug agora já foi corrigido) e PASS_TO_PASS (passagem não danifica nada)
- Um classificador de dificuldade de estilo GAIA baseado em profundidade de decomposição de perguntas.

- Não .

```
python3 code/main.py
```

输遇展示每个任务 +每个难度的解决率,并让评价者规则 变得具体――

## Use-o

- **SWE-bench Verified**Utilizando agentes de código.
- **GAIA**Usar agentes generalistas, usar divisões de rankings privadas.
- **AgentBench**Utilizado para comparação de ambientes múltiplos.
- **Custom evals**(Lessão 30) Para usar a forma real do seu produto.

## Entrega-o

`outputs/skill-benchmark-harness.md`会为任意代码基任务对 构建一个SWE-bench-style harness,带有 FAIL_TO_PASS / PASS_TO_PASS gating。

## 练习

1. Vai transferir este harness de brinquedo para um repo real para funcionar.
2. Adicione uma métrica de contagem de passos. Em suas 3 tarefas, por resolução, quantos passos de agente são necessários?
3. 阅读 SWE-bench+ paper──实现一个解决方案-leakage check(将发文与不同做模式匹配)──
4. Uma pergunta da GAIA. Perguntar um agente de classe GPT-4.
5. 阅读 AgentBench's per-environment breakdown── qual ambiente 映射你的产品表面?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| SWE-bench | “Code agent benchmark” | 2,294 个 GitHub issues；patch 必须翻转 FAIL_TO_PASS tests |
| SWE-bench Verified | “Clean SWE-bench” | 500 个由人工 curated 的 tasks，OpenAI |
| FAIL_TO_PASS | “Fix gate” | 之前 failing、patch 后必须 passing 的 tests |
| PASS_TO_PASS | “No-regression gate” | 之前 passing 且必须仍然 passing 的 tests |
| GAIA | “Generalist benchmark” | 466 个 human-easy / AI-hard 的 multi-tool questions |
| AgentBench | “Multi-env benchmark” | 8 个 environments；long-horizon multi-turn |
| Contamination | “Training-set leak” | benchmark tasks 出现在 model training 中 |
| SWE-bench+ | “Contamination audit” | 在 successful SWE-bench patches 中发现 32.67% solution leakage |

##  weiterlesen

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) Orientação
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) 精选子集
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) Referência geralista
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) 多环境 suite
