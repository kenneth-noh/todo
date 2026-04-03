import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'

export interface Env {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>().basePath('/api')

app.use('*', cors())

// ─── Categories ──────────────────────────────────────────────────────────────

app.get('/categories', async (c) => {
  const { results: cats } = await c.env.DB.prepare(
    'SELECT * FROM categories ORDER BY position, id'
  ).all()

  const { results: subs } = await c.env.DB.prepare(
    'SELECT * FROM sub_categories ORDER BY position, id'
  ).all()

  const categoryMap = cats.map((cat) => ({
    ...cat,
    sub_categories: subs.filter((s) => s.category_id === cat.id),
  }))

  return c.json(categoryMap)
})

app.post('/categories', async (c) => {
  const body = await c.req.json<{ names: string[] }>()
  if (!body.names?.length) return c.json({ error: 'names required' }, 400)

  const created = []
  for (const name of body.names) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const result = await c.env.DB.prepare(
      'INSERT INTO categories (name) VALUES (?) RETURNING *'
    )
      .bind(trimmed)
      .first()
    if (result) created.push(result)
  }
  return c.json(created, 201)
})

app.delete('/categories/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ─── Sub-categories ───────────────────────────────────────────────────────────

app.get('/categories/:id/subs', async (c) => {
  const id = Number(c.req.param('id'))
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM sub_categories WHERE category_id = ? ORDER BY position, id'
  )
    .bind(id)
    .all()
  return c.json(results)
})

app.post('/categories/:id/subs', async (c) => {
  const categoryId = Number(c.req.param('id'))
  const body = await c.req.json<{ names: string[] }>()
  if (!body.names?.length) return c.json({ error: 'names required' }, 400)

  const created = []
  for (const name of body.names) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const result = await c.env.DB.prepare(
      'INSERT INTO sub_categories (category_id, name) VALUES (?, ?) RETURNING *'
    )
      .bind(categoryId, trimmed)
      .first()
    if (result) created.push(result)
  }
  return c.json(created, 201)
})

app.delete('/sub-categories/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM sub_categories WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ─── Tasks ────────────────────────────────────────────────────────────────────

app.get('/tasks', async (c) => {
  const categoryId = c.req.query('category_id')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = 10
  const offset = (page - 1) * limit

  let where = 'WHERE t.is_completed = 0'
  const params: (string | number)[] = []

  if (categoryId) {
    where += ' AND t.category_id = ?'
    params.push(Number(categoryId))
  }

  const countSql = `
    SELECT COUNT(*) as cnt FROM tasks t ${where}
  `
  const row = await c.env.DB.prepare(countSql).bind(...params).first<{ cnt: number }>()
  const total = row?.cnt ?? 0

  const sql = `
    SELECT t.*,
           c.name as category_name,
           s.name as sub_category_name
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN sub_categories s ON s.id = t.sub_category_id
    ${where}
    ORDER BY t.due_date ASC NULLS LAST, t.id DESC
    LIMIT ? OFFSET ?
  `
  const { results } = await c.env.DB.prepare(sql)
    .bind(...params, limit, offset)
    .all()

  return c.json({ tasks: results, total, page, pages: Math.ceil(total / limit) })
})

app.get('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const sql = `
    SELECT t.*,
           c.name as category_name,
           s.name as sub_category_name
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN sub_categories s ON s.id = t.sub_category_id
    WHERE t.id = ?
  `
  const result = await c.env.DB.prepare(sql).bind(id).first()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result)
})

app.post('/tasks', async (c) => {
  const body = await c.req.json<{
    category_id: number | null
    sub_category_id: number | null
    name: string
    due_date: string | null
  }>()
  if (!body.name?.trim()) return c.json({ error: 'name required' }, 400)

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks (category_id, sub_category_id, name, due_date)
     VALUES (?, ?, ?, ?) RETURNING *`
  )
    .bind(body.category_id ?? null, body.sub_category_id ?? null, body.name.trim(), body.due_date ?? null)
    .first()

  return c.json(result, 201)
})

