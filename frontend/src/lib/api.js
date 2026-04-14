const BASE = '/api'
const TOKEN_KEY = 'argus_session'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

async function req(path, opts = {}) {
  const token = getToken()
  const headers = { ...opts.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const r = await fetch(`${BASE}${path}`, { ...opts, headers })

  if (r.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    window.location.href = '/'
    throw new Error('Session expired')
  }

  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  // Auth
  authStatus:  () => fetch('/api/auth/status').then(r => r.json()),
  authMe:      () => req('/auth/me'),
  authLogout:  () => req('/auth/logout', { method: 'POST' }),

  // Core
  health:        () => fetch('/health').then(r => r.json()),
  tools:         () => req('/tools/'),
  toolSummary:   () => req('/tools/summary'),
  scans:         () => req('/scans/'),
  reportPreview: () => req('/reports/preview'),

  // Ingestion
  uploadDnsCsv: (file) => {
    const form = new FormData()
    form.append('file', file)
    const token = getToken()
    return fetch(`${BASE}/scans/dns-csv`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(r => {
      if (r.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/'; }
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    })
  },
  pasteDomains: (domains) =>
    req('/scans/paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains }),
    }),
  manualLookup: (query) =>
    req('/scans/manual-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    }),
  manualSave: (query, notes = '') =>
    req('/scans/manual-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, notes }),
    }),

  // Scheduler
  schedulerStatus:    () => req('/scheduler/status'),
  schedulerConfigure: (interval_hours) =>
    req('/scheduler/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval_hours }),
    }),
  schedulerRunNow: () => req('/scheduler/run-now', { method: 'POST' }),

  // Overrides
  overrides: () => req('/overrides/'),
  createOverride: (payload) =>
    req('/overrides/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  deleteOverride: (domain) =>
    req(`/overrides/${encodeURIComponent(domain)}`, { method: 'DELETE' }),

  // Triage
  triageList:   (status = 'PENDING') => req(`/triage/?status=${status}`),
  triageCount:  () => req('/triage/count'),
  triageAction: (id, payload) =>
    req(`/triage/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
}
