# Métodos de muestreo

> El muestreo es una forma de explorar la posibilidad de que la IA pueda hacerlo.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## El objetivo del aprendizaje
-  sólo utilizar números aleatorios uniformes, desde el zero lograr CDF inverso ‧rechazo y muestreo de importancia
- Para el modelo de lenguaje Token 生成 construcción de temperatura, top-k y top-p (núcleo) muestreo
- Explicar el truco de reparameterización, y por qué puede hacer muestreo en VAEs  apoyar la retropropagación
- 运行 Metropolis-Hastings MCMC, desde el objetivo de distribución de la integración

##  problemas
Un modelo de lenguaje  completado para el procesamiento de su pedido, se producirá un que contiene 50.000 logitos de vector── cada token en el vocabulario para el correspondiente uno── ahora tiene que elegir uno── ¿cómo elegir?

Si siempre es seleccionar la probabilidad más alta de Token, cada respuesta será completamente igual. Determinar, un modo, sin interés. Si es completamente uniforme, la salida se convertirá en un código de desorden. La respuesta se encuentra entre estos dos extremos, y esta posición es controlada por muestreo.

Muestreo no sólo se utiliza para la generación de textos. Refuerzo Aprendizaje  a través de trayectorias de muestreo para evaluar los gradientes de la política.  AVAEs  a través de muestreo de la distribución de aprendizaje  a través de la distribución de la distribución de la información  a través de la distribución de la información  a través de la distribución de la información  a través de la distribución de la información  a través de la distribución de la información  a través de la distribución de la información  a través de la información  a través de la información  a través de la información  a través de la información  a través de la información  a través de la información                                                                                                                                                                                                                                                                                                                                                     

Cada sistema de IA generativa es un sistema de muestreo. La estrategia de muestreo determina la calidad, la diversidad y la capacidad de control de la producción.

## 概念
### Por qué es importante tomar muestras

El muestreo en IA y Machine Learning tiene cuatro roles básicos:

**Generation.**Los modelos de lenguaje, modelos de difusión y GAN se utilizan a través de muestras  producir salidas  El algoritmo de muestreo controla directamente la creación  la coherencia y la diversidad  La temperatura  la top-k y el muestreo de núcleo es el que los ingenieros cada día realizan.

**Training.**Estocástico Gradiente Descenso de muestreo de mini-partidos。Dropout 会 sampling 停用神经元──Data augmentation 会 sampling random transformations──Importance sampling 会对样本重新加权,以降低强化学习 (PPO, TRPO) 中的 Gradient 方差──

**Estimation.**Muchas cantidades en el ML no tienen solución de forma cerrada. Las expectativas en la distribución de datos de pérdida. La función de partición del modelo basado en energía. La inferencia bayesiana.

**Exploration.**Los algoritmos MCMC exploran las distribuciones posteriores en la inferencia bayesiana. Las estrategias evolutivas analizan las perturbaciones de parámetros de muestreo.

El reto central es: sólo puedes tomar muestras directamente de la distribución simple (uniforme, normal) ‒ para todas las demás distribuciones, necesitas un método para convertir muestras simples en muestras de la distribución objetivo ‒.

### Muestreo aleatorio uniforme

Cada método de muestreo comienza aquí. El generador de números aleatorios uniforme produce un valor en [0, 1], en el cual cualquier área de distribución tiene probabilidades de similaridad.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

Para obtener muestras uniformes en el conjunto de elementos de separación, generar U y volver al piso,

关键洞察: un solo número aleatorio uniforme 恰好包含从任意分布中生成一个样本的随机性――技巧在于找到正确的转变――

### Método inverso de CDF (muestreo de transformación inversa)

Función de distribución acumulada (CDF) 会把数值映射到概率:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

CDF inverso 会把概率映射回数值──如果 U ~ Uniform(0, 1), entonces X = F_inverse(U) 服从目标分布──

```
Algorithm:
  1. Generate u ~ Uniform(0, 1)
  2. Return F_inverse(u)

Why it works:
  P(X <= x) = P(F_inverse(U) <= x) = P(U <= F(x)) = F(x)
```

**Exponential distribution 示例：**

```
PDF: f(x) = lambda * exp(-lambda * x),   x >= 0
CDF: F(x) = 1 - exp(-lambda * x)

Solve F(x) = u for x:
  u = 1 - exp(-lambda * x)
  exp(-lambda * x) = 1 - u
  x = -ln(1 - u) / lambda

Since (1 - U) and U have the same distribution:
  x = -ln(u) / lambda
```

