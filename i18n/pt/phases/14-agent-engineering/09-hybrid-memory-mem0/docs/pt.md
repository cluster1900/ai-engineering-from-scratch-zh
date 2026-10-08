# Memória híbrida: Vector + Graphic + KV (Mem0)

> Mem0 (Chhikara et al., 2025) vai considerar a memória como três conjuntos de armazenamento: vetor usado para linguagem semelhante, KV usado para rápida busca de fatos, gráfico usado para a teoria de relações físicas.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- 解释为什么单一存储(仅 Vector、仅 Graph、仅 KV) não é suficiente para suportar o agente 记忆──
- Explicar os três objetivos de memória em linha de armazenamento, bem como o objetivo de optimização de cada armazenamento.
- 描述 Mem0的融合评分:相关性、重要性、近期性,并解释为什么它是加权和,而不是层级结构──
- Usando o seu tempo, conseguimos um tipo de memória de brinquedo.`add()`- Não, não.`search()`融合結果──

## 问题
Para uma categoria de três tipos de consultas, um único armazém geralmente é o seguinte:

- **语义相似性**                                                                                                                                                                                                                                                              
- **事实查找**   用户的电话号码是什么? KV 胜出; Vêctor 浪费资源,Graph 过于复杂──
- **关系推理**   quais clientes compartilham a mesma entidade de faturamento? Gráfico 胜出; Vector 和 KV 无法回答──

Os agentes do ambiente de produção vão emitir todas as três categorias de consultas numa mesma sessão.`add`- Não .`search`表面后,并用评分函数融合它们──

## 概念
### Três operações de armazenamento

Mem0 (arXiv:2504.19413, Abril 2025)`add(text, user_id, metadata)`时:

1. A partir do texto "Integração de candidatos" (http://www.integração.com/index.php?title=LLL_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M_M
2. 将每个事实写入 Vector store (embutida em vector), para uso de语义搜索──
3. Para o uso de um sistema de verificação, o sistema de verificação deve ser executado em um sistema de verificação.
4. Para cada fato como bordas digitais 写入 Graph store (Mem0g), para consulta de relacionamento

Em`search(query, user_id)`时:

1. Localização de vetores 按 Embedding cosine 返回 top-k。
2. KV store 返回基于查询派生的 (user_id, type, entity) key 的直接命中──
3. Loja de gráficos  Retorno de um objeto de consulta ao subgrafo de acesso
4. Uma avaliação de nível de integração.

### Ponto de pontuação de fusão

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性** Vêtor cosino KV 精确匹配 图路重──
- **重要性** Durante a sua escrita, você pode ler ou ler o seu nome (nome, identidade, política).
- **近期性**                                                                                                                                                                                                                                                              

权重按产品调优──聊天代理 使用更高的 `w_recency`; agências de regulação  使用更高的`w_importance`; agentes de controlo 使用更高的 `w_relevance`- Não.

### Mem0g e raciocínio temporal

Mem0g  aumentou o conflict tester. Quando novos fatos e contradições existem, as existências serão marcadas como inválidas, mas não serão eliminadas.

É o padrão de invalidação da Letta, que se generaliza em conformidade com os padrões de comportamento.

### Números de referência

Mem0 paper 报告了以下结果(2025):

- **LoCoMo**(长篇对话记忆): 91.6
- **LongMemEval**(长时间跨度 episódico memória): 93.4
- **BEAM 1M**(M-token 记忆 benchmark): 64,1

Comparado com as linhas de base, o conteúdo total de 128k LLM, loja de vetores planos KV) está atrasado em 10+ 分── apenas com base em referência, não pode provar que a seleção é razoável, o modo de funcionamento é o que é essencial, mas estas indicações digitais não são errores de design.

### Taxonomia de âmbito

Mem0 按范围 划分记忆:

- **用户记忆** 跨会议 持久化,以 `user_id`É a chave.
- **Session 记忆** Em um fio dentro de perpetuidade
- **Agent 记忆** Estado de cada instância de agente

