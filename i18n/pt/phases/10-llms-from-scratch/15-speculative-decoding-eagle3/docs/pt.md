# Descodificação especulativa e EAGLE-3

> Fase 7 · Lição 16  provou matemática: Leviathan  rejeição de regras                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16（speculative decoding math），Phase 10 · 12（inference optimization）
**Time:** ~75 minutes

## Objectivo de aprendizagem
- Usando uma frase, o teorema de Leviathan, não demonstra que o ciclo especulativo produz uma distribuição de amostras e de verificadores totalmente em consonância.
- Rício de descodificação de especificações de baunilha (Leviathan 2023) para o desenvolvimento de dois anos de EAGLE、EAGLE-2 e EAGLE-3, e diz que cada passo é limitado.
- 根据接受率 `α`和 projecto-a-verificador 成本比 `c`計算期望加速,并为每种政制 选择最优草案 长度                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `N`- Não.
- Desde zero a realização do ciclo especulativo completo:projeto, verificação, rejeição-muestra do residual, recorrência do cache KV, em total aceitação, saída de tokens de bônus.

## 问题
Em um modelo de 70B, fazer decodificação autoregressiva, em H100, pode ser apenas por segundo 35 Tokens. GPU 远未和── Memória largura de banda 才是上限: cada Token precisa ser carregado de HBM 权重 70B, executar um cálculo de passo, e então gerar um float── calcular uma unidade a maior parte do tempo está em estado de vazio──

A descodificação especulativa transformará-a num problema de pronúncia verdadeiramente resolvivel.`N`Próximo passagem avançada`N`个 Token──verificador está em prefixo 加上所有 `N`个草案 上运行一次―― Se o verificador estiver em posição `i`De acordo com o estudo, a distribuição de dados em um modelo de dados é de um modo que pode ser definido, e se não é de um modo que seja rejeitado, pode ser feita uma modificação.`N+1`- Não é um token.

Teorema fundamental de Leviathan, Kalman, Matias (ICML 2023): a distribuição de saída e a distribuição obtida diretamente a partir de um testeiro são totalmente iguais. Não é uma aproximação. É uma completa coincidência.

Fase 7 · Lição 16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

## 概念
### Não variação: amostragem de rejeição de Leviatã

Que`p(t)`Indicar em um prefixo abaixo rascunho para a distribuição do Token seguinte,`q(t)`Expressão de distribuição do verificador.`d ~ p` Em probabilidade `min(1, q(d) / p(d))` Acceptar  Se rejeitar,`(q - p)_+ / ||(q - p)_+||_1`O que é que é o que é?`q`  `p`Dois, isto é verdade; mais do que sempre rejeito, mas o resultado ainda é preciso.

- Não .`N`O segundo é o primeiro passo, usando um testador para frente.`prefix + d_1 + ... + d_N`❖ O verificador irá voltar ao mesmo tempo `q_1, q_2, ..., q_{N+1}` From left to right traversal                                                                                                                                                                                                                                                           `j`A primeira vez que rejeitei, desde`residual(q_j, p_j)`采样并停止──若全部接受,则从 `q_{N+1}`Como um símbolo de bônus.

### O que determina a aceleração

Que`α`Para cada Token projetado, a expectativa de aceitação é de:`c = cost(draft) / cost(verifier)`Por custo comparado.

```
E[accepted] = (1 - α^(N+1)) / (1 - α)
```

Cada recebimento de Token espera total tempo de parede é `(N * c + 1) / E[accepted]` Com relação `N`O melhor que se pode fazer é conseguir o melhor.`α = 0.8, c = 0.05`: 最优 `N`É aproximadamente 57, aceleração é de 3,2×...`α = 0.95, c = 0.02`: 最优 `N`É cerca de 810x10, aceleração aproximada de 5x.

O maior é o maior.`α`                                                                                                                                                                                                                                                              `N = 5`时, de `α = 0.6`(Draft de vavilha) 提升到 `α = 0.9`(EAGLE-3), permitirá que cada verificador avançar de expectativa de aceitação de Token número de 2.2 提升到4.1 ⋅ usando o mesmo verificador,吞吐几乎翻倍──

### A evolução de dois anos

**Vanilla speculative (Leviathan, 2023).**O modelo de projeto é um LLM de formação independente em uma mesma família.`α ≈ 0.6`É melhor que seja apenas 2x mais rápido.

**EAGLE-1 (Li et al., 2024).**Draft é um transformador de micro tipo, geralmente de uma a duas camadas, que usa o estado oculto da última camada do verificador como entrada e previsão direta do próximo Token.`α`Subiram para 0,7 0,8 

