# Jamba  Transformador SSM híbrido

> O modelo espacial de estado (SSM) e o transformador 想要的东西不同──Transformer 通过 Attention 换取质量,但代价是二次复杂度──SSM 通过递递推换取线性时间推理和常量内存,但质量落后──AI21 的Jamba(2024 年 3 月) e Jamba 1.5 2024 年 8 月) coloca-os no mesmo modelo: cada 7 Mamba 层配 1 变压器 层, cada bloco usando MoE,并提供可在单张 80GB GPU 上运行的 256k 窗口──Mamba-3 ICLR 2026) através de um conjunto de estados de espaço e MIMO projeções 强化 SSM 侧──本端值到端阅读这两类架构,解释为什么这种纯M和Transformer 长期的中文中未持续扩展,但保留了这种纯M-Transformer 长期的中文中混合配合,

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**前置要求:**Fase 10 · 14 (arquiteturas de modelo aberto), Fase 10 · 17 (atenção nativa escassa)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 解释 Jamba block 中的三个原始:Transformer layers、Mamba layers、MoE,以及 1:7:even 的交错配方──
- A forma de apresentação do MSS, bem como por que ele pode realizar o cálculo de memória constante.
- 计算 Jamba 模型在256k context下的 KV cache 占用,并与纯变压器 模型所需内存进行比较──
- Explicar três inovações do Mamba-3 (exponencial-trapezoidal discretization, complexo-valorizado estado de atualização, IMO) e cada inovação tem como objetivo:

## 问题
Atenção à longitude da sequência é uma segunda complexidade. O modelo espacial de estado é linear. Esta diferença é aumentada continuamente: em tokens 256k, um mapa de atenção de transformador em cada cabeça tem 65B 条目; o estado de passagem do SSM não varia com a longitude da sequência, o tamanho está fixo.

Pure-SSM 模型(Mamba、Mamba-2) em pequena escala pode se adequar à perplexidade do transformador, mas em tarefas de rastreamento de estado, e em algumas recuperações de contexto, é um fracasso.

显而易见的修复方法:两者都用──在需要精确召回的地方放变压器层――其他地方使用SSM layers──调节比例──Jamba é o primeiro modelo de produção de esta forma híbrida 配方的规模化方式交付的模型(总计52B、激活12B、256k context、单张80GB GPU)──Jamba 1.5 将该系列扩展到总计398B / 激活94B──Mamba-3(ICLR 2026) é a melhor base de base de pure-SSM atual, híbrido que pode ser reconstruído em torno dele──

Esta aula irá ler este artigo e formar uma escolha correta de proporções de modelos de pensamento.

## 概念
### Um SSM numa página

Modelo espacial do Estado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `h`处理序列  processamento`x_1, ..., x_N`- Não .

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

Em cada passo, o estado passa por um movimento de energia.`A`演化,接收输入 `B x_t`,并输出 `C h_t`- Não.`A, B, C`Todos podem aprender.`y_t`Só preciso.`h_{t-1}`和 `x_t`Não precisa de nada mais cedo.`x`△内存是常量──推理是每个符号 O(1)。

建模质量                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `A`                                                                                                                                                                                                                                                              `A, B, C`替换为依赖数据的形式 (也就是 选择性)  Mamba-2 (Mamba-2)  2024  进一步简化了结构 (Mamba-3 (Mamba-3)  2026) 则在特定位置重新加入复杂性 (Mamba-2) 

关键性质是: Para o decodificador LLM, a camada SSM pode ser substituída diretamente pela camada Attention, substituindo o crescente cache KV com um estado de camada fixa de grande dimensão.

### O bloco Jamba

Bloco de Jamba  segundo dois números交错层:

- `l`:Attenção-para-Mamba ratio。Jamba 使用 `l = 8`, significa cada 7 Mamba 层配 1 个 Transformer 层(7 Mamba + 1 Atenção = 每组 8 层) ⋅
- `e`: Frequência MOE。 Jamba 使用 `e = 2`, indicando cada camada de aplicação MoE

Bloco 內層序列:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

Cada bloco de Jamba é de 8 camadas. A profundidade é de 4 blocos.

### Por que a proporção 1: 7

AI21 fez ablações: que tipo de atenção para o Mamba, por exemplo, pode obter a melhor perplexidade por parâmetro e recall no contexto em suas avaliações de longo contexto?

