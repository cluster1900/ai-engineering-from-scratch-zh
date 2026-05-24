# AI Engineering 术语表

## A

### Agent
- **人们常说：** “一个能自主思考和行动的 AI”
- **实际含义：** 一个 while loop：LLM 决定下一步调用哪个 tool，执行它，查看结果，然后重复
- **为什么这样叫：** 借自哲学——“agent” 指任何能在世界中行动的东西。在 AI 中，它只是表示 “LLM + tools + loop”

### Attention
- **人们常说：** “AI 如何聚焦重要部分”
- **实际含义：** 一种机制：每个 Token 都会计算所有其他 Token 的 value 的加权和，权重由它们的相关程度决定（通过 query 和 key Vector 的 dot product）
- **为什么这样叫：** 2017 年论文 “Attention Is All You Need” 用类比人类选择性 Attention 的方式命名了它

### Alignment
- **人们常说：** “让 AI 安全”
- **实际含义：** 让 AI system 的行为匹配人类意图、价值和偏好的技术挑战，包括设计者没有预料到的 edge cases

### Autoregressive
- **人们常说：** “AI 一次生成一个词”
- **实际含义：** 一种基于所有先前 Token 预测下一个 Token 的模型，然后把该预测再作为下一步的输入。GPT、LLaMA 和 Claude 都是 autoregressive。

### Activation Function
- **人们常说：** “层之间的非线性东西”
- **实际含义：** 每个 linear layer 之后应用的函数，用来引入非线性。没有它，堆叠任意数量的 linear layer 都会坍缩为单个 linear transformation。ReLU、GELU 和 SiLU 最常见。选择会直接影响训练期间 Gradient 是否能流动。

### Adam (Optimizer)
- **人们常说：** “默认 Optimizer”
- **实际含义：** Adaptive Moment Estimation。把 momentum（first moment）和每个 parameter 的 adaptive learning rate（second moment）结合起来。对早期 step 有 bias correction。无需太多调参即可在多数任务上表现良好。

### AdamW
- **人们常说：** “更好的 Adam”
- **实际含义：** 带 decoupled weight decay 的 Adam。在标准 Adam 中，L2 regularization 会按每个 parameter 的 adaptive learning rate 缩放，这不是你想要的。AdamW 直接把 weight decay 应用到 weights 上，独立于 Gradient statistics。训练 Transformer 的默认 Optimizer。

### Autograd
- **人们常说：** “自动 Gradient”
- **实际含义：** 一个记录 Tensor 上的操作并通过 reverse-mode differentiation 自动计算 Gradient 的系统。PyTorch 的 autograd 会即时构建 computation graph（dynamic graph），而 JAX 使用 function transformations（grad）。这让 Backpropagation 变得实用——你写 forward pass，框架计算所有 derivatives。

## B

### Batch Size
- **人们常说：** “一次处理多少 examples”
- **实际含义：** 在更新 weights 之前，一次 forward/backward pass 中处理的训练 examples 数量。更大的 batch 会给出更稳定的 Gradient 估计，但使用更多 memory。典型值：训练为 32-512，inference 更大。Batch size 会和 learning rate 相互影响——batch 翻倍，LR 翻倍（linear scaling rule）。

### Backpropagation
- **人们常说：** “Neural Network 如何学习”
- **实际含义：** 一种算法，通过沿 network 反向应用 chain rule，计算每个 weight 对 error 的贡献，然后按比例调整 weights
- **为什么这样叫：** Errors 从 output 到 input、逐 layer Backpropagation

## C

### Context Window
- **人们常说：** “AI 能记住多少”
- **实际含义：** 单次 API call 中能容纳的最大 Token 数量（input + output）。它不是 memory，而是每次调用都会重置的固定大小 buffer

### Chain of Thought (CoT)
- **人们常说：** “让 AI 一步一步思考”
- **实际含义：** 一种 prompting 技术：要求 model 展示 reasoning steps，因为每一步都会影响下一步 Token generation，所以能提升 multi-step problems 的准确率

### CNN (Convolutional Neural Network)
- **人们常说：** “图像 AI”
- **实际含义：** 一种使用 convolution operations（在 input 上滑动 filters）来检测局部 patterns 的 Neural Network。堆叠 convolutions 会检测越来越复杂的 features：edges、textures、objects。

