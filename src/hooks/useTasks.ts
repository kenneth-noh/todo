import { useState, useEffect, useCallback } from 'react'
import type { Task } from '@/types'
import * as api from '@/api/client'

export function useTasks(categoryId?: number | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const data = await api.getTasks({
        category_id: categoryId ?? undefined,
        page: p,
      })
      setTasks(data.tasks)
      setTotal(data.total)
      setPage(data.page)
      setPages(data.pages)
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => { load(1) }, [load])

  const goToPage = (p: number) => load(p)

  const createTask = async (data: {
    category_id: number | null
    sub_category_id: number | null
    name: string
    due_date: string | null
  }) => {
    await api.createTask(data)
    await load(1)
  }

  const updateTask = async (id: number, data: Parameters<typeof api.updateTask>[1]) => {
    await api.updateTask(id, data)
    await load(page)
  }

  const toggleComplete = async (id: number) => {
    await api.toggleComplete(id)
    await load(page)
  }

  const deleteTask = async (id: number) => {
    await api.deleteTask(id)
    await load(page)
  }

  return {
    tasks,
    total,
    page,
    pages,
    loading,
    reload: load,
    goToPage,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
  }
}