**EAGLE-2 (Li et al., 2024).**加入动态草案树:不是提出单条包含 `N`个 Token 的序列, em vez de apresentar um pequeno árvore candidata, usando um verificador de avanço (tree attention) para cada candidato, então, em seguida, avançar em direção ao caminho de probabilidade máxima.`α`Aumento de 0,85 ou mais.

**EAGLE-3 (Li et al., 2025, NeurIPS).**Também foram feitas duas alterações. Primeiro, eliminamos completamente a perda de características de previsão: EAGLE-1/2  treinamento Draft 去匹配验证器的隐藏状态, limitando os ganhos que mais dados podem trazer. Segundo, o teste de tempo de treinamento (TTT): durante o treinamento do projeto, considere o projeto de pré-ação como uma entrada de feedback para várias etapas posteriores, compatível com o modo de funcionamento durante a sugestão. Isso irá ajudar a distribuição de treinamento e teste, e impedir a acumulação de erros.

### Rolo de volta do cache KV

验证会在一次通过 中将验证器的 KV cache 扩展 `N`Se estiver em posição.`j`Se ocorrer rejeição, então posição.`j-1`后的缓存 内容就是错误的. 常见实现有两种:写入 scratch buffer 并在接受时提交 (vLLM、TensorRT-LLM), ou manter um cache KV físico加逻辑长度,并拒绝 截断.

Para a pesquisa de árvores EAGLE-2, o verificador usará uma máscara não causal de respeitar a expansão do árvore.

### Projetos de arquiteturas em 2026

| Strategy | Draft type | `α` | Speedup | Training cost |
|----------|-----------|-----|---------|---------------|
| Vanilla | 独立小型 LLM | 0.55-0.70 | 1.8-2.3× | 无（复用现有小模型） |
| Medusa | 验证器上的额外 LM heads | 0.65-0.75 | 2-3× | ~1B SFT tokens |
| EAGLE-1 | hidden states 上的 1-layer transformer | 0.70-0.80 | 2.5-3× | ~60B tokens |
| EAGLE-2 | EAGLE-1 + dynamic draft tree | 0.80-0.88 | 3-4× | ~60B tokens |
| EAGLE-3 | Multi-layer feature fusion + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B tokens |
| Lookahead | 无 draft（Jacobi iteration） | N/A | 1.3-1.6× | 无 |

2026 Year Production Environment: vLLM 和 SGLang 在可用时默认使用EAGLE-3,否则使用EAGLE-2──TensorRT-LLM 为 Meta 和 NVIDIA 公开模型提供最快的Medusa 路径──llama.cpp 为 CPU 部署提供香草草案──


```figure
l5-spec-decode-eagle
```

## Construí-lo
- Não .`code/main.py` Este é um ciclo especulativo Leviathan completo, contendo todas as componentes: rascunho de N  verificador e passagem de cada posição rejeição  amostragem residual  token de bônus  rollback de KV, bem como para verificar a distribuição de saída e de saída e de direita de`q`采样一致的经验检查──

### 步骤 1: Rejeitar regras

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### 步骤 2: distribuição residual

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### 步骤 3: um passo especulativo completo

`spec_step`Função de`p`projecto `N`- Sim, sim. - Sim, sim.`q`avaliação 中验证它们──它将对每一个草案 Token 应用拒绝规则,并在第一次拒绝时从残留中采样修正──如果全部接受,则从`q_{N+1}`输出一个奖金代币――

### 步骤 4: contabilidade de reviravolta de KV

O modelo vai para cada trabalhador.`kv_length`❖ Aceitar `k`个project 时,`kv_length += k`   `j`Quando a rejeição acontece, o caché já está escrito.`j`Mas a duração lógica será definida.`prefix_length + j + 1`, é o sinal de correção  后一个位置──后续读取将截截截至逻辑长度──

### 步骤 5: o cheque Leviathan

运行 50,000 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个`q`直接采样 50,000次进行比较──chi-quadrat 统计量应显著低于关键值──该定理在实践中成立──

### 步骤 6: aceleração vs. α

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `p`Para o seu desvio`q`, qualidade do esboço de esboço,`α`, e depois desenhar diferente .`α`和 `N`Próximo artigoO que é o projeto de um projeto de EAGLE-3`α ≈ 0.9`) como desbloquear cada testeiro de 45 Token

## Use-o
Utilize EAGLE-3 `vllm serve`- Não .

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

Em H100, no lote 64 usando o SGLang do EAGLE-3, de acordo com o papel EAGLE-3, em comparação com o lote-64, a descodificação de baunilha, a produção aumentou aproximadamente 1,38×。

