# Agentes multimodal e uso de computadores (Capstone)

> O produto fronterio de 2026 é um agente multimodal: é capaz de ler capturas de tela, clicar em botões, navegar em UI da web, preencher formulários, e terminar de terminar os fluxos de trabalho. SeeClick e CogAgent (em 2024) demonstrou que o uso de ferramentas visuais para gráficos é primitivo.

**Type:** Capstone
**语言：**Python(stdlib、acção esquema + agente esqueleto de ciclo)
**Prerequisites:** Phase 12 · 05（LLaVA）、Phase 12 · 09（Qwen-VL JSON）、Phase 14（Agent Engineering）
**Time:** 约 240 分钟

## Objectivo de aprendizagem
- 设计一个多模特代理循环:perceive → reason → act → observe → repeat──
- Construir um esquema de saída de aterragem da GUI ((clique em coordenadas, tipo de texto, scroll, arrastar), deixe o VLM 能发发 JSON。
- Comparar agentes apenas para captura de tela, agentes de árvore de acessibilidade e agentes híbridos.
- Em uma pequena faixa VisualWebArena 上设置 Multimodal agent benchmark evaluation──

## 问题
Um fluxo de trabalho no local de reserva: "Encontre-me um voo para Tóquio para 15 de abril, assento no corredor de menos de 800 dólares, reserva-o".

Agente multimodal 需要:

1. 获取浏览器的截图──
2. Vai fazer uma captura de tela + URL + objetivo 解析为计划。
3. 发出结构化行动:click(在 x,y) 、type "Tokyo"(在元素 E) 、滚动下面、select(radio button) 。
4. Ação será aplicada ao navegador.
5. 观察新状态 (新状态)
6. 重复 Até a tarefa ser concluída.

Cada passo é uma chamada de VLM multimodais. A saída de VLM deve ser resolvida por JSON. Os erros vão atravessar os passos.

## 概念
### Aterrização da UI  primitiva

GUI grounding é: given determining a screenshot 和一条 natural language instrução,输出要点击的 (x, y) coordenadas ((or outras ações) 』

VejaClick(arXiv:2401.10935) é o primeiro resultado aberto em escala: em dados sintéticos + GUI reais, em sintonia fina, um VLM, com tokens de texto simples, coordenadas de saída.

CogAgent(arXiv:2312.08914) para interfaces de uso intenso  aumentou 1120x1120 codificação de alta resolução ∙

Ferret-UI(arXiv:2404.05719) especializada em UI móveis,并与iOS accesibility data 集成──

O formato de saída é normalmente JSON:

```json
{"action": "click", "x": 384, "y": 220, "element_desc": "Search button"}
```

`element_desc`Ajuda na recuperação: se as coordenadas se deslocam entre as capturas de tela, a sugestão semântica pode fazer o sistema reajustar o terreno.

### Regimes de acção

Um esquema de ação típico tem 6 a 10 tipos de ação:

- `click`(x, y)
- `type`(texto, x?, y?)
- `scroll`: (direcção, quantidade)
- `drag`(x0, y0, x1, y1)
- `select`: (option_index)
- `hover`(x, y)
- `navigate`- Não .
- `wait`(ms)
- `done`(sucesso, explicação)

Agente Cada passo enviando uma ação.

### 仅截图 vs 可访问性树

两种输入模式:

- Apenas para captura de tela: imagem completa, sem informações estruturais.
- Árvore de acessibilidade:DOM estruturado / IOS informações de acessibilidade.
- Híbrido: ambos têm, usando árvore como base de ações atômicas, usando tela de tela, fornecendo contexto semântico.

Agentes de produção estão em potencial para usar híbrido. Automatização do navegador.

### Memória de longo horizonte

Um fluxo de trabalho de 20 passos irá gerar 20 张 screenshots──contexto de VLM 很快就会被填满──三种压缩策略:

- Resumo-cadeia: a cada 5 passos 后,总结已经发生的事情,丢弃旧截图──
- Skip-frame: reservar primeira张、最后一张, bem como cada 3 张 de tela。
- Log graçado pela ferramenta: executa ações, mantenha o log de texto do conteúdo concluído; não reveja as capturas de tela antigas.

API de uso de computador de Claude Utilize log pattern──更简单,也更可靠──

### Utilização de ferramentas visuais

ChartAgent(arXiv:2510.04514)  Introduziu o uso de ferramentas visuais para entender o gráfico:crop、zoom、OCR、调用外检测──agent pode colocar "crop to region (100, 200, 300, 400) then call OCR" 作为工具调用 输出──工具 返回文本;VLM 继续推理──

Este padrão pode ser generalizado: conjunto de marcação de prompting, anotação de região e ferramentas de detecção externas estão em conformidade com o mesmo chamado de ferramenta de saída, receção de resposta estruturada esquema.

### Os índices de referência de 2026

- ScreenSpot-Pro── cerca de 1k de captura de tela da web  上的GUI grounding──Open SOTA Qwen2.5-VL-72B  約 85%──Frontier  約 90%──
- VisualWebArena。Tascas web de ponta a ponta(shop、forum、classificados)。Open SOTA 约20%──Gemini 3 Pro 约27%──
- AgentVista(arXiv:2602.23166)。 o benchmark mais difícil de 2026。 transcorrendo 12 domínios dos fluxos de trabalho realistas。 os modelos de fronteira obtêm 27-40%; os modelos abertos 10-20%。
- WebArena / WebShop── anteriores; já foi ultrapassado 和──

### Porque é que ainda é difícil

Agente 性能瓶:

1. 细粒度 visual grounding──"Clique no pequeno X" 经常在移动分辨率 下失败──
2. Planejamento de longo prazo. 10 Ações.
3. Recuperação de erro: quando clique em 失败 (错误) botão,检测 + 恢复很少出现在训练数据 中──
4. Contexto de página intersectorial.

Direcções de investigação:arquiteturas de memória, replanamento explícito, verificação multimodal, para a utilização de imagens de tela para o sucesso da ação)

### A pedra-chave construiu-o

Capstone tarefa: construir um agente de uso de computador, que pode:

1. 读取 página de reserva de site de simulação de HTML + captura de tela.
2. 规划 sequência de vários passos:search → select → fill form → submit。
3. 发发出与行动方案匹配的JSON actions──
4. Em fixação de 10 tarefas, a avaliação é feita.

Esta lição fornece código de andaime, fácil de expandir para o navegador real.


```figure
mm-agent-loop
```

## Use-o
`code/main.py`É um andaime de pedra:

- Esquema de ação de JSON  definição(10 个 ações) 』
- Como um estado de navegador falso.
- O esqueleto do agente de ciclo:receber estado, emitir ação, aplicar, ciclo.
- 10 mini-banchmark de tarefas ((paginas sintéticas), para medir a taxa de sucesso de ponta a ponta。
- Quando a ação 失败时的错误-recovery hook──

## Entrega-o
本教 生成 `outputs/skill-multimodal-agent-designer.md` determinar um produto de uso informático (domain, conjunto de ações, meta de avaliação), conceber um ciclo completo de agentes, estratégia de memória, modo de fixação e pontuação de referência esperada.

## 练习
1. Utilização `screenshot_region`ferramenta ((crop + zoom) ampliar esquema de acção── quais tarefas serão beneficiadas?

2. 阅读 AgentVista(arXiv:2602.23166)。 descrever a categoria de tarefas mais difíceis, bem como por que os modelos de fronteira  ainda fracassam。

3. Compressão de memória de longo horizonte: desenhar uma cadeia de resumo, conservar ≤4 张 capturas de tela ao vivo, registrar 数量不限。

4. Construir um gancho de recuperação de erros: quando a ação falha, o botão não é encontrado.

5. Compare Claude 4.7 com um screenshot híbrido + árvore de acessibilidade Qwen2.5-VL em 10 tarefas da web.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GUI grounding | "Click coordinates" | Model 在 screenshot 上针对 instruction 的 target 输出 (x,y) |
| Action schema | "Tool definitions" | 有效 actions（click、type、scroll、drag）的 JSON description |
| Accessibility tree | "Structured DOM" | 来自 browser/iOS APIs 的 machine-readable UI hierarchy |
| Hybrid agent | "Screenshot + tree" | 同时使用 image 和 structured info；比单独使用任一者更可靠 |
| Visual tool use | "Zoom/crop/detect" | Agent 在 plan 中途调用 external vision tools（OCR、detection） |
| Summary-chain | "Memory compression" | 周期性 text summaries 替代很长的 screenshot history |
| VisualWebArena | "E2E web bench" | 2024 benchmark，用于 end-to-end web tasks |
| AgentVista | "2026 hard bench" | 12-domain realistic workflows；即使 Gemini 3 Pro 也只有约 30% |

## 延伸阅读
- [Cheng et al. — SeeClick (arXiv:2401.10935)](https://arxiv.org/abs/2401.10935)
- [Hong et al. — CogAgent (arXiv:2312.08914)](https://arxiv.org/abs/2312.08914)
- [You et al. — Ferret-UI (arXiv:2404.05719)](https://arxiv.org/abs/2404.05719)
- [ChartAgent (arXiv:2510.04514)](https://arxiv.org/abs/2510.04514)
- [Koh et al. — VisualWebArena (arXiv:2401.13649)](https://arxiv.org/abs/2401.13649)
- [AgentVista (arXiv:2602.23166)](https://arxiv.org/abs/2602.23166)
