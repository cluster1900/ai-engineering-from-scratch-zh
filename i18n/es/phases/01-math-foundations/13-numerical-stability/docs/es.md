# Número de valores estabilidad

> El punto flotante es un abstracto de fuga. Te picará un bocado durante el entrenamiento y no lo notarás.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## El objetivo del aprendizaje

- Utiliza el truco de subtracción máxima  lograr el valor de la cantidad estable softmax y log-sum-exp
- 识别 floating point 计算中的溢流,不足和灾难性取消
- Utiliza las diferencias finitas centradas y los gradientes analíticos y los gradientes numéricos
-  Explicar por qué entrenar bfloat16 优于 float16, así como la escalación de pérdidas  Cómo prevenir el desflujo gradiente

##  problemas

Tu modelo se entrenó tres horas, luego Perdiendo se convirtió en NaN... y luego se imprimió un texto... y los logitos de los 9.000 pasos se volvieron normales... y los 9.001 pasos se convirtieron en...`inf`Hasta la 9.002 de cada graduación.`nan`, el entrenamiento ya está muerto.

O: tu entrenamiento de modelo se ha completado, pero la precisión es inferior al 2% de lo que afirma el artículo.

O: tu desde zero realiza pérdida de entropía cruzada.`inf`✿softmax sobrecarga ✿, porque ✿`exp(100)`En general, el sistema de gestión de los datos de los sistemas de gestión de datos (ML) utiliza un truco de dos líneas para resolver este problema.

La estabilidad de valores no es un problema teórico. Decide si una práctica de ejecución es exitosa o fallida.

## 概念

### IEEE 754: cómo almacenar el número real de computadoras

计算机根据 IEEE 754 标准将实数存储为浮点值──一个浮点 有三部分:sign bit、元和 mantissa(significand)──

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

