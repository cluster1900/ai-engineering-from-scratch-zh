# Sécurité  Secrets API Key 轮换 审计日志 防护仪

> 通過集中式 vault(HashiCorp Vault、AWS Secrets Manager、Azure Key Vault) Eliminer Secrets 蔓延──绝不要把凭证存放在配置文件、VCS 中的 env files、spreadsheets 里──优先使用IAM 角色,而不是静态密钥;CI/CD 使用OIDC──AI-gateway 模式是2026年关系的解决方案:applications → gateway → model provider,gateway 在行行时从 vault 拉取证──在库中轮换后,所有applications 会在几分钟内获取更新,不需要部署,也不需要在 Slack里有新承诺──使用ROTation policy ≤90 days;每次都在使用TrumpleHog /GBAG /GBAP 扫描网址:Vero-OFF C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C:C`api.openai.com`- Je suis là.`api.anthropic.com`Également, la répression de la crise de la chaîne d'approvisionnement a entraîné la répression de la situation de la chaîne d'approvisionnement de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de la chaîne de répartition de répartition de la chaîne de répartition de répartition de la chaîne de répartition de répartition de la chaîne de répartition de répartition de la

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 列举四种秘密管理反模式(VCS config files,hardcoded env,spreadsheets,static keys),并说出它们的替代方案──
- Expliquer l'IA-gateway-pulls-from-vault motif Pourquoi est-ce que 2026 est la norme de production
- 实现一个带一致的标记化 (consolidation de la même valeur → même placeholder) de PII scrubber,让语义得以保留──
- Découvrez l'incident de la chaîne d'approvisionnement de Vercel en 2026, ainsi que ses enseignements sur l'hygiène des certificats CI/CD.

##  problématique
Un apprenti a soumis des clés API.`.env` Ils ont rapidement supprimé le fichier. Mais ces clés sont déjà dans l'historique de la version git.  GitGuardian scan l'a capturé, et votre processus de rotation est en Slack. 通知团队.  mettre à jour 40 fichiers de configuration.  redéployer tous les services.  8 heures plus tard, la moitié des services sont en ligne.

En outre, les demandes d'utilisateur contiennent mon nom de domaine est 123-45-6789.

En outre, dans votre cluster EKS, vous pouvez accéder à n'importe quel hôte Internet. Quelqu'un peut parcourir une recherche DNS et expiler les données dans un domaine contrôlé par l'attaquant.

La sécurité des services de MLL 必须处理这三类矢量──Vault-backed credentials──PII scrubbing──Network exit filtration──Audit logs──

## 概念
### 集中式 vault + tirage du rôle IAM

**Vault**: HashiCorp Vault, gestionnaire de secrets AWS, Azure Key Vault, gestionnaire secret GCP, et le même nom.

**IAM role**: app/gateway  via son identité IAM  effectuer la vérification, plutôt que la clé statique―Vault dans le jeton  cycle de vie  return secret―

**The AI-gateway pattern**: passerelle dans la demande à partir de la caisse 拉取 `OPENAI_API_KEY` Dans la coffre-fort, la prochaine fois que vous demandez de la clé, vous n'avez pas besoin de la redéployer.

### Politique de rotation ≤ 90 jours

Toutes les clés API, les jetons racines de la voûte, les identifiants CI/CD, la rotation automatique, la rotation manuelle, la mise en place de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, la mise en œuvre de données, etc.

### Scanner secret

- **TruffleHog** À l'égard des engagements faites régex + entropie 检测。
- **GitGuardian** commercial, taux de réussite élevé
- **Gitleaks** OSS, dans le centre de la CI

Chaque fois que tu fais ça, tu fais comme tu veux.

### Poise de confiance zéro

- Tous les comptes doivent être activés.
- 通过 SAML/OIDC 使用 SSO。
- RBAC (basé sur le rôle) ou ABAC (basé sur les attributs) pour l'accès aux grains fins
- Les jetons de courte durée ((以小时计,而不是天) ⋅
- La posture de l'appareil   permet uniquement d'activer le cryptage du disque de ses appareils corporels。

### PII / PHI de détergition

Dans l' ordre de votre infra:

1. Reconnaissance de l'entité (space NER, présidio, commercial)
2. 屏蔽匹配到的实体:`"My SSN is 123-45-6789"`- Je suis là.`"My SSN is [SSN_TOKEN_A3F]"`Il y a une autre.
3. Tokenization cohérente: la même valeur 映射到同一位holder,让LLM保留关系──
4. 可选: faire une cartographie inverse de la réponse à la LLM.

Les filtres de régex statiques peuvent capturer les schémas de base; le NER peut capturer davantage.

### Gardiens d'entrée + sortie

Input: bloquer les jailbreaks déjà connus, les sujets interdits, faire selon l'utilisateur, le taux de limite.

Résultats: usufruit de régex scrub  divulgation des secrets(patterns clés API、contexts de refus, des schémas de courrier électronique), usufruit de classifiant 检测 policy violations。

### Liste blanche des sorties de réseau

Services de MLL 位于 sous-réseau spécialisé:
- Liste blanche:`api.openai.com`- Je suis là.`api.anthropic.com`、 points d'extrémité de vecteur DB 、 points d'extrémité de voûte。
- Tout le reste: goutte à goutte.
- DNS 通过 permission-only resolver (éviter l'exfil)

### Registre d'audit

Chaque appel de LLM est un journal immutable, comprenant:
- Une timestamp.
- Utilisateur / locataire
- Rapidement hashé pour la vie privée, pas enregistré le prompt brut)
- Modèle + version
- Les jetons comptent.
- Coût:
- Réponse hash.
- Toutes les sorties de garde-corps.

按法规要求保留(SOC 2 1 an,HIPAA 6 ans)

### L'incident de Vercel de 2026

Attaque de la chaîne d'approvisionnement: les informations d'identification CI/CD sont attaquées  ont été divulguées par des milliers de déploiements de clients                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

### Tu devrais te rappeler le nombre

- Politique de rotation:≤ 90 jours¬
- Chaque fois que vous avez fait une commande, vous avez fait une commande.
- Vercel 2026:CI/CD 凭据被泄露 → 数千个客户环境 泄露
- Rétention du journal d'audit: SOC 2 = 1 an, HIPAA = 6 ans。


```figure
i4-vault-rotation
```

## Utilisez-le
`code/main.py`¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢¢

## Je le livre.
本课生成 `outputs/skill-llm-security-plan.md` En fonction du champ réglementaire et de l'état actuel, la migration des coffres-forts est planifiée, le coffre-fort est déployé, l'entrée est réalisée, le journal de vérification est réalisé.

## 练习
1. 运行  référencement`code/main.py` Envoyer deux citations du même SSN  Confirmer que les deux ont le même place.
2. Pour mettre en œuvre le déploiement vLLM-on-EKS d'OpenAI + Anthropic + Weaviate  concevoir une politique d'exode réseau―
3. Vous avez trouvé une clé dans l'histoire de la git.
4. Votre journal d'audit chaque jour augmente de 10 Go.
5. 论证 inverse-tokenization (把真实值替换回 LLM response) est-elle digne de sa complexité, ou bien elle permet aux titulaires de place de voir mieux ?

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
- [Microsoft Presidio](https://github.com/microsoft/presidio) Détection et anonymisation des informations personnelles 
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
