# 评估 FID、CLIP评分、人类偏好

> 每个生成模型排名都引用了FID、CLIP分数以及来自人类偏好竞技场的胜利率. 每个数字都有一个被有意研究人员利用的失败模式.如果你不了解这些失败模式,就无法区分真正的改进和刷分运行.

**类型:**建立
**语言:**字符串
**先修:**阶段8 · 01 (税理学),阶段2 · 04 (评估指标)
**时间:**时间为45分钟

## 问题

生成式模型通常根据*样本质量*和*条件的遵循度*来评价――两者都没有闭式度量――你的模型必须染色10,000张图像;必须有什么东西给它们分分;你还必须相信这些数字可以跨模型家族"",跨分辨率"",跨架构成立――三种指标通过2014-2026年的考试:

- **FID (Fréchet Inception Distance)。**在创始网络的特征空间中,真实分布与生成分布之间的距离――越低越好――
- **CLIP score。**生成图像的Clip图像嵌入与提示的Clip文字嵌入 之间的共性相似性──越高越好──衡量提示 遵循度──
- **人类偏好。**在同一时刻上让两个模型正面对决,让人类 (或GPT-4级模型) 选择更好的一个,再聚合Elo分数――

你还会看到:IS(初始分数,基本已退役) ‧KID、CMMD、图像奖励、PickScore、HPSv2、MJHQ-30k──每一个都修改了前一种标志的某个失效点──

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

###  样本质量

果和其他产品

1. 为 N 张真实图像和 N 张生成图像提取 创始-v3功能 (2048-D) ⋅
2. 对每个池拟合一个高斯:计算平均值`μ_r, μ_g`和共变性`Σ_r, Σ_g`,我知道.
3. 子`||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`,我知道.

解释:特征空间中两个多变量高斯人之间的频率距离──越低 = 分布越相似──

失效模式:
- **小 N 时有偏。**对于特征分布做平均平方计算,小N会低估共差,给出虚假的低FID──始终使用N ≥ 10,000──
- **依赖 Inception。**开始-v3 训练于 ImageNet──远离 ImageNet 的领域(人脸、艺术、文字图像) 将产生无意义的 FID──使用特定领域的特征提取器──
- **刷分。**过拟合 开始前可以在没有视觉质量提升的情况下得到低FID──使用CMMD见下文来对抗它──

### 快速 遵循度

对于一张生成图像+提示:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

对于30k张生成图像的平均取 → 得到一个可在模型中比较的标量.

失效模式:
- **CLIP 自身的盲点。**模型可以在Clip评分上排名很好,但并没有真正遵循复杂提示──
- **短 prompt 偏差。**短提示 在野外有更多的Clip图像匹配.
- **prompt 刷分。**在即时加入"高质量,4K,杰作"会提高Clip分数,但不会改善图文绑定.

 CMMD (Jayasumana et al., 2024) 修复了其中一些问题:使用CLIP功能而不是Inception,使用最大平均差异而不是Fréchet.

### 人类偏好 地上的真相

选择一组提示――用模型 A 和模型 B 生成――把成对结果展示给人类 (或强 LLM法官) ――将胜负聚合成 Elo 或布拉德利-特里分数――基准:

- **PartiPrompts (Google)**:1,600 个多样化提示,12 个类别──
- **HPSv2**个人类标注,广泛使用作自动化代理.
- **ImageReward**现在,我们在线观看了这部电影.
- **PickScore**基于Pick-a-Pic 2.6M的偏好
- **Chatbot-Arena-style image arenas**其他:https://imagearena.ai/和其他平台.

失效模式:
- **judge 方差。**专家和非专家的偏好不同.
- **prompt 分布。**精挑细选的快速会偏向某一家.
- **LLM-judge reward hacking。**据报道,这项调查结果是与人类结果交叉验证的.

## 组合使用

生产级评估报告应包括:

1. 在10-30k个样本上,针对持久的真实分布计算 FID (样本质量) ⋅
2. 在同一批样本及其即时上计算CIP分数 / CMMD(遵循度)
3. 在与上一版模型的盲测竞技场中计算胜率 (整体偏好) 
4. 失效模式分析:随机抽取50个输出,标记已知问题

任何单一指标都是谎言.


```figure
gx-fid-distributions
```

## 动手构建

`code/main.py`在合成的"特征向量"上实现FID、类CLIP-score 和 Elo 聚合(我们使用4D向量作为启动特征的替代) ――你会看到:

- 小 N 和 大 N 上的 FID 计算,也就是偏差.
- 将特征池之间的共数相似性作为"CLIP分数".
- 根据"合成偏好流"的Elo更新规则.

### 步骤1: 四行实现FID

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

### 步骤3: 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**在N=10k以下,这个启发式不可靠.
- **跨分辨率比较 FID。**开始的299×299尺寸会改变特征分布――只在匹配分辨率下比较――
- **只报告一个 seed。**至少运行3种种子.
- **通过 negative prompts 抬高 CLIP score。**部分管道将通过过拟合提示来升级Clip.
- **prompt 重叠导致 Elo 偏差。**如果两个模型在训练中都见过基准提示,
- **人类 eval 的付费众包偏斜。**果的MTurk标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## 使用它

2026年生产评估协议:

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

报告中四支柱 = 主张.

## 交付

保存`outputs/skill-eval-report.md`△ 技能 接收新模型检查点+基线,并输出完整的评估计划:样本量、指标、失效模式探针、核标准──

## 练习

1. **Easy.**运行`code/main.py`△在相同的合成分布上比较N=100与N=1000时的FID――报告偏差幅度――
2. **Medium.**基于合成CLIP式功能实现CMMD (见Jayasumana等,2024) 公式) 比它与FID对质量差异的敏感性.
3. **Hard.**复现 HPSv2 设置:从Pick-a-Pic的一个子集中取1000个图像即时对,基于偏好细调,一个小型的CLIP基于得分器,并测量它与持久的集的一致性.

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

## 生产注记:评估 也是推断工作负载

在 10k 样本上运行 FID意味着生成 10k 张图像.对于单张 L4 上 10242 的50步 SDXL 基础,这大约是 11 小时的单次请求推断.评估预算是真实的,而且这个框架正是离线推理场景:

- **尽力 batch，忘掉 latency。**在内存容量最大尺寸上进行静态批量. 在80GB H100上使用.`num_images_per_prompt=8`调用`pipe(...).images`墙上的钟比单次要求快4至6倍.
- **缓存真实 features。**对于真实参考集执行的启动 (FID) 或CLIP (CLIP-score,CMMD) 功能提取 只运行*一次*,并存储为`.npz`应不要每次评估都重新计算.

对于CI/回归门:每一个PR 在500个样本子集上运行FID + CLIP分数(~30分钟);每晚运行完整 10kFID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) 论文:
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603)    
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020)    
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341)    
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977)图像奖励──
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) 活动提示
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675)失败模式调查――
