import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export interface Env {
  DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

type UserInfo = {
  id: number
  email: string
  name: string | null
  avatar: string | null
}

type Variables = {
  userId: number
  user: UserInfo
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>().basePath('/api')

app.use('*', cors())

// ─── Auth Middleware ──────────────────────────────────────────────────────────

async function authMiddleware(
  c: Parameters<Parameters<typeof app.use>[1]>[0],
  next: () => Promise<void>
) {
  const sessionId = getCookie(c, 'session')
  if (!sessionId) return c.json({ error: 'Unauthorized' }, 401)

  const session = await c.env.DB.prepare(`
    SELECT s.user_id, u.email, u.name, u.avatar
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `)
    .bind(sessionId)
    .first<{ user_id: number; email: string; name: string | null; avatar: string | null }>()

  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  c.set('userId', session.user_id)
  c.set('user', { id: session.user_id, email: session.email, name: session.name, avatar: session.avatar })
  await next()
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.get('/auth/google', (c) => {
  const state = crypto.randomUUID()
  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}/api/auth/callback`
  const isSecure = origin.startsWith('https')

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
  })

  setCookie(c, 'oauth_state', state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    maxAge: 600,
    path: '/',
  })

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

app.get('/auth/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const storedState = getCookie(c, 'oauth_state')

  if (!code || !state || state !== storedState) {
    return c.redirect('/?error=auth_failed')
  }

  const origin = new URL(c.req.url).origin
  const redirectUri = `${origin}/api/auth/callback`
  const isSecure = origin.startsWith('https')

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json<{ access_token: string }>()
  if (!tokens.access_token) return c.redirect('/?error=token_failed')

  // Get Google user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const googleUser = await userRes.json<{
    id: string
    email: string
    name: string
    picture: string
  }>()

  // Upsert user
  const user = await c.env.DB.prepare(`
    INSERT INTO users (google_id, email, name, avatar)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(google_id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      avatar = excluded.avatar
    RETURNING id
  `)
    .bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture)
    .first<{ id: number }>()

  if (!user) return c.redirect('/?error=user_failed')

  // Create session (7 days)
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, user.id, expiresAt)
    .run()

  // Set cookies
  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    maxAge: 604800,
    path: '/',
  })
  deleteCookie(c, 'oauth_state', { path: '/' })

  return c.redirect('/')
})

app.get('/auth/me', authMiddleware, (c) => {
  return c.json(c.get('user'))
})

app.post('/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'session')
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  }
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ ok: true })
})

// ─── Categories ──────────────────────────────────────────────────────────────

app.get('/categories', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const { results: cats } = await c.env.DB.prepare(
    'SELECT * FROM categories WHERE user_id = ? ORDER BY position, id'
  )
    .bind(userId)
    .all()

  const { results: subs } = await c.env.DB.prepare(`
    SELECT s.* FROM sub_categories s
    JOIN categories c ON c.id = s.category_id
    WHERE c.user_id = ?
    ORDER BY s.position, s.id
  `)
    .bind(userId)
    .all()

  const categoryMap = cats.map((cat) => ({
    ...cat,
    sub_categories: subs.filter((s) => s.category_id === cat.id),
  }))

  return c.json(categoryMap)
})

app.post('/categories', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ names: string[] }>()
  if (!body.names?.length) return c.json({ error: 'names required' }, 400)

  const created = []
  for (const name of body.names) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const result = await c.env.DB.prepare(
      'INSERT INTO categories (name, user_id) VALUES (?, ?) RETURNING *'
    )
      .bind(trimmed, userId)
      .first()
    if (result) created.push(result)
  }
  return c.json(created, 201)
})

app.delete('/categories/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()
  return c.json({ ok: true })
})

// ─── Sub-categories ───────────────────────────────────────────────────────────

app.get('/categories/:id/subs', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  const { results } = await c.env.DB.prepare(`
    SELECT s.* FROM sub_categories s
    JOIN categories c ON c.id = s.category_id
    WHERE s.category_id = ? AND c.user_id = ?
    ORDER BY s.position, s.id
  `)
    .bind(id, userId)
    .all()
  return c.json(results)
})

app.post('/categories/:id/subs', authMiddleware, async (c) => {
  const categoryId = Number(c.req.param('id'))
  const userId = c.get('userId')
  const body = await c.req.json<{ names: string[] }>()
  if (!body.names?.length) return c.json({ error: 'names required' }, 400)

  // Verify category belongs to user
  const cat = await c.env.DB.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .bind(categoryId, userId)
    .first()
  if (!cat) return c.json({ error: 'Not found' }, 404)

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

app.delete('/sub-categories/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  await c.env.DB.prepare(`
    DELETE FROM sub_categories WHERE id = ?
    AND category_id IN (SELECT id FROM categories WHERE user_id = ?)
  `)
    .bind(id, userId)
    .run()
  return c.json({ ok: true })
})

// ─── Tasks ────────────────────────────────────────────────────────────────────

app.get('/tasks', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const categoryId = c.req.query('category_id')
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = 10
  const offset = (page - 1) * limit

  let where = 'WHERE t.user_id = ? AND t.is_completed = 0'
  const params: (string | number)[] = [userId]

  if (categoryId) {
    where += ' AND t.category_id = ?'
    params.push(Number(categoryId))
  }

  const row = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM tasks t ${where}`)
    .bind(...params)
    .first<{ cnt: number }>()
  const total = row?.cnt ?? 0

  const { results } = await c.env.DB.prepare(`
    SELECT t.*,
           c.name as category_name,
           s.name as sub_category_name
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN sub_categories s ON s.id = t.sub_category_id
    ${where}
    ORDER BY t.due_date ASC NULLS LAST, t.id DESC
    LIMIT ? OFFSET ?
  `)
    .bind(...params, limit, offset)
    .all()

  return c.json({ tasks: results, total, page, pages: Math.ceil(total / limit) })
})

app.get('/tasks/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  const result = await c.env.DB.prepare(`
    SELECT t.*,
           c.name as category_name,
           s.name as sub_category_name
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN sub_categories s ON s.id = t.sub_category_id
    WHERE t.id = ? AND t.user_id = ?
  `)
    .bind(id, userId)
    .first()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result)
})

app.post('/tasks', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    category_id: number | null
    sub_category_id: number | null
    name: string
    due_date: string | null
  }>()
  if (!body.name?.trim()) return c.json({ error: 'name required' }, 400)

  const result = await c.env.DB.prepare(`
    INSERT INTO tasks (category_id, sub_category_id, name, due_date, user_id)
    VALUES (?, ?, ?, ?, ?) RETURNING *
  `)
    .bind(body.category_id ?? null, body.sub_category_id ?? null, body.name.trim(), body.due_date ?? null, userId)
    .first()

  return c.json(result, 201)
})

app.put('/tasks/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  const body = await c.req.json<{
    category_id?: number | null
    sub_category_id?: number | null
    name?: string
    due_date?: string | null
  }>()

  const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<{
      category_id: number | null
      sub_category_id: number | null
      name: string
      due_date: string | null
    }>()

  if (!task) return c.json({ error: 'Not found' }, 404)

  const updated = await c.env.DB.prepare(`
    UPDATE tasks SET
      category_id = ?,
      sub_category_id = ?,
      name = ?,
      due_date = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ? RETURNING *
  `)
    .bind(
      body.category_id !== undefined ? body.category_id : task.category_id,
      body.sub_category_id !== undefined ? body.sub_category_id : task.sub_category_id,
      body.name ?? task.name,
      body.due_date !== undefined ? body.due_date : task.due_date,
      id,
      userId
    )
    .first()

  return c.json(updated)
})

app.patch('/tasks/:id/complete', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  const task = await c.env.DB.prepare('SELECT is_completed FROM tasks WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<{ is_completed: number }>()
  if (!task) return c.json({ error: 'Not found' }, 404)

  const updated = await c.env.DB.prepare(`
    UPDATE tasks SET is_completed = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ? RETURNING *
  `)
    .bind(task.is_completed ? 0 : 1, id, userId)
    .first()

  return c.json(updated)
})

app.delete('/tasks/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return c.json({ ok: true })
})

// ─── Memos ────────────────────────────────────────────────────────────────────

app.get('/tasks/:id/memos', authMiddleware, async (c) => {
  const taskId = Number(c.req.param('id'))
  const userId = c.get('userId')
  const { results } = await c.env.DB.prepare(`
    SELECT m.* FROM memos m
    JOIN tasks t ON t.id = m.task_id
    WHERE m.task_id = ? AND t.user_id = ?
    ORDER BY m.created_at ASC
  `)
    .bind(taskId, userId)
    .all()
  return c.json(results)
})

app.post('/tasks/:id/memos', authMiddleware, async (c) => {
  const taskId = Number(c.req.param('id'))
  const userId = c.get('userId')
  const body = await c.req.json<{ name: string; content: string }>()
  if (!body.name?.trim()) return c.json({ error: 'name required' }, 400)

  // Verify task belongs to user
  const task = await c.env.DB.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
    .bind(taskId, userId)
    .first()
  if (!task) return c.json({ error: 'Not found' }, 404)

  const result = await c.env.DB.prepare(
    'INSERT INTO memos (task_id, name, content) VALUES (?, ?, ?) RETURNING *'
  )
    .bind(taskId, body.name.trim(), body.content ?? '')
    .first()

  return c.json(result, 201)
})

app.delete('/memos/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  const userId = c.get('userId')
  await c.env.DB.prepare(`
    DELETE FROM memos WHERE id = ?
    AND task_id IN (SELECT id FROM tasks WHERE user_id = ?)
  `)
    .bind(id, userId)
    .run()
  return c.json({ ok: true })
})

// ─── Search ───────────────────────────────────────────────────────────────────

app.get('/search', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const name = c.req.query('name') ?? ''
  const period = c.req.query('period') ?? ''
  const categoryId = c.req.query('category_id')

  const conditions: string[] = ['t.user_id = ?']
  const params: (string | number)[] = [userId]

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

  const where = `WHERE ${conditions.join(' AND ')}`

  const { results } = await c.env.DB.prepare(`
    SELECT t.*,
           c.name as category_name,
           s.name as sub_category_name
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN sub_categories s ON s.id = t.sub_category_id
    ${where}
    ORDER BY t.due_date ASC NULLS LAST, t.id DESC
    LIMIT 100
  `)
    .bind(...params)
    .all()
  return c.json(results)
})

export const onRequest = handle(app)
