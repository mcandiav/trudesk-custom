# Runbook: HelpDesk At-Once-AI en Easypanel (reconstruir desde cero)

Documento operativo del fork **Trudesk-custom** (producto: **HelpDesk At-Once-AI**).  
Objetivo: poder levantar o recuperar el entorno sin depender de memoria oral.

| Campo | Valor |
|--------|--------|
| Repo GitHub | `https://github.com/mcandiav/trudesk-custom` |
| Branch de despliegue | `master` |
| URL producción (referencia) | `https://ticket.at-once.cl` |
| Proyecto Easypanel (referencia) | `n8n` (mismo proyecto que `trudesk` / `trudesk-db`) |
| Imagen base GHCR | `ghcr.io/mcandiav/trudesk-custom-base` |
| Tags GHCR | `:latest` y `:{VERSION}` (archivo `VERSION` del repo) |
| Upstream original | `polonel/trudesk` (solo referencia; **no** usar su imagen como base del fork) |
| Puerto contenedor app | `8118` (`EXPOSE 8118` en Dockerfiles) |
| Producto UI | HelpDesk At-Once-AI |
| Badge versión | `VERSION_APP@HASH_GIT` (ej. `1.2.18@9c3dfec`) — login + banner `.chrono-brand` |

---

## 0. Historia del despliegue At-Once (cómo llegamos aquí)

Útil si hay que repetir la migración o explicar el estado actual.

1. **Origen:** se instaló Trudesk en Easypanel con el **template** oficial. Eso creó **dos** servicios: `trudesk` + `trudesk-db` dentro del proyecto `n8n`.
2. **App inicial:** Source = **Docker Image** `polonel/trudesk:1.2.11` (no el fork).
3. **Migración al fork:** se cambió **la misma** app `trudesk` a Source **Github** `mcandiav/trudesk-custom` / `master` / Build Path `/` / File `Dockerfile`. **No** se creó otro template ni otra Mongo. Las env (`TD_MONGODB_URI`, etc.) se mantuvieron.
4. **Primer build desde GitHub:** ~14 minutos (yarn + native + webpack). Deploy vía botón y luego **webhook** de GitHub en push a `master`.
5. **Branding:** look & feel At-Once; forzar colores en build SASS porque el tema legacy en Mongo sobrescribía la app; badge `VERSION@hash`.
6. **Lógica custom:** webhook n8n en `ticket.created` (`TD_N8N_*`).
7. **Optimización Docker:** BuildKit cache mounts Yarn Berry (fetch mucho más corto; link/native siguen caros).
8. **i18n `/newissue`:** JS en `public/atonce/` (no en `public/js/` — rimraf del webpack); banderas SVG Identidad V1.3 opción D.
9. **Arquitectura base+UI:** `Dockerfile.base` + GHCR + `Dockerfile.ui`; App Easypanel `trudesk-base` (Stop); `trudesk` File = `Dockerfile.ui`.

**Lección clave:** un Deploy desde GitHub **no** vuelve a crear el template (app+DB). Solo reconstruye la app configurada. La DB ya existente se reutiliza.

---

## 1. Idea de arquitectura (por qué hay “base”)

El fork **casi no cambia lógica**. Se cambia **look & feel** (CSS, vistas Handlebars, logos, i18n de `/newissue`, plantillas de mail visuales).

Un build monolítico de Trudesk es caro:

- Yarn Berry (a veces doble install)
- Compilación nativa (`bcrypt`, `node-sass`)
- `grunt` + `webpack` (incluye React del panel)

Por eso el modelo:

```
trudesk-base (imagen lógica, rara vez)  →  publicada en GHCR
trudesk      (app usuarios)             →  FROM esa imagen + solo archivos UI
trudesk-db   (MongoDB)                  →  datos persistentes
```

Analogía: la base es el pastel completo; `trudesk` solo cambia la cobertura (UI).

**Importante:** en Easypanel **no existe** un campo “Base” en Source/Branch/Build path.  
La “base” es:

1. Un **segundo App** opcional (`trudesk-base`) y/o  
2. La **imagen en GHCR** que el `Dockerfile.ui` usa con `FROM`.

