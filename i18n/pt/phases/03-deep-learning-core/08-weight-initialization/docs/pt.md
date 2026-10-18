# Peso Inicialização e treinamento estabilidade

> Iniciação errada, o treino não pode começar. Iniciação é uma forma de treino.

**Type:** Build
**Languages:** Python
**Prerequisites:** Lesson 03.04 (Activation Functions), Lesson 03.07 (Regularization)
**Time:** ~90 minutes

## Objectivo de aprendizagem
- 实现 zero、random、Xavier/Glorot 和 Kaiming/He inicialização 策略,并测量它们对50层中激活幅度的影响
- 推导为什么 Xavier init 使用 Var(w) = 2/(fan_in + fan_out), enquanto Kaiming 使用 Var(w) = 2/fan_in
- 演示零初始化的对称性 问题,并解释为什么仅靠随机尺度还不够
- 将正确的初始化 策略匹配到激活函数:sigmoid/tanh 使用 Xavier,ReLU/GELU 使用 Kaiming

## 问题
Colocar todos os pesos em zero. Todos os neurônios têm a mesma função, recebem o mesmo gradiente e atualizam de forma igual. Depois de 10.000 épocas, a sua camada oculta de 512 neurônios continua a ser apenas 512 cópias do mesmo neurônio.

Atividades vão explodir em toda a rede. Até a camada 10, o valor número alcança 1e15; até a camada 20, elas se desbordam para o infinito.

A partir da distribuição normal padrão, o início aleatório é válido em 3 níveis, até 50 níveis, o sinal se acumulará para zero ou explodirá para o infinito, dependendo da escala aleatória, seja pequena ou pequena.

A inicialização de peso é a decisão mais menos avaliada do Deep Learning. Arquitetura terá artigos. Os optimistas terão artigos. A inicialização geralmente só recebe um comentário. Mas se aqui estiver errado, tudo o resto não importa.

## 概念
### O problema da simetria

Uma camada em cada neurona tem a mesma estrutura: com pesos  multiplicando entradas, adicionando viés, ativação de aplicação. Se todos os pesos começam a partir do mesmo valor, cada neurona calcula a mesma saída. Durante a propagação de volta, cada neurona recebe o mesmo gradiente. Durante a fase de atualização, cada neurona muda a mesma quantidade.

Você está preso. A rede tem centenas de parâmetros, mas todos se movem em simultâneo. Isso é chamado de simetria, e a inicialização aleatória é um método violento para quebrar. Cada neurona começa em uma posição diferente no espaço de peso, por isso cada neurona aprende características diferentes.

Mas o acaso ainda não é suficiente. A escala de acaso decide se a rede pode treinar.

### Propagação de variações através de camadas

考虑一个具有风扇_in 个输入的单层:

```math
z = w_1 x_1 + w_2 x_2 + \cdots + w_n x_n
```

Se cada peso $w_i$Todas as variantes são diferentes.$\mathrm{Var}(w)$Distribuição e cada entrada.$x_i$De variação$\mathrm{Var}(x)$,则输出变量 为:

```math
\mathrm{Var}(z) = \text{fan}_{\text{in}} \cdot \mathrm{Var}(w) \cdot \mathrm{Var}(x)
```

Se $\mathrm{Var}(w) = 1$且 $\text{fan}_{\text{in}} = 512$, , então a variância de saída é a variância de entrada de 512 倍──经过 10 层:$512^{10} = 1.2 \times 10^{27}$O teu sinal já explodiu.

Se $\mathrm{Var}(w) = 0.001$, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,$0.001 \cdot 512 = 0.512$缩小──经过 10层:$0.512^{10} = 0.00013$O teu sinal desapareceu.

目标: escolher $\mathrm{Var}(w)$, fazer $\mathrm{Var}(z) = \mathrm{Var}(x)$A magnitude do sinal permanece constante entre os níveis.

### Xavier/Glorot Inicialização

Glorot e Bengio (2010) 推导了适用于 sigmoid 和 tanh ativações 的解──为了在前和后的通过 中都保持变异恒定:

```math
\mathrm{Var}(w) = \frac{2}{\text{fan}_{\text{in}} + \text{fan}_{\text{out}}}
```

实践中,pesos de:

```math
w \sim \text{Uniform}(-\text{limit}, \text{limit}) \quad \text{其中 } \text{limit} = \sqrt{\frac{6}{\text{fan}_{\text{in}} + \text{fan}_{\text{out}}}}
```

Ou:

```math
w \sim \text{Normal}\left(0, \sqrt{\frac{2}{\text{fan}_{\text{in}} + \text{fan}_{\text{out}}}}\right)
```

