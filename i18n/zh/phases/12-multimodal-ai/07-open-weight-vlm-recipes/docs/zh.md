# 开放式VLM食谱:真正重要的是什么

> 2024-2026年开放权重VLM文献是一张废除表的森林──果的MM1测试了13种图像编码器、连接器和数据组合──艾伦AI的Molmo证明,详细的人类标题 胜过GPT-4V蒸──Cambrian-1做了20多项编码器对五比──Idefics2将轴设计空间 形式化──普利斯马टिकVLM在受控基准上比较27种培训食谱──在这些噪音中,有一小组跨论文都成立:图像编码器比连接器架构更重要,课程数据组合比二者更重要,而详细的人类标题 胜过蒸的合成数据──这些你替换的数据表都读完毕──

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 分钟

## 学习目标
- 描述五轴VLM设计空间:图像编码器,连接器,LLM,数据混合,分辨率时间表.
- 阅读MM1 / Idefics2 / Cambrian-1的排放表,并预测哪个按会改变给定基准――
- 在给定计算预算和任务组合的情况下,为新的VLM选择配方 ((编码器,连接器,数据,分辨率) 
- 解释为什么在同样的代币数量下,详细的人类标题 胜过GPT-4V蒸.

## 问题
已经有数百个开放式VLM──从好到最先进的差距不来自建筑,而是数据,分辨率时间表和编码器选择──当你的模型表现不佳时,知道先调节哪个按,可以避免一次500万GPU小时的错误──

2023年浪潮(LLaVA-1.5、InstructBLIP、MiniGPT-4) 基于标题对预训 +LLaVA-Instruct-150k──不错的基线──上限约在MMMU 35%──

们已经做了尽可能多的除.

## 概念
### 五轴设计空间

思想2 ((劳伦森等人,2024年) 命名了这些轴:

1. 图像编码器──CLIP ViT-L/14、SigLIP SO400m/14、DINOv2 ViT-g/14、InternViT-6B──编码器 在补丁尺寸、分辨率 和预训目标上不同──
2. 连接器──MLP(2-4层)、Q-Former(32个查询 + 交叉接)、感知器复制样本器(64个查询)、C-抽象器(卷积+双线聚合)。
3. 语言模型――Llama-3 8B / 70B、Mistral 7B、Phi-3、Gemma-2、Qwen2.5──LLM大小是主要参数成本──
4. 训练数据――标题对 (CC3M、LAION) ‧互联的 (OBELICS、MMC4) ‧指令(LLaVA-Instruct、ShareGPT4V、PixMo、) ‧
5. 解析时间表──固定 224/336/448、AnyRes、原生动态──在训练过程中或保持不变──

每个生产VLM都会在每条轴上做选择.MMMU分数的大部分变化由轴1、4和5解释,而不是由你选择的连接器解释.

### 轴1:编码器 > 连接器

MM1 3.2 显示:从CLIP ViT-L/14 换成SigLIP SO400m/14,MMMU 增加3+分点──从MLP 换成感知器重样,增加不到1分──Idefics2 复现这一点:SigLIP >CLIP,Q-Former ≈ MLP ≈感知器,在同样的代币数量下相近──

Cambrian-1的Cambrian Vision Encoders Match-Up(Tong等,2024年) 在视觉中心的基准上跑了20多个编码器──排行榜顶部是DINOv2和SigLIP的混合;CLIP 位于中游;ImageBind 和 ViT-MAE 更低──CLIP ViT-L到 DINOv2 ViT-g/14 在CV-Bench上差距约为5-7分──

2026年开放的VLM的默认编码器是用于语义+密集功能的SigLIP 2 SO400m/14,有时会见DINOv2 ViT-g/14功能的拼音:Cambrian的空间视觉集成器 就这样做)

### 轴2:连接器设计 差异不大

对于平均聚合补丁使用2层MLP,在相同的代币预算下,表现距离32查询Q-Former不到1点.

实际上,代币数量很重要. 更多的视觉代币 = 更多的LLM计算 = 更好表现,直到某个点后收益递减.

无论图像分辨率如何,Q-Former都把代币限制在32-64;MLP输出全部补丁代币――对高分辨率输入,Q-Former节省LLM环境;对低分辨率,差异只是噪音――

### 轴3:LLM大小决定上限

在每篇VLM论文中,把LLM从7B翻倍到13B,通常都会让MMMU增加 2-4分点──到70B,大多数基准会和──VLM的多模式推理天花板就是LLM的文本推理天花板视觉编码器只能信息,不能替代推理──

这就是为什么Qwen2.5VL-72B和Claude Opus4.7在MMMU-Pro和ScreenSpot-Pro上大幅领先:语言大脑很大――一个7BVLM不能靠巧妙的连接器设计替代70BVLM――

### 轴4数据 详细的人类标题 胜过蒸

尔莫 + 皮克斯莫 (Molmo + PixMo) ((Deitke et al., 2024) 是每个人都应该阅读的2024年结果.

摩尔莫-72B 在 11/11 个基准上击败Llama-3.2-90B-Vision──差别不在于架构,而在标题质量──详细的人类标题 每张图像含有信息量比短网标题多 5-10倍,并且在GPT-4V蒸中容易幻的地方保持事实地基──

和 (Chen et al., 2023) 和Idefics2) 采用了同样的游戏簿,混合人 + GPT-4V标题――趋势很明确:对2026边境而言,标题密度 >标题量 >蒸便利性――

### 轴5:决议 及其时间表

图像分化 (图像分化) 任何Res) 在 OCR 基准上再增加 3-5─ 平分辨率训练 会在中等准确度 附近平原;分辨率上升(从224 开始,以 448 或本土 结束) 训练更快,最终更高──

