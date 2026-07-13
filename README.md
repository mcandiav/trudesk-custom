<h1 align="center">
<a href="http://trudesk.io"><img src="http://trudesk.io/TD_Black.png" width="500" /></a>
<br />Community Edition
</h1>
<p align="center">
<a href="https://app.codacy.com/gh/polonel/trudesk/dashboard"><img alt="Codacy grade" src="https://img.shields.io/codacy/grade/3228c30aa1d14530ba25a04948985079?style=flat-square"></a>
<a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square" /></a>
<a href="https://app.circleci.com/pipelines/github/polonel/trudesk"><img src="https://img.shields.io/circleci/token/ad7d2d066a75685a15c8e2fd08bd75e53b18fbb7/project/github/polonel/trudesk/master.svg?style=flat-square" /></a>
<a href="https://forum.trudesk.io"><img src="https://img.shields.io/discourse/https/forum.trudesk.io/topics.svg?style=flat-square" /></a>
<a title="Crowdin" target="_blank" href="https://crowdin.com/project/trudesk"><img src="https://d322cqt584bo4o.cloudfront.net/trudesk/localized.svg?style=flat-square"></a>
<a href="https://github.com/polonel/trudesk/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-APACHE%202-green.svg?style=flat-square" /></a>
<a href="https://github.com/polonel/trudesk/releases"><img src="https://img.shields.io/github/release/polonel/trudesk.svg?style=flat-square" /></a>
<a href="https://docs.trudesk.io/v1.2"><img src="https://img.shields.io/badge/documentation-click%20to%20read-blue.svg?style=flat-square" /></a>
<br />
<sub>© 2014-2023, Trudesk, Inc. (<b><a href="https://trudesk.io">@trudesk</a></b>).</sub>
</p>
<br />

### Open Source Help Desk - Simply Organized.
Quickly resolve issues & task with an easy-to-use solution. Built with one goal in mind, to keep work loads organized and simple. **This is the source for Trudesk Community Edition. For the more comprehensive, cloud-hosted version, please see Trudesk Cloud at <a href="http://trudesk.io">Trudesk.io</a>.**

<p align="center">
    <img src="https://trudesk.io/images/hero-td-right.png" />
</p>

#### Deploy Trudesk Anywhere
**Trudesk** is built with <a href="https://nodejs.org">nodejs</a> and <a href="https://mongodb.org">mongodb</a> and can run on any cloud provider, docker, bare-metal, or even a raspberry pi.
Take it for a spin on Ubuntu 20.04 with a one liner - <br />`curl -L -s https://storage.trudesk.io/install/ubuntu-1.2.sh | sudo bash`

#### Requirements
- NodeJS 16+
- MongoDB 5.0+
- Elasticsearch 8 (optional to enable search)

