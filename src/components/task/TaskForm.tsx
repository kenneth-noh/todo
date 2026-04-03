import { useState } from 'react'
import type { Category } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  categories: Category[]
  onSubmit: (data: {
    category_id: number | null
    sub_category_id: number | null
    name: string
    due_date: string | null
  }) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ categories, onSubmit, onCancel }: Props) {
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedCat = categories.find((c) => c.id === selectedCatId)

  const handleCatClick = (id: number) => {
    if (selectedCatId === id) {
      setSelectedCatId(null)
      setSelectedSubId(null)
    } else {
      setSelectedCatId(id)
      setSelectedSubId(null)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        category_id: selectedCatId,
        sub_category_id: selectedSubId,
        name: name.trim(),
        due_date: dueDate || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">카테고리</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCatClick(cat.id)}
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
        placeholder="업무명을 입력하세요"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />

      <Input
        label="완료예정일"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" fullWidth onClick={onCancel}>취소</Button>
        <Button fullWidth onClick={handleSubmit} disabled={!name.trim() || loading}>
          {loading ? '저장 중...' : '생성'}
        </Button>
      </div>
    </div>
  )
}
