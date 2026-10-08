# 评估  FID、CLIP Score、 preconceitos humanos

> Cada classificação de modelos gerados cita a pontuação FID, CLIP, bem como a taxa de vitórias de um campo de competição de preferências humanas. Cada número tem um tipo de padrão de falha que os pesquisadores têm em mente para utilizar. Se você não entender esses padrões de falha, não pode distinguir a real melhoria e a melhor operação.

**类型:**Construir
**语言:**Python
**先修:**Fase 8 · 01 (Taxonomia), Fase 2 · 04 (Metricas de Avaliação)
**时间:**- 45 minutos.

## 问题

Os modelos geralmente são avaliados com base na *qualidade de amostra* e *condição de seguimento* para avaliar. Os dois não têm uma medida de fechamento. O seu modelo deve ter 10 mil imagens; deve haver algo para separá-las; você também deve acreditar que esses números podem transcender a família de modelos, trans-resolução, trans-estrutura.

- **FID (Fréchet Inception Distance)。**Em espaço de características da rede de iniciação, a distância entre a distribuição real e a distribuição gerada.
- **CLIP score。**生成图像的Clip-image Embedding与快速的Clip-text Embedding 之间的共数相似性──越高越好──衡快速 遵循度──
- **人类偏好。**Em um mesmo momento 上让两个模型正面对决,让人类 (GPT-4) escolher um melhor, reúne Elo score.

Você também verá: IS(score inicial, essencialmente já retirado) 、KID、CMMD、ImageReward、PickScore、HPSv2、MJHQ-30k── cada um deles corrigido um ponto de inefetividade de um indicador anterior―

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  样本质量

Heusel et al. (2017)。步骤:

1. Por N 张真实图像和 N 张生成图像提取 Inception-v3 recursos (2048-D) ⋅
2. Para cada grupo de um Gaussian: calcular a média`μ_r, μ_g`E a covariância`Σ_r, Σ_g`- Não.
3. FID = `||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`- Não.

Explicação: Tétra do espaço em dois valores variáveis Gaussian Distância entre os dois.

失效模式:
- **小 N 时有偏。**FID é uma distribuição de características em quadrado médio, calculada, pequena N 会低估共差, dá falsos níveis baixos FID──始终使用 N ≥ 10,000──
- **依赖 Inception。**Inception-v3 訓練于 ImageNet──远离 ImageNet's domain ([[人脸、艺术、文字图像) ]]) irá produzir FID── sem sentido, usando um extractor de características de um determinado domínio──
- **刷分。**过拟 启动前可在没有视觉质量提升的情况下得到低 FID──使用CMMD见下文)来对抗它──

### Ponto de pontuação CLIP  prompt 遵循度

Radford et al. (2021) ――对于一张生成图像 + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

Para 30k 张生成图像取平均 → 得到一个可以在模型中比较的标量──

失效模式:
- **CLIP 自身的盲点。**O modelo pode ser classificado em cima de uma pontuação muito boa, mas não segue um requisito complexo.
- **短 prompt 偏差。**短 prompt 在野外有更多 CLIP-image 匹配──长 prompt 的 CLIP score 会机械性降低──
- **prompt 刷分。**Em seguida, insira "alta qualidade, 4K, obra-prima" vai aumentar a pontuação CLIP, mas não melhorar o gráfico.

CMMD (Jayasumana et al., 2024) 修复了其中一些问题: usar características CLIP em vez de Inception, usar a discrepancia máxima-média em vez de Fréchet──it's better skilled at inspecting tiny quality differences──

### O que é verdade?

选择一组 prompt──用模型 A 和模型 B 生成──把成对结果展示给人类 (或强 LLM judge)──将胜负聚合成 Elo 或 Bradley-Terry score──Bênchmark:

- **PartiPrompts (Google)**:1,600 个多样化 prompt,12 个类别──
- **HPSv2**:107k 个人类标注, amplamente utilizado como agente de automação
- **ImageReward**- Não, não. - Não, não.
- **PickScore**Baseado em preferências de Pick-a-Pic 2.6M
- **Chatbot-Arena-style image arenas**- Não .https://imagearena.ai/E outras plataformas.

