# VLLM Servidores internos:Atendimento pagado, Batchamento contínuo, Preenchimento em pedaços

> O vLLM em 2026 dominava a configuração padrão de três superposições entre si, e não uma única técnica. Atensão Pagada 始终开启.Continuous batching 会在解码代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代`code/main.py`Um batcher contínuo de brinquedos, termina, ele vai ser como um vLLM, assim como um preenchimento e decodificação.

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**前置要求：**Fase 17 · 01 (Servidor de modelo), Fase 11 (Engenharia de licenciatura)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- 将 PagedAttention  Explicar para o alocador de cache KV: blocos ̇ tabelas de blocos, bem como por que a redução de fragmentos na carga de produção permanece em 4% abaixo:
- Em iteração 层面 draw out continuous batching: completos sequências 如何离开批次, novas sequências 如何加入,而不需要排水──
- Usar uma frase para descrever pre-reempimento em pedaços,并说出它保护的是哪个延迟度度度 () 提示:是TTFT tail,而不是平均吞吐量) 
- Dizer que 2026 vLLM v0.18.0 vai afetar aqueles que de uma vez em vez ativar todos os equipes de otimização de gotcha.

## 问题
O PyTorch serve um ciclo de uma vez executar uma solicitação: tokenize, prefill, decode até que o EOS retorne. Uma vez que um usuário está em um período de tempo, ele pode trabalhar. Quando há 100 usuários, ele é um grupo de pessoas que esperam pacientemente.

VLLM 同时解决三个问题──PagedAttention 阻止KV cache 碎片化像经典连续分配那样吃掉 60-80% de GPU memory──Continuous batching 允许 requisites 在每次解码反复中加入和离开批次,因此批次始终充满真实工作──Chunked prefill 32 将k-token prompt 拆成约512-token 的片片,并与解码交错执行,因此长速不结 GPU 上的每个解码代码代码符号──

O valor de produção de 2026 é o terceiro de todos os iniciais. Você precisa entender o papel de cada mecanismo, porque o modelo de fracasso está no cronograma, não no modelo.

## 概念
### PagedAttention  como sistema de memória virtual

Caché KV para cada sequência para dizer que é`num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element` Para 8192 tokens Llama 3.3 70B, em BF16 abaixo de cada sequência ≈ 1.25 GB.  Se você reservar 8192 slots por pedido, mas em média, apenas usar 1500 tokens, então você vai perder cerca de 82% de HBMs reservados.

PagedAttention 借借鉴了 OS virtual memory的思想──KV cache não é por sequência 连续存放的──它以固定大小的块 分配(默认16代币)──cada sequência tem uma tabela de blocos,将其逻辑代币位置映射到物理块 IDs──quando uma sequência 超过已分配的块 时,会再添加一个块──quando ela terminar, seus blocos 会返回池──

碎片化 from 60-80% (classical style) redução a 4% (以下) PagedAttention)  Você não vai passar por uma bandeira  Enable PagedAttention, é o único alocador que vLLM  fornece `--gpu-memory-utilization`(默认 0.9), diz que vLLM em carga pesos e ativas 后, para blocos KV 预留多少HBM──

### Iteração 层面的 Batchings contínuos

旧式 dynamic batching 会等一个窗口(例如10 ms) para preencher o lote, então executar prefill + decode + decode + decode, até que cada sequência 完成──快序列 会提前离开并置, enquanto a GPU 继续处理慢序列──

Batchamento contínuo em cada etapa de decodificação 之间运行──把正在运行的序列 集合称为 `RUNNING`Lista... em cada iteração.

1. `RUNNING`Qualquer sequência de tokens que atingir o EOS ou max_tokens será removida.
2. Se houver blocos de KV em branco, ele receberá novas sequências (preencher ou retomar)
3. Passagem para frente`RUNNING`Contato em cada sequência é emitido um novo token.

tamanho do lote  nunca será empolhado até um número fixo ∞`V1 scheduler` Key Invariant: Scheduler Cada iteração de decodificação 运行一次, em vez de cada solicitação 运行一次。

### Preenchimento em pedaços  proteger cauda TTFT

Prefill é computacional de ∙ Llama 3.3 70B 上的 32k-token prompt 在单张 H100 上需要约800 ms的纯预填──prefill 运行时,batch 中所有其他序列的解码代码代码都在等待──在服务循环中,长长提示的第一代码延迟(TTFT) vai se tornar em várias décadas de outros usuários inter-token latency(ITL) 动──

Preenchimento em pedaços irá preenchimento em pedaços de tamanho fixo (conhecido como 512 tokens), e em pedaço como unidade de regulação. Entre pedaços, o programador pode permitir que as sequências de decodificação avancem para um token. Você pode usar uma pequena quantidade de latencia absoluta de preenchimento.

### Três configurações padrão interagem

