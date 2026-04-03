export interface Category {
  id: number
  name: string
  position: number
  created_at: string
  sub_categories?: SubCategory[]
}

export interface SubCategory {
  id: number
  category_id: number
  name: string
  position: number
  created_at: string
}

export interface Task {
  id: number
  category_id: number | null
  sub_category_id: number | null
  name: string
  due_date: string | null
  is_completed: number
  created_at: string
  updated_at: string
  category_name?: string
  sub_category_name?: string
}

export interface Memo {
  id: number
  task_id: number
  name: string
  content: string
  created_at: string
}

export type PeriodFilter = 'today' | 'this_week' | 'next_week' | 'this_month' | ''