失效模式:
- **judge 方差。**As preferências dos não especialistas e dos especialistas são diferentes.
- **prompt 分布。**O que é que é que é?
- **LLM-judge reward hacking。**O GPT-4-Juge será bem visto mas errôneo.

## 组合使用

O relatório de avaliação de nível de produção deve incluir:

1. Em 10-30k 个样本, em referência ao fato de que a FID (样本质量)
2. Em um mesmo lote de amostras e sua rápida 上计算 CLIP score / CMMD(seguência)
3. Em comparação com a primeira edição do modelo, a taxa de vitória total foi calculada em um jogo de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de teste de
4. 失效模式分析:随机抽取 50 输出,标记已知问题 (conhecimento de 50 输出, marcadores de problemas já conhecidos)

Qualquer indicador único é mentira.


```figure
gx-fid-distributions
```

## 动手构建

`code/main.py`Em sintética "vectores de características" para implementar FID、类 CLIP-score 和 Elo 聚合(usamos usar o Vector 4D como substituto das características Inception) ・・・ você verá:

- 小 N 和 大 N 上 的 FID 计算,也就是偏差──
- A semelhança cosínica entre os conjuntos será definida como "escore CLIP".
- A partir da regra de atualização do Elo do fluxo de sintetização preferencial.

### 步骤 1: Quatro anos de realização do FID

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 步骤 2: CLIP 风格的相似性

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### 步骤 3: Elo 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**Em N=10k, abaixo, este iniciação é impossível.
- **跨分辨率比较 FID。**Iniciação de 299×299 tamanho 会改变特征分布──只在匹配分辨率下比较──
- **只报告一个 seed。**Pelo menos, 3 sementes de sementes.
- **通过 negative prompts 抬高 CLIP score。**Alguns canais vão passar por um pedido de adaptação para aumentar o CLIP.
- **prompt 重叠导致 Elo 偏差。**Se dois modelos em treino tiverem visto um prompt de referência, não faz sentido usar conjuntos de prompt de tempo prolongado.
- **人类 eval 的付费众包偏斜。**Prolific、MTurk 标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## Use-o

Protocolo de avaliação de produção de 2026:

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

Quatro pilares = 营销, qualquer um = 营销.

## 交付

保存 `outputs/skill-eval-report.md` Habilidade de receber novos pontos de controlo de modelos + linha de base,并输出完整 eval plan:样本量、指标、失效模式探针、签核标准──

## 练习

1. **Easy.**运行 `code/main.py` Comparar N=100 com N=1000  na mesma distribuição sintética                                                                                                                                                                                                                                                     
2. **Medium.**基于合成 CLIP-style features 实现CMMD(公式见 Jayasumana et al., 2024)
3. **Hard.**复现 HPSv2 设置:从Pick-a-Pic的一个子集中取 1000 个图像-prompt pairs,基于偏好细调, 一个小型CLIP-based scorer,并测量它与持久的集合的一致性──

## 关键术语

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

## 生产注记: avaliação também é carga de trabalho de inferência

Em 10k de amostras executadas FID significa gerar 10k de imagens. Para a base SDXL de 50 passos de 10242 de L4 de um único plano, isso é aproximadamente 11 horas de inferência de uma única solicitação.

- **尽力 batch，忘掉 latency。**Avaliação offline = fazer batches estáticos no tamanho máximo da capacidade de memória.`num_images_per_prompt=8`调用 `pipe(...).images`, relógio de parede, em comparação com um pedido único 快 4-6×.
- **缓存真实 features。**Para a extracção de recursos de Inception (FID) ou CLIP (CLIP-score, CMMD) apenas é executado* uma vez*, e armazenado para`.npz`Não se deve recalcular a cada avaliação.

对于CI / regression gates:每个 PR 在 500-sample 子集上运行 FID + CLIP score(~30 min); 每晚运行完整 10k FID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 论文──
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD。
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020)- Não, não.
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2──
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) ImageReward。
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) PartiPrompts。
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) Ensaio de modo de falha。
