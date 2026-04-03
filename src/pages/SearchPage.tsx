import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { PeriodFilter } from '@/components/search/PeriodFilter'
import { TaskCard } from '@/components/task/TaskCard'
import { Input } from '@/components/ui/Input'
import type { Task, PeriodFilter as PF } from '@/types'
import * as api from '@/api/client'

export function SearchPage() {
  const [name, setName] = useState('')
  const [period, setPeriod] = useState<PF>('')
  const [results, setResults] = useState<Task[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const data = await api.searchTasks({ name: name.trim(), period })
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  // Auto-search when period changes
  useEffect(() => {
    if (period || name.trim()) search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const handleToggle = async (id: number) => {
    await api.toggleComplete(id)
    setResults((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_completed: t.is_completed ? 0 : 1 } : t
      )
    )
  }

  return (
    <div className="flex flex-col min-h-svh">
      <AppHeader title="검색" showBack />

      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            placeholder="업무명으로 검색"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            className="flex-1"
          />
          <button
            onClick={search}
            className="px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shrink-0"
          >
            검색
          </button>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">기간 필터</p>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>

        {loading && <p className="text-center text-gray-400 text-sm py-6">검색 중...</p>}

        {!loading && searched && (
          <>
            <p className="text-xs text-gray-400">검색 결과 {results.length}건</p>
            {results.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">결과가 없어요.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggle} />
                ))}
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="text-center text-gray-400 text-sm py-12">
            <p className="text-3xl mb-3">🔍</p>
            <p>업무명을 입력하거나 기간을 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