Cada vez que escrever, você escolhe um escopo. A pesquisa pode ser feita com o peso de cada escopo.

### Este é um lugar fácil de sair

- **Embedding drift.**Vector  Resultados em 100 pesquisas anteriores parecem corretos, mas irão com o corpus  crescimento e decadência     para os registros mais utilizados   adição re-embedding periódico   
- **KV schema creep.** `(user_id, type, entity)`Parece simples, até que cada equipa se junte a si mesma.`type`◊ Tipo de auditoria por trimestre 集合。
- **Graph explosion.**Um extrutor de ruído por mensagem adicionar 50 bordas...`add`调用图 写入数;丢弃低置信度 edges──


```figure
ae-memory-fusion
```

## Construí-lo
`code/main.py`Utilizando o modo de armazenamento:

- `VectorStore` Usar simples semelhança de token-overlapping 作为 Embedding 替代.
- `KVStore` 以 `(user_id, fact_type, entity)`Por isso, é importante.
- `GraphStore` bordas tipografadas ((subjeto, relação, objeto, válido)
- `Mem0` 顶层 facade,包含 `add()`- Não.`search()`、Ponto de pontuação da fusão 和 recuperação consciente do alcance
- Uma sessão multi-usuário para rastrear a conversa completa.

运行:

```
python3 code/main.py
```

输出会显示三条独立回忆路,以及融合后的顶-k――修改 `main()`Peso de pontuação do topo, observe como a classificação muda.

## Use-o
- **Mem0 (Apache 2.0)** 生产就绪──可用 Postgres + Qdrant + Neo4j 自托管, também可使用管理云──
- **Letta** Três níveis de núcleo/recall/arquivo;自带 Vector 和 Graph backends。
- **Zep** 商业替代方案,带时代KG 和 fact extraction──
- **Custom builds** Quando você precisa de um extorque ou peso de fusão (ou peso de fusão) (ou controle preciso)

## Entrega-o
`outputs/skill-hybrid-memory.md`Será gerado um esquadrão de memória de três armazéns, entre os quais se juntam o marcador de fusão, a taxonomia do escopo e a invalidação temporal.

## 练习
1. O que é que é o "conjunto de conversas" de um grupo de músicos?
2. 添加时间查询:`search(query, as_of=timestamp)` Retorna apenas registros válidos no momento ou antes.
3. 实现冲突检测器:如果传入事实与图边 矛盾,无效 旧边,并同时记录两者──在 user vive em Berlim -> user vive em Lisboa 上测试──
4. 扩展 fusão pontuação,加入 `user_feedback`维度(对检索记录点赞) ――你怎么防止游戏(agente só retornará aos registros que já gostava)?
5. 阅读 Mem0 docs (`docs.mem0.ai`O papel de um jogador é o de um jogador.`mem0`As chamadas dos clientes foram feitas em 20 testes comparados.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hybrid memory | “Vector plus graph plus KV” | 三个并行写入的存储，在检索时融合 |
| Fact extraction | “Memory ingestion” | 将文本拆解为 (entity, relation, fact) tuples 的 LLM 步骤 |
| Fusion scoring | “Relevance ranking” | 相关性、重要性、近期性的加权和 |
| Scope | “Memory namespace” | user / session / agent，决定谁能看到什么 |
| Mem0g | “Memory graph” | 带时间有效性的 typed edges，用于关系查询 |
| Temporal invalidation | “Soft delete” | 将矛盾 edges 标记为 invalid；绝不删除 |
| Embedding drift | “Retrieval rot” | Vector 质量随 corpus 增长而下降；周期性 re-embed |

## 延伸阅读
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) Papel original
- [Mem0 docs](https://docs.mem0.ai/platform/overview) Produtos de API ̊ SDKs ̊ nuvem gerenciada
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560) contexto virtual 前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) Design de irmãos de três níveis
