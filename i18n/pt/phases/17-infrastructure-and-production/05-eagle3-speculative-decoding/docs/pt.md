# O processo de decodificação especulativa de EAGLE-3 no ambiente de produção

> A descodificação especulativa vai ser um modelo de projeto rápido com o modelo-alvo 配对──advertência  proposta K 个 Token;alvo em uma vez em frente 中验证; Token aceito é gratuito── até 2026, EAGLE-3 é uma variante de nível de produção, ele está em estados ocultos do modelo-alvo  ਸਿਖar o projeto cabeça, em vez de treinar no token original, para que na conversa geral a taxa de aceitação alfa 推至 0.6-0.8 区间──a verdadeira questão não é advertência  多快, mas  o meu fluxo alfa  é o que? Se for inferior a cerca de 0.55, em alta并发下, a descodificação especulativa se transformará em lucro líquido negativo, porque cada consumo de projeto rejeitado da segunda vez passará △                                                                                                                                                           

**类型：**- aprendizagem
**语言：**Python(stdlib, simulador de taxa de aceitação de brinquedos)
**先修要求：**Fase 17 · 04(vLLM Servings Internals),Fase 10 · 18(Predicção Multi-Token)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- Para explicar o desenvolvimento especulativo da descodificação, explico que o modelo de EAGLE-3 comparado ao EAGLE-2 e ao modelo clássico de projeto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
- definição taxa de aceitação alfa, baseada em alfa 和 K(longoura do projeto) calcular expectativa de aceleração,并识别目标并发下 break-even alpha。
- Explicar por que a descodificação especulativa em vLLM 2026 é opt-in (non-默认), e por que não medir alfa, em sua abertura é produzir contra o modo.
- 写出测量计划: Use 哪个基准"",哪种快速分布"",哪个同步点"",用哪个指标"作为上线门──

## 问题

Decodificar é compatível com a memória. Em uma operação Llama 3.3 70B FP8 H100, cada Token decodificado irá receber cerca de 140 GB/s de peso e emitir um Token.

A descodificação especulativa aproveitou essa diferença. Usou um modelo de projeto barato para produzir K 个候选标签, então o modelo-alvo em uma única passagem para a frente verificou todos os K 个.

经典草案模型 方法使用同一家族的更小模型(Llama 3.2 1B 为 Llama 3.3 70B起草案) ⋅它能工作,但接受率一般,因为更小模型的分布会偏离目标──EAGLE、EAGLE-2,再到EAGLE-3,直接在目标模型的内部状态上训练轻量草案头,因此草案的分布更紧跟目标──这就是为什么Alpha 会从草案模型的0.4 升级到EAGLE-3 的0.6-0.8──

关键限制:EAGLE-3 在 vLLM 2026 中是选择进.`speculative_config` Sem bandeira,  sem aceleração.  Se não estivermos a medir o fluxo real, a equipa abre-se diretamente, e verá a latência da cauda                                                                                                                                                                                                                                                                                                        

## 概念

### Descodagem especulativa  realmente traz que

没有规范解码 时,每个代币的成本是一次目标前进――使用草案长 K 和接受 alpha 的规范解码 时,每次目标前进的预期代币数是 时,每个目标前进的预期代币数是 时,每个代币的成本是一个目标前进的预期代码 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代码是 时,每个代币的预期代代代代代是 时,每个代币的预期代代代代代代是 时,每个代代代代代代代代代代代代是 时,`1 + K * alpha`Acelerar-se-á.`(1 + K * alpha) / (1 + epsilon)`, dos quais o epsilon é o custo de revisão de um projecto e de verificação.`(1 + 5*0.7) / (1 + 0.1) = 4.5 / 1.1 = 4.1x`◊ Os números do mundo real geralmente se concentram em 2-3x, porque o alfa do fluxo de produção  muito pouco  tão alto, e epsilon                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

### Por que o alfa é a única métrica importante

Os tokens rejeitados não desaparecerão, eles forçarão o primeiro token rejeitado a realizar o segundo alvo em frente. Em alfa  reduzir para 0,4 de carga de trabalho, você deve pagar o custo de revisão, bem como re-rollar.

Alpha 会随着工作负载变化. Em ShareGPT 风格的通用聊天天, com o treinamento ShareGPT 训练的EAGLE-3 能达到0.6-0.8──在域特定流量中,在通用数据训练的草案头会降至0.4-0.6──训练域特定草案头可以恢复 alfa;相比于目标细节调整,这是一个轻量、快速的训练任务──

### A ÁGuila 代际一览

- **经典 draft model**A estrutura é simples, carrega dois modelos, rascunha Cada vez que o alvo avança, K avança, K avança.
- **EAGLE-1（2024）**O objetivo é de um número de parâmetros em cima de um alvo.
- **EAGLE-2（2025）**O programa de programação é mais complexo que o programação de projetos.
- **EAGLE-3（2025-2026）**O que é que é o "desenvolvimento" de um grupo de pessoas?

### 2026 Cuadro de produção

1. Primeiro, de forma comum, modelo de meta de linha.
2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `speculative_config`Initiar o projecto EAGLE-3── re-lançar o referencial──
3. 记录 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率 率                                                                                                                                                                                                                                                                                                                                                                                                                                                                `spec_decode_metrics.accepted_tokens_per_request`除以要求草案长度 即可得到alpha
4. Se a distribuição de fluxo de produção 上 alpha < 0.55, desativar o código de especificações, ou treinar o projeto EAGLE-3 específico do domínio.
5. Em produção e desenvolvimento, re-carregação, confirmação P99 ITL  não mudou.

