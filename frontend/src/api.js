const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `HTTP ${status}`)
    this.status = status
  }
}

async function toResult(res) {
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.detail)
  }
  return body
}

export function getTransactions() {
  return fetch(`${API_BASE_URL}/transactions`).then(toResult)
}

export function getTransactionItems(transactionId) {
  return fetch(`${API_BASE_URL}/transactions/${transactionId}/items`).then(toResult)
}

export function getItemContent(url) {
  return fetch(url).then(toResult)
}
