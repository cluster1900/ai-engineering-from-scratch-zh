# AI 迷思破解

关于 AI、ML 和 Deep Learning 的常见误解。每一条都解释实际发生的情况。

---

## "AI understands language"

**现实：** LLMs 基于训练数据中的统计模式来预测下一个 Token。它们没有理解、没有信念、没有世界模型（至少我们无法证明）。它们非常擅长在数十亿示例中进行模式匹配。输出看起来像是理解，是因为这些模式足够丰富，可以覆盖大多数情境。

**为什么重要：** 如果你把 LLM 当作推理引擎，它自信地说错话时你会感到意外。如果你把它当作模式匹配器，你会围绕它设计出更好的系统。

---

## "More parameters = smarter model"

**现实：** 一个用高质量数据和良好技术训练的 7B 参数模型，可能胜过一个用垃圾数据训练的 70B 模型。Chinchilla 表明，大多数模型都是参数过多而训练不足。训练数据的质量和数量与模型大小同样重要。Phi-2 (2.7B) 在许多 benchmark 上击败了规模大 10 倍的模型。

**为什么重要：** 不要默认选择最大的模型。让模型大小匹配你的任务和预算。

---

## "Neural Network 是黑箱"

**现实：** 我们有工具可以理解 Neural Network 学到了什么。Attention 可视化展示模型关注哪些 Token。探测分类器揭示隐藏表示中存储了哪些信息。机制可解释性正在发现真实的电路（induction heads、feature detectors）。这不是完全透明，但也不是黑箱。

**为什么重要：** 你可以调试 Neural Network。Gradient 分析、activation 可视化和 attention maps 都是真实工具，本课程会覆盖它们。

---

## "AI 会取代程序员"

**现实：** AI 改变了编程，但没有取代编程。AI 编写样板代码。人类设计系统、做架构决策、审查正确性，并处理 AI 出错的情况。角色从“编写每一行代码”转向“审查、指挥和架构设计”。最优秀的工程师把 AI 当作工具使用，而不是把它当作替代品来恐惧。

**为什么重要：** 你正在学习 AI engineering，也就是编程 + AI。两项技能结合起来，比任何单项技能都更有价值。

---

## "做 AI 需要数学 PhD"

**现实：** 你需要高中数学，加上本课程 Phase 1 中的特定主题。Linear algebra、calculus、probability 和 optimization。你不需要证明。你需要对操作做什么以及为什么重要有直觉。如果你能做 Matrix 乘法并求导，你就能构建 Neural Network。

**为什么重要：** Phase 1 的存在就是为了给你刚好需要的数学，仅此而已。

---

## "GPT 是 General Purpose Technology 的缩写"

**现实：** GPT 代表 Generative Pre-trained Transformer。Generative = 它生成文本。Pre-trained = 在适配之前，先在大型语料库上训练一次。Transformer = 来自 2017 年 "Attention Is All You Need" 论文的架构。

---

## "Temperature 会让 AI 更有创造力"

**现实：** Temperature 会在 softmax 之前缩放 logits。更高的 temperature = 更平坦的概率分布 = 更随机的 Token 选择。更低的 temperature = 更尖锐的分布 = 更确定性。这不是创造力，而是随机性。高 temperature 的模型并不会思考得更努力，它只是会考虑可能性更低的 Token。

**为什么重要：** 当你的输出太重复时，提高 temperature。当它太混乱时，降低 temperature。它只是一个随机性旋钮，仅此而已。

---

## "Fine-tuning 会让模型学到新知识"

**现实：** Fine-tuning 调整的是模型如何使用已有知识，而不是它知道什么。如果信息不在 pre-training 数据中，fine-tuning 不能可靠地添加它。Fine-tuning 更适合改变行为（风格、格式、语气、任务特定模式），而不是添加事实。对于新知识，使用 RAG。

**为什么重要：** 如果你需要模型了解公司的内部文档，使用 RAG。如果你需要它以特定格式响应，进行 fine-tune。

---

## "Bigger context window = better"

**现实：** 模型在长上下文中会退化。"lost in the middle" 问题意味着模型会更多关注长 prompt 的开头和结尾，而较少关注中间部分。200K context window 并不意味着模型能同样好地使用全部 200K Token。此外，更长的上下文成本更高、速度更慢。

**为什么重要：** 不要把所有内容都塞进上下文。要有选择性。带有定向检索的 RAG 胜过把完整文档塞进去。

---

## "AI agents are autonomous"

**现实：** 当前 AI agents 运行在一个循环中：思考、行动、观察、重复。它们遵循 harness 定义的模式。它们没有目标、计划或自我意识。它们是使用 LLMs 决定下一步调用哪个工具的反应式系统。所谓的“自主性”来自循环，而不是来自 AI。

**为什么重要：** 构建 agents 时，你构建的是循环、工具和 guardrails。LLM 只是你系统内部的决策组件。

---

## "Transformer 理解顺序是因为 positional encoding"