### 生产陷:P99 cauda

Descodificação de especificações 会降低 mean ITL──如果没有调优,P99可能变差──被拒绝的草案会触发两段式序列(草案 + verificar-fail + rollo)──在满批次下,这两次通过 会串行化──关注 P99 ITL,而不是 P50──

### A Águia-3 já está em destaque

O Google em 2025 AI Overviews implementou descodificação especulativa, a mesma qualidade, responder mais rápido.`speculative_config`Como documentar interface de lançamento;N-gram GPU de decodificação especulativa em V1 é兼容 fragmented prefill de variações;.SGLang 支持EAGLE-3,并将其作为前-heavy workloads 的推草案 path。

### Uma linha de equilíbrio matemático

预期加速:`S(alpha, K) = (1 + K*alpha) / (1 + verify_overhead)`- Não.`S = 1`- É um problema.`alpha_breakeven = verify_overhead / K` Para o típico verify_overhead ≈0,15 ≈ K=5:`alpha_breakeven = 0.03`▽ mas é o decodificador original 数学──在高并发下,verificar o overhead 会上升, enquanto o decodificador lot 已经在多个序列之间摊销记忆读, portanto, na prática, o válido alfa_breakeven 会爬升到约0.45-0.55──

### Não use descodificação especulativa

- Batch-1 离线生成,且延迟不重要──使用普通目标──
- 输出很短(低于50 Token) ――Draft overhead 和 verificação de custo 占主导。
- 没有领域-trained draft head 的专业领域──Alpha 太低──
- vLLM v0.18.0 加 desenho-modelo de especificações de decodificação 加 `--enable-chunked-prefill`◊ Este conjunto não pode ser compilado.


```figure
mx-speculative-tree
```

## Use-o

`code/main.py`会在一系列 alpha 值和草案长度 K 上模拟有无投机解码的解码循环──它会打印破-even alpha、测得的速度和尾行──在多个 (alpha, K) 组合上运行它,准确观察投机解码 在哪里不再划算──

## Entrega-o

本课产 出 `outputs/skill-eagle3-rollout.md` Dado modelo-alvo  distribuição de tráfego  descrição e objetivo de concurência, ele gerará o plano de implantação EAGLE-3 de fase: linha de referência  configuração habilitável  medida alfa  alfa >= 0,55  observação P99 ITL 

## 练习

1. 运行 `code/main.py`Quando o K é igual a 5, para conseguir 2x de aceleração, o que é que é preciso para acelerar 3x?
2. 假设生产流量由70%通用聊天、30%代码 组成──通用聊天在使用ShareGPT 训练的EAGLE-3 上达到alpha 0.7;代码 达到alpha 0.4──混合alpha 是多少?
3. 阅读 vLLM `speculative_config`文档──说出三种模式(drafts model、EAGLE、N-gram),以及哪一种兼容零碎预填──
4. Activar EAGLE-3  Depois você vê a média de ITL baixar 25%, mas P99 ITL subir 15%── diagnóstico e recomendação de medidas de alívio──
5. 計算 Llama 3.3 70B  EAGLE-3 Draft head memory cost.

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Speculative decoding | “draft plus verify” | 用便宜模型提出 K 个 Token，在一次 target forward 中验证全部 K 个 |
| Acceptance rate alpha | “spec accept rate” | draft Token 被 target 接受的比例；唯一重要的 metric |
| Draft length K | “spec k” | 每次 target forward 中 draft 提出的 Token 数；典型值 4-8 |
| Verify overhead epsilon | “spec overhead” | verify-and-reroll 相比普通 target forward 的额外成本；随 batch 增长 |
| EAGLE-3 | “latest EAGLE” | 2025-2026 变体；在多个 target layers 上训练 draft head；通用聊天上 alpha 0.6-0.8 |
| `speculative_config` | “vLLM spec config” | vLLM V1 中显式 opt-in；没有默认值就没有加速 |
| N-gram spec decode | “N-gram draft” | 使用 prompt 中 N-gram lookups 的 GPU-side draft；兼容 chunked-prefill |
| Break-even alpha | “no-op alpha” | spec decode 提供零加速时的 alpha；在生产并发下关注它 |
| Rejected-draft two-pass | “reroll cost” | drafts 被拒绝时发生两次 target forward；推高 P99 tail |

## 延伸阅读

- [vLLM — Speculative Decoding docs](https://docs.vllm.ai/en/latest/features/spec_decode/)- Não .`speculative_config`E V1 em pedaços preenchido
- [vLLM Speculative Config API](https://docs.vllm.ai/en/latest/api/vllm/config/speculative/) 精确字段集合──
- [EAGLE paper (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077) 原始 Eagle Draft-head 表述──
- [EAGLE-2 paper (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858) projetos adaptativos 和 árvores。
- [UC Berkeley EECS-2025-224](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2025/EECS-2025-224.html) Utilize o sistema de decodificação especulativa de LLM altamente eficaz。
- [BentoML — Speculative Decoding](https://bentoml.com/llm/inference-optimization/speculative-decoding) Lista de verificação de implantação de produtos
