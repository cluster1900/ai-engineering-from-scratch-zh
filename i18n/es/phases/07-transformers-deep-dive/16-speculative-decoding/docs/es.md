# Descodación especulativa  Draft、Verify、Repetir

> El decodificación autoregressiva es una serie de acciones. Cada token tiene que esperar a que se produzca un token. El decodificación especulativa rompe esta cadena: un modelo barato primero se elabora un token, un modelo caro se verifica en un pase a la vista.

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 07 (LM Causal de la GPT), Fase 7 · 12 (KV Cache & Flash Attention)
**Time:** ~60 minutes

##  problemas

Un proyecto de ley de 70B en H100 上采采样一个代币 需要约30 ms.一个3B草案模型 需要约3 ms.`5×3 + 30 = 45 ms`, el máximo aceptable 5 Tokens; y la generación directa necesita `5×30 = 150 ms`── ése es el punto de venta completo de la descodificación especulativa: con poca cantidad extra de memoria GPU (modelo de borrador) en cambio de 24× más baja latencia de decodificación──

关键在必须保留分布──Leviathan et al. (2023) y Chen et al.**完全相同**No hay un corte de calidad.

Para 2026, cuatro clases de verificadores de proyectos 组合主导推论:

1. **Vanilla speculative (Leviathan 2023)。**独立草案模型 (e.g. Llama 3 1B) + verificador (e.g. Llama 3 70B) ⋅
2. **Medusa (Cai 2024)。**En el verificador, añadir varios cabezas de decodificación,并行预测位置 `t+1..t+k` No necesita un modelo de proyecto independiente
3. **EAGLE family (Li 2024, 2025)。**复用验证器 ocultos estados de la ligería del borrador; tasa de aceptación por encima de la vainilla 更接近; típicamente 34×。
4. **Lookahead decoding (Fu 2024)。**Iteración de Jacobi; totalmente no necesita modelo de proyecto―Self-speculación―小众但没有依赖―

Cada pila de inferencias de producción de 2026 años están de acuerdo a proporcionar Descodage especulativo.

## 核心概念 核心概念 核心概念 核心概念

### 核心算法 核心算法 核心算法 核心算法

给定一个验证器 `M_q`Y un proyecto más barato `M_p`¿Qué es esto ?