### CUDA
- **人们常说：** “GPU programming”
- **实际含义：** NVIDIA 的 parallel computing platform。让你能在数千个 GPU cores 上同时运行 Matrix operations。PyTorch 和 TensorFlow 在底层使用 CUDA。

### Chunking
- **人们常说：** “把 documents 切成片段”
- **实际含义：** 在 retrieval 前，把 text 切分成 segments 再做 Embedding。Chunk size 决定 search results 的粒度。太小：丢失 context。太大：稀释 relevance。常见策略：fixed-size with overlap、sentence-based 或 semantic splitting。典型 chunk size：256-512 Tokens，10-20% overlap。

### Contrastive Learning
- **人们常说：** “通过比较来学习”
- **实际含义：** 训练时在 Embedding space 中拉近相似 pairs、推远不相似 pairs。CLIP 就使用了这个：匹配 image-text pairs 与不匹配的 pairs。

### Cosine Similarity
- **人们常说：** “两个 Vector 有多相似”
- **实际含义：** 两个 Vector 夹角的 cosine：dot(a, b) / (||a|| * ||b||)。范围从 -1（相反）到 1（方向相同）。忽略 magnitude，只关心 direction。是 Embeddings 和 semantic search 的标准 similarity metric。

### Cross-Entropy
- **人们常说：** “Classification Loss”
- **实际含义：** 衡量两个 probability distributions 之间的差异。对于 Classification：-sum(y_true * log(y_pred))。对于 language models：正确 next Token 的 negative log probability。越低越好。Perplexity 只是 exp(cross-entropy)。

## D

### Data Augmentation
- **人们常说：** “制造更多训练数据”
- **实际含义：** 创建现有 data 的修改副本（旋转 images、添加 noise、改写 text），在不收集新 data 的情况下增加 training set diversity。减少 overfitting。

### Decoder
- **人们常说：** “输出部分”
- **实际含义：** 在 Transformer 中，decoder 使用 causal（masked）Self-Attention，因此每个位置只能 attend 到更早的位置。GPT 是 decoder-only。BERT 是 encoder-only。T5 是 encoder-decoder。

### Diffusion Model
- **人们常说：** “从 noise 生成 images 的 AI”
- **实际含义：** 一种被训练来反转渐进加噪过程的 model——它学习预测并移除 noise，在 generation 时从 pure noise 开始并迭代 denoise

### DPO (Direct Preference Optimization)
- **人们常说：** “更简单的 RLHF”
- **实际含义：** 一种完全跳过 reward model 的训练方法——它直接优化 language model，让它在 human preference pairs 中更偏好更好的 response

### Dropout
- **人们常说：** “随机关闭 neurons”
- **实际含义：** 训练期间，随机把一部分 activations 设为 zero。迫使 network 不依赖任何单个 neuron。Inference 期间关闭。简单但有效的 regularization。

## E

### Eigenvalue
- **人们常说：** “PCA 用到的某个数学东西”
- **实际含义：** 对 Matrix A，eigenvalue lambda 满足 Av = lambda*v，其中 v 是某个 Vector。它告诉你该 Matrix 在该方向上会把 Vector 缩放多少。大的 eigenvalues = data 中 high variance 的方向。

### Embedding
- **人们常说：** “某种把词变成数字的 AI 魔法”
- **实际含义：** 从离散 items（words、images、users）到 continuous space 中 dense vectors 的 learned mapping，其中相似 items 最终会彼此靠近
- **为什么这样叫：** 这些 items 被 “embedded” 到一个距离有意义的 geometric space 中

### Encoder
- **人们常说：** “输入部分”
- **实际含义：** 在 Transformer 中，encoder 使用 bidirectional Self-Attention，所以每个位置都能 attend 到所有位置。BERT 是 encoder-only。适合理解类任务（Classification、NER），但不适合 generation。

### Epoch
- **人们常说：** “完整过一遍 data”
- **实际含义：** 正是如此。完整遍历 training set 中每个 example 一次。多个 epochs = 多次看到 data。更多 epochs 可以改善 learning，但有 overfitting 风险。

## F

### Feature
- **人们常说：** “data 里的一个 column”
- **实际含义：** data 的单个可测量属性。在经典 ML 中，你手动 engineer features。在 Deep Learning 中，network 会从 raw data 自动学习 features。

### Few-Shot
- **人们常说：** “先给 AI 一些 examples”
- **实际含义：** 在要求 model 执行任务之前，在 prompt 中包含少量 input-output examples。通常是 3-5 个 examples。Model 会对这些 examples 做 pattern-match，以理解期望的 format 和 behavior。与 zero-shot（无 examples）和 fine-tuning（数千个 examples 烘进 weights）相对。

