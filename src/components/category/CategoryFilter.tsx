import type { Category } from '@/types'

interface Props {
  categories: Category[]
  selected: number | null
  onChange: (id: number | null) => void
}

export function CategoryFilter({ categories, selected, onChange }: Props) {
  const items = [{ id: null, name: '전체' }, ...categories.map((c) => ({ id: c.id, name: c.name }))]

  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-b border-gray-100 bg-white">
      {items.map((item) => {
        const active = selected === item.id
        return (
          <button
            key={item.id ?? 'all'}
            onClick={() => onChange(item.id)}
            className={`
              shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {item.name}
          </button>
        )
      })}
    </div>
  )
}