- Atenção 太多(1:1): Qualidade aumenta, mas a memória e a velocidade variam.
- Atenção 太少(1:15):内存 muito bom, mas recuperação no contexto 失败。
- O melhor é 1:7 ou 1:8

直觉是:Layer transformador 处理精确召回和状态跟踪──Mamba layers 负责低成本大部分处理──

### Codificação de posição

Mamba camadas 本身具有位置感知能力(通過递推) ・原始 Mamba-based hybrids 中的注意层 没有使用 RoPE,因为 SSM camadas 提供位置信息。Jamba 1.5 为注意层 添加 RoPE,以增强更长文本的概括;这是基于经验长文本评价的后进而──

### O orçamento de memória

对于 Jamba-1 形状(32 层:28 Mamba + 4 Atenção, oculta 4096,32 cabeças de atenção):

- Cabeça KV( apenas camadas de atenção): em 256k BF16 下为 `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB`                                                                                                                                                                                                                                                              
- Estado do SSM: cada prefixo de token 为 `28 * hidden * state_size`, mas é um grande número de camadas fixas, não se segue a sequência de extensão de tamanho.`28 * 4096 * 16 * 2 = 3.7 MB`- Não.

Com o mesmo escondido 32 layers 32 heads full MHA de Transformer puro`2 * 32 * 32 * 128 * 256k * 2 = 128 GB` Cache de KV  Reduzido 8x── mesmo em relação à maioria dos modelos utilizados em 2024 模型使用的 GQA(8)`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`),Jamba's 1:7 híbrido em 16 GB

É o que a AI21 diz sobre o 单张 80GB GPU 上的 256k context──full-MHA pure Transformer's KV cache 放不下; mesmo que a linha de base GQA também quase não dê pesos 和 activações 留空间; enquanto o Jamba 可以──

### Mamba-3: linha de base de MSSP pura de 2026

