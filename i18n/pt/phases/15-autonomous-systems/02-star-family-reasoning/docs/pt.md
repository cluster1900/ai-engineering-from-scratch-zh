# STAR, V-STAR, Silent-STAR  Raciocínio auto-instruído

> O último ciclo de auto-melhora está localizado no interior da raciocínio. O modelo gera uma cadeia de pensamentos, mantém os resultados obtidos com a resposta correta e ajusta os resultados. É o STaR.

**Type:** 学习
**Languages:** Python (stdlib, bootstrap-loop 模拟器)
**Prerequisites:** Phase 13 · 01-03 (Reasoning and CoT), Phase 15 · 01 (long-horizon 框架)
**Time:** ~60 分钟

## 问题

O método direto de Raciocínio é a recolha de vestígios de raciocínio escritos pelo homem. Isto é caro e lento, e é limitado à vontade humana de escrever uma cadeia de pensamento de alta qualidade.

STaR (Self-Teught Reasoner, Zelikman et al., 2022)  propõe uma questão: se deixar um modelo escrever suas próprias racionalizações, e, de acordo com o conhecido resposta, dar-lhes um par de partes, será? ciclo é:

1. 采样一个推理痕 和答案──
2. Se a resposta final for certa, deixe este rastro.
3. Em conserva, traços de arquitetura.
4. - Não, não.

É válido. GSM8K e CommonsenseQA também são promovidos sem novas marcas artificiais. Mas este ciclo tem uma diferença interna: qualquer raciocínio que produz uma resposta correta será mantido, independentemente do raciocínio se é confiável. V-STaR (Hosseini et al., 2024)

## 概念

### STaR: em resultado válido

Em cada problema de treinamento, tomar uma razão e responder, se a resposta for adequada à etiqueta, manter este (problema, razão, resposta) triplo.

Há uma mudança importante. Se o modelo nunca consegue responder a um problema, o ciclo não pode aprender com ele.**rationalization**Para o problema de falha do modelo, coloque a resposta correta como um suporte, e re-insta o modelo para gerar uma racionalização que oriente a essa resposta.

Origem de artigo Resultado (Zelikman et al., 2022): um modelo base GPT-J                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

### V-STaR: Usado para verificação de treinamento do DPO

STaR 会丢弃错误理性――Hosseini et al. (2024) 观察到这些也是数据:每一对 (rational, "é correcto") 都可以训练验证者── eles usam optimização de preferências diretas sobre a forma de verificar e erroneamente resolver a situação.

报告的差异:在 GSM8K 和 MATH 上,相比前的自我改进基线 提升 +4到 +17个百分点, a maior parte dos benefícios provém do verificador que usa a seleção de tempo de inferência, em vez de usar o gerador adicional para ajustar a sua finalização.

### Quiet-STAR: cada token de interno

Zelikman et al. (2024)  propõe: Se o modelo aprender em cada Token  posição gerar uma raciocínio interna curta, e não apenas localizada entre o problema e a resposta, ¿cómo? Quiet-STaR  treinamento modelo em cada Token  previo a emitir um "pensamento" oculto, então através do peso aprendido, a previsão consciente de pensamento e a previsão de linha de base  混合──

Resultado:Mistral 7B em caso de ajuste fino específico de tarefa, em GSM8K de zero-shot  absolutamente desempenho de 5,9%   elevar para 10,9%,CommonsenseQA de 36,3%  elevar para 47,2% 模型学会了"quando pensar":困难 Token 会得到更长的内部理性;简单 Token 几乎没有──

### Por que os três têm preocupações comuns de segurança?

Três métodos usam a resposta final como um sinal gradativo. Se o raciocínio é defeituoso, obtém a resposta correta, quer seja usando o caminho, adivinhação ou uso de um modelo não generalizado, todos serão reforçados.

Verificador de V-STaR                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

### Em relação

