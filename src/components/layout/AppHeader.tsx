import { useNavigate } from 'react-router-dom'

interface Props {
  title?: string
  showSearch?: boolean
  showBack?: boolean
  rightSlot?: React.ReactNode
}

export function AppHeader({
  title = 'hoya TODO',
  showSearch = false,
  showBack = false,
  rightSlot,
}: Props) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 shrink-0"
        >
          ←
        </button>
      )}
      <h1 className="flex-1 text-lg font-bold text-gray-900 truncate">{title}</h1>
      {showSearch && (
        <button
          onClick={() => navigate('/search')}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
        >
          🔍
        </button>
      )}
      {rightSlot}
    </header>
  )
}