布里安-1做了分辨率与代币交易:在固定计算下,你可以选择低分辨率下更多代币,或高分辨率下更少代币.

2026年生产配方:第一阶段以384固定训练,第二阶段对OCR重任务使用最高1280的动态分辨率.

### 体的受控对比

马克·卡拉姆切蒂等同类的论文:

- 解释约60%的变异──
- 解答约20%的编码选择
- 连接器架构 解释约5%──
- 其他所有因素 (数据组合,时间表,LR) 解释剩余的15%

这是一个粗略的解答,但也在文献中对我应该先解答什么最清晰的答案.

### 2026年 选手

基于证据,2026年新项目的默认开放VLM配方:

- 编码器:本土分辨率 下的SigLIP 2 SO400m/14与NaFlex;如果需要分区/地接,则拼音DINOv2 ViT-g/14 以获得密集功能──
- 连接器:补丁代币 上的2层MLP──除非代币限制,否则跳过Q-Former──
- 根据目标延迟选择.
- 数据:PixMo + ShareGPT4V + 炉,并使用任务特定指令数据 补足。
- 解析度:动态 (长边分 256、最大 1280 像素)
- 时间表:第1阶段的配列(仅投影机) ◎第2阶段的完整调整,

这些默认项中的每一个都可以追溯到本课末引用文档中实测 ablation.


```figure
l5-vlm-recipe-knobs
```

## 使用它
`code/main.py`是一个缩表解析器和食谱选手. 它编码了MM1和Idefics2缩表.

- 给定预算X和任务Y,哪个食谱胜出?
- 如果我在7B拉马上把SigLIP换成Clip,预期MMMU的三角形是多少?
- 为了得到80%的信心,我应该先把哪个轴解开?

输出是一个排名的食谱列表,包含预期基准分数和表第一建议.

## 交付它
本课生成 `outputs/skill-vlm-recipe-picker.md`△给定目标任务组合,计算预算和延迟目标,它会输出完整的配方 ((编码器,连接器,LLM,数据组合,分辨率时间表),并为每个选择引用应对的排放.

## 练习
1. 阅读MM1第3.2节. 对于固定的2B LLM,在50M图像预算下,哪个编码器 胜出?如果换成13B LLM,答案会反转吗?为什么?

2. 剑桥-1 发现,拼音 DINOv2 + SigLIP 在视觉中心的基准上胜过单独使用任一者,但在MMMU上没有新增信号――预测哪些基准将升级,哪些将持平――

3. 你的目标是2B LLM上构建移动UI代理――选择编码器、连接器、解析度 和数据混合――使用具体的缩表 证明每个选择――

4. 摩尔莫发布了4B和72B模型,4B与封闭的7BVLM有竞争力;72B在11/11的基准上击败了Llama-3.2-90B-Vision.

5. 设计一个抽象表,用于7B VLM 上隔离数据混合质量和编码器质量――最少需要多少次训练运行?提出四个轴设置――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | “调一个 knob” | 训练多次 runs，它们只在一个 design-space axis 上不同，其他全部保持 constant |
| Connector | “Bridge” / “projector” | 将 vision encoder output 映射到 LLM token space 的 trainable module（MLP、Q-Former、Perceiver） |
| Detailed human caption | “Dense caption” | 多句人类撰写的描述（通常 80-300 tokens），比 web alt text 更丰富 |
| Distillation | “GPT-4V captions” | 由更强的 proprietary VLM 生成的 training data；方便，但容易继承 hallucination |
| AnyRes / dynamic res | “High-res path” | 通过 tiling 或 M-RoPE 输入大于 encoder native resolution 的图像的 strategy |
| Resolution ramp | “Curriculum” | 从 low-resolution 开始并逐步提高的 training schedule，可加快 alignment learning |
| Vision-centric bench | “CV-Bench / BLINK” | 强调细粒度 visual perception，而非 language-heavy reasoning 的 evaluation |
| PixMo | “Molmo's data” | Allen AI 的 712K densely-captioned image dataset；人类语音被转写为 dense captions |

## 延伸阅读
- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
