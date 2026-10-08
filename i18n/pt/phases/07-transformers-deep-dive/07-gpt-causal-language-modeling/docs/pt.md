# GPT  Modelagem de Língua Causal

> BERT 能看到两侧──GPT 只能看到过去──triangle mask é a mais profunda influência da IA moderna.

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 02 (Autotensão), Fase 7 · 05 (Transformador completo), Fase 7 · 06 (BERT)
**Time:** ~75 分钟

## 问题

Modelo de linguagem 回答一个问题:给定前 `t-1`- Tokens, tokens.`t`Com este treinamento de sinal, ou seja, a previsão de tokens próximos, você vai obter um que pode gerar um token uma vez, gerar qualquer modelo de texto.

Para realizar o treinamento de ponta a ponta em toda a sequência, você precisa deixar a previsão de cada posição depender apenas da posição anterior.

Mas a máscara causal é o que fazemos.`-inf`∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆ ∆

GPT-1 (2018), GPT-2 (2019), GPT-3 (2020), GPT-4 (2023), GPT-5 (2024), Claude, Llama, Qwen, Mistral, DeepSeek, Kimi   são transformadores causais apenas para decodificadores, o ciclo central é o mesmo.

## 概念

![Causal mask creates a triangular attention matrix](../assets/causal-attention.svg)

### Mascarete

给定长度为 `N`Sequência, construção de um`N × N`Matriz:

```
M[i, j] = 0       if j <= i
M[i, j] = -inf    if j > i
```

Em suavidade, antes de`M`Adição a pontuação de atenção original`exp(-inf) = 0`, por isso, o peso da contribuição da posição da máscara é de zero.

实现成本: uma vez `torch.tril()`调用――计算时间:纳秒级―― para o impacto de todo o campo:一切――

### Não fizemos treinamento, não fizemos recomendações.

