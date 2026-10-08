# CLIP e treinamento de linguagem visual contraditório

> O CLIP do OpenAI(2021) provou uma idéia central suficiente para impulsionar a próxima década: apenas usar pares de imagens-capção da Web e uma perda contrastiva, colocar o codificador de imagens e o codificador de texto em um mesmo espaço vetorial.

**Type:** Build
**Languages:** Python（stdlib，InfoNCE + sigmoid loss 实现）
**Prerequisites:** Phase 12 · 01（ViT patches），Phase 7（Transformers）
**Time:** ~180 分钟

## Objectivo de aprendizagem
- A partir de informações mútuas 推导 InfoNCE perda,并实现 a um valor numérico estável Vectorizada 版本。
- 解释为什么sigmoid pairwise loss(SigLIP) pode se expandir para lote 32768+,且不需要软max 所要求的全集 开销──
- 通过构造 text templates(`a photo of a {class}`)并对 cosine similarity 取 argmax,运行 zero-shot ImageNet classificação。
- Dizer o CLIP / SigLIP pré-treino  dar-lhe quatro 杆: tamanho do lote, temperatura, modelo de entrada, qualidade de dados.

## 问题
A visão anterior do CLIP é supervisionada. Recolhe conjuntos de dados etiquetados (ImageNet:1.2M imagens, 1000 classes), treina a CNN, em seguida, publica.

A imagem-capção Web 免费提供十亿级宽松标签的双子──一张金车的照片,alt text is "meu cão Max no parque",it carrega um sinal de vigilância:文本描述图像──问题是:你能将它转换为有用的训练吗?

A resposta do CLIP:把图像标题对 当作匹配任务――给定一个包含N 张图像和N 条标题的批,学习将每个图像与它自己的标题匹配,并区分N-1 个分扰扰器――监督信号是 两件事都属于一起;这N-1 个不属于一起――没有类标签――没有人工标签――只有一个反驳损失――

得到的嵌入空间 能做不止 CLIP 被训练做的事情──ImageNet zero-shot 能工作, é porque "uma foto de um gato" de Embedding vai se aproximar daquelas imagens de gato nunca claramente marcadas para o gato── é isso que ocasionou cada 2026 VLM 注──

## 概念
### O duplo codificador

CLIP tem duas torres:

- Encoder de imagem `f`:ViT ou ResNet, cada imagem 输出一个D-dim Vector──
- Encoder de texto`g`Transformador pequeno, cada subtítulo 输出一个D-dim Vector──

As duas torres normalizam a saída para a extensão da unidade.`cos(f(x), g(y)) = f(x)^T g(y)`- Não.

对于一个包含 N 个(图片,标签) pares de lote, construir forma 为 `(N, N)`Matrix de semelhança`S`- Não .

```
S[i, j] = cos(f(x_i), g(y_j)) / tau
```

Entre eles `tau`É a temperatura de aprendizagem que obtemos.

### Perda de InfoNCE

CLIP em linhas 和 colunas 上 usando entropia cruzada simétrica:

```
loss_i2t = CE(S, labels=identity)     # each image's positive is its own caption
loss_t2i = CE(S^T, labels=identity)   # each caption's positive is its own image
loss = (loss_i2t + loss_t2i) / 2
```

É o que significa que a suavidade máxima de cada imagem é superior à de todas as outras imagens em lote.

### Temperatura

`tau`控制 softmax 的尖度──低 tau →尖分布,具有硬负矿业效果──高 tau →软,所有样品都会贡献──CLIP 学习 log(1/tau),并进行剪切以防崩──SigLIP 2 固定初始 tau,并改用学习偏见──

### Por que sigmoid 扩展性更好 (sigloid)

Softmax  necessita de toda a semelhança Matrix  manter o mesmo tempo  Em treinamento distribuído, você deve colocar cada incorporar tudo-juntado para cada réplica, e então fazer softmax

