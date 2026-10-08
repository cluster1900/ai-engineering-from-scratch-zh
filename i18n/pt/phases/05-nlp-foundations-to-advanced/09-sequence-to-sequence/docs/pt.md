# Sequência a Sequência 模型

> Dois RNNs fingem ser traduzentes.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## 问题
Classificação vai mudar sequência de longa duração 映射到单个标签──Translation will change长度序列 映射到另一个变长度序列──输入和输出位于不同词汇中,可能是不同语言,并且不保证长度一致──

seq2seq 架构(Sutskever, Vinyals, Le, 2014) Usou uma receita de um plano simples  resolver este problema。 dois RNN。 uma leitura frase fonte, e produzir um vector de grande dimensão fixo。 outro leitura este vector,并逐 Token 生成目标句──就是你在课08 写的相同套代码,只是以不同方式粘在一起。

É importante aprender por duas razões. Primeiro, o gargalo de botão do conteúdo-vector é o maior fracasso do valor pedagógico da PNL. Ele explica a atenção e transformadores 擅长一切.

## 概念
**Encoder.**读取 fonte frase 的 RNN──s seu estado oculto final é **context Vector** Para toda a entrada de fixação                                                                                                                                                                                                                                                           

**Decoder.**另一个用语境 矢量初始化 RNN──在每一步,它以前一次生成的代币 作为输入,并产生目标词汇 上的分布──通过样本或 argmax 选择下一个代币──再把它回去──重复,直到产生 `<EOS>`Token ou atingir o máximo de comprimento.

**Training:**Em cada passo do decodificador  calcular a perda de entropia cruzada,并沿序列 求和── através de duas redes fazer padrão backprop através do tempo──

**Teacher forcing.**Durante o treino, o decodificador está a dar um passo.`t`O ingresso é localizado.`t-1`O token, em vez de um decodificador, é um pronúncio de tempo. Isto vai ser treinado; sem ele, o modelo nunca vai aprender.**exposure bias**- Não.

**The bottleneck.**Encoder aprender de tudo sobre a fonte, tudo deve ser extrudido para um contexto Vector。长句会丢细节。罕见词会被模糊掉。重排序(chat noir vs. black cat) deve ser memorizado, e não calculado。

