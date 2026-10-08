# Métodos de amostragem

> A amostragem é uma forma de explorar a possibilidade de AI.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## Objectivo de aprendizagem
-  Utilizando apenas números aleatórios uniformes, a partir do zero realizar a reversão CDF 、 rejeição  e amostragem de importância
- Para o modelo de linguagem Token 生成 Construção de temperatura, top-k 和 top-p (núcleo) amostragem
- Explicar o truque de reparametrização, bem como por que ele pode fazer amostragem entre os VAEs  apoiar a retropropagação
- 运行 Metropolis-Hastings MCMC, desde a atribuição de um objetivo de distribuição

## 问题
Um modelo de linguagem  completando o processamento do seu prompt, irá gerar um que contém 50.000 logos de vector── cada token no vocabulário para um── agora ele deve escolher um── como escolher?

Se ele sempre for selecionar o token com maior probabilidade, cada resposta será completamente igual.

Amostragem não é apenas usada para a produção de texto. Reforço Aprendizagem  através de trajetórias de amostragem para estimar gradientes de política.  VAE  através de amostragem entre a aprendizagem e a distribuição  através de qualquer tipo de propagação posterior  através de representações latentes  Modelos de difusão  através de ruído de amostragem  através de denotação  através da produção de imagens.

Cada sistema de IA gerativa é um sistema de amostragem. A estratégia de amostragem determina a qualidade, a diversidade e a capacidade de controle da produção.

## 概念
### Por que é importante tomar amostras

A amostragem em IA e Machine Learning assume quatro roles básicos:

**Generation.**Modelos de linguagem, modelos de difusão e GANs são utilizados através de amostragem, produzindo e produzindo resultados.

**Training.**Estocástico Gradiente Descenso 会 amostragem mini-parches。Dropout 会 amostragem ⇒ parar de usar neurônios。Aumento de dados 会 amostragem de transformações aleatórias。Importância amostragem 会对样本重新加权,以降低强化学习 (PPO, TRPO) 中的 Gradient 方差──

**Estimation.**Muitas quantidades em ML não têm solução fechada. A expectativa de distribuição de dados Perda. Função de partição do modelo baseado em energia.

**Exploration.**Algoritmos MCMC em inferência Bayesiana explorar distribuições posteriores. Estratégias evolutivas, muestreo de parâmetros perturbações.

O desafio central é: você só pode tomar amostras diretamente de uma distribuição simples (uniforme, normal) e para todas as outras distribuições, você precisa de um método para transformar amostras simples em amostras de distribuição objetiva.

### Amostra aleatória uniforme

Cada método de amostragem começa por aqui. Um gerador de números aleatórios uniforme produz um valor numérico em [0, 1], em que qualquer um dos grupos de tamanho tem uma probabilidade de tamanho.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

Para fazer uma amostragem uniforme de um conjunto de elementos separados, gerar U e retornar ao piso,

关键洞察: um único número aleatório uniforme 恰好包含从任意分布中生成一个样本的随机性――技巧在找到正确的转变――

### Método de CDF inverso (análise de transformação inversa)

Função de distribuição cumulativa (CDF) 会把数值映射到概率:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

CDF inversa 会把概率映射回数值──若 U ~ Uniform(0, 1), então X = F_inverse(U) 服从目标分布──

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

Quando você pode escrever F_inversos de forma fechada, este método é perfeito. Para a distribuição normal, não há CDF inverso fechado, portanto, usamos outros métodos.

**离散版本：**Para distribuições discretas, traz o CDF para a soma cumulativa, gerar U, e depois encontrar a soma cumulativa  exceção do primeiro índice de U.`sample_categorical`O que é que é o trabalho?

### Rejeição de amostras

Quando você não pode reverter CDF, mas pode avaliar o objetivo em um determinado número constante, a amostragem de rejeição é possível.

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

Em média, a taxa de aceitação é muito baixa, mas a taxa de aceitação é muito baixa, o que significa que a rejeição é uma maldição de dimensão.

