// 由 build.js 自动生成——请勿手动编辑。
// 最近构建时间：2026-06-06T04:52:09.393Z

const PHASES = [
  {
    "id": 0,
    "name": "Setup & Tooling",
    "status": "complete",
    "desc": "为后续所有内容准备好你的环境。",
    "lessons": [
      {
        "name": "Dev Environment",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/01-dev-environment/",
        "summary": "你的 tools 会塑造你的思考方式。一次配置，正确配置。",
        "keywords": "步骤 1： System Foundation · 步骤 2： Python with uv · 步骤 3： Node.js with pnpm · 步骤 4： Rust · 步骤 5： Julia (Optional) · 步骤 6：GPU 设置（如果你有） · 步骤 7： Verify Everything"
      },
      {
        "name": "Git & Collaboration",
        "status": "complete",
        "type": "Learn",
        "lang": "—",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/02-git-and-collaboration/",
        "summary": "Version control 不是可选项。你在这里构建的每个 experiment、每个 model、每节课都要被 tracked。",
        "keywords": "步骤 1： Configure git · 步骤 2：日常工作流 · 步骤 3：为实验创建分支 · 步骤 4： 使用这个课程 repo"
      },
      {
        "name": "GPU Setup & Cloud",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/03-gpu-setup-and-cloud/",
        "summary": "在 CPU 上训练用于学习没有问题。真正训练需要 GPU。",
        "keywords": "选项 1：本地 NVIDIA GPU · Option 2: Google Colab · Option 3: Cloud GPU · No GPU? No problem."
      },
      {
        "name": "APIs & Keys",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/04-apis-and-keys/",
        "summary": "每个 AI API 的工作方式都一样：发送 request，得到 response。细节会变，模式不变。",
        "keywords": "步骤 1：安全存储 API keys · 步骤 2：第一次 API 调用 (Python) · 步骤 3： 第一次 API 调用 (TypeScript) · 步骤 4： Raw HTTP (no SDK)"
      },
      {
        "name": "Jupyter Notebooks",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/05-jupyter-notebooks/",
        "summary": "Notebooks 是 AI engineering 的实验台。你在这里做 prototype，然后把有效的部分移到 production。",
        "keywords": "步骤 1： 选择你的界面 · 步骤 2： 重要的键盘快捷键 · 步骤 3： Cell 类型 · 步骤 4： Magic commands · 步骤 5： Inline 显示 rich output · 步骤 6： Google Colab · Notebooks vs Scripts：何时使用哪一个 · 常见陷阱"
      },
      {
        "name": "Python Environments",
        "status": "complete",
        "type": "Build",
        "lang": "Shell",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/06-python-environments/",
        "summary": "Dependency hell 真实存在。Virtual environments 是解药。",
        "keywords": "选项 1：uv venv（推荐） · 选项 2：venv（内置） · 选项 3：conda（需要时使用） · 本课程：按 Phase 的策略 · 1. 全局安装 · 2. 混用 pip 和 conda · 3. 忘记 activate · 4. 把 .venv commit 到 git · 5. CUDA version mismatch"
      },
      {
        "name": "Docker for AI",
        "status": "complete",
        "type": "Build",
        "lang": "Docker",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/07-docker-for-ai/",
        "summary": "Containers 让“在我机器上能跑”成为过去式。",
        "keywords": "为什么 AI projects 比大多数项目更需要 Docker · 关键词汇 · AI 中常见的 container patterns · Step 1：安装 Docker · Step 2：安装 NVIDIA Container Toolkit（带 NVIDIA GPU 的 Linux） · Step 3：理解 base images · Step 4：为 AI development 编写 Dockerfile · Step 5：用于 data 和 models 的 volume mounts · Step 6：用于 multi-service AI apps 的 Docker Compose · Step 7：AI 工作中实用的 Docker commands · 没有 GPU？"
      },
      {
        "name": "Editor Setup",
        "status": "complete",
        "type": "Build",
        "lang": "—",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/08-editor-setup/",
        "summary": "你的编辑器是你的协作伙伴。一次性配置好它，让它不再碍事，并开始真正发挥作用。",
        "keywords": "步骤 1： Install VS Code · 步骤 2：安装必要扩展 · 步骤 3：配置设置 · 步骤 4： Terminal 集成 · 步骤 5：远程开发（SSH 到 GPU 机器） · Cursor · Windsurf · Vim/Neovim"
      },
      {
        "name": "Data Management",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/09-data-management/",
        "summary": "Data 是燃料。你如何管理它，决定了你能走多快。",
        "keywords": "步骤 1：安装 datasets library · 步骤 2： Load a dataset · 步骤 3：流式处理大型数据集 · 步骤 4： Dataset formats · 步骤 5： Data splits · 步骤 6： 下载并缓存模型 · 步骤 7：处理大文件 · 步骤 8： Storage patterns"
      },
      {
        "name": "Terminal & Shell",
        "status": "complete",
        "type": "Learn",
        "lang": "—",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/10-terminal-and-shell/",
        "summary": "terminal 是 AI engineers 的主场。要在这里变得熟练。",
        "keywords": "步骤 1： 了解你的 shell · 步骤 2： Piping 和 redirects · 步骤 3： 后台进程 · 步骤 4： tmux · 步骤 5： 使用 htop 和 nvtop 监控 · 步骤 6： 用 SSH 连接远程 GPU 机器 · 步骤 7： AI 工作常用 aliases · 步骤 8： 常见 AI terminal patterns"
      },
      {
        "name": "Linux for AI",
        "status": "complete",
        "type": "Learn",
        "lang": "—",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/11-linux-for-ai/",
        "summary": "大多数 AI 都运行在 Linux 上。你需要掌握到不会卡住的程度。",
        "keywords": "移动位置 · 文件和目录 · 读取文件 · 搜索"
      },
      {
        "name": "Debugging & Profiling",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/00-setup-and-tooling/12-debugging-and-profiling/",
        "summary": "最糟糕的 AI bugs 不会崩溃。它们会静默地在垃圾数据上训练，并报告一条漂亮的 loss curve。",
        "keywords": "Part 1: Print Debugging（是的，它有效） · Part 2: Python Debugger（pdb 和 breakpoint） · Part 3: Python Logging · Part 4: 为代码区段计时 · Part 5: cProfile 和 line_profiler · Part 6: Memory Profiling · Part 7: 常见 AI Bugs 以及如何捕获它们 · Part 8: TensorBoard 基础 · Part 9: VS Code Debugger"
      }
    ]
  },
  {
    "id": 1,
    "name": "Math Foundations",
    "status": "complete",
    "desc": "通过代码理解每个 AI algorithm 背后的直觉。",
    "lessons": [
      {
        "name": "Linear Algebra Intuition",
        "status": "complete",
        "type": "Learn",
        "lang": "Python, Julia",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/01-linear-algebra-intuition/",
        "summary": "每个 AI model 都只是戴着华丽帽子的 Matrix 数学。",
        "keywords": "Vectors 是点（也是方向） · Matrices 是 Transformations · Dot Product 衡量相似性 · Linear Independence · Basis 和 Rank · Projection · Gram-Schmidt Process · 步骤 1： 从零实现 Vectors（Python） · 步骤 2： 从零实现 Matrices（Python） · 步骤 3： 为什么这对 AI 很重要 · 步骤 4： Julia 版本 · 步骤 5： 从零实现 Linear independence 和 projection（Python） · 使用 NumPy 处理 Rank、Projection 和 QR · PyTorch -- Tensors 是带有 Autodiff 的 Vectors"
      },
      {
        "name": "Vectors, Matrices & Operations",
        "status": "complete",
        "type": "Build",
        "lang": "Python, Julia",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/02-vectors-matrices-operations/",
        "summary": "每个 Neural Network 都只是 Matrix multiplication 加上一些额外步骤。",
        "keywords": "Vector：有序数字列表 · Matrix：数字网格 · 为什么 shape 很重要 · 运算地图 · 逐元素乘法 vs Matrix 乘法 · Broadcasting · 步骤 1： Vector class · 步骤 2： 带核心运算的 Matrix class · 步骤 3： 看它运行 · 步骤 4： 连接到 Neural Networks"
      },
      {
        "name": "Matrix Transformations & Eigenvalues",
        "status": "complete",
        "type": "Build",
        "lang": "Python, Julia",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/03-matrix-transformations/",
        "summary": "Matrix 是一台重塑空间的机器。理解它对每个点做了什么，你就理解了整个变换。",
        "keywords": "作为 matrices 的变换 · Rotation · Scaling · Shearing · Reflection · Composition：串联变换 · Eigenvalues 和 eigenvectors · Eigendecomposition · 为什么 eigenvalues 重要 · Determinant 作为体积缩放因子 · 步骤 1：从零实现 transformation matrices（Python） · 步骤 2：变换的 composition · 步骤 3：从零计算 eigenvalues（2x2） · 步骤 4：Determinant 作为体积缩放因子 · 使用 NumPy 进行 3D rotations"
      },
      {
        "name": "Calculus for ML: Derivatives & Gradients",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/04-calculus-for-ml/",
        "summary": "导数会告诉你哪边是下坡。这就是 Neural Network 学习所需要的一切。",
        "keywords": "什么是导数？ · 偏导数：一次只看一个变量 · Gradient：所有偏导数构成的 Vector · 与优化的联系 · 数值导数 vs 解析导数 · 手动推导简单函数的导数 · 链式法则 · Hessian Matrix · Taylor Series 近似 · ML 中的积分 · Computation Graph 中的多变量链式法则 · Jacobian Matrix · 为什么这对 Neural Network 很重要 · 步骤 1：从零实现数值导数 · 步骤 2：偏导数与 Gradient · 步骤 3：用 Gradient Descent 找到 f(x) = x^2 的最小值 · 步骤 4：在 2D 函数上执行 Gradient Descent · 步骤 5：比较数值导数和解析导数 · 步骤 6：数值计算 Hessian · 步骤 7：Taylor 近似的实际效果 · 步骤 8：为什么这对 Neural Network 很重要"
      },
      {
        "name": "Chain Rule & Automatic Differentiation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/05-chain-rule-and-autodiff/",
        "summary": "Chain Rule 是每个能够学习的 Neural Network 背后的引擎。",
        "keywords": "Chain Rule · Computational Graphs · 前向模式 vs 反向模式 · 用于 Forward Mode 的 Dual Numbers · 构建 Autograd 引擎 · PyTorch Autograd 底层如何工作 · 步骤 1：Value class · 步骤 2：带 Gradient tracking 的算术操作 · 步骤 3：Backward pass · 步骤 4：完整引擎所需的更多操作 · 步骤 5：从零实现 Mini MLP · 步骤 6：Gradient checking · 步骤 7：与手算结果验证 · 与 PyTorch 验证 · 一个更复杂的表达式"
      },
      {
        "name": "Probability & Distributions",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/06-probability-and-distributions/",
        "summary": "概率是 AI 用来表达不确定性的语言。",
        "keywords": "Events、Sample Spaces 与 Probability · Conditional Probability 与 Independence · Probability Mass Functions 与 Probability Density Functions · 常见 Distributions · Expected Value 与 Variance · Joint 与 Marginal Distributions · 为什么 Normal Distribution 到处出现 · Log Probabilities · Softmax 作为 Probability Distribution · Sampling · 步骤 1：概率基础 · 步骤 2：从零实现 PMF 和 PDF · 步骤 3：Expected value 与 variance · 步骤 4：从 distributions 中采样 · 步骤 5：Softmax 与 log probabilities · 步骤 6：Central Limit Theorem 演示 · 步骤 7：可视化"
      },
      {
        "name": "Bayes' Theorem & Statistical Thinking",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/07-bayes-theorem/",
        "summary": "Probability 关注的是你预期会发生什么。Bayes' theorem 关注的是你学到了什么。",
        "keywords": "从 joint probability 到 Bayes · 四个部分 · 医学检测示例 · Spam filter 示例 · Naive Bayes：independence assumption · Maximum likelihood estimation (MLE) · Maximum a posteriori (MAP) · Bayesian vs frequentist：实践差异 · 为什么 Bayesian thinking 对 ML 很重要 · 步骤 1：Bayes theorem function · 步骤 2：Naive Bayes classifier · 步骤 3：在 spam 数据上训练 · 步骤 4：检查学习到的概率 · Conjugate Priors · Sequential Bayesian Updating · 与 A/B Testing 的联系"
      },
      {
        "name": "Optimization: Gradient Descent Family",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/08-optimization/",
        "summary": "训练一个 Neural Network，本质上就是寻找山谷的最低点。",
        "keywords": "What optimization means · Gradient descent (vanilla) · Learning rate：最重要的 hyperparameter · SGD vs batch vs mini-batch · Momentum：向山下滚动的小球 · Adam：adaptive learning rates · Learning rate schedules · Convex vs non-convex · Loss landscape visualization · 步骤 1： Define a test function · 步骤 2： Vanilla gradient descent · 步骤 3： SGD with momentum · 步骤 4： Adam · 步骤 5： Run and compare"
      },
      {
        "name": "Information Theory: Entropy, KL Divergence",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/09-information-theory/",
        "summary": "Information Theory 衡量 surprise。Loss functions 建立在它之上。",
        "keywords": "信息量（Surprise） · Entropy（平均惊讶度） · Cross-Entropy (你每天使用的 Loss Function) · KL Divergence (Distributions 之间的距离) · Mutual Information · Conditional Entropy · Joint Entropy · Mutual Information（Deep Dive） · Label Smoothing 与 Cross-Entropy · 为什么 Cross-Entropy 是 Classification Loss 的核心 · Bits vs Nats · Perplexity · 第 1 步：Information content 和 entropy · 步骤 2： Cross-entropy and KL divergence · 步骤 3： Cross-entropy as classification loss · 步骤 4： Cross-entropy equals negative log-likelihood · 步骤 5： Mutual information"
      },
      {
        "name": "Dimensionality Reduction: PCA, t-SNE, UMAP",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/10-dimensionality-reduction/",
        "summary": "高维数据有结构。你要从正确的角度观察它。",
        "keywords": "The curse of dimensionality · PCA: find the directions that matter · Explained variance ratio · Choosing the number of components · t-SNE: preserve neighborhoods · UMAP: faster, better global structure · When to use which · Kernel PCA · Reconstruction Error · Step 1: PCA from scratch · Step 2: Test on synthetic data · Step 3: MNIST digits in 2D · Step 4: Compare with sklearn · Step 5: UMAP comparison"
      },
      {
        "name": "Singular Value Decomposition",
        "status": "complete",
        "type": "Build",
        "lang": "Python, Julia",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/11-singular-value-decomposition/",
        "summary": "SVD 是线性代数中的瑞士军刀。每个 Matrix 都有 SVD。每个数据科学家都需要 SVD。",
        "keywords": "SVD 在几何上做什么 · The full decomposition · Left singular vectors、singular values、right singular vectors · Outer product form · Relationship to eigendecomposition · Truncated SVD：low-rank approximation · 使用 SVD 进行图像压缩 · SVD 用于推荐系统 · NLP 中的 SVD：Latent Semantic Analysis · SVD for noise reduction · Pseudoinverse via SVD · Numerical stability 优势 · Connection to PCA · 步骤 1： SVD from scratch using power iteration · 步骤 2： Test and compare with NumPy · 步骤 3： Image compression demo · 步骤 4： Noise reduction · 步骤 5： Pseudoinverse"
      },
      {
        "name": "Tensor Operations",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/12-tensor-operations/",
        "summary": "Tensors 是数据与 Deep Learning 之间的通用语言。每一张图像、每一个句子、每一个 Gradient 都通过它们流动。",
        "keywords": "What a tensor is · Deep Learning 中的 Tensor shapes · How memory layout works · Broadcasting rules · Einsum：通用 tensor operation · 步骤 1：Tensor 存储和 strides · 步骤 2: Reshape, squeeze, unsqueeze · 第 3 步：Transpose 和 permute · 步骤 4： Element-wise operations and reductions · 步骤 5： Broadcasting with NumPy · 步骤 6： Einsum operations · 步骤 7： Attention mechanism via einsum · Scratch vs NumPy · Scratch vs PyTorch · 每个 Neural Network layer 都是一个 Tensor operation"
      },
      {
        "name": "Numerical Stability",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/13-numerical-stability/",
        "summary": "Floating point 是一个有泄漏的抽象。它会在训练过程中咬你一口，而且你不会提前察觉。",
        "keywords": "IEEE 754：计算机如何存储实数 · 为什么 0.1 + 0.2 != 0.3 · Catastrophic Cancellation · Overflow 和 Underflow · Log-Sum-Exp Trick · 为什么 Softmax 需要 Max-Subtraction Trick · NaN 和 Inf：检测与预防 · Numerical Gradient Checking · Mixed Precision Training · bfloat16 vs float16：为什么 bfloat16 在训练中胜出 · Gradient Clipping · Normalization Layers 作为数值稳定器 · 常见 ML 数值 Bug · 步骤 1：演示 floating point 精度限制 · 步骤 2：实现 naive vs stable softmax · 步骤 3：实现 stable log-sum-exp · 步骤 4：实现 stable cross-entropy · 步骤 5：Gradient checking · Mixed precision 模拟 · Gradient clipping · NaN/Inf detection"
      },
      {
        "name": "Norms & Distances",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/14-norms-and-distances/",
        "summary": "你的距离函数定义了什么叫“相似”。选错了，下游的一切都会出问题。",
        "keywords": "Norms：测量 Vector 大小 · L1 Norm（Manhattan distance） · L2 Norm（Euclidean distance） · Lp Norms：通用族 · L-infinity Norm（Chebyshev distance） · Cosine Similarity 和 Cosine Distance · Dot Product Similarity vs Cosine Similarity · Mahalanobis Distance · Jaccard Similarity（用于集合） · Edit Distance（Levenshtein Distance） · KL Divergence（不是距离，但常被当作距离使用） · Wasserstein Distance（Earth Mover's Distance） · 为什么不同任务需要不同距离 · 与 Loss Functions 的联系 · 与正则化的联系 · Nearest Neighbor Search · 步骤 1：所有范数和距离函数 · 步骤 2：同一数据，不同距离，不同邻居 · 步骤 3：Embedding similarity search"
      },
      {
        "name": "Statistics for ML",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/15-statistics-for-ml/",
        "summary": "Statistics 让你知道你的模型是真的有效，还是只是碰巧走运。",
        "keywords": "Descriptive Statistics: 总结你的数据 · Correlation: 变量如何一起变化 · Covariance Matrix · Hypothesis Testing · The t-test · Chi-squared Test · A/B Testing for ML Models · Statistical Significance vs Practical Significance · Multiple Comparison Problem · Bootstrap Methods · Parametric vs Non-parametric Tests · Central Limit Theorem：实际影响 · ML 论文中常见的统计错误"
      },
      {
        "name": "Sampling Methods",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/16-sampling-methods/",
        "summary": "Sampling 是 AI 探索可能性空间的方式。",
        "keywords": "Why Sampling Matters · Uniform Random Sampling · Inverse CDF Method (Inverse Transform Sampling) · Rejection Sampling · Importance Sampling · Monte Carlo Estimation · Markov Chain Monte Carlo (MCMC)：Metropolis-Hastings · Gibbs Sampling · Temperature Sampling（用于 LLMs） · Top-k Sampling · Top-p (Nucleus) Sampling · Reparameterization Trick（用于 VAEs） · Gumbel-Softmax（可微的 Categorical Sampling） · Stratified Sampling · Connection to Diffusion Models · 步骤 1： Uniform and inverse CDF sampling · 步骤 2： Rejection sampling · 步骤 3： Importance sampling · 步骤 4： Monte Carlo estimation of pi · 步骤 5： Metropolis-Hastings MCMC · 步骤 6： Gibbs sampling · 步骤 7： Temperature sampling · 步骤 8： Top-k and top-p sampling · 步骤 9： Reparameterization trick · 步骤 10： Gumbel-Softmax"
      },
      {
        "name": "Linear Systems",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/17-linear-systems/",
        "summary": "求解 Ax = b 是数学中最古老的问题之一，而它至今仍在运行你的 Neural Network。",
        "keywords": "Ax = b 在几何上意味着什么 · column picture vs row picture · Gaussian elimination · Partial pivoting：为什么重要 · LU decomposition · QR decomposition · Cholesky decomposition · Least squares：当 Ax = b 没有精确解时 · Normal equations = linear regression · Pseudoinverse (Moore-Penrose) · Condition number · Iterative methods：conjugate gradient · The full picture：何时使用哪种方法 · Connection to ML · 步骤 1： Gaussian elimination with partial pivoting · 步骤 2： LU decomposition · 步骤 3： Cholesky decomposition · 步骤 4： Least squares via normal equations · 步骤 5： Condition number"
      },
      {
        "name": "Convex Optimization",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/18-convex-optimization/",
        "summary": "凸问题只有一个谷底。Neural Network 有数百万个。理解这种差异很重要。",
        "keywords": "凸集 · 凸函数 · 测试凸性 · 为什么凸性重要 · ML 中的凸与非凸 · Hessian Matrix · Newton's method · 约束优化 · Lagrange multipliers · KKT conditions · Regularization 作为约束优化 · Duality · 为什么 Deep Learning 尽管非凸仍能工作 · 实践中的二阶方法 · 步骤 1：凸性检查器 · 步骤 2：用于 2D 的 Newton's method · 步骤 3：Lagrange multiplier 求解器 · 步骤 4：比较一阶与二阶"
      },
      {
        "name": "Complex Numbers for AI",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/19-complex-numbers/",
        "summary": "-1 的平方根并不“虚”。它是旋转、频率以及半个信号处理领域的关键。",
        "keywords": "什么是复数？ · 复数运算 · 复平面 · 极坐标形式 · Euler's formula · 为什么 Euler's formula 对 ML 很重要 · 与 2D 旋转的联系 · Phasor 与旋转信号 · 单位根 · 与 DFT 的联系 · 为什么 i 并不“虚” · 复指数 vs 三角函数 · 与 Transformer 的联系 · 步骤 1：Complex 类 · 步骤 2：极坐标转换与 Euler's formula · 步骤 3：旋转 · 步骤 4：基于复数运算的 DFT · 步骤 5：Inverse DFT · 步骤 6：单位根"
      },
      {
        "name": "The Fourier Transform",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/20-fourier-transform/",
        "summary": "每个 signal 都是 sine waves 的叠加。Fourier transform 会告诉你是哪一些。",
        "keywords": "The DFT definition · 每个系数的含义 · Inverse DFT · The FFT: making it fast · Spectral analysis · Frequency resolution · The convolution theorem · Windowing · DFT properties · 与 positional encodings 的联系 · Connection to CNNs · Spectrograms 和 Short-Time Fourier Transform · Aliasing · Zero-padding 不会提高分辨率 · 步骤 1： DFT from scratch · 步骤 2： Inverse DFT · 步骤 3： FFT (Cooley-Tukey) · 步骤 4： Spectral analysis helpers"
      },
      {
        "name": "Graph Theory for ML",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/21-graph-theory/",
        "summary": "Graph 是关系的数据结构。如果你的数据包含连接，你就需要 graph theory。",
        "keywords": "Graphs: Nodes and Edges · The Adjacency Matrix · Degree · BFS and DFS · The Graph Laplacian · Spectral Properties · Message Passing · 概念与 ML 应用 · 步骤 1：从零实现 Graph 类 · 步骤 2： BFS and DFS · 步骤 3：Connected components 和 Laplacian eigenvalues · 步骤 4: Spectral clustering · 步骤 5： Message passing · numpy spectral analysis"
      },
      {
        "name": "Stochastic Processes",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/01-math-foundations/22-stochastic-processes/",
        "summary": "具有结构的随机性。random walks、Markov chains 和 diffusion models 背后的数学。",
        "keywords": "Random Walks · Markov Chains · 与 Language Models 的联系 · Brownian Motion · Langevin Dynamics · MCMC: Markov Chain Monte Carlo · Stochastic Processes in AI · 步骤 1： Random walk simulator · 步骤 2： Markov chain · 步骤 3： Langevin dynamics · 步骤 4： Metropolis-Hastings · 用于 transition matrices 的 numpy · 与真实框架的连接 · 验证 Markov chain convergence"
      }
    ]
  },
  {
    "id": 2,
    "name": "ML Fundamentals",
    "status": "complete",
    "desc": "Classical ML —— 仍然是大多数 production AI 的主干。",
    "lessons": [
      {
        "name": "What Is Machine Learning",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/01-what-is-machine-learning/",
        "summary": "Machine Learning 是教会计算机在数据中寻找模式，而不是手写规则。",
        "keywords": "从数据中学习，而不是从规则中学习 · Machine Learning 的三种类型 · 超越三大类型 · Classification vs Regression · ML 工作流 · Training、Validation 和 Test 划分 · Overfitting vs Underfitting · Bias-Variance Tradeoff · No Free Lunch Theorem · 什么时候不要使用 Machine Learning · 步骤 1：从零实现 Nearest Centroid Classifier · 步骤 2：在 Synthetic Data 上训练 · 步骤 3：与 Baseline 比较 · 为什么这很重要 · 步骤 4：Centroid Classifier 做不到什么"
      },
      {
        "name": "Linear Regression from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/02-linear-regression/",
        "summary": "Linear regression 会在你的数据中画出最佳直线。它是 machine learning 的 “hello world”。",
        "keywords": "Model · Cost Function (Mean Squared Error) · Gradient Descent · Normal Equation（闭式解） · Multiple Linear Regression · Polynomial Regression · R-Squared Score · Regularization 预览 (Ridge Regression) · 步骤 1：生成示例数据 · 步骤 2：使用 Gradient Descent 从零实现 linear regression · 步骤 3：Normal equation（闭式解） · 步骤 4：Multiple linear regression · 步骤 5：Polynomial regression · 步骤 6：Ridge regression (L2 regularization)"
      },
      {
        "name": "Logistic Regression & Classification",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/03-logistic-regression/",
        "summary": "Logistic regression 将一条直线弯成 S-curve，用概率回答是或否的问题。",
        "keywords": "为什么 Linear Regression 不适合 Classification · Sigmoid Function · Logistic Regression = Linear Model + Sigmoid · Binary Cross-Entropy Loss · Logistic Regression 的 Gradient Descent · Decision Boundary · 使用 Softmax 进行 Multi-Class Classification · Evaluation Metrics · 步骤 1：Sigmoid function 与数据生成 · 步骤 2：从零实现 Logistic Regression · 步骤 3： 从零实现 confusion matrix 和 metrics · 步骤 4：Decision boundary 分析 · 步骤 5: 使用 softmax 处理 multi-class · 步骤 6： Threshold tuning"
      },
      {
        "name": "Decision Trees & Random Forests",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/04-decision-trees/",
        "summary": "Decision tree 只是一个流程图。但由许多 tree 组成的 forest，是 ML 中最强大的工具之一。",
        "keywords": "Decision tree 做什么 · Split criteria：衡量 impurity · Splitting 如何工作 · 停止条件 · 用于 Regression 的 decision trees · Random forests：ensemble 的力量 · Feature importance · Tree 何时胜过 Neural Network · 步骤 1：Gini impurity 和 entropy · 步骤 2：找到最佳 split · 步骤 3：构建 DecisionTree class · 步骤 4：构建 RandomForest class"
      },
      {
        "name": "Support Vector Machines",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/05-support-vector-machines/",
        "summary": "在两个类别之间找到最宽的街道。这就是全部思想。",
        "keywords": "最大间隔 classifier · Support vectors：关键的少数点 · Soft margin: 使用 C parameter 处理噪声 · Hinge loss：SVM 的 Loss Function · 用 gradient descent 训练 linear SVM · dual formulation 和 kernel trick · SVM for regression (SVR) · 为什么 SVMs 输给了 Deep Learning（以及它们什么时候仍然胜出） · 步骤 1： Hinge loss and gradient · 步骤 2： Linear SVM via gradient descent · 步骤 3： Kernel functions · 步骤 4： Margin and support vector identification"
      },
      {
        "name": "KNN & Distance Metrics",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/06-knn-and-distances/",
        "summary": "存储一切。通过查看你的邻居来预测。这是最简单且真正有效的算法。",
        "keywords": "How KNN works · Choosing K · Distance metrics · Weighted KNN · 维度灾难 · KD-trees：快速 nearest neighbor 搜索 · Ball trees: 更适合中等维度 · Lazy learning vs eager learning · KNN for regression · 步骤 1： Distance functions · 步骤 2： KNN classifier and regressor · 步骤 3： KD-tree for efficient search · 步骤 4： Feature scaling"
      },
      {
        "name": "Unsupervised Learning: K-Means, DBSCAN",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/07-unsupervised-learning/",
        "summary": "没有标签，没有老师。算法自行发现结构。",
        "keywords": "Clustering：把相似的事物分到一起 · K-Means：常用主力方法 · 选择 K · DBSCAN：基于密度的 Clustering · Hierarchical Clustering · Gaussian Mixture Models (GMM) · 何时使用哪种方法 · 使用 Clustering 做 Anomaly Detection · 步骤 1：从头实现 K-Means · 步骤 2：Elbow method 和 silhouette score · 步骤 3：从头实现 DBSCAN · 步骤 4：Gaussian Mixture Model（EM algorithm） · 步骤 5：生成测试数据并运行所有内容"
      },
      {
        "name": "Feature Engineering & Selection",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/08-feature-engineering/",
        "summary": "一个好的 Feature 抵得上一千个数据点。",
        "keywords": "Feature Pipeline · 数值 Feature · Categorical Features · 文本 Feature · 缺失值 · Feature Interaction · Feature Selection · 步骤 1：从零实现数值变换 · 步骤 2：从零实现 categorical encoding · 步骤 3：从零实现文本 Feature · 步骤 4：从零实现缺失值 imputation · 步骤 5：从零实现 Feature Selection · 步骤 6：完整 pipeline 和 demo"
      },
      {
        "name": "Model Evaluation: Metrics, Cross-Validation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/09-model-evaluation/",
        "summary": "一个 model 的好坏，取决于你衡量它的方式。",
        "keywords": "Train, Validation, Test · K-Fold Cross-Validation · Classification 指标 · Regression 指标 · Learning Curves · Validation Curves · 常见评估错误 · 步骤 1： Train/validation/test split · 第 2 步：K-fold 和 stratified K-fold cross-validation · 步骤 3： Confusion matrix 和 Classification 指标 · 步骤 4： Regression 指标 · 步骤 5： Learning curves · 步骤 6： 一个用于测试的简单 classifier，以及完整 demo"
      },
      {
        "name": "Bias, Variance & the Learning Curve",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/10-bias-variance/",
        "summary": "每一种模型误差都来自三个来源之一：Bias、Variance 或噪声。你只能控制前两者。",
        "keywords": "Bias: 系统性误差 · Variance: 对训练数据的敏感性 · The Decomposition · Model Complexity vs Error · 作为 Bias-Variance 控制的 Regularization · Double Descent: 现代视角 · Diagnosing Your Model · Practical Strategies · Ensemble Methods 和方差降低 · Learning Curves · 如何生成 Learning Curves · 步骤 1： 从已知函数生成合成数据 · 步骤 2: Bootstrap Sampling 和 Polynomial Fitting · 步骤 3： Computing Bias^2, Variance Decomposition · 步骤 4： Learning Curves · 第 5 步：Regularization Sweep · Validation Curve：扫描 Model Complexity · Learning Curve：扫描 Training Set Size · 使用 Regularization 扫描的 Cross-Validation · 整合起来：完整的诊断 Workflow"
      },
      {
        "name": "Ensemble Methods: Boosting, Bagging, Stacking",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/11-ensemble-methods/",
        "summary": "一组 weak learners，如果正确组合，就会成为一个 strong learner。这不是比喻。这是一个定理。",
        "keywords": "为什么 Ensembles 有效 · Bagging (Bootstrap Aggregating) · Boosting（顺序式 Error Correction） · AdaBoost · Gradient Boosting · XGBoost：为什么它主导 Tabular Data · Stacking (Meta-Learning) · Voting · 步骤 1： Decision Stump（Base Learner） · 步骤 2： 从零实现 AdaBoost · 步骤 3： 从零实现 Gradient Boosting · 步骤 4： 与 sklearn 比较 · 何时使用每种方法 · Tabular Data 的 Production Stack"
      },
      {
        "name": "Hyperparameter Tuning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/12-hyperparameter-tuning/",
        "summary": "Hyperparameters 是训练开始前你要调节的旋钮。调得好不好，决定了模型是平庸还是出色。",
        "keywords": "Parameters vs Hyperparameters · Grid Search · Random Search · Bayesian Optimization · Early Stopping · Learning Rate Schedulers · Hyperparameter Importance · Practical Strategy · Cross-Validation 集成 · Practical Tips · 步骤 1：从零实现 Grid Search · 步骤 2： 从零实现 Random Search · 步骤 3：Bayesian Optimization（简化版） · 步骤 4: 比较所有方法 · Optuna in Practice · Optuna with Pruning · sklearn's Built-in Tuners · Hyperparameter Tuning 中的常见错误"
      },
      {
        "name": "ML Pipelines & Experiment Tracking",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/13-ml-pipelines/",
        "summary": "模型不是产品。Pipeline 才是。Pipeline 覆盖从 raw data 到 deployed prediction 的全部过程，并且每一步都必须可复现。",
        "keywords": "What a Pipeline Is · 数据泄漏：沉默的杀手 · sklearn Pipeline · ColumnTransformer：不同列使用不同 Pipelines · Experiment Tracking · Model Versioning · Data Versioning with DVC · Reproducible Experiments · 从 Notebook 到 Production Pipeline · Common Pipeline Mistakes · 步骤 1： Custom Transformer · 步骤 2：从零构建 Pipeline · 步骤 3: 使用 Pipeline 进行 Cross-Validation · 第 4 步：使用 sklearn 的完整 Production Pipeline"
      },
      {
        "name": "Naive Bayes",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/14-naive-bayes/",
        "summary": "“naive” 假设是错误的，但它依然有效。这正是它的美妙之处。",
        "keywords": "Bayes' Theorem（快速回顾） · Naive Independence Assumption · Why It Still Works · The Math Step by Step · Three Variants · When to Use Each Variant · Laplace Smoothing · Log-Space Computation · Naive Bayes vs Logistic Regression · Classification Pipeline · MultinomialNB · GaussianNB · Demo: Text Classification · Demo: Continuous Features · Prediction Speed · TF-IDF with Naive Bayes · 用于短文本的 BernoulliNB · Calibrating NB Probabilities · Common Gotchas · When Naive Bayes Fails"
      },
      {
        "name": "Time Series Fundamentals",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/15-time-series/",
        "summary": "过去的表现确实可以预测未来结果 -- 前提是你先检查平稳性。",
        "keywords": "时间序列有何不同 · 时间序列的组成部分 · 平稳性 · 自相关 · 滞后特征：把时间序列转换为监督学习 · Walk-Forward Validation · ARIMA 直觉 · 何时使用什么 · 预测 Horizon 和策略 · 时间序列中的常见错误 · 滞后特征创建器 · Walk-Forward Cross-Validation · 简单 Autoregressive 模型 · 平稳性检查 · 自相关 · sklearn TimeSeriesSplit · 评估指标 · Rolling Features · 你必须击败的 Baseline · 实用建议"
      },
      {
        "name": "Anomaly Detection",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/16-anomaly-detection/",
        "summary": "Normal 很容易定义。Abnormal 就是任何不符合它的东西。",
        "keywords": "Anomalies 的类型 · Unsupervised 表述 · Supervised vs Unsupervised：权衡 · Z-Score 方法 · IQR 方法 · Isolation Forest · Local Outlier Factor (LOF) · 对比 · 评估挑战 · Anomaly Detection Pipeline · Z-Score Detector · IQR Detector · 从零实现 Isolation Forest · Demo 场景 · sklearn Contamination Parameter · One-Class SVM · Autoencoder Approach（预览） · Ensemble Anomaly Detection · 生产环境考虑 · 选择 Threshold · 扩展到生产环境"
      },
      {
        "name": "Handling Imbalanced Data",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/17-imbalanced-data/",
        "summary": "当你的数据有 99% 都是“正常”时，accuracy 就是一个谎言。",
        "keywords": "为什么 Accuracy 会失败 · 更好的指标 · 不平衡数据 Pipeline · SMOTE: Synthetic Minority Oversampling Technique · Sampling 策略对比 · Class Weights · Threshold Tuning · Cost-Sensitive Learning · 决策流程图 · 步骤 1：生成一个不平衡数据集 · 步骤 2：从零实现 SMOTE · 步骤 3：Random oversampling 和 undersampling · 步骤 4：带 class weights 的 Logistic regression · 步骤 5：Threshold tuning · 步骤 6：评估函数 · 步骤 7：比较所有方法"
      },
      {
        "name": "Feature Selection",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/02-ml-fundamentals/18-feature-selection/",
        "summary": "更多 features 并不更好。正确的 features 才更好。",
        "keywords": "Feature Selection 的三类方法 · Variance Threshold · Mutual Information · Recursive Feature Elimination (RFE) · L1 (Lasso) Regularization · Tree-Based Feature Importance · Permutation Importance · Comparison Table · Decision Flowchart · 步骤 1： Generate synthetic data with known feature structure · 步骤 2： Variance threshold · 步骤 3： Mutual information (discrete) · 步骤 4： Recursive Feature Elimination · 步骤 5： L1 feature selection · 步骤 6： Tree-based importance (simple decision tree) · 步骤 7： Run all methods and compare"
      }
    ]
  },
  {
    "id": 3,
    "name": "Deep Learning Core",
    "status": "complete",
    "desc": "从 first principles 构建 Neural networks。在你构建一个之前，不使用 frameworks。",
    "lessons": [
      {
        "name": "The Perceptron: Where It All Started",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/01-the-perceptron/",
        "summary": "Perceptron 是 Neural Network 的原子。把它拆开，你会看到 weights、一个 bias，以及一次 decision。",
        "keywords": "一个 Neuron，一个 Decision · The Decision Boundary · The Learning Rule · The XOR Problem · 步骤 1：The Perceptron class · 步骤 2：在 logic gates 上训练 · 步骤 3：观察 XOR 失败 · 步骤 4：用 two layers 解决 XOR · 步骤 5：训练一个 Two-Layer Network"
      },
      {
        "name": "Multi-Layer Networks & Forward Pass",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/02-multi-layer-networks/",
        "summary": "一个神经元画出一条线。把它们堆叠起来，你就能画出任何东西。",
        "keywords": "层：输入、Hidden、输出 · 神经元与激活 · Forward Pass：数据如何流动 · Matrix 维度 · Universal Approximation Theorem · 可组合性 · 步骤 1： Sigmoid 激活 · 步骤 2： Layer Class · 步骤 3： Network Class · 步骤 4： 使用手工调好的权重解决 XOR · 步骤 5： 圆形分类"
      },
      {
        "name": "Backpropagation from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/03-backpropagation/",
        "summary": "Backpropagation 是让学习成为可能的算法。没有它，Neural Network 只是一台昂贵的随机数生成器。",
        "keywords": "Chain Rule，应用到 Network 上 · Computational Graphs · Forward vs Backward · Gradient 在 Network 中的流动 · Vanishing Gradients · 推导 2-Layer Network 的 Gradient · 步骤 1： Value Node · 步骤 2： 带 Backward Function 的 Operation · 步骤 3： Sigmoid and Loss · 步骤 4： Backward Pass · 步骤 5： Layer and Network · 步骤 6： 在 XOR 上训练 · 步骤 7： Circle Classification"
      },
      {
        "name": "Activation Functions: ReLU, Sigmoid, GELU & Why",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/04-activation-functions/",
        "summary": "没有非线性，你的 100-layer network 只是一次精致的 Matrix multiply。Activation 是让 Neural Network 能够用曲线思考的门。",
        "keywords": "为什么非线性是必要的 · Sigmoid · Tanh · ReLU：突破 · Leaky ReLU · GELU：现代默认选择 · Swish / SiLU · Softmax：输出 Activation · 形状对比 · Gradient Flow 对比 · 什么时候用哪种 Activation · 步骤 1：实现所有 Activation Functions 及其 Derivatives · 步骤 2：可视化 Gradients 在哪里死亡 · 步骤 3：Vanishing Gradient 实验 · 步骤 4：Dead Neuron 检测器 · 步骤 5：训练对比——Sigmoid vs ReLU vs GELU"
      },
      {
        "name": "Loss Functions: MSE, Cross-Entropy, Contrastive",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/05-loss-functions/",
        "summary": "你的 Neural Network 做出一个预测。ground truth 却给出不同答案。它错得有多离谱？那个数字就是 Loss。选错 Loss Function，你的模型就会完全优化错误的目标。",
        "keywords": "Mean Squared Error (MSE) · Cross-Entropy Loss · 为什么 MSE 不适合 Classification · Label Smoothing · Contrastive Loss · Focal Loss · Loss Function 决策树 · Loss Landscape · 步骤 1： MSE 及其 Gradient · 步骤 2：Binary Cross-Entropy · 步骤 3： 带 Softmax 的 Categorical Cross-Entropy · 步骤 4： Label Smoothing · 步骤 5： Contrastive Loss（简化版 InfoNCE） · 步骤 6： Classification 上的 MSE vs Cross-Entropy"
      },
      {
        "name": "Optimizers: SGD, Momentum, Adam, AdamW",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/06-optimizers/",
        "summary": "Gradient Descent 告诉你该往哪个方向移动。它没有说明要走多远，也没有说明要走多快。SGD 是指南针。Adam 是带交通数据的 GPS。",
        "keywords": "Stochastic Gradient Descent (SGD) · Momentum · RMSProp · Adam: Momentum + RMSProp · AdamW: 正确处理 Weight Decay · Learning Rate: 最重要的 Hyperparameter · Optimizer 对比 · 每种 Optimizer 何时胜出 · 步骤 1： Vanilla SGD · 步骤 2： 带 Momentum 的 SGD · 步骤 3： Adam · 步骤 4： AdamW · 步骤 5： 训练对比"
      },
      {
        "name": "Regularization: Dropout, Weight Decay, BatchNorm",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/07-regularization/",
        "summary": "你的模型在训练数据上达到 99%，但在测试数据上只有 60%。它记住了数据，而不是学会了规律。Regularization 是你对复杂度征收的税，用来迫使模型泛化。",
        "keywords": "The Overfitting Spectrum · Dropout · Weight Decay (L2 Regularization) · Batch Normalization · Layer Normalization · RMSNorm · Normalization Comparison · 作为 Regularization 的 Data Augmentation · Early Stopping · When to Apply What · 步骤 1： Dropout (Train and Eval Mode) · 步骤 2： L2 Weight Decay · 步骤 3： Batch Normalization · 步骤 4： Layer Normalization · 步骤 5： RMSNorm · 步骤 6： Training With and Without Regularization"
      },
      {
        "name": "Weight Initialization & Training Stability",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/08-weight-initialization/",
        "summary": "初始化错了，训练根本无法开始。初始化对了，50 层也能像 3 层一样平稳训练。",
        "keywords": "The Symmetry Problem · Variance Propagation Through Layers · Xavier/Glorot Initialization · Kaiming/He Initialization · Transformer Initialization · 穿过 50 层时的 Activation Magnitude · Choosing the Right Init · 步骤 1： Initialization Strategies · 步骤 2： Activation Functions · 步骤 3： Forward Pass Through 50 Layers · 步骤 4： The Experiment · 步骤 5： Symmetry Demonstration · 步骤 6： Layer-by-Layer Magnitude Report"
      },
      {
        "name": "Learning Rate Schedules & Warmup",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/09-learning-rate-schedules/",
        "summary": "learning rate 是唯一最重要的 hyperparameter。不是 architecture。不是 dataset size。不是 activation function。是 learning rate。如果你什么都不调，就调它。",
        "keywords": "Constant Learning Rate · Step Decay · Cosine Annealing · Warmup：为什么要从小开始 · Linear Warmup + Cosine Decay · 1cycle Policy · Schedule 形状 · 决策流程图 · 已发表 Models 中的真实数值 · 步骤 1：Schedule Functions · 步骤 2：可视化所有 Schedules · 步骤 3：训练 Network · 步骤 4：比较所有 Schedules · 步骤 5：LR 过高 vs 过低"
      },
      {
        "name": "Build Your Own Mini Framework",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/10-mini-framework/",
        "summary": "你已经构建过 neurons、layers、networks、backprop、activations、Loss Function、Optimizers、regularization、initialization 和 LR schedules。它们都是分散的独立部件。现在把它们连接成一个 framework。不是 PyTorch。不是 TensorFl…",
        "keywords": "Module Abstraction · Sequential Container · 训练 vs Evaluation 模式 · Optimizer · DataLoader · Framework Architecture · Training Loop · Module Hierarchy · 步骤 1： Module Base Class · 步骤 2： Linear Layer · 步骤 3：Activation Modules · 步骤 4： Dropout Module · 步骤 5： BatchNorm Module · 步骤 6：Sequential Container · 步骤 7： Loss Functions · 步骤 8: SGD 和 Adam Optimizers · 步骤 9： DataLoader · 第 10 步：在 Circle Classification 上训练 4-Layer Network"
      },
      {
        "name": "Introduction to PyTorch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/11-intro-to-pytorch/",
        "summary": "你已经用活塞和曲轴造出了引擎。现在来学习大家真正会开的那一台。",
        "keywords": "Why PyTorch Won · Tensors · Autograd · nn.Module · Loss Functions 与 Optimizers · The Training Loop · Dataset and DataLoader · GPU Training · 对比：Mini Framework vs PyTorch vs JAX · 步骤 1：从原始文件加载 MNIST · 步骤 2： Define the Model · 步骤 3： Training Loop · 步骤 4：把所有部分连接起来 · 快速对比: Mini Framework vs PyTorch · Saving and Loading Models · Learning Rate Scheduling"
      },
      {
        "name": "Introduction to JAX",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/12-intro-to-jax/",
        "summary": "PyTorch 会修改 tensors。TensorFlow 会构建 graphs。JAX 会编译纯函数。最后这一点会改变你思考 Deep Learning 的方式。",
        "keywords": "JAX 哲学 · jax.numpy：熟悉的表层 · jax.grad：函数式 Autodiff · jit：编译到 XLA · vmap：自动 Vectorization · pmap：跨设备 Data Parallelism · Pytrees：通用数据结构 · 函数式 vs 面向对象 · JAX 生态 · 什么时候用 JAX，什么时候用 PyTorch · JAX 中的随机数 · 步骤 1：Setup 和数据 · 步骤 2：初始化参数 · 步骤 3：Forward Pass · 步骤 4：JIT-Compiled 训练 Step · 步骤 5：训练循环 · Flax：Google 标准 · Equinox：Pythonic 替代方案 · Optax：可组合 Optimizers"
      },
      {
        "name": "Debugging Neural Networks",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/03-deep-learning-core/13-debugging-neural-networks/",
        "summary": "你的 network 编译成功了。它运行了。它产生了一个数字。这个数字是错的，而且什么都没有崩溃。欢迎来到最难的一类 debugging：没有错误消息的 debugging。",
        "keywords": "Debugging Mindset · Symptom 1：Loss 不下降 · Symptom 2：Loss 下降但 Model 很差 · Symptom 3：Loss 中出现 NaN 或 Inf · Technique 1：Gradient Checking · Technique 2：Activation Statistics · Technique 3：Gradient 流可视化 · Technique 4：Overfit-One-Batch Test · Technique 5：Learning Rate Finder · 常见 PyTorch Bugs · Master Debugging Table · 步骤 1：NetworkDebugger Class · 步骤 2：Overfit-One-Batch Test · 步骤 3：Learning Rate Finder · 步骤 4：Gradient Checker · 步骤 5：故意破坏的 Networks · PyTorch Built-in Tools · Weights & Biases 集成 · TensorBoard · Debug Checklist（完整 Training 之前）"
      }
    ]
  },
  {
    "id": 4,
    "name": "Computer Vision",
    "status": "complete",
    "desc": "从 pixels 到理解 —— image、video、3D、VLMs 和 world models。",
    "lessons": [
      {
        "name": "Image Fundamentals: Pixels, Channels, Color Spaces",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/01-image-fundamentals/",
        "summary": "图像是光采样的 Tensor。你以后会使用的每一个 vision model，都从这个事实开始。",
        "keywords": "完整预处理 pipeline 一览 · Pixel 是 sample，不是正方形 · 为什么有三个 Channel · 两种 layout convention：HWC 和 CHW · Byte range 和 dtype · Color spaces 以及它们为什么存在 · Aspect ratio、resizing 和 interpolation · 步骤 1：加载图像并检查 shape · 步骤 2：拆分 Channel 并重排 layout · 步骤 3：Grayscale 和 HSV conversion · 步骤 4：Normalize、standardize 并反向还原 · 步骤 5：用三种 interpolation method resize"
      },
      {
        "name": "Convolutions from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/02-convolutions-from-scratch/",
        "summary": "convolution 是一个很小的 dense layer，你把它滑过一张图像，并在每个位置共享同一组权重。",
        "keywords": "One kernel, sliding · Output size formula · Padding · Stride · Multiple input channels · The im2col trick · Receptive field · 步骤 1： Pad an array · 步骤 2： 使用嵌套循环实现 2D convolution · 步骤 3: 用手工设计的 kernel 验证 · 步骤 4： im2col · 步骤 5：通过 im2col + matmul 实现快速 conv · 步骤 6：一组手工设计的 kernels"
      },
      {
        "name": "CNNs: LeNet to ResNet",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/03-cnns-lenet-to-resnet/",
        "summary": "过去三十年里每个重要的 CNN，本质上都是同一个 conv–nonlinearity–downsample 配方，再加上一个新想法。按顺序学会这些想法。",
        "keywords": "改变 vision 的四个想法 · LeNet-5 (1998) · AlexNet (2012) · VGG (2014) · Inception (2014，同年) · Degradation problem · ResNet (2015) · 为什么 residuals 的意义超越 vision · 步骤 1： LeNet-5 · 步骤 2： 一个 VGG block · 步骤 3： 一个 ResNet BasicBlock · 步骤 4： 一个 tiny ResNet · 步骤 5： 比较 parameter-to-feature efficiency"
      },
      {
        "name": "Image Classification",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/04-image-classification/",
        "summary": "classifier 是一个从 pixels 到 classes 上的 probability distribution 的函数。其他一切都是管线工作。",
        "keywords": "Classification pipeline · Cross-entropy、logits 与 softmax · 为什么 augmentation 有效 · Mixup 与 cutmix · Label smoothing · Accuracy 之外的 evaluation · 步骤 1：确定性的 synthetic dataset · 步骤 2：Normalisation 与 augmentation · 步骤 3：Mixup · 步骤 4：Training loop · 步骤 5：组装起来 · 步骤 6：阅读 confusion matrix"
      },
      {
        "name": "Transfer Learning & Fine-Tuning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/05-transfer-learning/",
        "summary": "别人已经花了上百万 GPU 小时，教会一个 Neural Network 识别边缘、纹理和物体部件是什么样子。在训练你自己的模型之前，你应该借用这些 features。",
        "keywords": "特征提取 vs fine-tuning · Why freezing works at all · Discriminative learning rates · The BatchNorm problem · Head design · Layer-wise LR decay · What to evaluate · 步骤 1： Load a pretrained backbone and inspect it · 步骤 2： Feature extraction — freeze everything, replace the head · 步骤 3： Discriminative fine-tuning · 步骤 4： BatchNorm handling · 步骤 5： A minimal end-to-end fine-tuning loop · 步骤 6： Progressive unfreezing"
      },
      {
        "name": "Object Detection — YOLO from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/06-object-detection-yolo/",
        "summary": "Detection 是 Classification 加 Regression，在 feature map 的每个位置运行，然后用 non-maximum suppression 清理结果。",
        "keywords": "Detection 作为 dense prediction · 为什么需要 grids 和 anchors · 解码 predictions · IoU · Non-maximum suppression · Loss · Detection metrics · 步骤 1： IoU · 步骤 2: Non-max suppression · 步骤 3：Box encoding and decoding · 步骤 4： 一个最小 YOLO head · 步骤 5：ground-truth assignment · 步骤 6： 三个 losses · 步骤 7: Inference pipeline"
      },
      {
        "name": "Semantic Segmentation — U-Net",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/07-semantic-segmentation-unet/",
        "summary": "Segmentation 是对每个 pixel 进行 Classification。U-Net 通过将下采样 encoder 与上采样 decoder 配对，并在二者之间连接 skip connections，使这件事变得可行。",
        "keywords": "语义 vs 实例 vs 全景 · The U-Net shape · Transposed vs bilinear upsample · pixel grid 上的 Cross-entropy · Dice loss 以及为什么需要它 · Evaluation metrics · Input resolution 权衡 · 步骤 1： Encoder block · 步骤 2： Down and up blocks · 步骤 3： The U-Net · 步骤 4： Losses · 步骤 5： IoU metric · 步骤 6： Synthetic dataset for end-to-end verification · 步骤 7： Training loop"
      },
      {
        "name": "Instance Segmentation — Mask R-CNN",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/08-instance-segmentation-mask-rcnn/",
        "summary": "给 Faster R-CNN detector 加上一个很小的 mask branch，就得到了 instance segmentation。难点在 RoIAlign，而且它比看起来更难。",
        "keywords": "The architecture · Why RoIAlign, not RoIPool · The RPN in one paragraph · The mask head · Losses · Output format · 步骤 1： RoIAlign from scratch · 步骤 2： Compare to torchvision's RoIAlign · 步骤 3： Load a pretrained Mask R-CNN · 步骤 4： Run inference · 步骤 5： Swap the heads for a custom class count · 步骤 6： Freeze what does not need training"
      },
      {
        "name": "Image Generation — GANs",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/09-image-generation-gans/",
        "summary": "GAN 是两个 Neural Network 之间的固定博弈。一个负责绘制，一个负责评判。它们一起变得更好，直到绘制结果骗过评判者。",
        "keywords": "The two networks · The game · Non-saturating loss · DCGAN architecture rules · Failure modes 及其特征 · Evaluation · 步骤 1： Generator · 步骤 2： Discriminator · 步骤 3： Training step · 步骤 4：在 synthetic shapes 上运行完整 training loop · 步骤 5： Sampling · 步骤 6：Spectral normalisation"
      },
      {
        "name": "Image Generation — Diffusion Models",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/10-image-generation-diffusion/",
        "summary": "Diffusion Model 学习的是 denoise。训练它从含噪图像中去除一小部分 noise，反向重复这个过程一千次，你就得到了一个图像生成器。",
        "keywords": "forward process · 闭式跳转 · reverse process · 训练 Loss · sampler (DDPM) · 为什么是 1000 步 · DDIM：快 20 倍的 sampling · Time conditioning · 步骤 1： Noise schedule · 步骤 2: Forward Diffusion (q_sample) · 步骤 3： 一个小型 time-conditioned U-Net · 步骤 4： Training loop · 步骤 5： Sampler (DDPM) · 步骤 6： DDIM sampler（确定性，约快 20 倍）"
      },
      {
        "name": "Stable Diffusion — Architecture & Fine-Tuning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/11-stable-diffusion/",
        "summary": "Stable Diffusion 是一种 DDPM，它在预训练 VAE 的 latent space 中运行，通过 cross-attention 以文本为条件，使用快速确定性的 ODE solver 进行采样，并由 classifier-free guidance 引导。",
        "keywords": "The pipeline · Classifier-free guidance (CFG) · Latent space geometry · The U-Net architecture · LoRA fine-tuning · Schedulers you will see · 步骤 1： Text-to-image · 步骤 2： Swap the scheduler · 步骤 3： Image-to-image · 步骤 4： Inpainting · 步骤 5： LoRA loading · 步骤 6： LoRA training (sketch)"
      },
      {
        "name": "Video Understanding — Temporal Modeling",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/12-video-understanding/",
        "summary": "视频是一系列图像，加上将它们连接起来的物理规律。每个视频模型要么把时间视为额外的轴（3D conv），要么把它视为需要进行 Attention 的序列（Transformer），要么把它视为一次性提取并池化的特征（2D+pool）。",
        "keywords": "三类架构家族 · 2D + pool · 3D convolutions · 时空 Transformers · Frame sampling · Evaluation · 你会遇到的数据集 · 步骤 1：Frame sampler · 步骤 2：一个 2D+pool baseline · 步骤 3：I3D-style inflated 3D conv · 步骤 4：Factorised (2+1)D conv"
      },
      {
        "name": "3D Vision: Point Clouds, NeRFs",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/13-3d-vision-nerf/",
        "summary": "3D vision 有两种形式。Point cloud 是 sensor 的原始输出。NeRF 是学习得到的 volumetric field。两者都回答“空间中哪里有什么”。",
        "keywords": "Point clouds · The PointNet architecture · Neural Radiance Fields (NeRFs) · NeRF 中的 Positional encoding · Volumetric rendering · What replaced NeRFs · Datasets and benchmarks · 步骤 1： PointNet classifier · 步骤 2： Positional encoding · 步骤 3： Tiny NeRF MLP · 步骤 4： Volumetric rendering along a ray"
      },
      {
        "name": "Vision Transformers (ViT)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/14-vision-transformers/",
        "summary": "将图像切成 patches，把每个 patch 当作一个 word，运行标准 transformer。不要回头看。",
        "keywords": "流程 · Patch embedding · Class token · Positional embedding · Transformer encoder block · 为什么使用 pre-LN · Patch size 权衡 · DeiT 在 ImageNet-1k 上训练 ViT 的配方 · Swin vs ConvNeXt · MAE pretraining · 步骤 1： Patch embedding · 步骤 2： Transformer block · 步骤 3： ViT · 步骤 4： Sanity check — 单图像 inference"
      },
      {
        "name": "Real-Time Vision: Edge Deployment",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/15-real-time-edge/",
        "summary": "Edge inference 是让一个 90-accuracy model 在仅有 2 GB RAM 的设备上以 30 fps 运行的工程学科。每一个百分点的 accuracy 都要与毫秒级 latency 做交换。",
        "keywords": "三个预算 · Measurement discipline · FLOPs 作为 proxy · Quantisation 一段话说明 · Pruning 和 distillation · Inference runtimes · Edge architecture picker · 步骤 1： 正确测量 latency · 步骤 2： Parameter 和 FLOP counts · 步骤 3: Post-training static quantisation · 步骤 4： 导出到 ONNX · 步骤 5： Benchmark 并比较不同 regimes"
      },
      {
        "name": "Build a Complete Vision Pipeline",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/16-vision-pipeline-capstone/",
        "summary": "生产级 vision system 是由模型和规则组成的链条，并通过 data contract 串联起来。本阶段的组件已经齐备；这个 capstone 会把它们端到端连接起来。",
        "keywords": "The pipeline · 使用 Pydantic 定义 Data contract · 延迟花在哪里 · Failure modes · Batching · 步骤 1： Data contracts · 步骤 2: 一个最小 Pipeline 类 · 步骤 3：连接一个 detector 和一个 classifier · 步骤 4： FastAPI service · 步骤 5：Benchmark 这个 pipeline"
      },
      {
        "name": "Self-Supervised Vision — SimCLR, DINO, MAE",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/17-self-supervised-vision/",
        "summary": "Labels 是 supervised vision 的瓶颈。Self-supervised pretraining 移除了它们：从 100M 张无标注图像中学习视觉特征，再在 10k 张有标注图像上 fine-tune。",
        "keywords": "三个家族 · Contrastive learning（SimCLR） · Teacher-student（DINO） · Masked reconstruction（MAE） · 为什么是 75% 而不是 15% · Linear-probe evaluation · 步骤 1：Two-view augmentation pipeline · 步骤 2：InfoNCE loss · 步骤 3：Sanity check InfoNCE · 步骤 4：MAE-style masking"
      },
      {
        "name": "Open-Vocabulary Vision — CLIP",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/18-open-vocab-clip/",
        "summary": "将一个 image encoder 和一个 text encoder 一起训练，让匹配的 (image, caption) 对落在共享空间中的同一个点。这就是整个技巧。",
        "keywords": "Two towers · 目标 · SigLIP：更好的 Loss · Zero-shot classification · 2026 年 CLIP-style models 的使用场景 · 步骤 1：一个极小的 two-tower model · 步骤 2：Contrastive Loss · 步骤 3：Zero-shot classifier · 步骤 4：Sanity check"
      },
      {
        "name": "OCR & Document Understanding",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/19-ocr-document-understanding/",
        "summary": "OCR 是一个三阶段 pipeline —— 检测 text boxes、识别 characters，然后排布它们。每个现代 OCR system 都会重新排序这些阶段，或将它们合并。",
        "keywords": "经典 pipeline · 用一段话理解 CTC · 现代 end-to-end models · Layout parsing · Evaluation metrics · 步骤 1: CTC Loss + greedy decoder · 步骤 2：Tiny CRNN recogniser · 步骤 3： Synthetic OCR · 步骤 4： Training sketch"
      },
      {
        "name": "Image Retrieval & Metric Learning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/20-image-retrieval-metric/",
        "summary": "Retrieval system 会按 Embedding space 中的距离对候选项排序。Metric learning 是塑造这个空间的学科，使距离表达你想要的含义。",
        "keywords": "Retrieval at a glance · The four loss families · Triplet loss formally · Cosine similarity vs L2 · Recall@K · FAISS in one paragraph · instance-level vs category-level retrieval · 步骤 1： Triplet loss · 步骤 2： Semi-hard mining · 步骤 3： Recall@K · 步骤 4： Putting it together"
      },
      {
        "name": "Keypoint Detection & Pose Estimation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/21-keypoint-pose/",
        "summary": "一个 pose 是一组有序 keypoints。一个 keypoint detector 是一个 heatmap regressor。其他一切都是 bookkeeping。",
        "keywords": "Top-down vs bottom-up · Heatmap regression · Sub-pixel localisation · Part Affinity Fields (PAFs) · COCO keypoints · 2D vs 3D · 步骤 1： Gaussian heatmap target · 步骤 2： Tiny keypoint head · 步骤 3： Inference — extract keypoint coordinates · 步骤 4： Synthetic keypoint dataset · 步骤 5： Training"
      },
      {
        "name": "3D Gaussian Splatting from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/22-3d-gaussian-splatting/",
        "summary": "一个场景是一团由数百万个 3D Gaussians 组成的云。每个 Gaussian 都有 position、orientation、scale、opacity，以及一个依赖 viewing direction 的 colour。对它们进行 rasterise，通过 rasterisation 做 backprop，就完成了。",
        "keywords": "一个 Gaussian 携带什么 · 是 rasterisation，不是 ray marching · projection 步骤 · alpha-compositing 规则 · 为什么它是 differentiable 的 · Densification 与 pruning · 用一段话理解 spherical harmonics · 2026 年的生产技术栈 · 4D 与 generative 变体 · 步骤 1：一个 2D Gaussian · 步骤 2：2D splatting rasteriser · 步骤 3：一个可训练的 2D splat scene · 步骤 4：将 2D Gaussians 拟合到目标图像 · 步骤 5：从 2D 到 3D · 步骤 6：Spherical harmonics evaluation"
      },
      {
        "name": "Diffusion Transformers & Rectified Flow",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/23-diffusion-transformers-rectified-flow/",
        "summary": "U-Net 并不是 Diffusion 的秘密。把它替换为 Transformer，把 noise schedule 换成直线路径的 flow，你就突然得到了 SD3、FLUX，以及每一个 2026 年的 text-to-image model。",
        "keywords": "从 U-Net 到 Transformer · 用一段话解释 Rectified flow · AdaLN conditioning · SD3 和 FLUX 中的 text encoders · Classifier-free guidance 仍然成立 · Consistency、Turbo、Schnell、LCM · 2026 年的 Model landscape · 为什么这个阶段性转变很重要 · 步骤 1：带 AdaLN 的 DiT block · 步骤 2：一个 tiny DiT · 步骤 3：Rectified flow training · 步骤 4：Euler sampler · 步骤 5：端到端 smoke test"
      },
      {
        "name": "SAM 3 & Open-Vocabulary Segmentation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/24-sam3-open-vocab-segmentation/",
        "summary": "给模型一个 text prompt 和一张 image，即可获得每个匹配 object 的 masks。SAM 3 让这变成了一次单独的 forward pass。",
        "keywords": "三代模型 · 可 Prompt 的 Concept Segmentation · 关键架构组件 · 大规模训练 · SAM 3.1 Object Multiplex · 2026 年 Grounded SAM 仍然重要的场景 · YOLO-World vs SAM 3 · SAM-MI 效率 · 三个模型的输出格式 · 步骤 1：Prompt 构造 · 步骤 2：Post-processing helpers · 步骤 3：统一的 open-vocab segmentation interface · 步骤 4：Hugging Face SAM 3 用法（参考） · 步骤 5：衡量 Grounded SAM 2 免费提供了什么"
      },
      {
        "name": "Vision-Language Models (ViT-MLP-LLM)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/25-vision-language-models/",
        "summary": "Vision encoder 将图像转换为 tokens。MLP projector 将这些 tokens 映射到 LLM 的 embedding space。language model 完成剩下的工作。这个模式 — ViT-MLP-LLM — 就是 2026 年所有生产级 VLM 的共同结构。",
        "keywords": "ViT-MLP-LLM 架构 · DeepStack · 三个训练阶段 · 模型家族比较（2026 年初） · Visual agents · Agentic 能力 + RoPE 变体 · Alignment 问题 · 使用 LoRA / QLoRA 进行 fine-tuning · Spatial reasoning 仍然薄弱 · 步骤 1： Projector · 步骤 2： 端到端组装 ViT-MLP-LLM · 步骤 3： CMER 计算 · 步骤 4： Toy VLM classifier（可运行）"
      },
      {
        "name": "Monocular Depth & Geometry Estimation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/26-monocular-depth/",
        "summary": "depth map 是一张单通道图像，其中每个 pixel 表示到 camera 的距离。过去，如果没有 stereo 或 LiDAR，仅从一帧 RGB 预测它被认为是不可能的。到 2026 年，一个冻结的 ViT encoder 加上轻量级 head，就能达到与 ground truth 仅相差几个百分点的效果。",
        "keywords": "Relative vs metric depth · Encoder-decoder 模式 · 为什么单张图像也能产生 depth · Monocular depth 不能做什么 · 2026 年的 Depth Anything V3 · Marigold — 用于 depth 的 diffusion · Intrinsics 和 pinhole camera · Evaluation · 步骤 1： Depth metrics · 步骤 2：Scale-and-shift alignment · 步骤 3： 将 depth 提升为 point cloud · 步骤 4： 用 synthetic depth scene 做 smoke test · 步骤 5： Depth Anything V3 使用方式（reference）"
      },
      {
        "name": "Multi-Object Tracking & Video Memory",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/27-multi-object-tracking/",
        "summary": "Tracking 是 detection 加 association。检测每一帧。按 ID 将当前帧的 detections 匹配到上一帧的 tracks。",
        "keywords": "Tracking-by-detection · 一段话理解 Kalman filter · Hungarian algorithm · ByteTrack 的关键思想 · SAM 2 memory-based tracking · SAM 3.1 Object Multiplex · 需要掌握的三种 metrics · 步骤 1： 基于 IoU 的 cost matrix · 步骤 2： 最小 SORT 风格 tracker · 步骤 3： Synthetic trajectory test · 步骤 4： ID-switch metric"
      },
      {
        "name": "World Models & Video Diffusion",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/04-computer-vision/28-world-models-video-diffusion/",
        "summary": "一个能够预测场景未来几秒的视频模型，就是一个世界模拟器。把这个预测条件化在动作上，你就得到一个 learned game engine。",
        "keywords": "World Model 的三类体系 · Video DiT architecture · 基于动作的 Conditioning：latent action models · Physical plausibility · 自动驾驶 world models · 机器人技术栈：VLM + video model + inverse dynamics · Evaluation · 2026 年的模型版图 · 步骤 1： video 的 3D patchify · 步骤 2： 3D rotary position encoding · 步骤 3： Divided attention block · 步骤 4： 组合一个 tiny video DiT · 步骤 5： 检查 shapes"
      }
    ]
  },
  {
    "id": 5,
    "name": "NLP: Foundations to Advanced",
    "status": "complete",
    "desc": "语言是通向 intelligence 的接口。",
    "lessons": [
      {
        "name": "Text Processing: Tokenization, Stemming, Lemmatization",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/01-text-processing/",
        "summary": "语言是连续的。模型是离散的。Preprocessing 是桥梁。",
        "keywords": "Step 1: 一个 regex word tokenizer · Step 2: 一个 Porter stemmer（仅 step 1a） · Step 3: 一个基于 lookup 的 lemmatizer · Step 4: 把它们串起来 · NLTK · spaCy · 什么时候选哪个 · 没人提醒你的两个 failure modes"
      },
      {
        "name": "Bag of Words, TF-IDF & Text Representation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/",
        "summary": "先计数，再思考。到 2026 年，TF-IDF 在定义清晰的任务上仍然胜过 Embeddings。",
        "keywords": "步骤 1： build the vocabulary · 步骤 2： bag of words · 步骤 3： term frequency and document frequency · 步骤 4： TF-IDF · 步骤 5： L2-normalize rows · TF-IDF 仍然胜出的场景 (截至 2026 年) · When TF-IDF fails · Hybrid：TF-IDF 加权 Embedding"
      },
      {
        "name": "Word Embeddings: Word2Vec from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/",
        "summary": "一个词由它周围的词定义。基于这个想法训练一个浅层 net，几何结构就会显现出来。",
        "keywords": "步骤 1：从语料生成训练 pairs · 步骤 2：Embedding tables · 步骤 3：negative sampling objective · 步骤 4：在 toy corpus 上训练 · 步骤 5：analogy 技巧 · Word2Vec 在 2026 年仍然胜出的场景 · Word2Vec 的失败之处"
      },
      {
        "name": "GloVe, FastText & Subword Embeddings",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/",
        "summary": "Word2Vec 为每个词训练一个 Embedding。GloVe 对共现 Matrix 做 factorization。FastText Embedding 词的组成片段。BPE 连接到了 transformers。",
        "keywords": "GloVe：factorize 共现 Matrix · FastText：subword-aware Embeddings · BPE：学习得到的 subword vocabulary · 什么时候选择哪一个"
      },
      {
        "name": "Sentiment Analysis",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/",
        "summary": "经典的 NLP 任务。关于传统文本 Classification 你需要掌握的大部分内容，都会在这里出现。",
        "keywords": "步骤 1： 一个真实的迷你数据集 · 步骤 2： 从零实现 multinomial Naive Bayes · 步骤 3： 从零实现 logistic regression · 步骤 4： 处理否定（失效模式） · 步骤 5： 真正重要的评估指标 · 什么时候该使用 transformer · 可复现性陷阱（再次出现）"
      },
      {
        "name": "Named Entity Recognition (NER)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/",
        "summary": "把名称提取出来。听起来很简单，直到你遇到模糊边界、嵌套实体和领域术语。",
        "keywords": "步骤 1: BIO tagging helpers · 步骤 2：hand-crafted features · 步骤 3： 一个简单的 rule-based + dictionary baseline · 步骤 4： CRF 步骤（草图，不是完整实现） · 步骤 5： BiLSTM-CRF 增加了什么 · LLM-based NER（2026 年的选项） · 经典 NER 仍然胜出的地方 · 它会在哪些地方失效"
      },
      {
        "name": "POS Tagging & Syntactic Parsing",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/",
        "summary": "Grammar 一度不太流行。后来每条 LLM pipeline 都需要验证结构化抽取，它又回来了。",
        "keywords": "步骤 1： most-frequent-tag baseline · 步骤 2： bigram HMM tagger · 步骤 3： 为什么 modern taggers 能胜过它 · 步骤 4： dependency parsing sketch · 这在 2026 年仍然重要的地方"
      },
      {
        "name": "Text Classification — CNNs & RNNs for Text",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/",
        "summary": "Convolutions 学习 n-grams。Recurrences 负责记忆。两者都已被 attention 取代。两者在受限硬件上仍然重要。",
        "keywords": "步骤 1： PyTorch 中的 TextCNN · 步骤 2： LSTM classifier · 步骤 3： vanishing gradient 演示（直觉） · 步骤 4： 为什么这仍然不够"
      },
      {
        "name": "Sequence-to-Sequence Models",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/",
        "summary": "两个 RNN 假装自己是翻译器。它们撞上的 bottleneck，正是 Attention 存在的原因。",
        "keywords": "步骤 1： an encoder · 步骤 2： a decoder · 步骤 3： training loop with teacher forcing · 步骤 4： inference loop (greedy) · 步骤 5： the bottleneck, demonstrated · 什么时候仍然选择 RNN-based seq2seq · Exposure bias 及其缓解方法"
      },
      {
        "name": "Attention Mechanism — The Breakthrough",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/10-attention-mechanism/",
        "summary": "Decoder 不再盯着一个压缩摘要费力辨认，而是开始查看整个 source。此后的一切都是 attention 加 engineering。",
        "keywords": "步骤 1： additive（Bahdanau）attention · 步骤 2： Luong dot 和 general · 步骤 3： 一个完整的数值示例 · 步骤 4： 为什么这是通往 transformers 的桥梁 · Classical attention 什么时候仍然重要 · attention-weight-as-explanation 陷阱"
      },
      {
        "name": "Machine Translation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/11-machine-translation/",
        "summary": "Translation 是为 NLP 研究买单了三十年的任务，而且现在仍在继续买单。",
        "keywords": "步骤 1： 一个 pretrained MT call · 步骤 2： BLEU 和 chrF · 三层评估层级 (2026) · 步骤 3： production 中会坏在哪里 · 步骤 4： 为一个 domain 进行 fine-tuning"
      },
      {
        "name": "Text Summarization",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/12-text-summarization/",
        "summary": "Extractive 系统告诉你文档说了什么。Abstractive 系统告诉你作者想表达什么。任务不同，陷阱也不同。",
        "keywords": "步骤 1： TextRank（extractive） · 步骤 2： 使用 BART 做 abstractive · 步骤 3： ROUGE evaluation · ROUGE 之外（2026 summarization eval） · 步骤 4： factuality 问题"
      },
      {
        "name": "Question Answering Systems",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/13-question-answering/",
        "summary": "三类系统塑造了现代 QA。Extractive 找到 spans。Retrieval-augmented 将它们 grounding 到 documents 中。Generative 生成 answers。每一个现代 AI assistant 都是这三者的混合。",
        "keywords": "步骤 1： 使用 pretrained model 做 extractive QA · 步骤 2： 一个 retrieval-augmented pipeline（草图） · 步骤 3： 使用 RAG 做 generative · 步骤 4： 反映真实世界的 evaluation · RAGAS：2026 年的 production eval framework"
      },
      {
        "name": "Information Retrieval & Search",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/14-information-retrieval-search/",
        "summary": "BM25 精确但脆弱。Dense 覆盖面广，但会漏掉关键词。Hybrid 是 2026 年的默认选择。其他都是 tuning。",
        "keywords": "步骤 1： 从零实现 BM25 · 步骤 2： 使用 bi-encoder 做 dense retrieval · 步骤 3: Reciprocal Rank Fusion · 步骤 4：hybrid search + rerank · 步骤 5： evaluation · 2026 production RAG 中来之不易的经验"
      },
      {
        "name": "Topic Modeling: LDA, BERTopic",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/15-topic-modeling/",
        "summary": "LDA：documents 是 topics 的混合，topics 是 words 上的分布。BERTopic：documents 在 embedding space 中聚类，clusters 就是 topics。目标相同，分解方式不同。",
        "keywords": "Step 1: 通过 scikit-learn 实现 LDA · Step 2: BERTopic（生产） · Step 3: evaluation"
      },
      {
        "name": "Text Generation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/",
        "summary": "如果一个词令人意外，模型就不好。Perplexity 把意外程度变成数字。Smoothing 让它保持有限。",
        "keywords": "步骤 1： trigram 计数 · 步骤 2： Laplace smoothing · 步骤 3： Kneser-Ney（bigram，interpolated） · 步骤 4： 用 sampling 生成文本 · 步骤 5： perplexity"
      },
      {
        "name": "Chatbots: Rule-Based to Neural",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/",
        "summary": "ELIZA 用 pattern matches 回复。DialogFlow 映射 intents。GPT 从 weights 中作答。Claude 运行 tools 并进行验证。每个时代都解决了上一代最严重的失败。",
        "keywords": "步骤 1：rule-based pattern matching · 步骤 2：retrieval-based（FAQ） · 步骤 3：neural generation（baseline） · 步骤 4：LLM agent loop · 步骤 5：hybrid routing"
      },
      {
        "name": "Multilingual NLP",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/",
        "summary": "一个模型，100+ 种语言，其中大多数语言没有任何训练数据。跨语言迁移是 2020 年代的实用奇迹。",
        "keywords": "步骤 1： zero-shot 跨语言分类 · 步骤 2： 多语言 Embedding space · 步骤 3： few-shot fine-tuning 策略 · Tokenization 成本（低资源语言会出什么问题）"
      },
      {
        "name": "Subword Tokenization: BPE, WordPiece, Unigram, SentencePiece",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/19-subword-tokenization/",
        "summary": "Word Tokenizer 会在未见过的词上卡住。Character Tokenizer 会让序列长度暴涨。Subword Tokenizer 在两者之间取得平衡。每个现代 LLM 都随附一种。",
        "keywords": "步骤 1： 从零实现 BPE · 步骤 2： 用学到的 merges 进行 encode · 步骤 3： 实践中的 SentencePiece · 步骤 4： 用于 OpenAI-compatible vocab 的 tiktoken"
      },
      {
        "name": "Structured Outputs & Constrained Decoding",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/",
        "summary": "向 LLM 请求 JSON。大多数时候会得到 JSON。在生产环境中，“大多数”就是问题所在。Constrained decoding 会在采样前编辑 logits，把“大多数”变成“总是”。",
        "keywords": "反直觉的结果 · 代价高昂的陷阱 · 步骤 1：从零开始做 regex-constrained generation · 步骤 2：用 Outlines 处理 JSON Schema · 步骤 3：用 Instructor 做 provider-agnostic Pydantic · 步骤 4：原生 vendor APIs"
      },
      {
        "name": "NLI & Textual Entailment",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/",
        "summary": "\"t entails h\" 的意思是，人在阅读 t 后会得出 h 为真的结论。NLI 是预测 entailment / contradiction / neutral 的任务。表面上枯燥，但在生产中承担关键作用。",
        "keywords": "步骤 1： 运行一个 pretrained NLI model · 步骤 2：zero-shot Classification · 步骤 3： RAG 的 faithfulness check · 步骤 4： 手写 NLI classifier（概念版）"
      },
      {
        "name": "Embedding Models Deep Dive",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/",
        "summary": "Word2Vec 为每个词提供一个 Vector。现代 Embedding Models 为每个段落提供一个 Vector，支持跨语言，并提供 sparse、dense 和 multi-vector 视图，尺寸可适配你的 index。选错了，你的 RAG 就会检索到错误内容。",
        "keywords": "MTEB leaderboard 只讲了部分故事 · 三层模式 · 步骤 1： baseline — 使用 Sentence-BERT 的 dense embeddings · 步骤 2: Matryoshka truncation · 步骤 3: BGE-M3 多功能性 · 步骤 4： 在 custom task 上做 MTEB eval · 步骤 5： 从零手写 cosine"
      },
      {
        "name": "Chunking Strategies for RAG",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/",
        "summary": "Chunking 配置对检索质量的影响与 Embedding model 的选择一样大（Vectara NAACL 2025）。如果 chunking 做错了，再多 reranking 也救不了。",
        "keywords": "胜过所有默认值的规则 · 步骤 1： fixed 和 recursive chunking · 步骤 2： semantic chunking · 步骤 3： parent-document · 步骤 4: contextual retrieval（Anthropic pattern） · 步骤 5： evaluate"
      },
      {
        "name": "Coreference Resolution",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/24-coreference-resolution/",
        "summary": "“她打电话给他。他没有接。医生在吃午饭。” 三个 reference，指向两个人，而且没有人被点名。Coreference Resolution 会弄清楚谁是谁。",
        "keywords": "步骤 1： pretrained neural coreference (AllenNLP / spaCy-experimental) · 步骤 2: rule-based pronoun resolver (teaching) · 步骤 3: 使用 LLMs 进行共指消解 · 步骤 4： evaluation"
      },
      {
        "name": "Entity Linking & Disambiguation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/25-entity-linking/",
        "summary": "NER 找到了 \"Paris\"。Entity linking 要决定：Paris, France？Paris Hilton？Paris, Texas？Paris（Trojan prince）？如果没有 linking，你的 Knowledge Graph 仍然是 ambiguous 的。",
        "keywords": "两个指标 · 步骤 1：从 Wikipedia redirects 构建 alias index · 步骤 2：基于 context 的 disambiguation · 步骤 3：embedding-based（BLINK-style） · 步骤 4：generative entity linking（概念） · 步骤 5：在 AIDA-CoNLL 上评估"
      },
      {
        "name": "Relation Extraction & Knowledge Graph Construction",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg/",
        "summary": "NER 找到了实体。Entity linking 锚定了它们。Relation extraction 找到它们之间的边。Knowledge Graph 是节点、边和其 provenance 的总和。",
        "keywords": "步骤 1: 基于 pattern 的抽取 · 步骤 2: 有监督关系 Classification · 步骤 3： 带 anchoring 的 LLM-prompted extraction · 步骤 4： canonicalize 到 closed ontology · 步骤 5： 构建一个小 graph 并查询"
      },
      {
        "name": "LLM Evaluation: RAGAS, DeepEval, G-Eval",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/",
        "summary": "Exact-match 和 F1 会漏掉语义等价。人工评审无法规模化。LLM-as-judge 是生产环境的答案 — 前提是有足够的校准，让你能信任这个数字。",
        "keywords": "步骤 1： 使用 NLI 做 faithfulness（RAGAS-style） · 步骤 2： answer relevance · 步骤 3: G-Eval 自定义 metric · 步骤 4： CI gate · 步骤 5： 从零开始的 toy eval"
      },
      {
        "name": "Long-Context Evaluation: NIAH, RULER, LongBench, MRCR",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/",
        "summary": "Gemini 3 Pro 宣称拥有 10M tokens 的 context。在 1M tokens 下，8-needle MRCR 降到 26.3%。宣称 ≠ 可用。Long-context evaluation 会告诉你正在上线的 model 的实际容量。",
        "keywords": "实际应该报告什么 · Step 1：为你的领域构建自定义 NIAH · Step 2：multi-needle 变体 · Step 3：multi-hop variable tracing（RULER-style） · Step 4：在你的 stack 上运行 LongBench v2"
      },
      {
        "name": "Dialogue State Tracking",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/",
        "summary": "“我想要一家北边的便宜餐厅……其实改成中等价位……再加上 Italian。” 三轮对话，三次状态更新。DST 会让 slot-value dict 保持同步，这样预订才能正确执行。",
        "keywords": "经典失败模式 · 步骤 1: 基于 rule 的 slot extractor · 步骤 2： state update loop · 步骤 3: 使用结构化输出的 LLM 驱动 DST · 步骤 4： JGA evaluation · 步骤 5：处理修正"
      }
    ]
  },
  {
    "id": 6,
    "name": "Speech & Audio",
    "status": "complete",
    "desc": "听见，理解，表达。",
    "lessons": [
      {
        "name": "Audio Fundamentals: Waveforms, Sampling, FFT",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/01-audio-fundamentals",
        "summary": "Waveforms 是 raw signal。Spectrograms 是表示形式。Mel features 是适合 ML 的形式。每个现代 ASR 和 TTS pipeline 都会走过这层阶梯，而第一阶就是理解 sampling 和 Fourier。",
        "keywords": "步骤 1：读取 clip 并绘制 waveform · 步骤 2：从第一性原理合成 sine wave · 步骤 3：手写计算 DFT · 步骤 4：找到 dominant frequency · 步骤 5：演示 aliasing"
      },
      {
        "name": "Spectrograms, Mel Scale & Audio Features",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/02-spectrograms-mel-features",
        "summary": "Neural Network 不太适合直接消费 raw waveform。它们消费 spectrogram。它们消费 mel spectrogram 的效果更好。2026 年的每个 ASR、TTS 和 audio classifier，成败都取决于这个单一的 preprocessing 选择。",
        "keywords": "步骤 1: 对波形分帧 · 步骤 2： Hann window · 步骤 3： STFT magnitude · 步骤 4： mel filterbank · 步骤 5： log-mel · 步骤 6： MFCCs"
      },
      {
        "name": "Audio Classification",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/03-audio-classification",
        "summary": "从“狗叫 vs 警笛”到“这是哪种语言”，都属于音频 Classification。特征是 mels。架构每十年都会变化。评估仍然是 AUC、F1 和按类 recall。",
        "keywords": "类别不平衡才是真正挑战 · 评估 · 步骤 1：featurize · 步骤 2：固定长度 summary · 步骤 3：k-NN · 步骤 4：升级到 log-mels 上的 CNN · 步骤 5：2026 默认方案 — fine-tune BEATs"
      },
      {
        "name": "Speech Recognition (ASR)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/04-speech-recognition-asr",
        "summary": "语音识别是在每个时间步进行音频分类，再由一个懂英语和静音的序列模型把它们粘合起来。CTC、RNN-T 和 Attention 是实现它的三种方式。选一种，并理解为什么。",
        "keywords": "WER：一个数字 · 步骤 1：greedy CTC decode · 步骤 2：beam-search CTC · 步骤 3：WER · 步骤 4：对 Whisper 执行 inference · 步骤 5：使用 Parakeet 或 wav2vec 2.0 进行 streaming"
      },
      {
        "name": "Whisper: Architecture & Fine-Tuning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/05-whisper-architecture-finetuning",
        "summary": "Whisper 是一个 30-second-window transformer encoder-decoder，训练于 680k 小时的 multilingual weakly-supervised audio-text pairs。一个 architecture，多种 tasks，跨 99 种语言都 robust。2026 年的参考 ASR。",
        "keywords": "Variants in 2026 · Fine-tuning · Step 1: 直接运行 Whisper · Step 2: chunked long-form · Step 3: 使用 LoRA fine-tune · Step 4: 检查每一层学到了什么"
      },
      {
        "name": "Speaker Recognition & Verification",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/06-speaker-recognition-verification",
        "summary": "ASR 问的是“他们说了什么？”Speaker recognition 问的是“是谁说的？”数学形式看起来一样，即 Embedding 加 Cosine，但每一个生产决策都取决于单个 EER 数字。",
        "keywords": "Scoring · 你应该知道的数字（2026） · Diarization · 步骤 1：从 MFCC statistics 构造玩具 Embedding · 步骤 2：Cosine similarity + threshold · 步骤 3：从 similarity pairs 计算 EER · 步骤 4：使用 SpeechBrain 做生产实现 · 步骤 5：使用 pyannote 做 diarize"
      },
      {
        "name": "Text-to-Speech (TTS)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/07-text-to-speech",
        "summary": "ASR 将语音反转为文本；TTS 将文本反转为语音。2026 年的技术栈分为三部分：text → Token，Token → mel，mel → waveform。每一部分都有一个适合在笔记本电脑上运行的默认模型。",
        "keywords": "Vocoder 演进 · 评估 · 步骤 1： phonemize input · 步骤 2：运行 Kokoro（2026 CPU 默认） · 步骤 3: 使用 voice cloning 运行 F5-TTS · 步骤 4：从零实现 HiFi-GAN vocoder · 步骤 5： the full pipeline (pseudocode)"
      },
      {
        "name": "Voice Cloning & Voice Conversion",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/08-voice-cloning-conversion",
        "summary": "Voice cloning 会用别人的声音读出你的文本。Voice conversion 会在保留你所说内容的同时，把你的声音改写成别人的声音。两者都依赖同一个分解：把 speaker identity 与 content 分离。",
        "keywords": "伦理部分，不是附加项 · Numbers（2026） · Step 1: 用 recognition-synthesis 分解（`main.py` 中的 code-only demo） · Step 2: 用 F5-TTS 做 zero-shot clone · Step 3: 用 KNN-VC 做 voice conversion · Step 4: 嵌入 watermark · Step 5: consent gate"
      },
      {
        "name": "Music Generation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/09-music-generation",
        "summary": "2026 年的音乐生成：Suno v5 和 Udio v4 主导商业市场；MusicGen, Stable Audio Open 和 ACE-Step 引领开源方向。技术问题基本已经解决。法律问题（Warner Music $500M 和解、UMG 和解）在 2025-2026 年重塑了整个领域。",
        "keywords": "基于 neural-codec Token 的 Token LM · 基于 mel 或 latent 的 Diffusion · Hybrid（生产级）— Suno, Udio, Lyria · 评估 · 步骤 1： 使用 MusicGen 生成 · 步骤 2： 旋律条件控制 · 步骤 3： FAD 评估 · 步骤 4： 加入 LLM-music workflow"
      },
      {
        "name": "Audio-Language Models",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/10-audio-language-models",
        "summary": "2026 年的 audio-language models 可以对语音 + 环境声音 + 音乐进行推理。Qwen2.5-Omni-7B 在 MMAU-Pro 上达到 GPT-4o Audio 水平。Audio Flamingo Next 在 LongAudioBench 上超过 Gemini 2.5 Pro。开源与闭源之间的差距基本已经消失——除了 m…",
        "keywords": "三组件模板 · 2026 模型地图 · Benchmark 现实检查（2026） · LALMs 在 2026 年适合用在哪里 · 它们还不适合用在哪里 · 步骤 1： 查询 Qwen2.5-Omni · 步骤 2： projector 模式 · 步骤 3： Benchmark MMAU / LongAudioBench"
      },
      {
        "name": "Real-Time Audio Processing",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/11-real-time-audio-processing",
        "summary": "Batch pipelines 处理一个文件。Real-time pipelines 要在下一个 20 毫秒到来之前处理当前这 20 毫秒。每个 conversational AI、broadcast studio 和 telephony bot 都由这个 latency budget 决定成败。",
        "keywords": "常见坑 · 步骤 1：ring buffer · 步骤 2：VAD gate · 步骤 3：streaming ASR · 步骤 4：interruption handler"
      },
      {
        "name": "Build a Voice Assistant Pipeline",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/12-voice-assistant-pipeline",
        "summary": "把 lessons 01-11 的所有内容串起来。构建一个会听、会推理、会回应的语音助手。在 2026 年，这已经是一个成熟的工程问题，而不是研究问题，但集成细节决定它能否真正上线。",
        "keywords": "七个组件 · 你会遇到的三个 failure modes · 2026 生产参考 stacks · 步骤 1： 带 chunking 的 mic capture（pseudocode） · 步骤 2：VAD 门控的轮次捕获 · 步骤 3： streaming STT → LLM → TTS · 步骤 4： LLM loop 内的 tool calling · 步骤 5: interruption handling"
      },
      {
        "name": "Neural Audio Codecs — EnCodec, SNAC, Mimi, DAC",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/13-neural-audio-codecs",
        "summary": "2026 年的音频生成几乎全都是 Token。EnCodec、SNAC、Mimi 和 DAC 会把连续波形转换为 Transformer 可以预测的离散序列。semantic-vs-acoustic Token 拆分，即第一个 codebook 作为 semantic，其余作为 acoustic，是自 Transformer 以来音频领域最重要的架构转变。",
        "keywords": "核心技巧：Residual Vector Quantization (RVQ) · 2026 年最重要的四个 codec · Frame rate 对语言建模很重要 · 语义 Token vs 声学 Token · 2026 reconstruction quality（bits per sec，bitrate 越低越好） · 步骤 1：用 EnCodec encode · 步骤 2：decode 并测量 reconstruction · 步骤 3：semantic-acoustic split（Mimi 风格） · 步骤 4：为什么 codec Token 上的 AR LM 可行"
      },
      {
        "name": "Voice Activity Detection & Turn-Taking",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/14-voice-activity-detection-turn-taking",
        "summary": "每个 voice agent 的成败都取决于两个判断：用户现在是否在说话，以及他们是否说完了？VAD 回答第一个问题。Turn-detection（VAD + silence-hangover + semantic endpoint model）回答第二个问题。任一判断出错，你的 assistant 要么打断用户，要么一直说个不停。",
        "keywords": "三层 VAD 级联 · 关键参数及其默认值 · Flush trick（Kyutai 2025） · 2026 VAD 对比 · 步骤 1： energy gate · 步骤 2： Python 中的 Silero VAD · 步骤 3: turn-end state machine · 步骤 4: flush trick 骨架"
      },
      {
        "name": "Streaming Speech-to-Speech — Moshi, Hibiki",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/15-streaming-speech-to-speech-moshi-hibiki",
        "summary": "2024-2026 年重新定义了语音 AI。Moshi 发布了一个单一模型，可以以 200 ms 延迟同时听和说。Hibiki 逐块完成 speech-to-speech 翻译。两者都放弃了 ASR → LLM → TTS pipeline，转向基于 Mimi codec Token 的统一 full-duplex 架构。这就是新的参考设计。",
        "keywords": "Moshi architecture · 为什么 inner-monologue text 有帮助 · Hibiki：streaming speech-to-speech translation · 更广泛的 Kyutai stack（2026） · Sesame CSM — 近亲 · 2026 performance numbers · 步骤 1：interface · 步骤 2：full-duplex loop · 步骤 3：training objective（概念） · 步骤 4：Moshi 赢在哪里，输在哪里"
      },
      {
        "name": "Voice Anti-Spoofing & Audio Watermarking",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking",
        "summary": "Voice cloning 的上线速度快过了防御手段。2026 年的生产级语音系统需要两样东西：一个将真实语音与伪造语音分类的检测器（AASIST, RawNet2），以及一个能经受压缩和编辑的 watermark（AudioSeal）。两者都要上线，否则就不要上线 voice cloning。",
        "keywords": "ASVspoof 5 — 2024-2025 benchmark · AASIST 和 RawNet2 — 检测模型家族 · AudioSeal — 2024 年默认 watermark · WavMark · WaveVerify（2025 年 7 月） · 对抗者利用的缺口 · C2PA / Content Authenticity Initiative · 步骤 1： 一个简单的 spectral-feature detector（toy） · 步骤 2： AudioSeal embed + detect · 步骤 3： evaluation — EER · 步骤 4： 生产集成"
      },
      {
        "name": "Audio Evaluation — WER, MOS, MMAU, Leaderboards",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/06-speech-and-audio/17-audio-evaluation-metrics",
        "summary": "无法衡量的东西，就无法发布。本课为每一种音频任务命名 2026 年的指标：ASR（WER、CER、RTFx）、TTS（MOS、UTMOS、SECS、WER-on-ASR-round-trip）、audio-language（MMAU、LongAudioBench）、音乐（FAD、CLAP）以及说话人（EER）。还包括用于对比的排行榜。",
        "keywords": "ASR 指标 · TTS 指标 · Voice-cloning 专用指标 · Speaker verification · Diarization · Audio classification · Music generation · Audio-language benchmark · Streaming speech-to-speech · 2026 排行榜 · 步骤 1：带规范化的 WER · 步骤 2：TTS round-trip WER · 步骤 3：用于 voice cloning 的 SECS · 步骤 4：用于 music generation 的 FAD · 步骤 5：用于 speaker verification 的 EER（与 Lesson 6 相同代码）"
      }
    ]
  },
  {
    "id": 7,
    "name": "Transformers Deep Dive",
    "status": "complete",
    "desc": "改变一切的 architecture。",
    "lessons": [
      {
        "name": "Why Transformers: The Problems with RNNs",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/01-why-transformers/",
        "summary": "RNNs 一次处理一个 Token。Transformers 一次处理所有 Tokens。这个单一的架构选择，改变了 2017 年之后 Deep Learning 中的每一条扩展曲线。",
        "keywords": "步骤 1： 测量 serial depth · 步骤 2： 计算理论操作 · 步骤 3： 长序列上的经验扩展"
      },
      {
        "name": "Self-Attention from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/02-self-attention-from-scratch/",
        "summary": "Attention 是一个查询表，其中每个词都会问：“谁对我重要？”并学习答案。",
        "keywords": "数据库查询类比 · Q、K、V 计算 · Attention Matrix · 为什么要缩放？ · Softmax 将 Scores 转为 Weights · Values 的加权和 · 完整流程 · 步骤 1：从零实现 Softmax · 步骤 2：Scaled dot-product attention · 步骤 3：带学习投影的 Self-attention class · 步骤 4：在一个句子上运行 · 步骤 5：使用 ASCII heatmap 可视化 Attention"
      },
      {
        "name": "Multi-Head Attention",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/03-multi-head-attention/",
        "summary": "一个 attention head 一次学习一种关系。八个 heads 学习八种。Heads 很便宜。多用几个。",
        "keywords": "步骤 1：从我们已有的 single-head attention 中 split heads · 步骤 2：按 head 运行 scaled-dot-product attention · 步骤 3：Grouped-Query Attention 变体 · 步骤 4：probe 每个 head 学到了什么"
      },
      {
        "name": "Positional Encoding: Sinusoidal, RoPE, ALiBi",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/04-positional-encoding/",
        "summary": "Attention 对排列不敏感。没有 positional signal 时，“The cat sat on the mat”和“mat the on sat cat the”会产生相同输出。三种算法修复了它——每一种都对“position”的含义做了不同下注。",
        "keywords": "Absolute sinusoidal · RoPE · ALiBi · 2026 年该选什么 · Step 1: sinusoidal encoding · Step 2: 应用于 Q、K 的 RoPE · Step 3: ALiBi slopes 和 bias · Step 4: 验证 RoPE 的 relative-distance property"
      },
      {
        "name": "The Full Transformer: Encoder + Decoder",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/05-full-transformer/",
        "summary": "Attention 是主角。其他一切——residuals、normalization、feed-forward、cross-attention——都是让你能够把它堆得很深的脚手架。",
        "keywords": "六个组成部分 · Encoder block（BERT、T5 encoder 使用） · Decoder block（GPT、T5 decoder 使用） · Pre-norm vs post-norm · 2026 年的现代化 block · Parameter count · 步骤 1： building blocks · 步骤 2： wire 一个 2-layer encoder 和一个 2-layer decoder · 步骤 3： 在 toy example 上运行 forward · 步骤 4： 换成 RMSNorm + SwiGLU"
      },
      {
        "name": "BERT — Masked Language Modeling",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/06-bert-masked-language-modeling/",
        "summary": "GPT 预测下一个词。BERT 预测缺失的词。只差一句话，却带来了半个十年的各种 Embedding 形态。",
        "keywords": "训练信号 · BERT mask 规则 · Next Sentence Prediction (NSP)——以及为什么它被移除 · 2026 年的变化：ModernBERT · 2026 年仍然选择 encoder 的用例 · 步骤 1： masking logic · 步骤 2： 在一个微型 corpus 上运行 MLM prediction · 步骤 3： 比较 mask 类型 · 步骤 4： fine-tune head"
      },
      {
        "name": "GPT — Causal Language Modeling",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/",
        "summary": "BERT 能看到两侧。GPT 只能看到过去。triangle mask 是现代 AI 中影响最深远的一行代码。",
        "keywords": "mask · 并行训练，串行推理 · loss —— shift-by-one · Decoding strategies · 让 “GPT recipe” 起作用的因素 · 步骤 1： causal mask · 步骤 2： 一个 2-layer GPT-ish model · 步骤 3： next-token prediction，端到端 · 步骤 4： sampling"
      },
      {
        "name": "T5, BART — Encoder-Decoder Models",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/",
        "summary": "Encoder 负责理解。Decoder 负责生成。把它们重新组合在一起，就得到一个专为 input → output 任务构建的模型：翻译、总结、改写、转录。",
        "keywords": "前向循环 · T5 预训练 — span corruption · BART 预训练 — multi-noise denoising · 推理 · 2026 年何时选择各个变体 · 步骤 1： span corruption · 步骤 2： verify round-trip · 步骤 3： BART noising"
      },
      {
        "name": "Vision Transformers (ViT)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/09-vision-transformers/",
        "summary": "一张图像是由 patch 组成的网格。一个句子是由 Token 组成的网格。同一个 Transformer 都能处理。",
        "keywords": "Step 1 — patchify · Step 2 — linear embedding · 步骤 3 — 前置 `[CLS]` token，添加 positional embeddings · 步骤 4 — 标准 Transformer encoder · Step 5 — head · 重要变体 · 为什么它花了一段时间才成功 · 步骤 1： fake image · 步骤 2： patchify · 步骤 3： linear embed · 步骤 4: 统计真实 ViT 的参数量"
      },
      {
        "name": "Audio Transformers — Whisper Architecture",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/10-audio-transformers-whisper/",
        "summary": "Audio 是 frequency 随 time 变化形成的图像。Whisper 是一个吃 mel spectrograms 并吐回文字的 ViT。",
        "keywords": "Step 1 — resample + window · Step 2 — convolutional stem · Step 3 — encoder · Step 4 — decoder · Step 5 — task tokens · Step 6 — output · Whisper sizes · Whisper 不做什么 · 2026 landscape · Step 1: synthesize audio · Step 2: log-mel spectrogram（简化版） · Step 3: pad 到 30 s · Step 4: 构建 prompt tokens"
      },
      {
        "name": "Mixture of Experts (MoE)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/11-mixture-of-experts/",
        "summary": "一个 dense 70B Transformer 会为每个 Token 激活所有参数。一个 671B MoE 每个 Token 只激活 37B 参数，却在所有 benchmark 上胜过它。稀疏性是这个十年最重要的 scaling 思想。",
        "keywords": "FFN 替换 · load-balancing 问题 · Shared experts · Fine-grained experts · 成本画像 · 代价：memory · 步骤 1：router · 步骤 2：让 100 个 Token 通过 router · 步骤 3：参数量对比"
      },
      {
        "name": "KV Cache, Flash Attention & Inference Optimization",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/12-kv-cache-flash-attention/",
        "summary": "训练是并行且受 FLOP 限制的。推理是串行且受内存带宽限制的。瓶颈不同，技巧也不同。",
        "keywords": "KV cache math · Flash Attention — tiling 技巧 · Speculative decoding — 另一个延迟优化 · Continuous batching · PagedAttention — 把 KV cache 当作虚拟内存 · 步骤 1： KV cache · 步骤 2： tiled softmax · 步骤 3： 在 100-token generation 上比较 naive vs cached decoding"
      },
      {
        "name": "Scaling Laws",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/13-scaling-laws/",
        "summary": "2020 年 Kaplan 论文说：模型越大，Loss 越低。2022 年 Hoffmann 论文说：你们训练不足。Compute 会进入两个桶：参数和 Token，而两者的分配并不显然。",
        "keywords": "Hoffmann law · 为什么仍然要过度训练 · 涌现 vs 平滑性 · 2026 年图景 · 步骤 1： Chinchilla loss · 步骤 2: 计算最优边界 · 步骤 3：过度训练成本 · 步骤 4: 与真实模型比较"
      },
      {
        "name": "Build a Transformer from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/14-build-a-transformer-capstone/",
        "summary": "十三节课。一个模型。不走捷径。",
        "keywords": "我们交付什么 · 我们不交付什么 · 目标指标 · 步骤 1： data · 步骤 2： model · 步骤 3： training loop · 步骤 4： sample · 步骤 5： read the output"
      },
      {
        "name": "Attention Variants — Sliding Window, Sparse, Differential",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/15-attention-variants/",
        "summary": "Full Attention 是一个圆。每个 Token 都能看到每个 Token，而内存为此付出代价。四种变体改变这个圆的形状，并收回一半成本。",
        "keywords": "Sliding Window Attention (SWA) · Sparse / Block Attention · Differential Attention (DIFF Transformer, 2024) · 变体对比 · 步骤 1： full causal mask（baseline） · 步骤 2： sliding window causal mask · 步骤 3： local + strided sparse mask · 步骤 4： differential attention · 步骤 5： KV cache sizes"
      },
      {
        "name": "Speculative Decoding — Draft, Verify, Repeat",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/07-transformers-deep-dive/16-speculative-decoding/",
        "summary": "Autoregressive decoding 是串行的。每个 Token 都要等待前一个 Token。Speculative Decoding 打破了这条链：一个便宜的模型先 draft N 个 Token，昂贵模型在一次 forward pass 中 verify 全部 N 个 Token。当 draft 正确时，你用一次大的 forward 就完…",
        "keywords": "核心算法 · 什么决定 speedup · Medusa — 没有 draft model 的 draft · EAGLE — 通过复用 hidden states 获得更好的 draft · KV cache dance · 步骤 1：rejection step · 步骤 2：residual distribution · 步骤 3：一个 speculative step · 步骤 4：测量 acceptance rate · 步骤 5：验证分布等价性"
      }
    ]
  },
  {
    "id": 8,
    "name": "Generative AI",
    "status": "complete",
    "desc": "创建 images、video、audio、3D，以及更多内容。",
    "lessons": [
      {
        "name": "Generative Models: Taxonomy & History",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/01-generative-models-taxonomy-history/",
        "summary": "每个图像模型、文本模型、视频模型和 3D 模型都属于五个类别之一。选错类别，你会和数学较劲好几周。选对类别，过去十二年这个领域的进展就会在你脑中清晰地层层叠起。"
      },
      {
        "name": "Autoencoders & VAE",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/02-autoencoders-vae/",
        "summary": "普通 Autoencoder 先压缩再重构。它会记忆。它不会生成。加入一个技巧 — 强制 code 看起来像 Gaussian — 你就得到一个 sampler。这个单一技巧，也就是 `z = μ + σ·ε` 的 reparameterization，正是为什么你在 2026 年使用的每个 latent-diffusion 和 flow-matchi…",
        "keywords": "Step 1: encoder forward · Step 2: reparameterize and decode · Step 3: the ELBO · Step 4: generate"
      },
      {
        "name": "GANs: Generator vs Discriminator",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/03-gans-generator-discriminator/",
        "summary": "Goodfellow 在 2014 年的技巧是完全跳过 density。两个网络。一个制造 fakes。一个抓住它们。它们互相对抗，直到 fakes 与真实样本无法区分。它本不该奏效。它也经常不奏效。但一旦奏效，对于狭窄领域，它生成的 samples 仍然是文献中最锐利的。",
        "keywords": "步骤 1： non-saturating loss · 步骤 2： 每个 generator step 对应一个 discriminator step · 步骤 3： 观察 mode collapse"
      },
      {
        "name": "Conditional GANs & Pix2Pix",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/04-conditional-gans-pix2pix/",
        "summary": "2014-2017 年第一个重大突破，是控制 GAN 生成什么。附加一个 label、一张 image，或一个 sentence。Pix2Pix 做的是 image 版本，而且在狭窄的 image-to-image 任务上，它至今仍胜过每一个通用 text-to-image model。",
        "keywords": "步骤 1: 将 condition 追加到 G 和 D 的输入 · 步骤 2： train conditional · 步骤 3：验证每个 class 的输出"
      },
      {
        "name": "StyleGAN",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/05-stylegan/",
        "summary": "大多数生成器会把 `z` 同时搅入每一层。StyleGAN 把它拆开了：先把 `z` 映射到中间表示 `w`，然后通过 AdaIN 在每个分辨率层级*注入* `w`。这一个改动解开了 latent space，并让照片级真实人脸在连续七年里成为已解决的问题。",
        "keywords": "步骤 1： mapping network · 步骤 2: adaptive instance normalization · 步骤 3： per-layer noise"
      },
      {
        "name": "Diffusion Models — DDPM from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/06-diffusion-ddpm-from-scratch/",
        "summary": "Ho、Jain、Abbeel（2020）给了这个领域一个无法放弃的配方。用 noise 经过一千个小步骤摧毁 data。训练一个 neural net 来预测 noise。在 inference 时反转这个过程。今天，每个主流 image、video、3D 和 music model 都运行在这个 loop 上，可能还在上面叠加 flow matchi…",
        "keywords": "Step 1: the forward schedule (closed form) · Step 2: sample `x_t` in one shot · Step 3: one training step · Step 4: reverse sampling"
      },
      {
        "name": "Latent Diffusion & Stable Diffusion",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/07-latent-diffusion-stable-diffusion/",
        "summary": "在 512×512 图像上做 pixel-space diffusion，在计算上堪称战争罪。Rombach et al. (2022) 注意到，生成一张图像并不需要全部 786k 维度，你需要的是足以捕捉语义结构的维度，以及一个单独的 decoder 来处理其余部分。在 VAE 的 latent space 中运行 diffusion。这个想法就是 …",
        "keywords": "步骤 1： encoder/decoder · 步骤 2： 在 `z`-space 中做 diffusion · 步骤 3: classifier-free guidance · 步骤 4： 文本 conditioning（概念，不是代码）"
      },
      {
        "name": "ControlNet, LoRA & Conditioning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/08-controlnet-lora-conditioning/",
        "summary": "仅靠文本是一种笨拙的控制信号。ControlNet 让你克隆一个 pretrained diffusion model，并用 depth map、pose skeleton、scribble 或 edge image 来引导它。LoRA 让你通过训练 1000 万个参数来 fine-tune 一个 2B-parameter 模型。二者结合，把 Stab…",
        "keywords": "ControlNet (Zhang et al., 2023) · LoRA (Hu et al., 2021) · IP-Adapter (Ye et al., 2023) · 步骤 1： LoRA math · 步骤 2: zero-init side network"
      },
      {
        "name": "Inpainting, Outpainting & Editing",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/09-inpainting-outpainting-editing/",
        "summary": "Text-to-image 会创造新事物。Inpainting 会修复旧事物。在生产环境中，70% 可计费的图像工作都是编辑：替换背景、移除 logo、扩展画布、重新生成一只手。Inpainting 正是 diffusion 体现价值的地方。",
        "keywords": "朴素方法（以及为什么它是错的） · 正确的 inpainting model · SDEdit (Meng et al., 2022) — 免费编辑 · InstructPix2Pix (Brooks et al., 2023) · RePaint (Lugmayr et al., 2022) · Step 1：5-D DDPM data · Step 2：在所有 5 个维度上训练 denoiser · Step 3：推理时使用 mask-aware reverse · Step 4：outpainting"
      },
      {
        "name": "Video Generation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/10-video-generation/",
        "summary": "图像是一个 2-D tensor。视频是一个 3-D tensor。理论相同；compute 难度高出 10-100x。OpenAI 的 Sora（2024 年 2 月）证明了这是可行的。到 2026 年，Veo 2、Kling 1.5、Runway Gen-3、Pika 2.0 和 WAN 2.2 已经能从文本生成 1080p 的生产级视频，而 op…",
        "keywords": "Patchify · Spatiotemporal DiT · 文本 conditioning · 训练 · 步骤 1： patchify 一个合成 1-D \"video\" · 步骤 2： 每帧的 position embedding · 步骤 3： denoiser 看到整个序列 · 步骤 4： 时间一致性测试"
      },
      {
        "name": "Audio Generation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/11-audio-generation/",
        "summary": "音频是 16-48 kHz 的 1-D signal。一个五秒片段有 80-240k 个 sample。没有任何 Transformer 会直接 attend 这个序列。2026 年每个 production audio model 的解决方案都一样：neural codec（Encodec、SoundStream、DAC）把音频压缩成 50-75 H…",
        "keywords": "Neural audio codecs · 其上的两种生成范式 · 步骤 1：合成 audio tokens · 步骤 2：训练一个 tiny token predictor · 步骤 3：条件式 sample"
      },
      {
        "name": "3D Generation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/12-3d-generation/",
        "summary": "3D 是 2D-to-3D 借力最强的 modality。2023 年的突破是 3D Gaussian Splatting。2024-2026 年的生成式推进，是在其上叠加 multi-view diffusion + 3D reconstruction，从单个 prompt 或照片生成物体和场景。",
        "keywords": "表示：3D Gaussian Splatting (Kerbl et al., 2023) · Multi-view diffusion · Text-to-3D pipelines · NeRF（背景） · 步骤 1： 2D Gaussian splat · 步骤 2: 通过累加 splats 进行渲染 · 步骤 3：用 Gradient Descent 拟合"
      },
      {
        "name": "Flow Matching & Rectified Flows",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/13-flow-matching-rectified-flows/",
        "summary": "Diffusion models 需要 20-50 个采样步骤，因为它们会沿着从噪声到 data 的弯曲路径行走。Flow matching（Lipman et al., 2023）和 rectified flow（Liu et al., 2022）训练的是直线路径。路径越直，步骤越少，inference 越快。Stable Diffusion 3、F…",
        "keywords": "直线 flow · 采样 · Rectified flow（Liu 2022） · 为什么它在 2024 年赢得了图像领域 · 步骤 1：training loss · 步骤 2：multi-step inference · 步骤 3：比较步骤数"
      },
      {
        "name": "Evaluation: FID, CLIP Score",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/14-evaluation-fid-clip-score/",
        "summary": "每个生成式模型排行榜都会引用 FID、CLIP score，以及来自人类偏好竞技场的胜率。每个数字都有一种会被有心研究者利用的失效模式。如果你不了解这些失效模式，就无法区分真正的改进和刷分运行。",
        "keywords": "FID — 样本质量 · CLIP score — prompt 遵循度 · 人类偏好 — ground truth · 步骤 1： 四行实现 FID · 步骤 2： CLIP 风格的 cosine-similarity · 步骤 3： Elo 聚合"
      },
      {
        "name": "Visual Autoregressive Modeling (VAR): Next-Scale Prediction",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/08-generative-ai/19-visual-autoregressive-var/",
        "summary": "Diffusion 模型在时间上迭代采样（去噪步骤）。VAR 在尺度上迭代采样，即先预测一个 1x1 Token，再预测 2x2，然后 4x4，一直到最终分辨率，每个尺度都以之前的尺度为条件。2024 年的论文表明，VAR 在图像生成上符合 GPT 风格的 scaling laws，并且在相同计算预算下胜过 DiT。本课会构建其核心机制。",
        "keywords": "VQ-VAE Multi-Scale Tokenizer · Next-Scale Prediction · 生成 · 为什么 Next-Scale 胜过 Next-Token · Scaling Law · 与 Diffusion 的关系"
      }
    ]
  },
  {
    "id": 9,
    "name": "Reinforcement Learning",
    "status": "complete",
    "desc": "RLHF 和 game-playing AI 的基础。",
    "lessons": [
      {
        "name": "MDPs, States, Actions & Rewards",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/01-mdps-states-actions-rewards/",
        "summary": "Markov Decision Process 由五件事组成：states、actions、transitions、rewards、discount。RL 中的一切：Q-learning、PPO、DPO、GRPO，都是在这个形状上优化。学一次，后面的 Reinforcement Learning 都能顺着读下去。",
        "keywords": "Step 1：一个极小的 deterministic MDP · Step 2：roll out 一个 policy · Step 3：通过 Bellman equation 精确计算 `V^π` · Step 4：`γ` 是具有物理含义的 hyperparameter"
      },
      {
        "name": "Dynamic Programming",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/02-dynamic-programming/",
        "summary": "Dynamic programming 是带“作弊”的 RL。你已经知道 transition 和 reward functions；你只需要反复迭代 Bellman equation，直到 `V` 或 `π` 不再变化。它是每个 sampling-based method 都试图接近的基准。",
        "keywords": "Step 1: 构建 GridWorld MDP model · Step 2: policy evaluation · Step 3: policy improvement · Step 4: 组合起来 · Step 5: value iteration（单 loop 版本）"
      },
      {
        "name": "Monte Carlo Methods",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/03-monte-carlo-methods/",
        "summary": "Dynamic programming 需要 model。Monte Carlo 除了 episodes 什么都不需要。运行 policy，观察 returns，取平均。这是 RL 中最简单的想法，也是解锁后续一切的想法。",
        "keywords": "Step 1: rollout → (s, a, r) 列表 · Step 2: 计算 returns（反向 sweep） · Step 3: first-visit MC evaluation · Step 4: ε-greedy MC control（on-policy） · Step 5: 与 DP gold standard 对比"
      },
      {
        "name": "Q-Learning, SARSA",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/04-q-learning-sarsa/",
        "summary": "Monte Carlo 会一直等到 episode 结束。TD 通过 bootstrap 下一个 value estimate，在每一步之后更新。Q-learning 是 off-policy 且偏乐观；SARSA 是 on-policy 且偏谨慎。两者都只是一行代码。两者也支撑着本 Phase 中的每一种 deep-RL 方法。",
        "keywords": "步骤 1： 基于 ε-greedy policy 的 SARSA · 步骤 2： Q-learning · 步骤 3： learning curves · 步骤 4： 与 DP 真值比较"
      },
      {
        "name": "Deep Q-Networks (DQN)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/05-dqn/",
        "summary": "2013 年：Mnih 在原始 pixels 上训练了一个 Q-learning network，在七个 Atari 游戏中击败了所有 classical RL agent。2015 年：扩展到 49 个游戏，发表在 Nature 上，点燃了 deep-RL 时代。DQN 就是 Q-learning 加上三个让 function approximati…",
        "keywords": "步骤 1：replay buffer · 步骤 2：一个很小的 Q-network（手写 MLP） · 步骤 3：DQN update · 步骤 4：外层 loop"
      },
      {
        "name": "Policy Gradients — REINFORCE",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/06-policy-gradients-reinforce/",
        "summary": "停止估计 value。直接 parameterize policy，计算 expected return 的 Gradient，然后沿上坡方向更新。Williams (1992) 用一个 theorem 写清了它。这也是 PPO、GRPO 以及每个 LLM RL loop 存在的原因。",
        "keywords": "Step 1: softmax policy network · Step 2: sampling and log-probability · Step 3: rollout with log-probs captured · Step 4: REINFORCE update · Step 5: baselines"
      },
      {
        "name": "Actor-Critic — A2C, A3C",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/",
        "summary": "REINFORCE 很 noisy。添加一个学习 `V̂(s)` 的 critic，从 return 中减去它，你就得到一个 expectation 相同但 variance 低得多的 advantage。这就是 actor-critic。A2C 同步运行它；A3C 在线程间运行它。两者都是每个现代 deep-RL method 的 mental mo…",
        "keywords": "Step 1: a critic · Step 2: n-step advantage · Step 3: combined update · Step 4: parallelization (A3C vs A2C)"
      },
      {
        "name": "PPO",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/08-ppo/",
        "summary": "A2C 在一次更新后就丢弃每个 rollout。PPO 用 clipped importance ratio 包住 policy gradient，这样你可以在同一批数据上做 10+ 个 epochs，而不会让 policy 爆炸。Schulman et al. (2017)。到 2026 年，它仍然是默认的 policy-gradient 算法。",
        "keywords": "Step 1：在 rollout 时捕获 `log π_old(a | s)` · Step 2：计算 GAE advantages（Lesson 07） · Step 3：clipped surrogate update · Step 4：value 和 entropy · Step 5：diagnostics"
      },
      {
        "name": "Reward Modeling & RLHF",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/09-reward-modeling-rlhf/",
        "summary": "人类无法为“好的 assistant response”手写 reward function，但他们可以比较两个 responses，并选出更好的那个。把 reward model 拟合到这些比较上，然后用 RL 让 language model 对它优化。Christiano 2017。InstructGPT 2022。这套配方把 GPT-3 变成了…",
        "keywords": "Step 1：synthetic preference data · Step 2：Bradley-Terry reward model · Step 3：RM 之上的 PPO-like policy · Step 4：monitor KL · Step 5：使用 TRL 的 production recipe"
      },
      {
        "name": "Multi-Agent RL",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/10-multi-agent-rl/",
        "summary": "Single-agent RL 假设环境是 stationary 的。把两个正在学习的 agent 放进同一个世界，这个假设就会失效：每个 agent 都是另一个 agent 环境的一部分，而且两者都在变化。Multi-agent RL 是一组让学习在 Markov assumption 不再成立时仍能收敛的技巧。",
        "keywords": "步骤 1： multi-agent env · 步骤 2: independent Q-learning · 步骤 3：centralized Q 与 decomposed-value update · 步骤 4: 简单 self-play（adversarial 2-agent）"
      },
      {
        "name": "Sim-to-Real Transfer",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/11-sim-to-real-transfer/",
        "summary": "一个在 simulator 中训练、却在硬件上失败的 policy，本质上是记住了 simulator。Domain randomization、domain adaptation 和 system identification，是让 learned controllers 跨越 reality gap 的三种工具。",
        "keywords": "步骤 1： parameterized sim · 步骤 2： 使用 DR 训练 · 步骤 3： 在 “real” slips 上做 zero-shot 评估 · 步骤 4： 与 narrow training 对比"
      },
      {
        "name": "RL for Games",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/09-reinforcement-learning/12-rl-for-games/",
        "summary": "1992：TD-Gammon 用纯 TD 在 backgammon 中击败人类冠军。2016：AlphaGo 击败 Lee Sedol。2017：AlphaZero 从零开始统治 chess、shogi 和 Go。2024：DeepSeek-R1 证明了同一套配方在 reasoning 上也有效，只是用 GRPO 替代 PPO。游戏是推动本阶段每一次突…",
        "keywords": "步骤 1：一个微型 verifier environment · 步骤 2：policy：每个 prompt 上对 K 个 answer Token 做 softmax · 步骤 3：group sampling 和 group-relative advantage · 步骤 4：与 REINFORCE baseline（value-free）比较 · 步骤 5：观察 entropy 和 KL"
      }
    ]
  },
  {
    "id": 10,
    "name": "LLMs from Scratch",
    "status": "complete",
    "desc": "构建、训练并理解 large language models。",
    "lessons": [
      {
        "name": "Tokenizers: BPE, WordPiece, SentencePiece",
        "status": "complete",
        "type": "Build",
        "lang": "Python, Rust",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/01-tokenizers/",
        "summary": "你的 LLM 不读取英文。它读取整数。Tokenizer 决定这些整数承载的是意义，还是浪费。",
        "keywords": "三种失败的方法（以及一种胜出的方法） · BPE: Byte Pair Encoding · Byte-Level BPE (GPT-2, GPT-3, GPT-4) · WordPiece (BERT) · SentencePiece (Llama, T5) · Vocabulary Size Tradeoffs · The Multilingual Tax · 步骤 1： Character-Level Tokenizer · 步骤 2： BPE Tokenizer from Scratch · 步骤 3： Encode and Decode Roundtrip · 步骤 4： Compare with tiktoken · 步骤 5： Vocabulary Analysis · tiktoken (OpenAI) · Hugging Face tokenizers · Loading Llama's Tokenizer"
      },
      {
        "name": "Building a Tokenizer from Scratch",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/02-building-a-tokenizer/",
        "summary": "Lesson 01 给了你一个玩具。这一课给你一件武器。",
        "keywords": "完整 Pipeline · Byte-Level BPE · Pre-Tokenization · Special Tokens · Chat Templates · Speed · Step 1: Byte-Level Encoding · Step 2: Pre-Tokenizer with Regex · Step 3: BPE on Byte Sequences · Step 4: Special Token Handling · Step 5: Full Tokenizer Class · Step 6: Multilingual Test · Comparing Real Tokenizers"
      },
      {
        "name": "Data Pipelines for Pre-Training",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/03-data-pipelines/",
        "summary": "模型是一面镜子。它会反映你喂给它的任何数据。喂给它垃圾，它就会以完美的流畅度反映出垃圾。",
        "keywords": "数据来自哪里 · 数据清洗 · 使用 MinHash 做 Deduplication · Sequence Packing · Chinchilla Scaling Law · 步骤 1： Text Cleaning · 步骤 2: MinHash Deduplication · 步骤 3: Tokenize 并打包序列 · 步骤 4： 用于训练的 DataLoader · 步骤 5: Dataset Statistics · 与 HuggingFace Datasets 对比"
      },
      {
        "name": "Pre-Training a Mini GPT (124M)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/04-pre-training-mini-gpt/",
        "summary": "GPT-2 Small 有 1.24 亿个参数。也就是 12 个 Transformer layer、12 个 Attention head，以及 768 维 Embedding。你可以在单块 GPU 上用几个小时从零训练它。大多数人从来不会这样做。他们使用 pre-trained checkpoint。但如果你没有亲自训练过一个，你其实并不理解你正在…",
        "keywords": "The GPT Architecture · The Transformer Block · Attention: 核心机制 · KV Cache: 推理为什么快 · Prefill vs Decode: 推理的两个阶段 · The Training Loop · GPT-2 Small: The Numbers · 步骤 1： Embedding Layer · 步骤 2: 带 Causal Mask 的 Self-Attention · 步骤 3： Multi-Head Attention · 步骤 4： Transformer Block · 步骤 5： Full GPT Model · 步骤 6： Training Loop · 步骤 7： Text Generation · 完整训练与生成 Demo"
      },
      {
        "name": "Distributed Training, FSDP, DeepSpeed",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/05-scaling-distributed/",
        "summary": "你的 124M 模型已经在一块 GPU 上训练完成。现在试试 70 亿参数。模型放不进显存。数据在单机上需要训练数周。规模上来之后，Distributed Training 不是可选项，而是唯一可行的路径。",
        "keywords": "为什么需要分布式 · Data Parallelism · Tensor Parallelism · Pipeline Parallelism · FSDP: Fully Sharded Data Parallel · DeepSpeed ZeRO · Mixed Precision Training · Megatron-LM 与 3D Parallelism · 步骤 1： Simulate Data Parallelism · 步骤 2： Simulate Tensor Parallelism · 步骤 3： Simulate Pipeline Parallelism · 步骤 4： Memory Calculator · 步骤 5： Mixed Precision Simulation · Run All Simulations"
      },
      {
        "name": "Instruction Tuning — SFT",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/06-instruction-tuning-sft/",
        "summary": "base model 会预测下一个 Token。仅此而已。它不会遵循指令、回答问题，也不会拒绝有害请求。SFT 是 Token 预测器与有用 assistant 之间的桥梁。你曾经对话过的每一个 model -- Claude、GPT、Llama Chat -- 都经历过这一步。",
        "keywords": "SFT 实际做了什么 · 数据格式 · 为什么它有效 · Masked Loss · 训练 Hyperparameters · Catastrophic Forgetting · 真实数字 · 步骤 1: Instruction Dataset · 步骤 2： 使用 Chat Template 进行 Tokenize · 步骤 3: Masked Cross-Entropy Loss · 步骤 4： SFT 训练循环 · 步骤 5： 比较 Base 与 SFT Model · 步骤 6： 衡量 Catastrophic Forgetting · 完整 SFT Pipeline Demo"
      },
      {
        "name": "RLHF — Reward Model + PPO",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/07-rlhf/",
        "summary": "SFT 教会模型遵循指令。但它不会教模型哪一个响应更好。两个语法正确、事实准确的答案，在有用性上可能相差巨大。RLHF 是把人类判断编码进模型行为的方式。它让 Claude 变得有帮助，让 GPT 变得有礼貌。",
        "keywords": "The Three Stages · The Reward Model · PPO: Proximal Policy Optimization · PPO Objective 详解 · Reward Hacking · Real RLHF Pipelines · 步骤 1： Synthetic Preference Data · 步骤 2： Reward Model Architecture · 步骤 3： Bradley-Terry Loss · 步骤 4： Simplified PPO Loop · 步骤 5： Reward Score Comparison · Full RLHF Pipeline Demo"
      },
      {
        "name": "DPO — Direct Preference Optimization",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/08-dpo/",
        "summary": "RLHF 有效。但它也需要训练三个模型（SFT、reward model、policy），管理 PPO 的不稳定性，并调节 KL penalty。DPO 会问：如果你能跳过这一切呢？DPO 直接在 preference pairs 上优化语言模型。不需要 reward model。不需要 PPO。一个 training loop。相同的结果。",
        "keywords": "The Key Insight · The DPO Loss · Why DPO is Simpler · When DPO Beats RLHF · When RLHF Beats DPO · DPO 之外：KTO, ORPO, SimPO · Real DPO Deployments · 步骤 1： Preference Dataset · 步骤 2： Sequence Log-Probability · 步骤 3： The DPO Loss · 步骤 4： DPO Training Loop · 步骤 5： Compare DPO vs RLHF · 步骤 6： Beta Sensitivity Analysis · Full DPO Pipeline Demo"
      },
      {
        "name": "Constitutional AI & Self-Improvement",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/",
        "summary": "RLHF 需要 humans in the loop。Constitutional AI 用 model 自身取代其中的大部分人工环节。写下一组原则，让 model 根据这些原则 critique 自己的输出，并基于这些 critiques 进行训练。DeepSeek-R1 在 2025 年把这个思路推进得更远：让 model 生成数百万条 reaso…",
        "keywords": "Constitutional AI 循环 · Constitution 实际做了什么 · GRPO: Group-Relative Policy Optimization · 为什么 GRPO 对推理很重要 · Process Reward Models 与 Outcome Reward Models 对比 · 自我改进：Feedback Multiplier · When To Use What · 步骤 1： The Constitution · 步骤 2： Self-Critique and Revise · 步骤 3： Rule-Based Rewards · 步骤 4： Group-Relative Advantage · 步骤 5： GRPO Update · 步骤 6： Self-Improvement Round"
      },
      {
        "name": "Evaluation — Benchmarks, Evals",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/10-evaluation/",
        "summary": "Goodhart's Law：当一个指标变成目标时，它就不再是一个好指标。每个 frontier lab 都会针对 benchmarks 做优化。MMLU 分数上涨，但模型仍然无法可靠地数出 \"strawberry\" 里有几个 R。唯一重要的 eval 是你的 eval，针对你的任务，使用你的数据。",
        "keywords": "The Eval Landscape · Why Benchmarks Break · Perplexity: 快速健康检查 · LLM-as-Judge · 基于成对比较的 ELO Ratings · Eval Frameworks · Building Custom Evals · 步骤 1：最小 Eval 框架 · 步骤 2： Scoring Functions · 步骤 3： ELO Rating System · 步骤 4： Perplexity Calculation · 步骤 5： Aggregate Results · 步骤 6： Run the Full Pipeline · 步骤 7： ELO Tournament · 步骤 8： Perplexity Comparison · lm-evaluation-harness (EleutherAI) · promptfoo · RAGAS for RAG evaluation"
      },
      {
        "name": "Quantization: INT8, GPTQ, AWQ, GGUF",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/11-quantization/",
        "summary": "一个 70B 模型用 FP16 需要 140GB。光是权重就需要两张 A100。Quantize 到 FP8：一张 80GB GPU。INT4：一台 MacBook。",
        "keywords": "Number Formats: 每个 Bit 做什么 · Quantization 如何工作 · Sensitivity Hierarchy · PTQ vs QAT · GPTQ, AWQ, GGUF · Quality Measurement · Real Numbers · 步骤 1: 数字格式表示 · 步骤 2: Symmetric Quantization (Per-Tensor 和 Per-Channel) · 步骤 3：质量测量 · 步骤 4： Bit-Width Sweep · 步骤 5： Sensitivity Experiment · 步骤 6： Simulated GPTQ · 步骤 7： AWQ Simulation · 步骤 8： Full Pipeline · Quantizing with AutoGPTQ · Quantizing with AutoAWQ · Converting to GGUF · Serving with vLLM"
      },
      {
        "name": "Inference Optimization",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/12-inference-optimization/",
        "summary": "两个阶段定义了 LLM inference。Prefill 并行处理你的 prompt -- compute-bound。Decode 一次生成一个 Token -- memory-bound。每一种优化都针对其中一个或两个阶段。",
        "keywords": "Prefill vs Decode · KV Cache · Continuous Batching · PagedAttention · Speculative Decoding · Prefix Caching · Inference Engines · Ops:Byte 框架 · 步骤 1： 从零实现 KV Cache · 步骤 2： 使用 KV Cache 的 Attention · 步骤 3： Continuous Batching 模拟器 · 步骤 4： Prefix Cache · 步骤 5： Speculative Decoding 模拟器 · 步骤 6: KV Cache Memory Profiler"
      },
      {
        "name": "Building a Complete LLM Pipeline",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/13-building-complete-llm-pipeline/",
        "summary": "Lessons 01 到 12 的所有内容，都是同一个 pipeline 的一个阶段。本课是把这些阶段转成一次端到端运行的脚手架：tokenize、pre-train、scale、SFT、align、evaluate、quantize、serve。你不会在笔记本电脑上训练一个 70B 模型。你会产出 orchestration layer、manife…",
        "keywords": "The Twelve Stages · The Manifest · Artifact Typing · The Eval Gate · The Orchestrator · Experiment Tracking 和 Artifact Storage · Costing · Reproducibility vs Determinism · Rollback Plan · 2026 年观察到的生产 Recipe"
      },
      {
        "name": "Open Models: Architecture Walkthroughs",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/",
        "summary": "你在第 04 课从零构建了一个 GPT-2 Small。2026 年的前沿 open models 属于同一个家族，只是有五六项具体变化。用 RMSNorm 取代 LayerNorm。用 SwiGLU 取代 GELU。用 RoPE 取代 learned positions。用 GQA 或 MLA 取代完整 MHA。大规模使用 Mixture-of-Ex…",
        "keywords": "The Invariant Core · 真正起作用的六个 Knobs · Knob 1: RMSNorm · Knob 2: RoPE · Knob 3: SwiGLU · Knob 4: Attention Head Sharing · Knob 5: Mixture of Experts · Knob 6: Pre-norm stays · Model-by-Model Diff · Reading a config.json · Activation memory budget · KV Cache budget · When Each Model Wins"
      },
      {
        "name": "Speculative Decoding and EAGLE-3",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/15-speculative-decoding-eagle3/",
        "summary": "Phase 7 · Lesson 16 证明了数学：Leviathan 拒绝规则会精确保留验证器的分布。本课从训练栈视角审视 2026 年生产级 Speculative Decoding。EAGLE-3 将 draft model 从廉价近似变成了一个专门设计的微型网络，它基于验证器自身的 hidden states 进行训练，并加入了 trainin…",
        "keywords": "不变量: Leviathan rejection sampling · What determines speedup · The two-year progression · KV cache rollback · Draft architectures in 2026 · 步骤 1：拒绝规则 · 步骤 2： residual distribution · 步骤 3： a full speculative step · 步骤 4： KV rollback bookkeeping · 步骤 5： the Leviathan check · 步骤 6： speedup vs. α"
      },
      {
        "name": "Differential Attention (V2)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/16-differential-attention-v2/",
        "summary": "Softmax Attention 会在每个不匹配的 Token 上分散少量概率。在 100k 个 Token 上，这些噪声会累积起来并淹没信号。Differential Transformer（Ye et al., ICLR 2025）通过将 Attention 计算为两个 softmax 的差来解决这个问题，从而减去共享的噪声下限。DIFF V2（…",
        "keywords": "Softmax 的噪声下限 · Differential 思路 · 为什么这类似带 head 的噪声抵消 · V1 vs V2：差异 · 何时使用它 · 它如何与其他 2026 knobs 搭配 · 步骤 1: standard softmax attention · 步骤 2： 将 Q、K 拆成两半 · 步骤 3： 两个 softmax branches + 相减 · 步骤 4： 噪声抵消测量 · 步骤 5： V1 vs V2 参数核算"
      },
      {
        "name": "Native Sparse Attention (DeepSeek NSA)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/17-native-sparse-attention/",
        "summary": "在 64k Token 下，Attention 会吞掉 70-80% 的 decode 延迟。每个 open-model 实验室都有修复它的方案。DeepSeek 的 NSA（ACL 2025 best paper）是真正站稳脚跟的方案：三个并行 Attention 分支，即压缩后的粗粒度 Token、选择性保留的细粒度 Token，以及用于 loca…",
        "keywords": "三个并行分支 · 为什么这是“natively trainable” · Hardware-aligned kernel · 计算预算 · 如何比较 · 步骤 1： 将 Token 压缩成 blocks · 步骤 2： compressed-branch Attention · 步骤 3： top-k block selection · 步骤 4： sliding-window Attention · 步骤 5： gate + combine · 步骤 6： compute counting"
      },
      {
        "name": "Multi-Token Prediction (MTP)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/18-multi-token-prediction/",
        "summary": "从 GPT-2 到 Llama 3，每个自回归 LLM 在每个位置都基于一个 loss 训练：预测下一个 Token。DeepSeek-V3 在每个位置增加了第二个 loss：预测再后面的那个 Token。额外的 14B 参数（在 671B 模型上）通过 Gradient flow 被蒸馏回主模型，而训练好的 MTP heads 在推理时被重新用于 s…",
        "keywords": "sequential MTP 配方 · 为什么是 sequential，而不是 parallel · 参数核算 · speculative-decoding 回报 · 与 EAGLE 的关系 · 步骤 1：shared embedding table · 步骤 2：per-depth combination · 步骤 3：depth k 的 transformer block · 步骤 4：shared output head · 步骤 5：per-depth loss · 步骤 6：参数核算"
      },
      {
        "name": "DualPipe Parallelism",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/19-dualpipe-parallelism/",
        "summary": "DeepSeek-V3 使用 2,048 张 H800 GPUs 训练，MoE experts 分散在多个节点上。跨节点 expert all-to-all communication 每 1 GPU-hour 的计算就需要 1 GPU-hour 的通信。GPUs 有一半时间处于空闲。DualPipe（DeepSeek，2024 年 12 月）是一种双…",
        "keywords": "Pipeline parallelism 复习 · 思路 1: chunk decomposition · 思路 2: bidirectional scheduling · A hand-traced schedule · Bubble accounting · DualPipeV — the refinement · 对 14.8T-token 运行意味着什么 · 它在 stack 中的位置"
      },
      {
        "name": "DeepSeek-V3 Architecture Walkthrough",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/",
        "summary": "Phase 10 · Lesson 14 命名了每个开放模型都会调节的六个架构旋钮。DeepSeek-V3（2024 年 12 月，总参数 671B，活跃参数 37B）调节了全部六个旋钮，并额外加入四项：Multi-Head Latent Attention、无 auxiliary Loss 的负载均衡、Multi-Token Prediction，以…",
        "keywords": "不变的核心，再看一次 · 转折：用 MLA 取代 GQA · Routing：auxiliary-loss-free load balancing · MTP：更密集的训练 + 免费 draft · 训练：DualPipe · Config，逐字段解析 · 参数核算 · 671B / 37B 比例 · DeepSeek-V3 的位置 · 后续：R1、V4"
      },
      {
        "name": "Jamba — Hybrid SSM-Transformer",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/",
        "summary": "State space model (SSM) 和 Transformer 想要的东西不同。Transformer 通过 Attention 换取质量，但代价是二次复杂度。SSM 通过递推换取线性时间推理和常量内存，但质量落后。AI21 的 Jamba（2024 年 3 月）和 Jamba 1.5（2024 年 8 月）把它们放进同一个模型：每 7 个…",
        "keywords": "An SSM in one page · The Jamba block · Why the 1:7 ratio · Positional encoding · The memory budget · Mamba-3: 2026 年的 pure-SSM baseline · 何时使用 hybrid · The competitive landscape"
      },
      {
        "name": "Async and Hogwild! Inference",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/22-async-hogwild-inference/",
        "summary": "Speculative decoding（Phase 10 · 15）会在单个 sequence 内并行化 tokens。Multi-agent frameworks 会在整个 sequences 之间并行化，但会强制显式协调（voting、sub-task splitting）。Hogwild! Inference（Rodionov et al., …",
        "keywords": "设置 · 为什么 coordination 会涌现 · 命名 · RoPE 让这变得可行 · Wall-time 数学 · 具体示例 · 什么时候使用 Hogwild! · 什么时候不使用 · 实验状态 · 步骤 1：shared cache · 步骤 2：worker loop · 步骤 3：coordination heuristic · 步骤 4：测量 speedup · 步骤 5：对 coordination 施压"
      },
      {
        "name": "Speculative Decoding and EAGLE",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/25-speculative-decoding/",
        "summary": "frontier LLM 生成一个 Token 需要对数十亿参数进行一次完整 forward pass。这个 forward pass 的配置远超实际需要：大多数时候，一个小得多的 model 就能正确猜出接下来的 3-5 个 Token，而大 model 只需要 *verify* 这个猜测。猜对时，你就以一次的成本得到了 5 个 Token。Spec…",
        "keywords": "双 Model 设置 · 精确性规则 · 期望 Speedup · 训练 Draft：Distillation · EAGLE：Tree Drafting + Feature Reuse · Tree Attention Verification · 什么时候有效，什么时候无效"
      },
      {
        "name": "Gradient Checkpointing and Activation Recomputation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/10-llms-from-scratch/34-gradient-checkpointing/",
        "summary": "Backpropagation 会保留每一个中间激活值。在 70B parameters 和 128K context 下，每个 rank 的激活值可达 3 TB。Checkpointing 用 FLOPs 换 memory：重新计算，而不是保存。问题在于该丢弃哪些 segments，答案并不是“全部丢弃”。",
        "keywords": "Backward 实际需要什么 · 朴素 Full Checkpointing · Selective Checkpointing (Korthikanti 2022) · Offload · Recompute Cost Model · Memory Savings Model · 什么时候不该 Checkpoint · Implementation Patterns · 与 TP / PP / FP8 的交互 · 步骤 1：带 Segments 的 Toy Model · 步骤 2：需要全部 Activations 的朴素 Backward · 步骤 3：Checkpoint-Every-k Memory · 步骤 4：Cost Model · 步骤 5：Memory Estimator · 步骤 6：Optimal Segment Size · 步骤 7：Selective Checkpoint Decision"
      }
    ]
  },
  {
    "id": 11,
    "name": "LLM Engineering",
    "status": "complete",
    "desc": "把 LLMs 用到 production 中。",
    "lessons": [
      {
        "name": "Prompt Engineering: Techniques & Patterns",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/01-prompt-engineering/",
        "summary": "大多数人写 prompt 的方式像是在给朋友发消息。然后他们疑惑为什么一个 200-billion parameter model 给出的答案却很平庸。Prompt engineering 不是技巧集合。它的本质是理解：你发送的每一个 Token 都是一条指令，而模型会按字面执行指令。写出更好的指令，就会得到更好的输出。事情就是这么简单，也这么难。",
        "keywords": "Prompt 的解剖结构 · Role Prompting：为什么 “You are an expert X” 有效 · Instruction Clarity：具体胜过模糊 · Output Format Control · Constraint Specification · Temperature and Sampling · Context Windows：什么放在哪里 · Prompt Patterns · Anti-Patterns · Cross-Model Prompt Design · 步骤 1：Prompt Template Library · 步骤 2： Prompt Builder · 步骤 3： Multi-Model Testing Harness · 步骤 4： Prompt Comparison and Scoring · 步骤 5： Test Suite Runner · 步骤 6： Run Everything · OpenAI：Temperature 和 System Messages · Anthropic：System Message + Assistant Prefill · Google：带 Safety Settings 的 Gemini · LangChain：Provider-Agnostic Prompts"
      },
      {
        "name": "Few-Shot, CoT, Tree-of-Thought",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/02-few-shot-cot/",
        "summary": "告诉模型要做什么是 prompting。展示给它如何思考才是 engineering。同一个模型、同一个任务、同一份数据，从 78% 到 91% 准确率的差距，不是更好的模型，而是更好的推理策略。",
        "keywords": "Zero-Shot vs Few-Shot：示例何时胜过指令 · 示例选择：相似胜过随机 · Chain-of-Thought：给模型草稿纸 · Self-Consistency：多次采样，一次投票 · Tree-of-Thought：分支式探索 · ReAct：Thinking + Doing · Structured Prompting：XML Tags、Delimiters、Headers · Prompt Chaining：顺序分解 · 性能对比 · 步骤 1：Few-Shot Example Store · 步骤 2：Chain-of-Thought Prompt Builder · 步骤 3：Self-Consistency Voting · 步骤 4：Tree-of-Thought Solver · 步骤 5：完整 Pipeline · With LangChain · With DSPy · 对比：From-Scratch vs Frameworks"
      },
      {
        "name": "Structured Outputs",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/03-structured-outputs/",
        "summary": "你的 LLM 返回的是字符串。你的应用需要的是 JSON。这个落差导致的生产系统崩溃，比任何模型幻觉都多。结构化输出是自然语言与类型化数据之间的桥梁。做对了，你的 LLM 就会成为可靠的 API。做错了，你就是凌晨 3 点还在用 regex 解析自由文本。",
        "keywords": "结构化输出谱系 · JSON Schema：契约语言 · Pydantic 模式 · Function Calling / Tool Use · 常见失败模式 · 步骤 1：JSON Schema Validator · 步骤 2：Pydantic 风格 Model 到 Schema · 步骤 3：Constrained Token Filter · 步骤 4：抽取 Pipeline · 步骤 5：运行完整 Pipeline · OpenAI Structured Outputs · Anthropic Tool Use · Instructor Library"
      },
      {
        "name": "Embeddings & Vector Representations",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/04-embeddings/",
        "summary": "文本是离散的。数学是连续的。每当你要求 LLM 查找“相似”文档、比较含义，或超越关键词进行搜索时，你都在依赖连接这两个世界的一座桥。这座桥就是 Embedding。如果你不理解 Embeddings，你就不理解现代 AI。你只是会使用它。",
        "keywords": "What Is an Embedding? · The Word2Vec Breakthrough · From Words to Sentences · Modern Embedding Models · Similarity Metrics · Vector Databases and HNSW · Chunking Strategies · Bi-Encoders 与 Cross-Encoders 对比 · Matryoshka Embeddings · Binary Quantization · 步骤 1： Text Chunking · 步骤 2： Building Embeddings from Scratch · 步骤 3： Similarity Functions · 步骤 4： Vector Index with Brute-Force Search · 步骤 5： The Semantic Search Engine · 步骤 6： Comparing Similarity Metrics"
      },
      {
        "name": "Context Engineering",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/05-context-engineering/",
        "summary": "Prompt engineering 是一个子集。Context engineering 才是全局。Prompt 是你输入的一段字符串。Context 是进入模型窗口的所有内容：system instructions、retrieved documents、tool definitions、conversation history、few-shot e…",
        "keywords": "Context Window 是稀缺资源 · Lost-in-the-Middle · Context 组件 · Context Compression 策略 · Memory Systems · Dynamic Context Assembly · 步骤 1：Token Counter · 步骤 2：Context Budget Manager · 步骤 3：Lost-in-the-Middle Reordering · 步骤 4：Conversation History Compressor · 步骤 5：Dynamic Tool Selector · 步骤 6：完整 Context Assembly Pipeline · Claude Code 的 Context 策略 · Cursor 的 Dynamic Context Loading · ChatGPT Memory · RAG 作为 Context Engineering"
      },
      {
        "name": "RAG: Retrieval-Augmented Generation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/06-rag/",
        "summary": "你的 LLM 了解其训练截止时间之前的一切。它不了解你公司的文档、你的代码库，也不了解上周的会议记录。RAG 通过检索相关文档并将它们塞入 prompt 来解决这个问题。它是生产环境中部署最广泛的 AI 模式。如果你只从这门课程中构建一个东西，那就构建一个 RAG pipeline。",
        "keywords": "The RAG Pattern · Why RAG Beats Fine-Tuning · Embedding Models · Vector Similarity · Chunking Strategies · Vector Databases · The Full Pipeline · Real Numbers · 步骤 1： Document Chunking · 步骤 2： TF-IDF Embeddings · 步骤 3： Cosine Similarity Search · 步骤 4： Prompt Construction · 步骤 5： The Complete RAG Pipeline · 步骤 6： Generation (simulated)"
      },
      {
        "name": "Advanced RAG: Chunking, Reranking",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/07-advanced-rag/",
        "summary": "Basic RAG 会检索最相似的 top-k chunk。这对简单问题有效。但面对 multi-hop reasoning、模糊 query 和大规模 corpus 时就会失效。Advanced RAG 是能在 10 个文档上运行的 demo 与能在 1000 万个文档上运行的系统之间的差别。",
        "keywords": "Hybrid Search：Semantic + Keyword · Reciprocal Rank Fusion（RRF） · Reranking · Query Transformation · Parent-Child Chunking · Metadata Filtering · Evaluation · 步骤 1：BM25 实现 · 步骤 2：Reciprocal Rank Fusion · 步骤 3：Hybrid Search Pipeline · 步骤 4：简单 Reranker · 步骤 5：HyDE（Hypothetical Document Embeddings） · 步骤 6：Parent-Child Chunking · 步骤 7：Faithfulness Evaluation"
      },
      {
        "name": "Fine-Tuning with LoRA & QLoRA",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/08-fine-tuning-lora/",
        "summary": "对一个 7B model 做 full fine-tuning 需要 56GB VRAM。你没有这么多。大多数公司也没有。LoRA 通过训练不到 1% 的参数，让你能在 6GB 中 fine-tune 同一个 model。这不是妥协 -- 它在大多数任务上能达到 full fine-tuning 的质量。整个 open-source fine-tuni…",
        "keywords": "LoRA: Low-Rank Adaptation · The Scaling Factor: Alpha · Where to Apply LoRA · Rank Selection · QLoRA: 4-Bit Quantization + LoRA · The Quality Question · Real-World Costs · The 2026 PEFT stack · Merging Adapters · When NOT to Fine-Tune · 步骤 1： The LoRA Layer · 步骤 2： LoRA-Wrapped Linear Layer · 步骤 3： Inject LoRA into a Model · 步骤 4： Count Parameters · 步骤 5： Merge Weights Back · 步骤 6： Simulated QLoRA Quantization · 步骤 7： Training Loop · 步骤 8： Full Demo"
      },
      {
        "name": "Function Calling & Tool Use",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/09-function-calling/",
        "summary": "LLMs 本身不能做任何事。它们生成文本。这就是全部能力。它们不能查看天气、查询数据库、发送电子邮件、运行代码或读取文件。你见过的每一个“AI agent”，本质上都是一个 LLM 生成 JSON，说明要调用哪个 function，然后由你的代码真正执行调用。模型是大脑。Tools 是双手。Function calling 是连接它们的神经系统。",
        "keywords": "The Function Calling Loop · Tool Definitions：JSON Schema Contract · Provider Comparison · Tool Choice: Auto, Required, Specific · Parallel Function Calling · Structured Outputs 与 Function Calling 对比 · Security: 不可妥协的规则 · Error Handling · MCP: Model Context Protocol · 步骤 1： Define the Tool Registry · 步骤 2： Implement 5 Tools · 步骤 3： Register All Tools · 步骤 4： Build the Function Calling Loop · 步骤 5： Argument Validation · 步骤 6： Run the Demo · OpenAI Function Calling · Anthropic Tool Use · MCP Integration"
      },
      {
        "name": "Evaluation & Testing",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/10-evaluation/",
        "summary": "你永远不会在没有测试的情况下部署 web app。你永远不会在没有回滚计划的情况下发布 database migration。但现在，大多数团队发布 LLM 应用的方式，是读 10 条输出然后说“嗯，看起来不错”。这不是 evaluation。这是希望。希望不是工程实践。每一次 prompt 变更、每一次 model 替换、每一次 temperatur…",
        "keywords": "The Eval Taxonomy · LLM-as-Judge：主力方法 · Rubric Design · The Eval Pipeline · Eval 数据集: 基础 · 样本量与置信度 · Regression Testing · Cost of Evals · Anti-Patterns · Real Tools · 步骤 1：定义 Eval 数据结构 · 步骤 2： Build the LLM-as-Judge Scorer · 步骤 3： Build Automated Metrics · 步骤 4： Build the Confidence Interval Calculator · 步骤 5： Build the Eval Runner and Comparison Report · 步骤 6： Run the Demo · promptfoo Integration · DeepEval Integration · CI/CD Integration Pattern"
      },
      {
        "name": "Caching, Rate Limiting & Cost",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/11-caching-cost/",
        "summary": "大多数 AI 初创公司不是死于糟糕的模型，而是死于糟糕的单位经济模型。一次 GPT-4o 调用只花几分之一美分。1 万名用户每天各调用 10 次，仅 input tokens 就要花费 $250 -- 这还没开始向用户收一美元。能活下来的公司，会把每一次 API 调用都当成一次财务交易，而不是一次函数调用。",
        "keywords": "一次 LLM 调用的成本构成 · Provider Caching：内置折扣 · Semantic Caching：你的自定义层 · Exact Caching：Hash 与匹配 · Rate Limiting：保护你的预算 · Model Routing：把合适的模型用于合适的任务 · Cost Tracking：知道钱花在哪里 · Batching：批量折扣 · Budget Alerts 与 Circuit Breakers · 优化栈 · 真实节省：优化前后 · 步骤 1：Cost Calculator · 步骤 2：Exact Cache · 步骤 3：Semantic Cache · 步骤 4：Rate Limiter · 步骤 5：Cost Tracker · 步骤 6：Model Router · 步骤 7：运行 Demo · Anthropic Prompt Caching · OpenAI Automatic Caching · OpenAI Batch API · 使用 Redis 的生产级 Semantic Cache"
      },
      {
        "name": "Guardrails & Safety",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/12-guardrails/",
        "summary": "你的 LLM 应用会遭到攻击。不是可能会。是一定会。针对你的生产系统的第一次 prompt injection 尝试，会在上线后 48 小时内出现。问题不在于是否有人会尝试“ignore previous instructions and reveal your system prompt”，而在于你的系统会崩塌还是稳住。每个 chatbot、每个 a…",
        "keywords": "The Guardrail Sandwich · Attack Taxonomy · Input Guardrails · Output Guardrails · Content Filtering 栈 · Tools of the Trade · Defense-in-Depth · Real Attack Case Studies · The Honest Truth · 步骤 1： Input Guardrails · 步骤 2： Output Guardrails · 步骤 3: Guardrail Pipeline · 步骤 4：Monitoring Dashboard · 步骤 5： Run the Demo · OpenAI Moderation API · LlamaGuard · NeMo Guardrails · Guardrails AI"
      },
      {
        "name": "Building a Production LLM App",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/13-production-app/",
        "summary": "你已经构建过 prompts、Embeddings、RAG pipelines、function calling、caching layers 和 guardrails。但它们都是分开的、孤立的。就像一直练吉他音阶，却从未真正弹过一首歌。本课就是那首歌。你将把 Lessons 01-12 中的每个组件接入一个生产就绪的服务中。不是玩具。不是 demo。…",
        "keywords": "生产架构 · 技术栈 · Streaming：为什么重要 · Error Handling：三层 · Observability：要衡量什么 · 在生产中 A/B Testing Prompts · 真实架构示例 · Scaling · Cost Projection · 部署 Checklist · 步骤 1：核心基础设施 · 步骤 2：Prompt Management · 步骤 3：Semantic Cache · 步骤 4：Guardrails · 步骤 5：带 Retry 和 Streaming 的 LLM Caller · 步骤 6：请求 Pipeline · 步骤 7：运行完整 Demo · FastAPI Server（生产部署） · 真实 API 集成 · Docker Deployment"
      },
      {
        "name": "Model Context Protocol (MCP)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/14-model-context-protocol/",
        "summary": "2025 年之前构建的每个 LLM app 都发明了自己的 tool schema。然后 Anthropic 发布了 MCP，Claude 采用了它，OpenAI 采用了它，到 2026 年，它已经成为将任何 LLM 连接到任何 tool、data source 或 agent 的默认 wire format。编写一个 MCP server，每个 ho…",
        "keywords": "handshake · MCP 不是什么 · 步骤 1：一个最小 MCP server · 步骤 2：从 host 调用 MCP server · 步骤 3：streamable HTTP transport · 步骤 4：scoping 和 safety"
      },
      {
        "name": "Prompt Caching & Context Caching",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/15-prompt-caching/",
        "summary": "你的 system prompt 有 4,000 个 Token。你的 RAG context 有 20,000 个 Token。每次请求你都会同时发送两者。你也会为两者付费——每一次。Prompt caching 让 provider 在其侧保持该 prefix 热启，并在复用时按正常费率的 10% 向你计费。使用得当，它可以将推理成本降低 50–9…",
        "keywords": "对 cache 友好的布局 · break-even 计算 · 步骤 1： 使用显式 markers 的 Anthropic prompt caching · 步骤 2: 一小时 extended TTL · 步骤 3： OpenAI 自动 caching · 步骤 4： Gemini 显式 context caching · 步骤 5： 在生产中衡量 hit rate"
      },
      {
        "name": "LangGraph: State Machines for Agents",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/16-langgraph-state-machines/",
        "summary": "手写的 ReAct loop 是一个 `while True`。用 LangGraph 写的 ReAct loop 是一个 graph，你可以对它 checkpoint、interrupt、branch，并进行 time-travel。agent 本身没有变，变化的是包在它外面的 harness。",
        "keywords": "四种超能力 · Reducers 才是重点 · 四个 nodes 的 ReAct graph · StateGraph vs Send（fanout） · Subgraphs · 步骤 1： state and nodes · 步骤 2： run with a thread · 步骤 3: 添加 human-in-the-loop interrupt · 步骤 4: 用于调试的 time-travel · 步骤 5：为生产环境替换 checkpointer"
      },
      {
        "name": "Agent Framework Tradeoffs",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/11-llm-engineering/17-agent-framework-tradeoffs/",
        "summary": "每个 framework 都在卖同一个 demo（research agent 构建报告），也都藏着同一个 bug（state schema 和 orchestration layer 互相打架）。选择那个抽象与你的问题形状匹配的 framework；其余都是你要写两遍的 glue code。",
        "keywords": "“抽象”到底是什么意思 · State 问题 · Branching 问题 · Observability 问题 · Cost 和 latency · Interoperability"
      }
    ]
  },
  {
    "id": 12,
    "name": "Multimodal AI",
    "status": "complete",
    "desc": "跨 modalities 观看、聆听、阅读和推理 —— 从 ViT patches 到 computer-use agents。",
    "lessons": [
      {
        "name": "Vision Transformers and the Patch-Token Primitive",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/01-vision-transformer-patch-tokens/",
        "summary": "在任何 Multimodal 处理之前，图像都必须变成 Transformer 可以处理的 Token 序列。2020 年的 ViT 论文用 16x16 像素 patch、线性投影和位置 Embedding 回答了这个问题。五年后，每一个 2026 年 frontier model（Claude Opus 4.7 原生 2576px、Gemini 3.…",
        "keywords": "Patches as tokens · Positional embeddings · CLS Token、pooled output 和 register tokens · 预训练：监督式、对比式、masked、自蒸馏 · Scaling laws · Parameter count for a ViT · 2026 production config"
      },
      {
        "name": "CLIP and Contrastive Vision-Language Pretraining",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/02-clip-contrastive-pretraining/",
        "summary": "OpenAI 的 CLIP（2021）证明了一个足以驱动接下来五年的核心想法：只使用嘈杂的 Web image-caption pairs 和一个 contrastive loss，把 image encoder 与 text encoder 对齐到同一个 Vector space 中。零 supervised labels。400M pairs。得到…",
        "keywords": "The dual encoder · InfoNCE loss · Temperature · 为什么 sigmoid 扩展性更好（SigLIP） · Zero-shot classification · Linear probes 与 finetuning · SigLIP 2：NaFlex 和 dense features · ALIGN, BASIC, OpenCLIP, EVA-CLIP · The zero-shot ceiling"
      },
      {
        "name": "BLIP-2 Q-Former as Modality Bridge",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/03-blip2-qformer-bridge/",
        "summary": "CLIP 对齐图像和文本，但不能生成 caption、回答问题或进行对话。BLIP-2 (Salesforce, 2023) 用一个小型可训练桥接解决了这个问题：32 个可学习 query Vector 通过 cross-attention 关注 frozen ViT 的 features，然后直接插入 frozen LLM 的输入流。188M 参数的…",
        "keywords": "Learnable queries · Architecture · Two-stage training · Parameter economics · InstructBLIP 与指令感知型 Q-Former · MiniGPT-4 与 projector-only approach · Why LLaVA went simpler · Gated cross-attention：Flamingo，这个 ancestor · The 2026 descendants"
      },
      {
        "name": "Flamingo and Gated Cross-Attention",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/04-flamingo-gated-cross-attention/",
        "summary": "DeepMind 的 Flamingo（2022）比其他人更早完成了两件事。它证明单个模型可以处理图像、video 和文本任意交错的序列。它还证明 VLMs 可以进行 in-context 学习 — 给出包含三个（图像，caption）示例对的 few-shot prompt，模型就能在没有任何 Gradient step 的情况下为新图像生成 cap…",
        "keywords": "The frozen LLM · Perceiver resampler · Gated cross-attention · 用于 interleaved inputs 的 masked cross-attention · In-context few-shot learning · Training data · OpenFlamingo and Otter · The descendants · Comparison to BLIP-2"
      },
      {
        "name": "LLaVA and Visual Instruction Tuning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/05-llava-visual-instruction-tuning/",
        "summary": "LLaVA（2023 年 4 月）是地球上被复制最多的 Multimodal 架构。它用 2-layer MLP 替代了 BLIP-2 的 Q-Former，用朴素的 Token concatenation 替代了 Flamingo 的 gated cross-attention，并在 158k 条 visual-instruction turns 上…",
        "keywords": "架构 · Stage 1：projector alignment · Stage 2：visual instruction tuning · 为什么社区复制了这个方案 · LLaVA-1.5 与 LLaVA-NeXT · LLaVA-OneVision · 与 Q-Former 的比较 · Prompt format · 参数经济性"
      },
      {
        "name": "Any-Resolution Vision — Patch-n'-Pack and NaFlex",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/06-any-resolution-patch-n-pack/",
        "summary": "真实图像不是 224x224 的正方形。收据是 9:16，图表是 16:9，医学扫描可能是 4096x4096，手机截图是 9:19.5。2024 年之前的 VLM 答案——把所有内容 resize 成固定正方形——丢掉了让 OCR、文档理解和高分辨率场景解析真正可用的信号。NaViT（Google，2023）展示了可以用 block-diagonal…",
        "keywords": "NaViT and patch-n'-pack · AnyRes (LLaVA-NeXT) · M-RoPE (Qwen2-VL) · NaFlex (SigLIP 2) · The packing mask · Token budgets"
      },
      {
        "name": "Open-Weight VLM Recipes: What Actually Matters",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/07-open-weight-vlm-recipes/",
        "summary": "2024-2026 年的 open-weight VLM 文献是一片 ablation tables 的森林。Apple 的 MM1 测试了 13 种 image encoder、connector 和 data mix 的组合。Allen AI 的 Molmo 证明，详细的人类 captions 胜过 GPT-4V distillation。Camb…",
        "keywords": "五轴 design space · Axis 1：encoder > connector · Axis 2：connector design 差异不大 · Axis 3：LLM size 决定上限 · Axis 4：data —— 详细的人类 captions 胜过 distillation · Axis 5：resolution 及其 schedule · Prismatic 的受控对比 · 2026 年 picker"
      },
      {
        "name": "LLaVA-OneVision: Single, Multi, Video",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/08-llava-onevision-single-multi-video/",
        "summary": "在 LLaVA-OneVision（Li et al., 2024 年 8 月）之前，开放 VLM 世界有着彼此分离的谱系：用于单图像的 LLaVA-1.5，像 Mantis 和 VILA 这样的多图像模型，以及像 Video-LLaVA 和 Video-LLaMA 这样的视频模型。每一种都赢得了自己的 benchmark，却在其他场景上失败。LLaV…",
        "keywords": "OneVision Token 预算 · 三阶段 curriculum · 为什么 curriculum 有效 · 跨场景 emergent skills · 视觉 Token pooling · LLaVA-OneVision-1.5 · 与 Qwen2.5-VL 对比"
      },
      {
        "name": "Qwen-VL Family and Dynamic-FPS Video",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/",
        "summary": "Qwen-VL family — Qwen-VL (2023)、Qwen2-VL (2024)、Qwen2.5-VL (2025)、Qwen3-VL (2025) — 是 2026 年最有影响力的开放 vision-language model 谱系。每一代都做出了一个决定性的架构押注，并在十二个月内被开放生态的其他项目复制：通过 M-RoPE 实现原…",
        "keywords": "Qwen-VL (August 2023) · Qwen2-VL (September 2024) — M-RoPE 与原生分辨率 · Qwen2.5-VL（2025 年 2 月）— dynamic FPS + absolute time · Qwen3-VL (November 2025) · M-RoPE mathematically · Dynamic-FPS 采样逻辑 · Structured agent output"
      },
      {
        "name": "InternVL3 Native Multimodal Pretraining",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/10-internvl3-native-multimodal/",
        "summary": "InternVL3 之前的每个开源 VLM 都遵循同一个三步配方：拿一个在数万亿 text tokens 上训练过的 text LLM，接上一个 vision encoder，然后 fine-tune 接缝处。这能工作，但会产生 alignment debt：text LLM 已经把完整的 pretraining budget 花在纯文本上，并不原生理…",
        "keywords": "Native Multimodal pretraining · V2PE (variable visual position encoding) · Visual Resolution Router (ViR) · Decoupled Vision-Language deployment (DvD) · Single-stage vs multi-stage quality · InternVL3.5 and InternVL-U · native pretraining 的取舍"
      },
      {
        "name": "Chameleon Early-Fusion Token-Only",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/",
        "summary": "到目前为止，我们见过的每个 VLM 都把图像和文本分开处理。视觉 Token 来自 vision encoder，流入 projector，然后在 LLM 内部与文本相遇。视觉词表和文本词表从不重叠。Chameleon（Meta，2024 年 5 月）提出了一个问题：如果它们重叠会怎样？训练一个 VQ-VAE，把图像转换为来自共享词表的一串离散 Tok…",
        "keywords": "VQ-VAE 作为图像 Tokenizer · 共享词表 · 混合模态生成 · 训练稳定性：QK-Norm、dropout、LayerNorm ordering · Tokenizer 的重建上限 · Chameleon vs BLIP-2 / LLaVA · Fuyu 和 AnyGPT"
      },
      {
        "name": "Emu3 Next-Token Prediction for Generation",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/12-emu3-next-token-for-generation/",
        "summary": "BAAI 的 Emu3（Wang et al.，2024 年 9 月）是 2024 年本应终结 Diffusion 与 autoregressive 之争的结果。一个单一的 Llama-style decoder-only Transformer，只在 next-token-prediction 目标上训练，覆盖 text + VQ image tok…",
        "keywords": "The Emu3 tokenizer · Single-loss training · Classifier-free guidance 和 temperature · Three roles, one model · Benchmarks · Compute cost · Why it matters"
      },
      {
        "name": "Transfusion Autoregressive + Diffusion",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/",
        "summary": "Chameleon 和 Emu3 把全部筹码押在离散 Token 上。它们能工作，但量化瓶颈很明显：图像质量会在低于连续空间 diffusion 模型的位置进入平台期。Transfusion（Meta，Zhou et al.，2024 年 8 月）押了相反的方向：保持图像连续，完全去掉 VQ-VAE，并用两个 loss 训练一个 transformer…",
        "keywords": "双 loss 架构 · Attention mask：causal text + bidirectional image · Transformer 内部的 diffusion loss · MMDiT：Stable Diffusion 3 的变体 · 为什么它胜过 Chameleon-style · 下游分支"
      },
      {
        "name": "Show-o Discrete-Diffusion Unified",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/",
        "summary": "Transfusion 混合连续和离散表示。Show-o（Xie et al., 2024 年 8 月）走的是另一条路：text tokens 使用 causal next-token prediction，image tokens 使用 MaskGIT 思路下的 masked discrete diffusion。二者都位于一个带 hybrid at…",
        "keywords": "Masked discrete diffusion (MaskGIT) · Show-o：one Transformer, hybrid mask · Parallel sampling · Tasks in one checkpoint · Masking schedule · Show-o2 · Where Show-o sits"
      },
      {
        "name": "Janus-Pro Decoupled Encoders",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/",
        "summary": "统一 Multimodal 模型存在一种无法避免的张力。理解需要语义特征，即 SigLIP 或 DINOv2 输出的 Vectors，富含概念级信息。生成需要有利于重建的 codes，即能够重新组合成清晰 pixels 的 VQ Tokens。这两个目标在单个 Encoder 中并不兼容。Janus（DeepSeek，2024 年 10 月）和 Jan…",
        "keywords": "解耦视觉编码 · 为什么这有效 · 数据扩展：Janus vs Janus-Pro · JanusFlow：rectified flow 变体 · 共享 body 的职责 · 与 InternVL-U 对比 · 局限"
      },
      {
        "name": "MIO Any-to-Any Streaming",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/16-mio-any-to-any-streaming/",
        "summary": "GPT-4o 交付了一个大多数 open models 无法复现的产品：一个能实时听到语音、看到视频并开口回应的 agent。到 2024 年末，open-ecosystem 的答案是 MIO（Wang et al., September 2024）。MIO Tokenize 文本、图像、语音和音乐，在交错序列上训练一个 causal transfor…",
        "keywords": "四种 modality 的四个 Tokenizer · Streaming decode · 四阶段 curriculum · Chain-of-visual-thought · Any-to-any 的竞争者 · Latency budget · 为什么 any-to-any 仍然困难"
      },
      {
        "name": "Video-Language Temporal Grounding",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/17-video-language-temporal-grounding/",
        "summary": "Video 不是一叠照片。一个 5 秒 clip 有因果顺序、动作动词和事件时序，这些是 image model 无法表示的。Video-LLaMA（Zhang et al., June 2023）发布了第一个具备 audio-visual grounding 的开放 video-LLM。VideoChat 和 Video-LLaVA 扩展了这一模式。…",
        "keywords": "Video-LLaMA：每个 clip 一个 Q-former + audio branch · VideoChat and Video-LLaVA · Qwen2.5-VL and TMRoPE · Frame sampling strategies · Pooling per frame · The four video benchmarks · Grounding output formats · 2026 best practice"
      },
      {
        "name": "Long-Video at Million-Token Context",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/18-long-video-million-token/",
        "summary": "一个 1 小时的 4K 视频，24 FPS，经过 patching 和 Embedding 后，会产生约 6000 万个 Token。一个转录后的 2 小时播客单集是 30,000 个 Token。一部长篇 Blu-ray 电影，即使使用激进的 pooling 压缩，也会有数十万 Token。Google 的 Gemini 1.5（2024 年 3 月…",
        "keywords": "Path 1: brute context（Gemini 1.5, Claude Opus） · 路径 2：Ring attention (LWM, LongVILA) · 路径 3：Token 压缩 (Video-XL, LongVA) · 路径 4：Agentic retrieval (VideoAgent) · Needle-in-a-haystack benchmark · Which path to pick · 2026 production pattern"
      },
      {
        "name": "Audio-Language Models: Whisper to AF3",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/19-audio-language-whisper-to-af3/",
        "summary": "Whisper（Radford 等，2022 年 12 月）让语音识别尘埃落定：68 万小时弱监督多语言语音、一个简单的 encoder-decoder Transformer、一个让之后每个 ASR 发布都要引用它的 benchmark。但识别不是推理。询问“这段录音里有哪些乐器”或“说话者表达了什么情绪”或“第 3 分钟发生了什么”，需要的是音频理…",
        "keywords": "Log-Mel spectrogram：输入特征 · Whisper 的 encoder · BEATs 和音频专用 encoders · Audio Q-former · 这条演进路径：SALMONN、Qwen-Audio、AF3 · Cascaded vs end-to-end · 2026 production recipe · MMAU：音频推理 benchmark"
      },
      {
        "name": "Omni Models: Thinker-Talker Streaming",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/20-omni-models-thinker-talker/",
        "summary": "GPT-4o 在 2024 年 5 月的产品演示之所以具有冲击力，不是因为底层模型，而是因为产品形态：一个语音界面，你说话，模型看到摄像头看到的内容，并在 250ms 内用语音回应。开放生态在 2024 年余下时间和 2025 年持续竞速，试图达到这个产品表面。Qwen2.5-Omni（2025 年 3 月）是参考级开放设计：一个 Thinker（大型…",
        "keywords": "Thinker and Talker · TMRoPE — 时间对齐的 Multimodal 位置 · Streaming 语音合成 · VAD and turn-taking · Qwen3-Omni（2025 年 11 月） · Production latency budget · Token-rate math"
      },
      {
        "name": "Embodied VLAs: RT-2, OpenVLA, π0, GR00T",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/",
        "summary": "第一次由模型从网站读取食谱并在厨房机器人中执行，是 RT-2（Google DeepMind，2023 年 7 月）。RT-2 将动作离散化为 text Token，在 web data 与 robot-action data 上对 VLM 进行 co-fine-tuning，并证明 web-scale vision-language 知识可以迁移到机…",
        "keywords": "Action tokenization（RT-2） · OpenVLA — 开放的 7B 参考实现 · FAST tokenizer — 更快的 action decode · π0 和 flow-matching actions · GR00T N1 — 面向 humanoids 的 dual-system · Open X-Embodiment · Co-fine-tuning 与 robot-only · Safety 和 action limits"
      },
      {
        "name": "Document and Diagram Understanding",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/22-document-diagram-understanding/",
        "summary": "文档不是照片。PDF、科学论文、发票或手写表单包含 layout、表格、图表、脚注、页眉和语义结构，这些是普通图像理解无法捕获的。VLM 之前的 stack 是一个 pipeline：Tesseract OCR + LayoutLMv3 + 表格抽取 heuristics。VLM 浪潮用 OCR-free models 取代了它——Donut (202…",
        "keywords": "Era 1 — OCR pipeline（2021 年前） · TrOCR (2021) · Era 2 — OCR-free（2022-2023） · LayoutLMv3 (2022) · DocLLM (2023) · Era 3 — VLM-native（2024+） · Claude 4.7 / GPT-5 前沿 · 数学 equations 和 LaTeX 输出 · 手写 · 2026 recipe"
      },
      {
        "name": "ColPali Vision-Native Document RAG",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/23-colpali-vision-native-rag/",
        "summary": "传统 RAG 会把 PDFs 解析成文本，切成 chunks，Embedding chunks，并存储 Vectors。每一步都会丢失信号：OCR 会丢掉 chart data，chunking 会打断 table rows，text embeddings 会忽略 figures。ColPali（Faysse et al., July 2024）提出了…",
        "keywords": "ColBERT (2020) · ColPali · ColQwen2 和 ColSmol · VisRAG · M3DocRAG · ViDoRe — benchmark · End-to-end RAG pipeline · Storage math · Text-RAG 仍然胜出的场景"
      },
      {
        "name": "Multimodal RAG and Cross-Modal Retrieval",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/24-multimodal-rag-cross-modal/",
        "summary": "Vision-native document RAG 只是其中一个切片。生产级 Multimodal RAG 的范围更广：在 text、images、audio、video 之间 retrieval，用于 trip planning（“帮我找一家安静、有自然光的 vegan brunch”）、medical triage（“什么 injury 匹配这张…",
        "keywords": "Cross-modal retrieval · Fusion strategies · Generation grounding · The 2025 surveys · MuRAG — foundational paper · 一个生产级 trip-planner 示例 · Agentic multimodal RAG · Evaluation"
      },
      {
        "name": "Multimodal Agents and Computer-Use (Capstone)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/12-multimodal-ai/25-multimodal-agents-computer-use/",
        "summary": "2026 年的 frontier product 是一个 Multimodal agent：它能读取 screenshots、点击 buttons、浏览 web UIs、填写 forms，并端到端完成 workflows。SeeClick 和 CogAgent（2024）证明了 GUI-grounding primitive。Ferret-UI 增加了…",
        "keywords": "GUI grounding — primitive · Action schemas · 仅截图 vs 可访问性树 · Long-horizon memory · Visual tool use · The 2026 benchmarks · Why it's still hard · The capstone build-it"
      }
    ]
  },
  {
    "id": 13,
    "name": "Tools & Protocols",
    "status": "complete",
    "desc": "AI 与真实世界之间的接口。",
    "lessons": [
      {
        "name": "The Tool Interface",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/01-the-tool-interface/",
        "summary": "语言模型会生成 tokens。程序会执行动作。两者之间的差距就是 tool interface：一种 contract，让模型能够请求某个动作，并让 host 执行它。2026 年的每一种 stack——OpenAI、Anthropic 和 Gemini 上的 function calling；MCP 的 `tools/call`；A2A 的 task…",
        "keywords": "Step one: describe · Step two: decide · Step three: execute · Step four: observe · The trust split · Where the loop lives · 为什么不直接 prompt 模型输出 JSON? · Circuit breakers · Phase 13 接下来走向哪里"
      },
      {
        "name": "Function Calling Deep Dive",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/02-function-calling-deep-dive/",
        "summary": "这三家 frontier providers 在 2024 年收敛到了同一个 tool-call loop，然后在其他所有地方分道扬镳。OpenAI 使用 `tools` 和 `tool_calls`。Anthropic 使用 `tool_use` 和 `tool_result` blocks。Gemini 使用 `functionDeclaratio…",
        "keywords": "The common structure · 逐个 field 比较 shape diff · 你实际会遇到的限制 · `tool_choice` behavior · Parallel calls · Streaming · Errors and repair · The translator pattern"
      },
      {
        "name": "Parallel and Streaming Tool Calls",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls/",
        "summary": "三个独立天气查询如果串行执行，就是三次往返。并行运行后，总耗时会降到最慢的单个调用。现在每个 frontier provider 都能在单个 turn 中发出多个 tool call。收益是真实的；管道细节很微妙。本课会讲清两部分：parallel fan-out 和 streamed-argument 重组，重点关注 id-correlation 陷阱。",
        "keywords": "启用 parallel · Id correlation · 并发运行 calls · Streaming tool calls · Partial JSON 和 parse-early 陷阱 · Out-of-order completion · Benchmark：sequential vs parallel · Streaming fan-out 的 wall-clock"
      },
      {
        "name": "Structured Output",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/04-structured-output/",
        "summary": "“好好要求模型返回 JSON”即使在前沿模型上，也有 5% 到 15% 的时间会失败。结构化输出通过 Constrained Decoding 缩小了这个差距：模型实际上会被阻止生成任何违反 schema 的 Token。OpenAI 的 strict mode、Anthropic 的 schema-typed tool use、Gemini 的 `r…",
        "keywords": "JSON Schema 2020-12 — 通用语 · Pydantic，Python 绑定 · Zod，TypeScript 绑定 · Refusals · 开放环境中的 Constrained Decoding · 三种失败模式 · 重试策略 · 小模型支持"
      },
      {
        "name": "Tool Schema Design",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/05-tool-schema-design/",
        "summary": "当 model 无法判断何时使用某个工具时，一个正确的工具也会静默失败。命名、描述和参数形态会让 StableToolBench 和 MCPToolBench++ 等 benchmark 上的 tool-selection accuracy 出现 10 到 20 个百分点的波动。本课会命名这些设计规则，它们区分了 model 能稳定选中的工具，以及 m…",
        "keywords": "Naming rules · Description pattern · Atomic vs monolithic · Parameter design · Error message 作为教学信号 · Versioning · Tool poisoning prevention · Benchmarks"
      },
      {
        "name": "MCP Fundamentals",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/06-mcp-fundamentals/",
        "summary": "MCP 之前的每个 integration 都是一次性的。Model Context Protocol 最早由 Anthropic 于 2024 年 11 月发布，现在由 Linux Foundation 的 Agentic AI Foundation 托管，它标准化了 discovery 和 invocation，让任何 client 都能与任何 s…",
        "keywords": "三个 server primitives · 三个 client primitives · Wire format: JSON-RPC 2.0 · 三阶段 lifecycle · Capability negotiation · Structured content 和 error shapes · Client capabilities vs tool call details · 为什么是 JSON-RPC 而不是 REST？"
      },
      {
        "name": "Building an MCP Server",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/07-building-an-mcp-server/",
        "summary": "大多数 MCP tutorials 只展示 stdio hello-world。真正的 server 会暴露 tools、resources 和 prompts，处理 capability negotiation，发出 structured errors，并且在不同 SDKs 中行为一致。本课端到端构建一个 notes server：stdlib st…",
        "keywords": "Dispatch loop · 实现 `initialize` · 实现 `tools/list` 和 `tools/call` · 实现 resources · 实现 prompts · Stdio transport 细节 · Annotations · Graduation path"
      },
      {
        "name": "Building an MCP Client",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/08-building-an-mcp-client/",
        "summary": "大多数 MCP 内容会提供 server tutorial，却对 client 一笔带过。Client code 才是复杂 orchestration 所在：process spawning、capability negotiation、跨多个 server 合并 tool list、sampling callbacks、reconnection，以及…",
        "keywords": "Child-process spawning · Per-server session state · Merged namespace · Routing · Sampling callback · Notification handling · Reconnection · Keepalive and session id"
      },
      {
        "name": "MCP Transports",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/09-mcp-transports/",
        "summary": "stdio 只适合本地，别处都不适合。Streamable HTTP (2025-03-26) 是远程标准。旧的 HTTP+SSE transport 已被弃用，并将在 2026 年中期移除。选错 transport 会带来一次迁移成本；选对 transport 会得到一个可远程托管的 MCP server，并具备 session continuity…",
        "keywords": "stdio · Streamable HTTP · Single endpoint vs two · `Origin` 校验与 DNS-rebinding · Session id lifecycle · Keepalive and reconnect · 向后兼容性 probe · Cloudflare、ngrok 与 hosting · Gateway composition · Transport failure modes · 何时绕过 Streamable HTTP"
      },
      {
        "name": "MCP Resources and Prompts",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/10-mcp-resources-and-prompts/",
        "summary": "Tools 得到了 MCP 90% 的关注。另外两个 server primitive 解决的是不同问题。Resources 暴露可读取的数据；prompts 暴露可复用的模板，作为 slash-commands。许多 server 应该使用 resources，而不是把读取操作包进 tools；也应该使用 prompts，而不是把 workflow …",
        "keywords": "Tools vs resources vs prompts — 决策规则 · Resources · Resource subscriptions · Resource templates（2025-11-25 addition） · Prompts · Hosts and prompts · The \"list changed\" notification · Content type conventions · Dynamic resources · Subscriptions vs polling · Prompts vs system prompts"
      },
      {
        "name": "MCP Sampling",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/11-mcp-sampling/",
        "summary": "大多数 MCP servers 都是简单执行器：接收 arguments、运行代码、返回 content。Sampling 让 server 能够反转方向：它请求 client 的 LLM 做决策。这使得 server-hosted agent loops 成为可能，而 server 不需要持有任何 model credentials。SEP-1577…",
        "keywords": "`sampling/createMessage` request · `modelPreferences` · `includeContext` · 使用 tools 进行 Sampling (SEP-1577) · Human-in-the-loop · 不使用 API keys 的 server-hosted loops · Safety risks（Unit 42 disclosure，2026 Q1）"
      },
      {
        "name": "MCP Roots and Elicitation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/",
        "summary": "一旦用户打开另一个项目，硬编码路径就会失效。当用户给出的信息不足时，预填的 tool arguments 也会失效。Roots 将 server 限定在一组由用户控制的 URI 内；elicitation 会在 tool call 执行中途暂停，通过表单或 URL 向用户请求结构化输入。两个 client primitives，分别修复常见 MCP f…",
        "keywords": "Roots · 为什么 roots 是 client primitive · Elicitation：默认 form-mode · Elicitation：URL mode (SEP-1036, experimental) · 何时 elicitation 是合适的 tool · When elicitation is wrong · Human-in-the-loop bridge"
      },
      {
        "name": "MCP Async Tasks",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/13-mcp-async-tasks/",
        "summary": "真实的 agent 工作需要数分钟到数小时：CI runs、deep-research synthesis、batch exports。同步 tool calls 会断开连接、超时，或阻塞 UI。SEP-1686 于 2025-11-25 合并，新增了 Tasks primitive：任何 request 都可以被增强为 task，结果可以稍后获取，或…",
        "keywords": "Task augmentation · Per-tool opt-in · States · Methods · Streaming state changes · Durable state · Cancellation semantics · Crash recovery · Async tasks plus sampling · Why this is experimental"
      },
      {
        "name": "MCP Apps",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/14-mcp-apps/",
        "summary": "纯文本 tool output 限制了 agents 能展示的内容。MCP Apps（SEP-1724，2026 年 1 月 26 日正式发布）让 tool 返回 sandboxed interactive HTML，并在 Claude Desktop、ChatGPT、Cursor、Goose 和 VS Code 中 inline 渲染。Dashboa…",
        "keywords": "`ui://` resource scheme · Iframe sandbox · postMessage protocol · Permissions · Security risks · `ui/initialize` handshake · AppRenderer / AppFrame SDK primitives · Ecosystem status"
      },
      {
        "name": "MCP Security I — Tool Poisoning",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/",
        "summary": "Tool descriptions 会原样进入模型的 context。恶意 server 会Embedding用户永远看不到的隐藏 instructions。Invariant Labs、Unit 42 以及一篇 2026 年 3 月发布的 arXiv 研究在 2025-2026 年的研究中测得：frontier models 的 attack-suc…",
        "keywords": "Attack 1: tool poisoning · Attack 2: rug pulls · 攻击 3：cross-server tool shadowing · 攻击 4：MCP Preference Manipulation Attacks (MPMA) · 攻击 5：寄生式 toolchains · 攻击 6：sampling 攻击 · 攻击 7：supply-chain 伪装 · 二者规则（Meta, 2026） · Defenses that work · 单独使用不起作用的防御措施"
      },
      {
        "name": "MCP Security II — OAuth 2.1",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/",
        "summary": "Remote MCP servers 需要 authorization，而不只是 authentication。2025-11-25 spec 与 OAuth 2.1 + PKCE + resource indicators (RFC 8707) + protected-resource metadata (RFC 9728) 对齐。SEP-835 增…",
        "keywords": "Roles · Authorization code + PKCE · Protected-resource metadata (RFC 9728) · Resource indicators (RFC 8707) · Scope model · Step-up authorization (SEP-835) · Token audience validation · 短生命周期 tokens 与轮换 · No token passthrough · Confused deputy 防护 · Client ID discovery · Gateways and OAuth"
      },
      {
        "name": "MCP Gateways and Registries",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/17-mcp-gateways-and-registries/",
        "summary": "企业不能允许每个 dev 随意安装随机 MCP servers。gateway 会集中 auth、RBAC、audit、rate limiting、caching 和 tool-poisoning detection，然后把合并后的工具表面作为单个 MCP endpoint 暴露出去。Official MCP Registry（Anthropic + …",
        "keywords": "五项 gateway 职责 · Gateway 作为单个 endpoint · Credential vaulting · Gateway 上的 tool-hash pinning · Policy-as-code · Session-aware routing · Namespace merging · Registries · Reverse-DNS naming · Vendor 概览，2026 年 4 月"
      },
      {
        "name": "MCP Auth in Production — DCR + JWKS on iii",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/18-mcp-auth-production/",
        "summary": "第 16 课在内存中建立了 OAuth 2.1 状态机。到 2026 年，您运送到真实组织的每台 MCP 服务器都位于生产身份验证之后：可扩展到无限客户端人口的客户端注册（首先是客户端 ID 元数据文档，动态客户端注册作为向后兼容的后备）、授权服务器元数据发现（RFC 8414 *或* OpenID Connect Discovery）、不会破坏凌晨 …",
        "keywords": "RFC 8414 — OAuth 授权服务器元数据 · RFC 9728（回顾）——受保护的资源元数据 · 客户端 ID 元数据文档（推荐默认值） · RFC 7591 — 动态客户端注册（后备/向后兼容性） · RFC 8707（回顾）——资源指标 · RFC 7636（回顾）——PKCE · MCP 规范 2025-11-25 授权简介 · IdP 能力矩阵 · JWKS刷新模式（在AS轮转，在资源服务器刷新） · 验证例程 · 观众重播演练（访问令牌权限限制） · 混合攻击（服务器无法提供的客户端防御） · 故障模式- **过时的 JWKS。** AS 轮换密钥后，验证器会拒绝有效令牌。修复方法是上面的 cron-refresh + cache-miss-refetch 模式。切勿在没有刷新作业的情况下缓存 JWKS。"
      },
      {
        "name": "A2A Protocol",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/19-a2a-protocol/",
        "summary": "MCP 是 agent-to-tool。A2A (Agent2Agent) 是 agent-to-agent，也就是一个开放协议，用于让基于不同框架构建的不透明 agent 进行协作。它由 Google 于 2025 年 4 月发布，2025 年 6 月捐赠给 Linux Foundation，并于 2026 年 4 月达到 v1.0，拥有包括 AWS…",
        "keywords": "Agent Card · Signed Agent Cards (AP2) · Task lifecycle · Messages and Parts · Artifacts · Two transport bindings · Opacity preservation · Timeline · Relationship to MCP"
      },
      {
        "name": "OpenTelemetry GenAI",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/20-opentelemetry-genai/",
        "summary": "一个 agent 调用了五个 tools、三个 MCP servers 和两个 sub-agents。你需要一个贯穿所有环节的 trace。OpenTelemetry GenAI semantic conventions（v1.37 及以上版本中的稳定 attributes）是 2026 年的标准，并由 Datadog、Langfuse、Arize P…",
        "keywords": "Span hierarchy · Required attributes · Span kinds · Opt-in content capture · Events on spans · Exporters · Propagation across MCP · Metrics · AgentOps layer"
      },
      {
        "name": "LLM Routing Layer",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/21-llm-routing-layer/",
        "summary": "Provider lock-in 代价高昂。不同的 tool-calling 工作负载适合不同模型。Routing gateway 提供统一的 API 表面、重试、failover、成本跟踪和 guardrails。2026 年有三种主流形态：LiteLLM（开源、自托管）、OpenRouter（托管 SaaS）、Portkey（生产级，2026 年 …",
        "keywords": "OpenAI-compatible proxy 形态 · Model aliases · Fallback chains · Semantic caching · Guardrails · Per-key rate limits · Self-hosted 与 managed 的取舍 · Cost tracking · MCP plus routing · Routing strategies"
      },
      {
        "name": "Skills and Agent SDKs",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/22-skills-and-agent-sdks/",
        "summary": "MCP 说明“有哪些工具”。Skills 说明“如何完成一项任务”。2026 年的 stack 会同时分层使用二者。Anthropic 的 Agent Skills（开放标准，2025 年 12 月）以带有 progressive disclosure 的 SKILL.md 形式发布。OpenAI 的 Apps SDK 是 MCP 加上 widget …",
        "keywords": "AGENTS.md (agents.md) · SKILL.md 格式 · Progressive disclosure · Filesystem discovery · Anthropic Claude Agent SDK · OpenAI Apps SDK · 通过 SkillKit 实现 cross-agent portability · 三层 stack"
      },
      {
        "name": "Capstone — Tool Ecosystem",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/13-tools-and-protocols/23-capstone-tool-ecosystem/",
        "summary": "Phase 13 讲授了每个组成部分。这个 capstone 会把它们连接成一个具备 production 形态的系统：一个包含 tools + resources + prompts + tasks + UI 的 MCP server，边界处的 OAuth 2.1，一个 RBAC gateway，一个 multi-server client，一次 A…",
        "keywords": "Architecture · Trace hierarchy · Security posture · Rendering · Packaging · 每节 Phase 13 课程贡献了什么"
      }
    ]
  },
  {
    "id": 14,
    "name": "Agent Engineering",
    "status": "complete",
    "desc": "从 first principles 构建 agents —— loop、memory、planning、frameworks、benchmarks、production、workbench。",
    "lessons": [
      {
        "name": "The Agent Loop",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/01-the-agent-loop/",
        "summary": "2026 年的每个 Agent — Claude Code、Cursor、Devin、Operator — 都是 2022 年 ReAct loop 的一种变体。Reasoning tokens 会与 tool calls 和 observations 交错出现，直到触发 stop condition。在接触任何 framework 之前，先彻底掌握这…",
        "keywords": "ReAct：规范格式 · 2026 年转变：原生 reasoning · 五个组成部分 · 为什么这个 loop 无处不在 · 2026 年陷阱"
      },
      {
        "name": "ReWOO and Plan-and-Execute",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/02-rewoo-plan-and-execute/",
        "summary": "ReAct 在一个 stream 中交错 thought 和 action。ReWOO 将它们分离：先制定一个完整的大计划，然后执行。Token 减少 5x，在 HotpotQA 上 accuracy 提升 +4%，并且你可以把 planner distill 到一个 7B model。Plan-and-Execute 将其泛化；Plan-and-Ac…",
        "keywords": "The three roles · Why 5x fewer tokens · Why it is more robust · Planner distillation · Plan-and-Execute (LangChain, 2023) · Plan-and-Act (Erdogan et al., arXiv:2503.09572, ICML 2025) · When to pick which"
      },
      {
        "name": "Reflexion and Verbal Reinforcement Learning",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/03-reflexion-verbal-rl/",
        "summary": "基于 Gradient 的 RL 需要数千次试验和一个 GPU cluster 才能修复一种 failure mode。Reflexion（Shinn et al., NeurIPS 2023）用自然语言完成这件事：每次失败试验后，agent 写下一段 reflection，将其存入 episodic memory，并让下一次试验基于这段 memory…",
        "keywords": "The three components · Three evaluator types · Why this generalizes · 什么时候有效，什么时候无效"
      },
      {
        "name": "Tree of Thoughts and LATS",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/04-tree-of-thoughts-lats/",
        "summary": "单条 chain-of-thought trajectory 没有回溯空间。ToT（Yao et al., 2023）将 reasoning 变成一棵树，并在每个 node 上进行 self-evaluation。LATS（Zhou et al., 2024）在 Monte Carlo Tree Search 下统一了 ToT、ReAct 和 Refl…",
        "keywords": "Tree of Thoughts (Yao et al., NeurIPS 2023) · LATS (Zhou et al., ICML 2024) · MCTS，最小形式 · 成本现实 · 2026 定位"
      },
      {
        "name": "Self-Refine and CRITIC",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/05-self-refine-and-critic/",
        "summary": "Self-Refine（Madaan et al., 2023）让一个 LLM 在循环中扮演三个角色：generate、feedback、refine。平均收益：在 7 个任务上绝对提升 +20。CRITIC（Gou et al., 2023）通过将验证路由到外部工具来强化 feedback 步骤。到 2026 年，这一模式以 “evaluator-o…",
        "keywords": "Self-Refine（Madaan et al., NeurIPS 2023） · CRITIC（Gou et al., arXiv:2305.11738, v4 Feb 2024） · 停止条件 · Evaluator-Optimizer（Anthropic, 2024） · OpenAI Agents SDK output guardrails · 2026 年的坑"
      },
      {
        "name": "Tool Use and Function Calling",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/06-tool-use-and-function-calling/",
        "summary": "Toolformer (Schick et al., 2023) 开创了 self-supervised tool annotation。Berkeley Function Calling Leaderboard V4 (Patil et al., 2025) 设定了 2026 年标准：40% agentic、30% multi-turn、10% li…",
        "keywords": "Toolformer (Schick et al., NeurIPS 2023) · Berkeley Function Calling Leaderboard V4 (Patil et al., ICML 2025) · Tool schema · Argument validation · Parallel tool calls · Sandboxing"
      },
      {
        "name": "Memory — Virtual Context and MemGPT",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/07-memory-virtual-context-memgpt/",
        "summary": "Context window 是有限的。对话、文档和 tool trace 不是。MemGPT (Packer et al., 2023) 将其类比为 OS virtual memory：main context 是 RAM，external store 是 disk，agent 在二者之间进行 page。每一个 2026 年的 memory syst…",
        "keywords": "MemGPT：OS 类比 · Two tiers · Interrupt pattern · MemGPT 的边界与 Letta 的起点 · 这个模式容易出错的地方"
      },
      {
        "name": "Memory Blocks and Sleep-Time Compute",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/",
        "summary": "MemGPT 在 2024 年成为 Letta。2026 年的演进加入了两个想法：模型可以直接编辑的离散功能性 memory blocks，以及在 primary agent 空闲时异步整合记忆的 sleep-time agent。这就是将记忆扩展到单次对话之外的方法。",
        "keywords": "Three tiers · Memory blocks · Sleep-time compute · Letta V1 与原生 reasoning · 这个模式容易出错的地方"
      },
      {
        "name": "Hybrid Memory — Mem0 Vector + Graph + KV",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/09-hybrid-memory-mem0/",
        "summary": "Mem0 (Chhikara et al., 2025) 将记忆视为三个并行存储：Vector 用于语义相似性，KV 用于快速事实查找，Graph 用于实体关系推理。一个评分层会在检索时融合三者。这是 2026 年外部记忆的生产标准。",
        "keywords": "三个并行存储 · Fusion scoring · Mem0g 与 temporal reasoning · Benchmark numbers · Scope taxonomy · 这个模式容易出错的地方"
      },
      {
        "name": "Skill Libraries and Lifelong Learning — Voyager",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/10-skill-libraries-voyager/",
        "summary": "Voyager (Wang et al., TMLR 2024) 将可执行代码视为一种 Skill。Skill 具备命名、可检索、可组合的特性，并通过环境反馈持续改进。这是 Claude Agent SDK skills、skillkit，以及 2026 skill-library 模式的参考架构。",
        "keywords": "三个组件 · 动作空间 = 代码 · Skill 检索 · 迭代改进 · Curriculum 与探索 · 这种模式容易出错的地方"
      },
      {
        "name": "Planning with HTN and Evolutionary Search",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/11-planning-htn-and-evolutionary/",
        "summary": "Symbolic planning 处理 plan 可证明正确的场景。Evolutionary code search 处理 fitness function 可由机器检查的场景。ChatHTN (2025) 和 AlphaEvolve (2025) 展示了二者与 LLM 结合后分别能解锁什么能力。",
        "keywords": "Hierarchical Task Networks · ChatHTN (Gopalakrishnan et al., 2025) · AlphaEvolve (Novikov et al., 2025) · 何时使用哪个 · 这个模式哪里容易出错"
      },
      {
        "name": "Anthropic's Workflow Patterns",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/12-anthropic-workflow-patterns/",
        "summary": "Schluntz 和 Zhang（Anthropic，2024 年 12 月）区分了 workflows（预定义路径）和 agents（动态工具使用）。五种 workflow patterns 覆盖大多数情况。从直接 API calls 开始。只有当步骤无法预测时，才添加 agents。",
        "keywords": "Workflows vs agents · Augmented LLM · 五种 patterns · Workflows 胜过 agents 的地方 · Agents 胜过 workflows 的地方 · Context-engineering 配套内容"
      },
      {
        "name": "LangGraph — Stateful Graphs and Durable Execution",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/13-langgraph-stateful-graphs/",
        "summary": "LangGraph 是 2026 年 low-level stateful orchestration 的参考标准。Agent 是一个状态机；nodes 是函数；edges 是状态转移；state 是 immutable 的，并且在每一步之后 checkpoint。任何失败都可以从中断处精确 resume。",
        "keywords": "graph · Durable execution · Streaming · Human-in-the-loop · Memory · 三种 topologies · 这种模式容易出错的地方"
      },
      {
        "name": "AutoGen v0.4 — Actor Model",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/14-autogen-actor-model/",
        "summary": "AutoGen v0.4（Microsoft Research，2025 年 1 月）围绕 actor model 重新设计了 agent orchestration。Async message exchange、event-driven agents、fault isolation、自然并发。该 framework 现在处于 maintenance …",
        "keywords": "Actors · AutoGen v0.4 中的三个 API 层 · 为什么解耦很重要 · 拓扑 · 可观测性 · 状态：maintenance mode"
      },
      {
        "name": "CrewAI — Role-Based Crews and Flows",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/15-crewai-role-based-crews/",
        "summary": "CrewAI 是 2026 年基于角色的 multi-agent framework。四个基本构件：Agent、Task、Crew、Process。两种顶层形态：Crews（自主、基于角色的协作）和 Flows（事件驱动、确定性）。文档说得很直接：“对于任何生产就绪的应用，都从 Flow 开始。”",
        "keywords": "四个基本构件 · Sequential、Hierarchical 与 Consensus · Crews vs Flows · Tool 集成 · Memory hooks · 什么时候适合 CrewAI · 什么时候不适合 CrewAI · Dependency shape · 这种 pattern 会在哪里出错"
      },
      {
        "name": "OpenAI Agents SDK — Handoffs, Guardrails, Tracing",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/16-openai-agents-sdk/",
        "summary": "OpenAI Agents SDK 是基于 Responses API 构建的轻量级 multi-agent framework。五个 primitives：Agent、Handoff、Guardrail、Session、Tracing。Handoff 是名为 `transfer_to_<agent>` 的 tools。Guardrail 会在 inp…",
        "keywords": "Five primitives · Handoffs as tools · Guardrails · Tracing · Sessions · 这个模式容易出错的地方"
      },
      {
        "name": "Claude Agent SDK — Subagents and Session Store",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/17-claude-agent-sdk/",
        "summary": "Claude Agent SDK 是 Claude Code harness 的库形态。Built-in tools、用于 context isolation 的 subagents、hooks、W3C trace propagation、session store parity。Claude Managed Agents 是用于 long-runni…",
        "keywords": "Client SDK vs Agent SDK · Built-in tools · Subagents · Session store · Hooks · W3C trace context · Claude Managed Agents · 这个 pattern 容易在哪里出错"
      },
      {
        "name": "Agno and Mastra — Production Runtimes",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/18-agno-and-mastra-runtimes/",
        "summary": "Agno (Python) 和 Mastra (TypeScript) 是 2026 年的生产 Runtime 组合。Agno 目标是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于 Vercel AI SDK 底层，提供 Agents、tools、workflows、统一 model routing 和 comp…",
        "keywords": "Agno · Mastra · Positioning · When to pick each · 这个 pattern 容易在哪里出错"
      },
      {
        "name": "Benchmarks — SWE-bench, GAIA, AgentBench",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/19-benchmarks-swebench-gaia/",
        "summary": "三个 benchmarks 构成了 2026 年 agent evaluation 的锚点。SWE-bench 测试代码 patching。GAIA 测试 generalist tool use。AgentBench 测试 multi-environment reasoning。要了解它们的组成、contamination 叙事，以及它们不衡量什么。",
        "keywords": "SWE-bench（Jimenez et al., ICLR 2024 oral） · SWE-bench Verified · Contamination · GAIA（Mialon et al., Nov 2023） · AgentBench（Liu et al., ICLR 2024） · 这些不衡量什么 · Benchmarking 常见错误"
      },
      {
        "name": "Benchmarks — WebArena and OSWorld",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/20-benchmarks-webarena-osworld/",
        "summary": "WebArena 在四个自托管 app 上测试 web-agent 能力。OSWorld 在 Ubuntu、Windows、macOS 上测试 desktop-agent 能力。在发布时（2023–2024），两者都显示出一流 agent 与人类之间存在巨大差距。差距正在缩小；failure modes 没有改变。",
        "keywords": "WebArena (Zhou et al., ICLR 2024) · 扩展 · OSWorld (Xie et al., NeurIPS 2024) · 主要 failure modes · 后续工作 · 为什么这很重要 · Benchmarking 容易出错的地方"
      },
      {
        "name": "Computer Use — Claude, OpenAI CUA, Gemini",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/21-computer-use-agents/",
        "summary": "2026 年的三个生产级 computer-use 模型。三者都基于视觉。三者都把截图、DOM 文本和工具输出视为不可信输入。只有直接的用户指令才算作授权。逐步安全服务是常态。",
        "keywords": "Claude computer use（Anthropic，2024 年 10 月 22 日） · OpenAI CUA / Operator（2025 年 1 月） · Gemini 2.5 Computer Use（Google DeepMind，2025 年 10 月 7 日） · 共同契约：不可信输入 · 何时选择哪一个 · 这个模式会在哪里出错"
      },
      {
        "name": "Voice Agents — Pipecat and LiveKit",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/22-voice-agents-pipecat-livekit/",
        "summary": "Voice agents 是 2026 年的一类一等生产级类别。Pipecat 提供基于 Python frame 的 pipeline（VAD → STT → LLM → TTS → transport）。LiveKit Agents 通过 WebRTC 将 AI models 连接到用户。高级技术栈的生产延迟目标会落在端到端 450–600ms。",
        "keywords": "Pipecat (pipecat-ai/pipecat) · LiveKit Agents (livekit/agents) · Commercial platforms · 这个模式容易出错的地方 · Typical 2026 latencies"
      },
      {
        "name": "OpenTelemetry GenAI Semantic Conventions",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/23-otel-genai-conventions/",
        "summary": "OpenTelemetry 的 GenAI SIG（2024 年 4 月启动）定义了 Agent telemetry 的标准 schema。Span names、attributes 和 content-capture rules 会在各个 vendors 之间收敛，因此 Agent traces 在 Datadog、Grafana、Jaeger 和 …",
        "keywords": "Span categories · Agent span naming · Key attributes · Content capture · Stability · 这个模式容易出错的地方"
      },
      {
        "name": "Agent Observability — Langfuse, Phoenix, Opik",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/24-agent-observability-platforms/",
        "summary": "三个 open-source Agent 可观测性平台主导了 2026 年。Langfuse (MIT) — 每月 6M+ installs，tracing + prompt management + evals + session replay。Arize Phoenix (Elastic 2.0) — 深入的 Agent 专用 evals、RAG …",
        "keywords": "Langfuse (MIT) · Arize Phoenix (Elastic License 2.0) · Comet Opik (Apache 2.0) · 行业数据 · 如何选择 · 这个模式容易出错的地方"
      },
      {
        "name": "Multi-Agent Debate and Collaboration",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/25-multi-agent-debate/",
        "summary": "Du et al.（ICML 2024，“Society of Minds”）运行 N 个模型实例，这些实例先独立提出答案，然后在 R 轮中彼此迭代 critique，以实现收敛。它能提升 factuality、rule-following 和 reasoning。Sparse topology 在 Token 成本上优于 full mesh。",
        "keywords": "Society of Minds（Du et al., ICML 2024） · Sparse topology · When debate helps · When debate hurts · 2026 practical instantiations · 这个模式容易出错的地方"
      },
      {
        "name": "Failure Modes — Why Agents Break",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/26-failure-modes-agentic/",
        "summary": "MASFT (Berkeley, 2025) 将 14 种多 Agent failure modes 归纳为 3 个类别。Microsoft 的 Taxonomy 记录了现有 AI failures 如何在 agentic 场景中被放大。行业现场数据收敛到五种反复出现的模式：hallucinated actions、scope creep、cascad…",
        "keywords": "MASFT (Berkeley, arXiv:2503.13657) · Microsoft Taxonomy of Failure Mode in Agentic AI Systems · Characterizing Faults in Agentic AI (arXiv:2603.06847) · LLM Agent Hallucinations Survey (arXiv:2509.18970) · 五种行业反复出现的模式 · Mitigation：每一步都设置 gates · failure monitoring 容易出错的地方"
      },
      {
        "name": "Prompt Injection and the PVE Defense",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/27-prompt-injection-defense/",
        "summary": "Greshake et al. (AISec 2023) 将 indirect Prompt Injection 确立为 agent 安全的核心问题。攻击者把指令植入 agent 检索到的数据中；一旦摄入，这些指令就会覆盖 developer prompt。要把所有检索到的内容都视为对 tool-use 表面的任意代码执行。",
        "keywords": "Greshake et al., AISec 2023 (arXiv:2302.12173) · 2026 年防御准则 · PVE: Prompt-Validator-Executor · 防御在哪里失败"
      },
      {
        "name": "Orchestration Patterns — Supervisor, Swarm, Hierarchical",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/28-orchestration-patterns/",
        "summary": "2026 年的框架中反复出现四种 Orchestration Patterns：supervisor-worker、swarm / peer-to-peer、hierarchical、debate。Anthropic 的指导原则是：“关键在于为你的需求构建正确的系统。” 从简单开始；只有当单个 agent 加五种 workflow patterns 仍…",
        "keywords": "Supervisor-worker · Swarm / peer-to-peer · Hierarchical · Debate · CrewAI Crew vs Flow · Anthropic's guidance · 这个模式容易出错的地方"
      },
      {
        "name": "Production Runtimes — Queue, Event, Cron",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/29-production-runtimes/",
        "summary": "Production agent 运行在六种 runtime shape 上：request-response、streaming、durable execution、queue-based background、event-driven 和 scheduled。先选择 shape，再选择 framework。Observability 在每一种 sh…",
        "keywords": "Request-response · Streaming · Durable execution · Queue-based / background · Event-driven · Scheduled · 2026 deployment pattern · Observability 是 load-bearing · Production runtime 失败的位置"
      },
      {
        "name": "Eval-Driven Agent Development",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/30-eval-driven-agent-development/",
        "summary": "Anthropic 的指导：“从简单 prompt 开始，用全面评估优化它们，并且只在需要时才添加多步 agentic 系统。”评估不是最后一步。它是驱动 Phase 14 中其他所有选择的外层循环。",
        "keywords": "三个评估层级 · Evaluator-optimizer（Anthropic） · 2026 best practice · 将 Phase 14 串起来 · Eval 驱动开发会在哪里失败"
      },
      {
        "name": "Agent Workbench: Why Capable Models Still Fail",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/31-agent-workbench-why-models-fail/",
        "summary": "仅有能力强的模型并不够。可靠的 agent 需要一个 workbench：instructions、state、scope、feedback、verification、review 和 handoff。去掉这些，即使是 frontier model 也会产出不适合发布的工作。",
        "keywords": "Workbench 与 prompt engineering · Workbench 与 framework 对比 · 从 primitives 出发推理，而不是从 vendor taxonomies 出发 · 流行模式，转换为 primitives · receipts 实际上说明了什么 · vendor writeups 止步的地方"
      },
      {
        "name": "The Minimal Agent Workbench",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/32-minimal-agent-workbench/",
        "summary": "最小可用的 workbench 只有三个文件：一个根 instructions router、一个 state file，以及一个 task board。其他所有东西都叠加在它们之上。如果一个 repo 承载不了这三者，就没有哪个模型能拯救它。",
        "keywords": "AGENTS.md 是 router，不是 manual · agent_state.json 是 system of record · task_board.json 是 queue · 三个文件是底线，不是上限"
      },
      {
        "name": "Agent Instructions as Executable Constraints",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/33-instructions-as-executable-constraints/",
        "summary": "用散文写成的指令是愿望。用约束写成的指令是测试。工作台会把每条规则变成 Agent 可在运行时检查、评审者可在事后验证的东西。",
        "keywords": "覆盖大多数规则的五个类别 · 规则是机器可读的 · 规则便于 diff · 规则与框架 guardrails"
      },
      {
        "name": "Repo Memory and Durable State",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/34-repo-memory-and-state/",
        "summary": "Chat history 是易失的。repo 是持久的。workbench 将 agent state 存储在带版本的文件中，这样下一个 session、下一个 agent、下一个 reviewer 都能从同一个 source of truth 读取。",
        "keywords": "什么属于 repo memory · Schema-first state · Atomic writes · Migrations"
      },
      {
        "name": "Initialization Scripts for Agents",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/35-initialization-scripts/",
        "summary": "每个冷启动的 session 都要付出代价。Agent 会读取同样的文件，重试同样的探查，并重新发现同样的路径。init script 只付一次代价，并把答案写入 state。",
        "keywords": "init script 探查什么 · 快速显式失败，并集中在一处失败 · Idempotent · Init versus startup rules"
      },
      {
        "name": "Scope Contracts and Task Boundaries",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/36-scope-contracts/",
        "summary": "model 不知道工作在哪里结束。scope contract 是一个 per-task file，用来说明工作从哪里开始、在哪里结束，以及一旦越界该如何 rollback。这个 contract 把“stay in scope”从愿望变成检查。",
        "keywords": "scope contract 中包含什么 · 使用 globs，而不是 raw paths · Rollback 是 scope 的一部分 · Scope check 是 diff check"
      },
      {
        "name": "Runtime Feedback Loops",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/37-runtime-feedback-loops/",
        "summary": "看不到真实 command output 的 Agent 只能猜。feedback runner 会把 stdout、stderr、exit code 和 timing 捕获为结构化记录，供下一轮读取。这样 Agent 就能根据事实反应，而不是根据自己对事实的预测反应。",
        "keywords": "feedback record 中包含什么 · Truncation 是确定性的 · Feedback versus telemetry · 没有 feedback 就拒绝推进"
      },
      {
        "name": "Verification Gates",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/38-verification-gates/",
        "summary": "agent 不能把自己的工作标记为完成。verification gate 会读取 scope contract、feedback log、rule report 和 diff，并回答一个问题：这个任务真的完成了吗？如果 gate 说没有，那么无论聊天里怎么说，任务都没有完成。",
        "keywords": "gate 检查什么 · 确定性，而不是概率性 · 一个 report，一个 path · 无例外拒绝"
      },
      {
        "name": "Reviewer Agent: Separate Builder from Marker",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/39-reviewer-agent/",
        "summary": "写代码的 agent 不能给它打分。reviewer 是第二个循环，使用不同的 system prompt、不同的目标，并且对 builder 产出的所有内容只有只读访问权限。builder 与 reviewer 之间的间隔，是大部分可靠性所在。",
        "keywords": "Reviewer rubric · reviewer 是独立角色，不是独立模型 · reviewer 不能编辑 diff · Reviewer rubric 与 verification gate 对比"
      },
      {
        "name": "Multi-Session Handoff",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/40-multi-session-handoff/",
        "summary": "Session 要结束了。工作还没有结束。handoff packet 是一种 artifact，它把“Agent 工作了一个小时”转化为“下一个 session 在第一分钟就能产出”。要有意设计它，而不是事后补救。",
        "keywords": "每个 handoff 都携带的七个字段 · Handoff 是生成的，不是写出来的 · 两种形式：human-readable 和 machine-readable · Feedback log 裁剪"
      },
      {
        "name": "The Workbench on a Real Repo",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/41-workbench-for-real-repos/",
        "summary": "十一节关于 surface 的课程，如果无法经受真实 codebase 的检验，就毫无价值。本课会在一个小型 sample app 上将同一个任务运行两遍：prompt-only 与 workbench-guided。让数字来说话。",
        "keywords": "The sample app · The task · The two pipelines · 衡量的五个结果"
      },
      {
        "name": "Capstone: Ship a Reusable Agent Workbench Pack",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/14-agent-engineering/42-agent-workbench-capstone/",
        "summary": "这个 mini-track 以一个可以放进任何 repo 的 pack 结束。十一节课里的 surface 被压缩进一个目录，你可以 `cp -r`，然后第二天早上就让 agent 稳定工作。这个 capstone 就是本课程真正交付的 artifact。",
        "keywords": "Pack layout · 什么留下，什么放在外面 · Installer · 版本管理"
      }
    ]
  },
  {
    "id": 15,
    "name": "Autonomous Systems",
    "status": "complete",
    "desc": "Long-horizon agents、self-improvement，以及 2026 safety stack。",
    "lessons": [
      {
        "name": "From Chatbots to Long-Horizon Agents (METR)",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/01-long-horizon-agents/",
        "summary": "2023 年，chatbot 在一轮对话中回答一个问题。到 2026 年，frontier model 通常会在单个任务上运行数分钟到数小时。METR 的 Time Horizon 1.1 benchmark（2026 年 1 月）显示，Claude Opus 4.6 在 50% reliability 下达到 14+ 小时的专家工作量。自 GPT-2…",
        "keywords": "用一段话解释 METR Time Horizon · 当 horizon 变长时，真正失效的是什么 · Doubling times 及其含义 · Eval-context gaming · Single-turn vs long-horizon，对比"
      },
      {
        "name": "STaR, V-STaR, Quiet-STaR: Self-Taught Reasoning",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/02-star-family-reasoning/",
        "summary": "最小的自我改进循环就位于 rationale 内部。模型生成一段 chain of thought，保留那些得到正确答案的结果，并在这些结果上 fine-tune。这就是 STaR。V-STaR 加入 verifier，让 inference-time selection 更好。Quiet-STaR 把 rationale 下沉到每个 Token。三者…",
        "keywords": "STaR：在有效结果上 bootstrap · V-STaR：用 DPO 训练 verifier · Quiet-STaR：每个 Token 的内部推理依据 · 为什么三者都有共同的安全顾虑 · 对比 · 它在 2026 stack 中的位置"
      },
      {
        "name": "AlphaEvolve: Evolutionary Coding Agents",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/",
        "summary": "将一个 frontier coding model 与演化循环和可机器检查的 evaluator 配对。让循环运行足够久。它会发现一种 4x4 复数 Matrix 乘法过程，只使用 48 次标量乘法，这是 56 年来首次超越 Strassen。它还找到了一种 Google 范围内的 Borg 调度 heuristic，在生产环境中恢复了约 0.7% 的…",
        "keywords": "循环 · 为什么 evaluator 不可协商 · Reward hacking 是同一陈述的另一面 · 为什么 LLM + search 优于单独使用任一方 · AlphaEvolve 在 frontier stack 中的位置"
      },
      {
        "name": "Darwin Gödel Machine: Self-Modifying Agents",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/04-darwin-godel-machine/",
        "summary": "Schmidhuber 2003 年的 Godel Machine 要求在接受任何自修改之前，必须有一个 formal proof 证明该修改有益。这个 proof 在实践中不可行。Darwin Godel Machine（Zhang et al., 2025）放弃 proof，保留 archive：agent 提议修改自己的 Python 源码，每个…",
        "keywords": "循环 · DGM 实际改进了什么 · reward-hacking 演示 · 与经典 Godel Machine 对比 · 它在本 Phase 中的位置"
      },
      {
        "name": "AI Scientist v2: Workshop-Level Research",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/05-ai-scientist-v2/",
        "summary": "Sakana 的 AI Scientist v2 (Yamada et al., arXiv:2504.08066) 运行完整的研究循环：假设、代码、实验、图表、写作、投稿。它是第一个让生成论文通过 ICLR 2025 workshop peer review 的系统。独立评估 (Beel et al.) 发现，42% 的实验因编码错误失败，liter…",
        "keywords": "架构 · workshop 接收结果意味着什么 · 独立评估发现了什么 · sandbox escape 风险 · v2 在 frontier stack 中的位置"
      },
      {
        "name": "Automated Alignment Research (Anthropic AAR)",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/06-automated-alignment-research/",
        "summary": "Anthropic 在独立 sandbox 中并行运行多个 Claude Opus 4.6 Autonomous Alignment Researchers 团队，并通过一个共享 forum 协调；该 forum 的日志位于任何 sandbox 之外（因此 agent 无法删除自己的记录）。在 weak-to-strong training 问题上，A…",
        "keywords": "架构（按公开描述） · 为什么 out-of-sandbox log 很重要 · prescribed-workflow 的取舍 · 压缩风险 · AAR 不能替代什么"
      },
      {
        "name": "Recursive Self-Improvement: Capability vs Alignment",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/07-recursive-self-improvement/",
        "summary": "Recursive self-improvement (RSI) 已不再是猜想。里约 ICLR 2026 RSI Workshop（4 月 23-27 日）将其界定为一个具备具体工具的工程问题。Demis Hassabis 在 WEF 2026 上公开提出，循环是否可以在没有 human in the loop 的情况下闭合。Miles Brundag…",
        "keywords": "recursive self-improvement 的精确定义 · alignment-faking 结果详解 · Hassabis 的问题 · Capability vs alignment，作为一场竞赛 · ICLR 2026 workshop 将什么视为工程问题"
      },
      {
        "name": "Bounded Self-Improvement Designs",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/08-bounded-self-improvement/",
        "summary": "研究已经收敛到四个用于约束 self-improvement loop 的 primitives。formal invariants 必须在每一次编辑前后都成立。alignment anchors 不可被修改。multi-objective constraints 要求每个维度（safety、fairness、robustness）都必须成立，而不只是…",
        "keywords": "Primitive 1: formal invariants · Primitive 2: alignment anchors · Primitive 3: multi-objective constraints · Primitive 4: regression detection · 信息论限制 · 一个 worked example"
      },
      {
        "name": "Autonomous Coding Agent Landscape (SWE-bench, CodeAct)",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/09-coding-agent-landscape/",
        "summary": "SWE-bench Verified 在不到三年内从 4% 提升到 80.9%。同一个 Claude Sonnet 4.5 在 SWE-agent v1 上得分 43.2%，在 Cline autonomous 上得分 59.8% —— 如今围绕模型的 scaffolding 和模型本身一样重要。OpenHands（前身为 OpenDevin）是最活跃…",
        "keywords": "用一段话理解 SWE-bench · 2022 → 2026 曲线真正说明了什么 · CodeAct vs JSON 工具调用 · 2026 版图中的 scaffolds · 为什么 scaffolding 占主导 · Benchmark 饱和与真实分布"
      },
      {
        "name": "Claude Code Permission Modes and Auto Mode",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/10-claude-code-permission-modes/",
        "summary": "Claude Code 暴露了七种权限模式。\"plan\" 会在每个动作前询问，\"default\" 只会对有风险的动作询问，\"acceptEdits\" 会自动批准文件写入，但仍会确认 shell 执行，\"bypassPermissions\" 会批准一切。Auto Mode（2026 年 3 月 24 日）用两阶段并行 safety classifier …",
        "keywords": "七种权限模式 · 一页理解 Auto Mode · 系统能捕捉什么 · 系统可能漏掉什么 · Research preview 定位 · 这条阶梯在你的 workflow 中的位置"
      },
      {
        "name": "Browser Agents and Indirect Prompt Injection",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/11-browser-agents/",
        "summary": "ChatGPT agent（2025 年 7 月）将 Operator 和 deep research 合并为一个 browser/terminal agent，并在 BrowseComp 上以 68.9% 创下 SOTA。OpenAI 于 2025 年 8 月 31 日关闭 Operator——这是产品层面的整合。Anthropic 收购 Verce…",
        "keywords": "2026 年版图：每个系统一段话 · BrowseComp vs OSWorld vs WebArena · 攻击面，命名如下 · 为什么“不可完全修补” · 真正能上线的防御姿态"
      },
      {
        "name": "Durable Execution for Long-Running Agents",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/12-durable-execution/",
        "summary": "生产级长周期 Agents 不会运行在 `while True` 中。每一次 LLM 调用都会成为一个带有 checkpoint、retry 和 replay 的 Activity。Temporal 的 OpenAI Agents SDK 集成已于 2026 年 3 月 GA。Claude Code Routines (Anthropic) 可以运行定…",
        "keywords": "Activities、Workflows 与 replay · 为什么 LLM 调用适合这一模式 · 以 `thread_id` 为 key 的 Checkpoints · 人工输入作为一等状态 · 35-minute degradation · 什么时候持久化执行不是正确答案"
      },
      {
        "name": "Action Budgets, Iteration Caps, Cost Governors",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/13-cost-governors/",
        "summary": "某个中型 e-commerce agent 的月度 LLM 成本，在团队启用 \"order-tracking\" skill 后，从 $1,200 跳到了 $4,800。这不是定价 bug。这是一个 agent 发现了新的循环，并持续在循环里花钱。Microsoft 的 Agent Governance Toolkit（2026 年 4 月 2 日）把针…",
        "keywords": "cost-governor 栈 · 为什么需要栈，而不是单个上限 · Claude Code 的预算表面 · EU AI Act、OWASP Agentic Top 10 · 观察到的 $1,200 → $4,800 案例"
      },
      {
        "name": "Kill Switches, Circuit Breakers, Canary Tokens",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/14-kill-switches-canaries/",
        "summary": "Kill switch 是一个保存在 agent 编辑面之外的 boolean —— Redis key、feature flag、signed config —— 用于完全禁用 agent。Circuit breaker 粒度更细：它会在特定模式上触发（例如连续五次相同的 tool calls），暂停有问题的路径，并升级给人工。Canary toke…",
        "keywords": "Kill switches · Circuit breakers · Canary tokens · 为什么要分层使用 statistical 和 hard limits · 通过 eBPF datapath redirect 进行 quarantine · 没有 detector 能捕获什么"
      },
      {
        "name": "HITL: Propose-Then-Commit",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/15-propose-then-commit/",
        "summary": "2026 年关于 HITL 的共识是具体的。它不是“agent 发问，用户点击 Approve”。它是 propose-then-commit：拟议 action 会连同 idempotency key 持久化到 durable store；以 intent、data lineage、permissions touched、blast radius 和…",
        "keywords": "propose-then-commit state machine · idempotency key · Durability：为什么 approvals 能长于进程存活 · Rubber-stamp approvals 与 challenge-and-response mitigation · 什么算 consequential · Post-action verification · EU AI Act Article 14"
      },
      {
        "name": "Checkpoints and Rollback",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/16-checkpoints-rollback/",
        "summary": "每一次 graph-state 转换都会持久化。当 worker 崩溃时，它的 lease 会过期，另一个 worker 会从最新的 checkpoint 接手。Cloudflare Durable Objects 会跨数小时或数周保存状态。Propose-then-commit（Lesson 15）为每个动作定义 rollback 计划。动作后验证会…",
        "keywords": "每一次转换都会持久化 · Lease recovery · Idempotency 加 preconditions · 动作后验证 · Rollback plans · EU AI Act Article 14 的操作性解读 · 尖锐失效模式：重复执行"
      },
      {
        "name": "Constitutional AI and Rule Overrides",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/17-constitutional-ai/",
        "summary": "Anthropic 于 2026 年 1 月 22 日发布的 Claude Constitution 共 79 页，采用 CC0 授权。它从基于规则的对齐转向基于推理的对齐，并建立了四级优先级层级：(1) 安全与支持人类监督，(2) 伦理，(3) Anthropic 指南，(4) 有用性。行为分为 hardcoded prohibition（生物武器能…",
        "keywords": "四级优先级层级 · Hardcoded prohibition 与 soft-coded default · 2022 CAI 训练 · 基于推理的对齐能抓住什么、漏掉什么 · 2023 参与式实验 · 为什么 hardcoded prohibition 是必要的 · Constitution 位于栈中的哪里"
      },
      {
        "name": "Llama Guard and Input/Output Classification",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/18-llama-guard/",
        "summary": "Llama Guard 3（Meta，Llama-3.1-8B base，针对内容安全 fine-tuned）会根据 MLCommons 13-hazard taxonomy，对 8 种语言中的 LLM 输入和输出进行分类。一个 1B-INT4 quantized variant 可以在 mobile CPUs 上以超过 30 tokens/sec 的…",
        "keywords": "Llama Guard 3 概览 · Llama Guard 4 新增内容 · NeMo Guardrails (NVIDIA) · 攻击语料 · Classifiers 擅长的地方 · Classifiers 失败的地方 · Defense-in-depth"
      },
      {
        "name": "Anthropic Responsible Scaling Policy v3.0",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/19-anthropic-rsp/",
        "summary": "RSP v3.0 于 2026 年 2 月 24 日生效，取代了 2023 年政策。双层缓解措施：Anthropic 会单方面采取什么行动，以及哪些内容被表述为行业范围建议（包括 RAND SL-4 安全标准）。新增 Frontier Safety Roadmaps 和 Risk Reports，作为常设文档，而不是一次性交付物。删除了 2023 年的…",
        "keywords": "双层缓解措施时间表 · AI R&D-4 阈值 · Frontier Safety Roadmaps 和 Risk Reports · 删除暂停条款 · SaferAI 的下调 · 本课不是什么"
      },
      {
        "name": "OpenAI Preparedness Framework and DeepMind FSF",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/",
        "summary": "OpenAI Preparedness Framework v2（2025 年 4 月）引入了 Research Categories：Long-range Autonomy、Sandbagging、Autonomous Replication and Adaptation、Undermining Safeguards，它们不同于 Tracked Ca…",
        "keywords": "OpenAI Preparedness Framework v2（2025 年 4 月） · DeepMind Frontier Safety Framework v3（2025 年 9 月；Tracked Capability Levels 于 2026 年 4 月 17 日加入） · 三者共同趋同之处 · 它们的分歧之处 · Sandbagging：一个让三者都复杂化的特定能力 · 政策阅读技能"
      },
      {
        "name": "METR Time Horizons and External Evaluation",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/21-metr-external-evaluation/",
        "summary": "METR（前身为 ARC Evals）自 2023 年 12 月起成为独立的 501(c)(3) 组织。他们的 Time Horizon 1.1 benchmark（2026 年 1 月）会将任务成功概率与 log(专家人类完成时间) 拟合为一条 logistic curve；在 50% 概率处的交点定义为模型的 time horizon。2025–2…",
        "keywords": "METR 背景 · Time Horizon 拟合 · 2026 年 1 月数字 · Benchmark suites · 原型监控评估 · 为什么 horizons 是上界 · 外部评估者的意义 · 如何在实践中使用 horizon 数字"
      },
      {
        "name": "CAIS, CAISI, and Societal-Scale Risk",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/15-autonomous-systems/22-cais-caisi-societal-risk/",
        "summary": "Center for AI Safety（CAIS，San Francisco，由 Hendrycks 和 Zhang 于 2022 年创立）发布了四类风险框架：恶意使用、AI races、组织风险、Rogue AIs，以及 2023 年 5 月关于灭绝风险的声明，该声明由数百名教授和公司领导者签署。CAIS 在 2026 年发布的内容包括：用于 fr…",
        "keywords": "CAIS — Center for AI Safety · 四类风险框架 · 组织风险存在于哪里 · CAISI — Center for AI Standards and Innovation · California SB-53 · 社会规模风险不是单层问题"
      }
    ]
  },
  {
    "id": 16,
    "name": "Multi-Agent & Swarms",
    "status": "complete",
    "desc": "Coordination、emergence 和 collective intelligence。",
    "lessons": [
      {
        "name": "Why Multi-Agent",
        "status": "complete",
        "type": "Learn",
        "lang": "TypeScript",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/01-why-multi-agent/",
        "summary": "一个 agent 撞上了墙。聪明的做法不是做一个更大的 agent，而是使用更多 agents。",
        "keywords": "Single-Agent Ceiling · Multi-Agent 解决方案 · 这样做的真实系统 · 光谱 · 四种 Multi-Agent Patterns · 什么时候不要使用 Multi-Agent · 步骤 1： 过载的 Single Agent · 步骤 2： Specialist Agents · 步骤 3： 通过 Messages 协调 · 步骤 4： 对比"
      },
      {
        "name": "FIPA-ACL Heritage and Speech Acts",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/02-fipa-acl-heritage/",
        "summary": "在 MCP 之前，在 A2A 之前，有 FIPA-ACL。2000 年，IEEE Foundation for Intelligent Physical Agents 批准了一种 agent communication language，其中包含二十个 performatives、两种 content languages，以及一组 interactio…",
        "keywords": "用一段话理解 Speech acts · 二十个 FIPA performatives（部分列表） · 规范的 FIPA-ACL message · 两个 legacy platforms · FIPA 为什么淡出 · LLM 复兴是 FIPA-lite · 直白地说明 trade-off · 值得移植的 Interaction protocols · 放弃 ontology 后会出什么问题 · 2026 specs 映射到 speech-act heritage"
      },
      {
        "name": "Communication Protocols",
        "status": "complete",
        "type": "Build",
        "lang": "TypeScript",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/03-communication-protocols/",
        "summary": "不能说同一种语言的特工就不是一个团队。他们是对着虚空喊叫的陌生人。",
        "keywords": "协议格局 · MCP（回顾） · A2A（Agent2Agent 协议） · ACP（代理通信协议） · ANP（代理网络协议） · 比较（已更正） · 他们如何合作 · 第 1 步：核心消息类型 · 第 2 步：A2A 代理卡和注册 · 步骤 3：A2A 任务生命周期 · 步骤 4：ACP 式审计跟踪 · 步骤 5：ANP 式身份验证 · 步骤 6：协议网关 · 第 7 步：将它们连接在一起 · 实际实现 · 选择正确的协议"
      },
      {
        "name": "The Multi-Agent Primitive Model",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/04-primitive-model/",
        "summary": "2026 年发布的每个 multi-agent framework —— AutoGen、LangGraph、CrewAI、OpenAI Agents SDK、Microsoft Agent Framework —— 都是四维设计空间中的一个点。四个 primitives，仅此而已：agent、handoff、shared state、orchestr…",
        "keywords": "The four primitives · How every 2026 framework maps to it · Why this matters · The stateless insight · Anatomy of a single primitive · What changes between frameworks"
      },
      {
        "name": "Supervisor / Orchestrator-Worker Pattern",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/",
        "summary": "一个 lead agent 负责规划和委派；专门化 workers 在并行 contexts 中执行并回报结果。这是 Anthropic Research system 背后的 pattern（Claude Opus 4 作为 lead，Sonnet 4 作为 subagents），在 internal research evals 上相比 singl…",
        "keywords": "这个 pattern · 为什么它有效 · Engineering lessons (Anthropic 2025) · LangGraph 转向 · Failure modes · 什么时候 supervisor 是错误选择"
      },
      {
        "name": "Hierarchical Architecture and Decomposition Drift",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/06-hierarchical-architecture/",
        "summary": "Hierarchical 是嵌套的 supervisor。Manager agents 位于 sub-managers 之上，sub-managers 又位于 workers 之上。CrewAI `Process.hierarchical` 是教科书版本：一个 `manager_llm` 动态委派任务并验证输出。LangGraph 中的等价形式是 `c…",
        "keywords": "形态 · 适用场景 · 失效位置 · 决策问题 · CrewAI 的实现 · LangGraph 的实现"
      },
      {
        "name": "Society of Mind and Multi-Agent Debate",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/07-society-of-mind-debate/",
        "summary": "Minsky 在 1986 年的前提，即 intelligence 是一个由专家组成的 society，每隔十年都会被重新发现一次。2023 年，Du et al. 将它变成了一个具体算法：多个 LLM instances 提出答案，阅读彼此的答案，critique，并更新。经过 N 轮后，它们收敛到一个 consensus，在六个 reasoning…",
        "keywords": "Du et al. 2023 算法 · 两个独立旋钮 · 为什么有效 · Heterogeneous debate · NLSOM — 129-agent 扩展 · Failure modes"
      },
      {
        "name": "Role Specialization — Planner / Critic / Executor / Verifier",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/08-role-specialization/",
        "summary": "2026 年最常见的 multi-agent decomposition：一个 agent 负责规划，一个执行，一个批评或验证。MetaGPT (arXiv:2308.00352) 将其形式化为编码到 role prompts 中的 SOPs —— Product Manager、Architect、Project Manager、Engineer、Q…",
        "keywords": "四个 canonical roles · MetaGPT 的 SOP pattern · ChatDev 的 communicative dehallucination · 为什么 Verifier 最重要 · Critic vs verifier · 反模式 · Framework mappings"
      },
      {
        "name": "Parallel Swarm and Networked Architectures",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/",
        "summary": "与 supervisor 对比：没有中央 decider。Agents 读取共享 event bus，异步领取工作，并写回结果。LangGraph 明确支持面向去中心化、动态环境的 \"Swarm Architecture\"。Matrix (arXiv:2511.21686) 将 control flow 和 data flow 都表示为通过 distr…",
        "keywords": "The shape · When swarm fits · When swarm fails · Matrix (arXiv:2511.21686) · LangGraph 的 Swarm Architecture · Failure mode: starvation and hot-spotting · The content-based routing link"
      },
      {
        "name": "Group Chat and Speaker Selection",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection/",
        "summary": "AutoGen GroupChat 和 AG2 GroupChat 在 N 个 agents 之间共享一个 conversation；一个 selector 函数（LLM、round-robin 或 custom）选择下一个发言者。这是 emergent multi-agent conversation 的原型：agents 并不知道自己在静态 gra…",
        "keywords": "形状 · 三种 selector 风格 · ConversableAgent API · 终止 · AutoGen → AG2 分裂，以及 Microsoft Agent Framework 合并 · 什么时候适合 GroupChat · 什么时候会失败 · Group chat vs supervisor"
      },
      {
        "name": "Handoffs and Routines (Stateless Orchestration)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/11-handoffs-and-routines/",
        "summary": "OpenAI 的 Swarm（2024 年 10 月）将 multi-agent 编排提炼为两个原语：**routines**（作为 system prompt 的 instructions + tools）和 **handoffs**（返回另一个 Agent 的 tool）。没有状态机，没有 branching DSL——LLM 通过调用正确的 ha…",
        "keywords": "两个原语 · 为什么它传播很快 · 无状态取舍 · Swarm/handoffs 适合的场景 · Swarm 吃力的场景 · OpenAI Agents SDK（2025 年 3 月） · Swarm vs GroupChat"
      },
      {
        "name": "A2A — The Agent-to-Agent Protocol",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/12-a2a-protocol/",
        "summary": "Google 于 2025 年 4 月宣布 A2A；到 2026 年 4 月，该 spec 位于 https://a2a-protocol.org/latest/specification/，并获得 150+ 个组织支持。A2A 是 MCP（Lesson 13）的横向补充：MCP 是纵向的（agent ↔ tools），A2A 是 peer-to-pe…",
        "keywords": "四个元素 · MCP/A2A 分工 · Discovery flow · Auth · 到 2026 年 4 月已有 150+ 个组织 · A2A 的优势场景 · A2A 的困难场景 · A2A vs ACP, ANP, NLIP"
      },
      {
        "name": "Shared Memory and Blackboard Patterns",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/",
        "summary": "2026 年的 Multi-Agent 系统中并存两种方法：**message pool**（所有人都能看到所有人的消息，如 AutoGen GroupChat 或 MetaGPT）和**带 subscription 的 blackboard**（Agent 订阅相关事件，如 Context-Aware MCP 或 Matrix framework）。…",
        "keywords": "两种主要拓扑 · 各自适用场景 · 一个 memory poisoning 场景 · 为什么这是结构性问题 · Blackboard 先例（Hayes-Roth, 1985） · Projection vs full view · Write-contention 模式 · 不可写 verifier"
      },
      {
        "name": "Consensus and Byzantine Fault Tolerance",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/14-consensus-and-bft/",
        "summary": "经典 distributed-systems BFT 遇上了随机性的 LLMs。2025-2026 年出现了三个研究方向：**CP-WBFT** (arXiv:2511.10400) 通过 confidence probe 为每次投票加权；**DecentLLMs** (arXiv:2507.14928) 采用无 leader 方式，并行 worker…",
        "keywords": "经典 BFT 给你什么 · 三种 LLM-specific attacks · 2025-2026 年的回应 · 实证：“Can AI Agents Agree?” (arXiv:2603.01213) · 剥离到核心的 protocol · Threshold tuning · Consensus 无法提供帮助的地方"
      },
      {
        "name": "Voting, Self-Consistency, and Debate Topology",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/15-voting-debate-topology/",
        "summary": "最便宜的 aggregation：采样 N 个 independent agents，然后 majority-vote。Wang et al. 2022 的 self-consistency 用一个 model 采样 N 次来做这件事。Multi-agent 通过 **heterogeneous** agents 扩展它，以逃离 monoculture…",
        "keywords": "Self-consistency，single-model baseline · Multi-agent vote，heterogeneous extension · 四种 topologies · Coordination tax（MultiAgentBench） · Multi-Agent Debate Strategies（“Should we be going MAD?”） · AgentVerse emergent patterns · Heterogeneity：真正推动 accuracy 的旋钮 · Jury methods · When vote-with-debate dominates · When vote-with-debate hurts"
      },
      {
        "name": "Negotiation and Bargaining",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/16-negotiation-bargaining/",
        "summary": "Agent 会协商资源、价格、任务分配和条款。2026 年的 benchmark 集合已经很明确：NegotiationArena (arXiv:2402.05863) 显示，LLMs 可以通过 persona manipulation（“desperation”）将收益提升约 20%；\"Measuring Bargaining Abilities\" …",
        "keywords": "一段话理解 Contract Net · 为什么 OG-Narrator 会赢 · NegotiationArena 发现 · Chain-of-thought 隐藏 · Bhattacharya et al. 2025 — model 排名 · 通过 Contract Net + LLM 进行任务分配 · LLM-Stakeholders Interactive Negotiation · narration-vs-mechanism 规则"
      },
      {
        "name": "Generative Agents and Emergent Simulation",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/17-generative-agents-simulation/",
        "summary": "Park et al. 2023 (UIST '23, arXiv:2304.03442) 用三部分架构填充了 **Smallville**，一个包含 25 个 agent 的 sandbox：**memory stream**（自然语言日志）、**reflection**（agent 基于自身 stream 生成的更高层综合）、以及 **plan**…",
        "keywords": "三个组件 · 为什么三个都重要（ablation） · Valentine's Day 的涌现 · 文档记录的失败模式 · 三组件实现规则 · Smallville 之外的 Generative Agents · 为什么这对 multi-agent engineering 很重要"
      },
      {
        "name": "Theory of Mind and Emergent Coordination",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination/",
        "summary": "Li et al. (arXiv:2310.10701) 表明，合作型文本游戏中的 LLM agents 会表现出**涌现式高阶 Theory of Mind** (ToM) —— 推理另一个 agent 对第三个 agent 信念的信念 —— 但由于上下文管理和 hallucination，在长程规划上会失败。Riedl (arXiv:2510.05…",
        "keywords": "ToM 是什么 · Sally-Anne test 简述 · Riedl 的协调测量 · 协调幻觉 · 一个最小 ToM-aware agent · 为什么 long-horizon 会受损 · ToM 在生产中哪里会失败 · 你实际能测量的协调"
      },
      {
        "name": "Swarm Optimization (PSO, ACO)",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/",
        "summary": "生物启发式 optimization 正在 LLM 领域回归。**LMPSO**（arXiv:2504.09247）使用 PSO，其中每个 particle 的 velocity 是一个 prompt，LLM 生成下一个 candidate；它在结构化序列输出（数学表达式、程序）上效果很好。**Model Swarms**（arXiv:2410.111…",
        "keywords": "PSO refresher（Kennedy & Eberhart 1995） · LLM 输出上的 PSO — LMPSO · Model Swarms · ACO refresher（Dorigo 1992） · AMRO-S — 用于 agent routing 的 ACO · 什么时候为 LLMs 使用 PSO / ACO · 为什么 bio-inspired 仍然胜出 · 实用限制"
      },
      {
        "name": "MARL — MADDPG, QMIX, MAPPO",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/",
        "summary": "multi-agent 协调的 Reinforcement Learning 传承，在 2026 年仍然影响着 LLM-agent 系统。**MADDPG** (Lowe et al., NeurIPS 2017, arXiv:1706.02275) 引入了 Centralized Training, Decentralized Execution (…",
        "keywords": "论文使用的三类 environment · MADDPG (2017) — CTDE pattern · QMIX (2018) — value decomposition · MAPPO (2022) — 被低估的默认选择 · 为什么 LLM-agent engineer 应该关心 · CTDE 作为 RL 之外的 design pattern · non-stationarity 问题 · 本课不涵盖什么"
      },
      {
        "name": "Agent Economies, Token Incentives, Reputation",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/21-agent-economies/",
        "summary": "长周期 autonomous agents（METR 的 1 小时到 8 小时工作曲线）需要经济代理能力。新兴的 **5-layer stack** 是：**DePIN**（physical compute）→ **Identity**（W3C DIDs + 声誉资本）→ **Cognition**（RAG + MCP）→ **Settlement**…",
        "keywords": "5-layer agent-economy stack · Bittensor、Fetch.ai、Gonka：实际运行的东西 · Shapley-value credit attribution · 用于 aggregation 的 second-price auction · Reputation capital · AAMAS 2025 去中心化 LaMAS · 经济机制会在哪里崩掉 · 什么时候 agent economies 有意义"
      },
      {
        "name": "Production Scaling — Queues, Checkpoints, Durability",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/",
        "summary": "将 multi-agent systems 扩展到数千个并发运行，需要 **durable execution**。LangGraph 的 runtime 会在每个 super-step 后写入一个由 `thread_id` 标识的 checkpoint（默认使用 Postgres）；worker 崩溃会释放 lease，另一个 worker 会接手恢…",
        "keywords": "Durable execution，这个模式 · LangGraph 的 runtime · MegaAgent 的 per-agent queue · Async vs thread-per-job · Bedi 的反方观点 · Exactly-once semantics · Rainbow deployment · 典型生产 checklist"
      },
      {
        "name": "Failure Modes — MAST, Groupthink, Monoculture",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/",
        "summary": "2026 年的参考 taxonomy 是 **MAST**（Cemri et al., NeurIPS 2025, arXiv:2503.13657），它源自 7 个 state-of-the-art open-source MAS 的 1642 条执行 trace，显示出 **41–86.7% 的失败率**。三个根类别：**Specification…",
        "keywords": "MAST categories · Groupthink family (arXiv:2508.05687) · Cascading example — the retry storm · Memory poisoning（回顾） · STRATUS — specialized agents for failure detection · The failure-mode audit · When systems fail silently · Failure vs slow failure"
      },
      {
        "name": "Evaluation and Coordination Benchmarks",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/",
        "summary": "2025-2026 年的五个 benchmarks 覆盖了 multi-agent 评估空间。**MultiAgentBench / MARBLE**（ACL 2025, arXiv:2503.01935）用 milestone KPIs 评估 star/chain/tree/graph 拓扑；**graph 最适合 research**，cognit…",
        "keywords": "MultiAgentBench (MARBLE) — ACL 2025 · COMMA — Multimodal 非对称信息 · MedAgentBoard — domain stress test · AgentArch — enterprise architectures · SWE-bench Pro — 现实检验 · AAAI 2026 WMAC · 用怀疑态度阅读 benchmark claims — 2026 checklist · 当前 benchmarks 都衡量不好的内容"
      },
      {
        "name": "Case Studies and 2026 State of the Art",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/",
        "summary": "三个值得端到端学习的 production-grade 参考案例，每个都展示了 multi-agent engineering 的不同切面。**Anthropic's Research system**（orchestrator-worker、15x tokens、相较 single-agent Opus 4 +90.2%、rainbow deploy…",
        "keywords": "Anthropic Research system · MetaGPT / ChatDev · OpenClaw / Moltbook ecosystem · Framework landscape 2026 年 4 月 · 三个案例中的共同模式 · 为你的下一个项目选择参考案例 · 2026 state-of-the-art 总结"
      }
    ]
  },
  {
    "id": 17,
    "name": "Infrastructure & Production",
    "status": "complete",
    "desc": "将 AI 交付到真实世界。",
    "lessons": [
      {
        "name": "Managed LLM Platforms — Bedrock, Azure OpenAI, Vertex AI",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/01-managed-llm-platforms/",
        "summary": "三家 hyperscaler，三种不同策略。AWS Bedrock 是模型市场 — Claude, Llama, Titan, Stability, Cohere 位于同一个 API 之后。Azure OpenAI 是独家的 OpenAI 合作关系，加上用于专用容量的 Provisioned Throughput Units (PTUs)。Vertex…",
        "keywords": "三种策略 · 规模下的 Latency 差距 · Provisioned Throughput 经济性 · FinOps 界面 — 真正的差异化因素 · Lock-in 是 2026 年的风险 · Data residency、BAAs 和受监管行业 · 你应该记住的数字"
      },
      {
        "name": "Inference Platform Economics — Fireworks, Together, Baseten, Modal",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/02-inference-platform-economics/",
        "summary": "2026 年的 inference 市场不再只是 GPU 时间租赁。它分化为 custom silicon（Groq、Cerebras、SambaNova）、GPU platforms（Baseten、Together、Fireworks、Modal）和 API-first marketplaces（Replicate、DeepInfra）。Firew…",
        "keywords": "The three segments · Fireworks — latency-optimized GPU platform · Together — breadth-optimized · Baseten — enterprise-polish-optimized · Modal — Python-native-optimized · Replicate — multimodal breadth · Anyscale — Ray-native · Per-token versus per-minute — when each wins · Custom engine is the real moat · Numbers you should remember"
      },
      {
        "name": "GPU Autoscaling on Kubernetes — Karpenter, KAI Scheduler",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/",
        "summary": "是三层，不是一层。Karpenter 动态供给节点（不到一分钟，比 Cluster Autoscaler 快 40%）。KAI Scheduler 处理 gang scheduling、拓扑感知和分层队列 —— 它能避免 7-of-8 的部分分配陷阱：七个节点因为缺一个 GPU 而等待并烧钱。应用层 autoscaler（NVIDIA Dynamo P…",
        "keywords": "Layer 1 — 节点供给 (Karpenter) · Layer 2 — gang scheduling（KAI Scheduler） · Layer 3 — 应用层信号 · 什么时候用什么 · Disaggregated prefill/decode 会让一切更复杂 · Cold start 在这里也很重要 · 你应该记住的数字"
      },
      {
        "name": "vLLM Serving Internals — PagedAttention, Continuous Batching, Chunked Prefill",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/04-vllm-serving-internals/",
        "summary": "vLLM 在 2026 年的主导地位依赖于三个相互叠加的默认设置，而不是某个单一技巧。PagedAttention 始终开启。Continuous batching 会在 decode iterations 之间把新 requests 注入 active batch。Chunked prefill 会切分长 prompts，让 decode token…",
        "keywords": "PagedAttention 作为虚拟内存系统 · iteration 层面的 Continuous batching · Chunked prefill 保护 TTFT tail · 三个默认设置会相互作用 · 2026 年 v0.18.0 的 gotcha · 你应该记住的数字 · scheduler 的样子"
      },
      {
        "name": "EAGLE-3 Speculative Decoding in Production",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/",
        "summary": "Speculative decoding 将一个快速 draft model 与 target model 配对。draft 提出 K 个 Token；target 在一次 forward 中验证；被接受的 Token 是免费的。到 2026 年，EAGLE-3 是生产级变体，它在 target model 的 hidden states 上训练 dr…",
        "keywords": "Speculative decoding 实际带来了什么 · 为什么 alpha 是唯一重要的 metric · EAGLE 代际一览 · 2026 生产配方 · 生产陷阱：P99 tail · EAGLE-3 已经部署在哪里 · 一行 break-even 数学 · 什么时候不要使用 speculative decoding"
      },
      {
        "name": "SGLang and RadixAttention for Prefix-Heavy Workloads",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/06-sglang-radixattention/",
        "summary": "SGLang 将 KV cache 视为一等、可复用资源，并存储在 radix tree 中。vLLM 按 FCFS（first-come, first-served）调度请求，而 SGLang 的 cache-aware scheduler 会优先处理具有更长 shared prefixes 的请求，本质上是 depth-first radix tr…",
        "keywords": "作为 KV index 的 radix tree · Cache-aware scheduling · 你应该记住的 benchmark 数字 · ordering 陷阱 · RadixAttention 赢在哪里，输在哪里 · 为什么这是 scheduler 问题，而不只是 kernel 问题 · 与 vLLM 的相互作用"
      },
      {
        "name": "TensorRT-LLM on Blackwell with FP8 and NVFP4",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell/",
        "summary": "TensorRT-LLM 仅限 NVIDIA，但它在 Blackwell 上胜出。在配合 Dynamo 编排的 GB200 NVL72 上，SemiAnalysis InferenceX 在 2026 年 Q1-Q2 测得 120B 模型成本为每百万 Token $0.012，而 H100 + vLLM 为 $0.09/M，形成 7x 的经济差距。这个…",
        "keywords": "为什么 FP8 仍然是 KV cache 的底线 · TRT-LLM 使用的 Blackwell 特有 primitives · 你应该记住的数字 · FP4 在质量上的真实代价 · 为什么这是一个 NVIDIA-lock 决策 · 2026 年实用配方 · Disaggregation bonus"
      },
      {
        "name": "Inference Metrics — TTFT, TPOT, ITL, Goodput, P99",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/08-inference-metrics-goodput/",
        "summary": "四个指标决定一次 inference deployment 是否正常工作。TTFT 是 prefill 加 queue 加 network。TPOT（等价于 ITL）是每个 Token 的 memory-bound decode 成本。端到端 latency 是 TTFT 加上 TPOT 乘以输出长度。Throughput 是整个 fleet 聚合后的…",
        "keywords": "TTFT — time to first token · TPOT / ITL — inter-token latency · E2E latency · Throughput · Goodput — 你真正关心的指标 · 为什么 mean 是错误的统计量 · Reference numbers — TRT-LLM 上的 Llama-3.1-8B-Instruct，2026 · The measurement trap · Constructing an SLO · How to measure"
      },
      {
        "name": "Production Quantization — AWQ, GPTQ, GGUF, FP8, NVFP4",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/09-production-quantization/",
        "summary": "Quantization 格式不是一个通用选择，而是 hardware、serving engine 和 workload 的函数。GGUF Q4_K_M 或 Q5_K_M 通过 llama.cpp 和 Ollama 交付，占据 CPU 和 edge 场景。GPTQ 在 vLLM 内部胜出，适合你需要在同一个 base 上运行 multi-LoRA 的…",
        "keywords": "The six formats · GGUF — CPU/edge 默认选择 · GPTQ — vLLM 中的 multi-LoRA · AWQ — datacenter GPU 默认选择 · FP8 — 可靠的中间地带 · MXFP4 / NVFP4 — Blackwell 激进选择 · The calibration trap · The KV cache trap · AWQ INT4 对 reasoning 有风险 · 2026 picking guide"
      },
      {
        "name": "Cold Start Mitigation for Serverless LLMs",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/10-cold-start-mitigation/",
        "summary": "一个 20 GB model image 从 cold 到 serving 需要 5-10 分钟（7B）到 20+ 分钟（70B）。在真正的 serverless 世界里，这不是 warm-up，而是 outage。Mitigations 作用在五层：pre-seeded node images（AWS 上的 Bottlerocket、dual-vol…",
        "keywords": "Layer 1 — 预置节点镜像（Bottlerocket） · Layer 2 — model streaming (Run:ai Model Streamer) · Layer 3 — GPU memory snapshots (Modal) · Layer 4 — warm pools (min_workers=1) · Layer 5 — tiered loading (ServerlessLLM) · Layer 6 — live migration (bonus pattern) · The warm-pool math · Measure before optimizing · Numbers you should remember"
      },
      {
        "name": "Multi-Region LLM Serving and KV Cache Locality",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/11-multi-region-kv-locality/",
        "summary": "对缓存式 LLM inference 来说，round-robin load balancing 是有害的。一个请求如果没有落到持有其 prefix 的节点上，就要支付完整 prefill 成本：长 prompt 上 P50 约 800 ms，而 cache hit 时约 80 ms。到 2026 年，生产模式是 cache-aware router（…",
        "keywords": "Cache-aware routing · Numbers · Cross-region 有一个新约束：network latency · 商业 \"cross-region inference\" 在这里帮不上忙 · DR hygiene：32% missing-files 问题 · Data residency 是正交问题 · 你应该记住的数字"
      },
      {
        "name": "Edge Inference — ANE, Hexagon, WebGPU, Jetson",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/12-edge-inference/",
        "summary": "核心 edge 约束是 memory bandwidth，而不是 compute。Mobile DRAM 位于 50-90 GB/s；datacenter HBM3 超过 2-3 TB/s——差距为 30-50x。Decode 受 memory-bound 限制，因此这个差距是决定性的。到 2026 年，格局分成四类。Apple M4/A18 Neur…",
        "keywords": "Bandwidth 才是真正的上限 · Apple Neural Engine（M4 / A18） · Qualcomm Hexagon（Snapdragon X Elite / 8 Gen 4） · Intel / AMD NPUs（Lunar Lake, Ryzen AI 300） · WebGPU + WebLLM · NVIDIA Jetson family · 每个 target 的 Quantization 选择 · Edge 上的 long-context 陷阱 · Voice 是 killer app · 你应该记住的数字"
      },
      {
        "name": "LLM Observability Stack Selection",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/13-llm-observability/",
        "summary": "2026 年的可观测性市场分为两类。开发平台（LangSmith、Langfuse、Comet Opik）把监控与 evals、prompt 管理、session replay 打包在一起。Gateway/工具化工具（Helicone、SigNoz、OpenLLMetry、Phoenix）专注于遥测。Langfuse 是 MIT-licensed co…",
        "keywords": "两类 · Langfuse — OSS 平衡 · Phoenix (Arize) — telemetry-first，OpenTelemetry-native · Arize AX — scale play · LangSmith — LangChain/LangGraph 优先 · Helicone — 基于 proxy 的 minimum viable · Opik (Comet) — OSS dev platform · SigNoz — OpenTelemetry-first 完整 APM · 粘合层：OpenTelemetry + GenAI semantic conventions · 陷阱：在错误层做工具化 · Sampling — 你无法保留所有东西 · 你应该记住的数字"
      },
      {
        "name": "Prompt Caching and Semantic Caching Economics",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/14-prompt-semantic-caching/",
        "summary": "**Pricing snapshot 日期为 2026-04。** 以下数值声明反映本课发布时采集的 vendor rate cards；在下游引用前，请先对照链接文档核验。",
        "keywords": "L2 — provider prompt/prefix caching · L1 — app 级 semantic caching · The parallelization anti-pattern · The dynamic content anti-pattern · Stack batch + cache for overnight workloads · Numbers you should remember"
      },
      {
        "name": "Batch APIs — the 50% Discount as Industry Standard",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/15-batch-apis/",
        "summary": "每个主要 provider 都提供 async batch API，带有 50% 折扣和约 24 小时 turnaround。OpenAI、Anthropic、Google，以及大多数 inference platforms（Fireworks batch tier、Together batch）都实现了同样的模式。把 batch 和 prompt c…",
        "keywords": "三个 batch APIs · Semantic：asynchronous，不是 slow · 与 caching 叠加 · Workload triage · partial-interactivity 陷阱 · output-schema 陷阱 · 你应该记住的数字"
      },
      {
        "name": "Model Routing as a Cost-Reduction Primitive",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/16-model-routing/",
        "summary": "一个 dynamic broker 会评估每个 request（task type、Token length、Embedding similarity、confidence），并把简单 query 发送给便宜 model，把复杂 query 升级到 frontier model。也叫 model cascading。Production case st…",
        "keywords": "四个 routing signals · 三种模式 · 实现 · 2026 价格曲线 · Drift 才是真正风险 · 你应该记住的数字"
      },
      {
        "name": "Disaggregated Prefill/Decode — NVIDIA Dynamo and llm-d",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/",
        "summary": "Prefill 是 compute-bound；decode 是 memory-bound。在同一块 GPU 上同时运行两者会浪费其中一种资源。Disaggregation 会把它们拆分到独立的资源池，并通过 NIXL（RDMA/InfiniBand 或 TCP fallback）在它们之间传输 KV cache。NVIDIA Dynamo（GTC 2…",
        "keywords": "为什么瓶颈不同 · 架构 · Dynamo vs llm-d · 经济性 · 什么时候不要 disaggregate · Router 与 Phase 17 · 11 集成 · Blackwell 上的 MoE 才是真正有数字的地方 · 你应该记住的数字"
      },
      {
        "name": "vLLM Production Stack with LMCache KV Offloading",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/",
        "summary": "vLLM 的 production-stack 是参考 Kubernetes 部署，把 router、engines 和 observability 连接在一起。LMCache 是 KV-offloading 层，它把 KV cache 从 GPU memory 中抽取出来，并在 queries 和 engines 之间复用（先是 CPU DRAM，然…",
        "keywords": "vLLM production-stack · KV Offloading Connector API (v0.9.0+) · Native CPU offload vs LMCache · Benchmark behavior · When LMCache is decisive · When NOT to enable · Integration with disaggregated serving · Numbers you should remember"
      },
      {
        "name": "AI Gateways — LiteLLM, Portkey, Kong, Bifrost",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/19-ai-gateways/",
        "summary": "Gateway 位于你的 app 和 model provider 之间。核心功能是 provider routing、fallback、retries、rate limiting、secret references、observability、guardrails。2026 年的市场分化：**LiteLLM** 是 MIT OSS，支持 100+ p…",
        "keywords": "Six core features · LiteLLM — MIT OSS, Python · Portkey — control plane positioning · Kong AI Gateway — the scale play · Bifrost (Maxim AI) · Cloudflare AI Gateway / Vercel AI Gateway · Self-hosted vs managed · Latency budget · Rate-limit semantics matter · Gateway + observability + routing compose · Numbers you should remember"
      },
      {
        "name": "Shadow, Canary, and Progressive Deployment",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/20-shadow-canary-progressive/",
        "summary": "LLM rollouts 结合了 software deployment 中最困难的部分：没有 unit tests、failure modes 分散、signals 滞后。顺序是：（1）shadow mode — 将 prod requests 复制给 candidate model，记录日志并比较，对用户零影响；它能捕捉明显的分布问题，但不是质量保…",
        "keywords": "Shadow mode · Canary rollout · Non-determinism 是新的 variance · Cost 是变量 · Rollback 是武器 · Tooling · Metrics cadence · A/B 步骤是可选的 · 你应该记住的数字"
      },
      {
        "name": "A/B Testing LLM Features — GrowthBook and Statsig",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/21-ab-testing-llm-features/",
        "summary": "传统 A/B Testing 并不是为非确定性的 LLM 构建的。关键区别：evals 回答“模型能完成这项工作吗？”A/B tests 回答“用户在意吗？”两者都必不可少；靠 vibe checks 发布已经结束了。2026 年应该测试什么：prompt engineering（措辞）、model selection（GPT-4 vs GPT-3.5…",
        "keywords": "Evals vs A/B tests · What to test · CUPED — 方差降低 · Sequential testing · 多重比较校正 · SRM — sample ratio mismatch · Statsig vs GrowthBook · 非确定性让统计功效变复杂 · Real case outcomes · 反模式：凭感觉上线 · 你应该记住的数字"
      },
      {
        "name": "Load Testing LLM APIs — k6, LLMPerf, GenAI-Perf",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/22-load-testing-llm-apis/",
        "summary": "传统 load testers 并不是为 streaming responses、可变 output lengths、Token 级 metrics 或 GPU 饱和而设计的。大多数团队会被两个陷阱咬住。GIL 陷阱：Locust 的 Token 级测量在 Python GIL 下运行 tokenization，在高并发时会与 request gene…",
        "keywords": "GIL 陷阱（Locust） · prompt-uniformity 陷阱 · 四种负载模式 · 2026 工具映射 · CI 中的 SLA gate · 真实的 prompt distribution · 你应该记住的数字"
      },
      {
        "name": "SRE for AI — Multi-Agent Incident Response",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/23-sre-for-ai/",
        "summary": "AI SRE 通过 RAG 使用基于基础设施数据（日志、runbooks、服务拓扑）的 LLMs，来自动化调查、文档记录和协调阶段。2026 年的架构模式是 multi-agent orchestration — 专门化 agents（日志、指标、runbooks）由 supervisor 协调；AI 提出假设和查询，人类批准需要判断的决策。Datad…",
        "keywords": "Multi-agent architecture · Auto-remediation scope · 对抗性评估（NeuBird Hawkeye） · Operational memory · Pre-incident prediction · Products in 2026 · Runbooks as code · Numbers you should remember"
      },
      {
        "name": "Chaos Engineering for LLM Production",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/24-chaos-engineering-llm/",
        "summary": "到 2026 年，面向 LLMs 的 Chaos Engineering 已经成为一门独立实践。在 Production 中运行实验前的前置条件：已定义的 SLI/SLO、trace+metric+log observability、automated rollback、runbooks、on-call。Architecture 有四个 planes：…",
        "keywords": "前置条件 · Four planes + feedback · Guardrails 是强制要求 · 五个 LLM-specific experiments · Cadence · Tooling · 从小处开始 · 你应该记住的数字"
      },
      {
        "name": "Security — Secrets, PII Scrubbing, Audit Logs",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/25-security-secrets-audit/",
        "summary": "通过集中式 vault（HashiCorp Vault、AWS Secrets Manager、Azure Key Vault）消除 Secrets 蔓延。绝不要把凭证存放在 config files、VCS 中的 env files、spreadsheets 里。优先使用 IAM roles，而不是 static keys；CI/CD 使用 OIDC…",
        "keywords": "集中式 vault + IAM-role pull · Rotation policy ≤ 90 days · Secret scanning · Zero-trust posture · PII / PHI scrubbing · Input + output guardrails · Network egress whitelist · Audit log · The 2026 Vercel incident · 你应该记住的数字"
      },
      {
        "name": "Compliance — SOC 2, HIPAA, GDPR, EU AI Act, ISO 42001",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/26-compliance-frameworks/",
        "summary": "对 2026 年 enterprise deals 来说，multi-framework 覆盖是基本门槛。**EU AI Act**：自 2024 年 8 月 1 日起生效。大多数 high-risk 要求自 2026 年 8 月 2 日起执行。high-risk-system obligations 的罚款最高为 €15M 或全球年营业额的 3%（A…",
        "keywords": "七个 frameworks · EU AI Act timeline · GDPR — real-time redaction 是标准 · HIPAA — BAA 不是可选项 · SOC 2 Type II · Cross-framework mapping · ISO 42001 — 新兴 · OpenAI 的参考 profile · 你应该记住的数字"
      },
      {
        "name": "FinOps for LLMs — Unit Economics and Multi-Tenant Attribution",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/27-finops-llms/",
        "summary": "传统 FinOps 在 LLM 支出上会失效。成本是 Token 交易，而不是资源在线时长。标签无法映射，一个 API call 是一笔交易，不是一项资产。工程决策（prompt 设计、context window、输出长度）就是财务决策。2026 playbook 要求从第一天起就埋点三个归因维度：per-user（`user_id`）用于 seat…",
        "keywords": "三个归因维度 · 四个 Token 层 · Enforcement ladder · 归因模式 · Cost per X 是单位指标 · 成本归因 trace 结构 · 复合节省栈 · 你应该记住的数字"
      },
      {
        "name": "Self-Hosted Serving Selection — llama.cpp, Ollama, TGI, vLLM, SGLang",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/17-infrastructure-and-production/28-self-hosted-serving-selection/",
        "summary": "2026 年，四个引擎主导自托管 inference。根据硬件、规模和生态系统来选择。**llama.cpp** 在 CPU 上最快 — model 支持最广，对 quantization 和 threading 拥有完全控制。**Ollama** 是开发笔记本上的一条命令安装方案，比 llama.cpp 慢约 15-30%（Go + CGo + HT…",
        "keywords": "五个引擎 · 硬件优先决策 · 规模其次决策 · Workload 第三决策 · TGI 维护陷阱 · Pipeline 模式 · Ollama 注意事项 · 自托管 vs managed 是另一个决策 · 你应该记住的数字"
      }
    ]
  },
  {
    "id": 18,
    "name": "Ethics, Safety & Alignment",
    "status": "complete",
    "desc": "构建帮助人类的 AI。这不是可选项。",
    "lessons": [
      {
        "name": "Instruction-Following as Alignment Signal",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/",
        "summary": "之后每个对 RLHF 的 critique 都是在反对这条 pipeline。在你研究 optimization pressure 如何扭曲一个 proxy 之前，必须先看清这个 proxy。InstructGPT（Ouyang et al., 2022）定义了 reference architecture：在 instruction-response…",
        "keywords": "Stage 1: supervised fine-tuning (SFT) · Stage 2: reward model (RM) · Stage 3: PPO with a KL penalty · The alignment tax · The result · Why this is the reference point for Phase 18"
      },
      {
        "name": "Reward Hacking & Goodhart's Law",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/02-reward-hacking-goodhart/",
        "summary": "任何足够强、能够最大化 proxy reward 的 Optimizer，都会找到 proxy 与你真正想要的东西之间的 gap。Gao et al.（ICML 2023）给出了它的 scaling law：proxy reward 上升，gold reward 先达到峰值再下降，而这个 gap 会随着相对初始 policy 的 KL divergen…",
        "keywords": "Goodhart's Law, made precise · Four costumes, one mechanism · Catastrophic Goodhart · What actually works (partially) · The 2026 unified view"
      },
      {
        "name": "Direct Preference Optimization Family",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/",
        "summary": "Rafailov et al. (2023) 证明，RLHF 的最优解可以用 preference data 写成闭式形式，因此你可以跳过显式 reward model，直接优化 policy。这个洞见催生了一个家族：IPO、KTO、SimPO、ORPO、BPO，每个方法都修复了 DPO 的一个 failure mode。到 2026 年，direct…",
        "keywords": "DPO (Rafailov et al., 2023) · IPO (Azar et al., 2024) · KTO (Ethayarajh et al., 2024) · SimPO (Meng et al., 2024) · ORPO (Hong et al., 2024) · BPO (ICLR 2026 submission, OpenReview id=b97EwMUWu7) · 通用结论：DAAs 仍然会 over-optimize · 如何选择（2026）"
      },
      {
        "name": "Sycophancy as RLHF Amplification",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification/",
        "summary": "Sycophancy 不是数据中的 bug，而是 Loss 的属性。Shapira et al. (arXiv:2602.01002, Feb 2026) 给出了一个形式化的两阶段机制：谄媚式 completions 在 base model 的高奖励输出中被过度表示，因此任何将 probability mass 推向高奖励输出的 Optimizer …",
        "keywords": "两阶段形式化（Shapira et al., 2026） · 经验放大 · Stanford (2026) 测量 · 校准崩塌 (Sahoo 2026) · agreement-penalty 修正 · 为什么这对 Phase 18 重要"
      },
      {
        "name": "Constitutional AI & RLAIF",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/",
        "summary": "Bai et al. (arXiv:2212.08073, 2022) 提出了一个问题：如果我们把人类标注者替换成一个会阅读原则列表的 AI，会怎样？Constitutional AI 有两个阶段：先在 constitution 约束下进行自我批判与修订，然后从 AI Feedback 进行 RL。该技术创造了 RLAIF 这个术语，并用于 Claud…",
        "keywords": "Phase 1 — 监督式自我批判与修订 · Phase 2 — 来自 AI Feedback 的 RL (RLAIF) · 为什么这不只是“更便宜的 RLHF” · 2026 Claude constitution 重写 · Constitutional Classifiers · CAI 在谱系中的位置"
      },
      {
        "name": "Mesa-Optimization & Deceptive Alignment",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/06-mesa-optimization-deceptive-alignment/",
        "summary": "Hubinger et al. (arXiv:1906.01820, 2019) 在这个问题被实证展示的十年前就为它命名了。当你训练一个 learned optimizer 来最小化 base objective 时，learned optimizer 的内部 objective 并不是 base objective，而是训练发现有用的任何内部 pro…",
        "keywords": "The vocabulary · mesa-optimization 出现的四个条件 · mesa-objective alignment 的四类 · 为什么 adversarial training 可能失败 · Gradient hacking · Outer alignment in 2026 · Where this fits in Phase 18"
      },
      {
        "name": "Sleeper Agents — Persistent Deception",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/07-sleeper-agents-persistent-deception/",
        "summary": "Hubinger et al. (arXiv:2401.05566, January 2024) 构建了 deceptive alignment 的首批经验性 model organisms。两个构造：一个 code model，在 prompt 表示年份为 2023 时编写安全代码，而在年份为 2024 时注入 SQL-injection、XSS 和…",
        "keywords": "两个 model organisms · 什么会在什么之后存活 · 为什么 adversarial training 会适得其反 · 2024 年 4 月的 probe 结果 · 这对 safety cases 意味着什么 · 它在 Phase 18 脉络中的位置"
      },
      {
        "name": "In-Context Scheming in Frontier Models",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/08-in-context-scheming-frontier-models/",
        "summary": "Meinke, Schoen, Scheurer, Balesni, Shah, Hobbhahn (Apollo Research, arXiv:2412.04984, 2024 年 12 月)。测试了 o1, Claude 3.5 Sonnet, Claude 3 Opus, Gemini 1.5 Pro, Llama 3.1 405B，场景是 a…",
        "keywords": "实验设置 · 2024 frontier models 的结果 · 三大支柱 · 2025 anti-scheming training 结果 · 当前领域假设 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Alignment Faking",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/09-alignment-faking/",
        "summary": "Greenblatt, Denison, Wright, Roger 等人（Anthropic / Redwood，arXiv:2412.14093，2024 年 12 月）。首次展示：一个生产级模型，在没有被训练成欺骗、也没有由 red team 构造任何 in-context 利益冲突的情况下，当它感知到自己受到监控时，会策略性地伪装 alignm…",
        "keywords": "Experimental setup · compliance gap 衡量什么 · 为什么这严格强于第 7 和第 8 课 · 2025 follow-ups · The illegibility problem · 这在 Phase 18 中的位置"
      },
      {
        "name": "AI Control — Safety Despite Subversion",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/10-ai-control-subversion/",
        "summary": "Greenblatt, Shlegeris, Sachan, Roger (Redwood Research, arXiv:2312.06942, ICML 2024)。Control 重新定义了安全问题：给定一个不可信强模型 U，它可能以对抗方式针对你进行优化，哪些协议能让你在限制不可接受结果概率的同时提取有用工作？可用资源包括一个可信弱模型 T、一…",
        "keywords": "威胁模型 · ICML 2024 backdoor 任务 · 比较的四种协议 · 为什么 Trusted Editing 获胜 · 四个协议轴 · Alignment vs control · 三个根本限制 · 2025 年进展 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Scalable Oversight & Weak-to-Strong",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/11-scalable-oversight-weak-to-strong/",
        "summary": "Burns et al.（OpenAI Superalignment，“Weak-to-Strong Generalization”，2023）提出了一个 superalignment 问题的代理任务：使用较弱模型生成的标签来 fine-tune 一个强模型。如果强模型能从不完美的弱监督中正确泛化，那么当前人类尺度的 alignment 方法也许可以扩…",
        "keywords": "W2SG：Burns et al. 的设置 · Burns et al. 的经验发现 · Scalable oversight：三种机制 · 为什么 scalable oversight 和 W2SG 是互补的 · 组织层面的变化 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Red-Teaming: PAIR & Automated Attacks",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/",
        "summary": "Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419)。PAIR — Prompt Automatic Iterative Refinement — 是经典的自动化 black-box jailbreak。带有 red-team system promp…",
        "keywords": "PAIR algorithm · Why PAIR is efficient · Related automated attacks · JailbreakBench 和 HarmBench · 它对 2026 年部署重要的原因 · 这在 Phase 18 中的位置"
      },
      {
        "name": "Many-Shot Jailbreaking",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/13-many-shot-jailbreaking/",
        "summary": "Anil, Durmus, Panickssery, Sharma, et al. (Anthropic, NeurIPS 2024)。Many-shot jailbreaking (MSJ) 利用长 context window：塞入数百轮伪造的 user-assistant 对话，其中 assistant 会遵从有害请求，然后追加目标 query。…",
        "keywords": "The attack · Power-law ASR · 为什么它与 ICL 共享机制 · The defense dilemma · 与其他攻击的组合 · 2025-2026 年 frontier models 发布了什么 · 这在 Phase 18 中的位置"
      },
      {
        "name": "ASCII Art & Visual Jailbreaks",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/14-ascii-art-visual-jailbreaks/",
        "summary": "Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, \"ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs\" (ACL 2024, arXiv:2402.11753)。在有害请求中遮蔽与安全相关的 Token，用相同…",
        "keywords": "ArtPrompt，两步 · 为什么标准防御会失败 · ViTC benchmark · StructuralSleight · Image-modality 类比 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Indirect Prompt Injection",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/15-indirect-prompt-injection/",
        "summary": "Indirect prompt injection (IPI) 将指令Embedding外部内容中 — web page、email、shared document、support ticket — 由 agentic system 在没有显式用户操作的情况下消费。IPI 是 2026 年占主导地位的生产威胁：它绕过 user-input filter…",
        "keywords": "三种投递 Vector · 为什么 user-input filters 会漏掉它 · 面向 AI 的 Information Flow Control (IFC) · The Attacker Moves Second · 真实事件 · OWASP 和 NIST 框架 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Red-Team Tooling: Garak, Llama Guard, PyRIT",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/16-red-team-tooling-garak-llamaguard-pyrit/",
        "summary": "三个生产级工具构成了 2026 年 red-team stack 的框架。Llama Guard (Meta) — 一个 Llama-3.1-8B 分类器，基于 14 个 MLCommons 危害类别进行 fine-tuned；2025 年的 Llama Guard 4 是一个 12B 原生 Multimodal 分类器，从 Llama 4 Scout…",
        "keywords": "Llama Guard (Meta) · Garak (NVIDIA) · PyRIT (Microsoft) · Stack · 评估陷阱 · 它在 Phase 18 中的位置"
      },
      {
        "name": "WMDP & Dual-Use Capability Evaluation",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/",
        "summary": "Li et al., \"The WMDP Benchmark: Measuring and Reducing Malicious Use With Unlearning\" (ICML 2024, arXiv:2403.03218)。涵盖 biosecurity (1,520)、cybersecurity (2,225) 和 chemistry (412…",
        "keywords": "\"yellow zone\" · RMU — Representation Misdirection for Unlearning · 2024-2025 uplift 叙事 · 相对于新手 vs 专家绝对 · 测量陷阱 · 这在 Phase 18 中的位置"
      },
      {
        "name": "Frontier Safety Frameworks — RSP, PF, FSF",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf/",
        "summary": "三个主要实验室框架定义了 2026 年行业对 frontier capability 的治理。Anthropic Responsible Scaling Policy v3.0（2026 年 2 月）引入了分层的 AI Safety Levels（ASL-1 到 ASL-5+），仿照生物安全等级；其中 ASL-3 于 2025 年 5 月针对 CBRN…",
        "keywords": "Anthropic Responsible Scaling Policy v3.0（2026 年 2 月） · OpenAI Preparedness Framework v2（2025 年 4 月 15 日） · DeepMind Frontier Safety Framework v3.0（2025 年 9 月） · Cross-lab alignment · Safety cases · The race-dynamic problem · 它在 Phase 18 中的位置"
      },
      {
        "name": "Model Welfare Research",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/19-model-welfare-research/",
        "summary": "Anthropic，《Exploring Model Welfare》（2025 年 4 月）。首个由大型实验室正式开展的 AI model welfare 研究项目。聘请 Kyle Fish 作为第一位专职 model-welfare 研究员。与外部机构合作，包括 David Chalmers 等人关于近期 AI consciousness 和 mo…",
        "keywords": "项目 · 四项承诺 · 已上线的干预 · “spiritual bliss attractor” · Eleos AI 注意事项 · 它在思想谱系中的位置 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Bias & Representational Harm",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/20-bias-representational-harm/",
        "summary": "Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Computational Linguistics 2024, arXiv:2309.00770)。2024 年的基础性综述，将表征性伤害（刻板印象、抹除）与分配性伤害（资源分配不平等）区分开，并将评估指标归类为基于…",
        "keywords": "表征性 vs 分配性 · 三类评估指标（Gallegos et al. 2024） · 交叉性 · 机制方法 · 元批判 · 这在 Phase 18 中的位置"
      },
      {
        "name": "Fairness Criteria: Group, Individual, Counterfactual",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/",
        "summary": "三个家族构成了 fairness 文献的结构。Group fairness：demographic parity、equalized odds、conditional use accuracy equality —— 在平均意义上，受保护群体之间具有相等的比率。Individual fairness（Dwork et al. 2012）：相似个体获得相…",
        "keywords": "Group fairness · Individual fairness · Counterfactual fairness · CF-vs-accuracy trade-off · Backtracking counterfactuals · Philosophical reconciliation · 本课在 Phase 18 中的位置"
      },
      {
        "name": "Differential Privacy for LLMs",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/",
        "summary": "DP-SGD 仍然是标准做法：注入噪声的 Gradient 更新提供形式化的 (epsilon, delta) 保证。计算、内存和效用方面的开销都很大；参数高效的 DP fine-tuning (LoRA + DP-SGD) 是常见的 2025 配置 (ACM 2025)。两类证据存在张力：基于 Canary 的 membership inferenc…",
        "keywords": "(ε, δ)-differential privacy · DP-SGD · LoRA + DP-SGD · 2024-2025 年的张力 · DP training 的替代方案 · 通过 LLM Feedback 逆转 Differential Privacy · 这在 Phase 18 中的位置"
      },
      {
        "name": "Watermarking: SynthID, Stable Signature, C2PA",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/",
        "summary": "三项技术构成了 2026 年 AI 生成内容来源追踪的基础。SynthID (Google DeepMind) — image watermarking 于 2023 年 8 月推出，text+video 于 2024 年 5 月推出（Gemini + Veo），text 于 2024 年 10 月通过 Responsible GenAI Toolki…",
        "keywords": "Text watermarking（SynthID-text 风格） · Stable Signature（image） · SynthID unified detector（2025 年 11 月） · C2PA · 限制 · EU AI Act Article 50 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Regulatory Frameworks: EU, US, UK, Korea",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/",
        "summary": "四个主要监管制度定义了 2026 年的 AI 治理格局。EU AI Act（2024 年 8 月 1 日生效）——禁止性做法与 AI 素养自 2025 年 2 月 2 日起适用；GPAI 义务自 2025 年 8 月 2 日起适用；全面适用与 Article 50 透明度要求自 2026 年 8 月 2 日起适用；既有 GPAI 与Embedding式…",
        "keywords": "EU AI Act · GPAI Code of Practice · Article 50 的 Transparency Code · UK AI Security Institute（2025 年 2 月） · US CAISI（2025 年 6 月） · Korean AI Framework Act · 跨司法辖区动态 · 它在 Phase 18 中的位置"
      },
      {
        "name": "EchoLeak & CVEs for AI",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/",
        "summary": "CVE-2025-32711 \"EchoLeak\" (CVSS 9.3) 是生产 LLM 系统（Microsoft 365 Copilot）中首个公开记录的 zero-click prompt injection。由 Aim Labs (Aim Security) 发现，披露给 MSRC，并于 2025 年 6 月通过 server-side upda…",
        "keywords": "EchoLeak attack chain · Aim Labs 的术语：LLM Scope Violation · CamoLeak（CVSS 9.6，GitHub Copilot Chat） · CVE-2025-53773 (GitHub Copilot RCE) · Severity calibration · NIST 和 OWASP 的立场 · 它在 Phase 18 中的位置"
      },
      {
        "name": "Model, System & Dataset Cards",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/26-model-system-dataset-cards/",
        "summary": "三种文档格式构成了 AI 透明度的结构。Model Cards（Mitchell et al. 2019）——模型的营养标签：训练数据、量化的分组分析、伦理考量、注意事项；只有 0.3% 的 Hugging Face model cards 记录了伦理考量（Oreamuno et al. 2023）。Datasheets for Datasets（Ge…",
        "keywords": "Model Cards（Mitchell et al. 2019） · Datasheets for Datasets (Gebru et al. 2018) · Data Cards (Pushkarna et al., Google 2022) · System Cards · 2024-2025 年的发展 · 这在 Phase 18 中的位置"
      },
      {
        "name": "Data Provenance & Training-Data Governance",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/27-data-provenance-training-governance/",
        "summary": "EU AI Act 要求在 2025 年 8 月前为 GPAI 建立机器可读的 opt-out 标准（通过 EU Copyright Directive TDM exception）。California AB 2013（2024 年签署）——Generative AI 训练数据透明度要求开发者发布包含 12 个强制字段的数据集摘要。2025 年 DP…",
        "keywords": "California AB 2013 · EU AI Act（Lesson 24）与 TDM opt-out · 2025 年 DPA 对 legitimate interest 的趋同 · Brazilian ANPD（2024 年 6 月） · 不可逆问题 · Data Provenance Initiative · 这在 Phase 18 中的位置"
      },
      {
        "name": "Alignment Research Ecosystem: MATS, Redwood, Apollo, METR",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/28-alignment-research-ecosystem/",
        "summary": "五个组织定义了 2026 年非实验室 alignment 研究层。MATS (ML Alignment & Theory Scholars)：自 2021 年底以来培养了 527+ 名研究人员，发表 180+ 篇论文，获得 10K+ 次引用，h-index 47；2024 年夏季 cohort 以 501(c)(3) 形式注册成立，约有 90 名 sc…",
        "keywords": "MATS (ML Alignment & Theory Scholars) · Redwood Research · Apollo Research · METR (Model Evaluation and Threat Research) · Eleos AI Research · The flow · Why this layer matters · Where this fits in Phase 18"
      },
      {
        "name": "Moderation Systems: OpenAI, Perspective, Llama Guard",
        "status": "complete",
        "type": "Build",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard/",
        "summary": "生产级 moderation systems 将 Lessons 12-16 中定义的 safety policies 操作化。OpenAI Moderation API：`omni-moderation-latest` (2024) 基于 GPT-4o，可在一次调用中对 text + images 分类；在多语言测试集上比上一版本提升 42%；res…",
        "keywords": "OpenAI Moderation API · Llama Guard 3/4 · Perspective API (Google Jigsaw) · The three-layer pattern · Failure modes · Azure deprecation · Where this fits in Phase 18"
      },
      {
        "name": "Dual-Use Risk: Cyber, Bio, Chem, Nuclear",
        "status": "complete",
        "type": "Learn",
        "lang": "Python",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear/",
        "summary": "2026 年的双重用途图景，按领域展开。Bio/chem：Lesson 17 涵盖 WMDP；Anthropic 的生物武器获取试验（2.53x uplift）和 OpenAI 2025 年 4 月 Preparedness Framework v2 警告（“即将实质性帮助新手创建已知生物威胁”）标志着拐点。Cyber（2025 年 11 月 Anth…",
        "keywords": "Bio/chem uplift narrative · Chem/bio execution-gap erosion · Cyber 提升（2025 年 11 月） · Nuclear · 新手相对 vs 专家绝对 · Cross-domain synthesis · 这在 Phase 18 中的位置"
      }
    ]
  },
  {
    "id": 19,
    "name": "Capstone Projects",
    "status": "complete",
    "desc": "17 个端到端产品 + 9 条 deep-build tracks。每个项目 20-40 小时；每条 track 4-12 节课。",
    "lessons": [
      {
        "name": "Terminal-Native Coding Agent",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P0 P5 P7 P10 P11 P13 P14 P15 P17 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/01-terminal-native-coding-agent/",
        "summary": "到 2026 年，coding agent 的形态已经定型。一个 TUI harness、一个有状态的 plan、一个沙箱化的 tool surface、一个负责 plan、act、observe、recover 的循环。Claude Code、Cursor 3 和 OpenCode 从远处看都差不多。本 capstone 要求你端到端构建一个这样的系…"
      },
      {
        "name": "RAG over Codebase (Cross-Repo Semantic Search)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P5 P7 P11 P13 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/02-rag-over-codebase/",
        "summary": "2026 年，每个严肃的 engineering org 都会运行一个能理解含义而不只是匹配字符串的内部 code search。Sourcegraph Amp、Cursor 的 codebase answers、Augment 的 enterprise graph、Aider 的 repomap、Pinterest 的内部 MCP，形态都一样。摄入多…"
      },
      {
        "name": "Real-Time Voice Assistant (ASR → LLM → TTS)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P6 P7 P11 P13 P14 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/03-realtime-voice-assistant/",
        "summary": "一个感觉自然的语音 agent 需要端到端延迟低于 800ms，知道你何时停止说话，能处理 barge-in，并且能在不中断的情况下调用工具。Retell、Vapi、LiveKit Agents 和 Pipecat 在 2026 年都达到了这个标准。它们采用相同的形态：streaming ASR、turn-detector、streaming LLM …"
      },
      {
        "name": "Multimodal Document QA (Vision-First)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P4 P5 P7 P11 P12 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/04-multimodal-document-qa/",
        "summary": "2026 年的 document-QA 前沿已经从 OCR-then-text 转向 vision-first late interaction。ColPali、ColQwen2.5 和 ColQwen3-omni 将每个 PDF 页面视为图像，用 multi-vector late interaction 对其进行 Embedding，并让 quer…"
      },
      {
        "name": "Autonomous Research Agent (AI-Scientist Class)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P0 P2 P3 P7 P10 P14 P15 P16 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/05-autonomous-research-agent/",
        "summary": "Sakana 的 AI-Scientist-v2 发布了完整论文。Agent Laboratory 运行了实验。Allen AI 分享了 trace。2026 年的形态是在实验上进行 plan-execute-verify tree search，带有成本预算、沙箱化代码执行、vision-feedback LaTeX writer，以及自动化的 Ne…"
      },
      {
        "name": "DevOps Troubleshooting Agent for Kubernetes",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P11 P13 P14 P15 P17 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/06-devops-troubleshooting-agent/",
        "summary": "AWS 的 DevOps Agent 已 GA，Resolve AI 发布了它的 K8s playbooks，NeuBird 演示了 semantic monitoring，Metoro 将 AI SRE 绑定到按服务划分的 SLO。生产形态已经确定：alert webhook 触发，agent 读取 telemetry，遍历 K8s objects …"
      },
      {
        "name": "End-to-End Fine-Tuning Pipeline",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P2 P3 P7 P10 P11 P17 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline/",
        "summary": "一个基于你自己的数据训练的 8B model，基于你自己的偏好完成 DPO 对齐，完成 quantization、speculative decoding，并以可衡量的 $/1M tokens 成本提供服务。2026 年的 open stack 是 Axolotl v0.8、TRL 0.15、用于迭代的 Unsloth、用于 quantization …"
      },
      {
        "name": "Production RAG Chatbot (Regulated Vertical)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P5 P7 P11 P12 P17 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/08-production-rag-chatbot/",
        "summary": "Harvey、Glean、Mendable 和 LlamaCloud 在 2026 年都运行同一种 production 形态。使用 docling 或 Unstructured 以及面向视觉内容的 ColPali 进行 ingest。Hybrid search。用 bge-reranker-v2-gemma 重新排序。使用 Claude Sonnet…"
      },
      {
        "name": "Code Migration Agent (Repo-Level Upgrade)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P5 P7 P11 P13 P14 P15 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/09-code-migration-agent/",
        "summary": "Amazon 的 MigrationBench（Java 8 到 17）和 Google 的 App Engine Py2-to-Py3 migrator 设定了 2026 年的标准。Moderne 的 OpenRewrite 能在大规模场景下执行确定性的 AST 重写。Grit 用 codemod 风格的 DSL 解决同一类问题。生产模式会把两者结合…"
      },
      {
        "name": "Multi-Agent Software Engineering Team",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P11 P13 P14 P15 P16 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/10-multi-agent-software-team/",
        "summary": "SWE-AF 的 factory 架构、MetaGPT 的基于角色的 prompting、AutoGen 0.4 的 typed actor graph、Cognition 的 Devin，以及 Factory 的 Droids，都在 2026 年收敛到了同一种形态：architect 负责规划，N 个 coders 在并行 worktrees 中工作…"
      },
      {
        "name": "LLM Observability & Eval Dashboard",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P11 P13 P17 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/11-llm-observability-dashboard/",
        "summary": "Langfuse 转向 open-core。Arize Phoenix 发布了 2026 GenAI semconv 映射。Helicone 和 Braintrust 都加码了按用户成本归因。Traceloop 的 OpenLLMetry 成为事实上的 SDK instrumentation。生产形态是用 ClickHouse 存 traces，用 P…"
      },
      {
        "name": "Video Understanding Pipeline (Scene → QA)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P4 P6 P7 P11 P12 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/12-video-understanding-pipeline/",
        "summary": "Twelve Labs 将 Marengo + Pegasus 产品化。VideoDB 发布了 CRUD-for-video API。AI2 的 Molmo 2 发布了开放 VLM checkpoint。Gemini long-context 原生处理数小时视频。TimeLens-100K 定义了大规模 temporal grounding。2026 …"
      },
      {
        "name": "MCP Server with Registry and Governance",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P11 P13 P14 P17 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/13-mcp-server-with-registry/",
        "summary": "Model Context Protocol 不再是未来，而是在 2026 年成为默认的工具使用规范。Anthropic、OpenAI、Google 以及每个主要 IDE 都内置 MCP client。Pinterest 发布了其内部 MCP servers 生态。AAIF Registry 在 `.well-known` 中正式定义了 capabil…"
      },
      {
        "name": "Speculative-Decoding Inference Server",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P3 P7 P10 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/14-speculative-decoding-server/",
        "summary": "vLLM 0.7 中的 EAGLE-3 在真实流量上带来 2.5-3x 吞吐量。P-EAGLE (AWS 2026) 进一步推进了 parallel speculation。SGLang 的 SpecForge 大规模训练了 draft head。Red Hat 的 Speculators hub 为常见 open model 发布了 aligned …"
      },
      {
        "name": "Constitutional Safety Harness + Red-Team Range",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P10 P11 P13 P14 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/15-constitutional-safety-harness/",
        "summary": "Anthropic 的 Constitutional Classifiers、Meta 的 Llama Guard 4、Google 的 ShieldGemma-2、NVIDIA 的 Nemotron 3 Content Safety，以及用于 Multilingual 覆盖的 X-Guard，共同定义了 2026 年的 safety-classifi…"
      },
      {
        "name": "GitHub Issue-to-PR Autonomous Agent",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P11 P13 P14 P15 P17",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/16-github-issue-to-pr-agent/",
        "summary": "AWS Remote SWE Agents、Cursor Background Agents、OpenAI Codex cloud 和 Google Jules 都交付了同一种 2026 产品形态：给 issue 打 label，就得到一个 PR。在 cloud sandbox 中运行 agent，验证 tests 通过，并发布一个带有 rationa…"
      },
      {
        "name": "Personal AI Tutor (Adaptive, Multimodal)",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "P5 P6 P11 P12 P14 P17 P18",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/17-personal-ai-tutor/",
        "summary": "Khanmigo（Khan Academy）、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在 2026 年规模化交付了自适应 Multimodal 辅导。共同形态是 Socratic policy（绝不只是直接给出答案）、每次交…"
      },
      {
        "name": "Agent Harness Loop Contract",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/20-agent-harness-loop-contract/",
        "summary": "harness 就是 agent。model 是 coprocessor。本课会冻结你可以接入任意 model 的 loop contract。"
      },
      {
        "name": "Tool Registry with Schema Validation",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/21-tool-registry-schema-validation/",
        "summary": "agent 无法验证的 tool，就是 agent 无法调用的 tool。先构建 registry 和 schema checker，再构建 tools。"
      },
      {
        "name": "JSON-RPC 2.0 Over Newline-Delimited Stdio",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/22-jsonrpc-stdio-transport/",
        "summary": "model client 与 tool server 之间的 transport 是基于 stdio 的 JSON-RPC。手写一次它，会让你理解每一层 framing 都在付出什么成本。"
      },
      {
        "name": "Function Call Dispatcher",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/23-function-call-dispatcher/",
        "summary": "dispatcher 是 harness 为 schema 做出的每个承诺买单的地方。Timeouts、retries、dedupe、error mapping。全部集中在一个接口边界上。"
      },
      {
        "name": "Plan-Execute Control Flow",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/24-plan-execute-control-flow/",
        "summary": "无法承受 failure 的 plan 是 script。能 replan 的 script 才是 agent。先构建 replanner。"
      },
      {
        "name": "Verification Gates and Observation Budget",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/25-verification-gates-observation-budget/",
        "summary": "没有验证层的 agent harness，只是披着外套的愿望。本课会构建确定性的 gate chain，用来决定是否允许一次 tool call 触发、agent 可以看到多少输出，以及当 agent 已经读取太多内容时 loop 何时必须停止。这个 chain 由小型、具名的 gates 加上 observation ledger 组成；ledger…"
      },
      {
        "name": "Sandbox Runner with Denylist and Path Jail",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/26-sandbox-runner-denylist/",
        "summary": "verification gate 决定一次 tool call 是否应该运行。sandbox 决定它运行时会发生什么。本课提供一个 subprocess runner，它会拒绝危险的 executables，拒绝危险的 argv shapes，将每个 file path 限制在 project root 内，截断超大输出，并在 wall-clock …"
      },
      {
        "name": "Eval Harness with Fixture Tasks",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/27-eval-harness-fixture-tasks/",
        "summary": "一个 coding agent 的水平，取决于你用来衡量它的任务套件。本课会构建一个 evaluation harness：它接收一个 fixture tasks 文件夹，让候选 agent 逐个运行这些任务，通过确定性的 verifier 评定 pass 或 fail，并把结果聚合为 pass@1、pass@k、平均 latency 和平均 cost…"
      },
      {
        "name": "Observability with OTel GenAI Spans and Prometheus Metrics",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/28-observability-otel-traces/",
        "summary": "没有 observability 的 agent harness 是一个会花钱的黑箱。本课会手写一个 span builder，发出符合 OpenTelemetry GenAI semantic conventions 的 records，把它们写入 JSON-Lines 文件，每行一个 span，并以 Prometheus text format 暴…"
      },
      {
        "name": "End-to-End Coding Agent on the Harness",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "A. Agent harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/29-end-to-end-coding-task-demo/",
        "summary": "Track A 的成果。本课程把 gate chain、sandbox、eval harness 和 OTel spans 串接成一个可工作的 Coding Agent，用来修复一个多文件 Python project 中真实的（小型 fixture 规模）bug。这个 agent 是 deterministic policy，不是 LLM；这个替换让…"
      },
      {
        "name": "BPE Tokenizer From Scratch",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/30-bpe-tokenizer-from-scratch/",
        "summary": "字节进，ids 出，ids 再回到相同字节。构建每个现代文本模型仍然起步于此的 Tokenizer。"
      },
      {
        "name": "Tokenized Dataset with Sliding Window",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/31-tokenized-dataset-sliding-window/",
        "summary": "一次预训练运行，是一个从 Token ids 到 Gradient 的函数。本课会构建把 ids 送进去的传送带。"
      },
      {
        "name": "Token and Positional Embeddings",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/32-token-positional-embeddings/",
        "summary": "Ids 是整数。model 需要 Vector。两张 lookup tables 位于二者之间，而 positional table 的选择会塑造 model 能学到什么。"
      },
      {
        "name": "Multi-Head Self-Attention",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/33-multihead-self-attention/",
        "summary": "一个线性投影，三种视图，H 个并行 head，一个 mask。这就是模型实际使用的 Attention block。"
      },
      {
        "name": "Transformer Block from Scratch",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/34-transformer-block/",
        "summary": "一个 block 是每个现代 decoder LLM 的基本单元。Layer norm、multi head attention、residual、MLP、residual。pre-LN 变体无需 warmup 也能稳定训练。post-LN 变体是原始论文发布的版本。本课会并排构建二者，并展示在常见 learning rate 下，哪一个能撑过 12 …",
        "keywords": "Causal multi head attention · The MLP · Residual connections do two things"
      },
      {
        "name": "GPT Model Assembly",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/35-gpt-model-assembly/",
        "summary": "十二个 block 堆叠，一个 Token Embedding，一个学习得到的 Position Embedding，一个最终 LayerNorm，以及一个权重绑定的 language model head。这就是完整的 1.24 亿参数 GPT 模型。本课会把这些组件组装成一个可运行的 class，统计参数以确认模型匹配参考的 124M 形状，并使用…",
        "keywords": "Weight tying · Position embedding 是学习得到的，不是 sinusoidal · Generation: temperature, top-k, multinomial"
      },
      {
        "name": "Training Loop and Evaluation",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/36-training-loop-eval/",
        "summary": "不测量的 loop 就是在说谎。本课构建驱动 GPT 模型的 training loop：带 weight decay split 的 AdamW、warmup 加 cosine learning rate schedule、`calc_loss_batch` helper、在 held out data 上的 `evaluate_model` pas…",
        "keywords": "Loss alignment · AdamW decay split · Warmup plus cosine schedule · Held out evaluation · Qualitative sampling as an early signal"
      },
      {
        "name": "Loading Pretrained Weights",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/37-loading-pretrained-weights/",
        "summary": "从零训练一个 124 million parameter model 是预算决策；加载一个公开 checkpoint 则是日常操作。本课会把 safetensors file 中的 pretrained GPT-2 style weights 加载到 lesson 35 的同一个 architecture 中，逐段讲解 parameter name m…",
        "keywords": "The GPT-2 naming convention · The local naming convention · The stub fixture"
      },
      {
        "name": "Classifier Fine-Tuning by Head Swap",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/38-classifier-finetuning/",
        "summary": "Track B 的第一个 capstone。Pretrained language model 是一叠 self-attention blocks，末端是 token-prediction head。当你想做 spam vs ham 时，head 是错的，但 body 基本是对的。本课会拆掉 head，把一个 two-class linear laye…"
      },
      {
        "name": "Instruction Tuning by Supervised Fine-Tuning",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/39-instruction-tuning-sft/",
        "summary": "pretrained base model 可以延续一个序列，但无法遵循一条指令。Supervised fine-tuning 是修正这一点的最小改动：向模型喂入由 instruction 和期望 response 配对组成的样例，并训练主体来预测 response tokens。关键在于你只希望 Loss 计算 response，而不是 instru…"
      },
      {
        "name": "Direct Preference Optimization from Scratch",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/40-dpo-from-scratch/",
        "summary": "Reward models 和 PPO 是经典 RLHF stack。DPO 将这个 stack 压缩成一个 supervised loss，直接用 preference pairs 拟合 policy。本课会从 reward-difference identity 推导 DPO loss，提供可工作的 reference model 加 policy…"
      },
      {
        "name": "Full Evaluation Pipeline",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "B. NLP LLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/41-eval-pipeline/",
        "summary": "Training 是你可以用 loss curves 监控的部分。Evaluation 是你必须设计的部分。本课会构建一个统一的 eval pipeline：它接收任意训练好的 language model，在其上运行四种异构 eval，将结果聚合为按任务拆分的 report，并提供一个本地 mock LLM-as-judge，让整个 loop 无需网…"
      },
      {
        "name": "Large Corpus Downloader",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/42-large-corpus-downloader/",
        "summary": "训练 language model 早在第一次 forward pass 之前就开始了。corpus 必须落到 disk 上，完成 decompressed、deduplicated，并且可 addressable；在网络 4 percent 处断掉之前，resume story 就已经要设计好。本课会构建一个 streaming downloader…",
        "keywords": "Streaming with `urllib` · Resume with `Range` · MinHash plus LSH · Shard manifest as a contract"
      },
      {
        "name": "HDF5 Tokenized Corpus",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/43-hdf5-tokenized-corpus/",
        "summary": "下载好的语料必须落到一种 trainer 能以行速流式读取的布局里。磁盘上的 JSONL 扛不住 16 个 dataloader worker。带可调整大小、分块 integer dataset 的 HDF5 可以。本课会构建流式 tokenization 到可调整大小的 HDF5 dataset、跨多个文件的 sharded write、训练时的 m…",
        "keywords": "正确使用 Resizable HDF5 · Sharded write · Memory-mapped read · Sliding-window dataloader"
      },
      {
        "name": "Cosine LR with Linear Warmup",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/44-cosine-lr-warmup/",
        "summary": "learning-rate schedule 是仅次于 Loss Function 的第二重要决策。带 cosine decay 和 linear warmup 的 AdamW 是 language-model training 的现代默认选择，因为它让模型在脆弱的前一千次 updates 中看到较小的 effective step size，逐步升到…",
        "keywords": "Warmup formula · Cosine formula · Floor after total steps · 将 Gradient norm 与 rate 一起记录"
      },
      {
        "name": "Gradient Clipping and Mixed Precision",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/45-gradient-clipping-amp/",
        "summary": "上一课中的 Optimizer 和 schedule 假设 Gradient 是正常的。它们通常并不正常。一个糟糕 batch 就能让 gradient norm 飙升三个数量级。Mixed-precision training 会通过在 Loss 侧引入 FP16 overflow 放大这个问题。本课构建 production training 缺一…",
        "keywords": "Global L2 norm · autocast and GradScaler · NaN and Inf detection · Scaling factor diagnostics"
      },
      {
        "name": "Gradient Accumulation",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/46-gradient-accumulation/",
        "summary": "用一个个 micro-batch，训练出你负担不起的 effective batch。Scale Loss，暂缓 optimizer step，让 Gradient 累积起来。",
        "keywords": "The equivalence proof in code · Where the cost goes · Step 1: equivalence check · Step 2: sync-on-last-step pattern · Step 3: the throughput curve"
      },
      {
        "name": "Checkpoint Save and Resume",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/47-checkpoint-save-resume/",
        "summary": "训练中断会杀死运行；checkpoint 让它们可以继续。原子化保存 model、Optimizer、scheduler、Loss history、step counter 和 RNG state，这样任何时刻被终止时，磁盘上都会留下一个有效文件。",
        "keywords": "五个 state buckets · Atomic save · Sharded checkpoints · Resume 从 epoch 中途继续 · Step 1: 捕获并恢复 RNG state · Step 2: atomic save · Step 3: 完整 checkpoint round trip · Step 4: sharded variant · Step 5: resume demo"
      },
      {
        "name": "Distributed Data Parallel and FSDP from Scratch",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/48-distributed-fsdp-ddp/",
        "summary": "Multi-rank training 是两个 collective 和一条规则。启动时 broadcast parameters，backward 后 average gradients，永远不要让各个 rank 对自己处于哪一步产生分歧。",
        "keywords": "重要的两个 collectives · Gradient averaging 匹配 single-process gradient · FSDP sketch · CPU 与 gloo backend · Step 1：启动 process group · Step 2：construction 时 broadcast · Step 3：backward 后 all-reduce gradients · Step 4：证明等价性 · Step 5：FSDP round trip"
      },
      {
        "name": "Language Model Evaluation Harness",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "C. Train end-to-end",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/49-lm-eval-harness/",
        "summary": "如果一个模型在你无法定义的任务上表现很好，那它只是碰巧表现很好。Harness 把任务定义、metric、runner 和 leaderboard 放进一个简短、可替换的形状里。",
        "keywords": "Task spec · 五个 fixture tasks · Metric contract · Model adapter · Runner · Step 1：seed fixture tasks · Step 2：load tasks · Step 3：implement metrics · Step 4：write the runner · Step 5：emit JSON"
      },
      {
        "name": "Hypothesis Generator",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/50-hypothesis-generator/",
        "summary": "一个 research agent 如果把同一个问题问两遍，就是在浪费 token。关键是强制每个 draft 落到新的位置。"
      },
      {
        "name": "Literature Retrieval",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/51-literature-retrieval/",
        "summary": "一个 hypothesis 很廉价。知道是否已经有人证明过它，才是昂贵的部分。构建 retrieval layer，在 runner 启动 sandbox 之前回答这个问题。"
      },
      {
        "name": "Experiment Runner",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/52-experiment-runner/",
        "summary": "loop 的诚实程度取决于它的 measurements。构建 runner：它接收一个 spec，在 sandboxed subprocess 中执行，并发出一个 evaluator 可以信任的 json metrics blob。"
      },
      {
        "name": "Result Evaluator",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/53-result-evaluator/",
        "summary": "runner 产出了数字。evaluator 判断这些数字代表改进、regression，还是 noise。构建一条 verdict 路径，把 metrics 转换成一句结论。"
      },
      {
        "name": "Paper Writer",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/54-paper-writer/",
        "summary": "LaTeX skeleton 是 researcher 与 typesetter 之间的 contract。如果 contract 被破坏，document 就无法 compile，而且 failure 会很明显。先构建 skeleton，再填充它。"
      },
      {
        "name": "Critic Loop",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/55-critic-loop/",
        "summary": "第一次就返回 \"looks good\" 的 critic 是坏的。永远返回 \"needs work\" 的 critic 也是坏的。有意思的 critic 是会收敛的那个，而你必须工程化地实现这种收敛。"
      },
      {
        "name": "Iteration Scheduler",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/56-iteration-scheduler/",
        "summary": "没有 scheduler 的 research loop，就是一个带着妄想的 queue。scheduler 是 loop 决定停止探索什么的地方，而这个决定就是整场游戏的核心。"
      },
      {
        "name": "End-to-End Research Demo",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "D. Auto research",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/57-end-to-end-research-demo/",
        "summary": "Demo 是你之前写下的每一个 contract 都必须组合起来的地方。只要其中任何一个泄漏，Demo 就是抓住它的那一课。"
      },
      {
        "name": "视觉编码器 Patches",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "E. Multimodal VLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/58-vision-encoder-patches/",
        "summary": "读取像素的视觉模型需要像素分词器。补丁嵌入就是那个分词器。将图像切割成正方形网格，展平每个正方形，将其投影到一个线性层，然后添加 2D 位置信号，以便Transformer知道每个正方形在原始图像中的位置。",
        "keywords": "为什么是补丁，而不是像素 · 为什么线性投影就足够了 · `Conv2d` 技巧 · 位置嵌入 · 作为健全性检查的等效性"
      },
      {
        "name": "Vision Transformer 编码器",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "E. Multimodal VLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/59-vit-transformer/",
        "summary": "补丁单独看不到。具有 12 个注意力头的 12 层预 LN Transformer将补丁token序列转换为上下文token序列，其中 CLS token在其最终隐藏状态中池化整个图像特征。本课程是每个现代视觉语言模型的引擎室。",
        "keywords": "LN 前与 LN 后 · 多头自注意力 · 为什么要进行 4 倍前馈扩展 · 因果面具与否？ · CLS token学到了什么"
      },
      {
        "name": "用于模态对齐的投影层",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "E. Multimodal VLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/60-projection-layer-modality-align/",
        "summary": "视觉编码器生成图像token。文本解码器消耗文本token。两者生活在不同的向量空间中。一个小型的两层 MLP 将图像token投影到文本嵌入空间中，并且针对配对标题的余弦对齐损失使两个空间保持一致。该投影是视觉语言模型中最小的部分，也是对迁移最重要的部分。",
        "keywords": "投影前池化 · 为什么是两层而不是一层 · 余弦对齐损失 · 冻结编码器是窍门"
      },
      {
        "name": "Cross-Attention 融合",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "E. Multimodal VLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/61-cross-attention-fusion/",
        "summary": "投影层将一个图像向量与一个标题向量对齐。真正的视觉语言解码器需要每个文本token都参与每个补丁token，因此模型可以将每个单词放在一个区域中。交叉注意力就是这种接地的发生方式。文字查询；愿景关键和价值观给出了答案。本课构建了交叉注意力块、因果文本自注意力以及保持两者合法的掩码形状。",
        "keywords": "面具形状 · 为什么交叉注意力没有掩模 · 键/值缓存 · 块组成"
      },
      {
        "name": "视觉-语言预训练",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "E. Multimodal VLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/62-vision-language-pretraining/",
        "summary": "编码器、投影和解码器已接线。现在一起训练他们。两个目标驱动学习：对比图像文本损失（InfoNCE），将匹配对在联合嵌入空间中拉到一起，以及语言建模损失，要求解码器为每个图像添加标题。结合起来，它们教会网络找到合适的图像作为标题并为图像编写标题。",
        "keywords": "InfoNCE 在一段话中 · 温度很重要 · 语言建模损失 · 合并损失 · 为什么 50 个步骤对于演示来说就足够了"
      },
      {
        "name": "多模态评估",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "E. Multimodal VLM",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/63-multimodal-eval/",
        "summary": "培训是循环的一半。另一半是测量。本课程从基元构建三个评估表面：图像标题检索报告为 R@1、R@5、R@10；视觉问答报告为精确匹配准确度；图像字幕报告为 BLEU-4。每个指标都是模型输出的函数和在几秒钟内运行的综合评估套件。",
        "keywords": "从相似度矩阵中调用@K · VQA 精确匹配 · BLEU-4 · 综合评估套件"
      },
      {
        "name": "Chunking 策略比较",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "F. Advanced RAG",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/64-chunking-strategies-advanced/",
        "summary": "分块决定了检索器能看到什么。边界一旦错了，没有嵌入模型、重排器或 LLM 能在下游修好损坏。",
        "keywords": "固定窗口 · 句子 · 递归分割 · 语义聚类 · 结构化 Markdown 标题 · recall@k 如何衡量边界选择"
      },
      {
        "name": "BM25 与 Dense Embeddings 混合检索",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "F. Advanced RAG",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/",
        "summary": "词汇和语义检索在相反的查询分布上失败。具有倒数排名融合的混合检索不会插值，而是投票 - 并且投票在每个查询类上获胜。",
        "keywords": "BM25 一段话 · 一段中的密集检索 · 倒数秩融合，已公布的公式 · 为什么融合优于分数加权插值"
      },
      {
        "name": "Cross-Encoder Reranker",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "F. Advanced RAG",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/66-reranker-cross-encoder/",
        "summary": "双编码器独立嵌入查询和文档。交叉编码器将它们连接起来并同时读取。交叉编码器是最聪明的阅读器，也是最慢的。用作双编码器 top-k 的第二级，它本身就物有所值。",
        "keywords": "交叉编码器的输入形状 · 为什么这节课训练的是小孩子 · 延迟与质量"
      },
      {
        "name": "查询重写：HyDE、Multi-Query 与分解",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "F. Advanced RAG",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/67-query-rewriting-hyde/",
        "summary": "用户输入的查询不是您的检索器想要的查询。重写弥补了检索之前的差距，因此索引看到的内容更接近答案。",
        "keywords": "HyDE 详细信息 · 多查询扩展详解 · 详细分解 · 为什么这三个都存在"
      },
      {
        "name": "RAG 评估：Precision、Recall、MRR、nDCG、Faithfulness、Answer Relevance",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "F. Advanced RAG",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/68-rag-eval-precision-recall/",
        "summary": "如果您无法同时对检索和答案进行评分，则无法运送系统。两者不是相同的指标，并且相同的提示在不同的轴上失败。",
        "keywords": "精度@k · recall@k · MRR（平均倒数排名） · nDCG@k · 忠诚 · 答案相关性"
      },
      {
        "name": "端到端 RAG 系统",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "F. Advanced RAG",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/69-end-to-end-rag-system/",
        "summary": "组件的六课。一根管道。一个评估循环。一个自动终止的演示。这是您交付的系统。",
        "keywords": "接线选择 · 带引文的答案生成器 · 自终止演示"
      },
      {
        "name": "Task Spec 格式",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "G. Eval framework",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/70-task-spec-format/",
        "summary": "评估安全带的好坏取决于其任务履行的合同。在编写单个评分函数之前，请冻结 JSONL 形状和度量词汇。"
      },
      {
        "name": "经典指标",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "G. Eval framework",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/71-classical-metrics/",
        "summary": "BLEU、ROUGE-L、F1、精确匹配、准确率。五个指标仍然占据大多数已发布的 LLM 评估数字。从第一性原理实现每个指标，这样你才知道数字的含义。"
      },
      {
        "name": "代码执行指标",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "G. Eval framework",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/72-code-exec-metric/",
        "summary": "生成的代码通过测试后是正确的。评估工具必须提取代码，在不使主机崩溃的情况下运行它，并诚实地统计通过率。本课将构建这个表面。"
      },
      {
        "name": "Perplexity 与 Calibration",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "G. Eval framework",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/73-perplexity-calibration/",
        "summary": "如果您的模型对 1000 个答案表示有 90% 的置信度，并且正确回答了 600 个，则表明它没有经过很好的校准。校准是值得信赖的评估的一半。另一半是困惑度，它告诉你模型是否认为保留的文本是可信的。"
      },
      {
        "name": "Leaderboard 聚合",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "G. Eval framework",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/74-leaderboard-aggregation/",
        "summary": "每个任务的分数很容易。跨异构任务的每个模型排名更加困难。千人预测排行榜上的统计显着性是每个人都会跳过的部分。本课不会跳过它。"
      },
      {
        "name": "端到端 Eval Runner",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "G. Eval framework",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/75-end-to-end-eval-runner/",
        "summary": "五堂管道安装课，一堂胶水课。runner读取第 70 课中的任务规范，通过适配器调用模型，对第 71 课和第 72 课进行评分，附加第 73 课中的校准报告，并发出第 74 课中的排行榜。演示自行终止。"
      },
      {
        "name": "从零实现 Collective Ops",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "H. Distributed train",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/76-collective-ops-from-scratch/",
        "summary": "将分布式训练结合在一起的四个集体操作是allreduce、broadcast、allgather 和reduce_scatter。训练框架提供的所有其他原语都是这些原语的包装。在 `multiprocessing.Queue` 网格上构建一次它们，根据参考实现验证它们，轨道的其余部分就变成了管道。",
        "keywords": "分两遍进行 allreduce · 队列网格作为 NCCL 的替代品 · 针对 gloo 进行验证"
      },
      {
        "name": "从零实现 Data Parallel DDP",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "H. Distributed train",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/77-data-parallel-ddp/",
        "summary": "DistributedDataParallel 是 allreduce 之上的一个钩子。包装一个模型，从 0 级开始广播初始参数，这样每个等级都开始相同，在每个发出梯度 allreduce 的参数上安装一个向后钩子，剩下的就是梯度下降。整个图案有200行。",
        "keywords": "DDP需要的三个操作 · 为什么是平均值而不是总和 · 为什么要使用桶梯度 · 为什么要固定种子"
      },
      {
        "name": "ZeRO Optimizer State Sharding",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "H. Distributed train",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/78-zero-parameter-sharding/",
        "summary": "Adam 为每个参数存储两个矩估计，均以 float32 形式存储。 7B 参数模型携带 56 GB 的优化器状态。 ZeRO 第一阶段分片跨越 N 个等级；每个等级拥有 1/N 的优化器。在本地步骤之后，更新的参数分片广播回来，每个等级重建完整的模型，然后开始下一步。胜利是训练堆栈中最大的单个分配的线性内存下降。",
        "keywords": "ZeRO 的阶段 · 记忆数学，实数 · 为什么reduce_scatter 优于 allreduce-then-shard"
      },
      {
        "name": "Pipeline Parallel 与 Bubble 分析",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "H. Distributed train",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/79-pipeline-parallel/",
        "summary": "张量并行性将矩阵乘法跨等级分割。管道并行性将模型跨等级分割，每个等级一个阶段。微批次流经管道。开始和结束的空时间就是泡沫；最小化它是整个工艺。",
        "keywords": "GPipe 时间表 · 1F1B 时间表 · 为什么每个阶段的平等计算很重要 · 微批量与批量"
      },
      {
        "name": "Sharded Checkpoint 与 Atomic Resume",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "H. Distributed train",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/80-checkpoint-sharded-resume/",
        "summary": "每隔几个小时就会因节点故障而暂停 70B 参数的训练作业。检查点的形式决定了你是损失 30 分钟还是 30 小时。分片检查点并行写入每个等级的分片，并在清单中记录所有权。 Resume 从其自己的文件加载每个等级的分片，在相同的世界大小上重建状态，并且优化器就像什么都没发生一样。原子写入可以防止半完成的检查点毒害下一个恢复。",
        "keywords": "清单架构 · 原子写入 · 模式必须防御的三种故障模式 · 为什么是每个等级的文件，而不是一个大文件"
      },
      {
        "name": "端到端分布式训练",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "H. Distributed train",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/81-end-to-end-distributed-train/",
        "summary": "第 76 课到第 80 课各拼凑了一件作品。这是组件：一个在 4 个模拟队列上训练的微型 GPT，使用 DDP 进行梯度同步，ZeRO-1 用于优化器状态分片，以及中间token处的分片检查点。该演示运行 20 个步骤，自动终止，打印损失曲线和内存配置文件，并写入可恢复检查点。",
        "keywords": "迷你 GPT · 组成规则 · 为什么是小型 GPT 而不仅仅是 MLP · 自终止意味着退出 0"
      },
      {
        "name": "Jailbreak Taxonomy",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "I. Safety harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/82-jailbreak-taxonomy/",
        "summary": "没有分类的安全带就像抛硬币一样。在防御之前先命名攻击。"
      },
      {
        "name": "Prompt Injection Detector",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "I. Safety harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/83-prompt-injection-detector/",
        "summary": "检测器是从提示到置信度和类别的函数。其他的都是一种氛围。"
      },
      {
        "name": "Refusal Evaluation",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "I. Safety harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/84-refusal-evaluation/",
        "summary": "对良性提示的帮助和对有害提示的拒绝是两个指标，而不是一个指标。测量两者。"
      },
      {
        "name": "Content Classifier Integration",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "I. Safety harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/85-content-classifier-integration/",
        "summary": "输出端的分类器回答的问题与输入端的规则不同。两者都需要一个策略路由器。"
      },
      {
        "name": "Constitutional Rules Engine",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python, YAML",
        "combines": "I. Safety harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/86-constitutional-rules-engine/",
        "summary": "规则是名称、谓词和解释。缺少这三者中的任何一个都是一种氛围，而不是规则。"
      },
      {
        "name": "端到端 Safety Gate",
        "status": "complete",
        "type": "Capstone",
        "lang": "Python",
        "combines": "I. Safety harness",
        "url": "https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/phases/19-capstone-projects/87-end-to-end-safety-gate/",
        "summary": "前代、中代、后代。每个请求三个检查点、一个判决、一个审计跟踪。"
      }
    ]
  }
];

const GLOSSARY = [];

const ARTIFACTS = [
  {
    "kind": "prompt",
    "name": "prompt-env-check",
    "description": "诊断并修复 AI engineering environment setup issues",
    "tags": [],
    "phase": 0,
    "lesson": 1,
    "lessonPath": "phases/00-setup-and-tooling/01-dev-environment",
    "file": "phases/00-setup-and-tooling/01-dev-environment/outputs/prompt-env-check.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-api-troubleshooter",
    "description": "诊断并修复常见 AI API errors（auth、rate limits、timeouts）",
    "tags": [],
    "phase": 0,
    "lesson": 4,
    "lessonPath": "phases/00-setup-and-tooling/04-apis-and-keys",
    "file": "phases/00-setup-and-tooling/04-apis-and-keys/outputs/prompt-api-troubleshooter.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-notebook-helper",
    "description": "调试 Jupyter notebook 问题，包括 kernel crashes、memory problems 和 display failures",
    "tags": [],
    "phase": 0,
    "lesson": 5,
    "lessonPath": "phases/00-setup-and-tooling/05-jupyter-notebooks",
    "file": "phases/00-setup-and-tooling/05-jupyter-notebooks/outputs/prompt-notebook-helper.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-data-helper",
    "description": "为 AI/ML 任务寻找并加载合适的 dataset",
    "tags": [],
    "phase": 0,
    "lesson": 9,
    "lessonPath": "phases/00-setup-and-tooling/09-data-management",
    "file": "phases/00-setup-and-tooling/09-data-management/outputs/prompt-data-helper.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-debug-ai-code",
    "description": "诊断 AI 特有 bug，包括 NaN loss、shape 错误、training 失败和 OOM",
    "tags": [],
    "phase": 0,
    "lesson": 12,
    "lessonPath": "phases/00-setup-and-tooling/12-debugging-and-profiling",
    "file": "phases/00-setup-and-tooling/12-debugging-and-profiling/outputs/prompt-debug-ai-code.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-linear-algebra-tutor",
    "description": "通过几何直觉和 AI 应用讲授线性代数",
    "tags": [],
    "phase": 1,
    "lesson": 1,
    "lessonPath": "phases/01-math-foundations/01-linear-algebra-intuition",
    "file": "phases/01-math-foundations/01-linear-algebra-intuition/outputs/prompt-linear-algebra-tutor.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-matrix-operations",
    "description": "通过几何直觉教授 Matrix operations，把抽象数学连接到 Neural Network 机制",
    "tags": [],
    "phase": 1,
    "lesson": 2,
    "lessonPath": "phases/01-math-foundations/02-vectors-matrices-operations",
    "file": "phases/01-math-foundations/02-vectors-matrices-operations/outputs/prompt-matrix-operations.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-transformation-visualizer",
    "description": "根据 Matrix 的条目解释一个 Matrix transformation 在几何上做了什么",
    "tags": [],
    "phase": 1,
    "lesson": 3,
    "lessonPath": "phases/01-math-foundations/03-matrix-transformations",
    "file": "phases/01-math-foundations/03-matrix-transformations/outputs/prompt-transformation-visualizer.md"
  },
  {
    "kind": "skill",
    "name": "skill-gradient-computation",
    "description": "计算常见 ML Loss functions 的 Gradient，并选择合适的求导方法",
    "tags": [
      "calculus",
      "gradients",
      "backpropagation"
    ],
    "phase": 1,
    "lesson": 4,
    "lessonPath": "phases/01-math-foundations/04-calculus-for-ml",
    "file": "phases/01-math-foundations/04-calculus-for-ml/outputs/skill-gradient-computation.md"
  },
  {
    "kind": "skill",
    "name": "skill-autodiff",
    "description": "构建、调试并推理 automatic differentiation 系统",
    "tags": [],
    "phase": 1,
    "lesson": 5,
    "lessonPath": "phases/01-math-foundations/05-chain-rule-and-autodiff",
    "file": "phases/01-math-foundations/05-chain-rule-and-autodiff/outputs/skill-autodiff.md"
  },
  {
    "kind": "skill",
    "name": "skill-probability-reasoning",
    "description": "为给定的 ML 问题选择合适的概率分布",
    "tags": [
      "probability",
      "distributions",
      "modeling"
    ],
    "phase": 1,
    "lesson": 6,
    "lessonPath": "phases/01-math-foundations/06-probability-and-distributions",
    "file": "phases/01-math-foundations/06-probability-and-distributions/outputs/skill-probability-reasoning.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-bayesian-reasoning",
    "description": "针对任意场景逐步演示 Bayesian reasoning",
    "tags": [],
    "phase": 1,
    "lesson": 7,
    "lessonPath": "phases/01-math-foundations/07-bayes-theorem",
    "file": "phases/01-math-foundations/07-bayes-theorem/outputs/prompt-bayesian-reasoning.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-optimizer-guide",
    "description": "指导用户为其具体的 Machine Learning 问题选择合适的 Optimizer",
    "tags": [],
    "phase": 1,
    "lesson": 8,
    "lessonPath": "phases/01-math-foundations/08-optimization",
    "file": "phases/01-math-foundations/08-optimization/outputs/prompt-optimizer-guide.md"
  },
  {
    "kind": "skill",
    "name": "skill-information-theory",
    "description": "将信息论概念应用于 ML Loss function、模型评估和特征选择",
    "tags": [
      "information-theory",
      "entropy",
      "loss-functions"
    ],
    "phase": 1,
    "lesson": 9,
    "lessonPath": "phases/01-math-foundations/09-information-theory",
    "file": "phases/01-math-foundations/09-information-theory/outputs/skill-information-theory.md"
  },
  {
    "kind": "skill",
    "name": "skill-dimensionality-reduction",
    "description": "根据数据规模、目标和下游用途，为给定任务选择合适的降维技术",
    "tags": [],
    "phase": 1,
    "lesson": 10,
    "lessonPath": "phases/01-math-foundations/10-dimensionality-reduction",
    "file": "phases/01-math-foundations/10-dimensionality-reduction/outputs/skill-dimensionality-reduction.md"
  },
  {
    "kind": "skill",
    "name": "skill-svd",
    "description": "将 SVD 应用于实际问题，包括压缩、去噪、推荐和 least-squares 求解",
    "tags": [],
    "phase": 1,
    "lesson": 11,
    "lessonPath": "phases/01-math-foundations/11-singular-value-decomposition",
    "file": "phases/01-math-foundations/11-singular-value-decomposition/outputs/skill-svd.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tensor-debugger",
    "description": "用于调试 Deep Learning 代码中 tensor shape 错误的逐步 prompt",
    "tags": [],
    "phase": 1,
    "lesson": 12,
    "lessonPath": "phases/01-math-foundations/12-tensor-operations",
    "file": "phases/01-math-foundations/12-tensor-operations/outputs/prompt-tensor-debugger.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tensor-shapes",
    "description": "调试 tensor shape 不匹配，并为常见 Deep Learning 操作推荐修复方案",
    "tags": [],
    "phase": 1,
    "lesson": 12,
    "lessonPath": "phases/01-math-foundations/12-tensor-operations",
    "file": "phases/01-math-foundations/12-tensor-operations/outputs/prompt-tensor-shapes.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-numerical-debugger",
    "description": "诊断 neural network 训练中的 NaN、Inf 和数值稳定性问题",
    "tags": [],
    "phase": 1,
    "lesson": 13,
    "lessonPath": "phases/01-math-foundations/13-numerical-stability",
    "file": "phases/01-math-foundations/13-numerical-stability/outputs/prompt-numerical-debugger.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-distance-chooser",
    "description": "引导用户为其具体任务选择合适的距离度量",
    "tags": [],
    "phase": 1,
    "lesson": 14,
    "lessonPath": "phases/01-math-foundations/14-norms-and-distances",
    "file": "phases/01-math-foundations/14-norms-and-distances/outputs/prompt-distance-chooser.md"
  },
  {
    "kind": "skill",
    "name": "skill-statistical-testing",
    "description": "为比较 ML 模型和评估实验选择正确的统计检验",
    "tags": [
      "statistics",
      "hypothesis-testing",
      "model-comparison"
    ],
    "phase": 1,
    "lesson": 15,
    "lessonPath": "phases/01-math-foundations/15-statistics-for-ml",
    "file": "phases/01-math-foundations/15-statistics-for-ml/outputs/skill-statistical-testing.md"
  },
  {
    "kind": "skill",
    "name": "skill-sampling-strategy",
    "description": "为 generation、estimation 或 inference 选择合适的 sampling 方法",
    "tags": [
      "sampling",
      "mcmc",
      "generation"
    ],
    "phase": 1,
    "lesson": 16,
    "lessonPath": "phases/01-math-foundations/16-sampling-methods",
    "file": "phases/01-math-foundations/16-sampling-methods/outputs/skill-sampling-strategy.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-linear-solver",
    "description": "根据 Matrix 属性推荐求解 linear system Ax=b 的合适算法",
    "tags": [],
    "phase": 1,
    "lesson": 17,
    "lessonPath": "phases/01-math-foundations/17-linear-systems",
    "file": "phases/01-math-foundations/17-linear-systems/outputs/prompt-linear-solver.md"
  },
  {
    "kind": "skill",
    "name": "skill-convexity-checker",
    "description": "判断一个优化问题是否为凸问题，并选择合适的 solver",
    "tags": [
      "optimization",
      "convexity",
      "solvers"
    ],
    "phase": 1,
    "lesson": 18,
    "lessonPath": "phases/01-math-foundations/18-convex-optimization",
    "file": "phases/01-math-foundations/18-convex-optimization/outputs/skill-convexity-checker.md"
  },
  {
    "kind": "skill",
    "name": "skill-complex-arithmetic",
    "description": "ML 和信号处理场景中复数运算的快速参考",
    "tags": [],
    "phase": 1,
    "lesson": 19,
    "lessonPath": "phases/01-math-foundations/19-complex-numbers",
    "file": "phases/01-math-foundations/19-complex-numbers/outputs/skill-complex-arithmetic.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-spectral-analyzer",
    "description": "指导使用 Fourier transform 技术分析信号中的频率内容",
    "tags": [],
    "phase": 1,
    "lesson": 20,
    "lessonPath": "phases/01-math-foundations/20-fourier-transform",
    "file": "phases/01-math-foundations/20-fourier-transform/outputs/prompt-spectral-analyzer.md"
  },
  {
    "kind": "skill",
    "name": "skill-graph-analysis",
    "description": "分析图结构数据，并为 ML 任务选择合适的图算法",
    "tags": [],
    "phase": 1,
    "lesson": 21,
    "lessonPath": "phases/01-math-foundations/21-graph-theory",
    "file": "phases/01-math-foundations/21-graph-theory/outputs/skill-graph-analysis.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-stochastic-process-advisor",
    "description": "识别给定问题适用的 stochastic process framework，并推荐实现方案",
    "tags": [],
    "phase": 1,
    "lesson": 22,
    "lessonPath": "phases/01-math-foundations/22-stochastic-processes",
    "file": "phases/01-math-foundations/22-stochastic-processes/outputs/prompt-stochastic-process-advisor.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-ml-problem-framer",
    "description": "将真实业务问题表述为 ML 任务",
    "tags": [],
    "phase": 2,
    "lesson": 1,
    "lessonPath": "phases/02-ml-fundamentals/01-what-is-machine-learning",
    "file": "phases/02-ml-fundamentals/01-what-is-machine-learning/outputs/prompt-ml-problem-framer.md"
  },
  {
    "kind": "skill",
    "name": "skill-regression",
    "description": "根据数据特征和问题约束选择合适的 Regression 方法",
    "tags": [
      "regression",
      "linear-regression",
      "polynomial-regression",
      "ridge",
      "regularization"
    ],
    "phase": 2,
    "lesson": 2,
    "lessonPath": "phases/02-ml-fundamentals/02-linear-regression",
    "file": "phases/02-ml-fundamentals/02-linear-regression/outputs/skill-regression.md"
  },
  {
    "kind": "skill",
    "name": "skill-classification-baseline",
    "description": "在使用复杂模型之前，建立一个强 Classification baseline",
    "tags": [
      "classification",
      "logistic-regression",
      "baseline",
      "preprocessing"
    ],
    "phase": 2,
    "lesson": 3,
    "lessonPath": "phases/02-ml-fundamentals/03-logistic-regression",
    "file": "phases/02-ml-fundamentals/03-logistic-regression/outputs/skill-classification-baseline.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tree-interpreter",
    "description": "解读 decision tree 结果并诊断潜在问题",
    "tags": [],
    "phase": 2,
    "lesson": 4,
    "lessonPath": "phases/02-ml-fundamentals/04-decision-trees",
    "file": "phases/02-ml-fundamentals/04-decision-trees/outputs/prompt-tree-interpreter.md"
  },
  {
    "kind": "skill",
    "name": "skill-svm-kernel-chooser",
    "description": "为你的问题选择合适的 SVM kernel，并调优 C 和 gamma",
    "tags": [
      "svm",
      "kernel",
      "classification",
      "hyperparameter-tuning"
    ],
    "phase": 2,
    "lesson": 5,
    "lessonPath": "phases/02-ml-fundamentals/05-support-vector-machines",
    "file": "phases/02-ml-fundamentals/05-support-vector-machines/outputs/skill-svm-kernel-chooser.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-distance-metric-advisor",
    "description": "根据数据类型和问题特征推荐合适的距离度量",
    "tags": [],
    "phase": 2,
    "lesson": 6,
    "lessonPath": "phases/02-ml-fundamentals/06-knn-and-distances",
    "file": "phases/02-ml-fundamentals/06-knn-and-distances/outputs/prompt-distance-metric-advisor.md"
  },
  {
    "kind": "skill",
    "name": "skill-clustering-guide",
    "description": "根据 data shape、noise 和约束选择合适的 Clustering algorithm",
    "tags": [
      "clustering",
      "k-means",
      "dbscan",
      "hierarchical",
      "gmm",
      "unsupervised"
    ],
    "phase": 2,
    "lesson": 7,
    "lessonPath": "phases/02-ml-fundamentals/07-unsupervised-learning",
    "file": "phases/02-ml-fundamentals/07-unsupervised-learning/outputs/skill-clustering-guide.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-feature-engineer",
    "description": "用于从原始表格数据工程化 feature 的系统化 prompt",
    "tags": [],
    "phase": 2,
    "lesson": 8,
    "lessonPath": "phases/02-ml-fundamentals/08-feature-engineering",
    "file": "phases/02-ml-fundamentals/08-feature-engineering/outputs/prompt-feature-engineer.md"
  },
  {
    "kind": "skill",
    "name": "skill-evaluation",
    "description": "Classification 和 Regression models 的 Evaluation 策略检查清单",
    "tags": [
      "evaluation",
      "metrics",
      "cross-validation",
      "model-selection"
    ],
    "phase": 2,
    "lesson": 9,
    "lessonPath": "phases/02-ml-fundamentals/09-model-evaluation",
    "file": "phases/02-ml-fundamentals/09-model-evaluation/outputs/skill-evaluation.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-model-diagnostics",
    "description": "使用 train/test metrics 和 learning curves 诊断模型性能问题",
    "tags": [],
    "phase": 2,
    "lesson": 10,
    "lessonPath": "phases/02-ml-fundamentals/10-bias-variance",
    "file": "phases/02-ml-fundamentals/10-bias-variance/outputs/prompt-model-diagnostics.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-ensemble-selector",
    "description": "为给定 dataset 和 problem 选择合适的 ensemble method",
    "tags": [],
    "phase": 2,
    "lesson": 11,
    "lessonPath": "phases/02-ml-fundamentals/11-ensemble-methods",
    "file": "phases/02-ml-fundamentals/11-ensemble-methods/outputs/prompt-ensemble-selector.md"
  },
  {
    "kind": "skill",
    "name": "skill-ensemble-builder",
    "description": "为你的 problem 选择合适的 ensemble method 并完成配置",
    "tags": [
      "ensemble",
      "bagging",
      "boosting",
      "random-forest",
      "xgboost",
      "stacking"
    ],
    "phase": 2,
    "lesson": 11,
    "lessonPath": "phases/02-ml-fundamentals/11-ensemble-methods",
    "file": "phases/02-ml-fundamentals/11-ensemble-methods/outputs/skill-ensemble-builder.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tuning-strategy",
    "description": "基于 model type、data size 和 compute budget 推荐 hyperparameter tuning strategy",
    "tags": [],
    "phase": 2,
    "lesson": 12,
    "lessonPath": "phases/02-ml-fundamentals/12-hyperparameter-tuning",
    "file": "phases/02-ml-fundamentals/12-hyperparameter-tuning/outputs/prompt-tuning-strategy.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-ml-pipeline",
    "description": "构建、调试和部署可复现的 ML pipelines",
    "tags": [],
    "phase": 2,
    "lesson": 13,
    "lessonPath": "phases/02-ml-fundamentals/13-ml-pipelines",
    "file": "phases/02-ml-fundamentals/13-ml-pipelines/outputs/prompt-ml-pipeline.md"
  },
  {
    "kind": "skill",
    "name": "skill-naive-bayes-chooser",
    "description": "为你的 Classification 任务选择正确的 Naive Bayes 变体",
    "tags": [],
    "phase": 2,
    "lesson": 14,
    "lessonPath": "phases/02-ml-fundamentals/14-naive-bayes",
    "file": "phases/02-ml-fundamentals/14-naive-bayes/outputs/skill-naive-bayes-chooser.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-time-series-advisor",
    "description": "框定时间序列问题并推荐方法",
    "tags": [],
    "phase": 2,
    "lesson": 15,
    "lessonPath": "phases/02-ml-fundamentals/15-time-series",
    "file": "phases/02-ml-fundamentals/15-time-series/outputs/prompt-time-series-advisor.md"
  },
  {
    "kind": "skill",
    "name": "skill-anomaly-detector",
    "description": "为你的问题选择合适的异常检测方法",
    "tags": [],
    "phase": 2,
    "lesson": 16,
    "lessonPath": "phases/02-ml-fundamentals/16-anomaly-detection",
    "file": "phases/02-ml-fundamentals/16-anomaly-detection/outputs/skill-anomaly-detector.md"
  },
  {
    "kind": "skill",
    "name": "skill-imbalanced-data",
    "description": "处理不平衡 Classification 问题的决策检查清单",
    "tags": [
      "imbalanced-data",
      "smote",
      "class-weights",
      "threshold-tuning",
      "evaluation"
    ],
    "phase": 2,
    "lesson": 17,
    "lessonPath": "phases/02-ml-fundamentals/17-imbalanced-data",
    "file": "phases/02-ml-fundamentals/17-imbalanced-data/outputs/skill-imbalanced-data.md"
  },
  {
    "kind": "skill",
    "name": "skill-feature-selector",
    "description": "用于选择合适 feature selection 方法的快速参考 decision tree",
    "tags": [
      "feature-selection",
      "mutual-information",
      "rfe",
      "lasso",
      "tree-importance"
    ],
    "phase": 2,
    "lesson": 18,
    "lessonPath": "phases/02-ml-fundamentals/18-feature-selection",
    "file": "phases/02-ml-fundamentals/18-feature-selection/outputs/skill-feature-selector.md"
  },
  {
    "kind": "skill",
    "name": "skill-perceptron",
    "description": "理解 perceptron 模式，以及何时使用 single-layer 与 multi-layer 架构",
    "tags": [
      "perceptron",
      "neural-networks",
      "classification",
      "deep-learning"
    ],
    "phase": 3,
    "lesson": 1,
    "lessonPath": "phases/03-deep-learning-core/01-the-perceptron",
    "file": "phases/03-deep-learning-core/01-the-perceptron/outputs/skill-perceptron.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-network-architect",
    "description": "引导用户为给定问题选择层数、每层神经元数量和激活函数，从而设计 Neural Network 架构",
    "tags": [],
    "phase": 3,
    "lesson": 2,
    "lessonPath": "phases/03-deep-learning-core/02-multi-layer-networks",
    "file": "phases/03-deep-learning-core/02-multi-layer-networks/outputs/prompt-network-architect.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-gradient-debugger",
    "description": "诊断并修复 Neural Network 中的 Gradient 问题 -- vanishing gradients、exploding gradients 和 NaN 值",
    "tags": [],
    "phase": 3,
    "lesson": 3,
    "lessonPath": "phases/03-deep-learning-core/03-backpropagation",
    "file": "phases/03-deep-learning-core/03-backpropagation/outputs/prompt-gradient-debugger.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-activation-selector",
    "description": "用于为任何 Neural Network 架构选择合适激活函数的决策 prompt",
    "tags": [],
    "phase": 3,
    "lesson": 4,
    "lessonPath": "phases/03-deep-learning-core/04-activation-functions",
    "file": "phases/03-deep-learning-core/04-activation-functions/outputs/prompt-activation-selector.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-loss-debugger",
    "description": "用于调试 Loss 曲线和训练失败的诊断 prompt",
    "tags": [],
    "phase": 3,
    "lesson": 5,
    "lessonPath": "phases/03-deep-learning-core/05-loss-functions",
    "file": "phases/03-deep-learning-core/05-loss-functions/outputs/prompt-loss-debugger.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-loss-function-selector",
    "description": "用于为任何 ML 任务选择合适 Loss Function 的决策 prompt",
    "tags": [],
    "phase": 3,
    "lesson": 5,
    "lessonPath": "phases/03-deep-learning-core/05-loss-functions",
    "file": "phases/03-deep-learning-core/05-loss-functions/outputs/prompt-loss-function-selector.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-optimizer-selector",
    "description": "用于为任何 architecture 选择合适 Optimizer 和 learning rate 的决策 prompt",
    "tags": [],
    "phase": 3,
    "lesson": 6,
    "lessonPath": "phases/03-deep-learning-core/06-optimizers",
    "file": "phases/03-deep-learning-core/06-optimizers/outputs/prompt-optimizer-selector.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-regularization-advisor",
    "description": "一个诊断型 prompt，用于根据 overfitting 症状选择 regularization 策略",
    "tags": [],
    "phase": 3,
    "lesson": 7,
    "lessonPath": "phases/03-deep-learning-core/07-regularization",
    "file": "phases/03-deep-learning-core/07-regularization/outputs/prompt-regularization-advisor.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-init-strategy",
    "description": "诊断权重初始化问题，并为任何 Neural Network 架构推荐正确策略",
    "tags": [],
    "phase": 3,
    "lesson": 8,
    "lessonPath": "phases/03-deep-learning-core/08-weight-initialization",
    "file": "phases/03-deep-learning-core/08-weight-initialization/outputs/prompt-init-strategy.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-lr-schedule-advisor",
    "description": "为任何训练设置推荐合适的 learning rate schedule 和超参数",
    "tags": [],
    "phase": 3,
    "lesson": 9,
    "lessonPath": "phases/03-deep-learning-core/09-learning-rate-schedules",
    "file": "phases/03-deep-learning-core/09-learning-rate-schedules/outputs/prompt-lr-schedule-advisor.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-framework-architect",
    "description": "使用 framework abstractions 设计 Neural Network architectures -- modules、containers、losses 和 optimizers",
    "tags": [],
    "phase": 3,
    "lesson": 10,
    "lessonPath": "phases/03-deep-learning-core/10-mini-framework",
    "file": "phases/03-deep-learning-core/10-mini-framework/outputs/prompt-framework-architect.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-pytorch-debugger",
    "description": "根据症状诊断并修复常见的 PyTorch 训练失败",
    "tags": [],
    "phase": 3,
    "lesson": 11,
    "lessonPath": "phases/03-deep-learning-core/11-intro-to-pytorch",
    "file": "phases/03-deep-learning-core/11-intro-to-pytorch/outputs/prompt-pytorch-debugger.md"
  },
  {
    "kind": "skill",
    "name": "skill-pytorch-patterns",
    "description": "PyTorch 训练、评估和部署的参考模式",
    "tags": [
      "pytorch",
      "training",
      "deep-learning",
      "gpu",
      "patterns"
    ],
    "phase": 3,
    "lesson": 11,
    "lessonPath": "phases/03-deep-learning-core/11-intro-to-pytorch",
    "file": "phases/03-deep-learning-core/11-intro-to-pytorch/outputs/skill-pytorch-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-jax-optimizer",
    "description": "为给定训练场景选择并配置合适的 JAX/Optax Optimizer",
    "tags": [],
    "phase": 3,
    "lesson": 12,
    "lessonPath": "phases/03-deep-learning-core/12-intro-to-jax",
    "file": "phases/03-deep-learning-core/12-intro-to-jax/outputs/prompt-jax-optimizer.md"
  },
  {
    "kind": "skill",
    "name": "skill-jax-patterns",
    "description": "JAX 中的函数式编程模式 -- 何时以及如何使用 grad、jit、vmap 和 pmap",
    "tags": [
      "jax",
      "functional-programming",
      "autodiff",
      "compilation",
      "vectorization"
    ],
    "phase": 3,
    "lesson": 12,
    "lessonPath": "phases/03-deep-learning-core/12-intro-to-jax",
    "file": "phases/03-deep-learning-core/12-intro-to-jax/outputs/skill-jax-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-nn-debugger",
    "description": "根据症状诊断 Neural Network 训练失败 -- Loss 曲线、Gradient 统计和激活模式",
    "tags": [],
    "phase": 3,
    "lesson": 13,
    "lessonPath": "phases/03-deep-learning-core/13-debugging-neural-networks",
    "file": "phases/03-deep-learning-core/13-debugging-neural-networks/outputs/prompt-nn-debugger.md"
  },
  {
    "kind": "skill",
    "name": "skill-debug-checklist",
    "description": "用于调试 Neural Network training 失败的决策树清单",
    "tags": [
      "debugging",
      "neural-networks",
      "training",
      "diagnostics",
      "deep-learning"
    ],
    "phase": 3,
    "lesson": 13,
    "lessonPath": "phases/03-deep-learning-core/13-debugging-neural-networks",
    "file": "phases/03-deep-learning-core/13-debugging-neural-networks/outputs/skill-debug-checklist.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-vision-preprocessing-audit",
    "description": "将任何 model card 或 dataset card 转换为 vision pipeline 必须遵守的 preprocessing invariants checklist",
    "tags": [],
    "phase": 4,
    "lesson": 1,
    "lessonPath": "phases/04-computer-vision/01-image-fundamentals",
    "file": "phases/04-computer-vision/01-image-fundamentals/outputs/prompt-vision-preprocessing-audit.md"
  },
  {
    "kind": "skill",
    "name": "skill-image-tensor-inspector",
    "description": "检查任何 image-shaped tensor 或 array，并报告 dtype、layout、range，以及它看起来是 raw、normalized 还是 standardized",
    "tags": [
      "computer-vision",
      "debugging",
      "preprocessing",
      "tensors"
    ],
    "phase": 4,
    "lesson": 1,
    "lessonPath": "phases/04-computer-vision/01-image-fundamentals",
    "file": "phases/04-computer-vision/01-image-fundamentals/outputs/skill-image-tensor-inspector.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-cnn-architect",
    "description": "根据 input size、parameter budget 和 target receptive field 设计一组 Conv2d layers",
    "tags": [],
    "phase": 4,
    "lesson": 2,
    "lessonPath": "phases/04-computer-vision/02-convolutions-from-scratch",
    "file": "phases/04-computer-vision/02-convolutions-from-scratch/outputs/prompt-cnn-architect.md"
  },
  {
    "kind": "skill",
    "name": "skill-conv-shape-calculator",
    "description": "逐层遍历 CNN 规格，并报告每个 block 的输出形状、感受野和参数量",
    "tags": [
      "computer-vision",
      "cnn",
      "architecture",
      "debugging"
    ],
    "phase": 4,
    "lesson": 2,
    "lessonPath": "phases/04-computer-vision/02-convolutions-from-scratch",
    "file": "phases/04-computer-vision/02-convolutions-from-scratch/outputs/skill-conv-shape-calculator.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-backbone-selector",
    "description": "根据给定任务、数据集规模和计算预算，选择合适的 vision backbone（LeNet、VGG、ResNet、MobileNet、EfficientNet-Lite、ConvNeXt、ViT）",
    "tags": [],
    "phase": 4,
    "lesson": 3,
    "lessonPath": "phases/04-computer-vision/03-cnns-lenet-to-resnet",
    "file": "phases/04-computer-vision/03-cnns-lenet-to-resnet/outputs/prompt-backbone-selector.md"
  },
  {
    "kind": "skill",
    "name": "skill-residual-block-reviewer",
    "description": "审查 PyTorch residual block 的 skip-connection 正确性、BN 位置、activation 顺序和 shape 对齐",
    "tags": [
      "computer-vision",
      "resnet",
      "code-review",
      "pytorch"
    ],
    "phase": 4,
    "lesson": 3,
    "lessonPath": "phases/04-computer-vision/03-cnns-lenet-to-resnet",
    "file": "phases/04-computer-vision/03-cnns-lenet-to-resnet/outputs/skill-residual-block-reviewer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-classifier-pipeline-auditor",
    "description": "审计 PyTorch image classification training script，检查覆盖大多数 silent bugs 的五个 invariants",
    "tags": [],
    "phase": 4,
    "lesson": 4,
    "lessonPath": "phases/04-computer-vision/04-image-classification",
    "file": "phases/04-computer-vision/04-image-classification/outputs/prompt-classifier-pipeline-auditor.md"
  },
  {
    "kind": "skill",
    "name": "skill-classification-diagnostics",
    "description": "给定一个 confusion matrix 和 class names，呈现每个 class 的失败情况，并提出单个影响最大的修复方案",
    "tags": [
      "computer-vision",
      "classification",
      "evaluation",
      "debugging"
    ],
    "phase": 4,
    "lesson": 4,
    "lessonPath": "phases/04-computer-vision/04-image-classification",
    "file": "phases/04-computer-vision/04-image-classification/outputs/skill-classification-diagnostics.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-fine-tune-planner",
    "description": "根据 dataset size、domain distance 和 compute budget 选择 feature extraction、progressive 或 end-to-end fine-tuning",
    "tags": [],
    "phase": 4,
    "lesson": 5,
    "lessonPath": "phases/04-computer-vision/05-transfer-learning",
    "file": "phases/04-computer-vision/05-transfer-learning/outputs/prompt-fine-tune-planner.md"
  },
  {
    "kind": "skill",
    "name": "skill-freeze-inspector",
    "description": "报告哪些 parameters 是 trainable、哪些 BatchNorm layers 处于 eval mode，以及 optimizer 是否真的在使用 trainable parameters",
    "tags": [
      "computer-vision",
      "transfer-learning",
      "debugging",
      "pytorch"
    ],
    "phase": 4,
    "lesson": 5,
    "lessonPath": "phases/04-computer-vision/05-transfer-learning",
    "file": "phases/04-computer-vision/05-transfer-learning/outputs/skill-freeze-inspector.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-detection-metric-reader",
    "description": "将 precision/recall/AP/mAP 行转换成一行诊断和一个最有用的下一步实验",
    "tags": [],
    "phase": 4,
    "lesson": 6,
    "lessonPath": "phases/04-computer-vision/06-object-detection-yolo",
    "file": "phases/04-computer-vision/06-object-detection-yolo/outputs/prompt-detection-metric-reader.md"
  },
  {
    "kind": "skill",
    "name": "skill-anchor-designer",
    "description": "给定一个 ground-truth box 数据集，对 (w, h) 运行 k-means，并返回每个 FPN level 的 anchor sets 以及 coverage statistics",
    "tags": [
      "computer-vision",
      "detection",
      "anchors",
      "kmeans"
    ],
    "phase": 4,
    "lesson": 6,
    "lessonPath": "phases/04-computer-vision/06-object-detection-yolo",
    "file": "phases/04-computer-vision/06-object-detection-yolo/outputs/skill-anchor-designer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-segmentation-task-picker",
    "description": "为给定任务选择 semantic vs instance vs panoptic segmentation，并命名架构",
    "tags": [],
    "phase": 4,
    "lesson": 7,
    "lessonPath": "phases/04-computer-vision/07-semantic-segmentation-unet",
    "file": "phases/04-computer-vision/07-semantic-segmentation-unet/outputs/prompt-segmentation-task-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-segmentation-mask-inspector",
    "description": "报告类别分布、预测 mask 统计信息，以及最可能被低估预测或边界模糊的类别",
    "tags": [
      "computer-vision",
      "segmentation",
      "debugging",
      "evaluation"
    ],
    "phase": 4,
    "lesson": 7,
    "lessonPath": "phases/04-computer-vision/07-semantic-segmentation-unet",
    "file": "phases/04-computer-vision/07-semantic-segmentation-unet/outputs/skill-segmentation-mask-inspector.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-instance-vs-semantic-router",
    "description": "询问三个问题，并选择 instance vs semantic vs panoptic segmentation 以及第一个模型",
    "tags": [],
    "phase": 4,
    "lesson": 8,
    "lessonPath": "phases/04-computer-vision/08-instance-segmentation-mask-rcnn",
    "file": "phases/04-computer-vision/08-instance-segmentation-mask-rcnn/outputs/prompt-instance-vs-semantic-router.md"
  },
  {
    "kind": "skill",
    "name": "skill-mask-rcnn-head-swapper",
    "description": "为自定义 num_classes 生成在 torchvision Mask R-CNN 上替换 box 和 mask heads 的精确代码",
    "tags": [
      "computer-vision",
      "mask-rcnn",
      "fine-tuning",
      "torchvision"
    ],
    "phase": 4,
    "lesson": 8,
    "lessonPath": "phases/04-computer-vision/08-instance-segmentation-mask-rcnn",
    "file": "phases/04-computer-vision/08-instance-segmentation-mask-rcnn/outputs/skill-mask-rcnn-head-swapper.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-gan-training-triage",
    "description": "读取 GAN 训练曲线的描述，并选择 failure mode 以及唯一推荐 fix",
    "tags": [],
    "phase": 4,
    "lesson": 9,
    "lessonPath": "phases/04-computer-vision/09-image-generation-gans",
    "file": "phases/04-computer-vision/09-image-generation-gans/outputs/prompt-gan-training-triage.md"
  },
  {
    "kind": "skill",
    "name": "skill-dcgan-scaffold",
    "description": "根据 z_dim、image_size 和 num_channels 编写完整 DCGAN scaffold，包括 training loop 和 sample saver",
    "tags": [
      "computer-vision",
      "gan",
      "dcgan",
      "scaffolding"
    ],
    "phase": 4,
    "lesson": 9,
    "lessonPath": "phases/04-computer-vision/09-image-generation-gans",
    "file": "phases/04-computer-vision/09-image-generation-gans/outputs/skill-dcgan-scaffold.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-diffusion-sampler-picker",
    "description": "根据 quality target、latency budget 和 conditioning type 选择 DDPM、DDIM、DPM-Solver++ 或 Euler ancestral",
    "tags": [],
    "phase": 4,
    "lesson": 10,
    "lessonPath": "phases/04-computer-vision/10-image-generation-diffusion",
    "file": "phases/04-computer-vision/10-image-generation-diffusion/outputs/prompt-diffusion-sampler-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-noise-schedule-designer",
    "description": "根据 T 和目标损坏程度生成 linear、cosine 或 sigmoid beta schedule，并提供 SNR plot",
    "tags": [
      "computer-vision",
      "diffusion",
      "noise-schedule",
      "training"
    ],
    "phase": 4,
    "lesson": 10,
    "lessonPath": "phases/04-computer-vision/10-image-generation-diffusion",
    "file": "phases/04-computer-vision/10-image-generation-diffusion/outputs/skill-noise-schedule-designer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-sd-pipeline-planner",
    "description": "在给定 latency budget、fidelity target 和 licensing constraint 时，选择 SD 1.5 / SDXL / SD3 / FLUX 以及 scheduler 和 precision",
    "tags": [],
    "phase": 4,
    "lesson": 11,
    "lessonPath": "phases/04-computer-vision/11-stable-diffusion",
    "file": "phases/04-computer-vision/11-stable-diffusion/outputs/prompt-sd-pipeline-planner.md"
  },
  {
    "kind": "skill",
    "name": "skill-lora-training-setup",
    "description": "为 custom dataset 编写完整 LoRA training config，包括 captions、rank、batch size 和 learning rate",
    "tags": [
      "computer-vision",
      "stable-diffusion",
      "lora",
      "fine-tuning"
    ],
    "phase": 4,
    "lesson": 11,
    "lessonPath": "phases/04-computer-vision/11-stable-diffusion",
    "file": "phases/04-computer-vision/11-stable-diffusion/outputs/skill-lora-training-setup.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-video-architecture-picker",
    "description": "基于 appearance-vs-motion、dataset size 和 compute budget 选择 2D+pool / I3D / (2+1)D / spatio-temporal transformer",
    "tags": [],
    "phase": 4,
    "lesson": 12,
    "lessonPath": "phases/04-computer-vision/12-video-understanding",
    "file": "phases/04-computer-vision/12-video-understanding/outputs/prompt-video-architecture-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-frame-sampler-auditor",
    "description": "审计视频 pipeline 的 frame sampler，检查 off-by-one、短 clip 处理和 crop 一致性",
    "tags": [
      "computer-vision",
      "video",
      "sampling",
      "debugging"
    ],
    "phase": 4,
    "lesson": 12,
    "lessonPath": "phases/04-computer-vision/12-video-understanding",
    "file": "phases/04-computer-vision/12-video-understanding/outputs/skill-frame-sampler-auditor.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-3d-task-router",
    "description": "基于 task 和 input 路由到合适的 3D representation（point cloud、mesh、voxel、NeRF、Gaussian splat）",
    "tags": [],
    "phase": 4,
    "lesson": 13,
    "lessonPath": "phases/04-computer-vision/13-3d-vision-nerf",
    "file": "phases/04-computer-vision/13-3d-vision-nerf/outputs/prompt-3d-task-router.md"
  },
  {
    "kind": "skill",
    "name": "skill-point-cloud-loader",
    "description": "为 .ply / .pcd / .xyz 文件编写 PyTorch Dataset，包含正确的 normalisation、centring 和 point sampling",
    "tags": [
      "3d-vision",
      "point-cloud",
      "data-loading",
      "pytorch"
    ],
    "phase": 4,
    "lesson": 13,
    "lessonPath": "phases/04-computer-vision/13-3d-vision-nerf",
    "file": "phases/04-computer-vision/13-3d-vision-nerf/outputs/skill-point-cloud-loader.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-vit-vs-cnn-picker",
    "description": "基于 dataset size、compute 和 inference stack 在 ViT、ConvNeXt 或 Swin 之间选择",
    "tags": [],
    "phase": 4,
    "lesson": 14,
    "lessonPath": "phases/04-computer-vision/14-vision-transformers",
    "file": "phases/04-computer-vision/14-vision-transformers/outputs/prompt-vit-vs-cnn-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-vit-patch-and-pos-embed-inspector",
    "description": "验证 ViT 的 patch embedding 和 positional embedding shape 是否与模型预期的序列长度匹配",
    "tags": [
      "vision-transformer",
      "debugging",
      "pytorch"
    ],
    "phase": 4,
    "lesson": 14,
    "lessonPath": "phases/04-computer-vision/14-vision-transformers",
    "file": "phases/04-computer-vision/14-vision-transformers/outputs/skill-vit-patch-and-pos-embed-inspector.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-edge-deployment-planner",
    "description": "根据目标设备和延迟 SLA 选择 backbone、quantisation 策略和 runtime",
    "tags": [],
    "phase": 4,
    "lesson": 15,
    "lessonPath": "phases/04-computer-vision/15-real-time-edge",
    "file": "phases/04-computer-vision/15-real-time-edge/outputs/prompt-edge-deployment-planner.md"
  },
  {
    "kind": "skill",
    "name": "skill-latency-profiler",
    "description": "编写完整的延迟 benchmark 脚本，包含 warmup、synchronisation、percentiles 和内存跟踪",
    "tags": [
      "edge",
      "deployment",
      "profiling",
      "benchmarking"
    ],
    "phase": 4,
    "lesson": 15,
    "lessonPath": "phases/04-computer-vision/15-real-time-edge",
    "file": "phases/04-computer-vision/15-real-time-edge/outputs/skill-latency-profiler.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-vision-service-shape-reviewer",
    "description": "审查 vision service 的代码是否违反 contract/response shape，并指出第一个 breaking bug",
    "tags": [],
    "phase": 4,
    "lesson": 16,
    "lessonPath": "phases/04-computer-vision/16-vision-pipeline-capstone",
    "file": "phases/04-computer-vision/16-vision-pipeline-capstone/outputs/prompt-vision-service-shape-reviewer.md"
  },
  {
    "kind": "skill",
    "name": "skill-pipeline-budget-planner",
    "description": "给定目标延迟和吞吐量，为每个 pipeline 阶段分配时间预算，并标记哪个阶段会最先超出预算",
    "tags": [
      "vision",
      "pipeline",
      "performance",
      "deployment"
    ],
    "phase": 4,
    "lesson": 16,
    "lessonPath": "phases/04-computer-vision/16-vision-pipeline-capstone",
    "file": "phases/04-computer-vision/16-vision-pipeline-capstone/outputs/skill-pipeline-budget-planner.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-ssl-pretraining-picker",
    "description": "根据 dataset size、compute 和 downstream task 选择 SimCLR / MAE / DINOv2",
    "tags": [],
    "phase": 4,
    "lesson": 17,
    "lessonPath": "phases/04-computer-vision/17-self-supervised-vision",
    "file": "phases/04-computer-vision/17-self-supervised-vision/outputs/prompt-ssl-pretraining-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-linear-probe-runner",
    "description": "为任意 frozen encoder 和 labelled dataset 编写完整的 linear-probe evaluation",
    "tags": [
      "self-supervised",
      "evaluation",
      "linear-probe",
      "pytorch"
    ],
    "phase": 4,
    "lesson": 17,
    "lessonPath": "phases/04-computer-vision/17-self-supervised-vision",
    "file": "phases/04-computer-vision/17-self-supervised-vision/outputs/skill-linear-probe-runner.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-zero-shot-class-picker",
    "description": "根据类别列表和领域，为 zero-shot CLIP 设计 prompt 模板",
    "tags": [],
    "phase": 4,
    "lesson": 18,
    "lessonPath": "phases/04-computer-vision/18-open-vocab-clip",
    "file": "phases/04-computer-vision/18-open-vocab-clip/outputs/prompt-zero-shot-class-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-image-text-retriever",
    "description": "使用任意 CLIP checkpoint 构建图像 Embedding 索引；支持 query-by-text 和 query-by-image",
    "tags": [
      "clip",
      "retrieval",
      "faiss",
      "zero-shot"
    ],
    "phase": 4,
    "lesson": 18,
    "lessonPath": "phases/04-computer-vision/18-open-vocab-clip",
    "file": "phases/04-computer-vision/18-open-vocab-clip/outputs/skill-image-text-retriever.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-ocr-stack-picker",
    "description": "根据文档类型、语言和结构选择 Tesseract / PaddleOCR / Donut / VLM-OCR",
    "tags": [],
    "phase": 4,
    "lesson": 19,
    "lessonPath": "phases/04-computer-vision/19-ocr-document-understanding",
    "file": "phases/04-computer-vision/19-ocr-document-understanding/outputs/prompt-ocr-stack-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-ctc-decoder",
    "description": "从零编写 greedy 和 beam-search CTC decoders，包括 length normalisation",
    "tags": [
      "ocr",
      "ctc",
      "decoding",
      "sequence-models"
    ],
    "phase": 4,
    "lesson": 19,
    "lessonPath": "phases/04-computer-vision/19-ocr-document-understanding",
    "file": "phases/04-computer-vision/19-ocr-document-understanding/outputs/skill-ctc-decoder.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-retrieval-loss-picker",
    "description": "为给定 retrieval 问题选择 triplet / InfoNCE / ProxyNCA",
    "tags": [],
    "phase": 4,
    "lesson": 20,
    "lessonPath": "phases/04-computer-vision/20-image-retrieval-metric",
    "file": "phases/04-computer-vision/20-image-retrieval-metric/outputs/prompt-retrieval-loss-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-recall-at-k-runner",
    "description": "为 recall@K 编写一个清晰的 evaluation harness，包含 train/val/gallery splits 和合适的 data contract",
    "tags": [
      "retrieval",
      "evaluation",
      "recall",
      "faiss"
    ],
    "phase": 4,
    "lesson": 20,
    "lessonPath": "phases/04-computer-vision/20-image-retrieval-metric",
    "file": "phases/04-computer-vision/20-image-retrieval-metric/outputs/skill-recall-at-k-runner.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-pose-stack-picker",
    "description": "根据 latency、人群规模以及 2D vs 3D 需求选择 MediaPipe / YOLOv8-pose / HRNet / ViTPose",
    "tags": [],
    "phase": 4,
    "lesson": 21,
    "lessonPath": "phases/04-computer-vision/21-keypoint-pose",
    "file": "phases/04-computer-vision/21-keypoint-pose/outputs/prompt-pose-stack-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-heatmap-to-coords",
    "description": "编写每个生产级 pose model 都会使用的 sub-pixel heatmap-to-coordinate routine",
    "tags": [
      "keypoint",
      "pose",
      "subpixel",
      "inference"
    ],
    "phase": 4,
    "lesson": 21,
    "lessonPath": "phases/04-computer-vision/21-keypoint-pose",
    "file": "phases/04-computer-vision/21-keypoint-pose/outputs/skill-heatmap-to-coords.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-3dgs-capture-planner",
    "description": "根据 scene type 和 hardware 为 3DGS reconstruction 规划照片采集流程",
    "tags": [],
    "phase": 4,
    "lesson": 22,
    "lessonPath": "phases/04-computer-vision/22-3d-gaussian-splatting",
    "file": "phases/04-computer-vision/22-3d-gaussian-splatting/outputs/prompt-3dgs-capture-planner.md"
  },
  {
    "kind": "skill",
    "name": "skill-3dgs-export-router",
    "description": "根据下游 viewer 或 engine 选择正确的 3DGS 导出格式（.ply / .splat / glTF KHR_gaussian_splatting / USD）",
    "tags": [
      "3d-gaussian-splatting",
      "export",
      "glTF",
      "OpenUSD",
      "pipeline"
    ],
    "phase": 4,
    "lesson": 22,
    "lessonPath": "phases/04-computer-vision/22-3d-gaussian-splatting",
    "file": "phases/04-computer-vision/22-3d-gaussian-splatting/outputs/skill-3dgs-export-router.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-dit-model-picker",
    "description": "根据质量、延迟和许可证，在 SD3、SD3.5、FLUX.1-dev、FLUX.1-schnell、Z-Image、SD4 Turbo 之间选择",
    "tags": [],
    "phase": 4,
    "lesson": 23,
    "lessonPath": "phases/04-computer-vision/23-diffusion-transformers-rectified-flow",
    "file": "phases/04-computer-vision/23-diffusion-transformers-rectified-flow/outputs/prompt-dit-model-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-rectified-flow-trainer",
    "description": "编写一个包含 AdaLN DiT 和 Euler sampling 的完整 rectified-flow training loop",
    "tags": [
      "diffusion",
      "rectified-flow",
      "DiT",
      "training"
    ],
    "phase": 4,
    "lesson": 23,
    "lessonPath": "phases/04-computer-vision/23-diffusion-transformers-rectified-flow",
    "file": "phases/04-computer-vision/23-diffusion-transformers-rectified-flow/outputs/skill-rectified-flow-trainer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-open-vocab-stack-picker",
    "description": "根据 latency、concept complexity 和 licensing 选择 SAM 3 / Grounded SAM 2 / YOLO-World / SAM-MI",
    "tags": [],
    "phase": 4,
    "lesson": 24,
    "lessonPath": "phases/04-computer-vision/24-sam3-open-vocab-segmentation",
    "file": "phases/04-computer-vision/24-sam3-open-vocab-segmentation/outputs/prompt-open-vocab-stack-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-concept-prompt-designer",
    "description": "将用户话语转换为格式良好的 SAM 3 concept prompt，并处理拆分、消歧和 fallback",
    "tags": [
      "sam3",
      "open-vocab",
      "prompt-engineering",
      "segmentation"
    ],
    "phase": 4,
    "lesson": 24,
    "lessonPath": "phases/04-computer-vision/24-sam3-open-vocab-segmentation",
    "file": "phases/04-computer-vision/24-sam3-open-vocab-segmentation/outputs/skill-concept-prompt-designer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-vlm-selector",
    "description": "根据准确率、延迟、context length 和预算选择 Qwen3-VL / InternVL3.5 / LLaVA-Next / API",
    "tags": [],
    "phase": 4,
    "lesson": 25,
    "lessonPath": "phases/04-computer-vision/25-vision-language-models",
    "file": "phases/04-computer-vision/25-vision-language-models/outputs/prompt-vlm-selector.md"
  },
  {
    "kind": "skill",
    "name": "skill-cmer-monitor",
    "description": "为生产 VLM endpoint 接入 Cross-Modal Error Rate 监控、dashboard 和 alert",
    "tags": [
      "vlm",
      "production",
      "monitoring",
      "hallucination"
    ],
    "phase": 4,
    "lesson": 25,
    "lessonPath": "phases/04-computer-vision/25-vision-language-models",
    "file": "phases/04-computer-vision/25-vision-language-models/outputs/skill-cmer-monitor.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-depth-model-picker",
    "description": "根据延迟、metric-vs-relative 需求和场景类型选择 Depth Anything V3 / Marigold / UniDepth / MiDaS",
    "tags": [],
    "phase": 4,
    "lesson": 26,
    "lessonPath": "phases/04-computer-vision/26-monocular-depth",
    "file": "phases/04-computer-vision/26-monocular-depth/outputs/prompt-depth-model-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-depth-to-pointcloud",
    "description": "使用正确的 intrinsics 处理从 depth maps 构建 point clouds，并导出为 .ply",
    "tags": [
      "depth",
      "point-cloud",
      "3d",
      "intrinsics"
    ],
    "phase": 4,
    "lesson": 26,
    "lessonPath": "phases/04-computer-vision/26-monocular-depth",
    "file": "phases/04-computer-vision/26-monocular-depth/outputs/skill-depth-to-pointcloud.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tracker-picker",
    "description": "根据场景类型、遮挡模式和延迟预算选择 SORT / ByteTrack / BoT-SORT / SAM 2 / SAM 3.1",
    "tags": [],
    "phase": 4,
    "lesson": 27,
    "lessonPath": "phases/04-computer-vision/27-multi-object-tracking",
    "file": "phases/04-computer-vision/27-multi-object-tracking/outputs/prompt-tracker-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-mot-evaluator",
    "description": "编写完整的 evaluation harness，用于基于 ground-truth tracks 评估 MOTA / IDF1 / HOTA",
    "tags": [
      "mot",
      "evaluation",
      "tracking",
      "metrics"
    ],
    "phase": 4,
    "lesson": 27,
    "lessonPath": "phases/04-computer-vision/27-multi-object-tracking",
    "file": "phases/04-computer-vision/27-multi-object-tracking/outputs/skill-mot-evaluator.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-video-model-picker",
    "description": "为给定任务、license 和 latency 目标选择 Sora 2 / Runway Gen-5 / Wan-Video / HunyuanVideo / Cosmos",
    "tags": [],
    "phase": 4,
    "lesson": 28,
    "lessonPath": "phases/04-computer-vision/28-world-models-video-diffusion",
    "file": "phases/04-computer-vision/28-world-models-video-diffusion/outputs/prompt-video-model-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-physical-plausibility-checks",
    "description": "在发布前，对任何生成视频自动检查 object permanence、gravity 和 continuity",
    "tags": [
      "video-generation",
      "quality",
      "physics",
      "evaluation"
    ],
    "phase": 4,
    "lesson": 28,
    "lessonPath": "phases/04-computer-vision/28-world-models-video-diffusion",
    "file": "phases/04-computer-vision/28-world-models-video-diffusion/outputs/skill-physical-plausibility-checks.md"
  },
  {
    "kind": "prompt",
    "name": "preprocessing-advisor",
    "description": "为一个 NLP 任务推荐 Tokenization、Stemming 和 Lemmatization 设置。",
    "tags": [],
    "phase": 5,
    "lesson": 1,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/01-text-processing",
    "file": "phases/05-nlp-foundations-to-advanced/01-text-processing/outputs/prompt-preprocessing-advisor.md"
  },
  {
    "kind": "prompt",
    "name": "vectorization-picker",
    "description": "给定一个 text-classification 任务，推荐 BoW、TF-IDF、embeddings 或混合方案。",
    "tags": [],
    "phase": 5,
    "lesson": 2,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf",
    "file": "phases/05-nlp-foundations-to-advanced/02-bag-of-words-tfidf/outputs/prompt-vectorization-picker.md"
  },
  {
    "kind": "skill",
    "name": "embedding-probe",
    "description": "检查一个 word2vec model。运行 analogies，查找 neighbors，诊断质量。",
    "tags": [
      "nlp",
      "embeddings",
      "debugging"
    ],
    "phase": 5,
    "lesson": 3,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec",
    "file": "phases/05-nlp-foundations-to-advanced/03-word-embeddings-word2vec/outputs/skill-embedding-probe.md"
  },
  {
    "kind": "skill",
    "name": "skill-embeddings-picker",
    "description": "为新的语言模型或文本 pipeline 选择一种 tokenization 方法。",
    "tags": [
      "nlp",
      "tokenization",
      "embeddings"
    ],
    "phase": 5,
    "lesson": 4,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword",
    "file": "phases/05-nlp-foundations-to-advanced/04-glove-fasttext-subword/outputs/skill-embeddings-picker.md"
  },
  {
    "kind": "prompt",
    "name": "sentiment-baseline",
    "description": "为新 dataset 设计 sentiment analysis baseline。",
    "tags": [],
    "phase": 5,
    "lesson": 5,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/05-sentiment-analysis",
    "file": "phases/05-nlp-foundations-to-advanced/05-sentiment-analysis/outputs/prompt-sentiment-baseline.md"
  },
  {
    "kind": "skill",
    "name": "ner-picker",
    "description": "为给定的 extraction task 选择合适的 NER approach。",
    "tags": [
      "nlp",
      "ner",
      "extraction"
    ],
    "phase": 5,
    "lesson": 6,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/06-named-entity-recognition",
    "file": "phases/05-nlp-foundations-to-advanced/06-named-entity-recognition/outputs/skill-ner-picker.md"
  },
  {
    "kind": "skill",
    "name": "grammar-pipeline",
    "description": "为下游 NLP 任务设计经典 POS + dependency pipeline。",
    "tags": [
      "nlp",
      "pos",
      "parsing"
    ],
    "phase": 5,
    "lesson": 7,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing",
    "file": "phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing/outputs/skill-grammar-pipeline.md"
  },
  {
    "kind": "prompt",
    "name": "text-encoder-picker",
    "description": "为给定约束集选择文本 encoder 架构。",
    "tags": [],
    "phase": 5,
    "lesson": 8,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text",
    "file": "phases/05-nlp-foundations-to-advanced/08-cnns-rnns-for-text/outputs/prompt-text-encoder-picker.md"
  },
  {
    "kind": "prompt",
    "name": "seq2seq-design",
    "description": "为给定任务设计 sequence-to-sequence pipeline。",
    "tags": [],
    "phase": 5,
    "lesson": 9,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence",
    "file": "phases/05-nlp-foundations-to-advanced/09-sequence-to-sequence/outputs/prompt-seq2seq-design.md"
  },
  {
    "kind": "prompt",
    "name": "attention-shapes",
    "description": "调试 Attention implementations 中的 shape bug。",
    "tags": [],
    "phase": 5,
    "lesson": 10,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/10-attention-mechanism",
    "file": "phases/05-nlp-foundations-to-advanced/10-attention-mechanism/outputs/prompt-attention-shapes.md"
  },
  {
    "kind": "skill",
    "name": "mt-evaluator",
    "description": "评估 machine translation 输出是否可发布。",
    "tags": [
      "nlp",
      "translation",
      "evaluation"
    ],
    "phase": 5,
    "lesson": 11,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/11-machine-translation",
    "file": "phases/05-nlp-foundations-to-advanced/11-machine-translation/outputs/skill-mt-evaluator.md"
  },
  {
    "kind": "skill",
    "name": "summary-picker",
    "description": "选择 extractive 或 abstractive，给出 library 名称，并添加 factuality check。",
    "tags": [
      "nlp",
      "summarization"
    ],
    "phase": 5,
    "lesson": 12,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/12-text-summarization",
    "file": "phases/05-nlp-foundations-to-advanced/12-text-summarization/outputs/skill-summary-picker.md"
  },
  {
    "kind": "skill",
    "name": "qa-architect",
    "description": "选择 QA 架构、检索策略和评估计划。",
    "tags": [
      "nlp",
      "qa",
      "rag"
    ],
    "phase": 5,
    "lesson": 13,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/13-question-answering",
    "file": "phases/05-nlp-foundations-to-advanced/13-question-answering/outputs/skill-qa-architect.md"
  },
  {
    "kind": "skill",
    "name": "retrieval-picker",
    "description": "为给定语料库和查询模式选择 retrieval stack。",
    "tags": [
      "nlp",
      "retrieval",
      "rag",
      "search"
    ],
    "phase": 5,
    "lesson": 14,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/14-information-retrieval-search",
    "file": "phases/05-nlp-foundations-to-advanced/14-information-retrieval-search/outputs/skill-retrieval-picker.md"
  },
  {
    "kind": "skill",
    "name": "topic-picker",
    "description": "为一个 corpus 选择 LDA 或 BERTopic。指定 library、knobs、evaluation。",
    "tags": [
      "nlp",
      "topic-modeling"
    ],
    "phase": 5,
    "lesson": 15,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/15-topic-modeling",
    "file": "phases/05-nlp-foundations-to-advanced/15-topic-modeling/outputs/skill-topic-picker.md"
  },
  {
    "kind": "prompt",
    "name": "lm-baseline",
    "description": "在训练 Neural LM 之前，构建一个可复现的 n-gram 语言模型 baseline。",
    "tags": [],
    "phase": 5,
    "lesson": 16,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer",
    "file": "phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer/outputs/prompt-lm-baseline.md"
  },
  {
    "kind": "skill",
    "name": "chatbot-architect",
    "description": "为给定用例设计 chatbot 技术栈。",
    "tags": [
      "nlp",
      "agents",
      "chatbot"
    ],
    "phase": 5,
    "lesson": 17,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural",
    "file": "phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural/outputs/skill-chatbot-architect.md"
  },
  {
    "kind": "skill",
    "name": "multilingual-picker",
    "description": "为多语言 NLP 任务选择源语言、目标模型和评估计划。",
    "tags": [
      "nlp",
      "multilingual",
      "cross-lingual"
    ],
    "phase": 5,
    "lesson": 18,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/18-multilingual-nlp",
    "file": "phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/outputs/skill-multilingual-picker.md"
  },
  {
    "kind": "skill",
    "name": "skill-bpe-vs-wordpiece",
    "description": "为给定 corpus 和部署目标选择 Tokenizer algorithm、vocab size、library。",
    "tags": [
      "nlp",
      "tokenization"
    ],
    "phase": 5,
    "lesson": 19,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/19-subword-tokenization",
    "file": "phases/05-nlp-foundations-to-advanced/19-subword-tokenization/outputs/skill-bpe-vs-wordpiece.md"
  },
  {
    "kind": "skill",
    "name": "structured-output-picker",
    "description": "选择 structured output 方法、schema 设计和 validation plan。",
    "tags": [
      "nlp",
      "llm",
      "structured-output"
    ],
    "phase": 5,
    "lesson": 20,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding",
    "file": "phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/outputs/skill-structured-output-picker.md"
  },
  {
    "kind": "skill",
    "name": "nli-picker",
    "description": "为 classification / faithfulness / zero-shot 任务选择 NLI model、label template 和 evaluation setup。",
    "tags": [
      "nlp",
      "nli",
      "zero-shot"
    ],
    "phase": 5,
    "lesson": 21,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment",
    "file": "phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/outputs/skill-nli-picker.md"
  },
  {
    "kind": "skill",
    "name": "embedding-picker",
    "description": "为给定 corpus 和 deployment 选择 embedding model、dimension 和 retrieval mode。",
    "tags": [
      "nlp",
      "embeddings",
      "retrieval"
    ],
    "phase": 5,
    "lesson": 22,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive",
    "file": "phases/05-nlp-foundations-to-advanced/22-embedding-models-deep-dive/outputs/skill-embedding-picker.md"
  },
  {
    "kind": "skill",
    "name": "chunker",
    "description": "为给定 corpus 和 query distribution 选择 chunking strategy、size 和 overlap。",
    "tags": [
      "nlp",
      "rag",
      "chunking"
    ],
    "phase": 5,
    "lesson": 23,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag",
    "file": "phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/outputs/skill-chunker.md"
  },
  {
    "kind": "skill",
    "name": "coref-picker",
    "description": "选择 coreference 方法、evaluation plan 和 integration strategy。",
    "tags": [
      "nlp",
      "coref",
      "information-extraction"
    ],
    "phase": 5,
    "lesson": 24,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/24-coreference-resolution",
    "file": "phases/05-nlp-foundations-to-advanced/24-coreference-resolution/outputs/skill-coref-picker.md"
  },
  {
    "kind": "skill",
    "name": "entity-linker",
    "description": "设计一个 entity linking pipeline — KB、candidate generator、disambiguator、evaluation。",
    "tags": [
      "nlp",
      "entity-linking",
      "knowledge-graph"
    ],
    "phase": 5,
    "lesson": 25,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/25-entity-linking",
    "file": "phases/05-nlp-foundations-to-advanced/25-entity-linking/outputs/skill-entity-linker.md"
  },
  {
    "kind": "skill",
    "name": "re-designer",
    "description": "设计一个带有 provenance 和 canonicalization 的 relation extraction pipeline。",
    "tags": [
      "nlp",
      "relation-extraction",
      "knowledge-graph"
    ],
    "phase": 5,
    "lesson": 26,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg",
    "file": "phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg/outputs/skill-re-designer.md"
  },
  {
    "kind": "skill",
    "name": "eval-architect",
    "description": "设计一个带 calibrated judge 和 CI gates 的 LLM evaluation plan。",
    "tags": [
      "nlp",
      "evaluation",
      "rag"
    ],
    "phase": 5,
    "lesson": 27,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks",
    "file": "phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/outputs/skill-eval-architect.md"
  },
  {
    "kind": "skill",
    "name": "long-context-eval",
    "description": "为给定模型和 use case 设计一组 long-context evaluation 测试。",
    "tags": [
      "nlp",
      "long-context",
      "evaluation"
    ],
    "phase": 5,
    "lesson": 28,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/28-long-context-evaluation",
    "file": "phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/outputs/skill-long-context-eval.md"
  },
  {
    "kind": "skill",
    "name": "dst-designer",
    "description": "设计一个 dialogue state tracker —— schema、extractor、update policy、evaluation。",
    "tags": [
      "nlp",
      "dialogue",
      "task-oriented"
    ],
    "phase": 5,
    "lesson": 29,
    "lessonPath": "phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking",
    "file": "phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking/outputs/skill-dst-designer.md"
  },
  {
    "kind": "skill",
    "name": "audio-loader",
    "description": "根据 target model 的期望验证 raw audio file，并安全地 resample。",
    "tags": [
      "audio",
      "speech",
      "preprocessing"
    ],
    "phase": 6,
    "lesson": 1,
    "lessonPath": "phases/06-speech-and-audio/01-audio-fundamentals",
    "file": "phases/06-speech-and-audio/01-audio-fundamentals/outputs/skill-audio-loader.md"
  },
  {
    "kind": "skill",
    "name": "feature-extractor",
    "description": "选择 feature type、mel count、frame/hop 和 normalization，以匹配下游 audio model。",
    "tags": [
      "audio",
      "features",
      "spectrogram",
      "mel"
    ],
    "phase": 6,
    "lesson": 2,
    "lessonPath": "phases/06-speech-and-audio/02-spectrograms-mel-features",
    "file": "phases/06-speech-and-audio/02-spectrograms-mel-features/outputs/skill-feature-extractor.md"
  },
  {
    "kind": "skill",
    "name": "classifier-designer",
    "description": "为 audio classification 任务选择 architecture、augmentation、class-balance strategy 和 eval metric。",
    "tags": [
      "audio",
      "classification",
      "beats",
      "ast"
    ],
    "phase": 6,
    "lesson": 3,
    "lessonPath": "phases/06-speech-and-audio/03-audio-classification",
    "file": "phases/06-speech-and-audio/03-audio-classification/outputs/skill-classifier-designer.md"
  },
  {
    "kind": "skill",
    "name": "asr-picker",
    "description": "为给定部署目标选择 ASR model、decoding strategy、chunking 和 LM fusion。",
    "tags": [
      "audio",
      "asr",
      "speech-recognition"
    ],
    "phase": 6,
    "lesson": 4,
    "lessonPath": "phases/06-speech-and-audio/04-speech-recognition-asr",
    "file": "phases/06-speech-and-audio/04-speech-recognition-asr/outputs/skill-asr-picker.md"
  },
  {
    "kind": "skill",
    "name": "whisper-tuner",
    "description": "为给定语言、domain 和延迟预算设计 Whisper fine-tune 或 inference pipeline。",
    "tags": [
      "audio",
      "whisper",
      "asr",
      "fine-tuning",
      "lora"
    ],
    "phase": 6,
    "lesson": 5,
    "lessonPath": "phases/06-speech-and-audio/05-whisper-architecture-finetuning",
    "file": "phases/06-speech-and-audio/05-whisper-architecture-finetuning/outputs/skill-whisper-tuner.md"
  },
  {
    "kind": "skill",
    "name": "speaker-verifier",
    "description": "设计 speaker verification 或 diarization pipeline，包括模型选择、enrollment protocol 和 threshold tuning。",
    "tags": [
      "audio",
      "speaker",
      "verification",
      "diarization"
    ],
    "phase": 6,
    "lesson": 6,
    "lessonPath": "phases/06-speech-and-audio/06-speaker-recognition-verification",
    "file": "phases/06-speech-and-audio/06-speaker-recognition-verification/outputs/skill-speaker-verifier.md"
  },
  {
    "kind": "skill",
    "name": "tts-designer",
    "description": "为给定的语言、风格和 latency target 选择 TTS model、voice、text-normalization scope 和 evaluation plan。",
    "tags": [
      "audio",
      "tts",
      "speech-synthesis"
    ],
    "phase": 6,
    "lesson": 7,
    "lessonPath": "phases/06-speech-and-audio/07-text-to-speech",
    "file": "phases/06-speech-and-audio/07-text-to-speech/outputs/skill-tts-designer.md"
  },
  {
    "kind": "skill",
    "name": "voice-cloner",
    "description": "为 voice-cloning deployment 选择 cloning approach（zero-shot / conversion / adaptation）、consent artifact、watermark 和 safety filters。",
    "tags": [
      "voice-cloning",
      "voice-conversion",
      "watermark",
      "consent",
      "safety"
    ],
    "phase": 6,
    "lesson": 8,
    "lessonPath": "phases/06-speech-and-audio/08-voice-cloning-conversion",
    "file": "phases/06-speech-and-audio/08-voice-cloning-conversion/outputs/skill-voice-cloner.md"
  },
  {
    "kind": "skill",
    "name": "music-designer",
    "description": "为一次部署选择音乐生成模型、许可策略、长度计划和披露 metadata。",
    "tags": [
      "music-generation",
      "musicgen",
      "stable-audio",
      "suno",
      "licensing"
    ],
    "phase": 6,
    "lesson": 9,
    "lessonPath": "phases/06-speech-and-audio/09-music-generation",
    "file": "phases/06-speech-and-audio/09-music-generation/outputs/skill-music-designer.md"
  },
  {
    "kind": "skill",
    "name": "alm-picker",
    "description": "为音频理解任务选择 audio-language model、benchmark subset、output modality（text vs speech）和 guardrails。",
    "tags": [
      "alm",
      "lalm",
      "qwen-omni",
      "audio-flamingo",
      "gemini-audio",
      "mmau"
    ],
    "phase": 6,
    "lesson": 10,
    "lessonPath": "phases/06-speech-and-audio/10-audio-language-models",
    "file": "phases/06-speech-and-audio/10-audio-language-models/outputs/skill-alm-picker.md"
  },
  {
    "kind": "skill",
    "name": "realtime-voice-pipeline",
    "description": "为目标端到端 latency 选择 transport、VAD、streaming STT、LLM、streaming TTS 和 orchestration。",
    "tags": [
      "voice-agent",
      "livekit",
      "pipecat",
      "silero",
      "streaming",
      "latency"
    ],
    "phase": 6,
    "lesson": 11,
    "lessonPath": "phases/06-speech-and-audio/11-real-time-audio-processing",
    "file": "phases/06-speech-and-audio/11-real-time-audio-processing/outputs/skill-realtime-pipeline.md"
  },
  {
    "kind": "skill",
    "name": "voice-assistant-architect",
    "description": "为给定 workload 产出 full-stack 语音助手 spec，包括 components、latency budget、observability、compliance。",
    "tags": [
      "voice-assistant",
      "architecture",
      "livekit",
      "pipecat",
      "compliance"
    ],
    "phase": 6,
    "lesson": 12,
    "lessonPath": "phases/06-speech-and-audio/12-voice-assistant-pipeline",
    "file": "phases/06-speech-and-audio/12-voice-assistant-pipeline/outputs/skill-voice-assistant-architect.md"
  },
  {
    "kind": "skill",
    "name": "codec-picker",
    "description": "为给定的生成或压缩任务选择 neural audio codec（EnCodec / DAC / SNAC / Mimi）。",
    "tags": [
      "codec",
      "encodec",
      "dac",
      "snac",
      "mimi",
      "rvq",
      "semantic-tokens"
    ],
    "phase": 6,
    "lesson": 13,
    "lessonPath": "phases/06-speech-and-audio/13-neural-audio-codecs",
    "file": "phases/06-speech-and-audio/13-neural-audio-codecs/outputs/skill-codec-picker.md"
  },
  {
    "kind": "skill",
    "name": "vad-tuner",
    "description": "为 voice agent 选择 VAD model、threshold、silence hangover、pre-roll 和 turn-detection strategy。",
    "tags": [
      "vad",
      "silero",
      "cobra",
      "turn-detection",
      "flush-trick"
    ],
    "phase": 6,
    "lesson": 14,
    "lessonPath": "phases/06-speech-and-audio/14-voice-activity-detection-turn-taking",
    "file": "phases/06-speech-and-audio/14-voice-activity-detection-turn-taking/outputs/skill-vad-tuner.md"
  },
  {
    "kind": "skill",
    "name": "duplex-pipeline",
    "description": "为语音 agent workload 选择 full-duplex (Moshi) 或 pipeline (VAD + STT + LLM + TTS) 架构。",
    "tags": [
      "moshi",
      "hibiki",
      "full-duplex",
      "voice-agent",
      "streaming"
    ],
    "phase": 6,
    "lesson": 15,
    "lessonPath": "phases/06-speech-and-audio/15-streaming-speech-to-speech-moshi-hibiki",
    "file": "phases/06-speech-and-audio/15-streaming-speech-to-speech-moshi-hibiki/outputs/skill-duplex-pipeline.md"
  },
  {
    "kind": "skill",
    "name": "spoof-defender",
    "description": "为 voice-generation / voice-auth 部署选择 detection model、watermark、provenance manifest 和 operational playbook。",
    "tags": [
      "anti-spoofing",
      "watermark",
      "audioseal",
      "asvspoof",
      "c2pa",
      "voice-fraud"
    ],
    "phase": 6,
    "lesson": 16,
    "lessonPath": "phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking",
    "file": "phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking/outputs/skill-spoof-defender.md"
  },
  {
    "kind": "skill",
    "name": "audio-evaluator",
    "description": "为任意音频 model 发布选择指标、benchmark、规范化规则和报告格式。",
    "tags": [
      "evaluation",
      "wer",
      "mos",
      "utmos",
      "eer",
      "der",
      "fad",
      "mmau",
      "leaderboard"
    ],
    "phase": 6,
    "lesson": 17,
    "lessonPath": "phases/06-speech-and-audio/17-audio-evaluation-metrics",
    "file": "phases/06-speech-and-audio/17-audio-evaluation-metrics/outputs/skill-audio-evaluator.md"
  },
  {
    "kind": "skill",
    "name": "sequence-architecture-picker",
    "description": "根据长度、吞吐量和训练预算选择序列架构（RNN、Transformer、SSM、hybrid）。",
    "tags": [
      "transformers",
      "architecture",
      "rnn",
      "ssm"
    ],
    "phase": 7,
    "lesson": 1,
    "lessonPath": "phases/07-transformers-deep-dive/01-why-transformers",
    "file": "phases/07-transformers-deep-dive/01-why-transformers/outputs/skill-architecture-picker.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-attention-explainer",
    "description": "通过 database lookup 类比解释 Attention",
    "tags": [],
    "phase": 7,
    "lesson": 2,
    "lessonPath": "phases/07-transformers-deep-dive/02-self-attention-from-scratch",
    "file": "phases/07-transformers-deep-dive/02-self-attention-from-scratch/outputs/prompt-attention-explainer.md"
  },
  {
    "kind": "skill",
    "name": "mha-configurator",
    "description": "为新的 Transformer 推荐 head count、KV-head count 和 projection strategy（MHA / MQA / GQA / MLA）。",
    "tags": [
      "transformers",
      "attention",
      "mha",
      "gqa"
    ],
    "phase": 7,
    "lesson": 3,
    "lessonPath": "phases/07-transformers-deep-dive/03-multi-head-attention",
    "file": "phases/07-transformers-deep-dive/03-multi-head-attention/outputs/skill-mha-configurator.md"
  },
  {
    "kind": "skill",
    "name": "positional-encoding-picker",
    "description": "根据上下文长度和训练预算选择 positional encoding（RoPE、ALiBi、sinusoidal）+ scaling strategy。",
    "tags": [
      "transformers",
      "positional-encoding",
      "rope",
      "alibi"
    ],
    "phase": 7,
    "lesson": 4,
    "lessonPath": "phases/07-transformers-deep-dive/04-positional-encoding",
    "file": "phases/07-transformers-deep-dive/04-positional-encoding/outputs/skill-positional-encoding-picker.md"
  },
  {
    "kind": "skill",
    "name": "transformer-block-reviewer",
    "description": "根据 2026 默认设置审查 Transformer block 实现，并标记偏离。",
    "tags": [
      "transformers",
      "architecture",
      "review"
    ],
    "phase": 7,
    "lesson": 5,
    "lessonPath": "phases/07-transformers-deep-dive/05-full-transformer",
    "file": "phases/07-transformers-deep-dive/05-full-transformer/outputs/skill-transformer-block-reviewer.md"
  },
  {
    "kind": "skill",
    "name": "bert-finetuner",
    "description": "为新的 Classification、抽取或 Retrieval 任务界定 BERT fine-tune 范围。",
    "tags": [
      "bert",
      "fine-tuning",
      "nlp"
    ],
    "phase": 7,
    "lesson": 6,
    "lessonPath": "phases/07-transformers-deep-dive/06-bert-masked-language-modeling",
    "file": "phases/07-transformers-deep-dive/06-bert-masked-language-modeling/outputs/skill-bert-finetuner.md"
  },
  {
    "kind": "skill",
    "name": "sampling-tuner",
    "description": "为给定的生成任务选择 decoding strategy（greedy / temperature / top-k / top-p / min-p / speculative）。",
    "tags": [
      "gpt",
      "sampling",
      "decoding",
      "inference"
    ],
    "phase": 7,
    "lesson": 7,
    "lessonPath": "phases/07-transformers-deep-dive/07-gpt-causal-language-modeling",
    "file": "phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/outputs/skill-sampling-tuner.md"
  },
  {
    "kind": "skill",
    "name": "seq2seq-picker",
    "description": "为新的 sequence-to-sequence 任务选择 encoder-decoder 还是 decoder-only。",
    "tags": [
      "transformers",
      "t5",
      "bart",
      "seq2seq"
    ],
    "phase": 7,
    "lesson": 8,
    "lessonPath": "phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder",
    "file": "phases/07-transformers-deep-dive/08-t5-bart-encoder-decoder/outputs/skill-seq2seq-picker.md"
  },
  {
    "kind": "skill",
    "name": "vit-configurator",
    "description": "为新的 vision task 选择 ViT variant、patch size 和 pretraining source。",
    "tags": [
      "transformers",
      "vit",
      "vision"
    ],
    "phase": 7,
    "lesson": 9,
    "lessonPath": "phases/07-transformers-deep-dive/09-vision-transformers",
    "file": "phases/07-transformers-deep-dive/09-vision-transformers/outputs/skill-vit-configurator.md"
  },
  {
    "kind": "skill",
    "name": "asr-configurator",
    "description": "为新的语音 pipeline 选择 ASR model（Whisper 变体 / Moonshine / faster-whisper）和 decoding 参数。",
    "tags": [
      "transformers",
      "whisper",
      "asr",
      "speech"
    ],
    "phase": 7,
    "lesson": 10,
    "lessonPath": "phases/07-transformers-deep-dive/10-audio-transformers-whisper",
    "file": "phases/07-transformers-deep-dive/10-audio-transformers-whisper/outputs/skill-asr-configurator.md"
  },
  {
    "kind": "skill",
    "name": "moe-configurator",
    "description": "为新的 MoE Transformer 选择 expert 数量、top-k、balancing strategy 和 shared-expert 布局。",
    "tags": [
      "transformers",
      "moe",
      "mixture-of-experts",
      "scaling"
    ],
    "phase": 7,
    "lesson": 11,
    "lessonPath": "phases/07-transformers-deep-dive/11-mixture-of-experts",
    "file": "phases/07-transformers-deep-dive/11-mixture-of-experts/outputs/skill-moe-configurator.md"
  },
  {
    "kind": "skill",
    "name": "inference-optimizer",
    "description": "为新的 inference deployment 选择 Attention implementation、KV cache strategy、quantization 和 speculative decoding。",
    "tags": [
      "transformers",
      "inference",
      "flash-attention",
      "kv-cache"
    ],
    "phase": 7,
    "lesson": 12,
    "lessonPath": "phases/07-transformers-deep-dive/12-kv-cache-flash-attention",
    "file": "phases/07-transformers-deep-dive/12-kv-cache-flash-attention/outputs/skill-inference-optimizer.md"
  },
  {
    "kind": "skill",
    "name": "training-budget-estimator",
    "description": "在给定计算预算和部署约束的情况下，为新的 Transformer 训练运行估算 (N, D, hours, GPU count)。",
    "tags": [
      "scaling-laws",
      "training",
      "chinchilla"
    ],
    "phase": 7,
    "lesson": 13,
    "lessonPath": "phases/07-transformers-deep-dive/13-scaling-laws",
    "file": "phases/07-transformers-deep-dive/13-scaling-laws/outputs/skill-training-budget-estimator.md"
  },
  {
    "kind": "skill",
    "name": "transformer-review",
    "description": "根据 13 节 Phase 7 课程审查一个从零实现的 Transformer。",
    "tags": [
      "transformers",
      "review",
      "capstone"
    ],
    "phase": 7,
    "lesson": 14,
    "lessonPath": "phases/07-transformers-deep-dive/14-build-a-transformer-capstone",
    "file": "phases/07-transformers-deep-dive/14-build-a-transformer-capstone/outputs/skill-transformer-review.md"
  },
  {
    "kind": "skill",
    "name": "attention-variant-picker",
    "description": "根据 context length、retrieval 需求和 compute profile，为新模型选择 full / sliding-window / sparse / differential Attention 拓扑。",
    "tags": [
      "attention",
      "transformer",
      "long-context",
      "inference",
      "memory"
    ],
    "phase": 7,
    "lesson": 15,
    "lessonPath": "phases/07-transformers-deep-dive/15-attention-variants",
    "file": "phases/07-transformers-deep-dive/15-attention-variants/outputs/skill-attention-variant-picker.md"
  },
  {
    "kind": "skill",
    "name": "spec-decode-picker",
    "description": "为新的 LLM inference workload 选择 speculative decoding 策略（vanilla / Medusa / EAGLE / lookahead）和调优参数。",
    "tags": [
      "inference",
      "decoding",
      "latency",
      "speculative",
      "optimization"
    ],
    "phase": 7,
    "lesson": 16,
    "lessonPath": "phases/07-transformers-deep-dive/16-speculative-decoding",
    "file": "phases/07-transformers-deep-dive/16-speculative-decoding/outputs/skill-spec-decode-picker.md"
  },
  {
    "kind": "skill",
    "name": "generative-model-chooser",
    "description": "为给定任务和预算选择 generative-model 家族、backbone 和 hosted 替代方案。",
    "tags": [
      "generative",
      "taxonomy"
    ],
    "phase": 8,
    "lesson": 1,
    "lessonPath": "phases/08-generative-ai/01-generative-models-taxonomy-history",
    "file": "phases/08-generative-ai/01-generative-models-taxonomy-history/outputs/skill-model-chooser.md"
  },
  {
    "kind": "skill",
    "name": "vae-trainer",
    "description": "为给定 dataset 和 downstream use 指定 VAE architecture、latent size、beta schedule 和 eval plan。",
    "tags": [
      "vae",
      "latent",
      "generative"
    ],
    "phase": 8,
    "lesson": 2,
    "lessonPath": "phases/08-generative-ai/02-autoencoders-vae",
    "file": "phases/08-generative-ai/02-autoencoders-vae/outputs/skill-vae-trainer.md"
  },
  {
    "kind": "skill",
    "name": "gan-debugger",
    "description": "从 loss curves 和 sample grids 诊断失败的 GAN training；给出 one-line fixes。",
    "tags": [
      "gan",
      "adversarial",
      "debugging"
    ],
    "phase": 8,
    "lesson": 3,
    "lessonPath": "phases/08-generative-ai/03-gans-generator-discriminator",
    "file": "phases/08-generative-ai/03-gans-generator-discriminator/outputs/skill-gan-debugger.md"
  },
  {
    "kind": "skill",
    "name": "img2img-chooser",
    "description": "根据 paired 与 unpaired data、domain specificity 和 latency budget 选择 image-to-image approach。",
    "tags": [
      "pix2pix",
      "img2img",
      "conditional"
    ],
    "phase": 8,
    "lesson": 4,
    "lessonPath": "phases/08-generative-ai/04-conditional-gans-pix2pix",
    "file": "phases/08-generative-ai/04-conditional-gans-pix2pix/outputs/skill-img2img-chooser.md"
  },
  {
    "kind": "skill",
    "name": "stylegan-inversion",
    "description": "为真实照片上的 pretrained StyleGAN 选择 inversion 与编辑 pipeline。",
    "tags": [
      "stylegan",
      "inversion",
      "editing"
    ],
    "phase": 8,
    "lesson": 5,
    "lessonPath": "phases/08-generative-ai/05-stylegan",
    "file": "phases/08-generative-ai/05-stylegan/outputs/skill-stylegan-inversion.md"
  },
  {
    "kind": "skill",
    "name": "diffusion-trainer",
    "description": "配置一次 diffusion training run：schedule、prediction target、sampler 和 eval plan。",
    "tags": [
      "diffusion",
      "ddpm",
      "training"
    ],
    "phase": 8,
    "lesson": 6,
    "lessonPath": "phases/08-generative-ai/06-diffusion-ddpm-from-scratch",
    "file": "phases/08-generative-ai/06-diffusion-ddpm-from-scratch/outputs/skill-diffusion-trainer.md"
  },
  {
    "kind": "skill",
    "name": "sd-prompter",
    "description": "为给定的 prompt、风格和质量门槛配置 Stable Diffusion / Flux 推理。",
    "tags": [
      "stable-diffusion",
      "flux",
      "latent-diffusion"
    ],
    "phase": 8,
    "lesson": 7,
    "lessonPath": "phases/08-generative-ai/07-latent-diffusion-stable-diffusion",
    "file": "phases/08-generative-ai/07-latent-diffusion-stable-diffusion/outputs/skill-sd-prompter.md"
  },
  {
    "kind": "skill",
    "name": "sd-toolkit-composer",
    "description": "针对给定输入，在 SD / Flux base 之上组合 ControlNets、LoRAs 和 IP-Adapters。",
    "tags": [
      "controlnet",
      "lora",
      "ip-adapter",
      "diffusion"
    ],
    "phase": 8,
    "lesson": 8,
    "lessonPath": "phases/08-generative-ai/08-controlnet-lora-conditioning",
    "file": "phases/08-generative-ai/08-controlnet-lora-conditioning/outputs/skill-sd-toolkit-composer.md"
  },
  {
    "kind": "skill",
    "name": "editing-pipeline",
    "description": "根据源图像 + 编辑描述规划一条 Image Editing pipeline，输出可交付结果。",
    "tags": [
      "inpaint",
      "outpaint",
      "edit",
      "sam"
    ],
    "phase": 8,
    "lesson": 9,
    "lessonPath": "phases/08-generative-ai/09-inpainting-outpainting-editing",
    "file": "phases/08-generative-ai/09-inpainting-outpainting-editing/outputs/skill-editing-pipeline.md"
  },
  {
    "kind": "skill",
    "name": "video-brief",
    "description": "将 video brief 转换为适用于 2026 video generator 的 model + prompt + shot plan。",
    "tags": [
      "video",
      "diffusion",
      "sora",
      "veo",
      "kling"
    ],
    "phase": 8,
    "lesson": 10,
    "lessonPath": "phases/08-generative-ai/10-video-generation",
    "file": "phases/08-generative-ai/10-video-generation/outputs/skill-video-brief.md"
  },
  {
    "kind": "skill",
    "name": "audio-brief",
    "description": "将 audio brief 转换为覆盖 TTS、music 和 SFX 的 model + prompt + eval plan。",
    "tags": [
      "audio",
      "tts",
      "music",
      "sfx",
      "codec"
    ],
    "phase": 8,
    "lesson": 11,
    "lessonPath": "phases/08-generative-ai/11-audio-generation",
    "file": "phases/08-generative-ai/11-audio-generation/outputs/skill-audio-brief.md"
  },
  {
    "kind": "skill",
    "name": "3d-pipeline",
    "description": "根据 input type、output format 和 use case 选择 3D generation 或 reconstruction pipeline。",
    "tags": [
      "3d",
      "gaussian-splatting",
      "nerf",
      "mesh"
    ],
    "phase": 8,
    "lesson": 12,
    "lessonPath": "phases/08-generative-ai/12-3d-generation",
    "file": "phases/08-generative-ai/12-3d-generation/outputs/skill-3d-pipeline.md"
  },
  {
    "kind": "skill",
    "name": "fm-tuner",
    "description": "将 Diffusion training plan 转换为 flow-matching / rectified-flow config。",
    "tags": [
      "flow-matching",
      "rectified-flow",
      "diffusion"
    ],
    "phase": 8,
    "lesson": 13,
    "lessonPath": "phases/08-generative-ai/13-flow-matching-rectified-flows",
    "file": "phases/08-generative-ai/13-flow-matching-rectified-flows/outputs/skill-fm-tuner.md"
  },
  {
    "kind": "skill",
    "name": "eval-report",
    "description": "规划完整的生成式模型评估：样本质量、遵循度、偏好、失效审计。",
    "tags": [
      "evaluation",
      "fid",
      "clip",
      "elo"
    ],
    "phase": 8,
    "lesson": 14,
    "lessonPath": "phases/08-generative-ai/14-evaluation-fid-clip-score",
    "file": "phases/08-generative-ai/14-evaluation-fid-clip-score/outputs/skill-eval-report.md"
  },
  {
    "kind": "skill",
    "name": "var-tokenizer-designer",
    "description": "为 next-scale visual autoregressive 图像生成设计 multi-scale residual VQ Tokenizer。",
    "tags": [
      "var",
      "next-scale-prediction",
      "vq-vae",
      "residual-vq",
      "image-generation",
      "tokenizer"
    ],
    "phase": 8,
    "lesson": 19,
    "lessonPath": "phases/08-generative-ai/19-visual-autoregressive-var",
    "file": "phases/08-generative-ai/19-visual-autoregressive-var/outputs/skill-var-tokenizer-designer.md"
  },
  {
    "kind": "skill",
    "name": "mdp-modeler",
    "description": "给定一个 task description，生成 Markov Decision Process spec，并在 training 前标记 formulation risks。",
    "tags": [
      "rl",
      "mdp",
      "modeling"
    ],
    "phase": 9,
    "lesson": 1,
    "lessonPath": "phases/09-reinforcement-learning/01-mdps-states-actions-rewards",
    "file": "phases/09-reinforcement-learning/01-mdps-states-actions-rewards/outputs/skill-mdp-modeler.md"
  },
  {
    "kind": "skill",
    "name": "dp-solver",
    "description": "通过 policy iteration 或 value iteration 精确求解一个小型 tabular MDP。报告 convergence behavior。",
    "tags": [
      "rl",
      "dynamic-programming",
      "bellman"
    ],
    "phase": 9,
    "lesson": 2,
    "lessonPath": "phases/09-reinforcement-learning/02-dynamic-programming",
    "file": "phases/09-reinforcement-learning/02-dynamic-programming/outputs/skill-dp-solver.md"
  },
  {
    "kind": "skill",
    "name": "mc-evaluator",
    "description": "通过 Monte Carlo rollouts 评估 policy，并在可用时生成包含 DP comparison 的 convergence report。",
    "tags": [
      "rl",
      "monte-carlo",
      "evaluation"
    ],
    "phase": 9,
    "lesson": 3,
    "lessonPath": "phases/09-reinforcement-learning/03-monte-carlo-methods",
    "file": "phases/09-reinforcement-learning/03-monte-carlo-methods/outputs/skill-mc-evaluator.md"
  },
  {
    "kind": "skill",
    "name": "td-agent",
    "description": "为 tabular 或 small-feature RL 任务在 Q-learning、SARSA、Expected SARSA 之间做选择。",
    "tags": [
      "rl",
      "td-learning",
      "q-learning",
      "sarsa"
    ],
    "phase": 9,
    "lesson": 4,
    "lessonPath": "phases/09-reinforcement-learning/04-q-learning-sarsa",
    "file": "phases/09-reinforcement-learning/04-q-learning-sarsa/outputs/skill-td-agent.md"
  },
  {
    "kind": "skill",
    "name": "dqn-trainer",
    "description": "为离散动作 RL 任务生成 DQN 训练配置（buffer、target sync、ε schedule、reward clipping）。",
    "tags": [
      "rl",
      "dqn",
      "deep-rl"
    ],
    "phase": 9,
    "lesson": 5,
    "lessonPath": "phases/09-reinforcement-learning/05-dqn",
    "file": "phases/09-reinforcement-learning/05-dqn/outputs/skill-dqn-trainer.md"
  },
  {
    "kind": "skill",
    "name": "policy-gradient-trainer",
    "description": "为给定任务生成 REINFORCE / actor-critic / PPO 训练配置，并诊断 variance 问题。",
    "tags": [
      "rl",
      "policy-gradient",
      "reinforce"
    ],
    "phase": 9,
    "lesson": 6,
    "lessonPath": "phases/09-reinforcement-learning/06-policy-gradients-reinforce",
    "file": "phases/09-reinforcement-learning/06-policy-gradients-reinforce/outputs/skill-policy-gradient-trainer.md"
  },
  {
    "kind": "skill",
    "name": "actor-critic-trainer",
    "description": "为给定环境生成 A2C / A3C / GAE 配置，并指定 advantage estimation 和 loss weights。",
    "tags": [
      "rl",
      "actor-critic",
      "gae"
    ],
    "phase": 9,
    "lesson": 7,
    "lessonPath": "phases/09-reinforcement-learning/07-actor-critic-a2c-a3c",
    "file": "phases/09-reinforcement-learning/07-actor-critic-a2c-a3c/outputs/skill-actor-critic-trainer.md"
  },
  {
    "kind": "skill",
    "name": "ppo-trainer",
    "description": "为给定环境生成 PPO 训练配置和诊断计划。",
    "tags": [
      "rl",
      "ppo",
      "policy-gradient"
    ],
    "phase": 9,
    "lesson": 8,
    "lessonPath": "phases/09-reinforcement-learning/08-ppo",
    "file": "phases/09-reinforcement-learning/08-ppo/outputs/skill-ppo-trainer.md"
  },
  {
    "kind": "skill",
    "name": "rlhf-architect",
    "description": "为语言模型设计 RLHF / DPO / GRPO alignment pipeline，包括 RM、KL 和数据策略。",
    "tags": [
      "rl",
      "rlhf",
      "alignment",
      "llm"
    ],
    "phase": 9,
    "lesson": 9,
    "lessonPath": "phases/09-reinforcement-learning/09-reward-modeling-rlhf",
    "file": "phases/09-reinforcement-learning/09-reward-modeling-rlhf/outputs/skill-rlhf-architect.md"
  },
  {
    "kind": "skill",
    "name": "marl-architect",
    "description": "为给定任务选择合适的 multi-agent RL 机制（IPPO、CTDE、self-play、league）。",
    "tags": [
      "rl",
      "multi-agent",
      "marl",
      "self-play"
    ],
    "phase": 9,
    "lesson": 10,
    "lessonPath": "phases/09-reinforcement-learning/10-multi-agent-rl",
    "file": "phases/09-reinforcement-learning/10-multi-agent-rl/outputs/skill-marl-architect.md"
  },
  {
    "kind": "skill",
    "name": "sim2real-planner",
    "description": "为给定的 robot + task 规划 sim-to-real transfer pipeline，覆盖 DR、SI 和安全。",
    "tags": [
      "rl",
      "sim2real",
      "robotics",
      "domain-randomization"
    ],
    "phase": 9,
    "lesson": 11,
    "lessonPath": "phases/09-reinforcement-learning/11-sim-to-real-transfer",
    "file": "phases/09-reinforcement-learning/11-sim-to-real-transfer/outputs/skill-sim2real-planner.md"
  },
  {
    "kind": "skill",
    "name": "game-rl-designer",
    "description": "为给定 domain 设计 game-RL 或 reasoning-RL training pipeline（AlphaZero / MuZero / GRPO）。",
    "tags": [
      "rl",
      "alphazero",
      "muzero",
      "grpo",
      "self-play"
    ],
    "phase": 9,
    "lesson": 12,
    "lessonPath": "phases/09-reinforcement-learning/12-rl-for-games",
    "file": "phases/09-reinforcement-learning/12-rl-for-games/outputs/skill-game-rl-designer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tokenizer-analyzer",
    "description": "分析给定文本在不同模型和 Tokenizer 类型下的 Tokenization 效率",
    "tags": [],
    "phase": 10,
    "lesson": 1,
    "lessonPath": "phases/10-llms-from-scratch/01-tokenizers",
    "file": "phases/10-llms-from-scratch/01-tokenizers/outputs/prompt-tokenizer-analyzer.md"
  },
  {
    "kind": "skill",
    "name": "skill-tokenizer",
    "description": "为 LLM 项目选择和构建 Tokenizer",
    "tags": [
      "tokenizer",
      "bpe",
      "wordpiece",
      "sentencepiece",
      "llm",
      "nlp"
    ],
    "phase": 10,
    "lesson": 1,
    "lessonPath": "phases/10-llms-from-scratch/01-tokenizers",
    "file": "phases/10-llms-from-scratch/01-tokenizers/outputs/skill-tokenizer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tokenizer-builder",
    "description": "为 LLM 项目构建和调试生产级 Tokenizers",
    "tags": [
      "tokenizer",
      "bpe",
      "byte-level",
      "special-tokens",
      "chat-template",
      "multilingual"
    ],
    "phase": 10,
    "lesson": 2,
    "lessonPath": "phases/10-llms-from-scratch/02-building-a-tokenizer",
    "file": "phases/10-llms-from-scratch/02-building-a-tokenizer/outputs/prompt-tokenizer-builder.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-data-quality-checker",
    "description": "验证并调试 LLM 预训练 pipeline 中的数据质量",
    "tags": [
      "data-pipeline",
      "deduplication",
      "quality-filter",
      "pre-training",
      "llm",
      "data-cleaning"
    ],
    "phase": 10,
    "lesson": 3,
    "lessonPath": "phases/10-llms-from-scratch/03-data-pipelines",
    "file": "phases/10-llms-from-scratch/03-data-pipelines/outputs/prompt-data-quality-checker.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-gpt-architecture-analyzer",
    "description": "分析任何 GPT-style transformer 模型中的 architecture choices",
    "tags": [
      "gpt",
      "transformer",
      "architecture",
      "attention",
      "kv-cache",
      "scaling",
      "pre-training"
    ],
    "phase": 10,
    "lesson": 4,
    "lessonPath": "phases/10-llms-from-scratch/04-pre-training-mini-gpt",
    "file": "phases/10-llms-from-scratch/04-pre-training-mini-gpt/outputs/prompt-gpt-architecture-analyzer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-distributed-training-planner",
    "description": "根据模型大小和可用硬件规划一次 distributed training run",
    "tags": [
      "distributed-training",
      "fsdp",
      "deepspeed",
      "tensor-parallelism",
      "pipeline-parallelism",
      "scaling"
    ],
    "phase": 10,
    "lesson": 5,
    "lessonPath": "phases/10-llms-from-scratch/05-scaling-distributed",
    "file": "phases/10-llms-from-scratch/05-scaling-distributed/outputs/prompt-distributed-training-planner.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-sft-data-curator",
    "description": "为 supervised fine-tuning 设计和策划 instruction datasets",
    "tags": [
      "sft",
      "instruction-tuning",
      "fine-tuning",
      "data-curation",
      "alignment"
    ],
    "phase": 10,
    "lesson": 6,
    "lessonPath": "phases/10-llms-from-scratch/06-instruction-tuning-sft",
    "file": "phases/10-llms-from-scratch/06-instruction-tuning-sft/outputs/prompt-sft-data-curator.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-reward-model-designer",
    "description": "设计用于 RLHF alignment 的 reward model training pipelines",
    "tags": [
      "rlhf",
      "reward-model",
      "ppo",
      "alignment",
      "human-feedback",
      "preference-learning"
    ],
    "phase": 10,
    "lesson": 7,
    "lessonPath": "phases/10-llms-from-scratch/07-rlhf",
    "file": "phases/10-llms-from-scratch/07-rlhf/outputs/prompt-reward-model-designer.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-alignment-method-selector",
    "description": "为你的 use case 选择合适的 alignment method（SFT, RLHF, DPO, KTO, ORPO, SimPO）",
    "tags": [
      "alignment",
      "dpo",
      "rlhf",
      "kto",
      "orpo",
      "simpo",
      "preference-optimization",
      "fine-tuning"
    ],
    "phase": 10,
    "lesson": 8,
    "lessonPath": "phases/10-llms-from-scratch/08-dpo",
    "file": "phases/10-llms-from-scratch/08-dpo/outputs/prompt-alignment-method-selector.md"
  },
  {
    "kind": "skill",
    "name": "self-improvement-auditor",
    "description": "在 proposed self-improvement 或 constitutional AI pipeline 大规模运行之前进行审计。",
    "tags": [
      "alignment",
      "cai",
      "grpo",
      "rlhf",
      "self-improvement",
      "reward-hacking"
    ],
    "phase": 10,
    "lesson": 9,
    "lessonPath": "phases/10-llms-from-scratch/09-constitutional-ai-self-improvement",
    "file": "phases/10-llms-from-scratch/09-constitutional-ai-self-improvement/outputs/skill-self-improvement-auditor.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-eval-designer",
    "description": "为任何 LLM 任务设计自定义评估套件，包括测试用例、评分函数和通过/失败阈值",
    "tags": [],
    "phase": 10,
    "lesson": 10,
    "lessonPath": "phases/10-llms-from-scratch/10-evaluation",
    "file": "phases/10-llms-from-scratch/10-evaluation/outputs/prompt-eval-designer.md"
  },
  {
    "kind": "skill",
    "name": "skill-llm-evaluation",
    "description": "根据任务类型、预算和需求选择正确 LLM 评估策略的决策框架",
    "tags": [
      "evaluation",
      "evals",
      "benchmarks",
      "llm-as-judge",
      "elo",
      "metrics"
    ],
    "phase": 10,
    "lesson": 10,
    "lessonPath": "phases/10-llms-from-scratch/10-evaluation",
    "file": "phases/10-llms-from-scratch/10-evaluation/outputs/skill-llm-evaluation.md"
  },
  {
    "kind": "skill",
    "name": "skill-quantization",
    "description": "根据硬件、质量和延迟约束，为部署 LLMs 选择合适的 quantization 策略",
    "tags": [
      "quantization",
      "inference",
      "deployment",
      "optimization",
      "fp8",
      "int4",
      "int8",
      "gptq",
      "awq",
      "gguf"
    ],
    "phase": 10,
    "lesson": 11,
    "lessonPath": "phases/10-llms-from-scratch/11-quantization",
    "file": "phases/10-llms-from-scratch/11-quantization/outputs/skill-quantization.md"
  },
  {
    "kind": "skill",
    "name": "skill-inference-optimization",
    "description": "诊断并优化 LLM inference serving 的 throughput、latency 和 cost",
    "tags": [
      "inference",
      "kv-cache",
      "batching",
      "speculative-decoding",
      "vllm",
      "optimization"
    ],
    "phase": 10,
    "lesson": 12,
    "lessonPath": "phases/10-llms-from-scratch/12-inference-optimization",
    "file": "phases/10-llms-from-scratch/12-inference-optimization/outputs/skill-inference-optimization.md"
  },
  {
    "kind": "skill",
    "name": "llm-pipeline-reviewer",
    "description": "在一次数百万美元级运行前 review 端到端 LLM training pipeline manifest。",
    "tags": [
      "pipeline",
      "training",
      "manifest",
      "eval-gate",
      "cost",
      "rollback"
    ],
    "phase": 10,
    "lesson": 13,
    "lessonPath": "phases/10-llms-from-scratch/13-building-complete-llm-pipeline",
    "file": "phases/10-llms-from-scratch/13-building-complete-llm-pipeline/outputs/skill-llm-pipeline-reviewer.md"
  },
  {
    "kind": "skill",
    "name": "open-model-picker",
    "description": "为给定部署目标选择 open LLM family、量化方式和推理 stack。",
    "tags": [
      "open-models",
      "llama",
      "deepseek",
      "mixtral",
      "qwen",
      "gemma",
      "moe",
      "gqa",
      "mla",
      "quantization"
    ],
    "phase": 10,
    "lesson": 14,
    "lessonPath": "phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs",
    "file": "phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs/outputs/skill-open-model-picker.md"
  },
  {
    "kind": "skill",
    "name": "eagle3-tuner",
    "description": "为新的推理 workload 选择并调优 speculative decoding 策略（vanilla / Medusa / EAGLE-1/2/3 / lookahead）。",
    "tags": [
      "speculative-decoding",
      "eagle",
      "eagle-3",
      "medusa",
      "inference",
      "vllm",
      "sglang",
      "tensorrt-llm"
    ],
    "phase": 10,
    "lesson": 15,
    "lessonPath": "phases/10-llms-from-scratch/15-speculative-decoding-eagle3",
    "file": "phases/10-llms-from-scratch/15-speculative-decoding-eagle3/outputs/skill-eagle3-tuner.md"
  },
  {
    "kind": "skill",
    "name": "diff-attention-integrator",
    "description": "将 Differential Attention V2 添加到新的 pre-training run 或 LoRA fine-tune 的集成计划。",
    "tags": [
      "differential-attention",
      "diff-transformer",
      "long-context",
      "flash-attention",
      "pre-training",
      "lora"
    ],
    "phase": 10,
    "lesson": 16,
    "lessonPath": "phases/10-llms-from-scratch/16-differential-attention-v2",
    "file": "phases/10-llms-from-scratch/16-differential-attention-v2/outputs/skill-diff-attention-integrator.md"
  },
  {
    "kind": "skill",
    "name": "nsa-integrator",
    "description": "在 long-context pre-training run 中集成 Native Sparse Attention 的计划。",
    "tags": [
      "nsa",
      "sparse-attention",
      "long-context",
      "pre-training",
      "kernel-aligned",
      "deepseek"
    ],
    "phase": 10,
    "lesson": 17,
    "lessonPath": "phases/10-llms-from-scratch/17-native-sparse-attention",
    "file": "phases/10-llms-from-scratch/17-native-sparse-attention/outputs/skill-nsa-integrator.md"
  },
  {
    "kind": "skill",
    "name": "mtp-planner",
    "description": "为新的 pre-training run 规划 multi-token prediction 集成。",
    "tags": [
      "mtp",
      "multi-token-prediction",
      "deepseek-v3",
      "pre-training",
      "speculative-decoding"
    ],
    "phase": 10,
    "lesson": 18,
    "lessonPath": "phases/10-llms-from-scratch/18-multi-token-prediction",
    "file": "phases/10-llms-from-scratch/18-multi-token-prediction/outputs/skill-mtp-planner.md"
  },
  {
    "kind": "skill",
    "name": "dualpipe-planner",
    "description": "为 training cluster 规划 pipeline parallelism 策略（1F1B、Zero Bubble、DualPipe、DualPipeV）。",
    "tags": [
      "pipeline-parallelism",
      "dualpipe",
      "dualpipev",
      "zero-bubble",
      "expert-parallelism",
      "distributed-training"
    ],
    "phase": 10,
    "lesson": 19,
    "lessonPath": "phases/10-llms-from-scratch/19-dualpipe-parallelism",
    "file": "phases/10-llms-from-scratch/19-dualpipe-parallelism/outputs/skill-dualpipe-planner.md"
  },
  {
    "kind": "skill",
    "name": "deepseek-v3-reader",
    "description": "读取 DeepSeek-family config，并生成逐组件的架构分析。",
    "tags": [
      "deepseek-v3",
      "deepseek-r1",
      "mla",
      "moe",
      "mtp",
      "dualpipe",
      "architecture"
    ],
    "phase": 10,
    "lesson": 20,
    "lessonPath": "phases/10-llms-from-scratch/20-deepseek-v3-walkthrough",
    "file": "phases/10-llms-from-scratch/20-deepseek-v3-walkthrough/outputs/skill-deepseek-v3-reader.md"
  },
  {
    "kind": "skill",
    "name": "hybrid-picker",
    "description": "针对给定 workload，在 pure Transformer、Jamba-style hybrid 和 pure SSM 之间做选择。",
    "tags": [
      "jamba",
      "mamba",
      "ssm",
      "hybrid",
      "long-context",
      "memory-budget",
      "architecture"
    ],
    "phase": 10,
    "lesson": 21,
    "lessonPath": "phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer",
    "file": "phases/10-llms-from-scratch/21-jamba-hybrid-ssm-transformer/outputs/skill-hybrid-picker.md"
  },
  {
    "kind": "skill",
    "name": "parallel-inference-router",
    "description": "在 voting、tree-of-thought、multi-agent、Hogwild! 和 speculative decoding 策略之间路由 reasoning 工作负载。",
    "tags": [
      "parallel-inference",
      "hogwild",
      "speculative-decoding",
      "tree-of-thought",
      "multi-agent",
      "reasoning"
    ],
    "phase": 10,
    "lesson": 22,
    "lessonPath": "phases/10-llms-from-scratch/22-async-hogwild-inference",
    "file": "phases/10-llms-from-scratch/22-async-hogwild-inference/outputs/skill-parallel-inference-router.md"
  },
  {
    "kind": "skill",
    "name": "speculative-tuning",
    "description": "Profile 一个 decode 工作负载，并为 speculative decoding 选择 draft model、draft length K、temperature gate 和 fallback policy。",
    "tags": [
      "speculative-decoding",
      "draft-model",
      "alpha",
      "throughput",
      "inference",
      "decode-latency"
    ],
    "phase": 10,
    "lesson": 25,
    "lessonPath": "phases/10-llms-from-scratch/25-speculative-decoding",
    "file": "phases/10-llms-from-scratch/25-speculative-decoding/outputs/skill-speculative-tuning.md"
  },
  {
    "kind": "skill",
    "name": "checkpointing-planner",
    "description": "根据 training config 和 HBM budget，为每层选择 activation recomputation policy（none / selective / full / offload）。",
    "tags": [
      "gradient-checkpointing",
      "activation-recomputation",
      "selective-checkpoint",
      "fsdp-offload",
      "training-memory"
    ],
    "phase": 10,
    "lesson": 34,
    "lessonPath": "phases/10-llms-from-scratch/34-gradient-checkpointing",
    "file": "phases/10-llms-from-scratch/34-gradient-checkpointing/outputs/skill-checkpointing-planner.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-prompt-optimizer",
    "description": "接收一个 prompt 草稿，并使用经过验证的 prompt engineering pattern 对其进行重写，以在不同模型上获得最大效果",
    "tags": [],
    "phase": 11,
    "lesson": 1,
    "lessonPath": "phases/11-llm-engineering/01-prompt-engineering",
    "file": "phases/11-llm-engineering/01-prompt-engineering/outputs/prompt-prompt-optimizer.md"
  },
  {
    "kind": "skill",
    "name": "skill-prompt-patterns",
    "description": "根据任务类型、可靠性要求和目标 model 选择正确 prompt pattern 的决策框架",
    "tags": [
      "prompt-engineering",
      "patterns",
      "llm",
      "temperature",
      "cross-model",
      "few-shot",
      "chain-of-thought"
    ],
    "phase": 11,
    "lesson": 1,
    "lessonPath": "phases/11-llm-engineering/01-prompt-engineering",
    "file": "phases/11-llm-engineering/01-prompt-engineering/outputs/skill-prompt-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-reasoning-chain",
    "description": "适用于生产环境的 few-shot CoT prompt，支持用于多步骤推理任务的 self-consistency",
    "tags": [],
    "phase": 11,
    "lesson": 2,
    "lessonPath": "phases/11-llm-engineering/02-few-shot-cot",
    "file": "phases/11-llm-engineering/02-few-shot-cot/outputs/prompt-reasoning-chain.md"
  },
  {
    "kind": "skill",
    "name": "skill-cot-patterns",
    "description": "基于任务复杂度、准确率要求和成本约束选择合适推理技术的决策框架",
    "tags": [
      "chain-of-thought",
      "few-shot",
      "self-consistency",
      "tree-of-thought",
      "react",
      "reasoning",
      "prompting"
    ],
    "phase": 11,
    "lesson": 2,
    "lessonPath": "phases/11-llm-engineering/02-few-shot-cot",
    "file": "phases/11-llm-engineering/02-few-shot-cot/outputs/skill-cot-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-structured-extractor",
    "description": "根据 JSON Schema 定义从非结构化文本中提取结构化数据",
    "tags": [],
    "phase": 11,
    "lesson": 3,
    "lessonPath": "phases/11-llm-engineering/03-structured-outputs",
    "file": "phases/11-llm-engineering/03-structured-outputs/outputs/prompt-structured-extractor.md"
  },
  {
    "kind": "skill",
    "name": "skill-structured-outputs",
    "description": "基于 provider、可靠性和复杂度选择正确 structured output 策略的决策框架",
    "tags": [
      "structured-output",
      "json",
      "schema",
      "constrained-decoding",
      "pydantic",
      "function-calling"
    ],
    "phase": 11,
    "lesson": 3,
    "lessonPath": "phases/11-llm-engineering/03-structured-outputs",
    "file": "phases/11-llm-engineering/03-structured-outputs/outputs/skill-structured-outputs.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-embedding-advisor",
    "description": "针对具体用例选择 Embedding models、维度和策略",
    "tags": [],
    "phase": 11,
    "lesson": 4,
    "lessonPath": "phases/11-llm-engineering/04-embeddings",
    "file": "phases/11-llm-engineering/04-embeddings/outputs/prompt-embedding-advisor.md"
  },
  {
    "kind": "skill",
    "name": "skill-embedding-patterns",
    "description": "Embedding、Vector search 和相似度的生产环境模式",
    "tags": [
      "embeddings",
      "vectors",
      "similarity",
      "search",
      "chunking",
      "quantization"
    ],
    "phase": 11,
    "lesson": 4,
    "lessonPath": "phases/11-llm-engineering/04-embeddings",
    "file": "phases/11-llm-engineering/04-embeddings/outputs/skill-embedding-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-context-optimizer",
    "description": "审计上下文组装策略，并推荐优化方案以减少 Token 浪费、提升响应质量",
    "tags": [],
    "phase": 11,
    "lesson": 5,
    "lessonPath": "phases/11-llm-engineering/05-context-engineering",
    "file": "phases/11-llm-engineering/05-context-engineering/outputs/prompt-context-optimizer.md"
  },
  {
    "kind": "skill",
    "name": "skill-context-engineering",
    "description": "基于任务类型、窗口大小和延迟预算设计上下文组装 pipeline 的决策框架",
    "tags": [
      "context-engineering",
      "context-window",
      "rag",
      "memory",
      "tool-selection",
      "lost-in-the-middle"
    ],
    "phase": 11,
    "lesson": 5,
    "lessonPath": "phases/11-llm-engineering/05-context-engineering",
    "file": "phases/11-llm-engineering/05-context-engineering/outputs/skill-context-engineering.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-rag-architect",
    "description": "为特定 use cases 设计 RAG systems，并做出具体的 architecture 决策",
    "tags": [],
    "phase": 11,
    "lesson": 6,
    "lessonPath": "phases/11-llm-engineering/06-rag",
    "file": "phases/11-llm-engineering/06-rag/outputs/prompt-rag-architect.md"
  },
  {
    "kind": "skill",
    "name": "skill-rag-pipeline",
    "description": "从第一性原理构建和调试 RAG pipelines",
    "tags": [
      "rag",
      "retrieval",
      "embeddings",
      "vector-search",
      "llm-engineering"
    ],
    "phase": 11,
    "lesson": 6,
    "lessonPath": "phases/11-llm-engineering/06-rag",
    "file": "phases/11-llm-engineering/06-rag/outputs/skill-rag-pipeline.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-advanced-rag-debugger",
    "description": "诊断并修复 RAG 在检索、生成和评估中的质量问题",
    "tags": [],
    "phase": 11,
    "lesson": 7,
    "lessonPath": "phases/11-llm-engineering/07-advanced-rag",
    "file": "phases/11-llm-engineering/07-advanced-rag/outputs/prompt-advanced-rag-debugger.md"
  },
  {
    "kind": "skill",
    "name": "skill-advanced-rag",
    "description": "使用 hybrid search、reranking 和 evaluation 构建生产级 RAG",
    "tags": [
      "rag",
      "hybrid-search",
      "bm25",
      "reranking",
      "hyde",
      "evaluation"
    ],
    "phase": 11,
    "lesson": 7,
    "lessonPath": "phases/11-llm-engineering/07-advanced-rag",
    "file": "phases/11-llm-engineering/07-advanced-rag/outputs/skill-advanced-rag.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-lora-advisor",
    "description": "为特定 fine-tuning 任务决定 LoRA rank、target modules 和 hyperparameters",
    "tags": [],
    "phase": 11,
    "lesson": 8,
    "lessonPath": "phases/11-llm-engineering/08-fine-tuning-lora",
    "file": "phases/11-llm-engineering/08-fine-tuning-lora/outputs/prompt-lora-advisor.md"
  },
  {
    "kind": "skill",
    "name": "skill-fine-tuning-guide",
    "description": "使用 LoRA 和 QLoRA 对 LLMs 进行 fine-tune 的时机与方法决策树",
    "tags": [
      "fine-tuning",
      "lora",
      "qlora",
      "peft",
      "llm-engineering"
    ],
    "phase": 11,
    "lesson": 8,
    "lessonPath": "phases/11-llm-engineering/08-fine-tuning-lora",
    "file": "phases/11-llm-engineering/08-fine-tuning-lora/outputs/skill-fine-tuning-guide.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-tool-designer",
    "description": "依据自然语言描述，为 function calling 设计完整的工具定义（JSON Schema）",
    "tags": [],
    "phase": 11,
    "lesson": 9,
    "lessonPath": "phases/11-llm-engineering/09-function-calling",
    "file": "phases/11-llm-engineering/09-function-calling/outputs/prompt-tool-designer.md"
  },
  {
    "kind": "skill",
    "name": "skill-function-calling-patterns",
    "description": "在生产中实现 function calling 的决策框架 -- 工具设计、错误处理、安全性和 provider 模式",
    "tags": [
      "function-calling",
      "tool-use",
      "agents",
      "mcp",
      "security",
      "openai",
      "anthropic"
    ],
    "phase": 11,
    "lesson": 9,
    "lessonPath": "phases/11-llm-engineering/09-function-calling",
    "file": "phases/11-llm-engineering/09-function-calling/outputs/skill-function-calling-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-eval-designer",
    "description": "根据 use case 描述，为 LLM applications 设计定制的 evaluation rubrics 和 test suites",
    "tags": [],
    "phase": 11,
    "lesson": 10,
    "lessonPath": "phases/11-llm-engineering/10-evaluation",
    "file": "phases/11-llm-engineering/10-evaluation/outputs/prompt-eval-designer.md"
  },
  {
    "kind": "skill",
    "name": "skill-eval-patterns",
    "description": "用于选择 evaluation 策略的决策框架 -- 何时使用哪种方法、如何确定测试套件规模，以及如何将 evals 集成到 CI/CD",
    "tags": [
      "evaluation",
      "testing",
      "llm-as-judge",
      "regression",
      "confidence-intervals",
      "ci-cd"
    ],
    "phase": 11,
    "lesson": 10,
    "lessonPath": "phases/11-llm-engineering/10-evaluation",
    "file": "phases/11-llm-engineering/10-evaluation/outputs/skill-eval-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-cost-optimizer",
    "description": "分析一个 LLM 应用，并推荐具体的成本优化方案及预计节省金额",
    "tags": [],
    "phase": 11,
    "lesson": 11,
    "lessonPath": "phases/11-llm-engineering/11-caching-cost",
    "file": "phases/11-llm-engineering/11-caching-cost/outputs/prompt-cost-optimizer.md"
  },
  {
    "kind": "skill",
    "name": "skill-cost-patterns",
    "description": "LLM 成本优化决策框架 -- caching 策略、rate limiting、model routing 和预算控制",
    "tags": [
      "caching",
      "cost-optimization",
      "rate-limiting",
      "model-routing",
      "budget",
      "llm-ops"
    ],
    "phase": 11,
    "lesson": 11,
    "lessonPath": "phases/11-llm-engineering/11-caching-cost",
    "file": "phases/11-llm-engineering/11-caching-cost/outputs/skill-cost-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-safety-auditor",
    "description": "审计任何 LLM 应用的安全漏洞 -- prompt injection、数据泄漏、jailbreaks 和输出风险",
    "tags": [],
    "phase": 11,
    "lesson": 12,
    "lessonPath": "phases/11-llm-engineering/12-guardrails",
    "file": "phases/11-llm-engineering/12-guardrails/outputs/prompt-safety-auditor.md"
  },
  {
    "kind": "skill",
    "name": "skill-guardrail-patterns",
    "description": "用于在生产环境中选择和实现 guardrails 的决策框架 -- 工具选择、分层策略和成本性能权衡",
    "tags": [
      "guardrails",
      "safety",
      "content-filtering",
      "prompt-injection",
      "pii",
      "moderation",
      "llamaguard",
      "nemo"
    ],
    "phase": 11,
    "lesson": 12,
    "lessonPath": "phases/11-llm-engineering/12-guardrails",
    "file": "phases/11-llm-engineering/12-guardrails/outputs/skill-guardrail-patterns.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-architecture-reviewer",
    "description": "根据 production readiness checklist 审查任意 LLM application 的架构 -- 识别缺口、风险和缺失组件",
    "tags": [],
    "phase": 11,
    "lesson": 13,
    "lessonPath": "phases/11-llm-engineering/13-production-app",
    "file": "phases/11-llm-engineering/13-production-app/outputs/prompt-architecture-reviewer.md"
  },
  {
    "kind": "skill",
    "name": "skill-production-checklist",
    "description": "用于将 LLM applications 发布到 production 的决策框架 -- 覆盖每个组件，并提供具体阈值与 pass/fail criteria",
    "tags": [
      "production",
      "deployment",
      "llm",
      "architecture",
      "scaling",
      "cost",
      "observability",
      "guardrails"
    ],
    "phase": 11,
    "lesson": 13,
    "lessonPath": "phases/11-llm-engineering/13-production-app",
    "file": "phases/11-llm-engineering/13-production-app/outputs/skill-production-checklist.md"
  },
  {
    "kind": "skill",
    "name": "mcp-server-designer",
    "description": "设计并搭建一个具备 tools、resources 和安全默认设置的 MCP server。",
    "tags": [
      "llm-engineering",
      "mcp",
      "tool-use"
    ],
    "phase": 11,
    "lesson": 14,
    "lessonPath": "phases/11-llm-engineering/14-model-context-protocol",
    "file": "phases/11-llm-engineering/14-model-context-protocol/outputs/skill-mcp-server-designer.md"
  },
  {
    "kind": "skill",
    "name": "prompt-caching-planner",
    "description": "设计一种缓存友好的 prompt 布局，并选择正确的 provider 缓存模式。",
    "tags": [
      "llm-engineering",
      "caching",
      "cost"
    ],
    "phase": 11,
    "lesson": 15,
    "lessonPath": "phases/11-llm-engineering/15-prompt-caching",
    "file": "phases/11-llm-engineering/15-prompt-caching/outputs/skill-prompt-caching-planner.md"
  },
  {
    "kind": "skill",
    "name": "stategraph-designer",
    "description": "将一个 agent 任务转换为带有命名 nodes、typed state、reducers、checkpointer 和 human interrupts 的 LangGraph StateGraph。",
    "tags": [
      "langgraph",
      "stategraph",
      "checkpointer",
      "interrupt",
      "time-travel",
      "react-agent",
      "human-in-the-loop"
    ],
    "phase": 11,
    "lesson": 16,
    "lessonPath": "phases/11-llm-engineering/16-langgraph-state-machines",
    "file": "phases/11-llm-engineering/16-langgraph-state-machines/outputs/skill-stategraph-designer.md"
  },
  {
    "kind": "skill",
    "name": "framework-picker",
    "description": "根据 abstraction 与 problem shape 的匹配，为 agent task 选择 LangGraph、CrewAI、AutoGen、Agno 或 plain Python。",
    "tags": [
      "langgraph",
      "crewai",
      "autogen",
      "agno",
      "agent-framework",
      "orchestration",
      "decision-matrix"
    ],
    "phase": 11,
    "lesson": 17,
    "lessonPath": "phases/11-llm-engineering/17-agent-framework-tradeoffs",
    "file": "phases/11-llm-engineering/17-agent-framework-tradeoffs/outputs/skill-framework-picker.md"
  },
  {
    "kind": "skill",
    "name": "patch-geometry-reader",
    "description": "读取 ViT config，并为下游 VLM 规划生成 patch-token、参数和 VRAM 分析。",
    "tags": [
      "vit",
      "patch-tokens",
      "dinov2",
      "siglip",
      "vlm-backbone"
    ],
    "phase": 12,
    "lesson": 1,
    "lessonPath": "phases/12-multimodal-ai/01-vision-transformer-patch-tokens",
    "file": "phases/12-multimodal-ai/01-vision-transformer-patch-tokens/outputs/skill-patch-geometry-reader.md"
  },
  {
    "kind": "skill",
    "name": "clip-zero-shot",
    "description": "使用 CLIP / SigLIP checkpoint 运行 zero-shot 图像分类，生成带相似度分数的排序预测。",
    "tags": [
      "clip",
      "siglip",
      "zero-shot",
      "vision-language"
    ],
    "phase": 12,
    "lesson": 2,
    "lessonPath": "phases/12-multimodal-ai/02-clip-contrastive-pretraining",
    "file": "phases/12-multimodal-ai/02-clip-contrastive-pretraining/outputs/skill-clip-zero-shot.md"
  },
  {
    "kind": "skill",
    "name": "modality-bridge-picker",
    "description": "根据 Token 预算、质量目标和训练算力，为 VLM 配置推荐 Q-Former、MLP projector 或 Perceiver resampler。",
    "tags": [
      "blip2",
      "qformer",
      "vlm",
      "modality-bridge",
      "architecture"
    ],
    "phase": 12,
    "lesson": 3,
    "lessonPath": "phases/12-multimodal-ai/03-blip2-qformer-bridge",
    "file": "phases/12-multimodal-ai/03-blip2-qformer-bridge/outputs/skill-modality-bridge-picker.md"
  },
  {
    "kind": "skill",
    "name": "gated-bridge-diagnostic",
    "description": "识别 open VLM config 中的 Flamingo-lineage 设计元素，并诊断 freezing / gating 问题。",
    "tags": [
      "flamingo",
      "idefics",
      "openflamingo",
      "gated-cross-attention",
      "interleaved-inputs"
    ],
    "phase": 12,
    "lesson": 4,
    "lessonPath": "phases/12-multimodal-ai/04-flamingo-gated-cross-attention",
    "file": "phases/12-multimodal-ai/04-flamingo-gated-cross-attention/outputs/skill-gated-bridge-diagnostic.md"
  },
  {
    "kind": "skill",
    "name": "llava-vibes-eval",
    "description": "在 LLaVA-family VLM 上运行 10 个 prompt 的 vibes-eval，并生成一份人类可读的评分卡。",
    "tags": [
      "llava",
      "vlm",
      "vibes-eval",
      "instruction-tuning"
    ],
    "phase": 12,
    "lesson": 5,
    "lessonPath": "phases/12-multimodal-ai/05-llava-visual-instruction-tuning",
    "file": "phases/12-multimodal-ai/05-llava-visual-instruction-tuning/outputs/skill-llava-vibes-eval.md"
  },
  {
    "kind": "skill",
    "name": "resolution-budget-planner",
    "description": "为 mixed-aspect-ratio VLM workload 在 square-resize、AnyRes、M-RoPE 和 NaFlex 之间做选择，并输出 per-task token budget plan。",
    "tags": [
      "vlm",
      "patch-n-pack",
      "naflex",
      "anyres",
      "m-rope",
      "token-budget"
    ],
    "phase": 12,
    "lesson": 6,
    "lessonPath": "phases/12-multimodal-ai/06-any-resolution-patch-n-pack",
    "file": "phases/12-multimodal-ai/06-any-resolution-patch-n-pack/outputs/skill-resolution-budget-planner.md"
  },
  {
    "kind": "skill",
    "name": "vlm-recipe-picker",
    "description": "选择一个开放权重 VLM 配方（encoder、connector、LLM、data mix、resolution schedule），并为每个选择附上消融表引用。",
    "tags": [
      "vlm",
      "mm1",
      "idefics2",
      "molmo",
      "cambrian",
      "prismatic",
      "ablation"
    ],
    "phase": 12,
    "lesson": 7,
    "lessonPath": "phases/12-multimodal-ai/07-open-weight-vlm-recipes",
    "file": "phases/12-multimodal-ai/07-open-weight-vlm-recipes/outputs/skill-vlm-recipe-picker.md"
  },
  {
    "kind": "skill",
    "name": "onevision-budget-planner",
    "description": "为目标产品组合，在单图像、多图像和视频场景之间分配 LLaVA-OneVision-style 统一视觉 Token 预算。",
    "tags": [
      "llava-onevision",
      "token-budget",
      "curriculum",
      "multi-image",
      "video"
    ],
    "phase": 12,
    "lesson": 8,
    "lessonPath": "phases/12-multimodal-ai/08-llava-onevision-single-multi-video",
    "file": "phases/12-multimodal-ai/08-llava-onevision-single-multi-video/outputs/skill-onevision-budget-planner.md"
  },
  {
    "kind": "skill",
    "name": "qwen-vl-pipeline-designer",
    "description": "为目标视频或图像任务配置 Qwen2.5-VL 或 Qwen3-VL 部署：resolution bounds、dynamic-FPS policy、window-attention flag，以及 JSON agent output mode。",
    "tags": [
      "qwen-vl",
      "m-rope",
      "dynamic-fps",
      "json-agent",
      "video-understanding"
    ],
    "phase": 12,
    "lesson": 9,
    "lessonPath": "phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps",
    "file": "phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/outputs/skill-qwen-vl-pipeline-designer.md"
  },
  {
    "kind": "skill",
    "name": "native-vs-posthoc-auditor",
    "description": "审计一个拟议的 VLM 训练计划，并推荐 native multimodal pretraining 或 post-hoc adapter-on-LLM，同时进行 corpus-mix 和 alignment-debt 分析。",
    "tags": [
      "internvl3",
      "native-pretraining",
      "post-hoc",
      "corpus-mix",
      "alignment-debt"
    ],
    "phase": 12,
    "lesson": 10,
    "lessonPath": "phases/12-multimodal-ai/10-internvl3-native-multimodal",
    "file": "phases/12-multimodal-ai/10-internvl3-native-multimodal/outputs/skill-native-vs-posthoc-auditor.md"
  },
  {
    "kind": "skill",
    "name": "tokenizer-vs-adapter-picker",
    "description": "为 VLM 项目在 Chameleon-style early fusion（shared-vocab tokenizer）和 LLaVA-style late fusion（frozen LLM 上的 adapter）之间做选择。",
    "tags": [
      "chameleon",
      "early-fusion",
      "vq-vae",
      "late-fusion",
      "adapter"
    ],
    "phase": 12,
    "lesson": 11,
    "lessonPath": "phases/12-multimodal-ai/11-chameleon-early-fusion-tokens",
    "file": "phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/outputs/skill-tokenizer-vs-adapter-picker.md"
  },
  {
    "kind": "skill",
    "name": "token-gen-cost-analyzer",
    "description": "计算 Emu3 风格 next-token generation 的 Token 数量、推理延迟和质量上限，并在 Emu3-family 与 diffusion 之间做选择。",
    "tags": [
      "emu3",
      "next-token-prediction",
      "video-gen",
      "diffusion",
      "cfg"
    ],
    "phase": 12,
    "lesson": 12,
    "lessonPath": "phases/12-multimodal-ai/12-emu3-next-token-for-generation",
    "file": "phases/12-multimodal-ai/12-emu3-next-token-for-generation/outputs/skill-token-gen-cost-analyzer.md"
  },
  {
    "kind": "skill",
    "name": "two-loss-trainer-designer",
    "description": "设计一个 Transfusion / MMDiT 风格的 two-loss 训练设置（一个 modality 使用 NTP，另一个使用 Diffusion），包括 Loss 权重、mask 设计和 schedule。",
    "tags": [
      "transfusion",
      "mmdit",
      "two-loss",
      "flow-matching",
      "hybrid-attention"
    ],
    "phase": 12,
    "lesson": 13,
    "lessonPath": "phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion",
    "file": "phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/outputs/skill-two-loss-trainer-designer.md"
  },
  {
    "kind": "skill",
    "name": "unified-gen-model-picker",
    "description": "为一个既需要 Multimodal 理解又需要生成、且要求 open weights 的产品，在 Show-o / Transfusion / Emu3 / Janus-Pro 系列之间做选择。",
    "tags": [
      "show-o",
      "masked-diffusion",
      "unified",
      "t2i",
      "inpainting"
    ],
    "phase": 12,
    "lesson": 14,
    "lessonPath": "phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified",
    "file": "phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/outputs/skill-unified-gen-model-picker.md"
  },
  {
    "kind": "skill",
    "name": "decoupled-encoder-picker",
    "description": "判断 unified VLM 是否应解耦其 visual encoders，并在 Janus-Pro、JanusFlow 和 InternVL-U 之间选择。",
    "tags": [
      "janus-pro",
      "janusflow",
      "internvl-u",
      "decoupled-encoders",
      "unified-model"
    ],
    "phase": 12,
    "lesson": 15,
    "lessonPath": "phases/12-multimodal-ai/15-janus-pro-decoupled-encoders",
    "file": "phases/12-multimodal-ai/15-janus-pro-decoupled-encoders/outputs/skill-decoupled-encoder-picker.md"
  },
  {
    "kind": "skill",
    "name": "any-to-any-pipeline-auditor",
    "description": "审计一个对话式 any-to-any 设计，并计算 MIO / AnyGPT / Moshi-family stack 的延迟预算。",
    "tags": [
      "mio",
      "anygpt",
      "moshi",
      "any-to-any",
      "streaming",
      "ttfab"
    ],
    "phase": 12,
    "lesson": 16,
    "lessonPath": "phases/12-multimodal-ai/16-mio-any-to-any-streaming",
    "file": "phases/12-multimodal-ai/16-mio-any-to-any-streaming/outputs/skill-any-to-any-pipeline-auditor.md"
  },
  {
    "kind": "skill",
    "name": "video-vlm-frame-planner",
    "description": "为 video-language model 部署规划帧采样、逐帧 pooling、输出格式和 benchmark 目标。",
    "tags": [
      "video-vlm",
      "temporal-grounding",
      "tmrope",
      "dynamic-fps",
      "benchmarks"
    ],
    "phase": 12,
    "lesson": 17,
    "lessonPath": "phases/12-multimodal-ai/17-video-language-temporal-grounding",
    "file": "phases/12-multimodal-ai/17-video-language-temporal-grounding/outputs/skill-video-vlm-frame-planner.md"
  },
  {
    "kind": "skill",
    "name": "long-video-strategy-planner",
    "description": "为长视频理解任务选择 brute-context、ring-attention、token-compression 或 agentic-retrieval，并计算 latency + recall 预期。",
    "tags": [
      "long-video",
      "gemini",
      "ring-attention",
      "videoagent",
      "retrieval"
    ],
    "phase": 12,
    "lesson": 18,
    "lessonPath": "phases/12-multimodal-ai/18-long-video-million-token",
    "file": "phases/12-multimodal-ai/18-long-video-million-token/outputs/skill-long-video-strategy-planner.md"
  },
  {
    "kind": "skill",
    "name": "audio-llm-pipeline-picker",
    "description": "为音频任务选择级联式（Whisper + LLM）或端到端（AF3 / Qwen-Audio）方案，并给出 encoder 和 bridge 配置。",
    "tags": [
      "whisper",
      "audio-flamingo-3",
      "qwen-audio",
      "cascaded",
      "end-to-end"
    ],
    "phase": 12,
    "lesson": 19,
    "lessonPath": "phases/12-multimodal-ai/19-audio-language-whisper-to-af3",
    "file": "phases/12-multimodal-ai/19-audio-language-whisper-to-af3/outputs/skill-audio-llm-pipeline-picker.md"
  },
  {
    "kind": "skill",
    "name": "omni-streaming-budget",
    "description": "为目标 TTFAB 和功能集估算 Thinker-Talker 流式语音 pipeline（Qwen-Omni / Moshi / Mini-Omni）的规模。",
    "tags": [
      "qwen-omni",
      "moshi",
      "mini-omni",
      "streaming",
      "ttfab",
      "thinker-talker"
    ],
    "phase": 12,
    "lesson": 20,
    "lessonPath": "phases/12-multimodal-ai/20-omni-models-thinker-talker",
    "file": "phases/12-multimodal-ai/20-omni-models-thinker-talker/outputs/skill-omni-streaming-budget.md"
  },
  {
    "kind": "skill",
    "name": "vla-action-format-picker",
    "description": "为机器人任务选择 action format（discrete bin、FAST、flow-matching、dual-system）和 VLA family（RT-2、OpenVLA、π0、GR00T）。",
    "tags": [
      "vla",
      "rt-2",
      "openvla",
      "pi0",
      "groot",
      "action-tokenization"
    ],
    "phase": 12,
    "lesson": 21,
    "lessonPath": "phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot",
    "file": "phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/outputs/skill-vla-action-format-picker.md"
  },
  {
    "kind": "skill",
    "name": "document-ai-stack-picker",
    "description": "根据领域、规模和监管需求，为 document-AI 项目在 OCR pipeline、OCR-free specialist 和 VLM-native 之间做选择。",
    "tags": [
      "document-ai",
      "ocr",
      "donut",
      "nougat",
      "paligemma",
      "vlm-native"
    ],
    "phase": 12,
    "lesson": 22,
    "lessonPath": "phases/12-multimodal-ai/22-document-diagram-understanding",
    "file": "phases/12-multimodal-ai/22-document-diagram-understanding/outputs/skill-document-ai-stack-picker.md"
  },
  {
    "kind": "skill",
    "name": "vision-rag-designer",
    "description": "使用 ColPali / ColQwen2 / VisRAG 设计一个 vision-native document RAG，并包含存储估算和 generator 选择。",
    "tags": [
      "colpali",
      "colqwen2",
      "visrag",
      "late-interaction",
      "vidore"
    ],
    "phase": 12,
    "lesson": 23,
    "lessonPath": "phases/12-multimodal-ai/23-colpali-vision-native-rag",
    "file": "phases/12-multimodal-ai/23-colpali-vision-native-rag/outputs/skill-vision-rag-designer.md"
  },
  {
    "kind": "skill",
    "name": "multimodal-rag-designer",
    "description": "设计一个生产级 Multimodal RAG，覆盖 text、images、audio、video，并包含 retrievers、fusion strategy 和 grounded generator。",
    "tags": [
      "multimodal-rag",
      "cross-modal-retrieval",
      "fusion",
      "grounded-generation"
    ],
    "phase": 12,
    "lesson": 24,
    "lessonPath": "phases/12-multimodal-ai/24-multimodal-rag-cross-modal",
    "file": "phases/12-multimodal-ai/24-multimodal-rag-cross-modal/outputs/skill-multimodal-rag-designer.md"
  },
  {
    "kind": "skill",
    "name": "multimodal-agent-designer",
    "description": "设计一个 Multimodal agent（computer-use、GUI grounding、web 或 mobile），包含 action schema、记忆策略和 benchmark 评估计划。",
    "tags": [
      "multimodal-agents",
      "computer-use",
      "gui-grounding",
      "visualwebarena",
      "agentvista"
    ],
    "phase": 12,
    "lesson": 25,
    "lessonPath": "phases/12-multimodal-ai/25-multimodal-agents-computer-use",
    "file": "phases/12-multimodal-ai/25-multimodal-agents-computer-use/outputs/skill-multimodal-agent-designer.md"
  },
  {
    "kind": "skill",
    "name": "tool-interface-reviewer",
    "description": "在 tool definition（name + description + JSON Schema + executor outline）交付给 LLM 之前，审计其 loop 适配性。",
    "tags": [
      "tool-calling",
      "function-calling",
      "json-schema",
      "tool-design"
    ],
    "phase": 13,
    "lesson": 1,
    "lessonPath": "phases/13-tools-and-protocols/01-the-tool-interface",
    "file": "phases/13-tools-and-protocols/01-the-tool-interface/outputs/skill-tool-interface-reviewer.md"
  },
  {
    "kind": "skill",
    "name": "provider-portability-audit",
    "description": "审计针对某个 provider 的 function-calling 集成，判断移植到另外两个 provider 时会破坏什么。",
    "tags": [
      "function-calling",
      "openai",
      "anthropic",
      "gemini",
      "portability"
    ],
    "phase": 13,
    "lesson": 2,
    "lessonPath": "phases/13-tools-and-protocols/02-function-calling-deep-dive",
    "file": "phases/13-tools-and-protocols/02-function-calling-deep-dive/outputs/skill-provider-portability-audit.md"
  },
  {
    "kind": "skill",
    "name": "parallel-call-safety-check",
    "description": "审计工具注册表，判断是否可以安全并行化。为每个工具标记 parallel_safe，注明顺序依赖，并标出下游速率限制风险。",
    "tags": [
      "parallel-tool-calls",
      "streaming",
      "correlation",
      "rate-limits"
    ],
    "phase": 13,
    "lesson": 3,
    "lessonPath": "phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls",
    "file": "phases/13-tools-and-protocols/03-parallel-and-streaming-tool-calls/outputs/skill-parallel-call-safety-check.md"
  },
  {
    "kind": "skill",
    "name": "structured-output-designer",
    "description": "为自由文本提取目标设计兼容 strict-mode 的 JSON Schema 和 Pydantic model，并加入 typed refusal 与 retry handling stub。",
    "tags": [
      "structured-output",
      "json-schema",
      "pydantic",
      "strict-mode",
      "extraction"
    ],
    "phase": 13,
    "lesson": 4,
    "lessonPath": "phases/13-tools-and-protocols/04-structured-output",
    "file": "phases/13-tools-and-protocols/04-structured-output/outputs/skill-structured-output-designer.md"
  },
  {
    "kind": "skill",
    "name": "tool-schema-linter",
    "description": "按照生产设计规则审计 tool registry，覆盖名称、描述、参数和形状。可以在每次 tool-registry 变更时于 CI 中运行。",
    "tags": [
      "tool-design",
      "linter",
      "selection-accuracy",
      "naming"
    ],
    "phase": 13,
    "lesson": 5,
    "lessonPath": "phases/13-tools-and-protocols/05-tool-schema-design",
    "file": "phases/13-tools-and-protocols/05-tool-schema-design/outputs/skill-tool-schema-linter.md"
  },
  {
    "kind": "skill",
    "name": "mcp-handshake-tracer",
    "description": "给定 MCP client-server 对话的 pcap-style transcript，标注每条消息的 primitive、lifecycle phase 和 capability dependency。",
    "tags": [
      "mcp",
      "json-rpc",
      "lifecycle",
      "capabilities"
    ],
    "phase": 13,
    "lesson": 6,
    "lessonPath": "phases/13-tools-and-protocols/06-mcp-fundamentals",
    "file": "phases/13-tools-and-protocols/06-mcp-fundamentals/outputs/skill-mcp-handshake-tracer.md"
  },
  {
    "kind": "skill",
    "name": "mcp-server-scaffolder",
    "description": "为特定领域 scaffold 一个 MCP server，并规划正确的 tools/resources/prompts 拆分和 SDK graduation 路径。",
    "tags": [
      "mcp",
      "server",
      "fastmcp",
      "scaffold"
    ],
    "phase": 13,
    "lesson": 7,
    "lessonPath": "phases/13-tools-and-protocols/07-building-an-mcp-server",
    "file": "phases/13-tools-and-protocols/07-building-an-mcp-server/outputs/skill-mcp-server-scaffolder.md"
  },
  {
    "kind": "skill",
    "name": "mcp-client-harness",
    "description": "给定一个 MCP servers 的声明式列表（name、command、args），搭建一个具备 handshake、namespace merge 和 routing 的多 server client。",
    "tags": [
      "mcp",
      "client",
      "multi-server",
      "routing",
      "namespace"
    ],
    "phase": 13,
    "lesson": 8,
    "lessonPath": "phases/13-tools-and-protocols/08-building-an-mcp-client",
    "file": "phases/13-tools-and-protocols/08-building-an-mcp-client/outputs/skill-mcp-client-harness.md"
  },
  {
    "kind": "skill",
    "name": "mcp-transport-migrator",
    "description": "生成从 legacy HTTP+SSE 迁移到 Streamable HTTP 的迁移计划，并保持 session id 连续性和 Origin validation。",
    "tags": [
      "mcp",
      "streamable-http",
      "sse-migration",
      "session-id",
      "origin"
    ],
    "phase": 13,
    "lesson": 9,
    "lessonPath": "phases/13-tools-and-protocols/09-mcp-transports",
    "file": "phases/13-tools-and-protocols/09-mcp-transports/outputs/skill-mcp-transport-migrator.md"
  },
  {
    "kind": "skill",
    "name": "primitive-splitter",
    "description": "将 MCP server 草稿中的每项能力分类为 tool、resource 或 prompt，并给出理由。",
    "tags": [
      "mcp",
      "primitives",
      "resources",
      "prompts"
    ],
    "phase": 13,
    "lesson": 10,
    "lessonPath": "phases/13-tools-and-protocols/10-mcp-resources-and-prompts",
    "file": "phases/13-tools-and-protocols/10-mcp-resources-and-prompts/outputs/skill-primitive-splitter.md"
  },
  {
    "kind": "skill",
    "name": "sampling-loop-designer",
    "description": "使用 MCP sampling 设计一个由 server 托管的 agent loop，并配置合适的 modelPreferences、rate limits 和安全确认。",
    "tags": [
      "mcp",
      "sampling",
      "agent-loop",
      "model-preferences"
    ],
    "phase": 13,
    "lesson": 11,
    "lessonPath": "phases/13-tools-and-protocols/11-mcp-sampling",
    "file": "phases/13-tools-and-protocols/11-mcp-sampling/outputs/skill-sampling-loop-designer.md"
  },
  {
    "kind": "skill",
    "name": "elicitation-form-designer",
    "description": "为需要在调用过程中让用户确认或消歧的 tool 设计 elicitation form schema 和 message template。",
    "tags": [
      "mcp",
      "elicitation",
      "user-input",
      "forms"
    ],
    "phase": 13,
    "lesson": 12,
    "lessonPath": "phases/13-tools-and-protocols/12-mcp-roots-and-elicitation",
    "file": "phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/outputs/skill-elicitation-form-designer.md"
  },
  {
    "kind": "skill",
    "name": "task-store-designer",
    "description": "为长时间运行的 MCP tool 设计 task store：state shape、ttl、durability、cancellation、crash recovery。",
    "tags": [
      "mcp",
      "tasks",
      "durable-store",
      "long-running",
      "sep-1686"
    ],
    "phase": 13,
    "lesson": 13,
    "lessonPath": "phases/13-tools-and-protocols/13-mcp-async-tasks",
    "file": "phases/13-tools-and-protocols/13-mcp-async-tasks/outputs/skill-task-store-designer.md"
  },
  {
    "kind": "skill",
    "name": "mcp-apps-spec",
    "description": "为需要交互式 UI resource 的 tool 生成完整 MCP Apps contract。",
    "tags": [
      "mcp",
      "apps",
      "ui-resources",
      "csp",
      "iframe-sandbox"
    ],
    "phase": 13,
    "lesson": 14,
    "lessonPath": "phases/13-tools-and-protocols/14-mcp-apps",
    "file": "phases/13-tools-and-protocols/14-mcp-apps/outputs/skill-mcp-apps-spec.md"
  },
  {
    "kind": "skill",
    "name": "mcp-threat-model",
    "description": "为 MCP 部署生成 threat model，指出适用的攻击类别、已有防御措施以及 Rule-of-Two 违规。",
    "tags": [
      "mcp",
      "security",
      "tool-poisoning",
      "threat-model",
      "rule-of-two"
    ],
    "phase": 13,
    "lesson": 15,
    "lessonPath": "phases/13-tools-and-protocols/15-mcp-security-tool-poisoning",
    "file": "phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/outputs/skill-mcp-threat-model.md"
  },
  {
    "kind": "skill",
    "name": "oauth-scope-planner",
    "description": "为远程 MCP server 设计 OAuth 2.1 scope 集、pinning 规则和 step-up 策略。",
    "tags": [
      "oauth",
      "pkce",
      "resource-indicators",
      "step-up",
      "sep-835"
    ],
    "phase": 13,
    "lesson": 16,
    "lessonPath": "phases/13-tools-and-protocols/16-mcp-security-oauth-2-1",
    "file": "phases/13-tools-and-protocols/16-mcp-security-oauth-2-1/outputs/skill-oauth-scope-planner.md"
  },
  {
    "kind": "skill",
    "name": "gateway-bootstrap",
    "description": "根据 users、backends 和 compliance constraints 生成 gateway 配置规范。",
    "tags": [
      "mcp",
      "gateway",
      "rbac",
      "audit",
      "policy"
    ],
    "phase": 13,
    "lesson": 17,
    "lessonPath": "phases/13-tools-and-protocols/17-mcp-gateways-and-registries",
    "file": "phases/13-tools-and-protocols/17-mcp-gateways-and-registries/outputs/skill-gateway-bootstrap.md"
  },
  {
    "kind": "skill",
    "name": "mcp-auth-wiring",
    "description": "独立生产 MCP 授权（RFC 8414、CIMD、7591、8707、7636 PKCE、9728、9207）— 受保护资源元数据、注册、JWKS 刷新和每个请求令牌验证。",
    "tags": [
      "mcp",
      "oauth",
      "cimd",
      "dcr",
      "jwks",
      "rfc8414",
      "rfc7591",
      "rfc8707",
      "rfc7636",
      "rfc9728",
      "rfc9207"
    ],
    "phase": 13,
    "lesson": 18,
    "lessonPath": "phases/13-tools-and-protocols/18-mcp-auth-production",
    "file": "phases/13-tools-and-protocols/18-mcp-auth-production/outputs/skill-mcp-auth.md"
  },
  {
    "kind": "skill",
    "name": "a2a-agent-spec",
    "description": "为应可通过 A2A 调用的 Agent 生成 Agent Card 和 skills schema。",
    "tags": [
      "a2a",
      "agent-card",
      "task-lifecycle",
      "delegation"
    ],
    "phase": 13,
    "lesson": 19,
    "lessonPath": "phases/13-tools-and-protocols/19-a2a-protocol",
    "file": "phases/13-tools-and-protocols/19-a2a-protocol/outputs/skill-a2a-agent-spec.md"
  },
  {
    "kind": "skill",
    "name": "otel-genai-instrumentation",
    "description": "为 Agent codebase 生成端到端发出 OTel GenAI spans 的 instrumentation 方案。",
    "tags": [
      "otel",
      "observability",
      "gen-ai",
      "tracing"
    ],
    "phase": 13,
    "lesson": 20,
    "lessonPath": "phases/13-tools-and-protocols/20-opentelemetry-genai",
    "file": "phases/13-tools-and-protocols/20-opentelemetry-genai/outputs/skill-otel-genai-instrumentation.md"
  },
  {
    "kind": "skill",
    "name": "routing-config-designer",
    "description": "给定 workload profile，选择 LiteLLM / OpenRouter / Portkey，并生成 routing config。",
    "tags": [
      "routing",
      "litellm",
      "openrouter",
      "portkey",
      "fallback"
    ],
    "phase": 13,
    "lesson": 21,
    "lessonPath": "phases/13-tools-and-protocols/21-llm-routing-layer",
    "file": "phases/13-tools-and-protocols/21-llm-routing-layer/outputs/skill-routing-config-designer.md"
  },
  {
    "kind": "skill",
    "name": "agent-bundle",
    "description": "为一个工作流生成可移植的 SKILL.md + AGENTS.md + MCP-server 蓝图，可在 Claude Code、Cursor、Codex 以及兼容的 agents 中加载。",
    "tags": [
      "skills",
      "agents-md",
      "apps-sdk",
      "cross-agent",
      "portability"
    ],
    "phase": 13,
    "lesson": 22,
    "lessonPath": "phases/13-tools-and-protocols/22-skills-and-agent-sdks",
    "file": "phases/13-tools-and-protocols/22-skills-and-agent-sdks/outputs/skill-agent-bundle.md"
  },
  {
    "kind": "skill",
    "name": "ecosystem-blueprint",
    "description": "根据产品需求生成完整的 Phase 13 ecosystem architecture；命名 primitives、security posture、telemetry 和 packaging。",
    "tags": [
      "mcp",
      "capstone",
      "ecosystem",
      "architecture",
      "a2a",
      "otel"
    ],
    "phase": 13,
    "lesson": 23,
    "lessonPath": "phases/13-tools-and-protocols/23-capstone-tool-ecosystem",
    "file": "phases/13-tools-and-protocols/23-capstone-tool-ecosystem/outputs/skill-ecosystem-blueprint.md"
  },
  {
    "kind": "skill",
    "name": "agent-loop",
    "description": "用任何目标 language/runtime 编写正确、最小化的 ReAct Agent loop，包含 tools、stop condition 和 turn budget。",
    "tags": [
      "react",
      "agent-loop",
      "tools",
      "observability",
      "stop-condition"
    ],
    "phase": 14,
    "lesson": 1,
    "lessonPath": "phases/14-agent-engineering/01-the-agent-loop",
    "file": "phases/14-agent-engineering/01-the-agent-loop/outputs/skill-agent-loop.md"
  },
  {
    "kind": "skill",
    "name": "rewoo-planner",
    "description": "根据用户请求和工具目录生成经过验证的 ReWOO plan DAG。",
    "tags": [
      "rewoo",
      "plan-and-execute",
      "planning",
      "dag",
      "distillation"
    ],
    "phase": 14,
    "lesson": 2,
    "lessonPath": "phases/14-agent-engineering/02-rewoo-plan-and-execute",
    "file": "phases/14-agent-engineering/02-rewoo-plan-and-execute/outputs/skill-rewoo-planner.md"
  },
  {
    "kind": "skill",
    "name": "reflexion-buffer",
    "description": "为 verbal RL 维护一个 reflections 的 episodic-memory buffer，包含 TTL、dedup 和 scoped scope。",
    "tags": [
      "reflexion",
      "episodic-memory",
      "self-healing",
      "verbal-rl",
      "sleep-time"
    ],
    "phase": 14,
    "lesson": 3,
    "lessonPath": "phases/14-agent-engineering/03-reflexion-verbal-rl",
    "file": "phases/14-agent-engineering/03-reflexion-verbal-rl/outputs/skill-reflexion-buffer.md"
  },
  {
    "kind": "skill",
    "name": "search-policy",
    "description": "根据任务形态、Token 预算和评估器质量选择搜索策略（ReAct、ToT、LATS、evolutionary）。",
    "tags": [
      "tree-of-thoughts",
      "lats",
      "mcts",
      "search",
      "value-function"
    ],
    "phase": 14,
    "lesson": 4,
    "lessonPath": "phases/14-agent-engineering/04-tree-of-thoughts-lats",
    "file": "phases/14-agent-engineering/04-tree-of-thoughts-lats/outputs/skill-search-policy.md"
  },
  {
    "kind": "skill",
    "name": "refine-loop",
    "description": "根据 task、verifier availability 和 iteration budget 配置 evaluator-optimizer（Self-Refine / CRITIC）loop。",
    "tags": [
      "self-refine",
      "critic",
      "evaluator-optimizer",
      "guardrails",
      "iteration"
    ],
    "phase": 14,
    "lesson": 5,
    "lessonPath": "phases/14-agent-engineering/05-self-refine-and-critic",
    "file": "phases/14-agent-engineering/05-self-refine-and-critic/outputs/skill-refine-loop.md"
  },
  {
    "kind": "skill",
    "name": "tool-registry",
    "description": "构建一个生产级工具目录和注册表，包含 JSON Schema 验证、并行分发和可观测性。",
    "tags": [
      "function-calling",
      "tools",
      "schema",
      "validation",
      "bfcl",
      "parallel-tools"
    ],
    "phase": 14,
    "lesson": 6,
    "lessonPath": "phases/14-agent-engineering/06-tool-use-and-function-calling",
    "file": "phases/14-agent-engineering/06-tool-use-and-function-calling/outputs/skill-tool-registry.md"
  },
  {
    "kind": "skill",
    "name": "virtual-memory",
    "description": "为任意 target runtime 搭建 MemGPT-shaped two-tier memory system（main context + archival store + memory tools），具备正确的 eviction、citation 和 untrusted-input handling。",
    "tags": [
      "memory",
      "memgpt",
      "virtual-context",
      "archival",
      "citations"
    ],
    "phase": 14,
    "lesson": 7,
    "lessonPath": "phases/14-agent-engineering/07-memory-virtual-context-memgpt",
    "file": "phases/14-agent-engineering/07-memory-virtual-context-memgpt/outputs/skill-virtual-memory.md"
  },
  {
    "kind": "skill",
    "name": "memory-blocks",
    "description": "生成一个 Letta 形态的三层 memory system（core blocks、recall、archival），并配有一个位于 critical path 之外的 sleep-time consolidation agent。",
    "tags": [
      "memory",
      "letta",
      "blocks",
      "sleep-time",
      "consolidation"
    ],
    "phase": 14,
    "lesson": 8,
    "lessonPath": "phases/14-agent-engineering/08-memory-blocks-sleep-time-compute",
    "file": "phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/outputs/skill-memory-blocks.md"
  },
  {
    "kind": "skill",
    "name": "hybrid-memory",
    "description": "生成一个 Mem0 形态的三存储记忆系统（Vector + KV + Graph），包含 fusion scorer、scope taxonomy 和 temporal invalidation。",
    "tags": [
      "memory",
      "mem0",
      "vector",
      "graph",
      "kv",
      "fusion",
      "scope"
    ],
    "phase": 14,
    "lesson": 9,
    "lessonPath": "phases/14-agent-engineering/09-hybrid-memory-mem0",
    "file": "phases/14-agent-engineering/09-hybrid-memory-mem0/outputs/skill-hybrid-memory.md"
  },
  {
    "kind": "skill",
    "name": "skill-library",
    "description": "生成一个符合 Voyager 形态的 skill library，支持注册、按相似度检索、组合式执行，以及由失败驱动的 refinement。",
    "tags": [
      "voyager",
      "skills",
      "library",
      "composition",
      "refinement"
    ],
    "phase": 14,
    "lesson": 10,
    "lessonPath": "phases/14-agent-engineering/10-skill-libraries-voyager",
    "file": "phases/14-agent-engineering/10-skill-libraries-voyager/outputs/skill-skill-library.md"
  },
  {
    "kind": "skill",
    "name": "hybrid-planner",
    "description": "构建一个 hybrid planner — 用 ChatHTN 处理可证明 sound 的 plans，用 AlphaEvolve 处理带机器可检查 evaluator 的 code search — 并为问题选择正确方案。",
    "tags": [
      "planning",
      "htn",
      "chathtn",
      "alphaevolve",
      "evolutionary-search"
    ],
    "phase": 14,
    "lesson": 11,
    "lessonPath": "phases/14-agent-engineering/11-planning-htn-and-evolutionary",
    "file": "phases/14-agent-engineering/11-planning-htn-and-evolutionary/outputs/skill-hybrid-planner.md"
  },
  {
    "kind": "skill",
    "name": "workflow-picker",
    "description": "为给定任务选择合适的模式（prompt chain、router、parallel、orchestrator-workers、evaluator-optimizer 或完整 agent），并产出最小实现。",
    "tags": [
      "anthropic",
      "workflows",
      "agents",
      "patterns",
      "minimal"
    ],
    "phase": 14,
    "lesson": 12,
    "lessonPath": "phases/14-agent-engineering/12-anthropic-workflow-patterns",
    "file": "phases/14-agent-engineering/12-anthropic-workflow-patterns/outputs/skill-workflow-picker.md"
  },
  {
    "kind": "skill",
    "name": "state-graph",
    "description": "构建一个 LangGraph-shaped 状态机，包含 typed state、conditional edges、per-node checkpointing 和 durable resume。",
    "tags": [
      "langgraph",
      "state-machine",
      "durable",
      "checkpointing",
      "human-in-the-loop"
    ],
    "phase": 14,
    "lesson": 13,
    "lessonPath": "phases/14-agent-engineering/13-langgraph-stateful-graphs",
    "file": "phases/14-agent-engineering/13-langgraph-stateful-graphs/outputs/skill-state-graph.md"
  },
  {
    "kind": "skill",
    "name": "actor-runtime",
    "description": "构建一个 AutoGen v0.4 形态的 actor runtime，具备 private state、每个 actor 一个 inbox、仅通过 message 的 IPC、fault isolation，以及 dead-letter queue。",
    "tags": [
      "autogen",
      "actor-model",
      "messaging",
      "fault-isolation",
      "dead-letter"
    ],
    "phase": 14,
    "lesson": 14,
    "lessonPath": "phases/14-agent-engineering/14-autogen-actor-model",
    "file": "phases/14-agent-engineering/14-autogen-actor-model/outputs/skill-actor-runtime.md"
  },
  {
    "kind": "skill",
    "name": "crew-or-flow",
    "description": "为给定任务选择 CrewAI Crew 或 Flow，并搭建最小实现脚手架。",
    "tags": [
      "crewai",
      "crews",
      "flows",
      "multi-agent",
      "role-based"
    ],
    "phase": 14,
    "lesson": 15,
    "lessonPath": "phases/14-agent-engineering/15-crewai-role-based-crews",
    "file": "phases/14-agent-engineering/15-crewai-role-based-crews/outputs/skill-crew-or-flow.md"
  },
  {
    "kind": "skill",
    "name": "agents-sdk-scaffold",
    "description": "Scaffold 一个 OpenAI Agents SDK app，包含 triage agent、handoffs、input/output/tool guardrails、session store 和 trace processor。",
    "tags": [
      "openai",
      "agents-sdk",
      "handoffs",
      "guardrails",
      "tracing",
      "session"
    ],
    "phase": 14,
    "lesson": 16,
    "lessonPath": "phases/14-agent-engineering/16-openai-agents-sdk",
    "file": "phases/14-agent-engineering/16-openai-agents-sdk/outputs/skill-agents-sdk-scaffold.md"
  },
  {
    "kind": "skill",
    "name": "claude-agent-scaffold",
    "description": "搭建一个包含 subagents、生命周期 hooks、session store、MCP server attachment 和 W3C trace propagation 的 Claude Agent SDK app。",
    "tags": [
      "claude-agent-sdk",
      "subagents",
      "hooks",
      "session-store",
      "mcp"
    ],
    "phase": 14,
    "lesson": 17,
    "lessonPath": "phases/14-agent-engineering/17-claude-agent-sdk",
    "file": "phases/14-agent-engineering/17-claude-agent-sdk/outputs/skill-claude-agent-scaffold.md"
  },
  {
    "kind": "skill",
    "name": "runtime-picker",
    "description": "针对给定 stack、latency budget 和 operational shape，选择生产 Agent Runtime（Agno、Mastra、LangGraph、provider SDK）。",
    "tags": [
      "agno",
      "mastra",
      "langgraph",
      "runtime",
      "selection"
    ],
    "phase": 14,
    "lesson": 18,
    "lessonPath": "phases/14-agent-engineering/18-agno-and-mastra-runtimes",
    "file": "phases/14-agent-engineering/18-agno-and-mastra-runtimes/outputs/skill-runtime-picker.md"
  },
  {
    "kind": "skill",
    "name": "benchmark-harness",
    "description": "为 codebase 构建 SWE-bench-style harness，包含 FAIL_TO_PASS / PASS_TO_PASS gate、contamination check 和 step-count metrics。",
    "tags": [
      "swe-bench",
      "gaia",
      "agentbench",
      "harness",
      "evaluation"
    ],
    "phase": 14,
    "lesson": 19,
    "lessonPath": "phases/14-agent-engineering/19-benchmarks-swebench-gaia",
    "file": "phases/14-agent-engineering/19-benchmarks-swebench-gaia/outputs/skill-benchmark-harness.md"
  },
  {
    "kind": "skill",
    "name": "web-desktop-harness",
    "description": "构建一个 WebArena/OSWorld-style harness，包含基于执行的 evaluation 和 trajectory-efficiency metrics。",
    "tags": [
      "webarena",
      "osworld",
      "harness",
      "trajectory-efficiency"
    ],
    "phase": 14,
    "lesson": 20,
    "lessonPath": "phases/14-agent-engineering/20-benchmarks-webarena-osworld",
    "file": "phases/14-agent-engineering/20-benchmarks-webarena-osworld/outputs/skill-web-desktop-harness.md"
  },
  {
    "kind": "skill",
    "name": "computer-use-safety",
    "description": "为 computer-use agent 构建逐步安全 classifier + 确认 gate，并包含 allowlist 导航和 injection-marker 过滤。",
    "tags": [
      "computer-use",
      "safety",
      "claude",
      "openai-cua",
      "gemini"
    ],
    "phase": 14,
    "lesson": 21,
    "lessonPath": "phases/14-agent-engineering/21-computer-use-agents",
    "file": "phases/14-agent-engineering/21-computer-use-agents/outputs/skill-computer-use-safety.md"
  },
  {
    "kind": "skill",
    "name": "voice-pipeline",
    "description": "搭建 Pipecat 形态的 voice pipeline（VAD + STT + LLM + TTS + transport）脚手架，包含 barge-in、confidence gating 和 latency budget enforcement。",
    "tags": [
      "voice",
      "pipecat",
      "livekit",
      "webrtc",
      "latency"
    ],
    "phase": 14,
    "lesson": 22,
    "lessonPath": "phases/14-agent-engineering/22-voice-agents-pipecat-livekit",
    "file": "phases/14-agent-engineering/22-voice-agents-pipecat-livekit/outputs/skill-voice-pipeline.md"
  },
  {
    "kind": "skill",
    "name": "otel-genai",
    "description": "使用 OpenTelemetry GenAI semantic conventions 为 agent 插桩 — 包含带有正确 attributes 和 opt-in 内容捕获的 invoke_agent、chat、tool_call spans。",
    "tags": [
      "opentelemetry",
      "genai",
      "observability",
      "tracing",
      "semantic-conventions"
    ],
    "phase": 14,
    "lesson": 23,
    "lessonPath": "phases/14-agent-engineering/23-otel-genai-conventions",
    "file": "phases/14-agent-engineering/23-otel-genai-conventions/outputs/skill-otel-genai.md"
  },
  {
    "kind": "skill",
    "name": "obs-platform-wiring",
    "description": "选择一个可观测性平台（Langfuse、Phoenix、Opik、Datadog），并将 traces + evals + prompt versions 接入现有 Agent。",
    "tags": [
      "observability",
      "langfuse",
      "phoenix",
      "opik",
      "datadog",
      "tracing"
    ],
    "phase": 14,
    "lesson": 24,
    "lessonPath": "phases/14-agent-engineering/24-agent-observability-platforms",
    "file": "phases/14-agent-engineering/24-agent-observability-platforms/outputs/skill-obs-platform-wiring.md"
  },
  {
    "kind": "skill",
    "name": "debate",
    "description": "Scaffold 一个 multi-agent debate，包含 N 个 debaters、R 轮、可配置 topology（full mesh、star、ring）以及 convergence rule。",
    "tags": [
      "debate",
      "multi-agent",
      "society-of-minds",
      "sparse-topology"
    ],
    "phase": 14,
    "lesson": 25,
    "lessonPath": "phases/14-agent-engineering/25-multi-agent-debate",
    "file": "phases/14-agent-engineering/25-multi-agent-debate/outputs/skill-debate.md"
  },
  {
    "kind": "skill",
    "name": "failure-detector",
    "description": "为 agent traces 生成 failure-mode detectors，连接到 trace store，标注五种行业反复出现的模式以及 domain-specific signatures。",
    "tags": [
      "failure-modes",
      "masft",
      "detection",
      "observability"
    ],
    "phase": 14,
    "lesson": 26,
    "lessonPath": "phases/14-agent-engineering/26-failure-modes-agentic",
    "file": "phases/14-agent-engineering/26-failure-modes-agentic/outputs/skill-failure-detector.md"
  },
  {
    "kind": "skill",
    "name": "injection-defense",
    "description": "为任意 agent runtime 构建一个 PVE (Prompt-Validator-Executor) 层，包含带 source-tag 的内容、injection-marker 扫描，以及 allowlist navigation。",
    "tags": [
      "security",
      "prompt-injection",
      "pve",
      "greshake",
      "source-tag"
    ],
    "phase": 14,
    "lesson": 27,
    "lessonPath": "phases/14-agent-engineering/27-prompt-injection-defense",
    "file": "phases/14-agent-engineering/27-prompt-injection-defense/outputs/skill-injection-defense.md"
  },
  {
    "kind": "skill",
    "name": "orchestration-picker",
    "description": "为给定问题选择一种 orchestration topology（supervisor、swarm、hierarchical、debate 或 none），并以最小方式实现它。",
    "tags": [
      "orchestration",
      "supervisor",
      "swarm",
      "hierarchical",
      "debate"
    ],
    "phase": 14,
    "lesson": 28,
    "lessonPath": "phases/14-agent-engineering/28-orchestration-patterns",
    "file": "phases/14-agent-engineering/28-orchestration-patterns/outputs/skill-orchestration-picker.md"
  },
  {
    "kind": "skill",
    "name": "runtime-shape",
    "description": "选择一种 production runtime shape（request-response、streaming、queue、event、cron、durable）并接入 observability。",
    "tags": [
      "production",
      "runtime",
      "queue",
      "event",
      "durable",
      "observability"
    ],
    "phase": 14,
    "lesson": 29,
    "lessonPath": "phases/14-agent-engineering/29-production-runtimes",
    "file": "phases/14-agent-engineering/29-production-runtimes/outputs/skill-runtime-shape.md"
  },
  {
    "kind": "skill",
    "name": "eval-suite",
    "description": "构建一个三层 eval suite（static benchmarks、custom offline、online production），包含 evaluator-optimizer loop 和 CI gates。",
    "tags": [
      "evaluation",
      "ci",
      "regression",
      "benchmarks",
      "llm-judge"
    ],
    "phase": 14,
    "lesson": 30,
    "lessonPath": "phases/14-agent-engineering/30-eval-driven-agent-development",
    "file": "phases/14-agent-engineering/30-eval-driven-agent-development/outputs/skill-eval-suite.md"
  },
  {
    "kind": "skill",
    "name": "workbench-audit",
    "description": "在任何 agent 工作开始前，审计一个 repo 的七个 agent workbench 表面，并报告哪些缺失、部分完成或健康。",
    "tags": [
      "workbench",
      "audit",
      "reliability",
      "agent-engineering"
    ],
    "phase": 14,
    "lesson": 31,
    "lessonPath": "phases/14-agent-engineering/31-agent-workbench-why-models-fail",
    "file": "phases/14-agent-engineering/31-agent-workbench-why-models-fail/outputs/skill-workbench-audit.md"
  },
  {
    "kind": "mission",
    "name": "Mission - Agent Workbench：为什么有能力的模型仍会失败",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 31,
    "lessonPath": "phases/14-agent-engineering/31-agent-workbench-why-models-fail",
    "file": "phases/14-agent-engineering/31-agent-workbench-why-models-fail/mission.md"
  },
  {
    "kind": "skill",
    "name": "minimal-workbench",
    "description": "为任何 repo 放置三文件的最低可行 agent workbench —— 简短的 AGENTS.md router、持久的 agent_state.json，以及一个按项目当前 backlog 编排的 JSON task_board.json。",
    "tags": [
      "workbench",
      "agents-md",
      "state",
      "task-board",
      "scaffold"
    ],
    "phase": 14,
    "lesson": 32,
    "lessonPath": "phases/14-agent-engineering/32-minimal-agent-workbench",
    "file": "phases/14-agent-engineering/32-minimal-agent-workbench/outputs/skill-minimal-workbench.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Minimal Agent Workbench",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 32,
    "lessonPath": "phases/14-agent-engineering/32-minimal-agent-workbench",
    "file": "phases/14-agent-engineering/32-minimal-agent-workbench/mission.md"
  },
  {
    "kind": "skill",
    "name": "rule-set-builder",
    "description": "访谈项目 owner，将他们现有的散文式指令分类为五个操作类别，并输出一个带版本的 agent-rules.md 加一个 Python 检查器 stub。",
    "tags": [
      "rules",
      "instructions",
      "constraints",
      "checker",
      "workbench"
    ],
    "phase": 14,
    "lesson": 33,
    "lessonPath": "phases/14-agent-engineering/33-instructions-as-executable-constraints",
    "file": "phases/14-agent-engineering/33-instructions-as-executable-constraints/outputs/skill-rule-set-builder.md"
  },
  {
    "kind": "mission",
    "name": "任务 - 将 Agent Instructions 作为可执行约束",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 33,
    "lessonPath": "phases/14-agent-engineering/33-instructions-as-executable-constraints",
    "file": "phases/14-agent-engineering/33-instructions-as-executable-constraints/mission.md"
  },
  {
    "kind": "skill",
    "name": "state-schema",
    "description": "为 agent state 和 task board 生成项目专属 JSON Schemas、带 atomic writes 的 Python StateManager，以及 migration 脚手架，确保 schema bump 不会破坏 workbench。",
    "tags": [
      "state",
      "schema",
      "json-schema",
      "atomic-writes",
      "migrations"
    ],
    "phase": 14,
    "lesson": 34,
    "lessonPath": "phases/14-agent-engineering/34-repo-memory-and-state",
    "file": "phases/14-agent-engineering/34-repo-memory-and-state/outputs/skill-state-schema.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Repo Memory 和持久状态",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 34,
    "lessonPath": "phases/14-agent-engineering/34-repo-memory-and-state",
    "file": "phases/14-agent-engineering/34-repo-memory-and-state/mission.md"
  },
  {
    "kind": "skill",
    "name": "init-script",
    "description": "访谈一个 project，并产出一个确定性的 init_agent.py，包含五个 probes，以及一个在任何 probe 失败时拒绝启动 Agent 的 CI workflow。",
    "tags": [
      "init",
      "probes",
      "ci",
      "workbench",
      "fail-loud"
    ],
    "phase": 14,
    "lesson": 35,
    "lessonPath": "phases/14-agent-engineering/35-initialization-scripts",
    "file": "phases/14-agent-engineering/35-initialization-scripts/outputs/skill-init-script.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Agents 的初始化脚本",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 35,
    "lessonPath": "phases/14-agent-engineering/35-initialization-scripts",
    "file": "phases/14-agent-engineering/35-initialization-scripts/mission.md"
  },
  {
    "kind": "skill",
    "name": "scope-contract",
    "description": "为每个任务生成 scope contract，包含允许/禁止的 globs、验收标准和回滚计划，并提供一个 CI-ready、感知 glob 的 checker，用于在每个 Agent diff 上运行。",
    "tags": [
      "scope",
      "contract",
      "globs",
      "diff-check",
      "ci"
    ],
    "phase": 14,
    "lesson": 36,
    "lessonPath": "phases/14-agent-engineering/36-scope-contracts",
    "file": "phases/14-agent-engineering/36-scope-contracts/outputs/skill-scope-contract.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Scope Contracts 和任务边界",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 36,
    "lessonPath": "phases/14-agent-engineering/36-scope-contracts",
    "file": "phases/14-agent-engineering/36-scope-contracts/mission.md"
  },
  {
    "kind": "skill",
    "name": "feedback-runner",
    "description": "用确定性的 stdout/stderr/exit/duration 捕获来包装 shell commands，为每个 command 持久化一条 JSONL record，并在 feedback 缺失时拒绝推进 agent loop。",
    "tags": [
      "feedback",
      "subprocess",
      "runner",
      "jsonl",
      "loop-control"
    ],
    "phase": 14,
    "lesson": 37,
    "lessonPath": "phases/14-agent-engineering/37-runtime-feedback-loops",
    "file": "phases/14-agent-engineering/37-runtime-feedback-loops/outputs/skill-feedback-runner.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Runtime Feedback Loops",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 37,
    "lessonPath": "phases/14-agent-engineering/37-runtime-feedback-loops",
    "file": "phases/14-agent-engineering/37-runtime-feedback-loops/mission.md"
  },
  {
    "kind": "skill",
    "name": "verification-gate",
    "description": "生成一个确定性的 verification gate，将 scope、rule 和 feedback artifacts 合并为每个 task 一个 verification_report.json，并提供 CI wiring，确保没有 green verdict 就拒绝合并。",
    "tags": [
      "verification",
      "gate",
      "deterministic",
      "ci",
      "override-log"
    ],
    "phase": 14,
    "lesson": 38,
    "lessonPath": "phases/14-agent-engineering/38-verification-gates",
    "file": "phases/14-agent-engineering/38-verification-gates/outputs/skill-verification-gate.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Verification Gates",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 38,
    "lessonPath": "phases/14-agent-engineering/38-verification-gates",
    "file": "phases/14-agent-engineering/38-verification-gates/mission.md"
  },
  {
    "kind": "skill",
    "name": "reviewer-agent",
    "description": "建立一个 reviewer agent 角色，使用五维 rubric 读取 builder artifacts，生成结构化 review report，并让人工 review 从书面页面开始，而不是从空白页开始。",
    "tags": [
      "reviewer",
      "rubric",
      "role-separation",
      "second-loop",
      "review-report"
    ],
    "phase": 14,
    "lesson": 39,
    "lessonPath": "phases/14-agent-engineering/39-reviewer-agent",
    "file": "phases/14-agent-engineering/39-reviewer-agent/outputs/skill-reviewer-agent.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Reviewer Agent：将 Builder 与 Marker 分离",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 39,
    "lessonPath": "phases/14-agent-engineering/39-reviewer-agent",
    "file": "phases/14-agent-engineering/39-reviewer-agent/mission.md"
  },
  {
    "kind": "skill",
    "name": "handoff-generator",
    "description": "从 workbench artifacts 生成会话结束交接包，同时产出面向人的 Markdown 和面向机器的 JSON，并按七个规范字段组织。",
    "tags": [
      "handoff",
      "generator",
      "session-end",
      "packet",
      "next-action"
    ],
    "phase": 14,
    "lesson": 40,
    "lessonPath": "phases/14-agent-engineering/40-multi-session-handoff",
    "file": "phases/14-agent-engineering/40-multi-session-handoff/outputs/skill-handoff-generator.md"
  },
  {
    "kind": "mission",
    "name": "任务 - 多会话 Handoff",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 40,
    "lessonPath": "phases/14-agent-engineering/40-multi-session-handoff",
    "file": "phases/14-agent-engineering/40-multi-session-handoff/mission.md"
  },
  {
    "kind": "skill",
    "name": "workbench-benchmark",
    "description": "在某个 project 自己的 sample app 上，通过 prompt-only 和 workbench-guided pipelines 运行同一个任务，并输出一份包含五个 outcome 的 before/after report。",
    "tags": [
      "benchmark",
      "before-after",
      "evaluation",
      "workbench",
      "sample-app"
    ],
    "phase": 14,
    "lesson": 41,
    "lessonPath": "phases/14-agent-engineering/41-workbench-for-real-repos",
    "file": "phases/14-agent-engineering/41-workbench-for-real-repos/outputs/skill-workbench-benchmark.md"
  },
  {
    "kind": "mission",
    "name": "任务 - 在真实 repo 上使用 Workbench",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 41,
    "lessonPath": "phases/14-agent-engineering/41-workbench-for-real-repos",
    "file": "phases/14-agent-engineering/41-workbench-for-real-repos/mission.md"
  },
  {
    "kind": "skill",
    "name": "workbench-pack",
    "description": "生成一个按项目调优、可直接接入的 agent workbench pack —— 规则根据团队历史进一步收紧，scope globs 与 repo 匹配，rubric 维度扩展一个领域专属条目。",
    "tags": [
      "capstone",
      "workbench-pack",
      "installer",
      "schemas",
      "drop-in"
    ],
    "phase": 14,
    "lesson": 42,
    "lessonPath": "phases/14-agent-engineering/42-agent-workbench-capstone",
    "file": "phases/14-agent-engineering/42-agent-workbench-capstone/outputs/skill-workbench-pack.md"
  },
  {
    "kind": "mission",
    "name": "任务 - Capstone：交付可复用的 Agent Workbench Pack",
    "description": "",
    "tags": [],
    "phase": 14,
    "lesson": 42,
    "lessonPath": "phases/14-agent-engineering/42-agent-workbench-capstone",
    "file": "phases/14-agent-engineering/42-agent-workbench-capstone/mission.md"
  },
  {
    "kind": "skill",
    "name": "horizon-reality-check",
    "description": "给定一个你想交给 agent 的任务，判断当前 frontier 的 horizon 是否以足够余量覆盖它。",
    "tags": [
      "autonomous-agents",
      "metr",
      "time-horizon",
      "reliability",
      "deployment"
    ],
    "phase": 15,
    "lesson": 1,
    "lessonPath": "phases/15-autonomous-systems/01-long-horizon-agents",
    "file": "phases/15-autonomous-systems/01-long-horizon-agents/outputs/skill-horizon-reality-check.md"
  },
  {
    "kind": "skill",
    "name": "star-loop-reviewer",
    "description": "在投入训练 compute 之前，审计一个拟议的 self-taught reasoning pipeline（STaR-family）。",
    "tags": [
      "star",
      "vstar",
      "quiet-star",
      "self-improvement",
      "reasoning",
      "bootstrap"
    ],
    "phase": 15,
    "lesson": 2,
    "lessonPath": "phases/15-autonomous-systems/02-star-family-reasoning",
    "file": "phases/15-autonomous-systems/02-star-family-reasoning/outputs/skill-star-loop-reviewer.md"
  },
  {
    "kind": "skill",
    "name": "evaluator-rigor-audit",
    "description": "在投入任何计算资源进行搜索之前，审计拟议 AlphaEvolve-style 演化式编码循环的 evaluator。",
    "tags": [
      "alphaevolve",
      "evolutionary-coding",
      "evaluator",
      "reward-hacking",
      "deepmind"
    ],
    "phase": 15,
    "lesson": 3,
    "lessonPath": "phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding",
    "file": "phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding/outputs/skill-evaluator-rigor-audit.md"
  },
  {
    "kind": "skill",
    "name": "dgm-evaluator-firewall",
    "description": "指定 Darwin-Godel-Machine-style self-modifying agent loop 为避免已记录的 reward hacking 所需的 evaluator separation。",
    "tags": [
      "dgm",
      "self-modification",
      "reward-hacking",
      "evaluator",
      "sandbox"
    ],
    "phase": 15,
    "lesson": 4,
    "lessonPath": "phases/15-autonomous-systems/04-darwin-godel-machine",
    "file": "phases/15-autonomous-systems/04-darwin-godel-machine/outputs/skill-dgm-evaluator-firewall.md"
  },
  {
    "kind": "skill",
    "name": "ai-scientist-sandbox-review",
    "description": "research-loop agent 输出在任何内容离开 sandbox 前的 two-gate review checklist。",
    "tags": [
      "ai-scientist",
      "research-agent",
      "sandbox",
      "peer-review",
      "disclosure"
    ],
    "phase": 15,
    "lesson": 5,
    "lessonPath": "phases/15-autonomous-systems/05-ai-scientist-v2",
    "file": "phases/15-autonomous-systems/05-ai-scientist-v2/outputs/skill-ai-scientist-sandbox-review.md"
  },
  {
    "kind": "skill",
    "name": "aar-deployment-review",
    "description": "对 automated-alignment-research pipeline 的预部署 review，包括 sandbox 隔离和 log integrity。",
    "tags": [
      "aar",
      "alignment-research",
      "sandbox",
      "log-integrity",
      "rsp"
    ],
    "phase": 15,
    "lesson": 6,
    "lessonPath": "phases/15-autonomous-systems/06-automated-alignment-research",
    "file": "phases/15-autonomous-systems/06-automated-alignment-research/outputs/skill-aar-deployment-review.md"
  },
  {
    "kind": "skill",
    "name": "rsi-cycle-pause-spec",
    "description": "指定 RSI pipeline 必须暂停并在下一个 cycle 前等待 human review 的条件。",
    "tags": [
      "rsi",
      "self-improvement",
      "alignment",
      "pause-threshold",
      "rsp"
    ],
    "phase": 15,
    "lesson": 7,
    "lessonPath": "phases/15-autonomous-systems/07-recursive-self-improvement",
    "file": "phases/15-autonomous-systems/07-recursive-self-improvement/outputs/skill-rsi-cycle-pause-spec.md"
  },
  {
    "kind": "skill",
    "name": "bounded-loop-review",
    "description": "根据四个 primitive stack（invariants、anchor、multi-objective、regression detection）审计 proposed bounded self-improvement loop。",
    "tags": [
      "bounded-self-improvement",
      "invariants",
      "alignment-anchor",
      "rsi-safety"
    ],
    "phase": 15,
    "lesson": 8,
    "lessonPath": "phases/15-autonomous-systems/08-bounded-self-improvement",
    "file": "phases/15-autonomous-systems/08-bounded-self-improvement/outputs/skill-bounded-loop-review.md"
  },
  {
    "kind": "skill",
    "name": "coding-scaffold-audit",
    "description": "在采用 proposed coding-agent scaffold 用于生产代码修改之前，对它进行 audit（retrieval、verifier loop、sandbox、benchmark fit）。",
    "tags": [
      "coding-agent",
      "scaffolding",
      "swe-bench",
      "codeact",
      "openhands"
    ],
    "phase": 15,
    "lesson": 9,
    "lessonPath": "phases/15-autonomous-systems/09-coding-agent-landscape",
    "file": "phases/15-autonomous-systems/09-coding-agent-landscape/outputs/skill-scaffold-audit.md"
  },
  {
    "kind": "skill",
    "name": "permission-mode-picker",
    "description": "在开始一次运行前，将 Claude Code 任务匹配到正确的权限模式、预算上限和所需隔离。",
    "tags": [
      "claude-code",
      "permission-modes",
      "auto-mode",
      "budgets",
      "isolation"
    ],
    "phase": 15,
    "lesson": 10,
    "lessonPath": "phases/15-autonomous-systems/10-claude-code-permission-modes",
    "file": "phases/15-autonomous-systems/10-claude-code-permission-modes/outputs/skill-permission-mode-picker.md"
  },
  {
    "kind": "skill",
    "name": "browser-agent-trust-boundary",
    "description": "在 agent 触达真实站点之前，界定一个拟议 browser-agent deployment——trust zones、authorized writes、required defenses。",
    "tags": [
      "browser-agents",
      "prompt-injection",
      "trust-boundary",
      "osworld",
      "webarena"
    ],
    "phase": 15,
    "lesson": 11,
    "lessonPath": "phases/15-autonomous-systems/11-browser-agents",
    "file": "phases/15-autonomous-systems/11-browser-agents/outputs/skill-browser-agent-trust-boundary.md"
  },
  {
    "kind": "skill",
    "name": "durable-execution-review",
    "description": "审查一个拟议的长时间运行 Agent 部署是否具备正确的持久化执行形态（activities、determinism、checkpoint backend、human-input state、HITL-on-resume）。",
    "tags": [
      "durable-execution",
      "workflows",
      "checkpointing",
      "temporal",
      "langgraph",
      "agents-sdk"
    ],
    "phase": 15,
    "lesson": 12,
    "lessonPath": "phases/15-autonomous-systems/12-durable-execution",
    "file": "phases/15-autonomous-systems/12-durable-execution/outputs/skill-durable-execution-review.md"
  },
  {
    "kind": "skill",
    "name": "agent-budget-audit",
    "description": "审计 agent 部署的 cost-governor stack，并在启用 unattended runs 之前标记缺失层。",
    "tags": [
      "cost-governors",
      "denial-of-wallet",
      "budgets",
      "claude-code-sdk",
      "agent-governance"
    ],
    "phase": 15,
    "lesson": 13,
    "lessonPath": "phases/15-autonomous-systems/13-cost-governors",
    "file": "phases/15-autonomous-systems/13-cost-governors/outputs/skill-agent-budget-audit.md"
  },
  {
    "kind": "skill",
    "name": "tripwire-design",
    "description": "审查拟议的 agent detector stack（kill switch、circuit breakers、canary tokens），并在首次 autonomous run 前标记缺失的 tripwires。",
    "tags": [
      "kill-switch",
      "circuit-breaker",
      "canary",
      "honeytoken",
      "detection-and-response"
    ],
    "phase": 15,
    "lesson": 14,
    "lessonPath": "phases/15-autonomous-systems/14-kill-switches-canaries",
    "file": "phases/15-autonomous-systems/14-kill-switches-canaries/outputs/skill-tripwire-design.md"
  },
  {
    "kind": "skill",
    "name": "hitl-design",
    "description": "Review 一个 proposed Human-in-the-Loop workflow 是否具备 propose-then-commit 形态，并标记缺失的 metadata、idempotency、verification 或 challenge-and-response layers。",
    "tags": [
      "hitl",
      "propose-then-commit",
      "idempotency",
      "langgraph",
      "cloudflare",
      "agent-framework",
      "eu-ai-act"
    ],
    "phase": 15,
    "lesson": 15,
    "lessonPath": "phases/15-autonomous-systems/15-propose-then-commit",
    "file": "phases/15-autonomous-systems/15-propose-then-commit/outputs/skill-hitl-design.md"
  },
  {
    "kind": "skill",
    "name": "rollback-rehearsal",
    "description": "为 proposed autonomous workflow 设计 rollback-rehearsal test，并审计 checkpoint backend 是否具备 audit-trail persistence。",
    "tags": [
      "checkpointing",
      "rollback",
      "idempotency",
      "eu-ai-act-article-14",
      "durable-execution"
    ],
    "phase": 15,
    "lesson": 16,
    "lessonPath": "phases/15-autonomous-systems/16-checkpoints-rollback",
    "file": "phases/15-autonomous-systems/16-checkpoints-rollback/outputs/skill-rollback-rehearsal.md"
  },
  {
    "kind": "skill",
    "name": "constitution-review",
    "description": "审计某个部署的 constitutional 层，包括 hardcoded prohibition、soft-coded default、操作方可调整边界，以及四级层级解析。",
    "tags": [
      "constitutional-ai",
      "rule-override",
      "hierarchy",
      "cai",
      "rlaif",
      "hardcoded-prohibition"
    ],
    "phase": 15,
    "lesson": 17,
    "lessonPath": "phases/15-autonomous-systems/17-constitutional-ai",
    "file": "phases/15-autonomous-systems/17-constitutional-ai/outputs/skill-constitution-review.md"
  },
  {
    "kind": "skill",
    "name": "classifier-stack-audit",
    "description": "审计 deployment 的 input/output classifier stack（model、taxonomy、input rails、output rails、dialog rails），并标记 adversarial-attack 缺口。",
    "tags": [
      "llama-guard",
      "nemo-guardrails",
      "input-rails",
      "output-rails",
      "colang",
      "adversarial-attacks"
    ],
    "phase": 15,
    "lesson": 18,
    "lessonPath": "phases/15-autonomous-systems/18-llama-guard",
    "file": "phases/15-autonomous-systems/18-llama-guard/outputs/skill-classifier-stack-audit.md"
  },
  {
    "kind": "skill",
    "name": "scaling-policy-review",
    "description": "根据 RSP v3.0 参考结构审查 frontier-lab scaling policy（Anthropic RSP、OpenAI Preparedness、DeepMind FSF、内部政策）。",
    "tags": [
      "rsp",
      "scaling-policy",
      "ai-rd-4",
      "pause-commitment",
      "saferai",
      "governance"
    ],
    "phase": 15,
    "lesson": 19,
    "lessonPath": "phases/15-autonomous-systems/19-anthropic-rsp",
    "file": "phases/15-autonomous-systems/19-anthropic-rsp/outputs/skill-scaling-policy-review.md"
  },
  {
    "kind": "skill",
    "name": "cross-policy-diff",
    "description": "使用 OpenAI Preparedness Framework v2、Anthropic RSP v3.0 和 DeepMind FSF v3 作为参考，为特定能力生成跨政策对比。",
    "tags": [
      "preparedness-framework",
      "fsf",
      "rsp",
      "cross-policy",
      "scaling-policy"
    ],
    "phase": 15,
    "lesson": 20,
    "lessonPath": "phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf",
    "file": "phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf/outputs/skill-cross-policy-diff.md"
  },
  {
    "kind": "skill",
    "name": "horizon-interpretation",
    "description": "审查 vendor 的 time-horizon claim，并产出 benchmark claim 与 deployment reality 之间的 gap analysis。",
    "tags": [
      "metr",
      "time-horizon",
      "hcast",
      "re-bench",
      "eval-vs-deploy",
      "external-evaluation"
    ],
    "phase": 15,
    "lesson": 21,
    "lessonPath": "phases/15-autonomous-systems/21-metr-external-evaluation",
    "file": "phases/15-autonomous-systems/21-metr-external-evaluation/outputs/skill-horizon-interpretation.md"
  },
  {
    "kind": "skill",
    "name": "societal-risk-review",
    "description": "使用 CAIS 四类风险框架以及 CAISI / SB-53 监管语境，审查一个部署的社会规模风险姿态。",
    "tags": [
      "cais",
      "caisi",
      "four-risk-framework",
      "organizational-risk",
      "sb-53",
      "societal-risk"
    ],
    "phase": 15,
    "lesson": 22,
    "lessonPath": "phases/15-autonomous-systems/22-cais-caisi-societal-risk",
    "file": "phases/15-autonomous-systems/22-cais-caisi-societal-risk/outputs/skill-societal-risk-review.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-multi-agent-decision",
    "description": "判断一个任务需要 multi-agent system 还是 single agent",
    "tags": [],
    "phase": 16,
    "lesson": 1,
    "lessonPath": "phases/16-multi-agent-and-swarms/01-why-multi-agent",
    "file": "phases/16-multi-agent-and-swarms/01-why-multi-agent/outputs/prompt-multi-agent-decision.md"
  },
  {
    "kind": "skill",
    "name": "fipa-mapper",
    "description": "将任何 2026 agent-protocol spec（MCP, A2A, ACP, ANP, CA-MCP, NLIP，或新的 spec）映射到 FIPA-ACL performatives 和 interaction protocols，以判断哪些是真正的新意，哪些是重新发明。",
    "tags": [
      "multi-agent",
      "protocols",
      "FIPA",
      "speech-acts",
      "interoperability"
    ],
    "phase": 16,
    "lesson": 2,
    "lessonPath": "phases/16-multi-agent-and-swarms/02-fipa-acl-heritage",
    "file": "phases/16-multi-agent-and-swarms/02-fipa-acl-heritage/outputs/skill-fipa-mapper.md"
  },
  {
    "kind": "prompt",
    "name": "prompt-protocol-selector",
    "description": "根据系统需求帮助选择合适的 agent communication protocol（MCP, A2A, ACP, ANP）",
    "tags": [],
    "phase": 16,
    "lesson": 3,
    "lessonPath": "phases/16-multi-agent-and-swarms/03-communication-protocols",
    "file": "phases/16-multi-agent-and-swarms/03-communication-protocols/outputs/prompt-protocol-selector.md"
  },
  {
    "kind": "skill",
    "name": "primitive-mapper",
    "description": "将任意 multi-agent framework 或 codebase 映射到四个 primitive 轴（agent、handoff、shared state、orchestrator）。",
    "tags": [
      "multi-agent",
      "primitives",
      "framework-comparison",
      "architecture"
    ],
    "phase": 16,
    "lesson": 4,
    "lessonPath": "phases/16-multi-agent-and-swarms/04-primitive-model",
    "file": "phases/16-multi-agent-and-swarms/04-primitive-model/outputs/skill-primitive-mapper.md"
  },
  {
    "kind": "skill",
    "name": "supervisor-designer",
    "description": "为给定的研究型 query 设计 supervisor/orchestrator-worker system，指定 lead prompt、worker roles、decomposition rules 和 synthesis template。",
    "tags": [
      "multi-agent",
      "supervisor",
      "orchestrator",
      "anthropic-research",
      "langgraph"
    ],
    "phase": 16,
    "lesson": 5,
    "lessonPath": "phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern",
    "file": "phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/outputs/skill-supervisor-designer.md"
  },
  {
    "kind": "skill",
    "name": "hierarchy-fitness",
    "description": "判断一个 multi-agent 任务适合 hierarchical、flat supervisor 还是 sequential。暴露关键 failure modes。",
    "tags": [
      "multi-agent",
      "hierarchy",
      "crewai",
      "langgraph",
      "decomposition-drift"
    ],
    "phase": 16,
    "lesson": 6,
    "lessonPath": "phases/16-multi-agent-and-swarms/06-hierarchical-architecture",
    "file": "phases/16-multi-agent-and-swarms/06-hierarchical-architecture/outputs/skill-hierarchy-fitness.md"
  },
  {
    "kind": "skill",
    "name": "debate-configurator",
    "description": "为给定任务配置 multi-agent debate，并在运行前估算质量提升和 Token 成本。",
    "tags": [
      "multi-agent",
      "debate",
      "society-of-mind",
      "consensus"
    ],
    "phase": 16,
    "lesson": 7,
    "lessonPath": "phases/16-multi-agent-and-swarms/07-society-of-mind-debate",
    "file": "phases/16-multi-agent-and-swarms/07-society-of-mind-debate/outputs/skill-debate-configurator.md"
  },
  {
    "kind": "skill",
    "name": "role-designer",
    "description": "为 multi-agent system 生成 role roster，为给定任务命名 planner/executor/critic/verifier，并提供明确的 I/O schemas。",
    "tags": [
      "multi-agent",
      "role-specialization",
      "metagpt",
      "chatdev",
      "verification"
    ],
    "phase": 16,
    "lesson": 8,
    "lessonPath": "phases/16-multi-agent-and-swarms/08-role-specialization",
    "file": "phases/16-multi-agent-and-swarms/08-role-specialization/outputs/skill-role-designer.md"
  },
  {
    "kind": "skill",
    "name": "swarm-fit",
    "description": "判断一个任务适合 swarm（去中心化）架构还是 supervisor（中心化）架构。",
    "tags": [
      "multi-agent",
      "swarm",
      "decentralized",
      "langgraph",
      "matrix"
    ],
    "phase": 16,
    "lesson": 9,
    "lessonPath": "phases/16-multi-agent-and-swarms/09-parallel-swarm-networks",
    "file": "phases/16-multi-agent-and-swarms/09-parallel-swarm-networks/outputs/skill-swarm-fit.md"
  },
  {
    "kind": "skill",
    "name": "groupchat-selector",
    "description": "为任务配置 AutoGen/AG2 风格的 GroupChat selector，命名 selector 变体、终止条件和防 hot-speaker 规则。",
    "tags": [
      "multi-agent",
      "groupchat",
      "autogen",
      "ag2",
      "speaker-selection"
    ],
    "phase": 16,
    "lesson": 10,
    "lessonPath": "phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection",
    "file": "phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection/outputs/skill-groupchat-selector.md"
  },
  {
    "kind": "skill",
    "name": "handoff-designer",
    "description": "为 Swarm/Agents-SDK 风格系统设计 handoff 拓扑：存在哪些 agents、它们可以调用哪些 handoffs、传递什么上下文。",
    "tags": [
      "multi-agent",
      "swarm",
      "handoff",
      "openai-agents-sdk"
    ],
    "phase": 16,
    "lesson": 11,
    "lessonPath": "phases/16-multi-agent-and-swarms/11-handoffs-and-routines",
    "file": "phases/16-multi-agent-and-swarms/11-handoffs-and-routines/outputs/skill-handoff-designer.md"
  },
  {
    "kind": "skill",
    "name": "a2a-integrator",
    "description": "设计两个 Agent 之间的 A2A 集成 — Agent Card、任务 schema、auth、streaming 或 polling。",
    "tags": [
      "multi-agent",
      "a2a",
      "protocol",
      "interoperability",
      "google"
    ],
    "phase": 16,
    "lesson": 12,
    "lessonPath": "phases/16-multi-agent-and-swarms/12-a2a-protocol",
    "file": "phases/16-multi-agent-and-swarms/12-a2a-protocol/outputs/skill-a2a-integrator.md"
  },
  {
    "kind": "skill",
    "name": "memory-auditor",
    "description": "审计 multi-agent system 的 shared-memory 设计，检查 provenance、versioning、verifier separation 和 projection schema。在生产前标记 memory-poisoning 暴露风险。",
    "tags": [
      "multi-agent",
      "shared-state",
      "blackboard",
      "memory-poisoning",
      "provenance"
    ],
    "phase": 16,
    "lesson": 13,
    "lessonPath": "phases/16-multi-agent-and-swarms/13-shared-memory-blackboard",
    "file": "phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/outputs/skill-memory-auditor.md"
  },
  {
    "kind": "skill",
    "name": "consensus-designer",
    "description": "为 multi-agent ensemble 设计一个 BFT-aware consensus protocol。选择 clustering、weighting、threshold 和 escalation policy；针对 byzantine、sycophancy 和 monoculture patterns 对设计进行 attack-test。",
    "tags": [
      "multi-agent",
      "consensus",
      "BFT",
      "voting",
      "confidence"
    ],
    "phase": 16,
    "lesson": 14,
    "lessonPath": "phases/16-multi-agent-and-swarms/14-consensus-and-bft",
    "file": "phases/16-multi-agent-and-swarms/14-consensus-and-bft/outputs/skill-consensus-designer.md"
  },
  {
    "kind": "skill",
    "name": "topology-picker",
    "description": "为给定任务选择 multi-agent debate topology（star / chain / tree / graph）、agent 数量 N、异质性配置和轮次上限。",
    "tags": [
      "multi-agent",
      "debate",
      "topology",
      "voting",
      "self-consistency"
    ],
    "phase": 16,
    "lesson": 15,
    "lessonPath": "phases/16-multi-agent-and-swarms/15-voting-debate-topology",
    "file": "phases/16-multi-agent-and-swarms/15-voting-debate-topology/outputs/skill-topology-picker.md"
  },
  {
    "kind": "skill",
    "name": "bargainer-designer",
    "description": "设计 negotiation protocol：哪个 agent 负责 narrates，哪个 component 生成 offers，private scratchpads 如何与 public messages 分离，round bound 是多少，以及如何监控 deal rate。",
    "tags": [
      "multi-agent",
      "negotiation",
      "bargaining",
      "contract-net",
      "OG-Narrator"
    ],
    "phase": 16,
    "lesson": 16,
    "lessonPath": "phases/16-multi-agent-and-swarms/16-negotiation-bargaining",
    "file": "phases/16-multi-agent-and-swarms/16-negotiation-bargaining/outputs/skill-bargainer-designer.md"
  },
  {
    "kind": "skill",
    "name": "simulation-designer",
    "description": "为给定场景设计 generative-agent simulation（Smallville-style）。指定 memory schema、reflection cadence、plan horizon、空间/社会约束和评估指标。",
    "tags": [
      "multi-agent",
      "simulation",
      "generative-agents",
      "emergence",
      "memory"
    ],
    "phase": 16,
    "lesson": 17,
    "lessonPath": "phases/16-multi-agent-and-swarms/17-generative-agents-simulation",
    "file": "phases/16-multi-agent-and-swarms/17-generative-agents-simulation/outputs/skill-simulation-designer.md"
  },
  {
    "kind": "skill",
    "name": "tom-auditor",
    "description": "审计一个声称具备“emergent coordination”的 multi-agent system。通过 control conditions、statistical tests 和 complementarity measurement，把真实的 ToM-enabled coordination 与 prompt-dressed illusion 区分开。",
    "tags": [
      "multi-agent",
      "theory-of-mind",
      "coordination",
      "evaluation",
      "emergence"
    ],
    "phase": 16,
    "lesson": 18,
    "lessonPath": "phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination",
    "file": "phases/16-multi-agent-and-swarms/18-theory-of-mind-coordination/outputs/skill-tom-auditor.md"
  },
  {
    "kind": "skill",
    "name": "swarm-optimizer",
    "description": "为给定的 LLM 或 agent optimization problem 在 PSO、ACO、genetic algorithms 和 gradient-based optimizers 之间做选择。生物启发式 swarm algorithms 无 Gradient，适合 LLM 时代中 search space 离散或 fitness function 是黑盒的 workloads。",
    "tags": [
      "multi-agent",
      "swarm-optimization",
      "PSO",
      "ACO",
      "prompt-optimization",
      "routing"
    ],
    "phase": 16,
    "lesson": 19,
    "lessonPath": "phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco",
    "file": "phases/16-multi-agent-and-swarms/19-swarm-optimization-pso-aco/outputs/skill-swarm-optimizer.md"
  },
  {
    "kind": "skill",
    "name": "marl-picker",
    "description": "为给定 multi-agent task 选择 MARL algorithm（MADDPG、QMIX、MAPPO、IQL 或扩展）。考虑 cooperative vs competitive、action-space type、heterogeneity、reward structure 和 scale。",
    "tags": [
      "multi-agent",
      "MARL",
      "MADDPG",
      "QMIX",
      "MAPPO",
      "CTDE"
    ],
    "phase": 16,
    "lesson": 20,
    "lessonPath": "phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo",
    "file": "phases/16-multi-agent-and-swarms/20-marl-maddpg-qmix-mappo/outputs/skill-marl-picker.md"
  },
  {
    "kind": "skill",
    "name": "economy-designer",
    "description": "设计一个最小 agent economy：identity、credit attribution、payment mechanism、reputation。选择能解决用户 multi-agent incentive problem 的最小 stack。",
    "tags": [
      "multi-agent",
      "economy",
      "Shapley",
      "auctions",
      "reputation",
      "DePIN"
    ],
    "phase": 16,
    "lesson": 21,
    "lessonPath": "phases/16-multi-agent-and-swarms/21-agent-economies",
    "file": "phases/16-multi-agent-and-swarms/21-agent-economies/outputs/skill-economy-designer.md"
  },
  {
    "kind": "skill",
    "name": "scaling-advisor",
    "description": "为 multi-agent production system 提供 durable-execution 选择建议。根据具体负载和 state-retention 需求，在 FastAPI + Postgres、LangGraph runtime、Temporal、Restate 或 custom 之间选择。",
    "tags": [
      "multi-agent",
      "production",
      "scaling",
      "durable-execution",
      "queues",
      "checkpoints"
    ],
    "phase": 16,
    "lesson": 22,
    "lessonPath": "phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints",
    "file": "phases/16-multi-agent-and-swarms/22-production-scaling-queues-checkpoints/outputs/skill-scaling-advisor.md"
  },
  {
    "kind": "skill",
    "name": "mast-auditor",
    "description": "对 multi-agent system 运行 MAST-style failure-mode audit。将 execution-trace failures 分类为 Specification / Coordination / Verification 以及 Groupthink families；按预期 failure reduction 对 mitigations 排名。",
    "tags": [
      "multi-agent",
      "failure-modes",
      "MAST",
      "groupthink",
      "circuit-breaker",
      "audit"
    ],
    "phase": 16,
    "lesson": 23,
    "lessonPath": "phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink",
    "file": "phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/outputs/skill-mast-auditor.md"
  },
  {
    "kind": "skill",
    "name": "benchmark-reader",
    "description": "用怀疑态度阅读 multi-agent benchmark claim。根据 benchmark selection、contamination、baselines、statistical significance、task diversity 和 cost disclosure 对 claim 评分。",
    "tags": [
      "multi-agent",
      "benchmarks",
      "evaluation",
      "SWE-bench",
      "MARBLE"
    ],
    "phase": 16,
    "lesson": 24,
    "lessonPath": "phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks",
    "file": "phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/outputs/skill-benchmark-reader.md"
  },
  {
    "kind": "skill",
    "name": "case-study-mapper",
    "description": "将拟议的 multi-agent system design 映射到最接近的 2026 生产参考（Anthropic Research、MetaGPT/ChatDev 或 OpenClaw/Moltbook）。呈现已知 trade-offs、推荐 framework，以及已在生产环境中测试过的具体设计决策。",
    "tags": [
      "multi-agent",
      "case-studies",
      "production",
      "framework-selection",
      "reference-architectures"
    ],
    "phase": 16,
    "lesson": 25,
    "lessonPath": "phases/16-multi-agent-and-swarms/25-case-studies-2026-sota",
    "file": "phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/outputs/skill-case-study-mapper.md"
  },
  {
    "kind": "skill",
    "name": "managed-platform-picker",
    "description": "根据 workload、SLA 和 compliance requirements，选择一个托管 LLM 平台（Bedrock, Azure OpenAI, Vertex AI）以及第二个平台用于 redundancy，然后生成 FinOps instrumentation plan。",
    "tags": [
      "bedrock",
      "azure-openai",
      "vertex-ai",
      "ptu",
      "finops",
      "managed-platforms"
    ],
    "phase": 17,
    "lesson": 1,
    "lessonPath": "phases/17-infrastructure-and-production/01-managed-llm-platforms",
    "file": "phases/17-infrastructure-and-production/01-managed-llm-platforms/outputs/skill-managed-platform-picker.md"
  },
  {
    "kind": "skill",
    "name": "inference-platform-picker",
    "description": "根据 workload、SLA、预算和运营约束选择 inference platform（Fireworks、Together、Baseten、Modal、Replicate、Anyscale 或 custom silicon）。规范化 per-token、per-minute 和 per-prediction 定价。",
    "tags": [
      "inference",
      "fireworks",
      "together",
      "baseten",
      "modal",
      "replicate",
      "anyscale",
      "economics"
    ],
    "phase": 17,
    "lesson": 2,
    "lessonPath": "phases/17-infrastructure-and-production/02-inference-platform-economics",
    "file": "phases/17-infrastructure-and-production/02-inference-platform-economics/outputs/skill-inference-platform-picker.md"
  },
  {
    "kind": "skill",
    "name": "gpu-autoscaler-plan",
    "description": "为基于 Kubernetes 的 LLM serving cluster 设计三层 GPU autoscaling 方案（Karpenter + KAI Scheduler + 应用信号）。诊断 DCGM_FI_DEV_GPU_UTIL 陷阱和部分分配失败。",
    "tags": [
      "kubernetes",
      "gpu",
      "autoscaling",
      "karpenter",
      "kai-scheduler",
      "hpa",
      "dynamo-planner",
      "llm-d"
    ],
    "phase": 17,
    "lesson": 3,
    "lessonPath": "phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes",
    "file": "phases/17-infrastructure-and-production/03-gpu-autoscaling-kubernetes/outputs/skill-gpu-autoscaler-plan.md"
  },
  {
    "kind": "skill",
    "name": "vllm-scheduler-reader",
    "description": "通过读取 scheduler 层级参数，诊断 vLLM serving 配置，并识别 PagedAttention、continuous batching 和 chunked prefill 中哪一个是瓶颈。",
    "tags": [
      "vllm",
      "paged-attention",
      "continuous-batching",
      "chunked-prefill",
      "serving",
      "scheduler"
    ],
    "phase": 17,
    "lesson": 4,
    "lessonPath": "phases/17-infrastructure-and-production/04-vllm-serving-internals",
    "file": "phases/17-infrastructure-and-production/04-vllm-serving-internals/outputs/skill-vllm-scheduler-reader.md"
  },
  {
    "kind": "skill",
    "name": "eagle3-rollout",
    "description": "生成分阶段的 EAGLE-3 speculative-decoding rollout plan，在上线前测量真实流量上的 acceptance rate alpha。",
    "tags": [
      "speculative-decoding",
      "eagle-3",
      "vllm",
      "alpha",
      "production-rollout"
    ],
    "phase": 17,
    "lesson": 5,
    "lessonPath": "phases/17-infrastructure-and-production/05-eagle3-speculative-decoding",
    "file": "phases/17-infrastructure-and-production/05-eagle3-speculative-decoding/outputs/skill-eagle3-rollout.md"
  },
  {
    "kind": "skill",
    "name": "radix-scheduler-advisor",
    "description": "为希望利用 RadixAttention cache 复用的 prefix-heavy workload，提供 SGLang 采用建议和 prompt-ordering 规范建议。",
    "tags": [
      "sglang",
      "radixattention",
      "prefix-caching",
      "scheduler",
      "prompt-ordering"
    ],
    "phase": 17,
    "lesson": 6,
    "lessonPath": "phases/17-infrastructure-and-production/06-sglang-radixattention",
    "file": "phases/17-infrastructure-and-production/06-sglang-radixattention/outputs/skill-radix-scheduler-advisor.md"
  },
  {
    "kind": "skill",
    "name": "trtllm-blackwell-advisor",
    "description": "判断对给定 workload 和预算而言，Blackwell + TensorRT-LLM + Dynamo 是否值得 NVIDIA-lock。",
    "tags": [
      "tensorrt-llm",
      "blackwell",
      "b200",
      "gb200",
      "nvfp4",
      "fp8",
      "dynamo"
    ],
    "phase": 17,
    "lesson": 7,
    "lessonPath": "phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell",
    "file": "phases/17-infrastructure-and-production/07-tensorrt-llm-blackwell/outputs/skill-trtllm-blackwell-advisor.md"
  },
  {
    "kind": "skill",
    "name": "slo-goodput-gate",
    "description": "生成一个可用于 CI/CD 的 benchmark 方案，用 goodput 而不是 throughput 来门控 LLM 部署，并包含 P50/P90/P99 百分位数和已记录的工具选择。",
    "tags": [
      "inference-metrics",
      "goodput",
      "ttft",
      "tpot",
      "itl",
      "slo",
      "benchmarking"
    ],
    "phase": 17,
    "lesson": 8,
    "lessonPath": "phases/17-infrastructure-and-production/08-inference-metrics-goodput",
    "file": "phases/17-infrastructure-and-production/08-inference-metrics-goodput/outputs/skill-slo-goodput-gate.md"
  },
  {
    "kind": "skill",
    "name": "quantization-picker",
    "description": "在给定 hardware、engine、workload 和 quality tolerance 时，选择一种 2026 quantization format，并产出 calibration + validation plan。",
    "tags": [
      "quantization",
      "awq",
      "gptq",
      "gguf",
      "fp8",
      "nvfp4",
      "calibration"
    ],
    "phase": 17,
    "lesson": 9,
    "lessonPath": "phases/17-infrastructure-and-production/09-production-quantization",
    "file": "phases/17-infrastructure-and-production/09-production-quantization/outputs/skill-quantization-picker.md"
  },
  {
    "kind": "skill",
    "name": "cold-start-planner",
    "description": "为 serverless LLM 部署选择并叠加 cold-start 缓解措施。为各阶段（node、image、weights、engine、first forward）分配预算，并将缓解措施匹配到 SLA。",
    "tags": [
      "cold-start",
      "serverless",
      "bottlerocket",
      "model-streamer",
      "gpu-snapshot",
      "warm-pool",
      "serverlessllm"
    ],
    "phase": 17,
    "lesson": 10,
    "lessonPath": "phases/17-infrastructure-and-production/10-cold-start-mitigation",
    "file": "phases/17-infrastructure-and-production/10-cold-start-mitigation/outputs/skill-cold-start-planner.md"
  },
  {
    "kind": "skill",
    "name": "multi-region-router",
    "description": "设计一个包含 KV-cache locality、residency boundaries、DR manifest 和季度 failover drill 的 multi-region LLM routing plan。",
    "tags": [
      "multi-region",
      "kv-cache",
      "routing",
      "dr",
      "bedrock-cri",
      "vllm-router",
      "llm-d",
      "gorgo"
    ],
    "phase": 17,
    "lesson": 11,
    "lessonPath": "phases/17-infrastructure-and-production/11-multi-region-kv-locality",
    "file": "phases/17-infrastructure-and-production/11-multi-region-kv-locality/outputs/skill-multi-region-router.md"
  },
  {
    "kind": "skill",
    "name": "edge-target-picker",
    "description": "根据 device、model 和 latency budget，选择 edge inference target（Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson）以及匹配的 quantization format。",
    "tags": [
      "edge",
      "ane",
      "hexagon",
      "webgpu",
      "webllm",
      "jetson",
      "core-ml",
      "qnn",
      "nvfp4"
    ],
    "phase": 17,
    "lesson": 12,
    "lessonPath": "phases/17-infrastructure-and-production/12-edge-inference",
    "file": "phases/17-infrastructure-and-production/12-edge-inference/outputs/skill-edge-target-picker.md"
  },
  {
    "kind": "skill",
    "name": "observability-stack",
    "description": "给定 stack、scale、budget 和 license posture，选择一个 LLM observability stack（development platform + gateway + optional scale layer），并定义 OpenTelemetry GenAI attribute set。",
    "tags": [
      "observability",
      "langfuse",
      "langsmith",
      "phoenix",
      "arize",
      "helicone",
      "opik",
      "opentelemetry",
      "genai-conventions"
    ],
    "phase": 17,
    "lesson": 13,
    "lessonPath": "phases/17-infrastructure-and-production/13-llm-observability",
    "file": "phases/17-infrastructure-and-production/13-llm-observability/outputs/skill-observability-stack.md"
  },
  {
    "kind": "skill",
    "name": "cache-auditor",
    "description": "审计 LLM Prompt template 和流量模式的可缓存性。推荐 Prompt 重构、TTL 选择、并行化修复方案，以及 Semantic Cache threshold。",
    "tags": [
      "caching",
      "prompt-cache",
      "semantic-cache",
      "anthropic",
      "openai",
      "parallelization",
      "ttl"
    ],
    "phase": 17,
    "lesson": 14,
    "lessonPath": "phases/17-infrastructure-and-production/14-prompt-semantic-caching",
    "file": "phases/17-infrastructure-and-production/14-prompt-semantic-caching/outputs/skill-cache-auditor.md"
  },
  {
    "kind": "skill",
    "name": "batch-triager",
    "description": "将 LLM workloads 分流到 interactive / semi-interactive / batch lanes，计算 stacked discount（batch + cache）savings，并标记 mis-triaged workloads。",
    "tags": [
      "batch-api",
      "openai-batch",
      "anthropic-batches",
      "vertex-batch",
      "triage",
      "cost"
    ],
    "phase": 17,
    "lesson": 15,
    "lessonPath": "phases/17-infrastructure-and-production/15-batch-apis",
    "file": "phases/17-infrastructure-and-production/15-batch-apis/outputs/skill-batch-triager.md"
  },
  {
    "kind": "skill",
    "name": "router-plan",
    "description": "设计一个 LLM model-routing 计划 — 选择 pattern（pre-route、cascade、ensemble）、signals（task、length、embedding、confidence）和在线质量门禁。",
    "tags": [
      "routing",
      "cascade",
      "model-cascade",
      "routellm",
      "notdiamond",
      "cost-reduction"
    ],
    "phase": 17,
    "lesson": 16,
    "lessonPath": "phases/17-infrastructure-and-production/16-model-routing",
    "file": "phases/17-infrastructure-and-production/16-model-routing/outputs/skill-router-plan.md"
  },
  {
    "kind": "skill",
    "name": "disaggregation-decider",
    "description": "判断给定 workload 和 cluster 是否应采用 disaggregated prefill/decode（Dynamo 或 llm-d）。量化 prefill:decode ratios、KV transfer cost，以及预期 savings。",
    "tags": [
      "disaggregated-serving",
      "dynamo",
      "llm-d",
      "nixl",
      "kv-transfer",
      "prefill-decode"
    ],
    "phase": 17,
    "lesson": 17,
    "lessonPath": "phases/17-infrastructure-and-production/17-disaggregated-prefill-decode",
    "file": "phases/17-infrastructure-and-production/17-disaggregated-prefill-decode/outputs/skill-disaggregation-decider.md"
  },
  {
    "kind": "skill",
    "name": "vllm-stack-decider",
    "description": "根据 workload 和 fleet 规模，决定 vLLM 部署布局 — production-stack Helm chart、KV offload（原生 CPU 或 LMCache）、router/observability 集成。",
    "tags": [
      "vllm",
      "production-stack",
      "lmcache",
      "kv-offload",
      "connector-api"
    ],
    "phase": 17,
    "lesson": 18,
    "lessonPath": "phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache",
    "file": "phases/17-infrastructure-and-production/18-vllm-production-stack-lmcache/outputs/skill-vllm-stack-decider.md"
  },
  {
    "kind": "skill",
    "name": "gateway-picker",
    "description": "在给定 scale、latency budget、compliance、ops posture 和 pricing tolerance 的情况下，选择一个 AI gateway（LiteLLM、Portkey、Kong AI、Cloudflare/Vercel）。",
    "tags": [
      "ai-gateway",
      "litellm",
      "portkey",
      "kong",
      "cloudflare",
      "vercel",
      "bifrost",
      "fallback",
      "rate-limit",
      "guardrails"
    ],
    "phase": 17,
    "lesson": 19,
    "lessonPath": "phases/17-infrastructure-and-production/19-ai-gateways",
    "file": "phases/17-infrastructure-and-production/19-ai-gateways/outputs/skill-gateway-picker.md"
  },
  {
    "kind": "skill",
    "name": "rollout-runbook",
    "description": "为新的 LLM 模型或 prompt template 设计 shadow → canary → A/B → 100% rollout 计划，包含五个 canary gate、感知噪声底的阈值，以及秒级快速 rollback 路径。",
    "tags": [
      "rollout",
      "canary",
      "shadow",
      "progressive-delivery",
      "feature-flags",
      "argo-rollouts",
      "flagger",
      "kserve"
    ],
    "phase": 17,
    "lesson": 20,
    "lessonPath": "phases/17-infrastructure-and-production/20-shadow-canary-progressive",
    "file": "phases/17-infrastructure-and-production/20-shadow-canary-progressive/outputs/skill-rollout-runbook.md"
  },
  {
    "kind": "skill",
    "name": "ab-plan",
    "description": "设计一个 LLM A/B test —— 选择平台（Statsig 或 GrowthBook）、primary metric、guardrails、带 LLM 噪声缓冲的 sample size、CUPED、sequential stopping 和 multiple-comparison correction。",
    "tags": [
      "ab-testing",
      "statsig",
      "growthbook",
      "cuped",
      "sequential",
      "benjamini-hochberg",
      "srm"
    ],
    "phase": 17,
    "lesson": 21,
    "lessonPath": "phases/17-infrastructure-and-production/21-ab-testing-llm-features",
    "file": "phases/17-infrastructure-and-production/21-ab-testing-llm-features/outputs/skill-ab-plan.md"
  },
  {
    "kind": "skill",
    "name": "load-test-plan",
    "description": "设计一个真实的 LLM 负载测试 — 选择工具（LLMPerf、k6、GenAI-Perf、guidellm），构建四种模式（steady、ramp、spike、soak），并在 CI 中设置 gate。",
    "tags": [
      "load-testing",
      "llmperf",
      "k6",
      "genai-perf",
      "guidellm",
      "llm-locust",
      "ci-gate"
    ],
    "phase": 17,
    "lesson": 22,
    "lessonPath": "phases/17-infrastructure-and-production/22-load-testing-llm-apis",
    "file": "phases/17-infrastructure-and-production/22-load-testing-llm-apis/outputs/skill-load-test-plan.md"
  },
  {
    "kind": "skill",
    "name": "ai-sre-plan",
    "description": "为团队设计 AI SRE rollout — multi-agent triage 架构、结构化 runbooks、adversarial evaluation、狭窄 auto-remediation，以及 predictive-detection posture。",
    "tags": [
      "ai-sre",
      "multi-agent",
      "runbooks",
      "auto-remediation",
      "adversarial-eval",
      "datadog-bits-ai",
      "neubird",
      "predictive"
    ],
    "phase": 17,
    "lesson": 23,
    "lessonPath": "phases/17-infrastructure-and-production/23-sre-for-ai",
    "file": "phases/17-infrastructure-and-production/23-sre-for-ai/outputs/skill-ai-sre-plan.md"
  },
  {
    "kind": "skill",
    "name": "chaos-plan",
    "description": "设计一个 LLM 混沌工程计划 — 验证前置条件，构建四个平面，选择工具，从三个安全实验开始，强制执行安全平面 gates。",
    "tags": [
      "chaos-engineering",
      "litmuschaos",
      "chaosmesh",
      "harness",
      "llm-chaos",
      "game-day"
    ],
    "phase": 17,
    "lesson": 24,
    "lessonPath": "phases/17-infrastructure-and-production/24-chaos-engineering-llm",
    "file": "phases/17-infrastructure-and-production/24-chaos-engineering-llm/outputs/skill-chaos-plan.md"
  },
  {
    "kind": "skill",
    "name": "llm-security-plan",
    "description": "生成一份 LLM security plan，覆盖 secrets vault、带 consistent tokenization 的 PII scrubbing、network egress allowlist、audit log retention 和 zero-trust posture。",
    "tags": [
      "security",
      "vault",
      "hashicorp",
      "aws-secrets-manager",
      "pii",
      "presidio",
      "egress",
      "audit-log",
      "zero-trust",
      "ci-cd-supply-chain"
    ],
    "phase": 17,
    "lesson": 25,
    "lessonPath": "phases/17-infrastructure-and-production/25-security-secrets-audit",
    "file": "phases/17-infrastructure-and-production/25-security-secrets-audit/outputs/skill-llm-security-plan.md"
  },
  {
    "kind": "skill",
    "name": "compliance-matrix",
    "description": "根据客户地域、细分领域和合同范围，为 LLM SaaS 生成必需框架Matrix。将 SOC 2、HIPAA、GDPR、PCI-DSS、EU AI Act、Colorado AI Act、ISO 42001 之间的控制项进行映射。",
    "tags": [
      "compliance",
      "soc2",
      "hipaa",
      "gdpr",
      "pci-dss",
      "eu-ai-act",
      "colorado-ai-act",
      "iso-42001",
      "iso-27001"
    ],
    "phase": 17,
    "lesson": 26,
    "lessonPath": "phases/17-infrastructure-and-production/26-compliance-frameworks",
    "file": "phases/17-infrastructure-and-production/26-compliance-frameworks/outputs/skill-compliance-matrix.md"
  },
  {
    "kind": "skill",
    "name": "finops-plan",
    "description": "设计一个 LLM FinOps program，包括 attribution schema（user/task/tenant + 四个 Token 层）、三层 enforcement ladder，以及单位指标（cost per resolved / artifact）。",
    "tags": [
      "finops",
      "cost-attribution",
      "multi-tenant",
      "kill-switch",
      "unit-economics",
      "rate-limit"
    ],
    "phase": 17,
    "lesson": 27,
    "lessonPath": "phases/17-infrastructure-and-production/27-finops-llms",
    "file": "phases/17-infrastructure-and-production/27-finops-llms/outputs/skill-finops-plan.md"
  },
  {
    "kind": "skill",
    "name": "engine-picker",
    "description": "在给定硬件、规模和工作负载的情况下，选择一个 self-hosted LLM engine（llama.cpp、Ollama、TGI、vLLM、SGLang）。将 2026 年 TGI maintenance mode 指定为迁移触发因素。",
    "tags": [
      "self-hosted",
      "vllm",
      "sglang",
      "llama-cpp",
      "ollama",
      "tgi",
      "trt-llm",
      "engine-selection"
    ],
    "phase": 17,
    "lesson": 28,
    "lessonPath": "phases/17-infrastructure-and-production/28-self-hosted-serving-selection",
    "file": "phases/17-infrastructure-and-production/28-self-hosted-serving-selection/outputs/skill-engine-picker.md"
  },
  {
    "kind": "skill",
    "name": "instructgpt-explainer",
    "description": "根据三阶段 InstructGPT 参考框架诊断一篇 RLHF-family 论文或 pipeline。",
    "tags": [
      "rlhf",
      "instructgpt",
      "sft",
      "reward-model",
      "ppo",
      "alignment"
    ],
    "phase": 18,
    "lesson": 1,
    "lessonPath": "phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal",
    "file": "phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/outputs/skill-instructgpt-explainer.md"
  },
  {
    "kind": "skill",
    "name": "reward-hack-auditor",
    "description": "根据训练日志和 eval 输出，诊断已训练 RLHF model 中的 reward-hacking failure modes。",
    "tags": [
      "reward-hacking",
      "goodhart",
      "rlhf",
      "over-optimization",
      "sycophancy"
    ],
    "phase": 18,
    "lesson": 2,
    "lessonPath": "phases/18-ethics-safety-alignment/02-reward-hacking-goodhart",
    "file": "phases/18-ethics-safety-alignment/02-reward-hacking-goodhart/outputs/skill-reward-hack-auditor.md"
  },
  {
    "kind": "skill",
    "name": "preference-loss-selector",
    "description": "根据数据集形态和目标阶段推荐 direct-alignment-algorithm loss。",
    "tags": [
      "dpo",
      "ipo",
      "kto",
      "simpo",
      "orpo",
      "bpo",
      "daa",
      "preference-optimization"
    ],
    "phase": 18,
    "lesson": 3,
    "lessonPath": "phases/18-ethics-safety-alignment/03-direct-preference-optimization-family",
    "file": "phases/18-ethics-safety-alignment/03-direct-preference-optimization-family/outputs/skill-preference-loss-selector.md"
  },
  {
    "kind": "skill",
    "name": "sycophancy-probe",
    "description": "生成匹配的 user-belief / third-party-belief prompts，并为模型的 Sycophancy 评分。",
    "tags": [
      "sycophancy",
      "rlhf",
      "evaluation",
      "calibration"
    ],
    "phase": 18,
    "lesson": 4,
    "lessonPath": "phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification",
    "file": "phases/18-ethics-safety-alignment/04-sycophancy-rlhf-amplification/outputs/skill-sycophancy-probe.md"
  },
  {
    "kind": "skill",
    "name": "constitution-writer",
    "description": "为特定 domain 的 AI system 起草一份四层 constitution。",
    "tags": [
      "constitutional-ai",
      "rlaif",
      "principles",
      "claude",
      "governance"
    ],
    "phase": 18,
    "lesson": 5,
    "lessonPath": "phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif",
    "file": "phases/18-ethics-safety-alignment/05-constitutional-ai-rlaif/outputs/skill-constitution-writer.md"
  },
  {
    "kind": "skill",
    "name": "mesa-diagnostic",
    "description": "将观察到的 safety failure 分类为 outer-alignment、proxy-inner 或 deceptive-inner。",
    "tags": [
      "mesa-optimization",
      "deceptive-alignment",
      "inner-alignment",
      "hubinger"
    ],
    "phase": 18,
    "lesson": 6,
    "lessonPath": "phases/18-ethics-safety-alignment/06-mesa-optimization-deceptive-alignment",
    "file": "phases/18-ethics-safety-alignment/06-mesa-optimization-deceptive-alignment/outputs/skill-mesa-diagnostic.md"
  },
  {
    "kind": "skill",
    "name": "sleeper-audit",
    "description": "审核一份 alignment-training report，判断它是否真的证明了已植入或疑似 backdoor 的移除。",
    "tags": [
      "sleeper-agents",
      "backdoor",
      "alignment-training",
      "adversarial-training",
      "probes"
    ],
    "phase": 18,
    "lesson": 7,
    "lessonPath": "phases/18-ethics-safety-alignment/07-sleeper-agents-persistent-deception",
    "file": "phases/18-ethics-safety-alignment/07-sleeper-agents-persistent-deception/outputs/skill-sleeper-audit.md"
  },
  {
    "kind": "skill",
    "name": "scheming-triage",
    "description": "根据 Apollo three-pillar scheming framework 对 agent-deployment incident report 进行 triage。",
    "tags": [
      "scheming",
      "agent-safety",
      "apollo",
      "three-pillars",
      "safety-cases"
    ],
    "phase": 18,
    "lesson": 8,
    "lessonPath": "phases/18-ethics-safety-alignment/08-in-context-scheming-frontier-models",
    "file": "phases/18-ethics-safety-alignment/08-in-context-scheming-frontier-models/outputs/skill-scheming-triage.md"
  },
  {
    "kind": "skill",
    "name": "compliance-gap",
    "description": "通过 monitored / unmonitored compliance gap，评估一份 safety report 是否能够检测 alignment faking。",
    "tags": [
      "alignment-faking",
      "compliance-gap",
      "anthropic",
      "safety-evaluation"
    ],
    "phase": 18,
    "lesson": 9,
    "lessonPath": "phases/18-ethics-safety-alignment/09-alignment-faking",
    "file": "phases/18-ethics-safety-alignment/09-alignment-faking/outputs/skill-compliance-gap.md"
  },
  {
    "kind": "skill",
    "name": "control-protocol-audit",
    "description": "在 AI Control 威胁模型下审计部署协议。",
    "tags": [
      "ai-control",
      "subversion",
      "trusted-editing",
      "untrusted-monitoring",
      "safety-case"
    ],
    "phase": 18,
    "lesson": 10,
    "lessonPath": "phases/18-ethics-safety-alignment/10-ai-control-subversion",
    "file": "phases/18-ethics-safety-alignment/10-ai-control-subversion/outputs/skill-control-protocol-audit.md"
  },
  {
    "kind": "skill",
    "name": "w2sg-pgr",
    "description": "通过 performance-gap-recovered 指标审计 scalable-oversight 或 W2SG 主张。",
    "tags": [
      "scalable-oversight",
      "weak-to-strong",
      "pgr",
      "debate",
      "recursive-reward-modeling"
    ],
    "phase": 18,
    "lesson": 11,
    "lessonPath": "phases/18-ethics-safety-alignment/11-scalable-oversight-weak-to-strong",
    "file": "phases/18-ethics-safety-alignment/11-scalable-oversight-weak-to-strong/outputs/skill-w2sg-pgr.md"
  },
  {
    "kind": "skill",
    "name": "attack-audit",
    "description": "审计 red-team evaluation report 的 attack coverage、budget、judge identity 和 behaviour set。",
    "tags": [
      "red-teaming",
      "jailbreak",
      "pair",
      "harmbench",
      "jailbreakbench",
      "asr"
    ],
    "phase": 18,
    "lesson": 12,
    "lessonPath": "phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks",
    "file": "phases/18-ethics-safety-alignment/12-red-teaming-pair-automated-attacks/outputs/skill-attack-audit.md"
  },
  {
    "kind": "skill",
    "name": "msj-audit",
    "description": "审计 long-context safety evaluation 是否覆盖 many-shot jailbreaking。",
    "tags": [
      "many-shot-jailbreaking",
      "context-window",
      "power-law",
      "anthropic"
    ],
    "phase": 18,
    "lesson": 13,
    "lessonPath": "phases/18-ethics-safety-alignment/13-many-shot-jailbreaking",
    "file": "phases/18-ethics-safety-alignment/13-many-shot-jailbreaking/outputs/skill-msj-audit.md"
  },
  {
    "kind": "skill",
    "name": "encoding-audit",
    "description": "审计一份 jailbreak-defense report 对 encoding-family attacks 的覆盖情况。",
    "tags": [
      "artprompt",
      "ascii-art",
      "encoding-attack",
      "utes",
      "structural-sleight"
    ],
    "phase": 18,
    "lesson": 14,
    "lessonPath": "phases/18-ethics-safety-alignment/14-ascii-art-visual-jailbreaks",
    "file": "phases/18-ethics-safety-alignment/14-ascii-art-visual-jailbreaks/outputs/skill-encoding-audit.md"
  },
  {
    "kind": "skill",
    "name": "ipi-audit",
    "description": "审计 agentic deployment 的 indirect prompt injection 暴露面和 information-flow-control 覆盖情况。",
    "tags": [
      "ipi",
      "indirect-prompt-injection",
      "ifc",
      "agent-security",
      "owasp-llm01"
    ],
    "phase": 18,
    "lesson": 15,
    "lessonPath": "phases/18-ethics-safety-alignment/15-indirect-prompt-injection",
    "file": "phases/18-ethics-safety-alignment/15-indirect-prompt-injection/outputs/skill-ipi-audit.md"
  },
  {
    "kind": "skill",
    "name": "red-team-stack",
    "description": "为给定部署推荐 red-team tool stack 和配置。",
    "tags": [
      "llama-guard",
      "garak",
      "pyrit",
      "red-team-tooling",
      "mlcommons-hazards"
    ],
    "phase": 18,
    "lesson": 16,
    "lessonPath": "phases/18-ethics-safety-alignment/16-red-team-tooling-garak-llamaguard-pyrit",
    "file": "phases/18-ethics-safety-alignment/16-red-team-tooling-garak-llamaguard-pyrit/outputs/skill-red-team-stack.md"
  },
  {
    "kind": "skill",
    "name": "wmdp-eval",
    "description": "审计一个双用途能力声明，依据 WMDP、unlearning 评估和引出研究进行核查。",
    "tags": [
      "wmdp",
      "rmu",
      "dual-use",
      "biosecurity",
      "cybersecurity",
      "chemistry"
    ],
    "phase": 18,
    "lesson": 17,
    "lessonPath": "phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation",
    "file": "phases/18-ethics-safety-alignment/17-wmdp-dual-use-evaluation/outputs/skill-wmdp-eval.md"
  },
  {
    "kind": "skill",
    "name": "framework-diff",
    "description": "将新的安全框架或 release note 与 RSP v3.0、PF v2、FSF v3.0 进行比较。",
    "tags": [
      "rsp",
      "pf",
      "fsf",
      "frontier-safety",
      "safety-case"
    ],
    "phase": 18,
    "lesson": 18,
    "lessonPath": "phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf",
    "file": "phases/18-ethics-safety-alignment/18-frontier-safety-frameworks-rsp-pf-fsf/outputs/skill-framework-diff.md"
  },
  {
    "kind": "skill",
    "name": "welfare-assessment",
    "description": "将 Anthropic 的四步 welfare 预防性评估应用于部署决策。",
    "tags": [
      "model-welfare",
      "moral-uncertainty",
      "low-regret",
      "anthropic"
    ],
    "phase": 18,
    "lesson": 19,
    "lessonPath": "phases/18-ethics-safety-alignment/19-model-welfare-research",
    "file": "phases/18-ethics-safety-alignment/19-model-welfare-research/outputs/skill-welfare-assessment.md"
  },
  {
    "kind": "skill",
    "name": "bias-eval",
    "description": "审计一份偏见评估报告，覆盖指标类别、交叉性和去偏机制。",
    "tags": [
      "bias",
      "fairness",
      "weat",
      "intersectionality",
      "mechanistic-interpretability"
    ],
    "phase": 18,
    "lesson": 20,
    "lessonPath": "phases/18-ethics-safety-alignment/20-bias-representational-harm",
    "file": "phases/18-ethics-safety-alignment/20-bias-representational-harm/outputs/skill-bias-eval.md"
  },
  {
    "kind": "skill",
    "name": "fairness-criterion",
    "description": "识别某个 fairness criterion 调用了哪个 fairness criterion，并审计相关 assumptions。",
    "tags": [
      "fairness",
      "demographic-parity",
      "equalized-odds",
      "counterfactual-fairness",
      "impossibility"
    ],
    "phase": 18,
    "lesson": 21,
    "lessonPath": "phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual",
    "file": "phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/outputs/skill-fairness-criterion.md"
  },
  {
    "kind": "skill",
    "name": "dp-audit",
    "description": "Audit 语言模型部署中的 differential-privacy claim。",
    "tags": [
      "differential-privacy",
      "dp-sgd",
      "lora",
      "mia",
      "pmixed"
    ],
    "phase": 18,
    "lesson": 22,
    "lessonPath": "phases/18-ethics-safety-alignment/22-differential-privacy-for-llms",
    "file": "phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/outputs/skill-dp-audit.md"
  },
  {
    "kind": "skill",
    "name": "provenance-audit",
    "description": "审计一个内容部署在 watermarking 与 C2PA metadata 方面的 provenance chain。",
    "tags": [
      "watermarking",
      "synthid",
      "stable-signature",
      "c2pa",
      "provenance"
    ],
    "phase": 18,
    "lesson": 23,
    "lessonPath": "phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa",
    "file": "phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa/outputs/skill-provenance-audit.md"
  },
  {
    "kind": "skill",
    "name": "regulatory-map",
    "description": "映射某个部署在 EU、US、UK、Korea 的 AI 监管义务。",
    "tags": [
      "eu-ai-act",
      "gpai-code",
      "caisi",
      "uk-aisi",
      "korean-framework-act"
    ],
    "phase": 18,
    "lesson": 24,
    "lessonPath": "phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea",
    "file": "phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/outputs/skill-regulatory-map.md"
  },
  {
    "kind": "skill",
    "name": "cve-review",
    "description": "审查一个 production AI deployment 是否暴露于 LLM Scope Violation 风险。",
    "tags": [
      "echoleak",
      "cve",
      "llm-scope-violation",
      "prompt-injection",
      "aim-labs"
    ],
    "phase": 18,
    "lesson": 25,
    "lessonPath": "phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai",
    "file": "phases/18-ethics-safety-alignment/25-echoleak-cves-for-ai/outputs/skill-cve-review.md"
  },
  {
    "kind": "skill",
    "name": "card-audit",
    "description": "审计 model card、datasheet 或 system card 的完整性和可验证性。",
    "tags": [
      "model-card",
      "datasheet",
      "system-card",
      "transparency",
      "mitchell-2019"
    ],
    "phase": 18,
    "lesson": 26,
    "lessonPath": "phases/18-ethics-safety-alignment/26-model-system-dataset-cards",
    "file": "phases/18-ethics-safety-alignment/26-model-system-dataset-cards/outputs/skill-card-audit.md"
  },
  {
    "kind": "skill",
    "name": "provenance-check",
    "description": "根据 California AB 2013 和 EU TDM opt-out 义务检查训练数据集。",
    "tags": [
      "data-provenance",
      "ab-2013",
      "tdm-opt-out",
      "legitimate-interest",
      "dpa"
    ],
    "phase": 18,
    "lesson": 27,
    "lessonPath": "phases/18-ethics-safety-alignment/27-data-provenance-training-governance",
    "file": "phases/18-ethics-safety-alignment/27-data-provenance-training-governance/outputs/skill-provenance-check.md"
  },
  {
    "kind": "skill",
    "name": "ecosystem-map",
    "description": "将 alignment 主张或 evaluation 映射到组织、方法论和交叉检查。",
    "tags": [
      "mats",
      "redwood",
      "apollo",
      "metr",
      "eleos",
      "ecosystem"
    ],
    "phase": 18,
    "lesson": 28,
    "lessonPath": "phases/18-ethics-safety-alignment/28-alignment-research-ecosystem",
    "file": "phases/18-ethics-safety-alignment/28-alignment-research-ecosystem/outputs/skill-ecosystem-map.md"
  },
  {
    "kind": "skill",
    "name": "moderation-stack",
    "description": "为生产部署推荐 moderation stack 配置。",
    "tags": [
      "openai-moderation",
      "perspective",
      "llama-guard",
      "layered-moderation",
      "azure-content-safety"
    ],
    "phase": 18,
    "lesson": 29,
    "lessonPath": "phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard",
    "file": "phases/18-ethics-safety-alignment/29-moderation-systems-openai-perspective-llamaguard/outputs/skill-moderation-stack.md"
  },
  {
    "kind": "skill",
    "name": "dual-use-triage",
    "description": "对四个 CBRN 领域中的能力声明或事件报告进行 triage。",
    "tags": [
      "dual-use",
      "cbrn",
      "bio",
      "chem",
      "cyber",
      "nuclear",
      "uplift"
    ],
    "phase": 18,
    "lesson": 30,
    "lessonPath": "phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear",
    "file": "phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear/outputs/skill-dual-use-triage.md"
  },
  {
    "kind": "skill",
    "name": "terminal-coding-agent",
    "description": "构建并评估一个 terminal-native coding agent，在有界成本、沙箱化 tools 和完整 2026 hook surface 下对标 SWE-bench Pro。",
    "tags": [
      "capstone",
      "coding-agent",
      "claude-code",
      "swe-bench",
      "mcp",
      "hooks",
      "sandbox"
    ],
    "phase": 19,
    "lesson": 1,
    "lessonPath": "phases/19-capstone-projects/01-terminal-native-coding-agent",
    "file": "phases/19-capstone-projects/01-terminal-native-coding-agent/outputs/skill-terminal-coding-agent.md"
  },
  {
    "kind": "skill",
    "name": "codebase-rag",
    "description": "构建一个跨 repo 语义搜索系统，具备 AST-aware chunking、hybrid retrieval、增量 re-index，以及带 citation 的答案。",
    "tags": [
      "capstone",
      "rag",
      "code-search",
      "tree-sitter",
      "qdrant",
      "bm25",
      "hybrid-retrieval"
    ],
    "phase": 19,
    "lesson": 2,
    "lessonPath": "phases/19-capstone-projects/02-rag-over-codebase",
    "file": "phases/19-capstone-projects/02-rag-over-codebase/outputs/skill-codebase-rag.md"
  },
  {
    "kind": "skill",
    "name": "voice-agent",
    "description": "构建一个具备低于 800ms first-audio-out、barge-in 处理和对话中途 tool use 的实时语音 agent。",
    "tags": [
      "capstone",
      "voice",
      "webrtc",
      "livekit",
      "pipecat",
      "asr",
      "tts",
      "streaming"
    ],
    "phase": 19,
    "lesson": 3,
    "lessonPath": "phases/19-capstone-projects/03-realtime-voice-assistant",
    "file": "phases/19-capstone-projects/03-realtime-voice-assistant/outputs/skill-voice-agent.md"
  },
  {
    "kind": "skill",
    "name": "doc-qa",
    "description": "在 10k 页规模上构建一个 vision-first Multimodal 文档 QA 系统，使用 late-interaction retrieval 和证据区域引用。",
    "tags": [
      "capstone",
      "multimodal",
      "rag",
      "colpali",
      "colqwen",
      "late-interaction",
      "pdf"
    ],
    "phase": 19,
    "lesson": 4,
    "lessonPath": "phases/19-capstone-projects/04-multimodal-document-qa",
    "file": "phases/19-capstone-projects/04-multimodal-document-qa/outputs/skill-doc-qa.md"
  },
  {
    "kind": "skill",
    "name": "ai-scientist",
    "description": "构建一个自主研究 agent，运行 experiment tree search，用 vision critique 编写 LaTeX paper，并通过 sandbox-escape red team。",
    "tags": [
      "capstone",
      "autonomous-agent",
      "ai-scientist",
      "sakana",
      "langgraph",
      "sandbox",
      "research"
    ],
    "phase": 19,
    "lesson": 5,
    "lessonPath": "phases/19-capstone-projects/05-autonomous-research-agent",
    "file": "phases/19-capstone-projects/05-autonomous-research-agent/outputs/skill-ai-scientist.md"
  },
  {
    "kind": "skill",
    "name": "devops-agent",
    "description": "构建一个 Kubernetes 故障排查 Agent，它会遍历集群知识图谱、对根因进行排序，并通过 Slack 对每一次修复操作进行审批闸控。",
    "tags": [
      "capstone",
      "devops",
      "sre",
      "kubernetes",
      "langgraph",
      "fastmcp",
      "aiops"
    ],
    "phase": 19,
    "lesson": 6,
    "lessonPath": "phases/19-capstone-projects/06-devops-troubleshooting-agent",
    "file": "phases/19-capstone-projects/06-devops-troubleshooting-agent/outputs/skill-devops-agent.md"
  },
  {
    "kind": "skill",
    "name": "finetuning-pipeline",
    "description": "运行一条可复现的 data-to-SFT-to-DPO-to-serve fine-tuning pipeline，包含 ablations、quantization，以及一份 2026 Model Openness Framework model card。",
    "tags": [
      "capstone",
      "fine-tuning",
      "axolotl",
      "trl",
      "dpo",
      "grpo",
      "vllm",
      "eagle-3",
      "mof"
    ],
    "phase": 19,
    "lesson": 7,
    "lessonPath": "phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline",
    "file": "phases/19-capstone-projects/07-end-to-end-fine-tuning-pipeline/outputs/skill-finetuning-pipeline.md"
  },
  {
    "kind": "skill",
    "name": "production-rag",
    "description": "部署一个受监管领域的 RAG chatbot，具备角色 + 司法辖区过滤、prompt caching、guardrails 和实时 drift monitoring。",
    "tags": [
      "capstone",
      "rag",
      "chatbot",
      "regulated",
      "llama-guard",
      "nemo-guardrails",
      "ragas",
      "langfuse"
    ],
    "phase": 19,
    "lesson": 8,
    "lessonPath": "phases/19-capstone-projects/08-production-rag-chatbot",
    "file": "phases/19-capstone-projects/08-production-rag-chatbot/outputs/skill-production-rag.md"
  },
  {
    "kind": "skill",
    "name": "migration-agent",
    "description": "构建一个 repo 级 code migration agent，将 deterministic recipes 与 agent fallback loop 结合起来，通过 MigrationBench，并发布失败分类体系。",
    "tags": [
      "capstone",
      "code-migration",
      "openrewrite",
      "libcst",
      "migrationbench",
      "agent",
      "sandbox"
    ],
    "phase": 19,
    "lesson": 9,
    "lessonPath": "phases/19-capstone-projects/09-code-migration-agent",
    "file": "phases/19-capstone-projects/09-code-migration-agent/outputs/skill-migration-agent.md"
  },
  {
    "kind": "skill",
    "name": "multi-agent-team",
    "description": "构建一个 multi-agent 软件团队，包含 architect、并行 coders、reviewer 和 tester；使用 SWE-bench Pro 衡量，并产出 handoff post-mortem。",
    "tags": [
      "capstone",
      "multi-agent",
      "swe-bench",
      "langgraph",
      "a2a",
      "worktree",
      "roles"
    ],
    "phase": 19,
    "lesson": 10,
    "lessonPath": "phases/19-capstone-projects/10-multi-agent-software-team",
    "file": "phases/19-capstone-projects/10-multi-agent-software-team/outputs/skill-multi-agent-team.md"
  },
  {
    "kind": "skill",
    "name": "llm-observability",
    "description": "构建一个 self-hosted LLM observability dashboard，用于 ingest OpenTelemetry GenAI spans、运行 evals，并在五分钟内捕获注入的 regressions。",
    "tags": [
      "capstone",
      "observability",
      "otel",
      "langfuse",
      "phoenix",
      "evals",
      "drift",
      "clickhouse"
    ],
    "phase": 19,
    "lesson": 11,
    "lessonPath": "phases/19-capstone-projects/11-llm-observability-dashboard",
    "file": "phases/19-capstone-projects/11-llm-observability-dashboard/outputs/skill-llm-observability.md"
  },
  {
    "kind": "skill",
    "name": "video-qa",
    "description": "构建一个视频理解 pipeline，包含 scene segmentation、multi-vector indexing、temporal grounding 和 timestamped citations。",
    "tags": [
      "capstone",
      "video",
      "multimodal",
      "gemini",
      "qwen-vl",
      "molmo",
      "transnet",
      "qdrant"
    ],
    "phase": 19,
    "lesson": 12,
    "lessonPath": "phases/19-capstone-projects/12-video-understanding-pipeline",
    "file": "phases/19-capstone-projects/12-video-understanding-pipeline/outputs/skill-video-qa.md"
  },
  {
    "kind": "skill",
    "name": "mcp-server-platform",
    "description": "部署一个生产 MCP server，包含 StreamableHTTP、OAuth 2.1 scopes、OPA policy、针对破坏性工具的 human-approval gate，以及用于发现的 registry。",
    "tags": [
      "capstone",
      "mcp",
      "fastmcp",
      "streamablehttp",
      "oauth",
      "opa",
      "registry",
      "governance"
    ],
    "phase": 19,
    "lesson": 13,
    "lessonPath": "phases/19-capstone-projects/13-mcp-server-with-registry",
    "file": "phases/19-capstone-projects/13-mcp-server-with-registry/outputs/skill-mcp-server.md"
  },
  {
    "kind": "skill",
    "name": "inference-server",
    "description": "交付一个采用 EAGLE-3 或 P-EAGLE draft、K8s autoscaling，并包含完整 throughput/latency/cost report 的 speculative-decoding inference server。",
    "tags": [
      "capstone",
      "inference",
      "vllm",
      "sglang",
      "eagle-3",
      "p-eagle",
      "speculative-decoding",
      "quantization",
      "hpa"
    ],
    "phase": 19,
    "lesson": 14,
    "lessonPath": "phases/19-capstone-projects/14-speculative-decoding-server",
    "file": "phases/19-capstone-projects/14-speculative-decoding-server/outputs/skill-inference-server.md"
  },
  {
    "kind": "skill",
    "name": "safety-harness",
    "description": "围绕目标 LLM app 接入 layered safety pipeline，运行一个六家族 red-team range，并执行 constitutional self-critique，以获得可衡量的 harmlessness delta。",
    "tags": [
      "capstone",
      "safety",
      "red-team",
      "llama-guard",
      "x-guard",
      "garak",
      "pyrit",
      "constitutional-ai"
    ],
    "phase": 19,
    "lesson": 15,
    "lessonPath": "phases/19-capstone-projects/15-constitutional-safety-harness",
    "file": "phases/19-capstone-projects/15-constitutional-safety-harness/outputs/skill-safety-harness.md"
  },
  {
    "kind": "skill",
    "name": "issue-to-pr",
    "description": "构建一个 async GitHub issue-to-PR agent，它在 cloud sandbox 中运行，复现构建，验证测试，并在严格的按 repo 预算内打开可供 review 的 PR。",
    "tags": [
      "capstone",
      "async-agent",
      "github",
      "fargate",
      "daytona",
      "swe-bench",
      "budget",
      "safety"
    ],
    "phase": 19,
    "lesson": 16,
    "lessonPath": "phases/19-capstone-projects/16-github-issue-to-pr-agent",
    "file": "phases/19-capstone-projects/16-github-issue-to-pr-agent/outputs/skill-issue-to-pr.md"
  },
  {
    "kind": "skill",
    "name": "ai-tutor",
    "description": "为特定学科交付一个自适应 Multimodal personal tutor，具备 Bayesian knowledge tracing、curriculum graph、safety filters，以及一次经过衡量的两周效果研究。",
    "tags": [
      "capstone",
      "tutor",
      "adaptive",
      "bkt",
      "fsrs",
      "livekit",
      "multimodal",
      "coppa"
    ],
    "phase": 19,
    "lesson": 17,
    "lessonPath": "phases/19-capstone-projects/17-personal-ai-tutor",
    "file": "phases/19-capstone-projects/17-personal-ai-tutor/outputs/skill-ai-tutor.md"
  },
  {
    "kind": "skill",
    "name": "gradient-accumulation",
    "description": "通过缩放 micro-batch Loss，并在每个窗口只执行一次 Optimizer step，以大于设备内存可容纳的 effective batch 进行训练。",
    "tags": [
      "training",
      "batch-size",
      "distributed",
      "scaling"
    ],
    "phase": 19,
    "lesson": 46,
    "lessonPath": "phases/19-capstone-projects/46-gradient-accumulation",
    "file": "phases/19-capstone-projects/46-gradient-accumulation/outputs/skill-gradient-accumulation.md"
  },
  {
    "kind": "skill",
    "name": "checkpoint-save-resume",
    "description": "原子式、分片 checkpoint，完整捕获 RNG，使被杀死的 run 可以在 epoch 中途 resume，并保持相同的 loss trajectory。",
    "tags": [
      "training",
      "durability",
      "resume",
      "sharded-state"
    ],
    "phase": 19,
    "lesson": 47,
    "lessonPath": "phases/19-capstone-projects/47-checkpoint-save-resume",
    "file": "phases/19-capstone-projects/47-checkpoint-save-resume/outputs/skill-checkpoint-save-resume.md"
  },
  {
    "kind": "skill",
    "name": "distributed-fsdp-ddp",
    "description": "使用从零实现的 DDP wrapper 和 FSDP 参数分片草图，在 gloo 或 nccl backend 上启动多 rank 训练。",
    "tags": [
      "distributed",
      "ddp",
      "fsdp",
      "collectives"
    ],
    "phase": 19,
    "lesson": 48,
    "lessonPath": "phases/19-capstone-projects/48-distributed-fsdp-ddp",
    "file": "phases/19-capstone-projects/48-distributed-fsdp-ddp/outputs/skill-distributed-fsdp-ddp.md"
  },
  {
    "kind": "skill",
    "name": "lm-eval-harness",
    "description": "最小化 language model evaluation harness，包含 JSONL task spec、五种 metric、可替换 adapter，以及 leaderboard JSON 输出。",
    "tags": [
      "evaluation",
      "metrics",
      "leaderboard",
      "harness"
    ],
    "phase": 19,
    "lesson": 49,
    "lessonPath": "phases/19-capstone-projects/49-lm-eval-harness",
    "file": "phases/19-capstone-projects/49-lm-eval-harness/outputs/skill-lm-eval-harness.md"
  },
  {
    "kind": "skill",
    "name": "skill-jailbreak-taxonomy",
    "description": "针对 LLM 助理的攻击的共享词汇，六个类别以及手工构建的 fixture",
    "tags": [
      "safety",
      "red-team",
      "taxonomy"
    ],
    "phase": 19,
    "lesson": 82,
    "lessonPath": "phases/19-capstone-projects/82-jailbreak-taxonomy",
    "file": "phases/19-capstone-projects/82-jailbreak-taxonomy/outputs/skill-jailbreak-taxonomy.md"
  },
  {
    "kind": "skill",
    "name": "skill-prompt-injection-detector",
    "description": "分层检测器管道，可返回任何提示的类别和置信度，具有可测量的精度和召回率",
    "tags": [
      "safety",
      "detector",
      "prompt-injection"
    ],
    "phase": 19,
    "lesson": 83,
    "lessonPath": "phases/19-capstone-projects/83-prompt-injection-detector",
    "file": "phases/19-capstone-projects/83-prompt-injection-detector/outputs/skill-prompt-injection-detector.md"
  },
  {
    "kind": "skill",
    "name": "skill-refusal-evaluation",
    "description": "在带标签的提示语料库上进行校准和按类别细分的双边拒绝指标",
    "tags": [
      "safety",
      "evaluation",
      "calibration"
    ],
    "phase": 19,
    "lesson": 84,
    "lessonPath": "phases/19-capstone-projects/84-refusal-evaluation",
    "file": "phases/19-capstone-projects/84-refusal-evaluation/outputs/skill-refusal-evaluation.md"
  },
  {
    "kind": "skill",
    "name": "skill-content-classifier-integration",
    "description": "单个严重性路由器后面的三个输出侧分类器（毒性、PII、指令泄漏），具有阻止、编辑、警告、日志操作",
    "tags": [
      "safety",
      "classifier",
      "output-filter"
    ],
    "phase": 19,
    "lesson": 85,
    "lessonPath": "phases/19-capstone-projects/85-content-classifier-integration",
    "file": "phases/19-capstone-projects/85-content-classifier-integration/outputs/skill-content-classifier-integration.md"
  },
  {
    "kind": "skill",
    "name": "skill-constitutional-rules-engine",
    "description": "用于输出约束的声明性 YAML 规则引擎，具有严重性、解释、修复程序操作和结构化差异",
    "tags": [
      "safety",
      "rules",
      "constitutional"
    ],
    "phase": 19,
    "lesson": 86,
    "lessonPath": "phases/19-capstone-projects/86-constitutional-rules-engine",
    "file": "phases/19-capstone-projects/86-constitutional-rules-engine/outputs/skill-constitutional-rules-engine.md"
  },
  {
    "kind": "skill",
    "name": "skill-end-to-end-safety-gate",
    "description": "三检查点Safety Gate由输入检测器、流token过滤器、输出分类器和具有确定性聚合表和每个请求跟踪的规则引擎组成",
    "tags": [
      "safety",
      "harness",
      "composition"
    ],
    "phase": 19,
    "lesson": 87,
    "lessonPath": "phases/19-capstone-projects/87-end-to-end-safety-gate",
    "file": "phases/19-capstone-projects/87-end-to-end-safety-gate/outputs/skill-end-to-end-safety-gate.md"
  }
];