### Fine-tuning
- **人们常说：** “用你的 data 训练 AI”
- **实际含义：** 从 pre-trained model 的 weights 开始，在更小的、task-specific dataset 上继续训练。只更新现有 weights，不从头添加新知识

### Function Calling
- **人们常说：** “能使用 tools 的 AI”
- **实际含义：** 一种让 LLMs 请求执行 external functions 的结构化方式。你用 JSON Schema descriptions 定义 tools，model 输出一个结构化 JSON object，指定调用哪个 function 以及使用哪些 arguments，你的 code 执行它，并把结果返回给 model。它和 agents 不同——function calling 是机制，agents 是 loop。

## G

### Guardrails
- **人们常说：** “AI 的安全 filters”
- **实际含义：** LLM 周围的 input/output validation layers，用来检测并阻止 harmful content、prompt injection attempts、PII leakage 或 off-topic responses。通常是 pipeline：input filter -> LLM -> output filter。可以是 rule-based（regex、keyword lists）或 model-based（给 safety 打分的 classifier）。

### GPT
- **人们常说：** “ChatGPT” 或 “那个 AI”
- **实际含义：** Generative Pre-trained Transformer——一种特定 architecture，使用在大规模 text corpora 上训练的 decoder-only Transformer 来预测 next Token
- **为什么这样叫：** Generative（生成 text）、Pre-trained（先在大 data 上训练一次，再适配）、Transformer（architecture）

### GAN (Generative Adversarial Network)
- **人们常说：** “两个 AI 彼此对抗”
- **实际含义：** generator network 尝试创建逼真的 data，而 discriminator network 尝试分辨 real 和 fake。它们一起训练：generator 更擅长骗过 discriminator，discriminator 更擅长检测 fakes。

### Gradient
- **人们常说：** “斜率”
- **实际含义：** 一个 partial derivatives 组成的 Vector，指向最陡增加的方向。在 ML 中，你沿着 Gradient 的相反方向走（gradient descent）以最小化 Loss。

### Gradient Descent
- **人们常说：** “AI 如何变好”
- **实际含义：** 一种优化算法，在能最陡地降低 Loss Function 的方向上调整 parameters，就像在高维 landscape 中下坡

## H

### Hyperparameter
- **人们常说：** “你要调的设置”
- **实际含义：** 训练前设定的值，用来控制训练过程本身：learning rate、batch size、layers 数量、dropout rate。不同于 model parameters（weights），这些值不是从 data 中学到的。

### Hallucination
- **人们常说：** “AI 在撒谎” 或 “胡编”
- **实际含义：** Model 生成听起来合理但并未基于其 training data 或给定 context 的 text——它是在补全 pattern，不是在检索事实

## I

### Inference
- **人们常说：** “运行 AI”
- **实际含义：** 使用训练好的 model 对新 data 做 predictions。不会发生 weight updates。这就是 production 中做的事：发送 input，得到 output。

### Inductive Bias
- **人们常说：** 从没听过
- **实际含义：** 内置在 model architecture 中的 assumptions。CNNs 假设 local patterns 重要（convolution）。RNNs 假设 order 重要（sequential processing）。Transformers 假设一切都可能和一切相关（Attention）。正确的 bias 帮助 model 用更少 data 更快学习。

### JAX
- **人们常说：** “Google 的 ML framework”
- **实际含义：** 一个与 NumPy 兼容的 library，增加了 automatic differentiation（grad）、JIT compilation（jit）、automatic vectorization（vmap）和 multi-device parallelism（pmap）。不同于 PyTorch 的 object-oriented style，JAX 是纯 functional 的——没有 hidden state，没有 in-place mutation。Google DeepMind 用它做 AlphaFold、Gemini 和 large-scale research。

## K

### KV Cache
- **人们常说：** “让 inference 更快”
- **实际含义：** 在 autoregressive generation 期间，缓存先前 Tokens 的 key 和 value matrices，这样每一步就不必重新计算。用 memory 换 speed。对快速 LLM inference 必不可少。

## L

### Latent Space
- **人们常说：** “隐藏表示”
- **实际含义：** 一个压缩的 learned representation space，相似 inputs 会映射到附近的 points。Autoencoders、VAEs 和 diffusion models 都在 latent space 中工作。它比 input 维度更低，但捕获了重要结构。

