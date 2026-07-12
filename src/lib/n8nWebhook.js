'use strict'

const axios = require('axios')
const logger = require('../logger')

function pickUser (user) {
  if (!user) return null
  const obj = typeof user.toObject === 'function' ? user.toObject() : user
  return {
    _id: obj._id ? String(obj._id) : null,
    username: obj.username || null,
    fullname: obj.fullname || null,
    email: obj.email || null
  }
}

function pickNamed (doc) {
  if (!doc) return null
  if (typeof doc === 'string' || typeof doc === 'number') return doc
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc
  return {
    _id: obj._id ? String(obj._id) : null,
    name: obj.name || obj.htmlName || null,
    htmlColor: obj.htmlColor || null,
    uid: typeof obj.uid !== 'undefined' ? obj.uid : undefined
  }
}

function buildTicketCreatedPayload (ticket, options) {
  const baseUrl = String((options && options.baseUrl) || '').replace(/\/$/, '')
  const t = typeof ticket.toJSON === 'function' ? ticket.toJSON() : ticket
  const uid = t.uid

  return {
    event: 'ticket.created',
    at: new Date().toISOString(),
    hostname: (options && options.hostname) || null,
    ticketUrl: baseUrl && uid != null ? baseUrl + '/tickets/' + uid : null,
    ticket: {
      _id: t._id ? String(t._id) : null,
      uid: uid,
      subject: t.subject || null,
      issue: t.issue || null,
      date: t.date || null,
      owner: pickUser(t.owner),
      assignee: pickUser(t.assignee),
      group: pickNamed(t.group),
      type: pickNamed(t.type),
      priority: pickNamed(t.priority),
      status: pickNamed(t.status),
      tags: Array.isArray(t.tags) ? t.tags.map(pickNamed) : []
    }
  }
}

/**
 * POST ticket.created to n8n Webhook Trigger.
 * No-op if TD_N8N_TICKET_CREATED_WEBHOOK_URL is empty.
 * Never throws — failures are logged only.
 */
async function notifyTicketCreated (ticket, options) {
  const url = String(process.env.TD_N8N_TICKET_CREATED_WEBHOOK_URL || '').trim()
  if (!url) {
    return { skipped: true }
  }

  const timeout = parseInt(process.env.TD_N8N_WEBHOOK_TIMEOUT_MS || '5000', 10)
  const secret = String(process.env.TD_N8N_WEBHOOK_SECRET || '').trim()
  const payload = buildTicketCreatedPayload(ticket, options || {})

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'HelpDesk-At-Once-AI-n8n-webhook'
  }
  if (secret) {
    headers['X-Trudesk-Webhook-Secret'] = secret
  }

  try {
    const res = await axios.post(url, payload, {
      headers,
      timeout: Number.isFinite(timeout) && timeout > 0 ? timeout : 5000,
      validateStatus: function (status) {
        return status >= 200 && status < 300
      }
    })
    logger.debug(
      `[n8nWebhook] ticket.created uid=${payload.ticket.uid} status=${res.status}`
    )
    return { ok: true, status: res.status }
  } catch (err) {
    const detail = err.response
      ? `HTTP ${err.response.status}`
      : err.message || String(err)
    logger.warn(`[n8nWebhook] ticket.created failed: ${detail}`)
    return { ok: false, error: detail }
  }
}

module.exports = {
  buildTicketCreatedPayload,
  notifyTicketCreated
}