Sin publicar en GHCR, el servicio `trudesk` **no puede** “usar” al otro servicio solo con un combo de la UI.

---

## 2. Servicios en Easypanel (los tres)

| Nombre servicio | Rol | ¿UP 24/7? | Source |
|-----------------|-----|-----------|--------|
| `trudesk-db` | MongoDB | **Sí** | Imagen Mongo / template |
| `trudesk` | HelpDesk (usuarios) | **Sí** | Github → **`Dockerfile.ui`** |
| `trudesk-base` | Build de referencia / opcional | **No** (dejar en **Stop**) | Github → **`Dockerfile.base`** |

### 2.1 `trudesk-db`

- Guarda tickets, usuarios, settings, tema Appearance (Mongo).
- **Nunca** recrear a la ligera si hay datos de producción.
- En producción At-Once (referencia observada):
  - Proyecto Easypanel: `n8n`
  - Servicio: `trudesk-db`
  - Usuario Mongo típico del template: `mongo`
  - Puerto: `27017`
  - RAM observada en un momento dado: ~258 MB (orientativo)
- El host interno típico en Easypanel:

```text
$(PROJECT_NAME)_trudesk-db
```

Ejemplo si el proyecto se llama `n8n`:

```text
n8n_trudesk-db
```

- La **password** vive solo en Easypanel (Environment de `trudesk` / panel de la DB). **No** versionar secretos en el repo.

### 2.2 `trudesk` (app)

- Es el único que debe estar **UP** sirviendo HTTPS.
- Variables de entorno (runtime) van **aquí**, no en la base.
- Build diario de look & feel: archivo **`Dockerfile.ui`**.
- Puerto interno: **8118** (proxy/SSL de Easypanel delante).
- Dominio producción At-Once: `ticket.at-once.cl`.
- Proceso runtime: PM2 (`App [trudesk:0] online` en logs = sano).
- Arranque: `startup.sh` (CMD de los Dockerfiles).

### 2.3 `trudesk-base` (Easypanel)

- Sirve para construir/validar `Dockerfile.base` en el mismo panel si se desea.
- Tras un Deploy exitoso: **Stop**.
- **No** debe quedar corriendo 24/7 (gastaría RAM como un segundo HelpDesk).
- **No** necesita las variables Mongo/n8n para “existir”; no es el backend al que apunta `trudesk`.
- La publicación “oficial” de la imagen para `FROM` es **GitHub Actions → GHCR** (ver §4). El servicio Easypanel `trudesk-base` no sustituye a GHCR.
- **No** usar `polonel/trudesk` como base: la lógica del fork (webhook n8n, branding forzado, versión, i18n paths) vive en **este** repo.

---

## 3. Configuración Easypanel — recrear desde cero

### 3.1 Prerrequisitos

- Cuenta Easypanel con proyecto (ej. `n8n`).
- GitHub conectado a Easypanel (OAuth / instalación) con acceso a `mcandiav/trudesk-custom`.
- Dominio / proxy para `trudesk` (ej. `ticket.at-once.cl`).
- Paquete GHCR `trudesk-custom-base` publicado y **Public** (§4) **antes** de usar `Dockerfile.ui`.

### 3.2 Crear / verificar `trudesk-db`

1. Create service → base de datos Mongo (o la que ya exista del template Trudesk).
2. Anotar usuario, password y nombre del servicio (`trudesk-db`).
3. No borrar volúmenes en operaciones normales.
4. Confirmar host interno: `{proyecto}_trudesk-db` (ej. `n8n_trudesk-db`).

### 3.3 Crear `trudesk-base` (App)

1. Create service → **App**.
2. Nombre: `trudesk-base`.
3. **Source → Github**

| Campo | Valor |
|--------|--------|
| Repository | `mcandiav/trudesk-custom` |
| Branch | `master` |
| Build path | `/` |
| Build method | **Dockerfile** |
| File | `Dockerfile.base` |