**示例：从 truncated normal 中 sampling。**Em um intervalo truncado, use a proposta uniforme. Envelope M é o valor máximo normal do PDF dentro do mesmo intervalo.

**示例：从 semicircle 中 sampling。**Em um retângulo delimitado, uma proposta uniforme é aceita. Se um ponto cair em um semicírculo, é aceita.

### Importância da amostragem

Às vezes você não precisa de amostras de uma distribuição q (x) de destino. Você precisa de estimar as expectativas de p (x) de destino.

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

Este é um processo de aprendizagem de reforço muito importante. Em PPO (Proposal Policy Optimization), você está na política antiga, mas espera otimizar a nova política pi_nova.

A diferença entre o estimador de amostragem de importância depende da similaridade entre q e p. Se q e p forem muito diferentes, uma pequena quantidade de amostras obterá pesos enormes e gerará uma estimativa.

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### Estimação de Monte Carlo

Estimação de Monte Carlo  através de amostras aleatórias  procura média para aproximação .

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

A taxa de erro não tem relação com a dimensão. É por isso que, no cenário de alta dimensão em que a integração baseada em rede não é possível realizar, os métodos de Monte Carlo ocupam a posição dominante.

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

### Markov Chain Monte Carlo (MCMC):Metropolis-Hastings

MCMC construir uma cadeia de Markov, fazendo com que sua distribuição estática seja a distribuição objetivo p(x)。 atravessado suficientemente muitos passos depois, as amostras no meio da cadeia 就(近似) são amostras provenientes de p(x)。

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

Para as propostas simétricas, o teor de "metrópole" é o algoritmo original.

**为什么有效。**Regra de aceitação Garantizar o equilíbrio detalhado: está em x e não se move para x' probabilidade, igual ao está em x e não se move para x probabilidade.

**实践注意事项：**
- Combustão: na cadeia  atingir o equilíbrio  antes de abandonar as amostras iniciais
- Diminuição: por cada amostra, mantenha uma, para reduzir a autocorrelação
- Escala de proposta:太小会让链 移动缓慢(alta aceitação, exploração lenta);太大会让大多数提案被拒绝(low acceptance, stuck in place)
- 高维中 A melhor taxa de aceitação da proposta gaussiana é de cerca de 0,234

### Amostração de Gibbs

A amostragem de Gibbs é uma MCMC especial de distribuições multivariadas. Não é uma vez em todas as dimensões, mas cada vez que a distribuição condicional renova uma variável.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

