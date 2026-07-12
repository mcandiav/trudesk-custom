# Brief: i18n solo en `/newissue` (HelpDesk At-Once-AI)

## Objetivo
Hacer multilingual **únicamente** la página pública `/newissue` (crear ticket sin login), alineado al patrón FAQ-Inn (`es` / `pt` / `en`).

## Fuera de alcance (NO tocar)
- Login, OTP, panel React, settings, API de creación de tickets
- MongoDB, rutas salvo si hace falta pasar `lang` al render (mínimo)
- i18n global del resto de Trudesk
- No cambiar lógica de captcha, email check ni POST `/api/v1/public/tickets/create`

## Archivos permitidos
1. `src/views/pub_createTicket.hbs`
2. `public/js/newissue-i18n.js`
3. `public/css/atonce-branding.css` (selector de idioma = estándar Identidad Visual At-Once)
4. `public/img/flags/{es,br,us}.svg`
5. Opcional: 1–2 líneas en `src/controllers/tickets.js` (`pubNewIssue`) si hace falta

## Requisitos
- Idiomas: `es`, `pt`, `en`. Default: `es`
- Persistencia: `localStorage` key `atonce-newissue-lang`
- UI: atributos `data-i18n` + `t('clave')` para snackbars / textos que el JS reescribe
- **Selector de idioma:** Identidad Visual At-Once **V1.3 variante D**
  - clases `.lang-picker` / `.lang-flag`
  - bandera SVG local (`/img/flags/…`) + código `ES` / `PT` / `EN`
  - activo = borde `#3b82f6` (no gradient primario, no emoji)
  - token canónico: `identidad visual at-once/tokens/components-lang.css`
- Producto sigue siendo **HelpDesk At-Once-AI**; badge `versionLabel` no se traduce
- Si falla i18n, la página debe seguir usable (fallback a texto en el HTML)

## Criterio de aceptación
- Cambiar idioma actualiza labels, botones, párrafos y mensajes snackbar de esa página
- El selector muestra bandera real + código en Windows (no cajas emoji rotas)
- Crear ticket sigue funcionando igual
- Diff revisable y acotado a los archivos permitidos
