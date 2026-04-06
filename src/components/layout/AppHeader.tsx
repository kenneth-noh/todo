import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

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
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠어요?')) {
      await logout()
    }
  }

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

      {user && (
        <button onClick={handleLogout} className="shrink-0 flex items-center" title="로그아웃">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name ?? user.email}
              className="w-8 h-8 rounded-full border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      )}
    </header>
  )
}
