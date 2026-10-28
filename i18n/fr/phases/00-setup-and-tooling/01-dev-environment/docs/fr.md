# Environnement de développement

> Vos outils vont façonner votre façon de penser.

**Type:** Build
**Languages:** Python, Node.js, Rust
**Prerequisites:** None
**Time:** ~45 分钟

## Objectif de l'apprentissage

- Depuis le zéro de Python 3.11+、Node.js 20+ 和 Rust 工具链
- Configuration de l'environnement virtuel et du gestionnaire de paquets, assurance de la construction réalisable
- Utilisez CUDA/MPS 验证 GPU 访问,并跑一次测试张量运算
- Comprendre les quatre niveaux de la technologie: système, gestion de paquets, fonctionnement, IA

##  problématique

Vous allez utiliser Python, TypeScript, Rust et Julia pour terminer 500+ sections de cours d'ingénierie AI. Si l'environnement est mauvais, chaque section de cours deviendra un outil en chaîne de constructions, plutôt que d'apprendre.

La plupart des gens sautent sur l'environnement construit. Ensuite, il faut quelques heures pour déboguer l'importation de l'erreur.

## 概念

Un ingénierie de l'IA environnement a quatre niveaux:

```mermaid
graph TD
    A["4. AI/ML Libraries\nPyTorch, JAX, transformers, etc."] --> B["3. Language Runtimes\nPython 3.11+, Node 20+, Rust, Julia"]
    B --> C["2. Package Managers\nuv, pnpm, cargo, juliaup"]
    C --> D["1. System Foundation\nOS, shell, git, editor, GPU drivers"]
```

Nous sommes installés en bas. Chaque étage dépend de celui qui est en bas.

```figure
s0-env-stack
```

## - Je le construis.

### 步骤 1: système de base

检查你的系统并安装基础组件──

```bash
# macOS
xcode-select --install
brew install git curl wget

# Ubuntu/Debian
sudo apt update && sudo apt install -y build-essential git curl wget unzip

# Windows (use WSL2)
wsl --install -d Ubuntu-24.04
```

### 步骤 2: Utilisez l'installation de Python

Nous utilisons`uv`Il est 10 à 100 fois plus rapide que le pip et traite automatiquement l'environnement virtuel.

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

### 步骤 3: avec pnpm installer Node.js

Utilisé par TypeScript  cours ]]> agents, serveurs MCP, applications web)

```bash
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 22
fnm use 22

npm install -g pnpm

node -e "console.log('Node', process.version)"
```

Fnm Installation du processus`unzip`, la défaillance des temps`Not installing fnm due to missing dependencies.`退出: dans Linux, il doit débrancher un zip 归档, dans macOS 通过 Homebrew安装──macOS自带 `unzip`Ubuntu、Debian 和 WSL2 会通过步骤 1 的 apt 命令安装它(si vous avez sauté cette étape, fonctionne `sudo apt install -y unzip`)。

**macOS / Apple Silicon（M1/M2/M3/M4）：**Si l' installation est nécessaire`Error: Cannot install under Rosetta 2 in ARM default prefix (/opt/homebrew)`Arrêtez, expliquez votre terminal fonctionne à Rosetta 2`arch`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `i386`), alors que Homebrew est un constructeur de l'arm64 original.`fnm install 22`开始重新运行:

```bash
arch -arm64 brew install fnm
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc
```

### 步骤 4:Rust

Il est utilisé pour des cours sensibles aux performances (inference, systèmes).

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

rustc --version
cargo --version
```

### 步骤 5: Julia(可选)

Avec Julia à la tête de la classe de mathématiques.

```bash
curl -fsSL https://install.julialang.org | sh

julia -e 'println("Julia ", VERSION)'
```

### 步骤 6:GPU 设置( si vous avez)

**NVIDIA（Linux / Windows）：**

```bash
nvidia-smi

# Install PyTorch with CUDA
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