app.put('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{
    category_id?: number | null
    sub_category_id?: number | null
    name?: string
    due_date?: string | null
  }>()

  const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first<{
    category_id: number | null
    sub_category_id: number | null
    name: string
    due_date: string | null
  }>()

  if (!task) return c.json({ error: 'Not found' }, 404)

  const updated = await c.env.DB.prepare(
    `UPDATE tasks SET
       category_id = ?,
       sub_category_id = ?,
       name = ?,
       due_date = ?,
       updated_at = datetime('now')
     WHERE id = ? RETURNING *`
  )
    .bind(
      body.category_id !== undefined ? body.category_id : task.category_id,
      body.sub_category_id !== undefined ? body.sub_category_id : task.sub_category_id,
      body.name ?? task.name,
      body.due_date !== undefined ? body.due_date : task.due_date,
      id
    )
    .first()

  return c.json(updated)
})

app.patch('/tasks/:id/complete', async (c) => {
  const id = Number(c.req.param('id'))
  const task = await c.env.DB.prepare('SELECT is_completed FROM tasks WHERE id = ?')
    .bind(id)
    .first<{ is_completed: number }>()
  if (!task) return c.json({ error: 'Not found' }, 404)

  const updated = await c.env.DB.prepare(
    `UPDATE tasks SET is_completed = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`
  )
    .bind(task.is_completed ? 0 : 1, id)
    .first()

  return c.json(updated)
})

app.delete('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ─── Memos ────────────────────────────────────────────────────────────────────

app.get('/tasks/:id/memos', async (c) => {
  const taskId = Number(c.req.param('id'))
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM memos WHERE task_id = ? ORDER BY created_at ASC'
  )
    .bind(taskId)
    .all()
  return c.json(results)
})

app.post('/tasks/:id/memos', async (c) => {
  const taskId = Number(c.req.param('id'))
  const body = await c.req.json<{ name: string; content: string }>()
  if (!body.name?.trim()) return c.json({ error: 'name required' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO memos (task_id, name, content) VALUES (?, ?, ?) RETURNING *'
  )
    .bind(taskId, body.name.trim(), body.content ?? '')
    .first()

  return c.json(result, 201)
})

app.delete('/memos/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM memos WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ─── Search ───────────────────────────────────────────────────────────────────

app.get('/search', async (c) => {
  const name = c.req.query('name') ?? ''
  const period = c.req.query('period') ?? ''
  const categoryId = c.req.query('category_id')

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (name.trim()) {
    conditions.push('t.name LIKE ?')
    params.push(`%${name.trim()}%`)
  }

  if (period) {
    const today = new Date().toISOString().slice(0, 10)
    const dayOfWeek = new Date().getDay()
    const monday = new Date()
    monday.setDate(monday.getDate() - ((dayOfWeek + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    if (period === 'today') {
      conditions.push('t.due_date = ?')
      params.push(today)
    } else if (period === 'this_week') {
      conditions.push('t.due_date BETWEEN ? AND ?')
      params.push(monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10))
    } else if (period === 'next_week') {
      const nextMon = new Date(monday)
      nextMon.setDate(monday.getDate() + 7)
      const nextSun = new Date(nextMon)
      nextSun.setDate(nextMon.getDate() + 6)
      conditions.push('t.due_date BETWEEN ? AND ?')
      params.push(nextMon.toISOString().slice(0, 10), nextSun.toISOString().slice(0, 10))
    } else if (period === 'this_month') {
      const firstDay = today.slice(0, 7) + '-01'
      const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10)
      conditions.push('t.due_date BETWEEN ? AND ?')
      params.push(firstDay, lastDay)
    }
  }

  if (categoryId) {
    conditions.push('t.category_id = ?')
    params.push(Number(categoryId))
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const sql = `
    SELECT t.*,
           c.name as category_name,
           s.name as sub_category_name
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN sub_categories s ON s.id = t.sub_category_id
    ${where}
    ORDER BY t.due_date ASC NULLS LAST, t.id DESC
    LIMIT 100
  `
  const { results } = await c.env.DB.prepare(sql).bind(...params).all()
  return c.json(results)
})

export const onRequest = handle(app)