适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适合使用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适用 适 的 适合 适用 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适 适    适 适 适  适 适 适 适     适 适 适 适 适    适 适   适 适    适 适     适     适 适   适             适 适     适                                                                        

- Qualquer latência p50 é mais importante do que o valor de consumo.
- 代码生成和结构化输出(JSON、SQL) ・・・因为 a distribuição de objetivos é altamente previsível,`α`Mais de 0,9...
- 长文本生成 ((数千 Token) 』摊销后的加速会持续收益──

Não adequado:

- 很小的模型(<3B) ――Draft 并不比验证器便宜太多──
- 极小批-1 CPU 部署──Draft model 內存开销可能不值得──
- Temperatura muito alta, por isso.`α`Vai cair.

## Entrega-o
本课会生成 `outputs/skill-eagle3-tuner.md` dar uma ideia de carga de trabalho (model, batch size, target latency, task profile), que irá sugerir estratégias e regulamentações especulativas para decodificar os projetos da família,`N`、profundidade da árvore 、conclusão de temperatura)

## 练习
1. 运行 `code/main.py` Confirmar que o chi-quadrado da análise de Leviathan permanece inferior a 95% do valor crítico em 50 000 amostras 

2. Em`α`Fixado em 0,9 且 `c`Fixação para 0,04 时,将 `N`De 1 扫描到10──绘制每次验证器调调期期望 Token 数和每个 Token 的实际墙时间──找出使墙时间 最小的 图`N`❖ Explicação de forma de curva

3. Modificar o código para a simulação da busca de árvores EAGLE-2: cada passo, projecto  forma proposta `[2, 2, 2]`O teste de probabilidade é de uma vez, a maior probabilidade é de uma vez.`α`E assim como a descodificação das especificações da cadeia linear em relação ao número de tokens utilizados em cada teste.

4. Para dois并发序列实现 lotados KV rollback 模拟器──sequência A todos os projetos são aceitos;sequência B em posição 2 拒绝── mostrar cada sequência de verdade `kv_length`Todos foram atualizados, e não há desperdício de trabalho.

5. 阅读EAGLE-3 paper's Section 4(Training-Time Test) ―― Usar duas palavras para explicar por que não há treinamento navio de projeto TTT vai sofrer de viés de exposição, bem como por que no treinamento colocar o projeto de sua própria previsão contra o que lhe dá a capacidade de reparar este problema―, em especial, com a literatura de amostragem programada no seq2seq 关联起来──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Leviathan rule | “min(1, q 除以 p)” | 以概率 `min(1, q(d)/p(d))` 进行 Bernoulli accept/reject；当 rejection 时从 residual 中采样，可精确保留验证器分布 |
| Residual distribution | “(q 减 p) 的正部，归一化” | `(q - p)_+` 在零处截断并重新归一化，是 rejection 时应采样的正确分布 |
| Acceptance rate α | “draft 对的频率” | 在拒绝规则下，每个 Token 的期望 Bernoulli 成功概率；支配所有加速数学 |
| EAGLE-1 | “hidden-state draft” | 条件化于验证器 last-layer hidden state 的微型 Transformer draft（Li et al., 2024） |
| EAGLE-2 | “dynamic draft tree” | EAGLE-1 加上一棵候选 continuation 树，并在一次验证器 pass 中用 tree attention 打分 |
| EAGLE-3 | “training-time test” | 去掉 feature-prediction loss，基于直接 Token prediction 训练，并在训练时把 draft 自己的输出反馈给它 |
| Training-time test (TTT) | “exposure bias 修复” | 训练时以 autoregressive 方式运行 draft，使训练和测试输入分布匹配，是 scheduled sampling 的直接类比 |
| KV rollback | “撤销被拒绝的 draft” | rejection 后将验证器 KV cache 重置到已接受 prefix 长度的 bookkeeping |
| Bonus token | “免费的那个” | 当全部 `N` 个 draft 都被接受时，以零额外验证器成本从 `q_{N+1}` 额外采样一个 Token |
| Tree attention | “一次验证许多候选” | 使用尊重 draft tree 拓扑的 non-causal mask 的 Attention；在一次 forward pass 中为树中的每个节点计算 `q_i` |

## 延伸阅读
- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) 基础论文与等价性定理
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318) Como o método proposto independentemente, prova clara
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) EAGLE-1, baseado em um projecto de condição de estado oculto
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) Busca dinâmica de árvores
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) 2026                                                                                                                                                                                                                                                             
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774) 另一种无草案 方法
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html)  覆盖所有策略  接入的权威生产参考
