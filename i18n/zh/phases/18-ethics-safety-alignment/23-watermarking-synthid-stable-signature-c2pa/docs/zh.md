# 标记水 合成ID、稳定签名、C2PA

> 三项技术构成了2026年 AI 生产内容来源追踪的基础.SynthID (Google DeepMind) 图像水标 于2023年8月推出,文字+视频 于2024年5月推出.Gemini + Veo),文字 于2024年10月通过负责任的GAI工具包开源,统一的多媒体探测器 于2025年11月发布.随着Gemini 3 Pro 一次发布.文本水标将在很难的时间内调整下一个标签采样概率;图像/视频水标可以承受压缩,缩,变化,框-过.稳定签名 (Fernandez等., ICCV 2023, arXiv:2303.15435) 丰富的信息源,但可在不定码中进行解散,每个标准包含输入信息; 文本信息的质量可在2024年中保持下降; 标可以在2024年中被加密化,加密化,加密化,加密化,加密化,加密化,加密化,加密化,加密化,加密化等.

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 分钟

## 学习目标

- 描述代币级水标 (SynthID-text风格) 以及它可检测的机制.
- 描述稳定签名以及2024年击败其移除攻击.
- 解释C2PA作用以及为什么它与水标配互补
- 描述关键限制:模型特定的信号、句子 下的鲁棒性,以及保留意义的攻击 (arXiv:2508.20228) 👇

## 问题

2023-2024年,深度假设和人工智能产生内容大规模进入政治和消费场景.水标是提出的技术来源信号:在创建时标记生成内容,然后再检测.2025年的证据表明:没有任何水标 具有无条件的优质性,但与C2PA元数据分层结合时,这种组合可以提供可用的来源追踪方案.

## 概念

### 文字水标(SynthID-text 风格)

基尔堡等人,由谷歌产品化:2023 机制:

1. 在每个解码步骤中,对前 K 个标志做一个哈希,生成一个伪随机分区,将词汇分成"绿色"和"红色"集合.
2. 通过给绿色的标记加上 δ,使样本采集偏向绿色的集合.
3. 生成结果包含的绿色代币数量将高于随机情况的期望.

检测:对每个预写重新哈希,统计生成结果中的绿色标记,计算z-score。水标文字的z-score >0,人文约为0──

特性:
- 读者难以察觉 (d 足够小,质量损失较轻)
- 在可访问词汇分区函数时可检测──
- 为了抛词不鲁棒 重写文本会破坏这个信号.

通过谷歌的负责基因工具包,

### 稳定签名 (图)

费尔南德斯等人 ICCV 2023──细调隐形扩散解码器,使每张生成图像都包含一个写入隐形表示的固定二进制信息──检测通过神经解码器从隐形中解码──对收割的图像,保留10%的内容,在 FPR<1e-6 时检测率 >90%──

2024 年 5 月 "稳定签名不稳定" (arXiv:2405.07145):微调解码器可以在保持图像质量同时移动水印――对抗性后代微调 成本很低;该水印的对抗强度有限――

### 综合ID统一探测器 (SynthID)

随着Gemini 3 Pro的发布:一个多媒体探测器,可以在同一API中读取文字,图像,音频,视频中的SynthID信号.

### 化剂

内容来源和真实性联盟――加密签署的伪造性明显的元数据标准――C2PA 2.2解释者 (2025)――C2PA 宣言 会记录来源声明――谁创建、何时创建、做过哪些变化),并由创始人关键 签名――

与水标注 互补:
- 转换数据可以被剥离;水印通常不容易.
- 信息丰富 (完整来源链);水印 (承载位).
- 根据平台的采用,水印会自动写入.

谷歌在搜索,广告和"关于这个图像"中同时集成两者.

### 限制

- **Model-specific.**由于 SynthID 会将来自SynthID启用模型的生成结果加上水印.
- **Paraphrase.**文字水印 无法经受保存意义的表达式.
- **Transformation attacks.**文件:508.20228 (2025) 显示可以破坏文本水标以及许多图像水标的含义保护攻击.
- **Fine-tune removal.**根据"稳定签名不稳定",后代细调可以移除写入的水印──

### 欧盟人工智能法第50条

根据"透明度法"的第一版草案2025年12月,第二版草案2026年3月,[European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)截至2026年4月,该法规仍为草案,时间线可能发生变化.

### 它位于18阶段的位置.

课程22-23 关注模型输出的内容(私人数据、来源信号) ・课程27 覆盖培训-数据治理――课程24 是要求这些技术措施的监管框架――


```figure
an-watermark-greenlist
```

## 使用它

`code/main.py`构建一个玩具文本水标――代币是整数0.N-1;水标样本会偏向哈希定义的绿色集合――检测器会计算绿色代币z分数――你可以观察1000代币的检测结果,看句子如何破坏该信号,并测量人类文本上的虚假阳性率――

## 交付它

本课会产出 `outputs/skill-provenance-audit.md`△给定一个带有来源的索赔内容部署,它会审计:水印机制 (如有) 、C2PA签署链 (如有) 、各自的对抗强度以及每个模式的覆盖情况.

## 练习

1. 运行`code/main.py`△报告水标1000代标与人为文字的z分点――识别95%的信任门 下的虚假阳性率――

2. 实现一个抛词攻击,用同义词替换30%的代币.

3. 阅读Kirchenbauer等. 2023 第6节 中关于强度的内容――为什么文字水标会在下句子下失效,而图像水标能经受收割?

4. 设计一个使用SynthID-text + C2PA元数据的部署――描述消费者看到的来源链――识别每个组件的一个故障模式――

5. 结果表明,微调可以移除图像水标――设计一个限制此攻击的部署控制措施

## 关键术语

| Term | 人们怎么说 | 它实际含义 |
|------|------------|------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal；text、image、audio、video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark，可通过 green-token z-score 检测 |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark；ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark 属性；目前有限 |
| Fine-tune removal | "adversarial unwatermark" | 通过 decoder fine-tuning 移除 image watermark 的攻击 |
| Cross-modal detector | "unified SynthID" | 2025 年 11 月跨 modalities 的 unified API |

## 延伸阅读

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226)标志水印机制
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435)图像水印论文
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) 移除攻击
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/)跨模式水标
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html)元数据标准
