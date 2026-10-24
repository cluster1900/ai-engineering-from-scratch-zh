# بيئة التنمية

> أدواتك ستشكّل طريقة تفكيرك...

**Type:** Build
**Languages:** Python, Node.js, Rust
**Prerequisites:** None
**Time:** ~45 分钟

## 學习目标
- از零开始设置 Python 3.11+、Node.js 20+ 和 Rust toolchains
- تكوين بيئات افتراضية ومديري الحزم ، لتحقيق البناءات القابلة للتعديل
- استخدام CUDA / MPS 验证 GPU الوصول،并运行一个测试 Tensor العملية
- فهم أربع مستويات: النظام ، الحزم ، أوقات التشغيل ، مكتبات الذكاء الاصطناعي

## 问题
ستستخدم Python TypeScript Rust 和 Julia لتعلم 500+ درجة هندسة الذكاء الاصطناعي  درجة 

الكثير من الناس يخطون إعداد البيئة.. ثم يضعون ساعات قليلة في إصلاح أخطاء الاستيراد.. تضارب الإصدارات وغياب برامج تشغيل الكود..

## 概念
بيئة هندسية الذكاء الاصطناعي لديها أربع طبقات:

```mermaid
graph TD
    A["4. AI/ML Libraries\nPyTorch, JAX, transformers, etc."] --> B["3. Language Runtimes\nPython 3.11+, Node 20+, Rust, Julia"]
    B --> C["2. Package Managers\nuv, pnpm, cargo, juliaup"]
    C --> D["1. System Foundation\nOS, shell, git, editor, GPU drivers"]
```

نحن نضع كل طبقة تحتها


```figure
s0-env-stack
```

## بناءها
### الخطوة 1: أساس النظام

تحقق من نظامك ووضع المكونات الأساسية

```bash
# macOS
xcode-select --install
brew install git curl wget

# Ubuntu/Debian
sudo apt update && sudo apt install -y build-essential git curl wget unzip

# Windows (use WSL2)
wsl --install -d Ubuntu-24.04
```

### 步骤 2: بيثون مع uv

نحن نستخدم`uv`إنه أسرع من 10-100x، ويعالج بشكل تلقائي بيئات افتراضية‬

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh

uv python install 3.12

uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

uv pip install numpy matplotlib jupyter
```

验证:

```python
import sys
print(f"Python {sys.version}")

import numpy as np
print(f"NumPy {np.__version__}")
a = np.array([1, 2, 3])
print(f"Vector: {a}, dot product with itself: {np.dot(a, a)}")
```

### 步骤 3: Node.js مع pnpm

تستخدم على نوع النص 课程(وكلاء  MCP خادم 应用)

```bash
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 22
fnm use 22

npm install -g pnpm

node -e "console.log('Node', process.version)"
```

فأن تنصيب الإجراءات`unzip`, غياب الوقت`Not installing fnm due to missing dependencies.`退出: في لينكس فوقها يجب أن يفتح زيب 归档, في macOS فوقها من خلال Homebrew تنصيبها.`unzip`أوبنتو، ديبيان و WSL2 سوف تمر بالخطوة الأولى من التنفيذ`sudo apt install -y unzip`(‬)

**macOS / Apple Silicon（M1/M2/M3/M4）：**إذا كان الإجراءات`Error: Cannot install under Rosetta 2 in ARM default prefix (/opt/homebrew)`توقف، أوضح أن محطتك تعمل في روزيتا 2`arch`输出 `i386`و (هومبريو) هو أصل أسلحة 64 تكوينها.`fnm install 22`开始重新运行 上述命令:

```bash
arch -arm64 brew install fnm
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc
```

### الخطوة 4: الخرسانة

تستخدم في أداء النقدي 课程(الاضافة 系统)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

rustc --version
cargo --version
```

### 步骤 5: جوليا (اختياري)

يستخدمها (جوليا) في دروس رياضية ممتازة

```bash
curl -fsSL https://install.julialang.org | sh

julia -e 'println("Julia ", VERSION)'
```

### 步骤 6:GPU 设置( إذا كان لديك)

