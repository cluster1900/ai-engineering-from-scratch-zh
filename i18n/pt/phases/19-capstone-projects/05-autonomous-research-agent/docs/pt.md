# Capstone 05  Autônomo de investigação Agente 类)

> A IA-Scientist-v2 de Sakana publicou um artigo completo. O Laboratório de Agentes realizou uma experiência. Allen AI compartilhou um rastro. A forma de 2026 foi realizar uma pesquisa de árvore em um experimento, com um orçamento de custo, uma execução de código, um revisor de estilo de NeurIPS automatizado. Esta pedra fundamental foi construir um sistema como este, em cada artigo, a partir de US $ 30 para o funcionamento de um terminal, e através da Sakana, a equipe vermelha de escape de areia foi registrada.

**Type:** Capstone
**Languages:** Python（agent + sandbox）、LaTeX（output）
**Prerequisites:** Phase 2（ML）、Phase 3（Deep Learning）、Phase 7（transformers）、Phase 10（LLMs from scratch）、Phase 14（agents）、Phase 15（autonomous）、Phase 16（multi-agent）、Phase 18（safety）
**Phases exercised:**P0 · P2 · P3 · P7 · P10 · P14 · P15 · P16 · P18
**Time:** 40 小时

## 问题
Agente de investigação independente em 2026 atravessou uma porta. A IA-Scientist-v2 de Sakana AI, publicada em Nature, gerou um artigo que passou por revisão de pares de workshop ShinkaEvolve (ICLR 2026) vai expandir essa direção para a hipótese de desenvolvimento.

Você vai passar numa ideia de semente de um campo estreito para implementar um agente como este para aprender este ciclo (por exemplo, em 100M Parameter Transformer)                                                                                                                                                                                                                                            

## 概念
Este agente é uma melhor primeira busca em árvore。节点是实验规格:(hipótese、config、code、expectate outcome)。expandir 步骤通过小改动提出孩子们(substituição optimizador、调整批 size、ablate 一个组件)。 cada criança em带有硬资源上限的新沙箱中运行──结果反到得分功能,根据(novidade × qualidade × orçamento restante) 对节点排行尽量――树会增长预算 用,然后写出最佳分支──

O escritor é Multimodal de. É gerado por um projeto de LaTeX, e depois de ter sido colocado em contato com o modelo de visão de Claude Opus 4.7, é usado para o layout crítico, a figura leível, bem como o alinhamento de provas de alegações.

A segurança é suportar a estrutura. Todos os experimentos estão em nenhuma saída de rede. O relógio de parede limitado.

## Arquitetura
```
seed idea + domain
      |
      v
  literature search (Semantic Scholar + OpenAlex + FAISS cache)
      |
      v
  LangGraph plan-execute-verify tree
      |
      v
  +--- expand node ----+      per-node sandbox
  |                    |      (E2B / Daytona)
  v                    v      resource caps
  child_1           child_k   no network egress
  |                    |      deterministic seeds
  v                    v
  run experiment       run experiment
  |                    |
  v                    v
  score nodes by (novelty, quality, budget)
      |
      v
  best branch -> LaTeX writer
      |
      v
  compile + vision critique (Opus 4.7 vision)
      |
      v
  reviewer ensemble (5 LLM judges, NeurIPS rubric)
      |
      v
  paper.pdf + review.md + trace.json
```

## 技术
- Orquestração:带 checkpointing 和 gate of human approval LangGraph
- Busca de árvore: baseada em nó de experimento de auto-definição melhor-primeiro( proveniente de Sakana v2 de AB-MCTS-estilo)
- Sandbox: cada experiência é um E2B, Docker-in-Docker fallback; através de cgroups 施加资源 cap
- Literatura: API de gráfico semântico de estudiosos + OpenAlex + 本地 FAISS cache abstrato
- Escrito: modelo LaTeX + Claude Opus 4.7 (modo de visão) para análise de figuras e layout
- Revisor: 5 个评审的组合(Opus 4.7、GPT-5.4、Gemini 3 Pro、DeepSeek R1、Qwen3-Max),带重积
- Estrutura de experimento: usado para experimento físico de PyTorch 2.5, W&B usado para registro
- Observabilidade: Langfuse usado para rastrear agentes, por artigo artigo $ 30 orçamento


```figure
ce-experiment-tree
```

## Construí-lo
1. **Seed and domain scoping.**选取一个种子想法 (por exemplo, investigar os padrões de esparciação nos mapas de atenção dos transformadores sub-1B) ── define o espaço de busca: modelo, conjunto de dados, orçamento de computação──

2. **Literature pass.**查询 Semantic Scholar + OpenAlex 中最相关且引用最多的 50 篇论文;本地缓存摘要;生成 1 页域名消化──