Cuando puedes escribir una forma cerrada de F_inverse 时, este método tiene un efecto perfecto. Para la distribución normal, no existe CDF inversa de forma cerrada, por lo que utilizamos otros métodos.

**离散版本：** Para las distribuciones discretas, construir CDF  para la suma acumulada, generar U, y luego encontrar la suma acumulada más allá de U ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`sample_categorical`El trabajo de la empresa.

### Muestras de rechazo

Cuando no se puede revertir CDF, pero se puede evaluar en un caso diferente a un número constante, el muestreo de rechazo es posible.

```
Target distribution: p(x)  (can evaluate, possibly unnormalized)
Proposal distribution: q(x)  (can sample from)
Bound: M such that p(x) <= M * q(x) for all x

Algorithm:
  1. Sample x ~ q(x)
  2. Sample u ~ Uniform(0, 1)
  3. If u < p(x) / (M * q(x)), accept x
  4. Otherwise, reject and go to step 1

Acceptance rate = 1/M
```

En el caso de la muestra de rechazo, el porcentaje de aceptación se reduce, ya que la mayor parte del volumen de la propuesta será rechazada.

**示例：从 truncated normal 中 sampling。**En el rango truncado, arriba se utiliza la propuesta uniforme. Envelope M es el máximo de PDF normal dentro del rango.

**示例：从 semicircle 中 sampling。**En el rectángulo de límite, la propuesta uniforme. Si el punto se encuentra en un semicírculo, entonces se acepta.

### Muestreo de importancia

Algunas veces no necesitas muestras de la distribución objetivo p(x) ⋅ necesitas estimar las expectativas de la distribución siguiente, y tienes muestras de otra distribución q(x) ⋅

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

Esto es muy importante en el aprendizaje de refuerzo. En el PPO (Proposal Policy Optimization) usted recoge trayectorias en la política antigua, pero espera optimizar la nueva política nueva.

La diferencia entre el estimador de muestreo de importancia depende de la similaridad entre q y p. Si q y p son muy diferentes, una pequeña cantidad de muestras obtendrá un peso enorme y se orientará en la estimación.

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### Estimación de Monte Carlo

Estimación de Monte Carlo                                                                                                                                                                                                                                                            

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

La tasa de error no tiene relación con la dimensión es por eso que en el escenario de alta dimensión de integración basada en la red no es posible lograr, los métodos de Monte Carlo  ocupan el lugar dominante

**估计 pi：**

```
Sample (x, y) uniformly from [-1, 1] x [-1, 1]
Count how many fall inside the unit circle: x^2 + y^2 <= 1
pi ~ 4 * (count inside) / (total count)
```

**估计期望：**

```
E[f(X)] ~ (1/N) * sum(f(x_i))    where x_i ~ p(x)

The sample mean converges to the true expectation.
Variance of the estimator = Var(f(X)) / N
```

### La cadena de Markov Monte Carlo (MCMC):Metropoles-Hastings

MCMC construye una cadena Markov, haciendo que su distribución estacionaria sea la distribución objetivo p(x)。 después de haber pasado suficientes pasos, las muestras en el medio de la cadena 就(近似) son muestras de p(x)。

```
Target: p(x)  (known up to a normalizing constant)
Proposal: q(x'|x)  (how to propose the next state given the current state)

Metropolis-Hastings algorithm:
  1. Start at some x_0
  2. For t = 1, 2, ..., T:
     a. Propose x' ~ q(x'|x_t)
     b. Compute acceptance ratio:
        alpha = [p(x') * q(x_t|x')] / [p(x_t) * q(x'|x_t)]
     c. Accept with probability min(1, alpha):
        - If u < alpha (u ~ Uniform(0,1)): x_{t+1} = x'
        - Otherwise: x_{t+1} = x_t
  3. Discard first B samples (burn-in)
  4. Return remaining samples
```

