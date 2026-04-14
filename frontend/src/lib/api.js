const BASE = '/api'

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, opts)
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  // Core
  health:        () => fetch('/health').then(r => r.json()),
  tools:         () => req('/tools/'),
  toolSummary:   () => req('/tools/summary'),
  scans:         () => req('/scans/'),
  reportPreview: () => req('/reports/preview'),

  // Ingestion
  uploadDnsCsv: (file) => {
    const f = new FormData(); f.append('file', file)
    return req('/scans/dns-csv', { method: 'POST', body: f })
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
