# 视觉编码器 Patches

> 读取像素的视觉模型需要像素分词器──补丁嵌入就是那分词器──将图像切割成正方形网格,展平每正方形,投影到线性层,然后添加2D 位置信号,以便Transformer知道每正方形在原始图像中的位置──

**Type:** Build
**Languages:** Python
**Prerequisites:** 第19期第30-37课（B轨基础）
**Time:** ~90 分钟

## Objectivo de aprendizagem

- Transformar imagem em sequência de inserção de correção de comprimento fixo.
- 实现基于 `Conv2d`A projeção é uma correspondência matemática entre o filme e o desenho.
- 构建确定性 2D 正弦位置嵌入,以便token顺序编码空间位置──
- 验证 sintetizado fixação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `Conv2d`- Eficácia de desenvolvimento

## 问题

Transformador 接收一系列向量──图像是一个3通道网格──将每个像素作为代码读取导致序列长度爆炸:224x224 RGB 图像是150,528个代码,这是12层 变压器 无法承受──将图像读取为一个巨大的平面向量会丢弃局部性,而注意层无法从中恢复──编码器前端的工作是将像素网格压缩为数百代码,每个代码概括一个正方形区域──

补丁嵌入通过一个线性投影解决了这个问题──将224x224 图像切成16x16块会产生包含196 块的14x14 网格──每个补丁都从`(3, 16, 16) = 768`像素值展平为一个向量,然后线性层将其映射到模型的隐藏维度──Transformer 见 196 维度为`hidden`(geralmente para 768) token adicionado a um token CLS. Este é o sequência do restante da rede que pode ser emprestado.

## 概念

```mermaid
flowchart LR
  Image[224x224x3 image] --> Cut[cut into 16x16 patches]
  Cut --> Grid[14x14 grid of patches]
  Grid --> Flatten[flatten each patch]
  Flatten --> Proj[linear projection]
  Proj --> Tokens[196 tokens of dim hidden]
  Tokens --> Pos[add 2D sinusoidal position]
  Pos --> Out[final token sequence]
```

### Por que é um complemento, e não um pictograma?

O atenção é a segunda divisão da longitude da sequência. 196 tokens da sequência por nível por custo.`196 * 196 = 38,416`O custo de uma sequência de tokens é de 150.528 个代币.`150,528 * 150,528 = 22.6 billion` O complemento pode reduzir a quantidade de atenção em 590.000 vezes, e uma única região de 16x16 pode suportar um sinal suficiente para executar tarefas de visão de alto nível.

### Por que a projeção sexual é suficiente?

Cada complemento é considerado como um veículo independente.`768 * 768 = 589,824`参数) e treinamento de velocidade muito rápido. Há mais profundas volumes de fios (混合ViT), mas projeção linear de plano é padrão, e a maioria dos modernos sistemas de codificação de pesos abertos têm essa forma precisa.

### `Conv2d`技巧

Não está cheio .`Conv2d(in_channels=3, out_channels=hidden, kernel_size=patch_size, stride=patch_size)`Dando o mesmo resultado numérico que o de desenvolvimento e depois linear, porque cada posição de saída irá fazer um ponto de acumulação de imagens complementares com um 波器.

### Localização emite

token não transporta qualquer sequência fora de projeção. 2D 正弦嵌入为每个代币提供一个固定信号,用于编码其`(row, col)`Posição: metade da dimensão embutida é usada para codificar a posição da linha em várias frequências; a outra metade é definida, de modo que você pode trocar resolução sem precisar de re-treinamento, e pode colocar o valor de forma precisa no modelo de rede nunca antes visto durante o treino.

|组件|形状|参数|
|-----------|-------|------------|
|补丁投影（`Conv2d`）| `(hidden, 3, patch, patch)` | `3 * P * P * hidden + hidden` |
|位置嵌入（固定）| `(num_patches, hidden)` | 0（计算，未学习）|
| CLS token（已学习）| `(1, hidden)` | `hidden` |

对于 224 分辨率的ViT-Base/16:投影中有590,592 参数,CLS token中有768 参数,正弦位置为零──下一课 (59) 在该前端顶部堆叠一个12层变压器──

