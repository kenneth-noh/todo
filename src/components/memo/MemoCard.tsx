import type { Memo } from '@/types'
import { formatDateTime } from '@/utils/dateUtils'

interface Props {
  memo: Memo
  onDelete?: (id: number) => void
}

export function MemoCard({ memo, onDelete }: Props) {
  return (
    <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">{memo.name}</p>
        {onDelete && (
          <button
            onClick={() => onDelete(memo.id)}
            className="shrink-0 text-xs text-gray-400 hover:text-red-500"
          >
            ✕
          </button>
        )}
      </div>
      {memo.content && (
        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{memo.content}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">{formatDateTime(memo.created_at)}</p>
    </div>
  )
}
