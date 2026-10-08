# Atenção Nativa de Esparça (DepSeek NSA)

> Em 64k Token, Attention 会吞掉 70-80% do decode 延迟── cada modelo aberto 实验室 has its modified scheme──DeepSeek's NSA(ACL 2025 best paper) é um verdadeiro programa de estabilidade: três paralelos Atenção 分支, isto é, o token de grosseira após a compressão、 selectividade retenção de pequenos graumes Token, bem como para uso local de contexto de janela deslizante, através de um portão aprendido 组合在一起── é alinhado com hardware-alignado (kernel-friendly)、nativamente treinável, pode ser usado simultaneamente em pré-treinamento, e não em inferência 时外), e em 64k decode, ele é superior ao FlashAttention 更快, atingir ou superar a qualidade da atenção plena──本本将端挂到构建这三个分支, demonstrando por que essa raridade pode ser usada em uma pequena parte do端末.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 12 (KV cache, flash-attention), Phase 7 · 15 (attention variants), Phase 10 · 16 (differential attention)
**Time:** ~60 minutes

## Objectivo de aprendizagem

- Descobri as três secções de atenção da NSA, e cada secção captura o que é que a informação.
- Explicar por que a NSA é naturalmente treinável, enquanto o método de atenção escassa anterior só pode ser usado para inferir.
- Em contexto de 64k, em função do tamanho do bloco de compressão e da seleção de top-k, calcular NSA comparado atenção completa de atenção 计算节省量。
- Em uma breve sequência de síntese, usando stdlib Python 实现三分支组合,并验证 gating weights.

## 问题

序列长度为 N 时,Full attention 的时间成本是 `O(N^2)`, por camada de cache KV é `O(N)`△ em 64k Token 下, cálculo e largura de banda de memória 数字都非常灾难──NSA 论文中的理论估计测量值显示:在 64k 下,Attention 占总解码 延迟的 70-80%──后续所有指标,包括 TTFT、tokens/sec、每百万 Token 成本,都被 Attention 成本主导──

Esparsa de atenção é uma resposta evidente. Em alguns casos, essa tendência é de reduzir a atenção, mas não é necessária.

Native Sparse Attention(Yuan et al., DeepSeek + PKU + UW, ACL 2025 best paper, arXiv:2502.11089) 两者兼具:模型在预训期间学习的稀缺模式, bem como um algoritmo alinhado ao núcleo para realizar, fazendo com que ele seja realmente entregue em inferência 时交付计算节省.

## 概念

### Três e três

Para cada consulta, a NSA irá dirigir-se ao cache KV de três diferentes visualizações.

1. **Compressed branch.**Token 被分组为大小为 `l`de blocos (geralmente 32 ou 64) ⋅ cada bloco ⋅ através de um pequeno MLP aprendido ⋅ comprimido em um único token de resumo ⋅ query ⋅ irá participar nesses tokens comprimidos, para obter a gruassemidade de toda a sequência ⋅

2. **Selected branch.**Utilize nota de atenção do ramo comprimido, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de atenção, identificação de notas de nota de atenção, identificação de notas de nota de nota, identificação de nota de nota, identificação de nota de nota de nota, identificação de nota de nota, identificação de nota de nota, identificação de nota de nota, identificação de nota de nota, identificação de nota de nota, identificação de nota, identificação de nota de nota, identificação de nota, identificação de nota, identificação de nota, identificação de nota, identificação de nota, identificação de nota, de nota, nota de nota de nota, nota de nota de nota, nota de nota, nota de nota, nota de nota de nota, nota de nota, nota de nota de nota, nota de nota de nota, nota, nota de nota de nota, nota de nota de nota, nota de nota, nota de nota de nota, nota de nota, nota de nota de nota, nota de nota de nota, nota de nota de nota de nota, nota de nota de nota, nota de nota de nota de nota de nota, nota de nota, nota de nota de nota, nota de nota de nota de nota, nota de nota de nota de nota de nota de nota de nota, nota de nota de nota de nota, nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de nota de

3. **Sliding-window branch.**consulta irá participar até o mais recente `W`个 Token (normalmente 512), usado em contexto local.

Três分支的输出通过学习 per-position gate 组合:

```
out = g_cmp * out_cmp + g_sel * out_sel + g_win * out_win
```

`g_cmp, g_sel, g_win`É a pergunta acima de pequenos MLP  produzidos por pesos de porta── eles não necessariamente adicionados para 1, pode ser independente de cada um dos seus poderes adicionados──

### Por que é que é nativo?

Seleção 步骤(top-k blocos) é descalço de──descalço operações irá destruir o fluxo gradiente──Precedente de atenção escassa 工作要么跳过选择的 Backpropagation(限制训练),要么使用连续放松,而这些方法在推断时无法给出真正稀疏性──

