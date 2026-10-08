# La privacidad diferencial de los LLM

> DP-SGD sigue siendo una práctica estándar: inyectar ruido Gradient 更新提供形式化的 (epsilon, delta) 保证──计算、内存和效用方面的开销都很大;参数高效的 DP fine-tuning (LoRA + DP-SGD) es la configuración habitual de 2025 (ACM 2025) 两类证据存在张力:基于加拿大的会员推理 (Duan et al., 2024) 报告称对语言模型的成功有限;培训数据提取 (Carlon et al., 2021; Nasr et al., 2025) 恢复大量的数据字记忆 (arX:503.808, March 2025):06差证在测量对象不同:插入提议的数据 最容易被取取;即兴兴的方案支持的数据设计与基于数据的数据;Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media Research:Media and Media Research:Media Research:Media and Media Research:Media Research:Media and Media) 

**Type:** Build
**Languages:** Python (stdlib, DP-SGD 噪声注入和 ε-δ accountant 演示)
**Prerequisites:** Phase 01 · 09（信息论），Phase 10 · 01（大模型训练）
**Time:** ~60 分钟

## El objetivo del aprendizaje
- 定义 (epsilon, delta) - privacidad diferencial,并说明 DP-SGD 流程──
- Explicación de la estrategia de MIA canaria y la extracción de datos de formación en el período 2024-2025
- Describir el PMixED, y por qué la predicción privada del tiempo de inferencia es una alternativa a la formación en DP.
- 描述 Reversión de la privacidad diferencial a través de LLM Feedback 攻击。

##  problemas
LLMs 会记忆──Carlini et al. 2021 indican que el modelo de producción de lenguaje se basa en la necesidad de un texto de entrenamiento repetido por cada palabra──DP es una defensa formalizada: un modelo de entrenamiento, que hace que su producción en un sentido demostrable sea insensitiva a cualquier muestra de entrenamiento individual──2024-2025 años de pruebas muestran que el DP-SGD es necesario, pero el ε value implementado no puede coincidir con el modelo de amenaza──

## 概念
### (ε, δ) - privacidad diferencial