### ), como equivalência de controlo de saúde

补丁步骤 补丁步骤 补丁步骤 补丁步骤 补丁步骤 补丁步骤 补丁步骤 补丁步步步 有两种拼写:`Conv2d`O projeto e o desenho explicativo devem produzir a mesma saída com o mesmo peso. Se não fizer isso, o desenho matemático é errado, o resto do programador é construído na areia.


```figure
ch-patch-tokenizer
```

## Construí-lo

`code/main.py`实现:

- `PatchEmbed`- Não .`nn.Module`包装 `Conv2d`Usado para a projecção de correcção.
- `sinusoidal_2d(grid_h, grid_w, dim)`, uma construção de função de estado sem 2D de uma posição de arquivos.
- `VisionFrontEnd`, ele vai complementar embutidos, CLS pré-imposição e localização adicionado ao conjunto de uma vez para o passado para o passado.
- Um .`synthesize_image(seed)`- Ajudante, pode ser.`numpy.random`构建确定性 224x224x3 fixação
- Uma demonstração, através do codificador front-end 运行一张 fixture 图像,并印出形状、CLS token 范数和一行位置嵌入──

- Não .

```bash
python3 code/main.py
```

输出: 24x224 fixação 编码为形状 `(1, 197, 768)`O primeiro símbolo é CLS; os seguintes 196 são símbolos de correção.

## Use-o

Paralelas de correção aparecem em cada modelo de linguagem moderna: CLIP ViT-L/14、SigLIP、DINOv2、Qwen-VL 系列和InternVL 堆都从`Conv2d`补丁投影加上位置信号开始──下游各系列之间的差异(CLS e não CLS 池化、注册代码、 diferentes补丁大小 14 和 16、 através da inserção de valores posição para realizar a resolução dinâmica) ⋅

## 测试

`code/test_main.py` abrangendo:

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `(image_size / patch_size) ** 2`
- 输出形匹配`(batch, num_patches + 1, hidden)`
- `Conv2d`Projeção é igual a um pequeno equipamento , que se move a mão e depois é projetado
- O quadro de posição está definido entre as regras
- Títulos CLS transversos em lote

运行它们:

```bash
python3 -m unittest code/test_main.py
```

## 练习

1. Usando para aprender`nn.Parameter`換正弦位置,并比较小综合分类任务的第一纪元损失──学习位置以固定分辨率获胜;当你在训练后改变分辨率时,正弦曲线获胜──

2. - Não .`Conv2d`替换为显式 `nn.Unfold`- Não .`nn.Linear`,并断言输出匹配在浮动容量差范围内──同样数学,有两种拼写方法──

3. Adicionar um grande suporte a complementos não quadrados (por exemplo, entrada de tela larga é de 32x16), e verificar a posição do gráfico de tratamento de redes não quadrados.

4. Em lote grande 1、8、64  Análise de correção passo passo.

5. Em 4 tipos de dados de forma sintética (conjunto de dados de forma sintética) (conjunto de dados de forma sintética) (conjunto de dados de forma sintética) (conjunto de dados de forma sintética) (conjunto de dados de dados de forma sintética) (conjunto de dados de dados de forma sintética) (conjunto de dados de dados de dados de dados de forma sintética) (conjunto de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados

## 关键术语

|术语 |这意味着什么 |
|------|---------------|
|补丁|图像的方形子区域，通常为 14x14 或 16x16 |
|补丁嵌入 |一个扁平面片到hidden dim区域的线性投影 |
|序列长度|补丁token化后的 token数量，通常加上 CLS |
|正弦位置 |修复了编码 2D 网格坐标的 sin/cos 信号 |
| CLS token |学习向量作为池化头添加到序列前面 |

##  weiterlesen

- 对于原始补丁嵌入框架,图像值16x16 个字符(ViT,2021)。
- A atenção é tudo que você precisa (2017)
- Usando o artigo DINOv2 do registro de tokens, você pode adicionar uma expansão como exercício 6.