对于对称提案 (q)  (x'x)  (q)  (x'x) ),ratio 会简化为 (p)  (x')/p)  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  () )  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  () )  ()  ()  ()  ()  ()  ()  () )  ()  (                                                                                                       

**为什么有效。**Regla de aceptación Garantizar el equilibrio detallado: está en x y se mueve a x' de la probabilidad, igual a estar en x' y se mueve a x de la probabilidad.

**实践注意事项：**
- Quema: en cadena  alcanzar el equilibrio  antes de abandonar las muestras tempranas
- El adelgazamiento: cada muestra se mantiene en el mismo, para reducir la autocorrelación.
- Escala de las propuestas: 太小会让链 移动缓慢(alta aceptación, exploración lenta); 太大会让大多数提案被拒绝(low acceptance, stuck in place)
- 高维中 La mejor tasa de aceptación de la propuesta gaussiana es de aproximadamente 0,234

### Muestras de Gibbs

El muestreo de Gibbs es una MCMC especial de las distribuciones multivariadas. No se propone una vez en todas las dimensiones, sino que se actualiza una variable cada vez desde la distribución condicional.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

El muestreo de Gibbs requiere que puedas muestrar de cada distribución condicional en cada x = i = x = i = i. Para muchos modelos, esto es muy directo:
- Redes bayesianas: Condiciones de la estructura del gráfico
- Las mezclas gaussianas: condicionalis es gaussianas
- Modelos de aislamiento: cada giro es condicional sólo depende de sus vecinos

Taxa de aceptación 总是 1 ((cada propuesta fue aceptada), ya que a partir de muestras condicionales precisas se satisfará automáticamente el equilibrio detallado。

**局限。**Cuando las variables están relacionadas a alta velocidad, la mezcla de muestras de Gibbs es lenta, ya que una vez se actualiza una variable no se puede hacer grandes movimientos diagonales en la distribución.

### Muestreo de temperatura (para LLM)

Modelos de lenguaje 会为词汇 中每个代号 输出 logits z_1, ..., z_V──Softmax 会把它们转换成概率──Temperature 会在软max 前重新缩放 logits:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**Utiliza T < 1 para aumentar la diferencia entre los logitos. Si z_1 = 2 y z_2 = 1, utiliza T = 0.5 para obtener z_1/T = 4 y z_2/T = 2, hace que la diferencia sea grande.

**实践中：**
- T = 0,0:descodificación codiciada, más adecuado a la realidad tipo de preguntas y respuestas
- T = 0,3-0,7: un poco creativo, adecuado para la generación de código
- T = 0,7-1,0: equilibrio, adaptado al diálogo general
- T = 1.0-1.5: escritura creativa, lluvia de cerebros
- T > 1.5: Siempre y cuando, normalmente muy poco útil

La temperatura no cambia qué Token es posible.

### Muestreo de la parte superior

El muestreo de top-k limitará el conjunto de candidatos a la probabilidad máxima de k 个 Token, luego se volverá a clasificar y se extraerá del conjunto de restricciones.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Keep only the top k tokens
  4. Renormalize: p_i' = p_i / sum(p_j for j in top-k)
  5. Sample from the renormalized distribution

k = 1:  greedy decoding
k = V:  no filtering (standard sampling)
k = 40: typical setting, removes long tail of unlikely tokens
```

Top-k 会防止模型选择极低概率的代币(拼写错误、无意义内容), estos tokens 存在于词汇分布的长尾中. El problema es que: independientemente de cómo arriba abajo, k 都是固定的. Cuando el modelo tiene una buena certeza, k = 40 todavía permitirá 39 substitusiones.

### Muestreo de la parte superior (núcleo)

Muestreo de top-p 会动态调整候选集合大小──. No se conserva un número fijo de Tokens, sino que se conserva la probabilidad acumulada de superar la p de la colección de Tokens mínimas──.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Find smallest k such that sum of top-k probabilities >= p
  4. Keep only those k tokens
  5. Renormalize and sample

p = 0.9:  keeps tokens covering 90% of probability mass
p = 1.0:  no filtering
p = 0.1:  very restrictive, nearly greedy
```

Cuando el modelo tiene una buena idea, el muestreo de núcleo conservará muy pocos Token (en el caso de los modelos de núcleo) ⋅ cuando el modelo no está seguro, se conservará mucho (en el caso de los modelos de núcleo) ⋅ cuando el modelo tiene una buena idea, se conservará mucho (en el caso de los modelos de núcleo) ⋅ cuando el modelo no está seguro, se conservará mucho (en el caso de los modelos de núcleo) ⋅ cuando el modelo tiene una buena idea, se conservará mucho (en el caso de los modelos de núcleo) ⋅ cuando el modelo no está seguro, se conservará muchos (en el caso de los modelos de núcleo) ⋅ cuando el modelo tiene una buena idea, se conservará mucho (en el caso de los modelos de núcleo) ⋅ cuando el modelo tiene una buena idea, este comportamiento de adaptación es el que generalmente causa la muestreo de núcleo en comparación con los top-k ⋅ cuando el modelo de núcleo se produce mejor en el texto.

**常见组合：**
- Temperatura 0,7 + p superior 0,9: buena configuración de uso general
- Temperatura 0.0 (compulsiva): lo mejor que puede hacer
- Temperatura 1.0 + top-k 50:Fan et al. (2018)

Top-k 和 top-p puede ser combinado.

### Tricuación de reparameterización (para VAEs)

El método de aprendizaje de los autoencodadores variacionales (VAEs) es: poner las entradas codificadas en una distribución en el espacio latente, tomar muestras de esta distribución, y luego descifrar la muestra.

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

El truco de reparameterización se separará de la arbitrariedad y los parámetros:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

Esto es lo que hace que sea válido, es porque N ∈ Mu, sigma^2) con mu + sigma * N ∈ 0, 1) ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N ∈ N    ∈ N ∈ N                                                                                                                                                                                                       