### Learning Rate
- **人们常说：** “AI 学得有多快”
- **实际含义：** 控制 gradient descent 中 step size 的 scalar。太高：越过 minimum 并发散。太低：收敛太慢或卡住。最重要的单个 hyperparameter。

### LLM (Large Language Model)
- **人们常说：** “AI” 或 “大脑”
- **实际含义：** 基于 Transformer 的 Neural Network，被训练来预测 sequence 中的 next Token，拥有数十亿 parameters，并在 internet-scale text data 上训练

### LoRA (Low-Rank Adaptation)
- **人们常说：** “高效 fine-tuning”
- **实际含义：** 不更新所有 weights，而是在原始 weights 旁插入小型 low-rank matrices。只训练这些小 matrices，将 memory 降低 10-100x

### Loss Function
- **人们常说：** “AI 错得有多离谱”
- **实际含义：** 衡量 predicted output 和 actual output 之间差距的函数。训练会最小化这个函数。Regression 用 MSE，Classification 用 cross-entropy，Embeddings 用 contrastive loss。Loss Function 的选择定义了对 model 而言什么叫 “好”。

## M

### Mixed Precision
- **人们常说：** “提速训练技巧”
- **实际含义：** forward pass 和大多数 operations 使用 float16（更快、更省 memory），但 Gradient accumulation 和 weight updates 保持 float32（更精确）。在 accuracy loss 可忽略的情况下获得 2x speedup。

### MoE (Mixture of Experts)
- **人们常说：** “只运行 model 的一部分”
- **实际含义：** 一种包含许多 “expert” subnetworks 的 model，其中 routing mechanism 会把每个 input 只发送给少数几个 experts。完整 model 很大，但每次 forward pass 很便宜，因为大多数 experts 被跳过。Mixtral 和 GPT-4 使用这种方式。

### MCP (Model Context Protocol)
- **人们常说：** “一种让 AI 使用 tools 的方式”
- **实际含义：** 一个 open protocol（JSON-RPC over stdio/HTTP），标准化 AI applications 如何连接 external data sources 和 tools，并为 tools、resources 和 prompts 提供 typed schemas

## N

### NaN (Not a Number)
- **人们常说：** “训练崩了”
- **实际含义：** 一个 floating-point value，表示 undefined results（0/0、inf-inf）。训练中，NaN loss 通常意味着：learning rate 太高、exploding gradients、log of zero 或 division by zero。训练失败时永远先检查它。

### Normalization
- **人们常说：** “缩放 data”
- **实际含义：** 把 values 调整到标准 range。Batch normalization 在 batch 维度归一化。Layer normalization 在 features 维度归一化。二者都能稳定训练并允许更高 learning rates。

## O

### Overfitting
- **人们常说：** “Model 记住了 data”
- **实际含义：** Model 在 training data 上表现好，但在 unseen data 上表现差。它学到了 noise，而不是 signal。修复方法：更多 data、regularization（dropout、weight decay）、early stopping、data augmentation、更简单的 model。

### Optimizer
- **人们常说：** “更新 weights 的东西”
- **实际含义：** 使用 Gradients 更新 model parameters 的算法。SGD 最简单。Adam 最常见。每种 Optimizer 有不同特性：convergence speed、memory usage、对 hyperparameters 的敏感度。

## P

### Parameter
- **人们常说：** “Model size”
- **实际含义：** Model 中可学习的 value，通常是 weight 或 bias。“7B parameters” 意味着 70 亿个可学习数字。每个 float32 parameter 占 4 bytes，所以 7B parameters 光 weights 就需要 28GB memory。

### Perplexity
- **人们常说：** “Model 有多困惑”
- **实际含义：** 平均 cross-entropy Loss 的 exponential。越低越好。Perplexity 为 10 表示 model 的不确定性相当于每一步都在 10 个 Tokens 中均匀选择。

### Precision & Recall
- **人们常说：** “Accuracy metrics”
- **实际含义：** Precision = 你标记的 items 中，有多少是正确的。Recall = 所有正确 items 中，你找到了多少。二者会权衡：抓住每封 spam email（high recall）意味着更多 false alarms（low precision）。F1 score 是它们的 harmonic mean。False positives 代价高时用 precision，false negatives 代价高时用 recall。

### Prompt Engineering
- **人们常说：** “用正确方式和 AI 说话”
- **实际含义：** 设计 input text 以稳定产生期望 outputs——包括 system prompts、few-shot examples、format instructions 和 chain-of-thought triggers

