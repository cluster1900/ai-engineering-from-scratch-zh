# Descodación especulativa y EAGLE

> Frontier LLM 生成 Token 需要对数十亿参数进行一次完整前传的配置远超实际需求: la mayoría de las veces, un modelo pequeño y mucho más puede adivinar correctamente los próximos 3-5 Tokens, mientras que el modelo grande sólo necesita *verificar* esta adivinación.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

##  problemas

Modelo de categoría 70B en el H100, el rendimiento de descodage suele ser de 40-80 tokens/segundo. Cada token necesita una sola pasada completa hacia adelante, desde HBM.

La generación autoregresista parece natural.`x_{t+1} = sample(p(· | x_{1:t}))`Pero aquí hay una oportunidad. Si tienes un predictor barato, puedes tener los siguientes 4 tokens.**大 model 的单次 forward pass**En la verificación de todas las 5 posiciones,并接受最长匹配前──

Leviathan, Kalai, Matias, 2023, Inferencia rápida de Transformers a través de Descodage Especulativo) a través de una巧妙的 aceptación/rechazo 规则精确实现这一点,该规则保留目标模型的样本分布──相同的输出分布,速度提升 2-4x──

## 概念

### 双 Modelo  configuración

- **Target model** `M_p`Es un modelo de gran tamaño, lento y de alta calidad.`p(x)`¿Qué es eso?
- **Draft model** `M_q`Modelo de menor calidad:`q(x)`✿小 5-30x✿

Cada paso:

1. Proyecto de modelo autoregresivamente 提议 `K`个 Token:`x_1, x_2, ..., x_K ~ q`¿Qué es eso?
2. Modelo objetivo para todos`K+1`个位置并行运行 一次前进通行,为每提议代币 生成 `p(x_k)`¿Qué es eso?
3. 按下面修改后的拒绝-sampling 规则从左到右接受/拒绝 每个代币──接受最长匹配前──
4. Si cualquier token es rechazado, entonces la distribución de la modificación posterior se sustituye por el token y se detiene.`p(· | x_1...x_K)`采样一个奖金代币──

Si el proyecto se ajusta perfectamente al objetivo, puedes obtener 1 Token K+1 en cada intento. Si el proyecto está en la posición 1 está equivocado, solo puedes obtener 1 Token.

###  精确性规则

Descifrado especulativo **在 distribution 上可证明等价于从 p 采样** Reglas de rechazo:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

Entre ellos `(p - q)+`Indicar el valor de diferencia de puntos.`p ≈ q`Cuando se encuentran en una situación de desacordo, la distribución residual se construye para que la muestra entera siga siendo determinada.`p`¿Qué es eso?

**Greedy 情况。**Para el muestreo de temperatura, sólo se necesita inspeccionar.`argmax(p) == x_t`Si es, entonces acepta; si no, entonces, entonces,`argmax(p)`Y no se detiene.

### 期望 Aceleración

Si el tipo de aceptación de los tokens es `α`, entonces cada paso de destino hacia adelante 生成的期望代币 数为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

Cuando`α = 0.8, K = 4`¿Qué es esto ?`(1 - 0.8^5)/(1 - 0.8) = 3.36`个 Token Cada vez adelante. 个目标前的成本大约是`cost_q * K + cost_p`(K 个 proyecto paso加一次目标验证)`cost_p >> cost_q * K`,la velocidad de la velocidad de rendimiento es`3.36× / 1 = 3.36×`¿Qué es eso?

El único parámetro real es`α`, depende completamente del alineamiento del proyecto-objetivo.

### 训练 Draft:Destilación

随机的小模型会成为非常差的草案――la práctica estándar es destilar desde el objetivo:

1. 选择一个小建筑(70B objetivo a la hora de 1B,7B objetivo a la hora de 500M)
2. En la gran escala del texto de la lenguaje de ejecutar el modelo objetivo; almacenar sus siguientes tokens de distribución.
3. Utiliza el proyecto de divergencia KL, haciendo que su distribución de destino coincida con la de la realidad de la tierra)

El resultado es:`α`En codificación, normalmente es de 0.6-0.8, en chat en lengua natural, es de 0.7-0.85― en producción, es de 2-3x―.

### EAGLE:Drafting de árbol + Reutilización de las características

Li、Wei、Zhang、Zhang(2024,EAGLE: Muestreo especulativo Requiere repensar la característica incertidumbre) observar al estándar de descifrado especulativo 中的两个低效点:

1. Draft   个串行步骤, cada uno es una pila completa. Pero el proyecto puede ser revisado con las características ocultas de la meta en el medio de la prueba, ya que la meta ya ha calculado representaciones abundantes, y el proyecto está en proceso de re-realización de ellas.
2. Draft 输出一条线性链──如果草案 能输出一个候选人 *tree*(每个节点有多个猜测),target的单次进步通过树注意面具并行验证多条候选人路径,并选择最长接受分支──

Variaciones de EAGLE-1:
- Introducción de borrador = objetivo en el estado oculto final de la posición t, en lugar de tokens crudos.
- Arquitectura de proyecto = 1 个 transformer decoder layer (no es un pequeño modelo independiente)
- Producción = cada profundidad tiene K = 4-8 candidatos √ profundidad 为 4-6 árboles √

