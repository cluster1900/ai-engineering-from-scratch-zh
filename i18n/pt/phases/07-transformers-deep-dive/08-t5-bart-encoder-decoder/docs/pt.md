# T5, BART  Modelos de codificação e decodificação

> Encoder  responsável por compreender. Decoder  responsável por gerar. Reconjugar-os, obtém um modelo de construção de tarefas dedicado a entrada → saída:

**Type:** Learn
**Languages:** Python
**先修要求:**Fase 7 · 05 (Transformador completo), Fase 7 · 06 (BERT), Fase 7 · 07 (GPT)
**Time:** ~45 minutes

## 问题

GPT-apenas decodificador e BERT-apenas encodificador foram feitos para diferentes objetivos para a estrutura de 2017 em questão.

- Tradução: Inglês → Francês.
- Resumo: 5.000-Token 文章 → 200-Token 摘要──
- Reconhecimento de fala: 音频 Token → 文本 Token。
- 结构化抽取: 散文 → JSON。

Para estas tarefas, o encoder-decoder é a forma mais adequada. O encoder gerou uma fonte de conteúdo intenso. O decoder gerou uma saída e, a cada passo, executou uma atenção cruzada.

两篇论文 defini了现代做法:

1. **T5**(Raffel et al. 2019). "Transformador de Transferência de Texto para Texto". vai reexpressar cada tarefa de PNL como texto-in, texto-out.
2. **BART**(Lewis et al. 2019). "Transformador bidirecional e auto-regressivo. " 去噪 autoencoder:以多种方式破坏输入(shuffle、mask、delete、rotate),让解码重建原始内容──

Até 2026, o formato de codificador-decodificador ainda existe em um lugar muito importante:

- Suspirar (discurso → texto).
- Google's tradução técnica
- Alguns têm um contexto e edição definidos 结构的代码-Completation / repair 模型──
- Utilizando o raciocínio estruturado, o Flan-T5 e seus variantes da tarefa.

Só o decodificador ganhou o聚光灯, mas o decodificador não desapareceu.

## 概念

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### O ciclo anterior

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

O chave está em que o codificador para cada entrada só é executado uma vez. O decodificador é executado de forma autoregressiva, mas cada passo é executado de forma cruzada até o mesmo codificador.

### T5 预训练  corrupção de alcance

