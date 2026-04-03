import { useState } from 'react'
import { useCategories } from '@/hooks/useCategories'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function CategoryManagePage() {
  const { categories, loading, createCategories, createSubCategories, deleteCategory, deleteSubCategory } =
    useCategories()

  const [newCatInputs, setNewCatInputs] = useState<string[]>([''])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [subInputs, setSubInputs] = useState<Record<number, string[]>>({})
  const [saving, setSaving] = useState(false)

  const handleAddCatRow = () => setNewCatInputs((prev) => [...prev, ''])
  const handleCatInputChange = (i: number, val: string) =>
    setNewCatInputs((prev) => prev.map((v, idx) => (idx === i ? val : v)))
  const handleRemoveCatRow = (i: number) =>
    setNewCatInputs((prev) => prev.filter((_, idx) => idx !== i))

  const handleSaveCategories = async () => {
    const names = newCatInputs.filter((n) => n.trim())
    if (!names.length) return
    setSaving(true)
    try {
      await createCategories(names)
      setNewCatInputs([''])
    } finally {
      setSaving(false)
    }
  }

  const handleToggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
    if (!subInputs[id]) setSubInputs((prev) => ({ ...prev, [id]: [''] }))
  }

  const handleSubInputChange = (catId: number, i: number, val: string) =>
    setSubInputs((prev) => ({
      ...prev,
      [catId]: (prev[catId] ?? ['']).map((v, idx) => (idx === i ? val : v)),
    }))

  const handleAddSubRow = (catId: number) =>
    setSubInputs((prev) => ({ ...prev, [catId]: [...(prev[catId] ?? ['']), ''] }))

  const handleSaveSubs = async (catId: number) => {
    const names = (subInputs[catId] ?? []).filter((n) => n.trim())
    if (!names.length) return
    setSaving(true)
    try {
      await createSubCategories(catId, names)
      setSubInputs((prev) => ({ ...prev, [catId]: [''] }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-svh">
      <AppHeader title="카테고리 관리" showBack />

      <div className="flex-1 px-4 py-5 flex flex-col gap-6">
        {/* New categories */}
        <section className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-800">카테고리 추가</h2>
          {newCatInputs.map((val, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder={`카테고리명 ${i + 1}`}
                value={val}
                onChange={(e) => handleCatInputChange(i, e.target.value)}
                className="flex-1"
              />
              {newCatInputs.length > 1 && (
                <button
                  onClick={() => handleRemoveCatRow(i)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleAddCatRow}>
              + 행 추가
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCategories}
              disabled={saving || !newCatInputs.some((n) => n.trim())}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </section>

        {/* Existing categories */}
        {!loading && categories.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-800 px-1">카테고리 목록</h2>
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center px-4 py-3 gap-2">
                  <button
                    onClick={() => handleToggleExpand(cat.id)}
                    className="flex-1 flex items-center gap-2 text-left"
                  >
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    {cat.sub_categories && cat.sub_categories.length > 0 && (
                      <span className="text-xs text-gray-400">{cat.sub_categories.length}개 하위</span>
                    )}
                    <span className="ml-auto text-gray-400 text-xs">
                      {expandedId === cat.id ? '▲' : '▼'}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                  >
                    삭제
                  </button>
                </div>

                {expandedId === cat.id && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-col gap-3">
                    {cat.sub_categories && cat.sub_categories.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {cat.sub_categories.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                            <span className="text-sm text-gray-600 flex-1">{sub.name}</span>
                            <button
                              onClick={() => deleteSubCategory(sub.id)}
                              className="text-xs text-gray-400 hover:text-red-500"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {(subInputs[cat.id] ?? ['']).map((val, i) => (
                        <Input
                          key={i}
                          placeholder={`하위 카테고리명 ${i + 1}`}
                          value={val}
                          onChange={(e) => handleSubInputChange(cat.id, i, e.target.value)}
                        />
                      ))}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleAddSubRow(cat.id)}>
                          + 행 추가
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveSubs(cat.id)}
                          disabled={saving || !(subInputs[cat.id] ?? []).some((n) => n.trim())}
                        >
                          저장
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
