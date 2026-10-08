# La valeur de la stabilité

> Le point flottant est un extrait de fuite. Il vous mordra pendant l'entraînement, et vous ne le remarquerez pas.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## Objectif de l'apprentissage

- Utiliser le truc de soustraction maximale pour réaliser une valeur constante de la valeur
- Identification du point flottant sur le plan du calcul, des survols, des sous-vols et des annulations catastrophiques
- Utilisation de différences finites centrées, gradients analytiques et gradients numériques
- Expliquer pourquoi entraîner bfloat16 优于 float16 , ainsi que l'échelle des pertes  comment prévenir le sous-flux gradient

##  problématique

Votre modèle s'entraîne pendant trois heures, puis la perte devient NaN... vous ajoutez une imprimante à la phrase...`inf`Jusqu'à la 9e étape, chaque gradient est`nan`L'entraînement est mort.

Ou: votre entraînement de modèle est terminé, mais la précision est inférieure à 2% de la réputation du thème. Vous avez vérifié tout.

Ou: tu as réalisé une perte d'entropie croisée de zéro. Elle est en petits logits.`inf`✿softmax débordement ✿, parce que ✿`exp(100)`Pour chaque framework ML, il y a un truc à deux lignes pour traiter ce problème.

La stabilité numérique n'est pas un problème théorique. Elle décide si une opération de formation réussit ou non.

## 概念

### IEEE 754: Computer how to store real numbers

计算机根据 IEEE 754 标准将实数存储为浮点值──一个浮点 有三部分:sign bit、元和 mantissa(significand)──

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

