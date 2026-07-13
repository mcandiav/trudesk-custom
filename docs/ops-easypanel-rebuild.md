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

- Guarda tickets, usuarios, settings.
- **Nunca** recrear a la ligera si hay datos de producción.
- El host interno típico en Easypanel:

```text
$(PROJECT_NAME)_trudesk-db
```

Ejemplo si el proyecto se llama `n8n`:

```text
n8n_trudesk-db
```

### 2.2 `trudesk` (app)

- Es el único que debe estar **UP** sirviendo HTTPS.
- Variables de entorno (runtime) van **aquí**, no en la base.
- Build diario de look & feel: archivo **`Dockerfile.ui`**.

### 2.3 `trudesk-base` (Easypanel)

- Sirve para construir/validar `Dockerfile.base` en el mismo panel si se desea.
- Tras un Deploy exitoso: **Stop**.
- **No** debe quedar corriendo 24/7 (gastaría RAM como un segundo HelpDesk).
- **No** necesita las variables Mongo/n8n para “existir”; no es el backend al que apunta `trudesk`.
- La publicación “oficial” de la imagen para `FROM` es **GitHub Actions → GHCR** (ver §4). El servicio Easypanel `trudesk-base` no sustituye a GHCR.

---

## 3. Configuración Easypanel — recrear desde cero

### 3.1 Prerrequisitos

- Cuenta Easypanel con proyecto (ej. `n8n`).
- GitHub conectado a Easypanel (OAuth / instalación) con acceso a `mcandiav/trudesk-custom`.
- Dominio / proxy para `trudesk` (ej. `ticket.at-once.cl`).

### 3.2 Crear / verificar `trudesk-db`

1. Create service → base de datos Mongo (o la que ya exista del template Trudesk).
2. Anotar usuario, password y nombre del servicio (`trudesk-db`).
3. No borrar volúmenes en operaciones normales.

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

4. Save (Source y Build).
5. Deploy **una vez** (build largo).
6. Cuando esté verde → **Stop**.
7. **No** copiar el `.env` de `trudesk` a este servicio para el día a día.

### 3.4 Crear / configurar `trudesk` (App)

1. Create service → **App** (o el existente `trudesk`).
2. Nombre: `trudesk`.
3. **Source → Github**

| Campo | Valor |
|--------|--------|
| Repository | `mcandiav/trudesk-custom` |
| Branch | `master` |
| Build path | `/` |
| Build method | **Dockerfile** |
| File | **`Dockerfile.ui`** |

4. Webhook de GitHub habilitado (deploy automático al push a `master`), si es el flujo habitual.
5. Dominios / SSL según panel.
6. **Environment** (ejemplo de producción At-Once; ajustar secretos reales):

```env
NODE_ENV=production
TRUDESK_DOCKER=true
TD_MONGODB_URI=mongodb://mongo:PASSWORD@$(PROJECT_NAME)_trudesk-db:27017/?tls=false
USE_XFORWARDIP=true

# n8n: ticket.created (vacío = no llama a n8n)
TD_N8N_TICKET_CREATED_WEBHOOK_URL=
TD_N8N_WEBHOOK_SECRET=
TD_N8N_WEBHOOK_TIMEOUT_MS=5000
```

Notas:

- `$(PROJECT_NAME)` lo resuelve Easypanel (ej. `n8n` → host `n8n_trudesk-db`).
- Estas variables son del servicio **`trudesk`**, no de `trudesk-base`.
- Plantilla en repo: `.env.example`.

7. Save → Deploy.

### 3.5 Qué NO hacer

- No apuntar `TD_MONGODB_URI` a un servicio “base”.
- No dejar `trudesk-base` UP.
- No poner File = `Dockerfile.ui` **antes** de que exista la imagen en GHCR (fallará el `FROM`).
- No recrear `trudesk-db` para “arreglar” un deploy de UI.

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
- `VERSION` (+ stamp de `.git-commit` vía `GIT_SHA` si Easypanel lo pasa)

### 5.2 Qué NO va en el deploy UI diario

- Controllers, API, webhook n8n (`src/lib/n8nWebhook.js`, eventos)
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

---

## 8. Versión, commits y badge

| Artefacto | Rol |
|-----------|-----|
| Archivo `VERSION` | Versión de producto (`VERSION_APP`) |
| `.git-commit` | Hash corto para badge |
| Badge UI | `VERSION_APP@HASH_GIT` (ej. `1.2.17@765a720`) |
| Asunto de commit | `[V{VERSION}@{hash}] mensaje` para historial EasyPanel |

Script de ayuda: `scripts/commit-version.ps1`  
Nota: bumpear `package.json` dispara republish de base en GHCR (paths del workflow). Para releases **solo UI**, preferir no tocar deps; si el script actualiza `package.json`, esperar Action de base o ajustar el flujo.

---

## 9. Checklist — reconstruir el entorno desde cero

Orden recomendado:

1. [ ] Repo `mcandiav/trudesk-custom` accesible; branch `master`.
2. [ ] En Easypanel: crear/verificar **`trudesk-db`** (Mongo) y anotar URI.
3. [ ] Correr Action **Publish trudesk-base (GHCR)** hasta verde.
4. [ ] Paquete `trudesk-custom-base` en GHCR → **Public**.
5. [ ] Crear App **`trudesk-base`**: Github, File=`Dockerfile.base` → Deploy → **Stop**.
6. [ ] Crear App **`trudesk`**: Github, File=**`Dockerfile.ui`**, mismas env de §3.4, dominio.
7. [ ] Deploy `trudesk` → verificar login `https://ticket.at-once.cl` (o dominio actual).
8. [ ] Verificar `/newissue` (i18n + banderas) y badge `VERSION@hash`.
9. [ ] Confirmar webhook GitHub → deploy automático de `trudesk` en push.
10. [ ] Documentar en el equipo: UI = File `Dockerfile.ui`; lógica = republish GHCR.

---

## 10. Mapa rápido de documentación relacionada

| Doc | Contenido |
|-----|-----------|
| Este archivo | Operación Easypanel + GHCR + rebuild |
| `docs/briefs/newissue-i18n.md` | Alcance i18n `/newissue` |
| `docs/previews/` | Previews locales de UI (no producción) |
| `.env.example` | Variables n8n / Mongo de ejemplo |
| `scripts/README-commit-version.md` | Formato de commits / versión |
| Identidad Visual At-Once (repo hermano) | Tokens, selector idioma V1.3 variante D |

---

## 11. Bitácora operativa (despliegue)

| Fecha | Evento |
|-------|--------|
| 2026-07-12 | Optimización Dockerfile (cache mounts Yarn Berry). |
| 2026-07-12 | i18n `/newissue`; flags en `/img/flags`; JS en `/atonce` (evitar rimraf de `public/js`). |
| 2026-07-12 | Servicio Easypanel `trudesk-base` + `Dockerfile.base`. |
| 2026-07-13 | Workflow GHCR; paquete público; `trudesk` pasa a **`Dockerfile.ui`**. |

---

## 12. Estado esperado “sano”

| Componente | Estado sano |
|------------|-------------|
| `trudesk-db` | UP |
| `trudesk` | UP, File=`Dockerfile.ui`, login OK |
| `trudesk-base` | **Stop** |
| GHCR `trudesk-custom-base` | Public, tag `latest` |
| Action publish-base | Última run en success cuando se tocó lógica/deps |
| Badge login | `VERSION@hash` coherente con último deploy UI |