1. ¿ Qué ?`x_1..x_k`Por lo que ya se ha decodificado.
2. **Draft**: utilizar `M_p`autoregresivamente 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`, para hacer frente a los proyectos de probabilidades`p_1..p_N`¿Qué es eso?
3. **并行 verify**En el`x_1..x_k, d_{k+1}, ..., d_{k+N}`Una vez más.`M_q`, conseguir la posición`k+1..k+N+1`Las probabilidades de verificación `q_1..q_{N+1}`¿Qué es eso?
4. **从左到右 accept/reject 每个 draft token**: para cada uno `i`, en la probabilidad`min(1, q_i(d_i) / p_i(d_i))`¿Qué es esto?
5. En su posición`j`Primera rechazo: Distribución "residual" de la regeneración posterior`(q_j - p_j)_+`En el caso de la`t_j`¿Qué es eso?`j`Después todos los proyectos fueron abandonados.
6. Si todo es así.`N`个都被接受: desde `q_{N+1}`采样一个额外Token `t_{N+1}`(títol de bono gratis)

Distribución residual Esta técnica es hacer que la distribución de salida con`M_q`Desde el principio de la matemática perfectamente coincidente.

### ¿Qué decide acelerar

¿ Qué ?`α`= tasa de aceptación esperada de cada proyecto de token `c`= relación de costes entre proyectos y verificadores── en cada paso:

- Generación ingenua Cada token necesita una llamada de modelo grande
- Cuando`α`很高时, Especulativo cada `(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`个 Token 需要一次大型号调用──

En el`α = 0.75`且 `N = 5`时,典型经验法则是: llamada de gran modelo 减少 3×──Draft cost es 5× barato──总体墙钟 约下降 2.5×──

**α 取决于：**

- El nivel de aproximación del proyecto al verificador.
- Estrategia de decodificación. Draft codicioso.
- Tipo de tarea―Code y salida estructurada 接受更多(更可预测);自由形式创意写作接受更少──

### Medusa  没有 proyecto modelo 的草案

Medusa utiliza verificador                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `t`¿Qué es esto ?

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

Cada cabeza 输出自己的logits. Inferencia 时, usted de cada cabeza 采样得到候选序列, luego utilizar una vez adelante pase 和 árbol-atención esquema 同时考虑所有候选继续来验证.

优点:没有第二个模型──缺点: aumentar los parámetros entrenables; necesita un ajuste fino supervisado 阶段(约1B Token); tasa de aceptación 比使用优秀草案的略低──

### ÁGuila                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

EAGLE-1/2/3 (Li et al., 20242025) diseñará un modelo de proyecto diseñado para un transformador muy pequeño, generalmente de 1 capa, para ingresar a estados ocultos de última capa del verificador.

EAGLE-3 (2025)  se ha incorporado a la búsqueda de árboles para la continuación de los candidatos.

### Danza de caché KV

La verificación se hará`N`个草案代币 在一次前传中给验证器──这将把验证器的 KV缓存 扩展 `N`项── Si algunos proyectos son rechazados, debes guardar la caché de vuelta a la longitud del prefijo aceptado──

Producción de la realización de la`--speculative-model`、TensorRT-LLM's LookaheadDecoder) a través de rascar los buffers KV 处理这个事物──先写入,接受时再 commit──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

## Construirlo

¿ Qué ?`code/main.py` Nosotros utilizamos los siguientes componentes para lograr el algoritmo de muestreo especulativo central:

- Un "modelo grande", que es determinista-softmax en la distribución de escritura manual, así se puede resolver la matemática de aceptación)
- Un "modelo de borrador", es una versión perturbada del modelo grande.
- Una distribución marginal similar a la de la muestreo directa, generada por un ciclo de aceptación/rechazo.

### Paso 1: Paso de rechazo

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`Es un número aleatorio uniforme.`q_prob`Es un verificador de la probabilidad de los tokens redactados.`p_prob`Es probable que el modelo de proyecto. El teorema de Leviathan señala que esta decisión de Bernoulli, además del rechazo, puede ser restringida en la distribución del verificador.

### 步骤 2: Distribución residual

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `q`En el medio`p`, clampando el valor negativo hasta el cero, luego volver a ser reintegrado.

### Paso 3: Un paso especulativo

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个奖金 → 一次验证通过 生成六个代币──

### Paso 4: Medir la tasa de aceptación

En diferentes proyectos de calidad 水平下运行 10,000 个投机步骤――绘制接受率与草案和验证器 分布之间 KL divergencia关系――你应该看到清晰的单调关系――

### Paso 5: Evaluación de la distribución de precios

 تجرب验证: especulative loop 生成的Token 直方图应匹配直接从验证器采样得到的直方图――这是实践中的利维亚坦定理――Chi-square test 会确认差异在样本错误范围内――

## Usalo

Producción:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

截至 2026年中, TensorRT-LLM 拥有最快的梅杜萨路径──`faster-whisper`Por susurros grandes, se ha hecho una descifrada especulativa.

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- Sólo genera 15 个 Token de generación de secuencia única──Overhead 占主导──
- 极具创意 / Muestreo de alta temperatura ((α 会下降) ⋅
- Despliegues con restricciones de memoria (Memory-Constrained Deployments)

##  entregarlo

¿ Qué ?`outputs/skill-spec-decode-picker.md`◊ esta habilidad 会为新推理工作负载 选择一种Speculative Decoding strategy (en inglés) ◊ vanilla / Medusa / EAGLE / lookahead) y parámetros de ajuste (en inglés) ◊ N、temperatura de borrador) ◊

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Confirmar en 50.000 Token 上, distribución especulativa de tokens coincide con la distribución de muestra directa del verificador, y en chi-cuadrado p > 0.05♦
2. **Medium。**¿ Qué ?`α = 0.5, 0.7, 0.85`, dibujar velocidad( cada vez mayor modelo hacia adelante de Token número) con`N`∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`N`◊(Intenta: cada vez verifique llamada 期望 Token 数 = `(1 - α^{N+1}) / (1 - α)`◊)
3. **Hard。**实现 una pequeña Medusa:取 Lesson 14's capstone GPT, añadir 3 个额外LM cabezas,分别预测位置 t+2、t+3、t+4──
4. **Hard。**实现 rollback: desde un prefijo KV cache de 10 tokens 开始,进入 5 个草案代币,模拟在位置 3拒绝――验证下一轮代时你的缓存 读取结果正确匹配 "prefijo + primeros 2 borrados aceptados"――

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等式定理──
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出;清晰的 Bernoulli-rejección 证明──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) Medusa 论文; árbol-atención 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) EAGLE-1; basado en el estado oculto  condiciones del borrador 
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) EAGLE-2; profundidad dinámica del árbol。
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) EAGLE-3。
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057)Mira hacia adelante, no hay un proyecto.
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html)                                                                                                                                                                                                                                                              
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) Registro de referencia de EAGLE-1/2/3