Estes três recursos são assumidos mutuamente existem. Atenção pagada para o cronista fornece um recurso de KV de pequena dimensão para pesar. Batch contínuo precisa de esse recurso de pequena dimensão, para que a nova sequência possa ser aceita.`RUNNING`A lista de decisões tomadas é apenas uma política de agendamento diferente, e não um sistema independente.

Você não precisa saber cada bandeira. Você precisa saber o cronograma.

### 2026 ano v0.18.0 的 gotcha

Em vLLM v0.18.0, você não pode ser `--enable-chunked-prefill`Com o desenho de modelo de descodificação especulativa`--speculative-model`O que não é verdade é que a resposta correta para o ano de 2016 é a EAGLE-3 e não usa preenchimento em pedaços, em vez de um modelo de projeto, além de um modelo de preenchimento em pedaços que não pode ser compilado.

### Você deve lembrar-se de números

- Llama 3.3 70B FP8, H100 SXM5,128 并发, 三者全开:2,200-2,400 tok/s。
- Sim, modelo,默认 vLLM ((( sem preenchimento em pedaços): ~ 1.800 tok/s。
- Assim como o modelo, simples PyTorch loop para frente: ~600 tok/s
- 生产负载下 PagedAttention 的 KV 碎片化浪费:<4%──
- 混合负载下 P99 ITL: usar preenchimento em pedaços 时 ~15 ms,不使用时 ~50 ms。

### cronógrafo de

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py`É o que acontece com o Python, usando falsos números de tokens e falsos avanços de latência.


```figure
tensor-parallel
```

## Use-o
`code/main.py`模拟一个vLLM风格的调节器,并带有可切换功能──运行它可以看:

- `NAIVE`Modo: Uma só vez, sem batches.
- `STATIC`modo: padding 并等待, classical batching──
- `CONTINUOUS`modo:iteration 级别的录取和释放──
- `CONTINUOUS + CHUNKED`modo:preencher 切片与 dekode 交错。

输出会展示总 throughput ((tokens por segundo virtual) 、TTFT mean 和 P99 ITL。`CONTINUOUS + CHUNKED`Esta linha deve ter vantagem no fluxo mixto.

## Entrega-o
本课会生成 `outputs/skill-vllm-scheduler-reader.md` dado uma configuração de serviço (( tamanho de lote  utilização de memória KV  tamanho de preenchimento em pedaços  configuração especulativa), ele gerará um diagnóstico de cronograma, apontando quais das três configurações em conformidade estão se tornando em engarrafamento, bem como o que devem ser modificados 

## 练习
1. 运行 `code/main.py`◊ em contendo requisições curtas e requisições longas de trabalho misturado 上比较 `STATIC`Com`CONTINUOUS`◊ diferença de produção  diferença de onde vem, é eficiência de preenchimento ‒ eficiência de decodificação, ou latência de cauda?
2. Modifique este cronograma de brinquedos, adicione.`--max-num-batched-tokens` Para o funcionamento Llama 3.3 70B FP8 H100, verdadeiramente取值是多少?
3. 重新阅读 vLLM v0.18.0 notas de lançamento.
4. 针对 1,000 个请求的追踪 计算 KV cache 碎片化浪费,平均 1,500 output tokens,std 600 tokens,分别在以下条件下:(a) 以 8192 max 进行连续每请求分配,(b) 使用16 token blocks 的 PagedAttention。
5. Usage ein段话 Explique por que prefill em pedaços ajuda P99 ITL, mas sozinho não aumenta o rendimento.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | “KV trick” | 用于 KV cache 的固定大小 block allocator；碎片化 <4% |
| Block table | “page table” | 每个 sequence 从 logical token position 到 physical KV block 的映射 |
| Continuous batching | “dynamic batching, but right” | 每个 decode iteration 都做 admit/release 决策 |
| Chunked prefill | “prefill splitting” | 将长 prefill 拆成 512-token 切片并与 decode 交错 |
| TTFT | “first token time” | Prefill + queue + network；在长 prompts 下由 prefill 主导 |
| ITL | “inter-token latency” | 连续 decode tokens 之间的时间；由 batch size 主导 |
| Goodput | “满足 SLO 的 throughput” | 每个 request 仍命中 TTFT 和 ITL targets 时的 tokens/sec |
| V1 scheduler | “new scheduler” | vLLM 的 2026 scheduler；N-gram spec decode 是与 chunked-prefill 兼容的路径 |
| `--gpu-memory-utilization` | “memory knob” | 在 weights 和 activations 之后为 KV blocks 预留的 HBM 比例 |

## 延伸阅读
- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) 关于 碎片预填与 兼容性的官方来源──
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) 2026 cadência de lançamento 和特定版本行为──
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) 仍然定义如何理解分配器 的原始文章──
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) 碎片化分析与时间表设计──
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) 带有火焰图的详细 V1 agendador passear através。
