# Mixto de expertos (MEE)

> Un transformador 70B denso se ejecutará para cada token  activar todos los parámetros― un 671B MoE cada token sólo activará 37B parámetros, pero en todos los puntos de referencia 上胜过它──稀疏性是这个十年最重要的规模化思想──

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 05 (transformador completo), Fase 7 · 07 (GPT)
**Time:** ~45 minutes

##  problemas

Cuando se expande un modelo denso, cada token tiene que pagar el costo de cálculo completo. Para 2024, la frontera ya ha chocado con la pared de cálculo: para ser significativamente más inteligente, necesitas más FLOPs en cada token.

Mixta de Expertos rompieron esta relación.`E`个独立专家 + 一个为每个代币 选择 `k`个 expertos de router──总参数 = `E × FFN_size`△ cantidad activa de cada Token = `k × FFN_size` Configuración típica para 2026:`E=256`¿ Qué ?`k=8` Almacenamiento`E`扩展,计算随 `k`扩展──

La frontera de 2026 año  casi todo es MoE:DeepSeek-V3(671B total / 37B activo) 、Mixtral 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss── en el tablero de clasificación independiente de Análisis Artificial.

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### FFN 替换

bloque de transformador denso:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

Bloqueo de la MOE:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

Cada experto es un FFN independiente (normalmente SwiGLU) ―router es una sola línea de la capa― cada token  seleccionar su propio `k`个 expertos,并获得它们输出门的混合物──

### equilibrio de carga 问题

Si el router deja que el 90% de los tokens pasen por el experto 3, otros expertos morirán de hambre. Ya han intentado tres formas de reparar:

1. **Auxiliary load-balancing loss**(Switch Transformer、Mixtral) ―― Añadir un con experto de la tasa de uso de diferencia en la tasa de castigo.
2. **Expert capacity + token dropping**(Epiquio temprano) ⋅ Cada experto ⋅`C × N/E`个 Token;溢出的 Token 跳过该层──会损害质量──
3. **Auxiliary-loss-free balancing**(DeepSeek-V3)── Añadir un sesgo por experto que se puede aprender, para desplazar la opción de los routers.

Proceso de DeepSeek-V3: Después de cada paso de entrenamiento, cada experto debe revisar si su uso es alto o bajo de su objetivo.`±γ`微调偏选择时使用 `scores + bias` Probabilidades expertas de puertas utilizadas  todavía utilizan original`scores` This will routing with expression 解──

### Expertos compartidos

DeepSeek-V2/V3 también se dividen los expertos en *compartidos* y *routed*── cada token se encuentra en todas las áreas de expertos compartidos──expertos en ruta                                                                                                                                                                                                                                        

### Expertos de granos finos

经典 MoE(GShard、Switch): Cada experto 和完整FFN 一样宽──`E`较小(8-64),`k`较小(1-2)。

现代 grano fino MoE (DeepSeek-V3、Qwen-MoE): cada experto 更狭(1/8 de tamaño FFN)`E`很大(256+),`k`Más grande ((8+) ◊ la cantidad de componentes es igual, pero la cantidad de componentes se expande más rápido.`C(256, 8) = 400 trillion`种可能的每 Token 专家 ──质量提升,延迟 保持不变──

### 成本图片

Cada token, cada capa:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 en casi todos los puntos de referencia 上都胜过 Llama 3 70B (denso), simultáneamente**每个 Token 使用更少的活跃 FLOPs**△ Más parametros = 更多知识── Más FLOPs activos = Cada Token 更多计算──MoE将它们解──

### 代价:memoria

无论哪些专家被触发, todos los expertos deben permanecer en la GPU 上―― un modelo 671B 模型需要约1.3 TB VRAM 来存储fp16 weights――frontier MoE deployment 需要专家平行:把专家分分到多个 GPU 上,通过网络路线代币――延迟 主要由所有对所有通信 主导,而不是 matmul――


```figure
expert-routing
```

## Construirlo

参见 `code/main.py`                                                                                                                                                                                                                                                              

- `n_experts=8`个近似 SwiGLU de expertos(para facilitar la explicación, cada uno sólo es lineal)
- Top-k=2 enrutamiento
- Peso de puertas normalizado de la máxima suave
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

### 步骤 1: enrutador

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

Prejuicio  influir en la selección, sin afectar el peso de la puerta― esto es lo que DeepSeek-V3 hace:

### Paso 2: Haga que 100 Tokens a través del router

Seguir los expertos que se inciden y se inciden en la frecuencia.`-γ`, uso insuficiente de uso`+γ`) después, la tasa de uso se distribuirá de manera media en varias generaciones.

### Paso 3: Parámetros en comparación

印打一个 MoE config 的 密度相当──DeepSeek-V3 形状:256 enrutado + 1 compartido,8 activo,d_model=7168──总参数非常惊人──活跃参数只有密度Llama 3 70B 的七分之一──

## Usalo

Acogida cara

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

Inferencias de producción de 2026 años: vLLM 原生支持MoE enrutamiento。SGLang 拥有最快的专家-parallel path──两者都会自动处理顶级选项和专家平行──

**何时选择 MoE：**
- Usted desea obtener una calidad de frontera en un costo de inferencia de tokens más bajo.
- Usted tiene infraestructura paralela de VRAM / expertos.
- Su carga de trabajo es token-heavy (títulos de chat ), y no contexto-heavy (dos documentos largos)

**何时不要选择 MoE：**
- Despliegue de borde: Usted pagará el coste de almacenamiento completo para cualquier FLOP activo.
- Servicio de usuario único de latencia crítica: enrutamiento experto 会增加 Overhead──
- 小模型(<7B):El MoE de la calidad de ventaja sólo aparecerá después de superar un cierto umbral de cálculo (~6B parámetros activos)

##  entregarlo

参见 `outputs/skill-moe-configurator.md`◊ esta habilidad se basará en el presupuesto de parámetros, los tokens de formación y el objetivo de implementación, para un nuevo diseño de MOE 选择 E、k 和 compartido-experto.

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ observar la actualización de sesgo auxiliar sin pérdidas 如何在50次中拉平专家使用──
2. **Medium.**Usar router basado en hash (definitividad, no necesita aprender) para reemplazar el router aprendido.
3. **Hard.**实现 GRPO-style rollout-matched routing(DeepSeek-V3.2 技巧): record inferencia 期间 哪些 expertos fueron触发,在 Gradient 计算期间强制使用相同路由──在一个玩具政策-gradient设置 上测量效果──

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) Este es el origen de la idea.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) Cambiar, clásico MoE。
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) Mixtral 8×7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + MoE sin pérdidas auxiliares + MTP。
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664)  基于偏见的平衡论文──
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒+共享专家分分──
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的 expertos compartidos 论文──