**在 VAE training loop 中：**
1. Encoder para cada entrada 输出 mu 和 log sigma^2)
2. Muestra de epsilon ~ N(0, 1)
3. 计算 z = mu + sigma * epsilon
4. Descifrar z 以 re-construir entrada
5. 穿过步骤 4、3、2、1  llevar a cabo la retropropagación(可行, porque el paso 3 es可微的)

 sin el truco de reparameterización, los VAEs no pueden usar el estándar de formación                                                                                                                                                                                                                                                    

### Gumbel-Softmax (muchas más)

El truco de reparameterización  se aplica a la distribución continua  Gaussian)  Para las distribuciones categoricas separadas, necesitamos otro método Gumbel-Softmax para el muestreo categórico  ha proporcionado una pequeña aproximación

**Gumbel-Max trick（不可微）：**

```
To sample from a categorical distribution with log-probabilities log(p_1), ..., log(p_k):
  1. Sample g_i ~ Gumbel(0, 1) for each category
     (g = -log(-log(u)), where u ~ Uniform(0, 1))
  2. Return argmax(log(p_i) + g_i)

This produces exact categorical samples.
```

**Gumbel-Softmax（可微近似）：**

```
Replace the hard argmax with a soft softmax:
  y_i = exp((log(p_i) + g_i) / tau) / sum(exp((log(p_j) + g_j) / tau))

tau (temperature) controls the approximation:
  tau -> 0:  approaches a one-hot vector (hard categorical)
  tau -> inf: approaches uniform (1/k, 1/k, ..., 1/k)
  tau = 1.0: soft approximation
```

Gumbel-Softmax 会产生 discreto sample 的连续松──输出是概率向量(soft one-hot),而不是 hard one-hot──Gradientes 会穿越 softmax 流动──在训练的前进通过中,你可以使用"直穿"估计器:前进通过 使用硬 argmax,但倒进通过 使用软 Gumbel-Softmax梯度──

**应用：**
- Variables latentes discretas entre las VAEs
- Buscar arquitectura neuronal (opciones de selección de separación)
- Mecanismos de atención dura
- 带 discreto acciones de aprendizaje de refuerzo

### Muestreo estratificado

Estándar de muestreo de Monte Carlo puede ocurrir debido a la arbitrariedad en el espacio de muestreo en el que se queda un vacío.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

En comparación con el estándar de Monte Carlo, la diferencia entre las muestras estratificadas es siempre menor o similar:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- Integración numérica (quasi-Monte Carlo)
- Los datos de formación se dividen (¡garantizar el equilibrio de clases en cada pieza)
- 带 stratificación de importancia muestreo 组合两种技术)
- NeRF (Neural Radiance Fields) Rayos de cámara Utiliza muestreo estratificado

### Conexión a modelos de difusión

Modelos de difusión  a través del proceso de muestreo 生成图像──Proceso avanzado 会在 T 步中向图像添加高斯音噪音,直到它变成纯噪音──Reverso proceso 学习指明,逐步恢复原始图像──

```
Forward process (known):
  x_t = sqrt(alpha_t) * x_{t-1} + sqrt(1 - alpha_t) * epsilon
  where epsilon ~ N(0, I)

  After T steps: x_T ~ N(0, I)  (pure noise)

Reverse process (learned):
  x_{t-1} = (1/sqrt(alpha_t)) * (x_t - (1 - alpha_t)/sqrt(1 - alpha_bar_t) * epsilon_theta(x_t, t)) + sigma_t * z
  where z ~ N(0, I)

  Each denoising step is a sampling step.
```