A NSA contornou este ponto:Attenção com branca comprimida Essência é o papel que desempenha em toda a sequência de pequenas e grossas partículasAttenção.`top_k`操作在前向计算图上是无运,它只控制哪些块会从内存中加载──

É por isso que a NSA pode ser usada de ponta a ponta para o pré-treinamento.

### Núcleo alinhado com hardware

O kernel da NSA é para a hierarquia de memória da GPU moderna 设计的.Kernel 按 GQA grupo 加载查询(outer loop), para cada grupo 获取对应的稀少KV块(inner loop),并在SRAM 上运行注意.

论文报告称, kernels de Triton em 64k decodificados 上比 FlashAttention 快 9x,并且速度率 会随序列长度增长──前和后的 kernels 均已提供──

### 计算预算

Que`N`Por ordem de longo prazo,`l`Para o tamanho do bloco de compressão,`k`Para o top-k contagem de seleção,`w`Para a janela deslizante,`b`Por tamanho de bloco selecionado(normalmente é igual a `l`)。

- Arranco comprimido: cada consulta tem`O(N/l)`- As chaves, portanto, o total.`O(N * N / l)`- Não.
- Arquivo selecionado: cada consulta`O(k * b)`- As chaves, portanto, o total.`O(N * k * b)`- Não.
- Arranho deslizante: cada consulta tem`O(w)`- As chaves, portanto, o total.`O(N * w)`- Não.

总计:`O(N * (N/l + k*b + w))`- Não.

- Não .`N = 64k, l = 64, k = 16, b = 64, w = 512`: cada consulta de custos`1000 + 1024 + 512 = 2536 keys`❖ Atenção total`64000 keys` calcular redução de 25x♦

- Não .`N = 128k, l = 64, k = 16, b = 64, w = 512`: cada consulta de custos`2000 + 1024 + 512 = 3536 keys`❖ Atenção total`128000 keys`❖ redução de 36x♦ aumento da duração da sequência, que é o seu significado central.

### Como comparar

| Method | Differentiable | Real inference speedup | Long-range recall |
|--------|---------------|----------------------|-------------------|
| Sliding window only | yes | yes | fails |
| Strided / block-sparse | yes | yes | partial |
| KV pruning (H2O, StreamingLLM) | N/A (inference-time) | yes | partial |
| MoBA (Moonshot) | partial | yes | good |
| NSA | yes (natively) | yes (9x at 64k) | matches full attention |

MoBA(Moonshot, arXiv:2502.13189) Co-publicado, também adotou similar三个胜过一个的思路,将MoE 原则应用到注意区──NSA 和 MoBA 是理解2026 long-context pre-training 必须掌握的两个架构──


```figure
sliding-window-attention
```

## Construí-lo

`code/main.py`Em uma curta sequência de síntese, implementar três brancas, e mostrar:

- Compressão MLP(Para ensinar claramente, usar uma simples linha de base do mean-pool;
- Por pontuação de ramo comprimido 驱动的顶-k块选择──
- Recentemente`w`个Token 上的 deslizante-janela Atenção
- combinação fechada.
- Cuidado com a impressão de contagem computacional comparada.

### 步骤 1: Crie o token em blocos

```python
def compress(K, l):
    n = len(K)
    n_blocks = (n + l - 1) // l
    out = []
    for b in range(n_blocks):
        start, end = b * l, min((b + 1) * l, n)
        block = K[start:end]
        summary = [sum(row[d] for row in block) / len(block) for d in range(len(K[0]))]
        out.append(summary)
    return out
```

### 步骤 2: ramo comprimido Atenção

运行 query 针对压缩键的软max Attention──compressed-branch scores 同时作为 top-k seleção 的信号──

### 步骤 3: seleção de blocos de cima-k

 escolher o maior resultado `k`个压缩块的索引──加载这些块 中的原始未压缩代币,并在其上运行 Attention──

### 步骤 4: Janela deslizante Atenção

- Não .`w`个 Token,并针对它们运行标准 Atenção.

### 步骤 5: porta + combinar

A questão 上的小型 MLP 产生三个门权重――最终输出是三个分支输出的权重总量――

### 步骤 6: contagem computacional

Imprimir cada secção, cada consulta, as chaves da participação, número e número total.`N`(atenção total) fazer comparação.`l = 32, k = 4, w = 128`, NSA , cada consulta .`32 + 128 + 128 = 288`As chaves, e a atenção total é 1024, reduzida a 3,5x.

## Use-o

A NSA está em Profundos Buscos  seu próprio longo contexto de pré-treinamento pipeline 中使用──截至2026年 4月,public inference stacks 中的集成状态:

- **DeepSeek internal**:native, já publicado o direito de usar NSA ou posterior DSA (Deepseek Sparse Attention)
- **vLLM**Está a desenvolver um suporte experimental à NSA para pesos do DeepSeek-V3.x.
- **SGLang**A Comissão Europeia e a Comissão têm em conta a situação dos países em desenvolvimento.
- **llama.cpp / CPU**Não é suportado; em CPU de produção, a decomposição do núcleo não vale a pena.

什么时候使用 NSA:

- 面向64k+ contexto, e há um rigoroso orçamento de computação de pré-formação ou de formação contínua.
- Para DeepSeek, os seus próprios pontos de verificação de longo contexto, fazer inferências.

什么时候不要使用:

- Servir 现有密集关注预训练模型──没有持续培训,无法后装 NSA──
- Context 低于16k──三分支开销会超过省收益──
- Batch-1 chat interativo ― decodificação sensível ao atraso ― vai ser beneficiado, mas só em contextos longos ― será implementado.

## Entrega-o

本课会产出 `outputs/skill-nsa-integrator.md` Dado uma especificação de longa duração de um treinamento pré-estrutura, ele gerará um plano de integração da NSA: tamanho de bloco de compressão, topo-k, janela deslizante, largura de porta MLP, escolha do núcleo, bem como avaliações específicas de longo prazo para provar que a estrutura se torna mais razoável.

## 练习

1. Em 1024-Token  sintetizado sequência `code/main.py` Em três predefinidos `(l, k, w)`Não imprimir contagens de cálculo. Encontrar em teste de agulha-em-pacho de laranja.

2. Em um sinal é bloquear o valor médio da tarefa de composição em treino.

3. 实现 gate MLP── é utilizada como consulta 作为输入,输出三个规模── demonstrar que o comportamento da gate é razoável: em consultas aleatórias, é quase uniforme; quando a consulta é feita, é dado um maior peso ao ramo selecionado.

4. 計算 NSA-enabled 70B 模型在 128k context下下的KV cache memory budget──KV heads 为 8,head dim 为 128,BF16──与全注意以及 MLA(Phase 10 · 14 显示 MLA 的数字) fazer comparação──查找 NSA's fine-grained branch KV cache 等等到全注意序列长度──

5. 阅读 NSA 论文(arXiv:2502.11089) 第 4 节,并用三句话解释为什么压缩分支的注意分会被重复用于 top-k seleção,而不是计算一个单独的路由分点――将答案关联到渐进流――

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Compressed branch | “粗粒度视图” | 在 block-averaged keys 上做 Attention，以每个 query `O(N/l)` 个 keys 提供 global context |
| Selected branch | “Top-k blocks” | 在 compressed-branch scores 最高的 `k` 个 blocks 上做细粒度 Attention |
| Sliding window | “Local context” | 在最后 `W` 个 Token 上做 Attention，以捕获短程模式 |
| Native trainability | “打开 sparsity 进行 pre-train” | sparsity pattern 在 pre-training 期间学习，而不是在 inference 时外挂 |
| Compression block size l | “粗粒度视图的 group size” | 多少个 Token 被合并成一个 summary；通常为 32-64 |
| Top-k | “要保留的 blocks” | 读取其未压缩 Token 的 compressed blocks 数量；通常为 16 |
| Sliding window W | “Local attention radius” | 通常为 512；更短会损害 local coherence，更长会浪费计算 |
| Branch gate | “如何混合三个分支” | per-position MLP 输出，对三个分支的贡献加权 |
| Hardware alignment | “Kernel-friendly sparsity” | 选择 sparse pattern，使实际 GPU kernel 能达到理论 speedup |
| DSA | “NSA 的后继者” | Deepseek Sparse Attention，DeepSeek 系谱中继 NSA 之后的架构 |

## 延伸阅读

- [Yuan et al. — Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention (arXiv:2502.11089, ACL 2025 Best Paper)](https://arxiv.org/abs/2502.11089) 论文
- [DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437)NSA 面向的架构家族
- [Moonshot AI — MoBA: Mixture of Block Attention for Long-Context LLMs (arXiv:2502.13189)](https://arxiv.org/abs/2502.13189) 同期工作, em blocos de MoE-style Atenção
- [Beltagy et al. — Longformer: The Long-Document Transformer (arXiv:2004.05150)](https://arxiv.org/abs/2004.05150) Janela deslizante 起源
- [Xiao et al. — StreamingLLM: Efficient Streaming Language Models with Attention Sinks (arXiv:2309.17453)](https://arxiv.org/abs/2309.17453) NSA 改进的推理-time sparsity baseline
- [Dao et al. — FlashAttention-2 (arXiv:2307.08691)](https://arxiv.org/abs/2307.08691)Os kernels da NSA estão em 64K abaixo da linha de base de atenção total
