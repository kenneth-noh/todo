import { useState, useEffect, useCallback } from 'react'
import type { Memo } from '@/types'
import * as api from '@/api/client'

export function useMemos(taskId: number) {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getMemos(taskId)
      setMemos(data)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => { load() }, [load])

  const addMemo = async (name: string, content: string) => {
    await api.createMemo(taskId, { name, content })
    await load()
  }

  const removeMemo = async (id: number) => {
    await api.deleteMemo(id)
    await load()
  }

  return { memos, loading, addMemo, removeMemo }
}
