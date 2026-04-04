@AGENTS.md

# Git Safety Rules — OBRIGATORIO

## Antes de criar PR ou merge
1. **SEMPRE** rebase na main mais recente: `git fetch origin && git rebase origin/main`
2. **NUNCA** fazer merge de branch que esta atras da main sem rebase
3. **VERIFICAR** com `git log --oneline origin/main..HEAD` que a branch so tem commits NOVOS
4. Se o diff mostrar deleção de arquivos que NÃO foram tocados na branch, **ABORTAR** — a branch esta desatualizada

## Fluxo de PR obrigatório
1. Agente faz as mudanças em branch separada
2. Rebase em `origin/main` (resolve conflitos se houver)
3. QA review agent roda nos arquivos alterados
4. Só cria PR se QA passa e rebase está limpo
5. **NUNCA** dar merge automático sem conferir o diff completo

## Proteção contra reversão acidental
- Antes de merge, verificar: `git diff origin/main..branch --stat` — se deletar arquivos que não deveriam ser deletados, **NÃO FAZER MERGE**
- Branches auto-* (auto-qa, auto-dev) DEVEM ser rebaseadas antes de qualquer PR