Isto é eficaz, porque a sigmoide e o tanh estão perto de zero, e as ativas positivas após a inicialização estão bem localizadas nesta região.

### Inicialização Kaiming/He

ReLU vai matar metade das saídas (todas as negativas são transformadas em zero) ⋅ válido fan_in ⋅ redução, porque em média para ver metade das entradas é colocada em zero. Xavier init ⋅ não considera isso - ele subestimou a variação necessária.

He et al. (2015) 调整了公式:

```math
\mathrm{Var}(w) = \frac{2}{\text{fan}_{\text{in}}}
```

Pesos de distribuição de:

```math
w \sim \text{Normal}\left(0, \sqrt{\frac{2}{\text{fan}_{\text{in}}}}\right)
```

O número 2 utiliza para compensar a ReLU vai colocar metade das ativas em zero efeito. Sem ele, o sinal cada camada vai diminuir cerca de 0,5 vezes.$0.5^{50} = 8.8 \times 10^{-16}$❖ A caiming init pode prevenir esta situação¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

### Inicialização do transformador

GPT-2 introduziu outro modelo. As conexões residuais vão aumentar a saída de cada subcamada para a sua entrada:

```math
x = x + \text{sublayer}(x)
```

Cada vez que a mudança aumenta a variação.$N$个 residuais de camadas, variação$N$ 成比例增长──GPT-2 会将残層の重量按 $1/\sqrt{2N}$缩放, entre eles $N$É um nível de número. Isso pode manter a magnitude de sinal acumulado.