Enlace con el método de enseñanza:
- Cada paso de denotación utilizan el truco de reparameterización
- Programa de ruido {alpha_t}  controlOne temperatura de anulación
- Formación utiliza la estimación de Monte Carlo 来近似 ELBO (evidencia límite inferior)
- Los modelos de difusión de medio de la muestreo ancestral es una cadena de Markov (cada paso depende sólo del estado actual)

Todo el proceso de creación de imágenes es muestreo iterativo: desde el ruido, en cada paso, basado en el modelo de denotación aprendido, muestra una versión de un poco de ruido.


```figure
monte-carlo-pi
```

## Construirlo
### 步骤 1: Muestreo de CDF uniforme y inverso

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10,000 个指数样本,并验证均值为1/lambda──

### 步骤 2: Muestreo de rechazo

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

Utiliza muestreo de rechazo de la distribución normal truncada 中抽样──通过对样品 绘制 histogram 来验证形──

### 步骤 3: Muestreo de importancia

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

Utiliza propuesta uniforme  estimación de distribución normal 下的 E[X^2]──与已知答案(mu^2 + sigma^2)比较──

### 步骤 4: estimación de Monte Carlo de pi

```python
def monte_carlo_pi(n):
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x*x + y*y <= 1:
            inside += 1
    return 4 * inside / n
```

### 步骤 5: MCMC de la ciudad de Hastings

```python
def metropolis_hastings(target_log_pdf, proposal_sample, proposal_log_pdf, x0, n_samples, burn_in):
    samples = []
    x = x0
    for i in range(n_samples + burn_in):
        x_new = proposal_sample(x)
        log_alpha = (target_log_pdf(x_new) + proposal_log_pdf(x, x_new)
                     - target_log_pdf(x) - proposal_log_pdf(x_new, x))
        if math.log(random.random()) < log_alpha:
            x = x_new
        if i >= burn_in:
            samples.append(x)
    return samples
```

Desde la distribución bimodal (la mezcla de dos Gaussianos) entre el muestreo, la trayectoria de la cadena de visibilidad,

### Paso 6: Muestreo de Gibbs

```python
def gibbs_sampling_2d(conditional_x_given_y, conditional_y_given_x, x0, y0, n_samples, burn_in):
    x, y = x0, y0
    samples = []
    for i in range(n_samples + burn_in):
        x = conditional_x_given_y(y)
        y = conditional_y_given_x(x)
        if i >= burn_in:
            samples.append((x, y))
    return samples
```

### Paso 7: Muestreo de temperatura

```python
def softmax(logits):
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def temperature_sample(logits, temperature):
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)
```

 mostrar temperatura  cómo cambiar un grupo de logitos de tokens  输出分布──

### 步骤 8: Muestreo de la parte superior y de la parte superior

```python
def top_k_sample(logits, k):
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]

def top_p_sample(logits, p):
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]
```

### Paso 9: Tricuación de reparameterización

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

演示 Gradientes pueden atravesar muestras reparametrizadas 流动, pero no pueden atravesar muestras directas 流动.

### Paso 10: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

 demostrando baja temperatura  cómo hacer que la salida se acerque a un vector caliente 

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `code/sampling.py`En el medio.

## Usalo
Utiliza NumPy y SciPy 时,producción 版本如下:

```python
import numpy as np

rng = np.random.default_rng(42)

exponential_samples = rng.exponential(scale=2.0, size=10000)
print(f"Exponential mean: {exponential_samples.mean():.4f} (expected 2.0)")

from scipy import stats
normal = stats.norm(loc=0, scale=1)
print(f"CDF at 1.96: {normal.cdf(1.96):.4f}")
print(f"Inverse CDF at 0.975: {normal.ppf(0.975):.4f}")

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])
temperature = 0.7
scaled = logits / temperature
probs = np.exp(scaled - scaled.max()) / np.exp(scaled - scaled.max()).sum()
token = rng.choice(len(logits), p=probs)
print(f"Sampled token index: {token}")
```

Para el MCMC de gran tamaño, utilizar una biblioteca especial:
- PyMC: utiliza NUTS (HMC adaptativo) de modelo bayesiano completo
- emcee:ensemble MCMC muestreo
- NumPyro/JAX: MCMC acelerado por GPU

Ya has construido estos métodos desde cero. Ahora sabes que estas llamadas de la biblioteca están haciendo lo que haces.