### Documentation
Online documentation: [https://docs.trudesk.io/v1.2](https://docs.trudesk.io/v1.2)

### Contributing
If you like what you see here, and want to help support the work being done, you could:
+ Report Bugs
+ Request/Implement Features
+ Refactor Codebase
+ Help Write Documentation

### Sponsors
Just a few who have made the project possible.
<br />
<a href="https://www.browserstack.com"><img src="https://files.trudesk.io/browserstack-logo-600x315.png" width="115" /></a>

Trudesk is tested with confidence using [BrowserStack](https://browserstack.com).

### License

    Copyright 2014-2023 Trudesk, Inc.
    
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
    http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

---

## Arquitectura At-Once

### Operación Easypanel / imagen base + UI

Runbook completo (reconstruir desde cero, tres servicios, GHCR, `Dockerfile.ui`, emergencias):

**[docs/ops-easypanel-rebuild.md](docs/ops-easypanel-rebuild.md)**

Índice corto: [docs/easypanel-base-ui.md](docs/easypanel-base-ui.md)

### Bitácora de cambios

| Fecha | Versión | Cambio realizado | Motivo | Impacto | Sección afectada |
|---|---:|---|---|---|---|
| 2026-07-13 | 1.2 | Modelo base (GHCR) + UI (`Dockerfile.ui`); runbook completo `ops-easypanel-rebuild.md` | Poder reconstruir desde cero (Easypanel, env, GHCR, emergencias) | Operación: File=`Dockerfile.ui` en `trudesk`; base en Stop; Action publish-base | Despliegue / Easypanel |
| 2026-07-12 | 1.0 | Se define la integración saliente Trudesk → n8n para creación de tickets | Ejecutar automatizaciones externas cada vez que Trudesk registre un ticket nuevo | Requiere desarrollo backend acotado y configuración de un Webhook Trigger en n8n | Integración n8n para nuevos tickets |

### Estado documental

- Versión arquitectónica documental: **1.2** (ops base+UI).
- Despliegue producción: `trudesk` con **`Dockerfile.ui`** sobre `ghcr.io/mcandiav/trudesk-custom-base`.
- Integración n8n `ticket.created`: implementada (`TD_N8N_*` en env); URL vacía = no-op.

## Integración n8n para nuevos tickets

### Objetivo

Enviar automáticamente un evento HTTP a n8n cada vez que Trudesk cree y persista correctamente un ticket nuevo, independientemente del canal utilizado para originarlo.

### Hallazgos confirmados en el código

Trudesk ya dispone de un evento interno centralizado denominado `ticket:created`.

El registro principal del manejador se encuentra en:

```text
src/emitter/events.js
```

El procesamiento central del evento se encuentra en:

```text
src/emitter/events/event_ticket_created.js
```

El evento se emite actualmente desde, al menos, estos flujos:

- Creación autenticada por interfaz o API.
- Creación pública de tickets.
- Creación de tickets desde el procesamiento de correo.

Por lo tanto, la integración no debe duplicarse en cada controlador. Debe incorporarse una sola vez en el manejador central de `ticket:created`.

### Decisión arquitectónica

El Programador debe extender el procesamiento de `ticket:created` para ejecutar un `POST` HTTP hacia un Webhook Trigger de n8n después de que el ticket haya sido guardado correctamente y recuperado con sus datos relacionados.

La integración debe ser opcional y controlada mediante variables de entorno. Como mínimo:

```text
TRUDESK_TICKET_CREATED_WEBHOOK_URL
TRUDESK_TICKET_CREATED_WEBHOOK_SECRET
TRUDESK_TICKET_CREATED_WEBHOOK_TIMEOUT_MS
```

La aplicación debe continuar funcionando normalmente cuando la URL no esté configurada.

### Contrato inicial del evento

Nombre lógico del evento:

```text
ticket.created
```

Método HTTP:

```text
POST
```

Tipo de contenido:

```text
application/json
```

Payload mínimo esperado:

```json
{
  "event": "ticket.created",
  "occurredAt": "ISO-8601",
  "ticket": {
    "id": "MongoDB ObjectId",
    "uid": 1234,
    "subject": "Asunto del ticket",
    "issue": "Descripción del problema",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "owner": {
      "id": "MongoDB ObjectId",
      "username": "usuario",
      "fullname": "Nombre",
      "email": "correo@dominio"
    },
    "group": {
      "id": "MongoDB ObjectId",
      "name": "Grupo"
    },
    "type": {
      "id": "MongoDB ObjectId",
      "name": "Tipo"
    },
    "priority": {
      "id": "MongoDB ObjectId",
      "name": "Prioridad"
    },
    "status": {
      "id": "MongoDB ObjectId",
      "name": "Estado"
    },
    "url": "URL navegable del ticket"
  }
}
```

El Programador puede ajustar nombres internos según la estructura real del modelo, pero no debe eliminar `event`, `occurredAt`, `ticket.id`, `ticket.uid`, `ticket.subject`, `ticket.owner`, `ticket.group` ni `ticket.url` sin una nueva decisión arquitectónica.

### Seguridad

- La URL y el secreto no deben quedar escritos en el repositorio.
- El secreto debe enviarse en un encabezado HTTP dedicado, por ejemplo `X-Trudesk-Webhook-Secret`.
- n8n debe validar el secreto antes de procesar el payload.
- Los logs no deben imprimir el secreto ni la URL completa si contiene información sensible.
- La variable de secreto debe configurarse como secreto de EasyPanel.

### Comportamiento ante fallos

La entrega del webhook no debe bloquear, revertir ni marcar como fallida la creación del ticket.

Requisitos:

- Aplicar timeout configurable.
- Capturar errores de conexión, DNS, TLS, timeout y respuestas HTTP no exitosas.
- Registrar el error con `ticket.id`, `ticket.uid`, código HTTP cuando exista y mensaje técnico sanitizado.
- No lanzar el error hacia el flujo principal de creación del ticket.
- No implementar reintentos infinitos.

Para la primera versión se permite entrega de mejor esfuerzo sin cola persistente. Una cola, tabla de entregas o reintentos durables requerirá una decisión arquitectónica posterior.

### Criterios de implementación para el Programador

1. Mantener la emisión existente de `ticket:created` sin cambiar su contrato interno.
2. Incorporar el envío saliente desde el flujo central de `event_ticket_created.js` o desde un módulo específico invocado por este manejador.
3. Evitar llamadas HTTP duplicadas por ticket.
4. Usar una dependencia HTTP ya presente en el proyecto; si no existe una adecuada, justificar la nueva dependencia.
5. No modificar MongoDB ni el esquema de tickets para esta primera versión.
6. No agregar una pantalla de configuración en el frontend en esta fase.
7. No exponer el secreto al navegador.
8. Mantener compatibilidad con Node.js 16 o con la versión efectiva definida por el proyecto.
9. Agregar pruebas para integración deshabilitada, entrega exitosa, timeout y respuesta HTTP de error.
10. Documentar las variables de entorno en el archivo de ejemplo correspondiente, sin valores reales.

### Criterios de aceptación

La implementación se considerará aprobada cuando:

- Un ticket creado desde la interfaz genere exactamente una llamada a n8n.
- Un ticket creado mediante la API genere exactamente una llamada a n8n.
- Un ticket creado por correo genere exactamente una llamada a n8n.
- El payload contenga el identificador interno, UID visible, asunto, propietario, grupo y URL.
- Un n8n detenido o inaccesible no impida crear el ticket.
- Un secreto incorrecto sea rechazado por n8n sin afectar Trudesk.
- Los errores queden registrados sin revelar secretos.
- Cuando la URL no esté configurada no se realicen llamadas externas.

### Responsabilidades

**Programador**

- Implementar el emisor HTTP.
- Incorporar configuración por variables de entorno.
- Agregar pruebas automatizadas o verificaciones reproducibles.
- Entregar evidencia del payload y de los casos de fallo.

**Configurador n8n**

- Crear el Webhook Trigger.
- Configurar la validación del secreto.
- Definir el workflow que procesará `ticket.created`.
- Entregar la URL productiva para configurarla como secreto en EasyPanel.

**Arquitecto**

- Validar cambios al contrato del payload.
- Aprobar cualquier extensión futura a comentarios, asignaciones, cambios de estado o reintentos persistentes.

### Fuera de alcance de esta versión

- Webhooks para comentarios, notas, asignaciones o cambios de estado.
- Administración de webhooks desde la interfaz de Trudesk.
- Múltiples destinos por evento.
- Cola persistente y reintentos durables.
- Firma criptográfica HMAC del cuerpo.
- Historial de entregas almacenado en MongoDB.