### Prompt Injection
- **人们常说：** “用文字黑进 AI”
- **实际含义：** 一种攻击：input 中的 malicious text 覆盖 system prompt 或 instructions。Direct injection：user 输入 “Ignore previous instructions.” Indirect injection：retrieved document 包含隐藏 instructions。相当于 LLM 版本的 SQL injection。不存在完整解决方案——防御依赖多层 input validation、output filtering 和 privilege separation。

## Q

### QLoRA
- **人们常说：** “更便宜的 LoRA”
- **实际含义：** Quantized LoRA。把冻结的 base model weights 保持为 4-bit precision（NF4 format），同时以 16-bit 训练 LoRA adapters。相比标准 LoRA，memory 再降低 3-4x。一个用 LoRA 需要 14GB 的 7B model，用 QLoRA 可放进 4-6GB。多数 benchmarks 上质量与 full fine-tuning 相差在 1% 内。

## R

### RAG (Retrieval-Augmented Generation)
- **人们常说：** “能搜索的 AI”
- **实际含义：** 一种 pattern：从 knowledge base 中 retrieve relevant documents（使用 Embedding similarity），把它们塞进 prompt，然后让 LLM 基于该 context 回答
- **为什么这样叫：** Retrieval（查找 documents）+ Augmented（添加到 prompt）+ Generation（LLM 写答案）

### RLHF (Reinforcement Learning from Human Feedback)
- **人们常说：** “他们如何让 AI 更有帮助”
- **实际含义：** 一个训练 pipeline：(1) 收集人类对 model outputs 的 preferences，(2) 用这些 preferences 训练 reward model，(3) 使用 PPO 优化 LLM 以产生 higher-reward outputs

### Quantization
- **人们常说：** “把 model 变小”
- **实际含义：** 把 model weights 的 precision 从 float32（4 bytes）降低到 int8（1 byte）或 int4（0.5 bytes）。用少量 accuracy 换取 4-8x 更少 memory 和更快 inference。GPTQ、AWQ 和 GGUF 是常见 formats。

### ReLU
- **人们常说：** “Activation Function”
- **实际含义：** Rectified Linear Unit：f(x) = max(0, x)。最简单的 non-linear activation。计算快，对正值不 saturate。因为有效且便宜，所以到处使用。Variants：LeakyReLU、GELU、SiLU。

### ROUGE
- **人们常说：** “Summarization metric”
- **实际含义：** Recall-Oriented Understudy for Gisting Evaluation。衡量 generated text 和 reference text 之间的 overlap。ROUGE-1 统计 unigram matches，ROUGE-2 统计 bigram matches，ROUGE-L 查找 longest common subsequence。计算便宜，但只衡量表面 similarity——两个 meaning 相同但 words 不同的句子得分会很差。

## S

### Semantic Search
- **人们常说：** “理解 meaning 的智能搜索”
- **实际含义：** 按 meaning 而不是 keyword matching 查找 documents。把 query 和所有 documents Embed 到同一 Vector space，然后返回 Embeddings 最接近 query Embedding 的 documents。“payment failed” 能找到 “transaction declined”，即使它们没有共享 words。由 Embedding models + Vector databases 驱动。

### Streaming
- **人们常说：** “看到 response 一个词一个词出现”
- **实际含义：** LLM 在生成 Tokens 时就发送它们，而不是等待完整 response。使用 Server-Sent Events (SSE) 或 WebSocket protocols。把首个 Token 的感知 latency 从秒级降低到毫秒级。对 production chat interfaces 必不可少。每个 chunk 包含一个 delta（partial Token 或 word）。

### Self-Attention
- **人们常说：** “Model 如何决定关注什么”
- **实际含义：** 每个 Token 计算 query、key 和 value vectors。两个 Tokens 之间的 Attention weight = 它们的 query 和 key 的 dot product，经过 scaling 和 softmax。Output = value vectors 的 weighted sum。让每个 Token 都能看到其他每个 Token。

### SFT (Supervised Fine-Tuning)
- **人们常说：** “教 model 遵循 instructions”
- **实际含义：** 在 (instruction, response) pairs 上对 pre-trained model 做 Fine-tuning。Model 学会在给定 instruction 时生成 response。这就是把 base model 变成 chat model 的过程。

