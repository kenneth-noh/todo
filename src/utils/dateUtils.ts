export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${h}:${min}`
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  return due < today
}

export function isDueToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const today = new Date().toISOString().slice(0, 10)
  return dateStr === today
}

export function toInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}
