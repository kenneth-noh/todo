import { useState, useEffect, useCallback } from 'react'
import type { Category } from '@/types'
import * as api from '@/api/client'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getCategories()
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createCategories = async (names: string[]) => {
    await api.createCategories(names)
    await load()
  }

  const createSubCategories = async (categoryId: number, names: string[]) => {
    await api.createSubCategories(categoryId, names)
    await load()
  }

  const deleteCategory = async (id: number) => {
    await api.deleteCategory(id)
    await load()
  }

  const deleteSubCategory = async (id: number) => {
    await api.deleteSubCategory(id)
    await load()
  }

  return {
    categories,
    loading,
    reload: load,
    createCategories,
    createSubCategories,
    deleteCategory,
    deleteSubCategory,
  }
}