**NVIDIA（Linux / Windows）：**

```bash
nvidia-smi

# Install PyTorch with CUDA
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

**macOS / Apple Silicon（M1/M2/M3/M4）：**ماك 上 بدون كودا هذا هو الوضع المحدد، ليس فاعل**不要**传入 `--index-url .../cuXXX`(هذه العجلات تطبق فقط على لينكس ويندوز، تنصيبها يفشل)

```bash
uv pip install torch torchvision torchaudio
```

验证( ينطبق على أي منصة):

```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")           # False on macOS — expected
print(f"MPS available:  {torch.backends.mps.is_available()}")   # True on Apple Silicon
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
```

没有GPU?没有问题──大多数课程可在CPU上运行──对于训练重的课程,使用Google Colab或云 GPUs──

### الخطوة 7: تحقق طريقك

كل أمر في هذه الدورة يعمل من المكتب المحلي، ويعني يحتوي على`README.md`和 `phases/`يبدأ الفحص المُحدد فقط بالتحقق من المحتويات التي يتطلبها الطريق المُختار. يُعتبر أداة تستخدم بعد فترة طويلة، بحيث يرى المتعلمون الجدد نتيجة واضحة، وليس تحذيرًا كبيرًا.

开始完整的入门序列:

```bash
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route beginner
```

أو فقط تحقق من طريق كنت تريد أن تذهب:

```bash
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route ml-foundations
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route llm-engineering
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route agents
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route mcp
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route agent-skills
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route certification
```

إذا أردت أن تستخدم نفس الاختبار الاولى و الاختبار اللاحق`--show-later` عدم وجود أدوات متابعة لا يمكن أن تعيق الطريق المختار‬

كل فاشل من المراجعات الضرورية سوف تعطى المسار الذي تمت فحصه أو خطأ الإدخال، فضلا عن أمر تحديث محدد.

عندما يُجري المُراجعة، سيتم طباعة أول أمر مؤكد للدورة:

```text
Ready to start Beginner course.
Next: python3 phases/01-math-foundations/01-linear-algebra-intuition/code/vectors.py
```

## استخدمها
البيئة التي تتواجد فيها يمكن أن تبدأ في فحص الطريق. تحتاج إلى إعادة تثبيت دروس أخرى، لا داعي للقيام بتعليق كل مجموعة من التقنيات.

| Language | Used In | Package Manager |
|----------|---------|-----------------|
| Python | Phases 1-12 (ML, DL, NLP, Vision, Audio, LLMs) | uv |
| TypeScript | Phases 13-17 (Tools, Agents, Swarms, Infra) | pnpm |
| Rust | Phases 12, 15-17 (Performance-critical systems) | cargo |
| Julia | Phase 1 (Math foundations) | Pkg |

## 交付 it
هذا المقال يُنتج كتابًا للتحقق من أنظمة العمل التي يمكن لأي شخص أن يستخدمها.

查看 `outputs/prompt-env-check.md`، واحدة منها سريعة، يمكن أن تساعد مساعدات الذكاء الاصطناعي  تشخيص مشاكل البيئة.

## التدريب
1. 运行验证脚本并修复任何失败项
2. في هذا البرنامج، قم بإنشاء بيئة افتراضية في Python، ووضع PyTorch
3. مع كلّ 4 لغات، أكتب "مرحباً للعالم" و أكتب "مرحباً للعالم"

### 提示

**练习 1。**في مخزن أساسية`python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route beginner`, أولاً تعديل الفشل الأول , إعادة النظر في التالي

**练习 2。**في مخزن`uv venv`خلق بيئة و تنشيطها، إعادة استخدام الخطوة 6 `python -c "import torch; print(torch.__version__)"`؛输出版本号就表示安装成功。

**练习 3。**استخدام مفهوم جزء من التقنية من أربعة أنواع التشغيل: Python‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬`python3`.`npx tsx`(Node.js 不能直接运行)`.ts`文件)`cargo run`أو`rustc`.`julia`كل مرة يتم فيها عمل يجب أن تطبق رسالتك وتنتهي
