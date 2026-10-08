# Por que transformadores  RNNs problema

> RNNs 一次处理一个代币――Transformers 一次处理所有代币―― essa única estrutura de seleção, mudou após 2017 em Deep Learning.

**类型：**- aprendizagem
**语言：**Python
**先修要求：**Fase 3 (Centro de Aprendizagem Profunda), Fase 5 · 09 (Sequência a Sequência), Fase 5 · 10 (Mecanismo de Atenção)
**时间：**- 45 minutos.

## 问题

Até 2017, cada modelo de sequência mais avançado da Terra  linguação tradução语音 eram redes neurais recorrentes──LSTMs 和 GRUs em equivalente à imagemNet 地位的翻译基准上统治了半十年── eram, então, os únicos instrumentos disponíveis para todos os proprietários──

Eles têm três pontos fracos fatais.`t+1`需要来自Token `t`O estado oculto de uma sequência de 1,024 tokens significa que em cada ciclo pode executar 1.024 passos em cadeia em uma GPU com 1.000.000 de operações de floating point. Em hardware projetado para a linha, o tempo de treinamento do relógio de parede vai crescer com a sequência.

Gradientes desaparecidos significam 50 Tokens  Informações anteriores já foram comprimidas através de 50 níveis não-lineares.

固定宽度的隐藏状态意味着编码器会在解码器 看到任何内容之前,把整个源序列 挤压到单个矢量──源是5个代币 还是500个都无关紧要;瓶始终是相同的形状──

O artigo de 2017 Attenção é tudo que você precisa  propôs uma ideia impulsiva: abandonar completamente a recorrência― deixar cada posição e andar para cada outra posição― usando uma grande matriz de multiplicação  treinamento, em vez de 1.024 vezes de ordem calcular―.

Até 2026, este resultado já dominou todas as modalidades.

## 概念

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Recurrence 是瓶颈。**RNN 计算 `h_t = f(h_{t-1}, x_t)`Cada passo depende do primeiro.`h_4`之前计算 `h_5`❖ Com mais de 10.000 GPUs modernos em linha central, isso desperdiça 99% da sua área em longas séries.

**Attention 是广播。**A auto-atenção vai ser para cada um .`(i, j)`Sim , assim .`output_i = sum_j(a_ij * v_j)`Toda a matriz de atenção N×N 会在一次批量中填满──没有任何步骤依赖另一步──GPUs 喜欢这一点──

