import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props {
  onSubmit: (name: string, content: string) => Promise<void>
  onCancel: () => void
}

export function MemoForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSubmit(name.trim(), content.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 flex flex-col gap-3">
      <Input
        label="메모명 *"
        placeholder="메모 제목"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">내용</label>
        <textarea
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 transition-colors resize-none"
          placeholder="메모 내용을 입력하세요 (선택)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>취소</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || loading}>
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
