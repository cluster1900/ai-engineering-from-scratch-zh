# 基准测试: WebArena e OSWorld

> WebArena em quatro aplicativos autogestíveis 能力. OSWorld em Ubuntu, Windows, macOS 能力.

**类型：**- aprendizagem
**语言：**Python (stdlib)
**先修要求：**Fase 14 · 19 (banco SWE, GAIA)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- Descreva os quatro aplicativos de autogestão da WebArena e por que a avaliação baseada na execução é importante.
- Explica por que o OSWorld usa um sistema operacional real, em vez de APIs de acessibilidade.
- Existem dois modos principais de falha do OSWorld: conectividade de interface gráfica e conhecimento operacional.
- 总结 OSWorld-G 和 OSWorld-Human 基础基准 之上增加了什么──

## 问题

O agente de uso geral pode utilizar ferramentas. Podem eles fazer 20 cliques no navegador, para completar uma compra de compra? Podem eles configurar apenas um teclado e mouse em uma máquina Linux?

## 概念

### WebArena (Zhou et al., ICLR 2024)

- 覆盖四个自主管理网页应用程序的812长程任务:购物网站、论坛、类 GitLab的开发工具、商业 CMS──
-  Há outras ferramentas práticas: mapa, calculadora, scratchpad.
-  avalia através de APIs de ginásio  baseada em execução completada: ordem já está em baixo, edição já está fechada, página do CMS  está atualizada?
- 发布时: O melhor agente GPT-4  alcançou uma taxa de sucesso de 14,41%, enquanto o humano foi de 78,24%.

A auto-configuração é importante, pois o aplicativo-alvo é fixado e reproduzível, por isso o benchmark não será instable devido a mudanças externas.

### 扩展

- **VisualWebArena** 视觉 grounding 任务, sucesso depende de解读图像(截图作为一等观察) 
- **TheAgentCompany**(Dec 2024)  加入终端 + codificação;更像真实的远程工作环境。

### OSWorld (Xie et al., NeurIPS 2024)

- 覆盖 Ubuntu、Windows、macOS 369 个真实计算机任务──
- Para aplicação real, o controle de teclado e mouse em forma livre.
- 以 1920×1080 截图作为观察――
- 发布时: melhor modelo é 12,24%, humanos é 72,36%.

### Principais modos de falha

1. **GUI grounding。**Pixel → elemento 映射──Modelo 很难在 1920×1080 中可靠定位 UI 元素──
2. **Operational knowledge。**Qual é o menu em que há esse ajuste, qual é o atalho do teclado, qual é o painel de preferências.

### 后续工作

- **OSWorld-G**564 个样本的地面积套+Jedi training set──将地面积与规划 拆解开来,因此可以分别测量──
- **OSWorld-Human**  人工整理的黄金行动轨迹──显示顶级代理 使用的步骤比必要步骤多 1.4-2.7x(trajectory-efficiency gap)──

### Por que é importante ?

Claude uso de computador, OpenAI CUA, Gemini 2.5 Uso de computador, Lição 21) Todos estão em carga de trabalho de WebArena e OSWorld 塑造 上訓練──BENCHMARK 是目标; produção modelo 是交付出来的答案──

### Benchmarking 容易出错的地方

- **仅截图 evals。**OSWorld é executado por um computador; se em OSWorld ele avaliar o uso de DOM ou de APIs de acessibilidade, o problema é que a terra não está em funcionamento.
- **忽略 trajectory length。**Só de acordo com a taxa de sucesso, perderá a exposição OSWorld-Human de 1,4-2,7x
- **陈旧的自托管 apps。**As aplicações da WebArena fixaram uma versão específica; se não forem reorganizadas em versão atualizada, isso prejudicará a sua compatibilidade.


```figure
ae-agent-human-gap
```

## Construí-lo

`code/main.py`实现 um brinquedo web-agente arnes:

- Um mínimo de aplicações de compras.
- Três missões de trajetórias de ouro.
- Um agente guiado para cada missão.
- Baseada em avaliação de execução (revisão de estado) e métricas de trajetória-eficácia (pasos versus ouro)

- Não .

```
python3 code/main.py
```

输出: taxa de sucesso e eficiência de trajetória de cada missão, em relação ao método OSWorld-Human:

## Use-o

- **WebArena Verified**Autótipos em cluster interno, para avaliação contínua.
- **OSWorld**运行在 VM fleet 中, para agentes de desktop.
- **Computer-use agents**(Lessão 21)  Claude、OpenAI CUA、Gemini  都在类似类型的工作负载上训练──
- **你自己的产品流程** Para as 20 missões mais importantes capturar trajetórias de ouro; utilizá-las semanalmente como agente de teste.

## Entrega-o

`outputs/skill-web-desktop-harness.md`Construir um arsenal de agente web/desktop, contendo métricas de avaliação e eficiência de trajetória baseadas em execução.

## 练习

1. Use o segundo aplicativo (WEB) para expandir o arsenal de brinquedos.
2. A eficiência da trajetória de um relatório de missão. No teu brinquedo, o agente é ouro.
3.                                                                                                                                                                                                                                                               
4. Como distinguirão as falhas de planejamento e as falhas de aterragem nas suas avaliações?
5. Quando você atualiza uma versão fixa de um aplicativo, o que vai destruir?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| WebArena | "Web agent benchmark" | 覆盖 4 个自托管 apps 的 812 个任务；gym-style evaluation |
| VisualWebArena | "Visual WebArena" | 视觉 grounding 的 WebArena；截图是 observations |
| OSWorld | "Desktop agent benchmark" | 在真实 Ubuntu/Windows/macOS 上的 369 个任务 |
| GUI grounding | "Pixel-to-element mapping" | Model 在 1920x1080 中定位 UI 元素 |
| Operational knowledge | "OS know-how" | 哪个菜单、哪个 shortcut、哪个 preference pane |
| OSWorld-G | "Grounding suite" | 564 个仅 grounding 样本 + training set |
| OSWorld-Human | "Gold trajectories" | 用于衡量效率的人工专家动作序列 |
| Trajectory efficiency | "Steps over gold" | Agent 步数除以人类最小步数 |

## 延伸阅读

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) Quatro aplicativos web benchmark
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) 跨 OS benchmark desktop
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) Claude  由 benchmark 塑造的能力
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) OSWorld 和 WebArena 数字
