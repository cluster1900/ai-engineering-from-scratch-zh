# BERT  Modelagem de Línguas Enmascaradas

> GPT 预测下一个词――BERT 预测缺失的词――只差一句话,却带来了半十年的各种嵌入式――

**类型:**Construção
**语言:**Python
**先修:**Fase 7 · 05 (Transformador completo), Fase 5 · 02 (文本表示)
**时间:**- 45 minutos.

## 问题

Em 2018, cada tarefa de PNL  análise emocional  NER、QA、entailment todos vão treinar seus próprios modelos a partir de seus próprios dados de marcação.

BERT (Devlin et al. 2018)  apresentou uma questão: se nós pegamos um codificador Transformer, treiná-lo em cada frase na Internet, e forçá-lo de acordo com os dois lados, que acontecerá? Então você só precisa ajustar a tarefa de download em uma boa forma.

O resultado é: em 18 meses, BERT e seus variantes (RoBERTA, ALBERT, ELECTRA) dominaram todos os líderes da PNL até 2020, cada motor de busca na Terra tem um BERT.

Até 2026, apenas o modelo de codificação continua a ser uma classificação, recuperação e estruturação de ferramentas que utilizam cada token com uma velocidade de execução superior à do decodificador 快 510×, enquanto as suas incorporações são a estrutura de cada stack de recuperação moderna.

## 核心概念

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### 訓練信号

- Não .`the quick brown fox jumps over the lazy dog`- Não.

Mascaras de 15% de Token:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

訓練模型在被面具的位置预测 原始 Token──因为 o codificador é bidirecional, portanto, em posição 1 预测 `[MASK]`时, pode usar posição 2+ `brown fox jumps`É o que o GPT não faz.

### Mascara BERT 规则

Em 15% dos Tokens utilizados na pré-exame:

- 80% são substituídos por`[MASK]`- Não.
- 10% são substituídos por Tokens de Oportunidade.
- 10% 保持不变──

Porque não é sempre útil?`[MASK]`Porque ?`[MASK]`Não surgirá nunca quando se for concluído. Se o modelo de treinamento estiver em posição mascarada 100%, espero que seja.`[MASK]`, em relação ao pré-treino e ao ajuste fino, ocorre uma distribuição desviada.

### Próximo Previsão de Sentença (NSP) e por que foi removido

O original BERT também treinou o NSP: deu-se dois frases A e B, prevê-se que B não segue em A 后面── RoBERTa (2019) fez uma experiência de dissipação para ele, provando que o NSP tem nenhum benefício── modern encoder irá saltar sobre ele──

### 2026  变化:ModernBERT

O ModernBERT de 2024 reedifica o bloco com componentes básicos de 2026:

| Component | Original BERT (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Positional | Learned absolute | RoPE |
| Activation | GELU | GeGLU |
| Normalization | LayerNorm | Pre-norm RMSNorm |
| Attention | Full dense | Alternating local (128) + global |
| Context length | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

Além disso, diferente da pilha de 2018, ele originalmente suporta Flash-Attention.

### 2026 anos ainda escolher código de uso

| Task | 为什么 encoder 胜过 decoder |
|------|------------------------------|
| Retrieval / semantic search embeddings | Bidirectional context = 每个 Token 更好的 Embedding 质量 |
| Classification (sentiment, intent, toxicity) | 一次 forward pass；没有生成开销 |
| NER / token labeling | 逐位置输出，天然 bidirectional |
| Zero-shot entailment (NLI) | encoder 顶部的 classifier head |
| Reranker for RAG | Cross-encoder scoring，比 LLM rerankers 快 10x |


```figure
transformer-residual
```

## Construí-lo

### 步骤 1: Mastização da lógica

- Não .`code/main.py`。 função `create_mlm_batch`接收一个代码 ID 列表、语音大小 和面具概率──返回输入 IDs(已应用面具) 和标签(只在面具位置有值,其他位置为 -100这是PyTorch的无视索引 约定) 

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### 步骤 2: Na um micro corpus 上运行 MLM previsão

Em contendo 20 palavras, 200 sentenças, treinar um codificador de 2 camadas + cabeça MLM. Não há Gradiente.

### 步骤 3: Comparar mascaras 类型

Mostra regras de três caminhos como fazer um modelo em ausência`[MASK]`Em casos ainda disponíveis. Em sentenças não mascaradas e em sentenças mascaradas, as duas devem gerar um distribuição de tokens razoável, pois o modelo já foi visto em treino.

### 步骤 4: cabeça de sintonia fina

Em um conjunto de dados de sentimentos de brinquedo, use o cabeçalho de classificação  substituir o cabeçalho de MLM                                                                                                                                                                                                                                               

## Use-o

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Embedding models 是 fine-tuned BERT。** `sentence-transformers`Como um`all-MiniLM-L6-v2`Este modelo, é com perda contrastada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

**Cross-encoder rerankers 也是 fine-tuned BERT。**Em`[CLS] query [SEP] doc [SEP]`上做 pares-classificação──query 和 doc 之间的双向关注,正是交叉编码相比双编码 具有质量优势的原因──

**2026 年什么时候不该选 BERT。**任何生成式任务──encoder 没有合理方式 autoregressively 生成 Token──另外: quaisquer parâmetros 1B 以下、其中小型 decoder 能以更高灵活性达到相同质量的任务 (Phi-3-Mini, Qwen2-1.5B)──

## Entrega-o

- Não .`outputs/skill-bert-finetuner.md`◊ Esta habilidade irá ser utilizada para uma nova classificação ou extracção  task definition BERT fine-tune 

## 练习

1. **Easy.**运行 `code/main.py`, e imprimir 10.000 Token  上面的面具 分布──确认约15% foram escolhidos, sendo que cerca de 80% 变成了`[MASK]`- Não.
2. **Medium.**实现全字掩饰: Se um termo for cortado por Tokenizer 切成字段,则一起掩饰所有字段,或全部不掩饰──衡量这是否能在500-sentence corpus 上提升MLM精度──
3. **Hard.**Em 10.000 sentenças de dados públicos, treinar um pequeno (2-camada, d=64) BERT― para sintonização do sentimento SST-2`[CLS]`Token── Comparado com params Decoder-somente linha de base

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| MLM | "Masked language modeling" | 训练信号：随机将 15% 的 Token 替换为 `[MASK]`，预测原始 Token。 |
| Bidirectional | "双向看" | Encoder Attention 没有 causal mask——每个位置都能看到其他所有位置。 |
| `[CLS]` | "The pooler token" | 一个添加到每个 sequence 开头的特殊 Token；它的最终 Embedding 用作句子级表示。 |
| `[SEP]` | "Segment separator" | 分隔成对的 sequence（例如 query/doc、sentence A/B）。 |
| NSP | "Next sentence prediction" | BERT 的第二个 pretraining 任务；在 RoBERTa 中被证明无用，2019 年后被移除。 |
| Fine-tuning | "适配一个任务" | 基本保持 encoder 冻结；在其上训练一个小 head 来完成下游任务。 |
| Cross-encoder | "一个 reranker" | 一个同时接收 query 和 doc 作为输入，并输出相关性分数的 BERT。 |
| ModernBERT | "2024 refresh" | 用 RoPE、RMSNorm、GeGLU、交替 local/global attention、8K context 重建的 encoder。 |

## 延伸阅读

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) 原始论文──
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) 如何正确训练 BERT;移除NSP──
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555)Em igual cálculo, a detecção de tokens substituídos venceu o MLM.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) ModernBERT 论文──
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) 标准 encoder 参考。
