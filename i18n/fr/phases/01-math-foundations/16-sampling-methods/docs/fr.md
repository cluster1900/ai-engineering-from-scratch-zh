# Méthodes d'échantillonnage

> L'échantillonnage est une façon d'explorer l'espace de possibilités de l'IA.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## Objectif de l'apprentissage
-  utilisation uniques de nombres aléatoires, à partir de zéro réalisation inverse CDF ‧ rejet et l'importance de l'échantillonnage
- Pour le modèle de langage Token 生成 Construction température、top-k 和 top-p (nucleus) prélèvement
- Expliquer le truc de réparamétrisation, ainsi que pourquoi il peut permettre de prendre des échantillons dans les VAEs
- 运行 Metropolis-Hastings MCMC, depuis la répartition de l'objectif de l'intégration

##  problématique
Un modèle de langage  achevé pour le traitement de votre prompt, produira un vecteur contenant 50 000 logits ⋅ Vocabulary dans chaque jeton pour le traitement de un ⋅ Maintenant, il doit choisir un ⋅ Comment choisir ?

Si elle choisit toujours le token le plus probable, chaque réponse sera entièrement la même. Si elle choisit toujours le plus probable, la sortie deviendra un code.

Le prélèvement d'échantillons n'est pas seulement utilisé pour la production de texte. Le renforcement de l'apprentissage. L'apprentissage de l'apprentissage. L'apprentissage de l'apprentissage de l'échantillon pour l'estimation des gradients politiques. Les VAE sont utilisés pour l'apprentissage de l'échantillon.

Chaque système génératif d'IA est un système d'échantillonnage. La stratégie d'échantillonnage décide de la qualité, de la diversité et de la maîtrise des résultats.

## 概念
### Pourquoi la prise d'échantillons est importante

L'échantillonnage dans l'IA et l'apprentissage automatique assume quatre rôles fondamentaux:

**Generation.**Les modèles de langage, les modèles de diffusion et les GAN sont utilisés pour le prélèvement des échantillons, produisant des sorties. L'algorithme de prélèvement de l'échantillon contrôle directement la création, la connectivité et la diversité.

**Training.**Prise d'échantillons de petits lots de dépôts de données. Prise d'échantillons de dépôts de données. Prise d'échantillons de données.

**Estimation.**Il n'y a pas de solution de forme fermée dans le ML. Les attentes de la distribution des données sur la perte de données.

**Exploration.**Les algorithmes MCMC explorent les distributions ultérieures dans les inférences bayésiennes. Les stratégies évolutionnistes examinent les perturbations des paramètres de l'échantillonnage.

Le défi principal est: vous ne pouvez que prendre directement des échantillons de la simple distribution (uniforme, normale)  Pour toutes les autres distributions, vous avez besoin d'une méthode, de transformer les échantillons simples en échantillons de la distribution cible 

### Prise de l'échantillon aléatoire uniforme

Chaque méthode d'échantillonnage débute ici. Le générateur de nombres aléatoires uniforme produit une valeur numérique en [0, 1], dont tout égal à égal à probabilité.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

Pour obtenir un échantillon uniforme dans le ensemble de n'éléments de séparation, générer U et revenir au sol(n * U)。 Pour obtenir un échantillon dans le groupe de continuité [a, b], calculer a + (b - a) * U。

关键洞察: un seul nombre aléatoire uniforme contient en fait une échantillon générée à partir d'une distribution arbitraire.

### Métode de CDF inverse (échantillonnage en transformation inverse)

La fonction de distribution cumulée (CDF) 会把数值映射到概率:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

CDF inverse 会把概率映射回数值──如果 U ~ Uniform(0, 1), alors X = F_inverse(U) 服从目标分布──

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

Lorsque vous pouvez écrire une forme fermée de F_inverse 时, cette méthode s'effectue parfaitement. Pour une distribution normale, il n'existe pas de CDF inverse de forme fermée, donc nous utilisons d'autres méthodes.

**离散版本：**Pour les distributions discrètes, construire le CDF en somme cumulée, générer U, puis trouver la somme cumulée supérieure à la première indice de U. Ceci est la leçon 06 en`sample_categorical`Le travail de la société

### Prélèvement d'échantillons de rejet