Atenção ((leção 10) 通过让解码查看 * cada * encoder estado oculto, não apenas o último,来修复这个问题――这是完整卖点――


```figure
lstm-gates
```

## Construí-lo
### 步骤 1: um codificador

```python
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, src_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(src_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)

    def forward(self, src):
        e = self.embed(src)
        outputs, hidden = self.gru(e)
        return outputs, hidden
```

`outputs`A forma é`[batch, seq_len, hidden_dim]`Cada entrada está escondida.`hidden`A forma é`[1, batch, hidden_dim]` Último passo──Lessão 08 diz que é sobre as saídas fazer pool para realizar classificação── Aqui nós mantemos o último estado oculto  Como contexto vetor,并忽略每一步的输出──

### 步骤 2: um decodificador

```python
class Decoder(nn.Module):
    def __init__(self, tgt_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(tgt_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab_size)

    def forward(self, token, hidden):
        e = self.embed(token)
        out, hidden = self.gru(e, hidden)
        logits = self.fc(out)
        return logits, hidden
```

Decodificador Cada vez que você usa um passo.

### 步骤 3: ciclo de treinamento com o professor forçando

```python
def train_batch(encoder, decoder, src, tgt, bos_id, optimizer, teacher_forcing_ratio=0.9):
    optimizer.zero_grad()
    _, hidden = encoder(src)
    batch_size, tgt_len = tgt.shape
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    loss = 0.0
    loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    for t in range(tgt_len):
        logits, hidden = decoder(input_token, hidden)
        step_loss = loss_fn(logits.squeeze(1), tgt[:, t])
        loss += step_loss
        use_teacher = torch.rand(1).item() < teacher_forcing_ratio
        if use_teacher:
            input_token = tgt[:, t].unsqueeze(1)
        else:
            input_token = logits.argmax(dim=-1)

    loss.backward()
    optimizer.step()
    return loss.item() / tgt_len
```

Duas rotas dignas de nome.`ignore_index=0`Vai saltar o padding Token.`teacher_forcing_ratio`É cada passo usando Token real em vez de probabilidade de modelo de previsão.

### 步骤 4: Loop de inferência (com ganância)

```python
@torch.no_grad()
def greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50):
    _, hidden = encoder(src)
    batch_size = src.shape[0]
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    output_ids = []
    for _ in range(max_len):
        logits, hidden = decoder(input_token, hidden)
        next_token = logits.argmax(dim=-1)
        output_ids.append(next_token)
        input_token = next_token
        if (next_token == eos_id).all():
            break
    return torch.cat(output_ids, dim=1)
```

A codificação gananciosa em cada passo seleciona a probabilidade mais alta de Token. Pode ser desviada: uma vez que você promete um Token, não pode ser revogado.**Beam search**- Vou ficar com o topo...`k`个部分序列,最后选择得分最高的完整序列──Beam width 3-5 是标准设置──

### 步骤 5: o gargalo de engarrafamento, demonstrado

Em tarefa de cópia de brinquedo 上训练模型:source `[a, b, c, d, e]`- O alvo.`[a, b, c, d, e]` aumentar a duração da sequência  observar a precisão 

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个GRU hidden state 无法无损记住 40-Token 输入――informação existe em cada etapa do codificador, mas o decodificador só vê o último estado――Attenção 直接修复这一点――

## Use-o
PyTorch 提供 `nn.Transformer`E baseado em`nn.LSTM`De forma a fazer um "Hugging Face"`transformers`Biblioteca  fornecer modelos de codificador-decodificador completos ((BART、T5、mBART、NLLB), que são treinados em bilhões de tokens.

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

Os codificadores-decodificadores modernos já usaram transformadores substituindo o RNN──formato de alto nível (encoder, decodificador, tokens) com o papel de 2014  completamente o mesmo── cada bloco  mecanismo interno diferente──

### 什么时候仍然选择 RNN-based seq2seq

Para os novos projectos, quase nunca é necessário fazê-lo.

- Translação de streaming, precisa de ter um limite de memória uma vez consumando um Token de entrada.
- Geração de texto no dispositivo, custo de memória do transformador é muito alto.
- O que é que é o melhor caminho para a vitória?

### Bias de exposição  e seus métodos de suabilização

- **Scheduled sampling.** durante o treinamento, o professor anal força a proporção, 让模型学会从自己的错误中恢复──
- **Minimum risk training.**Use Sentence Classe BLEU score em vez de token Classe cross-entropy  treinar― mais perto do seu objetivo verdadeiro―
- **Reinforcement Learning fine-tuning.**Utilizando métricas  gerador de sequência de prêmios。

Esta terceira ainda é aplicável à produção baseada em transformador.

## Entrega-o
保存为 `outputs/prompt-seq2seq-design.md`- Não .

```markdown
---
name: seq2seq-design
description: 为给定任务设计 sequence-to-sequence pipeline。
phase: 5
lesson: 09
---

给定任务（translation、summarization、paraphrase、question rewrite），输出：

1. 架构。默认使用 pretrained transformer encoder-decoder（BART、T5、mBART、NLLB）。RNN-based seq2seq 只适用于特定约束。
2. Starting checkpoint。命名它（`facebook/bart-base`、`google/flan-t5-base`、`facebook/nllb-200-distilled-600M`）。让 checkpoint 匹配任务和语言覆盖范围。
3. Decoding strategy。Greedy 用于 deterministic output，beam search（width 4-5）用于质量，带 temperature 的 sampling 用于多样性。用一句话说明理由。
4. 发布前要验证的一个 failure mode。Exposure bias 会表现为较长输出上的 generation drift；抽样 20 个位于 90th-percentile length 的输出并目检。

对于少于一百万 parallel examples 的情况，拒绝推荐从头训练 seq2seq。将任何面向用户内容却使用 greedy decoding 的 pipeline 标记为 fragile（greedy 会重复并陷入循环）。
```

## 练习
1. **Easy.**实现 brinquedo de cópia tarefa──在 target等等于 fonte de entrada-saída pares 上训练 GRU seq2seq──测量长度 5、10、20 的精度──复现瓶──
2. **Medium.**添加束宽 3 的束搜索解码──在小型平行体上对比贪度测量 BLEU──记录束搜索 胜出的地方(通常是最后几个代币) 以及它没有差异的地方──
3. **Hard.**Em 10k par par paráfrase conjunto de dados cima de sintonia fina `facebook/bart-base`❖ Comparar a saída de feixe-4 do modelo de sintonia fina com a saída de base no modelo de entrada em funcionamento ❖ relatório BLEU,并挑选10 个质量例──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder | Input RNN | 读取 source。产生 per-step hidden states 和最终 context Vector。 |
| Decoder | Output RNN | 从 context Vector 初始化。一次生成一个 target Token。 |
| Context vector | 摘要 | 最终 encoder hidden state。固定大小。Attention 要解决的 bottleneck。 |
| Teacher forcing | 使用真实 Token | 训练时喂入 ground-truth previous Token。稳定学习。 |
| Exposure bias | Train/test gap | 在真实 Token 上训练的模型，从未练习过从自身错误中恢复。 |
| Beam search | 更好的 decoding | 每一步保留 top-k partial sequences，而不是 greedy 地直接承诺。 |

## 延伸阅读
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) 原始 seq2seq papel。四页──
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078)Introduziu o GRU e o encoder-decoder.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Papel de atenção──读完本课后立刻阅读──
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 可构建的 seq2seq + Atenção 代码──
