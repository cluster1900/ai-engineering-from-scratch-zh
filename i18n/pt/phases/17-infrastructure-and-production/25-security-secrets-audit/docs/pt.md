# Segurança  Segredos API Chave 轮换 审核日志 防护

> 通過集中式 vault(HashiCorp Vault、AWS Secrets Manager、Azure Key Vault) eliminar Secrets 蔓延──绝不要把凭证存放在配置文件、VCS 中的env files、spreadsheets 里──优先使用IAM 角色,而不是静态密钥;CI/CD 使用OIDC──AI-gateway 模式是2026年关系的解决方案:apps → gateway → model provider,gateway 在行行时从 vault 拉取证──在库中轮换后,所有应用程序会在几分钟内获取更新,也不需要部署,也不需要在 Slack里里有新承诺──使用转换政策 ≤90天;每次都都都都都都都都都都都都都都都都特鲁夫特鲁夫特鲁格 /GBAGBA /PCP 扫描VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`api.openai.com`- Não.`api.anthropic.com`Para impedir todas as outras saídas. Factos de 2026: Ataque de cadeia de suprimentos de Versace, através de credenciais de CI / CD que foram invadidas, divulgou milhares de implantações de clientes.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种秘密管理反模式 (Anti-patterns) 列举四种类型:
- Explicar o padrão de tiragem de abóbora por AI-gateway-from-vault.
- 实现一个带一致的标记化 (consequente tokenização) do PII scrubber,让语义得以保留──
- Explicar o incidente da cadeia de suprimentos Vercel de 2026, bem como a sua formação sobre a higiene de credenciais CI/CD.

## 问题
Um aprendiz enviou-lhe as chaves da API.`.env` Eles rapidamente o apagaram.  Mas estas chaves  já entraram no histórico da git.  GitGuardian scan  capturou, e seu processo de rotação está  no Slack   notificar a equipe  atualizar 40 arquivos de configuração  redistribuir todos os serviços  8 horas depois, metade dos serviços  já está online, a outra metade ainda está esperando para implantar janelas 

Além disso, as instruções do usuário contêm o meu SSN é 123-45-6789.

Além disso, o pod de LLM do seu cluster EKS pode acessar qualquer host de internet. Alguém pode fazer uma pesquisa DNS e exfilhar os dados para um domínio controlado pelo atacante.

A segurança dos serviços de LLM  deve tratar esta categoria de vetores── credenciais apoiadas em cofres―pII esfregar―filtragem de saída de rede―registros de auditoria―

## 概念
### 集中式 vault + IAM-role pull

**Vault**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager。单一事实来源。

**IAM role**O aplicativo / portal  através de sua identidade IAM  realizar a certificação, em vez de chave estática  Vault   token  vida ciclo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

**The AI-gateway pattern**Portais em busca de segurança`OPENAI_API_KEY`在库中轮换; 下一次请求拿到新钥匙──无需重新配置──

### Política de rotação ≤ 90 dias

Todas as chaves API, tokens raiz de cofre, credenciais de CI/CD, como possível rotação automática, rotação manual, registros e seguimento.

### Escanagem secreta

- **TruffleHog** 对 commits fazer regex + entropia 检测。
- **GitGuardian** comercial, 准确率高──
- **Gitleaks** OSS, em CI-Centre

Cada vez que o comprometo é feito, se o novo segredo for detectado, vamos parar a PR.

### Posição de confiança zero