SigLIP Utilize elementar sigmoid  substituir softmax: para cada par `(i, j)`,perda é uma classificação binária, julgar é um par de correspondência?positivo classe rótulos é diagonal, tudo o resto são negativos。Perda é:

```
L = -1/N sum over (i, j) [ y_ij log sigmoid(S[i,j]) + (1-y_ij) log sigmoid(-S[i,j]) ]
```

Se `i == j`, , ,`y_ij = 1`, se não for 0── cada par de perda é independente── não precisa de todo-conjunto── cada GPU  calcula seu próprio bloco local 并求和──SigLIP 2 pode ser expandido a baixo custo para lote 32k-512k, enquanto CLIP 会需要比例增加通信──

### Classificação de tiros zero

给定 N 个 class names, para cada classe 构建一个文本模板:

```
"a photo of a {class}"
```

Use text encoder Embedding Cada modelo。use image encoder Embedding 你的图片。Argmax cosine similarity = predicted class──不需要在目标类上训──

Templates rápidos 很重要──CLIP 原论文为每个类使用了80个模板(plain、artistic、photo、painting等)并平均嵌入──ImageNet 提升 +3 points──现代用法通常选择一两个模板──

### Sondes lineares e ajustes finos

Zero-shot é a linha de base。Sonda linear(Em recursos congelados CLIP 之上为目标类 训练一个线性层) em tarefas no domínio 上胜过零-shot。Full fine tuning 在在域上胜过线性探测,但可能损害零-shot transfer──三种政制,三种交易――

### SigLIP 2: NaFlex 和 características densas

SigLIP 2(2025)
- NaFlex: modelo único  processar proporções de aspecto variáveis 和 resoluções。
- Mais características densas, utilizadas na segmentação e estimativa de profundidade, são utilizadas em VLMs como espinha dorsal congelada.
- Multilíngue: em mais de 100 idiomas 上訓練, enquanto CLIP 僅僅英語のみ──
- 1B, e o CLIP máximo de 400m.

Em 2026 anos de VLMs abertos, SigLIP 2 SO400m/14 é uma torre de visão padrão. Para a recuperação de imagens e texto, se a distribuição de treinamento LAION-2B específica se adequar ao seu padrão de consulta, CLIP  ainda é uma escolha padrão.

### A Comissão deve apresentar ao Parlamento Europeu e ao Conselho um relatório sobre a aplicação do artigo 108.o, n.o 1, do Regulamento (CE) n.o 1069/2009 do Parlamento Europeu e do Conselho.

ALIGN(Google,2021): é um ponto de verificação aberto de uso comum, em que a imagem é modelada mascaradamente; é a forte espinha dorsal dos VLMs;; BASE: Google's CLIP+ALIGN híbrido;; são todos da mesma família, apenas dados e sintonização diferentes.

### O teto de tiro zero