**现实：** Transformers 本身没有内在的顺序感。Self-attention 将输入视为集合，而不是序列。Positional encoding 是一种 hack，通过向输入添加依赖位置的 Vector 来注入顺序信息。不同方法（sinusoidal、learned、RoPE、ALiBi）以不同方式处理这个问题。它们都没有真正赋予模型像 RNNs 那样的序列理解能力。

**为什么重要：** 这就是 positional encoding 研究仍然活跃的原因。对大多数用途来说，这是一个解决到够用的问题，但从根本上说它是一种变通方案。

---

## "Pre-training 只是阅读互联网"

**现实：** Pre-training 是在海量语料库上做 next-token prediction。模型学习在给定前文的情况下预测接下来会出现什么。通过这个简单目标，它学习语法、事实、推理模式、代码结构等。但它也会学到互联网废话、偏见和错误信息。数据整理、过滤和去重极其重要。

**为什么重要：** 垃圾进，垃圾出。Pre-training 数据质量是模型之间最大的差异化因素之一。

---

## "RLHF 会让 AI 与人类价值观对齐"

**现实：** RLHF 让 AI 对齐的是提供反馈的特定人群的偏好。这些人彼此并不一致，也有偏见，而且无法覆盖所有情境。RLHF 让模型以评分者定义的方式变得有帮助且无害，而不是对齐某种普遍的人类价值体系。

**为什么重要：** RLHF 是一种训练技术，不是 alignment 的解决方案。它只是更大工具箱中的一个工具。

---

## "Embeddings 会捕捉含义"

**现实：** Embedding 捕获的是统计共现模式。在相似上下文中出现的词会得到相似的 Vector。这与含义有足够好的相关性，因此很有用，但这不是语义理解。"King - Man + Woman = Queen" 能成立，是因为分布模式，而不是因为模型理解君主制或性别。

**为什么重要：** Embedding 对 similarity search、clustering 和 retrieval 很强大。但不要过度解读“相似”的含义。

---

## "Zero-shot 意味着没有训练"

**现实：** Zero-shot 指的是 inference 时没有任务特定示例。模型仍然是在数十亿 Token 上训练过的。它只是没有见过这个特定任务格式的示例。它从 pre-training 模式中泛化。Few-shot 指在 prompt 中给出少量示例。两者都不意味着模型没有经过训练就学会了。

---

## "AI 模型像人类一样学习"

**现实：** 人类可以从少量示例中学习、跨领域泛化，并持续更新信念。Neural Network 需要数百万示例，在训练分布内泛化，并且训练后权重固定。学习类比充其量只是宽泛类比。Backpropagation 与生物神经元的学习方式完全不同。

**为什么重要：** 不要把模型拟人化。这会导致你对它们能做什么和不能做什么产生错误预期。

---

## "Scaling laws 意味着越大总是越好"

**现实：** Scaling laws 描述 compute、data 和 model size 之间可预测的关系。它们显示出收益递减：参数翻倍并不会让性能翻倍。它们还假设你按比例扩展数据。许多实际改进来自更好的架构、训练技术和数据质量，而不只是规模。

**为什么重要：** 一个工程做得好的 7B 模型就能解决你的问题。不要默认就选择 70B。

---

## "开源 AI 等同于 open weights"

**现实：** 大多数“open source”模型其实是 open weights。你能拿到模型文件，但拿不到训练数据、训练代码或数据管线。真正的 open source（如 OLMo）会发布所有内容：数据、代码、中间 checkpoints、evaluation。Open weights 很有用，但不等同于 open source 的承诺。

**为什么重要：** 弄清楚你拿到的是什么。Open weights 让你可以运行和 fine-tune。真正的 open source 让你可以复现和理解。

---

## "Prompt engineering 不是真正的工程"

**现实：** Prompt engineering 是系统设计。你在设计人类意图与模型行为之间的接口。好的 prompt engineering 需要理解 tokenization、attention patterns、context window 限制和输出解析。它更接近 API 设计，而不是“好好跟 AI 说话”。

**为什么重要：** 本课程在 Phase 11 中把 prompt engineering 作为真正的工程学科来教授。

---

## "CNNs 已经过时，现在一切都是 Transformer"

**现实：** Vision Transformers (ViT) 在许多 benchmark 上击败了 CNNs，但 CNNs 仍被广泛使用。它们 inference 更快，在 mobile/edge 上表现良好，需要的数据更少，并且有有用的归纳偏置（translation invariance、local patterns）。许多生产级 vision systems 仍然使用 CNNs。最好的架构往往会结合两者。

**为什么重要：** 两者都要学（Phases 4 和 7）。根据你的约束使用有效的方案。

---

## "你需要海量算力才能训练有用的模型"

**现实：** 你需要海量 compute 来 pre-train foundation models。但 fine-tuning、LoRA 和 transfer learning 让你可以在单张 GPU 上适配模型。许多有用的 AI applications 根本不需要训练，只需要好的 prompting 和 RAG。“compute barrier”针对的是构建 foundation models，而不是使用它们。

**为什么重要：** 你可以用一台 laptop 构建真实的 AI applications。本课程会证明这一点。
