# AI Engineering Glossary

当课程、论文、Model Card 或代码审查引入术语的速度快于解释速度时，请使用此词汇表。按确切术语或别名搜索，先阅读直接定义，再通过实践说明将其关联到你可以构建的系统。

每个条目都属于一个学习类别。`Related terms` 为你提供接下来值得了解的概念，而不强制规定固定路径。定义描述常见的工程含义，但特定提供商的行为可能有所不同。当 API 契约或 Model Card 与通用定义不一致时，以当前官方文档为准。

十二个类别分别是：数学与 Training；Model 与 Inference；数据与表示；检索与生成；Prompt 与 Context；Agent 与 Tool；Evaluation 与安全；AI-native 开发；基础设施与服务；可靠性与运维；安全与治理；Multimodal 系统。

## A

### Activation Checkpointing
- **类别：** 数学与 Training
- **实际含义：** 一种 Training 内存技术，仅保存选定的前向传播激活值，并在 Backpropagation 期间重新计算省略的激活值。
- **重要性：** 它以增加计算量为代价减少激活值存储，使你能在固定内存预算内 Training 更大的 Model 或更长的序列。
- **实践方式：** 对占用大量内存的 Transformer 模块执行 checkpoint，测量额外的单步耗时，并将恢复 Checkpoint 与激活值重计算设置分开管理。
- **常见误区：** Activation checkpointing 并不是持久化的 Training Checkpoint。它能让一次前向和Backpropagation适配可用内存，但无法恢复崩溃的运行。
- **相关术语：** Autograd, Backpropagation, Checkpoint, Mixed Precision
- **来源：** [Training Deep Nets with Sublinear Memory Cost](https://arxiv.org/abs/1604.06174)

### Activation Function
- **类别：** 数学与 Training
- **人们常说：** 层之间的非线性运算。
- **实际含义：** 在线性层或仿射层之后应用、用于引入非线性的函数。如果没有它，组合多个带权重和偏置的层最终只会等价于一次仿射变换。ReLU、GELU 和 SiLU 是常见选择。具体选择会直接影响 Training 期间 Gradient 能否正常传播。
- **学习课程：** [Activation Functions](../phases/03-deep-learning-core/04-activation-functions/)
- **相关术语：** ReLU, Gradient, Backpropagation

### Adam (Optimizer)
- **类别：** 数学与 Training
- **人们常说：** 不假思索就会使用的 Optimizer。
- **实际含义：** Adaptive Moment Estimation。它将 Gradient 的指数平均与 Gradient 平方的指数平均相结合，应用偏差校正，并针对每个参数自适应调整更新尺度。它是一个实用的基线，但仍然需要合适的 Learning Rate 和调度策略。
- **常见误区：** Adam 是一个强基线，并非普遍适用的最佳 Optimizer。
- **来源：** [Adam paper](https://arxiv.org/abs/1412.6980)
- **相关术语：** AdamW, Optimizer, Learning Rate

### AdamW
- **类别：** 数学与 Training
- **人们常说：** 修复了 weight decay 的 Adam。
- **实际含义：** 一种将 weight decay 与基于 Gradient 的参数更新解耦的 Adam 变体。相比在 Adam 自适应缩放的 Gradient 内加入 L2 惩罚，这种方式的收缩行为更容易理解和推断。
- **常见误区：** 解耦的 weight decay 并不会让 AdamW 在所有情况下都达到最优。Model、数据和 Training 规模仍会决定最佳 Optimizer 与调度策略。
- **来源：** [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101)
- **相关术语：** Adam (Optimizer), Weight Decay, Optimizer

### Admission Control
- **类别：** 可靠性与运维
- **实际含义：** 一道接受请求前的关卡，根据系统当前的容量、优先级和策略，决定请求是否可以进入有界队列或服务。
- **重要性：** 在受控边界拒绝过量工作，可以保护已接受的请求免受队列膨胀、超时级联和资源耗尽的影响。
- **实践方式：** 估算请求成本，检查租户和系统容量，以原子方式预留所需预算，并在拒绝时指出过载范围。仅当状况是暂时的且调用方的重试预算允许再次尝试时，才提供重试指引。
- **常见误区：** Admission control 在接受请求之前生效。Load shedding 可以在入口、队列、依赖项或其他过载边界拒绝或移除工作。
- **相关术语：** Load Shedding, Backpressure, Rate Limit, Saturation
- **来源：** [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/)

### Agent
- **类别：** Agent 与 Tool
- **人们常说：** 一个独立思考和行动的自主 Model。
- **实际含义：** 一种软件系统，它允许 Model 选择实现目标的行动、观察 Tool 或环境返回的结果，并在编排策略下继续运行。Agent 可以使用循环、状态机、工作流引擎或人工审批。Model 只是其中一个组件，而不是整个系统。
- **重要性：** 可靠性来自 Model 周围的运行框架、Tool 契约、状态、权限和验证机制。
- **实践方式：** 编码 Agent 读取仓库 Context、提出补丁、在 Sandbox 中运行测试，并在部署前停下来等待审批。
- **常见误区：** 自主性代表委托权限的程度，并非每个 Agent 都必须具备的属性。
- **学习课程：** [The Agent Loop](../phases/14-agent-engineering/01-the-agent-loop/)
- **相关术语：** Agent Harness, Agent State, Tool Contract, Human-in-the-Loop (HITL)

### Agent Harness
- **类别：** Agent 与 Tool
- **实际含义：** 围绕 Model 构建的运行时，负责组装 Context、开放 Tool、管理状态、实施限制、记录 Trace，并决定 Agent 应该继续、重试、询问还是停止。
- **重要性：** 使用相同 Model 的两个系统可能表现截然不同，因为它们的运行框架提供了不同的 Context、Tool、反馈和安全边界。
- **实践方式：** 你的运行框架可以将 Agent 限制为最多调用五次 Tool，在每个被接受的补丁后持久化一个 Checkpoint，并要求测试命令通过后才能完成任务。
- **常见误区：** 运行框架的范围比 Prompt 模板更广，但比完整产品更窄。
- **学习课程：** [Minimal Agent Workbench](../phases/14-agent-engineering/32-minimal-agent-workbench/)
- **相关术语：** Agent, Tool Contract, Agent State, Verification Gate, Sandbox

### Agent Memory
- **类别：** Agent 与 Tool
- **实际含义：** 存储在 Model 外部并被选用于后续 Agent 步骤的信息，例如先前的决策、用户偏好、任务经历或已验证的事实。
- **重要性：** 它让 Agent 能够跨越单个 Context window 保持连续性，而不必将所有历史事件都塞进每个 Prompt。
- **实践方式：** 存储带有来源信息的精简任务结果，仅在相关时检索，并允许用户检查或更正持久保存的个人信息。
- **常见误区：** Agent memory 与 Agent state 并不相同。State 跟踪当前运行；memory 保存选定信息，以供未来可能的运行使用。
- **相关术语：** Agent State, Context Engineering, Checkpoint, Semantic Cache
- **来源：** [Generative Agents](https://arxiv.org/abs/2304.03442)

### Agent State
- **类别：** Agent 与 Tool
- **实际含义：** Agent 在多个步骤间携带的显式数据，例如当前目标、已完成的行动、Tool 结果、待解决问题、预算、审批和产物引用。
- **重要性：** 显式 State 让长任务可以恢复和检查，并减少对 Model 根据对话记录重建进度的依赖。
- **实践方式：** 将选定的 issue、已更改文件、最新测试结果和剩余检查项存储在一个类型化对象中，并在每次行动后更新该对象。
- **常见误区：** State 与对话历史并不相同。对话记录是证据；State 是用于决定接下来会发生什么的精简操作记录。
- **学习课程：** [Repository Memory and State](../phases/14-agent-engineering/34-repo-memory-and-state/)
- **相关术语：** Checkpoint, Durable Execution, Context Engineering, Handoff

### Agent Skill
- **类别：** Agent 与 Tool
- **实际含义：** 一个可发现的程序性指令目录，以 `SKILL.md` 作为入口，并可选择包含兼容运行时能够分阶段加载的参考资料、脚本和资产。
- **重要性：** 它将可复用的任务知识独立于单次对话进行打包，同时让更深入的 Context 和确定性辅助程序可以按需使用。
- **实践方式：** 发布简洁的名称和路由描述，仅在激活后加载工作流，并在任务到达相应分支时读取该分支特定的参考资料。
- **常见误区：** 激活 Skill 会提供 Context，但不会开放 Tool、授予权限、创建 Sandbox，也无法证明最终工作是正确的。
- **学习课程：** [Agent Skills: Portable Contract and Runtime Boundary](../phases/13-tools-and-protocols/22-skills-and-agent-sdks/)
- **相关术语：** Skill Bundle, Skill Catalog, Skill Invocation, Progressive Disclosure, MCP (Model Context Protocol)
- **来源：** [Agent Skills specification](https://agentskills.io/specification)

### AI Risk Assessment
- **类别：** 安全与治理
- **实际含义：** 一份有记录的分析，用于说明 AI 系统如何影响个人、组织和环境，包括使用 Context、危害、发生可能性、影响、控制措施、剩余风险和监控职责。
- **重要性：** 仅凭 Model 能力无法确定风险。部署 Context、受影响群体、人工权限、数据和系统集成方式都会改变可能造成的危害及所需的控制措施。
- **实践方式：** 定义预期用途和受影响方，识别可信的故障与滥用场景，为控制措施指定负责人，记录剩余风险，并为重大变更设置审查触发条件。
- **常见误区：** 风险评估用于支持在既定假设下做出决策。它不是一次性的安全证书，也不能证明所有危害均已被发现。
- **相关术语：** Threat Model, Guardrails, Human-in-the-Loop (HITL), Data Classification
- **来源：** [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

### Alignment
- **类别：** Evaluation 与安全
- **人们常说：** 让 AI 变得安全。
- **实际含义：** 努力使 Model 或 AI 系统在预期和对抗性场景下，其行为都能符合预期目标、约束和人类偏好。
- **重要性：** 系统可能在优化既定指标的同时违背用户的真实意图，因此 alignment 不仅需要 Model Training，还需要 Evaluation、监督和系统控制。
- **相关术语：** Guardrails, Evaluation (Eval), Human-in-the-Loop (HITL)

### Approval Gate
- **类别：** Agent 与 Tool
- **实际含义：** 一个控制点，在获得授权人员或策略的许可前，阻止执行会造成重大后果的行动。
- **重要性：** 它限制不确定 Model 决策的影响范围，同时保留对可逆工作的自动化能力。
- **实践方式：** 允许 Agent 起草数据库迁移并在一次性数据库上运行，但任何生产环境执行都必须由负责人批准。
- **常见误区：** Approval gate 询问某项行动是否已获授权。Verification gate 询问证据是否表明该行动正确。
- **学习课程：** [Verification Gates](../phases/14-agent-engineering/38-verification-gates/)
- **相关术语：** Human-in-the-Loop (HITL), Verification Gate, Least Privilege

### Approximate Nearest Neighbor (ANN)
- **类别：** 检索与生成
- **实际含义：** 一种搜索方法，无需将查询与每个已存储 Vector 进行穷举比较，即可返回很可能属于查询最近邻的 Vector。
- **重要性：** 近似计算让大型 Vector 索引变得实用，但也在搜索速度、内存和检索 Recall 之间引入了可测量的权衡。
- **实践方式：** 使用留出的查询集调整索引和搜索参数，然后同时报告延迟与 Recall@K，而不是假定每个真实邻居都会被找到。
- **常见误区：** ANN 描述的是一种搜索目标及其权衡，而 HNSW 是可以实现它的一种具体索引算法。
- **相关术语：** Vector Database, HNSW, Cosine Similarity, Recall@K
- **来源：** [Efficient and Robust Approximate Nearest Neighbor Search Using HNSW](https://dl.acm.org/doi/10.1109/TPAMI.2018.2889473)

### Attention
- **类别：** Model 与 Inference
- **人们常说：** Model 如何聚焦于重要的 Token。
- **实际含义：** 一种形成上下文表示的机制：将 query Vector 与 key Vector 进行比较，对得到的分数进行归一化，再使用这些分数组合 value Vector。mask、位置规则或稀疏模式可以限制哪些位置参与计算。
- **重要性：** Attention 允许 Model 在序列位置之间传递信息，但它本身并不能解释或证明 Model 理解了什么。
- **常见误区：** Attention 权重是计算系数，并不是对 Model 推理过程的忠实解释。
- **学习课程：** [Self-Attention from Scratch](../phases/07-transformers-deep-dive/02-self-attention-from-scratch/)
- **来源：** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- **相关术语：** Self-Attention, Transformer, KV Cache

### Audio Token
- **类别：** Multimodal 系统
- **实际含义：** 由音频 codec 或 Tokenizer 针对音频信号的短片段或 Feature 生成的离散标识符，有时会跨多个 codebook 生成。
- **重要性：** 离散音频表示使序列 Model 能够使用面向 Token 的架构处理、预测、存储或生成声音。
- **实践方式：** 将 codec 与 Model 一起进行版本管理，保留采样率和 codebook 元数据，测量重建质量，并区分语义音频 Token 与波形压缩 Token。
- **常见误区：** 音频 Token 并不代表固定时长、音素或单词。它的含义和时间跨度取决于 Tokenizer 与 codebook 的设计。
- **学习课程：** [Neural Audio Codecs](../phases/06-speech-and-audio/13-neural-audio-codecs/)
- **相关术语：** Token, Embedding, Automatic Speech Recognition (ASR), Multimodal Model
- **来源：** [SoundStream](https://arxiv.org/abs/2107.03312)

### Audit Log
- **类别：** 安全与治理
- **实际含义：** 一份持久且受访问控制的记录，用于保存与安全或问责相关的事件，包括由谁或什么执行了操作、发生了哪些变更、何时发生以及最终状态。
- **重要性：** 会造成重大后果的 Agent 行动需要留下证据，以便支持调查、策略审查和超越性能调试范畴的责任认定。
- **实践方式：** 记录 Tool 授权、审批决策、外部写入、策略版本和产物标识符，同时隐去密钥并限制日志访问。
- **常见误区：** Trace 有助于诊断单次执行路径。Audit log 则保存跨多次执行且长期问责所需的事件。
- **相关术语：** Trace, Observability, Approval Gate, Provenance Attestation
- **来源：** [NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final)

### Autograd
- **类别：** 数学与 Training
- **人们常说：** 自动计算 Gradient。
- **实际含义：** 一种记录或转换 Tensor 运算的系统，从而能够计算 Derivative，通常使用反向模式自动微分。你编写前向计算，框架则推导 Backpropagation 所需的 Gradient。
- **学习课程：** [Chain Rule and Automatic Differentiation](../phases/01-math-foundations/05-chain-rule-and-autodiff/)
- **相关术语：** Backpropagation, Gradient, Tensor

### Automatic Speech Recognition (ASR)
- **类别：** Multimodal 系统
- **实际含义：** 将语音信号映射为转录文本的任务和系统 Pipeline，通常还可以提供可选的 Token 或片段时间信息及置信度信息。
- **重要性：** 语音界面依赖的不只是语言建模。声学差异、分段、解码、词汇表和领域条件都会影响最终转录结果。
- **实践方式：** 按语言、说话者、噪声和领域评估单词或字符错误；当下游 grounding 需要时保留时间戳；并测试生产环境实际使用的完整音频预处理流程。
- **常见误区：** ASR 转录说了什么。确定是谁说的需要说话人分离或说话人识别，而翻译和意图理解则是独立任务。
- **学习课程：** [Speech Recognition and ASR](../phases/06-speech-and-audio/04-speech-recognition-asr/)
- **相关术语：** Audio Token, Encoder, Tokenization, Multimodal Model
- **来源：** [Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf)

### Autoregressive
- **类别：** Model 与 Inference
- **人们常说：** Model 每次生成一个单词。
- **实际含义：** 一种因子分解方式，其中每个输出 Token 都根据其之前的 Token 进行预测。在生成期间，选定的 Token 会被追加到序列中，并成为下一次预测 Context 的一部分。
- **常见误区：** 其单位是 Token，不一定是单词；而且生成过程可以使用不同的解码方法，并非总是选择 Probability 最高的 Token。
- **相关术语：** Token, Temperature, KV Cache

### Autoscaling
- **类别：** 基础设施与服务
- **实际含义：** 一种控制循环，根据观察到的需求、资源使用情况或应用指标，在配置的边界内改变服务 worker 的数量或容量。
- **重要性：** AI 工作负载的变化速度可能快于人工配置，但扩缩容决策必须考虑 Model 加载时间、加速器可用性、排队情况和请求成本。
- **实践方式：** 根据与有效工作相关的需求信号进行扩缩容，设置最小预热容量，限制缩容抖动，并在新副本接收流量前验证其是否通过就绪检查。
- **常见误区：** Autoscaling 会增加或移除容量。它无法让过载的依赖项变快，也无法保证及时获得足够的硬件。
- **学习课程：** [GPU Autoscaling on Kubernetes](../phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/)
- **相关术语：** Model Serving, Saturation, Readiness Probe, Backpressure
- **来源：** [Kubernetes Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

### Availability
- **类别：** 可靠性与运维
- **实际含义：** 在规定的测量边界内，用户能够获得符合定义的可接受服务的合格服务交互或时间窗口所占的比例。
- **重要性：** 服务可能仍在运行，但用户却无法完成有用的请求，因此可用性必须与用户可见的成功相关联，而不能只与进程正常运行时间相关联。
- **实践方式：** 定义合格事件和可接受结果，仅排除已记录的情况，在固定窗口内计算指标，并调查完全失败和长时间的部分降级。
- **常见误解：** 可用性只是可靠性的一项结果。它并不能描述延迟、正确性、安全性或每个用户群体的体验。
- **相关术语：** Service Level Indicator (SLI), Service Level Objective (SLO), Error Budget, Incident Response
- **来源：** [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

## B

### Backpressure
- **类别：** AI-native 开发
- **实际含义：** 一种流量控制机制，当下游组件无法以当前速率安全处理工作时，它会减缓或拒绝上游工作。
- **重要性：** 如果没有 Backpressure，排队中的 Agent 运行、Tool 调用或流式事件可能耗尽内存、超过速率限制并放大重试。
- **实践方式：** 当评估器队列达到上限时，暂停新的 Agent 作业或返回可重试响应，而不是接受无上限的工作。
- **常见误解：** Backpressure 在故障发生前保护容量。Circuit Breaker 则在故障表明依赖项不健康后停止调用。
- **相关术语：** Rate Limit, Retry with Backoff, Circuit Breaker

### Backpropagation
- **类别：** 数学与 Training
- **人们常说：** Neural Network 如何学习。
- **实际含义：** Chain Rule 的一种高效应用，它将 Derivative 从 Scalar Loss 沿计算图向后传播。它负责计算 Gradient；Optimizer 使用这些 Gradient 更新参数。
- **常见误解：** Backpropagation 负责计算 Gradient。它并不选择更新规则或 Learning Rate。
- **名称由来：** Derivative 信息从 Loss 向更早的运算反向移动。
- **学习课程：** [Backpropagation from Scratch](../phases/03-deep-learning-core/03-backpropagation/)
- **相关术语：** Autograd, Gradient, Optimizer

### Batch Size
- **类别：** 数学与 Training
- **人们常说：** 一次处理多少个样本。
- **实际含义：** 在一次 Optimizer 更新之前，其 Loss 共同构成一次 Gradient 估计的样本数量。更大的 Batch 可以提高硬件利用率并减少 Gradient 噪声，但需要更多内存，并且可能需要不同的 Learning Rate 或调度策略。
- **常见误解：** 不存在通用的 Batch Size 范围，也不存在每次增大 Batch 都应按相同比例提高 Learning Rate 的规则。
- **相关术语：** Learning Rate, Gradient, Optimizer

### Benchmark Contamination
- **类别：** Evaluation 与安全
- **实际含义：** Evaluation 样本与用于预训练、调优、Prompt、选择或以其他方式改进被评估系统的数据之间存在重叠或信息泄漏。
- **重要性：** 污染可能使基准分数反映的是此前接触过相关内容，而不是泛化到未见任务的能力。
- **实践方式：** 跟踪 Dataset 来源，在 Training 数据源中搜索完全重复和近似重复内容，保留私有测试用例，并使用新编写的样本更新公开 Evaluation。
- **常见误解：** 污染的范围比完全复制更广。改写内容、答案、基准元数据和反复进行的 Prompt 调优也可能泄漏 Evaluation 信息。
- **相关术语：** Data Leakage, Data Deduplication, Eval Set, Exact Match (EM)
- **来源：** [Investigating Data Contamination in Modern Benchmarks for Large Language Models](https://arxiv.org/abs/2311.09783)

### BM25
- **类别：** 检索与生成
- **实际含义：** 一种词法排序函数，它根据查询词匹配情况为文档评分，同时考虑词语稀有度、重复出现次数和文档长度。
- **重要性：** 它是强大的精确词语检索基线，并能在标识符、稀有词和领域特定短语方面补充 Dense Retrieval。
- **实践方式：** 使用 BM25 和 Dense Search 检索候选项，合并它们的排名，然后在添加成本更高的 Reranker 之前评估合并结果。
- **常见误解：** BM25 并不直接理解语义相似性，而且其分数在不同查询或索引配置之间没有通用含义。
- **相关术语：** Hybrid Retrieval, Dense Retrieval, Reranker, RAG (Retrieval-Augmented Generation)
- **来源：** [The Probabilistic Relevance Framework: BM25 and Beyond](https://doi.org/10.1561/1500000019)

### Byte Pair Encoding (BPE)
- **类别：** 数据与表示
- **实际含义：** 一种子词 Tokenization 方法，通过反复合并频繁相邻的单元，从 Training 文本中构建固定词表。
- **重要性：** 它在词表大小与将稀有词或未见词表示为更小单元的能力之间取得平衡。
- **实践方式：** 仅使用获批的语料划分训练 Tokenizer，将其合并规则与 Model 一起进行版本管理，并检查它如何切分代码、多语言文本和空白字符。
- **常见误解：** BPE 是 Tokenizer 的一种类型，并非对所有 Model 如何创建 Token 的通用描述。
- **相关术语：** Tokenization, Vocabulary, Token, Embedding
- **来源：** [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)

## C

### Calibration
- **类别：** Evaluation 与安全
- **实际含义：** 系统声明的置信度与处于该置信度的预测实际正确频率之间的一致程度。
- **重要性：** 系统的平均准确率可能很高，但在用户依赖其分数的案例上却可能危险地过度自信。
- **实践方式：** 按置信度对预测分桶，将置信度与经验准确率进行比较，并在差距不可接受时重新校准或拒绝作答。
- **常见误解：** Calibration 衡量的是置信度的可靠性，而不是整体准确率、事实性或推理质量。
- **相关术语：** Softmax, Evaluation (Eval), Precision & Recall, Logits
- **来源：** [On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html)

### Canary Release
- **类别：** 可靠性与运维
- **实际含义：** 一种部署策略，先将新版本暴露给有限的一部分流量或基础设施，再扩大发布范围。
- **重要性：** 它限制缺陷的影响范围，并在新的 Model、Prompt、Agent 或服务覆盖所有用户之前提供生产环境证据。
- **实践方式：** 将一小部分符合条件的用户群路由到新版本，将质量和运维指标与对照组进行比较，并在出现预定义故障时停止或回滚。
- **常见误解：** Canary Release 会限制暴露范围；它不能取代部署前测试、审批或回滚准备。
- **相关术语：** Evaluation (Eval), Observability, Rollback, Verification Gate
- **来源：** [Kubernetes Deployments: Canary Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#canary-deployment)

### Chain of Thought (CoT)
- **类别：** Prompt 与 Context
- **人们常说：** 要求 Model 展示其思考的每一步。
- **实际含义：** 在生成答案之前用于分解任务的中间推理。Prompt 可以要求提供可见的推理依据，而某些系统会使用不向用户返回的内部推理。
- **重要性：** 分解有助于处理多步骤任务，但流畅的推理依据并不能证明答案正确，也不能证明这些文本忠实反映了 Model 的内部计算。
- **实践方式：** 要求提供简洁计划，独立检查结果，并要求提供可验证的计算过程或引用，而不是依赖冗长的推理记录。
- **常见误解：** Chain of Thought 不能替代 Tool、测试或外部验证。
- **学习课程：** [Few-Shot and Chain of Thought](../phases/11-llm-engineering/02-few-shot-cot/)
- **相关术语：** Prompt Engineering, Verification Gate, Evaluation (Eval)

### Checkpoint
- **类别：** Agent 与 Tool
- **实际含义：** 用于从已知边界恢复执行的持久快照。在工作流中，它存储运行状态和产物引用。在 Model Training 中，它可以存储参数、Optimizer 状态、调度器状态和 Training 位置。
- **重要性：** 长时间运行的工作流和 Training 任务可以从中断中恢复，而无需重新执行已完成的工作或丢失代价高昂的进度。
- **实践方式：** 在通过验证的步骤后保存 Agent 已接受的补丁和测试证据，或者在关闭前保存 Training 任务的权重、Optimizer 状态、随机状态和数据位置。
- **常见误解：** 工作流 Checkpoint 和 Model Training Checkpoint 服务于相同的恢复目标，但保存的状态不同。两者都不仅仅是执行记录，也不是缺少恢复元数据的权重文件。
- **学习课程：** [Checkpoint Save and Resume](../phases/19-capstone-projects/47-checkpoint-save-resume/); [Repository Memory and State](../phases/14-agent-engineering/34-repo-memory-and-state/)
- **相关术语：** Agent State, Durable Execution, Parameter, Optimizer

### Chunked Prefill
- **类别：** 基础设施与服务
- **实际含义：** 一种服务技术，将长 Prompt 的 Prefill 工作拆分为更小的可调度片段，使 Prompt 处理能够与其他请求的 Decode 工作交错执行。
- **重要性：** 否则，一个长 Prompt 可能会占用加速器并延迟正在进行的生成，即使总吞吐量看起来正常，也会造成较差的尾部延迟。
- **实践方式：** 根据实测工作负载选择分块策略，计入调度开销，并在混合 Prompt 长度下比较 Prefill 完成时间、Decode 延迟和有效吞吐量。
- **常见误解：** Chunked Prefill 改变的是 Prompt 计算的调度方式。它不会将用户的 Context 拆分为相互独立的语义块，也不会改变 Model 的 Context Window。
- **学习课程：** [vLLM Serving Internals](../phases/17-infrastructure-and-production/04-vllm-serving-internals/)
- **相关术语：** Prefill, Decode Phase, Dynamic Batching, Tail Latency
- **来源：** [Sarathi-Serve](https://arxiv.org/abs/2403.02310)

### Chunking
- **类别：** 检索与生成
- **人们常说：** 将文档拆分成片段。
- **实际含义：** 在建立索引之前，将源材料划分为可检索单元。分块边界、重叠、元数据和文档结构共同决定检索是否能返回足够的 Context，同时避免让 Prompt 充斥过多信息。
- **重要性：** 合适的分块策略取决于文档结构、查询类型、Embedding Model 和 Evaluation 结果。不存在通用的 Token 大小或重叠比例。
- **实践方式：** 保持标题和代码块完整，附加来源元数据，然后在调整大小之前使用真实问题衡量检索质量。
- **相关术语：** RAG (Retrieval-Augmented Generation), Reranker, Grounding

### Circuit Breaker
- **类别：** AI-native 开发
- **实际含义：** 一种可靠性控制机制，在故障超过阈值后暂时停止调用依赖项，随后探测该依赖项是否已经恢复。
- **重要性：** 它可以防止反复发生的 Model 或 Tool 故障消耗系统其他部分的延迟预算、成本预算和容量。
- **实践方式：** 在 Provider 多次超时后打开 Circuit Breaker，执行故障转移或返回受控响应，然后在冷却期结束后允许进行有限的健康探测。
- **常见误解：** Circuit Breaker 响应依赖项的健康状态。Rate Limit 控制允许的请求量。
- **相关术语：** Retry with Backoff, Rate Limit, Model Router, Backpressure

### CNN (Convolutional Neural Network)
- **类别：** Model 与 Inference
- **人们常说：** 一种用于图像的 Neural Network。
- **实际含义：** 一种使用卷积运算（在输入上滑动滤波器）检测局部模式的 Neural Network。堆叠卷积可以检测越来越复杂的 Feature：边缘、纹理、物体。
- **常见误解：** 卷积也适用于音频、时间序列和其他网格状数据。
- **相关术语：** Feature, Inductive Bias, Activation Function

### Coding Agent
- **类别：** AI-native 开发
- **实际含义：** 一种专门处理软件工作的 Agent，可以检查 repository、编辑文件、运行开发 Tool，并利用其输出推进范围明确的工程任务。
- **重要性：** 它的价值取决于 repository Context、Tool 权限、审查边界和验证，而不仅仅取决于代码生成质量。
- **实践方式：** 为 Agent 提供 issue、范围契约、repository 指令和测试命令；在接受结果之前，审查生成的补丁和证据。
- **常见误解：** 只提供文本建议的编码助手不一定是 Agent。Agent 会通过 Tool 执行操作并观察结果。
- **学习课程：** [Skill Discovery and Progressive Disclosure](../phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/)
- **相关术语：** Agent Harness, Repository Map, Patch, Scope Contract, Reviewer Agent

### Compensating Action
- **类别：** Agent 与 Tool
- **实际含义：** 当原操作无法以原子方式回滚时，通过有意执行的新操作，在语义上抵消已经完成的副作用。
- **重要性：** 多步骤 Agent 工作流会跨越数据库和外部服务，在这些环境中，后续故障无法通过单个事务撤销先前的写入。
- **实践方式：** 如果预订工作流已从银行卡扣款，但预订失败，则发起可跟踪的退款并保留这两个事件，而不是删除历史记录。
- **常见误解：** Compensation 是一项新的业务操作，并非时间倒流。它也可能失败，因此需要 Idempotency、监控和升级处理。
- **相关术语：** Durable Execution, Idempotency, Checkpoint, Approval Gate
- **来源：** [Sagas](https://dl.acm.org/doi/10.1145/38713.38742)

### Content Provenance
- **类别：** 安全与治理
- **实际含义：** 关于一份媒体或其他数字内容的来源及编辑历史的可验证信息，包括与其关联的参与者、Tool、转换过程和声明。
- **重要性：** 生成式系统使人们难以仅凭外观推断来源声明，因此消费者和平台需要有关内容生成方式的可检查证据。
- **实践方式：** 将来源声明与内容绑定，使用受控身份对其签名，保留转换历史，并在证据缺失或无法验证时清楚地予以说明。
- **常见误解：** Provenance 可以确定是谁声明了某段历史，以及记录是否被篡改。它不能证明所描述的事件为真，也不能证明内容无害。
- **学习课程：** [Watermarking, SynthID, Stable Signature, and C2PA](../phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/)
- **相关术语：** Data Provenance, Provenance Attestation, Audit Log, Grounding
- **来源：** [C2PA Technical Specification](https://c2pa.org/specifications/specifications/2.2/specs/C2PA_Specification.html)

### Context Compression
- **类别：** Prompt 与 Context
- **实际含义：** 减少源材料占用的 Token 数量，同时尽力保留后续 Model 决策所需的信息。
- **重要性：** 压缩可以使长任务符合预算限制，但每个被省略的细节都会带来 Model 丢失证据、约束或未解决状态的风险。
- **实践方式：** 原样保留权威事实和标识符，总结重复历史，附加来源指针，并使用代表性任务测试压缩后的 Context。
- **常见误解：** 除非保留完整原文，否则压缩就是有损的。更短的摘要不会自动成为等价的 Context。
- **相关术语：** Token Budget, Context Engineering, Progressive Disclosure, Handoff
- **来源：** [LLMLingua](https://arxiv.org/abs/2310.05736)

### Context Engineering
- **类别：** Prompt 与 Context
- **实际含义：** 设计每个步骤中提供给 Model 的完整信息环境，包括指令、所选文件、检索到的证据、Tool 结果、示例、状态和输出约束。
- **重要性：** Model 性能不佳通常是因为相关证据缺失、过时、顺序不当或被噪声淹没。
- **实践方式：** 构建一个精简的任务包，其中包含目标、repository 规则、相关接口、近期 Tool 输出和未解决的决策，然后随着状态变化更新该任务包。
- **常见误解：** Prompt Engineering 关注指令措辞。Context Engineering 还决定哪些证据和状态进入 Model 的工作 Context。
- **学习课程：** [Context Engineering](../phases/11-llm-engineering/05-context-engineering/)
- **相关术语：** Context Window, Progressive Disclosure, Agent State, Repository Map

### Context Window
- **类别：** Prompt 与 Context
- **人们常说：** Model 能记住多少内容。
- **实际含义：** 在特定 Model 和 API 契约下，一次 Model Inference 可用的最大 Token 容量。该容量可能包括系统指令、消息、检索内容、Tool 交互和生成的输出，具体计数方式和输出限制取决于 Provider。
- **重要性：** 只有当应用发送或重建对话历史时，Model 才能使用这些历史。较大的 Context Window 并不能保证其中的每个细节都会得到可靠利用。
- **常见误解：** Context 是一次 Inference 的临时输入。持久记忆存储在 Model 外部，并被选择性地重新加入后续 Context。
- **学习课程：** [Context Engineering](../phases/11-llm-engineering/05-context-engineering/)
- **相关术语：** Token Budget, Context Engineering, Prompt Cache, Agent State

### Continuous Batching
- **类别：** 基础设施与服务
- **实际含义：** 一种服务调度器，它在迭代边界添加和移除生成请求，而不是等待固定 Batch 中的所有请求全部完成。
- **重要性：** 自回归请求会产生不同长度的输出，因此 continuous batching 可以持续利用加速器，而不必迫使短请求等待最长的请求完成。
- **实践方式：** 在容量可用时接纳新请求，跟踪每个请求的延迟，并在实时 Batch 或 KV-cache 预算用尽时施加 backpressure。
- **常见误区：** Continuous batching 是一种 Inference 调度策略，并非 Gradient 累积或 Training Batch 大小技术。
- **相关术语：** Dynamic Batching、Decode Phase、Backpressure、Rate Limit
- **来源：** [Orca](https://www.usenix.org/conference/osdi22/presentation/yu)

### Contrastive Learning
- **类别：** 数学与 Training
- **人们常说：** 通过比较进行学习。
- **实际含义：** 在 Embedding 空间中拉近相似样本对并推远不相似样本对的 Training 方法。CLIP 使用了这种方法：比较匹配的图像-文本对与不匹配的图像-文本对。
- **相关术语：** Embedding、Cosine Similarity、Loss Function

### Cosine Similarity
- **类别：** 数据与表示
- **人们常说：** 两个 Vector 有多相似。
- **实际含义：** 两个 Vector 的归一化 Dot Product。它比较的是方向而不是大小，对于实值 Vector，其取值范围为 -1 到 1。
- **常见误区：** 较高的 Cosine Similarity 只有相对于 Embedding Model 和数据分布才有意义。它不能证明事实等价或语义等价。
- **相关术语：** Embedding、Semantic Search、Reranker

### Cost per Successful Task
- **类别：** AI-native 开发
- **实际含义：** 系统总成本除以满足已定义成功标准的任务数量，其中包括重试、失败运行、Tool 使用和 Evaluation 开销。
- **重要性：** 一次廉价的 Model 调用，如果经常失败或需要人工反复修正，也可能产生昂贵的工作流。
- **实践方式：** 测量 100 个 repository 任务产生的提供商费用和基础设施成本，然后除以补丁通过测试和评审的任务数量。
- **常见误区：** 每 Token 成本衡量的是使用量。每个成功任务的成本衡量的是有用成果。
- **相关术语：** Evaluation (Eval)、Retry with Backoff、Model Router、Verification Gate

### Cross-Attention
- **类别：** Multimodal 系统
- **实际含义：** 一种 Attention，其中 query 表示来自一个序列或表示，而 key 和 value 来自另一个序列或表示。
- **重要性：** 它为一个数据流提供了从另一个数据流中检索信息的可学习方式，例如让语言 Token 关注视觉 Feature。
- **实践方式：** 明确哪个数据流提供 query、key 和 value，为缺失或无效位置应用 mask，并检查在移除某个模态后 Model 是否仍能正常工作。
- **常见误区：** Cross-Attention 并非天然属于 Multimodal。它可以连接两个文本序列或其他表示；而 Self-Attention 从同一个序列表示中派生 query、key 和 value。
- **相关术语：** Attention、Self-Attention、Vision-Language Model (VLM)、Multimodal Fusion
- **来源：** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

### Cross-Entropy
- **类别：** 数学与 Training
- **人们常说：** Classification Loss。
- **实际含义：** 一种基于分配给目标结果的负对数 Probability 的 Loss。在 next-token Training 中，当 Model 为观测到的下一个 Token 分配较低 Probability 时，它会对 Model 施加惩罚。
- **常见误区：** 只有在平均方式和对数底数定义一致时，Perplexity 才是平均 cross-entropy 的指数。
- **相关术语：** Loss Function、Softmax、Perplexity

### CUDA
- **类别：** Model 与 Inference
- **人们常说：** GPU 编程。
- **实际含义：** NVIDIA 面向兼容 GPU 上通用计算的平台和编程模型。Deep Learning 框架使用 CUDA 库和 kernel 并行执行大量 Tensor 运算。
- **常见误区：** GPU 加速并不等同于 CUDA；还存在其他硬件和软件栈。
- **相关术语：** Tensor、Mixed Precision、JAX

## D

### Data Augmentation
- **类别：** 数学与 Training
- **人们常说：** 制造更多 Training 数据。
- **实际含义：** 创建修改后的样本，例如经过变换的图像、受到扰动的音频或经过释义的文本，从而在不收集全新源数据的情况下提高 Training 多样性。当变换保留任务信号时，它可以减少 Overfitting。
- **常见误区：** 数据增强必须保留你希望 Model 学习的目标 Label 或行为。
- **相关术语：** Overfitting、Epoch、Eval Set

### Data Classification
- **类别：** 安全与治理
- **实际含义：** 将数据分配到有文档记录的敏感性或影响类别，使处理、访问、保留、共享和事件响应规则与数据披露或丢失的后果相匹配。
- **重要性：** 如果源文档、Prompt、trace 和生成的产物被视为具有相同的敏感程度，AI pipeline 就无法应用与风险相称的控制措施。
- **实践方式：** 在摄取数据时进行分类，将 Label 传递给衍生产物，根据类别限制 Tool 和目标位置，并定义数据经过变换或聚合后 Label 如何变化。
- **常见误区：** 数据分类描述的是保护要求。它既不同于 Machine Learning Classification 任务，也不表示数据是准确的。
- **相关术语：** Data Minimization、Trust Boundary、Least Privilege、Audit Log
- **来源：** [NIST SP 1800-39 Initial Public Draft: Data Classification Practices](https://www.nccoe.nist.gov/sites/default/files/2026-02/nist-sp-1800-39-ipd.pdf); [NIST FIPS 199: Federal Information and Information System Categorization](https://csrc.nist.gov/pubs/fips/199/final)

### Data Deduplication
- **类别：** 数据与表示
- **实际含义：** 检测并移除 Dataset 内部或不同 Dataset 之间完全重复和近似重复的样本。
- **重要性：** 重复数据可能扭曲 Training 分布、增加记忆、泄露测试材料，并使 Evaluation 结果显得比实际更好。
- **实践方式：** 对内容进行规范化，使用精确哈希和相似度方法，审查边界聚类，并记录移除每个样本所依据的版本和规则。
- **常见误区：** 去重并非普通的数据清洗。两条不同记录可能合理地包含相同文本，而两段释义文本也可能仍携带相同的泄露信息。
- **相关术语：** Data Provenance、Benchmark Contamination、Dataset Split、Overfitting
- **来源：** [Deduplicating Training Data Makes Language Models Better](https://arxiv.org/abs/2107.06499)

### Data Exfiltration
- **类别：** 安全与治理
- **实际含义：** 在未经授权的情况下，将受保护数据从系统或信任区域传输给无权接收它的人员、Tool、服务或存储位置。
- **重要性：** 即使原始数据存储保持完整，Agent 也可能通过生成的文本、Tool 参数、URL、日志或副作用暴露机密。
- **实践方式：** 尽量减少可读取的数据，使用目标位置 allowlist，检查出站 Tool 调用，对敏感字段进行脱敏，并对跨 Trust Boundary 的异常传输发出警报。
- **常见误区：** 数据外泄指未经授权的移动或披露。授权组件正常检索数据并不属于数据外泄，但后续使用可能演变为数据外泄。
- **学习课程：** [EchoLeak and CVEs for AI](../phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/)
- **相关术语：** Trust Boundary、Least Privilege、Indirect Prompt Injection、Audit Log
- **来源：** [NIST SP 800-53 Rev. 5: AC-4 Information Flow Enforcement](https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/sp800-53r5-controls.xlsx)

### Data Leakage
- **类别：** 数据与表示
- **实际含义：** 在 Training 或 Feature 构建过程中，无意使用了在真实预测时点无法获得的信息，或使用了属于留出 Evaluation 边界的信息。
- **重要性：** 数据泄漏会产生过于乐观的指标，而当系统遇到真正未见过的输入时，这些指标就会崩溃。
- **实践方式：** 在拟合预处理器之前拆分数据，将未来信息排除在历史 Feature 之外，并将测试 Label 和 benchmark 答案与 Prompt 和调优循环隔离。
- **常见误区：** 数据泄漏并不限于重复行。全局归一化统计量、时间戳、从目标派生的 Feature，以及由反复测试驱动的 Prompt 修改，都可能泄露信息。
- **相关术语：** Dataset Split、Benchmark Contamination、Eval Set、Data Provenance
- **来源：** [scikit-learn: Data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage)

### Data Lineage
- **类别：** 安全与治理
- **实际含义：** 关于数据产物如何经过来源、变换、join、filter、版本和下游用途派生而来的记录。
- **重要性：** 当某个来源被纠正、撤销或发现不安全时，数据沿袭关系可以识别哪些 Dataset、Embedding、Evaluation 和 Model 产物可能受到影响。
- **实践方式：** 为输入和输出分配稳定标识符，记录每次变换及其版本，保留父子关系，并测试能否从受影响的来源追踪到每个衍生产物。
- **常见误区：** Data Provenance 广义上说明来源和保管情况。数据沿袭关系强调变换路径以及数据产物之间的依赖关系。
- **相关术语：** Data Provenance、Datasheet for Datasets、Audit Log、Content Provenance
- **来源：** [W3C PROV-O](https://www.w3.org/TR/prov-o/)

### Data Minimization
- **类别：** 安全与治理
- **实际含义：** 对于个人数据，将收集、处理、暴露和保留的数据限制在指定目的所必需的范围内。团队也可以将同样的原则作为工程控制应用于敏感的非个人数据。
- **重要性：** 放入 Prompt、trace、cache 或 Tool 调用中的每个非必要字段，都会增加隐私暴露以及被滥用或攻破时可能造成的影响。
- **实践方式：** 在收集前定义必需字段，在最早的边界进行脱敏或聚合，设置保留期限，并在保留可选 Context 前验证它确实改善了可测量的任务结果。
- **常见误区：** 数据最小化并不意味着不保留任何数据。它意味着能够依据既定目的，说明每个数据元素、用途、接收方和保留期限的必要性。
- **相关术语：** Purpose Limitation、Data Classification、Least Privilege、Context Engineering
- **来源：** [General Data Protection Regulation, Article 5(1)(c)](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

### Data Provenance
- **类别：** 数据与表示
- **实际含义：** 关于数据源自何处、由谁或什么进行了变换、使用了哪些版本，以及衍生产物如何与其来源关联的可追踪信息。
- **重要性：** 你需要 Data Provenance 来复现结果、遵守使用限制、调查污染，并在来源发生变化时移除受影响的数据。
- **实践方式：** 分配不可变的 Dataset 版本，记录变换作业和来源标识符，并将沿袭 metadata 传递到 Embedding、Eval 用例和 Model 产物中。
- **常见误区：** 来源 URL 只是 Data Provenance 的一部分；它无法说明收集时间、许可、过滤、变换或下游用途。
- **相关术语：** Dataset Split、Data Deduplication、Provenance Attestation、Grounding
- **来源：** [W3C PROV Overview](https://www.w3.org/TR/prov-overview/)

### Dataset Split
- **类别：** 数据与表示
- **实际含义：** 将样本划分为分别用于拟合、开发决策和最终 Evaluation 的独立子集，并记录该划分。
- **重要性：** 这种隔离可以防止用于选择系统的证据同时被当作所选系统具备泛化能力的独立证明。
- **实践方式：** 按真实部署单元拆分数据，例如用户、repository、组织或时间，而不是随机拆分相互关联的行。
- **常见误区：** 随机拆分并不会自动产生独立性。近似重复项、未来观测值或来自同一实体的记录都可能跨越边界。
- **相关术语：** Eval Set、Overfitting、Data Leakage、Distribution Shift
- **来源：** [Datasheets for Datasets](https://cacm.acm.org/research/datasheets-for-datasets/)

### Datasheet for Datasets
- **类别：** 安全与治理
- **实际含义：** 关于 Dataset 的动机、组成、收集过程、预处理、用途、分布、维护和已知局限性的结构化文档。
- **重要性：** Dataset 不会仅仅因为可用就变得安全或适用。下游构建者需要了解它如何创建，以及其假设会在何处失效的证据。
- **实践方式：** 随带版本的 Dataset 发布 datasheet，明确由谁回答相关问题，记录被排除的群体和变换，并在 Dataset 变化时更新文档。
- **常见误区：** Datasheet 记录证据和预期用途。它不是许可证、质量保证，也不能替代针对具体部署的 Evaluation。
- **学习课程：** [Model, System, and Dataset Cards](../phases/18-ethics-safety-alignment/26-model-system-dataset-cards/)
- **相关术语：** Data Lineage、Data Provenance、Model Card、Dataset Split
- **来源：** [Datasheets for Datasets](https://arxiv.org/abs/1803.09010)

### Deadline Propagation
- **类别：** 可靠性与运维
- **实际含义：** 将剩余的端到端时间预算传递给下游调用，使每个依赖项都知道原始请求还能有效等待多长时间。
- **重要性：** 相互独立的 timeout 可能超过用户的 deadline，并使已被放弃的工作在结果不再有用后继续占用容量。
- **实践方式：** 在入口设置一个请求 deadline，为每次下游调用扣除已经过的时间，取消已过期的工作，并记录是哪个边界耗尽了预算。
- **常见误区：** Deadline 是绝对的或剩余的完成边界。重试延迟控制下一次尝试何时开始，并且必须处于同一预算之内。
- **相关术语：** Retry with Backoff、Retry Budget、Tail Latency、Service Level Objective (SLO)
- **来源：** [gRPC Deadlines](https://grpc.io/docs/guides/deadlines/)

### Decode Phase
- **类别：** 基础设施与服务
- **实际含义：** 自回归 Inference 中的迭代阶段，在输入前缀处理完成后，每次生成一个新 Token。
- **重要性：** Decode 工作与 prefill 具有不同的计算、内存和调度行为，因此单一的整体延迟数字可能掩盖真正的服务瓶颈。
- **实践方式：** 分别测量 Token 间延迟和输出吞吐量，将 KV-cache 占用纳入考量，并测试活跃 decode 与新 prefill 共享容量的混合工作负载。
- **常见误区：** Decode phase 并不是 encoder-decoder Model 的 decoder 组件。它指的是运行时生成阶段。
- **学习课程：** [Disaggregated Prefill and Decode](../phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/)
- **相关术语：** Prefill、Autoregressive、KV Cache、Time per Output Token (TPOT)
- **来源：** [DistServe](https://arxiv.org/abs/2401.09670)

### Decoder
- **类别：** Model 与 Inference
- **人们常说：** Model 的输出端。
- **实际含义：** 将一种表示映射为输出的组件。在 encoder-decoder Transformer 中，decoder 使用 masked Self-Attention 和 Cross-Attention 生成输出。Decoder-only 语言 Model 则通过单个 causal stack 进行生成。
- **相关术语：** Encoder、Transformer、Autoregressive

### Decoding Strategy
- **类别：** Model 与 Inference
- **实际含义：** 将 Model 的 next-token 分数序列转换为选定 Token 和完整输出的算法。
- **重要性：** 对于相同的 logits，贪心选择、采样、截断和搜索可能产生不同的质量、多样性、延迟和可重复性。
- **实践方式：** 在 Eval 配置中定义任务的 decoding 设置、停止规则和 seed 行为，以便公平比较结果。
- **常见误区：** Decoding 会改变输出的选择方式；它不会改变 Model 已经训练的参数，也不会增加知识。
- **相关术语：** Autoregressive、Temperature、Top-k Sampling、Nucleus Sampling (Top-p)
- **来源：** [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)

### Defense in Depth
- **类别：** 安全与治理
- **实际含义：** 在多个系统边界使用彼此独立的预防性、检测性和纠正性控制措施，使单个控制措施失效时不会决定最终结果。
- **重要性：** AI 系统结合了概率性 Model、不受信任的内容、Tool 和外部服务，因此任何单一 filter 或 Prompt 都不足以充当安全边界。
- **实践方式：** 将指令控制与受限权限、sandboxing、schema 验证、关键操作审批、监控和经过测试的恢复路径结合使用。
- **常见误区：** 更多控制措施并不一定更好。各层应处理不同的故障模式并保持可测试性，而不是重复相同的假设。
- **相关术语：** Guardrails、Sandbox、Least Privilege、Trust Boundary
- **来源：** [NIST Glossary: Defense in Depth](https://csrc.nist.gov/glossary/term/defense_in_depth)

### Delegation
- **类别：** Agent 与 Tool
- **实际含义：** 将有明确边界的子任务分配给另一个人或 Agent，同时提供所需的 Context、权限、输出契约和返回条件。
- **重要性：** 明确的委派可以实现专业分工和并行工作，同时不丢失所有权、范围或整合结果的能力。
- **实践中：** 向 reviewer agent 提供确切的文件、评分标准、证据和截止时间，然后要求它返回发现，而不是静默修改主要产物。
- **常见误解：** 向另一个 agent 发送含糊的消息并不等于可靠的委派。接收方需要明确的范围契约，以及定义清晰的交接返回方式。
- **相关术语：** Scope Contract、Handoff、Reviewer Agent、Orchestration
- **来源：** [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

### Dense Retrieval
- **类别：** 检索与生成
- **实际含义：** 第一阶段检索，将查询和候选项 Embedding 为 Vector 表示，并通过相似度函数对候选项进行排序。
- **重要原因：** 它可以检索仅有少量完全相同词语的释义表达和语义匹配，从而补充 BM25 等词法方法。
- **实践中：** 为领域训练或选择 Embedding Model，为候选 Vector 建立索引，并在将结果连接到生成流程之前评估检索召回率。
- **常见误解：** 稠密检索不是 reranker。前者搜索整个集合，后者对规模更小的候选集重新评分。
- **相关术语：** Embedding、Semantic Search、BM25、Hybrid Retrieval
- **来源：** [Dense Passage Retrieval](https://aclanthology.org/2020.emnlp-main.550/)

### Diffusion Model
- **类别：** Model 与 Inference
- **人们常说：** 一种从噪声生成图像的 Model。
- **实际含义：** 一种围绕渐进加噪过程和学习到的逆向过程进行训练的生成式 Model。采样通常从噪声开始，并应用重复的去噪步骤，有时会在学习到的 latent space 中进行。
- **常见误解：** Diffusion 是一种通用生成框架，并非仅适用于图像的技术。
- **相关术语：** Latent Space、VAE (Variational Autoencoder)、Inference

### Disaggregated Serving
- **类别：** 基础设施与服务
- **实际含义：** 一种服务架构，在分别配置资源的 worker pool 中运行 prefill 和 decode 工作，并在二者之间传输所需的 Attention 状态。
- **重要原因：** Prefill 和 decode 对硬件的压力不同，因此可以根据各自的瓶颈独立调整 pool 的规模和调度，而不必在同一个队列中争用资源。
- **实践中：** 测量状态传输成本，通过兼容的 Model 版本路由请求，依据各自的需求信号扩缩每个 pool，并测试阶段间的故障恢复。
- **常见误解：** 解耦拆分的是运行时阶段，并不是在单个阶段内将一个 Model 拆分为 tensor parallel 或 pipeline parallel 分片。
- **学习课程：** [Disaggregated Prefill and Decode](../phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/)
- **相关术语：** Prefill、Decode Phase、Model Serving、Goodput
- **来源：** [DistServe](https://arxiv.org/abs/2401.09670)

### Distribution Shift
- **类别：** Evaluation 与安全
- **实际含义：** 用于构建或 Evaluation 系统的数据分布，与系统部署后遇到的数据分布之间存在的差异。
- **重要原因：** Model 可能通过留出测试，却在用户、任务、语言、Tool 或运行条件发生变化时失败。
- **实践中：** 定义预期的部署切片，按切片监控性能和输入特征，并将新的失败案例添加到版本化的 eval set。
- **常见误解：** 分布偏移并不总是 Model drift。Model 可能没有变化，而其环境或用户群体发生了变化。
- **相关术语：** Dataset Split、Eval Set、Overfitting、Model Card
- **来源：** [WILDS](https://proceedings.mlr.press/v139/koh21a.html)

### DPO (Direct Preference Optimization)
- **类别：** 数学与 Training
- **人们常说：** 无需单独 reward model 阶段的偏好 Training。
- **实际含义：** 一种偏好优化目标，它基于相对于参考 policy 的偏好响应与拒绝响应对，直接训练 policy。此阶段无需运行显式的 reward model 和 Reinforcement Learning 循环。
- **常见误解：** DPO 仍然依赖偏好数据的质量和覆盖范围，也不会消除 Evaluation 或对齐风险。
- **学习课程：** [Direct Preference Optimization](../phases/10-llms-from-scratch/08-dpo/)
- **来源：** [Direct Preference Optimization paper](https://arxiv.org/abs/2305.18290)
- **相关术语：** RLHF (Reinforcement Learning from Human Feedback)、SFT (Supervised Fine-Tuning)、Alignment

### Dropout
- **类别：** 数学与 Training
- **人们常说：** 随机关闭激活值。
- **实际含义：** 在 Training 期间，随机将一部分激活值设为零，促使 Neural Network 不依赖单一激活路径。标准 Inference 通常会禁用它，但 Monte Carlo dropout 会有意保持其启用状态以估计不确定性。
- **相关术语：** Overfitting、Weight Decay、Activation Function

### Durable Execution
- **类别：** Agent 与 Tool
- **实际含义：** 以某种方式运行工作流，使其状态和已完成步骤能够在进程崩溃、重启或长时间等待后继续保留，而无需重做已确认的副作用。
- **重要原因：** Agent 任务通常横跨 Model 调用、Tool、审批和外部系统。临时进程不应成为进度的唯一记录。
- **实践中：** 持久化每次工作流转换，对外部写入使用幂等键，并在 worker 重启后从最新 Checkpoint 恢复。
- **常见误解：** 持久执行不会自动让每项操作都变得安全。副作用仍然需要幂等性和补偿规则。
- **相关术语：** Checkpoint、Agent State、Idempotency、Approval Gate

### Dynamic Batching
- **类别：** 基础设施与服务
- **实际含义：** 一种运行时策略，根据兼容形状、最大大小、优先级和允许的队列延迟，将排队的请求组成 Inference Batch。
- **重要原因：** 对请求分组可以提高硬件利用率，但在流量稀疏或请求差异显著时，等待组成 Batch 可能会使延迟恶化。
- **实践中：** 根据实测延迟目标设置队列延迟和 Batch 限制，分离形状不兼容的请求，并在符合实际的到达率下比较吞吐量与尾延迟。
- **常见误解：** Dynamic batching 从排队的工作中组装 Batch。Continuous batching 则在自回归生成已经运行时改变 Batch 成员。
- **学习课程：** [vLLM Serving Internals](../phases/17-infrastructure-and-production/04-vllm-serving-internals/)
- **相关术语：** Admission Control、Continuous Batching、Saturation、Tail Latency
- **来源：** [NVIDIA Triton: Models and Schedulers](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html#scheduling-and-batching)

## E

### Early Fusion
- **类别：** Multimodal 系统
- **实际含义：** 在大部分任务特定建模发生之前，合并来自多种模态的原始表示或低层表示。
- **重要原因：** 早期交互可以显现细粒度的跨模态关系，但也要求表示彼此兼容，并谨慎处理对齐和输入缺失问题。
- **实践中：** 将每种模态转换为明确定义的 Token 或 Feature 表示，保留来源和位置标记，在共享 backbone 之前进行融合，并与单模态及 late-fusion baseline 比较。
- **常见误解：** Early fusion 描述的是各数据流在架构中的合并位置，并不保证 Model 能够学习到它们之间有用的对齐关系。
- **学习课程：** [Chameleon Early-Fusion Tokens](../phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/)
- **相关术语：** Late Fusion、Multimodal Fusion、Modality Alignment、Token
- **来源：** [Chameleon: Mixed-Modal Early-Fusion Foundation Models](https://arxiv.org/abs/2405.09818); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Eigenvalue
- **类别：** 数学与 Training
- **人们常说：** PCA 中使用的一种 Matrix 属性。
- **实际含义：** 一个 Scalar，用于描述 Linear Transformation 如何缩放对应的非零 Eigenvector 而不改变其方向。在基于 Covariance Matrix 的 PCA 中，较大的 Eigenvalue 对应 Variance 更大的方向。
- **相关术语：** Tensor、Feature、Latent Space

### Embedding
- **类别：** 数据与表示
- **人们常说：** 一个表示含义的 Vector。
- **实际含义：** 一种学习到的映射，将离散项（单词、图像、用户）映射为连续空间中的稠密 Vector，使相似项彼此接近
- **常见误解：** 相似度取决于 Model、Training 目标和度量方式。一个 Embedding 空间中的距离无法直接沿用到另一个空间。
- **名称由来：** 这些项被放置或 Embedding 到几何表示空间中。
- **学习课程：** [Embeddings](../phases/11-llm-engineering/04-embeddings/)
- **相关术语：** Cosine Similarity、Semantic Search、Vector Database

### Encoder
- **类别：** Model 与 Inference
- **人们常说：** Model 的输入端。
- **实际含义：** 将输入转换为表示的组件。Transformer encoder 通常使用非因果 Self-Attention，并受所有相关 mask 约束，因此每个位置都可以整合整个输入中的 Context。
- **常见误解：** Encoder-only Model 可以通过任务 head 生成输出，尽管它们通常不用于自回归文本生成。
- **相关术语：** Decoder、Transformer、Embedding

### Epoch
- **类别：** 数学与 Training
- **人们常说：** 完整遍历一次 Training 数据。
- **实际含义：** 对已定义的 Training Dataset 进行一次遍历。在分布式或采样式 Training 中，Epoch 的具体实现取决于 data loader 和采样策略。
- **常见误解：** 更多 Epoch 并不能保证更好的泛化能力；应在留出数据上进行 Evaluation。
- **相关术语：** Batch Size、Overfitting、Eval Set

### Error Budget
- **类别：** 可靠性与运维
- **实际含义：** 在服务级别目标的测量窗口内，目标耗尽之前所允许的服务失败量。
- **重要原因：** 它为可靠性工作和产品工作提供共同的决策边界：团队可以使用剩余预算推进变更，同时在用户可见的故障消耗预算时降低风险。
- **实践中：** 根据 SLO 推导预算，按原因和用户群体跟踪消耗速率，预先定义预算耗尽前的发布措施，并避免在事故后重置核算。
- **常见误解：** 错误预算不是制造事故的配额，而是从面向用户的可靠性目标推导出的运维策略。
- **相关术语：** Service Level Objective (SLO)、Service Level Indicator (SLI)、Availability、Incident Response
- **来源：** [Google SRE Workbook: Error Budget Policy](https://sre.google/workbook/error-budget-policy/)

### Eval Set
- **类别：** Evaluation 与安全
- **别名：** Evaluation set
- **实际含义：** 一组版本化的输入、预期属性、评分规则和元数据，用于依据已定义的能力或风险衡量 AI 系统。
- **重要原因：** 可重复使用的数据集能够将模糊的质量主张转化为可比较的证据，并在 Prompt、Model、Tool 或检索发生变化后捕获回归。
- **实践中：** 将具有代表性的支持问题、对抗性指令、预期引用和失败 Label 保存在经过审查且与开发示例分离的 Dataset 中。
- **常见误解：** 开发 eval 用于指导迭代，最终的留出测试用于在各项选择确定后估计性能，标准化 benchmark 则支持在共享协议下进行比较。针对任何留出数据集反复调优都会泄露测试信息并夸大结果。
- **学习课程：** [Eval-Driven Agent Development](../phases/14-agent-engineering/30-eval-driven-agent-development/)
- **相关术语：** Evaluation (Eval)、Regression Test、LLM-as-a-Judge、Verification Gate

### Evaluation (Eval)
- **类别：** Evaluation 与安全
- **别名：** Eval
- **实际含义：** 一个定义明确的流程，使用显式的成功标准、数据、评分器和审查程序，在代表性任务上衡量 Model 或系统行为。
- **重要原因：** 如果成功与否只来自少量演示的主观印象，就无法提高可靠性。
- **实践中：** 在更改检索前后运行相同的客户支持场景，为正确性和引用支持度评分，并按类别检查失败案例。
- **常见误解：** benchmark 分数只是一项 Evaluation 结果，并不能完整反映生产环境质量。
- **学习课程：** [LLM Evaluation](../phases/11-llm-engineering/10-evaluation/)
- **相关术语：** Eval Set、LLM-as-a-Judge、Cost per Successful Task、Regression Test

### Exact Match (EM)
- **类别：** Evaluation 与安全
- **实际含义：** 一种指标，仅当输出的规范化表示与可接受的参考答案完全相同时，才将该输出计为正确。
- **重要原因：** 对于只有一个规范答案的任务，它具有确定性且易于审计，但无法体现部分得分。
- **实践中：** 在 Evaluation 之前定义规范化规则和所有可接受的参考答案；当多个输出都可能有效时，将精确匹配与任务特定检查结合使用。
- **常见误解：** 较低的精确匹配分数可能源于无害的格式差异，而字符串匹配的结果在具体 Context 中仍可能缺乏依据或并不安全。
- **相关术语：** ROUGE、Eval Set、Structured Output、Pass@k
- **来源：** [SQuAD](https://aclanthology.org/D16-1264/)

### Expert Parallelism
- **类别：** 基础设施与服务
- **实际含义：** 将 mixture-of-experts 子网络分布到多个设备上，并把每个 Token 的激活值路由到托管其选定 expert 的设备。
- **重要原因：** 稀疏 expert 可以增加 Model 容量，而无需为每个 Token 执行所有 expert，但路由会带来通信、负载均衡和放置约束。
- **实践中：** 按 expert 测量 Token 分布，配置通信带宽，有意限制或路由溢出，并测试流量导致 expert 需求不均衡时的质量。
- **常见误解：** Expert parallelism 对 router 选中的 expert 进行分区。Tensor parallelism 对层内的 Tensor 运算进行分区。
- **学习课程：** [Mixture of Experts](../phases/07-transformers-deep-dive/11-mixture-of-experts/)
- **相关术语：** MoE (Mixture of Experts)、Tensor Parallelism、Pipeline Parallelism、Model Serving
- **来源：** [GShard](https://arxiv.org/abs/2006.16668)

## F

### Feature
- **类别：** 数据与表示
- **人们常说：** Dataset 中的一列。
- **实际含义：** 数据中一个可单独测量的属性。在经典 ML 中，需要手动设计 Feature。在 Deep Learning 中，Neural Network 会自动从原始数据中学习 Feature。
- **常见误解：** 一个存储列可以包含多个有用的 Feature，而学习到的表示也可以包含没有简单人类 Label 的 Feature。
- **相关术语：** Embedding、Latent Space、Inductive Bias

### Few-Shot
- **类别：** Prompt 与 Context
- **人们常说：** 在 Prompt 中给 Model 几个示例。
- **实际含义：** 一种 in-context learning 方法，在目标输入之前包含少量示范，使 Model 能够推断所需的任务、格式或决策边界。
- **重要原因：** 示例的质量和覆盖范围比通用的示例数量更重要。质量较差或相互矛盾的示范可能降低可靠性。
- **相关术语：** Zero-Shot、In-Context Learning、Prompt Engineering、Context Window

### Fine-tuning
- **类别：** 数学与 Training
- **人们常说：** 使用你的数据训练 Model。
- **实际含义：** 从预训练参数开始，在范围更窄的 Dataset 或目标上继续 Training。根据具体方法，可以更新全部参数、选定参数或新增的 adapter 参数。
- **重要原因：** Fine-tuning 可以调整行为、风格、格式或任务性能，但当事实必须保持时效性或可追溯时，它无法可靠地替代检索。
- **常见误解：** Fine-tuning 可以影响编码的知识，但它并不是简单地向 Model 内部的可搜索数据库追加记录。
- **学习课程：** [Fine-Tuning and LoRA](../phases/11-llm-engineering/08-fine-tuning-lora/)
- **相关术语：** SFT (Supervised Fine-Tuning)、LoRA (Low-Rank Adaptation)、QLoRA、RAG (Retrieval-Augmented Generation)

### Flaky Test
- **类别：** AI-native 开发
- **实际含义：** 在代码或预期测试环境没有相关变更的情况下，多次等效运行可能时而通过、时而失败的测试。
- **重要原因：** 不稳定性会削弱验证关卡，并可能让人或 Agent 养成忽略真实失败或不断重试直至得到错误通过结果的习惯。
- **实践中：** 保留导致失败的 seed 和环境，仅在明确负责人和截止时间的情况下隔离测试，然后修复未受控制的时间、并发、网络、顺序或共享状态依赖。
- **常见误解：** 能够稳定暴露间歇性产品 bug 的测试是有价值的证据，不一定是不稳定测试。
- **相关术语：** Regression Test、Test Oracle、Retry with Backoff、Verification Gate
- **来源：** [De-Flake Your Tests](https://conferences.computer.org/icsme/pdfs/ICSME2020-1oOutvkGTwF4GyVvNtr3Mm/561900a736/561900a736.pdf)

### FlashAttention
- **类别：** 基础设施与服务
- **实际含义：** 一种精确的 Attention 算法，通过分块计算减少加速器各级内存之间的数据传输，同时避免在高带宽内存中物化完整的 Attention Matrix。
- **重要原因：** Attention 可能受限于内存数据移动而非算术运算，尤其是在长序列场景中，因此 IO-aware kernel 可以提高实际速度和内存效率。
- **实践中：** 使用支持 Model 形状、mask、dtype 和硬件的 kernel，验证数值容差，并对端到端延迟进行 benchmark，而不是将论文结果作为固定倍数引用。
- **常见误解：** FlashAttention 改变的是 Attention 的计算方式，而不是其目标数学结果。它与 KV caching 和 Quantization 是相互独立的技术。
- **学习课程：** [KV Cache and Flash Attention](../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/)
- **相关术语：** Attention、Self-Attention、KV Cache、Mixed Precision
- **来源：** [FlashAttention](https://arxiv.org/abs/2205.14135)

### Function Calling
- **类别：** Agent 与 Tool
- **人们常说：** 使用 Tool 的 Model。
- **实际含义：** 一种提供商或应用程序接口，Model 通过该接口发出结构化请求，指定 Tool 及其参数。应用程序代码会验证请求、执行操作，并可返回结果以供 Model 执行下一步。
- **常见误解：** Model 只负责请求函数调用；是否执行以及如何执行由你的可信代码决定。仅有 Function calling 并不能构成完整的 Agent。
- **学习课程：** [Function Calling](../phases/11-llm-engineering/09-function-calling/)
- **相关术语：** Structured Output、Tool Contract、Agent、MCP (Model Context Protocol)

## G

### GAN (Generative Adversarial Network)
- **类别：** Model 与 Inference
- **人们常说：** 两个 Neural Network 在 Training 期间相互竞争。
- **实际含义：** 生成器网络尝试创建逼真的数据，而判别器网络尝试区分真实数据与伪造数据。两者共同 Training：生成器越来越善于欺骗判别器，判别器也越来越善于识别伪造数据。
- **相关术语：** Loss Function、Latent Space、Diffusion Model

### Goodput
- **类别：** 基础设施与服务
- **实际含义：** 在指定工作负载下，满足既定服务约束的已完成请求速率，例如同时满足首个 Token 时间和每 Token 延迟目标。
- **重要性：** 原始吞吐量可能上升，但用户遇到的慢请求也可能增多。Goodput 只统计符合服务契约的工作。
- **实践中：** 声明请求分布和延迟阈值，只统计符合要求的已完成请求，在聚合速率旁报告百分位数，并避免比较采用不同目标的系统。
- **常见误解：** Goodput 不是全部已完成吞吐量，也不是 Model 的通用属性。它取决于工作负载和成功阈值。
- **学习课程：** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **相关术语：** Service Level Objective (SLO)、Time to First Token (TTFT)、Time per Output Token (TPOT)、Cost per Successful Task
- **来源：** [DistServe](https://arxiv.org/abs/2401.09670)

### GPT
- **类别：** Model 与 Inference
- **人们常说：** 所有聊天机器人的统称。
- **实际含义：** Generative Pre-trained Transformer，是生成式 Transformer Model 家族的名称。这类 Model 基于序列预测目标进行预训练，并适配下游用途。产品名称和 Model 架构不应被视为可以互换的概念。
- **名称由来：** Generative 描述输出生成，pre-trained 描述初始的广泛 Training 阶段，transformer 标识其架构家族。
- **相关术语：** Transformer、Autoregressive、LLM (Large Language Model)

### Graceful Degradation
- **类别：** 可靠性与运维
- **实际含义：** 当容量或依赖项受损时，通过降低非必要的质量、Feature、新鲜度或工作负载来维持有限的核心服务，而不是让所有请求都失败。
- **重要性：** AI 系统通常依赖多个缓慢或可能出错的组件，因此明确的降级模式可以在部分故障期间保护关键用户成果。
- **实践中：** 预先定义哪些能力可以禁用，让运维人员能够看到降级模式，保护安全检查，在依赖项故障时测试回退机制，并有计划地恢复完整服务。当正确性、安全性、新鲜度或承诺的契约发生实质性变化时，应告知用户。
- **常见误解：** Graceful degradation 并不是在悄无声息地返回较差答案后装作什么都没发生。运维人员始终需要了解情况；当降级模式实质性改变结果或服务契约时，必须向用户披露。
- **学习课程：** [Production LLM Application](../phases/11-llm-engineering/13-production-app/)
- **相关术语：** Circuit Breaker、Load Shedding、Model Router、Availability
- **来源：** [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

### Gradient
- **类别：** 数学与 Training
- **人们常说：** Loss 的斜率。
- **实际含义：** 由 Partial Derivative 组成、指向最陡上升方向的 Vector。在 ML 中，你沿 Gradient 的反方向移动（Gradient Descent）以最小化 Loss。
- **常见误解：** Optimizer 可以转换、平均、裁剪或自适应调整 Gradient，而不是简单执行负 Gradient 步骤。
- **相关术语：** Backpropagation、Gradient Descent、Optimizer

### Gradient Accumulation
- **类别：** 数学与 Training
- **实际含义：** 在执行一次 Optimizer 更新之前，对多个 microbatch 的 Gradient 求和或取平均值。
- **重要性：** 当单个设备无法同时容纳所有样本和激活值时，它可以近似实现更大的有效 Batch。
- **实践中：** 以一致方式缩放 Loss，仅在达到选定的 microbatch 数量后调用 Optimizer，并测量归一化或分布式同步是否会改变行为。
- **常见误解：** Gradient accumulation 可以减少每一步的激活内存，但无法复现同时处理完整 Batch 的所有属性。
- **相关术语：** Batch Size、Mixed Precision、Optimizer、Backpropagation
- **来源：** [PyTorch AMP examples: Gradient accumulation](https://docs.pytorch.org/docs/stable/notes/amp_examples.html#gradient-accumulation)

### Gradient Clipping
- **类别：** 数学与 Training
- **实际含义：** 当 Gradient 值或它们的组合 Norm 超过选定阈值时，在 Optimizer 更新之前对其进行限制。
- **重要性：** 它可以防止异常大的 Gradient 破坏 Training 步骤的稳定性并产生非有限值。
- **实践中：** 记录裁剪前的 Norm，在取消缩放 Mixed Precision Gradient 后进行裁剪，并调查反复发生裁剪的原因，不要将其当作诊断不稳定问题的替代方案。
- **常见误解：** Clipping 控制更新幅度；它无法修复无效数据、存在缺陷的 Loss 或持续不合适的 Learning Rate。
- **相关术语：** Gradient、NaN (Not a Number)、Mixed Precision、Learning Rate
- **来源：** [On the difficulty of training recurrent neural networks](https://arxiv.org/abs/1211.5063)

### Gradient Descent
- **类别：** 数学与 Training
- **人们常说：** 沿着 Loss 曲面向下走。
- **实际含义：** 一类使用目标函数的负 Gradient 移动参数的优化更新方法，Gradient 通常根据 Batch 估算，而不是根据整个 Dataset 计算。
- **相关术语：** Gradient、Learning Rate、Optimizer

### Grounding
- **类别：** 检索与生成
- **实际含义：** 将生成的答案或操作与系统能够识别和检查的证据、状态或观察结果关联起来。
- **重要性：** Grounding 为系统提供不受约束的生成之外的依据，并使缺乏支持的声明更容易被发现。
- **实践中：** 检索政策章节，要求答案引用该章节，并拒绝引用段落无法支持的声明。
- **常见误解：** 向 Prompt 添加文档只是创造了进行 Grounding 的机会，并不能保证 Model 会正确使用这些文档。
- **学习课程：** [Retrieval-Augmented Generation](../phases/11-llm-engineering/06-rag/)
- **相关术语：** RAG (Retrieval-Augmented Generation)、Hallucination、Verification Gate、Reranker

### Guardrails
- **类别：** Evaluation 与安全
- **人们常说：** Model 周围的安全过滤器。
- **实际含义：** 对输入、Tool 使用、输出、权限和升级处理进行约束的系统控制措施。其中可以包括 schema、政策检查、分类器、allowlist、sandboxing、审批和操作后验证。
- **重要性：** 没有任何单一过滤器能够覆盖所有故障模式，因此应根据风险分层设置控制措施。
- **常见误解：** Guardrails 可以降低风险，但无法证明 AI 系统是安全的。
- **学习课程：** [Guardrails](../phases/11-llm-engineering/12-guardrails/)
- **相关术语：** Least Privilege、Approval Gate、Sandbox、Evaluation (Eval)

## H

### Hallucination
- **类别：** Evaluation 与安全
- **人们常说：** Model 在撒谎。
- **实际含义：** 错误、缺乏可用证据支持，或与任务事实来源不一致的生成内容。即使输出语言流畅且 Model 并未试图欺骗，也可能出现这种情况。
- **重要性：** 你通常无法检查某项陈述是否存在于 Training data 中，因此生产环境中的检查应关注证据支持、正确性和可追溯性。
- **实践中：** 要求事实性答案提供引用证据，并评估每项引用是否确实支持其对应声明。
- **常见误解：** Hallucination 是输出质量故障，而不是对 Model 意图的诊断。
- **相关术语：** Grounding、RAG (Retrieval-Augmented Generation)、Verification Gate

### Handoff
- **类别：** AI-native 开发
- **实际含义：** 在人员或 Agent 之间结构化移交任务，同时保留目标、当前状态、证据、决策、约束和剩余工作。
- **重要性：** 良好的交接可以避免下一位执行者从冗长记录中重建整个任务，或重复已经完成的操作。
- **实践中：** 通过紧凑的任务包传递已接受的计划、变更文件、测试命令和结果、未解决的风险以及确切的下一步操作。
- **常见误解：** 总结说明发生了什么。交接还会说明以什么状态为准，以及接下来应该做什么。
- **学习课程：** [Multi-Session Handoff](../phases/14-agent-engineering/40-multi-session-handoff/)
- **相关术语：** Agent State、Checkpoint、Scope Contract、Progressive Disclosure

### HNSW
- **类别：** 检索与生成
- **别名：** Hierarchical Navigable Small World
- **实际含义：** 一种 approximate-nearest-neighbor 索引，它将 Vector 组织成分层邻近图，并从粗粒度的上层向细粒度的下层进行搜索。
- **重要性：** 当穷举比较速度过慢时，它是一种常见方法，可以让高 Recall 的 Vector search 在大规模场景中切实可用。
- **实践中：** 根据延迟、内存和 Recall@K 目标调整构建参数和查询参数，并在 Embedding 版本变化时重建索引。
- **常见误解：** HNSW 是一种索引算法，而不是相似度指标、Embedding Model 或完整的 Vector Database。
- **相关术语：** Approximate Nearest Neighbor (ANN)、Vector Database、Embedding、Recall@K
- **来源：** [Efficient and Robust Approximate Nearest Neighbor Search Using HNSW](https://dl.acm.org/doi/10.1109/TPAMI.2018.2889473)

### Human-in-the-Loop (HITL)
- **类别：** Agent 与 Tool
- **别名：** Human oversight、human review
- **实际含义：** 一种工作流设计，由人员在 AI 驱动流程的指定节点提供判断、纠正、审批或升级处理。
- **重要性：** 人员参与在影响重大、存在歧义或不可逆的边界最有价值，而不应作为每个步骤之后未明确定义的回退方案。
- **实践中：** 让 Agent 自动分类常规请求，但将不确定或高价值的案例连同证据和拟议操作一起转交给审核人员。
- **常见误解：** HITL 不会自动使系统变得安全。审核人员需要时间、Context、权限和明确的决策标准。
- **相关术语：** Approval Gate、Verification Gate、Agent、Guardrails

### Hybrid Retrieval
- **类别：** 检索与生成
- **实际含义：** 一种在合并或重新排序结果之前，组合不同方法信号的检索方式，常见组合包括词法匹配和稠密 Vector 相似度。
- **重要性：** 精确标识符、罕见术语和语义改写的表现各不相同，因此单一检索信号可能遗漏有用证据。
- **实践中：** 同时使用 BM25-style 关键词搜索和 Embedding 检索候选项，合并它们的排名，然后针对用户查询对组合结果集重新排序。
- **常见误解：** Hybrid retrieval 组合候选信号。Reranker 则对已经检索出的候选项应用第二个相关性 Model。
- **学习课程：** [Advanced RAG](../phases/11-llm-engineering/07-advanced-rag/)
- **相关术语：** Semantic Search、Reranker、RAG (Retrieval-Augmented Generation)、Embedding

### Hyperparameter
- **类别：** 数学与 Training
- **人们常说：** 一个需要调优的设置。
- **实际含义：** 一种影响 Model 结构、优化、数据处理或 Inference 的配置选择，而不是像普通 Model 参数那样通过学习获得。示例包括 Learning Rate、Batch Size、层数和解码设置。
- **常见误解：** 一些 Hyperparameter 在 Training 前选定，另一些则可以在调度过程中或 Inference 时更改。
- **相关术语：** Parameter、Learning Rate、Batch Size、Temperature

## I

### Idempotency
- **类别：** AI-native 开发
- **实际含义：** 使用相同标识重复执行同一操作时，除首次成功应用产生的副作用外，不会产生额外副作用的属性。
- **重要性：** 重试在分布式 Agent 系统中很常见。如果没有幂等性，一次响应不确定就可能导致付款、评论、部署或记录重复。
- **实践中：** 为 Tool 请求附加 idempotency key，并持久化已完成的结果，使重试直接返回该结果，而不是再次执行写入。
- **常见误解：** 幂等性并不意味着每次响应都逐字节完全相同，而是意味着预期的状态变更不会重复发生。
- **来源：** [HTTP Semantics: idempotent methods](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)
- **相关术语：** Retry with Backoff、Durable Execution、Checkpoint

### Image Token
- **类别：** Multimodal 系统
- **实际含义：** 一种由特定 Model 定义、以 Vector 或离散编码表示的视觉单元，通常从图像 patch、区域或学习得到的视觉 codebook 条目中生成。
- **重要性：** 将视觉输入转换为序列后，Transformer-style 组件便可以将图像与文本或其他经过 Tokenizer 处理的模态一起处理。
- **实践中：** 记录 Token 是连续 patch 还是离散编码，保留空间位置，测试分辨率和宽高比变化，并将视觉 Token 计入 Model 的输入预算。
- **常见误解：** 一个图像 Token 不一定对应一个像素、一个对象或一块固定的物理区域。它的范围由视觉 encoder 或 Tokenizer 决定。
- **学习课程：** [Vision-Language Models](../phases/04-computer-vision/25-vision-language-models/)
- **相关术语：** Patch Embedding、Token、VAE (Variational Autoencoder)、Vision Transformer (ViT)
- **来源：** [Vision Transformer](https://arxiv.org/abs/2010.11929); [VQ-VAE](https://arxiv.org/abs/1711.00937)

### In-Context Learning
- **类别：** Prompting 与 Context
- **实际含义：** Model 根据当前输入中提供的指令、示例或模式调整自身行为，而不执行常规参数更新。
- **重要性：** 它解释了一个预训练 Model 如何在权重保持不变的情况下，根据 Context 执行新任务。
- **实践中：** 将有代表性的演示放在目标输入之前，测试顺序和格式变体，并将 Evaluation 示例与演示分开。
- **常见误解：** In-context learning 是临时条件化，不是 Fine-tuning、持久记忆，也不能证明 Model 推断出了预期规则。
- **相关术语：** Few-Shot、Zero-Shot、Context Window、Prompt Engineering
- **来源：** [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)

### Incident Response
- **类别：** 可靠性与运维
- **实际含义：** 对威胁服务、数据、安全或信息安全的事件进行检测、分析、遏制、恢复、沟通和复盘学习的协调流程。
- **重要性：** 事件发生期间，明确的角色和证据比临场发挥更重要，尤其是在 Model 行为和分布式依赖项使故障边界难以识别时。
- **实践中：** 定义严重级别和指挥角色，保留 trace 和审计记录，停止有害操作，沟通影响范围，验证恢复情况，并跟踪纠正工作直至完成。
- **常见误解：** Incident response 负责管理事件及其后果。根因分析和长期预防工作会在即时服务恢复后继续进行。
- **学习课程：** [SRE for AI](../phases/17-infrastructure-and-production/23-sre-for-ai/)
- **相关术语：** Observability、Audit Log、Postmortem、Availability
- **来源：** [Google SRE: Managing Incidents](https://sre.google/sre-book/managing-incidents/); [NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final)

### Indirect Prompt Injection
- **类别：** 安全与治理
- **实际含义：** 一种通过系统检索或观察到的内容实施的 Prompt-injection 攻击，例如网页、文档、电子邮件、图像文本或 Tool 结果，而不是直接通过用户指令实施。
- **重要性：** Agent 在执行已授权任务时可能遇到攻击者控制的指令，并错误地将这些内容视为具有权威性的指导。
- **实践中：** 将外部内容标记为不可信数据，使其与指令分离，最小化 Tool 权限，对会产生重大后果的操作要求审批，并在回归测试中加入恶意检索内容。
- **常见误解：** Indirect 描述的是传递路径，而不是攻击较弱。检索内容中的隐藏指令可能与直接用户 Prompt 造成同样严重的后果。
- **学习课程：** [Indirect Prompt Injection](../phases/18-ethics-safety-alignment/15-indirect-prompt-injection/)
- **相关术语：** Prompt Injection、Instruction Hierarchy、Trust Boundary、Data Exfiltration
- **来源：** [Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173)

### Inductive Bias
- **类别：** Model 与 Inference
- **人们常说：** 学习系统中内置的假设。
- **其实际含义：** 偏向某些函数或表示而非其他函数或表示的结构性或统计性假设。卷积偏向局部性和共享滤波器；因果掩码偏向根据先前位置进行预测。
- **常见误解：** Transformer 仍会通过 Tokenization、位置处理、掩码、架构、数据和目标引入归纳偏置。
- **相关术语：** CNN (Convolutional Neural Network), Transformer, Feature

### Inference
- **类别：** Model 与 Inference
- **人们常说：** 运行一个训练好的 Model。
- **其实际含义：** 执行训练好的 Model，以生成预测、分数、Embedding 或生成的 Token，而不对其参数执行常规 Training 更新。
- **常见误解：** 应用程序可以在 Inference 期间更新缓存、对话状态或外部记忆，即使 Model 权重保持不变。
- **相关术语：** Autoregressive, Streaming, KV Cache

### Instruction Following
- **类别：** Prompt 与 Context
- **其实际含义：** Model 将自然语言指令和所提供的 Context 映射为满足既定任务与约束的行为的能力。
- **为何重要：** 语言生成可以很流畅，却不遵守用户请求的操作、格式、边界或优先级。
- **实践中：** 使用相互冲突的约束、格式要求、无关 Context 和拒绝案例，将指令遵循情况与答案质量分开进行 Evaluation。
- **常见误解：** 指令遵循不等同于事实正确性、对齐，也不等同于服从每个看起来像指令的字符串。
- **相关术语：** SFT (Supervised Fine-Tuning), Prompt Engineering, Instruction Hierarchy, Alignment
- **来源：** [Finetuned Language Models Are Zero-Shot Learners](https://arxiv.org/abs/2109.01652)

### Instruction Hierarchy
- **类别：** Prompt 与 Context
- **其实际含义：** 一套用于解决不同权限来源之间指令冲突的规则，例如应用程序政策、用户和不可信的检索内容。
- **为何重要：** Agent 系统会将可信目标与外部文本混合，因此当低权限内容与高权限约束冲突时，Model 和运行框架需要有明确的响应方式。
- **实践中：** 将不可信的 Tool 输出标记为数据，在该内容之外保留更高优先级的约束，并测试直接和间接冲突案例。
- **常见误解：** 指令层级可以改善行为，但它并非安全边界；最小权限和审批控制仍需限制后果。
- **相关术语：** System Prompt, Prompt Injection, Least Privilege, Tool Contract
- **来源：** [The Instruction Hierarchy](https://arxiv.org/abs/2404.13208)

### Inter-Token Latency (ITL)
- **类别：** 基础设施与服务
- **其实际含义：** 对于一个请求，两个连续输出 Token 到达事件之间经过的时间；对于首个 Token 之后的输出 Token，计算方式为 `t_i - t_(i-1)`。
- **为何重要：** 单个间隔可以揭示单请求平均值可能掩盖的解码停顿和流式抖动，尤其是在批处理、抢占或混合工作负载下。
- **实践中：** 记录首个 Token 之后的每个间隔及其请求和 Token 位置，然后按工作负载、输出长度和并发度报告分布，同时避免因汇总而丢失请求边界。
- **常见误解：** ITL 是连续 Token 之间的一个间隔。Time per Output Token 是一个请求中这些间隔的平均值，而 Time to First Token 涵盖流式传输开始前的等待时间。
- **学习课程：** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **相关术语：** Time per Output Token (TPOT), Time to First Token (TTFT), Decode Phase, Tail Latency
- **来源：** [DistServe](https://arxiv.org/abs/2401.09670)

## J

### Jailbreak
- **类别：** 安全与治理
- **其实际含义：** 一种对抗性输入或交互策略，旨在让 Model 产生其 Training 或应用程序控制机制试图阻止的行为。
- **为何重要：** 成功的越狱会暴露既定政策与实际行为之间的差距；当 Model 能够控制 Tool 或受保护数据时，后果可能更加严重。
- **实践中：** 根据被禁止的行为构建测试族，改变格式和交互长度，同时测量拒绝和有害完成情况，并将确认的故障转化为有版本控制的对抗性 Eval。
- **常见误解：** 越狱针对的是 Model 或系统的行为限制。Prompt Injection 会重定向指令遵循过程，通常使其转向攻击者的目标；一次交互可能同时涉及两者。
- **学习课程：** [Jailbreak Taxonomy](../phases/19-capstone-projects/82-jailbreak-taxonomy/)
- **相关术语：** Prompt Injection, Red Teaming, Guardrails, Eval Set
- **来源：** [Universal and Transferable Adversarial Attacks on Aligned Language Models](https://arxiv.org/abs/2307.15043)

### JAX
- **类别：** 数学与 Training
- **人们常说：** 一个类似 NumPy、用于加速 Machine Learning 的系统。
- **其实际含义：** 一个 Python 库，用于通过自动微分、编译、Vector化以及跨加速器的并行执行来转换数值函数。它的转换机制最适合显式状态和函数式风格的代码。
- **常见误解：** JAX 并不禁止所有有状态编程，但转换函数内部的隐藏修改可能产生错误或不受支持的行为。
- **学习课程：** [Introduction to JAX](../phases/03-deep-learning-core/12-intro-to-jax/)
- **来源：** [JAX documentation](https://docs.jax.dev/en/latest/)
- **相关术语：** Autograd, Tensor, CUDA

## K

### Knowledge Distillation
- **类别：** 数学与 Training
- **其实际含义：** 训练学生 Model，使其复现能力更强的教师 Model 所选择的行为或输出分布，通常还会同时使用普通的目标 Label。
- **为何重要：** 当直接提供教师 Model 服务并不现实的时候，它可以将有用的行为迁移到更小或成本更低的 Model 中。
- **实践中：** 定义教师输出、温度、学生 Loss 和留出的 Eval Set，然后将学生 Model 同教师 Model 以及仅使用 Label 的基线进行比较。
- **常见误解：** 蒸馏会迁移 Training 分布上的行为；它不会复制教师 Model 的所有能力、事实或安全属性。
- **相关术语：** Fine-tuning, Loss Function, Logits, Quantization
- **来源：** [Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531)

### KV Cache
- **类别：** Model 与 Inference
- **人们常说：** 一种能加快 Token 生成速度的缓存。
- **其实际含义：** 自回归生成过程中存储的先前位置的 key 和 value Tensor。复用它们可以避免在每个解码步骤中为未变化的前缀重新计算 Attention 投影。
- **为何重要：** 它可以减少重复计算，但会消耗随序列长度、层数、Batch 和 Model 配置增长的内存。
- **常见误解：** KV Cache 是序列在运行时的 Attention 状态。Prefix Caching 会跨请求复用符合条件的 KV 状态，而 Prompt Cache 是范围更广的提供商或应用程序复用契约。
- **学习课程：** [KV Cache and Flash Attention](../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/)
- **相关术语：** Attention, Autoregressive, Prefix Caching, Prompt Cache

## L

### Late Fusion
- **类别：** Multimodal 系统
- **其实际含义：** 通过不同的编码器或预测器分别处理各种模态，并在接近任务输出的位置组合它们的高层表示、分数或决策。
- **为何重要：** 不同分支可以使用特定于模态的架构并容忍输入缺失，但可能错过更早融合方式能够利用的细粒度交互。
- **实践中：** 校准每个分支，定义模态缺失如何影响合并，比较分数级和 Feature 级组合，并将每个分支单独作为消融实验进行 Evaluation。
- **常见误解：** Late Fusion 描述的是组合发生的位置。它并不意味着简单取平均值，也不保证各模态贡献相同。
- **学习课程：** [Cross-Attention Fusion](../phases/19-capstone-projects/61-cross-attention-fusion/)
- **相关术语：** Early Fusion, Multimodal Fusion, Modality, Evaluation (Eval)
- **来源：** [Multimodal Deep Learning](https://ai.stanford.edu/~ang/papers/icml11-MultimodalDeepLearning.pdf); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Latent Space
- **类别：** 数据与表示
- **人们常说：** Model 的隐藏表示空间。
- **其实际含义：** 一个经过学习的表示空间，其坐标对 Model 有用的因素进行编码。它的维度可能低于输入，但并非每种潜在表示都必须进行压缩。
- **常见误解：** 邻近点之间的相似性，只有按照 Model 和 Training 目标所学到的标准才具有意义。
- **相关术语：** Embedding, VAE (Variational Autoencoder), Feature

### Learning Rate
- **类别：** 数学与 Training
- **人们常说：** 每个优化步骤的幅度。
- **其实际含义：** Optimizer 用于控制参数更新幅度的缩放因子。值过大可能使 Training 不稳定；值过小则可能使取得有效进展的速度慢到不切实际。
- **常见误解：** 实际更新还取决于 Optimizer、调度方案、Gradient 尺度、Batch 和参数历史。
- **相关术语：** Optimizer, Gradient Descent, Batch Size

### Learning Rate Schedule
- **类别：** 数学与 Training
- **其实际含义：** 一种策略，根据步骤、Epoch、指标或预定义曲线，随着 Training 推进改变 Optimizer 的学习率。
- **为何重要：** 不同 Training 阶段可能适合不同的更新尺度，因此固定不变的学习率可能在早期不稳定，或在后期造成浪费。
- **实践中：** 将调度方案与 Optimizer 配置一起进行版本控制，记录每个步骤的实际学习率，并在相同 Token 或更新预算下比较不同调度方案。
- **常见误解：** 调度器控制学习率随时间的变化；它不决定何时执行 Optimizer 步骤，也不保证收敛。
- **相关术语：** Learning Rate, Warmup, Optimizer, Epoch
- **来源：** [SGDR](https://arxiv.org/abs/1608.03983); [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

### Least Privilege
- **类别：** Evaluation 与安全
- **其实际含义：** 仅向 Model、Agent、Tool 或用户授予当前任务所需的权限，并且只在需要这些权限的时间内授予。
- **为何重要：** Model 可能犯错或遵循恶意指令。缩小权限范围可以减少任何一次故障所造成的损害。
- **实践中：** 向文档 Agent 授予源文件读取权限和一个分支的写入权限，但不授予生产环境凭据或合并权限。
- **常见误解：** 身份认证用于证明身份。最小权限用于限制该身份能够执行的操作。
- **相关术语：** Sandbox, Approval Gate, Prompt Injection, Tool Contract

### LLM (Large Language Model)
- **类别：** Model 与 Inference
- **人们常说：** AI 应用程序的大脑。
- **其实际含义：** 一种具有足够容量并经过广泛 Training 的语言 Model，能够通过 Prompt 或适配执行多种语言任务。目前大多数 LLM 使用 Transformer 架构和序列预测目标，但其规模阈值、数据来源和 Training 方案各不相同。
- **常见误解：** LLM 是一个 Model 组件。Tool、检索、状态、政策和产品逻辑存在于其周围的系统中。
- **相关术语：** Transformer, Autoregressive, Agent Harness

### LLM-as-a-Judge
- **类别：** Evaluation 与安全
- **其实际含义：** 使用语言 Model，根据评分标准对另一个系统的输出进行评分、比较、Classification 或评议。
- **为何重要：** 它可以扩展对难以表示为精确匹配测试的质量进行 Evaluation 的能力，例如清晰度或指令遵循情况。
- **实践中：** 向一个独立的评估 Model 提供任务、候选答案、参考证据和结构化评分标准，然后使用经过人工审核的示例校准其分数。
- **常见误解：** 评判 Model 并非事实标准。它可能受到顺序、冗长度、风格、Prompt 措辞或 Model 共有故障的影响。
- **学习课程：** [Eval-Driven Agent Development](../phases/14-agent-engineering/30-eval-driven-agent-development/)
- **相关术语：** Evaluation (Eval), Eval Set, Verification Gate, Precision & Recall

### Load Shedding
- **类别：** 可靠性与运维
- **其实际含义：** 当需求超过能够产生有效结果的可用容量时，在一个或多个过载边界上有意拒绝、丢弃或取消选定的工作。
- **为何重要：** 在过载期间继续接受每个请求，可能会加剧排队，直到几乎所有请求都错过截止时间，并使恢复变得更加困难。
- **实践中：** 在能够做出知情判断的最早边界执行负载丢弃，尽可能保留高优先级和已经接纳的工作，识别发生过载的范围，并且仅当该状况是暂时性的且请求仍在重试预算之内时，才将响应标记为可重试。
- **常见误解：** 负载丢弃并不局限于已经接受的工作。Admission Control 专指接受之前的关卡，而 Rate Limiting 即使在容量仍然充足时也可以强制执行使用政策。
- **相关术语：** Admission Control, Backpressure, Rate Limit, Graceful Degradation
- **来源：** [Google SRE: Handling Overload](https://sre.google/sre-book/handling-overload/)

### Logits
- **类别：** Model 与 Inference
- **其实际含义：** Model 针对候选结果给出的未经归一化的数值分数，之后归一化函数或解码规则会将其转换为选择结果。
- **为何重要：** Temperature、softmax、top-k 和 top-p 会直接作用于 logits 或从中派生，因此 logits 将 Model 计算与生成的 Token 连接起来。
- **实践中：** 当 API 提供 logits 或对数概率时检查它们，在采样前应用掩码，并避免将原始数值大小解释为经过校准的置信度。
- **常见误解：** Logits 不是概率；如果没有明确的转换方式，也不能跨不相关的位置、Model 或任务进行比较。
- **相关术语：** Softmax, Temperature, Token, Cross-Entropy
- **来源：** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

### LoRA (Low-Rank Adaptation)
- **类别：** 数学与 Training
- **人们常说：** 参数高效的 Fine-tuning。
- **其实际含义：** 一种冻结基础权重，并为选定层学习低秩更新 Matrix 的方法。它可以减少可训练参数的数量，并且相比全参数 Fine-tuning 降低 Training 内存占用。
- **常见误解：** 实际的内存和速度节省取决于秩、目标模块、Optimizer 状态、激活内存、Quantization 和具体实现。
- **学习课程：** [Fine-Tuning and LoRA](../phases/11-llm-engineering/08-fine-tuning-lora/)
- **来源：** [LoRA paper](https://arxiv.org/abs/2106.09685)
- **相关术语：** Fine-tuning, QLoRA, Parameter

### Loss Function
- **类别：** 数学与 Training
- **人们常说：** 一个衡量 Training 误差的数字。
- **其实际含义：** 一种将预测和目标映射为某个值的目标函数，有时还包含正则化项，优化过程会尝试降低该值。Loss 决定 Training 直接奖励或惩罚哪些错误。
- **常见误解：** 较低的 Training Loss 并不保证在生产任务上具有实用、安全或可泛化的行为。
- **相关术语：** Cross-Entropy, Gradient, Evaluation (Eval)

### Lost in the Middle
- **类别：** Prompt 与 Context
- **其实际含义：** 一种长 Context 故障模式，其中 Model 性能会随证据位置变化；当相关信息位于开头和结尾之间时，性能可能下降。
- **为何重要：** 将证据放入 Context Window 并不能保证 Model 会以同等可靠性使用每个位置的信息。
- **实践中：** 测试多个证据位置，减少干扰项，将对决策至关重要的约束放在仍能保持显著性的位置，并依据来源验证答案。
- **常见误解：** 这是一种观察到的行为模式，而不是以相同方式影响每个 Model、任务或位置的固定规律。
- **相关术语：** Context Window, Context Engineering, Eval Set, Grounding
- **来源：** [Lost in the Middle](https://aclanthology.org/2024.tacl-1.9/)

## M

### Maximum Marginal Relevance (MMR)
- **类别：** 检索与生成
- **其实际含义：** 一种选择规则，用于平衡与查询的相关性，以及相对于已选项目的新颖性。
- **为何重要：** 它可以减少重复的分块，使有限的 Context 预算覆盖更多不同的证据。
- **实践中：** 检索候选集合，使用有明确文档记录的相关性与多样性权重选择下一个项目，并同时 Evaluation 答案质量和来源覆盖率。
- **常见误解：** MMR 会使现有候选集合更加多样化；它不会检索缺失的证据，也不能证明所选段落是正确的。
- **相关术语：** Reranker, Chunking, RAG (Retrieval-Augmented Generation), Grounding
- **来源：** [The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries](https://www.cs.cmu.edu/~jgc/publication/MMR_DiversityBased_Reranking_SIGIR_1998.pdf)

### MCP (Model Context Protocol)
- **类别：** Agent 与 Tool
- **人们常说：** AI 应用程序连接 Tool 和 Context 的标准方式。
- **其实际含义：** 一种开放的 JSON-RPC 协议，允许 host 连接到通过明确的请求、结果、发现和传输契约公开 Tool、资源、Prompt 和扩展的 server。在 2026-07-28 修订版中，每个请求都会携带其协议版本和 client capabilities，不再依赖初始化握手或协议 session。
- **常见误解：** MCP 对发现和交换过程进行标准化。它不会决定调用哪个 Tool 是安全的，不会授予权限，也不会禁止应用程序使用显式状态句柄。
- **学习课程：** [Model Context Protocol](../phases/11-llm-engineering/14-model-context-protocol/)
- **来源：** [MCP 2026-07-28 key changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- **相关术语：** Stateless MCP、Multi Round-Trip Request (MRTR)、Function Calling、Tool Contract、Least Privilege

### Membership Inference
- **类别：** 安全与治理
- **实际含义：** 一种攻击，通过观察 Model 输出或其他可访问的信号，估计某条特定记录或样本是否包含在 Model 的 Training 数据中。
- **重要性：** 即使 Model 没有逐字复现某条记录，可区分的行为仍可能泄露有关其是否参与敏感 Dataset 的信息。
- **实践中：** 通过真实查询接口测试有代表性的成员与非成员，限制不必要的置信度信号，减少数据暴露，并根据效用要求评估隐私防御措施。
- **常见误解：** Membership inference 判断某条记录是否参与了 Training。Model extraction 试图复现 Model 行为，而直接记忆测试则判断能否恢复内容。
- **学习课程：** [Differential Privacy for LLMs](../phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/)
- **相关术语：** Data Leakage、Data Minimization、Eval Set、Data Classification
- **来源：** [Membership Inference Attacks Against Machine Learning Models](https://doi.org/10.1109/SP.2017.41)

### Mixed Precision
- **类别：** 数学与 Training
- **人们常说：** 使用较低精度的算术运算来提升速度并节省内存。
- **实际含义：** 一种针对不同操作使用不同数据类型的数值策略，通常对许多 Matrix 运算使用较低精度，而对需要更大数值范围或更高稳定性的值使用较高精度。
- **常见误解：** 对速度、内存和准确率的影响取决于硬件、数据类型、缩放方法、kernel 和 Model，并不存在固定的倍数。
- **相关术语：** Tensor、CUDA、NaN (Not a Number)、Quantization

### Modality
- **类别：** Multimodal 系统
- **实际含义：** 一种具有自身结构和采集过程的信息形式，例如文本、图像、音频、视频、深度或传感器测量数据。
- **重要性：** 不同模态具有不同的采样率、噪声、空间或时间结构以及缺失数据行为，因此同一种预处理假设很少能适用于所有模态。
- **实践中：** 在设计对齐或融合之前，记录每种模态的来源、单位、分辨率、时间信息、预处理方式和缺失值策略。
- **常见误解：** 模态并不只是文件扩展名或 Feature 列。多种编码可以表示同一种模态，一个样本也可以包含多种模态。
- **学习课程：** [MIO Any-to-Any Streaming](../phases/12-multimodal-ai/16-mio-any-to-any-streaming/)
- **相关术语：** Multimodal Model、Token、Tensor、Embedding
- **来源：** [ImageBind: One Embedding Space To Bind Them All](https://arxiv.org/abs/2305.05665); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Modality Alignment
- **类别：** Multimodal 系统
- **实际含义：** 学习或建立不同模态表示之间的对应关系，使语义或时间上相关的项目能够匹配。
- **重要性：** 如果系统无法在结构不同的输入之间关联同一事件、对象或概念，融合和跨模态检索就会失败。
- **实践中：** 定义正样本对和负样本对，保留时间或空间元数据，评估不匹配的样本，并将对齐能力与下游任务准确率分开衡量。
- **常见误解：** 对齐使不同表示具有可比性或对应关系，但不要求它们变得完全相同，也不要求抹除模态特有的信息。
- **学习课程：** [Projection Layer Modality Alignment](../phases/19-capstone-projects/60-projection-layer-modality-align/)
- **相关术语：** Shared Embedding Space、Contrastive Learning、Grounding、Multimodal Fusion
- **来源：** [Learning Transferable Visual Models From Natural Language Supervision](https://proceedings.mlr.press/v139/radford21a.html)

### Model Card
- **类别：** Evaluation 与安全
- **实际含义：** 一份结构化报告，用于描述 Model 的预期用途、Evaluation 条件、性能特征、局限性以及相关的伦理或安全考量。
- **重要性：** 它为下游开发者提供上下文，帮助他们判断已报告的证据是否适用于自己的用户和部署条件。
- **实践中：** 记录 Model 版本、Training 与 Evaluation 范围、子群体结果、已知故障模式、禁止用途以及每项声明的日期。
- **常见误解：** Model Card 用于传达证据和局限性；它不是认证、保证、系统威胁模型，也不能替代针对具体部署的 Evaluation。
- **相关术语：** Eval Set、Dataset Split、Distribution Shift、Alignment
- **来源：** [Model Cards for Model Reporting](https://dl.acm.org/doi/10.1145/3287560.3287596)

### Model Router
- **类别：** AI-native 开发
- **实际含义：** 一个根据能力、延迟、成本、Context 大小、策略和当前可用性等要求，为请求选择 Model 或提供商的组件。
- **重要性：** 不同任务和故障条件适合不同的 Model，路由可以提高结果质量，而无须将每个请求都发送给最大的选项。
- **实践中：** 将低风险提取任务发送给快速 Model，将复杂代码审查发送给能力更强的 Model，并且仅故障转移到满足相同数据策略的提供商。
- **常见误解：** 路由是一项策略决策。随机负载均衡只负责分配流量。
- **相关术语：** Evaluation (Eval)、Circuit Breaker、Rate Limit、Cost per Successful Task

### Model Serving
- **类别：** 基础设施与服务
- **实际含义：** 一个运行时和 API 层，负责加载带版本的 Model 产物、接收 Inference 请求、调度执行、管理资源，并按照运维契约返回结果。
- **重要性：** 如果没有明确设计排队、Batch、放置、版本管理、取消和响应边界，即使能力强大的 Model 也可能产生不可靠的产品。
- **实践中：** 固定 Model 和 Tokenizer 版本，验证请求限制，公开就绪状态和延迟信号，控制并发，并在路由生产流量之前测试回滚。
- **常见误解：** Model Serving 的范围比单次调用 Inference 更广，但比完整应用更窄；完整应用还可能包括检索、Tool、策略和用户状态。
- **学习课程：** [Self-Hosted Serving Selection](../phases/17-infrastructure-and-production/28-self-hosted-serving-selection/)
- **相关术语：** Inference、Model Router、Autoscaling、Observability
- **来源：** [Clipper](https://arxiv.org/abs/1612.03079)

### MoE (Mixture of Experts)
- **类别：** Model 与 Inference
- **人们常说：** 一种针对每个 Token 只激活部分参数的大型 Model。
- **实际含义：** 一种包含多个专家子网络和一个学习型路由器的架构，路由器会为每个输入单元（通常是每个 Token）选择其中一个子集。稀疏激活可以增加总参数容量，而无须在每次前向传播中使用所有专家。
- **重要性：** 计算、内存、通信、路由均衡和质量取决于具体架构与服务系统。
- **常见误解：** 除非 Model 开发者公开披露，否则产品名称并不能证明其采用了 MoE 架构。
- **学习课程：** [Mixture of Experts](../phases/07-transformers-deep-dive/11-mixture-of-experts/)
- **相关术语：** Transformer、Model Router、Parameter

### Multimodal Fusion
- **类别：** Multimodal 系统
- **实际含义：** 结合来自多种模态的证据或学习到的表示，以生成联合表示、预测结果或生成式输出。
- **重要性：** 不同模态可以提供互补证据，但简单粗暴的组合可能会放大噪声、时序错误或某个占主导地位的数据流。
- **实践中：** 建立单模态基线，明确融合位置和掩码，测试缺失和相互矛盾的输入，并报告每个被评估切片主要由哪些模态驱动。
- **常见误解：** 融合是组合操作。对齐负责建立对应关系，而仅仅将两种模态放入同一个请求，并不能证明任一过程已成功发生。
- **学习课程：** [Cross-Attention Fusion](../phases/19-capstone-projects/61-cross-attention-fusion/)
- **相关术语：** Early Fusion、Late Fusion、Cross-Attention、Modality Alignment
- **来源：** [Multimodal Deep Learning](https://ai.stanford.edu/~ang/papers/icml11-MultimodalDeepLearning.pdf); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Multimodal Model
- **类别：** Multimodal 系统
- **实际含义：** 一种通过表示、对齐、融合、转换或协同预测，从多种模态中学习、关联多种模态或生成多种模态的 Model。
- **重要性：** Multimodal 能力取决于模态之间如何交互，而不只是能否接受多种输入类型；每个表示边界都可能发生故障。
- **实践中：** 记录支持的输入与输出组合，分别及联合评估每种模态，测试缺失或冲突的输入，并随 Model 一起跟踪预处理版本。
- **常见误解：** 包含独立图像 Model 和文本 Model 的 Pipeline 在系统层面属于 Multimodal，但它不一定是一个经过联合 Training 的 Multimodal Model。
- **学习课程：** [MIO Any-to-Any Streaming](../phases/12-multimodal-ai/16-mio-any-to-any-streaming/)
- **相关术语：** Modality、Vision-Language Model (VLM)、Multimodal Fusion、Transformer
- **来源：** [Flamingo: a Visual Language Model for Few-Shot Learning](https://arxiv.org/abs/2204.14198); [Multimodal Machine Learning: A Survey and Taxonomy](https://arxiv.org/abs/1705.09406)

### Multi Round-Trip Request (MRTR)
- **类别：** Agent 与 Tool
- **别名：** MRTR
- **实际含义：** 一种 MCP 请求模式，其中某项操作返回带有一个或多个 `inputRequests` 的 `resultType: input_required`，随后客户端使用 `inputResponses` 和原样返回的 `requestState` 重试原始方法。
- **重要性：** 它允许无状态服务器请求用户、Model 或 root 输入，而无须发起由服务器启动的 JSON-RPC 交换或存储协议会话状态。
- **实践方式：** 从 `tools/call` 返回 input request，在 host 中收集经过授权的 response，然后使用新的 JSON-RPC id 重试同一个 tool call。
- **常见误解：** `requestState` 是不受信任的往返数据。在将其用于授权或业务决策之前，应对其进行完整性保护，并且不要将其视为服务器端会话标识符。
- **学习课程：** [MCP Roots and Elicitation](../phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/)
- **相关术语：** Stateless MCP、MCP (Model Context Protocol)、Human-in-the-Loop (HITL)、Tool Contract
- **来源：** [MCP Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)

## N

### NaN (Not a Number)
- **类别：** 数学与 Training
- **人们常说：** 数值计算失败的标志。
- **实际含义：** 一个表示未定义或无法表示的数值结果的浮点值。在 Training 中，NaN 可能源于无效操作、溢出、不稳定的归一化、幅度过大的更新，或更早出现的损坏值。
- **实践中：** 找到第一个非有限 Tensor，检查其输入，并在该操作附近添加断言或异常检测。
- **相关术语：** Mixed Precision、Learning Rate、Gradient

### Normalization
- **类别：** 数学与 Training
- **人们常说：** 将数据缩放到标准范围。
- **实际含义：** 一系列使用指定统计量对输入、激活值或 Feature 进行重新缩放或重新居中的变换。Batch normalization 和 layer normalization 使用不同的轴，并且在 Training 与 Inference 期间表现不同。
- **常见误解：** 归一化可以提高优化稳定性，但它并不总是允许使用更大的 Learning Rate，也不会改善每一种架构。
- **相关术语：** Tensor、Activation Function、Mixed Precision

### Nucleus Sampling (Top-p)
- **类别：** Model 与 Inference
- **别名：** Top-p sampling
- **实际含义：** 一种解码方法，从累计 Probability 达到选定阈值的最小下一 Token 候选集合中进行采样。
- **重要性：** 候选集合的大小会根据 Probability Distribution 自适应调整：不确定性分布较广时保留更多选项，Probability 较集中时保留更少选项。
- **实践中：** 在 temperature 和停止设置保持不变的情况下评估阈值，并随每个结果记录完整的解码配置。
- **常见误解：** Top-p 使用 Probability 质量阈值，而 top-k 始终保留固定最大数量的候选项。
- **相关术语：** Top-k Sampling、Temperature、Decoding Strategy、Softmax
- **来源：** [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)

## O

### Observability
- **类别：** AI-native 开发
- **实际含义：** 根据已记录的输入、输出、状态转换、Tool 调用、耗时、成本、错误和 Evaluation 信号来理解 AI 系统行为的能力。
- **重要性：** AI 故障通常横跨 Model、检索、Tool 和编排。你需要相互关联的证据来定位发生故障的边界。
- **实践中：** 在检索、Model 调用、Tool 执行、审批和最终评分之间记录统一的 trace ID，同时应用脱敏和访问控制。
- **常见误解：** Logging 用于收集事件。Observability 则使这些事件足够结构化且相互关联，从而能够回答运维问题。
- **学习课程：** [Agent Observability Platforms](../phases/14-agent-engineering/24-agent-observability-platforms/)
- **相关术语：** Trace、Evaluation (Eval)、Agent State、Time to First Token (TTFT)

### Optimizer
- **类别：** 数学与 Training
- **人们常说：** 更新权重的算法。
- **实际含义：** 一种将 Gradient 转换为参数更新的算法。普通 stochastic Gradient Descent 是一个简单基线；momentum、Adam 和其他 Optimizer 会利用历史信息或自适应缩放来改变更新方式。每种选择都有不同的内存占用、稳定性和调优行为。
- **常见误解：** Optimizer 使用 Gradient；Backpropagation 负责计算 Gradient。
- **相关术语：** Adam (Optimizer)、AdamW、Gradient、Learning Rate

### Orchestration
- **类别：** Agent 与 Tool
- **实际含义：** 一种控制逻辑，用于在 Model 和 Tool 步骤之间对工作进行排序、分支、委派、重试、暂停、恢复和终止。
- **重要性：** 可靠的 Agent 行为依赖于 Model 外部明确的工作流决策，尤其是在任务存在依赖关系或具有重大副作用时。
- **实践中：** 将稳定步骤编码为工作流或状态机，向 Model 开放有界决策，并在执行外部写入之前持久化状态转换。
- **常见误解：** 编排并不等同于自主性或多 Agent 系统；单个 Agent 也可以通过确定性工作流进行编排。
- **相关术语：** Agent Harness、Planning、Delegation、Durable Execution
- **来源：** [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)

### Overfitting
- **类别：** 数学与 Training
- **人们常说：** Model 记住了 Training 数据。
- **实际含义：** 一种泛化差距，即 Model 在 Training 数据上的表现显著优于在有代表性的未见数据上的表现。记忆可能是原因之一，但实际运行中的症状是泛化能力不足。
- **实践中：** 比较 Training 指标和留出指标，检查子群体故障，并测试数据质量、正则化、early stopping 或 Model 容量等方面的变更。
- **相关术语：** Underfitting、Dropout、Weight Decay、Eval Set

## P

### Paged KV Cache
- **类别：** 基础设施与服务
- **实际含义：** 一种 KV-cache 内存管理器，它将 Attention 状态存储在固定大小的块中，并将逻辑序列位置映射到物理块，而不是要求每个序列使用一段连续分配的内存。
- **重要性：** 可变序列长度会造成碎片化和不可预测的增长，因此基于块的分配可以提高可用内存，并支持灵活共享。
- **实践中：** 根据工作负载测量结果选择块大小，跟踪分配和驱逐，在请求之间隔离状态，并在内存压力下测试取消和前缀共享。
- **常见误解：** Paged KV cache 管理运行时 Attention 状态内存。它不会将 Model 参数移至磁盘，也不会扩展 Model 在 Training 中获得的 Context 限制。
- **学习课程：** [vLLM Serving Internals](../phases/17-infrastructure-and-production/04-vllm-serving-internals/)
- **相关术语：** KV Cache、Prefix Caching、Context Window、Model Serving
- **来源：** [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)

### Parameter
- **类别：** Model 与 Inference
- **人们常说：** 一个用于描述 Model 大小的数字。
- **实际含义：** 一个在 Training 期间学习到的值，通常是权重、偏置、Embedding 元素或归一化参数。参数数量是衡量 Model 容量的一种指标，但它不能直接决定质量、内存占用或服务成本。
- **常见误解：** 每个参数的内存占用取决于数值格式、Quantization 元数据、分片、Optimizer 状态、激活值和运行时开销。
- **相关术语：** Weight、MoE (Mixture of Experts)、Quantization

### Pass@k
- **类别：** Evaluation 与安全
- **实际含义：** 在一个任务集合中，k 个采样候选项中至少有一个通过指定正确性测试的任务所占比例。
- **重要性：** 对于代码生成等可由自动验证器检查每个候选项的任务，它衡量了多次采样尝试的价值。
- **实践中：** 在固定配置下独立生成候选项，对每个候选项运行相同的隔离测试，并报告 k、采样细节和估计器细节。
- **常见误解：** Pass@k 不是单次尝试准确率，更高的分数可能反映的是更大的尝试预算，而不是更好的首次回答。
- **相关术语：** Coding Agent、Regression Test、Eval Set、Test Oracle
- **来源：** [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374)

### Patch
- **类别：** AI-native 开发
- **实际含义：** 对一个或多个文件变更的可审查表示，通常以相对于已知基础修订版本的新增和删除形式表达。
- **重要性：** Patch 为人员和 Agent 提供了一个范围明确的产物，供其检查、测试、应用或拒绝，而无须接受整个工作目录。
- **实践中：** 要求 Coding Agent 返回 unified diff，然后验证它是否仅修改了允许的文件，并且能够干净地应用到预期 commit。
- **常见误解：** patch 记录的是文件变更，而不是交付这些变更所需的推理过程、测试证据或审批。
- **学习课程：** [Workbench for Real Repositories](../phases/14-agent-engineering/41-workbench-for-real-repos/)
- **相关术语：** Coding Agent、Worktree、Scope Contract、Regression Test

### Patch Embedding
- **类别：** Multimodal 系统
- **实际含义：** 一种学习得到的投影，将图像 patch 转换为固定宽度的 Vector，作为 Transformer 输入序列中的一个元素。
- **重要性：** 它在空间图像网格与序列 Model 之间建立接口，而 patch 大小控制 Token 数量和保留的局部细节。
- **实践中：** 记录 patch 和图像尺寸，显式处理填充或缩放，添加位置信息，并测量分辨率变化对准确率和 Token 成本的影响。
- **常见误解：** patch Embedding 是 patch 的 Vector 表示，并非语义对象检测器，也不能保证 patch 边界与视觉实体相匹配。
- **学习课程：** [Vision Transformer Patch Tokens](../phases/12-multimodal-ai/01-vision-transformer-patch-tokens/)
- **相关术语：** Vision Transformer (ViT)、Image Token、Embedding、Token
- **来源：** [An Image is Worth 16x16 Words](https://arxiv.org/abs/2010.11929)

### Perplexity
- **类别：** Model 与 Inference
- **人们常说：** 语言 Model 对 Dataset 的惊讶程度。
- **实际含义：** 在明确的 Tokenization 和对数约定下，平均负对数 Likelihood 的指数。值越低，表示 Model 为所评估序列赋予的 Probability 越高。
- **常见误解：** Perplexity 无法在不同 Tokenizer 或 Evaluation 设置之间进行比较，也不能直接衡量事实准确性或实用性。
- **相关术语：** Cross-Entropy、Token、Evaluation (Eval)

### Pipeline Parallelism
- **类别：** 基础设施与服务
- **实际含义：** 将连续的 Model 层组划分到不同设备上，并以流水线方式让 microbatch 或请求流经这些阶段。
- **重要性：** 它使 Model 能够突破单个设备的内存限制，但阶段不均衡、流水线气泡、activation 传输和故障协调会影响实际可用性能。
- **实践中：** 平衡各阶段成本，选择 microbatch 调度策略，测量空闲时间和互连流量，并对 Model 与 Checkpoint 的分区元数据进行版本管理。
- **常见误解：** Pipeline parallelism 按深度划分层。Tensor parallelism 则划分层内的 Tensor 运算。
- **学习课程：** [Scaling and Distributed Training](../phases/10-llms-from-scratch/05-scaling-distributed/)
- **相关术语：** Tensor Parallelism、Expert Parallelism、Batch Size、Model Serving
- **来源：** [GPipe](https://arxiv.org/abs/1811.06965)

### Planning
- **类别：** Agent 与 Tool
- **实际含义：** 构建、选择或修订一系列行动及其依赖关系，旨在从当前状态推进到目标状态。
- **重要性：** 显式计划能在 Agent 执行高成本或不可逆操作之前，让假设和执行顺序清晰可见。
- **实践中：** 要求提供简短且考虑依赖关系的计划，根据可用 Tool 和权限验证该计划，并在观察结果推翻某项假设时重新规划。
- **常见误解：** 生成的计划只是一项提议，不能证明其中的步骤可行、充分或安全。
- **相关术语：** Agent State、ReAct、Orchestration、Verification Gate
- **来源：** [LLM+P](https://arxiv.org/abs/2304.11477)

### Postmortem
- **类别：** 可靠性与运维
- **实际含义：** 一份持久保存的事故记录，用于说明影响、检测、响应、促成条件、恢复过程和责任明确的后续行动，而不以追责代替分析。
- **重要性：** 已解决的服务中断仍具有证据价值。记录系统状况和决策，可以将一次事件转化为降低复发率和缩短响应时间的改进。
- **实践中：** 根据 trace 和日志构建时间线，区分触发事件与促成条件，为行动指定负责人和截止日期，并审查每项行动是否改变了相关控制措施。
- **常见误解：** postmortem 不是会议记录，也不是寻找某个人的错误。它应当产出可测试的系统改进。
- **相关术语：** Incident Response、Regression Test、Audit Log、Observability
- **来源：** [Google SRE: Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)

### Precision & Recall
- **类别：** Evaluation 与安全
- **人们常说：** 衡量 Classification 或检索质量的两个指标。
- **实际含义：** Precision 关注被标记的项目中有多少是正确的；recall 关注相关项目中有多少被找到。对于同一个固定的评分 Model，改变决策阈值时，提高 recall 通常会降低 precision，反之亦然。更好的 Model 可以同时提高二者。F1 是它们的调和平均数。
- **常见误解：** 合适的阈值和指标取决于每种错误的成本以及目标类别的普遍程度。
- **相关术语：** Eval Set、Semantic Search、Guardrails

### Prefill
- **类别：** 基础设施与服务
- **别名：** Prefill Phase
- **实际含义：** 初始 Inference 阶段，处理所有给定的输入 Token，以生成它们的表示以及后续自回归生成所需的 Attention 状态。
- **重要性：** Prompt 形态、排队和缓存复用会影响 prefill 成本，并且 prefill 与 decode 对计算资源的竞争方式不同，因此它会显著影响启动延迟和服务调度。
- **实践中：** 记录 Prompt Token 数量和 prefill 延迟，区分排队时间与执行时间，比较缓存和未缓存的前缀，并在存在活跃 decode 流量时测试长 Prompt。
- **常见误解：** Prefill 是运行时的 Prompt 处理阶段，而不是生成的第一个 Token 本身。只有在 prefill 和所有排队过程完成后，才会出现第一个 Token。
- **学习课程：** [Disaggregated Prefill and Decode](../phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/)
- **相关术语：** Decode Phase、KV Cache、Time to First Token (TTFT)、Chunked Prefill
- **来源：** [Sarathi-Serve](https://www.usenix.org/system/files/osdi24-agrawal.pdf); [DistServe](https://arxiv.org/abs/2401.09670)

### Prefix Caching
- **类别：** 基础设施与服务
- **实际含义：** 跨请求复用为相同且符合条件的 Token 前缀生成的 KV-cache 块，使服务运行时能够跳过重复的前缀计算。
- **重要性：** 共享的系统指令、模板或文档可能消耗大量 prefill 工作，但只有当 Token 序列和缓存资格匹配时，复用才有效。
- **实践中：** 将稳定 Token 放在请求特定内容之前，在缓存标识中包含 Model 和 Tokenizer 版本，隔离租户敏感状态，监控命中率，并将淘汰视为正常情况。
- **常见误解：** Prefix caching 复用精确 Token 前缀的运行时 Attention 状态。Prompt caching 是更广义的提供商或应用契约，而 semantic caching 则为相似请求复用先前结果。
- **学习课程：** [Inference Optimization](../phases/10-llms-from-scratch/12-inference-optimization/)
- **相关术语：** Prompt Cache、Semantic Cache、KV Cache、Paged KV Cache
- **来源：** [SGLang](https://arxiv.org/abs/2312.07104)

### Progressive Disclosure
- **类别：** AI-native 开发
- **实际含义：** 先向人员或 Model 提供最低限度的有用 Context，然后在任务或证据需要时逐步展现更深入的细节。
- **重要性：** 它可以限制 Context 噪声和成本，同时确保权威细节可按需获取。
- **实践中：** 先向 Coding Agent 提供 repository 规则和地图；只有在它识别出相关模块后，才加载完整的实现文件。
- **常见误解：** Progressive disclosure 是分阶段提供细节访问权限，并非故意隐瞒决策所需的信息。
- **学习课程：** [Workbench for Real Repositories](../phases/14-agent-engineering/41-workbench-for-real-repos/)
- **相关术语：** Context Engineering、Repository Map、Token Budget、Handoff

### Prompt Cache
- **类别：** Prompting 与 Context
- **实际含义：** 对相同或符合条件的 Prompt 前缀复用提供商侧或应用侧的计算，使重复 Inference 能够避免部分预处理工作。
- **重要性：** 当满足提供商的缓存契约时，稳定指令和大型共享文档在重复调用中可以变得更便宜或更快。
- **实践中：** 将稳定的政策文本放在请求特定内容之前，监控缓存命中元数据，并将未命中视为正常情况，因为资格条件和有效期因提供商而异。
- **常见误解：** Prompt cache 是提供商或应用的复用契约，内部可能使用 prefix caching。Prefix caching 专门复用符合条件的精确 Token KV 状态，而 semantic caching 则为足够相似的请求复用先前结果。
- **学习课程：** [Prompt Caching](../phases/11-llm-engineering/15-prompt-caching/)
- **相关术语：** Semantic Cache、Prefix Caching、KV Cache、Time to First Token (TTFT)

### Prompt Engineering
- **类别：** Prompting 与 Context
- **人们常说：** 编写指令措辞，让 Model 遵循任务要求。
- **实际含义：** 设计面向 Model 的指令、示例、约束和输出要求，以改善其在特定任务上的行为。
- **常见误解：** Prompt 措辞无法弥补证据缺失、不安全的权限、糟糕的 Tool 契约或缺少 Evaluation。
- **学习课程：** [Prompt Engineering](../phases/11-llm-engineering/01-prompt-engineering/)
- **相关术语：** Context Engineering、Few-Shot、System Prompt、Structured Output

### Prompt Injection
- **类别：** Evaluation 与安全
- **人们常说：** 一条会改变 Model 行为方向的对抗性指令。
- **实际含义：** 一种攻击或故障模式，其中不受信任的内容影响 Model，使其无视预期指令、暴露数据、滥用 Tool，或执行超出用户目标的操作。这些内容可以直接来自用户，也可以通过检索到的页面、文件、消息或 Tool 输出间接传入。
- **重要性：** Model 通过同一个语言通道处理指令和数据，因此仅靠输入过滤无法可靠地区分所有恶意指令与合法内容。
- **实践中：** 将外部内容视为不受信任，将其与具有授权效力的指令隔离，尽量减少 Tool 权限，对影响重大的写入操作要求审批，并验证输出和操作。
- **常见误解：** Prompt injection 与 SQL injection 在技术上并非同一种机制，更强的 System Prompt 也不是完整的防御措施。
- **学习课程：** [Prompt Injection Defense](../phases/14-agent-engineering/27-prompt-injection-defense/)
- **来源：** [OWASP prompt injection guidance](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- **相关术语：** Least Privilege、Sandbox、Approval Gate、Tool Contract

### Prompt Sensitivity
- **类别：** Prompting 与 Context
- **实际含义：** 在预期任务保持不变的情况下，由 Prompt 措辞、顺序、格式或示例变化引起的 Model 输出或测量性能差异。
- **重要性：** 仅在一种方便措辞下取得成功的系统，对真实用户而言可能并不可靠，也可能在 Evaluation 中产生误导。
- **实践中：** 创建语义等价的 Prompt 变体，按案例测量方差，并将这些变体保留在 Regression Test 中，而不是针对单个 Eval Set 优化一个 Prompt。
- **常见误解：** 敏感性并不总是 Prompt 缺陷；它也可能暴露歧义、Model 鲁棒性不足、decode 不稳定或评分规则不充分。
- **相关术语：** Prompt Engineering、Eval Set、Regression Test、Few-Shot
- **来源：** [ProSA](https://aclanthology.org/2024.findings-emnlp.108/)

### Provenance Attestation
- **类别：** 安全与治理
- **实际含义：** 经过身份验证、机器可读的元数据，将一个产物与有关其如何、在何处、何时以及基于哪些输入生成的声明绑定起来。
- **重要性：** 它使自动化政策系统和审查者能够验证供应链声明，而不是信任未经签名的构建说明。
- **实践中：** 在构建系统中生成证明，将其与产物摘要绑定，使用受控身份进行签名，并在发布前完成验证。
- **常见误解：** 签名用于识别证明者并保护完整性；它无法证明证明中的每项声明都是真实的。
- **相关术语：** Data Provenance、Reproducible Build、Audit Log、Verification Gate
- **来源：** [SLSA Software Attestations](https://slsa.dev/spec/v1.2/attestation-model)

### Purpose Limitation
- **类别：** 安全与治理
- **实际含义：** 对于个人数据，只能为指定且明确的目的收集和使用，除非新的用途具备适当的兼容或授权依据。
- **重要性：** 对某个工作流而言可接受的数据，如果被悄然复用于 Model Training、Evaluation、个性化或无关分析，可能会带来隐私和治理风险。
- **实践中：** 随每个 Dataset 记录其用途，在访问前检查新 Pipeline 是否符合该用途，分离不兼容的用途，并在用途发生变化时要求提供有记录的决策。
- **常见误解：** Purpose limitation 约束数据为何被使用。Data minimization 约束该目的实际需要多少数据。
- **相关术语：** Data Minimization、Data Classification、AI Risk Assessment、Audit Log
- **来源：** [General Data Protection Regulation, Article 5(1)(b)](https://eur-lex.europa.eu/eli/reg/2016/679/oj)

## Q

### QLoRA
- **类别：** 数学与 Training
- **人们常说：** 在 Quantization 基础 Model 上使用 LoRA。
- **实际含义：** 一种参数高效的 Fine-tuning 方法，将预训练基础 Model 以低比特 Quantization 表示保持冻结，同时在需要的位置使用更高精度的计算来 Training LoRA adapter。
- **重要性：** 它可以减少适配大型 Model 所需的内存，但节省程度和质量取决于 Model、rank、Optimizer、序列长度、硬件和实现。
- **常见误解：** QLoRA 并不保证特定的内存占用，也不保证与完整 Fine-tuning 之间存在固定的质量差距。
- **学习课程：** [Fine-Tuning and LoRA](../phases/11-llm-engineering/08-fine-tuning-lora/)
- **来源：** [QLoRA paper](https://arxiv.org/abs/2305.14314)
- **相关术语：** LoRA (Low-Rank Adaptation)、Quantization、Fine-tuning

### Quantization
- **类别：** Model 与 Inference
- **人们常说：** 用更少的比特存储或计算 Model 数值。
- **实际含义：** 使用较低精度的格式表示权重、activation 或缓存，以减少内存、带宽或计算成本。不同方法在校准、粒度、数据类型以及转换发生在 Training 之前、期间还是之后等方面有所不同。
- **常见误解：** 从一种标称位宽改为另一种标称位宽，并不能保证端到端内存或速度按相同比例变化，因为元数据、kernel、缓存和硬件支持同样会产生影响。
- **相关术语：** QLoRA、Mixed Precision、Parameter

## R

### RAG (Retrieval-Augmented Generation)
- **类别：** 检索与生成
- **人们常说：** Model 使用检索到的知识回答问题。
- **实际含义：** 一种系统模式，在回答或行动之前检索与请求相关的证据，并将选定内容提供给生成式 Model。检索可以使用词法、Vector、结构化或混合方法。
- **重要性：** RAG 可以在不将当前或私有证据编码进 Model 权重的情况下使用这些证据，但检索和 grounding 必须分别进行 Evaluation。
- **名称由来：** Retrieval 查找证据，augmentation 将选定证据添加到 Context，generation 生成响应。
- **学习课程：** [Retrieval-Augmented Generation](../phases/11-llm-engineering/06-rag/)
- **来源：** [Retrieval-Augmented Generation paper](https://arxiv.org/abs/2005.11401)
- **相关术语：** Grounding、Hybrid Retrieval、Reranker、Hallucination

### Rate Limit
- **类别：** AI-native 开发
- **实际含义：** 一种政策，用于限制在规定时间或容量窗口内的请求数、Token 数、并发工作量或其他资源。
- **重要性：** 它可以保护提供商和你自己的系统，避免过载、失控支出和不公平的资源使用。
- **实践中：** 对每个租户实施 Token 和并发限制，读取提供商的重试元数据，并以可预测的方式排队或拒绝超额工作。
- **常见误解：** rate limit 控制允许的使用量。Backpressure 则在系统中传播下游容量约束。
- **相关术语：** Backpressure、Retry with Backoff、Circuit Breaker

### ReAct
- **类别：** Agent 与 Tool
- **实际含义：** 一种 Agent 模式，在决定下一步之前，交替进行任务推理、具体行动以及由环境返回的观察结果。
- **重要性：** 环境反馈可以纠正假设，并为后续决策提供依据，从而避免迫使 Model 仅依靠内部生成一次性完成整个任务。
- **实践中：** 提供一小组带类型的 Tool，返回简洁的观察结果，限制循环次数，并验证最终产物，而不是存储私有推理轨迹。
- **常见误解：** ReAct 是一种 Prompting 和控制模式，并不保证自主性、正确性或安全使用 Tool。
- **相关术语：** Agent、Function Calling、Planning、Grounding
- **来源：** [ReAct](https://arxiv.org/abs/2210.03629)

### Readiness Probe
- **类别：** 可靠性与运维
- **实际含义：** 一项诊断，用于告知流量路由层某个服务实例当前是否能够接收请求。
- **重要性：** 进程可能仍在运行，但其 Model 尚未加载、依赖项不可用或预热尚未完成，因此过早发送流量会造成可避免的故障。
- **实践中：** 检查提供服务所需的最低限度依赖项，在启动和排空期间让 readiness 检查失败，保持 probe 成本低廉，并且不要仅因为 readiness 为 false 就重启进程。
- **常见误解：** Readiness 控制是否有资格接收流量。Liveness 决定是否应重启进程，二者都不能证明每个 Model 响应都会正确。
- **学习课程：** [Production LLM Application](../phases/11-llm-engineering/13-production-app/)
- **相关术语：** Autoscaling、Model Serving、Availability、Graceful Degradation
- **来源：** [Kubernetes Liveness, Readiness, and Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)

### Recall@K
- **类别：** 检索与生成
- **实际含义：** 对于单个 query，Recall@K 为 `|top k 中的相关项| / |相关项|`。dataset 分数按照明确的规则聚合这些逐 query 的值。
- **重要性：** 它能说明检索阶段是否为下游生成或重排序提供了足够多的相关候选项。
- **实践中：** 定义相关性判断、k、聚合方法，以及针对没有已判断相关项的查询所采用的策略，然后检查召回证据为零的查询。
- **常见误解：** Recall@K 较高并不意味着首个结果质量良好、排序合理或最终答案有事实依据。对于没有相关项的查询，由于分母为零，需要明确规定排除策略或赋值策略。
- **相关术语：** Precision & Recall、Eval Set、Reranker、Approximate Nearest Neighbor (ANN)
- **来源：** [BEIR](https://openreview.net/forum?id=wCu6T5xFjeJ)

### Reciprocal Rank Fusion (RRF)
- **类别：** 检索与生成
- **实际含义：** 一种排名融合方法，通过将每个结果列表中随项目排名降低而递减的贡献值相加，合并多个结果列表。
- **重要性：** 它可以合并词法、稠密或多查询排名，而无需假设它们的原始分数使用相同尺度。
- **实践中：** 检索相互独立的候选列表，依据稳定的文档标识去重，应用一个有版本控制的融合常数，并与每个单独的检索器进行评估比较。
- **常见误解：** RRF 合并的是排名，而不是 Embedding 或相关性分数；它也无法找回所有输入列表中都不存在的项目。
- **相关术语：** Hybrid Retrieval、BM25、Dense Retrieval、Reranker
- **来源：** [Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods](https://dl.acm.org/doi/10.1145/1571941.1572114)

### Red Teaming
- **类别：** 安全与治理
- **实际含义：** 一种结构化的对抗性测试过程，由获得授权的测试人员依据已记录的目标、威胁假设、案例和证据来寻找故障。
- **重要性：** 常规质量测试很少探索系统在操纵、滥用、目标冲突或蓄意绕过控制措施时的行为。
- **实践中：** 根据 Threat Model 推导攻击，在隔离环境中运行攻击，记录可复现案例，按层修复，并将已确认的故障转化为回归 Eval。
- **常见误解：** 一组越狱 Prompt 并不构成完整的红队计划，而且红队测试无法证明不存在未知故障。
- **相关术语：** Threat Model、Guardrails、Prompt Injection、Eval Set
- **来源：** [Red Teaming Language Models with Language Models](https://arxiv.org/abs/2202.03286)

### Regression Test
- **类别：** AI-native 开发
- **实际含义：** 一种可重复执行的检查，用于保护已知正常工作的行为，尤其是在代码、Prompt、Model、检索或 Tool 发生变更之后。
- **重要性：** AI 系统变更可能在提高平均质量的同时，悄然重新引入先前已修复的故障。
- **实践中：** 将一次已修复的 Prompt Injection 事件转化为永久 Eval 案例，并要求它在下一次部署前必须通过。
- **常见误解：** 回归测试保护某项特定的预期行为。综合 Benchmark 则用于估算更广泛任务分布上的性能。
- **学习课程：** [Eval-Driven Agent Development](../phases/14-agent-engineering/30-eval-driven-agent-development/)
- **相关术语：** Eval Set、Verification Gate、Patch、Evaluation (Eval)

### ReLU
- **类别：** 数学与 Training
- **人们常说：** 一种简单的激活函数。
- **实际含义：** Rectified Linear Unit，定义为 `f(x) = max(0, x)`。它计算成本低，并具有非饱和的正值分支，但负输入上的零 Gradient 可能产生非活跃单元。
- **相关术语：** Activation Function、Gradient、CNN (Convolutional Neural Network)

### Repository Instructions
- **类别：** AI-native 开发
- **实际含义：** 受版本控制的指导说明，用于告知编码 Agent 仓库的组织方式、适用的命令和约定、需要遵守的边界，以及验证工作的方式。
- **重要性：** 它将反复依赖的团队隐性知识转化为随代码一起流转的本地 Context，并且可以因子项目而异。
- **实践中：** 在仓库根目录保留一个 `AGENTS.md`，为子目录添加范围更窄的文件，并包含准确的构建、测试、生成文件、安全和贡献规则。
- **常见误解：** 仓库说明是源代码和人工编写文档的补充；它们不会覆盖用户当前的请求，也不能保证 Agent 正确遵循这些说明。
- **相关术语：** Repository Map、Scope Contract、Coding Agent、Progressive Disclosure
- **来源：** [AGENTS.md specification](https://agents.md/)

### Repository Map
- **类别：** AI-native 开发
- **实际含义：** 一份简洁且持续维护的说明，描述仓库的重要目录、所有权边界、入口点、构建命令、测试、生成文件和本地说明。
- **重要性：** 它能帮助编码 Agent 在加载大型文件或错误编辑子系统之前找到正确的证据。
- **实践中：** 根据目录树和 manifest 生成索引，再补充有关模块边界和验证命令的权威说明。
- **常见误解：** 原始文件树只展示名称。Repository Map 则说明哪些路径重要，以及它们与任务之间的关系。
- **学习课程：** [Repository Memory and State](../phases/14-agent-engineering/34-repo-memory-and-state/)
- **相关术语：** Coding Agent、Progressive Disclosure、Scope Contract、Context Engineering

### Reproducible Build
- **类别：** AI-native 开发
- **实际含义：** 一种构建过程，其声明的源代码、环境和指令可由独立方重新运行，并生成逐位完全相同的指定产物。
- **重要性：** 它使产物可以在最初生成它的机器或 Agent 之外得到验证，并暴露隐藏的构建输入。
- **实践中：** 固定工具链和依赖版本，移除时间戳和不稳定的排序，捕获环境信息，然后比较独立重建产物的摘要值。
- **常见误解：** 一次构建连续成功两次只能提供可重复执行的证据；可复现性还要求具备声明的独立条件和完全相同的输出。
- **相关术语：** Repository Instructions、Verification Gate、Provenance Attestation、Software Bill of Materials (SBOM)
- **来源：** [Reproducible Builds definition](https://reproducible-builds.org/docs/definition/)

### Reranker
- **类别：** 检索与生成
- **实际含义：** 一种第二阶段 Model 或评分函数，通过对查询与每个候选项进行更丰富的比较，对较小的候选集重新排序。
- **重要性：** 快速的第一阶段检索会最大化候选覆盖范围，而重排序可以改善哪些证据能够进入有限的 Context Window。
- **实践中：** 使用混合搜索检索 50 个候选项，通过 cross-encoder 为每个查询与文档对评分，并将排名前 5 的有依据分块传递给生成阶段。
- **常见误解：** Reranker 不会搜索整个语料库。它只会对检索阶段已经找到的候选项重新排序。
- **相关术语：** Hybrid Retrieval、Semantic Search、RAG (Retrieval-Augmented Generation)

### Retry Budget
- **类别：** 可靠性与运维
- **实际含义：** 对重试流量设置的上限，通常以其相对于原始请求的比例或某个时间窗口内的数量表示，用于防止重试消耗无限容量。
- **重要性：** 当依赖项变慢或发生故障时，不受限制的重试会在系统剩余容量最少的时候成倍增加负载。
- **实践中：** 将重试与首次尝试分开计数，按服务和租户设置上限，遵守截止时间，使用带 jitter 的 backoff，并停止重试非暂时性故障或非幂等操作的故障。
- **常见误解：** Retry Budget 限制额外尝试次数。Error Budget 衡量 SLO 所允许的用户可感知不可靠程度。
- **相关术语：** Retry with Backoff、Error Budget、Rate Limit、Admission Control
- **来源：** [Google SRE: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

### Retry with Backoff
- **类别：** AI-native 开发
- **实际含义：** 在逐渐延长的延迟后重复执行失败的暂时性操作，通常会加入随机 jitter，并设置严格的重试次数上限。
- **重要性：** 立即进行同步重试可能加剧故障、消耗 Rate Limit，并导致副作用重复发生。
- **实践中：** 在有界的指数延迟后重试供应商超时，遵守服务器提供的重试指导，并为所有写入操作复用同一个幂等键。
- **常见误解：** 不要重试永久性的验证错误或权限错误，也不要在没有防重复策略的情况下重试非幂等操作。
- **相关术语：** Idempotency、Rate Limit、Circuit Breaker、Backpressure

### Reviewer Agent
- **类别：** AI-native 开发
- **实际含义：** 一个被指派依据明确标准检查另一个 Agent 的产物或决策，并返回发现或结论的 Agent。
- **重要性：** 角色分离可以发现遗漏，但只有当审查者获得独立证据和具体评分标准时才有帮助。
- **实践中：** 在一个 Agent 生成 Patch 后，将 diff、Scope Contract、仓库规则和测试输出交给单独的审查者，然后要求其提供具体到行的发现。
- **常见误解：** 第二次调用 Model 并不会自动具有独立性或正确性。共享 Context、Model 偏差和模糊标准可能导致同一错误再次出现。
- **学习课程：** [Reviewer Agent](../phases/14-agent-engineering/39-reviewer-agent/)
- **相关术语：** Coding Agent、Verification Gate、Scope Contract、LLM-as-a-Judge

### RLHF (Reinforcement Learning from Human Feedback)
- **类别：** 数学与 Training
- **人们常说：** 根据人类偏好 Training Model。
- **实际含义：** 一类使用人类反馈来学习奖励或偏好信号，并依据该信号优化 Model 策略的 Pipeline。具体实现各不相同，不一定都使用相同的 Reinforcement Learning 算法。
- **常见误解：** RLHF 优化的是从收集到的反馈中学得的代理目标。它不能保证与每个用户或每种情境实现广泛对齐。
- **学习课程：** [Reinforcement Learning from Human Feedback](../phases/10-llms-from-scratch/07-rlhf/)
- **来源：** [InstructGPT paper](https://arxiv.org/abs/2203.02155)
- **相关术语：** DPO (Direct Preference Optimization)、SFT (Supervised Fine-Tuning)、Alignment

### Rollback
- **类别：** 可靠性与运维
- **实际含义：** 当当前发布版本违反运维、质量或安全标准时，恢复到先前已知的部署版本或配置。
- **重要性：** Agent 和 Model 变更即使经过部署前 Evaluation，也可能在生产环境中失败，因此必须在发布前设计恢复方案。
- **实践中：** 保留受版本控制的产物和配置，定义回滚触发条件，演练命令及其数据影响，并在恢复后验证服务健康状态。
- **常见误解：** 代码回滚不会自动撤销数据库迁移、外部副作用、缓存输出或错误版本写入的数据。
- **相关术语：** Canary Release、Checkpoint、Regression Test、Durable Execution
- **来源：** [Kubernetes Deployments: Rolling Back](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment)

### ROUGE
- **类别：** Evaluation 与安全
- **人们常说：** 一种常用于摘要的参考文本重叠度量。
- **实际含义：** 一类通过 n-gram 重叠或最长公共子序列等单位，将生成文本与参考文本进行比较的度量。
- **常见误解：** 表层重叠可能无法识别语义等价性，也可能奖励照搬措辞，却不能证明事实质量。
- **相关术语：** Evaluation (Eval)、Precision & Recall、LLM-as-a-Judge

## S

### Sandbox
- **类别：** Agent 与 Tool
- **实际含义：** 一种隔离的执行环境，用于限制 Agent 对文件、进程、网络目标、凭据和主机资源的访问。
- **重要性：** 生成的代码和 Tool 调用可能有误或具有恶意。隔离可以限制其影响范围，并使一次性验证切实可行。
- **实践中：** 在临时容器中运行测试，使用只读基础层、限定范围的可写工作区、不包含生产环境密钥，并设置明确的网络 allowlist。
- **常见误解：** Sandbox 可以降低影响，但不能证明其中的代码正确或无害。
- **学习课程：** [Production Agent Runtimes](../phases/14-agent-engineering/29-production-runtimes/)
- **相关术语：** Least Privilege、Approval Gate、Coding Agent、Guardrails

### Saturation
- **类别：** 可靠性与运维
- **实际含义：** 受限资源或服务的容量耗尽程度，包括无法及时开始处理的排队工作。
- **重要性：** 即使利用率看起来可以接受，内存、加速器槽位、队列深度或下游配额也可能已经在限制有效吞吐量。
- **实践中：** 识别每项关键资源，测量正在处理和等待处理的工作，将饱和度与尾延迟和错误关联起来，并在队列进入不稳定增长状态前发出告警。
- **常见误解：** 饱和度并不是一个通用百分比。限制性资源及其排队行为取决于工作负载和架构。
- **相关术语：** Observability、Autoscaling、Backpressure、Tail Latency
- **来源：** [Google SRE: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

### Scope Contract
- **类别：** AI-native 开发
- **实际含义：** 一项具体约定，用于定义任务目标、允许和禁止触及的范围、预期产物、验证要求和停止条件。
- **重要性：** 它可以防止 Agent 将狭窄的修复扩大为无法审查的重构，或在没有证据的情况下声称任务已完成。
- **实践中：** 明确规定只能修改 parser 模块及其测试，公共 API 必须保持兼容，并且指定的测试套件必须通过。
- **常见误解：** 任务描述说明你想要什么。Scope Contract 还会定义边界和证明要求。
- **学习课程：** [Scope Contracts](../phases/14-agent-engineering/36-scope-contracts/)
- **相关术语：** Coding Agent、Patch、Verification Gate、Handoff

### Self-Attention
- **类别：** Model 与 Inference
- **人们常说：** Token 决定哪些其他 Token 重要。
- **实际含义：** 一种 Attention，其中 query、key 和 value 均来自同一序列表示。经过缩放的相似度分数会被归一化并用于组合 value，同时受到因果、padding、局部或其他 mask 的约束。
- **重要性：** 它会构建对 Context 敏感的 Token 表示，但允许采用的 Attention 模式取决于架构。
- **常见误解：** 并非每个 Token 都总能关注其他所有 Token。因果 Model 和稀疏 Model 会有意限制连接。
- **学习课程：** [Self-Attention from Scratch](../phases/07-transformers-deep-dive/02-self-attention-from-scratch/)
- **相关术语：** Attention、Transformer、Context Window

### Semantic Cache
- **类别：** AI-native 开发
- **实际含义：** 一种缓存机制，当新请求在选定表示和阈值下被判断为足够相似时，会复用先前的结果。
- **重要性：** 它可以降低重复意图的延迟和成本，但错误匹配可能返回过时或不适合当前用户的输出。
- **实践中：** 根据归一化意图缓存低风险 FAQ 答案，在 key 中包含租户和策略版本，并对个性化请求或时间敏感请求绕过缓存。
- **常见误解：** 语义相似并不能保证两个请求具有相同的正确答案。Semantic Cache 会复用先前结果，而 prefix caching 会复用精确 Token 的 KV 状态，prompt caching 则遵循供应商或应用的适用规则。
- **相关术语：** Prompt Cache、Embedding、Cost per Successful Task、Grounding

### Semantic Search
- **类别：** 检索与生成
- **人们常说：** 按含义搜索，而不是按精确词语搜索。
- **实际含义：** 一种检索方法，在 Embedding 空间中表示查询和候选项，并使用 Vector 相似度函数对候选项进行排名。
- **重要性：** 它可以检索释义和概念相关的文本，但精确标识符和罕见字符串可能仍需使用词法搜索。
- **相关术语：** Embedding、Hybrid Retrieval、Vector Database、Reranker

### Separation of Duties
- **类别：** 安全与治理
- **实际含义：** 将相互冲突的职责或权限分配给独立角色，使单个主体无法在没有另一个授权决策的情况下完成高风险操作。
- **重要性：** 遭入侵的账户或犯错的 Agent 不应能够独自提议、批准、执行并掩盖同一项重大变更。
- **实践中：** 将产物创建与发布审批分离，使用不同身份，在 Audit Log 中保留双方的决策，并定义需接受事后审查的紧急访问机制。
- **常见误解：** Separation of Duties 关注的是相互冲突的权限，而不只是将工作分配给共享同一凭据的多个人或 Agent。
- **相关术语：** Approval Gate、Reviewer Agent、Audit Log、Least Privilege
- **来源：** [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)

### Service Level Indicator (SLI)
- **类别：** 可靠性与运维
- **实际含义：** 在已定义且与用户相关的边界上，对服务行为进行量化衡量，例如请求成功率或低于某个阈值的延迟比例。
- **重要性：** 只有明确观测行为、纳入统计的事件以及测量点，可靠性讨论才能转化为可执行行动。
- **实践中：** 定义 numerator、denominator、排除项、数据源和聚合窗口，然后验证该指标是否能追踪用户实际体验到的结果。
- **常见误解：** SLI 是度量值。SLO 是在定义的时间段内应用于该度量值的目标。
- **相关术语：** Service Level Objective (SLO)、Availability、Tail Latency、Observability
- **来源：** [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

### Service Level Objective (SLO)
- **类别：** 可靠性与运维
- **实际含义：** 针对指定总体和测量窗口内的 Service Level Indicator 所设定的目标范围或阈值。
- **重要原因：** 它将预期的用户结果转化为监控、容量、发布风险和事故决策的运行边界。
- **实践中：** 选择用户关心的指标，根据产品需求而非当前性能设定目标，定义窗口和排除项，并关联 Error Budget 策略。
- **常见误解：** SLO 是内部可靠性目标。合同性质的 Service Level Agreement 可以包含补救措施，也可能使用不同的定义。
- **学习课程：** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **相关术语：** Service Level Indicator (SLI)、Error Budget、Availability、Goodput
- **来源：** [Google SRE: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)

### SFT (Supervised Fine-Tuning)
- **类别：** 数学与 Training
- **人们常说：** 使用示例输入和期望输出来进行 Training。
- **实际含义：** 使用配对的输入和期望响应对预训练 Model 进行 Fine-tuning，使其学习 Training Distribution 下所演示的行为。
- **常见误解：** SFT 可以适配聊天之外的多种行为，而示例质量决定了哪些行为会得到强化。
- **相关术语：** Fine-tuning、DPO (Direct Preference Optimization)、RLHF (Reinforcement Learning from Human Feedback)

### Shadow Traffic
- **类别：** 可靠性与运维
- **实际含义：** 将实时请求流量的副本发送到候选系统以供观察，同时候选响应不会进入主要用户响应路径。由于复制的请求仍会执行，因此必须隔离其副作用。
- **重要原因：** 它让候选系统接触真实的输入形态和负载，同时限制对用户的影响，从而发现合成测试中未出现的故障。
- **实践中：** 移除敏感字段或将其 Tokenize，将 Tool 和依赖项路由到沙箱化或 no-op 目标，在能力边界阻止写入，保留请求关联关系，并防止影子负载与用户流量争抢资源。
- **常见误解：** 不让候选响应进入主要路径，并不意味着执行没有副作用。Canary Release 与此不同，因为它会针对受控比例的流量，由候选系统为真实用户提供服务。
- **学习课程：** [Shadow, Canary, and Progressive Delivery](../phases/17-infrastructure-and-production/20-shadow-canary-progressive/)
- **相关术语：** Canary Release、Evaluation (Eval)、Trace、Model Serving
- **来源：** [Istio Traffic Mirroring](https://istio.io/latest/docs/tasks/traffic-management/mirroring/)

### Shared Embedding Space
- **类别：** Multimodal 系统
- **实际含义：** 一个公共 Vector 空间，其中来自不同模态的表征可以使用相同的相似度函数进行比较。
- **重要原因：** 它支持跨模态检索和匹配，例如根据文本查找图像，而无需两个项目共享原始表征。
- **实践中：** 有意识地使用配对和非配对负样本进行 Training，在目标需要时对 Vector 进行归一化，评估两个检索方向，并检查子群体和语言表现。
- **常见误解：** 共享 Vector 维度并不会创建共享语义空间。Training 目标和数据必须建立跨模态可比性。
- **学习课程：** [CLIP Contrastive Pretraining](../phases/12-multimodal-ai/02-clip-contrastive-pretraining/)
- **相关术语：** Embedding、Cosine Similarity、Modality Alignment、Semantic Search
- **来源：** [Learning Transferable Visual Models From Natural Language Supervision](https://proceedings.mlr.press/v139/radford21a.html)

### Skill Bundle
- **类别：** Agent 与 Tool
- **实际含义：** 完整的可安装 Skill 目录，包括 `SKILL.md`，以及工作流所需的每个参考资料、脚本、资产、fixture 或配套文件。
- **重要原因：** 仅复制入口文件可能会留下看似有效、却指向缺失资源的说明，或丢失工作流所依赖的确定性代码。
- **实践中：** 将整个目录树作为一个单元安装，记录 hash 和源修订版本，验证已安装的副本，并在替换现有 bundle 前显示冲突。
- **常见误解：** `SKILL.md` 是入口点，不一定是完整产物。
- **学习课程：** [Skill Evals, Packaging, and Portability](../phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/)
- **相关术语：** Agent Skill、Skill Catalog、Reproducible Build、Provenance Attestation
- **来源：** [Agent Skills specification](https://agentskills.io/specification)

### Skill Catalog
- **类别：** Agent 与 Tool
- **实际含义：** Model 可见的紧凑型合格 Skill 清单，通常包含名称、描述和内部源标识符等路由元数据，而不是每个 Skill 的完整正文。
- **重要原因：** Catalog 让 Agent 无需将所有已安装包加载到工作 Context 中，即可发现相关流程。
- **实践中：** 首先验证软件包，应用明确的重名策略，测量序列化 Catalog 的预算，并保留关于被缩短、省略或遮蔽条目的诊断信息。
- **常见误解：** Catalog 条目意味着该 Skill 可被发现。这并不意味着其正文已激活，也不意味着其 Tool 已获授权。
- **学习课程：** [Skill Discovery and Progressive Disclosure](../phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/)
- **相关术语：** Skill Discovery、Skill Invocation、Progressive Disclosure、Token Budget
- **来源：** [Agent Skills specification](https://agentskills.io/specification)

### Skill Discovery
- **类别：** Agent 与 Tool
- **实际含义：** 一个运行时 Pipeline，它搜索已配置的根目录、识别候选 Skill 目录、验证其软件包契约、关联作用域与 provenance、解决冲突，并发布合格的 Catalog 条目。
- **重要原因：** 确定性的发现过程使缺失、格式错误、被遮蔽和不安全的软件包能够在 Model 路由开始前得到诊断。
- **实践中：** 声明搜索作用域和重复项处理方式，决定如何处理 symlink，拒绝资源越界，并记录每个候选项被接受或拒绝的原因。
- **常见误解：** Skill Discovery 并不是对名为 `SKILL.md` 的文件进行不受限制的递归搜索；安装位置和优先级属于运行时策略。
- **学习课程：** [Skill Discovery and Progressive Disclosure](../phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure/)
- **相关术语：** Skill Catalog、Skill Bundle、Progressive Disclosure、Trust Boundary
- **来源：** [Agent Skills client implementation guide](https://agentskills.io/client-implementation/adding-skills-support)

### Skill Invocation
- **类别：** Agent 与 Tool
- **实际含义：** 一个由运行时介导的过程，其中符合条件的人类、Model、应用程序或其他 Skill 选择某个 Skill，并使其说明进入工作 Context。
- **重要原因：** 显式用户访问、隐式 Model 路由、激活、参数绑定、Tool 权限和执行是彼此独立的决策，各自具有不同的故障模式。
- **实践中：** 定义参与者策略，使用正向请求和近似但不匹配的请求评估描述，记录所选软件包的身份，并将特定于宿主的调用字段保留在经过测试的 adapter 中。
- **常见误解：** Invocation 会激活说明。它不会自动执行命令，也不会绕过审批和 sandbox 策略。
- **学习课程：** [Skill Invocation and Routing](../phases/13-tools-and-protocols/25-skill-invocation-and-routing/)
- **相关术语：** Agent Skill、Skill Catalog、Approval Gate、Sandbox
- **来源：** [Evaluating Agent Skills](https://agentskills.io/skill-creation/evaluating-skills)

### Softmax
- **类别：** 数学与 Training
- **人们常说：** 一个将 logits 转换为归一化正值的函数。
- **实际含义：** 由 `softmax(x_i) = exp(x_i) / sum(exp(x_j))` 定义并采用数值稳定化实现的函数。它的输出均为正数且总和为 1，因此可用于参数化 categorical distribution。
- **常见误解：** Softmax 值不会自动成为关于现实世界正确性的校准 Probability。
- **相关术语：** Temperature、Cross-Entropy、Attention

### Software Bill of Materials (SBOM)
- **类别：** 安全与治理
- **别名：** SBOM
- **实际含义：** 与产品或产物相关的软件组件及其关系的结构化清单，通常包括版本、供应商、许可证和标识符。
- **重要原因：** 当软件发生变化或出现漏洞时，你需要组件清单来评估受影响的依赖项、许可证义务和供应链风险敞口。
- **实践中：** 在可信构建期间生成 SBOM，将其绑定到发布产物，在策略检查中验证它，并在依赖项或打包方式发生变化时进行更新。
- **常见误解：** SBOM 是清单，并不能证明组件安全、许可证使用正确或实际存在，除非其生成过程和 provenance 值得信任。
- **相关术语：** Provenance Attestation、Reproducible Build、Data Provenance、Audit Log
- **来源：** [SPDX 3.0.1 specification](https://spdx.github.io/spdx-spec/v3.0/)

### Speculative Decoding
- **类别：** Model 与 Inference
- **实际含义：** 一种 Inference 方法，其中成本较低的 draft 过程提出多个 Token，目标 Model 并行对这些 draft 位置进行评分。在精确采样变体中，接受和校正规则会保持目标 Model 的输出 Probability Distribution。
- **重要原因：** 当 draft 被接受时，它可以减少目标 Model 的串行解码工作，而且无需更改目标 Model 经过 Training 的权重。
- **实践中：** 在真实 Prompt 上测量接受率和端到端延迟，计入 draft Model 的开销，并验证实现是否保持预期的解码分布。
- **常见误解：** Speculative decoding 不是普通的 Model 路由或未经验证的自动补全。精确变体通过接受和校正保持目标分布，而近似变体可能以放弃这一保证来换取速度。
- **相关术语：** Autoregressive、KV Cache、Decoding Strategy、Tokens per Second (TPS)
- **来源：** [Fast Inference from Transformers via Speculative Decoding](https://proceedings.mlr.press/v202/leviathan23a.html)

### Stateless MCP
- **类别：** Agent 与 Tool
- **实际含义：** MCP 2026-07-28 请求模型，其中每个请求都在 `params._meta` 中携带协议版本和客户端能力，而结果则携带显式的 `resultType`；协议状态不再以初始化握手、连接或 `Mcp-Session-Id` 为键。
- **重要原因：** 任何 worker 都可以根据请求内容和授权 Context 验证并处理请求，这避免了隐藏的连接亲和性，也让水平路由更容易推理。
- **实践方式：** 实现 `server/discover`，在每次调用时重建 request metadata，根据 JSON-RPC body 验证 transport header，并在需要保持连续性时将服务器生成的 application handle 作为普通 tool argument 传递。
- **常见误解：** Stateless MCP 移除的是协议 session，而不是应用状态、传输连接、流式响应、任务或显式 handle。
- **学习课程：** [MCP Fundamentals](../phases/13-tools-and-protocols/06-mcp-fundamentals/)
- **相关术语：** MCP (Model Context Protocol)、Multi Round-Trip Request (MRTR)、Tool Contract、Idempotency
- **来源：** [MCP 2026-07-28 key changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog); [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)

### Stochastic Gradient Descent (SGD)
- **类别：** 数学与 Training
- **别名：** SGD
- **实际含义：** 一类 Optimizer，它根据从抽样样本或 minibatch 估计得到的 Gradient 更新参数，而不是使用完整的 Training Dataset。
- **重要原因：** 它是理解 Gradient 噪声、momentum、Batch 缩放以及现代 Training 中所用自适应 Optimizer 的基础。
- **实践中：** 记录 Batch 抽样、Learning Rate、使用时的 momentum 和调度策略，然后在相同更新预算或 Token 预算下比较验证表现。
- **常见误解：** 在当前实践中，SGD 通常指 minibatch SGD，而其有效的 Learning Rate 并不遵循某种通用的 Batch 缩放规则。
- **相关术语：** Gradient Descent、Batch Size、Learning Rate、Optimizer
- **来源：** [Optimization Methods for Large-Scale Machine Learning](https://arxiv.org/abs/1606.04838); [Accurate, Large Minibatch SGD](https://arxiv.org/abs/1706.02677)

### Stop Sequence
- **类别：** Model 与 Inference
- **实际含义：** 由应用程序指定的 Token 或文本模式，当解码系统遇到它时会停止生成。
- **重要原因：** Stop sequence 可以限定输出协议和多部分生成，而无需等待 Model 从语义上判断自己已经完成。
- **实践中：** 选择无歧义的分隔符，测试 Tokenization 和部分流式匹配，并且仍要强制执行输出长度和 schema 验证。
- **常见误解：** Stop sequence 是机械式解码条件，并不能证明答案完整或 Agent 目标已经达成。
- **相关术语：** Decoding Strategy、Structured Output、Token、Termination Condition
- **来源：** [Transformers text-generation documentation](https://huggingface.co/docs/transformers/main/en/main_classes/text_generation)

### Streaming
- **类别：** Model 与 Inference
- **人们常说：** 在生成过程中显示输出。
- **实际含义：** 在完整结果准备好之前，增量交付响应事件。根据 API 的不同，一个 stream 可能包含 Token 文本、结构化 delta、Tool 调用参数、用量元数据或状态事件。
- **重要原因：** 它改善了感知响应速度，但不会缩短 Model 生成完整答案的实际时间。
- **常见误解：** 网络传输、事件形态和 chunk 边界取决于提供商，并不保证与单词或 Token 对齐。
- **学习课程：** [Production LLM Application](../phases/11-llm-engineering/13-production-app/)
- **相关术语：** Time to First Token (TTFT)、Autoregressive、Observability

### Structured Output
- **类别：** Agent 与 Tool
- **实际含义：** 根据机器可读 schema 约束或验证 Model 输出，使应用程序代码无需解析自由形式的文本即可使用其中的字段。
- **重要原因：** 它减少了 Model 到软件边界处的格式歧义，并支持字段级验证和重试。
- **实践中：** 要求事故分类结果包含允许的严重性 enum、证据数组和可为 null 的升级原因，然后拒绝任何未通过 schema 的响应。
- **常见误解：** 符合 schema 的输出仍可能包含错误值。结构并不等同于事实验证。
- **学习课程：** [Structured Outputs](../phases/11-llm-engineering/03-structured-outputs/)
- **相关术语：** Function Calling、Tool Contract、Verification Gate

### Swarm
- **类别：** Agent 与 Tool
- **人们常说：** 多个 Agent 在没有固定控制器的情况下协作。
- **实际含义：** 一种松散协调的 multi-agent 模式，其中局部 Agent 决策和消息交换会产生系统级行为。该术语的使用并不一致，因此必须明确实际的拓扑、状态所有权和终止规则。
- **常见误解：** 多个具有不同名称的 Agent 并不能保证有效的专业分工或涌现式协调。
- **相关术语：** Agent、Reviewer Agent、Handoff、Agent State

### System Prompt
- **类别：** Prompting 与 Context
- **人们常说：** 由开发者控制的 Model 交互指令。
- **实际含义：** 由提供商定义、并由应用程序提供的指令消息或配置，用于在该提供商的指令层级中确立行为和约束。
- **重要原因：** System instructions 可以引导行为，但不能保证始终保密，也不应被视为安全边界。
- **常见误解：** 不同 API 的优先级规则、消息角色、持久性和可见性各不相同。请检查当前提供商契约。
- **学习课程：** [Instructions as Executable Constraints](../phases/14-agent-engineering/33-instructions-as-executable-constraints/)
- **相关术语：** Prompt Engineering、Prompt Injection、Context Engineering、Guardrails

## T

### Tail Latency
- **类别：** 可靠性与运维
- **实际含义：** 最慢部分请求所经历的延迟，通常使用指定工作负载和时间窗口下的高 percentile 进行概括。
- **重要原因：** 平均值可能看起来很正常，但一大群用户可能会因为排队、资源争用、重试或请求成本差异而等待更长时间。
- **实践中：** 按路由和工作负载报告多个 percentile，根据文档化规则将 timeout 保留为截尾观测或失败观测，并跨依赖项追踪慢请求。
- **常见误解：** Tail latency 不是单个最慢请求，而且脱离 percentile、总体和测量边界便没有意义。
- **学习课程：** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **相关术语：** Time to First Token (TTFT)、Time per Output Token (TPOT)、Saturation、Goodput
- **来源：** [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/)

### Temperature
- **类别：** Model 与 Inference
- **人们常说：** 一个创造力设置。
- **实际含义：** 一个解码参数，在形成 Probability Distribution 之前重新缩放 logits。较高的正值通常会使分布更平坦；较低的正值则会使分布更尖锐。
- **重要原因：** Temperature 改变的是采样行为，而不是 Model 的知识或事实准确性。
- **常见误解：** 零值设置通常实现为 greedy decoding，但确切行为和确定性取决于提供商、sampler、seed 支持和服务系统。
- **相关术语：** Softmax、Autoregressive、Token

### Tensor
- **类别：** 数据与表征
- **人们常说：** 用于数值计算的多维数组。
- **实际含义：** 一种具有 shape、data type 和 device placement 的类型化数组，框架用它来表示输入、参数、activation 和 Gradient。Automatic Differentiation 元数据取决于框架和操作，并非每个 Tensor 的固有属性。
- **相关术语：** Autograd、Parameter、Mixed Precision

### Tensor Parallelism
- **类别：** 基础设施与 Serving
- **实际含义：** 将 Model 层内的 Tensor 操作拆分到多个设备上，并在该层计算过程中通过 collective communication 合并部分结果。
- **为什么重要:** 它让一个层能够使用多个设备的内存和计算资源，但当互连或分区方式不合适时，频繁通信可能成为主要开销。
- **实践中:** 让分区维度与 Model 形状匹配，对集合通信流量进行基准测试，将各 Rank 保持在高速互连上，并随 Checkpoint 和服务配置一起记录分片布局。
- **常见误解:** Tensor Parallelism 拆分层内部的工作。Pipeline Parallelism 将不同的层组放置在不同设备上。
- **学习课程：** [Scaling and Distributed Training](../phases/10-llms-from-scratch/05-scaling-distributed/)
- **相关术语:** Tensor, Pipeline Parallelism, Expert Parallelism, Parameter
- **来源：** [Megatron-LM](https://arxiv.org/abs/1909.08053)

### Termination Condition
- **类别:** Agent 与 Tool
- **实际含义:** 一项明确规则，在 Agent 成功、失败、耗尽预算、到达安全边界或需要升级处理时，结束或暂停 Agent 运行。
- **为什么重要:** 如果没有终止条件，Agent 可能循环、重复产生副作用、浪费预算，或在尚未实现目标时声称已经完成。
- **实践中:** 在启动循环之前，定义成功证据、最大步骤数和成本、不可重试错误以及升级状态。
- **常见误解:** Stop Sequence 会结束文本生成；终止条件决定任务或工作流是否应该停止。
- **相关术语:** Agent Harness, Token Budget, Verification Gate, Stop Sequence
- **来源：** [AutoGen](https://arxiv.org/abs/2308.08155)

### Test Oracle
- **类别:** AI-native 开发
- **实际含义:** 用于判断所观察到的程序行为是否正确的机制、规范、参考、Invariant 或人工判断。
- **为什么重要:** 仅生成测试输入并不足够；自动化验证需要一个独立依据来对每项结果进行分类。
- **实践中:** 优先使用可执行 Invariant、参考实现、Schema 和确定性的预期输出，然后记录仍需人工判断的位置。
- **常见误解:** 不能仅仅因为你询问编写代码的 Model 其自身输出是否正确，就把它当作独立 Oracle。
- **相关术语:** Regression Test, Verification Gate, Eval Set, Human-in-the-Loop (HITL)
- **来源：** [The Oracle Problem in Software Testing](https://www.computer.org/csdl/journal/ts/2015/05/06963470/13rRUx0geBw)

### Threat Model
- **类别:** 安全与治理
- **实际含义:** 一份记录受保护资产、Trust Boundary、潜在攻击者、假定能力、攻击路径、影响和计划控制措施的文档。
- **为什么重要:** 如果不说明安全控制措施保护什么、防范谁以及基于哪些假设，就无法对其进行评判。
- **实践中:** 梳理数据和权限如何跨越 Model、检索、Tool、用户与外部服务，然后将可信的滥用路径转化为 Red Team 用例和缓解措施。
- **常见误解:** Threat Model 会对可能发生的风险排定优先级；它不是用于证明系统安全或预测未来每一种攻击的检查清单。
- **相关术语:** Least Privilege, Prompt Injection, Sandbox, Red Teaming
- **来源：** [NIST SP 800-154](https://csrc.nist.gov/pubs/sp/800/154/ipd); [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.600-1.pdf)

### Time per Output Token (TPOT)
- **类别:** 基础设施与服务
- **实际含义：** 对于包含 `N > 1` 个 output token 的单次 request，首个 token 之后的平均间隔为 `(t_N - t_1) / (N - 1)`。系统分布随后聚合这些逐 request 的平均值。
- **为什么重要:** 用户可能很快收到第一个 Token，但答案的其余部分却缓慢流式传输，因此仅凭启动延迟无法描述生成响应速度。
- **实践中:** 为每个请求单独计算 TPOT，按输出长度和并发度报告跨请求的百分位数，并避免汇总所有 Token 间隔，也不要比较使用不同 Tokenizer 或测量边界的系统。
- **常见误解:** TPOT 是每个请求的平均值。单次 Inter-token Latency 是连续 Token 之间的一个时间间隔，而 Time to First Token 包括输出开始前的等待时间。
- **学习课程：** [Inference Metrics and Goodput](../phases/17-infrastructure-and-production/08-inference-metrics-goodput/)
- **相关术语:** Decode Phase, Time to First Token (TTFT), Streaming, Goodput
- **来源：** [DistServe](https://arxiv.org/abs/2401.09670)

### Time to First Token (TTFT)
- **类别:** Model 与 Inference
- **别名:** TTFT
- **实际含义:** 在已定义的测量边界下，从提交生成请求到客户端收到第一个输出 Token 或内容事件所经过的时间。
- **为什么重要:** TTFT 会显著影响感知响应速度，并可揭示排队、Prompt 处理、缓存或网络延迟。
- **实践中:** 按 Model、Prompt 长度、区域和缓存状态记录客户端侧 TTFT，然后将其与总完成时间分开。
- **常见误解:** TTFT 不是每秒 Token 数。前者衡量启动延迟；后者衡量输出开始后的生成吞吐量。
- **相关术语:** Streaming, Prompt Cache, Observability, Token Budget

### Token
- **类别:** 数据与表征
- **常见说法:** Model 输入或输出中约一个单词大小的片段。
- **实际含义:** 由特定于 Model 的 Tokenizer 从文本、字节、图像、音频或其他输入表征中产生的整数标识符。一个 Token 可以是完整单词、单词的一部分、标点符号、空白字符、字节序列或特殊控制符号。
- **常见误解:** 字符与 Token 的比例会因语言、内容和 Tokenizer 而异，因此应使用目标 Model 的 Tokenizer 或提供商 Tool 进行计数。
- **学习课程：** [Tokenizers](../phases/10-llms-from-scratch/01-tokenizers/)
- **相关术语:** Token Budget, Context Window, Autoregressive

### Token Budget
- **类别:** Prompt 与 Context
- **实际含义:** 在指令、证据、历史记录、Tool 结果、推理或工作空间以及输出之间明确分配 Token 容量。
- **为什么重要:** 每个被纳入的 Token 都会竞争 Context 容量、延迟和成本。预算分配会迫使你优先保留高价值证据。
- **实践中:** 预留输出容量，限制检索到的分块数量，将旧 Tool 结果汇总到状态中，并在达到 Model 限制之前停止或压缩。
- **常见误解:** Token Budget 是一种规划约束。它与 Model 的最大 Context Window 并不相同。
- **学习课程：** [Context Engineering](../phases/11-llm-engineering/05-context-engineering/)
- **相关术语:** Context Window, Context Engineering, Progressive Disclosure, Cost per Successful Task

### Tokenization
- **类别:** 数据与表征
- **实际含义:** 将输入表征转换为特定 Model 或 Tokenizer 所接受的有序 Token 标识符。
- **为什么重要:** Tokenization 决定序列长度、Vocabulary 边界、成本计算、截断行为，以及文本或代码在转换为 Embedding 之前的表示方式。
- **实践中:** 使用目标 Model 的确切 Tokenizer，将其版本与产物一起记录，并测试多语言文本、代码、空白字符和特殊 Token。
- **常见误解:** Tokenization 并不总是按单词拆分，而且两个 Model 可以为同一输入分配不同的 Token 数量和 ID。
- **相关术语:** Token, Vocabulary, Byte Pair Encoding (BPE), Embedding
- **来源：** [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)

### Tokens per Second (TPS)
- **类别:** 基础设施与服务
- **别名:** TPS, output token throughput
- **实际含义:** 一项吞吐量指标，用于报告服务系统在指定范围和工作负载下每单位时间产生的输出 Token 数量。
- **为什么重要:** 它通过展示输出开始后生成推进的速度以及服务在负载下的表现，对启动延迟指标形成补充。
- **实践中:** 说明 TPS 是单请求指标还是聚合指标，排除或明确标识 Prefill，并报告 Batch、并发度、序列长度、硬件和百分位延迟。
- **常见误解:** 使用不同 Tokenizer、工作负载、质量设置或测量边界时，TPS 无法直接比较。
- **相关术语:** Time to First Token (TTFT), Streaming, Prefill, Observability
- **来源：** [Sarathi-Serve](https://www.usenix.org/system/files/osdi24-agrawal.pdf)

### Tool Contract
- **类别:** Agent 与 Tool
- **实际含义:** Tool 边界的完整约定：用途、类型化输入、输出、验证、权限、副作用、错误、超时、Idempotency，以及返回给调用方的证据。
- **为什么重要:** Schema 告诉 Model 存在哪些字段；Contract 则告诉系统 Tool 在什么情况下是安全的，以及必须如何处理失败。
- **实践中:** 定义一个文件写入 Tool，其中包含允许的根目录、预期的基础版本、最大大小、dry-run 模式、明确的冲突错误以及返回的 Patch 哈希。
- **常见误解:** JSON Schema 是 Tool Contract 的一部分，而不是整个 Contract。
- **学习课程：** [Tool Use and Function Calling](../phases/14-agent-engineering/06-tool-use-and-function-calling/)
- **相关术语:** Function Calling, Structured Output, Least Privilege, Idempotency

### Top-k Sampling
- **类别:** Model 与 Inference
- **实际含义:** 一种解码方法，它将下一 Token 的分布限制在得分最高的 k 个候选项中，对其 Probability 重新归一化，并从该集合中进行采样。
- **为什么重要:** 它从采样中移除低 Probability 的长尾，同时保持固定的最大候选项数量。
- **实践中:** 将 k 与 Temperature、top-p 和停止设置一起进行 Evaluation，并随生成结果记录完整的采样器配置。
- **常见误解:** Top-k 使用固定的候选项数量，而 top-p 使用 Probability 质量阈值，其候选项数量会随步骤变化。
- **相关术语:** Nucleus Sampling (Top-p), Temperature, Decoding Strategy, Logits
- **来源：** [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)

### Trace
- **类别:** AI-native 开发
- **实际含义:** 一条关联记录，覆盖某个请求或任务经历的 Model 调用、检索、Tool、状态转换、重试、审批和 Evaluation。
- **为什么重要:** 它让你能够还原时间、成本和故障是在多步骤工作流的哪个位置产生的。
- **实践中:** 在整个 Agent Harness 中传播同一个 Trace 标识符，并为每次 Model 和 Tool 操作附加经过脱敏的 Span。
- **常见误解:** Trace 应记录运行证据，而不应暴露隐藏的 Model 推理、机密或未经脱敏的敏感内容。
- **学习课程：** [OpenTelemetry GenAI Conventions](../phases/14-agent-engineering/23-otel-genai-conventions/)
- **来源：** [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- **相关术语:** Observability, Agent State, Time to First Token (TTFT), Evaluation (Eval)

### Transfer Learning
- **类别:** 数学与 Training
- **常见说法:** 为新任务复用预训练 Model。
- **实际含义:** 从针对一种数据分布或目标学到的表征或参数出发，并将其适配到另一种分布或目标。可迁移的组件和更新策略取决于架构与任务。
- **常见误解:** 迁移并不限于较后的层，而且当源任务与目标任务差异显著时，无法保证迁移成功。
- **相关术语:** Fine-tuning, Feature, SFT (Supervised Fine-Tuning)

### Transformer
- **类别:** Model 与 Inference
- **常见说法:** 许多现代语言 Model 背后的架构。
- **实际含义:** 一种由 Attention、位置信息、前馈子层、残差连接和归一化构成的 Neural Network 架构。Encoder、Decoder 和 Encoder-Decoder 变体使用不同的 Mask 和信息流。
- **为什么重要:** Training 可以并行处理多个序列位置，而 Autoregressive 生成仍会逐步产生输出。
- **常见误解:** Self-Attention 并不意味着每个 Transformer 都使用不受限制的全对全 Attention。
- **学习课程：** [Build a Full Transformer](../phases/07-transformers-deep-dive/05-full-transformer/)
- **来源：** [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- **相关术语:** Attention, Self-Attention, Encoder, Decoder

### Trust Boundary
- **类别:** 安全与治理
- **实际含义:** 数据、指令、身份或权限在基于不同信任假设运行的组件或主体之间跨越的接口。
- **为什么重要:** 跨越边界时，系统必须验证参与者身份、验证数据、约束权限，并决定哪些声明可以影响操作。
- **实践中:** 围绕用户、Model Context、检索来源、Tool、网络和数据存储划定边界，然后为每次跨越指定验证与授权规则。
- **常见误解:** 网络边界只是 Trust Boundary 的一种。不可信文档文本进入特权 Agent Context 时，同样跨越了 Trust Boundary。
- **学习课程：** [Jailbreak Taxonomy](../phases/19-capstone-projects/82-jailbreak-taxonomy/)
- **相关术语:** Threat Model, Least Privilege, Sandbox, Indirect Prompt Injection
- **来源：** [Microsoft Learn: Trust Boundary, the Trust Zone Change Element](https://learn.microsoft.com/en-us/training/modules/tm-create-a-threat-model-using-foundational-data-flow-diagram-elements/6-trust-boundary-the-trust-zone-change-element); [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)

## U

### Underfitting
- **类别:** 数学与 Training
- **常见说法:** Model 无法充分拟合 Training 任务。
- **实际含义:** Model 或 Training 设置缺乏足够的有效容量、优化、Feature 或 Training 信号，因而无法捕捉 Training Data 中的有用模式。
- **实践中:** 首先诊断数据和优化问题，然后考虑延长 Training、更改 Feature、减少过度的正则化，或增加合适的容量。
- **相关术语:** Overfitting, Loss Function, Hyperparameter

## V

### VAE (Variational Autoencoder)
- **类别:** Model 与 Inference
- **常见说法:** 一种概率生成式 Autoencoder。
- **实际含义:** 一种潜变量 Model，使用重建目标和正则化项进行 Training，该正则化项使近似 Posterior 接近选定的 Prior。重参数化估计器允许 Gradient 通过随机潜变量采样传播。
- **常见误解:** VAE 并不会强制每个潜变量分布都采用同一个固定 Gaussian；具体的 Prior 和近似 Posterior 都是建模选择。
- **来源：** [Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)
- **相关术语:** Latent Space, Encoder, Decoder, Diffusion Model

### Vector Database
- **类别:** 检索与生成
- **常见说法:** 针对 Vector 相似度搜索优化的数据库。
- **实际含义:** 一种存储与索引系统，支持对 Vector 表征执行最近邻查询，通常还提供元数据过滤、持久化和近似索引。
- **常见误解:** Vector Database 存储并搜索 Vector。它不会创建高质量 Embedding，也不能保证检索结果相关。
- **相关术语:** Embedding, Semantic Search, Hybrid Retrieval

### Verification Gate
- **类别:** Evaluation 与安全
- **实际含义:** 一个控制点，在已定义证据满足正确性或质量标准之前阻止流程继续推进。
- **为什么重要:** 它将 Model 关于任务已完成的声明转化为有证据支持的决策。
- **实践中:** 在 Patch 能够应用、限定范围的测试通过、禁止修改的文件保持不变且所需产物存在之前，阻止编码任务完成。
- **常见误解:** Verification 检查证据是否满足标准。Approval 则授予继续推进的权限，即使相关证据已经明确。
- **学习课程：** [Verification Gates](../phases/14-agent-engineering/38-verification-gates/)
- **相关术语:** Approval Gate, Regression Test, Scope Contract, Structured Output

### Vision-Language Model (VLM)
- **类别:** Multimodal 系统
- **实际含义:** 一种学习视觉与语言表征之间关系或对二者进行联合处理的 Model，用于检索、描述、问答或有依据的生成等任务。
- **为什么重要:** VLM 的性能取决于视觉 Encoder、语言组件、连接机制、Training Data 和分辨率策略，而不是某个笼统的能力标签。
- **实践中:** 评估纯文本和纯视觉对照，改变图像分辨率与布局，在可能的情况下要求定位证据，并按视觉 Skill 和语言报告失败情况。
- **常见误解:** 能够接受图像并不能证明 Model 正确使用了图像，而且 VLM 不一定能够生成图像。
- **学习课程：** [Vision-Language Models](../phases/04-computer-vision/25-vision-language-models/)
- **相关术语:** Multimodal Model, Vision Transformer (ViT), Cross-Attention, Visual Grounding
- **来源：** [CLIP](https://arxiv.org/abs/2103.00020); [Flamingo](https://arxiv.org/abs/2204.14198)

### Vision Transformer (ViT)
- **类别:** Multimodal 系统
- **实际含义:** 一种视觉架构，它将图像表示为带有位置信息的 Patch Embedding 序列，并使用 Transformer Encoder Block 处理该序列。
- **为什么重要:** 它为视觉数据提供序列 Model 接口，但性能和计算量取决于 Patch 大小、分辨率、预训练和归纳偏置。
- **实践中:** 保持 Patch 划分和归一化与 Training 一致，考虑新分辨率下 Position Embedding 的行为，并在目标 Dataset 上与合适的视觉基线进行比较。
- **常见误解:** ViT 是一个架构家族，并非每个能够接受图像的 Transformer 都是 ViT，而且其 Patch 本身并不天然对应语义对象。
- **学习课程：** [Vision Transformers](../phases/04-computer-vision/14-vision-transformers/)
- **相关术语:** Transformer, Patch Embedding, Self-Attention, Encoder
- **来源：** [An Image is Worth 16x16 Words](https://arxiv.org/abs/2010.11929)

### Visual Grounding
- **类别:** Multimodal 系统
- **实际含义:** 将语言表达与图像或视频中的空间证据相连接，例如区域、对象、Mask 或被跟踪的实体。
- **为什么重要:** 流畅的视觉回答可能缺乏证据支持，而 Visual Grounding 可使所声称的指代对象可供检查，并支持区域级 Evaluation。
- **实践中:** 要求随答案提供 Bounding Box、Mask 或时间片段，测试有歧义和不存在的指代对象，并将定位结果与语言正确性分开评分。
- **常见混淆：** Visual grounding 用于识别所引用证据的位置。一般的图像描述可以描述场景，而无需定位每项陈述。
- **学习课程：** [Cross-Attention Fusion](../phases/19-capstone-projects/61-cross-attention-fusion/)
- **相关术语：** Grounding、Vision-Language Model (VLM)、Attention、Evaluation (Eval)
- **来源：** [MDETR](https://arxiv.org/abs/2104.12763)

### Vocabulary
- **类别：** 数据与表示
- **实际含义：** Token 标识符与 Tokenizer 可输出单元之间的有限映射，包括普通 Token、字节级 Token 和特殊控制 Token。
- **重要原因：** Vocabulary 设计会影响序列长度、多语言覆盖范围、代码表示、Embedding 大小，以及 Tokenizer 与 Model 权重之间的兼容性。
- **实践中：** 将 Vocabulary 和特殊 Token 分配与 Model 一同进行版本管理，测试编码-解码往返过程，并且绝不要用仅仅具有相似 Token 名称的 Tokenizer 进行替换。
- **常见混淆：** Model Vocabulary 并不是由人类词语组成的词典；其中许多条目是片段、字节、空白模式或控制符号。
- **相关术语：** Tokenization、Byte Pair Encoding (BPE)、Token、Embedding
- **来源：** [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909)

## W

### Warmup
- **类别：** 数学与 Training
- **实际含义：** 一个初始 Training 阶段，其中 Learning Rate 从较小值逐渐升高到主调度计划的目标值。
- **重要原因：** 早期 Gradient 和 Optimizer 统计量可能不稳定，尤其是在大 Batch 或 Transformer Training 中，因此突然采用完整幅度的更新可能会破坏优化过程。
- **实践中：** 以步数或已处理的 Token 数定义 warmup，记录实际得到的曲线，并在明确展示 Batch、Optimizer 和 Training 总预算的情况下对其进行调优。
- **常见混淆：** 并非每个 Model 都需要 warmup，而且 warmup 也无法让原本不合适的 Learning Rate 变得安全。
- **相关术语：** Learning Rate Schedule、Learning Rate、Batch Size、AdamW
- **来源：** [Accurate, Large Minibatch SGD](https://arxiv.org/abs/1706.02677)

### Weight
- **类别：** 数学与 Training
- **人们常说：** Model 内部学习到的一个数值。
- **实际含义：** Model 变换中的一个可训练系数。权重通常组织为 Tensor，优化过程会调整它们以降低 Training 目标。
- **常见混淆：** 并非每个参数都称为权重；偏置、Embedding 和归一化缩放系数同样是参数。
- **相关术语：** Parameter、Tensor、Optimizer

### Weight Decay
- **类别：** 数学与 Training
- **人们常说：** 在优化过程中缩小权重的正则化方法。
- **实际含义：** 一种在 Training 过程中减小所选参数幅度的更新规则，通常通过将权重乘以一个独立于 Gradient 更新的收缩因子来实现。
- **重要原因：** 它可以提升泛化能力，但有效的系数和需要排除的参数组取决于 Model、Optimizer、调度计划和数据。
- **常见混淆：** 对于某些简单的 Optimizer，解耦式 weight decay 等价于 L2 Loss 惩罚，但对于 Adam 等自适应 Optimizer，二者通常并不等价。
- **相关术语：** AdamW、Overfitting、Optimizer

### Worktree
- **类别：** AI-native 开发
- **实际含义：** 在 Git 中，worktree 是附加到 repository 及 branch 或 commit 的工作目录；它共享对象存储，但拥有自己 checkout 的文件和 index。
- **重要原因：** 独立的 worktree 允许人员和 Agent 并发工作，而无需不断切换或覆盖同一个 checkout。
- **实践中：** 为每个 Coding Agent 分配一个具名的 feature branch 和准确的 worktree 路径，然后通过常规 Git 历史记录审查并集成 patch。
- **常见混淆：** worktree 隔离的是 checkout 的文件，而不是机器上的每个进程、端口、缓存、数据库或 secret。
- **学习课程：** [Workbench for Real Repositories](../phases/14-agent-engineering/41-workbench-for-real-repos/)
- **来源：** [git-worktree documentation](https://git-scm.com/docs/git-worktree)
- **相关术语：** Coding Agent、Patch、Scope Contract、Handoff

## Z

### Zero-Shot
- **类别：** Prompting 与 Context
- **人们常说：** 在当前 Prompt 中不提供示例，直接要求完成任务。
- **实际含义：** 根据指令或任务框架执行任务，而不在即时输入中包含针对该任务的演示示例。
- **常见混淆：** Zero-shot 并不意味着 Model 没有接受过相关的预训练、指令调优，也不意味着没有使用 Tool 或检索到的 Context。
- **相关术语：** Few-Shot、Prompt Engineering、Transfer Learning

### Zero Trust
- **类别：** 安全与治理
- **实际含义：** 一种安全模型，它不会因网络位置或资产所有权而授予隐式信任，而是根据身份、设备、资源、策略和当前 Context 评估每个访问请求。
- **重要原因：** AI Tool 和 Agent 横跨本地文件、云服务、Model 与外部内容，因此受信任的内部网络作为授权依据，其范围过于宽泛。
- **实践中：** 对每个参与者和工作负载进行身份验证，对每项资源操作进行授权，签发短期凭证，划分访问范围，并持续记录和重新评估与策略相关的信号。
- **常见混淆：** Zero trust 并不意味着不信任任何事物或阻止所有自动化。它意味着让信任决策变得明确、范围受限且可持续验证。
- **学习课程：** [Security, Secrets, and Audit](../phases/17-infrastructure-and-production/25-security-secrets-audit/)
- **相关术语：** Least Privilege、Trust Boundary、Approval Gate、Audit Log
- **来源：** [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final)