##  ejercicios
1. Para una distribución poco rápida  lograr muestreo inverso de CDF。 CDF es F(x) = 0.5 + arctan(x) / pi。 generar 10.000 个 muestras,并把 histograma con el PDF 画在一起。

2. Utilize rejection sampling, via Uniform(0, 1) proposal 从 Beta(2, 5) distribución 生成样本──把 aceptadas muestras与真实Beta PDF 画在一起──¿cuál es la tasa de aceptación teórica?

3. Utiliza Monte Carlo, utiliza 1.000、10,000 和 100.000 个样本 估计 sin(x) desde 0 hasta pi de积分──比较每个级别的误差──验证误差按 O(1/sqrt(N)) 缩放──

4. 实现 Metropolis-Hastings, desde una distribución 2D en muestreo, de los cuales p(x, y) proporcionales a exp(-x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2)。 dibujar muestras 和 cadena trayectoria。尝试 diferentes propuestas desviaciones estándar。

5. 构建一个完整的文本生成演示:给定一个包含10个词及logits的词汇,使用 (a) codicioso、(b) temperatura=0.7、(c) top-k=3、((d) top-p=0.9 生成长度为20 Token 的序列──比较 5 次运行中输出的多样性──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Sampling | “抽取随机值” | 按照 probability distribution 生成数值。所有 generative AI 背后的机制 |
| Uniform distribution | “所有值同等可能” | [a, b] 中每个值都有相同 probability density 1/(b-a)。所有 sampling methods 的起点 |
| Inverse CDF | “概率变换” | F_inverse(U) 会把 uniform sample 转换成来自任意已知 CDF 分布的 sample。精确且高效 |
| Rejection sampling | “提出并接受/拒绝” | 从简单 proposal 中生成，按 target/proposal ratio 成比例的概率接受。精确但浪费 samples |
| Importance sampling | “重新加权 samples” | 使用来自 q(x) 的 samples，通过用 p(x)/q(x) 加权每个 sample，估计 p(x) 下的期望。RL 中 PPO 的核心 |
| Monte Carlo | “平均 random samples” | 将积分近似为 sample averages。误差 O(1/sqrt(N))，与维度无关 |
| MCMC | “会收敛的 random walk” | 构造一个 Markov chain，使其 stationary distribution 是目标分布。Metropolis-Hastings 是基础算法 |
| Metropolis-Hastings | “接受上坡，有时接受下坡” | 提出 moves，基于 density ratio 接受。Detailed balance 确保收敛到目标分布 |
| Gibbs sampling | “一次一个 variable” | 在固定其他 variables 的情况下，从每个 variable 的 conditional distribution 中更新。Acceptance rate 为 100% |
| Temperature | “置信度旋钮” | 在 softmax 前用 T 除以 logits。T<1 使分布更尖锐（更自信），T>1 使分布更平坦（更多样） |
| Top-k sampling | “保留最好的 k 个” | 除概率最高的 k 个 Token 外全部置零，重新归一化，然后 sampling。候选集合大小固定 |
| Nucleus sampling (top-p) | “保留可能性高的那些” | 保留累计概率超过 p 的最小 Token 集合。候选集合大小自适应 |
| Reparameterization trick | “把随机性移到外部” | 写成 z = mu + sigma * epsilon，其中 epsilon ~ N(0,1)。让 sampling 可微。VAE training 的关键 |
| Gumbel-Softmax | “软 categorical sampling” | 使用 Gumbel noise + 带 temperature 的 softmax，对 categorical sampling 做可微近似 |
| Stratified sampling | “强制覆盖” | 把 sample space 分成 strata，并从每个 stratum 中 sampling。方差总是低于 naive Monte Carlo |
| Burn-in | “预热期” | 在 chain 达到其 stationary distribution 之前丢弃的初始 MCMC samples |
| Detailed balance | “可逆性条件” | p(x) * T(x->y) = p(y) * T(y->x)。这是 p 成为 Markov chain stationary distribution 的充分条件 |
| Diffusion sampling | “迭代 denoising” | 从 noise 开始，并应用学到的 denoising steps 来生成数据。每一步都是 conditional sampling operation |

## 延伸阅读
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)-  Sobre el programa de formación de base del MCMC
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- Original Gumbel-Softmax 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- muestreo de núcleo (top-p) 论文
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍 trucos de reparameterización de VAE 论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- DDPM se conectará a la muestreo con la generación de imágenes