4. En Easypanel hay **dos Save** habituales: uno de Source (repo/branch/path) y uno de Build (Dockerfile/File). Guardar ambos.
5. Deploy **una vez** (build largo, orden de magnitud ~10–15 min en frío).
6. Cuando esté verde → **Stop**.
7. **No** copiar el `.env` de `trudesk` a este servicio para el día a día.

### 3.4 Crear / configurar `trudesk` (App)

1. Create service → **App** (o el existente `trudesk` del template).
2. Nombre: `trudesk`.
3. Si venía del template con **Docker Image** `polonel/trudesk:…`: cambiar a pestaña **Github** (no crear un segundo servicio app).
4. **Source → Github**

| Campo | Valor |
|--------|--------|
| Repository | `mcandiav/trudesk-custom` |
| Branch | `master` |
| Build path | `/` |
| Build method | **Dockerfile** |
| File | **`Dockerfile.ui`** (producción actual). Emergencia: `Dockerfile` / `Dockerfile.full` |

5. Guardar **Source** y **Build** (dos Save) **antes** del Deploy.
6. **Domains / SSL:** dominio público (producción At-Once: `ticket.at-once.cl`). SSL lo gestiona el proxy de Easypanel.
7. **GitHub webhook:** habilitado en el servicio para Deploy automático al push a `master` (flujo habitual At-Once). El historial de Deploy muestra el subject del commit — por eso el formato `[V…@…]`.
8. **Environment** — valores de referencia producción At-Once (password real solo en el panel):

```env
NODE_ENV=production
TRUDESK_DOCKER=true
TD_MONGODB_URI=mongodb://mongo:PASSWORD@$(PROJECT_NAME)_trudesk-db:27017/?tls=false
USE_XFORWARDIP=true

# n8n: ticket.created (vacío = no llama a n8n; el ticket se crea igual)
TD_N8N_TICKET_CREATED_WEBHOOK_URL=
TD_N8N_WEBHOOK_SECRET=
TD_N8N_WEBHOOK_TIMEOUT_MS=5000
```

Notas:

- `$(PROJECT_NAME)` lo resuelve Easypanel (ej. `n8n` → host `n8n_trudesk-db`).
- Usuario Mongo del template At-Once: `mongo`. Sustituir `PASSWORD` por el del panel DB.
- Query `?tls=false` como en el template Easypanel.
- Estas variables son del servicio **`trudesk`**, no de `trudesk-base`.
- Plantilla en repo: `.env.example`.
- Opcional build-arg: `GIT_SHA` (si Easypanel lo pasa) → stamp en `.git-commit` dentro de `Dockerfile.ui`.

9. Save Environment → Deploy.
10. Verificar logs: PM2 `online`; login con branding; badge `VERSION@hash`.

### 3.5 Tiempos de build (órdenes de magnitud)

| Escenario | Tiempo típico |
|-----------|----------------|
| Build monolítico (`Dockerfile` / `Dockerfile.base`) en Easypanel, frío | ~13–15 min |
| Publish base en GitHub Actions (con caché GHA) | ~4 min (primera vez puede más) |
| Deploy UI (`Dockerfile.ui`) con GHCR ya Public | corto (pull + COPY) |
| FAQ-Inn u app nginx/static (referencia) | ~2 min — **no** comparable a Trudesk |

No confundir: Action GHCR “in progress” ≠ Deploy Easypanel largo de UI.

### 3.6 Qué NO hacer

- No apuntar `TD_MONGODB_URI` a un servicio “base”.
- No dejar `trudesk-base` UP.
- No poner File = `Dockerfile.ui` **antes** de que exista la imagen en GHCR (fallará el `FROM`).
- No recrear `trudesk-db` para “arreglar” un deploy de UI.
- No crear un segundo template Trudesk “para el fork” (duplicaría DB/app).
- No volver a Source Docker Image `polonel/trudesk` salvo rollback de emergencia consciente (perderías custom del fork hasta redeploy).

---

## 4. GitHub Packages (GHCR) — imagen lógica

### 4.1 Datos