**加速不是常数。**É isso.`O(N)`profundidade serial 和 `O(1)`Na prática, em N=512 e no mesmo hardware, os transformadores de cada época têm uma velocidade de treinamento de 510×; com o aumento da duração da série, a diferença continuará a aumentar até atingir a atenção.`O(N²)`Parede de memória ((Flash Attention                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

**transformers 的代价。**Memória de atenção 按 `O(N²)`扩展──2K contexto 没问题──128K contexto 则需要滑窗、RoPE extrapolation、Flash Attention tileing,或线性注意变量──Recurrence 在时间和内存上都是`O(N)`Os transformadores usam o tempo para mudar de memória, e depois ganham o tempo.

**Inductive bias 的转变。**RNNs 假设地方 和近況──Transformers não fazem假设每一对位置都是注意的候选人──这就是为什么变压器需要更多数据才能训练得好,但一旦拥有足够的数据就能扩展得更远──Chinchilla(2022) formalizou este ponto:


```figure
rnn-vs-parallel
```

## Construí-lo

Não há rede neural, mas nós usamos valores numerais para simular o núcleo, para que você perceba a diferença no seu próprio bloco de notas.

### 步骤 1: Messa a profundidade serial

- Não .`code/main.py`△ Nós construímos duas funções── uma把序列编码为加法链(串行,类似RNN)── outra把它编码为并行规约(广播,类似注意)── mesma matemática, diferentes dependências gráfico──

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

Nós temos uma duração de até 100.000 sequências de diferentes tempos. A versão RNN é O (N), e usa um único pipeline de CPU. Mesmo em Python puro, a redução de estilo de atenção na duração ≥ 1.000 também vai ganhar, porque Python.`sum()`É com C 实现, e não se produzem explicações em cada passo.

### 步骤 2: 计算理论操作

Os dois algoritmos fazem N 次加法。区别在于 *dependency depth*:在下一步能够开始之前,有多少操作必须顺序发生──RNN depth = N。Attention depth = log(N), se usar redução de árvore;或者在平行扫描中为1──决定 GPU 时间是深度,而不是操作次数──

### 步骤 3: Expansão da experiência na longa sequência

Nós imprimimos uma tabela de cronometragem, para que a diferença se torne visível. Em 2026 Mac  notebook, menos de 1.000 elementos sequência muito rápido, difícil de medir. 100 mil sequências mostram uma clara linear digitalização.

## Use-o

2026 年什么时候仍然选择 RNN:

| 情况 | 选择 |
|-----------|------|
| Streaming inference，一次一个 Token，常量内存 | RNN or state-space model (Mamba, RWKV) |
| 超长序列（>1M tokens），Attention memory 爆炸 | Linear attention, Mamba 2, Hyena |
| 没有 matmul accelerator 的 edge device | Depthwise-separable RNN 在 FLOPs/watt 上仍然胜出 |
| 其他任何情况（训练、batched inference、最高 128K 的 context） | Transformer |

Os modelos de espaço-estado (SSM) como Mamba, são, em essência, RNNs estruturados e numerados, o que os torna com duas vantagens:`O(N)`A memória de digitalização, bem como a seletiva de digitalização ⋅ são realizadas em treinamento em longo contexto ⋅ são recuperadas em 90% de qualidade do transformador ⋅ até 2026, a maioria dos laboratórios de fronteira estão treinando modelos híbridos de transformadores SSM + ⋅ Jamba, Samba) ⋅ recorrência não está morta, é um componente ⋅

## Entrega-o

- Não .`outputs/skill-architecture-picker.md` Esta habilidade será limitada, de acordo com a duração, o rendimento e o orçamento de treinamento, para uma nova estrutura de seleção de problemas de sequência.

## 练习

1. **简单。**De`code/main.py`- Não .`rnn_style`,把标量隐藏状态 换成长度为64的隐藏状态 矢量──重新测量──serial overhead 会随着隐藏状态维度 增长多少?
2. **中等。**Usar Python puro para realizar prefixo paralelo-suma (Hillis-Steele scan) ▽验证它在长度 1024 时产生与序列扫描相等数值输出──计算深度──
3. **困难。**Colocar a redução de estilo de atenção 移植 onto GPU 上的 PyTorch── com a sequência de 64 扫到 65,536,对两者计时──绘图并解释曲线形――

## 关键术语

| 术语 | 人们常说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Recurrence | “RNNs 是顺序的” | step `t` 依赖 step `t-1` 的计算方式，迫使执行沿时间轴串行进行。 |
| Serial depth | “图有多深” | 依赖操作的最长链；即使在无限硬件上也会限制 wall-clock。 |
| Attention | “让 Tokens 彼此查看” | Weighted sum `sum_j a_ij v_j`，其中 `a_ij` 来自位置 i 和 j 之间的相似度分数。 |
| Context window | “模型能看到多少” | 一个 Attention layer 可作为输入的位置数量；quadratic memory cost 在这里扩展。 |
| Inductive bias | “架构内置的假设” | 关于数据形态的先验；CNNs 假设 translation invariance，RNNs 假设 recency。 |
| State-space model | “背后有代数的 RNN” | 为通过结构化 state-space matrices 实现并行训练而参数化的 recurrence。 |
| Quadratic bottleneck | “为什么 context 这么昂贵” | Attention memory = 序列长度上的 `O(N²)`；Flash Attention 隐藏的是常数，而不是扩展规律。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Este artigo encerrou a recorrência na PNL dominante.
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)A atenção nasceu quando foi ligada ao RNN.
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) 原始 LSTM 论文, como registro。
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador de transformadores  Contestador  Contestador de transformador  Contestador  Contestador de transformador  Contestador  Contestador  Contestador  Contestador  Contestor