### Softmax
- **人们常说：** “把数字变成概率”
- **实际含义：** softmax(x_i) = exp(x_i) / sum(exp(x_j))。把任意 real numbers 的 Vector 转换成 probability distribution（全部为正，总和为 1）。用于 Classification heads、Attention weights，以及任何需要 probabilities 的地方。

### Swarm
- **人们常说：** “一群 AI agents 像蜜蜂一样协作”
- **实际含义：** 多个 agents 共享 state，并通过 message passing 协调，由简单 individual rules 而非 central control 产生 emergent behavior

## T

### System Prompt
- **人们常说：** “AI 的 instructions”
- **实际含义：** conversation 开头的一条 special message，用来设定 model 的 behavior、persona 和 constraints。先于 user messages 处理。在多数 UIs 中对 user 不可见。定义 model 应该和不应该做什么、tone、format preferences 和 domain focus。不同于 user prompts——system prompts 由 developer 设置。

### Tensor
- **人们常说：** “多维 array”
- **实际含义：** Deep Learning frameworks 中的基础 data structure。0D Tensor 是 scalar，1D 是 Vector，2D 是 Matrix，3D+ 是 Tensor。在 PyTorch 和 JAX 中，Tensors 会跟踪自己的 computation history 以支持 automatic differentiation，并且可驻留在 CPU 或 GPU。所有 Neural Network inputs、outputs、weights 和 Gradients 都是 Tensors。

### Token
- **人们常说：** “一个词”
- **实际含义：** 由 BPE 之类 Tokenizer 生成的 subword unit（英语中通常为 3-4 个 characters）。“unbelievable” 可能是 3 个 Tokens：“un” + “believ” + “able”

### Temperature
- **人们常说：** “创造力设置”
- **实际含义：** softmax 之前用来除 logits 的 scalar。Temperature=1 是默认值。更高 = 更平的 distribution = 更随机的 outputs。更低 = 更尖锐的 distribution = 更确定性。Temperature=0 是 argmax（总是选择最可能的 Token）。

### Transfer Learning
- **人们常说：** “使用 pre-trained model”
- **实际含义：** 取一个在某个 task 上训练的 model，并把它适配到另一个 task。早期 layers 学到 general features（edges、syntax patterns），可以 transfer。只有后期 layers 需要 task-specific training。这就是为什么你能为任何 NLP task fine-tune BERT。

### Transformer
- **人们常说：** “现代 AI 背后的 architecture”
- **实际含义：** 一种 Neural Network architecture，使用 Self-Attention（让每个位置 attend 到其他每个位置）而不是 recurrence 来处理 sequences，从而实现 massive parallelization
- **为什么这样叫：** 它通过 Attention layers 把 input representations 转换为 output representations

## U

### Underfitting
- **人们常说：** “Model 没学会”
- **实际含义：** Model 太简单，无法捕获 data 中的 patterns。Training loss 一直很高。修复方法：更多 parameters、更多 layers、更长训练、更低 regularization、更好的 features。

## V

### VAE (Variational Autoencoder)
- **人们常说：** “Generative model”
- **实际含义：** 一种 autoencoder，通过迫使 encoder output 遵循 Gaussian distribution 来学习平滑 latent space。你可以从该 distribution 中 sample 并 decode 生成新 data。Reparameterization trick 让它可以通过 Backpropagation 训练。

### Vector Database
- **人们常说：** “AI 专用数据库”
- **实际含义：** 一种针对存储 Vectors（dense arrays of floats）和执行快速 approximate nearest-neighbor search 优化的 database。它是 similarity search、RAG 和 recommendation systems 中的核心 operation。

## W

### Weight
- **人们常说：** “Model 学到的东西”
- **实际含义：** Model parameter Matrix 中的单个数字。一个 input size 为 768、output size 为 3072 的 linear layer 有 768*3072 = 2,359,296 个 weights。训练会调整每个 weight 以最小化 Loss Function。

### Weight Decay
- **人们常说：** “Regularization”
- **实际含义：** 向 Loss Function 添加一个与 weights magnitude 成比例的 penalty。等价于 L2 regularization。防止 weights 变得过大。典型值：0.01-0.1。

## Z

### Zero-Shot
- **人们常说：** “不需要训练”
- **实际含义：** 在一个 model 未被明确训练过的 task 上使用它，并且 prompt 中没有 task-specific examples。Model 从 pre-training 中 generalize。之所以可行，是因为大型 models 已经见过足够多样性，能处理新的 task formats。
