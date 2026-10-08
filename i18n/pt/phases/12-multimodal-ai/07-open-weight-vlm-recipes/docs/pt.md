# Receitas de VLM de Peso Aberto: o que é realmente importante

> A publicação de VLM de peso aberto de 2024-2026 é uma parte das tabelas de ablação de bosque. A MM1 da Apple testou 13 tipos de codificadores de imagem, conectores e combinações de dados. A Molmo de Allen AI demonstra que as descrições de pessoas detalhadas ganharam a destilação GPT-4V. A Cambrian-1 fez mais de 20 tipos de codificadores em relação a cinco. Idefices2 vão transformar o espaço de design em formação. As VLMs prismáticas em referência controlada compararam 27 tipos de receitas de treinamento.

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 分钟

## Objectivo de aprendizagem
- Exposição de cinco eixos Espaço de design VLM: codificador de imagem, conector, LLM, mix de dados, cronograma de resolução.
- 阅读 MM1 / Idefics2 / Cambrian-1 table of ablation,并预测哪个knob 会改变给定基准──
- Em um determinado orçamento computacional e mistura de tarefas, escolha uma nova receita para o VLM (encoderador, conector, dados, resolução)
- Explicação de porquê na mesma contagem de tokens

## 问题
Já existem centenas de VLMs de peso aberto. A maioria das diferenças entre os bons e os mais avançados não são de arquitetura, mas de dados, de resolução e de escolha de codificadores.

2023 年浪潮(LLaVA-1.5、InstructBLIP、MiniGPT-4) baseado em capacitação pré-pareja de captura + LLaVA-Instruct-150k──不错的基线──上限约在MMMU 35%──

O resultado foi um surpresa e uma prática.

## 概念
### Espaço de projeto

Idefics2 ((Laurençon et al., 2024) nomeou estes eixos:

1. Encoder de imagem: Clip ViT-L/14、SigLIP SO400m/14、DINOv2 ViT-g/14、InternViT-6B──Encoderadores:
2. Conector──MLP(2-4 camadas)、Q-Former(32 consultas + cross-attn)、Perceptor Resampler(64 consultas)、C-Abstractor(convolução + bilinear pooling)。
3. Modelo de linguagem: Llama-3 8B / 70B、Mistral 7B、Phi-3、Gemma-2、Qwen2.5。 tamanho do LLM é o principal parâmetro custo。
4. Dados de formação. • Paros de capacitação: • CC3M, • LAION, • interligados • OBELICS, • MMC4, • instrução • LAVA-Instrução • ShareGPT4V, • PixMo, • Cauldro)
5. Calendário de resolução: Fixação 224/336/448  Qualquer Res  Dinâmica nativa 

Cada produção VLM cidade em cada eixo 上做选择。 A maior parte da variação das pontuações do MMMU é explicada pelos eixos 1、4 和 5 ⋅ não por você escolhido qual conector ⋅ explicação。

### Eixo 1:encoder > conector

MM1 Secção 3.2 显示: de CLIP ViT-L/14 换成 SigLIP SO400m/14,MMMU 增加 3+ pontos。 de MLP 换成 Perceiver Resampler,增加不到 1 point。Idefics2 复现了这个点:SigLIP > CLIP,Q-Former ≈ MLP ≈ Perceiver,在同样的代币计数下相近。

Cambrian-1 Cambrian Vision Encoders Match-Up(Tong et al., 2024)                                                                                                                                                                                                                                                   

O codificador de VLMs abertos de 2026 anos é usado para recursos semânticos + densos do SigLIP 2 SO400m/14, sometimes会与DINOv2 ViT-g/14 recursos 拼接(Cambrian Spatial Vision Aggregator 就这样做)

### Eixo 2: Design de conector 差异不大

MM1、Idefics2、Prismatic 和 MM-Interleaved todos chegaram à mesma conclusão: em contato fixo com tokens visuais, a arquitetura do conector  quase não importa.

Verdadeiramente, é importante o número de tokens. Mais tokens visuais = mais computação LLM = melhor desempenho, até algum ponto depois da receita diminuir.

Q-Former vs MLP é um problema de custos, não um problema de qualidade: independentemente da resolução da imagem  como, Q-Former                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

### Eixo 3: Dimensão do LLM decide

Em cada artigo do VLM, colocar o LLM de 7B 翻倍到13B, normalmente todos farão com que o MMMU 增加 2-4 pontos── até 70B 时, a maioria dos pontos de referência 会和──VLM 的多模理性天花板就是 LLM 文理性天花板视觉编码器 只能信息,不能替代它推理──

É por isso que o Qwen2.5VL-72B e Claude Opus 4.7 em MMMU-Pro e ScreenSpot-Pro estão muito na frente: o cérebro linguístico é muito grande. Um VLM 7B não pode usar um design de conector inteligente para substituir o VLM 70B.

### Eixo 4: dados  详细的人类字幕 胜过蒸蒸

Molmo + PixMo(Deitke et al., 2024) é o resultado que todos devem ler de 2024. Allen AI 让人类标注员使用 1-3 分钟的密集语音-文字通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通通

Molmo-72B em 11/11 个基准上击败Llama-3.2-90B-Vision。 Não há diferença na arquitetura, mas na qualidade das legendas。

