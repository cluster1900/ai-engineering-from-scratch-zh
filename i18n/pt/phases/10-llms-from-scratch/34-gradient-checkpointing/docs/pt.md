# Gradiente de controlo e recomputação de ativação

> A retropropagação irá manter cada valor de ativação intermediário. Em parâmetros 70B e 128K, cada ranking pode ser ativado em até 3 TB.

**Type:** Build
**语言:**Python (com tocha de tocha)
**前置要求:**Fase 10 Lição 04 (Mini-GPT pré-treino), Fase 10 Lição 05 (Escalação e Distribuição)
**Time:** ~70 分钟

## 问题

                                                                                                                                                                                                                                                              `d`、Longo de sequência 为 `L`Batch para`B`De uma camada, é quase de cada camada.`12 * B * L * d`- Não.

Para o`d=8192, L=8192, B=1`, que está em BF16 下是800 MB/层── um modelo de 64 camadas do valor de ativação é de 51 GB, que ainda não multiplicado por microbatch tamanho, também ainda não adicionado atenção-softmax intermediários( por cabeça para`L^2`), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ), ),

É um sistema de revisão de padrões (ou recomputo de ativação) que permite a execução de uma nova função de controle de dados, que pode ser utilizada para obter o valor de 80 GB, mas o valor de ativação pode ser usado para ultrapassar os limites.

朴實實實時,checkpointing 簡易實實實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 簡易實時,checkpointing 實時,checkpointing 實時,checkpointing 實時, checkpointing 實時時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實時, 實

## 概念

### Retroceder  realmente precisa de quê

`output = layer(input)`❖ Retroceder 想要 `grad_input`和 `grad_params`Para os calcular, é preciso:

- `input`(Para cálculo em linha`grad_params = input.T @ grad_output`)
- Alguns activar direção número intermediário ((ReLU/GELU/softmax)

Passar para a frente 会在 autograd gráfico 中自动保存这些内容──每个 `tensor.retain_grad()`E cada um dos que precisam de sua entrada, manterá um citar.

### 朴素 Ponto de Controle completo

Desmantelar a rede.`N`个segmentos──forward 期间, apenas salvar *input*──de cada segmento 时后退 需要中间量时,重新运行该段的前行通过 来物化它们,然后再求导──

Demonstração: Transformador de 32 camadas 拆分32 个段,每个段1层──

- Memória:32 个 camadas de entrada ((小) em relação a 32 *(
- 额外计算: cada segmento 额外 1 次 前进,也就是总 前进 FLOPs 约增加 33%(因为 后退是 前进的 2x,完整步骤从 1 + 2 = 3 个单位变为 1 + 1 + 2 = 4 个单位) 

É o primeiro Chen et al. 2016                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `sqrt(L)`Em termos de memória e computação, para L=64, é 8 pontos de controlo.

### Controlos seletivos (Korthikanti 2022)

Não é o mesmo custo de todos os valores activados.`B*L*L*heads`,并随序列长度 *二次* 增长──FFN ativação oculta é `B*L*4d`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,

O ponto de verificação seletivo irá manter o custo de armazenamento baixo do valor ativo (projeções lineares, resíduos), apenas recalculando parte cara (attenção) ⋅ você usa muito poucas FLOPs (novas calculações), mas economiza memória (L^2) ⋅

Megatron-Core irá implementá-lo para recomputamento seletivo de ativação. A maioria dos cursos de treinamento de fronteira de 2024+ estão usando-o.

### Descarga

重新计算的替代方案:在前和后期之间把激活值传到CPU RAM──它需要PCIe带宽;当空带宽的收益高于重复化 成本时很有用──混合策略很常见: algumas camadas são ponto de verificação, outras são descarregadas──

FSDP2 vai descarregar  como um primeiro opção fornecer. Quando a GPU recebe memória  restrição, mas a transferência de CPU-GPU ainda tem o restante de tempo, descarregar apresentação muito bom.

### Modelo de custos de recomposição

Cada um`k`Ponto de verificação de nível, uma vez, todas.`L`层时,朴素 checkpointing 的一步一步 FLOPs:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

Usando checkpoint seletivo, você apenas recalcula o kernel de atenção, em vez de toda a camada:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Modelo de poupança de memória

Volume de ativação de cada camada:`A` `L`层, memória de ativação total:`L * A`- Não.

Ponto de controlo completo (segmento 1):`L * input_volume`(Para o transformador padrão 约为 `L * 1/10 A`O que é que é?`9 * L * A * 1/10`- Não.

Cada um`k`层 checkpoint 一次:保存 `L/k * A`, reajustar o segmento ativo`k-1`- A quantidade de níveis.

- Não .`k = sqrt(L)`时, memória e recomputo custo`sqrt(L)`缩放, é o melhor peso das camadas de custo uniforme.

### Que tempo não é o ponto de controlo

- Esta fase de oleodutos já está em voo, mas as camadas mais internas devem ser completadas.
- Se as primeiras e últimas camadas forem a principal fonte de cálculo da fase, não há muito tempo entre os transformadores.
- Já usamos kernels de atenção de FlashAttention: Flash já irá rapidamente recalcular softmax, portanto, o controle de nível de camada adicional 叠加收益很小──

### Padrões de implementação

1. **Function wrapper：**- Não .`torch.utils.checkpoint.checkpoint(fn, input)`Envolve um segmento.`input`, em retrospectiva , recalculando todos os outros conteúdos .

2. **Decorator-based：**O treinador decide em tempo de configuração quais segmentos são embalados.

3. **Manual explicit recompute：**Auto编写后转通,调用自定义的 `recompute_forward`, us save's input copiar para a frente。

O resultado funcional dado é o mesmo que o de um enrolador.

### Interacção com TP / PP / FP8

- **Tensor parallel：**As entradas de checkpoint  devem ser recolhidas ou rescatadas quando se recompõe; necessitam de processar os custos de comunicação
- **Pipeline parallel：**O típico modo é um ponto de controle para cada fase do pipeline, para que os microbatches de ordem inversa possam reutilizar a memória de ativação.
- **FP8 recompute：**Recomputar  Durante actualizar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       


```figure
activation-recompute
```

## Construí-lo

### 步骤 1: Modelo de brinquedo de segmentos

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### 步骤 2: precisa de todas as atividades de simples retrocesso

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### 步骤 3: Checkpoint-Every-k Memória

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### 步骤 4: Modelo de custo

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### 步骤 5: Estimador de memória

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### 步骤 6: Tamanho óptimo do segmento

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### 步骤 7: Decisão seletiva de ponto de controlo

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## Use-o

- **torch.utils.checkpoint**- Não .`from torch.utils.checkpoint import checkpoint`,PyTorch 中的规范包装──它包裹一个函数;只保存输入,然后倒后重新计算──
- **Megatron-Core activation recomputation**:支持 `selective`- Não.`full`和 `block`Modos: é a prática padrão de formação de fronteira de 2024+.
- **FSDP2 offload**: FSDP2 中中 `module.to_empty(device="cpu")`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `offload_policy`, vai colocar as ativações em fragmentos para a CPU, em vez de recomputar.
- **DeepSpeed ZeRO-Offload**Para otimizar os estados e ativar as CPUs, com checkpointing 互补──

## Entrega-o

本课会产出 `outputs/prompt-activation-recompute-policy.md`, é um prompt: recebe o seu modelo de configuração ((layeres、hidden、seq、batch) e memória de GPU disponível,并输出逐层 recompute policy ((não / seletivo / completo / offload) ]]

## 练习

1. 验证正确性──运行 `model_forward`+ `model_backward`(Ativações completas)`model_forward_checkpointed`+ `model_backward_checkpointed`(segmentos)  Os gradientes de parâmetros ▌ devem estar em conformidade com a precisão da máquina 

2. 扫描 tamanho do segmento `k`, de 1 a `L`◊ desenhar FLOP sobrehead 和 memória── encontrar curvas da curva──

3. 实现 seletivo checkpointing: salvar entrada de módulo de atenção, mas não conservar entre entre volume── para modelo de 32 camadas de seq=8192, medida em relação ao overhead FLOP de checkpointing de camada completa──

4. 添加脱载──把段输入 保存到一个模拟的 CPU buffer((((一个单独的列表)──将 PCIe bandwidth 作为字节/时间测量,并找出脱载与重计算之间的破解点──

5. Benchmark 一个真实 PyTorch transformador,分别使用和不使用 `torch.utils.checkpoint`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △                                                                                                                                                                        `torch.cuda.max_memory_allocated`) e tempo de passagem.

## 关键术语
| Term | 人们通常怎么说 | 它实际意味着什么 |
|------|----------------|----------------------|
| Gradient checkpointing | “通过重做 forward 节省 memory” | 只存储 segment inputs；在 backward 期间重新计算中间量，以获得支持 Gradient 的 tensors |
| Activation recomputation | “和 checkpointing 一样” | 同一技术在 HPC 语境下的名称 |
| Segment size (k) | “每个 checkpoint 包含多少层” | 其中间量被丢弃并一起 rematerialized 的层数 |
| Selective checkpointing | “Korthikanti 的技巧” | 只重新计算存储成本高的激活值（attention softmax）；保留低成本的部分 |
| Full checkpointing | “朴素版本” | 在每个 segment 中重新计算每层的中间量 |
| Block checkpointing | “Coarse-grained” | Checkpoint 整个 transformer blocks；粒度最大 |
| FLOP overhead | “compute 税” | 每 step 额外 FLOPs = (recompute FLOPs) / (fwd + bwd FLOPs)；朴素方案 33%，selective 方案 5% |
| Activation offload | “传到 CPU” | 在 forward->backward 之间把 activations 移到 CPU RAM；是 recompute 的替代方案 |
| sqrt-L rule | “经典最优解” | 对于 uniform-cost layers，最优 checkpoint spacing 是 sqrt(L) 层 |
| Attention-softmax volume | “O(L^2) 问题” | L^2 * heads * batch 个浮点数；在长 context 下主导 activation memory |

## 延伸阅读
- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174)-- inicialmente formalizado gradiente de controlo de pontos de vista
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198)-- recomputada seletiva de ativação e análise de custos formalizada
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645)--                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840)-- escala de descarga de ativação de baixo
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html)-- 标准 API
- [Megatron-Core activation recomputation documentation](https://docs.nvidia.com/nemo-framework/user-guide/latest/nemotoolkit/features/memory_optimizations.html)-- modos seletivos, completos e de bloqueio