EAGLE-2(2024) 加入动态 árbol topología: en el proyecto de posición no determinada, árbol 变宽; en el proyecto de posición de confianza, árbol 保持较窄──在不增加验证成本的情况下提高 `α_effective`¿Qué es eso?

EAGLE-3(Li et al. 2025,EAGLE-3: Escalado de la aceleración de la inferencia de los modelos de lenguaje grande a través de la prueba de tiempo de entrenamiento) se ha eliminado la dependencia de la función de capa superior fija, y se ha utilizado un nuevo proyecto de entrenamiento simulación de tiempo de prueba pérdida , también se trata de hacer que en el proyecto de entrenamiento de la distribución de tiempo de prueba objetivo de la distribución de resultados, en lugar de en la distribución de entrenamiento forzado por el profesor ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡

### Verificación de la atención de los árboles

Cuando se diseña 输出树 时,target model **tree attention mask**En el pase de seguimiento único, verifique que la máscara de atención del árbol es una máscara causal, que codifica la topología del árbol, no la estructura lineal pura. En cada token sólo se atende a los antepasados que lo rodean en el árbol. En el pase de seguimiento, se sigue siendo una máscara matmul; máscara topológica sólo necesita una pequeña cantidad de entradas KV adicionales.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

Si es que`a, b`Es el primer candidato de la competencia,`c, d, e, f`Si los candidatos son de segundo token, entonces todas las seis posiciones pueden ser verificadas en un solo pase hacia adelante.

### ¿Cuándo es efectivo, cuándo es inefficiente?

**有效：**
- Chat / completado, y文本可预测(código、常见 inglés、producción estructurada)`α`¿Qué es esto?
- Decodificación 阶段有未使用GPU computación 的设置(memoria-bound phase) ――arbolismo de árbol 使用可用 FLOPs──

**无效 / 没有收益：**
- ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎ ◎`α`¿ Cómo ?`1/|vocab|`Bajo abajo.
- 非常高的同步性的批发服务,批发已经填满了FLOPs,树验证的空间很小──
- Muy pequeños modelos objetivo, en este momento el proyecto no tiene muchos pequeños.

Los equipos de producción suelen informar de chat, de 2-3 veces la velocidad del reloj de la pared, de la generación de código, de 3-5 veces, mientras que la escritura creativa, de casi cero.


```figure
speculative-decoding
```

## Construirlo

`code/main.py`¿Qué es esto ?

- Una referencia a la realización`speculative_decode(target, draft, prompt, K, temperature)`, realiza el rechazo preciso 规则,并验证 conserva la distribución del objetivo (en el caso de la muestra de objetivo)
- Un dibujante de árbol estilo EAGLE, usando ramas de p de arriba 构建深度K tree。
- Un constructor de máscara de atención de árbol, para verificar el patrón causal correcto.
- Un arnés de tasa de aceptación, en pequeño LM 上运行两者(de un objetivo medio GPT-2-destilar un pequeño GPT-2-)

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## Usalo

- **vLLM**Y **SGLang**提供一等 descodación especulativa 支持──Banderas:`--speculative_model`¿Qué es esto?`--num_speculative_tokens`◊Eagle-2/3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `--spec_decoding_algorithm eagle`bandera 支持。
- **NVIDIA TensorRT-LLM**Origin生支持 Medusa 和 EAGLE árboles
- **Reference draft models**¿Qué es esto ?`Qwen/Qwen3-0.6B-spec`(Para utilizar los proyectos de Qwen3-32B)`meta-llama/Llama-3.2-1B-Instruct-spec`(Para los proyectos de 70B)
- **Medusa heads**(Cai et al. 2024, Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads): no utiliza el modelo de borrador, sino que en el objetivo 自身添加 K 个并行预测头部──部署更简单,acceptance 略低于EAGLE──

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-speculative-tuning.md`, es una habilidad, para analizar la carga de trabajo del modelo objetivo,并选择: modelo de borrador、K(duración del borrador)、ancho del árbol、temperatura,以及何時 fallback hasta el decodificación simple―

##  ejercicios

1. 实现精确拒绝 规则并进行实证验证──通过 `speculative_decode`Y muestreo objetivo simple 分別运行 10K muestras; calcular dos distribuciones de salida 间电视距离──应小于0.01──

2. 计算加快公式──给定固定 `α`Y `K`, dibujar cada vez el objetivo-avance de la expectativa Token número── encontrar el ∈ {0.5, 0.7, 0.9} 时的最优 K──

3. entrenar un pequeño borrador──Toma un objetivo de 124M GPT-2 y luego destila un borrador de 30M GPT-2 `α` Previo tiempo: 0,6-0,7

4. 实现 EAGLE-style tree drawing── no usar cadena, sino hacer el proyecto en cada profundidad 输出 3 ramas principales── construir una máscara de atención al árbol──验证 objetivo 接受最长正确分支──

5. 测量 failure modes──在 temperature=1.5(高随机性) 下运行 especulativo decodificar──展示 α 崩塌,并且由于草案 overhead,该算法比平面 decodificar 更慢──

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind 的 concurrencia especulativa-muestreo 论文
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) proyecto de modelo de cabezas paralelas  sustitución de esquema
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) reutilización de las características y dibujo de árboles
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态 Topología de árboles
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) Comparecimiento entre el tiempo de prueba y el tiempo de trenes
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) Descodación Jacobi/lookahead, un tipo de alternativa que no necesita especulador