訓練:对整体 `(N, d_model)`sequência fazer uma passagem avançada, calcular N 个 cruz entropy perdas ((( cada posição uma),求和,backprop。 ao longo da sequência 并行──这是GPT 训练能够扩展的原因:你可以在一次GPU pass 中处理批中的1M代币──

推理: Você cada token 生成──输入 `[t1, t2, t3]`- Não .`t4` Introdução`[t1, t2, t3, t4]`- Não .`t5` Introdução`[t1, t2, t3, t4, t5]`- Não .`t6` Caches de KV (Lessão 12) 保存`t1…tn`Os estados ocultos, assim você não precisa recalcular-los em cada passo. Mas, ao pensar, a profundidade de linha = a extensão de saída.

### Perda  mudança por mudança

给定 tokens `[t1, t2, t3, t4]`- Não .

- - Introdução:`[t1, t2, t3]`
- Objetivos: `[t2, t3, t4]`

Para cada posição .`i`, calcular `-log P(target_i | inputs[:i+1])`△求和── é a entropia cruzada de toda a sequência.

Todos os transformadores que já ouviram falar de LM usaram essa perda  treinamento―pre-treinamento―fine-tuning―SFT  perda 

### Estratégias de decodificação

Depois do treino, a amostragem é mais importante do que as pessoas imaginam.

| Method | What it does | When to use |
|--------|--------------|-------------|
| Greedy | 每一步取 Argmax | 确定性任务、code completion |
| Temperature | 将 logits 除以 T，然后 sample | 创造性任务，T 越高多样性越强 |
| Top-k | 只从 top-k tokens 中 sample | 消除低概率长尾 |
| Top-p (nucleus) | 从累计概率 ≥ p 的最小集合中 sample | 2020+ 默认选择；会适应分布形状 |
| Min-p | 保留 `p > min_p * max_p` 的 tokens | 2024+；比 top-p 更擅长拒绝长尾 |
| Speculative decoding | draft model 提出 N 个 tokens，big model 验证 | 在质量相同的情况下减少 2–3× 延迟 |

Em 2026, para modelos de peso aberto, min-p + temperatura 0,7 é um valor de referência razoável. A descodificação especulativa é a configuração básica de qualquer estáck de inferência de produção.

### 让 GPT receita  起作用的因素

1. **Decoder-only.**Não há codificador. Cada nível é uma vez. Atenção + passagem FFN.
2. **Scaling.**124M → 1.5B → 175B → trilhões。Leias de escala da Chinchilla(Lessão 13) diga-te como distribuir a computação。
3. **In-context learning.**Aproximadamente em 6B13B 时涌现――模型无需细调就能跟随少数shot例子――
4. **RLHF.**Baseado em preferências humanas pós-treinamento Colocar o original pré-treinado 文本模型转化为聊天助手──
5. **Pre-norm + RoPE + SwiGLU.**支大规模稳定训练──

Desde o GPT-2, a estrutura central não mudou muito. Muitas mudanças realmente interessantes ocorreram em dados, escala e pós-treino.


```figure
causal-mask
```


```figure
mask-derivation
```

## Construí-lo

### 步骤 1: máscara causal

- Não .`code/main.py`一行代码:

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Em suave max   antes de adicionar a pontuação de atenção .

### 步骤 2: Um modelo GPT de 2 camadas

堆叠两个解码块(masquered self-attention + FFN,无跨注意)。添加代码嵌入、位置编码 和无嵌入(与代码嵌入矩阵 绑定,这是自 GPT-2 以来来的标准技巧)。

### 步骤 3: previsão de next-token,端到端

Em um vocabulário de brinquedo de 20 tokens, em cada posição, produzem logitas.

### 步骤 4: amostragem

实现 avarice、temperatura、top-k、top-p、min-p──在固定 prompt 上运行每种并比较输出──一样本取样函数只需要10 行──

## Use-o

PyTorch, 2026 Idioma:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")
tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B-Instruct")

prompt = "Attention is all you need because"
inputs = tok(prompt, return_tensors="pt")
out = model.generate(
    **inputs,
    max_new_tokens=64,
    temperature=0.7,
    top_p=0.9,
    do_sample=True,
)
print(tok.decode(out[0]))
```

No fundo,`generate()`运行前传,取出最后位置 logits,sample 下一个代币,追加它,然后重复──每个生产级 LLM inference stack(vLLM, TensorRT-LLM, llama.cpp, Ollama, MLX)都用重度优化实现同一个循环  batched prefill、continuous batching、KV cache paging、speculative decoding──

**GPT vs BERT，各用一句话：**GPT 预测 `P(x_t | x_{<t})`BERT 预测 `P(x_masked | x_unmasked)`◊ perda decide se o modelo pode ser produzido

## Entrega-o

- Não .`outputs/skill-sampling-tuner.md`◊ Esta habilidade irá ser utilizada para a nova tarefa de geração                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

## 练习

1. **Easy.**运行 `code/main.py`, verificando softmax                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
2. **Medium.**实现宽度为 4 的梁搜索──在 10 个短提示 上比较梁-4 与贪的困惑──beam 总是会赢吗?
3. **Hard.**实现 decodificação especulativa: usar um modelo de 2 camadas de tipo pequeno como projeto, usar um modelo de 6 camadas como verificador。 medir 100 个长度为 64 的完成 上的壁钟速度up──确认输出与验证器的贪输出匹配──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Causal mask | “三角形” | 加到 attention scores 上的上三角 `-inf` matrix，使位置 `i` 只能看到位置 `≤ i`。 |
| Next-token prediction | “loss” | 模型在每个位置上的分布与真实下一个 token 之间的 cross-entropy。 |
| Autoregressive | “一次生成一个” | 将输出反馈为输入；并行性只存在于训练阶段，不存在于生成阶段。 |
| Logits | “pre-softmax scores” | softmax 之前 LM head 的原始输出；sampling 就发生在这些值上。 |
| Temperature | “创造力旋钮” | 将 logits 除以 T；T→0 = greedy，T→∞ = uniform。 |
| Top-p | “Nucleus sampling” | 将分布截断为累计和 ≥p 的最小集合；从剩余部分 sample。 |
| Min-p | “比 top-p 更好” | 保留满足 `p ≥ min_p × max_p` 的 tokens；会根据分布尖锐程度调整 cutoff。 |
| Speculative decoding | “draft + verify” | 便宜模型提出 N 个 tokens；大模型并行验证。 |
| Teacher forcing | “训练技巧” | 训练时输入真实的前一个 token，而不是模型的预测。每个 seq2seq LM 的标准做法。 |

## 延伸阅读

- [Radford et al. (2018). Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) GPT-1。
- [Radford et al. (2019). Language Models are Unsupervised Multitask Learners](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) GPT-2。
- [Brown et al. (2020). Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165) GPT-3 和 aprendizagem no contexto
- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) especificação de decodificação 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) 标准 causal-LM 参考代码──