| Item | Valor |
|------|--------|
| Registry | `ghcr.io` |
| Imagen | `ghcr.io/mcandiav/trudesk-custom-base` |
| Tags | `latest` y el valor de `VERSION` (ej. `1.2.17`) |
| Visibilidad requerida | **Public** (para que Easypanel haga `FROM` sin login) |
| Workflow | `.github/workflows/publish-base.yml` |
| Nombre en Actions | **Publish trudesk-base (GHCR)** |

### 4.2 Cuándo se publica

El workflow se dispara:

- **Manual:** Actions → Publish trudesk-base (GHCR) → **Run workflow**
- **Automático** en push a `master` si cambian:
  - `Dockerfile.base`
  - `package.json`
  - `yarn.lock`
  - `.yarnrc.yml`
  - `.yarn/releases/**`

Los cambios **solo UI** (CSS, vistas, `/atonce`) **no** deben republizar la base.

### 4.3 Primera publicación / recuperar paquete

1. Repo → **Actions** → **Publish trudesk-base (GHCR)** → Run workflow (`master`).
2. Esperar verde (build largo; en runners de GitHub puede ser más corto que Easypanel por caché GHA).
3. GitHub → **Packages** → `trudesk-custom-base`.
4. **Package settings** → **Change visibility** → **Public**.
5. Verificar que exista el tag `latest`.

URL útil de paquetes del usuario: `https://github.com/mcandiav?tab=packages`

### 4.4 Consumo desde `Dockerfile.ui`

```dockerfile
ARG BASE_IMAGE=ghcr.io/mcandiav/trudesk-custom-base:latest
FROM ${BASE_IMAGE}
```

---

## 5. Archivos Docker en el repo

| Archivo | Uso |
|---------|-----|
| `Dockerfile.base` | Build **lógica completa** (yarn + webpack). Usado por GHCR Action y por App `trudesk-base`. |
| `Dockerfile.ui` | Build **UI** sobre GHCR. Usado por App `trudesk` en producción. |
| `Dockerfile` | Build **completo** monolítico (mismo espíritu que `Dockerfile.full`). Emergencia / si aún no hay GHCR. |
| `Dockerfile.full` | Copia de respaldo del monolítico. |

### 5.1 Qué copia `Dockerfile.ui` (capa UI)

Solo estos paths (look & feel / textos públicos):

- `public/css/atonce-branding.css`
- `public/img/` (logos, favicon, `flags/`)
- `public/atonce/` (ej. `newissue-i18n.js`)
- `src/views/` (Handlebars)
- `src/mailer/templates/`
- `src/emitter/events/event_ticket_created.js` (hotfix: email al creador del ticket; evita republish-base)
- `VERSION` (+ stamp de `.git-commit` vía `GIT_SHA` si Easypanel lo pasa)

### 5.2 Qué NO va en el deploy UI diario

- Controllers, API, webhook n8n (`src/lib/n8nWebhook.js`) y demás eventos (salvo el hotfix anterior)
- `src/client` (React del panel) — se considera lógica ya compilada en la base
- `package.json` / `yarn.lock` (cambiarlos republica base vía Action)

### 5.3 Lección: no poner JS custom en `public/js/`

`yarn build` / `webpackdist` ejecuta `rimraf public/js/*` y **borra** archivos sueltos ahí.

El i18n de `/newissue` vive en:

```text
public/atonce/newissue-i18n.js
```

Referenciado desde `src/views/pub_createTicket.hbs` como `/atonce/newissue-i18n.js`.

Banderas: `public/img/flags/{es,br,us}.svg` (Identidad Visual At-Once V1.3, variante D: imagen + código ES/PT/EN).

---

## 6. Operación día a día

### 6.1 Cambio de look & feel (caso normal)

1. Editar solo archivos de la capa UI (§5.1).
2. Commit con formato EasyPanel (ver §8) y push a `master`.
3. Webhook → Deploy de `trudesk` con **`Dockerfile.ui`**.
4. Esperar build **corto** (pull base + COPY).
5. Verificar sitio (Ctrl+F5). Badge login: `VERSION@hash`.

**No** hace falta:

- Redeploy de `trudesk-base`
- Republizar GHCR
- Tocar `.env`

### 6.2 Cambio de lógica / deps / webhook (raro)