Mamba-3 ((ICLR 2026, arXiv:2603.15569) no lado do SSM puro introduziu três inovações:

1. **Exponential-trapezoidal discretization.**Utilize a Mamba-2 em sua discrição de Euler.`x_t`Convolução externa superior.

2. **Complex-valued state update.**之前的Mamba 将状态矩阵从复杂(S4)降低为真实对角形(Mamba),再降低为规模身份(Mamba-2) ・・・Mamba-3 重新加入复杂值, equivalente a realizar embed rotary embeddo dependente de dados em relação ao estado。 Isso recuperou 简化所牺牲的现实值 能力──

3. **Multi-input multi-output (MIMO) projections.**Não usar projeções de tamanho de característica, mas usar projeções de valor de matriz. Em casos de não aumentar a latência de decodificação, a capacidade de construção e a utilização de hardware são aumentadas.

Em 1,5B 参数规模下,Mamba-3 相比Gated DeltaNet 平均下流精度 提高0.6 个点;MIMO variant 额外增加1.2 个点,总共提升 1.8 个点──在相同状态大小下,Mamba-3 以一半状态匹配Mamba-2──

Mamba-3 ainda não foi entregue em produção híbrida em grande escala, mas é claramente a próxima geração de Jamba-class 模型 SSM 侧的候选方案──

### Qual é o uso híbrido

Híbrido 适合以下情况:

- Context 足足长, até que o cache KV do Transformer puro 变得痛苦 ((64k+) ⋅
- 任务混合了短距離结构 (adaptado para SSM) 和长距離回忆 (necessário Transformer)
- Você quer que o GPU seja implantado no orçamento interno, enquanto o Transformer KV cache está em baixo.

Hybrid 不适合以下情况:

- Context 很短(低于16k) ・SSM 浪费;pure Transformer 足足足好。
- 任务需要在任何地方注意-----深度推理、多文档交叉引用) ――Híbrido em Layer of Attention
- Você está se expandindo para modelos de fronteira de trilhões de parâmetros.

### O cenário competitivo

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

2026 ano de esquema:pure-transformer MoE principal fronteira, mas híbrido  ocupando 256k ou mais contextos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               


```figure
swiglu-ffn
```

## Use-o
`code/main.py`É um calculador de memória para arquiteturas híbridas.

- 目標 context 下的 KV cache──
- Memória de estado SSM.
- Uma série de formas de modelo em contexto N 下 的总内存──

O computador suporta:

- Linha de base do Transformador puro ((KV cache 随 N 增长) 。
- Jamba-style 1:7 híbrido.
- Pure-SSM( totalmente sem cache KV)。

 Para a forma publicada, os números são diretamente provenientes do Jamba-1 e Jamba-1.5 论文; para as hipóteses de variação, é um extra-título.

O programa de desenvolvimento de um programa de desenvolvimento de desenvolvimento de um novo programa de desenvolvimento de desenvolvimento de um novo programa de desenvolvimento de desenvolvimento de um novo programa de desenvolvimento de desenvolvimento de um novo programa de desenvolvimento de desenvolvimento de um novo programa de desenvolvimento de desenvolvimento de projetos.

- Mas a maioria das empresas que trabalham com o sistema de gestão de dados (SGLang) apoiam Jamba 和 Mamba──
- Em contexto 256k, a Jamba's cache advantage will be present in concurrent request throughput 上── em igual VRAM, você pode acomodar mais sequências de Jamba do que as sequências de Transformer──
- Mamba-3  como modelo independente ainda não está em produção, apenas uma prévia de pesquisa de 1.5B 

## Entrega-o
本课会产出 `outputs/skill-hybrid-picker.md` especificação da carga de trabalho determinada (profil de comprimento de contexto, mix de tarefas, orçamento de memória), que irá dar uma recomendação entre um híbrido de estilo Transformer, Jamba e um SSM puro, e indicar o peso de armazenamento e de qualidade.

## 练习
1. 运行 `code/main.py`, calcular 32 层 pure Transformer ((ocultos 4096,32 cabeças) e Jamba-1 híbrido de igual forma em contexto 256k 下的 KV cache──验证 AI21 论文声称的约8x内存降低──

2. Modificar calculador,建模 1:3 híbrido(4 Mamba: 1 Atenção) e 1:15 híbrido(14 Mamba: 1 Atenção) ・・・ desenhar cache KV vs ratio──在哪个比率 下 KV cache等等 SSM estado de memória?

3. 阅读 Jamba 论文(arXiv:2403.19887) 的第 3 节──解释为什么AI21使用Mamba-1而不是Mamba-2,尽管Mamba-2 更快──提示:混合式除离部分记录了这一点──

4. 計算 Jamba 1.5 Large 中 MoE-every-other-layer 参数 overhead(总计 398B,激活 94B) ・将活性比与DeepSeek-V3(37B/671B)

5. 阅读 Mamba-3 论文(arXiv:2603.15569) 的第 3 节──用三句话解释为什么复杂-valued state update 等价格于数据依赖的旋转嵌入──把答案关联到Phase 7 · Lesson 04 的 RoPE 推导──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | “带固定状态的递推” | 具有学习到的递推 `h_t = A h_{t-1} + B x_t` 的层；每个 token 使用常量内存 |
| Selective SSM | “Mamba 的技巧” | 依赖数据的 A、B、C 参数，使模型在线性时间下获得类似 gating 的选择性 |
| Attention-to-Mamba ratio | “多少个 Attention layers” | 在 Jamba 中，`l = 8` 表示每 7 个 Mamba layers 配 1 个 Attention layer |
| Jamba block | “8 层一组” | 一个 Attention + 七个 Mamba + 在交替位置使用 MoE |
| SSM state | “隐藏缓冲区” | 固定大小的逐层状态，用于替代 Mamba layers 的 KV cache |
| 256k context | “Jamba 的旗舰数字” | Jamba-1 可在单张 80GB GPU 上容纳的序列长度；pure Transformer 在该大小下无法做到 |
| Mamba-3 | “2026 pure SSM” | 当前最佳 pure-SSM architecture，具有 complex state + MIMO；是 hybrid 重新构建时围绕的 baseline |
| MIMO | “Multi-input multi-output” | Mamba-3 的创新，使用 matrix-valued projections 而不是逐 feature 标量 |
| Exponential-trapezoidal discretization | “Mamba-3 的递推” | 更有表达力的递推，包含 Mamba-2 的 Euler-method discretization |
| Hybrid architecture | “混合 Attention 和 SSM” | 任何交错 Transformer 和 SSM layers 的模型；Jamba 是生产级原型 |

## 延伸阅读
- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) 原始 Jamba 论文,ratio ablations,256k context 声明
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) Jamba 构建所基于的选择SSM 论文
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060)  simplificação do espaço estruturado-estado  后继者
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) Estado de valor complexo  MIMO  2026 fronteira pura-SSM
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) S4 论文, faceva towards LLMs  SSM 谱系起点