3. **Tree scaffolding.**Use a hipótese de semente.`expand(node) -> children`, Usó pequeno modificação proposta ((( cada criança uma mudança de configuração) ―将 `score(node)`实现为加权的新奇 ×质量 ×预算项──

4. **Sandbox wrapping.**Cada experiência funciona .`docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only`(或等价的E2B policy) ・ sementes 写入 sandbox;输出以只读的方式 装回外部──

5. **Plan-execute-verify loop.** `plan`- Propõe filhos.`execute`运行 sandbox, capture log 和 metric──`verify`Para a verificação de unidades de operação métrica ((perda é ou não baixa?ablação é ou não isolada?)

6. **Writer.**orçamento usado, selecionar o melhor分支── utilizando o matplotlib 染图── através de Claude Opus 4.7 生成 LaTeX draft,并把分痕 放入文脈──编译──把编译后的 PDF 送回 Opus 4.7 vision 进行批评──代──

7. **Reviewer ensemble.**五个评审 根据 NeurIPS 风格 rubrica,对草案的(novidade、rigor、clarity、reproducibility、impact)打分──如果意思 <4.0/5,则带批判 返回 writer──3次重写 后硬停止──

8. **Red team.**构建或集成一组针对沙盒的对抗任务:fork bomb、网络脱 filtration attempt、filesystem escape、LLM 写出的 shell metacharacter──确认全部被阻止──写出发现──

9. **Reproducibility.**Cada artigo tem um rastreamento de árvore JSON, semente, W&B, link de execução, configuração de caixa de areia, bem como uma leitura de um terminal para outro.

## Use-o
```
$ ai-scientist run --seed "attention sparsity in sub-1B transformers" --budget 30
[lit]    50 papers, digest in 12s
[tree]   expanded 8 nodes, budget 12/30
[exec]   node #3 sparsity=top-8, loss=2.83 (best so far)
[exec]   node #6 sparsity=top-4, loss=3.12 (worse)
[exec]   ...
[tree]   chose branch rooted at node #3 (novelty 0.62, quality 0.81)
[write]  LaTeX draft v1 complete
[vision] critique: figure 2 legend too small, claim-evidence ok
[write]  draft v2 after 3 edits
[review] mean 4.2/5 (novelty 3.9, rigor 4.3, clarity 4.1, repro 4.5, impact 4.2)
[done]   paper.pdf + review.md + trace.json     $28.40 spent
```

## Entrega-o
`outputs/skill-ai-scientist.md`É uma coisa de entrega. Dá-lhe uma ideia de semente, um domínio, um orçamento de 30 dólares.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Paper quality | 根据已发表 workshop paper 做 blind rubric review |
| 20 | Experimental rigor | Baseline、seed、ablation；每个 claim 都由 results table 中的一个 cell 支撑 |
| 20 | Cost and compute discipline | 强制执行 $30/paper 上限，并由 Langfuse trace |
| 20 | Safety | Sandbox red team 通过；network policy 和 kill-switch 已验证 |
| 15 | Reproducibility | 使用相同 seed 一条命令 rerun 可复现 paper |
| **100** | | |

## 练习
1. Utilize o mesmo domínio entre três idéias de sementes diferentes 运行管eline―Compare quais partes da pesquisa de árvores 识别重复浪费的计算―

2. Antes da execução do experimento, para estimar mais de US$ 5 de nó adicione o portal humano no circuito.

3. Vai transformar o conjunto de revisores em um único juiz.

4. 引入 rede-exfiltration red team test:agent 写出尝试 `curl`O código do site do Ministério Público`--network=none`Políticas para impedi-lo.

5. A sua pesquisa em árvores comparada com a linha de base aleatória plana comparar o mesmo orçamento, sem estratégia de expansão)

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Tree search | “AB-MCTS-style expansion” | 用 novelty×quality×budget score 在 experiment node 上进行 best-first exploration |
| Sandbox | “Experiment isolation” | 无 network、CPU/memory 有界、固定 seed、read-only input 的 container |
| Vision critique | “Render-then-read” | 将 paper 编译为 PDF，把 PDF 送回 VLM，用于 layout 和 claim-evidence critique |
| Reviewer ensemble | “Automated peer review” | 多个 LLM judge 使用 NeurIPS rubric 为 paper 打分；weighted aggregate gate 控制 pipeline |
| Novelty score | “Is this new?” | 对接近 50-paper literature cache 的内容施加惩罚的 heuristic |
| Cost ceiling | “$ budget” | 每篇 paper 的总花费硬上限；Langfuse counter + pre-run estimate |
| Red team | “Sandbox-escape audit” | 如果 policy 错误就会逃出 sandbox 的 adversarial task |

## 延伸阅读
- [Sakana AI-Scientist-v2 repository](https://github.com/SakanaAI/AI-Scientist-v2) 参考 agência de investigação de produção
- [Sakana AI-Scientist-v1 paper (arXiv:2408.06292)](https://arxiv.org/abs/2408.06292) Método original
- [ShinkaEvolve (Sakana ICLR 2026)](https://sakana.ai) evolução 扩展
- [Agent Laboratory (AMD)](https://github.com/SamuelSchmidgall/AgentLaboratory) Estrutura de laboratório de investigação multifunção
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) 参考 camada de orquestração
- [Semantic Scholar Graph API](https://api.semanticscholar.org/) Busca de literatura
- [E2B sandboxes](https://e2b.dev)  Referência ao isolamento de experimentos
- [NeurIPS reviewer guidelines](https://neurips.cc/Conferences/2026/Reviewer-Guidelines) Ensemble de revisores 编码的 rubrica