mantissa décide précisité (((a combien de chiffres valides)

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32  vous donne environ 7 bits de précision. Cela signifie qu'il peut distinguer entre 1.0000001 et 1.0000002, mais ne peut pas distinguer entre 1.00000001 et 1.00000002 ∙ Après plus de 7 bits, tout est sonorité arrondie ∙

float16  vous donne environ 3 bits de précision― il peut représenter le nombre maximum de 65,504― pour ML, cette gamme est inquiétante, car les logites、gradients et activations  souvent dépassent cette valeur―

bfloat16 est la réponse de Google à la question de la portée de float16 ⋅. Il possède un exponent de 8 bits similaire à float32 ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅. ⋅.

### Pourquoi 0,1 + 0,2 ! = 0,3

Dans la base 2, il s'agit d'un cycle de petit nombre:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

Float32 va le couper en 23 bits de mantissa. La valeur du stockage est d'environ 0,100000001490116 . De même, 0,2 de stockage est d'environ 0,200000002980232 . Leur et est de 0,300000004470348, et non 0,3.

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

C'est important pour le ML, parce que:

1. 像 `if loss < threshold`Ce type de perte peut donner une réponse erronée
2. 累积许多小值 (miles de milliers de pas de mise à jour progressive)
3. Si vous utilisez `==`Comparer les essais de flottation, de vérification et de reproductibilité

修复方法: Ne jamais l' utiliser `==`Comparer avec les flottants.`abs(a - b) < epsilon`Ou `math.isclose()`Il y a une autre.

### L'annulation catastrophique

Lorsque vous diminuez les deux points flottants presque égaux, plusieurs heures, les chiffres valables se neutralisent, le reste est élevé à un bruit de ronde à haute altitude.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

Cela signifie qu'une fois que la réduction a produit une erreur relative de 19%.

- Utilisation de données de moyenne valeur calculée:当 E[x] 很大时计算 `E[x^2] - E[x]^2`
- Par rapport aux deux probabilités de logement presque similaires
- Utilisation de l'epsilon  calcul des gradients de différence finie

修复方法:重排公式, éviter la réduction de deux nombres très grands et presque similaires. Pour la différence de carré, utiliser l'algorithme Welford, ou d'abord pour les données. Pour les log-probabilités, toujours travailler dans l'espace log.

### Surflux et sousflux

Le surcoût est trop grand, impossible à indiquer lorsqu'il est trop petit.

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`函数                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

`log()`函数会碰到另一个方向的问题:

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

Dans le milieu de la ML,`exp()`Il est présent dans le calcul de la température de la température de la température de l'air.`log()`Il y a des chances de croisement entre les entropes et les divergences de KL.`log(exp(x))`Le groupe est dans la région.

### Triche de log-sum-exp

直接计算 `log(sum(exp(x_i)))`C'est très dangereux.`x_i`- C'est très grand.`exp(x_i)`Il va déborder.`x_i`Tout le monde est très négatif.`exp(x_i)`La ville est en baisse de l'eau.`log(0)`Oui `-inf`Il y a une autre.

Cette astuce: dans la recherche d'exponents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

Pourquoi ça marche: réduire`max(x)`后, le plus grand exponent est `exp(0) = 1` Impossible de surcharger  Dans la demande et la demande, au moins un est 1, donc le total et au moins un est 1.`log(1) = 0`Il est impossible de faire une descente.`-inf`Il y a une autre.

 preuve:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

Pour faire`c = max(x)`Le débit est éliminé.

Cette astuce est partout dans le ML:
- Normalité de la douceur maximale
- Perte croisée d' entropie 计算
- Modèles de séquence 中的 log-probabilité 求和
- mélange de Gaussiens
- Inference variante

### Pourquoi Softmax a besoin de Trick de soustraction max ?

Softmax va logits 转换为概率:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

Pas de truc, les logits pour [100, 101, 102] conduirait à un débordement:

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

Utilisez cette astuce, réduire le max ((x) = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

La probabilité est la même. Le calcul est sûr. Ce n'est pas une optimisation, mais une exigence de la justesse.

### NaN 和 Inf: contrôle et prévention

`nan`(Pas un nombre)`inf`(infinité) sera comme un virus dans le calcul.`nan`J' ai fait changer de poids .`nan`Pour que chaque sortie soit transformée en`nan`L'entraînement va mourir en un pas.

`inf`如何出现:
- Pour un grand nombre d'exécuter`exp()`
- À partir de zéro:`1.0 / 0.0`
- accumulation`float32`débordement

`nan`如何出现:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- Pour l' exécution`sqrt()`
- Pour l' exécution`log()`
- Tout ce qui est concerné`nan`de l'arithmétique

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

 stratégies de prévention:

1. - Clampe`exp()`Les données de l'entrée:`exp(clamp(x, -80, 80))`
2. 给 dénominateurs 加 epsilon:`x / (y + 1e-8)`
3. Dans le`log()`Je suis en train de faire une émission.`log(x + 1e-8)`
4. Utilisation de la mise en œuvre de la logique de somme-exp
5. Utilisation de la coupe de gradient  prévenir les poids  explosion
6. 调试时在每次前进通过后检查 `nan`- Je suis là.`inf`

### Vérifie des gradations numériques

Gradients analytiques (from Backpropagation) peuvent avoir un bug.

Différence centrée 公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

C'est une différence de précision, bien plus grande que la différence de progression.`(f(x+h) - f(x)) / h`,后者只有O (h) ⋅

选择 h:太大则近似不准确──太小则 annulation catastrophique 会毁掉结果──`h = 1e-5`À la`1e-7`Je le vois souvent.

检查方式: calcul de la différence relative entre les gradients analytiques et numériques 

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- relative_error < 1e-7: parfait,Gradient 正确
- relative_error < 1e-5: acceptable, très probable correct
- relative_error > 1e-3: quelque chose est faux
- relative_error > 1: Gradient 完全错误

Chaque fois que vous mettez en place une nouvelle couche ou une fonction de perte, vous devez vérifier les gradients.`torch.autograd.gradcheck()`Il y a une autre.

### Formation à la précision mixte

Les GPU modernes ont des hard-parts spécialisés, peuvent être comparés à float32 快 2-8 倍地计算 float16 Matrix multiplications。Expérience de précision mixte utilise ce point:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

纯浮16 训练问题:gradients 往往非常小(1e-8 或更小) ――Float16 会把低于约6e-8的任何值下流为零――你的模型会停止学习,因为所有的渐进更新都是零――

修复方法是 la mise à l'échelle des pertes:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

L'échelle de perte dynamique 会自动调整尺度因子──从一个大值(65536)开始──如果梯度过成 `inf`Si le N pas ne déborde pas, il est multiplié.

### Bfloat16 vs float16: Pourquoi bfloat16 en train de gagner

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

Le nombre de points de contact est de 65,504 points.

Pour l'entraînement du réseau neuronal:

- Les activations et les logits pendant les pics d'entraînement sont souvent supérieurs à 65 504 ∙ float16 会溢出; bfloat16 可处理──
- float16  nécessite une mise à l'échelle de perte, mais bfloat16 n'est généralement pas nécessaire, car sa portée couvre le spectre de magnitude gradiente.
- bfloat16 est une simple section de float32: perdre la mantissa à 16 places.

Float16 est plus adapté à l'inférence, cette fois la valeur est de taille et l'exactitude est plus importante.

### Le découpage de la graisse

Les gradients explosants se produisent en gradients à travers de nombreux niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance des niveaux de la croissance de la croissance de la moyenne de la moyenne.

两种剪辑:

**Clip by value：**- Un accrochage indépendant pour chaque élément gradient.

```
grad = clamp(grad, -max_val, max_val)
```

简单, mais peut changer la direction du vecteur gradient.

**Clip by norm：**缩放整个 Gradient Vector, rendant sa norme non supérieure à 值。

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

Gardez le degré de direction.`torch.nn.utils.clip_grad_norm_()`Ce que je fais, c'est le choix standard.

典型值:transformateurs 使用 `max_norm=1.0`,RL usage `max_norm=0.5`, plus simple des réseaux Utilisation `max_norm=5.0`Il y a une autre.

Le grattage de gradient n'est pas un hack. C'est un mécanisme de sécurité.

### Normalization Layer  en tant que stabilisateur de valeur

La normalisation de lot, la normalisation de couche et la normalisation du RMS sont généralement introduites pour aider à entraîner les normalisateurs de réception.

 sans normalisation, les activations se multiplient ou diminuent au niveau des niveaux:

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

Normalization 会在每一层重新居中并重新缩放激活:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`(habituellement pour 1e-5) seront dans toutes les activations de la même époque pour empêcher de décomposition à zéro.`gamma`et `beta`Laissez le réseau récupérer à n'importe quelle échelle.

Cela permettra à l'ensemble du réseau de maintenir la valeur du centre dans une plage de sécurité numérique, tout en empêchant le débordement du centre de passage vers l'avant et l'explosion du centre de passage vers l'arrière.

### 常见 ML Numéro de valeur Bug

**Bug：Loss 在几个 epochs 后变成 NaN。**
Les logits sont trop gros, le softmax débordant, ou le taux d'apprentissage trop élevé, les poids sont trop lourds.
修复: utiliser stable softmax(max subtraction), réduire le taux d'apprentissage, ajouter le clippage gradient。

**Bug：Loss 卡在 log(num_classes)。**
原因: modèle sort proche de probabilités uniformes  signifie généralement que les gradients disparaissent, ou modèle complètement sans apprendre 
修复: vérifier les étiquettes de données Oui ou non correct, vérifier la fonction de perte, vérifier les références mortes,

**Bug：Validation accuracy 比预期低 1-3%。**
原因: précision mixte  absence d'échelle de perte correcte。 débit inférieur de degré 会把小 updates 置零。
修复: activation de l'échelle dynamique de perte, ou changement à bfloat16。

**Bug：某些 layers 的 Gradient norms 是 0.0。**
原因: les neurones morts de la RLU (((所有输入为负), ou flotter16 sous-flow。
修复: utiliser LeakyReLU ou GELU, utiliser Gradient scaling, inspecter la mise en marche du poids。

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因: ordre d'accumulation des points flottants non déterministe。 Les réductions parallèles de la GPU sur différents appareils se produisent dans des séquences différentes, tandis que l'ajout de points flottants ne satisfait pas à la loi de la combinaison。
修复: accepter小差异(1e-6), ou mettre en place `torch.use_deterministic_algorithms(True)`Il n'accepte pas la perte de vitesse.

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
原因: les logits bruts sont transmis directement `exp()`, n'a pas utilisé le truc de soustraction maximale.
修复: utiliser `torch.nn.functional.log_softmax()`Il a réalisé à l'intérieur de log-sum-explication.

**Bug：从 float32 切换到 float16 后训练发散。**
原因:float16 无法表示低于 6e-8 de la magnitude gradiente,也无法表示高于 65,504 de l'activation.
修复: utiliser avec la perte de précision mixte de l'échelle de l'AMP), ou modifier avec bfloat16。


```figure
logsumexp-stability
```

## - Je le construis.

### 步骤 1: démonstration du point flottant 精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### 步骤 2: réaliser naïf par rapport à stable softmax

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

### 步骤 3: réaliser un log-sum-exp stable

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

### étape 4: réaliser une entropie croisée stable

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

### 步骤 5: vérification du degré

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

## Utilisez-le

### Précision mixte 模拟

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

### Coupe de la coupe

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

### Détection de NaN/Inf

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

完整实现见 `code/numerical.py`, dont il a présenté tous les cas de bord.

## Je le livre.

Le cours est ouvert à:
- `code/numerical.py`, contient une douceur stable, max, log-sum-exp, entropie croisée, vérification des gradients et simulation de précision mixte
- `outputs/prompt-numerical-debugger.md`, pour les questions de valeur et de valeur de la NaN/Inf dans la formation de diagnostic

Ces stables réalisations se produiront à nouveau lors de la phase 3 de la construction d'un cycle de formation, ainsi que lors de la phase 4 de la réalisation des mécanismes d'attention.

## 练习

1. **Catastrophic cancellation。**Utilisez la formule naïve de float32`E[x^2] - E[x]^2`計算 [1000000.0, 1000001.0, 1000002.0] 的方差──然后使用威尔福德的在线算法计算──将误差与真实方差──0.6667) 相比──

2. **Precision hunt。**Trouver la valeur de float32 la plus faible en Python`x`Je suis là .`1.0 + x == 1.0`C'est la machine qui fait le test.`numpy.finfo(numpy.float32).eps`Il y a une autre.

3. **Log-sum-exp edge cases。**Utilisez le suivant pour tester votre .`logsumexp_stable`函数:(a) 所有值相等,(b) 一个值远大于其他值,(c) 所有值都非常负面(-1000) ――验证它在天真版本 失败的地方给出正确结果──

4. **Gradient checking a Neural Network layer。** réaliser une seule ligne `y = Wx + b` et son passage analytique à l' arrière.`numerical_gradient`校验 3x2 la vraieur de la matrice de poids

5. **Loss scaling experiment。**模拟 float16 训练:创建范围在 [1e-9, 1e-3] 内的随机梯度,转换为 float16,并测量有多少比例变成零――然后应用损失规模(乘以 1024),转换为 float16,再缩小回,并再次测量零比例――

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

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 权威参考资料, contenu complexe mais complet
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA  proposé float16  entraînement dans l' évolutivité des pertes
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch en milieu de précision mixte
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)-- Google pourquoi pour les TPU  choisir ce format
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)--  réduire les sumes de points flottants 中 arrondissement erreur 的算法
