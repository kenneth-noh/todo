import type { PeriodFilter } from '@/types'

const PERIODS: { label: string; value: PeriodFilter }[] = [
  { label: '오늘', value: 'today' },
  { label: '이번주', value: 'this_week' },
  { label: '다음주', value: 'next_week' },
  { label: '이번달', value: 'this_month' },
]

interface Props {
  value: PeriodFilter
  onChange: (v: PeriodFilter) => void
}

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(value === p.value ? '' : p.value)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-colors
            ${value === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
