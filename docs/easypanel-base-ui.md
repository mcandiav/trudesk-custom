# Servicios Easypanel — modelo base + UI

## Servicios

| Servicio | Rol | ¿UP 24/7? | Source |
|----------|-----|-----------|--------|
| `trudesk-db` | MongoDB | Sí | (ya existe) |
| `trudesk` | HelpDesk usuarios | Sí | Github → `Dockerfile` (completo, por ahora) |
| `trudesk-base` | Imagen lógica (fork) | **No** (Stop tras build) | Github → `Dockerfile.base` |

## Dónde se “declara” la base

No hay campo Base en Source/Branch/Build path.

La base es **otro App** en el mismo proyecto, llamado `trudesk-base`, con:

- Repository: `mcandiav/trudesk-custom`
- Branch: `master`
- Build path: `/`
- Build: Dockerfile
- File: `Dockerfile.base`

## Orden de trabajo

1. Crear servicio `trudesk-base` y hacer **un** Deploy (build largo, una vez).
2. **Stop** `trudesk-base` (no dejarlo corriendo).
3. Más adelante: publicar esa imagen / cablear `trudesk` para que el deploy diario solo copie UI.

Hasta el paso 3, `trudesk` sigue igual (build completo). Crear la base **no** acelera aún el HelpDesk; prepara el modelo.

## Qué va en cada capa (alcance)

**Base (lógica — raro tocar):** controllers, API, webhook n8n, React/`src/client`, deps, webpack.

**UI (día a día):** `public/css`, `public/img`, `public/atonce`, `src/views/*.hbs`, templates mail visuales, `VERSION` / badge.