ShareGPT4V(Chen et al., 2023)和 Cauldron(Idefics2) adotaram o mesmo livro de jogos, híbridos humanos + GPT-4V captions。 Trend muito claro: para 2026 fronteira而言, densidade de captions > quantidade de captions > conveniência de destilação。

### Eixo 5: resolução  e calendário

Idefics2 的 ablations:384 -> 448 增加 1-2 puntos──448 -> 980 配合图像分化(AnyRes) em referência OCR 上再增加 3-5──Flat resolution training 会在中等精度 附近高原;resolução ramping(从224 开始,以 448 或 native 结束)训练更快,最终更高──

Cambrian-1 fez resolução vs tokens trade-off: em computação fixa, você pode escolher baixa resolução, mais tokens, ou alta resolução, menor resolução, menor resolução, menor resolução, maior resolução, para a OCR, menor resolução, mais tokens, para a compreensão geral da cena, maior resolução.

2026 Ano de produção receita:Etapes 1 以 384 fixa  treinamento,Etapes 2 para tarefas OCR pesadas Utilize máxima resolução dinâmica de 1280 ⋅

### Prismático de controlado

Prismatic VLMs ((Karamcheti et al., 2024) é o papel de controle de todos os eixos.

- Contagem de tokens visuais por imagem  explica cerca de 60% de variação。
- A escolha do codificador 解释约20%──
- Arquitetura de conectores 解释约 5%──
- 其他所有因素( mix de dados、programador、LR) explica o restante de 15%

É uma descomposição grosseira, mas também na literatura, sobre o que devo primeiro explicar.

### 2026 ano de seleção

Baseada em evidências, receita de VLM aberto de 2026 anos novos projetos:

- Encoder: resolução nativa 下的 SigLIP 2 SO400m/14 com NaFlex; se necessário segmentação/terreno, então 拼音 DINOv2 ViT-g/14 以获得密集功能──
- Conector: patch tokens 上的2层 MLP──除非令牌限制,否则跳过Q-Former──
- LLM: Qwen2.5 / Llama-3.1 / Gemma 2;7B Utilizando custos, 70B Utilizando qualidade, com base na latência de meta 选择。
- Dados:PixMo + ShareGPT4V + Cauldron,并用任务特定指示数据 补足。
- Resolução:dinâmica (长边 min 256、max 1280 pixels)
- Programação:Alineamento de fase 1 (apenas projector) Felagem 2 completa de sintonia fina Felagem 3 de sintonia específica de tarefa―

Cada um destes conceitos pode ser traçado até os artigos de referência de esta aula.


```figure
l5-vlm-recipe-knobs
```

## Use-o
`code/main.py`É um analista de tabela de ablação 和 recipe picker── é codificado MM1 和 Idefics2 tabela de ablação(缩版),并允许您查询:

-  Dê um orçamento determinado X e tarefa Y, qual receita 胜出?
- Se eu estiver na 7B Llama, em cima de SigLIP, em CLIP, o esperado delta da MMMU é quanto?
- Para obter uma resposta de 80% de confiança, devo primeiro ablacionar o eixo?

输出 é uma lista de receitas classificada, contendo o delta de referência prévio e a primeira recomendação ablate

## Entrega-o
本课生成 `outputs/skill-vlm-recipe-picker.md` dado um conjunto de tarefas de objetivos, orçamento de computação e objetivo de latência, ele produz uma receita completa (encoderador, conector, LLM, mix de dados, cronograma de resolução), e para cada seleção de referência à ablação correspondente.

## 练习
1. 阅读MM1 Seção 3.2── Para um LLM 2B fixo, em 50M imagens orçamento Abaixo, qual codificador 胜出?

2. Cambrian-1 发现,拼音 DINOv2 + SigLIP 在视觉中心的基准上胜过单独使用任一者,但在MMMU上没有新增信号──预测哪些基准会升升,哪些会持平──

3. Seu objetivo é construir um agente de interface móvel de 2B LLM.

4. Molmo lançou modelos 4B e 72B. 4B e VLMs fechados 7B têm competitividade. 72B em 11/11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

5. Designar uma tabela de ablação, utilizada em 7B VLM 上隔离数据-mix quality 和 encoder quality──最少需要多少次训练运行?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | “调一个 knob” | 训练多次 runs，它们只在一个 design-space axis 上不同，其他全部保持 constant |
| Connector | “Bridge” / “projector” | 将 vision encoder output 映射到 LLM token space 的 trainable module（MLP、Q-Former、Perceiver） |
| Detailed human caption | “Dense caption” | 多句人类撰写的描述（通常 80-300 tokens），比 web alt text 更丰富 |
| Distillation | “GPT-4V captions” | 由更强的 proprietary VLM 生成的 training data；方便，但容易继承 hallucination |
| AnyRes / dynamic res | “High-res path” | 通过 tiling 或 M-RoPE 输入大于 encoder native resolution 的图像的 strategy |
| Resolution ramp | “Curriculum” | 从 low-resolution 开始并逐步提高的 training schedule，可加快 alignment learning |
| Vision-centric bench | “CV-Bench / BLINK” | 强调细粒度 visual perception，而非 language-heavy reasoning 的 evaluation |
| PixMo | “Molmo's data” | Allen AI 的 712K densely-captioned image dataset；人类语音被转写为 dense captions |

## 延伸阅读
- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
