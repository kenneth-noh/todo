import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { useTasks } from '@/hooks/useTasks'
import { AppHeader } from '@/components/layout/AppHeader'
import { CategoryFilter } from '@/components/category/CategoryFilter'
import { TaskCard } from '@/components/task/TaskCard'
import { TaskForm } from '@/components/task/TaskForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function MainPage() {
  const navigate = useNavigate()
  const { categories, loading: catLoading } = useCategories()
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const { tasks, pages, page, loading, goToPage, createTask, toggleComplete } = useTasks(selectedCatId)
  const [showForm, setShowForm] = useState(false)

  if (catLoading) {
    return (
      <div className="flex items-center justify-center h-svh text-gray-400 text-sm">
        불러오는 중...
      </div>
    )
  }

  const isEmpty = categories.length === 0

  return (
    <div className="flex flex-col min-h-svh">
      <AppHeader showSearch />

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-5xl">📋</div>
          <p className="text-base font-semibold text-gray-800">아직 카테고리가 없어요</p>
          <p className="text-sm text-gray-500">카테고리를 먼저 만들면 업무를 추가할 수 있어요.</p>
          <Button onClick={() => navigate('/categories')}>카테고리 만들기</Button>
        </div>
      ) : (
        <>
          <CategoryFilter
            categories={categories}
            selected={selectedCatId}
            onChange={setSelectedCatId}
          />

          <div className="flex-1 px-4 py-4 flex flex-col gap-3">
            {loading ? (
              <div className="text-center text-gray-400 text-sm py-8">불러오는 중...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-12">
                <p className="text-3xl mb-3">✅</p>
                <p>업무가 없어요. 새 업무를 추가해보세요!</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={toggleComplete} />
              ))
            )}

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-full bg-gray-100 text-sm disabled:opacity-30 hover:bg-gray-200"
                >
                  ‹
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-8 h-8 rounded-full text-sm font-medium
                      ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    `}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pages}
                  className="w-8 h-8 rounded-full bg-gray-100 text-sm disabled:opacity-30 hover:bg-gray-200"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <div className="px-4 pb-6 pt-2">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/categories')} fullWidth>
                카테고리 관리
              </Button>
              <Button onClick={() => setShowForm(true)} fullWidth>
                + 업무 추가
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="새 업무">
        <TaskForm
          categories={categories}
          onSubmit={async (data) => {
            await createTask(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