Llama 3 ((405B parâmetros,126 camadas) utilizou um esquema semelhante.

```mermaid
flowchart TD
    subgraph "Zero Init"
        Z1["Layer 1<br/>All weights = 0"] --> Z2["Layer 2<br/>All neurons identical"]
        Z2 --> Z3["Layer 3<br/>Still identical"]
        Z3 --> ZR["Result: 1 effective neuron<br/>regardless of width"]
    end

    subgraph "Xavier Init"
        X1["Layer 1<br/>Var = 2/(fan_in+fan_out)"] --> X2["Layer 2<br/>Signal stable"]
        X2 --> X3["Layer 50<br/>Signal stable"]
        X3 --> XR["Result: Trains with<br/>sigmoid/tanh"]
    end

    subgraph "Kaiming Init"
        K1["Layer 1<br/>Var = 2/fan_in"] --> K2["Layer 2<br/>Signal stable"]
        K2 --> K3["Layer 50<br/>Signal stable"]
        K3 --> KR["Result: Trains with<br/>ReLU/GELU"]
    end
```

###  através de 50 níveis de magnitude de ativação

```mermaid
graph LR
    subgraph "Mean Activation Magnitude"
        direction LR
        L1["Layer 1"] --> L10["Layer 10"] --> L25["Layer 25"] --> L50["Layer 50"]
    end

    subgraph "Results"
        R1["Random N(0,1): EXPLODES by layer 5"]
        R2["Random N(0,0.01): Vanishes by layer 10"]
        R3["Xavier + Sigmoid: ~1.0 at layer 50"]
        R4["Kaiming + ReLU: ~1.0 at layer 50"]
    end
```

### Escolhendo a intenção certa

```mermaid
flowchart TD
    Start["What activation?"] --> Act{"Activation type?"}

    Act -->|"Sigmoid / Tanh"| Xavier["Xavier/Glorot<br/>Var = 2/(fan_in + fan_out)"]
    Act -->|"ReLU / Leaky ReLU"| Kaiming["Kaiming/He<br/>Var = 2/fan_in"]
    Act -->|"GELU / Swish"| Kaiming2["Kaiming/He<br/>(same as ReLU)"]
    Act -->|"Transformer residual"| GPT["Scale by 1/sqrt(2N)<br/>N = num layers"]

    Xavier --> Check["Verify: activation magnitudes<br/>stay between 0.5 and 2.0<br/>through all layers"]
    Kaiming --> Check
    Kaiming2 --> Check
    GPT --> Check
```


```figure
weight-init-variance
```

## Construí-lo
### 步骤 1: Estratégias de inicialização

Inicialmente, a matriz de peso é de quatro formas.

```python
import math
import random


def zero_init(fan_in, fan_out):
    return [[0.0 for _ in range(fan_in)] for _ in range(fan_out)]


def random_init(fan_in, fan_out, scale=1.0):
    return [[random.gauss(0, scale) for _ in range(fan_in)] for _ in range(fan_out)]


def xavier_init(fan_in, fan_out):
    std = math.sqrt(2.0 / (fan_in + fan_out))
    return [[random.gauss(0, std) for _ in range(fan_in)] for _ in range(fan_out)]


def kaiming_init(fan_in, fan_out):
    std = math.sqrt(2.0 / fan_in)
    return [[random.gauss(0, std) for _ in range(fan_in)] for _ in range(fan_out)]
```

### 步骤 2: Funções de ativação

Precisamos de sigmoid, tanh e ReLU, para fazer testes com cada estratégia inicial e sua ativação prevista.

```python
def sigmoid(x):
    x = max(-500, min(500, x))
    return 1.0 / (1.0 + math.exp(-x))


def tanh_act(x):
    return math.tanh(x)


def relu(x):
    return max(0.0, x)
```

### 步骤 3: Passagem para a frente através de 50 camadas

让随机数据 通过一个深度网络,并测量每一层的平均激活大小──

```python
def forward_deep(init_fn, activation_fn, n_layers=50, width=64, n_samples=100):
    random.seed(42)
    layer_magnitudes = []

    inputs = [[random.gauss(0, 1) for _ in range(width)] for _ in range(n_samples)]

    for layer_idx in range(n_layers):
        weights = init_fn(width, width)
        biases = [0.0] * width

        new_inputs = []
        for sample in inputs:
            output = []
            for neuron_idx in range(width):
                z = sum(weights[neuron_idx][j] * sample[j] for j in range(width)) + biases[neuron_idx]
                output.append(activation_fn(z))
            new_inputs.append(output)
        inputs = new_inputs

        magnitudes = []
        for sample in inputs:
            magnitudes.append(sum(abs(v) for v in sample) / width)
        mean_mag = sum(magnitudes) / len(magnitudes)
        layer_magnitudes.append(mean_mag)

    return layer_magnitudes
```

### 步骤 4: O Experimento

运行所有组合:zero init、random N(0,1)、random N(0,0.01)、Xavier com sigmoid、Xavier com tanh、Kaiming com ReLU──打印关键层的大小──

```python
def run_experiment():
    configs = [
        ("Zero init + Sigmoid", lambda fi, fo: zero_init(fi, fo), sigmoid),
        ("Random N(0,1) + ReLU", lambda fi, fo: random_init(fi, fo, 1.0), relu),
        ("Random N(0,0.01) + ReLU", lambda fi, fo: random_init(fi, fo, 0.01), relu),
        ("Xavier + Sigmoid", xavier_init, sigmoid),
        ("Xavier + Tanh", xavier_init, tanh_act),
        ("Kaiming + ReLU", kaiming_init, relu),
    ]

    print(f"{'Strategy':<30} {'L1':>10} {'L5':>10} {'L10':>10} {'L25':>10} {'L50':>10}")
    print("-" * 80)

    for name, init_fn, act_fn in configs:
        mags = forward_deep(init_fn, act_fn)
        row = f"{name:<30}"
        for idx in [0, 4, 9, 24, 49]:
            val = mags[idx]
            if val > 1e6:
                row += f" {'EXPLODED':>10}"
            elif val < 1e-6:
                row += f" {'VANISHED':>10}"
            else:
                row += f" {val:>10.4f}"
        print(row)
```

### 步骤 5: Demonstração de Simetria

- Não. - Não.

```python
def symmetry_demo():
    random.seed(42)
    weights = zero_init(2, 4)
    biases = [0.0] * 4

    inputs = [0.5, -0.3]
    outputs = []
    for neuron_idx in range(4):
        z = sum(weights[neuron_idx][j] * inputs[j] for j in range(2)) + biases[neuron_idx]
        outputs.append(sigmoid(z))

    print("\nSymmetry Demo (4 neurons, zero init):")
    for i, out in enumerate(outputs):
        print(f"  Neuron {i}: output = {out:.6f}")
    all_same = all(abs(outputs[i] - outputs[0]) < 1e-10 for i in range(len(outputs)))
    print(f"  All identical: {all_same}")
    print(f"  Effective parameters: 1 (not {len(weights) * len(weights[0])})")
```

### 步骤 6: Relatório de Magnitude Layer-by-Layer

Magnitúdias de ativação de impressão em 50 layers

```python
def magnitude_report(name, magnitudes):
    print(f"\n{name}:")
    for i, mag in enumerate(magnitudes):
        if i % 5 == 0 or i == len(magnitudes) - 1:
            if mag > 1e6:
                bar = "X" * 50 + " EXPLODED"
            elif mag < 1e-6:
                bar = "." + " VANISHED"
            else:
                bar_len = min(50, max(1, int(mag * 10)))
                bar = "#" * bar_len
            print(f"  Layer {i+1:3d}: {bar} ({mag:.6f})")
```

## Use-o
PyTorch vai fornecer estes como funções embutidas:

```python
import torch
import torch.nn as nn

layer = nn.Linear(512, 256)

nn.init.xavier_uniform_(layer.weight)
nn.init.xavier_normal_(layer.weight)

nn.init.kaiming_uniform_(layer.weight, nonlinearity='relu')
nn.init.kaiming_normal_(layer.weight, nonlinearity='relu')

nn.init.zeros_(layer.bias)
```

Quando você está a usar`nn.Linear(512, 256)`时,PyTorch 默认使用Kaiming uniform initialisation──这就是为什么大多数简单网络 只是工作 - PyTorch 已经做出正确选择──但当你构建定制架构时,或者深入到超过20层时,你需要理解正在发生什么,并且可能需要覆盖默认设置──

Para os transformadores, os modelos de HuggingFace normalmente estão entre eles.`_init_weights`方法中处理初始化──GPT-2 的实现会按 $1/\sqrt{N}$缩放残投.  Se você começar a construir um transformador a partir de zero, precisa adicionar isso.

## Entrega-o
本课会产出:
- `outputs/prompt-init-strategy.md`-- um uso de diagnóstico de peso inicialização  problema并推正确策略的提示

## 练习
1. 添加 LeCun inicialização$\mathrm{Var} = 1/\text{fan}_{\text{in}}$, , , para a ativação SELU 設計) ・运行 50-layer experiment, usando LeCun init + tanh,并与Xavier + tanh对比──

