import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { MainPage } from '@/pages/MainPage'
import { CategoryManagePage } from '@/pages/CategoryManagePage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { SearchPage } from '@/pages/SearchPage'
import { LoginPage } from '@/pages/LoginPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh text-gray-400 text-sm">
        <span className="text-2xl animate-pulse">📋</span>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/categories" element={<CategoryManagePage />} />
      <Route path="/tasks/:id" element={<TaskDetailPage />} />
      <Route path="/search" element={<SearchPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
