# Número de valores estabilização

> O ponto flutuante é um extrato de fuga. Ele vai morder-te durante o treino, e não perceberás.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## Objectivo de aprendizagem

- Utilize o truque de subtração máxima  realçar o valor numérico estável softmax 和 log-sum-exp
- Identificação de ponto flutuante  cálculo de sobrefluxo, subfluxo e cancelamento catastrófico
- Utilize diferenças finitas centradas e gradientes analíticos e gradientes numéricos
- Explicar por que treinar bfloat16 优于 float16, bem como a escalação de perdas  como prevenir o baixo fluxo gradiente

## 问题

Seu modelo treinou três horas, depois Loss transformou-se em NaN... você adicionou uma letra de texto...`inf`Até o 9.002o, cada gradão é`nan`O treino já morreu.

Ou: seu treinamento de modelo foi concluído, mas a precisão é inferior a 2% do que o artigo afirma. Você verificou tudo.

Ou: você desde zero realiza perda de entropia cruzada.`inf`- O fluxo de água é muito mais lento.`exp(100)`Mas o que é que é que é isso?

A estabilidade numérica não é um problema teórico. Ele determina se um treinamento é bem-sucedido ou falha.

## 概念

### IEEE 754: Computador como armazenar números

计算机根据 IEEE 754 标准将实数存储为浮点值──一个浮点 有三部分:sign bit、元和 mantissa(significand)──

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

