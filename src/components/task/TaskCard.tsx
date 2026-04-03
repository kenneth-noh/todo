import { useNavigate } from 'react-router-dom'
import type { Task } from '@/types'
import { formatDate, isOverdue, isDueToday } from '@/utils/dateUtils'

interface Props {
  task: Task
  onToggle: (id: number) => void
}

export function TaskCard({ task, onToggle }: Props) {
  const navigate = useNavigate()
  const overdue = !task.is_completed && isOverdue(task.due_date)
  const today = !task.is_completed && isDueToday(task.due_date)

  return (
    <div
      className={`
        bg-white rounded-2xl border p-4 flex items-start gap-3
        ${task.is_completed ? 'opacity-50 border-gray-100' : 'border-gray-200'}
      `}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={`
          mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
          ${task.is_completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-blue-400'
          }
        `}
      >
        {task.is_completed && <span className="text-xs leading-none">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.name}
        </p>
        {(task.category_name || task.sub_category_name) && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {task.category_name}
            {task.sub_category_name && ` › ${task.sub_category_name}`}
          </p>
        )}
        {task.due_date && (
          <p className={`text-xs mt-1 font-medium
            ${overdue ? 'text-red-500' : today ? 'text-orange-500' : 'text-gray-400'}
          `}>
            {overdue ? '⚠ ' : ''}
            {formatDate(task.due_date)}
            {today && ' (오늘)'}
          </p>
        )}
      </div>

      <button
        onClick={() => navigate(`/tasks/${task.id}`)}
        className="shrink-0 w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 text-xs"
      >
        ✎
      </button>
    </div>
  )
}