Lorsque vous ne pouvez pas revenir en arrière sur CDF, mais que vous pouvez évaluer l'objectif PDF en un nombre différent, le prélèvement de rejet est disponible.

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

Le taux d'acceptation est en baisse, car la plupart des projets seront rejetés.

**示例：从 truncated normal 中 sampling。**Dans la gamme tronquée, utilisez la proposition uniforme.

**示例：从 semicircle 中 sampling。**Dans le rectangle bordant, la proposition uniforme est acceptée. Si le point tombe dans un demi-cercle, il est accepté.

### Prélèvement d'échantillons d'importance

Il y a des moments où vous n'avez pas besoin d'échantillons de la distribution cible p(x) ⋅ vous avez besoin d'estimer les attentes de la distribution cible, et vous avez des échantillons d'une autre distribution q(x) ⋅

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

Ceci est très important dans l'apprentissage du renforcement. Dans le PPO (Propositional Policy Optimization), vous recueillez des trajectories dans les anciennes politiques, mais vous souhaitez optimiser les nouvelles politiques.

La différence entre les échantillons d'importance estimateur dépend de la similarité de q et p. Si q est très différent de p, une minorité d'échantillons obtiendra de grands poids et une estimation directe.

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### Évaluation de Monte Carlo

L'estimation de Monte Carlo 通过对随机样本 求平均来近似积分──Loi des grands nombres 保证其收──

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

Le taux d'erreur n'est pas lié à la dimension. C'est pourquoi, dans les situations de grande complexité où l'intégration sur grille est impossible à réaliser, les méthodes de Monte Carlo occupent la place dominante.

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

### Chaîne de Markov Monte Carlo (MCMC): Métropole-Hastings

Le MCMC construit une chaîne Markov, qui fait de sa distribution stationnaire une distribution cible de p(x)。 après avoir passé suffisamment de pas, les échantillons du milieu de la chaîne (approximativement) proviennent de p(x)。

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

Pour les propositions symétriques, le ratio serait simplifié par l'algorithme de la métropole.

**为什么有效。**Règle d'acceptation Garder l'équilibre détaillé: est dans x et ne se déplace pas à x' probabilité, égale à est dans x' et ne se déplace pas à x' probabilité.

**实践注意事项：**
- Brûlure: dans la chaîne  atteindre l' équilibre  avant de laisser tomber les échantillons précoces
- Éclairage: chaque échantillon est conservé pour réduire l'autocorrélation.
- Équelle de la proposition:太小会让链 移动缓慢(haute acceptation, lente exploration);太大会让大多数 de la proposition sont rejetées(faible acceptation, en place)
- Le taux d'acceptation le plus élevé de la proposition gaussienne est d'environ 0,234

### Prise d'échantillons de Gibbs

Le prélèvement d'échantillons de Gibbs est une sorte de MCMC spécialisée de distributions multivariées. Il ne propose pas une seule fois une démarche sur toutes les dimensions, mais chaque fois une variable est mise à jour à partir de la distribution conditionnelle.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

Le prélèvement de Gibbs vous demande de prendre des échantillons dans chaque distribution conditionnelle. Pour beaucoup de modèles, c'est très direct:
- Réseaux bayésiens: conditionnels de la structure du graphique
- Les mélanges gaussiens: conditionnels est gaussienne
- Modèles d'isage: chaque spin est conditionnel seulement dépendant de ses voisins

Le taux d'acceptation 总是 1 ((toutes les propositions ont été acceptées), car, à partir d'un échantillonnage conditionnel précis, le solde détaillé sera automatiquement satisfait.

**局限。**Lorsque les variables sont liées à hauteur, le mélange d'échantillons de Gibbs est lent, car une fois de plus, une variable ne peut pas faire de grands mouvements diagonales dans la distribution.

### Pratiques de température (pour les LLM)

Modèles de langage 会为词汇 中每个代号 输出 logits z_1, ..., z_V──Softmax 会把它们转换成概率──Temperature 会在软max 前重新缩放 logits:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**Avec T < 1 à l'extérieur des logits, la différence entre les logits sera augmentée. Si z_1 = 2 et z_2 = 1, avec T = 0,5 à l'extérieur, on obtiendra z_1/T = 4 et z_2/T = 2, la différence sera grande.