mantissa decide precisão (((ai quant quantity valid numer) ⋅ exponente decide range (((um número pode ter mais ou mais) ⋅

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32  dá-lhe cerca de 7 bits de precisão de produção. Isto significa que pode distinguir entre 1.0000001 e 1.0000002, mas não pode distinguir entre 1.00000001 e 1.00000002 ∙ Depois de mais de 7 bits, tudo é ruído redondeado ∙

float16  dá-lhe cerca de 3 bits de precisão― o máximo que pode ser representado é 65,504― para ML, esse alcance é perturbador, pois logits、 gradientes 和 ativações  frequentemente excederão esse valor―

bfloat16 é a resposta do Google para a questão do alcance do float16 ⋅. É um exponente de 8 bits semelhante ao float32 ⋅.

### Por que 0,1 + 0,2 ! = 0,3

Número 0.1 无法在二进制浮点中精确表示──在基 2 中,它是一个循环小数:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

Float32 irá cortá-lo em 23 bits de mantissa. O valor do armazenamento é de cerca de 0,100000001490116 . Da mesma forma, 0,2  armazenamento é de cerca de 0,200000002980232 .

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

Isto é muito importante para o ML, porque:

1. - Como ?`if loss < threshold`Tal perda pode dar respostas erradas.
2. 累积许多小值 (000 步的渐进更新) vai desviar-se da realidade e
3. Se usá-lo`==`Comparar os testes de flutuação, de cheques e de reprodução

修复方法: Nunca mais usem `==`Comparar flutuantes.`abs(a - b) < epsilon`Ou `math.isclose()`- Não.

### Cancellação catastrófica

Quando você reduzir dois pontos flutuantes quase iguais, num número de horas, os números válidos se resistem, o restante é elevado para alto nível de ruído redondeado.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

Isto significa que uma vez que a redução produz um erro relativo de 19%...

- Utilize data mean value calculação:当 E[x] 很大时计算 `E[x^2] - E[x]^2`
- Relativamente às probabilidades de logar de quase duas
- Utilize过小 epsilon  calcular gradientes de diferença finita

修复方法:重排公式, evitar a diminuição de dois números muito grandes e quase semelhantes.

### Flow e Flow

O fluxo excessivo  aconteceu em resultado muito grande, não pode ser expresso quando.

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`Função é o fluxo de fluxo em ML  principal fonte:

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

`log()`Função vai encontrar outro problema:

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

Em meio ao ML,`exp()`Aparece no cálculo de softmax, sigmoide e probabilidade.`log()`Agora, a entropia cruzada, as probabilidades de log e a divergência KL, não há truque certo.`log(exp(x))`O grupo é o "Ré-Zé".

### Trilha de Log-Sum-Exp

直接计算 `log(sum(exp(x_i)))`É muito perigoso em termos de valor.`x_i`Muito grande.`exp(x_i)`Vai sobrecarregar-se.`x_i`Tão muito negativo, cada um.`exp(x_i)`A cidade vai desabrochar para zero.`log(0)`Sim `-inf`- Não.

Esse truque: em busca de exponente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

Por que é eficaz: reduzir`max(x)`后, o maior exponente é `exp(0) = 1`△ não é possível ocorrer sobreflow― △ em busca e em busca pelo menos um item é 1, portanto o total e pelo menos é 1, enquanto ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de 1, e ∞ é um elemento de uma ordem de ∞ é um ∞`log(1) = 0`Não é possível.`-inf`- Não.

prova:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

Que`c = max(x)`O fluxo excesivo é eliminado.

Este truque é visto em todos os lugares do ML:
- Normalização de Softmax
- Perda de entropia cruzada 计算
- Modelos de sequência 中的 log-probability 求和
- Mistura de Gaussianos
- Inferência variável

### Por que Softmax precisa de Trick de Subtração Max?

Softmax vai fazer logits 转换为概率:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

Não há truque, o logiteiro vai levar ao desbordamento.

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

Use este truque, reduzir o máximo ((x) = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

A probabilidade é a mesma. O cálculo é seguro.

### NaN 和 Inf: controlo e prevenção

`nan`Não é um número.`inf`(infinito) 会像病毒一样在计算中传播── Gradiente atualização `nan`Vai fazer o peso mudar .`nan`, para que cada saída posterior se torne`nan`O treino vai morrer dentro de um passo.

`inf`如何出现:
- Para um grande número real executar`exp()`
- Além de zero:`1.0 / 0.0`
- acumulações 中的 `float32`sobreposição

`nan`如何出现:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- Para a execução negativa`sqrt()`
- Para a execução negativa`log()`
- Qualquer coisa envolvida`nan`de aritmética

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

prevenção estratégica:

1. - Câmara .`exp()`É um problema.`exp(clamp(x, -80, 80))`
2. 给代号加 epsilon:`x / (y + 1e-8)`
3. Em`log()`- Não .`log(x + 1e-8)`
4. Utilize estabilmente implementar (log-sum-exp, softmax estável)
5. Utilize Gradient clipping  prevenir pesos  explosão
6. 调试时在每次前进通过后检查  调试时在每次前进通过后检查 `nan`- Não .`inf`

### Verificação de Gradientes Numéricos

Gradientes analíticos (de Backpropagation) pode haver bugs.

Diferença centralizada 公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

É o O (h^2) 精度, muito melhor que a diferença para a frente `(f(x+h) - f(x)) / h`,后者只有 O (h) ⋅

选择 h:太大则近似不准确──太小则 灾难性取消 会毁掉结果──`h = 1e-5`Até`1e-7`É muito comum.

检查方式: cálculo diferença relativa entre gradientes analíticos e numéricos 

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- Relativo_erro < 1e-7: perfeito, Gradiente 正确
- Relativo_error < 1e-5:
- Relativo_error > 1e-3: há algo errado
- relative_error > 1: Gradiente 完全错误

Cada vez que se realiza uma nova camada ou Função de Perda, temos que verificar os gradientes.`torch.autograd.gradcheck()`- Não.

### Treinamento Misto de Precisão

现代 GPUs têm hardware especial ((Tensor Cores), pode ser comparado a float32 快 2-8 倍地计算 float16 Matrix multiplications。 Treinamento de precisão mistura utilizou este ponto:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

纯浮16 训练问题:gradients 往往非常小(1e-8 或更小) ――Float16 会把低于约6e-8 的任何值下流为零――tudo modelo vai parar de aprender, pois todas as atualizações de gradientes são zero――

修复方法是 perda de escala:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

Dinâmica de perda de escala 会自动调整尺度因子──从一个大值(65536)开始──如果梯度过成 `inf`Se N 步 não se sobrecarregar, aumenta-se.

### Bfloat16 vs. Float16: Por que Bfloat16 Em treinamento

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

float16 精度更高(10 mantissa bits vs 7),但范围有限(最大约65,504);;bfloat16 精度较低,但范围与float32 相同(最大约3.4e38);;

对于训练 Neural Network:

- Ativações e logitos em períodos de treino  frequentemente superiores a 65.504 ∼ float16 会溢出; bfloat16 可处理──
- float16  necessita de perda de escala, mas bfloat16 geralmente não precisa, pois sua extensão abrange o espectro de magnitude gradiente.
- bfloat16 é o simples corte do float32: perder o baixo 16 de mantissa.

float16 更适合推断,此时数值有界且精度更重要──bfloat16 更适合训练,此时范围更重要──这就是TPUs 和现代NVIDIA GPUs(A100、H100) 原生支持bfloat16的原因──

### Classificação de gradientes

Gradientes explosivos ocorrem em gradientes através de muitos níveis de crescimento de índice de tempo (RNNs, redes profundas e transformadores) ⋅ um Gradiente muito grande pode destruir todos os pesos em um passo ⋅

两种剪辑:

**Clip by value：**Clampe independente Cada elemento gradiente

```
grad = clamp(grad, -max_val, max_val)
```

简单,但可能改变 Gradient Vector's direction──

**Clip by norm：**缩放整个渐变向,使其规范不超过值──

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

Mantém o Gradiente em direcção.`torch.nn.utils.clip_grad_norm_()`O que fazer... é uma escolha padrão.

典型值:transformers 使用 `max_norm=1.0`,RL utiliza `max_norm=0.5`, redes mais simples usar `max_norm=5.0`- Não.

O corte de gradiente não é um hack. É um mecanismo de segurança.

### Normalização camadas  como um número de valores estabilizadores

Normalização de lote, normalização de camada e normalização de RMS são normalmente introduzidos para ajudar a treinar os reguladores de recepção.

 sem normalização, a ativação irá aumentar ou diminuir em níveis de índice:

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

Normalização 会在每一层重新居中并重新缩放激活:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`(normalmente para 1e-5) irá em todas as atividades estar simultaneamente a impedir a eliminação de zero.`gamma`和 `beta`Deixe a rede recuperar qualquer escala que precise.

Isso permitirá que o valor do centro da rede permaneça dentro do limite de segurança do valor numérico, evitando tanto o desbordamento do centro da passagem avançada quanto a explosão gradual do centro da passagem retrógrada.

### 常见 ML Número de valores Bug

**Bug：Loss 在几个 epochs 后变成 NaN。**
原因:logits 变得太大,softmax overflow 了──或学习率 太高,重量发散了──
修复: usar softmax estável ((max subtração), reduzir a taxa de aprendizagem, incluir o clipping gradiente。

**Bug：Loss 卡在 log(num_classes)。**
原因: modelo de saída aproxima-se de probabilidades uniformes. Geralmente significa que os gradientes estão desaparecendo, ou modelo completamente sem aprendizagem.
修复: inspection data labels 是否正确,校验 Loss Function, inspection dead ReLUs──

**Bug：Validation accuracy 比预期低 1-3%。**
原因:precisão mista  não há escalagem adequada de perda。
修复: activar a escala de perda dinâmica, ou trocar para bfloat16。

**Bug：某些 layers 的 Gradient norms 是 0.0。**
原因: neurônios mortos da ReLU (((所有输入为负), ou flutuar16 subfluxo。
修复: usar LeakyReLU ou GELU, usar escalação gradiente, inspecção de inicialização de peso。

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因: não-determinista ordem de acumulação de pontos flutuantes。 GPU reduções paralelas em diferentes hardware em diferentes ordens de procura e, enquanto a adição de pontos flutuantes não satisfaz o código de combinação。
修复: aceitar小差异(1e-6), ou definir `torch.use_deterministic_algorithms(True)`Não aceita a perda de velocidade.

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
原因: logits brutos são transmitidos diretamente `exp()`Não usamos o truque de subtração máxima.
修复: usar `torch.nn.functional.log_softmax()`, que realizou log-sum-explication internamente.

**Bug：从 float32 切换到 float16 后训练发散。**
原因:float16 无法表示低于 6e-8 的渐进大小,也无法表示高于 65,504 的激活──
修复:使用带损失尺度的混合精度(AMP),或改用 bfloat16。


```figure
logsumexp-stability
```

## Construí-lo

### 步骤 1: demonstração de ponto flutuante 精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### 步骤 2: alcançar naívo vs estável softmax

```python
import math

def softmax_naive(logits):
    exps = [math.exp(z) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def softmax_stable(logits):
    max_logit = max(logits)
    exps = [math.exp(z - max_logit) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

safe_logits = [2.0, 1.0, 0.1]
print(f"Naive:  {softmax_naive(safe_logits)}")
print(f"Stable: {softmax_stable(safe_logits)}")

dangerous_logits = [100.0, 101.0, 102.0]
print(f"Stable: {softmax_stable(dangerous_logits)}")
# softmax_naive(dangerous_logits) would return [nan, nan, nan]
```

### 步骤 3: Realizar log-sum-exp estável

```python
def logsumexp_naive(values):
    return math.log(sum(math.exp(v) for v in values))

def logsumexp_stable(values):
    c = max(values)
    return c + math.log(sum(math.exp(v - c) for v in values))

safe = [1.0, 2.0, 3.0]
print(f"Naive:  {logsumexp_naive(safe):.6f}")
print(f"Stable: {logsumexp_stable(safe):.6f}")

large = [500.0, 501.0, 502.0]
print(f"Stable: {logsumexp_stable(large):.6f}")
# logsumexp_naive(large) returns inf
```

### 步骤 4: alcançar uma entropia cruzada estável

```python
def cross_entropy_naive(true_class, logits):
    probs = softmax_naive(logits)
    return -math.log(probs[true_class])

def cross_entropy_stable(true_class, logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = math.log(sum(math.exp(s) for s in shifted))
    log_prob = shifted[true_class] - log_sum_exp
    return -log_prob

logits = [2.0, 5.0, 1.0]
true_class = 1
print(f"Naive:  {cross_entropy_naive(true_class, logits):.6f}")
print(f"Stable: {cross_entropy_stable(true_class, logits):.6f}")
```

### 步骤 5: Verificação de gradientes

```python
def numerical_gradient(f, x, h=1e-5):
    grad = []
    for i in range(len(x)):
        x_plus = x[:]
        x_minus = x[:]
        x_plus[i] += h
        x_minus[i] -= h
        grad.append((f(x_plus) - f(x_minus)) / (2 * h))
    return grad

def check_gradient(analytical, numerical, tolerance=1e-5):
    for i, (a, n) in enumerate(zip(analytical, numerical)):
        denom = max(abs(a), abs(n), 1e-8)
        rel_error = abs(a - n) / denom
        status = "OK" if rel_error < tolerance else "FAIL"
        print(f"  param {i}: analytical={a:.8f} numerical={n:.8f} "
              f"rel_error={rel_error:.2e} [{status}]")

def f(params):
    x, y = params
    return x**2 + 3*x*y + y**3

def f_grad(params):
    x, y = params
    return [2*x + 3*y, 3*x + 3*y**2]

point = [2.0, 1.0]
analytical = f_grad(point)
numerical = numerical_gradient(f, point)
check_gradient(analytical, numerical)
```

## Use-o

### Precision mixada 模拟

```python
import struct

def float32_to_float16_round(x):
    packed = struct.pack('f', x)
    f32 = struct.unpack('f', packed)[0]
    packed16 = struct.pack('e', f32)
    return struct.unpack('e', packed16)[0]

def simulate_bfloat16(x):
    packed = struct.pack('f', x)
    as_int = int.from_bytes(packed, 'little')
    truncated = as_int & 0xFFFF0000
    repacked = truncated.to_bytes(4, 'little')
    return struct.unpack('f', repacked)[0]
```

### Clipagem gradual

```python
def clip_by_norm(gradients, max_norm):
    total_norm = math.sqrt(sum(g**2 for g in gradients))
    if total_norm > max_norm:
        scale = max_norm / total_norm
        return [g * scale for g in gradients]
    return gradients

grads = [10.0, 20.0, 30.0]
clipped = clip_by_norm(grads, max_norm=5.0)
print(f"Original norm: {math.sqrt(sum(g**2 for g in grads)):.2f}")
print(f"Clipped norm:  {math.sqrt(sum(g**2 for g in clipped)):.2f}")
print(f"Direction preserved: {[c/clipped[0] for c in clipped]} == {[g/grads[0] for g in grads]}")
```

### Detecção de NaN/Inf

```python
def check_tensor(name, values):
    has_nan = any(math.isnan(v) for v in values)
    has_inf = any(math.isinf(v) for v in values)
    if has_nan or has_inf:
        print(f"WARNING {name}: nan={has_nan} inf={has_inf}")
        return False
    return True

check_tensor("good", [1.0, 2.0, 3.0])
check_tensor("bad",  [1.0, float('nan'), 3.0])
check_tensor("ugly", [1.0, float('inf'), 3.0])
```

完整实现见 `code/numerical.py`, entre os quais demonstraram todos os casos de borda.

## Entrega-o

本课会产出:
- `code/numerical.py`, contém softmax estável, log-sum-exp, cross-entropy, verificação de gradientes e simulação de precisão mista
- `outputs/prompt-numerical-debugger.md`, para o diagnóstico de treinamento NaN/Inf e valores

Estes estáveis serão realizados na fase 3 da construção de um ciclo de treinamento, bem como na fase 4 da realização de mecanismos de atenção.

## 练习

1. **Catastrophic cancellation。**Use float32 中的天真公式 `E[x^2] - E[x]^2`計算 [1000000.0, 1000001.0, 1000002.0] 的方差──然后使用威尔福德的在线算法 计算──将误差与真实方差──0.6667) 相比──

2. **Precision hunt。**Em Python encontrar o mínimo de float32  valor`x`, fazer `1.0 + x == 1.0`É a máquina que faz a epsilon.`numpy.finfo(numpy.float32).eps`- Não.

3. **Log-sum-exp edge cases。**Use o seguinte:`logsumexp_stable`Função: a) 所有值相等, b) 一个值远大于其他值, c) 所有值都非常负-1000) 验证它在天真版本 失败的地方给出正确结果──

4. **Gradient checking a Neural Network layer。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `y = Wx + b` e seu passo analítico para trás── utilização `numerical_gradient`校验 3x2 massa matriz 校验 3x2 massa matriz 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校验 3x2 masa matrix 校校 校验 3x2 masa matrix 校 校 校验 3x2 masa matrix 校 校 校 校 校 校 校 校 校 校 校 校 校 校 校 校 校

5. **Loss scaling experiment。**模拟 float16 训练:创建范围在 [1e-9, 1e-3] 内的随机梯度,转换为 float16,并测量有多少比例变成零――然后应用损失规模(乘以 1024),转换为 float16,再规模回,并再次测量零比例――

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| IEEE 754 | “float 标准” | 定义 binary floating point formats、rounding rules 和 special values（inf、nan）的国际标准。每个现代 CPU 和 GPU 都实现了它。 |
| Machine epsilon | “精度极限” | 在给定 float format 中，使 1.0 + e != 1.0 成立的最小值 e。对于 float32，它约为 1.19e-7。 |
| Catastrophic cancellation | “减法导致的精度损失” | 相减两个几乎相等的 floating point 数时，有效数字相互抵消，rounding noise 主导结果。 |
| Overflow | “数字太大” | 结果超过最大可表示值并变成 inf。exp(89) 会使 float32 overflow。 |
| Underflow | “数字太小” | 结果比最小可表示正数还接近零，并变成 0.0。exp(-104) 会使 float32 underflow。 |
| Log-sum-exp trick | “先减去最大值” | 通过提出 exp(max(x)) 来计算 log(sum(exp(x)))，以防止 overflow 和 underflow。用于 softmax、cross-entropy 和 log-probability math。 |
| Stable softmax | “不会爆炸的 softmax” | 在 exponentiating 之前减去 max(logits)。结果在数值上相同，且不可能 overflow。 |
| Gradient checking | “校验你的 Backpropagation” | 将 Backpropagation 得到的 analytical gradients 与 finite differences 得到的 numerical gradients 比较，以捕获实现 bug。 |
| Mixed precision | “Float16 forward，float32 backward” | 对 speed-critical operations 使用低精度 floats，对 numerically sensitive operations 使用高精度 floats。典型提速为 2-3x。 |
| Loss scaling | “防止 Gradient underflow” | 在 Backpropagation 前将 Loss 乘以一个大常数，使 gradients 保持在 float16 可表示范围内，然后在 weight updates 前除以同一个常数。 |
| bfloat16 | “Brain floating point” | Google 的 16-bit format，包含 8 个 exponent bits（与 float32 范围相同）和 7 个 mantissa bits（精度低于 float16）。训练时更常用。 |
| Gradient clipping | “限制 Gradient norm” | 缩放 Gradient Vector，使其 norm 不超过阈值。防止 exploding gradients 毁掉 weights。 |
| NaN | “Not a Number” | 来自未定义操作（0/0、inf-inf、sqrt(-1)）的特殊 float value。会传播到所有后续 arithmetic。 |
| Inf | “Infinity” | 来自 overflow 或除以零的特殊 float value。可以组合产生 NaN（inf - inf、inf * 0）。 |
| Numerical gradient | “暴力求导” | 通过计算 f(x+h) 和 f(x-h)，再除以 2h 来近似 derivative。很慢，但用于校验时可靠。 |

## 延伸阅读

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 权威参考资料, conteúdo intenso mas completo
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA  propôs float16  treinamento em perda escalado 论文
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch 中 混合精度 的实践指南
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)-- Google por que para TPUs  escolher este formato
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)--  reduzir as somas de pontos flutuantes 中 arrondamento erro 的算法
