# Easypanel: base + UI (HelpDesk At-Once-AI)

## Servicios

| Servicio | Rol | UP 24/7 | Source |
|----------|-----|---------|--------|
| `trudesk-db` | Mongo | Sí | (existente) |
| `trudesk-base` | Build local opcional / referencia | **Stop** | Github → `Dockerfile.base` |
| `trudesk` | HelpDesk usuarios | Sí | Github → `Dockerfile` (UI sobre GHCR) |

## Imagen base en GitHub Packages (GHCR)

- Imagen: `ghcr.io/mcandiav/trudesk-custom-base:latest`
- Se publica con Actions: **Publish trudesk-base (GHCR)**
- Primera vez: Actions → ese workflow → **Run workflow**
- Luego: en GitHub → Packages → el paquete → **Change visibility** a **Public** (para que Easypanel pueda hacer `FROM` sin login)

## Archivos Docker

| Archivo | Uso |
|---------|-----|
| `Dockerfile` | Build completo (activo hoy en `trudesk`) |
| `Dockerfile.ui` | Deploy UI sobre GHCR (**activar después** de publicar la base) |
| `Dockerfile.base` | Lógica (Action GHCR + servicio `trudesk-base`) |
| `Dockerfile.full` | Copia de respaldo del build monolítico |

## Orden operativo

1. Base publicada en GHCR (workflow OK).
2. Paquete GHCR en **Public**.
3. Servicio `trudesk` → Build File = **`Dockerfile.ui`** (cambiar desde `Dockerfile`).
4. Deploy `trudesk` → debe ser corto (sin yarn/webpack).
5. `trudesk-base` en Easypanel permanece en **Stop**.

## Emergencia

Si el deploy UI falla al bajar la base, en Easypanel `trudesk` → Build File = `Dockerfile` o `Dockerfile.full`.