1. Cambiar código de lógica o `package.json` / lock.
2. Push → se dispara (o se corre a mano) **Publish trudesk-base (GHCR)**.
3. Esperar verde; confirmar tags en Packages.
4. Deploy de `trudesk` (con `Dockerfile.ui`) para que tome `:latest` nueva.
5. Opcional: Deploy + Stop de App `trudesk-base` en Easypanel (solo si se usa como espejo).

### 6.3 Después de un deploy UI: caché del navegador

Si el login queda en “bolita” infinita o no se ven cambios: **Ctrl+F5** (o ventana privada). Suele ser JS/CSS viejo en caché.

---

## 7. Emergencias

### 7.1 `Dockerfile.ui` falla al hacer `FROM` GHCR

1. Easypanel → `trudesk` → Build File → `Dockerfile` o `Dockerfile.full`.
2. Save → Deploy (vuelve el build largo).
3. Revisar: paquete GHCR existe, está **Public**, tag `latest` presente.

### 7.2 App no arranca pero el build fue OK

- Revisar logs PM2 / contenedor: debe verse `App [trudesk:0] online`.
- Revisar `TD_MONGODB_URI` y que `trudesk-db` esté UP.
- No recrear la DB.

### 7.3 Perder la imagen base

1. Correr workflow **Publish trudesk-base (GHCR)** otra vez.
2. Visibilidad Public.
3. Redeploy `trudesk` con `Dockerfile.ui`.

### 7.4 Rollback a imagen oficial (último recurso)

Solo si el fork no arranca y hace falta servicio YA:

1. Source → Docker Image → `polonel/trudesk:1.2.11` (u otra tag conocida).
2. **Mantener** las mismas env y la misma `trudesk-db`.
3. Deploy.
4. Luego recuperar el fork (GHCR + `Dockerfile.ui` o `Dockerfile` monolítico).

### 7.5 Login en spinner infinito / UI “vieja”

1. Ctrl+F5 o ventana privada.
2. Confirmar que el Deploy terminó y el contenedor nuevo está UP.
3. Si `/atonce/newissue-i18n.js` o flags dan 404: no colocar assets bajo `public/js/` (ver §5.3).

### 7.6 Tema claro viejo dentro de la app (historial)

El template dejó colores en Mongo. El fork fuerza paleta At-Once al generar CSS (SASS) para que Appearance legacy no gane. Si reaparece tema “oficial”, revisar lógica de `buildsass` / defaults At-Once — no “arreglar” borrando la DB.

---

## 8. Versión, commits y badge

| Artefacto | Rol |
|-----------|-----|
| Archivo `VERSION` | Versión de producto (`VERSION_APP`) |
| `.git-commit` | Hash corto para badge |
| Badge UI | `VERSION_APP@HASH_GIT` (ej. `1.2.18@9c3dfec`) |
| Login | subtítulo / badge de versión con `VERSION@hash` |
| Header operativo | título de producto + `VERSION@hash` junto al logo (banner `.chrono-brand`) |
| Asunto de commit | `[V{VERSION}@{hash}] mensaje` para historial EasyPanel |

Script de ayuda: `scripts/commit-version.ps1`  
Helper runtime: `src/lib/atonceVersion.js`

Nota: bumpear `package.json` dispara republish de base en GHCR (paths del workflow). Para releases **solo UI / solo docs**, preferir no tocar `package.json` (como el doc `1.2.18`) para no disparar Action de base innecesaria.

---

## 9. Webhook n8n (`ticket.created`)

- Al crear un ticket, el fork puede POSTear a n8n.
- Env en servicio **`trudesk`**: `TD_N8N_TICKET_CREATED_WEBHOOK_URL`, `TD_N8N_WEBHOOK_SECRET`, `TD_N8N_WEBHOOK_TIMEOUT_MS`.
- URL vacía = no llama a n8n; el ticket se crea igual.
- Código vive en la **imagen base** (lógica). Cambiar el webhook suele requerir republish GHCR + redeploy UI (o build monolítico).
- Ver también `.env.example` y código bajo `src/` (evento ticket created / helper webhook).