**macOS / Apple Silicon（M1/M2/M3/M4）：**C'est une situation prévue, pas un problème.**不要**- Je suis là .`--index-url .../cuXXX`(ces roues ne sont applicables qu'à Linux/Windows, installerie failuse)

```bash
uv pip install torch torchvision torchaudio
```

验证( s'applique à toute plateforme):

```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")           # False on macOS — expected
print(f"MPS available:  {torch.backends.mps.is_available()}")   # True on Apple Silicon
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
```

没有GPU?没有问题──大多数课程可在CPU上运行──对训练很重课程,使用Google Colab或云GPU──

### Étape 7: Vérifiez la route que vous voulez commencer

Chaque commande de cette classe est tirée du répertoire de stockage, c'est-à-dire contenue.`README.md`et `phases/`Il est donc possible de voir une conclusion claire, et non une mise en garde.

开始完整的入门序列:

```bash
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route beginner
```

Ou bien, regardez le chemin que vous voulez parcourir.

```bash
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route ml-foundations
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route llm-engineering
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route agents
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route mcp
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route agent-skills
python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route certification
```

Si vous voulez faire en sorte que le même pré-examen et le suivi des cours utilisés pour les outils et dépendances, en plus `--show-later` la carence de l'outil de suivi ne peut jamais empêcher la route choisie

Chaque inspection indispensable échouée fournit un chemin ou une erreur d'importation vérifiée, ainsi qu'une ordonnance de réparation définitive. Les compétences et la certification des agents 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路线 路 路线 路线 路 路线 路 路线 路 路线 路 路线 路 路线 路 路线 路 路线 路 路线 路 路线 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 路 

Lors de l'entrée, l'inspection effectuée imprime les premiers ordres de cours:

```text
Ready to start Beginner course.
Next: python3 phases/01-math-foundations/01-linear-algebra-intuition/code/vectors.py
```

## Utilisez-le

Votre environnement peut déjà commencer à vérifier les routes que vous avez parcourues. Les cours suivants, tels que les outils, doivent être réinstallés, ne laissez pas toute une série de techniques vous bloquer.

| Language | Used In | Package Manager |
|----------|---------|-----------------|
| Python | Phases 1-12 (ML, DL, NLP, Vision, Audio, LLMs) | uv |
| TypeScript | Phases 13-17 (Tools, Agents, Swarms, Infra) | pnpm |
| Rust | Phases 12, 15-17 (Performance-critical systems) | cargo |
| Julia | Phase 1 (Math foundations) | Pkg |

## Je le livre.

Ce cours a été créé pour un test script que tout le monde peut utiliser, pour vérifier son environnement.

Regardez !`outputs/prompt-env-check.md`, dont une est rapide, peut aider l'IA assistant diagnostic environnement problème.

## 练习

1. 运行验证脚本并修复 tout échec
2. Pour ce cours Créer un Python environnement virtuel, et installer PyTorch
3. En quatre langues, il écrit un "bonjour au monde", et il fonctionne individuellement.

### 提示

**练习 1。**Dans le catalogue des magasins`python3 phases/00-setup-and-tooling/01-dev-environment/code/verify.py --route beginner`, d'abord réparer le premier échec, revoir le suivant, refaire le script, passer tous les contrôles nécessaires, et terminer le processus.

**练习 2。**Dans le répertoire de stockage`uv venv` Créer un environnement et activer, réutiliser étape 6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `python -c "import torch; print(torch.__version__)"`;输出版本号就表示安装成功。

**练习 3。**Utilisation  concept partie de la technique dans les quatre modes de fonctionnement: Python  fonctionne sur le typeScript de Node.js  Rust 和 Julia 分别编写一个小文件,用 `python3`- Je suis là.`npx tsx`(Node.js 不能直接运行 `.ts`文件) 、`cargo run`Ou `rustc`- Je suis là.`julia`Chaque fois que tu fais ça, tu dois imprimer ton message et le faire sortir.
