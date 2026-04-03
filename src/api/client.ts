import type { Category, SubCategory, Task, Memo, PeriodFilter } from '@/types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error((err as { error?: string }).error ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

// Categories
export const getCategories = () =>
  request<Category[]>('/categories')

export const createCategories = (names: string[]) =>
  request<Category[]>('/categories', {
    method: 'POST',
    body: JSON.stringify({ names }),
  })

export const deleteCategory = (id: number) =>
  request<{ ok: boolean }>(`/categories/${id}`, { method: 'DELETE' })

// Sub-categories
export const getSubCategories = (categoryId: number) =>
  request<SubCategory[]>(`/categories/${categoryId}/subs`)

export const createSubCategories = (categoryId: number, names: string[]) =>
  request<SubCategory[]>(`/categories/${categoryId}/subs`, {
    method: 'POST',
    body: JSON.stringify({ names }),
  })

export const deleteSubCategory = (id: number) =>
  request<{ ok: boolean }>(`/sub-categories/${id}`, { method: 'DELETE' })

// Tasks
export const getTasks = (params: { category_id?: number; page?: number } = {}) => {
  const q = new URLSearchParams()
  if (params.category_id != null) q.set('category_id', String(params.category_id))
  if (params.page != null) q.set('page', String(params.page))
  return request<{ tasks: Task[]; total: number; page: number; pages: number }>(
    `/tasks?${q}`
  )
}

export const createTask = (data: {
  category_id: number | null
  sub_category_id: number | null
  name: string
  due_date: string | null
}) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) })

export const updateTask = (
  id: number,
  data: {
    category_id?: number | null
    sub_category_id?: number | null
    name?: string
    due_date?: string | null
  }
) => request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const toggleComplete = (id: number) =>
  request<Task>(`/tasks/${id}/complete`, { method: 'PATCH' })

export const deleteTask = (id: number) =>
  request<{ ok: boolean }>(`/tasks/${id}`, { method: 'DELETE' })

// Memos
export const getMemos = (taskId: number) =>
  request<Memo[]>(`/tasks/${taskId}/memos`)

export const createMemo = (taskId: number, data: { name: string; content: string }) =>
  request<Memo>(`/tasks/${taskId}/memos`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deleteMemo = (id: number) =>
  request<{ ok: boolean }>(`/memos/${id}`, { method: 'DELETE' })

// Search
export const searchTasks = (params: {
  name?: string
  period?: PeriodFilter
  category_id?: number
}) => {
  const q = new URLSearchParams()
  if (params.name) q.set('name', params.name)
  if (params.period) q.set('period', params.period)
  if (params.category_id != null) q.set('category_id', String(params.category_id))
  return request<Task[]>(`/search?${q}`)
}