Si a cualquier dos sólo diferencia un conjunto de datos de muestra, así como cualquier evento S, un algoritmo aleatorio M  satisface:
P(M(D) en S) <= e^ε * P(M(D') en S) + δ。

解释:输出分布足够接近 (由 ε 参数化)), por lo que ninguna contribución de un individuo puede ser concluida con confianza, a menos que se produzca una excepción en la probabilidad de δ.

### DPS-SGD

Abadi et al. 2016。标准流程:
1. Como un mini lote.
2. 计算 por ejemplo de gradientes。
3. Cortar cada gradiente por ejemplo a un valor C.
4. Para los gradientes de corte posterior 求和,并加入 std 为 σ * C de ruido gaussiano。
5. Utiliza con el ruido y para actualizar los parámetros.

隐私成本由会计师跟踪(Moments会计师、Rényi DP会计师)  LLM 文献中报告的 ε 价值会因威胁模型、数据敏感性和效用目标而大幅变化; no existe普适的安全默认 ε──已发出表示例在某些 LLM 训练设置中大致覆盖 ε ≈ 110,但这些只是例证,并非推默认值──较低的 ε 通常需要更多噪音,并可能增加效用损失──

### LoRA + DP-SGD

Para el modelo fronterizo hacer un DP-SGD completo 代价过高──LoRA (Hu et al. 2022) va a Gradient 更新限制在一个小型适配器中,从而减少每例梯度 存储──LoRA + DP-SGD 是常见的 2025 配置──DP保证适用于适配器;base model 保持固定──

### El desarrollo de la economía

两条证据线:

- **Canary MIA (Duan et al. 2024)。**Para el único canario 插入训练数据, medir la membresía-inferencia del atacante 否能识别它们──报告称在语言模型上的成功有限──这表明MIA 很难──
- **Training-data extraction (Carlini 2021, Nasr et al. 2025)。**Utiliza el prefijo 提示模型; mide si puede recuperarse de la formación en el texto de texto.

El método de solución de marzo de 2025 (arXiv:2503.06808): el segundo método de medición es diferente. La MIA pregunta si el modelo está en D. ¿El objeto es Canario? La extracción pregunta es ¿qué puedo recuperar de D?

Nuevo diseño de Canarias. No se necesita un modelo de MIA basado en pérdidas.

### Programa de formación en el ámbito de la formación en el campo de la formación

- **PMixED (arXiv:2403.15638)。**Previsión privada del tiempo de inferencia― en el siguiente token de distribución de uso de mezcla de expertos; cada experto ver un training data shard; agregando cuando se añade ruido para lograr DP― completamente evitar el entrenamiento DP―
- **DP synthetic data generation (Google Research 2024)。**Utiliza DP-SGD  realizar LoRA-fine-tune, tomar datos sintéticos, volver en datos sintéticos 上训练下游 clasificador。

El segundo es el costo de uso de la formación completa de DP, pero el costo es la adopción de diferentes modelos de amenaza.

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

2025 新兴攻击──将 DP-trained model confidence scores 用作 Oracle 来重新识别个体──即使输出不泄漏,信心分布也可能泄漏──

 método de defensa: no exponer las confidencias, o en la exposición previa a su corte/quantitización.

### Está en la fase 18

Lecciones 20-21 es prejuicio/justicia. Lección 22 es privacidad. Lección 23 es a través de la marcación de agua  lograr la procedencia. Lección 27 覆盖监管层面的数据-provenance层.


```figure
an-dp-clip-noise
```

## Usalo
`code/main.py`En un juego de clasificación binaria, se puede analizar el multiplicador de ruido σ y la norma de recorte C, y seguir (ε, δ) el presupuesto y el costo de precisión.

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-dp-audit.md` Determinar la afirmación de DP de un modelo de lenguaje, que audita: ε, δ) 值、使用的会计者、MIA evaluation protocol,以及是否已经评估了信任暴露向量──

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊扫过 σ ∈ {0.5, 1.0, 2.0},并报告 (ε, δ) -acurate 权衡──识别效用崩的临界点──

2. 实现 Canary 插入和日志损失测量在 σ = 1.0 时,DP-SGD 前后的检测率──

3. 阅读Nasr et al. 2025 关于培训数据提取的内容──为什么提取成功不会在中等 ε下崩? ¿Qué significa esto para evaluar la MIA?

4.  diseñar una implementación utilizando PMixED (arXiv:2403.15638) , para que se ejecute completamente en tiempo de inferencia ⋅ PMixED  resuelve qué tipo de DP-SGD no resuelto modelo de amenaza?

5. 概述 DP Reversión a través de LLM Feedback 攻击──设计一个限制信任评分 泄漏的对策,并估算其部署成本──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DP | “(ε, δ)-differential privacy” | 形式化隐私：在相邻数据集变化下，输出分布保持接近 |
| DP-SGD | “noise-injected SGD” | Gradient clipping + Gaussian noise addition；标准 DP training |
| LoRA + DP-SGD | “efficient private fine-tune” | 在 low-rank adapters 上做 DP-SGD；标准 2025 配置 |
| MIA | “membership inference” | 判断某个样本是否出现在训练数据中的攻击 |
| Canary | “inserted watermark example” | 用于测量 DP 泄漏的唯一训练样本 |
| PMixED | “private inference mixture” | 在 inference time 通过 next-token 分布上的 mixture-of-experts 实现 DP |
| DP Reversal | “confidence leakage attack” | 使用模型 confidence 作为 oracle 进行重新识别的攻击 |

## 延伸阅读
- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) 标准 algoritmo de formación de DP
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) 经典 extracción 论文
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) MIA de éxito limitado
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) para la solución de la tensión
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) tiempo de inferencia 私有预测