mantissa decide precidad (((hay cuánto número válido)

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32  te da aproximadamente 7 bits de precisión de producción. Esto significa que puede distinguir entre 1.0000001 y 1.0000002, pero no puede distinguir entre 1.00000001 y 1.00000002 . Después de más de 7 bits, todo es ruido redondeado.

float16  te da aproximadamente 3 bits de precisión―, el máximo número que puede representar es 65,504―, para ML, este rango es pequeño y inquietante, porque los logitos、gradientes y activaciones , a menudo, superan este valor―,

bfloat16 es la respuesta de Google a la pregunta sobre el alcance de float16 ⋅. Tiene un exponente de 8 bits similar a float32 ⋅. el mismo alcance, hasta 3.4e38 ⋅. pero solo 7 bits mantissa ⋅. tienen una precisión inferior a float16 ⋅. para el entrenamiento de la red neuronal, el alcance es más importante que la precisión, por lo que bfloat16 suele ganar.

### ¿Por qué 0.1 + 0.2 ! es igual a 0.3

En la base 2, es un pequeño número circular:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

Float32 lo cortará en 23 bits de mantissa. El valor del almacenamiento es de aproximadamente 0.100000001490116 . Del mismo modo, 0.2  almacenamiento es de aproximadamente 0.200000002980232 .

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

Esto es importante para ML, porque:

1. ¿ Qué ?`if loss < threshold`Esta clase de pérdidas puede dar una respuesta equivocada.
2. 累积许多小值(数千步的 Gradiente actualizaciones) se alejan de la realidad y
3. Si usaste`==`Comparar floats, checksums y pruebas de reproducibilidad

修复方法: Nunca lo uses `==`Comparar con los flotantes.`abs(a - b) < epsilon`O `math.isclose()`¿Qué es eso?

### Cancelación catastrófica

Cuando se reduce el punto flotante de dos casi iguales en cientos de horas, los números válidos se oponen entre sí, lo que queda es elevarse al ruido de redondeo de alto nivel.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

Esto significa que una vez que se reduce el método se produce un error relativo del 19%. En el ML, esta situación se presenta:

- Utiliza el tamaño de la media de datos en el cálculo de diferencias:当 E[x] 很大时计算 `E[x^2] - E[x]^2`
- Las probabilidades de registro de las dos casi iguales
- Utiliza过小 epsilon  calcular los gradientes de diferencia finita

修复方法:重排公式, evitar la reducción de la diferencia entre dos números muy grandes y casi iguales.

### Sobreflujo y bajoflujo

El exceso de flujo  ocurre en el resultado demasiado grande, no se puede expresar cuando.

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`函数 es el flujo en ML  principal fuente:

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

`log()`La función se encuentra en otra dirección.

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

En el ML,`exp()`Se encuentra en el cálculo de la probabilidad y de la suavidad.`log()`En la actualidad, la entropía cruzada, las probabilidades logísticas y la divergencia KL en el medio, no hay ningún truco correcto.`log(exp(x))`组合就是雷区──

### El truco de registro total y total

直接计算 `log(sum(exp(x_i)))`Es muy peligroso en el valor de la cantidad.`x_i`Es muy grande.`exp(x_i)`Se sobrecargará todo.`x_i`Todos muy negativos.`exp(x_i)`La ciudad se desvanece hasta cero, y`log(0)`Sí `-inf`¿Qué es eso?

Este truco: en la búsqueda de exponente  antes de primero disminuir el valor máximo.

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

¿Por qué funciona: disminuir `max(x)`后, el máximo exponente es `exp(0) = 1`△ no puede ocurrir un desbordamiento △ en la demanda y en la demanda al menos uno es 1, por lo que el total y al menos es 1, y ∞`log(1) = 0` Imposible que el flujo suba hasta `-inf`¿Qué es eso?

 prueba:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

¿ Qué ?`c = max(x)`, el exceso de flujo se elimina.

Este truco es visible en todo el ML:
- Normalización de la máxima suave
- Perdida de entropía cruzada 计算
- Modelos de secuencia 中的 log-probabilidad 求和
- Mezcla de gaussianos
- Inferencia por variación

### ¿Por qué Softmax necesita el truco de subtracción máxima?

Softmax se convertirá en la probabilidad:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

No hay trampa, los logits para [100, 101, 102] conducirá a un desbordamiento:

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

Utilice este truco, menos max x = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

La probabilidad es la misma. La calculación es segura.

### NaN 和 Inf: análisis y prevención

`nan`(No es un número)`inf`(infinito) se va a hacer como un virus en el cálculo.`nan`¡ ¡ Que el peso se vuelva !`nan`, para que cada salida posterior se convierta en`nan`❖ El entrenamiento morirá en un paso.

`inf`¿Cómo se presenta:
- Para un gran número de ejecuciones`exp()`
- Más allá de:`1.0 / 0.0`
- acumulaciones`float32`sobreflujo

`nan`¿Cómo se presenta:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- Para la ejecución negativa`sqrt()`
- Para la ejecución negativa`log()`
-  cualquier cosa que se haya relacionado `nan`de la aritmética

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

 estrategia de prevención:

1. Clampe `exp()`de entrada:`exp(clamp(x, -80, 80))`
2. 给 denominadores 加 epsilon:`x / (y + 1e-8)`
3. En el`log()`¿Qué es eso ?`log(x + 1e-8)`
4. Utiliza estabilización de log-sum-exp, softmax estable)
5. Uso de recorte gradiente  Prevenir pesas  Explosión
6. 调试时在每次前进通过后检查 `nan`- ¿ Qué ?`inf`

### Verificación de los gradientes numéricos

Gradientes analíticos (de Backpropagation) puede haber un error.

Diferencia centrada 公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

Es la precisión, mejor que la diferencia hacia adelante.`(f(x+h) - f(x)) / h`,后者只有 O (h) ⋅

选择 h:太大则近似不准确──太小则 cancelación catastrófica 会毁掉结果──`h = 1e-5`¿ Qué ?`1e-7`Es muy habitual.

检查方式: cálculo diferencia relativa entre los gradientes analíticos y numéricos 

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- Relativo_error < 1e-7: perfecto, Gradiente 正确
- Relativo_error < 1e-5: aceptable, muy posible correcto
- Relativo_error > 1e-3: hay algo mal
- relativo_error > 1: Gradiente 完全错误

Cada vez que se realiza una nueva capa o Función de pérdida, se deben revisar los gradientes.`torch.autograd.gradcheck()`¿Qué es eso?

### Formación de precisión mixta

现代 GPUs tienen hardware especial(Cores de tensión), se puede comparar con float32 快 2-8 倍地计算 float16 multiplications matrix。 Entrenamiento de precisión mixta aprovechó este punto:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

纯浮16 训练问题:gradients 往往非常小(1e-8 或更小) ――Float16 会把低于约6e-8 的任何值下流为零――tu modelo将停止学习,因为所有渐变更新都是零――

修复方法是 pérdida de escala:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

La escalación de pérdidas dinámicas 会自动调整尺度因子──从一个大值(65536)开始──如果梯度过成 `inf`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , y , , , , , , y , , , , , , , , , , , , , , y , , , , , , , , , , , ,

### Bfloat16 vs float16: ¿Por qué Bfloat16 en el entrenamiento

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

float16 精度更高(10 mantissa bits vs 7), pero el alcance limitado(最大约65,504);;bfloat16 精度较低,但范围与float32 相同(最大约3.4e38);;

对于训练 Neural Network:

- Activations 和 logits 在训练 spikes 期间经常超过 65,504──float16 会溢出;bfloat16 可处理──
- float16  necesita pérdida de escala, pero bfloat16 normalmente no necesita, ya que su alcance abarca el espectro de magnitud gradiente―
- bfloat16 es el simple corte de float32: perder la mantissa de 16 bits.

float16 Más adecuado para la inferencia, este tiempo el valor de la cifra tiene límites y la precisión es más importante.

### El recorte gradual

Los gradientes explosivos ocurren en gradientes a través de muchos niveles de tiempo de crecimiento (RNNs, redes profundas y transformadores) un gran gradiente puede destruir todos los pesos en un paso.

两种剪辑:

**Clip by value：**独立 clamp Cada elemento gradiente

```
grad = clamp(grad, -max_val, max_val)
```

简单, pero puede cambiar la dirección del Vektor Gradiente.

**Clip by norm：**缩放整个 Gradiente Vector, haciendo que su norma no exceda el valor ──

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

Mantener el Gradiente en su dirección.`torch.nn.utils.clip_grad_norm_()`Lo que se hace es una elección estándar.

典型值:transformers 使用 `max_norm=1.0`,RL utiliza `max_norm=0.5`, más sencillo de redes de uso `max_norm=5.0`¿Qué es eso?

El recorte de gradientes no es un hack. Es un mecanismo de seguridad.

### Normalización capas  como un número de valores estabilizador

La normalización de lote, la normalización de capas y la normalización de RMS se suelen presentar para ayudar a entrenar a los reguladores de recepción.

 sin normalización, las activaciones se incrementarán o disminuirán en niveles inter-indicadores:

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

Normalización 会在每一层重新居中并重新缩放激活:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`(normalmente para 1e-5) se realizarán en todas las activaciones y evitarán simultáneamente la eliminación de parámetros.`gamma`Y `beta`让网络能恢复它需要的任何规模──

Esto permitirá que el valor de la red entera se mantenga en el rango de seguridad de valores numéricos, evitando el desbordamiento del paso hacia adelante y también la explosión gradual del paso hacia atrás.

### 常见 ML Número de valores Bug

**Bug：Loss 在几个 epochs 后变成 NaN。**
原因:logits 变得太大,softmax overflow 了──或 la tasa de aprendizaje 太高, pesos 发散了──
修复: utilizar estabilidad de la subtracción de la máxima softmax, reducir la tasa de aprendizaje, incluir el recorte de gradientes。

**Bug：Loss 卡在 log(num_classes)。**
原因: modelo de salida se acerca a probabilidades uniformes―generalmente significa que los gradientes están desapareciendo, o el modelo no está completamente aprendiendo―
修复: Inspección de etiquetas de datos Sí no es correcto, 校验 Loss Function, inspección de RELU muertos。

**Bug：Validation accuracy 比预期低 1-3%。**
原因:precisión mixta  no se ha escalado la pérdida adecuada。
修复: activar la escala de pérdidas dinámicas, o cambiar a bfloat16。

**Bug：某些 layers 的 Gradient norms 是 0.0。**
原因: neuronas muertas de ReLU (((所有输入为负), o flotando16 bajo flujo。
修复: usar LeakyReLU o GELU, usar escalación de gradientes, inspección de inicialización de peso。

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因: no determinista orden de acumulación de puntos flotantes。 las reducciones paralelas de GPU en diferentes hardware se producen en diferentes ordenes, mientras que la adición de puntos flotantes no se satisface con la regla de combinación。
修复: acepta小差异(1e-6), o configuración `torch.use_deterministic_algorithms(True)`Y no acepta la pérdida de velocidad.

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
原因: logits crudos fueron transmitidos directamente `exp()`, no usó el truco de la subtracción máxima.
修复: usar `torch.nn.functional.log_softmax()`, en el interior logró log-suma-explicación.

**Bug：从 float32 切换到 float16 后训练发散。**
原因:float16 无法表示低于 6e-8 的渐进大小,也无法表示高于 65,504 的激活──
修复: utilizar con pérdida de escala de precisión mixta de la amp), o modificar con bfloat16。


```figure
logsumexp-stability
```

## Construirlo

### 步骤 1: muestra el punto flotante 精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### Paso 2: lograr la ingenuidad frente a la estabilidad de la softmax

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

### Paso 3: Lograr un log-sum-exp estable

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

### Paso 4: lograr una entropía cruzada estable

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

### Paso 5: Verificación de los grados

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

## Usalo

### Precisión mixta 模拟

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

### Clicado gradual

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

### Detección de NaN/Inf

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

完整实现见 `code/numerical.py`, de los cuales se presentaron todos los casos de borde.

##  entregarlo

Encuentro de trabajo:
- `code/numerical.py`, contiene una máxima de suavidad estable, log-sum-exp, entropía cruzada, compresión de gradientes y simulación de precisión mixta
- `outputs/prompt-numerical-debugger.md`, para el diagnóstico de la formación en el problema de la N/Inf y el valor numérico

Estos establecimientos se lograrán en la fase 3 construcción de un ciclo de formación , así como en la fase 4 realización de mecanismos de atención  reaparecer.

##  ejercicios

1. **Catastrophic cancellation。**Utiliza float32 中的 ingenuo fórmula `E[x^2] - E[x]^2`計算 [1000000.0, 1000001.0, 1000002.0] 的方差──然后使用威尔福德的在线算法 计算──将误差与真实方差──0.6667)比较──

2. **Precision hunt。**En Python encontrar el mínimo de float32 valor`x`, hacer que`1.0 + x == 1.0` Éste es el epsilon de la máquina  Verifique si es compatible `numpy.finfo(numpy.float32).eps`¿Qué es eso?

3. **Log-sum-exp edge cases。**Usando el siguiente tipo de prueba`logsumexp_stable`函数:(a) 所有值相等,(b) 一个值远大于其他值,(c) 所有值都非常负面(-1000) ――验证它在天真版本 失败的地方给出正确结果──

4. **Gradient checking a Neural Network layer。** Realizar una sola línea de nivel `y = Wx + b` y su paso analítico hacia atrás──使用 `numerical_gradient`校验 3x2 masa matriz de la verdad.

5. **Loss scaling experiment。**模拟 float16 训练:创建范围在 [1e-9, 1e-3] 内的随机梯度,转换为 float16,并测量有多少比例变成零――然后应用损失规模(乘以 1024),转换为 float16,再扩展回,并再次测量零比例――

## 关键术语: "El hombre es un hombre"

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

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 权威参考资料, contenido intenso pero completo
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA  propone float16  entrenamiento en la escalación de pérdidas
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch en medio de la precisión mixta
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)-- Google por qué para TPUs  elegir este formato
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)--  reducir las sumas de puntos flotantes 中 redondeo error 的算法