- Todas as contas devem ser ativadas.
- 通過 SAML/OIDC 使用 SSO。
- RBAC (basado em funções) ou ABAC (basado em atributos) para acesso a grãos finos.
- Tokens de curta duração ((以小时计, em vez de 天) ⋅
- Posição do dispositivo   permitem apenas ativar a criptografia de disco de dispositivos corporais。

### Esfriamento PII/PHI

Em seguida , deixe sua infra .

1. Reconhecimento das entidades (spacy NER、Presidio、comercial)
2. 屏蔽匹配到的实体:`"My SSN is 123-45-6789"`→ `"My SSN is [SSN_TOKEN_A3F]"`- Não.
3. Tokenization consistente (approche Mesh):o mesmo valor 映射到同一位holder,让LLM保留关系──
4. 可选: fazer um mapeamento reverso da resposta do LLM.

Filtros de regex estáticos 能捕获基本模式; NER 能捕获更多──两者都用──

### Proteção de entrada + saída

Input: impedir já conhecidos jailbreaks, tópicos proibidos, fazer limite de taxa de usuário.

Resultado: us regex scrub  divulgação de segredos(patrões de chave da API、contextos de recusa em meio a padrões de e-mail), us classificador 检测 policy violations。

### Lista branca de saída da rede

Serviços de LLM 位于 especializada sub-rede:
- Lista branca:`api.openai.com`- Não.`api.anthropic.com`、 pontos finais de DB vetorial 、 pontos finais de bóveda。
- - O que é que é?
- DNS                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

### Registo de auditoria

Cada chamada de LLM de registro imutável, contém:
- - O tempo.
- Utilizador / inquilino。
- Rapido hash (((para privacidade, não registar rapido bruto)
- Modelo + versão:
- Os tokens contam.
- Custo:
- Resposta hash.
- Qualquer viagem de guarda-roupa.

按法规保留(SOC 2 1 ano,HIPAA 6 anos)

### O incidente de Vercel de 2026

Ataque de cadeia de suprimentos: foram invadidas credenciais CI/CD  vazadas milhares de implantações de clientes   formação: credenciais CI/CD 等同于产品──存入库──缩小范围──积极旋转──

### Você deve lembrar-se de números

- Política de rotação:≤ 90 dias¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Cada vez mais com o "TruffleHog" / "GitGuardian" / "Gitleaks"
- Vercel 2026:CI/CD 凭据被泄露 → 数千个客户环境 泄露──
- Retenção do registro de auditoria: SOC 2 = 1 ano, HIPAA = 6 anos。


```figure
i4-vault-rotation
```

## Use-o
`code/main.py`实现 um borrador de PII de brinquedos com tokenização consistente, bem como um log de auditoria somente apêndice.

## Entrega-o
本课生成 `outputs/skill-llm-security-plan.md` De acordo com o âmbito regulamentar e o estado actual, a migração de cofre de planeamento, o scrubber, a entrada e o registro de auditoria

## 练习
1. 运行 `code/main.py` Enviar duas citações do mesmo SSN.
2. Para utilizar a implementação de OpenAI + Anthropic + Weaviate vLLM-on-EKS  desenhar a política de saída da rede―
3. Você encontrou uma chave no livro de história.
4. Seu registro de auditoria Cada dia aumenta 10 GB.
5. 论证 reverse-tokenization (把真实值替换回 LLM response) é que vale a pena a sua complexidade, ou faz os titulares de lugares ver melhor.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Vault | "secrets store" | 集中式 credential management service |
| IAM role | "identity-based auth" | app assume 的 role；返回 short-lived creds |
| OIDC for CI/CD | "cloud-issued tokens" | CI 中没有 static keys — 通过 OIDC 建立 identity |
| TruffleHog / GitGuardian / Gitleaks | "secret scanners" | commit-time secret detection |
| RBAC / ABAC | "access control" | Role-based vs attribute-based |
| PII scrubbing | "data masking" | 移除敏感 entities 或对其 tokenization |
| Consistent tokenization | "stable placeholders" | Same value → same token each time |
| Mesh approach | "Mesh tokenization" | 保留语义的 tokenization pattern |
| Egress whitelist | "outbound allowlist" | 只有允许的 domains 可访问 |
| Audit log | "immutable history" | 用于 compliance 的 append-only record |

## 延伸阅读
- [Doppler — Advanced LLM Security](https://www.doppler.com/blog/advanced-llm-security)
- [Portkey — Manage LLM API keys with secret references](https://portkey.ai/blog/secret-references-ai-api-key-management/)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [JumpServer — Secrets Management Best Practices 2026](https://www.jumpserver.com/blog/secret-management-best-practices-2026)
- [Microsoft Presidio](https://github.com/microsoft/presidio) Detecção e anonimização de PII。
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