A amostragem de Gibbs exige que você possa amostragem de cada distribuição condicional p ((x_i  x_i ) 
- Redes Bayesianas: Condições de estrutura do gráfico
- Misturas gaussianas: condicionais é gaussianas
- Modelos de ising: cada spin é condicional dependendo apenas de seus vizinhos

Taxa de aceitação 总是 1 ((cada proposta foi aceita), pois a partir de uma amostragem condicional precisa irá automaticamente satisfazer o equilíbrio detalhado。

**局限。**Quando as variáveis estão relacionadas à alta intensidade, a mistura de amostras de Gibbs é muito lenta, pois uma vez que uma variável é atualizada, não é possível fazer grandes movimentos diagonais na distribuição.

### Amostragem de temperatura (para LLM)

Modelos de linguagem 会为词汇 中每个代号 输出 logits z_1, ..., z_V──Softmax 会把它们转换成概率──Temperature 会在软max 前重新缩放 logits:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**Usando T < 1 exceto em logits 会放大 logits 之间的差异──如果 z_1 = 2 且 z_2 = 1, usando T = 0.5 除后得到 z_1/T = 4 和 z_2/T = 2,使差异变大──经过软max 后,最高 logit 的 Token 会获得更大的概率份额──

**实践中：**
- T = 0,0:descodificação gananciosa, mais adequada ao tipo de Q&A
- T = 0,3-0,7: um pouco criativo, adequado à geração de código
- T = 0,7-1,0: equilibrio, adaptado ao diálogo geral
- T = 1,0-1,5: escrita criativa, brainstorming
- T > 1,5: sempre mais útil

A temperatura não mudará quaisquer Tokens é possível.

### Amostração de Top-k

Top-k sampling irá limitar o conjunto de candidatos para a probabilidade máxima de k 个 Token, depois reintegrar, e fazer a amostragem do conjunto de restrições.

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

Top-k 会防止模型选择极低概率的 Token (tokońń, 拼写错误、无意义内容), estes Token 存在于词汇分布的长尾中. O problema é: não importa como, k 都是固定的.

### Amostragem de topo (núcleo)

Top-p sampling 会动态调整候选集合大小── não retém um número fixo de Tokens, mas retém uma probabilidade acumulada superior a p do mínimo Token 集合──

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

Quando o modelo é muito claro, a amostragem de núcleo irá manter muito pouco de Token (((possivelmente 2-3 个) ⋅ Quando o modelo é incerto, ela vai manter muito (((possivelmente 200 个) ⋅ Este comportamento de auto-adaptação é a amostragem de núcleo geralmente é a causa do top-k.

**常见组合：**
- Temperatura 0,7 + top-p 0,9: boa configuração geral
- Temperatura 0,0 (com avidez):最适合确定性任务
- Temperatura 1.0 + top-k 50:Fan et al. (2018)

Top-k 和 top-p pode ser combinado. Primeiro aplicar top-k, novamente em restante conjunto aplicar top-p.

### Tricolor de reparametrização (para VAEs)

O método de aprendizagem dos autoencodadores variáveis (VAEs) é: colocar as entradas codificadas em uma distribuição no espaço latente, amostragem a partir dessa distribuição, e depois colocar a amostra 解码回来── o problema é: você não pode passar por uma operação de amostragem  realizar Backpropagation──

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

Tricol de reparametrização irá separar o azar e o parâmetro:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

É por isso que é válido, é porque N (mu, sigma^2) com mu + sigma * N (0, 1) 具有相同分布──关键洞察是:把随机性移动到一个无参数源 (epsilon),然后把表示样本为参数可微转换──

**在 VAE training loop 中：**
1. Encoder para cada entrada 输出 mu 和 log(sigma^2)
2. Amostra de epsilon ~ N(0, 1)
3. 計算 z = mu + sigma * epsilon
4. Decodificar z 以 re-construir entrada
5. 穿过步骤 4、3、2、1   realizar Backpropagation(可行, pois o passo 3 é可微的)

Sem truque de reparametrização, os VAEs não podem usar o padrão de treinamento de repropagação.

### Gumbel-Softmax ((可微的 Categorical Sampling)

Para distribuições categóricas separadas, precisamos de outro método.

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

Gumbel-Softmax 会产生 дискретная проба 的连续松──输出是概率矢量(soft one-hot),而不是 hard one-hot──Gradientes 会穿越 softmax 流动──在训练的前进通过中,你可以使用"直穿"估计器:forward pass 使用hard argmax,但后进通过 使用软 Gumbel-Softmax梯次──

**应用：**
- Variaveis latentes discretos entre as VAEs
- Pesquisa de arquitetura neural (opções de seleção)
- Mecanismos de atenção rígidos
- 带 discrete actions of Reinforcement Learning 带 discrete actions of reinforcement learning 带分别行动的加強学习 带分别行动的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強学习 的加強

### Amostragem estratificada

 padrão de amostragem Monte Carlo  possibilitá  devido à arbitrariedade no espaço de amostragem                                                                                                                                                                                                                                                

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

Em comparação com o padrão de Monte Carlo, a diferença entre as amostras estratificadas é sempre menor ou similar:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- Integração numérica (quasi-Monte Carlo)
- Divisões de dados de treinamento ((assure cada dobra do equilíbrio de classe)
- 带 stratificação 带 stratificação 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification  带 stratification   带 stratification                                                                                                                                                                                                                                                                                                                                                                
- NeRF (Neural Radiance Fields) Reios de câmera Usar amostragem estratificada

### Conexão a modelos de difusão

Modelos de difusão através do processo de amostragem 生成图像──Forward process 会在 T 步中向图像添加高斯音,直到它变成纯噪音──Revers process 学习指责,逐步恢复原始图像──

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

Contacto com este método de ensino:
- Cada passo de denúncia utilizam o truque de reparametrização (sample noise, aplicando transformação determinista)
- Programa de ruído {alpha_t}  controlar uma temperatura de anelação
- Formação usando a estimativa de Monte Carlo 来近似 ELBO (evidência limite inferior)
- Modelos de difusão entre as amostras ancestrais é uma cadeia de Markov (cada passo depende apenas do estado atual)

Todo o processo de produção de imagens é um amostragem iterativa: a partir do ruído, em cada passo, baseado no modelo de denúncia aprendido, a amostra é uma versão de ruído um pouco menor.


```figure
monte-carlo-pi
```

## Construí-lo
### 步骤 1: Amostragem uniforme e inversa de CDF

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10,000 个指数样本,并验证均值为 1/lambda──

### 步骤 2: Amostra de rejeição

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

Utilize rejeição de amostragem de distribuição normal truncada 中抽样──通过对样品 绘制 histogram 来验证形──

### 步骤 3: Amostragem de importância

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

Utilize uniform proposal  estimar distribuição normal 下的 E[X^2]──与已知答案(mu^2 + sigma^2)

### 步骤 4: Estimação de Monte Carlo de pi

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

### 步骤 5: Metropolis-Hastings MCMC

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

A partir da distribuição bimodal (a mistura de dois Gaussianos) entre a amostragem e a trajetória da cadeia de visualização.

### 步骤 6: Amostração de Gibbs

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

### 步骤 7: Amostragem de temperatura

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

 demonstrar temperatura  como mudar um grupo de logitos de tokens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

### 步骤 8: Amostragem de ponta e ponta

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

### 步骤 9: truque de reparametrização

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

Os gradientes podem atravessar a amostra reparametrizada, mas não podem atravessar a amostragem direta.

### 步骤 10: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

Demonstrar a redução da temperatura como fazer a saída aproximar-se do vetor de um só calor.

Realização completa e visibilidade`code/sampling.py`- Não.

## Use-o
Utilize NumPy 和 SciPy 时,produção 版本如下:

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

Para a MCMC de grande dimensão, utilizar uma biblioteca especializada:
- PyMC: usar NUTS (HMC adaptativo)
- emcee:ensemble MCMC sampleler
- NumPyro/JAX: MCMC acelerado por GPU

Já construíste estes métodos desde o zero. Agora sabes que estas bibliotecas chamam para fazer o quê?

## 练习
1. Para distribuição coquete  realizar amostragem CDF inversa。 CDF é F(x) = 0,5 + arctan(x) / pi。 gerar 10.000 个样本,并把 histogram 与真实 PDF 画在一起。

2. Utilize rejeição de amostragem, através Uniform(0, 1) proposta de Beta(2, 5) distribuição 生成サンプル──把 aceite amostragem de verdade Beta PDF 画在一起── teorical acceptance rate 是多少?

3. Utilize Monte Carlo, use 1,000、10,000 和 100,000 个样本 估算 sin(x) de 0 até pi 的积分──比较每个级别的误差──验证误差按 O(1/sqrt(N)) 缩放──

4. 实现 Metropolis-Hastings, de uma distribuição 2D, de amostragem, entre as quais p ((x, y) proporcional a exp ((-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2);; desenhar amostras 和 cadeia de trajetória;; tentar diferentes desvios padrão de proposta;;

5. 构建一个完整的文本生成演示:给定一个包含 10 个词及 logits的词汇,使用 (a) coveto、(b) temperatura=0,7、((c) top-k=3、((d) top-p=0,9 生成长度为 20 Token 的序列──比较 5 次运行中输出的多样性──

## 关键术语
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
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)-  Sobre o programa de ensino da MCMC
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- Origins Gumbel-Softmax 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- amostragem de núcleo (top-p)
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍 truque de reparameterization de VAE 论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- DDPM irá ligar a amostragem à geração de imagens