**实践中：**
- T = 0,0: décoding avide, le plus adapté à la réalité type Q&A
- T = 0,3-0,7: légèrement créatif, adapté à la génération de code
- T = 0,7-1,0: équilibre, adapté au dialogue général
- T = 1,0-1,5: écriture créative, brainstorming
- T > 1,5: à chaque fois, il est généralement très peu utile

La température ne changera pas quelles sont les jetons est possible. Elle changera la masse de probabilité distribuée à chaque jeton.

### Prise d'échantillons

Le top-k de l'échantillonnage limitera le groupe de candidats à la probabilité maximale de k 个 Token, puis il sera recaducé et prendra l'échantillon du groupe de cette restriction.

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

Le problème réside dans: peu importe comment le texte est écrit, le modèle est bien déterminé. Le modèle a une probabilité de 95%, le modèle permet encore 39 options de remplacement.

### Prélèvement d'échantillons de haut niveau (nucleus)

Le top-p de l'échantillonnage 会动态调整候选集合大小── ce n'est pas de conserver un nombre fixe de jetons, mais de conserver une probabilité cumulée supérieure à la plus petite collection de jetons de p──

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

Lorsque le modèle est bien compris, le prélèvement de noyau conservera très peu de jetons (~ 2-3) ⋅ lorsque le modèle est incertain, il conservera beaucoup (~ 200) ⋅ lorsque le modèle est bien compris, ce comportement d'auto-adaptation est la cause du prélèvement de noyau, généralement plus haut que le top-k.

**常见组合：**
- Température 0,7 + top-p 0,9: bonne mise en place
- Température 0,0 (compulsif): le plus adapté à la détermination des tâches
- Température 1.0 + haut-k 50:Fan et al. (2018)

Le top-k et le top-p peuvent être assemblés.

### Trick de réparamétrisation (appliqué aux VAE)

Le mode d'apprentissage des autoencoders variatifs (VAE) est de: mettre les entrées 编码 dans un espace latent, de cette distribution en prélèvement, puis de déchiffrer l'échantillon 解码回来── le problème est: vous ne pouvez pas passer par une opération d'échantillonnage  effectuer la Backpropagation──

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

La réparamétrisation va être séparée de l'accident et des paramètres:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

Ceci est donc valable, parce que N(mu, sigma^2) avec mu + sigma * N(0, 1) 具有相同分布──关键洞察是:把随机性移动到一个无参数源(epsilon), puis把表示样本为参数可微转化──

**在 VAE training loop 中：**
1. Encodeur pour chaque entrée 输出 mu 和 log sigma^2)
2. Pratique de l'épsilon ~ N(0, 1)
3. 计算 z = mu + sigma * épsilon
4. Décodez z 以 réconstruire l'entrée
5. Passer par l'étape 4 、3 、2 、1  effectuer la répartition de la propagation 可行, parce que l'étape 3 est possible)

 sans truc de réparamétrisation, les VAEs ne peuvent pas utiliser les normes de répartition  entraînement

### Gumbel-Softmax (échantillonnage catégorique)

Pour les distributions catégoriques séparées, nous avons besoin d'une autre méthode.

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

Gumbel-Softmax 会产生 дискрет sample 的连续松──输出是概率矢量(soft one-hot),而不是 hard one-hot──Gradients 会穿越 softmax 流动──在训练的前进通过中, vous pouvez utiliser un estimateur "straight-through":forward pass 使用 hard argmax, but backward pass 使用 soft Gumbel-Softmax gradients──

**应用：**
- Variables latentes discrètes au sein des VAE
- Recherche d'architecture neurale (opérations de sélection)
- Mécanismes d'attention dure
- 带 discrètes actions de renforcement de l' apprentissage

### Pratification stratifiée

Le prélèvement standard de Monte Carlo peut être dû à la nature aléatoire de l'espace d'échantillonnage dans lequel il reste un vide.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

Par rapport aux normes de Monte Carlo, la différence de l'échantillonnage stratifié est toujours plus faible ou similaire:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- Intégration numérique (quasi-Monte Carlo)
- Les données de formation sont divisées pour assurer l'équilibre entre les classes)
- 带 stratification importance échantillonnage 组合两种技术)
- NeRF (Neural Radiance Fields) À l'intérieur des rayons de caméra Utilisez l'échantillonnage stratifié

### Connexion aux modèles de diffusion