2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              $1/\sqrt{2N}$ Seja em 50 níveis, mas sem escala, a magnitude residual pode aumentar muito rapidamente.

3. Crear uma função de "controle de saúde inicial", dimensionar a camada da rede de recepção e tipo de ativação, e depois sugerir a inicialização correta, e no momento inicial, causar problemas e dar aviso.

4. Utilização $\text{fan} _{\text{in}} = 16$Com$\text{fan} _{\text{in}} = 1024$运行实验──Xavier 和 Kaiming 会适配 fan_in, mas random init 不会── mostrar como a diferença entre as obras  e as rupturas                                                                                                                                                                                                                                          

5. 实现 ortogonalização inicial (realizar)                                                                                                                                                                                                                                                          

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Weight initialization | “随机设置 starting weights” | 选择 initial weight values 的策略，它决定一个 network 是否有可能训练 |
| Symmetry breaking | “让 neurons 变得不同” | 使用 random initialization 确保 neurons 学习不同 features，而不是计算完全相同的函数 |
| Fan-in | “一个 neuron 的 inputs 数量” | incoming connections 的数量，它决定 input variance 如何在 weighted sum 中累积 |
| Fan-out | “一个 neuron 的 outputs 数量” | outgoing connections 的数量，与在 Backpropagation 期间维持 Gradient variance 有关 |
| Xavier/Glorot init | “sigmoid initialization” | $\mathrm{Var}(w) = 2/(\text{fan} _{\text{in}} + \text{fan} _{\text{out}})$，旨在通过 sigmoid 和 tanh activations 保持 variance |
| Kaiming/He init | “ReLU initialization” | $\mathrm{Var}(w) = 2/\text{fan}_{\text{in}}$，考虑了 ReLU 会将一半 activations 置零 |
| Variance propagation | “signals 如何在 layers 中增长或缩小” | 基于 weight scale，逐层分析 activation variance 如何变化的数学分析 |
| Residual scaling | “GPT-2 的 init trick” | 将 residual connection weights 按 $1/\sqrt{2N}$ 缩放，以防止 variance 在 $N$ 个 transformer layers 中增长 |
| Dead network | “什么都训练不了” | 一个因 initialization 不佳而导致所有 Gradients 为 zero 或所有 activations 饱和的 network |
| Exploding activations | “数值走向 infinity” | 当 weight variance 过高时，activation magnitudes 会在 layers 中指数级增长 |

## 延伸阅读
- Glorot & Bengio, "Compreender a dificuldade de treinar redes neurais de feedforward profundas" (2010) -- 原始 Xavier inicialização 论文,包含变化分析
- He et al., "Diving Deep into Rectifiers" (2015) -- introduziu para redes ReLU a inicialização de Kaiming
- Radford et al., "Modelos de Língua são Aprendizes Multitareais Não Supervisionados" (2019) -- GPT-2 论文, incluindo inicialização de escala residual
- Mishkin & Matas, "All You Need is a Good Init" (2016) -- inicialização de unidade-variância de camada-seqüencial, um método de experiência alternativa
