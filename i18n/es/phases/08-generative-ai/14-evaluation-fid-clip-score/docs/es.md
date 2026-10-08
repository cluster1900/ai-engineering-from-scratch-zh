#  evaluación  FID  CLIP Score  Prefiencias humanas

> Cada clasificación de modelos generados se basa en la puntuación FID, CLIP y en la tasa de ganancias de los campos de juego de preferencias humanas. Cada número tiene un modelo de fracaso que los investigadores tienen en mente. Si no entiendes estos modelos de fracaso, no puedes distinguir entre la verdadera mejora y la actual operación.

**类型:**Construir
**语言:**Python
**先修:**Fase 8 · 01 (Taxonomía), Fase 2 · 04 (Métricas de evaluación)
**时间:**- 45 minutos

##  problemas

Los modelos generalmente se evalúan en función de la calidad de la muestra y de la condición de seguimiento de la misma. Ambos no tienen una medida cerrada. Tu modelo debe tener 10.000 imágenes; debe haber algo que las dividir; también debes creer que estos números pueden transcender la familia de modelos, la resolución transversal, la estructura transversal.

- **FID (Fréchet Inception Distance)。**En el espacio de características de la red de inicio, la distancia entre la distribución real y la distribución de generación.
- **CLIP score。**生成图像的 CLIP-image Embedding和快速的 CLIP-text Embedding 之间的 cosínea similaridad──越高越好──衡量快速 遵循度──
- **人类偏好。**En el mismo momento 上让两个模型正面对决,让人类 (GPT-4) seleccionar un mejor, reúne Elo score.

También verás: IS(punto inicial, básicamente ya retirado) 、KID、CMMD、ImageReward、PickScore、HPSv2、MJHQ-30k── cada uno de ellos ha modificado algún punto de falta de un indicador anterior―

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  样本质量

Heusel et al. (2017)。步骤:

1. Por lo tanto, el proyecto de investigación de la Universidad de San Francisco (UFSA) se ha desarrollado en el campo de la investigación de la investigación y la investigación.
2. Para cada grupo se calcula una media Gaussian:`μ_r, μ_g`Y la covarianza `Σ_r, Σ_g`¿Qué es eso?
3. FID = `||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`¿Qué es eso?

Explicación: Tétra de espacio entre dos variables Gaussianas  entre la distancia de Frechet──越低 = 分布越相似──

失效模式:
- **小 N 时有偏。**FID es para la distribución de características hacer media-cuadrado 计算,小 N 会低估共变,给出虚假的低 FID──始终使用 N ≥ 10,000──
- **依赖 Inception。**La creación de la imagen en el campo de la imagen en el que se desarrolla la imagen en el campo de la imagen en el que se desarrolla la imagen en el campo de la imagen en el que se desarrolla la imagen en el campo de la imagen.
- **刷分。**过拟启动前可在没有视觉质量提升的情况下获得低FID──使用CMMD见下文)来对抗它──

### Punto de CLIP  rapidez  seguimiento

Radford et al. (2021) ―― para una imagen generada + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

Se obtiene una cantidad de imagen comparable entre modelos para 30k de imágenes generadas.

失效模式:
- **CLIP 自身的盲点。**El modelo puede clasificarse muy bien en la puntuación CLIP, pero no sigue realmente un complejo prompt。
- **短 prompt 偏差。**短 prompt 在野外有更多 CLIP-image 匹配──长 prompt 的 CLIP score 会机械性降低──
- **prompt 刷分。**En el instante de incluir "alta calidad, 4K, obra maestra" elevará la puntuación CLIP, pero no mejorará la grabación.

CMMD (Jayasumana et al., 2024) 修复了其中一些问题: utilizar características CLIP en lugar de Inception, usar la discrepancia máxima-mediana en lugar de Fréchet.

### La verdad de la tierra

选择一组 prompt──用模型 A 和模型 B 生成──把成对结果展示给人类 (或强 LLM judge)──将胜负聚合成 Elo 或 Bradley-Terry puntuación──Bénchmark:

- **PartiPrompts (Google)**:1,600 个多样化提示,12 个类别──
- **HPSv2**:107k 个人类标注, amplio uso como agente de automatización
- **ImageReward**Se trata de una imagen rápida de 37 mil personas.
- **PickScore**: Basado en las preferencias de Pick-a-Pic 2.6M  entrenamiento
- **Chatbot-Arena-style image arenas**¿Qué es esto ?https://imagearena.ai/Y otras plataformas.

失效模式:
- **judge 方差。**Las preferencias de los no expertos y los expertos son diferentes.
- **prompt 分布。**精挑细选的快速会偏向某一家──始终记录清楚── siempre recordó claramente
- **LLM-judge reward hacking。**GPT-4-Juez 会被漂亮但错误的输出骗过了――与人类结果交叉验证――

## 组合使用

El informe de evaluación de la producción debe incluir:

1. En 10-30k 个样本, en el caso de la verdadera distribución calculada FID (样本质量) ⋅
2. En el mismo lote de muestras y su inmediato 上计算 CLIP score / CMMD(seguimiento)
3. En comparación con la anterior versión del modelo, la tasa de ganancia en el campo de juego es calculada en general.
4. 失效模式分析:随机抽取 50 输出,标记已知问题 (se puede extraer 50 输出, marcar los problemas conocidos)

任何单一指标都是谎言──三个相互印证的指标 + 定性评论 才是主张──


```figure
gx-fid-distributions
```

## 动手构建 动手构建

`code/main.py`En sintética de "vectores de características" para implementar FID, clase CLIP-score y Elo 聚合 (), usamos el vector 4D como un sustituto de las características de inicio)

- La FID 计算,也就是偏差──
- La similitud cosínica entre los puntos se caracterizará como "score CLIP" (escore CLIP).
- Desde la regla de actualización de Elo de la sintética preferencia.

### Paso 1: Cuatro años de realización de FID

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 步骤 2: CLIP 风格 de cosinología

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### Paso 3: El 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**En N=10k, esto se inicia con un inestable.
- **跨分辨率比较 FID。**El tamaño de la versión inicial de 299×299 cambiará la distribución de las características.
- **只报告一个 seed。**Al menos 3 semillas de semillas.
- **通过 negative prompts 抬高 CLIP score。**Algunos de los canales pasarán por el instante de la actualización de CLIP.
- **prompt 重叠导致 Elo 偏差。**Si dos modelos en el entrenamiento han visto un punto de referencia, Elo no tiene sentido.
- **人类 eval 的付费众包偏斜。**Prolific、MTurk 标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## Usalo

Protocolo de evaluación de producción para 2026:

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

Cuatro pilares en el mismo informe = 主张── cualquier único uno = 营销──

## 交付

保存 `outputs/skill-eval-report.md`Habilidad para recibir nuevos puntos de control de modelos + línea de base, y para emitir un plan de evaluación completo: muestra de datos, indicadores, modelos de desfecho, criterios de evaluación y criterios de evaluación.

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` En comparación con la distribución de la misma composición, N=100 con FID de N=1000 ⋅ reportar amplitud de diferencia
2. **Medium.**基于合成 CLIP-style features 实现 CMMD 公式见 Jayasumana et al., 2024) △ Compare it with FID for sensitivity to quality difference ⋅
3. **Hard.**复现 HPSv2 设置:从Pick-a-Pic的一个子集中取1000 个图像-prompt pairs,基于偏好细调,一个小型CLIP-based scorer,并测量它与持久的集合的一致性──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FID | "Fréchet Inception Distance" | 对真实与生成 Inception features 拟合 Gaussian 后的 Fréchet distance。 |
| CLIP score | "Text-image similarity" | CLIP image 与 text Embeddings 之间的 cosine similarity。 |
| CMMD | "FID's replacement" | CLIP-feature MMD；偏差更小，无 Gaussian assumption。 |
| IS | "Inception score" | Exp KL(p(y|x) || p(y))；在现代模型上相关性差，已退役。 |
| HPSv2 / ImageReward / PickScore | "Learned preference proxies" | 在人类偏好上训练的小模型；用作自动 judge。 |
| Elo | "Chess rating" | 成对胜负的 Bradley-Terry 聚合。 |
| PartiPrompts | "The benchmark prompt set" | Google 策划的 1,600 个 prompt，覆盖 12 个类别。 |
| FD-DINO | "Self-sup replacement" | 使用 DINOv2 features 的 FD；更适合 ImageNet 之外的领域。 |

## 生产注记:evaluación y también es la carga de trabajo de inferencia

En 10k muestra de FID se ejecuta en la generación de 10k 张图像── para la base SDXL de 50 pasos de单张 L4 上 10242, esto es aproximadamente 11 horas de inferencia de una sola solicitud── evaluación presupuesto es real, y este marco es una situación de inferencia fuera de línea (maximizar el rendimiento, ignorar TTFT):

- **尽力 batch，忘掉 latency。**Evaluación fuera de línea = hacer batches estáticos en la mayor dimensión de la capacidad de memoria. En 80 GB H100 上用 `num_images_per_prompt=8`调用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `pipe(...).images`, reloj de pared que una sola solicitud 快 4-6×.
- **缓存真实 features。**Para la extracción de características de Inception (FID) o CLIP (CLIP-score, CMMD) sólo se realiza una vez, y se almacena para`.npz`No vuelvas a calcular cada evaluación.

对于CI / regression gates: cada PR 在 500-sample 子集上运行 FID + CLIP score(~30 min); cada noche运行完整 10k FID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 论文──
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD。
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020)¿Qué es eso?
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2──
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) ImageReward。
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) PartiPrompts。
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) Encuesta de modo de falla。