Modèles de diffusion  par le processus de prélèvement 生成图像──Forward process 会在 T 步中向图像添加高斯音,直到它变成纯噪音──Reverse process 学习指责,逐步恢复原始图像──

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

Contact avec le cours:
- Chaque étape dénonciatrice utilise le truc de réparamétrisation
- Le programme de bruit {alpha_t}  contrôle une température de réglage
- Formation utilisant l'estimation de Monte Carlo 来近似 ELBO (la limite inférieure des preuves)
- Les modèles de diffusion internes de l'échantillonnage ancestral est une chaîne de Markov (chaque étape dépend uniquement de l'état actuel)

L'ensemble du processus de production d'images est un échantillonnage itératif: à partir du bruit, à chaque étape, sur la base du modèle dénonciateur appris, échantillon une version un peu plus faible du bruit.


```figure
monte-carlo-pi
```

## - Je le construis.
### 步骤 1: Prélèvement d'échantillons CDF uniforme et inverse

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10,000 个指数样本,并验证均值为 1/lambda。

### 步骤 2: Prélèvement d'échantillons de rejet

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

Utilisation de l'échantillonnage de rejet de la distribution normale tronquée 中抽样──通过对样品 绘制 histogram 来验证形──

### 步骤 3: Prélèvement d'importance

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

Utiliser une proposition uniforme  Estimation de la répartition normale 下的 E[X^2]──与已知答案(mu^2 + sigma^2)

### 步骤 4: L'estimation de Monte Carlo de pi

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

### 步骤 5: MCMC de la ville de Hastings

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

De la distribution bimodal (réunion de deux gaussiens) dans le processus de prélèvement de l'échantillonnage.

### 步骤 6: Prise d'échantillons par Gibbs

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

### 步骤 7: Prise d'échantillons à température

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

how temperature 如何改变一组 Logits des jetons de la distribution de sortie

### 步骤 8: Prélèvement des échantillons de haut en bas et de haut en bas

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

### 步骤 9: Réglage de réparamétrisation

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

Les gradients peuvent passer par l'échantillon réparamétrié, mais ne peuvent pas passer par l'échantillonnage direct.

### 步骤 10: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

展示 réduire la température 如何让输出接近一热向量──

La réalisation complète et la réalisation visuelle sont en cours.`code/sampling.py`Dans le centre.

## Utilisez-le
Utilisation NumPy et SciPy 时,production 版本如下:

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

pour les MCMC de grande taille, utiliser des bibliothèques spéciales:
- PyMC: utiliser NUTS (HMC adaptatif) de la modélisation bayésienne complète
- écee:ensemble MCMC échantillonneur
- NumPyro/JAX: MCMC accéléré par GPU

Vous avez construit ces méthodes depuis le zéro. Maintenant, vous savez ce que ces appels bibliothécaires font.

## 练习
1. Pour une distribution précaire  réaliser l'échantillonnage inverse de CDF。 CDF est F(x) = 0,5 + arctan(x) / pi。 générer 10 000 个样本,并把 histogram 与真实 PDF 画在一起。注意重尾(远离中心的极端值)。

2. Utilisation de l'échantillonnage de rejet, par le biais de l'uniforme ((0, 1) proposition de la Beta ((2, 5) distribution 生成 échantillons。把 acceptés échantillons avec réel Beta PDF 画在一起。 taux d'acceptation théorique est combien?

3. Utilisation de Monte Carlo, avec 1000、10,000 和 100,000 个样本 估计 sin(x) de 0 à pi 的积分──比较每个级别的误差──验证误差按 O(1/sqrt(N)) 缩放──

4. 实现 Metropolis-Hastings, à partir d'une distribution 2D, dans laquelle p ((x, y) est proportionnelle à exp ((-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2);;

5. 构建一个完整的文本生成演示:给定一个包含10个词及 logits的词汇,使用 (a) cupid、(b) temperature=0.7、((c) top-k=3、((d) top-p=0.9 生成长度为20 Token 的序列──比较 5 次运行中输出的多样性──

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
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)-  sur les cours détaillés de la base du MCMC
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- Origini Gumbel-Softmax 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- prélèvement d'échantillons de noyau (top-p)
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍 Régulation de la réparamétrisation de la VAE 论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- DDPM va relier l'échantillonnage à la génération d'images