---

## 10. Checklist — reconstruir el entorno desde cero

Orden recomendado:

1. [ ] Repo `mcandiav/trudesk-custom` accesible; branch `master`.
2. [ ] En Easypanel: crear/verificar **`trudesk-db`** (Mongo) y anotar URI (usuario `mongo`, host `{proyecto}_trudesk-db`).
3. [ ] Correr Action **Publish trudesk-base (GHCR)** hasta verde.
4. [ ] Paquete `trudesk-custom-base` en GHCR → **Public**; tag `latest` existe.
5. [ ] Crear App **`trudesk-base`**: Github, File=`Dockerfile.base` → dos Save → Deploy → **Stop**.
6. [ ] Crear/migrar App **`trudesk`**: Github (no otra DB), File=**`Dockerfile.ui`**, env §3.4, dominio `ticket.at-once.cl` (o el vigente).
7. [ ] Dos Save (Source + Build) → Deploy `trudesk`.
8. [ ] Logs: PM2 online; login OK; badge `VERSION@hash`; `/newissue` i18n + banderas.
9. [ ] Confirmar webhook GitHub → deploy automático de `trudesk` en push a `master`.
10. [ ] Equipo: UI diario = File `Dockerfile.ui`; lógica/deps = republish GHCR; `trudesk-base` siempre Stop.

---

## 11. Mapa rápido de documentación relacionada

| Doc / path | Contenido |
|------------|-----------|
| Este archivo | Operación Easypanel + GHCR + rebuild (fuente de verdad ops) |
| `docs/easypanel-base-ui.md` | Índice corto → este runbook |
| `docs/briefs/newissue-i18n.md` | Alcance i18n `/newissue` |
| `docs/previews/` | Previews locales de UI (no producción; botones debug solo ahí) |
| `.env.example` | Variables n8n / Mongo de ejemplo |
| `.github/workflows/publish-base.yml` | Publicación GHCR |
| `Dockerfile.base` / `Dockerfile.ui` / `Dockerfile` / `Dockerfile.full` | Builds |
| `scripts/README-commit-version.md` | Formato de commits / versión |
| `scripts/commit-version.ps1` | Helper de commit versionado |
| Identidad Visual At-Once (carpeta hermana / fuera de este git) | Tokens, `components-lang.css`, README V1.3 variante D |

---

## 12. Bitácora operativa (despliegue)

| Fecha | Evento |
|-------|--------|
| (previo) | Template Easypanel: `trudesk` + `trudesk-db` en proyecto `n8n`; app = `polonel/trudesk:1.2.11`. |
| 2026-07-11 | Migración Source → Github `mcandiav/trudesk-custom`; primer build ~14 min; misma DB. |
| 2026-07-11 | Branding At-Once; forzar tema vs Mongo; badge `VERSION@hash`; webhook deploy. |
| 2026-07-12 | Optimización Dockerfile (cache mounts Yarn Berry). |
| 2026-07-12 | i18n `/newissue`; flags en `/img/flags`; JS en `/atonce` (evitar rimraf de `public/js`). |
| 2026-07-12 | Servicio Easypanel `trudesk-base` + `Dockerfile.base`. |
| 2026-07-13 | Workflow GHCR; paquete público; `trudesk` pasa a **`Dockerfile.ui`**. |
| 2026-07-13 | Runbook completo `docs/ops-easypanel-rebuild.md` (reconstruir desde cero). |

---

## 13. Estado esperado “sano”

| Componente | Estado sano |
|------------|-------------|
| `trudesk-db` | UP |
| `trudesk` | UP, File=`Dockerfile.ui`, login OK, puerto 8118 detrás del proxy |
| `trudesk-base` | **Stop** |
| GHCR `trudesk-custom-base` | Public, tag `latest` |
| Action publish-base | Última run en success cuando se tocó lógica/deps |
| Badge login / header | `VERSION@hash` coherente con último deploy UI |
| `/newissue` | i18n ES/PT/EN + SVG flags |
| Env `TD_N8N_*` | Configuradas en `trudesk` según necesidad |
