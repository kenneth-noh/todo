import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainPage } from '@/pages/MainPage'
import { CategoryManagePage } from '@/pages/CategoryManagePage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { SearchPage } from '@/pages/SearchPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/categories" element={<CategoryManagePage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </BrowserRouter>
  )
}
