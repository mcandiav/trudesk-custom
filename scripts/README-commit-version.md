# Commits y deploy HelpDesk At-Once-AI (Easypanel)

## Formato obligatorio del asunto

EasyPanel copia el asunto del commit en **Deployment History**. Debe ser:

```text
[V1.2.12@abc1234] fix: descripcion breve
```

- Prefijo `[V{VERSION}@{hash}]` = `VERSION_APP@HASH_GIT`
- Misma identidad que el badge de la UI

## Cómo commitear (no inventar el asunto a mano)

1. `git add` de los archivos del cambio
2. Ejecutar:

```powershell
.\scripts\commit-version.ps1 -Version "1.2.12" -Message "fix: descripcion breve"
```

3. `git push origin HEAD` (dispara webhook)

El script actualiza `VERSION`, `package.json`, `.git-commit` y genera el asunto correcto.