| Method | Training signal | Inference cost | Data waste | Known failure mode |
|---|---|---|---|---|
| STaR | 如果正确，则保留 (rationale, answer) | 1x | 丢弃所有错误 rationales | shortcut rationales |
| STaR + rationalization | 上述方法 + 带正确答案提示的重试 | 1x | 更少 | rationalized rationales 可能不可信 |
| V-STaR | STaR + 来自两个类别的 DPO verifier | Nx (best-of-N) | 最小 | verifier 可能强化自信的错误 |
| Quiet-STaR | per-Token rationale + mixing weight | 1.5-3x | 最小 | 仍然是 answer-conditioned Gradient |

### Está em 2026 em posição central.

STaR  já não é novo. Mas este modelo está em 2025-2026 anos de idade até a reencarnação. RL (DeepSeek-R1, Kimi-k1.5, o1) em problemas matemáticos de validação é a versão maior do sinal de graduação de resposta do STaR. Modelos de recompensa de processo (Lightman et al., 2023; "Verificemos passo a passo" do OpenAI) é um substituto supervisionado por processo.

Entender que o STaR vai tornar tudo isso claro... é o menor ciclo de auto-melhoria possível.


```figure
reflection-loop
```

## Use-o

`code/main.py`会在一个玩具算法任务 上运行模拟 STaR 循环── Você pode observar:

- Precision 如何随随 bootstrap rodadas 上升──
- 捷径如何混入:模拟器 contém um tipo de raciocínio "voeiro", que tem 40% do tempo de obter a resposta correta, mas a generalização é muito ruim.
- A forma como a aprendizagem é utilizada para a aprendizagem é a de uma pessoa que não tem qualquer conhecimento sobre a aprendizagem.

## Entrega-o

`outputs/skill-star-loop-reviewer.md` ajudar-te em treinamento pre-audit um projetado auto-aprendizagem de raciocínio pipeline.

## 练习

1. 运行模拟器──将捷径频率 设为零,然后设为0.4──尽管两次运行都在训练分布上达到>90%,最终精度会相差多少?

2. 给模拟器添加一个持续的OOD test――从不同分布中抽取问题,并在分发和OOD sets 上评估 bootstrapped model――量化差距――

3. 阅读 Quiet-STaR 论文 (arXiv:2403.09629) Seção 3──分别用三句话解释 "final de pensamento" Token 和 cabeça de peso misturado──

4. Comparar o filtro de mantenimento se correto do STaR com um alternativo supervisionado por processo, o último irá recompensar independentemente cada passo racional.

5. Design a evaluar, para capturar os racionais de atalho no modelo implementado. Não é necessariamente perfeito, mas deve ser capaz de romper o caminho mais simples de reforçar o ciclo STaR.

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| STaR | "Self-Taught Reasoner" | 在得到正确答案的模型生成 rationales 上 fine-tune；重复 |
| Rationalization | "Hinted retry" | 注入正确答案，并在 base model 失败的问题上重新 prompt 生成 rationale |
| V-STaR | "Verifier STaR" | 在正确和错误 rationales 上 DPO-train 一个 verifier，并将其用于 inference-time selection |
| Quiet-STaR | "Per-token rationales" | 在每个 Token 位置生成隐藏 thoughts；与 baseline prediction 混合 |
| Answer-conditioned gradient | "Outcome-based signal" | 训练循环奖励最终答案，而不是 reasoning steps |
| Process reward model | "Step-level verifier" | 在 per-step correctness 上训练的 reward model，而不是 outcome；与 STaR 形成对比 |
| Shortcut rationale | "Right answer, wrong reasoning" | 一个通过无法泛化的模式得到标签的 rationale；STaR 会保留这些 |

## 延伸阅读

- [Zelikman et al. (2022). STaR: Bootstrapping Reasoning With Reasoning](https://arxiv.org/abs/2203.14465) 原始论文──
- [Hosseini et al. (2024). V-STaR: Training Verifiers for Self-Taught Reasoners](https://arxiv.org/abs/2402.06457) 加入用于推理-time selecção de DPO verificador。
- [Zelikman et al. (2024). Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking](https://arxiv.org/abs/2403.09629) por token 内部 rationales。
- [Lightman et al. (2023). Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) modelos de recompensa de processo,即替代 Gradient 信号。
- [DeepSeek-R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) RL em missões de validação, será STaR  expandido para formação de fronteira