随机选择输入中的 span ((平均长度 3 个 Token,总计 15%) ―― usando o único sentinela 替换每个 span:`<extra_id_0>`- Não.`<extra_id_1>`E assim... o decodificador só saiu de um espaço de tempo destruído, e não entra em contato com o sentinela anterior:

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

Comparado com a previsão de toda a sequência, este é um sinal mais barato. Em ablação do T5 论文, tem competência com MLM (BERT) e prefixo-LM (UniLM).

### BART 预训练  Denosagem de ruído múltipla

BART 尝试了五种噪音功能:

1. Mascaragem de tokens.
2. - A eliminação de tokens.
3. Infiltrando texto (mascarinha, decodificador)
4. Permutação de frases.
5. - A rotação de documentos.

O conjunto de inflorescência de texto + permutação de frases gerou o melhor resultado. O decodificador 始终重建原始内容.

### 推理

Com GPT, a geração autoregressiva é igual à geração autoregressiva.

### 2026 ano que é escolher os diferentes tipos

| Task | Encoder-decoder? | Why |
|------|------------------|-----|
| Translation | 是，通常如此 | 明确的源序列；固定的输出分布；beam search 有效 |
| Speech-to-text | 是 (Whisper) | 输入 modality 与输出不同；encoder 塑造音频特征 |
| Chat / reasoning | 否，decoder-only | 没有持久的“input”——对话本身就是序列 |
| Code completion | 通常否 | decoder-only 搭配长上下文更强；像 Qwen 2.5 Coder 这样的代码模型是 decoder-only |
| Summarization | 两者皆可 | BART、PEGASUS 超过了早期 decoder-only baseline；现代 decoder-only LLMs 已经能与它们匹配 |
| Structured extraction | 两者皆可 | T5 很干净，因为“text → text”可以吸收任何输出格式 |

Desde cerca de 2022 anos, a tendência é: apenas o decodificador 接管过去由编码-decoder 主导的任务,因为 (a) instrução-tuned decodificador-only LLM pode através de incitação 泛化到任何任务, (b) 单一架构比两个架构更容易扩展, (c) RLHF 假设使用 decoder──encoder-decoder 仍然保留在输入方式、不同(speechimages) 或束搜索质量很场景──


```figure
encoder-decoder
```

## Construí-lo

- Não .`code/main.py` Nós somos um corpus de brinquedos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

### 步骤 1: corrupção de espaço

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

O objetivo 格式遵循 T5 约定:`<sent0> span0 <sent1> span1 ...` entrada corrupta 会把未改变的Token 与 span 位置上的哨兵Token 交错排列──

### 步骤 2: verifique viagem de ida e volta

给定腐败输入 和目标,重建原始句子──如果你的腐败是可逆的,那么前进通过就是良定义的──这是一个智能检查真实训练从不这样做,但这个测试成本很低,并且能够捕捉跨度会计管理中的偏差──

### 步骤 3: Barulho BART

五个函数:`token_mask`- Não.`token_delete`- Não.`text_infill`- Não.`sentence_permute`- Não.`document_rotate`◊ 组合其中两个并显示结果──

## Use-o

AbraçosFace 参考:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

T5 技巧:任务名称进入输入文本──同一个模型可以处理数十种任务,因为每个任务都是文本进出. Até 2026, este modelo já foi amplificado por modelo de decodificador-só com instruções, mas T5 最先将规范化──

## Entrega-o

- Não .`outputs/skill-seq2seq-picker.md` Esta habilidade será feita de acordo com a estrutura 、延迟和质量目标, para uma nova tarefa em encoder-decoder e decoder-only ¦

## 练习

1. **Easy.**运行 `code/main.py`, para uma corrupção de 30 tokens 句子应用跨度,验证将非哨兵源代币与解码目标跨度 拼接后可以复现原始句子──
2. **Medium.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `text_infill`- Não .`<mask>`Token  substituir como tempo, decodificador  deve deduzir o tempo correto  longitud e conteúdo ∞ mostrar um exemplo ∞
3. **Hard.**Em um muito pequeno inglês → porco-latino corpus(200 对)`flan-t5-small`△ em conjunto de 50 pares de manuseio △ em conjunto de 50 pares de manuseio △ em conjunto de dados e de cálculo ∞`Llama-3.2-1B`Os resultados foram comparados.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder-decoder | “Seq2seq transformer” | 两个 stack：用于输入的 bidirectional encoder，以及带 cross-attention、用于输出的 causal decoder。 |
| Cross-attention | “源内容与目标内容对话的地方” | decoder 的 Q × encoder 的 K/V。这是 encoder 信息进入 decoder 的唯一位置。 |
| Span corruption | “T5 的预训练技巧” | 用 sentinel Token 替换随机 span；decoder 输出这些 span。 |
| Denoising objective | “BART 的游戏” | 对输入应用 noise function，训练 decoder 重建 clean sequence。 |
| Sentinel token | “`<extra_id_N>` 占位符” | 特殊 Token，用于在 source 中标记被破坏的 span，并在 target 中重新标记它们。 |
| Flan | “Instruction-tuned T5” | 在超过 1,800 个任务上 fine-tuned 的 T5；让 encoder-decoder 在 instruction-following 上具备竞争力。 |
| Beam search | “Decoding strategy” | 在每一步保留 top-k 个 partial sequence；是翻译/摘要的标准做法。 |
| Teacher forcing | “Training-time input” | 训练期间，把真实的前一个输出 Token 喂给 decoder，而不是采样出来的 Token。 |

## 延伸阅读

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683)- T5
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461)- Não, não.
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) Flan-T5──
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Whisper,2026 anos de codificador-decodificador canônico。
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) 参考实现。
