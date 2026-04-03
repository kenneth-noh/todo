import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { useMemos } from '@/hooks/useMemos'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MemoCard } from '@/components/memo/MemoCard'
import { MemoForm } from '@/components/memo/MemoForm'
import * as api from '@/api/client'
import type { Task } from '@/types'
import { toInputDate } from '@/utils/dateUtils'

// API client helper for single task fetch
async function fetchTask(id: number): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`)
  if (!res.ok) throw new Error('Not found')
  return res.json() as Promise<Task>
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)
  const navigate = useNavigate()
  const { categories } = useCategories()

  const [task, setTask] = useState<Task | null>(null)
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showMemoForm, setShowMemoForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const { memos, addMemo, removeMemo } = useMemos(taskId)

  useEffect(() => {
    fetchTask(taskId)
      .then((t) => {
        setTask(t)
        setName(t.name)
        setDueDate(toInputDate(t.due_date))
        setSelectedCatId(t.category_id)
        setSelectedSubId(t.sub_category_id)
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false))
  }, [taskId, navigate])

  const selectedCat = categories.find((c) => c.id === selectedCatId)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await api.updateTask(taskId, {
        category_id: selectedCatId,
        sub_category_id: selectedSubId,
        name: name.trim(),
        due_date: dueDate || null,
      })
      navigate(-1)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-svh text-gray-400 text-sm">
        불러오는 중...
      </div>
    )
  }

  if (!task) return null

  return (
    <div className="flex flex-col min-h-svh">
      <AppHeader title="업무 수정" showBack />

      <div className="flex-1 px-4 py-5 flex flex-col gap-5">
        {/* Task edit form */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">카테고리</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCatId(selectedCatId === cat.id ? null : cat.id)
                    setSelectedSubId(null)
                  }}
                  className={`
                    px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
                    ${selectedCatId === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {selectedCat?.sub_categories && selectedCat.sub_categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-blue-200">
                {selectedCat.sub_categories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubId(selectedSubId === sub.id ? null : sub.id)}
                    className={`
                      px-3 py-1 rounded-xl text-xs font-medium transition-colors
                      ${selectedSubId === sub.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }
                    `}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="업무명 *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="완료예정일"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Button onClick={handleSave} disabled={!name.trim() || saving} fullWidth>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </section>

        {/* Memos */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">메모</h2>
            <Button size="sm" variant="secondary" onClick={() => setShowMemoForm(!showMemoForm)}>
              {showMemoForm ? '취소' : '+ 메모 추가'}
            </Button>
          </div>

          {showMemoForm && (
            <MemoForm
              onSubmit={async (memoName, content) => {
                await addMemo(memoName, content)
                setShowMemoForm(false)
              }}
              onCancel={() => setShowMemoForm(false)}
            />
          )}

          {memos.length === 0 && !showMemoForm ? (
            <p className="text-sm text-gray-400 text-center py-4">메모가 없어요.</p>
          ) : (
            memos.map((memo) => (
              <MemoCard key={memo.id} memo={memo} onDelete={removeMemo} />
            ))
          )}
        </section>
      </div>
    </div>
  )
}