Os modelos de classe CLIP de imagem de rede zero-shot acima da limite é de cerca de 76% ((CLIP-G、OpenCLIP-G)。 continua a aumentar a necessidade de maiores dados ((SigLIP 2  atingir 80% +) ou mudanças de arquitetura ((supervisionados cabeças、 mais parâmetros)。 Benchmark está em curso 和; verdadeiro valor é o espaço de inserção dos VLMs 消费的嵌入空间。


```figure
multimodal-fusion
```

## Use-o
`code/main.py`实现:

1. Uma jogada dupla codificadora de imagens baseadas em hash, faz com que você possa ver a forma do InfoNCE.
2. 純 Python 的 InfoNCE loss(通過 log-sum-exp 保证數學穩定) 』
3. Utilizado em relação à perda em pares sigmoide.
4. Uma rotina de classificação zero-shot: calcular com um conjunto de pedidos de texto de similaridade cosínica,并用 argmax 进行预测──

运行它并观察损失曲线──绝对数值是玩具;形状与真实CLIP trainer 输出一致──

## Entrega-o
本课生成 `outputs/skill-clip-zero-shot.md`△ deu determinado um grupo de imagens (( através do caminho) e um grupo de classes alvo, ele usa o modelo CLIP  Construir instruções de texto, usando um ponto de verificação especificado (por exemplo `openai/clip-vit-large-patch14`)Embuendo 两侧,并返回带相似度的前-1 /前-5预测──该技能 拒绝对提示列表 中不存在类做出判断──

## 练习
1. Hand动为一个包含 4 个对的批量 实现 InfoNCE──构建 4x4 similarity Matrix,运行软max,取出横向,计算横向──使用这个手算结果验证你的Python实现──

2. Além da temperatura, o SigLIP também usa parâmetros de preconceito.`b`- Não .`S'[i,j] = S[i,j]/tau + b`◊ quando o lote  existe maior desequilíbrio de classes `b`起什么作用?阅读 SigLIP Seção 3 ((arXiv:2303.15343)

3. Para gatos vs cães construir um classificador de tiro zero― tentar dois modelos de prompt:`a photo of a {class}`和 `a picture of a {class}`◊ Em 100 张 test imagens                                                                                                                                                                                                                                                           

4. 計算 512-GPU、batch 32k 运行时,softmax InfoNCE e sigmoid parwise of communication cost──哪个按 O(N) escala,哪个按 O(N^2) escala?引用 SigLIP Section 4──

5. 阅读OpenCLIP escalar-leis papel(arXiv:2212.07143,Cherti et al.)。 Based on grafico复现他们关于数据扩展的结论:在固定模型尺寸下,ImageNet zero-shot accuracy and training data size 之间的日记-linear relationship 是什么?

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| InfoNCE | "Contrastive loss" | 对一个 batch 的 similarity Matrix 做 cross-entropy；每个 item 的 positive 是它配对的 item，negatives 是其他所有项 |
| Sigmoid loss | "SigLIP loss" | Per-pair binary cross-entropy；没有 softmax，没有 all-gather，在 distributed training 中低成本 scale |
| Temperature | "tau" | 在 softmax/sigmoid 之前缩放 logits 的 scalar；控制 distribution 的 sharpness |
| Zero-shot | "no-finetune classification" | 使用 text prompts 构建 class Embeddings，并通过 cosine similarity 分类；不在目标 classes 上训练 |
| Prompt template | "a photo of a ..." | 围绕 class name 的文本脚手架；会影响 zero-shot accuracy 1-5 points |
| Dual encoder | "Two-tower" | 一个 image encoder + 一个 text encoder，输出到共享 D-dim space |
| Hard negative | "Tough distractor" | 与 positive 足够相似的 negative，迫使 model 努力将它们分开 |
| Linear probe | "Frozen + one layer" | 只在 frozen features 之上训练一个 linear classifier；衡量 feature quality |
| NaFlex | "Native flexible resolution" | SigLIP 2 的能力：无需 resize 即可摄入任意 aspect ratio 和 resolution 的 images |
| Temperature scaling | "log-parametrized tau" | CLIP 将 `log(1/tau)` 参数化，使 gradients 表现良好；通过 clipping 防止 collapse 到接近零的 tau |

## 延伸阅读
- [Radford et al. — Learning Transferable Visual Models From Natural Language Supervision (arXiv:2103.00020)](https://arxiv.org/abs/2103.00020)Papel de CLIP.
- [Zhai et al. — Sigmoid Loss for Language Image Pre-Training (arXiv:2303.15343)](https://arxiv.org/abs/2303.15343) SigLIP。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) multilíngue + NaFlex。
- [Jia et al. — ALIGN (arXiv:2102.05918)](https://arxiv.org/abs/2102.05918) Usando escala de dados da web ruidosa。
- [Cherti et al. — Reproducible scaling laws for contrastive language-image learning (arXiv:2212.07143)](https://arxiv.org/abs/2212.07143) Leis de escalação OpenCLIP。
